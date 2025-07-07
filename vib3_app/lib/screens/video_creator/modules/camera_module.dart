import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:camera/camera.dart';
import 'package:provider/provider.dart';
import 'dart:async';
import 'dart:io';
import '../providers/creation_state_provider.dart';
import '../widgets/camera_controls.dart';
import '../widgets/recording_timer.dart';
import '../widgets/beauty_slider.dart';

class CameraModule extends StatefulWidget {
  final Function(String) onVideoRecorded;
  
  const CameraModule({
    super.key,
    required this.onVideoRecorded,
  });
  
  @override
  State<CameraModule> createState() => _CameraModuleState();
}

class _CameraModuleState extends State<CameraModule> 
    with WidgetsBindingObserver, TickerProviderStateMixin {
  // Camera
  CameraController? _cameraController;
  List<CameraDescription> _cameras = [];
  int _selectedCameraIndex = 0;
  
  // Recording state
  bool _isRecording = false;
  bool _isPaused = false;
  bool _isInitialized = false;
  final List<String> _recordedClips = [];
  Timer? _recordingTimer;
  int _recordingSeconds = 0;
  
  // Camera settings
  FlashMode _flashMode = FlashMode.off;
  double _zoomLevel = 1.0;
  double _minZoom = 1.0;
  double _maxZoom = 1.0;
  bool _showGrid = false;
  
  // Recording modes
  int _selectedDuration = 15; // 15s, 60s, 180s, 600s
  double _selectedSpeed = 1.0; // 0.3x, 0.5x, 1x, 2x, 3x
  bool _showBeautyControls = false;
  
  // Timer/Countdown
  int? _countdownSeconds;
  Timer? _countdownTimer;
  
  // Gesture detection
  DateTime? _lastGestureTime;
  
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _initializeCamera();
    
    // Setup gesture recognition for hands-free recording
    _setupGestureRecognition();
  }
  
  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _cameraController?.dispose();
    _recordingTimer?.cancel();
    _countdownTimer?.cancel();
    super.dispose();
  }
  
  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (_cameraController == null || !_cameraController!.value.isInitialized) {
      return;
    }
    
    if (state == AppLifecycleState.inactive) {
      _cameraController?.dispose();
    } else if (state == AppLifecycleState.resumed) {
      _initializeCamera();
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
      imageFormatGroup: ImageFormatGroup.yuv420,
    );
    
    try {
      await _cameraController!.initialize();
      
      // Get zoom levels
      _minZoom = await _cameraController!.getMinZoomLevel();
      _maxZoom = await _cameraController!.getMaxZoomLevel();
      
      if (mounted) {
        setState(() {
          _isInitialized = true;
        });
      }
    } catch (e) {
      print('Error setting up camera: $e');
    }
  }
  
  void _setupGestureRecognition() {
    // TODO: Implement hand gesture recognition for hands-free recording
    // This would use ML Kit or similar for gesture detection
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
    
    FlashMode newMode;
    switch (_flashMode) {
      case FlashMode.off:
        newMode = FlashMode.auto;
        break;
      case FlashMode.auto:
        newMode = FlashMode.always;
        break;
      case FlashMode.always:
        newMode = FlashMode.torch;
        break;
      case FlashMode.torch:
        newMode = FlashMode.off;
        break;
    }
    
    await _cameraController!.setFlashMode(newMode);
    setState(() {
      _flashMode = newMode;
    });
  }
  
  void _setZoom(double zoom) {
    if (_cameraController == null) return;
    
    final newZoom = zoom.clamp(_minZoom, _maxZoom);
    _cameraController!.setZoomLevel(newZoom);
    setState(() {
      _zoomLevel = newZoom;
    });
  }
  
  void _startCountdown(int seconds) {
    setState(() {
      _countdownSeconds = seconds;
    });
    
    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      setState(() {
        _countdownSeconds = _countdownSeconds! - 1;
      });
      
      if (_countdownSeconds == 0) {
        timer.cancel();
        _startRecording();
      }
    });
  }
  
  Future<void> _startRecording() async {
    if (_cameraController == null || !_cameraController!.value.isInitialized) {
      return;
    }
    
    try {
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
        
        // Auto-stop at selected duration
        if (_recordingSeconds >= _selectedDuration) {
          _stopRecording();
        }
      });
      
      // Haptic feedback
      HapticFeedback.mediumImpact();
    } catch (e) {
      print('Error starting recording: $e');
    }
  }
  
  Future<void> _pauseRecording() async {
    if (!_isRecording || _isPaused) return;
    
    try {
      await _cameraController!.pauseVideoRecording();
      _recordingTimer?.cancel();
      
      setState(() {
        _isPaused = true;
      });
      
      HapticFeedback.lightImpact();
    } catch (e) {
      print('Error pausing recording: $e');
    }
  }
  
  Future<void> _resumeRecording() async {
    if (!_isRecording || !_isPaused) return;
    
    try {
      await _cameraController!.resumeVideoRecording();
      
      setState(() {
        _isPaused = false;
      });
      
      // Resume timer
      _recordingTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
        setState(() {
          _recordingSeconds++;
        });
        
        if (_recordingSeconds >= _selectedDuration) {
          _stopRecording();
        }
      });
      
      HapticFeedback.lightImpact();
    } catch (e) {
      print('Error resuming recording: $e');
    }
  }
  
  Future<void> _stopRecording() async {
    if (!_isRecording) return;
    
    try {
      final XFile videoFile = await _cameraController!.stopVideoRecording();
      _recordingTimer?.cancel();
      
      setState(() {
        _isRecording = false;
        _isPaused = false;
        _recordedClips.add(videoFile.path);
      });
      
      HapticFeedback.heavyImpact();
      
      // Add to creation state
      final creationState = context.read<CreationStateProvider>();
      creationState.addVideoClip(videoFile.path);
      
      // Apply speed if needed
      if (_selectedSpeed != 1.0) {
        // TODO: Process video with speed change
      }
      
      // Navigate to edit or continue recording
      if (_recordedClips.length == 1 && !_isMultiClipMode()) {
        widget.onVideoRecorded(videoFile.path);
      } else {
        // Show option to add more clips or finish
        _showClipOptions();
      }
    } catch (e) {
      print('Error stopping recording: $e');
    }
  }
  
  bool _isMultiClipMode() {
    final creationState = context.read<CreationStateProvider>();
    return creationState.recordingMode == RecordingMode.normal && _recordedClips.isNotEmpty;
  }
  
  void _showClipOptions() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        padding: const EdgeInsets.all(20),
        decoration: const BoxDecoration(
          color: Color(0xFF1A1A1A),
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              '${_recordedClips.length} clips recorded',
              style: const TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 20),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _buildOptionButton(
                  icon: Icons.add,
                  label: 'Add More',
                  onTap: () {
                    Navigator.pop(context);
                    // Continue recording
                  },
                ),
                _buildOptionButton(
                  icon: Icons.delete,
                  label: 'Delete Last',
                  onTap: () {
                    setState(() {
                      _recordedClips.removeLast();
                    });
                    Navigator.pop(context);
                  },
                ),
                _buildOptionButton(
                  icon: Icons.check,
                  label: 'Finish',
                  onTap: () {
                    Navigator.pop(context);
                    // Combine clips and proceed
                    _combineClipsAndProceed();
                  },
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildOptionButton({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(
              color: const Color(0xFF00CED1).withOpacity(0.2),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: const Color(0xFF00CED1), size: 30),
          ),
          const SizedBox(height: 8),
          Text(
            label,
            style: const TextStyle(color: Colors.white70, fontSize: 12),
          ),
        ],
      ),
    );
  }
  
  void _combineClipsAndProceed() {
    // TODO: Combine multiple clips into one video
    // For now, just use the first clip
    if (_recordedClips.isNotEmpty) {
      widget.onVideoRecorded(_recordedClips.first);
    }
  }
  
  
  void _handleGesture() {
    final now = DateTime.now();
    if (_lastGestureTime != null && 
        now.difference(_lastGestureTime!).inSeconds < 2) {
      // Double gesture detected - toggle recording
      if (_isRecording) {
        _stopRecording();
      } else {
        _startRecording();
      }
    }
    _lastGestureTime = now;
  }
  
  @override
  Widget build(BuildContext context) {
    if (!_isInitialized || _cameraController == null) {
      return const Center(
        child: CircularProgressIndicator(
          color: Color(0xFF00CED1),
        ),
      );
    }
    
    final size = MediaQuery.of(context).size;
    final creationState = context.watch<CreationStateProvider>();
    
    return Stack(
      children: [
        // Camera preview
        Positioned.fill(
          child: GestureDetector(
            onScaleUpdate: (details) {
              _setZoom(_zoomLevel * details.scale);
            },
            onDoubleTap: _handleGesture, // Hands-free gesture simulation
            child: CameraPreview(_cameraController!),
          ),
        ),
        
        // Grid overlay
        if (_showGrid)
          Positioned.fill(
            child: IgnorePointer(
              child: CustomPaint(
                painter: GridPainter(),
              ),
            ),
          ),
        
        // Beauty filter overlay
        if (creationState.beautyMode)
          Positioned.fill(
            child: Container(
              color: Colors.pink.withOpacity(0.05),
            ),
          ),
        
        // Recording timer
        if (_isRecording)
          Positioned(
            top: 50,
            left: 0,
            right: 0,
            child: RecordingTimer(
              seconds: _recordingSeconds,
              maxSeconds: _selectedDuration,
              isPaused: _isPaused,
            ),
          ),
        
        // Countdown
        if (_countdownSeconds != null)
          Center(
            child: Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                color: Colors.black54,
                shape: BoxShape.circle,
              ),
              child: Center(
                child: Text(
                  '$_countdownSeconds',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 60,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
          ),
        
        // Beauty controls
        if (_showBeautyControls)
          Positioned(
            right: 20,
            top: size.height * 0.3,
            child: BeautySlider(
              value: creationState.beautyIntensity,
              onChanged: (value) {
                creationState.setBeautyIntensity(value);
              },
            ),
          ),
        
        // Hands-free indicator
        if (_selectedCameraIndex == 1) // Front camera
          Positioned(
            top: 120,
            left: 0,
            right: 0,
            child: Center(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: Colors.black54,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: const [
                    Icon(Icons.waving_hand, color: Color(0xFF00CED1), size: 20),
                    SizedBox(width: 8),
                    Text(
                      'Double tap to start/stop',
                      style: TextStyle(color: Colors.white, fontSize: 12),
                    ),
                  ],
                ),
              ),
            ),
          ),
        
        // Camera controls
        Positioned(
          bottom: 0,
          left: 0,
          right: 0,
          child: CameraControls(
            isRecording: _isRecording,
            isPaused: _isPaused,
            flashMode: _flashMode,
            selectedDuration: _selectedDuration,
            selectedSpeed: _selectedSpeed,
            showGrid: _showGrid,
            beautyMode: creationState.beautyMode,
            onRecord: _isRecording
                ? (_isPaused ? _resumeRecording : _pauseRecording)
                : _startRecording,
            onStop: _stopRecording,
            onFlip: _toggleCamera,
            onFlash: _toggleFlash,
            onDurationChanged: (duration) {
              setState(() {
                _selectedDuration = duration;
              });
            },
            onSpeedChanged: (speed) {
              setState(() {
                _selectedSpeed = speed;
              });
            },
            onTimerSelected: (seconds) {
              _startCountdown(seconds);
            },
            onGridToggle: () {
              setState(() {
                _showGrid = !_showGrid;
              });
            },
            onBeautyToggle: () {
              creationState.setBeautyMode(!creationState.beautyMode);
              setState(() {
                _showBeautyControls = creationState.beautyMode;
              });
            },
            onGallery: () {
              // TODO: Open gallery picker
            },
          ),
        ),
      ],
    );
  }
}

// Grid painter for composition
class GridPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.white.withOpacity(0.3)
      ..strokeWidth = 1;
    
    // Draw vertical lines
    final thirdWidth = size.width / 3;
    canvas.drawLine(
      Offset(thirdWidth, 0),
      Offset(thirdWidth, size.height),
      paint,
    );
    canvas.drawLine(
      Offset(thirdWidth * 2, 0),
      Offset(thirdWidth * 2, size.height),
      paint,
    );
    
    // Draw horizontal lines
    final thirdHeight = size.height / 3;
    canvas.drawLine(
      Offset(0, thirdHeight),
      Offset(size.width, thirdHeight),
      paint,
    );
    canvas.drawLine(
      Offset(0, thirdHeight * 2),
      Offset(size.width, thirdHeight * 2),
      paint,
    );
  }
  
  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}