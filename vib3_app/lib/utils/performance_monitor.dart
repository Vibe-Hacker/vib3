import 'dart:async';
import 'package:flutter/scheduler.dart';
import 'package:flutter/foundation.dart';

/// Performance monitor to track FPS and jank
/// Helps ensure smooth 60 FPS scrolling like TikTok
class PerformanceMonitor {
  static final PerformanceMonitor _instance = PerformanceMonitor._internal();
  factory PerformanceMonitor() => _instance;
  PerformanceMonitor._internal();
  
  // FPS tracking
  int _frameCount = 0;
  DateTime _lastFpsCheck = DateTime.now();
  double _currentFps = 60.0;
  
  // Jank tracking
  int _jankCount = 0;
  int _totalFrames = 0;
  
  // Callbacks
  final List<Function(double)> _fpsListeners = [];
  Timer? _fpsTimer;
  
  void startMonitoring() {
    if (!kDebugMode) return; // Only in debug mode
    
    // Monitor frame timing
    SchedulerBinding.instance.addTimingsCallback(_onFrameTimings);
    
    // Calculate FPS every second
    _fpsTimer = Timer.periodic(Duration(seconds: 1), (_) {
      final now = DateTime.now();
      final elapsed = now.difference(_lastFpsCheck).inMilliseconds;
      
      if (elapsed > 0) {
        _currentFps = (_frameCount * 1000 / elapsed).clamp(0, 120);
        _notifyFpsListeners(_currentFps);
      }
      
      _frameCount = 0;
      _lastFpsCheck = now;
    });
  }
  
  void stopMonitoring() {
    _fpsTimer?.cancel();
    SchedulerBinding.instance.removeTimingsCallback(_onFrameTimings);
  }
  
  void _onFrameTimings(List<FrameTiming> timings) {
    for (final timing in timings) {
      _frameCount++;
      _totalFrames++;
      
      // Check for jank (frame took more than 16.67ms)
      final frameDuration = timing.totalSpan.inMilliseconds;
      if (frameDuration > 16) {
        _jankCount++;
        
        if (kDebugMode) {
          print('⚠️ Jank detected: ${frameDuration}ms frame');
        }
      }
    }
  }
  
  /// Add FPS listener
  void addFpsListener(Function(double) listener) {
    _fpsListeners.add(listener);
  }
  
  /// Remove FPS listener
  void removeFpsListener(Function(double) listener) {
    _fpsListeners.remove(listener);
  }
  
  void _notifyFpsListeners(double fps) {
    for (final listener in _fpsListeners) {
      listener(fps);
    }
  }
  
  /// Get current FPS
  double get currentFps => _currentFps;
  
  /// Get jank percentage
  double get jankPercentage {
    if (_totalFrames == 0) return 0;
    return (_jankCount / _totalFrames) * 100;
  }
  
  /// Log performance stats
  void logStats() {
    if (kDebugMode) {
      print('📊 Performance Stats:');
      print('   FPS: ${_currentFps.toStringAsFixed(1)}');
      print('   Jank: ${jankPercentage.toStringAsFixed(2)}%');
      print('   Total frames: $_totalFrames');
      print('   Janky frames: $_jankCount');
    }
  }
}

/// Widget to display FPS overlay
class FpsOverlay extends StatefulWidget {
  final Widget child;
  
  const FpsOverlay({Key? key, required this.child}) : super(key: key);
  
  @override
  State<FpsOverlay> createState() => _FpsOverlayState();
}

class _FpsOverlayState extends State<FpsOverlay> {
  double _fps = 60.0;
  final _monitor = PerformanceMonitor();
  
  @override
  void initState() {
    super.initState();
    _monitor.startMonitoring();
    _monitor.addFpsListener(_onFpsUpdate);
  }
  
  @override
  void dispose() {
    _monitor.removeFpsListener(_onFpsUpdate);
    super.dispose();
  }
  
  void _onFpsUpdate(double fps) {
    if (mounted) {
      setState(() => _fps = fps);
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        widget.child,
        if (kDebugMode)
          Positioned(
            top: 50,
            right: 10,
            child: Container(
              padding: EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: _fps < 50 ? Colors.red : Colors.green,
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                'FPS: ${_fps.toStringAsFixed(1)}',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
      ],
    );
  }
}