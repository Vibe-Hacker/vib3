class Video {
  final String id;
  final String userId;
  final String videoUrl;
  final String? thumbnailUrl;
  final String? description;
  final int likes;
  final int comments;
  final int shares;
  final DateTime createdAt;
  final Map<String, dynamic>? user;

  Video({
    required this.id,
    required this.userId,
    required this.videoUrl,
    this.thumbnailUrl,
    this.description,
    this.likes = 0,
    this.comments = 0,
    this.shares = 0,
    required this.createdAt,
    this.user,
  });

  factory Video.fromJson(Map<String, dynamic> json) {
    return Video(
      id: json['_id'] ?? json['id'] ?? '',
      userId: json['userId'] ?? '',
      videoUrl: json['videoUrl'] ?? '',
      thumbnailUrl: json['thumbnailUrl'],
      description: json['description'],
      likes: json['likeCount'] ?? json['likes']?.length ?? 0,
      comments: json['commentCount'] ?? 0,
      shares: json['shareCount'] ?? 0,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : DateTime.now(),
      user: json['user'],
    );
  }
}