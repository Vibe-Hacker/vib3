# Backend Thumbnail Requirements for VIB3

## Problem
Some videos uploaded to VIB3 have codec issues that prevent thumbnail generation on mobile devices. This results in videos without thumbnails in the app, creating a poor user experience.

## Current Issues
1. Videos with certain codecs (HEVC/H.265, high-profile H.264) fail to generate thumbnails on mobile
2. No server-side thumbnail generation fallback
3. No thumbnail URL provided in video responses
4. Users see gradient placeholders instead of actual video content

## Required Backend Implementation

### 1. Server-Side Thumbnail Generation
When a video is uploaded, the backend should:

```javascript
// Pseudo-code for backend implementation
async function handleVideoUpload(videoFile, thumbnailFile) {
  // Save the uploaded video
  const videoUrl = await saveVideoToStorage(videoFile);
  
  // Check if client provided a thumbnail
  let thumbnailUrl;
  if (thumbnailFile) {
    // Use client-provided thumbnail
    thumbnailUrl = await saveThumbnailToStorage(thumbnailFile);
  } else {
    // Generate thumbnail server-side
    thumbnailUrl = await generateThumbnail(videoUrl);
  }
  
  // Save video metadata with thumbnail URL
  await saveVideoMetadata({
    videoUrl,
    thumbnailUrl,
    // ... other metadata
  });
}

async function generateThumbnail(videoUrl) {
  // Use FFmpeg to generate thumbnail
  const tempVideoPath = await downloadVideoTemp(videoUrl);
  const thumbnailPath = `/tmp/thumb_${Date.now()}.jpg`;
  
  // FFmpeg command to extract frame at 2 seconds
  await exec(`ffmpeg -i ${tempVideoPath} -ss 00:00:02 -vframes 1 -q:v 2 ${thumbnailPath}`);
  
  // Upload thumbnail to storage
  const thumbnailUrl = await uploadToStorage(thumbnailPath, 'thumbnails/');
  
  // Cleanup temp files
  await cleanupTempFiles([tempVideoPath, thumbnailPath]);
  
  return thumbnailUrl;
}
```

### 2. FFmpeg Thumbnail Generation Commands

```bash
# Basic thumbnail extraction (at 2 seconds)
ffmpeg -i input.mp4 -ss 00:00:02 -vframes 1 -q:v 2 output.jpg

# With specific size (for consistency)
ffmpeg -i input.mp4 -ss 00:00:02 -vframes 1 -vf "scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2" -q:v 2 output.jpg

# For problematic videos, try multiple timestamps
ffmpeg -i input.mp4 -ss 00:00:01 -vframes 1 -q:v 2 output1.jpg
ffmpeg -i input.mp4 -ss 00:00:02 -vframes 1 -q:v 2 output2.jpg
ffmpeg -i input.mp4 -ss 00:00:03 -vframes 1 -q:v 2 output3.jpg
# Then check which one generated successfully
```

### 3. Video Processing Pipeline

```javascript
async function processUploadedVideo(videoPath) {
  // 1. Validate video
  const videoInfo = await getVideoInfo(videoPath); // Use ffprobe
  
  // 2. Check codec
  if (needsTranscoding(videoInfo.codec)) {
    // Transcode to H.264 baseline profile for maximum compatibility
    videoPath = await transcodeVideo(videoPath);
  }
  
  // 3. Generate multiple thumbnails
  const thumbnails = await generateMultipleThumbnails(videoPath, [1, 2, 3]);
  
  // 4. Pick best thumbnail (not black, good contrast)
  const bestThumbnail = await selectBestThumbnail(thumbnails);
  
  return {
    processedVideoPath: videoPath,
    thumbnailPath: bestThumbnail
  };
}
```

### 4. API Response Updates

Update video endpoints to always include thumbnail URLs:

```json
{
  "id": "video123",
  "videoUrl": "https://vib3-videos.nyc3.digitaloceanspaces.com/videos/video123.mp4",
  "thumbnailUrl": "https://vib3-videos.nyc3.digitaloceanspaces.com/thumbnails/video123.jpg",
  "title": "My Video",
  // ... other fields
}
```

### 5. Storage Structure

Organize storage with separate folders:
```
vib3-videos/
├── videos/
│   ├── video1.mp4
│   ├── video2.mp4
│   └── ...
├── thumbnails/
│   ├── video1.jpg
│   ├── video2.jpg
│   └── ...
└── processed/  # For transcoded videos
    ├── video1_h264.mp4
    └── ...
```

### 6. Fallback Strategy

If thumbnail generation fails completely:
1. Return a specific error thumbnail URL that the app can recognize
2. App shows branded VIB3 thumbnail for these cases
3. Log the failure for investigation

### 7. Implementation Checklist

- [ ] Install FFmpeg on server
- [ ] Implement thumbnail generation function
- [ ] Add thumbnail generation to upload pipeline
- [ ] Update API to return thumbnail URLs
- [ ] Handle client-provided thumbnails
- [ ] Implement fallback for generation failures
- [ ] Add video transcoding for problematic codecs
- [ ] Update existing videos (batch job)
- [ ] Monitor thumbnail generation success rate

## Benefits
1. All videos will have thumbnails
2. Better user experience
3. Consistent thumbnail quality
4. Works with any video codec
5. Reduced client-side processing

## Mobile App Updates
The mobile app is already prepared to:
1. Use `thumbnailUrl` from API responses
2. Generate and upload thumbnails when possible
3. Show fallback thumbnails when needed

The backend implementation will ensure every video has a proper thumbnail, regardless of codec or encoding issues.