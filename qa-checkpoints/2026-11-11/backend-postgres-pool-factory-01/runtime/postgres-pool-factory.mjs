import {X509Certificate} from "node:crypto";
import {isIP} from "node:net";
import {types} from "node:util";
import {ApiFault} from "../supabase/functions/univeracademy-api/fault.ts";
import {StorageUnavailable} from "../supabase/functions/univeracademy-api/storage/postgres-transaction.ts";
import {transactionPoolPort} from "../supabase/functions/univeracademy-api/storage/transaction-pool-port.ts";

const unavailable=()=>new StorageUnavailable("not_committed");
const fields=["host","port","database","user","password","ca"];
function privateOptions(value) {
  if(!value||typeof value!=="object"||types.isProxy(value)||types.isPromise(value)||
    ![Object.prototype,null].includes(Object.getPrototypeOf(value)))throw unavailable();
  const copy={};
  for(const key of Reflect.ownKeys(value)) {
    const descriptor=Object.getOwnPropertyDescriptor(value,key);
    if(typeof key!=="string"||!fields.includes(key)||!Object.hasOwn(descriptor,"value"))throw unavailable();
    copy[key]=descriptor.value;
  }
  if(fields.some(key=>!Object.hasOwn(copy,key)))throw unavailable();
  for(const key of ["host","database","user","password","ca"]) {
    if(typeof copy[key]!=="string"||!copy[key].trim()||copy[key].includes("\0"))throw unavailable();
  }
  if(!Number.isInteger(copy.port)||copy.port<1||copy.port>65535)throw unavailable();
  // pg8.16.3 supplies TLS servername for DNS hosts. Its IP/socket path does
  // not bind that name, so those forms need a separate reviewed adapter.
  if(copy.host.length>253||isIP(copy.host)||!copy.host.split(".").every(label=>
    /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?$/.test(label)))throw unavailable();
  const certificates=copy.ca.match(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g);
  if(!certificates?.length||copy.ca.replace(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g,"").trim())throw unavailable();
  for(const pem of certificates)if(!new X509Certificate(pem).ca)throw unavailable();
  return copy;
}

/** Private, lazy resource; the trusted composition owner drains requests and
 * awaits close(). Pool is an injected trusted pg.Pool-compatible constructor.
 * CA review/provisioning belongs to that owner; parsing is not trust approval.
 * No credentials, files or configuration are loaded. Only environment NAMES
 * are enumerated to deny pg's ambient fallbacks; no value is read or cleared.
 * No connection/probe, SQL setup, driver import or bootstrap wiring occurs.
 * Fake tests cannot establish real driver/TLS/DB or signed-scope authority.
 */
export function createPostgresPool(Pool,options) {
  let driver,end,closePromise,unavailableResource=false;
  function close() {
    unavailableResource=true;
    if(!closePromise)closePromise=Promise.resolve().then(()=>{
      const ending=end.call(driver);
      if(!types.isPromise(ending))throw new ApiFault("SERVICE_UNAVAILABLE",503);
      return ending;
    }).then(()=>undefined,()=>{throw new ApiFault("SERVICE_UNAVAILABLE",503);});
    return closePromise; // A failed/pending end stays failed/pending; never retry.
  }
  try {
    if(typeof Pool!=="function"||types.isProxy(Pool))throw unavailable();
    const config=privateOptions(options);
    if(Reflect.ownKeys(process.env).some(name=>typeof name==="string"&&name.startsWith("PG")))throw unavailable();
    driver=new Pool({host:config.host,port:config.port,database:config.database,
      user:config.user,password:config.password,ssl:{ca:config.ca,rejectUnauthorized:true},
      max:1,min:0,connectionTimeoutMillis:5000,idleTimeoutMillis:10000});
    if(!driver||typeof driver!=="object"||types.isProxy(driver))throw unavailable();
    end=driver.end;
    if(typeof end!=="function"||typeof driver.connect!=="function"||typeof driver.on!=="function")throw unavailable();
    // Retained for the resource's whole lifetime, including failed shutdown.
    // Never retain, serialize, log or classify the exception/client arguments.
    driver.on("error",()=>{unavailableResource=true;});
    const port=transactionPoolPort(driver);
    const pool=Object.freeze({async connect() {
      if(unavailableResource)throw unavailable();
      let client;
      try {client=await port.connect();} catch {throw unavailable();}
      if(unavailableResource) {
        // Acquisition may finish after close()/idle-error. It never escapes.
        try {client.release(true);} catch { /* disposal was invoked once */ }
        throw unavailable();
      }
      return client; // Existing checked-out transactions retain runner semantics.
    }});
    return Object.freeze({pool,close});
  } catch {
    // A constructor that throws has returned no resource. After construction,
    // attempt disposal once where possible; failure is never reported as success.
    if(driver&&typeof end==="function")close().catch(()=>undefined);
    throw unavailable(); // Fixed error, without input, driver exception or cause.
  }
}
