import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';

class AuthService {
  Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      print('🔐 Login attempt for: $email');
      print('🌐 Connecting to: ${AppConfig.baseUrl}${AppConfig.loginEndpoint}');
      
      final response = await http.post(
        Uri.parse('${AppConfig.baseUrl}${AppConfig.loginEndpoint}'),
        headers: {
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'email': email,
          'password': password,
        }),
      );

      print('📡 Response status: ${response.statusCode}');
      print('📄 Response body: ${response.body}');

      final data = jsonDecode(response.body);
      
      if (response.statusCode == 200) {
        print('✅ Login successful');
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
      print('💥 Login error: $e');
      return {
        'success': false,
        'message': 'Network error: $e',
      };
    }
  }

  Future<Map<String, dynamic>> signup(String username, String email, String password) async {
    try {
      print('📝 Signup attempt for: $username ($email)');
      print('🌐 Connecting to: ${AppConfig.baseUrl}${AppConfig.signupEndpoint}');
      
      final response = await http.post(
        Uri.parse('${AppConfig.baseUrl}${AppConfig.signupEndpoint}'),
        headers: {
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'username': username,
          'email': email,
          'password': password,
        }),
      );

      print('📡 Response status: ${response.statusCode}');
      print('📄 Response body: ${response.body}');

      final data = jsonDecode(response.body);
      
      if (response.statusCode == 200 || response.statusCode == 201) {
        print('✅ Signup successful');
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
      print('💥 Signup error: $e');
      return {
        'success': false,
        'message': 'Network error: $e',
      };
    }
  }
}