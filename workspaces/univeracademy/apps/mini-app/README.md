# Clerk umumiy kirish oynasi — lokal QA nomzodi

Birlashgan asos: Backend `39b2d92acb30b6fffa4c0a0638a49218417beffb`.
[Google/email OTP rejasi](CLERK-COMMON-ENTRY-PLAN.md) va prototip faqat
`npm run dev:auth-prototype` lokal rejimida ishlaydi. Telegram ixtiyoriy;
Telegram hisobini bog‘lash va WebViewdan tashqi brauzerga qaytish ulanmagan.

Backend Clerk exchange uchun lokal handler va unapplied/NOT ACCEPTED kontrakt
patchini beradi. Generated student client/types o‘zgarmagan. Prototip sun’iy
provider/authorize portlarida qoladi; candidate HTTPga yoki real Clerk/Googlega
ulanmaydi. Production entry oldingi Telegram bootstrapni saqlaydi.

Guard108 Backend fayli va browser client/types nusxalarini aniq pinlaydi,
historical16/44/71/83/95 manifestlar saqlanadi. Hozirgi author tekshiruvlari
[COMMON-ENTRY-COMBINED-QA.json](COMMON-ENTRY-COMBINED-QA.json)da; avvalgi
QA fayllari yangi Clerk integratsiyasi isboti deb olinmaydi. Mustaqil QA kutiladi.
Domain/DNS, real credentials/provider/DB, upload to main yoki deploy bajarilmaydi.

## Oldingi production owner review — tarixiy manba


Current composition targets Backend `1335762a8e133311849b2dad1ddc6be3ccf9bb53`.
Production main now connects the Telegram bootstrap to Backend
createProductionStudentClient through the shared UI adapter. Public HTTPS origins
and SDK loading remain explicit; no live bot/API/hosting is configured.

See [production entry and checks](PRODUCTION-ENTRY.md),
[bootstrap lifecycle](TELEGRAM-BOOTSTRAP.md), and
[current review evidence](PRODUCTION-INTEGRATION-QA.json).
The guard now pins all71 current Backend files and both browser owner copies;
the older raw manifests are retained. The active-test JSX/CSS are unchanged.

## Prior local HTTP checkpoint (historical)

The following text and CURRENT-FLOW-QA.json describe the earlier8f863e6/3d029d0
checkpoint. They are provenance, not fresh evidence for Backend1335762 or real
production persistence.

Local synthetic candidate on Backend commit
`8f863e645746159466e06dabb56db3b94f26be05`, in the laboratory branch
`qa/current-flow-20261106`. This is not a production Telegram/deployment build.

The existing student UI is retained: test title/timer card, answered-state progress
line, question-number dialog, server-confirmed saves and server display strings.
`demo.tsx`, `style.css`, flow, transport and mapping source bytes are unchanged from
the previous active-test UI candidate. The browser-side owner client is copied
exactly from this Backend commit; full review contract SHA256 is
`9c7518f887aafacc5cf53b73d33a87d42b11a9fcd46730185b39360e62fe3bb4`.

From `workspaces/univeracademy`, provision the Backend's pinned validator tooling:

```sh
npm ci --ignore-scripts --prefix tests/backend/validator/tooling
```

Then from this `apps/mini-app` directory, install its pinned dependencies with
`npm ci --ignore-scripts` if absent, and run:

```sh
npm run check
npm run test:current-flow-guard
npm run test:current-flow
```

The driver starts fresh RAM Backend and Vite servers in the same environment,
binds loopback only, and closes its own processes. It uses Backend-owned
`publishContentPilot` and `assignContentPilot`, without editing Backend code or
mutating its store. Staff operations stay in Node; the browser gets fresh synthetic
student launches and safe HTTP-derived context only.

Current Backend authority is explicit: approved Teacher/Owner content operations;
scoped Admin membership/assignment. Admin publish remains unsupported. The driver
checks server audit actor IDs and does not label Teacher publication as Admin work.

New browser cases at 320/390/1280px cover:

- Fresh registration, no group/assignment, empty exams.
- HTTP authoring and publication of new questions and 420-second duration; no
  ready seed published version is used.
- A pause between the owner's membership and assignment HTTP calls, so a fresh
  same-student login observes membership with an empty exam list.
- Late assignment ID from HTTP, pinned to the publish response's version ID.
- New question, timer, save ACK, literal page reload/fresh login, saved answer and
  unchanged attempt/deadline, submit, result and history.
- Exact server display strings `0.1 / 0.3` and `50.00%`, localized lexically only.
  Percentage is not recomputed from rounded display points.

`tests/verify-backend-targets.mjs` keeps the historical combined manifest pinned
and checks the raw current Backend manifest plus every expected file size/SHA256.
No fallback or ignored mismatch is used. The current manifest covers all 44
Backend-owned tracked files in this branch baseline. A Backend change requires an
explicit new manifest/review; do not remove the guard to run a different tree.

Historical tests/docs remain as reference. This publication's fresh validation is
recorded in `CURRENT-FLOW-QA.json`; prior suite successes are not inherited as proof
for changed Backend bytes. Screenshot/build/cache outputs are ignored and not
included. Production mode retains the connection-pending screen; real Telegram,
staff JWT/provider auth, DB/RLS, load and deployment remain unverified.
