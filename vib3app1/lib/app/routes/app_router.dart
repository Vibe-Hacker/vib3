import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../core/services/auth_service.dart';
import '../../features/auth/screens/splash_screen.dart';
import '../../features/auth/screens/onboarding_screen.dart';
import '../../features/auth/screens/login_screen.dart';
import '../../features/auth/screens/signup_screen.dart';
import '../../features/feed/screens/main_screen.dart';
import '../../features/feed/screens/home_feed_screen.dart';
import '../../features/reels/screens/reels_screen.dart';
import '../../features/camera/screens/camera_screen.dart';
import '../../features/messages/screens/messages_screen.dart';
import '../../features/profile/screens/profile_screen.dart';
import '../../features/search/screens/search_screen.dart';
import '../../features/vibe/screens/vibe_meter_screen.dart';
import '../../features/time_capsule/screens/time_capsule_screen.dart';
import '../../features/collab/screens/collab_room_screen.dart';

class AppRouter {
  static final GoRouter router = GoRouter(
    initialLocation: '/splash',
    debugLogDiagnostics: true,
    refreshListenable: null, // Will be set up with auth service
    redirect: (context, state) {
      final authService = context.read<AuthService>();
      final isAuthenticated = authService.isAuthenticated;
      final isAuthRoute = state.matchedLocation.startsWith('/auth');
      
      // If not authenticated and not on auth route, redirect to login
      if (!isAuthenticated && !isAuthRoute && state.matchedLocation != '/splash') {
        return '/auth/login';
      }
      
      // If authenticated and on auth route, redirect to home
      if (isAuthenticated && isAuthRoute) {
        return '/home';
      }
      
      return null;
    },
    routes: [
      // Splash Screen
      GoRoute(
        path: '/splash',
        builder: (context, state) => const SplashScreen(),
      ),
      
      // Auth Routes
      GoRoute(
        path: '/auth',
        redirect: (context, state) => '/auth/login',
        routes: [
          GoRoute(
            path: 'onboarding',
            builder: (context, state) => const OnboardingScreen(),
          ),
          GoRoute(
            path: 'login',
            builder: (context, state) => const LoginScreen(),
          ),
          GoRoute(
            path: 'signup',
            builder: (context, state) => const SignupScreen(),
          ),
        ],
      ),
      
      // Main App Routes with Bottom Navigation
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) {
          return MainScreen(navigationShell: navigationShell);
        },
        branches: [
          // Home Feed
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/home',
                builder: (context, state) => const HomeFeedScreen(),
              ),
            ],
          ),
          
          // Search/Discover
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/search',
                builder: (context, state) => const SearchScreen(),
              ),
            ],
          ),
          
          // Camera
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/camera',
                builder: (context, state) => const CameraScreen(),
              ),
            ],
          ),
          
          // Collab Rooms (replacing Reels in nav)
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/collab',
                builder: (context, state) => const CollabRoomScreen(),
              ),
            ],
          ),
          
          // Profile
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/profile',
                builder: (context, state) => const ProfileScreen(),
                routes: [
                  GoRoute(
                    path: ':userId',
                    builder: (context, state) {
                      final userId = state.pathParameters['userId']!;
                      return ProfileScreen(userId: userId);
                    },
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
      
      // Messages (Full Screen)
      GoRoute(
        path: '/messages',
        builder: (context, state) => const MessagesScreen(),
        routes: [
          GoRoute(
            path: 'chat/:chatId',
            builder: (context, state) {
              final chatId = state.pathParameters['chatId']!;
              return MessagesScreen(chatId: chatId);
            },
          ),
        ],
      ),
      
      // VIB3 Unique Features
      GoRoute(
        path: '/vibe-meter',
        builder: (context, state) => const VibeMeterScreen(),
      ),
      GoRoute(
        path: '/time-capsule',
        builder: (context, state) => const TimeCapsuleScreen(),
      ),
      GoRoute(
        path: '/collab-rooms',
        builder: (context, state) => const CollabRoomScreen(),
      ),
      GoRoute(
        path: '/reels',
        builder: (context, state) => const ReelsScreen(),
      ),
      
      // Stories
      GoRoute(
        path: '/stories/:userId',
        builder: (context, state) {
          final userId = state.pathParameters['userId']!;
          return Container(); // TODO: Implement StoriesScreen
        },
      ),
      
      // Post Details
      GoRoute(
        path: '/post/:postId',
        builder: (context, state) {
          final postId = state.pathParameters['postId']!;
          return Container(); // TODO: Implement PostDetailsScreen
        },
      ),
      
      // Settings
      GoRoute(
        path: '/settings',
        builder: (context, state) => Container(), // TODO: Implement SettingsScreen
        routes: [
          GoRoute(
            path: 'privacy',
            builder: (context, state) => Container(), // TODO: Implement PrivacyScreen
          ),
          GoRoute(
            path: 'notifications',
            builder: (context, state) => Container(), // TODO: Implement NotificationsSettingsScreen
          ),
          GoRoute(
            path: 'account',
            builder: (context, state) => Container(), // TODO: Implement AccountSettingsScreen
          ),
        ],
      ),
    ],
    
    // Error handling
    errorBuilder: (context, state) => Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.error_outline,
              size: 64,
              color: Colors.red,
            ),
            const SizedBox(height: 16),
            Text(
              'Page not found',
              style: Theme.of(context).textTheme.headlineMedium,
            ),
            const SizedBox(height: 8),
            Text(
              state.error?.toString() ?? 'Unknown error',
              style: Theme.of(context).textTheme.bodyMedium,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () => context.go('/home'),
              child: const Text('Go Home'),
            ),
          ],
        ),
      ),
    ),
  );
}