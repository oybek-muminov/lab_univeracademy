# Ball aniqligi uchun minimal texnik tavsiya

Holat: **RECOMMENDED_BACKEND_REVIEW**, foydalanuvchi tasdiqlagan yangi mahsulot qoidasi emas. Positive fractional points va2 kasrli ko‘rsatish allaqachon tasdiqlangan; shu tanlovlar qayta so‘ralmaydi.

Tavsiya ID: `DECIMAL_RATIONAL_DISPLAY_HALF_UP_V1`.

1. Published base pointsni JSON token/aniq decimal semantikasi bilan oling; hisoblashning authoritative manbasida binary float yig‘mang. Off rejimda base=1; on rejimda base>0. Amountning aniq decimal qiymati va scale saqlansin. Amaldagi DBning precision/scale/range imkoniyati read-only inventoryda tekshirilib, ruxsat etilgan chegaralar publish validatsiyasida ochiq belgilanadi; bu hujjat yashirin maksimum yoki kasr limitini tanlamaydi.
2. Ordinary earned/maxni aniq yig‘ing. Percentage uchun earned/max nisbatini manba sifatida saqlang;1/3 kabi qiymatni finite decimalda mutlaq aniq saqladik deb da’vo qilmang. Result completionda shu o‘zgarmas manba bilan yaratiladi.
3. Bonusda umumiy N va savol wrong count butun son. Final weight `base*(N+wrong)/N`; o‘quvchi summasi faqat correct savollardan. Exact base/countlar, rational numerator/denominator yoki ekvivalent aniq representation saqlansin. Bir savolni yaxlitlab keyin yig‘mang.
4. Faqat ko‘rsatishda2 kasrga HALF_UP tavsiya etiladi. Masalan2.345→2.35,2.355→2.36. Bu texnik tanlov Backend tomonidan ko‘rib chiqiladi; hali foydalanuvchi tanlagan tie policy sifatida yozilmaydi.
5. Mavjud wire `number` finite presentation; server/consumer xom numberni qayta hisoblashning authoritative asosi deb olmasin. Backend runtime serialization va UI rounding mosligini tekshirsin. Decimal-string kabi yangi wire turini ushbu tahrir kiritmaydi; zarur bo‘lsa API egasi konkret diff tayyorlaydi.
6. Reviewed numeric policy ID birinchi snapshotdan oldin belgilanadi va natija bilan muzlatiladi. Keyingi siyosat/roster/guruh o‘zgarishi tarixni qayta hisoblamaydi. Sonli saqlash xatosida yarim bonusni publish qilmang; transaction rollback va existing error envelope ishlatiladi, mavjud snapshot o‘zgarmaydi.

Bu masalani Rasch optimizatori, chegarani sertifikatsiyalash yoki murakkab statistik ilmiy tadqiqot bilan bog‘lash shart emas. Bitta Backend texnik ko‘rigida implementatsiya uchun aniq va sinovdan o‘tadigan siyosat belgilanadi.
