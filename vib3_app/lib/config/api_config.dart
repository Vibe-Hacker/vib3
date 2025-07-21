import 'package:flutter/foundation.dart';

/// API Configuration for VIB3 Microservices Architecture
class ApiConfig {
  // API Gateway URL (single entry point for all microservices)
  static const String apiGatewayUrl = 'https://api.vib3app.net';
  
  // Fallback to monolith for backward compatibility
  static const String monolithUrl = 'https://api.vib3app.net';
  
  // Feature flags
  static const bool useMicroservices = true; // Toggle between architectures
  
  // Get the appropriate base URL
  static String get baseUrl {
    if (useMicroservices && !kDebugMode) {
      return apiGatewayUrl;
    }
    return monolithUrl;
  }
  
  // Microservices endpoints (routed through API Gateway)
  static const Map<String, String> endpoints = {
    // Auth Service
    'login': '/api/auth/login',
    'register': '/api/auth/register',
    'logout': '/api/auth/logout',
    'refresh': '/api/auth/refresh',
    'profile': '/api/auth/me',
    'updateProfile': '/api/auth/profile',
    'changePassword': '/api/auth/password',
    'forgotPassword': '/api/auth/forgot-password',
    'resetPassword': '/api/auth/reset-password',
    'verify2FA': '/api/auth/2fa/verify',
    'enable2FA': '/api/auth/2fa/enable',
    
    // Video Service
    'videoFeed': '/api/feed',
    'videoUpload': '/api/videos/upload',
    'videoDetail': '/api/videos/:id',
    'videoLike': '/api/videos/:id/like',
    'videoView': '/api/videos/:id/view',
    'videoShare': '/api/videos/:id/share',
    'videoDelete': '/api/videos/:id',
    'videoSearch': '/api/videos/search',
    'videoTrending': '/api/videos/trending',
    'videoByUser': '/api/videos/user/:userId',
    'videoQualities': '/api/videos/:id/qualities',
    'videoStream': '/api/videos/:id/stream',
    
    // User Service
    'userProfile': '/api/users/:id',
    'userFollow': '/api/users/:id/follow',
    'userUnfollow': '/api/users/:id/unfollow',
    'userFollowers': '/api/users/:id/followers',
    'userFollowing': '/api/users/:id/following',
    'userBlock': '/api/users/:id/block',
    'userUnblock': '/api/users/:id/unblock',
    'userSearch': '/api/users/search',
    'userSuggestions': '/api/users/suggestions',
    
    // Analytics Service
    'trackEvent': '/api/analytics/track',
    'userStats': '/api/analytics/users/:id/stats',
    'videoStats': '/api/analytics/videos/:id/stats',
    'platformStats': '/api/analytics/platform',
    
    // Notification Service
    'notifications': '/api/notifications',
    'notificationRead': '/api/notifications/:id/read',
    'notificationSettings': '/api/notifications/settings',
    'pushToken': '/api/notifications/push-token',
    
    // Recommendation Service
    'recommendations': '/api/recommendations/feed',
    'similarVideos': '/api/recommendations/videos/:id/similar',
    'discoverUsers': '/api/recommendations/users/discover',
    
    // Comment Service (part of Video Service)
    'comments': '/api/videos/:id/comments',
    'commentAdd': '/api/videos/:id/comments',
    'commentDelete': '/api/comments/:id',
    'commentLike': '/api/comments/:id/like',
    
    // Chat/Message Service (if implemented)
    'conversations': '/api/messages/conversations',
    'messages': '/api/messages/conversations/:id',
    'sendMessage': '/api/messages/send',
    
    // Search Service (aggregated)
    'globalSearch': '/api/search',
    'searchVideos': '/api/search/videos',
    'searchUsers': '/api/search/users',
    'searchHashtags': '/api/search/hashtags',
  };
  
  // Helper method to build URLs with parameters
  static String buildUrl(String endpoint, {Map<String, String>? params}) {
    String url = endpoints[endpoint] ?? endpoint;
    
    // Replace path parameters
    if (params != null) {
      params.forEach((key, value) {
        url = url.replaceAll(':$key', value);
      });
    }
    
    return '$baseUrl$url';
  }
  
  // WebSocket endpoints
  static String get notificationWebSocket => 
      baseUrl.replaceAll('http://', 'ws://').replaceAll('https://', 'wss://') + '/ws/notifications';
  
  static String get liveStreamWebSocket => 
      baseUrl.replaceAll('http://', 'ws://').replaceAll('https://', 'wss://') + '/ws/live';
  
  // CDN URLs
  static const String cdnBaseUrl = 'https://vib3-videos.nyc3.cdn.digitaloceanspaces.com';
  
  // Network configuration
  static const Duration timeout = Duration(seconds: 30);
  static const Duration uploadTimeout = Duration(minutes: 5);
  static const int maxRetries = 3;
  
  // Rate limiting (client-side)
  static const int requestsPerMinute = 60;
  static const int uploadRequestsPerHour = 10;
}

/// Environment configuration
class Environment {
  static const String production = 'production';
  static const String staging = 'staging';
  static const String development = 'development';
  
  static String get current {
    if (kDebugMode) {
      return development;
    }
    return production;
  }
  
  static bool get isProduction => current == production;
  static bool get isDevelopment => current == development;
}