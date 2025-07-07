import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/video_provider.dart';
import '../widgets/video_feed.dart';

class WebHomeScreen extends StatefulWidget {
  const WebHomeScreen({super.key});

  @override
  State<WebHomeScreen> createState() => _WebHomeScreenState();
}

class _WebHomeScreenState extends State<WebHomeScreen> {
  int _selectedIndex = 0;
  int _selectedTab = 0; // 0: Home, 1: Squad, 2: Pulse Feed, 3: Discover, 4: Vibing
  
  final List<String> _tabTitles = ['Home', 'Squad', 'Pulse Feed', 'Discover', 'Vibing'];
  
  final List<NavigationItem> _navigationItems = [
    NavigationItem(icon: Icons.star, label: 'Vibe Rooms'),
    NavigationItem(icon: Icons.live_tv, label: 'Live'),
    NavigationItem(icon: Icons.upload, label: 'Upload'),
    NavigationItem(icon: Icons.create, label: 'VIB3 Creations'),
    NavigationItem(icon: Icons.star, label: 'Challenges'),
    NavigationItem(icon: Icons.people, label: 'Collaborate'),
    NavigationItem(icon: Icons.games, label: 'VIB3 Game', isPink: true),
    NavigationItem(icon: Icons.notifications, label: 'Activity'),
    NavigationItem(icon: Icons.message, label: 'Messages'),
    NavigationItem(icon: Icons.person, label: 'Profile'),
    NavigationItem(icon: Icons.monetization_on, label: 'Creator Fund'),
    NavigationItem(icon: Icons.shopping_cart, label: 'Shop'),
    NavigationItem(icon: Icons.analytics, label: 'Analytics'),
    NavigationItem(icon: Icons.battery_charging_full, label: 'Energy Meter'),
  ];

  @override
  void initState() {
    super.initState();
    print('🌐 WebHomeScreen initialized');
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final videoProvider = Provider.of<VideoProvider>(context, listen: false);
      
      print('🔐 Auth status: ${authProvider.isAuthenticated}');
      print('🎬 Loading videos...');
      
      if (authProvider.isAuthenticated && authProvider.authToken != null) {
        videoProvider.loadAllVideos(authProvider.authToken!);
      }
    });
  }

  Widget _buildSidebar() {
    return Container(
      width: 280,
      color: const Color(0xFF1A1A2E),
      child: Column(
        children: [
          // VIB3 Logo
          Container(
            padding: const EdgeInsets.all(20),
            child: Row(
              children: [
                ShaderMask(
                  shaderCallback: (bounds) => const LinearGradient(
                    colors: [Color(0xFF00CED1), Color(0xFFFF0080)],
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
              ],
            ),
          ),
          
          // Search Bar
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: TextField(
              decoration: InputDecoration(
                hintText: 'Search',
                hintStyle: TextStyle(color: Colors.grey[600]),
                filled: true,
                fillColor: Colors.black26,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: BorderSide.none,
                ),
                prefixIcon: Icon(Icons.search, color: Colors.grey[600]),
              ),
            ),
          ),
          
          const SizedBox(height: 20),
          
          // Navigation Items
          Expanded(
            child: ListView.builder(
              itemCount: _navigationItems.length,
              itemBuilder: (context, index) {
                final item = _navigationItems[index];
                final isSelected = _selectedIndex == index;
                
                return ListTile(
                  leading: Icon(
                    item.icon,
                    color: item.isPink 
                      ? const Color(0xFFFF0080)
                      : isSelected 
                        ? const Color(0xFF00CED1) 
                        : Colors.grey[400],
                  ),
                  title: Text(
                    item.label,
                    style: TextStyle(
                      color: item.isPink 
                        ? const Color(0xFFFF0080)
                        : isSelected 
                          ? Colors.white 
                          : Colors.grey[400],
                      fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                    ),
                  ),
                  tileColor: isSelected ? Colors.white10 : null,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                  onTap: () {
                    setState(() {
                      _selectedIndex = index;
                    });
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMainContent() {
    return Column(
      children: [
        // Gradient Header
        Container(
          height: 80,
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFF00CED1), Color(0xFFFF0080)],
              begin: Alignment.centerLeft,
              end: Alignment.centerRight,
            ),
          ),
          child: const Center(
            child: Text(
              'Welcome to VIB3 - Where Creativity Vibes',
              style: TextStyle(
                color: Colors.white,
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ),
        
        // Tab Navigation
        Container(
          height: 60,
          color: Colors.black87,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(_tabTitles.length, (index) {
              final isSelected = _selectedTab == index;
              return Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: TextButton.icon(
                  onPressed: () {
                    setState(() {
                      _selectedTab = index;
                    });
                  },
                  icon: Icon(
                    _getTabIcon(index),
                    color: isSelected ? const Color(0xFF00CED1) : Colors.grey[400],
                  ),
                  label: Text(
                    _tabTitles[index],
                    style: TextStyle(
                      color: isSelected ? Colors.white : Colors.grey[400],
                      fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                    ),
                  ),
                  style: TextButton.styleFrom(
                    backgroundColor: isSelected ? Colors.white10 : null,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(20),
                    ),
                  ),
                ),
              );
            }),
          ),
        ),
        
        // Video Content Area
        Expanded(
          child: Container(
            color: Colors.black,
            child: VideoFeed(
              feedType: _getFeedType(),
            ),
          ),
        ),
      ],
    );
  }

  IconData _getTabIcon(int index) {
    switch (index) {
      case 0: return Icons.home;
      case 1: return Icons.people;
      case 2: return Icons.flash_on;
      case 3: return Icons.explore;
      case 4: return Icons.star;
      default: return Icons.home;
    }
  }

  FeedType _getFeedType() {
    switch (_selectedTab) {
      case 0: // Home
        return FeedType.forYou;
      case 1: // Squad
        return FeedType.following;
      case 3: // Discover
        return FeedType.discover;
      default:
        return FeedType.forYou;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Row(
        children: [
          _buildSidebar(),
          Expanded(
            child: _buildMainContent(),
          ),
        ],
      ),
    );
  }
}

class NavigationItem {
  final IconData icon;
  final String label;
  final bool isPink;

  NavigationItem({
    required this.icon,
    required this.label,
    this.isPink = false,
  });
}