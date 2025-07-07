import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter/foundation.dart';
import 'package:provider/provider.dart';
import 'providers/auth_provider.dart';
import 'providers/video_provider.dart';
import 'providers/theme_provider.dart';
import 'screens/login_screen.dart';
import 'screens/home_screen.dart';
import 'screens/web_home_screen.dart';
import 'config/app_config.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  
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
          );
        },
      ),
    );
  }
}