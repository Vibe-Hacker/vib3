import '../repositories/video_repository.dart';
import '../entities/video_entity.dart';

/// Use case for liking/unliking videos
/// Encapsulates the business logic for video interactions
class LikeVideoUseCase {
  final VideoRepository _repository;
  
  LikeVideoUseCase(this._repository);
  
  Future<VideoEntity?> execute({
    required String videoId,
    required bool isLiked,
  }) async {
    try {
      // Toggle like status
      final success = isLiked 
          ? await _repository.unlikeVideo(videoId)
          : await _repository.likeVideo(videoId);
          
      if (!success) {
        throw Exception('Failed to update like status');
      }
      
      // Get updated video with new like count
      final updatedVideo = await _repository.getVideoById(videoId);
      return updatedVideo;
      
    } catch (e) {
      // Handle errors gracefully
      print('LikeVideoUseCase error: $e');
      return null;
    }
  }
}