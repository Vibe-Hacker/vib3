import 'dart:io';
import 'package:flutter/foundation.dart';
import '../models/video_model.dart';
import '../services/video_service.dart';

class VideoProvider extends ChangeNotifier {
  final VideoService _videoService = VideoService();
  
  List<Video> _videos = [];
  bool _isLoading = false;
  String? _error;
  int _currentVideoIndex = 0;
  bool _hasMore = true;
  int _currentPage = 1;

  List<Video> get videos => _videos;
  bool get isLoading => _isLoading;
  String? get error => _error;
  int get currentVideoIndex => _currentVideoIndex;
  bool get hasMore => _hasMore;
  Video? get currentVideo => _videos.isNotEmpty ? _videos[_currentVideoIndex] : null;

  Future<void> loadVideos({bool refresh = false}) async {
    if (_isLoading) return;
    
    try {
      _isLoading = true;
      if (refresh) {
        _currentPage = 1;
        _hasMore = true;
      }
      notifyListeners();

      print('Loading videos: page $_currentPage, hasMore: $_hasMore, refresh: $refresh');
      final response = await _videoService.getVideos(page: _currentPage);
      
      final newVideos = response['videos'] as List<Video>? ?? [];
      print('Received ${newVideos.length} videos');
      
      if (refresh) {
        _videos = newVideos;
      } else {
        _videos.addAll(newVideos);
      }
      
      // If we got fewer videos than requested, assume no more
      _hasMore = newVideos.length >= 20; // Updated page size
      
      // Also check backend response
      if (response.containsKey('hasMore')) {
        _hasMore = response['hasMore'] as bool;
      }
      
      print('Total videos: ${_videos.length}, hasMore: $_hasMore');
      
      if (_hasMore && newVideos.isNotEmpty) _currentPage++;
      
      _error = null;
    } catch (e) {
      print('Error loading videos: $e');
      _error = 'Failed to load videos: $e';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void setCurrentVideoIndex(int index) {
    if (index >= 0 && index < _videos.length) {
      _currentVideoIndex = index;
      notifyListeners();
      
      print('Current video index: $index of ${_videos.length}');
      
      // Load more videos when approaching the end (trigger earlier)
      if (index >= _videos.length - 2 && _hasMore && !_isLoading) {
        print('Triggering load more videos...');
        loadVideos();
      }
    }
  }

  Future<void> likeVideo(String videoId) async {
    try {
      final videoIndex = _videos.indexWhere((v) => v.id == videoId);
      if (videoIndex == -1) return;

      // Optimistic update
      _videos[videoIndex].isLiked = !_videos[videoIndex].isLiked;
      _videos[videoIndex].likeCount += _videos[videoIndex].isLiked ? 1 : -1;
      notifyListeners();

      // Send to backend
      await _videoService.toggleLike(videoId);
    } catch (e) {
      // Revert on error
      final videoIndex = _videos.indexWhere((v) => v.id == videoId);
      if (videoIndex != -1) {
        _videos[videoIndex].isLiked = !_videos[videoIndex].isLiked;
        _videos[videoIndex].likeCount += _videos[videoIndex].isLiked ? 1 : -1;
        notifyListeners();
      }
    }
  }

  Future<void> shareVideo(String videoId) async {
    try {
      final videoIndex = _videos.indexWhere((v) => v.id == videoId);
      if (videoIndex == -1) return;

      // Increment share count
      _videos[videoIndex].shareCount++;
      notifyListeners();

      await _videoService.shareVideo(videoId);
    } catch (e) {
      print('Error sharing video: $e');
    }
  }

  Future<bool> uploadVideo(File videoFile, String description, List<String> tags) async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      final response = await _videoService.uploadVideo(videoFile, description, tags);
      
      if (response['success']) {
        // Add new video to the beginning of the list
        final newVideo = Video.fromJson(response['video']);
        _videos.insert(0, newVideo);
        notifyListeners();
        return true;
      } else {
        _error = response['message'] ?? 'Upload failed';
        return false;
      }
    } catch (e) {
      _error = 'Upload error: $e';
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> followUser(String userId) async {
    try {
      // Find all videos by this user and update follow status
      for (var video in _videos) {
        if (video.userId == userId) {
          video.isFollowing = !video.isFollowing;
        }
      }
      notifyListeners();

      await _videoService.toggleFollow(userId);
    } catch (e) {
      // Revert on error
      for (var video in _videos) {
        if (video.userId == userId) {
          video.isFollowing = !video.isFollowing;
        }
      }
      notifyListeners();
    }
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}