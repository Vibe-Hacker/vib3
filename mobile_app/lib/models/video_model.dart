class Video {
  final String id;
  final String userId;
  final String username;
  final String? userProfileImage;
  final String videoUrl;
  final String? thumbnailUrl;
  final String description;
  final List<String> tags;
  int likeCount;
  int commentCount;
  int shareCount;
  bool isLiked;
  bool isFollowing;
  final DateTime createdAt;
  final double? duration;
  final String? musicTitle;
  final String? musicArtist;

  Video({
    required this.id,
    required this.userId,
    required this.username,
    this.userProfileImage,
    required this.videoUrl,
    this.thumbnailUrl,
    required this.description,
    this.tags = const [],
    this.likeCount = 0,
    this.commentCount = 0,
    this.shareCount = 0,
    this.isLiked = false,
    this.isFollowing = false,
    required this.createdAt,
    this.duration,
    this.musicTitle,
    this.musicArtist,
  });

  factory Video.fromJson(Map<String, dynamic> json) {
    return Video(
      id: json['_id'] ?? json['id'] ?? '',
      userId: json['userId'] ?? json['user']?['_id'] ?? json['uploadedBy'] ?? '',
      username: json['username'] ?? json['user']?['username'] ?? json['uploaderUsername'] ?? '',
      userProfileImage: json['userProfileImage'] ?? json['user']?['profileImageUrl'] ?? json['user']?['profileImage'],
      videoUrl: json['videoUrl'] ?? json['url'] ?? json['fileUrl'] ?? '',
      thumbnailUrl: json['thumbnailUrl'] ?? json['thumbnail'] ?? json['thumbnailUrl'],
      description: json['description'] ?? json['caption'] ?? '',
      tags: List<String>.from(json['tags'] ?? json['hashtags'] ?? []),
      likeCount: json['likeCount'] ?? json['likes']?.length ?? json['likesCount'] ?? 0,
      commentCount: json['commentCount'] ?? json['comments']?.length ?? json['commentsCount'] ?? 0,
      shareCount: json['shareCount'] ?? json['shares']?.length ?? json['sharesCount'] ?? 0,
      isLiked: json['isLiked'] ?? json['userLiked'] ?? false,
      isFollowing: json['isFollowing'] ?? json['userFollowing'] ?? false,
      createdAt: json['createdAt'] != null 
          ? DateTime.parse(json['createdAt']) 
          : (json['uploadedAt'] != null ? DateTime.parse(json['uploadedAt']) : DateTime.now()),
      duration: (json['duration'] ?? json['videoDuration'])?.toDouble(),
      musicTitle: json['musicTitle'] ?? json['audioTitle'],
      musicArtist: json['musicArtist'] ?? json['audioArtist'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'username': username,
      'userProfileImage': userProfileImage,
      'videoUrl': videoUrl,
      'thumbnailUrl': thumbnailUrl,
      'description': description,
      'tags': tags,
      'likeCount': likeCount,
      'commentCount': commentCount,
      'shareCount': shareCount,
      'isLiked': isLiked,
      'isFollowing': isFollowing,
      'createdAt': createdAt.toIso8601String(),
      'duration': duration,
      'musicTitle': musicTitle,
      'musicArtist': musicArtist,
    };
  }
}