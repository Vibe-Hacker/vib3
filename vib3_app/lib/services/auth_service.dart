import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';

class AuthService {
  Future<Map<String, dynamic>> login(String email, String password) async {
    print('🔐 Login attempt for: $email');
    
    // Check network connectivity first
    bool hasNetwork = await _checkNetworkConnectivity();
    if (!hasNetwork) {
      return {
        'success': false,
        'message': 'No internet connection.\n\nPlease check:\n• WiFi is connected\n• Mobile data is enabled\n• Airplane mode is off',
      };
    }
    
    // Try each backend URL until one works
    for (int i = 0; i < AppConfig.backendUrls.length; i++) {
      final baseUrl = AppConfig.backendUrls[i];
      final url = '$baseUrl${AppConfig.loginEndpoint}';
      
      try {
        print('🌐 Trying backend ${i + 1}/${AppConfig.backendUrls.length}: $url');
        
        final response = await http.post(
          Uri.parse(url),
          headers: {
            'Content-Type': 'application/json',
          },
          body: jsonEncode({
            'email': email,
            'password': password,
          }),
        ).timeout(AppConfig.timeout);

        print('📡 Response status: ${response.statusCode}');
        print('📄 Response body: ${response.body}');

        final data = jsonDecode(response.body);
        
        if (response.statusCode == 200) {
          print('✅ Login successful with backend ${i + 1}');
          return {
            'success': true,
            'token': data['token'],
            'user': data['user'],
          };
        } else {
          print('❌ Login failed: ${data['message'] ?? data['error'] ?? 'Unknown error'}');
          return {
            'success': false,
            'message': data['message'] ?? data['error'] ?? 'Login failed',
          };
        }
      } catch (e) {
        print('💥 Backend ${i + 1} failed: $e');
        
        // Log specific network errors
        if (e.toString().contains('Network is unreachable')) {
          print('🚫 Network unreachable - device may have connectivity issues');
        } else if (e.toString().contains('Connection failed')) {
          print('🚫 Connection failed - server may be down or blocked');
        }
        
        // If this was the last backend, return error
        if (i == AppConfig.backendUrls.length - 1) {
          if (e.toString().contains('Failed host lookup') || 
              e.toString().contains('No address associated with hostname')) {
            return {
              'success': false,
              'message': 'DNS resolution failed.\n\nTry:\n• Switching WiFi networks\n• Using mobile data\n• Restarting your device',
            };
          }
          
          if (e.toString().contains('Network is unreachable')) {
            return {
              'success': false,
              'message': 'Network unreachable.\n\nPlease check:\n• Internet connection\n• VPN settings\n• Firewall settings',
            };
          }
          
          return {
            'success': false,
            'message': 'All servers unavailable.\n\nError: ${e.toString().split(':').first}',
          };
        }
        
        // Continue to next backend
        continue;
      }
    }
    
    return {
      'success': false,
      'message': 'Network error: Unable to connect to any server',
    };
  }
  
  Future<bool> _checkNetworkConnectivity() async {
    try {
      // Try to resolve a well-known domain
      final result = await http.get(
        Uri.parse('https://www.google.com'),
      ).timeout(const Duration(seconds: 5));
      
      return result.statusCode == 200;
    } catch (e) {
      print('🚫 Network connectivity check failed: $e');
      
      // Try HTTP as fallback
      try {
        final result = await http.get(
          Uri.parse('http://www.google.com'),
        ).timeout(const Duration(seconds: 5));
        
        return result.statusCode == 200 || result.statusCode == 301;
      } catch (e2) {
        print('🚫 HTTP fallback also failed: $e2');
        return false;
      }
    }
  }

  Future<Map<String, dynamic>> signup(String username, String email, String password) async {
    print('📝 Signup attempt for: $username ($email)');
    
    // Check network connectivity first
    bool hasNetwork = await _checkNetworkConnectivity();
    if (!hasNetwork) {
      return {
        'success': false,
        'message': 'No internet connection.\n\nPlease check:\n• WiFi is connected\n• Mobile data is enabled\n• Airplane mode is off',
      };
    }
    
    // Try each backend URL until one works
    for (int i = 0; i < AppConfig.backendUrls.length; i++) {
      final baseUrl = AppConfig.backendUrls[i];
      final url = '$baseUrl${AppConfig.signupEndpoint}';
      
      try {
        print('🌐 Trying backend ${i + 1}/${AppConfig.backendUrls.length}: $url');
        
        final response = await http.post(
          Uri.parse(url),
          headers: {
            'Content-Type': 'application/json',
          },
          body: jsonEncode({
            'username': username,
            'email': email,
            'password': password,
          }),
        ).timeout(AppConfig.timeout);

        print('📡 Response status: ${response.statusCode}');
        print('📄 Response body: ${response.body}');

        final data = jsonDecode(response.body);
        
        if (response.statusCode == 200 || response.statusCode == 201) {
          print('✅ Signup successful with backend ${i + 1}');
          return {
            'success': true,
            'token': data['token'],
            'user': data['user'],
          };
        } else {
          print('❌ Signup failed: ${data['message'] ?? data['error'] ?? 'Unknown error'}');
          return {
            'success': false,
            'message': data['message'] ?? data['error'] ?? 'Signup failed',
          };
        }
      } catch (e) {
        print('💥 Backend ${i + 1} failed: $e');
        
        // If this was the last backend, return error
        if (i == AppConfig.backendUrls.length - 1) {
          if (e.toString().contains('Failed host lookup') || 
              e.toString().contains('No address associated with hostname')) {
            return {
              'success': false,
              'message': 'Network connection failed.\nAll servers unreachable.\n\nTry switching to mobile data or a different WiFi network.',
            };
          }
          
          return {
            'success': false,
            'message': 'All servers unavailable. Please try again later.',
          };
        }
        
        // Continue to next backend
        continue;
      }
    }
    
    return {
      'success': false,
      'message': 'Network error: Unable to connect to any server',
    };
  }
}