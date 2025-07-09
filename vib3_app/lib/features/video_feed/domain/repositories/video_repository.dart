import '../entities/video_entity.dart';

/// Repository interface for video operations
/// This isolates data access from business logic
abstract class VideoRepository {
  // Query operations
  Future<List<VideoEntity>> getForYouVideos({int page = 0, int limit = 20});
  Future<List<VideoEntity>> getFollowingVideos({int page = 0, int limit = 20});
  Future<List<VideoEntity>> getUserVideos(String userId);
  Future<VideoEntity?> getVideoById(String videoId);
  
  // Interaction operations
  Future<bool> likeVideo(String videoId);
  Future<bool> unlikeVideo(String videoId);
  Future<int> getVideoLikes(String videoId);
  
  // View tracking
  Future<void> incrementViewCount(String videoId);
  Future<void> trackWatchTime(String videoId, Duration watchTime);
}