#!/bin/bash
# سكريبت تهيئة قاعدة بيانات Turso السحابية
# يُنفَّذ مرة واحدة فقط

echo "============================================"
echo "  تهيئة قاعدة بيانات Turso السحابية"
echo "============================================"
echo ""

# Check if turso CLI is installed
if ! command -v turso &> /dev/null; then
    echo "تثبيت Turso CLI..."
    curl -sSfL https://get.tur.so/install.sh | bash
    export PATH="$HOME/.turso:$PATH"
fi

echo ""
echo "ادخل إلى حساب Turso:"
 turso auth login

echo ""
echo "اختر اسم لقاعدة البيانات (مثال: abbad-transport):"
read -r DB_NAME
echo ""

# Create database
echo "إنشاء قاعدة البيانات..."
 turso db create "$DB_NAME"

echo ""
echo "جلب معلومات الاتصال..."
DB_URL=$(turso db show "$DB_NAME" --url)
DB_TOKEN=$(turso db tokens create "$DB_NAME")

echo ""
echo "============================================"
echo "  انسخ هذه القيم إلى Vercel"
echo "============================================"
echo ""
echo "TURSO_DATABASE_URL=$DB_URL"
echo "TURSO_AUTH_TOKEN=$DB_TOKEN"
echo ""
echo "============================================"
echo ""
echo "الخطوة التالية:"
echo "1. اذهب إلى vercel.com وسجّل حساب"
echo "2. اضغط 'Add New Project' واربط حساب GitHub"
echo "3. أضف المتغيرات أعلاه في Settings > Environment Variables"
echo "4. اضغط Deploy"
