@echo off
title شركة عباد للنقل - بدء التشغيل
chcp 65001 >nul 2>&1
echo ============================================
echo    شركة عباد للنقل - نظام التسيير
echo ============================================
echo.

:: التحقق من Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [خطأ] Node.js غير مثبت على حاسوبك!
    echo.
    echo يرجى تنزيله من: https://nodejs.org
    echo اختر الإصدار LTS واضغط تنزيل ثم ثبّته
    echo بعد التثبيت أعد فتح هذا الملف
    echo.
    pause
    exit /b 1
)

echo [OK] تم العثور على Node.js
node --version
echo.

:: التحقق من وجود node_modules
if not exist "node_modules" (
    echo [1/3] جاري تثبيت المكتبات المطلوبة... (أول مرة فقط)
    echo هذا قد يستغرق دقيقتين إلى خمس دقائق...
    call npm install
    if %errorlevel% neq 0 (
        echo [خطأ] فشل تثبيت المكتبات
        pause
        exit /b 1
    )
    echo [OK] تم تثبيت المكتبات بنجاح
    echo.
) else (
    echo [OK] المكتبات مثبتة مسبقاً
    echo.
)

:: التحقق من قاعدة البيانات
if not exist "db\custom.db" (
    echo [2/3] جاري إنشاء قاعدة البيانات...
    call npx prisma db push --accept-data-loss
    if %errorlevel% neq 0 (
        echo [خطأ] فشل إنشاء قاعدة البيانات
        pause
        exit /b 1
    )
    echo [OK] تم إنشاء قاعدة البيانات
    echo.
    :: تشغيل البيانات التجريبية
    echo [معلومات] جاري إضافة البيانات التجريبية...
    call npx prisma db seed
    echo.
) else (
    echo [OK] قاعدة البيانات موجودة
    echo.
)

:: تشغيل التطبيق
echo [3/3] جاري تشغيل التطبيق...
echo.
echo ============================================
echo  الموقع سيعمل على: http://localhost:3000
echo  افتح المتصفح واكتب هذا العنوان
echo  للدخول: الاسم = المسير  ^|  الكود = ADMIN
echo ============================================
echo.
echo لإغلاق التطبيق: اضغط Ctrl+C ثم أغلق النافذة
echo.

call npx next dev -p 3000
pause