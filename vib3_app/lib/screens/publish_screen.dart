import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:video_player/video_player.dart';
import 'dart:io';
import '../models/video.dart';

class PublishScreen extends StatefulWidget {
  final String videoPath;
  final String? musicName;
  
  const PublishScreen({
    super.key,
    required this.videoPath,
    this.musicName,
  });
  
  @override
  State<PublishScreen> createState() => _PublishScreenState();
}

class _PublishScreenState extends State<PublishScreen> {
  final TextEditingController _titleController = TextEditingController();
  final TextEditingController _descriptionController = TextEditingController();
  late VideoPlayerController _videoController;
  
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
    _initializeVideo();
  }
  
  Future<void> _initializeVideo() async {
    _videoController = VideoPlayerController.file(File(widget.videoPath));
    await _videoController.initialize();
    _videoController.setLooping(true);
    _videoController.play();
    setState(() {});
  }
  
  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _videoController.dispose();
    super.dispose();
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        title: const Text(
          'Post',
          style: TextStyle(color: Colors.white),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Video preview and details section
            Container(
              padding: const EdgeInsets.all(16),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Video thumbnail
                  ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: SizedBox(
                      width: 100,
                      height: 150,
                      child: _videoController.value.isInitialized
                          ? AspectRatio(
                              aspectRatio: _videoController.value.aspectRatio,
                              child: VideoPlayer(_videoController),
                            )
                          : Container(
                              color: Colors.grey[900],
                              child: const Center(
                                child: CircularProgressIndicator(
                                  color: Color(0xFF00CED1),
                                ),
                              ),
                            ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  
                  // Title and description
                  Expanded(
                    child: Column(
                      children: [
                        // Title field
                        TextField(
                          controller: _titleController,
                          maxLength: 100,
                          style: const TextStyle(color: Colors.white),
                          decoration: const InputDecoration(
                            hintText: 'Add a title...',
                            hintStyle: TextStyle(color: Colors.white54),
                            border: InputBorder.none,
                            counterText: '',
                          ),
                        ),
                        
                        // Description field
                        TextField(
                          controller: _descriptionController,
                          maxLines: 4,
                          maxLength: 500,
                          style: const TextStyle(color: Colors.white),
                          decoration: const InputDecoration(
                            hintText: 'Describe your video...',
                            hintStyle: TextStyle(color: Colors.white54),
                            border: InputBorder.none,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            
            // Music info (if any)
            if (widget.musicName != null)
              Container(
                margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.05),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.music_note, color: Color(0xFF00CED1), size: 20),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        widget.musicName!,
                        style: const TextStyle(color: Colors.white70, fontSize: 14),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ),
            
            const Divider(color: Colors.white12, height: 32),
            
            // Hashtags section
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Add hashtags',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 12),
                  
                  // Selected hashtags
                  if (_selectedHashtags.isNotEmpty)
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: _selectedHashtags.map((tag) => Chip(
                        label: Text(tag, style: const TextStyle(fontSize: 12)),
                        backgroundColor: const Color(0xFF00CED1).withOpacity(0.2),
                        deleteIcon: const Icon(Icons.close, size: 16),
                        onDeleted: () {
                          setState(() {
                            _selectedHashtags.remove(tag);
                          });
                        },
                      )).toList(),
                    ),
                  
                  const SizedBox(height: 12),
                  
                  // Suggested hashtags
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: _suggestedHashtags
                        .where((tag) => !_selectedHashtags.contains(tag))
                        .map((tag) => ActionChip(
                              label: Text(tag, style: const TextStyle(fontSize: 12)),
                              backgroundColor: Colors.white.withOpacity(0.1),
                              onPressed: () {
                                setState(() {
                                  _selectedHashtags.add(tag);
                                });
                              },
                            ))
                        .toList(),
                  ),
                ],
              ),
            ),
            
            const Divider(color: Colors.white12, height: 32),
            
            // Privacy settings
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Who can view this video',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 12),
                  
                  // Public/Private toggle
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.05),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Column(
                      children: [
                        RadioListTile<bool>(
                          value: true,
                          groupValue: _isPublic,
                          onChanged: (value) {
                            setState(() {
                              _isPublic = value!;
                            });
                          },
                          title: const Text(
                            'Public',
                            style: TextStyle(color: Colors.white),
                          ),
                          subtitle: const Text(
                            'Anyone can view this video',
                            style: TextStyle(color: Colors.white54, fontSize: 12),
                          ),
                          activeColor: const Color(0xFF00CED1),
                        ),
                        RadioListTile<bool>(
                          value: false,
                          groupValue: _isPublic,
                          onChanged: (value) {
                            setState(() {
                              _isPublic = value!;
                            });
                          },
                          title: const Text(
                            'Private',
                            style: TextStyle(color: Colors.white),
                          ),
                          subtitle: const Text(
                            'Only you can view this video',
                            style: TextStyle(color: Colors.white54, fontSize: 12),
                          ),
                          activeColor: const Color(0xFF00CED1),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            
            // Interaction settings
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Allow users to:',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 12),
                  
                  // Settings toggles
                  _buildSettingTile(
                    'Comment',
                    'Others can comment on your video',
                    _allowComments,
                    (value) => setState(() => _allowComments = value),
                  ),
                  _buildSettingTile(
                    'Duet',
                    'Others can make Duets with your video',
                    _allowDuet,
                    (value) => setState(() => _allowDuet = value),
                  ),
                  _buildSettingTile(
                    'Stitch',
                    'Others can use parts of your video',
                    _allowStitch,
                    (value) => setState(() => _allowStitch = value),
                  ),
                  _buildSettingTile(
                    'Download',
                    'Others can download your video',
                    _allowDownload,
                    (value) => setState(() => _allowDownload = value),
                  ),
                ],
              ),
            ),
            
            // Publish button
            Container(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  // Drafts button
                  Expanded(
                    child: OutlinedButton(
                      onPressed: _saveToDrafts,
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.white,
                        side: const BorderSide(color: Colors.white30),
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(30),
                        ),
                      ),
                      child: const Text(
                        'Save to drafts',
                        style: TextStyle(fontSize: 16),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  
                  // Post button
                  Expanded(
                    flex: 2,
                    child: ElevatedButton(
                      onPressed: _isPublishing ? null : _publishVideo,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF00CED1),
                        foregroundColor: Colors.black,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(30),
                        ),
                        disabledBackgroundColor: Colors.grey[800],
                      ),
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
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                    ),
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }
  
  Widget _buildSettingTile(
    String title,
    String subtitle,
    bool value,
    Function(bool) onChanged,
  ) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(12),
      ),
      child: SwitchListTile(
        title: Text(
          title,
          style: const TextStyle(color: Colors.white, fontSize: 14),
        ),
        subtitle: Text(
          subtitle,
          style: const TextStyle(color: Colors.white54, fontSize: 12),
        ),
        value: value,
        onChanged: onChanged,
        activeColor: const Color(0xFF00CED1),
      ),
    );
  }
  
  void _saveToDrafts() {
    HapticFeedback.mediumImpact();
    
    // TODO: Implement save to drafts
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Row(
          children: [
            Icon(Icons.drafts, color: Colors.white),
            SizedBox(width: 8),
            Text('Saved to drafts'),
          ],
        ),
        backgroundColor: Colors.green,
      ),
    );
    
    // Navigate back to home
    Navigator.pushNamedAndRemoveUntil(context, '/home', (route) => false);
  }
  
  void _publishVideo() async {
    // Validate title
    if (_titleController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please add a title'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }
    
    setState(() {
      _isPublishing = true;
    });
    
    HapticFeedback.mediumImpact();
    
    // Simulate upload process
    await Future.delayed(const Duration(seconds: 2));
    
    // TODO: Implement actual video upload
    
    setState(() {
      _isPublishing = false;
    });
    
    // Show success and navigate to home
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Row(
            children: [
              Icon(Icons.check_circle, color: Colors.white),
              SizedBox(width: 8),
              Text('Video posted successfully!'),
            ],
          ),
          backgroundColor: Colors.green,
        ),
      );
      
      // Navigate back to home
      Navigator.pushNamedAndRemoveUntil(context, '/home', (route) => false);
    }
  }
}