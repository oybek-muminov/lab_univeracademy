# Guard191: uch faylli lokal handoff

Asos/HEAD: fa82166a5eaaa05a8ae254913039771e03e20bfb.
Nomzod: /workspace/shared/mini-app-guard-fa82166-local-20261107.
Faqat uchta frontend test/fixture fayli o‘zgargan; original Backend, UI,
production entry, SDK adapterlari va oldingi checkpointlar saqlangan.
Upload/commit/push bajarilmagan.

candidate-manifest.json:1538 bayt; SHA256
950f2a6c64b183bed60425f6acec45d6e3145d9c8893b5b7ae46472285a871f3.
candidate.patch:41691 bayt; SHA256
1eff6f0455e2a6236641f8d002451c455f85f106e1ee10797ee7b0c56750c05c.
Manifestda barcha uch faylning before/after hajm/xeshlari bor. Patch yangi
fixture baytlarini ham saqlaydi. Toza base arxividan alohida katalogga git apply
bilan tiklandi:3/3 xesh va guard191+owner2 PASS.

Backendning190 yo‘lli BACKEND-CURRENT-SHA256SUMS ro‘yxati asl source baytlariga
tekshirildi, ro‘yxat faylining o‘zi bilan191-file fixture tuzildi. Tarixiy172
fixture SHA f085f2666c7cb3811da2ede722428ea275aa01e258b77666769447174c23fd06
saqlangan. Yangi current fixture SHA
1a2588f66f261029753b5756e3783adc5940834839b0bfc339f7bc7ffa31f4f7.
Guardning `const repo =`dan keyingi barcha size/SHA256/owner-copy sikllari
base bilan baytga sodiq; hech qanday fallback yoki ruxsat yumshatish yo‘q.

53/53 test, exit0. Ilova katalogida:

```sh
node --test --test-reporter=tap tests/current-flow-guard.test.mjs
node tests/verify-backend-targets.mjs
```

Yangi negative controllar172 tarixiy manifestni tahrirlash/almashtirishni,
TCP abort bridge va domain writerning bir xil hajmli korrupsiyasini hamda
missing domain regression faylini rad etadi. Oldingi barcha guard negative
controllari saqlangan. Maxfiylik ko‘rigi PASS, real credential/data yo‘q.
Node builtins yetarli; dependency install yoki providerga ulanish kerak emas.

Parent Backend uchun111 mustaqil lokal test va TCP-CANCEL-1 yopilganini
bildirdi. Bu uch faylli frontend guard uchun mustaqil QA hali bajarilmagan.
OBS-LOAD-1 va bo‘sh razetka texnik ishi boshqa lokal candidate/evidence
katalogida saqlangan; ushbu uch faylli patchga kirmaydi. Real DB/provider,
asosiy repo va deployga tegilmagan.
