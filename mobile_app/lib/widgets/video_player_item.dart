import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';
import 'package:chewie/chewie.dart';
import '../models/video_model.dart';
import '../config/app_config.dart';

class VideoPlayerItem extends StatefulWidget {
  final Video video;
  final bool isPlaying;
  final VoidCallback onLike;
  final VoidCallback onShare;
  final VoidCallback onFollow;
  final VoidCallback onComment;

  const VideoPlayerItem({
    super.key,
    required this.video,
    required this.isPlaying,
    required this.onLike,
    required this.onShare,
    required this.onFollow,
    required this.onComment,
  });

  @override
  State<VideoPlayerItem> createState() => _VideoPlayerItemState();
}

class _VideoPlayerItemState extends State<VideoPlayerItem> {
  VideoPlayerController? _videoPlayerController;
  ChewieController? _chewieController;
  bool _isInitialized = false;

  @override
  void initState() {
    super.initState();
    _initializePlayer();
  }

  @override
  void didUpdateWidget(VideoPlayerItem oldWidget) {
    super.didUpdateWidget(oldWidget);
    
    if (widget.isPlaying != oldWidget.isPlaying) {
      if (widget.isPlaying) {
        _chewieController?.play();
      } else {
        _chewieController?.pause();
      }
    }
    
    if (widget.video.videoUrl != oldWidget.video.videoUrl) {
      _disposePlayer();
      _initializePlayer();
    }
  }

  @override
  void dispose() {
    _disposePlayer();
    super.dispose();
  }

  void _initializePlayer() {
    if (widget.video.videoUrl.isEmpty) return;
    
    _videoPlayerController = VideoPlayerController.networkUrl(
      Uri.parse(widget.video.videoUrl),
    );

    _videoPlayerController!.initialize().then((_) {
      if (mounted) {
        setState(() {
          _isInitialized = true;
        });

        _chewieController = ChewieController(
          videoPlayerController: _videoPlayerController!,
          autoPlay: widget.isPlaying,
          looping: true,
          showControls: false,
          aspectRatio: _videoPlayerController!.value.aspectRatio,
          autoInitialize: true,
          errorBuilder: (context, errorMessage) {
            return Container(
              color: Colors.black,
              child: const Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.error_outline,
                      color: Colors.white,
                      size: 48,
                    ),
                    SizedBox(height: 16),
                    Text(
                      'Unable to play video',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      }
    }).catchError((error) {
      debugPrint('Video player initialization error: $error');
    });
  }

  void _disposePlayer() {
    _chewieController?.dispose();
    _videoPlayerController?.dispose();
    _chewieController = null;
    _videoPlayerController = null;
    _isInitialized = false;
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.black,
      child: Stack(
        fit: StackFit.expand,
        children: [
          // Video player
          Center(
            child: _isInitialized && _chewieController != null
                ? Chewie(controller: _chewieController!)
                : Container(
                    color: Colors.black,
                    child: widget.video.thumbnailUrl != null
                        ? Image.network(
                            widget.video.thumbnailUrl!,
                            fit: BoxFit.cover,
                            errorBuilder: (context, error, stackTrace) {
                              return const Icon(
                                Icons.video_library,
                                color: Colors.white,
                                size: 64,
                              );
                            },
                            loadingBuilder: (context, child, loadingProgress) {
                              if (loadingProgress == null) return child;
                              return const Center(
                                child: CircularProgressIndicator(
                                  color: Colors.white,
                                ),
                              );
                            },
                          )
                        : const Icon(
                            Icons.video_library,
                            color: Colors.white,
                            size: 64,
                          ),
                  ),
          ),

          // Gradient overlay for better text visibility
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: Container(
              height: 200,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.transparent,
                    Colors.black.withOpacity(0.7),
                  ],
                ),
              ),
            ),
          ),

          // Right side actions
          Positioned(
            right: 12,
            bottom: 100,
            child: Column(
              children: [
                // User avatar
                GestureDetector(
                  onTap: () {
                    // Navigate to user profile
                  },
                  child: Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.white, width: 2),
                    ),
                    child: ClipOval(
                      child: widget.video.userProfileImage != null
                          ? Image.network(
                              widget.video.userProfileImage!,
                              fit: BoxFit.cover,
                              errorBuilder: (context, error, stackTrace) {
                                return const Icon(
                                  Icons.person,
                                  color: Colors.white,
                                );
                              },
                            )
                          : const Icon(
                              Icons.person,
                              color: Colors.white,
                            ),
                    ),
                  ),
                ),

                const SizedBox(height: 8),

                // Follow button
                if (!widget.video.isFollowing)
                  GestureDetector(
                    onTap: widget.onFollow,
                    child: Container(
                      width: 24,
                      height: 24,
                      decoration: const BoxDecoration(
                        color: Color(AppConfig.primaryColor),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.add,
                        color: Colors.white,
                        size: 16,
                      ),
                    ),
                  ),

                const SizedBox(height: 24),

                // Like button
                _buildActionButton(
                  icon: widget.video.isLiked ? Icons.favorite : Icons.favorite_border,
                  count: widget.video.likeCount,
                  onTap: widget.onLike,
                  color: widget.video.isLiked ? Colors.red : Colors.white,
                ),

                const SizedBox(height: 16),

                // Comment button
                _buildActionButton(
                  icon: Icons.comment,
                  count: widget.video.commentCount,
                  onTap: widget.onComment,
                ),

                const SizedBox(height: 16),

                // Share button
                _buildActionButton(
                  icon: Icons.share,
                  count: widget.video.shareCount,
                  onTap: widget.onShare,
                ),

                const SizedBox(height: 16),

                // Music note (rotating)
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: const LinearGradient(
                      colors: [
                        Color(AppConfig.primaryColor),
                        Color(AppConfig.secondaryColor),
                      ],
                    ),
                  ),
                  child: const Icon(
                    Icons.music_note,
                    color: Colors.white,
                    size: 24,
                  ),
                ),
              ],
            ),
          ),

          // Bottom content overlay
          Positioned(
            left: 12,
            right: 80,
            bottom: 20,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Username
                Row(
                  children: [
                    Text(
                      '@${widget.video.username}',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    if (widget.video.isFollowing) ...[
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          border: Border.all(color: Colors.white.withOpacity(0.5)),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: const Text(
                          'Following',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),

                const SizedBox(height: 8),

                // Description
                if (widget.video.description.isNotEmpty)
                  Text(
                    widget.video.description,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                    ),
                    maxLines: 3,
                    overflow: TextOverflow.ellipsis,
                  ),

                const SizedBox(height: 8),

                // Tags
                if (widget.video.tags.isNotEmpty)
                  Wrap(
                    spacing: 8,
                    children: widget.video.tags.take(3).map((tag) {
                      return Text(
                        '#$tag',
                        style: const TextStyle(
                          color: Color(AppConfig.primaryColor),
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                        ),
                      );
                    }).toList(),
                  ),

                const SizedBox(height: 12),

                // Music info
                if (widget.video.musicTitle != null)
                  Row(
                    children: [
                      const Icon(
                        Icons.music_note,
                        color: Colors.white,
                        size: 16,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          '${widget.video.musicTitle}${widget.video.musicArtist != null ? ' - ${widget.video.musicArtist}' : ''}',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionButton({
    required IconData icon,
    required int count,
    required VoidCallback onTap,
    Color color = Colors.white,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Icon(
            icon,
            color: color,
            size: 32,
          ),
          const SizedBox(height: 4),
          Text(
            _formatCount(count),
            style: const TextStyle(
              color: Colors.white,
              fontSize: 12,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
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