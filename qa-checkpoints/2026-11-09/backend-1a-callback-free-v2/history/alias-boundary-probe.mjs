import assert from "node:assert/strict";
import { isDeepStrictEqual } from "node:util";
import { writeFileSync } from "node:fs";

// A boundary probe only. This does not patch the candidate or claim a fix.
function traced(root, writes) {
  const cache = new WeakMap();
  const wrap = value => {
    if (!value || typeof value !== "object") return value;
    if (cache.has(value)) return cache.get(value);
    const p = new Proxy(value, {
      get(target, key, receiver) { return wrap(Reflect.get(target, key, receiver)); },
      set(target, key, value) { writes.push(String(key)); return Reflect.set(target, key, value); },
      deleteProperty(target, key) { writes.push(`delete:${String(key)}`); return Reflect.deleteProperty(target, key); },
      defineProperty(target, key, descriptor) { writes.push(`define:${String(key)}`); return Reflect.defineProperty(target, key, descriptor); },
    });
    cache.set(value, p); return p;
  };
  return wrap(root);
}
const rows = [];
{
  const state = { member: { active: true } }, snapshot = structuredClone(state), writes = [], view = traced(state, writes);
  view.member.active = false; view.member.active = true;
  assert.ok(isDeepStrictEqual(state, snapshot)); assert.equal(writes.length, 2);
  rows.push({ id: "BOUNDARY-PROXY", snapshot_equal: true, write_trace: writes,
    result: "Proxy sees nested write-and-restore made through its own view; equality alone misses it." });
}
{
  const state = { member: { active: true } }, rawAlias = state.member;
  const snapshot = structuredClone(state), writes = [], view = traced(state, writes);
  const callback = () => { rawAlias.active = false; rawAlias.active = true; return { ok: false, status: 409 }; };
  callback(view);
  assert.ok(isDeepStrictEqual(state, snapshot)); assert.equal(writes.length, 0);
  rows.push({ id: "BOUNDARY-RAW-ALIAS", snapshot_equal: true, write_trace: writes, actual_writes: 2,
    result: "Already captured raw alias bypasses a later proxy, including write-and-restore." });
}
{
  const state = { member: { active: true } }, rawAlias = state.member, snapshot = structuredClone(state), writes = [];
  Object.freeze(state.member); Object.freeze(state);
  let caughtAttempt = false;
  const callback = () => { try { rawAlias.active = false; } catch { caughtAttempt = true; } return { ok: false, status: 409 }; };
  callback();
  assert.ok(caughtAttempt); assert.ok(isDeepStrictEqual(state, snapshot)); assert.equal(writes.length, 0);
  rows.push({ id: "BOUNDARY-FROZEN-ALIAS", snapshot_equal: true, write_trace: writes, caught_attempt: caughtAttempt,
    result: "Freeze prevents the raw mutation, but a callback can swallow that attempt; no proxy trace records it." });
}
{
  const state = { member: { active: true } }, snapshot = structuredClone(state), writes = [], view = traced(state, writes);
  let externalWriterCalls = 0;
  const capturedWriter = () => { externalWriterCalls++; };
  const callback = () => { capturedWriter(); return { ok: false, status: 409 }; };
  callback(view);
  assert.ok(isDeepStrictEqual(state, snapshot)); assert.equal(writes.length, 0); assert.equal(externalWriterCalls, 1);
  rows.push({ id: "BOUNDARY-CAPTURED-WRITER", snapshot_equal: true, write_trace: writes, external_writer_calls: externalWriterCalls,
    result: "State proxy/equality cannot stop an independently captured writer. This writer is a local counter, not I/O." });
}
{
  // Proposed data-only boundary, not a source implementation. Identity checks do
  // not execute arbitrary functions/getters, including a Proxy around a decision.
  const CONTINUE = Object.freeze({ kind: "continue_existing_policy" });
  const DENY_GROUP = Object.freeze({ kind: "recognized_denial", reason: "group_revision_conflict" });
  const DENY_MEMBER = Object.freeze({ kind: "recognized_denial", reason: "membership_revision_conflict" });
  const accepted = value => value === CONTINUE || value === DENY_GROUP || value === DENY_MEMBER;
  let called = 0;
  const writer = () => { called++; return DENY_MEMBER; };
  let getterCalls = 0;
  const getter = { get kind() { getterCalls++; return "recognized_denial"; } };
  const proxy = new Proxy(DENY_MEMBER, { get() { getterCalls++; throw Error("SHOULD_NOT_GET"); } });
  assert.ok(accepted(CONTINUE)); assert.ok(accepted(DENY_GROUP)); assert.ok(accepted(DENY_MEMBER));
  for (const value of [writer, getter, proxy, { ok: false, status: 409 }, { ...DENY_MEMBER }]) assert.equal(accepted(value), false);
  assert.equal(called, 0); assert.equal(getterCalls, 0);
  rows.push({ id: "BOUNDARY-DATA-IDENTITY", recognized_decisions: 3, rejected_payloads: 5, callback_calls: called,
    getter_or_proxy_get_calls: getterCalls, result: "A proposed callback-free constant-identity boundary avoids executing continuation code." });
}
writeFileSync(new URL("./alias-boundary-results.json", import.meta.url), JSON.stringify({
  status: "DESIGN_PROBE_ONLY_NO_CANDIDATE_CHANGES", probes: rows,
}, null, 2) + "\n");
process.stdout.write(JSON.stringify({ probes: rows.length, assertions: "PASS", candidate_changed: false }) + "\n");
