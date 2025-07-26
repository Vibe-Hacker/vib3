import 'dart:async';
import 'package:video_player/video_player.dart';
import 'adaptive_streaming_service.dart';

class VideoPlayerManager {
  static VideoPlayerManager? _instance;
  static VideoPlayerManager get instance {
    _instance ??= VideoPlayerManager._();
    return _instance!;
  }

  VideoPlayerManager._() {
    // Initialize adaptive streaming service
    _adaptiveStreaming.initialize();
  }

  // Adaptive streaming service
  final AdaptiveStreamingService _adaptiveStreaming = AdaptiveStreamingService();
  
  // Keep track of all active video controllers
  final Set<VideoPlayerController> _activeControllers = {};
  
  // Current playing controller
  VideoPlayerController? _currentPlayingController;
  
  // Maximum number of controllers allowed (dynamically adjusted)
  int get _maxControllers => 3; // Reduced to prevent decoder overload
  
  // Video initialization queue
  final List<Future<void> Function()> _initQueue = [];
  bool _isProcessingQueue = false;
  
  // Nuclear cleanup - dispose ALL video resources
  static Future<void> nuclearCleanup() async {
    await instance._nuclearCleanupInternal();
  }
  
  static Future<void> emergencyCleanup() async {
    await instance._nuclearCleanupInternal();
  }
  
  Future<void> _nuclearCleanupInternal() async {
    print('☢️ NUCLEAR CLEANUP: Disposing ALL video resources');
    
    // Clear any pending initializations first
    clearInitQueue();
    
    // Pause current playing controller first
    if (_currentPlayingController != null) {
      try {
        await _currentPlayingController!.pause();
      } catch (e) {
        print('☢️ Error pausing current controller: $e');
      }
    }
    
    // Dispose all controllers
    for (final controller in _activeControllers.toList()) {
      try {
        await controller.pause();
        await controller.dispose();
      } catch (e) {
        print('☢️ Error disposing controller: $e');
      }
    }
    
    _activeControllers.clear();
    _currentPlayingController = null;
    
    // Force garbage collection hint
    await Future.delayed(const Duration(milliseconds: 100));
    
    print('☢️ NUCLEAR CLEANUP COMPLETE');
  }

  // Register a video controller
  void registerController(VideoPlayerController controller) {
    _activeControllers.add(controller);
    
    // If we have too many controllers, dispose the oldest non-playing ones
    if (_activeControllers.length > _maxControllers) {
      _cleanupExcessControllers();
    }
  }
  
  // Clean up excess controllers
  void _cleanupExcessControllers() {
    if (_activeControllers.length <= _maxControllers) return;
    
    // Find controllers that are not currently playing
    final controllersToRemove = <VideoPlayerController>[];
    
    for (final controller in _activeControllers) {
      if (controller != _currentPlayingController && 
          !controller.value.isPlaying &&
          controllersToRemove.length < (_activeControllers.length - _maxControllers)) {
        controllersToRemove.add(controller);
      }
    }
    
    // Dispose and remove excess controllers
    for (final controller in controllersToRemove) {
      print('VideoPlayerManager: Disposing excess controller to maintain limit');
      _activeControllers.remove(controller);
      try {
        controller.pause();
        controller.dispose();
      } catch (e) {
        print('Error disposing excess controller: $e');
      }
    }
  }

  // Unregister a video controller
  void unregisterController(VideoPlayerController controller) {
    _activeControllers.remove(controller);
    if (_currentPlayingController == controller) {
      _currentPlayingController = null;
    }
  }

  // Play a video and pause all others
  Future<void> playVideo(VideoPlayerController controller) async {
    // Pause all other videos first
    for (final activeController in _activeControllers) {
      if (activeController != controller && activeController.value.isPlaying) {
        try {
          await activeController.pause();
        } catch (e) {
          print('Error pausing video: $e');
        }
      }
    }
    
    // Set the current playing controller
    _currentPlayingController = controller;
    
    // Play the requested video
    try {
      await controller.play();
    } catch (e) {
      print('Error playing video: $e');
    }
  }

  // Pause all videos
  Future<void> pauseAllVideos() async {
    print('VideoPlayerManager: Pausing all ${_activeControllers.length} videos');
    for (final controller in _activeControllers) {
      if (controller.value.isPlaying) {
        try {
          await controller.pause();
        } catch (e) {
          print('Error pausing video: $e');
        }
      }
    }
    _currentPlayingController = null;
  }
  
  // Force cleanup all but the specified controller
  Future<void> cleanupAllExcept(VideoPlayerController? keepController) async {
    print('VideoPlayerManager: Force cleanup all except one controller');
    final controllersToDispose = <VideoPlayerController>[];
    
    for (final controller in _activeControllers) {
      if (controller != keepController) {
        controllersToDispose.add(controller);
      }
    }
    
    for (final controller in controllersToDispose) {
      _activeControllers.remove(controller);
      try {
        await controller.pause();
        await controller.dispose();
      } catch (e) {
        print('Error disposing controller during cleanup: $e');
      }
    }
    
    print('VideoPlayerManager: Cleaned up ${controllersToDispose.length} controllers');
  }

  // Dispose all controllers (for app lifecycle)
  Future<void> disposeAllControllers() async {
    await pauseAllVideos();
    
    for (final controller in _activeControllers.toList()) {
      try {
        await controller.dispose();
      } catch (e) {
        print('Error disposing controller: $e');
      }
    }
    
    _activeControllers.clear();
    _currentPlayingController = null;
  }

  // Get the number of active controllers
  int get activeControllersCount => _activeControllers.length;

  // Check if a specific controller is currently playing
  bool isCurrentlyPlaying(VideoPlayerController controller) {
    return _currentPlayingController == controller && controller.value.isPlaying;
  }
  
  // Queue a video initialization to prevent concurrent initializations
  Future<void> queueVideoInit(Future<void> Function() initFunction) async {
    print('📋 Queueing video initialization. Queue size: ${_initQueue.length}');
    
    // Create a completer to track when this specific init completes
    final completer = Completer<void>();
    
    // Wrap the init function to complete the completer
    Future<void> wrappedInit() async {
      try {
        await initFunction();
        completer.complete();
      } catch (e) {
        completer.completeError(e);
      }
    }
    
    _initQueue.add(wrappedInit);
    
    if (!_isProcessingQueue) {
      _processQueue();
    }
    
    // Wait for this specific initialization to complete
    return completer.future;
  }
  
  // Process the initialization queue
  Future<void> _processQueue() async {
    if (_isProcessingQueue || _initQueue.isEmpty) return;
    
    _isProcessingQueue = true;
    
    while (_initQueue.isNotEmpty) {
      final initFunction = _initQueue.removeAt(0);
      try {
        print('🎬 Processing video initialization from queue. Remaining: ${_initQueue.length}');
        await initFunction();
        // No delay for faster initialization - videos will init in parallel
        // The video decoder can handle multiple concurrent initializations
      } catch (e) {
        print('❌ Error processing video init: $e');
      }
    }
    
    _isProcessingQueue = false;
  }
  
  // Clear the initialization queue (for emergency cleanup)
  void clearInitQueue() {
    print('🧹 Clearing video initialization queue');
    _initQueue.clear();
  }
}