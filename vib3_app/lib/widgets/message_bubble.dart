import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import '../models/dm_message.dart';

class MessageBubble extends StatelessWidget {
  final Message message;
  final bool isMe;
  final VoidCallback? onLongPress;
  
  const MessageBubble({
    super.key,
    required this.message,
    required this.isMe,
    this.onLongPress,
  });
  
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        left: isMe ? 50 : 8,
        right: isMe ? 8 : 50,
        top: 4,
        bottom: 4,
      ),
      child: Row(
        mainAxisAlignment: isMe ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Flexible(
            child: GestureDetector(
              onLongPress: onLongPress,
              child: Column(
                crossAxisAlignment: isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
                children: [
                  // Reply indicator
                  if (message.replyTo != null)
                    Container(
                      margin: const EdgeInsets.only(bottom: 4),
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.05),
                        borderRadius: BorderRadius.circular(12),
                        border: Border(
                          left: BorderSide(
                            color: isMe ? const Color(0xFF00CED1) : const Color(0xFFFF1493),
                            width: 3,
                          ),
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Replying to',
                            style: TextStyle(
                              color: isMe ? const Color(0xFF00CED1) : const Color(0xFFFF1493),
                              fontSize: 11,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            message.replyTo!.text ?? 'Media',
                            style: const TextStyle(
                              color: Colors.white60,
                              fontSize: 13,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                  
                  // Message content
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                    decoration: BoxDecoration(
                      gradient: isMe
                          ? const LinearGradient(
                              colors: [Color(0xFF00CED1), Color(0xFF40E0D0)],
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            )
                          : null,
                      color: isMe ? null : Colors.white.withOpacity(0.1),
                      borderRadius: BorderRadius.only(
                        topLeft: const Radius.circular(20),
                        topRight: const Radius.circular(20),
                        bottomLeft: isMe ? const Radius.circular(20) : const Radius.circular(4),
                        bottomRight: isMe ? const Radius.circular(4) : const Radius.circular(20),
                      ),
                      boxShadow: [
                        if (isMe)
                          BoxShadow(
                            color: const Color(0xFF00CED1).withOpacity(0.3),
                            blurRadius: 10,
                            offset: const Offset(0, 2),
                          ),
                      ],
                    ),
                    child: _buildMessageContent(),
                  ),
                  
                  // Time and status
                  Padding(
                    padding: const EdgeInsets.only(top: 4, left: 4, right: 4),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          _formatTime(message.createdAt),
                          style: TextStyle(
                            color: Colors.white.withOpacity(0.5),
                            fontSize: 11,
                          ),
                        ),
                        if (isMe) ...[
                          const SizedBox(width: 4),
                          Icon(
                            message.isRead ? Icons.done_all : Icons.done,
                            size: 14,
                            color: message.isRead 
                                ? const Color(0xFF00CED1) 
                                : Colors.white.withOpacity(0.5),
                          ),
                        ],
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          
          // Reactions
          if (message.reactions != null && message.reactions!.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(left: 4),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: message.reactions!.entries.map((entry) {
                    return Text(
                      entry.value,
                      style: const TextStyle(fontSize: 16),
                    );
                  }).toList(),
                ),
              ),
            ),
        ],
      ),
    );
  }
  
  Widget _buildMessageContent() {
    if (message.isDeleted) {
      return Text(
        'This message was deleted',
        style: TextStyle(
          color: Colors.white.withOpacity(0.6),
          fontStyle: FontStyle.italic,
        ),
      );
    }
    
    switch (message.type) {
      case MessageType.text:
        return Text(
          message.text ?? '',
          style: TextStyle(
            color: isMe ? Colors.white : Colors.white,
            fontSize: 15,
          ),
        );
        
      case MessageType.image:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: Image.network(
                message.imageUrl!,
                width: 200,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) {
                  return Container(
                    width: 200,
                    height: 150,
                    color: Colors.white.withOpacity(0.1),
                    child: const Center(
                      child: Icon(
                        Icons.broken_image,
                        color: Colors.white54,
                      ),
                    ),
                  );
                },
              ),
            ),
            if (message.text != null && message.text!.isNotEmpty) ...[
              const SizedBox(height: 8),
              Text(
                message.text!,
                style: TextStyle(
                  color: isMe ? Colors.white : Colors.white,
                  fontSize: 15,
                ),
              ),
            ],
          ],
        );
        
      case MessageType.video:
      case MessageType.videoShare:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 200,
              height: 150,
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Stack(
                alignment: Alignment.center,
                children: [
                  const Icon(
                    Icons.play_circle_filled,
                    color: Colors.white,
                    size: 48,
                  ),
                  if (message.type == MessageType.videoShare)
                    Positioned(
                      top: 8,
                      right: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.black54,
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: const Text(
                          'VIB3',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
            if (message.text != null && message.text!.isNotEmpty) ...[
              const SizedBox(height: 8),
              Text(
                message.text!,
                style: TextStyle(
                  color: isMe ? Colors.white : Colors.white,
                  fontSize: 15,
                ),
              ),
            ],
          ],
        );
        
      case MessageType.audio:
        return Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.play_circle_outline,
              color: Colors.white,
              size: 32,
            ),
            const SizedBox(width: 8),
            Container(
              width: 100,
              height: 32,
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.2),
                borderRadius: BorderRadius.circular(16),
              ),
              child: const Center(
                child: Icon(
                  Icons.graphic_eq,
                  color: Colors.white,
                  size: 20,
                ),
              ),
            ),
            const SizedBox(width: 8),
            Text(
              _formatDuration(message.audioDuration ?? 0),
              style: const TextStyle(
                color: Colors.white70,
                fontSize: 13,
              ),
            ),
          ],
        );
        
      case MessageType.profileShare:
        return Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.05),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: const LinearGradient(
                    colors: [Color(0xFF00CED1), Color(0xFFFF1493)],
                  ),
                ),
                child: const Center(
                  child: Icon(
                    Icons.person,
                    color: Colors.white,
                    size: 24,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Profile Share',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Text(
                    message.text ?? '@user',
                    style: const TextStyle(
                      color: Colors.white70,
                      fontSize: 13,
                    ),
                  ),
                ],
              ),
            ],
          ),
        );
    }
  }
  
  String _formatTime(DateTime time) {
    final now = DateTime.now();
    final difference = now.difference(time);
    
    if (difference.inDays > 0) {
      return DateFormat('MMM d').format(time);
    } else {
      return DateFormat('h:mm a').format(time);
    }
  }
  
  String _formatDuration(int seconds) {
    final minutes = seconds ~/ 60;
    final remainingSeconds = seconds % 60;
    return '${minutes}:${remainingSeconds.toString().padLeft(2, '0')}';
  }
}