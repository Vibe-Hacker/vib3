import 'package:shared_preferences/shared_preferences.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'dart:convert';
import '../../app/constants/app_constants.dart';

class StorageService {
  static late SharedPreferences _prefs;
  static late Box _secureBox;
  static late Box _cacheBox;
  
  Future<void> init() async {
    _prefs = await SharedPreferences.getInstance();
    
    // Initialize Hive boxes
    _secureBox = await Hive.openBox('secure_storage');
    _cacheBox = await Hive.openBox('cache_storage');
  }
  
  // Auth Storage
  static Future<void> saveAuthToken(String token) async {
    await _prefs.setString(AppConstants.authTokenKey, token);
    await _secureBox.put(AppConstants.authTokenKey, token);
  }
  
  static Future<String?> getAuthToken() async {
    return _prefs.getString(AppConstants.authTokenKey);
  }
  
  static Future<void> saveUserId(String userId) async {
    await _prefs.setString(AppConstants.userIdKey, userId);
  }
  
  static Future<String?> getUserId() async {
    return _prefs.getString(AppConstants.userIdKey);
  }
  
  static Future<void> saveUsername(String username) async {
    await _prefs.setString(AppConstants.usernameKey, username);
  }
  
  static Future<String?> getUsername() async {
    return _prefs.getString(AppConstants.usernameKey);
  }
  
  static Future<void> clearAuthData() async {
    await _prefs.remove(AppConstants.authTokenKey);
    await _prefs.remove(AppConstants.userIdKey);
    await _prefs.remove(AppConstants.usernameKey);
    await _secureBox.delete(AppConstants.authTokenKey);
  }
  
  // User Preferences
  static Future<void> setThemeMode(String mode) async {
    await _prefs.setString(AppConstants.themeKey, mode);
  }
  
  static String getThemeMode() {
    return _prefs.getString(AppConstants.themeKey) ?? 'dark';
  }
  
  static Future<void> setOnboardingComplete(bool complete) async {
    await _prefs.setBool(AppConstants.onboardingKey, complete);
  }
  
  static bool isOnboardingComplete() {
    return _prefs.getBool(AppConstants.onboardingKey) ?? false;
  }
  
  static Future<void> setNotificationsEnabled(bool enabled) async {
    await _prefs.setBool(AppConstants.notificationKey, enabled);
  }
  
  static bool areNotificationsEnabled() {
    return _prefs.getBool(AppConstants.notificationKey) ?? true;
  }
  
  // Cache Management
  static Future<void> cacheData(String key, dynamic data) async {
    final jsonData = json.encode(data);
    await _cacheBox.put(key, jsonData);
    await _cacheBox.put('${key}_timestamp', DateTime.now().millisecondsSinceEpoch);
  }
  
  static Future<T?> getCachedData<T>(String key, {Duration? maxAge}) async {
    if (!_cacheBox.containsKey(key)) return null;
    
    if (maxAge != null) {
      final timestamp = _cacheBox.get('${key}_timestamp') as int?;
      if (timestamp != null) {
        final age = DateTime.now().millisecondsSinceEpoch - timestamp;
        if (age > maxAge.inMilliseconds) {
          await _cacheBox.delete(key);
          await _cacheBox.delete('${key}_timestamp');
          return null;
        }
      }
    }
    
    final jsonData = _cacheBox.get(key) as String;
    return json.decode(jsonData) as T;
  }
  
  static Future<void> clearCache() async {
    await _cacheBox.clear();
  }
  
  // Recent Searches
  static Future<void> addRecentSearch(String query) async {
    List<String> searches = await getRecentSearches();
    
    // Remove if already exists
    searches.remove(query);
    
    // Add to beginning
    searches.insert(0, query);
    
    // Keep only last N searches
    if (searches.length > AppConstants.maxRecentSearches) {
      searches = searches.sublist(0, AppConstants.maxRecentSearches);
    }
    
    await _prefs.setStringList('recent_searches', searches);
  }
  
  static Future<List<String>> getRecentSearches() async {
    return _prefs.getStringList('recent_searches') ?? [];
  }
  
  static Future<void> clearRecentSearches() async {
    await _prefs.remove('recent_searches');
  }
  
  // Draft Storage
  static Future<void> saveDraft(String type, Map<String, dynamic> draft) async {
    final key = 'draft_$type';
    await cacheData(key, draft);
  }
  
  static Future<Map<String, dynamic>?> getDraft(String type) async {
    final key = 'draft_$type';
    return await getCachedData<Map<String, dynamic>>(key);
  }
  
  static Future<void> deleteDraft(String type) async {
    final key = 'draft_$type';
    await _cacheBox.delete(key);
  }
  
  // User Settings
  static Future<void> saveUserSettings(Map<String, dynamic> settings) async {
    await _secureBox.put('user_settings', json.encode(settings));
  }
  
  static Future<Map<String, dynamic>?> getUserSettings() async {
    final data = _secureBox.get('user_settings') as String?;
    if (data != null) {
      return json.decode(data) as Map<String, dynamic>;
    }
    return null;
  }
  
  // Generic Storage
  static Future<void> setString(String key, String value) async {
    await _prefs.setString(key, value);
  }
  
  static String? getString(String key) {
    return _prefs.getString(key);
  }
  
  static Future<void> setBool(String key, bool value) async {
    await _prefs.setBool(key, value);
  }
  
  static bool? getBool(String key) {
    return _prefs.getBool(key);
  }
  
  static Future<void> setInt(String key, int value) async {
    await _prefs.setInt(key, value);
  }
  
  static int? getInt(String key) {
    return _prefs.getInt(key);
  }
  
  static Future<void> setDouble(String key, double value) async {
    await _prefs.setDouble(key, value);
  }
  
  static double? getDouble(String key) {
    return _prefs.getDouble(key);
  }
  
  static Future<void> setStringList(String key, List<String> value) async {
    await _prefs.setStringList(key, value);
  }
  
  static List<String>? getStringList(String key) {
    return _prefs.getStringList(key);
  }
  
  // Clear all data
  static Future<void> clearAll() async {
    await _prefs.clear();
    await _secureBox.clear();
    await _cacheBox.clear();
  }
}