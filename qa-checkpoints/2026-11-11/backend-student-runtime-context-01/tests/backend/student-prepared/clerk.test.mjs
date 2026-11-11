import {test} from 'node:test';
import assert from 'node:assert/strict';
import {MemoryPool} from './memory-pool.mjs';
import {createConfiguredHttpHandler} from '../../../supabase/functions/univeracademy-api/configured-http.ts';
import {proofHash} from '../../../supabase/functions/univeracademy-api/student-state.ts';
import {ids,clock,testNumbers,testPolicy} from '../http-fixture.ts';
async function fixture(){
 const pool=new MemoryPool(),family=crypto.randomUUID(),token='offline-known-clerk-app-session',identity={issuer:'https://clerk.offline.invalid',userId:'user_OfflineStudentA',sessionId:'sess_OfflineStudentA'};
 pool.state.people[ids.person].telegramId=null;
 pool.state.families[family]={personId:ids.person,expiresAt:clock+60000,revokedAt:null,logoutRetainUntil:null,authProvider:'clerk'};
 pool.state.access[await proofHash(token)]={familyId:family,expiresAt:clock+15000,superseded:false};
 pool.bindings[family]=identity;pool.identities=[{issuer:identity.issuer,subject:identity.userId,person_id:ids.person,enabled:true}];
 pool.fences=[{issuer:identity.issuer,subject:identity.userId,sid:identity.sessionId,person_id:ids.person,retired_at_ms:null}];
 const f={pool,family,token,identity,live:true,expires:clock+10000};
 const verifier={issuer:identity.issuer,authorizedParties:['https://mini.offline.invalid'],audience:{kind:'clerk_default_no_audience'},trustedKeys:()=>{throw Error('No real JWT key in offline test');},now:()=>pool.now};
 const handler=createConfiguredHttpHandler({mode:'local_contract',storage:{kind:'postgres_contract_double',pool},sessionPolicy:testPolicy,numericPresentation:testNumbers,now:()=>pool.now,
  clerk:{verifier,liveness:async id=>{pool.events.push({name:'offline_provider_check'});return {...id,status:f.live?'active':'revoked',accountEnabled:true,expiresAt:f.expires};}}});
 f.send=async(method,path,body)=>{const r=await handler(new Request('https://offline.invalid/api/v1'+path,{method,headers:{authorization:'Bearer '+token,'idempotency-key':'offline-clerk-command'},...(body===undefined?{}:{body:JSON.stringify(body)})}));return {status:r.status,...await r.json()};};return f;
}
const privateRead=e=>['ua_http_grants','ua_http_assignments','ua_http_attempt_ids','ua_answers_load'].includes(e.name);
test('known Clerk app session passes current identity/fence/provider before domain reads and same-answer UPDATE',async()=>{
 const f=await fixture();assert.equal((await f.send('GET','/me')).status,200);
 assert.equal(f.pool.events.some(privateRead),false);
 for(const path of ['/exams',`/exams/${ids.assignment}`])assert.equal((await f.send('GET',path)).status,200);
 assert.ok(f.pool.events.findIndex(e=>e.name==='offline_provider_check')<f.pool.events.findIndex(privateRead));
 const started=await f.send('POST',`/exams/${ids.assignment}/attempts`,{confirmed:true});assert.equal(started.status,200,JSON.stringify(started));const a=started.data;
 assert.equal((await f.send('GET',`/attempts/${a.id}`)).status,200);
 const path=`/attempts/${a.id}/answers/${ids.question}`;
 assert.equal((await f.send('PUT',path,{selected_option_id:ids.wrong,expected_revision:0})).data.revision,1);
 assert.equal((await f.send('PUT',path,{selected_option_id:ids.correct,expected_revision:1})).data.revision,2);
 const stale=await f.send('PUT',path,{selected_option_id:ids.wrong,expected_revision:1});assert.equal(stale.status,409);assert.equal(stale.error.code,'REVISION_CONFLICT');
 assert.deepEqual(f.pool.answerBranches,['INSERT','UPDATE']);
 const submit=await f.send('POST',`/attempts/${a.id}/submit`);assert.equal(submit.status,200,JSON.stringify(submit));
 assert.deepEqual((await f.send('GET',`/attempts/${a.id}/result`)).data,submit.data);
 const resume=await f.send('GET',`/attempts/${a.id}`);assert.equal(resume.data.deadline_at,a.deadline_at);assert.equal(resume.data.generation,a.generation);
});
for(const [name,change]of [
 ['missing binding',f=>delete f.pool.bindings[f.family]],
 ['missing provenance',f=>delete f.pool.state.families[f.family].authProvider],
 ['missing fence',f=>f.pool.fences=[]],
 ['retired fence',f=>f.pool.fences[0].retired_at_ms=clock],
 ['disabled identity',f=>f.pool.identities[0].enabled=false],
 ['provider revoked',f=>f.live=false],
 ['wrong issuer',f=>f.pool.bindings[f.family].issuer='https://other.offline.invalid'],
])test(name+' fails closed before exam/answer load',async()=>{const f=await fixture();change(f);const r=await f.send('GET','/exams');assert.ok(r.status>=400,JSON.stringify(r));assert.equal(f.pool.events.some(privateRead),false);});
test('provider lease expiration during a private read cannot commit',async()=>{const f=await fixture();f.pool.onStatement=name=>{if(name==='ua_http_assignments')f.pool.now=f.expires;};const r=await f.send('GET','/exams');assert.equal(r.status,401);assert.equal(f.pool.events.some(e=>e.name==='ua_commit'),false);});
test('missing JWT library or malformed JWT cannot become a session',async()=>{let available=true;try{import.meta.resolve('jose');}catch{available=false;}const f=await fixture();const r=await f.send('POST','/auth/clerk',{});assert.equal(r.status,available?401:503);assert.equal(f.pool.checkouts,0);});
