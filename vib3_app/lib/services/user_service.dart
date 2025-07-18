import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';
import '../models/user_model.dart';
import 'video_service.dart';

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
      print('👥 UserService: Following user: $userId');
      final response = await http.post(
        Uri.parse('${AppConfig.baseUrl}/api/users/$userId/follow'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );
      
      print('📡 UserService: Follow response status: ${response.statusCode}');
      print('📄 UserService: Follow response body: ${response.body}');
      
      if (response.statusCode == 200) {
        print('✅ UserService: Successfully followed user: $userId');
        // Clear the cache to force refresh of following lists
        VideoService.clearFollowingCache();
        return true;
      }
      
      print('⚠️ UserService: Failed to follow user, status: ${response.statusCode}');
      return false;
    } catch (e) {
      print('❌ UserService: Error following user: $e');
      return false;
    }
  }
  
  static Future<bool> unfollowUser(String userId, String token) async {
    try {
      print('👥 UserService: Unfollowing user: $userId');
      final response = await http.delete(
        Uri.parse('${AppConfig.baseUrl}/api/users/$userId/follow'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );
      
      print('📡 UserService: Unfollow response status: ${response.statusCode}');
      print('📄 UserService: Unfollow response body: ${response.body}');
      
      if (response.statusCode == 200) {
        print('✅ UserService: Successfully unfollowed user: $userId');
        // Clear the cache to force refresh of following lists
        VideoService.clearFollowingCache();
        return true;
      }
      
      print('⚠️ UserService: Failed to unfollow user, status: ${response.statusCode}');
      return false;
    } catch (e) {
      print('❌ UserService: Error unfollowing user: $e');
      return false;
    }
  }
  
  static Future<List<String>> getUserFollowing(String userId, String token) async {
    try {
      print('🔍 UserService: Getting following list for user: $userId');
      final response = await http.get(
        Uri.parse('${AppConfig.baseUrl}/api/users/$userId/following'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );
      
      print('📡 UserService: Following response status: ${response.statusCode}');
      print('📄 UserService: Following response body: ${response.body}');
      
      if (response.statusCode == 200) {
        // Check if response is HTML (error case)
        if (response.body.trim().startsWith('<!DOCTYPE') || response.body.trim().startsWith('<html')) {
          print('⚠️ UserService: Received HTML instead of JSON, endpoint not available');
          return []; // Return empty list to continue app functionality
        }
        
        try {
          final data = jsonDecode(response.body);
          final List<dynamic> following = data['following'] ?? [];
          
          print('👥 UserService: Raw following data: $following');
          print('👥 UserService: Following count: ${following.length}');
          
          final followingIds = following.map((item) {
            if (item is String) {
              return item;
            } else if (item is Map<String, dynamic>) {
              return item['_id'] ?? item['id'] ?? '';
            }
            return '';
          }).where((id) => id.isNotEmpty).toList().cast<String>();
          
          print('✅ UserService: Processed following IDs: $followingIds');
          return followingIds;
        } catch (e) {
          print('⚠️ UserService: Error parsing following response: $e');
          return []; // Return empty list instead of throwing
        }
      }
      
      print('⚠️ UserService: Failed to get following list, status: ${response.statusCode}');
      return [];
    } catch (e) {
      print('❌ UserService: Error getting user following list: $e');
      return [];
    }
  }
  
  static Future<List<String>> getUserFollowers(String userId, String token) async {
    try {
      final response = await http.get(
        Uri.parse('${AppConfig.baseUrl}/api/users/$userId/followers'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );
      
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final List<dynamic> followers = data['followers'] ?? [];
        return followers.map((item) {
          if (item is String) {
            return item;
          } else if (item is Map<String, dynamic>) {
            return item['_id'] ?? item['id'] ?? '';
          }
          return '';
        }).where((id) => id.isNotEmpty).toList().cast<String>();
      }
      
      return [];
    } catch (e) {
      print('Error getting user followers list: $e');
      return [];
    }
  }
  
  static Future<User?> getCurrentUserProfile(String token) async {
    try {
      print('🔍 UserService: Getting user profile from backend');
      final response = await http.get(
        Uri.parse('${AppConfig.baseUrl}${AppConfig.profileEndpoint}'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );
      
      print('📡 UserService: Response status: ${response.statusCode}');
      print('📄 UserService: Response body: ${response.body}');
      
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        print('✅ UserService: Parsed user data: $data');
        
        // Check if the response has a nested 'user' object
        final userData = data['user'] ?? data;
        
        return User.fromJson(userData);
      }
      
      return null;
    } catch (e) {
      print('❌ UserService: Error getting current user profile: $e');
      return null;
    }
  }
}