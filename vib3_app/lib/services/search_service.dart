import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';
import '../models/video_model.dart';
import '../models/user_model.dart';

class SearchService {
  static Future<Map<String, dynamic>> search(String query, String token) async {
    try {
      final response = await http.get(
        Uri.parse('${AppConfig.baseUrl}/search?q=${Uri.encodeComponent(query)}'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        
        // Parse videos
        final List<Video> videos = [];
        if (data['videos'] != null) {
          for (final videoJson in data['videos']) {
            try {
              videos.add(Video.fromJson(videoJson));
            } catch (e) {
              print('Error parsing video in search: $e');
            }
          }
        }

        // Parse users
        final List<User> users = [];
        if (data['users'] != null) {
          for (final userJson in data['users']) {
            try {
              users.add(User.fromJson(userJson));
            } catch (e) {
              print('Error parsing user in search: $e');
            }
          }
        }

        // Parse hashtags
        final List<String> hashtags = [];
        if (data['hashtags'] != null) {
          hashtags.addAll(List<String>.from(data['hashtags']));
        }

        return {
          'videos': videos,
          'users': users,
          'hashtags': hashtags,
        };
      } else {
        throw Exception('Search failed: ${response.statusCode}');
      }
    } catch (e) {
      print('Search error: $e');
      return {
        'videos': <Video>[],
        'users': <User>[],
        'hashtags': <String>[],
      };
    }
  }

  static Future<List<Video>> searchVideos(String query, String token) async {
    try {
      final response = await http.get(
        Uri.parse('${AppConfig.baseUrl}/search/videos?q=${Uri.encodeComponent(query)}'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final List<Video> videos = [];
        
        if (data['videos'] != null) {
          for (final videoJson in data['videos']) {
            try {
              videos.add(Video.fromJson(videoJson));
            } catch (e) {
              print('Error parsing video: $e');
            }
          }
        }
        
        return videos;
      } else {
        throw Exception('Video search failed: ${response.statusCode}');
      }
    } catch (e) {
      print('Video search error: $e');
      return [];
    }
  }

  static Future<List<User>> searchUsers(String query, String token) async {
    try {
      final response = await http.get(
        Uri.parse('${AppConfig.baseUrl}/search/users?q=${Uri.encodeComponent(query)}'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final List<User> users = [];
        
        if (data['users'] != null) {
          for (final userJson in data['users']) {
            try {
              users.add(User.fromJson(userJson));
            } catch (e) {
              print('Error parsing user: $e');
            }
          }
        }
        
        return users;
      } else {
        throw Exception('User search failed: ${response.statusCode}');
      }
    } catch (e) {
      print('User search error: $e');
      return [];
    }
  }

  static Future<Map<String, dynamic>> getTrendingContent(String token) async {
    try {
      final response = await http.get(
        Uri.parse('${AppConfig.baseUrl}/trending'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        // Check if response is HTML (common error case)
        if (response.body.trim().startsWith('<') || response.body.contains('<!DOCTYPE')) {
          print('❌ Trending endpoint returned HTML instead of JSON');
          throw FormatException('Trending endpoint returned HTML instead of JSON');
        }
        
        final data = jsonDecode(response.body);
        
        // Parse trending videos
        final List<Video> videos = [];
        if (data['videos'] != null) {
          for (final videoJson in data['videos']) {
            try {
              videos.add(Video.fromJson(videoJson));
            } catch (e) {
              print('Error parsing trending video: $e');
            }
          }
        }

        // Parse trending hashtags
        final List<String> hashtags = [];
        if (data['hashtags'] != null) {
          hashtags.addAll(List<String>.from(data['hashtags']));
        }

        return {
          'videos': videos,
          'hashtags': hashtags,
        };
      } else {
        // Return mock data if endpoint doesn't exist
        return {
          'videos': <Video>[],
          'hashtags': [
            'viral',
            'trending',
            'funny',
            'dance',
            'music',
            'pets',
            'food',
            'travel',
          ],
        };
      }
    } catch (e) {
      print('Trending content error: $e');
      // Return mock data
      return {
        'videos': <Video>[],
        'hashtags': [
          'viral',
          'trending',
          'funny',
          'dance',
          'music',
          'pets',
          'food',
          'travel',
        ],
      };
    }
  }

  static Future<List<String>> getSearchSuggestions(String query, String token) async {
    try {
      final response = await http.get(
        Uri.parse('${AppConfig.baseUrl}/search/suggestions?q=${Uri.encodeComponent(query)}'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return List<String>.from(data['suggestions'] ?? []);
      } else {
        return [];
      }
    } catch (e) {
      print('Search suggestions error: $e');
      return [];
    }
  }
}