import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'api_adapter.dart';
import '../config/app_config.dart';

/// Updated AuthService that supports both monolith and microservices
class AuthServiceV2 {
  static final AuthServiceV2 _instance = AuthServiceV2._internal();
  factory AuthServiceV2() => _instance;
  AuthServiceV2._internal();
  
  final ApiAdapter _api = ApiAdapter();
  String? _authToken;
  String? _refreshToken;
  Map<String, dynamic>? _currentUser;
  
  // Get current user
  Map<String, dynamic>? get currentUser => _currentUser;
  bool get isAuthenticated => _authToken != null;
  String? get authToken => _authToken;
  
  // Initialize service (load saved tokens)
  Future<void> initialize() async {
    final prefs = await SharedPreferences.getInstance();
    _authToken = prefs.getString('auth_token');
    _refreshToken = prefs.getString('refresh_token');
    
    if (_authToken != null) {
      _api.setAuthToken(_authToken);
      // Try to load user profile
      await loadUserProfile();
    }
  }
  
  // Login
  Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      print('🔐 Attempting login for: $email');
      
      final response = await _api.post('login', body: {
        'email': email,
        'password': password,
      });
      
      print('📡 Login response: ${response.statusCode}');
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        
        // Extract tokens and user data
        _authToken = data['token'] ?? data['access_token'];
        _refreshToken = data['refreshToken'] ?? data['refresh_token'];
        _currentUser = data['user'] ?? data['data'];
        
        if (_authToken != null) {
          // Save tokens
          await _saveTokens();
          _api.setAuthToken(_authToken);
          
          return {
            'success': true,
            'message': 'Login successful',
            'user': _currentUser,
          };
        }
      }
      
      // Handle error responses
      final errorData = response.body.isNotEmpty ? json.decode(response.body) : {};
      return {
        'success': false,
        'message': errorData['message'] ?? 'Login failed',
      };
      
    } catch (e) {
      print('❌ Login error: $e');
      
      // If microservices fail, try monolith
      if (ApiAdapter().baseUrl.contains(':4000')) {
        return await _loginWithMonolith(email, password);
      }
      
      return {
        'success': false,
        'message': 'Connection error. Please check your internet.',
      };
    }
  }
  
  // Fallback to monolith login
  Future<Map<String, dynamic>> _loginWithMonolith(String email, String password) async {
    try {
      print('🔄 Falling back to monolith login...');
      
      final response = await http.post(
        Uri.parse('${AppConfig.baseUrl}${AppConfig.loginEndpoint}'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email,
          'password': password,
        }),
      ).timeout(AppConfig.timeout);
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        _authToken = data['token'];
        _currentUser = data['user'];
        
        if (_authToken != null) {
          await _saveTokens();
          _api.setAuthToken(_authToken);
          
          return {
            'success': true,
            'message': 'Login successful',
            'user': _currentUser,
          };
        }
      }
      
      return {
        'success': false,
        'message': 'Login failed',
      };
      
    } catch (e) {
      return {
        'success': false,
        'message': 'Connection error: $e',
      };
    }
  }
  
  // Register
  Future<Map<String, dynamic>> register(String username, String email, String password) async {
    try {
      print('📝 Attempting registration for: $email');
      
      final response = await _api.post('register', body: {
        'username': username,
        'email': email,
        'password': password,
      });
      
      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = json.decode(response.body);
        
        // Auto-login after registration
        if (data['token'] != null) {
          _authToken = data['token'];
          _refreshToken = data['refreshToken'];
          _currentUser = data['user'];
          
          await _saveTokens();
          _api.setAuthToken(_authToken);
          
          return {
            'success': true,
            'message': 'Registration successful',
            'user': _currentUser,
          };
        }
        
        // If no token, user needs to login
        return {
          'success': true,
          'message': 'Registration successful. Please login.',
        };
      }
      
      final errorData = json.decode(response.body);
      return {
        'success': false,
        'message': errorData['message'] ?? 'Registration failed',
      };
      
    } catch (e) {
      print('❌ Registration error: $e');
      return {
        'success': false,
        'message': 'Connection error. Please try again.',
      };
    }
  }
  
  // Logout
  Future<void> logout() async {
    try {
      // Call logout endpoint if available
      await _api.post('logout').catchError((_) {});
      
      // Clear local data
      _authToken = null;
      _refreshToken = null;
      _currentUser = null;
      
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('auth_token');
      await prefs.remove('refresh_token');
      
      _api.setAuthToken(null);
      
    } catch (e) {
      print('❌ Logout error: $e');
    }
  }
  
  // Load user profile
  Future<Map<String, dynamic>?> loadUserProfile() async {
    try {
      final response = await _api.get('profile');
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        _currentUser = data['user'] ?? data['data'] ?? data;
        return _currentUser;
      }
      
      // If profile fails, token might be invalid
      if (response.statusCode == 401) {
        await logout();
      }
      
    } catch (e) {
      print('❌ Load profile error: $e');
    }
    
    return null;
  }
  
  // Refresh token
  Future<bool> refreshToken() async {
    if (_refreshToken == null) return false;
    
    try {
      final response = await _api.post('refresh', body: {
        'refreshToken': _refreshToken,
      });
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        _authToken = data['token'] ?? data['access_token'];
        _refreshToken = data['refreshToken'] ?? data['refresh_token'];
        
        await _saveTokens();
        _api.setAuthToken(_authToken);
        
        return true;
      }
      
    } catch (e) {
      print('❌ Token refresh error: $e');
    }
    
    return false;
  }
  
  // Update profile
  Future<Map<String, dynamic>> updateProfile(Map<String, dynamic> updates) async {
    try {
      final response = await _api.put('updateProfile', body: updates);
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        _currentUser = data['user'] ?? data['data'];
        
        return {
          'success': true,
          'message': 'Profile updated successfully',
          'user': _currentUser,
        };
      }
      
      return {
        'success': false,
        'message': 'Failed to update profile',
      };
      
    } catch (e) {
      return {
        'success': false,
        'message': 'Connection error: $e',
      };
    }
  }
  
  // Change password
  Future<Map<String, dynamic>> changePassword(String oldPassword, String newPassword) async {
    try {
      final response = await _api.post('changePassword', body: {
        'oldPassword': oldPassword,
        'newPassword': newPassword,
      });
      
      if (response.statusCode == 200) {
        return {
          'success': true,
          'message': 'Password changed successfully',
        };
      }
      
      final errorData = json.decode(response.body);
      return {
        'success': false,
        'message': errorData['message'] ?? 'Failed to change password',
      };
      
    } catch (e) {
      return {
        'success': false,
        'message': 'Connection error: $e',
      };
    }
  }
  
  // Save tokens to local storage
  Future<void> _saveTokens() async {
    final prefs = await SharedPreferences.getInstance();
    if (_authToken != null) {
      await prefs.setString('auth_token', _authToken!);
    }
    if (_refreshToken != null) {
      await prefs.setString('refresh_token', _refreshToken!);
    }
  }
  
  // Set server IP dynamically
  void setServerIp(String ip) {
    _api.setServerIp(ip);
  }
}