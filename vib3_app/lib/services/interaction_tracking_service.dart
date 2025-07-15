import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'recommendation_engine.dart';
import '../models/video.dart';
import '../config/app_config.dart';

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

  /// Start tracking a video view
  void startVideoView({
    required String userId,
    required Video video,
  }) {
    print('📊 Starting video view tracking: ${video.id}');
    
    _currentVideoId = video.id;
    _currentUserId = userId;
    _videoStartTimes[video.id] = DateTime.now();
    
    // Cancel any existing timer
    _watchTimeTimer?.cancel();
    
    // Update watch time every 2 seconds
    _watchTimeTimer = Timer.periodic(const Duration(seconds: 2), (_) {
      _updateWatchTime(video.id);
    });
    
    // Track view interaction
    _recommendationEngine.updateUserPreferences(
      userId: userId,
      video: video,
      interaction: UserInteraction.view,
    );
    
    // Send to backend
    _sendInteractionToBackend(
      userId: userId,
      videoId: video.id,
      action: 'view',
    );
    
    // Update video view count
    _recommendationEngine.updateVideoMetrics(
      videoId: video.id,
      update: MetricUpdate(
        type: MetricType.view,
        value: 1,
      ),
    );
  }
  
  /// Stop tracking current video and record final watch time
  void stopVideoView({String? videoId, bool completed = false}) {
    final id = videoId ?? _currentVideoId;
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
        videoId: id,
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
  void _updateWatchTime(String videoId) {
    final startTime = _videoStartTimes[videoId];
    if (startTime == null) return;
    
    final watchTime = DateTime.now().difference(startTime).inSeconds.toDouble();
    _videoWatchTimes[videoId] = watchTime;
    
    // Update metrics with watch time
    _recommendationEngine.updateVideoMetrics(
      videoId: videoId,
      update: MetricUpdate(
        type: MetricType.view,
        value: watchTime,
      ),
    );
    
    print('⏱️ Watch time for $videoId: ${watchTime}s');
  }
  
  /// Track video completion
  void trackVideoCompletion({
    required String userId,
    required Video video,
  }) {
    print('✅ Video completed: ${video.id}');
    
    _recommendationEngine.updateVideoMetrics(
      videoId: video.id,
      update: MetricUpdate(
        type: MetricType.completion,
        value: 1,
      ),
    );
  }
  
  /// Track like interaction
  void trackLike({
    required String userId,
    required Video video,
    required bool isLiked,
  }) {
    print('❤️ Video ${isLiked ? "liked" : "unliked"}: ${video.id}');
    
    _recommendationEngine.updateUserPreferences(
      userId: userId,
      video: video,
      interaction: isLiked ? UserInteraction.like : UserInteraction.skip,
    );
    
    if (isLiked) {
      _recommendationEngine.updateVideoMetrics(
        videoId: video.id,
        update: MetricUpdate(
          type: MetricType.like,
          value: 1,
        ),
      );
    }
    
    // Send to backend
    _sendInteractionToBackend(
      userId: userId,
      videoId: video.id,
      action: isLiked ? 'like' : 'unlike',
    );
  }
  
  /// Track comment interaction
  void trackComment({
    required String userId,
    required Video video,
  }) {
    print('💬 Video commented: ${video.id}');
    
    _recommendationEngine.updateUserPreferences(
      userId: userId,
      video: video,
      interaction: UserInteraction.comment,
    );
    
    _recommendationEngine.updateVideoMetrics(
      videoId: video.id,
      update: MetricUpdate(
        type: MetricType.comment,
        value: 1,
      ),
    );
    
    // Send to backend
    _sendInteractionToBackend(
      userId: userId,
      videoId: video.id,
      action: 'comment',
    );
  }
  
  /// Track share interaction
  void trackShare({
    required String userId,
    required Video video,
  }) {
    print('🔗 Video shared: ${video.id}');
    
    _recommendationEngine.updateUserPreferences(
      userId: userId,
      video: video,
      interaction: UserInteraction.share,
    );
    
    _recommendationEngine.updateVideoMetrics(
      videoId: video.id,
      update: MetricUpdate(
        type: MetricType.share,
        value: 1,
      ),
    );
    
    // Send to backend
    _sendInteractionToBackend(
      userId: userId,
      videoId: video.id,
      action: 'share',
    );
  }
  
  /// Track follow interaction
  void trackFollow({
    required String userId,
    required String creatorId,
    required Video video,
  }) {
    print('➕ Creator followed: $creatorId');
    
    _recommendationEngine.updateUserPreferences(
      userId: userId,
      video: video,
      interaction: UserInteraction.follow,
    );
    
    // Send to backend
    _sendInteractionToBackend(
      userId: userId,
      videoId: video.id,
      action: 'follow',
    );
  }
  
  /// Track skip/swipe away
  void trackSkip({
    required String userId,
    required Video video,
  }) {
    // Only count as skip if watched less than 3 seconds
    final watchTime = _videoWatchTimes[video.id] ?? 0;
    if (watchTime < 3) {
      print('⏭️ Video skipped: ${video.id}');
      
      _recommendationEngine.updateUserPreferences(
        userId: userId,
        video: video,
        interaction: UserInteraction.skip,
      );
      
      // Send to backend
      _sendInteractionToBackend(
        userId: userId,
        videoId: video.id,
        action: 'skip',
      );
    }
  }
  
  /// Get watch time for a video
  double getWatchTime(String videoId) {
    return _videoWatchTimes[videoId] ?? 0;
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
    required String videoId,
    required String userId,
    required double watchTime,
    required bool completed,
  }) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('auth_token');
      if (token == null) return;
      
      final response = await http.post(
        Uri.parse('${AppConfig.baseUrl}/api/analytics/video-view'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'videoId': videoId,
          'userId': userId,
          'watchTime': watchTime,
          'completed': completed,
        }),
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
    required String videoId,
    required String action,
    int value = 1,
  }) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('auth_token');
      if (token == null) return;
      
      final response = await http.post(
        Uri.parse('${AppConfig.baseUrl}/api/analytics/interaction'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'userId': userId,
          'videoId': videoId,
          'action': action,
          'value': value,
        }),
      );
      
      if (response.statusCode == 200) {
        print('✅ Interaction tracked on backend: $action');
      }
    } catch (e) {
      print('❌ Failed to track interaction on backend: $e');
    }
  }
}