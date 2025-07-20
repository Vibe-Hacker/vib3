// Backend implementation for VIB3 video thumbnail generation
// This file should be integrated into your Node.js backend

const ffmpeg = require('fluent-ffmpeg');
const AWS = require('aws-sdk');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

// Configure DigitalOcean Spaces (S3-compatible)
const spacesEndpoint = new AWS.Endpoint('nyc3.digitaloceanspaces.com');
const s3 = new AWS.S3({
  endpoint: spacesEndpoint,
  accessKeyId: process.env.DO_SPACES_KEY,
  secretAccessKey: process.env.DO_SPACES_SECRET
});

const BUCKET_NAME = 'vib3-videos';

/**
 * Video upload handler with thumbnail generation
 */
async function handleVideoUpload(req, res) {
  try {
    const { video, thumbnail } = req.files;
    const { description, privacy, allowComments, allowDuet, allowStitch, hashtags, musicName } = req.body;
    
    // Generate unique IDs
    const videoId = generateUniqueId();
    const timestamp = Date.now();
    
    // Upload video to DigitalOcean Spaces
    const videoKey = `videos/${timestamp}-${videoId}.mp4`;
    const videoUrl = await uploadToSpaces(video.buffer, videoKey, 'video/mp4');
    
    let thumbnailUrl;
    
    if (thumbnail) {
      // Use client-provided thumbnail
      const thumbnailKey = `thumbnails/${timestamp}-${videoId}.jpg`;
      thumbnailUrl = await uploadToSpaces(thumbnail.buffer, thumbnailKey, 'image/jpeg');
    } else {
      // Generate thumbnail server-side
      thumbnailUrl = await generateVideoThumbnail(videoUrl, videoId);
    }
    
    // Save video metadata to database
    const videoData = {
      _id: videoId,
      userId: req.user.id,
      videoUrl,
      thumbnailUrl,
      description,
      privacy,
      allowComments,
      allowDuet,
      allowStitch,
      hashtags: hashtags ? hashtags.split(' ') : [],
      musicName,
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await saveVideoToDatabase(videoData);
    
    res.status(201).json({
      success: true,
      video: videoData
    });
    
  } catch (error) {
    console.error('Video upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload video'
    });
  }
}

/**
 * Generate thumbnail from video using FFmpeg
 */
async function generateVideoThumbnail(videoUrl, videoId) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'vib3-thumb-'));
  const tempVideoPath = path.join(tempDir, `${videoId}.mp4`);
  const tempThumbPath = path.join(tempDir, `${videoId}.jpg`);
  
  try {
    // Download video temporarily
    await downloadFromUrl(videoUrl, tempVideoPath);
    
    // Generate thumbnail at multiple timestamps
    const thumbnails = await generateMultipleThumbnails(tempVideoPath, tempDir, videoId);
    
    // Select best thumbnail (not black, good contrast)
    const bestThumb = await selectBestThumbnail(thumbnails);
    
    // Upload to Spaces
    const thumbnailKey = `thumbnails/${Date.now()}-${videoId}.jpg`;
    const thumbnailBuffer = await fs.readFile(bestThumb);
    const thumbnailUrl = await uploadToSpaces(thumbnailBuffer, thumbnailKey, 'image/jpeg');
    
    return thumbnailUrl;
    
  } finally {
    // Cleanup temp files
    await fs.rmdir(tempDir, { recursive: true });
  }
}

/**
 * Generate multiple thumbnails at different timestamps
 */
function generateMultipleThumbnails(videoPath, outputDir, videoId) {
  return new Promise((resolve, reject) => {
    const thumbnails = [];
    const timestamps = ['00:00:01', '00:00:02', '00:00:03'];
    let completed = 0;
    
    timestamps.forEach((timestamp, index) => {
      const outputPath = path.join(outputDir, `${videoId}_${index}.jpg`);
      
      ffmpeg(videoPath)
        .seekInput(timestamp)
        .frames(1)
        .size('720x1280')
        .autopad()
        .output(outputPath)
        .on('end', () => {
          thumbnails.push(outputPath);
          completed++;
          if (completed === timestamps.length) {
            resolve(thumbnails);
          }
        })
        .on('error', (err) => {
          console.error(`Thumbnail generation failed at ${timestamp}:`, err);
          completed++;
          if (completed === timestamps.length) {
            resolve(thumbnails);
          }
        })
        .run();
    });
  });
}

/**
 * Select best thumbnail (avoid black frames)
 */
async function selectBestThumbnail(thumbnails) {
  // For now, return the second thumbnail (usually best)
  // In production, analyze image brightness/contrast
  if (thumbnails.length >= 2) {
    return thumbnails[1];
  }
  return thumbnails[0] || null;
}

/**
 * Upload file to DigitalOcean Spaces
 */
async function uploadToSpaces(buffer, key, contentType) {
  const params = {
    Bucket: BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    ACL: 'public-read'
  };
  
  const result = await s3.upload(params).promise();
  return result.Location;
}

/**
 * Download file from URL
 */
async function downloadFromUrl(url, destPath) {
  const https = require('https');
  const file = await fs.open(destPath, 'w');
  
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      response.pipe(file.createWriteStream());
      response.on('end', () => {
        file.close();
        resolve();
      });
    }).on('error', reject);
  });
}

/**
 * Process existing videos without thumbnails
 */
async function processExistingVideos() {
  const videos = await getVideosWithoutThumbnails();
  
  console.log(`Found ${videos.length} videos without thumbnails`);
  
  for (const video of videos) {
    try {
      console.log(`Processing video ${video._id}...`);
      const thumbnailUrl = await generateVideoThumbnail(video.videoUrl, video._id);
      
      await updateVideoThumbnail(video._id, thumbnailUrl);
      console.log(`✓ Generated thumbnail for ${video._id}`);
      
    } catch (error) {
      console.error(`✗ Failed to generate thumbnail for ${video._id}:`, error);
    }
  }
}

/**
 * Video transcoding for compatibility
 */
async function transcodeVideoIfNeeded(videoPath) {
  return new Promise((resolve, reject) => {
    const outputPath = videoPath.replace('.mp4', '_transcoded.mp4');
    
    ffmpeg(videoPath)
      .videoCodec('libx264')
      .audioCodec('aac')
      .outputOptions([
        '-profile:v baseline',  // Maximum compatibility
        '-level 3.0',
        '-pix_fmt yuv420p',
        '-movflags +faststart'  // Better streaming
      ])
      .output(outputPath)
      .on('end', () => resolve(outputPath))
      .on('error', reject)
      .run();
  });
}

/**
 * Generate unique ID
 */
function generateUniqueId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Express middleware for handling multipart uploads
 */
const multer = require('multer');
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  }
});

// Express routes
module.exports = function(app) {
  // Video upload endpoint
  app.post('/api/videos/upload',
    authenticateUser,
    upload.fields([
      { name: 'video', maxCount: 1 },
      { name: 'thumbnail', maxCount: 1 }
    ]),
    handleVideoUpload
  );
  
  // Batch process existing videos
  app.post('/api/admin/process-thumbnails',
    authenticateAdmin,
    async (req, res) => {
      processExistingVideos();
      res.json({ message: 'Processing started in background' });
    }
  );
};

// Database helper functions (implement based on your DB)
async function saveVideoToDatabase(videoData) {
  // MongoDB example:
  // return await Video.create(videoData);
}

async function getVideosWithoutThumbnails() {
  // MongoDB example:
  // return await Video.find({ 
  //   $or: [
  //     { thumbnailUrl: null },
  //     { thumbnailUrl: { $exists: false } }
  //   ]
  // });
}

async function updateVideoThumbnail(videoId, thumbnailUrl) {
  // MongoDB example:
  // return await Video.updateOne(
  //   { _id: videoId },
  //   { $set: { thumbnailUrl } }
  // );
}

// Export functions for use in other modules
module.exports = {
  handleVideoUpload,
  generateVideoThumbnail,
  transcodeVideoIfNeeded,
  processExistingVideos
};