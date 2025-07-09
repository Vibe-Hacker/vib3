# Migration Guide: Isolated Components Architecture

## Overview
This guide helps you migrate from the current coupled architecture to the new isolated components architecture that prevents UI components from interfering with each other.

## Benefits of Migration
- ✅ No more breaking navigation when moving buttons
- ✅ Tab changes don't affect other components
- ✅ Each component manages its own state
- ✅ Better performance (only affected parts re-render)
- ✅ Easier to test and debug

## Migration Steps

### 1. Update main.dart
Add the VideoFeedStateManager provider at the app level:

```dart
import 'widgets/video_feed_components/state_manager.dart';

// In your app's build method:
MultiProvider(
  providers: [
    // ... existing providers
    ChangeNotifierProvider(create: (_) => VideoFeedStateManager()),
  ],
  child: MaterialApp(...),
)
```

### 2. Replace TabbedVideoFeed
Replace usage of `TabbedVideoFeed` with `IsolatedTabbedFeed`:

```dart
// Before:
TabbedVideoFeed(isVisible: true)

// After:
IsolatedTabbedFeed(isVisible: true)
```

### 3. Update Navigation
If you have custom navigation, use the NavigationController:

```dart
// Access navigation controller
final navController = context.read<VideoFeedStateManager>().navigation;

// Navigate programmatically
navController.navigateToProfile();
```

### 4. Handle Draggable Buttons
Replace direct Draggable implementations with DraggableActionButtons:

```dart
// Before: Custom draggable implementation
// After:
DraggableActionButtons(
  video: currentVideo,
  isLiked: isLiked,
  // ... other props
)
```

### 5. State Management
Access shared state through VideoFeedStateManager:

```dart
// Get current video index
final currentIndex = context.read<VideoFeedStateManager>().currentVideoIndex;

// Check if dragging
final isDragging = context.watch<VideoFeedStateManager>().isDraggingActions;

// Control video playback
context.read<VideoFeedStateManager>().pauseVideo();
```

## Component Structure

```
lib/widgets/video_feed_components/
├── state_manager.dart           # Central state coordination
├── isolated_tabbed_feed.dart    # Main tabbed feed widget
├── isolated_video_feed.dart     # Video feed implementation
├── actions/
│   └── action_buttons.dart      # Like, comment, share buttons
├── navigation/
│   └── navigation_controller.dart # Navigation state
├── tabs/
│   └── tab_controller_wrapper.dart # Tab state
└── draggable/
    └── draggable_action_buttons.dart # Draggable wrapper
```

## Testing Your Migration

1. **Test Navigation**: Ensure bottom navigation works without affecting other components
2. **Test Tabs**: Switch between tabs and verify videos pause/resume correctly
3. **Test Dragging**: Drag action buttons and ensure navigation still works
4. **Test State**: Verify likes, follows, and other state persist correctly

## Rollback Plan

If you need to rollback:
1. Keep the old components until migration is complete
2. Use feature flags to switch between old and new implementations
3. Test thoroughly in a separate branch before merging

## Common Issues

### Issue: Videos not playing
- Ensure VideoFeedStateManager is provided at the app level
- Check that isVisible prop is passed correctly

### Issue: Buttons not draggable
- Verify DraggableActionButtons is used instead of custom implementation
- Check that gesture handlers are not conflicting

### Issue: State not persisting
- Ensure you're using the state manager for shared state
- Don't create multiple instances of VideoFeedStateManager

## Next Steps

After migration:
1. Remove old components to reduce code duplication
2. Add automated tests for each isolated component
3. Document any custom behaviors in your implementation