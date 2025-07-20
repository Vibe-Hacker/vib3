import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';
import '../services/video_player_manager.dart';
import '../services/video_url_service.dart';
import '../services/adaptive_streaming_service.dart';
import '../services/adaptive_video_service.dart';

class VideoPlayerWidget extends StatefulWidget {
  final String videoUrl;
  final bool isPlaying;
  final VoidCallback? onTap;
  final bool preload;

  const VideoPlayerWidget({
    super.key,
    required this.videoUrl,
    this.isPlaying = false,
    this.onTap,
    this.preload = false,
  });

  @override
  State<VideoPlayerWidget> createState() => _VideoPlayerWidgetState();
}

class _VideoPlayerWidgetState extends State<VideoPlayerWidget> {
  VideoPlayerController? _controller;
  bool _isInitialized = false;
  bool _hasError = false;
  bool _isPaused = false;
  bool _showPlayIcon = false;
  int _retryCount = 0;
  bool _isDisposed = false;
  static const int _maxRetries = 1;
  bool _isInitializing = false;

  @override
  void initState() {
    super.initState();
    print('🎬 VideoPlayerWidget created for URL: ${widget.videoUrl}');
    print('🎬 Initial isPlaying: ${widget.isPlaying}, preload: ${widget.preload}');
    // Initialize video immediately if playing or preloading
    if (widget.isPlaying || widget.preload) {
      print('🚀 Calling _initializeVideo() because isPlaying=${widget.isPlaying} or preload=${widget.preload}');
      _initializeVideo();
    } else {
      print('⏸️ NOT initializing video because isPlaying=false and preload=false');
    }
  }

  @override
  void didUpdateWidget(VideoPlayerWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    
    // Only recreate controller when URL actually changes
    if (oldWidget.videoUrl != widget.videoUrl) {
      print('🎬 VideoPlayer: URL changed from ${oldWidget.videoUrl} to ${widget.videoUrl}');
      _disposeController();
      _hasError = false;
      _isInitialized = false;
      _retryCount = 0;
      if (widget.isPlaying) {
        _initializeVideo();
      }
    }
    
    // Handle play state changes without recreating controller
    else if (oldWidget.isPlaying != widget.isPlaying) {
      print('🎬 VideoPlayer: Play state changed from ${oldWidget.isPlaying} to ${widget.isPlaying}');
      print('🎬 VideoPlayer: Current state - _isInitialized=$_isInitialized, _hasError=$_hasError, _controller=${_controller != null}');
      if (widget.isPlaying && !_isInitialized && !_hasError) {
        print('🎬 VideoPlayer: Starting initialization...');
        _initializeVideo();
      } else if (!widget.isPlaying && _isInitialized) {
        _controller?.pause();
        // Keep videos in memory, don't dispose immediately
      } else if (widget.isPlaying && _isInitialized && _controller != null) {
        // Resume playing
        print('▶️ VideoPlayer: Resuming playback');
        VideoPlayerManager.instance.playVideo(_controller!);
        setState(() {
          _isPaused = false;
          _showPlayIcon = false;
        });
      }
    }
  }

  Future<void> _initializeVideo() async {
    if (_isDisposed || _isInitializing) return;
    
    // Validate URL first
    if (widget.videoUrl.isEmpty) {
      print('❌ VideoPlayer: Empty video URL provided');
      setState(() {
        _hasError = true;
        _isInitialized = false;
      });
      return;
    }
    
    _isInitializing = true;
    
    try {
      // Queue the initialization to prevent concurrent initializations
      await VideoPlayerManager.instance.queueVideoInit(() async {
        if (_isDisposed || !mounted) return;
      
      try {
        print('🎬 VideoPlayer: Initializing video: ${widget.videoUrl}');
        
        // Dispose any existing controller first
        if (_controller != null) {
          try {
            await _controller!.dispose();
          } catch (e) {
            print('⚠️ Error disposing old controller: $e');
          }
          _controller = null;
        }
        
        // Transform and validate URL
        print('🎬 Original video URL: ${widget.videoUrl}');
        final transformedUrl = VideoUrlService.transformVideoUrl(widget.videoUrl);
        print('🔄 Transformed URL: $transformedUrl');
        
        // Check video format from URL
        final videoFormat = transformedUrl.toLowerCase().contains('.webm') ? 'WebM' : 
                           transformedUrl.toLowerCase().contains('.mp4') ? 'MP4' : 
                           'Unknown';
        print('🎥 Video format detected: $videoFormat');
        
        // Extra validation
        if (transformedUrl.isEmpty || !transformedUrl.startsWith('http')) {
          throw Exception('Invalid video URL: $transformedUrl');
        }
        
        // Get optimal video URL based on device/network conditions
        final adaptiveVideoService = AdaptiveVideoService();
        // Skip quality optimization during preloading for faster init
        final optimalUrl = await adaptiveVideoService.getOptimalVideoUrl(
          transformedUrl, 
          fastMode: widget.preload
        );
        print('🎯 Optimal URL: $optimalUrl');
        
        final uri = Uri.parse(optimalUrl);
        print('🔗 Parsed URL - Host: ${uri.host}, Path: ${uri.path}');
        
        _controller = VideoPlayerController.networkUrl(
          uri,
          videoPlayerOptions: VideoPlayerOptions(
            mixWithOthers: false,
            allowBackgroundPlayback: false,
          ),
          httpHeaders: {
            'Connection': 'keep-alive',
            'Cache-Control': 'max-age=3600',
            'Accept-Encoding': 'gzip, deflate',
          },
        );
        
        // Simple initialization without complex timeout logic
        print('🎮 About to call _controller.initialize()...');
        await _controller!.initialize();
        print('✅ VideoPlayer: Successfully initialized ${widget.videoUrl}');
        
        if (!mounted || _isDisposed) return;
        
        if (mounted) {
          setState(() {
            _isInitialized = true;
            _hasError = false;
          });
          
          // Force a complete rebuild
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (mounted) {
              setState(() {});
              // Handle play/pause state after rebuild
              _handlePlayPause();
            }
          });
        }
        
        print('✅ VideoPlayer: Successfully initialized ${widget.videoUrl}');
        print('📐 Video size: ${_controller!.value.size}');
        print('⏱️ Duration: ${_controller!.value.duration}');
        print('🎬 Video format: ${_controller!.value.isInitialized ? "Supported" : "Not Supported"}');
        
        // Additional check for video size
        if (_controller!.value.size.width == 0 || _controller!.value.size.height == 0) {
          print('⚠️ Warning: Video has zero dimensions, may not display properly');
        }
        
        _controller!.setLooping(true);
        
        // Register with VideoPlayerManager
        VideoPlayerManager.instance.registerController(_controller!);
        
        // Start playing if this widget is marked as playing (not just preloading)
        if (widget.isPlaying && mounted && !_isDisposed) {
          // Play the video directly
          try {
            await _controller!.play();
            print('▶️ VideoPlayer: Started playing - isPlaying: ${_controller!.value.isPlaying}');
            
            // Also register with manager
            VideoPlayerManager.instance.playVideo(_controller!);
          } catch (e) {
            print('⚠️ Error starting playback: $e');
          }
        } else if (widget.preload && mounted && !_isDisposed) {
          // For preloaded videos, just pause after initialization
          try {
            await _controller!.pause();
            print('⏸️ VideoPlayer: Preloaded and paused');
          } catch (e) {
            print('⚠️ Error pausing preloaded video: $e');
          }
        }
        
      } catch (e, stackTrace) {
        print('❌ VideoPlayer: Error initializing ${widget.videoUrl}: $e');
        print('📊 Error type: ${e.runtimeType}');
        print('📝 Error details: ${e.toString()}');
        print('📍 Stack trace: $stackTrace');
        
        // Log more details about different error types
        if (e.toString().contains('MediaCodec') || e.toString().contains('ExoPlaybackException')) {
          print('🎥 Video codec issue detected - video may need re-encoding');
          print('📹 Video URL: ${widget.videoUrl}');
          print('⚠️ This usually happens with HEVC/H.265 encoded videos or unusual resolutions');
        } else if (e.toString().contains('timeout')) {
          print('⏱️ Network timeout - video took too long to load');
          print('🌐 This may be due to slow network or large file size');
        } else if (e.toString().contains('404') || e.toString().contains('403')) {
          print('🚫 Access denied or file not found');
          print('🔑 Check if the video URL is valid and accessible');
        } else if (e.toString().contains('FormatException') || e.toString().contains('Invalid')) {
          print('🔗 Invalid URL format detected');
          print('📹 Raw URL: ${widget.videoUrl}');
        }
        
        if (_retryCount < _maxRetries && mounted) {
          _retryCount++;
          print('🔄 Retrying video initialization (attempt $_retryCount/$_maxRetries)...');
          
          // Exponential backoff for retries
          await Future.delayed(Duration(milliseconds: 500 * _retryCount));
          
          if (mounted && widget.isPlaying && !_isDisposed) {
            _initializeVideo();  // This will queue another attempt
          }
        } else if (mounted) {
          // Emergency cleanup on persistent errors
          await VideoPlayerManager.emergencyCleanup();
          setState(() {
            _hasError = true;
            _isInitialized = false;
          });
        }
      }
    });
    } finally {
      _isInitializing = false;
    }
  }

  void _handlePlayPause() async {
    if (_controller != null && _isInitialized && mounted && !_isDisposed) {
      if (widget.isPlaying) {
        // Play directly and through manager
        try {
          await _controller!.play();
          VideoPlayerManager.instance.playVideo(_controller!);
          print('▶️ _handlePlayPause: Playing video - isPlaying: ${_controller!.value.isPlaying}');
          
          if (mounted && !_isDisposed) {
            setState(() {
              _isPaused = false;
              _showPlayIcon = false;
            });
          }
        } catch (e) {
          print('⚠️ Error playing video: $e');
        }
      } else {
        try {
          _controller?.pause();
        } catch (e) {
          print('⚠️ Error pausing video: $e');
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
        print('⚠️ Error toggling play/pause: $e');
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
    print('🗑️ VideoPlayer: Disposing controller');
    _isDisposed = true;
    
    try {
      if (_controller != null) {
        // Unregister from VideoPlayerManager
        VideoPlayerManager.instance.unregisterController(_controller!);
        
        // First pause the video if playing
        try {
          _controller?.pause();
        } catch (e) {
          // Ignore pause errors during disposal
        }
        
        // Dispose the controller
        _controller?.dispose();
      }
      
      _controller = null;
      _isInitialized = false;
      _hasError = false;
      _retryCount = 0;
      
    } catch (e) {
      print('⚠️ Error disposing video controller: $e');
      // Force null even if dispose failed
      _controller = null;
      _isInitialized = false;
    }
  }

  @override
  void dispose() {
    _disposeController();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    print('🎨 VideoPlayerWidget build: _isInitialized=$_isInitialized, _controller=${_controller != null}, isPlaying=${widget.isPlaying}');
    
    // Don't show error screen during retries, just show black
    if (_hasError && _retryCount < _maxRetries) {
      // Still retrying, show black screen
      return Container(
        color: Colors.black,
      );
    }
    
    // Only show error after all retries failed
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

    // Show black screen while initializing - no loading indicator
    if (!_isInitialized) {
      return Container(
        color: Colors.black,
      );
    }

    return GestureDetector(
      onTap: _togglePlayPause,
      child: ClipRRect(
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(30),
          bottom: Radius.circular(30),
        ),
        child: Container(
          width: double.infinity,
          height: double.infinity,
          color: Colors.black,
          child: Stack(
            fit: StackFit.expand,
            children: [
              // Video player that fills the container with cover fit
              if (_controller != null && _isInitialized && !_isDisposed)
                Positioned.fill(
                  child: FittedBox(
                    fit: BoxFit.cover,
                    alignment: Alignment.center,
                    clipBehavior: Clip.hardEdge,
                    child: SizedBox(
                      width: _controller!.value.size.width,
                      height: _controller!.value.size.height,
                      child: VideoPlayer(_controller!),
                    ),
                  ),
                ),
            // Play/Pause icon overlay
            if (_showPlayIcon)
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
}