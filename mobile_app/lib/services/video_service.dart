import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/app_config.dart';
import '../models/video_model.dart';

class VideoService {
  Future<String?> _getAuthToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('auth_token');
  }

  Future<Map<String, dynamic>> getVideos({int page = 1, int limit = 20}) async {
    try {
      final token = await _getAuthToken();
      final response = await http.get(
        Uri.parse('${AppConfig.baseUrl}${AppConfig.videosEndpoint}?page=$page&limit=$limit'),
        headers: {
          'Content-Type': 'application/json',
          if (token != null) 'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final videos = (data['videos'] as List)
            .map((video) => Video.fromJson(video))
            .toList();
        
        return {
          'videos': videos,
          'hasMore': data['hasMore'] ?? false,
        };
      } else {
        throw Exception('Failed to load videos');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  Future<void> toggleLike(String videoId) async {
    final token = await _getAuthToken();
    if (token == null) throw Exception('Not authenticated');

    await http.post(
      Uri.parse('${AppConfig.baseUrl}${AppConfig.likeEndpoint}'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({'videoId': videoId}),
    );
  }

  Future<void> shareVideo(String videoId) async {
    final token = await _getAuthToken();
    if (token == null) return;

    await http.post(
      Uri.parse('${AppConfig.baseUrl}/api/videos/share'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({'videoId': videoId}),
    );
  }

  Future<void> toggleFollow(String userId) async {
    final token = await _getAuthToken();
    if (token == null) throw Exception('Not authenticated');

    await http.post(
      Uri.parse('${AppConfig.baseUrl}${AppConfig.followEndpoint}'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({'userId': userId}),
    );
  }

  Future<Map<String, dynamic>> uploadVideo(
    File videoFile, 
    String description, 
    List<String> tags
  ) async {
    try {
      final token = await _getAuthToken();
      if (token == null) throw Exception('Not authenticated');

      var request = http.MultipartRequest(
        'POST',
        Uri.parse('${AppConfig.baseUrl}${AppConfig.uploadEndpoint}'),
      );

      request.headers['Authorization'] = 'Bearer $token';
      request.fields['description'] = description;
      request.fields['tags'] = jsonEncode(tags);

      request.files.add(
        await http.MultipartFile.fromPath('video', videoFile.path),
      );

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = jsonDecode(response.body);
        return {
          'success': true,
          'video': data['video'],
        };
      } else {
        final data = jsonDecode(response.body);
        return {
          'success': false,
          'message': data['message'] ?? 'Upload failed',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'Upload error: $e',
      };
    }
  }

  Future<List<Map<String, dynamic>>> getComments(String videoId) async {
    final token = await _getAuthToken();
    final response = await http.get(
      Uri.parse('${AppConfig.baseUrl}/api/videos/$videoId/comments'),
      headers: {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return List<Map<String, dynamic>>.from(data['comments']);
    } else {
      throw Exception('Failed to load comments');
    }
  }

  Future<void> addComment(String videoId, String comment) async {
    final token = await _getAuthToken();
    if (token == null) throw Exception('Not authenticated');

    await http.post(
      Uri.parse('${AppConfig.baseUrl}${AppConfig.commentEndpoint}'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'videoId': videoId,
        'comment': comment,
      }),
    );
  }
}