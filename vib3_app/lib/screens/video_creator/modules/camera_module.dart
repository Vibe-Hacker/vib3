import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:camera/camera.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:async';
import 'dart:io';
import 'dart:ui' as ui;
import '../providers/creation_state_provider.dart';
import '../widgets/camera_controls.dart';
import '../widgets/recording_timer.dart';
import '../widgets/beauty_slider.dart';
import '../widgets/auto_captions_widget.dart';
import 'beauty_filters_module.dart';
import 'filters_module.dart';
import '../../../services/ar_effects_processor.dart';
import '../../../services/voice_effects_processor.dart';
import '../../../services/real_time_filter_processor.dart';
import '../../../services/video_export_service.dart';
import '../../../services/speech_to_text_service.dart';

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
  RealTimeFilterProcessor? _filterProcessor;
  ui.Image? _processedFrame;
  bool _arEffectsEnabled = false;
  bool _filtersEnabled = false;
  
  // Auto-captions
  List<Caption>? _generatedCaptions;
  
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
      
      _filterProcessor = RealTimeFilterProcessor();
      
      print('✅ AR, Voice, and Filter processors initialized');
    } catch (e) {
      print('❌ Error initializing processors: $e');
    }
  }
  
  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    
    // Stop any active streams
    if (_arEffectsEnabled || _filtersEnabled) {
      try {
        _cameraController?.stopImageStream();
      } catch (e) {
        print('Error stopping image stream in dispose: $e');
      }
    }
    
    // Stop recording if active
    if (_isRecording) {
      try {
        _cameraController?.stopVideoRecording();
      } catch (e) {
        print('Error stopping recording in dispose: $e');
      }
    }
    
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

      // Debug: Log all available cameras
      print('\n🎥 ===== CAMERA DETECTION DEBUG =====');
      print('📸 Total cameras found: ${_cameras.length}');
      for (int i = 0; i < _cameras.length; i++) {
        final camera = _cameras[i];
        print('📸 Camera $i:');
        print('   - Name: ${camera.name}');
        print('   - Lens Direction: ${camera.lensDirection}');
        print('   - Is Front: ${camera.lensDirection == CameraLensDirection.front}');
        print('   - Is Back: ${camera.lensDirection == CameraLensDirection.back}');
      }
      print('📸 Selected camera index: $_selectedCameraIndex');
      if (_selectedCameraIndex < _cameras.length) {
        final selected = _cameras[_selectedCameraIndex];
        print('📸 Selected camera lens direction: ${selected.lensDirection}');
        print('📸 Is front camera: ${selected.lensDirection == CameraLensDirection.front}');
      }
      print('🎥 ===== END CAMERA DEBUG =====\n');

      await _setupCameraController(_selectedCameraIndex);
    } catch (e) {
      print('Error initializing camera: $e');
    }
  }
  
  Future<void> _setupCameraController(int cameraIndex) async {
    if (_cameras.isEmpty) return;
    
    // Mark as not initialized during transition
    if (mounted) {
      setState(() {
        _isInitialized = false;
      });
    }
    
    // Dispose existing controller if any
    if (_cameraController != null) {
      try {
        // Make sure to stop recording if active
        if (_isRecording) {
          await _cameraController!.stopVideoRecording();
          _isRecording = false;
        }
        await _cameraController!.dispose();
      } catch (e) {
        print('Error disposing camera controller: $e');
      }
      _cameraController = null;
    }
    
    // Small delay to ensure proper cleanup
    await Future.delayed(const Duration(milliseconds: 100));
    
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
      
      // Restore flash mode
      await _cameraController!.setFlashMode(_flashMode);
      
      if (mounted) {
        setState(() {
          _isInitialized = true;
          _zoomLevel = _minZoom;
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
    // Hand gesture recognition for hands-free recording
    // Currently using double-tap as a simulation
    // In production, this would integrate with ML Kit's hand gesture detection
    // to recognize specific gestures like:
    // - Open palm to start recording
    // - Closed fist to stop recording
    // - Peace sign to switch camera
    // For now, double-tap gesture is enabled in the camera preview
  }
  
  Future<void> _toggleCamera() async {
    if (_cameras.length < 2) return;
    
    // Stop any active image streams before switching
    if (_arEffectsEnabled || _filtersEnabled) {
      try {
        await _cameraController?.stopImageStream();
      } catch (e) {
        print('Error stopping image stream: $e');
      }
      setState(() {
        _arEffectsEnabled = false;
        _filtersEnabled = false;
        _processedFrame = null;
      });
    }
    
    setState(() {
      _selectedCameraIndex = (_selectedCameraIndex + 1) % _cameras.length;
    });

    // Debug: Log camera switch
    print('📸 CAMERA SWITCHED to index: $_selectedCameraIndex');
    if (_selectedCameraIndex < _cameras.length) {
      final newCamera = _cameras[_selectedCameraIndex];
      print('📸 New camera lens direction: ${newCamera.lensDirection}');
      print('📸 Is front camera: ${newCamera.lensDirection == CameraLensDirection.front}');
    }

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

        // Add clip to provider with front camera flag
        // TESTING: Force FALSE - videos may not need flipping at all
        final isFrontCamera = false;
        print('📸 CAMERA MODULE: Recording finished, camera index=$_selectedCameraIndex, forcing isFrontCamera=$isFrontCamera (NO TRANSFORM)');
        print('📸 CAMERA MODULE: Selected camera: ${_cameras[_selectedCameraIndex].name}, lensDirection=${_cameras[_selectedCameraIndex].lensDirection}');
        creationState.addVideoClip(videoFile.path, isFrontCamera: isFrontCamera);
        
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
  
  void _combineClipsAndProceed() async {
    if (_recordedClips.isEmpty) return;
    
    // If only one clip, no need to combine
    if (_recordedClips.length == 1) {
      widget.onVideoRecorded(_recordedClips.first);
      return;
    }
    
    // Show loading indicator
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(
        child: CircularProgressIndicator(
          color: Color(0xFF00CED1),
        ),
      ),
    );
    
    try {
      // Use video export service to combine clips
      final videoExport = VideoExportService();
      final outputPath = await videoExport.combineClips(_recordedClips);
      
      if (mounted) {
        Navigator.pop(context); // Close loading dialog
        widget.onVideoRecorded(outputPath);
      }
    } catch (e) {
      print('Error combining clips: $e');
      if (mounted) {
        Navigator.pop(context); // Close loading dialog
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to combine clips: $e'),
            backgroundColor: Colors.red,
          ),
        );
        // Fallback to first clip
        widget.onVideoRecorded(_recordedClips.first);
      }
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
  
  // Real-time filter preview
  Widget _buildFilterPreview() {
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
    if (!mounted) return;
    
    try {
      ui.Image? processedFrame;
      
      // Process with AR effects if enabled
      if (_arEffectsEnabled && _arProcessor != null) {
        processedFrame = await _arProcessor!.processFrame(image);
      }
      // Process with filters if enabled
      else if (_filtersEnabled && _filterProcessor != null) {
        processedFrame = await _filterProcessor!.processFrame(image);
      }
      
      if (processedFrame != null && mounted) {
        setState(() {
          _processedFrame = processedFrame;
        });
      }
    } catch (e) {
      print('❌ Frame processing error: $e');
    }
  }
  
  // Toggle filters on/off
  void _toggleFilters(bool enable) {
    setState(() {
      _filtersEnabled = enable;
      if (!enable) {
        _processedFrame = null;
      }
    });
    
    if (enable && _cameraController != null && !_arEffectsEnabled) {
      try {
        _cameraController!.startImageStream(_processARFrame);
        print('✅ Filters enabled - processing camera stream');
      } catch (e) {
        print('❌ Error starting filter stream: $e');
        setState(() {
          _filtersEnabled = false;
        });
      }
    } else if (!enable && !_arEffectsEnabled && _cameraController != null) {
      try {
        _cameraController!.stopImageStream();
        print('⏹️ Filters disabled');
      } catch (e) {
        print('❌ Error stopping filter stream: $e');
      }
    }
  }
  
  // Apply filter settings
  void applyFilter(String? filterId, {double intensity = 1.0}) {
    if (_filterProcessor != null) {
      _filterProcessor!.setFilter(filterId, intensity: intensity);
      if (filterId != null && !_filtersEnabled) {
        _toggleFilters(true);
      } else if (filterId == null && _filtersEnabled) {
        _toggleFilters(false);
      }
    }
  }
  
  // Apply beauty settings
  void applyBeautySettings(Map<String, double> settings) {
    if (_filterProcessor != null) {
      _filterProcessor!.setBeautySettings(settings);
      if (settings.values.any((v) => v != 0) && !_filtersEnabled) {
        _toggleFilters(true);
      }
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
                : _filtersEnabled
                    ? _buildFilterPreview()
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
        
        // Auto-captions widget
        Positioned(
          top: 100,
          left: 0,
          right: 0,
          child: AutoCaptionsWidget(
            isRecording: _isRecording,
            onCaptionsGenerated: (captions) {
              setState(() {
                _generatedCaptions = captions;
              });
              // Add captions to creation state
              final creationState = context.read<CreationStateProvider>();
              final recordingStartTime = DateTime.now();
              for (final caption in captions) {
                creationState.addTextOverlay(TextOverlay(
                  text: caption.text,
                  position: const Offset(0.5, 0.8), // Bottom center
                  fontSize: 16,
                  color: Colors.white.value,
                  startTime: caption.startTime.difference(recordingStartTime),
                  duration: caption.endTime.difference(caption.startTime),
                ));
              }
            },
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
        if (_selectedCameraIndex != 0) // Front camera (index-based detection)
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
                builder: (context) => BeautyFiltersModule(
                  onBeautySettingsChanged: (settings) {
                    applyBeautySettings(settings);
                  },
                ),
              );
            },
            onFiltersToggle: () {
              showModalBottomSheet(
                context: context,
                isScrollControlled: true,
                backgroundColor: Colors.transparent,
                builder: (context) => FiltersModule(
                  onFilterChanged: (filterId, intensity) {
                    applyFilter(filterId, intensity: intensity);
                  },
                ),
              );
            },
            onGallery: () async {
              // Open gallery picker
              try {
                final picker = ImagePicker();
                final XFile? video = await picker.pickVideo(
                  source: ImageSource.gallery,
                );
                
                if (video != null && mounted) {
                  // Add selected video to clips
                  setState(() {
                    _recordedClips.add(video.path);
                  });
                  
                  // Add to creation state
                  final creationState = context.read<CreationStateProvider>();
                  creationState.addVideoClip(video.path);
                  
                  // Navigate to edit
                  widget.onVideoRecorded(video.path);
                }
              } catch (e) {
                print('Error picking video from gallery: $e');
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Failed to access gallery'),
                      backgroundColor: Colors.red,
                    ),
                  );
                }
              }
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