@echo off
echo Pokretanje lokalnog servera za testiranje...
echo.

:: Otvaranje preglednika s adresom localhost:8000
start http://localhost:8000

:: Pokretanje Python HTTP servera na portu 8000
python -m http.server 8000

pause
