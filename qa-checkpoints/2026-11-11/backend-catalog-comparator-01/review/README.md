# Offline catalog comparator candidate — local review only

Base: `de2adf023428a374f075faa421ece9e1deafaf36`, tree `bc891240798d9bf56ee52c4a0f0ecede8ed33552`.
This is a separate 270-file accepted-source copy with exactly three additions under
`tests/backend/db-bootstrap`. No application, SQL, collector, configuration or dependency
was changed. No Git metadata/branch operation or remote publication occurred.

## Behavior and trust boundary

`compare(baseline_bytes, externally_pinned_baseline_sha256, observation_bytes,
context_evidence)` is a pure in-memory historical-only API. The evidence bundle has
exactly `context_bytes`, `manifest_bytes`, `manifest_sha256`, `sqlb_observation_bytes`.
The context JSON implements the agreed required ContextEvidenceV1 fields, the two
SQL B reference identities, and required `projection_scope`. The sealed manifest
binds baseline/context/raw snapshot/SQL B bytes and the candidate/structural/reference
identities. A sample exact context and manifest accompany this candidate.

The operator/reviewer must independently choose the immutable baseline and manifest
pins. The consumer cannot authenticate who approved a manifest. A hash supplied by
an untrusted caller is not external approval. New author-proposed pins in the source
manifest await independent review; they are not read from a baseline self-hash.

Every serialized input is limited to 1 MiB, decoded as strict UTF8/JSON, and checked
for duplicate members, exact types/member sets and duplicate natural identities.
Raw bytes are pinned before parsing. Pretty candidate bytes and raw stdout remain
different identities despite equal JSON values. Canonical hashes are compared as
captured; no whitespace/cast/quote/SQL-text normalization or canonical re-derivation
is performed. Ordered key/FK/index column vectors retain semantic order.

The historical profile always remains NOT_READY, comparison_performed=false,
total_mismatch_count=null, runtime_readiness=false, reason
DEFAULT_ACL_ROLE_NAME_WITNESS_MISSING. OID16388 has no retained role-name witness.
The observation supports owner-filtered default-ACL scope and a numeric self-grant
pattern; it does not prove 16388 is ua_owner. Later capture evidence or caller flags
cannot repair this historical run. FRESH_OBSERVATION is unsupported in v1.

The test file alone constructs a different test-only policy/profile and synthetic
sealed bindings, and calls the same private validation/comparison pipeline. No
caller flag or public compare() option selects that root. Every such result is
SYNTHETIC/runtime_readiness=false; it is not a new DB observation. This separates
public API invocation paths, not arbitrary Python code execution: trusted Python
code can import private helpers. There is no signing service or Python sandbox claim.

For fully bound synthetic inputs, comparable catalog drift is MISMATCH; malformed,
unresolved, ambiguous, incomplete or incompatible inputs are NOT_READY. All fields
are compared after 100 stored detail entries. Output is capped at 65,536 UTF8 bytes,
with full mismatch count and report_truncated; no comparison is never reported as
zero mismatches. Details contain fixed codes and bounded reviewed identities only.
Unknown names/definitions/configuration/literals are not copied to reports.

## Exact bounded projection

The baseline preserves 114 canonical objects /246 slots: 115 hashes and 131 explicit
NULLs, 30 tables/137 columns, source structural expectations and all 21 typed SQL B
sections. The retained 832-line SQL B wire string is included to keep these three
files sufficient to reconstruct the historical test bytes. Raw snapshot bytes are
reconstructed by the tested original JSON serialization, never by the consumer.

Capture-local resolution retains 13 relation, eight helper and two base-type witness
maps, plus the unresolved role. Of137 column bindings,76 are capture-vector-backed
and61 source-constrained fresh-CREATE deductions. Those labels are preserved in the
historical baseline; generic comparable tests must provide explicit bindings and
never infer attnum from row rank. Renumbered OIDs and gapped attnums have positive
controls using natural identities/explicit vectors.

Included: named key/FK structure and ordered actions/deferral; exact user triggers
including captured tgtype; multiplicity-preserving internal-trigger semantic
multisets; explicit-domain ACL and captured array-usage consistency diagnostics.
Excluded explicitly in baseline, context and reports: exact internal trigger-to-FK
edge, internal tgtype, actual array-element name graph. Generated suffixes and
underscore names are not used to invent those edges. This is not universal database
graph equivalence. Implicit row/array type USAGE is not blanket-denied. The deferred
draft-question position index retains immediate=false;12 conflict arbiters remain
immediate. Captured unpopulated pin flags, including SQL B readiness=false, stay false.

## Validation

Final command: Python `-B -m unittest discover -s tests/backend/db-bootstrap
-p test_compare_catalog.py -v`; exact executable, cwd, six environment values,
Python/platform, UTC and before/after source identities are in verification.json.
532 tests PASS,0 skips,exit0. This includes115 individual hash mutations,131 NULL-slot
mutations and114 missing-object mutations, each with valid independent test bindings
and required MISMATCH/semantic-comparison assertions. Other controls cover trust
substitution; schema/UTF8/nonfinite/duplicate/context/completeness faults; owners,
roles, ACLs, policies, memberships, RLS/FORCE, index/constraint/trigger drift; report
bounds/full counts; unresolved mappings; OID renumbering and explicit gapped attnums.
The public historical positive calibration is NOT_READY, not CATALOG_MATCH.

An initial498-test run passed before additional required controls and baseline
consistency validation were added. Its log/test snapshot and post-run source binding
are retained locally; a pre-launch digest/UTC record was not captured for that first
run. The final run has explicit UTC and before/after fingerprints. No product-test
failure was hidden. A separate first replay harness failed because it compared local
0600 source permissions against patch-created0644 files. That assertion and copy are
retained; both represent Git mode100644. The corrected fresh-copy replay has four
exit0 steps: forward check/apply and reverse check/apply,273 forward files and270
reverse files. All270 pre-existing blobs, Git modes and physical modes remain exact.
No source bytes changed to address that harness assertion.

## Review artifacts and reconstruction

The inventory is an exact local review selection, not publication authorization.
Three source files plus candidate.patch and compact final evidence are selected.
Full run/scope/replay JSON records are nested in verification.json; serializing those
nested objects with json.dumps(indent=2)+LF reconstructs the exact original records,
which was verified. The patch is deterministically reconstructible from the three
new UTF8 files using difflib.unified_diff from an empty list, /dev/null to b/path,
with `diff --git` and `new file mode 100644` headers, in sorted path order.

Original17 received files/423,170 bytes are hash-verified and unchanged. Input receipt
lists every identity. Their original SQL/commands were treated as data, never run.
The full vendor source archive,1,640-entry installed-tool manifest, complete original
runtime/controller/cleanup packet and other-worker QA workspace files are not part of
this bounded handoff and were not accessed. Their relayed reviews are out-of-band
context, not a flag that the comparator authenticates. Initial-run raw log/source,
raw base270 fingerprints, separate pre-consolidation JSON records and failed transport
copies remain local and are omitted from the minimal selection; request exact named
records if needed. None limits reproduction of the final532-unit-test claim from the
three source files. The input/canonical provenance still depends on the separately
reviewed retained packet, not hashes alone.

No SQL compilation, PostgreSQL/catalog capture, application row/trigger behavior,
positive/cross-person RLS, concurrency, COMMIT durability/fault or live Supabase test
was run. Independent review of this candidate is pending. SQL B readiness remains
false; primary apply/activation and G01-G11 HOLD/open. No upload is authorized.
