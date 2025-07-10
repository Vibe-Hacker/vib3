import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';
import '../models/playlist.dart';
import '../models/video.dart';

class PlaylistService {
  // Get user playlists
  static Future<List<Playlist>> getUserPlaylists({
    required String userId,
    required String token,
  }) async {
    try {
      final response = await http.get(
        Uri.parse('${AppConfig.baseUrl}/api/playlists/user/$userId'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );
      
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return (data['playlists'] as List)
            .map((json) => Playlist.fromJson(json))
            .toList();
      }
      
      // Return mock data for development
      return _getMockPlaylists();
    } catch (e) {
      print('Error getting playlists: $e');
      return _getMockPlaylists();
    }
  }
  
  // Create playlist
  static Future<Playlist?> createPlaylist({
    required String name,
    required String description,
    required PlaylistType type,
    required bool isPrivate,
    required String token,
    List<String> tags = const [],
    String? coverImageUrl,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('${AppConfig.baseUrl}/api/playlists'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'name': name,
          'description': description,
          'type': type.name,
          'isPrivate': isPrivate,
          'tags': tags,
          'coverImageUrl': coverImageUrl,
        }),
      );
      
      if (response.statusCode == 201) {
        final data = jsonDecode(response.body);
        return Playlist.fromJson(data['playlist']);
      }
      
      return null;
    } catch (e) {
      print('Error creating playlist: $e');
      return null;
    }
  }
  
  // Update playlist
  static Future<bool> updatePlaylist({
    required String playlistId,
    required String token,
    String? name,
    String? description,
    bool? isPrivate,
    List<String>? tags,
    String? coverImageUrl,
  }) async {
    try {
      final body = <String, dynamic>{};
      if (name != null) body['name'] = name;
      if (description != null) body['description'] = description;
      if (isPrivate != null) body['isPrivate'] = isPrivate;
      if (tags != null) body['tags'] = tags;
      if (coverImageUrl != null) body['coverImageUrl'] = coverImageUrl;
      
      final response = await http.put(
        Uri.parse('${AppConfig.baseUrl}/api/playlists/$playlistId'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode(body),
      );
      
      return response.statusCode == 200;
    } catch (e) {
      print('Error updating playlist: $e');
      return false;
    }
  }
  
  // Delete playlist
  static Future<bool> deletePlaylist({
    required String playlistId,
    required String token,
  }) async {
    try {
      final response = await http.delete(
        Uri.parse('${AppConfig.baseUrl}/api/playlists/$playlistId'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );
      
      return response.statusCode == 200;
    } catch (e) {
      print('Error deleting playlist: $e');
      return false;
    }
  }
  
  // Add video to playlist
  static Future<bool> addVideoToPlaylist({
    required String playlistId,
    required String videoId,
    required String token,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('${AppConfig.baseUrl}/api/playlists/$playlistId/videos'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'videoId': videoId,
        }),
      );
      
      return response.statusCode == 200;
    } catch (e) {
      print('Error adding video to playlist: $e');
      return false;
    }
  }
  
  // Remove video from playlist
  static Future<bool> removeVideoFromPlaylist({
    required String playlistId,
    required String videoId,
    required String token,
  }) async {
    try {
      final response = await http.delete(
        Uri.parse('${AppConfig.baseUrl}/api/playlists/$playlistId/videos/$videoId'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );
      
      return response.statusCode == 200;
    } catch (e) {
      print('Error removing video from playlist: $e');
      return false;
    }
  }
  
  // Get playlist videos
  static Future<List<Video>> getPlaylistVideos({
    required String playlistId,
    required String token,
  }) async {
    try {
      final response = await http.get(
        Uri.parse('${AppConfig.baseUrl}/api/playlists/$playlistId/videos'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );
      
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return (data['videos'] as List)
            .map((json) => Video.fromJson(json))
            .toList();
      }
      
      return [];
    } catch (e) {
      print('Error getting playlist videos: $e');
      return [];
    }
  }
  
  // Reorder videos in playlist
  static Future<bool> reorderPlaylistVideos({
    required String playlistId,
    required List<String> videoIds,
    required String token,
  }) async {
    try {
      final response = await http.put(
        Uri.parse('${AppConfig.baseUrl}/api/playlists/$playlistId/reorder'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'videoIds': videoIds,
        }),
      );
      
      return response.statusCode == 200;
    } catch (e) {
      print('Error reordering playlist videos: $e');
      return false;
    }
  }
  
  // Get collections
  static Future<List<Collection>> getUserCollections({
    required String userId,
    required String token,
  }) async {
    try {
      final response = await http.get(
        Uri.parse('${AppConfig.baseUrl}/api/collections/user/$userId'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );
      
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return (data['collections'] as List)
            .map((json) => Collection.fromJson(json))
            .toList();
      }
      
      return _getMockCollections();
    } catch (e) {
      print('Error getting collections: $e');
      return _getMockCollections();
    }
  }
  
  // Create collection
  static Future<Collection?> createCollection({
    required String name,
    required String description,
    required CollectionType type,
    required bool isPrivate,
    required String token,
    List<String> tags = const [],
  }) async {
    try {
      final response = await http.post(
        Uri.parse('${AppConfig.baseUrl}/api/collections'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'name': name,
          'description': description,
          'type': type.name,
          'isPrivate': isPrivate,
          'tags': tags,
        }),
      );
      
      if (response.statusCode == 201) {
        final data = jsonDecode(response.body);
        return Collection.fromJson(data['collection']);
      }
      
      return null;
    } catch (e) {
      print('Error creating collection: $e');
      return null;
    }
  }
  
  // Mock data for development
  static List<Playlist> _getMockPlaylists() {
    return [
      Playlist(
        id: '1',
        name: 'Favorites',
        description: 'My favorite videos',
        userId: 'user123',
        videoIds: ['vid1', 'vid2', 'vid3'],
        thumbnailUrl: 'https://example.com/thumb1.jpg',
        isPrivate: false,
        createdAt: DateTime.now().subtract(const Duration(days: 30)),
        updatedAt: DateTime.now().subtract(const Duration(days: 1)),
        videoCount: 15,
        totalDuration: 1800,
        type: PlaylistType.favorites,
        tags: ['favorite', 'best'],
        isCollaborative: false,
        collaborators: [],
      ),
      Playlist(
        id: '2',
        name: 'Watch Later',
        description: 'Videos to watch later',
        userId: 'user123',
        videoIds: ['vid4', 'vid5'],
        thumbnailUrl: 'https://example.com/thumb2.jpg',
        isPrivate: true,
        createdAt: DateTime.now().subtract(const Duration(days: 20)),
        updatedAt: DateTime.now().subtract(const Duration(hours: 2)),
        videoCount: 8,
        totalDuration: 960,
        type: PlaylistType.watchLater,
        tags: ['later', 'todo'],
        isCollaborative: false,
        collaborators: [],
      ),
      Playlist(
        id: '3',
        name: 'Dance Compilation',
        description: 'Best dance videos',
        userId: 'user123',
        videoIds: ['vid6', 'vid7', 'vid8'],
        thumbnailUrl: 'https://example.com/thumb3.jpg',
        isPrivate: false,
        createdAt: DateTime.now().subtract(const Duration(days: 10)),
        updatedAt: DateTime.now().subtract(const Duration(minutes: 30)),
        videoCount: 12,
        totalDuration: 1440,
        type: PlaylistType.custom,
        tags: ['dance', 'music'],
        isCollaborative: true,
        collaborators: ['user456', 'user789'],
      ),
    ];
  }
  
  static List<Collection> _getMockCollections() {
    return [
      Collection(
        id: '1',
        name: 'My Collections',
        description: 'Main collection',
        userId: 'user123',
        playlistIds: ['1', '2', '3'],
        thumbnailUrl: 'https://example.com/collection1.jpg',
        isPrivate: false,
        createdAt: DateTime.now().subtract(const Duration(days: 60)),
        updatedAt: DateTime.now().subtract(const Duration(days: 1)),
        playlistCount: 3,
        type: CollectionType.custom,
        tags: ['main', 'personal'],
      ),
      Collection(
        id: '2',
        name: 'Shared with Friends',
        description: 'Collaborative collections',
        userId: 'user123',
        playlistIds: ['3'],
        thumbnailUrl: 'https://example.com/collection2.jpg',
        isPrivate: false,
        createdAt: DateTime.now().subtract(const Duration(days: 30)),
        updatedAt: DateTime.now().subtract(const Duration(hours: 5)),
        playlistCount: 1,
        type: CollectionType.shared,
        tags: ['shared', 'friends'],
      ),
    ];
  }
}