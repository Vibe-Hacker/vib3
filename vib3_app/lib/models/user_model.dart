class User {
  final String id;
  final String username;
  final String email;
  final String? displayName;
  final String? profilePicture;
  final String? bio;
  final int followers;
  final int following;
  final int totalLikes;
  final DateTime createdAt;
  final bool isFollowing;

  User({
    required this.id,
    required this.username,
    required this.email,
    this.displayName,
    this.profilePicture,
    this.bio,
    this.followers = 0,
    this.following = 0,
    this.totalLikes = 0,
    required this.createdAt,
    this.isFollowing = false,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    print('🔍 User.fromJson: Parsing user data: $json');
    
    return User(
      id: json['_id'] ?? json['id'] ?? '',
      username: json['username'] ?? '',
      email: json['email'] ?? '',
      displayName: json['displayName'] ?? json['display_name'] ?? json['username'],
      profilePicture: json['profilePicture'] ?? json['profile_picture'] ?? json['profileImage'] ?? json['avatar'],
      bio: json['bio'] ?? json['description'] ?? '',
      followers: json['followers'] ?? json['followersCount'] ?? json['followers_count'] ?? 0,
      following: json['following'] ?? json['followingCount'] ?? json['following_count'] ?? 0,
      totalLikes: json['totalLikes'] ?? json['total_likes'] ?? json['likesCount'] ?? json['likes_count'] ?? 0,
      createdAt: json['createdAt'] != null 
          ? DateTime.parse(json['createdAt'])
          : (json['created_at'] != null 
              ? DateTime.parse(json['created_at'])
              : DateTime.now()),
      isFollowing: json['isFollowing'] ?? json['is_following'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'username': username,
      'email': email,
      'displayName': displayName,
      'profilePicture': profilePicture,
      'bio': bio,
      'followers': followers,
      'following': following,
      'totalLikes': totalLikes,
      'createdAt': createdAt.toIso8601String(),
      'isFollowing': isFollowing,
    };
  }

  User copyWith({
    String? id,
    String? username,
    String? email,
    String? displayName,
    String? profilePicture,
    String? bio,
    int? followers,
    int? following,
    int? totalLikes,
    DateTime? createdAt,
    bool? isFollowing,
  }) {
    return User(
      id: id ?? this.id,
      username: username ?? this.username,
      email: email ?? this.email,
      displayName: displayName ?? this.displayName,
      profilePicture: profilePicture ?? this.profilePicture,
      bio: bio ?? this.bio,
      followers: followers ?? this.followers,
      following: following ?? this.following,
      totalLikes: totalLikes ?? this.totalLikes,
      createdAt: createdAt ?? this.createdAt,
      isFollowing: isFollowing ?? this.isFollowing,
    );
  }
}