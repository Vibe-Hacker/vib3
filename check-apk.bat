@echo off
cd vib3_flutter
echo Checking for APK file...
echo.
if exist "build\app\outputs\flutter-apk\app-debug.apk" (
    echo SUCCESS! APK file found:
    echo Location: %CD%\build\app\outputs\flutter-apk\app-debug.apk
    echo.
    echo File details:
    dir "build\app\outputs\flutter-apk\app-debug.apk"
    echo.
    echo You can now install this APK on your Android device!
) else (
    echo APK file not found. Build may have failed.
    echo Checking if build directory exists...
    if exist "build\" (
        echo Build directory exists, checking contents:
        dir build\app\outputs\flutter-apk\ /b
    ) else (
        echo Build directory does not exist.
    )
)
pause