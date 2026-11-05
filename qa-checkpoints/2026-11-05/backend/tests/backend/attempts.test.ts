import { test } from "node:test";
import assert from "node:assert/strict";
import { ApiFault } from "../../supabase/functions/univeracademy-api/fault.ts";
import { startAttempt, saveAnswer, submitAttempt, studentView, result }
  from "../../supabase/functions/univeracademy-api/attempts.ts";
import { ordinaryScore, ratio, validatePublishedTest }
  from "../../supabase/functions/univeracademy-api/ordinary.ts";
import { access, admission, clock, current, published, started } from "./fixtures.ts";

const error = (code: string, status: number) => (value: unknown) =>
  value instanceof ApiFault && value.code === code && value.status === status;

test("start uses full duration beyond admission close, resume preserves mapping/time/answers", () => {
  const first = started();
  assert.equal(first.deadlineAt, clock + 60_000);
  assert.ok(first.deadlineAt > admission.closesAt);
  const saved = saveAnswer(access, first, current, "synthetic-question-0",
    { selected_option_id: "synthetic-option-0-0", expected_revision: 0 }, clock + 100).record;
  const resumed = startAttempt({ access, admission, published: published(), existing: saved,
    id: "must-not-replace-id", confirmed: true, now: admission.closesAt + 1 });
  assert.deepEqual(resumed, saved);
  assert.deepEqual(new Set(first.questionOrder.map((q) => q.questionId)),
    new Set(published().questions.map((q) => q.id)));
  for (const q of first.questionOrder) {
    assert.deepEqual(new Set(q.optionIds),
      new Set(published().questions.find((item) => item.id === q.questionId)!.optionIds));
  }
});

test("normal start checks exclusive close and requires confirmation", () => {
  const input = { access, admission, published: published(), existing: null,
    id: current.id, confirmed: true as const, now: admission.closesAt };
  assert.throws(() => startAttempt(input), error("ADMISSION_CLOSED", 409));
  assert.throws(() => startAttempt({ ...input, now: admission.opensAt - 1 }),
    error("ADMISSION_CLOSED", 409));
  assert.throws(() => startAttempt({ ...input, now: clock, confirmed: false as true }),
    error("VALIDATION_ERROR", 422));
});

test("profile, roster, current group and membership epoch cannot be bypassed", () => {
  const input = { access, admission, published: published(), existing: null,
    id: current.id, confirmed: true as const, now: clock };
  assert.throws(() => startAttempt({ ...input, admission: { ...admission, profileComplete: false } }),
    error("PROFILE_INCOMPLETE", 409));
  for (const changed of [{ rostered: false }, { activeGroupId: "foreign-group" }, { grantEpoch: 6 }]) {
    assert.throws(() => startAttempt({ ...input, admission: { ...admission, ...changed } }),
      error("EXAM_ACCESS_REVOKED", 403));
  }
});

test("one normal demo cannot be restarted via another assignment/version", () => {
  const original = started();
  assert.throws(() => startAttempt({
    access: { ...access, assignmentIds: [...access.assignmentIds, "new-assignment"] },
    admission: { ...admission, assignmentId: "new-assignment" },
    published: { ...published(), versionId: "new-version" }, existing: original,
    id: "new-attempt", confirmed: true, now: clock,
  }), error("NORMAL_ATTEMPT_USED", 409));
});

test("CAS prevents stale second-device overwrite; null clear advances revision", () => {
  const original = started();
  const first = saveAnswer(access, original, current, "synthetic-question-0",
    { selected_option_id: "synthetic-option-0-0", expected_revision: 0 }, clock + 1);
  assert.equal(first.response.ok, true);
  assert.equal(original.answers.length, 0);
  assert.throws(() => saveAnswer(access, first.record, current, "synthetic-question-0",
    { selected_option_id: "synthetic-option-0-1", expected_revision: 0 }, clock + 2),
  error("REVISION_CONFLICT", 409));
  const cleared = saveAnswer(access, first.record, current, "synthetic-question-0",
    { selected_option_id: null, expected_revision: 1 }, clock + 3);
  assert.equal(cleared.record.answers[0].revision, 2);
  assert.equal(cleared.record.answers[0].selectedOptionId, null);
  assert.equal(cleared.record.seriesStateRevision, 3);
});

test("invalid/foreign option, unknown question and malformed CAS input are rejected", () => {
  const record = started();
  assert.throws(() => saveAnswer(access, record, current, "synthetic-question-0",
    { selected_option_id: "synthetic-option-1-0", expected_revision: 0 }, clock + 1),
  error("INVALID_OPTION", 422));
  assert.throws(() => saveAnswer(access, record, current, "other-question",
    { selected_option_id: null, expected_revision: 0 }, clock + 1), error("NOT_FOUND", 404));
  for (const revision of [-1, 0.5, NaN, Infinity]) {
    assert.throws(() => saveAnswer(access, record, current, "synthetic-question-0",
      { selected_option_id: null, expected_revision: revision }, clock + 1),
    error("VALIDATION_ERROR", 422));
  }
  assert.throws(() => saveAnswer(access, record, current, "synthetic-question-0",
    { selected_option_id: null, expected_revision: 0, person_id: "injected" } as never, clock + 1),
  error("VALIDATION_ERROR", 422));
});

test("save at exact deadline produces a committable expired transition and no late answer", () => {
  const saved = saveAnswer(access, started(), current, "synthetic-question-0",
    { selected_option_id: "synthetic-option-0-0", expected_revision: 0 }, clock + 1).record;
  const late = saveAnswer(access, saved, current, "synthetic-question-1",
    { selected_option_id: "synthetic-option-1-0", expected_revision: 0 }, saved.deadlineAt);
  assert.equal(late.response.ok, false);
  if (!late.response.ok) assert.equal(late.response.error.code, "ATTEMPT_EXPIRED");
  assert.equal(late.record.status, "expired");
  assert.equal(late.record.completedAt, saved.deadlineAt);
  assert.equal(late.record.answers.length, 1);
  assert.deepEqual(late.record.ordinary!.earned, ratio(1n));
});

test("submit stores committed answers once, then replay returns the same result", () => {
  const saved = saveAnswer(access, started(), current, "synthetic-question-0",
    { selected_option_id: "synthetic-option-0-0", expected_revision: 0 }, clock + 1).record;
  const submitted = submitAttempt(access, saved, current, clock + 2);
  assert.equal(submitted.record.status, "submitted");
  assert.deepEqual(submitted.record.ordinary!.earned, ratio(1n));
  assert.deepEqual(submitted.record.ordinary!.maximum, ratio(3n));
  assert.deepEqual(submitted.record.ordinary!.percentage, ratio(100n, 3n));
  const replay = submitAttempt(access, submitted.record, current, saved.deadlineAt + 1);
  assert.deepEqual(replay, submitted);
  assert.throws(() => saveAnswer(access, submitted.record, current, "synthetic-question-0",
    { selected_option_id: null, expected_revision: 1 }, clock + 3), error("ATTEMPT_TERMINAL", 409));
});

test("late submit is expired, not self-submitted, and ordinary remains available", () => {
  const record = started();
  const terminal = submitAttempt(access, record, current, record.deadlineAt);
  assert.equal(terminal.record.status, "expired");
  assert.deepEqual(terminal.record.ordinary!.earned, ratio(0n));
  assert.deepEqual(result(access, terminal.record, current, record.deadlineAt + 1), terminal);
});

test("result/read lazily expire; active result is not exposed early", () => {
  const record = started();
  assert.throws(() => result(access, record, current, clock + 1), error("ATTEMPT_NOT_COMPLETED", 409));
  const view = studentView(access, record, current, record.deadlineAt + 1);
  assert.equal(view.record.status, "expired");
  assert.deepEqual(view.response.value.questionOrder, []);
  assert.deepEqual(view.response.value.answers, []);
  assert.ok(view.record.ordinary);
});

test("current authorization is checked before terminal replay or deadline side effects", () => {
  const record = started();
  const terminal = submitAttempt(access, record, current, clock + 1).record;
  for (const candidate of [record, terminal]) {
    assert.throws(() => submitAttempt({ ...access, personId: "other-pupil" }, candidate,
      current, record.deadlineAt + 1), error("NOT_FOUND", 404));
    assert.throws(() => submitAttempt({ ...access, assignmentIds: [] }, candidate,
      current, record.deadlineAt + 1), error("NOT_FOUND", 404));
    assert.throws(() => submitAttempt({ ...access, enabled: false }, candidate,
      current, record.deadlineAt + 1), error("ACCOUNT_DISABLED", 403));
    assert.throws(() => submitAttempt({ ...access, proofKind: "staff_jwt" } as never, candidate,
      current, record.deadlineAt + 1), error("FORBIDDEN", 403));
  }
  assert.equal(record.status, "in_progress");
  assert.equal(record.ordinary, null);
});

test("old attempt/current generation and cancelled predecessor are rejected", () => {
  for (const record of [started(), { ...started(), status: "cancelled" as const }]) {
    assert.throws(() => studentView(access, record, { id: "successor", generation: 2 }, clock + 1),
      error("ATTEMPT_SUPERSEDED", 409));
  }
  assert.throws(() => saveAnswer(access, started(), { ...current, generation: 2 },
    "synthetic-question-0", { selected_option_id: null, expected_revision: 0 }, clock + 1),
  error("ATTEMPT_SUPERSEDED", 409));
});

test("student projection contains no answer key, points, person identity or internal snapshot", () => {
  const view = studentView(access, started(), current, clock + 1).response.value;
  const json = JSON.stringify(view);
  for (const field of ["correctOptionId", "individualPoints", "published", "personId", "ordinary"]) {
    assert.ok(!json.includes(field));
  }
  const record = started();
  const response = studentView(access, record, current, clock + 1).response.value;
  (response.questionOrder[0].optionIds as string[]).reverse();
  assert.notDeepEqual(response.questionOrder, record.questionOrder);
});

test("published snapshot cannot change underneath an existing attempt", () => {
  const test = published();
  const record = startAttempt({ access, admission, published: test, existing: null,
    id: current.id, confirmed: true, now: clock });
  (test.questions[0].optionIds as string[])[0] = "mutated-after-publish";
  assert.equal(record.published.questions[0].correctOptionId, "synthetic-option-0-0");
  assert.ok(record.published.questions[0].optionIds.includes("synthetic-option-0-0"));
});

test("ordinary supports exact fractional bases without per-item or percentage rounding", () => {
  const base = published();
  const weighted = { ...base, individualEnabled: true, questions: base.questions.map((q, i) => ({
    ...q, individualPoints: [ratio(1n, 10n), ratio(2n, 10n), ratio(7n, 10n)][i],
  })) };
  const score = ordinaryScore(weighted,
    new Map([["synthetic-question-0", "synthetic-option-0-0"],
      ["synthetic-question-1", "synthetic-option-1-0"]]), clock);
  assert.deepEqual(score.earned, ratio(3n, 10n));
  assert.deepEqual(score.maximum, ratio(1n));
  assert.deepEqual(score.percentage, ratio(30n));
  const wrong = ordinaryScore(weighted,
    new Map([["synthetic-question-0", "synthetic-option-0-1"], ["synthetic-question-1", null]]), clock);
  assert.deepEqual(wrong.earned, ratio(0n));
});

test("publish validation rejects empty/nonpositive/ambiguous config and invalid four-option key", () => {
  const base = published();
  for (const invalid of [
    { ...base, questions: [] },
    { ...base, individualEnabled: undefined },
    { ...base, durationMs: 0 },
    { ...base, individualEnabled: true,
      questions: [{ ...base.questions[0], individualPoints: ratio(0n) }] },
  ]) assert.throws(() => validatePublishedTest(invalid as never), error("INVALID_GRADING_CONFIG", 422));
  assert.throws(() => validatePublishedTest({ ...base,
    questions: [{ ...base.questions[0], correctOptionId: "foreign-key" }] }), error("INVALID_OPTION", 422));
  assert.throws(() => validatePublishedTest({ ...base,
    questions: [base.questions[0], base.questions[0]] }), error("INVALID_GRADING_CONFIG", 422));
});

test("invalid server clock is rejected instead of creating an unbounded attempt", () => {
  for (const now of [NaN, Infinity, -1, 0.5]) {
    assert.throws(() => startAttempt({ access, admission, published: published(), existing: null,
      id: current.id, confirmed: true, now }), error("SERVICE_UNAVAILABLE", 503));
  }
});
