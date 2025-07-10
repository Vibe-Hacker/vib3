class Comment {
  final String id;
  final String videoId;
  final String userId;
  final String username;
  final String text;
  int likesCount;
  final List<Comment> replies;
  final DateTime createdAt;
  final Map<String, dynamic>? user;
  bool isLiked;
  final bool isPinned;
  final String? parentId;
  final bool hasMoreReplies;
  final int totalReplies;

  Comment({
    required this.id,
    required this.videoId,
    required this.userId,
    required this.username,
    required this.text,
    this.likesCount = 0,
    this.replies = const [],
    required this.createdAt,
    this.user,
    this.isLiked = false,
    this.isPinned = false,
    this.parentId,
    this.hasMoreReplies = false,
    this.totalReplies = 0,
  });

  factory Comment.fromJson(Map<String, dynamic> json) {
    return Comment(
      id: json['_id'] ?? json['id'] ?? '',
      videoId: json['videoId'] ?? '',
      userId: json['userId'] ?? '',
      username: json['username'] ?? json['user']?['username'] ?? 'Unknown',
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
      isPinned: json['isPinned'] ?? false,
      parentId: json['parentId'],
      hasMoreReplies: json['hasMoreReplies'] ?? false,
      totalReplies: json['totalReplies'] ?? json['replies']?.length ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'videoId': videoId,
      'userId': userId,
      'username': username,
      'text': text,
      'likesCount': likesCount,
      'replies': replies.map((reply) => reply.toJson()).toList(),
      'createdAt': createdAt.toIso8601String(),
      'user': user,
      'isLiked': isLiked,
      'isPinned': isPinned,
      'parentId': parentId,
      'hasMoreReplies': hasMoreReplies,
      'totalReplies': totalReplies,
    };
  }
}