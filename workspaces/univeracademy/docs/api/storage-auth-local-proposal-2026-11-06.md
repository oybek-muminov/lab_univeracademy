# Saqlash va staff JWT — lokal nomzod, qo‘llanmagan schema/RLS taklifi

2026-11-07 continuation: current HTTP bridge/configuration review is in
[persistent-http-review-2026-11-07.md](persistent-http-review-2026-11-07.md).
The text below records the preceding row/auth checkpoint and its17-test evidence.

Asos: laboratoriyaga chiqqan Backend commit
`8f863e645746159466e06dabb56db3b94f26be05`. Bu alohida lokal nomzod;
main/branch/remote/provider/bazaga yozilmagan. API **PROVISIONAL / NOT ACCEPTED**.
Amaldagi public HTTP DTO/kontrakt va oldingi HTTP oqimi o‘zgarmadi.

## Bajarilgan qatlam

`storage/postgres-transaction.ts` URL yoki credential qabul qilmaydi va pool
yaratmaydi. Faqat server ulaydigan `PgPool/PgClient` porti bor. Bitta olingan client
BEGINdan COMMITgacha ishlatiladi. Person gate rowlari UUID tartibida FOR UPDATE;
keyin `clock_timestamp()` olinadi. `now()`/transaction start vaqtiga tayanmaydi.
Callbackdan qaytgan business-error outcome commit qilinadi; exception rollback
qilinadi. ACK faqat COMMIT tasdiqlangach callerga qaytadi. COMMIT javobi yo‘qolsa
`StorageUnavailable(commit_unknown)` keladi, client discard qilinadi va command
avtomatik takrorlanmaydi. Bu HTTPga yangi DTO/error-code qo‘shmaydigan ichki holat.
StorageUnavailable existing ApiFault SERVICE_UNAVAILABLE503dan meros oladi;
unexpected callback exception o‘zgarmaydi va existing mapperda500 bo‘lib qoladi.
Commit-unknown GET/reconcile/idempotent command receipt bilan yechiladi;
shu signalning o‘zi rollback bo‘lganini anglatmaydi.

`storage/attempt-rows.ts` mavjud attemptni scoped person ostida o‘qiydi. Javoblar
alohida satrlar; clear null va revisionni saqlaydi. Yozish expected state revision,
generation, current series va answer revision shartlari bilan himoyalangan. Frozen
version/question order/start/deadline o‘zgarmaydi. Ordinary result immutable alohida
recordga yoziladi; exact num/den JSON decimal strings sifatida qayta tiklanadi.
Bu butun DBni bitta JSONga yozish emas; per-attempt body/frozen content va
normalized answers/ordinary/series portidir. Ordinary uchun katta num/den limitlari
o‘zboshimcha qo‘shilmagan. DB integer-textni JSga o‘tkazishda safe-integer tekshiruvi
bor; yashirin yaxlitlash o‘rniga invariant xatosi beriladi.

`storage/session-rows.ts` mavjud person uchun current account/Telegram identity,
digest proof, family expiry va revocationni lock ostida tekshiradi. Muvaffaqiyatli
login replay fingerprintni unique consume qiladi, eski active familylarni revoke
qiladi va yangi access/refresh digestlarini bitta tranzaksiyada yozadi. Attempt,
javob, revision, generation yoki deadlinega tegmaydi. HMAC/freshness tekshiruvi
callerning mavjud Telegram verifierida bajarilishi SHART; bu ichki row porti
public login endpoint emas. Failed identity/replay/write rollback eski sessiyani
saqlaydi. COMMIT-unknown muvaffaqiyatsiz login deb aniq talqin qilinmaydi.
Refresh consume va access supersession atomic; replay revocation error-outcome
sifatida commit qilinadi. Eski revoked family proofi yangi familyni revoke qilmaydi.
Raw access/refresh/initData yozilmaydi. TTL/skew/retention qiymatlari caller tomonidan
beriladi; ushbu batch ularni mahsulot siyosati sifatida tasdiqlamaydi.

Bu hali `StudentTransactions.transaction(fn)`ning barcha to‘liq RAM-state
callbacklari o‘rniga ulangan adapter emas. Initial identity/profile yaratish, start
admission/grantsni yuklash, assignment/publish/transfer/bulk staff mutations,
command receipts va outbox uchun relational portlar keyingi qadam. Ularni
bajarmasdan RAM global-state loaderni productionga ko‘chirish mumkin emas.

## Schema taklifi — DDL/migration emas

Quyidagi nomlar adapterdagi parameterized SQL statementlarning taklif etilgan
nishonlari. Amaldagi bazadagi schema/role/extension holati inventarlanmagan.
Hech bir SQL DBda bajarilmagan, migration yaratilmagan yoki qo‘llanmagan.

| Mantiqiy jadval | Kalit va invariant |
| --- | --- |
| ua_private.people | UUID PK; verified Telegram ID unique; qadam_id unique; current enabled/roles; person gate |
| student_families | UUID PK, person FK; at most one revoked_at IS NULL family per person using partial unique index; expiry va first revoke/retain_until |
| student_access / student_refresh | digest unique PK, family FK; access expiry/superseded; refresh consumed; raw proof yo‘q |
| init_data_replays | digest global unique; person FK, consumed_at; replay dalillari valid/retry oynasi tugamasdan purge qilinmaydi |
| exam_series | PK(person,stable_demo); generation monotonic; current attempt/official result pointers; normal usage global, guruh almashganda reset emas |
| attempts | UUID PK, person/demo/version FKs; unique(series,generation); immutable started/deadline/frozen version/order; scalar state_revision/generation body bilan teng |
| answers | PK(attempt,question); selected option shu pinned savol variantiga tegishli; selected nullable; revision musbat CAS; row deletion clear emas |
| ordinary_results | PK/FK attempt; immutable exact num/den hamda calculated_at; bir marta terminal completion |
| published_versions / questions / options | private grading key; content snapshot immutable; savol 0<points<=30, exact max3 decimals; version/option referential integrity |
| memberships / grants | current revision/epoch va group affinity; explicit eligible participant; grant/current membership generation mosligi |
| staff_identities / staff_access / scope | trusted issuer+provider sub unique -> person FK; current approved/enabled/roles/capabilities/group AND subject scope |
| command_receipts / outbox | actor+operation+target+K unique; canonical payload hash; safe replay response; notification/outbox writes shu transactionda |

Attempt body/query scalar duplication uchun CHECK/loader equality va immutable
columns constraintlari actual schema reviewda yoziladi. Option FK yoki deferred
constraint trigger pinned-version relationni tekshirishi kerak; JSON schema bu DB
constraint o‘rnini bosmaydi. Foreign-key lookup/indexlar, person+demo va proof digest
indexlari talab qilinadi. Bu batchda DB unique/FK/CHECK yoki SQL syntax bajarilish
dalili yo‘q. Individual question limitini jami ball/bonusga yoyish mumkin emas;
exact numeric storage/projection katta qiymat chegaralari ochiq qoladi.

Umumiy lock tartibi: initial identity gate (hali adapterda yo‘q) -> actor/target
person UUID tartibida -> kerakli membership/assignment config gates -> series ->
attempt -> answer/receipt. Current row adapter mavjud person/attempt/session
qismini amalga oshiradi. Bulk/transfer va admission barrier gate protokoli hali
ulanishi kerak. Har student save uchun assignmentga global exclusive lock
rejalashtirilmaydi. Pool connection faqat bitta transactionga biriktiriladi;
connection context leakage alohida actual-DB sinovi talab qiladi.

## RLS/grant taklifi — hech narsa qo‘llanmagan

Private key/proof/attempt/answer/ordinary jadvallari Data API exposed schema ichida
bo‘lmasin; anon/authenticated uchun direct grants yo‘q. Private schema uchun ham
defense-in-depth RLS taklif qilinadi. App backend roli table owner yoki BYPASSRLS
bo‘lmasin; jadval/rol/privilege inventaridan so‘ng minimal grants va zarur
FORCE RLS strategiyasi review qilinsin. Service-role ishlatilsa RLS bypassi app
authorizationni almashtirmaydi. Views security_invoker yoki private/revoked;
SECURITY DEFINER public RPC default yo‘l sifatida qo‘shilmaydi.

Student opaque session Supabase Auth JWT emas; `auth.uid()` unga avtomatik
moslashtirilmaydi. Row predicate server verified actor/subject mappingdan keladi,
client yuborgan person/group/role headeridan emas. Agar transaction-local context
ishlatilsa SET LOCAL faqat tekshirilgan backenddan, parameterized qiymatlar bilan;
pooled connectionda keyingi requestga qolmasligi actual DBda isbotlanishi kerak.
UPDATE uchun old row USING va yangi row WITH CHECK bir xil ownership/scope
chegarasini saqlasin. Direct student writes taklif qilinmagan: authoritative API
CAS, deadline, session va scope checksdan keyin yozadi.

| Actor/amaliyot | Amaldagi chegara saqlanadi |
| --- | --- |
| Student | own profile/authorized assignment/own attempt; current opaque proof; JWTga aylantirilmaydi |
| Admin assignment | manage_content + current group AND subject scope; manage_roster kerak emas |
| Admin membership/transfer | manage_roster va joriy scope; active attempt guard; ready recovery cancellation |
| Teacher content/publish | approved subject; ushbu batchda yangi group ownership cheklovi yo‘q |
| Bonus | ordinarydan alohida immutable attribution; Admin activation/replay huquqi qo‘shilmaydi |

RLS policy executable matni va grants actual schema qaroridan keyin yaratiladi;
hozirgi predicate jadvali qo‘llanmagan taklif. RLS PASS, grants PASS yoki provider
session liveness PASS deyish uchun real test muhiti zarur; bu ishda u ishlatilmagan.

## Staff autentifikatsiyasi chegarasi

`staff-jwt.ts` jose6.2.15 (exact dependency+lock) bilan signature, pinned issuer,
audience, configured ES256/RS256 allowlist, exp/iat/nbf va UUID sub/session_idni
tekshiradi. HS256, anonymous va service-role tokenlar staff user proof bo‘la olmaydi.
JWTdan app role/capability/user_metadata yoki app_metadata authority olinmaydi.
Token jku/x5u manzili trusted key source tanlamaydi. Trusted key resolver server
configdan keladi; ushbu testlarda faqat yangi lokal public JWK ishlatilgan.
Unknown signature/claims401; key-source outage503; synthetic string proof actual
JWT verifierda401. Haqiqiy provider JWKSga hech qanday so‘rov yuborilmagan.

`requireLiveStaff` person lockdan keyingi DB vaqti bilan proof validityni yana
tekshiradi, serverda yuklangan authoritative StaffState orqali current
enabled/approved/roles/scope manbasini oladi va majburiy liveness portini chaqiradi.
Liveness callback shu transactionga kira oladi; implementation current issuer,
subject va provider session lifecycle/expiry/revocationni tekshirishi kerak.
Faqat session row mavjudligi time-box/inactivity limitlari uchun yetarli emas.
Scope/capability commandning amaldagi handlerida yana tekshiriladi. Bu helperlar
production request composition yoki real staff sign-in handleriga ulanmagan;
actual issuer/audience/JWKS, identity mapping, session read permissions, TTL/AAL
talablari inventar va reviewni kutadi. Missing liveness fail-closed503.

## Lokal tekshiruv va dalil chegarasi

```sh
npm ci --ignore-scripts
npm run test:storage-auth
npm run typecheck
```

DiskExecutor faqat statement name bo‘yicha dispatch qiladigan test double;
SQL parser, Postgres yoki RLS engine emas. Sun’iy satrlar vaqtinchalik lokal faylga
fsync+rename bilan yoziladi. Alohida process shu fayldan repository orqali
javob/revision/deadline/exact kasrni tiklaydi. Bu process-restart va adapter codec
dalili; PostgreSQL recovery, WAL durability yoki multi-process DB race dalili emas.
Driver connect/query SQL faqat shu local doublega berildi; real DB client/pool,
credential yoki provider config yaratilmagan.

Storage testlari: save/clear/stale CAS, restart, lockdan keyingi clock, deadline
tengligi expiry+ordinary409dan oldin commit, write rollback, CAS single winner,
COMMIT-unknown before/after ACK, idempotent submit, login/refresh/save tartibi,
failed login saqlanishi, refresh replay, old-family isolation, foreign scope,
immutable deadline/generation, stale series rollback va unsafe integer rejection.
JWT testlari: real offline ES256 cryptography; wrong signature/issuer/audience,
expiry equality/future/fractional dates, missing session, anonymous/service-role,
current revoked/disabled/unapproved proof va unavailable key/session ports.
Avvalgi exact10/132/128/135 testlar bu alohida qatlam uchun takrorlanmagan.
Yangi jami17 test (12 storage +5 JWT) PASS; typecheck exit0. Bu count eski HTTP
testlarini qo‘shmaydi va actual DB/RLS yoki production auth acceptance emas.

Productionga ulash uchun qolgan blockerlar: current DB/schema/role/provider
inventari; qo‘llanmagan relational constraints/RLS/grants reviewi; full HTTP scoped
repositories va idempotency/outbox integration; actual Postgres isolation/deadlock,
row count/type/FK/unique tests; auth.sessions lifecycle/source permission; real
JWKS rotation/revocation va production session/numeric policy qarorlari.

Rasmiy manbalar (2026-11-06 ko‘rildi): [Supabase changelog](https://supabase.com/changelog),
[JWT/JWKS](https://supabase.com/docs/guides/auth/jwts),
[session lifecycle](https://supabase.com/docs/guides/auth/sessions),
[RLS/current claims](https://supabase.com/docs/guides/database/postgres/row-level-security),
[Postgres locks](https://www.postgresql.org/docs/current/explicit-locking.html),
[Postgres clock](https://www.postgresql.org/docs/current/functions-datetime.html),
[node-postgres transaction client](https://node-postgres.com/features/pooling),
[jose maintainer documentation](https://github.com/panva/jose).
Markdown changelog endpoint content-type sabab ochilmadi, HTML indeks ko‘rildi;
ko‘ringan yangi breaking Flutter/Dart o‘zgarishi bu Node adapterga qo‘llanmadi.
