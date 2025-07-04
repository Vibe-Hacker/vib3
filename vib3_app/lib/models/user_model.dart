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
    return User(
      id: json['_id'] ?? json['id'] ?? '',
      username: json['username'] ?? '',
      email: json['email'] ?? '',
      displayName: json['displayName'] ?? json['username'],
      profilePicture: json['profilePicture'],
      bio: json['bio'],
      followers: json['followers'] ?? 0,
      following: json['following'] ?? 0,
      totalLikes: json['totalLikes'] ?? 0,
      createdAt: json['createdAt'] != null 
          ? DateTime.parse(json['createdAt'])
          : DateTime.now(),
      isFollowing: json['isFollowing'] ?? false,
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