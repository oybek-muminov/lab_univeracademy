import { test, after } from "node:test";
import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { guardRemovalActiveTest, REMOVAL_DECISION as D, materializeElapsedAttempts } from "../../supabase/functions/univeracademy-api/membership-activity.ts";
import { reconcileMembershipEffects } from "../../supabase/functions/univeracademy-api/membership-effects.ts";
import { PostgresTransactions, StorageUnavailable } from "../../supabase/functions/univeracademy-api/storage/postgres-transaction.ts";
import { staffFixture, staffIds } from "../backend/staff-fixture.ts";
import { ids, id, clock } from "../backend/http-fixture.ts";
import { seriesKey } from "../../supabase/functions/univeracademy-api/student-state.ts";

// Domain preflight only. Optional traces contain paths, never proof values.
const traces = [], clone = value => structuredClone(value);
function paths(a,b,p="") {
  if(Object.is(a,b))return [];
  if(a&&b&&typeof a==="object"&&typeof b==="object")return [...new Set([...Object.keys(a),...Object.keys(b)])].sort().flatMap(k=>paths(a[k],b[k],`${p}/${k.replaceAll("~","~0").replaceAll("/","~1")}`));
  return [p];
}
function trace(case_id,before,after,extra={}){traces.push({case_id,write_paths:paths(before,after),...extra});}
async function fixture(){
  const f=staffFixture();f.store.state.groups[ids.group].revision=4;
  const {token,attempt}=await f.start();
  assert.equal((await f.studentCall("PUT",`/attempts/${attempt.id}/answers/${ids.question}`,{selected_option_id:ids.correct,expected_revision:0},token)).status,200);
  const deadline=Date.parse(attempt.deadline_at);f.store.time=deadline;
  const context={proof:{kind:"staff_verified",subject:"synthetic-admin",notBefore:clock-1,expiresAt:clock+1_000_000},groupId:ids.group,expectedGroupRevision:4,expectedMembershipRevision:7};
  return {...f,token,attemptId:attempt.id,deadline,context};
}
const run=(f,decision=D.CONTINUE,context=f.context)=>f.store.transaction(tx=>guardRemovalActiveTest(tx,ids.person,decision,context));
async function canonical(before,now){
  const expected=clone(before),elapsed=materializeElapsedAttempts(expected,ids.person,now);
  if(elapsed)await reconcileMembershipEffects(expected,elapsed);return expected;
}
function saved(before,after,id){
  const a=before.student.attempts[id],b=after.student.attempts[id];
  assert.deepEqual(b.answers,a.answers);assert.equal(b.deadlineAt,a.deadlineAt);assert.deepEqual(b.questionOrder,a.questionOrder);assert.equal(b.generation,a.generation);
}

test("CF-01: CONTINUE cannot bypass a current active attempt",async()=>{
  const f=await fixture();f.store.time=f.deadline-1;const before=clone(f.store.state);
  assert.deepEqual(await run(f),{kind:"wait_for_active_test"});assert.deepEqual(f.store.state,before);trace("CF-01",before,f.store.state);
});
for(const [name,offset]of [["CF-02",0],["CF-03",1]])test(`${name}: deadline equality/after commits canonical E(a) only`,async()=>{
  const f=await fixture();f.store.time=f.deadline+offset;const before=clone(f.store.state),expected=await canonical(before,f.store.time);
  assert.equal(await run(f),D.CONTINUE);assert.deepEqual(f.store.state,expected);saved(before,f.store.state,f.attemptId);
  assert.equal(f.store.state.student.attempts[f.attemptId].status,"expired");trace(name,before,f.store.state,{canonical_E_paths:paths(before,expected)});
});
test("CF-04: submitted attempt produces no writes or queued continuation",async()=>{
  const f=await fixture();f.store.time=clock;assert.equal((await f.studentCall("POST",`/attempts/${f.attemptId}/submit`,undefined,f.token)).status,200);
  const before=clone(f.store.state);assert.equal(await run(f),D.CONTINUE);assert.deepEqual(f.store.state,before);trace("CF-04",before,f.store.state);
});
for(const [name,field,denied]of [["W02","expectedGroupRevision",D.DENY_GROUP_REVISION],["W03","expectedMembershipRevision",D.DENY_MEMBERSHIP_REVISION]])for(const hint of ["continue","matching-denial"]){
  test(`${name}-${hint}: authoritative clean CAS denial commits E(a) only`,async()=>{
    const f=await fixture(),context={...f.context,[field]:f.context[field]-1},before=clone(f.store.state),expected=await canonical(before,f.store.time);
    assert.equal(await run(f,hint==="continue"?D.CONTINUE:denied,context),denied);assert.deepEqual(f.store.state,expected);saved(before,f.store.state,f.attemptId);
    trace(`${name}-${hint}`,before,f.store.state,{reason:denied.reason,canonical_E_paths:paths(before,expected)});
  });
}
test("CF-05: group CAS precedes member CAS; CONTINUE cannot bypass either",async()=>{
  const f=await fixture(),before=clone(f.store.state);
  assert.equal(await run(f,D.CONTINUE,{...f.context,expectedGroupRevision:3,expectedMembershipRevision:6}),D.DENY_GROUP_REVISION);
  assert.deepEqual(f.store.state,await canonical(before,f.deadline));trace("CF-05",before,f.store.state);
});
test("CF-06: false or stale denial singleton fails before maintenance",async()=>{
  const f=await fixture(),before=clone(f.store.state);
  await assert.rejects(run(f,D.DENY_MEMBERSHIP_REVISION),e=>e.code==="RESPONSE_INVARIANT_FAILED"&&e.status===500);
  assert.deepEqual(f.store.state,before);trace("CF-06",before,f.store.state);
});
test("CF-07: lock-wait changes to authoritative CAS/time are observed",async()=>{
  const f=await fixture();f.store.time=f.deadline-1;f.store.events=[];let before;
  f.store.beforeWork=async()=>{f.store.time=f.deadline;f.store.state.groups[ids.group].revision++;before=clone(f.store.state);f.store.events.push("lock-wait-ended");};
  assert.equal(await run(f),D.DENY_GROUP_REVISION);assert.deepEqual(f.store.state,await canonical(before,f.deadline));
  assert.deepEqual(f.store.events,["lock","lock-wait-ended","clock","commit"]);trace("CF-07",before,f.store.state,{events:f.store.events});
});
for(const [name,change,status,code]of [
  ["disabled",f=>{f.store.state.staff["synthetic-admin"].enabled=false;},403,"ACCOUNT_DISABLED"],
  ["capability",f=>{f.store.state.staff["synthetic-admin"].capabilities.manage_roster=false;},403,"CAPABILITY_REQUIRED"],
  ["scope",f=>{f.store.state.staff["synthetic-admin"].scope.group_ids=[];},404,"NOT_FOUND"],
  ["teacher",f=>{f.context.proof.subject="synthetic-teacher";},403,"FORBIDDEN"],
  ["expired-proof",f=>{f.context.proof.expiresAt=f.deadline;},401,"STAFF_TOKEN_INVALID"],
  ["wrong-group",f=>{f.context.groupId=staffIds.targetGroup;},404,"NOT_FOUND"],
])test(`AUTH-${name}: authorization/privacy precedes E(a)`,async()=>{
  const f=await fixture();change(f);const before=clone(f.store.state);
  await assert.rejects(run(f),e=>e.status===status&&e.code===code);assert.deepEqual(f.store.state,before);trace(`AUTH-${name}`,before,f.store.state,{status,code});
});
test("CF-08: unstarted ready recovery remains unchanged for later policy",async()=>{
  for(const offset of [1000,-1000]){
    const f=await fixture();f.store.time=clock;assert.equal((await f.studentCall("POST",`/attempts/${f.attemptId}/submit`,undefined,f.token)).status,200);
    const series=f.store.state.student.series[seriesKey(ids.person,ids.demo)];series.recoveryState="ready";
    series.recovery={opensAt:clock+offset-500,closesAt:clock+offset,durationMs:500};const before=clone(f.store.state);
    assert.equal(await run(f),D.CONTINUE);assert.deepEqual(f.store.state,before);trace(`CF-08:${offset}`,before,f.store.state);
  }
});
for(const [name,offset]of [["active",-1],["expired",0]])test(`RECOVERY-${name}: current started recovery keeps existing completion semantics`,async()=>{
  const f=await fixture(),s=f.store.state,series=s.student.series[seriesKey(ids.person,ids.demo)];
  s.student.attempts[f.attemptId]={...s.student.attempts[f.attemptId],generation:2};series.generation=2;series.recoveryState="active";
  series.recovery={opensAt:clock-1,closesAt:f.deadline+1,durationMs:60000};f.store.time=f.deadline+offset;const before=clone(s);
  assert.deepEqual(await run(f),offset<0?{kind:"wait_for_active_test"}:D.CONTINUE);assert.deepEqual(f.store.state,await canonical(before,f.store.time));
  saved(before,f.store.state,f.attemptId);trace(`RECOVERY-${name}`,before,f.store.state);
});
test("CURRENT-01: foreign and historical generations stay equal while current target expires",async()=>{
  const f=await fixture(),s=f.store.state,original=clone(s.student.attempts[f.attemptId]),oldId=id(990),foreignId=id(991);
  s.student.attempts[oldId]={...clone(original),id:oldId,deadlineAt:f.deadline-1000};s.student.attempts[f.attemptId]={...clone(original),generation:2};
  s.student.series[seriesKey(ids.person,ids.demo)].generation=2;s.student.attempts[foreignId]={...clone(original),id:foreignId,personId:ids.other,deadlineAt:f.deadline-1000};
  const before=clone(s);assert.equal(await run(f),D.CONTINUE);assert.deepEqual(f.store.state,await canonical(before,f.deadline));
  assert.deepEqual(f.store.state.student.attempts[oldId],before.student.attempts[oldId]);assert.deepEqual(f.store.state.student.attempts[foreignId],before.student.attempts[foreignId]);trace("CURRENT-01",before,f.store.state);
});
for(const name of ["wrong-generation","missing-record","missing-series"])test(`CURRENT-${name}: incomplete authoritative context fails closed`,async()=>{
  const f=await fixture(),s=f.store.state,sk=seriesKey(ids.person,ids.demo);
  if(name==="wrong-generation")s.student.series[sk].generation++;else if(name==="missing-record")delete s.student.attempts[f.attemptId];else delete s.student.series[sk];
  const before=clone(s);await assert.rejects(run(f),e=>e.code==="RESPONSE_INVARIANT_FAILED");assert.deepEqual(f.store.state,before);trace(`CURRENT-${name}`,before,f.store.state);
});

test("IDENTITY-FIRST: hostile payloads cause no property, context, clock, call or thenable hooks",async()=>{
  const hooks={get:0,call:0,context:0,clock:0};
  const handler={get(){hooks.get++;throw Error("PAYLOAD_GET");},ownKeys(){hooks.get++;throw Error("OWN_KEYS");},getPrototypeOf(){hooks.get++;throw Error("PROTOTYPE");},apply(){hooks.call++;throw Error("CALL");}};
  const revoked=Proxy.revocable({},handler);revoked.revoke();const callable=()=>{hooks.call++;};
  const values=[
    ["getter",{get kind(){hooks.get++;throw Error("GETTER");}}],["proxy",new Proxy({},handler)],["revoked-proxy",revoked.proxy],
    ["callable",callable],["callable-proxy",new Proxy(callable,handler)],["thenable",{get then(){hooks.get++;throw Error("THENABLE");}}],
    ["lookalike",{...D.DENY_GROUP_REVISION}],["arbitrary409",{ok:false,status:409}],["wrapped-singleton",new Proxy(D.CONTINUE,handler)],
    ["coercible",{[Symbol.toPrimitive](){hooks.get++;throw Error("COERCION");}}],
  ];
  for(const [name,value]of values){
    const tx={get now(){hooks.clock++;throw Error("CLOCK_EARLY");}},context=new Proxy({},{get(){hooks.context++;throw Error("CONTEXT_EARLY");}});
    await assert.rejects(guardRemovalActiveTest(tx,ids.person,value,context),e=>e.code==="RESPONSE_INVARIANT_FAILED"&&e.status===500);
    assert.deepEqual(hooks,{get:0,call:0,context:0,clock:0});traces.push({case_id:`IDENTITY-FIRST:${name}`,write_paths:[],hooks:clone(hooks),classification:"PRE_EXECUTION_REJECTION"});
  }
});
for(const attack of ["old-six-writes","write-restore","nested-raw-alias","external-writer"])test(`REJECT-${attack}: callback capability never executes or starts maintenance`,async()=>{
  const f=await fixture(),before=clone(f.store.state);let calls=0,externalWrites=0,reconciles=0;
  await assert.rejects(f.store.transaction(tx=>{
    const raw=tx.state.memberships[ids.person],callback=async()=>{
      calls++;
      if(attack==="external-writer")externalWrites++;
      else if(attack==="old-six-writes"){
        raw.active=false;raw.epoch++;tx.state.student.people[ids.person].profile.active_group_id=null;tx.state.student.grants[ids.person][ids.assignment].rostered=false;
        tx.state.receipts.scratch={payload:"denied"};tx.state.audit.push({actorId:staffIds.admin,action:"must_not_run",targetId:ids.person,revision:8,at:clock});
      }else{raw.active=false;raw.active=true;}
      return {ok:false,status:409};
    };
    const payload=attack==="old-six-writes"?async()=>{reconciles++;}:callback;
    return guardRemovalActiveTest(tx,ids.person,payload,attack==="old-six-writes"?callback:f.context);
  }),e=>e.code==="RESPONSE_INVARIANT_FAILED"&&e.status===500);
  assert.equal(calls,0);assert.equal(externalWrites,0);assert.equal(reconciles,0);assert.deepEqual(f.store.state,before);
  assert.equal(f.store.state.student.attempts[f.attemptId].status,"in_progress");
  trace(`REJECT-${attack}`,before,f.store.state,{calls,externalWrites,reconciles,classification:"PRE_EXECUTION_REJECTION_NOT_POST_WRITE_ROLLBACK"});
});
test("CLOCK: invalid post-lock time fails closed",async()=>{
  for(const now of [-1,0.5,NaN,Infinity,8_640_000_000_000_001]){
    const f=await fixture();f.store.time=now;const before=clone(f.store.state);await assert.rejects(run(f),e=>e.code==="SERVICE_UNAVAILABLE");assert.deepEqual(f.store.state,before);
  }
});
for(const name of ["canonical-score","internal-reconciliation"])test(`EXCEPTION-${name}: technical maintenance failure rolls back E(a)`,async()=>{
  const f=await fixture();if(name==="canonical-score")f.store.state.student.attempts[f.attemptId].published.durationMs=0;
  else f.store.state.student.assignments[ids.assignment].reviewGate.barrier_revision=-1;
  const before=clone(f.store.state);await assert.rejects(run(f),e=>e instanceof Error);assert.deepEqual(f.store.state,before);trace(`EXCEPTION-${name}`,before,f.store.state,{classification:"TECHNICAL_ROLLBACK"});
});

// Actual coordinator, recording pool only. No SQL/socket or real COMMIT proof.
function poolDouble(initial,now,mode){
  let durable=clone(initial),staged;const counts={connect:0,commit:0,rollback:0},events=[];
  const client={async query(q){
    events.push(q.name);
    if(q.name==="ua_people_lock")return {rows:q.values[0].map(id=>({id})),rowCount:q.values[0].length};
    if(q.name==="ua_clock")return {rows:[{now_ms:String(now)}],rowCount:1};
    if(q.name==="ua_commit"){counts.commit++;if(mode==="before")throw Error("SYNTHETIC_COMMIT_BEFORE");durable=clone(staged);if(mode==="after")throw Error("SYNTHETIC_COMMIT_AFTER");}
    if(q.name==="ua_rollback"){counts.rollback++;staged=undefined;}return {rows:[],rowCount:0};
  },release(discard){events.push({release_discard:discard});}};
  return {connect:async()=>{counts.connect++;return client;},read:()=>clone(durable),stage:s=>{staged=clone(s);},counts,events};
}
function coordinated(pool,context,afterGuard){
  return new PostgresTransactions(pool).run([ids.person],async locked=>{
    const state=pool.read(),result=await guardRemovalActiveTest({state,now:()=>locked.now},ids.person,D.CONTINUE,context);
    pool.stage(state);if(afterGuard)await afterGuard();return result;
  });
}
for(const mode of ["before","after"])test(`COMMIT-${mode}: ACK loss stays unknown with no ACK, rollback claim or retry`,async()=>{
  const f=await fixture(),before=clone(f.store.state),pool=poolDouble(before,f.deadline,mode);let ack=0,error;
  try{await coordinated(pool,f.context);ack++;}catch(caught){error=caught;}
  assert.ok(error instanceof StorageUnavailable);assert.equal(error.outcome,"commit_unknown");assert.equal(error.status,503);assert.equal(ack,0);
  assert.deepEqual(pool.counts,{connect:1,commit:1,rollback:0});assert.deepEqual(pool.events.at(-1),{release_discard:true});
  assert.deepEqual(pool.read(),mode==="before"?before:await canonical(before,f.deadline));
  trace(`COMMIT-${mode}`,before,pool.read(),{ack,automatic_retries:0,outcome:error.outcome,counts:pool.counts,real_postgres:"NOT_RUN"});
});
for(const name of ["ordinary","storage"])test(`ROLLBACK-${name}: exception identity survives, never becomes a clean denial`,async()=>{
  const f=await fixture(),before=clone(f.store.state),pool=poolDouble(before,f.deadline,"ok"),fault=name==="ordinary"?Error("SYNTHETIC_FLUSH_FAILURE"):new StorageUnavailable("not_committed");let error,value;
  try{value=await coordinated(pool,f.context,async()=>{throw fault;});}catch(caught){error=caught;}
  assert.equal(error,fault);assert.equal(value,undefined);assert.deepEqual(pool.read(),before);assert.deepEqual(pool.counts,{connect:1,commit:0,rollback:1});
  trace(`ROLLBACK-${name}`,before,pool.read(),{exception_identity_preserved:true,counts:pool.counts});
});
test("REPEAT: completion/ordinary are created once and later explicit checks write nothing",async()=>{
  const f=await fixture(),original=clone(f.store.state);let first;
  for(let n=0;n<3;n++){
    f.store.time=f.deadline+n*100;const before=clone(f.store.state);assert.equal(await run(f),D.CONTINUE);
    if(n===0)first=clone(f.store.state);else assert.deepEqual(f.store.state,first);saved(original,f.store.state,f.attemptId);trace(`REPEAT:${n+1}`,before,f.store.state);
  }
  assert.equal(f.store.state.student.attempts[f.attemptId].stateRevision,original.student.attempts[f.attemptId].stateRevision+1);
});
after(()=>{if(process.env.UA_1A_TRACE_PATH)writeFileSync(process.env.UA_1A_TRACE_PATH,JSON.stringify({scope:"AUTHOR_LOCAL_DOMAIN_PREFLIGHT_NOT_INDEPENDENT_QA",traces},null,2)+"\n");});
