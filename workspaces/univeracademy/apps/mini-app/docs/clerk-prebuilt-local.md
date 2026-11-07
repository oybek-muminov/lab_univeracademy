# Tayyor Clerk formasi: lokal texnik nomzod

Holat: LOCAL_CANDIDATE; mustaqil QA va haqiqiy provider sinovi bajarilmagan.
Asos: lab `31b2b00ecd1c413e1f828fef4c023c3ff2310909`, Backend172
`c78c293acdf9162080c2da796bd0a5d34e4b8c90`. API hanuz provisional.

Foydalanuvchi qarori: tayyor Clerk formasi asosiy kirish yo‘li bo‘ladi;
avvalgi oyna test/zaxira sifatida saqlanadi. Yangi dizayn, appearance override,
CSS yoki ro‘yxatdan o‘tish/email matni bu ishda yaratilmagan. `docs/review/`
avvalgi foydalanuvchi ko‘rigidagi loyiha baytlarini saqlaydi; ular tasdiqlangan
provider email shabloni yoki Clerk formasining tarjimasi hisoblanmaydi.

## Asosiy yo‘l

`main.tsx`dagi mavjud `VITE_AUTH_ENTRY=common` tanlovi →
`mountCommonProductionEntry` → haqiqiy `ClerkProvider` →
`CommonClerkEntry` → `PrebuiltReadyEntry` → haqiqiy `@clerk/react@6.18.6`
`SignIn`. `withSignUp`, hash routing va popup OAuth tanlangan. Formaning o‘zi
Clerk tomonidan beriladi. Google/email OTPning ochiqligi, tenant sozlamalari,
formaning tili, qo‘shimcha tasklar va provider email maketi haqiqiy Clerkda
hali tekshirilmagan; Dashboardga hech narsa yozilmagan.

`production.env.example` hali bo‘sh: tanlov yoki haqiqiy origin/key yoqilmagan.
Bo‘sh tanlov oldingi Telegram entryni saqlaydi; commonning noto‘g‘ri/bo‘sh
konfiguratsiyasi SDK/APIga chiqishdan oldin yopiladi. Telegram alohida mavjud
opt-in orqali ixtiyoriy. Hech qanday yangi endpoint/dependency yo‘q.

Provider va komponentning majburiy qaytish manzili konfiguratsiya tekshirgan
bir xil originning `/sign-in` manzili. Querydagi redirect manzili olinmaydi.
`/auth/callback` faqat avvalgi SDK callbackini yakunlaydi; u ilova sessiyasini
avtomatik ochmaydi. WebView/tashqi brauzer uchun state/nonce/PKCEga bog‘langan
qaytish protokoli bajarildi deb ko‘rsatilmaydi. Aniqlangan Telegram WebViewda
SDK sessiyasi yo‘q bo‘lsa formani ochish bloklanadi; mavjud ogohlantirish va
opsional Telegram yo‘li saqlanadi. WebView aniqlash ishonchli identity dalili emas.

Faol, tasksiz SDK sessiyasi bo‘lsa vendor formasi mount qilinmaydi. Mavjud
“Tasdiqlangan hisob bilan davom etish” amali yangi default SDK proofini
`getToken({skipCache:true})` bilan oladi → Backend egasining production clienti
`POST /api/v1/auth/clerk` → opaque ilova sessiyasi → `/me` → `/exams`.
Clerk cookie/session/user metadata o‘zi kabinet yoki rol bermaydi. Ro‘yxatdan
o‘tish, test, CAS/taymer, saqlash, submit/natija/tarix mavjud oqimdan foydalanadi.

## Sessiya chegarasi

- Prebuilt gate explicit amaldagi SDK session IDni kuzatadi. Tashqi session
  o‘zgarsa eski kabinet darhol renderdan yashiriladi va eski app konteksti
  retire qilinadi. Yangi session avtomatik exchange qilinmaydi.
- React effectdan oldin yangi Continue bosilsa ham eski ready flow yangi
  session IDga qayta nomlanmaydi: avval reset/cleanup tugaydi.
- Reset lokal state/epochni darhol tozalaydi; endi kuzatiladigan cleanup
  Promise ham qaytaradi. Native vendor formasi oldingi captured SDK signout
  tugaguncha qayta mount qilinmaydi.
- Own logout observer expectationni oldindan olib tashlaydi. Shuning uchun
  o‘z SDK session-null xabari captured app logout ACKni supersede qilmaydi.
  Mavjud body-only logout receipt va targeted SDK signout saqlanadi; kech
  signout yangi SDK sessionni global ravishda tozalamaydi.
- Cancel yoki eski exchange bodydan keyin kech success appni qayta ochmaydi.
  F1/receipt/transport, auth-refresh, CAS/deadline hisoblash kodlari o‘zgarmagan.
- Linking bloklangan; provider email/name profilega avtomatik yozilmaydi.

## Zaxira va sinov chegarasi

`common-backup-entry.tsx` oldingi custom oynani saqlaydi. Uni faqat alohida
`tests/clerk-react.fixture.mjs` import qiladi. Production entry unga fallback
qilmaydi va undan import olmaydi. Avvalgi alohida synthetic prototype faqat
mavjud dev/test rejimida qoladi. Production build tekshiruvi synthetic driver
markerlarini va custom formaning aniq matnlarini bundlelardan rad etadi.

`tests/clerk-prebuilt.fixture.mjs` haqiqiy SDK React wrapper/hooks bilan
synthetic clientning `mountSignIn` interfeysini tekshiradi. Undagi aniq test
control vendor dizayni sifatida ko‘rsatilmaydi; vendor ClerkJS UI yoki FAPI
olinmaydi. Prooflar test serverida RAMda yaratiladi va browserga stdin/evaluate
orqali beriladi, log/fayl/URLga yozilmaydi. HTTPS reserved domenlarni localhostga
yo‘naltirish faqat test bridge; u production CORS dalili emas.

Brevo, haqiqiy Clerk/Google/email/Telegram, account linking, tashqi brauzerga
ishonchli qaytish, haqiqiy DB/provider/deploy va upload: NOT_RUN.

## Tekshiruv buyruqlari

Node24; mavjud lockdagi aniq dependencylar. Ilova katalogida:

```sh
npm run check
node --unhandled-rejections=strict --test --test-reporter=tap tests/common-entry-prototype.test.mjs tests/clerk-review-entry.test.mjs tests/clerk-sdk-adapter.test.mjs tests/common-production-runtime.test.mjs tests/clerk-prebuilt-session.test.mjs
node tests/clerk-prebuilt-browser.mjs
node tests/clerk-react-browser.mjs
node tests/production-entry-browser.mjs --common-gates
node tests/production-entry-browser.mjs --production-gates
npm run build
```

Python Playwright/Chromium kerak. Listener faqat loopback/RAM. Backend172 va
owner-client guardlari odatdagi test importida to‘liq ishlaydi, o‘zgartirilmagan.
Natijalar va aynan source baytlari alohida evidence manifest/patchga bog‘lanadi.
