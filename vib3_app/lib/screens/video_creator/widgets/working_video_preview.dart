import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';
import 'package:provider/provider.dart';
import 'dart:io';
import '../providers/creation_state_provider.dart';
import '../video_creator_screen.dart';

class WorkingVideoPreview extends StatefulWidget {
  final Function(CreatorMode) onModeChange;
  
  const WorkingVideoPreview({
    super.key,
    required this.onModeChange,
  });
  
  @override
  State<WorkingVideoPreview> createState() => _WorkingVideoPreviewState();
}

class _WorkingVideoPreviewState extends State<WorkingVideoPreview> {
  VideoPlayerController? _controller;
  bool _isPlaying = false;
  bool _hasError = false;
  
  @override
  void initState() {
    super.initState();
    // Small delay to ensure provider is ready
    Future.delayed(const Duration(milliseconds: 100), () {
      if (mounted) {
        _initVideo();
      }
    });
  }
  
  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }
  
  Future<void> _initVideo() async {
    try {
      print('\n=== WorkingVideoPreview: _initVideo START ===');
      final provider = context.read<CreationStateProvider>();
      print('Provider clips count: ${provider.videoClips.length}');
      
      if (provider.videoClips.isEmpty) {
        print('No video clips available, waiting...');
        // Wait and retry
        await Future.delayed(const Duration(milliseconds: 500));
        if (mounted && context.read<CreationStateProvider>().videoClips.isNotEmpty) {
          print('Clips now available, retrying...');
          _initVideo();
        }
        return;
      }
      
      final videoPath = provider.videoClips.first.path;
      print('Video path: $videoPath');
      
      final videoFile = File(videoPath);
      
      // Wait to ensure file is ready
      await Future.delayed(const Duration(milliseconds: 300));
      
      // Check file exists and size
      if (!await videoFile.exists()) {
        throw Exception('Video file does not exist at path: $videoPath');
      }
      
      final fileSize = await videoFile.length();
      print('Video file size: $fileSize bytes');
      
      if (fileSize == 0) {
        throw Exception('Video file is empty');
      }
      
      // Dispose old controller if exists
      if (_controller != null) {
        await _controller!.dispose();
        _controller = null;
      }
      
      print('Creating video controller...');
      // Create controller with error handling
      _controller = VideoPlayerController.file(
        videoFile,
        videoPlayerOptions: VideoPlayerOptions(mixWithOthers: true),
      );
      
      print('Initializing video controller...');
      await _controller!.initialize();
      
      print('Video initialized successfully');
      print('Video dimensions: ${_controller!.value.size}');
      print('Duration: ${_controller!.value.duration}');
      
      await _controller!.setLooping(true);
      
      if (mounted) {
        setState(() {});
        _controller!.play();
        _isPlaying = true;
        print('Video playback started');
      }
      
      print('=== WorkingVideoPreview: _initVideo SUCCESS ===\n');
    } catch (e, stack) {
      print('\n=== WorkingVideoPreview: ERROR ===');
      print('Error: $e');
      print('Stack trace: $stack');
      print('=================================\n');
      
      if (mounted) {
        setState(() {
          _hasError = true;
        });
        
        // Show error to user
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Video loading error: ${e.toString()}'),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 4),
          ),
        );
      }
    }
  }
  
  @override
  Widget build(BuildContext context) {
    final creationState = context.watch<CreationStateProvider>();
    
    return Stack(
      children: [
        // Background
        Container(color: Colors.black),
        
        // Video or loading
        if (_hasError)
          Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(
                  Icons.error_outline,
                  color: Colors.red,
                  size: 60,
                ),
                const SizedBox(height: 16),
                const Text(
                  'Error loading video',
                  style: TextStyle(color: Colors.white),
                ),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () {
                    setState(() {
                      _hasError = false;
                    });
                    _initVideo();
                  },
                  child: const Text('Retry'),
                ),
              ],
            ),
          )
        else if (_controller != null && _controller!.value.isInitialized)
          Center(
            child: AspectRatio(
              aspectRatio: _controller!.value.aspectRatio,
              child: VideoPlayer(_controller!),
            ),
          )
        else
          const Center(
            child: CircularProgressIndicator(
              color: Color(0xFF00CED1),
            ),
          ),
        
        // Play/Pause button
        if (_controller != null && _controller!.value.isInitialized)
          Positioned(
            bottom: 100,
            right: 20,
            child: FloatingActionButton(
              backgroundColor: const Color(0xFF00CED1),
              onPressed: () {
                setState(() {
                  if (_isPlaying) {
                    _controller!.pause();
                  } else {
                    _controller!.play();
                  }
                  _isPlaying = !_isPlaying;
                });
              },
              child: Icon(
                _isPlaying ? Icons.pause : Icons.play_arrow,
                color: Colors.white,
              ),
            ),
          ),
      ],
    );
  }
}