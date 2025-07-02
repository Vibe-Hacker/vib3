import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';
import '../models/video.dart';

class VideoService {
  static Future<List<Video>> getAllVideos(String token) async {
    // First, let's test with a simple direct approach
    try {
      final testResponse = await http.get(
        Uri.parse('${AppConfig.baseUrl}/api/videos?limit=50'),
        headers: {
          'Accept': 'application/json',
        },
      );

      if (testResponse.statusCode == 200) {
        final data = jsonDecode(testResponse.body);
        if (data['videos'] != null) {
          final List<dynamic> videosJson = data['videos'];
          
          // Create a simple list without complex parsing to see if we get all videos
          final videos = <Video>[];
          
          for (var i = 0; i < videosJson.length && i < 50; i++) {
            try {
              final json = videosJson[i];
              
              // Get video URL and validate it
              String? videoUrl = json['videoUrl']?.toString();
              if (videoUrl == null || videoUrl.isEmpty) {
                // Skip videos without URLs
                continue;
              }
              
              // Check if video is properly processed
              final isProcessed = json['processed'] == true || json['processingInfo'] != null;
              final mimeType = json['mimeType']?.toString() ?? '';
              
              // Skip WebM videos and unprocessed videos that cause playback issues
              if (mimeType.contains('webm') || !isProcessed) {
                continue;
              }
              
              // Ensure the URL is complete
              if (!videoUrl.startsWith('http')) {
                videoUrl = 'https://vib3-videos.nyc3.digitaloceanspaces.com/$videoUrl';
              }
              
              // Extract duration from processingInfo if available
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
              
              // Create simplified video object
              final video = Video(
                id: json['_id']?.toString() ?? 'video_$i',
                userId: json['userId']?.toString() ?? json['userid']?.toString() ?? '',
                videoUrl: videoUrl,
                description: json['title']?.toString() ?? json['description']?.toString() ?? 'Video ${i + 1}',
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
              videos.add(video);
            } catch (e) {
              // Skip bad videos but continue
              continue;
            }
          }
          
          return videos;
        }
      }
    } catch (e) {
      // Fall through to original method
    }
    
    // Original method as fallback
    print('🎬 Getting all videos with token: ${token.length > 10 ? '${token.substring(0, 10)}...' : token}');
    
    try {
      // Try the main endpoint with high limit first
      final response = await http.get(
        Uri.parse('${AppConfig.baseUrl}/api/videos?limit=50'),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          if (token != 'no-token') 'Authorization': 'Bearer $token',
        },
      );

      print('🌐 Main endpoint response: ${response.statusCode}');
      
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        print('📊 Raw response data keys: ${data.keys}');
        
        if (data['videos'] != null) {
          final List<dynamic> videosJson = data['videos'];
          print('✅ Found ${videosJson.length} videos in main endpoint');
          
          final videos = <Video>[];
          int parseErrors = 0;
          
          for (int i = 0; i < videosJson.length; i++) {
            try {
              final video = Video.fromJson(videosJson[i]);
              videos.add(video);
              print('📹 Video ${i + 1}: ${video.id} - ${video.description}');
            } catch (e) {
              parseErrors++;
              print('❌ Failed to parse video ${i + 1}: $e');
              print('📄 Raw video data: ${videosJson[i]}');
            }
          }
          
          print('🎯 Successfully parsed ${videos.length} videos (${parseErrors} parse errors)');
          return videos;
        }
      }
      
      print('❌ Main endpoint failed, falling back to debug methods');
      // If main endpoint fails, try the debug approach
      await _debugDatabaseContent(token);
      return await _fetchAllVideosByMakingMultipleRequests(token);
      
    } catch (e) {
      print('❌ Error in getAllVideos: $e');
      // Fallback to old method
      await _debugDatabaseContent(token);
      return await _fetchAllVideosByMakingMultipleRequests(token);
    }
  }
  
  static Future<void> _debugDatabaseContent(String token) async {
    print('🔍 DEBUGGING: Checking actual database content...');
    print('🔍 MongoDB Connection: Cluster0.y06bp.mongodb.net/vib3');
    
    // First, let's test if the web version really gets more than 8 videos
    print('🌐 TESTING: Web version behavior comparison...');
    
    // Try the exact same requests that the working web version makes
    final webVersionEndpoints = [
      // These are the exact patterns used by the working web version
      '${AppConfig.baseUrl}/feed?limit=10&_t=${DateTime.now().millisecondsSinceEpoch}',
      '${AppConfig.baseUrl}/api/videos?limit=10&_t=${DateTime.now().millisecondsSinceEpoch}',
      // Try without cache busting like early requests
      '${AppConfig.baseUrl}/feed?limit=10',
      '${AppConfig.baseUrl}/api/videos?limit=10',
      // Try exact web browser headers
      '${AppConfig.baseUrl}/feed',
      '${AppConfig.baseUrl}/api/videos',
    ];
    
    for (final url in webVersionEndpoints) {
      try {
        final headers = <String, String>{
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': '${AppConfig.baseUrl}/',
          'Origin': AppConfig.baseUrl,
        };
        
        if (token != 'no-token') {
          headers['Authorization'] = 'Bearer $token';
        }
        
        print('🔗 WEB TEST: $url');
        
        final response = await http.get(Uri.parse(url), headers: headers);
        
        if (response.statusCode == 200) {
          try {
            final data = jsonDecode(response.body);
            int videoCount = 0;
            
            if (data is Map<String, dynamic>) {
              if (data.containsKey('videos') && data['videos'] is List) {
                videoCount = data['videos'].length;
              }
            } else if (data is List) {
              videoCount = data.length;
            }
            
            print('🎬 WEB VERSION RESULT: $videoCount videos from $url');
            
            // If we get more than 8, this confirms the server CAN return more
            if (videoCount > 8) {
              print('✅ BREAKTHROUGH! Web headers got $videoCount videos!');
              print('🔍 Response sample: ${response.body.substring(0, 500)}...');
            } else if (videoCount == 8) {
              print('⚠️ Even web headers only get 8 videos - might be database limit');
            }
            
          } catch (e) {
            print('❌ Parse error for web test: $e');
          }
        } else {
          print('❌ Web test failed: ${response.statusCode}');
        }
      } catch (e) {
        print('❌ Web test exception: $e');
      }
    }
    
    // Test direct database count queries
    print('🗄️ TESTING: Direct database queries...');
    final dbTestEndpoints = [
      // Try database-specific count endpoints
      '${AppConfig.baseUrl}/api/db/videos/count',
      '${AppConfig.baseUrl}/api/mongodb/count', 
      '${AppConfig.baseUrl}/api/videos/total',
      '${AppConfig.baseUrl}/api/stats/videos',
      // Try bypassing pagination entirely
      '${AppConfig.baseUrl}/api/videos?nolimit=true',
      '${AppConfig.baseUrl}/api/videos?all=true',
      '${AppConfig.baseUrl}/api/videos?bypass=pagination',
      // Try database dump endpoints
      '${AppConfig.baseUrl}/api/videos/dump',
      '${AppConfig.baseUrl}/api/export/videos',
    ];
    
    for (final url in dbTestEndpoints) {
      try {
        final headers = <String, String>{
          'Content-Type': 'application/json',
        };
        
        if (token != 'no-token') {
          headers['Authorization'] = 'Bearer $token';
        }
        
        final response = await http.get(Uri.parse(url), headers: headers);
        
        if (response.statusCode == 200) {
          print('💾 DATABASE SUCCESS: $url');
          try {
            final data = jsonDecode(response.body);
            if (data is Map<String, dynamic>) {
              if (data.containsKey('count') || data.containsKey('total')) {
                print('📊 TOTAL COUNT: ${data['count'] ?? data['total']} videos in MongoDB');
              }
              if (data.containsKey('videos') && data['videos'] is List) {
                print('📊 VIDEOS FOUND: ${data['videos'].length} videos');
                if (data['videos'].length > 8) {
                  print('🎉 FOUND MORE THAN 8! Database has ${data['videos'].length} videos');
                }
              }
            }
          } catch (e) {
            print('📝 DB Response (non-JSON): ${response.body.substring(0, 200)}...');
          }
        }
      } catch (e) {
        // Silently continue - these are test endpoints
      }
    }
    
    // Try various debug/admin endpoints that might show total count
    final debugEndpoints = [
      '${AppConfig.baseUrl}/api/videos/count',
      '${AppConfig.baseUrl}/api/admin/videos/count', 
      '${AppConfig.baseUrl}/debug/videos',
      '${AppConfig.baseUrl}/api/videos/stats',
      '${AppConfig.baseUrl}/health/videos',
      '${AppConfig.baseUrl}/api/videos?debug=true',
      '${AppConfig.baseUrl}/feed?debug=true',
      // Test server configuration endpoints
      '${AppConfig.baseUrl}/api/config',
      '${AppConfig.baseUrl}/health',
      '${AppConfig.baseUrl}/api/health',
      // Test direct database bypass
      '${AppConfig.baseUrl}/api/videos/raw',
      '${AppConfig.baseUrl}/api/database/videos',
      // Test without any query processing
      '${AppConfig.baseUrl}/api/videos/all?bypass=true',
      '${AppConfig.baseUrl}/api/videos?raw=true&limit=1000',
    ];
    
    for (final url in debugEndpoints) {
      try {
        final headers = <String, String>{
          'Content-Type': 'application/json',
        };
        
        if (token != 'no-token') {
          headers['Authorization'] = 'Bearer $token';
        }
        
        final response = await http.get(Uri.parse(url), headers: headers);
        
        if (response.statusCode == 200) {
          print('💡 DEBUG ENDPOINT SUCCESS: $url');
          print('📊 Response: ${response.body}');
          
          // Try to parse for video count information
          try {
            final data = jsonDecode(response.body);
            if (data is Map<String, dynamic>) {
              if (data.containsKey('count') || data.containsKey('total')) {
                print('🎯 FOUND COUNT: ${data['count'] ?? data['total']} videos in database');
              }
              if (data.containsKey('videos') && data['videos'] is List) {
                print('🎯 FOUND VIDEOS: ${data['videos'].length} videos in response');
              }
            }
          } catch (e) {
            print('📝 Non-JSON response: ${response.body.substring(0, 200)}...');
          }
        } else {
          print('❌ Debug endpoint failed: $url (${response.statusCode})');
        }
      } catch (e) {
        print('❌ Debug endpoint error: $url - $e');
      }
    }
    
    // Try making raw requests to see response patterns
    print('🔍 TESTING: Raw response patterns...');
    
    final testEndpoints = [
      '${AppConfig.baseUrl}/feed',
      '${AppConfig.baseUrl}/api/videos',
      '${AppConfig.baseUrl}/api/videos?limit=100',
      '${AppConfig.baseUrl}/feed?limit=100',
    ];
    
    for (final url in testEndpoints) {
      try {
        final headers = <String, String>{
          'Content-Type': 'application/json',
        };
        
        if (token != 'no-token') {
          headers['Authorization'] = 'Bearer $token';
        }
        
        final response = await http.get(Uri.parse(url), headers: headers);
        
        if (response.statusCode == 200) {
          try {
            final data = jsonDecode(response.body);
            int videoCount = 0;
            
            if (data is Map<String, dynamic>) {
              if (data.containsKey('videos') && data['videos'] is List) {
                videoCount = data['videos'].length;
              }
            } else if (data is List) {
              videoCount = data.length;
            }
            
            print('📊 ENDPOINT $url: Returns $videoCount videos (${response.body.length} chars)');
            
            // If we found exactly 8, this might be the real database content
            if (videoCount == 8) {
              print('⚠️ EXACTLY 8 VIDEOS: This might be the real database count!');
            }
            
          } catch (e) {
            print('❌ Parse error for $url: $e');
          }
        }
      } catch (e) {
        print('❌ Test error for $url: $e');
      }
    }
  }
  
  static Future<List<Video>> _fetchAllVideosByMakingMultipleRequests(String token) async {
    List<Video> allVideos = [];
    Set<String> seenVideoIds = {};
    int page = 0;
    bool keepGoing = true;
    int emptyResponses = 0;
    
    print('🚀 MULTI-REQUEST APPROACH: Making multiple requests to bypass 8-video server limit');
    
    while (keepGoing && page < 20) { // Max 20 pages to prevent infinite loops (20 * 8 = 160 videos max)
      try {
        final timestamp = DateTime.now().millisecondsSinceEpoch;
        
        // Try multiple pagination patterns for each page
        final pageUrls = [
          '${AppConfig.baseUrl}/feed?page=$page&_t=$timestamp',
          '${AppConfig.baseUrl}/api/videos?page=$page&_t=$timestamp',
          '${AppConfig.baseUrl}/feed?offset=${page * 8}&_t=$timestamp',
          '${AppConfig.baseUrl}/api/videos?offset=${page * 8}&_t=$timestamp',
          '${AppConfig.baseUrl}/feed?skip=${page * 8}&_t=$timestamp',
          '${AppConfig.baseUrl}/api/videos?skip=${page * 8}&_t=$timestamp',
        ];
        
        bool pageHadNewVideos = false;
        
        for (final url in pageUrls) {
          try {
            print('📄 PAGE $page REQUEST: $url');
            
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
                  break; // Found videos with this URL pattern, move to next page
                }
              }
            } else {
              print('❌ PAGE $page ERROR: ${response.statusCode} for $url');
            }
          } catch (e) {
            print('❌ PAGE $page EXCEPTION: $e for $url');
          }
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
}