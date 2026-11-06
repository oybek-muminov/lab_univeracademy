# Bot/Mini App — lokal topshirish va muvofiqlashtirish

Sana: 2026-11-05 UTC. Boshlang‘ich checkout: `ee250df` (`docs: establish UniverAcademy project structure`). O‘zgarishlar faqat `apps/mini-app/**`da. Commit/push, laboratoriyaga yozish, database/provider yoki deploy amali bajarilmagan.

## O‘qilgan manbalar

- Lokal `AGENTS.md`, `docs/source-status.md`, `docs/api/README.md`, `docs/ownership.md`, `docs/architecture.md`, `docs/pilot-acceptance.md`, `packages/api-client/README.md`.
- Laboratoriya read-only, pinned commit: `f2c580508cfec9e07f383610201af28edffd854b`.
- [Master 1.5, §0.7/§22 va pilot/UI talablari](https://github.com/oybek-muminov/lab_univeracademy/blob/f2c580508cfec9e07f383610201af28edffd854b/UniverAcademy-statistical-bonus-review-2026-11-05/UNIVERACADEMY_MASTER_CONTEXT.md), Git blob `e9510573b30907f77235641c7ebe561bcb7858d2`.
- [OpenAPI 0.2.7-statistical-bonus-review.1](https://github.com/oybek-muminov/lab_univeracademy/blob/f2c580508cfec9e07f383610201af28edffd854b/UniverAcademy-statistical-bonus-review-2026-11-05/openapi-UniverAcademy-0.2.7-statistical-bonus-review.1.json), Git blob `fbef1d67d95bcf217303d2456aa23c9874232b4b`.
- [Markdown kontrakt](https://github.com/oybek-muminov/lab_univeracademy/blob/f2c580508cfec9e07f383610201af28edffd854b/UniverAcademy-statistical-bonus-review-2026-11-05/UNIVERACADEMY-API-CONTRACT-0.2.7-statistical-bonus-review.1.md), Git blob `03adf97d1bbc79aea34e8127f6a777727ee3a860`. Ushbu matn qisqa grading mapping; to‘liq student lifecycle OpenAPI’dan o‘qildi.

Review holati saqlanadi: **PROVISIONAL / NOT ACCEPTED**. Manbani o‘qish API owner qabuli yoki consumer acceptance emas. Manba paketlari repoga ko‘chirilmadi.

## Backend va arxitektorga yuboriladigan bandlar

Koordinator ushbu bandlarni Backend/arxitektorga yetkazishi kerak: sessiyada boshqa bulut threadiga xabar yuborish vositasi mavjud emas. Ular javob berdi yoki bu bandlarni qabul qildi degan da’vo yo‘q.

| Band | Hozirgi holat / kerakli javob |
|---|---|
| Bot kodi joyi | `docs/ownership.md` taklifini saqlash: webhook auth/update deduplication va biznes amallari Backendda. Mini App launch/UX shu agentda. Alohida `apps/telegram-bot` yoki mustaqil bot serveri yaratilmagan. Dispatcher joyi inventar asosida kelishilsin. |
| Client versiyasi | Backend ko‘rib chiqqan aniq kontrakt xeshi va `packages/api-client` kerak. UI proyeksiyasini o‘sha clientdan map qilish kerak; qo‘lda parallel HTTP client yo‘q. |
| Launch/auth | Bot identity, ruxsatli launch turi, Telegram SDKni berish usuli, initData one-time/replay va opaque student session lifecycle; refreshning noaniq javobi va qayta kirish yo‘li kelishilsin. Frontendda token saqlash yoki TTL tanlanmagan. |
| Save | Draftdagi `expected_revision`, null clear, ACK revision hamda GET reconcile o‘qildi. Generation queue scope; xatolar `REVISION_CONFLICT`, `ATTEMPT_SUPERSEDED`, `ATTEMPT_EXPIRED` va auth/rate-limit javoblarini Backend clientiga bog‘lash kerak. Namuna xatolari haqiqiy error mapping emas. |
| Start/submit | Draftdagi Idempotency-Key va current-auth replay o‘qildi. Operatsiya keyini reload/relogin davomida xavfsiz tiklash siyosati kelishilsin; namuna kalitlari faqat xotirada. Submitdan keyin terminal/expired/superseded farqini authoritative read bilan ko‘rsatish kerak. |
| Timer/recovery | `server_now`, `deadline_at` va current Series/generation manbasi kelishilgan clientdan olinadi. Yangi blank recovery faqat server bergan holat; startable-ready va started-successor UIlari hali haqiqiy integratsiyada tayyorlanadi. |
| Natija/history/review | Oddiy natija darhol, bonus alohida; bonusni boshlash tugmasi o‘quvchida yo‘q. History/cancelled attribution, ruxsatli detailed review va xususiy media keyingi integratsiyada. Hozir kalit yoki tahlil payloadi olinmaydi. |
| Haqiqiy pilot | Admin tayyorlagan savol/rasm, duration, roster, admission oynasi, ruxsatlar va real E2E alohida kerak. Namuna savollari bu materiallar o‘rnini bosmaydi. |

Hozirgi build real Telegram launch yoki authni qabul qilmaydi; browserda Telegram user ma’lumotini trusted identity deb olmaydi. `api.invalid` placeholderdan foydalanilmagan. O‘quvchini guruhga qo‘shish amali UIga berilmagan.

## Plaginlar

To‘liq cloud skill katalogi pagination bilan tekshirildi. **engineering-suite-ponytail** topildi; `entry-ponytail` va `ponytail` o‘qilib qo‘llandi. [Ponytail SKILL.md](skill://plugins_6aa3009e1bdc8191a3e58986ca0131ff/ponytail/SKILL.md). **ECC / Everything Claude Code** tools/cloud/executor skill ro‘yxatlarida topilmadi. Plugin search/install vositasi bu sessiyada ochilmagan; owned personal plugin listing `INVALID_ARGUMENT` qaytardi. Shu sabab ECC ulanmagan va ish unga bog‘lanmagan. Notanish source, hook yoki script o‘rnatilmadi.

## Tekshiruv dalili

`npm ci` uchun lockfile bor; dastlabki o‘rnatish `npm install --ignore-scripts` bilan bajarildi. React/React DOM 19.3.1, TypeScript 7.0.2, Vite 8.3.6 va React type paketlari aniq versiyalarda pin qilingan. Build asoslari [React TypeScript hujjati](https://react.dev/learn/typescript) va [Vite hujjati](https://vite.dev/guide/) bilan tekshirildi.

- Typecheck va ikkala build lokal o‘tdi.
- `npm test`: 6/6 — pending/ACK va clear, lost ACK/reconcile, explicit CAS resolution, generation drop, failed read/deadline, same-key submit retry.
- Browser: `tests/browser-smoke.py` to‘liq oqimni 320/390/1280pxda, dialog cancel, history, conflict/lost ACK/new generation va deadline readni tekshiradi. Haqiqiy APIga request yubormaydi.

Bu frontend mock testlari. Telegram WebView/iOS/Android, real server/database, auth/replay/IDOR, browser reload recovery, haqiqiy baholash, yuklama yoki real o‘quvchi pilotini tasdiqlamaydi. Keyingi vazifa: Backend client/xeshi kelgach bitta fizika guruh testi uchun haqiqiy adapter va Telegram launchni ulash, so‘ng birgalikdagi E2E.
