/// Clean video entity with no dependencies on external packages
/// This ensures the domain layer stays pure
class VideoEntity {
  final String id;
  final String userId;
  final String username;
  final String? userAvatar;
  final String videoUrl;
  final String? thumbnailUrl;
  final String? description;
  final List<String> tags;
  final String? musicId;
  final String? musicName;
  final int viewsCount;
  final int likesCount;
  final int commentsCount;
  final int sharesCount;
  final bool isLiked;
  final bool isFollowing;
  final DateTime createdAt;
  final Duration duration;
  final bool isFrontCamera; // For horizontal flipping during playback

  const VideoEntity({
    required this.id,
    required this.userId,
    required this.username,
    this.userAvatar,
    required this.videoUrl,
    this.thumbnailUrl,
    this.description,
    this.tags = const [],
    this.musicId,
    this.musicName,
    this.viewsCount = 0,
    this.likesCount = 0,
    this.commentsCount = 0,
    this.sharesCount = 0,
    this.isLiked = false,
    this.isFollowing = false,
    required this.createdAt,
    required this.duration,
    this.isFrontCamera = false,
  });
  
  VideoEntity copyWith({
    bool? isLiked,
    bool? isFollowing,
    int? likesCount,
    int? viewsCount,
    int? commentsCount,
    int? sharesCount,
  }) {
    return VideoEntity(
      id: id,
      userId: userId,
      username: username,
      userAvatar: userAvatar,
      videoUrl: videoUrl,
      thumbnailUrl: thumbnailUrl,
      description: description,
      tags: tags,
      musicId: musicId,
      musicName: musicName,
      viewsCount: viewsCount ?? this.viewsCount,
      likesCount: likesCount ?? this.likesCount,
      commentsCount: commentsCount ?? this.commentsCount,
      sharesCount: sharesCount ?? this.sharesCount,
      isLiked: isLiked ?? this.isLiked,
      isFollowing: isFollowing ?? this.isFollowing,
      createdAt: createdAt,
      duration: duration,
      isFrontCamera: isFrontCamera,
    );
  }
}