import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:camera/camera.dart';
import 'package:provider/provider.dart';
import 'package:video_player/video_player.dart';
import 'dart:async';
import 'dart:io';
import '../providers/creation_state_provider.dart';
import '../widgets/camera_controls.dart';
import '../widgets/recording_timer.dart';

class DuetModule extends StatefulWidget {
  final String originalVideoPath;
  final Function(String) onVideoRecorded;
  
  const DuetModule({
    super.key,
    required this.originalVideoPath,
    required this.onVideoRecorded,
  });
  
  @override
  State<DuetModule> createState() => _DuetModuleState();
}

class _DuetModuleState extends State<DuetModule> with WidgetsBindingObserver {
  // Camera
  CameraController? _cameraController;
  List<CameraDescription> _cameras = [];
  int _selectedCameraIndex = 0;
  bool _isInitialized = false;
  
  // Video player for original video
  VideoPlayerController? _originalVideoController;
  bool _isVideoInitialized = false;
  
  // Recording state
  bool _isRecording = false;
  bool _isPaused = false;
  Timer? _recordingTimer;
  int _recordingSeconds = 0;
  
  // Layout mode
  DuetLayout _layoutMode = DuetLayout.sideBySide;
  bool _isLeftSide = true; // Which side user's camera is on
  
  // Camera settings
  FlashMode _flashMode = FlashMode.off;
  
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _initializeCamera();
    _initializeOriginalVideo();
  }
  
  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _cameraController?.dispose();
    _originalVideoController?.dispose();
    _recordingTimer?.cancel();
    super.dispose();
  }
  
  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (!mounted) return;
    
    if (state == AppLifecycleState.inactive) {
      _cameraController?.dispose();
      _originalVideoController?.pause();
    } else if (state == AppLifecycleState.resumed) {
      _initializeCamera();
      if (_isVideoInitialized) {
        _originalVideoController?.play();
      }
    }
  }
  
  Future<void> _initializeCamera() async {
    try {
      _cameras = await availableCameras();
      if (_cameras.isEmpty) return;
      
      await _setupCameraController(_selectedCameraIndex);
    } catch (e) {
      print('Error initializing camera: $e');
    }
  }
  
  Future<void> _setupCameraController(int cameraIndex) async {
    if (_cameras.isEmpty) return;
    
    final camera = _cameras[cameraIndex];
    _cameraController = CameraController(
      camera,
      ResolutionPreset.high,
      enableAudio: true,
    );
    
    try {
      await _cameraController!.initialize();
      
      if (mounted) {
        setState(() {
          _isInitialized = true;
        });
      }
    } catch (e) {
      print('Error setting up camera: $e');
    }
  }
  
  Future<void> _initializeOriginalVideo() async {
    try {
      _originalVideoController = VideoPlayerController.file(
        File(widget.originalVideoPath),
      );
      
      await _originalVideoController!.initialize();
      await _originalVideoController!.setLooping(true);
      
      setState(() {
        _isVideoInitialized = true;
      });
      
      // Start playing when initialized
      await _originalVideoController!.play();
    } catch (e) {
      print('Error initializing original video: $e');
    }
  }
  
  Future<void> _toggleCamera() async {
    if (_cameras.length < 2) return;
    
    setState(() {
      _selectedCameraIndex = (_selectedCameraIndex + 1) % _cameras.length;
    });
    
    await _setupCameraController(_selectedCameraIndex);
  }
  
  Future<void> _toggleFlash() async {
    if (_cameraController == null) return;
    
    FlashMode newMode = _flashMode == FlashMode.off 
        ? FlashMode.torch 
        : FlashMode.off;
    
    await _cameraController!.setFlashMode(newMode);
    setState(() {
      _flashMode = newMode;
    });
  }
  
  Future<void> _startRecording() async {
    if (_cameraController == null || !_cameraController!.value.isInitialized) {
      return;
    }
    
    try {
      // Reset and start the original video from beginning
      await _originalVideoController!.seekTo(Duration.zero);
      await _originalVideoController!.play();
      
      // Start recording
      await _cameraController!.startVideoRecording();
      
      setState(() {
        _isRecording = true;
        _isPaused = false;
        _recordingSeconds = 0;
      });
      
      // Start recording timer
      _recordingTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
        setState(() {
          _recordingSeconds++;
        });
        
        // Stop at original video duration
        if (_originalVideoController != null) {
          final duration = _originalVideoController!.value.duration;
          if (_recordingSeconds >= duration.inSeconds) {
            _stopRecording();
          }
        }
      });
      
      HapticFeedback.mediumImpact();
    } catch (e) {
      print('Error starting recording: $e');
    }
  }
  
  Future<void> _stopRecording() async {
    if (!_isRecording) return;
    
    try {
      setState(() {
        _isRecording = false;
        _isPaused = false;
      });
      
      _recordingTimer?.cancel();
      _originalVideoController?.pause();
      
      final XFile videoFile = await _cameraController!.stopVideoRecording();
      
      // Add delay for file to be ready
      await Future.delayed(const Duration(seconds: 2));
      
      HapticFeedback.heavyImpact();
      
      // Process and save duet video
      if (mounted) {
        final creationState = context.read<CreationStateProvider>();
        
        // Set duet metadata
        creationState.setDuetInfo(
          originalVideoPath: widget.originalVideoPath,
          layout: _layoutMode,
          userOnLeft: _isLeftSide,
        );
        
        // Add the recorded video
        creationState.addVideoClip(videoFile.path);
        
        // Navigate to edit
        widget.onVideoRecorded(videoFile.path);
      }
    } catch (e) {
      print('Error stopping recording: $e');
    }
  }
  
  Widget _buildLayoutSelector() {
    return Container(
      height: 50,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          _buildLayoutOption(
            icon: Icons.view_column,
            label: 'Side by Side',
            isSelected: _layoutMode == DuetLayout.sideBySide,
            onTap: () => setState(() => _layoutMode = DuetLayout.sideBySide),
          ),
          const SizedBox(width: 16),
          _buildLayoutOption(
            icon: Icons.picture_in_picture,
            label: 'Picture in Picture',
            isSelected: _layoutMode == DuetLayout.pictureInPicture,
            onTap: () => setState(() => _layoutMode = DuetLayout.pictureInPicture),
          ),
          const SizedBox(width: 16),
          _buildLayoutOption(
            icon: Icons.view_stream,
            label: 'Top/Bottom',
            isSelected: _layoutMode == DuetLayout.topBottom,
            onTap: () => setState(() => _layoutMode = DuetLayout.topBottom),
          ),
        ],
      ),
    );
  }
  
  Widget _buildLayoutOption({
    required IconData icon,
    required String label,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF00CED1).withOpacity(0.2) : Colors.transparent,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? const Color(0xFF00CED1) : Colors.white30,
          ),
        ),
        child: Row(
          children: [
            Icon(
              icon,
              color: isSelected ? const Color(0xFF00CED1) : Colors.white70,
              size: 20,
            ),
            const SizedBox(width: 4),
            Text(
              label,
              style: TextStyle(
                color: isSelected ? const Color(0xFF00CED1) : Colors.white70,
                fontSize: 12,
              ),
            ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildDuetView() {
    if (!_isInitialized || !_isVideoInitialized) {
      return const Center(
        child: CircularProgressIndicator(
          color: Color(0xFF00CED1),
        ),
      );
    }
    
    Widget cameraView = CameraPreview(_cameraController!);
    Widget videoView = AspectRatio(
      aspectRatio: _originalVideoController!.value.aspectRatio,
      child: VideoPlayer(_originalVideoController!),
    );
    
    switch (_layoutMode) {
      case DuetLayout.sideBySide:
        return Row(
          children: [
            Expanded(
              child: _isLeftSide ? cameraView : videoView,
            ),
            Container(width: 2, color: Colors.black),
            Expanded(
              child: _isLeftSide ? videoView : cameraView,
            ),
          ],
        );
        
      case DuetLayout.topBottom:
        return Column(
          children: [
            Expanded(
              child: _isLeftSide ? cameraView : videoView,
            ),
            Container(height: 2, color: Colors.black),
            Expanded(
              child: _isLeftSide ? videoView : cameraView,
            ),
          ],
        );
        
      case DuetLayout.pictureInPicture:
        return Stack(
          children: [
            // Main video (full screen)
            Positioned.fill(child: videoView),
            // Camera preview (small overlay)
            Positioned(
              top: 50,
              right: 20,
              width: 120,
              height: 180,
              child: Container(
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.white, width: 2),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(6),
                  child: cameraView,
                ),
              ),
            ),
          ],
        );
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // Duet view
          Positioned.fill(
            child: _buildDuetView(),
          ),
          
          // Top controls
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: Container(
              padding: EdgeInsets.only(top: MediaQuery.of(context).padding.top),
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
              child: Column(
                children: [
                  // Header
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        IconButton(
                          onPressed: () => Navigator.pop(context),
                          icon: const Icon(Icons.close, color: Colors.white),
                        ),
                        const Text(
                          'Duet',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        IconButton(
                          onPressed: () {
                            setState(() {
                              _isLeftSide = !_isLeftSide;
                            });
                          },
                          icon: const Icon(Icons.swap_horiz, color: Colors.white),
                        ),
                      ],
                    ),
                  ),
                  // Layout selector
                  _buildLayoutSelector(),
                ],
              ),
            ),
          ),
          
          // Recording timer
          if (_isRecording)
            Positioned(
              top: 150,
              left: 0,
              right: 0,
              child: RecordingTimer(
                seconds: _recordingSeconds,
                maxSeconds: _originalVideoController?.value.duration.inSeconds ?? 60,
                isPaused: _isPaused,
              ),
            ),
          
          // Bottom controls
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: Container(
              padding: const EdgeInsets.only(bottom: 20),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.bottomCenter,
                  end: Alignment.topCenter,
                  colors: [
                    Colors.black.withOpacity(0.7),
                    Colors.transparent,
                  ],
                ),
              ),
              child: Column(
                children: [
                  // Side controls
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        // Flip camera
                        IconButton(
                          onPressed: _isRecording ? null : _toggleCamera,
                          icon: const Icon(Icons.flip_camera_ios, size: 30),
                          color: Colors.white,
                        ),
                        
                        // Record button
                        GestureDetector(
                          onTap: _isRecording ? _stopRecording : _startRecording,
                          child: Container(
                            width: 80,
                            height: 80,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: _isRecording ? Colors.red : Colors.white,
                                width: 4,
                              ),
                            ),
                            child: Center(
                              child: Container(
                                width: 60,
                                height: 60,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: _isRecording ? Colors.red : const Color(0xFF00CED1),
                                ),
                              ),
                            ),
                          ),
                        ),
                        
                        // Flash
                        IconButton(
                          onPressed: _toggleFlash,
                          icon: Icon(
                            _flashMode == FlashMode.torch 
                                ? Icons.flash_on 
                                : Icons.flash_off,
                            size: 30,
                          ),
                          color: Colors.white,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

enum DuetLayout {
  sideBySide,
  topBottom,
  pictureInPicture,
}