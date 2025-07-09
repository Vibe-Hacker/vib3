import 'package:flutter/material.dart';

/// Centralized navigation controller that manages navigation state
/// independently from other UI components
class NavigationController extends ChangeNotifier {
  int _currentIndex = 0;
  bool _isNavigating = false;
  
  int get currentIndex => _currentIndex;
  bool get isNavigating => _isNavigating;
  
  void navigateToIndex(int index) {
    if (_isNavigating || index == _currentIndex) return;
    
    _isNavigating = true;
    _currentIndex = index;
    notifyListeners();
    
    // Reset navigation flag after animation
    Future.delayed(const Duration(milliseconds: 300), () {
      _isNavigating = false;
      notifyListeners();
    });
  }
  
  void navigateToHome() => navigateToIndex(0);
  void navigateToSearch() => navigateToIndex(1);
  void navigateToCreate() => navigateToIndex(2);
  void navigateToNotifications() => navigateToIndex(3);
  void navigateToProfile() => navigateToIndex(4);
}