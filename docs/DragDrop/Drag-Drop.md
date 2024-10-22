## Roles

It depends on role of user what drag drop is allowed https://github.com/wekan/wekan/wiki/REST-API-Role

## Mobile Drag Drop

1. Click `Drag Handle Enabled/Disabled` button to enable drag handles

2. Use drag handles to move Board Icons, Swimlanes, MiniCards, Lists, Checklists, Checklist Items.

3. Use non-drag-handle area to to view other parts of board, by dragging board up/down/left/right, without moving any icons etc.

<img src="https://wekan.github.io/dragdrop/mobile-drag-drop.png" width="40%" alt="Wekan logo" />

## 2 or more external screens of desktop or mobile

For each screen, you can enable or disable drag handles, because that setting is stored in browser localstorage, not to database. https://github.com/wekan/wekan/issues/4715

Because this feature was added, `Drag Handle Enabled/Disabled` was moved to current place shown in above screenshot. https://github.com/wekan/wekan/issues/4734

## All Boards page

Reorder with drag drop:
- Board Icons

## One Board page

Reorder with drag drop:

- Swimlanes
- Lists
- MiniCards. MiniCard is card, that is not click opened to view card contents.
- Opened Card: Checklists
- Opened Card: Checklist Items

## Drag code examples

- Draggable objects
  - https://www.redblobgames.com/making-of/draggable/
  - https://news.ycombinator.com/item?id=37703291
- Fixed Drag at Ubuntu Touch Morph browser https://github.com/wekan/wekan/commit/af63259f091cb2ade84493a288ea37c53cd37321

## Touch UI ideas

- https://blog.la-terminal.net/godot-on-ipad-summer-update/
- https://news.ycombinator.com/item?id=41415077