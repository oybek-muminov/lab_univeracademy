# Statistik bonusni qaytarish — qaror va manbalar

Sana:2026-11-05, Asia/Tashkent. API 0.2.7-statistical-bonus-review.1; Master 1.5-statistical-bonus-review.1. Manba platforma UUIDlari berilmagan; quyidagi mantiqiy IDlar shu chatdagi aniq xabarlar uchun.

## Yangi foydalanuvchi qarori — UA-SRC-RESTORE-BONUS-20261105

> rash modelini muzlat, orniga statistik bonus modelini qosh. qoituvchi rash modeli orniga shu modelni faollashtirishi mumkin bolsin. rash bilan keyin shugullanamiz.
> shundan boshqa yana qanday muammo bor, tezroq ishni boshlash kerak

Natija: Rasch/1PL/MAP hamda uning T/daraja muammolari keyingi bosqichga muzlatiladi. Hozir ordinary+statistik bonus ikki mexanizm. Oldingi bonusni olib tashlash qarori yangi qaror bilan o‘zgardi; tarix o‘chirilmaydi. Teacherning optional amalida Rasch o‘rniga bonus.

## Javobsiz savol — UA-SRC-BONUS-UNANSWERED-20261105

Savol: «Statistik bonusda javobsiz qoldirilgan savolni ham noto‘g‘ri javob deb hisoblaymizmi? Bu eski bonus talabida ochiq qolgan edi; Rasch uchun esa0 deb kelishgandik.»

Foydalanuvchi javobi: **«Ha, noto‘g‘ri javob sifatida hisoblansin».** Shuning uchun unanswered incorrect_countga va N maxrajiga kiradi, o‘quvchi unga0 oladi. GB-01 endi yopiq.

## Tasdiqlangan eski talab va saqlanadigan mexanika

- Original bonus formulasi va sifatlari: `UA-SRC-GRADING-USER-20261105`, nusxa `references/UNIVERACADEMY_GRADING_REQUIREMENTS_2026-11-05.md`. Correct uchun base×(1+wrong/N), wrong uchun0; bir guruh/aynan shu test; minimal ishtirokchi cheklovi yo‘q; kichik guruh warning; bir marta/o‘zgarmas; ordinary alohida; official Rasch/Milliy sertifikatga tenglashtirmaslik.
- Shu chatdagi keyingi javoblar: ordinary positive fractional points/display2,45 default/editable, initial individual off, Asia/Tashkent, Teacher optional/Owner oldingi huquqi, Admin activation yo‘q, original history va recovery successor alohida. Modelni almashtirishda shu joriy mexanika saqlanmoqda; yangi vakolat berilmaydi.
- Cohort uchun latest valid-current-self-submitted mexanikasi saqlanmoqda. Uning dastlabki aniqlashtirilishi Rasch muhokamasida bo‘lgan; bu yangi bonus-specific iqtibos deb ko‘rsatilmaydi. Boshqa guruh/no-show/expired/forced/cancelled kiritilmaydi; barcha boshlangan urinishlar tugashini kutish sharti alohida qoladi.

## Texnik tavsiyalar — foydalanuvchi tasdig‘i deb ko‘rsatilmasin

Synchronous atomik201/200 API, wire nomlar, N0 uchun409/no snapshot, hamma guruhda informatsion warning, exact decimal/rational saqlash va display HALF_UP2 — Backend review uchun konkret tavsiya. Ularga runtime yoki agent acceptance da’vosi yo‘q. Yangi database/migration/provider/deploy huquqi berilmagan.
