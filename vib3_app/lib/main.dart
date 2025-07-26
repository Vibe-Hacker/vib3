import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter/foundation.dart';
import 'package:provider/provider.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'providers/auth_provider.dart';
import 'providers/video_provider.dart';
import 'providers/theme_provider.dart';
import 'screens/login_screen.dart';
import 'screens/home_screen.dart';
import 'screens/web_home_screen.dart';
import 'screens/upload_video_screen.dart';
import 'config/app_config.dart';
import 'widgets/video_feed_components/state_manager.dart';
import 'widgets/video_feed_components/migration_wrapper.dart';
import 'core/di/service_locator.dart';
import 'core/config/feature_flags.dart';
import 'features/video_feed/presentation/providers/video_feed_provider.dart';
import 'services/dev_http_overrides.dart';
import 'services/video_player_manager.dart';
import 'services/video_performance_service.dart';
import 'services/buffer_management_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // In development, bypass certificate verification if needed
  // WARNING: Remove this in production!
  if (!kIsWeb && (kDebugMode || kProfileMode)) {
    HttpOverrides.global = DevHttpOverrides();
    print('⚠️ Development mode: SSL certificate verification relaxed');
    print('🕐 Device time: ${DateTime.now()}');
  }
  
  // Reduce shader compilation jank for better performance
  // Note: Paint.enableDithering was removed in newer Flutter versions
  
  // Load environment variables
  await dotenv.load(fileName: ".env");
  
  // Initialize service locator for dependency injection
  await ServiceLocator.init();
  
  // Initialize video services
  try {
    // Initialize buffer management
    BufferManagementService().initialize();
    
    // Pre-warm video decoder for better performance
    await VideoPerformanceService().preWarmDecoder();
  } catch (e) {
    print('⚠️ Failed to initialize video services: $e');
  }
  
  // Set preferred orientations and system UI
  SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);
  
  // Set system UI mode to show all overlays
  SystemChrome.setEnabledSystemUIMode(
    SystemUiMode.manual,
    overlays: SystemUiOverlay.values, // Show all system UI
  );
  
  // Make status bar transparent
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
      systemNavigationBarColor: Colors.black,
      systemNavigationBarIconBrightness: Brightness.light,
    ),
  );
  
  // Disable new architectures - use original working version
  // VideoFeedConfig.enableNewArchitecture();
  // FeatureFlags.enableNewVideoArchitecture();
  
  runApp(const VIB3App());
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
    super.dispose();
  }
  
  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    print('📦 App lifecycle state changed: $state');
    switch (state) {
      case AppLifecycleState.paused:
      case AppLifecycleState.inactive:
      case AppLifecycleState.detached:
        // App going to background
        VideoPlayerManager.onAppPaused();
        break;
      case AppLifecycleState.resumed:
        // App coming to foreground
        VideoPlayerManager.onAppResumed();
        break;
      case AppLifecycleState.hidden:
        // Handle hidden state if needed
        break;
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProxyProvider<AuthProvider, VideoProvider>(
          create: (_) => VideoProvider(),
          update: (_, authProvider, videoProvider) {
            videoProvider?.setAuthProvider(authProvider);
            return videoProvider ?? VideoProvider();
          },
        ),
        ChangeNotifierProvider(create: (_) => ThemeProvider()),
        ChangeNotifierProvider(create: (_) => VideoFeedStateManager()),
        // Add new video feed provider if feature flag is enabled
        if (FeatureFlags.useNewVideoArchitecture)
          ChangeNotifierProvider(create: (_) => VideoFeedProvider()),
      ],
      child: Consumer<ThemeProvider>(
        builder: (context, themeProvider, _) {
          return MaterialApp(
            title: 'VIB3',
            debugShowCheckedModeBanner: false,
            theme: themeProvider.currentTheme.toThemeData(),
            home: Consumer<AuthProvider>(
              builder: (context, authProvider, _) {
                // Always use WebHomeScreen for web platform
                if (kIsWeb) {
                  if (authProvider.isAuthenticated) {
                    return const WebHomeScreen();
                  }
                  return const LoginScreen();
                }
                
                // Mobile authenticated
                if (authProvider.isAuthenticated) {
                  return const HomeScreen();
                }
                
                // Not authenticated - show login
                return const LoginScreen();
              },
            ),
            routes: {
              '/login': (context) => const LoginScreen(),
              '/home': (context) => const HomeScreen(),
              '/web': (context) => const WebHomeScreen(),
            },
            onGenerateRoute: (settings) {
              print('Route requested: ${settings.name} with args: ${settings.arguments}');
              if (settings.name == '/upload') {
                final args = settings.arguments as Map<String, dynamic>?;
                final videoPath = args?['videoPath'] ?? '';
                final musicName = args?['musicName'];
                print('Creating UploadVideoScreen with videoPath: $videoPath, musicName: $musicName');
                return MaterialPageRoute(
                  builder: (context) => UploadVideoScreen(
                    videoPath: videoPath,
                    musicName: musicName,
                  ),
                );
              }
              return null;
            },
          );
        },
      ),
    );
  }
}