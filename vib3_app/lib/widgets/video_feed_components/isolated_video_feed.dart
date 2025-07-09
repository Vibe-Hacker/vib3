import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'state_manager.dart';
import 'actions/action_buttons.dart';
import '../video_player_widget.dart';
import '../../models/video.dart';

/// Video feed that uses isolated components to prevent interference
class IsolatedVideoFeed extends StatefulWidget {
  final List<Video> videos;
  final Function(Video) onLike;
  final Function(Video) onComment;
  final Function(Video) onShare;
  final Function(String) onFollow;
  final Function(String) onProfile;
  
  const IsolatedVideoFeed({
    super.key,
    required this.videos,
    required this.onLike,
    required this.onComment,
    required this.onShare,
    required this.onFollow,
    required this.onProfile,
  });
  
  @override
  State<IsolatedVideoFeed> createState() => _IsolatedVideoFeedState();
}

class _IsolatedVideoFeedState extends State<IsolatedVideoFeed> {
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
    // Update state manager instead of local state
    context.read<VideoFeedStateManager>().setCurrentVideoIndex(index);
  }
  
  @override
  Widget build(BuildContext context) {
    return Consumer<VideoFeedStateManager>(
      builder: (context, stateManager, child) {
        return Stack(
          children: [
            // Video player - isolated from UI components
            PageView.builder(
              controller: _pageController,
              scrollDirection: Axis.vertical,
              onPageChanged: _onPageChanged,
              itemCount: widget.videos.length,
              itemBuilder: (context, index) {
                final video = widget.videos[index];
                final isCurrentVideo = index == stateManager.currentVideoIndex;
                
                return Stack(
                  fit: StackFit.expand,
                  children: [
                    // Video player
                    VideoPlayerWidget(
                      videoUrl: video.videoUrl!,
                      isPlaying: isCurrentVideo && stateManager.isVideoPlaying,
                      onTap: () => stateManager.toggleVideoPlayback(),
                    ),
                    
                    // Video info overlay - doesn't interfere with buttons
                    Positioned(
                      bottom: 20,
                      left: 20,
                      right: 100, // Leave space for action buttons
                      child: _buildVideoInfo(video),
                    ),
                  ],
                );
              },
            ),
            
            // Action buttons - completely isolated
            if (!stateManager.isDraggingActions)
              Positioned(
                right: 0,
                bottom: 80, // Above navigation
                child: VideoActionButtons(
                  video: widget.videos[stateManager.currentVideoIndex],
                  isLiked: _likedVideos[widget.videos[stateManager.currentVideoIndex].id] ?? false,
                  isFollowing: _followedUsers[widget.videos[stateManager.currentVideoIndex].userId] ?? false,
                  onLike: () {
                    final video = widget.videos[stateManager.currentVideoIndex];
                    setState(() {
                      _likedVideos[video.id] = !(_likedVideos[video.id] ?? false);
                    });
                    widget.onLike(video);
                  },
                  onComment: () => widget.onComment(widget.videos[stateManager.currentVideoIndex]),
                  onShare: () => widget.onShare(widget.videos[stateManager.currentVideoIndex]),
                  onFollow: () {
                    final userId = widget.videos[stateManager.currentVideoIndex].userId;
                    setState(() {
                      _followedUsers[userId] = !(_followedUsers[userId] ?? false);
                    });
                    widget.onFollow(userId);
                  },
                  onProfile: () => widget.onProfile(widget.videos[stateManager.currentVideoIndex].userId),
                ),
              ),
          ],
        );
      },
    );
  }
  
  Widget _buildVideoInfo(Video video) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        // Username
        Text(
          '@${video.user?['username'] ?? 'unknown'}',
          style: const TextStyle(
            color: Colors.white,
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 8),
        
        // Description
        if (video.description?.isNotEmpty ?? false)
          Text(
            video.description!,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 14,
            ),
            maxLines: 3,
            overflow: TextOverflow.ellipsis,
          ),
        
        // Music info
        if (video.musicName?.isNotEmpty ?? false) ...[
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
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        ],
      ],
    );
  }
}