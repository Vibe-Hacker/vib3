import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/video.dart';
import '../../providers/auth_provider.dart';
import '../../screens/profile_screen.dart';
import '../../screens/video_creator/modules/duet_module.dart';
import '../../screens/video_creator/modules/stitch_module.dart';
import '../../widgets/comments_sheet.dart';
import '../../widgets/share_sheet.dart';
import '../../widgets/double_tap_like_animation.dart';
import '../../providers/video_provider.dart';
import '../video_social/video_action_buttons.dart';
import '../video_social/video_info_overlay.dart';
import 'video_player_controller_widget.dart';

/// Simplified video feed item that uses separated components
/// This replaces the complex logic in video_feed.dart
class VideoFeedItem extends StatefulWidget {
  final Video video;
  final bool isPlaying;
  final bool isDragMode;
  final Map<String, Offset> buttonPositions;
  final Function(String)? onDragStart;
  final Function(String, Offset)? onDragUpdate;
  final Function(String)? onDragEnd;

  const VideoFeedItem({
    super.key,
    required this.video,
    required this.isPlaying,
    this.isDragMode = false,
    this.buttonPositions = const {},
    this.onDragStart,
    this.onDragUpdate,
    this.onDragEnd,
  });

  @override
  State<VideoFeedItem> createState() => _VideoFeedItemState();
}

class _VideoFeedItemState extends State<VideoFeedItem> {
  bool _showPlayPauseIcon = false;
  bool _isPaused = false;

  void _handleVideoTap() {
    setState(() {
      _isPaused = !_isPaused;
      _showPlayPauseIcon = true;
    });

    // Hide icon after delay
    if (!_isPaused) {
      Future.delayed(const Duration(milliseconds: 800), () {
        if (mounted) {
          setState(() {
            _showPlayPauseIcon = false;
          });
        }
      });
    }
  }

  void _showComments() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => CommentsSheet(video: widget.video),
    );
  }

  void _showShareOptions() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => ShareSheet(video: widget.video),
    );
  }

  void _navigateToProfile() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ProfileScreen(userId: widget.video.userId),
      ),
    );
  }

  void _startDuet() {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    if (authProvider.isAuthenticated) {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => DuetModule(originalVideo: widget.video),
        ),
      );
    }
  }

  void _startStitch() {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    if (authProvider.isAuthenticated) {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => StitchModule(originalVideo: widget.video),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        // Video player
        ClipRRect(
          borderRadius: const BorderRadius.vertical(
            top: Radius.circular(30),
            bottom: Radius.circular(30),
          ),
          child: VideoPlayerControllerWidget(
            videoUrl: widget.video.videoUrl,
            isPlaying: widget.isPlaying && !_isPaused,
            isFrontCamera: widget.video.isFrontCamera,
            onTap: _handleVideoTap,
            onError: () {
              // Handle error if needed
            },
          ),
        ),

        // Double tap like animation
        DoubleTapLikeAnimation(
          onDoubleTap: () {
            // Handle double tap like
            final authProvider = Provider.of<AuthProvider>(context, listen: false);
            if (authProvider.authToken != null) {
              Provider.of<VideoProvider>(context, listen: false)
                  .toggleLike(widget.video.id, authProvider.authToken!);
            }
          },
        ),

        // Play/pause icon overlay
        if (_showPlayPauseIcon)
          Center(
            child: AnimatedOpacity(
              opacity: _showPlayPauseIcon ? 1.0 : 0.0,
              duration: const Duration(milliseconds: 200),
              child: Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  color: Colors.black.withOpacity(0.6),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  _isPaused ? Icons.play_arrow : Icons.pause,
                  color: Colors.white,
                  size: 40,
                ),
              ),
            ),
          ),

        // Video info overlay
        VideoInfoOverlay(
          video: widget.video,
          onMusicTap: () {
            // Handle music tap
          },
        ),

        // Action buttons
        VideoActionButtons(
          video: widget.video,
          onCommentTap: _showComments,
          onShareTap: _showShareOptions,
          onProfileTap: _navigateToProfile,
          onDuetTap: widget.video.allowDuet ? _startDuet : null,
          onStitchTap: widget.video.allowStitch ? _startStitch : null,
          isDragMode: widget.isDragMode,
          buttonPositions: widget.buttonPositions,
          onDragStart: widget.onDragStart,
          onDragUpdate: widget.onDragUpdate,
          onDragEnd: widget.onDragEnd,
        ),
      ],
    );
  }
}