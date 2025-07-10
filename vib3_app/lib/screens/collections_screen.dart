import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../models/collection.dart';
import '../models/video.dart';
import '../services/collection_service.dart';
import '../providers/auth_provider.dart';
import '../widgets/video_thumbnail.dart';
import 'create_collection_dialog.dart';
import 'collection_videos_screen.dart';

class CollectionsScreen extends StatefulWidget {
  const CollectionsScreen({super.key});

  @override
  State<CollectionsScreen> createState() => _CollectionsScreenState();
}

class _CollectionsScreenState extends State<CollectionsScreen> {
  List<Collection> _collections = [];
  bool _isLoading = true;
  
  @override
  void initState() {
    super.initState();
    _loadCollections();
  }
  
  Future<void> _loadCollections() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final token = authProvider.authToken;
    
    if (token == null) return;
    
    setState(() {
      _isLoading = true;
    });
    
    try {
      final collections = await CollectionService.getUserCollections(token);
      
      if (mounted) {
        setState(() {
          _collections = collections;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to load collections')),
        );
      }
    }
  }
  
  Future<void> _createCollection() async {
    final result = await showDialog<Map<String, dynamic>>(
      context: context,
      builder: (context) => const CreateCollectionDialog(),
    );
    
    if (result != null) {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final token = authProvider.authToken;
      
      if (token == null) return;
      
      final collection = await CollectionService.createCollection(
        name: result['name'],
        description: result['description'],
        isPrivate: result['isPrivate'],
        token: token,
      );
      
      if (collection != null && mounted) {
        setState(() {
          _collections.add(collection);
        });
        
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Collection created!'),
            backgroundColor: Color(0xFF00CED1),
          ),
        );
      }
    }
  }
  
  Future<void> _deleteCollection(Collection collection) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1A1A1A),
        title: const Text(
          'Delete Collection',
          style: TextStyle(color: Colors.white),
        ),
        content: Text(
          'Are you sure you want to delete "${collection.name}"? This action cannot be undone.',
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
              'Delete',
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
    
    final success = await CollectionService.deleteCollection(collection.id, token);
    
    if (success && mounted) {
      setState(() {
        _collections.removeWhere((c) => c.id == collection.id);
      });
      
      HapticFeedback.mediumImpact();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Collection deleted')),
      );
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        title: ShaderMask(
          shaderCallback: (bounds) => const LinearGradient(
            colors: [Color(0xFF00CED1), Color(0xFFFF1493)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ).createShader(bounds),
          child: const Text(
            'My Collections',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
        ),
        actions: [
          IconButton(
            onPressed: _createCollection,
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
          : _collections.isEmpty
              ? _buildEmptyState()
              : _buildCollectionsList(),
    );
  }
  
  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.collections_outlined,
            size: 80,
            color: Colors.white.withOpacity(0.3),
          ),
          const SizedBox(height: 16),
          const Text(
            'No collections yet',
            style: TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Create collections to organize your favorite videos',
            style: TextStyle(
              color: Colors.white70,
              fontSize: 14,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: _createCollection,
            icon: const Icon(Icons.add),
            label: const Text('Create Collection'),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF00CED1),
              foregroundColor: Colors.black,
              padding: const EdgeInsets.symmetric(
                horizontal: 24,
                vertical: 12,
              ),
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildCollectionsList() {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _collections.length + 1, // +1 for favorites
      itemBuilder: (context, index) {
        if (index == 0) {
          // Favorites collection (always present)
          return _buildFavoritesCard();
        }
        
        final collection = _collections[index - 1];
        return _buildCollectionCard(collection);
      },
    );
  }
  
  Widget _buildFavoritesCard() {
    return GestureDetector(
      onTap: () {
        // Navigate to favorites
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => const CollectionVideosScreen(
              collectionId: 'favorites',
              collectionName: 'Favorites',
              isFavorites: true,
            ),
          ),
        );
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 16),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xFFFF1493), Color(0xFFFF69B4)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFFFF1493).withOpacity(0.3),
              blurRadius: 20,
              offset: const Offset(0, 10),
            ),
          ],
        ),
        child: Container(
          padding: const EdgeInsets.all(20),
          child: Row(
            children: [
              Container(
                width: 60,
                height: 60,
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(
                  Icons.favorite,
                  color: Colors.white,
                  size: 32,
                ),
              ),
              const SizedBox(width: 16),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Favorites',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    SizedBox(height: 4),
                    Text(
                      'Your favorite videos',
                      style: TextStyle(
                        color: Colors.white70,
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
              ),
              const Icon(
                Icons.arrow_forward_ios,
                color: Colors.white,
                size: 20,
              ),
            ],
          ),
        ),
      ),
    );
  }
  
  Widget _buildCollectionCard(Collection collection) {
    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => CollectionVideosScreen(
              collectionId: collection.id,
              collectionName: collection.name,
            ),
          ),
        );
      },
      onLongPress: () => _showCollectionOptions(collection),
      child: Container(
        margin: const EdgeInsets.only(bottom: 16),
        decoration: BoxDecoration(
          color: const Color(0xFF1A1A1A),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: Colors.white.withOpacity(0.1),
            width: 1,
          ),
        ),
        child: Container(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              // Collection cover
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.05),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: collection.coverImage != null
                    ? ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: Image.network(
                          collection.coverImage!,
                          fit: BoxFit.cover,
                          errorBuilder: (context, error, stackTrace) {
                            return _buildPlaceholderIcon();
                          },
                        ),
                      )
                    : _buildPlaceholderIcon(),
              ),
              const SizedBox(width: 16),
              
              // Collection info
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            collection.name,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (collection.isPrivate)
                          Container(
                            margin: const EdgeInsets.only(left: 8),
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: const Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  Icons.lock,
                                  color: Colors.white54,
                                  size: 12,
                                ),
                                SizedBox(width: 4),
                                Text(
                                  'Private',
                                  style: TextStyle(
                                    color: Colors.white54,
                                    fontSize: 11,
                                  ),
                                ),
                              ],
                            ),
                          ),
                      ],
                    ),
                    if (collection.description != null) ...[
                      const SizedBox(height: 4),
                      Text(
                        collection.description!,
                        style: const TextStyle(
                          color: Colors.white70,
                          fontSize: 14,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                    const SizedBox(height: 8),
                    Text(
                      '${collection.videoIds.length} videos',
                      style: const TextStyle(
                        color: Color(0xFF00CED1),
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
              
              // Arrow
              const Icon(
                Icons.arrow_forward_ios,
                color: Colors.white54,
                size: 16,
              ),
            ],
          ),
        ),
      ),
    );
  }
  
  Widget _buildPlaceholderIcon() {
    return Center(
      child: Icon(
        Icons.video_library_outlined,
        color: Colors.white.withOpacity(0.3),
        size: 32,
      ),
    );
  }
  
  void _showCollectionOptions(Collection collection) {
    HapticFeedback.mediumImpact();
    
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF1A1A1A),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Container(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 40,
              height: 4,
              margin: const EdgeInsets.only(bottom: 16),
              decoration: BoxDecoration(
                color: Colors.grey[600],
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            ListTile(
              leading: const Icon(Icons.edit, color: Colors.white),
              title: const Text(
                'Edit Collection',
                style: TextStyle(color: Colors.white),
              ),
              onTap: () {
                Navigator.pop(context);
                // TODO: Implement edit collection
              },
            ),
            ListTile(
              leading: const Icon(Icons.share, color: Colors.white),
              title: const Text(
                'Share Collection',
                style: TextStyle(color: Colors.white),
              ),
              onTap: () {
                Navigator.pop(context);
                // TODO: Implement share collection
              },
            ),
            ListTile(
              leading: const Icon(Icons.delete, color: Colors.red),
              title: const Text(
                'Delete Collection',
                style: TextStyle(color: Colors.red),
              ),
              onTap: () {
                Navigator.pop(context);
                _deleteCollection(collection);
              },
            ),
          ],
        ),
      ),
    );
  }
}