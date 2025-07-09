# VIB3 Dependency Update Guide

## Current Outdated Dependencies

### Direct Dependencies that need updating:
1. **audioplayers**: 5.2.1 → 6.5.0
2. **camera**: 0.10.6 → 0.11.2
3. **permission_handler**: 11.4.0 → 12.0.1

### Dev Dependencies:
1. **flutter_lints**: 5.0.0 → 6.0.0

## Update Commands

### Option 1: Safe Update (Recommended)
This updates within the constraints of your pubspec.yaml:
```bash
flutter pub upgrade
```

### Option 2: Major Version Update
This updates to the latest versions, including major version changes:
```bash
flutter pub upgrade --major-versions
```

### Option 3: Manual Update (Most Control)
Edit pubspec.yaml manually and then run:
```bash
flutter pub get
```

## Manual Update for pubspec.yaml

Replace these lines in your pubspec.yaml:

```yaml
dependencies:
  # Update these:
  audioplayers: ^6.5.0  # was ^5.2.1
  camera: ^0.11.2       # was ^0.10.5+7
  permission_handler: ^12.0.1  # was ^11.2.0

dev_dependencies:
  # Update this:
  flutter_lints: ^6.0.0  # was ^5.0.0
```

## Breaking Changes to Watch For

### audioplayers 5.x → 6.x
- Audio source APIs might have changed
- Check player initialization and disposal
- Review volume control methods

### camera 0.10.x → 0.11.x
- Camera initialization might have changed
- Check camera controller lifecycle
- Review image capture methods

### permission_handler 11.x → 12.x
- Permission request APIs might have changed
- Check permission status handling

## Steps to Update Safely

1. **Backup your code**:
   ```bash
   git add -A
   git commit -m "Backup before dependency update"
   ```

2. **Update dependencies**:
   ```bash
   flutter pub upgrade --major-versions
   ```

3. **Test thoroughly**:
   - Test video recording
   - Test audio playback
   - Test permission requests
   - Test all camera features

4. **Fix any breaking changes**:
   - Check error messages
   - Update deprecated APIs
   - Test on both Android and iOS

5. **Clean and rebuild**:
   ```bash
   flutter clean
   flutter pub get
   flutter run
   ```

## Common Issues After Update

1. **Gradle/Android build issues**:
   ```bash
   cd android
   ./gradlew clean
   cd ..
   flutter clean
   flutter pub get
   ```

2. **iOS/CocoaPods issues**:
   ```bash
   cd ios
   pod install --repo-update
   cd ..
   flutter clean
   flutter pub get
   ```

3. **Cache issues**:
   ```bash
   flutter pub cache clean
   flutter pub get
   ```

## Rollback if Needed

If updates cause too many issues:
```bash
git checkout -- pubspec.yaml pubspec.lock
flutter pub get
```