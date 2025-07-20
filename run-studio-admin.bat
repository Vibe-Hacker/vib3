@echo off
echo Starting Android Studio as Administrator...
echo This should resolve the Java file permission issues.
echo.
echo Close Android Studio first, then run this batch file as Administrator.
echo.
pause

echo Looking for Android Studio installation...
if exist "C:\Program Files\Android\Android Studio\bin\studio64.exe" (
    echo Found Android Studio at: C:\Program Files\Android\Android Studio\bin\studio64.exe
    start "" "C:\Program Files\Android\Android Studio\bin\studio64.exe"
) else if exist "C:\Users\%USERNAME%\AppData\Local\Android Studio\bin\studio64.exe" (
    echo Found Android Studio at: C:\Users\%USERNAME%\AppData\Local\Android Studio\bin\studio64.exe
    start "" "C:\Users\%USERNAME%\AppData\Local\Android Studio\bin\studio64.exe"
) else (
    echo Android Studio not found in common locations.
    echo Please manually start Android Studio as Administrator.
)

echo.
echo After Android Studio opens:
echo 1. Open the project: C:\Users\VIBE\Desktop\VIB3\vib3_flutter
echo 2. Try building again
pause