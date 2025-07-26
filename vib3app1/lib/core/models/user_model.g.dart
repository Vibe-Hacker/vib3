// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'user_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

User _$UserFromJson(Map<String, dynamic> json) => User(
      id: json['id'] as String,
      username: json['username'] as String,
      email: json['email'] as String,
      displayName: json['displayName'] as String,
      bio: json['bio'] as String?,
      profilePicture: json['profilePicture'] as String?,
      coverImage: json['coverImage'] as String?,
      followersCount: json['followersCount'] as int? ?? 0,
      followingCount: json['followingCount'] as int? ?? 0,
      postsCount: json['postsCount'] as int? ?? 0,
      isVerified: json['isVerified'] as bool? ?? false,
      isPrivate: json['isPrivate'] as bool? ?? false,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
      settings: json['settings'] == null
          ? null
          : UserSettings.fromJson(json['settings'] as Map<String, dynamic>),
      stats: json['stats'] == null
          ? null
          : UserStats.fromJson(json['stats'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$UserToJson(User instance) => <String, dynamic>{
      'id': instance.id,
      'username': instance.username,
      'email': instance.email,
      'displayName': instance.displayName,
      'bio': instance.bio,
      'profilePicture': instance.profilePicture,
      'coverImage': instance.coverImage,
      'followersCount': instance.followersCount,
      'followingCount': instance.followingCount,
      'postsCount': instance.postsCount,
      'isVerified': instance.isVerified,
      'isPrivate': instance.isPrivate,
      'createdAt': instance.createdAt.toIso8601String(),
      'updatedAt': instance.updatedAt.toIso8601String(),
      'settings': instance.settings,
      'stats': instance.stats,
    };

UserSettings _$UserSettingsFromJson(Map<String, dynamic> json) => UserSettings(
      notificationsEnabled: json['notificationsEnabled'] as bool? ?? true,
      emailNotifications: json['emailNotifications'] as bool? ?? true,
      pushNotifications: json['pushNotifications'] as bool? ?? true,
      showActivityStatus: json['showActivityStatus'] as bool? ?? true,
      allowTagging: json['allowTagging'] as bool? ?? true,
      allowMentions: json['allowMentions'] as bool? ?? true,
      allowDuets: json['allowDuets'] as bool? ?? true,
      allowStitches: json['allowStitches'] as bool? ?? true,
      allowDownloads: json['allowDownloads'] as bool? ?? true,
      whoCanMessage: json['whoCanMessage'] as String? ?? 'everyone',
      whoCanComment: json['whoCanComment'] as String? ?? 'everyone',
      whoCanDuet: json['whoCanDuet'] as String? ?? 'everyone',
      whoCanStitch: json['whoCanStitch'] as String? ?? 'everyone',
      blockedWords: (json['blockedWords'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          const [],
    );

Map<String, dynamic> _$UserSettingsToJson(UserSettings instance) =>
    <String, dynamic>{
      'notificationsEnabled': instance.notificationsEnabled,
      'emailNotifications': instance.emailNotifications,
      'pushNotifications': instance.pushNotifications,
      'showActivityStatus': instance.showActivityStatus,
      'allowTagging': instance.allowTagging,
      'allowMentions': instance.allowMentions,
      'allowDuets': instance.allowDuets,
      'allowStitches': instance.allowStitches,
      'allowDownloads': instance.allowDownloads,
      'whoCanMessage': instance.whoCanMessage,
      'whoCanComment': instance.whoCanComment,
      'whoCanDuet': instance.whoCanDuet,
      'whoCanStitch': instance.whoCanStitch,
      'blockedWords': instance.blockedWords,
    };

UserStats _$UserStatsFromJson(Map<String, dynamic> json) => UserStats(
      totalViews: json['totalViews'] as int? ?? 0,
      totalLikes: json['totalLikes'] as int? ?? 0,
      totalShares: json['totalShares'] as int? ?? 0,
      totalComments: json['totalComments'] as int? ?? 0,
      avgWatchTime: (json['avgWatchTime'] as num?)?.toDouble() ?? 0,
      completionRate: (json['completionRate'] as num?)?.toDouble() ?? 0,
      viewsByCountry: Map<String, int>.from(json['viewsByCountry'] as Map? ?? {}),
      viewsByAge: Map<String, int>.from(json['viewsByAge'] as Map? ?? {}),
      viewsByGender: Map<String, int>.from(json['viewsByGender'] as Map? ?? {}),
      peakHours: (json['peakHours'] as List<dynamic>?)
              ?.map((e) => e as int)
              .toList() ??
          const [],
    );

Map<String, dynamic> _$UserStatsToJson(UserStats instance) => <String, dynamic>{
      'totalViews': instance.totalViews,
      'totalLikes': instance.totalLikes,
      'totalShares': instance.totalShares,
      'totalComments': instance.totalComments,
      'avgWatchTime': instance.avgWatchTime,
      'completionRate': instance.completionRate,
      'viewsByCountry': instance.viewsByCountry,
      'viewsByAge': instance.viewsByAge,
      'viewsByGender': instance.viewsByGender,
      'peakHours': instance.peakHours,
    };