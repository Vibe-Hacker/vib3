class LiveStream {
  final String id;
  final String hostId;
  final String hostUsername;
  final String? hostProfilePicture;
  final String title;
  final String? description;
  final String streamUrl;
  final String? thumbnailUrl;
  final int viewerCount;
  final int likeCount;
  final bool isLive;
  final DateTime startedAt;
  final DateTime? endedAt;
  final List<String> tags;
  final String? categoryId;
  final String? categoryName;
  final bool isFollowersOnly;
  final bool commentsEnabled;
  final bool giftsEnabled;
  final int totalGifts;
  final Map<String, dynamic>? streamStats;
  
  LiveStream({
    required this.id,
    required this.hostId,
    required this.hostUsername,
    this.hostProfilePicture,
    required this.title,
    this.description,
    required this.streamUrl,
    this.thumbnailUrl,
    this.viewerCount = 0,
    this.likeCount = 0,
    this.isLive = true,
    required this.startedAt,
    this.endedAt,
    this.tags = const [],
    this.categoryId,
    this.categoryName,
    this.isFollowersOnly = false,
    this.commentsEnabled = true,
    this.giftsEnabled = true,
    this.totalGifts = 0,
    this.streamStats,
  });
  
  factory LiveStream.fromJson(Map<String, dynamic> json) {
    return LiveStream(
      id: json['_id'] ?? json['id'] ?? '',
      hostId: json['hostId'] ?? '',
      hostUsername: json['hostUsername'] ?? 'Unknown',
      hostProfilePicture: json['hostProfilePicture'],
      title: json['title'] ?? 'Live Stream',
      description: json['description'],
      streamUrl: json['streamUrl'] ?? '',
      thumbnailUrl: json['thumbnailUrl'],
      viewerCount: json['viewerCount'] ?? 0,
      likeCount: json['likeCount'] ?? 0,
      isLive: json['isLive'] ?? true,
      startedAt: json['startedAt'] != null 
          ? DateTime.parse(json['startedAt']) 
          : DateTime.now(),
      endedAt: json['endedAt'] != null 
          ? DateTime.parse(json['endedAt']) 
          : null,
      tags: List<String>.from(json['tags'] ?? []),
      categoryId: json['categoryId'],
      categoryName: json['categoryName'],
      isFollowersOnly: json['isFollowersOnly'] ?? false,
      commentsEnabled: json['commentsEnabled'] ?? true,
      giftsEnabled: json['giftsEnabled'] ?? true,
      totalGifts: json['totalGifts'] ?? 0,
      streamStats: json['streamStats'],
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'hostId': hostId,
      'hostUsername': hostUsername,
      'hostProfilePicture': hostProfilePicture,
      'title': title,
      'description': description,
      'streamUrl': streamUrl,
      'thumbnailUrl': thumbnailUrl,
      'viewerCount': viewerCount,
      'likeCount': likeCount,
      'isLive': isLive,
      'startedAt': startedAt.toIso8601String(),
      'endedAt': endedAt?.toIso8601String(),
      'tags': tags,
      'categoryId': categoryId,
      'categoryName': categoryName,
      'isFollowersOnly': isFollowersOnly,
      'commentsEnabled': commentsEnabled,
      'giftsEnabled': giftsEnabled,
      'totalGifts': totalGifts,
      'streamStats': streamStats,
    };
  }
  
  String get formattedViewers {
    if (viewerCount >= 1000000) {
      return '${(viewerCount / 1000000).toStringAsFixed(1)}M';
    } else if (viewerCount >= 1000) {
      return '${(viewerCount / 1000).toStringAsFixed(1)}K';
    }
    return viewerCount.toString();
  }
  
  Duration get duration {
    final end = endedAt ?? DateTime.now();
    return end.difference(startedAt);
  }
}