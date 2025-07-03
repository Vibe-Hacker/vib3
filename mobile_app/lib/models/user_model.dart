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
    };
  }
}