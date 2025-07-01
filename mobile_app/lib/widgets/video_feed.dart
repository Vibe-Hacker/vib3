import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/video_provider.dart';
import '../widgets/video_player_item.dart';

class VideoFeed extends StatefulWidget {
  final bool isFollowing;
  
  const VideoFeed({
    super.key,
    this.isFollowing = false,
  });

  @override
  State<VideoFeed> createState() => _VideoFeedState();
}

class _VideoFeedState extends State<VideoFeed> {
  late PageController _pageController;
  int _currentIndex = 0;

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

  @override
  Widget build(BuildContext context) {
    return Consumer<VideoProvider>(
      builder: (context, videoProvider, child) {
        if (videoProvider.videos.isEmpty) {
          if (videoProvider.isLoading) {
            return const Center(
              child: CircularProgressIndicator(
                color: Colors.white,
              ),
            );
          } else if (videoProvider.error != null) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(
                    Icons.error_outline,
                    color: Colors.white,
                    size: 64,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Oops! Something went wrong',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    videoProvider.error!,
                    style: const TextStyle(
                      color: Colors.white70,
                      fontSize: 14,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: () {
                      videoProvider.loadVideos(refresh: true);
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: Colors.black,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(20),
                      ),
                    ),
                    child: const Text('Try Again'),
                  ),
                ],
              ),
            );
          } else {
            return const Center(
              child: Text(
                'No videos available',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                ),
              ),
            );
          }
        }

        return RefreshIndicator(
          onRefresh: () => videoProvider.loadVideos(refresh: true),
          color: Colors.white,
          backgroundColor: Colors.black,
          child: PageView.builder(
            controller: _pageController,
            scrollDirection: Axis.vertical,
            onPageChanged: (index) {
              setState(() {
                _currentIndex = index;
              });
              videoProvider.setCurrentVideoIndex(index);
            },
            itemCount: videoProvider.videos.length + (videoProvider.hasMore ? 1 : 0),
            itemBuilder: (context, index) {
              // Show loading indicator at the end if there are more videos
              if (index >= videoProvider.videos.length) {
                return Container(
                  color: Colors.black,
                  child: const Center(
                    child: CircularProgressIndicator(
                      color: Colors.white,
                    ),
                  ),
                );
              }
              
              final video = videoProvider.videos[index];
              return VideoPlayerItem(
                video: video,
                isPlaying: index == _currentIndex,
                onLike: () => videoProvider.likeVideo(video.id),
                onShare: () => videoProvider.shareVideo(video.id),
                onFollow: () => videoProvider.followUser(video.userId),
                onComment: () => _showCommentsBottomSheet(context, video.id),
              );
            },
          ),
        );
      },
    );
  }

  void _showCommentsBottomSheet(BuildContext context, String videoId) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.6,
        maxChildSize: 0.9,
        minChildSize: 0.3,
        builder: (context, scrollController) {
          return Container(
            decoration: const BoxDecoration(
              color: Color(0xFF1A1A1A),
              borderRadius: BorderRadius.only(
                topLeft: Radius.circular(20),
                topRight: Radius.circular(20),
              ),
            ),
            child: Column(
              children: [
                // Handle bar
                Container(
                  margin: const EdgeInsets.only(top: 12),
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.3),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                
                // Header
                const Padding(
                  padding: EdgeInsets.all(16.0),
                  child: Text(
                    'Comments',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                
                // Comments list
                Expanded(
                  child: ListView.builder(
                    controller: scrollController,
                    itemCount: 10, // Placeholder
                    itemBuilder: (context, index) {
                      return Padding(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 16.0,
                          vertical: 8.0,
                        ),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const CircleAvatar(
                              radius: 16,
                              backgroundColor: Colors.grey,
                              child: Icon(Icons.person, color: Colors.white, size: 20),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text(
                                    'username',
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 14,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    'This is a sample comment. Great video!',
                                    style: TextStyle(
                                      color: Colors.white.withOpacity(0.8),
                                      fontSize: 14,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    '2h ago',
                                    style: TextStyle(
                                      color: Colors.white.withOpacity(0.5),
                                      fontSize: 12,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            Icon(
                              Icons.favorite_border,
                              color: Colors.white.withOpacity(0.7),
                              size: 18,
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),
                
                // Comment input
                Container(
                  padding: const EdgeInsets.all(16.0),
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.3),
                    border: Border(
                      top: BorderSide(
                        color: Colors.white.withOpacity(0.1),
                        width: 1,
                      ),
                    ),
                  ),
                  child: SafeArea(
                    child: Row(
                      children: [
                        const CircleAvatar(
                          radius: 16,
                          backgroundColor: Colors.grey,
                          child: Icon(Icons.person, color: Colors.white, size: 20),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: TextField(
                            style: const TextStyle(color: Colors.white),
                            decoration: InputDecoration(
                              hintText: 'Add a comment...',
                              hintStyle: TextStyle(
                                color: Colors.white.withOpacity(0.5),
                              ),
                              border: InputBorder.none,
                              contentPadding: const EdgeInsets.symmetric(
                                horizontal: 16,
                                vertical: 8,
                              ),
                              filled: true,
                              fillColor: Colors.white.withOpacity(0.1),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        IconButton(
                          onPressed: () {
                            // TODO: Send comment
                          },
                          icon: const Icon(
                            Icons.send,
                            color: Colors.white,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}