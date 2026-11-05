# UniverAcademy API Contract — 0.2.7-statistical-bonus-review.1

**2026-11-05, Asia/Tashkent. PROVISIONAL / NOT ACCEPTED.** Companion `openapi-UniverAcademy-0.2.7-statistical-bonus-review.1.json` barcha endpoint/sxemalar uchun bitta machine-readable draft. Backend API egasi; bu paket ilova implementatsiyasi emas.

## 1. Joriy qaror va doira

Ikki faol mexanizm: **oddiy baholash** va **o‘qituvchi ixtiyoridagi statistik bonus**. Rasch/1PL/MAP, θ/b, Z/T, sertifikat darajalari, ularning tugmasi va hisoblash vazifalari keyingi bosqichga muzlatilgan. Hozirgi APIda Rasch endpoint/schema/result uyasi yo‘q. Eski manba ZIP saqlangan; amaldagi ma’lumot yoki kod o‘chirilmaydi. MR2-N01 hal qilingan deb belgilanmaydi, u hozirgi MVPga to‘siq emas.

Manba: `UA-SRC-RESTORE-BONUS-20261105` va `UA-SRC-BONUS-UNANSWERED-20261105`; asl iqtiboslar `USER_DECISION_2026-11-05.md`da. Original bonus formulasi `UA-SRC-GRADING-USER-20261105`dan tiklandi. API wire, SQL saqlash va sinxron transaction mexanikasi texnik review taklifi.

## 2. Oddiy baholash o‘zgarmaydi

Yangi test45 savoldan boshlanadi, o‘qituvchi o‘zgartiradi. Individual baholash initial OFF, required boolean APIga yuboriladi; mavjud testni o‘qishda saqlangan tanlov yo‘qolmaydi. Off: har savol1. On: har savolning balli>0, kasrga ruxsat. Correct→base; wrong/unanswered→0. Ordinary percentage=earned/max×100. Nonempty publish va musbat savol ballari max>0ni ta’minlaydi. Tugashi bilan saqlanadi; ball/max/foiz2 kasrda ko‘rsatiladi. Bonus ordinary qiymat yoki foizni o‘zgartirmaydi.

## 3. Bonus formulasi va cohort

`N = original guruhning aynan shu sessiyasidagi hisobga olingan ishtirokchilar soni`.

`wrong_j = noto‘g‘ri yoki javobsiz javob berganlar soni`.

`share_j = wrong_j/N`.

`final_j = base_j×(1+share_j)`.

Correct o‘quvchi final_j oladi, wrong/unanswered0. Alohida bonus total=correct savollarning final_j yig‘indisi. Bu ordinary ustiga qo‘shib yoziladigan total emas. Base2.5, wrong ulushi0.8→4.5. Bonusda o‘qituvchi base ballari ishlatiladi.

Latest cohort mexanikasi saqlanadi: original group+exact session+pinned version; har pupilga bitta valid current **self-submitted** attempt. No-show/expired/forced/cancelled/ready/in_progress/recovery_lapsed va boshqa guruhlar kirmaydi. All-zero self-submitted pupil kiradi; javobsizlar wrong/Nda hisoblanadi. Eski Rasch davridagi cohort aniqlashtirilishi yangi bonus-specific iqtibos sifatida qayta yozilmaydi; bu o‘rnini almashtirishda joriy selectionning davomidir.

N uchun minimal statistik cheklov yo‘q: N1 ruxsat. N0da ulush aniqlanmaydi; texnik taklif409 BONUS_EMPTY_COHORT, calculation yaratilmaydi, one-shot sarflanmaydi. Buni N≥10/30 kabi minimumga aylantirmang. Kichik guruh ogohlantirishi bloklamaydi. MVP uchun hamma guruhda N va «Kichik guruhda statistik bonus natijasi barqaror bo‘lmasligi mumkin; bu guruh ichidagi qo‘shimcha hisob» mazmunidagi izohni ko‘rsatish tavsiya qilinadi; sun’iy son chegarasi shart emas.

## 4. Faollashtirish va bir martalik natija

O‘qituvchi o‘z guruhi/fani doirasida xohlasa «Statistik bonusni hisoblash»ni bosadi. Owner oldingi huquqi saqlanadi. Admin bu amalni yoki POST replayni bajarmaydi; read/export huquqi o‘zgarmaydi. Oddiy baholash bonus bosilmasa ham to‘liq ishlaydi.

Birinchi snapshotdan oldin haqiqiy kirish muddati yopilgan, **barcha boshlangan urinishlar terminal**, approved-ready recovery boshlash huquqi qolmagan va numeric policy reviewed bo‘lsin. Barrier excluded expired/forced urinishlarning tugashini ham kutadi. Asia/Tashkent, avvaldan ro‘yxatdagi kechikkan pupilning local keyingi kun00:00gacha exclusive boshlash huquqi saqlanadi; auditoriyani erta tugatish uni qisqartirmaydi. Boshlangan attempt full durationni saqlaydi.

Har POST: current auth/scope → canonical session transaction/lock → existing snapshot lookup. Mavjud bo‘lsa ayni receipt200, yangi K va keyingi recovery/roster holati ham qayta hisoblatmaydi. Faqat mavjud bo‘lmasa activation gates/cohort/numeric policy tekshiriladi; barcha hisob va snapshot atomik201. Bitta unique logical identity canonical session+statistical_bonus_v1; K yoki policy versiyasi uniquenessni bo‘lmaydi. N30×45 uchun sinxron transaction texnik MVP taklifi; alohida worker/queue/Rasch job tizimi shart qilib qo‘yilmaydi. Race/idempotency runtime test bilan isbotlanadi.

Snapshot: original session/group/demo/version; selected pupil/attempt identity; published questions/key/base; committed answer va unanswered facts; wrong/unanswered/N/share/final per question; per-pupil bonus total; policy IDs, input hash va calculated_at. Natijalar o‘zgarmas. Transaction to‘liq commit qilinmasdan calculation yoki pupil bonusi chiqmaydi.

## 5. API mapping

| Amal | Auth | Response |
|---|---|---|
| GET `/admin/assignments/{assignment_id}/statistical-bonus` | Staff current group/subject read; pupil emas |200 SuccessStatisticalBonusStatus; GET hisoblamaydi |
| POST shu path, required K, body yo‘q | Teacher own scope, Owner oldingi huquqi; Admin yo‘q |201 yangi to‘liq snapshot;200 existing snapshot;409 not-ready/empty/unreviewed numeric policy |
| Existing submit/result/history/results/export | Existing auth/lifecycle saqlanadi |ordinary+nullable statistical_bonus; eski rasch uyasi yo‘q |

`StudentStatisticalBonusScore={calculation_id,earned_points,calculated_at}`. `AttemptGradingResult={attempt_id,ordinary,statistical_bonus}`; completed ordinary non-null. Bonus hali yoqilmagan, pupil cohortda yo‘q yoki successor old snapshotdan tashqarida bo‘lsa bonus=null. Pupilga wrong counts, savol kaliti, boshqa pupil, staff snapshot berilmaydi.

`StatisticalBonusStatus.can_activate=true` faqat admission_closed, all_started_completed, no pending recovery, no blocker, calculation=null, eligible N>=1 holatda. Falsega blanket inverse qo‘yilmagan. Live auth/profile/state schema tashqarisida qayta tekshiriladi; Admin can_activate=false. MR2-C03dagi eski regression yangi bonus statusida saqlangan. Bonus sinxron completed snapshot bo‘lgani uchun Rasch queued/running/failed/not_estimable enumlari faol kontraktga ko‘chirilmaydi.

Hisoblashdagi base/N/wrong arifmetikasi, participant_count↔attempt IDs, bir pupilga bir urinish va cross-record identity server invariantlari. JSON Schema to‘g‘ri tuzilishni tekshiradi, arifmetik tenglik/DB uniqueness/authni isbotlamaydi. Numeric tavsiya alohida faylda; HALF_UP/decimal scale foydalanuvchi tanlagan talab deb yozilmagan.

## 6. Recovery, history va ko‘rsatish

Mavjud Owner/scoped Admin recovery vakolati saqlanadi. Birinchi hisobdan oldingi valid current submitted successor cohortga kirishi mumkin. Snapshotdan keyingi predecessor/history bonus atributsiyasi o‘zgarmaydi; cancelled predecessor nonofficial. Successor o‘z ordinary natijasi bilan, eski bonussiz. Current/result/history/export joinlari student/groupning o‘zi bo‘yicha bonusni successor ustiga ko‘chirmaydi. Old snapshot original attemptga bog‘liq; kelajakdagi alohida test huquqi cheklanmaydi.

Pupil asosiy earned/max/ordinary percentage2 decimalsni ko‘radi. Optional bonus alohida ball. Bonus foizi yoki max bonusi qo‘shilmadi, A/A+/Milliy sertifikat darajasi chiqarilmaydi. Detailed review gate, cancellation metadata, Telegram auth/session, roles/roster va boshqa non-grading talablar saqlangan.

## 7. Qolgan ishlar va tez boshlash

Hozir foydalanuvchidan yangi Rasch/MAP/daraja qarori talab qilinmaydi. GB-01 javobsiz siyosati yopildi. Qolgan muhim texnik ishlar: Backend numeric/storage/transaction taklifini ko‘rib chiqadi; exact yangi xeshlarni Panel/Bot/QA bilan kelishadi; amaldagi kodning read-only inventorysi asosida implementation vazifalarini beradi. Rasch cutoff, priors, norm va worker tadqiqoti bu navbatga kiritilmasin.

O‘zgarmagan MVP oqimi uchun tayanch: Telegram kirish → Teacher roster/test → start/timer/answer-save → submit/ordinary → own result/history. Optional bonus keyin shu guruh uchun. O‘zgarmagan oqim va mocklari ustidagi ish Raschni kutmaydi; provider/consumer yangi contractga mos integratsiya qiladi.

Pilot oldidan alohida: haqiqiy fizika savollari/key/duration,10–30 pupil roster, test kuni/kirish oynasi; auth/IDOR, timer/save/submit, ordinary/bonus formula, all-started/late-entry, replay/concurrency, group isolation, recovery/privacy/UI tekshiruvlari. Bular bajarildi deb yozilmaydi. Prod migration/deploy/provider o‘zgarishi alohida ruxsat bosqichi; ushbu paket faqat hujjat/OpenAPI.
