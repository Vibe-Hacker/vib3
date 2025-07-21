import '../../domain/entities/video_entity.dart';

/// Data Transfer Object for Video
/// Handles JSON serialization/deserialization
class VideoDTO {
  final String id;
  final String userId;
  final String username;
  final String? userAvatar;
  final String videoUrl;
  final String? thumbnailUrl;
  final String? description;
  final List<String> tags;
  final String? musicId;
  final String? musicName;
  final int viewsCount;
  final int likesCount;
  final int commentsCount;
  final int sharesCount;
  final bool isLiked;
  final bool isFollowing;
  final DateTime createdAt;
  final int durationInSeconds;
  
  VideoDTO({
    required this.id,
    required this.userId,
    required this.username,
    this.userAvatar,
    required this.videoUrl,
    this.thumbnailUrl,
    this.description,
    this.tags = const [],
    this.musicId,
    this.musicName,
    this.viewsCount = 0,
    this.likesCount = 0,
    this.commentsCount = 0,
    this.sharesCount = 0,
    this.isLiked = false,
    this.isFollowing = false,
    required this.createdAt,
    this.durationInSeconds = 30,
  });
  
  /// Convert from JSON
  factory VideoDTO.fromJson(Map<String, dynamic> json) {
    // Handle various field name conventions from backend
    final id = json['_id']?.toString() ?? json['id']?.toString() ?? '';
    final userId = json['userId']?.toString() ?? json['userid']?.toString() ?? '';
    
    // Extract video URL
    String? videoUrl = json['videoUrl']?.toString();
    final originalUrl = videoUrl;
    if (videoUrl != null) {
      if (!videoUrl.startsWith('http')) {
        // Only prepend base URL if it's a relative path
        videoUrl = 'https://vib3-videos.nyc3.digitaloceanspaces.com/$videoUrl';
      }
      
      // Fix various URL duplication patterns
      if (videoUrl.contains('nyc3.digitaloceanspaces.com/videos/nyc3.digitaloceanspaces.com')) {
        videoUrl = videoUrl.replaceAll('nyc3.digitaloceanspaces.com/videos/nyc3.digitaloceanspaces.com', 'nyc3.digitaloceanspaces.com');
      }
      
      // Fix the specific pattern we're seeing
      if (videoUrl.contains('/videos/nyc3.digitaloceanspaces.com/vib3-videos/videos/')) {
        videoUrl = videoUrl.replaceAll('/videos/nyc3.digitaloceanspaces.com/vib3-videos/videos/', '/videos/');
      }
      
      // General fix for any duplicated domain in path
      final uri = Uri.parse(videoUrl);
      if (uri.pathSegments.contains('nyc3.digitaloceanspaces.com')) {
        // Remove the duplicated domain from path
        final fixedPath = uri.path
            .replaceAll('/nyc3.digitaloceanspaces.com/vib3-videos', '')
            .replaceAll('/vib3-videos/videos/', '/videos/');
        videoUrl = uri.replace(path: fixedPath).toString();
      }
      
      // Debug log URL transformation
      if (originalUrl != videoUrl) {
        print('🔧 Fixed video URL from: $originalUrl');
        print('🔧 Fixed video URL to: $videoUrl');
      }
    }
    
    // Extract duration
    int duration = 30;
    final processingInfo = json['processingInfo'];
    if (processingInfo != null && processingInfo['videoInfo'] != null) {
      final videoInfo = processingInfo['videoInfo'];
      if (videoInfo['duration'] != null && videoInfo['duration'] != 'N/A') {
        try {
          duration = (double.parse(videoInfo['duration'].toString())).round();
        } catch (e) {
          // Keep default
        }
      }
    }
    
    // Extract user info
    final userInfo = json['userInfo'] ?? {};
    final username = userInfo['username']?.toString() ?? 
                    json['username']?.toString() ?? 
                    'user_$userId';
    final userAvatar = userInfo['profilePicture']?.toString() ?? 
                      json['userAvatar']?.toString();
    
    return VideoDTO(
      id: id,
      userId: userId,
      username: username,
      userAvatar: userAvatar,
      videoUrl: videoUrl ?? '',
      thumbnailUrl: json['thumbnailUrl']?.toString(),
      description: json['title']?.toString() ?? 
                  json['description']?.toString() ?? 
                  'Video',
      tags: _parseTags(json['tags']),
      musicId: json['musicId']?.toString(),
      musicName: json['musicName']?.toString(),
      viewsCount: _parseIntSafely(json['views'] ?? json['viewsCount'] ?? 0),
      likesCount: _parseIntSafely(json['likeCount'] ?? json['likes'] ?? 0),
      commentsCount: _parseIntSafely(json['commentCount'] ?? json['comments'] ?? 0),
      sharesCount: _parseIntSafely(json['shareCount'] ?? json['shares'] ?? 0),
      isLiked: json['isLiked'] ?? false,
      isFollowing: json['isFollowing'] ?? false,
      createdAt: _parseDateTime(json['createdAt'] ?? json['createdat']),
      durationInSeconds: duration,
    );
  }
  
  /// Convert to JSON
  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'userId': userId,
      'username': username,
      'userAvatar': userAvatar,
      'videoUrl': videoUrl,
      'thumbnailUrl': thumbnailUrl,
      'description': description,
      'tags': tags,
      'musicId': musicId,
      'musicName': musicName,
      'views': viewsCount,
      'likeCount': likesCount,
      'commentCount': commentsCount,
      'shareCount': sharesCount,
      'isLiked': isLiked,
      'isFollowing': isFollowing,
      'createdAt': createdAt.toIso8601String(),
      'duration': durationInSeconds,
    };
  }
  
  /// Convert to domain entity
  VideoEntity toEntity() {
    return VideoEntity(
      id: id,
      userId: userId,
      username: username,
      userAvatar: userAvatar,
      videoUrl: videoUrl,
      thumbnailUrl: thumbnailUrl,
      description: description,
      tags: tags,
      musicId: musicId,
      musicName: musicName,
      viewsCount: viewsCount,
      likesCount: likesCount,
      commentsCount: commentsCount,
      sharesCount: sharesCount,
      isLiked: isLiked,
      isFollowing: isFollowing,
      createdAt: createdAt,
      duration: Duration(seconds: durationInSeconds),
    );
  }
  
  /// Create from domain entity
  factory VideoDTO.fromEntity(VideoEntity entity) {
    return VideoDTO(
      id: entity.id,
      userId: entity.userId,
      username: entity.username,
      userAvatar: entity.userAvatar,
      videoUrl: entity.videoUrl,
      thumbnailUrl: entity.thumbnailUrl,
      description: entity.description,
      tags: entity.tags,
      musicId: entity.musicId,
      musicName: entity.musicName,
      viewsCount: entity.viewsCount,
      likesCount: entity.likesCount,
      commentsCount: entity.commentsCount,
      sharesCount: entity.sharesCount,
      isLiked: entity.isLiked,
      isFollowing: entity.isFollowing,
      createdAt: entity.createdAt,
      durationInSeconds: entity.duration.inSeconds,
    );
  }
  
  static List<String> _parseTags(dynamic tags) {
    if (tags == null) return [];
    if (tags is List) {
      return tags.map((e) => e.toString()).toList();
    }
    return [];
  }
  
  static int _parseIntSafely(dynamic value) {
    if (value == null) return 0;
    if (value is int) return value;
    if (value is String) {
      return int.tryParse(value) ?? 0;
    }
    return 0;
  }
  
  static DateTime _parseDateTime(dynamic value) {
    if (value == null) return DateTime.now();
    if (value is DateTime) return value;
    if (value is String) {
      return DateTime.tryParse(value) ?? DateTime.now();
    }
    return DateTime.now();
  }
}