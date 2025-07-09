import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../state_manager.dart';
import '../actions/action_buttons.dart';
import '../../../models/video.dart';

/// Draggable wrapper for action buttons that doesn't interfere with other components
class DraggableActionButtons extends StatefulWidget {
  final Video video;
  final bool isLiked;
  final bool isFollowing;
  final VoidCallback onLike;
  final VoidCallback onComment;
  final VoidCallback onShare;
  final VoidCallback onFollow;
  final VoidCallback onProfile;
  
  const DraggableActionButtons({
    super.key,
    required this.video,
    required this.isLiked,
    required this.isFollowing,
    required this.onLike,
    required this.onComment,
    required this.onShare,
    required this.onFollow,
    required this.onProfile,
  });
  
  @override
  State<DraggableActionButtons> createState() => _DraggableActionButtonsState();
}

class _DraggableActionButtonsState extends State<DraggableActionButtons> {
  Offset _position = Offset.zero;
  bool _isDragging = false;
  bool _dragModeEnabled = false;
  
  @override
  void initState() {
    super.initState();
    // Load saved position from state manager
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final stateManager = context.read<VideoFeedStateManager>();
      final savedPosition = stateManager.actionButtonPositions['main'];
      if (savedPosition != null) {
        setState(() {
          _position = savedPosition;
        });
      } else {
        // Default position
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
    final stateManager = context.watch<VideoFeedStateManager>();
    
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
            stateManager.setDraggingActions(true);
          },
          onDragEnd: (details) {
            setState(() {
              _isDragging = false;
              _dragModeEnabled = false;
              _position = details.offset;
            });
            
            // Save position to state manager
            stateManager.updateActionButtonPosition('main', details.offset);
            stateManager.setDraggingActions(false);
          },
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            decoration: BoxDecoration(
              border: _dragModeEnabled
                  ? Border.all(
                      color: const Color(0xFF00CED1),
                      width: 2,
                    )
                  : null,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Stack(
              children: [
                VideoActionButtons(
                  video: widget.video,
                  isLiked: widget.isLiked,
                  isFollowing: widget.isFollowing,
                  onLike: widget.onLike,
                  onComment: widget.onComment,
                  onShare: widget.onShare,
                  onFollow: widget.onFollow,
                  onProfile: widget.onProfile,
                ),
                
                // Drag indicator
                if (_dragModeEnabled)
                  Positioned(
                    top: 0,
                    right: 0,
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: const BoxDecoration(
                        color: Color(0xFF00CED1),
                        borderRadius: BorderRadius.only(
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
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: const Color(0xFF00CED1),
            width: 2,
          ),
        ),
        child: VideoActionButtons(
          video: widget.video,
          isLiked: widget.isLiked,
          isFollowing: widget.isFollowing,
          onLike: () {},
          onComment: () {},
          onShare: () {},
          onFollow: () {},
          onProfile: () {},
        ),
      ),
    );
  }
}