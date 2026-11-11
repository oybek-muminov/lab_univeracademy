"""Static source checks only. Never opens a database or executes SQL."""
import argparse
import hashlib
from pathlib import Path
import re
import unittest

parser=argparse.ArgumentParser()
parser.add_argument('--activation-input',type=Path,required=True)
parser.add_argument('--auth-source',type=Path,required=True)
parser.add_argument('--domain-source',type=Path,required=True)
args,rest=parser.parse_known_args()
root=Path(__file__).resolve().parent
bootstrap=(root/'bootstrap-managed-operator.review.sql').read_text()
delta=(root/'clerk-registration.delta.review.sql').read_text()
activation=args.activation_input.read_text()
auth=args.auth_source.read_text()
domain=args.domain_source.read_text()
sha=lambda text:hashlib.sha256(text.encode()).hexdigest()

class StaticDerivationChecks(unittest.TestCase):
    def test_exact_pinned_inputs(self):
        self.assertEqual((len(activation.encode()),sha(activation)),(60365,'165711ecb98d46b0aea87253b172e9c535d53090626f6574d106ae34643be52d'))
        self.assertEqual((len(auth.encode()),sha(auth)),(23067,'3a90df4cdb0f106ff7ec84413a4fe6f5569315fdf466557cf3e9f3b5eacb42a0'))
        self.assertEqual((len(domain.encode()),sha(domain)),(12978,'a251fafaad42995e298a9a1c62bec4ee37e6889d9ea68aeac2faaffbbea5c8ef'))

    def test_bootstrap_inverts_to_every_original_byte(self):
        original=bootstrap
        for label in ['PREFLIGHT','OWNER WINDOW','OWNER CLEANUP']:
            pattern=r'-- BEGIN MANAGED-OPERATOR '+label+r' ADDITION\n.*?-- END MANAGED-OPERATOR '+label+r' ADDITION\n'
            original,n=re.subn(pattern,'',original,flags=re.S)
            self.assertEqual(n,1,label)
        self.assertEqual((len(original.encode()),sha(original)),(34366,'3a0c4b7b121dab0d765a7096cf0212eea605847f6481d0508cd837b7defca9c4'))
        self.assertEqual(len(re.findall(r'^CREATE TABLE ua_private\.',bootstrap,re.M)),30)

    def test_both_review_guards_and_rollback_remain(self):
        for text in [bootstrap,delta]:
            self.assertLess(text.index("RAISE EXCEPTION 'REVIEW_ONLY_"),text.index('\nBEGIN;'))
            self.assertTrue(text.endswith('ROLLBACK;\n'))
            self.assertNotRegex(text,r'(?m)^COMMIT;')
        self.assertNotRegex(delta,r'(?m)^CREATE (?:TABLE|ROLE|FUNCTION|EXTENSION)\b')

    def test_operator_window_precedes_owner_use_and_closes(self):
        grant='GRANT ua_owner TO CURRENT_USER WITH ADMIN FALSE, INHERIT TRUE, SET TRUE GRANTED BY CURRENT_USER;'
        revoke='REVOKE ua_owner FROM CURRENT_USER GRANTED BY CURRENT_USER RESTRICT;'
        self.assertEqual(bootstrap.count(grant),1)
        self.assertEqual(bootstrap.count(revoke),1)
        self.assertLess(bootstrap.index(grant),bootstrap.index('CREATE SCHEMA ua_private AUTHORIZATION ua_owner;'))
        self.assertLess(bootstrap.index('SET LOCAL ROLE NONE;'),bootstrap.index(revoke))
        self.assertLess(bootstrap.index(revoke),bootstrap.index('DO $bootstrap_owner_closed$'))
        self.assertIn("current_setting('createrole_self_grant') IS DISTINCT FROM ''",bootstrap)
        self.assertIn('rolcreaterole AND NOT rolsuper',bootstrap)
        self.assertIn('m.grantor=current_user::regrole AND NOT m.admin_option AND m.inherit_option AND m.set_option',bootstrap)
        self.assertIn("pg_catalog.pg_has_role(current_user,'ua_owner','SET')",bootstrap.split('DO $bootstrap_owner_closed$')[1])
        self.assertIn("pg_catalog.pg_has_role(current_user,'ua_owner','USAGE')",bootstrap.split('DO $bootstrap_owner_closed$')[1])

    def test_delta_grants_only_exact_insert_columns_and_profile_update(self):
        grants=re.findall(r'^GRANT (.+);$',delta,re.M)
        self.assertEqual(grants,[
          'INSERT(id,telegram_id,qadam_id,enabled,roles,profile) ON ua_private.people TO ua_runtime',
          'INSERT(person_id,active,epoch,revision,affinity_group_id) ON ua_private.memberships TO ua_runtime',
          'INSERT(issuer,subject,person_id,enabled) ON ua_private.clerk_identities TO ua_runtime',
          'UPDATE(profile) ON ua_private.people TO ua_runtime'])
        self.assertNotRegex(delta,r'(?im)^\s*(?:ALTER ROLE|ALTER SYSTEM|GRANT ALL|GRANT\s+(?:INSERT|UPDATE)\s+ON|ALTER TABLE.+DISABLE|SET\s+row_security)\b')
        self.assertNotRegex(delta,r'(?m)^GRANT.+TO (?:PUBLIC|anon|authenticated|service_role)\b')

    def test_four_policies_bind_all_six_keys_and_deny_missing_context(self):
        policies=re.findall(r'CREATE POLICY (registration_\w+) ON ua_private\.(\w+) FOR (INSERT|UPDATE) TO ua_runtime(.*?);',delta,re.S)
        self.assertEqual([(n,t,c) for n,t,c,_ in policies],[('registration_people_insert','people','INSERT'),('registration_member_insert','memberships','INSERT'),('registration_identity_insert','clerk_identities','INSERT'),('registration_profile_update','people','UPDATE')])
        for name,_,command,body in policies:
            for key in ['phase','person_id','person_ids','clerk_issuer','clerk_subject','telegram_id']:
                self.assertIn("current_setting('ua."+key+"',true)",body,name)
            self.assertIn('WITH CHECK(',body)
            self.assertIn("'exchange'" if command=='INSERT' else "'domain'",body)
            self.assertNotIn("IN ('auth'",body)
            self.assertNotIn("= 'auth'",body)
            self.assertNotIn('COALESCE',body)

    def test_creation_is_initial_enabled_student_and_no_identity_reassignment(self):
        self.assertIn("telegram_id IS NULL AND enabled AND roles = ARRAY['student']::text[]",delta)
        self.assertIn("'registration_complete',false,'active_group_id',NULL",delta)
        self.assertIn('NOT active AND epoch = 0 AND revision = 0 AND affinity_group_id IS NULL',delta)
        self.assertIn("issuer = current_setting('ua.clerk_issuer',true) COLLATE \"C\"",delta)
        self.assertIn("subject = current_setting('ua.clerk_subject',true) COLLATE \"C\"",delta)
        self.assertIn('NOT EXISTS(SELECT 1 FROM ua_private.clerk_identities c WHERE c.person_id = clerk_identities.person_id)',delta)
        self.assertNotRegex(delta,r'(?m)^UPDATE |^DELETE |^INSERT INTO ')

    def test_profile_shape_uses_immutable_columns_membership_and_enabled_mapping(self):
        profile=delta.split('CREATE POLICY registration_profile_update')[1]
        for text in ['c.person_id = people.id AND c.enabled',"'roles',to_jsonb(roles)","'qadam_id',qadam_id",'m.person_id = people.id',"= (CASE WHEN m.active",'char_length','btrim']:
            self.assertIn(text,profile)
        self.assertIn('USING(',profile)
        self.assertIn('WITH CHECK(',profile)
        self.assertIn("attname<>'profile'",profile)
        self.assertIn('REGISTRATION_IMMUTABLE_COLUMN_WRITABLE',profile)

    def test_accepted_authority_lock_and_atomic_insert_order_is_retained(self):
        sequence=['ua_clerk_begin','resetTrustedServerContext(client)','ua_clerk_identity_gate',
          'setTrustedClerk(client,who.issuer,who.userId)','ua_clerk_locate','mapped.rows[0]?.enabled===false',
          'this.newPersonId()','ua_clerk_person_lock','requireLiveClerk(who,now',
          'setTrustedPhase(client,"exchange")','await rows.flush(scope,before,state)','ua_clerk_commit']
        positions=[auth.index(x) for x in sequence]
        self.assertEqual(positions,sorted(positions))
        insert_order=[auth.index('"'+x+'"') for x in ['ua_clerk_person_insert','ua_clerk_member_insert','ua_clerk_identity_insert']]
        self.assertEqual(insert_order,sorted(insert_order))
        self.assertIn('throw new StorageUnavailable("commit_unknown")',auth)
        self.assertIn('ua_clerk_rollback',auth)

    def test_known_profile_source_hold_is_preserved_not_weakened(self):
        legacy=domain.split('const perform=async(tx:LockedTransaction)=>{')[1].split('private async locate')[0]
        self.assertIn('await authRows.flush',legacy)
        self.assertNotIn('setTrustedPhase',legacy)
        self.assertNotIn('setTrustedClerk',legacy)
        self.assertIn('Source dependency HOLD',delta)

    def test_known_activation_creator_admin_conflict_remains_open(self):
        self.assertIn("JOIN pg_catalog.pg_roles r ON r.oid=m.member OR r.oid=m.roleid WHERE r.rolname='ua_runtime'",activation)
        self.assertIn('implicit creator ADMIN',bootstrap)
        self.assertNotRegex(bootstrap,r'(?m)^REVOKE ua_runtime\b')

if __name__=='__main__':
    unittest.main(argv=['test_sql_derivations.py',*rest])
