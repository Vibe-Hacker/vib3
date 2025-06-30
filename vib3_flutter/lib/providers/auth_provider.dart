import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_service.dart';

class AuthProvider extends ChangeNotifier {
  String? _userId;
  String? _username;
  String? _token;
  bool _isAuthenticated = false;

  String? get userId => _userId;
  String? get username => _username;
  String? get token => _token;
  bool get isAuthenticated => _isAuthenticated;

  final ApiService _apiService = ApiService();

  AuthProvider() {
    _loadAuthState();
  }

  Future<void> _loadAuthState() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('auth_token');
    _userId = prefs.getString('user_id');
    _username = prefs.getString('username');
    _isAuthenticated = _token != null;
    
    if (_isAuthenticated) {
      _apiService.setAuthToken(_token!);
    }
    
    notifyListeners();
  }

  Future<void> logout() async {
    _token = null;
    _userId = null;
    _username = null;
    _isAuthenticated = false;

    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
    await prefs.remove('user_id');
    await prefs.remove('username');

    _apiService.clearAuthToken();
    
    notifyListeners();
  }
}