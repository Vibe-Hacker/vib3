@echo off
echo Setting up Java 11 for Flutter builds...

echo.
echo Checking for Java 11 installation...
if exist "C:\Program Files\Eclipse Adoptium\jdk-11.0.25.9-hotspot" (
    set "JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-11.0.25.9-hotspot"
    echo Found Java 11 at: %JAVA_HOME%
) else if exist "C:\Program Files\Java\jdk-11.0.25" (
    set "JAVA_HOME=C:\Program Files\Java\jdk-11.0.25"
    echo Found Java 11 at: %JAVA_HOME%
) else if exist "C:\Program Files\OpenJDK\openjdk-11.0.2" (
    set "JAVA_HOME=C:\Program Files\OpenJDK\openjdk-11.0.2"
    echo Found Java 11 at: %JAVA_HOME%
) else (
    echo Java 11 not found. Installing Java 11...
    echo.
    echo Please download Java 11 from:
    echo https://adoptium.net/temurin/releases/?version=11
    echo.
    echo Choose: OpenJDK 11 LTS ^> Windows ^> x64 ^> .msi installer
    echo.
    echo After installation, run this script again.
    pause
    exit /b 1
)

echo.
echo Setting JAVA_HOME environment variable...
setx JAVA_HOME "%JAVA_HOME%"

echo.
echo Setting PATH to use Java 11...
set "PATH=%JAVA_HOME%\bin;%PATH%"

echo.
echo Current Java version:
"%JAVA_HOME%\bin\java.exe" -version

echo.
echo Java 11 setup complete!
echo Please restart Android Studio and try building again.
echo.
pause