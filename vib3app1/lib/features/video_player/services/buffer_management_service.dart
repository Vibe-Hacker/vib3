import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';
import 'dart:async';

class BufferManagementService {
  static final BufferManagementService _instance = BufferManagementService._internal();
  factory BufferManagementService() => _instance;
  BufferManagementService._internal();

  // Track active controllers and their buffer usage
  final Set<VideoPlayerController> _activeControllers = {};
  Timer? _bufferCleanupTimer;
  
  // Buffer management settings
  static const int _maxActiveControllers = 3;
  static const Duration _cleanupInterval = Duration(seconds: 10);
  
  void initialize() {
    // Start periodic buffer cleanup
    _bufferCleanupTimer?.cancel();
    _bufferCleanupTimer = Timer.periodic(_cleanupInterval, (_) {
      _performBufferCleanup();
    });
    
    debugPrint('🧹 BufferManagementService initialized');
  }
  
  void dispose() {
    _bufferCleanupTimer?.cancel();
    _activeControllers.clear();
    debugPrint('🧹 BufferManagementService disposed');
  }
  
  // Register a new controller
  bool registerController(VideoPlayerController controller) {
    // If we have too many controllers, dispose the oldest ones
    if (_activeControllers.length >= _maxActiveControllers) {
      _cleanupOldestControllers();
    }
    
    _activeControllers.add(controller);
    debugPrint('📱 Registered controller. Active count: ${_activeControllers.length}');
    return true;
  }
  
  // Unregister a controller
  void unregisterController(VideoPlayerController controller) {
    _activeControllers.remove(controller);
    debugPrint('📱 Unregistered controller. Active count: ${_activeControllers.length}');
  }
  
  // Force cleanup of oldest controllers
  void _cleanupOldestControllers() {
    final controllersToRemove = <VideoPlayerController>[];
    int removeCount = _activeControllers.length - _maxActiveControllers + 1;
    
    // Remove excess controllers (FIFO - oldest first)
    int count = 0;
    for (final controller in _activeControllers) {
      if (count >= removeCount) break;
      
      if (!controller.value.isPlaying) {
        controllersToRemove.add(controller);
        count++;
      }
    }
    
    for (final controller in controllersToRemove) {
      try {
        controller.pause();
        controller.dispose();
        _activeControllers.remove(controller);
        debugPrint('🧹 Cleaned up inactive controller');
      } catch (e) {
        debugPrint('⚠️ Error cleaning up controller: $e');
      }
    }
  }
  
  // Periodic buffer cleanup
  void _performBufferCleanup() {
    final controllersToRemove = <VideoPlayerController>[];
    
    for (final controller in _activeControllers) {
      try {
        // Remove disposed or errored controllers
        if (!controller.value.isInitialized || controller.value.hasError) {
          controllersToRemove.add(controller);
        }
        // Pause non-playing controllers to free buffers
        else if (!controller.value.isPlaying && controller.value.isInitialized) {
          controller.seekTo(Duration.zero); // Clear buffer
        }
      } catch (e) {
        // Controller is probably disposed, remove it
        controllersToRemove.add(controller);
      }
    }
    
    // Remove invalid controllers
    for (final controller in controllersToRemove) {
      _activeControllers.remove(controller);
    }
    
    if (controllersToRemove.isNotEmpty) {
      debugPrint('🧹 Cleaned up ${controllersToRemove.length} invalid controllers');
    }
  }
  
  // Emergency cleanup - dispose all controllers
  void emergencyCleanup() {
    debugPrint('🚨 Emergency buffer cleanup initiated');
    
    for (final controller in _activeControllers.toList()) {
      try {
        controller.pause();
        controller.seekTo(Duration.zero);
        controller.dispose();
      } catch (e) {
        debugPrint('⚠️ Error in emergency cleanup: $e');
      }
    }
    
    _activeControllers.clear();
    debugPrint('🚨 Emergency cleanup completed');
  }
  
  // Get current buffer status
  Map<String, dynamic> getBufferStatus() {
    int initialized = 0;
    int playing = 0;
    int buffering = 0;
    int hasError = 0;
    
    for (final controller in _activeControllers) {
      try {
        if (controller.value.isInitialized) initialized++;
        if (controller.value.isPlaying) playing++;
        if (controller.value.isBuffering) buffering++;
        if (controller.value.hasError) hasError++;
      } catch (e) {
        hasError++;
      }
    }
    
    return {
      'totalControllers': _activeControllers.length,
      'initialized': initialized,
      'playing': playing,
      'buffering': buffering,
      'hasError': hasError,
      'maxAllowed': _maxActiveControllers,
    };
  }
}