# Board Settings / All Boards Settings

## What it is

**All Boards Settings** decides what this board's tile shows on the All Boards
page - the card count of each list and the members' avatars - and three
behaviours of the board itself: card aging (old cards fade), auto-archive of
cards nobody has touched for a number of days, and whether list widths are
personal or shared.

## Read more

- [Wikipedia: Kanban board](https://en.wikipedia.org/wiki/Kanban_board)
- [Nextcloud Deck](https://github.com/nextcloud/deck), whose auto-archive this
  follows
- [All Boards](../../All-Boards/README.md)
- [List settings](List.md)
- [Admin Panel / Settings / Appearance](../../Admin-Panel/Settings/Appearance.md)

## How to use it

1. Open the board, its right sidebar, then **Board Settings → All Boards
   Settings** (`fa-id-card-o`), below **Date** (board admins only).
2. Under the heading **Show at All Boards page**, tick or untick the rows
   below; each row saves at once to the current board with
   `Boards.updateAsync`, which the server allows for a board admin.
3. For card aging, write the three **Fade after days (3 tiers):** numbers.
4. For auto-archive, write the number of days in **Archive cards after this
   many days without activity**, or leave it empty to turn it off.

| Row | Board field | What it does |
| --- | --- | --- |
| Show card count per list | `allowsCardCounterList` | The board's tile on All Boards shows the card count of each list. Not drawn when an administrator hides card counters (`Settings.hideCardCounterList`). |
| Card aging (fade old cards) | `cardAging` | Minicards fade in three steps the longer they go without activity. While on, three day fields set the steps (`cardAgingDays1/2/3`, default 7, 14 and 28 days). |
| Archive cards after this many days without activity | `autoArchiveInactiveDays` | Checked every hour by `server/autoArchiveCards.js`. A card counts as active whenever it is changed; templates are never archived. Empty turns it off. |
| Show Board members avatars | `allowsBoardMemberList` | The board's tile on All Boards shows its members' avatars. Not drawn when an administrator hides member lists (`Settings.hideBoardMemberList`). |
| Personal list widths | `allowsPersonalListWidth` | On: each user keeps their own list widths. Off: list widths are shared with everyone on the board. |

The two administrator switches are in the **All Boards: Hide** group of
[Admin Panel / Settings / Appearance](../../Admin-Panel/Settings/Appearance.md).

## How the numbers are calculated

- **Card aging** (`agingClass` in
  [client/components/cards/minicard.js](../../../../client/components/cards/minicard.js)):
  a card's age is the days since its last activity (`dateLastActivity`, or when
  it was modified or created). At or past the third tier (default 28 days) the
  minicard is drawn at 40% opacity, at or past the second (default 14) at 60%,
  at or past the first (default 7) at 85%
  ([client/components/cards/minicard.css](../../../../client/components/cards/minicard.css));
  hovering shows it at full opacity. Each tier field takes a number of at
  least 1.
- **Auto-archive** ([models/lib/autoArchive.js](../../../../models/lib/autoArchive.js)):
  the number of days is a whole number from 1 to 3650; anything else turns it
  off. Every hour, a card of a board with the setting on is archived when its
  last activity is older than that many days; templates, archived boards and
  template containers are left alone. At most 200 cards of one board are
  archived per run (`AUTO_ARCHIVE_BATCH`), oldest first, so one huge board
  cannot hold the job up. The archive is recorded as the board creator's.

## How it works in WeKan

The popup is `boardInfoOnMyBoardsPopup` in
[client/components/sidebar/sidebar.jade](../../../../client/components/sidebar/sidebar.jade),
with its helpers and events in
[client/components/sidebar/sidebar.js](../../../../client/components/sidebar/sidebar.js).
The rows call board methods in [models/boards.js](../../../../models/boards.js)
(`setCardAging`, `setCardAgingDays`, `setAutoArchiveInactiveDays`,
`setAllowsBoardMemberList` and the others), stored in the fields of the table
above. The hourly job is
[server/autoArchiveCards.js](../../../../server/autoArchiveCards.js), on the
shared cron, and its rules are the pure module
[models/lib/autoArchive.js](../../../../models/lib/autoArchive.js), pinned by
[tests/autoArchive.test.cjs](../../../../tests/autoArchive.test.cjs).

The entry was commented out for a while because of the *Bug Board icons random
dance* (#4214), a reactive re-render loop on All Boards; the board tiles now
read one fetch of `getAllBoardsTileData` instead of reactive cursors, so the
entry is back. The popup hides its own counter and avatar rows when the Admin
Panel turns those off.

## Commits

 - [Board menu: All Boards Settings is back, below Date, for board admins](https://github.com/wekan/wekan/commit/b00e2c81333032063bad33092181cc917911384f)
 - [Archive cards automatically after a chosen number of days without activity](https://github.com/wekan/wekan/commit/22c62b7b39d3ddbb7a6296d3b9dde79315114166)
 - [Rework list widths: one width, shared or personal per board (#6409)](https://github.com/wekan/wekan/commit/b477b1383d5e8c9b5afd2b129bd1e7104315b9bb)
 - [Card aging fades old cards, with board-set tiers (in a batch of import, export and rules features)](https://github.com/wekan/wekan/commit/f0bce67a3bf301c21ded3eb97e84a3be0010290f)
 - [Members list and card count per list on My Boards](https://github.com/wekan/wekan/commit/5f2820d7e0a12a0d1ef22c29ddc137b442928347)
