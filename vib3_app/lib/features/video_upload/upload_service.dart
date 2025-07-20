import 'dart:io';
import 'dart:async';
import 'package:http/http.dart' as http;
import 'package:flutter/material.dart';
import '../../config/app_config.dart';
import '../../core/video_pipeline/pipeline_manager.dart';
import '../../core/video_pipeline/pipeline_state.dart';

class UploadService {
  static final UploadService _instance = UploadService._internal();
  static UploadService get instance => _instance;
  UploadService._internal();

  StreamController<double>? _uploadProgressController;
  http.MultipartRequest? _currentRequest;
  
  Stream<double> get uploadProgress => 
      _uploadProgressController?.stream ?? const Stream.empty();
  
  Future<UploadResult> uploadVideo({
    required String videoPath,
    required String thumbnailPath,
    required String token,
    required Map<String, dynamic> metadata,
  }) async {
    try {
      VideoPipelineManager.instance.updateStage(PipelineStage.uploading);
      
      // Create progress stream
      _uploadProgressController = StreamController<double>.broadcast();
      
      // Create multipart request
      final uri = Uri.parse('${AppConfig.apiUrl}${AppConfig.uploadEndpoint}');
      _currentRequest = http.MultipartRequest('POST', uri);
      
      // Add auth header
      _currentRequest!.headers['Authorization'] = 'Bearer $token';
      
      // Add metadata fields
      metadata.forEach((key, value) {
        if (value != null) {
          _currentRequest!.fields[key] = value.toString();
        }
      });
      
      // Add video file
      final videoFile = File(videoPath);
      if (!await videoFile.exists()) {
        throw Exception('Video file not found');
      }
      
      final videoStream = http.ByteStream(videoFile.openRead());
      final videoLength = await videoFile.length();
      
      _currentRequest!.files.add(
        http.MultipartFile(
          'video',
          videoStream,
          videoLength,
          filename: 'video.mp4',
        ),
      );
      
      // Add thumbnail file
      final thumbnailFile = File(thumbnailPath);
      if (await thumbnailFile.exists()) {
        final thumbnailStream = http.ByteStream(thumbnailFile.openRead());
        final thumbnailLength = await thumbnailFile.length();
        
        _currentRequest!.files.add(
          http.MultipartFile(
            'thumbnail',
            thumbnailStream,
            thumbnailLength,
            filename: 'thumbnail.jpg',
          ),
        );
      }
      
      // Track upload progress
      int bytesUploaded = 0;
      final totalBytes = videoLength + (await thumbnailFile.length());
      
      // Send request with progress tracking
      final response = await _sendRequestWithProgress(
        _currentRequest!,
        (bytes) {
          bytesUploaded += bytes;
          final progress = bytesUploaded / totalBytes;
          _uploadProgressController?.add(progress);
          VideoPipelineManager.instance.updateProgress(progress);
        },
      );
      
      if (response.statusCode == 200 || response.statusCode == 201) {
        VideoPipelineManager.instance.updateStage(PipelineStage.completed);
        return UploadResult(
          success: true,
          videoId: response.body, // Assuming server returns video ID
        );
      } else {
        throw Exception('Upload failed: ${response.statusCode}');
      }
      
    } catch (e) {
      debugPrint('Upload failed: $e');
      VideoPipelineManager.instance.reportError('Upload failed: $e');
      return UploadResult(
        success: false,
        error: e.toString(),
      );
    } finally {
      _uploadProgressController?.close();
      _uploadProgressController = null;
      _currentRequest = null;
    }
  }
  
  Future<http.Response> _sendRequestWithProgress(
    http.MultipartRequest request,
    Function(int) onProgress,
  ) async {
    final client = http.Client();
    
    try {
      final streamedResponse = await client.send(request);
      
      // Create a completer for the response
      final completer = Completer<http.Response>();
      
      final bytes = <int>[];
      streamedResponse.stream.listen(
        (chunk) {
          bytes.addAll(chunk);
          onProgress(chunk.length);
        },
        onDone: () {
          final response = http.Response.bytes(
            bytes,
            streamedResponse.statusCode,
            headers: streamedResponse.headers,
          );
          completer.complete(response);
        },
        onError: (error) {
          completer.completeError(error);
        },
      );
      
      return await completer.future;
    } finally {
      client.close();
    }
  }
  
  Future<void> cancelUpload() async {
    _currentRequest = null;
    _uploadProgressController?.close();
    VideoPipelineManager.instance.updateStage(PipelineStage.idle);
  }
  
  Map<String, dynamic> prepareMetadata(PipelineState state) {
    return {
      'description': state.description,
      'hashtags': state.hashtags.join(','),
      'musicId': state.musicId,
      'musicName': state.musicName,
      'isPublic': state.isPublic,
      'allowComments': state.allowComments,
      'allowDuets': state.allowDuets,
      'allowStitches': state.allowStitches,
      'effects': state.appliedEffects.entries
          .map((e) => '${e.key}:${e.value}')
          .join(','),
    };
  }
}

class UploadResult {
  final bool success;
  final String? videoId;
  final String? error;
  
  UploadResult({
    required this.success,
    this.videoId,
    this.error,
  });
}