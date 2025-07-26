import 'package:flutter/foundation.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:sign_in_with_apple/sign_in_with_apple.dart';
import 'package:crypto/crypto.dart';
import 'dart:convert';
import 'dart:math';
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
      
      // Demo login handling
      if (email == 'demo@vib3.com' && password == 'demo123') {
        await loginAsGuest(isDemoAccount: true);
        return;
      }
      
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
      
      // Initialize Google Sign In
      final GoogleSignIn googleSignIn = GoogleSignIn(
        scopes: ['email', 'profile'],
      );
      
      // Trigger sign in flow
      final GoogleSignInAccount? googleUser = await googleSignIn.signIn();
      
      if (googleUser == null) {
        throw Exception('Google sign in cancelled');
      }
      
      // Get auth details
      final GoogleSignInAuthentication googleAuth = await googleUser.authentication;
      
      // For demo, create a user directly
      _currentUser = User(
        id: 'google_${googleUser.id}',
        username: googleUser.email.split('@').first,
        email: googleUser.email,
        displayName: googleUser.displayName ?? googleUser.email.split('@').first,
        bio: '✨ Signed in with Google',
        profilePicture: googleUser.photoUrl ?? 'https://api.dicebear.com/7.x/avataaars/svg?seed=${googleUser.email}',
        followersCount: 0,
        followingCount: 0,
        postsCount: 0,
        isVerified: false,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      
      // Save auth data
      await StorageService.saveAuthToken('google_${googleAuth.idToken ?? DateTime.now().millisecondsSinceEpoch}');
      await StorageService.saveUserId(_currentUser!.id);
      await StorageService.saveUsername(_currentUser!.username);
      
      _isAuthenticated = true;
      
      notifyListeners();
      
      // In production, you would send the Google token to your backend:
      // final response = await _apiService.post('/auth/google', data: {
      //   'idToken': googleAuth.idToken,
      //   'accessToken': googleAuth.accessToken,
      // });
      
    } catch (e) {
      print('Google sign in error: $e');
      rethrow;
    } finally {
      _setLoading(false);
    }
  }
  
  Future<void> loginWithApple() async {
    try {
      _setLoading(true);
      
      // Generate nonce for security
      final rawNonce = _generateNonce();
      final nonce = _sha256ofString(rawNonce);
      
      // Request Apple ID credential
      final credential = await SignInWithApple.getAppleIDCredential(
        scopes: [
          AppleIDAuthorizationScopes.email,
          AppleIDAuthorizationScopes.fullName,
        ],
        nonce: nonce,
      );
      
      // Create user from Apple credential
      _currentUser = User(
        id: 'apple_${credential.userIdentifier}',
        username: credential.email?.split('@').first ?? 'apple_user_${Random().nextInt(9999)}',
        email: credential.email ?? '${credential.userIdentifier}@privaterelay.apple.com',
        displayName: '${credential.givenName ?? ''} ${credential.familyName ?? ''}'.trim().isEmpty
            ? 'Apple User'
            : '${credential.givenName ?? ''} ${credential.familyName ?? ''}'.trim(),
        bio: '🍎 Signed in with Apple',
        profilePicture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=apple_${credential.userIdentifier}',
        followersCount: 0,
        followingCount: 0,
        postsCount: 0,
        isVerified: false,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      
      // Save auth data
      await StorageService.saveAuthToken('apple_${credential.identityToken ?? DateTime.now().millisecondsSinceEpoch}');
      await StorageService.saveUserId(_currentUser!.id);
      await StorageService.saveUsername(_currentUser!.username);
      
      _isAuthenticated = true;
      
      notifyListeners();
      
      // In production, you would verify the Apple token with your backend:
      // final response = await _apiService.post('/auth/apple', data: {
      //   'identityToken': credential.identityToken,
      //   'authorizationCode': credential.authorizationCode,
      //   'userIdentifier': credential.userIdentifier,
      // });
      
    } catch (e) {
      print('Apple sign in error: $e');
      rethrow;
    } finally {
      _setLoading(false);
    }
  }
  
  String _generateNonce([int length = 32]) {
    const charset = '0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._';
    final random = Random.secure();
    return List.generate(length, (_) => charset[random.nextInt(charset.length)]).join();
  }
  
  String _sha256ofString(String input) {
    final bytes = utf8.encode(input);
    final digest = sha256.convert(bytes);
    return digest.toString();
  }
  
  Future<void> loginAsGuest({bool isDemoAccount = false}) async {
    try {
      _setLoading(true);
      
      // Create a mock user for guest/demo access
      _currentUser = User(
        id: isDemoAccount ? 'demo_user_001' : 'guest_${DateTime.now().millisecondsSinceEpoch}',
        username: isDemoAccount ? 'demo_user' : 'guest_user',
        email: isDemoAccount ? 'demo@vib3.com' : 'guest@vib3.com',
        displayName: isDemoAccount ? 'Demo User' : 'Guest User',
        bio: isDemoAccount 
            ? '🎬 Welcome to VIB3! This is a demo account to explore all features.' 
            : '👋 Exploring VIB3 as a guest',
        profilePicture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=${isDemoAccount ? "demo" : "guest"}',
        followersCount: isDemoAccount ? 1234 : 0,
        followingCount: isDemoAccount ? 567 : 0,
        postsCount: isDemoAccount ? 42 : 0,
        isVerified: isDemoAccount,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      
      // Save minimal auth data for guest
      await StorageService.saveAuthToken('guest_token_${DateTime.now().millisecondsSinceEpoch}');
      await StorageService.saveUserId(_currentUser!.id);
      await StorageService.saveUsername(_currentUser!.username);
      
      _isAuthenticated = true;
      
      notifyListeners();
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