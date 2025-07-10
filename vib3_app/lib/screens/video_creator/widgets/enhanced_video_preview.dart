import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';
import 'package:audioplayers/audioplayers.dart';
import 'package:provider/provider.dart';
import 'dart:io';
import '../providers/creation_state_provider.dart';

/// Enhanced video preview that plays video with background music
class EnhancedVideoPreview extends StatefulWidget {
  final String videoPath;
  final VoidCallback? onError;
  
  const EnhancedVideoPreview({
    super.key,
    required this.videoPath,
    this.onError,
  });
  
  @override
  State<EnhancedVideoPreview> createState() => _EnhancedVideoPreviewState();
}

class _EnhancedVideoPreviewState extends State<EnhancedVideoPreview> {
  VideoPlayerController? _videoController;
  AudioPlayer? _audioPlayer;
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
    _videoController?.pause();
    _videoController?.dispose();
    _audioPlayer?.stop();
    _audioPlayer?.dispose();
    super.dispose();
  }
  
  Future<void> _initializePlayer() async {
    try {
      print('\n=== EnhancedVideoPreview: Initializing ===');
      print('Video path: ${widget.videoPath}');
      
      final file = File(widget.videoPath);
      
      // Verify file exists
      if (!file.existsSync()) {
        throw Exception('Video file not found');
      }
      
      // Initialize video player
      _videoController = VideoPlayerController.file(
        file,
        videoPlayerOptions: VideoPlayerOptions(
          mixWithOthers: true, // Allow audio mixing
        ),
      );
      
      await _videoController!.initialize();
      await _videoController!.setLooping(true);
      
      // Initialize audio player if music is added
      final creationState = context.read<CreationStateProvider>();
      if (creationState.backgroundMusic != null) {
        print('Background music found: ${creationState.backgroundMusic}');
        _audioPlayer = AudioPlayer();
        
        // Set release mode to loop
        await _audioPlayer!.setReleaseMode(ReleaseMode.loop);
        
        // Play the background music
        await _audioPlayer!.play(
          DeviceFileSource(creationState.backgroundMusic!),
          volume: 0.7, // Slightly lower volume for background
        );
      }
      
      // Start video playback
      await _videoController!.play();
      
      if (mounted) {
        setState(() {
          _isInitialized = true;
        });
      }
      
      print('=== EnhancedVideoPreview: Success ===\n');
      
    } catch (e) {
      print('\n=== EnhancedVideoPreview: ERROR ===');
      print('Error: $e');
      print('================================\n');
      
      if (mounted) {
        setState(() {
          _hasError = true;
          _errorMessage = e.toString();
        });
      }
      
      widget.onError?.call();
    }
  }
  
  @override
  Widget build(BuildContext context) {
    final creationState = context.watch<CreationStateProvider>();
    
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
                'Failed to load preview',
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
            ],
          ),
        ),
      );
    }
    
    if (!_isInitialized || _videoController == null) {
      return Container(
        color: Colors.black,
        child: const Center(
          child: CircularProgressIndicator(
            color: Color(0xFF00CED1),
          ),
        ),
      );
    }
    
    return Stack(
      children: [
        // Video player
        Container(
          color: Colors.black,
          child: Center(
            child: AspectRatio(
              aspectRatio: _videoController!.value.aspectRatio,
              child: VideoPlayer(_videoController!),
            ),
          ),
        ),
        
        // Overlays for effects and text (placeholder)
        if (creationState.appliedEffects.isNotEmpty)
          Positioned(
            top: 60,
            right: 20,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.7),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: const Color(0xFFFF0080).withOpacity(0.5)),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(
                    Icons.auto_awesome,
                    color: Color(0xFFFF0080),
                    size: 16,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    '${creationState.appliedEffects.length} Effects',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
          ),
        
        // Filter indicator
        if (creationState.selectedFilter != null)
          Positioned(
            top: 60,
            left: 20,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.7),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: const Color(0xFF00CED1).withOpacity(0.5)),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(
                    Icons.color_lens,
                    color: Color(0xFF00CED1),
                    size: 16,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    creationState.selectedFilter!,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
          ),
        
        // Music indicator
        if (creationState.backgroundMusic != null)
          Positioned(
            bottom: 100,
            left: 20,
            right: 20,
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.7),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFF00CED1).withOpacity(0.5)),
              ),
              child: Row(
                children: [
                  const Icon(
                    Icons.music_note,
                    color: Color(0xFF00CED1),
                    size: 20,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Text(
                          'Background Music',
                          style: TextStyle(
                            color: Colors.white54,
                            fontSize: 10,
                          ),
                        ),
                        Text(
                          creationState.backgroundMusicName ?? 'Custom Audio',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
      ],
    );
  }
}