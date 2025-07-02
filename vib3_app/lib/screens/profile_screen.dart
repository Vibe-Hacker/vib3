import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../services/video_service.dart';
import '../models/video.dart';
import '../widgets/video_thumbnail.dart';
import 'settings_screen.dart';
import 'edit_profile_screen.dart';
import 'qr_code_screen.dart';
import 'analytics_screen.dart';
import 'add_friends_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> with TickerProviderStateMixin {
  List<Video> userVideos = [];
  List<Video> likedVideos = [];
  List<Video> privateVideos = [];
  bool isLoadingVideos = false;
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadUserVideos();
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
      final videos = await VideoService.getUserVideos(user.id, token);
      final liked = await VideoService.getLikedVideos(user.id, token);
      
      setState(() {
        userVideos = videos;
        likedVideos = liked;
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

    final success = await VideoService.deleteVideo(video.id, token);
    
    if (success) {
      setState(() {
        userVideos.removeWhere((v) => v.id == video.id);
        privateVideos.removeWhere((v) => v.id == video.id);
      });
      
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Video deleted successfully')),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Failed to delete video')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final user = authProvider.currentUser;

    if (user == null) {
      return const Center(
        child: Text('Not logged in', style: TextStyle(color: Colors.white)),
      );
    }

    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        title: Row(
          children: [
            Text(user.username),
            const SizedBox(width: 4),
            const Icon(Icons.keyboard_arrow_down, size: 16),
          ],
        ),
        actions: [
          // Add friends icon
          IconButton(
            icon: const Icon(Icons.person_add_outlined),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const AddFriendsScreen()),
              );
            },
          ),
          // Menu icon
          IconButton(
            icon: const Icon(Icons.menu),
            onPressed: () {
              _showOptionsMenu(context);
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            // Profile Header
            Container(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  // Profile Picture
                  GestureDetector(
                    onTap: () {
                      // TODO: Add profile picture change functionality
                    },
                    child: CircleAvatar(
                      radius: 50,
                      backgroundColor: const Color(0xFF1A1A1A),
                      backgroundImage: user.profilePicture != null
                          ? NetworkImage(user.profilePicture!)
                          : null,
                      child: user.profilePicture == null
                          ? Text(
                              user.username[0].toUpperCase(),
                              style: const TextStyle(fontSize: 40),
                            )
                          : null,
                    ),
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
                  
                  // Stats
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      _buildStatColumn('Following', user.following),
                      _buildStatColumn('Followers', user.followers),
                      _buildStatColumn('Likes', user.totalLikes),
                    ],
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
                            'Edit profile',
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
                        '+ Add bio',
                        style: TextStyle(color: Color(0xFFFF0080)),
                      ),
                    ),
                  
                  // Debug info
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.grey[900],
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Column(
                      children: [
                        Text(
                          'Debug Info:',
                          style: const TextStyle(color: Colors.white, fontSize: 12),
                        ),
                        Text(
                          'User Videos: ${userVideos.length}',
                          style: const TextStyle(color: Colors.grey, fontSize: 10),
                        ),
                        Text(
                          'Liked Videos: ${likedVideos.length}',
                          style: const TextStyle(color: Colors.grey, fontSize: 10),
                        ),
                        Text(
                          'Loading: $isLoadingVideos',
                          style: const TextStyle(color: Colors.grey, fontSize: 10),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            
            // Tab Bar
            Column(
              children: [
                TabBar(
                  controller: _tabController,
                  indicatorColor: Colors.white,
                  tabs: const [
                    Tab(icon: Icon(Icons.grid_on)),
                    Tab(icon: Icon(Icons.favorite_border)),
                    Tab(icon: Icon(Icons.lock_outline)),
                  ],
                ),
                // Tab Content
                SizedBox(
                  height: MediaQuery.of(context).size.height * 0.5,
                  child: TabBarView(
                    controller: _tabController,
                    children: [
                      _buildVideoGrid(userVideos, showDeleteButton: true),
                      _buildVideoGrid(likedVideos, showDeleteButton: false),
                      _buildVideoGrid(privateVideos, showDeleteButton: true),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatColumn(String label, int count) {
    return Column(
      children: [
        Text(
          count.toString(),
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: Colors.white,
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
  }

  Widget _buildVideoGrid(List<Video> videos, {required bool showDeleteButton}) {
    if (isLoadingVideos) {
      return const Center(
        child: CircularProgressIndicator(
          color: Color(0xFFFF0080),
        ),
      );
    }

    if (videos.isEmpty) {
      return const Center(
        child: Text(
          'No videos yet',
          style: TextStyle(color: Colors.grey),
        ),
      );
    }

    return GridView.builder(
      padding: const EdgeInsets.all(8),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        childAspectRatio: 9 / 16, // TikTok video aspect ratio
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
    // TODO: Implement video player navigation
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Playing: ${video.description ?? 'Video'}')),
    );
  }

  void _showOptionsMenu(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF1A1A1A),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (context) => Container(
        padding: const EdgeInsets.symmetric(vertical: 8),
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
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => const SettingsScreen()),
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
                // Navigate to saved videos
              },
            ),
            _buildMenuItem(
              icon: Icons.favorite_outline,
              title: 'Your favorites',
              onTap: () {
                Navigator.pop(context);
                // Navigate to favorite effects/sounds
              },
            ),
            _buildMenuItem(
              icon: Icons.timer,
              title: 'Digital Wellbeing',
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