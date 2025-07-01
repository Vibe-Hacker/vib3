import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../providers/video_provider.dart';
import '../providers/auth_provider.dart';
import '../widgets/video_feed.dart';
import '../config/app_config.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> with TickerProviderStateMixin {
  late PageController _pageController;
  int _currentIndex = 0;
  
  final List<String> _tabTitles = ['For You', 'Following', 'Live'];

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
    
    // Set immersive mode for TikTok-like experience
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
    
    // Load initial videos
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<VideoProvider>(context, listen: false).loadVideos(refresh: true);
    });
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      extendBodyBehindAppBar: true,
      appBar: _buildAppBar(),
      body: Stack(
        children: [
          // Main content
          PageView(
            controller: _pageController,
            scrollDirection: Axis.horizontal,
            children: const [
              VideoFeed(), // For You tab
              VideoFeed(isFollowing: true), // Following tab
              Center(
                child: Text(
                  'Live Coming Soon',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                  ),
                ),
              ), // Live tab
            ],
          ),
          
          // Bottom navigation
          Positioned(
            bottom: 10,
            left: 0,
            right: 0,
            child: _buildBottomNavigation(),
          ),
        ],
      ),
    );
  }

  PreferredSizeWidget _buildAppBar() {
    return AppBar(
      backgroundColor: Colors.transparent,
      elevation: 0,
      systemOverlayStyle: SystemUiOverlayStyle.light,
      automaticallyImplyLeading: false,
      title: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: _tabTitles.asMap().entries.map((entry) {
          final index = entry.key;
          final title = entry.value;
          final isSelected = _currentIndex == index;
          
          return GestureDetector(
            onTap: () {
              setState(() {
                _currentIndex = index;
              });
              _pageController.animateToPage(
                index,
                duration: const Duration(milliseconds: 300),
                curve: Curves.easeInOut,
              );
            },
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    color: isSelected ? Colors.white : Colors.white60,
                    fontSize: 16,
                    fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                  ),
                ),
                const SizedBox(height: 4),
                Container(
                  height: 2,
                  width: 20,
                  decoration: BoxDecoration(
                    color: isSelected 
                        ? const Color(AppConfig.primaryColor)
                        : Colors.transparent,
                    borderRadius: BorderRadius.circular(1),
                  ),
                ),
              ],
            ),
          );
        }).toList(),
      ),
      actions: [
        IconButton(
          onPressed: () {
            Navigator.of(context).pushNamed('/search');
          },
          icon: const Icon(
            Icons.search,
            color: Colors.white,
            size: 28,
          ),
        ),
        PopupMenuButton<String>(
          icon: const Icon(
            Icons.more_vert,
            color: Colors.white,
            size: 28,
          ),
          color: const Color(0xFF1A1A1A),
          onSelected: (value) async {
            switch (value) {
              case 'profile':
                Navigator.of(context).pushNamed('/profile');
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
              value: 'profile',
              child: Row(
                children: [
                  Icon(Icons.person, color: Colors.white, size: 20),
                  SizedBox(width: 12),
                  Text('Profile', style: TextStyle(color: Colors.white)),
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
    );
  }

  Widget _buildBottomNavigation() {
    return Container(
      height: 65,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            Colors.transparent,
            Colors.black.withOpacity(0.6),
            Colors.black.withOpacity(0.8),
          ],
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 5.0),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: [
            _buildNavItem(Icons.home, 'Home', 0),
            _buildNavItem(Icons.explore, 'Discover', 1),
            _buildCreateButton(),
            _buildNavItem(Icons.inbox, 'Inbox', 3),
            _buildNavItem(Icons.person, 'Profile', 4),
          ],
        ),
      ),
    );
  }

  Widget _buildNavItem(IconData icon, String label, int index) {
    final isSelected = _currentIndex == index;
    
    return GestureDetector(
      onTap: () {
        if (index == 0) {
          // Home - reset to For You tab
          setState(() {
            _currentIndex = 0;
          });
          _pageController.animateToPage(
            0,
            duration: const Duration(milliseconds: 300),
            curve: Curves.easeInOut,
          );
        } else if (index == 1) {
          Navigator.of(context).pushNamed('/discover');
        } else if (index == 3) {
          Navigator.of(context).pushNamed('/inbox');
        } else if (index == 4) {
          Navigator.of(context).pushNamed('/profile');
        }
      },
      child: SizedBox(
        height: 45,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              color: isSelected ? const Color(AppConfig.primaryColor) : Colors.white,
              size: 24,
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: TextStyle(
                color: isSelected ? const Color(AppConfig.primaryColor) : Colors.white,
                fontSize: 10,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCreateButton() {
    return GestureDetector(
      onTap: () {
        Navigator.of(context).pushNamed('/camera');
      },
      child: Container(
        width: 50,
        height: 30,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(8),
          gradient: const LinearGradient(
            colors: [
              Color(AppConfig.primaryColor),
              Color(AppConfig.secondaryColor),
            ],
          ),
        ),
        child: const Stack(
          children: [
            Positioned(
              left: 2,
              child: Icon(
                Icons.add,
                color: Colors.black,
                size: 18,
              ),
            ),
            Positioned(
              right: 2,
              child: Icon(
                Icons.videocam,
                color: Colors.white,
                size: 16,
              ),
            ),
          ],
        ),
      ),
    );
  }
}