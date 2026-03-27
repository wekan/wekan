@ECHO OFF

REM Build WeKan Windows (win64) bundle - Meteor 3 style (no fibers needed).
REM
REM Prerequisites:
REM   1. Node.js 22.x from https://nodejs.org/
REM   2. 7-Zip from https://www.7-zip.org/
REM   3. wget  (choco install wget) or use curl
REM   4. Visual Studio Build Tools 2019 or later
REM      (or: npm install -g windows-build-tools)
REM
REM Usage: build-bundle-win64.bat 8.43

IF [%1] == [] GOTO usage

SET VERSION=%1

ECHO 1) Installing build tools
CALL npm install -g node-gyp @mapbox/node-pre-gyp

ECHO 2) Deleting old bundle directory
IF EXIST bundle (CALL DEL /F /S /Q bundle & RMDIR /S /Q bundle)
IF EXIST wekan-%VERSION%-win64.zip DEL wekan-%VERSION%-win64.zip

ECHO 3) Downloading amd64 bundle v%VERSION%
IF EXIST wekan-%VERSION%-amd64.zip DEL wekan-%VERSION%-amd64.zip
curl -L --insecure -o wekan-%VERSION%-amd64.zip ^
  https://github.com/wekan/wekan/releases/download/v%VERSION%/wekan-%VERSION%-amd64.zip

ECHO 4) Extracting bundle
CALL 7z x wekan-%VERSION%-amd64.zip

ECHO 5) Rebuilding native Node.js modules for Windows
CD bundle\programs\server
CALL npm rebuild
CD ..\..\..

ECHO 6) Creating Windows bundle zip
CALL 7z a wekan-%VERSION%-win64.zip bundle

ECHO Done: wekan-%VERSION%-win64.zip
GOTO :eof

:usage
ECHO Usage: build-bundle-win64.bat VERSION
ECHO Example: build-bundle-win64.bat 8.43
:eof
