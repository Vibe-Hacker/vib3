import 'package:json_annotation/json_annotation.dart';

part 'user_model.g.dart';

@JsonSerializable()
class User {
  final String id;
  final String username;
  final String email;
  final String displayName;
  final String? bio;
  final String? profilePicture;
  final String? coverImage;
  final int followersCount;
  final int followingCount;
  final int postsCount;
  final bool isVerified;
  final bool isPrivate;
  final DateTime createdAt;
  final DateTime updatedAt;
  final UserSettings? settings;
  final UserStats? stats;
  
  User({
    required this.id,
    required this.username,
    required this.email,
    required this.displayName,
    this.bio,
    this.profilePicture,
    this.coverImage,
    this.followersCount = 0,
    this.followingCount = 0,
    this.postsCount = 0,
    this.isVerified = false,
    this.isPrivate = false,
    required this.createdAt,
    required this.updatedAt,
    this.settings,
    this.stats,
  });
  
  factory User.fromJson(Map<String, dynamic> json) => _$UserFromJson(json);
  Map<String, dynamic> toJson() => _$UserToJson(this);
  
  User copyWith({
    String? id,
    String? username,
    String? email,
    String? displayName,
    String? bio,
    String? profilePicture,
    String? coverImage,
    int? followersCount,
    int? followingCount,
    int? postsCount,
    bool? isVerified,
    bool? isPrivate,
    DateTime? createdAt,
    DateTime? updatedAt,
    UserSettings? settings,
    UserStats? stats,
  }) {
    return User(
      id: id ?? this.id,
      username: username ?? this.username,
      email: email ?? this.email,
      displayName: displayName ?? this.displayName,
      bio: bio ?? this.bio,
      profilePicture: profilePicture ?? this.profilePicture,
      coverImage: coverImage ?? this.coverImage,
      followersCount: followersCount ?? this.followersCount,
      followingCount: followingCount ?? this.followingCount,
      postsCount: postsCount ?? this.postsCount,
      isVerified: isVerified ?? this.isVerified,
      isPrivate: isPrivate ?? this.isPrivate,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      settings: settings ?? this.settings,
      stats: stats ?? this.stats,
    );
  }
}

@JsonSerializable()
class UserSettings {
  final bool notificationsEnabled;
  final bool emailNotifications;
  final bool pushNotifications;
  final bool showActivityStatus;
  final bool allowTagging;
  final bool allowMentions;
  final bool allowDuets;
  final bool allowStitches;
  final bool allowDownloads;
  final String whoCanMessage;
  final String whoCanComment;
  final String whoCanDuet;
  final String whoCanStitch;
  final List<String> blockedWords;
  
  UserSettings({
    this.notificationsEnabled = true,
    this.emailNotifications = true,
    this.pushNotifications = true,
    this.showActivityStatus = true,
    this.allowTagging = true,
    this.allowMentions = true,
    this.allowDuets = true,
    this.allowStitches = true,
    this.allowDownloads = true,
    this.whoCanMessage = 'everyone',
    this.whoCanComment = 'everyone',
    this.whoCanDuet = 'everyone',
    this.whoCanStitch = 'everyone',
    this.blockedWords = const [],
  });
  
  factory UserSettings.fromJson(Map<String, dynamic> json) => 
      _$UserSettingsFromJson(json);
  Map<String, dynamic> toJson() => _$UserSettingsToJson(this);
}

@JsonSerializable()
class UserStats {
  final int totalViews;
  final int totalLikes;
  final int totalShares;
  final int totalComments;
  final double avgWatchTime;
  final double completionRate;
  final Map<String, int> viewsByCountry;
  final Map<String, int> viewsByAge;
  final Map<String, int> viewsByGender;
  final List<int> peakHours;
  
  UserStats({
    this.totalViews = 0,
    this.totalLikes = 0,
    this.totalShares = 0,
    this.totalComments = 0,
    this.avgWatchTime = 0,
    this.completionRate = 0,
    this.viewsByCountry = const {},
    this.viewsByAge = const {},
    this.viewsByGender = const {},
    this.peakHours = const [],
  });
  
  factory UserStats.fromJson(Map<String, dynamic> json) => 
      _$UserStatsFromJson(json);
  Map<String, dynamic> toJson() => _$UserStatsToJson(this);
}