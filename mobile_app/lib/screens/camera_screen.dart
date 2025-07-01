import 'dart:io';
import 'package:flutter/material.dart';
import 'package:camera/camera.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import '../providers/video_provider.dart';
import '../config/app_config.dart';

class CameraScreen extends StatefulWidget {
  const CameraScreen({super.key});

  @override
  State<CameraScreen> createState() => _CameraScreenState();
}

class _CameraScreenState extends State<CameraScreen> with TickerProviderStateMixin {
  CameraController? _cameraController;
  List<CameraDescription>? _cameras;
  bool _isRecording = false;
  bool _isInitialized = false;
  int _selectedCameraIndex = 0;
  
  late AnimationController _recordButtonController;
  late Animation<double> _recordButtonScale;

  @override
  void initState() {
    super.initState();
    _initializeCamera();
    
    _recordButtonController = AnimationController(
      duration: const Duration(milliseconds: 100),
      vsync: this,
    );
    
    _recordButtonScale = Tween<double>(
      begin: 1.0,
      end: 0.9,
    ).animate(_recordButtonController);
  }

  @override
  void dispose() {
    _cameraController?.dispose();
    _recordButtonController.dispose();
    super.dispose();
  }

  Future<void> _initializeCamera() async {
    try {
      _cameras = await availableCameras();
      if (_cameras!.isNotEmpty) {
        _cameraController = CameraController(
          _cameras![_selectedCameraIndex],
          ResolutionPreset.high,
          enableAudio: true,
        );

        await _cameraController!.initialize();
        
        if (mounted) {
          setState(() {
            _isInitialized = true;
          });
        }
      }
    } catch (e) {
      debugPrint('Error initializing camera: $e');
    }
  }

  Future<void> _toggleCamera() async {
    if (_cameras != null && _cameras!.length > 1) {
      setState(() {
        _selectedCameraIndex = (_selectedCameraIndex + 1) % _cameras!.length;
        _isInitialized = false;
      });
      
      await _cameraController?.dispose();
      await _initializeCamera();
    }
  }

  Future<void> _startRecording() async {
    if (!_isInitialized || _isRecording) return;

    try {
      await _cameraController!.startVideoRecording();
      setState(() {
        _isRecording = true;
      });
      _recordButtonController.forward();
    } catch (e) {
      debugPrint('Error starting video recording: $e');
    }
  }

  Future<void> _stopRecording() async {
    if (!_isRecording) return;

    try {
      final video = await _cameraController!.stopVideoRecording();
      setState(() {
        _isRecording = false;
      });
      _recordButtonController.reverse();
      
      if (mounted) {
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (context) => VideoPreviewScreen(videoPath: video.path),
          ),
        );
      }
    } catch (e) {
      debugPrint('Error stopping video recording: $e');
    }
  }

  Future<void> _pickVideoFromGallery() async {
    final picker = ImagePicker();
    final video = await picker.pickVideo(source: ImageSource.gallery);
    
    if (video != null && mounted) {
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (context) => VideoPreviewScreen(videoPath: video.path),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // Camera preview
          if (_isInitialized && _cameraController != null)
            Positioned.fill(
              child: CameraPreview(_cameraController!),
            )
          else
            const Positioned.fill(
              child: Center(
                child: CircularProgressIndicator(
                  color: Colors.white,
                ),
              ),
            ),

          // Top controls
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: SafeArea(
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      Colors.black.withOpacity(0.7),
                      Colors.transparent,
                    ],
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    // Close button
                    GestureDetector(
                      onTap: () => Navigator.of(context).pop(),
                      child: Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          color: Colors.black.withOpacity(0.5),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.close,
                          color: Colors.white,
                        ),
                      ),
                    ),

                    // Recording indicator
                    if (_isRecording)
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.red,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Container(
                              width: 8,
                              height: 8,
                              decoration: const BoxDecoration(
                                color: Colors.white,
                                shape: BoxShape.circle,
                              ),
                            ),
                            const SizedBox(width: 6),
                            const Text(
                              'REC',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ),

                    // Camera flip button
                    GestureDetector(
                      onTap: _toggleCamera,
                      child: Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          color: Colors.black.withOpacity(0.5),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.flip_camera_ios,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

          // Bottom controls
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: SafeArea(
              child: Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      Colors.transparent,
                      Colors.black.withOpacity(0.7),
                    ],
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    // Gallery button
                    GestureDetector(
                      onTap: _pickVideoFromGallery,
                      child: Container(
                        width: 50,
                        height: 50,
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: Colors.white.withOpacity(0.3),
                            width: 1,
                          ),
                        ),
                        child: const Icon(
                          Icons.photo_library,
                          color: Colors.white,
                          size: 24,
                        ),
                      ),
                    ),

                    // Record button
                    GestureDetector(
                      onTapDown: (_) => _startRecording(),
                      onTapUp: (_) => _stopRecording(),
                      onTapCancel: () => _stopRecording(),
                      child: AnimatedBuilder(
                        animation: _recordButtonScale,
                        builder: (context, child) {
                          return Transform.scale(
                            scale: _recordButtonScale.value,
                            child: Container(
                              width: 80,
                              height: 80,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color: Colors.white,
                                  width: 4,
                                ),
                              ),
                              child: Container(
                                margin: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: _isRecording ? Colors.red : Colors.white,
                                  shape: _isRecording ? BoxShape.rectangle : BoxShape.circle,
                                  borderRadius: _isRecording ? BorderRadius.circular(8) : null,
                                ),
                              ),
                            ),
                          );
                        },
                      ),
                    ),

                    // Speed/Timer button
                    Container(
                      width: 50,
                      height: 50,
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: Colors.white.withOpacity(0.3),
                          width: 1,
                        ),
                      ),
                      child: const Icon(
                        Icons.timer,
                        color: Colors.white,
                        size: 24,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

          // Side controls
          Positioned(
            right: 16,
            top: MediaQuery.of(context).size.height * 0.3,
            child: Column(
              children: [
                // Flash button
                GestureDetector(
                  onTap: () {
                    // TODO: Toggle flash
                  },
                  child: Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: Colors.black.withOpacity(0.5),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.flash_off,
                      color: Colors.white,
                      size: 20,
                    ),
                  ),
                ),
                
                const SizedBox(height: 16),
                
                // Beauty filter button
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.5),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.face_retouching_natural,
                    color: Colors.white,
                    size: 20,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class VideoPreviewScreen extends StatefulWidget {
  final String videoPath;

  const VideoPreviewScreen({
    super.key,
    required this.videoPath,
  });

  @override
  State<VideoPreviewScreen> createState() => _VideoPreviewScreenState();
}

class _VideoPreviewScreenState extends State<VideoPreviewScreen> {
  final TextEditingController _descriptionController = TextEditingController();
  final TextEditingController _tagController = TextEditingController();
  final List<String> _tags = [];

  @override
  void dispose() {
    _descriptionController.dispose();
    _tagController.dispose();
    super.dispose();
  }

  void _addTag() {
    final tag = _tagController.text.trim();
    if (tag.isNotEmpty && !_tags.contains(tag)) {
      setState(() {
        _tags.add(tag);
      });
      _tagController.clear();
    }
  }

  void _removeTag(String tag) {
    setState(() {
      _tags.remove(tag);
    });
  }

  Future<void> _uploadVideo() async {
    final videoProvider = Provider.of<VideoProvider>(context, listen: false);
    
    final success = await videoProvider.uploadVideo(
      File(widget.videoPath),
      _descriptionController.text.trim(),
      _tags,
    );

    if (success && mounted) {
      Navigator.of(context).popUntil((route) => route.isFirst);
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(videoProvider.error ?? 'Upload failed'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          onPressed: () => Navigator.of(context).pop(),
          icon: const Icon(Icons.arrow_back, color: Colors.white),
        ),
        title: const Text(
          'Share Video',
          style: TextStyle(color: Colors.white),
        ),
        actions: [
          Consumer<VideoProvider>(
            builder: (context, videoProvider, child) {
              return TextButton(
                onPressed: videoProvider.isLoading ? null : _uploadVideo,
                child: videoProvider.isLoading
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          color: Colors.white,
                          strokeWidth: 2,
                        ),
                      )
                    : const Text(
                        'Share',
                        style: TextStyle(
                          color: Color(AppConfig.primaryColor),
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
              );
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Video preview thumbnail
            Container(
              width: double.infinity,
              height: 200,
              decoration: BoxDecoration(
                color: Colors.grey[900],
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(
                Icons.play_circle_outline,
                color: Colors.white,
                size: 64,
              ),
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
              decoration: InputDecoration(
                hintText: 'Tell everyone what your video is about...',
                hintStyle: TextStyle(color: Colors.white.withOpacity(0.5)),
                filled: true,
                fillColor: Colors.white.withOpacity(0.1),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
              ),
            ),

            const SizedBox(height: 24),

            // Tags section
            const Text(
              'Tags',
              style: TextStyle(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _tagController,
                    style: const TextStyle(color: Colors.white),
                    onSubmitted: (_) => _addTag(),
                    decoration: InputDecoration(
                      hintText: 'Add tags...',
                      hintStyle: TextStyle(color: Colors.white.withOpacity(0.5)),
                      filled: true,
                      fillColor: Colors.white.withOpacity(0.1),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide.none,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                ElevatedButton(
                  onPressed: _addTag,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(AppConfig.primaryColor),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: const Text(
                    'Add',
                    style: TextStyle(color: Colors.white),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 12),

            // Tags display
            if (_tags.isNotEmpty)
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: _tags.map((tag) {
                  return Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: const Color(AppConfig.primaryColor).withOpacity(0.2),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: const Color(AppConfig.primaryColor),
                        width: 1,
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          '#$tag',
                          style: const TextStyle(
                            color: Color(AppConfig.primaryColor),
                            fontSize: 14,
                          ),
                        ),
                        const SizedBox(width: 4),
                        GestureDetector(
                          onTap: () => _removeTag(tag),
                          child: const Icon(
                            Icons.close,
                            color: Color(AppConfig.primaryColor),
                            size: 16,
                          ),
                        ),
                      ],
                    ),
                  );
                }).toList(),
              ),
          ],
        ),
      ),
    );
  }
}