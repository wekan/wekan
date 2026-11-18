# Swimlane menu / Star

Swimlane menu (☰ in the swimlane header) → **Star** / **Unstar** bookmarks
the swimlane for you ([#1172](https://github.com/wekan/wekan/issues/1172)).

## Who sees it

Everybody who can open the swimlane menu: a board member who is not **Comment
only**, **Read only**, **Read assigned only** or **Worker**. It sits above the
entries that change the board, because starring changes only your own
profile.

## What it changes

- The star is per user: the swimlane's id is added to or removed from your
  `profile.starredSwimlanes` by the `toggleSwimlaneStar` server method
  (`server/models/users.js`). Nobody else sees it, and the swimlane is not
  changed.
- The icon is a filled star and the entry reads **Unstar** while the
  swimlane is starred.
- Starred swimlanes appear in the header's bookmarks dropdown (the five most
  recently starred) and on the **Starred** page (`/starred-items`). See
  [Starred](../Pages/Starred.md).

The same entry exists in the [list menu](../Lists/Star.md) and the
[card menu](../Cards/Watch-Star.md).
