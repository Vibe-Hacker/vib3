class Video {
  final String id;
  final String userId;
  final String? videoUrl;
  final String? thumbnailUrl;
  final String? description;
  final int likesCount;
  final int commentsCount;
  final int sharesCount;
  final int viewsCount;
  final int duration; // in seconds
  final bool isPrivate;
  final DateTime createdAt;
  final DateTime updatedAt;
  final Map<String, dynamic>? user;

  Video({
    required this.id,
    required this.userId,
    this.videoUrl,
    this.thumbnailUrl,
    this.description,
    required this.likesCount,
    required this.commentsCount,
    required this.sharesCount,
    required this.viewsCount,
    required this.duration,
    required this.isPrivate,
    required this.createdAt,
    required this.updatedAt,
    this.user,
  });

  factory Video.fromJson(Map<String, dynamic> json) {
    return Video(
      id: json['_id'] ?? '',
      userId: json['userid'] ?? '',
      videoUrl: json['videoUrl'] ?? '',
      thumbnailUrl: json['thumbnailurl'] ?? '',
      description: json['title'] ?? json['description'] ?? 'Untitled',
      likesCount: json['likecount'] ?? json['likes'] ?? 0,
      commentsCount: json['commentcount'] ?? json['comments'] ?? 0,
      sharesCount: json['sharecount'] ?? 0,
      viewsCount: json['views'] ?? 0,
      duration: json['duration'] ?? 30,
      isPrivate: json['isPrivate'] ?? false,
      createdAt: json['createdat'] != null 
          ? DateTime.parse(json['createdat']) 
          : DateTime.now(),
      updatedAt: json['updatedat'] != null 
          ? DateTime.parse(json['updatedat']) 
          : DateTime.now(),
      user: json['user'] ?? {'username': json['username']},
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'videoUrl': videoUrl,
      'thumbnailUrl': thumbnailUrl,
      'description': description,
      'likesCount': likesCount,
      'commentsCount': commentsCount,
      'sharesCount': sharesCount,
      'viewsCount': viewsCount,
      'duration': duration,
      'isPrivate': isPrivate,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      'user': user,
    };
  }

  Video copyWith({
    String? id,
    String? userId,
    String? videoUrl,
    String? thumbnailUrl,
    String? description,
    int? likesCount,
    int? commentsCount,
    int? sharesCount,
    int? viewsCount,
    int? duration,
    bool? isPrivate,
    DateTime? createdAt,
    DateTime? updatedAt,
    Map<String, dynamic>? user,
  }) {
    return Video(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      videoUrl: videoUrl ?? this.videoUrl,
      thumbnailUrl: thumbnailUrl ?? this.thumbnailUrl,
      description: description ?? this.description,
      likesCount: likesCount ?? this.likesCount,
      commentsCount: commentsCount ?? this.commentsCount,
      sharesCount: sharesCount ?? this.sharesCount,
      viewsCount: viewsCount ?? this.viewsCount,
      duration: duration ?? this.duration,
      isPrivate: isPrivate ?? this.isPrivate,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      user: user ?? this.user,
    );
  }
}