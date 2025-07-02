import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../services/search_service.dart';
import '../models/video.dart';
import '../models/user.dart';
import '../widgets/video_grid_item.dart';
import 'profile_screen.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> with TickerProviderStateMixin {
  final TextEditingController _searchController = TextEditingController();
  late TabController _tabController;
  
  List<Video> _searchVideos = [];
  List<User> _searchUsers = [];
  List<String> _searchHashtags = [];
  List<String> _trendingHashtags = [];
  List<Video> _trendingVideos = [];
  
  bool _isSearching = false;
  bool _hasSearched = false;
  String _currentQuery = '';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadTrendingContent();
  }

  @override
  void dispose() {
    _searchController.dispose();
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadTrendingContent() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final token = authProvider.authToken;
    
    if (token != null) {
      final trending = await SearchService.getTrendingContent(token);
      setState(() {
        _trendingHashtags = trending['hashtags'] ?? [];
        _trendingVideos = trending['videos'] ?? [];
      });
    }
  }

  Future<void> _performSearch(String query) async {
    if (query.trim().isEmpty) return;

    setState(() {
      _isSearching = true;
      _currentQuery = query;
    });

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final token = authProvider.authToken;
    
    if (token != null) {
      final results = await SearchService.search(query, token);
      setState(() {
        _searchVideos = results['videos'] ?? [];
        _searchUsers = results['users'] ?? [];
        _searchHashtags = results['hashtags'] ?? [];
        _hasSearched = true;
      });
    }

    setState(() {
      _isSearching = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        elevation: 0,
        title: Container(
          height: 40,
          decoration: BoxDecoration(
            color: Colors.grey[900],
            borderRadius: BorderRadius.circular(20),
          ),
          child: TextField(
            controller: _searchController,
            style: const TextStyle(color: Colors.white),
            decoration: InputDecoration(
              hintText: 'Search videos, users, hashtags...',
              hintStyle: TextStyle(color: Colors.grey[500]),
              prefixIcon: const Icon(Icons.search, color: Colors.grey),
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(vertical: 10),
              suffixIcon: _searchController.text.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.clear, color: Colors.grey),
                      onPressed: () {
                        _searchController.clear();
                        setState(() {
                          _hasSearched = false;
                          _currentQuery = '';
                        });
                      },
                    )
                  : null,
            ),
            onSubmitted: _performSearch,
            onChanged: (value) {
              setState(() {});
            },
          ),
        ),
      ),
      body: _hasSearched ? _buildSearchResults() : _buildDiscoverContent(),
    );
  }

  Widget _buildDiscoverContent() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Trending hashtags
          if (_trendingHashtags.isNotEmpty) ...[
            const Text(
              'Trending hashtags',
              style: TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _trendingHashtags.map((hashtag) {
                return GestureDetector(
                  onTap: () => _performSearch(hashtag),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 8,
                    ),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFF0080).withOpacity(0.2),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: const Color(0xFFFF0080).withOpacity(0.5),
                      ),
                    ),
                    child: Text(
                      '#$hashtag',
                      style: const TextStyle(
                        color: Color(0xFFFF0080),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
            const SizedBox(height: 24),
          ],

          // Trending videos
          if (_trendingVideos.isNotEmpty) ...[
            const Text(
              'Trending videos',
              style: TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                childAspectRatio: 0.7,
                crossAxisSpacing: 8,
                mainAxisSpacing: 8,
              ),
              itemCount: _trendingVideos.length > 6 ? 6 : _trendingVideos.length,
              itemBuilder: (context, index) {
                return VideoGridItem(video: _trendingVideos[index]);
              },
            ),
          ],

          // Search suggestions
          const SizedBox(height: 24),
          const Text(
            'Popular searches',
            style: TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 12),
          ...[
            'dance',
            'funny',
            'cooking',
            'pets',
            'music',
            'art',
            'fitness',
            'travel',
          ].map((suggestion) {
            return ListTile(
              leading: const Icon(Icons.trending_up, color: Colors.grey),
              title: Text(
                suggestion,
                style: const TextStyle(color: Colors.white),
              ),
              onTap: () => _performSearch(suggestion),
            );
          }).toList(),
        ],
      ),
    );
  }

  Widget _buildSearchResults() {
    return Column(
      children: [
        // Search info
        Container(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Text(
                'Results for "$_currentQuery"',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const Spacer(),
              if (_isSearching)
                const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                    color: Color(0xFFFF0080),
                    strokeWidth: 2,
                  ),
                ),
            ],
          ),
        ),

        // Tabs
        TabBar(
          controller: _tabController,
          indicatorColor: const Color(0xFFFF0080),
          labelColor: const Color(0xFFFF0080),
          unselectedLabelColor: Colors.grey,
          tabs: [
            Tab(text: 'Videos (${_searchVideos.length})'),
            Tab(text: 'Users (${_searchUsers.length})'),
            Tab(text: 'Hashtags (${_searchHashtags.length})'),
          ],
        ),

        // Tab content
        Expanded(
          child: TabBarView(
            controller: _tabController,
            children: [
              _buildVideosTab(),
              _buildUsersTab(),
              _buildHashtagsTab(),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildVideosTab() {
    if (_searchVideos.isEmpty) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.video_library_outlined, size: 64, color: Colors.grey),
            SizedBox(height: 16),
            Text(
              'No videos found',
              style: TextStyle(color: Colors.grey, fontSize: 16),
            ),
          ],
        ),
      );
    }

    return GridView.builder(
      padding: const EdgeInsets.all(16),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 0.7,
        crossAxisSpacing: 8,
        mainAxisSpacing: 8,
      ),
      itemCount: _searchVideos.length,
      itemBuilder: (context, index) {
        return VideoGridItem(video: _searchVideos[index]);
      },
    );
  }

  Widget _buildUsersTab() {
    if (_searchUsers.isEmpty) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.person_outline, size: 64, color: Colors.grey),
            SizedBox(height: 16),
            Text(
              'No users found',
              style: TextStyle(color: Colors.grey, fontSize: 16),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _searchUsers.length,
      itemBuilder: (context, index) {
        final user = _searchUsers[index];
        return ListTile(
          leading: CircleAvatar(
            backgroundColor: const Color(0xFFFF0080),
            child: user.profileImageUrl != null
                ? ClipOval(
                    child: Image.network(
                      user.profileImageUrl!,
                      width: 40,
                      height: 40,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) {
                        return Text(
                          user.username[0].toUpperCase(),
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                          ),
                        );
                      },
                    ),
                  )
                : Text(
                    user.username[0].toUpperCase(),
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
          ),
          title: Text(
            '@${user.username}',
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.bold,
            ),
          ),
          subtitle: Text(
            user.bio ?? 'No bio',
            style: TextStyle(color: Colors.grey[400]),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          trailing: Text(
            '${user.followersCount} followers',
            style: TextStyle(color: Colors.grey[400], fontSize: 12),
          ),
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => ProfileScreen(userId: user.id),
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildHashtagsTab() {
    if (_searchHashtags.isEmpty) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.tag, size: 64, color: Colors.grey),
            SizedBox(height: 16),
            Text(
              'No hashtags found',
              style: TextStyle(color: Colors.grey, fontSize: 16),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _searchHashtags.length,
      itemBuilder: (context, index) {
        final hashtag = _searchHashtags[index];
        return ListTile(
          leading: Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: const Color(0xFFFF0080).withOpacity(0.2),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.tag,
              color: Color(0xFFFF0080),
            ),
          ),
          title: Text(
            '#$hashtag',
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.bold,
            ),
          ),
          subtitle: Text(
            'Trending hashtag',
            style: TextStyle(color: Colors.grey[400]),
          ),
          onTap: () => _performSearch('#$hashtag'),
        );
      },
    );
  }
}