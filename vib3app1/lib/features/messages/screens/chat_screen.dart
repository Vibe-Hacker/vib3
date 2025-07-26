import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'dart:async';
import '../../../app/theme/app_theme.dart';
import '../../../core/models/message_model.dart';
import '../../../core/models/user_model.dart';
import '../../../core/services/auth_service.dart';
import '../../../core/widgets/placeholder_image.dart';

class ChatScreen extends StatefulWidget {
  final User recipient;
  
  const ChatScreen({
    Key? key,
    required this.recipient,
  }) : super(key: key);

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final FocusNode _focusNode = FocusNode();
  
  List<Message> _messages = [];
  bool _isTyping = false;
  Timer? _typingTimer;
  
  // Disappearing message settings
  MessageDuration _selectedDuration = MessageDuration.permanent;
  
  @override
  void initState() {
    super.initState();
    _loadMockMessages();
  }
  
  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    _focusNode.dispose();
    _typingTimer?.cancel();
    super.dispose();
  }
  
  void _loadMockMessages() {
    final currentUser = context.read<AuthService>().currentUser;
    final now = DateTime.now();
    
    _messages = [
      Message(
        id: 'msg_1',
        conversationId: 'conv_1',
        senderId: widget.recipient.id,
        recipientId: currentUser?.id ?? 'user',
        content: 'Hey! How are you?',
        type: MessageType.text,
        createdAt: now.subtract(const Duration(hours: 2)),
        isRead: true,
        duration: MessageDuration.permanent,
      ),
      Message(
        id: 'msg_2',
        conversationId: 'conv_1',
        senderId: currentUser?.id ?? 'user',
        recipientId: widget.recipient.id,
        content: "I'm good! Just working on the new app",
        type: MessageType.text,
        createdAt: now.subtract(const Duration(hours: 1, minutes: 30)),
        isRead: true,
        duration: MessageDuration.permanent,
      ),
      Message(
        id: 'msg_3',
        conversationId: 'conv_1',
        senderId: widget.recipient.id,
        recipientId: currentUser?.id ?? 'user',
        content: '🔥 That sounds exciting!',
        type: MessageType.text,
        createdAt: now.subtract(const Duration(hours: 1)),
        isRead: true,
        duration: MessageDuration.permanent,
      ),
      Message(
        id: 'msg_4',
        conversationId: 'conv_1',
        senderId: widget.recipient.id,
        recipientId: currentUser?.id ?? 'user',
        content: 'Check this out!',
        type: MessageType.text,
        createdAt: now.subtract(const Duration(minutes: 30)),
        isRead: true,
        duration: MessageDuration.fiveSeconds,
        expiresAt: now.subtract(const Duration(minutes: 25)),
      ),
      Message(
        id: 'msg_5',
        conversationId: 'conv_1',
        senderId: currentUser?.id ?? 'user',
        recipientId: widget.recipient.id,
        content: 'media_placeholder',
        mediaUrl: 'https://example.com/image.jpg',
        type: MessageType.photo,
        createdAt: now.subtract(const Duration(minutes: 15)),
        isRead: true,
        duration: MessageDuration.tenSeconds,
        viewedAt: now.subtract(const Duration(minutes: 14)),
        expiresAt: now.subtract(const Duration(minutes: 14, seconds: 50)),
      ),
    ];
  }
  
  void _sendMessage() {
    final text = _messageController.text.trim();
    if (text.isEmpty) return;
    
    final currentUser = context.read<AuthService>().currentUser;
    final now = DateTime.now();
    
    final message = Message(
      id: 'msg_${DateTime.now().millisecondsSinceEpoch}',
      conversationId: 'conv_1',
      senderId: currentUser?.id ?? 'user',
      recipientId: widget.recipient.id,
      content: text,
      type: MessageType.text,
      createdAt: now,
      isRead: false,
      duration: _selectedDuration,
      expiresAt: _selectedDuration != MessageDuration.permanent
          ? now.add(_getDurationTime(_selectedDuration))
          : null,
    );
    
    setState(() {
      _messages.add(message);
      _messageController.clear();
    });
    
    // Scroll to bottom
    _scrollController.animateTo(
      _scrollController.position.maxScrollExtent + 100,
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeOut,
    );
    
    HapticFeedback.lightImpact();
  }
  
  Duration _getDurationTime(MessageDuration duration) {
    switch (duration) {
      case MessageDuration.fiveSeconds:
        return const Duration(seconds: 5);
      case MessageDuration.tenSeconds:
        return const Duration(seconds: 10);
      case MessageDuration.thirtySeconds:
        return const Duration(seconds: 30);
      case MessageDuration.oneMinute:
        return const Duration(minutes: 1);
      case MessageDuration.fiveMinutes:
        return const Duration(minutes: 5);
      case MessageDuration.oneHour:
        return const Duration(hours: 1);
      case MessageDuration.oneDay:
        return const Duration(days: 1);
      case MessageDuration.permanent:
        return const Duration(days: 36500); // ~100 years
    }
  }
  
  @override
  Widget build(BuildContext context) {
    final currentUser = context.watch<AuthService>().currentUser;
    
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        backgroundColor: AppTheme.backgroundColor,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
        title: Row(
          children: [
            PlaceholderAvatar(
              size: 36,
              seed: widget.recipient.username,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        widget.recipient.displayName,
                        style: const TextStyle(fontSize: 16),
                      ),
                      if (widget.recipient.isVerified) ...[
                        const SizedBox(width: 4),
                        const Icon(
                          Icons.verified,
                          size: 16,
                          color: Colors.blue,
                        ),
                      ],
                    ],
                  ),
                  Text(
                    _isTyping ? 'typing...' : 'Active now',
                    style: TextStyle(
                      fontSize: 12,
                      color: _isTyping ? AppTheme.primaryColor : Colors.white60,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.videocam_outlined),
            onPressed: () {
              // TODO: Start video call
            },
          ),
          IconButton(
            icon: const Icon(Icons.call_outlined),
            onPressed: () {
              // TODO: Start voice call
            },
          ),
          IconButton(
            icon: const Icon(Icons.more_vert),
            onPressed: () {
              _showChatOptions();
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Messages list
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              itemCount: _messages.length,
              itemBuilder: (context, index) {
                final message = _messages[index];
                final isMe = message.senderId == currentUser?.id;
                final isExpired = message.isExpired;
                
                return _buildMessage(message, isMe, isExpired);
              },
            ),
          ),
          
          // Message input
          _buildMessageInput(),
        ],
      ),
    );
  }
  
  Widget _buildMessage(Message message, bool isMe, bool isExpired) {
    if (isExpired) {
      return Container(
        margin: const EdgeInsets.symmetric(vertical: 4),
        child: Center(
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              color: AppTheme.surfaceColor.withOpacity(0.5),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  Icons.timer_off,
                  size: 16,
                  color: Colors.white60,
                ),
                const SizedBox(width: 8),
                Text(
                  'Message expired',
                  style: TextStyle(
                    color: Colors.white60,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }
    
    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: EdgeInsets.only(
          top: 4,
          bottom: 4,
          left: isMe ? 60 : 0,
          right: isMe ? 0 : 60,
        ),
        child: Column(
          crossAxisAlignment: isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              decoration: BoxDecoration(
                color: isMe ? AppTheme.primaryColor : AppTheme.surfaceColor,
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(20),
                  topRight: const Radius.circular(20),
                  bottomLeft: Radius.circular(isMe ? 20 : 4),
                  bottomRight: Radius.circular(isMe ? 4 : 20),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (message.type == MessageType.photo)
                    Container(
                      width: 200,
                      height: 150,
                      decoration: BoxDecoration(
                        color: Colors.white10,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Center(
                        child: Icon(Icons.photo, color: Colors.white54),
                      ),
                    )
                  else
                    Text(
                      message.content,
                      style: TextStyle(
                        color: isMe ? Colors.white : Colors.white,
                      ),
                    ),
                  
                  if (message.duration != MessageDuration.permanent) ...[
                    const SizedBox(height: 4),
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.timer,
                          size: 12,
                          color: isMe ? Colors.white70 : Colors.white60,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          _getDurationLabel(message.duration),
                          style: TextStyle(
                            fontSize: 11,
                            color: isMe ? Colors.white70 : Colors.white60,
                          ),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 2),
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  _formatTime(message.createdAt),
                  style: TextStyle(
                    fontSize: 11,
                    color: Colors.white38,
                  ),
                ),
                if (isMe && message.isRead) ...[
                  const SizedBox(width: 4),
                  const Icon(
                    Icons.done_all,
                    size: 14,
                    color: AppTheme.secondaryColor,
                  ),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildMessageInput() {
    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: AppTheme.surfaceColor,
        border: Border(
          top: BorderSide(color: Colors.white12),
        ),
      ),
      child: SafeArea(
        child: Column(
          children: [
            // Disappearing message indicator
            if (_selectedDuration != MessageDuration.permanent)
              Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: AppTheme.primaryColor.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.timer, size: 16, color: AppTheme.primaryColor),
                    const SizedBox(width: 6),
                    Text(
                      'Messages will disappear after ${_getDurationLabel(_selectedDuration)}',
                      style: const TextStyle(fontSize: 12, color: AppTheme.primaryColor),
                    ),
                    const SizedBox(width: 8),
                    GestureDetector(
                      onTap: () => setState(() => _selectedDuration = MessageDuration.permanent),
                      child: const Icon(Icons.close, size: 16, color: AppTheme.primaryColor),
                    ),
                  ],
                ),
              ),
            
            // Input row
            Row(
              children: [
                // Camera button
                IconButton(
                  icon: const Icon(Icons.camera_alt_outlined),
                  onPressed: () {
                    context.push('/camera');
                  },
                ),
                
                // Timer button
                IconButton(
                  icon: Icon(
                    Icons.timer_outlined,
                    color: _selectedDuration != MessageDuration.permanent
                        ? AppTheme.primaryColor
                        : null,
                  ),
                  onPressed: _showDisappearingOptions,
                ),
                
                // Message field
                Expanded(
                  child: Container(
                    decoration: BoxDecoration(
                      color: AppTheme.backgroundColor,
                      borderRadius: BorderRadius.circular(24),
                    ),
                    child: TextField(
                      controller: _messageController,
                      focusNode: _focusNode,
                      decoration: InputDecoration(
                        hintText: 'Message...',
                        hintStyle: TextStyle(color: Colors.white38),
                        border: InputBorder.none,
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 10,
                        ),
                      ),
                      onChanged: (text) {
                        _typingTimer?.cancel();
                        setState(() => _isTyping = true);
                        _typingTimer = Timer(const Duration(seconds: 2), () {
                          setState(() => _isTyping = false);
                        });
                      },
                    ),
                  ),
                ),
                
                // Send button
                IconButton(
                  icon: const Icon(Icons.send_rounded),
                  color: AppTheme.primaryColor,
                  onPressed: _sendMessage,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
  
  void _showDisappearingOptions() {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppTheme.surfaceColor,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                margin: const EdgeInsets.only(top: 12),
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.white24,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const Padding(
                padding: EdgeInsets.all(16),
                child: Text(
                  'Disappearing Messages',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              ...MessageDuration.values.map((duration) {
                final isSelected = duration == _selectedDuration;
                return ListTile(
                  leading: Icon(
                    duration == MessageDuration.permanent
                        ? Icons.all_inclusive
                        : Icons.timer,
                    color: isSelected ? AppTheme.primaryColor : null,
                  ),
                  title: Text(
                    _getDurationLabel(duration),
                    style: TextStyle(
                      color: isSelected ? AppTheme.primaryColor : null,
                      fontWeight: isSelected ? FontWeight.bold : null,
                    ),
                  ),
                  trailing: isSelected
                      ? const Icon(Icons.check, color: AppTheme.primaryColor)
                      : null,
                  onTap: () {
                    setState(() => _selectedDuration = duration);
                    Navigator.pop(context);
                  },
                );
              }).toList(),
            ],
          ),
        );
      },
    );
  }
  
  void _showChatOptions() {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppTheme.surfaceColor,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: const Icon(Icons.block),
                title: const Text('Block User'),
                onTap: () {
                  Navigator.pop(context);
                  // TODO: Block user
                },
              ),
              ListTile(
                leading: const Icon(Icons.delete_outline),
                title: const Text('Delete Conversation'),
                onTap: () {
                  Navigator.pop(context);
                  // TODO: Delete conversation
                },
              ),
              ListTile(
                leading: const Icon(Icons.report_outlined),
                title: const Text('Report'),
                onTap: () {
                  Navigator.pop(context);
                  // TODO: Report user
                },
              ),
            ],
          ),
        );
      },
    );
  }
  
  String _getDurationLabel(MessageDuration duration) {
    switch (duration) {
      case MessageDuration.fiveSeconds:
        return '5 seconds';
      case MessageDuration.tenSeconds:
        return '10 seconds';
      case MessageDuration.thirtySeconds:
        return '30 seconds';
      case MessageDuration.oneMinute:
        return '1 minute';
      case MessageDuration.fiveMinutes:
        return '5 minutes';
      case MessageDuration.oneHour:
        return '1 hour';
      case MessageDuration.oneDay:
        return '24 hours';
      case MessageDuration.permanent:
        return 'Keep messages';
    }
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
    } else {
      return '${difference.inDays}d';
    }
  }
}