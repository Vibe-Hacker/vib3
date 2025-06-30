class VideoModel {
  final String id;
  final String videoUrl;
  final String thumbnailUrl;
  final String userId;
  final String username;
  final String description;
  final int likes;
  final int comments;
  final int shares;
  final int views;
  final DateTime createdAt;
  final List<String> tags;

  VideoModel({
    required this.id,
    required this.videoUrl,
    required this.thumbnailUrl,
    required this.userId,
    required this.username,
    required this.description,
    required this.likes,
    required this.comments,
    required this.shares,
    required this.views,
    required this.createdAt,
    required this.tags,
  });

  factory VideoModel.fromJson(Map<String, dynamic> json) {
    return VideoModel(
      id: json['_id'] ?? json['id'] ?? '',
      videoUrl: json['videoUrl'] ?? '',
      thumbnailUrl: json['thumbnailUrl'] ?? '',
      userId: json['userId'] ?? '',
      username: json['username'] ?? 'anonymous',
      description: json['description'] ?? '',
      likes: json['likes'] ?? 0,
      comments: json['comments'] ?? 0,
      shares: json['shares'] ?? 0,
      views: json['views'] ?? 0,
      createdAt: json['createdAt'] != null 
          ? DateTime.parse(json['createdAt'])
          : DateTime.now(),
      tags: List<String>.from(json['tags'] ?? []),
    );
  }
}