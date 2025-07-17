import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../services/user_service.dart';
import '../services/chat_service.dart';
import '../models/user_model.dart';
import 'dm_chat_screen.dart';

class NewChatScreen extends StatefulWidget {
  const NewChatScreen({super.key});
  
  @override
  State<NewChatScreen> createState() => _NewChatScreenState();
}

class _NewChatScreenState extends State<NewChatScreen> {
  final TextEditingController _searchController = TextEditingController();
  final Set<String> _selectedUserIds = {};
  List<User> _searchResults = [];
  List<User> _recentUsers = [];
  bool _isSearching = false;
  bool _isCreatingGroup = false;
  String? _groupName;
  
  @override
  void initState() {
    super.initState();
    _loadRecentUsers();
  }
  
  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }
  
  Future<void> _loadRecentUsers() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final token = authProvider.authToken;
    
    if (token == null) return;
    
    try {
      // TODO: Load actual recent users
      // For now, just show empty state
      setState(() {
        _recentUsers = [];
      });
    } catch (e) {
      print('Error loading recent users: $e');
    }
  }
  
  Future<void> _searchUsers(String query) async {
    if (query.isEmpty) {
      setState(() {
        _searchResults = [];
        _isSearching = false;
      });
      return;
    }
    
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final token = authProvider.authToken;
    
    if (token == null) return;
    
    setState(() {
      _isSearching = true;
    });
    
    try {
      final results = await UserService.searchUsers(query, token);
      
      if (mounted) {
        setState(() {
          _searchResults = results.where((user) => 
            user.id != authProvider.currentUser?.id
          ).toList();
          _isSearching = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isSearching = false;
        });
      }
    }
  }
  
  Future<void> _startChat() async {
    if (_selectedUserIds.isEmpty) return;
    
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final token = authProvider.authToken;
    
    if (token == null) return;
    
    HapticFeedback.lightImpact();
    
    try {
      if (_selectedUserIds.length == 1) {
        // Direct chat
        final chat = await ChatService.createOrGetDirectChat(
          otherUserId: _selectedUserIds.first,
          token: token,
        );
        
        if (chat != null && mounted) {
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(
              builder: (context) => DMChatScreen(chat: chat),
            ),
          );
        }
      } else {
        // Group chat
        if (_groupName == null || _groupName!.isEmpty) {
          _showGroupNameDialog();
          return;
        }
        
        final chat = await ChatService.createGroupChat(
          participantIds: _selectedUserIds.toList(),
          groupName: _groupName!,
          token: token,
        );
        
        if (chat != null && mounted) {
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(
              builder: (context) => DMChatScreen(chat: chat),
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to create chat')),
        );
      }
    }
  }
  
  void _showGroupNameDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1A1A1A),
        title: const Text(
          'Group name',
          style: TextStyle(color: Colors.white),
        ),
        content: TextField(
          autofocus: true,
          style: const TextStyle(color: Colors.white),
          decoration: InputDecoration(
            hintText: 'Enter group name',
            hintStyle: const TextStyle(color: Colors.white54),
            filled: true,
            fillColor: Colors.white.withOpacity(0.05),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: BorderSide.none,
            ),
          ),
          onChanged: (value) {
            _groupName = value;
          },
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              _startChat();
            },
            child: const Text(
              'Create',
              style: TextStyle(color: Color(0xFF00CED1)),
            ),
          ),
        ],
      ),
    );
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: const Color(0xFF1A1A1A),
        elevation: 2,
        leading: IconButton(
          onPressed: () => Navigator.pop(context),
          icon: const Icon(Icons.close, color: Colors.white),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'New message',
              style: TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            if (_selectedUserIds.isNotEmpty)
              Text(
                '${_selectedUserIds.length} selected',
                style: const TextStyle(
                  color: Colors.white70,
                  fontSize: 12,
                ),
              ),
          ],
        ),
        actions: [
          if (_selectedUserIds.isNotEmpty)
            TextButton(
              onPressed: _startChat,
              child: Text(
                _selectedUserIds.length > 1 ? 'Next' : 'Chat',
                style: const TextStyle(
                  color: Color(0xFF00CED1),
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
        ],
      ),
      body: Column(
        children: [
          // Search bar
          Container(
            padding: const EdgeInsets.all(16),
            color: const Color(0xFF1A1A1A),
            child: TextField(
              controller: _searchController,
              onChanged: _searchUsers,
              style: const TextStyle(color: Colors.white),
              decoration: InputDecoration(
                hintText: 'Search VIB3RS',
                hintStyle: const TextStyle(color: Colors.white54),
                prefixIcon: const Icon(Icons.search, color: Colors.white54),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        onPressed: () {
                          _searchController.clear();
                          _searchUsers('');
                        },
                        icon: const Icon(Icons.clear, color: Colors.white54),
                      )
                    : null,
                filled: true,
                fillColor: Colors.white.withOpacity(0.05),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
                contentPadding: const EdgeInsets.symmetric(horizontal: 16),
              ),
            ),
          ),
          
          // Selected users chips
          if (_selectedUserIds.isNotEmpty)
            Container(
              height: 50,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                itemCount: _selectedUserIds.length,
                itemBuilder: (context, index) {
                  final userId = _selectedUserIds.toList()[index];
                  final user = [..._searchResults, ..._recentUsers]
                      .firstWhere((u) => u.id == userId);
                  
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: Chip(
                      label: Text(
                        '@${user.username}',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 13,
                        ),
                      ),
                      deleteIcon: const Icon(
                        Icons.close,
                        color: Colors.white70,
                        size: 18,
                      ),
                      onDeleted: () {
                        setState(() {
                          _selectedUserIds.remove(userId);
                        });
                      },
                      backgroundColor: const Color(0xFF00CED1).withOpacity(0.3),
                      side: const BorderSide(
                        color: Color(0xFF00CED1),
                      ),
                    ),
                  );
                },
              ),
            ),
          
          // User list
          Expanded(
            child: _isSearching
                ? const Center(
                    child: CircularProgressIndicator(
                      color: Color(0xFF00CED1),
                    ),
                  )
                : ListView(
                    children: [
                      if (_searchController.text.isEmpty && _recentUsers.isNotEmpty) ...[
                        const Padding(
                          padding: EdgeInsets.all(16),
                          child: Text(
                            'Recent',
                            style: TextStyle(
                              color: Colors.white70,
                              fontSize: 14,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                        ..._recentUsers.map((user) => _UserTile(
                          user: user,
                          isSelected: _selectedUserIds.contains(user.id),
                          onTap: () {
                            setState(() {
                              if (_selectedUserIds.contains(user.id)) {
                                _selectedUserIds.remove(user.id);
                              } else {
                                _selectedUserIds.add(user.id);
                              }
                            });
                          },
                        )),
                      ],
                      
                      if (_searchResults.isNotEmpty) ...[
                        if (_searchController.text.isNotEmpty)
                          const Padding(
                            padding: EdgeInsets.all(16),
                            child: Text(
                              'Search results',
                              style: TextStyle(
                                color: Colors.white70,
                                fontSize: 14,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ),
                        ..._searchResults.map((user) => _UserTile(
                          user: user,
                          isSelected: _selectedUserIds.contains(user.id),
                          onTap: () {
                            setState(() {
                              if (_selectedUserIds.contains(user.id)) {
                                _selectedUserIds.remove(user.id);
                              } else {
                                _selectedUserIds.add(user.id);
                              }
                            });
                          },
                        )),
                      ],
                      
                      if (_searchController.text.isNotEmpty && _searchResults.isEmpty)
                        const Center(
                          child: Padding(
                            padding: EdgeInsets.all(32),
                            child: Text(
                              'No users found',
                              style: TextStyle(
                                color: Colors.white54,
                                fontSize: 16,
                              ),
                            ),
                          ),
                        ),
                    ],
                  ),
          ),
        ],
      ),
    );
  }
}

class _UserTile extends StatelessWidget {
  final User user;
  final bool isSelected;
  final VoidCallback onTap;
  
  const _UserTile({
    required this.user,
    required this.isSelected,
    required this.onTap,
  });
  
  @override
  Widget build(BuildContext context) {
    return ListTile(
      onTap: onTap,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      leading: Container(
        width: 48,
        height: 48,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: const LinearGradient(
            colors: [Color(0xFF00CED1), Color(0xFFFF1493)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          border: isSelected
              ? Border.all(
                  color: const Color(0xFF00CED1),
                  width: 3,
                )
              : null,
        ),
        child: user.profilePicture != null
            ? ClipOval(
                child: Image.network(
                  user.profilePicture!,
                  width: 48,
                  height: 48,
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) {
                    return Center(
                      child: Text(
                        user.username[0].toUpperCase(),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    );
                  },
                ),
              )
            : Center(
                child: Text(
                  user.username[0].toUpperCase(),
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
      ),
      title: Text(
        user.username,
        style: const TextStyle(
          color: Colors.white,
          fontWeight: FontWeight.w500,
        ),
      ),
      subtitle: Text(
        '@${user.username}',
        style: const TextStyle(
          color: Colors.white70,
          fontSize: 13,
        ),
      ),
      trailing: isSelected
          ? const Icon(
              Icons.check_circle,
              color: Color(0xFF00CED1),
            )
          : null,
    );
  }
}