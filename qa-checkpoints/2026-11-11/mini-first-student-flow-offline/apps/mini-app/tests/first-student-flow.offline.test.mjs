import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { createProductionOwnerConnection } from '../src/production-connection.ts';
import { StudentFlow } from '../src/flow.ts';
import { STUDENT_CONTRACT_SHA256 } from '../src/owner-client/student-client.ts';

// An ordered response script, not an alternative API/controller, CAS store or DB.
// Only the accepted production client/adapter and existing StudentFlow execute.
const require = createRequire(import.meta.url);
const { buildView } = require('../../../tests/backend/validator/view-builder.cjs');
const { compileView } = require('../../../tests/backend/validator/ajv-config.cjs');
const rawContract = readFileSync(new URL('../../../contracts/clerk-review.openapi.json', import.meta.url));
const contract = JSON.parse(rawContract);
assert.equal(createHash('sha256').update(rawContract).digest('hex'), STUDENT_CONTRACT_SHA256);
const { validators } = compileView(buildView(rawContract).view);
const fixture = JSON.parse(readFileSync(new URL('./fixtures/first-student-flow.offline.json', import.meta.url)));
assert.equal(fixture.contract_sha256, STUDENT_CONTRACT_SHA256);
const clone = value => structuredClone(value);
const assignment = fixture.meta.assignment_id;
const attempt = fixture.started.id;
const question = fixture.quiz.questionId;
const root = 'https://api.example.test/api/v1';
const assignmentPath = '/exams/' + assignment;
const attemptPath = '/attempts/' + attempt;
const savePath = attemptPath + '/answers/' + question;

function validate(name, value) {
  const validator = validators.get(name);
  assert.ok(validator, 'CURRENT_COMPONENT_REQUIRED:' + name);
  assert.ok(validator(value), name + ':' + JSON.stringify(validator.errors));
}

function resolveRef(value) {
  while (value.$ref) value = value.$ref.slice(2).split('/').reduce((node, key) => node[key], contract);
  return value;
}

function component(schema) {
  assert.ok(schema.$ref?.startsWith('#/components/schemas/'));
  return schema.$ref.split('/').at(-1);
}

function scriptFor(method) {
  const authPath = '/auth/' + method;
  const session = {
    token_type: 'Bearer', access_token: 'synthetic-opaque-access', refresh_token: 'synthetic-opaque-refresh',
    // Synthetic expiry only; no production TTL policy is inferred or configured.
    expires_at: new Date(Date.now() + 60_000).toISOString(),
    refresh_expires_at: new Date(Date.now() + 120_000).toISOString(), profile: fixture.profile,
  };
  const steps = [];
  const add = (label, verb, path, template, data, body, extra = {}) => steps.push({ label, verb, path, template, data, body, ...extra });
  add('launch', 'POST', authPath, authPath, session, method === 'telegram' ? { init_data: 'synthetic-launch-proof' } : {});
  add('profile', 'GET', '/me', '/me', fixture.profile);
  add('eligible assignments', 'GET', '/exams', '/exams', [fixture.meta]);
  add('open instructions', 'GET', assignmentPath, '/exams/{assignment_id}', fixture.meta);
  add('start', 'POST', assignmentPath + '/attempts', '/exams/{assignment_id}/attempts', fixture.started, { confirmed: true }, { key: true });
  add('save1 current', 'GET', attemptPath, '/attempts/{attempt_id}', fixture.started);
  add('save1', 'PUT', savePath, '/attempts/{attempt_id}/answers/{question_id}', fixture.ack1,
    { selected_option_id: fixture.quiz.orderedSelections[0], expected_revision: 0 });
  // A second existing UI flow keeps revision1, modelling a stale tab without
  // mutating production state or giving the UI a new interaction.
  add('stale tab profile', 'GET', '/me', '/me', fixture.profile);
  add('stale tab assignments', 'GET', '/exams', '/exams', [fixture.metaActive]);
  add('stale tab metadata', 'GET', assignmentPath, '/exams/{assignment_id}', fixture.metaActive);
  add('stale tab revision1', 'GET', attemptPath, '/attempts/{attempt_id}', fixture.savedOnce);
  add('save2 current', 'GET', attemptPath, '/attempts/{attempt_id}', fixture.savedOnce);
  add('save2 same question', 'PUT', savePath, '/attempts/{attempt_id}/answers/{question_id}', fixture.ack2,
    { selected_option_id: fixture.quiz.orderedSelections[1], expected_revision: 1 });
  add('stale save current', 'GET', attemptPath, '/attempts/{attempt_id}', fixture.savedTwice);
  add('stale save denied', 'PUT', savePath, '/attempts/{attempt_id}/answers/{question_id}', fixture.staleError,
    { selected_option_id: fixture.quiz.orderedSelections[0], expected_revision: 1 }, { status: 409 });
  add('submit current', 'GET', attemptPath, '/attempts/{attempt_id}', fixture.savedTwice);
  add('submit', 'POST', attemptPath + '/submit', '/attempts/{attempt_id}/submit', fixture.result, undefined, { key: true });
  add('terminal metadata', 'GET', assignmentPath, '/exams/{assignment_id}', fixture.metaCompleted);
  add('terminal attempt', 'GET', attemptPath, '/attempts/{attempt_id}', fixture.completed);
  add('result scope', 'GET', attemptPath, '/attempts/{attempt_id}', fixture.completed);
  add('result', 'GET', attemptPath + '/result', '/attempts/{attempt_id}/result', fixture.result);
  let cursor = 0;
  const observations = [];
  const fetcher = async request => {
    const step = steps[cursor++];
    assert.ok(step, 'UNEXPECTED_EXTRA_REQUEST');
    assert.equal(request.url, root + step.path, step.label);
    assert.equal(request.method, step.verb, step.label);
    assert.equal(request.credentials, 'omit');
    assert.equal(request.cache, 'no-store');
    assert.equal(request.redirect, 'error');
    assert.equal(request.mode, 'cors');
    assert.equal(request.headers.get('accept'), 'application/json');
    const body = await request.clone().text();
    assert.deepEqual(body ? JSON.parse(body) : undefined, step.body, step.label);
    const operation = contract.paths[step.template][step.verb.toLowerCase()];
    assert.ok(operation, 'CURRENT_OPERATION_REQUIRED');
    if (body) {
      assert.equal(request.headers.get('content-type'), 'application/json');
      validate(component(operation.requestBody.content['application/json'].schema), JSON.parse(body));
    }
    const key = request.headers.get('idempotency-key');
    if (step.key) assert.ok(key && key.length >= 8 && key.length <= 128);
    else assert.equal(key, null);
    if (step.label === 'launch') {
      assert.equal(request.headers.get('authorization'), method === 'clerk' ? 'Bearer synthetic-launch-proof' : null);
    } else assert.equal(request.headers.get('authorization'), 'Bearer synthetic-opaque-access');
    const status = step.status ?? 200;
    const envelope = status === 200 ? { data: clone(step.data) } : clone(step.data);
    const response = resolveRef(operation.responses[String(status)]);
    validate(component(response.content['application/json'].schema), envelope);
    const publicBytes = JSON.stringify(envelope);
    assert.ok(!publicBytes.includes('correctOptionId'));
    observations.push({ label: step.label, method: step.verb, path: step.path, status,
      ...(step.verb === 'PUT' ? { selected_option_id: step.body.selected_option_id, expected_revision: step.body.expected_revision } : {}),
      ...(step.key ? { idempotency_key_present: true } : {}), schema_valid: true });
    return new Response(publicBytes, { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
  };
  return { fetcher, observations, complete() { assert.equal(cursor, steps.length, 'SCRIPT_NOT_CONSUMED'); } };
}

test('synthetic quiz has four ordered distinct options and a valid private correctOptionId', () => {
  const q = fixture.started.questions[0];
  assert.equal(q.options.length, 4);
  assert.equal(new Set(q.options.map(o => o.id)).size, 4);
  assert.equal(new Set(q.options.map(o => o.blocks[0].markdown)).size, 4);
  assert.deepEqual(q.options.map(o => o.display_position), [1, 2, 3, 4]);
  assert.deepEqual(q.options.map(o => o.id), fixture.quiz.optionIds);
  assert.ok(fixture.quiz.optionIds.includes(fixture.quiz.correctOptionId));
  assert.deepEqual(fixture.quiz.orderedSelections, fixture.quiz.optionIds.slice(0, 2));
  for (const snapshot of [fixture.savedOnce, fixture.savedTwice]) {
    assert.equal(snapshot.answers.length, 1, 'one declared answer for the same question, not a DB row proof');
    assert.equal(snapshot.answers[0].question_id, question);
  }
  assert.deepEqual([fixture.ack1.revision, fixture.ack2.revision], [1, 2]);
  assert.ok(!JSON.stringify(fixture.started).includes('correctOptionId'));
  const bad = clone(fixture.ack2); bad.revision = 0;
  assert.equal(validators.get('Answer')(bad), false, 'schema validator rejects an invalid fixture ACK');
});

for (const loginMethod of ['telegram', 'clerk']) {
  test(`offline ${loginMethod}: launch/start/save/save same answer/stale denial/submit/result`, async t => {
    t.mock.method(globalThis, 'fetch', async () => { throw new Error('NATIVE_NETWORK_FORBIDDEN'); });
    const h = scriptFor(loginMethod);
    const app = createProductionOwnerConnection({ mode: 'production', baseUrl: root,
      contractSha256: STUDENT_CONTRACT_SHA256 }, h.fetcher, { loginMethod });
    await app.auth.login('synthetic-launch-proof');
    const flow = new StudentFlow(app.port, () => 0, undefined, loginMethod);
    await flow.enter(); assert.equal(flow.state.screen, 'exams');
    await flow.openExam(flow.state.exams[0]); assert.equal(flow.state.screen, 'instructions');
    await flow.start(); assert.equal(flow.state.screen, 'attempt');
    const deadline = flow.state.attempt.deadline, generation = flow.state.attempt.generation;
    assert.deepEqual(flow.state.attempt.questions[0].options.map(o => o.id), fixture.quiz.optionIds);
    await flow.choose(question, fixture.quiz.orderedSelections[0]);
    assert.deepEqual(flow.state.attempt.answers[question], { optionId: fixture.quiz.orderedSelections[0], revision: 1 });
    const staleTab = new StudentFlow(app.port, () => 0, undefined, loginMethod);
    await staleTab.enter(); await staleTab.openExam(staleTab.state.exams[0]);
    assert.equal(staleTab.state.attempt.answers[question].revision, 1);
    await flow.choose(question, fixture.quiz.orderedSelections[1]);
    assert.deepEqual(Object.keys(flow.state.attempt.answers), [question]);
    assert.deepEqual(flow.state.attempt.answers[question], { optionId: fixture.quiz.orderedSelections[1], revision: 2 });
    await staleTab.choose(question, fixture.quiz.orderedSelections[0]);
    assert.equal(staleTab.state.failure.kind, 'conflict');
    assert.equal(staleTab.state.failure.code, 'REVISION_CONFLICT');
    assert.equal(staleTab.state.needsRead, true);
    assert.equal(staleTab.state.draft.optionId, fixture.quiz.orderedSelections[0]);
    assert.equal(staleTab.state.attempt.answers[question].revision, 1, 'denial is not a successful ACK');
    assert.equal(flow.state.attempt.answers[question].revision, 2);
    const requestsAfterDenial = h.observations.length;
    await staleTab.submit(); assert.equal(h.observations.length, requestsAfterDenial, 'existing UX blocks submit until reconciled');
    await flow.submit(); assert.equal(flow.state.screen, 'result');
    assert.equal(flow.state.failure, null);
    assert.deepEqual([flow.state.result.earned, flow.state.result.maximum, flow.state.result.percentage, flow.state.result.bonus], ['2.0', '2.0', '100.00', null]);
    assert.equal(flow.state.attempt.deadline, deadline); assert.equal(flow.state.attempt.generation, generation);
    assert.deepEqual(flow.state.attempt.answers, {}); assert.deepEqual(flow.state.attempt.questions, []);
    h.complete();
    assert.deepEqual(h.observations.filter(x => x.method === 'PUT').map(x => [x.expected_revision, x.status]), [[0, 200], [1, 200], [1, 409]]);
    if (process.env.STUDENT_FLOW_EVIDENCE_DIR) writeFileSync(new URL(`file://${process.env.STUDENT_FLOW_EVIDENCE_DIR}/${loginMethod}.observations.json`),
      JSON.stringify({ boundary: 'scripted in-process transport; no HTTP server/provider/database', loginMethod,
        contract_sha256: STUDENT_CONTRACT_SHA256, base_commit: fixture.base_commit, requests: h.observations }, null, 2) + '\n');
  });
}
