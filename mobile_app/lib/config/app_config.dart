class AppConfig {
  // Backend URL
  static const String baseUrl = 'https://vib3-production.up.railway.app';
  
  // API Endpoints
  static const String loginEndpoint = '/api/auth/login';
  static const String signupEndpoint = '/api/auth/register';
  static const String videosEndpoint = '/feed';
  static const String uploadEndpoint = '/api/upload';
  static const String profileEndpoint = '/api/auth/me';
  
  // App Theme Colors
  static const int primaryColor = 0xFFFF0080;
  static const int secondaryColor = 0xFF00F0FF;
  static const int backgroundColor = 0xFF000000;
}