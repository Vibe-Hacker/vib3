import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../models/video.dart';

/// Isolated action buttons component that manages its own state
/// and doesn't interfere with navigation or tabs
class VideoActionButtons extends StatefulWidget {
  final Video video;
  final bool isLiked;
  final bool isFollowing;
  final VoidCallback onLike;
  final VoidCallback onComment;
  final VoidCallback onShare;
  final VoidCallback onFollow;
  final VoidCallback onProfile;
  
  const VideoActionButtons({
    super.key,
    required this.video,
    required this.isLiked,
    required this.isFollowing,
    required this.onLike,
    required this.onComment,
    required this.onShare,
    required this.onFollow,
    required this.onProfile,
  });
  
  @override
  State<VideoActionButtons> createState() => _VideoActionButtonsState();
}

class _VideoActionButtonsState extends State<VideoActionButtons> 
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _scaleAnimation;
  
  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 200),
      vsync: this,
    );
    _scaleAnimation = Tween<double>(
      begin: 1.0,
      end: 1.2,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeInOut,
    ));
  }
  
  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }
  
  void _animateTap() {
    HapticFeedback.lightImpact();
    _animationController.forward().then((_) {
      _animationController.reverse();
    });
  }
  
  @override
  Widget build(BuildContext context) {
    return Container(
      width: 80,
      padding: const EdgeInsets.only(bottom: 20),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.end,
        children: [
          // Profile button
          _buildActionButton(
            onTap: widget.onProfile,
            child: Stack(
              alignment: Alignment.bottomCenter,
              children: [
                CircleAvatar(
                  radius: 25,
                  backgroundColor: Colors.white,
                  child: CircleAvatar(
                    radius: 23,
                    backgroundColor: Colors.grey[800],
                    child: Text(
                      widget.video.user?['username']?[0]?.toUpperCase() ?? 'U',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
                if (!widget.isFollowing)
                  Positioned(
                    bottom: -5,
                    child: GestureDetector(
                      onTap: () {
                        _animateTap();
                        widget.onFollow();
                      },
                      child: Container(
                        width: 20,
                        height: 20,
                        decoration: const BoxDecoration(
                          color: Color(0xFF00CED1),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.add,
                          color: Colors.white,
                          size: 14,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          
          // Like button
          _buildActionButton(
            onTap: () {
              _animateTap();
              widget.onLike();
            },
            child: AnimatedBuilder(
              animation: _scaleAnimation,
              builder: (context, child) => Transform.scale(
                scale: widget.isLiked ? _scaleAnimation.value : 1.0,
                child: Column(
                  children: [
                    Icon(
                      widget.isLiked ? Icons.favorite : Icons.favorite_border,
                      color: widget.isLiked ? Colors.red : Colors.white,
                      size: 32,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _formatCount(widget.video.likesCount),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(height: 20),
          
          // Comment button
          _buildActionButton(
            onTap: widget.onComment,
            child: Column(
              children: [
                const Icon(
                  Icons.comment,
                  color: Colors.white,
                  size: 32,
                ),
                const SizedBox(height: 4),
                Text(
                  _formatCount(widget.video.commentsCount),
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          
          // Share button
          _buildActionButton(
            onTap: widget.onShare,
            child: Column(
              children: [
                const Icon(
                  Icons.share,
                  color: Colors.white,
                  size: 32,
                ),
                const SizedBox(height: 4),
                Text(
                  _formatCount(widget.video.sharesCount),
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildActionButton({
    required VoidCallback onTap,
    required Widget child,
  }) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Container(
        padding: const EdgeInsets.all(8),
        child: child,
      ),
    );
  }
  
  String _formatCount(int count) {
    if (count < 1000) {
      return count.toString();
    } else if (count < 1000000) {
      return '${(count / 1000).toStringAsFixed(1)}K';
    } else {
      return '${(count / 1000000).toStringAsFixed(1)}M';
    }
  }
}