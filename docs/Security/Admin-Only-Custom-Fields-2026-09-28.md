# AdminFieldBleed: admin-only custom-field boundary

Hama1cco reported GHSA-m8gh-2h78-f57x privately. Source review confirmed
CWE-863: non-admin board members could read protected values from raw card
responses and bypass the indexed update guard through creation, copying or
whole-array mutations. The report names v11.70 through v12.08; the introducing
commit is `76dcb6575`. This review checked current source and that introduction,
not a separately deployed instance of every intervening release.

## Enforcement

- All application publication registrations project custom-field values before
  sending DDP documents. Per-user definition and board-admin observers refresh
  live projections when protection or membership changes. IDs and array positions
  remain visible; unreadable values become null. Missing definitions fail closed.
- Method results and REST JSON responses use the same recursive projection,
  including nested snapshots and activities. History search applies it before
  matching and pagination. Non-admin readers also lose history digest and
  predecessor hashes, which could otherwise expose low-entropy values by guessing.
- Card value searches bind their predicates to readable field IDs. Unsupported
  positional predicates fail closed; custom-field positional sorts fall back to
  ID order. A policy change stops an existing value-search subscription because
  its database selector is frozen; the client must subscribe again. Ordinary card
  subscriptions update their projected values without stopping.
- DDP permissions and the Meteor collection driver compare protected values
  before and after applying the actual modifier. This includes insert, array
  replacement, push/unset, board moves and request-attributed direct writes.
  Conditional writes pin the checked card state to prevent an intervening card
  update from bypassing the comparison. Copying omits unreadable source values;
  supplied forged values are rejected. Protected definition changes require
  administration of every old and new board.
- Binary/streaming exports on boards with protected fields require board-admin
  access, including public-board shortcuts. Unknown or foreign non-null field
  values also block export. This intentionally restricts member exports until
  those formats support equivalent value projection.
- Explicit protected-value/definition mutation attempts use
  `authz.admin-only-field`, folded into Admin Panel → Problems under
  AdminFieldBleed. Logs contain no protected values. Ordinary redacted reads and
  export refusals are not classified as attacks.

The per-user observer cache is shared by that user's subscriptions. Publication
wrappers retain raw/projected documents until subscription cleanup. Native raw
driver writes and actorless maintenance remain trusted internal operations;
they are not an authorization API for new request handlers. Card state checks
do not constitute a cross-document transaction with field definitions.

## Regression coverage

`tests/adminFieldBoundary.test.cjs` covers projection, missing/foreign/shared
definitions, false/zero values, History snapshots and hashes, query restrictions
and registration/export entry-point coverage. Existing custom-field and History
tests check the updated boundary as well.

`tests/playwright/specs/admin-only-custom-fields.e2e.js` exercises REST and DDP
reads, live protection/admin changes, public edits, admin edits, forged writes
through eight entry shapes, protected-value lookup/search and the Problems page.
The live read scenario must run with both `CARDS_LOADING=lazy` and
`CARDS_LOADING=all`; changing a board field alone does not select the global mode.

Test results and environment limits are recorded in the Upcoming changelog.
These are local MongoDB/Meteor/Chromium checks, not a production deployment or a
claim that every supported database and browser was exercised.
