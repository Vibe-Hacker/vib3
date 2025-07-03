import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/video_provider.dart';

class VideoFeed extends StatelessWidget {
  const VideoFeed({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<VideoProvider>(
      builder: (context, videoProvider, child) {
        if (videoProvider.isLoading) {
          return const Center(
            child: CircularProgressIndicator(
              color: Color(0xFFFF0080),
            ),
          );
        }

        if (videoProvider.error != null) {
          return Center(
            child: Text(
              videoProvider.error!,
              style: const TextStyle(color: Colors.white),
            ),
          );
        }

        if (videoProvider.videos.isEmpty) {
          return const Center(
            child: Text(
              'No videos found',
              style: TextStyle(color: Colors.white),
            ),
          );
        }

        // For now, just show a list of videos
        return PageView.builder(
          scrollDirection: Axis.vertical,
          itemCount: videoProvider.videos.length,
          itemBuilder: (context, index) {
            final video = videoProvider.videos[index];
            return Container(
              color: Colors.black,
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      'Video ${index + 1}',
                      style: const TextStyle(color: Colors.white, fontSize: 24),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      video.description ?? 'No description',
                      style: const TextStyle(color: Colors.white70),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'By: ${video.user?['username'] ?? 'Unknown'}',
                      style: const TextStyle(color: Colors.white54),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }
}