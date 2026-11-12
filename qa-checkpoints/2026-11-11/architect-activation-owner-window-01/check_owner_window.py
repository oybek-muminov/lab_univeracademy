"""Data-only source checks. No SQL parser, driver, subprocess or network."""
import argparse
import difflib
import hashlib
from pathlib import Path
import re
import unittest

parser=argparse.ArgumentParser()
parser.add_argument('--source',type=Path,required=True)
args,remaining=parser.parse_known_args()
root=Path(__file__).resolve().parent
old=args.source.read_bytes()
new=(root/'activation.owner-window.review.sql').read_text()

def block(label):
    match=re.search(r'-- BEGIN TEMPORARY PRIMARY OWNER '+label+r'\n(.*?)-- END TEMPORARY PRIMARY OWNER '+label+r'\n',new,re.S)
    assert match
    return match.group(0)

class OwnerWindowChecks(unittest.TestCase):
    def test_pinned_input_and_exact_reconstruction(self):
        self.assertEqual((len(old),hashlib.sha256(old).hexdigest()),(61385,'3c4ae9ddd436807329d9db298eda42ef9a34af715d74c8d3ded71c1602d4fae4'))
        self.assertEqual(new.replace(block('WINDOW'),'').replace(block('CLOSURE'),'').encode(),old)

    def test_diff_independently_reproduces(self):
        expected=''.join(difflib.unified_diff(old.decode().splitlines(True),new.splitlines(True),fromfile=args.source.name,tofile='activation.owner-window.review.sql'))
        self.assertEqual((root/'activation.owner-window.diff').read_text(),expected)

    def test_inactive_single_transaction_preserved(self):
        self.assertEqual(len(re.findall(r'^BEGIN;$',new,re.M)),1)
        self.assertEqual(len(re.findall(r'^ROLLBACK;$',new,re.M)),1)
        self.assertTrue(new.endswith('ROLLBACK;\n'))
        self.assertNotRegex(new,r'(?m)^COMMIT;')
        self.assertLess(new.index("RAISE EXCEPTION 'REVIEW_ONLY_"),new.index('\nBEGIN;'))

    def test_exact_grant_and_revoke_order(self):
        grant='GRANT ua_owner TO CURRENT_USER WITH ADMIN FALSE, INHERIT TRUE, SET TRUE GRANTED BY CURRENT_USER;'
        revoke='REVOKE ua_owner FROM CURRENT_USER GRANTED BY CURRENT_USER RESTRICT;'
        self.assertEqual(new.count(grant),1);self.assertEqual(new.count(revoke),1)
        self.assertLess(new.index('END $owner_window_before$;'),new.index(grant))
        self.assertLess(new.index(grant),new.index('DO $transfer_operator$'))
        self.assertLess(new.index('END $transfer_closed$;'),new.index(revoke))
        close=block('CLOSURE')
        self.assertLess(close.index('SET LOCAL ROLE NONE;'),close.index(revoke))
        self.assertLess(new.index(revoke),new.index('DO $owner_window_closed$'))
        self.assertLess(new.index('END $owner_window_closed$;'),new.rindex('ROLLBACK;'))

    def test_preexisting_owner_authority_is_not_adopted(self):
        before=block('WINDOW').split('END $owner_window_before$;')[0]
        for text in ["r.rolname='postgres' AND r.oid=current_user::regrole",'current_user=session_user AND NOT r.rolsuper AND r.rolcreaterole AND r.rolbypassrls',"r.oid=10 AND r.rolname='supabase_admin' AND r.rolsuper", "current_setting('createrole_self_grant') IS DISTINCT FROM ''", "pg_catalog.pg_has_role(current_user,'ua_owner','SET')", "pg_catalog.pg_has_role(current_user,'ua_owner','USAGE')", "m.roleid='ua_owner'::regrole OR m.member='ua_owner'::regrole)<>1", 'm.member=current_user::regrole AND m.grantor=10', 'm.admin_option AND NOT m.inherit_option AND NOT m.set_option']:
            self.assertIn(text,before)

    def test_explicit_self_grant_is_verified_then_completely_closed(self):
        opening=block('WINDOW');closing=block('CLOSURE')
        self.assertIn('m.grantor=current_user::regrole AND NOT m.admin_option AND m.inherit_option AND m.set_option',opening)
        for text in ["pg_catalog.pg_has_role(current_user,'ua_owner','SET')", "pg_catalog.pg_has_role(current_user,'ua_owner','USAGE')", 'm.grantor=current_user::regrole', "m.roleid='ua_owner'::regrole OR m.member='ua_owner'::regrole)<>1", 'm.member=current_user::regrole AND m.grantor=10', 'm.admin_option AND NOT m.inherit_option AND NOT m.set_option', "pg_catalog.pg_has_role(current_user,'ua_runtime','SET')", "pg_catalog.pg_has_role(current_user,'ua_runtime','USAGE')", "pg_catalog.pg_has_role('ua_runtime','ua_owner','MEMBER')"]:
            self.assertIn(text,closing)

    def test_no_registration_or_other_side_effects_added(self):
        additions=block('WINDOW')+block('CLOSURE')
        self.assertNotRegex(additions,r'(?im)^\s*(INSERT|UPDATE|DELETE|TRUNCATE|DROP|CREATE|ALTER|COMMIT)\b')
        self.assertNotRegex(additions,r'(?im)^SET (?!LOCAL ROLE NONE;)')
        self.assertEqual(re.findall(r'(?m)^(?:GRANT|REVOKE).+$',additions),['GRANT ua_owner TO CURRENT_USER WITH ADMIN FALSE, INHERIT TRUE, SET TRUE GRANTED BY CURRENT_USER;','REVOKE ua_owner FROM CURRENT_USER GRANTED BY CURRENT_USER RESTRICT;'])
        self.assertNotIn('registration_people_insert',new)

if __name__=='__main__':
    unittest.main(argv=['check_owner_window.py',*remaining])
