# Multi-Quality Video Processing for VIB3

## Overview

VIB3 now supports TikTok-style multi-quality video processing that generates multiple resolution variants with both H.264 and H.265 codecs for optimal streaming based on device capabilities and network conditions.

## Features

### 1. **Multi-Resolution Encoding**
- **4K (2160p)** - For high-end devices on fast connections
- **1080p** - Standard HD quality
- **720p** - Default quality for most mobile devices
- **480p** - For slower connections
- **360p** - Fallback for very slow/limited connections

### 2. **Dual Codec Support**
- **H.264 (AVC)** - Universal compatibility, works on all devices
- **H.265 (HEVC)** - 50% better compression, for modern devices
  - Only generated for 720p and above
  - Tagged with 'hvc1' for Apple compatibility

### 3. **Adaptive Streaming**
The Flutter app automatically selects the best quality based on:
- Network type (WiFi, 5G, 4G, 3G)
- Device capabilities
- Codec support

## Usage

### Server-Side

1. **Enable Multi-Quality Processing**:
```bash
# Set environment variable
export ENABLE_MULTI_QUALITY=true
```

2. **Upload with Multi-Quality**:
```javascript
// In upload request
formData.append('multiQuality', 'true');
```

3. **Automatic for HD/4K**:
- Videos 1080p and above automatically get multi-quality processing

### Client-Side (Flutter)

The adaptive video service automatically selects optimal quality:

```dart
// Automatic in VideoPlayerWidget
final optimalUrl = await AdaptiveVideoService().getOptimalVideoUrl(videoUrl);
```

## How It Works

### 1. **Upload Flow**
```
User uploads 4K video → Server validates → Multi-quality processor
                                               ↓
                                    Creates variants:
                                    - 4k_h264.mp4
                                    - 4k_h265.mp4
                                    - 1080p_h264.mp4
                                    - 1080p_h265.mp4
                                    - 720p_h264.mp4
                                    - 720p_h265.mp4
                                    - 480p_h264.mp4
                                    - 360p_h264.mp4
                                    - manifest.json
```

### 2. **Playback Flow**
```
App requests video → AdaptiveVideoService checks:
                     - Network (WiFi/4G/3G)
                     - Device type
                     - Codec support
                           ↓
                     Selects optimal variant
                           ↓
                     Streams selected quality
```

## Video Quality Selection Logic

| Network | Device | Selected Quality |
|---------|---------|-----------------|
| WiFi/5G | Any | 1080p |
| 4G | Any | 720p |
| 3G | Any | 480p |
| Slow/Unknown | Any | 360p |

## Benefits vs Original System

### Before (Single 720p)
- All videos downscaled to 720p
- Quality loss for 4K content
- Same file for all users
- No network adaptation

### After (Multi-Quality)
- Preserves original quality up to 4K
- Optimal quality per user
- Bandwidth savings on slow connections
- Better user experience

## Storage Considerations

Multi-quality encoding increases storage:
- Original: 1 file per video
- Multi-quality: 5-9 files per video

However, benefits include:
- Better user experience
- Reduced bandwidth costs (users get appropriate quality)
- Competitive with TikTok

## Configuration

### Server Configuration
```javascript
// video-processor-multi.js
const QUALITY_PRESETS = [
  { name: '4k', height: 2160, ... },
  { name: '1080p', height: 1080, ... },
  // ... more presets
];
```

### Client Configuration
```dart
// adaptive_video_service.dart
String targetQuality;
switch (capabilities['connectionType']) {
  case 'wifi':
    targetQuality = '1080p';
    break;
  // ... more cases
}
```

## Monitoring

Check processing logs:
```
🎬 Starting multi-quality processing...
📊 Source: 3840x2160 @ 30fps
📐 Generating 5 quality variants
🔄 Encoding 4k H264...
✅ 4k h264: 125.3MB in 45.2s
🔄 Encoding 4k H265...
✅ 4k h265: 62.1MB in 52.3s
...
✅ Multi-quality processing completed in 132.5s
```

## Future Enhancements

1. **HLS/DASH Streaming** - True adaptive bitrate streaming
2. **ML-Based Quality Selection** - Learn user preferences
3. **Progressive Enhancement** - Start low, upgrade quality
4. **Bandwidth Detection** - Real-time quality switching
5. **CDN Integration** - Serve variants from edge locations