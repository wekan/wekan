# Swimlane menu / Star

## What it is

Swimlane menu (☰ in the swimlane header) → **Star** / **Unstar** bookmarks
the swimlane for you ([#1172](https://github.com/wekan/wekan/issues/1172)).
A starred swimlane is one click away from the header's bookmarks dropdown and
from the **Starred** page, so a lane you work in every day does not have to be
looked for. The star is personal: nobody else sees it.

## Read more

- [Bookmark (digital)](https://en.wikipedia.org/wiki/Bookmark_(digital)) - the
  general idea of keeping a shortcut to a place, on Wikipedia.
- In WeKan: [Starred](../Pages/Starred.md), the
  [list menu's Star](../Lists/Star.md) and the
  [card menu's Watch and Star](../Cards/Watch-Star.md).

## How to use it

1. Open the board in the **Swimlanes** view.
2. Click ☰ (**Swimlane Actions**) in the swimlane header.
3. Under **Share and history**, click **Star**. The icon becomes a filled star
   and the entry now reads **Unstar**.
4. To reach the swimlane later, open the caret of the star group in the first
   header bar: it is listed under **Starred Swimlanes**. **See all starred
   items** opens the full **Starred** page (`/starred-items`), which is also in
   the member menu as **Starred**.
5. To remove the star, open the menu again and click **Unstar**.

### Who sees it

Everybody who can open the swimlane menu: a board member who is not **Comment
only**, **Read only**, **Read assigned only** or **Worker**. It sits above the
entries that change the board, because starring changes only your own
profile.

## How the numbers are calculated

- The header's bookmarks dropdown shows at most the **5 most recently starred
  swimlanes** (`DROPDOWN_ITEMS_PER_TYPE = 5` in
  [client/components/main/header.js](../../../client/components/main/header.js)).
  `$addToSet` appends, so `profile.starredSwimlanes` is oldest-first and
  `starredItemsByType()` reads it in reverse. The **Starred** page shows them
  all, with no cap.
- Every starred swimlane adds 1 to the count beside the caret of the star
  group: `starredCount()` in [models/users.js](../../../models/users.js) is
  starred boards + starred pages + starred swimlanes + starred lists + starred
  cards. A starred id whose swimlane no longer exists is not counted.

## How it works in WeKan

- The star is per user: the swimlane's id is added to or removed from your
  `profile.starredSwimlanes` by the `toggleSwimlaneStar` server method
  ([server/models/users.js](../../../server/models/users.js)), which checks
  the argument and that you are logged in, and writes only your own profile.
  Nobody else sees it, and the swimlane is not changed.
- The icon is a filled star and the entry reads **Unstar** while the
  swimlane is starred (`isSwimlaneItemStarred`, `hasStarredSwimlane`).
- Starred swimlanes appear in the header's bookmarks dropdown
  (`starredBoardsPopup` in
  [client/components/main/header.jade](../../../client/components/main/header.jade))
  and on the **Starred** page
  ([client/components/main/starredItems.jade](../../../client/components/main/starredItems.jade)).
  Both use the one `starredItemsByType()` query. See
  [Starred](../Pages/Starred.md).
- Tests: [tests/starredItems.test.cjs](../../../tests/starredItems.test.cjs).

The same entry exists in the [list menu](../Lists/Star.md) and the
[card menu](../Cards/Watch-Star.md).

## Commits

 - [Group the swimlane menu; Star sits under Share and history](https://github.com/wekan/wekan/commit/0d8f8b8d96b868a6d75b803ef105e50aad450977)
 - [Add Star/Unstar to the swimlane, list and card menus, a Starred page and a header bookmarks section](https://github.com/wekan/wekan/commit/c5740e8046e23bf26a31c2b97c563498007dec0e)
