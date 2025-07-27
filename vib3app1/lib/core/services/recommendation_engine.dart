import 'dart:math';
import 'package:flutter/foundation.dart';
import '../models/post_model.dart';
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
    required Post post,
    required VideoMetrics metrics,
  }) {
    final userPrefs = _userPreferences[userId] ?? UserPreferences();
    
    // Base engagement score
    double engagementScore = _calculateEngagementScore(metrics);
    
    // User preference score
    double preferenceScore = _calculatePreferenceScore(userPrefs, post);
    
    // Freshness score
    double freshnessScore = _calculateFreshnessScore(post.createdAt);
    
    // Geographic relevance
    double geoScore = _calculateGeographicScore(userPrefs, post);
    
    // Diversity bonus (to avoid filter bubbles)
    double diversityBonus = _calculateDiversityBonus(userPrefs, post);
    
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
    finalScore *= _getCreatorQualityMultiplier(post.userId);
    
    return finalScore.clamp(0.0, 1.0);
  }

  /// Get personalized video recommendations
  Future<List<Post>> getRecommendations({
    required String userId,
    required int count,
    List<String>? excludeIds,
    List<Post>? candidatePosts,
  }) async {
    print('🎯 RecommendationEngine: Getting recommendations for user: $userId');
    print('🎯 Requested count: $count');
    print('🎯 Candidate posts provided: ${candidatePosts?.length ?? 0}');
    
    // Check cache
    if (_shouldUseCachedRecommendations(userId)) {
      return _getCachedRecommendations(userId, count, excludeIds);
    }
    
    // Fetch candidate posts if not provided
    final candidates = candidatePosts ?? await _fetchCandidatePosts(userId);
    print('🎯 Total candidates to score: ${candidates.length}');
    
    // If no candidates, return empty
    if (candidates.isEmpty) {
      print('🎯 No candidate posts available');
      return [];
    }
    
    // Score and rank posts
    final scoredPosts = candidates.map((post) {
      final metrics = _videoMetrics[post.id] ?? VideoMetrics();
      final score = calculateVideoScore(
        userId: userId,
        post: post,
        metrics: metrics,
      );
      print('🎯 Post ${post.id} score: $score');
      return ScoredPost(post: post, score: score);
    }).toList();
    
    // Sort by score
    scoredPosts.sort((a, b) => b.score.compareTo(a.score));
    print('🎯 Scored posts: ${scoredPosts.length}');
    
    // Apply exploration factor (10% random for discovery)
    final explorationCount = (count * 0.1).round();
    final recommendedCount = count - explorationCount;
    
    print('🎯 Exploration count: $explorationCount, Recommended count: $recommendedCount');
    
    final recommendations = <Post>[];
    
    // Add top scored posts
    final topPosts = scoredPosts
        .take(recommendedCount)
        .map((sp) => sp.post)
        .where((p) => excludeIds?.contains(p.id) != true)
        .toList();
    
    print('🎯 Top scored posts after filtering: ${topPosts.length}');
    recommendations.addAll(topPosts);
    
    // Add random exploration posts
    final explorationPosts = _selectExplorationPosts(
      candidates,
      explorationCount,
      recommendations.map((p) => p.id).toList(),
    );
    print('🎯 Exploration posts: ${explorationPosts.length}');
    recommendations.addAll(explorationPosts);
    
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
    required Post post,
    required UserInteraction interaction,
  }) {
    final prefs = _userPreferences[userId] ?? UserPreferences();
    
    // Update tag preferences (using tags instead of hashtags)
    if (post.tags != null) {
      for (final tag in post.tags!) {
        prefs.hashtagScores[tag] = 
            (prefs.hashtagScores[tag] ?? 0.5) + 
            _getInteractionWeight(interaction) * 0.5;
      }
    }
    
    // Update creator preferences
    prefs.creatorScores[post.userId] = 
        (prefs.creatorScores[post.userId] ?? 0.5) + 
        _getInteractionWeight(interaction) * 0.7;
    
    // Update sound preferences
    if (post.sound != null) {
      prefs.soundScores[post.sound!.id] = 
          (prefs.soundScores[post.sound!.id] ?? 0.5) + 
          _getInteractionWeight(interaction) * 0.3;
    }
    
    // Update interaction history
    prefs.interactionHistory.add(InteractionEvent(
      postId: post.id,
      interaction: interaction,
      timestamp: DateTime.now(),
    ));
    
    // Normalize scores
    _normalizePreferenceScores(prefs);
    
    _userPreferences[userId] = prefs;
  }

  /// Update video metrics
  void updateVideoMetrics({
    required String postId,
    required MetricUpdate update,
  }) {
    final metrics = _videoMetrics[postId] ?? VideoMetrics();
    
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
    
    _videoMetrics[postId] = metrics;
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

  double _calculatePreferenceScore(UserPreferences prefs, Post post) {
    double score = 0.5; // Base score
    
    // Tag preferences (using tags instead of hashtags)
    double tagScore = 0.0;
    int matchingTags = 0;
    if (post.tags != null) {
      for (final tag in post.tags!) {
        if (prefs.hashtagScores.containsKey(tag)) {
          tagScore += prefs.hashtagScores[tag]!;
          matchingTags++;
        }
      }
    }
    if (matchingTags > 0) {
      score += (tagScore / matchingTags) * 0.3;
    }
    
    // Creator preference
    if (prefs.creatorScores.containsKey(post.userId)) {
      score += prefs.creatorScores[post.userId]! * 0.5;
    }
    
    // Sound preference
    if (post.sound != null && prefs.soundScores.containsKey(post.sound!.id)) {
      score += prefs.soundScores[post.sound!.id]! * 0.2;
    }
    
    return score.clamp(0.0, 1.0);
  }

  double _calculateFreshnessScore(DateTime createdAt) {
    final hoursOld = DateTime.now().difference(createdAt).inHours;
    return pow(_freshnessDecayRate, hoursOld / _freshnessHalfLifeHours).toDouble();
  }

  double _calculateGeographicScore(UserPreferences prefs, Post post) {
    // Simplified geographic scoring
    if (prefs.location == null || post.location == null) return 0.5;
    
    // For now, return neutral score
    // TODO: Implement proper geographic scoring
    return 0.5;
  }

  double _calculateDiversityBonus(UserPreferences prefs, Post post) {
    // Bonus for content outside user's usual preferences
    double noveltyScore = 0.5;
    
    // Check for new creators
    if (!prefs.creatorScores.containsKey(post.userId)) {
      noveltyScore += 0.5;
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
    // Normalize scores
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

  Future<List<Post>> _fetchCandidatePosts(String userId) async {
    // TODO: Implement actual post fetching from database
    // This should fetch a pool of candidate posts based on:
    // - Recent uploads
    // - Trending posts
    // - Posts from followed creators
    // - Posts with similar hashtags/sounds
    return [];
  }

  bool _shouldUseCachedRecommendations(String userId) {
    if (_lastCacheUpdate == null) return false;
    if (!_recommendationCache.containsKey(userId)) return false;
    
    // Cache expires after 5 minutes
    return DateTime.now().difference(_lastCacheUpdate!).inMinutes < 5;
  }

  List<Post> _getCachedRecommendations(
    String userId,
    int count,
    List<String>? excludeIds,
  ) {
    // TODO: Return cached recommendations
    return [];
  }

  List<Post> _selectExplorationPosts(
    List<Post> candidates,
    int count,
    List<String> excludeIds,
  ) {
    final available = candidates
        .where((p) => !excludeIds.contains(p.id))
        .toList();
    
    available.shuffle();
    return available.take(count).toList();
  }

  void _updateRecommendationCache(String userId, List<Post> recommendations) {
    _recommendationCache[userId] = recommendations.map((p) => p.id).toList();
    _lastCacheUpdate = DateTime.now();
  }

  void _trackImpressions(String userId, List<Post> posts) {
    // Track which posts were shown to user for learning
    for (final post in posts) {
      debugPrint('Impression tracked: User $userId saw post ${post.id}');
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
  UserLocation? location;
  
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
  final String postId;
  final UserInteraction interaction;
  final DateTime timestamp;
  
  InteractionEvent({
    required this.postId,
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

class ScoredPost {
  final Post post;
  final double score;
  
  ScoredPost({
    required this.post,
    required this.score,
  });
}

class UserLocation {
  final String country;
  final String region;
  final double? latitude;
  final double? longitude;
  
  UserLocation({
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