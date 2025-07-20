import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/video.dart';
import '../../providers/auth_provider.dart';
import '../../providers/video_provider.dart';

/// Extracted video action buttons (like, comment, share, etc.)
/// This separates social interactions from the main video feed logic
class VideoActionButtons extends StatelessWidget {
  final Video video;
  final VoidCallback onCommentTap;
  final VoidCallback onShareTap;
  final VoidCallback onProfileTap;
  final VoidCallback? onDuetTap;
  final VoidCallback? onStitchTap;
  final bool isDragMode;
  final Map<String, Offset> buttonPositions;
  final Function(String)? onDragStart;
  final Function(String, Offset)? onDragUpdate;
  final Function(String)? onDragEnd;

  const VideoActionButtons({
    super.key,
    required this.video,
    required this.onCommentTap,
    required this.onShareTap,
    required this.onProfileTap,
    this.onDuetTap,
    this.onStitchTap,
    this.isDragMode = false,
    this.buttonPositions = const {},
    this.onDragStart,
    this.onDragUpdate,
    this.onDragEnd,
  });

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final videoProvider = Provider.of<VideoProvider>(context);
    final isLiked = videoProvider.isVideoLiked(video.id);
    final token = authProvider.authToken;

    return Stack(
      children: [
        // Profile button
        _buildActionButton(
          context,
          'profile',
          buttonPositions['profile'] ?? Offset(MediaQuery.of(context).size.width - 100, 200),
          child: _buildProfileButton(context),
          onTap: onProfileTap,
        ),
        
        // Like button
        _buildActionButton(
          context,
          'like',
          buttonPositions['like'] ?? Offset(MediaQuery.of(context).size.width - 100, 280),
          child: _buildLikeButton(context, isLiked, token, videoProvider),
          onTap: null, // Like has its own tap handler
        ),
        
        // Comment button
        _buildActionButton(
          context,
          'comment',
          buttonPositions['comment'] ?? Offset(MediaQuery.of(context).size.width - 100, 360),
          child: _buildCommentButton(context),
          onTap: onCommentTap,
        ),
        
        // Share button
        _buildActionButton(
          context,
          'share',
          buttonPositions['share'] ?? Offset(MediaQuery.of(context).size.width - 100, 440),
          child: _buildShareButton(context),
          onTap: onShareTap,
        ),
      ],
    );
  }

  Widget _buildActionButton(
    BuildContext context,
    String buttonId,
    Offset position,
    {required Widget child, VoidCallback? onTap}
  ) {
    if (isDragMode) {
      return Positioned(
        left: position.dx,
        top: position.dy,
        child: GestureDetector(
          onPanStart: (_) => onDragStart?.call(buttonId),
          onPanUpdate: (details) => onDragUpdate?.call(buttonId, details.delta),
          onPanEnd: (_) => onDragEnd?.call(buttonId),
          child: Container(
            decoration: BoxDecoration(
              border: Border.all(color: Colors.white.withOpacity(0.5), width: 2),
              borderRadius: BorderRadius.circular(8),
            ),
            child: child,
          ),
        ),
      );
    }
    
    return Positioned(
      left: position.dx,
      top: position.dy,
      child: GestureDetector(
        onTap: onTap,
        child: child,
      ),
    );
  }

  Widget _buildProfileButton(BuildContext context) {
    return Column(
      children: [
        Stack(
          alignment: Alignment.bottomCenter,
          children: [
            Container(
              width: 50,
              height: 50,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: Colors.white, width: 2),
                image: video.thumbnailUrl != null
                    ? DecorationImage(
                        image: NetworkImage(video.thumbnailUrl!),
                        fit: BoxFit.cover,
                      )
                    : null,
              ),
              child: video.thumbnailUrl == null
                  ? const Icon(Icons.person, color: Colors.white, size: 30)
                  : null,
            ),
            if (!Provider.of<VideoProvider>(context).isUserFollowed(video.userId))
              Positioned(
                bottom: -5,
                child: Container(
                  width: 20,
                  height: 20,
                  decoration: BoxDecoration(
                    color: Colors.red,
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white, width: 1),
                  ),
                  child: const Icon(Icons.add, color: Colors.white, size: 15),
                ),
              ),
          ],
        ),
      ],
    );
  }

  Widget _buildLikeButton(BuildContext context, bool isLiked, String? token, VideoProvider videoProvider) {
    return Column(
      children: [
        IconButton(
          icon: Icon(
            isLiked ? Icons.favorite : Icons.favorite_border,
            color: isLiked ? Colors.red : Colors.white,
            size: 30,
          ),
          onPressed: token != null
              ? () async {
                  await videoProvider.toggleLike(video.id, token);
                }
              : null,
        ),
        Text(
          _formatCount(video.likesCount + (isLiked ? 1 : 0)),
          style: const TextStyle(color: Colors.white, fontSize: 12),
        ),
      ],
    );
  }

  Widget _buildCommentButton(BuildContext context) {
    return Column(
      children: [
        IconButton(
          icon: const Icon(Icons.comment, color: Colors.white, size: 30),
          onPressed: onCommentTap,
        ),
        Text(
          _formatCount(video.commentsCount),
          style: const TextStyle(color: Colors.white, fontSize: 12),
        ),
      ],
    );
  }

  Widget _buildShareButton(BuildContext context) {
    return Column(
      children: [
        IconButton(
          icon: const Icon(Icons.share, color: Colors.white, size: 30),
          onPressed: onShareTap,
        ),
        Text(
          _formatCount(video.sharesCount),
          style: const TextStyle(color: Colors.white, fontSize: 12),
        ),
      ],
    );
  }

  String _formatCount(int count) {
    if (count >= 1000000) {
      return '${(count / 1000000).toStringAsFixed(1)}M';
    } else if (count >= 1000) {
      return '${(count / 1000).toStringAsFixed(1)}K';
    }
    return count.toString();
  }
}