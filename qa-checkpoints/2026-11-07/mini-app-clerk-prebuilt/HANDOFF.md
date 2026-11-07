# Mini App tayyor Clerk formasi — lokal QA handoff

Asos/HEAD: `31b2b00ecd1c413e1f828fef4c023c3ff2310909`.
Manba: `/workspace/shared/mini-app-clerk-prebuilt-local-20261107`.
Holat: LOCAL_CANDIDATE; upload, commit/push va mustaqil QA bajarilmagan.

`candidate-manifest.json`: 8922 bayt, SHA256
`5f4d0f22ade20e4609657b7366febe3014d4f4745254c01569da747def9e253b`.
26 fayl: 9 modified, 17 added, deleted yo‘q. Manifest har bir before/after
hajm/xeshini beradi. Unda oldingi saqlangan 15-faylli lokal copy-review
nomzodi ham bor; u avvalgi publish qilingan nusxa bilan aralashtirilmagan.

`candidate.patch`: 86867 bayt, SHA256
`e628afee2b6410b815dd3588431316b9cb26b5923a4161a24bd3d2ea23ce9b20`.
Patch yangi fayllarning to‘liq baytlarini ham o‘z ichiga oladi.

Tiklash (faqat yangi lokal katalogga; base va mavjud fayllar bosilmaydi):

```sh
python3 -B restore-candidate.py /path/to/base31b-checkout /new/local/output
cd /new/local/output/workspaces/univeracademy/apps/mini-app
```

Tiklash helperi manifest/patch xeshlarini, barcha 26 targetni, Backend172 va
owner-clientning ikki nusxasini tekshiradi. Helper yangi alohida daraxtda
sinab ko‘rildi; `restore-script.log` dalil. Asl checkout yoki git HEAD o‘zgarmadi.

Source ichidagi `docs/clerk-prebuilt-local.md` kirish tanlovi, sessiya lifecycle,
SDK/vendor/synthetic chegarasi va aniq test buyruqlarini tushuntiradi.
`verification.json` barcha tegishli loglarning hajm/xeshlarini beradi:
76/76 Node (8 yangi gate regressiyasi), 7/7 primary prebuilt mount/browser,
4/4 backup SDK/browser, common va Telegram production buildlarida 2+2/4
brauzer ssenariysi. Typecheck/build PASS. Guard 172+2 va tarixiy pinlar
saqlangan. Synthetic markerlar va custom backup credential formasi asosiy
production bundlelarida yo‘q. `integrity-privacy.json` maxfiylik/restore dalili.

React SDK wrapper/hooks haqiqiy; vendor UI/client/proof sintetik, HTTP esa
haqiqiy loopback RAM. Testlar haqiqiy Clerk/Google/email OTP yoki vendor
formasining ko‘rinishini tasdiqlamaydi. WebView qaytish/linking, vendor Uzbek
locale, tenant/email shabloni, Brevo, haqiqiy DB/provider/deploy: NOT_RUN.
Amaldagi dizayn/CSS o‘zgarmagan; `docs/review/`ning 4 oldingi ko‘rik fayli
baytga sodiq saqlangan. Real provider yoki tashqi xizmatga hech narsa yozilmadi.

SDK rasmiy reference: https://clerk.com/docs/react/reference/components/authentication/sign-in
