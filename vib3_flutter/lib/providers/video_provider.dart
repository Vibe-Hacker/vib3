import 'package:flutter/foundation.dart';
import '../models/video_model.dart';
import '../services/api_service.dart';

class VideoProvider extends ChangeNotifier {
  final List<VideoModel> _videos = [];
  bool _isLoading = false;
  bool _hasMore = true;
  int _currentPage = 1;

  List<VideoModel> get videos => _videos;
  bool get isLoading => _isLoading;
  bool get hasMore => _hasMore;

  final ApiService _apiService = ApiService();

  Future<void> loadVideos() async {
    if (_isLoading || !_hasMore) return;

    _isLoading = true;
    notifyListeners();

    try {
      final newVideos = await _apiService.getVideos(page: _currentPage);
      
      if (newVideos.isEmpty) {
        _hasMore = false;
      } else {
        _videos.addAll(newVideos);
        _currentPage++;
      }
    } catch (e) {
      debugPrint('Error loading videos: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> loadMoreVideos() async {
    await loadVideos();
  }

  Future<void> refreshVideos() async {
    _videos.clear();
    _currentPage = 1;
    _hasMore = true;
    await loadVideos();
  }
}