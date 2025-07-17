import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../services/video_service.dart';
import '../services/search_service.dart';
import '../models/video_model.dart';
import '../models/user_model.dart';
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
  List<String> _trendingHashtags = ['dance', 'funny', 'viral', 'cooking', 'pets', 'music'];
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
      try {
        final trendingData = await SearchService.getTrendingContent(token);
        if (mounted) {
          setState(() {
            _trendingVideos = (trendingData['videos'] as List<Video>).take(12).toList();
            _trendingHashtags = trendingData['hashtags'] as List<String>;
          });
        }
      } catch (e) {
        print('Error loading trending content: $e');
      }
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
      try {
        // Search using SearchService
        final searchResults = await SearchService.search(query, token);
        
        if (mounted) {
          setState(() {
            _searchVideos = searchResults['videos'] as List<Video>;
            _searchUsers = searchResults['users'] as List<User>;
            _searchHashtags = searchResults['hashtags'] as List<String>;
            _hasSearched = true;
          });
        }
      } catch (e) {
        print('Search error: $e');
      }
    }

    if (mounted) {
      setState(() {
        _isSearching = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: SafeArea(
        child: Column(
          children: [
            _buildSearchHeader(),
            Expanded(
              child: _hasSearched ? _buildSearchResults() : _buildDiscoverContent(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSearchHeader() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            const Color(0xFF00CED1).withOpacity(0.1),
            const Color(0xFF1E90FF).withOpacity(0.1),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Row(
        children: [
          // Back button with VIB3 styling
          GestureDetector(
            onTap: () => Navigator.pop(context),
            child: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.3),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: const Color(0xFF00CED1).withOpacity(0.3),
                  width: 1,
                ),
              ),
              child: const Icon(
                Icons.arrow_back,
                color: Colors.white,
                size: 24,
              ),
            ),
          ),
          const SizedBox(width: 12),
          
          // Search input with VIB3 gradient styling
          Expanded(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.7),
                borderRadius: BorderRadius.circular(25),
                border: Border.all(
                  color: const Color(0xFF00CED1).withOpacity(0.3),
                  width: 1,
                ),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF00CED1).withOpacity(0.2),
                    blurRadius: 15,
                    spreadRadius: 2,
                  ),
                ],
              ),
              child: TextField(
                controller: _searchController,
                style: const TextStyle(color: Colors.white, fontSize: 16),
                decoration: InputDecoration(
                  hintText: 'Search users, videos, sounds...',
                  hintStyle: const TextStyle(color: Colors.white54),
                  border: InputBorder.none,
                  prefixIcon: const Icon(Icons.search, color: Color(0xFF00CED1)),
                  suffixIcon: _searchController.text.isNotEmpty
                      ? IconButton(
                          icon: const Icon(Icons.clear, color: Colors.white54),
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
                  if (mounted) {
                    setState(() {});
                  }
                },
              ),
            ),
          ),
        ],
      ),
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
                      gradient: LinearGradient(
                        colors: [
                          const Color(0xFF00CED1).withOpacity(0.2),
                          const Color(0xFF1E90FF).withOpacity(0.2),
                        ],
                      ),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: const Color(0xFF00CED1).withOpacity(0.5),
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFF00CED1).withOpacity(0.1),
                          blurRadius: 8,
                          spreadRadius: 1,
                        ),
                      ],
                    ),
                    child: ShaderMask(
                      shaderCallback: (bounds) => const LinearGradient(
                        colors: [Color(0xFF00CED1), Color(0xFF1E90FF)],
                      ).createShader(bounds),
                      child: Text(
                        '#$hashtag',
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w600,
                        ),
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
                return _buildVideoGridItem(_trendingVideos[index]);
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
                    color: Color(0xFF00CED1),
                    strokeWidth: 2,
                  ),
                ),
            ],
          ),
        ),

        // Tabs with VIB3 styling
        TabBar(
          controller: _tabController,
          indicatorColor: const Color(0xFF00CED1),
          labelColor: const Color(0xFF00CED1),
          unselectedLabelColor: Colors.grey,
          labelStyle: const TextStyle(fontWeight: FontWeight.w600),
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
        return _buildVideoGridItem(_searchVideos[index]);
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
            backgroundColor: const Color(0xFF00CED1),
            child: user.profilePicture != null
                ? ClipOval(
                    child: Image.network(
                      user.profilePicture!,
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
            '${user.followers} followers',
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
              gradient: LinearGradient(
                colors: [
                  const Color(0xFF00CED1).withOpacity(0.2),
                  const Color(0xFF1E90FF).withOpacity(0.2),
                ],
              ),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.tag,
              color: Color(0xFF00CED1),
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

  Widget _buildVideoGridItem(Video video) {
    return GestureDetector(
      onTap: () {
        // Navigate to video player
        // TODO: Implement video player navigation
        print('Playing video: ${video.id}');
      },
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(8),
          color: Colors.grey[900],
          border: Border.all(
            color: const Color(0xFF00CED1).withOpacity(0.2),
            width: 1,
          ),
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: Stack(
            fit: StackFit.expand,
            children: [
              // Video thumbnail
              video.thumbnailUrl != null
                  ? Image.network(
                      video.thumbnailUrl!,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) {
                        return Container(
                          color: Colors.grey[800],
                          child: const Icon(
                            Icons.video_library,
                            color: Colors.grey,
                            size: 32,
                          ),
                        );
                      },
                    )
                  : Container(
                      color: Colors.grey[800],
                      child: const Icon(
                        Icons.video_library,
                        color: Colors.grey,
                        size: 32,
                      ),
                    ),
              
              // Play button overlay
              Center(
                child: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.7),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.play_arrow,
                    color: Colors.white,
                    size: 24,
                  ),
                ),
              ),
              
              // Video info overlay
              Positioned(
                bottom: 8,
                left: 8,
                right: 8,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (video.description != null && video.description!.isNotEmpty)
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.black.withOpacity(0.7),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          video.description!,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Icon(
                          Icons.favorite,
                          color: Colors.red,
                          size: 14,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          '${video.likes}',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
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
      ),
    );
  }
}