// Source/text checks only: no SQL parser, compilation, connection or execution.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';

const sql=await readFile(new URL('./first-student-trusted-server.activation.review.sql',import.meta.url),'utf8');
const owners=['ua_access_locator_owner','ua_person_lock_owner','ua_clerk_lock_owner','ua_invariant_owner'];
const list=owners.join(',');
const hash=s=>createHash('sha256').update(s).digest('hex');
const firstTransfer=sql.indexOf('ALTER FUNCTION ua_private.locate_student_access(text) OWNER TO');
const lastTransfer=sql.indexOf('ALTER FUNCTION ua_private.check_series_projection() OWNER TO');
const begin=sql.indexOf('\nBEGIN;'),rollback=sql.lastIndexOf('\nROLLBACK;');

test('the deliberate review guard and transaction still enclose every temporary privilege',()=>{
  assert.ok(sql.indexOf("RAISE EXCEPTION 'REVIEW_ONLY_")<begin);
  assert.ok(sql.trimEnd().endsWith('ROLLBACK;'));
  for(const text of [`GRANT CREATE ON SCHEMA ua_private TO ${list};`,`REVOKE CREATE ON SCHEMA ua_private FROM ${list};`]){
    assert.equal(sql.split(text).length,2);assert.ok(sql.indexOf(text)>begin&&sql.indexOf(text)<rollback);
  }
  assert.doesNotMatch(sql,/^COMMIT;/m);
});
for(const owner of owners)test(owner+' receives CREATE only inside the ownership-transfer window',()=>{
  const grant=sql.indexOf(`GRANT CREATE ON SCHEMA ua_private TO ${list};`);
  const revoke=sql.indexOf(`REVOKE CREATE ON SCHEMA ua_private FROM ${list};`);
  const transfers=[...sql.matchAll(new RegExp('^ALTER FUNCTION [^;]+ OWNER TO '+owner+';','gm'))];
  assert.equal(transfers.length,owner==='ua_invariant_owner'?6:1);
  assert.ok(grant>begin&&grant<firstTransfer&&revoke>lastTransfer&&revoke<rollback);
  for(const transfer of transfers)assert.ok(grant<transfer.index&&transfer.index<revoke);
});
test('non-superuser operator prerequisites are checked before role creation, without mutating them',()=>{
  const check=sql.slice(sql.indexOf('DO $transfer_operator$'),sql.indexOf('END $transfer_operator$;'));
  for(const required of ["current_user IS DISTINCT FROM session_user","NOT rolcreaterole OR rolsuper","pg_has_role(current_user,'ua_owner','USAGE')","pg_has_role(session_user,'ua_owner','SET')","current_setting('createrole_self_grant') IS DISTINCT FROM ''","nspowner='ua_owner'::regrole","MANAGED_OPERATOR_AUTHORITY_REQUIRED"])assert.ok(check.includes(required),required);
  assert.ok(sql.indexOf('END $transfer_operator$;')<sql.indexOf('CREATE ROLE '));
  assert.doesNotMatch(sql,/SET (?:LOCAL )?createrole_self_grant|ALTER ROLE[^;]*(?:SUPERUSER|CREATEROLE|LOGIN)(?![A-Z])/);
});
test('temporary operator membership is self-granted with exact options and its exact grantor is revoked',()=>{
  const grant=`GRANT ${list} TO CURRENT_USER WITH ADMIN FALSE, INHERIT TRUE, SET TRUE GRANTED BY CURRENT_USER;`;
  const revoke=`REVOKE ${list} FROM CURRENT_USER GRANTED BY CURRENT_USER RESTRICT;`;
  assert.equal(sql.split(grant).length,2);assert.equal(sql.split(revoke).length,2);
  assert.ok(sql.indexOf(grant)<firstTransfer&&sql.indexOf(revoke)>lastTransfer&&sql.indexOf(revoke)<rollback);
  const code=sql.split('\n').filter(x=>!x.trimStart().startsWith('--')).join('\n');
  assert.deepEqual(code.match(/^GRANT (?!.* ON )[^;]+;/gm),[grant]);
  assert.doesNotMatch(code,/GRANT[^;]+TO ua_runtime WITH|GRANT[^;]+WITH ADMIN TRUE/);
});
test('transfer and cleanup postconditions reject missing authority or any surviving CREATE, SET or inherited access',()=>{
  for(const block of ['DO $transfer_ready$','DO $transfer_closed$'])assert.ok(sql.includes(block));
  const ready=sql.slice(sql.indexOf('DO $transfer_ready$'),sql.indexOf('END $transfer_ready$;'));
  const closed=sql.slice(sql.indexOf('DO $transfer_closed$'),sql.indexOf('END $transfer_closed$;'));
  for(const check of ["has_schema_privilege(target,'ua_private','CREATE')","pg_has_role(current_user,target,'SET')","pg_has_role(current_user,target,'USAGE')"])assert.ok(ready.includes(check));
  for(const check of ["has_schema_privilege(target,'ua_private','CREATE')","pg_has_role(current_user,target,'SET')","pg_has_role(current_user,target,'USAGE')","pg_has_role('ua_runtime',target,'MEMBER')","has_schema_privilege('ua_runtime','ua_private','CREATE')"])assert.ok(closed.includes(check));
  assert.ok(sql.indexOf('END $transfer_ready$;')<firstTransfer);
  assert.ok(sql.indexOf('DO $transfer_closed$')>sql.indexOf(`REVOKE ${list} FROM CURRENT_USER GRANTED BY CURRENT_USER RESTRICT;`));
  assert.ok(sql.indexOf('END $transfer_closed$;')<sql.indexOf('CREATE POLICY student_auth_read'));
});
test('the four helper owners and runtime retain their final restricted attributes and visibility',()=>{
  assert.equal((sql.match(/^CREATE ROLE \w+ NOLOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;$/gm)||[]).length,4);
  assert.doesNotMatch(sql,/^GRANT CREATE ON SCHEMA[^;]*ua_runtime/m);
  assert.doesNotMatch(sql,/^GRANT (?:INSERT|UPDATE)[^;]* ON ua_private\.(?:people|clerk_identities) TO ua_runtime/m);
  assert.ok(sql.includes("NOT rolsuper AND NOT rolbypassrls AND NOT rolcanlogin"));
  assert.doesNotMatch(sql,/DISABLE ROW LEVEL SECURITY|NO FORCE ROW LEVEL SECURITY|CREATE EXTENSION/);
});
test('all three helper bodies and all original scoped grants/policy definitions are unchanged',()=>{
  const bodies=sql.match(/CREATE FUNCTION ua_private\.[\s\S]+?END \$fn\$;/g)||[];
  assert.equal(bodies.length,3);
  assert.equal(hash(bodies.join('\n')),'db7ec9840020c174be099120d3ec24143982c794c53bf99116fbf1957fe0aa4d');
  const protectedText=sql.split('\n').filter(line=>['CREATE POLICY ','GRANT SELECT','GRANT INSERT','GRANT UPDATE','GRANT EXECUTE','GRANT USAGE'].some(p=>line.startsWith(p))).join('\n');
  assert.equal(hash(protectedText),'8ba163fca3ff72fd11f87271fa7489b9a6fc2a0ebb259c7d956e35633a79d717');
});
test('the source records superuser masking and the limited implicit ADMIN membership honestly',()=>{
  assert.ok(sql.includes('A true cluster superuser bypasses'));
  assert.ok(sql.includes('implicit ADMIN-only creator membership'));
  assert.ok(sql.includes('no enduring SET/INHERIT or schema CREATE'));
});
