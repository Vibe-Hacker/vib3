import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../models/playlist.dart';
import '../models/video.dart';
import '../services/playlist_service.dart';
import '../widgets/video_card.dart';
import '../utils/format_utils.dart';

class PlaylistDetailScreen extends StatefulWidget {
  final String playlistId;
  
  const PlaylistDetailScreen({
    super.key,
    required this.playlistId,
  });
  
  @override
  State<PlaylistDetailScreen> createState() => _PlaylistDetailScreenState();
}

class _PlaylistDetailScreenState extends State<PlaylistDetailScreen> {
  Playlist? _playlist;
  List<Video> _videos = [];
  bool _isLoading = true;
  bool _isReorderMode = false;
  
  @override
  void initState() {
    super.initState();
    _loadPlaylistDetails();
  }
  
  Future<void> _loadPlaylistDetails() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final token = authProvider.authToken;
    
    if (token == null) return;
    
    setState(() {
      _isLoading = true;
    });
    
    try {
      // Load playlist videos
      final videos = await PlaylistService.getPlaylistVideos(
        playlistId: widget.playlistId,
        token: token,
      );
      
      if (mounted) {
        setState(() {
          _videos = videos;
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
  
  void _removeVideo(String videoId) async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final token = authProvider.authToken;
    
    if (token == null) return;
    
    final success = await PlaylistService.removeVideoFromPlaylist(
      playlistId: widget.playlistId,
      videoId: videoId,
      token: token,
    );
    
    if (success) {
      setState(() {
        _videos.removeWhere((v) => v.id == videoId);
      });
      
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Video removed from playlist'),
          backgroundColor: Colors.green,
        ),
      );
    }
  }
  
  void _reorderVideos(int oldIndex, int newIndex) async {
    if (oldIndex < newIndex) {
      newIndex -= 1;
    }
    
    final video = _videos.removeAt(oldIndex);
    _videos.insert(newIndex, video);
    
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final token = authProvider.authToken;
    
    if (token == null) return;
    
    final videoIds = _videos.map((v) => v.id).toList();
    
    final success = await PlaylistService.reorderPlaylistVideos(
      playlistId: widget.playlistId,
      videoIds: videoIds,
      token: token,
    );
    
    if (!success) {
      // Revert changes if API call failed
      _loadPlaylistDetails();
      
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Failed to reorder videos'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: const Color(0xFF1A1A1A),
        elevation: 2,
        title: Text(
          _playlist?.name ?? 'Playlist',
          style: const TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        actions: [
          if (_videos.isNotEmpty)
            IconButton(
              icon: Icon(
                _isReorderMode ? Icons.check : Icons.reorder,
                color: Colors.white,
              ),
              onPressed: () {
                setState(() {
                  _isReorderMode = !_isReorderMode;
                });
              },
              tooltip: _isReorderMode ? 'Done' : 'Reorder',
            ),
          PopupMenuButton(
            icon: const Icon(Icons.more_vert, color: Colors.white),
            color: const Color(0xFF1A1A1A),
            itemBuilder: (context) => [
              PopupMenuItem(
                child: const Row(
                  children: [
                    Icon(Icons.edit, color: Colors.white, size: 20),
                    SizedBox(width: 12),
                    Text('Edit Playlist', style: TextStyle(color: Colors.white)),
                  ],
                ),
                onTap: () {
                  // Edit playlist
                },
              ),
              PopupMenuItem(
                child: const Row(
                  children: [
                    Icon(Icons.share, color: Colors.white, size: 20),
                    SizedBox(width: 12),
                    Text('Share', style: TextStyle(color: Colors.white)),
                  ],
                ),
                onTap: () {
                  // Share playlist
                },
              ),
              PopupMenuItem(
                child: const Row(
                  children: [
                    Icon(Icons.download, color: Colors.white, size: 20),
                    SizedBox(width: 12),
                    Text('Download', style: TextStyle(color: Colors.white)),
                  ],
                ),
                onTap: () {
                  // Download playlist
                },
              ),
            ],
          ),
        ],
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(
                color: Color(0xFF00CED1),
              ),
            )
          : Column(
              children: [
                // Playlist header
                if (_playlist != null) _buildPlaylistHeader(),
                
                // Videos list
                Expanded(
                  child: _videos.isEmpty
                      ? _buildEmptyState()
                      : _isReorderMode
                          ? _buildReorderableList()
                          : _buildVideosList(),
                ),
              ],
            ),
    );
  }
  
  Widget _buildPlaylistHeader() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFF1A1A1A), Color(0xFF2A2A2A)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              // Playlist thumbnail
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12),
                  image: _playlist!.thumbnailUrl != null
                      ? DecorationImage(
                          image: NetworkImage(_playlist!.thumbnailUrl!),
                          fit: BoxFit.cover,
                        )
                      : null,
                  gradient: _playlist!.thumbnailUrl == null
                      ? const LinearGradient(
                          colors: [Color(0xFF00CED1), Color(0xFF40E0D0)],
                        )
                      : null,
                ),
                child: _playlist!.thumbnailUrl == null
                    ? const Icon(
                        Icons.playlist_play,
                        color: Colors.white,
                        size: 32,
                      )
                    : null,
              ),
              const SizedBox(width: 16),
              
              // Playlist info
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _playlist!.name,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _playlist!.description,
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
                          Icons.play_arrow,
                          color: Colors.white54,
                          size: 16,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          '${_videos.length} videos',
                          style: const TextStyle(
                            color: Colors.white54,
                            fontSize: 12,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Icon(
                          Icons.access_time,
                          color: Colors.white54,
                          size: 16,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          FormatUtils.formatDuration(_playlist!.totalDuration),
                          style: const TextStyle(
                            color: Colors.white54,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
          
          // Action buttons
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: _videos.isEmpty ? null : () {
                    // Play all videos
                  },
                  icon: const Icon(Icons.play_arrow, color: Colors.white),
                  label: const Text(
                    'Play All',
                    style: TextStyle(color: Colors.white),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF00CED1),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: _videos.isEmpty ? null : () {
                    // Shuffle play
                  },
                  icon: const Icon(Icons.shuffle, color: Colors.white),
                  label: const Text(
                    'Shuffle',
                    style: TextStyle(color: Colors.white),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white.withOpacity(0.1),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
  
  Widget _buildVideosList() {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _videos.length,
      itemBuilder: (context, index) {
        final video = _videos[index];
        return VideoCard(
          video: video,
          showRemoveButton: true,
          onRemove: () => _removeVideo(video.id),
        );
      },
    );
  }
  
  Widget _buildReorderableList() {
    return ReorderableListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _videos.length,
      onReorder: _reorderVideos,
      itemBuilder: (context, index) {
        final video = _videos[index];
        return VideoCard(
          key: ValueKey(video.id),
          video: video,
          showDragHandle: true,
        );
      },
    );
  }
  
  Widget _buildEmptyState() {
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
          const Text(
            'No videos in this playlist',
            style: TextStyle(
              color: Colors.white,
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Add some videos to get started',
            style: TextStyle(
              color: Colors.white54,
              fontSize: 14,
            ),
          ),
          const SizedBox(height: 32),
          ElevatedButton.icon(
            onPressed: () {
              // Navigate to video picker
            },
            icon: const Icon(Icons.add, color: Colors.white),
            label: const Text(
              'Add Videos',
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
}