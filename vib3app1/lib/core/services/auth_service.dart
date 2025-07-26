import 'package:flutter/foundation.dart';
import 'api_service.dart';
import 'storage_service.dart';
import '../models/user_model.dart';

class AuthService extends ChangeNotifier {
  final ApiService _apiService;
  final StorageService _storageService;
  
  User? _currentUser;
  bool _isAuthenticated = false;
  bool _isLoading = false;
  
  User? get currentUser => _currentUser;
  bool get isAuthenticated => _isAuthenticated;
  bool get isLoading => _isLoading;
  
  AuthService(this._apiService, this._storageService) {
    _checkAuthStatus();
  }
  
  Future<void> _checkAuthStatus() async {
    final token = await StorageService.getAuthToken();
    if (token != null) {
      await _loadCurrentUser();
    }
  }
  
  Future<void> _loadCurrentUser() async {
    try {
      _setLoading(true);
      
      final response = await _apiService.get<Map<String, dynamic>>(
        '/auth/me',
      );
      
      _currentUser = User.fromJson(response['user']);
      _isAuthenticated = true;
      
      notifyListeners();
    } catch (e) {
      print('Failed to load user: $e');
      await logout();
    } finally {
      _setLoading(false);
    }
  }
  
  Future<void> login({
    required String email,
    required String password,
  }) async {
    try {
      _setLoading(true);
      
      final response = await _apiService.post<Map<String, dynamic>>(
        '/auth/login',
        data: {
          'email': email,
          'password': password,
        },
      );
      
      final token = response['token'] as String;
      final user = User.fromJson(response['user']);
      
      await StorageService.saveAuthToken(token);
      await StorageService.saveUserId(user.id);
      await StorageService.saveUsername(user.username);
      
      _currentUser = user;
      _isAuthenticated = true;
      
      notifyListeners();
    } catch (e) {
      rethrow;
    } finally {
      _setLoading(false);
    }
  }
  
  Future<void> signup({
    required String email,
    required String username,
    required String password,
    String? displayName,
  }) async {
    try {
      _setLoading(true);
      
      final response = await _apiService.post<Map<String, dynamic>>(
        '/auth/signup',
        data: {
          'email': email,
          'username': username,
          'password': password,
          'displayName': displayName ?? username,
        },
      );
      
      final token = response['token'] as String;
      final user = User.fromJson(response['user']);
      
      await StorageService.saveAuthToken(token);
      await StorageService.saveUserId(user.id);
      await StorageService.saveUsername(user.username);
      
      _currentUser = user;
      _isAuthenticated = true;
      
      notifyListeners();
    } catch (e) {
      rethrow;
    } finally {
      _setLoading(false);
    }
  }
  
  Future<void> loginWithGoogle() async {
    try {
      _setLoading(true);
      
      // TODO: Implement Google Sign In
      // 1. Get Google credentials
      // 2. Send to backend
      // 3. Save auth token and user data
      
      throw UnimplementedError('Google login not implemented');
    } catch (e) {
      rethrow;
    } finally {
      _setLoading(false);
    }
  }
  
  Future<void> loginWithApple() async {
    try {
      _setLoading(true);
      
      // TODO: Implement Sign in with Apple
      // 1. Get Apple credentials
      // 2. Send to backend
      // 3. Save auth token and user data
      
      throw UnimplementedError('Apple login not implemented');
    } catch (e) {
      rethrow;
    } finally {
      _setLoading(false);
    }
  }
  
  Future<void> logout() async {
    try {
      _setLoading(true);
      
      // Call logout endpoint
      await _apiService.post('/auth/logout');
    } catch (e) {
      print('Logout error: $e');
    } finally {
      // Clear local data regardless of API call result
      await StorageService.clearAuthData();
      _currentUser = null;
      _isAuthenticated = false;
      _setLoading(false);
      notifyListeners();
    }
  }
  
  Future<void> updateProfile({
    String? displayName,
    String? bio,
    String? profilePicture,
  }) async {
    try {
      _setLoading(true);
      
      final response = await _apiService.put<Map<String, dynamic>>(
        '/users/profile',
        data: {
          if (displayName != null) 'displayName': displayName,
          if (bio != null) 'bio': bio,
          if (profilePicture != null) 'profilePicture': profilePicture,
        },
      );
      
      _currentUser = User.fromJson(response['user']);
      notifyListeners();
    } catch (e) {
      rethrow;
    } finally {
      _setLoading(false);
    }
  }
  
  Future<void> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    try {
      _setLoading(true);
      
      await _apiService.post(
        '/auth/change-password',
        data: {
          'currentPassword': currentPassword,
          'newPassword': newPassword,
        },
      );
    } catch (e) {
      rethrow;
    } finally {
      _setLoading(false);
    }
  }
  
  Future<void> requestPasswordReset(String email) async {
    try {
      _setLoading(true);
      
      await _apiService.post(
        '/auth/forgot-password',
        data: {'email': email},
      );
    } catch (e) {
      rethrow;
    } finally {
      _setLoading(false);
    }
  }
  
  Future<void> resetPassword({
    required String token,
    required String newPassword,
  }) async {
    try {
      _setLoading(true);
      
      await _apiService.post(
        '/auth/reset-password',
        data: {
          'token': token,
          'newPassword': newPassword,
        },
      );
    } catch (e) {
      rethrow;
    } finally {
      _setLoading(false);
    }
  }
  
  Future<void> deleteAccount() async {
    try {
      _setLoading(true);
      
      await _apiService.delete('/users/account');
      await logout();
    } catch (e) {
      rethrow;
    } finally {
      _setLoading(false);
    }
  }
  
  void _setLoading(bool value) {
    _isLoading = value;
    notifyListeners();
  }
}