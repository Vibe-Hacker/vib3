import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';
import '../models/conversation.dart';
import '../models/message.dart';
import '../models/user.dart';

class MessageService {
  static Future<List<Conversation>> getConversations(String token) async {
    try {
      final response = await http.get(
        Uri.parse('${AppConfig.baseUrl}/api/conversations'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final List<Conversation> conversations = [];
        
        final conversationsList = data['conversations'] ?? data ?? [];
        for (final conversationJson in conversationsList) {
          try {
            conversations.add(Conversation.fromJson(conversationJson));
          } catch (e) {
            print('Error parsing conversation: $e');
          }
        }
        
        return conversations;
      } else {
        // Return mock conversations if endpoint doesn't exist
        return _getMockConversations();
      }
    } catch (e) {
      print('Error fetching conversations: $e');
      return _getMockConversations();
    }
  }

  static Future<List<Message>> getMessages(String conversationId, String token) async {
    try {
      final response = await http.get(
        Uri.parse('${AppConfig.baseUrl}/api/conversations/$conversationId/messages'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final List<Message> messages = [];
        
        final messagesList = data['messages'] ?? data ?? [];
        for (final messageJson in messagesList) {
          try {
            messages.add(Message.fromJson(messageJson));
          } catch (e) {
            print('Error parsing message: $e');
          }
        }
        
        // Sort by creation date (oldest first)
        messages.sort((a, b) => a.createdAt.compareTo(b.createdAt));
        return messages;
      } else {
        // Return mock messages if endpoint doesn't exist
        return _getMockMessages(conversationId);
      }
    } catch (e) {
      print('Error fetching messages: $e');
      return _getMockMessages(conversationId);
    }
  }

  static Future<Message?> sendMessage(
    String conversationId,
    String content,
    String token, {
    MessageType type = MessageType.text,
    String? mediaUrl,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('${AppConfig.baseUrl}/api/conversations/$conversationId/messages'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'content': content,
          'type': type.name,
          'mediaUrl': mediaUrl,
        }),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = jsonDecode(response.body);
        return Message.fromJson(data['message'] ?? data);
      } else {
        throw Exception('Failed to send message: ${response.statusCode}');
      }
    } catch (e) {
      print('Error sending message: $e');
      return null;
    }
  }

  static Future<Conversation?> createConversation(String otherUserId, String token) async {
    try {
      final response = await http.post(
        Uri.parse('${AppConfig.baseUrl}/api/conversations'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'otherUserId': otherUserId,
        }),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = jsonDecode(response.body);
        return Conversation.fromJson(data['conversation'] ?? data);
      } else {
        throw Exception('Failed to create conversation: ${response.statusCode}');
      }
    } catch (e) {
      print('Error creating conversation: $e');
      return null;
    }
  }

  static Future<bool> markMessagesAsRead(String conversationId, String token) async {
    try {
      final response = await http.patch(
        Uri.parse('${AppConfig.baseUrl}/api/conversations/$conversationId/read'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      return response.statusCode == 200;
    } catch (e) {
      print('Error marking messages as read: $e');
      return false;
    }
  }

  static Future<bool> deleteConversation(String conversationId, String token) async {
    try {
      final response = await http.delete(
        Uri.parse('${AppConfig.baseUrl}/api/conversations/$conversationId'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      return response.statusCode == 200;
    } catch (e) {
      print('Error deleting conversation: $e');
      return false;
    }
  }

  static List<Conversation> _getMockConversations() {
    final now = DateTime.now();
    return [
      Conversation(
        id: '1',
        participantIds: ['user1', 'user2'],
        otherUser: const User(
          id: 'user2',
          username: 'john_doe',
          email: 'john@example.com',
          bio: 'Content creator',
          followersCount: 1200,
          followingCount: 300,
          videosCount: 45,
        ),
        lastMessage: Message(
          id: 'msg1',
          conversationId: '1',
          senderId: 'user2',
          content: 'Hey! Love your latest video 🔥',
          messageType: MessageType.text,
          isRead: false,
          createdAt: now.subtract(const Duration(minutes: 5)),
        ),
        unreadCount: 1,
        createdAt: now.subtract(const Duration(days: 3)),
        updatedAt: now.subtract(const Duration(minutes: 5)),
      ),
      Conversation(
        id: '2',
        participantIds: ['user1', 'user3'],
        otherUser: const User(
          id: 'user3',
          username: 'jane_artist',
          email: 'jane@example.com',
          bio: 'Digital artist & animator',
          followersCount: 5600,
          followingCount: 150,
          videosCount: 89,
        ),
        lastMessage: Message(
          id: 'msg2',
          conversationId: '2',
          senderId: 'user1',
          content: 'Thanks for the collab! 🎨',
          messageType: MessageType.text,
          isRead: true,
          createdAt: now.subtract(const Duration(hours: 2)),
        ),
        unreadCount: 0,
        createdAt: now.subtract(const Duration(days: 7)),
        updatedAt: now.subtract(const Duration(hours: 2)),
      ),
    ];
  }

  static List<Message> _getMockMessages(String conversationId) {
    final now = DateTime.now();
    return [
      Message(
        id: 'msg1',
        conversationId: conversationId,
        senderId: 'user2',
        content: 'Hey there! 👋',
        messageType: MessageType.text,
        isRead: true,
        createdAt: now.subtract(const Duration(hours: 1)),
      ),
      Message(
        id: 'msg2',
        conversationId: conversationId,
        senderId: 'user1',
        content: 'Hi! How are you doing?',
        messageType: MessageType.text,
        isRead: true,
        createdAt: now.subtract(const Duration(minutes: 50)),
      ),
      Message(
        id: 'msg3',
        conversationId: conversationId,
        senderId: 'user2',
        content: 'Great! Just finished editing my new video. Excited to share it! 🎬',
        messageType: MessageType.text,
        isRead: true,
        createdAt: now.subtract(const Duration(minutes: 45)),
      ),
      Message(
        id: 'msg4',
        conversationId: conversationId,
        senderId: 'user1',
        content: 'That sounds awesome! Can\'t wait to see it 🔥',
        messageType: MessageType.text,
        isRead: false,
        createdAt: now.subtract(const Duration(minutes: 40)),
      ),
    ];
  }
}