# Mini App — lokal transport va lifecycle checkpointi

Holat: **LOCAL CANDIDATE / MOCK TESTED / NO LIVE API / NOT ACCEPTED**. Ushbu bosqichda upload/commit/push, provider, database yoki deploy amali yo‘q. Oldin chop etilgan `e8195bf39de0c3353854db718315085d43dd98f5` checkpoint muzlatilganicha qoladi.

## Tekshirilgan Backend manbasi va aniq to‘siq

Backendning `25222f787a4e85eb184efb951fc527698b4c3368` commitidagi [mini-app-handoff.md](https://github.com/oybek-muminov/lab_univeracademy/blob/25222f787a4e85eb184efb951fc527698b4c3368/qa-checkpoints/2026-11-05/backend/docs/api/mini-app-handoff.md) o‘qildi. U API `0.2.7-statistical-bonus-review.1`ni PROVISIONAL / NOT ACCEPTED deb belgilaydi va generated client hali yaratilmaganini aniq aytadi. Pinned OpenAPI LF SHA-256: `51deb7a41d223559022dcb7e17ff24985bd328e51c4a87c797a02763bb801149`.

Shuning uchun kelishilgan HTTP clientga haqiqiy adapter hozir yozib bo‘lmaydi. `packages/api-client`ga yoki Backend yo‘llariga tegilmadi; qo‘lda ikkinchi endpoint/tip ro‘yxati ham yaratilmagan. Quyidagi HTTP xarita mavjud draft yo‘llarini bildiradi, ularni qabul qilingan kontraktga aylantirmaydi. Backend reviewed client/xeshi/origin va session policy bergach transport/session hooklarini hamda wire→UI mappingni o‘sha clientga ulash kerak.

## Hozir nima ishlaydi

- `transport.ts`: explicit HTTPS origin va injected fetch/session hooklari. Default global fetch, origin yoki Telegram SDK yo‘q. Opaque student proof xotirada, credential cookie yuborilmaydi, redirect rad etiladi, no-store ishlatiladi; token/initData loglanmaydi.
- Refresh single-flight; eski access proofi uchun kech kelgan 401 yangi refresh proofini takror rotate qilmaydi. Login/refresh noaniq javobi proofni qayta ishlatmaydi. 401 mutation avtomatik takrorlanmaydi. Logout/auth o‘zgarsa eski javob yangi sessiyaga o‘tmaydi.
- `StudentFlow`: current/history uchun explicit assignment; server holatidan farqli assignment rad etiladi. Save navbati assignment+attempt+generation+question scope’da, bitta in-flight save. ACKgacha muvaffaqiyat yo‘q, xatoda avval reconcile, CAS farqida aniq tanlov. Successor/terminal eski draftni tashlaydi.
- Start/submit journal’i foydalanuvchi+assignment+attempt/generation scope’ida keyni qayta oladi. Injected store bilan ikki yangi instance orqali reload tekshiriladi. Token/initData/javoblar journalga kirmaydi. Storage xatosida memory fallback; bunday holatda reload davomiyligi kafolatlanmaydi.
- Yetti lifecycle alohida. Ready uchun explicit start; submitted/expired/forced uchun own ordinary result; cancelled/lapsed uchun nol yoki soxta rasmiy natija yo‘q. Vaqt server snapshoti va monotonic elapsed orqali; nol local terminal qarori emas. Ordinary va nullable bonus alohida; successor bonusni olmaydi.

Bu request executor reviewed clientning o‘rnini bosmaydi: u faqat `{data: ...}` envelope’ni tekshiradi, to‘liq operation schema validatsiyasi owner clientida qoladi. Session hooklari `Session` wire DTOsi emas, ichki proof projection beradi. Testdagi fetch hech qachon tarmoqqa chiqmaydi.

## Screen → mavjud HTTP → loading/error/retry

| Ekran/amal | Draft HTTP | Lokal holat va retry |
|---|---|---|
| Telegram kirish | `POST /auth/telegram`, `GET /me` | `enter` busy; auth xatosida himoyalangan savol/natija tozalanib yangi kirish UXi. Real initData/login hook hali ulanmagan; initDataUnsafe proof emas, reload yangi initData kafolati emas. |
| Profil | `PATCH /me` | Busyda qayta yuborish yo‘q; required ism-familiya; server registration_complete authoritative. Validation UXi qoladi, scope yo‘qolsa himoyalangan state tozalanadi. |
| Testlar | `GET /exams` | Explicit refresh tugmasi; bo‘sh ro‘yxat va 403/404 xabari alohida. O‘quvchi guruhga o‘zini qo‘shmaydi. |
| Metadata/current | `GET /exams/{assignment_id}`, keyin `GET /attempts/{attempt_id}` | `current(assignmentId)` aniq. Future adapter current IDni `Meta.series`dan topadi; `/current` endpointi qo‘shilmagan. Read xatosida write/submit bloklanadi. |
| Start / ready recovery | `POST /exams/{assignment_id}/attempts` | Explicit tasdiq; bir operation key. Reload GETda committed start topilsa resume, topilmasa explicit start ayni keyni ishlatadi. Hook wire body faqat owner clientdagi confirmed:true shakli bo‘ladi. |
| Taymer / savol | `GET /attempts/{attempt_id}` | Server_now/deadline_at projectioni, shu attemptning frozen tartibi; client reshuffle yoki deadline uzaytirish yo‘q. Foreground/online read; polling qiymati yo‘q. |
| Save / clear | `PUT /attempts/{attempt_id}/answers/{question_id}` | Draft ichki assignment/attempt/generation bilan bound; wire adapter faqat existing expected_revision va selected_option_id/nullni yuboradi, generationni yangi body maydoniga aylantirmaydi. Pendingda saved deyilmaydi; unknown/409da GET, keyin explicit resolution. |
| Submit | `POST /attempts/{attempt_id}/submit`, keyin current read | Pending save yoki stale read bo‘lsa blok; key saqlanadi, noaniq POSTda tahrir to‘xtaydi. UI retry ayni key yoki GET; request body yo‘q. Mutationda avtomatik 401 retry yo‘q. |
| Natija | `GET /attempts/{attempt_id}/result` | Faqat submitted/expired/forceddan own result; nullable ordinary nolga aylantirilmaydi. Nullable bonus ordinary/foizga qo‘shilmaydi. Actual schema mapping owner clientiga qoladi. |
| History | `GET /exams/{assignment_id}/history` | Har test kartasida shu testning tarixi; `history(assignmentId)` explicit. Global taxminiy endpoint yo‘q. Cancelled attribution original historyda qolishi server mappingida tekshiriladi. |
| Sessiya | `POST /auth/refresh`, `POST /auth/logout` | Route implementatsiyasi owner hookiga qoladi; single-flight/uncertain rotation va proof clearing lokal testlangan. Memory-only proof reloadida fresh authenticated launch kerak. |
| Detailed review | `GET /attempts/{attempt_id}/review`, ruxsatli review asset yo‘li | Hali fetch/ekran yo‘q; faqat yopiq matn. Ordinary result kalitga ruxsat bermaydi. |

401 auth/fresh launch; 403 permission; 404 concealed absence; 409 state/reconcile; 422 validation; 429 server Retry-After bo‘lsa explicit retrydan oldin kutish; vaqtinchalik 5xx va offline alohida xabar. Xom server message/token UIga chiqarilmaydi. Rate-limit xabarisiz sonli default yoki auto retry joriy qilinmagan. Media, numeric midpoint rounding va session TTL siyosati tanlanmagan.

## Tekshiruv va qolgan integratsiya

`npm run check`, `npm test`, `npm run build`, `npm run build:demo`, mavjud `tests/browser-smoke.py`; yangi transport testi faqat injected Response/session fixturelari bilan. Production build hali faqat “Ulanish tayyorlanmoqda” ekranini chiqaradi; demo, transport bootstrap yoki live auth u yerga ulanmagan. Backend ichki fayli browserga import qilinmaydi.

Yakuniy test stdout/xesh dalillari `/workspace/shared/mini-app-transport-20261105/`da tayyorlanadi. Bu muallif lokal testlari, mustaqil QA yoki real server durability/concurrency/load dalili emas.

Qolgan to‘siqlar: accepted owner client/xesh, real origin, session storage/refresh policy; reviewed client callbacklarini UIga ulash va full schema validation; haqiqiy Telegram launch/bootstrap; browser reloadida actual auth+server integration; authoritative review/media/cancelled history payloadlari. Hozirgi demo reload bo‘lsa in-memory fixture boshidan boshlanadi; unit reload testi haqiqiy brauzer+server E2E o‘rnini bosmaydi.

Keyingi lokal bosqich: `wire-map.ts` pure projectionlari va pinned draftga tekshiriladigan fixturelar `WIRE-MAPPING.md`da. HTTP client yoki real endpoint bootstrap ulanmagan. Oldingi 22/22 test real integratsiya dalili emas.
