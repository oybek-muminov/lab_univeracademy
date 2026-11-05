# UniverAcademy — ordinary va statistik bonus uchun qisqa reja

Holat: contract-first review; kod/baza o‘zgarmagan. Backend API egasi. Rasch keyingi bosqichda.

1. Read-only inventory: amaldagi auth/attempt lifecycle, published keys/base points, generations/recovery, results va scope. Existing kod yoki migrationni shu bosqichda o‘zgartirmang. Full initial rollout tayyor deb da’vo qilmang.
2. Yangi OpenAPI diffi, exact decimal/rational numeric policy va sinxron transactionni Backend ko‘rib chiqadi. Bonusda HALF_UP display2 va actual DB bounds aniq tanlanadi; mahsulotning musbat kasr/qayta hisoblamaslik qoidasi saqlanadi. Full standalone worker/queue yoki Rasch kutubxonasi talab qilinmaydi.
3. Ordinary start/timer/save/submit/completion/result minimal oqimi: base>0, off1, required grading boolean; existing race/deadline/generation rules; non-null terminal ordinary, no bonus dependency.
4. Bonus snapshot builder: server derive canonical session, one current submitted per pupil, same full pinned items/key/base, wrong includes unanswered, original group only. N0 reject with no side effects; all-started/admission/ready-recovery barriers checked before first creation.
5. Auth then canonical lock then existing snapshot; only absent-run gates. Unique session+model, transaction atomically persists calculation, input digest, participant/attempt IDs, per-item counts/weights and per-person totals. Same/different K replay same snapshot, no partially visible bonus. Existing ordinary never written by bonus.
6. Projection: pupil own aggregate only; staff snapshot scoped; cancelled predecessor history nonofficial; successor ordinary own and old bonus=null. All read/history/results/export paths agree. Input digest includes stable IDs, keys, published base points, committed answer/unanswered data and policies; unlike postponed Rasch, base points are part of the bonus input.
7. Panel consumes same API; initial individual off; optional bonus button and warning with N. Mini App shows ordinary earned/max/%2 decimals and separate optional bonus points, no certificate.
8. QA runtime proves auth/IDOR, arithmetic, N1/0, all-zero/unanswered,30x45, no cross-group pooling, no duplicate under concurrency, immutable replay after recovery and privacy. Original unchanged non-grading tests retained. Source validation is separate from runtime evidence.

Conceptual DB data, not SQL/migration: immutable calculation identity/session/group/version/policy/hash/time; selected attempts; per-question base/incorrect/unanswered/N and exact weight source; per-person exact total source; relation to ordinary/attempt history. Constraint and representation details are specified against actual schema during Backend review. No production migration/deploy/provider setting is applied by this plan.
