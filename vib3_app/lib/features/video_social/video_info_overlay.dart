import 'package:flutter/material.dart';
import '../../models/video.dart';

/// Video information overlay showing username, description, music, etc.
/// Extracted from video_feed.dart to separate concerns
class VideoInfoOverlay extends StatelessWidget {
  final Video video;
  final VoidCallback? onMusicTap;
  
  const VideoInfoOverlay({
    super.key,
    required this.video,
    this.onMusicTap,
  });

  @override
  Widget build(BuildContext context) {
    return Positioned(
      bottom: 80,
      left: 10,
      right: 90,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Username
          Text(
            '@${video.username}',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 16,
              fontWeight: FontWeight.bold,
              shadows: [
                Shadow(
                  blurRadius: 3.0,
                  color: Colors.black,
                  offset: Offset(1.0, 1.0),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          
          // Description with hashtags
          if (video.description != null && video.description!.isNotEmpty)
            Text(
              video.description!,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 14,
                shadows: [
                  Shadow(
                    blurRadius: 3.0,
                    color: Colors.black,
                    offset: Offset(1.0, 1.0),
                  ),
                ],
              ),
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
            ),
          
          const SizedBox(height: 8),
          
          // Music info
          if (video.musicName != null && video.musicName!.isNotEmpty)
            GestureDetector(
              onTap: onMusicTap,
              child: Row(
                children: [
                  const Icon(
                    Icons.music_note,
                    color: Colors.white,
                    size: 16,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      video.musicName!,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 14,
                        shadows: [
                          Shadow(
                            blurRadius: 3.0,
                            color: Colors.black,
                            offset: Offset(1.0, 1.0),
                          ),
                        ],
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}