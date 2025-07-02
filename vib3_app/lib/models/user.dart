class User {
  final String id;
  final String username;
  final String email;
  final String? profileImageUrl;
  final String? bio;
  final int followersCount;
  final int followingCount;
  final int videosCount;
  final bool isVerified;
  final DateTime? createdAt;

  const User({
    required this.id,
    required this.username,
    required this.email,
    this.profileImageUrl,
    this.bio,
    required this.followersCount,
    required this.followingCount,
    required this.videosCount,
    this.isVerified = false,
    this.createdAt,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['_id'] ?? json['id'] ?? '',
      username: json['username'] ?? '',
      email: json['email'] ?? '',
      profileImageUrl: json['profileImageUrl'] ?? json['profileImage'] ?? json['avatar'],
      bio: json['bio'] ?? json['description'],
      followersCount: json['followersCount'] ?? json['followers'] ?? 0,
      followingCount: json['followingCount'] ?? json['following'] ?? 0,
      videosCount: json['videosCount'] ?? json['videoCount'] ?? json['videos'] ?? 0,
      isVerified: json['isVerified'] ?? json['verified'] ?? false,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'])
          : null,
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
      'isVerified': isVerified,
      'createdAt': createdAt?.toIso8601String(),
    };
  }

  User copyWith({
    String? id,
    String? username,
    String? email,
    String? profileImageUrl,
    String? bio,
    int? followersCount,
    int? followingCount,
    int? videosCount,
    bool? isVerified,
    DateTime? createdAt,
  }) {
    return User(
      id: id ?? this.id,
      username: username ?? this.username,
      email: email ?? this.email,
      profileImageUrl: profileImageUrl ?? this.profileImageUrl,
      bio: bio ?? this.bio,
      followersCount: followersCount ?? this.followersCount,
      followingCount: followingCount ?? this.followingCount,
      videosCount: videosCount ?? this.videosCount,
      isVerified: isVerified ?? this.isVerified,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  @override
  String toString() {
    return 'User(id: $id, username: $username, email: $email)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is User && other.id == id;
  }

  @override
  int get hashCode => id.hashCode;
}