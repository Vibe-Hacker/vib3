import 'user_model.dart';

enum MessageType {
  text,
  photo,
  video,
  voice,
  sticker,
  gif,
}

enum MessageDuration {
  fiveSeconds,
  tenSeconds,
  thirtySeconds,
  oneMinute,
  fiveMinutes,
  oneHour,
  oneDay,
  permanent,
}

class Message {
  final String id;
  final String conversationId;
  final String senderId;
  final String recipientId;
  final String content;
  final String? mediaUrl;
  final String? thumbnailUrl;
  final MessageType type;
  final MessageDuration duration;
  final DateTime createdAt;
  final DateTime? viewedAt;
  final DateTime? expiresAt;
  final bool isRead;
  final bool isDeleted;
  final Message? replyTo;
  
  Message({
    required this.id,
    required this.conversationId,
    required this.senderId,
    required this.recipientId,
    required this.content,
    this.mediaUrl,
    this.thumbnailUrl,
    required this.type,
    required this.duration,
    required this.createdAt,
    this.viewedAt,
    this.expiresAt,
    this.isRead = false,
    this.isDeleted = false,
    this.replyTo,
  });
  
  bool get isExpired {
    if (expiresAt == null) return false;
    return DateTime.now().isAfter(expiresAt!);
  }
  
  factory Message.fromJson(Map<String, dynamic> json) {
    return Message(
      id: json['id'] as String,
      conversationId: json['conversationId'] as String,
      senderId: json['senderId'] as String,
      recipientId: json['recipientId'] as String,
      content: json['content'] as String,
      mediaUrl: json['mediaUrl'] as String?,
      thumbnailUrl: json['thumbnailUrl'] as String?,
      type: MessageType.values.firstWhere(
        (e) => e.toString() == 'MessageType.${json['type']}',
        orElse: () => MessageType.text,
      ),
      duration: MessageDuration.values.firstWhere(
        (e) => e.toString() == 'MessageDuration.${json['duration']}',
        orElse: () => MessageDuration.permanent,
      ),
      createdAt: DateTime.parse(json['createdAt'] as String),
      viewedAt: json['viewedAt'] != null 
          ? DateTime.parse(json['viewedAt'] as String)
          : null,
      expiresAt: json['expiresAt'] != null 
          ? DateTime.parse(json['expiresAt'] as String)
          : null,
      isRead: json['isRead'] as bool? ?? false,
      isDeleted: json['isDeleted'] as bool? ?? false,
      replyTo: json['replyTo'] != null 
          ? Message.fromJson(json['replyTo'])
          : null,
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'conversationId': conversationId,
      'senderId': senderId,
      'recipientId': recipientId,
      'content': content,
      'mediaUrl': mediaUrl,
      'thumbnailUrl': thumbnailUrl,
      'type': type.toString().split('.').last,
      'duration': duration.toString().split('.').last,
      'createdAt': createdAt.toIso8601String(),
      'viewedAt': viewedAt?.toIso8601String(),
      'expiresAt': expiresAt?.toIso8601String(),
      'isRead': isRead,
      'isDeleted': isDeleted,
      'replyTo': replyTo?.toJson(),
    };
  }
}

class Conversation {
  final String id;
  final List<String> participantIds;
  final List<User>? participants;
  final Message? lastMessage;
  final int unreadCount;
  final bool isGroup;
  final String? groupName;
  final String? groupAvatar;
  final DateTime createdAt;
  final DateTime updatedAt;
  
  Conversation({
    required this.id,
    required this.participantIds,
    this.participants,
    this.lastMessage,
    this.unreadCount = 0,
    this.isGroup = false,
    this.groupName,
    this.groupAvatar,
    required this.createdAt,
    required this.updatedAt,
  });
  
  factory Conversation.fromJson(Map<String, dynamic> json) {
    return Conversation(
      id: json['id'] as String,
      participantIds: (json['participantIds'] as List<dynamic>).cast<String>(),
      participants: (json['participants'] as List<dynamic>?)
          ?.map((e) => User.fromJson(e as Map<String, dynamic>))
          .toList(),
      lastMessage: json['lastMessage'] != null 
          ? Message.fromJson(json['lastMessage'])
          : null,
      unreadCount: json['unreadCount'] as int? ?? 0,
      isGroup: json['isGroup'] as bool? ?? false,
      groupName: json['groupName'] as String?,
      groupAvatar: json['groupAvatar'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'participantIds': participantIds,
      'participants': participants?.map((e) => e.toJson()).toList(),
      'lastMessage': lastMessage?.toJson(),
      'unreadCount': unreadCount,
      'isGroup': isGroup,
      'groupName': groupName,
      'groupAvatar': groupAvatar,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }
}