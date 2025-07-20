require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const ffmpeg = require('fluent-ffmpeg');
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const winston = require('winston');
const { getCacheManager } = require('@vib3/cache');
const { getMessageQueue } = require('@vib3/queue');

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'video-worker' },
  transports: [
    new winston.transports.File({ filename: 'worker-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'worker.log' }),
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});

// MongoDB connection
let db;
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/vib3';

// S3 configuration
const s3Client = new S3Client({
  endpoint: process.env.DO_SPACES_ENDPOINT || 'https://nyc3.digitaloceanspaces.com',
  region: process.env.DO_SPACES_REGION || 'nyc3',
  credentials: {
    accessKeyId: process.env.DO_SPACES_KEY,
    secretAccessKey: process.env.DO_SPACES_SECRET,
  },
});

const BUCKET_NAME = process.env.DO_SPACES_BUCKET || 'vib3-videos';
const CDN_URL = process.env.CDN_URL || `https://${BUCKET_NAME}.nyc3.cdn.digitaloceanspaces.com`;

// Cache and Queue managers
const cache = getCacheManager();
const queue = getMessageQueue();

// Video quality presets
const QUALITY_PRESETS = {
  '360p': { width: 640, height: 360, bitrate: '500k', audioBitrate: '96k' },
  '480p': { width: 854, height: 480, bitrate: '1000k', audioBitrate: '128k' },
  '720p': { width: 1280, height: 720, bitrate: '2500k', audioBitrate: '192k' },
  '1080p': { width: 1920, height: 1080, bitrate: '5000k', audioBitrate: '256k' },
};

// Connect to MongoDB
async function connectDB() {
  try {
    const client = new MongoClient(mongoUri);
    await client.connect();
    db = client.db('vib3');
    logger.info('Worker connected to MongoDB');
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    throw error;
  }
}

// Process video job
async function processVideo(job) {
  const { videoId, filePath, originalUrl } = job.data;
  const tempDir = path.join(os.tmpdir(), `video-${videoId}`);

  try {
    logger.info(`Processing video ${videoId}`);
    
    // Create temp directory
    await fs.mkdir(tempDir, { recursive: true });

    // Download original video
    const inputPath = path.join(tempDir, 'original.mp4');
    await downloadFile(originalUrl, inputPath);

    // Get video metadata
    const metadata = await getVideoMetadata(inputPath);
    
    // Generate thumbnail
    const thumbnailPath = path.join(tempDir, 'thumbnail.jpg');
    await generateThumbnail(inputPath, thumbnailPath);
    
    // Upload thumbnail
    const thumbnailKey = `thumbnails/${videoId}.jpg`;
    await uploadToS3(thumbnailPath, thumbnailKey, 'image/jpeg');
    const thumbnailUrl = `${CDN_URL}/${thumbnailKey}`;

    // Process different qualities
    const qualities = {};
    const processingPromises = [];

    // Determine which qualities to generate based on source resolution
    const sourceHeight = metadata.streams[0].height;
    const qualitiesToGenerate = Object.entries(QUALITY_PRESETS)
      .filter(([name, preset]) => preset.height <= sourceHeight);

    for (const [quality, preset] of qualitiesToGenerate) {
      const outputPath = path.join(tempDir, `${quality}.mp4`);
      processingPromises.push(
        encodeVideo(inputPath, outputPath, preset)
          .then(async () => {
            const key = `videos/${videoId}/${quality}.mp4`;
            await uploadToS3(outputPath, key, 'video/mp4');
            qualities[quality] = `${CDN_URL}/${key}`;
            logger.info(`Uploaded ${quality} version of video ${videoId}`);
          })
      );
    }

    // Wait for all qualities to be processed
    await Promise.all(processingPromises);

    // Generate HLS playlist for adaptive streaming
    const hlsDir = path.join(tempDir, 'hls');
    await fs.mkdir(hlsDir, { recursive: true });
    await generateHLS(inputPath, hlsDir);
    
    // Upload HLS files
    const hlsFiles = await fs.readdir(hlsDir);
    for (const file of hlsFiles) {
      const hlsPath = path.join(hlsDir, file);
      const hlsKey = `videos/${videoId}/hls/${file}`;
      const contentType = file.endsWith('.m3u8') ? 'application/x-mpegURL' : 'video/MP2T';
      await uploadToS3(hlsPath, hlsKey, contentType);
    }
    
    const hlsUrl = `${CDN_URL}/videos/${videoId}/hls/master.m3u8`;

    // Update video document
    await db.collection('videos').updateOne(
      { _id: new ObjectId(videoId) },
      {
        $set: {
          status: 'ready',
          duration: Math.round(metadata.format.duration),
          width: metadata.streams[0].width,
          height: metadata.streams[0].height,
          bitrate: metadata.format.bit_rate,
          codec: metadata.streams[0].codec_name,
          thumbnailUrl,
          hlsUrl,
          qualities,
          processedAt: new Date(),
          updatedAt: new Date(),
        },
      }
    );

    // Update cache
    await cache.invalidateVideo(videoId);

    // Send notification
    const video = await db.collection('videos').findOne({ _id: new ObjectId(videoId) });
    await queue.addNotificationJob({
      userId: video.userId,
      type: 'video_ready',
      title: 'Video Processing Complete',
      message: 'Your video is now ready to view!',
      data: { videoId },
    });

    logger.info(`Video ${videoId} processing complete`);

  } catch (error) {
    logger.error(`Error processing video ${videoId}:`, error);
    
    // Update video status to failed
    await db.collection('videos').updateOne(
      { _id: new ObjectId(videoId) },
      {
        $set: {
          status: 'failed',
          error: error.message,
          updatedAt: new Date(),
        },
      }
    );

    throw error;

  } finally {
    // Cleanup temp directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      logger.error('Error cleaning up temp directory:', error);
    }
  }
}

// Generate thumbnail
async function processThumbnail(job) {
  const { videoId, videoUrl } = job.data;
  const tempDir = path.join(os.tmpdir(), `thumb-${videoId}`);

  try {
    logger.info(`Generating thumbnail for video ${videoId}`);
    
    await fs.mkdir(tempDir, { recursive: true });
    
    const inputPath = path.join(tempDir, 'video.mp4');
    await downloadFile(videoUrl, inputPath);
    
    const thumbnailPath = path.join(tempDir, 'thumbnail.jpg');
    await generateThumbnail(inputPath, thumbnailPath);
    
    // Upload thumbnail
    const thumbnailKey = `thumbnails/${videoId}.jpg`;
    await uploadToS3(thumbnailPath, thumbnailKey, 'image/jpeg');
    const thumbnailUrl = `${CDN_URL}/${thumbnailKey}`;

    // Update video document
    await db.collection('videos').updateOne(
      { _id: new ObjectId(videoId) },
      {
        $set: {
          thumbnailUrl,
          updatedAt: new Date(),
        },
      }
    );

    logger.info(`Thumbnail generated for video ${videoId}`);

  } catch (error) {
    logger.error(`Error generating thumbnail for ${videoId}:`, error);
    throw error;
  } finally {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      logger.error('Error cleaning up temp directory:', error);
    }
  }
}

// Helper functions
async function downloadFile(url, outputPath) {
  const axios = require('axios');
  const writer = require('fs').createWriteStream(outputPath);

  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream',
  });

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

async function getVideoMetadata(inputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(inputPath, (err, metadata) => {
      if (err) reject(err);
      else resolve(metadata);
    });
  });
}

async function generateThumbnail(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .screenshots({
        timestamps: ['10%'], // Take screenshot at 10% of video duration
        filename: 'thumbnail.jpg',
        folder: path.dirname(outputPath),
        size: '1280x720',
      })
      .on('end', () => resolve())
      .on('error', (err) => reject(err));
  });
}

async function encodeVideo(inputPath, outputPath, preset) {
  return new Promise((resolve, reject) => {
    const command = ffmpeg(inputPath)
      .videoCodec('libx264')
      .audioCodec('aac')
      .size(`${preset.width}x${preset.height}`)
      .videoBitrate(preset.bitrate)
      .audioBitrate(preset.audioBitrate)
      .outputOptions([
        '-preset fast',
        '-movflags +faststart',
        '-pix_fmt yuv420p',
        '-profile:v baseline',
        '-level 3.0',
      ])
      .output(outputPath);

    command
      .on('progress', (progress) => {
        logger.debug(`Encoding progress: ${progress.percent}%`);
      })
      .on('end', () => {
        logger.info(`Encoding complete: ${outputPath}`);
        resolve();
      })
      .on('error', (err) => {
        logger.error(`Encoding error: ${err.message}`);
        reject(err);
      })
      .run();
  });
}

async function generateHLS(inputPath, outputDir) {
  return new Promise((resolve, reject) => {
    const masterPlaylist = path.join(outputDir, 'master.m3u8');
    
    ffmpeg(inputPath)
      .outputOptions([
        '-codec: copy',
        '-start_number 0',
        '-hls_time 10',
        '-hls_list_size 0',
        '-f hls',
        '-hls_segment_filename', path.join(outputDir, 'segment%03d.ts'),
        '-master_pl_name master.m3u8',
        '-var_stream_map', 'v:0,a:0',
      ])
      .output(path.join(outputDir, 'playlist.m3u8'))
      .on('end', () => {
        logger.info('HLS generation complete');
        resolve();
      })
      .on('error', (err) => {
        logger.error(`HLS generation error: ${err.message}`);
        reject(err);
      })
      .run();
  });
}

async function uploadToS3(filePath, key, contentType) {
  const fileContent = await fs.readFile(filePath);
  
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: fileContent,
    ContentType: contentType,
    ACL: 'public-read',
  });

  await s3Client.send(command);
}

// Initialize workers
async function startWorkers() {
  try {
    await connectDB();

    // Video processing worker
    queue.createWorker('video-processing', processVideo, 2); // 2 concurrent jobs
    logger.info('Video processing worker started');

    // Thumbnail generation worker
    queue.createWorker('thumbnail-generation', processThumbnail, 5); // 5 concurrent jobs
    logger.info('Thumbnail generation worker started');

    // Monitor queue health
    setInterval(async () => {
      const stats = await queue.getAllQueueStats();
      logger.info('Queue statistics:', stats);
    }, 60000); // Every minute

  } catch (error) {
    logger.error('Failed to start workers:', error);
    process.exit(1);
  }
}

// Graceful shutdown
async function gracefulShutdown() {
  logger.info('Shutting down workers...');
  
  try {
    await queue.shutdown();
    await cache.getRedis().disconnect();
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start workers
startWorkers();

logger.info('Video worker service started');