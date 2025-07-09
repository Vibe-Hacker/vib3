/// Authentication token entity
class AuthToken {
  final String accessToken;
  final String? refreshToken;
  final DateTime expiresAt;
  
  const AuthToken({
    required this.accessToken,
    this.refreshToken,
    required this.expiresAt,
  });
  
  bool get isExpired => DateTime.now().isAfter(expiresAt);
  
  AuthToken copyWith({
    String? accessToken,
    String? refreshToken,
    DateTime? expiresAt,
  }) {
    return AuthToken(
      accessToken: accessToken ?? this.accessToken,
      refreshToken: refreshToken ?? this.refreshToken,
      expiresAt: expiresAt ?? this.expiresAt,
    );
  }
}