# Implementation of the useful audit findings

Implemented on 2026-09-19 following [Audit.md](Audit.md). That file remains the historical audit
of the unpatched source; the results below concern the integrated implementation.
The proposals were adapted to current code rather than applied as a patch file.

## Adopted changes and improvements

| Findings | Implementation and usefulness |
| --- | --- |
| F01 | Checklist rule actions save input strings instead of DOM elements, allowing the executor to find the named checklist and item. |
| F02, F06 | All five relative-position dialogs and keyboard card moves use a shared insertion planner. It excludes the moving card and deleted/archived neighbors, uses fractional gaps, and spaces tied ranks in stable ID order. Bulk insertion below advances its anchor. |
| F03, F04, F13 | Destination subscriptions belong to their popup. Request generations reject stale callbacks even across repeated board selections; teardown stops subscriptions. Missing boards and lanes are safe, and loading/error state prevents premature submission. |
| F05 | Failed operations retain the dialog and entered values. Submission is awaited, guarded against double activation and closed only on success. |
| F07 | Keyboard list moves consider visible swimlane/shared lists, exclude deleted lists, await updates and repair tied ranks. |
| F08 | Rebuilding a calendar preserves the user's selected view instead of resetting to the configured initial view. |
| F09, F10 | Duplicate custom translations retain the form; other failures are shown. Search punctuation is escaped and treated literally. |
| F11 | Board shortcuts safely return outside a board. |
| F12 | Overtime is a popup draft until Save; cancellation no longer changes the card. |
| F14 | Remove four inert minicard settings. Working detailed-card controls and stored configuration remain available. |
| F15 | Attachment background actions use their own attachment context; keyboard activation no longer depends on a previous mouse hover. Add/Remove await persistence and retain the popup on rejection; Remove reloads only after the save, fixing a race reproduced in Firefox. |
| F16 | Checklist visibility switches have unique template-instance IDs, including when one card is rendered twice. |
| F17 | The attachment viewer is mounted once in the shared layout, available to cards and administrative views. |
| V01 | Popup header/content offsets and member-popup spacing scale with the font preference, on desktop and mobile. |
| V02 | Gantt labels and bar/header geometry scale together, leaving room for larger text. |
| V03 | Logical profile spacing supports RTL layout. |
| V04 | Completion controls and minicard titles share a flex row rather than relying on a pixel offset. |
| V05 | Progress fills have no width-increasing horizontal padding; full progress fits the track. |
| V06 | Long checklist/attachment text can wrap; metadata can wrap without forcing an oversized column. |
| V07 | Settings use shrinkable columns and stack on mobile. The malformed proposed selector was discarded and desktop heading scope preserved. |
| T01 | Missing labels reuse canonical existing translated keys. No human locale translations were replaced and no English-only keys were added. |
| T02 | Custom translations accept registered language tags up to 35 characters, including zh-Hans, and reject unregistered tags. |
| T03 | Account-operation errors map to translated messages, with last-administrator errors taking precedence over generic authorization errors. |
| A01 | Board shortcuts ignore focused native controls and interactive roles; Escape retains its behavior. |
| A02 | Rule action/trigger controls are native non-submit buttons with action-specific accessible names. |
| A03 | Every destination picker label names its own uniquely identified select. |
| A04 | Selected timeline controls use a darker contrasting background. |
| A05 | Password reveal is keyboard reachable and non-submitting. This intentionally changes the previous tested policy of skipping the toggle in Tab order. |
| A06 | Unavailable field-order arrows expose disabled state and reject activation. |
| A07 | Editable checklist rows handle Enter/Space through the existing checkbox action, reject descendant events and held-key repetition, and expose permission state. Blaze's wrapped native event is checked too. |
| A08 | Preview and viewer controls are named native buttons. The viewer traps Tab, closes on Escape and returns focus to its opener. Navigation retains the original opener. |
| A09 | Switch inputs remain focusable with a visible focus indication and accessible labels. |

## Verification and limits

The repository's `build.sh` workflow and `AGENTS.md` were followed using a fresh
Meteor directory bundle, repository-local Node 24.21.0, Meteor 3.6-beta.0 and a
separate MongoDB database/storage directory under `.tools/tmp`. This was not a
release or a run of every build-menu option. Build output reported dependency
warnings and inotify watcher limits; the bundle built successfully and served the
application tests.

The added `tests/acceptedFixesLogic.test.cjs` executes ordering, asynchronous dialog
lifecycle, failed submission, rule payload, search, calendar state, overtime and
localized-error behavior, including negative cases. Existing layout/accessibility
regressions were updated for the intentional new behavior. The two
`accepted-audit-*.e2e.js` Playwright suites exercise the compiled application and
persisted data, rather than injecting replacement application code. One submission
failure is deliberately injected to test retention and retry.

- All **1,176 plain-Node suites passed** (150 seconds). After the final background
  persistence correction, all **15 focused attachment/logic suites passed**.
- The two new Playwright suites cover **12 scenarios in Chromium and Firefox**.
  Their first combined run passed 23/24; Firefox exposed a reload-before-save race
  in background removal. After awaiting the save, the final fresh bundle passed
  this scenario in both browsers (**two passes**), completing all 24 distinct
  scenario/browser combinations across the runs.
- The two reported issue regressions passed in both browsers: **eight checks**
  covering repeated list collapse/drag/reload (#6705), password and LDAP-shaped
  account mention suggestions (#6704), including a now-retired configuration
  check. These account
  fixtures do not authenticate against an external LDAP server.
- Long-tag creation, duplicate retention, literal search and unsupported-tag
  rejection passed in both browsers in a further **two checks**.
- Local build/test logs and browser traces are under
  `.tools/log/2026-09-19_accepted-fixes/` (intentionally not committed).

Rare tied-rank repairs involve multiple writes and are not database transactions;
this change does not promise atomic ordering under simultaneous concurrent moves.
Not every combination of bulk copying, permissions, language, theme and viewport
was browser-tested. No live LDAP, FerretDB integration, screen-reader session or
full browser suite was run. WebKit cannot run with the available host libraries.
