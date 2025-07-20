import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'api_adapter.dart';
import '../models/video.dart';

/// Updated VideoService that supports both monolith and microservices
class VideoServiceV2 {
  static final VideoServiceV2 _instance = VideoServiceV2._internal();
  factory VideoServiceV2() => _instance;
  VideoServiceV2._internal();
  
  final ApiAdapter _api = ApiAdapter();
  
  // Cache for video data
  final Map<String, Video> _videoCache = {};
  List<Video>? _feedCache;
  DateTime? _feedCacheTime;
  
  // Get video feed
  Future<List<Video>> getVideoFeed({
    int page = 1,
    int limit = 10,
    bool forceRefresh = false,
  }) async {
    try {
      // Return cached feed if valid
      if (!forceRefresh && 
          _feedCache != null && 
          _feedCacheTime != null &&
          DateTime.now().difference(_feedCacheTime!) < Duration(minutes: 5)) {
        return _feedCache!;
      }
      
      final response = await _api.get('videoFeed', queryParams: {
        'page': page,
        'limit': limit,
      });
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final List<dynamic> videosJson = data['videos'] ?? data['data'] ?? data;
        
        final videos = videosJson.map((json) => Video.fromJson(json)).toList();
        
        // Update cache
        _feedCache = videos;
        _feedCacheTime = DateTime.now();
        
        // Cache individual videos
        for (final video in videos) {
          _videoCache[video.id] = video;
        }
        
        return videos;
      }
      
      throw Exception('Failed to load videos');
      
    } catch (e) {
      print('❌ Error loading video feed: $e');
      // Return cached data if available
      return _feedCache ?? [];
    }
  }
  
  // Get video by ID
  Future<Video?> getVideo(String videoId) async {
    try {
      // Check cache first
      if (_videoCache.containsKey(videoId)) {
        return _videoCache[videoId];
      }
      
      final response = await _api.get('videoDetail', pathParams: {
        'id': videoId,
      });
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final video = Video.fromJson(data['video'] ?? data);
        
        // Cache the video
        _videoCache[videoId] = video;
        
        return video;
      }
      
    } catch (e) {
      print('❌ Error loading video $videoId: $e');
    }
    
    return null;
  }
  
  // Upload video
  Future<Map<String, dynamic>> uploadVideo({
    required String filePath,
    required String title,
    String? description,
    List<String>? tags,
    String? thumbnail,
  }) async {
    try {
      final fields = {
        'title': title,
        if (description != null) 'description': description,
        if (tags != null) 'tags': tags.join(','),
      };
      
      final response = await _api.uploadFile(
        'videoUpload',
        filePath,
        fields: fields,
      );
      
      final responseBody = await response.stream.bytesToString();
      
      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = json.decode(responseBody);
        
        return {
          'success': true,
          'message': 'Video uploaded successfully',
          'video': data['video'] ?? data,
        };
      }
      
      return {
        'success': false,
        'message': 'Upload failed',
      };
      
    } catch (e) {
      print('❌ Upload error: $e');
      return {
        'success': false,
        'message': 'Upload error: $e',
      };
    }
  }
  
  // Like/Unlike video
  Future<bool> toggleLike(String videoId) async {
    try {
      final response = await _api.post('videoLike', pathParams: {
        'id': videoId,
      });
      
      if (response.statusCode == 200) {
        // Update cached video if exists
        if (_videoCache.containsKey(videoId)) {
          final data = json.decode(response.body);
          final isLiked = data['liked'] ?? !_videoCache[videoId]!.isLiked;
          _videoCache[videoId] = _videoCache[videoId]!.copyWith(
            isLiked: isLiked,
            likes: _videoCache[videoId]!.likes + (isLiked ? 1 : -1),
          );
        }
        
        return true;
      }
      
    } catch (e) {
      print('❌ Like error: $e');
    }
    
    return false;
  }
  
  // Record video view
  Future<void> recordView(String videoId) async {
    try {
      await _api.post('videoView', pathParams: {
        'id': videoId,
      });
      
      // Update cached video view count
      if (_videoCache.containsKey(videoId)) {
        _videoCache[videoId] = _videoCache[videoId]!.copyWith(
          views: _videoCache[videoId]!.views + 1,
        );
      }
      
    } catch (e) {
      print('❌ View tracking error: $e');
    }
  }
  
  // Share video
  Future<void> shareVideo(String videoId) async {
    try {
      await _api.post('videoShare', pathParams: {
        'id': videoId,
      });
      
      // Update cached video share count
      if (_videoCache.containsKey(videoId)) {
        _videoCache[videoId] = _videoCache[videoId]!.copyWith(
          shares: _videoCache[videoId]!.shares + 1,
        );
      }
      
    } catch (e) {
      print('❌ Share tracking error: $e');
    }
  }
  
  // Delete video
  Future<bool> deleteVideo(String videoId) async {
    try {
      final response = await _api.delete('videoDelete', pathParams: {
        'id': videoId,
      });
      
      if (response.statusCode == 200) {
        // Remove from cache
        _videoCache.remove(videoId);
        _feedCache?.removeWhere((v) => v.id == videoId);
        
        return true;
      }
      
    } catch (e) {
      print('❌ Delete error: $e');
    }
    
    return false;
  }
  
  // Search videos
  Future<List<Video>> searchVideos(String query) async {
    try {
      final response = await _api.get('videoSearch', queryParams: {
        'q': query,
      });
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final List<dynamic> videosJson = data['videos'] ?? data['results'] ?? data;
        
        return videosJson.map((json) => Video.fromJson(json)).toList();
      }
      
    } catch (e) {
      print('❌ Search error: $e');
    }
    
    return [];
  }
  
  // Get trending videos
  Future<List<Video>> getTrendingVideos() async {
    try {
      final response = await _api.get('videoTrending');
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final List<dynamic> videosJson = data['videos'] ?? data;
        
        return videosJson.map((json) => Video.fromJson(json)).toList();
      }
      
    } catch (e) {
      print('❌ Trending error: $e');
    }
    
    return [];
  }
  
  // Get user's videos
  Future<List<Video>> getUserVideos(String userId) async {
    try {
      final response = await _api.get('videoByUser', pathParams: {
        'userId': userId,
      });
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final List<dynamic> videosJson = data['videos'] ?? data;
        
        return videosJson.map((json) => Video.fromJson(json)).toList();
      }
      
    } catch (e) {
      print('❌ User videos error: $e');
    }
    
    return [];
  }
  
  // Get video qualities/streams
  Future<Map<String, String>> getVideoQualities(String videoId) async {
    try {
      final response = await _api.get('videoQualities', pathParams: {
        'id': videoId,
      });
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return Map<String, String>.from(data['qualities'] ?? {});
      }
      
    } catch (e) {
      print('❌ Qualities error: $e');
    }
    
    return {};
  }
  
  // Clear cache
  void clearCache() {
    _videoCache.clear();
    _feedCache = null;
    _feedCacheTime = null;
  }
}

// Extension to add copyWith method to Video model
extension VideoExtension on Video {
  Video copyWith({
    String? id,
    String? title,
    String? description,
    String? url,
    String? thumbnail,
    String? userId,
    String? username,
    int? likes,
    int? views,
    int? shares,
    bool? isLiked,
    DateTime? createdAt,
  }) {
    return Video(
      id: id ?? this.id,
      title: title ?? this.title,
      description: description ?? this.description,
      url: url ?? this.url,
      thumbnail: thumbnail ?? this.thumbnail,
      userId: userId ?? this.userId,
      username: username ?? this.username,
      likes: likes ?? this.likes,
      views: views ?? this.views,
      shares: shares ?? this.shares,
      isLiked: isLiked ?? this.isLiked,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}