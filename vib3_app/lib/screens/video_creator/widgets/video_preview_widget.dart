import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';
import 'package:provider/provider.dart';
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
  
  @override
  void initState() {
    super.initState();
    _initializeVideo();
  }
  
  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }
  
  Future<void> _initializeVideo() async {
    try {
      final creationState = context.read<CreationStateProvider>();
      
      // Debug print
      print('VideoPreviewWidget: Clips count = ${creationState.videoClips.length}');
      
      if (creationState.videoClips.isEmpty) {
        print('VideoPreviewWidget: No clips available!');
        return;
      }
      
      final firstClip = creationState.videoClips[creationState.currentClipIndex];
      print('VideoPreviewWidget: Loading video from ${firstClip.path}');
      
      _controller = VideoPlayerController.file(File(firstClip.path));
      
      await _controller!.initialize();
      await _controller!.setLooping(true);
      
      if (mounted) {
        setState(() {});
      }
    } catch (e) {
      print('VideoPreviewWidget: Error initializing video: $e');
    }
  }
  
  void _togglePlayPause() {
    if (_controller == null) return;
    
    setState(() {
      if (_isPlaying) {
        _controller!.pause();
      } else {
        _controller!.play();
      }
      _isPlaying = !_isPlaying;
    });
  }
  
  @override
  Widget build(BuildContext context) {
    final creationState = context.watch<CreationStateProvider>();
    
    return Stack(
      children: [
        // Video preview
        if (_controller != null && _controller!.value.isInitialized)
          Positioned.fill(
            child: GestureDetector(
              onTap: _togglePlayPause,
              child: AspectRatio(
                aspectRatio: _controller!.value.aspectRatio,
                child: VideoPlayer(_controller!),
              ),
            ),
          )
        else
          const Center(
            child: CircularProgressIndicator(
              color: Color(0xFF00CED1),
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
        
        // Play/pause overlay
        if (!_isPlaying)
          Center(
            child: Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.5),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.play_arrow,
                color: Colors.white,
                size: 50,
              ),
            ),
          ),
        
        // Clips timeline (if multiple clips)
        if (creationState.videoClips.length > 1)
          Positioned(
            bottom: 100,
            left: 0,
            right: 0,
            child: _buildClipsTimeline(creationState),
          ),
      ],
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
}