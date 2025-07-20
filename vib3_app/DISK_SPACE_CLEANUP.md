# Flutter Disk Space Cleanup Guide

## The Issue
Your build is failing with "There is not enough space on the disk" error. This happens because:
- Gradle build cache can grow very large
- Flutter build artifacts accumulate over time
- Android build files take significant space

## Quick Cleanup Commands

### 1. Clean Flutter Build (already tried)
```bash
flutter clean
```

### 2. Clean Gradle Cache
```bash
# Windows
cd android
gradlew clean
cd ..

# OR manually delete:
# C:\Users\VIBE\.gradle\caches
```

### 3. Clean Android Build Cache
```bash
cd android
gradlew cleanBuildCache
cd ..
```

### 4. Clear Flutter Pub Cache (if needed)
```bash
flutter pub cache clean
```

### 5. Clean Android Studio/Gradle Folders
Delete these folders if they exist:
- `C:\Users\VIBE\.gradle\caches` (can be several GB)
- `android\.gradle` (in your project)
- `android\app\build` (in your project)
- `build` folder in project root

### 6. Windows Disk Cleanup
1. Open Windows Disk Cleanup (Win+R, type "cleanmgr")
2. Select C: drive
3. Check:
   - Temporary files
   - Recycle Bin
   - System error memory dump files
   - Windows Update Cleanup

### 7. Check Disk Space
```bash
# In PowerShell
Get-PSDrive C | Select-Object Used,Free
```

## After Cleanup

1. Run Flutter doctor:
```bash
flutter doctor
```

2. Get dependencies:
```bash
flutter pub get
```

3. Try building again:
```bash
flutter run
```

## Prevent Future Issues

### Add to .gitignore:
```
# Gradle
.gradle/
build/
android/.gradle/
android/app/build/

# Flutter/Dart
.dart_tool/
.flutter-plugins
.flutter-plugins-dependencies
*.iml
.packages
.pub-cache/
.pub/
build/
```

### Regular Maintenance:
- Run `flutter clean` before major builds
- Clear gradle cache monthly
- Use `flutter pub cache repair` if packages corrupt

## If Still Having Issues

1. Move project to drive with more space
2. Increase Android Studio heap size
3. Use external drive for Android SDK
4. Consider using CI/CD for builds