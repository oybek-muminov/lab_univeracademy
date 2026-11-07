# Backend191 guard + OBS-LOAD-1 publication for independent QA

Base commit: fa82166a5eaaa05a8ae254913039771e03e20bfb.
This publication combines the frozen 14-file local candidate, including the
same three guard files described by guard/candidate-manifest.json. The guard
subset and full candidate are byte-identical at those three paths.

The common production entry is an empty socket by default:
VITE_CLERK_SDK_ENABLED remains blank in the example. Public settings alone do
not mount the vendor form or start SDK/API requests. The existing window stays
in test/reserve. No new design, CSS, real provider settings or deploy change.

OBS-LOAD-1 is reproduced on the prior loader (one unhandled SDK rejection;
safe closed UI, API0). The pinned @clerk/shared4.44.1 helper is transformed only
at its exact SHA256 in Vite build and the dev optimizer. Joining script and
readiness promises observes both failures; no global error suppression exists.
All real provider URLs are intercepted in browser tests. No real Clerk UI/FAPI,
Google/email OTP or identity linking is verified by these results.

Author-local PASS: guard53, loader patch4, affected auth52; production loader3,
dev loader1, empty socket1, existing prebuilt synthetic regression7, common
production build2 browser cases. Typecheck/build, 14-file exact patch restoration,
191 Backend target plus2 owner checks and public-data review PASS.

Frozen reports retain the original NOT_UPLOADED/NOT_PART_OF_GUARD_ONLY_HANDOFF
labels from capture time. This authorized publication now includes both fixes.
It does not promote author-local PASS to independent QA or real-provider PASS.
Old failed harness attempts are excluded from passing evidence; their fixes are
documented in the technical source note. No cache, build output or old archive
is included. Source bytes, the exact patches and before/after hashes are frozen.

To reproduce, use the base checkout and apply candidate.patch in a new tree.
The manifest gives all14 target hashes. The guard-only patch is an alternative
subset, not an additional patch to apply on top of the combined patch.
Run the commands in workspaces/univeracademy/apps/mini-app/docs/obs-load-1-local.md.
OBS baseline-control belongs to the unpatched base in a separate checkout.

Independent OBS retest, actual provider/DB/RLS, WebView return, linking, Uzbek
vendor locale/tenant email, Brevo, main-project publication and deploy: NOT_RUN.
