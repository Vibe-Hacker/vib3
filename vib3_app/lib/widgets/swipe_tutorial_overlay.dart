import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Shows a tutorial overlay for swipe gestures on first use
class SwipeTutorialOverlay extends StatefulWidget {
  final VoidCallback onComplete;
  
  const SwipeTutorialOverlay({
    super.key,
    required this.onComplete,
  });
  
  @override
  State<SwipeTutorialOverlay> createState() => _SwipeTutorialOverlayState();
}

class _SwipeTutorialOverlayState extends State<SwipeTutorialOverlay>
    with TickerProviderStateMixin {
  late AnimationController _fadeController;
  late AnimationController _gestureController;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _swipeAnimation;
  
  int _currentStep = 0;
  final int _totalSteps = 5;
  
  @override
  void initState() {
    super.initState();
    
    _fadeController = AnimationController(
      duration: const Duration(milliseconds: 500),
      vsync: this,
    );
    
    _gestureController = AnimationController(
      duration: const Duration(seconds: 2),
      vsync: this,
    );
    
    _fadeAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _fadeController,
      curve: Curves.easeInOut,
    ));
    
    _swipeAnimation = Tween<Offset>(
      begin: Offset.zero,
      end: const Offset(1.0, 0.0),
    ).animate(CurvedAnimation(
      parent: _gestureController,
      curve: Curves.easeInOut,
    ));
    
    _fadeController.forward();
    _startGestureAnimation();
  }
  
  @override
  void dispose() {
    _fadeController.dispose();
    _gestureController.dispose();
    super.dispose();
  }
  
  void _startGestureAnimation() {
    _gestureController.repeat();
  }
  
  void _nextStep() {
    if (_currentStep < _totalSteps - 1) {
      setState(() {
        _currentStep++;
      });
      _gestureController.reset();
      _gestureController.repeat();
    } else {
      _completeTutorial();
    }
  }
  
  void _completeTutorial() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('swipe_tutorial_shown', true);
    
    _fadeController.reverse().then((_) {
      widget.onComplete();
    });
  }
  
  Widget _buildGestureVisual() {
    Widget hand = const Icon(
      Icons.touch_app,
      color: Colors.white,
      size: 48,
    );
    
    switch (_currentStep) {
      case 0: // Swipe right
        return AnimatedBuilder(
          animation: _swipeAnimation,
          builder: (context, child) {
            return Transform.translate(
              offset: Offset(_swipeAnimation.value.dx * 100, 0),
              child: hand,
            );
          },
        );
      case 1: // Swipe left
        return AnimatedBuilder(
          animation: _swipeAnimation,
          builder: (context, child) {
            return Transform.translate(
              offset: Offset(-_swipeAnimation.value.dx * 100, 0),
              child: hand,
            );
          },
        );
      case 2: // Swipe up
        return AnimatedBuilder(
          animation: _swipeAnimation,
          builder: (context, child) {
            return Transform.translate(
              offset: Offset(0, -_swipeAnimation.value.dx * 100),
              child: hand,
            );
          },
        );
      case 3: // Swipe down
        return AnimatedBuilder(
          animation: _swipeAnimation,
          builder: (context, child) {
            return Transform.translate(
              offset: Offset(0, _swipeAnimation.value.dx * 100),
              child: hand,
            );
          },
        );
      case 4: // Double tap
        return TweenAnimationBuilder<double>(
          tween: Tween(begin: 1.0, end: 1.2),
          duration: const Duration(milliseconds: 300),
          curve: Curves.elasticOut,
          builder: (context, value, child) {
            return Transform.scale(
              scale: value,
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  hand,
                  const SizedBox(width: 8),
                  Transform.scale(
                    scale: value > 1.1 ? 1.0 : 0.0,
                    child: const Icon(
                      Icons.favorite,
                      color: Colors.red,
                      size: 48,
                    ),
                  ),
                ],
              ),
            );
          },
          onEnd: () {
            Future.delayed(const Duration(milliseconds: 500), () {
              if (mounted) {
                setState(() {});
              }
            });
          },
        );
      default:
        return hand;
    }
  }
  
  String _getInstructionText() {
    switch (_currentStep) {
      case 0:
        return "Swipe right to like";
      case 1:
        return "Swipe left if not interested";
      case 2:
        return "Swipe up for similar content";
      case 3:
        return "Swipe down to save";
      case 4:
        return "Double tap to like";
      default:
        return "";
    }
  }
  
  IconData _getInstructionIcon() {
    switch (_currentStep) {
      case 0:
        return Icons.favorite;
      case 1:
        return Icons.block;
      case 2:
        return Icons.explore;
      case 3:
        return Icons.bookmark;
      case 4:
        return Icons.favorite;
      default:
        return Icons.touch_app;
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _fadeAnimation,
      child: GestureDetector(
        onTap: _nextStep,
        child: Container(
          color: Colors.black.withOpacity(0.8),
          child: SafeArea(
            child: Stack(
              children: [
                // Center gesture visual
                Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      _buildGestureVisual(),
                      const SizedBox(height: 48),
                      Icon(
                        _getInstructionIcon(),
                        color: const Color(0xFF00CED1),
                        size: 64,
                      ),
                      const SizedBox(height: 16),
                      Text(
                        _getInstructionText(),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
                
                // Progress dots
                Positioned(
                  bottom: 100,
                  left: 0,
                  right: 0,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(
                      _totalSteps,
                      (index) => Container(
                        margin: const EdgeInsets.symmetric(horizontal: 4),
                        width: 8,
                        height: 8,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: index <= _currentStep
                              ? const Color(0xFF00CED1)
                              : Colors.white.withOpacity(0.3),
                        ),
                      ),
                    ),
                  ),
                ),
                
                // Skip button
                Positioned(
                  top: 16,
                  right: 16,
                  child: TextButton(
                    onPressed: _completeTutorial,
                    child: const Text(
                      'Skip',
                      style: TextStyle(
                        color: Colors.white70,
                        fontSize: 16,
                      ),
                    ),
                  ),
                ),
                
                // Next button
                Positioned(
                  bottom: 32,
                  left: 0,
                  right: 0,
                  child: Center(
                    child: Text(
                      _currentStep < _totalSteps - 1 ? 'Tap to continue' : 'Tap to start',
                      style: TextStyle(
                        color: Colors.white.withOpacity(0.7),
                        fontSize: 14,
                      ),
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
}

/// Helper to check if tutorial should be shown
class SwipeTutorialHelper {
  static Future<bool> shouldShowTutorial() async {
    final prefs = await SharedPreferences.getInstance();
    return !(prefs.getBool('swipe_tutorial_shown') ?? false);
  }
  
  static Future<void> resetTutorial() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('swipe_tutorial_shown');
  }
}