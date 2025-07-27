import 'dart:async';
import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'recommendation_engine.dart';
import 'storage_service.dart';
import '../models/post_model.dart';

/// Service to track user interactions with videos
class InteractionTrackingService {
  static final InteractionTrackingService _instance = InteractionTrackingService._internal();
  factory InteractionTrackingService() => _instance;
  InteractionTrackingService._internal();

  // Track video start times for watch time calculation
  final Map<String, DateTime> _videoStartTimes = {};
  final Map<String, double> _videoWatchTimes = {};
  
  // Timers for periodic updates
  Timer? _watchTimeTimer;
  String? _currentVideoId;
  String? _currentUserId;
  
  // Get the recommendation engine instance
  final _recommendationEngine = RecommendationEngine();
  final _dio = Dio();

  /// Start tracking a video view
  void startVideoView({
    required String userId,
    required Post post,
  }) {
    print('📊 Starting video view tracking: ${post.id}');
    
    _currentVideoId = post.id;
    _currentUserId = userId;
    _videoStartTimes[post.id] = DateTime.now();
    
    // Cancel any existing timer
    _watchTimeTimer?.cancel();
    
    // Update watch time every 2 seconds
    _watchTimeTimer = Timer.periodic(const Duration(seconds: 2), (_) {
      _updateWatchTime(post.id);
    });
    
    // Track view interaction
    _recommendationEngine.updateUserPreferences(
      userId: userId,
      post: post,
      interaction: UserInteraction.view,
    );
    
    // Send to backend
    _sendInteractionToBackend(
      userId: userId,
      postId: post.id,
      action: 'view',
    );
    
    // Update video view count
    _recommendationEngine.updateVideoMetrics(
      postId: post.id,
      update: MetricUpdate(
        type: MetricType.view,
        value: 1,
      ),
    );
  }
  
  /// Stop tracking current video and record final watch time
  void stopVideoView({String? postId, bool completed = false}) {
    final id = postId ?? _currentVideoId;
    if (id == null) return;
    
    print('📊 Stopping video view tracking: $id');
    
    // Cancel timer
    _watchTimeTimer?.cancel();
    
    // Record final watch time
    _updateWatchTime(id);
    
    // Send to backend
    final watchTime = _videoWatchTimes[id] ?? 0;
    if (_currentUserId != null) {
      _sendVideoViewToBackend(
        postId: id,
        userId: _currentUserId!,
        watchTime: watchTime,
        completed: completed,
      );
    }
    
    // Clean up
    _videoStartTimes.remove(id);
    if (id == _currentVideoId) {
      _currentVideoId = null;
    }
  }
  
  /// Update watch time for a video
  void _updateWatchTime(String postId) {
    final startTime = _videoStartTimes[postId];
    if (startTime == null) return;
    
    final watchTime = DateTime.now().difference(startTime).inSeconds.toDouble();
    _videoWatchTimes[postId] = watchTime;
    
    // Update metrics with watch time
    _recommendationEngine.updateVideoMetrics(
      postId: postId,
      update: MetricUpdate(
        type: MetricType.view,
        value: watchTime,
      ),
    );
    
    print('⏱️ Watch time for $postId: ${watchTime}s');
  }
  
  /// Track video completion
  void trackVideoCompletion({
    required String userId,
    required Post post,
  }) {
    print('✅ Video completed: ${post.id}');
    
    _recommendationEngine.updateVideoMetrics(
      postId: post.id,
      update: MetricUpdate(
        type: MetricType.completion,
        value: 1,
      ),
    );
  }
  
  /// Track like interaction
  void trackLike({
    required String userId,
    required Post post,
    required bool isLiked,
  }) {
    print('❤️ Video ${isLiked ? "liked" : "unliked"}: ${post.id}');
    
    _recommendationEngine.updateUserPreferences(
      userId: userId,
      post: post,
      interaction: isLiked ? UserInteraction.like : UserInteraction.skip,
    );
    
    if (isLiked) {
      _recommendationEngine.updateVideoMetrics(
        postId: post.id,
        update: MetricUpdate(
          type: MetricType.like,
          value: 1,
        ),
      );
    }
    
    // Send to backend
    _sendInteractionToBackend(
      userId: userId,
      postId: post.id,
      action: isLiked ? 'like' : 'unlike',
    );
  }
  
  /// Track comment interaction
  void trackComment({
    required String userId,
    required Post post,
  }) {
    print('💬 Video commented: ${post.id}');
    
    _recommendationEngine.updateUserPreferences(
      userId: userId,
      post: post,
      interaction: UserInteraction.comment,
    );
    
    _recommendationEngine.updateVideoMetrics(
      postId: post.id,
      update: MetricUpdate(
        type: MetricType.comment,
        value: 1,
      ),
    );
    
    // Send to backend
    _sendInteractionToBackend(
      userId: userId,
      postId: post.id,
      action: 'comment',
    );
  }
  
  /// Track share interaction
  void trackShare({
    required String userId,
    required Post post,
  }) {
    print('🔗 Video shared: ${post.id}');
    
    _recommendationEngine.updateUserPreferences(
      userId: userId,
      post: post,
      interaction: UserInteraction.share,
    );
    
    _recommendationEngine.updateVideoMetrics(
      postId: post.id,
      update: MetricUpdate(
        type: MetricType.share,
        value: 1,
      ),
    );
    
    // Send to backend
    _sendInteractionToBackend(
      userId: userId,
      postId: post.id,
      action: 'share',
    );
  }
  
  /// Track follow interaction
  void trackFollow({
    required String userId,
    required String creatorId,
    required Post post,
  }) {
    print('➕ Creator followed: $creatorId');
    
    _recommendationEngine.updateUserPreferences(
      userId: userId,
      post: post,
      interaction: UserInteraction.follow,
    );
    
    // Send to backend
    _sendInteractionToBackend(
      userId: userId,
      postId: post.id,
      action: 'follow',
    );
  }
  
  /// Track skip/swipe away
  void trackSkip({
    required String userId,
    required Post post,
  }) {
    // Only count as skip if watched less than 3 seconds
    final watchTime = _videoWatchTimes[post.id] ?? 0;
    if (watchTime < 3) {
      print('⏭️ Video skipped: ${post.id}');
      
      _recommendationEngine.updateUserPreferences(
        userId: userId,
        post: post,
        interaction: UserInteraction.skip,
      );
      
      // Send to backend
      _sendInteractionToBackend(
        userId: userId,
        postId: post.id,
        action: 'skip',
      );
    }
  }
  
  /// Get watch time for a video
  double getWatchTime(String postId) {
    return _videoWatchTimes[postId] ?? 0;
  }
  
  /// Clean up resources
  void dispose() {
    _watchTimeTimer?.cancel();
    _videoStartTimes.clear();
    _videoWatchTimes.clear();
  }
  
  // Backend API Methods
  
  /// Send video view data to backend
  Future<void> _sendVideoViewToBackend({
    required String postId,
    required String userId,
    required double watchTime,
    required bool completed,
  }) async {
    try {
      final token = await StorageService.getAuthToken();
      if (token == null) return;
      
      final response = await _dio.post(
        '/api/analytics/video-view',
        data: {
          'postId': postId,
          'userId': userId,
          'watchTime': watchTime,
          'completed': completed,
        },
        options: Options(
          headers: {
            'Authorization': 'Bearer $token',
          },
        ),
      );
      
      if (response.statusCode == 200) {
        print('✅ Video view tracked on backend');
      }
    } catch (e) {
      print('❌ Failed to track video view on backend: $e');
    }
  }
  
  /// Send interaction data to backend
  Future<void> _sendInteractionToBackend({
    required String userId,
    required String postId,
    required String action,
    int value = 1,
  }) async {
    try {
      final token = await StorageService.getAuthToken();
      if (token == null) return;
      
      final response = await _dio.post(
        '/api/analytics/interaction',
        data: {
          'userId': userId,
          'postId': postId,
          'action': action,
          'value': value,
        },
        options: Options(
          headers: {
            'Authorization': 'Bearer $token',
          },
        ),
      );
      
      if (response.statusCode == 200) {
        print('✅ Interaction tracked on backend: $action');
      }
    } catch (e) {
      print('❌ Failed to track interaction on backend: $e');
    }
  }
}