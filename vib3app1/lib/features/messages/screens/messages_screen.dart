import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../app/theme/app_theme.dart';
import '../../../core/models/message_model.dart';
import '../../../core/models/user_model.dart';
import '../../../core/services/auth_service.dart';
import '../../../core/widgets/placeholder_image.dart';
import 'chat_screen.dart';

class MessagesScreen extends StatefulWidget {
  final String? chatId;
  
  const MessagesScreen({Key? key, this.chatId}) : super(key: key);

  @override
  State<MessagesScreen> createState() => _MessagesScreenState();
}

class _MessagesScreenState extends State<MessagesScreen> {
  final TextEditingController _searchController = TextEditingController();
  List<Conversation> _conversations = [];
  List<Conversation> _filteredConversations = [];
  
  @override
  void initState() {
    super.initState();
    _loadMockConversations();
    _filteredConversations = _conversations;
  }
  
  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }
  
  void _loadMockConversations() {
    final currentUser = context.read<AuthService>().currentUser;
    final now = DateTime.now();
    
    _conversations = List.generate(10, (index) {
      final otherUser = User(
        id: 'user_$index',
        username: 'user_$index',
        email: 'user$index@example.com',
        displayName: 'User ${index + 1}',
        bio: 'Hey there! I am using VIB3',
        profilePicture: 'avatar_$index',
        followersCount: 1000 + index * 100,
        followingCount: 500 + index * 50,
        postsCount: 50 + index * 10,
        isVerified: index % 3 == 0,
        createdAt: now,
        updatedAt: now,
      );
      
      return Conversation(
        id: 'conv_$index',
        participantIds: [currentUser?.id ?? 'me', otherUser.id],
        participants: [currentUser ?? User(
          id: 'me',
          username: 'me',
          email: 'me@example.com',
          displayName: 'Me',
          createdAt: now,
          updatedAt: now,
        ), otherUser],
        lastMessage: Message(
          id: 'msg_last_$index',
          conversationId: 'conv_$index',
          senderId: index % 2 == 0 ? otherUser.id : currentUser?.id ?? 'me',
          recipientId: index % 2 == 0 ? currentUser?.id ?? 'me' : otherUser.id,
          content: _getRandomMessage(index),
          type: index % 5 == 0 ? MessageType.photo : MessageType.text,
          duration: index % 3 == 0 ? MessageDuration.fiveMinutes : MessageDuration.permanent,
          createdAt: now.subtract(Duration(minutes: index * 10)),
          isRead: index % 2 == 0,
        ),
        unreadCount: index % 2 == 0 ? 0 : index % 4 + 1,
        createdAt: now.subtract(Duration(days: index)),
        updatedAt: now.subtract(Duration(minutes: index * 10)),
      );
    });
  }
  
  String _getRandomMessage(int index) {
    final messages = [
      'Hey! How are you doing?',
      'Check out this amazing video!',
      'Just saw your story 🔥',
      'Thanks for the follow!',
      'When are we meeting up?',
      'That was hilarious 😂',
      'Good morning! ☀️',
      'Did you see the latest update?',
      'Let me know what you think',
      'See you tomorrow!',
    ];
    return messages[index % messages.length];
  }
  
  void _filterConversations(String query) {
    setState(() {
      if (query.isEmpty) {
        _filteredConversations = _conversations;
      } else {
        _filteredConversations = _conversations.where((conv) {
          final otherUser = conv.participants?.firstWhere(
            (u) => u.id != context.read<AuthService>().currentUser?.id,
          );
          return otherUser?.displayName.toLowerCase().contains(query.toLowerCase()) ?? false;
        }).toList();
      }
    });
  }
  
  @override
  Widget build(BuildContext context) {
    if (widget.chatId != null) {
      // If chatId is provided, show chat screen directly
      final conversation = _conversations.firstWhere(
        (c) => c.id == widget.chatId,
        orElse: () => _conversations.first,
      );
      final otherUser = conversation.participants?.firstWhere(
        (u) => u.id != context.read<AuthService>().currentUser?.id,
      );
      
      if (otherUser != null) {
        return ChatScreen(recipient: otherUser);
      }
    }
    
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        backgroundColor: AppTheme.backgroundColor,
        elevation: 0,
        title: const Text('Messages'),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit_outlined),
            onPressed: () {
              // TODO: New message
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Search bar
          Container(
            padding: const EdgeInsets.all(16),
            child: Container(
              decoration: BoxDecoration(
                color: AppTheme.surfaceColor,
                borderRadius: BorderRadius.circular(30),
              ),
              child: TextField(
                controller: _searchController,
                decoration: const InputDecoration(
                  hintText: 'Search messages...',
                  hintStyle: TextStyle(color: Colors.white38),
                  prefixIcon: Icon(Icons.search, color: Colors.white38),
                  border: InputBorder.none,
                  contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                ),
                onChanged: _filterConversations,
              ),
            ),
          ),
          
          // Conversations list
          Expanded(
            child: _filteredConversations.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.message_outlined,
                          size: 64,
                          color: Colors.white24,
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'No messages yet',
                          style: TextStyle(
                            color: Colors.white54,
                            fontSize: 16,
                          ),
                        ),
                      ],
                    ),
                  )
                : ListView.builder(
                    itemCount: _filteredConversations.length,
                    itemBuilder: (context, index) {
                      final conversation = _filteredConversations[index];
                      return _buildConversationItem(conversation)
                          .animate()
                          .fadeIn(delay: Duration(milliseconds: index * 50));
                    },
                  ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildConversationItem(Conversation conversation) {
    final currentUser = context.watch<AuthService>().currentUser;
    final otherUser = conversation.participants?.firstWhere(
      (u) => u.id != currentUser?.id,
      orElse: () => User(
        id: 'unknown',
        username: 'unknown',
        email: 'unknown@example.com',
        displayName: 'Unknown User',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      ),
    );
    
    if (otherUser == null) return const SizedBox.shrink();
    
    final isUnread = conversation.unreadCount > 0;
    final lastMessage = conversation.lastMessage;
    final isFromMe = lastMessage?.senderId == currentUser?.id;
    
    return ListTile(
      onTap: () {
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (context) => ChatScreen(recipient: otherUser),
          ),
        );
      },
      leading: Stack(
        children: [
          PlaceholderAvatar(
            size: 56,
            seed: otherUser.username,
          ),
          if (isUnread)
            Positioned(
              right: 0,
              bottom: 0,
              child: Container(
                width: 16,
                height: 16,
                decoration: BoxDecoration(
                  color: AppTheme.primaryColor,
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: AppTheme.backgroundColor,
                    width: 2,
                  ),
                ),
              ),
            ),
        ],
      ),
      title: Row(
        children: [
          Expanded(
            child: Text(
              otherUser.displayName,
              style: TextStyle(
                fontWeight: isUnread ? FontWeight.bold : FontWeight.normal,
              ),
            ),
          ),
          if (otherUser.isVerified)
            const Icon(
              Icons.verified,
              size: 16,
              color: Colors.blue,
            ),
        ],
      ),
      subtitle: Row(
        children: [
          if (isFromMe) ...[
            Icon(
              Icons.done_all,
              size: 16,
              color: lastMessage?.isRead == true
                  ? AppTheme.secondaryColor
                  : Colors.white38,
            ),
            const SizedBox(width: 4),
          ],
          Expanded(
            child: Text(
              lastMessage?.type == MessageType.photo
                  ? '📷 Photo'
                  : lastMessage?.content ?? '',
              style: TextStyle(
                color: isUnread ? Colors.white70 : Colors.white54,
                fontWeight: isUnread ? FontWeight.w500 : FontWeight.normal,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          const SizedBox(width: 8),
          Text(
            _formatTime(lastMessage?.createdAt ?? DateTime.now()),
            style: TextStyle(
              color: isUnread ? AppTheme.primaryColor : Colors.white38,
              fontSize: 12,
              fontWeight: isUnread ? FontWeight.bold : FontWeight.normal,
            ),
          ),
        ],
      ),
      trailing: isUnread
          ? Container(
              width: 24,
              height: 24,
              decoration: BoxDecoration(
                color: AppTheme.primaryColor,
                shape: BoxShape.circle,
              ),
              child: Center(
                child: Text(
                  conversation.unreadCount.toString(),
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            )
          : null,
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
      return '${time.day}/${time.month}';
    }
  }
}