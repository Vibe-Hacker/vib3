import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../config/app_themes.dart';

class ThemeProvider extends ChangeNotifier {
  VIB3Theme _currentTheme = AppThemes.vib3ClassicTheme;
  
  VIB3Theme get currentTheme => _currentTheme;
  
  ThemeProvider() {
    _loadTheme();
  }

  // Load theme from storage
  Future<void> _loadTheme() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final themeId = prefs.getString('selected_theme') ?? AppThemes.vib3Classic;
      
      // Find theme by ID
      final theme = AppThemes.getAllThemes().firstWhere(
        (theme) => theme.id == themeId,
        orElse: () => AppThemes.vib3ClassicTheme,
      );
      
      _currentTheme = theme;
      notifyListeners();
      print('🎨 Loaded theme: ${_currentTheme.name}');
    } catch (e) {
      print('❌ Error loading theme: $e');
    }
  }

  // Save theme to storage
  Future<void> _saveTheme(String themeId) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('selected_theme', themeId);
      print('💾 Saved theme: $themeId');
    } catch (e) {
      print('❌ Error saving theme: $e');
    }
  }

  // Change theme
  Future<void> changeTheme(VIB3Theme theme) async {
    if (_currentTheme.id != theme.id) {
      _currentTheme = theme;
      await _saveTheme(theme.id);
      notifyListeners();
      print('🎨 Changed theme to: ${theme.name}');
    }
  }

  // Get current theme gradients
  List<Color> getLikeGradient() => _currentTheme.getGradient('like');
  List<Color> getFollowGradient() => _currentTheme.getGradient('follow');
  List<Color> getProfileGradient() => _currentTheme.getGradient('profile');
  List<Color> getCommentGradient() => _currentTheme.getGradient('comment');
  List<Color> getShareGradient() => _currentTheme.getGradient('share');

  // Get theme by ID
  VIB3Theme? getThemeById(String id) {
    try {
      return AppThemes.getAllThemes().firstWhere((theme) => theme.id == id);
    } catch (e) {
      return null;
    }
  }
}