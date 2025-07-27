import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';
import 'package:http/http.dart' as http;
import '../services/video_player_manager.dart';
import '../services/video_performance_service.dart';
import '../services/buffer_management_service.dart';
import '../../../app/theme/app_theme.dart';

class VIB3VideoPlayer extends StatefulWidget {
  final String videoUrl;
  final bool isPlaying;
  final VoidCallback? onTap;
  final bool preload;
  final String? thumbnailUrl;
  final bool showControls;
  final BorderRadius? borderRadius;

  const VIB3VideoPlayer({
    super.key,
    required this.videoUrl,
    this.isPlaying = false,
    this.onTap,
    this.preload = false,
    this.thumbnailUrl,
    this.showControls = true,
    this.borderRadius,
  });

  @override
  State<VIB3VideoPlayer> createState() => _VIB3VideoPlayerState();
}

class _VIB3VideoPlayerState extends State<VIB3VideoPlayer> {
  VideoPlayerController? _controller;
  bool _isInitialized = false;
  bool _hasError = false;
  bool _isPaused = false;
  bool _showPlayIcon = false;
  int _retryCount = 0;
  bool _isDisposed = false;
  static const int _maxRetries = 2;
  bool _isInitializing = false;
  String? _thumbnailUrl;
  
  // Performance monitoring
  Timer? _performanceTimer;

  @override
  void initState() {
    super.initState();
    
    // Set thumbnail
    _thumbnailUrl = widget.thumbnailUrl;
    
    // Initialize immediately if we should play or preload
    if (widget.isPlaying || widget.preload) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted || _isDisposed) return;
        
        if (!_isInitialized && !_isInitializing) {
          _initializeVideo();
        }
      });
    }
  }

  @override
  void didUpdateWidget(VIB3VideoPlayer oldWidget) {
    super.didUpdateWidget(oldWidget);
    
    // Only recreate controller when URL actually changes
    if (oldWidget.videoUrl != widget.videoUrl) {
      _disposeController();
      _hasError = false;
      _isInitialized = false;
      _isInitializing = false;
      _retryCount = 0;
      
      // Schedule initialization after widget update
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted && (widget.isPlaying || widget.preload)) {
          _initializeVideo();
        }
      });
    }
    
    // Handle play state changes without recreating controller
    else if (oldWidget.isPlaying != widget.isPlaying) {
      if (widget.isPlaying) {
        if (_isInitialized && _controller != null) {
          // Resume playing
          VideoPlayerManager.instance.playVideo(_controller!);
          setState(() {
            _isPaused = false;
            _showPlayIcon = false;
          });
        } else if (!_isInitialized && !_isInitializing) {
          // Initialize if not already initialized
          _initializeVideo();
        }
      } else if (!widget.isPlaying && _isInitialized && _controller != null) {
        _controller?.pause();
      }
    }
  }

  Future<void> _initializeVideo() async {
    if (_isDisposed || _isInitializing) return;
    
    // Validate URL first
    if (widget.videoUrl.isEmpty) {
      setState(() {
        _hasError = true;
        _isInitialized = false;
      });
      return;
    }
    
    _isInitializing = true;
    
    try {
      // Dispose any existing controller first
      if (_controller != null) {
        try {
          await _controller!.dispose();
        } catch (e) {
          debugPrint('⚠️ Error disposing old controller: $e');
        }
        _controller = null;
      }
      
      // Create controller
      final uri = Uri.parse(widget.videoUrl);
      _controller = VideoPlayerController.networkUrl(
        uri,
        videoPlayerOptions: VideoPerformanceService().getOptimizedPlayerOptions(),
        httpHeaders: {
          'Connection': 'keep-alive',
          'Cache-Control': 'max-age=3600',
          'Accept': 'video/mp4,video/webm,video/*;q=0.9,*/*;q=0.8',
          'Accept-Encoding': 'identity',
          'User-Agent': 'VIB3/1.0 (Flutter)',
        },
      );
      
      // Initialize with timeout
      await _controller!.initialize().timeout(
        const Duration(seconds: 30),
        onTimeout: () {
          throw TimeoutException('Video initialization timed out');
        },
      );
      
      if (!mounted || _isDisposed) return;
      
      // Set looping and volume
      await _controller!.setLooping(true);
      await _controller!.setVolume(1.0);
      
      // Pause immediately after initialization if not playing
      if (!widget.isPlaying) {
        await _controller!.pause();
        await _controller!.seekTo(Duration.zero);
      }
      
      // Start performance monitoring
      _startPerformanceMonitoring();
      
      if (mounted) {
        setState(() {
          _isInitialized = true;
          _hasError = false;
        });
        
        // Handle play/pause state after initialization
        _handlePlayPause();
      }
      
      // Register with managers
      VideoPlayerManager.instance.registerController(_controller!);
      BufferManagementService().registerController(_controller!);
      
    } catch (e) {
      debugPrint('❌ VideoPlayer: Error initializing ${widget.videoUrl}: $e');
      
      if (_retryCount < _maxRetries && mounted) {
        _retryCount++;
        
        // Exponential backoff for retries
        await Future.delayed(Duration(milliseconds: 500 * _retryCount));
        
        if (mounted && widget.isPlaying && !_isDisposed) {
          _initializeVideo();
        }
      } else if (mounted) {
        setState(() {
          _hasError = true;
          _isInitialized = false;
        });
      }
    } finally {
      _isInitializing = false;
    }
  }

  void _handlePlayPause() async {
    if (_controller != null && _isInitialized && mounted && !_isDisposed) {
      if (widget.isPlaying) {
        try {
          await _controller!.play();
          VideoPlayerManager.instance.playVideo(_controller!);
          
          if (mounted && !_isDisposed) {
            setState(() {
              _isPaused = false;
              _showPlayIcon = false;
            });
          }
        } catch (e) {
          debugPrint('⚠️ Error playing video: $e');
        }
      } else {
        try {
          _controller?.pause();
        } catch (e) {
          debugPrint('⚠️ Error pausing video: $e');
        }
      }
    }
  }

  void _togglePlayPause() {
    if (_controller != null && _isInitialized && mounted) {
      setState(() {
        _isPaused = !_isPaused;
        _showPlayIcon = _isPaused;
      });

      try {
        if (_isPaused) {
          _controller!.pause();
        } else {
          VideoPlayerManager.instance.playVideo(_controller!);
        }
      } catch (e) {
        debugPrint('⚠️ Error toggling play/pause: $e');
        return;
      }

      // Hide play icon after 1 second when resuming
      if (!_isPaused) {
        Future.delayed(const Duration(milliseconds: 800), () {
          if (mounted) {
            setState(() {
              _showPlayIcon = false;
            });
          }
        });
      }

      // Call the onTap callback if provided
      widget.onTap?.call();
    }
  }

  void _disposeController() {
    _isDisposed = true;
    
    try {
      if (_controller != null) {
        // Unregister from managers
        try {
          VideoPlayerManager.instance.unregisterController(_controller!);
          BufferManagementService().unregisterController(_controller!);
        } catch (e) {
          debugPrint('⚠️ Error unregistering controller: $e');
        }
        
        // Pause and dispose
        try {
          _controller?.pause();
          _controller?.seekTo(Duration.zero);
          _controller?.dispose();
        } catch (e) {
          debugPrint('⚠️ Error disposing controller: $e');
        }
      }
      
      _controller = null;
      _isInitialized = false;
      _hasError = false;
      _retryCount = 0;
      
    } catch (e) {
      debugPrint('⚠️ Error disposing video controller: $e');
      _controller = null;
      _isInitialized = false;
    }
  }

  @override
  void dispose() {
    _isDisposed = true;
    _performanceTimer?.cancel();
    _disposeController();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // If we should be playing but not initialized, initialize now
    if ((widget.isPlaying || widget.preload) && !_isInitialized && !_isInitializing && !_hasError && !_isDisposed) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) _initializeVideo();
      });
    }
    
    // Don't show error screen during retries
    if (_hasError && _retryCount < _maxRetries) {
      return Container(color: Colors.black);
    }
    
    // Show error state
    if (_hasError) {
      return Container(
        color: Colors.black,
        child: Center(
          child: Icon(
            Icons.play_circle_outline,
            size: 60,
            color: Colors.white24,
          ),
        ),
      );
    }

    // Show thumbnail while initializing
    if (!_isInitialized) {
      return Container(
        color: Colors.black,
        child: _thumbnailUrl != null
            ? Image.network(
                _thumbnailUrl!,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) => Container(
                  color: Colors.black,
                ),
              )
            : null,
      );
    }

    // Main video player UI
    return GestureDetector(
      onTap: widget.showControls ? _togglePlayPause : widget.onTap,
      child: ClipRRect(
        borderRadius: widget.borderRadius ?? BorderRadius.circular(0),
        child: Container(
          width: double.infinity,
          height: double.infinity,
          color: Colors.black,
          child: Stack(
            fit: StackFit.expand,
            children: [
              // Video player
              if (_controller != null && _isInitialized && !_isDisposed)
                Center(
                  child: AspectRatio(
                    aspectRatio: _controller!.value.aspectRatio > 0 
                        ? _controller!.value.aspectRatio 
                        : 9/16,
                    child: VideoPlayer(_controller!),
                  ),
                ),
              
              // Play/Pause icon overlay
              if (widget.showControls && _showPlayIcon)
                Center(
                  child: AnimatedOpacity(
                    opacity: _showPlayIcon ? 1.0 : 0.0,
                    duration: const Duration(milliseconds: 200),
                    child: Container(
                      width: 80,
                      height: 80,
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.6),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        _isPaused ? Icons.play_arrow : Icons.pause,
                        color: Colors.white,
                        size: 40,
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
  
  // Start performance monitoring
  void _startPerformanceMonitoring() {
    _performanceTimer?.cancel();
    
    _performanceTimer = Timer.periodic(const Duration(seconds: 5), (timer) {
      if (_controller != null && _controller!.value.isInitialized && mounted) {
        VideoPerformanceService().analyzeAndOptimize(widget.videoUrl, _controller!);
      }
    });
  }
}