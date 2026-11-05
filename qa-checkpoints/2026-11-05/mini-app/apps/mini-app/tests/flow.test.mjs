import test from 'node:test';
import assert from 'node:assert/strict';
import { StudentFlow } from '../src/flow.ts';
import { createDemoPort } from '../src/demo-port.ts';

async function started() {
  const demo = createDemoPort();
  let clock = 0;
  const flow = new StudentFlow(demo.port, () => clock);
  await flow.register('Namuna', 'O‘quvchi');
  await flow.openExam(flow.state.exams[0]);
  await flow.start();
  return { flow, demo, advance(ms) { clock += ms; } };
}

test('pending answer is not confirmed; clearing uses the next revision', async () => {
  const { flow } = await started();
  const write = flow.choose('sample-q1', 'sample-11');
  assert.equal(flow.state.attempt.answers['sample-q1'], undefined);
  assert.equal(flow.state.draft.optionId, 'sample-11');
  await write;
  assert.deepEqual(flow.state.attempt.answers['sample-q1'], { optionId: 'sample-11', revision: 1 });
  await flow.choose('sample-q1', null);
  assert.deepEqual(flow.state.attempt.answers['sample-q1'], { optionId: null, revision: 2 });
});

test('lost save acknowledgement requires a read before another save or submit', async () => {
  const { flow, demo } = await started();
  demo.setFault('lost-save');
  await flow.choose('sample-q1', 'sample-11');
  assert.equal(flow.state.needsRead, true);
  await flow.choose('sample-q2', 'sample-21');
  await flow.submit();
  assert.equal(flow.state.attempt.answers['sample-q2'], undefined);
  assert.equal(flow.submitKey, null);
  await flow.reconcile();
  assert.equal(flow.state.draft, null);
  assert.deepEqual(flow.state.attempt.answers['sample-q1'], { optionId: 'sample-11', revision: 1 });
});

test('CAS conflict preserves both intents until explicit selection at fresh revision', async () => {
  const { flow, demo } = await started();
  demo.setFault('conflict');
  await flow.choose('sample-q1', 'sample-11');
  await flow.reconcile();
  assert.equal(flow.state.draft.optionId, 'sample-11');
  assert.equal(flow.state.attempt.answers['sample-q1'].optionId, 'sample-12');
  await flow.choose('sample-q1', 'sample-11', true);
  assert.deepEqual(flow.state.attempt.answers['sample-q1'], { optionId: 'sample-11', revision: 2 });
  assert.equal(flow.state.draft, null);
});

test('new generation drops the old unsent draft and answers', async () => {
  const { flow, demo } = await started();
  await flow.choose('sample-q1', 'sample-11');
  demo.setFault('recovery');
  await flow.choose('sample-q2', 'sample-21');
  await flow.reconcile();
  assert.equal(flow.state.attempt.generation, 2);
  assert.equal(flow.state.draft, null);
  assert.deepEqual(flow.state.attempt.answers, {});
});

test('failed read blocks writes; local clock never declares a terminal result', async () => {
  const { flow, demo, advance } = await started();
  demo.setFault('offline');
  await flow.reconcile();
  assert.equal(flow.state.needsRead, true);
  demo.setFault('none');
  await flow.reconcile();
  const before = flow.remainingSeconds();
  advance(1000);
  assert.equal(flow.remainingSeconds(), before - 1);
  advance(1e9);
  assert.equal(flow.remainingSeconds(), 0);
  await flow.choose('sample-q1', 'sample-11');
  await flow.submit();
  assert.equal(flow.state.attempt.active, true);
  assert.equal(flow.state.result, null);
  assert.deepEqual(flow.state.attempt.answers, {});
});

test('uncertain submit retains its key, blocks edits and resolves with the same key', async () => {
  const { flow, demo } = await started();
  const seen = [];
  const submit = demo.port.submit;
  demo.port.submit = (...args) => { seen.push(args[2]); return submit(...args); };
  demo.setFault('lost-submit');
  await flow.submit();
  const key = flow.submitKey;
  assert.ok(key);
  await flow.choose('sample-q1', 'sample-11');
  assert.deepEqual(flow.state.attempt.answers, {});
  await flow.submit();
  assert.deepEqual(seen, [key, key]);
  assert.equal(flow.state.screen, 'result');
  assert.equal(flow.state.result.bonus, null);
  assert.match(flow.state.result.note, /hisoblanmaydi/);
});
