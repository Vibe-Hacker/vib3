class AppConfig {
  // Backend URLs (multiple for reliability)
  static const List<String> backendUrls = [
    'https://vib3-backend-u8zjk.ondigitalocean.app',  // DigitalOcean with MongoDB + DO Spaces
    'https://vib3app.net',                             // Backup server
  ];

  // Primary backend URL
  static String get baseUrl => 'https://vib3-backend-u8zjk.ondigitalocean.app';
  
  // API Endpoints
  static const String loginEndpoint = '/api/auth/login';
  static const String signupEndpoint = '/api/auth/register';
  static const String videosEndpoint = '/api/videos';
  static const String uploadEndpoint = '/api/upload/video';
  static const String profileEndpoint = '/api/auth/me';
  
  // Network settings
  static const Duration timeout = Duration(seconds: 10);
  static const int maxRetries = 3;
  
  // App Theme Colors
  static const int primaryColor = 0xFFFF0080;
  static const int secondaryColor = 0xFF00F0FF;
  static const int backgroundColor = 0xFF000000;
  
  // Auth headers for API requests
  static Map<String, String> get authHeaders {
    // In a real app, this would get the token from AuthService
    return {
      'Content-Type': 'application/json',
      // 'Authorization': 'Bearer ${AuthService.token}',
    };
  }
}