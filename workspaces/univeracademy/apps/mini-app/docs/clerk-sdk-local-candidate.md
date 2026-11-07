# Clerk SDK lokal nomzodi — 2026-11-07

Holat: lokal muallif sinovi. Rasmiy production integratsiya yoki mustaqil QA tasdig‘i emas. Asos: laboratoriyadagi `0dcb603cc7fb77fc6abe9df9f58fc4b955cde9a5`. Backend133, uning manifesti va browserga ko‘chirilgan owner-client baytlari o‘zgarmagan. Kontrakt `f6226aa1cea63ae1fbc603b80aed9232bc4dd5213c4cc081cc13300ee0179b28` hanuz provisional.

## SDK va kirish

`@clerk/react` **6.18.6** aniq versiyaga pinlandi; lockfile saqlanadi. React6 public `useSignIn`/`useSignUp` Future API, `useClerk`, `HandleSSOCallback` ishlatiladi. Legacy yoki SDKning ichki maydonlari chaqirilmaydi. O‘rnatishda lifecycle scriptlar ishlatilmadi. Clerk SDKning remote browser skripti real muhitda keyin yuklanadi; uning haqiqiy baytlari bu vazifada olinmadi yoki bajarilmadi.

Umumiy entry faqat `VITE_AUTH_ENTRY=common` bilan tanlanadi; misol konfiguratsiyadagi qiymat bo‘sh. HTTPS app/API origin va mavjud kontrakt hashiga qo‘shimcha public publishable key hamda unga mos Clerk frontend origin talab qilinadi. Secret key browserga kirmaydi. Callback `/auth/callback`, kirish `/sign-in`; host shu SPA yo‘llarini indexga qaytarishi kerak. Host, DNS, CSP va production CORS sozlanmadi. API CORS/Clerk JWT issuer, audience, authorized-party va live-session siyosati Backend vakolati bo‘lib qoladi.

Email kod oqimi `create({identifier, signUpIfMissing:true})` → `emailCode.sendCode()` → `verifyCode()`; faqat Clerkning `sign_up_if_missing_transfer` javobidan keyin `signUp.create({transfer:true})`. Google popup tekshiruvidan keyin `isTransferable` bo‘lsa public transfer ishlatiladi. SDK holati `complete`, faol sessiya va session task yo‘qligi tekshiriladi. CAPTCHA uchun SDKning `clerk-captcha` DOM joyi bor. MFA, Device Trust, Protect yoki qo‘shimcha signup maydonlarini to‘ldirish UIi bu nomzodda yo‘q: ular kabinetni ochmaydi. Real Dashboard email-code, Google, Open access va majburiy maydon sozlamalari bilan mosligi hali tekshirilmagan; xavfsizlik siyosatini shu frontend uchun yumshatish taklif qilinmaydi.

SDKdan default JWT `getToken({skipCache:true})` so‘raladi. Bu haqiqiy issuer har safar yangi jti chiqarishini isbotlamaydi. Aynan takror proof bir marta exchangega uringan bo‘lsa qayta yuborilmaydi. JWT faqat owner-clientning mavjud `POST /auth/clerk` so‘roviga boradi; undan keyin ilovaning opaque access/refresh sessiyasi ishlatiladi. Client SDK rollari yoki email orqali mahsulot huquqi yaratmaydi. Profil/imtihonlar oldingi flow/CAS/timer/result/history qatlamidan o‘tadi.

Telegram o‘chirib tashlanmagan: umumiy entryda explicit flag yoqilsa browserda bot havolasi, WebViewda `/telegram` yo‘li mavjud. Bu yo‘l public Clerk konfiguratsiyasiz ham avvalgi Telegram bootstrapiga o‘tadi. Hisob bog‘lash yoki Google uchun WebViewdan tashqi brauzerga xavfsiz qaytish protokoli yo‘q; WebView Google tugmasi auth boshlamasdan emailga yo‘naltiradi. Browserda Telegram SDK ishlashi, haqiqiy bot va initData bu vazifada sinalmagan.

## Cancel, qayta kirish, logout

SDK auth amallari bitta Future resource ustida ketma-ket bajariladi; o‘quvchi HTTP so‘rovlari global bloklanmaydi. Cancel epochni o‘zgartirib eski challenge/popupni bekor qiladi. Eski SDK amali tugamasdan yangi SDK auth boshlanmaydi. Kech finalize yaratgan sessiya aniq session ID bilan yopishga urinishdan so‘nggina yangi SDK amali boshlanishi mumkin. Yopish muvaffaqiyatsiz bo‘lsa ham eski proof ilovaga berilmaydi; providerda orphan sessiya yo‘qligi da’vo qilinmaydi.

SDK sessiya o‘zgarishi ilovani avtomatik ochmaydi. Reload/avvalgi provider sessiyasida foydalanuvchining explicit davom etishi yoki tekshirilgan callback kerak. Callback bekor qilingach kech callback app exchange boshlamaydi. Real OAuth redirect/popup va callbackning provider sessiyasini yakunlashi hali sinalmagan. Callbackni unmount qilish providerning boshlangan server ishini ortga qaytarish kafolati emas.

Logout avval lokal app kontekstini tozalaydi. Oldingi app refresh proof body-only owner logout orqali, Authorization va avtomatik replay/refreshsiz jo‘natiladi. Captured SDK session ID faqat shu receipt tugagach targeted signOutga boradi; global signOut chaqirilmaydi. Kech ACK yangi kontekstni o‘zgartirmaydi. SDK signOut xatosi appning haqiqiy ACKini inkor qilmaydi, provider chiqishi tasdiqlanmagan deb alohida ko‘rsatiladi. App sessiyasi bekor bo‘lgandagi U1 matni Google/emailni ko‘rsatadi va server javoblari/taymeri bilan qayta kirish sinovdan o‘tadi.

## O‘zbek tili va email maketi

| Qism | Hozirgi qamrov |
| --- | --- |
| Bizning entry, email/kod formasi, sanitized xatolar, logout va student UI | O‘zbekcha; brauzerda tekshirildi |
| Clerk prebuilt UI | Bu sahifada ishlatilmaydi; amaldagi tayyor locale ro‘yxatida o‘zbek tili yo‘q. Kelajakdagi komponent uchun custom locale alohida ko‘rik talab qiladi |
| Google consent, CAPTCHA/Protect, browserning o‘z xabarlari, MFA/Device Trust | To‘liq o‘zbekcha deb kafolatlanmagan; unsupported talablar fail closed |
| Clerk hosted Account Portal | Bizning tarjima bilan o‘zgarmaydi; o‘zbekcha deb ko‘rsatilmaydi |
| Email | `email/uz-otp-review.html` va `.txt` lokal ko‘rinish/matn maketi. Yuborilmadi, Dashboardga qo‘yilmadi |

`[TASDIQLASH_KODI]` **review placeholder**; haqiqiy Clerk Handlebars o‘zgaruvchisi emas. Uni Dashboarddagi aynan email-code template taqdim etgan kod o‘zgaruvchisiga moslashtirish va preview/send-test qilish keyingi vakolatli ish. Shablonda tasdiqlanmagan expiry daqiqasi, real qabul qiluvchi, login URLi, tashqi rasm yoki token yo‘q. Subject/preheader va matn tayyor; sender/from/reply-to, domen, branding, DNS/SPF/DKIM/DMARC, yetib borish, Gmail/Outlook va dark mode hali sinalmagan. Domen sotib olinmagan kontekst saqlanadi; hech qanday xizmat sozlanmadi.

## Lokal sinov

Node24.x kerak. Toza nusxada avval `workspaces/univeracademy/` ichida Backendning o‘zgarmagan test bog‘lanishlari uchun `npm ci --ignore-scripts` va `npm ci --ignore-scripts --prefix tests/backend/validator/tooling` bajariladi. Muallif sinovida shu aniq lokal dependency nusxalari qayta ishlatildi. So‘ng `apps/mini-app/` ichida:

```sh
npm ci --ignore-scripts --cache /tmp/ua-clerk-sdk-npm-cache
npm run check
node --unhandled-rejections=strict --test --test-reporter=tap tests/*.test.mjs
node tests/clerk-sdk-browser.mjs
node tests/production-entry-browser.mjs --common-gates
node tests/production-entry-browser.mjs --production-gates
npm run build
```

Node/test browser fixturelari production SDKni almashtirish uchun global slot bermaydi. Ular `tests/`dagi alohida entry va public SDK shape facadeni inject qiladi; ephemeral sintetik JWT process/document xotirasida, haqiqiy exchange/student so‘rovlari yangi loopback RAM serverda bajariladi. Reserved HTTPS test hostlari test transportida localhostga yo‘naltiriladi. Bu production CORS dalili emas. Production builddagi barcha JS/CSS assetlari test-provider markerlariga tekshiriladi. Test isbotlari yakuniy manifest/QA hisobotida keltiriladi. Real Clerk/Google/email, real Telegram, provider, DB, host/deploy, qayta yuklanishda cookie yoki cross-tab SDK xulqi va mustaqil QA — NOT_RUN.

## Rasmiy manbalar

- [Sign-in-or-up custom flow](https://clerk.com/docs/guides/development/custom-flows/authentication/sign-in-or-up)
- [SignInFuture public API](https://clerk.com/docs/js-frontend/reference/objects/sign-in-future)
- [OAuth custom flow va HandleSSOCallback](https://clerk.com/docs/guides/development/custom-flows/authentication/oauth-connections)
- [Localization](https://clerk.com/docs/guides/customizing-clerk/localization)
- [Email/SMS templates](https://clerk.com/docs/guides/customizing-clerk/email-sms-templates)

Manbalar 2026-11-07 kuni ko‘rildi. Ularning Dashboard talablarini bu vazifada o‘zgartirish yoki yoqish amalga oshirilmadi.
