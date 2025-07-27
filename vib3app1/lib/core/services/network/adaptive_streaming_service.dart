import 'dart:async';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:device_info_plus/device_info_plus.dart';
import 'package:flutter/foundation.dart';
import 'dart:io';

// Network quality levels
enum NetworkQuality { poor, fair, good, excellent }

// Video quality presets
enum VideoQuality {
  low(resolution: '480p', bitrate: 800),
  medium(resolution: '720p', bitrate: 1500),
  high(resolution: '1080p', bitrate: 3000),
  ultra(resolution: '4K', bitrate: 8000);
  
  final String resolution;
  final int bitrate; // kbps
  
  const VideoQuality({required this.resolution, required this.bitrate});
}

// Device performance levels
enum DevicePerformance { low, medium, high }

/// Service for adaptive video streaming based on device and network conditions
class AdaptiveStreamingService {
  static final AdaptiveStreamingService _instance = AdaptiveStreamingService._internal();
  factory AdaptiveStreamingService() => _instance;
  AdaptiveStreamingService._internal();

  // Current states
  NetworkQuality _currentNetworkQuality = NetworkQuality.good;
  DevicePerformance _devicePerformance = DevicePerformance.medium;
  VideoQuality _currentVideoQuality = VideoQuality.medium;
  
  // Network monitoring
  final Connectivity _connectivity = Connectivity();
  StreamSubscription<List<ConnectivityResult>>? _connectivitySubscription;
  Timer? _bandwidthTimer;
  
  // Device info
  final DeviceInfoPlugin _deviceInfo = DeviceInfoPlugin();
  int _totalRAM = 4; // GB, default
  int _cpuCores = 4; // default
  
  // Bandwidth tracking
  final List<double> _bandwidthSamples = [];
  static const int _maxSamples = 10;
  
  // Callbacks
  Function(VideoQuality)? onQualityChanged;
  Function(NetworkQuality)? onNetworkQualityChanged;

  /// Initialize the service
  Future<void> initialize() async {
    debugPrint('🎬 Initializing Adaptive Streaming Service');
    
    // Detect device capabilities
    await _detectDeviceCapabilities();
    
    // Start network monitoring
    _startNetworkMonitoring();
    
    // Start bandwidth estimation
    _startBandwidthEstimation();
  }

  /// Detect device capabilities
  Future<void> _detectDeviceCapabilities() async {
    try {
      if (Platform.isAndroid) {
        final androidInfo = await _deviceInfo.androidInfo;
        
        // Estimate performance based on Android version and available info
        final sdkInt = androidInfo.version.sdkInt;
        
        // Simple heuristic based on Android version
        if (sdkInt >= 31) { // Android 12+
          _devicePerformance = DevicePerformance.high;
        } else if (sdkInt >= 26) { // Android 8+
          _devicePerformance = DevicePerformance.medium;
        } else {
          _devicePerformance = DevicePerformance.low;
        }
        
        debugPrint('📱 Android SDK: $sdkInt, Performance: $_devicePerformance');
        
      } else if (Platform.isIOS) {
        final iosInfo = await _deviceInfo.iosInfo;
        
        // Estimate based on device model
        final model = iosInfo.utsname.machine;
        if (model.contains('iPhone13') || model.contains('iPhone14') || model.contains('iPhone15')) {
          _devicePerformance = DevicePerformance.high;
        } else if (model.contains('iPhone11') || model.contains('iPhone12')) {
          _devicePerformance = DevicePerformance.medium;
        } else {
          _devicePerformance = DevicePerformance.low;
        }
        
        debugPrint('📱 iOS Model: $model, Performance: $_devicePerformance');
      }
    } catch (e) {
      debugPrint('❌ Error detecting device capabilities: $e');
    }
  }

  /// Start network monitoring
  void _startNetworkMonitoring() {
    _connectivitySubscription = _connectivity.onConnectivityChanged.listen((results) {
      _updateNetworkQuality(results);
    });
    
    // Get initial connectivity
    _connectivity.checkConnectivity().then((results) => _updateNetworkQuality(results));
  }

  /// Update network quality based on connectivity type
  void _updateNetworkQuality(List<ConnectivityResult> results) {
    NetworkQuality newQuality;
    
    // Take the best connection if multiple are available
    if (results.contains(ConnectivityResult.ethernet) || results.contains(ConnectivityResult.wifi)) {
      newQuality = NetworkQuality.excellent;
    } else if (results.contains(ConnectivityResult.mobile)) {
      newQuality = NetworkQuality.good;
    } else if (results.contains(ConnectivityResult.none) || results.isEmpty) {
      newQuality = NetworkQuality.poor;
    } else {
      newQuality = NetworkQuality.fair;
    }
    
    if (newQuality != _currentNetworkQuality) {
      _currentNetworkQuality = newQuality;
      _updateVideoQuality();
      onNetworkQualityChanged?.call(newQuality);
      debugPrint('📶 Network quality changed to: $newQuality');
    }
  }

  /// Start bandwidth estimation
  void _startBandwidthEstimation() {
    _bandwidthTimer = Timer.periodic(const Duration(seconds: 10), (_) {
      _estimateBandwidth();
    });
  }

  /// Estimate bandwidth by timing small downloads
  Future<void> _estimateBandwidth() async {
    try {
      // In production, this would download a small test file
      // For now, we'll use a simple simulation
      final startTime = DateTime.now();
      
      // Simulate network delay based on current quality
      final delay = switch (_currentNetworkQuality) {
        NetworkQuality.excellent => 50,
        NetworkQuality.good => 150,
        NetworkQuality.fair => 300,
        NetworkQuality.poor => 500,
      };
      
      await Future.delayed(Duration(milliseconds: delay));
      
      final elapsed = DateTime.now().difference(startTime).inMilliseconds;
      final estimatedMbps = (1000 / elapsed) * 8; // Convert to Mbps
      
      _bandwidthSamples.add(estimatedMbps);
      if (_bandwidthSamples.length > _maxSamples) {
        _bandwidthSamples.removeAt(0);
      }
      
      _updateNetworkQualityFromBandwidth();
    } catch (e) {
      debugPrint('❌ Error estimating bandwidth: $e');
    }
  }

  /// Update network quality based on bandwidth samples
  void _updateNetworkQualityFromBandwidth() {
    if (_bandwidthSamples.isEmpty) return;
    
    final avgBandwidth = _bandwidthSamples.reduce((a, b) => a + b) / _bandwidthSamples.length;
    
    NetworkQuality newQuality;
    if (avgBandwidth > 10) {
      newQuality = NetworkQuality.excellent;
    } else if (avgBandwidth > 5) {
      newQuality = NetworkQuality.good;
    } else if (avgBandwidth > 2) {
      newQuality = NetworkQuality.fair;
    } else {
      newQuality = NetworkQuality.poor;
    }
    
    if (newQuality != _currentNetworkQuality) {
      _currentNetworkQuality = newQuality;
      _updateVideoQuality();
      onNetworkQualityChanged?.call(newQuality);
    }
  }

  /// Update video quality based on network and device
  void _updateVideoQuality() {
    VideoQuality newQuality;
    
    // Combine network quality and device performance
    if (_devicePerformance == DevicePerformance.low) {
      // Low-end devices always get low quality
      newQuality = VideoQuality.low;
    } else if (_devicePerformance == DevicePerformance.medium) {
      // Medium devices adjust based on network
      newQuality = switch (_currentNetworkQuality) {
        NetworkQuality.excellent => VideoQuality.high,
        NetworkQuality.good => VideoQuality.medium,
        NetworkQuality.fair => VideoQuality.low,
        NetworkQuality.poor => VideoQuality.low,
      };
    } else {
      // High-end devices get best quality network allows
      newQuality = switch (_currentNetworkQuality) {
        NetworkQuality.excellent => VideoQuality.ultra,
        NetworkQuality.good => VideoQuality.high,
        NetworkQuality.fair => VideoQuality.medium,
        NetworkQuality.poor => VideoQuality.low,
      };
    }
    
    if (newQuality != _currentVideoQuality) {
      _currentVideoQuality = newQuality;
      onQualityChanged?.call(newQuality);
      debugPrint('🎥 Video quality changed to: ${newQuality.resolution} @ ${newQuality.bitrate}kbps');
    }
  }

  /// Get recommended buffer size based on conditions
  int getRecommendedBufferSize() {
    // Base buffer sizes in seconds
    final baseBuffer = switch (_currentNetworkQuality) {
      NetworkQuality.excellent => 10,
      NetworkQuality.good => 15,
      NetworkQuality.fair => 20,
      NetworkQuality.poor => 30,
    };
    
    // Adjust for device performance
    final deviceMultiplier = switch (_devicePerformance) {
      DevicePerformance.high => 1.0,
      DevicePerformance.medium => 0.8,
      DevicePerformance.low => 0.6,
    };
    
    return (baseBuffer * deviceMultiplier).round();
  }
  
  /// Get dynamic buffer strategy based on network conditions
  Map<String, dynamic> getDynamicBufferStrategy() {
    return {
      'initialBuffer': switch (_currentNetworkQuality) {
        NetworkQuality.excellent => 2.0, // 2 seconds
        NetworkQuality.good => 3.0,
        NetworkQuality.fair => 4.0,
        NetworkQuality.poor => 5.0,
      },
      'maxBuffer': switch (_currentNetworkQuality) {
        NetworkQuality.excellent => 30.0, // 30 seconds
        NetworkQuality.good => 25.0,
        NetworkQuality.fair => 20.0,
        NetworkQuality.poor => 15.0,
      },
      'rebufferThreshold': switch (_currentNetworkQuality) {
        NetworkQuality.excellent => 1.0, // 1 second
        NetworkQuality.good => 1.5,
        NetworkQuality.fair => 2.0,
        NetworkQuality.poor => 3.0,
      },
      'aggressivePrefetch': _currentNetworkQuality == NetworkQuality.excellent || 
                           _currentNetworkQuality == NetworkQuality.good,
    };
  }

  /// Get recommended preload count
  int getRecommendedPreloadCount() {
    if (_devicePerformance == DevicePerformance.low) {
      return 2; // Even low devices should preload 2 videos
    }
    
    // More aggressive preloading for better experience
    return switch (_currentNetworkQuality) {
      NetworkQuality.excellent => 5,
      NetworkQuality.good => 4,
      NetworkQuality.fair => 3,
      NetworkQuality.poor => 2,
    };
  }

  /// Should enable caching based on conditions
  Future<bool> shouldEnableCache() async {
    // Always enable on poor networks
    if (_currentNetworkQuality == NetworkQuality.poor) return true;
    
    // Enable on mobile networks to save data
    final results = await _connectivity.checkConnectivity();
    return results.contains(ConnectivityResult.mobile);
  }

  // Getters
  NetworkQuality get networkQuality => _currentNetworkQuality;
  DevicePerformance get devicePerformance => _devicePerformance;
  VideoQuality get videoQuality => _currentVideoQuality;
  double get averageBandwidth => _bandwidthSamples.isEmpty 
      ? 0 
      : _bandwidthSamples.reduce((a, b) => a + b) / _bandwidthSamples.length;

  /// Dispose resources
  void dispose() {
    _connectivitySubscription?.cancel();
    _bandwidthTimer?.cancel();
  }
}