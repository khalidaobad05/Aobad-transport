#!/bin/bash
# شركة عباد للنقل - سكريبت بدء التشغيل (Mac / Linux)

echo "============================================"
echo "   شركة عباد للنقل - نظام التسيير"
echo "============================================"
echo ""

# التحقق من Node.js
if ! command -v node &> /dev/null; then
    echo "[خطأ] Node.js غير مثبت!"
    echo "يرجى تنزيله من: https://nodejs.org"
    exit 1
fi

echo "[OK] تم العثور على Node.js: $(node --version)"
echo ""

# التحقق من المكتبات
if [ ! -d "node_modules" ]; then
    echo "[1/3] جاري تثبيت المكتبات... (أول مرة فقط)"
    npm install
    echo "[OK] تم التثبيت"
    echo ""
else
    echo "[OK] المكتبات مثبتة"
    echo ""
fi

# التحقق من قاعدة البيانات
if [ ! -f "db/custom.db" ]; then
    echo "[2/3] جاري إنشاء قاعدة البيانات..."
    npx prisma db push --accept-data-loss
    echo "[OK] تم إنشاء قاعدة البيانات"
    echo ""
    echo "جاري إضافة البيانات التجريبية..."
    npx prisma db seed 2>/dev/null
    echo ""
else
    echo "[OK] قاعدة البيانات موجودة"
    echo ""
fi

# تشغيل التطبيق
echo "[3/3] جاري تشغيل التطبيق..."
echo ""
echo "============================================"
echo "  الموقع: http://localhost:3000"
echo "  الدخول: الاسم = المسير  |  الكود = ADMIN"
echo "============================================"
echo ""
echo "لإغلاق: اضغط Ctrl+C"
echo ""

npx next dev -p 3000
