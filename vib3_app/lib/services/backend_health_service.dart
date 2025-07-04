import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';

class BackendHealthService {
  static bool _backendHealthy = true;
  static DateTime? _lastHealthCheck;
  static const Duration _healthCheckInterval = Duration(minutes: 5);

  static bool get isBackendHealthy => _backendHealthy;

  static Future<bool> checkBackendHealth() async {
    // Only check every 5 minutes to avoid spam
    if (_lastHealthCheck != null && 
        DateTime.now().difference(_lastHealthCheck!) < _healthCheckInterval) {
      return _backendHealthy;
    }

    try {
      print('🏥 Checking backend health...');
      
      // Try a simple health check endpoint first
      final healthEndpoints = [
        '/health',
        '/api/health',
        '/ping',
        '/status',
        '/', // Root endpoint
      ];

      bool anyEndpointWorking = false;

      for (final endpoint in healthEndpoints) {
        try {
          final response = await http.get(
            Uri.parse('${AppConfig.baseUrl}$endpoint'),
            headers: {'Accept': 'application/json'},
          ).timeout(const Duration(seconds: 5));

          print('🔍 Health check $endpoint: ${response.statusCode}');

          if (response.statusCode == 200) {
            // Check if it returns JSON or at least not an error page
            if (!response.body.trim().startsWith('<') && 
                !response.body.contains('<!DOCTYPE') &&
                !response.body.toLowerCase().contains('error')) {
              anyEndpointWorking = true;
              print('✅ Backend health check passed');
              break;
            }
          }
        } catch (e) {
          print('❌ Health endpoint $endpoint failed: $e');
          continue;
        }
      }

      _backendHealthy = anyEndpointWorking;
      _lastHealthCheck = DateTime.now();

      if (!_backendHealthy) {
        print('🚨 Backend appears to be down or misconfigured');
        print('🔧 All endpoints returning HTML or errors');
      }

      return _backendHealthy;
    } catch (e) {
      print('❌ Backend health check failed: $e');
      _backendHealthy = false;
      _lastHealthCheck = DateTime.now();
      return false;
    }
  }

  static Future<Map<String, dynamic>> getBackendStatus() async {
    await checkBackendHealth();
    
    return {
      'healthy': _backendHealthy,
      'baseUrl': AppConfig.baseUrl,
      'lastChecked': _lastHealthCheck?.toIso8601String(),
      'message': _backendHealthy 
        ? 'Backend is responding normally'
        : 'Backend may be down or misconfigured - using mock data',
    };
  }

  static String getBackendStatusMessage() {
    if (_backendHealthy) {
      return 'Connected to VIB3 servers';
    } else {
      return 'Server connection issues - using offline mode';
    }
  }

  // Force mark backend as unhealthy (for testing or when we detect issues)
  static void markBackendUnhealthy() {
    _backendHealthy = false;
    _lastHealthCheck = DateTime.now();
    print('🚨 Backend manually marked as unhealthy');
  }

  // Automatically mark backend as unhealthy when HTML responses detected
  static void reportHtmlResponse(String endpoint) {
    _backendHealthy = false;
    _lastHealthCheck = DateTime.now();
    print('🚨 Backend marked unhealthy due to HTML response from $endpoint');
  }

  // Reset health status (for retry scenarios)
  static void resetHealthStatus() {
    _lastHealthCheck = null;
    print('🔄 Backend health status reset');
  }
}