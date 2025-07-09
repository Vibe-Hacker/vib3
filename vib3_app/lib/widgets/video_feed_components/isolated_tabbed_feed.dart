import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/video_provider.dart';
import 'state_manager.dart';
import 'isolated_video_feed.dart';
import 'navigation/navigation_controller.dart';

/// Tabbed video feed using isolated components architecture
class IsolatedTabbedFeed extends StatefulWidget {
  final bool isVisible;
  
  const IsolatedTabbedFeed({
    super.key,
    this.isVisible = true,
  });
  
  @override
  State<IsolatedTabbedFeed> createState() => _IsolatedTabbedFeedState();
}

class _IsolatedTabbedFeedState extends State<IsolatedTabbedFeed>
    with SingleTickerProviderStateMixin {
  late VideoFeedStateManager _stateManager;
  
  @override
  void initState() {
    super.initState();
    _stateManager = VideoFeedStateManager();
    _stateManager.tabs.initialize(this, 3);
    
    // Load initial videos
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadVideosForTab(0);
    });
  }
  
  @override
  void dispose() {
    _stateManager.dispose();
    super.dispose();
  }
  
  void _loadVideosForTab(int tabIndex) {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final videoProvider = Provider.of<VideoProvider>(context, listen: false);
    final token = authProvider.authToken;
    
    if (token == null) return;
    
    // Check if we already have videos for this tab
    bool hasVideos = false;
    switch (tabIndex) {
      case 0:
        hasVideos = videoProvider.forYouVideos.isNotEmpty;
        break;
      case 1:
        hasVideos = videoProvider.followingVideos.isNotEmpty;
        break;
      case 2:
        hasVideos = videoProvider.friendsVideos.isNotEmpty;
        break;
    }
    
    // Only load if we don't have videos
    if (!hasVideos) {
      switch (tabIndex) {
        case 0:
          videoProvider.loadForYouVideos(token);
          break;
        case 1:
          videoProvider.loadFollowingVideos(token);
          break;
        case 2:
          videoProvider.loadFriendsVideos(token);
          break;
      }
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider.value(
      value: _stateManager,
      child: Column(
        children: [
          // Tab bar
          Container(
            height: 56,
            decoration: BoxDecoration(
              color: Colors.black.withOpacity(0.8),
              border: Border(
                bottom: BorderSide(
                  color: Colors.grey[800]!,
                  width: 0.5,
                ),
              ),
            ),
            child: TabBar(
              controller: _stateManager.tabs.tabController,
              indicatorColor: const Color(0xFF00CED1),
              indicatorWeight: 3,
              labelColor: const Color(0xFF00CED1),
              unselectedLabelColor: const Color(0xFF00CED1).withOpacity(0.5),
              labelStyle: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.bold,
                height: 1.2,
              ),
              unselectedLabelStyle: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.normal,
                height: 1.2,
              ),
              labelPadding: const EdgeInsets.symmetric(horizontal: 8),
              onTap: (index) {
                _loadVideosForTab(index);
              },
              tabs: [
                Tab(
                  child: Container(
                    alignment: Alignment.center,
                    child: const Text(
                      'Vib3\nPulse',
                      textAlign: TextAlign.center,
                      style: TextStyle(height: 1.1),
                    ),
                  ),
                ),
                Tab(
                  child: Container(
                    alignment: Alignment.center,
                    child: const Text(
                      'Vib3\nConnect',
                      textAlign: TextAlign.center,
                      style: TextStyle(height: 1.1),
                    ),
                  ),
                ),
                Tab(
                  child: Container(
                    alignment: Alignment.center,
                    child: const Text(
                      'Vib3\nCircle',
                      textAlign: TextAlign.center,
                      style: TextStyle(height: 1.1),
                    ),
                  ),
                ),
              ],
            ),
          ),
          
          // Content
          Expanded(
            child: Consumer<VideoProvider>(
              builder: (context, videoProvider, child) {
                return TabBarView(
                  controller: _stateManager.tabs.tabController,
                  children: [
                    // Vib3 Pulse
                    _buildVideoFeed(
                      videos: videoProvider.forYouVideos,
                      isVisible: widget.isVisible && _stateManager.tabs.currentTab == 0,
                    ),
                    
                    // Vib3 Connect
                    _buildVideoFeed(
                      videos: videoProvider.followingVideos,
                      isVisible: widget.isVisible && _stateManager.tabs.currentTab == 1,
                    ),
                    
                    // Vib3 Circle
                    _buildVideoFeed(
                      videos: videoProvider.friendsVideos,
                      isVisible: widget.isVisible && _stateManager.tabs.currentTab == 2,
                    ),
                  ],
                );
              },
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildVideoFeed({
    required List<dynamic> videos,
    required bool isVisible,
  }) {
    if (videos.isEmpty) {
      return const Center(
        child: CircularProgressIndicator(
          color: Color(0xFF00CED1),
        ),
      );
    }
    
    return IsolatedVideoFeed(
      videos: videos.cast(),
      onLike: (video) {
        // Handle like
        print('Liked video: ${video.id}');
      },
      onComment: (video) {
        // Handle comment
        print('Comment on video: ${video.id}');
      },
      onShare: (video) {
        // Handle share
        print('Share video: ${video.id}');
      },
      onFollow: (userId) {
        // Handle follow
        print('Follow user: $userId');
      },
      onProfile: (userId) {
        // Handle profile
        print('View profile: $userId');
      },
    );
  }
}