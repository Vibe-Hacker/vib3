import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'dart:async';
import '../../../app/theme/app_theme.dart';
import '../../../core/models/story_model.dart';
import '../../../core/widgets/placeholder_image.dart';

class StoryViewerScreen extends StatefulWidget {
  final List<Story> stories;
  final int initialIndex;
  
  const StoryViewerScreen({
    Key? key,
    required this.stories,
    this.initialIndex = 0,
  }) : super(key: key);

  @override
  State<StoryViewerScreen> createState() => _StoryViewerScreenState();
}

class _StoryViewerScreenState extends State<StoryViewerScreen> with TickerProviderStateMixin {
  late PageController _pageController;
  late AnimationController _progressController;
  Timer? _timer;
  
  int _currentStoryIndex = 0;
  int _currentSegmentIndex = 0;
  
  static const Duration _storyDuration = Duration(seconds: 5);
  
  @override
  void initState() {
    super.initState();
    _currentStoryIndex = widget.initialIndex;
    _pageController = PageController(initialPage: widget.initialIndex);
    _progressController = AnimationController(
      vsync: this,
      duration: _storyDuration,
    );
    
    _progressController.addStatusListener((status) {
      if (status == AnimationStatus.completed) {
        _nextSegment();
      }
    });
    
    _startStory();
  }
  
  @override
  void dispose() {
    _timer?.cancel();
    _progressController.dispose();
    _pageController.dispose();
    super.dispose();
  }
  
  void _startStory() {
    _progressController.forward(from: 0);
  }
  
  void _pauseStory() {
    _progressController.stop();
  }
  
  void _resumeStory() {
    _progressController.forward();
  }
  
  void _nextSegment() {
    final currentStory = widget.stories[_currentStoryIndex];
    
    if (_currentSegmentIndex < currentStory.segments.length - 1) {
      setState(() {
        _currentSegmentIndex++;
      });
      _startStory();
    } else {
      _nextStory();
    }
  }
  
  void _previousSegment() {
    if (_currentSegmentIndex > 0) {
      setState(() {
        _currentSegmentIndex--;
      });
      _startStory();
    } else {
      _previousStory();
    }
  }
  
  void _nextStory() {
    if (_currentStoryIndex < widget.stories.length - 1) {
      setState(() {
        _currentStoryIndex++;
        _currentSegmentIndex = 0;
      });
      _pageController.nextPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
      _startStory();
    } else {
      context.pop();
    }
  }
  
  void _previousStory() {
    if (_currentStoryIndex > 0) {
      setState(() {
        _currentStoryIndex--;
        _currentSegmentIndex = 0;
      });
      _pageController.previousPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
      _startStory();
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: GestureDetector(
        onTapDown: (details) {
          final screenWidth = MediaQuery.of(context).size.width;
          final tapPosition = details.globalPosition.dx;
          
          if (tapPosition < screenWidth * 0.3) {
            _previousSegment();
          } else if (tapPosition > screenWidth * 0.7) {
            _nextSegment();
          }
        },
        onLongPressStart: (_) => _pauseStory(),
        onLongPressEnd: (_) => _resumeStory(),
        child: Stack(
          children: [
            // Story content
            PageView.builder(
              controller: _pageController,
              onPageChanged: (index) {
                setState(() {
                  _currentStoryIndex = index;
                  _currentSegmentIndex = 0;
                });
                _startStory();
              },
              itemCount: widget.stories.length,
              itemBuilder: (context, storyIndex) {
                final story = widget.stories[storyIndex];
                final segment = story.segments[_currentSegmentIndex];
                
                return Stack(
                  fit: StackFit.expand,
                  children: [
                    // Background media
                    _buildMedia(segment),
                    
                    // Gradient overlay
                    Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [
                            Colors.black.withOpacity(0.3),
                            Colors.transparent,
                            Colors.transparent,
                            Colors.black.withOpacity(0.4),
                          ],
                          stops: const [0.0, 0.2, 0.8, 1.0],
                        ),
                      ),
                    ),
                  ],
                );
              },
            ),
            
            // Story UI overlay
            SafeArea(
              child: Column(
                children: [
                  // Progress bars
                  _buildProgressBars(),
                  
                  // Header
                  _buildHeader(),
                  
                  const Spacer(),
                  
                  // Footer
                  _buildFooter(),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildMedia(StorySegment segment) {
    if (segment.mediaUrl.startsWith('http')) {
      // Network media
      return PlaceholderImage(
        width: double.infinity,
        height: double.infinity,
        text: 'Story Media',
        backgroundColor: AppTheme.primaryColor.withOpacity(0.3),
      );
    } else {
      // Local placeholder
      return Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              AppTheme.primaryColor.withOpacity(0.8),
              AppTheme.secondaryColor.withOpacity(0.8),
            ],
          ),
        ),
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(
                Icons.auto_stories,
                size: 80,
                color: Colors.white,
              ),
              const SizedBox(height: 16),
              Text(
                segment.caption ?? 'Story',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      );
    }
  }
  
  Widget _buildProgressBars() {
    final story = widget.stories[_currentStoryIndex];
    
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      child: Row(
        children: List.generate(story.segments.length, (index) {
          return Expanded(
            child: Container(
              height: 2,
              margin: const EdgeInsets.symmetric(horizontal: 2),
              child: LinearProgressIndicator(
                value: index < _currentSegmentIndex
                    ? 1.0
                    : index == _currentSegmentIndex
                        ? _progressController.value
                        : 0.0,
                backgroundColor: Colors.white.withOpacity(0.3),
                valueColor: const AlwaysStoppedAnimation<Color>(Colors.white),
              ),
            ),
          );
        }),
      ),
    );
  }
  
  Widget _buildHeader() {
    final story = widget.stories[_currentStoryIndex];
    
    return Container(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          // Avatar
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: Colors.white, width: 2),
            ),
            child: ClipOval(
              child: story.user.profilePicture != null
                  ? PlaceholderAvatar(
                      size: 36,
                      seed: story.user.username,
                    )
                  : PlaceholderAvatar(
                      size: 36,
                      seed: story.user.username,
                    ),
            ),
          ),
          
          const SizedBox(width: 12),
          
          // Username and time
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      story.user.username,
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w600,
                        fontSize: 16,
                      ),
                    ),
                    if (story.user.isVerified) ...[
                      const SizedBox(width: 4),
                      const Icon(
                        Icons.verified,
                        color: Colors.blue,
                        size: 16,
                      ),
                    ],
                  ],
                ),
                Text(
                  _getTimeAgo(story.segments[_currentSegmentIndex].createdAt),
                  style: TextStyle(
                    color: Colors.white.withOpacity(0.7),
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          
          // Close button
          IconButton(
            onPressed: () => context.pop(),
            icon: const Icon(Icons.close, color: Colors.white),
          ),
        ],
      ),
    );
  }
  
  Widget _buildFooter() {
    final story = widget.stories[_currentStoryIndex];
    final segment = story.segments[_currentSegmentIndex];
    
    return Container(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          // Reply input
          Expanded(
            child: Container(
              height: 40,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                border: Border.all(color: Colors.white.withOpacity(0.5)),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Row(
                children: [
                  Text(
                    'Send message...',
                    style: TextStyle(
                      color: Colors.white.withOpacity(0.5),
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
            ),
          ),
          
          const SizedBox(width: 12),
          
          // Action buttons
          IconButton(
            onPressed: () {
              HapticFeedback.lightImpact();
              // TODO: Like story
            },
            icon: Icon(
              segment.isLiked ? Icons.favorite : Icons.favorite_border,
              color: segment.isLiked ? Colors.red : Colors.white,
            ),
          ),
          
          IconButton(
            onPressed: () {
              // TODO: Share story
            },
            icon: const Icon(Icons.send, color: Colors.white),
          ),
        ],
      ),
    );
  }
  
  String _getTimeAgo(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);
    
    if (difference.inMinutes < 60) {
      return '${difference.inMinutes}m';
    } else if (difference.inHours < 24) {
      return '${difference.inHours}h';
    } else {
      return '${difference.inDays}d';
    }
  }
}