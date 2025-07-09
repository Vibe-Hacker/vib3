import 'package:get_it/get_it.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:http/http.dart' as http;
import '../../features/video_feed/domain/repositories/video_repository.dart';
import '../../features/video_feed/data/repositories/video_repository_impl.dart';
import '../../features/video_feed/data/datasources/video_remote_datasource.dart';
import '../../features/video_feed/data/datasources/video_local_datasource.dart';
import '../../features/auth/domain/repositories/auth_repository.dart';
import '../../services/auth_service.dart';

/// Service locator for dependency injection
/// This prevents tight coupling between features
class ServiceLocator {
  static final GetIt _getIt = GetIt.instance;
  
  static Future<void> init() async {
    // Core services
    await _registerCoreServices();
    
    // Data sources
    _registerDataSources();
    
    // Feature repositories
    _registerRepositories();
    
    // Use cases
    _registerUseCases();
    
    // Controllers/Providers
    _registerControllers();
  }
  
  static Future<void> _registerCoreServices() async {
    // SharedPreferences
    final sharedPreferences = await SharedPreferences.getInstance();
    _getIt.registerSingleton<SharedPreferences>(sharedPreferences);
    
    // HTTP Client
    _getIt.registerLazySingleton<http.Client>(() => http.Client());
    
    // Auth Service
    _getIt.registerLazySingleton<AuthService>(() => AuthService());
  }
  
  static void _registerDataSources() {
    // Video data sources
    _getIt.registerLazySingleton<VideoRemoteDataSource>(
      () => VideoRemoteDataSourceImpl(
        httpClient: _getIt<http.Client>(),
        authService: _getIt<AuthService>(),
      ),
    );
    
    _getIt.registerLazySingleton<VideoLocalDataSource>(
      () => VideoLocalDataSourceImpl(
        prefs: _getIt<SharedPreferences>(),
      ),
    );
  }
  
  static void _registerRepositories() {
    // Video repository
    _getIt.registerLazySingleton<VideoRepository>(
      () => VideoRepositoryImpl(
        remoteDataSource: _getIt<VideoRemoteDataSource>(),
        localDataSource: _getIt<VideoLocalDataSource>(),
      ),
    );
    
    // Auth repository
    _getIt.registerLazySingleton<AuthRepository>(
      () => throw UnimplementedError('Add AuthRepositoryImpl'),
    );
  }
  
  static void _registerUseCases() {
    // Register use cases here
  }
  
  static void _registerControllers() {
    // Register controllers/providers here
  }
  
  // Getters for easy access
  static T get<T extends Object>() => _getIt<T>();
  
  // Check if registered
  static bool isRegistered<T extends Object>() => _getIt.isRegistered<T>();
  
  // Reset for testing
  static Future<void> reset() => _getIt.reset();
}