import 'package:flutter/material.dart';

/// Wrapper for tab controller that isolates tab state from other components
class TabControllerWrapper extends ChangeNotifier {
  late TabController _tabController;
  int _currentTab = 0;
  bool _isChangingTab = false;
  
  TabController get tabController => _tabController;
  int get currentTab => _currentTab;
  bool get isChangingTab => _isChangingTab;
  
  void initialize(TickerProvider vsync, int length) {
    _tabController = TabController(length: length, vsync: vsync);
    _tabController.addListener(_handleTabChange);
  }
  
  void _handleTabChange() {
    if (_tabController.indexIsChanging) {
      _isChangingTab = true;
      notifyListeners();
    } else if (_tabController.index != _currentTab) {
      _currentTab = _tabController.index;
      _isChangingTab = false;
      notifyListeners();
    }
  }
  
  void animateToTab(int index) {
    if (index != _currentTab && !_isChangingTab) {
      _tabController.animateTo(index);
    }
  }
  
  @override
  void dispose() {
    _tabController.removeListener(_handleTabChange);
    _tabController.dispose();
    super.dispose();
  }
}