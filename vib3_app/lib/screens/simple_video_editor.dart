import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';
import 'dart:io';
import 'publish_screen.dart';

/// Simple video editor screen for basic editing after recording
class SimpleVideoEditor extends StatefulWidget {
  final String videoPath;
  final bool isFrontCamera;

  const SimpleVideoEditor({
    super.key,
    required this.videoPath,
    this.isFrontCamera = false,
  });

  @override
  State<SimpleVideoEditor> createState() => _SimpleVideoEditorState();
}

class _SimpleVideoEditorState extends State<SimpleVideoEditor> {
  VideoPlayerController? _controller;
  bool _isInitialized = false;
  String _description = '';
  
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
      final file = File(widget.videoPath);
      if (await file.exists()) {
        _controller = VideoPlayerController.file(file);
        await _controller!.initialize();
        await _controller!.setLooping(true);
        await _controller!.play();
        
        if (mounted) {
          setState(() {
            _isInitialized = true;
          });
        }
      }
    } catch (e) {
      print('Error initializing video: $e');
    }
  }
  
  void _navigateToPublish() {
    print('📲 SimpleVideoEditor: Navigating to PublishScreen');
    print('📹 isFrontCamera value: ${widget.isFrontCamera}');

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => PublishScreen(
          videoPath: widget.videoPath,
          isFrontCamera: widget.isFrontCamera,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      resizeToAvoidBottomInset: true,
      body: SafeArea(
        child: Column(
          children: [
            // Header
            Container(
              padding: const EdgeInsets.all(16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.white),
                    onPressed: () => Navigator.pop(context),
                  ),
                  Text(
                    'Edit Video',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  TextButton(
                    onPressed: _navigateToPublish,
                    child: Text(
                      'Next',
                      style: TextStyle(
                        color: Color(0xFF00CED1),
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            
            // Video preview
            Expanded(
              child: Center(
                child: _isInitialized && _controller != null
                    ? AspectRatio(
                        aspectRatio: _controller!.value.aspectRatio,
                        child: widget.isFrontCamera
                            ? Transform(
                                alignment: Alignment.center,
                                transform: Matrix4.rotationY(3.14159),
                                child: VideoPlayer(_controller!),
                              )
                            : VideoPlayer(_controller!),
                      )
                    : const CircularProgressIndicator(
                        color: Color(0xFF00CED1),
                      ),
              ),
            ),
            
            // Description input
            Container(
              padding: const EdgeInsets.all(16),
              child: TextField(
                onChanged: (value) => _description = value,
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  hintText: 'Add a description...',
                  hintStyle: TextStyle(color: Colors.grey[400]),
                  filled: true,
                  fillColor: Colors.grey[900],
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: BorderSide.none,
                  ),
                ),
                maxLines: 3,
              ),
            ),
            
            // Quick actions
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _buildQuickAction(Icons.music_note, 'Music', () {
                    // TODO: Add music
                  }),
                  _buildQuickAction(Icons.text_fields, 'Text', () {
                    // TODO: Add text
                  }),
                  _buildQuickAction(Icons.emoji_emotions, 'Effects', () {
                    // TODO: Add effects
                  }),
                  _buildQuickAction(Icons.filter, 'Filters', () {
                    // TODO: Add filters
                  }),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildQuickAction(IconData icon, String label, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
        child: Column(
          children: [
            Icon(icon, color: Colors.white, size: 28),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(color: Colors.white, fontSize: 12),
            ),
          ],
        ),
      ),
    );
  }
}