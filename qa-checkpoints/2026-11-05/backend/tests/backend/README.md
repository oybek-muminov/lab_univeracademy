# Backend tekshiruvlari

Mas’ul: Backend; QA qabul mezonlari bilan muvofiqlashtiradi.

Auth proof/replay/current scope/IDOR, CAS revision/generation, start/deadline/submit/force/recovery race, publication/key privacy, ordinary precision va optional bonus transaction/idempotency/immutable attribution tekshiriladi.

Repo rootidan Node.js24 bilan, qo‘shimcha dependency yoki provider ulanishisiz:

```sh
node --test tests/backend/*.test.ts
```

`attempts.test.ts` start/admission/full duration, CAS/clear, expiry/submit/replay,
current scope/generation, private projection va exact ordinaryni tekshiradi.
`telegram.test.ts` initData HMAC, tamper/wrong bot, vaqt oralig‘i, duplicate fields
va signed identityni tekshiradi. Fixturelar butunlay sun’iy; hech qanday tarmoq
chaqiruvi yoki haqiqiy ma’lumot ishlatilmaydi.

Testlar pure transition/verifier darajasida. Telegram consumed replay/session
ledgeri, HTTP mapping, persistent ACK, real API/DB/RLS va parallel DB yozuvlari,
UI hamda haqiqiy pilot hali tekshirilmagan. RAMdagi transitionni commit deb
hisoblamang. Rounding/storage/wire policy qabul qilingani da’vo qilinmaydi.

