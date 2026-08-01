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

**It is the first row when a Home board is set**, above Starred and Remaining:
it is the board this user starts in, and the row that names it belongs where
they look first. With none set the row is still there, further down, because the
place to drop a board onto has to exist before there is anything in it.

Its address is `/allboards/home`, the same shape as the other sections
([All Boards URLs](../../Design/Page/All-Boards-URLs.md)).

**Home is not the section the page opens on.** After login you are already *in*
the Home board; clicking All Boards from there means "show me my boards", and
answering with the one board you just left is not showing you anything. So the
landing section stays Starred-or-Remaining
([All Boards](../../Design/Page/All-Boards.md)).

There is no **Add Board** tile in Home. A board created here would not be the
board that opens after login, so the tile would promise something it cannot do.
An empty Home says what to drag instead of showing a blank pane.

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

Dropping a **multi-selection** sets the first of them, the same one the
Multi-Selection sidebar's Home row sets, and then clears the selection so it
cannot look as though all of them went somewhere.

**Dragging a board out of Home** — onto Remaining, Starred, Templates, the
Archive or a workspace — takes it off Home and leaves it where it lives. Exactly
the star's behaviour, and the reason the drag has to carry **where it started**:
a drop on Remaining must be able to tell "the Home board, dragged out of Home"
from "the Home board, dragged out of a workspace", which is a fact about the
drag rather than about the board. It rides on the drag itself, as
`application/x-board-from-section`.

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
| `models/lib/allBoardsUrls.js` | `.js` module, pure | `SECTION_HOME`, and `menuSectionOrder()`, which puts Home first when there is a board at it. |
| `client/components/boards/boardsList.js` | `.js` client | The row, its count, the section's one board, and every drag path that sets or clears Home. |
| `client/components/boards/boardsList.jade` | `.jade` template | The menu row and the empty-Home line. |
| `client/components/boards/allBoardsSidebar.jade` | `.jade` template | Multi-Selection's own **Set as Home board** row, which toggles. |
| `models/users.js` | `.js` collection | `getDefaultBoardId`, `isDefaultBoard`, `toggleDefaultBoard`. |
| `server/models/users.js` | `.js` methods | `setDefaultBoard` (replaces, membership-checked) and `clearDefaultBoard` (clears only its own board). |
| `config/router.js` | `.js` routes | The once-per-session redirect to the Home board after login. |
| `tests/homeBoard.test.cjs` | `.cjs` Node test | The order, the count, the drags, and what the server refuses. |

## Related

- [All Boards](../../Design/Page/All-Boards.md) — the page this is a section of
- [All Boards URLs](../../Design/Page/All-Boards-URLs.md) — `/allboards/home`
- [Archive](../../Design/Page/Archive.md) — the other section a board is dragged onto
- [Archive and Delete](Archive-and-Delete.md) — what archiving a board does
