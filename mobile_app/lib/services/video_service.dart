import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';
import '../models/video_model.dart';

class VideoService {
  Future<List<Video>> getVideos() async {
    try {
      final response = await http.get(
        Uri.parse('${AppConfig.baseUrl}${AppConfig.videosEndpoint}'),
        headers: {
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final List<dynamic> videosJson = data['videos'] ?? [];
        return videosJson.map((json) => Video.fromJson(json)).toList();
      } else {
        throw Exception('Failed to load videos');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }
}