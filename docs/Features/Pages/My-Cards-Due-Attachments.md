# My Cards, Due Cards, and My Attachments

## What it is

Three personal cross-board lists in the member menu, each filtered to
"things assigned to / owned by me" across every board, instead of having to
check each board individually:

- **My Cards** - every card across your boards where you are a member or an
  assignee.
- **Due Cards** - every card across your boards that has a due date, sorted
  by due date with the oldest (most overdue) first, so overdue and soon-due
  cards are easy to find.
- **My Attachments** - every file you uploaded to a card, across every board
  you can see.

## Read more

- [Due date](https://en.wikipedia.org/wiki/Due_date) and
  [Time management](https://en.wikipedia.org/wiki/Time_management) on
  Wikipedia - why a list of what is due next is useful.
- [Personal information management](https://en.wikipedia.org/wiki/Personal_information_management)
  - keeping one's own work and files findable.
- [Pagination](https://en.wikipedia.org/wiki/Pagination) - Due Cards and My
  Attachments are shown a page at a time.
- In WeKan: [Due date](../Cards/Dates/Due-Date.md),
  [Attachments](../Cards/Attachments/README.md),
  [Starred](Starred.md), [Search](../Board-Header/Search.md).

## How to use it

### Where to find it

Click your **avatar and name** in the first header bar (at its end, beside the
sidebar toggle) to open the member menu, then one of **My Cards**, **Due
Cards** (with the calendar icon), or **My Attachments**.

```
┌ (your avatar) ▾ ───────────┐
│ ▸ My Cards                 │
│ ▸ Due Cards                │
│ ▸ My Attachments           │
│ ▸ Starred                  │
│ ▸ Search All Boards        │
│ ─────────────────────────  │
│   All Boards                │
│   Public                    │
│   Archive                   │
└───────────────────────────────┘
```

(**Workload** and **Billing** appear between Due Cards and My Attachments when
those features are on.)

### Steps to use it

1. Click your avatar and name in the first header bar.
2. Select **My Cards**, **Due Cards**, or **My Attachments**.
3. The page lists matching items from every board you belong to; click any
   card or attachment to open that card.
4. On **My Cards**, open the page sidebar (☰ in the header bar) and choose
   **My Cards View**: **Boards** (grouped by board, swimlane and list) or
   **Table**.
5. On **Due Cards**, open the page sidebar and choose **Due Cards View**:
   **Me** (your cards) or **All Users** (every card with a due date on the
   boards you may see). Use **Previous Page** and **Next Page** to move
   through the results.
6. On **My Attachments**, click the arrow to **Download** a file, and use
   **Previous** and **Next** to page.

### Prerequisites

- **My Cards** needs you to be added as a card member or assignee on at least
  one card.
- **Due Cards** needs cards with a [due date](../Cards/Dates/Due-Date.md) set.
- **My Attachments** needs at least one file you uploaded to a card you can
  see - see [Attachments](../Cards/Attachments/README.md).

## How the numbers are calculated

- **My Cards** runs the search operator `user:<your username>` (a card where
  you are in `members` or `assignees`) with a limit of **200** cards
  (`OPERATOR_LIMIT, 200` in the `myCards` publication,
  [server/publications/cards.js](../../../server/publications/cards.js)). The
  cards are sorted by board, swimlane and list, and inside each by their
  `sort` value.
- **Due Cards** shows **200 cards per page** (`PAGE_SIZE` in
  [client/components/main/dueCards.js](../../../client/components/main/dueCards.js));
  the publication clamps a page to 1-500 cards and skips
  `page * 200`. Only cards that are not archived and have a `dueAt` are
  included, sorted by `dueAt` ascending. In the **Me** view a card counts as
  yours when you are its member, assignee, requester, assigner or creator; on a
  board where you are an assigned-only member, only the cards assigned to you
  are included, in both views. A card with an invalid due date sorts last
  (`dueAtToTime` uses 2100-12-31 as the far-future value,
  [client/components/main/dueCardsLogic.js](../../../client/components/main/dueCardsLogic.js)).
  No cap is put on the total: every due card stays reachable by paging
  ([#5999](https://github.com/wekan/wekan/issues/5999)).
- **My Attachments** shows **200 attachments per page** (`DEFAULT_LIMIT`;
  at most `MAX_LIMIT` 500 per request,
  [models/lib/myAttachmentsQuery.js](../../../models/lib/myAttachmentsQuery.js)),
  newest first (`sort: { _id: -1 }`), and shows each file's size.

## How it works in WeKan

- **Menu**: `memberMenuPopup` in
  [client/components/users/userHeader.jade](../../../client/components/users/userHeader.jade)
  links the routes `my-cards`, `due-cards` and `my-attachments`.
- **My Cards**:
  [client/components/main/myCards.jade](../../../client/components/main/myCards.jade)
  and `.js` subscribe to `myCards`, which builds a global-search query for the
  current user. A card opens in the card popup (`popupCardData`).
- **Due Cards**:
  [client/components/main/dueCards.jade](../../../client/components/main/dueCards.jade),
  `.js` and the pure `dueCardsLogic.js`; the `dueCards` publication reads only
  the boards you are an active member of (or may see while signed in) and
  publishes only the fields the page needs.
- **My Attachments**:
  [client/components/main/myAttachments.jade](../../../client/components/main/myAttachments.jade)
  and `.js`; the `myAttachments` composite publication uses the same
  board-visibility rule as All Boards (public boards, an active membership, or
  an organization, team or e-mail-domain share) and
  `myAttachmentsSelector(userId, boardIds)`, so only your own uploads on boards
  you may see are published. A file deleted from its card (soft delete,
  `liveAttachments`) is left out.
- The view choices are drawn in the shared page sidebar
  ([models/lib/pageSidebar.js](../../../models/lib/pageSidebar.js)).
- Tests: [tests/myAttachments.test.cjs](../../../tests/myAttachments.test.cjs),
  [tests/myCardsInlineCardPopup.test.cjs](../../../tests/myCardsInlineCardPopup.test.cjs),
  [tests/myCardLinkContext.test.cjs](../../../tests/myCardLinkContext.test.cjs),
  [client/lib/tests/dueCards.logic.tests.js](../../../client/lib/tests/dueCards.logic.tests.js),
  and the browser tests
  [tests/playwright/specs/09-my-cards-filter.e2e.js](../../../tests/playwright/specs/09-my-cards-filter.e2e.js)
  and
  [tests/playwright/specs/due-cards-board-scope.e2e.js](../../../tests/playwright/specs/due-cards-board-scope.e2e.js).

## Related

- [Starred](Starred.md) - a separate, manually curated list of
  boards/cards you starred, rather than an automatic "assigned to me" filter.

## Commits

 - [Open the selected card from My Cards and My Attachments](https://github.com/wekan/wekan/commit/d01b3a3d920431e6db1cbe561d80ec2676069e5c)
 - [My Attachments leaves out files deleted from their card](https://github.com/wekan/wekan/commit/dce28983820f99927b2cb3626e586488c962e084)
 - [Add a My Attachments page to the member menu](https://github.com/wekan/wekan/commit/a9dd6b05b0e583d81deac5544df3a7f7012fea26)
 - [Open a card from My Cards in the popup, not a full board navigation](https://github.com/wekan/wekan/commit/c7db5429bbbdc5ca082772032f350db50692a897)
 - [Bound the high-volume Due Cards query with paging](https://github.com/wekan/wekan/commit/c69bf503c3ed36844aab8450d5fe56307f8140a6)
 - [The page's controls move into a right sidebar](https://github.com/wekan/wekan/commit/705bed741368874e111a6441cca1ccf5ad137b38)
 - [Show all due cards and make the Due Cards list scrollable](https://github.com/wekan/wekan/commit/b3acbd69209cd1c0df80a70b4d87cae563978d80)
 - [Fix being unable to view cards by due date](https://github.com/wekan/wekan/commit/ae11e80bde79d9ad412d185f20e5a7f802685260)
 - [Due Cards load faster](https://github.com/wekan/wekan/commit/347fa9e5cd89d064ebb8ab544e20a41f52206db6)
 - [Sort Due Cards by due date, oldest first](https://github.com/wekan/wekan/commit/a540b12895520f398bce10bd244f733d221975d4)
 - [Fix being unable to see Due Cards](https://github.com/wekan/wekan/commit/66b444e2b0c9b2ed5f98cd1ff0cd9222b2d0c624)
 - [Add the Table view to My Cards](https://github.com/wekan/wekan/commit/147a3d99cbe561662fc7fc1043128138ee8310b9)
 - [Rewrite the My Cards list with its own publication](https://github.com/wekan/wekan/commit/07a3301414ff2ab85e99b954d8c5dda0fa4f5998)
 - [Global search, Due Cards and My Cards share the same search code](https://github.com/wekan/wekan/commit/a1bda1169e1c5e02081a063e147b9b8bfdabbfe5)
 - [All Users view of Due Cards shows only other users' public boards](https://github.com/wekan/wekan/commit/801d0aacf00eace05ec70d6f0229f2a752f119cd)
 - [Initial work on the Due Cards page](https://github.com/wekan/wekan/commit/1abdd5177dbf3f0fb62612bcb489d23dd2a040cc)
 - [My Cards page development](https://github.com/wekan/wekan/commit/5e68362352b9bd3fa67336527e0d741a67ef463c)
 - [First My Cards page](https://github.com/wekan/wekan/commit/7a419c156319701a02c961534c12e0d453e1ac71)
