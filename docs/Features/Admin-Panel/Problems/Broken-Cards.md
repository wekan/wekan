# Admin Panel / Problems / Broken Cards

## What it is

Cards that cannot be shown on a board as they are. Address:
`/admin/problems/broken-cards`. Site administrators only, over every board of
the instance, whether or not the administrator is a member. A card is placed by
its board, swimlane and list; when one of those is missing the card exists in
the database but no board view can reach it, and this pane is where an
administrator finds those cards.

## Read more

- [Referential integrity](https://en.wikipedia.org/wiki/Referential_integrity)
  on Wikipedia - a record that points at something that is not there.
- WeKan: [Summary](Summary.md) (the Repair broken cards button),
  [Repairs.md](Repairs.md) (what opening a board repairs),
  [Data health](Data-Health.md) (the nightly scan that also finds cards on a
  list of another board), [Table page](../../Table.md).

## How to use it

**To list the broken cards:**

1. Open your member menu (your avatar at the top right) and click
   **Admin Panel**.
2. Click the **Problems** tab at the top.
3. In the left menu, under **Reports**, click **Broken Cards**.
4. To find a card, type part of its title in the search box and press
   **Enter** (case-insensitive).
5. Use the previous / next buttons to page through them.

| Column | Holds |
| --- | --- |
| Card Title | the title; longer than 30 characters is cut to 29 and `...` |
| Id | the card id |
| Board, Swimlane, List | the titles of those that exist; an empty cell is the part that is missing |
| Type | the card's type |
| Created at | when the card was created |

**To repair them:** this pane only lists. The repair is on
[Summary](Summary.md):

1. In the left menu of Problems, click **Summary**.
2. On the **Broken cards** problem, click **Repair broken cards**.
3. Wait while it says **Repairing…**; it then says how many cards it fixed and
   how many have no board at all and cannot be placed anywhere.

Opening a board also repairs its own cards ([Repairs.md](Repairs.md)).

## How the numbers are calculated

- **What counts as broken**: a card whose `boardId`, `swimlaneId` or `listId`
  is missing or empty, or whose `type` is not one of the four card types WeKan
  shows (`cardType-card`, `cardType-linkedCard`, `cardType-linkedBoard`,
  `template-card`; `CARD_TYPES` in [config/const.js](../../../../config/const.js)).
  It is ONE definition, `brokenCardsSelector` of
  [models/lib/brokenCardsRepair.js](../../../../models/lib/brokenCardsRepair.js),
  used by this pane, by "Broken cards N" on [Summary](Summary.md) and by its
  repair, so the three always mean the same cards. Until 2026-11-24 the Summary
  counted and repaired only the missing ids: a card of an unknown type with all
  three ids was listed here, never counted there, and never repaired.
- **The repair**: a card that still has its board gets the board's first list
  and first swimlane by `sort` (a default one is created when the board has
  none), and a card of an unknown type gets the plain card type,
  `cardType-card`; a card with no board is counted as unfixable and left alone, never
  deleted ([server/methods/repairBrokenCards.js](../../../../server/methods/repairBrokenCards.js)).
- **Rows per page**: 10; **total** from `getBrokenCardsReportCount(search)`,
  pages = `max(1, ceil(total / 10))`, recounted only when the search changes.
- **Order**: by board, then newest first (`{ boardId: 1, createdAt: -1 }`).

## How it works in WeKan

- [server/publications/cards.js](../../../../server/publications/cards.js) -
  `BROKEN_CARDS_SELECTOR`, `brokenCardsQuery` (the selector `$and` an escaped
  title regex), the `brokenCardsReport` publication and the
  `getBrokenCardsReportCount` method. Both refuse anybody who is not a site
  administrator. Only six fields of each card are sent (`title`, `type`,
  `boardId`, `listId`, `swimlaneId`, `createdAt`), and only the boards, lists
  and swimlanes whose ids ARE set are looked up. The page is published manually
  and named with `publishReportPage`, so the pane draws exactly that page and
  not every card already in the browser.
- The same selector serves the standalone `/broken-cards` page
  (`brokenCards` publication, `client/components/main/brokenCards.js`), so the
  two cannot disagree about what "broken" means.
- [client/components/settings/adminProblems.js](../../../../client/components/settings/adminProblems.js) -
  the `report-broken` column spec in `REPORT_TABLES`.
- [client/components/settings/problemsSummary.js](../../../../client/components/settings/problemsSummary.js)
  and [server/methods/repairBrokenCards.js](../../../../server/methods/repairBrokenCards.js) -
  the Summary repair button and the admin-only `repairBrokenCards` method.
- Tests: [server/lib/tests/brokenCardsRepair.tests.js](../../../../server/lib/tests/brokenCardsRepair.tests.js)
  (the repair planner),
  [tests/adminPageRows.test.cjs](../../../../tests/adminPageRows.test.cjs) (the
  named page), [tests/tablePage.test.cjs](../../../../tests/tablePage.test.cjs).

## Commits

 - [Paginate honestly: one page of ten, index-backed](https://github.com/wekan/wekan/commit/c1add5bc5e5537e3cc8f96076164ebdf4328b0e8)
 - [Show the whole instance's broken cards, not only the admin's boards](https://github.com/wekan/wekan/commit/6c1d62cde058522f442ec8f24116e2cd986f45bd)
 - [Broken cards becomes a report like the others, with search and a total](https://github.com/wekan/wekan/commit/fc0fe31779194fe0e363fe97a433502c9c22f2d2)
 - [Add the Repair broken cards button on Summary](https://github.com/wekan/wekan/commit/d168a9d30223d507c2de703ca2922ac61a25db6b)
 - [Publish the report pages manually so they load on FerretDB](https://github.com/wekan/wekan/commit/dded8ed47695092a698ab3e34a8abc5c6f567607)
 - [Admin reports: publications, and Broken cards out of the user menu](https://github.com/wekan/wekan/commit/5a6f84ce34f04404f06a386e7649da88090f3f7d)
 - [Add Broken cards to the admin reports](https://github.com/wekan/wekan/commit/0e593c7d810b3f30da64ce312bdc1798aac273e2)
 - [Use the new search functions and component](https://github.com/wekan/wekan/commit/8f978c23b4e0d920688c5319241dc5f6c29333f4)
 - [Add Broken Cards to the user settings menu](https://github.com/wekan/wekan/commit/b98df8ef87fc0c501d4f06e3e5af292605bd21cf)
 - [Broken Cards development](https://github.com/wekan/wekan/commit/986ab2967673206a1919b7ab90a28635b66417bd)
 - [New Broken Cards page](https://github.com/wekan/wekan/commit/4679db6ec44c5e0cc421f9db113438089b7a051b)
