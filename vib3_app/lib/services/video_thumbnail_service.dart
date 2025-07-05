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
      
      // Try to detect actual duration by testing frames at different positions
      final fileSize = await videoFile.length();
      print('📏 Video file size: ${(fileSize / 1024 / 1024).toStringAsFixed(1)}MB');
      
      // Binary search for actual video duration
      int minDuration = 0;
      int maxDuration = 600000; // 10 minutes max for search
      int actualDuration = 30000; // Default 30 seconds
      
      // Quick test at common durations
      final testPoints = [5000, 10000, 15000, 30000, 60000, 120000, 300000];
      
      for (final testMs in testPoints) {
        try {
          final testData = await VideoThumbnail.thumbnailData(
            video: videoPath,
            imageFormat: ImageFormat.JPEG,
            maxHeight: 32,
            quality: 10,
            timeMs: testMs,
          );
          
          if (testData != null && testData.isNotEmpty) {
            actualDuration = testMs;
            print('✅ Frame found at ${testMs}ms (${(testMs/1000).toStringAsFixed(1)}s)');
          } else {
            print('❌ No frame at ${testMs}ms - video is shorter');
            break;
          }
        } catch (e) {
          // This position is beyond video duration
          break;
        }
      }
      
      // Add 10% buffer to ensure we don't exceed actual duration
      final estimatedMs = (actualDuration * 1.1).round();
      print('📏 Estimated duration: ${(estimatedMs/1000).toStringAsFixed(1)}s');
      
      return Duration(milliseconds: estimatedMs);
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
      
      // Calculate interval between frames
      final intervalMs = duration.inMilliseconds ~/ frameCount;
      
      // Generate frames at regular intervals
      for (int i = 0; i < frameCount; i++) {
        final position = i * intervalMs;
        
        try {
          final frameData = await VideoThumbnail.thumbnailData(
            video: videoPath,
            imageFormat: ImageFormat.JPEG,
            maxHeight: 100, // Higher quality for better preview
            quality: 60,     // Better quality
            timeMs: position,
          );
          
          if (frameData != null) {
            frames.add(frameData);
            print('🖼️ Frame ${frames.length}/$frameCount at ${position}ms (${(position/1000).toStringAsFixed(1)}s)');
          } else {
            print('⚠️ Null frame at ${position}ms, trying lower quality');
            // Try with lower quality
            final fallbackData = await VideoThumbnail.thumbnailData(
              video: videoPath,
              imageFormat: ImageFormat.JPEG,
              maxHeight: 60,
              quality: 30,
              timeMs: position,
            );
            if (fallbackData != null) {
              frames.add(fallbackData);
              print('🖼️ Fallback frame ${frames.length}/$frameCount at ${position}ms');
            }
          }
        } catch (e) {
          print('⚠️ Failed to extract frame at ${position}ms: $e');
          // Try fallback with even lower quality
          try {
            final frameData = await VideoThumbnail.thumbnailData(
              video: videoPath,
              imageFormat: ImageFormat.JPEG,
              maxHeight: 40,
              quality: 20,
              timeMs: position,
            );
            if (frameData != null) {
              frames.add(frameData);
              print('🖼️ Low quality frame ${frames.length}/$frameCount at ${position}ms');
            }
          } catch (e2) {
            print('❌ Skipping frame at ${position}ms');
          }
        }
      }
      
      print('✅ Generated ${frames.length}/$frameCount frames (${(frames.length * 100 / frameCount).toStringAsFixed(0)}%)');
      
      // If we didn't get enough frames, try to fill in gaps
      if (frames.length < frameCount && frames.length > 0) {
        print('🔧 Filling gaps: have ${frames.length}, need $frameCount');
        // Duplicate existing frames to reach target count
        while (frames.length < frameCount) {
          final sourceIndex = frames.length % frames.length;
          frames.add(frames[sourceIndex]);
        }
        print('🎆 Padded to ${frames.length} frames');
      }
      
      return frames;
    } catch (e) {
      print('❌ Error generating frames: $e');
      return [];
    }
  }
}