import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';

class AnalyticsService {
  // Get analytics data
  static Future<Map<String, dynamic>> getAnalytics({
    required String token,
    int period = 7,
  }) async {
    try {
      final queryParams = {
        'period': period.toString(),
      };
      
      final uri = Uri.parse('${AppConfig.baseUrl}/api/analytics')
          .replace(queryParameters: queryParams);
      
      final response = await http.get(
        uri,
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );
      
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      
      // Return mock data for development
      return _getMockAnalytics(period);
    } catch (e) {
      print('Error getting analytics: $e');
      return _getMockAnalytics(period);
    }
  }
  
  // Get video analytics
  static Future<Map<String, dynamic>> getVideoAnalytics({
    required String videoId,
    required String token,
  }) async {
    try {
      final response = await http.get(
        Uri.parse('${AppConfig.baseUrl}/api/analytics/video/$videoId'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );
      
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      
      return {};
    } catch (e) {
      print('Error getting video analytics: $e');
      return {};
    }
  }
  
  // Get live stream analytics
  static Future<Map<String, dynamic>> getLiveAnalytics({
    required String streamId,
    required String token,
  }) async {
    try {
      final response = await http.get(
        Uri.parse('${AppConfig.baseUrl}/api/analytics/live/$streamId'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );
      
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      
      return {};
    } catch (e) {
      print('Error getting live analytics: $e');
      return {};
    }
  }
  
  // Export analytics data
  static Future<bool> exportAnalytics({
    required String token,
    required String format,
    int period = 30,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('${AppConfig.baseUrl}/api/analytics/export'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'format': format,
          'period': period,
        }),
      );
      
      return response.statusCode == 200;
    } catch (e) {
      print('Error exporting analytics: $e');
      return false;
    }
  }
  
  // Mock analytics data
  static Map<String, dynamic> _getMockAnalytics(int period) {
    final random = DateTime.now().millisecondsSinceEpoch % 100;
    
    return {
      'totalViews': 125000 + random * 100,
      'viewsChange': 15.3,
      'profileViews': 4560 + random * 10,
      'profileViewsChange': 8.7,
      'totalLikes': 8900 + random * 10,
      'likesChange': 12.1,
      'totalComments': 2340 + random * 5,
      'commentsChange': -2.4,
      'totalShares': 1670 + random * 5,
      'sharesChange': 5.9,
      'newFollowers': 180 + random,
      'followersChange': 3.2,
      
      'viewsHistory': List.generate(period, (i) => 1000 + (i * 100) + (random * 10)),
      'engagementHistory': List.generate(period, (i) => 5.0 + (i * 0.2) + (random * 0.1)),
      
      'topVideos': [],
      
      'demographics': {
        '13-17': 12.5,
        '18-24': 35.2,
        '25-34': 28.7,
        '35-44': 15.3,
        '45+': 8.3,
      },
      
      'genderMale': 45,
      'genderFemale': 55,
      
      'trafficSources': {
        'forYou': 45.2,
        'following': 23.5,
        'profile': 18.7,
        'search': 8.3,
        'other': 4.3,
      },
      
      'topLocations': [
        {'name': 'United States', 'percentage': 35},
        {'name': 'United Kingdom', 'percentage': 15},
        {'name': 'Canada', 'percentage': 12},
        {'name': 'Australia', 'percentage': 8},
        {'name': 'Germany', 'percentage': 5},
      ],
      
      'avgWatchTime': 45,
      'completionRate': 68,
      'bestPostingTime': '6:00 PM - 9:00 PM',
      'topHashtags': ['#vib3', '#viral', '#fyp', '#trending'],
      
      // Live analytics
      'totalStreams': 12,
      'streamHours': 24,
      'avgViewers': 234,
      'viewersChange': 18.5,
      'totalGifts': 567,
      'giftsChange': 25.3,
      
      'recentStreams': [
        {
          'title': 'Live Q&A Session',
          'date': '2 days ago',
          'viewers': 456,
        },
        {
          'title': 'Gaming Stream',
          'date': '5 days ago',
          'viewers': 289,
        },
      ],
    };
  }
}