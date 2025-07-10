import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../services/chat_service.dart';
import '../models/chat.dart';
import 'dm_chat_screen.dart';
import 'new_chat_screen.dart';

class DMMessagesScreen extends StatefulWidget {
  const DMMessagesScreen({super.key});

  @override
  State<DMMessagesScreen> createState() => _DMMessagesScreenState();
}

class _DMMessagesScreenState extends State<DMMessagesScreen> {
  List<Chat> _chats = [];
  bool _isLoading = true;
  final TextEditingController _searchController = TextEditingController();
  List<Chat> _filteredChats = [];
  
  @override
  void initState() {
    super.initState();
    _loadChats();
  }
  
  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }
  
  Future<void> _loadChats() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final token = authProvider.authToken;
    
    if (token == null) return;
    
    setState(() {
      _isLoading = true;
    });
    
    try {
      final chats = await ChatService.getUserChats(token);
      
      if (mounted) {
        setState(() {
          _chats = chats;
          _filteredChats = chats;
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
  
  void _filterChats(String query) {
    setState(() {
      if (query.isEmpty) {
        _filteredChats = _chats;
      } else {
        _filteredChats = _chats.where((chat) {
          final name = chat.isGroup 
              ? chat.groupName?.toLowerCase() ?? '' 
              : chat.otherUser?['username']?.toString().toLowerCase() ?? '';
          return name.contains(query.toLowerCase());
        }).toList();
      }
    });
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: const Color(0xFF1A1A1A),
        elevation: 2,
        title: const Text(
          'Messages',
          style: TextStyle(
            color: Colors.white,
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),
        actions: [
          IconButton(
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const NewChatScreen()),
              ).then((_) => _loadChats());
            },
            icon: const Icon(Icons.edit_outlined, color: Colors.white),
          ),
          IconButton(
            onPressed: _showMessageOptions,
            icon: const Icon(Icons.more_vert, color: Colors.white),
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
              onChanged: _filterChats,
              style: const TextStyle(color: Colors.white),
              decoration: InputDecoration(
                hintText: 'Search messages',
                hintStyle: const TextStyle(color: Colors.white54),
                prefixIcon: const Icon(Icons.search, color: Colors.white54),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        onPressed: () {
                          _searchController.clear();
                          _filterChats('');
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
          
          // Quick actions
          Container(
            height: 50,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              children: [
                _buildQuickAction(
                  icon: Icons.folder_outlined,
                  label: 'Message requests',
                  onTap: () {
                    // TODO: Navigate to message requests
                  },
                ),
                const SizedBox(width: 12),
                _buildQuickAction(
                  icon: Icons.volume_off_outlined,
                  label: 'Muted',
                  onTap: () {
                    // TODO: Show muted chats
                  },
                ),
              ],
            ),
          ),
          
          // Chat list
          Expanded(
            child: _isLoading
                ? const Center(
                    child: CircularProgressIndicator(
                      color: Color(0xFF00CED1),
                    ),
                  )
                : _filteredChats.isEmpty
                    ? _buildEmptyState()
                    : ListView.builder(
                        padding: const EdgeInsets.only(top: 8),
                        itemCount: _filteredChats.length,
                        itemBuilder: (context, index) {
                          final chat = _filteredChats[index];
                          return _ChatTile(
                            chat: chat,
                            onTap: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (context) => DMChatScreen(chat: chat),
                                ),
                              ).then((_) => _loadChats());
                            },
                            onLongPress: () => _showChatOptions(chat),
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildQuickAction({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.05),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: Colors.white.withOpacity(0.1),
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, color: Colors.white70, size: 18),
            const SizedBox(width: 8),
            Text(
              label,
              style: const TextStyle(
                color: Colors.white70,
                fontSize: 14,
              ),
            ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          ShaderMask(
            shaderCallback: (bounds) => const LinearGradient(
              colors: [
                Color(0xFF00CED1),
                Color(0xFFFF1493),
              ],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ).createShader(bounds),
            child: const Icon(
              Icons.chat_bubble_outline,
              size: 80,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 16),
          const Text(
            'No messages yet',
            style: TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Start a conversation with your VIB3RS',
            style: TextStyle(
              color: Colors.white70,
              fontSize: 14,
            ),
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const NewChatScreen()),
              ).then((_) => _loadChats());
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF00CED1),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(24),
              ),
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            ),
            child: const Text(
              'Start a chat',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
    );
  }
  
  void _showMessageOptions() {
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF1A1A1A),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Container(
        padding: const EdgeInsets.symmetric(vertical: 20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.archive_outlined, color: Colors.white),
              title: const Text(
                'Archived',
                style: TextStyle(color: Colors.white),
              ),
              onTap: () {
                Navigator.pop(context);
                // TODO: Show archived chats
              },
            ),
            ListTile(
              leading: const Icon(Icons.settings_outlined, color: Colors.white),
              title: const Text(
                'Message settings',
                style: TextStyle(color: Colors.white),
              ),
              onTap: () {
                Navigator.pop(context);
                // TODO: Navigate to message settings
              },
            ),
          ],
        ),
      ),
    );
  }
  
  void _showChatOptions(Chat chat) {
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF1A1A1A),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Container(
        padding: const EdgeInsets.symmetric(vertical: 20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: Icon(
                chat.isMuted ? Icons.volume_up : Icons.volume_off,
                color: Colors.white,
              ),
              title: Text(
                chat.isMuted ? 'Unmute' : 'Mute',
                style: const TextStyle(color: Colors.white),
              ),
              onTap: () async {
                Navigator.pop(context);
                final authProvider = Provider.of<AuthProvider>(context, listen: false);
                final token = authProvider.authToken;
                
                if (token != null) {
                  await ChatService.toggleMuteChat(
                    chatId: chat.id,
                    token: token,
                    mute: !chat.isMuted,
                  );
                  _loadChats();
                }
              },
            ),
            ListTile(
              leading: const Icon(Icons.archive_outlined, color: Colors.white),
              title: const Text(
                'Archive',
                style: TextStyle(color: Colors.white),
              ),
              onTap: () {
                Navigator.pop(context);
                // TODO: Archive chat
              },
            ),
            ListTile(
              leading: const Icon(Icons.delete_outline, color: Colors.red),
              title: const Text(
                'Delete chat',
                style: TextStyle(color: Colors.red),
              ),
              onTap: () async {
                Navigator.pop(context);
                final confirmed = await showDialog<bool>(
                  context: context,
                  builder: (context) => AlertDialog(
                    backgroundColor: const Color(0xFF1A1A1A),
                    title: const Text(
                      'Delete chat?',
                      style: TextStyle(color: Colors.white),
                    ),
                    content: const Text(
                      'This will delete all messages in this chat.',
                      style: TextStyle(color: Colors.white70),
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
                
                if (confirmed == true) {
                  final authProvider = Provider.of<AuthProvider>(context, listen: false);
                  final token = authProvider.authToken;
                  
                  if (token != null) {
                    await ChatService.clearChatHistory(
                      chatId: chat.id,
                      token: token,
                    );
                    _loadChats();
                  }
                }
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _ChatTile extends StatelessWidget {
  final Chat chat;
  final VoidCallback onTap;
  final VoidCallback onLongPress;
  
  const _ChatTile({
    required this.chat,
    required this.onTap,
    required this.onLongPress,
  });
  
  @override
  Widget build(BuildContext context) {
    final displayName = chat.isGroup 
        ? chat.groupName ?? 'Group Chat' 
        : chat.otherUser?['username'] ?? 'User';
    final profileImage = chat.isGroup
        ? chat.groupImage
        : chat.otherUser?['profileImageUrl'];
    
    return ListTile(
      onTap: onTap,
      onLongPress: onLongPress,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      leading: Container(
        width: 56,
        height: 56,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: const LinearGradient(
            colors: [Color(0xFF00CED1), Color(0xFFFF1493)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: profileImage != null
            ? ClipOval(
                child: Image.network(
                  profileImage,
                  width: 56,
                  height: 56,
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) {
                    return Center(
                      child: Text(
                        displayName[0].toUpperCase(),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    );
                  },
                ),
              )
            : Center(
                child: Text(
                  displayName[0].toUpperCase(),
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
      ),
      title: Row(
        children: [
          Expanded(
            child: Text(
              displayName,
              style: TextStyle(
                color: Colors.white,
                fontWeight: chat.unreadCount > 0 ? FontWeight.bold : FontWeight.normal,
                fontSize: 16,
              ),
            ),
          ),
          if (chat.isMuted)
            const Icon(
              Icons.volume_off,
              color: Colors.white54,
              size: 16,
            ),
        ],
      ),
      subtitle: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 4),
          Text(
            chat.lastMessage ?? 'No messages yet',
            style: TextStyle(
              color: chat.unreadCount > 0 ? Colors.white : Colors.white70,
              fontSize: 14,
              fontWeight: chat.unreadCount > 0 ? FontWeight.w500 : FontWeight.normal,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
      trailing: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Text(
            _formatTime(chat.lastMessageTime ?? chat.createdAt),
            style: TextStyle(
              color: chat.unreadCount > 0 ? const Color(0xFF00CED1) : Colors.white54,
              fontSize: 12,
            ),
          ),
          if (chat.unreadCount > 0) ...[
            const SizedBox(height: 4),
            Container(
              padding: const EdgeInsets.all(6),
              decoration: const BoxDecoration(
                color: Color(0xFF00CED1),
                shape: BoxShape.circle,
              ),
              child: Text(
                chat.unreadCount > 99 ? '99+' : chat.unreadCount.toString(),
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
  
  String _formatTime(DateTime time) {
    final now = DateTime.now();
    final difference = now.difference(time);
    
    if (difference.inMinutes < 1) {
      return 'now';
    } else if (difference.inHours < 1) {
      return '${difference.inMinutes}m';
    } else if (difference.inDays < 1) {
      return '${difference.inHours}h';
    } else if (difference.inDays < 7) {
      return '${difference.inDays}d';
    } else {
      return '${difference.inDays ~/ 7}w';
    }
  }
}