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

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Load environment variables
  await dotenv.load(fileName: ".env");
  
  // Initialize service locator for dependency injection
  await ServiceLocator.init();
  
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

class VIB3App extends StatelessWidget {
  const VIB3App({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => VideoProvider()),
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