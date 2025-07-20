@echo off
echo Searching for all Java installations...
echo.

echo === Current Java Version ===
java -version
echo.

echo === JAVA_HOME Environment Variable ===
echo JAVA_HOME: %JAVA_HOME%
echo.

echo === Checking Program Files ===
if exist "C:\Program Files\Eclipse Adoptium\" (
    echo Found Eclipse Adoptium installations:
    dir "C:\Program Files\Eclipse Adoptium\" /b
)

if exist "C:\Program Files\Java\" (
    echo Found Java installations:
    dir "C:\Program Files\Java\" /b
)

if exist "C:\Program Files\OpenJDK\" (
    echo Found OpenJDK installations:
    dir "C:\Program Files\OpenJDK\" /b
)

echo.
echo === Checking Program Files (x86) ===
if exist "C:\Program Files (x86)\Eclipse Adoptium\" (
    echo Found Eclipse Adoptium x86 installations:
    dir "C:\Program Files (x86)\Eclipse Adoptium\" /b
)

if exist "C:\Program Files (x86)\Java\" (
    echo Found Java x86 installations:
    dir "C:\Program Files (x86)\Java\" /b
)

echo.
echo === Java Executable Location ===
where java

pause