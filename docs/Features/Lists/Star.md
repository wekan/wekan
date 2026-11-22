# List menu / Star

## What it is

List menu (☰ in the list header) → **Star** / **Unstar** bookmarks the list
for you ([#1172](https://github.com/wekan/wekan/issues/1172)). A starred
list can be reached again from the header's bookmarks dropdown and the
**Starred** page, without opening its board first.

## Read more

- [Bookmark (digital)](https://en.wikipedia.org/wiki/Bookmark_(digital)) on
  Wikipedia.
- WeKan: [Starred](../Pages/Starred.md), the same entry in the
  [swimlane menu](../Swimlanes/Star.md) and the
  [card menu](../Cards/Watch-Star.md).

## How to use it

Who sees it: everybody who can open the list menu. It is above the entries
that change the board, because starring changes only your own profile.

1. Click ☰ (**List Actions**) in the list header.
2. Under **Share and history**, click **Star**. The icon becomes a filled star
   and the entry reads **Unstar** while the list is starred.
3. Click **Unstar** to remove the bookmark.
4. Open the starred list from the header's bookmarks dropdown, or from the
   **Starred** page (`/starred-items`), with starred boards, swimlanes and
   cards. See [Starred](../Pages/Starred.md).

## How the numbers are calculated

- The header's bookmarks dropdown shows at most **5** starred lists
  (`DROPDOWN_ITEMS_PER_TYPE` in
  [client/components/main/header.js](../../../client/components/main/header.js)),
  the most recently starred first: `profile.starredLists` is kept in the order
  the lists were starred and read in reverse. A list that no longer exists or
  that you cannot see is skipped.
- The **Starred** page shows all of them, with no cap.

## How it works in WeKan

- The star is per user: the list's id is added to or removed from your
  `profile.starredLists` by the `toggleListStar` server method
  ([server/models/users.js](../../../server/models/users.js)), with
  `$addToSet` / `$pull`. Nobody else sees it, and the list is not changed.
- The menu entry is `a.js-star-list-item` in
  [client/components/lists/listHeader.jade](../../../client/components/lists/listHeader.jade);
  `isListItemStarred` in [listHeader.js](../../../client/components/lists/listHeader.js)
  asks `user.hasStarredList`.
- The list document also has an older, board-wide `starred` field
  (`list.star()` in `models/lists.js`); the menu entry does not use it.
- The dropdown and page: `starredItemsByType` in
  [client/components/main/header.js](../../../client/components/main/header.js),
  [client/components/main/starredItems.js](../../../client/components/main/starredItems.js).
- Tests: [tests/starredItems.test.cjs](../../../tests/starredItems.test.cjs).

## Commits

 - [Star / Unstar in the swimlane, list and card menus, a Starred page and a header bookmarks section](https://github.com/wekan/wekan/commit/c5740e8046e23bf26a31c2b97c563498007dec0e)
