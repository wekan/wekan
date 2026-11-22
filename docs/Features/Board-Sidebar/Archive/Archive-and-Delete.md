# Archive and Delete

## What it is

Moving a board, swimlane, list or card to the Archive hides it without losing
it: it can be restored later. Deleting removes it for good and has no undo.
These are on Standalone Wekan: Snap/Docker/Source/VirtualBox. Some of these are
also at Sandstorm Wekan.

## Read more

- [Wikipedia: Archive](https://en.wikipedia.org/wiki/Archive)
- [Wikipedia: Trash (computing)](https://en.wikipedia.org/wiki/Trash_(computing)),
  the same idea in a desktop
- [Archived-card contributions](Archived-Contributions.md)
- [Delete a board](../Board-Settings/Import-Export/WeKan/Delete-Board.md)

## How to use it

### Move to Archive: Restore possible

- Board => ☰ => **Move Board to Archive** (Board Settings, board admins)
- Swimlane => ☰ => **Move Swimlane to Archive**
- List => ☰ => **Move List to Archive**
- Card => ☰ => **Move Card to Archive**

### Restore Card/List/Swimlane from Archive

1. Open the board, its right sidebar, then **Board Settings → Archive**.
2. Choose the Cards, Lists or Swimlanes tab.
3. Click **Restore** beside one, or **Restore all**. A board admin also sees
   **Delete** and **Delete all** - but that has no undo!! It's FINAL DELETE.

A card whose list is archived, or whose list has reached its WIP limit, may not
be restorable until there is room; the Archive says so.

### Restore a board

1. Go to **All Boards → Archive** (the Boards in Archive page, `/archive`).
2. Click **Restore Board** beside it.

### Deleting - NO UNDO

- Deleting Card: Card => ☰ => **More** => **Delete** (at right bottom corner;
  board admins).
- Deleting List: List => ☰ => **More** => **Delete** (at right bottom corner).
- Deleting Swimlane:
  1) Swimlane => ☰ => Move Swimlane to Archive
  2) Board => ☰ => Archive => Swimlanes => Delete (board admins) - but that
     has no undo!! It's FINAL DELETE.
- Deleting Board: an archived board is deleted only by a Global Admin, and only
  after **Admin Panel → Settings → Delete → Enable permanent delete for Global
  Admin** is checked. Then, in **All Boards → Archive**, select the boards with
  **Multi-Selection** and click the red **Delete** in the sidebar. Without that
  setting the sidebar says where to turn it on.

## How the numbers are calculated

- **Permanent delete of boards**: one selection may delete at most 200 boards,
  and every one of them must be archived, or nothing is deleted
  (`permanentlyDeleteArchivedBoards` in
  [server/models/boards.js](../../../../server/models/boards.js)).
- The Archive lists show when each item was archived (**archived at**). The
  Boards in Archive page has its own search and pages.

## How it works in WeKan

The board's Archive is the right-sidebar view in
[client/components/sidebar/sidebarArchives.jade](../../../../client/components/sidebar/sidebarArchives.jade):
restore controls are drawn for members who may write (not workers, read-only or
read-assigned-only members), and the delete controls for board admins only.
Archived boards are the page
[client/components/boards/boardArchive.jade](../../../../client/components/boards/boardArchive.jade)
(route `archive` in [config/router.js](../../../../config/router.js)), which
offers Restore Board only. Permanent delete of archived boards is the
multi-selection action in
[client/components/boards/allBoardsSidebar.jade](../../../../client/components/boards/allBoardsSidebar.jade),
shown when `canPermanentlyDeleteArchivedBoards` (a Global Admin, the All Boards
Archive section and `enablePermanentDelete` on); the server method checks every
gate again before removing anything, records each deleted board in Admin Panel
→ Problems, and removes with the board (`boardRemover` in the same file) its
cards, lists, swimlanes, integrations, rules, triggers, actions, activities and
every attachment with its file in the storage backend.

## Commits

 - [Restore from Archive into a full list asks for another list, instead of doing nothing](https://github.com/wekan/wekan/commit/b9edbcc8588fc8807c3cc617266daba88c781d8c)
 - [Permanently delete selected archived boards](https://github.com/wekan/wekan/commit/d3034d81ed4dea524f432c4db89aac35d6fa697a)
 - [Boards in Archive is a page, not a modal](https://github.com/wekan/wekan/commit/09003f0172033067e8150d863a4d37c9ed083495)
 - [Board Archive -> Boards: server-side pagination + search (stop loading all archived boards)](https://github.com/wekan/wekan/commit/e205f6b7ac8ed22cb6d48b4aac2ca80bd34bbb3a)
 - [Archived boards: Restore/Delete buttons follow the theme override colors](https://github.com/wekan/wekan/commit/4dc09c62b9719cbb3dd126420239f7d9da5bea55)
 - [Fix Board visibility ist only private and cannot change it. Fix Public Board, Archive, and menus visibility](https://github.com/wekan/wekan/commit/9f3c21657663df8c8af9c057639f9412084fcbe9)
 - [Fixed view, restore and delete of Archived Cards, Lists and Swimlanes. If delete list, it does not delete card of that ](https://github.com/wekan/wekan/commit/c989c21d4fcee6f095134176410e5811343d6923)
 - [Add display timestamp on 'Boards in Archive'](https://github.com/wekan/wekan/commit/04e04ead92bda4e8a1f01b2c4cead8eb7b651586)
 - [Printed archivedAt under every item in the archive](https://github.com/wekan/wekan/commit/678c8f6bf6e31a6317381b45ee7266ca709cc82b)
 - [Fixed #2338 -> Slow opening of big boards with too many archived items](https://github.com/wekan/wekan/commit/ab4fec0f3c6d5a613b309ae6fac41dbb31f1765d)
 - [Add popup menu and archive action](https://github.com/wekan/wekan/commit/5953fb8a44a3582ed0d8816ffb32a5b7f41f50a3)
 - [Archived boards to be translatable](https://github.com/wekan/wekan/commit/c9c6682299ce342f942ffe33d7bba2e4a640c1c4)
 - [Implement board archive and restoration](https://github.com/wekan/wekan/commit/48ac8b026ffdf8b3823c573e5693dcf1765383e2)
 - [Warn if the user try to restore a card in an archived list](https://github.com/wekan/wekan/commit/ae4288d5075a98bc141081b3449581ec4f07743f)
 - [Add a UI to restore archived cards](https://github.com/wekan/wekan/commit/98d7278d08dabc9e1da5dcd9a9bb968ab369520e)
