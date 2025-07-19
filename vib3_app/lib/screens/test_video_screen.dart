import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';

class TestVideoScreen extends StatefulWidget {
  const TestVideoScreen({super.key});

  @override
  State<TestVideoScreen> createState() => _TestVideoScreenState();
}

class _TestVideoScreenState extends State<TestVideoScreen> {
  VideoPlayerController? _controller;
  bool _isInitialized = false;
  String _status = 'Not started';

  @override
  void initState() {
    super.initState();
    _initVideo();
  }

  Future<void> _initVideo() async {
    setState(() {
      _status = 'Initializing...';
    });

    try {
      // Use a known working video URL from the API test
      const testUrl = 'https://vib3-videos.nyc3.digitaloceanspaces.com/videos/1735431869603-f3b3e7871bdc3d0b2cf5e7e5de08fb38.mp4';
      
      _controller = VideoPlayerController.networkUrl(
        Uri.parse(testUrl),
      );
      
      await _controller!.initialize();
      await _controller!.setLooping(true);
      await _controller!.play();
      
      setState(() {
        _isInitialized = true;
        _status = 'Playing';
      });
    } catch (e) {
      setState(() {
        _status = 'Error: $e';
      });
    }
  }

  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        title: const Text('Video Test'),
        backgroundColor: Colors.black,
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              'Status: $_status',
              style: const TextStyle(color: Colors.white, fontSize: 16),
            ),
            const SizedBox(height: 20),
            if (_isInitialized && _controller != null)
              AspectRatio(
                aspectRatio: _controller!.value.aspectRatio,
                child: VideoPlayer(_controller!),
              )
            else
              Container(
                width: 300,
                height: 500,
                color: Colors.grey[900],
                child: const Center(
                  child: CircularProgressIndicator(),
                ),
              ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: _initVideo,
              child: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }
}