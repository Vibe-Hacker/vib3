import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:camera/camera.dart';
import '../providers/auth_provider.dart';
import '../services/live_stream_service.dart';
import '../models/live_stream.dart';
import 'live_stream_host_screen.dart';

class GoLiveScreen extends StatefulWidget {
  const GoLiveScreen({super.key});
  
  @override
  State<GoLiveScreen> createState() => _GoLiveScreenState();
}

class _GoLiveScreenState extends State<GoLiveScreen> {
  final TextEditingController _titleController = TextEditingController();
  final TextEditingController _descriptionController = TextEditingController();
  final List<String> _tags = [];
  final TextEditingController _tagController = TextEditingController();
  
  CameraController? _cameraController;
  List<CameraDescription> _cameras = [];
  bool _isCameraInitialized = false;
  bool _isStarting = false;
  String? _selectedCategory;
  bool _isFollowersOnly = false;
  bool _commentsEnabled = true;
  bool _giftsEnabled = true;
  bool _isFrontCamera = true;
  
  @override
  void initState() {
    super.initState();
    _initializeCamera();
  }
  
  @override
  void dispose() {
    _cameraController?.dispose();
    _titleController.dispose();
    _descriptionController.dispose();
    _tagController.dispose();
    super.dispose();
  }
  
  Future<void> _initializeCamera() async {
    try {
      _cameras = await availableCameras();
      if (_cameras.isNotEmpty) {
        final camera = _cameras.firstWhere(
          (cam) => cam.lensDirection == CameraLensDirection.front,
          orElse: () => _cameras.first,
        );
        
        _cameraController = CameraController(
          camera,
          ResolutionPreset.high,
          enableAudio: true,
        );
        
        await _cameraController!.initialize();
        
        if (mounted) {
          setState(() {
            _isCameraInitialized = true;
          });
        }
      }
    } catch (e) {
      print('Error initializing camera: $e');
    }
  }
  
  void _switchCamera() async {
    if (_cameras.length < 2) return;
    
    HapticFeedback.lightImpact();
    
    setState(() {
      _isFrontCamera = !_isFrontCamera;
    });
    
    await _cameraController?.dispose();
    
    final camera = _cameras.firstWhere(
      (cam) => cam.lensDirection == (_isFrontCamera 
          ? CameraLensDirection.front 
          : CameraLensDirection.back),
      orElse: () => _cameras.first,
    );
    
    _cameraController = CameraController(
      camera,
      ResolutionPreset.high,
      enableAudio: true,
    );
    
    await _cameraController!.initialize();
    
    if (mounted) {
      setState(() {});
    }
  }
  
  void _addTag() {
    final tag = _tagController.text.trim();
    if (tag.isNotEmpty && !_tags.contains(tag) && _tags.length < 5) {
      setState(() {
        _tags.add(tag);
        _tagController.clear();
      });
    }
  }
  
  void _removeTag(String tag) {
    setState(() {
      _tags.remove(tag);
    });
  }
  
  Future<void> _startLiveStream() async {
    final title = _titleController.text.trim();
    if (title.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please enter a title for your stream'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }
    
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final token = authProvider.authToken;
    
    if (token == null) return;
    
    setState(() {
      _isStarting = true;
    });
    
    HapticFeedback.mediumImpact();
    
    try {
      final stream = await LiveStreamService.startStream(
        title: title,
        token: token,
        description: _descriptionController.text.trim(),
        tags: _tags,
        categoryId: _selectedCategory,
        isFollowersOnly: _isFollowersOnly,
        commentsEnabled: _commentsEnabled,
        giftsEnabled: _giftsEnabled,
      );
      
      if (stream != null && mounted) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (context) => LiveStreamHostScreen(
              stream: stream,
              cameraController: _cameraController!,
            ),
          ),
        );
      } else {
        throw Exception('Failed to start stream');
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isStarting = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to start stream: ${e.toString()}'),
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
        backgroundColor: const Color(0xFF1A1A1A),
        elevation: 2,
        leading: IconButton(
          onPressed: () => Navigator.pop(context),
          icon: const Icon(Icons.close, color: Colors.white),
        ),
        title: const Text(
          'Go Live',
          style: TextStyle(
            color: Colors.white,
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),
        actions: [
          if (_cameraController != null && _cameras.length > 1)
            IconButton(
              onPressed: _switchCamera,
              icon: const Icon(Icons.flip_camera_ios, color: Colors.white),
            ),
        ],
      ),
      body: Stack(
        children: [
          // Camera preview
          if (_isCameraInitialized && _cameraController != null)
            Positioned.fill(
              child: CameraPreview(_cameraController!),
            )
          else
            const Center(
              child: CircularProgressIndicator(
                color: Color(0xFFFF0080),
              ),
            ),
          
          // Setup overlay
          Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Colors.black.withOpacity(0.7),
                  Colors.transparent,
                  Colors.transparent,
                  Colors.black.withOpacity(0.9),
                ],
                stops: const [0.0, 0.3, 0.7, 1.0],
              ),
            ),
          ),
          
          // Setup form
          SafeArea(
            child: Column(
              children: [
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Title input
                        TextField(
                          controller: _titleController,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                          decoration: InputDecoration(
                            hintText: 'Add a title...',
                            hintStyle: const TextStyle(
                              color: Colors.white54,
                              fontSize: 18,
                            ),
                            border: InputBorder.none,
                            counterText: '${_titleController.text.length}/50',
                            counterStyle: const TextStyle(
                              color: Colors.white54,
                              fontSize: 12,
                            ),
                          ),
                          maxLength: 50,
                        ),
                        const SizedBox(height: 16),
                        
                        // Description input
                        TextField(
                          controller: _descriptionController,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 14,
                          ),
                          decoration: const InputDecoration(
                            hintText: 'Add a description (optional)...',
                            hintStyle: TextStyle(
                              color: Colors.white54,
                              fontSize: 14,
                            ),
                            border: InputBorder.none,
                          ),
                          maxLines: 3,
                        ),
                        const SizedBox(height: 24),
                        
                        // Tags
                        const Text(
                          'Tags',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: [
                            ..._tags.map((tag) => Chip(
                              label: Text(
                                '#$tag',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 12,
                                ),
                              ),
                              deleteIcon: const Icon(
                                Icons.close,
                                color: Colors.white70,
                                size: 16,
                              ),
                              onDeleted: () => _removeTag(tag),
                              backgroundColor: const Color(0xFFFF0080),
                              side: BorderSide.none,
                            )),
                            if (_tags.length < 5)
                              ActionChip(
                                label: const Text(
                                  'Add tag',
                                  style: TextStyle(
                                    color: Colors.white70,
                                    fontSize: 12,
                                  ),
                                ),
                                onPressed: () {
                                  showDialog(
                                    context: context,
                                    builder: (context) => AlertDialog(
                                      backgroundColor: const Color(0xFF1A1A1A),
                                      title: const Text(
                                        'Add tag',
                                        style: TextStyle(color: Colors.white),
                                      ),
                                      content: TextField(
                                        controller: _tagController,
                                        autofocus: true,
                                        style: const TextStyle(color: Colors.white),
                                        decoration: const InputDecoration(
                                          hintText: 'Enter tag...',
                                          hintStyle: TextStyle(color: Colors.white54),
                                        ),
                                        onSubmitted: (_) {
                                          _addTag();
                                          Navigator.pop(context);
                                        },
                                      ),
                                      actions: [
                                        TextButton(
                                          onPressed: () => Navigator.pop(context),
                                          child: const Text('Cancel'),
                                        ),
                                        TextButton(
                                          onPressed: () {
                                            _addTag();
                                            Navigator.pop(context);
                                          },
                                          child: const Text(
                                            'Add',
                                            style: TextStyle(
                                              color: Color(0xFFFF0080),
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  );
                                },
                                backgroundColor: Colors.white.withOpacity(0.1),
                                side: BorderSide(
                                  color: Colors.white.withOpacity(0.3),
                                ),
                              ),
                          ],
                        ),
                        const SizedBox(height: 24),
                        
                        // Options
                        const Text(
                          'Options',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 8),
                        
                        _buildOption(
                          title: 'Followers only',
                          subtitle: 'Only followers can watch',
                          value: _isFollowersOnly,
                          onChanged: (value) {
                            setState(() {
                              _isFollowersOnly = value;
                            });
                          },
                        ),
                        
                        _buildOption(
                          title: 'Comments',
                          subtitle: 'Allow viewers to comment',
                          value: _commentsEnabled,
                          onChanged: (value) {
                            setState(() {
                              _commentsEnabled = value;
                            });
                          },
                        ),
                        
                        _buildOption(
                          title: 'Gifts',
                          subtitle: 'Allow viewers to send gifts',
                          value: _giftsEnabled,
                          onChanged: (value) {
                            setState(() {
                              _giftsEnabled = value;
                            });
                          },
                        ),
                      ],
                    ),
                  ),
                ),
                
                // Start button
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.8),
                    border: Border(
                      top: BorderSide(
                        color: Colors.white.withOpacity(0.1),
                      ),
                    ),
                  ),
                  child: SafeArea(
                    top: false,
                    child: SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: _isStarting ? null : _startLiveStream,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFFF0080),
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          disabledBackgroundColor: const Color(0xFFFF0080).withOpacity(0.5),
                        ),
                        child: _isStarting
                            ? const SizedBox(
                                width: 24,
                                height: 24,
                                child: CircularProgressIndicator(
                                  color: Colors.white,
                                  strokeWidth: 2,
                                ),
                              )
                            : const Text(
                                'Go Live',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildOption({
    required String title,
    required String subtitle,
    required bool value,
    required ValueChanged<bool> onChanged,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  subtitle,
                  style: const TextStyle(
                    color: Colors.white54,
                    fontSize: 13,
                  ),
                ),
              ],
            ),
          ),
          Switch(
            value: value,
            onChanged: onChanged,
            activeColor: const Color(0xFFFF0080),
          ),
        ],
      ),
    );
  }
}