import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'dart:async';
import 'dart:io';
import '../../core/video_pipeline/pipeline_manager.dart';
import '../../core/video_pipeline/video_cache.dart';

class VIB3CameraController {
  CameraController? _controller;
  List<CameraDescription> _cameras = [];
  int _selectedCameraIndex = 0;
  bool _isInitialized = false;
  bool _isRecording = false;
  FlashMode _flashMode = FlashMode.off;
  double _currentZoom = 1.0;
  double _minZoom = 1.0;
  double _maxZoom = 1.0;
  
  // Getters
  CameraController? get controller => _controller;
  bool get isInitialized => _isInitialized;
  bool get isRecording => _isRecording;
  FlashMode get flashMode => _flashMode;
  double get currentZoom => _currentZoom;
  bool get hasFrontAndBack => _cameras.length >= 2;
  bool get isUsingFrontCamera => _selectedCameraIndex == 1;
  
  Future<void> initialize() async {
    try {
      _cameras = await availableCameras();
      if (_cameras.isEmpty) {
        throw Exception('No cameras available');
      }
      
      await _initializeController(_selectedCameraIndex);
    } catch (e) {
      debugPrint('Failed to initialize camera: $e');
      rethrow;
    }
  }
  
  Future<void> _initializeController(int cameraIndex) async {
    if (_controller != null) {
      await _controller!.dispose();
    }
    
    _controller = CameraController(
      _cameras[cameraIndex],
      ResolutionPreset.high,
      enableAudio: true,
    );
    
    await _controller!.initialize();
    
    // Get zoom levels
    _minZoom = await _controller!.getMinZoomLevel();
    _maxZoom = await _controller!.getMaxZoomLevel();
    _currentZoom = _minZoom;
    
    _isInitialized = true;
  }
  
  Future<void> switchCamera() async {
    if (_cameras.length < 2) return;
    
    _selectedCameraIndex = (_selectedCameraIndex + 1) % _cameras.length;
    await _initializeController(_selectedCameraIndex);
  }
  
  Future<void> toggleFlash() async {
    if (_controller == null || !_isInitialized) return;
    
    _flashMode = _flashMode == FlashMode.off 
        ? FlashMode.torch 
        : FlashMode.off;
    
    await _controller!.setFlashMode(_flashMode);
  }
  
  Future<void> setZoom(double zoom) async {
    if (_controller == null || !_isInitialized) return;
    
    _currentZoom = zoom.clamp(_minZoom, _maxZoom);
    await _controller!.setZoomLevel(_currentZoom);
  }
  
  Future<String?> startRecording() async {
    if (_controller == null || !_isInitialized || _isRecording) return null;
    
    try {
      await _controller!.startVideoRecording();
      _isRecording = true;
      
      VideoPipelineManager.instance.updateStage(PipelineStage.recording);
      
      return 'recording'; // Return a non-null value to indicate success
    } catch (e) {
      debugPrint('Failed to start recording: $e');
      VideoPipelineManager.instance.reportError('Failed to start recording: $e');
      return null;
    }
  }
  
  Future<XFile?> stopRecording() async {
    debugPrint('🎥 CameraController.stopRecording called');
    debugPrint('🎥 _controller: $_controller, _isInitialized: $_isInitialized, _isRecording: $_isRecording');
    
    if (_controller == null || !_isInitialized || !_isRecording) {
      debugPrint('❌ Cannot stop recording - controller null or not recording');
      return null;
    }
    
    try {
      debugPrint('🎥 Calling controller.stopVideoRecording()...');
      final file = await _controller!.stopVideoRecording();
      _isRecording = false;
      
      debugPrint('✅ Recording stopped successfully: ${file.path}');
      VideoPipelineManager.instance.updateStage(PipelineStage.processing);
      
      return file;
    } catch (e) {
      debugPrint('❌ Failed to stop recording: $e');
      debugPrint('❌ Error type: ${e.runtimeType}');
      debugPrint('❌ Stack trace: ${StackTrace.current}');
      VideoPipelineManager.instance.reportError('Failed to stop recording: $e');
      return null;
    }
  }
  
  Future<void> pauseRecording() async {
    if (_controller == null || !_isInitialized || !_isRecording) return;
    
    try {
      await _controller!.pauseVideoRecording();
    } catch (e) {
      debugPrint('Failed to pause recording: $e');
    }
  }
  
  Future<void> resumeRecording() async {
    if (_controller == null || !_isInitialized || !_isRecording) return;
    
    try {
      await _controller!.resumeVideoRecording();
    } catch (e) {
      debugPrint('Failed to resume recording: $e');
    }
  }
  
  Future<File?> takePicture() async {
    if (_controller == null || !_isInitialized || _isRecording) return null;
    
    try {
      final image = await _controller!.takePicture();
      return File(image.path);
    } catch (e) {
      debugPrint('Failed to take picture: $e');
      return null;
    }
  }
  
  void dispose() {
    _controller?.dispose();
    _controller = null;
    _isInitialized = false;
    _isRecording = false;
  }
}