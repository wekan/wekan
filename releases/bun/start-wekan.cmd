@echo off
setlocal
cd /d "%~dp0"
if not defined MONGO_URL (echo Set MONGO_URL to your database URL & exit /b 1)
if not defined ROOT_URL (echo Set ROOT_URL to the public URL of WeKan & exit /b 1)
if not defined PORT set PORT=3000
"%~dp0bun.exe" "%~dp0index.mjs" %*
exit /b %errorlevel%
