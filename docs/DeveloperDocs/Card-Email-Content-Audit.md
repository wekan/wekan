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
| Linked boards | Current dates, spent time, overtime, due completion, archive state, active member names and voting; wrapper checklists/files remain local; target comments require each owner card to be readable | Linked-source SMTP and Details tests |

## Field inventory and remaining implementation

[Field inventory](Card-Email-Field-Inventory.json) classifies all 71 top-level
fields in the current Cards schema, including intentional exclusions. The
`ruleCardFieldInventory` test parses that schema and requires an inventory
update whenever fields are added or removed. It proves that fields were
classified, not that every display path is implemented. Black-box objects
still require the explicit nested-field policies described above.

Linked-board Details now includes current archive state/date, overtime, due
completion and public names of active target members. Members and Assignees
follow the same active-member list as the card getters; inactive, duplicate and
missing accounts do not produce extra rows. Target access is rechecked after
name resolution.

Linked-board local Details now uses the shared ordinary-card renderer with an
explicit local-field selection: creator, requesters/assigners, labels, stickers,
custom fields, notes, locations and relationships keep the wrapper board scope.
Target-owned dates, voting and member lists are excluded from that local
section. Custom-field policies and related-source chains enter the same durable
binding as source Details. A string-template title uses the live target title.

Linked-board discussion now groups public target-board comments by readable
owner card. The owner and any linked source chain must remain readable and
assigned to the actor when assigned-only restrictions apply. Deleted, missing,
foreign-board and unreadable owners are omitted. Author display names and
reaction summaries reuse the ordinary comment renderer; webhook state and
account secrets are excluded. Every included owner chain joins the durable
related-source evidence, and capture rechecks all included owners and the
board link before returning. This does not export every target card's checklists
or files: those remain on the local wrapper as in the existing card getters.

The board scan reads only comment ownership metadata before authorization and
rejects more than 1,000 discovered comment rows. Its rendered body is capped
at 768 KiB, alongside the existing final mail and source-binding limits. An
oversized capture fails instead of returning a silently truncated message.
The ordinary Discussion choice controls both local and target-board comments.

Local archive state/date and creation/modification/activity timestamps now
appear in each link wrapper section, independently of source archive state.
Card number and color follow `getRealCard()`: source-owned for linked cards,
local for linked-board wrappers. This completes the placement ownership pass.

Local recurrence and last recurrence now accompany placement, timers and the
six visible Scrum fields in `Linked card local details`. Recurrence setters
write the displayed card, so source recurrence alone did not cover it.

Timer model reads and session writes now both use the displayed card ID.
Completed work reads the linked source total through `getSpentTime()` and
awaits its save before clearing or advancing the local session.

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

Stored Sync command recovery remains partly unfinished. Offline confirmation
of independently verified acceptance for every recipient now records an immutable
decision and reconciles the exact receipt without sending again; see the
[Sync recovery workflow](../Features/ImportExport/Sync.md). Legacy unbound
commands, obsolete Details bindings, partial/unknown SMTP acceptance and online
operator resolution remain open. Snapshots are not automatically rewritten or
resent. Version-five source evidence now binds related-card titles to their complete
source chains and rechecks them on retries, including board-admin access used
for main-card content. Older Details commands require recovery. Custom-field definition fingerprints are also retained and rechecked, so a
public-to-admin-only change after capture blocks dispatch. Source bindings cover
current source identity, access and voting/Scrum disclosure settings; they do
not establish cross-document transactional consistency.
