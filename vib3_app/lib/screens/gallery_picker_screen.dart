import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:path_provider/path_provider.dart';
import 'dart:io';
import 'video_creator/video_creator_screen.dart';

class GalleryPickerScreen extends StatefulWidget {
  const GalleryPickerScreen({super.key});

  @override
  State<GalleryPickerScreen> createState() => _GalleryPickerScreenState();
}

class _GalleryPickerScreenState extends State<GalleryPickerScreen> {
  final ImagePicker _picker = ImagePicker();
  List<XFile> _mediaFiles = [];
  bool _isLoading = true;
  bool _hasPermission = false;
  String? _selectedVideoPath;
  
  @override
  void initState() {
    super.initState();
    _checkPermissionAndLoadMedia();
  }
  
  Future<void> _checkPermissionAndLoadMedia() async {
    // Check gallery permission
    final status = await Permission.photos.status;
    if (status.isGranted) {
      setState(() {
        _hasPermission = true;
      });
      await _loadMediaFiles();
    } else {
      final result = await Permission.photos.request();
      if (result.isGranted) {
        setState(() {
          _hasPermission = true;
        });
        await _loadMediaFiles();
      } else {
        setState(() {
          _hasPermission = false;
          _isLoading = false;
        });
      }
    }
  }
  
  Future<void> _loadMediaFiles() async {
    try {
      // Get recent videos from gallery
      // Note: image_picker doesn't support getting all media at once
      // For production, consider using photo_manager package
      setState(() {
        _isLoading = false;
      });
    } catch (e) {
      print('Error loading media: $e');
      setState(() {
        _isLoading = false;
      });
    }
  }
  
  Future<void> _pickVideo() async {
    try {
      final XFile? video = await _picker.pickVideo(
        source: ImageSource.gallery,
        maxDuration: const Duration(minutes: 10),
      );
      
      if (video != null && mounted) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (context) => VideoCreatorScreen(
              videoPath: video.path,
            ),
          ),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error selecting video: ${e.toString()}'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }
  
  Future<void> _pickMultipleVideos() async {
    try {
      // For multiple selection, we'd need a different approach
      // This is a placeholder for the multi-select feature
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Select videos one at a time for now'),
        ),
      );
      _pickVideo();
    } catch (e) {
      print('Error picking multiple videos: $e');
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        title: const Text('Select Video'),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          if (_selectedVideoPath != null)
            TextButton(
              onPressed: () {
                Navigator.pushReplacement(
                  context,
                  MaterialPageRoute(
                    builder: (context) => VideoCreatorScreen(
                      videoPath: _selectedVideoPath!,
                    ),
                  ),
                );
              },
              child: const Text(
                'Next',
                style: TextStyle(
                  color: Color(0xFF00CED1),
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
        ],
      ),
      body: _buildBody(),
    );
  }
  
  Widget _buildBody() {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(
          color: Color(0xFF00CED1),
        ),
      );
    }
    
    if (!_hasPermission) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.photo_library_outlined,
              size: 80,
              color: Colors.white54,
            ),
            const SizedBox(height: 20),
            const Text(
              'Gallery Access Required',
              style: TextStyle(
                color: Colors.white,
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 10),
            const Text(
              'Please grant access to select videos',
              style: TextStyle(
                color: Colors.white54,
                fontSize: 14,
              ),
            ),
            const SizedBox(height: 30),
            ElevatedButton(
              onPressed: () async {
                await openAppSettings();
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF00CED1),
                foregroundColor: Colors.black,
                padding: const EdgeInsets.symmetric(
                  horizontal: 30,
                  vertical: 15,
                ),
              ),
              child: const Text('Open Settings'),
            ),
          ],
        ),
      );
    }
    
    return Column(
      children: [
        // Tab selector
        Container(
          height: 50,
          decoration: BoxDecoration(
            border: Border(
              bottom: BorderSide(
                color: Colors.white.withOpacity(0.1),
              ),
            ),
          ),
          child: Row(
            children: [
              Expanded(
                child: _buildTabButton('Camera Roll', true),
              ),
              Expanded(
                child: _buildTabButton('Albums', false),
              ),
            ],
          ),
        ),
        
        // Quick actions
        Container(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Expanded(
                child: _buildQuickAction(
                  icon: Icons.video_library,
                  label: 'Select Video',
                  onTap: _pickVideo,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: _buildQuickAction(
                  icon: Icons.select_all,
                  label: 'Multi-Select',
                  onTap: _pickMultipleVideos,
                ),
              ),
            ],
          ),
        ),
        
        // Media grid placeholder
        Expanded(
          child: _buildMediaGrid(),
        ),
      ],
    );
  }
  
  Widget _buildTabButton(String label, bool isSelected) {
    return Container(
      alignment: Alignment.center,
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(
            color: isSelected ? const Color(0xFF00CED1) : Colors.transparent,
            width: 2,
          ),
        ),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: isSelected ? const Color(0xFF00CED1) : Colors.white54,
          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
        ),
      ),
    );
  }
  
  Widget _buildQuickAction({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 20),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.05),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Column(
          children: [
            Icon(
              icon,
              color: const Color(0xFF00CED1),
              size: 30,
            ),
            const SizedBox(height: 8),
            Text(
              label,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 12,
              ),
            ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildMediaGrid() {
    // Placeholder grid
    return GridView.builder(
      padding: const EdgeInsets.all(2),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        crossAxisSpacing: 2,
        mainAxisSpacing: 2,
      ),
      itemCount: 12, // Placeholder count
      itemBuilder: (context, index) {
        return GestureDetector(
          onTap: () {
            // In production, this would select the actual video
            _pickVideo();
          },
          child: Container(
            color: Colors.grey[900],
            child: Stack(
              fit: StackFit.expand,
              children: [
                // Thumbnail placeholder
                const Icon(
                  Icons.video_file,
                  color: Colors.white24,
                  size: 40,
                ),
                // Duration label
                Positioned(
                  bottom: 4,
                  right: 4,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 6,
                      vertical: 2,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.black.withOpacity(0.7),
                      borderRadius: BorderRadius.circular(3),
                    ),
                    child: const Text(
                      '0:15',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}