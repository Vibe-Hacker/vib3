@echo off
echo ====================================
echo VIB3 DigitalOcean Deployment
echo ====================================
echo.

set /p SERVER_IP="Enter your DigitalOcean server IP: "

if "%SERVER_IP%"=="" (
    echo ERROR: Server IP is required!
    pause
    exit /b 1
)

echo.
echo Deploying to %SERVER_IP%...
echo.

REM Create temporary deployment package
echo Creating deployment package...
if exist .deploy-temp rmdir /s /q .deploy-temp
mkdir .deploy-temp

REM Copy only essential files
echo Copying files...
xcopy /s /e /i /q microservices .deploy-temp\microservices > nul
xcopy /s /e /i /q shared .deploy-temp\shared > nul
xcopy /s /e /i /q infrastructure .deploy-temp\infrastructure > nul
xcopy /s /e /i /q config .deploy-temp\config > nul 2>nul
xcopy /s /e /i /q constants .deploy-temp\constants > nul 2>nul
xcopy /s /e /i /q middleware .deploy-temp\middleware > nul 2>nul
xcopy /s /e /i /q routes .deploy-temp\routes > nul 2>nul
xcopy /s /e /i /q server .deploy-temp\server > nul 2>nul
xcopy /s /e /i /q www .deploy-temp\www > nul
copy package*.json .deploy-temp\ > nul
copy docker-compose.yml .deploy-temp\ > nul
copy .env.example .deploy-temp\ > nul 2>nul
copy README-ARCHITECTURE.md .deploy-temp\ > nul
copy server.js .deploy-temp\ > nul 2>nul

REM Create server installation script
echo Creating installation script...
(
echo #!/bin/bash
echo echo "Installing VIB3 microservices..."
echo.
echo # Install Node.js 18
echo curl -fsSL https://deb.nodesource.com/setup_18.x ^| sudo -E bash -
echo sudo apt update
echo sudo apt install -y nodejs redis-server
echo.
echo # Install PM2
echo sudo npm install -g pm2
echo.
echo # Start Redis
echo sudo systemctl start redis
echo sudo systemctl enable redis
echo.
echo # Install dependencies
echo npm install --production
echo.
echo # Copy environment file
echo if [ ! -f .env ]; then cp .env.example .env 2^>/dev/null ^|^| true; fi
echo.
echo # Stop existing services
echo pm2 delete all 2^>/dev/null ^|^| true
echo.
echo # Start services
echo if [ -f server.js ]; then pm2 start server.js --name vib3-main -i max; fi
echo pm2 start microservices/api-gateway/src/index.js --name api-gateway -i 2
echo pm2 start microservices/auth-service/src/index.js --name auth-service -i 2
echo pm2 start microservices/video-service/src/index.js --name video-service -i 2
echo pm2 start microservices/user-service/src/index.js --name user-service -i 2
echo pm2 start microservices/analytics-service/src/index.js --name analytics-service
echo pm2 start microservices/notification-service/src/index.js --name notification-service -i 2
echo pm2 start microservices/recommendation-service/src/index.js --name recommendation-service
echo.
echo # Save PM2 config
echo pm2 save
echo pm2 startup
echo.
echo echo "Installation complete!"
echo echo "API Gateway: http://$(hostname -I ^| awk '{print $1}'):4000"
echo echo "Main App: http://$(hostname -I ^| awk '{print $1}'):3000"
) > .deploy-temp\install.sh

echo.
echo Uploading files to server...
echo Please enter your server password when prompted:
echo.

REM Use SCP to upload files
scp -r .deploy-temp/* root@%SERVER_IP%:/opt/vib3-deploy/

echo.
echo Running installation on server...
ssh root@%SERVER_IP% "cd /opt/vib3-deploy && chmod +x install.sh && bash install.sh"

REM Cleanup
rmdir /s /q .deploy-temp

echo.
echo ====================================
echo DEPLOYMENT COMPLETE!
echo ====================================
echo.
echo Your services are running at:
echo - API Gateway: http://%SERVER_IP%:4000
echo - Main App: http://%SERVER_IP%:3000
echo.
echo To check status:
echo   ssh root@%SERVER_IP%
echo   pm2 status
echo.
echo To view logs:
echo   pm2 logs
echo.
echo To configure:
echo   nano /opt/vib3-deploy/.env
echo.
pause