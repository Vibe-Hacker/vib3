import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'video_action_buttons.dart';
import '../../../core/models/post.dart';

/// Draggable wrapper for video action buttons
class DraggableActionButtons extends StatefulWidget {
  final Post post;
  final bool isLiked;
  final bool isFollowing;
  final VoidCallback onLike;
  final VoidCallback onComment;
  final VoidCallback onShare;
  final VoidCallback onFollow;
  final VoidCallback onProfile;
  final Function(Offset)? onPositionChanged;
  final Offset? initialPosition;
  
  const DraggableActionButtons({
    super.key,
    required this.post,
    required this.isLiked,
    required this.isFollowing,
    required this.onLike,
    required this.onComment,
    required this.onShare,
    required this.onFollow,
    required this.onProfile,
    this.onPositionChanged,
    this.initialPosition,
  });
  
  @override
  State<DraggableActionButtons> createState() => _DraggableActionButtonsState();
}

class _DraggableActionButtonsState extends State<DraggableActionButtons> {
  late Offset _position;
  bool _isDragging = false;
  bool _dragModeEnabled = false;
  
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (widget.initialPosition != null) {
        _position = widget.initialPosition!;
      } else {
        // Default position on the right side
        final size = MediaQuery.of(context).size;
        _position = Offset(size.width - 100, size.height * 0.4);
      }
    });
  }
  
  void _enableDragMode() {
    HapticFeedback.mediumImpact();
    setState(() {
      _dragModeEnabled = true;
    });
    
    // Auto-disable after 5 seconds
    Future.delayed(const Duration(seconds: 5), () {
      if (mounted && _dragModeEnabled && !_isDragging) {
        setState(() {
          _dragModeEnabled = false;
        });
      }
    });
  }
  
  @override
  Widget build(BuildContext context) {
    return Positioned(
      left: _position.dx,
      top: _position.dy,
      child: GestureDetector(
        onLongPress: _enableDragMode,
        child: Draggable(
          feedback: _buildFeedback(),
          childWhenDragging: Container(),
          onDragStarted: () {
            setState(() {
              _isDragging = true;
            });
          },
          onDragEnd: (details) {
            setState(() {
              _isDragging = false;
              _dragModeEnabled = false;
              _position = details.offset;
            });
            
            // Notify parent of position change
            widget.onPositionChanged?.call(details.offset);
          },
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            decoration: BoxDecoration(
              border: _dragModeEnabled
                  ? Border.all(
                      color: Theme.of(context).primaryColor,
                      width: 2,
                    )
                  : null,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Stack(
              children: [
                VideoActionButtons(
                  post: widget.post,
                  isLiked: widget.isLiked,
                  isFollowing: widget.isFollowing,
                  onLike: widget.onLike,
                  onComment: widget.onComment,
                  onShare: widget.onShare,
                  onFollow: widget.onFollow,
                  onProfile: widget.onProfile,
                  isDragMode: _dragModeEnabled,
                ),
                
                // Drag indicator
                if (_dragModeEnabled)
                  Positioned(
                    top: 0,
                    right: 0,
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: BoxDecoration(
                        color: Theme.of(context).primaryColor,
                        borderRadius: const BorderRadius.only(
                          topRight: Radius.circular(6),
                          bottomLeft: Radius.circular(6),
                        ),
                      ),
                      child: const Icon(
                        Icons.drag_indicator,
                        color: Colors.white,
                        size: 16,
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
  
  Widget _buildFeedback() {
    return Material(
      color: Colors.transparent,
      child: Container(
        decoration: BoxDecoration(
          color: Colors.black.withOpacity(0.8),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: Theme.of(context).primaryColor,
            width: 2,
          ),
        ),
        child: VideoActionButtons(
          post: widget.post,
          isLiked: widget.isLiked,
          isFollowing: widget.isFollowing,
          onLike: () {},
          onComment: () {},
          onShare: () {},
          onFollow: () {},
          onProfile: () {},
          showCounts: false,
        ),
      ),
    );
  }
}