import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../../core/services/feed_service.dart';
import '../../../core/models/post_model.dart';
import '../../feed/widgets/video_feed_item.dart';

class ReelsScreen extends StatefulWidget {
  const ReelsScreen({Key? key}) : super(key: key);

  @override
  State<ReelsScreen> createState() => _ReelsScreenState();
}

class _ReelsScreenState extends State<ReelsScreen> with AutomaticKeepAliveClientMixin {
  final PageController _pageController = PageController();
  int _currentIndex = 0;
  
  @override
  bool get wantKeepAlive => true;
  
  @override
  void initState() {
    super.initState();
    // Load reels feed when screen initializes
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<FeedService>().loadReelsFeed();
    });
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
    HapticFeedback.lightImpact();
  }
  
  Future<void> _onRefresh() async {
    HapticFeedback.mediumImpact();
    final feedService = context.read<FeedService>();
    await feedService.loadReelsFeed(refresh: true);
  }
  
  @override
  Widget build(BuildContext context) {
    super.build(context);
    final feedService = context.watch<FeedService>();
    final reels = feedService.reelsFeed;
    
    if (reels.isEmpty && feedService.isLoadingReels) {
      return const Scaffold(
        backgroundColor: Colors.black,
        body: Center(
          child: CircularProgressIndicator(
            color: Colors.white,
          ),
        ),
      );
    }
    
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // Video Feed
          RefreshIndicator(
            onRefresh: _onRefresh,
            child: PageView.builder(
              controller: _pageController,
              scrollDirection: Axis.vertical,
              onPageChanged: _onPageChanged,
              itemCount: reels.length,
              itemBuilder: (context, index) {
                final reel = reels[index];
                return VideoFeedItem(
                  post: reel,
                  isActive: index == _currentIndex,
                  onLike: () {
                    feedService.likePost(reel.id);
                  },
                  onComment: () {
                    _showCommentsSheet(reel);
                  },
                  onShare: () {
                    _showShareOptions(reel);
                  },
                  onFollow: () {
                    // TODO: Implement follow functionality
                  },
                );
              },
            ),
          ),
          
          // Top Bar
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: SafeArea(
              child: _buildTopBar(),
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildTopBar() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          // Live button
          IconButton(
            onPressed: () {
              // TODO: Navigate to live streaming
            },
            icon: const Icon(
              Icons.live_tv_rounded,
              color: Colors.white,
              size: 28,
            ),
          ),
          
          // Following | For You tabs
          Row(
            children: [
              TextButton(
                onPressed: () {
                  // TODO: Switch to following feed
                },
                child: Text(
                  'Following',
                  style: TextStyle(
                    color: Colors.white.withOpacity(0.7),
                    fontSize: 16,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Container(
                height: 20,
                width: 1,
                color: Colors.white.withOpacity(0.3),
              ),
              const SizedBox(width: 16),
              TextButton(
                onPressed: () {
                  // Already on For You
                },
                child: const Text(
                  'For You',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
          
          // Search button
          IconButton(
            onPressed: () {
              // TODO: Navigate to search
            },
            icon: const Icon(
              Icons.search,
              color: Colors.white,
              size: 28,
            ),
          ),
        ],
      ),
    );
  }
  
  void _showCommentsSheet(Post reel) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.7,
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          children: [
            // Handle bar
            Container(
              margin: const EdgeInsets.only(top: 12),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey[300],
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            // Comments header
            Padding(
              padding: const EdgeInsets.all(16),
              child: Text(
                '${reel.commentsCount} comments',
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            // TODO: Add comments list
            const Expanded(
              child: Center(
                child: Text('Comments coming soon'),
              ),
            ),
          ],
        ),
      ),
    );
  }
  
  void _showShareOptions(Post reel) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: const Icon(Icons.share),
                title: const Text('Share to...'),
                onTap: () {
                  Navigator.pop(context);
                  // TODO: Implement share
                },
              ),
              ListTile(
                leading: const Icon(Icons.link),
                title: const Text('Copy link'),
                onTap: () {
                  Navigator.pop(context);
                  // TODO: Copy link
                },
              ),
              ListTile(
                leading: const Icon(Icons.download),
                title: const Text('Save video'),
                onTap: () {
                  Navigator.pop(context);
                  // TODO: Save video
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}