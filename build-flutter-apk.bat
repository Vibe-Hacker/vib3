@echo off
cd vib3_app
flutter build apk --release
echo Build complete. APK location: vib3_app\build\app\outputs\flutter-apk\app-release.apk
pause