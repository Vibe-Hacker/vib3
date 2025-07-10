import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';
import '../models/comment.dart';

enum CommentSort {
  newest,
  mostLiked,
  oldest,
}

class CommentService {
  static Future<List<Comment>> getVideoComments(
    String videoId, 
    String token, {
    CommentSort sortBy = CommentSort.newest,
    int offset = 0,
    int limit = 20,
  }) async {
    try {
      final queryParams = {
        'sort': sortBy.toString().split('.').last,
        'offset': offset.toString(),
        'limit': limit.toString(),
      };
      
      final uri = Uri.parse('${AppConfig.baseUrl}/api/videos/$videoId/comments')
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
        final List<dynamic> commentsJson = data['comments'] ?? data ?? [];
        return commentsJson.map((json) => Comment.fromJson(json)).toList();
      }

      return [];
    } catch (e) {
      print('Error getting comments: $e');
      return [];
    }
  }

  static Future<Comment?> postComment({
    required String videoId,
    required String text,
    required String token,
    String? parentId,
  }) async {
    try {
      final body = {
        'text': text,
      };
      
      if (parentId != null) {
        body['parentId'] = parentId;
      }
      
      final response = await http.post(
        Uri.parse('${AppConfig.baseUrl}/api/videos/$videoId/comments'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode(body),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = jsonDecode(response.body);
        return Comment.fromJson(data['comment'] ?? data);
      }

      return null;
    } catch (e) {
      print('Error posting comment: $e');
      return null;
    }
  }

  static Future<bool> likeComment(String commentId, String token) async {
    try {
      final response = await http.post(
        Uri.parse('${AppConfig.baseUrl}/api/comments/$commentId/like'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      return response.statusCode == 200;
    } catch (e) {
      print('Error liking comment: $e');
      return false;
    }
  }

  static Future<bool> deleteComment(String commentId, String token) async {
    try {
      final response = await http.delete(
        Uri.parse('${AppConfig.baseUrl}/api/comments/$commentId'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      return response.statusCode == 200;
    } catch (e) {
      print('Error deleting comment: $e');
      return false;
    }
  }

  static Future<Comment?> replyToComment(String commentId, String text, String token) async {
    try {
      final response = await http.post(
        Uri.parse('${AppConfig.baseUrl}/api/comments/$commentId/reply'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'text': text,
        }),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = jsonDecode(response.body);
        return Comment.fromJson(data['reply'] ?? data);
      }

      return null;
    } catch (e) {
      print('Error replying to comment: $e');
      return null;
    }
  }
}