@echo off
echo Compiling Tailwind CSS...
npx tailwindcss -i ./css/input.css -o ./css/tailwind-output.css --minify
echo Done!
pause
