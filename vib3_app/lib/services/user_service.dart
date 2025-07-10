import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';
import '../models/user_model.dart';

class UserService {
  // Get current user profile with stats
  static Future<User?> getCurrentUserProfile(String token) async {
    try {
      final response = await http.get(
        Uri.parse('${AppConfig.baseUrl}/api/auth/me'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['user'] != null) {
          final userData = data['user'];
          
          // Ensure we have the totalLikes field from server
          return User.fromJson({
            ...userData,
            'totalLikes': userData['totalLikes'] ?? 0,
          });
        }
      }
      return null;
    } catch (e) {
      print('Error getting current user profile: $e');
      return null;
    }
  }

  // Update user stats after certain actions
  static Future<void> updateUserStats(String token) async {
    try {
      // Fetch updated user data from server
      final user = await getCurrentUserProfile(token);
      if (user != null) {
        // The auth provider will be updated by the caller
        print('User stats fetched: followers=${user.followers}, following=${user.following}, totalLikes=${user.totalLikes}');
      }
    } catch (e) {
      print('Error updating user stats: $e');
    }
  }

  // Get user profile by ID (for viewing other users)
  static Future<User?> getUserProfile(String userId, String token) async {
    try {
      // For now, we'll use the videos endpoint to get user data
      // In the future, the backend should have a dedicated user profile endpoint
      final response = await http.get(
        Uri.parse('${AppConfig.baseUrl}/api/videos?userId=$userId'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['videos'] != null && data['videos'].isNotEmpty) {
          // Extract user data from the first video
          final firstVideo = data['videos'][0];
          if (firstVideo['user'] != null) {
            return User.fromJson(firstVideo['user']);
          }
        }
      }
      return null;
    } catch (e) {
      print('Error getting user profile: $e');
      return null;
    }
  }

  // Update profile (bio, display name, etc.)
  static Future<bool> updateProfile(String token, Map<String, dynamic> updates) async {
    try {
      // This endpoint needs to be implemented on the backend
      final response = await http.put(
        Uri.parse('${AppConfig.baseUrl}/api/user/profile'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode(updates),
      );

      return response.statusCode == 200;
    } catch (e) {
      print('Error updating profile: $e');
      return false;
    }
  }

  // Get user's total likes count
  static Future<int> getUserTotalLikes(String userId, String token) async {
    try {
      // The /api/auth/me endpoint already calculates totalLikes
      if (userId == 'current') {
        final user = await getCurrentUserProfile(token);
        return user?.totalLikes ?? 0;
      }
      
      // For other users, we'd need a dedicated endpoint
      return 0;
    } catch (e) {
      print('Error getting user total likes: $e');
      return 0;
    }
  }
}