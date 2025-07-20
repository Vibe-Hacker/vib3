@echo off
cd vib3_flutter
echo Current directory: %CD%
echo.
echo === Accepting Android licenses ===
flutter doctor --android-licenses
echo.
echo === Running flutter clean ===
flutter clean
echo.
echo === Running flutter pub get ===
flutter pub get
echo.
echo === Building APK ===
flutter build apk --debug
echo.
echo === BUILD COMPLETE ===
if exist "build\app\outputs\flutter-apk\app-debug.apk" (
    echo SUCCESS: APK created at: %CD%\build\app\outputs\flutter-apk\app-debug.apk
) else (
    echo ERROR: APK not found
)
pause