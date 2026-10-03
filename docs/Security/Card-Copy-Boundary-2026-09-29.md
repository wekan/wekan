# CopyIdentityBleed: card-copy override boundary

The TODO Later source-review lead was confirmed against a local Meteor app and
MongoDB using two test-owned private boards. A member of the first board passed
the ID of a card on the second board in `copyCard`'s `mergeCardValues` object.
The method checked membership using the original card, then replaced that card
object's `_id`. `Cards.copy()` used the replacement identity to load children.
The negative test reproduced copying the second board's private checklist into
the first board despite the caller lacking membership of the second board.

This is an application authorization defect (CWE-915, high severity). The caller
must be authenticated, have a readable member board and a writable destination,
and know another card's identifier. The existing custom-field guard does not
protect card identity. FerretDB's find handler consumes the requested filter;
it cannot recover the original application identity after the method replaced
it. No database implementation change is needed for this specific defect.

The method now accepts only optional string `title` and `description` overrides,
matching the copy, copy-many and multiselection dialogs. All other keys and
non-string values are refused before sorting, insertion or child copying.
Overrides apply to a separate transformed card object; the source's identity,
prototype, text and sort stay unchanged. Existing protected custom-field
mutation checks still run, retaining their AdminFieldBleed denial summaries.

Unsupported override attempts are summarized under **CopyIdentityBleed** in
Admin Panel → Problems. The record includes the actor and method, not supplied
field names, values or target identifiers. Logging failure cannot bypass the
refusal. Ordinary copies and malformed title/description text do not produce attack
records or account blocks. Extra-field attempts follow the existing high-severity
policy, which blocks the attempting account. No CVE is assigned;
the fix is prepared locally for the Upcoming release, not yet published.

## Verification

- `tests/cardCopyOverrides.test.cjs` exercises text overrides, empty values,
  rejected keys and types, prototype preservation and source isolation. It also
  scans maintained application sources for the unsafe source-object merge shape.
- `tests/playwright/specs/card-copy-boundary.e2e.js` reproduces the original
  private-checklist disclosure, verifies refusal without card/activity writes,
  checks Problems attribution, tests invalid overrides and legitimate children,
  and exercises the actual copy dialog.
- Existing protected-field and Scrum card-copy browser coverage remains relevant;
  the new validation must retain those protections and copy semantics.
- The shared-form label/control test now follows the existing multiline swimlane
  title textarea instead of requiring the obsolete single-line input.

Testing uses local MongoDB, Meteor and Chromium. Other backends, production data
and other browsers are not validated by these results. The negative baseline
failure and post-fix logs are retained in `.tools/tmp/card-copy-boundary` locally.

## Remaining review

This fix closes caller-controlled source identity replacement. The direct
Rules writes and concurrent permission changes were reviewed on 2026-10-03. A
rule could name another board's trigger and stop that board's own rule from
running; that is refused now, and rules match on the activity's own board
(RepointBleed follow-up). A copy checks access when it starts; a membership
revoked while it runs does not stop it, which is the backends' lack of
multi-document transactions rather than a missing check.

Assigned-only source and descendant handling was reviewed on 2026-10-03. The
source card was already checked (an assigned-only member copies only a card
assigned to them), but its subtasks were not: a copy carried every subtask,
including ones assigned to others and ones on boards the copier cannot read.
Card.copy and the durable rule copy now keep only the subtasks the copier could
read and copy themselves (`copyableSubtasks` in `models/lib/boardCardScope.js`),
covered by `tests/copySubtaskScope.test.cjs` and a server test through
`copyCard`. The card PDF and Excel exporters refuse assigned-only members, and
rule email details check each subtask, so neither carries the same fault. Destination placement validation is covered
by the follow-up below. It does not certify every entry point that copies cards or related
records. The larger non-translation TODO goal remains open.

## Destination placement follow-up

A separate local regression confirmed that card-copy DDP accepted a list from
another board and inserted a card whose board and list disagreed. Shared server
copying now checks that the board exists and both destination containers exist
on that board, with none soft-deleted. The DDP method checks before calculating
sort order, and `Cards.copy()` checks again before loading source children,
remapping custom fields, allocating card numbers or writing documents. The
REST route returns HTTP 400 for an invalid destination.

Board-wide lists remain valid; this check does not require a list to be bound
to one swimlane. Archived containers remain valid for existing board-copy
semantics. A stale picker can legitimately hold removed or foreign selections,
so destination rejection is an input error, without security logging or account
blocking. Permissions remain the callers' responsibility.

`tests/cardCopyDestination.test.cjs` covers the placement decision and guard
ordering. `tests/playwright/specs/card-copy-destination.e2e.js` covers DDP/REST
foreign and missing containers, soft-deleted containers, unchanged cards,
activities and number counters, plus valid cross-board copies into a board-wide
list. Existing ordinary, Scrum, list, swimlane and rule-copy browser suites
exercise the shared server entry point.

This is not a transaction: a concurrent move or deletion after validation can
still invalidate a destination. Client-side template copies use collection
writes; reviewed on 2026-10-03, they go through the Cards insert rules, which
now also refuse another board's list or swimlane (BoardBleed follow-up). The separate `copyBoard` properties merge,
which needs the same identity-preservation review as the card method.
