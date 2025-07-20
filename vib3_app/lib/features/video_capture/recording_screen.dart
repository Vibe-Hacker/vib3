import 'package:flutter/material.dart';
import 'package:camera/camera.dart';
import 'dart:async';
import 'camera_controller.dart';
import 'camera_permissions.dart';
import '../../core/video_pipeline/pipeline_manager.dart';
import '../../core/video_pipeline/pipeline_state.dart';
import 'package:provider/provider.dart';

class RecordingScreen extends StatefulWidget {
  const RecordingScreen({super.key});

  @override
  State<RecordingScreen> createState() => _RecordingScreenState();
}

class _RecordingScreenState extends State<RecordingScreen> 
    with TickerProviderStateMixin {
  final VIB3CameraController _cameraController = VIB3CameraController();
  late AnimationController _pulseController;
  Timer? _recordingTimer;
  int _recordingSeconds = 0;
  bool _isLoading = true;
  String? _errorMessage;
  
  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      duration: const Duration(milliseconds: 1000),
      vsync: this,
    )..repeat(reverse: true);
    _initializeCamera();
  }
  
  Future<void> _initializeCamera() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    
    // Check permissions
    final hasPermissions = await CameraPermissions.checkPermissions();
    if (!hasPermissions) {
      final granted = await CameraPermissions.requestAllPermissions();
      if (!granted) {
        if (mounted) {
          await CameraPermissions.showPermissionDialog(context);
          Navigator.pop(context);
        }
        return;
      }
    }
    
    // Initialize camera
    try {
      await _cameraController.initialize();
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _errorMessage = 'Failed to initialize camera';
        });
      }
    }
  }
  
  void _startRecording() async {
    final path = await _cameraController.startRecording();
    if (path != null) {
      setState(() {
        _recordingSeconds = 0;
      });
      
      _recordingTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
        setState(() {
          _recordingSeconds++;
        });
        
        // Max recording time: 60 seconds
        if (_recordingSeconds >= 60) {
          _stopRecording();
        }
      });
    }
  }
  
  void _stopRecording() async {
    _recordingTimer?.cancel();
    
    final file = await _cameraController.stopRecording();
    if (file != null && mounted) {
      // Update pipeline state
      final pipelineState = Provider.of<PipelineState>(context, listen: false);
      pipelineState.setVideoPath(file.path);
      pipelineState.setVideoDuration(Duration(seconds: _recordingSeconds));
      
      // Navigate to next screen
      Navigator.pushReplacementNamed(
        context,
        '/video-editor',
        arguments: {'videoPath': file.path},
      );
    }
  }
  
  @override
  void dispose() {
    _recordingTimer?.cancel();
    _pulseController.dispose();
    _cameraController.dispose();
    super.dispose();
  }
  
  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        backgroundColor: Colors.black,
        body: Center(
          child: CircularProgressIndicator(
            color: Color(0xFF00CED1),
          ),
        ),
      );
    }
    
    if (_errorMessage != null) {
      return Scaffold(
        backgroundColor: Colors.black,
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.error_outline, color: Colors.red, size: 48),
              SizedBox(height: 16),
              Text(
                _errorMessage!,
                style: TextStyle(color: Colors.white),
              ),
              SizedBox(height: 16),
              ElevatedButton(
                onPressed: _initializeCamera,
                child: Text('Retry'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Color(0xFF00CED1),
                ),
              ),
            ],
          ),
        ),
      );
    }
    
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // Camera Preview
          if (_cameraController.controller != null)
            CameraPreview(_cameraController.controller!),
          
          // Top Controls
          SafeArea(
            child: Padding(
              padding: EdgeInsets.all(16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  // Close button
                  IconButton(
                    icon: Icon(Icons.close, color: Colors.white, size: 28),
                    onPressed: () => Navigator.pop(context),
                  ),
                  
                  // Recording time
                  if (_cameraController.isRecording)
                    Container(
                      padding: EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.red,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Row(
                        children: [
                          Icon(Icons.circle, color: Colors.white, size: 8),
                          SizedBox(width: 4),
                          Text(
                            '${_recordingSeconds ~/ 60}:${(_recordingSeconds % 60).toString().padLeft(2, '0')}',
                            style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                    ),
                  
                  // Flash & Flip
                  Row(
                    children: [
                      IconButton(
                        icon: Icon(
                          _cameraController.flashMode == FlashMode.off 
                              ? Icons.flash_off 
                              : Icons.flash_on,
                          color: Colors.white,
                        ),
                        onPressed: () async {
                          await _cameraController.toggleFlash();
                          setState(() {});
                        },
                      ),
                      if (_cameraController.hasFrontAndBack)
                        IconButton(
                          icon: Icon(Icons.flip_camera_ios, color: Colors.white),
                          onPressed: () async {
                            await _cameraController.switchCamera();
                            setState(() {});
                          },
                        ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          
          // Bottom Controls
          Positioned(
            bottom: 40,
            left: 0,
            right: 0,
            child: Column(
              children: [
                // Zoom slider
                Padding(
                  padding: EdgeInsets.symmetric(horizontal: 40),
                  child: SliderTheme(
                    data: SliderTheme.of(context).copyWith(
                      activeTrackColor: Color(0xFF00CED1),
                      inactiveTrackColor: Colors.white24,
                      thumbColor: Color(0xFF00CED1),
                      overlayColor: Color(0xFF00CED1).withOpacity(0.3),
                    ),
                    child: Slider(
                      value: _cameraController.currentZoom,
                      min: 1.0,
                      max: 5.0,
                      onChanged: (value) async {
                        await _cameraController.setZoom(value);
                        setState(() {});
                      },
                    ),
                  ),
                ),
                SizedBox(height: 20),
                
                // Record button
                Center(
                  child: GestureDetector(
                    onTap: () {
                      if (_cameraController.isRecording) {
                        _stopRecording();
                      } else {
                        _startRecording();
                      }
                    },
                    child: AnimatedBuilder(
                      animation: _pulseController,
                      builder: (context, child) {
                        return Container(
                          width: 80,
                          height: 80,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: _cameraController.isRecording 
                                  ? Colors.red 
                                  : Color(0xFF00CED1),
                              width: 4,
                            ),
                            boxShadow: _cameraController.isRecording ? [
                              BoxShadow(
                                color: Colors.red.withOpacity(0.5 * _pulseController.value),
                                blurRadius: 20,
                                spreadRadius: 10,
                              ),
                            ] : [],
                          ),
                          child: Center(
                            child: Container(
                              width: _cameraController.isRecording ? 30 : 60,
                              height: _cameraController.isRecording ? 30 : 60,
                              decoration: BoxDecoration(
                                color: _cameraController.isRecording 
                                    ? Colors.red 
                                    : Color(0xFF00CED1),
                                shape: _cameraController.isRecording 
                                    ? BoxShape.rectangle 
                                    : BoxShape.circle,
                                borderRadius: _cameraController.isRecording 
                                    ? BorderRadius.circular(8) 
                                    : null,
                              ),
                            ),
                          ),
                        );
                      },
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
}