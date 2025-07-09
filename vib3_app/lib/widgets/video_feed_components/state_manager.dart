import 'package:flutter/material.dart';
import 'navigation/navigation_controller.dart';
import 'tabs/tab_controller_wrapper.dart';

/// Central state manager that ensures components don't interfere with each other
class VideoFeedStateManager extends ChangeNotifier {
  final NavigationController navigation = NavigationController();
  final TabControllerWrapper tabs = TabControllerWrapper();
  
  // Action button positions (isolated from navigation)
  final Map<String, Offset> actionButtonPositions = {};
  bool _isDraggingActions = false;
  
  // Video playback state (isolated from UI interactions)
  bool _isVideoPlaying = true;
  int _currentVideoIndex = 0;
  
  bool get isDraggingActions => _isDraggingActions;
  bool get isVideoPlaying => _isVideoPlaying;
  int get currentVideoIndex => _currentVideoIndex;
  
  VideoFeedStateManager() {
    // Listen to navigation changes
    navigation.addListener(_onNavigationChanged);
    tabs.addListener(_onTabChanged);
  }
  
  void _onNavigationChanged() {
    // Navigation changes don't affect action buttons or tabs
    print('Navigation changed to: ${navigation.currentIndex}');
  }
  
  void _onTabChanged() {
    // Tab changes don't affect navigation or action buttons
    print('Tab changed to: ${tabs.currentTab}');
    
    // Only pause video when actually changing tabs
    if (tabs.isChangingTab) {
      pauseVideo();
    } else {
      resumeVideo();
    }
  }
  
  void setDraggingActions(bool isDragging) {
    _isDraggingActions = isDragging;
    notifyListeners();
  }
  
  void updateActionButtonPosition(String buttonId, Offset position) {
    actionButtonPositions[buttonId] = position;
    notifyListeners();
  }
  
  void setCurrentVideoIndex(int index) {
    if (_currentVideoIndex != index) {
      _currentVideoIndex = index;
      notifyListeners();
    }
  }
  
  void pauseVideo() {
    _isVideoPlaying = false;
    notifyListeners();
  }
  
  void resumeVideo() {
    _isVideoPlaying = true;
    notifyListeners();
  }
  
  void toggleVideoPlayback() {
    _isVideoPlaying = !_isVideoPlaying;
    notifyListeners();
  }
  
  @override
  void dispose() {
    navigation.removeListener(_onNavigationChanged);
    navigation.dispose();
    tabs.removeListener(_onTabChanged);
    tabs.dispose();
    super.dispose();
  }
}