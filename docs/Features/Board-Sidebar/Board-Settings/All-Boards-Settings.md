# Board Settings / All Boards Settings

**All Boards Settings** (i18n key `board-info-on-my-boards`) is the popup
`boardInfoOnMyBoardsPopup` in `client/components/sidebar/sidebar.jade`, with
its helpers and events in `client/components/sidebar/sidebar.js`.

A board admin opens it from the Board Settings menu, below **Date**
(`a.js-board-info-on-my-boards`, `fa-id-card-o`). The entry was commented out
for a while because of the *Bug Board icons random dance* (#4214), a reactive
re-render loop on All Boards; the board tiles now read one fetch of
`getAllBoardsTileData` instead of reactive cursors, so the entry is back.

## The popup

Under the heading **Show at All Boards page**, each row saves at once to the
current board with `Boards.updateAsync`, which the server allows for a board
admin:

| Row | Board field | What it does |
| --- | --- | --- |
| Show card count per list | `allowsCardCounterList` | The board's tile on All Boards shows the card count of each list. Not drawn when an administrator hides card counters (`Settings.hideCardCounterList`). |
| Card aging (fade old cards) | `cardAging` | Minicards fade in three steps the longer they go without activity. While on, three day fields set the steps (`cardAgingDays1/2/3`, default 7, 14 and 28 days). |
| Archive cards after this many days without activity | `autoArchiveInactiveDays` | Checked every hour by `server/autoArchiveCards.js`. A card counts as active whenever it is changed; templates are never archived. Empty turns it off. |
| Show Board members avatars | `allowsBoardMemberList` | The board's tile on All Boards shows its members' avatars. Not drawn when an administrator hides member lists (`Settings.hideBoardMemberList`). |
| Personal list widths | `allowsPersonalListWidth` | On: each user keeps their own list widths. Off: list widths are shared with everyone on the board. |

The two administrator switches are in the **All Boards: Hide** group of
[Admin Panel / Settings / Appearance](../../Admin-Panel/Settings/Appearance.md).

## Related

- [All Boards](../../All-Boards/All-Boards.md)
- [List settings](List.md)
