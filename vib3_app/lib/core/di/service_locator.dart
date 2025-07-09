import 'package:get_it/get_it.dart';
import '../../features/video_feed/domain/repositories/video_repository.dart';
import '../../features/auth/domain/repositories/auth_repository.dart';

/// Service locator for dependency injection
/// This prevents tight coupling between features
class ServiceLocator {
  static final GetIt _getIt = GetIt.instance;
  
  static void init() {
    // Core services
    _registerCoreServices();
    
    // Feature repositories
    _registerRepositories();
    
    // Use cases
    _registerUseCases();
    
    // Controllers/Providers
    _registerControllers();
  }
  
  static void _registerCoreServices() {
    // API client, storage, etc.
  }
  
  static void _registerRepositories() {
    // Video repository
    _getIt.registerLazySingleton<VideoRepository>(
      () => throw UnimplementedError('Add VideoRepositoryImpl'),
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