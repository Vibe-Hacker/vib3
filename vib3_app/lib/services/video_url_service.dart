import '../config/app_config.dart';

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
      return '${AppConfig.baseUrl}$originalUrl';
    }
    
    return originalUrl;
  }
  
  // Get a CDN URL if available
  static String getCdnUrl(String videoUrl) {
    // For now, just return the original URL
    // In production, this could transform to a CDN URL
    return videoUrl;
  }
  
  // Get video URL with query parameters for better caching
  static String getOptimizedUrl(String videoUrl) {
    final uri = Uri.parse(videoUrl);
    
    // Add cache-busting parameter if needed
    final queryParams = Map<String, String>.from(uri.queryParameters);
    
    // Don't add timestamp to DigitalOcean URLs as it might break signing
    if (!videoUrl.contains('digitaloceanspaces.com')) {
      queryParams['t'] = DateTime.now().millisecondsSinceEpoch.toString();
    }
    
    return uri.replace(queryParameters: queryParams).toString();
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
      final backendUri = Uri.parse(AppConfig.baseUrl);
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
    return '${AppConfig.baseUrl}/api/proxy/video?url=$encodedUrl';
  }
}