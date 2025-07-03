import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user_model.dart';
import '../services/auth_service.dart';

class AuthProvider extends ChangeNotifier {
  User? _currentUser;
  bool _isLoading = false;
  String? _error;
  String? _authToken;

  User? get currentUser => _currentUser;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isAuthenticated => _currentUser != null && _authToken != null;
  String? get authToken => _authToken;

  final AuthService _authService = AuthService();

  AuthProvider() {
    _loadUserFromStorage();
  }

  Future<void> _loadUserFromStorage() async {
    try {
      _isLoading = true;
      notifyListeners();

      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('auth_token');
      
      if (token != null) {
        _authToken = token;
        // We'll implement profile loading later if needed
      }
    } catch (e) {
      print('Error loading user: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> login(String email, String password) async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      final response = await _authService.login(email, password);
      
      if (response['success']) {
        _authToken = response['token'];
        _currentUser = User.fromJson(response['user']);
        
        // Save to storage
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('auth_token', _authToken!);
        
        notifyListeners();
        return true;
      } else {
        _error = response['message'] ?? 'Login failed';
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = 'Network error: $e';
      notifyListeners();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> signup(String username, String email, String password) async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      final response = await _authService.signup(username, email, password);
      
      if (response['success']) {
        _authToken = response['token'];
        _currentUser = User.fromJson(response['user']);
        
        // Save to storage
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('auth_token', _authToken!);
        
        notifyListeners();
        return true;
      } else {
        _error = response['message'] ?? 'Signup failed';
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = 'Network error: $e';
      notifyListeners();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> logout() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('auth_token');
      
      _currentUser = null;
      _authToken = null;
      _error = null;
      
      notifyListeners();
    } catch (e) {
      print('Error during logout: $e');
    }
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}