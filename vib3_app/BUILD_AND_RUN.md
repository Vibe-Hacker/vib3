# Build and Run Commands for VIB3 Flutter App

## In Android Studio Terminal:

1. **Get dependencies** (run this first):
```bash
flutter pub get
```

2. **Clean build** (if you have issues):
```bash
flutter clean
flutter pub get
```

3. **Run on emulator**:
```bash
flutter run
```

4. **Run with verbose output** (for debugging):
```bash
flutter run -v
```

5. **Build APK** (for testing):
```bash
flutter build apk --debug
```

## Common Issues and Fixes:

### If you get "No devices found":
1. Open AVD Manager in Android Studio
2. Start an emulator
3. Run: `flutter devices` to verify

### If you get SDK errors:
```bash
flutter doctor
```

### For performance mode:
```bash
flutter run --release
```

## Hot Reload Commands (while app is running):
- `r` - Hot reload
- `R` - Hot restart
- `q` - Quit
- `p` - Show widget inspector

## Testing Video Features:
1. The app will request camera/microphone permissions
2. Grant all permissions when prompted
3. Navigate to Create (+ icon) to test video creator
4. Test recording, effects, music, filters, etc.

## Important Notes:
- FFmpeg is included via ffmpeg_kit_flutter package
- Make sure you have at least 2GB free space for video processing
- The emulator camera will show a moving squares pattern