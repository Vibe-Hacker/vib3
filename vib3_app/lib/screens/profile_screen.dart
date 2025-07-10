import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/video_provider.dart';
import '../services/video_service.dart';
import '../models/video.dart';
import '../widgets/video_thumbnail.dart';
import 'settings_screen.dart';
import 'edit_profile_screen.dart';
import 'qr_code_screen.dart';
import 'analytics_screen.dart';
import 'add_friends_screen.dart';
import 'messages_screen.dart';
import 'profile_video_viewer.dart';
import 'collections_screen.dart';

class ProfileScreen extends StatefulWidget {
  final String? userId; // Optional userId to view other users' profiles

  const ProfileScreen({super.key, this.userId});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> with TickerProviderStateMixin {
  List<Video> userVideos = [];
  List<Video> starredVideos = [];
  List<Video> privateVideos = [];
  bool isLoadingVideos = false;
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadUserVideos();
    _refreshUserStats();
  }
  
  Future<void> _refreshUserStats() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    if (widget.userId == null || widget.userId == authProvider.currentUser?.id) {
      // Refresh current user's stats
      await authProvider.refreshUserStats();
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadUserVideos() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final user = authProvider.currentUser;
    final token = authProvider.authToken;

    if (user == null || token == null) return;

    setState(() {
      isLoadingVideos = true;
    });

    try {
      // Use widget.userId if provided (viewing other user's profile), otherwise use current user
      final targetUserId = widget.userId ?? user.id;
      
      final videos = await VideoService.getUserVideos(targetUserId, token);
      final starred = await VideoService.getLikedVideos(targetUserId, token);
      
      print('ProfileScreen: Loaded ${videos.length} videos for user $targetUserId');
      for (final video in videos) {
        print('Video: ${video.id}, thumbnail: ${video.thumbnailUrl}');
      }
      
      setState(() {
        userVideos = videos;
        starredVideos = starred;
        privateVideos = videos.where((video) => video.isPrivate).toList();
        isLoadingVideos = false;
      });
    } catch (e) {
      setState(() {
        isLoadingVideos = false;
      });
    }
  }

  Future<void> _deleteVideo(Video video) async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final token = authProvider.authToken;

    if (token == null) return;

    // Show confirmation dialog
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1A1A1A),
        title: const Text('Delete Video', style: TextStyle(color: Colors.white)),
        content: const Text(
          'Are you sure you want to delete this video? This action cannot be undone.',
          style: TextStyle(color: Colors.white70),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Delete', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    // Optimistically remove video from UI immediately
    setState(() {
      userVideos.removeWhere((v) => v.id == video.id);
      privateVideos.removeWhere((v) => v.id == video.id);
      starredVideos.removeWhere((v) => v.id == video.id);
    });

    // Also remove from global video provider immediately
    try {
      final videoProvider = Provider.of<VideoProvider>(context, listen: false);
      videoProvider.removeVideo(video.id);
    } catch (e) {
      print('Could not update global video provider: $e');
    }

    // Show immediate success feedback
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Video deleted successfully')),
    );

    // Delete on server in background
    final success = await VideoService.deleteVideo(video.id, token);
    
    if (!success) {
      // If server deletion failed, restore the video
      await _loadUserVideos(); // Reload to restore the video
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Failed to delete video on server. Video restored.'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final user = authProvider.currentUser;

    if (user == null) {
      return Scaffold(
        backgroundColor: Colors.black,
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              ShaderMask(
                shaderCallback: (bounds) => const LinearGradient(
                  colors: [
                    Color(0xFF00CED1), // Cyan
                    Color(0xFFFF1493), // Deep Pink
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ).createShader(bounds),
                child: const Text(
                  'VIB3',
                  style: TextStyle(
                    fontSize: 48,
                    fontWeight: FontWeight.w900,
                    color: Colors.white,
                  ),
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'Please login to view profile',
                style: TextStyle(color: Colors.white70, fontSize: 16),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.message_outlined, color: Colors.white),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const MessagesScreen()),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.person_add_outlined, color: Colors.white),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const AddFriendsScreen()),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.menu, color: Colors.white),
            onPressed: () {
              _showOptionsMenu(context);
            },
          ),
        ],
      ),
      body: NestedScrollView(
        headerSliverBuilder: (BuildContext context, bool innerBoxIsScrolled) {
          return [
            SliverToBoxAdapter(
              child: Column(
                children: [
            // Profile Header
            Container(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  // Floating Profile Picture
                  _FloatingProfilePicture(
                    user: user,
                    onTap: () {
                      // TODO: Add profile picture change functionality
                    },
                  ),
                  const SizedBox(height: 16),
                  
                  // Username and display name
                  Text(
                    user.displayName ?? user.username,
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  Text(
                    '@${user.username}',
                    style: const TextStyle(
                      fontSize: 14,
                      color: Colors.grey,
                    ),
                  ),
                  const SizedBox(height: 8),
                  
                  // Bio
                  if (user.bio != null)
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 40),
                      child: Text(
                        user.bio!,
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          fontSize: 14,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  const SizedBox(height: 16),
                  
                  // Floating Stats Row
                  Container(
                    margin: const EdgeInsets.symmetric(horizontal: 20),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: [
                        _buildFloatingStat('Vibing', user.following, 
                          gradientColors: const [Color(0xFF00CED1), Color(0xFF40E0D0)],
                          onTap: () {
                            // TODO: Implement following screen
                          },
                        ),
                        _buildFloatingStat('VIB3RS', user.followers,
                          gradientColors: const [Color(0xFFFF1493), Color(0xFFFF6B9D)],
                          onTap: () {
                            // TODO: Implement followers screen
                          },
                        ),
                        _buildFloatingStat('VIB3S', user.totalLikes,
                          gradientColors: const [Color(0xFFFFD700), Color(0xFFFFA500)],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  
                  // Action Buttons Row
                  Row(
                    children: [
                      // Edit Profile Button
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => const EditProfileScreen(),
                              ),
                            );
                          },
                          style: OutlinedButton.styleFrom(
                            side: const BorderSide(color: Colors.grey),
                            padding: const EdgeInsets.symmetric(vertical: 8),
                          ),
                          child: const Text(
                            'Edit VIB3',
                            style: TextStyle(color: Colors.white),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      // Share Profile Button
                      OutlinedButton(
                        onPressed: () => _shareProfile(),
                        style: OutlinedButton.styleFrom(
                          side: const BorderSide(color: Colors.grey),
                          padding: const EdgeInsets.all(8),
                        ),
                        child: const Icon(Icons.share, color: Colors.white, size: 20),
                      ),
                      const SizedBox(width: 8),
                      // Analytics Button (if Pro account)
                      OutlinedButton(
                        onPressed: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => const AnalyticsScreen(),
                            ),
                          );
                        },
                        style: OutlinedButton.styleFrom(
                          side: const BorderSide(color: Colors.grey),
                          padding: const EdgeInsets.all(8),
                        ),
                        child: const Icon(Icons.insights, color: Colors.white, size: 20),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  
                  // Add bio link
                  if (user.bio == null || user.bio!.isEmpty)
                    TextButton(
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => const EditProfileScreen(),
                          ),
                        );
                      },
                      child: const Text(
                        'Add your vibe',
                        style: TextStyle(color: Color(0xFFFF0080)),
                      ),
                    ),
                ],
              ),
            ),
                ],
              ),
            ),
          ];
        },
        body: Column(
          children: [
            // Sticky Tab Bar
            Container(
              color: Colors.black,
              child: TabBar(
                controller: _tabController,
                indicatorColor: Colors.white,
                tabs: const [
                  Tab(icon: Icon(Icons.video_library), text: 'Videos'),
                  Tab(icon: Icon(Icons.star_border), text: 'Starred'),
                  Tab(icon: Icon(Icons.visibility_off), text: 'Private'),
                ],
              ),
            ),
            // Tab Content
            Expanded(
              child: TabBarView(
                controller: _tabController,
                children: [
                  _buildVideoGrid(userVideos, showDeleteButton: true),
                  _buildVideoGrid(starredVideos, showDeleteButton: false),
                  _buildVideoGrid(privateVideos, showDeleteButton: true),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFloatingStat(String label, int count, {
    required List<Color> gradientColors,
    VoidCallback? onTap,
  }) {
    return _FloatingStatBubble(
      label: label,
      count: count,
      gradientColors: gradientColors,
      onTap: onTap,
      shouldAnimate: true, // Always animate on profile page when it's visible
    );
  }

  Widget _buildStatColumn(String label, int count, {VoidCallback? onTap}) {
    Widget column = Column(
      children: [
        ShaderMask(
          shaderCallback: (bounds) => const LinearGradient(
            colors: [
              Color(0xFF00CED1), // Cyan
              Color(0xFFFF1493), // Deep Pink
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ).createShader(bounds),
          child: Text(
            count.toString(),
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
        ),
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            color: Colors.grey,
          ),
        ),
      ],
    );

    if (onTap != null) {
      return GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(8),
            border: Border.all(
              color: const Color(0xFF00CED1).withOpacity(0.3),
              width: 1,
            ),
          ),
          child: column,
        ),
      );
    }
    return column;
  }

  Widget _buildVideoGrid(List<Video> videos, {required bool showDeleteButton}) {
    if (isLoadingVideos) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            ShaderMask(
              shaderCallback: (bounds) => const LinearGradient(
                colors: [
                  Color(0xFF00CED1), // Cyan
                  Color(0xFFFF1493), // Deep Pink
                ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ).createShader(bounds),
              child: const Text(
                'VIB3',
                style: TextStyle(
                  fontSize: 32,
                  fontWeight: FontWeight.w900,
                  color: Colors.white,
                ),
              ),
            ),
            const SizedBox(height: 16),
            const CircularProgressIndicator(
              color: Color(0xFFFF1493),
            ),
            const SizedBox(height: 16),
            const Text(
              'Loading videos...',
              style: TextStyle(
                color: Colors.white70,
                fontSize: 14,
              ),
            ),
          ],
        ),
      );
    }

    if (videos.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            ShaderMask(
              shaderCallback: (bounds) => const LinearGradient(
                colors: [
                  Color(0xFF00CED1), // Cyan
                  Color(0xFFFF1493), // Deep Pink
                ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ).createShader(bounds),
              child: const Icon(
                Icons.video_library_outlined,
                size: 64,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 16),
            ShaderMask(
              shaderCallback: (bounds) => const LinearGradient(
                colors: [
                  Color(0xFF00CED1), // Cyan
                  Color(0xFFFF1493), // Deep Pink
                ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ).createShader(bounds),
              child: const Text(
                'No videos yet',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Start creating amazing content!',
              style: TextStyle(
                color: Colors.white70,
                fontSize: 14,
              ),
            ),
          ],
        ),
      );
    }

    return GridView.builder(
      padding: const EdgeInsets.all(8),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 4, // Unique 4-column layout
        childAspectRatio: 3 / 4, // Good for 4 columns
        crossAxisSpacing: 4,
        mainAxisSpacing: 4,
      ),
      itemCount: videos.length,
      itemBuilder: (context, index) {
        final video = videos[index];
        return VideoThumbnail(
          video: video,
          showDeleteButton: showDeleteButton,
          onDelete: () => _deleteVideo(video),
          onTap: () {
            // TODO: Navigate to video player
            _playVideo(video);
          },
        );
      },
    );
  }

  void _playVideo(Video video) {
    // Find the index of this video in the current list
    final currentVideos = _getCurrentVideoList();
    final videoIndex = currentVideos.indexOf(video);
    
    if (videoIndex != -1) {
      // Get the username for display
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final user = authProvider.currentUser;
      final username = user?.username ?? 'unknown';
      
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => ProfileVideoViewer(
            videos: currentVideos,
            initialIndex: videoIndex,
            username: username,
          ),
        ),
      );
    }
  }
  
  List<Video> _getCurrentVideoList() {
    // Return the appropriate video list based on current tab
    switch (_tabController.index) {
      case 0:
        return userVideos;
      case 1:
        return starredVideos;
      case 2:
        return privateVideos;
      default:
        return userVideos;
    }
  }

  void _showOptionsMenu(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF1A1A1A),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (context) => Container(
        constraints: BoxConstraints(
          maxHeight: MediaQuery.of(context).size.height * 0.6,
        ),
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
            // Handle bar
            Container(
              width: 40,
              height: 4,
              margin: const EdgeInsets.only(bottom: 20),
              decoration: BoxDecoration(
                color: Colors.grey,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            
            // Menu Items
            _buildMenuItem(
              icon: Icons.settings,
              title: 'Settings and privacy',
              onTap: () {
                Navigator.pop(context);
                Navigator.of(context).push(
                  PageRouteBuilder(
                    pageBuilder: (context, animation, secondaryAnimation) => const SettingsScreen(),
                    transitionDuration: const Duration(milliseconds: 300),
                    transitionsBuilder: (context, animation, secondaryAnimation, child) {
                      return SlideTransition(
                        position: Tween<Offset>(
                          begin: const Offset(1.0, 0.0),
                          end: Offset.zero,
                        ).animate(animation),
                        child: child,
                      );
                    },
                  ),
                );
              },
            ),
            _buildMenuItem(
              icon: Icons.qr_code,
              title: 'QR code',
              onTap: () {
                Navigator.pop(context);
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => const QRCodeScreen()),
                );
              },
            ),
            _buildMenuItem(
              icon: Icons.bookmark_outline,
              title: 'Saved',
              onTap: () {
                Navigator.pop(context);
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => const CollectionsScreen(),
                  ),
                );
              },
            ),
            _buildMenuItem(
              icon: Icons.favorite_outline,
              title: 'Your VIB3 favorites',
              onTap: () {
                Navigator.pop(context);
                // Navigate to favorite effects/sounds
              },
            ),
            _buildMenuItem(
              icon: Icons.timer,
              title: 'Screen Time',
              onTap: () {
                Navigator.pop(context);
                // Navigate to digital wellbeing
              },
            ),
            const Divider(color: Colors.grey),
            _buildMenuItem(
              icon: Icons.night_shelter_outlined,
              title: 'Creator tools',
              onTap: () {
                Navigator.pop(context);
                _showCreatorTools(context);
              },
            ),
            _buildMenuItem(
              icon: Icons.help_outline,
              title: 'Order management',
              onTap: () {
                Navigator.pop(context);
                // Navigate to order management
              },
            ),
          ],
          ),
        ),
      ),
    );
  }
  
  Widget _buildMenuItem({
    required IconData icon,
    required String title,
    required VoidCallback onTap,
  }) {
    return ListTile(
      leading: Icon(icon, color: Colors.white, size: 24),
      title: Text(title, style: const TextStyle(color: Colors.white, fontSize: 16)),
      onTap: onTap,
    );
  }
  
  void _showCreatorTools(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF1A1A1A),
      builder: (context) => Container(
        padding: const EdgeInsets.symmetric(vertical: 20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.analytics_outlined, color: Colors.white),
              title: const Text('Analytics', style: TextStyle(color: Colors.white)),
              onTap: () {
                Navigator.pop(context);
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => const AnalyticsScreen()),
                );
              },
            ),
            ListTile(
              leading: const Icon(Icons.live_tv, color: Colors.white),
              title: const Text('LIVE center', style: TextStyle(color: Colors.white)),
              onTap: () {
                Navigator.pop(context);
                // Navigate to LIVE center
              },
            ),
            ListTile(
              leading: const Icon(Icons.monetization_on_outlined, color: Colors.white),
              title: const Text('Creator Fund', style: TextStyle(color: Colors.white)),
              onTap: () {
                Navigator.pop(context);
                // Navigate to Creator Fund
              },
            ),
          ],
        ),
      ),
    );
  }
  
  void _shareProfile() {
    // Implement share profile functionality
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Profile link copied!')),
    );
  }
}

class _FloatingStatBubble extends StatefulWidget {
  final String label;
  final int count;
  final List<Color> gradientColors;
  final VoidCallback? onTap;
  final bool shouldAnimate;

  const _FloatingStatBubble({
    required this.label,
    required this.count,
    required this.gradientColors,
    this.onTap,
    this.shouldAnimate = true,
  });

  @override
  State<_FloatingStatBubble> createState() => _FloatingStatBubbleState();
}

class _FloatingStatBubbleState extends State<_FloatingStatBubble>
    with TickerProviderStateMixin {
  late AnimationController _floatController;
  late AnimationController _pulseController;
  late Animation<double> _floatAnimation;
  late Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();
    
    // Floating animation
    _floatController = AnimationController(
      duration: Duration(seconds: 3 + (widget.label.hashCode % 2)), // Varied timing
      vsync: this,
    );
    
    // Pulse animation
    _pulseController = AnimationController(
      duration: const Duration(seconds: 2),
      vsync: this,
    );
    
    _floatAnimation = Tween<double>(
      begin: -8.0,
      end: 8.0,
    ).animate(CurvedAnimation(
      parent: _floatController,
      curve: Curves.easeInOut,
    ));
    
    _pulseAnimation = Tween<double>(
      begin: 1.0,
      end: 1.1,
    ).animate(CurvedAnimation(
      parent: _pulseController,
      curve: Curves.easeInOut,
    ));
    
    // Start animations conditionally  
    if (widget.shouldAnimate) {
      _floatController.repeat(reverse: true);
      _pulseController.repeat(reverse: true);
    }
  }

  @override
  void dispose() {
    _floatController.dispose();
    _pulseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: Listenable.merge([_floatAnimation, _pulseAnimation]),
      builder: (context, child) {
        return Transform.translate(
          offset: Offset(0, _floatAnimation.value),
          child: Transform.scale(
            scale: _pulseAnimation.value,
            child: GestureDetector(
              onTap: widget.onTap,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
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
                      spreadRadius: 2,
                    ),
                    BoxShadow(
                      color: widget.gradientColors.last.withOpacity(0.3),
                      blurRadius: 20,
                      spreadRadius: 4,
                      offset: const Offset(3, 3),
                    ),
                  ],
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    ShaderMask(
                      shaderCallback: (bounds) => const LinearGradient(
                        colors: [Colors.white, Colors.black],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ).createShader(bounds),
                      child: Text(
                        widget.count.toString(),
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                          shadows: [
                            Shadow(
                              color: Colors.black,
                              blurRadius: 6,
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 4),
                    ShaderMask(
                      shaderCallback: (bounds) => const LinearGradient(
                        colors: [Colors.white, Colors.black],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ).createShader(bounds),
                      child: Text(
                        widget.label,
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: Colors.white,
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
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}

class _FloatingProfilePicture extends StatefulWidget {
  final dynamic user; // User object
  final VoidCallback? onTap;
  final bool shouldAnimate;

  const _FloatingProfilePicture({
    required this.user,
    this.onTap,
    this.shouldAnimate = true,
  });

  @override
  State<_FloatingProfilePicture> createState() => _FloatingProfilePictureState();
}

class _FloatingProfilePictureState extends State<_FloatingProfilePicture>
    with TickerProviderStateMixin {
  late AnimationController _floatController;
  late AnimationController _pulseController;
  late Animation<double> _floatAnimation;
  late Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();
    
    // Floating animation
    _floatController = AnimationController(
      duration: const Duration(seconds: 4), // Slower for profile picture
      vsync: this,
    );
    
    // Pulse animation
    _pulseController = AnimationController(
      duration: const Duration(seconds: 3), // Slower pulse
      vsync: this,
    );
    
    _floatAnimation = Tween<double>(
      begin: -10.0,
      end: 10.0,
    ).animate(CurvedAnimation(
      parent: _floatController,
      curve: Curves.easeInOut,
    ));
    
    _pulseAnimation = Tween<double>(
      begin: 1.0,
      end: 1.05, // Subtle pulse
    ).animate(CurvedAnimation(
      parent: _pulseController,
      curve: Curves.easeInOut,
    ));
    
    // Start animations conditionally  
    if (widget.shouldAnimate) {
      _floatController.repeat(reverse: true);
      _pulseController.repeat(reverse: true);
    }
  }

  @override
  void dispose() {
    _floatController.dispose();
    _pulseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: Listenable.merge([_floatAnimation, _pulseAnimation]),
      builder: (context, child) {
        return Transform.translate(
          offset: Offset(0, _floatAnimation.value),
          child: Transform.scale(
            scale: _pulseAnimation.value,
            child: GestureDetector(
              onTap: widget.onTap,
              child: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(30), // Rounded rectangle like stats
                  gradient: const LinearGradient(
                    colors: [
                      Color(0xFF00CED1), // Cyan
                      Color(0xFFFF1493), // Deep Pink
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF00CED1).withOpacity(0.4),
                      blurRadius: 20,
                      spreadRadius: 3,
                    ),
                    BoxShadow(
                      color: const Color(0xFFFF1493).withOpacity(0.3),
                      blurRadius: 25,
                      spreadRadius: 5,
                      offset: const Offset(3, 3),
                    ),
                  ],
                ),
                child: Container(
                  width: 120,
                  height: 120,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(25),
                    color: Colors.black,
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(25),
                    child: widget.user.profilePicture != null
                        ? Image.network(
                            widget.user.profilePicture!,
                            width: 120,
                            height: 120,
                            fit: BoxFit.cover,
                            errorBuilder: (context, error, stackTrace) {
                              return _buildInitialAvatar();
                            },
                          )
                        : _buildInitialAvatar(),
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildInitialAvatar() {
    return Container(
      width: 120,
      height: 120,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(25),
        gradient: const LinearGradient(
          colors: [
            Color(0xFF00CED1), // Cyan
            Color(0xFFFF1493), // Deep Pink
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Center(
        child: Text(
          widget.user.username[0].toUpperCase(),
          style: const TextStyle(
            fontSize: 48,
            fontWeight: FontWeight.bold,
            color: Colors.white,
            shadows: [
              Shadow(
                color: Colors.black,
                blurRadius: 4,
              ),
            ],
          ),
        ),
      ),
    );
  }
}