> Public export izohi: quyidagi matn lokal muzlatilgan checkpointning tarixiy hisobotidir. Undagi “upload qilinmagan” va “nashr ruxsati olinmagan” qaydlari snapshot vaqtiga tegishli. Keyinchalik foydalanuvchi faqat Mini App source va tegishli QA materiallarini laboratoriyaga chiqarishni tasdiqladi. Source baytlari o‘zgarmagan. Transfer arxivi va patch ommaviy eksportga kiritilmagan; ARTIFACTS.sha256 faqat shu eksport tarkibi uchun qayta tuzilgan. Joriy tarkib/xesh va cheklovlar PUBLICATION.json’da.

# Bot/Mini App — mustaqil QA uchun lokal checkpoint

Holat: **LOCAL UI MOCK / FROZEN CHECKPOINT / NOT RELEASE**. Mustaqil QA hali o‘tkazilmagan; quyidagilar muallifning qayta tekshiruvi. Haqiqiy Telegram/API, server auth, database yoki real o‘quvchi piloti ishlayotganini bildirmaydi.

Asos commit: `ee250df370c945f719cd574814cdb113c78680af`. Asos tree: `258770f6a136ef17a8982c5c484af4ef159945f1`. Bu sessiyadagi lokal asos; uning GitHubga yuklanganligi da’vo qilinmaydi. Snapshot: 2026-11-05T17:17:36.167028+00:00. Oxirgi xesh tekshiruvi: 2026-11-05T17:20:57.480722+00:00.

14 ta source fayl: 1 ta tahrirlangan, 13 ta yangi; barchasi `apps/mini-app/**`da. Ushbu QA tayyorlashda source fayllari o‘zgartirilmadi. Qo‘shimcha topshirish materiallari repo tashqarisida shu papkada saqlangan. Commit/push/upload, baza/provider/deploy amali bajarilmadi. Nashrga ruxsat olinmagan.

## Aynan qaysi fayllar

M — tahrirlangan, A — yangi. SHA-256 to‘liq fayl baytlariga tegishli.

| Fayl | O‘zgarish | Bayt | SHA-256 |
|---|---|---:|---|
| `apps/mini-app/.gitignore` | A | 11 | `261840b2b4fec747a1a94657ad59a75def3975456e164a353c6234f7f644dab3` |
| `apps/mini-app/INTEGRATION-NOTES.md` | A | 5892 | `faf89ef421decb25c50804b825ce7e57ca7818f2b9edcf50bb46a5516e230631` |
| `apps/mini-app/README.md` | M | 2839 | `83861766b7072c0bf9134a959b42431fed0e887812d1a36a6a7d76c871b2f94f` |
| `apps/mini-app/index.html` | A | 392 | `2ef5f047b3b24c283e8a6d2b4a24f1890119918bb18423a5d4664039cbfabd8a` |
| `apps/mini-app/package-lock.json` | A | 39586 | `f66c74833ac5ccf823c01af561239e1e9f1f6355a9c123e999f97c21926a6f11` |
| `apps/mini-app/package.json` | A | 600 | `a447d40ecda7513cd8051ee2c7d3afd3825ea18a51334f518fd4d9b956c99c37` |
| `apps/mini-app/src/demo-port.ts` | A | 5928 | `5c5118d91c0eee36559b0c422a0cc634a111a200375547c61af9269dc4bc6137` |
| `apps/mini-app/src/demo.tsx` | A | 12531 | `28f53901901f7eeda929dda4c508c1bc27fb3619021b92c60ffa21d66da6dd19` |
| `apps/mini-app/src/flow.ts` | A | 7622 | `ea66902fab8b8d9fc290740eeee17f62ef97e78a039bd68d0c58b3ba0ee2510d` |
| `apps/mini-app/src/main.tsx` | A | 596 | `5f334ae5555e6006768127cd08c26743678339aefb7cb239e2941d8bf695e552` |
| `apps/mini-app/src/style.css` | A | 8838 | `0706e7dd7dd782069e3a73d663b510349b2a38467b46e064f598baa0945513c7` |
| `apps/mini-app/tests/browser-smoke.py` | A | 5198 | `8387524dc6919d492a5d7c356ffcee410e6333191b19d92553e98254dc5a42f0` |
| `apps/mini-app/tests/flow.test.mjs` | A | 4009 | `e242e6a01871027cf3bdb598f2d3a0e5ab475eaf0e789cee3f1aefc747deb5cd` |
| `apps/mini-app/tsconfig.json` | A | 375 | `86ccd56cd605e3df25f579b47a5a50662406cbd2cb4ae5bafb50b888ef7d9dab` |

Mashina o‘qiydigan inventar: `source-manifest.json`; repo rootdan tekshirish: `sha256sum -c <handoff>/source.sha256`.

## Maxfiy ma’lumot tekshiruvi

14/14 source fayl to‘liq lokal regex scan va mazmun bo‘yicha ko‘rildi; lockfile JSON sifatida o‘qildi. Token/JWT/bot token/private key, credential literal, URL userinfo, email/telefon va explicit javob-kaliti mapping tekshiruvlarida topilma: **0**. Har bir fayl uchun alohida izoh `privacy-review.json`da. Bu butun repo/tarix auditi yoki barcha turdagi maxfiy ma’lumot yo‘qligiga mutlaq kafolat emas.

Ism maydonidagi Aziz/Karimov placeholderlari va testdagi Namuna/O‘quvchi sun’iy yozilgan misollar. `sample-*` identifikatorlar, 4 fizika savoli va 6,00/8,00/75,00 natija fixture; haqiqiy pilot savoli/kaliti yoki real foydalanuvchi yozuvi olinmagan. Javoblarni saqlash testlari tanlovni tekshiradi, to‘g‘ri javobni emas.

Ochiq texnik provenance sifatida GitHub repo egasi/havolalari, @univeracademybot, plugin ID va source xeshlari saqlangan. Bularni maxfiy student ma’lumoti deb hisoblamadik; ular ham foydalanuvchiga ko‘rsatiladigan ro‘yxat tarkibida. `node_modules`, `dist`, `dist-demo`, `.git`, `.env`, credential/browser fayllari, screenshotlar, /tmp manba nusxalari va laboratoriya arxivi paketga qo‘shilmagan.

## Tekshiruvlar va qayta bajarish

Muhit: Node 24.22.1, npm 11.9.0, Python 3.12.14, Chromium 155.0.8059.79, Playwright 1.62.0. Ushbu qayta tekshiruv mavjud dependency install ustida bajarildi; yangi clean install sinovi bajarilmadi. Asl dependency o‘rnatish `--ignore-scripts` bilan; yangi dastur/hook o‘rnatilmadi.

`apps/mini-app` ichida:

```sh
npm run check
npm test
npm run build
npm run build:demo
```

Natija: typecheck PASS, 6/6 Node testi PASS, production va demo build PASS. Buyruq stdoutlari `evidence/node-tests.log` va `evidence/typecheck-builds.log`da.

Birinchi terminalda `npm run dev`, ikkinchisida:

```sh
python3 tests/browser-smoke.py
python3 <handoff>/evidence/production-gate.py
```

Browser smoke: 320/390/1280px to‘liq lifecycle, dialog cancel, history, CAS conflict, lost save ACK, yangi generation va deadline read PASS; page errors 0. Production gate: ulanish tayyor emas ekrani, namuna kodi/so‘rovi va tashqi so‘rov yo‘q, page errors 0 — PASS. Dalil: `evidence/browser-smoke.log`, `evidence/production-gate.log`. Static serverdagi `/favicon.ico` 404 server logida ko‘rinadi; bu JS page error emas. Har bir buyruq holati `evidence/test-results.json`da.

`git diff --check` PASS. `mini-app.patch` vaqtincha katalogdagi lokal asosga qo‘llandi; tiklangan 14 faylning har bir SHA-256si snapshotga mos. Oldingi `/workspace/shared/univeracademy-mini-app-local.patch` bilan baytma-bayt bir xil. `mini-app-source.tar.gz` aynan shu 14 fayl; fayl tartibi/vaqti deterministik, credential va buildlar yo‘q. Arxivni lokal bo‘sh katalogga chiqarib, source xeshlarini tekshirish mumkin. Dependency install QAning ruxsatli muhitida bajariladi; test skriptlari Playwright/browserni o‘rnatmaydi.

## Arxitektor talablari va ekran xaritasi

Parent orqali kelgan arxitektor talablari `SCREEN-API-MAP.md`da har bir ekran uchun draft endpoint/loading/error/retry bilan xaritalandi. Mockdagi haqiqiy joriy xulq va hali bajarilmagan real integratsiya alohida ko‘rsatilgan. Xaritadagi yo‘llar pinned OpenAPI draftidan; yangi endpoint yoki API acceptance yaratilmagan. Source xeshlari o‘zgarmadi.

## QA doirasi va ochiq bandlar

Bu paket faqat mock o‘quvchi interfeysini ko‘rib chiqish uchun. API `0.2.7-statistical-bonus-review.1` hali PROVISIONAL / NOT ACCEPTED. `StudentPort` ichki UI projection chegarasi; OpenAPI client yoki mustaqil backend emas. Backend qabul qilgan client/xeshga integratsiya qilinishi kerak.

Keyingi ishlar: haqiqiy Telegram launch va opaque sessiya/refresh; tokenning saqlash siyosati; start/submit keyini reload/relogin davomida tiklash; authoritative lifecycle/error mapping; ready recovery/cancelled history; ruxsatli review/media; admin tayyorlagan haqiqiy fizika testi va roster; birgalikdagi E2E. Namuna reload bo‘lsa boshidan boshlanadi, baholashni bajarmaydi. Haqiqiy server auth/replay/IDOR, database concurrency, WebView/iOS/Android, yuklama va pilot tekshirilmagan.

Kerakli mavjud handoff hujjatlari source ichida: `apps/mini-app/README.md` (run/chegaralar) va `apps/mini-app/INTEGRATION-NOTES.md` (pinned manbalar, Backend/arxitektorga bandlar, plagin tekshiruvi). Parent u yerdagi bandlarni tegishli agentlarga yetkazishi kerak. Ponytail qo‘llangan; ECC topilmagan va ish unga bog‘lanmagan.

Nashr holati: **PENDING USER AUTHORIZATION — no upload attempted**. Source va topshirish artifact xeshlari aniq baytlarni belgilaydi; fayl o‘zgarsa xesh ro‘yxati yangilanishi kerak. Parent foydalanuvchiga aynan qaysi source yoki artifactlar yuklanishini ko‘rsatib, alohida ruxsat oladi.
