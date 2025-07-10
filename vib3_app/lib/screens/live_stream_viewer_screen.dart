import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'dart:async';
import '../providers/auth_provider.dart';
import '../models/live_stream.dart';
import '../services/live_stream_service.dart';
import '../widgets/live_chat_widget.dart';
import '../widgets/gift_sheet.dart';

class LiveStreamViewerScreen extends StatefulWidget {
  final LiveStream stream;
  
  const LiveStreamViewerScreen({super.key, required this.stream});
  
  @override
  State<LiveStreamViewerScreen> createState() => _LiveStreamViewerScreenState();
}

class _LiveStreamViewerScreenState extends State<LiveStreamViewerScreen> 
    with WidgetsBindingObserver {
  final TextEditingController _chatController = TextEditingController();
  bool _showChat = true;
  bool _isFollowing = false;
  int _viewerCount = 0;
  int _likeCount = 0;
  Timer? _statsTimer;
  Timer? _heartAnimationTimer;
  List<Offset> _hearts = [];
  
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersive);
    
    _viewerCount = widget.stream.viewerCount;
    _likeCount = widget.stream.likeCount;
    
    _joinStream();
    _startStatsPolling();
  }
  
  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
    _statsTimer?.cancel();
    _heartAnimationTimer?.cancel();
    _chatController.dispose();
    _leaveStream();
    super.dispose();
  }
  
  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.paused) {
      _leaveStream();
    } else if (state == AppLifecycleState.resumed) {
      _joinStream();
    }
  }
  
  Future<void> _joinStream() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final token = authProvider.authToken;
    
    if (token == null) return;
    
    await LiveStreamService.joinStream(
      streamId: widget.stream.id,
      token: token,
    );
  }
  
  Future<void> _leaveStream() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final token = authProvider.authToken;
    
    if (token == null) return;
    
    await LiveStreamService.leaveStream(
      streamId: widget.stream.id,
      token: token,
    );
  }
  
  void _startStatsPolling() {
    _statsTimer = Timer.periodic(const Duration(seconds: 5), (_) async {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final token = authProvider.authToken;
      
      if (token == null) return;
      
      final stats = await LiveStreamService.getStreamStats(
        streamId: widget.stream.id,
        token: token,
      );
      
      if (stats != null && mounted) {
        setState(() {
          _viewerCount = stats['viewerCount'] ?? _viewerCount;
          _likeCount = stats['likeCount'] ?? _likeCount;
        });
      }
    });
  }
  
  void _sendLike() {
    HapticFeedback.lightImpact();
    
    setState(() {
      _likeCount++;
      // Add heart animation
      final random = DateTime.now().millisecondsSinceEpoch % 3;
      _hearts.add(Offset(
        MediaQuery.of(context).size.width * (0.7 + random * 0.1),
        MediaQuery.of(context).size.height - 100,
      ));
    });
    
    // Remove heart after animation
    Future.delayed(const Duration(seconds: 3), () {
      if (mounted && _hearts.isNotEmpty) {
        setState(() {
          _hearts.removeAt(0);
        });
      }
    });
    
    // TODO: Send like to server
  }
  
  void _sendComment() {
    final comment = _chatController.text.trim();
    if (comment.isEmpty) return;
    
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final token = authProvider.authToken;
    
    if (token == null) return;
    
    LiveStreamService.sendComment(
      streamId: widget.stream.id,
      comment: comment,
      token: token,
    );
    
    _chatController.clear();
    HapticFeedback.lightImpact();
  }
  
  void _showGifts() {
    HapticFeedback.mediumImpact();
    
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => GiftSheet(
        streamId: widget.stream.id,
        onGiftSent: (giftType, quantity) {
          // Show gift animation
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Sent $quantity x $giftType!'),
              backgroundColor: const Color(0xFFFF0080),
            ),
          );
        },
      ),
    );
  }
  
  void _toggleFollow() {
    HapticFeedback.lightImpact();
    setState(() {
      _isFollowing = !_isFollowing;
    });
    
    // TODO: Follow/unfollow host
  }
  
  void _shareStream() {
    HapticFeedback.lightImpact();
    // TODO: Share stream
  }
  
  void _reportStream() {
    HapticFeedback.mediumImpact();
    // TODO: Report stream
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        fit: StackFit.expand,
        children: [
          // Video player placeholder
          Container(
            color: Colors.black,
            child: const Center(
              child: Icon(
                Icons.live_tv,
                color: Colors.white24,
                size: 80,
              ),
            ),
          ),
          
          // Heart animations
          ..._hearts.map((position) => _HeartAnimation(
            position: position,
          )),
          
          // UI overlay
          SafeArea(
            child: Column(
              children: [
                // Top bar
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 8,
                  ),
                  child: Row(
                    children: [
                      // Host info
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.black.withOpacity(0.5),
                          borderRadius: BorderRadius.circular(24),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            // Profile picture
                            Container(
                              width: 32,
                              height: 32,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color: const Color(0xFFFF0080),
                                  width: 2,
                                ),
                              ),
                              child: ClipOval(
                                child: widget.stream.hostProfilePicture != null
                                    ? Image.network(
                                        widget.stream.hostProfilePicture!,
                                        fit: BoxFit.cover,
                                      )
                                    : Container(
                                        color: const Color(0xFFFF0080),
                                        child: Center(
                                          child: Text(
                                            widget.stream.hostUsername[0]
                                                .toUpperCase(),
                                            style: const TextStyle(
                                              color: Colors.white,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                        ),
                                      ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            
                            // Username
                            Text(
                              widget.stream.hostUsername,
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(width: 12),
                            
                            // Follow button
                            GestureDetector(
                              onTap: _toggleFollow,
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 12,
                                  vertical: 4,
                                ),
                                decoration: BoxDecoration(
                                  color: _isFollowing
                                      ? Colors.transparent
                                      : const Color(0xFFFF0080),
                                  borderRadius: BorderRadius.circular(12),
                                  border: _isFollowing
                                      ? Border.all(
                                          color: const Color(0xFFFF0080),
                                        )
                                      : null,
                                ),
                                child: Text(
                                  _isFollowing ? 'Following' : 'Follow',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      
                      const Spacer(),
                      
                      // Viewers count
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.black.withOpacity(0.5),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(
                              Icons.visibility,
                              color: Colors.white70,
                              size: 16,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              _formatCount(_viewerCount),
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 14,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      
                      // Close button
                      IconButton(
                        onPressed: () => Navigator.pop(context),
                        icon: const Icon(
                          Icons.close,
                          color: Colors.white,
                        ),
                      ),
                    ],
                  ),
                ),
                
                // Title and LIVE badge
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  alignment: Alignment.centerLeft,
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFF0080),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Container(
                              width: 6,
                              height: 6,
                              decoration: const BoxDecoration(
                                color: Colors.white,
                                shape: BoxShape.circle,
                              ),
                            ),
                            const SizedBox(width: 4),
                            const Text(
                              'LIVE',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          widget.stream.title,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 14,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ),
                
                const Spacer(),
                
                // Chat and controls
                Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    // Chat
                    if (_showChat)
                      Expanded(
                        child: Container(
                          height: 300,
                          margin: const EdgeInsets.only(
                            left: 16,
                            bottom: 16,
                          ),
                          child: LiveChatWidget(
                            streamId: widget.stream.id,
                          ),
                        ),
                      ),
                    
                    // Right controls
                    Container(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        children: [
                          // Like button
                          _buildActionButton(
                            onTap: _sendLike,
                            child: Column(
                              children: [
                                const Icon(
                                  Icons.favorite,
                                  color: Colors.white,
                                  size: 28,
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  _formatCount(_likeCount),
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 12,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 16),
                          
                          // Gift button
                          _buildActionButton(
                            onTap: _showGifts,
                            child: const Icon(
                              Icons.card_giftcard,
                              color: Colors.white,
                              size: 28,
                            ),
                          ),
                          const SizedBox(height: 16),
                          
                          // Share button
                          _buildActionButton(
                            onTap: _shareStream,
                            child: const Icon(
                              Icons.share,
                              color: Colors.white,
                              size: 28,
                            ),
                          ),
                          const SizedBox(height: 16),
                          
                          // Chat toggle
                          _buildActionButton(
                            onTap: () {
                              setState(() {
                                _showChat = !_showChat;
                              });
                            },
                            child: Icon(
                              _showChat ? Icons.chat : Icons.chat_outlined,
                              color: Colors.white,
                              size: 28,
                            ),
                          ),
                          const SizedBox(height: 16),
                          
                          // More options
                          _buildActionButton(
                            onTap: _showMoreOptions,
                            child: const Icon(
                              Icons.more_vert,
                              color: Colors.white,
                              size: 28,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                
                // Comment input
                if (_showChat && widget.stream.commentsEnabled)
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.black.withOpacity(0.8),
                      border: Border(
                        top: BorderSide(
                          color: Colors.white.withOpacity(0.1),
                        ),
                      ),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _chatController,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 14,
                            ),
                            decoration: InputDecoration(
                              hintText: 'Say something...',
                              hintStyle: const TextStyle(
                                color: Colors.white54,
                              ),
                              filled: true,
                              fillColor: Colors.white.withOpacity(0.1),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(24),
                                borderSide: BorderSide.none,
                              ),
                              contentPadding: const EdgeInsets.symmetric(
                                horizontal: 16,
                                vertical: 8,
                              ),
                            ),
                            onSubmitted: (_) => _sendComment(),
                          ),
                        ),
                        const SizedBox(width: 8),
                        IconButton(
                          onPressed: _sendComment,
                          icon: Container(
                            padding: const EdgeInsets.all(8),
                            decoration: const BoxDecoration(
                              gradient: LinearGradient(
                                colors: [
                                  Color(0xFFFF0080),
                                  Color(0xFFFF80FF),
                                ],
                              ),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                              Icons.send,
                              color: Colors.white,
                              size: 20,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildActionButton({
    required VoidCallback onTap,
    required Widget child,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 48,
        height: 48,
        decoration: BoxDecoration(
          color: Colors.black.withOpacity(0.5),
          shape: BoxShape.circle,
        ),
        child: Center(child: child),
      ),
    );
  }
  
  void _showMoreOptions() {
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
              leading: const Icon(Icons.flag_outlined, color: Colors.white),
              title: const Text(
                'Report',
                style: TextStyle(color: Colors.white),
              ),
              onTap: () {
                Navigator.pop(context);
                _reportStream();
              },
            ),
          ],
        ),
      ),
    );
  }
  
  String _formatCount(int count) {
    if (count >= 1000000) {
      return '${(count / 1000000).toStringAsFixed(1)}M';
    } else if (count >= 1000) {
      return '${(count / 1000).toStringAsFixed(1)}K';
    }
    return count.toString();
  }
}

class _HeartAnimation extends StatefulWidget {
  final Offset position;
  
  const _HeartAnimation({required this.position});
  
  @override
  State<_HeartAnimation> createState() => _HeartAnimationState();
}

class _HeartAnimationState extends State<_HeartAnimation>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _positionAnimation;
  
  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(seconds: 3),
      vsync: this,
    );
    
    _fadeAnimation = Tween<double>(
      begin: 1.0,
      end: 0.0,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: Curves.easeOut,
    ));
    
    _positionAnimation = Tween<Offset>(
      begin: widget.position,
      end: Offset(
        widget.position.dx + (DateTime.now().millisecondsSinceEpoch % 2 == 0 ? 30 : -30),
        widget.position.dy - 300,
      ),
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: Curves.easeOut,
    ));
    
    _controller.forward();
  }
  
  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }
  
  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return Positioned(
          left: _positionAnimation.value.dx,
          top: _positionAnimation.value.dy,
          child: Opacity(
            opacity: _fadeAnimation.value,
            child: const Icon(
              Icons.favorite,
              color: Color(0xFFFF0080),
              size: 30,
            ),
          ),
        );
      },
    );
  }
}