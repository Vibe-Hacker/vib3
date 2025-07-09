import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';
import 'package:audioplayers/audioplayers.dart';
import 'package:provider/provider.dart';
import 'dart:io';
import '../providers/creation_state_provider.dart';

class TrimPreviewWidget extends StatefulWidget {
  final String? videoPath;
  final double trimStart;
  final double trimEnd;
  final VoidCallback? onPlayPause;
  final Function(double)? onPositionChanged;
  
  const TrimPreviewWidget({
    super.key,
    this.videoPath,
    required this.trimStart,
    required this.trimEnd,
    this.onPlayPause,
    this.onPositionChanged,
  });
  
  @override
  State<TrimPreviewWidget> createState() => _TrimPreviewWidgetState();
}

class _TrimPreviewWidgetState extends State<TrimPreviewWidget> {
  VideoPlayerController? _controller;
  AudioPlayer? _musicPlayer;
  bool _isPlaying = false;
  
  @override
  void initState() {
    super.initState();
    if (widget.videoPath != null) {
      _initializeVideo();
    }
  }
  
  void _setupPositionListener() {
    _controller?.addListener(() {
      if (_controller != null && _controller!.value.isInitialized && widget.onPositionChanged != null) {
        final duration = _controller!.value.duration;
        final position = _controller!.value.position;
        final percentage = (position.inMilliseconds / duration.inMilliseconds * 100).clamp(0.0, 100.0);
        widget.onPositionChanged!(percentage);
      }
    });
  }
  
  @override
  void didUpdateWidget(TrimPreviewWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.videoPath != widget.videoPath) {
      _controller?.dispose();
      if (widget.videoPath != null) {
        _initializeVideo();
      }
    } else if (oldWidget.trimStart != widget.trimStart || 
               oldWidget.trimEnd != widget.trimEnd) {
      _seekToTrimStart();
    }
  }
  
  @override
  void dispose() {
    _controller?.dispose();
    _musicPlayer?.dispose();
    super.dispose();
  }
  
  Future<void> _initializeVideo() async {
    if (widget.videoPath == null) return;
    
    try {
      _controller = VideoPlayerController.file(File(widget.videoPath!));
      await _controller!.initialize();
      await _controller!.setLooping(true);
      _seekToTrimStart();
      _setupPositionListener();
      
      if (mounted) {
        setState(() {});
      }
    } catch (e) {
      print('Error initializing trim preview: $e');
    }
  }
  
  Future<void> _seekToTrimStart() async {
    if (_controller == null || !_controller!.value.isInitialized) return;
    
    final duration = _controller!.value.duration;
    final startPosition = duration * (widget.trimStart / 100);
    await _controller!.seekTo(startPosition);
  }
  
  void _togglePlayPause() {
    if (_controller == null || !_controller!.value.isInitialized) return;
    
    setState(() {
      if (_isPlaying) {
        _controller!.pause();
        _musicPlayer?.pause();
      } else {
        _controller!.play();
        // Set up listener to loop within trim range
        _controller!.addListener(_checkTrimBounds);
        
        // Play background music if available
        _initializeAndPlayMusic();
      }
      _isPlaying = !_isPlaying;
    });
    
    widget.onPlayPause?.call();
  }
  
  Future<void> _initializeAndPlayMusic() async {
    final creationState = context.read<CreationStateProvider>();
    if (creationState.backgroundMusicPath.isEmpty) return;
    
    try {
      if (_musicPlayer == null) {
        _musicPlayer = AudioPlayer();
        await _musicPlayer!.setVolume(creationState.musicVolume);
      }
      
      // Play the actual music URL
      if (creationState.backgroundMusicPath.startsWith('http')) {
        await _musicPlayer!.play(UrlSource(creationState.backgroundMusicPath));
        await _musicPlayer!.setReleaseMode(ReleaseMode.loop);
        
        // Sync music position with video trim start
        if (_controller != null && _controller!.value.isInitialized) {
          final videoDuration = _controller!.value.duration;
          final musicStartTime = videoDuration * (widget.trimStart / 100);
          await _musicPlayer!.seek(musicStartTime);
        }
      }
    } catch (e) {
      print('Error playing music in trim preview: $e');
    }
  }
  
  void _checkTrimBounds() {
    if (_controller == null || !_controller!.value.isInitialized) return;
    
    final duration = _controller!.value.duration;
    final currentPosition = _controller!.value.position;
    final endPosition = duration * (widget.trimEnd / 100);
    
    if (currentPosition >= endPosition) {
      _seekToTrimStart();
      // Also reset music position
      if (_musicPlayer != null && _isPlaying) {
        final musicStartTime = duration * (widget.trimStart / 100);
        _musicPlayer!.seek(musicStartTime);
      }
    }
  }
  
  @override
  Widget build(BuildContext context) {
    if (widget.videoPath == null) {
      return _buildPlaceholder();
    }
    
    if (_controller == null || !_controller!.value.isInitialized) {
      return Stack(
        alignment: Alignment.center,
        children: [
          _buildPlaceholder(),
          const CircularProgressIndicator(
            color: Color(0xFF00CED1),
            strokeWidth: 2,
          ),
        ],
      );
    }
    
    return GestureDetector(
      onTap: _togglePlayPause,
      child: Stack(
        alignment: Alignment.center,
        children: [
          AspectRatio(
            aspectRatio: _controller!.value.aspectRatio,
            child: VideoPlayer(_controller!),
          ),
          
          // Play/pause overlay
          AnimatedOpacity(
            opacity: _isPlaying ? 0.0 : 1.0,
            duration: const Duration(milliseconds: 200),
            child: Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.2),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.play_arrow,
                color: Colors.white,
                size: 50,
              ),
            ),
          ),
          
          // Trim indicators
          if (widget.trimStart > 0)
            Positioned(
              left: 0,
              top: 0,
              bottom: 0,
              width: 4,
              child: Container(
                color: const Color(0xFF00CED1),
              ),
            ),
          if (widget.trimEnd < 100)
            Positioned(
              right: 0,
              top: 0,
              bottom: 0,
              width: 4,
              child: Container(
                color: const Color(0xFF00CED1),
              ),
            ),
        ],
      ),
    );
  }
  
  Widget _buildPlaceholder() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.black,
        borderRadius: BorderRadius.circular(10),
      ),
      child: const Center(
        child: Icon(
          Icons.videocam_outlined,
          color: Colors.white30,
          size: 60,
        ),
      ),
    );
  }
}