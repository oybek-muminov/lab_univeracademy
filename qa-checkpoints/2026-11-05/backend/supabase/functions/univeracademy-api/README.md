# Yagona API va modulli backend

Mas’ul: Backend — APIning yagona egasi.

Yangi lokal nomzod yo‘li: `supabase/functions/univeracademy-api/`. Bu faqat tayyorlanayotgan loyiha tuzilmasi; amaldagi funksiya yoki URL ko‘chirilmadi. Mavjud backendning read-only inventarisiz ishlovchi kod ustidan yangi implementatsiya yozilmaydi.

Ko‘riladigan qismlar: student/staff identity, auth/scope, groups/roster, published demo/version/media, assignment/admission, attempts/CAS/submit/recovery, ordinary/bonus snapshot, result/review/export, Telegram webhook va notifications.

Lokal birinchi yadro: `telegram.ts` initData imzosini tekshiradi; `ordinary.ts`
aniq ichki formulani hisoblaydi; `attempts.ts` start/resume/CAS/deadline/submit
holatlarini o‘tkazadi. Bular HTTP API yoki durable DB adapteri emas.

API 0.2.7/numeric/storage/transaction reviewi hali yopilmagan. Ichki Ratio API
numberi, saqlash yoki yaxlitlash siyosati emas. HTTP/Telegram/Supabase adapterlari
keyingi bosqichda ulanadi. Kichik bonus hisobi uchun alohida worker majburiy emas.

Pure transition natijasini saqlamasdan clientga muvaffaqiyat ACKi yuborilmaydi.
Identity/current scope faqat tekshirilgan server manbasidan olinadi. `record`
kalitni tutadigan ichki storage yozuvi; HTTPga chiqarilmaydi. Kech save qaytargan
expiry/ordinary holati 409 yuborishdan avval atomik commit qilinishi kerak.

Repo rootidan lokal tekshiruv: `node --test tests/backend/*.test.ts` (Node.js24).
Ish rejasi, aniq manbalar va qolgan chegaralar: [Backend bosqichi](../../../docs/api/backend-start.md).

Student custom opaque proof va staff Auth JWT aralashtirilmaydi. Provider sozlamasi, real secret, migration va deployment ushbu papka yaratilishi bilan ruxsat etilgan hisoblanmaydi.

