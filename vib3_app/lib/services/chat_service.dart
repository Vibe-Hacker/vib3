import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';
import '../models/chat.dart';
import '../models/dm_message.dart';

class ChatService {
  // Get user's chats
  static Future<List<Chat>> getUserChats(String token) async {
    try {
      final response = await http.get(
        Uri.parse('${AppConfig.baseUrl}/api/chats'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final List<dynamic> chatsJson = data['chats'] ?? [];
        return chatsJson.map((json) => Chat.fromJson(json)).toList();
      }
      
      return [];
    } catch (e) {
      print('Error getting chats: $e');
      return [];
    }
  }
  
  // Create or get direct chat
  static Future<Chat?> createOrGetDirectChat({
    required String otherUserId,
    required String token,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('${AppConfig.baseUrl}/api/chats/direct'),
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
        return Chat.fromJson(data['chat'] ?? data);
      }
      
      return null;
    } catch (e) {
      print('Error creating chat: $e');
      return null;
    }
  }
  
  // Create group chat
  static Future<Chat?> createGroupChat({
    required List<String> participantIds,
    required String groupName,
    required String token,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('${AppConfig.baseUrl}/api/chats/group'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'participantIds': participantIds,
          'groupName': groupName,
        }),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = jsonDecode(response.body);
        return Chat.fromJson(data['chat'] ?? data);
      }
      
      return null;
    } catch (e) {
      print('Error creating group chat: $e');
      return null;
    }
  }
  
  // Get messages for a chat
  static Future<List<Message>> getChatMessages({
    required String chatId,
    required String token,
    int offset = 0,
    int limit = 50,
  }) async {
    try {
      final queryParams = {
        'offset': offset.toString(),
        'limit': limit.toString(),
      };
      
      final uri = Uri.parse('${AppConfig.baseUrl}/api/chats/$chatId/messages')
          .replace(queryParameters: queryParams);
      
      final response = await http.get(
        uri,
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final List<dynamic> messagesJson = data['messages'] ?? [];
        return messagesJson.map((json) => Message.fromJson(json)).toList();
      }
      
      return [];
    } catch (e) {
      print('Error getting messages: $e');
      return [];
    }
  }
  
  // Send message
  static Future<Message?> sendMessage({
    required String chatId,
    required String token,
    String? text,
    String? videoUrl,
    String? imageUrl,
    String? audioUrl,
    int? audioDuration,
    String? replyToId,
  }) async {
    try {
      final body = <String, dynamic>{
        'chatId': chatId,
      };
      
      if (text != null) body['text'] = text;
      if (videoUrl != null) body['videoUrl'] = videoUrl;
      if (imageUrl != null) body['imageUrl'] = imageUrl;
      if (audioUrl != null) {
        body['audioUrl'] = audioUrl;
        if (audioDuration != null) body['audioDuration'] = audioDuration;
      }
      if (replyToId != null) body['replyToId'] = replyToId;
      
      final response = await http.post(
        Uri.parse('${AppConfig.baseUrl}/api/messages'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode(body),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = jsonDecode(response.body);
        return Message.fromJson(data['message'] ?? data);
      }
      
      return null;
    } catch (e) {
      print('Error sending message: $e');
      return null;
    }
  }
  
  // Delete message
  static Future<bool> deleteMessage({
    required String messageId,
    required String token,
    bool forEveryone = false,
  }) async {
    try {
      final response = await http.delete(
        Uri.parse('${AppConfig.baseUrl}/api/messages/$messageId'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'forEveryone': forEveryone,
        }),
      );

      return response.statusCode == 200;
    } catch (e) {
      print('Error deleting message: $e');
      return false;
    }
  }
  
  // Mark messages as read
  static Future<bool> markMessagesAsRead({
    required String chatId,
    required String token,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('${AppConfig.baseUrl}/api/chats/$chatId/read'),
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
  
  // Mute/unmute chat
  static Future<bool> toggleMuteChat({
    required String chatId,
    required String token,
    required bool mute,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('${AppConfig.baseUrl}/api/chats/$chatId/mute'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'mute': mute,
        }),
      );

      return response.statusCode == 200;
    } catch (e) {
      print('Error toggling mute: $e');
      return false;
    }
  }
  
  // Clear chat history
  static Future<bool> clearChatHistory({
    required String chatId,
    required String token,
  }) async {
    try {
      final response = await http.delete(
        Uri.parse('${AppConfig.baseUrl}/api/chats/$chatId/messages'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      return response.statusCode == 200;
    } catch (e) {
      print('Error clearing chat: $e');
      return false;
    }
  }
  
  // Send typing indicator
  static Future<void> sendTypingIndicator({
    required String chatId,
    required String token,
    required bool isTyping,
  }) async {
    try {
      await http.post(
        Uri.parse('${AppConfig.baseUrl}/api/chats/$chatId/typing'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'isTyping': isTyping,
        }),
      );
    } catch (e) {
      print('Error sending typing indicator: $e');
    }
  }
  
  // React to message
  static Future<bool> reactToMessage({
    required String messageId,
    required String reaction,
    required String token,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('${AppConfig.baseUrl}/api/messages/$messageId/react'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'reaction': reaction,
        }),
      );

      return response.statusCode == 200;
    } catch (e) {
      print('Error reacting to message: $e');
      return false;
    }
  }
}