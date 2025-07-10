import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// Detects various swipe gestures on videos
class SwipeGestureDetector extends StatefulWidget {
  final Widget child;
  final VoidCallback? onSwipeLeft;
  final VoidCallback? onSwipeRight;
  final VoidCallback? onSwipeUp;
  final VoidCallback? onSwipeDown;
  final VoidCallback? onDoubleTap;
  final VoidCallback? onLongPress;
  
  const SwipeGestureDetector({
    super.key,
    required this.child,
    this.onSwipeLeft,
    this.onSwipeRight,
    this.onSwipeUp,
    this.onSwipeDown,
    this.onDoubleTap,
    this.onLongPress,
  });
  
  @override
  State<SwipeGestureDetector> createState() => _SwipeGestureDetectorState();
}

class _SwipeGestureDetectorState extends State<SwipeGestureDetector> {
  // Swipe detection thresholds
  static const double _minSwipeDistance = 50.0;
  static const double _swipeVelocity = 300.0;
  
  // Track gesture start position
  Offset? _gestureStartPosition;
  
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
      // Swipe right
      if (widget.onSwipeRight != null) {
        HapticFeedback.lightImpact();
        widget.onSwipeRight!();
      }
    } else if (velocity.dx < 0 || distance < -_minSwipeDistance) {
      // Swipe left
      if (widget.onSwipeLeft != null) {
        HapticFeedback.lightImpact();
        widget.onSwipeLeft!();
      }
    }
  }
  
  void _handleVerticalSwipe(DragEndDetails details) {
    if (_gestureStartPosition == null) return;
    
    final velocity = details.velocity.pixelsPerSecond;
    final position = details.localPosition ?? Offset.zero;
    final distance = position.dy - _gestureStartPosition!.dy;
    
    // Check if swipe meets minimum requirements
    if (velocity.dy.abs() < _swipeVelocity && distance.abs() < _minSwipeDistance) {
      return;
    }
    
    // Determine swipe direction
    if (velocity.dy > 0 || distance > _minSwipeDistance) {
      // Swipe down
      if (widget.onSwipeDown != null) {
        HapticFeedback.lightImpact();
        widget.onSwipeDown!();
      }
    } else if (velocity.dy < 0 || distance < -_minSwipeDistance) {
      // Swipe up
      if (widget.onSwipeUp != null) {
        HapticFeedback.lightImpact();
        widget.onSwipeUp!();
      }
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onDoubleTap: widget.onDoubleTap,
      onLongPress: widget.onLongPress,
      onPanStart: (details) {
        _gestureStartPosition = details.localPosition;
      },
      onPanEnd: (details) {
        // Determine if this is primarily a horizontal or vertical swipe
        final velocity = details.velocity.pixelsPerSecond;
        
        if (velocity.dx.abs() > velocity.dy.abs()) {
          _handleHorizontalSwipe(details);
        } else {
          _handleVerticalSwipe(details);
        }
        
        _gestureStartPosition = null;
      },
      child: widget.child,
    );
  }
}

/// Specific swipe actions for video interactions
class VideoSwipeActions extends StatelessWidget {
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
  
  void _showSwipeHint(BuildContext context, String action, IconData icon) {
    final overlay = Overlay.of(context);
    late OverlayEntry overlayEntry;
    
    overlayEntry = OverlayEntry(
      builder: (context) => Positioned(
        top: MediaQuery.of(context).size.height * 0.4,
        left: 0,
        right: 0,
        child: TweenAnimationBuilder<double>(
          tween: Tween(begin: 0.0, end: 1.0),
          duration: const Duration(milliseconds: 200),
          builder: (context, value, child) {
            return Opacity(
              opacity: value,
              child: Transform.scale(
                scale: 0.8 + (0.2 * value),
                child: child,
              ),
            );
          },
          child: Center(
            child: Container(
              padding: const EdgeInsets.symmetric(
                horizontal: 24,
                vertical: 12,
              ),
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.8),
                borderRadius: BorderRadius.circular(30),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF00CED1).withOpacity(0.3),
                    blurRadius: 20,
                    spreadRadius: 2,
                  ),
                ],
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    icon,
                    color: const Color(0xFF00CED1),
                    size: 24,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    action,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
          ),
          onEnd: () {
            Future.delayed(const Duration(milliseconds: 800), () {
              overlayEntry.remove();
            });
          },
        ),
      ),
    );
    
    overlay.insert(overlayEntry);
  }
  
  @override
  Widget build(BuildContext context) {
    return SwipeGestureDetector(
      onSwipeRight: () {
        if (onLike != null) {
          _showSwipeHint(context, 'Liked!', Icons.favorite);
          onLike!();
        }
      },
      onSwipeLeft: () {
        if (onNotInterested != null) {
          _showSwipeHint(context, 'Not Interested', Icons.block);
          onNotInterested!();
        }
      },
      onSwipeUp: () {
        if (onShowMore != null) {
          _showSwipeHint(context, 'More like this', Icons.explore);
          onShowMore!();
        }
      },
      onSwipeDown: () {
        if (onSave != null) {
          _showSwipeHint(context, 'Saved!', Icons.bookmark);
          onSave!();
        }
      },
      onDoubleTap: onLike,
      onLongPress: onShare,
      child: child,
    );
  }
}