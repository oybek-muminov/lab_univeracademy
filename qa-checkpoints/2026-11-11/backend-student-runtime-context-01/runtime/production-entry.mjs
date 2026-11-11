import {createProductionOptions} from "./production-options.mjs";
import {createVercelNodeEntrypoint} from "./vercel-node.mjs";

// Invoked only by a reviewed server bootstrap with already prepared private
// bindings. HTTP headers/body/environment flags cannot register these ports.
// This factory constructs no pool, provider, verifier key or DB capability.
export function createProductionEntrypoint(readPreparedOptions){
  if(typeof readPreparedOptions!=="function")throw new TypeError("Prepared server options required");
  return createVercelNodeEntrypoint(()=>createProductionOptions(readPreparedOptions()));
}
