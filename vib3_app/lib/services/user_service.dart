import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';
import '../models/user.dart';

class UserService {
  static Future<List<User>> searchUsers(String query, String token) async {
    try {
      if (query.isEmpty) return [];
      
      final response = await http.get(
        Uri.parse('${AppConfig.baseUrl}/api/users/search?q=${Uri.encodeComponent(query)}'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );
      
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final List<dynamic> usersJson = data['users'] ?? data ?? [];
        return usersJson.map((json) => User.fromJson(json)).toList();
      }
      
      return [];
    } catch (e) {
      print('Error searching users: $e');
      return [];
    }
  }
  
  static Future<User?> getUserById(String userId, String token) async {
    try {
      final response = await http.get(
        Uri.parse('${AppConfig.baseUrl}/api/users/$userId'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );
      
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return User.fromJson(data);
      }
      
      return null;
    } catch (e) {
      print('Error getting user: $e');
      return null;
    }
  }
  
  static Future<bool> followUser(String userId, String token) async {
    try {
      final response = await http.post(
        Uri.parse('${AppConfig.baseUrl}/api/users/$userId/follow'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );
      
      return response.statusCode == 200;
    } catch (e) {
      print('Error following user: $e');
      return false;
    }
  }
  
  static Future<bool> unfollowUser(String userId, String token) async {
    try {
      final response = await http.delete(
        Uri.parse('${AppConfig.baseUrl}/api/users/$userId/follow'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );
      
      return response.statusCode == 200;
    } catch (e) {
      print('Error unfollowing user: $e');
      return false;
    }
  }
}