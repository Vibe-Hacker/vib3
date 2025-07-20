import 'dart:io';
import 'dart:typed_data';
import 'package:video_thumbnail/video_thumbnail.dart';
import 'package:flutter/material.dart';
import '../../core/video_pipeline/video_cache.dart';

class ThumbnailGenerator {
  static final ThumbnailGenerator _instance = ThumbnailGenerator._internal();
  static ThumbnailGenerator get instance => _instance;
  ThumbnailGenerator._internal();

  Future<File?> generateFromPath(String videoPath, {
    int timeMs = 0,
    int quality = 75,
  }) async {
    try {
      final thumbnailPath = await VideoThumbnail.thumbnailFile(
        video: videoPath,
        thumbnailPath: (await VideoCache.instance.cacheDirectory).path,
        imageFormat: ImageFormat.JPEG,
        timeMs: timeMs,
        quality: quality,
      );
      
      if (thumbnailPath != null) {
        return File(thumbnailPath);
      }
      
      return null;
    } catch (e) {
      debugPrint('Thumbnail generation failed: $e');
      return null;
    }
  }
  
  Future<Uint8List?> generateAsBytes(String videoPath, {
    int timeMs = 0,
    int quality = 75,
    int? maxWidth,
    int? maxHeight,
  }) async {
    try {
      final uint8list = await VideoThumbnail.thumbnailData(
        video: videoPath,
        imageFormat: ImageFormat.JPEG,
        timeMs: timeMs,
        quality: quality,
        maxWidth: maxWidth,
        maxHeight: maxHeight,
      );
      
      return uint8list;
    } catch (e) {
      debugPrint('Thumbnail byte generation failed: $e');
      return null;
    }
  }
  
  Future<List<File>> generateMultiple(String videoPath, {
    int count = 5,
    int quality = 75,
  }) async {
    final thumbnails = <File>[];
    
    try {
      // First get video duration (approximate based on file size and bitrate)
      final file = File(videoPath);
      final fileSize = await file.length();
      // Rough estimate: assume 1MB per 10 seconds at medium quality
      final estimatedDuration = (fileSize / (1024 * 1024)) * 10 * 1000; // in ms
      
      final interval = estimatedDuration ~/ count;
      
      for (int i = 0; i < count; i++) {
        final timeMs = i * interval;
        final thumbnail = await generateFromPath(
          videoPath,
          timeMs: timeMs.toInt(),
          quality: quality,
        );
        
        if (thumbnail != null) {
          thumbnails.add(thumbnail);
        }
      }
      
      return thumbnails;
    } catch (e) {
      debugPrint('Multiple thumbnail generation failed: $e');
      return thumbnails;
    }
  }
  
  Future<File?> generateCoverImage(String videoPath) async {
    // Generate thumbnail at 1 second mark for better representation
    return generateFromPath(videoPath, timeMs: 1000, quality: 90);
  }
}