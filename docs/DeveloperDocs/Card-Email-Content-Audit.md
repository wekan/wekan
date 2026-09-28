# Card email content audit

Scope: issue #2713's request to email a card and its content, including files.
This audit compares the current email preparation code with `models/cards.js`,
`models/checklists.js`, `models/checklistItems.js`, `models/cardComments.js` and
`models/lib/cardDocument.js`. It is not a claim that the entire request is done.

| Content | Current email behavior | Evidence / remaining work |
| --- | --- | --- |
| Title, description, card link | Included with configured subject/body | Rule email Chromium SMTP scenarios |
| Placement, labels, people, dates, time, location, custom fields, notes and relationships | Canonical and legacy Gantt targets are grouped; Details opt-in; referenced cards require read/assignment access; custom fields honor admin-only policy | `tests/ruleCardDetails.test.cjs`; SMTP tests |
| Creator, stickers, archive/activity timestamps, ordering and move reason | Public creator name and explicit scalar fields under Details | Details unit tests; creator/sticker SMTP assertions |
| Flowtime, Pomodoro, recurrence | Persisted fields, public session-owner names; unfinished time is not added to completed hours | Details unit tests; SMTP assertions |
| Voting and Poker | Counts, public voter names, completed Poker choices; visibility checked before dispatch | Details/source-binding tests; ordinary and linked-board SMTP |
| Scrum card metadata | Six visible fields; sprint/release names scoped to source board | Details/source-binding tests; SMTP assertions |
| Checklists | Titles, item text/completion, checklist/item due dates, completion date, reset interval, last reset and readable converted-subtask titles | `tests/ruleCardDiscussion.test.cjs`; SMTP assertions |
| Comments | Public prose, creation/edit dates, public author display name, reaction emoji and distinct counts | Discussion unit tests; SMTP assertions |
| Files | Selected live attachments become immutable byte snapshots; names/MIME types retained; manifest identifies cover, captured byte size, upload date and public uploader | Filesystem/GridFS SMTP; bounded-stream unit tests |
| Linked cards | Resolve readable source chain for selected content; detect retargeting and access loss | `tests/ruleEmailSource.test.cjs`; linked-source SMTP |
| Linked boards | Current board display fields and voting; wrapper discussion/files remain local | Linked-source SMTP and Details tests |

## Unfinished checks and implementation

- Linked wrappers: check which timer, Scrum, sticker and placement fields belong
  to the wrapper rather than the resolved source. The current linked-board
  branch does not render all wrapper metadata. Verify the intended UI behavior
  and retain both applicable scopes with unambiguous labels.
- Complete a final field-by-field pass after linked-wrapper ownership is
  resolved.

The filesystem and GridFS SMTP scenarios also move the card through the
authenticated REST endpoint into a rule-selected list with all three content
choices enabled. They verify the move activity, card placement, Details,
checklists/comments and actual attachment bytes. Unauthorized moves and moves
away from the selected list must not send a message. Button-trigger coverage
continues to verify each content choice independently.

Legacy Gantt targets are now included with the documented default dependency
types when target/type arrays align; malformed or missing types use a generic
Gantt-target label. `linkId_gantt` is an internal link identifier, not a card
reference or display field. Current Gantt views do not consume these legacy
arrays (`dhtmlxGantt.js` supplies an empty links array), but existing data is
retained in the email relationship summary. Canonical and legacy labels for
one target share a single title and the same source-access evidence.

Display preferences, internal Sync provenance/revisions, deletion bookkeeping
and security/transport state are not prose to serialize wholesale. A new field
must be classified by its user-visible meaning before adding it to email.

Stored Sync command recovery remains unfinished: unbound
legacy commands and uncertain SMTP attempts still require an operator workflow.
Snapshots are not automatically rewritten or resent. Version-five source evidence now binds related-card titles to their complete
source chains and rechecks them on retries, including board-admin access used
for main-card content. Older Details commands require recovery. Custom-field definition fingerprints are also retained and rechecked, so a
public-to-admin-only change after capture blocks dispatch. Source bindings cover
current source identity, access and voting/Scrum disclosure settings; they do
not establish cross-document transactional consistency.
