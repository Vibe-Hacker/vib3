import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';

// Global video controller manager to prevent resource exhaustion
class VideoControllerManager {
  static final List<VideoPlayerController> _activeControllers = [];
  static const int maxControllers = 3; // Limit active controllers
  
  static void addController(VideoPlayerController controller) {
    // Dispose oldest controllers if we have too many
    while (_activeControllers.length >= maxControllers) {
      final oldController = _activeControllers.removeAt(0);
      oldController.dispose();
    }
    _activeControllers.add(controller);
  }
  
  static void removeController(VideoPlayerController controller) {
    _activeControllers.remove(controller);
  }
  
  static int get activeCount => _activeControllers.length;
}

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
    // Only initialize when playing - no preloading at all
    if (widget.isPlaying) {
      _initializeVideo();
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
    // Remove preloading logic entirely
  }

  Future<void> _initializeVideo() async {
    try {
      // No delays - initialize immediately for best performance
      _controller = VideoPlayerController.networkUrl(
        Uri.parse(widget.videoUrl),
        videoPlayerOptions: VideoPlayerOptions(
          allowBackgroundPlayback: false,
          mixWithOthers: false,
          webOptions: const VideoPlayerWebOptions(
            allowRemotePlayback: false,
          ),
        ),
      );
      
      // Add to global controller manager
      VideoControllerManager.addController(_controller!);
      
      // Start initialization immediately
      _controller!.initialize().then((_) {
        if (mounted) {
          setState(() {
            _isInitialized = true;
            _hasError = false;
          });
          
          _controller!.setLooping(true);
          // Always seek to start to load first frame immediately
          _controller!.seekTo(Duration.zero);
          
          if (widget.isPlaying) {
            // Start playing immediately without delay
            _controller!.play();
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
    if (_controller != null) {
      VideoControllerManager.removeController(_controller!);
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
      return ClipRRect(
        borderRadius: BorderRadius.circular(20),
        child: Container(
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
        ),
      );
    }

    // Show black screen while initializing - no loading spinner
    if (!_isInitialized) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(20),
        child: Container(
          color: Colors.black,
          child: const Center(
            child: Icon(
            Icons.play_circle_outline,
            size: 80,
            color: Colors.white30,
            ),
          ),
        ),
      );
    }

    return GestureDetector(
      onTap: _togglePlayPause,
      child: Container(
        width: double.infinity,
        height: double.infinity,
        child: ClipRRect(
          borderRadius: BorderRadius.circular(20),
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
      ),
    );
  }
}