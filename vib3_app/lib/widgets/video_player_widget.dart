import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';

class VideoPlayerWidget extends StatefulWidget {
  final String videoUrl;
  final bool isPlaying;
  final bool preload;
  final VoidCallback? onTap;

  const VideoPlayerWidget({
    super.key,
    required this.videoUrl,
    this.isPlaying = false,
    this.preload = false,
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
    // Initialize for playing videos immediately, preload videos with delay
    if (widget.isPlaying) {
      _initializeVideo();
    } else if (widget.preload) {
      // Delay preloading to avoid resource conflicts
      Future.delayed(const Duration(milliseconds: 500), () {
        if (mounted && !_isInitialized) {
          _initializeVideo();
        }
      });
    }
  }

  @override
  void didUpdateWidget(VideoPlayerWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.videoUrl != widget.videoUrl) {
      _disposeController();
      _retryCount = 0; // Reset retry count for new video
      _initializeVideo();
    }
    if (oldWidget.isPlaying != widget.isPlaying) {
      if (widget.isPlaying && !_isInitialized) {
        // Initialize video when it becomes current
        _initializeVideo();
      } else if (_isInitialized) {
        _handlePlayPause();
      }
    }
    if (oldWidget.preload != widget.preload && widget.preload && !_isInitialized) {
      // Handle preload changes with delay
      Future.delayed(const Duration(milliseconds: 300), () {
        if (mounted && !_isInitialized) {
          _initializeVideo();
        }
      });
    }
  }

  Future<void> _initializeVideo() async {
    try {
      // Only delay for preloaded videos, not current video
      if (!widget.isPlaying) {
        await Future.delayed(const Duration(milliseconds: 200));
      }
      
      _controller = VideoPlayerController.networkUrl(
        Uri.parse(widget.videoUrl),
        videoPlayerOptions: VideoPlayerOptions(
          allowBackgroundPlayback: false,
          mixWithOthers: false,
        ),
      );
      
      // Start initialization immediately
      _controller!.initialize().then((_) {
        if (mounted) {
          setState(() {
            _isInitialized = true;
            _hasError = false;
          });
          
          _controller!.setLooping(true);
          if (widget.isPlaying) {
            _controller!.play();
          } else if (widget.preload) {
            // Preload first frame
            _controller!.seekTo(Duration.zero);
          }
        }
      }).catchError((e) {
        print('Video initialization error (attempt ${_retryCount + 1}): $e');
        if (_retryCount < _maxRetries && mounted) {
          _retryCount++;
          print('Retrying video initialization in 1 second...');
          Future.delayed(const Duration(seconds: 1), () {
            if (mounted) {
              _disposeController();
              _initializeVideo();
            }
          });
        } else if (mounted) {
          setState(() {
            _hasError = true;
            _isInitialized = false;
          });
        }
      });
      
    } catch (e) {
      print('Video controller creation error: $e');
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
    _controller?.dispose();
    _controller = null;
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

    // Show loading indicator while initializing
    if (!_isInitialized) {
      return Container(
        color: Colors.black,
        child: const Center(
          child: CircularProgressIndicator(
            color: Color(0xFFFF0080),
            strokeWidth: 2,
          ),
        ),
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