import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/video_feed_provider.dart';
import '../../domain/entities/video_entity.dart';
import '../../../../widgets/video_player_widget.dart';

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
  
  @override
  void initState() {
    super.initState();
    _pageController = PageController();
    _loadInitialVideos();
  }
  
  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
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
        
        return PageView.builder(
          controller: _pageController,
          scrollDirection: Axis.vertical,
          onPageChanged: (index) {
            setState(() {
              _currentIndex = index;
            });
            
            // Track view
            provider.trackView(videos[index].id);
            
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
                // Video player
                VideoPlayerWidget(
                  videoUrl: video.videoUrl,
                  isCurrentlyVisible: index == _currentIndex,
                ),
                
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
                      
                      // Music info
                      if (video.musicName != null) ...[
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            const Icon(
                              Icons.music_note,
                              color: Colors.white,
                              size: 16,
                            ),
                            const SizedBox(width: 4),
                            Expanded(
                              child: Text(
                                video.musicName!,
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
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                      ],
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
          },
        );
      },
    );
  }
}

class _ActionButton extends StatelessWidget {
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
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Icon(
            icon,
            color: color,
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
            _formatCount(count),
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