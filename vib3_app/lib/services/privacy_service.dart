import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';
import '../models/privacy_settings.dart';

class PrivacyService {
  // Get privacy settings
  static Future<PrivacySettings?> getPrivacySettings({
    required String userId,
    required String token,
  }) async {
    try {
      final response = await http.get(
        Uri.parse('${AppConfig.baseUrl}/api/privacy/settings/$userId'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );
      
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return PrivacySettings.fromJson(data);
      }
      
      // Return default settings if none found
      return PrivacySettings.defaultSettings(userId);
    } catch (e) {
      print('Error getting privacy settings: $e');
      return PrivacySettings.defaultSettings(userId);
    }
  }
  
  // Update privacy settings
  static Future<bool> updatePrivacySettings({
    required PrivacySettings settings,
    required String token,
  }) async {
    try {
      final response = await http.put(
        Uri.parse('${AppConfig.baseUrl}/api/privacy/settings'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode(settings.toJson()),
      );
      
      return response.statusCode == 200;
    } catch (e) {
      print('Error updating privacy settings: $e');
      return false;
    }
  }
  
  // Block user
  static Future<bool> blockUser({
    required String userId,
    required String token,
    String? reason,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('${AppConfig.baseUrl}/api/privacy/block'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'userId': userId,
          'reason': reason,
        }),
      );
      
      return response.statusCode == 200;
    } catch (e) {
      print('Error blocking user: $e');
      return false;
    }
  }
  
  // Unblock user
  static Future<bool> unblockUser({
    required String userId,
    required String token,
  }) async {
    try {
      final response = await http.delete(
        Uri.parse('${AppConfig.baseUrl}/api/privacy/block/$userId'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );
      
      return response.statusCode == 200;
    } catch (e) {
      print('Error unblocking user: $e');
      return false;
    }
  }
  
  // Mute user
  static Future<bool> muteUser({
    required String userId,
    required String token,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('${AppConfig.baseUrl}/api/privacy/mute'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'userId': userId,
        }),
      );
      
      return response.statusCode == 200;
    } catch (e) {
      print('Error muting user: $e');
      return false;
    }
  }
  
  // Unmute user
  static Future<bool> unmuteUser({
    required String userId,
    required String token,
  }) async {
    try {
      final response = await http.delete(
        Uri.parse('${AppConfig.baseUrl}/api/privacy/mute/$userId'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );
      
      return response.statusCode == 200;
    } catch (e) {
      print('Error unmuting user: $e');
      return false;
    }
  }
  
  // Get blocked users
  static Future<List<BlockedUser>> getBlockedUsers({
    required String token,
  }) async {
    try {
      final response = await http.get(
        Uri.parse('${AppConfig.baseUrl}/api/privacy/blocked'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );
      
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return (data['blockedUsers'] as List)
            .map((json) => BlockedUser.fromJson(json))
            .toList();
      }
      
      return [];
    } catch (e) {
      print('Error getting blocked users: $e');
      return [];
    }
  }
  
  // Report user/content
  static Future<bool> reportContent({
    required String reportedUserId,
    required ReportType type,
    required String description,
    required String token,
    String? videoId,
    String? commentId,
    List<String> evidenceUrls = const [],
  }) async {
    try {
      final response = await http.post(
        Uri.parse('${AppConfig.baseUrl}/api/safety/report'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'reportedUserId': reportedUserId,
          'reportedVideoId': videoId,
          'reportedCommentId': commentId,
          'type': type.name,
          'description': description,
          'evidenceUrls': evidenceUrls,
        }),
      );
      
      return response.statusCode == 200;
    } catch (e) {
      print('Error reporting content: $e');
      return false;
    }
  }
  
  // Get user reports
  static Future<List<SafetyReport>> getUserReports({
    required String token,
  }) async {
    try {
      final response = await http.get(
        Uri.parse('${AppConfig.baseUrl}/api/safety/reports'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );
      
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return (data['reports'] as List)
            .map((json) => SafetyReport.fromJson(json))
            .toList();
      }
      
      return [];
    } catch (e) {
      print('Error getting user reports: $e');
      return [];
    }
  }
  
  // Add restricted word
  static Future<bool> addRestrictedWord({
    required String word,
    required String token,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('${AppConfig.baseUrl}/api/privacy/restricted-words'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'word': word,
        }),
      );
      
      return response.statusCode == 200;
    } catch (e) {
      print('Error adding restricted word: $e');
      return false;
    }
  }
  
  // Remove restricted word
  static Future<bool> removeRestrictedWord({
    required String word,
    required String token,
  }) async {
    try {
      final response = await http.delete(
        Uri.parse('${AppConfig.baseUrl}/api/privacy/restricted-words'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'word': word,
        }),
      );
      
      return response.statusCode == 200;
    } catch (e) {
      print('Error removing restricted word: $e');
      return false;
    }
  }
  
  // Enable two-factor authentication
  static Future<String?> enableTwoFactor({
    required String token,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('${AppConfig.baseUrl}/api/security/2fa/enable'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );
      
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['qrCode']; // Base64 encoded QR code
      }
      
      return null;
    } catch (e) {
      print('Error enabling two-factor: $e');
      return null;
    }
  }
  
  // Verify two-factor authentication
  static Future<bool> verifyTwoFactor({
    required String code,
    required String token,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('${AppConfig.baseUrl}/api/security/2fa/verify'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'code': code,
        }),
      );
      
      return response.statusCode == 200;
    } catch (e) {
      print('Error verifying two-factor: $e');
      return false;
    }
  }
  
  // Disable two-factor authentication
  static Future<bool> disableTwoFactor({
    required String code,
    required String token,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('${AppConfig.baseUrl}/api/security/2fa/disable'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'code': code,
        }),
      );
      
      return response.statusCode == 200;
    } catch (e) {
      print('Error disabling two-factor: $e');
      return false;
    }
  }
  
  // Get account activity
  static Future<List<Map<String, dynamic>>> getAccountActivity({
    required String token,
  }) async {
    try {
      final response = await http.get(
        Uri.parse('${AppConfig.baseUrl}/api/security/activity'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );
      
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return List<Map<String, dynamic>>.from(data['activities'] ?? []);
      }
      
      return [];
    } catch (e) {
      print('Error getting account activity: $e');
      return [];
    }
  }
}