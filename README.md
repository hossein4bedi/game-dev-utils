# game-dev-utils
ابزارهای مفید توسعه بازی‌های رایانه‌ای

استفاده:
برای استفاده از این ابزارها باید نود.جی.اس رو نصب کنید.

ابزارهای موجود:
mixamo-batch-downloader.js
با کمک این فایل می‌توانید انیمیشن‌های سایت Mixamo رو دانلود کنید.

روش استفاده:
1. به این منظور، ابتدا کاراکترتون رو Mixamo بارگذاری کنید و سپس یکی از انیمیشن‌ها را دانلود کنید.
2. در لینک دانلود بعد از واژه‌ی character یک کد به صورت aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee قرار گرفته. این کد رو کپی کنید و به صورت زیر به متغیر درج کنید.
3. Developer tools را باز کنید و در حالی که به سایت وارد شده‌اید در بخش کنسول عبارت localStorage.access_token را وارد کرده و اجرا کنید. مقدار حاصل در واقع کلید دسترسی شما به سایت Mixamo است. با داشتن این کلید می‌توان به حساب شما دسترسی داشت. حال این کلید را در داخل فایل به جای MIXAMO_ACCESS_TOKEN قرار دهید.
4. فایل را ذخیره کنید.
5. حال می‌توانید با اجرای دستور node mixamo-batch-downloader.js انیمیشن‌ها را دانلود کنید. 

اگر در طول اجرا خطایی رخ داد نگران نباشید. برنامه فقط فایل‌هایی که در پوشه‌ی انیمیشن‌ها نیست را دانلود می‌کند.


const character = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'


توجه:
1. این برنامه انشعابی از برنامه‌ی موجود در https://gist.github.com/gnuton/ec2c3c2097f7aeaea8bb7d1256e4b212 است. برنامه‌ی مذکور فقط در محیط مرورگر اجرا می‌شود.
2. این برنامه(کد) ممکن است حاوی خطاهای مهمی باشد و مسئولیت استفاده از این برنامه بر عهده‌ی خود شماست.

هشدار:
با اجرای این فایل، انیمیشن‌های دانلود شده داخل یک پوشه به نام کد کاراکتر قرار می‌گیرد و ممکن است به دلیل باگ یا هر مشکل دیگری فایل‌های داخل این پوشه رونویسی یا حذف شوند. 
