import 'dart:io';
import 'dart:typed_data';
import 'package:path_provider/path_provider.dart';
import 'package:video_thumbnail/video_thumbnail.dart';
import 'package:video_player/video_player.dart';

class VideoThumbnailService {
  static Future<Duration> getVideoDuration(String videoPath) async {
    print('📏 Getting video duration from: $videoPath');
    
    try {
      // Method 1: Try using video_player to get duration
      final controller = VideoPlayerController.file(File(videoPath));
      await controller.initialize();
      final duration = controller.value.duration;
      controller.dispose();
      
      if (duration.inMilliseconds > 0) {
        print('📏 Video duration: ${duration.inSeconds}s (${duration.inMilliseconds}ms)');
        return duration;
      }
    } catch (e) {
      print('⚠️ Failed to get duration with video_player: $e');
    }
    
    // Method 2: Try using ffprobe if available (fallback)
    try {
      final result = await Process.run('ffprobe', [
        '-v', 'quiet',
        '-print_format', 'json',
        '-show_format',
        videoPath
      ]);
      
      if (result.exitCode == 0) {
        final output = result.stdout.toString();
        // Parse JSON to extract duration
        final match = RegExp(r'"duration"\s*:\s*"([0-9.]+)"').firstMatch(output);
        if (match != null) {
          final seconds = double.parse(match.group(1)!);
          final duration = Duration(milliseconds: (seconds * 1000).toInt());
          print('📏 FFprobe duration: ${duration.inSeconds}s');
          return duration;
        }
      }
    } catch (e) {
      print('⚠️ FFprobe not available: $e');
    }
    
    // Method 3: Estimate based on file size (very rough estimate)
    try {
      final file = File(videoPath);
      final sizeInBytes = await file.length();
      // Assume average bitrate of 5 Mbps
      final estimatedSeconds = (sizeInBytes * 8) / (5 * 1000 * 1000);
      final duration = Duration(seconds: estimatedSeconds.toInt());
      print('📏 Estimated duration based on file size: ${duration.inSeconds}s');
      return duration;
    } catch (e) {
      print('❌ Failed to estimate duration: $e');
    }
    
    // Default fallback
    print('📏 Using default duration: 30 seconds');
    return const Duration(seconds: 30);
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