@echo off
title Levebio V24 Launcher
if not exist "node_modules" call npm install
npm start
