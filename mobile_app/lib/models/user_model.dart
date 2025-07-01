class User {
  final String id;
  final String username;
  final String email;
  final String? profileImageUrl;
  final String? bio;
  final int followersCount;
  final int followingCount;
  final int videosCount;
  final int totalLikes;
  final bool isVerified;
  final DateTime createdAt;
  final DateTime? lastActiveAt;
  final List<String> followingIds;
  final List<String> followerIds;
  final Map<String, dynamic>? metadata;

  User({
    required this.id,
    required this.username,
    required this.email,
    this.profileImageUrl,
    this.bio,
    this.followersCount = 0,
    this.followingCount = 0,
    this.videosCount = 0,
    this.totalLikes = 0,
    this.isVerified = false,
    required this.createdAt,
    this.lastActiveAt,
    this.followingIds = const [],
    this.followerIds = const [],
    this.metadata,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['_id'] ?? json['id'] ?? '',
      username: json['username'] ?? '',
      email: json['email'] ?? '',
      profileImageUrl: json['profileImageUrl'] ?? json['profileImage'],
      bio: json['bio'],
      followersCount: json['followersCount'] ?? json['followers']?.length ?? 0,
      followingCount: json['followingCount'] ?? json['following']?.length ?? 0,
      videosCount: json['videosCount'] ?? json['videos']?.length ?? 0,
      totalLikes: json['totalLikes'] ?? json['likesReceived'] ?? 0,
      isVerified: json['isVerified'] ?? false,
      createdAt: json['createdAt'] != null 
          ? DateTime.parse(json['createdAt']) 
          : DateTime.now(),
      lastActiveAt: json['lastActiveAt'] != null 
          ? DateTime.parse(json['lastActiveAt']) 
          : null,
      followingIds: List<String>.from(json['following'] ?? json['followingIds'] ?? []),
      followerIds: List<String>.from(json['followers'] ?? json['followerIds'] ?? []),
      metadata: json['metadata'] as Map<String, dynamic>?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'username': username,
      'email': email,
      'profileImageUrl': profileImageUrl,
      'bio': bio,
      'followersCount': followersCount,
      'followingCount': followingCount,
      'videosCount': videosCount,
      'totalLikes': totalLikes,
      'isVerified': isVerified,
      'createdAt': createdAt.toIso8601String(),
      'lastActiveAt': lastActiveAt?.toIso8601String(),
      'followingIds': followingIds,
      'followerIds': followerIds,
      'metadata': metadata,
    };
  }
}