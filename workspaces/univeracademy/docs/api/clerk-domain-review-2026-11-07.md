# Clerk auth/domain lokal ulanish nomzodi

PROVISIONAL / NOT ACCEPTED / NOT UPLOADED. Asos:c78c293acdf9162080c2da796bd0a5d34e4b8c90.
Bu nusxa oldingi SDK-CANCEL-1ni saqlaydi va alohida TCP-CANCEL-1 lokal deltasini
ham qamraydi. Mini App, dependency lock va amaldagi OpenAPI/client o‘zgarmaydi.
Haqiqiy provider, DB, migration yoki deploy ishlatilmagan.

`createConfiguredHttpHandler`ning mavjud konfiguratsiyasida optional `clerk`
bindingi verifier/liveness va mavjud staff validate/newAssignmentId portlarini
oladi. `botToken` faqat Telegram yo‘li kerak bo‘lsa beriladi. Yangi HTTP endpoint,
client yoki framework yo‘q. Konfiguratsiya production deb atalishi bu nomzodni
production uchun qabul qilingan qilmaydi; kind/pool talablarida RAM fallback yo‘q.

## Tranzaksiya yo‘llari

1. Clerk exchange: trusted JWT proof → identity gate va canonical person lock →
   umumiy ClerkAuthRows → mavjud HTTP exchange → bir tranzaksiyada person,
   inactive membership, mapping, replay, old-family revocation, SID fence,
   provenance/binding va proof digest. Reserved person ID core handlerga ichki
   transaction context orqali beriladi; random boshqa account yaratilmaydi.
   Login domain jadvalini yuklamaydi va answer/deadline/historyga yoza olmaydi.
2. Opaque session yoki Telegram: mavjud locator hint → person lock → umumiy auth
   snapshot + scoped StudentHttpRows → mavjud student handler → auth row writer
   va domain writer bir clientda → COMMITdan keyin javob. Refresh/logout va
   tombstone istisnolari core kontrakt bo‘yicha qoladi. Login/refresh/save
   idempotency uchun yangi avtomatik retry yo‘q.
3. Clerk staff: alohida read-only identity locator transaction → sorted actor va
   command target locklari → mappingni qayta tekshirish → amaldagi staff
   role/approval/capability/group/subject yozuvlari → mavjud StaffFirstTestRows va
   staff handler. Bu ilk savol/duration/publish/membership/assignment portidir;
   to‘liq roster CRUD/transfer storage implementatsiyasi deb ko‘rsatilmaydi.

ClerkAuthRows person, provenance, binding, fence va replaylarni barcha ulangan
student reader/writerlar uchun umumiy saqlaydi. JSONB obyekt kalitlari tartibi
xavfsizlik tengligi sifatida ishlatilmaydi; massivlar tartibi saqlanadi.
StudentHttpRows va staff target reader Telegram nullni aynan null o‘qiydi.
Legacy SessionRows yoki Clerk bindingisiz legacy handler active Clerk/unmarked
familyni503 bilan rad etadi; u tekshiruvni aylanib o‘tish yo‘li emas.
Muvaffaqiyatli HMAC Telegram login explicit telegram origin yozadi va oldingi
Clerk SIDlarni monotonic retire qiladi, jumladan eski app family expired bo‘lsa.
Missing F1 hech qachon taxmin bilan tuzatilmaydi; canonical mapping emaildan emas.

Har bir yangi transaction context lokal. Clock person/resource lockdan keyin
olinadi va tegishli provider/read/work/flush chegaralarida qayta tekshiriladi.
Auth proof expiry va commit-uncertainty fail-closed; qaytgan business-error
outcome expiry kabi maintenance yozuvini commit qiladi. Login yangi taymer,
attempt/generation, baho yoki bonus bermaydi. Staff parallel sessiyasi va student
bitta faol family qoidalari saqlanadi; linking yopiq.

## Lokal dalil va chegarasi

Yakuniy muallif tekshiruvi:139/139 PASS, typecheck exit0. Bunda10 yangi domain
integratsiya holati va5 TCP holati bor; qolganlari ta’sirlangan mavjud auth,
storage, first-test va client regressiyalaridir. Bu mustaqil QA qabuli emas.

`tests/clerk-auth/domain-http.test.mjs` mavjud disk-backed statement doublega
ulanadi. Yangi Clerk-only student real offline imzo bilan kiradi, Telegrami null;
profil to‘ldirish → Teacher HTTP publishdan chiqqan version → Admin membership va
explicit assignment → start/save/clear/CAS → boshqa login va qayta ochish →
submit/result/history tekshiriladi. F1 yo‘qolishi, replay, provider denial, unknown
commit, expiry409 maintenance va A capability/receipt replay ham tekshiriladi.

Bu SQL parser yoki PostgreSQL emas. Global queue haqiqiy row-lock/RLS/isolation
isbotini bermaydi; disk fixture haqiqiy baza persistence sinovi emas. Na haqiqiy
Clerk SDK credential, na DB URL/driver constructor avtomatik yaratiladi.
Oldindan hisoblangan sintetik statistik bonus ham login/reload/history davomida
exact va alohida saqlanishi tekshirildi; yangi bonus hisoblash/activation yo‘q.
Auth yozuvlari vaqtida ikkinchi provider javobidagi qisqaroq expiry tugasa,
oxirgi COMMIT tekshiruvi loginni ACKsiz rollback qiladi.

```sh
npm ci --ignore-scripts
npm run setup:validator
node --test tests/clerk-auth/*.test.mjs tests/storage-auth/*.test.mjs tests/persistent-http/*.test.mjs tests/first-test/*.test.mjs tests/enrollment/*.test.mjs
npm run typecheck
```

## Schema/RLS va kelajakdagi qo‘llash/tiklash ko‘rigi

Mashina o‘qiydigan taklif: `contracts/clerk-domain.schema-rls.proposal.json`.
Amaldagi DB schema bor yoki mos deb taxmin qilinmaydi. Supabase RLS va role
bo‘yicha [rasmiy hujjat](https://supabase.com/docs/guides/database/postgres/row-level-security)
ko‘rildi; user_metadata yoki service-role bypass orqali RBAC qilinmaydi.
Tarmoqdagi dastur role/grant/RLS yoki effective extension versiyasi tekshirilmagan.

Kelajak forward tartibi faqat review:1) actual inventory va maxfiylik/ruxsat
ko‘rigi;2) tasdiqlangan backup va mustaqil restore mashqi;3) private role/RLS,
FK/index/deferred F1 va context bootstrap uchun aniq migration reviewi;
4) sun’iy ma’lumotli haqiqiy Postgres sinovlari;5) barcha eski reader/writerlarni
yangilash va auth cutover;6) alohida ruxsat bilan xizmatni ochish. Hozir bu
qadamlarning birortasi haqiqiy bazada bajarilmaydi.

Faol unmarked legacy sessionga provider taxmin qilinmaydi. Ishonchli provenance
dalili bo‘lmasa, reviewed revocation/reauth kerak. API reader/writer va DB
constraint cutoveri bir-biridan uzilib ketmasin. Eski binar oldingi sxemaga
yoza oladi deb taxmin bilan dual-writer ishga tushirilmaydi.

Rollback ham review-only: xizmatni yopib, mos eski dastur nusxasiga qaytiladi;
yangi provenance/F1/fence/replay va terminal digestlar o‘chirilmaydi. Eski DB
snapshotiga qaytish session/proofni qayta ishlatishga ochishi mumkin; mustaqil
recovery chegara/journal va qayta kirish isboti bo‘lmasa xizmat yopiq qoladi.
Avvalgi javoblar/attempt/deadline/ordinary/nullable bonusni reset qilish rollback
usuli emas. Hech qanday backup/dump/SQL/migration yoki provider amali bajarilmadi.

## Roster kontrakt diffi

`contracts/roster-return-policy.proposal.patch.json` qo‘llanmagan JSON Patch va
kutiladigan review holatlarini beradi. Asosiy OpenAPI o‘zgarmaydi va yangi
kontrakt xeshi/client generation qabul qilingan deb aytilmaydi.

Guruhsiz qaytgan registered student ro‘yxatga asl registered_at bilan qaytadi;
login/removal/re-add sana yangilamaydi. Teacher own-group roster o‘qishi va
manage_roster bilan tor membership/discovery qoidalari ajratilgan. Teacher
boshqa affinityga direct member write yoki transfer qila olmaydi. Transfer
Ownerning mavjud umumiy huquqini saqlagan holda Admin vakolati bo‘lib qoladi;
faqat boshlangan faol test to‘sadi, boshlanmagan recovery ruxsati bekor qilinadi.

Ochiq texnik review: asl registered_at mavjud bo‘lmagan tarixiy yozuvlar uchun
ishonchli manba, cursor eligibility o‘zgarishidagi barqarorlik va actual RLS.
Login sanasi bilan backfill qilinmaydi. Teacher roster/discovery va kengroq
membership runtime bu tor ilk-test repositoryda hali implementatsiya qilinmagan;
bu qismning natijasi kontrakt/storage taklifi, ishlaydigan ro‘yxat endpointi emas.
Statistik bonus hisoblash, activation va wire o‘zgarmaydi.
