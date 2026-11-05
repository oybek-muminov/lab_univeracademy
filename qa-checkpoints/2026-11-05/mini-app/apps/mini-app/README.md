# O‘quvchi Mini App

Mas’ul: Bot/Mini App agenti. Holat: **lokal UI namuna, haqiqiy API/Telegram integratsiyasi emas**.

React + TypeScript. Fizika testi uchun namuna oqimi: kirish → ism-familiya → biriktirilgan test → boshlash tasdig‘i → bittadan savol/navigatsiya/taymer → tasdiqlangan javob → topshirish tasdig‘i → oddiy natija va o‘z tarixi.

## Lokal ishga tushirish

Node.js 24+ kerak. Buyruqlar shu papkada bajariladi:

```sh
npm ci --ignore-scripts --cache /tmp/univer-npm-cache
npm run dev
```

Manzil: `http://127.0.0.1:5173`. `Namuna holatlarini sinash` ichida aloqa uzilishi, boshqa qurilmadagi javob, yo‘qolgan tasdiq, yangi urinish va qisqa vaqt holatlari bor. Hech qanday token kerak emas. Namuna faqat xotirada; sahifa yangilansa qaytadan boshlanadi. To‘qima ism ishlating.

```sh
npm run check
npm test
npm run build
npm run build:demo
```

`build` haqiqiy integratsiya yo‘qligini ko‘rsatadigan yopiq ekranni chiqaradi; namuna test kodi/fixture bu buildga kirmaydi. `build:demo` alohida `dist-demo/` yaratadi. Ikki build ham deploy qilinmagan. Runtime dependency React va React DOM; UI kutubxonasi, Telegram SDK, auth/storage kutubxonasi yoki bot xizmati qo‘shilmagan. Dependency install hooklari ishga tushirilmagan.

Muhitda avvaldan mavjud Playwright va Chromium bilan, dev server ochiq holatda:

```sh
python3 tests/browser-smoke.py
```

Bu skript yangi browser o‘rnatmaydi. Playwright muhitda bo‘lmasa, Node tekshiruvlari mustaqil ishlaydi.

## Chegaralar

- `src/flow.ts` UI holatini boshqaradi. `StudentPort` faqat UI proyeksiyalari uchun ichki adapter chegarasi; OpenAPI turlari/endpointlari nusxasi emas.
- `src/demo-port.ts` faqat sun’iy namuna. Natija oldindan berilgan; hech qanday haqiqiy javob kaliti yoki ball hisoblash yo‘q. 4 savol va 12 daqiqa mahsulot limiti emas.
- Saqlashlar ketma-ket. Tasdiq kelmaguncha javob pending; noaniq natijada yangi yozish/topshirish bloklanib, avval qayta o‘qiladi. Farqli tanlov faqat o‘quvchining aniq qaroridan keyin yangi revision bilan yoziladi.
- Draft attempt+generationga bog‘langan; generation o‘zgarsa tashlanadi. Submit retrysi ayni operatsiya kalitini saqlaydi, noaniq submitdan keyin tahrir bloklanadi.
- Taymer oxirgi server vaqt/deadline proyeksiyasidan monotonic elapsed bilan ko‘rsatiladi. Nolga yetishi clientda natija yoki terminal status yaratmaydi; qayta o‘qish kerak. Avtomatik polling intervali tanlanmagan.
- Staff JWT, opaque student token, Telegram initData, refresh token, browser persistence, haqiqiy media va tahlil kalitlari ushbu namunada yo‘q.

Backend bilan kelishiladigan bandlar, manbalar va tekshiruv dalili: [INTEGRATION-NOTES.md](INTEGRATION-NOTES.md). API yagona egasi Backend. API 0.2.7 hali **PROVISIONAL / NOT ACCEPTED**; generated client yoki haqiqiy transport yozilmagan.

