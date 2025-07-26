import 'user_model.dart';

enum StoryType {
  photo,
  video,
  text,
}

class Story {
  final String id;
  final String userId;
  final User user;
  final List<StorySegment> segments;
  final int viewsCount;
  final DateTime expiresAt;
  final DateTime createdAt;
  final DateTime updatedAt;
  
  Story({
    required this.id,
    required this.userId,
    required this.user,
    required this.segments,
    this.viewsCount = 0,
    required this.expiresAt,
    required this.createdAt,
    required this.updatedAt,
  });
  
  bool get isExpired => DateTime.now().isAfter(expiresAt);
  bool get hasUnseenSegments => segments.any((s) => !s.isSeen);
  
  factory Story.fromJson(Map<String, dynamic> json) {
    return Story(
      id: json['id'] as String,
      userId: json['userId'] as String,
      user: User.fromJson(json['user']),
      segments: (json['segments'] as List<dynamic>)
          .map((e) => StorySegment.fromJson(e as Map<String, dynamic>))
          .toList(),
      viewsCount: json['viewsCount'] as int? ?? 0,
      expiresAt: DateTime.parse(json['expiresAt'] as String),
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'user': user.toJson(),
      'segments': segments.map((e) => e.toJson()).toList(),
      'viewsCount': viewsCount,
      'expiresAt': expiresAt.toIso8601String(),
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }
}

class StorySegment {
  final String id;
  final StoryType type;
  final String mediaUrl;
  final String? thumbnailUrl;
  final String? caption;
  final String? backgroundColor;
  final Map<String, dynamic>? stickers;
  final Map<String, dynamic>? filters;
  final double? duration;
  final bool isSeen;
  final bool isLiked;
  final List<String> viewerIds;
  final DateTime createdAt;
  
  StorySegment({
    required this.id,
    required this.type,
    required this.mediaUrl,
    this.thumbnailUrl,
    this.caption,
    this.backgroundColor,
    this.stickers,
    this.filters,
    this.duration,
    this.isSeen = false,
    this.isLiked = false,
    this.viewerIds = const [],
    required this.createdAt,
  });
  
  factory StorySegment.fromJson(Map<String, dynamic> json) {
    return StorySegment(
      id: json['id'] as String,
      type: StoryType.values.firstWhere(
        (e) => e.toString() == 'StoryType.${json['type']}',
        orElse: () => StoryType.photo,
      ),
      mediaUrl: json['mediaUrl'] as String,
      thumbnailUrl: json['thumbnailUrl'] as String?,
      caption: json['caption'] as String?,
      backgroundColor: json['backgroundColor'] as String?,
      stickers: json['stickers'] as Map<String, dynamic>?,
      filters: json['filters'] as Map<String, dynamic>?,
      duration: (json['duration'] as num?)?.toDouble(),
      isSeen: json['isSeen'] as bool? ?? false,
      isLiked: json['isLiked'] as bool? ?? false,
      viewerIds: (json['viewerIds'] as List<dynamic>?)?.cast<String>() ?? [],
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'type': type.toString().split('.').last,
      'mediaUrl': mediaUrl,
      'thumbnailUrl': thumbnailUrl,
      'caption': caption,
      'backgroundColor': backgroundColor,
      'stickers': stickers,
      'filters': filters,
      'duration': duration,
      'isSeen': isSeen,
      'isLiked': isLiked,
      'viewerIds': viewerIds,
      'createdAt': createdAt.toIso8601String(),
    };
  }
}