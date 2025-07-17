import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';
import 'package:provider/provider.dart';
import '../models/video.dart';
import '../services/video_service.dart';
import '../services/runtime_thumbnail_service.dart';
import '../services/thumbnail_generation_service.dart';
import '../providers/auth_provider.dart';
import 'dart:async';

class VideoThumbnail extends StatefulWidget {
  final Video video;
  final bool showDeleteButton;
  final VoidCallback? onDelete;
  final VoidCallback? onTap;

  const VideoThumbnail({
    super.key,
    required this.video,
    this.showDeleteButton = false,
    this.onDelete,
    this.onTap,
  });

  @override
  State<VideoThumbnail> createState() => _VideoThumbnailState();
}

class _VideoThumbnailState extends State<VideoThumbnail> {
  VideoPlayerController? _thumbnailController;
  bool _isInitialized = false;
  bool _isThumbnailLoading = false;
  Timer? _initTimer;
  String? _runtimeThumbnailUrl;
  bool _isCheckingThumbnail = false;

  @override
  void initState() {
    super.initState();
    // DISABLED: VideoPlayerController for thumbnails causes decoder overload
    // Instead, we'll use static images or fallback thumbnails
    // Check for runtime thumbnail generation
    _checkForRuntimeThumbnail();
  }
  
  Future<void> _checkForRuntimeThumbnail() async {
    if (widget.video.thumbnailUrl == null && widget.video.videoUrl != null) {
      setState(() {
        _isCheckingThumbnail = true;
      });
      
      try {
        // First try runtime thumbnail service
        final thumbnailUrl = await RuntimeThumbnailService.getOrGenerateThumbnail(
          widget.video.videoUrl!
        );
        
        if (mounted && thumbnailUrl != null) {
          setState(() {
            _runtimeThumbnailUrl = thumbnailUrl;
            _isCheckingThumbnail = false;
          });
        } else {
          // If that fails, try requesting from backend
          final authProvider = Provider.of<AuthProvider>(context, listen: false);
          final generatedUrl = await ThumbnailGenerationService.requestThumbnail(
            widget.video.id,
            widget.video.videoUrl!,
            authProvider.authToken,
          );
          
          if (mounted) {
            setState(() {
              _runtimeThumbnailUrl = generatedUrl;
              _isCheckingThumbnail = false;
            });
          }
        }
      } catch (e) {
        if (mounted) {
          setState(() {
            _isCheckingThumbnail = false;
          });
        }
      }
    }
  }

  @override
  void dispose() {
    _initTimer?.cancel();
    _thumbnailController?.dispose();
    super.dispose();
  }
  
  Future<void> _loadVideoThumbnail() async {
    if (_isThumbnailLoading) return;
    
    setState(() {
      _isThumbnailLoading = true;
    });
    
    try {
      _thumbnailController = VideoPlayerController.networkUrl(
        Uri.parse(widget.video.videoUrl!),
        videoPlayerOptions: VideoPlayerOptions(
          mixWithOthers: true,
          allowBackgroundPlayback: false,
        ),
      );
      
      // Set a longer timeout for initialization (some videos take longer)
      _initTimer = Timer(const Duration(seconds: 8), () {
        if (!_isInitialized && mounted) {
          // Timeout - dispose controller and show fallback
          _thumbnailController?.dispose();
          _thumbnailController = null;
          setState(() {
            _isThumbnailLoading = false;
          });
        }
      });
      
      await _thumbnailController!.initialize();
      
      if (mounted && _thumbnailController!.value.isInitialized) {
        setState(() {
          _isInitialized = true;
          _isThumbnailLoading = false;
        });
        _initTimer?.cancel();
        
        // Try to seek to first frame, then try 1 second if that fails
        try {
          await _thumbnailController!.seekTo(Duration.zero);
        } catch (e) {
          // If seeking to start fails, try seeking to 1 second
          try {
            await _thumbnailController!.seekTo(Duration(seconds: 1));
          } catch (e2) {
            // If both fail, just continue without seeking
          }
        }
      }
    } catch (e) {
      // Silently fail and show fallback
      if (mounted) {
        setState(() {
          _isThumbnailLoading = false;
        });
      }
    }
  }

  Widget _buildThumbnail() {
    // DISABLED: VideoPlayer for thumbnails to prevent decoder overload
    // Skip directly to static thumbnail options
    
    print('🖼️ Building thumbnail for video ${widget.video.id}');
    print('  thumbnailUrl: ${widget.video.thumbnailUrl}');
    print('  videoUrl: ${widget.video.videoUrl}');
    print('  runtimeThumbnailUrl: $_runtimeThumbnailUrl');
    
    // Priority 1: Use provided thumbnail URL
    if (widget.video.thumbnailUrl != null && widget.video.thumbnailUrl!.isNotEmpty) {
      return Image.network(
        widget.video.thumbnailUrl!,
        fit: BoxFit.cover,
        loadingBuilder: (context, child, loadingProgress) {
          if (loadingProgress == null) return child;
          return Container(
            color: Colors.grey[800],
            child: const Center(
              child: CircularProgressIndicator(
                color: Color(0xFFFF0080),
              ),
            ),
          );
        },
        errorBuilder: (context, error, stackTrace) {
          print('Thumbnail failed to load: ${widget.video.thumbnailUrl}');
          return _buildFallbackThumbnail();
        },
      );
    }
    
    // Priority 2: Use runtime-generated thumbnail URL
    if (_runtimeThumbnailUrl != null) {
      return Image.network(
        _runtimeThumbnailUrl!,
        fit: BoxFit.cover,
        loadingBuilder: (context, child, loadingProgress) {
          if (loadingProgress == null) return child;
          return _buildFallbackThumbnail();
        },
        errorBuilder: (context, error, stackTrace) {
          return _buildFallbackThumbnail();
        },
      );
    }
    
    // Skip loading state since we're not loading video controllers anymore
    
    // Priority 4: For DigitalOcean Spaces videos, try common thumbnail patterns
    if (widget.video.videoUrl != null && widget.video.videoUrl!.isNotEmpty) {
      final videoUrl = widget.video.videoUrl!;
      
      // Try multiple thumbnail URL patterns
      List<String> thumbnailPatterns = [];
      
      if (videoUrl.contains('vib3-videos.nyc3.digitaloceanspaces.com')) {
        // For DigitalOcean Spaces, thumbnails might be in a different folder
        if (videoUrl.contains('.mp4')) {
          // Try replacing videos with thumbnails folder
          thumbnailPatterns.add(videoUrl.replaceAll('/videos/', '/thumbnails/').replaceAll('.mp4', '.jpg'));
          thumbnailPatterns.add(videoUrl.replaceAll('/videos/', '/thumbnails/').replaceAll('.mp4', '_thumb.jpg'));
          // Try same folder with _thumb suffix
          thumbnailPatterns.add(videoUrl.replaceAll('.mp4', '_thumb.jpg'));
          thumbnailPatterns.add(videoUrl.replaceAll('.mp4', '-thumb.jpg'));
          // Try just replacing extension
          thumbnailPatterns.add(videoUrl.replaceAll('.mp4', '.jpg'));
        }
      }
      
      // If we have patterns to try, use the first one with fallback
      if (thumbnailPatterns.isNotEmpty) {
        return Image.network(
          thumbnailPatterns.first,
          fit: BoxFit.cover,
          errorBuilder: (context, error, stackTrace) {
            // If first pattern fails, just show fallback
            // In production, you could try other patterns
            return _buildFallbackThumbnail();
          },
        );
      }
    }
    
    print('🎨 Showing fallback thumbnail');
    return _buildFallbackThumbnail();
  }

  Widget _buildFallbackThumbnail() {
    // Create a unique gradient based on video ID for variety
    final int hashCode = widget.video.id.hashCode;
    final List<List<Color>> gradients = [
      [const Color(0xFFFF0080), const Color(0xFF7928CA)], // Pink to Purple
      [const Color(0xFF00F0FF), const Color(0xFF0080FF)], // Cyan to Blue
      [const Color(0xFFFF0080), const Color(0xFFFF4040)], // Pink to Red
      [const Color(0xFF00CED1), const Color(0xFF00F0FF)], // Dark Turquoise to Cyan
      [const Color(0xFF7928CA), const Color(0xFF4B0082)], // Purple to Indigo
      [const Color(0xFFFF1493), const Color(0xFFFF69B4)], // Deep Pink to Hot Pink
    ];
    
    final gradientIndex = hashCode.abs() % gradients.length;
    final selectedGradient = gradients[gradientIndex];
    
    print('🌈 Gradient index: $gradientIndex, colors: $selectedGradient');
    
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: selectedGradient,
        ),
      ),
      child: Stack(
        children: [
          // Semi-transparent overlay for better icon visibility
          Container(
            color: Colors.black.withOpacity(0.2),
          ),
          // Play icon
          Center(
            child: Container(
              padding: EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.4),
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.play_arrow_rounded,
                color: Colors.white,
                size: 32,
              ),
            ),
          ),
          // VIB3 watermark
          Positioned(
            bottom: 8,
            right: 8,
            child: Container(
              padding: EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.5),
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                'VIB3',
                style: TextStyle(
                  color: Colors.white.withOpacity(0.9),
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: widget.onTap,
      child: Container(
        constraints: const BoxConstraints(
          minHeight: 120, // Ensure minimum height
        ),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(4),
          color: Colors.grey[900],
        ),
        child: Stack(
          fit: StackFit.expand,
          children: [
            // Video thumbnail image
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: _buildThumbnail(),
            ),
            
            // Dark overlay for text readability
            Container(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(4),
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.black.withOpacity(0.3),
                    Colors.transparent,
                    Colors.transparent,
                    Colors.black.withOpacity(0.4),
                  ],
                  stops: const [0.0, 0.3, 0.7, 1.0],
                ),
              ),
            ),
            
            // Delete button (top left)
            if (widget.showDeleteButton)
              Positioned(
                top: 4,
                left: 4,
                child: GestureDetector(
                  onTap: () {
                    if (widget.onDelete != null) {
                      widget.onDelete!();
                    }
                  },
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      color: Colors.black.withOpacity(0.7),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(
                      Icons.delete_outline,
                      color: Colors.white,
                      size: 16,
                    ),
                  ),
                ),
              ),
            
            // Likes count (top right)
            Positioned(
              top: 4,
              right: 4,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: Colors.black.withOpacity(0.7),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(
                      Icons.favorite,
                      color: Colors.red,
                      size: 12,
                    ),
                    const SizedBox(width: 2),
                    Text(
                      VideoService.formatLikes(widget.video.likesCount),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            
            // Views count (bottom left)
            Positioned(
              bottom: 4,
              left: 4,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: Colors.black.withOpacity(0.7),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(
                      Icons.visibility,
                      color: Colors.white,
                      size: 12,
                    ),
                    const SizedBox(width: 2),
                    Text(
                      VideoService.formatViews(widget.video.viewsCount),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            
            // Duration (bottom right)
            Positioned(
              bottom: 4,
              right: 4,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: Colors.black.withOpacity(0.7),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  VideoService.formatDuration(widget.video.duration),
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showDeleteDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1A1A1A),
        title: const Text(
          'Delete video',
          style: TextStyle(color: Colors.white),
        ),
        content: const Text(
          'Are you sure you want to delete this video? This action cannot be undone.',
          style: TextStyle(color: Colors.white70),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text(
              'Cancel',
              style: TextStyle(color: Colors.grey),
            ),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              if (widget.onDelete != null) {
                widget.onDelete!();
              }
            },
            child: const Text(
              'Delete',
              style: TextStyle(color: Colors.red),
            ),
          ),
        ],
      ),
    );
  }
}