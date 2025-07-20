@echo off
cd vib3_flutter
echo Current directory: %CD%
echo.
echo === Checking Flutter project structure ===
dir /b
echo.
echo === Testing flutter doctor in project ===
flutter doctor
echo.
echo === Running flutter build with verbose output ===
flutter build apk --debug --verbose
echo.
echo Build command finished with exit code: %ERRORLEVEL%
pause