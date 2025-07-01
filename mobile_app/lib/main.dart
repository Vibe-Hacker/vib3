import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'providers/auth_provider.dart';
import 'providers/video_provider.dart';
import 'screens/splash_screen.dart';
import 'screens/login_screen.dart';
import 'screens/home_screen.dart';
import 'screens/camera_screen.dart';
import 'screens/profile_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Set system UI to full screen for TikTok-like experience
  SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
  SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);
  
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
      ],
      child: MaterialApp(
        title: 'VIB3',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          brightness: Brightness.dark,
          primaryColor: const Color(0xFFFF0080),
          scaffoldBackgroundColor: Colors.black,
          colorScheme: const ColorScheme.dark(
            primary: Color(0xFFFF0080),
            secondary: Color(0xFF00F0FF),
          ),
          fontFamily: 'SF Pro Display',
          appBarTheme: const AppBarTheme(
            backgroundColor: Colors.transparent,
            elevation: 0,
            systemOverlayStyle: SystemUiOverlayStyle.light,
          ),
        ),
        home: const SplashScreen(),
        routes: {
          '/login': (context) => const LoginScreen(),
          '/home': (context) => const HomeScreen(),
          '/camera': (context) => const CameraScreen(),
          '/profile': (context) => const ProfileScreen(),
        },
      ),
    );
  }
}