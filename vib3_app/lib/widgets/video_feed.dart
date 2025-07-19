import 'dart:async';
import 'dart:convert';
import 'dart:math';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:http/http.dart' as http;
import '../providers/video_provider.dart';
import '../providers/auth_provider.dart';
import '../providers/theme_provider.dart';
import '../services/video_service.dart';
import '../services/user_service.dart';
import '../models/video.dart';
import '../models/comment.dart';
import '../services/comment_service.dart';
import '../services/interaction_tracking_service.dart';
import '../services/recommendation_engine.dart';
import '../widgets/grok_ai_assistant.dart';
import '../screens/profile_screen.dart';
import '../config/app_config.dart';
import 'video_player_widget.dart';
import '../screens/video_creator/modules/duet_module.dart';
import '../screens/video_creator/modules/stitch_module.dart';
import 'double_tap_like_animation.dart';
import 'comments_sheet.dart';
import 'swipe_gesture_detector.dart';
import 'share_sheet.dart';
import 'save_video_dialog.dart';
// Import the better VIB3 themed components
import 'video_feed_components/draggable/draggable_action_buttons.dart';
import 'video_feed_components/state_manager.dart';

enum FeedType { forYou, following, friends }

class VideoFeed extends StatefulWidget {
  final bool isVisible;
  final FeedType? feedType;
  final Video? initialVideo;

  const VideoFeed({
    super.key, 
    this.isVisible = true,
    this.feedType,
    this.initialVideo,
  });

  @override
  State<VideoFeed> createState() => _VideoFeedState();
}

class _VideoFeedState extends State<VideoFeed> with WidgetsBindingObserver {
  int _currentIndex = 0;
  late PageController _pageController;
  final Map<String, bool> _likedVideos = {};
  final Map<String, bool> _followedUsers = {};
  bool _isAppInForeground = true;
  bool _isScreenVisible = true;
  
  // Draggable button positions
  bool _isDragMode = false;
  late Map<String, Offset> _buttonPositions;
  Map<String, bool> _followingStatus = {};
  Timer? _longPressTimer;
  String? _draggingButton;
  Offset? _initialDragPosition;
  Offset? _dragOffset;
  
  // Page change debounce
  Timer? _pageChangeDebounce;

  @override
  void initState() {
    super.initState();
    _pageController = PageController(initialPage: 0);
    WidgetsBinding.instance.addObserver(this);
    _isScreenVisible = widget.isVisible;
    print('🎬 VideoFeed initState: _isScreenVisible = $_isScreenVisible');
    print('🎬 VideoFeed initState: feedType = ${widget.feedType}');
    
    // Load videos after first frame
    WidgetsBinding.instance.addPostFrameCallback((_) {
      print('🎬 VideoFeed: First frame callback, checking for videos...');
      final videoProvider = Provider.of<VideoProvider>(context, listen: false);
      final videos = _getCurrentVideos();
      print('🎬 VideoFeed: Found ${videos.length} videos in provider');
      if (videos.isNotEmpty) {
        print('🎬 First video URL: ${videos[0].videoUrl}');
        
        // Force initial video to play immediately
        if (mounted && _isScreenVisible && _currentIndex == 0) {
          print('🎬 VideoFeed: Force starting first video NOW!');
          // Double setState to ensure video widget gets the message
          setState(() {
            _currentIndex = 0;
          });
          Future.delayed(const Duration(milliseconds: 50), () {
            if (mounted) {
              setState(() {
                // Force another rebuild to ensure video starts
              });
            }
          });
        }
      }
    });
    
    // Initialize button positions with default values
    _buttonPositions = {
      'profile': Offset(300, 200),
      'like': Offset(300, 280),
      'comment': Offset(300, 360),
      'share': Offset(300, 440),
      'save': Offset(300, 520),
    };
    
    // Update positions after first frame
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        final size = MediaQuery.of(context).size;
        setState(() {
          const buttonSize = 80.0;
          const rightMargin = 20.0;
          final x = size.width - buttonSize - rightMargin;
          
          _buttonPositions = {
            'profile': Offset(x, 200),
            'like': Offset(x, 280),
            'comment': Offset(x, 360),
            'share': Offset(x, 440),
            'save': Offset(x, 520),
          };
        });
        _loadButtonPositions();
      }
    });
    
    // Register pause callback with provider
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<VideoProvider>(context, listen: false).registerPauseCallback(() {
        if (mounted) {
          setState(() {
            _isScreenVisible = false;
          });
        }
      });
      
      // Initialize likes and follows
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final token = authProvider.authToken;
      print('VideoFeed initState - token: ${token != null ? 'present' : 'null'}');
      if (token != null) {
        Provider.of<VideoProvider>(context, listen: false).initializeLikesAndFollows(token);
      }
    });
  }
  

  @override
  void didUpdateWidget(VideoFeed oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.isVisible != widget.isVisible) {
      setState(() {
        _isScreenVisible = widget.isVisible;
      });
      print('🎬 VideoFeed: Visibility changed to $_isScreenVisible');
      
      // Handle visibility changes
      if (widget.isVisible && !oldWidget.isVisible) {
        // Tab is becoming visible
        print('VideoFeed: Becoming visible for ${widget.feedType}');
        
        // Don't reload videos if we already have them
        final videoProvider = Provider.of<VideoProvider>(context, listen: false);
        bool hasVideos = false;
        
        switch (widget.feedType!) {
          case FeedType.forYou:
            hasVideos = videoProvider.forYouVideos.isNotEmpty;
            break;
          case FeedType.following:
            hasVideos = videoProvider.followingVideos.isNotEmpty;
            break;
          case FeedType.friends:
            hasVideos = videoProvider.friendsVideos.isNotEmpty;
            break;
        }
        
        if (!hasVideos) {
          // Only reload if we don't have videos
          WidgetsBinding.instance.addPostFrameCallback((_) {
            final authProvider = Provider.of<AuthProvider>(context, listen: false);
            final token = authProvider.authToken;
            
            print('VideoFeed visibility change - feedType: ${widget.feedType}, token: ${token != null ? 'present' : 'null'}');
            
            if (token != null) {
              switch (widget.feedType!) {
                case FeedType.forYou:
                  videoProvider.loadForYouVideos(token);
                  break;
                case FeedType.following:
                  videoProvider.loadFollowingVideos(token);
                  break;
                case FeedType.friends:
                  videoProvider.loadFriendsVideos(token);
                  break;
              }
            } else {
              print('VideoFeed: No auth token available!');
            }
          });
        }
      }
    }
  }

  @override
  void dispose() {
    _longPressTimer?.cancel();
    _pageChangeDebounce?.cancel();
    WidgetsBinding.instance.removeObserver(this);
    
    // Stop tracking current video
    InteractionTrackingService().stopVideoView();
    
    _pageController.dispose();
    super.dispose();
  }

  void _onPageChanged(int index) {
    // Cancel any pending page change processing
    _pageChangeDebounce?.cancel();
    
    // Track skip on previous video if swiped away quickly
    if (_currentIndex != index) {
      try {
        final authProvider = Provider.of<AuthProvider>(context, listen: false);
        final videoProvider = Provider.of<VideoProvider>(context, listen: false);
        final user = authProvider.currentUser;
        
        if (user != null) {
          final videos = _getCurrentVideos();
          if (_currentIndex < videos.length) {
            final previousVideo = videos[_currentIndex];
            InteractionTrackingService().trackSkip(
              userId: user.id,
              video: previousVideo,
            );
            InteractionTrackingService().stopVideoView(videoId: previousVideo.id);
          }
        }
      } catch (e) {
        print('Error tracking video skip: $e');
      }
    }
    
    // Immediately update the index
    setState(() {
      _currentIndex = index;
    });
    
    // Debounce the actual video initialization
    _pageChangeDebounce = Timer(const Duration(milliseconds: 100), () {
      if (!mounted) return;
      
      // Start tracking new video
      try {
        final authProvider = Provider.of<AuthProvider>(context, listen: false);
        final user = authProvider.currentUser;
        final videos = _getCurrentVideos();
        
        if (user != null && index < videos.length) {
          final currentVideo = videos[index];
          InteractionTrackingService().startVideoView(
            userId: user.id,
            video: currentVideo,
          );
        }
      } catch (e) {
        print('Error tracking video view: $e');
      }
      
      // Only pause, don't dispose to keep videos ready
      final videoProvider = Provider.of<VideoProvider>(context, listen: false);
      videoProvider.pauseCurrentVideo();
      
      // Clean up videos that are far from current position
      if (_currentIndex != index) {
        // Dispose videos that are more than 2 positions away
        final oldIndex = _currentIndex;
        if ((oldIndex - index).abs() > 2) {
          print('🧹 Cleaning up video at index $oldIndex (too far from new index $index)');
        }
      }
      
      // Force a rebuild to ensure the new video widget gets the correct isPlaying state
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) {
          setState(() {
            // This extra setState ensures the VideoPlayerWidget receives the updated isPlaying prop
          });
          
          // Explicitly trigger video playback for the new index
          // The VideoPlayerWidget will handle the actual playback when it sees isPlaying = true
          print('📱 VideoFeed: Page changed to index $index, _isScreenVisible: $_isScreenVisible');
        }
      });
    });
    
    // Load more videos when near the end
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final token = authProvider.authToken;
    
    // Get the appropriate video list based on feed type
    final videoProvider = Provider.of<VideoProvider>(context, listen: false);
    List<Video> currentVideos = [];
    switch (widget.feedType) {
      case FeedType.forYou:
        currentVideos = videoProvider.forYouVideos;
        break;
      case FeedType.following:
        currentVideos = videoProvider.followingVideos;
        break;
      case FeedType.friends:
        currentVideos = videoProvider.friendsVideos;
        break;
      default:
        currentVideos = videoProvider.videos;
    }
    
    // Load more videos when we're getting close to the end
    // Or if we have less than 10 videos total
    final shouldLoadMore = (index >= currentVideos.length - 5) || 
                          (currentVideos.length < 10);
    
    if (shouldLoadMore && 
        !videoProvider.isLoadingMore && 
        videoProvider.hasMoreVideos &&
        token != null) {
      // Load more videos without blocking UI
      Future.microtask(() {
        videoProvider.loadMoreVideos(token, feedType: widget.feedType);
      });
    }
  }

  Future<void> _toggleFollow(String userId) async {
    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final currentUserId = authProvider.currentUser?.id;
      
      if (currentUserId == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Please login to follow users')),
        );
        return;
      }

      final token = authProvider.authToken;
      if (token == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Authentication required')),
        );
        return;
      }
      
      final isFollowing = _followingStatus[userId] ?? false;
      
      if (isFollowing) {
        final success = await UserService.unfollowUser(userId, token);
        if (success) {
          setState(() {
            _followingStatus[userId] = false;
          });
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Unfollowed user')),
          );
        }
      } else {
        final success = await UserService.followUser(userId, token);
        if (success) {
          setState(() {
            _followingStatus[userId] = true;
          });
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Following user')),
          );
        }
      }
    } catch (e) {
      print('Error toggling follow: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: ${e.toString()}')),
      );
    }
  }

  void _handleLike(Video video) async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final token = authProvider.authToken;
    final user = authProvider.currentUser;
    
    if (token == null || user == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please login to like videos')),
      );
      return;
    }

    final videoProvider = Provider.of<VideoProvider>(context, listen: false);
    final wasLiked = videoProvider.isVideoLiked(video.id);
    final success = await videoProvider.toggleLike(video.id, token);
    
    if (!success) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Failed to update like')),
      );
    } else {
      // Track like interaction
      InteractionTrackingService().trackLike(
        userId: user.id,
        video: video,
        isLiked: !wasLiked,
      );
      
      // Refresh user stats after like
      authProvider.refreshUserStats();
    }
  }

  void _showComments(Video video) {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final user = authProvider.currentUser;
    
    if (user != null) {
      // Track comment interaction when opening comments
      InteractionTrackingService().trackComment(
        userId: user.id,
        video: video,
      );
    }
    
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) => CommentsSheet(video: video),
    );
  }
  
  List<Video> _getCurrentVideos() {
    final videoProvider = Provider.of<VideoProvider>(context, listen: false);
    
    switch (widget.feedType) {
      case FeedType.forYou:
        return videoProvider.forYouVideos;
      case FeedType.following:
        return videoProvider.followingVideos;
      case FeedType.friends:
        return videoProvider.friendsVideos;
      default:
        return videoProvider.videos;
    }
  }

  void _toggleDragMode() {
    setState(() {
      _isDragMode = !_isDragMode;
    });
  }
  
  void _loadButtonPositions() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final positionsString = prefs.getString('button_positions');
      if (positionsString != null && mounted) {
        final Map<String, dynamic> positions = jsonDecode(positionsString);
        final screenSize = MediaQuery.of(context).size;
        const buttonSize = 80.0;
        const minMargin = 0.0;
        
        setState(() {
          positions.forEach((key, value) {
            final parts = value.split(',');
            if (parts.length == 2) {
              double x = double.parse(parts[0]);
              double y = double.parse(parts[1]);
              
              // Ensure loaded positions are within bounds
              x = x.clamp(minMargin, screenSize.width - (buttonSize / 2));
              y = y.clamp(minMargin, screenSize.height - buttonSize - minMargin - 80);
              
              _buttonPositions[key] = Offset(x, y);
            }
          });
        });
      }
    } catch (e) {
      print('Error loading button positions: $e');
    }
  }
  
  void _saveButtonPositions() async {
    final prefs = await SharedPreferences.getInstance();
    final positions = _buttonPositions.map((key, value) => 
      MapEntry(key, '${value.dx},${value.dy}')
    );
    await prefs.setString('button_positions', jsonEncode(positions));
  }
  
  void _showCreatorProfile(Video video) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ProfileScreen(userId: video.userId),
      ),
    );
  }

  void _handleFollow(Video video) async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final token = authProvider.authToken;
    
    if (token == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please login to follow users')),
      );
      return;
    }

    final videoProvider = Provider.of<VideoProvider>(context, listen: false);
    final success = await videoProvider.toggleFollow(video.userId, token);
    
    if (!success) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Failed to update follow')),
      );
    } else {
      // Refresh user stats after follow
      authProvider.refreshUserStats();
    }
  }
  
  void _startDuet(Video video) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => DuetModule(
          originalVideoPath: video.videoUrl!,
          onVideoRecorded: (path) {
            Navigator.pop(context);
            // Navigate to video creator for editing
            Navigator.pushNamed(
              context, 
              '/video-creator',
              arguments: {'videoPath': path},
            );
          },
        ),
      ),
    );
  }
  
  void _startStitch(Video video) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => StitchModule(
          originalVideoPath: video.videoUrl!,
          onVideoRecorded: (path) {
            Navigator.pop(context);
            // Navigate to video creator for editing
            Navigator.pushNamed(
              context, 
              '/video-creator',
              arguments: {'videoPath': path},
            );
          },
        ),
      ),
    );
  }

  void _shareVideo(Video video) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) => ShareSheet(
        video: video,
        onDuet: () => _startDuet(video),
        onStitch: () => _startStitch(video),
      ),
    );
  }
  
  void _saveVideo(Video video) async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final token = authProvider.authToken;
    
    if (token == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please login to save videos')),
      );
      return;
    }
    
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) => SaveVideoDialog(video: video),
    );
  }
  
  void _markNotInterested(Video video) async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final token = authProvider.authToken;
    
    if (token == null) return;
    
    // TODO: Implement not interested API call
    HapticFeedback.mediumImpact();
    
    // Move to next video immediately
    if (_currentIndex < Provider.of<VideoProvider>(context, listen: false).videos.length - 1) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    }
    
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('We\'ll show you fewer videos like this'),
        duration: Duration(seconds: 2),
      ),
    );
  }
  
  void _showMoreLikeThis(Video video) async {
    // TODO: Implement recommendation algorithm update
    HapticFeedback.mediumImpact();
    
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Finding more videos like this...'),
        backgroundColor: Color(0xFFFF1493),
      ),
    );
    
    // Could navigate to a filtered feed or update recommendations
  }
  

  Widget _buildDraggableButton({
    required String buttonId,
    required Widget child,
    VoidCallback? onTap,
  }) {
    final position = _buttonPositions[buttonId] ?? Offset(300, 250);
    
    return Positioned(
      left: position.dx,
      top: position.dy,
      child: GestureDetector(
        onTapDown: (_) {
          HapticFeedback.selectionClick();
        },
        onLongPressDown: (details) {
          HapticFeedback.mediumImpact();
          // Get the RenderBox to convert positions
          final RenderBox renderBox = context.findRenderObject() as RenderBox;
          final localTouchPosition = renderBox.globalToLocal(details.globalPosition);
          
          _longPressTimer = Timer(const Duration(milliseconds: 500), () {
            if (mounted) {
              setState(() {
                _isDragMode = true;
                _draggingButton = buttonId;
                _initialDragPosition = position;
                // Calculate offset from touch to current button position
                _dragOffset = Offset(
                  localTouchPosition.dx - position.dx,
                  localTouchPosition.dy - position.dy,
                );
              });
              HapticFeedback.heavyImpact();
            }
          });
        },
        onLongPressUp: () {
          _longPressTimer?.cancel();
        },
        onLongPressCancel: () {
          _longPressTimer?.cancel();
        },
        onLongPressMoveUpdate: (details) {
          if (_isDragMode && _draggingButton == buttonId && _dragOffset != null && mounted) {
            final RenderBox renderBox = context.findRenderObject() as RenderBox;
            final localPosition = renderBox.globalToLocal(details.globalPosition);
            final screenSize = MediaQuery.of(context).size;
            
            // Calculate new position
            double newX = localPosition.dx - _dragOffset!.dx;
            double newY = localPosition.dy - _dragOffset!.dy;
            
            // Define button size (approximate)
            const buttonSize = 80.0;
            const minMargin = 0.0;
            
            // Apply boundary constraints
            // Allow button to go partially off-screen on the right (half the button width)
            newX = newX.clamp(minMargin, screenSize.width - (buttonSize / 2));
            newY = newY.clamp(minMargin, screenSize.height - buttonSize - minMargin - 80); // Account for bottom nav
            
            setState(() {
              _buttonPositions[buttonId] = Offset(newX, newY);
            });
          }
        },
        onLongPressEnd: _draggingButton == buttonId ? (details) {
          if (_isDragMode && mounted) {
            setState(() {
              _draggingButton = null;
              _isDragMode = false;
              _dragOffset = null;
            });
            _saveButtonPositions();
            HapticFeedback.lightImpact();
          }
        } : null,
        onTap: !_isDragMode ? () {
          HapticFeedback.lightImpact();
          onTap?.call();
        } : null,
        child: AnimatedContainer(
          duration: _draggingButton == buttonId ? Duration.zero : const Duration(milliseconds: 200),
          transform: _draggingButton == buttonId 
              ? (Matrix4.identity()..scale(1.1))
              : Matrix4.identity(),
          transformAlignment: Alignment.center,
          child: Container(
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.3),
                  blurRadius: _draggingButton == buttonId ? 20 : 10,
                  spreadRadius: _draggingButton == buttonId ? 5 : 2,
                ),
              ],
            ),
            child: child,
          ),
        ),
      ),
    );
  }

  List<Widget> _buildFloatingBubbleActions(BuildContext context, Video video, int index) {
    final isCurrentVideo = index == _currentIndex;
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final currentUserId = authProvider.currentUser?.id;
    final isOwnVideo = currentUserId != null && currentUserId == video.userId;
    
    print('🎯 Action buttons check: index=$index, _currentIndex=$_currentIndex, isCurrentVideo=$isCurrentVideo');
    
    if (!isCurrentVideo) return [];
    
    print('✅ Building action buttons for video at index $index');
    
    return [
      // Profile Button with Follow - Draggable
      _buildDraggableButton(
        buttonId: 'profile',
        onTap: () => _showCreatorProfile(video),
        child: Container(
          width: 60,
          height: 60,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: const LinearGradient(
              colors: [Color(0xFF00CED1), Color(0xFF1E90FF)],
            ),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF00CED1).withOpacity(0.5),
                blurRadius: 15,
                spreadRadius: 2,
              ),
            ],
          ),
          child: Stack(
            children: [
              Center(
                child: Text(
                  () {
                    final username = video.user?['username'] ?? 'U';
                    return username.toString().isNotEmpty ? username.toString()[0].toUpperCase() : 'U';
                  }(),
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 20,
                  ),
                ),
              ),
              if (!isOwnVideo)
                Align(
                  alignment: Alignment.bottomRight,
                  child: GestureDetector(
                    onTap: () => _handleFollow(video),
                    child: Container(
                      width: 24,
                      height: 24,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: Provider.of<VideoProvider>(context).isUserFollowed(video.userId)
                            ? Colors.blue : Colors.red,
                        border: Border.all(color: Colors.white, width: 2),
                      ),
                      child: Icon(
                        Provider.of<VideoProvider>(context).isUserFollowed(video.userId)
                            ? Icons.check : Icons.add,
                        color: Colors.white,
                        size: 12,
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
      
      // Like Button - Draggable
      _buildDraggableButton(
        buttonId: 'like',
        onTap: () => _handleLike(video),
        child: Column(
          children: [
            Container(
              width: 50,
              height: 50,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: LinearGradient(
                  colors: Provider.of<VideoProvider>(context).isVideoLiked(video.id)
                      ? [Colors.red, Colors.pink]
                      : [const Color(0xFFFF0080), const Color(0xFFFF4081)],
                ),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFFFF0080).withOpacity(0.5),
                    blurRadius: 15,
                    spreadRadius: 2,
                  ),
                ],
              ),
              child: Icon(
                Provider.of<VideoProvider>(context).isVideoLiked(video.id)
                    ? Icons.favorite : Icons.favorite_border,
                color: Colors.white,
                size: 28,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              '${video.likesCount}',
              style: const TextStyle(
                color: Colors.white,
                fontSize: 12,
                fontWeight: FontWeight.bold,
                shadows: [Shadow(blurRadius: 2, color: Colors.black)],
              ),
            ),
          ],
        ),
      ),
      
      // Comment Button - Draggable
      _buildDraggableButton(
        buttonId: 'comment',
        onTap: () => _showComments(video),
        child: Column(
          children: [
            Container(
              width: 50,
              height: 50,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: const LinearGradient(
                  colors: [Color(0xFF00CED1), Color(0xFF1E90FF)],
                ),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF00CED1).withOpacity(0.5),
                    blurRadius: 15,
                    spreadRadius: 2,
                  ),
                ],
              ),
              child: const Icon(
                Icons.chat_bubble_outline,
                color: Colors.white,
                size: 28,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              '${video.commentsCount}',
              style: const TextStyle(
                color: Colors.white,
                fontSize: 12,
                fontWeight: FontWeight.bold,
                shadows: [Shadow(blurRadius: 2, color: Colors.black)],
              ),
            ),
          ],
        ),
      ),
      
      // Share Button - Draggable
      _buildDraggableButton(
        buttonId: 'share',
        onTap: () => _shareVideo(video),
        child: Container(
          width: 50,
          height: 50,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: const LinearGradient(
              colors: [Color(0xFFFF0080), Color(0xFFFF4081)],
            ),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFFFF0080).withOpacity(0.5),
                blurRadius: 15,
                spreadRadius: 2,
              ),
            ],
          ),
          child: const Icon(
            Icons.share,
            color: Colors.white,
            size: 28,
          ),
        ),
      ),
      
      // Save Button - Draggable
      _buildDraggableButton(
        buttonId: 'save',
        onTap: () => _saveVideo(video),
        child: Container(
          width: 50,
          height: 50,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: const LinearGradient(
              colors: [Color(0xFF9370DB), Color(0xFF8B7FDB)],
            ),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF9370DB).withOpacity(0.5),
                blurRadius: 15,
                spreadRadius: 2,
              ),
            ],
          ),
          child: const Icon(
            Icons.bookmark_border,
            color: Colors.white,
            size: 28,
          ),
        ),
      ),
    ];
  }

  Widget _buildEmptyState() {
    String message;
    String submessage;
    IconData icon;
    
    switch (widget.feedType) {
      case FeedType.following:
        icon = Icons.people_outline;
        message = 'No posts from accounts you follow';
        submessage = 'Follow some creators to see their content here';
        break;
      case FeedType.friends:
        icon = Icons.group_outlined;
        message = 'No posts from your VIB3 Circle';
        submessage = 'Connect with creators who follow you back';
        break;
      default:
        icon = Icons.videocam_off;
        message = 'No videos available';
        submessage = 'Check back later for new content';
    }
    
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(
          icon,
          size: 80,
          color: Colors.white.withOpacity(0.3),
        ),
        const SizedBox(height: 16),
        Text(
          message,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          submessage,
          style: TextStyle(
            color: Colors.white.withOpacity(0.7),
            fontSize: 14,
          ),
          textAlign: TextAlign.center,
        ),
        if (widget.feedType == FeedType.following || widget.feedType == FeedType.friends)
          Padding(
            padding: const EdgeInsets.only(top: 24),
            child: ElevatedButton.icon(
              onPressed: () {
                // Navigate to discover/explore
                Navigator.pushNamed(context, '/discover');
              },
              icon: const Icon(Icons.explore),
              label: const Text('Discover Creators'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF00CED1),
                foregroundColor: Colors.black,
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildVideoPlayer(Video video, bool isCurrentVideo, {bool preload = false}) {
    print('🎬 _buildVideoPlayer: videoUrl=${video.videoUrl}, isCurrentVideo=$isCurrentVideo, preload=$preload, _isScreenVisible=$_isScreenVisible');
    
    if (video.videoUrl != null && video.videoUrl!.isNotEmpty && (isCurrentVideo || preload)) {
      print('🎬 Creating VideoPlayerWidget with URL: ${video.videoUrl}, isPlaying: ${isCurrentVideo && _isScreenVisible}');
      return Positioned.fill(
        child: VideoSwipeActions(
          onLike: () => _handleLike(video),
          onShare: () => _shareVideo(video),
          onSave: () => _saveVideo(video),
          onNotInterested: () => _markNotInterested(video),
          onShowMore: () => _showMoreLikeThis(video),
          child: DoubleTapLikeWrapper(
            onDoubleTap: () => _handleLike(video),
            isLiked: Provider.of<VideoProvider>(context).isVideoLiked(video.id),
            child: GestureDetector(
              onLongPress: () => _showComments(video),
              child: VideoPlayerWidget(
                videoUrl: video.videoUrl!,
                isPlaying: isCurrentVideo && _isScreenVisible,
                preload: preload,
              ),
            ),
          ),
        ),
      );
    } else {
      return Positioned.fill(
        child: Container(
          width: double.infinity,
          height: double.infinity,
          color: Colors.grey[900],
          child: const Center(
            child: Icon(Icons.play_circle_outline, size: 80, color: Colors.white),
          ),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    print('🎨 VideoFeed build() called - isVisible=${widget.isVisible}, feedType=${widget.feedType}');
    return ChangeNotifierProvider(
      create: (context) => VideoFeedStateManager(),
      child: Consumer<VideoProvider>(
      builder: (context, videoProvider, child) {
        List<Video> videos = [];
        if (widget.feedType == FeedType.forYou) {
          videos = videoProvider.forYouVideos.isNotEmpty 
              ? videoProvider.forYouVideos 
              : videoProvider.videos;
        } else if (widget.feedType == FeedType.following) {
          // Don't fallback to all videos for following feed
          videos = videoProvider.followingVideos;
        } else if (widget.feedType == FeedType.friends) {
          // Don't fallback to all videos for friends feed
          videos = videoProvider.friendsVideos;
        } else {
          videos = videoProvider.videos;
        }
        
        print('🎨 VideoFeed build: feedType=${widget.feedType}, videos=${videos.length}, isLoading=${videoProvider.isLoading}');
        if (videos.isNotEmpty) {
          print('🎨 First video URL: ${videos[0].videoUrl}');
        }

        if (videoProvider.isLoading && videos.isEmpty) {
          return const Center(
            child: CircularProgressIndicator(
              color: Color(0xFFFF0080),
            ),
          );
        }
        
        // Show error if there is one
        if (videoProvider.error != null && videos.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(
                  Icons.error_outline,
                  size: 64,
                  color: Colors.red,
                ),
                const SizedBox(height: 16),
                Text(
                  'Failed to load videos',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  videoProvider.error!,
                  style: TextStyle(
                    color: Colors.white.withOpacity(0.7),
                    fontSize: 14,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 24),
                ElevatedButton.icon(
                  onPressed: () {
                    // Retry loading
                    final authProvider = Provider.of<AuthProvider>(context, listen: false);
                    final token = authProvider.authToken;
                    if (token != null) {
                      if (widget.feedType == FeedType.forYou) {
                        videoProvider.loadForYouVideos(token);
                      } else if (widget.feedType == FeedType.following) {
                        videoProvider.loadFollowingVideos(token);
                      } else if (widget.feedType == FeedType.friends) {
                        videoProvider.loadFriendsVideos(token);
                      }
                    }
                  },
                  icon: const Icon(Icons.refresh),
                  label: const Text('Retry'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF00CED1),
                    foregroundColor: Colors.black,
                  ),
                ),
              ],
            ),
          );
        }

        if (videos.isEmpty) {
          print('📱 VideoFeed: No videos to display (feedType: ${widget.feedType})');
          return Center(
            child: _buildEmptyState(),
          );
        }
        
        print('📱 VideoFeed: Displaying ${videos.length} videos (feedType: ${widget.feedType})');
        if (videos.isNotEmpty) {
          print('📹 First video URL: ${videos[0].videoUrl}');
        }

        return Stack(
          children: [
            PageView.builder(
              controller: _pageController,
              scrollDirection: Axis.vertical,
              onPageChanged: _onPageChanged,
              pageSnapping: true,
              physics: const PageScrollPhysics(
                parent: ClampingScrollPhysics(),
              ),
              // Allow infinite scrolling by not limiting item count
              itemCount: null,
              itemBuilder: (context, index) {
            // Wrap around to beginning when reaching end
            final videoIndex = videos.isNotEmpty ? index % videos.length : 0;
            if (videos.isEmpty) return Container(color: Colors.black);
            final video = videos[videoIndex];
            final isCurrentVideo = index == _currentIndex;
            final videoProvider = Provider.of<VideoProvider>(context);
            final isLiked = videoProvider.isVideoLiked(video.id);
            
            // Preload next 2 videos for smoother scrolling
            final nextIndex1 = (_currentIndex + 1) % videos.length;
            final nextIndex2 = (_currentIndex + 2) % videos.length;
            final shouldPreload = (videoIndex == nextIndex1 || videoIndex == nextIndex2);
            
            // Always log for first few videos
            if (index < 3 || isCurrentVideo) {
              print('🎥 Building video $index: _currentIndex=$_currentIndex, isCurrentVideo=$isCurrentVideo, _isScreenVisible=$_isScreenVisible, will play=${isCurrentVideo}');
              print('🎥 Video URL: ${video.videoUrl}');
              print('🎥 Video has URL: ${video.videoUrl != null && video.videoUrl!.isNotEmpty}');
            }
            
            return Container(
              color: Colors.black,
              child: Center(
                child: Container(
                  width: kIsWeb ? 600 : MediaQuery.of(context).size.width,
                  height: MediaQuery.of(context).size.height,
                  child: Stack(
                    children: [
                        // Video player
                        _buildVideoPlayer(video, isCurrentVideo, preload: shouldPreload),
                        
                        // Video description overlay
                        Positioned(
                          bottom: 8,
                          left: 0,
                          right: 0,
                          child: Center(
                            child: Container(
                              width: kIsWeb ? 600 : MediaQuery.of(context).size.width * 0.95,
                              constraints: const BoxConstraints(
                                maxHeight: 200,
                              ),
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                              decoration: BoxDecoration(
                                color: Colors.black.withOpacity(0.7),
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(
                                  color: Colors.white.withOpacity(0.2),
                                  width: 1.5,
                                ),
                                boxShadow: [
                                  BoxShadow(
                                    color: const Color(0xFF00CED1).withOpacity(0.5),
                                    blurRadius: 20,
                                    spreadRadius: 3,
                                  ),
                                  BoxShadow(
                                    color: const Color(0xFF1E90FF).withOpacity(0.3),
                                    blurRadius: 25,
                                    spreadRadius: 5,
                                  ),
                                ],
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text(
                                    '@${video.username ?? video.user?['username'] ?? 'unknown'}',
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 14,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    video.description ?? '',
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 12,
                                    ),
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  if (video.hashtags != null && video.hashtags!.isNotEmpty) ...[
                                    const SizedBox(height: 4),
                                    Wrap(
                                      spacing: 4,
                                      runSpacing: 2,
                                      children: video.hashtags!.take(5).map((tag) {
                                        final displayTag = tag.startsWith('#') ? tag : '#$tag';
                                        return Text(
                                          displayTag,
                                          style: const TextStyle(
                                            color: Color(0xFF00CED1),
                                            fontSize: 11,
                                            fontWeight: FontWeight.w500,
                                          ),
                                        );
                                      }).toList(),
                                    ),
                                  ],
                                  if (video.musicName != null && video.musicName!.isNotEmpty) ...[
                                    const SizedBox(height: 4),
                                    Row(
                                      children: [
                                        const Icon(
                                          Icons.music_note,
                                          size: 12,
                                          color: Color(0xFF00CED1),
                                        ),
                                        const SizedBox(width: 4),
                                        Expanded(
                                          child: Text(
                                            video.musicName!,
                                            style: const TextStyle(
                                              color: Colors.white70,
                                              fontSize: 11,
                                              fontStyle: FontStyle.italic,
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
                        ),
                        
                        // Add the better VIB3 themed draggable action buttons
                        if (index == _currentIndex)
                          DraggableActionButtons(
                            video: video,
                            isLiked: Provider.of<VideoProvider>(context).isVideoLiked(video.id),
                            isFollowing: _followingStatus[video.userId] ?? false,
                            onLike: () => _handleLike(video),
                            onComment: () => _showComments(video),
                            onShare: () => _shareVideo(video),
                            onFollow: () async {
                              final authProvider = Provider.of<AuthProvider>(context, listen: false);
                              if (authProvider.currentUser?.id != video.userId) {
                                await _toggleFollow(video.userId);
                              }
                            },
                            onProfile: () => _showCreatorProfile(video),
                          ),
                        
                      ],
                    ),
                  ),
                ),
              );
            },
          ),
        ],
      );
      },
    ),
    );
  }
}