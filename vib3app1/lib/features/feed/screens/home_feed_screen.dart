import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../app/theme/app_theme.dart';
import '../../../core/services/auth_service.dart';
import '../widgets/post_card.dart';
import '../widgets/story_bar.dart';
import '../../messages/widgets/message_button.dart';
import '../../camera/widgets/camera_button.dart';

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
    // TODO: Implement refresh logic
    await Future.delayed(const Duration(seconds: 1));
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
        child: Text(
          'VIB3',
          style: Theme.of(context).textTheme.headlineMedium?.copyWith(
            fontWeight: FontWeight.bold,
            letterSpacing: -0.5,
          ),
        ),
      ),
      leading: const CameraButton(),
      actions: [
        IconButton(
          icon: Stack(
            children: [
              const Icon(Icons.favorite_outline_rounded, size: 28),
              Positioned(
                right: 0,
                top: 0,
                child: Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: AppTheme.primaryColor,
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: AppTheme.backgroundColor,
                      width: 1,
                    ),
                  ),
                ).animate(
                  onPlay: (controller) => controller.repeat(),
                ).scale(
                  duration: const Duration(seconds: 1),
                  begin: const Offset(1, 1),
                  end: const Offset(1.2, 1.2),
                ).fadeOut(
                  duration: const Duration(seconds: 1),
                ),
              ),
            ],
          ),
          onPressed: () {
            // TODO: Navigate to activity/notifications
          },
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
      child: Container(
        height: 110,
        margin: const EdgeInsets.only(bottom: 8),
        child: const StoryBar(),
      ),
    );
  }
  
  Widget _buildFeedContent() {
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
          
          // TODO: Replace with actual post data
          return PostCard(
            postId: 'post_$index',
            username: 'user_$index',
            userAvatar: 'https://i.pravatar.cc/150?img=$index',
            location: index % 3 == 0 ? 'Los Angeles, CA' : null,
            mediaUrls: [
              'https://picsum.photos/400/600?random=$index',
              if (index % 2 == 0) 'https://picsum.photos/400/600?random=${index + 100}',
            ],
            caption: 'This is an amazing post caption #vib3 #flutter',
            likes: 1234 + index * 100,
            comments: 56 + index * 10,
            timeAgo: '${index + 1}h ago',
            isLiked: index % 3 == 0,
            isSaved: index % 5 == 0,
          ).animate().fadeIn(
            duration: const Duration(milliseconds: 300),
            delay: Duration(milliseconds: index * 50),
          );
        },
        childCount: 20, // TODO: Dynamic count based on actual posts
      ),
    );
  }
}