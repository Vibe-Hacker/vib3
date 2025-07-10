import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../models/playlist.dart';
import '../services/playlist_service.dart';
import '../widgets/playlist_card.dart';
import '../widgets/create_playlist_sheet.dart';
import 'playlist_detail_screen.dart';

class PlaylistsScreen extends StatefulWidget {
  const PlaylistsScreen({super.key});

  @override
  State<PlaylistsScreen> createState() => _PlaylistsScreenState();
}

class _PlaylistsScreenState extends State<PlaylistsScreen> with TickerProviderStateMixin {
  late TabController _tabController;
  List<Playlist> _playlists = [];
  List<Collection> _collections = [];
  bool _isLoading = true;
  String _selectedFilter = 'all';
  
  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadData();
  }
  
  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }
  
  Future<void> _loadData() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final token = authProvider.authToken;
    final userId = authProvider.currentUser?.id;
    
    if (token == null || userId == null) return;
    
    setState(() {
      _isLoading = true;
    });
    
    try {
      final playlists = await PlaylistService.getUserPlaylists(
        userId: userId,
        token: token,
      );
      
      final collections = await PlaylistService.getUserCollections(
        userId: userId,
        token: token,
      );
      
      if (mounted) {
        setState(() {
          _playlists = playlists;
          _collections = collections;
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
  
  void _createPlaylist() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => CreatePlaylistSheet(
        onPlaylistCreated: (playlist) {
          setState(() {
            _playlists.insert(0, playlist);
          });
        },
      ),
    );
  }
  
  void _deletePlaylist(String playlistId) async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final token = authProvider.authToken;
    
    if (token == null) return;
    
    final success = await PlaylistService.deletePlaylist(
      playlistId: playlistId,
      token: token,
    );
    
    if (success) {
      setState(() {
        _playlists.removeWhere((p) => p.id == playlistId);
      });
      
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Playlist deleted'),
          backgroundColor: Colors.green,
        ),
      );
    }
  }
  
  List<Playlist> get _filteredPlaylists {
    switch (_selectedFilter) {
      case 'favorites':
        return _playlists.where((p) => p.type == PlaylistType.favorites).toList();
      case 'private':
        return _playlists.where((p) => p.isPrivate).toList();
      case 'collaborative':
        return _playlists.where((p) => p.isCollaborative).toList();
      default:
        return _playlists;
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: const Color(0xFF1A1A1A),
        elevation: 2,
        title: const Text(
          'My Collections',
          style: TextStyle(
            color: Colors.white,
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: _createPlaylist,
            tooltip: 'Create Playlist',
          ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(48),
          child: TabBar(
            controller: _tabController,
            indicatorColor: const Color(0xFF00CED1),
            indicatorWeight: 3,
            labelColor: Colors.white,
            unselectedLabelColor: Colors.white54,
            tabs: const [
              Tab(text: 'Playlists'),
              Tab(text: 'Collections'),
            ],
          ),
        ),
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(
                color: Color(0xFF00CED1),
              ),
            )
          : TabBarView(
              controller: _tabController,
              children: [
                _buildPlaylistsTab(),
                _buildCollectionsTab(),
              ],
            ),
    );
  }
  
  Widget _buildPlaylistsTab() {
    return Column(
      children: [
        // Filter buttons
        Container(
          height: 60,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: ListView(
            scrollDirection: Axis.horizontal,
            children: [
              _buildFilterButton('All', 'all'),
              _buildFilterButton('Favorites', 'favorites'),
              _buildFilterButton('Private', 'private'),
              _buildFilterButton('Collaborative', 'collaborative'),
            ],
          ),
        ),
        
        // Playlists list
        Expanded(
          child: _filteredPlaylists.isEmpty
              ? _buildEmptyState('No playlists yet', 'Create your first playlist')
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _filteredPlaylists.length,
                  itemBuilder: (context, index) {
                    final playlist = _filteredPlaylists[index];
                    return PlaylistCard(
                      playlist: playlist,
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => PlaylistDetailScreen(
                              playlistId: playlist.id,
                            ),
                          ),
                        );
                      },
                      onDelete: () => _deletePlaylist(playlist.id),
                    );
                  },
                ),
        ),
      ],
    );
  }
  
  Widget _buildCollectionsTab() {
    return _collections.isEmpty
        ? _buildEmptyState('No collections yet', 'Create your first collection')
        : ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: _collections.length,
            itemBuilder: (context, index) {
              final collection = _collections[index];
              return _buildCollectionCard(collection);
            },
          );
  }
  
  Widget _buildFilterButton(String text, String value) {
    final isSelected = _selectedFilter == value;
    
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: ChoiceChip(
        label: Text(
          text,
          style: TextStyle(
            color: isSelected ? Colors.white : Colors.white70,
            fontSize: 13,
          ),
        ),
        selected: isSelected,
        onSelected: (_) {
          HapticFeedback.lightImpact();
          setState(() {
            _selectedFilter = value;
          });
        },
        backgroundColor: Colors.white.withOpacity(0.1),
        selectedColor: const Color(0xFF00CED1),
        side: BorderSide(
          color: isSelected 
              ? const Color(0xFF00CED1) 
              : Colors.white.withOpacity(0.2),
        ),
      ),
    );
  }
  
  Widget _buildEmptyState(String title, String subtitle) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 120,
            height: 120,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  const Color(0xFF00CED1).withOpacity(0.3),
                  const Color(0xFF00CED1).withOpacity(0.1),
                ],
              ),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.playlist_play,
              size: 60,
              color: Color(0xFF00CED1),
            ),
          ),
          const SizedBox(height: 24),
          Text(
            title,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            subtitle,
            style: const TextStyle(
              color: Colors.white54,
              fontSize: 14,
            ),
          ),
          const SizedBox(height: 32),
          ElevatedButton.icon(
            onPressed: _createPlaylist,
            icon: const Icon(Icons.add, color: Colors.white),
            label: const Text(
              'Create Playlist',
              style: TextStyle(color: Colors.white),
            ),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF00CED1),
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildCollectionCard(Collection collection) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            const Color(0xFF1A1A1A),
            const Color(0xFF2A2A2A),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.all(16),
        leading: Container(
          width: 60,
          height: 60,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                const Color(0xFF9370DB),
                const Color(0xFF9370DB).withOpacity(0.7),
              ],
            ),
            borderRadius: BorderRadius.circular(12),
          ),
          child: const Icon(
            Icons.collections,
            color: Colors.white,
            size: 28,
          ),
        ),
        title: Text(
          collection.name,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 4),
            Text(
              collection.description,
              style: const TextStyle(
                color: Colors.white70,
                fontSize: 14,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Icon(
                  collection.isPrivate ? Icons.lock : Icons.public,
                  color: Colors.white54,
                  size: 16,
                ),
                const SizedBox(width: 4),
                Text(
                  '${collection.playlistCount} playlists',
                  style: const TextStyle(
                    color: Colors.white54,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ],
        ),
        trailing: IconButton(
          icon: const Icon(Icons.more_vert, color: Colors.white54),
          onPressed: () {
            // Show collection options
          },
        ),
      ),
    );
  }
}