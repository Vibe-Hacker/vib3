@echo off
echo Building VIB3 Flutter APK...
cd vib3_app

echo Checking for Flutter installation...
where flutter
if errorlevel 1 (
    echo Flutter not found in PATH. Checking common locations...
    if exist "C:\flutter\flutter\bin\flutter.bat" (
        set FLUTTER_CMD=C:\flutter\flutter\bin\flutter.bat
    ) else if exist "C:\flutter\bin\flutter.bat" (
        set FLUTTER_CMD=C:\flutter\bin\flutter.bat
    ) else if exist "C:\dev\flutter\bin\flutter.bat" (
        set FLUTTER_CMD=C:\dev\flutter\bin\flutter.bat
    ) else if exist "C:\tools\flutter\bin\flutter.bat" (
        set FLUTTER_CMD=C:\tools\flutter\bin\flutter.bat
    ) else (
        echo Flutter not found! Please install Flutter first.
        pause
        exit /b 1
    )
) else (
    set FLUTTER_CMD=flutter
)

echo Using Flutter at: %FLUTTER_CMD%
%FLUTTER_CMD% clean
%FLUTTER_CMD% pub get
%FLUTTER_CMD% build apk --debug
echo.
echo Build complete! APK location:
echo %CD%\build\app\outputs\flutter-apk\app-debug.apk
pause