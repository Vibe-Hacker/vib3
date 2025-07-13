import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:camera/camera.dart';
import 'package:provider/provider.dart';
import 'dart:async';
import 'dart:io';
import 'dart:ui' as ui;
import '../providers/creation_state_provider.dart';
import '../widgets/camera_controls.dart';
import '../widgets/recording_timer.dart';
import '../widgets/beauty_slider.dart';
import 'beauty_filters_module.dart';
import '../../../services/ar_effects_processor.dart';
import '../../../services/voice_effects_processor.dart';

// Custom painter for rendering AR effects on camera frames
class ARFramePainter extends CustomPainter {
  final ui.Image image;
  
  ARFramePainter(this.image);
  
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..filterQuality = FilterQuality.high
      ..isAntiAlias = true;
    
    // Calculate the scale to fit the image to the canvas
    final imageAspectRatio = image.width / image.height;
    final canvasAspectRatio = size.width / size.height;
    
    double scale;
    double offsetX = 0;
    double offsetY = 0;
    
    if (imageAspectRatio > canvasAspectRatio) {
      // Image is wider, scale by height
      scale = size.height / image.height;
      offsetX = (size.width - (image.width * scale)) / 2;
    } else {
      // Image is taller, scale by width
      scale = size.width / image.width;
      offsetY = (size.height - (image.height * scale)) / 2;
    }
    
    // Draw the processed AR frame
    canvas.drawImageRect(
      image,
      Rect.fromLTWH(0, 0, image.width.toDouble(), image.height.toDouble()),
      Rect.fromLTWH(offsetX, offsetY, image.width * scale, image.height * scale),
      paint,
    );
  }
  
  @override
  bool shouldRepaint(ARFramePainter oldDelegate) {
    return oldDelegate.image != image;
  }
}

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
  // Focus management
  bool _isHandlingLifecycle = false;
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
  
  // AR Effects and Real-time Processing
  AREffectsProcessor? _arProcessor;
  VoiceEffectsProcessor? _voiceProcessor;
  ui.Image? _processedFrame;
  bool _arEffectsEnabled = false;
  
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _initializeCamera();
    _initializeProcessors();
    
    // Setup gesture recognition for hands-free recording
    _setupGestureRecognition();
  }
  
  Future<void> _initializeProcessors() async {
    try {
      _arProcessor = AREffectsProcessor();
      await _arProcessor!.initialize();
      
      _voiceProcessor = VoiceEffectsProcessor();
      await _voiceProcessor!.initialize();
      
      print('✅ AR and Voice processors initialized');
    } catch (e) {
      print('❌ Error initializing processors: $e');
    }
  }
  
  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _cameraController?.dispose();
    _recordingTimer?.cancel();
    _countdownTimer?.cancel();
    _arProcessor?.dispose();
    _voiceProcessor?.dispose();
    super.dispose();
  }
  
  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    // Prevent excessive focus handling by debouncing lifecycle events
    if (!mounted || _isHandlingLifecycle) return;
    
    _isHandlingLifecycle = true;
    
    // Handle app lifecycle changes to properly manage camera resources
    switch (state) {
      case AppLifecycleState.inactive:
        // App is inactive, only stop recording if active
        if (_isRecording) {
          _handleCameraInactive();
        }
        break;
      case AppLifecycleState.paused:
        // App is in background
        _handleCameraPaused();
        break;
      case AppLifecycleState.resumed:
        // App is back in foreground
        _handleCameraResumed();
        break;
      case AppLifecycleState.detached:
        // App is being terminated
        _handleCameraDetached();
        break;
      case AppLifecycleState.hidden:
        // App is hidden (same as paused for our purposes)
        _handleCameraPaused();
        break;
    }
    
    // Reset flag after a delay
    Future.delayed(const Duration(milliseconds: 300), () {
      _isHandlingLifecycle = false;
    });
  }
  
  void _handleCameraInactive() {
    // Stop any ongoing recording
    if (_isRecording) {
      _stopRecording();
    }
  }
  
  void _handleCameraPaused() {
    // Dispose camera when app goes to background
    if (_cameraController != null) {
      _cameraController!.dispose();
      _cameraController = null;
      if (mounted) {
        setState(() {
          _isInitialized = false;
        });
      }
    }
  }
  
  void _handleCameraResumed() {
    // Re-initialize camera when app comes back
    // Add a delay to prevent rapid re-initialization
    if (!_isInitialized && mounted) {
      Future.delayed(const Duration(milliseconds: 500), () {
        if (mounted && !_isInitialized) {
          _initializeCamera();
        }
      });
    }
  }
  
  void _handleCameraDetached() {
    // Clean up everything
    _recordingTimer?.cancel();
    _countdownTimer?.cancel();
    _cameraController?.dispose();
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
    
    // Dispose existing controller if any
    if (_cameraController != null) {
      await _cameraController!.dispose();
      _cameraController = null;
    }
    
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
      
      // Set initial zoom
      await _cameraController!.setZoomLevel(_minZoom);
      
      if (mounted) {
        setState(() {
          _isInitialized = true;
        });
      }
    } catch (e) {
      print('Error setting up camera: $e');
      _cameraController = null;
      if (mounted) {
        setState(() {
          _isInitialized = false;
        });
      }
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
      // First update UI state to prevent multiple stop attempts
      setState(() {
        _isRecording = false;
        _isPaused = false;
      });
      
      _recordingTimer?.cancel();
      
      // Stop recording and get the file
      final XFile videoFile = await _cameraController!.stopVideoRecording();
      
      // Clear focus to prevent window focus loop
      if (mounted) {
        FocusManager.instance.primaryFocus?.unfocus();
      }
      
      // Add delay to ensure video encoder has fully released the file
      await Future.delayed(const Duration(milliseconds: 2000)); // Further increased delay for MediaCodec
      
      // Validate file with retries
      final file = File(videoFile.path);
      int retryCount = 0;
      const maxRetries = 5; // Increased retries
      
      while (retryCount < maxRetries) {
        if (await file.exists()) {
          final fileSize = await file.length();
          if (fileSize > 0) {
            print('\n=== VIDEO RECORDING SUCCESS ===');
            print('Video saved: ${videoFile.path}');
            print('File size: ${fileSize} bytes');
            print('==============================\n');
            break;
          }
        }
        
        retryCount++;
        if (retryCount < maxRetries) {
          print('Waiting for video file to be ready, attempt $retryCount...');
          await Future.delayed(const Duration(milliseconds: 1500)); // Increased retry delay
        } else {
          throw Exception('Video file not ready after $maxRetries attempts');
        }
      }
      
      setState(() {
        _recordedClips.add(videoFile.path);
      });
      
      HapticFeedback.heavyImpact();
      
      // Add to creation state with proper timing
      if (mounted) {
        final creationState = context.read<CreationStateProvider>();
        
        // Add clip to provider
        creationState.addVideoClip(videoFile.path);
        
        // Wait longer to ensure all video resources are released
        await Future.delayed(const Duration(seconds: 2)); // Increased to 2 seconds
        
        // Navigate to edit or continue recording
        if (_recordedClips.length == 1 && !_isMultiClipMode()) {
          if (mounted) {
            print('Navigating to video preview...');
            widget.onVideoRecorded(videoFile.path);
          }
        } else {
          // Show option to add more clips or finish
          _showClipOptions();
        }
      }
    } catch (e) {
      print('\nERROR stopping recording: $e');
      print('Stack trace: ${StackTrace.current}');
      
      // Reset recording state on error
      setState(() {
        _isRecording = false;
        _isPaused = false;
      });
      
      // Show error to user
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Recording error: ${e.toString().replaceAll('Exception: ', '')}'),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 3),
          ),
        );
      }
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
  
  // Real-time AR effects preview
  Widget _buildARPreview() {
    return Stack(
      children: [
        CameraPreview(_cameraController!),
        if (_processedFrame != null)
          Positioned.fill(
            child: CustomPaint(
              painter: ARFramePainter(_processedFrame!),
            ),
          ),
      ],
    );
  }
  
  // Toggle AR effects on/off
  void _toggleAREffects() {
    setState(() {
      _arEffectsEnabled = !_arEffectsEnabled;
    });
    
    if (_arEffectsEnabled && _cameraController != null) {
      try {
        _cameraController!.startImageStream(_processARFrame);
        print('✅ AR effects enabled - processing camera stream');
      } catch (e) {
        print('❌ Error starting AR stream: $e');
        setState(() {
          _arEffectsEnabled = false;
        });
      }
    } else if (_cameraController != null) {
      try {
        _cameraController!.stopImageStream();
        setState(() {
          _processedFrame = null;
        });
        print('⏹️ AR effects disabled');
      } catch (e) {
        print('❌ Error stopping AR stream: $e');
      }
    }
  }
  
  // Process individual camera frames for AR effects
  Future<void> _processARFrame(CameraImage image) async {
    if (_arProcessor == null || !_arEffectsEnabled || !mounted) return;
    
    try {
      final processedFrame = await _arProcessor!.processFrame(image);
      if (processedFrame != null && mounted) {
        setState(() {
          _processedFrame = processedFrame;
        });
      }
    } catch (e) {
      print('❌ AR frame processing error: $e');
    }
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
            child: _arEffectsEnabled 
                ? _buildARPreview() 
                : CameraPreview(_cameraController!),
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
              showModalBottomSheet(
                context: context,
                isScrollControlled: true,
                backgroundColor: Colors.transparent,
                builder: (context) => const BeautyFiltersModule(),
              );
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