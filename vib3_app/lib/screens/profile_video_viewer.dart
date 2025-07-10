import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../models/video.dart';
import '../widgets/video_player_widget.dart';
import '../widgets/double_tap_like_animation.dart';
import '../widgets/comments_sheet.dart';
import '../providers/video_provider.dart';
import '../providers/auth_provider.dart';

/// Full-screen video viewer for profile videos
/// Allows scrolling through all videos from a specific user
class ProfileVideoViewer extends StatefulWidget {
  final List<Video> videos;
  final int initialIndex;
  final String username;
  
  const ProfileVideoViewer({
    super.key,
    required this.videos,
    required this.initialIndex,
    required this.username,
  });
  
  @override
  State<ProfileVideoViewer> createState() => _ProfileVideoViewerState();
}

class _ProfileVideoViewerState extends State<ProfileVideoViewer> {
  late PageController _pageController;
  int _currentIndex = 0;
  bool _showControls = true;
  
  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialIndex;
    _pageController = PageController(initialPage: widget.initialIndex);
    
    // Hide status bar for immersive experience
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
  }
  
  @override
  void dispose() {
    _pageController.dispose();
    // Restore system UI
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
    super.dispose();
  }
  
  void _onPageChanged(int index) {
    setState(() {
      _currentIndex = index;
    });
    
    // Haptic feedback on page change
    HapticFeedback.lightImpact();
  }
  
  void _handleLike(Video video) async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final token = authProvider.authToken;
    
    if (token == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please login to like videos')),
      );
      return;
    }

    final videoProvider = Provider.of<VideoProvider>(context, listen: false);
    final success = await videoProvider.toggleLike(video.id, token);
    
    if (!success) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Failed to update like')),
      );
    }
  }
  
  void _showComments(Video video) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) => CommentsSheet(video: video),
    );
  }
  
  void _shareVideo(Video video) {
    // TODO: Implement share functionality
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Share functionality coming soon')),
    );
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // Video PageView
          PageView.builder(
            controller: _pageController,
            scrollDirection: Axis.vertical,
            onPageChanged: _onPageChanged,
            itemCount: widget.videos.length,
            itemBuilder: (context, index) {
              final video = widget.videos[index];
              final isCurrentVideo = index == _currentIndex;
              
              return Stack(
                fit: StackFit.expand,
                children: [
                  // Video Player with double tap to like
                  DoubleTapLikeWrapper(
                    onDoubleTap: () => _handleLike(video),
                    isLiked: Provider.of<VideoProvider>(context).isVideoLiked(video.id),
                    child: GestureDetector(
                      onTap: () {
                        setState(() {
                          _showControls = !_showControls;
                        });
                      },
                      child: VideoPlayerWidget(
                        videoUrl: video.videoUrl ?? '',
                        isPlaying: isCurrentVideo,
                      ),
                    ),
                  ),
                  
                  // Controls Overlay
                  if (_showControls) ...[
                    // Top Bar
                    Positioned(
                      top: 0,
                      left: 0,
                      right: 0,
                      child: Container(
                        padding: EdgeInsets.only(
                          top: MediaQuery.of(context).padding.top + 8,
                          left: 16,
                          right: 16,
                          bottom: 8,
                        ),
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [
                              Colors.black.withOpacity(0.7),
                              Colors.transparent,
                            ],
                          ),
                        ),
                        child: Row(
                          children: [
                            // Back button
                            IconButton(
                              onPressed: () => Navigator.pop(context),
                              icon: const Icon(
                                Icons.arrow_back,
                                color: Colors.white,
                                size: 28,
                              ),
                            ),
                            const SizedBox(width: 8),
                            // Profile info
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    '@${widget.username}',
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  Text(
                                    'Video ${_currentIndex + 1} of ${widget.videos.length}',
                                    style: const TextStyle(
                                      color: Colors.white70,
                                      fontSize: 12,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            // Exit button
                            IconButton(
                              onPressed: () => Navigator.pop(context),
                              icon: const Icon(
                                Icons.close,
                                color: Colors.white,
                                size: 28,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    
                    // Right side actions
                    Positioned(
                      right: 16,
                      bottom: 100,
                      child: Column(
                        children: [
                          // Like button
                          _buildActionButton(
                            icon: Provider.of<VideoProvider>(context).isVideoLiked(video.id)
                                ? Icons.favorite
                                : Icons.favorite_border,
                            label: '${video.likesCount}',
                            onTap: () => _handleLike(video),
                            color: Provider.of<VideoProvider>(context).isVideoLiked(video.id)
                                ? Colors.red
                                : Colors.white,
                          ),
                          const SizedBox(height: 20),
                          
                          // Comment button
                          _buildActionButton(
                            icon: Icons.chat_bubble_outline,
                            label: '${video.commentsCount}',
                            onTap: () => _showComments(video),
                          ),
                          const SizedBox(height: 20),
                          
                          // Share button
                          _buildActionButton(
                            icon: Icons.share,
                            label: 'Share',
                            onTap: () => _shareVideo(video),
                          ),
                        ],
                      ),
                    ),
                    
                    // Bottom description
                    Positioned(
                      bottom: 0,
                      left: 0,
                      right: 0,
                      child: Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.bottomCenter,
                            end: Alignment.topCenter,
                            colors: [
                              Colors.black.withOpacity(0.8),
                              Colors.transparent,
                            ],
                          ),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            if (video.description != null)
                              Text(
                                video.description!,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 14,
                                ),
                                maxLines: 3,
                                overflow: TextOverflow.ellipsis,
                              ),
                            if (video.hashtags != null && video.hashtags!.isNotEmpty) ...[
                              const SizedBox(height: 8),
                              Wrap(
                                spacing: 4,
                                runSpacing: 2,
                                children: video.hashtags!.take(5).map((tag) {
                                  final displayTag = tag.startsWith('#') ? tag : '#$tag';
                                  return Text(
                                    displayTag,
                                    style: const TextStyle(
                                      color: Color(0xFF00CED1),
                                      fontSize: 12,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  );
                                }).toList(),
                              ),
                            ],
                            if (video.musicName != null) ...[
                              const SizedBox(height: 8),
                              Row(
                                children: [
                                  const Icon(
                                    Icons.music_note,
                                    size: 14,
                                    color: Color(0xFF00CED1),
                                  ),
                                  const SizedBox(width: 4),
                                  Expanded(
                                    child: Text(
                                      video.musicName!,
                                      style: const TextStyle(
                                        color: Colors.white70,
                                        fontSize: 12,
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
                    ),
                  ],
                  
                  // Video index indicator (always visible)
                  if (!_showControls)
                    Positioned(
                      top: MediaQuery.of(context).padding.top + 16,
                      right: 16,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.black.withOpacity(0.5),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          '${_currentIndex + 1}/${widget.videos.length}',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                ],
              );
            },
          ),
          
          // Swipe down hint
          if (_currentIndex == 0 && _showControls)
            Positioned(
              bottom: 50,
              left: 0,
              right: 0,
              child: Center(
                child: Column(
                  children: [
                    const Icon(
                      Icons.keyboard_arrow_down,
                      color: Colors.white54,
                      size: 32,
                    ),
                    Text(
                      'Swipe down to exit',
                      style: TextStyle(
                        color: Colors.white54,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
  
  Widget _buildActionButton({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
    Color color = Colors.white,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(
              icon,
              color: color,
              size: 28,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 12,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }
}