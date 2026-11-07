# Google / email OTP: umumiy kirish oynasi uchun lokal reja

Holat: PREP_ONLY / SYNTHETIC_UI_PROTOTYPE. Asos — lab commit
`39b2d92acb30b6fffa4c0a0638a49218417beffb` Backend nomzodi bilan.
Prototip dastlab9a9dd43/Backend47ed6f8 asosida tayyorlangan.
Bu hujjat yangi HTTP kontrakt yoki tasdiqlangan identity-link protokoli emas.
Real Clerk/Google, email, credentials, DB/provider va deploy ishlatilmagan.
Bu birlashgan manba faqat laboratoriya QA uchun nashr qilinadi.

## Tayyor lokal prototip

Bitta kirish kartasida Google va email kod variantlari bor. Telegram shart emas;
ixtiyoriy Telegram tugmasi prototipda o‘chiq va hisob bog‘lash bajarilmaydi.
Ranglar, tugmalar va karta mavjud Mini App uslubidan olingan. Sun’iy ilova ruxsati
olinganidan keyin o‘sha StudentApp kabineti ishlatiladi. Test oynasi, CAS, timer,
wire mapping, F1/receipt transporti va Backend manbalari o‘zgartirilmagan.

Email faqat `example.test` domenida qabul qilinadi. `246810` — hammaga ko‘rinadigan
sun’iy kod; haqiqiy OTP yoki autentifikatsiya siri emas. Google tugmasi ham provider
oynasini ochmaydi. Xat yuborish, kod muddati tugashi va provider xatolari faqat
fixture natijalari. Real OTP muddati, resend intervali yoki account-link TTL
belgilanmagan. Oldindan olingan namuna natijalari test javoblaridan hisoblanmaydi.

`common-entry-prototype.ts`dagi provider/authorize portlari faqat UI sinov chegarasi.
Ular Clerk SDK metodlari yoki server endpointlari emas. Provider tasdig‘idan so‘ng
alohida sun’iy ilova ruxsati, server profiliga o‘xshash fixture va person mosligi
tekshirilmaguncha StudentFlow ochilmaydi. Profile/person mos kelmasa yoki ruxsat
rad etilsa kabinet ko‘rsatilmaydi. Bekor qilish/context resetdan keyingi kech javob
joriy oynani o‘zgartira olmaydi. Email/kod/proof snapshot yoki localStorage/
sessionStoragega yozilmaydi. Prototype reset haqiqiy Clerk/server logout ACKi emas.

Preview faqat `vite serve --mode auth_prototype`da ishlaydi. Vite command-based
`__AUTH_PROTOTYPE_PREVIEW__` flagi har qanday buildda false. Hatto production build
nomi auth_prototype bo‘lsa ham sun’iy provider/proof/CSS chiqarilmaydi. Mavjud
production main esa hali Telegram bootstrapga ulanadi: ushbu ish uni Clerkga
almashtirmaydi. Runtime/backend guardlar o‘z holicha qoladi.

## Haqiqiy Clerk integratsiyasining taklif qilingan chegarasi

Avval Clerkning standart React SignIn komponentini mos appearance bilan qo‘llashni
ko‘rib chiqish kerak. Uning strategiyalari va social connectionlari instance
sozlamalariga bog‘liq; SDK qo‘shimcha session tasklarini ham ko‘rsatishi mumkin.
Hozir SDK o‘rnatilmadi, versiya yoki instance sozlamasi tasdiqlanmadi.
[Clerk React SignIn](https://clerk.com/docs/react/reference/components/authentication/sign-in).

Email kodi uchun yuborish/tasdiqlash kabi bosqichlar bor. Ushbu prototipning qo‘lda
yozilgan formasi real Clerk custom-flow implementatsiyasi emas. Tayyor component
yetarli bo‘lmasa, aniq tanlangan SDK versiyasiga mos custom-flow alohida review va
test talab qiladi; qo‘shimcha MFA/device/session talablarini complete deb o‘tib
ketish mumkin emas.
[Clerk email-code flow](https://clerk.com/docs/guides/development/custom-flows/authentication/email-sms-otp).

Frontend tasdig‘i ilova ruxsati emas. Backend Clerk sessiya tokenining haqiqiyligini
va kutilgan frontend originini tekshirishi kerak; Clerk authenticateRequest yoki
verifyToken kabi server vositalarida authorizedParties mavjud. Loyiha uchun
issuer, subject, session liveness/revocation, auditoriya va current app-person
mappingi Backend tomonidan kelishiladi. Provider metadata yoki frontend role
pickeridan staff/guruh/test huquqi olinmaydi.
[Clerk server verification](https://clerk.com/docs/reference/backend/authenticate-request),
[Clerk verifyToken](https://clerk.com/docs/reference/backend/verify-token).

## Backend39b2d92 nomzodi: taklif bor, consumer handoff hali yakunlanmagan

Backend39b2d92 lokal createClerkCandidateHandler va POST /api/v1/auth/clerk
exchange taklifini olib keldi. Nomzod Clerk JWTdan mavjud opaque SuccessSession
oilasini qaytaradi; server person mapping, replay/liveness va student sessiya
fence tekshiruvlari sintetik sinovlarga ega. Biroq contracts/clerk-auth.proposal.patch.json
OpenAPIga qo‘llanmagan va NOT ACCEPTED. Generated student-client/types o‘zgarmagan,
exchange metodi hali ularda yo‘q. Mavjud student-client faqat Telegram login hamda
opaque student access/refresh amallarini taklif qiladi. Clerk session tokenini Telegram init_data
maydoniga yoki opaque access o‘rniga berish mumkin emas. Staff JWT kirish yo‘lini
student autentifikatsiyasi sifatida qayta ishlatish ham kelishilmagan.

Bu nashr UI prototipini nomzod HTTPga ulamaydi. Ikkalasi bir repo daraxtida QA
uchun birlashtiriladi; prototipning provider/authorize portlari sun’iy bo‘lib qoladi.
[Backend nomzodi va chegaralari](../../docs/api/clerk-auth-local-proposal-2026-11-07.md).

Backend quyidagilarni rasmiy kontrakt/client va qabul qilingan siyosat bilan yakunlashi kerak:

| Band | Hozirgi holat | Kerakli qaror |
|---|---|---|
| Clerk → app kirish | Unapplied exchange taklifi/lokal handler bor | To‘liq kontrakt/client acceptance va consumer generation |
| Principal | Lokal nomzod issuer + case-sensitive user ID → UUID mappingni tekshiradi | Durable mapping, SQL readers, liveness normalizatsiyasi va revocation review |
| Yangi o‘quvchi | Lokal nomzod guruhsiz, Telegramsiz student yaratadi | Nullable Telegram/durable schema va haqiqiy DB tekshiruvi |
| Student API | Opaque proof kutadi | Shu oilaga tekshirilgan exchange yoki boshqa tasdiqlangan model; client/types yangilanishi |
| Device/logout | Mavjud transport saqlangan | Clerk sessiyasi va bitta faol app oilasi o‘rtasidagi bekor qilish/ACK siyosati |
| Rolga yo‘naltirish | Prototype student kabineti | Server tasdiqlagan student/staff manzillari va ruxsatlar; UI role grant yo‘q |

Bu jadval endpoint nomlarini belgilamaydi. Backend API egasi bo‘lib qoladi.
Clerkning o‘z sessiya/cookie mexanizmi bilan ilovaning opaque sessiyasi alohida
ko‘rib chiqiladi; prototipning RAM modeli real Clerk cookie siyosati deb olinmaydi.
Provayderdan chiqish, app serverdan chiqish va hisob almashtirish kech javoblari
alohida epoch/operationga bog‘lanishi kerak. Mavjud server timer ham logout yoki
qurilma almashtirishda to‘xtatilmaydi.

## Hisob bog‘lash — tasdiqlanmagan

Clerk OAuth akkauntlarini o‘z ichida emailga mos kelganda bog‘lashga urinishi
mumkin. Bu UniverAcademy Telegram personini Clerk principaliga ulash huquqi emas.
[Clerk OAuth account linking](https://clerk.com/docs/guides/configure/auth-strategies/social-connections/account-linking).

Email, telefon, display ID, o‘xshash ism yoki Telegram initDataUnsafe asosida app
hisoblarini birlashtirish taklif qilinmaydi. Keyingi reviewda ikki hisob ustidan
yaqindagi isbot, serverga bog‘langan bir martalik challenge, conflict/rollback,
replay/expiry, current authorization va audit talablari aniqlanishi kerak. Bu
xususiyatlar hali protokol yoki mahsulot qarori emas. Kodda link endpointi,
merge/update, staff grant yoki Telegram claim yozuvi mavjud emas.

## WebView → tashqi brauzer → qaytish — tasdiqlanmagan

Google ayrim embedded user-agentlarda authorizationni rad etadi. Shuning uchun
Chrome ichidagi sun’iy WebView kontekstida Google tugmasi provider/app chaqiruviga
o‘tmaydi; tashqi brauzer tugmasi ulanmagan holda ko‘rsatiladi. Real Telegram iOS/
Android WebView sinalmagan.
[Google embedded user-agent cheklovi](https://developers.google.com/identity/protocols/oauth2/javascript-implicit-flow#disallowed_useragent).

Window.open/deep-link/postMessage orqali tayyor login tasdig‘i berilmaydi. Kelajakda
handoff tanlansa allowed origin/redirect, bir martalik bounded state, qaytishdagi
server-side tasdiq, bekor qilish va boshqa qurilmadagi noto‘g‘ri browser sessiyasi
masalalari review qilinadi. Raw Clerk tokeni, OTP yoki Telegram initData URL query/
fragmentiga qo‘yilmaydi. Frontend context flagi identity yoki authorization emas.
Hozir WebViewdan email orqali o‘tish ham faqat sun’iy UI testi hisoblanadi.
Backend nomzodining Telegram link yo‘li409 bilan mutationsiz rad etiladi; u
tasdiqlangan bog‘lash protokoli emas. Staff device gate bo‘lmasa503 qoladi.
Rejalashtirilgan univeracademy.uz domeni hali tayyor deployment/origin deb olinmaydi;
bu ish domain/DNS/OAuth callback sozlamalarini kiritmaydi.

## Lokal ko‘rish va sinov

`apps/mini-app` ichida mavjud Node24 va provision qilingan dependencies bilan:

    npm run dev:auth-prototype
    npm run test:auth-prototype
    npm run test:auth-prototype-browser
    npm run check
    npm run build

Browser testlari faqat loopback resource GETlarini o‘tkazadi; tashqi request,
HTTP mutation, popup va storagega yozish bo‘lmasligi tekshiriladi. Tests/fixture
sahifalari OAuth callback yoki server API emas. Screenshotlar local test-resultsga
olinadi; runnerga alohida lokal output katalogi berish ham mumkin.

## Keyingi ishlar — hali bajarilmagan

1. Dizayn va oqim holatlarini lokal review qilish.
2. Backend identity/app-session kontrakti, person mapping va kerakli SDK pinini olish.
3. O‘sha aniq client/types bilan sintez transport testlari va mustaqil QA.
4. Faqat alohida ruxsatdan keyin real instance/keys, callback originlari va provider
   sozlamalarini xavfsiz muhitda ko‘rib chiqish; secretlar chat yoki frontendga kiritilmaydi.
5. Tasdiqlangan link/handoff bo‘lsa alohida xavfsizlik va real WebView sinovi.

Bu materiallar laboratoriyada QA uchun source sifatida nashr qilinishi mumkin;
real provider/DB, hisob yaratish/bog‘lash, migrations yoki deploy bajarilmadi. Mustaqil QA va haqiqiy Clerk/Google login NOT_RUN.
