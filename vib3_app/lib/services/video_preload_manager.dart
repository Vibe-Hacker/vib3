import 'package:video_player/video_player.dart';
import 'dart:collection';

/// Manages video preloading for smooth playback
class VideoPreloadManager {
  static final VideoPreloadManager _instance = VideoPreloadManager._internal();
  factory VideoPreloadManager() => _instance;
  VideoPreloadManager._internal();

  // Keep 5 controllers in memory (current + 2 before + 2 after)
  final int _maxControllers = 5;
  final LinkedHashMap<String, VideoPlayerController> _controllers = LinkedHashMap();
  final Set<String> _initializing = {};
  final Set<String> _initialized = {};
  
  /// Get or create a controller for a video URL
  Future<VideoPlayerController?> getController(String videoUrl, {bool priority = false}) async {
    if (videoUrl.isEmpty) return null;
    
    // Return existing controller if available
    if (_controllers.containsKey(videoUrl)) {
      final controller = _controllers[videoUrl]!;
      // Move to end (most recently used)
      _controllers.remove(videoUrl);
      _controllers[videoUrl] = controller;
      return controller;
    }
    
    // Already initializing
    if (_initializing.contains(videoUrl)) {
      // Wait for initialization
      while (_initializing.contains(videoUrl)) {
        await Future.delayed(Duration(milliseconds: 100));
      }
      return _controllers[videoUrl];
    }
    
    // Initialize new controller
    _initializing.add(videoUrl);
    
    try {
      print('🎬 Preloading video: $videoUrl');
      final controller = VideoPlayerController.network(
        videoUrl,
        videoPlayerOptions: VideoPlayerOptions(
          mixWithOthers: false,
          allowBackgroundPlayback: false,
        ),
      );
      
      await controller.initialize();
      await controller.setLooping(true);
      
      // Store controller
      _controllers[videoUrl] = controller;
      _initialized.add(videoUrl);
      _initializing.remove(videoUrl);
      
      // Clean up old controllers if needed
      _cleanupControllers();
      
      print('✅ Preloaded video: $videoUrl');
      return controller;
      
    } catch (e) {
      print('❌ Failed to preload video: $e');
      _initializing.remove(videoUrl);
      return null;
    }
  }
  
  /// Preload multiple videos
  Future<void> preloadVideos(List<String> videoUrls, int currentIndex) async {
    // Calculate which videos to preload
    final start = (currentIndex - 2).clamp(0, videoUrls.length - 1);
    final end = (currentIndex + 3).clamp(0, videoUrls.length);
    
    // Preload videos in range
    for (int i = start; i < end; i++) {
      if (i >= 0 && i < videoUrls.length) {
        final url = videoUrls[i];
        // Don't await - let them load in parallel
        getController(url, priority: i == currentIndex);
      }
    }
  }
  
  /// Clean up controllers outside the keep range
  void _cleanupControllers() {
    while (_controllers.length > _maxControllers) {
      // Remove least recently used (first in map)
      final firstKey = _controllers.keys.first;
      final controller = _controllers.remove(firstKey);
      _initialized.remove(firstKey);
      
      try {
        controller?.dispose();
      } catch (e) {
        print('Error disposing controller: $e');
      }
    }
  }
  
  /// Play a specific video
  void playVideo(String videoUrl) {
    // Pause all other videos
    _controllers.forEach((url, controller) {
      if (url != videoUrl) {
        controller.pause();
      }
    });
    
    // Play the requested video
    _controllers[videoUrl]?.play();
  }
  
  /// Pause all videos
  void pauseAll() {
    _controllers.values.forEach((controller) {
      controller.pause();
    });
  }
  
  /// Dispose all controllers
  void dispose() {
    _controllers.values.forEach((controller) {
      try {
        controller.dispose();
      } catch (e) {
        print('Error disposing controller: $e');
      }
    });
    _controllers.clear();
    _initialized.clear();
    _initializing.clear();
  }
}