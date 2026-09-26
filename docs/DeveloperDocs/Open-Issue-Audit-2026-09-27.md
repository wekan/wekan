# Open-issue audit follow-up — 2026-09-27

The refreshed GitHub snapshot contained 149 open issues, excluding pull
requests. It matches the remaining inventory in the
[previous audit](Open-Issue-Completion-Audit-2026-09.md). Candidate issue bodies
and all their comments were fetched again. Current source, executable tests
and browser behavior were checked before selecting closing keywords.

This pass prepares closures for seven existing implementations and fixes two
incomplete implementations. Other requests remain open; neither a matching
helper name nor a partial implementation is sufficient evidence to close them.
The closing keywords take effect after the maintainer pushes the local commits.

## Existing implementations verified

| Issue | Current implementation and verification |
| --- | --- |
| [#5061: OIDC logout](https://github.com/wekan/wekan/issues/5061) | `OAUTH2_LOGOUT_ENDPOINT` configures the provider end-session redirect. `server/models/settings.js`, `server/lib/oauthLogoutUrl.js` and `config/accounts.js` connect the setting to the logout hook. URL construction, the actual hook and the unset-setting fallback pass executable tests. The pure helper has existed since `2e752c1e9` (2026-09-10). No live Keycloak session was tested; provider configuration is still required. |
| [#1938: case-insensitive mentions](https://github.com/wekan/wekan/issues/1938) | The shared `memberAutocomplete` matcher lowercases both the search term and username/full name. Add-card and comment/description editors use it. The helper has existed since `2328bcd0f` (2026-07-22). Browser tests type uppercase usernames for password and LDAP members and select the matching suggestion; nonmatching terms return no suggestion. |
| [#3114: remotely removed mobile card stays open](https://github.com/wekan/wekan/issues/3114) | `openCardPresence` and the card-details autorun close unavailable cards and clear desktop, popup and route state. The helper has existed since `951b072b5` (2026-08-25). Real browser tests cover remote deletion and moving the open card to another board with a mobile viewport. |
| [#1686: member picker ordering](https://github.com/wekan/wekan/issues/1686) | `cardMembersPopup.members` alphabetizes names after deduplicating the board members; `filterMembers` supports typing. A browser test verifies that a normal Alpha Member sorts before Zulu Admin, uppercase filtering works, and an unmatched term produces an empty list. |
| [#2160: multi-card colors](https://github.com/wekan/wekan/issues/2160) | `setSelectionColorPopup` applies the chosen color to the current `MultiSelection` through each card's setter. A browser test selects two cards, saves red, checks both persisted colors and verifies an unselected card is unchanged. The later suggestion about custom color palettes is separate from the requested bulk operation. |
| [#3213: existing cards as subtasks](https://github.com/wekan/wekan/issues/3213) | The Subtasks picker calls the existing card's `setParentId`; it does not clone the card. Regression coverage was added in `27f5051be` (2026-09-10). Browser verification checks the existing card ID, parent ID and unchanged card count. Existing cycle guards remain covered. Completion remains archive-based; this closure does not claim that an end-date field is a completion checkbox. |
| [#3198: minicard field visibility](https://github.com/wekan/wekan/issues/3198) | `definition.showOnCard` gates the custom value on minicards, while full-card rendering retains it. Received/start/due/end minicard settings have separate board flags in `cardSettingsRows` and `getMinicardFlag`. Browser verification hides a custom value on the minicard and confirms it remains in the opened card. Card-setting coverage has existed since `970213010` (2026-09-11). |

## Bugs reproduced and fixed

### #5683 — same-board linked cards

Labels already resolved from the original card through `Cards.labels()` and
label setters already targeted `getRealId()`. However, the board selector
excluded the current board, the card selector excluded every real card on that
board, and `createLinkedCard` rejected a source on the destination board.

The picker now includes the current board and excludes only already mirrored
sources. The server accepts a real same-board source while retaining source
and destination write checks and coordinate validation. Linked pointers and
templates remain invalid. Both whole-board-link buttons reject self-links.

The old method failed the new same-board regression. Chromium now creates the
mirror through the picker, sees source label changes immediately, and removes
a label through the mirror while verifying the original's persisted value.
Negative tests reject pointer chains, read-only writes and whole-board
self-links. Existing cross-board linking and comment-only permission tests pass.
See [Linked cards](../Features/Cards/Linked-Cards.md).

### #1023 — undo a deleted list together with its cards

A browser/database regression demonstrated that `changeHistory.undoLast`
restored the list while leaving `deletedAt` on its cards. The list lifecycle
applier updated only the list document; unlike `lists.restore`, it never
restored the deletion batch's cards.

The history applier now reuses the soft-delete modifiers and applies them to
the list and its cards. Restore selectors require the same board, list and
deletion batch. Redo marks only live cards, preserving independent deletions.
New lifecycle content carries the original batch through explicit history
restores; older rows can use the batch already stored on the deleted list.
Lifecycle snapshots now describe the real deletion state. Rows for lists moved
to another board are not applied under their old board's authorization.

Browser tests exercise undo, redo and undo again, checking both visible cards
and stored deletion markers. A separately deleted card stays deleted. A
read-only member's undo is rejected without restoring anything. Pure tests
also cover missing batches, invalid dates and cross-board list mismatches.
Permanently purged content remains unrecoverable.

These are application-side selection/replay defects. The current FerretDB
query handler and the existing equality/null/multi-update operations were
reviewed; no new database operator or FerretDB patch is needed.

## Deliberately retained after deeper inspection

- **#2644:** Archive/clone confirmation handlers exist in `boardsList.js`, but
  the corresponding All Boards tile controls are absent. A browser check could
  not exercise the claimed feature. Do not close it based on dead handlers.
- **#5141:** Board-admin methods and sidebar controls exist, but the `org` and
  `team` publications still restrict what ordinary board admins can choose.
  Method authorization alone does not establish an accessible end-to-end flow.
- **#2131:** The add-swimlane handler still inserts after the current swimlane;
  the requested above/below choice is absent.
- **#4256 / #4906:** Per-board label text exists, but comments also request
  independently remembered views and other per-board settings. Keep the wider
  requests open rather than treating a label test as proof of every preference.
- **#4223:** Bigboard exists, but the thread expands into synchronized project
  and swimlane aggregation. The broad request is not closed by the dashboard
  alone.
- **#1704 / #4250:** Move implementations exist, but complete cross-board
  metadata and permission behavior was not validated in this pass. Their
  passing helper/source tests are not presented as end-to-end proof.
- Deployment-specific requests, open-ended integrations and the remaining
  inventory from the previous audit are not declared completed by this pass.

## Validation

31 focused Node suites pass, including positive/negative history plans,
existing linked-card behavior, OIDC logout, mentions, card settings and
flow/time calculations. All 27 distinct Chromium scenarios pass, covering
real mutations, rejected
writes, same- and cross-board mirrors, deletion batches, mobile card closure,
existing feature flows, and PDF/Excel and time-history regressions.

The local Meteor app compiles and runs with a repository-local `WRITABLE_PATH`
and `WITH_API=true`. No dependencies or schemas were added. Live external IdP,
LDAP deployment, other browser engines and the FerretDB backend matrix were
not tested. A successful local URL/hook test does not certify a particular
identity provider's logout configuration.
