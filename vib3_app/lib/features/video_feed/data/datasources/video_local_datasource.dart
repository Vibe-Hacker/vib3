import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/video_dto.dart';

/// Local data source for video operations
/// Handles caching and offline storage
abstract class VideoLocalDataSource {
  Future<void> cacheVideos(List<VideoDTO> videos, String key);
  Future<List<VideoDTO>> getCachedVideos(String key);
  Future<void> updateVideoLikeStatus(String videoId, bool isLiked);
  Future<void> clearCache();
}

class VideoLocalDataSourceImpl implements VideoLocalDataSource {
  final SharedPreferences _prefs;
  static const String _cachePrefix = 'video_cache_';
  static const Duration _cacheExpiry = Duration(minutes: 30);
  
  VideoLocalDataSourceImpl({required SharedPreferences prefs}) : _prefs = prefs;
  
  @override
  Future<void> cacheVideos(List<VideoDTO> videos, String key) async {
    try {
      final cacheKey = '$_cachePrefix$key';
      final cacheData = {
        'timestamp': DateTime.now().toIso8601String(),
        'videos': videos.map((video) => video.toJson()).toList(),
      };
      
      await _prefs.setString(cacheKey, jsonEncode(cacheData));
    } catch (e) {
      print('Error caching videos: $e');
    }
  }
  
  @override
  Future<List<VideoDTO>> getCachedVideos(String key) async {
    try {
      final cacheKey = '$_cachePrefix$key';
      final cachedString = _prefs.getString(cacheKey);
      
      if (cachedString == null) return [];
      
      final cacheData = jsonDecode(cachedString);
      final timestamp = DateTime.parse(cacheData['timestamp']);
      
      // Check if cache is expired
      if (DateTime.now().difference(timestamp) > _cacheExpiry) {
        await _prefs.remove(cacheKey);
        return [];
      }
      
      final List<dynamic> videosJson = cacheData['videos'];
      return videosJson.map((json) => VideoDTO.fromJson(json)).toList();
    } catch (e) {
      print('Error getting cached videos: $e');
      return [];
    }
  }
  
  @override
  Future<void> updateVideoLikeStatus(String videoId, bool isLiked) async {
    try {
      // Update like status in all cached video lists
      final keys = _prefs.getKeys().where((key) => key.startsWith(_cachePrefix));
      
      for (final key in keys) {
        final cachedString = _prefs.getString(key);
        if (cachedString == null) continue;
        
        final cacheData = jsonDecode(cachedString);
        final List<dynamic> videosJson = cacheData['videos'];
        
        // Find and update the video
        bool updated = false;
        for (int i = 0; i < videosJson.length; i++) {
          if (videosJson[i]['_id'] == videoId || videosJson[i]['id'] == videoId) {
            videosJson[i]['isLiked'] = isLiked;
            // Update like count
            final currentLikes = videosJson[i]['likeCount'] ?? videosJson[i]['likes'] ?? 0;
            videosJson[i]['likeCount'] = isLiked ? currentLikes + 1 : currentLikes - 1;
            videosJson[i]['likes'] = videosJson[i]['likeCount'];
            updated = true;
            break;
          }
        }
        
        if (updated) {
          cacheData['videos'] = videosJson;
          await _prefs.setString(key, jsonEncode(cacheData));
        }
      }
    } catch (e) {
      print('Error updating video like status: $e');
    }
  }
  
  @override
  Future<void> clearCache() async {
    try {
      final keys = _prefs.getKeys().where((key) => key.startsWith(_cachePrefix));
      for (final key in keys) {
        await _prefs.remove(key);
      }
    } catch (e) {
      print('Error clearing cache: $e');
    }
  }
}