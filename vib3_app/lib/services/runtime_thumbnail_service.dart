import 'dart:io';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:path_provider/path_provider.dart';
import 'package:http/http.dart' as http;
import 'package:path/path.dart' as path;
import 'package:video_thumbnail/video_thumbnail.dart';

/// Service for generating thumbnails at runtime for videos that don't have them
class RuntimeThumbnailService {
  static final Map<String, String> _thumbnailCache = {};
  
  /// Get or generate a thumbnail for a video URL
  static Future<String?> getOrGenerateThumbnail(String videoUrl) async {
    // Check cache first
    if (_thumbnailCache.containsKey(videoUrl)) {
      return _thumbnailCache[videoUrl];
    }
    
    try {
      // Try common thumbnail URL patterns first
      final thumbnailUrls = _generateThumbnailUrlPatterns(videoUrl);
      
      // Check if any of the thumbnail URLs exist
      for (final thumbnailUrl in thumbnailUrls) {
        final exists = await _checkUrlExists(thumbnailUrl);
        if (exists) {
          _thumbnailCache[videoUrl] = thumbnailUrl;
          return thumbnailUrl;
        }
      }
      
      // If no thumbnail exists, try to generate one from the video
      // This is only possible for local files or if we download the video
      print('⚠️ No thumbnail found for $videoUrl');
      
      // For now, return null and let the UI show a fallback
      return null;
      
    } catch (e) {
      print('Error getting thumbnail: $e');
      return null;
    }
  }
  
  /// Generate possible thumbnail URL patterns
  static List<String> _generateThumbnailUrlPatterns(String videoUrl) {
    final patterns = <String>[];
    
    if (videoUrl.contains('.mp4')) {
      // For DigitalOcean Spaces
      if (videoUrl.contains('digitaloceanspaces.com')) {
        // Try thumbnails folder
        patterns.add(videoUrl.replaceAll('/videos/', '/thumbnails/').replaceAll('.mp4', '.jpg'));
        patterns.add(videoUrl.replaceAll('/videos/', '/thumbnails/').replaceAll('.mp4', '_thumb.jpg'));
        patterns.add(videoUrl.replaceAll('/videos/', '/thumbnails/').replaceAll('.mp4', '-thumb.jpg'));
      }
      
      // Try same folder with different naming conventions
      patterns.add(videoUrl.replaceAll('.mp4', '_thumb.jpg'));
      patterns.add(videoUrl.replaceAll('.mp4', '-thumb.jpg'));
      patterns.add(videoUrl.replaceAll('.mp4', '.thumb.jpg'));
      patterns.add(videoUrl.replaceAll('.mp4', '.jpg'));
    }
    
    return patterns;
  }
  
  /// Check if a URL exists
  static Future<bool> _checkUrlExists(String url) async {
    try {
      final response = await http.head(Uri.parse(url)).timeout(
        const Duration(seconds: 2),
        onTimeout: () => http.Response('', 404),
      );
      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }
  
  /// Generate thumbnail from a network video (requires downloading)
  static Future<File?> generateThumbnailFromUrl(String videoUrl) async {
    try {
      // First, download a portion of the video to a temporary file
      final tempDir = await getTemporaryDirectory();
      final tempVideoPath = path.join(tempDir.path, 'temp_video_${DateTime.now().millisecondsSinceEpoch}.mp4');
      
      // Download first 1MB of video for thumbnail generation
      final response = await http.get(
        Uri.parse(videoUrl),
        headers: {'Range': 'bytes=0-1048576'}, // First 1MB
      ).timeout(const Duration(seconds: 10));
      
      if (response.statusCode == 200 || response.statusCode == 206) {
        final tempFile = File(tempVideoPath);
        await tempFile.writeAsBytes(response.bodyBytes);
        
        // Generate thumbnail from temp file
        final thumbnailData = await VideoThumbnail.thumbnailData(
          video: tempVideoPath,
          imageFormat: ImageFormat.JPEG,
          maxWidth: 720,
          quality: 85,
          timeMs: 0, // First frame
        );
        
        // Clean up temp video file
        await tempFile.delete();
        
        if (thumbnailData != null) {
          final thumbnailPath = path.join(tempDir.path, 'thumb_${DateTime.now().millisecondsSinceEpoch}.jpg');
          final thumbnailFile = File(thumbnailPath);
          await thumbnailFile.writeAsBytes(thumbnailData);
          return thumbnailFile;
        }
      }
    } catch (e) {
      print('Error generating thumbnail from URL: $e');
    }
    
    return null;
  }
  
  /// Clear the thumbnail cache
  static void clearCache() {
    _thumbnailCache.clear();
  }
}