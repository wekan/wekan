# Home: the board that opens after login

One board can be **Home**. Logging in opens it instead of the All Boards page,
so somebody who works in one board every day starts in it rather than starting
in a list and clicking the same tile every morning.

It has always existed — `profile.defaultBoardId`, set from Multi-Selection's
**Set as Home board (opened after login)** — but there was nowhere that *said*
which board it was. The setting was write-only: you could change it, and then
the only way to find out what you had chosen was to log out. Home is now a
**section of All Boards**, with a row in the left menu like Starred and
Templates, so there is a place that answers the question.

## Home is a mark, not a place

Like a **star**. Making a board Home does not move it: it stays in Remaining, or
in whatever workspace it was filed in, and it appears in the Home section as
well. Taking it off Home leaves it exactly where it lives.

The difference from a star is **how many**: any number of boards can be starred,
and exactly one — or none — can be Home. Logging in opens one board.

## The row

`fa-home`, the word **Home** (the existing `home` key, translated in every
language WeKan has), and a count beside it like the other board lists: `1` when
there is a Home board and `0` when there is not. The count asks whether the
board is still *there* — a Home board that was deleted or archived leaves its id
behind in the profile, and a row that counts 1 with nothing under it looks
broken.

**It sits under the two board lists**, above Templates and the Archive. The top
row is the one the page opens on — Starred when anything is starred, Remaining
when nothing is — and Home does not take it: after login you are already *in*
the Home board, so the row that names it is a place to look, not the place to
start. The row is there whether or not a board is at it, because the place to
drop a board onto has to exist before there is anything in it.

Its address is `/allboards/home`, the same shape as the other sections
([All Boards URLs](../../Features/Page/All-Boards-URLs.md)).

There is no **Add Board** tile in Home. A board created here would not be the
board that opens after login, so the tile would promise something it cannot do.
An empty Home says "Drag only one board here to open it after login" instead of
showing a blank pane, making the one-board limit explicit before a drag starts.

## Dragging

**Drop a board on the Home row** and it becomes the board that opens after
login. The row is one more place in a column a board icon can already be dragged
onto — Remaining takes it out of a workspace, the Archive archives it, a
workspace files it — so the gesture is the one already in the reader's hand. The
alternative is Multi-Selection, which is three clicks to set one board.

A drop **replaces**. Home holds one board, so dropping a board on it makes that
board Home whatever was there before. It deliberately does *not* toggle: a drop
that sometimes sets and sometimes clears would depend on state the reader cannot
see while dragging — you would have to remember what was already at Home to know
what your own drop was about to do. The Multi-Selection row still toggles,
because there you clicked a board you can see the state of.

Dropping a **multi-selection** does not silently choose its first board. It
reports "Please select only one board", changes nothing and keeps the selection
so it can be narrowed. A one-board drag continues to set Home normally.

### Taking a board off Home — the launcher's Remove bar

A board dragged out of Home may land in **exactly one place**: the **Remove**
target, which appears while you drag it.

This is the gesture an Android launcher uses to take an app off the home screen.
Pick an icon up and a Remove bar appears at the top; drag the icon onto it and
it turns red; let go and the shortcut is gone — while the app itself is still in
the drawer. Here the board is still in Remaining, or in its workspace, and has
only stopped being the board that opens after login.

The bar is drawn **only while a board from Home is actually in the air**. An
affordance that appears when the gesture is possible explains itself; a trash
can sitting permanently under somebody's boards is a button nobody dares press.
It spans the width of the board area — it is a target, and a target you have to
aim at is a target you miss — and it is **red only under the icon**, because the
colour is the answer to "what happens if I let go here" rather than a standing
warning about a board nobody is touching.

It **asks before doing**, the way the drop on the Archive asks, and the question
says the board itself is not deleted: that is what a reader wants to know when a
trash can is under a board they care about.

**Every other target refuses the drop.** Remaining, Starred, Templates, the
Archive and the workspaces tree all check, *in `dragover`*, whether the board
came from Home — and if it did they simply do not call `preventDefault()`, which
is how HTML5 drag and drop says no. The cursor says no while the board is still
in the air, rather than the drop landing and quietly doing nothing.

That check has to happen in `dragover`, which **cannot call `getData()`**: the
drag data store is in protected mode until the drop, and only the list of
*types* is exposed. So the fact lives in the type's **name** —
`application/x-board-from-home`, set at `dragstart` and never read for its
value. Its presence is the message.

An earlier version let a board dragged out of Home onto any other row clear Home
on the way past. That made every drop a Home drop, and a board could leave Home
by accident while you were filing it into a workspace. One gesture, one
destination, and the destination is the thing that says what it will do.

## What the server enforces

`setDefaultBoard` accepts only a board the caller is a **member of** and that is
**not archived**. A Home board that this user cannot open would send them, at
every login, to a board that refuses to draw. `clearDefaultBoard` unsets only if
that board *is* this user's Home, so dragging some other board out of a list can
never clear somebody's Home board as a side effect.

Both are Meteor methods called by an explicit gesture. Nothing automatic writes
here — in particular Sandstorm's auto-open, which opens a grain's single board,
must not thereby decide which board that user starts in
(`models/lib/sandstormAutoOpen.js`).

## Related files

| File Path | File Type | Description |
| --- | --- | --- |
| `models/lib/allBoardsUrls.js` | `.js` module, pure | `SECTION_HOME`, and `menuSectionOrder()`, which puts Home under the two board lists. |
| `client/components/boards/boardsList.js` | `.js` client | The row, its count, the section's one board, and every drag path that sets or clears Home. |
| `client/components/boards/boardsList.jade` | `.jade` template | The menu row, the Remove bar and the empty-Home line. |
| `client/components/boards/boardsList.css` | `.css` | The Remove bar, and its red under the icon. |
| `client/components/boards/allBoardsSidebar.jade` | `.jade` template | Multi-Selection's own **Set as Home board** row, which toggles. |
| `models/users.js` | `.js` collection | `getDefaultBoardId`, `isDefaultBoard`, `toggleDefaultBoard`. |
| `server/models/users.js` | `.js` methods | `setDefaultBoard` (replaces, membership-checked) and `clearDefaultBoard` (clears only its own board). |
| `config/router.js` | `.js` routes | The once-per-session redirect to the Home board after login. |
| `tests/homeBoard.test.cjs` | `.cjs` Node test | The order, the count, the drags, and what the server refuses. |

## Related

- [All Boards](../../Features/Page/All-Boards.md) — the page this is a section of
- [All Boards URLs](../../Features/Page/All-Boards-URLs.md) — `/allboards/home`
- [Archive](../../Features/Page/Archive.md) — the other section a board is dragged onto
- [Archive and Delete](Archive-and-Delete.md) — what archiving a board does
