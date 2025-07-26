class AppConstants {
  // API Configuration
  static const String baseUrl = 'http://localhost:3000'; // Change for production
  static const String apiVersion = '/api/v1';
  static const String wsUrl = 'ws://localhost:3000';
  
  // MongoDB Collections
  static const String usersCollection = 'users';
  static const String postsCollection = 'posts';
  static const String videosCollection = 'videos';
  static const String storiesCollection = 'stories';
  static const String messagesCollection = 'messages';
  static const String commentsCollection = 'comments';
  static const String likesCollection = 'likes';
  static const String followsCollection = 'follows';
  
  // DigitalOcean Spaces
  static const String spacesEndpoint = 'https://nyc3.digitaloceanspaces.com';
  static const String spacesBucket = 'vib3-videos';
  static const String cdnUrl = 'https://vib3-videos.nyc3.cdn.digitaloceanspaces.com';
  
  // Content Constraints
  static const int maxVideoSizeMB = 100;
  static const int maxImageSizeMB = 10;
  static const int maxVideoDurationSeconds = 180; // 3 minutes
  static const int maxStoryDurationSeconds = 60;
  static const int maxCarouselImages = 10;
  static const int maxBioLength = 150;
  static const int maxCaptionLength = 2200;
  static const int maxCommentLength = 500;
  static const int maxMessageLength = 1000;
  
  // Feed Configuration
  static const int feedPageSize = 10;
  static const int storiesPageSize = 20;
  static const int messagesPageSize = 50;
  static const int searchResultsPageSize = 20;
  
  // UI Constants
  static const double videoAspectRatio = 9 / 16;
  static const double storyAspectRatio = 9 / 16;
  static const double postAspectRatio = 1 / 1;
  static const double profileImageSize = 100;
  static const double storyRingWidth = 3;
  
  // Time Constants
  static const int storyExpirationHours = 24;
  static const int messageTypingTimeoutSeconds = 5;
  static const int videoPreloadCount = 3;
  static const int sessionTimeoutMinutes = 30;
  
  // Feature Flags
  static const bool enableStories = true;
  static const bool enableReels = true;
  static const bool enableLiveStreaming = false;
  static const bool enableShopping = false;
  static const bool enableAR = true;
  static const bool enableDisappearingMessages = true;
  
  // Regex Patterns
  static final RegExp emailRegex = RegExp(
    r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
  );
  static final RegExp usernameRegex = RegExp(
    r'^[a-zA-Z0-9_]{3,30}$',
  );
  static final RegExp hashtagRegex = RegExp(
    r'#[a-zA-Z0-9_]+',
  );
  static final RegExp mentionRegex = RegExp(
    r'@[a-zA-Z0-9_]+',
  );
  static final RegExp urlRegex = RegExp(
    r'https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)',
  );
  
  // Error Messages
  static const String networkError = 'Network connection error. Please try again.';
  static const String serverError = 'Server error. Please try again later.';
  static const String authError = 'Authentication failed. Please login again.';
  static const String uploadError = 'Upload failed. Please try again.';
  static const String permissionError = 'Permission denied. Please check your settings.';
  
  // Success Messages
  static const String uploadSuccess = 'Upload successful!';
  static const String postSuccess = 'Posted successfully!';
  static const String deleteSuccess = 'Deleted successfully!';
  static const String updateSuccess = 'Updated successfully!';
  
  // Local Storage Keys
  static const String authTokenKey = 'auth_token';
  static const String userIdKey = 'user_id';
  static const String usernameKey = 'username';
  static const String themeKey = 'theme_mode';
  static const String onboardingKey = 'onboarding_complete';
  static const String notificationKey = 'notifications_enabled';
  
  // Animation Durations (milliseconds)
  static const int quickAnimation = 200;
  static const int normalAnimation = 300;
  static const int slowAnimation = 500;
  static const int pageTransition = 400;
  
  // Social Features
  static const int maxFollowSuggestions = 10;
  static const int maxTrendingHashtags = 20;
  static const int maxRecentSearches = 10;
  static const int snapStreakThreshold = 3; // days
  
  // Video Quality Presets
  static const Map<String, Map<String, dynamic>> videoQuality = {
    'low': {'width': 480, 'height': 854, 'bitrate': 1000000},
    'medium': {'width': 720, 'height': 1280, 'bitrate': 2500000},
    'high': {'width': 1080, 'height': 1920, 'bitrate': 5000000},
  };
}