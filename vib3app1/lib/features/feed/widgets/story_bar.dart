import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../../app/theme/app_theme.dart';
import '../../../core/models/story_model.dart';
import '../../../core/models/user_model.dart';
import '../../../core/services/auth_service.dart';
import '../../../core/widgets/placeholder_image.dart';
import '../../stories/screens/story_viewer_screen.dart';

class StoryBar extends StatefulWidget {
  const StoryBar({Key? key}) : super(key: key);

  @override
  State<StoryBar> createState() => _StoryBarState();
}

class _StoryBarState extends State<StoryBar> {
  late List<Story> _stories;
  
  @override
  void initState() {
    super.initState();
    _loadMockStories();
  }
  
  void _loadMockStories() {
    final now = DateTime.now();
    _stories = List.generate(8, (index) {
      final user = User(
        id: 'user_$index',
        username: index == 0 ? 'Add Story' : 'user_$index',
        email: 'user$index@example.com',
        displayName: index == 0 ? 'Your Story' : 'User $index',
        profilePicture: 'avatar_$index',
        followersCount: 1000 + index * 100,
        followingCount: 500 + index * 50,
        postsCount: 50 + index * 10,
        isVerified: index % 3 == 0,
        createdAt: now,
        updatedAt: now,
      );
      
      return Story(
        id: 'story_$index',
        userId: user.id,
        user: user,
        segments: List.generate(index == 0 ? 0 : (index % 3) + 1, (segIndex) {
          return StorySegment(
            id: 'segment_${index}_$segIndex',
            type: segIndex % 2 == 0 ? StoryType.photo : StoryType.video,
            mediaUrl: 'story_media_${index}_$segIndex',
            caption: 'Story from ${user.username} #${segIndex + 1}',
            isSeen: index % 4 == 0,
            isLiked: segIndex == 0 && index % 2 == 0,
            createdAt: now.subtract(Duration(hours: index + segIndex)),
          );
        }),
        viewsCount: 100 * (index + 1),
        expiresAt: now.add(const Duration(hours: 24)),
        createdAt: now.subtract(Duration(hours: index)),
        updatedAt: now.subtract(Duration(hours: index)),
      );
    });
  }
  
  @override
  Widget build(BuildContext context) {
    final currentUser = context.watch<AuthService>().currentUser;
    
    return ListView.builder(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 8),
      itemCount: _stories.length + 1,
      itemBuilder: (context, index) {
        if (index == 0) {
          return _buildAddStoryItem(context, currentUser);
        }
        
        final story = _stories[index - 1];
        return _buildStoryItem(
          context,
          story: story,
          index: index,
        ).animate().fadeIn(
          delay: Duration(milliseconds: index * 50),
          duration: const Duration(milliseconds: 300),
        );
      },
    );
  }
  
  Widget _buildAddStoryItem(BuildContext context, User? currentUser) {
    return GestureDetector(
      onTap: () {
        // TODO: Open camera for story creation
        context.push('/camera');
      },
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 6, vertical: 8),
        child: Column(
          children: [
            Stack(
              children: [
                Container(
                  width: 70,
                  height: 70,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: AppTheme.surfaceColor,
                    border: Border.all(
                      color: Colors.white12,
                      width: 1,
                    ),
                  ),
                  child: ClipOval(
                    child: currentUser?.profilePicture != null
                        ? PlaceholderAvatar(
                            size: 68,
                            seed: currentUser!.username,
                          )
                        : const Icon(
                            Icons.person,
                            color: Colors.white54,
                            size: 30,
                          ),
                  ),
                ),
                Positioned(
                  right: 0,
                  bottom: 0,
                  child: Container(
                    width: 24,
                    height: 24,
                    decoration: BoxDecoration(
                      color: AppTheme.primaryColor,
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: AppTheme.backgroundColor,
                        width: 2,
                      ),
                    ),
                    child: const Icon(
                      Icons.add,
                      color: Colors.white,
                      size: 16,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              'Your Story',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                fontSize: 11,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildStoryItem(
    BuildContext context, {
    required Story story,
    required int index,
  }) {
    final hasNewStory = story.segments.isNotEmpty;
    final isViewed = story.segments.isEmpty || story.segments.every((s) => s.isSeen);
    
    return GestureDetector(
      onTap: () {
        if (story.segments.isEmpty) return;
        
        Navigator.of(context).push(
          MaterialPageRoute(
            fullscreenDialog: true,
            builder: (context) => StoryViewerScreen(
              stories: _stories.where((s) => s.segments.isNotEmpty).toList(),
              initialIndex: index - 1,
            ),
          ),
        );
      },
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 6, vertical: 8),
        child: Column(
          children: [
            Container(
              padding: EdgeInsets.all(hasNewStory ? 3 : 0),
              decoration: hasNewStory
                  ? BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: LinearGradient(
                        colors: isViewed
                            ? [Colors.grey, Colors.grey.shade700]
                            : [AppTheme.primaryColor, AppTheme.secondaryColor],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                    )
                  : null,
              child: Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppTheme.backgroundColor,
                  border: Border.all(
                    color: AppTheme.backgroundColor,
                    width: 2,
                  ),
                ),
                child: ClipOval(
                  child: PlaceholderAvatar(
                    size: 60,
                    seed: story.user.username,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 4),
            SizedBox(
              width: 70,
              child: Text(
                story.user.username,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  fontSize: 11,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                textAlign: TextAlign.center,
              ),
            ),
          ],
        ),
      ),
    );
  }
}