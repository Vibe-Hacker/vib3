import '../../../app/constants/app_constants.dart';

class VideoUrlService {
  // Transform video URLs if needed for better compatibility
  static String transformVideoUrl(String originalUrl) {
    // If it's already a DigitalOcean Spaces URL, return as-is
    if (originalUrl.contains('digitaloceanspaces.com')) {
      // Ensure HTTPS
      if (originalUrl.startsWith('http://')) {
        return originalUrl.replaceFirst('http://', 'https://');
      }
      return originalUrl;
    }
    
    // If it's a relative URL, make it absolute
    if (!originalUrl.startsWith('http')) {
      return '${AppConstants.baseUrl}$originalUrl';
    }
    
    return originalUrl;
  }
  
  // Get a CDN URL if available
  static String getCdnUrl(String videoUrl) {
    // For now, just return the original URL
    // In production, this could transform to a CDN URL
    return videoUrl;
  }
  
  // Get video URL with optimized parameters for better performance
  static String getOptimizedUrl(String videoUrl) {
    final uri = Uri.parse(videoUrl);
    
    // Optimize URL parameters for better playback and codec performance
    final Map<String, String> optimizedParams = Map<String, String>.from(uri.queryParameters);
    
    // Add performance optimization parameters
    if (!videoUrl.contains('digitaloceanspaces.com')) {
      // Only add these for non-DigitalOcean URLs to avoid breaking signing
      optimizedParams.addAll({
        'profile': 'baseline',  // H.264 baseline profile for compatibility
        'preset': 'fast',       // Faster encoding/decoding
        'tune': 'fastdecode',   // Optimize for fast decoding
        'movflags': 'faststart', // Enable progressive download
        'format': 'mp4',        // Ensure MP4 format
      });
    }
    
    // Add cache control for better streaming
    optimizedParams['cache'] = 'force-cache';
    
    return uri.replace(queryParameters: optimizedParams).toString();
  }
  
  // Check if URL needs proxy (for CORS issues)
  static bool needsProxy(String videoUrl) {
    // DigitalOcean Spaces should have proper CORS configured
    if (videoUrl.contains('digitaloceanspaces.com')) {
      return false;
    }
    
    // Check if it's a different domain than our backend
    try {
      final videoUri = Uri.parse(videoUrl);
      final backendUri = Uri.parse(AppConstants.baseUrl);
      return videoUri.host != backendUri.host;
    } catch (e) {
      return false;
    }
  }
  
  // Get proxied URL if needed
  static String getProxiedUrl(String videoUrl) {
    if (!needsProxy(videoUrl)) {
      return videoUrl;
    }
    
    // Use backend proxy endpoint
    final encodedUrl = Uri.encodeComponent(videoUrl);
    return '${AppConstants.baseUrl}/api/proxy/video?url=$encodedUrl';
  }
}