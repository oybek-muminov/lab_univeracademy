**Full historical SQL B projection remains NOT_READY.** `comparison_performed=false`, `total_mismatch_count=null`, runtime readiness=false. This is an evidence-linkage decision, not a new catalog comparison, canonical review, baseline promotion or DB observation.

The corrected first section is `session_identity(database,current_user,session_user,server_version_num,isolation_known,read_only_expected,reviewed_search_path_match)`. Its sixth value is the observed `transaction_read_only='on'` comparison. No `in_recovery` value was collected by that SELECT.

The compact [WITNESS.json](WITNESS.json) is **39,356 bytes**, SHA256 **`bb078466198b609dd5d7466e84cac963ff21e91b52e6b89d40bd13fba9a7c5f2`**. It contains all 21 section schemas, original 832-line section ranges, nullability/identity decisions, all 43 FK and 45 key correspondences, 137 source/capture column-order records, 13 relation-OID mappings, eight helper-OID mappings, two base-type-OID mappings and the unresolved role witness. It is a newly derived QA witness artifact, not a previously retained author export or a ready/full projection. No unknown mapping has been filled from expected names.

Primary retained file bindings:

| ID | Original input | Bytes | SHA256 |
|---|---|---:|---|
| Q | `catalog.local.sql` | 25,385 | `d1dfa5116af7fd8f2b08a98121d2549e294bb98723ee922bf8f3731164d56ef2` |
| R | `07-review-catalog-unpopulated-pins.stdout` | 45,460 | `de197371d5f2fab38f32b3a46c54bcf5ae91136b4fd0940b0130a9b0b98e4068` |
| S | `snapshot.local.sql` | 14,989 | `7d86fca3961fcd8e7b94e9367878e89e1cbd0d589b3d241943203763695751cb` |
| C | `candidate-pins.json` | 93,956 | `a0d15e8ab1fcbe4e604eff3424c44873200daa828e07246bb17a49f7009059ef` |
| J | `journal.jsonl` | 24,270 | `a2e59fda6a52542863b64c04d5c2f596d7e36d035ccfd99b4fd2526f06be8984` |

Journal original records **21,24,27** (1-based lines; JSON label/event/input/output fields) bind the successful DDL, Q/R collection and S/raw snapshot collection. The two collection windows are `06:38:09.765122–09.880232` and `06:38:09.881483–09.995531` UTC, each exit0, same database/operator/closed PGOPTIONS; no intervening DDL command appears in the reviewed sequence. C is value-equal to the exact original snapshot stdout (70,830 bytes, SHA256 `c0c563909fed8b7656f95bb19297c56a6c0cb7fc7f7acf5d12f002f17447de3e`). These are same historical-run relations, not a fresh repeatable snapshot spanning both commands. The unchanged sealed single-owner/no-other-writer provenance is required for the between-command correspondence; do not apply it to arbitrary asynchronous captures.

**Direct helper witnesses.** Q's runtime-helper SELECT directly emits `p.proname,p.oid,has_function_privilege`. Namespace is fixed `ua_private`. Its preflight count8/distinct-name8, eight actual distinct output names and C.helpers count8 justify the signature join by name; no overload can be silently selected.

| Role-local function OID | Natural name | R line | C JSON pointer / identity arguments / result |
|---:|---|---:|---|
| 16911 | ua_private.check_access_projection | 754 | `/helpers/0`, `""`, trigger |
| 16908 | ua_private.check_answer_binding | 755 | `/helpers/1`, `""`, trigger |
| 16912 | ua_private.check_attempt_projection | 756 | `/helpers/2`, `""`, trigger |
| 16910 | ua_private.check_family_projection | 757 | `/helpers/3`, `""`, trigger |
| 16909 | ua_private.check_membership_projection | 758 | `/helpers/4`, `""`, trigger |
| 16913 | ua_private.check_series_projection | 759 | `/helpers/5`, `""`, trigger |
| 16907 | ua_private.guard_history | 760 | `/helpers/6`, `""`, trigger |
| 16402 | ua_private.ratio_shape | 761 | `/helpers/7`, `"v jsonb"`, boolean |

This table's “role-local” wording means capture-local identifiers in the runtime ACL output, not an SQL role OID. The eight OIDs are routine OIDs. Definition hashes, helper properties and helper EXECUTE denial can therefore be joined without an invented function dictionary. C and SQL B helper names/properties are linked separately from the numeric function identity.

**Safe base-type joins.** Q domains emit `name,typbasetype`; S/C domains emit the same unique domain name and observed `format_type(typbasetype,typtypmod)` under pg_catalog search_path. R370 + C`/domains/0` (ms_time) and R372 + C`/domains/2` (safe_counter) bind **20 → observed formatted builtin `bigint`**. R371 + C`/domains/1` (proof_digest) binds **25 → observed formatted `text`**. These are within-run domain-name joins, not guesses from remembered standard OID values or copied source expectations. Do not invent the 66 per-instance type OIDs: none is exported by runtime_type_acl.

**Safe FK correspondence, not a direct OID/name export.** Q's constraint stream, filtered to kind=f, and S/C.fks are complete ordered streams of the same 43 FK catalog rows, both `ORDER BY c.relname,x.conname`. S does not project conname, so the shared constraint-order rank is explicit provenance. Each pair agrees on parent table, ordered vector arities, deferral and update/delete/match codes; the source/target attnum vectors bind to S's ordered natural column arrays. Q's preflight prevents a LIMIT cut; S has exact FK count43 and limit44. No missing/ambiguous row is dropped. All repeated positive `confrelid` values consistently resolve to one natural target. One sufficient representative witness per used OID follows; all 43 pairs are in WITNESS.json.

| Relation OID | Natural target | R line | C pointer |
|---:|---|---:|---|
| 16403 | ua_private.groups | 176 | `/fks/2` |
| 16411 | ua_private.people | 181 | `/fks/5` |
| 16426 | ua_private.memberships | 236 | `/fks/22` |
| 16515 | ua_private.clerk_identities | 211 | `/fks/13` |
| 16532 | ua_private.clerk_student_sessions | 204 | `/fks/11` |
| 16548 | ua_private.student_families | 203 | `/fks/10` |
| 16636 | ua_private.demos | 174 | `/fks/1` |
| 16644 | ua_private.test_versions | 179 | `/fks/3` |
| 16678 | ua_private.assignments | 186 | `/fks/6` |
| 16723 | ua_private.exam_series | 196 | `/fks/7` |
| 16745 | ua_private.attempts | 170 | `/fks/0` |
| 16874 | ua_private.staff_receipts | 263 | `/fks/29` |
| 16889 | ua_private.staff_audit | 272 | `/fks/33` |

The remaining 17 table names are directly observed as names, but their numeric table OIDs are not exported and are not needed for any positive FK target in this capture. `confrelid="0"` on the 91 non-FK constraints is a **NO_RELATION** typed sentinel, not a missing relation mapping. PUBLIC role/grantee `"0"` is a different typed sentinel and does not occur in these two default-ACL rows.

**Attnum decision.** Captured FK/key/explicit-index number vectors and natural column arrays give 76 consistent individual `(table,attnum,column)` bindings. For the other61, dense ordinal numbering is a **source-constrained deduction** restricted to this exact fresh CREATE TABLE run: the source-derived expectation file (37,999 / SHA256 `c1d405f3664a385e0e7d2b1028e4d5961c9ac37b8150dbf8db604f7246f4d6d0`) preserves declaration order; both captures order columns by table,attnum and agree with all137 names/types/nullability; exact SQL A/local DDL creates those columns and has no DROP/RENAME/column alteration. No numeric object OID is deduced from DDL allocation order. WITNESS.json records each column's R line, C `/columns/N`, E `/columns/N` and captured vector witnesses if present. A generic capture with dropped-column holes cannot use rank=attnum and needs explicit attnum output. This deduction is not mislabeled a direct attnum export.

**Unrecoverable role identity and exact blocker.** R lines582–583 are literally:

```text
T||16388|16388|USAGE|f
f||16388|16388|EXECUTE|f
```

Derived SQL B JSON pointers are `/default_acls/0` and `/default_acls/1`; fields are object_kind, nullable namespace, grantor_oid, grantee_oid, privilege, grantable. The Q WHERE clause scopes the **default ACL owner** to role name ua_owner. It does **not** project that owner's numeric OID or identify `a.grantor/a.grantee`. The exact observations prove same grantor/grantee OID16388, global default scope, type USAGE/function EXECUTE and grantable=false. They do not independently prove that 16388 is ua_owner. Q's owner_runtime_roles rows584–585 and C.roles return names/flags without any role OID. The other retained original streams/ledgers likewise contain no OID/name role mapping. OS UID1000 is unrelated. Source-intended owner ACLs or CREATE ROLE sequence are not an observed identity witness.

The prior evidence-review shorthand “owner-only default ACL” was too strong if read as a directly captured numeric-role identity proof. It remains supported as source intent plus owner-filtered/self-grant-pattern observation; this review preserves the unresolved numeric role identity explicitly. This does not repeat or change canonical-string acceptance and does not fabricate a new failed DB run.

**Other semantic limits.** runtime_type_acl directly reports natural type name/kind/class and computed array/element USAGE equality, not actual typelem/typarray OID/name edges. Do not invent the element by stripping `_`. The pinned preflight certifies allowed dependency shape for this capture; a stronger explicit edge map is not exported. Internal trigger rows directly support `(table,enabled,internal,deferrable,deferred,function_schema,function_name,function_definer)` as a multiplicity-preserving semantic multiset, retaining original generated name as capture evidence. Exact internal RI-trigger→FK linkage and internal tgtype are not output. Do not infer that edge from an OID suffix. If the future contract requires it, add the semantic linkage fields in a later scoped collector; do not pretend this witness exports them.

**NULL/empty/space and completeness rules.** The supplied architectural schema is correct with the session-identity correction. Preserve non-FK action/match **single space**; preserve column identity/generated **empty string**; map only query-nullable blank fields to explicit null: conkey/confkey, global default namespace, optional domain-constraint fields and computed nullable helper/type diagnostics. Unknown/null helper configuration is not success. Missing section is not an empty section. Policies0, memberships0 and sequences0 follow this exact pinned query ordering, preflight and successful command; fixed offsets are valid for this exact R hash only, not a drifted generic pipe-output parser. Any altered bytes, unaccounted delimiter/newline, duplicate name, ambiguous correspondence, failed/limited capture or unsupported context is NOT_READY.

Q/S read catalog metadata and has_* privilege results; they are not application row visibility probes. The accepted fresh initdb operator/capture provenance supports the historical catalog inventory and the snapshot's per-table empty check. No app RLS-hidden result may substitute for absence, own-positive or completeness. Full projection cannot drop an unresolved role, type, function or relation row and report zero mismatches.

**Smallest missing evidence / future change.** First check for an already retained, exact same-run `pg_roles(oid,rolname)` witness binding 16388; none is in QA's complete31-file evidence. Without such an original, this historical full-projection gap cannot be repaired by a later database read. The smallest change for a separately approved future capture is a scoped role OID/name dictionary for grantors/grantees used by the selected ua_owner default ACLs, or to project resolved grantor/grantee names and explicit PUBLIC/unresolved markers directly beside those OIDs. Bind it to the same capture/transaction and query/output hashes. No signing service, provider read or broader role inventory is needed. New-capture identity cannot be used as a witness for deleted historical-cluster OIDs.

The already-fixed report contract is retained: no full comparison → NOT_READY, comparison_performed=false, total_mismatch_count=null; not “0 mismatches.” New data/hash/source inspection and this QA witness export only. No SQL, DB, controller, model, cleanup, tests, baseline writes, provider action or upload occurred. Frozen input hashes were rechecked unchanged. SQL B readiness false; primary apply/activation and G01–G11 HOLD/open.
