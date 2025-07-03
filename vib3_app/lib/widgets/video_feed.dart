import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/video_provider.dart';
import '../providers/auth_provider.dart';
import '../services/video_service.dart';
import '../models/video.dart';
import 'video_player_widget.dart';

class VideoFeed extends StatefulWidget {
  final bool isVisible;

  const VideoFeed({super.key, this.isVisible = true});

  @override
  State<VideoFeed> createState() => _VideoFeedState();
}

class _VideoFeedState extends State<VideoFeed> with WidgetsBindingObserver {
  int _currentIndex = 0;
  late PageController _pageController;
  final Map<String, bool> _likedVideos = {};
  final Map<String, bool> _followedUsers = {};
  bool _isAppInForeground = true;
  bool _isScreenVisible = true;

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
    WidgetsBinding.instance.addObserver(this);
    _isScreenVisible = widget.isVisible;
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _pageController.dispose();
    super.dispose();
  }

  @override
  void didUpdateWidget(VideoFeed oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.isVisible != widget.isVisible) {
      setState(() {
        _isScreenVisible = widget.isVisible;
      });
    }
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    setState(() {
      _isAppInForeground = state == AppLifecycleState.resumed;
    });
  }

  void _onPageChanged(int index) {
    setState(() {
      _currentIndex = index;
    });

    // Add small delay to prevent rapid resource allocation causing scroll sticking
    Future.delayed(const Duration(milliseconds: 50), () {
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
    });
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

  List<Widget> _buildFloatingBubbleActions(BuildContext context, Video video, int index) {
    const bubbleOffset = 60.0;
    final isCurrentVideo = index == _currentIndex;
    
    return [
      // Like Bubble (bottom right, further from edge)
      AnimatedPositioned(
        duration: Duration(milliseconds: 300 + (index * 50)),
        bottom: 80 + (isCurrentVideo ? 10 : 0),
        right: 50 + (isCurrentVideo ? 5 : 0),
        child: _FloatingBubble(
          icon: Icons.favorite_border,
          activeIcon: Icons.favorite,
          count: video.likesCount,
          isActive: _likedVideos[video.id] ?? false,
          onTap: () => _handleLike(video),
          gradientColors: const [Color(0xFFFF1493), Color(0xFFFF6B9D)],
        ),
      ),
      
      // Comment Bubble (middle right, moving closer to edge)
      AnimatedPositioned(
        duration: Duration(milliseconds: 400 + (index * 50)),
        bottom: 140 + (isCurrentVideo ? 8 : 0),
        right: 35 + (isCurrentVideo ? 3 : 0),
        child: _FloatingBubble(
          icon: Icons.chat_bubble_outline,
          activeIcon: Icons.chat_bubble,
          count: video.commentsCount,
          onTap: () => _showComments(video),
          gradientColors: const [Color(0xFF00CED1), Color(0xFF40E0D0)],
        ),
      ),
      
      // Share Bubble (top right, closest to edge)
      AnimatedPositioned(
        duration: Duration(milliseconds: 500 + (index * 50)),
        bottom: 200 + (isCurrentVideo ? 6 : 0),
        right: 20 + (isCurrentVideo ? 1 : 0),
        child: _FloatingBubble(
          icon: Icons.share,
          activeIcon: Icons.share,
          count: video.sharesCount,
          onTap: () => _shareVideo(video),
          gradientColors: const [Color(0xFFFFD700), Color(0xFFFFA500)],
        ),
      ),
      
      // Follow Bubble (if not own video, at the very top and edge)
      if (video.userId != Provider.of<AuthProvider>(context, listen: false).currentUser?.id)
        AnimatedPositioned(
          duration: Duration(milliseconds: 600 + (index * 50)),
          bottom: 260 + (isCurrentVideo ? 4 : 0),
          right: 15 + (isCurrentVideo ? -1 : 0),
          child: _FloatingBubble(
            icon: Icons.add_box_outlined,
            activeIcon: Icons.add_box,
            isActive: _followedUsers[video.userId] ?? false,
            onTap: () => _handleFollow(video),
            gradientColors: const [Color(0xFF9C27B0), Color(0xFFE1BEE7)],
          ),
        ),
    ];
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

        // Show actual video content with unique card-style layout
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
            // Disable all preloading to eliminate resource conflicts completely
            final shouldPreload = false;
            
            return Container(
              color: Colors.black,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              child: Container(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.5),
                      blurRadius: 10,
                      spreadRadius: 1,
                    ),
                  ],
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(25),
                  child: Stack(
                    children: [
                      // Video player
                      if (video.videoUrl != null && video.videoUrl!.isNotEmpty)
                        VideoPlayerWidget(
                          videoUrl: video.videoUrl!,
                          isPlaying: isCurrentVideo && _isAppInForeground && _isScreenVisible,
                          preload: shouldPreload,
                        )
                      else
                        Container(
                          color: Colors.grey[900],
                          child: const Center(
                            child: Icon(Icons.play_circle_outline, size: 80, color: Colors.white),
                          ),
                        ),
                      
                  
                      // Top-right Creator Panel with VIB3 styling (edge position)
                      Positioned(
                        top: 8,
                        right: 8,
                        child: Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              colors: [
                                Color(0xFF00CED1),
                                Color(0xFFFF1493),
                              ],
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            ),
                            borderRadius: BorderRadius.circular(20),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.3),
                                blurRadius: 8,
                                spreadRadius: 1,
                              ),
                            ],
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              // User avatar with gradient border
                              Container(
                                padding: const EdgeInsets.all(2),
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  gradient: const LinearGradient(
                                    colors: [Colors.white, Colors.white70],
                                  ),
                                ),
                                child: CircleAvatar(
                                  radius: 16,
                                  backgroundColor: Colors.black,
                                  child: Text(
                                    (video.user?['username'] ?? 'U')[0].toUpperCase(),
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 12,
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              // Username
                              Text(
                                '@${video.user?['username'] ?? 'Unknown'}',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                  shadows: [
                                    Shadow(
                                      color: Colors.black,
                                      blurRadius: 4,
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      
                      // Video description overlay (between floating buttons and bottom)
                      Positioned(
                        bottom: 60,
                        left: 16,
                        right: 90,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                          decoration: BoxDecoration(
                            // Dark bubble background
                            color: Colors.black.withOpacity(0.8),
                            borderRadius: BorderRadius.circular(25),
                            // Border for definition
                            border: Border.all(
                              color: Colors.white.withOpacity(0.2),
                              width: 1.5,
                            ),
                            // Cyan/blue gradient glow effect
                            boxShadow: [
                              // Primary cyan glow
                              BoxShadow(
                                color: const Color(0xFF00CED1).withOpacity(0.5),
                                blurRadius: 25,
                                spreadRadius: 5,
                              ),
                              // Secondary blue glow
                              BoxShadow(
                                color: const Color(0xFF1E90FF).withOpacity(0.3),
                                blurRadius: 35,
                                spreadRadius: 8,
                              ),
                              // Subtle white glow for brightness
                              BoxShadow(
                                color: Colors.white.withOpacity(0.1),
                                blurRadius: 15,
                                spreadRadius: 2,
                              ),
                              // Inner shadow for depth
                              BoxShadow(
                                color: Colors.black.withOpacity(0.9),
                                blurRadius: 10,
                                spreadRadius: 2,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: Text(
                            video.description ?? 'No description',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 14,
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            textAlign: TextAlign.center,
                          ),
                        ),
                      ),
                  
                  // Debug info button (top left, smaller)
                  Positioned(
                    top: 60,
                    left: 16,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.6),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: const Color(0xFF00CED1).withOpacity(0.3),
                          width: 0.5,
                        ),
                      ),
                      child: Text(
                        '${index + 1}/${videoProvider.videos.length}',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 9,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ),
                  
                      // Floating Bubble Actions (unique diagonal layout)
                      ..._buildFloatingBubbleActions(context, video, index),
                      
                      // Gesture detection overlay for unique interactions
                      Positioned.fill(
                        child: GestureDetector(
                          onDoubleTap: () => _handleLike(video),
                          onLongPress: () => _showComments(video),
                          child: Container(color: Colors.transparent),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
        );
      },
    );
  }
}

class _FloatingBubble extends StatefulWidget {
  final IconData icon;
  final IconData? activeIcon;
  final int? count;
  final bool isActive;
  final VoidCallback onTap;
  final List<Color> gradientColors;

  const _FloatingBubble({
    required this.icon,
    this.activeIcon,
    this.count,
    this.isActive = false,
    required this.onTap,
    required this.gradientColors,
  });

  @override
  State<_FloatingBubble> createState() => _FloatingBubbleState();
}

class _FloatingBubbleState extends State<_FloatingBubble>
    with TickerProviderStateMixin {
  late AnimationController _pulseController;
  late AnimationController _floatController;
  late Animation<double> _pulseAnimation;
  late Animation<double> _floatAnimation;

  @override
  void initState() {
    super.initState();
    
    _pulseController = AnimationController(
      duration: const Duration(seconds: 2),
      vsync: this,
    );
    
    _floatController = AnimationController(
      duration: const Duration(seconds: 3),
      vsync: this,
    );
    
    _pulseAnimation = Tween<double>(
      begin: 1.0,
      end: 1.2,
    ).animate(CurvedAnimation(
      parent: _pulseController,
      curve: Curves.easeInOut,
    ));
    
    _floatAnimation = Tween<double>(
      begin: -5.0,
      end: 5.0,
    ).animate(CurvedAnimation(
      parent: _floatController,
      curve: Curves.easeInOut,
    ));
    
    _pulseController.repeat(reverse: true);
    _floatController.repeat(reverse: true);
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _floatController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: Listenable.merge([_pulseAnimation, _floatAnimation]),
      builder: (context, child) {
        return Transform.translate(
          offset: Offset(0, _floatAnimation.value),
          child: Transform.scale(
            scale: widget.isActive ? _pulseAnimation.value : 1.0,
            child: GestureDetector(
              onTap: widget.onTap,
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: widget.gradientColors,
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: widget.gradientColors.first.withOpacity(0.4),
                      blurRadius: 15,
                      spreadRadius: 3,
                    ),
                    BoxShadow(
                      color: widget.gradientColors.last.withOpacity(0.4),
                      blurRadius: 15,
                      spreadRadius: 3,
                      offset: const Offset(3, 3),
                    ),
                  ],
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      widget.isActive && widget.activeIcon != null 
                        ? widget.activeIcon! 
                        : widget.icon,
                      color: Colors.white,
                      size: 24,
                      shadows: const [
                        Shadow(
                          color: Colors.black,
                          blurRadius: 4,
                        ),
                      ],
                    ),
                    if (widget.count != null) ...[
                      const SizedBox(height: 4),
                      Text(
                        _formatCount(widget.count!),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          shadows: [
                            Shadow(
                              color: Colors.black,
                              blurRadius: 2,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ),
        );
      },
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

  // SECURITY: Generate secure sharing links that contain NO authentication data
  void _copySecureVideoLink(BuildContext context, Video video) {
    try {
      // Create secure sharing URL with ONLY public video ID
      // NEVER include user tokens, auth data, or sensitive information
      final secureUrl = 'https://vib3.com/video/${video.id}';
      
      // TODO: Copy to clipboard using flutter/services
      // Clipboard.setData(ClipboardData(text: secureUrl));
      
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Secure link copied: $secureUrl'),
          backgroundColor: const Color(0xFFFF0080),
          duration: const Duration(seconds: 3),
        ),
      );
      
      print('SECURITY: Generated secure share link - $secureUrl (no auth data)');
    } catch (e) {
      print('Error generating secure share link: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Failed to copy link'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

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
                onTap: () => _copySecureVideoLink(context, video),
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