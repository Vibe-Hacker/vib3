import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';
import '../models/notification.dart';

class NotificationService {
  static Future<List<AppNotification>> getNotifications(String token) async {
    try {
      final response = await http.get(
        Uri.parse('${AppConfig.baseUrl}/notifications'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        // Check if response is HTML instead of JSON
        if (response.body.trim().startsWith('<') || response.body.contains('<!DOCTYPE')) {
          print('❌ Notifications endpoint returned HTML instead of JSON');
          return _getMockNotifications();
        }
        
        final data = jsonDecode(response.body);
        final List<AppNotification> notifications = [];
        
        final notificationsList = data['notifications'] ?? data ?? [];
        for (final notificationJson in notificationsList) {
          try {
            notifications.add(AppNotification.fromJson(notificationJson));
          } catch (e) {
            print('Error parsing notification: $e');
          }
        }
        
        // Sort by creation date (newest first)
        notifications.sort((a, b) => b.createdAt.compareTo(a.createdAt));
        return notifications;
      } else {
        // Return mock notifications if endpoint doesn't exist
        return _getMockNotifications();
      }
    } catch (e) {
      print('Error fetching notifications: $e');
      return _getMockNotifications();
    }
  }

  static Future<bool> markAsRead(String notificationId, String token) async {
    try {
      final response = await http.patch(
        Uri.parse('${AppConfig.baseUrl}/notifications/$notificationId/read'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      return response.statusCode == 200;
    } catch (e) {
      print('Error marking notification as read: $e');
      return false;
    }
  }

  static Future<bool> markAllAsRead(String token) async {
    try {
      final response = await http.patch(
        Uri.parse('${AppConfig.baseUrl}/notifications/read-all'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      return response.statusCode == 200;
    } catch (e) {
      print('Error marking all notifications as read: $e');
      return false;
    }
  }

  static Future<bool> deleteNotification(String notificationId, String token) async {
    try {
      final response = await http.delete(
        Uri.parse('${AppConfig.baseUrl}/notifications/$notificationId'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      return response.statusCode == 200;
    } catch (e) {
      print('Error deleting notification: $e');
      return false;
    }
  }

  static Future<Map<String, dynamic>> getNotificationSettings(String token) async {
    try {
      final response = await http.get(
        Uri.parse('${AppConfig.baseUrl}/notifications/settings'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        return _getDefaultNotificationSettings();
      }
    } catch (e) {
      print('Error fetching notification settings: $e');
      return _getDefaultNotificationSettings();
    }
  }

  static Future<bool> updateNotificationSettings(
    Map<String, dynamic> settings, 
    String token,
  ) async {
    try {
      final response = await http.put(
        Uri.parse('${AppConfig.baseUrl}/notifications/settings'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode(settings),
      );

      return response.statusCode == 200;
    } catch (e) {
      print('Error updating notification settings: $e');
      return false;
    }
  }

  static List<AppNotification> _getMockNotifications() {
    final now = DateTime.now();
    return [
      AppNotification(
        id: '1',
        userId: 'user123',
        type: 'like',
        title: 'Someone liked your video',
        body: '@cooluser liked your video "Amazing dance moves"',
        isRead: false,
        createdAt: now.subtract(const Duration(minutes: 5)),
      ),
      AppNotification(
        id: '2',
        userId: 'user123',
        type: 'follow',
        title: 'New follower',
        body: '@newuser started following you',
        isRead: false,
        createdAt: now.subtract(const Duration(hours: 1)),
      ),
      AppNotification(
        id: '3',
        userId: 'user123',
        type: 'comment',
        title: 'New comment',
        body: '@someone commented on your video: "This is awesome!"',
        isRead: true,
        createdAt: now.subtract(const Duration(hours: 3)),
      ),
      AppNotification(
        id: '4',
        userId: 'user123',
        type: 'like',
        title: 'Video getting popular',
        body: 'Your video has reached 100 likes!',
        isRead: true,
        createdAt: now.subtract(const Duration(days: 1)),
      ),
      AppNotification(
        id: '5',
        userId: 'user123',
        type: 'follow',
        title: 'New follower',
        body: '@artist started following you',
        isRead: true,
        createdAt: now.subtract(const Duration(days: 2)),
      ),
    ];
  }

  static Map<String, dynamic> _getDefaultNotificationSettings() {
    return {
      'pushNotifications': true,
      'emailNotifications': false,
      'likes': true,
      'comments': true,
      'follows': true,
      'mentions': true,
      'videoUploads': true,
      'liveStreams': true,
    };
  }
}