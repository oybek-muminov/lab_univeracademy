import { fail } from "../fault.ts";
import { bearer, checkSessionPolicy, proofHash } from "../student-state.ts";
import type { SessionPolicy } from "../student-state.ts";
import { verifyTelegramInitData } from "../telegram.ts";
import { StorageUnavailable } from "./postgres-transaction.ts";
import type { PgClient, PgPool } from "./postgres-transaction.ts";

async function input(request: Request, key: string): Promise<string> {
  let parsed: unknown;
  try { parsed=JSON.parse(await request.text()); } catch { fail("MALFORMED_JSON",400); }
  if(!parsed||typeof parsed!=="object"||Array.isArray(parsed)||Object.keys(parsed).length!==1||
    !Object.hasOwn(parsed,key)||typeof (parsed as Record<string,unknown>)[key]!=="string"||
    !(parsed as Record<string,string>)[key].length) fail("VALIDATION_ERROR",422);
  return (parsed as Record<string,string>)[key];
}
const accessLookup="SELECT f.person_id::text FROM ua_private.student_access a JOIN ua_private.student_families f ON f.id=a.family_id WHERE a.digest=$1";
export type StudentScope={kind:"person";personId:string}|{kind:"telegram";telegramId:number;initData:string};
async function lookup(request: Request, config: { botToken:string;sessionPolicy:SessionPolicy;now:()=>number }): Promise<StudentScope|{kind:"lookup";name:string;text:string;value:unknown}> {
  const path=new URL(request.url).pathname.replace(/\/$/,""),method=request.method;
  let name:string,text:string,value:unknown;
  if(path==="/api/v1/auth/telegram"&&method==="POST") {
    const raw=await input(request,"init_data"),policy=checkSessionPolicy(config.sessionPolicy);
    if(Array.from(raw).length>16384) fail("VALIDATION_ERROR",422);
    const now=config.now();if(!Number.isSafeInteger(now)||now<0) fail("SERVICE_UNAVAILABLE",503);
    const seconds=Math.floor(now/1000);
    const verified=await verifyTelegramInitData(raw,config.botToken,{notBeforeSeconds:Math.max(0,seconds-policy.initDataMaxAgeSeconds),notAfterSeconds:seconds+policy.futureSkewSeconds});
    return {kind:"telegram",telegramId:verified.telegramUserId,initData:raw};
  } else if(path==="/api/v1/auth/refresh"&&method==="POST") {
    const raw=await input(request,"refresh_token");if(Array.from(raw).length>1024) fail("VALIDATION_ERROR",422);
    name="ua_locate_refresh";text="SELECT f.person_id::text FROM ua_private.student_refresh r JOIN ua_private.student_families f ON f.id=r.family_id WHERE r.digest=$1";value=await proofHash(raw);
  } else {
    const access=bearer(request,false);
    if(access) {name="ua_locate_access";text=accessLookup;value=await proofHash(access);}
    else if(path==="/api/v1/auth/logout"&&method==="POST") {
      if(!(await request.clone().text())) fail("LOGOUT_PROOF_REQUIRED",401);
      const raw=await input(request,"refresh_token");name="ua_locate_refresh";text="SELECT f.person_id::text FROM ua_private.student_refresh r JOIN ua_private.student_families f ON f.id=r.family_id WHERE r.digest=$1";value=await proofHash(raw);
    } else fail("SESSION_REVOKED",401);
  }
  return {kind:"lookup",name,text,value};
}
async function resolve(client:PgClient,hint:Awaited<ReturnType<typeof lookup>>):Promise<StudentScope>{
  if(hint.kind!=="lookup")return hint;
  const r=await client.query({name:hint.name,text:hint.text,values:[hint.value]});
  if(r.rows.length!==1)fail(hint.name==="ua_locate_refresh"?"REFRESH_INVALID":"SESSION_REVOKED",401);
  return {kind:"person",personId:r.rows[0].person_id as string}; // Hint only; reauthorize after locks.
}
export async function locateStudentAccessOnClient(client:PgClient,proofDigest:string):Promise<StudentScope>{
  if(!/^[0-9a-f]{64}$/.test(proofDigest))fail("SESSION_REVOKED",401);
  return resolve(client,{kind:"lookup",name:"ua_locate_access",text:accessLookup,value:proofDigest});
}

// Compatibility wrapper for the existing login/refresh/logout adapters. The
// prepared student path calls locateStudentAccessOnClient after BEGIN, with no second
// checkout and no authority inferred from the locator's answer.
export async function locateStudent(pool: PgPool, request: Request, config: {
  botToken:string;sessionPolicy:SessionPolicy;now:()=>number
}): Promise<StudentScope> {
  const hint=await lookup(request,config);if(hint.kind!=="lookup")return hint;
  let client;
  try {client=await pool.connect();}catch{throw new StorageUnavailable("not_committed");}
  if(typeof client?.query!=="function"||typeof client.release!=="function") {
    if(typeof client?.release==="function")client.release(true);
    throw new StorageUnavailable("not_committed");
  }
  try {return await resolve(client,hint);} finally {client.release();}
}
