import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../domain/repositories/video_repository.dart';
import '../../domain/entities/video_entity.dart';
import '../models/video_dto.dart';
import '../datasources/video_remote_datasource.dart';
import '../datasources/video_local_datasource.dart';

/// Implementation of VideoRepository
/// Handles data operations and conversion between DTOs and entities
class VideoRepositoryImpl implements VideoRepository {
  final VideoRemoteDataSource _remoteDataSource;
  final VideoLocalDataSource _localDataSource;
  
  VideoRepositoryImpl({
    required VideoRemoteDataSource remoteDataSource,
    required VideoLocalDataSource localDataSource,
  }) : _remoteDataSource = remoteDataSource,
       _localDataSource = localDataSource;
  
  @override
  Future<List<VideoEntity>> getForYouVideos({int page = 0, int limit = 20}) async {
    try {
      // Try to get from remote first
      final videoDtos = await _remoteDataSource.getForYouVideos(page: page, limit: limit);
      
      // Cache for offline use
      await _localDataSource.cacheVideos(videoDtos, 'for_you');
      
      // Convert DTOs to entities
      return videoDtos.map((dto) => dto.toEntity()).toList();
    } catch (e) {
      // Fallback to cached data if available
      print('Failed to get remote videos, trying cache: $e');
      final cachedVideos = await _localDataSource.getCachedVideos('for_you');
      if (cachedVideos.isNotEmpty) {
        return cachedVideos.map((dto) => dto.toEntity()).toList();
      }
      rethrow;
    }
  }
  
  @override
  Future<List<VideoEntity>> getFollowingVideos({int page = 0, int limit = 20}) async {
    try {
      final videoDtos = await _remoteDataSource.getFollowingVideos(page: page, limit: limit);
      await _localDataSource.cacheVideos(videoDtos, 'following');
      return videoDtos.map((dto) => dto.toEntity()).toList();
    } catch (e) {
      print('Failed to get following videos, trying cache: $e');
      final cachedVideos = await _localDataSource.getCachedVideos('following');
      if (cachedVideos.isNotEmpty) {
        return cachedVideos.map((dto) => dto.toEntity()).toList();
      }
      rethrow;
    }
  }
  
  @override
  Future<List<VideoEntity>> getUserVideos(String userId) async {
    try {
      final videoDtos = await _remoteDataSource.getUserVideos(userId);
      return videoDtos.map((dto) => dto.toEntity()).toList();
    } catch (e) {
      print('Failed to get user videos: $e');
      return [];
    }
  }
  
  @override
  Future<VideoEntity?> getVideoById(String videoId) async {
    try {
      final videoDto = await _remoteDataSource.getVideoById(videoId);
      return videoDto?.toEntity();
    } catch (e) {
      print('Failed to get video by id: $e');
      return null;
    }
  }
  
  @override
  Future<bool> likeVideo(String videoId) async {
    try {
      final success = await _remoteDataSource.likeVideo(videoId);
      if (success) {
        // Update local cache
        await _localDataSource.updateVideoLikeStatus(videoId, true);
      }
      return success;
    } catch (e) {
      print('Failed to like video: $e');
      return false;
    }
  }
  
  @override
  Future<bool> unlikeVideo(String videoId) async {
    try {
      final success = await _remoteDataSource.unlikeVideo(videoId);
      if (success) {
        // Update local cache
        await _localDataSource.updateVideoLikeStatus(videoId, false);
      }
      return success;
    } catch (e) {
      print('Failed to unlike video: $e');
      return false;
    }
  }
  
  @override
  Future<int> getVideoLikes(String videoId) async {
    try {
      return await _remoteDataSource.getVideoLikes(videoId);
    } catch (e) {
      print('Failed to get video likes: $e');
      return 0;
    }
  }
  
  @override
  Future<void> incrementViewCount(String videoId) async {
    try {
      await _remoteDataSource.incrementViewCount(videoId);
    } catch (e) {
      print('Failed to increment view count: $e');
    }
  }
  
  @override
  Future<void> trackWatchTime(String videoId, Duration watchTime) async {
    try {
      await _remoteDataSource.trackWatchTime(videoId, watchTime);
    } catch (e) {
      print('Failed to track watch time: $e');
    }
  }

  @override
  Future<void> markAsNotInterested(String videoId) async {
    try {
      await _remoteDataSource.markAsNotInterested(videoId);
    } catch (e) {
      print('Failed to mark as not interested: $e');
    }
  }
}