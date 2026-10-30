@echo off
rem Opens the built offline game. Run "npm run build" first if dist\PLAY.html is missing.
start "Biblhalla" "%~dp0..\..\dist\PLAY.html"
