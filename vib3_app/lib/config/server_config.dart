/// Server configuration for VIB3
class ServerConfig {
  // Production server configuration
  static const String productionDomain = 'vib3app.net';
  
  // API endpoints
  static const String apiGateway = 'https://$productionDomain';
  static const String mainApp = 'https://$productionDomain';
  
  // Feature flags
  static const bool useMicroservices = true;
  static const bool enableCache = true;
  
  // Get the appropriate base URL
  static String get baseUrl {
    return useMicroservices ? apiGateway : mainApp;
  }
}