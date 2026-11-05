---
source_id: UA-SRC-GRADING-USER-20261105
source_kind: current_chat_user_message
recorded_on: 2026-11-05
timezone: Asia/Tashkent
platform_message_id: unavailable
status: confirmed_product_requirements
---

Bu mantiqiy manba IDsi; platforma xabari UUIDsi o‘rnida ko‘rsatilmaydi. Quyida foydalanuvchining shu chatda bergan talablari saqlandi. Faylning yakuniy bayt xeshi paket manifestida beriladi.

---

baholash tizimi:

# UniverAcademy — baholash tizimi uchun tasdiqlangan talablar

API Contractga quyidagi baholash qoidalarini kirit.

## 1. Oddiy baholash

Test yaratishda o‘qituvchi **«Individual baholash»** tugmasini yoqishi yoki o‘chirishi mumkin.

- O‘chirilsa, barcha savollar 1 balldan baholanadi.
- Yoqilsa, har bir savol uchun alohida ball kiritish maydoni paydo bo‘ladi.
- To‘g‘ri javobga belgilangan ball, noto‘g‘ri javobga 0 ball beriladi.

Natija:

**Foiz = (To‘plangan ball / Maksimal ball) × 100**

Bu hisoblash test tugashi bilan bajariladi va natija saqlanadi.

## 2. Statistik bonusli baholash

Oldin Rasch modeli deb muhokama qilingan qo‘shimcha baholash o‘rniga o‘zimizning **statistik bonusli baholash** usulimizni joriy qilamiz.

Bu standart Rasch modeli emas. Hujjatlarda uni Rasch deb nomlama.

Formula:

**Yakuniy savol balli = Asosiy savol balli × (1 + noto‘g‘ri javoblar ulushi)**

Noto‘g‘ri javoblar ulushi = shu guruhdagi testni topshirgan ishtirokchilar orasida savolga noto‘g‘ri javob berganlar soni / hisobga olingan ishtirokchilar soni.

Misol:

- Savolning asosiy balli: 2,5.
- Ishtirokchilarning 80 foizi noto‘g‘ri javob bergan.
- Shu savolni to‘g‘ri ishlagan o‘quvchi: 2,5 × 1,8 = **4,5 ball**.
- Noto‘g‘ri ishlagan o‘quvchi: **0 ball**.

Statistika faqat bitta guruhning shu testdagi natijalaridan olinadi. Boshqa guruhlar qo‘shilmaydi.

## 3. Faollashtirish tartibi

- Statistik bonus faqat guruh testlarida mavjud.
- Guruhning kirish muddati yopilib, barcha boshlangan urinishlar yakunlangach faollashtirish mumkin.
- Uni qo‘llash o‘qituvchi ixtiyorida.
- Ishtirokchilar soniga minimal cheklov yo‘q.
- Kichik guruhlarda statistik aniqlik pastligi haqida ogohlantirish chiqadi.
- Hisoblash bir marta bajariladi, natijalar keyinchalik o‘zgartirilmaydi.
- Oddiy baholash natijalari o‘zgarmaydi, bonus natijalari alohida saqlanadi.

## 4. Natijalarni ko‘rsatish

O‘quvchining asosiy natijasida:

- To‘plangan oddiy ball.
- Maksimal oddiy ball.
- Oddiy ball foizi ko‘rsatiladi.

Statistik bonus faollashtirilgach, qo‘shimcha natija ham ko‘rsatilishi mumkin, lekin oddiy foiz o‘zgarmaydi.

Statistik bonusni rasmiy Rasch balliga yoki Milliy sertifikat darajasiga avtomatik tenglashtirma. Taxminiy sertifikat darajasini chiqarish mexanizmi alohida ilmiy asoslash va tasdiq talab qiladi.

## 5. Muhim texnik talablar

Backend har bir savolning asosiy ballini, guruh statistikasi va yakuniy bonus hisobini saqlasin.

Hisoblash takror yuborilgan so‘rovda ikkinchi marta natija yaratmasin. Hisoblangan natija keyinchalik yangi guruh yoki boshqa o‘quvchi natijasi sababli o‘zgarmasin.

Guruhdagi kelmagan o‘quvchilarni statistika hisobiga qo‘shma. Javobsiz qoldirilgan savollarni statistik ulushda hisoblash tartibi hali aniqlashtirilishi kerak — buni ochiq qaror sifatida belgilagin.

O‘qituvchi guruhning auditoriyadagi sessiyasini oldinroq yakunlagani kechikkan, avvaldan ro‘yxatda bo‘lgan o‘quvchilarning kun oxirigacha boshlash huquqini bekor qilmaydi.

## 6. Agentlarga vazifalar

**Backend:** hisoblash mexanizmi, natijalarni saqlash va API.

**Panel:** o‘qituvchi uchun individual baholash tugmasi, savol ballari va statistik bonusni faollashtirish.

**Bot/Mini App:** o‘quvchining oddiy va qo‘shimcha natijalarini ko‘rsatish.

**QA:** formulalarni, guruhlar ajratilishini, statistik hisoblashni takrorlamaslikni va natijalar o‘zgarmasligini tekshirish.

Bu talablarni Master Context va API Contractga moslashtir. Tasdiqlanmagan masalalarni taxmin bilan hal qilma. Hozircha Supabase migration va production deployment qilma.
