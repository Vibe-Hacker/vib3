import 'package:flutter/material.dart';
import 'package:video_thumbnail/video_thumbnail.dart';
import 'dart:io';
import 'dart:typed_data';

class VideoFramesTimeline extends StatefulWidget {
  final String videoPath;
  final double height;
  final int frameCount;
  
  const VideoFramesTimeline({
    super.key,
    required this.videoPath,
    required this.height,
    this.frameCount = 10,
  });
  
  @override
  State<VideoFramesTimeline> createState() => _VideoFramesTimelineState();
}

class _VideoFramesTimelineState extends State<VideoFramesTimeline> {
  final List<Uint8List?> _frames = [];
  bool _isLoading = true;
  
  @override
  void initState() {
    super.initState();
    _generateFrames();
  }
  
  @override
  void didUpdateWidget(VideoFramesTimeline oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.videoPath != widget.videoPath) {
      _generateFrames();
    }
  }
  
  Future<void> _generateFrames() async {
    setState(() {
      _isLoading = true;
      _frames.clear();
    });
    
    try {
      // Get video duration first
      // For now, we'll generate frames at regular intervals
      for (int i = 0; i < widget.frameCount; i++) {
        final frame = await VideoThumbnail.thumbnailData(
          video: widget.videoPath,
          imageFormat: ImageFormat.JPEG,
          maxHeight: widget.height.toInt(),
          quality: 50,
          timeMs: i * 1000, // Generate frame every second
        );
        
        if (mounted) {
          setState(() {
            _frames.add(frame);
          });
        }
      }
    } catch (e) {
      print('Error generating video frames: $e');
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }
  
  @override
  Widget build(BuildContext context) {
    if (_isLoading && _frames.isEmpty) {
      return Container(
        color: Colors.black,
        child: const Center(
          child: CircularProgressIndicator(
            color: Color(0xFF00CED1),
            strokeWidth: 2,
          ),
        ),
      );
    }
    
    return Row(
      children: List.generate(
        widget.frameCount,
        (index) => Expanded(
          child: Container(
            decoration: BoxDecoration(
              border: Border(
                right: BorderSide(
                  color: Colors.white.withOpacity(0.1),
                  width: index < widget.frameCount - 1 ? 1 : 0,
                ),
              ),
            ),
            child: index < _frames.length && _frames[index] != null
                ? Image.memory(
                    _frames[index]!,
                    fit: BoxFit.cover,
                    gaplessPlayback: true,
                  )
                : Container(
                    color: Colors.grey[900],
                    child: Center(
                      child: Text(
                        '${index + 1}',
                        style: TextStyle(
                          color: Colors.white.withOpacity(0.3),
                          fontSize: 10,
                        ),
                      ),
                    ),
                  ),
          ),
        ),
      ),
    );
  }
}