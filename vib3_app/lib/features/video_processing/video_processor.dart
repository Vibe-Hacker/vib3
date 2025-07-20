import 'dart:io';
import 'dart:async';
import 'package:video_compress/video_compress.dart';
import 'package:flutter/material.dart';
import '../../core/video_pipeline/pipeline_manager.dart';
import '../../core/video_pipeline/video_cache.dart';

class VideoProcessor {
  static final VideoProcessor _instance = VideoProcessor._internal();
  static VideoProcessor get instance => _instance;
  VideoProcessor._internal();

  final _videoCompress = VideoCompress;
  StreamSubscription? _compressSubscription;
  
  Future<ProcessedVideo?> processVideo(String inputPath, {
    VideoQuality quality = VideoQuality.MediumQuality,
    bool deleteOrigin = false,
  }) async {
    try {
      VideoPipelineManager.instance.updateStage(PipelineStage.processing);
      
      // Subscribe to compression progress
      _compressSubscription?.cancel();
      _compressSubscription = _videoCompress.compressProgress$.listen((progress) {
        VideoPipelineManager.instance.updateProgress(progress / 100);
      });
      
      // Generate output path
      final outputPath = await VideoCache.instance.generateTempPath('mp4');
      
      // Compress video
      final mediaInfo = await _videoCompress.compressVideo(
        inputPath,
        quality: quality,
        deleteOrigin: deleteOrigin,
        includeAudio: true,
      );
      
      if (mediaInfo == null || mediaInfo.path == null) {
        throw Exception('Video compression failed');
      }
      
      // Get video info
      final info = await _videoCompress.getMediaInfo(mediaInfo.path!);
      
      return ProcessedVideo(
        path: mediaInfo.path!,
        duration: Duration(milliseconds: info.duration?.round() ?? 0),
        width: info.width ?? 0,
        height: info.height ?? 0,
        fileSize: await File(mediaInfo.path!).length(),
      );
      
    } catch (e) {
      debugPrint('Video processing failed: $e');
      VideoPipelineManager.instance.reportError('Processing failed: $e');
      return null;
    } finally {
      _compressSubscription?.cancel();
    }
  }
  
  Future<File?> generateThumbnail(String videoPath, {int position = 0}) async {
    try {
      final thumbnailPath = await VideoCache.instance.generateTempPath('jpg');
      final file = await _videoCompress.getThumbnailWithFile(
        videoPath,
        quality: 75,
        position: position,
      );
      
      if (file != null) {
        return file;
      }
      
      return null;
    } catch (e) {
      debugPrint('Thumbnail generation failed: $e');
      return null;
    }
  }
  
  Future<List<File>> generateThumbnails(String videoPath, {int count = 5}) async {
    try {
      final info = await _videoCompress.getMediaInfo(videoPath);
      final duration = info.duration ?? 0;
      final interval = duration ~/ count;
      
      final thumbnails = <File>[];
      
      for (int i = 0; i < count; i++) {
        final position = i * interval;
        final thumbnail = await generateThumbnail(videoPath, position: position);
        if (thumbnail != null) {
          thumbnails.add(thumbnail);
        }
      }
      
      return thumbnails;
    } catch (e) {
      debugPrint('Multiple thumbnail generation failed: $e');
      return [];
    }
  }
  
  Future<bool> cancelProcessing() async {
    try {
      await _videoCompress.cancelCompression();
      _compressSubscription?.cancel();
      return true;
    } catch (e) {
      debugPrint('Failed to cancel processing: $e');
      return false;
    }
  }
  
  void dispose() {
    _compressSubscription?.cancel();
  }
}

class ProcessedVideo {
  final String path;
  final Duration duration;
  final int width;
  final int height;
  final int fileSize;
  
  ProcessedVideo({
    required this.path,
    required this.duration,
    required this.width,
    required this.height,
    required this.fileSize,
  });
  
  double get aspectRatio => width / height;
  String get resolution => '${width}x$height';
  String get formattedSize {
    if (fileSize < 1024 * 1024) {
      return '${(fileSize / 1024).toStringAsFixed(1)} KB';
    } else {
      return '${(fileSize / (1024 * 1024)).toStringAsFixed(1)} MB';
    }
  }
}