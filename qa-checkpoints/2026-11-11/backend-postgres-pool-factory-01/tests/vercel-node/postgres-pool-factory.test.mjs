import {test} from "node:test";
import assert from "node:assert/strict";
import {EventEmitter} from "node:events";
import {rootCertificates} from "node:tls";
import net from "node:net";
import tls from "node:tls";
import dns from "node:dns";
import {readFile} from "node:fs/promises";
import {createPostgresPool} from "../../runtime/postgres-pool-factory.mjs";
import {PostgresTransactions} from "../../supabase/functions/univeracademy-api/storage/postgres-transaction.ts";

// Inert driver double: no driver package, sockets, environment or credentials.
const person="00000000-0000-4000-8000-000000000001";
function driverDouble(behavior={}) {
  const state={constructed:0,connects:0,ends:0,queries:[],releases:[],instance:undefined,options:undefined};
  class Pool extends EventEmitter {
    constructor(options) {
      super();state.constructed++;state.options=options;state.instance=this;
      if(behavior.constructError)throw behavior.constructError;
    }
    async connect() {
      state.connects++;
      if(behavior.connect) return behavior.connect();
      if(behavior.connectError) throw behavior.connectError;
      return {
        async query(statement) {
          state.queries.push(statement);
          if(behavior.query) return behavior.query(statement);
          if(statement.text.includes("ORDER BY id FOR UPDATE"))return{rows:[{id:person}],rowCount:1};
          if(statement.text.includes("clock_timestamp()"))return{rows:[{now_ms:"10000"}],rowCount:1};
          return{rows:[],rowCount:0};
        },
        release(discard) {state.releases.push(discard);if(behavior.releaseError)throw behavior.releaseError;},
      };
    }
    end() {state.ends++;if(behavior.end) return behavior.end();return Promise.resolve();}
  }
  return{Pool,state};
}

function unavailable(error,outcome="not_committed") {
  assert.equal(error.code,"SERVICE_UNAVAILABLE");assert.equal(error.status,503);
  assert.equal(error.outcome,outcome);assert.equal(error.cause,undefined);
  assert.equal(error.message,"SERVICE_UNAVAILABLE");return true;
}

// Public CA from this installed Node's bundled roots, only for inert options.
// It is not deployment CA approval or evidence of a TLS handshake.
const ca=rootCertificates[0];
const options=()=>({host:"db.synthetic.invalid",port:5432,database:"synthetic_db",
  user:"synthetic_runtime",password:" synthetic-secret-canary Case-Sensitive ",ca});
function namesOnly(names,work) {
  const original=Object.getOwnPropertyDescriptor(process,"env");
  let enumerations=0;
  const env=new Proxy(Object.create(null),{
    ownKeys(){enumerations++;return names;},
    get(){throw Error("environment value read is forbidden");},
    getOwnPropertyDescriptor(){throw Error("environment descriptor/value read is forbidden");},
    set(){throw Error("environment mutation is forbidden");},
    deleteProperty(){throw Error("environment clearing is forbidden");},
  });
  Object.defineProperty(process,"env",{value:env,configurable:true,writable:true,enumerable:true});
  try{return work(()=>enumerations);}finally{Object.defineProperty(process,"env",original);}
}
const make=(Pool,value=options())=>namesOnly([],()=>createPostgresPool(Pool,value));

test("private lazy constructor receives exact verified TLS options, cap1/min0 and finite fixed waits",async()=>{
  const {Pool,state}=driverDouble(),input=options();
  const resource=make(Pool,input);
  assert.deepEqual(state.options,{host:input.host,port:5432,database:input.database,user:input.user,password:input.password,
    ssl:{ca,rejectUnauthorized:true},max:1,min:0,connectionTimeoutMillis:5000,idleTimeoutMillis:10000});
  assert.equal(state.constructed,1);assert.equal(state.connects,0);assert.equal(state.ends,0);
  assert.notEqual(state.options,input);input.host="changed.invalid";input.ca="changed";input.password="changed";
  assert.equal(state.options.host,"db.synthetic.invalid");assert.equal(state.options.ssl.ca,ca);
  assert.ok(Object.isFrozen(resource));assert.ok(Object.isFrozen(resource.pool));
  assert.deepEqual(Object.keys(resource).sort(),["close","pool"]);assert.deepEqual(Object.keys(resource.pool),["connect"]);
  assert.equal(JSON.stringify(resource),'{"pool":{}}');
  await resource.close();assert.equal(state.ends,1);
});

for(const field of ["host","port","database","user","password","ca"])test(`missing ${field} is rejected before driver construction`,()=>{
  const {Pool,state}=driverDouble(),input=options();delete input[field];
  assert.throws(()=>make(Pool,input),unavailable);assert.equal(state.constructed,0);
});
for(const [label,value] of [["null",null],["undefined",undefined],["string","postgres://synthetic.invalid"],["array",[]],["promise",Promise.resolve({})],["date",new Date(0)]])
  test(`non-data configuration ${label} is rejected without fallback`,()=>{
    const {Pool,state}=driverDouble();assert.throws(()=>namesOnly([],()=>createPostgresPool(Pool,value)),unavailable);assert.equal(state.constructed,0);
  });
for(const field of ["host","database","user","password","ca"])for(const [label,value] of [["empty",""],["blank"," \t\n "],["null",null],["number",1],["callback",()=>"never"]])
  test(`${field} rejects ${label}`,()=>{
    const {Pool,state}=driverDouble();assert.throws(()=>make(Pool,{...options(),[field]:value}),unavailable);assert.equal(state.constructed,0);
  });
for(const value of [0,-1,65536,1.5,NaN,Infinity,"5432",true,null])test(`port rejects ${String(value)}`,()=>{
  const {Pool,state}=driverDouble();assert.throws(()=>make(Pool,{...options(),port:value}),unavailable);assert.equal(state.constructed,0);
});
for(const host of ["/tmp/socket","postgres://synthetic.invalid","127.0.0.1","::1","db.invalid/path","db.invalid:5432"," db.invalid","db.invalid\n","-db.invalid","db..invalid","db.invalid."])
  test(`host shape ${JSON.stringify(host)} cannot bypass explicit DNS/TLS identity`,()=>{
    const {Pool,state}=driverDouble();assert.throws(()=>make(Pool,{...options(),host}),unavailable);assert.equal(state.constructed,0);
  });
for(const key of ["connectionString","ssl","sslmode","sslcert","sslrootcert","servername","checkServerIdentity","stream","lookup","Client","Promise","log","onConnect","max","min","poolSize","connectionTimeoutMillis","idleTimeoutMillis","query_timeout","pipeline","options"])
  test(`unknown option ${key} is rejected before construction`,()=>{
    const {Pool,state}=driverDouble();assert.throws(()=>make(Pool,{...options(),[key]:()=>{throw Error("must not call");}}),unavailable);assert.equal(state.constructed,0);
  });

test("getters, symbols, custom prototypes, proxies and constructor proxies are not evaluated",()=>{
  let effects=0;
  for(const key of ["host","ssl","connectionString","then"]) {
    const {Pool,state}=driverDouble(),input=options();
    Object.defineProperty(input,key,{get(){effects++;throw Error("must not evaluate");}});
    assert.throws(()=>make(Pool,input),unavailable);assert.equal(state.constructed,0);
  }
  for(const input of [Object.assign(Object.create({ssl:false}),options()),{...options(),[Symbol("private")]:true},
    new Proxy(options(),{ownKeys(){effects++;throw Error("must not trap");},get(){effects++;throw Error("must not trap");},getPrototypeOf(){effects++;throw Error("must not trap");}})]) {
    const {Pool,state}=driverDouble();assert.throws(()=>make(Pool,input),unavailable);assert.equal(state.constructed,0);
  }
  const {Pool,state}=driverDouble();
  assert.throws(()=>make(new Proxy(Pool,{construct(){effects++;throw Error("must not trap");}})),unavailable);
  assert.equal(state.constructed,0);assert.equal(effects,0);
});

test("CA must be parseable PEM certificates without extra configuration or paths",async()=>{
  for(const bad of ["/private/ca.pem","synthetic-not-pem","-----BEGIN CERTIFICATE-----\nAA==\n-----END CERTIFICATE-----",`${ca}\nsslmode=no-verify`,Buffer.from(ca),[ca]]) {
    const {Pool,state}=driverDouble();assert.throws(()=>make(Pool,{...options(),ca:bad}),unavailable);assert.equal(state.constructed,0);
  }
  const {Pool,state}=driverDouble(),bundle=`${ca}\n${rootCertificates[1]}`;
  const resource=make(Pool,{...options(),ca:bundle});assert.equal(state.options.ssl.ca,bundle);await resource.close();
});

for(const name of ["PGHOST","PGPORT","PGDATABASE","PGUSER","PGPASSWORD","PGOPTIONS","PGSSLMODE","PGCONNECT_TIMEOUT","PGUNKNOWN"])
  test(`ambient ${name} NAME blocks construction without reading any value`,()=>{
    const {Pool,state}=driverDouble();
    namesOnly([name],enumerations=>{assert.throws(()=>createPostgresPool(Pool,options()),unavailable);assert.equal(enumerations(),1);});
    assert.equal(state.constructed,0);
  });
test("non-PG environment NAMES are enumerated without evaluating their values",async()=>{
  const {Pool,state}=driverDouble();
  const resource=namesOnly(["SYNTHETIC_UNREAD_CANARY","NODE_ENV"],enumerations=>{
    const result=createPostgresPool(Pool,options());assert.equal(enumerations(),1);return result;
  });
  assert.equal(state.constructed,1);await resource.close();
});
test("an empty ambient PG value still denies; no property value is evaluated",()=>{
  const original=Object.getOwnPropertyDescriptor(process,"env"),{Pool,state}=driverDouble();let reads=0;
  const env={PGOPTIONS:""};Object.defineProperty(env,"PGPASSWORD",{enumerable:true,get(){reads++;throw Error("do not read");}});
  Object.defineProperty(process,"env",{value:env,configurable:true,writable:true,enumerable:true});
  try{assert.throws(()=>createPostgresPool(Pool,options()),unavailable);assert.equal(state.constructed,0);assert.equal(reads,0);}
  finally{Object.defineProperty(process,"env",original);}
});

test("constructor exceptions and non-constructors produce only a sanitized503",()=>{
  const secret=Error("synthetic-secret-canary db.synthetic.invalid private config");
  const {Pool,state}=driverDouble({constructError:secret});
  assert.throws(()=>make(Pool),error=>error!==secret&&unavailable(error));assert.equal(state.constructed,1);assert.equal(state.connects,0);assert.equal(state.ends,0);
  for(const ctor of [undefined,null,{},()=>({})])assert.throws(()=>make(ctor),unavailable);
});

test("malformed constructed pools dispose once where possible; no connection fallback",async()=>{
  for(const key of ["connect","on"]) {
    let ends=0;
    class Bad {constructor(){this[key]=undefined;}connect(){throw Error("must not call");}on(){}end(){ends++;return Promise.resolve();}}
    assert.throws(()=>make(Bad),unavailable);await Promise.resolve();await Promise.resolve();assert.equal(ends,1);
  }
  let connects=0;
  class MissingEnd {on(){}connect(){connects++;}}
  assert.throws(()=>make(MissingEnd),unavailable);assert.equal(connects,0);
  let ends=0;
  class BadListener {connect(){throw Error("must not call");}on(){throw Error("synthetic secret");}end(){ends++;return Promise.reject(Error("synthetic cleanup secret"));}}
  assert.throws(()=>make(BadListener),unavailable);await new Promise(resolve=>setImmediate(resolve));assert.equal(ends,1);
});

test("factory owns idle-error listener for its lifetime and latches new acquisitions closed",async()=>{
  const {Pool,state}=driverDouble(),resource=make(Pool);
  assert.equal(state.instance.listenerCount("error"),1);
  const unread=new Proxy({},{get(){throw Error("driver error must not be inspected");}});
  assert.doesNotThrow(()=>state.instance.emit("error",unread,unread));
  await assert.rejects(resource.pool.connect(),unavailable);await assert.rejects(resource.pool.connect(),unavailable);
  assert.equal(state.connects,0);assert.equal(state.constructed,1);assert.equal(state.ends,0);
  await resource.close();assert.equal(state.ends,1);assert.equal(state.instance.listenerCount("error"),1);
  assert.doesNotThrow(()=>state.instance.emit("error",unread));
});

test("acquisition failure is sanitized and does not retry or build another pool",async()=>{
  const {Pool,state}=driverDouble({connectError:Error("synthetic password and host")}),resource=make(Pool);
  await assert.rejects(resource.pool.connect(),unavailable);assert.equal(state.connects,1);assert.equal(state.constructed,1);assert.deepEqual(state.releases,[]);
  await resource.close();
});

test("transaction-port compatibility preserves parameters, statement-name stripping, commit and one release",async()=>{
  const {Pool,state}=driverDouble(),resource=make(Pool),payload="synthetic '; no SQL execution --";
  const value=await new PostgresTransactions(resource.pool).run([person],async tx=>{
    await tx.client.query({name:"internal_only",text:"SELECT $1::text",values:[payload]});return"ACK";
  });
  assert.equal(value,"ACK");assert.equal(state.connects,1);assert.deepEqual(state.releases,[false]);
  assert.equal(state.queries[0].text,"BEGIN");assert.equal(state.queries.at(-1).text,"COMMIT");
  assert.ok(state.queries.every(q=>Object.keys(q).sort().join(",")==="text,values"));
  assert.deepEqual(state.queries.find(q=>q.text==="SELECT $1::text").values,[payload]);
  assert.ok(state.queries.every(q=>!q.text.includes(payload)));await resource.close();
});

test("COMMIT failure stays commit_unknown503, discards once and never retries/ACKs",async()=>{
  const {Pool,state}=driverDouble({query:async q=>{
    if(q.text==="COMMIT")throw Error("synthetic private driver exception");
    if(q.text.includes("FOR UPDATE"))return{rows:[{id:person}],rowCount:1};
    if(q.text.includes("clock_timestamp"))return{rows:[{now_ms:"10000"}],rowCount:1};
    return{rows:[],rowCount:0};
  }}),resource=make(Pool);
  await assert.rejects(new PostgresTransactions(resource.pool).run([person],async()=>"must not ACK"),e=>unavailable(e,"commit_unknown"));
  assert.equal(state.connects,1);assert.equal(state.queries.filter(q=>q.text==="COMMIT").length,1);
  assert.ok(!state.queries.some(q=>q.text==="ROLLBACK"));assert.deepEqual(state.releases,[true]);await resource.close();
});

test("checked-out work retains callback and final-commit guard semantics after an idle error",async()=>{
  const {Pool,state}=driverDouble(),resource=make(Pool),runner=new PostgresTransactions(resource.pool);
  assert.equal(await runner.run([person],async()=>{state.instance.emit("error",Error("synthetic idle failure"));return"normal commit";}),"normal commit");
  assert.deepEqual(state.releases,[false]);assert.equal(state.queries.at(-1).text,"COMMIT");
  await assert.rejects(resource.pool.connect(),unavailable);await resource.close();
  const b=driverDouble(),other=make(b.Pool),fault=Error("synthetic revoked guard");
  await assert.rejects(new PostgresTransactions(other.pool).runPrepared({prepare:async()=>[person],beforeCommit(){throw fault;}},async()=>"no ACK"),e=>e===fault);
  assert.equal(b.state.queries.at(-1).text,"ROLLBACK");assert.ok(!b.state.queries.some(q=>q.text==="COMMIT"));assert.deepEqual(b.state.releases,[false]);await other.close();
});

test("close immediately blocks acquisitions and caches one successful end promise",async()=>{
  let finish;
  const {Pool,state}=driverDouble({end:()=>new Promise(resolve=>{finish=resolve;})}),resource=make(Pool);
  const first=resource.close();assert.equal(resource.close(),first);
  await assert.rejects(resource.pool.connect(),unavailable);assert.equal(state.connects,0);assert.equal(state.ends,1);
  let settled=false;first.then(()=>{settled=true;});await Promise.resolve();assert.equal(settled,false);
  finish();await first;assert.equal(settled,true);assert.equal(resource.close(),first);assert.equal(state.ends,1);
});

for(const kind of ["throw","reject"])test(`close ${kind} remains the same rejected safe outcome, without retry`,async()=>{
  const {Pool,state}=driverDouble({end(){if(kind==="throw")throw Error("synthetic close secret");return Promise.reject(Error("synthetic close secret"));}}),resource=make(Pool);
  const first=resource.close(),error=await first.catch(e=>e);
  assert.equal(error.status,503);assert.equal(error.code,"SERVICE_UNAVAILABLE");assert.equal(error.message,"SERVICE_UNAVAILABLE");assert.equal(error.cause,undefined);
  assert.equal(error.outcome,undefined);assert.equal(resource.close(),first);assert.equal(await resource.close().catch(e=>e),error);
  await assert.rejects(resource.pool.connect(),unavailable);assert.equal(state.ends,1);assert.equal(state.connects,0);
});
test("an unconfirmed non-Promise end result cannot be reported as successful closure",async()=>{
  let reads=0;const thenable={get then(){reads++;throw Error("not a pg end promise");}};
  for(const result of [undefined,true,thenable]) {
    const {Pool,state}=driverDouble({end:()=>result}),resource=make(Pool),first=resource.close();
    await assert.rejects(first,e=>e.status===503&&e.code==="SERVICE_UNAVAILABLE");
    assert.equal(resource.close(),first);assert.equal(state.ends,1);
  }
  assert.equal(reads,0);
});

for(const reason of ["close","idle error"])test(`late acquisition after ${reason} is discarded once and never escapes`,async()=>{
  let finish;const releases=[],queries=[];
  const {Pool,state}=driverDouble({connect:()=>new Promise(resolve=>{finish=resolve;})}),resource=make(Pool);
  const pending=resource.pool.connect();
  if(reason==="close")await resource.close();else state.instance.emit("error",Error("synthetic idle error"));
  finish({query:async q=>{queries.push(q);},release:d=>{releases.push(d);}});
  await assert.rejects(pending,unavailable);assert.deepEqual(releases,[true]);assert.deepEqual(queries,[]);assert.equal(state.connects,1);
  await resource.close();assert.equal(state.ends,1);
});
test("late disposal throwing is still a single invocation and cannot turn denial into success",async()=>{
  let finish,calls=0;
  const {Pool}=driverDouble({connect:()=>new Promise(resolve=>{finish=resolve;})}),resource=make(Pool),pending=resource.pool.connect();
  await resource.close();finish({query:async()=>({rows:[],rowCount:0}),release(){calls++;throw Error("synthetic secret");}});
  await assert.rejects(pending,unavailable);assert.equal(calls,1);
});
test("malformed acquired client is discarded once by the accepted port",async()=>{
  let releases=0;const {Pool}=driverDouble({connect:async()=>({release(d){releases++;assert.equal(d,true);}})}),resource=make(Pool);
  await assert.rejects(resource.pool.connect(),unavailable);assert.equal(releases,1);await resource.close();
});
test("factory never logs private options or driver errors on success, idle error or failed end",async t=>{
  let logs=0;for(const method of ["log","info","warn","error","debug"])t.mock.method(console,method,()=>{logs++;});
  console.error("positive calibration");assert.equal(logs,1);logs=0;
  const {Pool,state}=driverDouble({end:()=>Promise.reject(Error("synthetic-secret-canary"))}),resource=make(Pool);
  state.instance.emit("error",Error("synthetic-secret-canary"));await assert.rejects(resource.pool.connect(),unavailable);
  await assert.rejects(resource.close(),e=>e.message==="SERVICE_UNAVAILABLE"&&e.cause===undefined);
  assert.equal(logs,0);
});

test("inert tests have calibrated connection tripwires; factory neither connects nor probes",async t=>{
  let calls=0;const trip=()=>{calls++;throw Error("synthetic connection tripwire");};
  t.mock.method(net.Socket.prototype,"connect",trip);t.mock.method(net,"connect",trip);t.mock.method(tls,"connect",trip);t.mock.method(dns,"lookup",trip);
  for(const invoke of [()=>net.connect(),()=>tls.connect(),()=>dns.lookup(),()=>new net.Socket().connect()])assert.throws(invoke,/tripwire/);
  assert.equal(calls,4);calls=0;
  const {Pool,state}=driverDouble(),resource=make(Pool);
  const client=await resource.pool.connect();client.release(false);await resource.close();
  assert.equal(calls,0);assert.equal(state.connects,1);assert.deepEqual(state.queries,[]);
});

test("no driver import or bootstrap activation; only PG environment names are guarded",async()=>{
  const source=await readFile(new URL("../../runtime/postgres-pool-factory.mjs",import.meta.url),"utf8");
  assert.ok(!/from\s+["']pg["']|import\(["']pg|process\.on|pool\.query/.test(source));
  assert.equal((source.match(/process\.env/g)||[]).length,1);assert.ok(source.includes("Reflect.ownKeys(process.env)"));
  const entry=await readFile(new URL("../../api/index.mjs",import.meta.url),"utf8");assert.ok(entry.includes("configuration:undefined"));
  assert.ok(!entry.includes("postgres-pool-factory"));
});
