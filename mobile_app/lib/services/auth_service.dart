import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';
import '../models/user_model.dart';

class AuthService {
  Future<Map<String, dynamic>> login(String email, String password) async {
    try {
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

      final data = jsonDecode(response.body);
      
      if (response.statusCode == 200) {
        return {
          'success': true,
          'token': data['token'],
          'user': data['user'],
        };
      } else {
        return {
          'success': false,
          'message': data['message'] ?? data['error'] ?? 'Login failed',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'Network error: $e',
      };
    }
  }

  Future<Map<String, dynamic>> signup(String username, String email, String password) async {
    try {
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

      final data = jsonDecode(response.body);
      
      if (response.statusCode == 200 || response.statusCode == 201) {
        return {
          'success': true,
          'token': data['token'],
          'user': data['user'],
        };
      } else {
        return {
          'success': false,
          'message': data['message'] ?? 'Signup failed',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'Network error: $e',
      };
    }
  }

  Future<User> getProfile(String token) async {
    final response = await http.get(
      Uri.parse('${AppConfig.baseUrl}${AppConfig.profileEndpoint}'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return User.fromJson(data['user']);
    } else {
      throw Exception('Failed to load profile');
    }
  }

  Future<void> updateProfile(String token, Map<String, dynamic> updates) async {
    await http.put(
      Uri.parse('${AppConfig.baseUrl}${AppConfig.profileEndpoint}'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: jsonEncode(updates),
    );
  }
}