@echo off
echo Fixing Flutter SDK lock issue...

echo Killing Dart processes...
taskkill /F /IM dart.exe /T 2>nul
taskkill /F /IM flutter_tools.snapshot /T 2>nul
taskkill /F /IM analysis_server.dart.snapshot /T 2>nul

echo Waiting for processes to terminate...
timeout /t 2 /nobreak >nul

echo Clearing Flutter cache...
if exist "C:\flutter\flutter\bin\cache\dart-sdk.old" (
    echo Removing old Dart SDK...
    rmdir /s /q "C:\flutter\flutter\bin\cache\dart-sdk.old" 2>nul
)

echo Resetting Flutter...
cd /d C:\flutter\flutter
call flutter doctor -v

echo Done! Now try 'flutter pub get' again.
pause