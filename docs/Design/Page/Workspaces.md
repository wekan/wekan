# Design: Workspaces

A **workspace** is a folder for boards, in the left menu of [All Boards](All-Boards.md).
It holds boards — a board is assigned to one — and it holds **other workspaces**,
to any depth. The tree is per user: `profile.boardWorkspacesTree` on the user
document, a plain array of `{ id, name, icon, iconColor, children }`.

Each workspace has an address of its own — `/allboards/workspaces/engineering/backend`
— built from the **slugs of its names down the tree**; see
[The All Boards URLs](All-Boards-URLs.md).

## What a row shows

In reading order: the **caret**, the **drag handle** (when handles are on), the
**icon**, the **name**, the ⋯ **menu**, and the **count of boards** in it.

The **selected** workspace is filled with the theme accent, and that fill covers
the icon and the name only — the menu and the count sit after it on the panel's
own grey, so they are styled the same whether the row is selected or not.

## Folding a workspace

A workspace that holds other workspaces has a **caret** at the start of its row,
and it folds them away. It is the control a **list** has on a board and the one
the left menu itself has: **down** while open, **right** while folded, with the
same two words — Collapse / Uncollapse — in its tooltip.

The caret is **first**, before the drag handle, so the carets of a tree line up
in one column whether or not the drag handles are shown. A workspace with nothing
under it gets a **spacer of the same width** instead: a row that shifted sideways
the moment it gained its first child would be a moving target.

It is an anchor with no `href`, so it carries `role="button"`, `tabindex="0"` and
a `keydown` handler for Enter and Space — a tree that can only be opened with a
mouse is a tree half the readers cannot open. Its `aria-label` names the
**workspace** as well as the action, because a label replaces the element's own
text and a tree of carets would otherwise announce the same two words over and
over with nothing to tell them apart.

**Open is the default**, and only the folded ones are stored: a missing key is an
open workspace, so a tree of fifty with two folded is two keys. It is remembered
in the same three layers as everything else in this menu — a **Session** value so
the caret answers at once, `profile.collapsedWorkspaces` on the user document, and
the `wekan-collapsed-workspaces` **cookie** when nobody is signed in.

The server method takes the workspace id into a **dotted field path**, and the
tree it comes from is written by the client — so the id is checked against
`^[A-Za-z0-9_-]{1,64}$` first. An id carrying a `.` or a `$` would otherwise
address a different field. Unfolding `$unset`s the key rather than storing
`false`, so the map holds only what is folded.

## Dragging one workspace onto another

Where in a row it is dropped is what the drop **means**:

| Dropped on | What it means |
| --- | --- |
| the **top** quarter of a row | it becomes that row's **previous sibling** |
| the **bottom** quarter | it becomes that row's **next sibling** |
| the **middle half** | it becomes that row's **last child** — a sub-workspace |

The middle is the biggest target on purpose: reordering can also be reached by
aiming at the neighbouring row's far edge, but **nesting has only this one**.

**The placeholder is a slot, not a line.** While the pointer is over a row, an
empty slot a row high opens above it, below it, or — for "into this one" —
**indented underneath it**, which is exactly where the workspace will appear. A
2px dashed outline, so it reads as somewhere free rather than as content. A line
between two rows is a target that has to be aimed at; a slot is a place to drop
into.

The slot is a pseudo-element **of the row**, so the rows below it shift down and
the row being aimed at stays where the pointer put it.

**A workspace may not be dropped into itself or into its own descendant.** The
subtree would be cut off from the root and every workspace under it would go with
it. It is refused by *not* calling `preventDefault()` — which is how HTML5
drag-and-drop says no — so the cursor refuses while the workspace is still in the
air, rather than the drop landing and quietly doing nothing.

**Coming back up is a drop like any other**: a child dragged onto the edge of a
root row becomes a root again. Nesting has to be undoable, or a workspace put one
level too deep is stuck there.

### Where a drag may start

The **Show desktop drag handles** toggle in the first header bar decides — the
same setting swimlanes, lists, cards and the board tiles obey:

- **Handles on** — the ✥ handle, and only the handle.
- **Handles off** — the workspace's **icon and name**, which is the whole
  `a.js-select-space`. Clicking it still opens the workspace: a click and a drag
  are two gestures on one element.

Never the whole **row**: it also holds the ⋯ menu and the count, and a drag from
those is a drag of something else.

Two things make the handles-off drag work at all, and both are easy to leave out:

- **`.nodragscroll`** on the anchor. The page-level dragscroll takes a mousedown
  it is not opted out of, and a drag that never begins is what "reordering does
  not work" looks like.
- **`user-select: none`** while it is the drag source. The name is text, and a
  press-and-move over selectable text starts a **selection** — the browser owns
  the gesture from there and the element drag never begins.

And one thing the drop had to stop doing: a drag that starts on an **anchor**
gets that anchor's text put into `text/plain` by the browser itself. The drop
read `text/plain` first and took the workspace for a **board**, so it assigned
nothing and the row snapped back. The drag now `clearData()`s before setting its
own type, and the drop decides on the **workspace id first**.

## Unlimited depth

The template draws **itself** for a workspace's children, so the depth of the
tree is whatever has been dragged into whatever — there is no level count
anywhere to raise. Each level indents by one caret's width
(`padding-inline-start`, so a right-to-left language indents from the right by
itself), which puts a child's caret under its parent's **name**.

## Related files

| File Path | File Type | Description |
| --- | --- | --- |
| `models/lib/workspacesTree.js` | `.js` module, pure | What a drag does to the tree: `dropPosition()` and `moveWorkspace()` with the guards that keep a subtree attached to the root. No Meteor, no DOM. |
| `client/components/boards/boardsList.jade` | `.jade` template | `workspaceTree` — the row, its caret, and the recursion that gives the tree its depth. |
| `client/components/boards/boardsList.js` | `.js` Blaze template logic | The caret's helpers and handlers, the drag/drop wiring, and the drop marks. |
| `client/components/boards/boardsList.css` | `.css` stylesheet | The caret, the indentation per level, and the drop slots. |
| `client/lib/utils.js` | `.js` client | `getWorkspaceCollapseState()` / `setWorkspaceCollapseState()`: the Session value, the profile field and the signed-out cookie. |
| `models/users.js` | `.js` model | `profile.boardWorkspacesTree`, `profile.collapsedWorkspaces`, and the cookie pair for a reader who is not signed in. |
| `server/models/users.js` | `.js` server | `setWorkspacesTree` and `setWorkspaceCollapsed`. |
| `tests/workspacesTree.test.cjs` | `.cjs` Node test | The three moves and what they refuse, and that the page is wired to those rules rather than re-deriving them. |

## Related

- [All Boards](All-Boards.md) — the page this menu belongs to
- [The All Boards URLs](All-Boards-URLs.md) — how a workspace is addressed
- [Left menu](Left-Menu.md) — the panel it is drawn in, and its own fold
