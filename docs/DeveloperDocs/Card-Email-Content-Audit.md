# Card email content audit

Scope: issue #2713's request to email a card and its content, including files.
This audit compares the current email preparation code with `models/cards.js`,
`models/checklists.js`, `models/checklistItems.js`, `models/cardComments.js` and
`models/lib/cardDocument.js`. It is not a claim that the entire request is done.

| Content | Current email behavior | Evidence / remaining work |
| --- | --- | --- |
| Title, description, card link | Included with configured subject/body | Rule email Chromium SMTP scenarios |
| Placement, labels, people, dates, time, location, custom fields, notes and relationships | Details opt-in; referenced cards require read/assignment access; custom fields honor admin-only policy | `tests/ruleCardDetails.test.cjs`; SMTP tests |
| Creator, stickers, archive/activity timestamps, ordering and move reason | Public creator name and explicit scalar fields under Details | Details unit tests; creator/sticker SMTP assertions |
| Flowtime, Pomodoro, recurrence | Persisted fields, public session-owner names; unfinished time is not added to completed hours | Details unit tests; SMTP assertions |
| Voting and Poker | Counts, public voter names, completed Poker choices; visibility checked before dispatch | Details/source-binding tests; ordinary and linked-board SMTP |
| Scrum card metadata | Six visible fields; sprint/release names scoped to source board | Details/source-binding tests; SMTP assertions |
| Checklists | Titles, item text/completion, checklist/item due dates, completion date, reset interval and last reset | `tests/ruleCardDiscussion.test.cjs`; SMTP assertions |
| Comments | Public prose, creation/edit dates, public author display name, reaction emoji and distinct counts | Discussion unit tests; SMTP assertions |
| Files | Selected live attachments become immutable byte snapshots; names and MIME types retained | Filesystem/GridFS SMTP; bounded-stream unit tests |
| Linked cards | Resolve readable source chain for selected content; detect retargeting and access loss | `tests/ruleEmailSource.test.cjs`; linked-source SMTP |
| Linked boards | Current board display fields and voting; wrapper discussion/files remain local | Linked-source SMTP and Details tests |

## Unfinished checks and implementation

- Checklist `linkedCardId`: render the converted subtask reference only if its
  target remains readable; do not expose an inaccessible target title or ID.
- Attachment presentation metadata: identify the cover attachment and decide
  how to include upload time/uploader alongside the already attached bytes.
- Legacy Gantt dependency fields: compare `targetId_gantt`, `linkType_gantt` and
  `linkId_gantt` with canonical `cardDependencies`; preserve visible relationships
  without duplicating them or exposing an unreadable target.
- Linked wrappers: check which timer, Scrum, sticker and placement fields belong
  to the wrapper rather than the resolved source. The current linked-board
  branch does not render all wrapper metadata. Verify the intended UI behavior
  and retain both applicable scopes with unambiguous labels.
- Complete a final field-by-field pass and a rule triggered by moving a card to
  a list, with all three content choices enabled. Current SMTP scenarios use
  the button trigger; they do not alone prove the original moved-card example.

Display preferences, internal Sync provenance/revisions, deletion bookkeeping
and security/transport state are not prose to serialize wholesale. A new field
must be classified by its user-visible meaning before adding it to email.

Stored Sync command recovery and related-content authorization are unfinished
integrations: unbound
legacy commands and uncertain SMTP attempts still require an operator workflow.
Snapshots are not automatically rewritten or resent. Extend persisted source
evidence to related-card titles before claiming that cross-board related
content remains authorized on every retry; the main linked-source chain alone
does not establish that property. Source bindings cover
current source identity, access and voting/Scrum disclosure settings; they do
not establish cross-document transactional consistency.
