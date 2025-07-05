import 'dart:io';
import 'dart:typed_data';
import 'package:path_provider/path_provider.dart';
import 'package:video_thumbnail/video_thumbnail.dart';

class VideoThumbnailService {
  static Future<Duration> getVideoDuration(String videoPath) async {
    try {
      print('📏 Getting video duration from: $videoPath');
      
      final videoFile = File(videoPath);
      if (!await videoFile.exists()) {
        print('❌ Video file does not exist');
        return const Duration(seconds: 30);
      }
      
      // Use file size estimation for duration
      final fileSize = await videoFile.length();
      
      // Test if we can get a frame at 60 seconds to verify it's a longer video
      try {
        final testData = await VideoThumbnail.thumbnailData(
          video: videoPath,
          imageFormat: ImageFormat.JPEG,
          maxHeight: 64,
          quality: 10,
          timeMs: 60000, // 60 seconds
        );
        
        if (testData != null && testData.isNotEmpty) {
          print('📏 Video is at least 60 seconds');
          // Use more generous estimation for longer videos
          final estimatedMinutes = fileSize / (2.0 * 1024 * 1024); // 2MB per minute
          final estimatedSeconds = (estimatedMinutes * 60).round();
          print('📏 Estimated duration: ${estimatedSeconds}s from ${fileSize / 1024 / 1024}MB file');
          return Duration(seconds: estimatedSeconds.clamp(60, 3600)); // 60s to 1 hour
        }
      } catch (e) {
        print('⚠️ Could not test 60s mark, using standard estimation');
      }
      
      // Standard estimation: ~2.5MB per minute for mobile video
      final estimatedMinutes = fileSize / (2.5 * 1024 * 1024);
      final estimatedSeconds = (estimatedMinutes * 60).round();
      
      print('📏 Estimated duration: ${estimatedSeconds}s from ${fileSize / 1024 / 1024}MB file');
      return Duration(seconds: estimatedSeconds.clamp(5, 3600)); // 5s to 1 hour
    } catch (e) {
      print('❌ Error getting video duration: $e');
      return const Duration(seconds: 30);
    }
  }

  static Future<File?> generateThumbnail(String videoPath) async {
    // We don't need static thumbnails anymore - just return null
    // The video editing screen will use frame extraction instead
    return null;
  }



  
  static Future<List<Uint8List>> generateVideoFrames(String videoPath, int frameCount) async {
    try {
      print('🎞️ Generating $frameCount frames from video');
      
      final frames = <Uint8List>[];
      final duration = await getVideoDuration(videoPath);
      
      // Generate frames at regular intervals
      for (int i = 0; i < frameCount; i++) {
        final position = i * (duration.inMilliseconds ~/ frameCount);
        
        try {
          final frameData = await VideoThumbnail.thumbnailData(
            video: videoPath,
            imageFormat: ImageFormat.JPEG,
            maxHeight: 80, // Slightly higher quality for better preview
            quality: 50,    // Better quality
            timeMs: position,
          );
          
          if (frameData != null) {
            frames.add(frameData);
            print('🖼️ Frame ${i + 1}/$frameCount extracted at ${position}ms');
          }
        } catch (e) {
          print('⚠️ Failed to extract frame at ${position}ms: $e');
          // Try fallback with lower quality
          try {
            final frameData = await VideoThumbnail.thumbnailData(
              video: videoPath,
              imageFormat: ImageFormat.JPEG,
              maxHeight: 60,
              quality: 30,
              timeMs: position,
            );
            if (frameData != null) {
              frames.add(frameData);
            }
          } catch (e2) {
            // Skip this frame
          }
        }
      }
      
      print('✅ Generated ${frames.length} frames');
      return frames;
    } catch (e) {
      print('❌ Error generating frames: $e');
      return [];
    }
  }
}