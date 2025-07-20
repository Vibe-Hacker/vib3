@echo off
echo Building debug APK (bypasses some permission issues)...
cd vib3_flutter

echo.
echo === Building debug APK ===
flutter build apk --debug

echo.
echo === Build Complete ===
if exist "build\app\outputs\flutter-apk\app-debug.apk" (
    echo SUCCESS! Debug APK created at:
    echo %CD%\build\app\outputs\flutter-apk\app-debug.apk
    echo.
    echo File size:
    dir "build\app\outputs\flutter-apk\app-debug.apk"
) else (
    echo Build failed - APK not found
)
pause