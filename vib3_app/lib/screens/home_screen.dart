import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:provider/provider.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../providers/auth_provider.dart';
import '../providers/video_provider.dart';
import '../widgets/video_feed.dart';
import '../widgets/tabbed_video_feed.dart';
import '../widgets/tabbed_video_feed_v2.dart';
import '../widgets/video_feed_components/migration_wrapper.dart';
import '../config/app_config.dart';
import '../core/config/feature_flags.dart';
import '../services/backend_health_service.dart';
import '../services/video_player_manager.dart';
import 'profile_screen.dart';
import 'search_screen.dart';
import 'upload_screen.dart';
import 'upload_flow_screen.dart';
import 'notifications_screen.dart';
import 'test_video_screen.dart';

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
    // Check backend health and test API connection
    _initializeApp();
    
    // Load videos when screen loads
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final user = authProvider.currentUser;
      final token = authProvider.authToken;
      
      print('HomeScreen: User = ${user?.username}, Token = ${token != null ? 'Available' : 'NULL'}');
      
      if (token != null) {
        print('HomeScreen: Loading videos...');
        final videoProvider = Provider.of<VideoProvider>(context, listen: false);
        videoProvider.loadAllVideos(token);
        // Initialize likes and follows
        videoProvider.initializeLikesAndFollows(token);
      } else {
        print('HomeScreen: No token available, loading videos without auth...');
        // Try loading videos without authentication
        Provider.of<VideoProvider>(context, listen: false).loadAllVideos('no-token');
      }
    });
  }

  Future<void> _initializeApp() async {
    // Check backend health first
    await BackendHealthService.checkBackendHealth();
    
    // Then test API connection
    _testApiConnection();
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
      
      if (mounted) {
        setState(() {
          apiTestResult = '''
Status: ${response.statusCode}
Token: ${token != null ? 'Present' : 'Missing'}

$analysis
''';
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          apiTestResult = 'API Test Error: $e';
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: SafeArea(
        bottom: false, // Don't add padding at bottom
        child: IndexedStack(
          index: _currentIndex,
          children: [
            // Use new architecture if feature flag is enabled
            FeatureFlags.useNewVideoArchitecture
                ? const TabbedVideoFeedV2()
                : VideoFeedMigrationWrapper(
                    isVisible: _currentIndex == 0,
                    useNewArchitecture: VideoFeedConfig.useNewArchitecture,
                  ),
            const SearchScreen(),
            const UploadFlowScreen(),
            const NotificationsScreen(),
            const ProfileScreen(),
          ],
        ),
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          border: Border(
            top: BorderSide(color: Colors.grey[800]!, width: 0.5),
          ),
        ),
        child: BottomNavigationBar(
          currentIndex: _currentIndex,
          onTap: (index) async {
            // Stop video playback when navigating away from home (index 0)
            if (_currentIndex == 0 && index != 0) {
              // Notify video feed to pause
              Provider.of<VideoProvider>(context, listen: false).pauseCurrentVideo();
              // Clean up video resources properly when leaving video feed
              await VideoPlayerManager.instance.pauseAllVideos();
              // Clear init queue to prevent pending initializations
              VideoPlayerManager.instance.clearInitQueue();
            }
            
            // Clean up all video resources when navigating to create
            if (index == 2) {
              await VideoPlayerManager.nuclearCleanup();
              
              if (mounted) {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => const UploadFlowScreen(),
                  ),
                );
              }
              return; // Don't update index for create button
            }
            
            // Clean up when navigating to/from profile (index 4)
            if ((_currentIndex == 4 && index != 4) || (_currentIndex != 4 && index == 4)) {
              // Clear any pending video initializations
              VideoPlayerManager.instance.clearInitQueue();
              // Pause all videos to prevent disposed controller access
              await VideoPlayerManager.instance.pauseAllVideos();
            }
            
            setState(() {
              _currentIndex = index;
            });
          },
          type: BottomNavigationBarType.fixed,
          backgroundColor: Colors.black,
          selectedItemColor: const Color(0xFF00CED1),
          unselectedItemColor: Colors.grey,
          showSelectedLabels: false,
          showUnselectedLabels: false,
          elevation: 0,
          items: const [
            BottomNavigationBarItem(icon: Icon(Icons.home, size: 24), label: 'Home'),
            BottomNavigationBarItem(icon: Icon(Icons.search, size: 24), label: 'Discover'),
            BottomNavigationBarItem(icon: Icon(Icons.add_box, size: 24), label: 'Create'),
            BottomNavigationBarItem(icon: Icon(Icons.notifications, size: 24), label: 'Notifications'),
            BottomNavigationBarItem(icon: Icon(Icons.person, size: 24), label: 'Profile'),
          ],
        ),
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
        child: isSelected
            ? ShaderMask(
                shaderCallback: (bounds) => const LinearGradient(
                  colors: [
                    Color(0xFF00CED1), // Cyan
                    Color(0xFF1E90FF), // Blue
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ).createShader(bounds),
                child: Icon(
                  icon,
                  color: Colors.white,
                  size: 28,
                ),
              )
            : Icon(
                icon,
                color: Colors.grey,
                size: 28,
              ),
      ),
    );
  }

}