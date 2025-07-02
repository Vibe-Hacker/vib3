import 'package:flutter/foundation.dart';
import '../models/video.dart';
import '../services/video_service.dart';

class VideoProvider extends ChangeNotifier {
  final List<Video> _videos = [];
  bool _isLoading = false;
  bool _isLoadingMore = false;
  bool _hasMoreVideos = true;
  String? _error;
  String _debugInfo = 'Not loaded yet';
  int _currentPage = 0;
  final int _pageSize = 20;

  List<Video> get videos => _videos;
  bool get isLoading => _isLoading;
  bool get isLoadingMore => _isLoadingMore;
  bool get hasMoreVideos => _hasMoreVideos;
  String? get error => _error;
  String get debugInfo => _debugInfo;

  Future<void> loadAllVideos(String token) async {
    try {
      print('VideoProvider: Starting to load all videos...');
      _isLoading = true;
      _error = null;
      _debugInfo = 'Loading...';
      _currentPage = 0;
      _hasMoreVideos = true;
      notifyListeners();

      final videos = await VideoService.getAllVideos(token);
      print('VideoProvider: Received ${videos.length} videos');
      _videos.clear();
      _videos.addAll(videos);
      _debugInfo = 'Loaded ${videos.length} videos from server';
      
      // Always enable infinite scroll - will cycle through existing videos when server runs out
      _hasMoreVideos = true;
      _currentPage++;
      
      notifyListeners();
    } catch (e) {
      print('VideoProvider: Error loading videos: $e');
      _error = 'Failed to load videos: $e';
      _debugInfo = 'Error: $e';
      notifyListeners();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> loadMoreVideos(String token) async {
    if (_isLoadingMore) return;

    try {
      print('VideoProvider: Loading more videos (cycling existing ${_videos.length} videos)...');
      _isLoadingMore = true;
      _error = null;
      notifyListeners();

      // Try to get more videos from server first
      final newVideos = await VideoService.getVideosPage(token, _currentPage, _pageSize);
      print('VideoProvider: Received ${newVideos.length} new videos from server');
      
      if (newVideos.isNotEmpty) {
        // Add new unique videos
        for (final video in newVideos) {
          if (!_videos.any((existing) => existing.id == video.id)) {
            _videos.add(video);
          }
        }
        _currentPage++;
      } else {
        // No more videos from server - cycle existing videos for infinite scroll
        if (_videos.isNotEmpty) {
          final existingVideos = List<Video>.from(_videos);
          _videos.addAll(existingVideos); // Duplicate the list for infinite scrolling
          print('VideoProvider: Recycling ${existingVideos.length} videos for infinite scroll');
        }
      }
      
      _debugInfo = 'Total videos: ${_videos.length} (cycling for infinite scroll)';
      _hasMoreVideos = true; // Always true for infinite cycling
      
      notifyListeners();
    } catch (e) {
      print('VideoProvider: Error loading more videos: $e');
      // Don't show error for infinite scroll - just keep cycling existing videos
      if (_videos.isNotEmpty) {
        final existingVideos = List<Video>.from(_videos);
        _videos.addAll(existingVideos);
        _debugInfo = 'Cycling ${existingVideos.length} videos (server error)';
        notifyListeners();
      }
    } finally {
      _isLoadingMore = false;
      notifyListeners();
    }
  }

  Future<void> loadUserVideos(String userId, String token) async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      final videos = await VideoService.getUserVideos(userId, token);
      _videos.clear();
      _videos.addAll(videos);
      
      notifyListeners();
    } catch (e) {
      _error = 'Failed to load videos: $e';
      notifyListeners();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}