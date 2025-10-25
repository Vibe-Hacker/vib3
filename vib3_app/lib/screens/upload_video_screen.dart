import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:video_player/video_player.dart';
import '../providers/video_provider.dart';
import '../services/video_service.dart';
import '../widgets/tabbed_video_feed.dart';
import 'dart:io';
import '../providers/auth_provider.dart';
import '../services/upload_service.dart';

class UploadVideoScreen extends StatefulWidget {
  final String videoPath;
  final String? musicName;
  final bool isFrontCamera;
  
  const UploadVideoScreen({
    super.key,
    required this.videoPath,
    this.musicName,
    this.isFrontCamera = false,
  });

  @override
  State<UploadVideoScreen> createState() => _UploadVideoScreenState();
}

class _UploadVideoScreenState extends State<UploadVideoScreen> {
  final TextEditingController _captionController = TextEditingController();
  final TextEditingController _tagsController = TextEditingController();
  final VideoService _videoService = VideoService();
  VideoPlayerController? _videoController;

  bool _isUploading = false;
  double _uploadProgress = 0.0;

  // Privacy settings
  String _privacy = 'public'; // public, friends, private
  bool _allowComments = true;
  bool _allowDuet = true;
  bool _allowStitch = true;
  bool _allowDownload = true;

  // Cover image
  String? _coverImagePath;
  int _coverFrameIndex = 0;
  
  // Suggested hashtags
  final List<String> _suggestedHashtags = [
    '#fyp',
    '#viral',
    '#trending',
    '#foryou',
    '#vibes',
    '#vib3',
    '#dance',
    '#music',
    '#funny',
    '#love',
  ];
  
  @override
  void initState() {
    super.initState();
    print('UploadVideoScreen initState - videoPath: ${widget.videoPath}');
    print('UploadVideoScreen initState - isFrontCamera: ${widget.isFrontCamera}');
    _initializeVideo();
    _generateCoverOptions();
  }

  Future<void> _initializeVideo() async {
    _videoController = VideoPlayerController.file(File(widget.videoPath));
    await _videoController!.initialize();
    _videoController!.setLooping(true);
    _videoController!.play();
    if (mounted) {
      setState(() {});
    }
  }
  
  void _generateCoverOptions() {
    // TODO: Generate thumbnail options from video
    // For now, just use the video path as cover
    _coverImagePath = widget.videoPath;
  }
  
  @override
  void dispose() {
    _captionController.dispose();
    _tagsController.dispose();
    _videoController?.dispose();
    super.dispose();
  }
  
  Future<void> _uploadVideo() async {
    print('_uploadVideo called');
    
    if (widget.videoPath.isEmpty) {
      print('Error: No video path provided');
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('No video path provided'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }
    
    if (_captionController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please add a caption'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }
    
    setState(() {
      _isUploading = true;
      _uploadProgress = 0.0;
    });
    
    try {
      // Simulate upload progress
      for (int i = 0; i <= 100; i += 5) {
        await Future.delayed(const Duration(milliseconds: 100));
        if (mounted) {
          setState(() {
            _uploadProgress = i / 100;
          });
        }
      }
      
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final token = authProvider.authToken;

      if (token == null) {
        throw Exception('Authentication token not found');
      }

      // Actually upload to server
      final result = await UploadService.uploadVideo(
        videoFile: File(widget.videoPath),
        description: _captionController.text,
        privacy: _privacy,
        allowComments: _allowComments,
        allowDuet: _allowDuet,
        allowStitch: _allowStitch,
        token: token,
        hashtags: _tagsController.text,
        musicName: widget.musicName,
        isFrontCamera: widget.isFrontCamera,
      );
      
      if (mounted) {
        if (result['success']) {
          // Show success and navigate to home
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Video uploaded successfully!'),
              backgroundColor: Colors.green,
            ),
          );
          
          // Navigate to home screen
          Navigator.of(context).pushNamedAndRemoveUntil('/home', (route) => false);
        } else {
          throw Exception(result['error'] ?? 'Upload failed');
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isUploading = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Upload failed: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        title: const Text('Post Video'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: _isUploading ? null : () => Navigator.pop(context),
        ),
        actions: [
          TextButton(
            onPressed: _isUploading ? null : _uploadVideo,
            child: Text(
              'Post',
              style: TextStyle(
                color: _isUploading ? Colors.grey : const Color(0xFF00CED1),
                fontWeight: FontWeight.bold,
                fontSize: 16,
              ),
            ),
          ),
        ],
      ),
      body: SafeArea(
        child: _isUploading ? _buildUploadingView() : _buildFormView(),
      ),
      resizeToAvoidBottomInset: true,
    );
  }
  
  Widget _buildUploadingView() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 120,
            height: 120,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(
                color: const Color(0xFF00CED1),
                width: 3,
              ),
            ),
            child: Stack(
              alignment: Alignment.center,
              children: [
                CircularProgressIndicator(
                  value: _uploadProgress,
                  strokeWidth: 6,
                  valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF00CED1)),
                  backgroundColor: Colors.white.withOpacity(0.1),
                ),
                Text(
                  '${(_uploadProgress * 100).toInt()}%',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 30),
          const Text(
            'Uploading your video...',
            style: TextStyle(
              color: Colors.white,
              fontSize: 18,
            ),
          ),
          const SizedBox(height: 10),
          const Text(
            'This may take a few moments',
            style: TextStyle(
              color: Colors.white54,
              fontSize: 14,
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildFormView() {
    return LayoutBuilder(
      builder: (context, constraints) {
        return SingleChildScrollView(
          padding: const EdgeInsets.only(bottom: 20),
          physics: const BouncingScrollPhysics(),
          child: ConstrainedBox(
            constraints: BoxConstraints(
              minHeight: constraints.maxHeight,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Video preview and cover selector
                Container(
                  height: 180,
                  margin: const EdgeInsets.all(16),
                  child: Row(
              children: [
                // Video preview
                Container(
                  width: 100,
                  height: 180,
                  decoration: BoxDecoration(
                    color: Colors.grey[900],
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(10),
                    child: _videoController != null && _videoController!.value.isInitialized
                        ? AspectRatio(
                            aspectRatio: _videoController!.value.aspectRatio,
                            child: widget.isFrontCamera
                                ? Transform(
                                    alignment: Alignment.center,
                                    transform: Matrix4.rotationY(3.14159),
                                    child: VideoPlayer(_videoController!),
                                  )
                                : VideoPlayer(_videoController!),
                          )
                        : Container(
                            color: Colors.grey[800],
                            child: const Center(
                              child: CircularProgressIndicator(
                                color: Color(0xFF00CED1),
                              ),
                            ),
                          ),
                  ),
                ),
                const SizedBox(width: 16),
                // Cover selector
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Select cover',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 8),
                      SizedBox(
                        height: 70,
                        child: ListView.builder(
                          scrollDirection: Axis.horizontal,
                          itemCount: 6, // Number of cover options
                          itemBuilder: (context, index) {
                            final isSelected = _coverFrameIndex == index;
                            return GestureDetector(
                              onTap: () {
                                setState(() {
                                  _coverFrameIndex = index;
                                });
                              },
                              child: Container(
                                width: 60,
                                margin: const EdgeInsets.only(right: 10),
                                decoration: BoxDecoration(
                                  border: Border.all(
                                    color: isSelected
                                        ? const Color(0xFF00CED1)
                                        : Colors.transparent,
                                    width: 2,
                                  ),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: ClipRRect(
                                  borderRadius: BorderRadius.circular(6),
                                  child: Container(
                                    color: Colors.grey[800],
                                    child: Center(
                                      child: Text(
                                        '${index + 1}',
                                        style: const TextStyle(
                                          color: Colors.white54,
                                        ),
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                            );
                          },
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          
          const Divider(color: Colors.white12),
          
          // Caption input
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                TextField(
                  controller: _captionController,
                  style: const TextStyle(color: Colors.white),
                  maxLines: 2,
                  maxLength: 150,
                  decoration: InputDecoration(
                    hintText: 'Add a caption...',
                    hintStyle: const TextStyle(color: Colors.white54),
                    border: InputBorder.none,
                    counterStyle: const TextStyle(color: Colors.white54),
                  ),
                ),
                
                // Suggested hashtags
                const SizedBox(height: 10),
                const Text(
                  'Popular hashtags',
                  style: TextStyle(
                    color: Colors.white54,
                    fontSize: 12,
                  ),
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: _suggestedHashtags.map((tag) => 
                    GestureDetector(
                      onTap: () {
                        final currentText = _captionController.text;
                        if (!currentText.contains(tag)) {
                          _captionController.text = '$currentText $tag';
                        }
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(15),
                        ),
                        child: Text(
                          tag,
                          style: const TextStyle(
                            color: Color(0xFF00CED1),
                            fontSize: 12,
                          ),
                        ),
                      ),
                    ),
                  ).toList(),
                ),
              ],
            ),
          ),
          
          const Divider(color: Colors.white12),
          
          // Music info if available
          if (widget.musicName != null && widget.musicName!.isNotEmpty)
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  const Icon(
                    Icons.music_note,
                    color: Color(0xFF00CED1),
                    size: 20,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Music: ${widget.musicName}',
                      style: const TextStyle(
                        color: Colors.white70,
                        fontSize: 14,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
            ),
          
          if (widget.musicName != null && widget.musicName!.isNotEmpty)
            const Divider(color: Colors.white12),
          
          // Privacy settings
          _buildPrivacySection(),
          
          const Divider(color: Colors.white12),
          
          // Interaction settings
          _buildInteractionSettings(),
          
          const SizedBox(height: 20), // Reduced space at bottom
        ],
      ),
    ),
    );
    },
    );
  }
  
  Widget _buildPrivacySection() {
    return Padding(
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
          const SizedBox(height: 10),
          _buildPrivacyOption(
            'Public',
            'Everyone can view',
            Icons.public,
            'public',
          ),
          _buildPrivacyOption(
            'Friends',
            'Only friends can view',
            Icons.people,
            'friends',
          ),
          _buildPrivacyOption(
            'Private',
            'Only you can view',
            Icons.lock,
            'private',
          ),
        ],
      ),
    );
  }
  
  Widget _buildPrivacyOption(
    String title,
    String subtitle,
    IconData icon,
    String value,
  ) {
    final isSelected = _privacy == value;
    
    return GestureDetector(
      onTap: () {
        setState(() {
          _privacy = value;
        });
      },
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Row(
          children: [
            Icon(
              icon,
              color: isSelected ? const Color(0xFF00CED1) : Colors.white54,
              size: 24,
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      color: isSelected ? const Color(0xFF00CED1) : Colors.white,
                      fontSize: 14,
                      fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                    ),
                  ),
                  Text(
                    subtitle,
                    style: const TextStyle(
                      color: Colors.white54,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
            if (isSelected)
              const Icon(
                Icons.check_circle,
                color: Color(0xFF00CED1),
                size: 20,
              ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildInteractionSettings() {
    return Padding(
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
          const SizedBox(height: 10),
          _buildToggleSetting(
            'Comment',
            _allowComments,
            (value) => setState(() => _allowComments = value),
          ),
          _buildToggleSetting(
            'Duet',
            _allowDuet,
            (value) => setState(() => _allowDuet = value),
          ),
          _buildToggleSetting(
            'Stitch',
            _allowStitch,
            (value) => setState(() => _allowStitch = value),
          ),
          _buildToggleSetting(
            'Download',
            _allowDownload,
            (value) => setState(() => _allowDownload = value),
          ),
        ],
      ),
    );
  }
  
  Widget _buildToggleSetting(
    String title,
    bool value,
    Function(bool) onChanged,
  ) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            title,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 14,
            ),
          ),
          Switch(
            value: value,
            onChanged: onChanged,
            activeColor: const Color(0xFF00CED1),
            inactiveThumbColor: Colors.white54,
            inactiveTrackColor: Colors.white24,
          ),
        ],
      ),
    );
  }
}