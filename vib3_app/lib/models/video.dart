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
  final String? musicName;
  final List<String>? hashtags;
  final String? caption;
  final String? soundId;
  final String? category;
  final Map<String, dynamic>? location;
  final String username;
  final bool isFrontCamera; // Track if video was recorded with front camera for horizontal flip

  // Interaction states
  final bool isLiked;
  final bool isFollowing;
  final bool isFavorited;
  final bool hasCommented;
  final bool hasShared;

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
    this.musicName,
    this.hashtags,
    this.caption,
    this.soundId,
    this.category,
    this.location,
    required this.username,
    this.isFrontCamera = false,
    this.isLiked = false,
    this.isFollowing = false,
    this.isFavorited = false,
    this.hasCommented = false,
    this.hasShared = false,
  });

  factory Video.fromJson(Map<String, dynamic> json) {
    final isFrontCameraValue = json['isFrontCamera'] ?? false;
    print('📹 Video.fromJson: id=${json['_id']}, isFrontCamera=$isFrontCameraValue');

    return Video(
      id: json['_id'] ?? '',
      userId: json['userId'] ?? json['userid'] ?? '',
      videoUrl: json['videoUrl']?.toString(),
      thumbnailUrl: json['thumbnailUrl'] ?? json['thumbnailurl'] ?? '',
      description: json['title'] ?? json['description'] ?? 'Untitled',
      likesCount: json['likeCount'] ?? json['likecount'] ?? json['likes'] ?? 0,
      commentsCount: json['commentCount'] ?? json['commentcount'] ?? json['comments'] ?? 0,
      sharesCount: json['shareCount'] ?? json['sharecount'] ?? 0,
      viewsCount: json['views'] ?? 0,
      duration: json['duration'] ?? 30,
      isPrivate: json['isPrivate'] ?? false,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : (json['createdat'] != null
              ? DateTime.parse(json['createdat'])
              : DateTime.now()),
      updatedAt: json['updatedAt'] != null
          ? DateTime.parse(json['updatedAt'])
          : (json['updatedat'] != null
              ? DateTime.parse(json['updatedat'])
              : DateTime.now()),
      user: json['user'] ?? {'username': json['username']},
      musicName: json['musicName'] ?? json['music_name'],
      hashtags: json['hashtags'] != null
          ? List<String>.from(json['hashtags'])
          : null,
      caption: json['caption'] ?? json['description'],
      soundId: json['soundId'] ?? json['sound_id'],
      category: json['category'],
      location: json['location'],
      username: json['username'] ?? json['user']?['username'] ?? 'unknown',
      isFrontCamera: isFrontCameraValue,
      isLiked: json['isLiked'] ?? false,
      isFollowing: json['isFollowing'] ?? false,
      isFavorited: json['isFavorited'] ?? false,
      hasCommented: json['hasCommented'] ?? false,
      hasShared: json['hasShared'] ?? false,
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
      'musicName': musicName,
      'hashtags': hashtags,
      'caption': caption,
      'soundId': soundId,
      'category': category,
      'location': location,
      'username': username,
      'isFrontCamera': isFrontCamera,
      'isLiked': isLiked,
      'isFollowing': isFollowing,
      'isFavorited': isFavorited,
      'hasCommented': hasCommented,
      'hasShared': hasShared,
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
    String? musicName,
    List<String>? hashtags,
    String? caption,
    String? soundId,
    String? category,
    Map<String, dynamic>? location,
    String? username,
    bool? isFrontCamera,
    bool? isLiked,
    bool? isFollowing,
    bool? isFavorited,
    bool? hasCommented,
    bool? hasShared,
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
      musicName: musicName ?? this.musicName,
      hashtags: hashtags ?? this.hashtags,
      caption: caption ?? this.caption,
      soundId: soundId ?? this.soundId,
      category: category ?? this.category,
      location: location ?? this.location,
      username: username ?? this.username,
      isFrontCamera: isFrontCamera ?? this.isFrontCamera,
      isLiked: isLiked ?? this.isLiked,
      isFollowing: isFollowing ?? this.isFollowing,
      isFavorited: isFavorited ?? this.isFavorited,
      hasCommented: hasCommented ?? this.hasCommented,
      hasShared: hasShared ?? this.hasShared,
    );
  }
}