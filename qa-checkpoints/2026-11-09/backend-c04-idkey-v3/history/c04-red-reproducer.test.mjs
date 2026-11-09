import { test, after } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { isDeepStrictEqual } from "node:util";
import { guardRemovalActiveTest, REMOVAL_DECISION as D } from "/workspace/lab_univeracademy/workspaces/univeracademy/supabase/functions/univeracademy-api/membership-activity.ts";
import { staffFixture, staffIds } from "/workspace/lab_univeracademy/workspaces/univeracademy/tests/backend/staff-fixture.ts";
import { ids, id, clock } from "/workspace/lab_univeracademy/workspaces/univeracademy/tests/backend/http-fixture.ts";

const sourcePath = "/workspace/lab_univeracademy/workspaces/univeracademy/supabase/functions/univeracademy-api/membership-activity.ts";
const digest = bytes => createHash("sha256").update(bytes).digest("hex");
const sourceSha = digest(readFileSync(sourcePath));
assert.equal(sourceSha, "a5976d5421ddd671ef61b5d8a73f4d1e39228659eee772c41d02934728616282");
const rows = [], clone = value => structuredClone(value);
function paths(a, b, prefix = "") {
  if (Object.is(a, b)) return [];
  if (a && b && typeof a === "object" && typeof b === "object")
    return [...new Set([...Object.keys(a), ...Object.keys(b)])].sort()
      .flatMap(k => paths(a[k], b[k], `${prefix}/${k.replaceAll("~", "~0").replaceAll("/", "~1")}`));
  return [prefix];
}
async function fixture(offset, mismatch) {
  const f = staffFixture(); f.store.state.groups[ids.group].revision = 4;
  const { token, attempt } = await f.start(), A = attempt.id, B = id(999);
  assert.notEqual(A, B);
  assert.equal((await f.studentCall("PUT", `/attempts/${A}/answers/${ids.question}`,
    { selected_option_id: ids.correct, expected_revision: 0 }, token)).status, 200);
  const deadline = Date.parse(attempt.deadline_at), sk = `${ids.person}/${ids.demo}`;
  assert.equal(f.store.state.student.series[sk].currentAttemptId, A);
  assert.equal(f.store.state.student.series[sk].generation, 1);
  assert.equal(f.store.state.student.attempts[A].generation, 1);
  if (mismatch) f.store.state.student.attempts[A] = { ...f.store.state.student.attempts[A], id: B };
  f.store.time = deadline + offset;
  const context = { proof: { kind: "staff_verified", subject: "synthetic-admin", notBefore: clock - 1, expiresAt: clock + 1_000_000 },
    groupId: ids.group, expectedGroupRevision: 4, expectedMembershipRevision: 7 };
  return { ...f, token, A, B, deadline, sk, context };
}
async function invoke(f) {
  let result, error;
  try { result = await f.store.transaction(tx => guardRemovalActiveTest(tx, ids.person, D.CONTINUE, f.context)); }
  catch (caught) { error = caught; }
  return { result, error };
}

for (const [label, offset] of [["BEFORE", -1], ["EQUALITY", 0], ["AFTER", 1]]) {
  test(`C04-IDKEY-${label}: key A with record.id B must reject technically with S0 intact`, async () => {
    const f = await fixture(offset, true), S0 = clone(f.store.state), observed = await invoke(f);
    const after = f.store.state, equal = isDeepStrictEqual(after, S0);
    rows.push({ case_id: `C04-IDKEY-${label}`, source_sha256: sourceSha,
      input: { map_key: f.A, record_id: f.B, series_current_attempt_id: f.A, generation: 1,
        now: f.store.time, deadline: f.deadline, decision: "CONTINUE", actor_scope_and_CAS: "VALID" },
      expected: { technical_error: "RESPONSE_INVARIANT_FAILED", status: 500, state: "S0", write_paths: [] },
      actual: { result_kind: observed.result?.kind ?? null, error: observed.error?.code ?? null,
        status: observed.error?.status ?? null, state_equals_S0: equal, write_paths: paths(S0, after),
        stored_attempt_status: after.student.attempts[f.A].status },
      classification: "AUTHOR_RUNTIME_COUNTEREXAMPLE", oracle: "Direct expected technical rejection and full S0 equality; no canonical/helper-generated expected state" });
    assert.ok(equal, "S0 must remain intact");
    assert.ok(observed.error, `Expected technical invariant failure, observed ${observed.result?.kind}`);
    assert.equal(observed.error.code, "RESPONSE_INVARIANT_FAILED"); assert.equal(observed.error.status, 500);
  });
}

test("C04-IDKEY-MIXED: valid elapsed series first must not partially commit before invalid current ID rejection", async () => {
  const f = await fixture(1, false), s = f.store.state;
  // Create the second current series through the existing student HTTP fixture,
  // while both records are valid; only afterwards corrupt the first record ID.
  f.store.time = clock;
  const otherAssignment = s.student.assignments[staffIds.future];
  otherAssignment.admission.opensAt = clock - 1000;
  otherAssignment.admission.closesAt = clock + 1000;
  const started = await f.studentCall("POST", `/exams/${staffIds.future}/attempts`, { confirmed: true }, f.token);
  assert.equal(started.status, 200);
  const C = started.json.data.id;
  assert.equal((await f.studentCall("PUT", `/attempts/${C}/answers/${ids.question}`,
    { selected_option_id: ids.correct, expected_revision: 0 }, f.token)).status, 200);
  // Each successful fixture transaction replaces state; use its latest snapshot.
  const state = f.store.state, otherKey = `${ids.person}/${state.student.attempts[C].published.demoId}`;
  assert.equal(state.student.series[otherKey].currentAttemptId, C);
  assert.equal(state.student.attempts[C].id, C);
  assert.equal(state.student.attempts[C].generation, state.student.series[otherKey].generation);
  state.student.attempts[f.A] = { ...state.student.attempts[f.A], id: f.B };
  // Put the valid elapsed current series/record first to cover validation order.
  const goodSeries = state.student.series[otherKey], badSeries = state.student.series[f.sk];
  state.student.series = { [otherKey]: goodSeries, [f.sk]: badSeries };
  state.student.attempts = { [C]: state.student.attempts[C], [f.A]: state.student.attempts[f.A] };
  f.store.time = f.deadline + 1;
  assert.ok(state.student.attempts[C].deadlineAt < f.store.time);
  const S0 = clone(state), observed = await invoke(f), after = f.store.state;
  rows.push({ case_id: "C04-IDKEY-MIXED", source_sha256: sourceSha,
    input: { valid_elapsed_record_first: C, invalid_map_key: f.A, invalid_record_id: f.B,
      validation_order: [otherKey, f.sk], now: f.store.time, decision: "CONTINUE", actor_scope_and_CAS: "VALID" },
    expected: { technical_error: "RESPONSE_INVARIANT_FAILED", status: 500, state: "S0", write_paths: [] },
    actual: { result_kind: observed.result?.kind ?? null, error: observed.error?.code ?? null,
      status: observed.error?.status ?? null, state_equals_S0: isDeepStrictEqual(after, S0),
      write_paths: paths(S0, after), valid_series_attempt_status_before: S0.student.attempts[C].status,
      valid_series_attempt_status_after: after.student.attempts[C].status,
      invalid_series_attempt_status_after: after.student.attempts[f.A].status },
    classification: "AUTHOR_RUNTIME_PARTIAL_MAINTENANCE_COUNTEREXAMPLE",
    oracle: "Technical failure and exact S0; no canonical/helper-derived expected state or changed-field count" });
  assert.ok(observed.error, `Expected technical invariant failure, observed ${observed.result?.kind}`);
  assert.equal(observed.error.code, "RESPONSE_INVARIANT_FAILED"); assert.equal(observed.error.status, 500);
  assert.deepEqual(after, S0, "No valid-series partial maintenance may commit when any current ID context is invalid");
});

test("CONTROL-BEFORE: key/id A stays waiting with exact S0", async () => {
  const f = await fixture(-1, false), S0 = clone(f.store.state), { result, error } = await invoke(f);
  assert.equal(error, undefined); assert.deepEqual(result, { kind: "wait_for_active_test" });
  assert.deepEqual(f.store.state, S0);
  rows.push({ case_id: "CONTROL-BEFORE", result: result.kind, state_equals_S0: true, write_paths: [], oracle: "Direct S0 snapshot" });
});

test("CONTROL-EQUALITY: key/id A expires with independently specified fixture fields", async () => {
  const f = await fixture(0, false), S0 = clone(f.store.state), expected = clone(S0);
  // Independent fixture oracle. No materializeElapsedAttempts, canonical(),
  // expireForMembershipGuard, ordinaryScore or reconciliation helper is called.
  const old = S0.student.attempts[f.A];
  expected.student.attempts[f.A] = { ...old, status: "expired", completedAt: f.deadline,
    stateRevision: old.stateRevision + 1, seriesStateRevision: old.seriesStateRevision + 1,
    ordinary: { earned: { numerator: 1n, denominator: 1n }, maximum: { numerator: 2n, denominator: 1n },
      percentage: { numerator: 50n, denominator: 1n }, calculatedAt: f.deadline } };
  expected.student.series[f.sk].officialAttemptId = f.A;
  const gate = expected.student.assignments[ids.assignment].reviewGate;
  Object.assign(gate, { eligible_unresolved_count: 0, active_count: 0, recovery_ready_count: 0,
    barrier_complete: true, barrier_revision: S0.student.assignments[ids.assignment].reviewGate.barrier_revision + 1 });
  const { result, error } = await invoke(f);
  rows.push({ case_id: "CONTROL-EQUALITY", result: result?.kind, error: error?.code ?? null,
    independently_expected_state_matches: isDeepStrictEqual(f.store.state, expected),
    write_paths: paths(S0, f.store.state), oracle: "Explicit fixture expiry/result/gate fields; no new helper used to build expected state" });
  assert.equal(error, undefined); assert.equal(result, D.CONTINUE); assert.deepEqual(f.store.state, expected);
  assert.deepEqual(f.store.state.student.attempts[f.A].answers, old.answers);
  assert.equal(f.store.state.student.attempts[f.A].deadlineAt, old.deadlineAt);
});

after(() => writeFileSync(new URL("./extended-case-results.json", import.meta.url), JSON.stringify({
  published_commit: "21b8ee4a49fb02fbdb4b12de5139549caa277d64", source_file: sourcePath, source_sha256: sourceSha,
  evidence_kind: "AUTHOR_RUNTIME_NOT_INDEPENDENT_QA", source_changed: false,
  trace_kind: "BEFORE_AFTER_STATE_DIFF_NOT_TRANSIENT_OPERATION_TRACE", cases: rows,
}, null, 2) + "\n"));
