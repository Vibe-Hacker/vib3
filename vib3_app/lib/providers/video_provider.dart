import 'package:flutter/foundation.dart';
import '../models/video.dart';
import '../services/video_service.dart';
import '../services/user_service.dart';

class VideoProvider extends ChangeNotifier {
  final List<Video> _videos = [];
  final List<Video> _forYouVideos = [];
  final List<Video> _followingVideos = [];
  final List<Video> _discoverVideos = [];
  final List<Video> _friendsVideos = [];
  bool _isLoading = false;
  bool _isLoadingMore = false;
  bool _hasMoreVideos = true;
  String? _error;
  String _debugInfo = 'Not loaded yet';
  int _currentPage = 0;
  final int _pageSize = 20;
  Function? _pauseVideoCallback;
  
  // Track liked videos and followed users
  final Set<String> _likedVideoIds = {};
  final Set<String> _followedUserIds = {};

  List<Video> get videos => _videos;
  List<Video> get forYouVideos => _forYouVideos;
  List<Video> get followingVideos => _followingVideos;
  List<Video> get discoverVideos => _discoverVideos;
  List<Video> get friendsVideos => _friendsVideos;
  bool get isLoading => _isLoading;
  bool get isLoadingMore => _isLoadingMore;
  bool get hasMoreVideos => _hasMoreVideos;
  String? get error => _error;
  String get debugInfo => _debugInfo;
  
  // Getters for like/follow state
  bool isVideoLiked(String videoId) => _likedVideoIds.contains(videoId);
  bool isUserFollowed(String userId) => _followedUserIds.contains(userId);

  Future<void> loadAllVideos(String token) async {
    try {
      print('VideoProvider: Starting to load all videos...');
      _isLoading = true;
      _error = null;
      _debugInfo = 'Loading...';
      _currentPage = 0;
      _hasMoreVideos = true;
      notifyListeners();

      final videos = await VideoService.getAllVideos(token);
      print('VideoProvider: Received ${videos.length} videos');
      _videos.clear();
      _videos.addAll(videos);
      _debugInfo = 'Loaded ${videos.length} videos from server';
      
      // Always enable infinite scroll - will cycle through existing videos when server runs out
      _hasMoreVideos = true;
      _currentPage++;
      
      notifyListeners();
    } catch (e) {
      print('VideoProvider: Error loading videos: $e');
      _error = 'Failed to load videos: $e';
      _debugInfo = 'Error: $e';
      notifyListeners();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> loadMoreVideos(String token) async {
    if (_isLoadingMore) return;

    try {
      print('VideoProvider: Loading more videos (cycling existing ${_videos.length} videos)...');
      _isLoadingMore = true;
      _error = null;
      notifyListeners();

      // Try to get more videos from server with different strategies
      List<Video> newVideos = [];
      
      // Strategy 1: Try pagination
      newVideos = await VideoService.getVideosPage(token, _currentPage, _pageSize);
      print('VideoProvider: Page $_currentPage returned ${newVideos.length} videos');
      
      // Strategy 2: If no new videos and it's early pages, try different limits
      if (newVideos.isEmpty && _currentPage < 3) {
        print('VideoProvider: Trying with different page size...');
        newVideos = await VideoService.getVideosPage(token, _currentPage, 100);
        print('VideoProvider: Larger page size returned ${newVideos.length} videos');
      }
      
      // Strategy 3: If still no videos, try getting all videos again (server might not support pagination)
      if (newVideos.isEmpty && _currentPage < 2) {
        print('VideoProvider: Trying to get all videos (server might not support pagination)...');
        newVideos = await VideoService.getAllVideos(token);
        print('VideoProvider: getAllVideos returned ${newVideos.length} videos');
      }
      
      if (newVideos.isNotEmpty) {
        // Add new unique videos
        int addedCount = 0;
        for (final video in newVideos) {
          if (!_videos.any((existing) => existing.id == video.id)) {
            _videos.add(video);
            addedCount++;
          }
        }
        print('VideoProvider: Added $addedCount new unique videos');
        _currentPage++;
        
        // Only recycle if we truly have no new content after multiple attempts
        if (addedCount == 0 && _currentPage > 2) {
          print('VideoProvider: No new unique videos found, starting to recycle');
          final existingVideos = List<Video>.from(_videos.take(_videos.length ~/ 2));
          _videos.addAll(existingVideos);
        }
      } else if (_videos.isNotEmpty) {
        // Only recycle as last resort
        final existingVideos = List<Video>.from(_videos);
        _videos.addAll(existingVideos);
        print('VideoProvider: No new videos available, recycling ${existingVideos.length} videos');
      }
      
      _debugInfo = 'Total videos: ${_videos.length} (cycling for infinite scroll)';
      _hasMoreVideos = true; // Always true for infinite cycling
      
      notifyListeners();
    } catch (e) {
      print('VideoProvider: Error loading more videos: $e');
      // Don't show error for infinite scroll - just keep cycling existing videos
      if (_videos.isNotEmpty) {
        final existingVideos = List<Video>.from(_videos);
        _videos.addAll(existingVideos);
        _debugInfo = 'Cycling ${existingVideos.length} videos (server error)';
        notifyListeners();
      }
    } finally {
      _isLoadingMore = false;
      notifyListeners();
    }
  }

  Future<void> loadUserVideos(String userId, String token) async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      final videos = await VideoService.getUserVideos(userId, token);
      _videos.clear();
      _videos.addAll(videos);
      
      notifyListeners();
    } catch (e) {
      _error = 'Failed to load videos: $e';
      notifyListeners();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void removeVideo(String videoId) {
    _videos.removeWhere((video) => video.id == videoId);
    _debugInfo = 'Removed video $videoId. Total videos: ${_videos.length}';
    notifyListeners();
  }

  Future<void> loadForYouVideos(String token) async {
    try {
      print('VideoProvider: Loading Vib3 Pulse videos...');
      _isLoading = true;
      _error = null;
      notifyListeners();

      // For You uses the main feed algorithm
      final videos = await VideoService.getAllVideos(token);
      _forYouVideos.clear();
      _forYouVideos.addAll(videos);
      
      // Also populate main videos list for backward compatibility
      _videos.clear();
      _videos.addAll(videos);
      
      _debugInfo = 'Loaded ${videos.length} Vib3 Pulse videos';
      
      notifyListeners();
    } catch (e) {
      print('VideoProvider: Error loading Vib3 Pulse videos: $e');
      _error = 'Failed to load videos: $e';
      notifyListeners();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> loadFollowingVideos(String token) async {
    try {
      print('VideoProvider: Loading Vib3 Connect videos...');
      _isLoading = true;
      _error = null;
      notifyListeners();

      // Following feed - fallback to all videos for now
      final videos = await VideoService.getAllVideos(token);
      _followingVideos.clear();
      _followingVideos.addAll(videos);
      
      // Also populate main videos list for backward compatibility
      _videos.clear();
      _videos.addAll(videos);
      
      _debugInfo = 'Loaded ${videos.length} Vib3 Connect videos';
      
      notifyListeners();
    } catch (e) {
      print('VideoProvider: Error loading Vib3 Connect videos: $e');
      _error = 'Failed to load videos: $e';
      notifyListeners();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> loadDiscoverVideos(String token) async {
    try {
      print('VideoProvider: Loading Discover videos...');
      _isLoading = true;
      _error = null;
      notifyListeners();

      // Discover feed - fallback to all videos for now
      final videos = await VideoService.getAllVideos(token);
      _discoverVideos.clear();
      _discoverVideos.addAll(videos);
      
      // Also populate main videos list for backward compatibility
      _videos.clear();
      _videos.addAll(videos);
      
      _debugInfo = 'Loaded ${videos.length} Discover videos';
      
      notifyListeners();
    } catch (e) {
      print('VideoProvider: Error loading Discover videos: $e');
      _error = 'Failed to load videos: $e';
      notifyListeners();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> loadFriendsVideos(String token) async {
    try {
      print('VideoProvider: Loading Vib3 Circle videos...');
      _isLoading = true;
      _error = null;
      notifyListeners();

      // Friends feed - fallback to all videos for now
      final videos = await VideoService.getAllVideos(token);
      _friendsVideos.clear();
      _friendsVideos.addAll(videos);
      
      // Also populate main videos list for backward compatibility
      _videos.clear();
      _videos.addAll(videos);
      
      _debugInfo = 'Loaded ${videos.length} Vib3 Circle videos';
      
      notifyListeners();
    } catch (e) {
      print('VideoProvider: Error loading Vib3 Circle videos: $e');
      _error = 'Failed to load videos: $e';
      notifyListeners();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Register a callback to pause video
  void registerPauseCallback(Function callback) {
    _pauseVideoCallback = callback;
  }

  // Call this when navigating away from video feed
  void pauseCurrentVideo() {
    if (_pauseVideoCallback != null) {
      _pauseVideoCallback!();
    }
  }
  
  // Handle video like/unlike
  Future<bool> toggleLike(String videoId, String token) async {
    try {
      final isLiked = _likedVideoIds.contains(videoId);
      
      // Optimistic update
      if (isLiked) {
        _likedVideoIds.remove(videoId);
      } else {
        _likedVideoIds.add(videoId);
      }
      
      // Update video like count locally
      _updateVideoLikeCount(videoId, !isLiked);
      notifyListeners();
      
      // Call API
      bool success;
      if (!isLiked) {
        success = await VideoService.likeVideo(videoId, token);
      } else {
        success = await VideoService.unlikeVideo(videoId, token);
      }
      
      if (!success) {
        // Revert on failure
        if (isLiked) {
          _likedVideoIds.add(videoId);
        } else {
          _likedVideoIds.remove(videoId);
        }
        _updateVideoLikeCount(videoId, isLiked);
        notifyListeners();
      }
      
      return success;
    } catch (e) {
      print('VideoProvider: Error toggling like: $e');
      return false;
    }
  }
  
  // Handle user follow/unfollow
  Future<bool> toggleFollow(String userId, String token) async {
    try {
      final isFollowing = _followedUserIds.contains(userId);
      
      // Optimistic update
      if (isFollowing) {
        _followedUserIds.remove(userId);
      } else {
        _followedUserIds.add(userId);
      }
      notifyListeners();
      
      // Call API
      bool success;
      if (!isFollowing) {
        success = await VideoService.followUser(userId, token);
      } else {
        success = await VideoService.unfollowUser(userId, token);
      }
      
      if (!success) {
        // Revert on failure
        if (isFollowing) {
          _followedUserIds.add(userId);
        } else {
          _followedUserIds.remove(userId);
        }
        notifyListeners();
      }
      
      return success;
    } catch (e) {
      print('VideoProvider: Error toggling follow: $e');
      return false;
    }
  }
  
  // Update video like count locally
  void _updateVideoLikeCount(String videoId, bool increment) {
    // Update in all video lists
    for (final videoList in [_videos, _forYouVideos, _followingVideos, _discoverVideos, _friendsVideos]) {
      final index = videoList.indexWhere((v) => v.id == videoId);
      if (index != -1) {
        final video = videoList[index];
        final newLikeCount = increment ? video.likesCount + 1 : video.likesCount - 1;
        videoList[index] = Video(
          id: video.id,
          userId: video.userId,
          videoUrl: video.videoUrl,
          thumbnailUrl: video.thumbnailUrl,
          description: video.description,
          likesCount: newLikeCount,
          commentsCount: video.commentsCount,
          sharesCount: video.sharesCount,
          viewsCount: video.viewsCount,
          duration: video.duration,
          isPrivate: video.isPrivate,
          createdAt: video.createdAt,
          updatedAt: video.updatedAt,
          user: video.user,
          musicName: video.musicName,
        );
      }
    }
  }
  
  // Initialize liked videos and followed users from server
  Future<void> initializeLikesAndFollows(String token) async {
    try {
      print('VideoProvider: Initializing likes and follows...');
      
      // Get user's liked videos
      final likedVideos = await VideoService.getUserLikedVideos(token);
      _likedVideoIds.clear();
      _likedVideoIds.addAll(likedVideos.map((v) => v.id));
      print('VideoProvider: Initialized ${_likedVideoIds.length} liked videos');
      
      // Get user's followed users
      final followedUsers = await VideoService.getUserFollowedUsers(token);
      _followedUserIds.clear();
      _followedUserIds.addAll(followedUsers);
      print('VideoProvider: Initialized ${_followedUserIds.length} followed users');
      
      notifyListeners();
    } catch (e) {
      print('VideoProvider: Error initializing likes and follows: $e');
    }
  }
}