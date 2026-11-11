import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createConfiguredHttpHandler} from '../../../supabase/functions/univeracademy-api/configured-http.ts';
import {PreparedStudentTransactions,isFirstStudentRequest} from '../../../supabase/functions/univeracademy-api/storage/prepared-student.ts';
import {decodePublished} from '../../../supabase/functions/univeracademy-api/storage/attempt-rows.ts';
import {StorageUnavailable} from '../../../supabase/functions/univeracademy-api/storage/postgres-transaction.ts';
import {proofHash} from '../../../supabase/functions/univeracademy-api/student-state.ts';
import {createProductionOptions} from '../../../runtime/production-options.mjs';
import {createProductionEntrypoint} from '../../../runtime/production-entry.mjs';
import defaultEntry from '../../../api/index.mjs';
import {botKey,signedInitData,testNumbers,testPolicy,ids,clock} from '../http-fixture.ts';
import {MemoryPool} from './memory-pool.mjs';
const base='https://offline.invalid/api/v1';
const config=pool=>({mode:'local_contract',storage:{kind:'postgres_contract_double',pool},botToken:botKey,sessionPolicy:testPolicy,numericPresentation:testNumbers,now:()=>pool.now});
const request=(method,path,token,body,key='offline-key-001',signal)=>new Request(base+path,{method,headers:{...(token?{authorization:'Bearer '+token}:{}),'idempotency-key':key,...(body!==undefined?{'content-type':'application/json'}:{})},...(body!==undefined?{body:JSON.stringify(body)}:{}),...(signal?{signal}:{})});
async function fixture(){const pool=new MemoryPool(),handler=createConfiguredHttpHandler(config(pool));
  const send=async(method,path,token,body,key,signal)=>{const response=await handler(request(method,path,token,body,key,signal));return {status:response.status,...await response.json()};};
  const launch=await send('POST','/auth/telegram',null,{init_data:signedInitData(4000000001,'offline-launch',clock)});
  assert.equal(launch.status,200,JSON.stringify(launch));return {pool,handler,send,token:launch.data.access_token};
}
async function start(f){const r=await f.send('POST',`/exams/${ids.assignment}/attempts`,f.token,{confirmed:true});assert.equal(r.status,200,JSON.stringify(r));return r.data;}
const noPrivate=pool=>assert.equal(pool.events.some(e=>['ua_http_grants','ua_http_assignments','ua_http_attempt_ids','ua_answers_load'].includes(e.name)),false);

test('launch + all required GETs + INSERT, same-answer UPDATE, stale denial, submit/result',async()=>{
 const f=await fixture();
 for(const path of ['/me','/exams',`/exams/${ids.assignment}`])assert.equal((await f.send('GET',path,f.token)).status,200);
 const attempt=await start(f),id=attempt.id??attempt.attempt_id;assert.ok(id,JSON.stringify(attempt));
 const deadline=attempt.deadline_at,generation=attempt.generation;
 assert.equal((await f.send('GET',`/attempts/${id}`,f.token)).status,200);
 const path=`/attempts/${id}/answers/${ids.question}`;
 const first=await f.send('PUT',path,f.token,{selected_option_id:ids.wrong,expected_revision:0});assert.equal(first.status,200,JSON.stringify(first));assert.equal(first.data.revision,1);
 const second=await f.send('PUT',path,f.token,{selected_option_id:ids.correct,expected_revision:1});assert.equal(second.status,200,JSON.stringify(second));assert.equal(second.data.revision,2);
 const count=f.pool.events.filter(e=>e.name==='ua_answer_cas').length;
 const stale=await f.send('PUT',path,f.token,{selected_option_id:ids.wrong,expected_revision:1});assert.equal(stale.status,409);assert.equal(stale.error.code,'REVISION_CONFLICT');assert.equal(f.pool.events.filter(e=>e.name==='ua_answer_cas').length,count);
 assert.deepEqual(f.pool.answerBranches,['INSERT','UPDATE']);assert.equal(Object.keys(f.pool.answers[id]).length,1);
 const submitted=await f.send('POST',`/attempts/${id}/submit`,f.token);assert.equal(submitted.status,200,JSON.stringify(submitted));
 const reread=await f.send('GET',`/attempts/${id}/result`,f.token);assert.equal(reread.status,200);assert.deepEqual(reread.data,submitted.data);
 const resumed=await f.send('GET',`/attempts/${id}`,f.token);assert.equal(resumed.data.deadline_at,deadline);assert.equal(resumed.data.generation,generation);
 // Every prepared request uses exactly one physical checkout: BEGIN precedes locator.
 for(let i=0;i<f.pool.events.length;i++)if(f.pool.events[i].name==='ua_locate_access'){
  const e=f.pool.events[i],prior=f.pool.events.slice(0,i).filter(x=>x.clientId===e.clientId);
  assert.equal(prior[0].name,'ua_begin');assert.ok(f.pool.events.slice(i).some(x=>x.clientId===e.clientId&&x.name==='ua_people_lock'));
 }
});

for(const [name,change,code,status]of [
 ['revocation',s=>Object.values(s.families)[0].revokedAt=clock,'SESSION_REVOKED',401],
 ['expiry',s=>Object.values(s.families)[0].expiresAt=clock,'APP_SESSION_EXPIRED',401],
 ['supersession',s=>Object.values(s.access)[0].superseded=true,'ACCESS_SUPERSEDED',401],
 ['disabled account',s=>s.people[ids.person].enabled=false,'ACCOUNT_DISABLED',403],
 ['removed student role',s=>s.people[ids.person].profile.roles=[],'FORBIDDEN',403],
])test(name+' after locator but before lock rejects before private reads',async()=>{
 const f=await fixture();f.pool.events=[];f.pool.before=change;
 const r=await f.send('GET','/exams',f.token);assert.equal(r.status,status,JSON.stringify(r));assert.equal(r.error.code,code);noPrivate(f.pool);
 assert.ok(f.pool.events.some(e=>e.name==='ua_rollback'));
});

test('locator redirection cannot become another person authority',async()=>{const f=await fixture();f.pool.events=[];f.pool.locatorPerson=ids.other;const r=await f.send('GET','/exams',f.token);assert.equal(r.status,401);noPrivate(f.pool);});
test('known own positive, cross-person attempt read/write/result stay 404',async()=>{const f=await fixture(),a=await start(f),id=a.id??a.attempt_id;
 const family=crypto.randomUUID(),token='offline-other-proof';f.pool.state.families[family]={personId:ids.other,expiresAt:clock+60000,revokedAt:null,logoutRetainUntil:null,authProvider:'telegram'};f.pool.state.access[await proofHash(token)]={familyId:family,expiresAt:clock+15000,superseded:false};
 for(const [method,path,body]of [['GET',`/attempts/${id}`],['GET',`/attempts/${id}/result`],['PUT',`/attempts/${id}/answers/${ids.question}`,{selected_option_id:ids.correct,expected_revision:0}],['POST',`/attempts/${id}/submit`]])assert.equal((await f.send(method,path,token,body)).status,404);
 assert.equal(Object.keys(f.pool.attempts).length,1);assert.equal(Object.keys(f.pool.answers).length,0);
});

test('broker single-use/forged receiver/lifetime and no raw client callback',async()=>{const f=await fixture();const txs=new PreparedStudentTransactions(f.pool,request('GET','/me',f.token));let saved;
 await txs.transaction(async tx=>{saved=tx;assert.deepEqual(Object.keys(tx).sort(),['now','state']);assert.equal(tx.state.people[ids.person].enabled,true);});
 assert.throws(()=>saved.now(),e=>e.status===503);
 await assert.rejects(txs.transaction(async()=>{}),e=>e.status===503);
 await assert.rejects(PreparedStudentTransactions.prototype.transaction.call(Object.create(txs),async()=>{}),e=>e.status===503);
});
for(const when of ['ua_http_assignments','ua_answer_cas'])test('abort at '+when+' cannot ACK',async()=>{
 const f=await fixture(),a=await start(f),id=a.id??a.attempt_id,c=new AbortController();f.pool.onStatement=name=>{if(name===when)c.abort();};
 const r=await f.send('PUT',`/attempts/${id}/answers/${ids.question}`,f.token,{selected_option_id:ids.correct,expected_revision:0},undefined,c.signal);assert.equal(r.status,503);assert.equal(Object.keys(f.pool.answers).length,0);
});
for(const failure of ['before','after'])test('COMMIT '+failure+' ACK stays commit_unknown/503 without retry',async()=>{
 const f=await fixture();const p=new PreparedStudentTransactions(f.pool,request('GET','/me',f.token));f.pool.failCommit=failure;const n=f.pool.checkouts;
 await assert.rejects(p.transaction(async()=>42),e=>e instanceof StorageUnavailable&&e.outcome==='commit_unknown'&&e.status===503);
 assert.equal(f.pool.checkouts,n+1);assert.equal(f.pool.events.at(-1).discard,true);
});
test('production composition accepts student-only prepared ports; admin remains unavailable',async()=>{
 const f=await fixture(),options={apiOrigin:'https://offline.invalid',allowedOrigins:['https://mini.invalid'],configuration:{...config(f.pool),mode:'production',storage:{kind:'postgres',pool:f.pool}}};
 // This tests composition with a named statement double; it is not driver/production acceptance.
 const entry=createProductionEntrypoint(()=>createProductionOptions(options));
 assert.equal((await entry.fetch(request('GET','/me',f.token))).status,200);
 assert.equal((await entry.fetch(request('GET','/admin/me',f.token))).status,503);
});
test('unwired default and caller trusted flags cannot activate anything',async()=>{
 assert.equal((await defaultEntry.fetch(request('GET','/me','anything'))).status,503);
 const f=await fixture();assert.throws(()=>createProductionOptions({apiOrigin:'https://offline.invalid',allowedOrigins:[],configuration:{...config(f.pool),mode:'production',storage:{kind:'postgres',pool:f.pool},trusted:true}}),e=>e.status===503);
 assert.equal(isFirstStudentRequest(request('POST','/auth/clerk','x',{})),false);
});
test('GET capability cannot flush an unrelated attempt mutation',async()=>{
 const f=await fixture(),a=await start(f);const txs=new PreparedStudentTransactions(f.pool,request('GET','/me',f.token));
 await assert.rejects(txs.transaction(async({state})=>{const row=f.pool.attempts[a.id];state.attempts[a.id]={...structuredClone(row.body),published:decodePublished(row.frozen_test),questionOrder:row.question_order,answers:[],ordinary:null,status:'cancelled'};}),e=>e.status===500);
 assert.equal(f.pool.attempts[a.id].body.status,'in_progress');
});
test('idempotent start/submit replay and expiry materialization preserve accepted semantics',async()=>{
 const f=await fixture();for(const proof of Object.values(f.pool.state.access))proof.expiresAt=clock+120000;
 const a=await start(f),again=await start(f);assert.equal(again.id,a.id);assert.equal(Object.keys(f.pool.attempts).length,1);
 f.pool.now=Date.parse(a.deadline_at);
 const expired=await f.send('GET',`/attempts/${a.id}`,f.token);assert.equal(expired.status,200);assert.equal(expired.data.status,'expired');
 const submitted=await f.send('POST',`/attempts/${a.id}/submit`,f.token);assert.equal(submitted.status,200,JSON.stringify(submitted));assert.equal(f.pool.attempts[a.id].body.status,'expired');assert.ok(submitted.data.ordinary);
 assert.deepEqual((await f.send('POST',`/attempts/${a.id}/submit`,f.token)).data,submitted.data);
});
test('captured request cannot be rebound by mutating original headers',async()=>{
 const f=await fixture(),r=request('GET','/me',f.token),p=new PreparedStudentTransactions(f.pool,r);r.headers.set('authorization','Bearer forged');
 assert.equal(await p.transaction(async({state})=>state.people[ids.person].profile.person_id),ids.person);
});
test('invalid asynchronous bound guard cannot authorize private reads or commit',async()=>{
 const f=await fixture();f.pool.events=[];
 const p=new PreparedStudentTransactions(f.pool,request('GET','/exams',f.token),async()=>async()=>{});
 await assert.rejects(p.transaction(async()=>{}),e=>e.status===503);noPrivate(f.pool);assert.equal(f.pool.events.some(e=>e.name==='ua_commit'),false);
});
test('request target and body prevent callback writing another question',async()=>{
 const f=await fixture(),a=await start(f),r=request('PUT',`/attempts/${a.id}/answers/${ids.question}`,f.token,{selected_option_id:ids.correct,expected_revision:0});
 const p=new PreparedStudentTransactions(f.pool,r);
 await assert.rejects(p.transaction(async({state})=>{const next=state.attempts[a.id];next.answers=[{questionId:next.published.questions[1].id,selectedOptionId:next.published.questions[1].correctOptionId,revision:1,savedAt:clock,seriesStateRevision:1}];next.stateRevision++;next.seriesStateRevision++;}),e=>e.status===500);
 assert.equal(Object.keys(f.pool.answers).length,0);
});
