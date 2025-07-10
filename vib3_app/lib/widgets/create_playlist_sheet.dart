import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../models/playlist.dart';
import '../services/playlist_service.dart';

class CreatePlaylistSheet extends StatefulWidget {
  final Function(Playlist) onPlaylistCreated;
  
  const CreatePlaylistSheet({
    super.key,
    required this.onPlaylistCreated,
  });
  
  @override
  State<CreatePlaylistSheet> createState() => _CreatePlaylistSheetState();
}

class _CreatePlaylistSheetState extends State<CreatePlaylistSheet> {
  final _nameController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _nameFocusNode = FocusNode();
  final _descriptionFocusNode = FocusNode();
  
  PlaylistType _selectedType = PlaylistType.custom;
  bool _isPrivate = false;
  bool _isCollaborative = false;
  bool _isCreating = false;
  List<String> _tags = [];
  final _tagController = TextEditingController();
  
  @override
  void initState() {
    super.initState();
    // Auto-focus name field
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _nameFocusNode.requestFocus();
    });
  }
  
  @override
  void dispose() {
    _nameController.dispose();
    _descriptionController.dispose();
    _nameFocusNode.dispose();
    _descriptionFocusNode.dispose();
    _tagController.dispose();
    super.dispose();
  }
  
  void _createPlaylist() async {
    if (_nameController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please enter a playlist name'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }
    
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final token = authProvider.authToken;
    
    if (token == null) return;
    
    setState(() {
      _isCreating = true;
    });
    
    HapticFeedback.mediumImpact();
    
    final playlist = await PlaylistService.createPlaylist(
      name: _nameController.text.trim(),
      description: _descriptionController.text.trim(),
      type: _selectedType,
      isPrivate: _isPrivate,
      token: token,
      tags: _tags,
    );
    
    if (playlist != null && mounted) {
      widget.onPlaylistCreated(playlist);
      Navigator.pop(context);
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Playlist "${playlist.name}" created'),
          backgroundColor: Colors.green,
        ),
      );
    } else {
      setState(() {
        _isCreating = false;
      });
      
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Failed to create playlist'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }
  
  void _addTag() {
    final tag = _tagController.text.trim();
    if (tag.isNotEmpty && !_tags.contains(tag)) {
      setState(() {
        _tags.add(tag);
        _tagController.clear();
      });
    }
  }
  
  void _removeTag(String tag) {
    setState(() {
      _tags.remove(tag);
    });
  }
  
  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.8,
      decoration: const BoxDecoration(
        color: Color(0xFF1A1A1A),
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        children: [
          // Handle
          Container(
            width: 40,
            height: 4,
            margin: const EdgeInsets.only(top: 12),
            decoration: BoxDecoration(
              color: Colors.white24,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          
          // Title
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Create Playlist',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text(
                    'Cancel',
                    style: TextStyle(color: Colors.white54),
                  ),
                ),
              ],
            ),
          ),
          
          // Form
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Name field
                  _buildTextField(
                    controller: _nameController,
                    focusNode: _nameFocusNode,
                    label: 'Playlist Name',
                    hint: 'Enter playlist name',
                    maxLines: 1,
                  ),
                  const SizedBox(height: 16),
                  
                  // Description field
                  _buildTextField(
                    controller: _descriptionController,
                    focusNode: _descriptionFocusNode,
                    label: 'Description (Optional)',
                    hint: 'Describe your playlist',
                    maxLines: 3,
                  ),
                  const SizedBox(height: 24),
                  
                  // Type selector
                  const Text(
                    'Playlist Type',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    children: PlaylistType.values.map((type) {
                      if (type == PlaylistType.favorites || 
                          type == PlaylistType.watchLater || 
                          type == PlaylistType.liked) {
                        return const SizedBox.shrink(); // Skip system playlists
                      }
                      
                      return ChoiceChip(
                        label: Text(
                          _getTypeLabel(type),
                          style: TextStyle(
                            color: _selectedType == type ? Colors.white : Colors.white70,
                            fontSize: 13,
                          ),
                        ),
                        selected: _selectedType == type,
                        onSelected: (selected) {
                          if (selected) {
                            setState(() {
                              _selectedType = type;
                            });
                          }
                        },
                        backgroundColor: Colors.white.withOpacity(0.1),
                        selectedColor: const Color(0xFF00CED1),
                        side: BorderSide(
                          color: _selectedType == type
                              ? const Color(0xFF00CED1)
                              : Colors.white.withOpacity(0.2),
                        ),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 24),
                  
                  // Settings
                  const Text(
                    'Settings',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 12),
                  
                  // Privacy toggle
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.05),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: SwitchListTile(
                      title: const Text(
                        'Private',
                        style: TextStyle(color: Colors.white),
                      ),
                      subtitle: const Text(
                        'Only you can see this playlist',
                        style: TextStyle(color: Colors.white54, fontSize: 12),
                      ),
                      value: _isPrivate,
                      onChanged: (value) {
                        setState(() {
                          _isPrivate = value;
                        });
                      },
                      activeColor: const Color(0xFF00CED1),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16),
                    ),
                  ),
                  const SizedBox(height: 8),
                  
                  // Collaborative toggle
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.05),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: SwitchListTile(
                      title: const Text(
                        'Collaborative',
                        style: TextStyle(color: Colors.white),
                      ),
                      subtitle: const Text(
                        'Others can add videos to this playlist',
                        style: TextStyle(color: Colors.white54, fontSize: 12),
                      ),
                      value: _isCollaborative,
                      onChanged: (value) {
                        setState(() {
                          _isCollaborative = value;
                        });
                      },
                      activeColor: const Color(0xFF00CED1),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16),
                    ),
                  ),
                  const SizedBox(height: 24),
                  
                  // Tags
                  const Text(
                    'Tags',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 12),
                  
                  // Tag input
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _tagController,
                          style: const TextStyle(color: Colors.white),
                          decoration: InputDecoration(
                            hintText: 'Add tag',
                            hintStyle: const TextStyle(color: Colors.white54),
                            filled: true,
                            fillColor: Colors.white.withOpacity(0.1),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: BorderSide.none,
                            ),
                            contentPadding: const EdgeInsets.symmetric(
                              horizontal: 16,
                              vertical: 12,
                            ),
                          ),
                          onSubmitted: (_) => _addTag(),
                        ),
                      ),
                      const SizedBox(width: 8),
                      IconButton(
                        onPressed: _addTag,
                        icon: const Icon(Icons.add, color: Color(0xFF00CED1)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  
                  // Tag chips
                  if (_tags.isNotEmpty)
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: _tags.map((tag) {
                        return Chip(
                          label: Text(
                            tag,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                            ),
                          ),
                          deleteIcon: const Icon(
                            Icons.close,
                            color: Colors.white54,
                            size: 18,
                          ),
                          onDeleted: () => _removeTag(tag),
                          backgroundColor: const Color(0xFF00CED1).withOpacity(0.2),
                          side: const BorderSide(
                            color: Color(0xFF00CED1),
                          ),
                        );
                      }).toList(),
                    ),
                ],
              ),
            ),
          ),
          
          // Create button
          Container(
            padding: const EdgeInsets.all(16),
            child: SafeArea(
              top: false,
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _isCreating ? null : _createPlaylist,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF00CED1),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    disabledBackgroundColor: const Color(0xFF00CED1).withOpacity(0.5),
                  ),
                  child: _isCreating
                      ? const SizedBox(
                          width: 24,
                          height: 24,
                          child: CircularProgressIndicator(
                            color: Colors.white,
                            strokeWidth: 2,
                          ),
                        )
                      : const Text(
                          'Create Playlist',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildTextField({
    required TextEditingController controller,
    required FocusNode focusNode,
    required String label,
    required String hint,
    int maxLines = 1,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 14,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: controller,
          focusNode: focusNode,
          maxLines: maxLines,
          style: const TextStyle(color: Colors.white),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: const TextStyle(color: Colors.white54),
            filled: true,
            fillColor: Colors.white.withOpacity(0.1),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide.none,
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(
                color: Color(0xFF00CED1),
              ),
            ),
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 16,
              vertical: 12,
            ),
          ),
        ),
      ],
    );
  }
  
  String _getTypeLabel(PlaylistType type) {
    switch (type) {
      case PlaylistType.custom:
        return 'Custom';
      case PlaylistType.shared:
        return 'Shared';
      case PlaylistType.collaborative:
        return 'Collaborative';
      default:
        return type.name;
    }
  }
}