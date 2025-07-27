import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../core/services/video/thumbnail_service.dart';
import '../../../core/models/post.dart';

/// Enhanced video thumbnail widget with progressive loading and optimizations
class VideoThumbnailWidget extends StatefulWidget {
  final String? thumbnailUrl;
  final String? videoUrl;
  final VoidCallback? onTap;
  final double? width;
  final double? height;
  final BorderRadius? borderRadius;
  final bool showPlayButton;
  final bool showOverlay;
  final Widget? overlayWidget;
  
  const VideoThumbnailWidget({
    super.key,
    this.thumbnailUrl,
    this.videoUrl,
    this.onTap,
    this.width,
    this.height,
    this.borderRadius,
    this.showPlayButton = true,
    this.showOverlay = true,
    this.overlayWidget,
  });

  @override
  State<VideoThumbnailWidget> createState() => _VideoThumbnailWidgetState();
}

class _VideoThumbnailWidgetState extends State<VideoThumbnailWidget> {
  String? _thumbnailUrl;
  bool _isGenerating = false;
  
  @override
  void initState() {
    super.initState();
    _thumbnailUrl = widget.thumbnailUrl;
    
    // If no thumbnail URL provided, try to generate one
    if (_thumbnailUrl == null && widget.videoUrl != null) {
      _generateThumbnailUrl();
    }
  }
  
  @override
  void didUpdateWidget(VideoThumbnailWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.thumbnailUrl != widget.thumbnailUrl) {
      _thumbnailUrl = widget.thumbnailUrl;
    }
  }
  
  Future<void> _generateThumbnailUrl() async {
    if (_isGenerating) return;
    
    setState(() {
      _isGenerating = true;
    });
    
    try {
      final generatedUrl = await ThumbnailService.generateThumbnailUrl(widget.videoUrl!);
      if (mounted && generatedUrl != null) {
        setState(() {
          _thumbnailUrl = generatedUrl;
          _isGenerating = false;
        });
      }
    } catch (e) {
      debugPrint('Error generating thumbnail URL: $e');
      if (mounted) {
        setState(() {
          _isGenerating = false;
        });
      }
    }
  }
  
  @override
  Widget build(BuildContext context) {
    final borderRadius = widget.borderRadius ?? BorderRadius.circular(12);
    
    return GestureDetector(
      onTap: widget.onTap,
      child: Container(
        width: widget.width,
        height: widget.height,
        decoration: BoxDecoration(
          color: Colors.black,
          borderRadius: borderRadius,
        ),
        child: ClipRRect(
          borderRadius: borderRadius,
          child: Stack(
            fit: StackFit.expand,
            children: [
              // Thumbnail image
              _buildThumbnailImage(),
              
              // Dark overlay for better contrast
              if (widget.showOverlay)
                Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        Colors.black.withOpacity(0.2),
                        Colors.transparent,
                        Colors.transparent,
                        Colors.black.withOpacity(0.3),
                      ],
                      stops: const [0.0, 0.3, 0.7, 1.0],
                    ),
                  ),
                ),
              
              // Play button overlay
              if (widget.showPlayButton)
                Center(
                  child: Container(
                    width: 60,
                    height: 60,
                    decoration: BoxDecoration(
                      color: Colors.black.withOpacity(0.6),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.play_arrow,
                      color: Colors.white,
                      size: 36,
                    ),
                  ),
                ),
              
              // Custom overlay widget
              if (widget.overlayWidget != null)
                widget.overlayWidget!,
              
              // Loading indicator if generating thumbnail
              if (_isGenerating)
                Container(
                  color: Colors.black.withOpacity(0.5),
                  child: Center(
                    child: CircularProgressIndicator(
                      color: Theme.of(context).primaryColor,
                      strokeWidth: 2,
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
  
  Widget _buildThumbnailImage() {
    if (_thumbnailUrl != null) {
      return CachedNetworkImage(
        imageUrl: _thumbnailUrl!,
        fit: BoxFit.cover,
        placeholder: (context, url) => _buildPlaceholder(),
        errorWidget: (context, url, error) => _buildPlaceholder(),
        fadeInDuration: const Duration(milliseconds: 200),
        fadeInCurve: Curves.easeOut,
        memCacheWidth: 720,  // Optimize memory usage
        memCacheHeight: 1280,
      );
    }
    
    // Try common thumbnail patterns for video URLs
    if (widget.videoUrl != null) {
      final videoUrl = widget.videoUrl!;
      final thumbnailPatterns = _generateThumbnailPatterns(videoUrl);
      
      if (thumbnailPatterns.isNotEmpty) {
        return Image.network(
          thumbnailPatterns.first,
          fit: BoxFit.cover,
          errorBuilder: (context, error, stackTrace) => _buildPlaceholder(),
          loadingBuilder: (context, child, loadingProgress) {
            if (loadingProgress == null) return child;
            return _buildPlaceholder();
          },
        );
      }
    }
    
    return _buildPlaceholder();
  }
  
  List<String> _generateThumbnailPatterns(String videoUrl) {
    final patterns = <String>[];
    
    if (videoUrl.contains('.mp4')) {
      // Common thumbnail URL patterns
      patterns.addAll([
        videoUrl.replaceAll('/videos/', '/thumbnails/').replaceAll('.mp4', '.jpg'),
        videoUrl.replaceAll('.mp4', '_thumb.jpg'),
        videoUrl.replaceAll('.mp4', '-thumb.jpg'),
        videoUrl.replaceAll('.mp4', '.jpg'),
      ]);
    }
    
    return patterns;
  }
  
  Widget _buildPlaceholder() {
    // Create a unique gradient based on video URL for variety
    final int hashCode = widget.videoUrl?.hashCode ?? widget.thumbnailUrl?.hashCode ?? 0;
    final gradients = [
      [const Color(0xFFFF0080), const Color(0xFF7928CA)], // Pink to Purple
      [const Color(0xFF00F0FF), const Color(0xFF0080FF)], // Cyan to Blue
      [const Color(0xFFFF0080), const Color(0xFFFF4040)], // Pink to Red
      [const Color(0xFF00CED1), const Color(0xFF00F0FF)], // Dark Turquoise to Cyan
      [const Color(0xFF7928CA), const Color(0xFF4B0082)], // Purple to Indigo
      [const Color(0xFFFF1493), const Color(0xFFFF69B4)], // Deep Pink to Hot Pink
    ];
    
    final gradientIndex = hashCode.abs() % gradients.length;
    final selectedGradient = gradients[gradientIndex];
    
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
          // Video icon
          Center(
            child: Icon(
              Icons.videocam,
              size: 48,
              color: Colors.white.withOpacity(0.7),
            ),
          ),
          // VIB3 watermark
          Positioned(
            bottom: 8,
            right: 8,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
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
}