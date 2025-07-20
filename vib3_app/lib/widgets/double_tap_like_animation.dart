import 'package:flutter/material.dart';

/// Animated heart that appears when double-tapping to like
class DoubleTapLikeAnimation extends StatefulWidget {
  final VoidCallback onAnimationComplete;
  
  const DoubleTapLikeAnimation({
    super.key,
    required this.onAnimationComplete,
  });
  
  @override
  State<DoubleTapLikeAnimation> createState() => _DoubleTapLikeAnimationState();
}

class _DoubleTapLikeAnimationState extends State<DoubleTapLikeAnimation>
    with TickerProviderStateMixin {
  late AnimationController _scaleController;
  late AnimationController _opacityController;
  late Animation<double> _scaleAnimation;
  late Animation<double> _opacityAnimation;
  
  @override
  void initState() {
    super.initState();
    
    // Scale animation - heart grows then shrinks
    _scaleController = AnimationController(
      duration: const Duration(milliseconds: 600),
      vsync: this,
    );
    
    _scaleAnimation = TweenSequence<double>([
      TweenSequenceItem(
        tween: Tween<double>(begin: 0.0, end: 1.2)
            .chain(CurveTween(curve: Curves.easeOutBack)),
        weight: 50,
      ),
      TweenSequenceItem(
        tween: Tween<double>(begin: 1.2, end: 1.0)
            .chain(CurveTween(curve: Curves.easeIn)),
        weight: 50,
      ),
    ]).animate(_scaleController);
    
    // Opacity animation - fade in then out
    _opacityController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );
    
    _opacityAnimation = TweenSequence<double>([
      TweenSequenceItem(
        tween: Tween<double>(begin: 0.0, end: 1.0),
        weight: 20,
      ),
      TweenSequenceItem(
        tween: Tween<double>(begin: 1.0, end: 1.0),
        weight: 60,
      ),
      TweenSequenceItem(
        tween: Tween<double>(begin: 1.0, end: 0.0),
        weight: 20,
      ),
    ]).animate(_opacityController);
    
    // Start animations
    _scaleController.forward();
    _opacityController.forward().then((_) {
      widget.onAnimationComplete();
    });
  }
  
  @override
  void dispose() {
    _scaleController.dispose();
    _opacityController.dispose();
    super.dispose();
  }
  
  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: Listenable.merge([_scaleAnimation, _opacityAnimation]),
      builder: (context, child) {
        return Opacity(
          opacity: _opacityAnimation.value,
          child: Transform.scale(
            scale: _scaleAnimation.value,
            child: child,
          ),
        );
      },
      child: Container(
        width: 120,
        height: 120,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          boxShadow: [
            BoxShadow(
              color: Colors.red.withOpacity(0.3),
              blurRadius: 20,
              spreadRadius: 10,
            ),
          ],
        ),
        child: const Icon(
          Icons.favorite,
          color: Colors.red,
          size: 80,
        ),
      ),
    );
  }
}

/// Widget that handles double tap detection and shows heart animation
class DoubleTapLikeWrapper extends StatefulWidget {
  final Widget child;
  final VoidCallback onDoubleTap;
  final bool isLiked;
  
  const DoubleTapLikeWrapper({
    super.key,
    required this.child,
    required this.onDoubleTap,
    required this.isLiked,
  });
  
  @override
  State<DoubleTapLikeWrapper> createState() => _DoubleTapLikeWrapperState();
}

class _DoubleTapLikeWrapperState extends State<DoubleTapLikeWrapper> {
  final List<_LikeAnimation> _animations = [];
  
  void _handleDoubleTap(TapDownDetails details) {
    // Call the callback
    widget.onDoubleTap();
    
    // Add new animation at tap position
    setState(() {
      _animations.add(_LikeAnimation(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        position: details.localPosition,
      ));
    });
  }
  
  void _removeAnimation(String id) {
    setState(() {
      _animations.removeWhere((anim) => anim.id == id);
    });
  }
  
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onDoubleTapDown: _handleDoubleTap,
      child: Stack(
        children: [
          widget.child,
          ..._animations.map((anim) => Positioned(
            left: anim.position.dx - 60, // Center the heart
            top: anim.position.dy - 60,
            child: DoubleTapLikeAnimation(
              onAnimationComplete: () => _removeAnimation(anim.id),
            ),
          )),
        ],
      ),
    );
  }
}

class _LikeAnimation {
  final String id;
  final Offset position;
  
  _LikeAnimation({
    required this.id,
    required this.position,
  });
}