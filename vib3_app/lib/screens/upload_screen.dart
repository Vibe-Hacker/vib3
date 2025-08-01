import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:video_player/video_player.dart';
import 'package:provider/provider.dart';
import 'dart:io';
import '../providers/auth_provider.dart';
import '../services/upload_service.dart';
import '../services/video_processor_service.dart';
import '../services/thumbnail_service.dart';
import '../services/video_player_manager.dart';
import '../widgets/grok_ai_assistant.dart';
import 'video_recording_screen.dart';
import 'video_creator/video_creator_screen.dart';
import 'gallery_picker_screen.dart';

class UploadScreen extends StatefulWidget {
  final Map<String, dynamic>? arguments;
  
  const UploadScreen({
    super.key,
    this.arguments,
  });

  @override
  State<UploadScreen> createState() => _UploadScreenState();
}

class _UploadScreenState extends State<UploadScreen> with AutomaticKeepAliveClientMixin {
  final TextEditingController _descriptionController = TextEditingController();
  final TextEditingController _hashtagsController = TextEditingController();
  final ImagePicker _picker = ImagePicker();
  XFile? _selectedVideo;
  VideoPlayerController? _videoController;
  bool _isUploading = false;
  bool _allowComments = true;
  bool _allowDuet = true;
  bool _allowStitch = true;
  String _privacy = 'public';
  String? _selectedMusicName;
  VideoCompatibility? _videoCompatibility;
  bool _isCheckingVideo = false;
  
  @override
  bool get wantKeepAlive => false;

  @override
  void initState() {
    super.initState();
    // Check if we received video path and music from navigation
    if (widget.arguments != null) {
      final videoPath = widget.arguments!['videoPath'] as String?;
      final musicName = widget.arguments!['musicName'] as String?;
      
      if (videoPath != null) {
        _selectedVideo = XFile(videoPath);
        _initializeVideoPlayer();
        _checkVideoCompatibility();
      }
      
      if (musicName != null) {
        _selectedMusicName = musicName;
      }
    }
  }

  @override
  void dispose() {
    _descriptionController.dispose();
    _hashtagsController.dispose();
    _videoController?.dispose();
    super.dispose();
  }
  
  void _resetState() {
    setState(() {
      _selectedVideo = null;
      _videoController?.dispose();
      _videoController = null;
      _descriptionController.clear();
      _hashtagsController.clear();
      _isUploading = false;
      _allowComments = true;
      _allowDuet = true;
      _allowStitch = true;
      _privacy = 'public';
      _selectedMusicName = null;
      _videoCompatibility = null;
      _isCheckingVideo = false;
    });
  }

  Future<void> _selectVideo() async {
    try {
      final XFile? video = await _picker.pickVideo(
        source: ImageSource.gallery,
        maxDuration: const Duration(minutes: 10),
      );
      
      if (video != null) {
        setState(() {
          _selectedVideo = video;
        });
        _initializeVideoPlayer();
        _checkVideoCompatibility();
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error selecting video: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  Future<void> _recordVideo() async {
    try {
      // Pause all videos before navigating
      await VideoPlayerManager.instance.pauseAllVideos();
      
      // Navigate to the advanced recording screen
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => const VideoRecordingScreen(),
        ),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error opening camera: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  Future<void> _editVideo() async {
    try {
      final XFile? video = await _picker.pickVideo(
        source: ImageSource.gallery,
        maxDuration: const Duration(minutes: 10),
      );
      
      if (video != null) {
        // Pause all videos before navigating
        await VideoPlayerManager.instance.pauseAllVideos();
        
        // Navigate directly to editing screen
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => VideoCreatorScreen(videoPath: video.path),
          ),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error selecting video: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  Future<void> _initializeVideoPlayer() async {
    if (_selectedVideo == null) return;

    _videoController?.dispose();
    _videoController = VideoPlayerController.file(File(_selectedVideo!.path));
    
    try {
      await _videoController!.initialize();
      setState(() {});
      _videoController!.setLooping(true);
      _videoController!.play();
    } catch (e) {
      print('Error initializing video player: $e');
    }
  }

  Future<void> _checkVideoCompatibility() async {
    if (_selectedVideo == null) return;
    
    setState(() {
      _isCheckingVideo = true;
      _videoCompatibility = null;
    });
    
    try {
      final compatibility = await VideoProcessorService.checkVideoCompatibility(_selectedVideo!.path);
      setState(() {
        _videoCompatibility = compatibility;
        _isCheckingVideo = false;
      });
      
      if (!compatibility.isCompatible) {
        _showCompatibilityWarning();
      }
    } catch (e) {
      print('Error checking video compatibility: $e');
      setState(() {
        _isCheckingVideo = false;
      });
    }
  }
  
  void _showCompatibilityWarning() {
    if (_videoCompatibility == null || _videoCompatibility!.isCompatible) return;
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1A1A1A),
        title: Row(
          children: [
            Icon(Icons.warning_amber_rounded, color: Colors.orange),
            SizedBox(width: 8),
            Text(
              'Video Compatibility Issue',
              style: TextStyle(color: Colors.white),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              _videoCompatibility!.reason ?? 'This video may have compatibility issues.',
              style: TextStyle(color: Colors.white70),
            ),
            SizedBox(height: 16),
            Text(
              'The video will still upload, but:',
              style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 8),
            Text(
              '• Thumbnail may not generate properly',
              style: TextStyle(color: Colors.white70),
            ),
            Text(
              '• Some devices may have playback issues',
              style: TextStyle(color: Colors.white70),
            ),
            SizedBox(height: 16),
            Text(
              'For best results, try recording with VIB3\'s camera.',
              style: TextStyle(color: Color(0xFF00CED1)),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('Continue Anyway', style: TextStyle(color: Colors.grey)),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              _recordVideo();
            },
            child: Text('Record New Video', style: TextStyle(color: Color(0xFF00CED1))),
          ),
        ],
      ),
    );
  }

  Future<void> _uploadVideo() async {
    if (_selectedVideo == null) return;

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final token = authProvider.authToken;
    
    if (token == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please login to upload videos'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    setState(() {
      _isUploading = true;
    });

    try {
      // Show progress dialog
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => WillPopScope(
          onWillPop: () async => false,
          child: AlertDialog(
            backgroundColor: const Color(0xFF1A1A1A),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                CircularProgressIndicator(color: Color(0xFF00CED1)),
                SizedBox(height: 16),
                Text(
                  'Processing video...',
                  style: TextStyle(color: Colors.white),
                ),
                SizedBox(height: 8),
                Text(
                  'Generating thumbnail and uploading',
                  style: TextStyle(color: Colors.white70, fontSize: 12),
                ),
              ],
            ),
          ),
        ),
      );
      
      final result = await UploadService.uploadVideo(
        videoFile: File(_selectedVideo!.path),
        description: _descriptionController.text.trim(),
        privacy: _privacy,
        allowComments: _allowComments,
        allowDuet: _allowDuet,
        allowStitch: _allowStitch,
        token: token,
        hashtags: _hashtagsController.text.trim(),
        musicName: _selectedMusicName,
      );
      
      // Close progress dialog
      Navigator.pop(context);

      if (result['success'] == true) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Video uploaded successfully!'),
            backgroundColor: Color(0xFF00CED1),
          ),
        );
        Navigator.pop(context);
      } else {
        throw Exception('Upload failed');
      }
    } catch (e) {
      // Make sure dialog is closed
      if (Navigator.canPop(context)) {
        Navigator.pop(context);
      }
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Upload failed: $e'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      setState(() {
        _isUploading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    super.build(context); // Required for AutomaticKeepAliveClientMixin
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        title: ShaderMask(
          shaderCallback: (bounds) => const LinearGradient(
            colors: [
              Color(0xFF00CED1), // Cyan
              Color(0xFF1E90FF), // Blue
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ).createShader(bounds),
          child: const Text(
            'Upload',
            style: TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.bold,
              fontSize: 18,
            ),
          ),
        ),
        leading: _selectedVideo != null
            ? IconButton(
                icon: const Icon(Icons.close, color: Colors.white),
                onPressed: () {
                  _resetState();
                },
              )
            : null,
        actions: [
          if (_selectedVideo != null && !_isUploading) ...[
            TextButton(
              onPressed: () async {
                // Pause all videos before navigating
                await VideoPlayerManager.instance.pauseAllVideos();
                
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => VideoCreatorScreen(videoPath: _selectedVideo!.path),
                  ),
                );
              },
              child: const Text(
                'Edit',
                style: TextStyle(
                  color: Colors.grey,
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
            ),
            TextButton(
              onPressed: _uploadVideo,
              child: const Text(
                'Post',
                style: TextStyle(
                  color: Color(0xFF00CED1),
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
            ),
          ],
        ],
      ),
      body: _selectedVideo == null
          ? _buildVideoSelection()
          : _buildVideoPreview(),
    );
  }

  Widget _buildVideoSelection() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          ShaderMask(
            shaderCallback: (bounds) => const LinearGradient(
              colors: [
                Color(0xFF00CED1), // Cyan
                Color(0xFF1E90FF), // Blue
              ],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ).createShader(bounds),
            child: const Icon(
              Icons.video_collection_outlined,
              size: 80,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 24),
          const Text(
            'Select or record a video',
            style: TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 32),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              _UploadButton(
                icon: Icons.video_library,
                label: 'Gallery',
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => const GalleryPickerScreen(),
                    ),
                  );
                },
              ),
              _UploadButton(
                icon: Icons.videocam,
                label: 'Record',
                onTap: _recordVideo,
              ),
            ],
          ),
          const SizedBox(height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              _UploadButton(
                icon: Icons.edit,
                label: 'Edit Video',
                onTap: _editVideo,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildVideoPreview() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Video preview with compatibility indicator
          Stack(
            children: [
              Container(
                width: double.infinity,
                height: 400,
                decoration: BoxDecoration(
                  color: Colors.grey[900],
                  borderRadius: BorderRadius.circular(12),
                ),
                child: _videoController != null && _videoController!.value.isInitialized
                    ? ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: AspectRatio(
                          aspectRatio: _videoController!.value.aspectRatio,
                          child: VideoPlayer(_videoController!),
                        ),
                      )
                    : const Center(
                        child: CircularProgressIndicator(color: Color(0xFF00CED1)),
                      ),
              ),
              // Compatibility indicator
              if (_videoCompatibility != null && !_videoCompatibility!.isCompatible)
                Positioned(
                  top: 12,
                  right: 12,
                  child: Container(
                    padding: EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.orange.withOpacity(0.9),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.warning, size: 16, color: Colors.white),
                        SizedBox(width: 4),
                        Text(
                          'Compatibility Issue',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              // Checking indicator
              if (_isCheckingVideo)
                Positioned(
                  top: 12,
                  left: 12,
                  child: Container(
                    padding: EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.black.withOpacity(0.7),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        SizedBox(
                          width: 14,
                          height: 14,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                          ),
                        ),
                        SizedBox(width: 6),
                        Text(
                          'Checking video...',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 24),

          // Description input
          const Text(
            'Description',
            style: TextStyle(
              color: Colors.white,
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          TextField(
            controller: _descriptionController,
            style: const TextStyle(color: Colors.white),
            maxLines: 3,
            maxLength: 500,
            decoration: InputDecoration(
              hintText: 'Describe your video...',
              hintStyle: TextStyle(color: Colors.grey[500]),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: BorderSide(color: Colors.grey[700]!),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: BorderSide(color: Colors.grey[700]!),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: const BorderSide(color: Color(0xFF00CED1)),
              ),
              filled: true,
              fillColor: Colors.grey[900],
            ),
          ),
          const SizedBox(height: 16),

          // Hashtags input
          const Text(
            'Hashtags',
            style: TextStyle(
              color: Colors.white,
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          TextField(
            controller: _hashtagsController,
            style: const TextStyle(color: Colors.white),
            maxLines: 1,
            decoration: InputDecoration(
              hintText: '#vib3 #fyp #viral (separate with spaces)',
              hintStyle: TextStyle(color: Colors.grey[500]),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: BorderSide(color: Colors.grey[700]!),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: BorderSide(color: Colors.grey[700]!),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: const BorderSide(color: Color(0xFF00CED1)),
              ),
              filled: true,
              fillColor: Colors.grey[900],
            ),
          ),
          const SizedBox(height: 16),

          // Grok AI Assistant
          GrokAIAssistant(
            videoContext: _descriptionController.text.isNotEmpty 
                ? _descriptionController.text 
                : 'video upload',
            onDescriptionGenerated: (description) {
              setState(() {
                _descriptionController.text = description;
              });
            },
            onHashtagsGenerated: (hashtags) {
              setState(() {
                _hashtagsController.text = hashtags.join(' ');
              });
            },
          ),
          const SizedBox(height: 24),

          // Privacy settings
          const Text(
            'Privacy',
            style: TextStyle(
              color: Colors.white,
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Container(
            decoration: BoxDecoration(
              color: Colors.grey[900],
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Colors.grey[700]!),
            ),
            child: DropdownButtonHideUnderline(
              child: DropdownButton<String>(
                value: _privacy,
                isExpanded: true,
                dropdownColor: Colors.grey[900],
                style: const TextStyle(color: Colors.white),
                icon: const Icon(Icons.arrow_drop_down, color: Colors.white),
                items: const [
                  DropdownMenuItem(value: 'public', child: Text('Public')),
                  DropdownMenuItem(value: 'friends', child: Text('Friends')),
                  DropdownMenuItem(value: 'private', child: Text('Private')),
                ],
                onChanged: (value) {
                  if (value != null) {
                    setState(() {
                      _privacy = value;
                    });
                  }
                },
              ),
            ),
          ),
          const SizedBox(height: 24),

          // Additional settings
          const Text(
            'Settings',
            style: TextStyle(
              color: Colors.white,
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          _SettingTile(
            title: 'Allow comments',
            value: _allowComments,
            onChanged: (value) => setState(() => _allowComments = value),
          ),
          _SettingTile(
            title: 'Allow Duet',
            value: _allowDuet,
            onChanged: (value) => setState(() => _allowDuet = value),
          ),
          _SettingTile(
            title: 'Allow Stitch',
            value: _allowStitch,
            onChanged: (value) => setState(() => _allowStitch = value),
          ),
          const SizedBox(height: 32),

          // Upload button
          if (_isUploading)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 16),
              decoration: BoxDecoration(
                color: Colors.grey[700],
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      color: Colors.white,
                      strokeWidth: 2,
                    ),
                  ),
                  SizedBox(width: 12),
                  Text(
                    'Uploading...',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            )
          else
            ElevatedButton(
              onPressed: _uploadVideo,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.transparent,
                foregroundColor: Colors.white,
                minimumSize: const Size(double.infinity, 50),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                elevation: 0,
              ).copyWith(
                backgroundColor: MaterialStateProperty.all(Colors.transparent),
              ),
              child: Container(
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [
                      Color(0xFF00CED1), // Cyan
                      Color(0xFF1E90FF), // Blue
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(8),
                ),
                padding: const EdgeInsets.symmetric(vertical: 16),
                child: const Center(
                  child: Text(
                    'Upload Video',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _UploadButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _UploadButton({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 120,
        padding: const EdgeInsets.symmetric(vertical: 20),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [
              Color(0xFF00CED1), // Cyan
              Color(0xFF1E90FF), // Blue
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF00CED1).withOpacity(0.3),
              blurRadius: 15,
              spreadRadius: 2,
            ),
          ],
        ),
        child: Column(
          children: [
            Icon(icon, color: Colors.white, size: 32),
            const SizedBox(height: 8),
            Text(
              label,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 14,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SettingTile extends StatelessWidget {
  final String title;
  final bool value;
  final ValueChanged<bool> onChanged;

  const _SettingTile({
    required this.title,
    required this.value,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: Colors.grey[900],
        borderRadius: BorderRadius.circular(8),
      ),
      child: SwitchListTile(
        title: Text(
          title,
          style: const TextStyle(color: Colors.white),
        ),
        value: value,
        onChanged: onChanged,
        activeColor: const Color(0xFF00CED1),
        inactiveThumbColor: Colors.grey[600],
        inactiveTrackColor: Colors.grey[800],
      ),
    );
  }
}