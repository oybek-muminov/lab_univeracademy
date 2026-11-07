# Tiklash

Paketdagi `source/` yo‘llari laboratoriya repo ildiziga nisbatan. Exact base: `0dcb603cc7fb77fc6abe9df9f58fc4b955cde9a5`.

1. Shu pinned base’ni alohida toza lokal checkoutga tiklang. Mavjud ishchi fayllarni bosmang.
2. `candidate-manifest.json`dagi before_bytes/before_sha256 qiymatlarini tekshiring; added fayllar mavjud bo‘lmasin.
3. `git apply --check /path/to/qa/candidate.patch`, keyin `git apply /path/to/qa/candidate.patch`.
4. Barcha 26 target fayl hajm/SHA256larini manifest bilan tekshiring. Muqobil ravishda source/ ichidagi aynan shu baytlar ishlatiladi; patch bilan birga ikki marta qo‘llanmaydi.
5. Node24.x. `workspaces/univeracademy/` ichida `npm ci --ignore-scripts`, validator uchun `npm ci --ignore-scripts --prefix tests/backend/validator/tooling`. `apps/mini-app/` ichida `npm ci --ignore-scripts`. Kerak bo‘lsa npm cache yo‘lini yozish mumkin bo‘lgan /tmp ga belgilang.
6. `qa-report.json`dagi buyruqlarni frontend ichida bajaring. Browser uchun Python Playwright va Chromium kerak. Haqiqiy credentials yoki provider kerak emas. Runtime serverlar test ichida faqat loopback RAMda ochiladi va yopiladi.

Paket o‘zi install hook yoki restore script bajarmaydi. `.git`, node_modules, cache, build, real data, provider sozlamalari va eski arxivlar paketga kirmagan. Bu local handoff; upload ruxsati emas.
