import 'dart:convert';
import 'package:http/http.dart' as http;

class GrokService {
  static const String _baseUrl = 'https://api.x.ai/v1';
  static const String _apiKey = 'xai-2c1yfiMnLje8nS8riX1PEZRnMq2uk39bQ9OaRLFnQctyX8DdbeIOnR5s2gEHFl7q94R4gs7aFtFx6pp6';
  
  // Grok AI features for VIB3
  static Future<String> generateVideoDescription(String videoContext) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/chat/completions'),
        headers: {
          'Authorization': 'Bearer $_apiKey',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'messages': [
            {
              'role': 'system',
              'content': 'You are a creative content assistant for VIB3, a TikTok-style video platform. Generate engaging, trendy video descriptions that are catchy and use relevant hashtags.',
            },
            {
              'role': 'user',
              'content': 'Generate a creative description for this video: $videoContext',
            }
          ],
          'model': 'grok-beta',
          'stream': false,
          'temperature': 0.8,
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['choices'][0]['message']['content'];
      } else {
        throw Exception('Failed to generate description: ${response.statusCode}');
      }
    } catch (e) {
      print('Grok error generating description: $e');
      return 'Check out this amazing video! 🔥 #VIB3 #Trending';
    }
  }

  static Future<List<String>> generateHashtags(String videoContent) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/chat/completions'),
        headers: {
          'Authorization': 'Bearer $_apiKey',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'messages': [
            {
              'role': 'system',
              'content': 'You are a hashtag specialist for VIB3. Generate 5-10 relevant, trending hashtags for video content. Return only hashtags separated by spaces, starting with #.',
            },
            {
              'role': 'user',
              'content': 'Generate hashtags for: $videoContent',
            }
          ],
          'model': 'grok-beta',
          'stream': false,
          'temperature': 0.6,
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final hashtagString = data['choices'][0]['message']['content'] as String;
        return hashtagString.split(' ').where((tag) => tag.startsWith('#')).toList();
      } else {
        throw Exception('Failed to generate hashtags: ${response.statusCode}');
      }
    } catch (e) {
      print('Grok error generating hashtags: $e');
      return ['#VIB3', '#Trending', '#Viral', '#ForYou'];
    }
  }

  static Future<String> generateCommentReply(String originalComment, String userContext) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/chat/completions'),
        headers: {
          'Authorization': 'Bearer $_apiKey',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'messages': [
            {
              'role': 'system',
              'content': 'You are a friendly VIB3 user. Generate a casual, engaging reply to comments. Keep it short, fun, and authentic. Use emojis sparingly.',
            },
            {
              'role': 'user',
              'content': 'Reply to this comment: "$originalComment" (Context: $userContext)',
            }
          ],
          'model': 'grok-beta',
          'stream': false,
          'temperature': 0.7,
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['choices'][0]['message']['content'];
      } else {
        throw Exception('Failed to generate reply: ${response.statusCode}');
      }
    } catch (e) {
      print('Grok error generating reply: $e');
      return 'Thanks for watching! 😊';
    }
  }

  static Future<String> enhanceVideoTitle(String originalTitle) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/chat/completions'),
        headers: {
          'Authorization': 'Bearer $_apiKey',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'messages': [
            {
              'role': 'system',
              'content': 'You are a content optimization expert for VIB3. Make video titles more engaging and clickable while keeping them authentic. Maximum 60 characters.',
            },
            {
              'role': 'user',
              'content': 'Enhance this video title: "$originalTitle"',
            }
          ],
          'model': 'grok-beta',
          'stream': false,
          'temperature': 0.7,
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['choices'][0]['message']['content'];
      } else {
        throw Exception('Failed to enhance title: ${response.statusCode}');
      }
    } catch (e) {
      print('Grok error enhancing title: $e');
      return originalTitle;
    }
  }

  static Future<Map<String, dynamic>> getContentInsights(String videoDescription, int views, int likes, int comments) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/chat/completions'),
        headers: {
          'Authorization': 'Bearer $_apiKey',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'messages': [
            {
              'role': 'system',
              'content': 'You are a VIB3 analytics expert. Analyze video performance and provide insights in JSON format with keys: "performance_score" (1-10), "suggestions" (array), "trending_potential" (low/medium/high).',
            },
            {
              'role': 'user',
              'content': 'Analyze: "$videoDescription" - Views: $views, Likes: $likes, Comments: $comments',
            }
          ],
          'model': 'grok-beta',
          'stream': false,
          'temperature': 0.5,
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final content = data['choices'][0]['message']['content'];
        try {
          return jsonDecode(content);
        } catch (e) {
          return {
            'performance_score': 7,
            'suggestions': ['Keep creating great content!'],
            'trending_potential': 'medium'
          };
        }
      } else {
        throw Exception('Failed to get insights: ${response.statusCode}');
      }
    } catch (e) {
      print('Grok error getting insights: $e');
      return {
        'performance_score': 5,
        'suggestions': ['Keep experimenting with content'],
        'trending_potential': 'medium'
      };
    }
  }

  static Future<List<String>> generateVideoIdeas(String userInterests) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/chat/completions'),
        headers: {
          'Authorization': 'Bearer $_apiKey',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'messages': [
            {
              'role': 'system',
              'content': 'You are a creative content strategist for VIB3. Generate 5 unique, trendy video ideas based on user interests. Each idea should be one sentence.',
            },
            {
              'role': 'user',
              'content': 'Generate video ideas for someone interested in: $userInterests',
            }
          ],
          'model': 'grok-beta',
          'stream': false,
          'temperature': 0.9,
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final content = data['choices'][0]['message']['content'] as String;
        return content.split('\n').where((line) => line.trim().isNotEmpty).take(5).toList();
      } else {
        throw Exception('Failed to generate ideas: ${response.statusCode}');
      }
    } catch (e) {
      print('Grok error generating ideas: $e');
      return [
        'Create a day in your life video',
        'Show your favorite morning routine',
        'Make a quick tutorial for something you love',
        'Film a behind-the-scenes moment',
        'Share your thoughts on a trending topic'
      ];
    }
  }
}