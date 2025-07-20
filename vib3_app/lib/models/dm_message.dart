/// Model for individual messages
class Message {
  final String id;
  final String chatId;
  final String senderId;
  final String? text;
  final String? videoUrl;
  final String? imageUrl;
  final String? audioUrl;
  final int? audioDuration;
  final MessageType type;
  final bool isRead;
  final bool isDeleted;
  final DateTime? deletedAt;
  final String? deletedFor; // 'everyone' or userId
  final Map<String, String>? reactions;
  final Message? replyTo;
  final DateTime createdAt;
  final DateTime updatedAt;
  
  Message({
    required this.id,
    required this.chatId,
    required this.senderId,
    this.text,
    this.videoUrl,
    this.imageUrl,
    this.audioUrl,
    this.audioDuration,
    required this.type,
    this.isRead = false,
    this.isDeleted = false,
    this.deletedAt,
    this.deletedFor,
    this.reactions,
    this.replyTo,
    required this.createdAt,
    required this.updatedAt,
  });
  
  factory Message.fromJson(Map<String, dynamic> json) {
    return Message(
      id: json['_id'] ?? json['id'] ?? '',
      chatId: json['chatId'] ?? '',
      senderId: json['senderId'] ?? '',
      text: json['text'],
      videoUrl: json['videoUrl'],
      imageUrl: json['imageUrl'],
      audioUrl: json['audioUrl'],
      audioDuration: json['audioDuration'],
      type: MessageType.values.firstWhere(
        (e) => e.toString().split('.').last == json['type'],
        orElse: () => MessageType.text,
      ),
      isRead: json['isRead'] ?? false,
      isDeleted: json['isDeleted'] ?? false,
      deletedAt: json['deletedAt'] != null 
          ? DateTime.parse(json['deletedAt']) 
          : null,
      deletedFor: json['deletedFor'],
      reactions: json['reactions'] != null 
          ? Map<String, String>.from(json['reactions']) 
          : null,
      replyTo: json['replyTo'] != null 
          ? Message.fromJson(json['replyTo']) 
          : null,
      createdAt: json['createdAt'] != null 
          ? DateTime.parse(json['createdAt']) 
          : DateTime.now(),
      updatedAt: json['updatedAt'] != null 
          ? DateTime.parse(json['updatedAt']) 
          : DateTime.now(),
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'chatId': chatId,
      'senderId': senderId,
      'text': text,
      'videoUrl': videoUrl,
      'imageUrl': imageUrl,
      'audioUrl': audioUrl,
      'audioDuration': audioDuration,
      'type': type.toString().split('.').last,
      'isRead': isRead,
      'isDeleted': isDeleted,
      'deletedAt': deletedAt?.toIso8601String(),
      'deletedFor': deletedFor,
      'reactions': reactions,
      'replyTo': replyTo?.toJson(),
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }
}

enum MessageType {
  text,
  video,
  image,
  audio,
  videoShare,
  profileShare,
}

/// Typing indicator model
class TypingIndicator {
  final String userId;
  final String chatId;
  final DateTime timestamp;
  
  TypingIndicator({
    required this.userId,
    required this.chatId,
    required this.timestamp,
  });
}