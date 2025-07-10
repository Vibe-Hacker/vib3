import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';
import '../models/collection.dart';
import '../models/video.dart';

class CollectionService {
  // Get user's collections
  static Future<List<Collection>> getUserCollections(String token) async {
    try {
      final response = await http.get(
        Uri.parse('${AppConfig.baseUrl}/api/collections'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final List<dynamic> collectionsJson = data['collections'] ?? [];
        return collectionsJson.map((json) => Collection.fromJson(json)).toList();
      }
      
      return [];
    } catch (e) {
      print('Error getting collections: $e');
      return [];
    }
  }
  
  // Create new collection
  static Future<Collection?> createCollection({
    required String name,
    required String token,
    String? description,
    bool isPrivate = true,
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
          'isPrivate': isPrivate,
        }),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = jsonDecode(response.body);
        return Collection.fromJson(data['collection'] ?? data);
      }
      
      return null;
    } catch (e) {
      print('Error creating collection: $e');
      return null;
    }
  }
  
  // Add video to collection
  static Future<bool> addVideoToCollection({
    required String collectionId,
    required String videoId,
    required String token,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('${AppConfig.baseUrl}/api/collections/$collectionId/videos'),
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
      print('Error adding video to collection: $e');
      return false;
    }
  }
  
  // Remove video from collection
  static Future<bool> removeVideoFromCollection({
    required String collectionId,
    required String videoId,
    required String token,
  }) async {
    try {
      final response = await http.delete(
        Uri.parse('${AppConfig.baseUrl}/api/collections/$collectionId/videos/$videoId'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      return response.statusCode == 200;
    } catch (e) {
      print('Error removing video from collection: $e');
      return false;
    }
  }
  
  // Delete collection
  static Future<bool> deleteCollection(String collectionId, String token) async {
    try {
      final response = await http.delete(
        Uri.parse('${AppConfig.baseUrl}/api/collections/$collectionId'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      return response.statusCode == 200;
    } catch (e) {
      print('Error deleting collection: $e');
      return false;
    }
  }
  
  // Update collection
  static Future<bool> updateCollection({
    required String collectionId,
    required String token,
    String? name,
    String? description,
    bool? isPrivate,
  }) async {
    try {
      final body = <String, dynamic>{};
      if (name != null) body['name'] = name;
      if (description != null) body['description'] = description;
      if (isPrivate != null) body['isPrivate'] = isPrivate;
      
      final response = await http.put(
        Uri.parse('${AppConfig.baseUrl}/api/collections/$collectionId'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode(body),
      );

      return response.statusCode == 200;
    } catch (e) {
      print('Error updating collection: $e');
      return false;
    }
  }
  
  // Get videos in collection
  static Future<List<Video>> getCollectionVideos({
    required String collectionId,
    required String token,
  }) async {
    try {
      final response = await http.get(
        Uri.parse('${AppConfig.baseUrl}/api/collections/$collectionId/videos'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final List<dynamic> videosJson = data['videos'] ?? [];
        return videosJson.map((json) => Video.fromJson(json)).toList();
      }
      
      return [];
    } catch (e) {
      print('Error getting collection videos: $e');
      return [];
    }
  }
  
  // Quick save video to favorites (default collection)
  static Future<bool> saveToFavorites(String videoId, String token) async {
    try {
      final response = await http.post(
        Uri.parse('${AppConfig.baseUrl}/api/videos/$videoId/save'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      return response.statusCode == 200;
    } catch (e) {
      print('Error saving to favorites: $e');
      return false;
    }
  }
  
  // Remove from favorites
  static Future<bool> removeFromFavorites(String videoId, String token) async {
    try {
      final response = await http.delete(
        Uri.parse('${AppConfig.baseUrl}/api/videos/$videoId/save'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      return response.statusCode == 200;
    } catch (e) {
      print('Error removing from favorites: $e');
      return false;
    }
  }
}