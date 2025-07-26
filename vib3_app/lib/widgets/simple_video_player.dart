import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';

class SimpleVideoPlayer extends StatefulWidget {
  final String videoUrl;
  final bool isPlaying;

  const SimpleVideoPlayer({
    super.key,
    required this.videoUrl,
    required this.isPlaying,
  });

  @override
  State<SimpleVideoPlayer> createState() => _SimpleVideoPlayerState();
}

class _SimpleVideoPlayerState extends State<SimpleVideoPlayer> {
  VideoPlayerController? _controller;
  bool _isInitialized = false;
  bool _hasError = false;

  @override
  void initState() {
    super.initState();
    print('🎬 SimpleVideoPlayer initState: ${widget.videoUrl}');
    if (widget.isPlaying) {
      _initializeVideo();
    }
  }

  @override
  void didUpdateWidget(SimpleVideoPlayer oldWidget) {
    super.didUpdateWidget(oldWidget);
    
    if (oldWidget.videoUrl != widget.videoUrl) {
      _disposeController();
      if (widget.isPlaying) {
        _initializeVideo();
      }
    } else if (oldWidget.isPlaying != widget.isPlaying) {
      if (widget.isPlaying && !_isInitialized) {
        _initializeVideo();
      } else if (!widget.isPlaying && _controller != null) {
        _controller?.pause();
      }
    }
  }

  Future<void> _initializeVideo() async {
    try {
      print('🎬 Initializing video: ${widget.videoUrl}');
      
      final controller = VideoPlayerController.networkUrl(
        Uri.parse(widget.videoUrl),
        videoPlayerOptions: VideoPlayerOptions(
          mixWithOthers: false,
        ),
      );

      await controller.initialize();
      
      if (mounted) {
        setState(() {
          _controller = controller;
          _isInitialized = true;
          _hasError = false;
        });
        
        if (widget.isPlaying) {
          await controller.play();
          await controller.setLooping(true);
        }
      } else {
        controller.dispose();
      }
    } catch (e) {
      print('❌ Error initializing video: $e');
      if (mounted) {
        setState(() {
          _hasError = true;
          _isInitialized = false;
        });
      }
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
        color: Colors.black,
        child: const Center(
          child: Icon(Icons.error_outline, color: Colors.white, size: 48),
        ),
      );
    }

    if (!_isInitialized) {
      return Container(
        color: Colors.black,
        child: const Center(
          child: CircularProgressIndicator(color: Colors.white),
        ),
      );
    }

    return Container(
      color: Colors.black,
      child: Center(
        child: AspectRatio(
          aspectRatio: _controller!.value.aspectRatio,
          child: VideoPlayer(_controller!),
        ),
      ),
    );
  }
}