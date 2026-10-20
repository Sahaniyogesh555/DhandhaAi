# Test plan: DhandhaAi

Build: this branch  Date: 2026-10-20  Env: local Vite dev + production build

Automated: `npm test` (25 engine tests, all passing), `npm run build`
(typecheck + bundle), python tools: parity / contrast / sweep / listing.
Not yet automated: browser click-through (no Playwright browsers in this
sandbox) - the manual cases below are the acceptance script for the live
preview; run them before any public launch.

| case | flow | type | steps | expected | auto | result |
| --- | --- | --- | --- | --- | --- | --- |
| F01-H1 | Free audit | happy | Landing -> Try demo -> Dashboard | Demo cafe loads with score, 4 factor bars, next actions | build+http 200 | pass (server) |
| F01-H2 | Free audit | happy | Sign up -> add business -> audit | Score computes from entered fields; checklist ordered | engine tests | pass |
| F01-E1 | Free audit | edge: empty business fields | Add business with name+city only | Low score, every missing item listed as fail with fix hint | engine tests (sparse) | pass |
| F02-H1 | Fix profile | happy | Audit -> Fix now (phone) -> save -> dashboard | GBP factor rises immediately | engine test | pass |
| F02-E1 | Fix profile | edge: duplicate business | Add second business, same name/phone | Duplicate warning shown before save | manual | pending manual |
| F03-H1 | Review reply | happy | Reviews -> Draft with AI -> Save reply | Personalised draft with reviewer name; marked Replied; score rises | engine tests | pass |
| F03-E1 | Review reply | edge: 1-star, angry | Draft reply for 1-star | Apology + direct phone, no blame language | engine tests | pass |
| F03-E2 | Review reply | edge: Nepali UI language | Language = Nepali -> draft | Devanagari reply | engine test | pass |
| F04-H1 | Social post | happy | Studio offer -> type offer -> Generate -> Approve & publish | Caption quotes the exact offer; post appears Published; poster previews | engine tests | pass |
| F04-N1 | Social post | negative: no headline | Click Generate with empty offer | Blocked with "AI drafts only from your facts" message | manual | pending manual |
| F04-N2 | Social post | negative: publish before generate | Try publish with no draft | Blocked: review-first gate | manual | pending manual |
| F04-E1 | Social post | edge: free quota exhausted | Publish 5th post on Free | Blocked with upgrade message; drafts/downloads still work | manual | pending manual |
| F05-H1 | Google update | happy | Studio -> Post to = Google -> Generate -> Schedule | Appears under Posts as Google update, scheduled | manual | pending manual |
| F06-H1 | Keywords | happy | Keywords after complete profile | Coverage % + in-profile ticks for services | engine tests | pass |
| F06-H2 | Competitors | happy | Add competitor figures | Table + gap advice updates | manual | pending manual |
| F07-H1 | Billing | happy | Billing -> Switch to Growth | Plan changes, quota rises, no payment taken (demo note shown) | manual | pending manual |
| S14-H1 | Support | happy | Raise ticket | Ticket listed with Open status (no error dead-end) | manual | pending manual |
| REG-1 | Landing | regression | Mini score checker: change answers | Score + top fixes update live | manual | pending manual |

Bugs found by automated tests during build: 1 (audit `earned` could exceed
`impact` when reviews/posts overshot targets) - fixed with capped scoring,
covered by regression test "earned never exceeds impact".
Open S1/S2 bugs: none known. Browser manual pass still required pre-launch.
