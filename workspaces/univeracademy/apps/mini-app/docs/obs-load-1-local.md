# OBS-LOAD-1 va Backend191 — lokal nomzod

Asos/HEAD: fa82166a5eaaa05a8ae254913039771e03e20bfb.
0a875bf Mini App va barcha oldingi dalillar shu asosda saqlangan. Mustaqil QA
hozirgi tuzatishni hali tekshirmagan; OBS-LOAD-1 yopildi deb belgilanmaydi.

Foydalanuvchi qarori bo‘yicha Clerk kirish joyi hozir “bo‘sh razetka”. Common
production entryda `VITE_CLERK_SDK_ENABLED` aynan `true` bo‘lmasa, mavjud tayyor
emas statusi ko‘rinadi; haqiqiy SDK/formasi, auth va API boshlanmaydi. Hatto
public origin/key mos bo‘lsa ham flag bo‘shligida yuklash yo‘q. Misol envda flag
bo‘sh qolgan. Bu sozlama xizmatga/deployga yozilmagan. Mavjud test/zaxira oyna,
SignIn komponentining kelajak uchun texnik kodi va optional Telegram yo‘li
saqlanadi; yangi dizayn, CSS yoki foydalanuvchi matni ishlab chiqilmagan.

## Sabab va tor texnik tuzatish

Pinlangan @clerk/react6.18.6 orqali @clerk/shared4.44.1 loaderidagi ikkita
funksiya (`loadClerkJSScript`, `loadClerkUIScript`) readiness pollerini qaytaradi,
lekin `loadScript(...).catch(error => { throw ... })` natijasini kuzatmaydi.
Shuning uchun network error bir ushlanmagan Promise rejectionni beradi;
poller taxminan15 sekunddan keyin UI statusini xavfsiz yopadi.

Vite/Rolldown transformi faqat aniq ESM helper fayliga tegadi. Ikki joyda script
Promise saqlanib, poller bilan `Promise.all`ga ulanadi. Yuklash yoki global
readinessdan biri xato bo‘lsa uning rejectioni mavjud ClerkFailed yo‘liga
boradi. Qolgan kech poller ham Promise.all tomonidan kuzatiladi. Xato yutilmaydi,
global rejection/error handler o‘rnatilmaydi, noma’lum xatolar bostirilmaydi.

Transform faqat quyidagi asl baytlarni qabul qiladi:
`00e19858bb6e9d58214cfe4f0df618163bead0d1b0a7308212dd94c3d333a528`.
Versiya/bayt o‘zgarsa build fail-closed to‘xtaydi; node_modules yoki lockfile
patch qilinmaydi. Bir xil transform production build va dev optimizerga ulanadi.
SDK yangilanganda bu mahalliy compatibility patch qayta ko‘rilishi kerak.

## Dalil chegarasi

Avvalgi production entry/SDK bilan reserved-host bloklashda xato qayta hosil
qilindi: safe status15716ms, SDK unhandled1, API0, kabinet yopiq. Bu o‘z lokal
reproducerimiz; QAning asl reproducer baytlari bizga berilmagan.

Yangi loader sinovlari production entry/haqiqiy pinlangan SDK yordamchisidan
foydalanadi; ClerkJS/UI script URLlari browserda ushlanadi. Haqiqiy providerga
so‘rov yuborilmaydi. UI-load shartida minimal test global faqat kerakli keyingi
script xatosiga yetish uchun beriladi; autentifikatsiya yoki ilova sessiyasi
berilmaydi. Har shart17.5 sekund kuzatiladi, shunda eski pollerning kech
rejectioni ham tekshiriladi. Alohida noma’lum rejection negative controlda
hanuz browserga ko‘rinishi shart. Default socket testi script/API/form0ni
tekshiradi. Dev entry uchun alohida test HTML actual production mountni
chaqiradi; odatdagi main DEVda mavjud demo sahifasini tanlaydi.

Birinchi harness urinishlarida expect timeout va ikki buildning bitta output
katalogidan foydalanishi tuzatildi. Ular mahsulot regressiyasi yoki PASS dalili
sifatida ishlatilmaydi; joriy loglar alohida build kataloglari bilan olingan.

## Backend pinlari

Backend egasining BACKEND-CURRENT-SHA256SUMS ro‘yxatidagi190 fayl bayti/xeshi
tekshirilib, ro‘yxat faylining o‘zi bilan191-faylli yangi frontend fixture tuzildi.
Manba fa82166, fixture SHA256:
`1a2588f66f261029753b5756e3783adc5940834839b0bfc339f7bc7ffa31f4f7`.

172-faylli eski fixture tarixiy, aniq pinlangan dalil sifatida saqlanadi.
Size/SHA256 va owner-copy tekshiruv sikllari o‘zgarmagan; fallback yo‘q.
Qo‘shimcha regressiyalar: eski172 manifestni almashtirish/tahrirlash, yangi TCP
abort/domain fayli korrupsiyasi va yo‘qolgan domain testi rad etiladi.

## Lokal tekshiruv

Node24, mavjud exact lock; yangi npm dependency qo‘shilmagan. Ilova katalogida:

```sh
node --test --test-reporter=tap tests/current-flow-guard.test.mjs
node --unhandled-rejections=strict --test --test-reporter=tap tests/clerk-load-promise.test.mjs
node --unhandled-rejections=strict --test --test-reporter=tap tests/clerk-review-entry.test.mjs tests/clerk-sdk-adapter.test.mjs tests/common-production-runtime.test.mjs tests/clerk-prebuilt-session.test.mjs
node tests/clerk-load-browser.mjs
node tests/clerk-load-browser.mjs --dev
node tests/clerk-load-browser.mjs --empty-socket
node tests/clerk-prebuilt-browser.mjs
node tests/production-entry-browser.mjs --common-gates
npm run build
```

Oldingi xatoni qayta ko‘rish uchun `clerk-load-browser` harnessini tuzatilmagan
0a875bf/fa82166 frontend va Vite konfiguratsiyasi bilan alohida daraxtda
`--baseline-control`da ishlatish kerak. Tuzatilgan kodda baseline FAIL bo‘lishi
tabiiy; bu rejim fixni chetlab o‘tuvchi build/env parametrini qo‘shmaydi.

Haqiqiy Clerk/Google/email/Telegram, tenant/Uzbek locale, account linking,
WebViewdan tasdiqlangan qaytish, Brevo, DB/RLS, provider/deploy va upload:
NOT_RUN. Loader tuzatishi haqiqiy provider bilan integration PASS degani emas.
