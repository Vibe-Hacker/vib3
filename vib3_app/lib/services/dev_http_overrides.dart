import 'dart:io';

/// Development-only HTTP overrides to bypass certificate verification
/// WARNING: This should NEVER be used in production!
class DevHttpOverrides extends HttpOverrides {
  @override
  HttpClient createHttpClient(SecurityContext? context) {
    return super.createHttpClient(context)
      ..badCertificateCallback = (X509Certificate cert, String host, int port) {
        // Accept all certificates in development
        // This is necessary when device time is incorrect or certificates have issues
        print('⚠️ WARNING: Accepting certificate for $host:$port (DEVELOPMENT ONLY)');
        print('📅 Certificate dates: ${cert.startValidity} to ${cert.endValidity}');
        print('🕐 Current device time: ${DateTime.now()}');
        
        // Only accept for our known domains
        final allowedHosts = [
          'vib3app.net',
          'vib3-videos.nyc3.digitaloceanspaces.com',
          'api.vib3app.net',
        ];
        
        if (allowedHosts.contains(host)) {
          print('✅ Allowing connection to $host (known VIB3 domain)');
          return true;
        }
        
        print('❌ Rejecting connection to unknown host: $host');
        return false;
      };
  }
}