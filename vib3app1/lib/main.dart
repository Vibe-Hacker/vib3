import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'app/routes/app_router.dart';
import 'app/theme/app_theme.dart';
import 'core/services/auth_service.dart';
import 'core/services/api_service.dart';
import 'core/services/storage_service.dart';
import 'core/services/feed_service.dart';
import 'features/video_player/services/video_player_manager.dart';
import 'features/video_player/services/buffer_management_service.dart';
import 'features/video_player/services/video_performance_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Hive for local storage
  await Hive.initFlutter();
  
  // Set preferred orientations
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);
  
  // Initialize services
  final storageService = StorageService();
  await storageService.init();
  
  final apiService = ApiService();
  final authService = AuthService(apiService, storageService);
  final feedService = FeedService(apiService);
  
  // Initialize video player services
  BufferManagementService().initialize();
  await VideoPerformanceService().preWarmDecoder();
  
  runApp(
    MultiProvider(
      providers: [
        Provider<ApiService>.value(value: apiService),
        Provider<StorageService>.value(value: storageService),
        ChangeNotifierProvider<AuthService>.value(value: authService),
        ChangeNotifierProvider<FeedService>.value(value: feedService),
      ],
      child: const VIB3App(),
    ),
  );
}

class VIB3App extends StatefulWidget {
  const VIB3App({super.key});

  @override
  State<VIB3App> createState() => _VIB3AppState();
}

class _VIB3AppState extends State<VIB3App> with WidgetsBindingObserver {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    VideoPlayerManager.instance.disposeAllControllers();
    BufferManagementService().dispose();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    switch (state) {
      case AppLifecycleState.paused:
        VideoPlayerManager.onAppPaused();
        break;
      case AppLifecycleState.resumed:
        VideoPlayerManager.onAppResumed();
        break;
      default:
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'VIB3',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.darkTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.dark,
      routerConfig: AppRouter.router,
    );
  }
}