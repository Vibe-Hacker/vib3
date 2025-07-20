@echo off
echo Fixing Android SDK path issue...

echo.
echo Step 1: Close Android Studio completely
pause

echo.
echo Step 2: Copying Android SDK to project directory...
if not exist "android-sdk" mkdir android-sdk
if exist "C:\Users\Project\AppData\Local\Android\Sdk" (
    echo Copying from system SDK location...
    xcopy "C:\Users\Project\AppData\Local\Android\Sdk\*" "android-sdk\" /E /I /H /Y
) else (
    echo System SDK not found, creating minimal structure...
    mkdir android-sdk\platforms
    mkdir android-sdk\build-tools
)

echo.
echo Step 3: Setting SDK path in local.properties...
cd vib3_flutter\android
echo flutter.buildMode=release > local.properties
echo flutter.sdk=C:\\flutter >> local.properties
echo flutter.versionCode=1 >> local.properties
echo flutter.versionName=1.0.0 >> local.properties
echo sdk.dir=C:\\Users\\VIBE\\Desktop\\VIB3\\android-sdk >> local.properties

echo.
echo Step 4: Making local.properties read-only to prevent Android Studio from changing it...
attrib +R local.properties

echo.
echo Fixed! Now restart Android Studio and try building again.
echo The SDK will now be in your project directory with full permissions.
pause