import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';

// Simplified - no global controller management

class VideoPlayerWidget extends StatefulWidget {
  final String videoUrl;
  final bool isPlaying;
  final VoidCallback? onTap;

  const VideoPlayerWidget({
    super.key,
    required this.videoUrl,
    this.isPlaying = false,
    this.onTap,
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
  static const int _maxRetries = 2;

  @override
  void initState() {
    super.initState();
    print('🎬 VideoPlayerWidget created for URL: ${widget.videoUrl}');
    print('🎬 Initial isPlaying: ${widget.isPlaying}');
    // Only initialize when playing - no preloading at all
    if (widget.isPlaying) {
      _initializeVideo();
    }
  }

  @override
  void didUpdateWidget(VideoPlayerWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    
    // Always dispose and recreate when URL changes
    if (oldWidget.videoUrl != widget.videoUrl) {
      _disposeController();
      _hasError = false;
      _isInitialized = false;
      if (widget.isPlaying) {
        _initializeVideo();
      }
    }
    
    // Handle play state changes
    if (oldWidget.isPlaying != widget.isPlaying) {
      if (widget.isPlaying && !_isInitialized && !_hasError) {
        _initializeVideo();
      } else if (!widget.isPlaying && _isInitialized) {
        _controller?.pause();
      } else if (widget.isPlaying && _isInitialized) {
        _controller?.play();
      }
    }
  }

  Future<void> _initializeVideo() async {
    try {
      print('🎬 VideoPlayer: Initializing video: ${widget.videoUrl}');
      
      _controller = VideoPlayerController.networkUrl(Uri.parse(widget.videoUrl));
      
      _controller!.initialize().then((_) {
        if (mounted) {
          setState(() {
            _isInitialized = true;
            _hasError = false;
          });
          
          print('✅ VideoPlayer: Successfully initialized ${widget.videoUrl}');
          
          _controller!.setLooping(true);
          _controller!.seekTo(Duration.zero);
          
          if (widget.isPlaying) {
            _controller!.play();
            print('▶️ VideoPlayer: Started playing');
          }
        }
      }).catchError((e) {
        print('❌ VideoPlayer: Error initializing ${widget.videoUrl}: $e');
        if (mounted) {
          setState(() {
            _hasError = true;
            _isInitialized = false;
          });
        }
      });
      
    } catch (e) {
      print('❌ VideoPlayer: Controller creation error: $e');
      if (mounted) {
        setState(() {
          _hasError = true;
          _isInitialized = false;
        });
      }
    }
  }

  void _handlePlayPause() {
    if (_controller != null && _isInitialized) {
      if (widget.isPlaying && !_isPaused) {
        _controller!.play();
        setState(() {
          _isPaused = false;
          _showPlayIcon = false;
        });
      } else {
        _controller!.pause();
        // Don't set _isPaused to true here because this might be from screen navigation
        // Only set _isPaused when user manually pauses
      }
    }
  }

  void _togglePlayPause() {
    if (_controller != null && _isInitialized) {
      setState(() {
        _isPaused = !_isPaused;
        _showPlayIcon = _isPaused;
      });

      if (_isPaused) {
        _controller!.pause();
      } else {
        _controller!.play();
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
    if (_controller != null) {
      _controller!.dispose();
      _controller = null;
    }
    _isInitialized = false;
  }

  @override
  void dispose() {
    _disposeController();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_hasError) {
      return Container(
        color: Colors.grey[900],
        child: const Center(
            child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.error_outline, size: 64, color: Colors.white54),
              SizedBox(height: 16),
              Text(
                'Failed to load video',
                style: TextStyle(color: Colors.white54),
              ),
            ],
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
      child: Container(
        width: double.infinity,
        height: double.infinity,
        child: Stack(
          children: [
              FittedBox(
                fit: BoxFit.cover,
                child: SizedBox(
                  width: _controller!.value.size.width,
                  height: _controller!.value.size.height,
                  child: VideoPlayer(_controller!),
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
    );
  }
}