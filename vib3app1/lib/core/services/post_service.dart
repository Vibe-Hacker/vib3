import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/post_model.dart';
import '../config/api_config.dart';
import 'api_service.dart';
import 'storage_service.dart';

class PostService {
  final ApiService _apiService = ApiService();
  final StorageService _storageService = StorageService();
  
  Future<Post> createPost({
    required String userId,
    required String content,
    required String mediaUrl,
    required String mediaType,
    required double aspectRatio,
    required String thumbnailUrl,
    required List<String> tags,
    required String visibility,
    required bool allowComments,
    required bool allowDuet,
    required bool allowStitch,
    required bool allowDownload,
  }) async {
    try {
      final token = await StorageService.getAuthToken();
      if (token == null) throw Exception('Not authenticated');
      
      // Create PostMedia object
      final media = PostMedia(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        type: mediaType == 'video' ? MediaType.video : MediaType.image,
        url: mediaUrl,
        thumbnailUrl: thumbnailUrl,
        aspectRatio: aspectRatio,
      );
      
      // Determine PostType based on mediaType
      final postType = mediaType == 'video' ? PostType.video : PostType.photo;
      
      final requestBody = {
        'userId': userId,
        'type': postType.toString().split('.').last,
        'caption': content,
        'media': [media.toJson()],
        'tags': tags,
        'commentsEnabled': allowComments,
        'sharingEnabled': allowDuet || allowStitch || allowDownload,
      };
      
      final response = await _apiService.post(
        '/posts',
        data: requestBody,
      );
      
      return Post.fromJson(response);
    } catch (e) {
      throw Exception('Failed to create post: $e');
    }
  }
  
  Future<List<Post>> getUserPosts(String userId) async {
    try {
      final response = await _apiService.get('/posts/user/$userId');
      return (response as List).map((json) => Post.fromJson(json)).toList();
    } catch (e) {
      throw Exception('Failed to fetch user posts: $e');
    }
  }
  
  Future<Post> getPost(String postId) async {
    try {
      final response = await _apiService.get('/posts/$postId');
      return Post.fromJson(response);
    } catch (e) {
      throw Exception('Failed to fetch post: $e');
    }
  }
  
  Future<void> deletePost(String postId) async {
    try {
      await _apiService.delete('/posts/$postId');
    } catch (e) {
      throw Exception('Failed to delete post: $e');
    }
  }
  
  Future<Post> likePost(String postId) async {
    try {
      final response = await _apiService.post('/posts/$postId/like');
      return Post.fromJson(response);
    } catch (e) {
      throw Exception('Failed to like post: $e');
    }
  }
  
  Future<Post> unlikePost(String postId) async {
    try {
      final response = await _apiService.delete('/posts/$postId/like');
      return Post.fromJson(response);
    } catch (e) {
      throw Exception('Failed to unlike post: $e');
    }
  }
}