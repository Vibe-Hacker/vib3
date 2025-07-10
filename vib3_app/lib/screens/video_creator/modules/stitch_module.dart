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

class StitchModule extends StatefulWidget {
  final String originalVideoPath;
  final Function(String) onVideoRecorded;
  
  const StitchModule({
    super.key,
    required this.originalVideoPath,
    required this.onVideoRecorded,
  });
  
  @override
  State<StitchModule> createState() => _StitchModuleState();
}

class _StitchModuleState extends State<StitchModule> {
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
  Timer? _recordingTimer;
  int _recordingSeconds = 0;
  
  // Stitch settings
  Duration _stitchStartTime = Duration.zero;
  Duration _stitchEndTime = const Duration(seconds: 5);
  Duration _maxStitchDuration = const Duration(seconds: 5);
  bool _isSelectingClip = true;
  
  // Camera settings
  FlashMode _flashMode = FlashMode.off;
  
  @override
  void initState() {
    super.initState();
    _initializeCamera();
    _initializeOriginalVideo();
  }
  
  @override
  void dispose() {
    _cameraController?.dispose();
    _originalVideoController?.dispose();
    _recordingTimer?.cancel();
    super.dispose();
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
      
      setState(() {
        _isVideoInitialized = true;
        _stitchEndTime = Duration(
          seconds: _originalVideoController!.value.duration.inSeconds.clamp(1, 5),
        );
      });
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
  
  void _confirmStitchSelection() {
    setState(() {
      _isSelectingClip = false;
    });
    
    // Prepare to record
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          'Selected ${_stitchEndTime.inSeconds}s clip. Now record your response!',
        ),
        backgroundColor: const Color(0xFF00CED1),
      ),
    );
  }
  
  Future<void> _startRecording() async {
    if (_cameraController == null || !_cameraController!.value.isInitialized) {
      return;
    }
    
    try {
      await _cameraController!.startVideoRecording();
      
      setState(() {
        _isRecording = true;
        _recordingSeconds = 0;
      });
      
      // Start recording timer
      _recordingTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
        setState(() {
          _recordingSeconds++;
        });
        
        // Auto-stop after 60 seconds
        if (_recordingSeconds >= 60) {
          _stopRecording();
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
      });
      
      _recordingTimer?.cancel();
      
      final XFile videoFile = await _cameraController!.stopVideoRecording();
      
      // Add delay for file to be ready
      await Future.delayed(const Duration(seconds: 2));
      
      HapticFeedback.heavyImpact();
      
      // Process and save stitch video
      if (mounted) {
        final creationState = context.read<CreationStateProvider>();
        
        // Set stitch metadata
        creationState.setStitchOriginalVideo(widget.originalVideoPath);
        
        // Add stitch clips
        creationState.addStitchClip(
          StitchClip(
            videoPath: widget.originalVideoPath,
            startTime: _stitchStartTime,
            endTime: _stitchEndTime,
            isOriginal: true,
          ),
        );
        
        creationState.addStitchClip(
          StitchClip(
            videoPath: videoFile.path,
            startTime: Duration.zero,
            endTime: Duration(seconds: _recordingSeconds),
            isOriginal: false,
          ),
        );
        
        // Navigate to edit
        widget.onVideoRecorded(videoFile.path);
      }
    } catch (e) {
      print('Error stopping recording: $e');
    }
  }
  
  Widget _buildClipSelector() {
    if (!_isVideoInitialized) return const SizedBox();
    
    final totalDuration = _originalVideoController!.value.duration;
    
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.8),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Select up to 5 seconds to stitch',
            style: TextStyle(
              color: Colors.white,
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          
          // Video preview with timeline
          Container(
            height: 100,
            decoration: BoxDecoration(
              border: Border.all(color: const Color(0xFF00CED1)),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Stack(
              children: [
                // Video preview
                ClipRRect(
                  borderRadius: BorderRadius.circular(7),
                  child: AspectRatio(
                    aspectRatio: _originalVideoController!.value.aspectRatio,
                    child: VideoPlayer(_originalVideoController!),
                  ),
                ),
                
                // Selection overlay
                Positioned.fill(
                  child: Row(
                    children: [
                      // Before selection
                      if (_stitchStartTime.inMilliseconds > 0)
                        Expanded(
                          flex: _stitchStartTime.inMilliseconds,
                          child: Container(
                            color: Colors.black.withOpacity(0.7),
                          ),
                        ),
                      
                      // Selected portion
                      Expanded(
                        flex: (_stitchEndTime - _stitchStartTime).inMilliseconds,
                        child: Container(
                          decoration: BoxDecoration(
                            border: Border.all(
                              color: const Color(0xFF00CED1),
                              width: 2,
                            ),
                          ),
                        ),
                      ),
                      
                      // After selection
                      if (_stitchEndTime < totalDuration)
                        Expanded(
                          flex: (totalDuration - _stitchEndTime).inMilliseconds,
                          child: Container(
                            color: Colors.black.withOpacity(0.7),
                          ),
                        ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          
          const SizedBox(height: 16),
          
          // Timeline slider
          Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Start: ${_stitchStartTime.inSeconds}s',
                    style: const TextStyle(color: Colors.white70, fontSize: 12),
                  ),
                  Text(
                    'Duration: ${(_stitchEndTime - _stitchStartTime).inSeconds}s',
                    style: const TextStyle(
                      color: Color(0xFF00CED1),
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Text(
                    'End: ${_stitchEndTime.inSeconds}s',
                    style: const TextStyle(color: Colors.white70, fontSize: 12),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              
              // Start time slider
              SliderTheme(
                data: SliderTheme.of(context).copyWith(
                  activeTrackColor: const Color(0xFF00CED1),
                  inactiveTrackColor: Colors.grey[800],
                  thumbColor: const Color(0xFF00CED1),
                ),
                child: Slider(
                  value: _stitchStartTime.inSeconds.toDouble(),
                  min: 0,
                  max: (totalDuration.inSeconds - 1).toDouble(),
                  onChanged: (value) {
                    setState(() {
                      _stitchStartTime = Duration(seconds: value.toInt());
                      // Ensure end time is at least 1 second after start
                      if (_stitchEndTime.inSeconds <= _stitchStartTime.inSeconds) {
                        _stitchEndTime = Duration(
                          seconds: (_stitchStartTime.inSeconds + 1).clamp(
                            0,
                            totalDuration.inSeconds,
                          ),
                        );
                      }
                      // Ensure max 5 seconds
                      if ((_stitchEndTime - _stitchStartTime).inSeconds > 5) {
                        _stitchEndTime = _stitchStartTime + const Duration(seconds: 5);
                      }
                    });
                    _originalVideoController!.seekTo(_stitchStartTime);
                  },
                ),
              ),
              
              // End time slider
              SliderTheme(
                data: SliderTheme.of(context).copyWith(
                  activeTrackColor: const Color(0xFFFF0080),
                  inactiveTrackColor: Colors.grey[800],
                  thumbColor: const Color(0xFFFF0080),
                ),
                child: Slider(
                  value: _stitchEndTime.inSeconds.toDouble(),
                  min: (_stitchStartTime.inSeconds + 1).toDouble(),
                  max: (_stitchStartTime.inSeconds + 5).clamp(
                    0,
                    totalDuration.inSeconds,
                  ).toDouble(),
                  onChanged: (value) {
                    setState(() {
                      _stitchEndTime = Duration(seconds: value.toInt());
                    });
                    _originalVideoController!.seekTo(_stitchEndTime);
                  },
                ),
              ),
            ],
          ),
          
          const SizedBox(height: 16),
          
          // Confirm button
          Center(
            child: ElevatedButton.icon(
              onPressed: _confirmStitchSelection,
              icon: const Icon(Icons.check),
              label: const Text('Use this clip'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF00CED1),
                foregroundColor: Colors.black,
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              ),
            ),
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
          // Camera preview or video selector
          Positioned.fill(
            child: _isSelectingClip
                ? Center(
                    child: SingleChildScrollView(
                      padding: const EdgeInsets.all(20),
                      child: _buildClipSelector(),
                    ),
                  )
                : (_isInitialized
                    ? CameraPreview(_cameraController!)
                    : const Center(
                        child: CircularProgressIndicator(
                          color: Color(0xFF00CED1),
                        ),
                      )),
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
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    IconButton(
                      onPressed: () => Navigator.pop(context),
                      icon: const Icon(Icons.close, color: Colors.white),
                    ),
                    Text(
                      _isSelectingClip ? 'Select Stitch Clip' : 'Stitch',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(width: 48),
                  ],
                ),
              ),
            ),
          ),
          
          // Recording timer
          if (_isRecording)
            Positioned(
              top: 100,
              left: 0,
              right: 0,
              child: RecordingTimer(
                seconds: _recordingSeconds,
                maxSeconds: 60,
                isPaused: false,
              ),
            ),
          
          // Bottom controls (only when recording)
          if (!_isSelectingClip)
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
                    // Show selected clip info
                    Container(
                      margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.7),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: const Color(0xFF00CED1).withOpacity(0.5)),
                      ),
                      child: Row(
                        children: [
                          const Icon(
                            Icons.cut,
                            color: Color(0xFF00CED1),
                            size: 20,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            'Stitching ${(_stitchEndTime - _stitchStartTime).inSeconds}s clip',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 14,
                            ),
                          ),
                        ],
                      ),
                    ),
                    
                    // Recording controls
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
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