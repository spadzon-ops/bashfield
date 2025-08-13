@echo off
echo Starting Bashfield Development Server...
echo.
echo Opening http://localhost:3000 in your browser...
echo.
start http://localhost:3000
echo.
echo If you see PowerShell errors, run this command as Administrator:
echo Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
echo.
pause
cd /d "%~dp0"
npx next dev