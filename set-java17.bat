@echo off
echo Setting Java 17 for Android builds...

echo Current JAVA_HOME:
echo %JAVA_HOME%

echo.
echo Setting JAVA_HOME to Java 17...
set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.13.11-hotspot
set PATH=%JAVA_HOME%\bin;%PATH%

echo.
echo Updated JAVA_HOME:
echo %JAVA_HOME%

echo.
echo Java version:
java -version

echo.
echo Now try building again in Android Studio
pause