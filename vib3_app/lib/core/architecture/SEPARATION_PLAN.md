# VIB3 Architecture Separation Plan

## Current Problems
1. **God Classes**: VideoProvider (1,784 lines), VideoService (1,784 lines)
2. **Tight Coupling**: Changing video feed affects auth, profile, upload, etc.
3. **Mixed Concerns**: Business logic in UI, API calls in widgets
4. **Shared Mutable State**: Multiple features modifying same state

## Proposed Directory Structure

```
lib/
├── core/                      # Shared core functionality
│   ├── di/                   # Dependency injection
│   ├── network/              # API client, interceptors
│   ├── storage/              # Local storage abstractions
│   └── utils/                # Shared utilities
│
├── features/                 # Feature-based modules
│   ├── auth/                # Authentication feature
│   │   ├── data/           # Repository implementations
│   │   ├── domain/         # Business logic, entities
│   │   ├── presentation/   # UI screens, widgets
│   │   └── providers/      # Auth-specific state
│   │
│   ├── video_feed/          # Video feed feature
│   │   ├── data/
│   │   │   ├── repositories/
│   │   │   └── services/
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   └── usecases/
│   │   ├── presentation/
│   │   │   ├── widgets/
│   │   │   ├── screens/
│   │   │   └── providers/
│   │   └── video_feed.dart  # Feature facade
│   │
│   ├── video_creator/       # Video creation feature
│   │   ├── camera/         # Camera functionality
│   │   ├── editor/         # Video editing
│   │   ├── effects/        # Effects & filters
│   │   ├── upload/         # Upload logic
│   │   └── state/          # Creator-specific state
│   │
│   ├── social/              # Social features
│   │   ├── profile/        # User profiles
│   │   ├── messaging/      # Chat/DMs
│   │   ├── relationships/  # Follow/friends
│   │   └── notifications/  # Notifications
│   │
│   └── discovery/           # Search & discovery
│       ├── search/         # Search functionality
│       ├── trending/       # Trending content
│       └── recommendations/# AI recommendations
│
├── shared/                  # Shared UI components
│   ├── widgets/            # Reusable widgets
│   ├── theme/              # App theming
│   └── animations/         # Shared animations
│
└── app/                    # App-level configuration
    ├── navigation/         # Navigation setup
    ├── providers/          # App-wide providers
    └── config/             # App configuration
```

## Key Separations

### 1. **Video Feed Isolation**
```dart
// Before: Everything mixed together
class VideoFeed extends StatefulWidget {
  // 870 lines of mixed concerns
}

// After: Clear separation
features/video_feed/
├── domain/usecases/
│   ├── load_videos_usecase.dart
│   ├── like_video_usecase.dart
│   └── share_video_usecase.dart
├── presentation/
│   ├── widgets/video_player_widget.dart
│   ├── widgets/action_buttons.dart
│   └── screens/video_feed_screen.dart
```

### 2. **Authentication Isolation**
```dart
// Before: Auth logic scattered everywhere
// After: Centralized auth feature
features/auth/
├── domain/
│   ├── entities/user.dart
│   ├── repositories/auth_repository.dart
│   └── usecases/login_usecase.dart
├── data/
│   ├── repositories/auth_repository_impl.dart
│   └── services/auth_api_service.dart
```

### 3. **Video Creator Isolation**
```dart
// Before: All modules tightly coupled
// After: Independent sub-features
features/video_creator/
├── camera/
│   └── camera_controller.dart
├── editor/
│   └── video_editor_controller.dart
├── effects/
│   └── effects_controller.dart
```

## Implementation Steps

### Phase 1: Core Infrastructure (Week 1)
1. Create core directory structure
2. Implement dependency injection
3. Create repository interfaces
4. Set up feature facades

### Phase 2: Video Feed (Week 2)
1. Extract video feed to isolated feature
2. Create video repositories
3. Implement use cases
4. Migrate UI components

### Phase 3: Authentication (Week 3)
1. Centralize auth logic
2. Create auth repository
3. Update all auth dependencies
4. Test auth flows

### Phase 4: Video Creator (Week 4)
1. Separate creator modules
2. Create independent state management
3. Implement module communication
4. Test creator flows

## Benefits

1. **No More Cascading Failures**: Change video feed without breaking auth
2. **Parallel Development**: Teams work on features independently
3. **Better Testing**: Test features in isolation
4. **Clear Dependencies**: Know exactly what depends on what
5. **Easier Maintenance**: Find and fix issues quickly

## Migration Strategy

1. **Create New Structure**: Build alongside existing code
2. **Gradual Migration**: Move one feature at a time
3. **Feature Flags**: Switch between old/new implementations
4. **Maintain Backwards Compatibility**: Keep old code working during migration
5. **Clean Up**: Remove old code after successful migration

## Example: Isolated Video Service

```dart
// Old: 1,784-line god class
class VideoService {
  // Everything mixed together
}

// New: Focused services
class VideoRepository {
  Future<List<Video>> getVideos();
  Future<void> likeVideo(String id);
}

class VideoUploadService {
  Future<String> uploadVideo(File video);
}

class VideoAnalyticsService {
  Future<void> trackView(String videoId);
}
```

This separation ensures that:
- Changing upload logic doesn't affect video playback
- Analytics can be updated without touching core functionality
- Each service has a single responsibility