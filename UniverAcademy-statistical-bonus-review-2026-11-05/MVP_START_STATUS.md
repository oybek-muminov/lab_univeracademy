# Raschdan tashqari nima qoldi?

2026-11-05. Yangi yo‘nalish: ordinary+optional statistik bonus. Rasch A/A+ topilmasi tuzatilgan emas, keyinga muzlatilgan; hozirgi ishni bloklamaydi.

**Mahsulot baholashi bo‘yicha yangi asosiy tanlov qolmadi:** bonus formulasi qaytarildi, javobsiz savol noto‘g‘ri deb tasdiqlandi. Oxirgi45/editable, individual initial off, positive fractional points, oddiy display2, group/session isolation va Teacher optional mechanics saqlandi. Saqlash/wire tavsiyalari mahsulot tanlovidan alohida.

| Qolgan ish | Nega kerak | Qachon |
|---|---|---|
| Backend yangi kontraktni ko‘rib chiqishi |0.2.7dagi bonus wire va qayta so‘rov/transaction qoidasi amaldagi backendga mosligi; oldingi qabul yangi faylga o‘tmaydi | Tegishli hisoblash/API implementatsiyasidan oldin; eski o‘zgarmagan oqimni o‘rganish/mock tayyorlashni to‘xtatmaydi |
| Sonlarni saqlash/yaxlitlash | Musbat kasr ball va recurring foiz/bonus uchun aniq authoritative representation, actual DB bounds, display tie policy. Tayyor tavsiya bor, yangi Rasch tadqiqoti kerak emas | Backend texnik ko‘rigida, saqlash va serializatsiyadan oldin |
| Amaldagi kodning read-only inventari | Hozir qaysi modul ishlashi/yo‘qligi bu paketdan bilinmaydi. Tayyor kodni qayta yozmaslik va konkret vazifa berish uchun | Ishning boshida |
| Qolgan umumiy API texnik bandlari | Avvaldan ochiq delegated Admin capability/scope, bootstrap identity/provider sozlamalari, session/notification/media/polling/rate-limit qiymatlari, approval expiry/self-review kabi bandlar saqlangan | Backend ularning MVPda ishlatiladigan qismini aniq ajratib, auth/xavfsizlikka ta’sir qiladiganini pilotdan oldin yopadi. Future funksiyalarni kutish shart emas |
| Panel/Bot/QA ayni API xeshiga mosligi | Tugma, ordinary/bonus natija, history/recovery bir xil ma’noda ishlashi | Consumer implementatsiyasi/integratsiyasi davomida |
| Haqiqiy app/DB/UI sinovlari | Local schema/formula tekshiruvi Telegram auth, parallel retry, timer/save/submit, DB bir martalik yozuv, privacy va recovery ishini isbotlamaydi | Haqiqiy o‘quvchilarni kiritishdan oldin |
| Demo ma’lumotlari | Fizika savollari va to‘g‘ri kalitlar, savollar soni, davomiylik,10–30 pupil ro‘yxati, kun va haqiqiy admission oynasi hozir taqdim etilmagan | Pilot tayyorlashda |

## Eng qisqa ish navbati

1. Dotga yangi paketni bering. Backend bitta qisqa ko‘rikda API/numeric/transaction bo‘yicha accept yoki aniq blocker yozsin va amaldagi kodning read-only inventarini bersin. Oldingi Rasch masalalari bu navbatga qaytmasin.
2. O‘zgarmagan asosiy demo oqimi ustida ish: Telegram kirish → Teacher roster va published test → boshlash/timer/javob saqlash → submit va ordinary → o‘z natijasi/history. Boshlashga Rasch yoki kelajak ta’lim/to‘lov funksiyasini shart qilmang.
3. Shu tasdiqlangan kontraktga optional bonus GET/POST, Panel tugmasi va Mini App alohida bonus natijasini integratsiya qiling. Oddiy natija bonus bosilishini kutmaydi.
4. QA bilan actual happy path/negative/auth/concurrency/recovery tekshiruvi, so‘ng ruxsat etilgan muhitda10–30 pupil fizika demo.

Bu reja implementatsiya bajarildi yoki ishlab turgan bazaga ruxsat berildi degani emas. Ushbu ishda agentlar bilan aloqa, kod/baza/migration/provider/GitHub/deploy o‘zgarishi bo‘lmadi. Faqat yangi mahalliy hujjat va OpenAPI review paketi tayyorlandi. Dot uchun tayyor matn `DOT_TASK.md`da.
