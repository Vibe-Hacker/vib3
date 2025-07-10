import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../models/video.dart';
import '../services/collection_service.dart';
import '../services/video_service.dart';
import '../providers/auth_provider.dart';
import '../widgets/video_thumbnail.dart';
import 'profile_video_viewer.dart';

class CollectionVideosScreen extends StatefulWidget {
  final String collectionId;
  final String collectionName;
  final bool isFavorites;
  
  const CollectionVideosScreen({
    super.key,
    required this.collectionId,
    required this.collectionName,
    this.isFavorites = false,
  });

  @override
  State<CollectionVideosScreen> createState() => _CollectionVideosScreenState();
}

class _CollectionVideosScreenState extends State<CollectionVideosScreen> {
  List<Video> _videos = [];
  bool _isLoading = true;
  
  @override
  void initState() {
    super.initState();
    _loadVideos();
  }
  
  Future<void> _loadVideos() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final token = authProvider.authToken;
    
    if (token == null) return;
    
    setState(() {
      _isLoading = true;
    });
    
    try {
      List<Video> videos;
      
      if (widget.isFavorites) {
        // Load favorites
        videos = await VideoService.getUserLikedVideos(token);
      } else {
        // Load collection videos
        videos = await CollectionService.getCollectionVideos(
          collectionId: widget.collectionId,
          token: token,
        );
      }
      
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
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to load videos')),
        );
      }
    }
  }
  
  Future<void> _removeVideo(Video video) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1A1A1A),
        title: const Text(
          'Remove Video',
          style: TextStyle(color: Colors.white),
        ),
        content: Text(
          'Remove this video from ${widget.collectionName}?',
          style: const TextStyle(color: Colors.white70),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text(
              'Remove',
              style: TextStyle(color: Colors.red),
            ),
          ),
        ],
      ),
    );
    
    if (confirmed != true) return;
    
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final token = authProvider.authToken;
    
    if (token == null) return;
    
    bool success;
    
    if (widget.isFavorites) {
      success = await CollectionService.removeFromFavorites(video.id, token);
    } else {
      success = await CollectionService.removeVideoFromCollection(
        collectionId: widget.collectionId,
        videoId: video.id,
        token: token,
      );
    }
    
    if (success && mounted) {
      setState(() {
        _videos.removeWhere((v) => v.id == video.id);
      });
      
      HapticFeedback.mediumImpact();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Video removed')),
      );
    }
  }
  
  void _playVideo(Video video) {
    final videoIndex = _videos.indexOf(video);
    
    if (videoIndex != -1) {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => ProfileVideoViewer(
            videos: _videos,
            initialIndex: videoIndex,
            username: widget.collectionName,
          ),
        ),
      );
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              widget.collectionName,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            if (_videos.isNotEmpty)
              Text(
                '${_videos.length} videos',
                style: const TextStyle(
                  color: Colors.white70,
                  fontSize: 12,
                ),
              ),
          ],
        ),
        actions: [
          if (!widget.isFavorites)
            IconButton(
              onPressed: () {
                // TODO: Add videos to collection
              },
              icon: const Icon(Icons.add, color: Colors.white),
            ),
        ],
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(
                color: Color(0xFF00CED1),
              ),
            )
          : _videos.isEmpty
              ? _buildEmptyState()
              : _buildVideoGrid(),
    );
  }
  
  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            widget.isFavorites ? Icons.favorite_border : Icons.video_library_outlined,
            size: 80,
            color: Colors.white.withOpacity(0.3),
          ),
          const SizedBox(height: 16),
          Text(
            widget.isFavorites
                ? 'No favorite videos yet'
                : 'No videos in this collection',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            widget.isFavorites
                ? 'Videos you like will appear here'
                : 'Add videos to start your collection',
            style: const TextStyle(
              color: Colors.white70,
              fontSize: 14,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
  
  Widget _buildVideoGrid() {
    return GridView.builder(
      padding: const EdgeInsets.all(8),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        childAspectRatio: 3 / 4,
        crossAxisSpacing: 4,
        mainAxisSpacing: 4,
      ),
      itemCount: _videos.length,
      itemBuilder: (context, index) {
        final video = _videos[index];
        return Stack(
          children: [
            VideoThumbnail(
              video: video,
              showDeleteButton: false,
              onTap: () => _playVideo(video),
            ),
            // Remove button
            Positioned(
              top: 8,
              right: 8,
              child: GestureDetector(
                onTap: () => _removeVideo(video),
                child: Container(
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.7),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.close,
                    color: Colors.white,
                    size: 16,
                  ),
                ),
              ),
            ),
          ],
        );
      },
    );
  }
}