import 'dart:math';
import 'package:flutter/foundation.dart';
import '../models/video.dart';
import '../models/user_model.dart';

/// Recommendation engine for the For You Page algorithm
class RecommendationEngine {
  static final RecommendationEngine _instance = RecommendationEngine._internal();
  factory RecommendationEngine() => _instance;
  RecommendationEngine._internal();

  // User interaction weights
  static const double _watchTimeWeight = 0.35;
  static const double _engagementWeight = 0.25;
  static const double _shareWeight = 0.15;
  static const double _commentWeight = 0.15;
  static const double _followWeight = 0.10;

  // Content freshness decay
  static const double _freshnessDecayRate = 0.95;
  static const int _freshnessHalfLifeHours = 48;

  // User preferences storage
  final Map<String, UserPreferences> _userPreferences = {};
  final Map<String, VideoMetrics> _videoMetrics = {};
  
  // Recommendation cache
  final Map<String, List<String>> _recommendationCache = {};
  DateTime? _lastCacheUpdate;

  /// Calculate video score for a specific user
  double calculateVideoScore({
    required String userId,
    required Video video,
    required VideoMetrics metrics,
  }) {
    final userPrefs = _userPreferences[userId] ?? UserPreferences();
    
    // Base engagement score
    double engagementScore = _calculateEngagementScore(metrics);
    
    // User preference score
    double preferenceScore = _calculatePreferenceScore(userPrefs, video);
    
    // Freshness score
    double freshnessScore = _calculateFreshnessScore(video.createdAt);
    
    // Geographic relevance
    double geoScore = _calculateGeographicScore(userPrefs, video);
    
    // Diversity bonus (to avoid filter bubbles)
    double diversityBonus = _calculateDiversityBonus(userPrefs, video);
    
    // Viral velocity score
    double viralScore = _calculateViralVelocity(metrics);
    
    // Combine all scores
    double finalScore = (engagementScore * 0.3) +
                       (preferenceScore * 0.25) +
                       (freshnessScore * 0.15) +
                       (geoScore * 0.1) +
                       (diversityBonus * 0.1) +
                       (viralScore * 0.1);
    
    // Apply creator quality multiplier
    finalScore *= _getCreatorQualityMultiplier(video.userId);
    
    return finalScore.clamp(0.0, 1.0);
  }

  /// Get personalized video recommendations
  Future<List<Video>> getRecommendations({
    required String userId,
    required int count,
    List<String>? excludeIds,
    List<Video>? candidateVideos,
  }) async {
    print('🎯 RecommendationEngine: Getting recommendations for user: $userId');
    print('🎯 Requested count: $count');
    print('🎯 Candidate videos provided: ${candidateVideos?.length ?? 0}');
    
    // Check cache
    if (_shouldUseCachedRecommendations(userId)) {
      return _getCachedRecommendations(userId, count, excludeIds);
    }
    
    // Fetch candidate videos if not provided
    final candidates = candidateVideos ?? await _fetchCandidateVideos(userId);
    print('🎯 Total candidates to score: ${candidates.length}');
    
    // If no candidates, return empty
    if (candidates.isEmpty) {
      print('🎯 No candidate videos available');
      return [];
    }
    
    // Score and rank videos
    final scoredVideos = candidates.map((video) {
      final metrics = _videoMetrics[video.id] ?? VideoMetrics();
      final score = calculateVideoScore(
        userId: userId,
        video: video,
        metrics: metrics,
      );
      print('🎯 Video ${video.id} score: $score');
      return ScoredVideo(video: video, score: score);
    }).toList();
    
    // Sort by score
    scoredVideos.sort((a, b) => b.score.compareTo(a.score));
    print('🎯 Scored videos: ${scoredVideos.length}');
    
    // Apply exploration factor (10% random for discovery)
    final explorationCount = (count * 0.1).round();
    final recommendedCount = count - explorationCount;
    
    print('🎯 Exploration count: $explorationCount, Recommended count: $recommendedCount');
    
    final recommendations = <Video>[];
    
    // Add top scored videos
    final topVideos = scoredVideos
        .take(recommendedCount)
        .map((sv) => sv.video)
        .where((v) => excludeIds?.contains(v.id) != true)
        .toList();
    
    print('🎯 Top scored videos after filtering: ${topVideos.length}');
    recommendations.addAll(topVideos);
    
    // Add random exploration videos
    final explorationVideos = _selectExplorationVideos(
      candidates,
      explorationCount,
      recommendations.map((v) => v.id).toList(),
    );
    print('🎯 Exploration videos: ${explorationVideos.length}');
    recommendations.addAll(explorationVideos);
    
    print('🎯 Final recommendations: ${recommendations.length}');
    
    // Update cache
    _updateRecommendationCache(userId, recommendations);
    
    // Track impressions for learning
    _trackImpressions(userId, recommendations);
    
    return recommendations;
  }

  /// Update user preferences based on interaction
  void updateUserPreferences({
    required String userId,
    required Video video,
    required UserInteraction interaction,
  }) {
    final prefs = _userPreferences[userId] ?? UserPreferences();
    
    // Update category preferences
    if (video.category != null) {
      prefs.categoryScores[video.category!] = 
          (prefs.categoryScores[video.category!] ?? 0.5) + 
          _getInteractionWeight(interaction);
    }
    
    // Update hashtag preferences
    if (video.hashtags != null) {
      for (final hashtag in video.hashtags!) {
        prefs.hashtagScores[hashtag] = 
            (prefs.hashtagScores[hashtag] ?? 0.5) + 
            _getInteractionWeight(interaction) * 0.5;
      }
    }
    
    // Update creator preferences
    prefs.creatorScores[video.userId] = 
        (prefs.creatorScores[video.userId] ?? 0.5) + 
        _getInteractionWeight(interaction) * 0.7;
    
    // Update sound preferences
    if (video.soundId != null) {
      prefs.soundScores[video.soundId!] = 
          (prefs.soundScores[video.soundId!] ?? 0.5) + 
          _getInteractionWeight(interaction) * 0.3;
    }
    
    // Update interaction history
    prefs.interactionHistory.add(InteractionEvent(
      videoId: video.id,
      interaction: interaction,
      timestamp: DateTime.now(),
    ));
    
    // Normalize scores
    _normalizePreferenceScores(prefs);
    
    _userPreferences[userId] = prefs;
  }

  /// Update video metrics
  void updateVideoMetrics({
    required String videoId,
    required MetricUpdate update,
  }) {
    final metrics = _videoMetrics[videoId] ?? VideoMetrics();
    
    switch (update.type) {
      case MetricType.view:
        metrics.views++;
        metrics.totalWatchTime += update.value;
        break;
      case MetricType.like:
        metrics.likes++;
        break;
      case MetricType.comment:
        metrics.comments++;
        break;
      case MetricType.share:
        metrics.shares++;
        break;
      case MetricType.completion:
        metrics.completions++;
        break;
    }
    
    // Update viral velocity
    metrics.recentInteractions.add(InteractionTimestamp(
      type: update.type,
      timestamp: DateTime.now(),
    ));
    
    // Clean old interactions (keep last 24 hours)
    final cutoff = DateTime.now().subtract(const Duration(hours: 24));
    metrics.recentInteractions.removeWhere((i) => i.timestamp.isBefore(cutoff));
    
    _videoMetrics[videoId] = metrics;
  }

  // Private helper methods
  
  double _calculateEngagementScore(VideoMetrics metrics) {
    // For new videos with no views, return a neutral score to give them a chance
    if (metrics.views == 0) return 0.5;
    
    final avgWatchTime = metrics.totalWatchTime / metrics.views;
    final watchTimeScore = (avgWatchTime / 60.0).clamp(0.0, 1.0); // Normalize to 1 minute
    
    final engagementRate = (metrics.likes + metrics.comments + metrics.shares) / metrics.views;
    final engagementScore = (engagementRate * 10).clamp(0.0, 1.0); // Normalize to 10%
    
    final completionRate = metrics.completions / metrics.views;
    
    return (watchTimeScore * _watchTimeWeight) +
           (engagementScore * _engagementWeight) +
           (completionRate * 0.3);
  }

  double _calculatePreferenceScore(UserPreferences prefs, Video video) {
    double score = 0.5; // Base score
    
    // Category preference
    if (video.category != null && prefs.categoryScores.containsKey(video.category)) {
      score += prefs.categoryScores[video.category!]! * 0.3;
    }
    
    // Hashtag preferences
    double hashtagScore = 0.0;
    int matchingHashtags = 0;
    if (video.hashtags != null) {
      for (final hashtag in video.hashtags!) {
        if (prefs.hashtagScores.containsKey(hashtag)) {
          hashtagScore += prefs.hashtagScores[hashtag]!;
          matchingHashtags++;
        }
      }
    }
    if (matchingHashtags > 0) {
      score += (hashtagScore / matchingHashtags) * 0.2;
    }
    
    // Creator preference
    if (prefs.creatorScores.containsKey(video.userId)) {
      score += prefs.creatorScores[video.userId]! * 0.4;
    }
    
    // Sound preference
    if (video.soundId != null && prefs.soundScores.containsKey(video.soundId)) {
      score += prefs.soundScores[video.soundId!]! * 0.1;
    }
    
    return score.clamp(0.0, 1.0);
  }

  double _calculateFreshnessScore(DateTime createdAt) {
    final hoursOld = DateTime.now().difference(createdAt).inHours;
    return pow(_freshnessDecayRate, hoursOld / _freshnessHalfLifeHours).toDouble();
  }

  double _calculateGeographicScore(UserPreferences prefs, Video video) {
    // Simplified geographic scoring
    if (prefs.location == null || video.location == null) return 0.5;
    
    // Same country bonus
    if (prefs.location!.country == video.location!['country']) return 0.8;
    
    // Same region bonus
    if (prefs.location!.region == video.location!['region']) return 0.6;
    
    return 0.3;
  }

  double _calculateDiversityBonus(UserPreferences prefs, Video video) {
    // Bonus for content outside user's usual preferences
    double noveltyScore = 0.5;
    
    // Check if category is new
    if (video.category != null && !prefs.categoryScores.containsKey(video.category)) {
      noveltyScore += 0.2;
    }
    
    // Check for new creators
    if (!prefs.creatorScores.containsKey(video.userId)) {
      noveltyScore += 0.3;
    }
    
    return noveltyScore * 0.2; // Max 20% bonus
  }

  double _calculateViralVelocity(VideoMetrics metrics) {
    if (metrics.recentInteractions.isEmpty) return 0.0;
    
    // Calculate interactions per hour in last 24 hours
    final recentCount = metrics.recentInteractions.length;
    final hoursTracked = min(24, DateTime.now()
        .difference(metrics.recentInteractions.first.timestamp)
        .inHours);
    
    if (hoursTracked == 0) return 0.0;
    
    final interactionsPerHour = recentCount / hoursTracked;
    
    // Normalize (assuming 100 interactions/hour is viral)
    return (interactionsPerHour / 100).clamp(0.0, 1.0);
  }

  double _getCreatorQualityMultiplier(String creatorId) {
    // TODO: Implement creator quality scoring based on historical performance
    return 1.0;
  }

  double _getInteractionWeight(UserInteraction interaction) {
    switch (interaction) {
      case UserInteraction.view:
        return 0.1;
      case UserInteraction.like:
        return 0.3;
      case UserInteraction.comment:
        return 0.4;
      case UserInteraction.share:
        return 0.5;
      case UserInteraction.follow:
        return 0.7;
      case UserInteraction.skip:
        return -0.3;
      case UserInteraction.notInterested:
        return -0.7;
      case UserInteraction.report:
        return -1.0;
    }
  }

  void _normalizePreferenceScores(UserPreferences prefs) {
    // Normalize category scores
    _normalizeScoreMap(prefs.categoryScores);
    _normalizeScoreMap(prefs.hashtagScores);
    _normalizeScoreMap(prefs.creatorScores);
    _normalizeScoreMap(prefs.soundScores);
  }

  void _normalizeScoreMap(Map<String, double> scores) {
    if (scores.isEmpty) return;
    
    final maxScore = scores.values.reduce(max);
    if (maxScore > 1.0) {
      scores.forEach((key, value) {
        scores[key] = value / maxScore;
      });
    }
  }

  Future<List<Video>> _fetchCandidateVideos(String userId) async {
    // TODO: Implement actual video fetching from database
    // This should fetch a pool of candidate videos based on:
    // - Recent uploads
    // - Trending videos
    // - Videos from followed creators
    // - Videos with similar hashtags/sounds
    return [];
  }

  bool _shouldUseCachedRecommendations(String userId) {
    if (_lastCacheUpdate == null) return false;
    if (!_recommendationCache.containsKey(userId)) return false;
    
    // Cache expires after 5 minutes
    return DateTime.now().difference(_lastCacheUpdate!).inMinutes < 5;
  }

  List<Video> _getCachedRecommendations(
    String userId,
    int count,
    List<String>? excludeIds,
  ) {
    // TODO: Return cached recommendations
    return [];
  }

  List<Video> _selectExplorationVideos(
    List<Video> candidates,
    int count,
    List<String> excludeIds,
  ) {
    final available = candidates
        .where((v) => !excludeIds.contains(v.id))
        .toList();
    
    available.shuffle();
    return available.take(count).toList();
  }

  void _updateRecommendationCache(String userId, List<Video> recommendations) {
    _recommendationCache[userId] = recommendations.map((v) => v.id).toList();
    _lastCacheUpdate = DateTime.now();
  }

  void _trackImpressions(String userId, List<Video> videos) {
    // Track which videos were shown to user for learning
    for (final video in videos) {
      debugPrint('Impression tracked: User $userId saw video ${video.id}');
    }
  }
}

// Data models for recommendation engine

class UserPreferences {
  final Map<String, double> categoryScores = {};
  final Map<String, double> hashtagScores = {};
  final Map<String, double> creatorScores = {};
  final Map<String, double> soundScores = {};
  final List<InteractionEvent> interactionHistory = [];
  Location? location;
  
  UserPreferences();
}

class VideoMetrics {
  int views = 0;
  int likes = 0;
  int comments = 0;
  int shares = 0;
  int completions = 0;
  double totalWatchTime = 0;
  final List<InteractionTimestamp> recentInteractions = [];
  
  VideoMetrics();
}

class InteractionEvent {
  final String videoId;
  final UserInteraction interaction;
  final DateTime timestamp;
  
  InteractionEvent({
    required this.videoId,
    required this.interaction,
    required this.timestamp,
  });
}

class InteractionTimestamp {
  final MetricType type;
  final DateTime timestamp;
  
  InteractionTimestamp({
    required this.type,
    required this.timestamp,
  });
}

class ScoredVideo {
  final Video video;
  final double score;
  
  ScoredVideo({
    required this.video,
    required this.score,
  });
}

class Location {
  final String country;
  final String region;
  final double? latitude;
  final double? longitude;
  
  Location({
    required this.country,
    required this.region,
    this.latitude,
    this.longitude,
  });
}

class MetricUpdate {
  final MetricType type;
  final double value;
  
  MetricUpdate({
    required this.type,
    required this.value,
  });
}

enum UserInteraction {
  view,
  like,
  comment,
  share,
  follow,
  skip,
  notInterested,
  report,
}

enum MetricType {
  view,
  like,
  comment,
  share,
  completion,
}