import 'package:flutter/material.dart';
import 'dart:async';
import 'dart:math' as math;

class LiveChatWidget extends StatefulWidget {
  final String streamId;
  final bool isHost;
  
  const LiveChatWidget({
    super.key,
    required this.streamId,
    this.isHost = false,
  });
  
  @override
  State<LiveChatWidget> createState() => _LiveChatWidgetState();
}

class _LiveChatWidgetState extends State<LiveChatWidget>
    with TickerProviderStateMixin {
  final List<ChatMessage> _messages = [];
  final ScrollController _scrollController = ScrollController();
  Timer? _mockMessageTimer;
  
  @override
  void initState() {
    super.initState();
    _startMockMessages();
  }
  
  @override
  void dispose() {
    _mockMessageTimer?.cancel();
    _scrollController.dispose();
    super.dispose();
  }
  
  void _startMockMessages() {
    // Mock messages for demo
    final mockMessages = [
      ChatMessage(
        id: '1',
        username: 'user123',
        message: 'Hello!',
        color: const Color(0xFFFF0080),
        type: MessageType.normal,
      ),
      ChatMessage(
        id: '2',
        username: 'vib3fan',
        message: 'Amazing stream! 🔥',
        color: const Color(0xFF00CED1),
        type: MessageType.normal,
      ),
      ChatMessage(
        id: '3',
        username: 'streamer99',
        message: 'just joined',
        color: const Color(0xFFFFD700),
        type: MessageType.join,
      ),
      ChatMessage(
        id: '4',
        username: 'cooluser',
        message: 'sent a gift 🎁',
        color: const Color(0xFFFF1493),
        type: MessageType.gift,
      ),
    ];
    
    int index = 0;
    _mockMessageTimer = Timer.periodic(const Duration(seconds: 3), (_) {
      if (mounted && index < mockMessages.length) {
        _addMessage(mockMessages[index]);
        index++;
      }
    });
  }
  
  void _addMessage(ChatMessage message) {
    setState(() {
      _messages.add(message);
      if (_messages.length > 50) {
        _messages.removeAt(0);
      }
    });
    
    // Auto scroll to bottom
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }
  
  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            Colors.transparent,
            Colors.black.withOpacity(0.3),
          ],
        ),
      ),
      child: ListView.builder(
        controller: _scrollController,
        padding: const EdgeInsets.all(8),
        itemCount: _messages.length,
        itemBuilder: (context, index) {
          final message = _messages[index];
          return _ChatMessageWidget(
            message: message,
            isHost: widget.isHost,
          );
        },
      ),
    );
  }
}

class _ChatMessageWidget extends StatefulWidget {
  final ChatMessage message;
  final bool isHost;
  
  const _ChatMessageWidget({
    required this.message,
    required this.isHost,
  });
  
  @override
  State<_ChatMessageWidget> createState() => _ChatMessageWidgetState();
}

class _ChatMessageWidgetState extends State<_ChatMessageWidget>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;
  
  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 500),
      vsync: this,
    );
    
    _fadeAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeOut,
    ));
    
    _slideAnimation = Tween<Offset>(
      begin: const Offset(-1, 0),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeOut,
    ));
    
    _animationController.forward();
  }
  
  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }
  
  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _fadeAnimation,
      child: SlideTransition(
        position: _slideAnimation,
        child: Container(
          margin: const EdgeInsets.only(bottom: 4),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Message content
              Flexible(
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: _getBackgroundColor(),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: RichText(
                    text: TextSpan(
                      children: [
                        // Username
                        TextSpan(
                          text: widget.message.username,
                          style: TextStyle(
                            color: widget.message.color,
                            fontWeight: FontWeight.bold,
                            fontSize: 13,
                          ),
                        ),
                        // Message
                        TextSpan(
                          text: ' ${widget.message.message}',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              
              // Host badge
              if (widget.isHost && widget.message.username == 'host')
                Container(
                  margin: const EdgeInsets.only(left: 4),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 6,
                    vertical: 2,
                  ),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFF0080),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Text(
                    'HOST',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
  
  Color _getBackgroundColor() {
    switch (widget.message.type) {
      case MessageType.join:
        return Colors.green.withOpacity(0.2);
      case MessageType.gift:
        return const Color(0xFFFF0080).withOpacity(0.2);
      case MessageType.normal:
      default:
        return Colors.black.withOpacity(0.4);
    }
  }
}

class ChatMessage {
  final String id;
  final String username;
  final String message;
  final Color color;
  final MessageType type;
  final DateTime timestamp;
  
  ChatMessage({
    required this.id,
    required this.username,
    required this.message,
    required this.color,
    required this.type,
    DateTime? timestamp,
  }) : timestamp = timestamp ?? DateTime.now();
}

enum MessageType {
  normal,
  join,
  gift,
  system,
}