// Real HTTP/pg integration harness; NOT EXECUTED during preparation.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {seed,tokens,localPolicy} from './seed.mjs';

const [descriptorPath]=process.argv.slice(2);assert.ok(descriptorPath&&process.argv.length===3);
const d=JSON.parse(await readFile(descriptorPath,'utf8'));
assert.equal(d.kind,'APPROVED_DISPOSABLE_LOCAL_FLOW01');
assert.equal(d.database,'ua_flow01');assert.equal(d.runtimeUser,'ua_flow_client');
assert.equal(d.adminUser,'ua_flow_admin');assert.equal(d.host,join(d.root,'socket'));
assert.equal(d.port,55473);assert.equal(d.source,resolve(d.source));
assert.ok(!Reflect.ownKeys(process.env).some(k=>typeof k==='string'&&/^PG/i.test(k)));
const require=createRequire(join(d.dependencies,'package.json'));
assert.equal(require('pg/package.json').version,'8.16.3');
const {Pool,Client}=require('pg');
const sourceImport=p=>import(pathToFileURL(join(d.source,p)).href);
const [{startConfiguredServer},{transactionPoolPort},{PostgresTransactions},{setTrustedPhase}]=await Promise.all([
  sourceImport('runtime/configured-server.mjs'),
  sourceImport('supabase/functions/univeracademy-api/storage/transaction-pool-port.ts'),
  sourceImport('supabase/functions/univeracademy-api/storage/postgres-transaction.ts'),
  sourceImport('supabase/functions/univeracademy-api/storage/trusted-server-context.ts'),
]);
const common={host:d.host,port:d.port,database:d.database,password:'LOCAL_PEER_ONLY_UNUSED',ssl:false,connectionTimeoutMillis:5000,statement_timeout:5000,query_timeout:6000,application_name:'ua_flow01_synthetic'};
const events=[],http=[],witnesses=[];let requestTag='setup',sequence=0,driver,server,seeded,closed=false;
const sha=s=>createHash('sha256').update(s).digest('hex');
const six="SELECT current_setting('ua.phase',true) AS phase,current_setting('ua.person_id',true) AS person,current_setting('ua.person_ids',true) AS people,current_setting('ua.clerk_issuer',true) AS issuer,current_setting('ua.clerk_subject',true) AS subject,current_setting('ua.telegram_id',true) AS telegram";
const expectedReset={phase:'deny',person:'',people:'[]',issuer:'',subject:'',telegram:''};
const rawPort=()=>transactionPoolPort(driver);
const pool={async connect(){
  const c=await rawPort().connect(),id=++sequence,tag=requestTag;let released=false;
  return {async query(q){
    assert.ok(events.length<8192,'EVENT_LIMIT');
    events.push({kind:'query',id,tag,name:q.name,sql_sha256:sha(q.text)});
    const r=await c.query(q);
    if(q.name==='ua_context_reset') {
      const observed=(await c.query({name:'local_reset_witness',text:six,values:[]})).rows;
      assert.deepEqual(observed,[expectedReset]);witnesses.push({kind:'six_key_deny_reset',id,tag,observed:observed[0]});
    }
    if(tag==='expiry-save'&&q.name==='ua_answer_cas') {
      const wait=seeded.expiry-Date.now()+20;
      assert.ok(wait>0&&wait<=12020,'FINAL_EXPIRY_CONTROL_NOT_REACHED');
      witnesses.push({kind:'real_post_write_expiry_wait',wait_ms:wait});
      await new Promise(r=>setTimeout(r,wait)); // Normal time progression, no fake SQL/clock.
    }
    return r;
  },release(discard){assert.equal(released,false);released=true;events.push({kind:'release',id,tag,discard:!!discard});c.release(discard);}};
}};
async function db(person,work) {
  return new PostgresTransactions(pool).run([person],async tx=>{await setTrustedPhase(tx.client,'domain');return work(tx.client);});
}
const query=(c,text,values=[])=>c.query({name:'local_db_assertion',text,values});
async function state(person,attempt) {
  return db(person,async c=>(await query(c,"SELECT (SELECT count(*)::text FROM ua_private.answers WHERE attempt_id=$1) AS answers,(SELECT revision::text FROM ua_private.answers WHERE attempt_id=$1 AND question_id=$2) AS revision,(SELECT state_revision::text FROM ua_private.attempts WHERE id=$1) AS state_revision,(SELECT count(*)::text FROM ua_private.command_receipts) AS receipts",[attempt,seeded.ids.question])).rows[0]);
}
async function call(tag,method,path,token,body,key) {
  requestTag=tag;const started=Date.now();
  const response=await fetch(server.baseUrl+path,{method,headers:{authorization:'Bearer '+token,...(body===undefined?{}:{'content-type':'application/json'}),...(key?{'idempotency-key':key}:{})},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(tag==='expiry-save'?16000:10000),redirect:'error'});
  const raw=await response.text();assert.ok(Buffer.byteLength(raw)<=65536,'HTTP_OUTPUT_LIMIT');
  const parsed=JSON.parse(raw);http.push({tag,method,path,status:response.status,elapsed_ms:Date.now()-started,response_sha256:sha(raw)});
  assert.match(response.headers.get('cache-control')??'',/no-store/);
  return {status:response.status,...parsed};
}
async function closeApplication(){if(closed)return;closed=true;if(server)await server.close();if(driver)await driver.end();}
try {
  // Superuser used for seed/setup only. No admin connection enters the HTTP ports.
  const admin=new Client({...common,user:d.adminUser});await admin.connect();
  try {
    const who=await admin.query('SELECT current_user,rolsuper FROM pg_catalog.pg_roles WHERE rolname=current_user');
    assert.deepEqual(who.rows,[{current_user:d.adminUser,rolsuper:true}]);
    seeded=await seed(admin,d.source);
  } finally {await admin.end();}
  driver=new Pool({...common,user:d.runtimeUser,max:1,min:0,idleTimeoutMillis:10000});
  driver.on('error',()=>{throw Error('LOCAL_RUNTIME_POOL_UNAVAILABLE');});
  let c=await driver.connect();
  try {
    const r=await c.query("SELECT current_user,session_user,r.rolsuper,r.rolbypassrls,r.rolcreaterole,r.rolcreatedb,pg_has_role(current_user,'ua_owner','MEMBER') AS owner_member,pg_has_role(current_user,'ua_runtime','USAGE') AS runtime_usage,has_schema_privilege(current_user,'ua_private','CREATE') AS schema_create FROM pg_catalog.pg_roles r WHERE r.rolname=current_user");
    assert.deepEqual(r.rows,[{current_user:d.runtimeUser,session_user:d.runtimeUser,rolsuper:false,rolbypassrls:false,rolcreaterole:false,rolcreatedb:false,owner_member:false,runtime_usage:true,schema_create:false}]);
    witnesses.push({kind:'actual_runtime_role',...r.rows[0]});
    const tables=await c.query("SELECT count(*)::text AS tables,bool_and(c.relrowsecurity AND c.relforcerowsecurity) AS all_force_rls,bool_and(c.relowner<>(SELECT oid FROM pg_catalog.pg_roles WHERE rolname=current_user)) AS all_nonowned FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='ua_private' AND c.relkind='r'");
    assert.deepEqual(tables.rows,[{tables:'30',all_force_rls:true,all_nonowned:true}]);witnesses.push({kind:'runtime_table_rls_ownership',...tables.rows[0]});
    // Deliberately dirty this PRIVATE synthetic connection's session defaults.
    // SET LOCAL must override these before any helper/read on each transaction.
    await c.query("SELECT set_config('ua.phase',$1,false),set_config('ua.person_id',$2,false),set_config('ua.person_ids',$3,false),set_config('ua.clerk_issuer',$4,false),set_config('ua.clerk_subject',$5,false),set_config('ua.telegram_id',$6,false)",['domain',seeded.ids.other,JSON.stringify([seeded.ids.other]),'https://old.synthetic.invalid','user_OldSynthetic','4000000002']);
  } finally {c.release();}
  server=await startConfiguredServer({config:{mode:'production',storage:{kind:'postgres',pool},botToken:seeded.botKey,sessionPolicy:localPolicy,numericPresentation:seeded.testNumbers,now:Date.now},port:0,allowedOrigins:[]});
  assert.equal(new URL(server.baseUrl).hostname,'127.0.0.1');
  for(const path of ['/me','/exams',`/exams/${seeded.ids.assignment}`])assert.equal((await call('A-read','GET',path,tokens.A)).status,200);
  assert.equal((await call('B-own','GET','/me',tokens.B)).status,200);
  const start=await call('start','POST',`/exams/${seeded.ids.assignment}/attempts`,tokens.A,{confirmed:true},'local-start-flow01');assert.equal(start.status,200);
  const attempt=start.data.id;assert.match(attempt,/^[0-9a-f-]{36}$/);
  const path=`/attempts/${attempt}/answers/${seeded.ids.question}`;
  const first=await call('save-insert','PUT',path,tokens.A,{selected_option_id:seeded.ids.wrong,expected_revision:0});assert.equal(first.status,200);assert.equal(first.data.revision,1);
  const second=await call('save-update','PUT',path,tokens.A,{selected_option_id:seeded.ids.correct,expected_revision:1});assert.equal(second.status,200);assert.equal(second.data.revision,2);
  requestTag='db-before-stale';const before=await state(seeded.ids.person,attempt);assert.equal(before.answers,'1');assert.equal(before.revision,'2');
  const stale=await call('stale','PUT',path,tokens.A,{selected_option_id:seeded.ids.wrong,expected_revision:1});assert.equal(stale.status,409);assert.equal(stale.error.code,'REVISION_CONFLICT');
  requestTag='db-after-stale';assert.deepEqual(await state(seeded.ids.person,attempt),before);
  // One real write is made then rolled back when the short proof expires before
  // final authorization. A pre-expired entry denial cannot satisfy this control.
  const expiryStart=events.length;
  const expired=await call('expiry-save','PUT',path,tokens.expiry,{selected_option_id:seeded.ids.wrong,expected_revision:2});assert.equal(expired.status,401);assert.equal(expired.error.code,'APP_SESSION_EXPIRED');
  const expiryEvents=events.slice(expiryStart);assert.ok(expiryEvents.some(e=>e.name==='ua_answer_cas'));assert.ok(expiryEvents.some(e=>e.name==='ua_rollback'));assert.ok(!expiryEvents.some(e=>e.name==='ua_commit'));
  requestTag='db-after-expiry';assert.deepEqual(await state(seeded.ids.person,attempt),before);
  for(const [method,p,b] of [['GET',`/attempts/${attempt}`],['GET',`/attempts/${attempt}/result`],['PUT',path,{selected_option_id:seeded.ids.correct,expected_revision:0}],['POST',`/attempts/${attempt}/submit`]])assert.equal((await call('B-cross',method,p,tokens.B,b,'local-cross-flow01')).status,404);
  requestTag='db-cross-person';
  const denial=await db(seeded.ids.other,async c=>(await query(c,"SELECT (SELECT count(*) FROM ua_private.attempts WHERE id=$1)::text AS attempts,(SELECT count(*) FROM ua_private.answers WHERE attempt_id=$1)::text AS answers,(SELECT count(*) FROM ua_private.people WHERE id=$2)::text AS people",[attempt,seeded.ids.person])).rows[0]);
  assert.deepEqual(denial,{attempts:'0',answers:'0',people:'0'});witnesses.push({kind:'DB_cross_person_denial',...denial});
  const resumed=await call('resume','GET',`/attempts/${attempt}`,tokens.A);assert.equal(resumed.status,200);assert.equal(resumed.data.deadline_at,start.data.deadline_at);assert.equal(resumed.data.generation,start.data.generation);
  const submitted=await call('submit','POST',`/attempts/${attempt}/submit`,tokens.A,undefined,'local-submit-flow01');assert.equal(submitted.status,200);assert.ok(submitted.data.ordinary);
  const result=await call('result','GET',`/attempts/${attempt}/result`,tokens.A);assert.equal(result.status,200);assert.deepEqual(result.data,submitted.data);
  const replay=await call('submit-replay','POST',`/attempts/${attempt}/submit`,tokens.A,undefined,'local-submit-flow01');assert.equal(replay.status,200);assert.deepEqual(replay.data,submitted.data);
  for(const e of events.filter(e=>e.kind==='query'&&e.name==='ua_locate_access')) {
    const prior=events.filter(x=>x.kind==='query'&&x.id===e.id);assert.equal(prior[0].name,'ua_begin');assert.equal(prior[1].name,'ua_context_reset');assert.ok(witnesses.some(w=>w.kind==='six_key_deny_reset'&&w.id===e.id));
  }
  assert.equal(events.filter(e=>e.tag==='save-insert'&&e.name==='ua_answer_cas').length,1);
  assert.equal(events.filter(e=>e.tag==='save-update'&&e.name==='ua_answer_cas').length,1);
  await closeApplication();
  // New physical connection after the HTTP server and original pool are closed.
  driver=new Pool({...common,user:d.runtimeUser,max:1,min:0,idleTimeoutMillis:10000});closed=false;server=undefined;
  driver.on('error',()=>{throw Error('LOCAL_READBACK_POOL_UNAVAILABLE');});requestTag='fresh-committed-readback';
  const durable=await db(seeded.ids.person,async c=>(await query(c,"SELECT a.body->>'status' AS status,a.state_revision::text,(SELECT count(*)::text FROM ua_private.answers x WHERE x.attempt_id=a.id) AS answer_count,(SELECT revision::text FROM ua_private.answers x WHERE x.attempt_id=a.id AND x.question_id=$2) AS answer_revision,(SELECT selected_option_id::text FROM ua_private.answers x WHERE x.attempt_id=a.id AND x.question_id=$2) AS selected_option,(SELECT exact_result FROM ua_private.ordinary_results r WHERE r.attempt_id=a.id) AS exact_result,(SELECT count(*)::text FROM ua_private.command_receipts) AS receipt_count FROM ua_private.attempts a WHERE a.id=$1",[attempt,seeded.ids.question])).rows);
  assert.equal(durable.length,1);const v=durable[0];assert.equal(v.status,'submitted');assert.equal(v.state_revision,'3');assert.equal(v.answer_count,'1');assert.equal(v.answer_revision,'2');assert.equal(v.selected_option,seeded.ids.correct);assert.equal(v.receipt_count,'2');
  assert.deepEqual(v.exact_result.earned,{numerator:'1',denominator:'1'});assert.deepEqual(v.exact_result.maximum,{numerator:'2',denominator:'1'});assert.deepEqual(v.exact_result.percentage,{numerator:'50',denominator:'1'});assert.ok(Number.isSafeInteger(v.exact_result.calculatedAt));
  witnesses.push({kind:'fresh_connection_committed_readback',...v});
  const report={status:'LOCAL_HTTP_PG_FLOW_PASS_ONLY',runtime_readiness:false,fixture_rows_before:14,fixture_counts:seeded.initialCounts,http,witnesses,events,limits:{concurrency:1,pool_max:1},NOT_RUN:['Clerk/Telegram login','Cloudflare/Hyperdrive','production TLS factory','primary Supabase','commit fault injection','crash/fault durability','concurrency/load']};
  await closeApplication();
  const data=JSON.stringify(report,null,2)+'\n';assert.ok(Buffer.byteLength(data)<1048576);await writeFile(d.output,data,{flag:'wx',mode:0o400});
  console.log(JSON.stringify({status:report.status,http_calls:http.length,reset_witnesses:witnesses.filter(w=>w.kind==='six_key_deny_reset').length,evidence_sha256:sha(data)}));
} finally {await closeApplication();}
