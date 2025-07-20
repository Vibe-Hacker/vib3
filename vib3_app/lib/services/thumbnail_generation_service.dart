import 'package:http/http.dart' as http;
import 'dart:convert';
import '../config/app_config.dart';

/// Service to request thumbnail generation from backend
class ThumbnailGenerationService {
  static final Map<String, String> _pendingRequests = {};
  static final Map<String, String> _thumbnailCache = {};
  
  /// Request thumbnail generation from backend
  static Future<String?> requestThumbnail(String videoId, String videoUrl, String? authToken) async {
    // Check cache first
    if (_thumbnailCache.containsKey(videoId)) {
      return _thumbnailCache[videoId];
    }
    
    // Check if already requested
    if (_pendingRequests.containsKey(videoId)) {
      return _pendingRequests[videoId];
    }
    
    try {
      // For now, use a predictable thumbnail URL pattern
      // The backend should generate thumbnails at these locations
      if (videoUrl.contains('digitaloceanspaces.com')) {
        // Extract filename from video URL
        final uri = Uri.parse(videoUrl);
        final pathSegments = uri.pathSegments;
        if (pathSegments.isNotEmpty) {
          final filename = pathSegments.last;
          if (filename.endsWith('.mp4')) {
            // Create thumbnail URL by replacing videos/ with thumbnails/ and .mp4 with .jpg
            final thumbnailFilename = filename.replaceAll('.mp4', '_thumb.jpg');
            final thumbnailUrl = videoUrl
                .replaceAll('/videos/', '/thumbnails/')
                .replaceAll(filename, thumbnailFilename);
            
            // Cache and return
            _thumbnailCache[videoId] = thumbnailUrl;
            return thumbnailUrl;
          }
        }
      }
      
      // Don't make backend request for now, just return null
      // This will force the fallback gradient to show
      return null;
    } catch (e) {
      print('Error requesting thumbnail: $e');
      return null;
    }
  }
  
  /// Get a placeholder thumbnail URL based on video ID
  static String getPlaceholderThumbnail(String videoId) {
    // Use a gradient placeholder service or generate based on ID
    final colorCode = videoId.hashCode.toUnsigned(24).toRadixString(16).padLeft(6, '0');
    return 'https://via.placeholder.com/400x600/$colorCode/FFFFFF?text=VIB3';
  }
}