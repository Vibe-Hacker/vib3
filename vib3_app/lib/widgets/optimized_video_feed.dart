import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:video_player/video_player.dart';
import 'dart:async';
import 'dart:collection';

/// Optimized TikTok-style video feed with aggressive pre-loading
/// and performance optimizations
class OptimizedVideoFeed extends StatefulWidget {
  final List<String> videoUrls;
  final Function(int)? onPageChanged;
  final Widget Function(BuildContext, int)? overlayBuilder;
  
  const OptimizedVideoFeed({
    Key? key,
    required this.videoUrls,
    this.onPageChanged,
    this.overlayBuilder,
  }) : super(key: key);
  
  @override
  State<OptimizedVideoFeed> createState() => _OptimizedVideoFeedState();
}

class _OptimizedVideoFeedState extends State<OptimizedVideoFeed> {
  late PageController _pageController;
  int _currentIndex = 0;
  
  // Video controller pool - keep 5 videos in memory (current + 2 before + 2 after)
  final Map<int, VideoPlayerController> _controllerPool = {};
  final int _maxPoolSize = 5;
  final int _preloadDistance = 2;
  
  // Track initialization status
  final Set<int> _initializing = {};
  final Set<int> _initialized = {};
  
  // Performance optimizations
  Timer? _preloadTimer;
  bool _isScrolling = false;
  
  @override
  void initState() {
    super.initState();
    _pageController = PageController();
    
    // Start with current video
    _initializeVideo(_currentIndex);
    
    // Pre-load adjacent videos after a short delay
    Future.delayed(Duration(milliseconds: 300), () {
      _preloadAdjacentVideos();
    });
  }
  
  /// Initialize a video at the given index
  Future<void> _initializeVideo(int index) async {
    if (index < 0 || index >= widget.videoUrls.length) return;
    if (_controllerPool.containsKey(index) || _initializing.contains(index)) return;
    
    _initializing.add(index);
    
    try {
      final controller = VideoPlayerController.network(
        widget.videoUrls[index],
        videoPlayerOptions: VideoPlayerOptions(
          mixWithOthers: false,
          allowBackgroundPlayback: false,
        ),
      );
      
      // Set buffer duration for smoother playback
      await controller.setLooping(true);
      await controller.initialize();
      
      if (mounted) {
        setState(() {
          _controllerPool[index] = controller;
          _initialized.add(index);
          _initializing.remove(index);
        });
        
        // Start playing if this is the current video
        if (index == _currentIndex && !_isScrolling) {
          controller.play();
        }
        
        // Clean up old controllers
        _cleanupControllers();
      }
    } catch (e) {
      print('Failed to initialize video at index $index: $e');
      _initializing.remove(index);
    }
  }
  
  /// Pre-load videos within the preload distance
  void _preloadAdjacentVideos() {
    // Cancel any pending preload
    _preloadTimer?.cancel();
    
    // Schedule preload with a slight delay to prioritize current video
    _preloadTimer = Timer(Duration(milliseconds: 100), () {
      // Pre-load videos in both directions
      for (int i = 1; i <= _preloadDistance; i++) {
        // Pre-load next videos
        _initializeVideo(_currentIndex + i);
        // Pre-load previous videos
        _initializeVideo(_currentIndex - i);
      }
    });
  }
  
  /// Clean up controllers outside the pool range
  void _cleanupControllers() {
    final keysToRemove = <int>[];
    
    _controllerPool.forEach((index, controller) {
      // Keep videos within preload distance
      if ((index - _currentIndex).abs() > _preloadDistance) {
        controller.pause();
        controller.dispose();
        keysToRemove.add(index);
        _initialized.remove(index);
      }
    });
    
    keysToRemove.forEach(_controllerPool.remove);
  }
  
  /// Handle page changes
  void _onPageChanged(int index) {
    if (index == _currentIndex) return;
    
    setState(() {
      // Pause previous video
      _controllerPool[_currentIndex]?.pause();
      
      _currentIndex = index;
      _isScrolling = false;
      
      // Play new video
      if (_controllerPool.containsKey(index)) {
        _controllerPool[index]?.play();
      } else {
        _initializeVideo(index);
      }
    });
    
    // Pre-load adjacent videos
    _preloadAdjacentVideos();
    
    // Notify parent
    widget.onPageChanged?.call(index);
  }
  
  @override
  void dispose() {
    _preloadTimer?.cancel();
    _pageController.dispose();
    
    // Dispose all controllers
    _controllerPool.forEach((_, controller) {
      controller.pause();
      controller.dispose();
    });
    
    super.dispose();
  }
  
  @override
  Widget build(BuildContext context) {
    return PageView.builder(
      controller: _pageController,
      scrollDirection: Axis.vertical,
      onPageChanged: _onPageChanged,
      // Performance: only build 3 pages at a time
      allowImplicitScrolling: true,
      pageSnapping: true,
      physics: const BouncingScrollPhysics(),
      itemCount: widget.videoUrls.length,
      itemBuilder: (context, index) {
        return _VideoPlayerItem(
          controller: _controllerPool[index],
          isInitialized: _initialized.contains(index),
          onTap: () {
            final controller = _controllerPool[index];
            if (controller != null) {
              if (controller.value.isPlaying) {
                controller.pause();
              } else {
                controller.play();
              }
              setState(() {});
            }
          },
          overlay: widget.overlayBuilder?.call(context, index),
        );
      },
    );
  }
}

/// Individual video player item with overlays
class _VideoPlayerItem extends StatelessWidget {
  final VideoPlayerController? controller;
  final bool isInitialized;
  final VoidCallback? onTap;
  final Widget? overlay;
  
  const _VideoPlayerItem({
    Key? key,
    this.controller,
    required this.isInitialized,
    this.onTap,
    this.overlay,
  }) : super(key: key);
  
  @override
  Widget build(BuildContext context) {
    if (!isInitialized || controller == null) {
      return Container(
        color: Colors.black,
        child: Center(
          child: CircularProgressIndicator(
            color: Colors.white,
            strokeWidth: 2,
          ),
        ),
      );
    }
    
    return Stack(
      fit: StackFit.expand,
      children: [
        // Video player with RepaintBoundary for performance
        RepaintBoundary(
          child: GestureDetector(
            onTap: onTap,
            child: Container(
              color: Colors.black,
              child: Center(
                child: AspectRatio(
                  aspectRatio: controller!.value.aspectRatio,
                  child: VideoPlayer(controller!),
                ),
              ),
            ),
          ),
        ),
        // Overlay (username, likes, etc)
        if (overlay != null) overlay!,
      ],
    );
  }
}