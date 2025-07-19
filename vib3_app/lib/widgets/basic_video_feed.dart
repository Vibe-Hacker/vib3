import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:video_player/video_player.dart';
import '../providers/video_provider.dart';
import '../models/video.dart';

class BasicVideoFeed extends StatefulWidget {
  const BasicVideoFeed({super.key});

  @override
  State<BasicVideoFeed> createState() => _BasicVideoFeedState();
}

class _BasicVideoFeedState extends State<BasicVideoFeed> {
  late PageController _pageController;
  int _currentIndex = 0;
  final Map<int, VideoPlayerController> _controllers = {};

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
  }

  @override
  void dispose() {
    _pageController.dispose();
    for (var controller in _controllers.values) {
      controller.dispose();
    }
    super.dispose();
  }

  Future<VideoPlayerController> _getController(String url, int index) async {
    if (_controllers.containsKey(index)) {
      return _controllers[index]!;
    }

    final controller = VideoPlayerController.networkUrl(Uri.parse(url));
    await controller.initialize();
    controller.setLooping(true);
    _controllers[index] = controller;
    return controller;
  }

  void _onPageChanged(int index) {
    // Pause previous video
    if (_controllers.containsKey(_currentIndex)) {
      _controllers[_currentIndex]!.pause();
    }

    // Play current video
    setState(() {
      _currentIndex = index;
    });

    if (_controllers.containsKey(index)) {
      _controllers[index]!.play();
    }
  }

  @override
  Widget build(BuildContext context) {
    final videos = context.watch<VideoProvider>().forYouVideos;

    if (videos.isEmpty) {
      return const Center(
        child: CircularProgressIndicator(color: Color(0xFF00CED1)),
      );
    }

    return PageView.builder(
      controller: _pageController,
      scrollDirection: Axis.vertical,
      onPageChanged: _onPageChanged,
      itemCount: videos.length,
      itemBuilder: (context, index) {
        final video = videos[index];
        
        return Container(
          color: Colors.black,
          child: Center(
            child: FutureBuilder<VideoPlayerController>(
              future: _getController(video.videoUrl!, index),
              builder: (context, snapshot) {
                if (!snapshot.hasData) {
                  return const CircularProgressIndicator(
                    color: Color(0xFF00CED1),
                  );
                }

                final controller = snapshot.data!;
                
                // Auto-play first video
                if (index == 0 && _currentIndex == 0 && !controller.value.isPlaying) {
                  controller.play();
                }

                return AspectRatio(
                  aspectRatio: controller.value.aspectRatio,
                  child: VideoPlayer(controller),
                );
              },
            ),
          ),
        );
      },
    );
  }
}