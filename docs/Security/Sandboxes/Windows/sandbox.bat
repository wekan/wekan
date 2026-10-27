@echo off
REM Start VSCodium in Windows Sandbox, reaching only this WeKan checkout.
REM Double-click this file, or run it from a terminal. sandbox.ps1 beside it
REM does the work; README.md is the design.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0sandbox.ps1" %*
if errorlevel 1 pause
