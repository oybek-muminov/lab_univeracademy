// SYNTHETIC LOCAL FIXTURE ONLY. Called only after the sealed controller's preflight.
// No provider login, real credential, source mutation or production policy.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {join} from 'node:path';

export const tokens=Object.freeze({A:'LOCAL_ONLY_OPAQUE_A_FLOW01',B:'LOCAL_ONLY_OPAQUE_B_FLOW01',expiry:'LOCAL_ONLY_OPAQUE_A_EXPIRY_FLOW01'});
export const localPolicy=Object.freeze({initDataMaxAgeSeconds:120,futureSkewSeconds:0,accessTtlMs:600000,familyTtlMs:900000,logoutTombstoneMs:30000,identityCollisionAttempts:4,newLogin:'revoke_previous'});
export const initialCounts=Object.freeze({groups:1,people:2,memberships:2,demos:1,test_versions:1,assignments:1,grants:1,student_families:2,student_access:3});
const digest=s=>createHash('sha256').update(s).digest('hex');

export async function seed(admin,source) {
  const fixture=await import(pathToFileURL(join(source,'tests/backend/http-fixture.ts')).href);
  const {encodePublished}=await import(pathToFileURL(join(source,'supabase/functions/univeracademy-api/storage/attempt-rows.ts')).href);
  const {ids,id,initialState,testNumbers}=fixture,state=initialState();
  const nowRow=await admin.query("SELECT floor(extract(epoch FROM clock_timestamp())*1000)::text AS now_ms");
  const now=Number(nowRow.rows[0].now_ms);assert.ok(Number.isSafeInteger(now));
  const a=state.assignments[ids.assignment];
  a.admission.opensAt=now-60000;a.admission.closesAt=now+600000;
  a.published={...a.published,durationMs:600000};
  for(const q of a.published.questions){assert.equal(q.optionIds.length,4);assert.equal(new Set(q.optionIds).size,4);assert.ok(q.optionIds.includes(q.correctOptionId));}
  const record={...a,published:encodePublished(a.published)};
  await admin.query('BEGIN');let committing=false;
  try {
    // Explicit identifiers below are sealed SQL, never caller-provided table names.
    const empty=await admin.query("SELECT (SELECT count(*) FROM ua_private.people)::text AS people,(SELECT count(*) FROM ua_private.assignments)::text AS assignments,(SELECT count(*) FROM ua_private.attempts)::text AS attempts,(SELECT count(*) FROM ua_private.student_access)::text AS access");
    assert.deepEqual(empty.rows,[{people:'0',assignments:'0',attempts:'0',access:'0'}]);
    await admin.query('INSERT INTO ua_private.groups(id,revision,status) VALUES($1,0,$2)',[ids.group,'active']);
    for(const personId of [ids.person,ids.other]) {
      const p=state.people[personId];
      await admin.query('INSERT INTO ua_private.people(id,telegram_id,qadam_id,enabled,roles,profile) VALUES($1,$2,$3,$4,$5,$6::jsonb)',[personId,p.telegramId,p.profile.qadam_id,p.enabled,p.profile.roles,JSON.stringify(p.profile)]);
      await admin.query('INSERT INTO ua_private.memberships(person_id,affinity_group_id,active,revision,epoch) VALUES($1,$2,$3,0,$4)',[personId,p.profile.active_group_id,personId===ids.person,personId===ids.person?7:0]);
    }
    await admin.query('INSERT INTO ua_private.demos(id,subject_id,title) VALUES($1,$2,$3)',[ids.demo,'physics','LOCAL SYNTHETIC FLOW01']);
    await admin.query('INSERT INTO ua_private.test_versions(id,demo_id,revision,status,wire,published_snapshot) VALUES($1,$2,0,$3,$4::jsonb,$5::jsonb)',[ids.version,ids.demo,'published',JSON.stringify({id:ids.version,demo_id:ids.demo,revision:0,status:'published'}),JSON.stringify(record.published)]);
    await admin.query('INSERT INTO ua_private.assignments(id,group_id,demo_id,version_id,revision,record) VALUES($1,$2,$3,$4,0,$5::jsonb)',[ids.assignment,ids.group,ids.demo,ids.version,JSON.stringify(record)]);
    await admin.query('INSERT INTO ua_private.grants(person_id,assignment_id,rostered,grant_epoch) VALUES($1,$2,true,7)',[ids.person,ids.assignment]);
    for(const [personId,family,token] of [[ids.person,id(500),tokens.A],[ids.other,id(501),tokens.B]]) {
      await admin.query('INSERT INTO ua_private.student_families(id,person_id,expires_at_ms,revoked_at_ms,logout_retain_until_ms,auth_provider) VALUES($1,$2,$3,NULL,NULL,$4)',[family,personId,now+900000,'telegram']);
      await admin.query('INSERT INTO ua_private.student_access(digest,family_id,expires_at_ms,superseded) VALUES($1,$2,$3,false)',[digest(token),family,now+600000]);
    }
    // A separate short-lived proof of the SAME synthetic person permits one real
    // post-write expiry/rollback check, with no fixture/admin writes during HTTP.
    const expiry=now+12000;
    await admin.query('INSERT INTO ua_private.student_access(digest,family_id,expires_at_ms,superseded) VALUES($1,$2,$3,false)',[digest(tokens.expiry),id(500),expiry]);
    committing=true;await admin.query('COMMIT');
    const counted=await admin.query('SELECT '+Object.keys(initialCounts).map(name=>`(SELECT count(*)::text FROM ua_private.${name}) AS ${name}`).join(',')+",(SELECT count(*)::text FROM ua_private.attempts) AS attempts,(SELECT count(*)::text FROM ua_private.answers) AS answers,(SELECT count(*)::text FROM ua_private.ordinary_results) AS ordinary_results");
    assert.deepEqual(counted.rows,[{...Object.fromEntries(Object.entries(initialCounts).map(([k,n])=>[k,String(n)])),attempts:'0',answers:'0',ordinary_results:'0'}]);
    return {ids,now,expiry,initialCounts,testNumbers,botKey:fixture.botKey};
  } catch(error) {
    // No retry of either COMMIT or seed. Preserve unknown outcome for controller.
    if(!committing){try{await admin.query('ROLLBACK');}catch{}}
    throw error;
  }
}
