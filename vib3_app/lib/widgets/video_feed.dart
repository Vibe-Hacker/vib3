import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/video_provider.dart';
import '../providers/auth_provider.dart';
import '../services/video_service.dart';
import '../models/video.dart';
import 'video_player_widget.dart';

class VideoFeed extends StatefulWidget {
  const VideoFeed({super.key});

  @override
  State<VideoFeed> createState() => _VideoFeedState();
}

class _VideoFeedState extends State<VideoFeed> {
  int _currentIndex = 0;
  late PageController _pageController;
  final Map<String, bool> _likedVideos = {};
  final Map<String, bool> _followedUsers = {};

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _onPageChanged(int index) {
    setState(() {
      _currentIndex = index;
    });

    // Load more videos when approaching the end
    final videoProvider = Provider.of<VideoProvider>(context, listen: false);
    final totalVideos = videoProvider.videos.length;
    
    // Trigger loading more videos when we're 5 videos from the end
    if (index >= totalVideos - 5 && 
        videoProvider.hasMoreVideos && 
        !videoProvider.isLoadingMore) {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final token = authProvider.authToken;
      if (token != null) {
        videoProvider.loadMoreVideos(token);
      }
    }
  }

  Future<void> _handleLike(Video video) async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final token = authProvider.authToken;
    if (token == null) return;

    final isLiked = _likedVideos[video.id] ?? false;
    
    setState(() {
      _likedVideos[video.id] = !isLiked;
      video = video.copyWith(
        likesCount: isLiked ? video.likesCount - 1 : video.likesCount + 1,
      );
    });

    final success = isLiked
        ? await VideoService.unlikeVideo(video.id, token)
        : await VideoService.likeVideo(video.id, token);

    if (!success) {
      setState(() {
        _likedVideos[video.id] = isLiked;
        video = video.copyWith(
          likesCount: isLiked ? video.likesCount + 1 : video.likesCount - 1,
        );
      });
    }
  }

  Future<void> _handleFollow(Video video) async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final token = authProvider.authToken;
    if (token == null) return;

    final isFollowed = _followedUsers[video.userId] ?? false;
    
    setState(() {
      _followedUsers[video.userId] = !isFollowed;
    });

    final success = isFollowed
        ? await VideoService.unfollowUser(video.userId, token)
        : await VideoService.followUser(video.userId, token);

    if (!success) {
      setState(() {
        _followedUsers[video.userId] = isFollowed;
      });
    }
  }

  void _showComments(Video video) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => CommentsSheet(video: video),
    );
  }

  void _shareVideo(Video video) {
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF1A1A1A),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (context) => ShareSheet(video: video),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<VideoProvider>(
      builder: (context, videoProvider, child) {
        if (videoProvider.isLoading) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const CircularProgressIndicator(
                  color: Color(0xFFFF0080),
                ),
                const SizedBox(height: 16),
                Text(
                  'Loading videos...\n${videoProvider.debugInfo}',
                  style: const TextStyle(color: Colors.white),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          );
        }

        if (videoProvider.error != null) {
          return Center(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error, color: Colors.red, size: 48),
                  const SizedBox(height: 16),
                  const Text(
                    'Failed to load videos',
                    style: TextStyle(color: Colors.white, fontSize: 18),
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () {
                      final authProvider = Provider.of<AuthProvider>(context, listen: false);
                      final token = authProvider.authToken;
                      if (token != null) {
                        Provider.of<VideoProvider>(context, listen: false).loadAllVideos(token);
                      }
                    },
                    child: const Text('Retry'),
                  ),
                ],
              ),
            ),
          );
        }

        // Remove the empty videos check - let the PageView handle everything

        // Show actual video content with player and infinite scrolling
        return PageView.builder(
          controller: _pageController,
          scrollDirection: Axis.vertical,
          onPageChanged: _onPageChanged,
          itemCount: videoProvider.videos.length + (videoProvider.hasMoreVideos ? 1 : 0),
          allowImplicitScrolling: true,
          itemBuilder: (context, index) {
            // Show loading indicator if we're at the end and loading more
            if (index >= videoProvider.videos.length) {
              return Container(
                color: Colors.black,
                child: const Center(
                  child: CircularProgressIndicator(
                    color: Color(0xFFFF0080),
                  ),
                ),
              );
            }

            final video = videoProvider.videos[index];
            final isCurrentVideo = index == _currentIndex;
            final shouldPreload = (index - _currentIndex).abs() <= 2; // Preload current +/- 2 videos
            
            return Container(
              color: Colors.black,
              child: Stack(
                children: [
                  // Video player with preloading
                  if (video.videoUrl != null && video.videoUrl!.isNotEmpty)
                    VideoPlayerWidget(
                      videoUrl: video.videoUrl!,
                      isPlaying: isCurrentVideo,
                      preload: shouldPreload,
                    )
                  else
                    Container(
                      color: Colors.grey[900],
                      child: const Center(
                        child: Icon(Icons.play_circle_outline, size: 80, color: Colors.white),
                      ),
                    ),
                  
                  // Video info overlay (bottom right)
                  Positioned(
                    bottom: 100,
                    left: 16,
                    right: 80,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '@${video.user?['username'] ?? 'Unknown'} (${index + 1}/${videoProvider.videos.length})',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          video.description ?? 'No description',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 14,
                          ),
                          maxLines: 3,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                  
                  // Action buttons (right side)
                  Positioned(
                    bottom: 100,
                    right: 16,
                    child: Column(
                      children: [
                        // Like button
                        _VideoActionButton(
                          icon: Icons.favorite_border,
                          activeIcon: Icons.favorite,
                          count: video.likesCount,
                          isActive: _likedVideos[video.id] ?? false,
                          onTap: () => _handleLike(video),
                        ),
                        const SizedBox(height: 24),
                        // Comment button
                        _VideoActionButton(
                          icon: Icons.chat_bubble_outline,
                          activeIcon: Icons.chat_bubble,
                          count: video.commentsCount,
                          onTap: () => _showComments(video),
                        ),
                        const SizedBox(height: 24),
                        // Share button
                        _VideoActionButton(
                          icon: Icons.share,
                          activeIcon: Icons.share,
                          count: video.sharesCount,
                          onTap: () => _shareVideo(video),
                        ),
                        const SizedBox(height: 24),
                        // Follow button (if not own video)
                        if (video.userId != Provider.of<AuthProvider>(context, listen: false).currentUser?.id)
                          _VideoActionButton(
                            icon: Icons.add_box_outlined,
                            activeIcon: Icons.add_box,
                            isActive: _followedUsers[video.userId] ?? false,
                            onTap: () => _handleFollow(video),
                          ),
                      ],
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }
}

class _VideoActionButton extends StatelessWidget {
  final IconData icon;
  final IconData? activeIcon;
  final int? count;
  final bool isActive;
  final VoidCallback onTap;
  final Color? activeColor;

  const _VideoActionButton({
    required this.icon,
    this.activeIcon,
    this.count,
    this.isActive = false,
    required this.onTap,
    this.activeColor,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: Colors.black.withOpacity(0.3),
              shape: BoxShape.circle,
            ),
            child: Icon(
              isActive && activeIcon != null ? activeIcon! : icon,
              color: isActive 
                ? (activeColor ?? const Color(0xFFFF0080))
                : Colors.white,
              size: 24,
            ),
          ),
          if (count != null) ...[
            const SizedBox(height: 4),
            Text(
              _formatCount(count!),
              style: const TextStyle(
                color: Colors.white,
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ],
      ),
    );
  }

  String _formatCount(int count) {
    if (count < 1000) {
      return count.toString();
    } else if (count < 1000000) {
      double k = count / 1000;
      return '${k.toStringAsFixed(k.truncateToDouble() == k ? 0 : 1)}K';
    } else {
      double m = count / 1000000;
      return '${m.toStringAsFixed(m.truncateToDouble() == m ? 0 : 1)}M';
    }
  }
}

class CommentsSheet extends StatefulWidget {
  final Video video;

  const CommentsSheet({super.key, required this.video});

  @override
  State<CommentsSheet> createState() => _CommentsSheetState();
}

class _CommentsSheetState extends State<CommentsSheet> {
  final TextEditingController _commentController = TextEditingController();
  final List<Map<String, dynamic>> _comments = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadComments();
  }

  Future<void> _loadComments() async {
    // Simulate loading comments - replace with actual API call
    await Future.delayed(const Duration(milliseconds: 500));
    setState(() {
      _comments.addAll([
        {
          'id': '1',
          'username': 'user123',
          'text': 'Amazing video! 🔥',
          'timestamp': DateTime.now().subtract(const Duration(hours: 2)),
          'likes': 12,
        },
        {
          'id': '2',
          'username': 'cooluser',
          'text': 'Love this content',
          'timestamp': DateTime.now().subtract(const Duration(minutes: 30)),
          'likes': 5,
        },
      ]);
      _isLoading = false;
    });
  }

  Future<void> _postComment() async {
    if (_commentController.text.trim().isEmpty) return;
    
    final newComment = {
      'id': DateTime.now().millisecondsSinceEpoch.toString(),
      'username': 'You',
      'text': _commentController.text.trim(),
      'timestamp': DateTime.now(),
      'likes': 0,
    };
    
    setState(() {
      _comments.insert(0, newComment);
      _commentController.clear();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.75,
      decoration: const BoxDecoration(
        color: Color(0xFF1A1A1A),
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      child: Column(
        children: [
          // Handle bar
          Container(
            width: 40,
            height: 4,
            margin: const EdgeInsets.symmetric(vertical: 12),
            decoration: BoxDecoration(
              color: Colors.grey[600],
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          // Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '${_comments.length} comments',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(Icons.close, color: Colors.white),
                ),
              ],
            ),
          ),
          const Divider(color: Colors.grey),
          // Comments list
          Expanded(
            child: _isLoading
                ? const Center(
                    child: CircularProgressIndicator(color: Color(0xFFFF0080)),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: _comments.length,
                    itemBuilder: (context, index) {
                      final comment = _comments[index];
                      return Padding(
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            CircleAvatar(
                              radius: 16,
                              backgroundColor: const Color(0xFFFF0080),
                              child: Text(
                                comment['username'][0].toUpperCase(),
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Text(
                                        comment['username'],
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      Text(
                                        _formatTime(comment['timestamp']),
                                        style: TextStyle(
                                          color: Colors.grey[400],
                                          fontSize: 12,
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    comment['text'],
                                    style: const TextStyle(color: Colors.white),
                                  ),
                                  const SizedBox(height: 8),
                                  Row(
                                    children: [
                                      GestureDetector(
                                        onTap: () {},
                                        child: Row(
                                          children: [
                                            const Icon(
                                              Icons.favorite_border,
                                              color: Colors.grey,
                                              size: 16,
                                            ),
                                            const SizedBox(width: 4),
                                            Text(
                                              comment['likes'].toString(),
                                              style: TextStyle(
                                                color: Colors.grey[400],
                                                fontSize: 12,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                      const SizedBox(width: 16),
                                      GestureDetector(
                                        onTap: () {},
                                        child: Text(
                                          'Reply',
                                          style: TextStyle(
                                            color: Colors.grey[400],
                                            fontSize: 12,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
          ),
          // Comment input
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.grey[900],
              border: Border(top: BorderSide(color: Colors.grey[700]!)),
            ),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _commentController,
                    style: const TextStyle(color: Colors.white),
                    decoration: InputDecoration(
                      hintText: 'Add a comment...',
                      hintStyle: TextStyle(color: Colors.grey[500]),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(20),
                        borderSide: BorderSide.none,
                      ),
                      filled: true,
                      fillColor: Colors.grey[800],
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 8,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                GestureDetector(
                  onTap: _postComment,
                  child: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: const BoxDecoration(
                      color: Color(0xFFFF0080),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.send,
                      color: Colors.white,
                      size: 20,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _formatTime(DateTime timestamp) {
    final now = DateTime.now();
    final difference = now.difference(timestamp);
    
    if (difference.inMinutes < 1) {
      return 'now';
    } else if (difference.inHours < 1) {
      return '${difference.inMinutes}m';
    } else if (difference.inDays < 1) {
      return '${difference.inHours}h';
    } else {
      return '${difference.inDays}d';
    }
  }

  @override
  void dispose() {
    _commentController.dispose();
    super.dispose();
  }
}

class ShareSheet extends StatelessWidget {
  final Video video;

  const ShareSheet({super.key, required this.video});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Handle bar
          Container(
            width: 40,
            height: 4,
            margin: const EdgeInsets.only(bottom: 16),
            decoration: BoxDecoration(
              color: Colors.grey[600],
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          // Header
          const Text(
            'Share to',
            style: TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 20),
          // Share options
          GridView.count(
            shrinkWrap: true,
            crossAxisCount: 4,
            mainAxisSpacing: 16,
            crossAxisSpacing: 16,
            children: [
              _ShareOption(
                icon: Icons.copy,
                label: 'Copy link',
                onTap: () {
                  // Copy video link to clipboard
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Link copied to clipboard'),
                      backgroundColor: Color(0xFFFF0080),
                    ),
                  );
                },
              ),
              _ShareOption(
                icon: Icons.message,
                label: 'Messages',
                onTap: () {
                  Navigator.pop(context);
                },
              ),
              _ShareOption(
                icon: Icons.share,
                label: 'More',
                onTap: () {
                  Navigator.pop(context);
                },
              ),
              _ShareOption(
                icon: Icons.download,
                label: 'Save',
                onTap: () {
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Video saved to gallery'),
                      backgroundColor: Color(0xFFFF0080),
                    ),
                  );
                },
              ),
            ],
          ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }
}

class _ShareOption extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _ShareOption({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              color: Colors.grey[800],
              shape: BoxShape.circle,
            ),
            child: Icon(
              icon,
              color: Colors.white,
              size: 24,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            label,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 12,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}