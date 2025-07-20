@echo off
echo Building VIB3 Flutter App with VideoControllerManager fix...
cd vib3_app

echo.
echo === Current Directory ===
echo %CD%

echo.
echo === Running flutter clean ===
flutter clean

echo.
echo === Running flutter pub get ===
flutter pub get

echo.
echo === Building debug APK ===
flutter build apk --debug

echo.
echo === BUILD COMPLETE ===
if exist "build\app\outputs\flutter-apk\app-debug.apk" (
    echo SUCCESS: APK created at: %CD%\build\app\outputs\flutter-apk\app-debug.apk
    echo.
    echo File details:
    dir "build\app\outputs\flutter-apk\app-debug.apk"
    echo.
    echo VideoControllerManager implementation ready for testing!
    echo This should fix the systematic video loading failures (#4, #6, #7, #9, etc.)
) else (
    echo ERROR: APK not found - build failed
    echo.
    echo Checking for error logs...
    if exist "build\app\outputs\logs\*.log" (
        echo Found log files:
        dir "build\app\outputs\logs\*.log"
    )
)
pause