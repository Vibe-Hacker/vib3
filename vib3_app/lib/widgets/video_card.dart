import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../models/video.dart';
import '../utils/format_utils.dart';

class VideoCard extends StatelessWidget {
  final Video video;
  final VoidCallback? onTap;
  final VoidCallback? onRemove;
  final bool showRemoveButton;
  final bool showDragHandle;
  
  const VideoCard({
    super.key,
    required this.video,
    this.onTap,
    this.onRemove,
    this.showRemoveButton = false,
    this.showDragHandle = false,
  });
  
  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF1A1A1A), Color(0xFF2A2A2A)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              // Drag handle
              if (showDragHandle)
                Container(
                  margin: const EdgeInsets.only(right: 12),
                  child: const Icon(
                    Icons.drag_handle,
                    color: Colors.white54,
                    size: 20,
                  ),
                ),
              
              // Video thumbnail
              Container(
                width: 80,
                height: 60,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(8),
                  image: video.thumbnailUrl != null
                      ? DecorationImage(
                          image: NetworkImage(video.thumbnailUrl!),
                          fit: BoxFit.cover,
                        )
                      : null,
                  color: Colors.grey[800],
                ),
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    if (video.thumbnailUrl == null)
                      const Icon(
                        Icons.play_arrow,
                        color: Colors.white,
                        size: 28,
                      ),
                    
                    // Duration overlay
                    if (video.duration > 0)
                      Positioned(
                        bottom: 4,
                        right: 4,
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 4,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.black.withOpacity(0.7),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            FormatUtils.formatDuration(video.duration),
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              
              // Video info
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      video.caption ?? 'Untitled Video',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      video.username ?? 'Unknown User',
                      style: const TextStyle(
                        color: Colors.white54,
                        fontSize: 12,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        _buildStatItem(
                          icon: Icons.play_arrow,
                          value: FormatUtils.formatCount(video.viewCount),
                        ),
                        const SizedBox(width: 16),
                        _buildStatItem(
                          icon: Icons.favorite,
                          value: FormatUtils.formatCount(video.likes),
                        ),
                        const SizedBox(width: 16),
                        _buildStatItem(
                          icon: Icons.comment,
                          value: FormatUtils.formatCount(video.commentCount),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              
              // Remove button
              if (showRemoveButton)
                IconButton(
                  icon: const Icon(Icons.remove_circle_outline, color: Colors.red),
                  onPressed: () {
                    HapticFeedback.lightImpact();
                    onRemove?.call();
                  },
                  tooltip: 'Remove from playlist',
                ),
            ],
          ),
        ),
      ),
    );
  }
  
  Widget _buildStatItem({
    required IconData icon,
    required String value,
  }) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, color: Colors.white54, size: 14),
        const SizedBox(width: 4),
        Text(
          value,
          style: const TextStyle(
            color: Colors.white54,
            fontSize: 12,
          ),
        ),
      ],
    );
  }
}