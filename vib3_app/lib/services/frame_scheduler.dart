import 'package:flutter/scheduler.dart';
import 'package:flutter/foundation.dart';

/// Frame scheduler for buttery smooth 60 FPS scrolling
class FrameScheduler {
  static final FrameScheduler _instance = FrameScheduler._internal();
  factory FrameScheduler() => _instance;
  FrameScheduler._internal() {
    _initialize();
  }

  // Frame timing
  static const Duration _targetFrameDuration = Duration(microseconds: 16667); // 60 FPS
  Duration _lastFrameDuration = Duration.zero;
  int _droppedFrames = 0;
  
  // Performance monitoring
  bool _isHighPerformanceMode = true;
  final List<Duration> _recentFrameTimes = [];
  static const int _maxFrameSamples = 60;

  void _initialize() {
    // Monitor frame timing
    SchedulerBinding.instance.addTimingsCallback(_onFrameTimings);
    
    // Set high performance mode
    if (kIsWeb) {
      // Web-specific optimizations
      SchedulerBinding.instance.schedulerPhase;
    }
  }

  /// Handle frame timings
  void _onFrameTimings(List<FrameTiming> timings) {
    for (final timing in timings) {
      final frameDuration = timing.totalSpan;
      _lastFrameDuration = frameDuration;
      
      // Track recent frame times
      _recentFrameTimes.add(frameDuration);
      if (_recentFrameTimes.length > _maxFrameSamples) {
        _recentFrameTimes.removeAt(0);
      }
      
      // Count dropped frames
      if (frameDuration > _targetFrameDuration * 1.5) {
        _droppedFrames++;
        _onFrameDropped(frameDuration);
      }
      
      // Adjust performance mode
      _adjustPerformanceMode();
    }
  }

  /// Handle dropped frame
  void _onFrameDropped(Duration frameDuration) {
    final overdraw = frameDuration.inMicroseconds / _targetFrameDuration.inMicroseconds;
    print('⚠️ Frame dropped! Duration: ${frameDuration.inMilliseconds}ms (${overdraw.toStringAsFixed(1)}x target)');
    
    // Notify listeners to reduce quality if needed
    if (_droppedFrames > 5) {
      _requestQualityReduction();
      _droppedFrames = 0;
    }
  }

  /// Adjust performance mode based on frame times
  void _adjustPerformanceMode() {
    if (_recentFrameTimes.length < 10) return;
    
    // Calculate average frame time
    final totalMicroseconds = _recentFrameTimes
        .map((d) => d.inMicroseconds)
        .reduce((a, b) => a + b);
    final avgMicroseconds = totalMicroseconds / _recentFrameTimes.length;
    
    // Switch to low performance mode if struggling
    if (avgMicroseconds > _targetFrameDuration.inMicroseconds * 1.2) {
      if (_isHighPerformanceMode) {
        _isHighPerformanceMode = false;
        print('📉 Switching to low performance mode');
        _applyLowPerformanceSettings();
      }
    } else if (avgMicroseconds < _targetFrameDuration.inMicroseconds * 1.1) {
      if (!_isHighPerformanceMode) {
        _isHighPerformanceMode = true;
        print('📈 Switching to high performance mode');
        _applyHighPerformanceSettings();
      }
    }
  }

  /// Apply high performance settings
  void _applyHighPerformanceSettings() {
    // Enable all visual effects
    SchedulerBinding.instance.scheduleForcedFrame();
  }

  /// Apply low performance settings
  void _applyLowPerformanceSettings() {
    // Reduce visual effects for performance
    // This would communicate with other widgets to:
    // - Disable shadows
    // - Reduce animation complexity
    // - Lower video resolution
  }

  /// Request quality reduction from video system
  void _requestQualityReduction() {
    // This would trigger adaptive streaming to lower quality
    print('📉 Requesting video quality reduction for performance');
  }

  /// Schedule high priority task
  void scheduleTask(VoidCallback task, {Priority priority = Priority.animation}) {
    SchedulerBinding.instance.scheduleTask(
      task,
      priority,
      debugLabel: 'VIB3 Video Task',
    );
  }

  /// Schedule frame callback for smooth animations
  void scheduleFrameCallback(FrameCallback callback) {
    SchedulerBinding.instance.scheduleFrameCallback(callback);
  }

  /// Get current performance metrics
  Map<String, dynamic> getMetrics() {
    final avgFrameTime = _recentFrameTimes.isEmpty 
        ? 0.0
        : _recentFrameTimes
            .map((d) => d.inMilliseconds)
            .reduce((a, b) => a + b) / _recentFrameTimes.length;
    
    return {
      'currentFPS': _lastFrameDuration.inMicroseconds > 0 
          ? (1000000 / _lastFrameDuration.inMicroseconds).round()
          : 60,
      'avgFrameTime': avgFrameTime.toStringAsFixed(1),
      'droppedFrames': _droppedFrames,
      'performanceMode': _isHighPerformanceMode ? 'high' : 'low',
    };
  }

  /// Force high performance for critical moments (like scrolling)
  void boostPerformance(Duration duration) {
    _isHighPerformanceMode = true;
    _applyHighPerformanceSettings();
    
    // Reset after duration
    Future.delayed(duration, () {
      _adjustPerformanceMode();
    });
  }

  bool get isHighPerformanceMode => _isHighPerformanceMode;
}