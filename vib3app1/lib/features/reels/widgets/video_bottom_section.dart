import 'package:flutter/material.dart';

class VideoBottomSection extends StatelessWidget {
  final String username;
  final String description;
  final String musicName;
  final VoidCallback? onMusicTap;
  final VoidCallback? onProfileTap;
  
  const VideoBottomSection({
    Key? key,
    required this.username,
    required this.description,
    required this.musicName,
    this.onMusicTap,
    this.onProfileTap,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          // Username
          GestureDetector(
            onTap: onProfileTap,
            child: Text(
              '@$username',
              style: const TextStyle(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          const SizedBox(height: 8),
          
          // Description
          Text(
            description,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 14,
            ),
            maxLines: 3,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 12),
          
          // Music
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
                    musicName,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 12,
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