import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../providers/video_provider.dart';
import '../providers/auth_provider.dart';
import '../models/video.dart';
import '../widgets/video_feed.dart';

class HashtagChallengeScreen extends StatefulWidget {
  final String hashtag;
  
  const HashtagChallengeScreen({
    super.key,
    required this.hashtag,
  });
  
  @override
  State<HashtagChallengeScreen> createState() => _HashtagChallengeScreenState();
}

class _HashtagChallengeScreenState extends State<HashtagChallengeScreen> {
  bool _isLoading = true;
  ChallengeInfo? _challengeInfo;
  List<Video> _challengeVideos = [];
  String _sortBy = 'trending';
  
  @override
  void initState() {
    super.initState();
    _loadChallengeData();
  }
  
  Future<void> _loadChallengeData() async {
    setState(() {
      _isLoading = true;
    });
    
    try {
      // Simulate loading challenge data
      await Future.delayed(const Duration(seconds: 1));
      
      setState(() {
        _challengeInfo = ChallengeInfo(
          hashtag: widget.hashtag,
          description: 'Show off your best moves with #${widget.hashtag}!',
          creatorName: '@vib3official',
          participantCount: 125000,
          viewCount: 50000000,
          isActive: true,
          prize: '\$10,000',
          endDate: DateTime.now().add(const Duration(days: 7)),
          rules: [
            'Use the official sound',
            'Include #${widget.hashtag} in your caption',
            'Be creative and have fun!',
            'Keep it family-friendly',
          ],
          featuredCreators: [
            'creator1',
            'creator2',
            'creator3',
          ],
        );
        
        // Load videos with this hashtag
        final videoProvider = context.read<VideoProvider>();
        _challengeVideos = videoProvider.videos.where((video) {
          return video.caption?.toLowerCase().contains('#${widget.hashtag.toLowerCase()}') ?? false;
        }).toList();
        
        _isLoading = false;
      });
    } catch (e) {
      print('Error loading challenge data: $e');
      setState(() {
        _isLoading = false;
      });
    }
  }
  
  void _participateInChallenge() {
    Navigator.pushNamed(
      context,
      '/video-creator',
      arguments: {
        'challengeHashtag': widget.hashtag,
        'challengeSound': _challengeInfo?.soundUrl,
      },
    );
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(
                color: Color(0xFF00CED1),
              ),
            )
          : CustomScrollView(
              slivers: [
                // Header with challenge info
                SliverAppBar(
                  expandedHeight: 300,
                  floating: false,
                  pinned: true,
                  backgroundColor: Colors.black,
                  flexibleSpace: FlexibleSpaceBar(
                    background: Stack(
                      fit: StackFit.expand,
                      children: [
                        // Gradient background
                        Container(
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              begin: Alignment.topCenter,
                              end: Alignment.bottomCenter,
                              colors: [
                                const Color(0xFF00CED1).withOpacity(0.3),
                                Colors.black,
                              ],
                            ),
                          ),
                        ),
                        
                        // Challenge info
                        Padding(
                          padding: const EdgeInsets.all(20),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.end,
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // Hashtag
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 12,
                                  vertical: 6,
                                ),
                                decoration: BoxDecoration(
                                  color: const Color(0xFF00CED1),
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: Text(
                                  '#${widget.hashtag}',
                                  style: const TextStyle(
                                    color: Colors.black,
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                              
                              const SizedBox(height: 12),
                              
                              // Description
                              Text(
                                _challengeInfo?.description ?? '',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 18,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                              
                              const SizedBox(height: 8),
                              
                              // Creator
                              Row(
                                children: [
                                  const Icon(
                                    Icons.account_circle,
                                    color: Colors.white70,
                                    size: 20,
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    'Created by ${_challengeInfo?.creatorName ?? ''}',
                                    style: const TextStyle(
                                      color: Colors.white70,
                                      fontSize: 14,
                                    ),
                                  ),
                                ],
                              ),
                              
                              const SizedBox(height: 16),
                              
                              // Stats
                              Row(
                                children: [
                                  _buildStat(
                                    icon: Icons.people,
                                    value: _formatCount(_challengeInfo?.participantCount ?? 0),
                                    label: 'Participants',
                                  ),
                                  const SizedBox(width: 24),
                                  _buildStat(
                                    icon: Icons.visibility,
                                    value: _formatCount(_challengeInfo?.viewCount ?? 0),
                                    label: 'Views',
                                  ),
                                  if (_challengeInfo?.prize != null) ...[
                                    const SizedBox(width: 24),
                                    _buildStat(
                                      icon: Icons.emoji_events,
                                      value: _challengeInfo!.prize!,
                                      label: 'Prize',
                                    ),
                                  ],
                                ],
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  leading: IconButton(
                    icon: const Icon(Icons.arrow_back, color: Colors.white),
                    onPressed: () => Navigator.pop(context),
                  ),
                  actions: [
                    IconButton(
                      icon: const Icon(Icons.share, color: Colors.white),
                      onPressed: () {
                        // Share challenge
                        _shareChallenge();
                      },
                    ),
                  ],
                ),
                
                // Challenge details
                SliverToBoxAdapter(
                  child: Container(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Rules
                        if (_challengeInfo?.rules.isNotEmpty ?? false) ...[
                          const Text(
                            'How to Participate',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 12),
                          ..._challengeInfo!.rules.map((rule) => Padding(
                            padding: const EdgeInsets.only(bottom: 8),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Icon(
                                  Icons.check_circle,
                                  color: Color(0xFF00CED1),
                                  size: 20,
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    rule,
                                    style: const TextStyle(
                                      color: Colors.white70,
                                      fontSize: 14,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          )),
                          const SizedBox(height: 20),
                        ],
                        
                        // End date
                        if (_challengeInfo?.endDate != null) ...[
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: Colors.red.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(
                                color: Colors.red.withOpacity(0.3),
                              ),
                            ),
                            child: Row(
                              children: [
                                const Icon(
                                  Icons.timer,
                                  color: Colors.red,
                                  size: 20,
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  'Ends in ${_challengeInfo!.endDate!.difference(DateTime.now()).inDays} days',
                                  style: const TextStyle(
                                    color: Colors.red,
                                    fontSize: 14,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 20),
                        ],
                        
                        // Participate button
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton.icon(
                            onPressed: _participateInChallenge,
                            icon: const Icon(Icons.videocam),
                            label: const Text(
                              'Join Challenge',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF00CED1),
                              foregroundColor: Colors.black,
                              padding: const EdgeInsets.symmetric(
                                vertical: 16,
                              ),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(30),
                              ),
                            ),
                          ),
                        ),
                        
                        const SizedBox(height: 30),
                        
                        // Sort options
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'Challenge Videos',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            PopupMenuButton<String>(
                              initialValue: _sortBy,
                              onSelected: (value) {
                                setState(() {
                                  _sortBy = value;
                                  _sortVideos();
                                });
                              },
                              itemBuilder: (context) => [
                                const PopupMenuItem(
                                  value: 'trending',
                                  child: Text('Trending'),
                                ),
                                const PopupMenuItem(
                                  value: 'recent',
                                  child: Text('Most Recent'),
                                ),
                                const PopupMenuItem(
                                  value: 'likes',
                                  child: Text('Most Liked'),
                                ),
                              ],
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 12,
                                  vertical: 6,
                                ),
                                decoration: BoxDecoration(
                                  border: Border.all(
                                    color: Colors.white30,
                                  ),
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: Row(
                                  children: [
                                    Text(
                                      _sortBy == 'trending' ? 'Trending' :
                                      _sortBy == 'recent' ? 'Recent' : 'Popular',
                                      style: const TextStyle(
                                        color: Colors.white70,
                                        fontSize: 14,
                                      ),
                                    ),
                                    const SizedBox(width: 4),
                                    const Icon(
                                      Icons.arrow_drop_down,
                                      color: Colors.white70,
                                      size: 20,
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
                
                // Videos grid
                SliverPadding(
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  sliver: _challengeVideos.isEmpty
                      ? SliverToBoxAdapter(
                          child: Center(
                            child: Padding(
                              padding: const EdgeInsets.all(40),
                              child: Column(
                                children: [
                                  Icon(
                                    Icons.videocam_off,
                                    size: 64,
                                    color: Colors.white.withOpacity(0.3),
                                  ),
                                  const SizedBox(height: 16),
                                  Text(
                                    'No videos yet',
                                    style: TextStyle(
                                      color: Colors.white.withOpacity(0.5),
                                      fontSize: 16,
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  const Text(
                                    'Be the first to join this challenge!',
                                    style: TextStyle(
                                      color: Color(0xFF00CED1),
                                      fontSize: 14,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        )
                      : SliverGrid(
                          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 3,
                            crossAxisSpacing: 4,
                            mainAxisSpacing: 4,
                            childAspectRatio: 9 / 16,
                          ),
                          delegate: SliverChildBuilderDelegate(
                            (context, index) {
                              final video = _challengeVideos[index];
                              return GestureDetector(
                                onTap: () {
                                  // Navigate to video feed with this video
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (context) => Scaffold(
                                        backgroundColor: Colors.black,
                                        body: VideoFeed(
                                          initialVideo: video,
                                        ),
                                      ),
                                    ),
                                  );
                                },
                                child: Stack(
                                  fit: StackFit.expand,
                                  children: [
                                    // Video thumbnail
                                    Container(
                                      color: Colors.grey[900],
                                      child: const Center(
                                        child: Icon(
                                          Icons.play_circle_outline,
                                          color: Colors.white54,
                                          size: 40,
                                        ),
                                      ),
                                    ),
                                    
                                    // View count
                                    Positioned(
                                      bottom: 4,
                                      left: 4,
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 6,
                                          vertical: 2,
                                        ),
                                        decoration: BoxDecoration(
                                          color: Colors.black54,
                                          borderRadius: BorderRadius.circular(4),
                                        ),
                                        child: Row(
                                          children: [
                                            const Icon(
                                              Icons.visibility,
                                              color: Colors.white,
                                              size: 12,
                                            ),
                                            const SizedBox(width: 2),
                                            Text(
                                              _formatCount(video.viewsCount),
                                              style: const TextStyle(
                                                color: Colors.white,
                                                fontSize: 10,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              );
                            },
                            childCount: _challengeVideos.length,
                          ),
                        ),
                ),
              ],
            ),
    );
  }
  
  Widget _buildStat({
    required IconData icon,
    required String value,
    required String label,
  }) {
    return Column(
      children: [
        Row(
          children: [
            Icon(icon, color: const Color(0xFF00CED1), size: 20),
            const SizedBox(width: 4),
            Text(
              value,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: const TextStyle(
            color: Colors.white54,
            fontSize: 12,
          ),
        ),
      ],
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
  
  void _sortVideos() {
    switch (_sortBy) {
      case 'recent':
        _challengeVideos.sort((a, b) => 
          b.createdAt.compareTo(a.createdAt));
        break;
      case 'likes':
        _challengeVideos.sort((a, b) => 
          b.likesCount.compareTo(a.likesCount));
        break;
      case 'trending':
      default:
        // Sort by engagement (views + likes + comments)
        _challengeVideos.sort((a, b) {
          final aEngagement = a.viewsCount + a.likesCount + a.commentsCount;
          final bEngagement = b.viewsCount + b.likesCount + b.commentsCount;
          return bEngagement.compareTo(aEngagement);
        });
    }
  }
  
  void _shareChallenge() {
    final text = 'Join the #${widget.hashtag} challenge on VIB3!';
    Clipboard.setData(ClipboardData(text: text));
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Challenge link copied!'),
        backgroundColor: Color(0xFF00CED1),
      ),
    );
  }
}

class ChallengeInfo {
  final String hashtag;
  final String description;
  final String creatorName;
  final int participantCount;
  final int viewCount;
  final bool isActive;
  final String? prize;
  final DateTime? endDate;
  final List<String> rules;
  final List<String> featuredCreators;
  final String? soundUrl;
  
  ChallengeInfo({
    required this.hashtag,
    required this.description,
    required this.creatorName,
    required this.participantCount,
    required this.viewCount,
    required this.isActive,
    this.prize,
    this.endDate,
    required this.rules,
    required this.featuredCreators,
    this.soundUrl,
  });
}