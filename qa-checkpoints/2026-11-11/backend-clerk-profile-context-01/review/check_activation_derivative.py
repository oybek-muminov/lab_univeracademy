"""Static preservation/contract checks only; no SQL evaluation or DB access."""
import argparse
import hashlib
import json
from pathlib import Path
import unittest

p=argparse.ArgumentParser();p.add_argument('--activation-input',type=Path,required=True)
args,rest=p.parse_known_args();root=Path(__file__).resolve().parent
old=args.activation_input.read_text()
new=(root/'first-student-trusted-server.activation.creator-admin.review.sql').read_text()
cases=json.loads((root/'runtime-creator-membership.cases.json').read_text())
sha=lambda s:hashlib.sha256(s.encode()).hexdigest()

class ActivationSourceChecks(unittest.TestCase):
    def test_exact_r3_dependency(self):
        self.assertEqual((len(old.encode()),sha(old)),(60365,'165711ecb98d46b0aea87253b172e9c535d53090626f6574d106ae34643be52d'))

    def test_only_roles_preflight_changes(self):
        a=old.index('DO $roles$');b=old.index('END $roles$;',a)+len('END $roles$;')
        c=new.index('DO $roles$');d=new.index('END $roles$;',c)+len('END $roles$;')
        self.assertEqual(new[:c]+old[a:b]+new[d:],old)
        invariant='  IF (SELECT count(*) FROM pg_catalog.pg_class'
        self.assertEqual(old[old.index(invariant,a):b],new[new.index(invariant,c):d])

    def test_both_catalog_witnesses_are_strict_and_runtime_remains_inert(self):
        for text in ["SELECT r.oid INTO STRICT operator_oid", "r.rolname='postgres' AND r.oid=current_user::regrole",
          'current_user=session_user AND NOT r.rolsuper AND r.rolcreaterole AND r.rolbypassrls',
          'SELECT r.oid INTO STRICT bootstrap_oid',"r.oid=10 AND r.rolname='supabase_admin' AND r.rolsuper",
          "rolname='ua_runtime' AND NOT rolsuper AND NOT rolbypassrls AND NOT rolcanlogin AND NOT rolinherit AND NOT rolcreaterole AND NOT rolcreatedb AND NOT rolreplication"]:
            self.assertIn(text,new)

    def test_exact_single_row_not_any_usable_membership(self):
        for text in ['WHERE m.roleid=runtime_oid OR m.member=runtime_oid)<>1',
          'WHERE m.member=runtime_oid)',
          'WHERE m.roleid=runtime_oid AND m.member=operator_oid AND m.grantor=bootstrap_oid',
          'AND m.admin_option AND NOT m.inherit_option AND NOT m.set_option']:
            self.assertIn(text,new)
        self.assertEqual(new.count('DECLARE operator_oid oid; bootstrap_oid oid; runtime_oid oid;'),1)

    def test_negative_cases_are_retained_as_not_executed_data(self):
        expected={'exact_creator_admin_only','missing_creator_row','wrong_member','wrong_grantor','admin_false',
          'inherit_true','set_true','extra_runtime_role_member','runtime_as_member_only',
          'runtime_as_member_plus_creator','duplicate_metadata_rows'}
        self.assertEqual({x['name'] for x in cases['cases']},expected)
        self.assertEqual([x['name'] for x in cases['cases'] if x['accept']],['exact_creator_admin_only'])
        self.assertIn('actual PostgreSQL evaluation NOT_RUN',cases['status'])
        for text in ['bootstrap_oid_not_10','bootstrap_name_not_supabase_admin','operator_oid_not_current_user','runtime_LOGIN','runtime_BYPASSRLS']:
            self.assertIn(text,cases['catalog_witness_negatives'])

    def test_inactive_guard_and_original_cleanup_remain(self):
        self.assertLess(new.index("RAISE EXCEPTION 'REVIEW_ONLY_"),new.index('\nBEGIN;'))
        self.assertTrue(new.endswith('ROLLBACK;\n'))
        self.assertEqual(new.count('GRANT '),old.count('GRANT '))
        self.assertEqual(new.count('REVOKE '),old.count('REVOKE '))
        self.assertIn('OWNERSHIP_TRANSFER_PRIVILEGE_SURVIVED',new)

if __name__=='__main__':unittest.main(argv=['check_activation_derivative.py',*rest])
