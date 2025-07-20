import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';
import '../services/video_preload_manager.dart';

/// Simple video player that uses preloaded controllers
class PreloadedVideoPlayer extends StatefulWidget {
  final String videoUrl;
  final bool isPlaying;
  
  const PreloadedVideoPlayer({
    Key? key,
    required this.videoUrl,
    required this.isPlaying,
  }) : super(key: key);
  
  @override
  State<PreloadedVideoPlayer> createState() => _PreloadedVideoPlayerState();
}

class _PreloadedVideoPlayerState extends State<PreloadedVideoPlayer> {
  VideoPlayerController? _controller;
  bool _isInitialized = false;
  bool _hasError = false;
  final _preloadManager = VideoPreloadManager();
  
  @override
  void initState() {
    super.initState();
    _loadController();
  }
  
  @override
  void didUpdateWidget(PreloadedVideoPlayer oldWidget) {
    super.didUpdateWidget(oldWidget);
    
    if (oldWidget.videoUrl != widget.videoUrl) {
      _loadController();
    } else if (oldWidget.isPlaying != widget.isPlaying) {
      if (widget.isPlaying) {
        _controller?.play();
      } else {
        _controller?.pause();
      }
    }
  }
  
  Future<void> _loadController() async {
    setState(() {
      _hasError = false;
      _isInitialized = false;
    });
    
    try {
      final controller = await _preloadManager.getController(widget.videoUrl);
      
      if (controller != null && mounted) {
        setState(() {
          _controller = controller;
          _isInitialized = true;
        });
        
        if (widget.isPlaying) {
          controller.play();
        }
      } else {
        setState(() {
          _hasError = true;
        });
      }
    } catch (e) {
      print('Error loading video: $e');
      setState(() {
        _hasError = true;
      });
    }
  }
  
  @override
  Widget build(BuildContext context) {
    if (_hasError) {
      return Container(
        color: Colors.black,
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.error_outline, color: Colors.white54, size: 48),
              SizedBox(height: 16),
              Text(
                'Unable to load video',
                style: TextStyle(color: Colors.white54),
              ),
            ],
          ),
        ),
      );
    }
    
    if (!_isInitialized || _controller == null) {
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
  
  @override
  void dispose() {
    // Don't dispose controller - let preload manager handle it
    super.dispose();
  }
}