@echo off
echo Fixing Android SDK permissions...
cd vib3_flutter

echo Updating local.properties to use local SDK...
echo flutter.buildMode=release > android\local.properties
echo flutter.sdk=C:\\flutter >> android\local.properties
echo flutter.versionCode=1 >> android\local.properties
echo flutter.versionName=1.0.0 >> android\local.properties
echo sdk.dir=C:\\Users\\VIBE\\Desktop\\VIB3\\vib3_flutter\\android-sdk >> android\local.properties

echo.
echo Checking if android-sdk directory exists...
if exist "android-sdk" (
    echo Local android-sdk found
) else (
    echo Creating android-sdk directory...
    mkdir android-sdk
    echo.
    echo Please copy your Android SDK to: %CD%\android-sdk
    echo Or run Android Studio SDK Manager to install SDK here
)

echo.
echo Updated local.properties:
type android\local.properties
pause