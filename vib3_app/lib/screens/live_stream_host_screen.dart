import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:camera/camera.dart';
import 'package:provider/provider.dart';
import 'dart:async';
import '../providers/auth_provider.dart';
import '../models/live_stream.dart';
import '../services/live_stream_service.dart';
import '../widgets/live_chat_widget.dart';

class LiveStreamHostScreen extends StatefulWidget {
  final LiveStream stream;
  final CameraController cameraController;
  
  const LiveStreamHostScreen({
    super.key,
    required this.stream,
    required this.cameraController,
  });
  
  @override
  State<LiveStreamHostScreen> createState() => _LiveStreamHostScreenState();
}

class _LiveStreamHostScreenState extends State<LiveStreamHostScreen>
    with WidgetsBindingObserver {
  int _viewerCount = 0;
  int _likeCount = 0;
  int _giftCount = 0;
  Duration _streamDuration = Duration.zero;
  Timer? _durationTimer;
  Timer? _statsTimer;
  bool _showChat = true;
  bool _isEnding = false;
  
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersive);
    
    _viewerCount = widget.stream.viewerCount;
    _likeCount = widget.stream.likeCount;
    _giftCount = widget.stream.totalGifts;
    
    _startTimers();
  }
  
  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
    _durationTimer?.cancel();
    _statsTimer?.cancel();
    super.dispose();
  }
  
  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.paused) {
      _endStream();
    }
  }
  
  void _startTimers() {
    // Duration timer
    _durationTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) {
        setState(() {
          _streamDuration = DateTime.now().difference(widget.stream.startedAt);
        });
      }
    });
    
    // Stats polling timer
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
          _giftCount = stats['totalGifts'] ?? _giftCount;
        });
      }
    });
  }
  
  Future<void> _endStream() async {
    if (_isEnding) return;
    
    setState(() {
      _isEnding = true;
    });
    
    HapticFeedback.mediumImpact();
    
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final token = authProvider.authToken;
    
    if (token != null) {
      await LiveStreamService.endStream(
        streamId: widget.stream.id,
        token: token,
      );
    }
    
    if (mounted) {
      // Show stream summary
      _showStreamSummary();
    }
  }
  
  void _showStreamSummary() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1A1A1A),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
        title: const Text(
          'Stream Ended',
          style: TextStyle(
            color: Colors.white,
            fontSize: 24,
            fontWeight: FontWeight.bold,
          ),
          textAlign: TextAlign.center,
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Duration
            _buildStatRow(
              icon: Icons.timer,
              label: 'Duration',
              value: _formatDuration(_streamDuration),
            ),
            const SizedBox(height: 16),
            
            // Viewers
            _buildStatRow(
              icon: Icons.people,
              label: 'Total viewers',
              value: _formatCount(_viewerCount),
            ),
            const SizedBox(height: 16),
            
            // Likes
            _buildStatRow(
              icon: Icons.favorite,
              label: 'Likes',
              value: _formatCount(_likeCount),
            ),
            const SizedBox(height: 16),
            
            // Gifts
            _buildStatRow(
              icon: Icons.card_giftcard,
              label: 'Gifts received',
              value: _formatCount(_giftCount),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.of(context).popUntil((route) => route.isFirst);
            },
            child: const Text(
              'Done',
              style: TextStyle(
                color: Color(0xFFFF0080),
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildStatRow({
    required IconData icon,
    required String label,
    required String value,
  }) {
    return Row(
      children: [
        Icon(icon, color: const Color(0xFFFF0080), size: 24),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            label,
            style: const TextStyle(
              color: Colors.white70,
              fontSize: 16,
            ),
          ),
        ),
        Text(
          value,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }
  
  void _switchCamera() async {
    HapticFeedback.lightImpact();
    // Camera switching is handled in GoLiveScreen
    // This is just for the UI feedback
  }
  
  void _toggleFlash() async {
    HapticFeedback.lightImpact();
    try {
      final currentMode = widget.cameraController.value.flashMode;
      final newMode = currentMode == FlashMode.torch 
          ? FlashMode.off 
          : FlashMode.torch;
      await widget.cameraController.setFlashMode(newMode);
    } catch (e) {
      print('Error toggling flash: $e');
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return WillPopScope(
      onWillPop: () async {
        _endStream();
        return false;
      },
      child: Scaffold(
        backgroundColor: Colors.black,
        body: Stack(
          fit: StackFit.expand,
          children: [
            // Camera preview
            CameraPreview(widget.cameraController),
            
            // UI overlay
            SafeArea(
              child: Column(
                children: [
                  // Top bar
                  Container(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Live badge and viewers
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 12,
                                  vertical: 6,
                                ),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFFF0080),
                                  borderRadius: BorderRadius.circular(20),
                                  boxShadow: [
                                    BoxShadow(
                                      color: const Color(0xFFFF0080).withOpacity(0.5),
                                      blurRadius: 10,
                                      spreadRadius: 2,
                                    ),
                                  ],
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Container(
                                      width: 8,
                                      height: 8,
                                      decoration: const BoxDecoration(
                                        color: Colors.white,
                                        shape: BoxShape.circle,
                                      ),
                                    ),
                                    const SizedBox(width: 6),
                                    const Text(
                                      'LIVE',
                                      style: TextStyle(
                                        color: Colors.white,
                                        fontSize: 14,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    Text(
                                      _formatDuration(_streamDuration),
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 14,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(height: 8),
                              
                              // Viewer count
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 12,
                                  vertical: 6,
                                ),
                                decoration: BoxDecoration(
                                  color: Colors.black.withOpacity(0.5),
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    const Icon(
                                      Icons.visibility,
                                      color: Colors.white70,
                                      size: 18,
                                    ),
                                    const SizedBox(width: 6),
                                    Text(
                                      _formatCount(_viewerCount),
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 16,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                        
                        // Camera controls
                        Column(
                          children: [
                            _buildControlButton(
                              onTap: _switchCamera,
                              icon: Icons.flip_camera_ios,
                            ),
                            const SizedBox(height: 12),
                            _buildControlButton(
                              onTap: _toggleFlash,
                              icon: Icons.flash_on,
                            ),
                            const SizedBox(height: 12),
                            _buildControlButton(
                              onTap: () {
                                setState(() {
                                  _showChat = !_showChat;
                                });
                              },
                              icon: _showChat ? Icons.chat : Icons.chat_outlined,
                            ),
                          ],
                        ),
                        const SizedBox(width: 12),
                        
                        // End button
                        _buildControlButton(
                          onTap: _endStream,
                          icon: Icons.close,
                          color: Colors.red,
                        ),
                      ],
                    ),
                  ),
                  
                  const Spacer(),
                  
                  // Bottom section
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      // Chat
                      if (_showChat)
                        Expanded(
                          child: Container(
                            height: 250,
                            margin: const EdgeInsets.only(
                              left: 16,
                              bottom: 16,
                            ),
                            child: LiveChatWidget(
                              streamId: widget.stream.id,
                              isHost: true,
                            ),
                          ),
                        ),
                      
                      // Stats
                      Container(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          children: [
                            _buildStatItem(
                              icon: Icons.favorite,
                              count: _likeCount,
                            ),
                            const SizedBox(height: 16),
                            _buildStatItem(
                              icon: Icons.card_giftcard,
                              count: _giftCount,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            
            // Loading overlay
            if (_isEnding)
              Container(
                color: Colors.black54,
                child: const Center(
                  child: CircularProgressIndicator(
                    color: Color(0xFFFF0080),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildControlButton({
    required VoidCallback onTap,
    required IconData icon,
    Color color = Colors.white,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 44,
        height: 44,
        decoration: BoxDecoration(
          color: Colors.black.withOpacity(0.5),
          shape: BoxShape.circle,
        ),
        child: Center(
          child: Icon(
            icon,
            color: color,
            size: 24,
          ),
        ),
      ),
    );
  }
  
  Widget _buildStatItem({
    required IconData icon,
    required int count,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: 12,
        vertical: 8,
      ),
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.5),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            icon,
            color: Colors.white70,
            size: 20,
          ),
          const SizedBox(width: 6),
          Text(
            _formatCount(count),
            style: const TextStyle(
              color: Colors.white,
              fontSize: 14,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }
  
  String _formatDuration(Duration duration) {
    final hours = duration.inHours;
    final minutes = duration.inMinutes.remainder(60);
    final seconds = duration.inSeconds.remainder(60);
    
    if (hours > 0) {
      return '${hours.toString().padLeft(2, '0')}:${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
    }
    return '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
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