# UniverAcademy landing manbasi

Bu paket kompyuterdagi `C:\Users\Oybek\Documents\Qadam\web` manbasining eksportidir.
Branch: `local/wip-variant2-blur`; HEAD: `59069c8c37fe0aa738e80632ec8079510cad5516`.
Commit qilinmagan sakkizta o'zgarishning amaldagi fayllari ham saqlangan. Git remote yo'q.
Bu mahalliy, nashr qilinmagan variant2+blur WIP va UniverAcademy nomlash ishidir.
**Uning Verceldagi ishlab turgan deployment bilan aynan bir xilligi tekshirilmagan.**
Paketni exact production backup deb qabul qilmang. Source provenance: `SOURCE_PROVENANCE.json`.
Asl fayllar o'zgartirilmadi; o'chirish, push, deploy va upload bajarilmadi.

## Paket tarkibi

- `landing/`: o'zgartirilmagan editable React/TypeScript/CSS manbasi, barcha public rasm/SVGlar,
  testlar, package.json, package-lock.json, Vite/TypeScript/Tailwind konfiguratsiyasi va shadcn litsenziyasi.
- `landing/.env.example`: manba talab qiladigan muhit o'zgaruvchilari yo'qligi yozilgan.
  Bu landing uchun `.env`, API key, bot tokeni yoki boshqa maxfiy qiymat kerak emas.
- `support/fonts/`: Onest va Young Serif uchun rasmiy Google Fonts omboridan olingan
  tiklash nusxalari; TTF, OFL.txt va METADATA.pb. `FONT_SOURCES.json` kelib chiqishi va xeshlarini beradi.
- `VERIFICATION.json`, `support/verification/`: alohida ZIPdan tiklash tekshiruvlari va loglari.
- `SECRET_SCAN.json`: maxfiy qiymatlarni chiqarmaydigan, fayl nomlari va maqsadli pattern tekshiruvi.
- `MANIFEST.json`, `SHA256SUMS.txt`, `VERIFY_MANIFEST.py`: fayllar ro'yxati, hajmi va SHA256 nazorati.

`.git`, `.openai` eski hosting bog'lanishi, `.vercel`, haqiqiy `.env`lar, node_modules,
cache va tayyor dist paketga kiritilmagan. API/Master kontrakt hujjatlari va eski agent
xotiralari ushbu landing paketiga ko'chirilmagan. `landing/README.md` asl tarixiy matndir;
unda eski loyihaga oid yo'llar va ayrim eskirgan shrift izohlari bor. Joriy eksport uchun
shu yuqori README, provenance va verification fayllariga qarang.

## O'rnatish va mahalliy ishga tushirish

Tekshirilgan muhit: Windows, Node.js **24.15.0**, npm **11.12.1**, Python **3.14.5**.
Lockfile v3; locked Vite 7.3.7. Uning Node talabi: `^20.19.0 || >=22.12.0`.
Python faqat manifest tekshirishga kerak; saytni qurish Node/npm bilan bajariladi.

ZIPni yangi papkaga oching. Avval paket yaxlitligini tekshirish mumkin:

```powershell
python VERIFY_MANIFEST.py
```

So'ng terminalda:

```powershell
cd landing
npm ci --ignore-scripts --no-audit --no-fund
npm test
npm run typecheck
npm run build
```

O'rnatish rasmiy npm registry paketlarini olish uchun internet talab qiladi.
Lifecycle install scriptlari `--ignore-scripts` bilan o'chirilgan; ushbu manbaning
typecheck va buildi shu rejimda tekshirilgan. Lockfileni yangilamang.
Windows PowerShell npm.ps1 ishlashini cheklasa, xuddi shu buyruqlarda `npm.cmd` ishlating;
tizim execution policy sozlamalarini o'zgartirish shart emas.

Foydalanuvchi mahalliy previewni o'zi ishga tushirishi uchun:

```powershell
npm run dev
```

Manzil: `http://127.0.0.1:4173/`. To'xtatish: Ctrl+C. Ushbu eksport jarayonida server boshlanmadi.
Build natijasi `landing/dist/`ga chiqadi; u manba ZIPiga kiritilmaydi.

## Shriftlarning aniq holati

Amaldagi `landing/src/index.css` Onest 400/500/600 va Young Serif 400ni
Google Fonts CSS API orqali yuklaydi. Asl `public` papkada ushbu shriftlarning
mahalliy nusxasi yo'q; asl CSS o'zgartirilmagan. Internet bo'lmasa fallback shrift ishlashi mumkin.
Paketdagi `support/fonts` tiklash nusxalari avtomatik yuklanmaydi va hozirgi runtime
fonts.gstatic.com fayllari bilan baytma-bayt tengligi tekshirilmagan. Ular rasmiy
Google Fonts omboridan o'zgartirilmasdan olindi va SIL Open Font License 1.1 bilan berildi.
Ularni self-host qilish alohida, ochiq ko'rib chiqiladigan CSS o'zgarishini talab qiladi.
Manrope lockfileda bor, lekin ushbu manbada import qilinmaydi.

Rasmiy manbalar:
- https://github.com/google/fonts/tree/main/ofl/onest
- https://github.com/google/fonts/tree/main/ofl/youngserif

## Tekshiruv natijalari

Quyidagi ishlar asl node_modulesdan foydalanmasdan, yangi cache va yangi npm install
bilan `candidate-source.zip`dan ochilgan alohida papkada bajarildi. Final ZIPga
keyin faqat eksport izohlari, loglar va manifestlar qo'shildi. Final ZIP qayta ochilib,
barcha manifestlar va ilova manbasining tekshirilgan nusxa bilan xeshlari solishtirildi.
Natijalar `VERIFICATION.json` va eksport yonidagi `EXPORT_RESULT.json`da yozilgan.

| Tekshiruv | Holat |
|---|---|
| install | PASS |
| tests | PASS |
| typecheck | PASS |
| build | PASS |
| reconstructed_source_unchanged | PASS |
| node_version | PASS |
| npm.cmd_version | PASS |

Testlar mavjud source assertion testlaridir; ular to'liq brauzer/E2E sinovi emas.
Browser/visual tekshiruv, offline shrift ko'rinishi, live Vercel provenance, bot/API,
haqiqiy login/imtihon va deploy bu eksportda **NOT_RUN**. Oldingi 4-noyabr natijalari
qayta bajarilgan deb ko'rsatilmagan; yuqoridagi yangi loglar shu eksport tekshiruvlariga tegishli.

## Vercelga keyinchalik joylashtirish yo'riqnomasi

Bu faqat kelajakdagi yo'riqnoma. Yangi repositoryga upload/push qilish va Vercel deployment
alohida foydalanuvchi tasdig'idan keyin bajariladi. Ishlab turgan loyiha va domenlar
ushbu eksportda o'zgartirilmadi. Yangi repo eski nomda bo'lsa ham Git ulanishi,
repository, branch, commit va deployment manbasini yana tekshiring.

Yangi loyiha uchun build qiymatlari:

| Sozlama | Qiymat |
|---|---|
| Framework Preset | Vite |
| Root Directory | `landing` (ushbu ZIP tuzilishi repoda saqlansa); faqat landing ichidagi fayllar repo ildiziga ko'chirilsa repo ildizi |
| Install Command | `npm ci --ignore-scripts --no-audit --no-fund` |
| Build Command | `npm run build` |
| Output Directory | `dist` (tanlangan Root Directoryga nisbatan) |
| Node.js Version | 24.x; aynan 24.15.0 shu kompyuterda tekshirilgan |
| Environment Variables | Ushbu landing uchun kerak emas |

Tasdiqlangan Preview deploymentdan keyin rasmlar, matn/shrift, mobil menyu, fan dialoglari,
scroll, reduced-motion va demo ogohlantirishlarini brauzerda tekshiring. Hozirgi Vercel
productionni aynan shu paketdan chiqqan deb belgilang demaydi; bu alohida isbotlanishi kerak.
Rasmiy yo'riqnoma: https://vercel.com/docs/frameworks/frontend/vite

## SHA256ni tekshirish

`MANIFEST.json` barcha mazmun fayllarini hajm va xeshi bilan sanaydi. O'zini va
`SHA256SUMS.txt`ni self-reference bo'lmasligi uchun sanamaydi. `SHA256SUMS.txt` o'zidan
tashqari barcha fayllarni, jumladan MANIFEST.jsonni, qamrab oladi.
ZIPning o'zi uchun SHA256 arxiv tashqarisidagi `LANDING_SOURCE.zip.sha256`da beriladi.

```powershell
Get-FileHash -LiteralPath .\LANDING_SOURCE.zip -Algorithm SHA256
```

Asl loyiha yoki eski nusxalarni o'chirishdan oldin foydalanuvchi ZIPni alohida joyga
saqlaganini tasdiqlashi kerak. Ushbu eksport hech qanday tozalash bajarmaydi.
