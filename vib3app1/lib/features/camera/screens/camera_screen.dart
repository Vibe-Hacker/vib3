import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:camera/camera.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:go_router/go_router.dart';
import 'dart:async';
import 'dart:io';
import '../../../app/theme/app_theme.dart';

// Camera modes
enum CameraMode { photo, video, story, live }

class CameraScreen extends StatefulWidget {
  const CameraScreen({Key? key}) : super(key: key);

  @override
  State<CameraScreen> createState() => _CameraScreenState();
}

class _CameraScreenState extends State<CameraScreen> with WidgetsBindingObserver {
  CameraController? _controller;
  List<CameraDescription>? _cameras;
  int _selectedCameraIndex = 0;
  bool _isRecording = false;
  bool _isFlashOn = false;
  Timer? _recordingTimer;
  int _recordingDuration = 0;
  double _zoomLevel = 1.0;
  double _minZoom = 1.0;
  double _maxZoom = 8.0;
  
  CameraMode _currentMode = CameraMode.video;
  
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _initializeCamera();
  }
  
  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _controller?.dispose();
    _recordingTimer?.cancel();
    super.dispose();
  }
  
  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    final CameraController? cameraController = _controller;
    
    if (cameraController == null || !cameraController.value.isInitialized) {
      return;
    }
    
    if (state == AppLifecycleState.inactive) {
      cameraController.dispose();
    } else if (state == AppLifecycleState.resumed) {
      _initializeCamera();
    }
  }
  
  Future<void> _initializeCamera() async {
    // Check permissions
    final cameraStatus = await Permission.camera.request();
    final micStatus = await Permission.microphone.request();
    
    if (cameraStatus.isDenied || micStatus.isDenied) {
      _showPermissionDeniedDialog();
      return;
    }
    
    // Get available cameras
    _cameras = await availableCameras();
    if (_cameras == null || _cameras!.isEmpty) return;
    
    // Initialize controller
    await _setUpCameraController(_cameras![_selectedCameraIndex]);
  }
  
  Future<void> _setUpCameraController(CameraDescription camera) async {
    if (_controller != null) {
      await _controller!.dispose();
    }
    
    _controller = CameraController(
      camera,
      ResolutionPreset.high,
      enableAudio: true,
    );
    
    try {
      await _controller!.initialize();
      _minZoom = await _controller!.getMinZoomLevel();
      _maxZoom = await _controller!.getMaxZoomLevel();
      setState(() {});
    } catch (e) {
      print('Error initializing camera: $e');
    }
  }
  
  void _toggleCamera() async {
    if (_cameras == null || _cameras!.length < 2) return;
    
    _selectedCameraIndex = (_selectedCameraIndex + 1) % _cameras!.length;
    await _setUpCameraController(_cameras![_selectedCameraIndex]);
  }
  
  void _toggleFlash() async {
    if (_controller == null) return;
    
    _isFlashOn = !_isFlashOn;
    await _controller!.setFlashMode(_isFlashOn ? FlashMode.torch : FlashMode.off);
    setState(() {});
  }
  
  void _startRecording() async {
    if (_controller == null || !_controller!.value.isInitialized) return;
    
    try {
      await _controller!.startVideoRecording();
      setState(() {
        _isRecording = true;
        _recordingDuration = 0;
      });
      
      // Start timer
      _recordingTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
        setState(() {
          _recordingDuration++;
        });
        
        // Auto-stop at 60 seconds
        if (_recordingDuration >= 60) {
          _stopRecording();
        }
      });
      
      HapticFeedback.mediumImpact();
    } catch (e) {
      print('Error starting recording: $e');
    }
  }
  
  void _stopRecording() async {
    if (_controller == null || !_isRecording) return;
    
    try {
      final video = await _controller!.stopVideoRecording();
      setState(() {
        _isRecording = false;
      });
      _recordingTimer?.cancel();
      
      HapticFeedback.mediumImpact();
      
      // Navigate to preview/edit screen
      _navigateToPreview(video.path, isVideo: true);
    } catch (e) {
      print('Error stopping recording: $e');
    }
  }
  
  void _takePicture() async {
    if (_controller == null || !_controller!.value.isInitialized) return;
    
    try {
      final image = await _controller!.takePicture();
      HapticFeedback.lightImpact();
      
      // Navigate to preview/edit screen
      _navigateToPreview(image.path, isVideo: false);
    } catch (e) {
      print('Error taking picture: $e');
    }
  }
  
  void _navigateToPreview(String path, {required bool isVideo}) {
    // TODO: Navigate to preview/edit screen
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('${isVideo ? 'Video' : 'Photo'} saved: $path'),
        action: SnackBarAction(
          label: 'View',
          onPressed: () {
            // TODO: Open preview
          },
        ),
      ),
    );
  }
  
  void _showPermissionDeniedDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Permission Required'),
        content: const Text('Camera and microphone permissions are required to use this feature.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              openAppSettings();
            },
            child: const Text('Settings'),
          ),
        ],
      ),
    );
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // Camera Preview
          if (_controller != null && _controller!.value.isInitialized)
            Positioned.fill(
              child: AspectRatio(
                aspectRatio: _controller!.value.aspectRatio,
                child: CameraPreview(_controller!),
              ),
            )
          else
            const Center(
              child: CircularProgressIndicator(
                color: Colors.white,
              ),
            ),
          
          // Controls Overlay
          SafeArea(
            child: Column(
              children: [
                // Top Bar
                _buildTopBar(),
                
                const Spacer(),
                
                // Recording indicator
                if (_isRecording)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(
                      color: Colors.red,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.fiber_manual_record, color: Colors.white, size: 16),
                        const SizedBox(width: 8),
                        Text(
                          _formatDuration(_recordingDuration),
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                
                const SizedBox(height: 20),
                
                // Zoom slider
                if (_controller != null)
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 40),
                    child: Row(
                      children: [
                        const Icon(Icons.photo_size_select_small, color: Colors.white),
                        Expanded(
                          child: Slider(
                            value: _zoomLevel,
                            min: _minZoom,
                            max: _maxZoom,
                            activeColor: Colors.white,
                            inactiveColor: Colors.white30,
                            onChanged: (value) async {
                              setState(() => _zoomLevel = value);
                              await _controller!.setZoomLevel(value);
                            },
                          ),
                        ),
                        const Icon(Icons.photo_size_select_large, color: Colors.white),
                      ],
                    ),
                  ),
                
                const SizedBox(height: 20),
                
                // Camera modes
                _buildCameraModes(),
                
                const SizedBox(height: 20),
                
                // Bottom controls
                _buildBottomControls(),
                
                const SizedBox(height: 20),
              ],
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildTopBar() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          // Close button
          IconButton(
            onPressed: () => context.pop(),
            icon: const Icon(Icons.close, color: Colors.white, size: 28),
          ),
          
          // Center options
          Row(
            children: [
              // Flash
              IconButton(
                onPressed: _toggleFlash,
                icon: Icon(
                  _isFlashOn ? Icons.flash_on : Icons.flash_off,
                  color: Colors.white,
                ),
              ),
              // Timer
              IconButton(
                onPressed: () {
                  // TODO: Add timer functionality
                },
                icon: const Icon(Icons.timer_outlined, color: Colors.white),
              ),
              // Filters
              IconButton(
                onPressed: () {
                  // TODO: Add filters
                },
                icon: const Icon(Icons.face_retouching_natural, color: Colors.white),
              ),
            ],
          ),
          
          // Settings
          IconButton(
            onPressed: () {
              // TODO: Camera settings
            },
            icon: const Icon(Icons.settings, color: Colors.white),
          ),
        ],
      ),
    );
  }
  
  Widget _buildCameraModes() {
    return Container(
      height: 40,
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: ListView(
        scrollDirection: Axis.horizontal,
        children: CameraMode.values.map((mode) {
          final isSelected = mode == _currentMode;
          return GestureDetector(
            onTap: () => setState(() => _currentMode = mode),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
              margin: const EdgeInsets.symmetric(horizontal: 4),
              decoration: BoxDecoration(
                color: isSelected ? Colors.white : Colors.transparent,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                _getModeTitle(mode),
                style: TextStyle(
                  color: isSelected ? Colors.black : Colors.white,
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
  
  Widget _buildBottomControls() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 40),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          // Gallery
          Container(
            width: 50,
            height: 50,
            decoration: BoxDecoration(
              border: Border.all(color: Colors.white, width: 2),
              borderRadius: BorderRadius.circular(8),
            ),
            child: IconButton(
              onPressed: () {
                // TODO: Open gallery
              },
              icon: const Icon(Icons.photo_library, color: Colors.white),
            ),
          ),
          
          // Capture button
          GestureDetector(
            onTap: () {
              if (_currentMode == CameraMode.photo) {
                _takePicture();
              } else {
                if (_isRecording) {
                  _stopRecording();
                } else {
                  _startRecording();
                }
              }
            },
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
                margin: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: _isRecording ? Colors.red : Colors.white,
                ),
                child: _currentMode == CameraMode.photo
                    ? null
                    : Icon(
                        _isRecording ? Icons.stop : Icons.fiber_manual_record,
                        color: _isRecording ? Colors.white : Colors.red,
                        size: 40,
                      ),
              ),
            ),
          ),
          
          // Switch camera
          Container(
            width: 50,
            height: 50,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: Colors.white24,
            ),
            child: IconButton(
              onPressed: _toggleCamera,
              icon: const Icon(Icons.flip_camera_ios, color: Colors.white),
            ),
          ),
        ],
      ),
    );
  }
  
  String _getModeTitle(CameraMode mode) {
    switch (mode) {
      case CameraMode.photo:
        return 'PHOTO';
      case CameraMode.video:
        return 'VIDEO';
      case CameraMode.story:
        return 'STORY';
      case CameraMode.live:
        return 'LIVE';
    }
  }
  
  String _formatDuration(int seconds) {
    final minutes = seconds ~/ 60;
    final remainingSeconds = seconds % 60;
    return '${minutes.toString().padLeft(2, '0')}:${remainingSeconds.toString().padLeft(2, '0')}';
  }
}