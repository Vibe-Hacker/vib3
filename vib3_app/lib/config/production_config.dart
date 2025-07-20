/// Production configuration for VIB3
class ProductionConfig {
  // Production URLs
  static const String domain = 'vib3app.net';
  static const String apiUrl = 'https://vib3app.net';
  static const String appUrl = 'https://vib3app.net';
  static const String cdnUrl = 'https://vib3-videos.nyc3.cdn.digitaloceanspaces.com';
  
  // Fallback to old Digital Ocean app
  static const String fallbackUrl = 'https://vib3-web-75tal.ondigitalocean.app';
  static const String fallbackApi = fallbackUrl;
  
  // Get base URL with fallback
  static String get baseUrl {
    // You can implement a check here to see if domain is working
    return apiUrl; // Use domain by default
  }
  
  // WebSocket URLs
  static String get wsUrl => apiUrl.replaceAll('https://', 'wss://').replaceAll('http://', 'ws://');
  
  // Video CDN URL
  static String getVideoUrl(String videoPath) {
    if (videoPath.startsWith('http')) {
      return videoPath;
    }
    return '$cdnUrl/$videoPath';
  }
  
  // Image CDN URL
  static String getImageUrl(String imagePath) {
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    return '$cdnUrl/images/$imagePath';
  }
}