@echo off
echo Pokretanje lokalnog servera za testiranje...
echo.

:: Get primary local IP address (prefer 192.168.x.x or 10.x.x.x, skip Hyper-V/VM adapters)
set LOCAL_IP=
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    for /f "tokens=1" %%b in ("%%a") do (
        :: Skip if it's a Hyper-V or VM adapter (172.16-31.x.x, 169.254.x.x)
        echo %%b | findstr /r "^192\.168\. ^10\." >nul
        if not errorlevel 1 (
            set LOCAL_IP=%%b
            goto :found
        )
    )
)
:found

:: If no 192.168 or 10.x found, use any available IP
if "%LOCAL_IP%"=="" (
    for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
        for /f "tokens=1" %%b in ("%%a") do (
            echo %%b | findstr /r "^172\." >nul
            if errorlevel 1 (
                set LOCAL_IP=%%b
                goto :found2
            )
        )
    )
)
:found2

:: Otvaranje preglednika s adresom localhost:8000
start http://localhost:8000

echo.
echo ============================================
echo Server je dostupan na:
echo   - Lokalno: http://localhost:8000
if not "%LOCAL_IP%"=="" (
    echo   - Mreža:   http://%LOCAL_IP: =%:8000
) else (
    echo   - Mreža:   Nije dostupno (provjeri firewall)
)
echo ============================================
echo.

:: Pokretanje Python HTTP servera na portu 8000 (dostupno svima na mreži)
python -m http.server 8000 --bind 0.0.0.0

pause
