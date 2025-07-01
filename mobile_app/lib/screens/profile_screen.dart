import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../config/app_config.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> with TickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        elevation: 0,
        leading: IconButton(
          onPressed: () => Navigator.of(context).pop(),
          icon: const Icon(Icons.arrow_back, color: Colors.white),
        ),
        actions: [
          PopupMenuButton<String>(
            icon: const Icon(Icons.more_vert, color: Colors.white),
            color: const Color(0xFF1A1A1A),
            onSelected: (value) async {
              switch (value) {
                case 'edit':
                  Navigator.of(context).pushNamed('/edit-profile');
                  break;
                case 'settings':
                  Navigator.of(context).pushNamed('/settings');
                  break;
                case 'logout':
                  final authProvider = Provider.of<AuthProvider>(context, listen: false);
                  await authProvider.logout();
                  if (mounted) {
                    Navigator.of(context).pushReplacementNamed('/login');
                  }
                  break;
              }
            },
            itemBuilder: (context) => [
              const PopupMenuItem(
                value: 'edit',
                child: Row(
                  children: [
                    Icon(Icons.edit, color: Colors.white, size: 20),
                    SizedBox(width: 12),
                    Text('Edit Profile', style: TextStyle(color: Colors.white)),
                  ],
                ),
              ),
              const PopupMenuItem(
                value: 'settings',
                child: Row(
                  children: [
                    Icon(Icons.settings, color: Colors.white, size: 20),
                    SizedBox(width: 12),
                    Text('Settings', style: TextStyle(color: Colors.white)),
                  ],
                ),
              ),
              const PopupMenuItem(
                value: 'logout',
                child: Row(
                  children: [
                    Icon(Icons.logout, color: Colors.white, size: 20),
                    SizedBox(width: 12),
                    Text('Logout', style: TextStyle(color: Colors.white)),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
      body: Consumer<AuthProvider>(
        builder: (context, authProvider, child) {
          final user = authProvider.currentUser;
          
          if (user == null) {
            return const Center(
              child: Text(
                'Please log in to view profile',
                style: TextStyle(color: Colors.white),
              ),
            );
          }

          return Column(
            children: [
              // Profile header
              Padding(
                padding: const EdgeInsets.all(20.0),
                child: Column(
                  children: [
                    // Profile picture
                    Container(
                      width: 100,
                      height: 100,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: const LinearGradient(
                          colors: [
                            Color(AppConfig.primaryColor),
                            Color(AppConfig.secondaryColor),
                          ],
                        ),
                        border: Border.all(color: Colors.white, width: 2),
                      ),
                      child: ClipOval(
                        child: user.profileImageUrl != null
                            ? Image.network(
                                user.profileImageUrl!,
                                fit: BoxFit.cover,
                                errorBuilder: (context, error, stackTrace) {
                                  return const Icon(
                                    Icons.person,
                                    color: Colors.white,
                                    size: 50,
                                  );
                                },
                              )
                            : const Icon(
                                Icons.person,
                                color: Colors.white,
                                size: 50,
                              ),
                      ),
                    ),

                    const SizedBox(height: 16),

                    // Username
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          '@${user.username}',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        if (user.isVerified) ...[
                          const SizedBox(width: 8),
                          const Icon(
                            Icons.verified,
                            color: Color(AppConfig.primaryColor),
                            size: 24,
                          ),
                        ],
                      ],
                    ),

                    const SizedBox(height: 8),

                    // Bio
                    if (user.bio != null && user.bio!.isNotEmpty)
                      Text(
                        user.bio!,
                        style: const TextStyle(
                          color: Colors.white70,
                          fontSize: 16,
                        ),
                        textAlign: TextAlign.center,
                      ),

                    const SizedBox(height: 20),

                    // Stats
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: [
                        _buildStatColumn('Following', user.followingCount),
                        _buildStatColumn('Followers', user.followersCount),
                        _buildStatColumn('Likes', user.totalLikes),
                      ],
                    ),

                    const SizedBox(height: 20),

                    // Action buttons
                    Row(
                      children: [
                        Expanded(
                          child: ElevatedButton(
                            onPressed: () {
                              Navigator.of(context).pushNamed('/edit-profile');
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(AppConfig.primaryColor),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8),
                              ),
                              padding: const EdgeInsets.symmetric(vertical: 12),
                            ),
                            child: const Text(
                              'Edit Profile',
                              style: TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Container(
                          decoration: BoxDecoration(
                            border: Border.all(color: Colors.white.withOpacity(0.3)),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: IconButton(
                            onPressed: () {
                              // Share profile
                            },
                            icon: const Icon(
                              Icons.share,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              // Tab bar
              Container(
                decoration: BoxDecoration(
                  border: Border(
                    bottom: BorderSide(
                      color: Colors.white.withOpacity(0.1),
                      width: 1,
                    ),
                  ),
                ),
                child: TabBar(
                  controller: _tabController,
                  indicatorColor: const Color(AppConfig.primaryColor),
                  indicatorWeight: 2,
                  labelColor: Colors.white,
                  unselectedLabelColor: Colors.white60,
                  tabs: const [
                    Tab(
                      icon: Icon(Icons.grid_on),
                      text: 'Videos',
                    ),
                    Tab(
                      icon: Icon(Icons.favorite),
                      text: 'Liked',
                    ),
                    Tab(
                      icon: Icon(Icons.bookmark),
                      text: 'Saved',
                    ),
                  ],
                ),
              ),

              // Tab content
              Expanded(
                child: TabBarView(
                  controller: _tabController,
                  children: [
                    _buildVideoGrid(), // User's videos
                    _buildVideoGrid(), // Liked videos
                    _buildVideoGrid(), // Saved videos
                  ],
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildStatColumn(String label, int count) {
    return Column(
      children: [
        Text(
          _formatCount(count),
          style: const TextStyle(
            color: Colors.white,
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: const TextStyle(
            color: Colors.white70,
            fontSize: 14,
          ),
        ),
      ],
    );
  }

  Widget _buildVideoGrid() {
    return GridView.builder(
      padding: const EdgeInsets.all(2),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        childAspectRatio: 9 / 16,
        crossAxisSpacing: 2,
        mainAxisSpacing: 2,
      ),
      itemCount: 12, // Placeholder count
      itemBuilder: (context, index) {
        return GestureDetector(
          onTap: () {
            // Navigate to video player
          },
          child: Container(
            decoration: BoxDecoration(
              color: Colors.grey[900],
              borderRadius: BorderRadius.circular(4),
            ),
            child: Stack(
              fit: StackFit.expand,
              children: [
                // Video thumbnail placeholder
                Container(
                  decoration: BoxDecoration(
                    color: Colors.grey[800],
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: const Icon(
                    Icons.play_arrow,
                    color: Colors.white,
                    size: 32,
                  ),
                ),

                // View count overlay
                Positioned(
                  bottom: 4,
                  left: 4,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 6,
                      vertical: 2,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.black.withOpacity(0.7),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(
                          Icons.play_arrow,
                          color: Colors.white,
                          size: 12,
                        ),
                        const SizedBox(width: 2),
                        Text(
                          _formatCount(1000 + index * 100),
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  String _formatCount(int count) {
    if (count >= 1000000) {
      return '${(count / 1000000).toStringAsFixed(1)}M';
    } else if (count >= 1000) {
      return '${(count / 1000).toStringAsFixed(1)}K';
    }
    return count.toString();
  }
}