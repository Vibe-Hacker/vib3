import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../services/thumbnail_service.dart';

/// TikTok-style video thumbnail widget with progressive loading
class VideoThumbnailWidget extends StatefulWidget {
  final String? thumbnailUrl;
  final String? videoUrl;
  final VoidCallback? onTap;
  
  const VideoThumbnailWidget({
    super.key,
    this.thumbnailUrl,
    this.videoUrl,
    this.onTap,
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
      print('Error generating thumbnail URL: $e');
      if (mounted) {
        setState(() {
          _isGenerating = false;
        });
      }
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: widget.onTap,
      child: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: BoxDecoration(
          color: Colors.black,
          borderRadius: BorderRadius.circular(30),
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(30),
          child: Stack(
            fit: StackFit.expand,
            children: [
              // Thumbnail image
              if (_thumbnailUrl != null)
                CachedNetworkImage(
                  imageUrl: _thumbnailUrl!,
                  fit: BoxFit.cover,
                  placeholder: (context, url) => _buildPlaceholder(),
                  errorWidget: (context, url, error) => _buildPlaceholder(),
                  fadeInDuration: const Duration(milliseconds: 200),
                  fadeInCurve: Curves.easeOut,
                )
              else
                _buildPlaceholder(),
              
              // Play button overlay
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
              
              // Loading indicator if generating thumbnail
              if (_isGenerating)
                Container(
                  color: Colors.black.withOpacity(0.5),
                  child: const Center(
                    child: CircularProgressIndicator(
                      color: Color(0xFFFF0080),
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
  
  Widget _buildPlaceholder() {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Colors.grey[900]!,
            Colors.grey[800]!,
          ],
        ),
      ),
      child: Center(
        child: Icon(
          Icons.videocam,
          size: 48,
          color: Colors.white.withOpacity(0.3),
        ),
      ),
    );
  }
}