import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../providers/video_feed_provider.dart';
import '../../domain/entities/video_entity.dart';
import '../../../../widgets/video_player_widget.dart';
import '../../../../widgets/preloaded_video_player.dart';
import '../../../../services/enhanced_video_cache.dart';
import '../../../../services/video_preload_manager.dart';

/// Video feed widget using the new repository pattern
/// This replaces direct VideoService usage
class VideoFeedWidget extends StatefulWidget {
  final String feedType; // 'for_you', 'following', 'friends'
  
  const VideoFeedWidget({
    Key? key,
    required this.feedType,
  }) : super(key: key);
  
  @override
  State<VideoFeedWidget> createState() => _VideoFeedWidgetState();
}

class _VideoFeedWidgetState extends State<VideoFeedWidget> {
  late PageController _pageController;
  int _currentIndex = 0;
  final _videoCache = EnhancedVideoCache();
  final _preloadManager = VideoPreloadManager();
  
  @override
  void initState() {
    super.initState();
    _pageController = PageController();
    _initializeCache();
    _loadInitialVideos();
  }
  
  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }
  
  Future<void> _initializeCache() async {
    await _videoCache.initialize();
  }
  
  void _loadInitialVideos() {
    final provider = context.read<VideoFeedProvider>();
    
    switch (widget.feedType) {
      case 'for_you':
        provider.loadForYouVideos(refresh: true);
        break;
      case 'following':
        provider.loadFollowingVideos(refresh: true);
        break;
      case 'friends':
        provider.loadFriendsVideos(refresh: true);
        break;
    }
  }
  
  List<VideoEntity> _getVideos(VideoFeedProvider provider) {
    switch (widget.feedType) {
      case 'for_you':
        return provider.forYouVideos;
      case 'following':
        return provider.followingVideos;
      case 'friends':
        return provider.friendsVideos;
      default:
        return [];
    }
  }
  
  bool _isLoading(VideoFeedProvider provider) {
    switch (widget.feedType) {
      case 'for_you':
        return provider.isLoadingForYou;
      case 'following':
        return provider.isLoadingFollowing;
      case 'friends':
        return provider.isLoadingFriends;
      default:
        return false;
    }
  }
  
  void _loadMoreVideos(VideoFeedProvider provider) {
    switch (widget.feedType) {
      case 'for_you':
        provider.loadForYouVideos();
        break;
      case 'following':
        provider.loadFollowingVideos();
        break;
      case 'friends':
        provider.loadFriendsVideos();
        break;
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Consumer<VideoFeedProvider>(
      builder: (context, provider, child) {
        final videos = _getVideos(provider);
        final isLoading = _isLoading(provider);
        
        if (videos.isEmpty && isLoading) {
          return const Center(
            child: CircularProgressIndicator(),
          );
        }
        
        if (videos.isEmpty && provider.hasError) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.error_outline, size: 64, color: Colors.grey),
                const SizedBox(height: 16),
                Text(
                  provider.error ?? 'Failed to load videos',
                  style: const TextStyle(color: Colors.grey),
                ),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: _loadInitialVideos,
                  child: const Text('Retry'),
                ),
              ],
            ),
          );
        }
        
        if (videos.isEmpty) {
          return const Center(
            child: Text(
              'No videos available',
              style: TextStyle(color: Colors.grey),
            ),
          );
        }
        
        // Pre-cache upcoming videos for smooth playback
        final videoUrls = videos.map((v) => v.videoUrl).toList();
        if (_currentIndex < videos.length - 5) {
          _videoCache.preCacheVideos(
            videoUrls.skip(_currentIndex + 1).take(5).toList(),
            startPriority: 10,
          );
        }
        
        // Preload videos when we have them
        if (videos.isNotEmpty) {
          _preloadManager.preloadVideos(videoUrls, _currentIndex);
        }
        
        return PageView.builder(
          controller: _pageController,
          scrollDirection: Axis.vertical,
          onPageChanged: (index) {
            setState(() {
              _currentIndex = index;
            });
            
            // Track view
            provider.trackView(videos[index].id);
            
            // Preload adjacent videos
            _preloadManager.preloadVideos(videoUrls, index);
            
            // Pre-cache next 5 videos for download
            if (index < videos.length - 5) {
              _videoCache.preCacheVideos(
                videoUrls.skip(index + 1).take(5).toList(),
                startPriority: 10,
              );
            }
            
            // Load more videos when reaching near the end
            if (index >= videos.length - 3 && !isLoading) {
              _loadMoreVideos(provider);
            }
          },
          itemCount: videos.length,
          itemBuilder: (context, index) {
            final video = videos[index];
            
            return Stack(
              children: [
                // Use preloaded video player
                PreloadedVideoPlayer(
                  videoUrl: video.videoUrl,
                  isPlaying: index == _currentIndex,
                ),
                
                // Video info overlay
                _buildVideoOverlay(context, video, provider),
              ],
            );
          },
        );
      },
    );
  }
  
  Widget _buildVideoOverlay(BuildContext context, VideoEntity video, VideoFeedProvider provider) {
    return Stack(
      children: [
        // Video info overlay
        Positioned(
          bottom: 80,
          left: 16,
          right: 80,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Username
              GestureDetector(
                onTap: () {
                  // Navigate to user profile
                },
                child: Text(
                  '@${video.username}',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    shadows: [
                      Shadow(
                        offset: Offset(1, 1),
                        blurRadius: 3,
                        color: Colors.black45,
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 8),
              
              // Description
              if (video.description != null)
                Text(
                  video.description!,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                    shadows: [
                      Shadow(
                        offset: Offset(1, 1),
                        blurRadius: 3,
                        color: Colors.black45,
                      ),
                    ],
                  ),
                  maxLines: 3,
                  overflow: TextOverflow.ellipsis,
                ),
            ],
          ),
        ),
        
        // Action buttons
        Positioned(
          bottom: 80,
          right: 16,
          child: Column(
            children: [
              // Like button
              _ActionButton(
                icon: video.isLiked ? Icons.favorite : Icons.favorite_border,
                color: video.isLiked ? Colors.red : Colors.white,
                count: video.likesCount,
                onTap: () {
                  provider.toggleLike(video.id, video.isLiked);
                },
              ),
              const SizedBox(height: 20),
              
              // Comment button
              _ActionButton(
                icon: Icons.comment,
                count: video.commentsCount,
                onTap: () {
                  // Show comments
                },
              ),
              const SizedBox(height: 20),
              
              // Share button
              _ActionButton(
                icon: Icons.share,
                count: video.sharesCount,
                onTap: () {
                  // Share video
                },
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _ActionButton extends StatefulWidget {
  final IconData icon;
  final Color color;
  final int count;
  final VoidCallback onTap;
  
  const _ActionButton({
    required this.icon,
    this.color = Colors.white,
    required this.count,
    required this.onTap,
  });
  
  @override
  State<_ActionButton> createState() => _ActionButtonState();
}

class _ActionButtonState extends State<_ActionButton>
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
  
  void _handleTap() {
    // Add haptic feedback
    HapticFeedback.lightImpact();
    // Animate the button
    _animationController.forward().then((_) {
      _animationController.reverse();
    });
    // Call the original onTap
    widget.onTap();
  }
  
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: _handleTap,
      child: ScaleTransition(
        scale: _scaleAnimation,
        child: Column(
          children: [
            Icon(
              widget.icon,
              color: widget.color,
              size: 32,
              shadows: const [
                Shadow(
                  offset: Offset(1, 1),
                  blurRadius: 3,
                  color: Colors.black45,
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              _formatCount(widget.count),
              style: const TextStyle(
                color: Colors.white,
                fontSize: 12,
                shadows: [
                  Shadow(
                    offset: Offset(1, 1),
                    blurRadius: 3,
                    color: Colors.black45,
                  ),
                ],
              ),
            ),
          ],
        ),
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