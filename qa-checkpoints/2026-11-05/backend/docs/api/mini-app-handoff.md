# Mini App uchun Backend qaydi — 2026-11-05

**0.2.7-statistical-bonus-review.1 — PROVISIONAL / NOT ACCEPTED.** Bu joriy
draftning consumer qaydi, yangi kontrakt yoki endpoint o‘zgarishi emas. Backend API
va server xatti-harakatlarining yagona egasi; moslashtirishni koordinator yuritadi.

Pinned manba: `oybek-muminov/lab_univeracademy`, commit
`f2c580508cfec9e07f383610201af28edffd854b`,
`UniverAcademy-statistical-bonus-review-2026-11-05/openapi-UniverAcademy-0.2.7-statistical-bonus-review.1.json`.
GitHub LF nusxasining SHA256 qiymati:
`51deb7a41d223559022dcb7e17ff24985bd328e51c4a87c797a02763bb801149`.

Haqiqiy API origin hali berilmagan. OpenAPI `https://api.invalid/api/v1` manzili
ishlamaydigan placeholder; runtime konfiguratsiyaga ulanmasin. Hozir mock UI va
draft kontraktga mos fixture tayyorlash mumkin. Haqiqiy Telegram/staff kirishi,
content, provider sozlamasi va deploy tekshirilmagan.

## Auth va ro‘yxatdan o‘tish

| Amal | So‘rov | Draft javob va qoida |
|---|---|---|
| `POST /auth/telegram` | `{ "init_data": "raw Telegram.WebApp.initData" }` | `200 { data: Session }`; initDataUnsafe identity sifatida olinmaydi |
| `POST /auth/refresh` | `{ "refresh_token": "opaque proof" }` | `200 { data: Session }`; staff SDK refresh bilan aralashtirilmaydi |
| `GET /me` | Student bearer | `200 { data: Profile }` |
| `PATCH /me` | Student bearer; `{ "first_name": "...", "last_name": "..." }` | Ikkalasi required, 1–100 belgi; Backend saqlagan registration_complete authoritative |
| `POST /auth/logout` | Valid Student bearer yoki `Logout.refresh_token` proof | Anonymous success yo‘q; ikkala proof berilsa bitta familyga tegishli bo‘lishi kerak |

`Session`ning required maydonlari: `access_token`, `expires_at`, `refresh_token`,
`refresh_expires_at`, `token_type: "Bearer"`, `profile`. Himoyalangan student
so‘rovlarida `Authorization: Bearer <custom opaque access_token>` ishlatiladi.
Bu staff Auth JWTsi emas; `roles` clientdagi permission manbasi emas.

`Profile`ning required maydonlari: `person_id`, `first_name`, `last_name`, `roles`,
`registration_complete`, `active_group_id` (nullable), `qadam_id` (student uchun
doimiy 10 xonali string; identity proof emas). Telegramda ism borligi registration
complete bo‘ldi degani emas. O‘quvchi o‘zini guruhga qo‘shmaydi: o‘qituvchi/admin
vakolat bilan qo‘shadi. Guruh yoki ruxsatli test yo‘qligi alohida UI holati.

initData uchun `401 INIT_DATA_INVALID/INIT_DATA_EXPIRED`, consumed proof uchun
`409 INIT_DATA_REPLAY`. Yo‘qolgan login javobidan so‘ng oldin mavjud lokal sessiya
tekshiriladi, kerak bo‘lsa yangi Telegram launch qilinadi. Reload yangi initData
olinishini kafolatlamaydi. Refresh single-flight; rotationdan keyin eski proofni
ko‘r-ko‘rona qaytarish family revocationga olib kelishi mumkin. Yo‘qolgan refresh
javobida blind retry yo‘q. Auth tugashi test vaqtini to‘xtatmaydi yoki yangilamaydi.
Access/refresh saqlash strategiyasi va TTL hali alohida reviewed konfiguratsiya.

## Start, timer va savollar

- `GET /exams/{assignment_id}` metadata beradi, boshlashdan oldin savollar emas.
  Tarix uchun ko‘rinadigan assignment yangidan boshlash huquqini anglatmaydi.
- `POST /exams/{assignment_id}/attempts`: body faqat `{ "confirmed": true }`,
  required `Idempotency-Key` (8–128 belgi). `200 { data: Attempt }`.
- `GET /attempts/{attempt_id}`: `200 { data: Attempt }`; resume vaqtni
  yangilamaydi. Serverdagi current series/generation tekshiriladi.
- `Attempt` required maydonlari: `id`, `demo_id`, `assignment_id`, `generation`,
  `status`, `state_revision`, `started_at`, `deadline_at`, `completed_at`,
  `cancelled_at`, `completion_reason`, `server_now`, `series`, `questions`, `answers`.
  `Series`ning to‘liq shakli pinned OpenAPIdan olinadi, client uni taxmin qilmaydi.
- `in_progress`da frozen `questions`/`answers`; ready va terminal holatlarda bu
  massivlar bo‘sh. `ActiveQuestion`: `id`, `display_position`, `prompt_blocks`,
  aynan to‘rtta `options`. `ActiveOption`: `id`, `display_position`, `blocks`.
  Client qayta shuffle qilmaydi, server orderini saqlaydi. Kalit va base ball
  active savol javobiga qo‘shilmaydi.
- UI timeri `server_now`/`deadline_at`ga tayangan ko‘rsatkich. Yakuniy qarorni
  server qiladi. `deadline = started_at + full duration`; admission yopilishi
  boshlangan urinishni qisqartirmaydi. `now == deadline` kech hisoblanadi.
  Aloqa/auth uzilishi vaqtni pauza qilmaydi. Asia/Tashkent kech kirish huquqini
  client classroom-enddan o‘zicha hisoblab qisqartirmaydi.

## Save va reconcile

`PUT /attempts/{attempt_id}/answers/{question_id}` uchun aniq body:

```json
{ "selected_option_id": "00000000-0000-4000-8000-000000000001", "expected_revision": 0 }
```

Bu UUID faqat sun’iy shakl misoli; haqiqiy qiymat shu savolning option UUIDsi,
tozalash uchun JSON `null`. `expected_revision` yangi javob uchun 0, keyin oxirgi ACK revisioni.
Bodyga `generation`, person/role, client time yoki boshqa maydon qo‘shilmaydi.

Muvaffaqiyatli `200`:

```text
{ data: { question_id, selected_option_id, revision, saved_at, series_state_revision } }
```

`revision >= 1`; timestamp UTC `Z`. Server durable commitdan oldin ACK bermaydi.
Hozirgi lokal yadro hali bunday durable ACK chiqaradigan HTTP/storage adapteri emas.

Client pending navbatni **attempt_id + generation + question_id** bilan bog‘laydi.
Faqat lokal bosish saqlandi degani emas. Bir savol uchun so‘rovlar tartiblanadi;
yo‘qolgan javob yoki `409 REVISION_CONFLICT`dan keyin GET bilan ACK/current state
qayta o‘qiladi. Yangi revisionni olib boshqa qurilmaning niyatini avtomatik bosib
ketish qilinmaydi. Terminal yoki successor aniqlansa eski pending navbat yangi
urinishga ko‘chirilmaydi.

- `409 ATTEMPT_SUPERSEDED`: eski attempt/generation; current series qayta o‘qiladi.
- `409 ATTEMPT_EXPIRED`: deadline o‘tgan, kech javob saqlanmadi; resultga o‘tiladi.
- `409 ATTEMPT_TERMINAL`: terminal urinishga qayta yozilmaydi.
- `422 INVALID_OPTION`: option shu savolga tegishli emas.
- `401/403/404`: auth/current scope o‘zgargan bo‘lishi mumkin; eski ma’lumot bilan
  retry davom ettirilmaydi va boshqa pupil mavjudligi ko‘rsatilmaydi.

## Submit va result

`POST /attempts/{attempt_id}/submit`: required `Idempotency-Key`, request body yo‘q.
Client imkon bo‘lsa pending savelarni reconcile qilib, tasdiqdan keyin yuboradi;
server faqat committed javoblarni hisoblaydi. `200 { data: CompletedGradingResult }`.
Deadline’da/yoki undan keyin outcome `expired`, self-submitted emas; bu ham oddiy
natija bilan qaytadi. Client submit bosildi degani asosida statusni o‘zi yasamaydi.

`GET /attempts/{attempt_id}/result`: `200 { data: AttemptGradingResult }`, faol
urinish uchun `409 ATTEMPT_NOT_COMPLETED`. Ikkala resultning asosiy shakli:

```text
{
  data: {
    attempt_id,
    ordinary: { earned_points, max_points, percentage, calculated_at } | null,
    statistical_bonus: { calculation_id, earned_points, calculated_at } | null
  }
}
```

Submit/force/expiry completed javobida `ordinary` **non-null**. Qolgan lifecycle
uchun universal resultdagi nullable holatni UI ixtiyoriy nol natijaga aylantirmaydi.
`earned_points`, `max_points`, `percentage` wireda number, vaqtlar UTC `Z`.
Ichki BigInt/Ratio browserga yuborilmaydi. Ikki kasrli ko‘rsatish talab qilingan;
midpoint rounding va finite number serialization hali Backend numeric reviewida.
Mocklarda tie holatini yashirin policy sifatida mustahkamlamang.

Bonus ordinary ustiga qo‘shilmaydi, oddiy foizni o‘zgartirmaydi, alohida optional
ball. Bonus hali yo‘q/cohortga kirmagan/successor bo‘lsa `null`. Bonus foizi,
sertifikat yoki A/A+ darajasi yo‘q. O‘quvchi bonus activation endpointini chaqirmaydi.
`GET /exams/{assignment_id}/history` original attempt attributionni saqlaydi;
eski predecessor bonusi successor kartasiga ko‘chirilmaydi. Detailed review
alohida gate bilan, result chiqqani kalitni ochish ruxsati emas.

Barcha API xatolari `{ error: { code, message, request_id } }`; request_id UUID.
Client token/initData/kalitni loglamaydi. Qo‘shimcha field yoki boshqa retry
semantikasi kerak bo‘lsa endpoint/schema va aniq diff Backendga qaytariladi.

## Tayyorlik chegarasi va navbatdagi Backend topshirig‘i

Hozir lokal pure yadro va 23 ta unit test mavjud. Uning camelCase ichki
strukturalari, `Ratio`si yoki `Transition.record`i consumer kontrakti emas.
Server fayllarini browser bundlega import qilmang: ular private kalitlarni tutadi.
Generated client hali yaratilmagan; to‘liq OpenAPI qabul qilingach bir xil xesh
asosida Backend beradi.

Keyingi topshirish: reviewed numeric/session/scope konfiguratsiyasi, storage/HTTP
adapteri, haqiqiy origin, tasdiqlangan API xeshi va real happy/negative/recovery
sinov dalili. Hozir Frontend draft mocklari bilan mustaqil ishlashi mumkin;
koordinator consumer moslashtirishni Backend bilan muvofiqlashtiradi.
