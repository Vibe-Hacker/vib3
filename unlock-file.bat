@echo off
echo Removing read-only attribute from local.properties...
cd vib3_flutter\android
attrib -R local.properties
echo Done! File is now writable.
echo.
echo Now try building again in Android Studio.
pause