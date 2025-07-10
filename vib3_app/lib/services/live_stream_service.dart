import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';
import '../models/live_stream.dart';

class LiveStreamService {
  // Get all active live streams
  static Future<List<LiveStream>> getActiveStreams({
    required String token,
    String? categoryId,
    int offset = 0,
    int limit = 20,
  }) async {
    try {
      final queryParams = {
        'offset': offset.toString(),
        'limit': limit.toString(),
      };
      
      if (categoryId != null) {
        queryParams['categoryId'] = categoryId;
      }
      
      final uri = Uri.parse('${AppConfig.baseUrl}/api/live/streams')
          .replace(queryParameters: queryParams);
      
      final response = await http.get(
        uri,
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );
      
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final List<dynamic> streamsJson = data['streams'] ?? [];
        return streamsJson.map((json) => LiveStream.fromJson(json)).toList();
      }
      
      return [];
    } catch (e) {
      print('Error getting live streams: $e');
      return [];
    }
  }
  
  // Get following live streams
  static Future<List<LiveStream>> getFollowingStreams({
    required String token,
    int offset = 0,
    int limit = 20,
  }) async {
    try {
      final queryParams = {
        'offset': offset.toString(),
        'limit': limit.toString(),
      };
      
      final uri = Uri.parse('${AppConfig.baseUrl}/api/live/following')
          .replace(queryParameters: queryParams);
      
      final response = await http.get(
        uri,
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );
      
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final List<dynamic> streamsJson = data['streams'] ?? [];
        return streamsJson.map((json) => LiveStream.fromJson(json)).toList();
      }
      
      return [];
    } catch (e) {
      print('Error getting following streams: $e');
      return [];
    }
  }
  
  // Start a live stream
  static Future<LiveStream?> startStream({
    required String title,
    required String token,
    String? description,
    List<String>? tags,
    String? categoryId,
    bool isFollowersOnly = false,
    bool commentsEnabled = true,
    bool giftsEnabled = true,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('${AppConfig.baseUrl}/api/live/start'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'title': title,
          'description': description,
          'tags': tags ?? [],
          'categoryId': categoryId,
          'isFollowersOnly': isFollowersOnly,
          'commentsEnabled': commentsEnabled,
          'giftsEnabled': giftsEnabled,
        }),
      );
      
      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = jsonDecode(response.body);
        return LiveStream.fromJson(data['stream'] ?? data);
      }
      
      return null;
    } catch (e) {
      print('Error starting stream: $e');
      return null;
    }
  }
  
  // End a live stream
  static Future<bool> endStream({
    required String streamId,
    required String token,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('${AppConfig.baseUrl}/api/live/$streamId/end'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );
      
      return response.statusCode == 200;
    } catch (e) {
      print('Error ending stream: $e');
      return false;
    }
  }
  
  // Join a live stream
  static Future<Map<String, dynamic>?> joinStream({
    required String streamId,
    required String token,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('${AppConfig.baseUrl}/api/live/$streamId/join'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );
      
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      
      return null;
    } catch (e) {
      print('Error joining stream: $e');
      return null;
    }
  }
  
  // Leave a live stream
  static Future<bool> leaveStream({
    required String streamId,
    required String token,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('${AppConfig.baseUrl}/api/live/$streamId/leave'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );
      
      return response.statusCode == 200;
    } catch (e) {
      print('Error leaving stream: $e');
      return false;
    }
  }
  
  // Send a comment in live stream
  static Future<bool> sendComment({
    required String streamId,
    required String comment,
    required String token,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('${AppConfig.baseUrl}/api/live/$streamId/comment'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'comment': comment,
        }),
      );
      
      return response.statusCode == 200;
    } catch (e) {
      print('Error sending comment: $e');
      return false;
    }
  }
  
  // Send a gift in live stream
  static Future<bool> sendGift({
    required String streamId,
    required String giftType,
    required int quantity,
    required String token,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('${AppConfig.baseUrl}/api/live/$streamId/gift'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'giftType': giftType,
          'quantity': quantity,
        }),
      );
      
      return response.statusCode == 200;
    } catch (e) {
      print('Error sending gift: $e');
      return false;
    }
  }
  
  // Get stream categories
  static Future<List<Map<String, dynamic>>> getCategories(String token) async {
    try {
      final response = await http.get(
        Uri.parse('${AppConfig.baseUrl}/api/live/categories'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );
      
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return List<Map<String, dynamic>>.from(data['categories'] ?? []);
      }
      
      return [];
    } catch (e) {
      print('Error getting categories: $e');
      return [];
    }
  }
  
  // Get stream statistics
  static Future<Map<String, dynamic>?> getStreamStats({
    required String streamId,
    required String token,
  }) async {
    try {
      final response = await http.get(
        Uri.parse('${AppConfig.baseUrl}/api/live/$streamId/stats'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );
      
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      
      return null;
    } catch (e) {
      print('Error getting stream stats: $e');
      return null;
    }
  }
}