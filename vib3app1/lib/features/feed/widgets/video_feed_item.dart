import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:video_player/video_player.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../app/theme/app_theme.dart';
import '../../../core/models/post_model.dart';
import '../../../core/models/user_model.dart';
import '../../video_player/widgets/vib3_video_player.dart';

class VideoFeedItem extends StatefulWidget {
  final Post post;
  final bool isActive;
  final VoidCallback? onLike;
  final VoidCallback? onComment;
  final VoidCallback? onShare;
  final VoidCallback? onFollow;
  
  const VideoFeedItem({
    Key? key,
    required this.post,
    required this.isActive,
    this.onLike,
    this.onComment,
    this.onShare,
    this.onFollow,
  }) : super(key: key);
  
  @override
  State<VideoFeedItem> createState() => _VideoFeedItemState();
}

class _VideoFeedItemState extends State<VideoFeedItem> with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  bool _isLiked = false;
  
  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    _isLiked = widget.post.isLiked;
  }
  
  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }
  
  void _handleDoubleTap() {
    if (!_isLiked) {
      _handleLike();
    }
    _animationController.forward().then((_) {
      _animationController.reverse();
    });
  }
  
  void _handleLike() {
    setState(() => _isLiked = !_isLiked);
    HapticFeedback.lightImpact();
    widget.onLike?.call();
  }
  
  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        // Video/Image Background
        _buildMediaContent(),
        
        // Gradient overlay
        _buildGradientOverlay(),
        
        // Play/Pause indicator removed - handled by VIB3VideoPlayer
        
        // Content overlay
        _buildContentOverlay(),
        
        // Side actions
        _buildSideActions(),
        
        // Double tap heart animation
        _buildHeartAnimation(),
      ],
    );
  }
  
  Widget _buildMediaContent() {
    if (widget.post.media.isNotEmpty && widget.post.media.first.type == MediaType.video) {
      return GestureDetector(
        onDoubleTap: _handleDoubleTap,
        child: VIB3VideoPlayer(
          videoUrl: widget.post.media.first.url,
          isPlaying: widget.isActive,
          thumbnailUrl: widget.post.media.first.thumbnailUrl,
          showControls: false,
          preload: true,
        ),
      );
    }
    
    // Fallback to image or placeholder
    return GestureDetector(
      onDoubleTap: _handleDoubleTap,
      child: widget.post.media.isNotEmpty
          ? CachedNetworkImage(
              imageUrl: widget.post.media.first.thumbnailUrl ?? widget.post.media.first.url,
              fit: BoxFit.cover,
            )
          : Container(
              color: AppTheme.surfaceColor,
              child: const Center(
                child: CircularProgressIndicator(),
              ),
            ),
    );
  }
  
  Widget _buildGradientOverlay() {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            Colors.transparent,
            Colors.transparent,
            Colors.black.withOpacity(0.3),
            Colors.black.withOpacity(0.6),
          ],
          stops: const [0.0, 0.6, 0.85, 1.0],
        ),
      ),
    );
  }
  
  
  Widget _buildContentOverlay() {
    return Positioned(
      left: 16,
      right: 80,
      bottom: 20,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Author info
          Row(
            children: [
              GestureDetector(
                onTap: () {
                  // TODO: Navigate to profile
                },
                child: Row(
                  children: [
                    Container(
                      width: 32,
                      height: 32,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 1),
                      ),
                      child: ClipOval(
                        child: CachedNetworkImage(
                          imageUrl: widget.post.author?.profilePicture ?? '',
                          fit: BoxFit.cover,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      '@${widget.post.author?.username ?? 'unknown'}',
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w600,
                        fontSize: 16,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              if (widget.post.userId != 'current_user_id') // TODO: Check against actual current user
                TextButton(
                  onPressed: widget.onFollow,
                  style: TextButton.styleFrom(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                    backgroundColor: AppTheme.primaryColor,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                  child: const Text(
                    'Follow',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
            ],
          ),
          
          const SizedBox(height: 12),
          
          // Caption
          if (widget.post.caption != null)
            Text(
              widget.post.caption!,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 14,
              ),
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
            ),
          
          const SizedBox(height: 8),
          
          // Sound info
          if (widget.post.sound != null)
            Row(
              children: [
                const Icon(Icons.music_note, color: Colors.white, size: 16),
                const SizedBox(width: 4),
                Expanded(
                  child: Text(
                    '${widget.post.sound!.name} - ${widget.post.sound!.artistName}',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 13,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
        ],
      ),
    );
  }
  
  Widget _buildSideActions() {
    return Positioned(
      right: 12,
      bottom: 20,
      child: Column(
        children: [
          // Like button
          _buildActionButton(
            icon: _isLiked ? Icons.favorite : Icons.favorite_outline,
            color: _isLiked ? Colors.red : Colors.white,
            label: _formatCount(widget.post.likesCount + (_isLiked ? 1 : 0)),
            onTap: _handleLike,
          ),
          
          const SizedBox(height: 20),
          
          // Comment button
          _buildActionButton(
            icon: Icons.chat_bubble_outline,
            label: _formatCount(widget.post.commentsCount),
            onTap: widget.onComment,
          ),
          
          const SizedBox(height: 20),
          
          // Share button
          _buildActionButton(
            icon: Icons.send_outlined,
            label: _formatCount(widget.post.sharesCount),
            onTap: widget.onShare,
          ),
          
          const SizedBox(height: 20),
          
          // Sound/Music disc
          if (widget.post.sound != null)
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: Colors.white30, width: 8),
              ),
              child: ClipOval(
                child: CachedNetworkImage(
                  imageUrl: widget.post.sound!.albumArt ?? '',
                  fit: BoxFit.cover,
                  errorWidget: (_, __, ___) => Container(
                    color: Colors.grey[800],
                    child: const Icon(Icons.music_note, color: Colors.white),
                  ),
                ),
              ),
            ).animate(
              onPlay: (controller) => controller.repeat(),
            ).rotate(duration: const Duration(seconds: 5)),
        ],
      ),
    );
  }
  
  Widget _buildActionButton({
    required IconData icon,
    String? label,
    Color color = Colors.white,
    VoidCallback? onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Icon(icon, color: color, size: 32),
          if (label != null) ...[
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                color: color,
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ],
      ),
    );
  }
  
  Widget _buildHeartAnimation() {
    return Center(
      child: AnimatedBuilder(
        animation: _animationController,
        builder: (context, child) {
          return Transform.scale(
            scale: _animationController.value * 2 + 0.5,
            child: Opacity(
              opacity: 1 - _animationController.value,
              child: const Icon(
                Icons.favorite,
                color: Colors.white,
                size: 100,
              ),
            ),
          );
        },
      ),
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