import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';
import 'package:http/http.dart' as http;
import '../services/video_player_manager.dart';
import '../services/video_url_service.dart';
import '../services/adaptive_streaming_service.dart';
import '../services/adaptive_video_service.dart';
import '../services/intelligent_cache_manager.dart';
import '../services/thumbnail_service.dart';
import '../services/intelligent_cache_manager.dart';
import '../services/hls_streaming_service.dart';
import 'package:dio/dio.dart';
import 'dart:io';

class VideoPlayerWidget extends StatefulWidget {
  final String videoUrl;
  final bool isPlaying;
  final VoidCallback? onTap;
  final bool preload;
  final String? thumbnailUrl;

  VideoPlayerWidget({
    super.key,
    required this.videoUrl,
    this.isPlaying = false,
    this.onTap,
    this.preload = false,
    this.thumbnailUrl,
  }) {
    print('🎬 VideoPlayerWidget constructor: videoUrl=$videoUrl, isPlaying=$isPlaying, preload=$preload, key=$key');
  }

  @override
  State<VideoPlayerWidget> createState() {
    print('🎬 VideoPlayerWidget.createState() called');
    return _VideoPlayerWidgetState();
  }
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
  String? _thumbnailUrl;
  
  // Cache manager instance
  final IntelligentCacheManager _cacheManager = IntelligentCacheManager();

  @override
  void initState() {
    super.initState();
    print('🎬 VideoPlayerWidget.initState() called');
    print('🎬 URL: ${widget.videoUrl}');
    print('🎬 isPlaying: ${widget.isPlaying}, preload: ${widget.preload}');
    print('🎬 Widget key: ${widget.key}');
    
    // Load thumbnail immediately
    _loadThumbnail();
    
    // Initialize based on play state or preload flag
    if (widget.isPlaying || widget.preload) {
      print('🚀 Will initialize video because isPlaying=${widget.isPlaying}, preload=${widget.preload}');
      // Initialize immediately without delay
      if (!_isInitialized && !_isInitializing) {
        _initializeVideo();
      }
    } else {
      print('⏸️ Not initializing video - isPlaying=false, preload=false');
    }
  }
  
  static int _preloadCounter = 0;
  
  Future<void> _loadThumbnail() async {
    // Try to get thumbnail URL from video URL
    final thumbnailUrl = await ThumbnailService.generateThumbnailUrl(widget.videoUrl);
    if (mounted && thumbnailUrl != null) {
      setState(() {
        _thumbnailUrl = thumbnailUrl;
      });
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
    
    // Handle preload state changes
    else if (oldWidget.preload != widget.preload && widget.preload && !_isInitialized) {
      print('🎬 VideoPlayer: Preload enabled, initializing...');
      _initializeVideo();
    }
    
    // Handle play state changes without recreating controller
    else if (oldWidget.isPlaying != widget.isPlaying) {
      print('🎬 VideoPlayer: Play state changed from ${oldWidget.isPlaying} to ${widget.isPlaying}');
      print('🎬 VideoPlayer: Current state - _isInitialized=$_isInitialized, _hasError=$_hasError, _controller=${_controller != null}');
      if (widget.isPlaying) {
        if (_isInitialized && _controller != null) {
          // Resume playing
          print('▶️ VideoPlayer: Resuming playback');
          VideoPlayerManager.instance.playVideo(_controller!);
          setState(() {
            _isPaused = false;
            _showPlayIcon = false;
          });
        } else if (!_isInitialized && !_isInitializing && !_hasError) {
          // Initialize if not already initialized
          print('🎬 VideoPlayer: Initializing video because isPlaying changed to true');
          _initializeVideo();
        }
      } else if (!widget.isPlaying && _isInitialized && _controller != null) {
        _controller?.pause();
        // Don't dispose immediately - keep in memory for smoother scrolling
      }
    }
  }

  Future<void> _initializeVideo() async {
    print('🎮 _initializeVideo called for ${widget.videoUrl}');
    print('🎮 Current state: _isDisposed=$_isDisposed, _isInitializing=$_isInitializing, _controller=${_controller != null}');
    
    if (_isDisposed || _isInitializing) {
      print('⚠️ Skipping initialization: disposed=$_isDisposed, initializing=$_isInitializing');
      return;
    }
    
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
        final hlsService = HLSStreamingService();
        
        // Check if we should use HLS
        String optimalUrl;
        if (hlsService.isHLSUrl(transformedUrl)) {
          // Already HLS, get optimal variant
          optimalUrl = await hlsService.getOptimalHLSVariant(transformedUrl);
          print('🎯 HLS variant selected: $optimalUrl');
        } else {
          // Regular video, use adaptive service
          optimalUrl = await adaptiveVideoService.getOptimalVideoUrl(
            transformedUrl, 
            fastMode: widget.preload
          );
          print('🎯 Optimal URL: $optimalUrl');
        }
        
        // Track this video view for predictive caching
        _cacheManager.trackVideoView(optimalUrl);
        
        // Check cache first using member variable cache manager
        final cachedFile = await _cacheManager.getVideo(optimalUrl);
        
        if (cachedFile != null && await cachedFile.exists()) {
          print('💾 Loading video from cache: ${cachedFile.path}');
          _controller = VideoPlayerController.file(
            cachedFile,
            videoPlayerOptions: VideoPlayerOptions(
              mixWithOthers: false,
              allowBackgroundPlayback: false,
            ),
          );
        } else {
          print('🌐 Loading video from network: $optimalUrl');
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
              'Accept': '*/*',
              'User-Agent': 'VIB3/1.0 (Flutter)',
              // Remove Range header to see if it's causing issues
              // 'Range': 'bytes=0-', // Enable range requests for progressive download
            },
          );
          
          // Download and cache video in background
          _cacheVideoInBackground(optimalUrl);
        }
        
        // Simple initialization without complex timeout logic
        print('🎮 About to call _controller.initialize()...');
        await _controller!.initialize();
        print('✅ VideoPlayer: Successfully initialized ${widget.videoUrl}');
        print('📊 Video info: ${_controller!.value.size.width}x${_controller!.value.size.height}, duration: ${_controller!.value.duration}');
        print('🎬 Video initialized: ${_controller!.value.isInitialized}');
        print('▶️ Video playing: ${_controller!.value.isPlaying}');
        print('🔊 Video volume: ${_controller!.value.volume}');
        
        if (!mounted || _isDisposed) return;
        
        // Set looping and volume
        await _controller!.setLooping(true);
        await _controller!.setVolume(1.0);
        
        // Set playback speed to reduce decoder load if needed
        if (!widget.isPlaying) {
          // For preloaded videos, pause immediately to save resources
          await _controller!.pause();
          await _controller!.seekTo(Duration.zero);
        }
        
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
        
        // Register with VideoPlayerManager
        VideoPlayerManager.instance.registerController(_controller!);
        
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
          
          // Add detailed logging
          print('▶️ _handlePlayPause: Playing video - isPlaying: ${_controller!.value.isPlaying}');
          print('📊 Video state: buffering=${_controller!.value.isBuffering}, initialized=${_controller!.value.isInitialized}');
          print('🎥 Video position: ${_controller!.value.position} / ${_controller!.value.duration}');
          print('📐 Video size: ${_controller!.value.size}');
          print('🔊 Volume: ${_controller!.value.volume}');
          
          // Check if video is actually progressing
          Future.delayed(Duration(seconds: 1), () {
            if (mounted && _controller != null) {
              print('⏱️ After 1 second - Position: ${_controller!.value.position}, Playing: ${_controller!.value.isPlaying}');
            }
          });
          
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

  Future<void> _cacheVideoInBackground(String videoUrl) async {
    try {
      print('📥 Starting background cache for: $videoUrl');
      final dio = Dio();
      final response = await dio.get(
        videoUrl,
        options: Options(
          responseType: ResponseType.bytes,
          headers: {
            'Connection': 'keep-alive',
            'Cache-Control': 'max-age=3600',
            'Accept-Encoding': 'gzip, deflate',
          },
        ),
      );
      
      if (response.statusCode == 200 && response.data != null) {
        final cacheManager = IntelligentCacheManager();
        await cacheManager.cacheVideo(videoUrl, response.data as List<int>);
        print('✅ Video cached successfully: $videoUrl');
      }
    } catch (e) {
      print('⚠️ Background caching failed: $e');
      // Don't throw - this is a background operation
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
    
    if (_controller != null && _isInitialized) {
      print('🎬 Controller state: playing=${_controller!.value.isPlaying}, buffering=${_controller!.value.isBuffering}');
      print('📐 Video dimensions: ${_controller!.value.size.width}x${_controller!.value.size.height}');
      print('⏱️ Position: ${_controller!.value.position} / ${_controller!.value.duration}');
    }
    
    // If we're supposed to be playing but controller isn't actually playing, play it
    if (widget.isPlaying && _controller != null && _isInitialized && !_controller!.value.isPlaying && !_isPaused) {
      print('⚠️ Controller not playing when it should be - attempting to play');
      Future.microtask(() {
        if (mounted && _controller != null) {
          VideoPlayerManager.instance.playVideo(_controller!);
        }
      });
    }
    
    // If we should be playing but not initialized, initialize now
    if (widget.isPlaying && !_isInitialized && !_isInitializing && !_hasError) {
      print('⚠️ Video should be playing but not initialized - initializing now');
      Future.microtask(() {
        if (mounted) {
          _initializeVideo();
        }
      });
    }
    
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

    // Show thumbnail while initializing if available
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
                  child: Center(
                    child: AspectRatio(
                      aspectRatio: _controller!.value.aspectRatio > 0 
                          ? _controller!.value.aspectRatio 
                          : 9/16, // Default to portrait if aspect ratio is invalid
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