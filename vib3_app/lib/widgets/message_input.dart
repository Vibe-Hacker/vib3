import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';

class MessageInput extends StatefulWidget {
  final TextEditingController controller;
  final Function(String) onSendText;
  final Function(String type, String url, int? duration) onSendMedia;
  final VoidCallback onTyping;
  final bool isSending;
  
  const MessageInput({
    super.key,
    required this.controller,
    required this.onSendText,
    required this.onSendMedia,
    required this.onTyping,
    required this.isSending,
  });
  
  @override
  State<MessageInput> createState() => _MessageInputState();
}

class _MessageInputState extends State<MessageInput> with SingleTickerProviderStateMixin {
  final ImagePicker _picker = ImagePicker();
  bool _isRecording = false;
  late AnimationController _recordingAnimationController;
  late Animation<double> _recordingAnimation;
  
  @override
  void initState() {
    super.initState();
    _recordingAnimationController = AnimationController(
      duration: const Duration(seconds: 1),
      vsync: this,
    );
    _recordingAnimation = Tween<double>(
      begin: 1.0,
      end: 1.5,
    ).animate(CurvedAnimation(
      parent: _recordingAnimationController,
      curve: Curves.easeInOut,
    ));
  }
  
  @override
  void dispose() {
    _recordingAnimationController.dispose();
    super.dispose();
  }
  
  void _sendMessage() {
    final text = widget.controller.text.trim();
    if (text.isNotEmpty && !widget.isSending) {
      widget.onSendText(text);
    }
  }
  
  void _showMediaOptions() {
    HapticFeedback.lightImpact();
    
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF1A1A1A),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Container(
        padding: const EdgeInsets.symmetric(vertical: 20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.camera_alt, color: Colors.white),
              title: const Text(
                'Camera',
                style: TextStyle(color: Colors.white),
              ),
              onTap: () {
                Navigator.pop(context);
                _pickMedia(ImageSource.camera);
              },
            ),
            ListTile(
              leading: const Icon(Icons.photo_library, color: Colors.white),
              title: const Text(
                'Gallery',
                style: TextStyle(color: Colors.white),
              ),
              onTap: () {
                Navigator.pop(context);
                _pickMedia(ImageSource.gallery);
              },
            ),
            ListTile(
              leading: const Icon(Icons.videocam, color: Colors.white),
              title: const Text(
                'Video',
                style: TextStyle(color: Colors.white),
              ),
              onTap: () {
                Navigator.pop(context);
                _pickVideo();
              },
            ),
          ],
        ),
      ),
    );
  }
  
  Future<void> _pickMedia(ImageSource source) async {
    try {
      final XFile? image = await _picker.pickImage(source: source);
      if (image != null) {
        // TODO: Upload image and get URL
        widget.onSendMedia('image', image.path, null);
      }
    } catch (e) {
      print('Error picking image: $e');
    }
  }
  
  Future<void> _pickVideo() async {
    try {
      final XFile? video = await _picker.pickVideo(source: ImageSource.gallery);
      if (video != null) {
        // TODO: Upload video and get URL
        widget.onSendMedia('video', video.path, null);
      }
    } catch (e) {
      print('Error picking video: $e');
    }
  }
  
  void _startRecording() {
    HapticFeedback.mediumImpact();
    setState(() {
      _isRecording = true;
    });
    _recordingAnimationController.repeat(reverse: true);
    
    // TODO: Implement actual voice recording
    // For now, simulate recording
    Future.delayed(const Duration(seconds: 3), () {
      if (_isRecording) {
        _stopRecording();
      }
    });
  }
  
  void _stopRecording() {
    HapticFeedback.lightImpact();
    setState(() {
      _isRecording = false;
    });
    _recordingAnimationController.stop();
    _recordingAnimationController.reset();
    
    // TODO: Stop recording and send audio
    widget.onSendMedia('audio', 'audio_url', 3);
  }
  
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.only(left: 16, right: 16, bottom: 16, top: 8),
      decoration: BoxDecoration(
        color: const Color(0xFF1A1A1A),
        border: Border(
          top: BorderSide(
            color: Colors.white.withOpacity(0.1),
          ),
        ),
      ),
      child: SafeArea(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            // Media button
            IconButton(
              onPressed: _showMediaOptions,
              icon: const Icon(
                Icons.add_circle_outline,
                color: Color(0xFF00CED1),
              ),
            ),
            
            // Text input
            Expanded(
              child: Container(
                constraints: const BoxConstraints(maxHeight: 120),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.05),
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(
                    color: Colors.white.withOpacity(0.1),
                  ),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Expanded(
                      child: TextField(
                        controller: widget.controller,
                        onChanged: (_) => widget.onTyping(),
                        onSubmitted: (_) => _sendMessage(),
                        textInputAction: TextInputAction.send,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 15,
                        ),
                        maxLines: null,
                        decoration: const InputDecoration(
                          hintText: 'Message...',
                          hintStyle: TextStyle(
                            color: Colors.white54,
                          ),
                          border: InputBorder.none,
                          contentPadding: EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 12,
                          ),
                        ),
                      ),
                    ),
                    
                    // Emoji button
                    IconButton(
                      onPressed: () {
                        // TODO: Show emoji picker
                      },
                      icon: const Icon(
                        Icons.emoji_emotions_outlined,
                        color: Colors.white54,
                        size: 22,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            
            const SizedBox(width: 8),
            
            // Send/Voice button
            AnimatedBuilder(
              animation: _recordingAnimation,
              builder: (context, child) {
                return GestureDetector(
                  onTap: () {
                    if (widget.controller.text.trim().isNotEmpty) {
                      _sendMessage();
                    }
                  },
                  onLongPressStart: (_) {
                    if (widget.controller.text.trim().isEmpty) {
                      _startRecording();
                    }
                  },
                  onLongPressEnd: (_) {
                    if (_isRecording) {
                      _stopRecording();
                    }
                  },
                  child: Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: widget.controller.text.trim().isNotEmpty || _isRecording
                            ? [const Color(0xFF00CED1), const Color(0xFF40E0D0)]
                            : [Colors.white24, Colors.white12],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(24),
                      boxShadow: [
                        if (_isRecording)
                          BoxShadow(
                            color: const Color(0xFF00CED1).withOpacity(0.5),
                            blurRadius: 15 * _recordingAnimation.value,
                            spreadRadius: 2 * _recordingAnimation.value,
                          ),
                      ],
                    ),
                    child: Center(
                      child: widget.isSending
                          ? const SizedBox(
                              width: 24,
                              height: 24,
                              child: CircularProgressIndicator(
                                color: Colors.white,
                                strokeWidth: 2,
                              ),
                            )
                          : Icon(
                              widget.controller.text.trim().isNotEmpty
                                  ? Icons.send
                                  : _isRecording
                                      ? Icons.mic
                                      : Icons.mic_none,
                              color: Colors.white,
                              size: 24,
                            ),
                    ),
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}