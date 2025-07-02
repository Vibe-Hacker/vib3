import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../providers/auth_provider.dart';
import '../providers/video_provider.dart';
import '../widgets/video_feed.dart';
import '../config/app_config.dart';
import 'profile_screen.dart';
import 'search_screen.dart';
import 'upload_screen.dart';
import 'notifications_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;
  String apiTestResult = '';

  @override
  void initState() {
    super.initState();
    // Test API connection immediately
    _testApiConnection();
    
    // Load videos when screen loads
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final user = authProvider.currentUser;
      final token = authProvider.authToken;
      
      print('HomeScreen: User = ${user?.username}, Token = ${token != null ? 'Available' : 'NULL'}');
      
      if (token != null) {
        print('HomeScreen: Loading videos...');
        Provider.of<VideoProvider>(context, listen: false).loadAllVideos(token);
      } else {
        print('HomeScreen: No token available, loading videos without auth...');
        // Try loading videos without authentication
        Provider.of<VideoProvider>(context, listen: false).loadAllVideos('no-token');
      }
    });
  }

  Future<void> _testApiConnection() async {
    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final token = authProvider.authToken;
      
      final response = await http.get(
        Uri.parse('${AppConfig.baseUrl}/feed'),
        headers: {
          'Content-Type': 'application/json',
          if (token != null) 'Authorization': 'Bearer $token',
        },
      );
      
      // Parse JSON to analyze structure
      final dynamic responseData = jsonDecode(response.body);
      String analysis = '';
      
      if (responseData is Map<String, dynamic>) {
        analysis += 'Type: Object\n';
        analysis += 'Keys: ${responseData.keys.join(', ')}\n';
        
        if (responseData.containsKey('videos')) {
          final videos = responseData['videos'];
          if (videos is List && videos.isNotEmpty) {
            analysis += 'Videos found: ${videos.length}\n';
            analysis += 'First video keys: ${videos[0].keys.join(', ')}\n';
          }
        }
      } else if (responseData is List) {
        analysis += 'Array with ${responseData.length} videos\n\n';
        if (responseData.isNotEmpty && responseData[0] is Map) {
          final firstVideo = responseData[0] as Map<String, dynamic>;
          analysis += 'VIDEO FIELDS:\n';
          firstVideo.forEach((key, value) {
            analysis += '$key: ${value.toString().substring(0, value.toString().length > 30 ? 30 : value.toString().length)}...\n';
          });
        }
      }
      
      setState(() {
        apiTestResult = '''
Status: ${response.statusCode}
Token: ${token != null ? 'Present' : 'Missing'}

$analysis
''';
      });
    } catch (e) {
      setState(() {
        apiTestResult = 'API Test Error: $e';
      });
    }
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
            children: [
              const VideoFeed(),
              const SearchScreen(),
              const UploadScreen(),
              const NotificationsScreen(),
              const ProfileScreen(),
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
                  _buildNavItem(Icons.search, 'Discover', 1),
                  _buildNavItem(Icons.add_box, 'Create', 2),
                  _buildNavItem(Icons.notifications, 'Notifications', 3),
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