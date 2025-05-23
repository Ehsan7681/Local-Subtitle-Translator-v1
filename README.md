# مترجم محلی زیرنویس

یک برنامه وب برای ترجمه زیرنویس‌های SRT با استفاده از LM Studio به صورت محلی.

## ویژگی‌ها

* اتصال به LM Studio برای ترجمه زیرنویس
* امکان استفاده از هر مدل هوش مصنوعی بارگذاری شده در LM Studio
* تنظیم لحن ترجمه (رسمی، عامیانه، محاوره‌ای)
* نمایش همزمان متن اصلی و ترجمه شده
* نمایش درصد پیشرفت ترجمه و تخمین زمان باقیمانده به صورت گرافیکی و متنی
* امکان توقف و ادامه فرآیند ترجمه
* امکان ویرایش دستی متن ترجمه شده
* امکان ترجمه مجدد هر خط زیرنویس به صورت جداگانه
* کادرهای زیرنویس با ارتفاع ثابت و قابلیت اسکرول برای فایل‌های با تعداد زیاد زیرنویس
* مرور آسان زیرنویس‌ها بدون اسکرول خودکار
* ذخیره زیرنویس‌های ترجمه شده در فرمت SRT حتی در حالت توقف ترجمه
* حالت تاریک/روشن
* طراحی کاملاً ریسپانسیو برای استفاده در همه دستگاه‌ها:
  * بهینه‌سازی برای صفحات دسکتاپ، تبلت و موبایل
  * چیدمان متفاوت در حالت افقی و عمودی موبایل
  * نمایش فقط آیکون‌ها در دکمه‌ها برای صفحات کوچک

## پیش‌نیازها

1. نصب [LM Studio](https://lmstudio.ai/) روی کامپیوتر
2. بارگذاری یک مدل زبانی در LM Studio
3. فعال کردن Inference Server در LM Studio

## نحوه استفاده

1. **اتصال به LM Studio**: 
   - ابتدا LM Studio را باز کرده و یک مدل را بارگذاری کنید
   - به بخش Chat بروید و گزینه Inference Server را فعال کنید
   - در برنامه مترجم محلی، آدرس LM Studio را وارد کنید (پیش‌فرض: `http://localhost:1234/v1`)
   - دکمه "اتصال به LM Studio" را بزنید
2. **انتخاب لحن ترجمه**: لحن مورد نظر برای ترجمه را انتخاب کنید
3. **بارگذاری فایل زیرنویس**: فایل SRT خود را با کشیدن و رها کردن یا کلیک روی ناحیه مشخص شده بارگذاری کنید
4. **شروع ترجمه**: روی دکمه "شروع ترجمه" کلیک کنید تا فرآیند ترجمه آغاز شود
5. **ویرایش یا ترجمه مجدد هر خط**: می‌توانید با نگه داشتن نشانگر ماوس روی هر خط زیرنویس، دکمه‌های ویرایش و ترجمه مجدد را مشاهده کنید
6. **ذخیره زیرنویس ترجمه شده**: پس از اتمام ترجمه یا در حالت توقف ترجمه، می‌توانید با کلیک روی دکمه "ذخیره زیرنویس" فایل SRT ترجمه شده را دانلود کنید
7. **تغییر حالت نمایش**: برای تغییر بین حالت تاریک و روشن، روی آیکون مربوطه در بالای صفحه کلیک کنید

## مزایای استفاده از LM Studio

* **حریم خصوصی**: تمام پردازش‌ها به صورت محلی انجام می‌شود و هیچ داده‌ای به سرورهای خارجی ارسال نمی‌شود
* **رایگان**: نیازی به پرداخت هزینه API ندارید
* **انعطاف‌پذیری**: امکان استفاده از انواع مدل‌های زبانی مختلف
* **سرعت**: سرعت ترجمه بالاتر به دلیل پردازش محلی
* **بدون محدودیت**: محدودیت تعداد درخواست وجود ندارد

## نکات فنی

* فناوری‌های استفاده شده: HTML، CSS، JavaScript
* اتصال به API سازگار با OpenAI در LM Studio
* ذخیره تنظیمات به صورت محلی در مرورگر
* تطبیق‌پذیری با دستگاه‌های مختلف
* سازگاری با مرورگرهای مدرن

---

این برنامه بر اساس "مترجم زیرنویس بهترین" طراحی شده است و به شکل محلی با LM Studio کار می‌کند. 