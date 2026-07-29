@echo off
title Servidor Backend - JSON Server (Porta 3000)
echo ===================================================
echo   Iniciando o JSON Server para a Plataforma Cursos
echo ===================================================
echo.
npx json-server --watch db.json --port 3000
pause
