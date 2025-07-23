
// video_player_widget.dart - Fix video initialization
Future<void> _initializeVideo() async {
  if (_isInitializing || _isDisposed) return;
  
  _isInitializing = true;
  
  try {
    // Transform URL to ensure HTTPS and proper format
    String videoUrl = widget.videoUrl;
    
    // Ensure HTTPS for DigitalOcean Spaces
    if (videoUrl.contains('digitaloceanspaces.com') && videoUrl.startsWith('http://')) {
      videoUrl = videoUrl.replaceFirst('http://', 'https://');
    }
    
    // Add timestamp to prevent caching issues
    if (!videoUrl.contains('?')) {
      videoUrl += '?t=' + DateTime.now().millisecondsSinceEpoch.toString();
    }
    
    print('🎥 Initializing video: $videoUrl');
    
    _controller = VideoPlayerController.network(
      videoUrl,
      httpHeaders: {
        'Accept': '*/*',
        'Accept-Encoding': 'identity',
        'Cache-Control': 'no-cache',
      },
      formatHint: VideoFormat.other,
    );
    
    await _controller!.initialize();
    
    if (mounted && !_isDisposed) {
      setState(() {
        _isInitialized = true;
        _hasError = false;
      });
      
      // Start playing if requested
      if (widget.isPlaying) {
        _controller!.play();
        _controller!.setLooping(true);
      }
    }
  } catch (e) {
    print('❌ Video initialization error: $e');
    if (mounted && !_isDisposed) {
      setState(() {
        _hasError = true;
        _isInitialized = false;
      });
    }
  } finally {
    _isInitializing = false;
  }
}
