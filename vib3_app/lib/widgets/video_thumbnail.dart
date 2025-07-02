import 'package:flutter/material.dart';
import '../models/video.dart';
import '../services/video_service.dart';

class VideoThumbnail extends StatelessWidget {
  final Video video;
  final bool showDeleteButton;
  final VoidCallback? onDelete;
  final VoidCallback? onTap;

  const VideoThumbnail({
    super.key,
    required this.video,
    this.showDeleteButton = false,
    this.onDelete,
    this.onTap,
  });

  Widget _buildThumbnail() {
    // Try different thumbnail strategies
    if (video.thumbnailUrl != null && video.thumbnailUrl!.isNotEmpty) {
      return Image.network(
        video.thumbnailUrl!,
        fit: BoxFit.cover,
        loadingBuilder: (context, child, loadingProgress) {
          if (loadingProgress == null) return child;
          return Container(
            color: Colors.grey[800],
            child: const Center(
              child: CircularProgressIndicator(
                color: Color(0xFFFF0080),
              ),
            ),
          );
        },
        errorBuilder: (context, error, stackTrace) {
          print('Thumbnail failed to load: ${video.thumbnailUrl}');
          return _buildFallbackThumbnail();
        },
      );
    }
    
    // Try to generate thumbnail from video URL
    if (video.videoUrl != null && video.videoUrl!.isNotEmpty) {
      final videoUrl = video.videoUrl!;
      // Generate thumbnail URL by replacing video with thumbnail
      String thumbnailUrl = videoUrl;
      
      // Common thumbnail URL patterns
      if (videoUrl.contains('.mp4')) {
        thumbnailUrl = videoUrl.replaceAll('.mp4', '_thumb.jpg');
      } else if (videoUrl.contains('.mov')) {
        thumbnailUrl = videoUrl.replaceAll('.mov', '_thumb.jpg');
      } else {
        thumbnailUrl = '$videoUrl.jpg'; // Append .jpg
      }
      
      return Image.network(
        thumbnailUrl,
        fit: BoxFit.cover,
        errorBuilder: (context, error, stackTrace) {
          return _buildFallbackThumbnail();
        },
      );
    }
    
    return _buildFallbackThumbnail();
  }

  Widget _buildFallbackThumbnail() {
    return Container(
      color: Colors.grey[800],
      child: Stack(
        children: [
          // Gradient background
          Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  const Color(0xFFFF0080).withOpacity(0.3),
                  Colors.grey[800]!,
                ],
              ),
            ),
          ),
          // Play icon
          const Center(
            child: Icon(
              Icons.play_circle_outline,
              color: Colors.white,
              size: 40,
            ),
          ),
          // VIB3 logo in corner
          Positioned(
            bottom: 4,
            left: 4,
            child: Text(
              'VIB3',
              style: TextStyle(
                color: Colors.white.withOpacity(0.7),
                fontSize: 8,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(4),
          color: Colors.grey[900],
        ),
        child: Stack(
          fit: StackFit.expand,
          children: [
            // Video thumbnail image
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: _buildThumbnail(),
            ),
            
            // Dark overlay for text readability
            Container(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(4),
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.black.withOpacity(0.3),
                    Colors.transparent,
                    Colors.transparent,
                    Colors.black.withOpacity(0.4),
                  ],
                  stops: const [0.0, 0.3, 0.7, 1.0],
                ),
              ),
            ),
            
            // Delete button (top left)
            if (showDeleteButton)
              Positioned(
                top: 4,
                left: 4,
                child: GestureDetector(
                  onTap: () => _showDeleteDialog(context),
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      color: Colors.black.withOpacity(0.7),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(
                      Icons.delete_outline,
                      color: Colors.white,
                      size: 16,
                    ),
                  ),
                ),
              ),
            
            // Likes count (top right)
            Positioned(
              top: 4,
              right: 4,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: Colors.black.withOpacity(0.7),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(
                      Icons.favorite,
                      color: Colors.red,
                      size: 12,
                    ),
                    const SizedBox(width: 2),
                    Text(
                      VideoService.formatLikes(video.likesCount),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            
            // Views count (bottom left)
            Positioned(
              bottom: 4,
              left: 4,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: Colors.black.withOpacity(0.7),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(
                      Icons.visibility,
                      color: Colors.white,
                      size: 12,
                    ),
                    const SizedBox(width: 2),
                    Text(
                      VideoService.formatViews(video.viewsCount),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            
            // Duration (bottom right)
            Positioned(
              bottom: 4,
              right: 4,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: Colors.black.withOpacity(0.7),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  VideoService.formatDuration(video.duration),
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
            
            // Play icon overlay
            const Center(
              child: Icon(
                Icons.play_circle_outline,
                color: Colors.white,
                size: 30,
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showDeleteDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1A1A1A),
        title: const Text(
          'Delete video',
          style: TextStyle(color: Colors.white),
        ),
        content: const Text(
          'Are you sure you want to delete this video? This action cannot be undone.',
          style: TextStyle(color: Colors.white70),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text(
              'Cancel',
              style: TextStyle(color: Colors.grey),
            ),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              if (onDelete != null) {
                onDelete!();
              }
            },
            child: const Text(
              'Delete',
              style: TextStyle(color: Colors.red),
            ),
          ),
        ],
      ),
    );
  }
}