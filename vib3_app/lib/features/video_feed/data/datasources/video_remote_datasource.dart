import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/video_dto.dart';
import '../../../../config/app_config.dart';
import '../../../../services/auth_service.dart';

/// Remote data source for video operations
/// Handles all API calls related to videos
abstract class VideoRemoteDataSource {
  Future<List<VideoDTO>> getForYouVideos({int page = 0, int limit = 20});
  Future<List<VideoDTO>> getFollowingVideos({int page = 0, int limit = 20});
  Future<List<VideoDTO>> getUserVideos(String userId);
  Future<VideoDTO?> getVideoById(String videoId);
  Future<bool> likeVideo(String videoId);
  Future<bool> unlikeVideo(String videoId);
  Future<int> getVideoLikes(String videoId);
  Future<void> incrementViewCount(String videoId);
  Future<void> trackWatchTime(String videoId, Duration watchTime);
}

class VideoRemoteDataSourceImpl implements VideoRemoteDataSource {
  final http.Client _httpClient;
  final AuthService _authService;
  
  VideoRemoteDataSourceImpl({
    http.Client? httpClient,
    AuthService? authService,
  }) : _httpClient = httpClient ?? http.Client(),
       _authService = authService ?? AuthService();
  
  Future<Map<String, String>> _getHeaders() async {
    final token = await _authService.getAuthToken();
    return {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }
  
  @override
  Future<List<VideoDTO>> getForYouVideos({int page = 0, int limit = 20}) async {
    try {
      final headers = await _getHeaders();
      final response = await _httpClient.get(
        Uri.parse('${AppConfig.baseUrl}/api/videos?limit=$limit&page=$page'),
        headers: headers,
      ).timeout(const Duration(seconds: 10));
      
      if (response.statusCode == 200) {
        // Check if response is HTML instead of JSON
        if (response.body.trim().startsWith('<') || response.body.contains('<!DOCTYPE')) {
          throw Exception('Backend returned HTML instead of JSON');
        }
        
        final data = jsonDecode(response.body);
        if (data['videos'] != null) {
          final List<dynamic> videosJson = data['videos'];
          return videosJson
              .map((json) => VideoDTO.fromJson(json))
              .where((video) => video.videoUrl.isNotEmpty)
              .take(limit)
              .toList();
        }
      }
      
      throw Exception('Failed to load videos: ${response.statusCode}');
    } catch (e) {
      print('Error fetching for you videos: $e');
      rethrow;
    }
  }
  
  @override
  Future<List<VideoDTO>> getFollowingVideos({int page = 0, int limit = 20}) async {
    try {
      final headers = await _getHeaders();
      final response = await _httpClient.get(
        Uri.parse('${AppConfig.baseUrl}/api/videos/following?limit=$limit&page=$page'),
        headers: headers,
      ).timeout(const Duration(seconds: 10));
      
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['videos'] != null) {
          final List<dynamic> videosJson = data['videos'];
          return videosJson
              .map((json) => VideoDTO.fromJson(json))
              .where((video) => video.videoUrl.isNotEmpty)
              .take(limit)
              .toList();
        }
      }
      
      // Fallback to for you videos if following endpoint fails
      print('Following endpoint failed, falling back to for you videos');
      return getForYouVideos(page: page, limit: limit);
    } catch (e) {
      print('Error fetching following videos: $e');
      // Fallback to for you videos
      return getForYouVideos(page: page, limit: limit);
    }
  }
  
  @override
  Future<List<VideoDTO>> getUserVideos(String userId) async {
    try {
      final headers = await _getHeaders();
      final response = await _httpClient.get(
        Uri.parse('${AppConfig.baseUrl}/api/users/$userId/videos'),
        headers: headers,
      ).timeout(const Duration(seconds: 10));
      
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['videos'] != null) {
          final List<dynamic> videosJson = data['videos'];
          return videosJson
              .map((json) => VideoDTO.fromJson(json))
              .where((video) => video.videoUrl.isNotEmpty)
              .toList();
        }
      }
      
      throw Exception('Failed to load user videos: ${response.statusCode}');
    } catch (e) {
      print('Error fetching user videos: $e');
      return [];
    }
  }
  
  @override
  Future<VideoDTO?> getVideoById(String videoId) async {
    try {
      final headers = await _getHeaders();
      final response = await _httpClient.get(
        Uri.parse('${AppConfig.baseUrl}/api/videos/$videoId'),
        headers: headers,
      ).timeout(const Duration(seconds: 10));
      
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return VideoDTO.fromJson(data);
      }
      
      return null;
    } catch (e) {
      print('Error fetching video by id: $e');
      return null;
    }
  }
  
  @override
  Future<bool> likeVideo(String videoId) async {
    try {
      final headers = await _getHeaders();
      final response = await _httpClient.post(
        Uri.parse('${AppConfig.baseUrl}/api/videos/$videoId/like'),
        headers: headers,
      ).timeout(const Duration(seconds: 10));
      
      return response.statusCode == 200;
    } catch (e) {
      print('Error liking video: $e');
      return false;
    }
  }
  
  @override
  Future<bool> unlikeVideo(String videoId) async {
    try {
      final headers = await _getHeaders();
      final response = await _httpClient.delete(
        Uri.parse('${AppConfig.baseUrl}/api/videos/$videoId/like'),
        headers: headers,
      ).timeout(const Duration(seconds: 10));
      
      return response.statusCode == 200;
    } catch (e) {
      print('Error unliking video: $e');
      return false;
    }
  }
  
  @override
  Future<int> getVideoLikes(String videoId) async {
    try {
      final headers = await _getHeaders();
      final response = await _httpClient.get(
        Uri.parse('${AppConfig.baseUrl}/api/videos/$videoId/likes'),
        headers: headers,
      ).timeout(const Duration(seconds: 10));
      
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['count'] ?? 0;
      }
      
      return 0;
    } catch (e) {
      print('Error getting video likes: $e');
      return 0;
    }
  }
  
  @override
  Future<void> incrementViewCount(String videoId) async {
    try {
      final headers = await _getHeaders();
      await _httpClient.post(
        Uri.parse('${AppConfig.baseUrl}/api/videos/$videoId/view'),
        headers: headers,
      ).timeout(const Duration(seconds: 5));
    } catch (e) {
      print('Error incrementing view count: $e');
    }
  }
  
  @override
  Future<void> trackWatchTime(String videoId, Duration watchTime) async {
    try {
      final headers = await _getHeaders();
      await _httpClient.post(
        Uri.parse('${AppConfig.baseUrl}/api/videos/$videoId/watch-time'),
        headers: headers,
        body: jsonEncode({
          'watchTimeSeconds': watchTime.inSeconds,
        }),
      ).timeout(const Duration(seconds: 5));
    } catch (e) {
      print('Error tracking watch time: $e');
    }
  }
}