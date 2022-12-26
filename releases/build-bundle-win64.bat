@ECHO OFF

IF [%1] == [] GOTO usage

ECHO 1) Deleting old bundle
CALL DEL /F /S /Q bundle

ECHO 2) Downloading new WeKan.zip
CALL DEL wekan-%1.zip
CALL wget https://releases.wekan.team/wekan-%1.zip

ECHO 3) Unarchiving new WeKan
CALL 7z x wekan-%1.zip

ECHO 4) Reinstalling bcrypt
cmd /c "CD bundle\programs\server\npm\node_modules\meteor\accounts-password && npm remove bcrypt && npm install bcrypt"
REM # Sometimes may require building from source https://github.com/meteor/meteor/issues/11682
REM # cmd /c "bundle\programs\server\npm\node_modules\meteor\accounts-password && npm rebuild --build-from-source && npm --build-from-source install bcrypt"
REM # CD ..\..\..\..\..\..\..

ECHO 5) Packing new WeKan.zip
CALL DEL wekan-%1-amd64-windows.zip
CALL 7z a wekan-%1-amd64-windows.zip bundle

ECHO 6) Copying WeKan.zip to sync directory
CALL COPY wekan-%1-amd64-windows.zip Z:\

ECHO 7) Done. Starting WeKan.
CALL start-wekan.bat

GOTO :eof

:usage
ECHO Usage: build-windows.bat VERSION-NUMBER
ECHO Example: build-windows.bat 5.00 

:eof
