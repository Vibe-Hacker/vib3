import 'dart:io';
import 'dart:ui' show Size;
import 'package:video_player/video_player.dart';
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as path;

/// Service to pre-process videos before upload to ensure compatibility
class VideoProcessorService {
  /// Check if a video needs processing before upload
  static Future<VideoCompatibility> checkVideoCompatibility(String videoPath) async {
    try {
      final controller = VideoPlayerController.file(File(videoPath));
      
      try {
        // Try to initialize with a timeout
        await controller.initialize().timeout(
          const Duration(seconds: 5),
          onTimeout: () => throw Exception('Initialization timeout'),
        );
        
        final isInitialized = controller.value.isInitialized;
        final duration = controller.value.duration;
        final size = controller.value.size;
        
        await controller.dispose();
        
        if (!isInitialized) {
          return VideoCompatibility(
            isCompatible: false,
            reason: 'Video failed to initialize - may have codec issues',
            needsProcessing: true,
          );
        }
        
        // Check for unusual aspect ratios or sizes
        if (size.width > 4096 || size.height > 4096) {
          return VideoCompatibility(
            isCompatible: false,
            reason: 'Video resolution too high (max 4K supported)',
            needsProcessing: true,
          );
        }
        
        return VideoCompatibility(
          isCompatible: true,
          duration: duration,
          size: size,
        );
        
      } catch (e) {
        await controller.dispose();
        
        // If we get codec errors, the video needs processing
        if (e.toString().contains('MediaCodec') || 
            e.toString().contains('ExoPlaybackException')) {
          return VideoCompatibility(
            isCompatible: false,
            reason: 'Video codec not supported on this device',
            needsProcessing: true,
            codecIssue: true,
          );
        }
        
        return VideoCompatibility(
          isCompatible: false,
          reason: 'Failed to analyze video: ${e.toString()}',
          needsProcessing: true,
        );
      }
    } catch (e) {
      return VideoCompatibility(
        isCompatible: false,
        reason: 'Error checking video: ${e.toString()}',
        needsProcessing: true,
      );
    }
  }
  
  /// Pre-process video if needed (placeholder - needs native implementation)
  static Future<ProcessedVideo> processVideoIfNeeded(String videoPath) async {
    final compatibility = await checkVideoCompatibility(videoPath);
    
    if (compatibility.isCompatible) {
      // Video is fine, no processing needed
      return ProcessedVideo(
        videoPath: videoPath,
        wasProcessed: false,
        compatibility: compatibility,
      );
    }
    
    // In a real implementation, this would:
    // 1. Use platform channels to access native video processing
    // 2. Re-encode the video to H.264 baseline profile
    // 3. Ensure proper keyframe intervals
    // 4. Optimize for mobile playback
    
    // For now, return original with warning
    return ProcessedVideo(
      videoPath: videoPath,
      wasProcessed: false,
      compatibility: compatibility,
      warning: 'Video may have compatibility issues. Consider re-recording with the VIB3 camera.',
    );
  }
  
  /// Get video metadata
  static Future<VideoMetadata?> getVideoMetadata(String videoPath) async {
    try {
      final file = File(videoPath);
      if (!await file.exists()) {
        return null;
      }
      
      final controller = VideoPlayerController.file(file);
      
      try {
        await controller.initialize();
        
        final metadata = VideoMetadata(
          duration: controller.value.duration,
          size: controller.value.size,
          fileSize: await file.length(),
          aspectRatio: controller.value.aspectRatio,
        );
        
        await controller.dispose();
        return metadata;
        
      } catch (e) {
        await controller.dispose();
        return null;
      }
    } catch (e) {
      return null;
    }
  }
}

/// Video compatibility check result
class VideoCompatibility {
  final bool isCompatible;
  final String? reason;
  final bool needsProcessing;
  final bool codecIssue;
  final Duration? duration;
  final Size? size;
  
  VideoCompatibility({
    required this.isCompatible,
    this.reason,
    this.needsProcessing = false,
    this.codecIssue = false,
    this.duration,
    this.size,
  });
}

/// Processed video result
class ProcessedVideo {
  final String videoPath;
  final bool wasProcessed;
  final VideoCompatibility compatibility;
  final String? warning;
  
  ProcessedVideo({
    required this.videoPath,
    required this.wasProcessed,
    required this.compatibility,
    this.warning,
  });
}

/// Video metadata
class VideoMetadata {
  final Duration duration;
  final Size size;
  final int fileSize;
  final double aspectRatio;
  
  VideoMetadata({
    required this.duration,
    required this.size,
    required this.fileSize,
    required this.aspectRatio,
  });
  
  String get formattedDuration {
    final minutes = duration.inMinutes;
    final seconds = duration.inSeconds % 60;
    return '$minutes:${seconds.toString().padLeft(2, '0')}';
  }
  
  String get formattedFileSize {
    if (fileSize < 1024 * 1024) {
      return '${(fileSize / 1024).toStringAsFixed(1)} KB';
    } else {
      return '${(fileSize / (1024 * 1024)).toStringAsFixed(1)} MB';
    }
  }
}