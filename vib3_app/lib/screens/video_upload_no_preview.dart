import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'dart:io';
import '../models/video.dart';
import '../services/upload_service.dart';
import '../providers/auth_provider.dart';
import '../services/video_player_manager.dart';

/// Video-free upload screen that completely avoids video preview to prevent ImageReader errors
/// This is the nuclear solution for the persistent buffer overflow issues
class VideoUploadNoPreview extends StatefulWidget {
  final String videoPath;
  final String? musicName;
  
  const VideoUploadNoPreview({
    super.key,
    required this.videoPath,
    this.musicName,
  });
  
  @override
  State<VideoUploadNoPreview> createState() => _VideoUploadNoPreviewState();
}

class _VideoUploadNoPreviewState extends State<VideoUploadNoPreview> {
  final TextEditingController _titleController = TextEditingController();
  final TextEditingController _descriptionController = TextEditingController();
  
  bool _isPublic = true;
  bool _allowComments = true;
  bool _allowDuet = true;
  bool _allowStitch = true;
  bool _allowDownload = false;
  bool _isPublishing = false;
  
  final List<String> _selectedHashtags = [];
  final List<String> _suggestedHashtags = [
    '#vib3',
    '#foryou',
    '#viral',
    '#trending',
    '#dance',
    '#comedy',
    '#music',
    '#fashion',
    '#sports',
    '#gaming',
  ];

  @override
  void initState() {
    super.initState();
    // Nuclear cleanup to ensure no video resources are active
    VideoPlayerManager.nuclearCleanup();
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  void _toggleHashtag(String hashtag) {
    setState(() {
      if (_selectedHashtags.contains(hashtag)) {
        _selectedHashtags.remove(hashtag);
      } else {
        _selectedHashtags.add(hashtag);
      }
    });
  }

  Future<void> _publishVideo() async {
    if (_isPublishing) return;

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final token = authProvider.authToken;

    if (token == null) {
      _showError('Please log in to upload videos');
      return;
    }

    setState(() {
      _isPublishing = true;
    });

    try {
      // Nuclear cleanup before upload
      await VideoPlayerManager.nuclearCleanup();
      
      // Create hashtags string
      final hashtagsString = _selectedHashtags.join(' ');
      
      // Build full description with hashtags
      String fullDescription = _descriptionController.text.trim();
      if (hashtagsString.isNotEmpty) {
        if (fullDescription.isNotEmpty) {
          fullDescription += '\n\n$hashtagsString';
        } else {
          fullDescription = hashtagsString;
        }
      }

      print('🚀 Starting video upload...');
      print('📄 Description: $fullDescription');
      print('🎵 Music: ${widget.musicName ?? 'None'}');
      print('🔒 Privacy: ${_isPublic ? 'Public' : 'Private'}');

      final result = await UploadService.uploadVideo(
        videoFile: File(widget.videoPath),
        description: fullDescription,
        privacy: _isPublic ? 'public' : 'private',
        allowComments: _allowComments,
        allowDuet: _allowDuet,
        allowStitch: _allowStitch,
        token: token,
        hashtags: hashtagsString,
        musicName: widget.musicName,
      );

      if (result['success'] == true && mounted) {
        print('✅ Video uploaded successfully!');
        _showSuccess('Video uploaded successfully!');
        Navigator.of(context).popUntil((route) => route.isFirst);
      } else if (mounted) {
        print('❌ Video upload failed');
        _showError('Failed to upload video. Please try again.');
      }
    } catch (e) {
      print('❌ Upload error: $e');
      if (mounted) {
        _showError('Upload failed: ${e.toString()}');
      }
    } finally {
      if (mounted) {
        setState(() {
          _isPublishing = false;
        });
      }
    }
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
        duration: const Duration(seconds: 3),
      ),
    );
  }

  void _showSuccess(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.green,
        duration: const Duration(seconds: 3),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        title: const Text('Publish Video', style: TextStyle(color: Colors.white)),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.of(context).pop(),
        ),
        actions: [
          TextButton(
            onPressed: _isPublishing ? null : _publishVideo,
            child: _isPublishing
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                    ),
                  )
                : const Text(
                    'Post',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Video info (no preview to avoid buffer errors)
            Container(
              width: double.infinity,
              height: 200,
              decoration: BoxDecoration(
                color: Colors.grey[900],
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.grey[700]!),
              ),
              child: const Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.videocam, size: 48, color: Colors.white54),
                    SizedBox(height: 8),
                    Text(
                      'Video ready to upload',
                      style: TextStyle(color: Colors.white54, fontSize: 16),
                    ),
                    Text(
                      'No preview to prevent buffer errors',
                      style: TextStyle(color: Colors.white38, fontSize: 12),
                    ),
                  ],
                ),
              ),
            ),
            
            const SizedBox(height: 24),
            
            // Caption
            const Text(
              'Caption',
              style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _descriptionController,
              style: const TextStyle(color: Colors.white),
              maxLines: 4,
              maxLength: 2200,
              decoration: InputDecoration(
                hintText: 'Add a caption...',
                hintStyle: const TextStyle(color: Colors.grey),
                filled: true,
                fillColor: Colors.grey[900],
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: BorderSide.none,
                ),
              ),
            ),
            
            const SizedBox(height: 24),
            
            // Hashtags
            const Text(
              'Hashtags',
              style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _suggestedHashtags.map((hashtag) {
                final isSelected = _selectedHashtags.contains(hashtag);
                return GestureDetector(
                  onTap: () => _toggleHashtag(hashtag),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: isSelected ? Colors.blue : Colors.grey[800],
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Text(
                      hashtag,
                      style: TextStyle(
                        color: isSelected ? Colors.white : Colors.grey[300],
                        fontSize: 14,
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
            
            const SizedBox(height: 24),
            
            // Privacy Settings
            const Text(
              'Privacy',
              style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: GestureDetector(
                    onTap: () => setState(() => _isPublic = true),
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: _isPublic ? Colors.blue : Colors.grey[800],
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Text(
                        'Public',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: Colors.white),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: GestureDetector(
                    onTap: () => setState(() => _isPublic = false),
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: !_isPublic ? Colors.blue : Colors.grey[800],
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Text(
                        'Private',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: Colors.white),
                      ),
                    ),
                  ),
                ),
              ],
            ),
            
            const SizedBox(height: 24),
            
            // Interaction Settings
            const Text(
              'Interaction Settings',
              style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            
            _buildSwitch('Allow comments', _allowComments, (value) {
              setState(() => _allowComments = value);
            }),
            _buildSwitch('Allow duet', _allowDuet, (value) {
              setState(() => _allowDuet = value);
            }),
            _buildSwitch('Allow stitch', _allowStitch, (value) {
              setState(() => _allowStitch = value);
            }),
            _buildSwitch('Allow download', _allowDownload, (value) {
              setState(() => _allowDownload = value);
            }),
            
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  Widget _buildSwitch(String title, bool value, Function(bool) onChanged) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            title,
            style: const TextStyle(color: Colors.white, fontSize: 14),
          ),
          Switch(
            value: value,
            onChanged: onChanged,
            activeColor: Colors.blue,
          ),
        ],
      ),
    );
  }
}