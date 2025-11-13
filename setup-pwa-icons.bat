@echo off
REM PWA Icon Generator Script for Windows
REM This script helps you set up PWA icons for PocketPilot

echo ================================================
echo PocketPilot PWA Icon Setup
echo ================================================
echo.

echo To complete PWA setup, you need the following icons in client\public\:
echo.
echo 1. favicon.ico (16x16, 32x32, 64x64)
echo 2. icon.png (192x192 pixels)
echo 3. icon.png (512x512 pixels)
echo.
echo ================================================
echo Option 1: Use Online Tools
echo ================================================
echo.
echo 1. Create your logo/icon design
echo 2. Visit: https://favicon.io/favicon-converter/
echo 3. Upload your image
echo 4. Download the generated files
echo 5. Move files to client\public\
echo.
echo ================================================
echo Option 2: Create Simple Placeholder Icons
echo ================================================
echo.

REM Check if we're in the right directory
if exist "client\public\" (
    echo Creating placeholder SVG file...
    
    (
        echo ^<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg"^>
        echo   ^<rect width="512" height="512" fill="#2563eb"/^>
        echo   ^<text x="256" y="280" font-family="Arial, sans-serif" font-size="200" fill="white" text-anchor="middle"^>PP^</text^>
        echo ^</svg^>
    ) > client\public\icon.png
    
    echo.
    echo ✓ Created icon.png in client\public\
    echo.
    echo You can use this SVG as a starting point and convert it to PNG using:
    echo   - Online: https://cloudconvert.com/svg-to-png
    echo   - Or any image editor (GIMP, Photoshop, etc.)
    echo.
) else (
    echo ⚠ Please run this script from the project root directory
)

echo ================================================
echo Quick Icon Creation Options:
echo ================================================
echo.
echo 1. ONLINE TOOLS (Recommended):
echo    - https://favicon.io/favicon-converter/
echo    - https://realfavicongenerator.net/
echo    - https://www.favicon-generator.org/
echo.
echo 2. DESIGN TOOLS:
echo    - Canva: https://www.canva.com/
echo    - Figma: https://www.figma.com/
echo    - Adobe Express: https://www.adobe.com/express/
echo.
echo 3. FREE ICON RESOURCES:
echo    - https://www.flaticon.com/
echo    - https://icons8.com/
echo    - https://fontawesome.com/
echo.
echo ================================================
echo After adding icons, rebuild your app:
echo ================================================
echo.
echo   cd client
echo   npm run build
echo.
echo ================================================
echo Test your PWA:
echo ================================================
echo.
echo   npx serve -s client\build
echo.
echo Then open http://localhost:3000 and check:
echo   1. Chrome DevTools ^> Application ^> Manifest
echo   2. Chrome DevTools ^> Lighthouse ^> PWA audit
echo.
echo ================================================

pause
