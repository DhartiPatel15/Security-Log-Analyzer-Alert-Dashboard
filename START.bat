@echo off
setlocal
cd /d "%~dp0"

echo ==============================================
echo   SECURITY LOG ANALYZER AND ALERT DASHBOARD
echo ==============================================
echo.

where py >nul 2>nul
if errorlevel 1 (
    echo Python was not found. Install Python 3.10+ from https://www.python.org/downloads/
    echo During installation, select "Add Python to PATH".
    pause
    exit /b 1
)

if not exist "venv\Scripts\python.exe" (
    echo Creating virtual environment...
    py -3 -m venv venv
    if errorlevel 1 (
        echo Could not create virtual environment.
        pause
        exit /b 1
    )
)

echo Installing required packages...
"venv\Scripts\python.exe" -m pip install --upgrade pip
"venv\Scripts\python.exe" -m pip install -r "backend\requirements.txt"
if errorlevel 1 (
    echo Package installation failed. Check your internet connection.
    pause
    exit /b 1
)

if not exist "backend\.env" (
    copy "backend\.env.example" "backend\.env" >nul
)

echo.
echo Starting application...
echo Open http://127.0.0.1:5000 in your browser.
echo Default local demo login: admin / admin123
echo Press CTRL+C in this window to stop the server.
echo.
"venv\Scripts\python.exe" "backend\app.py"
pause
