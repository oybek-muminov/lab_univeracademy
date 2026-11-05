# UniverAcademy private preview

A private, static React/Vite presentation prototype for UniverAcademy (formerly Qadam), a planned national-certificate preparation platform. The public-facing brand is an all-subject education platform for national-certificate preparation. Never narrow hero copy, imagery, or navigation to physics. Subjects and real learning services are planned, not launched. Nothing here creates accounts, submits user data, or connects to a backend.

## Current identity (4 November 2026)

This is the continuation of Qadam, not a new project. Official name: **UniverAcademy**. Supplied repository URL: https://github.com/oybek-muminov/UniverAcademy. Public Telegram bot: https://t.me/univeracademybot (@univeracademybot). The bot link is a public contact destination; it does not establish working authentication, a Mini App, or a real exam. Backend/bot integration remains unverified. Never put bot tokens or API secrets in this client.

Canonical source remains `C:\Users\Oybek\Documents\Qadam\web`. This local repository currently has no Git remote; the rename does not add one or reconstruct remote history. Historical Qadam decisions and asset filenames below are retained as provenance. The existing graphic mark is reused without claiming a newly approved UniverAcademy logo.

This is a local review of the existing variant2+blur WIP. It is not visually approved or published. Existing demo warnings, all-subject content, palette, subject dialogs, scroll behavior and motion controls are retained. No push, publication, deployment, migration, credentials or hosting identifiers are changed.

## Stack

- React and Vite with TypeScript
- Tailwind CSS v4 for all styling
- Framer Motion for motion, respecting system reduced-motion preferences
- Actual shadcn/ui New York registry components: Button, Badge, Card, Dialog, Accordion, Sheet; Radix primitives supply accessible focus management and keyboard behavior
- Manrope is self-hosted from the npm font package. No external runtime requests are required.

## Commands

`npm ci`, `npm run dev`, `npm run typecheck`, `npm test`, `npm run build`.

## Scope and provenance

Public Qadam content inspected read-only at https://github.com/oybek-muminov/qadam, commit b3579339d1eacf1eef2b703c6b6bbe5d6c09a31d. Existing GitHub repository and GitHub Pages are unchanged. This implementation is an independent private preview.

shadcn/ui component source was retrieved from the official registry at https://ui.shadcn.com/r/styles/new-york/{button,badge,card,dialog,accordion,sheet}.json. Components retain the official composition and have only the close label localized to Uzbek. shadcn/ui is MIT-licensed: https://github.com/shadcn-ui/ui/blob/main/LICENSE.md.

## Design direction (owner request, 26 October 2026)
Warm premium minimalist landing, all-subject copy and illustration, subtle Uzbek-inspired geometry, three feature Cards, 300ms button hover and reduced-motion support. No invented testimonials, partnerships, learner counts or official endorsement. Preserve demo-only authentication. Existing private/custom audience and public GitHub Pages must not be changed.

## Approved visual direction (26 October 2026)
Oybek approved warm ivory, deep green and restrained gold; use subtle Uzbek-inspired geometry together with a restrained Uzbekistan landscape/architecture-inspired sample illustration. Illustration is original decorative artwork, not a photograph or a claim about a specific monument. No verified names, counts or testimonials are available; defer social proof. Telegram bot is requested for parallel planning, not yet implemented or advertised as live.

## Access surfaces and future bot flow (26 October 2026)
Web, a native mobile app, and Telegram chat are equal planned access surfaces with a common account, shared data and progress. Current implementation scope is ONLY the web landing prototype. Browser CTA opens honest demo authentication; Telegram/mobile show Tez kunda until real destinations are supplied. Do not advertise working synchronization, publish a fake bot/store link, build backend/bot, or change public GitHub without separate scope.

Future flow (planning only): Telegram chat selects video. “Ko‘rib tugatdim” opens a Mini App assessment with selected and typed answers. Scores below 70% lead to relearning. A common server is planned; this repository does not implement assessment, scoring, account linking, or synchronization. User will create the bot and supply its public username; never embed a bot token in the client.

## Typography refinement (26 October 2026)
User requested slightly larger fonts. Small8–10px labels become12px,11px becomes13px,12–15px text increases by2px,17px body becomes18px. Hero/section heading sizes remain unchanged to preserve hierarchy. Primary CTAs allow wrapping with minimum height; card footers wrap. This change does not replace the hero with the sample roadmap animation.

## National background correction
The user found the earlier motifs insufficiently visible. Keep a repeating eight-point geometric BACKGROUND across the hero, inspired by their HTML sample, with approved green/gold on warm ivory. Do not reduce it to tiny illustration details. Use a soft text-area wash for readability and visibly patterned margins; retain the larger v4 typography.

## Architectural identity extension
User requested more than background motifs: navigation now has visible historic tile-inspired geometry and a narrow turquoise/gold tile edge; hero illustration includes a substantial128–144px peshtoq, turquoise dome and minaret panorama. Original stylized art, not an exact monument, national emblem or official endorsement. Keep text legible and retain v4 typography/v5 hero background.

Navigation readability: desktop nav14px→17px semibold dark ink, login14px→16px, register13px→15px. Mobile menu remains18px; collapse desktop navigation below1280px rather than crowding enlarged labels. Ivory link backing separates text from tile pattern.

## Authoritative sample typography/navigation override
Latest user correction supersedes earlier enlarged nav and tile background: Onest400/500/600 body17px/1.6, Young Serif400 headings/logo; h1clamp40–72px, h2clamp30–46px, h3 22px, logo26px. Sticky top0 header68px, rgba(255,249,239,.9),blur10px,thinborder,nav15px/gap26px. Removed navigation pattern/edge/linkpill backgrounds. Hero pattern and all-subject honest content remain. v0 was not used; no v0 connector available.

## Sample body architecture is now authoritative (26 October 2026)
User explicitly requested body architecture from F0CC9N9QB4L, not just fonts/nav. v8 replaces previous section sequence/illustration with source-sample split hero, exact winding SVG road and2.4s draw, sand two-column pathways/demo panel,4-column about grid/notice, bottom access banner and simple footer. Sample CSS dimensions,palette,spacing,Onest/YoungSerif and sticky translucent header retained. Three shadcn cards now use the sample's stacked pathway rows (latest layout overrides prior3column cards). Only physics-specific content and unsupported first/free/live/certificate claims generalized or corrected. Demo quiz has3subjects, local transient score only, explicit Next rather than timed advance for reading accessibility. Browser demo remains; bot/mobile unavailable. No backend or persistent profile. Architecture/typography tests are source assertions, not screenshot/E2E verification.

## Full-screen stacked boards (27 October 2026)
Owner approved cloud-only UI edits, with computer migration deferred until separately requested. The landing now uses opaque viewport-minimum boards, native sticky stacking and scroll snapping: incoming sections cover the previous board while the translucent navbar stays above the stack. Pathways and assessment are separate navigable boards; all sample typography, palette, brand and honest demo content remain. Navigation is Bosh sahifa, Fanlar, Bilimni baholash, Platforma haqida with visible active underline and aria-current. Natural section offsets support forward/back history, old #yollar links, resized headers and keyboard focus. Oversized panels can scroll fully; reduced motion disables stacking/snapping and smooth navigation. No wheel/touch scroll interception. Tests include source assertions; browser checks separately verify actual desktop behavior.

## Continuous native scrolling correction (27 October 2026)
Latest owner request supersedes v9 mandatory snapping. Removed snap markers and mandatory scroll snapping; CSS sticky positioning now follows native scroll displacement directly in both directions, without wheel/touch interception, delayed easing or threshold handoffs. Smooth animation is used only for explicit navbar links. At section-aligned stops the next board remains offscreen; a user who stops halfway through a transition stays there rather than being forcibly advanced. Tall-content scrolling, keyboard focus, reduced motion, navbar active state and anchor history remain.

## Owner attachment hero animation (27 October 2026)
Read full 17,975-byte HTML F0CCJLHHU22 (Qadam — kirish sahifasi.html). Replaced the Framer path/spring approximation with the attachment's own SVG generation and requestAnimationFrame dash algorithm: 2400ms cubic-out (1-(1-k)^3), actual path length, 3000 dash gap; original positions, node circles/check/play/lock/star geometry, activation timeout AND CSS delay, .5s cubic-bezier(.3,1.6,.5,1) pop, 2s pulse, chip staggering/bob. One-shot on mount/reload, not replayed on scroll, matching the file. Only labels/chip text adapted to honest all-subject Qadam. Added React unmount cleanup and retained reduced-motion/pause accessibility. Browser comparison of generated shapes, path, final dash and computed node delays/easing matched the actual reference exactly. Temporary reference QA files removed before packaging.

## Roadmap polish and supplied logo (27 October 2026)
Latest owner request: start chip now reads “Har kim boshlashi mumkin”, raised from bottom6% to16%; final stage is Natija. Adjacent panels use ivory/sand/ivory/pale teal/sand. The v10 reference pulse existed but its initially overlapping opaque core plus fade-to-zero made it intermittent; persistent blurred red halo now supplements it. Assessment ring fills in an8s illustrative cycle, turns teal-green, opens lock, then coordinates a gold Natija halo. This is a visual assessment-gate explanation, not actual backend scoring/unlocking. Paused/reduced-motion states show a full green ring/open lock and static visible halos. Original path draw and node appearance retained.
Logo ZIP qadam-kitob-strelka-favicon.zip inspected safely (only image assets/README; no traversal/symlinks), actual512px transparent blue book/orange arrow viewed before use. Exact original assets used at /brand; square navbar mark alongside existing Qadam text, multi-size ICO and PNG favicons. No recoloring or redesign. Desktop/mobile390×640 browser QA confirms chip/start-node separation (mobile gap21px at sampled phase), loaded512px logo, distinct adjacent computed backgrounds, live animation state changes, and meaningful pause state. Physical touch/OS reduced-motion not emulated.

## Owner wording update (27 October 2026)
Five exact owner-provided roadmap phrases replace the short labels, including original spelling. HTML overlays retain readable 13px desktop/12px mobile text with wrapping rather than scaling long SVG text down. Start chip adjusted to bottom12% to separate it from both the longer preceding label and start node. Desktop and 390px iframe visual QA passed; all15 tests and TypeScript passed. Combined logo, animation and wording publication explicitly requested by owner; existing URL and custom audience retained.

## Light background restoration (28 October 2026)
Compared v10 and v11 source palettes. Restored original ivory/sand section family in alternating order: hero ivory, subjects sand, assessment ivory, about sand, access ivory. Only two section background declarations changed; existing cards, text, logo, animations, navigation and scroll behavior unchanged.

## Hero copy and entry modes (28 October 2026)
Supporting copy polished into Uzbek Latin per owner request; main heading retained. Added informational Web/Telegram/Mobil ilova Lucide icons immediately below the final learning-anywhere sentence. Web marked Demo; other two marked Rejalashtirilmoqda with no fake links. Existing prototype notice retained. Desktop and390px mobile preview verified;17 tests passed. Save-only pending publication approval.

## Entry launch controls (28 October 2026)
Owner approved publishing with clean Web/Telegram/Mobil ilova buttons, removing their visible status captions. Each new entry button shows native alert “Bu kirish yo‘li hali ishga tushirilmagan.” No fake navigation or account creation. Unrelated quiz/account demos remain unchanged. Mouse Web activation, Enter/Space activation, dismissal and repeated alert checked in browser; native dialog caused automation click timeout but active alert was read and dismissed successfully. Mobile wrapping checked.17 tests pass.

## Icon-only entry controls (28 October 2026)
Removed visible three-mode names per owner correction; aria-labels retained, each circular button46×46px. Alert handler unchanged. Desktop/mobile screenshots, DOM accessible-name/empty-text/target-size checks and Enter alert/dismiss verified.18 tests pass; all unrelated content preserved.
