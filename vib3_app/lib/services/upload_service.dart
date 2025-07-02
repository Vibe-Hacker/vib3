import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';

class UploadService {
  static Future<bool> uploadVideo({
    required File videoFile,
    required String description,
    required String privacy,
    required bool allowComments,
    required bool allowDuet,
    required bool allowStitch,
    required String token,
  }) async {
    try {
      // Create multipart request
      final request = http.MultipartRequest(
        'POST',
        Uri.parse('${AppConfig.baseUrl}/api/videos/upload'),
      );

      // Add headers
      request.headers['Authorization'] = 'Bearer $token';

      // Add video file
      request.files.add(
        await http.MultipartFile.fromPath(
          'video',
          videoFile.path,
        ),
      );

      // Add metadata
      request.fields['description'] = description;
      request.fields['privacy'] = privacy;
      request.fields['allowComments'] = allowComments.toString();
      request.fields['allowDuet'] = allowDuet.toString();
      request.fields['allowStitch'] = allowStitch.toString();

      // Send request
      final response = await request.send();
      
      if (response.statusCode == 200 || response.statusCode == 201) {
        return true;
      } else {
        final responseBody = await response.stream.bytesToString();
        print('Upload failed: ${response.statusCode} - $responseBody');
        return false;
      }
    } catch (e) {
      print('Upload error: $e');
      return false;
    }
  }

  static Future<bool> uploadThumbnail({
    required String videoId,
    required File thumbnailFile,
    required String token,
  }) async {
    try {
      final request = http.MultipartRequest(
        'POST',
        Uri.parse('${AppConfig.baseUrl}/api/videos/$videoId/thumbnail'),
      );

      request.headers['Authorization'] = 'Bearer $token';
      
      request.files.add(
        await http.MultipartFile.fromPath(
          'thumbnail',
          thumbnailFile.path,
        ),
      );

      final response = await request.send();
      return response.statusCode == 200;
    } catch (e) {
      print('Thumbnail upload error: $e');
      return false;
    }
  }

  static Future<Map<String, dynamic>?> getUploadProgress(String uploadId, String token) async {
    try {
      final response = await http.get(
        Uri.parse('${AppConfig.baseUrl}/api/uploads/$uploadId/progress'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return null;
    } catch (e) {
      print('Error getting upload progress: $e');
      return null;
    }
  }
}