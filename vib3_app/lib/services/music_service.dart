import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';

class MusicService {
  // TikTok uses multiple music sources:
  // 1. Original sounds from users
  // 2. Licensed music from record labels
  // 3. Sound effects library
  // 4. Trending audio clips
  
  static String get baseUrl => AppConfig.baseUrl;
  
  // Music categories like TikTok
  static const List<String> musicCategories = [
    'Trending',
    'Pop',
    'Hip Hop',
    'Electronic',
    'Rock',
    'R&B',
    'Country',
    'Latin',
    'K-Pop',
    'Indie',
    'Classical',
    'Jazz',
    'Sound Effects',
    'Original Sounds',
    'Viral',
    'Mood',
    'Workout',
    'Chill',
    'Party',
    'Love',
  ];
  
  // Fetch trending music
  static Future<List<MusicTrack>> getTrendingMusic({
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/music/trending?page=$page&limit=$limit'),
      );
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return (data['tracks'] as List)
            .map((track) => MusicTrack.fromJson(track))
            .toList();
      }
      throw Exception('Failed to load trending music');
    } catch (e) {
      print('Error fetching trending music: $e');
      return _getMockTrendingMusic(); // Fallback to mock data
    }
  }
  
  // Search music by query
  static Future<List<MusicTrack>> searchMusic({
    required String query,
    String? category,
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final params = {
        'q': query,
        'page': page.toString(),
        'limit': limit.toString(),
      };
      
      if (category != null) {
        params['category'] = category;
      }
      
      final response = await http.get(
        Uri.parse('$baseUrl/api/music/search').replace(queryParameters: params),
      );
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return (data['tracks'] as List)
            .map((track) => MusicTrack.fromJson(track))
            .toList();
      }
      throw Exception('Failed to search music');
    } catch (e) {
      print('Error searching music: $e');
      return _getMockSearchResults(query);
    }
  }
  
  // Get music by category
  static Future<List<MusicTrack>> getMusicByCategory({
    required String category,
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/music/category/$category?page=$page&limit=$limit'),
      );
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return (data['tracks'] as List)
            .map((track) => MusicTrack.fromJson(track))
            .toList();
      }
      throw Exception('Failed to load music by category');
    } catch (e) {
      print('Error fetching music by category: $e');
      return _getMockCategoryMusic(category);
    }
  }
  
  // Get saved/favorite music
  static Future<List<MusicTrack>> getSavedMusic() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/music/saved'),
        headers: AppConfig.authHeaders,
      );
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return (data['tracks'] as List)
            .map((track) => MusicTrack.fromJson(track))
            .toList();
      }
      throw Exception('Failed to load saved music');
    } catch (e) {
      print('Error fetching saved music: $e');
      return [];
    }
  }
  
  // Save/unsave music
  static Future<bool> toggleSaveMusic(String trackId) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/music/save/$trackId'),
        headers: AppConfig.authHeaders,
      );
      
      return response.statusCode == 200;
    } catch (e) {
      print('Error saving music: $e');
      return false;
    }
  }
  
  // Get music details with full info
  static Future<MusicTrack?> getMusicDetails(String trackId) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/music/track/$trackId'),
      );
      
      if (response.statusCode == 200) {
        return MusicTrack.fromJson(json.decode(response.body));
      }
      return null;
    } catch (e) {
      print('Error fetching music details: $e');
      return null;
    }
  }
  
  // Report music (copyright, inappropriate, etc.)
  static Future<bool> reportMusic({
    required String trackId,
    required String reason,
    String? details,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/music/report'),
        headers: {
          ...AppConfig.authHeaders,
          'Content-Type': 'application/json',
        },
        body: json.encode({
          'trackId': trackId,
          'reason': reason,
          'details': details,
        }),
      );
      
      return response.statusCode == 200;
    } catch (e) {
      print('Error reporting music: $e');
      return false;
    }
  }
  
  // Mock data for development/fallback
  static List<MusicTrack> _getMockTrendingMusic() {
    return [
      MusicTrack(
        id: '1',
        title: 'Summer Vibes',
        artist: 'DJ Sunshine',
        duration: 30,
        coverUrl: 'https://picsum.photos/200?random=1',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        isExplicit: false,
        plays: 1500000,
        likes: 250000,
        category: 'Electronic',
        tags: ['summer', 'upbeat', 'dance'],
      ),
      MusicTrack(
        id: '2',
        title: 'Night Drive',
        artist: 'Midnight Cruiser',
        duration: 45,
        coverUrl: 'https://picsum.photos/200?random=2',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
        isExplicit: false,
        plays: 980000,
        likes: 180000,
        category: 'Hip Hop',
        tags: ['night', 'chill', 'bass'],
      ),
      MusicTrack(
        id: '3',
        title: 'Happy Days',
        artist: 'Feel Good Inc',
        duration: 25,
        coverUrl: 'https://picsum.photos/200?random=3',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
        isExplicit: false,
        plays: 2100000,
        likes: 420000,
        category: 'Pop',
        tags: ['happy', 'uplifting', 'viral'],
      ),
      // Add more mock tracks...
    ];
  }
  
  static List<MusicTrack> _getMockSearchResults(String query) {
    // Filter mock data based on query
    return _getMockTrendingMusic()
        .where((track) =>
            track.title.toLowerCase().contains(query.toLowerCase()) ||
            track.artist.toLowerCase().contains(query.toLowerCase()) ||
            track.tags.any((tag) => tag.toLowerCase().contains(query.toLowerCase())))
        .toList();
  }
  
  static List<MusicTrack> _getMockCategoryMusic(String category) {
    // Filter mock data by category
    return _getMockTrendingMusic()
        .where((track) => track.category.toLowerCase() == category.toLowerCase())
        .toList();
  }
}

// Enhanced Music Track Model
class MusicTrack {
  final String id;
  final String title;
  final String artist;
  final int duration; // in seconds
  final String coverUrl;
  final String audioUrl;
  final String? previewUrl; // 15-30 second preview
  final bool isExplicit;
  final int plays;
  final int likes;
  final String category;
  final List<String> tags;
  final bool isOriginalSound;
  final String? originalVideoId; // If it's from a user video
  final String? originalUsername;
  final DateTime? addedAt;
  final bool isSaved;
  final bool isPremium; // For licensed music
  final Map<String, dynamic>? metadata; // Additional info like BPM, key, etc.
  
  MusicTrack({
    required this.id,
    required this.title,
    required this.artist,
    required this.duration,
    required this.coverUrl,
    required this.audioUrl,
    this.previewUrl,
    this.isExplicit = false,
    this.plays = 0,
    this.likes = 0,
    required this.category,
    this.tags = const [],
    this.isOriginalSound = false,
    this.originalVideoId,
    this.originalUsername,
    this.addedAt,
    this.isSaved = false,
    this.isPremium = false,
    this.metadata,
  });
  
  factory MusicTrack.fromJson(Map<String, dynamic> json) {
    return MusicTrack(
      id: json['_id'] ?? json['id'] ?? '',
      title: json['title'] ?? 'Unknown Title',
      artist: json['artist'] ?? 'Unknown Artist',
      duration: json['duration'] ?? 30,
      coverUrl: json['coverUrl'] ?? 'https://picsum.photos/200',
      audioUrl: json['audioUrl'] ?? '',
      previewUrl: json['previewUrl'],
      isExplicit: json['isExplicit'] ?? false,
      plays: json['plays'] ?? 0,
      likes: json['likes'] ?? 0,
      category: json['category'] ?? 'Other',
      tags: List<String>.from(json['tags'] ?? []),
      isOriginalSound: json['isOriginalSound'] ?? false,
      originalVideoId: json['originalVideoId'],
      originalUsername: json['originalUsername'],
      addedAt: json['addedAt'] != null 
          ? DateTime.parse(json['addedAt']) 
          : null,
      isSaved: json['isSaved'] ?? false,
      isPremium: json['isPremium'] ?? false,
      metadata: json['metadata'],
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'artist': artist,
      'duration': duration,
      'coverUrl': coverUrl,
      'audioUrl': audioUrl,
      'previewUrl': previewUrl,
      'isExplicit': isExplicit,
      'plays': plays,
      'likes': likes,
      'category': category,
      'tags': tags,
      'isOriginalSound': isOriginalSound,
      'originalVideoId': originalVideoId,
      'originalUsername': originalUsername,
      'addedAt': addedAt?.toIso8601String(),
      'isSaved': isSaved,
      'isPremium': isPremium,
      'metadata': metadata,
    };
  }
  
  // Format duration for display
  String get formattedDuration {
    final minutes = duration ~/ 60;
    final seconds = duration % 60;
    return '${minutes}:${seconds.toString().padLeft(2, '0')}';
  }
  
  // Format plays count
  String get formattedPlays {
    if (plays >= 1000000) {
      return '${(plays / 1000000).toStringAsFixed(1)}M';
    } else if (plays >= 1000) {
      return '${(plays / 1000).toStringAsFixed(1)}K';
    }
    return plays.toString();
  }
}