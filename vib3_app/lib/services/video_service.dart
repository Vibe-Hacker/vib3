import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';
import '../models/video.dart';

class VideoService {
  static Future<List<Video>> getAllVideos(String token) async {
    // Use the EXACT same endpoint as the working web version
    return await _fetchAllVideosFromFeed(token);
  }
  
  static Future<List<Video>> _fetchAllVideosFromFeed(String token) async {
    List<Video> allVideos = [];
    
    // Try multiple endpoints that might bypass the server-side limit
    final allVideoEndpoints = [
      // Try with very high limit to force all videos
      '${AppConfig.baseUrl}/feed?limit=1000',
      '${AppConfig.baseUrl}/api/videos?limit=1000',
      '${AppConfig.baseUrl}/feed?limit=500',
      '${AppConfig.baseUrl}/api/videos?limit=500',
      // Try without limit parameter
      '${AppConfig.baseUrl}/feed',
      '${AppConfig.baseUrl}/api/videos',
      // Try all videos endpoint
      '${AppConfig.baseUrl}/api/videos/all',
      '${AppConfig.baseUrl}/feed/all',
    ];
    
    final timestamp = DateTime.now().millisecondsSinceEpoch;
    
    for (final baseUrl in allVideoEndpoints) {
      try {
        final url = '$baseUrl${baseUrl.contains('?') ? '&' : '?'}_t=$timestamp';
        
        print('🔍 TESTING ENDPOINT: $url');
        
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

        print('📊 ENDPOINT RESULT: ${response.statusCode} - ${response.body.length} chars');
        
        if (response.statusCode == 200) {
          final dynamic responseData = jsonDecode(response.body);
          
          List<dynamic> videosJson = [];
          
          if (responseData is Map<String, dynamic>) {
            print('📦 Response type: Object with keys: ${responseData.keys.join(', ')}');
            if (responseData.containsKey('videos')) {
              videosJson = responseData['videos'] ?? [];
            } else if (responseData.containsKey('data')) {
              videosJson = responseData['data'] ?? [];
            }
          } else if (responseData is List) {
            print('📦 Response type: Direct array');
            videosJson = responseData;
          }
          
          print('🎬 ENDPOINT FOUND: ${videosJson.length} videos');
          
          if (videosJson.length > 8) { // Only use if we get more than the problematic 8
            final allFetchedVideos = videosJson.map((json) {
              try {
                return Video.fromJson(json as Map<String, dynamic>);
              } catch (e) {
                print('❌ Video parse error: $e');
                print('🔍 Raw video data: ${json.toString().substring(0, 200)}...');
                return null;
              }
            }).where((video) => video != null).cast<Video>().toList();
            
            print('✅ SUCCESS! Endpoint returned ${allFetchedVideos.length} videos');
            return allFetchedVideos;
          } else if (videosJson.length > 0) {
            print('⚠️ Endpoint only returned ${videosJson.length} videos (≤8), trying next endpoint...');
          }
        } else {
          print('❌ HTTP Error: ${response.statusCode} - ${response.body}');
        }
      } catch (e) {
        print('❌ Exception for $baseUrl: $e');
      }
    }
    
    // If all direct approaches failed, try aggressive pagination to bypass server limits
    print('🔄 All direct endpoints failed, trying aggressive pagination...');
    
    // Try to get videos using different pagination patterns that might bypass limits
    final paginationStrategies = [
      // MongoDB-style pagination
      {'endpoint': '${AppConfig.baseUrl}/api/videos', 'params': 'skip=0&limit=100'},
      {'endpoint': '${AppConfig.baseUrl}/feed', 'params': 'offset=0&limit=100'},
      // Different page numbering (0-based vs 1-based)
      {'endpoint': '${AppConfig.baseUrl}/api/videos', 'params': 'page=0&limit=100'},
      {'endpoint': '${AppConfig.baseUrl}/feed', 'params': 'page=0&limit=100'},
      // Try without any auth requirements
      {'endpoint': '${AppConfig.baseUrl}/api/videos/public', 'params': 'limit=100'},
      {'endpoint': '${AppConfig.baseUrl}/public/videos', 'params': 'limit=100'},
    ];
    
    for (final strategy in paginationStrategies) {
      try {
        final url = '${strategy['endpoint']}?${strategy['params']}&_t=$timestamp';
        print('🎯 TESTING PAGINATION: $url');
        
        final headers = <String, String>{
          'Content-Type': 'application/json',
        };
        
        // Try both with and without auth for public endpoints
        if (token != 'no-token' && !url.contains('public')) {
          headers['Authorization'] = 'Bearer $token';
        }
        
        final response = await http.get(
          Uri.parse(url),
          headers: headers,
        );

        print('📈 PAGINATION RESULT: ${response.statusCode} - ${response.body.length} chars');
        
        if (response.statusCode == 200) {
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
          
          print('📊 PAGINATION FOUND: ${videosJson.length} videos');
          
          if (videosJson.length > 8) {
            final videos = videosJson.map((json) {
              try {
                return Video.fromJson(json as Map<String, dynamic>);
              } catch (e) {
                print('❌ Pagination parse error: $e');
                return null;
              }
            }).where((video) => video != null).cast<Video>().toList();
            
            print('✅ PAGINATION SUCCESS! Got ${videos.length} videos');
            return videos;
          }
        }
      } catch (e) {
        print('❌ Pagination strategy failed: $e');
      }
    }
    
    print('🔄 All pagination strategies failed, falling back to traditional pagination...');
    
    int page = 1;
    bool hasMoreVideos = true;
    
    while (hasMoreVideos && page <= 10) { // Limit to 10 pages to prevent infinite loops
      try {
        final timestamp = DateTime.now().millisecondsSinceEpoch;
        // Use EXACT same endpoint as web version: /feed with limit and cache busting
        final url = '${AppConfig.baseUrl}/feed?limit=50&page=$page&_t=$timestamp';
        
        print('Fetching page $page from: $url');
        
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

        print('Page $page - Status: ${response.statusCode}');
        print('Page $page - Response length: ${response.body.length}');
        
        if (response.statusCode == 200) {
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
          
          print('Page $page - Found ${videosJson.length} videos');
          
          if (videosJson.isEmpty) {
            hasMoreVideos = false;
            break;
          }
          
          final pageVideos = videosJson.map((json) {
            try {
              return Video.fromJson(json as Map<String, dynamic>);
            } catch (e) {
              print('Video parse error on page $page: $e');
              return null;
            }
          }).where((video) => video != null).cast<Video>().toList();
          
          // Add only new unique videos
          for (final video in pageVideos) {
            if (!allVideos.any((existing) => existing.id == video.id)) {
              allVideos.add(video);
            }
          }
          
          print('Page $page - Added ${pageVideos.length} videos, total: ${allVideos.length}');
          
          // If we got less than the limit, we've reached the end
          if (videosJson.length < 50) {
            hasMoreVideos = false;
          }
          
          page++;
        } else {
          print('Page $page - HTTP Error: ${response.statusCode}');
          hasMoreVideos = false;
        }
      } catch (e) {
        print('Page $page - Exception: $e');
        hasMoreVideos = false;
      }
    }
    
    print('Final result: ${allVideos.length} total unique videos loaded');
    return allVideos;
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