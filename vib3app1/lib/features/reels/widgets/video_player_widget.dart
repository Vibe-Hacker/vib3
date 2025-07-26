import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';

class VideoPlayerWidget extends StatelessWidget {
  final VideoPlayerController controller;
  final VoidCallback? onTap;
  
  const VideoPlayerWidget({
    Key? key,
    required this.controller,
    this.onTap,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: controller.value.isInitialized
          ? AspectRatio(
              aspectRatio: controller.value.aspectRatio,
              child: VideoPlayer(controller),
            )
          : Container(
              color: Colors.black,
              child: const Center(
                child: CircularProgressIndicator(),
              ),
            ),
    );
  }
}