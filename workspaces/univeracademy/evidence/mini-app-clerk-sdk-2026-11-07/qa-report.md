# Lokal Clerk SDK handoff — 2026-11-07

Muallif nomzodi PASS; mustaqil QA hali bajarilmagan. Asos/HEAD: `0dcb603cc7fb77fc6abe9df9f58fc4b955cde9a5`. 26 fayl: 10 modified, 16 added, deleted yo‘q. Barcha before/after hajm va SHA256lar `candidate-manifest.json`da.

`@clerk/react@6.18.6` public hooklar bilan production common entryga ulandi. Google/email OTP, verified transfer va fresh JWT → pinned Backend exchange → opaque app sessiya ishlatildi. Telegram optional yo‘li saqlanadi. Dev prototip umumiy controllerdan foydalanadi, synthetic provider productionda yo‘q. Backend133 va owner-clientning ikki browser nusxasi/guard algoritmi/pinlari o‘zgarmagan.

268/268 Node test; 320/390/1280 browser — 3/3; common production build gate — 2/2; avvalgi Telegram production gate — 2/2. Email maketi 320/390 — 2/2. Typecheck, default build, tiklangan common build PASS. Pinned base + patchdan tiklangan 26/26 fayl xeshi mos; tiklangan nusxada 33/33 yangi test PASS. Testlar `--unhandled-rejections=strict` bilan.

Dastlab bitta yangi sinov javob variantlari aralashtirilishini hisobga olmay birinchi variantdan qat’iy ball kutgani sabab FAIL bo‘lgan. U Node-only sun’iy fixture IDlari bilan tuzatildi. `full-suite-fixture-order-fail.log` tarixiy dalil; yakuniy natija `full-suite.log`da 268/268.

Brauzer public SDK facade bilan ishladi, haqiqiy Clerk runtime/providerni chaqirmadi. Backend exchange va o‘quvchi oqimi haqiqiy loopback RAM HTTPda; reserved HTTPS → localhost test bridge production CORS dalili emas. Cancel va kech finalize app exchangega o‘tmaydi; begona yangi SDK sessiyasi cleanup bilan yopilmaydi; logout app receiptni kutib aniq SDK session IDni yopadi. App ACK bor, SDK signOut xato bo‘lsa ikkala holat alohida ifodalanadi. U1 Google/email qayta kirish va server deadline/saqlangan javob bilan davom etish o‘tdi.

`docs/clerk-sdk-local-candidate.md`da SDK/API mapping, konfiguratsiya, O‘zbek til qamrovi va to‘siqlar bor. `docs/email/uz-otp-review.html`/`.txt` shunchaki lokal maket; `[TASDIQLASH_KODI]` real shablon o‘zgaruvchisi emas. Real Dashboard mappingi, yuboruvchi va yetib borish sinalmagan. Providerning tayyor Uzbek locale’i mavjud deb aytilmaydi; Google/Clerk/browser/CAPTCHA matnlari to‘liq Uzbek deb kafolatlanmaydi.

Haqiqiy Clerk/Google/email/Telegram, cookie/cross-tab holatlari, OAuth callback va tashqi WebView qaytishi NOT_RUN. WebView aniqlashi mavjud SDK bridgega bog‘liq. Account linking, MFA/Device Trust/Protect yoki qo‘shimcha signup talablarini to‘ldirish UIi yo‘q; kabinet fail closed. Backend kontrakti provisional.

Hech narsa upload, commit yoki push qilinmadi. Asosiy repo, haqiqiy provider, DB, host/DNS va deployga tegilmadi. Maxfiylik tekshiruvi 26 yangi/o‘zgargan fayl va test loglarida token/private-key/JWT literal regexlarini tekshirdi; real ma’lumot yoki javob kaliti qo‘shilmagan. Bu mustaqil xavfsizlik sertifikati emas.
