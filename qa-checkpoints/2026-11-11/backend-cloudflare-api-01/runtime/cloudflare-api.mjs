import {ApiFault} from "../supabase/functions/univeracademy-api/fault.ts";
// This existing module uses only Web Request/Response/CORS/body bounds. It does
// not import Node HTTP or start a listener; its historic filename is retained.
import {createVercelNodeFunction} from "./vercel-node.mjs";
import {createCloudflarePostgres} from "./cloudflare-postgres.mjs";

const unavailable=()=>new ApiFault("SERVICE_UNAVAILABLE",503);
const fault=()=>new Response(JSON.stringify({error:{code:"SERVICE_UNAVAILABLE",message:"SERVICE_UNAVAILABLE",request_id:crypto.randomUUID()}}),
  {status:503,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store","cdn-cache-control":"no-store"}});
async function untilAborted(work,signal){
  let abort;
  try{
    if(signal.aborted)throw unavailable();
    const cancelled=new Promise((_,reject)=>{abort=()=>reject(unavailable());signal.addEventListener("abort",abort,{once:true});});
    return await Promise.race([Promise.resolve().then(()=>{if(signal.aborted)throw unavailable();return work();}),cancelled]);
  }finally{signal.removeEventListener("abort",abort);}
}

/** Pure Web composition, not a default Worker deployment. All options are
 * private server references supplied by composition, never request/env headers.
 * configuration is the existing production HttpConfiguration WITHOUT storage;
 * its Clerk adapter is prepared by createClerkWorkerAdapter. No credentials,
 * provider/DB probe, JWT bypass or browser-trusted flag is provided here.
 */
export function createCloudflareApi({apiOrigin,allowedOrigins,Client,postgres,configuration}={}){
  return Object.freeze({async fetch(request){
    let resource,response;
    try{
      let scoped;
      if(configuration!==undefined){
        if(configuration?.mode!=="production"||configuration.storage!==undefined)throw unavailable();
        resource=createCloudflarePostgres(Client,postgres,{signal:request.signal});
        scoped={...configuration,storage:{kind:"postgres",pool:resource.pool}};
        if(configuration.clerk){
          const read=configuration.clerk.liveness;
          if(typeof read!=="function")throw unavailable();
          scoped.clerk={...configuration.clerk,liveness:(identity,now,options)=>read(identity,now,
            {signal:options?.signal?AbortSignal.any([request.signal,options.signal]):request.signal})};
        }
      }
      const api=createVercelNodeFunction({apiOrigin,allowedOrigins,configuration:scoped});
      response=await untilAborted(()=>api.fetch(request),request.signal);
    }catch{response=fault();}
    // No ACK before owned client disposal; no retry on close/commit uncertainty.
    try{await resource?.close();}catch{response=fault();}
    const headers=new Headers(response.headers);headers.set("cloudflare-cdn-cache-control","no-store");
    return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
  }});
}
