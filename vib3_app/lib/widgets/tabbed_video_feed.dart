import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/video_provider.dart';
import '../models/video.dart';
import 'video_feed.dart';

class TabbedVideoFeed extends StatefulWidget {
  final bool isVisible;

  const TabbedVideoFeed({super.key, this.isVisible = true});

  @override
  State<TabbedVideoFeed> createState() => _TabbedVideoFeedState();
}

class _TabbedVideoFeedState extends State<TabbedVideoFeed> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  int _currentTab = 0;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _tabController.addListener(() {
      if (_tabController.indexIsChanging) {
        setState(() {
          _currentTab = _tabController.index;
        });
        _loadVideosForTab(_tabController.index);
      }
    });
    
    // Load initial videos for the first tab
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadVideosForTab(0); // Load "Vib3 Pulse" videos initially
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  void _loadVideosForTab(int tabIndex) {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final videoProvider = Provider.of<VideoProvider>(context, listen: false);
    final token = authProvider.authToken;

    if (token == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please login to view videos'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    switch (tabIndex) {
      case 0: // Vib3 Pulse
        videoProvider.loadForYouVideos(token);
        break;
      case 1: // Vib3 Connect
        videoProvider.loadFollowingVideos(token);
        break;
      case 2: // Vib3 Circle
        videoProvider.loadFriendsVideos(token);
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Tab Bar with VIB3 styling
        Container(
          height: 56, // Increased height to accommodate wrapped text
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
            controller: _tabController,
            indicatorColor: const Color(0xFF00CED1),
            indicatorWeight: 3,
            labelColor: const Color(0xFF00CED1), // VIB3 cyan color
            unselectedLabelColor: const Color(0xFF00CED1).withOpacity(0.5), // Dimmed cyan
            labelStyle: const TextStyle(
              fontSize: 14, // Slightly smaller font
              fontWeight: FontWeight.bold,
              height: 1.2,
            ),
            unselectedLabelStyle: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.normal,
              height: 1.2,
            ),
            labelPadding: const EdgeInsets.symmetric(horizontal: 8), // Reduce padding
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
        // Video Feed Content
        Expanded(
          child: TabBarView(
            controller: _tabController,
            children: [
              // Vib3 Pulse Feed
              VideoFeed(
                isVisible: widget.isVisible && _currentTab == 0,
                feedType: FeedType.forYou,
              ),
              // Vib3 Connect Feed
              VideoFeed(
                isVisible: widget.isVisible && _currentTab == 1,
                feedType: FeedType.following,
              ),
              // Vib3 Circle Feed
              _buildFriendsFeed(),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildFriendsFeed() {
    return Consumer<VideoProvider>(
      builder: (context, videoProvider, child) {
        if (videoProvider.isLoading) {
          return const Center(
            child: CircularProgressIndicator(
              color: Color(0xFFFF0080),
            ),
          );
        }

        return Container(
          color: Colors.black,
          child: GridView.builder(
            padding: const EdgeInsets.all(2),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 3,
              crossAxisSpacing: 2,
              mainAxisSpacing: 2,
              childAspectRatio: 9 / 16,
            ),
            itemCount: videoProvider.discoverVideos.length,
            itemBuilder: (context, index) {
              final video = videoProvider.discoverVideos[index];
              return _DiscoverVideoTile(video: video);
            },
          ),
        );
      },
    );
  }
}

class _DiscoverVideoTile extends StatelessWidget {
  final Video video;

  const _DiscoverVideoTile({required this.video});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        // Navigate to full screen video view
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => FullScreenVideoView(video: video),
          ),
        );
      },
      child: Container(
        decoration: BoxDecoration(
          color: Colors.grey[900],
          borderRadius: BorderRadius.circular(4),
        ),
        child: Stack(
          fit: StackFit.expand,
          children: [
            // Thumbnail or placeholder
            Container(
              color: Colors.grey[800],
              child: const Center(
                child: Icon(
                  Icons.play_circle_outline,
                  color: Colors.white,
                  size: 40,
                ),
              ),
            ),
            // Gradient overlay
            Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.transparent,
                    Colors.black.withOpacity(0.7),
                  ],
                ),
              ),
            ),
            // Video info
            Positioned(
              bottom: 4,
              left: 4,
              right: 4,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    '@${video.user?['username'] ?? 'unknown'}',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  Row(
                    children: [
                      const Icon(
                        Icons.play_arrow,
                        color: Colors.white,
                        size: 12,
                      ),
                      const SizedBox(width: 2),
                      Text(
                        _formatCount(video.viewsCount),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                        ),
                      ),
                    ],
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

class FullScreenVideoView extends StatelessWidget {
  final Video video;

  const FullScreenVideoView({super.key, required this.video});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          VideoFeed(
            isVisible: true,
            initialVideo: video,
          ),
          // Back button
          Positioned(
            top: MediaQuery.of(context).padding.top + 16,
            left: 16,
            child: IconButton(
              onPressed: () => Navigator.pop(context),
              icon: const Icon(
                Icons.arrow_back,
                color: Colors.white,
                size: 28,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

