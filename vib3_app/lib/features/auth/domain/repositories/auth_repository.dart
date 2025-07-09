import '../entities/user_entity.dart';
import '../entities/auth_token.dart';

/// Authentication repository interface
/// Isolates auth logic from the rest of the app
abstract class AuthRepository {
  // Authentication
  Future<AuthToken?> login(String email, String password);
  Future<AuthToken?> signup(String email, String password, String username);
  Future<void> logout();
  Future<AuthToken?> refreshToken(String refreshToken);
  
  // User management
  Future<UserEntity?> getCurrentUser();
  Future<UserEntity?> updateProfile(Map<String, dynamic> updates);
  Future<bool> changePassword(String oldPassword, String newPassword);
  
  // Token management
  Future<void> saveToken(AuthToken token);
  Future<AuthToken?> getStoredToken();
  Future<void> clearToken();
  
  // Auth state
  Stream<bool> get authStateChanges;
  bool get isAuthenticated;
}