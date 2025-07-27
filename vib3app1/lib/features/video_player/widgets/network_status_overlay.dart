import 'package:flutter/material.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import '../../../core/services/network/adaptive_streaming_service.dart';
import 'dart:async';

/// Minimalist network status overlay for video players
class NetworkStatusOverlay extends StatefulWidget {
  final bool showOnlyWhenPoor;
  final Alignment alignment;
  final EdgeInsets margin;
  final Duration hideDelay;
  
  const NetworkStatusOverlay({
    super.key,
    this.showOnlyWhenPoor = true,
    this.alignment = Alignment.topRight,
    this.margin = const EdgeInsets.all(16),
    this.hideDelay = const Duration(seconds: 3),
  });

  @override
  State<NetworkStatusOverlay> createState() => _NetworkStatusOverlayState();
}

class _NetworkStatusOverlayState extends State<NetworkStatusOverlay>
    with SingleTickerProviderStateMixin {
  
  NetworkQuality _networkQuality = NetworkQuality.good;
  bool _showOverlay = false;
  Timer? _hideTimer;
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;
  
  @override
  void initState() {
    super.initState();
    
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    
    _fadeAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeOut,
    ));
    
    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, -1),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeOutBack,
    ));
    
    _initNetworkMonitoring();
  }
  
  @override
  void dispose() {
    _hideTimer?.cancel();
    _animationController.dispose();
    super.dispose();
  }
  
  void _initNetworkMonitoring() {
    // Listen to adaptive streaming service
    final streamingService = AdaptiveStreamingService();
    streamingService.onNetworkQualityChanged = (quality) {
      if (mounted) {
        final previousQuality = _networkQuality;
        setState(() {
          _networkQuality = quality;
        });
        
        // Show overlay if quality changed or if quality is poor
        if (previousQuality != quality || 
            (!widget.showOnlyWhenPoor || quality == NetworkQuality.poor)) {
          _showNetworkStatus();
        }
      }
    };
  }
  
  void _showNetworkStatus() {
    _hideTimer?.cancel();
    
    if (!_showOverlay) {
      setState(() {
        _showOverlay = true;
      });
      _animationController.forward();
    }
    
    // Auto-hide after delay
    _hideTimer = Timer(widget.hideDelay, _hideNetworkStatus);
  }
  
  void _hideNetworkStatus() {
    if (_showOverlay) {
      _animationController.reverse().then((_) {
        if (mounted) {
          setState(() {
            _showOverlay = false;
          });
        }
      });
    }
  }
  
  @override
  Widget build(BuildContext context) {
    if (!_showOverlay || 
        (widget.showOnlyWhenPoor && _networkQuality != NetworkQuality.poor)) {
      return const SizedBox.shrink();
    }
    
    return Positioned.fill(
      child: Align(
        alignment: widget.alignment,
        child: Container(
          margin: widget.margin,
          child: SlideTransition(
            position: _slideAnimation,
            child: FadeTransition(
              opacity: _fadeAnimation,
              child: _buildNetworkIndicator(),
            ),
          ),
        ),
      ),
    );
  }
  
  Widget _buildNetworkIndicator() {
    IconData iconData;
    Color backgroundColor;
    String message;
    
    switch (_networkQuality) {
      case NetworkQuality.excellent:
        iconData = Icons.wifi;
        backgroundColor = Colors.green.withOpacity(0.9);
        message = 'Excellent Connection';
        break;
      case NetworkQuality.good:
        iconData = Icons.wifi;
        backgroundColor = Colors.lightGreen.withOpacity(0.9);
        message = 'Good Connection';
        break;
      case NetworkQuality.fair:
        iconData = Icons.wifi_outlined;
        backgroundColor = Colors.orange.withOpacity(0.9);
        message = 'Slow Connection';
        break;
      case NetworkQuality.poor:
        iconData = Icons.wifi_off;
        backgroundColor = Colors.red.withOpacity(0.9);
        message = 'Poor Connection';
        break;
    }
    
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.3),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            iconData,
            color: Colors.white,
            size: 16,
          ),
          const SizedBox(width: 6),
          Text(
            message,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

/// Simple network quality dot indicator
class NetworkQualityDot extends StatefulWidget {
  final double size;
  final EdgeInsets margin;
  
  const NetworkQualityDot({
    super.key,
    this.size = 8,
    this.margin = const EdgeInsets.all(4),
  });

  @override
  State<NetworkQualityDot> createState() => _NetworkQualityDotState();
}

class _NetworkQualityDotState extends State<NetworkQualityDot>
    with SingleTickerProviderStateMixin {
  
  NetworkQuality _networkQuality = NetworkQuality.good;
  late AnimationController _animationController;
  late Animation<double> _pulseAnimation;
  
  @override
  void initState() {
    super.initState();
    
    _animationController = AnimationController(
      duration: const Duration(seconds: 1),
      vsync: this,
    );
    
    _pulseAnimation = Tween<double>(
      begin: 0.5,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeInOut,
    ));
    
    _initNetworkMonitoring();
  }
  
  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }
  
  void _initNetworkMonitoring() {
    final streamingService = AdaptiveStreamingService();
    streamingService.onNetworkQualityChanged = (quality) {
      if (mounted) {
        setState(() {
          _networkQuality = quality;
        });
        
        // Pulse animation for poor quality
        if (quality == NetworkQuality.poor) {
          _animationController.repeat(reverse: true);
        } else {
          _animationController.stop();
          _animationController.reset();
        }
      }
    };
  }
  
  @override
  Widget build(BuildContext context) {
    Color dotColor;
    
    switch (_networkQuality) {
      case NetworkQuality.excellent:
        dotColor = Colors.green;
        break;
      case NetworkQuality.good:
        dotColor = Colors.lightGreen;
        break;
      case NetworkQuality.fair:
        dotColor = Colors.orange;
        break;
      case NetworkQuality.poor:
        dotColor = Colors.red;
        break;
    }
    
    Widget dot = Container(
      width: widget.size,
      height: widget.size,
      margin: widget.margin,
      decoration: BoxDecoration(
        color: dotColor,
        shape: BoxShape.circle,
        boxShadow: [
          BoxShadow(
            color: dotColor.withOpacity(0.5),
            blurRadius: 4,
            spreadRadius: 1,
          ),
        ],
      ),
    );
    
    // Animate for poor connection
    if (_networkQuality == NetworkQuality.poor) {
      return AnimatedBuilder(
        animation: _pulseAnimation,
        builder: (context, child) => Transform.scale(
          scale: _pulseAnimation.value,
          child: dot,
        ),
      );
    }
    
    return dot;
  }
}