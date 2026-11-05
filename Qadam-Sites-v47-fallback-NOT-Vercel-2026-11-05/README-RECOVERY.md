# Qadam Sites v47: historical fallback source

**This is NOT a verified backup of the current Vercel landing.** It is a separately preserved older Sites source snapshot. Do not overwrite a newer or production site with it automatically.

## Provenance

- Imported archive: `qadam-PC-transfer-v47-and-WIP-20261102.zip` from the user's Space, dated 2026-11-02.
- Imported archive SHA256: `63734b0fa5970e1f5058f2526057360f663426c1991fe1f232aea338bd482bc1`.
- Selected subtree: `stable-v47/` only. The unfinished `WIP-variant2-blur/` snapshot is not included.
- Original manifest identifies source commit `203aaa64b08407a50453ce53a4790ab7fd6b37af`. All 46 source file byte sizes and SHA256 hashes match that original manifest. This verifies archive integrity against its supplied manifest, not the commit's current availability or a live deployment.
- This is a source snapshot, not Git history. The original source README contains historical design and publication notes. Those notes do not establish present publication status.

## What is included

Original React/TypeScript source, public images/icons/SVG assets, tests, npm package and exact lockfile, Vite/TypeScript/Tailwind component configuration, `.openai/hosting.json`, and third-party license. Original project bytes are unchanged.

No `.env`, credentials, Git internals, `node_modules`, generated build output, runtime logs, or screenshots are included. A targeted scan found no private-key blocks, GitHub token patterns, AWS access-key IDs, JWT-like tokens, or Telegram bot tokens in the source. Such a scan is useful but not a formal security certification.

## Environment names

No application environment-variable references (`process.env.NAME` or `import.meta.env.NAME`) were found in the source. No application secret values are needed for this static demo. Vite's own built-in mode/base variables follow Vite defaults. Do not put backend or bot secrets into this client.

The CSS imports Onest and Young Serif from Google Fonts. Those fonts need internet access at runtime; fallback fonts render if unavailable. npm installation also needs registry access unless dependencies are cached. The old README's claim of no external font requests is superseded by this observed CSS configuration.

## Rebuild locally

Use a supported Node.js release compatible with Vite 7 (Node 20.19+ or Node 22.12+). This verification used Node 24.22.1 and npm 11.9.0.

1. Extract this archive.
2. Verify the archive SHA256 using the adjacent `.sha256` file, then verify internal files with `sha256sum -c SHA256SUMS.txt` from this directory.
3. Enter `source/`.
4. Run `npm ci --ignore-scripts --no-audit --no-fund`.
5. Run `npm test`.
6. Run `npm run build` (TypeScript check, then Vite production build).
7. For development, run `npm run dev` and open http://127.0.0.1:4173/.

Build output is `source/dist/`. It is static frontend content, with no account creation, database, real assessment submission, or working backend implied.

## Deployment reference, not an executed deployment

For a separately approved static hosting deployment, use project root `source/`, install command `npm ci --ignore-scripts`, build command `npm run build`, and output directory `dist`. No app environment values were required in this test. `.openai/hosting.json` is preserved for completeness and is unnecessary for a normal local Vite build.

Before replacing a Vercel deployment, independently confirm the actual project, domain/aliases, source commit, and current published asset hashes. Preserve its source and deployment settings first. This package does not prove that match and does not authorize deployment, domain changes, or deletion.

## Verification on 2026-11-05

- Archive extraction safety: no absolute paths, traversal paths, or symlinks in the selected archive.
- Original manifest: 46/46 source files match.
- Clean dependency installation: passed, 125 packages, install scripts disabled.
- Existing source tests: 48 passed, 0 failed.
- TypeScript and production build: passed. Vite 7.3.7 built 2,044 modules.
- Package lock remained unchanged.
- UI/browser interaction and pixel comparison: not performed in this recovery verification.
- Current Vercel match: not established.

## GitHub repository observation

At 2026-11-05 10:38-10:39 UTC, `oybek-muminov/UniverAcademy` was accessible but empty: repository ID `1446861946`, created `2026-11-05T10:36:44Z`; branches `[]`; commits API returned HTTP 409, "Git Repository is empty"; contents API returned HTTP 404, "This repository is empty". No source could be retrieved from it.

An older project document records historical repository ID `1431173135`. The identity differs. Reusing the URL alone does not prove the new empty repository is the historical source repository. This recovery performed no repository, hosting, database, or deployment changes.
