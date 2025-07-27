import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';
import 'dart:io';

// Video quality enum
enum VideoQuality {
  auto,
  high,    // 1080p
  medium,  // 720p
  low,     // 480p
  minimal  // 360p
}

// Performance metrics class
class VideoPerformanceMetrics {
  double averageFps = 0;
  int droppedFrames = 0;
  int totalFrames = 0;
  double bufferHealth = 1.0;
  DateTime lastUpdate = DateTime.now();
  List<double> fpsHistory = [];
  
  void updateFps(double fps) {
    fpsHistory.add(fps);
    if (fpsHistory.length > 10) {
      fpsHistory.removeAt(0);
    }
    averageFps = fpsHistory.reduce((a, b) => a + b) / fpsHistory.length;
    lastUpdate = DateTime.now();
  }
}

class VideoPerformanceService {
  static final VideoPerformanceService _instance = VideoPerformanceService._internal();
  factory VideoPerformanceService() => _instance;
  VideoPerformanceService._internal();

  // Track performance metrics
  final Map<String, VideoPerformanceMetrics> _performanceMetrics = {};
  
  // Performance thresholds
  static const double _minAcceptableFps = 24.0;
  static const double _targetBufferSeconds = 5.0;
  
  // Optimization settings
  bool _hardwareAccelerationEnabled = true;
  VideoQuality _currentQuality = VideoQuality.auto;

  // Optimize video player settings
  VideoPlayerOptions getOptimizedPlayerOptions() {
    return VideoPlayerOptions(
      mixWithOthers: false,
      allowBackgroundPlayback: false,
      // Additional platform-specific optimizations
      webOptions: VideoPlayerWebOptions(
        allowRemotePlayback: false,
        controls: VideoPlayerWebOptionsControls.disabled(),
      ),
    );
  }

  // Get optimized initialization settings
  Map<String, dynamic> getOptimizedInitSettings() {
    return {
      'preferredVideoCodec': 'h264',  // Better hardware support
      'maxBitrate': _getMaxBitrateForQuality(),
      'bufferSize': 5 * 1024 * 1024,  // 5MB buffer
      'initialBufferDuration': 2000,   // 2 seconds
      'maxBufferDuration': 10000,      // 10 seconds
      'hardwareAcceleration': _hardwareAccelerationEnabled,
    };
  }

  // Get max bitrate based on quality setting
  int _getMaxBitrateForQuality() {
    switch (_currentQuality) {
      case VideoQuality.high:
        return 5000000;  // 5 Mbps
      case VideoQuality.medium:
        return 2500000;  // 2.5 Mbps
      case VideoQuality.low:
        return 1000000;  // 1 Mbps
      case VideoQuality.minimal:
        return 500000;   // 500 Kbps
      case VideoQuality.auto:
      default:
        return 3000000;  // 3 Mbps default
    }
  }

  // Analyze video performance and adjust quality
  Future<void> analyzeAndOptimize(String videoId, VideoPlayerController controller) async {
    if (!controller.value.isInitialized) return;
    
    // Get or create metrics for this video
    final metrics = _performanceMetrics.putIfAbsent(
      videoId, 
      () => VideoPerformanceMetrics()
    );
    
    // Calculate current FPS
    final position = controller.value.position;
    final duration = controller.value.duration;
    
    // Check if video is stuttering
    if (controller.value.isPlaying) {
      // Monitor buffer health
      final bufferPercent = controller.value.buffered.isNotEmpty
          ? controller.value.buffered.last.end.inMilliseconds / duration.inMilliseconds
          : 0.0;
      
      metrics.bufferHealth = bufferPercent;
      
      // If buffer is low or FPS is dropping, reduce quality
      if (bufferPercent < 0.1 || metrics.averageFps < _minAcceptableFps) {
        _reduceQuality();
        debugPrint('📉 Reducing video quality due to performance issues');
      }
    }
  }

  // Reduce video quality
  void _reduceQuality() {
    switch (_currentQuality) {
      case VideoQuality.high:
        _currentQuality = VideoQuality.medium;
        break;
      case VideoQuality.medium:
        _currentQuality = VideoQuality.low;
        break;
      case VideoQuality.low:
        _currentQuality = VideoQuality.minimal;
        break;
      default:
        // Already at minimal
        break;
    }
  }

  // Get quality suffix for video URL
  String getQualitySuffix() {
    switch (_currentQuality) {
      case VideoQuality.high:
        return '_1080p';
      case VideoQuality.medium:
        return '_720p';
      case VideoQuality.low:
        return '_480p';
      case VideoQuality.minimal:
        return '_360p';
      case VideoQuality.auto:
      default:
        return '';
    }
  }

  // Pre-warm video decoder
  Future<void> preWarmDecoder() async {
    try {
      // Create a minimal video controller to warm up the decoder
      final testController = VideoPlayerController.networkUrl(
        Uri.parse('https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4'),
        videoPlayerOptions: getOptimizedPlayerOptions(),
      );
      
      await testController.initialize();
      await testController.dispose();
      
      debugPrint('✅ Video decoder pre-warmed successfully');
    } catch (e) {
      debugPrint('⚠️ Failed to pre-warm decoder: $e');
    }
  }

  // Enable/disable hardware acceleration
  void setHardwareAcceleration(bool enabled) {
    _hardwareAccelerationEnabled = enabled;
    debugPrint('🎮 Hardware acceleration: ${enabled ? "enabled" : "disabled"}');
  }

  // Get performance report
  Map<String, dynamic> getPerformanceReport(String videoId) {
    final metrics = _performanceMetrics[videoId];
    if (metrics == null) return {};
    
    return {
      'averageFps': metrics.averageFps,
      'droppedFrames': metrics.droppedFrames,
      'totalFrames': metrics.totalFrames,
      'bufferHealth': metrics.bufferHealth,
      'currentQuality': _currentQuality.toString(),
      'hardwareAcceleration': _hardwareAccelerationEnabled,
    };
  }

  // Clear performance data
  void clearMetrics() {
    _performanceMetrics.clear();
  }
}