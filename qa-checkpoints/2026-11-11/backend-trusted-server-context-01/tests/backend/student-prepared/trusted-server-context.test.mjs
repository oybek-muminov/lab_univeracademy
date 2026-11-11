import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PostgresTransactions,StorageUnavailable} from '../../../supabase/functions/univeracademy-api/storage/postgres-transaction.ts';
import {resetTrustedServerContext,setTrustedPhase,setTrustedPeople,setTrustedClerk,requireTrustedAuth,closeTrustedServerContext} from '../../../supabase/functions/univeracademy-api/storage/trusted-server-context.ts';
import {locateStudentAccessOnClient,locateStudent} from '../../../supabase/functions/univeracademy-api/storage/student-scope.ts';
import {ClerkScopedAuthStore} from '../../../supabase/functions/univeracademy-api/storage/clerk-auth-rows.ts';
import {createConfiguredHttpHandler} from '../../../supabase/functions/univeracademy-api/configured-http.ts';
import {proofHash} from '../../../supabase/functions/univeracademy-api/student-state.ts';
import {MemoryPool} from './memory-pool.mjs';
import {initialState,ids,clock,testPolicy,testNumbers,botKey} from '../http-fixture.ts';

const P=ids.person,Q=ids.other,proof='a'.repeat(64);
const who={issuer:'https://clerk.synthetic.invalid',userId:'user_CaseSensitive',sessionId:'sess_FirstPilot'};
const clerkProof=()=>({...who,kind:'clerk_verified',notBefore:clock-1,expiresAt:clock+10000,authorizedParty:'https://mini.synthetic.invalid',tokenId:'synthetic-token-id'});
const resetText="SELECT set_config('ua.phase',$1,true),set_config('ua.person_id',$2,true),set_config('ua.person_ids',$3,true),set_config('ua.clerk_issuer',$4,true),set_config('ua.clerk_subject',$5,true),set_config('ua.telegram_id',$6,true)";
const empty=['deny','','[]','','',''];
const keys=['ua.phase','ua.person_id','ua.person_ids','ua.clerk_issuer','ua.clerk_subject','ua.telegram_id'];
const denial=e=>e.status===503;
const rows=(value=[])=>({rows:structuredClone(value),rowCount:value.length});

// Protocol/GUC-lifetime double, not SQL execution or an RLS implementation.
// Reuses the SAME client object; dirty session sentinels return at every BEGIN.
class Pool {
  queries=[];releases=[];checkouts=0;local;fail;rollbackFails=false;mapping=[{person_id:P,enabled:true}];hint=[{person_id:P}];lockRows;providerChecks=0;
  session=Object.fromEntries(keys.map((key,i)=>[key,['domain',Q,JSON.stringify([Q]),'https://old.invalid','user_Old','4000000001'][i]]));
  client={query:async q=>{
    this.queries.push(structuredClone(q));
    if(q.name===this.fail)throw Error('synthetic statement failure');
    if(q.text==='BEGIN'){this.local={...this.session};return rows();}
    if(q.name==='ua_context_reset'){assert.equal(q.text,resetText);assert.deepEqual(q.values,empty);this.local=Object.fromEntries(keys.map((k,i)=>[k,q.values[i]]));return rows();}
    if(q.name==='ua_context_phase'){assert.equal(q.text,"SELECT set_config('ua.phase',$1,true)");this.local['ua.phase']=q.values[0];return rows();}
    if(q.name==='ua_people_context'){assert.equal(q.text,"SELECT set_config('ua.person_id',$1,true),set_config('ua.person_ids',$2,true)");this.local['ua.person_id']=q.values[0];this.local['ua.person_ids']=q.values[1];return rows();}
    if(q.name==='ua_clerk_identity_context'){assert.equal(q.text,"SELECT set_config('ua.clerk_issuer',$1,true),set_config('ua.clerk_subject',$2,true)");this.local['ua.clerk_issuer']=q.values[0];this.local['ua.clerk_subject']=q.values[1];return rows();}
    if(q.name==='ua_telegram_identity_context'){this.local['ua.telegram_id']=q.values[0];return rows();}
    if(q.name==='ua_locate_access'){assert.equal(this.local['ua.phase'],'auth');assert.equal(this.local['ua.person_id'],'');assert.equal(q.text,'SELECT person_id::text FROM ua_private.locate_student_access($1::text)');return rows(this.hint);}
    if(q.name==='ua_people_lock'||q.name==='ua_clerk_person_lock'){
      assert.equal(this.local['ua.phase'],'auth');assert.equal(this.local['ua.person_ids'],JSON.stringify(q.values[0]));
      assert.equal(q.text,q.name==='ua_people_lock'?'SELECT id::text AS id FROM ua_private.lock_people($1::uuid[]) ORDER BY id':'SELECT id::text FROM ua_private.lock_people($1::uuid[]) ORDER BY id');
      return rows(this.lockRows??q.values[0].map(id=>({id})));
    }
    if(q.name==='ua_clerk_identity_gate'){assert.equal(q.text,'SELECT pg_advisory_xact_lock(1430348620,hashtext($1))');assert.deepEqual(q.values,[JSON.stringify([who.issuer,who.userId])]);return rows();}
    if(q.name==='ua_clerk_locate'){assert.equal(q.text,'SELECT person_id::text,enabled FROM ua_private.lock_clerk_identity($1::text,$2::text)');assert.deepEqual(q.values,[who.issuer,who.userId]);assert.equal(this.local['ua.clerk_subject'],who.userId);return rows(this.mapping);}
    if(q.name==='ua_clock'||q.name==='ua_clerk_clock')return rows([{now_ms:String(clock)}]);
    if(q.name==='ua_clerk_person'){const p=initialState().people[P];assert.equal(this.local['ua.phase'],'auth');return rows([{telegram_id:String(p.telegramId),enabled:p.enabled,roles:p.profile.roles,profile:p.profile}]);}
    if(q.name==='ua_clerk_membership')return rows([{active:true,epoch:'7',revision:'0',affinity_group_id:initialState().people[P].profile.active_group_id}]);
    if(q.name==='ua_clerk_identities')return rows([{issuer:who.issuer,subject:who.userId,person_id:P,enabled:true}]);
    if(['ua_clerk_families','ua_clerk_bindings','ua_clerk_fences','ua_clerk_replays','ua_clerk_access','ua_clerk_refresh'].includes(q.name))return rows();
    if(q.text==='COMMIT'){this.local=undefined;return rows();}
    if(q.text==='ROLLBACK'){if(this.rollbackFails)throw Error('synthetic rollback uncertainty');this.local=undefined;return rows();}
    throw Error('UNEXPECTED_CONTEXT_TEST_STATEMENT:'+q.name);
  },release:discard=>this.releases.push(!!discard)};
  async connect(){this.checkouts++;return this.client;}
}

test('each BEGIN resets all six keys before auth work, on the same client and using only local parameterized values',async()=>{
  const p=new Pool(),runner=new PostgresTransactions(p);
  for(const person of [P,Q]){
    const offset=p.queries.length;
    await runner.run([person],async tx=>{
      assert.equal(tx.client,p.client);assert.equal(p.local['ua.person_id'],person);assert.equal(p.local['ua.clerk_issuer'],'');assert.equal(p.local['ua.clerk_subject'],'');assert.equal(p.local['ua.telegram_id'],'');
      await setTrustedPhase(tx.client,'domain');assert.equal(p.local['ua.phase'],'domain');
    });
    assert.equal(p.queries[offset].text,'BEGIN');assert.equal(p.queries[offset+1].name,'ua_context_reset');assert.deepEqual(p.queries[offset+1].values,empty);assert.deepEqual(p.queries[offset+2].values,['auth']);
    assert.throws(()=>requireTrustedAuth(p.client),denial);
  }
  assert.equal(p.checkouts,2);assert.deepEqual(p.releases,[false,false]);
  assert.ok(p.queries.filter(q=>q.text.includes('set_config')).every(q=>!q.text.includes('false')&&!/\bSET\b/i.test(q.text)));
  assert.deepEqual(p.session['ua.person_id'],Q); // Source never clears or sets session-wide state.
});

test('missing JS scope and premature domain/exchange transitions deny before SQL access',async()=>{
  const p=new Pool();await assert.rejects(locateStudentAccessOnClient(p.client,proof),denial);assert.equal(p.queries.length,0);
  await assert.rejects(setTrustedPhase(p.client,'domain'),denial);
  await resetTrustedServerContext(p.client);await assert.rejects(setTrustedPhase(p.client,'domain'),denial);
  await setTrustedPhase(p.client,'auth');await assert.rejects(setTrustedPhase(p.client,'exchange'),denial);
  await setTrustedPeople(p.client,[P]);await assert.rejects(setTrustedPhase(p.client,'exchange'),denial);
  closeTrustedServerContext(p.client);
});
for(const value of [[],[Q,P],[P,P],['AAAAAAAA-AAAA-4AAA-8AAA-AAAAAAAAAAAA'],[P+'\n'],[null],Array(1)])test('invalid participant scope '+JSON.stringify(value)+' denies before person-context query',async()=>{
  const p=new Pool();await resetTrustedServerContext(p.client);await setTrustedPhase(p.client,'auth');const before=p.queries.length;
  await assert.rejects(setTrustedPeople(p.client,value),denial);assert.equal(p.queries.length,before);closeTrustedServerContext(p.client);
});
for(const value of ['',proof.toUpperCase(),proof+'a','0'.repeat(63)])test('invalid locator digest '+value.slice(0,8)+' rejects before lookup',async()=>{
  const p=new Pool();await assert.rejects(locateStudentAccessOnClient(p.client,value),e=>e.status===401);assert.equal(p.queries.length,0);
});
for(const [label,hint,status] of [['absent',[],401],['duplicate',[{person_id:P},{person_id:P}],500],['invalid UUID',[{person_id:P+'\n'}],500],['extra data',[{person_id:P,digest:proof}],500]])test('locator '+label+' cannot become authority',async()=>{
  const p=new Pool();p.hint=hint;const runner=new PostgresTransactions(p);let work=0;
  await assert.rejects(runner.runPrepared({prepare:async c=>[(await locateStudentAccessOnClient(c,proof)).personId],beforeCommit(){}},async()=>{work++;}),e=>e.status===status);
  assert.equal(work,0);assert.equal(p.queries.some(q=>q.name==='ua_people_lock'),false);assert.equal(p.queries.at(-1).text,'ROLLBACK');
});
for(const lockRows of [[],[{id:Q}],[{id:P},{id:P}]])test('person helper must return the complete exact requested set '+JSON.stringify(lockRows),async()=>{
  const p=new Pool();p.lockRows=lockRows;let work=0;
  await assert.rejects(new PostgresTransactions(p).run([P],async()=>{work++;}),e=>e.status===404);assert.equal(work,0);assert.equal(p.queries.at(-1).text,'ROLLBACK');
});

for(const name of ['ua_context_reset','ua_context_phase','ua_people_context','ua_people_lock','ua_clock'])test('failure at '+name+' rolls back, closes scope, and the next pooled request resets again',async()=>{
  const p=new Pool();p.fail=name;let work=0;
  await assert.rejects(new PostgresTransactions(p).run([P],async()=>{work++;}));assert.equal(work,0);assert.equal(p.queries.at(-1).text,'ROLLBACK');assert.throws(()=>requireTrustedAuth(p.client),denial);
  p.fail=undefined;const offset=p.queries.length;await new PostgresTransactions(p).run([Q],async()=>{});assert.equal(p.queries[offset+1].name,'ua_context_reset');assert.deepEqual(p.releases,[false,false]);
});
test('rollback failure discards once; COMMIT uncertainty stays503/commit_unknown without retry',async()=>{
  const p=new Pool();p.fail='ua_people_lock';p.rollbackFails=true;await assert.rejects(new PostgresTransactions(p).run([P],async()=>{}));assert.deepEqual(p.releases,[true]);
  const q=new Pool();q.fail='ua_commit';await assert.rejects(new PostgresTransactions(q).run([P],async()=>42),e=>e instanceof StorageUnavailable&&e.status===503&&e.outcome==='commit_unknown');
  assert.equal(q.checkouts,1);assert.deepEqual(q.releases,[true]);assert.equal(q.queries.filter(s=>s.text==='COMMIT').length,1);assert.equal(q.queries.some(s=>s.text==='ROLLBACK'),false);
});
test('compatibility proof locator resets its own BEGIN and rolls back before releasing the same client',async()=>{
  const p=new Pool(),request=new Request('https://synthetic.invalid/api/v1/me',{headers:{authorization:'Bearer synthetic-proof'}});
  const result=await locateStudent(p,request,{botToken:botKey,sessionPolicy:testPolicy,now:()=>clock});assert.deepEqual(result,{kind:'person',personId:P});
  assert.equal(p.queries[0].name,'ua_locator_begin');assert.equal(p.queries[1].name,'ua_context_reset');assert.equal(p.queries.at(-1).name,'ua_locator_rollback');assert.equal(p.checkouts,1);assert.deepEqual(p.releases,[false]);
});

function clerkStore(pool,newPersonId){return new ClerkScopedAuthStore({pool,newPersonId,liveness:async identity=>{pool.providerChecks++;return{...identity,status:'active',accountEnabled:true,expiresAt:clock+20000};}});}
test('disabled mapping is not absence: no provisioning, person lock, liveness or domain work',async()=>{
  const p=new Pool();p.mapping=[{person_id:P,enabled:false}];let generated=0,work=0;
  await assert.rejects(clerkStore(p,()=>{generated++;return Q;}).run(clerkProof(),async()=>{work++;}),e=>e.code==='CLERK_IDENTITY_REVOKED');
  assert.equal(generated,0);assert.equal(work,0);assert.equal(p.providerChecks,0);assert.equal(p.queries.some(q=>q.name==='ua_clerk_person_lock'),false);assert.equal(p.queries.at(-1).text,'ROLLBACK');
});
test('authoritative absence remains distinct; source can propose a new ID but this pilot SQL grants no provisioning',async()=>{
  const p=new Pool();p.mapping=[];let generated=0;const stop=Error('synthetic no provisioning');
  await assert.rejects(clerkStore(p,()=>{generated++;return Q;}).run(clerkProof(),async input=>{assert.equal(input.personId,Q);assert.equal(input.state.person,null);assert.equal(p.local['ua.phase'],'exchange');throw stop;}),e=>e===stop);
  assert.equal(generated,1);assert.equal(p.queries.some(q=>q.name==='ua_clerk_person_lock'),false);assert.equal(p.queries.some(q=>q.text.startsWith('INSERT')),false);
});
test('Clerk proof, identity advisory lock, mapping helper, person helper and current authorization precede exchange',async()=>{
  const p=new Pool(),stop=Error('synthetic stop before issuance');
  await assert.rejects(clerkStore(p,()=>{throw Error('must not provision');}).run(clerkProof(),async()=>{assert.equal(p.local['ua.phase'],'exchange');assert.equal(p.local['ua.clerk_subject'],who.userId);throw stop;}),e=>e===stop);
  const names=p.queries.map(q=>q.name);assert.ok(names.indexOf('ua_clerk_identity_gate')<names.indexOf('ua_clerk_locate'));assert.ok(names.indexOf('ua_clerk_locate')<names.indexOf('ua_clerk_person_lock'));assert.ok(names.indexOf('ua_clerk_person_lock')<names.indexOf('ua_clerk_person'));
  assert.ok(p.queries.findIndex(q=>q.name==='ua_context_phase'&&q.values[0]==='exchange')>names.indexOf('ua_clerk_person'));assert.deepEqual(p.queries[1].values,empty);
});
for(const mapping of [[{person_id:P,enabled:'true'}],[{person_id:P,enabled:true,extra:1}],[{person_id:P,enabled:true},{person_id:Q,enabled:true}]])test('malformed mapping helper output denies before allocation '+JSON.stringify(mapping),async()=>{
  const p=new Pool();p.mapping=mapping;let generated=0;await assert.rejects(clerkStore(p,()=>{generated++;return Q;}).run(clerkProof(),async()=>{}),e=>e.status===500);assert.equal(generated,0);assert.equal(p.providerChecks,0);
});

async function seeded(){
  const pool=new MemoryPool(),family=crypto.randomUUID(),token='synthetic-context-proof';pool.state.families[family]={personId:P,expiresAt:clock+60000,revokedAt:null,logoutRetainUntil:null,authProvider:'telegram'};
  pool.state.access[await proofHash(token)]={familyId:family,expiresAt:clock+15000,superseded:false};
  const handler=createConfiguredHttpHandler({mode:'local_contract',storage:{kind:'postgres_contract_double',pool},botToken:botKey,sessionPolicy:testPolicy,numericPresentation:testNumbers,now:()=>pool.now});
  return{pool,token,send:headers=>handler(new Request('https://synthetic.invalid/api/v1/exams',{headers:{authorization:'Bearer '+token,...headers}}))};
}
test('client identity/phase headers cannot override the authoritative person hint; domain follows locks and authentication reads',async()=>{
  const f=await seeded();assert.equal((await f.send({'x-person-id':Q,'ua.person_id':Q,'ua.phase':'domain','trusted':'true'})).status,200);
  const events=f.pool.events,lock=events.findIndex(e=>e.name==='ua_people_lock'),auth=events.findIndex(e=>e.name==='ua_http_access'),phase=events.findIndex(e=>e.name==='ua_context_phase'&&e.values[0]==='domain'),domain=events.findIndex(e=>e.name==='ua_http_grants');
  assert.deepEqual(events[lock].values,[[P]]);assert.ok(lock<auth&&auth<phase&&phase<domain);
  assert.deepEqual(events.find(e=>e.name==='ua_people_context').values,[P,JSON.stringify([P])]);
});
test('failed current authorization never enters domain or reads private assignments',async()=>{
  const f=await seeded();f.pool.before=s=>{Object.values(s.families)[0].revokedAt=clock;};assert.equal((await f.send()).status,401);
  assert.equal(f.pool.events.some(e=>e.name==='ua_context_phase'&&e.values[0]==='domain'),false);assert.equal(f.pool.events.some(e=>e.name==='ua_http_grants'),false);
});
test('expiry at the domain-phase statement still denies before the first private domain read',async()=>{
  const f=await seeded();for(const access of Object.values(f.pool.state.access))access.expiresAt=clock+1;
  f.pool.onStatement=name=>{if(name==='ua_context_phase'&&f.pool.events.at(-1).values[0]==='domain')f.pool.now=clock+1;};
  assert.equal((await f.send()).status,401);assert.equal(f.pool.events.some(e=>e.name==='ua_http_grants'),false);assert.equal(f.pool.events.some(e=>e.name==='ua_commit'),false);
});

test('inactive SQL text retains guard/rollback, exact three helpers, locked NOLOGIN owners and complete invariant-read scope',async()=>{
  const sql=await readFile(new URL('../../../../review/first-student-trusted-server.activation.review.sql',import.meta.url),'utf8');
  assert.ok(sql.indexOf("RAISE EXCEPTION 'REVIEW_ONLY_")<sql.indexOf('\nBEGIN;'));assert.ok(sql.trimEnd().endsWith('ROLLBACK;'));
  assert.equal((sql.match(/CREATE FUNCTION ua_private\./g)||[]).length,3);assert.equal((sql.match(/CREATE ROLE .*NOLOGIN NOINHERIT .*NOBYPASSRLS;/g)||[]).length,4);
  for(const name of ['locate_student_access','lock_people','lock_clerk_identity'])assert.ok(sql.includes('CREATE FUNCTION ua_private.'+name+'('));
  assert.ok(!/CREATE EXTENSION|CREATE ROLE[^;]*\sLOGIN\s|GRANT ALL|GRANT[^;]* TO (?:PUBLIC|anon|authenticated|service_role)/.test(sql));
  assert.ok(!/GRANT (?:INSERT|UPDATE)[^;]* ON ua_private\.(?:people|clerk_identities) TO ua_runtime/.test(sql));
  for(const table of ['people','memberships','student_families','clerk_family_bindings','student_access','attempts','assignments','ordinary_results','exam_series'])assert.ok(sql.includes(`GRANT SELECT ON ua_private.${table} TO ua_invariant_owner;`));
  assert.equal((sql.match(/ALTER FUNCTION ua_private\.check_\w+\(\) SECURITY DEFINER;/g)||[]).length,6);
  const locator=sql.slice(sql.indexOf('CREATE FUNCTION ua_private.locate_student_access'),sql.indexOf('ALTER FUNCTION ua_private.locate_student_access'));
  assert.ok(!/expires_at|revoked_at|superseded|enabled\s*=/.test(locator.slice(locator.indexOf('RETURN QUERY'))));
});
