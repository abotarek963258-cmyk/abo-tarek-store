# أبو طارق للأدوات المنزلية — نسخة الإدارة

هذه النسخة مجهزة بحيث يكون تحديث الأصناف أسهل.

## الملفات
- `index.html` الموقع
- `admin.html` لوحة إدارة الأصناف
- `app.js` تحميل الأصناف
- `google-apps-script.gs` كود الربط مع Google Sheets
- `assets/` الشعار وصورة المحل

## الطريقة المقترحة
استخدام Google Sheets كمخزن للأصناف:
- تضيف صنف
- تحذف صنف
- تغيّر القسم
- تغيّر الصورة
- والموقع يقرأ البيانات تلقائيًا.

### إعداد مرة واحدة
1. أنشئ Google Sheet.
2. أنشئ ورقة باسم `Products`.
3. الصف الأول:
   `id | name | category | image | description | active`
4. افتح Extensions > Apps Script.
5. انسخ محتوى `google-apps-script.gs`.
6. غيّر `CHANGE_THIS_KEY` إلى كلمة سر خاصة.
7. Deploy > New deployment > Web app.
8. Execute as: Me.
9. Who has access: Anyone.
10. انسخ رابط `/exec`.
11. ضعه في `DATA_URL` داخل `app.js`.
12. ضع نفس الرابط ومفتاح الإدارة في `admin.html`.

> ملاحظة: هذه النسخة الأولى تجعل لوحة الإدارة تعمل محليًا أيضًا، لكن الحفظ المشترك بين الأجهزة يحتاج إتمام إعداد Google Sheets كما هو موضح أعلاه.
