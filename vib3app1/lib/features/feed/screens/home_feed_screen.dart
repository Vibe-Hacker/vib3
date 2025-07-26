import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../app/theme/app_theme.dart';
import '../../../core/services/auth_service.dart';
import '../../../core/services/feed_service.dart';
import '../../../core/models/post_model.dart';
import '../widgets/post_card.dart';
import '../widgets/story_bar.dart';
import '../../messages/widgets/message_button.dart';
import '../../camera/widgets/camera_button.dart';
import 'package:go_router/go_router.dart';

class HomeFeedScreen extends StatefulWidget {
  const HomeFeedScreen({Key? key}) : super(key: key);

  @override
  State<HomeFeedScreen> createState() => _HomeFeedScreenState();
}

class _HomeFeedScreenState extends State<HomeFeedScreen>
    with AutomaticKeepAliveClientMixin {
  final ScrollController _scrollController = ScrollController();
  bool _showAppBarTitle = false;
  
  @override
  bool get wantKeepAlive => true;
  
  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }
  
  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }
  
  void _onScroll() {
    if (_scrollController.offset > 100 && !_showAppBarTitle) {
      setState(() => _showAppBarTitle = true);
    } else if (_scrollController.offset <= 100 && _showAppBarTitle) {
      setState(() => _showAppBarTitle = false);
    }
  }
  
  Future<void> _onRefresh() async {
    HapticFeedback.mediumImpact();
    final feedService = context.read<FeedService>();
    await feedService.loadHomeFeed(refresh: true);
  }
  
  @override
  Widget build(BuildContext context) {
    super.build(context);
    final authService = context.watch<AuthService>();
    
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      body: CustomScrollView(
        controller: _scrollController,
        physics: const BouncingScrollPhysics(
          parent: AlwaysScrollableScrollPhysics(),
        ),
        slivers: [
          _buildSliverAppBar(),
          _buildStoryBar(),
          _buildFeedContent(),
        ],
      ),
    );
  }
  
  Widget _buildSliverAppBar() {
    return SliverAppBar(
      floating: true,
      snap: true,
      backgroundColor: AppTheme.backgroundColor,
      elevation: 0,
      pinned: true,
      expandedHeight: 60,
      title: AnimatedOpacity(
        opacity: _showAppBarTitle ? 1.0 : 0.0,
        duration: const Duration(milliseconds: 200),
        child: ShaderMask(
          shaderCallback: (bounds) => AppTheme.vibeGradient.createShader(bounds),
          child: Text(
            'VIB3',
            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
              fontWeight: FontWeight.bold,
              letterSpacing: 2,
              color: Colors.white,
            ),
          ),
        ),
      ),
      leading: const CameraButton(),
      actions: [
        // Vibe Meter button
        IconButton(
          icon: Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: AppTheme.vibeGradient,
            ),
            child: const Icon(
              Icons.bubble_chart,
              size: 18,
              color: Colors.white,
            ),
          ),
          onPressed: () => context.go('/vibe-meter'),
        ).animate(
          onPlay: (controller) => controller.repeat(reverse: true),
        ).scaleXY(
          duration: 2.seconds,
          begin: 1.0,
          end: 1.1,
        ),
        // Time Capsule button
        IconButton(
          icon: const Icon(Icons.lock_clock, size: 26),
          onPressed: () => context.go('/time-capsule'),
        ),
        const MessageButton(),
      ],
      flexibleSpace: FlexibleSpaceBar(
        background: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                AppTheme.backgroundColor,
                AppTheme.backgroundColor.withOpacity(0.8),
              ],
            ),
          ),
        ),
      ),
    );
  }
  
  Widget _buildStoryBar() {
    return SliverToBoxAdapter(
      child: Column(
        children: [
          // VIB3 Feature Banner
          Container(
            height: 60,
            margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              gradient: AppTheme.pulseGradient,
              borderRadius: BorderRadius.circular(AppTheme.defaultRadius),
              boxShadow: [
                BoxShadow(
                  color: AppTheme.primaryColor.withOpacity(0.3),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: () => context.go('/collab-rooms'),
                borderRadius: BorderRadius.circular(AppTheme.defaultRadius),
                child: Center(
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.flash_on, color: Colors.white, size: 28),
                      const SizedBox(width: 8),
                      const Text(
                        'Join Live Collab Rooms',
                        style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Text(
                          'LIVE',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ).animate().fadeIn(duration: 600.ms).slideX(begin: -0.2, end: 0),
          
          // Story bar
          Container(
            height: 110,
            margin: const EdgeInsets.only(bottom: 8),
            child: const StoryBar(),
          ),
        ],
      ),
    );
  }
  
  Widget _buildFeedContent() {
    final feedService = context.watch<FeedService>();
    final posts = feedService.homeFeed;
    
    if (posts.isEmpty && feedService.isLoadingHome) {
      return const SliverFillRemaining(
        child: Center(
          child: CircularProgressIndicator(),
        ),
      );
    }
    
    return SliverList(
      delegate: SliverChildBuilderDelegate(
        (context, index) {
          if (index == 0) {
            return RefreshIndicator(
              onRefresh: _onRefresh,
              color: AppTheme.primaryColor,
              backgroundColor: AppTheme.surfaceColor,
              child: Container(), // Empty container for pull-to-refresh
            );
          }
          
          final postIndex = index - 1;
          if (postIndex >= posts.length) {
            return null;
          }
          
          final post = posts[postIndex];
          final mediaUrls = post.media.map((m) => m.url).toList();
          
          return PostCard(
            postId: post.id,
            username: post.author?.username ?? 'unknown',
            userAvatar: post.author?.profilePicture ?? 'https://i.pravatar.cc/150',
            location: post.location,
            mediaUrls: mediaUrls,
            caption: post.caption ?? '',
            likes: post.likesCount,
            comments: post.commentsCount,
            timeAgo: _getTimeAgo(post.createdAt),
            isLiked: post.isLiked,
            isSaved: post.isSaved,
          ).animate().fadeIn(
            duration: const Duration(milliseconds: 300),
            delay: Duration(milliseconds: index * 50),
          );
        },
        childCount: posts.length + 1, // +1 for the refresh indicator
      ),
    );
  }
  
  String _getTimeAgo(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);
    
    if (difference.inDays > 0) {
      return '${difference.inDays}d ago';
    } else if (difference.inHours > 0) {
      return '${difference.inHours}h ago';
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes}m ago';
    } else {
      return 'Just now';
    }
  }
}