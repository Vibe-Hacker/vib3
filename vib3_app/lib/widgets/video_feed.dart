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
import '../models/video.dart';
import '../models/comment.dart';
import '../services/comment_service.dart';
import '../widgets/grok_ai_assistant.dart';
import '../screens/profile_screen.dart';
import '../config/app_config.dart';
import 'video_player_widget.dart';

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
  Timer? _longPressTimer;
  String? _draggingButton;
  Offset? _initialDragPosition;
  Offset? _dragOffset;

  @override
  void initState() {
    super.initState();
    _pageController = PageController(initialPage: 0);
    WidgetsBinding.instance.addObserver(this);
    _isScreenVisible = widget.isVisible;
    _initButtonPositions();
    _loadButtonPositions();
    
    // Register pause callback with provider
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<VideoProvider>(context, listen: false).registerPauseCallback(() {
        setState(() {
          _isScreenVisible = false;
        });
      });
    });
  }
  
  void _initButtonPositions() {
    final screenWidth = WidgetsBinding.instance.window.physicalSize.width / WidgetsBinding.instance.window.devicePixelRatio;
    // Position buttons with margin from right edge
    const buttonSize = 80.0;
    const rightMargin = 20.0;
    _buttonPositions = {
      'profile': Offset(screenWidth - buttonSize - rightMargin, 200),
      'like': Offset(screenWidth - buttonSize - rightMargin, 280),
      'comment': Offset(screenWidth - buttonSize - rightMargin, 360),
      'share': Offset(screenWidth - buttonSize - rightMargin, 440),
    };
  }

  @override
  void didUpdateWidget(VideoFeed oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.isVisible != widget.isVisible) {
      setState(() {
        _isScreenVisible = widget.isVisible;
      });
      
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
            }
          });
        }
      }
    }
  }

  @override
  void dispose() {
    _longPressTimer?.cancel();
    WidgetsBinding.instance.removeObserver(this);
    _pageController.dispose();
    super.dispose();
  }

  void _onPageChanged(int index) {
    setState(() {
      _currentIndex = index;
    });
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

    // Optimistic UI update
    setState(() {
      _likedVideos[video.id] = !(_likedVideos[video.id] ?? false);
    });

    try {
      // Call the actual API
      final response = await http.post(
        Uri.parse('${AppConfig.baseUrl}/api/videos/${video.id}/like'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode != 200) {
        // Revert on failure
        setState(() {
          _likedVideos[video.id] = !(_likedVideos[video.id] ?? false);
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to like video: ${response.statusCode}')),
        );
      }
    } catch (e) {
      // Revert on error
      setState(() {
        _likedVideos[video.id] = !(_likedVideos[video.id] ?? false);
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    }
  }

  void _showComments(Video video) {
    showModalBottomSheet(
      context: context,
      builder: (context) => Container(
        height: 400,
        color: Colors.black,
        child: Center(
          child: Text('Comments for ${video.description ?? 'this video'}', 
            style: const TextStyle(color: Colors.white)),
        ),
      ),
    );
  }

  void _toggleDragMode() {
    setState(() {
      _isDragMode = !_isDragMode;
    });
  }
  
  void _loadButtonPositions() async {
    final prefs = await SharedPreferences.getInstance();
    final positionsString = prefs.getString('button_positions');
    if (positionsString != null) {
      try {
        final Map<String, dynamic> positions = jsonDecode(positionsString);
        final screenSize = MediaQuery.of(context).size;
        const buttonSize = 80.0;
        const minMargin = 3.0;
        
        setState(() {
          positions.forEach((key, value) {
            final parts = value.split(',');
            if (parts.length == 2) {
              double x = double.parse(parts[0]);
              double y = double.parse(parts[1]);
              
              // Ensure loaded positions are within bounds
              x = x.clamp(minMargin, screenSize.width - buttonSize - minMargin);
              y = y.clamp(minMargin, screenSize.height - buttonSize - minMargin - 80);
              
              _buttonPositions[key] = Offset(x, y);
            }
          });
        });
      } catch (e) {
        print('Error loading button positions: $e');
      }
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

    // Optimistic UI update
    setState(() {
      _followedUsers[video.userId] = !(_followedUsers[video.userId] ?? false);
    });

    try {
      final response = await http.post(
        Uri.parse('${AppConfig.baseUrl}/api/users/${video.userId}/follow'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode != 200) {
        // Revert on failure
        setState(() {
          _followedUsers[video.userId] = !(_followedUsers[video.userId] ?? false);
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to follow user: ${response.statusCode}')),
        );
      }
    } catch (e) {
      // Revert on error
      setState(() {
        _followedUsers[video.userId] = !(_followedUsers[video.userId] ?? false);
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    }
  }
  
  void _shareVideo(Video video) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: 250,
        decoration: const BoxDecoration(
          color: Color(0xFF1A1A1A),
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(20),
            topRight: Radius.circular(20),
          ),
        ),
        child: Column(
          children: [
            Container(
              margin: const EdgeInsets.only(top: 12),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey[600],
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const Padding(
              padding: EdgeInsets.all(16.0),
              child: Text(
                'Share this VIB3',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            Expanded(
              child: GridView.count(
                crossAxisCount: 4,
                padding: const EdgeInsets.all(16),
                mainAxisSpacing: 16,
                crossAxisSpacing: 16,
                children: [
                  _buildShareOption(
                    icon: Icons.link,
                    label: 'Copy Link',
                    onTap: () {
                      // Copy link to clipboard
                      final link = '${AppConfig.baseUrl}/video/${video.id}';
                      Clipboard.setData(ClipboardData(text: link));
                      Navigator.pop(context);
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Link copied to clipboard!')),
                      );
                    },
                  ),
                  _buildShareOption(
                    icon: Icons.message,
                    label: 'Message',
                    onTap: () {
                      Navigator.pop(context);
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Opening messages...')),
                      );
                    },
                  ),
                  _buildShareOption(
                    icon: Icons.email,
                    label: 'Email',
                    onTap: () {
                      Navigator.pop(context);
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Opening email...')),
                      );
                    },
                  ),
                  _buildShareOption(
                    icon: Icons.more_horiz,
                    label: 'More',
                    onTap: () {
                      Navigator.pop(context);
                      // Platform specific share sheet
                    },
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildShareOption({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 50,
            height: 50,
            decoration: BoxDecoration(
              color: Colors.grey[800],
              shape: BoxShape.circle,
            ),
            child: Icon(
              icon,
              color: Colors.white,
              size: 24,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            label,
            style: const TextStyle(
              color: Colors.white70,
              fontSize: 12,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
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
            const minMargin = 3.0;
            
            // Apply boundary constraints
            newX = newX.clamp(minMargin, screenSize.width - buttonSize - minMargin);
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
    
    if (!isCurrentVideo) return [];
    
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
                  (video.user?['username'] ?? 'U')[0].toUpperCase(),
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 20,
                  ),
                ),
              ),
              if (!isOwnVideo)
                Positioned(
                  bottom: 0,
                  right: 0,
                  child: GestureDetector(
                    onTap: () => _handleFollow(video),
                    child: Container(
                      width: 24,
                      height: 24,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: _followedUsers[video.userId] ?? false 
                            ? Colors.blue : Colors.red,
                        border: Border.all(color: Colors.white, width: 2),
                      ),
                      child: Icon(
                        _followedUsers[video.userId] ?? false 
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
                  colors: _likedVideos[video.id] ?? false
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
                _likedVideos[video.id] ?? false 
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
    ];
  }

  Widget _buildVideoPlayer(Video video, bool isCurrentVideo) {
    if (video.videoUrl != null && video.videoUrl!.isNotEmpty && isCurrentVideo) {
      return Positioned.fill(
        child: GestureDetector(
          onDoubleTap: () => _handleLike(video),
          onLongPress: () => _showComments(video),
          child: VideoPlayerWidget(
            videoUrl: video.videoUrl!,
            isPlaying: isCurrentVideo && _isScreenVisible,
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
    return Consumer<VideoProvider>(
      builder: (context, videoProvider, child) {
        List<Video> videos = [];
        if (widget.feedType == FeedType.forYou) {
          videos = videoProvider.forYouVideos.isNotEmpty 
              ? videoProvider.forYouVideos 
              : videoProvider.videos;
        } else if (widget.feedType == FeedType.following) {
          videos = videoProvider.followingVideos.isNotEmpty 
              ? videoProvider.followingVideos 
              : videoProvider.videos;
        } else if (widget.feedType == FeedType.friends) {
          videos = videoProvider.friendsVideos.isNotEmpty 
              ? videoProvider.friendsVideos 
              : videoProvider.videos;
        } else {
          videos = videoProvider.videos;
        }

        if (videoProvider.isLoading && videos.isEmpty) {
          return const Center(
            child: CircularProgressIndicator(
              color: Color(0xFFFF0080),
            ),
          );
        }

        if (videos.isEmpty) {
          return const Center(
            child: Text(
              'No videos available',
              style: TextStyle(color: Colors.white, fontSize: 18),
            ),
          );
        }

        return PageView.builder(
          controller: _pageController,
          scrollDirection: Axis.vertical,
          onPageChanged: _onPageChanged,
          itemCount: videos.length,
          itemBuilder: (context, index) {
            final video = videos[index];
            final isCurrentVideo = index == _currentIndex;
            final isLiked = _likedVideos[video.id] ?? false;
            
            return Container(
              color: Colors.black,
              child: Center(
                child: Container(
                  width: kIsWeb ? 600 : MediaQuery.of(context).size.width,
                  height: MediaQuery.of(context).size.height,
                  child: Stack(
                    children: [
                        // Video player
                        _buildVideoPlayer(video, isCurrentVideo),
                        
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
                                    '@${video.user?['username'] ?? 'unknown'}',
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
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                        
                        // Add floating bubble actions here if needed
                        ..._buildFloatingBubbleActions(context, video, index),
                      ],
                    ),
                  ),
                ),
              );
          },
        );
      },
    );
  }
}