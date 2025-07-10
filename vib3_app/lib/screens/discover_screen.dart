import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'hashtag_challenge_screen.dart';

class DiscoverScreen extends StatefulWidget {
  const DiscoverScreen({super.key});
  
  @override
  State<DiscoverScreen> createState() => _DiscoverScreenState();
}

class _DiscoverScreenState extends State<DiscoverScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';
  
  // Trending hashtags
  final List<TrendingHashtag> _trendingHashtags = [
    TrendingHashtag(
      hashtag: 'VIB3Dance',
      count: 2500000,
      trend: TrendDirection.up,
      category: 'Dance',
    ),
    TrendingHashtag(
      hashtag: 'FlipTheSwitch',
      count: 1800000,
      trend: TrendDirection.up,
      category: 'Comedy',
    ),
    TrendingHashtag(
      hashtag: 'LearnOnVIB3',
      count: 950000,
      trend: TrendDirection.same,
      category: 'Education',
    ),
    TrendingHashtag(
      hashtag: 'FoodHacks',
      count: 750000,
      trend: TrendDirection.up,
      category: 'Food',
    ),
    TrendingHashtag(
      hashtag: 'OutfitOfTheDay',
      count: 680000,
      trend: TrendDirection.down,
      category: 'Fashion',
    ),
    TrendingHashtag(
      hashtag: 'PetTricks',
      count: 520000,
      trend: TrendDirection.up,
      category: 'Pets',
    ),
  ];
  
  // Active challenges
  final List<Challenge> _activeChallenges = [
    Challenge(
      id: '1',
      title: 'Dance Battle 2024',
      hashtag: 'DanceBattle2024',
      description: 'Show your best dance moves!',
      prize: '\$10,000',
      endDate: DateTime.now().add(const Duration(days: 5)),
      participants: 125000,
      sponsor: 'VIB3 Official',
      coverImage: 'dance_battle',
    ),
    Challenge(
      id: '2',
      title: 'Comedy Kings',
      hashtag: 'ComedyKings',
      description: 'Make everyone laugh with your comedy skit',
      prize: '\$5,000',
      endDate: DateTime.now().add(const Duration(days: 10)),
      participants: 89000,
      sponsor: 'Laugh Factory',
      coverImage: 'comedy',
    ),
    Challenge(
      id: '3',
      title: 'Cooking Masters',
      hashtag: 'CookingMasters',
      description: '60-second cooking tips and recipes',
      prize: 'Kitchen Set',
      endDate: DateTime.now().add(const Duration(days: 7)),
      participants: 45000,
      sponsor: 'Chef\'s Choice',
      coverImage: 'cooking',
    ),
  ];
  
  // Categories
  final List<DiscoverCategory> _categories = [
    DiscoverCategory(
      name: 'Dance',
      icon: Icons.music_note,
      color: const Color(0xFFFF0080),
    ),
    DiscoverCategory(
      name: 'Comedy',
      icon: Icons.sentiment_very_satisfied,
      color: const Color(0xFFFFD700),
    ),
    DiscoverCategory(
      name: 'Education',
      icon: Icons.school,
      color: const Color(0xFF00CED1),
    ),
    DiscoverCategory(
      name: 'Food',
      icon: Icons.restaurant,
      color: const Color(0xFFFF6347),
    ),
    DiscoverCategory(
      name: 'Fashion',
      icon: Icons.checkroom,
      color: const Color(0xFFDA70D6),
    ),
    DiscoverCategory(
      name: 'Sports',
      icon: Icons.sports_basketball,
      color: const Color(0xFF32CD32),
    ),
    DiscoverCategory(
      name: 'Pets',
      icon: Icons.pets,
      color: const Color(0xFFFF8C00),
    ),
    DiscoverCategory(
      name: 'Gaming',
      icon: Icons.videogame_asset,
      color: const Color(0xFF9370DB),
    ),
  ];
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        elevation: 0,
        title: const Text(
          'Discover',
          style: TextStyle(
            color: Colors.white,
            fontSize: 24,
            fontWeight: FontWeight.bold,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.qr_code_scanner, color: Colors.white),
            onPressed: () {
              // Open QR scanner
            },
          ),
        ],
      ),
      body: CustomScrollView(
        slivers: [
          // Search bar
          SliverToBoxAdapter(
            child: Container(
              padding: const EdgeInsets.all(16),
              child: TextField(
                controller: _searchController,
                onChanged: (value) {
                  setState(() {
                    _searchQuery = value;
                  });
                },
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  hintText: 'Search hashtags, sounds, effects...',
                  hintStyle: const TextStyle(color: Colors.white54),
                  prefixIcon: const Icon(Icons.search, color: Colors.white54),
                  filled: true,
                  fillColor: Colors.white.withOpacity(0.1),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(30),
                    borderSide: BorderSide.none,
                  ),
                  suffixIcon: _searchQuery.isNotEmpty
                      ? IconButton(
                          icon: const Icon(Icons.clear, color: Colors.white54),
                          onPressed: () {
                            _searchController.clear();
                            setState(() {
                              _searchQuery = '';
                            });
                          },
                        )
                      : null,
                ),
              ),
            ),
          ),
          
          // Categories
          SliverToBoxAdapter(
            child: Container(
              height: 100,
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                itemCount: _categories.length,
                itemBuilder: (context, index) {
                  final category = _categories[index];
                  return GestureDetector(
                    onTap: () {
                      // Navigate to category
                      _navigateToCategory(category);
                    },
                    child: Container(
                      width: 80,
                      margin: const EdgeInsets.only(right: 12),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Container(
                            width: 60,
                            height: 60,
                            decoration: BoxDecoration(
                              color: category.color.withOpacity(0.2),
                              shape: BoxShape.circle,
                            ),
                            child: Icon(
                              category.icon,
                              color: category.color,
                              size: 30,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            category.name,
                            style: const TextStyle(
                              color: Colors.white70,
                              fontSize: 12,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
          ),
          
          // Active Challenges
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Active Challenges 🔥',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      TextButton(
                        onPressed: () {
                          // See all challenges
                        },
                        child: const Text(
                          'See All',
                          style: TextStyle(
                            color: Color(0xFF00CED1),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    height: 200,
                    child: ListView.builder(
                      scrollDirection: Axis.horizontal,
                      itemCount: _activeChallenges.length,
                      itemBuilder: (context, index) {
                        final challenge = _activeChallenges[index];
                        return GestureDetector(
                          onTap: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => HashtagChallengeScreen(
                                  hashtag: challenge.hashtag,
                                ),
                              ),
                            );
                          },
                          child: Container(
                            width: 300,
                            margin: const EdgeInsets.only(right: 16),
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(12),
                              gradient: LinearGradient(
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                                colors: [
                                  Colors.primaries[index % Colors.primaries.length],
                                  Colors.primaries[(index + 1) % Colors.primaries.length],
                                ],
                              ),
                            ),
                            child: Stack(
                              children: [
                                // Overlay gradient
                                Container(
                                  decoration: BoxDecoration(
                                    borderRadius: BorderRadius.circular(12),
                                    gradient: LinearGradient(
                                      begin: Alignment.topCenter,
                                      end: Alignment.bottomCenter,
                                      colors: [
                                        Colors.transparent,
                                        Colors.black.withOpacity(0.8),
                                      ],
                                    ),
                                  ),
                                ),
                                
                                // Content
                                Padding(
                                  padding: const EdgeInsets.all(16),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    mainAxisAlignment: MainAxisAlignment.end,
                                    children: [
                                      // Prize badge
                                      if (challenge.prize != null)
                                        Container(
                                          padding: const EdgeInsets.symmetric(
                                            horizontal: 12,
                                            vertical: 6,
                                          ),
                                          decoration: BoxDecoration(
                                            color: Colors.yellow,
                                            borderRadius: BorderRadius.circular(20),
                                          ),
                                          child: Text(
                                            '🏆 ${challenge.prize}',
                                            style: const TextStyle(
                                              color: Colors.black,
                                              fontSize: 12,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                        ),
                                      const SizedBox(height: 8),
                                      
                                      // Title
                                      Text(
                                        challenge.title,
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontSize: 20,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                      
                                      // Hashtag
                                      Text(
                                        '#${challenge.hashtag}',
                                        style: const TextStyle(
                                          color: Color(0xFF00CED1),
                                          fontSize: 14,
                                        ),
                                      ),
                                      
                                      const SizedBox(height: 8),
                                      
                                      // Participants
                                      Row(
                                        children: [
                                          const Icon(
                                            Icons.people,
                                            color: Colors.white70,
                                            size: 16,
                                          ),
                                          const SizedBox(width: 4),
                                          Text(
                                            '${_formatCount(challenge.participants)} joined',
                                            style: const TextStyle(
                                              color: Colors.white70,
                                              fontSize: 12,
                                            ),
                                          ),
                                          const Spacer(),
                                          // Days left
                                          Container(
                                            padding: const EdgeInsets.symmetric(
                                              horizontal: 8,
                                              vertical: 4,
                                            ),
                                            decoration: BoxDecoration(
                                              color: Colors.red.withOpacity(0.2),
                                              borderRadius: BorderRadius.circular(12),
                                            ),
                                            child: Text(
                                              '${challenge.endDate.difference(DateTime.now()).inDays}d left',
                                              style: const TextStyle(
                                                color: Colors.red,
                                                fontSize: 12,
                                                fontWeight: FontWeight.bold,
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                ],
              ),
            ),
          ),
          
          // Trending Hashtags
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Trending Hashtags 📈',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 16),
                ],
              ),
            ),
          ),
          
          // Hashtags list
          SliverList(
            delegate: SliverChildBuilderDelegate(
              (context, index) {
                final hashtag = _trendingHashtags[index];
                return ListTile(
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => HashtagChallengeScreen(
                          hashtag: hashtag.hashtag,
                        ),
                      ),
                    );
                  },
                  leading: Container(
                    width: 50,
                    height: 50,
                    decoration: BoxDecoration(
                      color: const Color(0xFF00CED1).withOpacity(0.2),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Center(
                      child: Text(
                        '${index + 1}',
                        style: const TextStyle(
                          color: Color(0xFF00CED1),
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                  title: Text(
                    '#${hashtag.hashtag}',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  subtitle: Row(
                    children: [
                      Text(
                        hashtag.category,
                        style: const TextStyle(
                          color: Colors.white54,
                          fontSize: 12,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        '${_formatCount(hashtag.count)} videos',
                        style: const TextStyle(
                          color: Colors.white54,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                  trailing: _buildTrendIcon(hashtag.trend),
                );
              },
              childCount: _trendingHashtags.length,
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildTrendIcon(TrendDirection trend) {
    switch (trend) {
      case TrendDirection.up:
        return const Icon(
          Icons.trending_up,
          color: Colors.green,
          size: 24,
        );
      case TrendDirection.down:
        return const Icon(
          Icons.trending_down,
          color: Colors.red,
          size: 24,
        );
      case TrendDirection.same:
        return const Icon(
          Icons.trending_flat,
          color: Colors.orange,
          size: 24,
        );
    }
  }
  
  String _formatCount(int count) {
    if (count >= 1000000) {
      return '${(count / 1000000).toStringAsFixed(1)}M';
    } else if (count >= 1000) {
      return '${(count / 1000).toStringAsFixed(1)}K';
    }
    return count.toString();
  }
  
  void _navigateToCategory(DiscoverCategory category) {
    // Navigate to category page
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Exploring ${category.name}'),
        backgroundColor: category.color,
      ),
    );
  }
}

class TrendingHashtag {
  final String hashtag;
  final int count;
  final TrendDirection trend;
  final String category;
  
  TrendingHashtag({
    required this.hashtag,
    required this.count,
    required this.trend,
    required this.category,
  });
}

enum TrendDirection { up, down, same }

class Challenge {
  final String id;
  final String title;
  final String hashtag;
  final String description;
  final String? prize;
  final DateTime endDate;
  final int participants;
  final String sponsor;
  final String coverImage;
  
  Challenge({
    required this.id,
    required this.title,
    required this.hashtag,
    required this.description,
    this.prize,
    required this.endDate,
    required this.participants,
    required this.sponsor,
    required this.coverImage,
  });
}

class DiscoverCategory {
  final String name;
  final IconData icon;
  final Color color;
  
  DiscoverCategory({
    required this.name,
    required this.icon,
    required this.color,
  });
}