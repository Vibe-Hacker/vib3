import 'package:flutter/foundation.dart';
import '../../domain/entities/video_entity.dart';
import '../../domain/repositories/video_repository.dart';
import '../../domain/usecases/like_video_usecase.dart';
import '../../../../core/di/service_locator.dart';

/// Provider for video feed using repository pattern
/// This replaces direct VideoService usage
class VideoFeedProvider extends ChangeNotifier {
  final VideoRepository _repository;
  final LikeVideoUseCase _likeVideoUseCase;
  
  // Video lists for different feeds
  List<VideoEntity> _forYouVideos = [];
  List<VideoEntity> _followingVideos = [];
  List<VideoEntity> _friendsVideos = [];
  
  // Loading states
  bool _isLoadingForYou = false;
  bool _isLoadingFollowing = false;
  bool _isLoadingFriends = false;
  
  // Pagination
  int _forYouPage = 0;
  int _followingPage = 0;
  int _friendsPage = 0;
  
  // Error handling
  String? _error;
  
  VideoFeedProvider({
    VideoRepository? repository,
    LikeVideoUseCase? likeVideoUseCase,
  }) : _repository = repository ?? ServiceLocator.get<VideoRepository>(),
       _likeVideoUseCase = likeVideoUseCase ?? LikeVideoUseCase(ServiceLocator.get<VideoRepository>());
  
  // Getters
  List<VideoEntity> get forYouVideos => _forYouVideos;
  List<VideoEntity> get followingVideos => _followingVideos;
  List<VideoEntity> get friendsVideos => _friendsVideos;
  
  bool get isLoadingForYou => _isLoadingForYou;
  bool get isLoadingFollowing => _isLoadingFollowing;
  bool get isLoadingFriends => _isLoadingFriends;
  
  String? get error => _error;
  bool get hasError => _error != null;
  
  // Load videos for "For You" feed
  Future<void> loadForYouVideos({bool refresh = false}) async {
    if (_isLoadingForYou) return;
    
    _isLoadingForYou = true;
    _error = null;
    
    if (refresh) {
      _forYouPage = 0;
      _forYouVideos = [];
    }
    
    notifyListeners();
    
    try {
      final videos = await _repository.getForYouVideos(
        page: _forYouPage,
        limit: 20,
      );
      
      if (refresh) {
        _forYouVideos = videos;
      } else {
        _forYouVideos.addAll(videos);
      }
      
      if (videos.isNotEmpty) {
        _forYouPage++;
      }
    } catch (e) {
      _error = 'Failed to load videos: $e';
      print(_error);
    } finally {
      _isLoadingForYou = false;
      notifyListeners();
    }
  }
  
  // Load videos for "Following" feed
  Future<void> loadFollowingVideos({bool refresh = false}) async {
    if (_isLoadingFollowing) return;
    
    _isLoadingFollowing = true;
    _error = null;
    
    if (refresh) {
      _followingPage = 0;
      _followingVideos = [];
    }
    
    notifyListeners();
    
    try {
      final videos = await _repository.getFollowingVideos(
        page: _followingPage,
        limit: 20,
      );
      
      if (refresh) {
        _followingVideos = videos;
      } else {
        _followingVideos.addAll(videos);
      }
      
      if (videos.isNotEmpty) {
        _followingPage++;
      }
    } catch (e) {
      _error = 'Failed to load following videos: $e';
      print(_error);
    } finally {
      _isLoadingFollowing = false;
      notifyListeners();
    }
  }
  
  // Load videos for "Friends" feed (currently same as following)
  Future<void> loadFriendsVideos({bool refresh = false}) async {
    if (_isLoadingFriends) return;
    
    _isLoadingFriends = true;
    _error = null;
    
    if (refresh) {
      _friendsPage = 0;
      _friendsVideos = [];
    }
    
    notifyListeners();
    
    try {
      // For now, use the same endpoint as following
      final videos = await _repository.getFollowingVideos(
        page: _friendsPage,
        limit: 20,
      );
      
      if (refresh) {
        _friendsVideos = videos;
      } else {
        _friendsVideos.addAll(videos);
      }
      
      if (videos.isNotEmpty) {
        _friendsPage++;
      }
    } catch (e) {
      _error = 'Failed to load friends videos: $e';
      print(_error);
    } finally {
      _isLoadingFriends = false;
      notifyListeners();
    }
  }
  
  // Like/unlike a video
  Future<void> toggleLike(String videoId, bool currentLikeStatus) async {
    try {
      final updatedVideo = await _likeVideoUseCase.execute(
        videoId: videoId,
        isLiked: currentLikeStatus,
      );
      
      if (updatedVideo != null) {
        // Update the video in all lists
        _updateVideoInLists(updatedVideo);
        notifyListeners();
      }
    } catch (e) {
      print('Failed to toggle like: $e');
    }
  }
  
  // Track video view
  Future<void> trackView(String videoId) async {
    try {
      await _repository.incrementViewCount(videoId);
    } catch (e) {
      print('Failed to track view: $e');
    }
  }
  
  // Track watch time
  Future<void> trackWatchTime(String videoId, Duration watchTime) async {
    try {
      await _repository.trackWatchTime(videoId, watchTime);
    } catch (e) {
      print('Failed to track watch time: $e');
    }
  }
  
  // Helper method to update video in all lists
  void _updateVideoInLists(VideoEntity updatedVideo) {
    // Update in for you list
    final forYouIndex = _forYouVideos.indexWhere((v) => v.id == updatedVideo.id);
    if (forYouIndex != -1) {
      _forYouVideos[forYouIndex] = updatedVideo;
    }
    
    // Update in following list
    final followingIndex = _followingVideos.indexWhere((v) => v.id == updatedVideo.id);
    if (followingIndex != -1) {
      _followingVideos[followingIndex] = updatedVideo;
    }
    
    // Update in friends list
    final friendsIndex = _friendsVideos.indexWhere((v) => v.id == updatedVideo.id);
    if (friendsIndex != -1) {
      _friendsVideos[friendsIndex] = updatedVideo;
    }
  }
  
  // Clear error
  void clearError() {
    _error = null;
    notifyListeners();
  }
  
  // Refresh all feeds
  Future<void> refreshAll() async {
    await Future.wait([
      loadForYouVideos(refresh: true),
      loadFollowingVideos(refresh: true),
      loadFriendsVideos(refresh: true),
    ]);
  }
}