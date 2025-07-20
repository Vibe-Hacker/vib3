import 'package:flutter/material.dart';
import '../services/adaptive_streaming_service.dart';

/// Widget to show current network quality
class NetworkQualityIndicator extends StatefulWidget {
  const NetworkQualityIndicator({super.key});

  @override
  State<NetworkQualityIndicator> createState() => _NetworkQualityIndicatorState();
}

class _NetworkQualityIndicatorState extends State<NetworkQualityIndicator> {
  final AdaptiveStreamingService _adaptiveService = AdaptiveStreamingService();

  @override
  void initState() {
    super.initState();
    _adaptiveService.initialize();
    
    // Listen to quality changes
    _adaptiveService.onNetworkQualityChanged = (_) {
      if (mounted) setState(() {});
    };
    
    _adaptiveService.onQualityChanged = (_) {
      if (mounted) setState(() {});
    };
  }

  @override
  Widget build(BuildContext context) {
    final networkQuality = _adaptiveService.networkQuality;
    final videoQuality = _adaptiveService.videoQuality;
    
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.7),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Network quality icon
          Icon(
            _getNetworkIcon(networkQuality),
            color: _getNetworkColor(networkQuality),
            size: 16,
          ),
          const SizedBox(width: 8),
          // Video quality text
          Text(
            videoQuality.resolution,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 12,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  IconData _getNetworkIcon(NetworkQuality quality) {
    return switch (quality) {
      NetworkQuality.excellent => Icons.signal_wifi_4_bar,
      NetworkQuality.good => Icons.signal_wifi_4_bar,
      NetworkQuality.fair => Icons.network_wifi_2_bar,
      NetworkQuality.poor => Icons.signal_wifi_bad,
    };
  }

  Color _getNetworkColor(NetworkQuality quality) {
    return switch (quality) {
      NetworkQuality.excellent => Colors.green,
      NetworkQuality.good => Colors.lightGreen,
      NetworkQuality.fair => Colors.orange,
      NetworkQuality.poor => Colors.red,
    };
  }

  @override
  void dispose() {
    _adaptiveService.dispose();
    super.dispose();
  }
}