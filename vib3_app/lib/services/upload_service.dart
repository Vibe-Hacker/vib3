import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as path;
import 'package:ffmpeg_kit_flutter_new/ffmpeg_kit.dart';
import 'package:ffmpeg_kit_flutter_new/return_code.dart';
import '../config/app_config.dart';
import 'thumbnail_service.dart';

class UploadService {
  /// Flip video horizontally for front camera videos
  static Future<File> _flipVideoHorizontally(File inputFile) async {
    try {
      print('🔄 Flipping video horizontally for front camera...');

      final tempDir = await getTemporaryDirectory();
      final timestamp = DateTime.now().millisecondsSinceEpoch;
      final outputPath = path.join(tempDir.path, 'flipped_$timestamp.mp4');

      // FFmpeg command to flip video horizontally
      final command = '-i "${inputFile.path}" -vf "hflip" -c:a copy -y "$outputPath"';

      print('🎬 Running FFmpeg command: $command');
      final session = await FFmpegKit.execute(command);
      final returnCode = await session.getReturnCode();

      if (ReturnCode.isSuccess(returnCode)) {
        print('✅ Video flipped successfully!');
        final outputFile = File(outputPath);
        if (await outputFile.exists()) {
          print('📁 Flipped video: $outputPath');
          print('📏 Flipped size: ${outputFile.lengthSync() / 1024 / 1024} MB');
          return outputFile;
        } else {
          print('❌ Flipped file not found after FFmpeg success');
          return inputFile;
        }
      } else {
        print('❌ FFmpeg failed with return code: $returnCode');
        final output = await session.getOutput();
        print('FFmpeg output: $output');
        return inputFile;
      }
    } catch (e) {
      print('❌ Error flipping video: $e');
      return inputFile;
    }
  }

  static Future<Map<String, dynamic>> uploadVideo({
    required File videoFile,
    required String description,
    required String privacy,
    required bool allowComments,
    required bool allowDuet,
    required bool allowStitch,
    required String token,
    String? hashtags,
    String? musicName,
    bool isFrontCamera = false,
  }) async {
    try {
      print('🎬 Starting video upload...');
      print('📁 Video file: ${videoFile.path}');
      print('📏 File size: ${videoFile.lengthSync() / 1024 / 1024} MB');
      print('📹 Front camera: $isFrontCamera');

      // Check if file exists
      if (!await videoFile.exists()) {
        print('❌ Video file does not exist!');
        return {'success': false, 'error': 'Video file not found'};
      }

      // Flip video horizontally for front camera to match preview
      File uploadFile = videoFile;
      if (isFrontCamera) {
        print('📹 Front camera detected - flipping video horizontally to match preview');
        uploadFile = await _flipVideoHorizontally(videoFile);
      }
      
      // Generate thumbnail before uploading video
      print('🖼️ Generating thumbnail for video...');
      File? thumbnailFile;
      try {
        thumbnailFile = await ThumbnailService.generateVideoThumbnail(uploadFile.path);
      } catch (e) {
        print('⚠️ Thumbnail generation failed: $e');
      }
      
      // Try multiple endpoint variations
      // IMPORTANT: File upload endpoint first, metadata-only endpoint last
      final endpoints = [
        '${AppConfig.baseUrl}/api/videos/upload',  // Correct file upload endpoint
        '${AppConfig.baseUrl}/api/upload/video',
        '${AppConfig.baseUrl}/api/upload',
        '${AppConfig.baseUrl}/upload',
        '${AppConfig.baseUrl}/feed',
        '${AppConfig.baseUrl}/api/videos',  // Metadata-only endpoint (last resort)
      ];
      
      for (final endpoint in endpoints) {
        print('🔗 Trying upload endpoint: $endpoint');
        
        try {
          // Create multipart request
          final request = http.MultipartRequest('POST', Uri.parse(endpoint));

          // Add headers
          request.headers['Authorization'] = 'Bearer $token';
          print('🔐 Auth token: ${token.substring(0, 10)}...');

          // Add video file (flipped if front camera)
          request.files.add(
            await http.MultipartFile.fromPath(
              'video',
              uploadFile.path,
              filename: 'video_${DateTime.now().millisecondsSinceEpoch}.mp4',
            ),
          );
          
          // Add thumbnail file if generated
          if (thumbnailFile != null && await thumbnailFile.exists()) {
            print('✅ Thumbnail generated, adding to upload...');
            request.files.add(
              await http.MultipartFile.fromPath(
                'thumbnail',
                thumbnailFile.path,
                filename: 'thumb_${DateTime.now().millisecondsSinceEpoch}.jpg',
              ),
            );
          } else {
            print('⚠️ No thumbnail generated, video will use fallback');
          }

          // Add metadata
          request.fields['title'] = description.split('\n').first; // First line as title
          request.fields['description'] = description;
          request.fields['privacy'] = privacy;
          request.fields['allowComments'] = allowComments.toString();
          request.fields['allowDuet'] = allowDuet.toString();
          request.fields['allowStitch'] = allowStitch.toString();
          request.fields['bypassProcessing'] = 'false'; // Skip video processing to avoid errors

          // DEBUG: Log isFrontCamera value before adding to request
          print('📹 DEBUG: isFrontCamera parameter value = $isFrontCamera');
          print('📹 DEBUG: isFrontCamera.toString() = ${isFrontCamera.toString()}');

          // Send the actual isFrontCamera value so backend knows to display it mirrored
          request.fields['isFrontCamera'] = isFrontCamera.toString();

          // DEBUG: Confirm field was added
          print('📹 DEBUG: Added isFrontCamera to request.fields');
          print('📹 DEBUG: request.fields[\'isFrontCamera\'] = ${request.fields['isFrontCamera']}');

          // Add hashtags and music info if provided
          if (hashtags != null && hashtags.isNotEmpty) {
            request.fields['hashtags'] = hashtags;
          }
          if (musicName != null && musicName.isNotEmpty) {
            request.fields['musicName'] = musicName;
          }

          // DEBUG: Show all fields being sent
          print('📋 DEBUG: All request.fields being sent to backend:');
          request.fields.forEach((key, value) {
            print('   - $key: $value');
          });

          print('📤 Sending upload request...');
          final response = await request.send().timeout(
            const Duration(minutes: 5),
            onTimeout: () {
              throw Exception('Upload timeout after 5 minutes');
            },
          );
          
          final responseBody = await response.stream.bytesToString();
          print('📥 Response status: ${response.statusCode}');
          print('📄 Response body: $responseBody');
          
          if (response.statusCode == 200 || response.statusCode == 201) {
            print('✅ Upload successful!');
            try {
              final responseData = jsonDecode(responseBody);
              return {
                'success': true,
                'videoId': responseData['videoId'] ?? responseData['id'],
                'data': responseData,
              };
            } catch (e) {
              // If response is not JSON, still consider it success
              return {'success': true};
            }
          } else if (response.statusCode == 404) {
            print('❌ Endpoint not found, trying next...');
            continue;
          } else {
            print('❌ Upload failed with status ${response.statusCode}');
            // Try to parse error message
            try {
              final errorData = jsonDecode(responseBody);
              return {
                'success': false,
                'error': errorData['message'] ?? errorData['error'] ?? 'Upload failed',
                'details': errorData,
              };
            } catch (e) {
              return {
                'success': false,
                'error': 'Upload failed with status ${response.statusCode}',
                'details': responseBody,
              };
            }
          }
        } catch (e) {
          print('❌ Error with endpoint $endpoint: $e');
          if (endpoint == endpoints.last) {
            // This was the last endpoint to try
            return {
              'success': false,
              'error': 'Upload failed: $e',
            };
          }
          // Continue to next endpoint
        }
      }
      
      // All endpoints failed
      return {
        'success': false,
        'error': 'All upload endpoints failed. Server may be down.',
      };
    } catch (e) {
      print('❌ Upload error: $e');
      return {
        'success': false,
        'error': 'Upload error: $e',
      };
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