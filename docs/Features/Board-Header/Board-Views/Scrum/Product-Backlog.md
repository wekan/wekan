# Product Backlog

## What it is

The Product Backlog is the ordered list of the work a Scrum team has not
taken into a sprint yet. In WeKan, **Board View / Product Backlog** shows the
board's non-archived cards without a current sprint, ordered by their backlog
rank, and lets authorized editors give each card a sprint, a rank, releases, a
work-item type and acceptance criteria. The cards stay in their lists; the
backlog is an order on top of the board.

## Read more

- Wikipedia: [Product backlog](https://en.wikipedia.org/wiki/Product_backlog),
  [Scrum (project management)](https://en.wikipedia.org/wiki/Scrum_(project_management))
  and [User story](https://en.wikipedia.org/wiki/User_story).
- [The Scrum Guide](https://scrumguides.org/scrum-guide.html), which defines
  the Product Backlog.
- In WeKan: [Sprints](Sprints.md), [Sprint Report and Velocity](Sprint-Reports.md),
  [the Scrum design](Scrum-Design.md),
  [Scrum settings](../../../Board-Sidebar/Board-Settings/Scrum-Settings.md),
  [Scrum on cards](../../../Cards/Scrum.md) and
  [Planning Poker](../../../Cards/Planning-Poker.md).

## How to use it

**Order and plan a card:**

1. Open a board, click the **Board View** menu and choose **Scrum → Product
   Backlog**.
2. Find the card in the table (columns **Card**, **Estimate**, **Sprint**,
   **Backlog rank**, **Release**, **Actions**). The card title opens the
   existing card details view.
3. In the card's **Actions** cell, set **Sprint** (a planned or active sprint,
   or **Product Backlog** for none), **Backlog rank**, **Release**, **Work item
   type** and **Acceptance criteria**.
4. Click **Save**.

**Put a card in several releases:** in **Release**, hold Ctrl (Cmd on a Mac)
and choose more than one. Clear every choice to take the card out of all
releases.

**See more cards:** the table shows 100 cards at first; **Show N more** adds
the next 100.

The same editor is used for sprint work in [Sprints](Sprints.md).

## How the numbers are calculated

- **Order** ([models/lib/scrumCardOrder.js](../../../../../models/lib/scrumCardOrder.js)
  `compareScrumCards`): by the card's backlog rank, else its normal board sort
  position, else 0; smaller first. Equal values are ordered by card ID.
- **Estimate** ([models/lib/scrum.js](../../../../../models/lib/scrum.js)
  `getCardEstimate`): the card's Planning Poker estimate, or the numeric custom
  field chosen in the Scrum settings. A missing, negative or non-numeric value
  is **Unknown estimate**, not 0; an explicit 0 stays 0.
- **Rank**: any number of 0 or more; a card can be in at most 100 releases.
- Paging: 100 cards per page (`CARD_PAGE` in
  [client/components/boards/scrum/scrumView.js](../../../../../client/components/boards/scrum/scrumView.js)).

## How it works in WeKan

The planning table displays each card's releases and provides a release selector
beside its sprint and rank controls. A card can be in several releases
(2026-10-08): the selector is a multiple select, so hold Ctrl (Cmd on a Mac) to
choose more than one, and clear every choice to take the card out of all
releases. Only the current board's releases are offered and accepted. The same
editor is used for sprint work. Saving uses existing card write permissions,
board-local reference validation, revision checks and Scrum History undo/redo.
Release assignments do not create planning records or change the release's
lifecycle state. See
[Scrum-Design.md](Scrum-Design.md#several-releases-per-card) for how cards
saved with one release are read.

Board View / Product Backlog shows non-archived cards without a current sprint.
It reuses existing card estimates. Missing estimates are displayed as unknown.

A card's backlog rank provides an order independent of its list position.
Smaller ranks appear first. Authorized editors can change the rank, assign a
planned or active sprint, record a work-item type, and edit acceptance criteria.
The card title opens the existing card details view.

When cards have the same effective rank, their stable card IDs break the tie.
This keeps the order consistent across clients and refreshes, including cards
from different lists with matching list positions. Sprint card tables use the
same ordering. Titles and other metadata edits do not change this tie-breaker.

An unset backlog rank is blank in the editor and shown as a dash in the table.
It uses the card's normal sort position for ordering without copying that
position into Scrum metadata. Clear the rank field to return to this fallback;
zero remains a valid explicit rank. Negative board sort positions do not block
saving sprint, release or other metadata. Explicit negative Scrum ranks remain
invalid. Clearing a rank is recorded by the existing Scrum History method.

Sprint assignments preserve past membership when a card leaves a sprint.
Assignment to a different board's sprint is rejected. Revision checks reject
stale edits rather than silently overwriting another person's metadata.

**Files:** the view is
[client/components/boards/scrum/scrumView.jade](../../../../../client/components/boards/scrum/scrumView.jade)
and [scrumView.js](../../../../../client/components/boards/scrum/scrumView.js);
it reads `scrum.getBoardData` and saves with `scrum.updateCard`
([server/scrum.js](../../../../../server/scrum.js)). The card's Scrum data is
its `scrum` field (`sprintId`, `pastSprintIds`, `backlogRank`, `releaseIds`
with the legacy `releaseId`, `issueType`, `acceptanceCriteria`), validated by
`normalizeScrumMetadata` in [models/lib/scrum.js](../../../../../models/lib/scrum.js).

**Tests:** [tests/scrumCardOrder.test.cjs](../../../../../tests/scrumCardOrder.test.cjs),
[tests/scrumMultipleReleases.test.cjs](../../../../../tests/scrumMultipleReleases.test.cjs),
[tests/scrumDomain.test.cjs](../../../../../tests/scrumDomain.test.cjs) and the
UI specs [tests/playwright/specs/scrum.e2e.js](../../../../../tests/playwright/specs/scrum.e2e.js),
[scrum-backlog-paging.e2e.js](../../../../../tests/playwright/specs/scrum-backlog-paging.e2e.js),
[scrum-release-assignment.e2e.js](../../../../../tests/playwright/specs/scrum-release-assignment.e2e.js)
and [scrum-multiple-releases.e2e.js](../../../../../tests/playwright/specs/scrum-multiple-releases.e2e.js).

See [Sprints](Sprints.md) for lifecycle and optional field visibility, and
[the Scrum design](Scrum-Design.md) for remaining implementation work.

## Commits

 - [Release names on cards show again](https://github.com/wekan/wekan/commit/6ec8773937fee6cd2bbb9a1cf189bebd9fd884a9)
 - [A card can be in more than one release](https://github.com/wekan/wekan/commit/727ceedd011106189b16013d710409caf3b690ca)
 - [Large Scrum boards open faster, rows a page at a time](https://github.com/wekan/wekan/commit/5a1c265a9ed28d8592061afa9799187db41a3d8a)
 - [Equal ranks keep a consistent order](https://github.com/wekan/wekan/commit/9f3fbfd52809933615b50e99d7221affc4a044d8)
 - [An unset rank stays separate from the board sort position](https://github.com/wekan/wekan/commit/c6ac0014c575dc8b4603263f5b7efec2e7ac4b7f)
 - [Releases are assigned from the backlog and sprint editors](https://github.com/wekan/wekan/commit/5e67a3bdd53b34f9a722e82a271df347fe3f6455)
 - [Scrum planning with the Product Backlog view](https://github.com/wekan/wekan/commit/83eac102113623f8e0bc91b012c994b3c8291765)
