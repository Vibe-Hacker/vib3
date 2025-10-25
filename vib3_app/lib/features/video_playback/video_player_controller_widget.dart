import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';
import '../../services/video_player_manager.dart';

/// Pure video player controller widget that only handles video playback
/// Separated from UI concerns and social features
class VideoPlayerControllerWidget extends StatefulWidget {
  final String videoUrl;
  final bool isPlaying;
  final bool isFrontCamera;
  final Function(VideoPlayerController?)? onControllerReady;
  final VoidCallback? onError;
  final VoidCallback? onTap;

  const VideoPlayerControllerWidget({
    super.key,
    required this.videoUrl,
    required this.isPlaying,
    this.isFrontCamera = false,
    this.onControllerReady,
    this.onError,
    this.onTap,
  });

  @override
  State<VideoPlayerControllerWidget> createState() => _VideoPlayerControllerWidgetState();
}

class _VideoPlayerControllerWidgetState extends State<VideoPlayerControllerWidget> {
  VideoPlayerController? _controller;
  bool _isInitialized = false;
  bool _hasError = false;
  bool _isDisposed = false;

  @override
  void initState() {
    super.initState();
    if (widget.isPlaying) {
      _initializeVideo();
    }
  }

  @override
  void didUpdateWidget(VideoPlayerControllerWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    
    if (oldWidget.videoUrl != widget.videoUrl) {
      _disposeController();
      _hasError = false;
      _isInitialized = false;
      if (widget.isPlaying) {
        _initializeVideo();
      }
    } else if (oldWidget.isPlaying != widget.isPlaying) {
      if (widget.isPlaying && !_isInitialized && !_hasError) {
        _initializeVideo();
      } else if (!widget.isPlaying && _controller != null) {
        _controller!.pause();
        _disposeController();
      }
    }
  }

  Future<void> _initializeVideo() async {
    if (_isDisposed) return;
    
    try {
      // Cleanup before initializing
      await VideoPlayerManager.nuclearCleanup();
      
      _controller = VideoPlayerController.networkUrl(
        Uri.parse(widget.videoUrl),
        videoPlayerOptions: VideoPlayerOptions(
          mixWithOthers: false,
          allowBackgroundPlayback: false,
        ),
      );
      
      await _controller!.initialize();
      
      if (!mounted || _isDisposed) {
        _controller?.dispose();
        return;
      }
      
      setState(() {
        _isInitialized = true;
        _hasError = false;
      });
      
      // Register with manager
      VideoPlayerManager.instance.registerController(_controller!);
      
      // Set up looping
      _controller!.setLooping(true);
      
      // Notify parent
      widget.onControllerReady?.call(_controller);
      
      // Start playing if requested
      if (widget.isPlaying && mounted) {
        // Set as active controller
        await VideoPlayerManager.instance.playVideo(_controller!);
      }
      
    } catch (e) {
      print('❌ VideoPlayerController: Error initializing: $e');
      
      if (mounted && !_isDisposed) {
        setState(() {
          _hasError = true;
          _isInitialized = false;
        });
        
        // Notify parent of error
        widget.onError?.call();
        
        // Emergency cleanup on error
        await VideoPlayerManager.emergencyCleanup();
      }
    }
  }

  void _disposeController() {
    _isDisposed = true;
    
    if (_controller != null) {
      VideoPlayerManager.instance.unregisterController(_controller!);
      _controller!.dispose();
      _controller = null;
    }
    
    if (mounted) {
      setState(() {
        _isInitialized = false;
      });
    }
  }

  @override
  void dispose() {
    _disposeController();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_hasError) {
      return GestureDetector(
        onTap: widget.onTap,
        child: Container(
          color: Colors.black,
          child: const Center(
            child: Icon(
              Icons.error_outline,
              color: Colors.white54,
              size: 48,
            ),
          ),
        ),
      );
    }

    if (!_isInitialized || _controller == null) {
      return Container(color: Colors.black);
    }

    print('📹 VideoPlayerControllerWidget: isFrontCamera=${widget.isFrontCamera}, applying Transform=${widget.isFrontCamera}');
    return GestureDetector(
      onTap: widget.onTap,
      child: widget.isFrontCamera
          ? Transform(
              alignment: Alignment.center,
              transform: Matrix4.rotationY(3.14159),
              child: VideoPlayer(_controller!),
            )
          : VideoPlayer(_controller!),
    );
  }
}