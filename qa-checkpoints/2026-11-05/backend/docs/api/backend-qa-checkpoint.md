# Backend lokal checkpoint — mustaqil QA uchun

Checkpoint: `backend-local-core-2026-11-05.1`.
Holat: **WIP / LOCAL UNIT CHECKPOINT / NOT DEPLOYABLE / NOT ACCEPTED**.
Bu checkpoint mustaqil QA uchun muzlatildi; uning tayyorligi production/pilot
tayyorligi bilan tenglashtirilmaydi. Fayllar lokal va commit qilinmagan.

## Asos va manbalar

- Repo: `oybek-muminov/UniverAcademy`.
- Checkout: `/workspace/UniverAcademy`, branch `work`.
- Asos va hozirgi HEAD: `ee250df370c945f719cd574814cdb113c78680af`.
- API: `0.2.7-statistical-bonus-review.1`, **PROVISIONAL / NOT ACCEPTED**.
- Pinned laboratoriya commit: `f2c580508cfec9e07f383610201af28edffd854b`.
- Manba versiyalari va LF/CRLF xeshlari: [backend-start.md](backend-start.md).
- Consumer auth/save/reconcile/result shakllari: [mini-app-handoff.md](mini-app-handoff.md).

## Aniq fayllar ro‘yxati

`M` — tracked fayl lokal o‘zgartirilgan. `Yangi` — untracked, staging/commit
qilinmagan. Faqat shu 14 fayl checkpoint to‘plamiga kiradi; `.git`, `.env`,
auth.json, provider credentiallari, dump yoki boshqa workspace fayli kirmaydi.

| Holat | Yo‘l | Tekshiruv mazmuni |
|---|---|---|
| M | `docs/api/README.md` | Draft status va lokal hujjat havolalari; credential yoki haqiqiy data yo‘q |
| Yangi | `docs/api/backend-start.md` | Provenance, ochiq bandlar, reja va baho; haqiqiy pupil/test content yo‘q |
| Yangi | `docs/api/mini-app-handoff.md` | Pinned wire qaydi; placeholder/sun’iy shakl misollari aniq belgilangan |
| Yangi | `docs/api/backend-qa-checkpoint.md` | Ushbu QA yo‘riqnomasi; faqat metadata va synthetic topilmalar qaydi |
| Yangi | `docs/api/backend-checkpoint.json` | Fayl yo‘llari, SHA256, hajmlar va audit metadata; haqiqiy credential yo‘q |
| M | `supabase/functions/univeracademy-api/README.md` | Lokal core va HTTP/storage chegaralari |
| Yangi | `supabase/functions/univeracademy-api/attempts.ts` | Server ichki transition turlari; embedded real identity yoki test kaliti yo‘q |
| Yangi | `supabase/functions/univeracademy-api/fault.ts` | Ichki xato turlari; data/credential yo‘q |
| Yangi | `supabase/functions/univeracademy-api/ordinary.ts` | Exact ichki formula va key tipi; haqiqiy savol/kalit konstantasi yo‘q |
| Yangi | `supabase/functions/univeracademy-api/telegram.ts` | Bot tokeni caller parametri; embedded token/parol yoki real initData yo‘q |
| M | `tests/backend/README.md` | Lokal buyruq va test chegaralari |
| Yangi | `tests/backend/attempts.test.ts` | Faqat synthetic fixture identity/option/key qiymatlari |
| Yangi | `tests/backend/fixtures.ts` | Sun’iy savollar, option/key, pupil/guruh/assignment va vaqt; real test emas |
| Yangi | `tests/backend/telegram.test.ts` | Aniq sun’iy bot tokeni va signed synthetic identity; live credential emas |

Har bir faylning haqiqiy lokal bayt SHA256 qiymati va hajmi
[backend-checkpoint.json](backend-checkpoint.json) ichida. Manifest o‘z xeshini
ichiga kiritmaydi; uning SHA256 qiymati parentga beriladigan checkpoint receiptida
alohida qayd etiladi. Har qanday fayl o‘zgarsa bu checkpoint xeshlari eskiradi.

## Public repo uchun data/secret tekshiruvi

Barcha fayllar mazmuni ko‘rib chiqildi va credential/private-key/GitHub-token/AWS-id/
Supabase-secret/Telegram-token-shape/credential-URL/email-shape patternlari bilan
skanlandi. Haqiqiy token/parol/private key, real o‘quvchi ma’lumoti, real savollar
yoki real imtihon javob kaliti aniqlanmadi. Bu ko‘rilgan aniq fayllar bo‘yicha
xulosa; umumiy workspace yoki boshqa repolar haqida da’vo emas.

Aniq sun’iy topilmalar:

- `tests/backend/telegram.test.ts:8`: `const token` sun’iy HMAC test kaliti.
  Telegram-token-shape va credential-literal patterni unga mos tushdi. U faylda
  `SYNTHETIC_LOCAL_TEST_BOT_TOKEN` deb belgilangan; hech qanday haqiqiy botga
  ulanilmagan yoki ishlatib ko‘rilmagan. Uni haqiqiy credential yo‘q degan xulosaga
  qo‘shib yashirmaymiz: **sun’iy token konstantasi faylda mavjud**.
- `tests/backend/fixtures.ts` va `attempts.test.ts`: `synthetic-*` nomli soxta
  savol/option/pupil/group qiymatlari va correct optionlar bor. Bular **sun’iy
  javob kalitlari**; haqiqiy fizika/matematika testi yoki haqiqiy o‘quvchidan
  olinmagan. Raqamli Telegram identity ham sun’iy fixture.
- Source fayllardagi `botToken`, `correctOptionId`, `access_token` kabi nomlar
  algoritm parametri, ichki tur yoki hujjat sxemasidir; real qiymatlar emas.
  Repo owner nomi va ochiq repo/rasmiy dokumentatsiya havolalari source metadata.

Shuning uchun «hech qanday token yoki test kaliti yo‘q» deb mutlaq yozilmaydi.
Aniq xulosa: **haqiqiy maxfiy ma’lumot topilmadi; yuqoridagi sun’iy fixturelar bor**.
Pattern skaneri barcha turdagi secretni matematik kafolat bilan topmaydi; QA shu
ro‘yxat va synthetic istisnolarni mustaqil ko‘rib chiqadi. Tekshiruvda credential
qiymatlari tashqi xizmatga yuborilmadi.

## Bajarilgan tekshiruvlar

Muhit: Node.js `v24.22.1`, bulut workspace. Repo rootidan:

```sh
node --test tests/backend/*.test.ts
git diff --check
```

Joriy kod uchun qayta ishlatishda: **23 test, 23 pass, 0 fail, 0 skipped;
exit code0**. `git diff --check` o‘tdi. Untracked fayllar uchun trailing whitespace
va yakuniy newline tekshiruvi ham alohida bajarildi. Yangi dependency o‘rnatilmadi.

Test qamrovi: Telegram HMAC/tamper/wrong bot/vaqt/duplicate/signed identity;
admission/full duration; CAS/clear; expiry/submit; current scope/generation;
kalitni bermaydigan projection va exact ordinary. Bu testlar pure TypeScript
yadroga tegishli, real HTTP/Auth/PostgreSQL/RLS yoki parallel DB yozuvlariga emas.

Manifestdagi fayl xeshlarini lokal tekshirish:

```sh
python - <<'PY'
from pathlib import Path
import hashlib, json
root = Path('.')
manifest = json.loads((root / 'docs/api/backend-checkpoint.json').read_text())
for item in manifest['files']:
    data = (root / item['path']).read_bytes()
    assert len(data) == item['bytes'], item['path']
    assert hashlib.sha256(data).hexdigest() == item['sha256'], item['path']
print('Checkpoint file hashes: PASS')
PY
```

## Mustaqil QAga ustuvor savollar

1. Authdan oldin identity/scope ochilib ketmayaptimi? Ichki `StudentAccess`
   haqiqiy session verifieri emasligi va client bodydan qurilmasligi aniqmi?
2. Birinchi start stable demo bo‘yicha global uniqueness, lock/current generation
   va idempotency ledgerisiz productionga chiqmasligi saqlanganmi?
3. Kech save qaytargan expiry/ordinary holati 409dan oldin commit qilinishi,
   tasdiqlangan javob commitdan oldin ACK qilinmasligi talabi yo‘qolmaganmi?
4. CAS/reconcile va submit/deadline tartiblashida pure test dalili DB concurrency
   natijasi deb ko‘rsatilmayaptimi?
5. Ichki Ratio wire number yoki reviewed DB/rounding siyosati deb olinmayaptimi?
   Ordinary fractional/unanswered/formula va bonusdan mustaqillik saqlanganmi?
6. Ichki `Transition.record` key/storage ma’lumoti bilan HTTPga chiqmayaptimi?
   Handoff draftga mosmi, server kodini browser bundlega import qilmayaptimi?

## Qolgan ish va ruxsat chegarasi

Durable storage/HTTP, consumed replay va refresh family ledgeri, staff JWT,
reviewed numeric/session/scope konfiguratsiyasi, admin/roster/publish, Mini App
integratsiyasi va haqiqiy concurrency/pilot hali yo‘q. Real content/key/duration/
roster/window hamda Telegram/staff kirishi tasdiqlanmagan. Bonus implementatsiyasi
va Rasch bu checkpointda tayyor emas. Ponytail ishlatilgan; ECC mavjud deb
ko‘rsatilmaydi.

GitHubga yoki boshqa joyga upload, stage/commit/push, Supabase/provider
o‘zgarishi, migration/deploy bajarilmadi. **Bu ro‘yxat yuklash ruxsati emas**:
parent aniq to‘plamni foydalanuvchiga ko‘rsatadi va har bir upload uchun alohida
tasdiq oladi. Shu paytgacha checkpoint faqat lokal QA uchun saqlanadi.
