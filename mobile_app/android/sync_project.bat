@echo off
echo Cleaning and syncing Android project...
cd %~dp0
gradlew.bat clean
gradlew.bat build --refresh-dependencies
echo.
echo Project sync complete. Please restart Android Studio if needed.
pause