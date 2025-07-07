class Comment {
  final String id;
  final String videoId;
  final String userId;
  final String text;
  final int likesCount;
  final List<Comment> replies;
  final DateTime createdAt;
  final Map<String, dynamic>? user;
  final bool isLiked;

  Comment({
    required this.id,
    required this.videoId,
    required this.userId,
    required this.text,
    this.likesCount = 0,
    this.replies = const [],
    required this.createdAt,
    this.user,
    this.isLiked = false,
  });

  factory Comment.fromJson(Map<String, dynamic> json) {
    return Comment(
      id: json['_id'] ?? json['id'] ?? '',
      videoId: json['videoId'] ?? '',
      userId: json['userId'] ?? '',
      text: json['text'] ?? json['content'] ?? '',
      likesCount: json['likesCount'] ?? json['likes'] ?? 0,
      replies: (json['replies'] as List?)
          ?.map((reply) => Comment.fromJson(reply))
          .toList() ?? [],
      createdAt: json['createdAt'] != null 
          ? DateTime.parse(json['createdAt']) 
          : DateTime.now(),
      user: json['user'],
      isLiked: json['isLiked'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'videoId': videoId,
      'userId': userId,
      'text': text,
      'likesCount': likesCount,
      'replies': replies.map((reply) => reply.toJson()).toList(),
      'createdAt': createdAt.toIso8601String(),
      'user': user,
      'isLiked': isLiked,
    };
  }
}