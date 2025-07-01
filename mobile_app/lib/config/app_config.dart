class AppConfig {
  // Backend URL - Connected to Railway/MongoDB production
  static const String baseUrl = 'https://vib3-production.up.railway.app'; // VIB3 production server
  
  // API Endpoints  
  static const String loginEndpoint = '/api/auth/login';
  static const String signupEndpoint = '/api/auth/register';
  static const String videosEndpoint = '/api/videos';
  static const String uploadEndpoint = '/api/videos/upload';
  static const String likeEndpoint = '/api/videos/like';
  static const String commentEndpoint = '/api/videos/comment';
  static const String profileEndpoint = '/api/auth/me';
  static const String followEndpoint = '/api/users/follow';
  
  // App Theme Colors
  static const int primaryColor = 0xFFFF0080; // VIB3 Pink
  static const int secondaryColor = 0xFF00F0FF; // VIB3 Cyan
  static const int backgroundColor = 0xFF000000; // Black
  
  // Video Configuration
  static const double maxVideoSizeMB = 100;
  static const int maxVideoDurationSeconds = 60;
}