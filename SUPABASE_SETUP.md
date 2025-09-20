# راه‌اندازی Supabase برای منوی کافه ماموت

## مراحل راه‌اندازی

### 1️⃣ ایجاد پروژه Supabase

1. به [supabase.com](https://supabase.com) بروید
2. روی "Start your project" کلیک کنید
3. با GitHub وارد شوید
4. "New Project" را انتخاب کنید
5. نام پروژه: `cafe-mammut-menu`
6. رمز عبور قوی انتخاب کنید
7. منطقه: `Asia Pacific (Singapore)` (نزدیک‌ترین به ایران)

### 2️⃣ تنظیم دیتابیس

1. در داشبورد Supabase، به بخش "SQL Editor" بروید
2. فایل `supabase-schema.sql` را کپی کنید
3. در SQL Editor پیست کنید و "Run" کلیک کنید
4. جداول و داده‌های پیش‌فرض ایجاد می‌شوند

### 3️⃣ دریافت کلیدهای API

1. در داشبورد، به بخش "Settings" → "API" بروید
2. **Project URL** را کپی کنید
3. **anon public** key را کپی کنید

### 4️⃣ تنظیم فایل HTML

در فایل `index.html`، خطوط زیر را پیدا کنید:

```javascript
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

و مقادیر را جایگزین کنید:

```javascript
const SUPABASE_URL = 'https://your-project-id.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key-here';
```

### 5️⃣ تنظیم Storage

1. در داشبورد، به بخش "Storage" بروید
2. bucket با نام `product-images` باید ایجاد شده باشد
3. اگر نیست، دستی ایجاد کنید:
   - Name: `product-images`
   - Public: ✅ (تیک بزنید)

### 6️⃣ تست عملکرد

1. فایل `index.html` را در مرورگر باز کنید
2. پنل ادمین را باز کنید (رمز: `hamidmtd321`)
3. یک دسته‌بندی یا محصول اضافه کنید
4. در تب دیگر مرورگر، تغییرات را ببینید

## ویژگی‌های Real-time

✅ **تغییرات فوری**: تمام تغییرات در کمتر از 1 ثانیه اعمال می‌شود
✅ **چند کاربره**: چندین ادمین می‌توانند همزمان کار کنند
✅ **آپلود عکس**: عکس‌ها در Supabase Storage ذخیره می‌شوند
✅ **پشتیبان‌گیری**: داده‌ها در PostgreSQL ذخیره می‌شوند
✅ **مقیاس‌پذیری**: تا 500MB رایگان

## امنیت

- **RLS فعال**: Row Level Security برای حفاظت از داده‌ها
- **کلید عمومی**: فقط برای خواندن و نوشتن داده‌ها
- **HTTPS**: تمام ارتباطات رمزگذاری شده

## هزینه

- **رایگان**: تا 500MB دیتابیس
- **پرداخت**: فقط در صورت استفاده بیش از حد مجاز
- **تخمین**: برای یک کافه کوچک، رایگان خواهد بود

## پشتیبانی

اگر مشکلی داشتید:
1. Console مرورگر را بررسی کنید (F12)
2. Network tab را چک کنید
3. Supabase logs را در داشبورد ببینید

## مزایای Supabase نسبت به Firebase

✅ **رایگان‌تر**: 500MB رایگان vs 1GB Firebase
✅ **PostgreSQL**: دیتابیس قدرتمند و استاندارد
✅ **Real-time بهتر**: WebSocket با تأخیر کمتر
✅ **Storage ارزان‌تر**: هزینه کمتر برای فایل‌ها
✅ **SQL**: امکان کوئری‌های پیچیده
✅ **Open Source**: کد منبع باز
