@echo off
cd /d "%~dp0"
start "WB Peak Area server" /min node server.mjs
timeout /t 1 /nobreak >nul
start "WB Peak Area" http://127.0.0.1:8765
