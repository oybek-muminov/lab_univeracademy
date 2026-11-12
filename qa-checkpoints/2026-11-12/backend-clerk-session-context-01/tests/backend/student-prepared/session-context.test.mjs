import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {locateStudentRefreshOnClient} from '../../../supabase/functions/univeracademy-api/storage/student-scope.ts';
import {createConfiguredHttpHandler} from '../../../supabase/functions/univeracademy-api/configured-http.ts';
import {ClerkDomainTransactions} from '../../../supabase/functions/univeracademy-api/storage/clerk-domain.ts';
import {ClerkScopedAuthStore} from '../../../supabase/functions/univeracademy-api/storage/clerk-auth-rows.ts';
import {proofHash} from '../../../supabase/functions/univeracademy-api/student-state.ts';
import {clock,ids,testPolicy,testNumbers,initialState} from '../http-fixture.ts';

const who={issuer:'https://clerk.profile.invalid',userId:'user_ProfileA',sessionId:'sess_ProfileA'};
const other='00000000-0000-4000-8000-000000000099';
const key=id=>JSON.stringify([id.issuer,id.userId]);
const fence=id=>JSON.stringify([id.issuer,id.userId,id.sessionId]);
const reset="SELECT set_config('ua.phase',$1,true),set_config('ua.person_id',$2,true),set_config('ua.person_ids',$3,true),set_config('ua.clerk_issuer',$4,true),set_config('ua.clerk_subject',$5,true),set_config('ua.telegram_id',$6,true)";
const privateRead=e=>['ua_http_grants','ua_http_assignments','ua_http_series','ua_http_attempt_ids','ua_answers_load'].includes(e.name);

// Exact statement/control-flow double only. No SQL parser, RLS evaluator, DB,
// JWT bypass, network or credential; server-authority inputs below are synthetic.
class Pool{
  data={people:{},members:{},identities:{},families:{},bindings:{},fences:{},access:{},refresh:{},replays:{}};
  now=clock;events=[];local={phase:'domain',person_id:other};draft;active=false;client;checkouts=0;
  fail;commitFailure;hook;locatorPerson;
  async connect(){
    assert.equal(this.active,false);this.active=true;this.checkouts++;
    return this.client??= {query:q=>this.query(q),release:discard=>{
      assert.equal(this.active,true);this.active=false;this.events.push({name:'release',discard:!!discard});
      if(discard){this.client=undefined;this.draft=undefined;this.local={};}
    }};
  }
  async query(q){
    const {name,text,values:v}=q;this.events.push({name,text,values:structuredClone(v),phase:this.local.phase,context:structuredClone(this.local)});
    await this.hook?.(name,this);if(this.fail===name)throw Error('synthetic statement failure');
    const rows=value=>({rows:structuredClone(value),rowCount:value.length}),ack=()=>rows([{}]);
    if(['ua_begin','ua_clerk_begin','ua_locator_begin'].includes(name)){assert.equal(text,'BEGIN');this.draft=structuredClone(this.data);return rows([]);}
    if(['ua_commit','ua_clerk_commit'].includes(name)){
      assert.equal(text,'COMMIT');if(this.commitFailure==='before')throw Error('synthetic commit uncertainty');
      this.data=this.draft;this.draft=undefined;this.local={};
      if(this.commitFailure==='after')throw Error('synthetic commit uncertainty');return rows([]);
    }
    if(['ua_rollback','ua_clerk_rollback','ua_locator_rollback'].includes(name)){assert.equal(text,'ROLLBACK');this.draft=undefined;this.local={};return rows([]);}
    assert.ok(this.draft,'SQL requires BEGIN');const d=this.draft;
    if(name==='ua_context_reset'){
      assert.equal(text,reset);assert.deepEqual(v,['deny','','[]','','','']);
      this.local=Object.fromEntries(['phase','person_id','person_ids','clerk_issuer','clerk_subject','telegram_id'].map((k,i)=>[k,v[i]]));return rows([]);
    }
    if(name==='ua_context_phase'){
      assert.equal(text,"SELECT set_config('ua.phase',$1,true)");assert.equal(v.length,1);
      if(v[0]==='domain')assert.equal(this.local.phase,'auth');this.local.phase=v[0];return rows([]);
    }
    if(name==='ua_people_context'){
      assert.equal(text,"SELECT set_config('ua.person_id',$1,true),set_config('ua.person_ids',$2,true)");
      assert.equal(this.local.phase,'auth');[this.local.person_id,this.local.person_ids]=v;return rows([]);
    }
    if(name==='ua_clerk_person_context'){this.local.person_id=v[0];return rows([]);}
    if(name==='ua_clerk_identity_context'){
      assert.equal(text,"SELECT set_config('ua.clerk_issuer',$1,true),set_config('ua.clerk_subject',$2,true)");
      assert.equal(this.local.phase,'auth');[this.local.clerk_issuer,this.local.clerk_subject]=v;return rows([]);
    }
    if(['ua_clock','ua_clerk_clock'].includes(name)){
      assert.ok(['SELECT floor(extract(epoch FROM clock_timestamp())*1000)::text AS now_ms','SELECT floor(extract(epoch FROM clock_timestamp()) * 1000)::text AS now_ms'].includes(text));
      return rows([{now_ms:String(this.now)}]);
    }
    if(name==='ua_locate_access'){
      assert.equal(text,'SELECT person_id::text FROM ua_private.locate_student_access($1::text)');assert.equal(this.local.phase,'auth');
      const a=d.access[v[0]],f=a&&d.families[a.familyId];return rows(f?[{person_id:this.locatorPerson??f.personId}]:[]);
    }
    if(name==='ua_locate_refresh'){
      assert.equal(text,'SELECT person_id::text FROM ua_private.locate_student_refresh($1::text)');assert.equal(this.local.phase,'auth');assert.equal(this.local.person_id,'');
      if(this.locatorRows)return rows(this.locatorRows);
      const refresh=d.refresh[v[0]],family=refresh&&d.families[refresh.familyId];return rows(family?[{person_id:this.locatorPerson??family.personId}]:[]);
    }
    if(name==='ua_clerk_session_family'){
      const table=text.includes('ua_private.student_access')?'student_access':'student_refresh';
      assert.equal(text,`SELECT p.family_id::text FROM ua_private.${table} p JOIN ua_private.student_families f ON f.id=p.family_id WHERE p.digest=$1 AND f.person_id=$2`);
      assert.equal(this.local.phase,'auth');assert.equal(this.local.person_id,v[1]);
      const p=(table==='student_access'?d.access:d.refresh)[v[0]],f=p&&d.families[p.familyId];
      return rows(f?.personId===v[1]?[{family_id:p.familyId}]:[]);
    }
    if(name==='ua_people_lock'||name==='ua_clerk_person_lock'){
      assert.equal(text,name==='ua_people_lock'?'SELECT id::text AS id FROM ua_private.lock_people($1::uuid[]) ORDER BY id':'SELECT id::text FROM ua_private.lock_people($1::uuid[]) ORDER BY id');
      assert.equal(this.local.phase,'auth');assert.deepEqual(JSON.parse(this.local.person_ids),v[0]);return rows(v[0].filter(id=>d.people[id]).map(id=>({id})));
    }
    if(name==='ua_clerk_identity_gate'){assert.equal(text,'SELECT pg_advisory_xact_lock(1430348620,hashtext($1))');return rows([]);}
    if(name==='ua_clerk_locate'){
      assert.equal(text,'SELECT person_id::text,enabled FROM ua_private.lock_clerk_identity($1::text,$2::text)');
      const i=d.identities[JSON.stringify(v)];return rows(i?[{person_id:i.personId,enabled:i.enabled}]:[]);
    }
    const scopedSql={
      ua_clerk_families:'SELECT id::text,person_id::text,expires_at_ms::text,revoked_at_ms::text,logout_retain_until_ms::text,auth_provider FROM ua_private.student_families WHERE person_id=$1 AND id=$2',
      ua_clerk_bindings:'SELECT b.family_id::text,b.person_id::text,b.issuer,b.subject,b.sid FROM ua_private.clerk_family_bindings b JOIN ua_private.student_families f ON f.id=b.family_id WHERE f.person_id=$1 AND f.id=$2',
      ua_clerk_access:'SELECT a.digest,a.family_id::text,a.expires_at_ms::text,a.superseded FROM ua_private.student_access a JOIN ua_private.student_families f ON f.id=a.family_id WHERE f.person_id=$1 AND f.id=$2',
      ua_clerk_refresh:'SELECT r.digest,r.family_id::text,r.consumed FROM ua_private.student_refresh r JOIN ua_private.student_families f ON f.id=r.family_id WHERE f.person_id=$1 AND f.id=$2'};
    if(v.length===2&&scopedSql[name]){assert.equal(text,scopedSql[name]);assert.equal(v[0],this.local.person_id);assert.equal(v[1].length,36);}
    const own=map=>Object.entries(map).filter(([,a])=>a.personId===v[0]);
    if(name==='ua_clerk_person'||name==='ua_http_person'){
      const p=d.people[v[0]];return rows(p?[{telegram_id:p.telegramId===null?null:String(p.telegramId),enabled:p.enabled,roles:p.profile.roles,profile:p.profile}]:[]);
    }
    if(name==='ua_clerk_membership'){const m=d.members[v[0]];return rows(m?[{active:m.active,epoch:String(m.epoch),revision:String(m.revision),affinity_group_id:m.affinityGroupId}]:[]);}
    if(name==='ua_clerk_identities')return rows(own(d.identities).map(([k,a])=>{const [issuer,subject]=JSON.parse(k);return {issuer,subject,person_id:a.personId,enabled:a.enabled};}));
    if(name==='ua_clerk_families'||name==='ua_http_families')return rows(own(d.families).filter(([id])=>!v[1]||id===v[1]).map(([id,f])=>({id,person_id:f.personId,expires_at_ms:String(f.expiresAt),revoked_at_ms:f.revokedAt===null?null:String(f.revokedAt),logout_retain_until_ms:f.logoutRetainUntil===null?null:String(f.logoutRetainUntil),auth_provider:f.authProvider??null})));
    if(name==='ua_clerk_bindings')return rows(Object.entries(d.bindings).filter(([id])=>d.families[id]?.personId===v[0]&&(!v[1]||id===v[1])).map(([family_id,b])=>({family_id,person_id:b.personId,issuer:b.issuer,subject:b.userId,sid:b.sessionId})));
    if(name==='ua_clerk_fences')return rows(own(d.fences).map(([k,a])=>{const [issuer,subject,sid]=JSON.parse(k);return {issuer,subject,sid,person_id:a.personId,retired_at_ms:a.retiredAt===null?null:String(a.retiredAt)};}));
    if(name==='ua_clerk_replays')return rows(own(d.replays).map(([digest,a])=>({digest,person_id:a.personId})));
    if(name==='ua_clerk_access'||name==='ua_http_access')return rows(Object.entries(d.access).filter(([,a])=>d.families[a.familyId]?.personId===v[0]&&(!v[1]||a.familyId===v[1])).map(([digest,a])=>({digest,family_id:a.familyId,expires_at_ms:String(a.expiresAt),superseded:a.superseded})));
    if(name==='ua_clerk_refresh'||name==='ua_http_refresh')return rows(Object.entries(d.refresh).filter(([,a])=>d.families[a.familyId]?.personId===v[0]&&(!v[1]||a.familyId===v[1])).map(([digest,a])=>({digest,family_id:a.familyId,consumed:a.consumed})));
    if(['ua_http_replays','ua_http_grants','ua_http_assignments','ua_http_series','ua_http_attempt_ids','ua_http_receipts','ua_http_bonuses','ua_http_cancellations'].includes(name))return rows([]);
    if(name==='ua_clerk_profile_update'){
      assert.equal(text,'UPDATE ua_private.people SET profile=$1::jsonb WHERE id=$2 RETURNING id');
      assert.equal(this.local.phase,'domain');assert.equal(this.local.person_id,v[1]);assert.deepEqual(JSON.parse(this.local.person_ids),[v[1]]);
      assert.equal(this.local.clerk_issuer,who.issuer);assert.equal(this.local.clerk_subject,who.userId);assert.equal(this.local.telegram_id,'');
      d.people[v[1]].profile=JSON.parse(v[0]);return ack();
    }
    assert.equal(this.local.phase,'exchange','Pinned session writes require exchange');assert.equal(this.local.clerk_issuer,who.issuer);assert.equal(this.local.clerk_subject,who.userId);assert.equal(this.local.person_id,ids.person);assert.equal(this.local.person_ids,JSON.stringify([ids.person]));assert.equal(this.local.telegram_id,'');
    if(name==='ua_clerk_replay_insert'){if(d.replays[v[0]])return rows([]);d.replays[v[0]]={personId:v[1],at:v[2]};}
    else if(name==='ua_clerk_family_revoke')Object.assign(d.families[v[2]],{revokedAt:v[0],logoutRetainUntil:v[1]});
    else if(name==='ua_clerk_fence_write')d.fences[JSON.stringify(v.slice(0,3))]={personId:v[3],retiredAt:v[4]};
    else if(name==='ua_clerk_family_insert')d.families[v[0]]={personId:v[1],expiresAt:v[2],revokedAt:v[3],logoutRetainUntil:v[4],authProvider:v[5]};
    else if(name==='ua_clerk_binding_insert')d.bindings[v[0]]={issuer:v[1],userId:v[2],sessionId:v[3],personId:v[4]};
    else if(name==='ua_clerk_access_write')d.access[v[0]]={familyId:v[1],expiresAt:v[2],superseded:v[3]};
    else if(name==='ua_clerk_refresh_write')d.refresh[v[0]]={familyId:v[1],consumed:v[2]};
    else throw Error('UNEXPECTED_SYNTHETIC_SQL:'+name);
    return ack();
  }
}

async function fixture(){
  const pool=new Pool(),person=structuredClone(initialState().people[ids.person]);person.telegramId=null;
  person.profile.first_name='';person.profile.last_name='';person.profile.registration_complete=false;
  pool.data.people[ids.person]=person;pool.data.people[other]=structuredClone(person);
  pool.data.people[other].profile.person_id=other;pool.data.people[other].profile.qadam_id='9999999999';
  for(const [id,p]of Object.entries(pool.data.people))pool.data.members[id]={active:p.profile.active_group_id!==null,epoch:0,revision:0,affinityGroupId:p.profile.active_group_id};
  const token='synthetic-profile-opaque-session',digest=await proofHash(token),family=crypto.randomUUID();
  pool.data.families[family]={personId:ids.person,expiresAt:clock+60000,revokedAt:null,logoutRetainUntil:null,authProvider:'clerk'};
  pool.data.access[digest]={familyId:family,expiresAt:clock+30000,superseded:false};
  pool.data.identities[key(who)]={personId:ids.person,enabled:true};pool.data.bindings[family]={...who,personId:ids.person};pool.data.fences[fence(who)]={personId:ids.person,retiredAt:null};
  const f={pool,token,digest,family,expires:clock+20000,live:true,accountEnabled:true,providerCalls:0};
  f.liveness=async identity=>{pool.events.push({name:'provider_check',phase:pool.local.phase,identity:structuredClone(identity)});f.providerCalls++;
    if(f.providerFailure)throw Error('synthetic provider unavailable');f.afterProvider?.();return {...identity,status:f.live?'active':'revoked',accountEnabled:f.accountEnabled,expiresAt:f.expiry?.(f.providerCalls)??f.expires,...f.names};};
  f.verifier={issuer:who.issuer,authorizedParties:['https://mini.profile.invalid'],audience:{kind:'clerk_default_no_audience'},trustedKeys:()=>{throw Error('No JWT verifier substitute');},now:()=>f.serverNow?.()??pool.now};
  f.options=request=>({pool,request,sessionPolicy:testPolicy,now:()=>pool.now,liveness:f.liveness,verifier:f.verifier});
  f.request=(method='PATCH',body={first_name:'Ada',last_name:'Student'},candidate=f.token,headers={})=>new Request('https://api.profile.invalid/api/v1/me',{
    method,headers:{authorization:'Bearer '+candidate,...headers},...(body===undefined?{}:{body:JSON.stringify(body)})});
  const handler=createConfiguredHttpHandler({mode:'local_contract',storage:{kind:'postgres_contract_double',pool},sessionPolicy:testPolicy,numericPresentation:testNumbers,now:()=>pool.now,clerk:{verifier:f.verifier,liveness:f.liveness}});
  f.send=async(body,token,headers)=>{const response=await handler(f.request('PATCH',body,token,headers));return {status:response.status,...await response.json()};};
  f.call=async(method,path,body,token)=>{const response=await handler(new Request('https://api.profile.invalid/api/v1'+path,{method,headers:token===undefined?{}:{authorization:'Bearer '+token},...(body===undefined?{}:{body:JSON.stringify(body)})}));return {status:response.status,...await response.json()};};
  return f;
}
const wrote=f=>f.pool.events.some(e=>e.name==='ua_clerk_profile_update');
const entered=f=>f.pool.events.some(e=>e.name==='ua_context_phase'&&e.values[0]==='domain');

const sessionDml=e=>['ua_clerk_family_revoke','ua_clerk_access_write','ua_clerk_refresh_write'].includes(e.name);
async function sessions(){const f=await fixture();f.refresh='synthetic-session-refresh';f.refreshDigest=await proofHash(f.refresh);f.pool.data.refresh[f.refreshDigest]={familyId:f.family,consumed:false};return f;}
test('refresh uses body proof and exchange before each write without domain reads',async()=>{
 const f=await sessions(),r=await f.call('POST','/auth/refresh',{refresh_token:f.refresh},'unrelated');
 assert.equal(r.status,200,JSON.stringify(r));assert.equal(f.pool.checkouts,1);assert.equal(f.pool.events.some(privateRead),false);assert.equal(f.pool.data.refresh[f.refreshDigest].consumed,true);
 assert.equal(f.pool.data.families[f.family].expiresAt,clock+60000);assert.ok(f.providerCalls>0);
});
test('logout revokes locally under exchange without provider availability',async()=>{
 const f=await sessions();f.providerFailure=true;f.live=false;
 const r=await f.call('POST','/auth/logout',{refresh_token:f.refresh});assert.equal(r.status,200,JSON.stringify(r));assert.equal(f.providerCalls,0);
 assert.equal(f.pool.events.some(privateRead),false);assert.equal(f.pool.checkouts,1);assert.equal(f.pool.events.filter(sessionDml).length,1);assert.equal(f.pool.data.families[f.family].revokedAt,clock);
});
const dml=f=>f.pool.events.filter(sessionDml);
const committed=f=>f.pool.events.filter(e=>e.name==='ua_commit').length;
const noAuthDml=f=>assert.equal(f.pool.events.some(e=>['ua_clerk_profile_update','ua_clerk_person_insert','ua_clerk_member_insert','ua_clerk_identity_insert','ua_clerk_fence_write','ua_clerk_binding_insert','ua_clerk_replay_insert','ua_clerk_family_insert'].includes(e.name)),false);
const request=(f,path,token)=>new Request('https://api.profile.invalid/api/v1/auth/'+path,{method:'POST',headers:token?{authorization:'Bearer '+token}:{},body:JSON.stringify({refresh_token:f.refresh})});
test('rotation supersedes old access; reuse commits only family revocation before 401',async()=>{
 const f=await sessions(),r=await f.call('POST','/auth/refresh',{refresh_token:f.refresh},'bad-unrelated');assert.equal(r.status,200);
 assert.equal(f.pool.data.access[f.digest].superseded,true);assert.equal(f.pool.data.families[f.family].expiresAt,clock+60000);noAuthDml(f);
 f.pool.events=[];const reuse=await f.call('POST','/auth/refresh',{refresh_token:f.refresh});
 assert.equal(reuse.status,401,JSON.stringify(reuse));assert.equal(reuse.error.code,'REFRESH_REUSED');assert.equal(committed(f),1);assert.equal(dml(f).length,1);
 assert.equal(f.pool.data.families[f.family].revokedAt,clock);assert.ok(f.providerCalls>0);noAuthDml(f);
});
test('logout consumed proof tolerates disabled/retired authority only for revocation',async()=>{
 const f=await sessions();f.pool.data.refresh[f.refreshDigest].consumed=true;f.pool.data.identities[key(who)].enabled=false;
 f.pool.data.people[ids.person].enabled=false;f.pool.data.fences[fence(who)].retiredAt=clock;f.live=false;
 const result=await f.call('POST','/auth/logout',{refresh_token:f.refresh});assert.equal(result.status,200,JSON.stringify(result));assert.equal(f.providerCalls,0);assert.equal(dml(f).length,1);
 assert.equal(f.pool.data.refresh[f.refreshDigest].consumed,true);noAuthDml(f);
});
test('refresh-proof tombstone repeat has no DML or extension; equality denies',async()=>{
 const f=await sessions();assert.equal((await f.call('POST','/auth/logout',{refresh_token:f.refresh})).status,200);
 const retained=structuredClone(f.pool.data);f.pool.events=[];f.pool.now++;
 assert.equal((await f.call('POST','/auth/logout',{refresh_token:f.refresh})).status,200);assert.equal(dml(f).length,0);assert.deepEqual(f.pool.data,retained);assert.equal(f.providerCalls,0);
 f.pool.now=f.pool.data.families[f.family].logoutRetainUntil;
 const result=await f.call('POST','/auth/logout',{refresh_token:f.refresh});assert.equal(result.status,401);assert.equal(result.error.code,'REFRESH_EXPIRED');assert.deepEqual(f.pool.data,retained);
});
test('bearer logout is local, but invalid bearer never falls back to valid refresh',async()=>{
 const f=await sessions();f.live=false;
 const bad=await f.call('POST','/auth/logout',{refresh_token:f.refresh},'unknown');assert.equal(bad.status,401);assert.equal(dml(f).length,0);
 assert.equal((await f.call('POST','/auth/logout',undefined,f.token)).status,200);assert.equal(f.providerCalls,0);assert.equal(dml(f).length,1);
 const again=await f.call('POST','/auth/logout',{refresh_token:f.refresh},f.token);assert.equal(again.status,401);assert.equal(again.error.code,'SESSION_REVOKED');
});
test('both logout proofs must bind the same persisted family',async()=>{
 const f=await sessions(),family=crypto.randomUUID(),refresh='unrelated-body';
 f.pool.data.families[family]={...f.pool.data.families[f.family],revokedAt:clock,logoutRetainUntil:clock+10000};
 f.pool.data.refresh[await proofHash(refresh)]={familyId:family,consumed:true};f.pool.data.bindings[family]={...who,personId:ids.person};
 const before=structuredClone(f.pool.data),result=await f.call('POST','/auth/logout',{refresh_token:refresh},f.token);
 assert.equal(result.status,401);assert.equal(result.error.code,'LOGOUT_PROOF_MISMATCH');assert.equal(dml(f).length,0);assert.deepEqual(f.pool.data,before);
});
for(const [name,change]of [
 ['missing binding',f=>delete f.pool.data.bindings[f.family]],
 ['wrong issuer',f=>f.pool.data.bindings[f.family].issuer='https://wrong.invalid'],
 ['wrong subject',f=>f.pool.data.bindings[f.family].userId='user_Wrong'],
 ['wrong person',f=>f.pool.data.bindings[f.family].personId=other],
 ['invalid binding',f=>f.pool.data.bindings[f.family].sessionId='invalid'],
 ['cross-person locator',f=>f.pool.locatorPerson=other],
])for(const route of ['refresh','logout'])test(route+' denies '+name+' before session writes',async()=>{
 const f=await sessions();change(f);const before=structuredClone(f.pool.data),r=await f.call('POST','/auth/'+route,{refresh_token:f.refresh});
 assert.ok(r.status>=400,JSON.stringify(r));assert.equal(dml(f).length,0);assert.equal(committed(f),0);assert.deepEqual(f.pool.data,before);assert.equal(f.pool.events.some(privateRead),false);
});
for(const [name,change]of [
 ['disabled identity',f=>f.pool.data.identities[key(who)].enabled=false],
 ['disabled person',f=>f.pool.data.people[ids.person].enabled=false],
 ['retired fence',f=>f.pool.data.fences[fence(who)].retiredAt=clock],
 ['provider revoked',f=>f.live=false],
 ['provider disabled',f=>f.accountEnabled=false],
 ['provider unavailable',f=>f.providerFailure=true],
 ['provider expiry equality',f=>f.expires=clock],
 ['family expiry equality',f=>f.pool.data.families[f.family].expiresAt=clock],
 ['revoked family',f=>f.pool.data.families[f.family].revokedAt=clock],
])test('refresh cannot renew '+name,async()=>{
 const f=await sessions();change(f);const before=structuredClone(f.pool.data),r=await f.call('POST','/auth/refresh',{refresh_token:f.refresh});
 assert.ok(r.status>=400,JSON.stringify(r));assert.equal(dml(f).length,0);assert.equal(committed(f),0);assert.deepEqual(f.pool.data,before);
});
for(const [name,change]of [
 ['disabled identity',f=>f.pool.data.identities[key(who)].enabled=false],
 ['disabled person',f=>f.pool.data.people[ids.person].enabled=false],
 ['retired fence',f=>f.pool.data.fences[fence(who)].retiredAt=clock],
 ['superseded access',f=>f.pool.data.access[f.digest].superseded=true],
 ['expired access',f=>f.pool.data.access[f.digest].expiresAt=clock],
 ['expired family',f=>f.pool.data.families[f.family].expiresAt=clock],
])test('bearer logout preserves local denial: '+name,async()=>{
 const f=await sessions();change(f);const before=structuredClone(f.pool.data),r=await f.call('POST','/auth/logout',{refresh_token:f.refresh},f.token);
 assert.ok(r.status>=400);assert.equal(dml(f).length,0);assert.deepEqual(f.pool.data,before);assert.equal(f.providerCalls,0);
});
test('post-provider expiry and shortened lease equality roll rotation back',async()=>{
 for(const shortened of [false,true]){
  const f=await sessions(),before=structuredClone(f.pool.data);
  if(shortened){f.expiry=n=>n===2?clock+100:clock+10000;f.pool.hook=(n,p)=>{if(n==='ua_clock'&&p.events.some(sessionDml))p.now=clock+100;};}
  else f.afterProvider=()=>{f.pool.now=f.expires;};
  const r=await f.call('POST','/auth/refresh',{refresh_token:f.refresh});assert.equal(r.status,401,JSON.stringify(r));assert.equal(committed(f),0);assert.deepEqual(f.pool.data,before);
 }
});
for(const route of ['refresh','logout'])test(route+' final local expiry equality rolls writes back',async()=>{
 const f=await sessions(),before=structuredClone(f.pool.data);f.pool.hook=(n,p)=>{if(n==='ua_clock'&&p.events.some(sessionDml))p.now=clock+60000;};
 const r=await f.call('POST','/auth/'+route,{refresh_token:f.refresh});assert.equal(r.status,401);assert.equal(committed(f),0);assert.deepEqual(f.pool.data,before);
});
for(const mutation of ['profile','identity','member','fence','other family','domain','tokens on logout','tombstone extension'])test('session callback cannot mutate '+mutation,async()=>{
 const f=await sessions(),before=structuredClone(f.pool.data),route=mutation==='tokens on logout'||mutation==='tombstone extension'?'logout':'refresh';
 await assert.rejects(new ClerkDomainTransactions(f.options(request(f,route))).transaction(async tx=>{
  const s=tx.state;if(mutation==='profile')s.domain.student.people[ids.person].profile.first_name='Forged';
  if(mutation==='identity')s.identities[key(who)].enabled=false;
  if(mutation==='member')s.domain.memberships[ids.person].epoch++;
  if(mutation==='fence')s.studentSessions[fence(who)].retiredAt=clock;
  if(mutation==='other family')s.domain.student.families[other]={...s.domain.student.families[f.family]};
  if(mutation==='domain')s.domain.student.assignments.Forged={};
  if(mutation==='tokens on logout')s.domain.student.refresh['a'.repeat(64)]={familyId:f.family,consumed:false};
  if(mutation==='tombstone extension'){s.domain.student.families[f.family].revokedAt=clock;s.domain.student.families[f.family].logoutRetainUntil=clock+testPolicy.logoutTombstoneMs+1;}
 }));assert.equal(committed(f),0);assert.deepEqual(f.pool.data,before);
});
for(const route of ['refresh','logout'])for(const point of (route==='logout'?['ua_clerk_identity_context','ua_context_phase','ua_clerk_family_revoke']:['ua_clerk_identity_context','ua_context_phase','ua_clerk_family_revoke','ua_clerk_access_write','ua_clerk_refresh_write']))test(route+' setter/write failure '+point+' rolls back',async()=>{
 const f=await sessions(),before=structuredClone(f.pool.data);if(point==='ua_clerk_family_revoke')f.pool.data.refresh[f.refreshDigest].consumed=true;
 const baseline=structuredClone(f.pool.data);
 if(point==='ua_context_phase')f.pool.hook=(n,p)=>{if(n===point&&p.events.at(-1).values[0]==='exchange')throw Error('synthetic setter failure');};else f.pool.fail=point;
 const r=await f.call('POST','/auth/'+route,{refresh_token:f.refresh});assert.ok(r.status>=400);assert.equal(committed(f),0);assert.deepEqual(f.pool.data,baseline);
});
for(const route of ['refresh','logout'])for(const stage of ['before','after'])test(route+' uncertain COMMIT '+stage+' is sanitized 503 and discarded once',async()=>{
 const f=await sessions();f.pool.commitFailure=stage;const r=await f.call('POST','/auth/'+route,{refresh_token:f.refresh});
 assert.equal(r.status,503,JSON.stringify(r));assert.equal(r.error.code,'SERVICE_UNAVAILABLE');assert.equal(committed(f),1);assert.equal(f.pool.checkouts,1);
 assert.deepEqual(f.pool.events.filter(e=>e.name==='release').map(e=>e.discard),[true]);assert.equal(f.pool.events.filter(e=>e.name==='ua_rollback').length,0);
 assert.equal(JSON.stringify(r).includes('synthetic'),false);
});
test('rollback failure discards and next checkout resets all six keys',async()=>{
 const f=await sessions();f.pool.hook=(n,p)=>{if(n==='ua_clerk_access_write'||n==='ua_rollback')throw Error('synthetic failure');};
 assert.ok((await f.call('POST','/auth/refresh',{refresh_token:f.refresh})).status>=400);assert.deepEqual(f.pool.events.filter(e=>e.name==='release').map(e=>e.discard),[true]);
 f.pool.hook=undefined;f.pool.events=[];assert.equal((await f.call('POST','/auth/logout',{refresh_token:f.refresh})).status,200);
 const resets=f.pool.events.filter(e=>e.name==='ua_context_reset');assert.equal(resets.length,1);assert.deepEqual(resets[0].values,['deny','','[]','','','']);assert.deepEqual(f.pool.local,{});
});
test('sequential successful rotation then GET then local logout never inherits context',async()=>{
 const f=await sessions(),r=await f.call('POST','/auth/refresh',{refresh_token:f.refresh});assert.equal(r.status,200);
 assert.equal((await f.call('GET','/me',undefined,r.data.access_token)).status,200);
 assert.equal((await f.call('POST','/auth/logout',undefined,r.data.access_token)).status,200);
 assert.deepEqual(f.pool.local,{});assert.equal(f.pool.events.filter(e=>e.name==='ua_context_reset').length,3);
 assert.equal(f.pool.events.filter(e=>e.name==='ua_people_lock').length,3);noAuthDml(f);
 const refreshEvents=f.pool.events.slice(0,f.pool.events.findIndex(e=>e.name==='ua_commit'));
 assert.ok(refreshEvents.findIndex(e=>e.name==='ua_locate_refresh')<refreshEvents.findIndex(e=>e.name==='ua_people_lock'));
 assert.ok(refreshEvents.findIndex(e=>e.name==='ua_people_lock')<refreshEvents.findIndex(e=>e.name==='ua_clerk_person'));
});
test('revoked tombstone remains local and DML-free even without active provider metadata',async()=>{
 const f=await sessions();f.pool.data.families[f.family].revokedAt=clock-1;f.pool.data.families[f.family].logoutRetainUntil=clock+100;
 delete f.pool.data.bindings[f.family];f.pool.data.identities[key(who)].enabled=false;f.pool.data.fences[fence(who)].retiredAt=clock;
 const before=structuredClone(f.pool.data),r=await f.call('POST','/auth/logout',{refresh_token:f.refresh});assert.equal(r.status,200,JSON.stringify(r));
 assert.equal(dml(f).length,0);assert.equal(f.providerCalls,0);assert.deepEqual(f.pool.data,before);assert.equal(f.pool.events.some(e=>e.name==='ua_clerk_identity_context'),false);
});
test('empty or malformed Authorization cannot fall back to refresh; refresh ignores both',async()=>{
 for(const header of ['', 'malformed']){
  const f=await sessions();const handler=createConfiguredHttpHandler({mode:'local_contract',storage:{kind:'postgres_contract_double',pool:f.pool},sessionPolicy:testPolicy,numericPresentation:testNumbers,now:()=>f.pool.now,clerk:{verifier:f.verifier,liveness:f.liveness}});
  const send=async route=>handler(new Request('https://api.profile.invalid/api/v1/auth/'+route,{method:'POST',headers:{authorization:header},body:JSON.stringify({refresh_token:f.refresh})}));
  const bad=await send('logout');assert.equal(bad.status,401);assert.equal(f.pool.checkouts,0);
  assert.equal((await send('refresh')).status,200);
 }
});
test('bearer authentication error precedes malformed logout body',async()=>{
 const f=await sessions(),handler=createConfiguredHttpHandler({mode:'local_contract',storage:{kind:'postgres_contract_double',pool:f.pool},sessionPolicy:testPolicy,numericPresentation:testNumbers,now:()=>f.pool.now,clerk:{verifier:f.verifier,liveness:f.liveness}});
 const r=await handler(new Request('https://api.profile.invalid/api/v1/auth/logout',{method:'POST',headers:{authorization:'Bearer unknown'},body:'not json'}));
 assert.equal(r.status,401);assert.equal((await r.json()).error.code,'SESSION_REVOKED');assert.equal(dml(f).length,0);
});
test('unknown refresh proof and missing logout proof cannot load private rows or write',async()=>{
 const f=await sessions(),r=await f.call('POST','/auth/refresh',{refresh_token:'unknown'});assert.equal(r.status,401);assert.equal(r.error.code,'REFRESH_INVALID');
 assert.equal(f.pool.events.some(e=>e.name==='ua_clerk_person'),false);assert.equal((await f.call('POST','/auth/logout')).status,401);assert.equal(dml(f).length,0);
});
test('same-family bearer plus refresh logs out with only selected revocation and no provider call',async()=>{
 const f=await sessions(),r=await f.call('POST','/auth/logout',{refresh_token:f.refresh},f.token);assert.equal(r.status,200,JSON.stringify(r));assert.equal(dml(f).length,1);assert.equal(f.providerCalls,0);
});
test('retained tombstone final equality cannot acknowledge success',async()=>{
 const f=await sessions();f.pool.data.families[f.family].revokedAt=clock-1;f.pool.data.families[f.family].logoutRetainUntil=clock+10;
 f.serverNow=()=>f.pool.events.filter(e=>e.name==='ua_clock').length>=5?clock+10:clock;
 const before=structuredClone(f.pool.data),r=await f.call('POST','/auth/logout',{refresh_token:f.refresh});assert.equal(r.status,401);assert.equal(committed(f),0);assert.equal(dml(f).length,0);assert.deepEqual(f.pool.data,before);
});
for(const hint of [[{person_id:ids.person},{person_id:ids.person}],[{person_id:ids.person,extra:'forbidden'}],[{person_id:'AAAAAAAA-AAAA-4AAA-8AAA-AAAAAAAAAAAA'}],[{person_id:null}]])test('malformed refresh hint rejects before person lock '+JSON.stringify(hint),async()=>{
 const f=await sessions();f.pool.locatorRows=hint;const r=await f.call('POST','/auth/refresh',{refresh_token:f.refresh});assert.equal(r.status,500);
 assert.equal(f.pool.events.some(e=>e.name==='ua_people_lock'),false);assert.equal(dml(f).length,0);
});
test('refresh helper refuses missing transaction auth context before any SQL',async()=>{
 let reads=0;const client={query(){reads++;throw Error('must not run');},release(){}};
 await assert.rejects(locateStudentRefreshOnClient(client,'a'.repeat(64)),e=>e.status===503);assert.equal(reads,0);
 for(const digest of ['', 'A'.repeat(64), 'a'.repeat(63), 'a'.repeat(64)+'\n'])await assert.rejects(locateStudentRefreshOnClient(client,digest),e=>e.status===401);
 assert.equal(reads,0);
});
test('cancelled authority await rolls back without session DML',async()=>{
 const f=await sessions(),abort=new AbortController();f.afterProvider=()=>abort.abort();
 const req=new Request(request(f,'refresh'),{signal:abort.signal});
 await assert.rejects(new ClerkDomainTransactions(f.options(req)).transaction(async()=>{}));
 assert.equal(dml(f).length,0);assert.equal(committed(f),0);assert.equal(f.pool.events.filter(e=>e.name==='ua_rollback').length,1);
});
test('inactive refresh locator exposes only a hint under exact six-key reset scope',async()=>{
 const sql=await readFile(new URL('../../../../review/first-student-refresh-locator.review.sql',import.meta.url),'utf8');
 assert.match(sql,/^-- INACTIVE REVIEW DERIVATIVE/);assert.match(sql,/\nBEGIN;/);assert.match(sql,/\nROLLBACK;\s*$/);assert.doesNotMatch(sql,/\bCOMMIT\s*;/);
 const body=sql.split('AS $fn$ BEGIN')[1].split('END $fn$;')[0];
 for(const [key,value]of [['phase','auth'],['person_id',''],['person_ids','[]'],['clerk_issuer',''],['clerk_subject',''],['telegram_id','']])assert.ok(body.includes(`current_setting('ua.${key}',true) IS DISTINCT FROM '${value}'`));
 assert.match(body,/COALESCE\(length\(p_digest\)=64 AND p_digest ~ '\^\[0-9a-f\]\{64\}\$'/);
 assert.match(sql,/RETURNS TABLE\(person_id uuid\)/);assert.match(sql,/SECURITY DEFINER SET search_path = pg_catalog, ua_private/);
 assert.match(body,/RETURN QUERY SELECT f.person_id FROM ua_private.student_refresh r\s+JOIN ua_private.student_families f ON f.id=r.family_id WHERE r.digest=p_digest;/);
 assert.doesNotMatch(body,/r\.consumed|f\.revoked|f\.expires|set_config|EXECUTE|INSERT|UPDATE|DELETE/);
});
test('inactive locator keeps restricted owner, exact temporary transfer and no runtime table expansion',async()=>{
 const sql=await readFile(new URL('../../../../review/first-student-refresh-locator.review.sql',import.meta.url),'utf8');
 assert.match(sql,/AND admin_option AND NOT inherit_option AND NOT set_option/);assert.match(sql,/oid=10 AND rolname='supabase_admin' AND rolsuper/);
 assert.match(sql,/NOT rolcanlogin AND NOT rolinherit[\s\S]*NOT rolsuper AND NOT rolbypassrls/);
 assert.match(sql,/GRANT SELECT\(digest,family_id\) ON ua_private.student_refresh TO ua_access_locator_owner;/);
 assert.match(sql,/FOR SELECT TO ua_access_locator_owner USING\(true\)/);
 assert.match(sql,/ALTER FUNCTION ua_private.locate_student_refresh\(text\) OWNER TO ua_access_locator_owner/);
 assert.match(sql,/REVOKE ALL ON FUNCTION [^;]* FROM PUBLIC,anon,authenticated,service_role,ua_owner/);
 assert.match(sql,/GRANT EXECUTE ON FUNCTION ua_private.locate_student_refresh\(text\) TO ua_runtime/);
 assert.doesNotMatch(sql,/GRANT (SELECT|INSERT|UPDATE|ALL)[^;]* TO ua_runtime/);
 assert.doesNotMatch(sql,/CREATE ROLE|ALTER ROLE|BYPASSRLS\s*;/);
 const transfer=sql.indexOf('GRANT CREATE ON SCHEMA'),owner=sql.indexOf('ALTER FUNCTION'),revoke=sql.indexOf('REVOKE CREATE ON SCHEMA');assert.ok(transfer<owner&&owner<revoke);
 assert.match(sql,/GRANT ua_access_locator_owner TO CURRENT_USER WITH ADMIN FALSE, INHERIT TRUE, SET TRUE GRANTED BY CURRENT_USER/);
 assert.match(sql,/REVOKE ua_access_locator_owner FROM CURRENT_USER GRANTED BY CURRENT_USER/);
 assert.match(sql,/REFRESH_LOCATOR_FINAL_PRIVILEGES_UNSAFE/);
});
test('monotonic server clock cannot move backwards after a provider read',async()=>{
 const f=await sessions(),before=structuredClone(f.pool.data);let reads=0;f.serverNow=()=>++reads===2?clock+10:clock;
 const r=await f.call('POST','/auth/refresh',{refresh_token:f.refresh});assert.ok(r.status>=400);assert.equal(committed(f),0);assert.deepEqual(f.pool.data,before);
});
test('client identity fields cannot select context and forged provisioning fields cause no I/O',async()=>{
 const f=await sessions();const bad=await f.call('POST','/auth/refresh',{refresh_token:f.refresh,person_id:other,issuer:who.issuer,roles:['owner']});assert.equal(bad.status,422);assert.equal(f.pool.checkouts,0);
 const handler=createConfiguredHttpHandler({mode:'local_contract',storage:{kind:'postgres_contract_double',pool:f.pool},sessionPolicy:testPolicy,numericPresentation:testNumbers,now:()=>f.pool.now,clerk:{verifier:f.verifier,liveness:f.liveness}});
 const r=await handler(new Request('https://api.profile.invalid/api/v1/auth/refresh',{method:'POST',headers:{'x-person-id':other,'x-clerk-issuer':'https://forged.invalid','x-clerk-subject':'user_Forged',authorization:'Bearer unrelated'},body:JSON.stringify({refresh_token:f.refresh})}));assert.equal(r.status,200);
 const context=f.pool.events.find(e=>e.name==='ua_clerk_identity_context');assert.deepEqual(context.values,[who.issuer,who.userId]);assert.equal(dml(f).every(e=>e.context.person_id===ids.person),true);
});
test('unsupported session method/path combinations cannot enter the private session path',async()=>{
 const f=await sessions();for(const [method,path,body]of [['GET','/auth/refresh',undefined],['PUT','/auth/logout',{refresh_token:f.refresh}],['POST','/unknown/auth/refresh',{refresh_token:f.refresh}],['POST','/unknown/auth/logout',{refresh_token:f.refresh}]]){
  const r=await f.call(method,path,body,f.token);assert.equal(r.status,404,JSON.stringify(r));assert.equal(f.pool.checkouts,0);assert.equal(f.providerCalls,0);
 }
});
