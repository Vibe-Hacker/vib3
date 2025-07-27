import 'package:flutter/material.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import '../../../core/services/network/adaptive_streaming_service.dart';
import 'dart:async';

/// Network quality indicator widget that shows connection status and quality
class NetworkQualityIndicator extends StatefulWidget {
  final bool showText;
  final bool showBandwidth;
  final EdgeInsets? padding;
  final Color? backgroundColor;
  final BorderRadius? borderRadius;
  final VoidCallback? onTap;
  
  const NetworkQualityIndicator({
    super.key,
    this.showText = true,
    this.showBandwidth = false,
    this.padding,
    this.backgroundColor,
    this.borderRadius,
    this.onTap,
  });

  @override
  State<NetworkQualityIndicator> createState() => _NetworkQualityIndicatorState();
}

class _NetworkQualityIndicatorState extends State<NetworkQualityIndicator>
    with SingleTickerProviderStateMixin {
  
  NetworkQuality _networkQuality = NetworkQuality.good;
  List<ConnectivityResult> _connectionStatus = [ConnectivityResult.none];
  late StreamSubscription<List<ConnectivityResult>> _connectivitySubscription;
  late AnimationController _animationController;
  late Animation<double> _pulseAnimation;
  
  @override
  void initState() {
    super.initState();
    
    _animationController = AnimationController(
      duration: const Duration(seconds: 2),
      vsync: this,
    );
    
    _pulseAnimation = Tween<double>(
      begin: 0.7,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeInOut,
    ));
    
    _animationController.repeat(reverse: true);
    
    _initNetworkMonitoring();
  }
  
  @override
  void dispose() {
    _connectivitySubscription.cancel();
    _animationController.dispose();
    super.dispose();
  }
  
  void _initNetworkMonitoring() {
    // Listen to connectivity changes
    _connectivitySubscription = Connectivity().onConnectivityChanged.listen(
      (List<ConnectivityResult> result) {
        setState(() {
          _connectionStatus = result;
          _updateNetworkQuality();
        });
      },
    );
    
    // Get initial connectivity
    Connectivity().checkConnectivity().then((result) {
      setState(() {
        _connectionStatus = result;
        _updateNetworkQuality();
      });
    });
    
    // Listen to adaptive streaming service if available
    final streamingService = AdaptiveStreamingService();
    streamingService.onNetworkQualityChanged = (quality) {
      if (mounted) {
        setState(() {
          _networkQuality = quality;
        });
      }
    };
  }
  
  void _updateNetworkQuality() {
    if (_connectionStatus.contains(ConnectivityResult.ethernet) ||
        _connectionStatus.contains(ConnectivityResult.wifi)) {
      _networkQuality = NetworkQuality.excellent;
    } else if (_connectionStatus.contains(ConnectivityResult.mobile)) {
      _networkQuality = NetworkQuality.good;
    } else if (_connectionStatus.contains(ConnectivityResult.none) ||
               _connectionStatus.isEmpty) {
      _networkQuality = NetworkQuality.poor;
    } else {
      _networkQuality = NetworkQuality.fair;
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: widget.onTap ?? _showNetworkDetails,
      child: Container(
        padding: widget.padding ?? const EdgeInsets.symmetric(
          horizontal: 8,
          vertical: 4,
        ),
        decoration: BoxDecoration(
          color: widget.backgroundColor ?? Colors.black.withOpacity(0.7),
          borderRadius: widget.borderRadius ?? BorderRadius.circular(8),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            _buildSignalIcon(),
            if (widget.showText) ..[
              const SizedBox(width: 6),
              _buildQualityText(),
            ],
            if (widget.showBandwidth) ..[
              const SizedBox(width: 6),
              _buildBandwidthText(),
            ],
          ],
        ),
      ),
    );
  }
  
  Widget _buildSignalIcon() {
    Color iconColor;
    IconData iconData;
    
    switch (_networkQuality) {
      case NetworkQuality.excellent:
        iconColor = Colors.green;
        iconData = Icons.signal_cellular_4_bar;
        break;
      case NetworkQuality.good:
        iconColor = Colors.lightGreen;
        iconData = Icons.signal_cellular_3_bar;
        break;
      case NetworkQuality.fair:
        iconColor = Colors.orange;
        iconData = Icons.signal_cellular_2_bar;
        break;
      case NetworkQuality.poor:
        iconColor = Colors.red;
        iconData = Icons.signal_cellular_1_bar;
        break;
    }
    
    // Use animation for poor connection to indicate instability
    if (_networkQuality == NetworkQuality.poor) {
      return AnimatedBuilder(
        animation: _pulseAnimation,
        builder: (context, child) => Transform.scale(
          scale: _pulseAnimation.value,
          child: Icon(
            iconData,
            color: iconColor,
            size: 16,
          ),
        ),
      );
    }
    
    return Icon(
      iconData,
      color: iconColor,
      size: 16,
    );
  }
  
  Widget _buildQualityText() {
    String qualityText;
    Color textColor = Colors.white;
    
    switch (_networkQuality) {
      case NetworkQuality.excellent:
        qualityText = 'Excellent';
        textColor = Colors.green;
        break;
      case NetworkQuality.good:
        qualityText = 'Good';
        textColor = Colors.lightGreen;
        break;
      case NetworkQuality.fair:
        qualityText = 'Fair';
        textColor = Colors.orange;
        break;
      case NetworkQuality.poor:
        qualityText = 'Poor';
        textColor = Colors.red;
        break;
    }
    
    return Text(
      qualityText,
      style: TextStyle(
        color: textColor,
        fontSize: 12,
        fontWeight: FontWeight.w600,
      ),
    );
  }
  
  Widget _buildBandwidthText() {
    final streamingService = AdaptiveStreamingService();
    final bandwidth = streamingService.averageBandwidth;
    
    String bandwidthText;
    if (bandwidth > 10) {
      bandwidthText = '${bandwidth.toStringAsFixed(1)}M';
    } else if (bandwidth > 1) {
      bandwidthText = '${bandwidth.toStringAsFixed(1)}M';
    } else if (bandwidth > 0) {
      bandwidthText = '${(bandwidth * 1000).toStringAsFixed(0)}K';
    } else {
      bandwidthText = '--';
    }
    
    return Text(
      bandwidthText,
      style: const TextStyle(
        color: Colors.white70,
        fontSize: 10,
        fontWeight: FontWeight.w500,
      ),
    );
  }
  
  void _showNetworkDetails() {
    final connectionType = _getConnectionTypeString();
    final qualityString = _networkQuality.toString().split('.').last;
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1A1A1A),
        title: const Text(
          'Network Status',
          style: TextStyle(color: Colors.white),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildDetailRow('Connection', connectionType),
            const SizedBox(height: 8),
            _buildDetailRow('Quality', qualityString.toUpperCase()),
            if (widget.showBandwidth) ..[
              const SizedBox(height: 8),
              _buildDetailRow('Bandwidth', '${AdaptiveStreamingService().averageBandwidth.toStringAsFixed(1)} Mbps'),
            ],
            const SizedBox(height: 8),
            _buildDetailRow('Device Performance', AdaptiveStreamingService().devicePerformance.toString().split('.').last.toUpperCase()),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text(
              'Close',
              style: TextStyle(color: Colors.grey),
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildDetailRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: const TextStyle(
            color: Colors.white70,
            fontSize: 14,
          ),
        ),
        Text(
          value,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }
  
  String _getConnectionTypeString() {
    if (_connectionStatus.contains(ConnectivityResult.wifi)) {
      return 'WiFi';
    } else if (_connectionStatus.contains(ConnectivityResult.ethernet)) {
      return 'Ethernet';
    } else if (_connectionStatus.contains(ConnectivityResult.mobile)) {
      return 'Mobile Data';
    } else if (_connectionStatus.contains(ConnectivityResult.bluetooth)) {
      return 'Bluetooth';
    } else if (_connectionStatus.contains(ConnectivityResult.none)) {
      return 'No Connection';
    } else {
      return 'Unknown';
    }
  }
}