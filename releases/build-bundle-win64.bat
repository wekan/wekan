@ECHO OFF

REM 1) Install newest Node.js and NPM version manager https://github.com/nodists/nodist/releases
REM 2) nodist global 14.x
REM 3) nodist npm global 6.
REM 4) choco install -y 7zip curl wget git

IF [%1] == [] GOTO usage

ECHO 1) Deleting old bundle
CALL DEL /F /S /Q bundle

ECHO 2) Downloading new WeKan.zip
DEL wekan-%1-amd64.zip
wget https://github.com/wekan/wekan/releases/download/v%1/wekan-%1-amd64.zip

ECHO 3) Unarchiving new WeKan
CALL 7z x wekan-%1-amd64.zip

ECHO 4) Reinstalling bcrypt
cmd /c "npm -g install @mapbox/node-pre-gyp"
cmd /c "npm -g install node-gyp"
cmd /c "npm -g install fibers"
CALL DEL /F /S /Q bundle\programs\server\npm\node_modules\meteor\accounts-password\node_modules\bcrypt
cmd /c "CD bundle\programs\server\npm\node_modules\meteor\accounts-password && npm install bcrypt"
REM # Sometimes may require building from source https://github.com/meteor/meteor/issues/11682
REM cmd /c "CD bundle\programs\server\npm\node_modules\meteor\accounts-password && npm rebuild --build-from-source && npm --build-from-source install bcrypt"

ECHO 5) Packing new WeKan.zip
CALL DEL wekan-%1-amd64-windows.zip
CALL 7z a wekan-%1-amd64-windows.zip bundle

REM ECHO 6) Copying WeKan.zip to sync directory
REM CALL COPY wekan-%1-amd64-windows.zip Z:\

REM ECHO 7) Done. Starting WeKan.
REM CD bundle
REM CALL ..\start-wekan.bat
REM CD ..

GOTO :eof

:usage
ECHO Usage: build-windows.bat VERSION-NUMBER
ECHO Example: build-windows.bat 5.00 

:eof
