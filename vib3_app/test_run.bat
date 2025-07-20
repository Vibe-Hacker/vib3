@echo off
echo Cleaning Flutter project...
flutter clean
echo.
echo Getting dependencies...
flutter pub get
echo.
echo Running the app...
flutter run
pause