import 'dart:async';
import 'dart:convert';
import 'dart:math';
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
import '../screens/profile_screen.dart';
import '../config/app_config.dart';
import 'video_player_widget.dart';

class VideoFeed extends StatefulWidget {
  final bool isVisible;

  const VideoFeed({super.key, this.isVisible = true});

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
  bool _hasSyncedUserData = false;
  Timer? _syncTimer;
  
  // Draggable button positions
  bool _isDragMode = false;
  Map<String, Offset> _buttonPositions = {
    'profile': const Offset(0, 150),     // Far left edge
    'like': const Offset(0, 250),
    'comment': const Offset(0, 300),
    'share': const Offset(0, 350),
  };
  String? _draggingButton;
  Offset? _initialDragPosition;
  
  // Follow button gap from profile button
  static const double _followButtonGap = 8.0;
  
  // Calculate follow button position based on profile button (centered)
  Offset _getFollowButtonPosition() {
    final profilePos = _buttonPositions['profile'] ?? const Offset(0, 150);
    const profileButtonWidth = 60.0; // Profile button width
    const followButtonWidth = 40.0;  // Follow button is smaller
    
    // Center the follow button under the profile button
    final centeredX = profilePos.dx + (profileButtonWidth - followButtonWidth) / 2;
    
    return Offset(
      centeredX, // Centered X position under profile
      profilePos.dy + 60 + _followButtonGap, // Below profile button (60px button height + gap)
    );
  }
  
  // Snap grid settings
  bool _showSnapGrid = false;
  double _snapGridSize = 40.0; // 40px grid spacing
  double _snapThreshold = 20.0; // How close to snap (20px)
  List<Offset> _snapPoints = [];

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
    WidgetsBinding.instance.addObserver(this);
    _isScreenVisible = widget.isVisible;
    
    // Sync user data when the widget initializes
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _syncUserData();
      // Delay button position loading to avoid context issues
      Future.delayed(const Duration(milliseconds: 500), () {
        if (mounted) {
          _loadButtonPositions();
        }
      });
    });
    
    // Set up periodic sync every 5 minutes
    _syncTimer = Timer.periodic(const Duration(minutes: 5), (_) {
      if (_isAppInForeground && _isScreenVisible && mounted) {
        _syncUserData(force: true);
        // Also periodically sync button positions from server (safely)
        _syncButtonPositionsFromServerSafely();
      }
    });
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _pageController.dispose();
    _syncTimer?.cancel();
    super.dispose();
  }

  @override
  void didUpdateWidget(VideoFeed oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.isVisible != widget.isVisible) {
      setState(() {
        _isScreenVisible = widget.isVisible;
      });
    }
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    setState(() {
      _isAppInForeground = state == AppLifecycleState.resumed;
    });
  }

  // Load button positions from storage and sync from server
  Future<void> _loadButtonPositions() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      
      // Load local positions first (for immediate display)
      final positionsJson = prefs.getString('button_positions');
      if (positionsJson != null) {
        final Map<String, dynamic> positionsMap = jsonDecode(positionsJson);
        if (mounted) {
          setState(() {
            _buttonPositions = positionsMap.map((key, value) => 
              MapEntry(key, Offset(value['dx'], value['dy']))
            );
          });
        }
        print('📍 Loaded local button positions: $_buttonPositions');
      } else {
        print('📍 No saved button positions found, using defaults');
      }
      
      // Schedule server sync for later to avoid blocking UI
      Future.delayed(const Duration(seconds: 2), () {
        if (mounted) {
          _syncButtonPositionsFromServerSafely();
        }
      });
    } catch (e) {
      print('❌ Error loading button positions: $e');
    }
  }

  // Safe server sync that won't block the UI
  Future<void> _syncButtonPositionsFromServerSafely() async {
    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final token = authProvider.authToken;
      final userId = authProvider.currentUser?.id;
      
      if (token != null && userId != null) {
        final prefs = await SharedPreferences.getInstance();
        await _loadButtonPositionsFromServer(token, userId, prefs);
      } else {
        print('📍 No user logged in for server sync');
      }
    } catch (e) {
      print('❌ Error in safe server sync: $e');
      // Fail silently - local positions still work
    }
  }

  // Load button positions from server
  Future<void> _loadButtonPositionsFromServer(String token, String userId, SharedPreferences prefs) async {
    try {
      final response = await http.get(
        Uri.parse('${AppConfig.baseUrl}/api/user/button-positions?userId=$userId'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['buttonPositions'] != null) {
          final Map<String, dynamic> serverPositions = data['buttonPositions'];
          
          // Update local storage with server data
          await prefs.setString('button_positions', jsonEncode(serverPositions));
          
          // Update UI with server positions (only if widget is still mounted)
          if (mounted) {
            setState(() {
              _buttonPositions = serverPositions.map((key, value) => 
                MapEntry(key, Offset(value['dx'], value['dy']))
              );
            });
          }
          
          print('🌐 Loaded button positions from server: $_buttonPositions');
        }
      } else if (response.statusCode == 404) {
        print('📍 No server button positions found for user, using local/defaults');
      } else {
        print('⚠️ Failed to load button positions from server: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ Error loading button positions from server: $e');
      // Continue with local positions if server fails
    }
  }

  // Save button positions to storage and sync to server
  Future<void> _saveButtonPositions() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final positionsMap = _buttonPositions.map((key, offset) => 
        MapEntry(key, {'dx': offset.dx, 'dy': offset.dy})
      );
      
      // Save locally first
      await prefs.setString('button_positions', jsonEncode(positionsMap));
      print('💾 Saved button positions locally: $_buttonPositions');
      
      // Sync to server in background (only if widget is still mounted)
      if (mounted) {
        try {
          final authProvider = Provider.of<AuthProvider>(context, listen: false);
          final token = authProvider.authToken;
          final userId = authProvider.currentUser?.id;
          
          if (token != null && userId != null) {
            _syncButtonPositionsToServer(positionsMap, token, userId);
          }
        } catch (e) {
          print('❌ Error accessing auth provider for sync: $e');
          // Continue - local save still worked
        }
      }
      
      // Haptic feedback to confirm save
      HapticFeedback.selectionClick();
      
      // Optional: Show very brief visual feedback
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('✅ Saved'),
            duration: Duration(milliseconds: 500),
            backgroundColor: Colors.green,
            behavior: SnackBarBehavior.floating,
            margin: EdgeInsets.only(bottom: 100, left: 20, right: 20),
          ),
        );
      }
    } catch (e) {
      print('❌ Error saving button positions: $e');
    }
  }

  // Sync button positions to server
  Future<void> _syncButtonPositionsToServer(Map<String, dynamic> positionsMap, String token, String userId) async {
    try {
      final response = await http.post(
        Uri.parse('${AppConfig.baseUrl}/api/user/button-positions'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'userId': userId,
          'buttonPositions': positionsMap,
        }),
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200 || response.statusCode == 201) {
        print('✅ Button positions synced to server');
      } else {
        print('⚠️ Failed to sync button positions to server: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ Error syncing button positions to server: $e');
      // Don't show error to user - local save still works
    }
  }

  // Generate snap grid points
  void _generateSnapGrid(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;
    final screenHeight = MediaQuery.of(context).size.height;
    
    _snapPoints.clear();
    
    // Generate grid starting from edges and working inward
    for (double x = 0; x <= screenWidth; x += _snapGridSize) {
      for (double y = 0; y <= screenHeight; y += _snapGridSize) {
        _snapPoints.add(Offset(x, y));
      }
    }
    
    // Add edge points for perfect alignment
    for (double y = 0; y <= screenHeight; y += _snapGridSize) {
      _snapPoints.add(Offset(0, y)); // Left edge
      _snapPoints.add(Offset(screenWidth - 60, y)); // Right edge (accounting for button size)
    }
    
    for (double x = 0; x <= screenWidth; x += _snapGridSize) {
      _snapPoints.add(Offset(x, 0)); // Top edge
      _snapPoints.add(Offset(x, screenHeight - 60)); // Bottom edge (accounting for button size)
    }
  }

  // Snap position to nearest grid point
  Offset _snapToGrid(Offset position) {
    if (_snapPoints.isEmpty) return position;
    
    Offset closestPoint = _snapPoints.first;
    double closestDistance = (position - closestPoint).distance;
    
    for (final point in _snapPoints) {
      final distance = (position - point).distance;
      if (distance < closestDistance) {
        closestDistance = distance;
        closestPoint = point;
      }
    }
    
    // Only snap if within threshold
    if (closestDistance <= _snapThreshold) {
      return closestPoint;
    }
    
    return position;
  }

  // Toggle drag mode with enhanced feedback
  void _toggleDragMode() {
    setState(() {
      _isDragMode = !_isDragMode;
      _draggingButton = null;
    });
    
    if (!_isDragMode) {
      // Exiting drag mode
      HapticFeedback.heavyImpact();
      _saveButtonPositions();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Row(
            children: [
              Icon(Icons.check_circle, color: Colors.white),
              SizedBox(width: 8),
              Text('✅ Button positions saved!'),
            ],
          ),
          backgroundColor: Colors.green,
          duration: const Duration(seconds: 2),
          behavior: SnackBarBehavior.floating,
        ),
      );
    } else {
      // Entering drag mode
      HapticFeedback.heavyImpact();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Row(
            children: [
              Icon(Icons.touch_app, color: Colors.white),
              SizedBox(width: 8),
              Expanded(
                child: Text('🎯 Drag mode active! Tap any button to select, then drag to move'),
              ),
            ],
          ),
          backgroundColor: Colors.blue,
          duration: const Duration(seconds: 4),
          behavior: SnackBarBehavior.floating,
          action: SnackBarAction(
            label: 'Done',
            textColor: Colors.white,
            onPressed: () => _toggleDragMode(),
          ),
        ),
      );
    }
  }

  void _onPageChanged(int index) {
    setState(() {
      _currentIndex = index;
    });

    // Sync user data on first page change if not already synced
    if (!_hasSyncedUserData) {
      _syncUserData();
    }

    // Add small delay to prevent rapid resource allocation causing scroll sticking
    Future.delayed(const Duration(milliseconds: 50), () {
      // Load more videos when approaching the end
      final videoProvider = Provider.of<VideoProvider>(context, listen: false);
      final totalVideos = videoProvider.videos.length;
      
      // Trigger loading more videos when we're 5 videos from the end
      if (index >= totalVideos - 5 && 
          videoProvider.hasMoreVideos && 
          !videoProvider.isLoadingMore) {
        final authProvider = Provider.of<AuthProvider>(context, listen: false);
        final token = authProvider.authToken;
        if (token != null) {
          videoProvider.loadMoreVideos(token);
        }
      }
      
      // Check follow status for current video creator (if not already known)
      if (index < videoProvider.videos.length) {
        final currentVideo = videoProvider.videos[index];
        final authProvider = Provider.of<AuthProvider>(context, listen: false);
        final token = authProvider.authToken;
        
        if (token != null) {
          // Check follow status if unknown
          if (currentVideo.userId.isNotEmpty && 
              !_followedUsers.containsKey(currentVideo.userId)) {
            _checkSingleUserFollowStatus(currentVideo.userId, token);
          }
          
          // Check like status if unknown
          if (currentVideo.id.isNotEmpty && 
              !_likedVideos.containsKey(currentVideo.id)) {
            _checkSingleVideoLikeStatus(currentVideo.id, token);
          }
        }
      }
    });
  }

  // Check follow status for a single user
  Future<void> _checkSingleUserFollowStatus(String userId, String token) async {
    try {
      final isFollowing = await VideoService.isFollowingUser(userId, token);
      if (mounted) {
        setState(() {
          _followedUsers[userId] = isFollowing;
        });
      }
      print('✅ Follow status check: User $userId - ${isFollowing ? "Following" : "Not following"}');
    } catch (e) {
      print('❌ Failed to check follow status for user $userId: $e');
    }
  }

  // Sync individual like statuses for visible videos
  Future<void> _syncIndividualLikeStatuses(String token) async {
    try {
      final videoProvider = Provider.of<VideoProvider>(context, listen: false);
      final videos = videoProvider.videos;
      
      print('🔍 Checking like status for ${videos.take(10).length} videos...');
      
      // Check like status for each video (first 10 to avoid too many API calls)
      for (var video in videos.take(10)) {
        try {
          final isLiked = await VideoService.isVideoLiked(video.id, token);
          if (mounted) {
            setState(() {
              _likedVideos[video.id] = isLiked;
            });
          }
          print('❤️ Video ${video.id}: ${isLiked ? "Liked" : "Not liked"}');
        } catch (e) {
          print('❌ Failed to check like status for video ${video.id}: $e');
        }
      }
      
      print('✅ Individual like status sync completed');
    } catch (e) {
      print('❌ Error syncing individual like statuses: $e');
    }
  }

  // Check like status for a single video
  Future<void> _checkSingleVideoLikeStatus(String videoId, String token) async {
    try {
      final isLiked = await VideoService.isVideoLiked(videoId, token);
      if (mounted) {
        setState(() {
          _likedVideos[videoId] = isLiked;
        });
      }
      print('✅ Like status check: Video $videoId - ${isLiked ? "Liked" : "Not liked"}');
    } catch (e) {
      print('❌ Failed to check like status for video $videoId: $e');
    }
  }

  Future<void> _syncUserData({bool force = false}) async {
    // Skip if already synced unless forced
    if (_hasSyncedUserData && !force) return;
    
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final token = authProvider.authToken;
    
    if (token == null) return;
    
    print('🔄 Syncing user data (likes and follows)...');
    
    try {
      // Load user's liked videos
      final likedVideos = await VideoService.getUserLikedVideos(token);
      print('📝 Found ${likedVideos.length} liked videos');
      
      // Load user's followed users
      final followedUsers = await VideoService.getUserFollowedUsers(token);
      print('👥 Found ${followedUsers.length} followed users');
      
      setState(() {
        // Update liked videos map
        _likedVideos.clear();
        for (var video in likedVideos) {
          _likedVideos[video.id] = true;
        }
        
        // Update followed users map
        _followedUsers.clear();
        for (var userId in followedUsers) {
          _followedUsers[userId] = true;
        }
        
        _hasSyncedUserData = true;
      });
      
      // If no followed users found via bulk API, check individual statuses for visible videos
      if (followedUsers.isEmpty) {
        print('🔍 No followed users from bulk API, checking individual follow statuses...');
        await _syncIndividualFollowStatuses(token);
      }
      
      // If no liked videos found via bulk API, check individual like statuses for visible videos
      if (likedVideos.isEmpty) {
        print('🔍 No liked videos from bulk API, checking individual like statuses...');
        await _syncIndividualLikeStatuses(token);
      }
      
      print('✅ User data sync completed');
      
    } catch (e) {
      print('❌ Failed to sync user data: $e');
      // Don't show error to user, just log it
    }
  }

  // Sync individual follow statuses for visible videos
  Future<void> _syncIndividualFollowStatuses(String token) async {
    try {
      final videoProvider = Provider.of<VideoProvider>(context, listen: false);
      final videos = videoProvider.videos;
      
      // Get unique user IDs from visible videos
      final Set<String> userIds = {};
      for (var video in videos.take(10)) { // Check first 10 videos to avoid too many API calls
        if (video.userId.isNotEmpty) {
          userIds.add(video.userId);
        }
      }
      
      print('🔍 Checking follow status for ${userIds.length} users...');
      
      // Check follow status for each user
      for (var userId in userIds) {
        try {
          final isFollowing = await VideoService.isFollowingUser(userId, token);
          if (mounted) {
            setState(() {
              _followedUsers[userId] = isFollowing;
            });
          }
          print('👤 User $userId: ${isFollowing ? "Following" : "Not following"}');
        } catch (e) {
          print('❌ Failed to check follow status for user $userId: $e');
        }
      }
      
      print('✅ Individual follow status sync completed');
    } catch (e) {
      print('❌ Error syncing individual follow statuses: $e');
    }
  }

  Future<void> _handleLike(Video video) async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final token = authProvider.authToken;
    
    if (token == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('❌ Please login to like videos'), backgroundColor: Colors.red),
      );
      return;
    }

    final wasLiked = _likedVideos[video.id] ?? false;
    
    // Optimistically update UI
    setState(() {
      _likedVideos[video.id] = !wasLiked;
    });

    // Call the toggle endpoint (server handles like/unlike automatically)
    final success = await VideoService.likeVideo(video.id, token);
    
    if (!success) {
      // Revert on failure
      setState(() {
        _likedVideos[video.id] = wasLiked;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('❌ Failed to update like'), backgroundColor: Colors.red),
      );
    } else {
      // Sync after successful toggle to get updated counts and confirm state
      Future.delayed(const Duration(seconds: 1), () {
        _syncUserData(force: true);
      });
    }
  }

  Future<void> _handleFollow(Video video) async {
    // Show immediate feedback
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Follow button tapped for user: ${video.userId}')),
    );
    
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final token = authProvider.authToken;
    
    if (token == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('❌ No auth token - please login'), backgroundColor: Colors.red),
      );
      return;
    }

    final isFollowed = _followedUsers[video.userId] ?? false;
    
    setState(() {
      _followedUsers[video.userId] = !isFollowed;
    });

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('📡 Making API call to ${isFollowed ? "unfollow" : "follow"} user...')),
    );

    final success = isFollowed
        ? await VideoService.unfollowUser(video.userId, token)
        : await VideoService.followUser(video.userId, token);

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('✅ Follow API result: ${success ? "Success" : "Failed"}'),
        backgroundColor: success ? Colors.green : Colors.red,
      ),
    );

    if (!success) {
      setState(() {
        _followedUsers[video.userId] = isFollowed;
      });
    } else {
      // Sync after successful follow/unfollow to keep data fresh
      Future.delayed(const Duration(seconds: 1), () {
        _syncUserData(force: true);
      });
    }
  }

  void _showComments(Video video) {
    // Show immediate feedback
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Comment button tapped for video: ${video.id}')),
    );
    
    try {
      showModalBottomSheet(
        context: context,
        isScrollControlled: true,
        backgroundColor: Colors.transparent,
        builder: (context) => CommentsSheet(video: video),
      ).then((result) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('✅ Comments modal opened successfully'), backgroundColor: Colors.green),
        );
      }).catchError((error) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('❌ Comments modal error: $error'), backgroundColor: Colors.red),
        );
      });
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('❌ Error opening comments: $e'), backgroundColor: Colors.red),
      );
    }
  }

  void _showCreatorProfile(Video video) {
    // Show immediate feedback
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Opening @${video.user?['username'] ?? 'Unknown'} profile...')),
    );
    
    // Navigate to creator's profile
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ProfileScreen(userId: video.userId),
      ),
    );
  }

  void _shareVideo(Video video) {
    // Show immediate feedback
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Share button tapped for video: ${video.id}')),
    );
    
    try {
      showModalBottomSheet(
        context: context,
        backgroundColor: const Color(0xFF1A1A1A),
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
        ),
        builder: (context) => ShareSheet(video: video),
      ).then((result) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('✅ Share modal opened successfully'), backgroundColor: Colors.green),
        );
      }).catchError((error) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('❌ Share modal error: $error'), backgroundColor: Colors.red),
        );
      });
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('❌ Error opening share: $e'), backgroundColor: Colors.red),
      );
    }
  }

  List<Widget> _buildFloatingBubbleActions(BuildContext context, Video video, int index) {
    const bubbleOffset = 60.0;
    final isCurrentVideo = index == _currentIndex;
    
    // Get current user ID to hide follow button on own videos
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final currentUserId = authProvider.currentUser?.id;
    final isOwnVideo = currentUserId != null && currentUserId == video.userId;
    
    // Create draggable floating button helper with enhanced UX
    Widget _buildDraggableButton({
      required String buttonId,
      required Widget child,
      VoidCallback? onTap,
    }) {
      final position = _buttonPositions[buttonId] ?? const Offset(0, 250);
      final isBeingDragged = _isDragMode && _draggingButton == buttonId;
      
      return Positioned(
        left: position.dx,
        top: position.dy,
        child: TweenAnimationBuilder<double>(
          duration: Duration(seconds: 3 + (buttonId.hashCode % 2)), // Varied animation speeds
          tween: Tween(begin: 0.0, end: 1.0),
          builder: (context, animationValue, child) {
            return Transform.translate(
              offset: Offset(
                // Gentle horizontal floating
                !isBeingDragged ? (sin(animationValue * 2 * pi) * 3) : 0,
                // Gentle vertical floating with different phases per button
                !isBeingDragged ? (cos(animationValue * 2 * pi + (buttonId.hashCode % 4)) * 2) : 0,
              ),
              child: Transform.scale(
                scale: !isBeingDragged ? (1.0 + sin(animationValue * 2 * pi) * 0.02) : 1.0, // Subtle pulse
                child: child,
              ),
            );
          },
          child: GestureDetector(
            // Immediate drag activation with long press
            onLongPressStart: (details) {
              // Immediate haptic feedback when long press starts
              HapticFeedback.mediumImpact();
              
              if (!_isDragMode) {
                _toggleDragMode();
              }
              setState(() {
                _draggingButton = buttonId;
                _initialDragPosition = _buttonPositions[buttonId] ?? const Offset(0, 250);
              });
              
              // Second haptic to confirm drag mode
              Future.delayed(const Duration(milliseconds: 100), () {
                HapticFeedback.heavyImpact();
              });
            },
            
            // Allow immediate dragging during long press
            onLongPressMoveUpdate: (details) {
              if (_draggingButton == buttonId && _initialDragPosition != null) {
                setState(() {
                  // Calculate new position from initial position + offset
                  final newPosition = Offset(
                    _initialDragPosition!.dx + details.offsetFromOrigin.dx,
                    _initialDragPosition!.dy + details.offsetFromOrigin.dy,
                  );
                  
                  // Keep buttons within screen bounds
                  final screenWidth = MediaQuery.of(context).size.width;
                  final screenHeight = MediaQuery.of(context).size.height;
                  
                  _buttonPositions[buttonId] = Offset(
                    newPosition.dx.clamp(0, screenWidth - 60), // 60 = button width
                    newPosition.dy.clamp(0, screenHeight - 60), // 60 = button height
                  );
                });
              }
            },
            
            onLongPressEnd: (details) {
              // Haptic feedback when long press drag ends
              HapticFeedback.mediumImpact();
              setState(() {
                _draggingButton = null;
                _initialDragPosition = null;
                // Auto-exit drag mode after successful drag
                _isDragMode = false;
              });
              // Save button positions after dragging
              _saveButtonPositions();
            },
            
            // Also allow tap to enter drag mode if already in drag mode
            onTap: () {
              if (_isDragMode) {
                if (_draggingButton != buttonId) {
                  HapticFeedback.selectionClick();
                  setState(() {
                    _draggingButton = buttonId;
                  });
                }
              } else if (onTap != null) {
                onTap();
              }
            },
            
            // Enhanced drag with haptic feedback for manual pan gestures
            onPanStart: _isDragMode ? (details) {
              HapticFeedback.lightImpact();
              setState(() {
                _draggingButton = buttonId;
              });
            } : null,
            
            onPanUpdate: _isDragMode && _draggingButton == buttonId ? (details) {
              setState(() {
                final newPosition = Offset(
                  (_buttonPositions[buttonId]?.dx ?? 0) + details.delta.dx,
                  (_buttonPositions[buttonId]?.dy ?? 0) + details.delta.dy,
                );
                
                // Keep buttons within screen bounds
                final screenWidth = MediaQuery.of(context).size.width;
                final screenHeight = MediaQuery.of(context).size.height;
                
                _buttonPositions[buttonId] = Offset(
                  newPosition.dx.clamp(0, screenWidth - 60), // 60 = button width
                  newPosition.dy.clamp(0, screenHeight - 60), // 60 = button height
                );
              });
            } : null,
            
            onPanEnd: _isDragMode && _draggingButton == buttonId ? (details) {
              // Haptic feedback when drag ends
              HapticFeedback.mediumImpact();
              setState(() {
                _draggingButton = null;
              });
              // Save button positions after dragging
              _saveButtonPositions();
            } : null,
            
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              transform: isBeingDragged 
                  ? (Matrix4.identity()..scale(1.1)) // Scale up when dragging
                  : Matrix4.identity(),
              decoration: BoxDecoration(
                // Enhanced visual feedback
                border: isBeingDragged
                    ? Border.all(color: Colors.cyan, width: 3)
                    : _isDragMode
                        ? Border.all(color: Colors.yellow.withOpacity(0.5), width: 2)
                        : null,
                borderRadius: BorderRadius.circular(30),
                boxShadow: isBeingDragged
                    ? [
                        BoxShadow(
                          color: Colors.cyan.withOpacity(0.5),
                          blurRadius: 15,
                          spreadRadius: 3,
                        )
                      ]
                    : null,
              ),
              child: child,
            ),
          ),
        ),
      );
    }
    
    final List<Widget> buttons = [
      // Profile Button - Draggable
      _buildDraggableButton(
        buttonId: 'profile',
        onTap: () => _showCreatorProfile(video),
        child: Consumer<ThemeProvider>(
          builder: (context, themeProvider, _) => _FloatingBubble(
            icon: Icons.person,
            count: null,
            onTap: () => _showCreatorProfile(video),
            gradientColors: themeProvider.getProfileGradient(),
            shouldAnimate: !_isDragMode && isCurrentVideo && _isAppInForeground && _isScreenVisible,
            customChild: Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(8),
                color: Colors.black,
              ),
              child: Center(
                child: Text(
                  (video.user?['username'] ?? 'U')[0].toUpperCase(),
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                    shadows: [
                      Shadow(
                        color: Colors.black,
                        blurRadius: 4,
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    ];

    // Add follow button conditionally (only if not user's own video)
    if (!isOwnVideo) {
      buttons.add(
        Positioned(
          left: _getFollowButtonPosition().dx,
          top: _getFollowButtonPosition().dy,
          child: TweenAnimationBuilder<double>(
            duration: Duration(seconds: 3 + ('follow'.hashCode % 2)),
            tween: Tween(begin: 0.0, end: 1.0),
            builder: (context, animationValue, child) {
              final isBeingDragged = _isDragMode && _draggingButton == 'profile';
              return Transform.translate(
                offset: Offset(
                  !isBeingDragged ? (sin(animationValue * 2 * pi) * 3) : 0,
                  !isBeingDragged ? (cos(animationValue * 2 * pi + ('follow'.hashCode % 4)) * 2) : 0,
                ),
                child: Transform.scale(
                  scale: !isBeingDragged ? (1.0 + sin(animationValue * 2 * pi) * 0.02) : 1.0,
                  child: child,
                ),
              );
            },
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              transform: (_isDragMode && _draggingButton == 'profile') 
                  ? (Matrix4.identity()..scale(1.1))
                  : Matrix4.identity(),
              decoration: BoxDecoration(
                border: (_isDragMode && _draggingButton == 'profile')
                    ? Border.all(color: Colors.cyan.withOpacity(0.5), width: 2)
                    : null,
                borderRadius: BorderRadius.circular(30),
              ),
              child: _VIB3FollowButton(
                video: video,
                isFollowed: _followedUsers[video.userId] ?? false,
                onTap: () => _handleFollow(video),
                shouldAnimate: !_isDragMode && isCurrentVideo && _isAppInForeground && _isScreenVisible,
              ),
            ),
          ),
        ),
      );
    }

    buttons.addAll([
      
      // Like Button - Draggable
      _buildDraggableButton(
        buttonId: 'like',
        onTap: () => _handleLike(video),
        child: Consumer<ThemeProvider>(
          builder: (context, themeProvider, _) => _FloatingBubble(
            icon: Icons.favorite_border,
            activeIcon: Icons.favorite,
            count: video.likesCount,
            isActive: _likedVideos[video.id] ?? false,
            onTap: () => _handleLike(video),
            gradientColors: themeProvider.getLikeGradient(),
            shouldAnimate: !_isDragMode && isCurrentVideo && _isAppInForeground && _isScreenVisible,
          ),
        ),
      ),
      
      // Comment Button - Draggable
      _buildDraggableButton(
        buttonId: 'comment',
        onTap: () => _showComments(video),
        child: Consumer<ThemeProvider>(
          builder: (context, themeProvider, _) => _FloatingBubble(
            icon: Icons.chat_bubble_outline,
            activeIcon: Icons.chat_bubble,
            count: video.commentsCount,
            onTap: () => _showComments(video),
            gradientColors: themeProvider.getCommentGradient(),
            shouldAnimate: !_isDragMode && isCurrentVideo && _isAppInForeground && _isScreenVisible,
          ),
        ),
      ),
      
      // Share Button - Draggable
      _buildDraggableButton(
        buttonId: 'share',
        onTap: () => _shareVideo(video),
        child: Consumer<ThemeProvider>(
          builder: (context, themeProvider, _) => _FloatingBubble(
            icon: Icons.share,
            activeIcon: Icons.share,
            count: video.sharesCount,
            onTap: () => _shareVideo(video),
            gradientColors: themeProvider.getShareGradient(),
            shouldAnimate: !_isDragMode && isCurrentVideo && _isAppInForeground && _isScreenVisible,
          ),
        ),
      ),
    ]);
    
    return buttons;
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<VideoProvider>(
      builder: (context, videoProvider, child) {
        if (videoProvider.isLoading) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const CircularProgressIndicator(
                  color: Color(0xFFFF0080),
                ),
                const SizedBox(height: 16),
                Text(
                  'Loading videos...\n${videoProvider.debugInfo}',
                  style: const TextStyle(color: Colors.white),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          );
        }

        if (videoProvider.error != null) {
          return Center(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error, color: Colors.red, size: 48),
                  const SizedBox(height: 16),
                  const Text(
                    'Failed to load videos',
                    style: TextStyle(color: Colors.white, fontSize: 18),
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () {
                      final authProvider = Provider.of<AuthProvider>(context, listen: false);
                      final token = authProvider.authToken;
                      if (token != null) {
                        Provider.of<VideoProvider>(context, listen: false).loadAllVideos(token);
                      }
                    },
                    child: const Text('Retry'),
                  ),
                ],
              ),
            ),
          );
        }

        // Remove the empty videos check - let the PageView handle everything

        // Show actual video content with unique card-style layout
        return PageView.builder(
          controller: _pageController,
          scrollDirection: Axis.vertical,
          onPageChanged: _onPageChanged,
          itemCount: videoProvider.videos.length + (videoProvider.hasMoreVideos ? 1 : 0),
          allowImplicitScrolling: true,
          itemBuilder: (context, index) {
            // Show loading indicator if we're at the end and loading more
            if (index >= videoProvider.videos.length) {
              return Container(
                color: Colors.black,
                child: const Center(
                  child: CircularProgressIndicator(
                    color: Color(0xFFFF0080),
                  ),
                ),
              );
            }

            final video = videoProvider.videos[index];
            final isCurrentVideo = index == _currentIndex;
            // Enable preloading for next/previous videos to reduce lag
            final shouldPreload = (index == _currentIndex + 1) || (index == _currentIndex - 1);
            
            print('📹 VideoFeed: Creating video $index, URL: ${video.videoUrl}, isPlaying: $isCurrentVideo');
            
            return Container(
              color: Colors.black,
              padding: const EdgeInsets.all(2), // Minimal padding for copyright safety
              child: Container(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.5),
                      blurRadius: 10,
                      spreadRadius: 1,
                    ),
                  ],
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(20),
                  child: Stack(
                    children: [
                      // Video player - positioned to slide to top with space at bottom for title
                      if (video.videoUrl != null && video.videoUrl!.isNotEmpty && isCurrentVideo)
                        Positioned(
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 120, // Leave space at bottom for title box
                          child: GestureDetector(
                            onDoubleTap: () => _handleLike(video),
                            onLongPress: () => _showComments(video),
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(20),
                              child: VideoPlayerWidget(
                                videoUrl: video.videoUrl!,
                                isPlaying: _isAppInForeground && _isScreenVisible,
                              ),
                            ),
                          ),
                        )
                      else
                        Positioned(
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 120, // Leave space at bottom for title box
                          child: GestureDetector(
                            onDoubleTap: () => _handleLike(video),
                            onLongPress: () => _showComments(video),
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(20),
                              child: Container(
                                color: Colors.grey[900],
                                child: const Center(
                                  child: Icon(Icons.play_circle_outline, size: 80, color: Colors.white),
                                ),
                              ),
                            ),
                          ),
                        ),
                      
                      // Video description overlay (full width, wraps text and expands up)
                      Positioned(
                        bottom: 60,
                        left: 0,
                        right: 0,
                        child: Container(
                          constraints: const BoxConstraints(
                            maxHeight: 200, // Maximum height it can expand to
                          ),
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          decoration: BoxDecoration(
                            // Dark bubble background
                            color: Colors.black.withOpacity(0.7),
                            borderRadius: BorderRadius.circular(20),
                            // Border for definition
                            border: Border.all(
                              color: Colors.white.withOpacity(0.2),
                              width: 1.5,
                            ),
                            // Cyan/blue gradient glow effect
                            boxShadow: [
                              // Primary cyan glow
                              BoxShadow(
                                color: const Color(0xFF00CED1).withOpacity(0.5),
                                blurRadius: 20,
                                spreadRadius: 3,
                              ),
                              // Secondary blue glow
                              BoxShadow(
                                color: const Color(0xFF1E90FF).withOpacity(0.3),
                                blurRadius: 25,
                                spreadRadius: 5,
                              ),
                              // Subtle white glow for brightness
                              BoxShadow(
                                color: Colors.white.withOpacity(0.1),
                                blurRadius: 12,
                                spreadRadius: 1,
                              ),
                              // Inner shadow for depth
                              BoxShadow(
                                color: Colors.black.withOpacity(0.9),
                                blurRadius: 8,
                                spreadRadius: 1,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              // Creator username
                              Text(
                                '@${video.user?['username'] ?? 'unknown'}',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                  shadows: [
                                    Shadow(
                                      color: Colors.black,
                                      blurRadius: 2,
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(height: 4),
                              // Video description with gradient - wraps and expands
                              ShaderMask(
                                shaderCallback: (bounds) => const LinearGradient(
                                  colors: [
                                    Color(0xFF00CED1), // Cyan
                                    Color(0xFF1E90FF), // Blue
                                  ],
                                  begin: Alignment.topLeft,
                                  end: Alignment.bottomRight,
                                ).createShader(bounds),
                                child: Text(
                                  video.description ?? 'No description',
                                  style: const TextStyle(
                                    color: Colors.white, // This will be masked by gradient
                                    fontSize: 10,
                                    fontWeight: FontWeight.w500,
                                    shadows: [
                                      Shadow(
                                        color: Colors.black,
                                        blurRadius: 2,
                                      ),
                                    ],
                                  ),
                                  // Removed maxLines and overflow to allow wrapping
                                  // Text will now wrap to new lines as needed
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                  
                  // Debug info button (top left, smaller)
                  Positioned(
                    top: 60,
                    left: 16,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.6),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: const Color(0xFF00CED1).withOpacity(0.3),
                          width: 0.5,
                        ),
                      ),
                      child: Text(
                        '${index + 1}/${videoProvider.videos.length}',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 9,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ),
                  
                      // Gesture detection overlay for unique interactions (exclude button area)
                      // Removed to allow tap through to VideoPlayerWidget for pause/resume
                      
                      // Floating Bubble Actions (unique diagonal layout) - AFTER gesture overlay
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

class _FloatingBubble extends StatefulWidget {
  final IconData icon;
  final IconData? activeIcon;
  final int? count;
  final bool isActive;
  final VoidCallback onTap;
  final List<Color> gradientColors;
  final bool shouldAnimate;
  final Widget? customChild; // For custom content like profile avatar

  const _FloatingBubble({
    required this.icon,
    this.activeIcon,
    this.count,
    this.isActive = false,
    required this.onTap,
    required this.gradientColors,
    this.shouldAnimate = true,
    this.customChild,
  });

  @override
  State<_FloatingBubble> createState() => _FloatingBubbleState();
}

class _FloatingBubbleState extends State<_FloatingBubble>
    with TickerProviderStateMixin {
  late AnimationController _pulseController;
  late AnimationController _floatController;
  late Animation<double> _pulseAnimation;
  late Animation<double> _floatAnimation;

  @override
  void initState() {
    super.initState();
    
    _pulseController = AnimationController(
      duration: const Duration(seconds: 2),
      vsync: this,
    );
    
    _floatController = AnimationController(
      duration: const Duration(seconds: 3),
      vsync: this,
    );
    
    _pulseAnimation = Tween<double>(
      begin: 1.0,
      end: 1.2,
    ).animate(CurvedAnimation(
      parent: _pulseController,
      curve: Curves.easeInOut,
    ));
    
    _floatAnimation = Tween<double>(
      begin: -5.0,
      end: 5.0,
    ).animate(CurvedAnimation(
      parent: _floatController,
      curve: Curves.easeInOut,
    ));
    
    // Start animations conditionally
    if (widget.shouldAnimate) {
      _pulseController.repeat(reverse: true);
      _floatController.repeat(reverse: true);
    }
  }

  @override
  void didUpdateWidget(_FloatingBubble oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.shouldAnimate != widget.shouldAnimate) {
      if (widget.shouldAnimate) {
        _pulseController.repeat(reverse: true);
        _floatController.repeat(reverse: true);
      } else {
        _pulseController.stop();
        _floatController.stop();
        _pulseController.reset();
        _floatController.reset();
      }
    }
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _floatController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: Listenable.merge([_pulseAnimation, _floatAnimation]),
      builder: (context, child) {
        return Transform.translate(
          offset: Offset(0, _floatAnimation.value),
          child: Transform.scale(
            scale: widget.isActive ? _pulseAnimation.value : 1.0,
            child: GestureDetector(
              onTap: () {
                print('FloatingBubble: Tap detected!');
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('🎯 Button tap detected!')),
                );
                widget.onTap();
              },
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: widget.gradientColors,
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: widget.gradientColors.first.withOpacity(0.4),
                      blurRadius: 15,
                      spreadRadius: 3,
                    ),
                    BoxShadow(
                      color: widget.gradientColors.last.withOpacity(0.4),
                      blurRadius: 15,
                      spreadRadius: 3,
                      offset: const Offset(3, 3),
                    ),
                  ],
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Use custom child if provided, otherwise use icon
                    widget.customChild ?? Icon(
                      widget.isActive && widget.activeIcon != null 
                        ? widget.activeIcon! 
                        : widget.icon,
                      color: Colors.white,
                      size: 24,
                      shadows: const [
                        Shadow(
                          color: Colors.black,
                          blurRadius: 4,
                        ),
                      ],
                    ),
                    if (widget.count != null) ...[
                      const SizedBox(height: 4),
                      ShaderMask(
                        shaderCallback: (bounds) => const LinearGradient(
                          colors: [Colors.white, Colors.black],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ).createShader(bounds),
                        child: Text(
                          _formatCount(widget.count!),
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            shadows: [
                              Shadow(
                                color: Colors.black,
                                blurRadius: 4,
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ),
        );
      },
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

class CommentsSheet extends StatefulWidget {
  final Video video;

  const CommentsSheet({super.key, required this.video});

  @override
  State<CommentsSheet> createState() => _CommentsSheetState();
}

class _CommentsSheetState extends State<CommentsSheet> {
  final TextEditingController _commentController = TextEditingController();
  final List<Map<String, dynamic>> _comments = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadComments();
  }

  Future<void> _loadComments() async {
    // Simulate loading comments - replace with actual API call
    await Future.delayed(const Duration(milliseconds: 500));
    setState(() {
      _comments.addAll([
        {
          'id': '1',
          'username': 'user123',
          'text': 'Amazing video! 🔥',
          'timestamp': DateTime.now().subtract(const Duration(hours: 2)),
          'likes': 12,
        },
        {
          'id': '2',
          'username': 'cooluser',
          'text': 'Love this content',
          'timestamp': DateTime.now().subtract(const Duration(minutes: 30)),
          'likes': 5,
        },
      ]);
      _isLoading = false;
    });
  }

  Future<void> _postComment() async {
    if (_commentController.text.trim().isEmpty) return;
    
    final newComment = {
      'id': DateTime.now().millisecondsSinceEpoch.toString(),
      'username': 'You',
      'text': _commentController.text.trim(),
      'timestamp': DateTime.now(),
      'likes': 0,
    };
    
    setState(() {
      _comments.insert(0, newComment);
      _commentController.clear();
    });
  }

  @override
  Widget build(BuildContext context) {
    final keyboardHeight = MediaQuery.of(context).viewInsets.bottom;
    final screenHeight = MediaQuery.of(context).size.height;
    final safeAreaTop = MediaQuery.of(context).padding.top;
    
    return Container(
      height: screenHeight - safeAreaTop - 50, // Full screen minus status bar and small top margin
      decoration: const BoxDecoration(
        color: Color(0xFF1A1A1A),
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      child: Padding(
        padding: EdgeInsets.only(bottom: keyboardHeight),
        child: Column(
        children: [
          // Handle bar
          Container(
            width: 40,
            height: 4,
            margin: const EdgeInsets.symmetric(vertical: 12),
            decoration: BoxDecoration(
              color: Colors.grey[600],
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          // Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '${_comments.length} comments',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(Icons.close, color: Colors.white),
                ),
              ],
            ),
          ),
          const Divider(color: Colors.grey),
          // Comments list
          Expanded(
            child: _isLoading
                ? const Center(
                    child: CircularProgressIndicator(color: Color(0xFFFF0080)),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: _comments.length,
                    itemBuilder: (context, index) {
                      final comment = _comments[index];
                      return Padding(
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            CircleAvatar(
                              radius: 16,
                              backgroundColor: const Color(0xFFFF0080),
                              child: Text(
                                comment['username'][0].toUpperCase(),
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Text(
                                        comment['username'],
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      Text(
                                        _formatTime(comment['timestamp']),
                                        style: TextStyle(
                                          color: Colors.grey[400],
                                          fontSize: 12,
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    comment['text'],
                                    style: const TextStyle(color: Colors.white),
                                  ),
                                  const SizedBox(height: 8),
                                  Row(
                                    children: [
                                      GestureDetector(
                                        onTap: () {},
                                        child: Row(
                                          children: [
                                            const Icon(
                                              Icons.favorite_border,
                                              color: Colors.grey,
                                              size: 16,
                                            ),
                                            const SizedBox(width: 4),
                                            Text(
                                              comment['likes'].toString(),
                                              style: TextStyle(
                                                color: Colors.grey[400],
                                                fontSize: 12,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                      const SizedBox(width: 16),
                                      GestureDetector(
                                        onTap: () {},
                                        child: Text(
                                          'Reply',
                                          style: TextStyle(
                                            color: Colors.grey[400],
                                            fontSize: 12,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
          ),
          // Comment input
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.grey[900],
              border: Border(top: BorderSide(color: Colors.grey[700]!)),
            ),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _commentController,
                    style: const TextStyle(color: Colors.white),
                    decoration: InputDecoration(
                      hintText: 'Add a comment...',
                      hintStyle: TextStyle(color: Colors.grey[500]),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(20),
                        borderSide: BorderSide.none,
                      ),
                      filled: true,
                      fillColor: Colors.grey[800],
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 8,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                GestureDetector(
                  onTap: _postComment,
                  child: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: const BoxDecoration(
                      color: Color(0xFFFF0080),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.send,
                      color: Colors.white,
                      size: 20,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
        ),
      ),
    );
  }

  String _formatTime(DateTime timestamp) {
    final now = DateTime.now();
    final difference = now.difference(timestamp);
    
    if (difference.inMinutes < 1) {
      return 'now';
    } else if (difference.inHours < 1) {
      return '${difference.inMinutes}m';
    } else if (difference.inDays < 1) {
      return '${difference.inHours}h';
    } else {
      return '${difference.inDays}d';
    }
  }

  @override
  void dispose() {
    _commentController.dispose();
    super.dispose();
  }
}

class ShareSheet extends StatelessWidget {
  final Video video;

  const ShareSheet({super.key, required this.video});

  // SECURITY: Generate secure sharing links that contain NO authentication data
  void _copySecureVideoLink(BuildContext context, Video video) {
    try {
      // Create secure sharing URL with ONLY public video ID
      // NEVER include user tokens, auth data, or sensitive information
      final secureUrl = 'https://vib3.com/video/${video.id}';
      
      // TODO: Copy to clipboard using flutter/services
      // Clipboard.setData(ClipboardData(text: secureUrl));
      
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Secure link copied: $secureUrl'),
          backgroundColor: const Color(0xFFFF0080),
          duration: const Duration(seconds: 3),
        ),
      );
      
      print('SECURITY: Generated secure share link - $secureUrl (no auth data)');
    } catch (e) {
      print('Error generating secure share link: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Failed to copy link'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final screenHeight = MediaQuery.of(context).size.height;
    final keyboardHeight = MediaQuery.of(context).viewInsets.bottom;
    
    return Container(
      height: screenHeight * 0.75, // 3/4 screen height
      decoration: const BoxDecoration(
        color: Color(0xFF1A1A1A),
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Padding(
        padding: EdgeInsets.only(
          left: 16,
          right: 16,
          top: 16,
          bottom: 16 + keyboardHeight,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Handle bar
            Container(
              width: 40,
              height: 4,
              margin: const EdgeInsets.only(bottom: 20),
              decoration: BoxDecoration(
                color: Colors.grey[600],
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            
            // Header with close button
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Share Video',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(Icons.close, color: Colors.white),
                ),
              ],
            ),
            
            const SizedBox(height: 30),
            
            // Share options - More spacing and bigger
            Expanded(
              child: GridView.count(
                crossAxisCount: 3, // 3 columns instead of 4 for bigger buttons
                mainAxisSpacing: 24,
                crossAxisSpacing: 24,
                childAspectRatio: 1.0,
                children: [
                  _ShareOption(
                    icon: Icons.copy,
                    label: 'Copy Link',
                    onTap: () => _copySecureVideoLink(context, video),
                  ),
                  _ShareOption(
                    icon: Icons.message,
                    label: 'Messages',
                    onTap: () {
                      Navigator.pop(context);
                    },
                  ),
                  _ShareOption(
                    icon: Icons.share,
                    label: 'More Options',
                    onTap: () {
                      Navigator.pop(context);
                    },
                  ),
                  _ShareOption(
                    icon: Icons.download,
                    label: 'Save Video',
                    onTap: () {
                      Navigator.pop(context);
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Video saved to gallery'),
                          backgroundColor: Color(0xFFFF0080),
                        ),
                      );
                    },
                  ),
                  _ShareOption(
                    icon: Icons.link,
                    label: 'Share Link',
                    onTap: () => _copySecureVideoLink(context, video),
                  ),
                  _ShareOption(
                    icon: Icons.qr_code,
                    label: 'QR Code',
                    onTap: () {
                      Navigator.pop(context);
                    },
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }
}

class _ShareOption extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _ShareOption({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 70,
            height: 70,
            decoration: BoxDecoration(
              color: Colors.grey[800],
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.3),
                  blurRadius: 8,
                  spreadRadius: 2,
                ),
              ],
            ),
            child: Icon(
              icon,
              color: Colors.white,
              size: 30,
            ),
          ),
          const SizedBox(height: 12),
          Flexible(
            child: Text(
              label,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 13,
                fontWeight: FontWeight.w500,
              ),
              textAlign: TextAlign.center,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}

class _CreatorProfileBubble extends StatefulWidget {
  final Video video;
  final bool isFollowed;
  final VoidCallback onTap;
  final VoidCallback onFollow;
  final bool shouldAnimate;

  const _CreatorProfileBubble({
    required this.video,
    required this.isFollowed,
    required this.onTap,
    required this.onFollow,
    this.shouldAnimate = true,
  });

  @override
  State<_CreatorProfileBubble> createState() => _CreatorProfileBubbleState();
}

class _CreatorProfileBubbleState extends State<_CreatorProfileBubble>
    with TickerProviderStateMixin {
  late AnimationController _pulseController;
  late AnimationController _floatController;
  late Animation<double> _pulseAnimation;
  late Animation<double> _floatAnimation;

  @override
  void initState() {
    super.initState();
    
    _pulseController = AnimationController(
      duration: const Duration(seconds: 2),
      vsync: this,
    );
    
    _floatController = AnimationController(
      duration: const Duration(seconds: 3),
      vsync: this,
    );
    
    _pulseAnimation = Tween<double>(
      begin: 1.0,
      end: 1.1,
    ).animate(CurvedAnimation(
      parent: _pulseController,
      curve: Curves.easeInOut,
    ));
    
    _floatAnimation = Tween<double>(
      begin: -5.0,
      end: 5.0,
    ).animate(CurvedAnimation(
      parent: _floatController,
      curve: Curves.easeInOut,
    ));
    
    if (widget.shouldAnimate) {
      _pulseController.repeat(reverse: true);
      _floatController.repeat(reverse: true);
    }
  }

  @override
  void didUpdateWidget(_CreatorProfileBubble oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.shouldAnimate != widget.shouldAnimate) {
      if (widget.shouldAnimate) {
        _pulseController.repeat(reverse: true);
        _floatController.repeat(reverse: true);
      } else {
        _pulseController.stop();
        _floatController.stop();
        _pulseController.reset();
        _floatController.reset();
      }
    }
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _floatController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: Listenable.merge([_pulseAnimation, _floatAnimation]),
      builder: (context, child) {
        return Transform.translate(
          offset: Offset(0, _floatAnimation.value),
          child: Transform.scale(
            scale: _pulseAnimation.value,
            child: GestureDetector(
              onTap: () {
                print('CreatorProfileBubble: Tap detected!');
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('🎯 Creator profile button tapped: @${widget.video.user?['username'] ?? 'Unknown'}')),
                );
                widget.onTap();
              },
              child: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [
                      Color(0xFF9C27B0), // Purple
                      Color(0xFFE1BEE7), // Light Purple
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF9C27B0).withOpacity(0.4),
                      blurRadius: 15,
                      spreadRadius: 3,
                    ),
                    BoxShadow(
                      color: const Color(0xFFE1BEE7).withOpacity(0.4),
                      blurRadius: 15,
                      spreadRadius: 3,
                      offset: const Offset(3, 3),
                    ),
                  ],
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Creator avatar (rounded rectangle like profile page)
                    Container(
                      width: 32,
                      height: 32,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(8),
                        gradient: const LinearGradient(
                          colors: [Colors.white, Colors.white70],
                        ),
                      ),
                      child: Container(
                        margin: const EdgeInsets.all(2),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(6),
                          color: Colors.black,
                        ),
                        child: Center(
                          child: Text(
                            (widget.video.user?['username'] ?? 'U')[0].toUpperCase(),
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                              shadows: [
                                Shadow(
                                  color: Colors.black,
                                  blurRadius: 4,
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 4),
                    // Username
                    ShaderMask(
                      shaderCallback: (bounds) => const LinearGradient(
                        colors: [Colors.white, Colors.black],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ).createShader(bounds),
                      child: Text(
                        '@${(widget.video.user?['username'] ?? 'user').length > 8 ? '${(widget.video.user?['username'] ?? 'user').substring(0, 8)}...' : widget.video.user?['username'] ?? 'user'}',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 8,
                          fontWeight: FontWeight.bold,
                          shadows: [
                            Shadow(
                              color: Colors.black,
                              blurRadius: 4,
                            ),
                          ],
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}

class _VIB3FollowButton extends StatefulWidget {
  final Video video;
  final bool isFollowed;
  final VoidCallback onTap;
  final bool shouldAnimate;

  const _VIB3FollowButton({
    required this.video,
    required this.isFollowed,
    required this.onTap,
    this.shouldAnimate = true,
  });

  @override
  State<_VIB3FollowButton> createState() => _VIB3FollowButtonState();
}

class _VIB3FollowButtonState extends State<_VIB3FollowButton>
    with TickerProviderStateMixin {
  late AnimationController _pulseController;
  late AnimationController _floatController;
  late AnimationController _rotateController;
  late Animation<double> _pulseAnimation;
  late Animation<double> _floatAnimation;
  late Animation<double> _rotateAnimation;

  @override
  void initState() {
    super.initState();
    
    _pulseController = AnimationController(
      duration: const Duration(seconds: 2),
      vsync: this,
    );
    
    _floatController = AnimationController(
      duration: const Duration(seconds: 3),
      vsync: this,
    );
    
    _rotateController = AnimationController(
      duration: const Duration(seconds: 4),
      vsync: this,
    );
    
    _pulseAnimation = Tween<double>(
      begin: 1.0,
      end: 1.2,
    ).animate(CurvedAnimation(
      parent: _pulseController,
      curve: Curves.easeInOut,
    ));
    
    _floatAnimation = Tween<double>(
      begin: -6.0,
      end: 6.0,
    ).animate(CurvedAnimation(
      parent: _floatController,
      curve: Curves.easeInOut,
    ));
    
    _rotateAnimation = Tween<double>(
      begin: 0.0,
      end: 6.28318, // 2π for full rotation
    ).animate(CurvedAnimation(
      parent: _rotateController,
      curve: Curves.linear,
    ));
    
    if (widget.shouldAnimate) {
      _pulseController.repeat(reverse: true);
      _floatController.repeat(reverse: true);
      _rotateController.repeat();
    }
  }

  @override
  void didUpdateWidget(_VIB3FollowButton oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.shouldAnimate != widget.shouldAnimate) {
      if (widget.shouldAnimate) {
        _pulseController.repeat(reverse: true);
        _floatController.repeat(reverse: true);
        _rotateController.repeat();
      } else {
        _pulseController.stop();
        _floatController.stop();
        _rotateController.stop();
        _pulseController.reset();
        _floatController.reset();
        _rotateController.reset();
      }
    }
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _floatController.dispose();
    _rotateController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: Listenable.merge([_pulseAnimation, _floatAnimation, _rotateAnimation]),
      builder: (context, child) {
        return Transform.translate(
          offset: Offset(0, _floatAnimation.value),
          child: Transform.scale(
            scale: _pulseAnimation.value,
            child: Transform.rotate(
              angle: _rotateAnimation.value * 0.1, // Subtle rotation
              child: GestureDetector(
                onTap: () {
                  print('VIB3FollowButton: Tap detected!');
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('🎯 ${widget.isFollowed ? "Unfollow" : "Follow"} button tapped!')),
                  );
                  widget.onTap();
                },
                child: Container(
                  width: 24,
                  height: 24,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: widget.isFollowed 
                        ? Provider.of<ThemeProvider>(context).getFollowGradient()
                        : Provider.of<ThemeProvider>(context).getLikeGradient(),
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: (widget.isFollowed 
                          ? Provider.of<ThemeProvider>(context).getFollowGradient().first
                          : Provider.of<ThemeProvider>(context).getLikeGradient().first).withOpacity(0.6),
                        blurRadius: 25,
                        spreadRadius: 5,
                      ),
                      BoxShadow(
                        color: Colors.white.withOpacity(0.2),
                        blurRadius: 15,
                        spreadRadius: 2,
                      ),
                      BoxShadow(
                        color: Colors.black.withOpacity(0.3),
                        blurRadius: 10,
                        spreadRadius: 1,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      // Outer rotating ring
                      Transform.rotate(
                        angle: _rotateAnimation.value,
                        child: Container(
                          width: 20,
                          height: 20,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: Colors.white.withOpacity(0.4),
                              width: 1,
                            ),
                          ),
                        ),
                      ),
                      // F/U Symbol  
                      Text(
                        widget.isFollowed ? 'U' : 'F',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          shadows: [
                            Shadow(
                              color: Colors.black,
                              blurRadius: 3,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}