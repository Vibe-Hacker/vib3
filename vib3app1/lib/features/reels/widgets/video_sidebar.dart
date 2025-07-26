import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

class VideoSidebar extends StatelessWidget {
  final String userAvatar;
  final int likes;
  final int comments;
  final int shares;
  final bool isLiked;
  final bool isFollowing;
  final VoidCallback? onLikeTap;
  final VoidCallback? onCommentTap;
  final VoidCallback? onShareTap;
  final VoidCallback? onProfileTap;
  
  const VideoSidebar({
    Key? key,
    required this.userAvatar,
    required this.likes,
    required this.comments,
    required this.shares,
    this.isLiked = false,
    this.isFollowing = false,
    this.onLikeTap,
    this.onCommentTap,
    this.onShareTap,
    this.onProfileTap,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 60,
      padding: const EdgeInsets.symmetric(vertical: 20),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.end,
        children: [
          // Profile with follow button
          _buildProfileWithFollow(),
          const SizedBox(height: 20),
          
          // Like
          _buildActionButton(
            icon: isLiked ? Icons.favorite : Icons.favorite_outline,
            color: isLiked ? Colors.red : Colors.white,
            count: likes,
            onTap: onLikeTap,
          ),
          const SizedBox(height: 20),
          
          // Comment
          _buildActionButton(
            icon: Icons.chat_bubble_outline,
            color: Colors.white,
            count: comments,
            onTap: onCommentTap,
          ),
          const SizedBox(height: 20),
          
          // Share
          _buildActionButton(
            icon: Icons.share_outlined,
            color: Colors.white,
            count: shares,
            onTap: onShareTap,
          ),
          const SizedBox(height: 20),
          
          // Spinning music disc
          _buildMusicDisc(),
        ],
      ),
    );
  }
  
  Widget _buildProfileWithFollow() {
    return GestureDetector(
      onTap: onProfileTap,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: Colors.white, width: 2),
            ),
            child: ClipOval(
              child: Image.network(
                userAvatar,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) {
                  return Container(
                    color: Colors.grey,
                    child: const Icon(Icons.person, color: Colors.white),
                  );
                },
              ),
            ),
          ),
          if (!isFollowing)
            Positioned(
              bottom: -5,
              left: 50 / 2 - 10,
              child: Container(
                width: 20,
                height: 20,
                decoration: BoxDecoration(
                  color: Colors.red,
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 2),
                ),
                child: const Icon(
                  Icons.add,
                  color: Colors.white,
                  size: 12,
                ),
              ),
            ),
        ],
      ),
    );
  }
  
  Widget _buildActionButton({
    required IconData icon,
    required Color color,
    required int count,
    VoidCallback? onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Icon(
            icon,
            color: color,
            size: 32,
          ),
          const SizedBox(height: 4),
          Text(
            _formatCount(count),
            style: const TextStyle(
              color: Colors.white,
              fontSize: 12,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildMusicDisc() {
    return Container(
      width: 48,
      height: 48,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: LinearGradient(
          colors: [Colors.grey.shade800, Colors.grey.shade600],
        ),
      ),
      child: const Icon(
        Icons.music_note,
        color: Colors.white,
        size: 24,
      ),
    ).animate(
      onPlay: (controller) => controller.repeat(),
    ).rotate(
      duration: const Duration(seconds: 5),
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