import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// Wrapper widget that handles swipe actions on videos
class VideoSwipeActions extends StatefulWidget {
  final Widget child;
  final VoidCallback? onLike;
  final VoidCallback? onShare;
  final VoidCallback? onSave;
  final VoidCallback? onNotInterested;
  final VoidCallback? onShowMore;
  
  const VideoSwipeActions({
    super.key,
    required this.child,
    this.onLike,
    this.onShare,
    this.onSave,
    this.onNotInterested,
    this.onShowMore,
  });
  
  @override
  State<VideoSwipeActions> createState() => _VideoSwipeActionsState();
}

class _VideoSwipeActionsState extends State<VideoSwipeActions> {
  // Swipe detection thresholds
  static const double _minSwipeDistance = 50.0;
  static const double _swipeVelocity = 300.0;
  
  // Track gesture start position
  Offset? _gestureStartPosition;
  DateTime? _gestureStartTime;
  
  void _handleHorizontalSwipe(DragEndDetails details) {
    if (_gestureStartPosition == null) return;
    
    final velocity = details.velocity.pixelsPerSecond;
    final position = details.localPosition ?? Offset.zero;
    final distance = position.dx - _gestureStartPosition!.dx;
    
    // Check if swipe meets minimum requirements
    if (velocity.dx.abs() < _swipeVelocity && distance.abs() < _minSwipeDistance) {
      return;
    }
    
    // Determine swipe direction
    if (velocity.dx > 0 || distance > _minSwipeDistance) {
      // Right swipe - Show more like this
      HapticFeedback.lightImpact();
      widget.onShowMore?.call();
    } else if (velocity.dx < 0 || distance < -_minSwipeDistance) {
      // Left swipe - Not interested
      HapticFeedback.lightImpact();
      widget.onNotInterested?.call();
    }
  }
  
  void _handleVerticalSwipe(DragEndDetails details) {
    if (_gestureStartPosition == null) return;
    
    final velocity = details.velocity.pixelsPerSecond;
    final position = details.localPosition ?? Offset.zero;
    final distance = position.dy - _gestureStartPosition!.dy;
    
    // Check if swipe meets minimum requirements for vertical actions
    if (velocity.dy.abs() < _swipeVelocity && distance.abs() < _minSwipeDistance * 1.5) {
      return;
    }
    
    // Determine swipe direction
    if (velocity.dy < 0 || distance < -_minSwipeDistance * 1.5) {
      // Swipe up - Share
      HapticFeedback.mediumImpact();
      widget.onShare?.call();
    } else if (velocity.dy > 0 || distance > _minSwipeDistance) {
      // Swipe down - Save
      HapticFeedback.mediumImpact();
      widget.onSave?.call();
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onHorizontalDragStart: (details) {
        _gestureStartPosition = details.localPosition;
        _gestureStartTime = DateTime.now();
      },
      onHorizontalDragEnd: _handleHorizontalSwipe,
      onVerticalDragStart: (details) {
        _gestureStartPosition = details.localPosition;
        _gestureStartTime = DateTime.now();
      },
      onVerticalDragEnd: _handleVerticalSwipe,
      child: widget.child,
    );
  }
}