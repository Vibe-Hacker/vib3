import 'package:flutter/foundation.dart';
import '../models/video_model.dart';
import '../services/video_service.dart';

class VideoProvider extends ChangeNotifier {
  final List<Video> _videos = [];
  bool _isLoading = false;
  String? _error;

  List<Video> get videos => _videos;
  bool get isLoading => _isLoading;
  String? get error => _error;

  final VideoService _videoService = VideoService();

  Future<void> loadVideos() async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      final videos = await _videoService.getVideos();
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