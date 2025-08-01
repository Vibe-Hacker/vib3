import 'dart:math';
import 'package:flutter/foundation.dart';
import '../models/video.dart';
import '../services/video_service.dart';
import '../services/user_service.dart';
import '../widgets/video_feed.dart'; // For FeedType enum
import '../services/recommendation_engine.dart';
import '../providers/auth_provider.dart';
import '../services/video_performance_service.dart';

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
  
  // Performance-based quality adaptation
  final VideoPerformanceService _performanceService = VideoPerformanceService();
  VideoQuality _adaptiveQuality = VideoQuality.auto;

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

  Future<void> loadMoreVideos(String token, {FeedType? feedType}) async {
    if (_isLoadingMore) {
      print('VideoProvider: Already loading more videos, skipping duplicate request');
      return;
    }

    try {
      print('VideoProvider: Loading more videos for feed type: $feedType');
      _isLoadingMore = true;
      _error = null;
      // Don't notify listeners here - it causes UI to show loading states
      // notifyListeners();

      // Get more videos based on feed type
      List<Video> newVideos = [];
      
      switch (feedType) {
        case FeedType.forYou:
          // For "For You" feed, get more videos from server
          final offset = _forYouVideos.length;
          newVideos = await VideoService.getAllVideos(token, feed: 'foryou', offset: offset, limit: _pageSize);
          
          if (newVideos.isNotEmpty) {
            _forYouVideos.addAll(newVideos);
            print('VideoProvider: Loaded ${newVideos.length} new ForYou videos (total: ${_forYouVideos.length})');
          } else {
            // If no new videos, recycle existing ones for infinite scroll
            if (_forYouVideos.isNotEmpty) {
              final recycledVideos = List<Video>.from(_forYouVideos);
              recycledVideos.shuffle();
              _forYouVideos.addAll(recycledVideos);
              print('VideoProvider: Recycled ${recycledVideos.length} ForYou videos for infinite scroll');
            }
          }
          break;
          
        case FeedType.following:
          // For following feed, get more videos with pagination
          final offset = _followingVideos.length;
          newVideos = await VideoService.getFollowingVideos(token, offset: offset, limit: _pageSize);
          
          if (newVideos.isNotEmpty) {
            _followingVideos.addAll(newVideos);
            print('VideoProvider: Loaded ${newVideos.length} new Following videos (total: ${_followingVideos.length})');
          } else if (_followingVideos.isNotEmpty) {
            // When we run out of new videos, the service will wrap around for infinite scroll
            newVideos = await VideoService.getFollowingVideos(token, offset: offset, limit: _pageSize);
            if (newVideos.isNotEmpty) {
              _followingVideos.addAll(newVideos);
              print('VideoProvider: Wrapped around - loaded ${newVideos.length} Following videos for infinite scroll');
            }
          }
          break;
          
        case FeedType.friends:
          // For friends feed, get more videos with pagination
          final offset = _friendsVideos.length;
          newVideos = await VideoService.getFriendsVideos(token, offset: offset, limit: _pageSize);
          
          if (newVideos.isNotEmpty) {
            _friendsVideos.addAll(newVideos);
            print('VideoProvider: Loaded ${newVideos.length} new Friends videos (total: ${_friendsVideos.length})');
          } else {
            // If no new videos, recycle existing ones for infinite scroll
            if (_friendsVideos.isNotEmpty) {
              final recycledVideos = List<Video>.from(_friendsVideos);
              recycledVideos.shuffle();
              _friendsVideos.addAll(recycledVideos);
              print('VideoProvider: Recycled ${recycledVideos.length} Friends videos for infinite scroll');
            }
          }
          break;
          
        default:
          // Default case - load more from all videos
          final offset = _videos.length;
          newVideos = await VideoService.getAllVideos(token, offset: offset, limit: _pageSize);
          
          if (newVideos.isNotEmpty) {
            _videos.addAll(newVideos);
          } else if (_videos.isNotEmpty) {
            final recycledVideos = List<Video>.from(_videos);
            recycledVideos.shuffle();
            _videos.addAll(recycledVideos);
          }
      }
      
      _hasMoreVideos = true; // Always true for infinite scroll
      notifyListeners();
      
    } catch (e) {
      print('VideoProvider: Error loading more videos: $e');
      _error = 'Failed to load more videos';
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

  // Track if we're already loading ForYou videos
  bool _isLoadingForYou = false;
  
  Future<void> loadForYouVideos(String token) async {
    if (_isLoadingForYou) {
      print('VideoProvider: Already loading ForYou videos, skipping duplicate request');
      return;
    }
    
    try {
      print('VideoProvider: Loading Vib3 Pulse videos with recommendation algorithm...');
      print('VideoProvider: Auth token present: ${token.isNotEmpty}');
      _isLoadingForYou = true;
      _isLoading = true;
      _error = null;
      notifyListeners();

      // Get user ID from token/auth
      final authProvider = _getAuthProvider();
      final userId = authProvider?.currentUser?.id ?? 'anonymous';
      
      // Try to get personalized videos from backend first
      List<Video> allVideos = [];
      try {
        // Try the personalized endpoint if we have a real user ID
        if (userId != 'anonymous') {
          print('VideoProvider: Attempting to load personalized videos for user: $userId');
          allVideos = await VideoService.getPersonalizedVideos(userId, token, limit: 100);
          print('VideoProvider: Got ${allVideos.length} personalized videos from backend');
        } else {
          // Fallback to regular feed for anonymous users
          print('VideoProvider: Loading regular feed for anonymous user');
          allVideos = await VideoService.getAllVideos(token, feed: 'foryou', limit: 100);
          print('VideoProvider: Got ${allVideos.length} videos from server (anonymous user)');
        }
      } catch (e) {
        // Fallback to regular feed on error
        print('VideoProvider: Personalized endpoint failed with error: $e');
        print('VideoProvider: Attempting fallback to regular feed...');
        try {
          allVideos = await VideoService.getAllVideos(token, feed: 'foryou', limit: 100);
          print('VideoProvider: Fallback successful, got ${allVideos.length} videos');
        } catch (fallbackError) {
          print('VideoProvider: Fallback also failed: $fallbackError');
          allVideos = [];
        }
      }
      
      // Use recommendation engine to personalize the feed
      try {
        final recommendationEngine = RecommendationEngine();
        print('VideoProvider: Sending ${allVideos.length} candidate videos to recommendation engine');
        
        final personalizedVideos = await recommendationEngine.getRecommendations(
          userId: userId,
          candidateVideos: allVideos,
          count: min(50, allVideos.length), // Don't ask for more than available
        );
        
        print('VideoProvider: Recommendation engine returned ${personalizedVideos.length} videos');
        
        if (personalizedVideos.isEmpty && allVideos.isNotEmpty) {
          // If recommendation engine returns nothing but we have videos, use all videos
          print('VideoProvider: Recommendation engine returned empty, using all ${allVideos.length} videos');
          // Only update if different to avoid unnecessary rebuilds
          if (_forYouVideos.length != allVideos.length || 
              (_forYouVideos.isNotEmpty && _forYouVideos.first.id != allVideos.first.id)) {
            _forYouVideos.clear();
            _forYouVideos.addAll(allVideos);
          }
        } else {
          // Only update if the list is actually different
          bool isDifferent = _forYouVideos.length != personalizedVideos.length;
          if (!isDifferent && _forYouVideos.isNotEmpty && personalizedVideos.isNotEmpty) {
            // Check if the order changed
            for (int i = 0; i < _forYouVideos.length && i < personalizedVideos.length; i++) {
              if (_forYouVideos[i].id != personalizedVideos[i].id) {
                isDifferent = true;
                break;
              }
            }
          }
          
          if (isDifferent) {
            _forYouVideos.clear();
            _forYouVideos.addAll(personalizedVideos);
          } else {
            print('VideoProvider: Skipping update - videos haven\'t changed');
          }
        }
        
        print('VideoProvider: Final ForYou video count: ${_forYouVideos.length}');
      } catch (e) {
        print('VideoProvider: Recommendation engine error: $e, falling back to all videos');
        print('Stack trace: ${StackTrace.current}');
        _forYouVideos.clear();
        _forYouVideos.addAll(allVideos);
      }
      
      // Also populate main videos list for backward compatibility
      _videos.clear();
      _videos.addAll(_forYouVideos);
      
      _debugInfo = 'Loaded ${_forYouVideos.length} personalized Vib3 Pulse videos';
      
      print('VideoProvider: Successfully loaded ForYou feed with ${_forYouVideos.length} videos');
      _isLoading = false;
      // Only notify listeners once at the end, not during recommendation processing
      notifyListeners();
    } catch (e, stackTrace) {
      print('VideoProvider: Error loading Vib3 Pulse videos: $e');
      print('Stack trace: $stackTrace');
      _error = e.toString();
      // Don't clear videos if we already have some
      if (_forYouVideos.isEmpty) {
        print('VideoProvider: No existing videos, clearing lists');
        _forYouVideos.clear();
        _videos.clear();
      }
      _isLoading = false;
      notifyListeners();
    } finally {
      _isLoading = false;
      _isLoadingForYou = false;
    }
  }
  

  // Track if we're already loading Following videos
  bool _isLoadingFollowing = false;
  
  Future<void> loadFollowingVideos(String token) async {
    if (_isLoadingFollowing) {
      print('VideoProvider: Already loading Following videos, skipping duplicate request');
      return;
    }
    
    try {
      print('VideoProvider: Loading Vib3 Connect videos...');
      _isLoadingFollowing = true;
      _isLoading = true;
      _error = null;
      notifyListeners();

      // Following feed - only videos from accounts I follow
      final videos = await VideoService.getFollowingVideos(token, offset: 0, limit: 20);
      _followingVideos.clear();
      _followingVideos.addAll(videos);
      
      // Also populate main videos list for backward compatibility
      _videos.clear();
      _videos.addAll(videos);
      
      _debugInfo = 'Loaded ${videos.length} Vib3 Connect videos';
      
      notifyListeners();
    } catch (e, stackTrace) {
      print('VideoProvider: Error loading Vib3 Connect videos: $e');
      print('Stack trace: $stackTrace');
      _error = e.toString();
      _followingVideos.clear();
      _videos.clear();
      notifyListeners();
    } finally {
      _isLoading = false;
      _isLoadingFollowing = false;
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

  // Track if we're already loading Friends videos
  bool _isLoadingFriends = false;
  
  Future<void> loadFriendsVideos(String token) async {
    if (_isLoadingFriends) {
      print('VideoProvider: Already loading Friends videos, skipping duplicate request');
      return;
    }
    
    try {
      print('VideoProvider: Loading Vib3 Circle videos...');
      _isLoadingFriends = true;
      _isLoading = true;
      _error = null;
      notifyListeners();

      // Friends feed - only videos from mutual followers
      final videos = await VideoService.getFriendsVideos(token, offset: 0, limit: 20);
      _friendsVideos.clear();
      _friendsVideos.addAll(videos);
      
      // Also populate main videos list for backward compatibility
      _videos.clear();
      _videos.addAll(videos);
      
      _debugInfo = 'Loaded ${videos.length} Vib3 Circle videos';
      
      notifyListeners();
    } catch (e, stackTrace) {
      print('VideoProvider: Error loading Vib3 Circle videos: $e');
      print('Stack trace: $stackTrace');
      _error = e.toString();
      _friendsVideos.clear();
      _videos.clear();
      notifyListeners();
    } finally {
      _isLoading = false;
      _isLoadingFriends = false;
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
      } else {
        // Clear following/friends cache when follow state changes
        VideoService.clearFollowingCache();
        
        // Reload following and friends feeds to reflect the change
        loadFollowingVideos(token);
        loadFriendsVideos(token);
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
        videoList[index] = video.copyWith(
          likesCount: newLikeCount,
          isLiked: increment,
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
      // Don't set error state here as it's not critical for video loading
    }
  }
  
  // Helper method to get AuthProvider
  AuthProvider? _authProvider;
  
  void setAuthProvider(AuthProvider? provider) {
    _authProvider = provider;
  }
  
  AuthProvider? _getAuthProvider() {
    return _authProvider;
  }
  
  // Performance-based quality adaptation
  String getAdaptiveVideoUrl(String originalUrl) {
    final qualitySuffix = _performanceService.getQualitySuffix();
    
    // Apply quality suffix to URL if needed
    if (qualitySuffix.isNotEmpty && !originalUrl.contains(qualitySuffix)) {
      // Insert quality suffix before file extension
      final lastDot = originalUrl.lastIndexOf('.');
      if (lastDot > 0) {
        return originalUrl.substring(0, lastDot) + qualitySuffix + originalUrl.substring(lastDot);
      }
    }
    
    return originalUrl;
  }
  
  // Monitor video performance and adapt quality
  void monitorVideoPerformance(String videoId, double averageFps, double bufferHealth) {
    // If performance is poor, reduce quality
    if (averageFps < 20 || bufferHealth < 0.2) {
      print('📉 Poor video performance detected - reducing quality');
      _performanceService.setHardwareAcceleration(false);
      notifyListeners();
    }
  }
  
  // Get current video quality setting
  VideoQuality get currentQuality => _adaptiveQuality;
  
  // Manually set video quality
  void setVideoQuality(VideoQuality quality) {
    _adaptiveQuality = quality;
    print('🎥 Video quality set to: $quality');
    notifyListeners();
  }
}