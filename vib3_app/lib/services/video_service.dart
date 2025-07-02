import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';
import '../models/video.dart';

class VideoService {
  static Future<List<Video>> getAllVideos(String token) async {
    return getVideosPage(token, 0, 50); // Get first page with more videos
  }

  static Future<List<Video>> getVideosPage(String token, int page, int limit) async {
    final offset = page * limit;
    
    // Try different endpoints with various pagination parameters
    final endpoints = [
      // Standard pagination
      '${AppConfig.baseUrl}/api/videos?feed=foryou&page=$page&limit=$limit',
      '${AppConfig.baseUrl}/api/videos?page=$page&limit=$limit',
      '${AppConfig.baseUrl}/feed?page=$page&limit=$limit',
      
      // Offset-based pagination
      '${AppConfig.baseUrl}/api/videos?feed=foryou&offset=$offset&limit=$limit',
      '${AppConfig.baseUrl}/api/videos?offset=$offset&limit=$limit',
      '${AppConfig.baseUrl}/feed?offset=$offset&limit=$limit',
      
      // Skip-based pagination
      '${AppConfig.baseUrl}/api/videos?feed=foryou&skip=$offset&limit=$limit',
      '${AppConfig.baseUrl}/api/videos?skip=$offset&limit=$limit',
      
      // Different feed types with pagination
      '${AppConfig.baseUrl}/api/videos?feed=following&page=$page&limit=$limit', 
      '${AppConfig.baseUrl}/api/videos?feed=explore&page=$page&limit=$limit',
      '${AppConfig.baseUrl}/api/videos?feed=trending&page=$page&limit=$limit',
      
      // Alternative endpoints
      '${AppConfig.baseUrl}/videos?page=$page&limit=$limit',
      '${AppConfig.baseUrl}/api/feed?page=$page&limit=$limit',
      
      // Fallback without pagination for first page
      if (page == 0) ...[
        '${AppConfig.baseUrl}/api/videos?feed=foryou',
        '${AppConfig.baseUrl}/api/videos',
        '${AppConfig.baseUrl}/feed',
        '${AppConfig.baseUrl}/videos',
      ],
    ];
    
    return _fetchFromEndpoints(endpoints, token);
  }

  static Future<List<Video>> _fetchFromEndpoints(List<String> endpoints, String token) async {
    final endpoints_to_try = endpoints;
    
    String debugLog = '';
    
    for (final url in endpoints_to_try) {
      try {
        debugLog += 'Trying: $url\n';
        
        final headers = <String, String>{
          'Content-Type': 'application/json',
        };
        
        if (token != 'no-token') {
          headers['Authorization'] = 'Bearer $token';
        }
        
        final response = await http.get(
          Uri.parse(url),
          headers: headers,
        );

        debugLog += 'Status: ${response.statusCode}\n';
        debugLog += 'Response length: ${response.body.length}\n';
        debugLog += 'Response preview: ${response.body.substring(0, response.body.length > 200 ? 200 : response.body.length)}...\n';

        if (response.statusCode == 200) {
          try {
            final dynamic responseData = jsonDecode(response.body);
            
            List<dynamic> videosJson = [];
            
            if (responseData is Map<String, dynamic>) {
              if (responseData.containsKey('videos')) {
                videosJson = responseData['videos'] ?? [];
              }
            } else if (responseData is List) {
              videosJson = responseData;
            }
            
            debugLog += 'Raw API returned: ${videosJson.length} videos\n';
            
            if (videosJson.isNotEmpty) {
              final videos = videosJson.map((json) {
                try {
                  return Video.fromJson(json as Map<String, dynamic>);
                } catch (e) {
                  debugLog += 'Video parse error: $e\n';
                  return null;
                }
              }).where((video) => video != null).cast<Video>().toList();
              
              debugLog += 'Successfully parsed: ${videos.length} videos\n';
              if (videosJson.length != videos.length) {
                debugLog += 'WARNING: Some videos failed to parse!\n';
              }
              
              return videos;
            }
          } catch (e) {
            debugLog += 'Parse error: $e\n';
          }
        }
      } catch (e) {
        debugLog += 'Error: $e\n';
      }
    }
    
    throw Exception(debugLog);
  }

  static Future<List<Video>> getUserVideos(String userId, String token) async {
    // Try different endpoints that match the web version
    final endpoints = [
      '${AppConfig.baseUrl}/api/user/videos?userId=$userId',
      '${AppConfig.baseUrl}/api/user/videos',
      '${AppConfig.baseUrl}/api/videos/user/$userId',
      '${AppConfig.baseUrl}/api/videos?userId=$userId',
    ];
    
    String debugLog = 'getUserVideos Debug:\n';
    debugLog += 'UserId: $userId\n';
    
    for (final url in endpoints) {
      try {
        debugLog += 'Trying: $url\n';
        
        final response = await http.get(
          Uri.parse(url),
          headers: {
            'Authorization': 'Bearer $token',
            'Content-Type': 'application/json',
          },
        );

        debugLog += 'Status: ${response.statusCode}\n';
        debugLog += 'Response length: ${response.body.length}\n';
        debugLog += 'Response preview: ${response.body.substring(0, response.body.length > 200 ? 200 : response.body.length)}...\n';

        if (response.statusCode == 200) {
          try {
            final dynamic responseData = jsonDecode(response.body);
            
            List<dynamic> videosJson = [];
            
            if (responseData is Map<String, dynamic>) {
              if (responseData.containsKey('videos')) {
                videosJson = responseData['videos'] ?? [];
              } else if (responseData.containsKey('data')) {
                videosJson = responseData['data'] ?? [];
              }
            } else if (responseData is List) {
              videosJson = responseData;
            }
            
            debugLog += 'Found ${videosJson.length} videos\n';
            
            if (videosJson.isNotEmpty) {
              final videos = videosJson.map((json) {
                try {
                  return Video.fromJson(json as Map<String, dynamic>);
                } catch (e) {
                  debugLog += 'Video parse error: $e\n';
                  return null;
                }
              }).where((video) => video != null).cast<Video>().toList();
              
              debugLog += 'Successfully parsed: ${videos.length} videos\n';
              print(debugLog);
              return videos;
            }
          } catch (e) {
            debugLog += 'Parse error: $e\n';
          }
        }
      } catch (e) {
        debugLog += 'Error: $e\n';
      }
    }
    
    print(debugLog);
    return [];
  }

  static Future<bool> deleteVideo(String videoId, String token) async {
    try {
      final response = await http.delete(
        Uri.parse('${AppConfig.baseUrl}/api/videos/$videoId'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      return response.statusCode == 200;
    } catch (e) {
      print('Error deleting video: $e');
      return false;
    }
  }

  static Future<List<Video>> getLikedVideos(String userId, String token) async {
    // Try different endpoints that match the web version
    final endpoints = [
      '${AppConfig.baseUrl}/api/user/liked-videos?userId=$userId',
      '${AppConfig.baseUrl}/api/user/liked-videos',
      '${AppConfig.baseUrl}/api/videos/liked/$userId',
      '${AppConfig.baseUrl}/api/videos/liked?userId=$userId',
    ];
    
    String debugLog = 'getLikedVideos Debug:\n';
    debugLog += 'UserId: $userId\n';
    
    for (final url in endpoints) {
      try {
        debugLog += 'Trying: $url\n';
        
        final response = await http.get(
          Uri.parse(url),
          headers: {
            'Authorization': 'Bearer $token',
            'Content-Type': 'application/json',
          },
        );

        debugLog += 'Status: ${response.statusCode}\n';
        debugLog += 'Response length: ${response.body.length}\n';
        debugLog += 'Response preview: ${response.body.substring(0, response.body.length > 200 ? 200 : response.body.length)}...\n';

        if (response.statusCode == 200) {
          try {
            final dynamic responseData = jsonDecode(response.body);
            
            List<dynamic> videosJson = [];
            
            if (responseData is Map<String, dynamic>) {
              if (responseData.containsKey('videos')) {
                videosJson = responseData['videos'] ?? [];
              } else if (responseData.containsKey('data')) {
                videosJson = responseData['data'] ?? [];
              }
            } else if (responseData is List) {
              videosJson = responseData;
            }
            
            debugLog += 'Found ${videosJson.length} liked videos\n';
            
            if (videosJson.isNotEmpty) {
              final videos = videosJson.map((json) {
                try {
                  return Video.fromJson(json as Map<String, dynamic>);
                } catch (e) {
                  debugLog += 'Video parse error: $e\n';
                  return null;
                }
              }).where((video) => video != null).cast<Video>().toList();
              
              debugLog += 'Successfully parsed: ${videos.length} liked videos\n';
              print(debugLog);
              return videos;
            }
          } catch (e) {
            debugLog += 'Parse error: $e\n';
          }
        }
      } catch (e) {
        debugLog += 'Error: $e\n';
      }
    }
    
    print(debugLog);
    return [];
  }

  static String formatDuration(int seconds) {
    if (seconds < 60) {
      return '0:${seconds.toString().padLeft(2, '0')}';
    } else {
      int minutes = seconds ~/ 60;
      int remainingSeconds = seconds % 60;
      return '$minutes:${remainingSeconds.toString().padLeft(2, '0')}';
    }
  }

  static String formatViews(int views) {
    if (views < 1000) {
      return views.toString();
    } else if (views < 1000000) {
      double k = views / 1000;
      return '${k.toStringAsFixed(k.truncateToDouble() == k ? 0 : 1)}K';
    } else {
      double m = views / 1000000;
      return '${m.toStringAsFixed(m.truncateToDouble() == m ? 0 : 1)}M';
    }
  }

  static String formatLikes(int likes) {
    if (likes < 1000) {
      return likes.toString();
    } else if (likes < 1000000) {
      double k = likes / 1000;
      return '${k.toStringAsFixed(k.truncateToDouble() == k ? 0 : 1)}K';
    } else {
      double m = likes / 1000000;
      return '${m.toStringAsFixed(m.truncateToDouble() == m ? 0 : 1)}M';
    }
  }

  static Future<bool> likeVideo(String videoId, String token) async {
    try {
      final response = await http.post(
        Uri.parse('${AppConfig.baseUrl}/api/videos/$videoId/like'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      return response.statusCode == 200;
    } catch (e) {
      print('Error liking video: $e');
      return false;
    }
  }

  static Future<bool> unlikeVideo(String videoId, String token) async {
    try {
      final response = await http.delete(
        Uri.parse('${AppConfig.baseUrl}/api/videos/$videoId/like'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      return response.statusCode == 200;
    } catch (e) {
      print('Error unliking video: $e');
      return false;
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