# R1-PROTECTION-01-r2 — reconciled on d706

Local latest-base reconciliation, not publication or production activation. Exact accepted base `d7064e9964f87576f48088234fe361fc314fdbc0`, tree `a789b1c6b9256b2a7ff37f40f13c2037d1376c07`. Fresh read-only branch observation at `2026-11-10T11:34:53.657Z` matched d706. All721 accepted blobs and their Git modes were verified; the base tree was recomputed from copied blob bytes/modes and matched. Nine bootstrap additions were read from GitHub, not from another worker's environment. No accepted file was changed.

Only the two reviewed protection files were copied. They are byte-identical to e8 r2: model30,680 bytes / `ad4486106fb32ef8ee50e8db151549726bc8fa36b16a21396d7d02d1921d2ed8`, test38,971 bytes / `a1f0014d99ab4ec898d3331622d2eff3c09ab5c3fb8427cae890d53cc497a111`. The71,338-byte patch is also unchanged / `c30f123d1cb25ab6e5cf940fe44f66635218fb9df353b387bfa57de15315dc64`. Existing domain/HTTP/bootstrap/driver/preflight-port/dependencies/locks/config/pins remain unchanged. Three direct runtime helper dependencies match e8 byte-for-byte. No broad Mini/HTTP/bootstrap suite was repeated.

## Actual checkout versus embedded history label

The test's literal `base=e8c742ca518f084ada78f9a905ed65907c60f9b8` was NOT edited. Its raw case header/per-case labels still say e8. Those labels are historical metadata, not evidence of actual checkout. External run records identify `actual_execution_base=d706...`, `embedded_test_base_label=e8...`, actual cwd and723-file source/lock snapshots. No raw trace was relabelled. The preserved original red run actually ran on e8 and remains explicitly e8.

Fresh d706 suite: **162/162 PASS**, fail/skip/cancelled/todo0, exit0. Typecheck exit0. Both read the same frozen directory; neither writes source. Before/after snapshots in both runs match:723 files,140,485 bytes, SHA256 `e53f365375e9c0ee11f9e554d031fa32494ba3f87d1cc0b1e051e6c90e34b72c`. The fingerprint list contains path/bytes/SHA256 for721 accepted files plus2 new files, excluding node_modules/.git and symlinks. It does not fingerprint physical DB state or all installed runtime bytes. Exact commands/env/cwd/UTC/exits/log digests and original case identities are embedded in verification.json. Existing dependencies were reused, with no install.

The162 d706 case records match the frozen e8 green run in ID/order and every per-case field except started/finished UTC. This is a local author comparison; the old e8 green raw file is retained locally and omitted as duplicate behavior. Its historical byte audit needs that original; the new d706 record is never represented as the old e8 byte sequence.

## Lossless case evidence

Selected `case-results.pack.json` and `history/red-before-cases.pack.json` are **lossless object-dictionary packs**, not summaries. Repeated large per-case ledger/receipt/state objects are stored once in `objects`; `references` contains result-index/field/object-key triples. The payload retains original key order and all other fields. No assertion, state, ledger operation, counter, timestamp or base label is discarded. Original null slots were not packed: only explicitly referenced large object/list fields are temporarily null.

Selected reconstruct_case_evidence.py validates object keys, unique slots, exact reference coverage, full case/pass/fail counts and original byte size/SHA256. It restores dictionary values, emits the original UTF-8 JSON with indent2/ensure_ascii=false/trailing-LF, and verifies exact bytes. Both in-memory comparison with original bytes and standalone CLI verification exited0. The pack does not require the omitted raw file to restore it.

| Dataset | Actual execution | Embedded label | Original raw bytes/SHA256 | Packed bytes |
|---|---|---|---|---:|
| Current final162 | d706 | e8 | 575310 / `96e114c81f57eae31fca6a0f1b81f5ca35e02c98608576369cfffe529011fd25` | 313552 |
| Genuine red-before32 | e8 | e8 | 143542 / `dc2f303f49846325e01b892b7de8068da95cbc3fc96abc57f65a513d2a7291f5` | 89305 |

To verify a selected pack, run `python reconstruct_case_evidence.py PACK`. Add a local OUTPUT path to materialize the exact original JSON. The verification command records and outputs are embedded in verification.json. Absolute source paths in pack metadata are provenance only, not reconstruction dependencies.

## Preserved defects and source/result reproduction

The original red-before is genuine **24 FAIL /8 PASS**, not a harness error: F1 two lock-watermark failures; F2 three pre-COMMIT freshness failures; F3 nineteen provider invariant/expiry precedence failures. The selected red source is the original30,424-byte model / `a6c25ce8201a66883515e79aa7e2f1acb21efa5376e60625d4daea2fa6be9efb`. The same selected final test bytes were used for red and green. Full original red stdout and the lossless red pack preserve actual outcomes, failed assertions and ledger state. verification.json pairs all32 IDs with current d706 outcomes without changing the expected oracle.

Historical red reproduction uses a separate exact-e8 base, the final test at its normal source path, and selected history/red-before-model.ts copied to the model's normal storage path. Do not execute the history source in place, because relative imports belong to its original destination. The full filtered command is preserved in the original e8 run record. This task did not rerun the red or targeted-green suites.

Original130 assertion/oracle bytes are unchanged after the already reviewed metadata/diagnostic normalization; the parity record is retained. Final162 includes all130 plus the32 review controls. F1 keeps owned reacquisition legal without reducing the watermark. F2 revalidates before COMMIT while allowing normal ACK waiting; committed/uncommitted ACK-loss remain identical caller commit_unknown503/no retry. F3 retains provider-invariant500, then expired/equality401, then current staff/G/H ordering. No accepted helper was changed.

## Replay, modes and frozen material

Actual final patch check/apply/reverse-check/reverse ran after both final commands, in a separate patch-replay-final directory. All4 exited0; source byte/Git-mode parity2/2; reverse removed both new paths;721 base blob/mode identities remained intact. Commands/cwd/UTC/output digests are in replay-verification.json. No Git objects, index, commit or ref was written; Git apply touched only the authorized scratch replay copy.

One earlier packaging assertion incorrectly equated a regular non-executable Unix0600 file with an exact0644 requirement. The source bytes already matched; both normalize to Git100644. That metadata-oracle failure is preserved in verification.json.packaging_history, including the initial script identity and known missing initial subprocess UTC details. Its partial replay directory and script remain local. Final replay used a new directory and the correct executable-bit Git-mode oracle. Candidate source bytes and permissions were not changed to hide it. This was not a model or runtime-test failure; tests were not rerun for this packaging correction.

Frozen regular-file comparisons: old f5 protection1420/1420; old e8 r2 package1454/1454, including original13/17-file proposals and raw evidence. Old proposal inventories remain5591 bytes / `e04d2ada...` and7314 bytes / `61315bd0...`. Earlier HTTP/domain/shared/removal-auth packages also match their existing descriptors. Full snapshot exclusions are the same node_modules/.git/symlink boundary. scope-verification.json contains counts and inventory identities; large frozen descriptors stay local.

## Selection and omitted originals

The fresh proposal inventory lists each selected source/destination/size/SHA256 and classifies every original e8 selected row as retained, packed, replaced or omitted. Its own JSON is not selected. Two new source files and15 evidence files are proposed; no upload is approved.

Original d706 raw final cases and original e8 red cases are omitted as physical duplicate files because selected packs restore every original byte. The old e8 final raw cases/log, old manifests/verification/snapshot/scope/replay/runner and targeted-green log remain frozen locally; current d706 counterparts supersede final claims. Original run JSONs are embedded in verification; standalone copies are redundant. The red test copy equals the selected final test. The byte-identical full patch, model/test and red source/log are retained. Old source archives, both partial/final replay directories, assembly/build scripts, large frozen descriptors, remote tree metadata and all inventories remain local. Packaging-failure metadata is embedded; its original script is local. No excluded original is required to reconstruct the selected current162 or historical red32 results.

Relayed review summary ONLY: the coordinator reports independent QA162+38/typecheck0 on e8 and d706 (turn01a1c532-70e0-750e-857a-b51f57d07856), and bounded architect PASS (turn01a1c52d-e4ac-748b-a86d-a02aed3c86b8). Reported QA INDEX digest `5a7cf9a7ef232be5f074aeafeec50ea93595c54d5853d83a94e0cbe188a50bbd` was relayed, not independently read/hashed here. Original QA REPORT/INDEX/probe/verification files are not owned, accessed, substituted or included in this package.

## Limits

This remains a SQL-free local protocol model. Consistent hidden omission, unreported I/O and nonparticipating writers can evade model claims. Key facts are not a full real SQL loader. Synthetic lease/ACK/discard and recording committed states do not prove physical locks/release, RLS, isolation, durability, exhaustive projection, live revocation or all writers' gate persistence. No provider/DB/migration/deploy, endpoint wiring, authority expansion or pin change occurred. R1 integration OPEN; real-DB/production E2E BLOCKED. A later publication requires separate exact approval and a fresh HEAD/path/hash check.
