@echo off
echo Creating VIB3 upload package...

:: Create a temporary directory for files to upload
mkdir vib3-upload 2>nul

:: Copy essential files
echo Copying essential files...
xcopy /Y server.js vib3-upload\
xcopy /Y package.json vib3-upload\
xcopy /Y package-lock.json vib3-upload\
xcopy /Y nginx.conf vib3-upload\
xcopy /Y pm2.config.js vib3-upload\
xcopy /Y .env.example vib3-upload\
xcopy /Y capacitor.config.json vib3-upload\

:: Copy www directory (excluding large files)
echo Copying www directory...
xcopy /E /I /Y www vib3-upload\www

:: Create the tar.gz file using Windows tar
echo Creating compressed archive...
tar -czf vib3-upload.tar.gz -C vib3-upload .

:: Clean up temporary directory
echo Cleaning up...
rmdir /S /Q vib3-upload

echo.
echo ===================================
echo Upload package created: vib3-upload.tar.gz
echo.
echo To upload to your server, run:
echo scp -i "path\to\your-key.key" vib3-upload.tar.gz ubuntu@170.9.240.173:/home/ubuntu/
echo ===================================
pause