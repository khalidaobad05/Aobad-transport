@echo off
title نشر شركة عباد للنقل على الإنترنت
chcp 65001 >nul 2>&1
echo ============================================
echo   نشر شركة عباد للنقل على الإنترنت (مجاني)
echo ============================================
echo.

:: Check Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [خطأ] Node.js غير مثبت!
    echo.
    echo يرجى تنزيله أولاً من: https://nodejs.org
    echo ثم أعد تشغيل هذا الملف.
    pause
    exit /b 1
)

echo [OK] Node.js موجود
echo.

:: Install npm packages if needed
if not exist "node_modules" (
    echo [1/5] تثبيت المكتبات...
    call npm install
    echo.
)

:: Install Vercel CLI
echo [2/5] تثبيت أداة النشر...
call npm install -g vercel 2>nul
echo [OK]
echo.

:: Login to Vercel
echo [3/5] تسجيل الدخول إلى Vercel...
echo ============================================
echo   سيفتح المتصفح - سجّل بإيميلك أو حساب GitHub
echo ============================================
call vercel login
if %errorlevel% neq 0 (
    echo [خطأ] فشل تسجيل الدخول
    pause
    exit /b 1
)
echo [OK]
echo.

:: Deploy
echo [4/5] جاري رفع الموقع إلى الإنترنت...
echo (قد يستغرق 2-3 دقائق)
echo.

echo Y | call vercel --yes --prod
if %errorlevel% neq 0 (
    echo.
    echo [ملاحظة] إذا طلب منك إعدادات، اختر:
    echo   - Framework: Next.js
    echo   - Build Command: next build
    echo   - Output Directory: .next
    pause
)

echo.
echo ============================================
echo   تم النشر بنجاح!
echo ============================================
echo.
pause