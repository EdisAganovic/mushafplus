#!/bin/bash

# build-css.sh - Compile Tailwind CSS for Quran App
# Converts Windows .bat script to Unix-compatible shell script
# Usage: chmod +x build-css.sh && ./build-css.sh

set -e  # Exit on error

echo "🔨 Compiling Tailwind CSS..."

# Validate input.css exists before running
if [ ! -f "./css/input.css" ]; then
    echo "❌ Error: ./css/input.css not found!"
    exit 1
fi

# Compile with npx tailwindcss
npx tailwindcss -i ./css/input.css -o ./css/tailwind-output.css --minify

# Check exit status
if [ $? -eq 0 ]; then
    # Verify output was created
    if [ -f "./css/tailwind-output.css" ]; then
        echo "✅ Done! Tailwind compiled successfully."
        
        # Show file size for verification
        lineCount=$(wc -l < ./css/tailwind-output.css)
        byteCount=$(wc -c < ./css/tailwind-output.css)
        echo ""
        echo "📦 Output statistics:"
        echo "   Lines: ${lineCount}"
        echo "   Size:  ${byteCount} bytes"
        
    else
        echo "❌ Error: Output file not created."
        exit 1
    fi
else
    echo "❌ Error compiling Tailwind CSS. Please check your installation."
    echo "💡 Try running: npx tailwindcss --version"
    exit 1
fi

# Success message
echo ""
echo "🎨 You can now refresh your browser to see the compiled styles!"
