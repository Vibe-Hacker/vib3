import 'dart:async';
import 'dart:io';
import 'package:flutter/material.dart';

enum PipelineStage {
  idle,
  recording,
  processing,
  editing,
  exporting,
  uploading,
  completed,
  error
}

class VideoPipelineManager {
  static final VideoPipelineManager _instance = VideoPipelineManager._internal();
  static VideoPipelineManager get instance => _instance;
  VideoPipelineManager._internal();

  final _stageController = StreamController<PipelineStage>.broadcast();
  final _progressController = StreamController<double>.broadcast();
  final _errorController = StreamController<String>.broadcast();

  PipelineStage _currentStage = PipelineStage.idle;
  String? _currentVideoPath;
  Map<String, dynamic> _metadata = {};
  
  Stream<PipelineStage> get stageStream => _stageController.stream;
  Stream<double> get progressStream => _progressController.stream;
  Stream<String> get errorStream => _errorController.stream;
  PipelineStage get currentStage => _currentStage;
  String? get currentVideoPath => _currentVideoPath;
  Map<String, dynamic> get metadata => Map.from(_metadata);

  void updateStage(PipelineStage stage) {
    _currentStage = stage;
    _stageController.add(stage);
    debugPrint('🎬 Pipeline Stage: ${stage.name}');
  }

  void updateProgress(double progress) {
    _progressController.add(progress.clamp(0.0, 1.0));
  }

  void reportError(String error) {
    _currentStage = PipelineStage.error;
    _stageController.add(PipelineStage.error);
    _errorController.add(error);
    debugPrint('❌ Pipeline Error: $error');
  }

  void setVideoPath(String path) {
    _currentVideoPath = path;
  }

  void updateMetadata(Map<String, dynamic> data) {
    _metadata.addAll(data);
  }

  void clearMetadata() {
    _metadata.clear();
  }

  Future<void> reset() async {
    _currentStage = PipelineStage.idle;
    _currentVideoPath = null;
    _metadata.clear();
    _stageController.add(PipelineStage.idle);
    updateProgress(0.0);
  }

  void dispose() {
    _stageController.close();
    _progressController.close();
    _errorController.close();
  }
}