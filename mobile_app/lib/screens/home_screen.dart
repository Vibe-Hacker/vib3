import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/video_provider.dart';
import '../widgets/video_feed.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;

  @override
  void initState() {
    super.initState();
    // Load videos when screen loads
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<VideoProvider>(context, listen: false).loadVideos();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // Main content
          IndexedStack(
            index: _currentIndex,
            children: const [
              VideoFeed(), // Home/Feed
              Center(child: Text('Search', style: TextStyle(color: Colors.white))),
              Center(child: Text('Upload', style: TextStyle(color: Colors.white))),
              Center(child: Text('Inbox', style: TextStyle(color: Colors.white))),
              Center(child: Text('Profile', style: TextStyle(color: Colors.white))),
            ],
          ),
          
          // Bottom navigation
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: Container(
              height: 60,
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.8),
                border: const Border(
                  top: BorderSide(color: Colors.grey, width: 0.1),
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _buildNavItem(Icons.home, 'Home', 0),
                  _buildNavItem(Icons.search, 'Search', 1),
                  _buildNavItem(Icons.add_box, 'Upload', 2),
                  _buildNavItem(Icons.inbox, 'Inbox', 3),
                  _buildNavItem(Icons.person, 'Profile', 4),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNavItem(IconData icon, String label, int index) {
    final isSelected = _currentIndex == index;
    return GestureDetector(
      onTap: () {
        setState(() {
          _currentIndex = index;
        });
      },
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Icon(
          icon,
          color: isSelected ? const Color(0xFFFF0080) : Colors.grey,
          size: 28,
        ),
      ),
    );
  }
}