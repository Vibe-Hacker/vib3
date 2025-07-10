import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../models/live_stream.dart';
import '../services/live_stream_service.dart';
import 'live_stream_viewer_screen.dart';
import 'go_live_screen.dart';

class LiveScreen extends StatefulWidget {
  const LiveScreen({super.key});
  
  @override
  State<LiveScreen> createState() => _LiveScreenState();
}

class _LiveScreenState extends State<LiveScreen> with TickerProviderStateMixin {
  late TabController _tabController;
  List<LiveStream> _popularStreams = [];
  List<LiveStream> _followingStreams = [];
  List<Map<String, dynamic>> _categories = [];
  bool _isLoading = true;
  String? _selectedCategory;
  
  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadStreams();
    _loadCategories();
  }
  
  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }
  
  Future<void> _loadStreams() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final token = authProvider.authToken;
    
    if (token == null) return;
    
    setState(() {
      _isLoading = true;
    });
    
    try {
      final popular = await LiveStreamService.getActiveStreams(
        token: token,
        categoryId: _selectedCategory,
      );
      final following = await LiveStreamService.getFollowingStreams(
        token: token,
      );
      
      if (mounted) {
        setState(() {
          _popularStreams = popular;
          _followingStreams = following;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }
  
  Future<void> _loadCategories() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final token = authProvider.authToken;
    
    if (token == null) return;
    
    try {
      final categories = await LiveStreamService.getCategories(token);
      
      if (mounted) {
        setState(() {
          _categories = categories;
        });
      }
    } catch (e) {
      print('Error loading categories: $e');
    }
  }
  
  void _goLive() {
    HapticFeedback.mediumImpact();
    Navigator.push(
      context,
      MaterialPageRoute(builder: (context) => const GoLiveScreen()),
    ).then((_) => _loadStreams());
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: const Color(0xFF1A1A1A),
        elevation: 2,
        title: const Text(
          'LIVE',
          style: TextStyle(
            color: Colors.white,
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),
        actions: [
          IconButton(
            onPressed: _goLive,
            icon: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFFFF0080), Color(0xFFFF80FF)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(
                Icons.videocam,
                color: Colors.white,
                size: 20,
              ),
            ),
          ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(48),
          child: TabBar(
            controller: _tabController,
            indicatorColor: const Color(0xFFFF0080),
            indicatorWeight: 3,
            labelColor: Colors.white,
            unselectedLabelColor: Colors.white54,
            tabs: const [
              Tab(text: 'Popular'),
              Tab(text: 'Following'),
            ],
          ),
        ),
      ),
      body: Column(
        children: [
          // Categories
          if (_categories.isNotEmpty)
            Container(
              height: 50,
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                itemCount: _categories.length + 1,
                itemBuilder: (context, index) {
                  if (index == 0) {
                    return _buildCategoryChip(
                      id: null,
                      name: 'All',
                      icon: Icons.all_inclusive,
                    );
                  }
                  
                  final category = _categories[index - 1];
                  return _buildCategoryChip(
                    id: category['id'],
                    name: category['name'],
                    icon: _getCategoryIcon(category['name']),
                  );
                },
              ),
            ),
          
          // Streams
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                _buildStreamGrid(_popularStreams),
                _buildStreamGrid(_followingStreams),
              ],
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildCategoryChip({
    required String? id,
    required String name,
    required IconData icon,
  }) {
    final isSelected = _selectedCategory == id;
    
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: FilterChip(
        label: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 16,
              color: isSelected ? Colors.white : Colors.white70,
            ),
            const SizedBox(width: 4),
            Text(
              name,
              style: TextStyle(
                color: isSelected ? Colors.white : Colors.white70,
                fontSize: 13,
              ),
            ),
          ],
        ),
        selected: isSelected,
        onSelected: (_) {
          setState(() {
            _selectedCategory = isSelected ? null : id;
          });
          _loadStreams();
        },
        backgroundColor: Colors.white.withOpacity(0.1),
        selectedColor: const Color(0xFFFF0080),
        side: BorderSide(
          color: isSelected 
              ? const Color(0xFFFF0080) 
              : Colors.white.withOpacity(0.2),
        ),
      ),
    );
  }
  
  IconData _getCategoryIcon(String categoryName) {
    switch (categoryName.toLowerCase()) {
      case 'gaming':
        return Icons.sports_esports;
      case 'music':
        return Icons.music_note;
      case 'dance':
        return Icons.directions_run;
      case 'talk':
        return Icons.chat;
      case 'education':
        return Icons.school;
      case 'food':
        return Icons.restaurant;
      case 'sports':
        return Icons.sports_basketball;
      case 'beauty':
        return Icons.face;
      default:
        return Icons.category;
    }
  }
  
  Widget _buildStreamGrid(List<LiveStream> streams) {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(
          color: Color(0xFFFF0080),
        ),
      );
    }
    
    if (streams.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            ShaderMask(
              shaderCallback: (bounds) => const LinearGradient(
                colors: [
                  Color(0xFFFF0080),
                  Color(0xFFFF80FF),
                ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ).createShader(bounds),
              child: const Icon(
                Icons.live_tv_outlined,
                size: 80,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'No live streams',
              style: TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              _tabController.index == 1 
                  ? 'Follow creators to see their streams here'
                  : 'Be the first to go live!',
              style: TextStyle(
                color: Colors.white.withOpacity(0.5),
                fontSize: 14,
              ),
            ),
          ],
        ),
      );
    }
    
    return RefreshIndicator(
      onRefresh: _loadStreams,
      color: const Color(0xFFFF0080),
      child: GridView.builder(
        padding: const EdgeInsets.all(8),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          childAspectRatio: 9 / 16,
          crossAxisSpacing: 8,
          mainAxisSpacing: 8,
        ),
        itemCount: streams.length,
        itemBuilder: (context, index) {
          final stream = streams[index];
          return _LiveStreamTile(
            stream: stream,
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => LiveStreamViewerScreen(
                    stream: stream,
                  ),
                ),
              ).then((_) => _loadStreams());
            },
          );
        },
      ),
    );
  }
}

class _LiveStreamTile extends StatelessWidget {
  final LiveStream stream;
  final VoidCallback onTap;
  
  const _LiveStreamTile({
    required this.stream,
    required this.onTap,
  });
  
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          color: Colors.white.withOpacity(0.05),
        ),
        child: Stack(
          fit: StackFit.expand,
          children: [
            // Thumbnail
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: stream.thumbnailUrl != null
                  ? Image.network(
                      stream.thumbnailUrl!,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) {
                        return Container(
                          color: Colors.white.withOpacity(0.1),
                          child: const Center(
                            child: Icon(
                              Icons.live_tv,
                              color: Colors.white54,
                              size: 48,
                            ),
                          ),
                        );
                      },
                    )
                  : Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            const Color(0xFFFF0080).withOpacity(0.3),
                            const Color(0xFFFF80FF).withOpacity(0.3),
                          ],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                      ),
                      child: const Center(
                        child: Icon(
                          Icons.live_tv,
                          color: Colors.white54,
                          size: 48,
                        ),
                      ),
                    ),
            ),
            
            // Gradient overlay
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
                  stops: const [0.5, 1.0],
                ),
              ),
            ),
            
            // Content
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // LIVE badge
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFF0080),
                      borderRadius: BorderRadius.circular(4),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFFFF0080).withOpacity(0.5),
                          blurRadius: 8,
                          spreadRadius: 2,
                        ),
                      ],
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          width: 6,
                          height: 6,
                          decoration: const BoxDecoration(
                            color: Colors.white,
                            shape: BoxShape.circle,
                          ),
                        ),
                        const SizedBox(width: 4),
                        const Text(
                          'LIVE',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                  
                  // Viewers count
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 6,
                      vertical: 2,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.black.withOpacity(0.5),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(
                          Icons.visibility,
                          color: Colors.white70,
                          size: 12,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          stream.formattedViewers,
                          style: const TextStyle(
                            color: Colors.white70,
                            fontSize: 11,
                          ),
                        ),
                      ],
                    ),
                  ),
                  
                  const Spacer(),
                  
                  // Host info and title
                  Row(
                    children: [
                      // Profile picture
                      Container(
                        width: 32,
                        height: 32,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: const Color(0xFFFF0080),
                            width: 2,
                          ),
                        ),
                        child: ClipOval(
                          child: stream.hostProfilePicture != null
                              ? Image.network(
                                  stream.hostProfilePicture!,
                                  fit: BoxFit.cover,
                                  errorBuilder: (context, error, stackTrace) {
                                    return Container(
                                      color: const Color(0xFFFF0080),
                                      child: Center(
                                        child: Text(
                                          stream.hostUsername[0].toUpperCase(),
                                          style: const TextStyle(
                                            color: Colors.white,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ),
                                    );
                                  },
                                )
                              : Container(
                                  color: const Color(0xFFFF0080),
                                  child: Center(
                                    child: Text(
                                      stream.hostUsername[0].toUpperCase(),
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      
                      // Username and title
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              stream.hostUsername,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            Text(
                              stream.title,
                              style: const TextStyle(
                                color: Colors.white70,
                                fontSize: 11,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
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
  }
}