import 'dart:convert';
import 'dart:math';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';
import '../models/video.dart';
import 'backend_health_service.dart';
import 'user_service.dart';

class VideoService {
  // Simple cache to avoid repeated API calls
  static final Map<String, Map<String, dynamic>> _cache = {};
  static const Duration _cacheExpiry = Duration(minutes: 5);
  
  static bool _isCacheValid(String key) {
    if (!_cache.containsKey(key)) return false;
    final cachedTime = _cache[key]!['timestamp'] as DateTime;
    return DateTime.now().difference(cachedTime) < _cacheExpiry;
  }
  
  static void clearFollowingCache() {
    _cache.removeWhere((key, value) => 
      key.contains('following_videos_filtered') || 
      key.contains('friends_videos_filtered')
    );
    print('VideoService: Cleared following/friends cache');
  }
  
  // Track ongoing requests to prevent duplicates
  static final Map<String, Future<List<Video>>> _ongoingRequests = {};
  
  static Future<List<Video>> getAllVideos(String token, {String feed = 'foryou', int offset = 0, int limit = 20}) async {
    final url = ApiConfig.buildUrl('videoFeed', params: {
      'feed': feed,
      'offset': offset.toString(),
      'limit': limit.toString(),
    });

    try {
      final response = await http.get(
        Uri.parse(url),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      ).timeout(ApiConfig.timeout);

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final List<dynamic> videosJson = data['recommendations'] ?? data['videos'] ?? [];

        return videosJson.map((json) => Video.fromJson(json)).toList();
      } else {
        throw Exception('Failed to load videos: ${response.statusCode}');
      }
    } catch (e) {
      print('Error fetching videos: $e');
      return [];
    }
  }
  
ype': 'application/json',
            'Accept': 'application/json',
          };
          
          if (token != 'no-token') {
            headers['Authorization'] = 'Bearer $token';
          }
          
          final response = await http.get(
            Uri.parse(url),
            headers: headers,
          ).timeout(const Duration(seconds: 10));

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
              
              print('📊 PAGE $page RESPONSE: ${videosJson.length} videos from $url');
              
              if (videosJson.isNotEmpty) {
                int newVideosCount = 0;
                
                for (final videoJson in videosJson) {
                  try {
                    final video = Video.fromJson(videoJson as Map<String, dynamic>);
                    
                    // Only add if we haven't seen this video ID before
                    if (!seenVideoIds.contains(video.id)) {
                      seenVideoIds.add(video.id);
                      allVideos.add(video);
                      newVideosCount++;
                    }
                  } catch (e) {
                    print('❌ Parse error: $e');
                  }
                }
                
                print('✅ PAGE $page: Added $newVideosCount new videos (${allVideos.length} total)');
                
              if (newVideosCount > 0) {
                pageHadNewVideos = true;
                emptyResponses = 0; // Reset empty counter
              }
            }
          } else {
            print('❌ PAGE $page ERROR: ${response.statusCode}');
          }
        } catch (e) {
          print('❌ PAGE $page EXCEPTION: $e');
        }
        
        if (!pageHadNewVideos) {
          emptyResponses++;
          print('⚠️ PAGE $page: No new videos found');
          
          // Stop if we get 3 consecutive pages with no new videos
          if (emptyResponses >= 3) {
            print('🛑 Stopping: 3 consecutive empty pages');
            keepGoing = false;
          }
        }
        
        page++;
        
        // Small delay to avoid overwhelming the server
        await Future.delayed(const Duration(milliseconds: 100));
        
      } catch (e) {
        print('❌ PAGE $page CRITICAL ERROR: $e');
        break;
      }
    }
    
    print('🏁 MULTI-REQUEST COMPLETE: Found ${allVideos.length} total unique videos after $page pages');
    return allVideos;
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
    // Just use the standard getAllVideos method to avoid duplicates
    final offset = page * limit;
    return getAllVideos(token, offset: offset, limit: limit);
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
    print('💖 Attempting to like video: $videoId');
    print('🔑 Using token: ${token.substring(0, 10)}...');
    
    // Try multiple endpoints for like
    final endpoints = [
      '/api/videos/$videoId/like',
      '/api/video/$videoId/like',
      '/api/like/$videoId',
      '/api/videos/like/$videoId',
    ];
    
    for (String endpoint in endpoints) {
      try {
        print('🔄 Trying like endpoint: $endpoint');
        final response = await http.post(
          Uri.parse('${AppConfig.baseUrl}$endpoint'),
          headers: {
            'Authorization': 'Bearer $token',
            'Content-Type': 'application/json',
          },
          // Don't send body - server gets videoId from URL params
        ).timeout(const Duration(seconds: 10));

        print('📡 Like response: ${response.statusCode} - ${response.body}');
        
        if (response.statusCode == 200 || response.statusCode == 201) {
          print('✅ Like successful with endpoint: $endpoint');
          return true;
        } else if (response.statusCode == 401) {
          print('❌ Unauthorized - token may be expired or invalid');
          // Don't try other endpoints if it's an auth issue
          return false;
        } else if (response.statusCode == 404) {
          print('❌ Video not found: $videoId');
          // Don't try other endpoints if video doesn't exist
          return false;
        }
      } catch (e) {
        print('❌ Like endpoint $endpoint failed: $e');
        continue;
      }
    }
    
    print('❌ All like endpoints failed');
    return false;
  }

  static Future<bool> unlikeVideo(String videoId, String token) async {
    // Use the same toggle endpoint as likeVideo since server toggles likes
    print('🔄 Unlike video using toggle endpoint (server handles like/unlike automatically)');
    return await likeVideo(videoId, token);
  }

  static Future<bool> followUser(String userId, String token) async {
    // Try multiple endpoints for follow
    final endpoints = [
      '/api/users/$userId/follow',
      '/api/user/follow/$userId', 
      '/api/follow/$userId',
      '/api/users/$userId/follow',
      '/api/user/$userId/follow',
      '/api/social/follow',
      '/api/relationships/follow',
      '/api/auth/follow',
    ];
    
    for (String endpoint in endpoints) {
      try {
        print('🔄 Trying follow endpoint: $endpoint');
        
        // Try different request bodies
        final requestBodies = [
          jsonEncode({'userId': userId}),
          jsonEncode({'targetUserId': userId}),
          jsonEncode({'followUserId': userId}),
          jsonEncode({'user_id': userId}),
          jsonEncode({'id': userId}),
        ];
        
        for (final body in requestBodies) {
          try {
            final response = await http.post(
              Uri.parse('${AppConfig.baseUrl}$endpoint'),
              headers: {
                'Authorization': 'Bearer $token',
                'Content-Type': 'application/json',
              },
              body: body,
            ).timeout(const Duration(seconds: 10));

            print('📡 Follow response: ${response.statusCode} - ${response.body}');
            
            if (response.statusCode == 200 || response.statusCode == 201) {
              print('✅ Follow successful with endpoint: $endpoint');
              return true;
            }
          } catch (e) {
            // Try next body format
            continue;
          }
        }
      } catch (e) {
        print('❌ Follow endpoint $endpoint failed: $e');
        continue;
      }
    }
    
    print('❌ All follow endpoints failed - backend may not have follow API implemented yet');
    return false;
  }

  static Future<bool> unfollowUser(String userId, String token) async {
    // Try multiple endpoints for unfollow
    final endpoints = [
      '/api/users/$userId/follow',
      '/api/user/follow/$userId',
      '/api/follow/$userId',
      '/api/users/$userId/unfollow',
      '/api/user/unfollow/$userId',
      '/api/unfollow/$userId',
      '/api/social/unfollow',
      '/api/relationships/unfollow',
      '/api/auth/unfollow',
    ];
    
    for (String endpoint in endpoints) {
      try {
        print('🔄 Trying unfollow endpoint: $endpoint');
        
        // Try DELETE method first
        var response = await http.delete(
          Uri.parse('${AppConfig.baseUrl}$endpoint'),
          headers: {
            'Authorization': 'Bearer $token',
            'Content-Type': 'application/json',
          },
        ).timeout(const Duration(seconds: 10));

        print('📡 Unfollow DELETE response: ${response.statusCode} - ${response.body}');
        
        if (response.statusCode == 200 || response.statusCode == 204) {
          print('✅ Unfollow successful with DELETE: $endpoint');
          return true;
        }
        
        // If DELETE fails, try POST with unfollow action
        if (endpoint.contains('unfollow')) {
          final requestBodies = [
            jsonEncode({'userId': userId}),
            jsonEncode({'targetUserId': userId}),
            jsonEncode({'unfollowUserId': userId}),
            jsonEncode({'user_id': userId}),
            jsonEncode({'id': userId}),
          ];
          
          for (final body in requestBodies) {
            try {
              response = await http.post(
                Uri.parse('${AppConfig.baseUrl}$endpoint'),
                headers: {
                  'Authorization': 'Bearer $token',
                  'Content-Type': 'application/json',
                },
                body: body,
              ).timeout(const Duration(seconds: 10));

              print('📡 Unfollow POST response: ${response.statusCode} - ${response.body}');
              
              if (response.statusCode == 200 || response.statusCode == 201) {
                print('✅ Unfollow successful with POST: $endpoint');
                return true;
              }
            } catch (e) {
              // Try next body format
              continue;
            }
          }
        }
      } catch (e) {
        print('❌ Unfollow endpoint $endpoint failed: $e');
        continue;
      }
    }
    
    print('❌ All unfollow endpoints failed - backend may not have unfollow API implemented yet');
    return false;
  }

  // Get user's liked videos for sync
  static Future<List<Video>> getUserLikedVideos(String token) async {
    try {
      // First, get the current user ID from the auth endpoint
      String? currentUserId;
      try {
        final userResponse = await http.get(
          Uri.parse('${AppConfig.baseUrl}/api/auth/me'),
          headers: {
            'Authorization': 'Bearer $token',
            'Content-Type': 'application/json',
          },
        ).timeout(const Duration(seconds: 5));
        
        if (userResponse.statusCode == 200) {
          final userData = jsonDecode(userResponse.body);
          currentUserId = userData['user']?['_id'] ?? userData['_id'];
          print('✅ Got current user ID: $currentUserId');
        }
      } catch (e) {
        print('❌ Failed to get current user ID: $e');
      }

      // Only use the working endpoint that we know returns JSON
      final endpoints = [
        currentUserId != null 
          ? '/api/user/videos?type=liked&userId=$currentUserId' 
          : '/api/user/videos?type=liked', // Use existing working endpoint with type parameter
      ];
      
      for (String endpoint in endpoints) {
        http.Response? response;
        try {
          response = await http.get(
            Uri.parse('${AppConfig.baseUrl}$endpoint'),
            headers: {
              'Authorization': 'Bearer $token',
              'Content-Type': 'application/json',
            },
          ).timeout(const Duration(seconds: 10));

          if (response.statusCode == 200) {
            // Check if response is HTML (common error case)
            if (response.body.trim().startsWith('<') || response.body.contains('<!DOCTYPE')) {
              print('❌ Endpoint $endpoint returned HTML instead of JSON');
              continue;
            }
            
            // Handle the "User ID required" error by getting current user ID
            if (response.body.contains('User ID required')) {
              print('⚠️ Endpoint $endpoint needs user ID, will be handled by auth flow');
              continue;
            }
            
            final data = jsonDecode(response.body);
            print('✅ Liked videos endpoint $endpoint returned: ${response.statusCode}');
            
            List<Video> videos = [];
            
            // Handle different response formats
            if (data is List) {
              for (var item in data) {
                if (item is Map<String, dynamic>) {
                  videos.add(_parseVideoFromJson(item));
                } else if (item is Map) {
                  videos.add(_parseVideoFromJson(Map<String, dynamic>.from(item)));
                }
              }
            } else if (data is Map) {
              if (data['videos'] is List) {
                for (var item in data['videos']) {
                  if (item is Map<String, dynamic>) {
                    videos.add(_parseVideoFromJson(item));
                  } else if (item is Map) {
                    videos.add(_parseVideoFromJson(Map<String, dynamic>.from(item)));
                  }
                }
              } else if (data['likes'] is List) {
                for (var item in data['likes']) {
                  if (item is Map && item['video'] != null) {
                    final videoData = item['video'];
                    if (videoData is Map<String, dynamic>) {
                      videos.add(_parseVideoFromJson(videoData));
                    } else if (videoData is Map) {
                      videos.add(_parseVideoFromJson(Map<String, dynamic>.from(videoData)));
                    }
                  }
                }
              }
            }
            
            return videos;
          }
        } on FormatException catch (e) {
          print('❌ Endpoint $endpoint failed with FormatException: $e');
          if (response != null) {
            print('Response status: ${response.statusCode}');
            print('Response headers: ${response.headers}');
            print('Response preview: ${response.body.substring(0, response.body.length > 200 ? 200 : response.body.length)}');
          }
          continue;
        } catch (e) {
          print('❌ Endpoint $endpoint failed: $e');
          continue;
        }
      }
      
      print('❌ All liked videos endpoints failed - this might be normal if user has no likes');
      return [];
    } catch (e) {
      print('❌ Error getting liked videos: $e');
      return [];
    }
  }

  // Check if current user has liked a specific video
  static Future<bool> isVideoLiked(String videoId, String token) async {
    try {
      // Try multiple endpoints for like status
      final endpoints = [
        '/api/videos/$videoId/like-status',
        '/api/videos/$videoId/liked',
        '/api/video/$videoId/like-status', 
        '/api/like/status/$videoId',
        '/api/user/likes/$videoId',
        '/api/social/likes/$videoId',
      ];
      
      for (String endpoint in endpoints) {
        try {
          final response = await http.get(
            Uri.parse('${AppConfig.baseUrl}$endpoint'),
            headers: {
              'Authorization': 'Bearer $token',
              'Content-Type': 'application/json',
            },
          ).timeout(const Duration(seconds: 10));

          if (response.statusCode == 200) {
            final data = jsonDecode(response.body);
            print('✅ Like status endpoint $endpoint returned: ${response.body}');
            
            // Handle different response formats
            if (data is Map) {
              if (data['isLiked'] is bool) {
                return data['isLiked'];
              } else if (data['liked'] is bool) {
                return data['liked'];
              } else if (data['hasLiked'] is bool) {
                return data['hasLiked'];
              } else if (data['status'] == 'liked') {
                return true;
              } else if (data['status'] == 'not_liked') {
                return false;
              }
            } else if (data is bool) {
              return data;
            }
          }
        } catch (e) {
          print('❌ Like status endpoint $endpoint failed: $e');
          continue;
        }
      }
      
      print('❌ All like status endpoints failed - assuming not liked');
      return false;
    } catch (e) {
      print('❌ Error checking like status: $e');
      return false;
    }
  }


  // Check if current user is following a specific user
  static Future<bool> isFollowingUser(String userId, String token) async {
    try {
      // Try multiple endpoints for follow status
      final endpoints = [
        '/api/user/follow-status/$userId',
        '/api/users/$userId/follow-status',
        '/api/follow/status/$userId',
        '/api/social/status/$userId',
        '/api/relationships/status/$userId',
      ];
      
      for (String endpoint in endpoints) {
        try {
          final response = await http.get(
            Uri.parse('${AppConfig.baseUrl}$endpoint'),
            headers: {
              'Authorization': 'Bearer $token',
              'Content-Type': 'application/json',
            },
          ).timeout(const Duration(seconds: 10));

          if (response.statusCode == 200) {
            final data = jsonDecode(response.body);
            print('✅ Follow status endpoint $endpoint returned: ${response.body}');
            
            // Handle different response formats
            if (data is Map) {
              if (data['isFollowing'] is bool) {
                return data['isFollowing'];
              } else if (data['following'] is bool) {
                return data['following'];
              } else if (data['status'] == 'following') {
                return true;
              } else if (data['status'] == 'not_following') {
                return false;
              }
            }
          }
        } catch (e) {
          print('❌ Follow status endpoint $endpoint failed: $e');
          continue;
        }
      }
      
      print('❌ All follow status endpoints failed - assuming not following');
      return false;
    } catch (e) {
      print('❌ Error checking follow status: $e');
      return false;
    }
  }

  // Helper to parse video from JSON (reused from getAllVideos)
  static Video _parseVideoFromJson(Map<String, dynamic> json) {
    String? videoUrl = json['videoUrl']?.toString();
    if (videoUrl != null && !videoUrl.startsWith('http')) {
      videoUrl = 'https://vib3-videos.nyc3.digitaloceanspaces.com/$videoUrl';
    }
    
    int videoDuration = 30; // default
    final processingInfo = json['processingInfo'];
    if (processingInfo != null && processingInfo['videoInfo'] != null) {
      final videoInfo = processingInfo['videoInfo'];
      if (videoInfo['duration'] != null && videoInfo['duration'] != 'N/A') {
        try {
          videoDuration = (double.parse(videoInfo['duration'].toString())).round();
        } catch (e) {
          // Keep default
        }
      }
    }
    
    return Video(
      id: json['_id']?.toString() ?? '',
      userId: json['userId']?.toString() ?? json['userid']?.toString() ?? '',
      username: json['username']?.toString() ?? json['user']?['username']?.toString() ?? 'user',
      videoUrl: videoUrl,
      description: json['title']?.toString() ?? json['description']?.toString() ?? '',
      likesCount: _parseIntSafely(json['likeCount'] ?? json['likecount'] ?? json['likes'] ?? 0),
      commentsCount: _parseIntSafely(json['commentCount'] ?? json['commentcount'] ?? json['comments'] ?? 0),
      sharesCount: _parseIntSafely(json['shareCount'] ?? json['sharecount'] ?? 0),
      viewsCount: _parseIntSafely(json['views'] ?? 0),
      duration: videoDuration,
      isPrivate: false,
      createdAt: _parseDateTime(json['createdAt'] ?? json['createdat']),
      updatedAt: _parseDateTime(json['updatedAt'] ?? json['updatedat']),
      user: json['user'] ?? {
        'username': json['username'] ?? 'user',
        'displayName': json['username'] ?? 'User',
        '_id': json['userId'] ?? '',
      },
    );
  }

  // Helper function to safely parse integers
  static int _parseIntSafely(dynamic value) {
    if (value == null) return 0;
    if (value is int) return value;
    if (value is double) return value.toInt();
    if (value is String) {
      try {
        return int.parse(value);
      } catch (e) {
        return 0;
      }
    }
    return 0;
  }

  // Helper function to safely parse DateTime
  static DateTime _parseDateTime(dynamic value) {
    if (value == null) return DateTime.now();
    if (value is String) {
      try {
        return DateTime.parse(value);
      } catch (e) {
        return DateTime.now();
      }
    }
    return DateTime.now();
  }

  // Mock videos when backend is down
  static List<Video> _getMockVideos() {
    final now = DateTime.now();
    return [
      Video(
        id: 'mock_1',
        userId: 'user_1',
        username: 'vib3_official',
        videoUrl: 'https://example.com/mock_video_1.mp4',
        description: 'Welcome to VIB3! 🎉 Create amazing short videos with our editing tools',
        likesCount: 1250,
        commentsCount: 89,
        sharesCount: 45,
        viewsCount: 15600,
        duration: 15,
        isPrivate: false,
        createdAt: now.subtract(const Duration(hours: 2)),
        updatedAt: now.subtract(const Duration(hours: 2)),
        user: {
          'username': 'vib3_official',
          'displayName': 'VIB3 Official',
          '_id': 'user_1',
        },
      ),
      Video(
        id: 'mock_2',
        userId: 'user_2',
        username: 'dancer_pro',
        videoUrl: 'https://example.com/mock_video_2.mp4',
        description: 'Dance moves that will blow your mind! 💃 #trending #dance',
        likesCount: 892,
        commentsCount: 156,
        sharesCount: 78,
        viewsCount: 8900,
        duration: 23,
        isPrivate: false,
        createdAt: now.subtract(const Duration(hours: 5)),
        updatedAt: now.subtract(const Duration(hours: 5)),
        user: {
          'username': 'dancer_pro',
          'displayName': 'Dance Pro',
          '_id': 'user_2',
        },
      ),
      Video(
        id: 'mock_3',
        userId: 'user_3',
        username: 'chef_master',
        videoUrl: 'https://example.com/mock_video_3.mp4',
        description: 'Amazing cooking hack you need to try! 🍳 #cooking #lifehack',
        likesCount: 2340,
        commentsCount: 234,
        sharesCount: 156,
        viewsCount: 23400,
        duration: 30,
        isPrivate: false,
        createdAt: now.subtract(const Duration(hours: 8)),
        updatedAt: now.subtract(const Duration(hours: 8)),
        user: {
          'username': 'chef_master',
          'displayName': 'Chef Master',
          '_id': 'user_3',
        },
      ),
      Video(
        id: 'mock_4',
        userId: 'user_4',
        username: 'pet_lover',
        videoUrl: 'https://example.com/mock_video_4.mp4',
        description: 'Cute puppy learns new tricks! 🐶 So adorable #pets #cute',
        likesCount: 3456,
        commentsCount: 567,
        sharesCount: 234,
        viewsCount: 45600,
        duration: 18,
        isPrivate: false,
        createdAt: now.subtract(const Duration(days: 1)),
        updatedAt: now.subtract(const Duration(days: 1)),
        user: {
          'username': 'pet_lover',
          'displayName': 'Pet Lover',
          '_id': 'user_4',
        },
      ),
      Video(
        id: 'mock_5',
        userId: 'user_5',
        username: 'street_artist',
        videoUrl: 'https://example.com/mock_video_5.mp4',
        description: 'Street art masterpiece creation! 🎨 #art #creative #street',
        likesCount: 1876,
        commentsCount: 289,
        sharesCount: 145,
        viewsCount: 18760,
        duration: 27,
        isPrivate: false,
        createdAt: now.subtract(const Duration(days: 2)),
        updatedAt: now.subtract(const Duration(days: 2)),
        user: {
          'username': 'street_artist',
          'displayName': 'Street Artist',
          '_id': 'user_5',
        },
      ),
    ];
  }


  static Future<List<Video>> getDiscoverVideos(String token) async {
    try {
      // For now, just return all videos since the backend doesn't have separate discover endpoint
      print('VideoService: getDiscoverVideos - using getAllVideos as fallback');
      return getAllVideos(token);
    } catch (e) {
      print('Error getting discover videos: $e');
      return getAllVideos(token);
    }
  }
  
  static Future<List<Video>> getFollowingVideos(String token, {int offset = 0, int limit = 20}) async {
    try {
      // First try the dedicated following endpoint
      final queryParams = {
        'offset': offset.toString(),
        'limit': limit.toString(),
        'sort': 'newest', // Chronological order for following feed
      };
      
      final uri = Uri.parse('${AppConfig.baseUrl}/api/videos/following')
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
        final List<dynamic> videosJson = data['videos'] ?? data ?? [];
        
        print('VideoService: getFollowingVideos - loaded ${videosJson.length} videos from followed users');
        
        final videos = videosJson.map((json) => Video.fromJson(json)).toList();
        
        // Sort by creation date for chronological order
        videos.sort((a, b) => b.createdAt.compareTo(a.createdAt));
        
        return videos;
      }
      
      // Fallback: Use client-side filtering
      print('VideoService: getFollowingVideos - using client-side filtering (status: ${response.statusCode})');
      
      // Get current user info to get their ID
      final currentUser = await UserService.getCurrentUserProfile(token);
      if (currentUser == null) {
        print('VideoService: Could not get current user profile');
        return [];
      }
      
      // Get the list of users the current user is following
      final followingUserIds = await UserService.getUserFollowing(currentUser.id, token);
      
      if (followingUserIds.isEmpty) {
        print('VideoService: User is not following anyone');
        return [];
      }
      
      print('VideoService: User is following ${followingUserIds.length} users');
      
      // Store filtered videos in cache if not already cached
      final cacheKey = 'following_videos_filtered';
      if (!_isCacheValid(cacheKey)) {
        // Get ALL available videos using the multi-request approach to ensure we have enough
        final allVideos = await _fetchAllVideosByMakingMultipleRequests(token);
        
        print('VideoService: Got ${allVideos.length} total videos to filter from');
        
        // Filter videos to only include those from followed users
        final followingVideos = allVideos.where((video) => 
          followingUserIds.contains(video.userId)
        ).toList();
        
        print('VideoService: Found ${followingVideos.length} videos from followed users');
        
        // Sort by creation date for chronological order
        followingVideos.sort((a, b) => b.createdAt.compareTo(a.createdAt));
        
        // Cache the filtered videos
        _cache[cacheKey] = {
          'data': followingVideos,
          'timestamp': DateTime.now(),
        };
      }
      
      // Get cached filtered videos
      final followingVideos = (_cache[cacheKey]!['data'] as List<Video>);
      
      // Apply pagination
      final startIndex = offset;
      final endIndex = (offset + limit).clamp(0, followingVideos.length);
      
      if (startIndex >= followingVideos.length) {
        // For infinite scroll, wrap around to the beginning
        if (followingVideos.isNotEmpty) {
          final wrappedIndex = startIndex % followingVideos.length;
          final wrappedEnd = (wrappedIndex + limit).clamp(0, followingVideos.length);
          return followingVideos.sublist(wrappedIndex, wrappedEnd);
        }
        return [];
      }
      
      return followingVideos.sublist(startIndex, endIndex);
      
    } catch (e) {
      print('Error getting following videos: $e');
      return [];
    }
  }
  
  static Future<List<Video>> getFriendsVideos(String token, {int offset = 0, int limit = 20}) async {
    try {
      // First try the dedicated friends endpoint
      final queryParams = {
        'offset': offset.toString(),
        'limit': limit.toString(),
        'sort': 'newest',
      };
      
      final uri = Uri.parse('${AppConfig.baseUrl}/api/videos/friends')
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
        final List<dynamic> videosJson = data['videos'] ?? data ?? [];
        
        print('VideoService: getFriendsVideos - loaded ${videosJson.length} videos from friends');
        
        final videos = videosJson.map((json) => Video.fromJson(json)).toList();
        
        // Sort by creation date for chronological order
        videos.sort((a, b) => b.createdAt.compareTo(a.createdAt));
        
        return videos;
      }
      
      // Fallback: Use client-side filtering for mutual followers
      print('VideoService: getFriendsVideos - using client-side filtering (status: ${response.statusCode})');
      
      // Get current user info to get their ID
      final currentUser = await UserService.getCurrentUserProfile(token);
      if (currentUser == null) {
        print('VideoService: Could not get current user profile');
        return [];
      }
      
      // Get the list of users the current user is following
      final followingUserIds = await UserService.getUserFollowing(currentUser.id, token);
      
      // Get the list of users who follow the current user
      final followerUserIds = await UserService.getUserFollowers(currentUser.id, token);
      
      if (followingUserIds.isEmpty || followerUserIds.isEmpty) {
        print('VideoService: User has no mutual followers (following: ${followingUserIds.length}, followers: ${followerUserIds.length})');
        return [];
      }
      
      // Find mutual followers (users who follow each other)
      final mutualFollowerIds = followingUserIds.where((userId) => 
        followerUserIds.contains(userId)
      ).toList();
      
      print('VideoService: Found ${mutualFollowerIds.length} mutual followers');
      
      if (mutualFollowerIds.isEmpty) {
        return [];
      }
      
      // Store filtered videos in cache if not already cached
      final cacheKey = 'friends_videos_filtered';
      if (!_isCacheValid(cacheKey)) {
        // Get ALL available videos using the multi-request approach to ensure we have enough
        final allVideos = await _fetchAllVideosByMakingMultipleRequests(token);
        
        print('VideoService: Got ${allVideos.length} total videos to filter from');
        
        // Filter videos to only include those from mutual followers
        final friendsVideos = allVideos.where((video) => 
          mutualFollowerIds.contains(video.userId)
        ).toList();
        
        print('VideoService: Found ${friendsVideos.length} videos from mutual followers');
        
        // Sort by creation date for chronological order
        friendsVideos.sort((a, b) => b.createdAt.compareTo(a.createdAt));
        
        // Cache the filtered videos
        _cache[cacheKey] = {
          'data': friendsVideos,
          'timestamp': DateTime.now(),
        };
      }
      
      // Get cached filtered videos
      final friendsVideos = (_cache[cacheKey]!['data'] as List<Video>);
      
      // Apply pagination
      final startIndex = offset;
      final endIndex = (offset + limit).clamp(0, friendsVideos.length);
      
      if (startIndex >= friendsVideos.length) {
        // For infinite scroll, wrap around to the beginning
        if (friendsVideos.isNotEmpty) {
          final wrappedIndex = startIndex % friendsVideos.length;
          final wrappedEnd = (wrappedIndex + limit).clamp(0, friendsVideos.length);
          return friendsVideos.sublist(wrappedIndex, wrappedEnd);
        }
        return [];
      }
      
      return friendsVideos.sublist(startIndex, endIndex);
      
    } catch (e) {
      print('Error getting friends videos: $e');
      return [];
    }
  }
  
  static Future<List<String>> getUserFollowedUsers(String token) async {
    try {
      // Get current user profile to get their ID
      final currentUser = await UserService.getCurrentUserProfile(token);
      if (currentUser == null) {
        print('VideoService: Could not get current user profile');
        return [];
      }
      
      // Use UserService to get following list
      final followingList = await UserService.getUserFollowing(currentUser.id, token);
      print('VideoService: getUserFollowedUsers - user follows ${followingList.length} users');
      return followingList;
    } catch (e) {
      print('Error getting followed users: $e');
      return [];
    }
  }
  
  static Future<List<Video>> getPersonalizedVideos(String userId, String token, {int offset = 0, int limit = 50}) async {
    try {
      print('VideoService: Getting personalized videos for user: $userId');
      
      // Use the working /api/videos endpoint with foryou feed
      final response = await http.get(
        Uri.parse('${AppConfig.baseUrl}/api/videos?feed=foryou&limit=$limit&offset=$offset'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      );
      
      if (response.statusCode == 200) {
        // Check if response is HTML (error case)
        if (response.body.trim().startsWith('<!DOCTYPE') || response.body.trim().startsWith('<html')) {
          print('⚠️ VideoService: Received HTML instead of JSON for personalized videos, falling back');
          return await getAllVideos(token, feed: 'foryou', offset: offset, limit: limit);
        }
        
        try {
          final data = jsonDecode(response.body);
          final videosJson = data['videos'] as List<dynamic>;
          
          print('VideoService: Got ${videosJson.length} personalized videos from backend');
          
          return videosJson.map((json) => 
            Video.fromJson(json as Map<String, dynamic>)
          ).toList();
        } catch (e) {
          print('⚠️ VideoService: Error parsing personalized videos response: $e');
          return await getAllVideos(token, feed: 'foryou', offset: offset, limit: limit);
        }
      } else {
        print('VideoService: Failed to get personalized videos (${response.statusCode}), falling back to regular feed');
        // Fallback to regular feed if personalized endpoint fails
        return await getAllVideos(token, feed: 'foryou', offset: offset, limit: limit);
      }
    } catch (e) {
      print('VideoService: Error getting personalized videos: $e');
      // Fallback to regular feed on error
      return await getAllVideos(token, feed: 'foryou', offset: offset, limit: limit);
    }
  }
}