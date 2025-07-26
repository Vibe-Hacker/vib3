import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:video_player/video_player.dart';
import '../../../app/theme/app_theme.dart';
import '../widgets/video_player_widget.dart';
import '../widgets/video_sidebar.dart';
import '../widgets/video_bottom_section.dart';

class ReelsScreen extends StatefulWidget {
  const ReelsScreen({Key? key}) : super(key: key);

  @override
  State<ReelsScreen> createState() => _ReelsScreenState();
}

class _ReelsScreenState extends State<ReelsScreen> {
  final PageController _pageController = PageController();
  int _currentIndex = 0;
  final List<VideoPlayerController> _controllers = [];
  
  // Sample video data - replace with actual data
  final List<Map<String, dynamic>> _videos = [
    {
      'id': '1',
      'url': 'https://flutter.github.io/assets-for-api-docs/assets/videos/butterfly.mp4',
      'username': 'flutter_dev',
      'description': 'Check out this amazing Flutter animation! 🦋 #flutter #coding',
      'musicName': 'Original Sound - Flutter Dev',
      'likes': 52300,
      'comments': 1230,
      'shares': 450,
      'userAvatar': 'https://i.pravatar.cc/150?img=1',
    },
    {
      'id': '2',
      'url': 'https://flutter.github.io/assets-for-api-docs/assets/videos/bee.mp4',
      'username': 'nature_lover',
      'description': 'Beautiful bee in slow motion 🐝 #nature #wildlife',
      'musicName': 'Peaceful Nature Sounds',
      'likes': 89200,
      'comments': 3420,
      'shares': 1200,
      'userAvatar': 'https://i.pravatar.cc/150?img=2',
    },
  ];
  
  @override
  void initState() {
    super.initState();
    _initializeVideos();
  }
  
  @override
  void dispose() {
    for (var controller in _controllers) {
      controller.dispose();
    }
    _pageController.dispose();
    super.dispose();
  }
  
  void _initializeVideos() {
    for (var video in _videos) {
      final controller = VideoPlayerController.network(video['url'])
        ..initialize().then((_) {
          setState(() {});
        });
      _controllers.add(controller);
    }
    
    // Play first video
    if (_controllers.isNotEmpty) {
      _controllers[0].play();
      _controllers[0].setLooping(true);
    }
  }
  
  void _onPageChanged(int index) {
    // Pause previous video
    if (_currentIndex < _controllers.length) {
      _controllers[_currentIndex].pause();
    }
    
    // Play current video
    if (index < _controllers.length) {
      _controllers[index].play();
      _controllers[index].setLooping(true);
    }
    
    setState(() {
      _currentIndex = index;
    });
    
    // Haptic feedback
    HapticFeedback.lightImpact();
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // Video Feed
          PageView.builder(
            controller: _pageController,
            scrollDirection: Axis.vertical,
            onPageChanged: _onPageChanged,
            itemCount: _videos.length,
            itemBuilder: (context, index) {
              final video = _videos[index];
              final controller = _controllers[index];
              
              return Stack(
                fit: StackFit.expand,
                children: [
                  // Video Player
                  VideoPlayerWidget(
                    controller: controller,
                    onTap: () {
                      setState(() {
                        if (controller.value.isPlaying) {
                          controller.pause();
                        } else {
                          controller.play();
                        }
                      });
                    },
                  ),
                  
                  // Gradient Overlay
                  Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          Colors.transparent,
                          Colors.transparent,
                          Colors.black.withOpacity(0.3),
                          Colors.black.withOpacity(0.5),
                        ],
                        stops: const [0.0, 0.6, 0.8, 1.0],
                      ),
                    ),
                  ),
                  
                  // Content Overlay
                  Positioned.fill(
                    child: SafeArea(
                      child: Column(
                        children: [
                          // Top Bar
                          _buildTopBar(),
                          
                          // Spacer
                          const Spacer(),
                          
                          // Bottom Content
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              // Video Info
                              Expanded(
                                child: VideoBottomSection(
                                  username: video['username'],
                                  description: video['description'],
                                  musicName: video['musicName'],
                                  onMusicTap: () {
                                    // TODO: Navigate to music/sound page
                                  },
                                  onProfileTap: () {
                                    // TODO: Navigate to user profile
                                  },
                                ),
                              ),
                              
                              // Sidebar Actions
                              VideoSidebar(
                                userAvatar: video['userAvatar'],
                                likes: video['likes'],
                                comments: video['comments'],
                                shares: video['shares'],
                                isLiked: false, // TODO: Track like state
                                isFollowing: false, // TODO: Track follow state
                                onLikeTap: () {
                                  HapticFeedback.mediumImpact();
                                  // TODO: Handle like
                                },
                                onCommentTap: () {
                                  // TODO: Show comments bottom sheet
                                },
                                onShareTap: () {
                                  // TODO: Show share options
                                },
                                onProfileTap: () {
                                  // TODO: Navigate to profile
                                },
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              );
            },
          ),
          
          // Play/Pause Indicator
          if (_currentIndex < _controllers.length)
            Center(
              child: AnimatedOpacity(
                opacity: _controllers[_currentIndex].value.isPlaying ? 0.0 : 1.0,
                duration: const Duration(milliseconds: 200),
                child: Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.5),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.play_arrow_rounded,
                    color: Colors.white,
                    size: 50,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
  
  Widget _buildTopBar() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          TextButton(
            onPressed: () {
              // TODO: Switch to following feed
            },
            child: Text(
              'Following',
              style: TextStyle(
                color: Colors.white.withOpacity(0.7),
                fontSize: 16,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          const SizedBox(width: 16),
          Container(
            height: 20,
            width: 1,
            color: Colors.white.withOpacity(0.3),
          ),
          const SizedBox(width: 16),
          TextButton(
            onPressed: () {
              // Already on For You
            },
            child: const Text(
              'For You',
              style: TextStyle(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
    );
  }
}