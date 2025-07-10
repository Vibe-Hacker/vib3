enum PrivacyLevel {
  public,
  friends,
  private,
}

enum ReportType {
  spam,
  harassment,
  hateSpeech,
  violence,
  nudity,
  copyright,
  impersonation,
  other,
}

class PrivacySettings {
  final String userId;
  final PrivacyLevel profileVisibility;
  final PrivacyLevel videoVisibility;
  final PrivacyLevel messageVisibility;
  final bool allowComments;
  final bool allowDuet;
  final bool allowReactions;
  final bool allowDownloads;
  final bool allowMentions;
  final bool allowTagging;
  final bool showOnlineStatus;
  final bool showActivity;
  final bool showFollowingList;
  final bool showFollowersList;
  final bool showLikedVideos;
  final bool enableTwoFactor;
  final bool requireFollowApproval;
  final bool filterOffensiveComments;
  final bool restrictedMode;
  final List<String> blockedUsers;
  final List<String> mutedUsers;
  final List<String> restrictedWords;
  final DateTime lastUpdated;
  
  const PrivacySettings({
    required this.userId,
    required this.profileVisibility,
    required this.videoVisibility,
    required this.messageVisibility,
    required this.allowComments,
    required this.allowDuet,
    required this.allowReactions,
    required this.allowDownloads,
    required this.allowMentions,
    required this.allowTagging,
    required this.showOnlineStatus,
    required this.showActivity,
    required this.showFollowingList,
    required this.showFollowersList,
    required this.showLikedVideos,
    required this.enableTwoFactor,
    required this.requireFollowApproval,
    required this.filterOffensiveComments,
    required this.restrictedMode,
    required this.blockedUsers,
    required this.mutedUsers,
    required this.restrictedWords,
    required this.lastUpdated,
  });
  
  factory PrivacySettings.fromJson(Map<String, dynamic> json) {
    return PrivacySettings(
      userId: json['userId'] ?? '',
      profileVisibility: PrivacyLevel.values.firstWhere(
        (e) => e.name == json['profileVisibility'],
        orElse: () => PrivacyLevel.public,
      ),
      videoVisibility: PrivacyLevel.values.firstWhere(
        (e) => e.name == json['videoVisibility'],
        orElse: () => PrivacyLevel.public,
      ),
      messageVisibility: PrivacyLevel.values.firstWhere(
        (e) => e.name == json['messageVisibility'],
        orElse: () => PrivacyLevel.friends,
      ),
      allowComments: json['allowComments'] ?? true,
      allowDuet: json['allowDuet'] ?? true,
      allowReactions: json['allowReactions'] ?? true,
      allowDownloads: json['allowDownloads'] ?? true,
      allowMentions: json['allowMentions'] ?? true,
      allowTagging: json['allowTagging'] ?? true,
      showOnlineStatus: json['showOnlineStatus'] ?? true,
      showActivity: json['showActivity'] ?? true,
      showFollowingList: json['showFollowingList'] ?? true,
      showFollowersList: json['showFollowersList'] ?? true,
      showLikedVideos: json['showLikedVideos'] ?? true,
      enableTwoFactor: json['enableTwoFactor'] ?? false,
      requireFollowApproval: json['requireFollowApproval'] ?? false,
      filterOffensiveComments: json['filterOffensiveComments'] ?? false,
      restrictedMode: json['restrictedMode'] ?? false,
      blockedUsers: List<String>.from(json['blockedUsers'] ?? []),
      mutedUsers: List<String>.from(json['mutedUsers'] ?? []),
      restrictedWords: List<String>.from(json['restrictedWords'] ?? []),
      lastUpdated: DateTime.parse(json['lastUpdated'] ?? DateTime.now().toIso8601String()),
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'userId': userId,
      'profileVisibility': profileVisibility.name,
      'videoVisibility': videoVisibility.name,
      'messageVisibility': messageVisibility.name,
      'allowComments': allowComments,
      'allowDuet': allowDuet,
      'allowReactions': allowReactions,
      'allowDownloads': allowDownloads,
      'allowMentions': allowMentions,
      'allowTagging': allowTagging,
      'showOnlineStatus': showOnlineStatus,
      'showActivity': showActivity,
      'showFollowingList': showFollowingList,
      'showFollowersList': showFollowersList,
      'showLikedVideos': showLikedVideos,
      'enableTwoFactor': enableTwoFactor,
      'requireFollowApproval': requireFollowApproval,
      'filterOffensiveComments': filterOffensiveComments,
      'restrictedMode': restrictedMode,
      'blockedUsers': blockedUsers,
      'mutedUsers': mutedUsers,
      'restrictedWords': restrictedWords,
      'lastUpdated': lastUpdated.toIso8601String(),
    };
  }
  
  PrivacySettings copyWith({
    String? userId,
    PrivacyLevel? profileVisibility,
    PrivacyLevel? videoVisibility,
    PrivacyLevel? messageVisibility,
    bool? allowComments,
    bool? allowDuet,
    bool? allowReactions,
    bool? allowDownloads,
    bool? allowMentions,
    bool? allowTagging,
    bool? showOnlineStatus,
    bool? showActivity,
    bool? showFollowingList,
    bool? showFollowersList,
    bool? showLikedVideos,
    bool? enableTwoFactor,
    bool? requireFollowApproval,
    bool? filterOffensiveComments,
    bool? restrictedMode,
    List<String>? blockedUsers,
    List<String>? mutedUsers,
    List<String>? restrictedWords,
    DateTime? lastUpdated,
  }) {
    return PrivacySettings(
      userId: userId ?? this.userId,
      profileVisibility: profileVisibility ?? this.profileVisibility,
      videoVisibility: videoVisibility ?? this.videoVisibility,
      messageVisibility: messageVisibility ?? this.messageVisibility,
      allowComments: allowComments ?? this.allowComments,
      allowDuet: allowDuet ?? this.allowDuet,
      allowReactions: allowReactions ?? this.allowReactions,
      allowDownloads: allowDownloads ?? this.allowDownloads,
      allowMentions: allowMentions ?? this.allowMentions,
      allowTagging: allowTagging ?? this.allowTagging,
      showOnlineStatus: showOnlineStatus ?? this.showOnlineStatus,
      showActivity: showActivity ?? this.showActivity,
      showFollowingList: showFollowingList ?? this.showFollowingList,
      showFollowersList: showFollowersList ?? this.showFollowersList,
      showLikedVideos: showLikedVideos ?? this.showLikedVideos,
      enableTwoFactor: enableTwoFactor ?? this.enableTwoFactor,
      requireFollowApproval: requireFollowApproval ?? this.requireFollowApproval,
      filterOffensiveComments: filterOffensiveComments ?? this.filterOffensiveComments,
      restrictedMode: restrictedMode ?? this.restrictedMode,
      blockedUsers: blockedUsers ?? this.blockedUsers,
      mutedUsers: mutedUsers ?? this.mutedUsers,
      restrictedWords: restrictedWords ?? this.restrictedWords,
      lastUpdated: lastUpdated ?? DateTime.now(),
    );
  }
  
  // Default privacy settings
  static PrivacySettings defaultSettings(String userId) {
    return PrivacySettings(
      userId: userId,
      profileVisibility: PrivacyLevel.public,
      videoVisibility: PrivacyLevel.public,
      messageVisibility: PrivacyLevel.friends,
      allowComments: true,
      allowDuet: true,
      allowReactions: true,
      allowDownloads: true,
      allowMentions: true,
      allowTagging: true,
      showOnlineStatus: true,
      showActivity: true,
      showFollowingList: true,
      showFollowersList: true,
      showLikedVideos: true,
      enableTwoFactor: false,
      requireFollowApproval: false,
      filterOffensiveComments: false,
      restrictedMode: false,
      blockedUsers: [],
      mutedUsers: [],
      restrictedWords: [],
      lastUpdated: DateTime.now(),
    );
  }
}

class SafetyReport {
  final String id;
  final String reporterId;
  final String reportedUserId;
  final String? reportedVideoId;
  final String? reportedCommentId;
  final ReportType type;
  final String description;
  final DateTime createdAt;
  final ReportStatus status;
  final String? moderatorId;
  final String? moderatorNotes;
  final DateTime? resolvedAt;
  final List<String> evidenceUrls;
  
  const SafetyReport({
    required this.id,
    required this.reporterId,
    required this.reportedUserId,
    this.reportedVideoId,
    this.reportedCommentId,
    required this.type,
    required this.description,
    required this.createdAt,
    required this.status,
    this.moderatorId,
    this.moderatorNotes,
    this.resolvedAt,
    required this.evidenceUrls,
  });
  
  factory SafetyReport.fromJson(Map<String, dynamic> json) {
    return SafetyReport(
      id: json['id'] ?? '',
      reporterId: json['reporterId'] ?? '',
      reportedUserId: json['reportedUserId'] ?? '',
      reportedVideoId: json['reportedVideoId'],
      reportedCommentId: json['reportedCommentId'],
      type: ReportType.values.firstWhere(
        (e) => e.name == json['type'],
        orElse: () => ReportType.other,
      ),
      description: json['description'] ?? '',
      createdAt: DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
      status: ReportStatus.values.firstWhere(
        (e) => e.name == json['status'],
        orElse: () => ReportStatus.pending,
      ),
      moderatorId: json['moderatorId'],
      moderatorNotes: json['moderatorNotes'],
      resolvedAt: json['resolvedAt'] != null ? DateTime.parse(json['resolvedAt']) : null,
      evidenceUrls: List<String>.from(json['evidenceUrls'] ?? []),
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'reporterId': reporterId,
      'reportedUserId': reportedUserId,
      'reportedVideoId': reportedVideoId,
      'reportedCommentId': reportedCommentId,
      'type': type.name,
      'description': description,
      'createdAt': createdAt.toIso8601String(),
      'status': status.name,
      'moderatorId': moderatorId,
      'moderatorNotes': moderatorNotes,
      'resolvedAt': resolvedAt?.toIso8601String(),
      'evidenceUrls': evidenceUrls,
    };
  }
}

enum ReportStatus {
  pending,
  underReview,
  resolved,
  dismissed,
}

class BlockedUser {
  final String userId;
  final String username;
  final String? avatarUrl;
  final DateTime blockedAt;
  final String? reason;
  
  const BlockedUser({
    required this.userId,
    required this.username,
    this.avatarUrl,
    required this.blockedAt,
    this.reason,
  });
  
  factory BlockedUser.fromJson(Map<String, dynamic> json) {
    return BlockedUser(
      userId: json['userId'] ?? '',
      username: json['username'] ?? '',
      avatarUrl: json['avatarUrl'],
      blockedAt: DateTime.parse(json['blockedAt'] ?? DateTime.now().toIso8601String()),
      reason: json['reason'],
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'userId': userId,
      'username': username,
      'avatarUrl': avatarUrl,
      'blockedAt': blockedAt.toIso8601String(),
      'reason': reason,
    };
  }
}