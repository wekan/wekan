# List menu / Star

List menu (☰ in the list header) → **Star** / **Unstar** bookmarks the list
for you ([#1172](https://github.com/wekan/wekan/issues/1172)).

## Who sees it

Everybody who can open the list menu. It is above the entries that change
the board, because starring changes only your own profile.

## What it changes

- The star is per user: the list's id is added to or removed from your
  `profile.starredLists` by the `toggleListStar` server method
  (`server/models/users.js`). Nobody else sees it, and the list is not
  changed.
- The icon is a filled star and the entry reads **Unstar** while the list is
  starred.
- Starred lists appear in the header's bookmarks dropdown (the five most
  recently starred) and on the **Starred** page (`/starred-items`), with
  starred boards, swimlanes and cards. See [Starred](../Pages/Starred.md).

The same entry exists in the
[swimlane menu](../Swimlanes/Star.md) and the
[card menu](../Cards/Watch-Star.md).
