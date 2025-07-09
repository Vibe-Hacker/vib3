import 'package:flutter/material.dart';
import '../tabbed_video_feed.dart';
import 'isolated_tabbed_feed.dart';

/// Wrapper that allows gradual migration between old and new implementations
class VideoFeedMigrationWrapper extends StatelessWidget {
  final bool isVisible;
  final bool useNewArchitecture;
  
  const VideoFeedMigrationWrapper({
    super.key,
    this.isVisible = true,
    this.useNewArchitecture = false, // Default to old for safety
  });
  
  @override
  Widget build(BuildContext context) {
    // Feature flag to switch between implementations
    if (useNewArchitecture) {
      return IsolatedTabbedFeed(isVisible: isVisible);
    } else {
      return TabbedVideoFeed(isVisible: isVisible);
    }
  }
}

/// Helper to check if new architecture is enabled
class VideoFeedConfig {
  static bool _useNewArchitecture = false;
  
  static bool get useNewArchitecture => _useNewArchitecture;
  
  static void enableNewArchitecture() {
    _useNewArchitecture = true;
    print('✅ New isolated video feed architecture enabled');
  }
  
  static void disableNewArchitecture() {
    _useNewArchitecture = false;
    print('⚠️ Reverted to old video feed architecture');
  }
}