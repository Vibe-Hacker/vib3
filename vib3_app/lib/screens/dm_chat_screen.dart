import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'dart:async';
import '../models/chat.dart';
import '../models/dm_message.dart';
import '../services/chat_service.dart';
import '../providers/auth_provider.dart';
import '../widgets/message_bubble.dart';
import '../widgets/message_input.dart';
import '../widgets/typing_indicator.dart' as typing_widget;

class DMChatScreen extends StatefulWidget {
  final Chat chat;
  
  const DMChatScreen({
    super.key,
    required this.chat,
  });

  @override
  State<DMChatScreen> createState() => _DMChatScreenState();
}

class _DMChatScreenState extends State<DMChatScreen> {
  final ScrollController _scrollController = ScrollController();
  final TextEditingController _messageController = TextEditingController();
  
  List<Message> _messages = [];
  bool _isLoading = true;
  bool _isLoadingMore = false;
  bool _isSending = false;
  Message? _replyingTo;
  Timer? _typingTimer;
  bool _isTyping = false;
  Set<String> _typingUsers = {};
  
  @override
  void initState() {
    super.initState();
    _loadMessages();
    _markAsRead();
    _scrollController.addListener(_scrollListener);
  }
  
  @override
  void dispose() {
    _typingTimer?.cancel();
    _scrollController.dispose();
    _messageController.dispose();
    super.dispose();
  }
  
  void _scrollListener() {
    if (_scrollController.position.pixels >= 
        _scrollController.position.maxScrollExtent - 200) {
      _loadMoreMessages();
    }
  }
  
  Future<void> _loadMessages() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final token = authProvider.authToken;
    
    if (token == null) return;
    
    setState(() {
      _isLoading = true;
    });
    
    try {
      final messages = await ChatService.getChatMessages(
        chatId: widget.chat.id,
        token: token,
      );
      
      if (mounted) {
        setState(() {
          _messages = messages.reversed.toList();
          _isLoading = false;
        });
        
        // Scroll to bottom after loading
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (_scrollController.hasClients) {
            _scrollController.jumpTo(0);
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
  
  Future<void> _loadMoreMessages() async {
    if (_isLoadingMore || _messages.isEmpty) return;
    
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final token = authProvider.authToken;
    
    if (token == null) return;
    
    setState(() {
      _isLoadingMore = true;
    });
    
    try {
      final moreMessages = await ChatService.getChatMessages(
        chatId: widget.chat.id,
        token: token,
        offset: _messages.length,
      );
      
      if (mounted && moreMessages.isNotEmpty) {
        setState(() {
          _messages.addAll(moreMessages.reversed);
          _isLoadingMore = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoadingMore = false;
        });
      }
    }
  }
  
  Future<void> _markAsRead() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final token = authProvider.authToken;
    
    if (token == null) return;
    
    await ChatService.markMessagesAsRead(
      chatId: widget.chat.id,
      token: token,
    );
  }
  
  Future<void> _sendMessage({
    String? text,
    String? videoUrl,
    String? imageUrl,
    String? audioUrl,
    int? audioDuration,
  }) async {
    if (text?.trim().isEmpty ?? true && 
        videoUrl == null && 
        imageUrl == null && 
        audioUrl == null) return;
    
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final token = authProvider.authToken;
    final currentUser = authProvider.currentUser;
    
    if (token == null || currentUser == null) return;
    
    setState(() {
      _isSending = true;
    });
    
    try {
      final message = await ChatService.sendMessage(
        chatId: widget.chat.id,
        token: token,
        text: text,
        videoUrl: videoUrl,
        imageUrl: imageUrl,
        audioUrl: audioUrl,
        audioDuration: audioDuration,
        replyToId: _replyingTo?.id,
      );
      
      if (message != null && mounted) {
        setState(() {
          _messages.insert(0, message);
          _messageController.clear();
          _replyingTo = null;
          _isSending = false;
        });
        
        // Scroll to bottom
        if (_scrollController.hasClients) {
          _scrollController.animateTo(
            0,
            duration: const Duration(milliseconds: 300),
            curve: Curves.easeOut,
          );
        }
        
        HapticFeedback.lightImpact();
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isSending = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to send message')),
        );
      }
    }
  }
  
  void _handleTyping() {
    if (!_isTyping) {
      _isTyping = true;
      _sendTypingIndicator(true);
    }
    
    _typingTimer?.cancel();
    _typingTimer = Timer(const Duration(seconds: 3), () {
      _isTyping = false;
      _sendTypingIndicator(false);
    });
  }
  
  Future<void> _sendTypingIndicator(bool isTyping) async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final token = authProvider.authToken;
    
    if (token == null) return;
    
    await ChatService.sendTypingIndicator(
      chatId: widget.chat.id,
      token: token,
      isTyping: isTyping,
    );
  }
  
  Future<void> _deleteMessage(Message message) async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final token = authProvider.authToken;
    
    if (token == null) return;
    
    final options = await showModalBottomSheet<String>(
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
              leading: const Icon(Icons.delete_outline, color: Colors.white),
              title: const Text(
                'Delete for me',
                style: TextStyle(color: Colors.white),
              ),
              onTap: () => Navigator.pop(context, 'me'),
            ),
            if (message.senderId == authProvider.currentUser?.id)
              ListTile(
                leading: const Icon(Icons.delete_forever, color: Colors.red),
                title: const Text(
                  'Delete for everyone',
                  style: TextStyle(color: Colors.red),
                ),
                onTap: () => Navigator.pop(context, 'everyone'),
              ),
          ],
        ),
      ),
    );
    
    if (options == null) return;
    
    final success = await ChatService.deleteMessage(
      messageId: message.id,
      token: token,
      forEveryone: options == 'everyone',
    );
    
    if (success && mounted) {
      setState(() {
        _messages.removeWhere((m) => m.id == message.id);
      });
      
      HapticFeedback.mediumImpact();
    }
  }
  
  void _showMessageOptions(Message message) {
    HapticFeedback.mediumImpact();
    
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
              leading: const Icon(Icons.reply, color: Colors.white),
              title: const Text(
                'Reply',
                style: TextStyle(color: Colors.white),
              ),
              onTap: () {
                Navigator.pop(context);
                setState(() {
                  _replyingTo = message;
                });
              },
            ),
            ListTile(
              leading: const Icon(Icons.copy, color: Colors.white),
              title: const Text(
                'Copy',
                style: TextStyle(color: Colors.white),
              ),
              onTap: () {
                Navigator.pop(context);
                if (message.text != null) {
                  Clipboard.setData(ClipboardData(text: message.text!));
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Message copied')),
                  );
                }
              },
            ),
            ListTile(
              leading: const Icon(Icons.delete, color: Colors.red),
              title: const Text(
                'Delete',
                style: TextStyle(color: Colors.red),
              ),
              onTap: () {
                Navigator.pop(context);
                _deleteMessage(message);
              },
            ),
          ],
        ),
      ),
    );
  }
  
  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final currentUserId = authProvider.currentUser?.id;
    
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: const Color(0xFF1A1A1A),
        elevation: 2,
        title: Row(
          children: [
            // Avatar
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: const LinearGradient(
                  colors: [Color(0xFF00CED1), Color(0xFFFF1493)],
                ),
              ),
              child: Center(
                child: Text(
                  _getChatDisplayName()[0].toUpperCase(),
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 12),
            
            // Name and status
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _getChatDisplayName(),
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  if (_typingUsers.isNotEmpty)
                    const Text(
                      'typing...',
                      style: TextStyle(
                        color: Color(0xFF00CED1),
                        fontSize: 12,
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            onPressed: () {
              // TODO: Video call
            },
            icon: const Icon(Icons.videocam_outlined, color: Colors.white),
          ),
          IconButton(
            onPressed: _showChatOptions,
            icon: const Icon(Icons.more_vert, color: Colors.white),
          ),
        ],
      ),
      body: Column(
        children: [
          // Messages list
          Expanded(
            child: _isLoading
                ? const Center(
                    child: CircularProgressIndicator(
                      color: Color(0xFF00CED1),
                    ),
                  )
                : ListView.builder(
                    controller: _scrollController,
                    reverse: true,
                    padding: const EdgeInsets.all(16),
                    itemCount: _messages.length + (_isLoadingMore ? 1 : 0),
                    itemBuilder: (context, index) {
                      if (index == _messages.length) {
                        return const Center(
                          child: Padding(
                            padding: EdgeInsets.all(16),
                            child: CircularProgressIndicator(
                              color: Color(0xFF00CED1),
                            ),
                          ),
                        );
                      }
                      
                      final message = _messages[index];
                      final isMe = message.senderId == currentUserId;
                      
                      return MessageBubble(
                        message: message,
                        isMe: isMe,
                        onLongPress: () => _showMessageOptions(message),
                      );
                    },
                  ),
          ),
          
          // Typing indicator
          if (_typingUsers.isNotEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 16),
              child: typing_widget.TypingIndicator(),
            ),
          
          // Reply indicator
          if (_replyingTo != null)
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.05),
                border: Border(
                  top: BorderSide(
                    color: Colors.white.withOpacity(0.1),
                  ),
                ),
              ),
              child: Row(
                children: [
                  Container(
                    width: 4,
                    height: 40,
                    decoration: const BoxDecoration(
                      color: Color(0xFF00CED1),
                      borderRadius: BorderRadius.all(Radius.circular(2)),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Replying to',
                          style: TextStyle(
                            color: Color(0xFF00CED1),
                            fontSize: 12,
                          ),
                        ),
                        Text(
                          _replyingTo!.text ?? 'Media',
                          style: const TextStyle(
                            color: Colors.white70,
                            fontSize: 14,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    onPressed: () {
                      setState(() {
                        _replyingTo = null;
                      });
                    },
                    icon: const Icon(
                      Icons.close,
                      color: Colors.white54,
                      size: 20,
                    ),
                  ),
                ],
              ),
            ),
          
          // Message input
          MessageInput(
            controller: _messageController,
            onSendText: (text) => _sendMessage(text: text),
            onSendMedia: (type, url, duration) {
              switch (type) {
                case 'video':
                  _sendMessage(videoUrl: url);
                  break;
                case 'image':
                  _sendMessage(imageUrl: url);
                  break;
                case 'audio':
                  _sendMessage(audioUrl: url, audioDuration: duration);
                  break;
              }
            },
            onTyping: _handleTyping,
            isSending: _isSending,
          ),
        ],
      ),
    );
  }
  
  String _getChatDisplayName() {
    if (widget.chat.isGroup) {
      return widget.chat.groupName ?? 'Group Chat';
    } else {
      return widget.chat.otherUser?['username'] ?? 'User';
    }
  }
  
  void _showChatOptions() {
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
                widget.chat.isMuted ? Icons.volume_up : Icons.volume_off,
                color: Colors.white,
              ),
              title: Text(
                widget.chat.isMuted ? 'Unmute' : 'Mute',
                style: const TextStyle(color: Colors.white),
              ),
              onTap: () async {
                Navigator.pop(context);
                final authProvider = Provider.of<AuthProvider>(context, listen: false);
                final token = authProvider.authToken;
                
                if (token != null) {
                  await ChatService.toggleMuteChat(
                    chatId: widget.chat.id,
                    token: token,
                    mute: !widget.chat.isMuted,
                  );
                }
              },
            ),
            ListTile(
              leading: const Icon(Icons.delete_sweep, color: Colors.white),
              title: const Text(
                'Clear chat',
                style: TextStyle(color: Colors.white),
              ),
              onTap: () async {
                Navigator.pop(context);
                final confirmed = await showDialog<bool>(
                  context: context,
                  builder: (context) => AlertDialog(
                    backgroundColor: const Color(0xFF1A1A1A),
                    title: const Text(
                      'Clear chat?',
                      style: TextStyle(color: Colors.white),
                    ),
                    content: const Text(
                      'This will delete all messages in this chat for you.',
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
                          'Clear',
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
                    final success = await ChatService.clearChatHistory(
                      chatId: widget.chat.id,
                      token: token,
                    );
                    
                    if (success && mounted) {
                      setState(() {
                        _messages.clear();
                      });
                    }
                  }
                }
              },
            ),
            ListTile(
              leading: const Icon(Icons.block, color: Colors.red),
              title: const Text(
                'Block user',
                style: TextStyle(color: Colors.red),
              ),
              onTap: () {
                Navigator.pop(context);
                // TODO: Implement block user
              },
            ),
          ],
        ),
      ),
    );
  }
}