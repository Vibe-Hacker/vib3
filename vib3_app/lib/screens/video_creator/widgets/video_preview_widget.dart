import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';
import 'package:provider/provider.dart';
import 'package:audioplayers/audioplayers.dart';
import 'dart:io';
import '../providers/creation_state_provider.dart';
import '../video_creator_screen.dart';

class VideoPreviewWidget extends StatefulWidget {
  final Function(CreatorMode) onModeChange;
  
  const VideoPreviewWidget({
    super.key,
    required this.onModeChange,
  });
  
  @override
  State<VideoPreviewWidget> createState() => _VideoPreviewWidgetState();
}

class _VideoPreviewWidgetState extends State<VideoPreviewWidget> {
  VideoPlayerController? _controller;
  bool _isPlaying = false;
  bool _showControls = true;
  AudioPlayer? _musicPlayer;
  bool _isInitializing = false;
  
  @override
  void initState() {
    super.initState();
    // Initialize video after frame to ensure context is ready
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _initializeVideo();
    });
  }
  
  @override
  void didUpdateWidget(VideoPreviewWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    // Re-initialize if we're returning to this widget
    final creationState = context.read<CreationStateProvider>();
    if (creationState.videoClips.isNotEmpty && _controller == null) {
      _initializeVideo();
    }
  }
  
  @override
  void dispose() {
    // Pause and dispose video controller
    if (_controller != null) {
      _controller!.pause();
      _controller!.dispose();
    }
    
    // Stop and dispose music player
    if (_musicPlayer != null) {
      _musicPlayer!.stop();
      _musicPlayer!.dispose();
    }
    
    super.dispose();
  }
  
  Future<void> _initializeVideo() async {
    if (_isInitializing) {
      print('VideoPreviewWidget: Already initializing, skipping...');
      return;
    }
    
    _isInitializing = true;
    
    try {
      final creationState = context.read<CreationStateProvider>();
      
      // Debug print
      if (creationState.videoClips.isEmpty) {
        _isInitializing = false;
        return;
      }
      
      final firstClip = creationState.videoClips[creationState.currentClipIndex];
      final videoFile = File(firstClip.path);
      
      // Wait a bit to ensure video file is fully written
      await Future.delayed(const Duration(milliseconds: 200));
      
      if (!await videoFile.exists()) {
        print('VideoPreviewWidget: Video file does not exist: ${firstClip.path}');
        _isInitializing = false;
        return;
      }
      
      final fileSize = await videoFile.length();
      if (fileSize == 0) {
        print('VideoPreviewWidget: Video file is empty');
        _isInitializing = false;
        return;
      }
      
      // Dispose old controller if exists
      if (_controller != null) {
        try {
          await _controller!.pause();
          await _controller!.dispose();
        } catch (e) {
          print('Error disposing old controller: $e');
        }
        _controller = null;
      }
      
      // Add delay to ensure resources are released
      await Future.delayed(const Duration(milliseconds: 500)); // Increased delay
      
      _controller = VideoPlayerController.file(videoFile);
      
      // Initialize with timeout to prevent hanging
      await _controller!.initialize().timeout(
        const Duration(seconds: 10),
        onTimeout: () {
          throw Exception('Video initialization timeout');
        },
      );
      
      await _controller!.setLooping(true);
      await _controller!.setVolume(creationState.originalVolume);
      
      if (mounted) {
        setState(() {
          _isInitializing = false;
        });
      }
    } catch (e) {
      print('VideoPreviewWidget: Error initializing video: $e');
      _isInitializing = false;
      
      // Clean up on error
      if (_controller != null) {
        try {
          await _controller!.dispose();
        } catch (_) {}
        _controller = null;
      }
      
      if (mounted) {
        setState(() {});
        
        // Show error message
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Error loading video. Please try again.'),
            backgroundColor: Colors.orange,
            duration: Duration(seconds: 2),
          ),
        );
      }
    }
  }
  
  void _togglePlayPause() async {
    if (_controller == null) return;
    
    final creationState = context.read<CreationStateProvider>();
    
    setState(() {
      if (_isPlaying) {
        _controller!.pause();
        _musicPlayer?.pause();
      } else {
        _controller!.play();
        
        // Play background music if available
        if (creationState.backgroundMusicPath.isNotEmpty && _musicPlayer == null) {
          _initializeMusic();
        } else {
          _musicPlayer?.resume();
        }
      }
      _isPlaying = !_isPlaying;
    });
  }
  
  Future<void> _initializeMusic() async {
    final creationState = context.read<CreationStateProvider>();
    if (creationState.backgroundMusicPath.isEmpty) return;
    
    try {
      _musicPlayer = AudioPlayer();
      await _musicPlayer!.setVolume(creationState.musicVolume);
      
      // Play the actual music URL
      if (creationState.backgroundMusicPath.startsWith('http')) {
        await _musicPlayer!.play(UrlSource(creationState.backgroundMusicPath));
        await _musicPlayer!.setReleaseMode(ReleaseMode.loop); // Loop the music
      }
    } catch (e) {
      print('Error initializing music: $e');
    }
  }
  
  @override
  Widget build(BuildContext context) {
    final creationState = context.watch<CreationStateProvider>();
    
    // Initialize immediately if needed
    if (creationState.videoClips.isNotEmpty && _controller == null && !_isInitializing) {
      _initializeVideo();
    }
    
    return GestureDetector(
      onTap: () {
        setState(() {
          _showControls = !_showControls;
        });
      },
      child: Stack(
        children: [
          // Background
          Container(color: Colors.black),
          
          // Video preview
          if (_controller != null && _controller!.value.isInitialized)
            Center(
              child: AspectRatio(
                aspectRatio: _controller!.value.aspectRatio,
                child: VideoPlayer(_controller!),
              ),
            )
          else if (creationState.videoClips.isNotEmpty)
            const Center(
              child: CircularProgressIndicator(
                color: Color(0xFF00CED1),
              ),
            )
          else
            Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: const [
                  Icon(
                    Icons.videocam_off,
                    color: Colors.white30,
                    size: 80,
                  ),
                  SizedBox(height: 16),
                  Text(
                    'No video recorded yet',
                    style: TextStyle(
                      color: Colors.white30,
                      fontSize: 16,
                    ),
                  ),
                ],
              ),
            ),
        
        // Filter overlay
        if (creationState.selectedFilter != 'none')
          Positioned.fill(
            child: Container(
              color: _getFilterColor(creationState.selectedFilter),
            ),
          ),
        
        // Text overlays
        ...creationState.textOverlays.map((overlay) {
          return Positioned(
            left: overlay.position.dx,
            top: overlay.position.dy,
            child: GestureDetector(
              onTap: () {
                // Edit text
                widget.onModeChange(CreatorMode.text);
              },
              child: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.black.withOpacity(0.3),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  overlay.text,
                  style: TextStyle(
                    color: Color(overlay.color),
                    fontSize: overlay.fontSize,
                    fontFamily: overlay.fontFamily,
                  ),
                ),
              ),
            ),
          );
        }).toList(),
        
        // Sticker overlays
        ...creationState.stickers.asMap().entries.map((entry) {
          final index = entry.key;
          final sticker = entry.value;
          
          return Positioned(
            left: sticker.position.dx,
            top: sticker.position.dy,
            child: GestureDetector(
              onTap: () {
                // Remove sticker
                creationState.removeSticker(index);
              },
              child: Transform.rotate(
                angle: sticker.rotation,
                child: Transform.scale(
                  scale: sticker.scale,
                  child: Image.asset(
                    sticker.path,
                    width: 100,
                    height: 100,
                  ),
                ),
              ),
            ),
          );
        }).toList(),
        
        // Play/pause button - always visible above bottom toolbar
        Positioned(
          bottom: 105,  // Moved up to clear bottom toolbar
          right: 20,
          child: AnimatedOpacity(
            opacity: _showControls || !_isPlaying ? 1.0 : 0.0,
            duration: const Duration(milliseconds: 200),
            child: GestureDetector(
              onTap: _togglePlayPause,
              child: Container(
                width: 60,
                height: 60,
                decoration: BoxDecoration(
                  color: _isPlaying 
                      ? Colors.black.withOpacity(0.7)
                      : const Color(0xFF00CED1),
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.3),
                      blurRadius: 8,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Icon(
                  _isPlaying ? Icons.pause : Icons.play_arrow,
                  color: Colors.white,
                  size: 35,
                ),
              ),
            ),
          ),
        ),
        
        // Progress bar
        if (_controller != null && _controller!.value.isInitialized && _showControls)
          Positioned(
            bottom: 175,  // Moved up to stay above play button
            left: 20,
            right: 20,
            child: VideoProgressIndicator(
              _controller!,
              allowScrubbing: true,
              padding: const EdgeInsets.symmetric(vertical: 8),
              colors: const VideoProgressColors(
                playedColor: Color(0xFF00CED1),
                bufferedColor: Colors.white24,
                backgroundColor: Colors.white12,
              ),
            ),
          ),
        
        // Music indicator
        if (creationState.backgroundMusicPath.isNotEmpty)
          Positioned(
            top: 20,
            left: 20,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.7),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(
                    Icons.music_note,
                    color: Color(0xFF00CED1),
                    size: 16,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    'Music: ${_getMusicName(creationState.backgroundMusicPath)}',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
          ),
        
        // Clips timeline (if multiple clips)
        if (creationState.videoClips.length > 1)
          Positioned(
            bottom: 185,  // Moved up to clear bottom toolbar
            left: 0,
            right: 0,
            child: _buildClipsTimeline(creationState),
          ),
        ],
      ),
    );
  }
  
  Widget _buildClipsTimeline(CreationStateProvider creationState) {
    return Container(
      height: 60,
      margin: const EdgeInsets.symmetric(horizontal: 20),
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: creationState.videoClips.length,
        itemBuilder: (context, index) {
          final isSelected = index == creationState.currentClipIndex;
          
          return GestureDetector(
            onTap: () {
              creationState.setCurrentClip(index);
              // Re-initialize video for new clip
              _initializeVideo();
            },
            child: Container(
              width: 80,
              margin: const EdgeInsets.symmetric(horizontal: 2),
              decoration: BoxDecoration(
                border: Border.all(
                  color: isSelected ? const Color(0xFF00CED1) : Colors.white,
                  width: isSelected ? 3 : 1,
                ),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Stack(
                children: [
                  // Thumbnail placeholder
                  Container(
                    color: Colors.grey[800],
                    child: const Center(
                      child: Icon(
                        Icons.videocam,
                        color: Colors.white54,
                      ),
                    ),
                  ),
                  
                  // Clip number
                  Positioned(
                    bottom: 4,
                    right: 4,
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.7),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        '${index + 1}',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
  
  Color _getFilterColor(String filter) {
    switch (filter) {
      case 'vintage':
        return Colors.brown.withOpacity(0.2);
      case 'cold':
        return Colors.blue.withOpacity(0.1);
      case 'warm':
        return Colors.orange.withOpacity(0.1);
      case 'black_white':
        return Colors.grey.withOpacity(0.3);
      default:
        return Colors.transparent;
    }
  }
  
  String _getMusicName(String musicId) {
    // Map music IDs to names (in production, this would come from the music service)
    switch (musicId) {
      case '1':
        return 'Summer Vibes';
      case '2':
        return 'Night Drive';
      case '3':
        return 'Happy Days';
      default:
        return 'Track $musicId';
    }
  }
}