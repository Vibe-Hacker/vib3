/// Clean user entity with no dependencies on external packages
class UserEntity {
  final String id;
  final String username;
  final String email;
  final String? profilePicture;
  final String? bio;
  final int followersCount;
  final int followingCount;
  final int videosCount;
  final bool isVerified;
  final DateTime createdAt;
  
  const UserEntity({
    required this.id,
    required this.username,
    required this.email,
    this.profilePicture,
    this.bio,
    this.followersCount = 0,
    this.followingCount = 0,
    this.videosCount = 0,
    this.isVerified = false,
    required this.createdAt,
  });
  
  UserEntity copyWith({
    String? username,
    String? email,
    String? profilePicture,
    String? bio,
    int? followersCount,
    int? followingCount,
    int? videosCount,
    bool? isVerified,
  }) {
    return UserEntity(
      id: id,
      username: username ?? this.username,
      email: email ?? this.email,
      profilePicture: profilePicture ?? this.profilePicture,
      bio: bio ?? this.bio,
      followersCount: followersCount ?? this.followersCount,
      followingCount: followingCount ?? this.followingCount,
      videosCount: videosCount ?? this.videosCount,
      isVerified: isVerified ?? this.isVerified,
      createdAt: createdAt,
    );
  }
}