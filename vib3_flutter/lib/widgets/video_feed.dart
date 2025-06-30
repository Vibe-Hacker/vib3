import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:visibility_detector/visibility_detector.dart';
import '../providers/video_provider.dart';
import 'video_player_widget.dart';

class VideoFeed extends StatefulWidget {
  const VideoFeed({super.key});

  @override
  State<VideoFeed> createState() => _VideoFeedState();
}

class _VideoFeedState extends State<VideoFeed> {
  late PageController _pageController;
  int _currentPage = 0;

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<VideoProvider>().loadVideos();
    });
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<VideoProvider>(
      builder: (context, videoProvider, child) {
        if (videoProvider.isLoading && videoProvider.videos.isEmpty) {
          return const Center(
            child: CircularProgressIndicator(
              color: Color(0xFFFF0080),
            ),
          );
        }

        if (videoProvider.videos.isEmpty) {
          return const Center(
            child: Text(
              'No videos available',
              style: TextStyle(color: Colors.white),
            ),
          );
        }

        return PageView.builder(
          controller: _pageController,
          scrollDirection: Axis.vertical,
          onPageChanged: (index) {
            setState(() {
              _currentPage = index;
            });
            if (index == videoProvider.videos.length - 3) {
              videoProvider.loadMoreVideos();
            }
          },
          itemCount: videoProvider.videos.length,
          itemBuilder: (context, index) {
            return VisibilityDetector(
              key: Key('video-$index'),
              onVisibilityChanged: (info) {
                if (info.visibleFraction > 0.5 && _currentPage == index) {
                  // Video is mostly visible and is the current page
                } else {
                  // Video is not visible enough
                }
              },
              child: VideoPlayerWidget(
                video: videoProvider.videos[index],
                isCurrentPage: _currentPage == index,
              ),
            );
          },
        );
      },
    );
  }
}