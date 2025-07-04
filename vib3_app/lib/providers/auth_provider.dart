import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user_model.dart';
import '../services/auth_service.dart';

class AuthProvider extends ChangeNotifier {
  User? _currentUser;
  bool _isLoading = false;
  String? _error;
  String? _authToken;
  DateTime? _tokenExpiry;

  User? get currentUser => _currentUser;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isAuthenticated => _currentUser != null && _authToken != null && !_isTokenExpired();
  String? get authToken {
    if (_isTokenExpired()) {
      print('🔑 Token expired, attempting refresh...');
      _attemptTokenRefresh();
      return null;
    }
    return _authToken;
  }

  bool _isTokenExpired() {
    if (_tokenExpiry == null || _authToken == null) return true;
    return DateTime.now().isAfter(_tokenExpiry!);
  }

  final AuthService _authService = AuthService();

  AuthProvider() {
    _loadUserFromStorage();
  }

  Future<void> _attemptTokenRefresh() async {
    try {
      // Try to refresh using stored credentials or use fallback session
      print('🔄 Attempting token refresh...');
      
      // For now, extend the current token's life since server uses session-based auth
      if (_authToken != null) {
        _tokenExpiry = DateTime.now().add(const Duration(hours: 24));
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('token_expiry', _tokenExpiry!.toIso8601String());
        print('✅ Token refreshed - valid until ${_tokenExpiry!}');
        notifyListeners();
      }
    } catch (e) {
      print('❌ Token refresh failed: $e');
      // Token refresh failed, user needs to login again
      await logout();
    }
  }

  Future<void> _loadUserFromStorage() async {
    try {
      _isLoading = true;
      notifyListeners();

      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('auth_token');
      final userDataJson = prefs.getString('user_data');
      
      if (token != null && userDataJson != null) {
        // SECURITY: Validate authentication source before restoring
        final authSource = prefs.getString('auth_source') ?? 'unknown';
        if (authSource != 'app_login' && authSource != 'app_signup') {
          print('AuthProvider: SECURITY - Clearing invalid auth source: $authSource');
          await _clearStoredAuth();
          return;
        }
        
        _authToken = token;
        
        // Load token expiry
        final tokenExpiryString = prefs.getString('token_expiry');
        if (tokenExpiryString != null) {
          _tokenExpiry = DateTime.parse(tokenExpiryString);
        } else {
          // If no expiry stored, set a reasonable default (24 hours from now)
          _tokenExpiry = DateTime.now().add(const Duration(hours: 24));
        }
        
        // Parse and restore user data
        try {
          final userData = User.fromJson({
            'id': prefs.getString('user_id') ?? '',
            'username': prefs.getString('user_username') ?? '',
            'email': prefs.getString('user_email') ?? '',
            'displayName': prefs.getString('user_displayName'),
            'bio': prefs.getString('user_bio'),
            'profilePicture': prefs.getString('user_profilePicture'),
            'followers': prefs.getInt('user_followers') ?? 0,
            'following': prefs.getInt('user_following') ?? 0,
            'totalLikes': prefs.getInt('user_totalLikes') ?? 0,
            'createdAt': prefs.getString('user_createdAt') ?? DateTime.now().toIso8601String(),
          });
          _currentUser = userData;
          print('AuthProvider: Restored user from storage - ${userData.username} (source: $authSource)');
        } catch (e) {
          print('AuthProvider: Error parsing stored user data: $e');
          // Clear corrupted data
          await _clearStoredAuth();
        }
      } else {
        print('AuthProvider: No stored authentication found');
      }
    } catch (e) {
      print('AuthProvider: Error loading user from storage: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> _saveUserToStorage(String token, User user, {String source = 'app_login'}) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('auth_token', token);
      await prefs.setString('user_data', 'stored'); // Flag for data presence
      await prefs.setString('auth_source', source); // SECURITY: Track authentication source
      await prefs.setString('user_id', user.id);
      await prefs.setString('user_username', user.username);
      await prefs.setString('user_email', user.email);
      if (user.displayName != null) await prefs.setString('user_displayName', user.displayName!);
      if (user.bio != null) await prefs.setString('user_bio', user.bio!);
      if (user.profilePicture != null) await prefs.setString('user_profilePicture', user.profilePicture!);
      await prefs.setInt('user_followers', user.followers);
      await prefs.setInt('user_following', user.following);
      await prefs.setInt('user_totalLikes', user.totalLikes);
      await prefs.setString('user_createdAt', user.createdAt.toIso8601String());
      
      // Save token expiry
      if (_tokenExpiry != null) {
        await prefs.setString('token_expiry', _tokenExpiry!.toIso8601String());
      }
      
      print('AuthProvider: User data saved to storage - ${user.username} (source: $source)');
    } catch (e) {
      print('AuthProvider: Error saving user to storage: $e');
    }
  }

  Future<void> _clearStoredAuth() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('auth_token');
      await prefs.remove('user_data');
      await prefs.remove('auth_source');
      await prefs.remove('user_id');
      await prefs.remove('user_username');
      await prefs.remove('user_email');
      await prefs.remove('user_displayName');
      await prefs.remove('user_bio');
      await prefs.remove('user_profilePicture');
      await prefs.remove('user_followers');
      await prefs.remove('user_following');
      await prefs.remove('user_totalLikes');
      await prefs.remove('user_createdAt');
      
      print('AuthProvider: Cleared stored authentication data');
    } catch (e) {
      print('AuthProvider: Error clearing stored auth: $e');
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
        
        // Set token expiry (24 hours from now)
        _tokenExpiry = DateTime.now().add(const Duration(hours: 24));
        
        // Save to persistent storage with secure source tracking
        await _saveUserToStorage(_authToken!, _currentUser!, source: 'app_login');
        
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
        
        // Set token expiry (24 hours from now)
        _tokenExpiry = DateTime.now().add(const Duration(hours: 24));
        
        // Save to persistent storage with secure source tracking
        await _saveUserToStorage(_authToken!, _currentUser!, source: 'app_signup');
        
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
      _isLoading = true;
      notifyListeners();

      // Clear user data
      _currentUser = null;
      _authToken = null;
      _error = null;

      // Clear persistent storage
      await _clearStoredAuth();

      print('AuthProvider: User logged out successfully');
      
      notifyListeners();
    } catch (e) {
      print('AuthProvider: Error during logout: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Method to check if stored token is still valid
  Future<bool> validateStoredToken() async {
    if (_authToken == null) return false;
    
    try {
      // You can add server validation here if needed
      // For now, we'll assume stored tokens are valid
      return true;
    } catch (e) {
      print('AuthProvider: Token validation failed: $e');
      await _clearStoredAuth();
      _currentUser = null;
      _authToken = null;
      notifyListeners();
      return false;
    }
  }

  // Security: Handle shared links without compromising authentication
  Future<void> handleSharedLink(String sharedUrl) async {
    try {
      print('AuthProvider: Processing shared link securely - $sharedUrl');
      
      // Parse the shared URL to extract content ID (video, profile, etc.)
      final uri = Uri.parse(sharedUrl);
      final pathSegments = uri.pathSegments;
      
      if (pathSegments.isEmpty) return;
      
      // SECURITY: Never extract or use authentication tokens from shared links
      // Shared links should ONLY contain public content identifiers
      
      // Example URL patterns (secure):
      // https://vib3.com/video/12345 ✅ (video ID only)
      // https://vib3.com/user/username ✅ (username only) 
      // https://vib3.com/auth/token123 ❌ (NEVER allow)
      
      if (pathSegments.contains('auth') || pathSegments.contains('token') || pathSegments.contains('login')) {
        print('AuthProvider: SECURITY ALERT - Rejected malicious link containing auth data');
        return;
      }
      
      // Process legitimate content sharing
      if (pathSegments[0] == 'video' && pathSegments.length > 1) {
        final videoId = pathSegments[1];
        print('AuthProvider: Navigating to shared video: $videoId');
        // Navigate to video with current user's authentication
      } else if (pathSegments[0] == 'user' && pathSegments.length > 1) {
        final username = pathSegments[1];
        print('AuthProvider: Navigating to shared profile: $username');
        // Navigate to profile with current user's authentication
      }
      
    } catch (e) {
      print('AuthProvider: Error processing shared link: $e');
    }
  }

  // Security: Validate that authentication is from legitimate sources only
  Future<bool> _validateAuthenticationSource() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final authSource = prefs.getString('auth_source') ?? 'app_login';
      
      // Only allow authentication from the app itself, never from external links
      if (authSource != 'app_login' && authSource != 'app_signup') {
        print('AuthProvider: SECURITY - Invalid authentication source: $authSource');
        await _clearStoredAuth();
        return false;
      }
      
      return true;
    } catch (e) {
      print('AuthProvider: Error validating auth source: $e');
      return false;
    }
  }


  void clearError() {
    _error = null;
    notifyListeners();
  }
}