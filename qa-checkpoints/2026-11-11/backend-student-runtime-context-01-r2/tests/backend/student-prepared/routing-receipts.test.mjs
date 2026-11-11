import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createConfiguredHttpHandler} from '../../../supabase/functions/univeracademy-api/configured-http.ts';
import {createProductionEntrypoint} from '../../../runtime/production-entry.mjs';
import {proofHash} from '../../../supabase/functions/univeracademy-api/student-state.ts';
import {ids,clock,botKey,testPolicy,testNumbers} from '../http-fixture.ts';
import {MemoryPool} from './memory-pool.mjs';

// Deliberately letter-bearing UUIDs: numeric-only fixtures cannot detect case bugs.
const assignment='abcdefab-cdef-4abc-8def-abcdefabcdef';
const family='abcdefff-cdef-4abc-8def-abcdefabcdef';
const opaqueKey='Opaque-Receipt-Key_XyZ';
const mixed=value=>{let upper=false;return value.replace(/[a-f]/g,c=>(upper=!upper)?c.toUpperCase():c);};
const privateNames=new Set(['ua_http_grants','ua_http_assignments','ua_http_series','ua_http_attempt_ids','ua_attempt_load','ua_answers_load','ua_ordinary_load','ua_http_receipts','ua_http_bonuses','ua_http_cancellations']);
const writeNames=new Set(['ua_attempt_insert','ua_http_series_merge','ua_attempt_update','ua_answer_cas','ua_ordinary_insert','ua_series_update','ua_http_receipt_insert']);
const writes=pool=>pool.events.filter(e=>writeNames.has(e.name)).length;
function deterministicIds(t){
  const original=crypto.randomUUID;let next=0;
  crypto.randomUUID=()=>`abcdefab-cdef-4abc-8def-${String(++next).padStart(12,'a')}`;
  t.after(()=>{crypto.randomUUID=original;});
}
async function fixture(mode,revoked=false){
  const pool=new MemoryPool(),token='offline-routing-'+mode;
  const record=pool.state.assignments[ids.assignment];delete pool.state.assignments[ids.assignment];record.admission.assignmentId=assignment;pool.state.assignments[assignment]=record;
  pool.state.grants[ids.person][assignment]=pool.state.grants[ids.person][ids.assignment];delete pool.state.grants[ids.person][ids.assignment];
  pool.state.families[family]={personId:ids.person,expiresAt:clock+60000,revokedAt:revoked?clock:null,logoutRetainUntil:null,authProvider:mode==='clerk'?'clerk':'telegram'};
  pool.state.access[await proofHash(token)]={familyId:family,expiresAt:clock+15000,superseded:false};
  const config={mode:'local_contract',storage:{kind:'postgres_contract_double',pool},botToken:botKey,sessionPolicy:testPolicy,numericPresentation:testNumbers,now:()=>pool.now};
  if(mode==='clerk'){
    const identity={issuer:'https://clerk.offline.invalid',userId:'user_OfflineRouting',sessionId:'sess_OfflineRouting'};
    pool.state.people[ids.person].telegramId=null;pool.bindings[family]=identity;
    pool.identities=[{issuer:identity.issuer,subject:identity.userId,person_id:ids.person,enabled:true}];
    pool.fences=[{issuer:identity.issuer,subject:identity.userId,sid:identity.sessionId,person_id:ids.person,retired_at_ms:null}];
    config.clerk={verifier:{issuer:identity.issuer,authorizedParties:['https://mini.offline.invalid'],audience:{kind:'clerk_default_no_audience'},trustedKeys:()=>{throw Error('Offline JWT verification not supplied');},now:()=>pool.now},liveness:async id=>({...id,status:'active',accountEnabled:true,expiresAt:clock+10000})};
  }
  const handler=createConfiguredHttpHandler(config);
  const request=(method,path,body,key=opaqueKey,extra={})=>new Request('https://offline.invalid/api/v1'+path,{method,headers:{authorization:'Bearer '+token,'idempotency-key':key,...extra},...(body===undefined?{}:{body:JSON.stringify(body)})});
  const send=async(method,path,body,key=opaqueKey)=>{const r=await handler(request(method,path,body,key));return {status:r.status,...await r.json()};};
  return {pool,config,send,request};
}
const rejected=[['POST','/exams'],['PUT',`/exams/${assignment}`],['GET',`/exams/${assignment}/attempts`],['POST',`/attempts/${assignment}/answers/${ids.question}`],['GET',`/attempts/${assignment}/submit`],['POST',`/attempts/${assignment}/result`],['GET','/not-a-student-route'],['GET','/auth/refresh'],['GET',`/exams/${assignment}/HISTORY`],['GET','/exams/not-a-uuid/history']];
for(const mode of ['native','clerk'])for(const revoked of [false,true])test(`${mode} ${revoked?'revoked':'current'} unsupported requests do not fall through to private loading`,async()=>{
  const f=await fixture(mode,revoked);
  for(const [method,path]of rejected){
    f.pool.events=[];const count=f.pool.checkouts,r=await f.send(method,path);
    assert.equal(f.pool.events.some(e=>privateNames.has(e.name)),false,`${method} ${path} private read`);
    assert.equal(r.status,404,`${method} ${path}: ${JSON.stringify(r)}`);assert.equal(r.error.code,'NOT_FOUND');
    assert.equal(f.pool.checkouts,count,`${method} ${path} checkout`);
  }
});
for(const mode of ['native','clerk'])test(`${mode} supported GET retains revoked-session authorization before private reads`,async()=>{
  const f=await fixture(mode,true),r=await f.send('GET','/exams');assert.equal(r.status,401);assert.equal(r.error.code,'SESSION_REVOKED');assert.equal(f.pool.events.some(e=>privateNames.has(e.name)),false);
});
for(const mode of ['native','clerk'])for(const firstCase of ['lower','mixed'])test(`${mode} ${firstCase} start and canonical replay preserve exact opaque key`,async t=>{
  deterministicIds(t);const f=await fixture(mode),variants=[assignment,mixed(assignment),assignment.toUpperCase()];
  assert.notEqual(variants[1],variants[0]);assert.notEqual(variants[1],variants[2]);
  const first=await f.send('POST',`/exams/${firstCase==='lower'?variants[0]:variants[1]}/attempts`,{confirmed:true});assert.equal(first.status,200,JSON.stringify(first));
  const count=writes(f.pool),receipt=`${ids.person}/POST//exams/${assignment}/attempts/${opaqueKey}`;
  for(const id of variants){const r=await f.send('POST',`/exams/${id}/attempts`,{confirmed:true});assert.equal(r.status,200,JSON.stringify(r));assert.equal(r.data.id,first.data.id);assert.equal(r.data.generation,first.data.generation);assert.equal(r.data.deadline_at,first.data.deadline_at);}
  assert.equal(writes(f.pool),count);assert.deepEqual(Object.keys(f.pool.receipts),[receipt]);assert.equal(Object.keys(f.pool.attempts).length,1);
  // Distinct opaque keys remain distinct; UUID route case alone is canonicalized.
  const otherKey=opaqueKey.toLowerCase();assert.notEqual(otherKey,opaqueKey);
  const distinct=await f.send('POST',`/exams/${variants[1]}/attempts`,{confirmed:true},otherKey);assert.equal(distinct.status,200);assert.equal(distinct.data.id,first.data.id);
  assert.deepEqual(Object.keys(f.pool.receipts).sort(),[receipt,`${ids.person}/POST//exams/${assignment}/attempts/${otherKey}`].sort());
  assert.equal(Object.keys(f.pool.attempts).length,1);
});
for(const mode of ['native','clerk'])test(`${mode} mixed-case submit and lower/upper replays do not duplicate writes`,async t=>{
  deterministicIds(t);const f=await fixture(mode),started=await f.send('POST',`/exams/${assignment}/attempts`,{confirmed:true});assert.equal(started.status,200);const id=started.data.id;
  assert.notEqual(id,mixed(id));const first=await f.send('POST',`/attempts/${mixed(id)}/submit`);assert.equal(first.status,200,JSON.stringify(first));
  const count=writes(f.pool),keys=Object.keys(f.pool.receipts).sort();
  for(const candidate of [id,mixed(id),id.toUpperCase()]){const r=await f.send('POST',`/attempts/${candidate}/submit`);assert.equal(r.status,200,JSON.stringify(r));assert.deepEqual(r.data,first.data);}
  assert.equal(writes(f.pool),count);assert.deepEqual(Object.keys(f.pool.receipts).sort(),keys);assert.ok(keys.includes(`${ids.person}/POST//attempts/${id}/submit/${opaqueKey}`));assert.equal(keys.length,2);assert.equal(Object.keys(f.pool.results).length,1);
});
test('CORS preflight and headers remain intact when the actual method is rejected',async()=>{
  const f=await fixture('native',true),origin='https://mini.offline.invalid';
  const entry=createProductionEntrypoint(()=>({apiOrigin:'https://offline.invalid',allowedOrigins:[origin],configuration:{...f.config,mode:'production',storage:{kind:'postgres',pool:f.pool}}}));
  const preflight=await entry.fetch(new Request('https://offline.invalid/api/v1/exams',{method:'OPTIONS',headers:{origin,'access-control-request-method':'POST','access-control-request-headers':'authorization'}}));assert.equal(preflight.status,204);assert.equal(f.pool.checkouts,0);
  const response=await entry.fetch(f.request('POST','/exams',undefined,opaqueKey,{origin}));assert.equal(response.status,404);assert.equal(response.headers.get('access-control-allow-origin'),origin);assert.equal(response.headers.get('cache-control'),'no-store');assert.equal(f.pool.checkouts,0);
});
for(const [name,first,second,atWrite,expected]of [
  ['shortened expiry before commit',10000,100,101,401],
  ['shortened expiry equality boundary',10000,100,100,401],
  ['shortened but still unexpired',10000,100,99,200],
  ['later longer value cannot extend first expiry',100,10000,100,401],
  ['normal unexpired authority',10000,10000,100,200],
])test('Clerk lease '+name,async()=>{
  const f=await fixture('clerk'),started=await f.send('POST',`/exams/${assignment}/attempts`,{confirmed:true});assert.equal(started.status,200);const id=started.data.id,beforeRevision=f.pool.attempts[id].body.stateRevision;
  let checks=0;f.config.clerk.liveness=async identity=>({...identity,status:'active',accountEnabled:true,expiresAt:clock+(++checks===1?first:second)});
  f.pool.events=[];f.pool.onStatement=statement=>{if(statement==='ua_answer_cas')f.pool.now=clock+atWrite;};
  const response=await f.send('PUT',`/attempts/${id}/answers/${ids.question}`,{selected_option_id:ids.correct,expected_revision:0});
  assert.equal(checks,2);assert.equal(response.status,expected,JSON.stringify(response));
  if(expected===401){
    assert.equal(response.error.code,'CLERK_SESSION_REVOKED');assert.equal(response.data,undefined);
    assert.equal(f.pool.events.some(e=>e.name==='ua_commit'),false);assert.equal(f.pool.events.some(e=>e.name==='ua_rollback'),true);
    assert.equal(Object.keys(f.pool.answers[id]??{}).length,0);assert.equal(f.pool.attempts[id].body.stateRevision,beforeRevision);
  }else{
    assert.equal(response.data.revision,1);assert.equal(f.pool.answers[id][ids.question].revision,1);
    assert.equal(f.pool.events.some(e=>e.name==='ua_commit'),true);assert.equal(f.pool.events.some(e=>e.name==='ua_rollback'),false);
  }
});
