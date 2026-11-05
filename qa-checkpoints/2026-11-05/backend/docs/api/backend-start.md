# Backendning birinchi lokal bosqichi — 2026-11-05

Holat: **lokal implementatsiya nomzodi; API 0.2.7 hali PROVISIONAL / NOT ACCEPTED**.
Backend ishni boshladi. Ishlaydigan HTTP API, real DB adapteri, consumer acceptance,
Telegram kirishi yoki birinchi o‘quvchi piloti tayyor degan da’vo yo‘q.

## Tayanch nusxalar

- Checkout va tekshirilgan GitHub main: `ee250df370c945f719cd574814cdb113c78680af`.
- Laboratoriya: `f2c580508cfec9e07f383610201af28edffd854b`,
  `UniverAcademy-statistical-bonus-review-2026-11-05/`.
- OpenAPI `0.2.7-statistical-bonus-review.1`, GitHub LF SHA256:
  `51deb7a41d223559022dcb7e17ff24985bd328e51c4a87c797a02763bb801149`.
- Markdown kontraktning GitHub LF SHA256:
  `9e4bd9c4de81cf765afdece03c655d0f9274f992417db4a003f4ed90e6057a02`.
- Master `1.5-statistical-bonus-review.1`, amaldagi §0.7/§22, GitHub LF SHA256:
  `9599ab1363c1cf570342ea53475aa9df0c7b8ac58165e84a0bed4ee995fe4f31`.
  Paket nusxasining SHA256 qiymati:
  `0b66377f6b13ac35c596779a68572866893e13549d1b22182e9fa2deb065fe52`.
  Koordinatorning mustaqil tekshiruviga ko‘ra 1025 CRLF→LF almashtirish paketni
  GitHub nusxasiga aynan tenglashtiradi; semantik ziddiyat yo‘q. Barcha satrlarni
  orqaga CRLFga o‘girish orqali eski xeshni topishga urinish teng tekshiruv emas.

Oldingi acceptance bu nusxalarga ko‘chirilmadi. Ushbu bosqich kontrakt fayli,
generated client, migration yoki provider identifikatorini o‘zgartirmaydi.

## Koddan oldin ajratilgan ochiq bandlar

1. `getResultTBD` operationId va «Result boundary pending grading agreement» summarysi
   yangilangan ordinary/bonus sxemalari bilan birga qolgan eski review yorliqlaridir.
   Result semantikasi asosiy tavsif va sxemalarda berilgan. Nomni yashirincha
   o‘zgartirish yoki shu holatni qabul qilingan API deb ko‘rsatish qilinmadi.
2. Session TTL, initData freshness/clock skew, rate-limit/polling/media qiymatlari
   ochiq. Telegram tekshiruviga caller aniq vaqt oralig‘ini beradi; kodda production
   default yo‘q. Bu verifier login emas: consumed replay va sessiya chiqarish bitta
   keyingi durable tranzaksiyaga bog‘lanadi.
3. Delegated Admin mutation scope/capability va staff bootstrap/provider ochiq.
   Admin huquqi rol nomining o‘zi bilan kengaytirilmadi. Roster/publish boshqaruvi
   haqiqiy current grant va tegishli vakolat bilan ulanishi kerak.
4. Oddiy hisobdagi musbat kasr va ikki kasrli ko‘rsatish tasdiqlangan. DB
   precision/scale/range, decimal kirishini parse qilish, midpoint rounding va finite
   JSON number serialization hali reviewed policy emas. Ichki `Ratio` yordamchisi
   aniq formulani tekshiradi; u storage/wire siyosati yoki yangi API turi emas.
   HALF_UP tasdiqlangan qaror sifatida qabul qilinmadi.
5. Statistik bonus formulasi va mahsulot huquqlari saqlanadi, ammo yangi bonus
   endpointi/snapshot storage/idempotency implementatsiyasi bu bosqichga qo‘shilmadi.
   Oddiy natija unga bog‘lanmadi. Rasch keyingi bosqichda qoladi.
6. Haqiqiy fizika savollari, to‘g‘ri kalitlar, davomiylik, roster va kirish oynasi
   berilgani tekshirilmagan. Telegram Mini App launch, bot identity/token hamda
   staffning amaldagi kirish usuli tasdiqlanmagan. Sun’iy fixturelar bularni
   almashtirmaydi.

Asosiy start/save/submit formulalarida yangi o‘zaro zid mahsulot talabi topilmadi.
Initial individual toggle `false` — UI boshlang‘ich tanlovi; required booleanni
APIga yubormaslik uchun ruxsat emas. Lokal validator shu farqni saqlaydi.

## Hozir lokal ishlaydigan qismlar

`supabase/functions/univeracademy-api/` ichida faqat TypeScript va platforma
WebCrypto/structuredClone imkoniyatlaridan foydalanuvchi, dependency talab qilmaydigan
yadro tayyorlandi:

- `telegram.ts`: raw initData HMAC tekshiruvi, ikki nusxadagi fieldlarni rad etish,
  aniq berilgan vaqt oralig‘i va signed user identity tekshiruvi. Haqiqiy botga
  so‘rov yubormaydi; proofni iste’mol qilmaydi va token chiqarmaydi.
- `ordinary.ts`: nonempty/four-option/pinned-key/explicit grading validatsiyasi;
  off rejimda base1, on rejimda musbat aniq kasr; wrong/unanswered0;
  earned/max/percentage uchun yaxlitlanmagan exact ichki manba.
- `attempts.ts`: admission/start/resume, bir marta yaratilgan shuffle va snapshot,
  current identity/scope/generation shartlari, CAS save/clear, deadline,
  submit/result holat o‘tishlari va kalitni bermaydigan ichki student projection.
  Caller bergan `existing` yozuv o‘quvchi+stable demo bo‘yicha barcha
  assignment/guruh/versiyalardan qidirilgan bo‘lishi shart.
- `fault.ts`: joriy kontrakt kodlariga mos ichki xatolar. HTTP mapper keyinchalik
  to‘liq envelope va yangi request_id qo‘shadi.

`StudentAccess`, admission, current attempt va published snapshot — serverdan
olinadigan ichki ma’lumot. Ularni request bodydan ko‘chirib yaratish authorization
emas. Staff JWT verifikatsiyasi va opaque sessiya ledgeri hali yo‘q. Ichki
`Transition.record` kalit va storage ma’lumotini tutadi: u hech qachon HTTP javobiga
chiqarilmasin. Faqat alohida, kontraktga tekshirilgan mapper javob beradi.

Funksiyalar pure transition qaytaradi; ular **saqlash muvaffaqiyati haqida ACK emas**.
Keyingi storage adapteri lock olishi, fresh server clockdan foydalanishi va barcha
o‘zgarishni commit qilishi shart. Kech save `expired` record va ordinary bilan birga
409 qaytaradi: bu holat avval commit qilinadi, xato sabab tranzaksiya rollback
qilinmaydi. Xotiradagi test concurrency yoki durability dalili emas.

## Minimal ketma-ket implementatsiya

1. Exact API xeshi bo‘yicha Backend/consumer review; numeric va pilot uchun zarur
   session/current-scope konfiguratsiyasini aniq yopish. Productsiz texnik bandlar
   yangi mahsulot huquqi deb talqin qilinmasin.
2. Alohida reviewed schema/storage rejasi: membership/current series, unique
   person+stable demo, javob CAS, committed ordinary, initData consumed proof va
   refresh family ledgeri. Hozir migration yozilmagan yoki qo‘llanmagan.
3. Telegram login/refresh/logout va staff provider verifikatsiyasini storagega
   ulash; joriy auth va scope har chaqiruv/replayda qayta tekshiriladi.
4. Admin tayyorlagan fizika testi/versiya/publish; vakolatli Teacher/Admin rosteri;
   xususiy media va kalitning erta chiqmasligi. Default45 editable, individual
   initial off saqlanadi. O‘quvchi o‘zini guruhga qo‘sha olmaydi.
5. Start→timer/resume→CAS save→submit→ordinary/result HTTP mappingini ayni
   kontraktga ulash. DB lockdan keyingi clock, commitdan keyingi ACK, idempotency
   receipts, recovery/generation va deadline race tekshiriladi.
6. Mini App va minimal admin UI bilan integratsiya; real Telegram/staff kirishi;
   happy path, IDOR, replay, uzilish, parallel save/submit/deadline, scope revoke,
   recovery va javob yo‘qolmasligini real storage ustida tekshirish.
7. Ruxsatli deploy va smoke; so‘ng haqiqiy 10–30 kishilik fizika piloti. Fizika
   muvaffaqiyatidan keyin matematika. Bonusning pilotdagi navbati alohida
   muvofiqlashtiriladi, asosiy ordinary oqimni kutdirmaydi.

## Dastlabki vaqt bahosi

Bu tekshirilmagan loyihani rejalashtirish bahosi, kafolat yoki kalendar deadline
emas. Bir ish kuni taxminan bir mutaxassisning to‘liq ish kunini anglatadi.

| Qism | Taxminiy faol ish |
|---|---|
| Backend auth/storage/HTTP va unit tekshiruvlar | 2–4 ish kuni |
| Minimal o‘quvchi Mini App | 1–2 ish kuni |
| Minimal admin test/publish/roster oqimi | 1–2 ish kuni |
| Integratsiya, xavfsizlik va race/uzilish sinovlari | 1–2 ish kuni |
| Alohida ruxsatli deploy, smoke va birinchi real urinish | 0.5–1 ish kuni |

Kontrakt, content va kirish konfiguratsiyasi tayyor bo‘lib, Backend/Mini App/Panel
ishlari parallel olib borilsa, birinchi haqiqiy o‘quvchining test ishlashi uchun
taxminan **4–8 ish kuni**. Hammasi bitta ketma-ket ish oqimida bo‘lsa **6–12 ish
kuni** atrofida. Bu baho 10 ming parallel o‘quvchi sig‘imini yoki platformaning
barcha kelajak funksiyalarini qamramaydi.

Hozir faqat Backend sessiyasi tekshirildi; boshqa agentlarning tayyorligi va
ish jadvali bu hisobda tasdiqlanmagan. Real savol/kalit, bot/staff kirishi,
kontrakt/numeric review, DB o‘zgarishi va deploy ruxsatini kutish vaqti yuqoridagi
faol ishga kirmaydi. Noaniqlik katta; birinchi storage/HTTP integratsiyasidan
keyin baho toraytiriladi.

## Dalil va chegara

Node.js `v24.22.1` bilan repo rootidan:

```sh
node --test tests/backend/*.test.ts
```

Birinchi ishlatishda 23/23 lokal test o‘tdi: HMAC/tamper/wrong bot/vaqt/duplicate
fields; admission/full duration; CAS/clear; deadline save/late submit; current
scope/generation; private projection va exact ordinary. Barcha identity,
vaqt, javob kaliti va bot tokeni sun’iy. Testlar HTTP, haqiqiy sessiya replay
ledgeri, PostgreSQL/RLS, DB concurrency, media, UI yoki pilotni tekshirmaydi.

Ponytail cloud skill ko‘rsatmalari o‘qildi va qo‘llandi. ECC bu sessiyada mavjud
deb ko‘rsatilmaydi va o‘rnatilmadi. GitHub upload/commit/push, Supabase/provider
o‘zgarishi, migration qo‘llash, deploy va D disk/foydalanuvchi kompyuteri ishlatilmadi.
