import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';
import 'dart:io';

/// Simplified video player with better error handling and codec compatibility
class SimpleVideoPlayer extends StatefulWidget {
  final String videoPath;
  final VoidCallback? onError;
  
  const SimpleVideoPlayer({
    super.key,
    required this.videoPath,
    this.onError,
  });
  
  @override
  State<SimpleVideoPlayer> createState() => _SimpleVideoPlayerState();
}

class _SimpleVideoPlayerState extends State<SimpleVideoPlayer> {
  VideoPlayerController? _controller;
  bool _isInitialized = false;
  bool _hasError = false;
  String _errorMessage = '';
  
  @override
  void initState() {
    super.initState();
    _initializePlayer();
  }
  
  @override
  void dispose() {
    _controller?.pause();
    _controller?.dispose();
    super.dispose();
  }
  
  Future<void> _initializePlayer() async {
    try {
      print('\n=== SimpleVideoPlayer: Initializing ===');
      print('Video path: ${widget.videoPath}');
      
      final file = File(widget.videoPath);
      
      // Verify file exists
      if (!file.existsSync()) {
        throw Exception('Video file not found');
      }
      
      final fileSize = file.lengthSync();
      print('File size: $fileSize bytes');
      
      if (fileSize == 0) {
        throw Exception('Video file is empty');
      }
      
      // Create controller with minimal options for better compatibility
      _controller = VideoPlayerController.file(
        file,
        videoPlayerOptions: VideoPlayerOptions(
          mixWithOthers: false, // Disable mixing to avoid conflicts
        ),
      );
      
      // Set error listener
      _controller!.addListener(_videoListener);
      
      // Initialize with timeout
      await _controller!.initialize().timeout(
        const Duration(seconds: 10),
        onTimeout: () {
          throw Exception('Video initialization timeout');
        },
      );
      
      print('Video initialized successfully');
      print('Duration: ${_controller!.value.duration}');
      print('Size: ${_controller!.value.size}');
      
      // Start playing
      await _controller!.play();
      await _controller!.setLooping(true);
      
      if (mounted) {
        setState(() {
          _isInitialized = true;
        });
      }
      
      print('=== SimpleVideoPlayer: Success ===\n');
      
    } catch (e) {
      print('\n=== SimpleVideoPlayer: ERROR ===');
      print('Error: $e');
      print('===============================\n');
      
      if (mounted) {
        setState(() {
          _hasError = true;
          _errorMessage = e.toString();
        });
      }
      
      widget.onError?.call();
    }
  }
  
  void _videoListener() {
    if (_controller != null && _controller!.value.hasError) {
      print('Video player error: ${_controller!.value.errorDescription}');
      if (mounted) {
        setState(() {
          _hasError = true;
          _errorMessage = _controller!.value.errorDescription ?? 'Unknown error';
        });
      }
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
              const Icon(
                Icons.error_outline,
                color: Colors.red,
                size: 64,
              ),
              const SizedBox(height: 16),
              const Text(
                'Failed to load video',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 32),
                child: Text(
                  _errorMessage,
                  style: const TextStyle(
                    color: Colors.white70,
                    fontSize: 14,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
              const SizedBox(height: 24),
              ElevatedButton.icon(
                onPressed: () {
                  setState(() {
                    _hasError = false;
                    _errorMessage = '';
                  });
                  _initializePlayer();
                },
                icon: const Icon(Icons.refresh),
                label: const Text('Retry'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF00CED1),
                ),
              ),
            ],
          ),
        ),
      );
    }
    
    if (!_isInitialized || _controller == null) {
      return Container(
        color: Colors.black,
        child: const Center(
          child: CircularProgressIndicator(
            color: Color(0xFF00CED1),
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
}