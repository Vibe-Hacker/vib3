/// Feature flags for gradual migration to new architecture
class FeatureFlags {
  static bool _useNewVideoArchitecture = false;
  static bool _useNewAuthArchitecture = false;
  static bool _useNewCreatorArchitecture = false;
  
  // Video feed architecture
  static bool get useNewVideoArchitecture => _useNewVideoArchitecture;
  static void enableNewVideoArchitecture() {
    _useNewVideoArchitecture = true;
    print('✅ New video architecture enabled');
  }
  
  // Auth architecture
  static bool get useNewAuthArchitecture => _useNewAuthArchitecture;
  static void enableNewAuthArchitecture() {
    _useNewAuthArchitecture = true;
    print('✅ New auth architecture enabled');
  }
  
  // Creator architecture
  static bool get useNewCreatorArchitecture => _useNewCreatorArchitecture;
  static void enableNewCreatorArchitecture() {
    _useNewCreatorArchitecture = true;
    print('✅ New creator architecture enabled');
  }
  
  // Enable all new architectures
  static void enableAllNewArchitectures() {
    enableNewVideoArchitecture();
    enableNewAuthArchitecture();
    enableNewCreatorArchitecture();
  }
  
  // Check status
  static void printStatus() {
    print('Feature Flags Status:');
    print('- Video Architecture: ${_useNewVideoArchitecture ? "NEW ✅" : "OLD ❌"}');
    print('- Auth Architecture: ${_useNewAuthArchitecture ? "NEW ✅" : "OLD ❌"}');
    print('- Creator Architecture: ${_useNewCreatorArchitecture ? "NEW ✅" : "OLD ❌"}');
  }
}