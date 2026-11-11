import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createClerkWorkerBindings,createClerkWorkerAdapter} from '../../runtime/clerk-worker-bindings.mjs';
import {createClerkVerifier,requireLiveClerk} from '../../supabase/functions/univeracademy-api/clerk-auth.ts';

const issuer='https://clerk.offline.invalid',party='https://mini.offline.invalid',uid='user_SyntheticCaseA',sid='sess_SyntheticCaseA';
const now=Date.UTC(2026,10,11),secretKey='synthetic-private-not-a-real-credential';
const session=()=>({id:sid,user_id:uid,status:'active',expire_at:now+60000,abandon_at:now+30000,actor:null});
const user=()=>({id:uid,banned:false,locked:false,deprovisioned:false});
const json=v=>new Response(JSON.stringify(v),{headers:{'content-type':'application/json'}});
const denied=e=>e.status===503&&e.message==='SERVICE_UNAVAILABLE'&&!e.cause;
const settings={issuer,authorizedParties:[party],audience:{kind:'clerk_default_no_audience'},jwksCacheMs:300000,jwksCooldownMs:0,timeoutMs:100,maxJwksBytes:65536};
function fixture(patch={}){
  const requests=[];const transport=async r=>{requests.push(r);return patch.respond?patch.respond(r):json(r.url.includes('/sessions/')?session():r.url.includes('/users/')?user():{keys:[]});};
  const options={issuer,secretKey,transport,now:()=>now,timeoutMs:100,maxResponseBytes:65536,...patch};delete options.respond;
  const bindings=createClerkWorkerBindings(options);return {bindings,requests,options};
}
test('construction is inert, uses only injected Web transport, and returns required camelCase models without defaults',async()=>{
  const native=globalThis.fetch,f=fixture();assert.equal(f.requests.length,0);
  assert.deepEqual(await f.bindings.getSession(sid),{id:sid,userId:uid,status:'active',expireAt:now+60000,abandonAt:now+30000,actor:null});
  assert.deepEqual(await f.bindings.getUser(uid),user());assert.equal(globalThis.fetch,native);
  assert.deepEqual(f.requests.map(r=>r.url),['https://api.clerk.com/v1/sessions/'+sid,'https://api.clerk.com/v1/users/'+uid]);
  for(const r of f.requests){assert.equal(r.method,'GET');assert.equal(r.redirect,'error');assert.equal(r.credentials,'omit');assert.equal(r.cache,'no-store');assert.equal(r.headers.get('cache-control'),'no-store');assert.equal(r.headers.get('authorization'),'Bearer '+secretKey);assert.equal(r.headers.get('cookie'),null);}
  f.bindings.close();
});
for(const change of [{issuer:'http://clerk.invalid'},{issuer:issuer+'/'},{secretKey:''},{secretKey:'bad\nsecret'},
  {transport:undefined},{now:undefined},{timeoutMs:0},{timeoutMs:Infinity},{maxResponseBytes:0},{maxResponseBytes:1048577}])
test('missing/unsafe private Worker binding fails closed before reads '+Object.keys(change)[0],()=>{
  assert.throws(()=>fixture(change),denied);
});
for(const [kind,field]of [['sessions','actor'],['sessions','id'],['sessions','user_id'],['sessions','expire_at'],['sessions','abandon_at'],['sessions','status'],['users','id'],['users','banned'],['users','locked'],['users','deprovisioned']])
test('missing mandatory '+kind+'/'+field+' cannot receive an invented security default',async()=>{
  const f=fixture({respond:()=>{const value=kind==='sessions'?session():user();delete value[field];return json(value);}});
  try{await assert.rejects(kind==='sessions'?f.bindings.getSession(sid):f.bindings.getUser(uid),denied);}finally{f.bindings.close();}
});
for(const value of [sid+'\n','sess_../users/user_other','https://other.invalid','',null,'user_WrongKind'])
test('invalid session target never reaches transport '+JSON.stringify(value),async()=>{
  const f=fixture();try{await assert.rejects(f.bindings.getSession(value),denied);assert.equal(f.requests.length,0);}finally{f.bindings.close();}
});
for(const patch of [{expire_at:'123'},{abandon_at:null},{actor:false},{id:'sess_A\n'},{user_id:'user_A\n'}])
test('malformed raw session value denies503 '+Object.keys(patch)[0],async()=>{
  const f=fixture({respond:()=>json({...session(),...patch})});try{await assert.rejects(f.bindings.getSession(sid),denied);}finally{f.bindings.close();}
});
test('uncached reads preserve revoked state, all account flags and shortened expiry for the existing provider oracle',async()=>{
  let wire=session(),account=user();const f=fixture({respond:r=>json(r.url.includes('/sessions/')?wire:account)});
  try{
    assert.equal((await f.bindings.getSession(sid)).expireAt,now+60000);
    wire.expire_at=now+100;wire.status='revoked';assert.equal((await f.bindings.getSession(sid)).status,'revoked');assert.equal((await f.bindings.getSession(sid)).expireAt,now+100);
    for(const name of ['banned','locked','deprovisioned']){account={...user(),[name]:true};assert.equal((await f.bindings.getUser(uid))[name],true);}
    assert.equal(f.requests.length,6); // No session/account cache across reads.
  }finally{f.bindings.close();}
});
for(const status of [404,401,429,500])test('provider status '+status+' is sanitized without retry',async()=>{
  const f=fixture({respond:()=>new Response('must-not-echo-private-provider',{status})});
  try{await assert.rejects(f.bindings.getSession(sid),e=>e.status===(status===404?404:503)&&!e.message.includes('must-not-echo'));assert.equal(f.requests.length,1);}finally{f.bindings.close();}
});
for(const [label,respond]of [
  ['redirect',()=>new Response(null,{status:302,headers:{location:'https://other.invalid'}})],
  ['foreign URL',()=>{const r=json(session());Object.defineProperty(r,'url',{value:'https://other.invalid'});return r;}],
  ['MIME',()=>new Response('{}',{headers:{'content-type':'text/plain'}})],
  ['broken JSON',()=>new Response('{',{headers:{'content-type':'application/json'}})],
  ['invalid UTF8',()=>new Response(new Uint8Array([0xc3,0x28]),{headers:{'content-type':'application/json'}})],
  ['declared limit',()=>new Response('{}',{headers:{'content-type':'application/json','content-length':'65537'}})],
  ['length mismatch',()=>new Response('{}',{headers:{'content-type':'application/json','content-length':'1'}})],
  ['actual limit',()=>json({...session(),extra:'x'.repeat(70000)})],
  ['transport exception',()=>{throw Error('must-not-echo-private-provider');}],
])test(label+' denies before model authorization',async()=>{
  const f=fixture({respond});try{await assert.rejects(f.bindings.getSession(sid),denied);}finally{f.bindings.close();}
});
test('rejected response headers and over-limit streams dispose their body, without continuing reads',async()=>{
  for(const badHeader of [true,false]){
    let cancelled=0;
    const f=fixture({respond:()=>new Response(new ReadableStream({start(c){if(!badHeader)c.enqueue(new Uint8Array(65537));},cancel(){cancelled++;}}),{headers:{'content-type':badHeader?'text/plain':'application/json'}})});
    try{await assert.rejects(f.bindings.getSession(sid),denied);await Promise.resolve();assert.equal(cancelled,1);}finally{f.bindings.close();}
  }
});
test('timeout and caller abort cancel the injected transport, including ignored-abort late replies',async()=>{
  for(const cancelKind of ['timeout','caller','close']){
    let transportSignal,resolve,bodyCancelled=0;const late=new Promise(r=>{resolve=r;});
    const f=fixture({timeoutMs:15,respond:r=>{transportSignal=r.signal;return late;}}),controller=new AbortController();
    const result=f.bindings.getSession(sid,{signal:controller.signal});await Promise.resolve();
    if(cancelKind==='caller')controller.abort();if(cancelKind==='close')f.bindings.close();
    await assert.rejects(result,denied);assert.equal(transportSignal.aborted,true);
    resolve(new Response(new ReadableStream({cancel(){bodyCancelled++;}}),{headers:{'content-type':'application/json'}}));
    await new Promise(r=>setImmediate(r));assert.equal(bodyCancelled,1);f.bindings.close();
  }
});
test('cancellation while body read is pending cancels the body once and cannot return a model',async()=>{
  let cancelled=0;const controller=new AbortController();const f=fixture({respond:()=>new Response(new ReadableStream({cancel(){cancelled++;}}),{headers:{'content-type':'application/json'}})});
  const pending=f.bindings.getSession(sid,{signal:controller.signal});await new Promise(r=>setImmediate(r));controller.abort();await assert.rejects(pending,denied);await new Promise(r=>setImmediate(r));assert.equal(cancelled,1);f.bindings.close();
});
test('parent cancellation and close deny new calls; concurrent reads keep independent cancellation',async()=>{
  const parent=new AbortController(),f=fixture({signal:parent.signal});parent.abort();await assert.rejects(f.bindings.getSession(sid),denied);assert.equal(f.requests.length,0);f.bindings.close();f.bindings.close();
  const g=fixture(),aborted=new AbortController();aborted.abort();
  const [one,two]=await Promise.allSettled([g.bindings.getSession(sid,{signal:aborted.signal}),g.bindings.getSession(sid)]);
  assert.equal(one.status,'rejected');assert.equal(two.status,'fulfilled');assert.equal(g.requests.length,1);g.bindings.close();await assert.rejects(g.bindings.getUser(uid),denied);
});
test('malformed per-read cancellation input fails with the fixed safe error before transport',async()=>{
  const f=fixture();try{await assert.rejects(f.bindings.getSession(sid,{signal:{aborted:false}}),denied);assert.equal(f.requests.length,0);}finally{f.bindings.close();}
});
test('JWKS uses only fixed issuer GET, without bearer/cookie or caller header forwarding',async()=>{
  const f=fixture(),url=issuer+'/.well-known/jwks.json';
  try{
    assert.deepEqual(await (await f.bindings.fetchJwks(new Request(url))).json(),{keys:[]});const r=f.requests[0];assert.equal(r.url,url);assert.equal(r.headers.has('authorization'),false);assert.equal(r.headers.has('cookie'),false);
    for(const request of [new Request('https://other.invalid/.well-known/jwks.json'),new Request(url,{method:'POST'}),new Request(url,{headers:{authorization:'Bearer caller'}}),new Request(url,{headers:{cookie:'caller=1'}})])await assert.rejects(f.bindings.fetchJwks(request),denied);
    assert.equal(f.requests.length,1);
  }finally{f.bindings.close();}
});

let joseAvailable=true;try{import.meta.resolve('jose');}catch{joseAvailable=false;}
test('missing production JOSE dependency fails503 without a verifier substitute or provider request',{skip:joseAvailable?'JOSE exists; covered by real verification test':false},async()=>{
  const f=fixture();await assert.rejects(createClerkWorkerAdapter(settings,f.options),denied);assert.equal(f.requests.length,0);f.bindings.close();
});
test('real accepted provider adapter/JOSE enforces signature, issuer, azp, liveness, flags and earliest expiry',{skip:joseAvailable?false:'NOT_RUN: jose6.2.15 absent; no install authorized'},async()=>{
  const {generateKeyPair,exportJWK,SignJWT}=await import('jose'),pair=await generateKeyPair('RS256'),jwk=await exportJWK(pair.publicKey);jwk.kid='worker-synthetic-key';
  let current=session(),account=user(),calls=0;
  const adapter=await createClerkWorkerAdapter(settings,{secretKey,now:()=>now,timeoutMs:100,maxResponseBytes:65536,transport:async r=>{calls++;return json(r.url.includes('jwks')?{keys:[jwk]}:r.url.includes('/sessions/')?current:account);}});
  const sign=changes=>new SignJWT({iss:issuer,sub:uid,sid,iat:now/1000,nbf:now/1000,exp:now/1000+60,azp:party,jti:'synthetic-worker-jti',v:2,...changes}).setProtectedHeader({alg:'RS256',kid:jwk.kid}).sign(pair.privateKey);
  try{
    const verify=createClerkVerifier(adapter.verifier),identity=await verify(await sign());assert.equal(identity.userId,uid);
    assert.equal(await requireLiveClerk(identity,now,adapter.liveness),now+30000);
    for(const change of [{iss:'https://other.invalid'},{azp:'https://other.invalid'},{exp:now/1000},{aud:'unexpected'}])await assert.rejects(verify(await sign(change)),e=>e.status===401);
    current={...session(),status:'revoked'};await assert.rejects(requireLiveClerk(identity,now,adapter.liveness),e=>e.status===401);
    for(const field of ['banned','locked','deprovisioned']){current=session();account={...user(),[field]:true};await assert.rejects(requireLiveClerk(identity,now,adapter.liveness),e=>e.status===401);}
    account=user();current={...session(),expire_at:now};await assert.rejects(requireLiveClerk(identity,now,adapter.liveness),e=>e.status===401);
    current={...session(),expire_at:now+100};assert.equal(await requireLiveClerk(identity,now,adapter.liveness),now+100);assert.ok(calls>6);
  }finally{adapter.close();}
});
