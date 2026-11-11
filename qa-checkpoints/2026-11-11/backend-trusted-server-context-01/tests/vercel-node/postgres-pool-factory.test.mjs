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
      super();state.constructed++;state.options=options;state.instance=this;this.Client=options.Client;
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
          if(statement.text==="SELECT id::text AS id FROM ua_private.lock_people($1::uuid[]) ORDER BY id")return{rows:[{id:person}],rowCount:1};
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
class UnusedClient {constructor(){throw Error("this inert pool must not construct a real client");}}
const make=(Pool,value=options(),Client=UnusedClient)=>namesOnly([],()=>createPostgresPool(Pool,Client,value));

test("private lazy constructor receives exact verified TLS options, cap1/min0 and finite fixed waits",async()=>{
  const {Pool,state}=driverDouble(),input=options();
  const resource=make(Pool,input);
  const {Client:guarded,...connectionOptions}=state.options;assert.equal(typeof guarded,"function");
  assert.equal(state.instance.Client,guarded);assert.notEqual(guarded,UnusedClient);
  assert.deepEqual(connectionOptions,{host:input.host,port:5432,database:input.database,user:input.user,password:input.password,
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
    const {Pool,state}=driverDouble();assert.throws(()=>namesOnly([],()=>createPostgresPool(Pool,UnusedClient,value)),unavailable);assert.equal(state.constructed,0);
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
    namesOnly([name],enumerations=>{assert.throws(()=>createPostgresPool(Pool,UnusedClient,options()),unavailable);assert.equal(enumerations(),1);});
    assert.equal(state.constructed,0);
  });
test("non-PG environment NAMES are enumerated without evaluating their values",async()=>{
  const {Pool,state}=driverDouble();
  const resource=namesOnly(["SYNTHETIC_UNREAD_CANARY","NODE_ENV"],enumerations=>{
    const result=createPostgresPool(Pool,UnusedClient,options());assert.equal(enumerations(),1);return result;
  });
  assert.equal(state.constructed,1);await resource.close();
});
test("an empty ambient PG value still denies; no property value is evaluated",()=>{
  const original=Object.getOwnPropertyDescriptor(process,"env"),{Pool,state}=driverDouble();let reads=0;
  const env={PGOPTIONS:""};Object.defineProperty(env,"PGPASSWORD",{enumerable:true,get(){reads++;throw Error("do not read");}});
  Object.defineProperty(process,"env",{value:env,configurable:true,writable:true,enumerable:true});
  try{assert.throws(()=>createPostgresPool(Pool,UnusedClient,options()),unavailable);assert.equal(state.constructed,0);assert.equal(reads,0);}
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
    class Bad {constructor(config){this.Client=config.Client;this[key]=undefined;}connect(){throw Error("must not call");}on(){}end(){ends++;return Promise.resolve();}}
    assert.throws(()=>make(Bad),unavailable);await Promise.resolve();await Promise.resolve();assert.equal(ends,1);
  }
  let connects=0;
  class MissingEnd {constructor(config){this.Client=config.Client;}on(){}connect(){connects++;}}
  assert.throws(()=>make(MissingEnd),unavailable);assert.equal(connects,0);
  let ends=0,listeners=0;
  class BadListener {constructor(config){this.Client=config.Client;}connect(){throw Error("must not call");}on(){listeners++;throw Error("synthetic secret");}end(){ends++;return Promise.reject(Error("synthetic cleanup secret"));}}
  assert.throws(()=>make(BadListener),unavailable);await new Promise(resolve=>setImmediate(resolve));assert.equal(ends,1);assert.equal(listeners,1);
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
    if(q.text==="SELECT id::text AS id FROM ua_private.lock_people($1::uuid[]) ORDER BY id")return{rows:[{id:person}],rowCount:1};
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

// Inert analogue of pg8.16.3 newClient's `new this.Client(this.options)`.
// No real driver is imported. A queued replacement constructs after connect()
// has returned, just as pg-pool's release/pulse path can do.
function lazyDriverDouble(behavior={}) {
  const state={realConstructors:0,realConnects:0,connects:0,valueReads:0,releases:[],pending:[],held:false,clients:[],failures:[],ends:0};
  class Client extends EventEmitter {
    constructor() {
      super();state.realConstructors++;
      if(state.realConstructors===behavior.constructorFailsAt)throw Error("synthetic private constructor cause");
      // This is always inside a synthetic process.env object in these tests.
      // Models pg's PGOPTIONS fallback; never accesses inherited real values.
      void process.env.PGOPTIONS;
    }
    connect(callback){state.realConnects++;queueMicrotask(()=>callback());}
    query(){return Promise.resolve({rows:[],rowCount:0});}
    end(callback){callback?.();}
  }
  class Pool extends EventEmitter {
    constructor(config){super();this.config=config;this.Client=config.Client??Client;}
    connect(){
      state.connects++;
      return new Promise((resolve,reject)=>{
        const request={resolve,reject};
        if(state.held)state.pending.push(request);else this.construct(request);
      });
    }
    construct(request){
      // Deliberately no constructor try/catch, matching the reviewed pg path.
      const client=new this.Client(this.config);state.clients.push(client);state.held=true;
      client.connect(error=>{
        if(error){
          state.failures.push(error);state.held=false;
          const next=state.pending.shift();if(next)this.construct(next);
          request.reject(error);return;
        }
        client.release=discard=>{
          state.releases.push(discard);state.held=false;
          const next=state.pending.shift();if(next)queueMicrotask(()=>this.construct(next));
        };
        request.resolve(client);
      });
    }
    end(){state.ends++;return Promise.resolve();}
  }
  return{Pool,Client,state};
}
async function syntheticEnvironment(work) {
  const original=Object.getOwnPropertyDescriptor(process,"env"),env=Object.create(null);
  Object.defineProperty(process,"env",{value:env,configurable:true,writable:true,enumerable:true});
  try{return await work(env);}finally{Object.defineProperty(process,"env",original);}
}
for(const throwing of [false,true])test(`lazy constructor boundary rejects post-factory PGOPTIONS before value read (${throwing?"throwing getter":"empty value"})`,async()=>{
  await syntheticEnvironment(async env=>{
    const {Pool,Client,state}=lazyDriverDouble(),resource=make(Pool,options(),Client);
    Object.defineProperty(env,"PGOPTIONS",{enumerable:true,get(){state.valueReads++;if(throwing)throw Error("synthetic unread value");return"";}});
    const outcome=await resource.pool.connect().then(client=>({client}),error=>({error}));
    if(outcome.client)outcome.client.release(true);
    await resource.close();
    assert.equal(state.valueReads,0,"PG value must never be read");
    assert.equal(state.realConstructors,0,"real driver constructor must never run");
    assert.ok(outcome.error,"post-factory contamination must reject");unavailable(outcome.error);
  });
});
test("lazy constructor boundary rejects queued replacement contamination after connect entered clean",async()=>{
  await syntheticEnvironment(async env=>{
    const {Pool,Client,state}=lazyDriverDouble(),resource=make(Pool,options(),Client),first=await resource.pool.connect();
    assert.equal(state.realConstructors,1);const pending=resource.pool.connect().then(client=>({client}),error=>({error}));
    assert.equal(state.pending.length,1);
    Object.defineProperty(env,"PGOPTIONS",{enumerable:true,get(){state.valueReads++;return"";}});
    first.release(true);const outcome=await pending;if(outcome.client)outcome.client.release(true);
    await resource.close();
    assert.equal(state.valueReads,0,"queued construction must not read PG values");
    assert.equal(state.realConstructors,1,"queued replacement must not construct a real client");
    assert.ok(outcome.error,"queued contaminated replacement must reject");unavailable(outcome.error);
    assert.deepEqual(state.releases,[true]);
  });
});

test("trusted Client injection is required; client proxies are rejected without traps or Pool construction",()=>{
  let traps=0;
  for(const Client of [undefined,null,{},new Proxy(UnusedClient,{construct(){traps++;},get(){traps++;}})]) {
    const {Pool,state}=driverDouble();assert.throws(()=>namesOnly([],()=>createPostgresPool(Pool,Client,options())),unavailable);assert.equal(state.constructed,0);
  }
  assert.equal(traps,0);
});
test("Pool must select the private guarded constructor as an own data identity before exposure",async()=>{
  for(const kind of ["missing","wrong","getter"]) {
    let reads=0,ends=0,connects=0;
    class Pool extends EventEmitter {
      constructor(config){super();if(kind==="wrong")this.Client=UnusedClient;if(kind==="getter")Object.defineProperty(this,"Client",{get(){reads++;return config.Client;}});}
      connect(){connects++;throw Error("must not acquire");}end(){ends++;return Promise.resolve();}
    }
    assert.throws(()=>make(Pool),unavailable);await new Promise(resolve=>setImmediate(resolve));
    assert.equal(reads,0);assert.equal(connects,0);assert.equal(ends,1);
  }
});
test("clean lazy construction uses the trusted real Client once and retains exact connection/TLS settings",async()=>{
  await syntheticEnvironment(async()=>{
    const {Pool,Client,state}=lazyDriverDouble(),resource=make(Pool,options(),Client);
    assert.equal(state.realConstructors,0);assert.equal(state.realConnects,0);
    const client=await resource.pool.connect();assert.equal(state.realConstructors,1);assert.equal(state.realConnects,1);assert.ok(state.clients[0] instanceof Client);
    client.release(false);await resource.close();assert.deepEqual(state.releases,[false]);assert.equal(state.ends,1);
  });
});
test("queued constructor guard drains several contaminated replacements without uncaught throws, recursion or real construction",{timeout:1000},async()=>{
  await syntheticEnvironment(async env=>{
    const {Pool,Client,state}=lazyDriverDouble(),resource=make(Pool,options(),Client),first=await resource.pool.connect();
    const requests=Array.from({length:3},()=>resource.pool.connect().then(client=>({client}),error=>({error})));
    assert.equal(state.pending.length,3);
    Object.defineProperty(env,"PGOPTIONS",{enumerable:true,get(){state.valueReads++;throw Error("synthetic value must not be read");}});
    first.release(true);const results=await Promise.all(requests);
    for(const result of results){assert.equal(result.client,undefined);unavailable(result.error);}
    assert.equal(state.realConstructors,1);assert.equal(state.realConnects,1);assert.equal(state.valueReads,0);
    assert.equal(state.failures.length,3);assert.equal(state.pending.length,0);assert.equal(state.held,false);
    await assert.rejects(resource.pool.connect(),unavailable);assert.equal(state.connects,4);
    await resource.close();assert.equal(state.ends,1);assert.deepEqual(state.releases,[true]);
  });
});
test("queued real Client constructor exception becomes safe asynchronous failure and latches later replacements closed",{timeout:1000},async()=>{
  await syntheticEnvironment(async()=>{
    const {Pool,Client,state}=lazyDriverDouble({constructorFailsAt:2}),resource=make(Pool,options(),Client),first=await resource.pool.connect();
    const requests=Array.from({length:3},()=>resource.pool.connect().then(client=>({client}),error=>({error})));
    first.release(true);const results=await Promise.all(requests);
    for(const result of results){assert.equal(result.client,undefined);unavailable(result.error);assert.ok(!result.error.message.includes("private constructor"));}
    assert.equal(state.realConstructors,2);assert.equal(state.realConnects,1);assert.equal(state.failures.length,3);assert.equal(state.pending.length,0);
    await assert.rejects(resource.pool.connect(),unavailable);await resource.close();assert.equal(state.ends,1);assert.deepEqual(state.releases,[true]);
  });
});
test("private failure client cannot query or succeed; connect fails once asynchronously and end always completes harmlessly",{timeout:1000},async()=>{
  await syntheticEnvironment(async env=>{
    const {Pool,Client,state}=lazyDriverDouble(),resource=make(Pool,options(),Client),first=await resource.pool.connect();
    const pending=resource.pool.connect().catch(error=>error);Object.defineProperty(env,"PGOPTIONS",{value:"",enumerable:true});first.release(true);unavailable(await pending);
    const failed=state.clients[1];assert.ok(failed instanceof EventEmitter);assert.equal(failed.query,undefined);
    let repeated=0;failed.connect(()=>{repeated++;});await Promise.resolve();assert.equal(repeated,0);
    let ended=0,inline=true;failed.end(()=>{assert.equal(inline,false);ended++;});inline=false;
    await failed.end();await Promise.resolve();assert.equal(ended,1);await resource.close();assert.equal(state.ends,1);
    assert.equal(state.realConstructors,1);assert.equal(state.valueReads,0);
  });
});
