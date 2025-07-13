import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../models/collection.dart';
import '../models/video.dart';
import '../services/collection_service.dart';
import '../providers/auth_provider.dart';
import '../screens/create_collection_dialog.dart';

class SaveVideoDialog extends StatefulWidget {
  final Video video;
  
  const SaveVideoDialog({
    super.key,
    required this.video,
  });

  @override
  State<SaveVideoDialog> createState() => _SaveVideoDialogState();
}

class _SaveVideoDialogState extends State<SaveVideoDialog> {
  List<Collection> _collections = [];
  Set<String> _selectedCollectionIds = {};
  bool _isLoading = true;
  bool _isSavingToFavorites = false;
  bool _isInFavorites = false;
  
  @override
  void initState() {
    super.initState();
    _loadCollections();
    _checkFavoriteStatus();
  }
  
  Future<void> _loadCollections() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final token = authProvider.authToken;
    
    if (token == null) return;
    
    try {
      final collections = await CollectionService.getUserCollections(token);
      
      if (mounted) {
        setState(() {
          _collections = collections;
          _isLoading = false;
          
          // Pre-select collections that already contain this video
          for (final collection in collections) {
            if (collection.videoIds.contains(widget.video.id)) {
              _selectedCollectionIds.add(collection.id);
            }
          }
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
  
  Future<void> _checkFavoriteStatus() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final token = authProvider.authToken;
    
    if (token == null) return;
    
    // Check if video is in favorites
    try {
      final collections = await CollectionService.getCollections(token);
      final favoritesCollection = collections.firstWhere(
        (c) => c.name.toLowerCase() == 'favorites' || c.isFavorites == true,
        orElse: () => Collection(
          id: '',
          name: '',
          videoCount: 0,
          thumbnails: [],
          userId: '',
          createdAt: DateTime.now(),
        ),
      );
      
      if (favoritesCollection.id.isNotEmpty) {
        // Check if video is in favorites collection
        setState(() {
          _isInFavorites = favoritesCollection.videoIds?.contains(widget.video.id) ?? false;
        });
      }
    } catch (e) {
      print('Error checking favorite status: $e');
      setState(() {
        _isInFavorites = false;
      });
    }
  }
  
  Future<void> _toggleFavorite() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final token = authProvider.authToken;
    
    if (token == null) return;
    
    setState(() {
      _isSavingToFavorites = true;
    });
    
    bool success;
    if (_isInFavorites) {
      success = await CollectionService.removeFromFavorites(widget.video.id, token);
    } else {
      success = await CollectionService.saveToFavorites(widget.video.id, token);
    }
    
    if (success && mounted) {
      setState(() {
        _isInFavorites = !_isInFavorites;
        _isSavingToFavorites = false;
      });
      
      HapticFeedback.mediumImpact();
      
      if (!_isInFavorites) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Removed from favorites')),
        );
      }
    } else {
      setState(() {
        _isSavingToFavorites = false;
      });
    }
  }
  
  Future<void> _saveToCollections() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final token = authProvider.authToken;
    
    if (token == null) return;
    
    Navigator.pop(context);
    
    int successCount = 0;
    
    for (final collectionId in _selectedCollectionIds) {
      final success = await CollectionService.addVideoToCollection(
        collectionId: collectionId,
        videoId: widget.video.id,
        token: token,
      );
      
      if (success) successCount++;
    }
    
    if (successCount > 0 && mounted) {
      HapticFeedback.mediumImpact();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Saved to $successCount collection${successCount > 1 ? 's' : ''}'),
          backgroundColor: const Color(0xFF00CED1),
        ),
      );
    }
  }
  
  void _createNewCollection() async {
    Navigator.pop(context);
    // Show create collection dialog
    final result = await showDialog<Map<String, dynamic>>(
      context: context,
      builder: (context) => const CreateCollectionDialog(),
    );
    
    if (result != null) {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final token = authProvider.authToken;
      
      if (token != null) {
        // Create the collection and add the video
        final success = await CollectionService.createCollection(
          name: result['name'],
          description: result['description'] ?? '',
          isPrivate: result['isPrivate'] ?? true,
          token: token,
        );
        
        if (success && mounted) {
          // Refresh collections
          _loadCollections();
          
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Created collection "${result['name']}"'),
              backgroundColor: const Color(0xFF00CED1),
            ),
          );
        }
      }
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.8,
      ),
      decoration: const BoxDecoration(
        color: Color(0xFF1A1A1A),
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(20),
          topRight: Radius.circular(20),
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Handle bar
          Container(
            margin: const EdgeInsets.only(top: 12),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.grey[600],
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          
          // Header
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                const Text(
                  'Save Video',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const Spacer(),
                TextButton(
                  onPressed: _selectedCollectionIds.isEmpty ? null : _saveToCollections,
                  child: Text(
                    'Done',
                    style: TextStyle(
                      color: _selectedCollectionIds.isEmpty
                          ? Colors.white30
                          : const Color(0xFF00CED1),
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
          ),
          
          // Favorites option
          ListTile(
            leading: Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFFFF1493), Color(0xFFFF69B4)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(
                Icons.favorite,
                color: Colors.white,
                size: 24,
              ),
            ),
            title: const Text(
              'Favorites',
              style: TextStyle(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            subtitle: const Text(
              'Quick save for easy access',
              style: TextStyle(
                color: Colors.white70,
                fontSize: 12,
              ),
            ),
            trailing: _isSavingToFavorites
                ? const SizedBox(
                    width: 24,
                    height: 24,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(
                        Color(0xFF00CED1),
                      ),
                    ),
                  )
                : IconButton(
                    onPressed: _toggleFavorite,
                    icon: Icon(
                      _isInFavorites ? Icons.favorite : Icons.favorite_border,
                      color: _isInFavorites ? Colors.red : Colors.white,
                    ),
                  ),
          ),
          
          const Divider(color: Colors.white10),
          
          // Collections list
          Flexible(
            child: _isLoading
                ? const Center(
                    child: CircularProgressIndicator(
                      color: Color(0xFF00CED1),
                    ),
                  )
                : ListView(
                    shrinkWrap: true,
                    children: [
                      // Create new collection option
                      ListTile(
                        leading: Container(
                          width: 48,
                          height: 48,
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: const Color(0xFF00CED1),
                              width: 2,
                            ),
                          ),
                          child: const Icon(
                            Icons.add,
                            color: Color(0xFF00CED1),
                            size: 24,
                          ),
                        ),
                        title: const Text(
                          'Create New Collection',
                          style: TextStyle(
                            color: Color(0xFF00CED1),
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        onTap: _createNewCollection,
                      ),
                      
                      // Existing collections
                      ..._collections.map((collection) => ListTile(
                        leading: Container(
                          width: 48,
                          height: 48,
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
                                      return Icon(
                                        Icons.video_library,
                                        color: Colors.white.withOpacity(0.3),
                                      );
                                    },
                                  ),
                                )
                              : Icon(
                                  Icons.video_library,
                                  color: Colors.white.withOpacity(0.3),
                                ),
                        ),
                        title: Text(
                          collection.name,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                          ),
                        ),
                        subtitle: Text(
                          '${collection.videoIds.length} videos',
                          style: const TextStyle(
                            color: Colors.white70,
                            fontSize: 12,
                          ),
                        ),
                        trailing: Checkbox(
                          value: _selectedCollectionIds.contains(collection.id),
                          onChanged: (value) {
                            setState(() {
                              if (value == true) {
                                _selectedCollectionIds.add(collection.id);
                              } else {
                                _selectedCollectionIds.remove(collection.id);
                              }
                            });
                          },
                          activeColor: const Color(0xFF00CED1),
                          checkColor: Colors.black,
                        ),
                        onTap: () {
                          setState(() {
                            if (_selectedCollectionIds.contains(collection.id)) {
                              _selectedCollectionIds.remove(collection.id);
                            } else {
                              _selectedCollectionIds.add(collection.id);
                            }
                          });
                        },
                      )),
                    ],
                  ),
          ),
        ],
      ),
    );
  }
}