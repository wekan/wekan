# Design: the All Boards page

All Boards (`/board`, and the Starred / Templates / Remaining sections with it) is
a left menu, a header bar of controls, and a view of the boards themselves.

Its **Table** view is a table page: everything about the table's layout, controls
and paging is defined once in [the Table page design](Table.md), and only what is
particular to it is described here.

## The controls live in the header bar

There is **one** row of controls, and it is the **first** top header bar — the
one that is always on screen and says `All Boards / Starred`. They sit to the
**left of the notification bell**, which is exactly where a board's own controls
sit, styled the same way: `.board-header-btn`, the same Font Awesome glyphs, the
same emphasis state when a control is on.

| Control | Icon | What it does |
| --- | --- | --- |
| Sort | `fa-sort` | Opens the boards sort popup. Emphasised while a sort other than the custom order is active. |
| Search | `fa-search` | Opens the right sidebar on its search view — [Search](Search.md). |
| Multi-Selection | `fa-check-square-o` | Turns board multi-selection on and opens the sidebar that holds what to do with a selection — [Multi-Selection](Multi-Selection.md). |
| Lists / Table | `fa-trello` / `fa-table` | The view menu — see below. |

Each names itself beside its icon where the bar has room for it, and loses the
label below 1100px with every other one — see [the header](Header.md).

**Archive is not one of them.** The three above act on the boards in
front of you; the Archive is a *place* you go instead, so it is a row of the
**left menu**, the last of its four rows, with a count beside it like the three
board lists above it. It is labelled **Archive** — one word, like Starred, Templates and Remaining
beside it, and the menu already says what it is listing. That is `archives`, an
existing key, and the *section title* uses the same one so the header's path and
the highlighted row cannot name one place two ways.

It opens as a **section of this page**, drawn beside the menu — not as a
full-width page that replaces it. Selecting something from a menu and then losing
the menu is a menu that throws itself away. Its address is `/allboards/archive`,
in the same shape as the other four sections, and the template is the archive's
own so its search and its pager come with it. The standalone `/archive` page
still exists for a direct link, and the *sidebar's* row still goes there.

Its count is asked of the server (`getArchivedBoardsCount`, the method the
archive's own pager uses) rather than counted from what this page has: All Boards
does not subscribe to archived boards at all — its query is `archived: false` —
and the archive's publication is paginated to 30, so counting minimongo would
answer 0 on a fresh load and something arbitrary later.

**A board can be dragged onto it** to archive it, from any of the four lists or
from a workspace. The left menu already accepts a drop on Remaining, so the
gesture is the one already in the reader's hand; the alternative was three clicks
through Multi-Selection. It asks first, because a drop is easy to make by
accident — a board dragged to reorder that lands one row low.

## The pane's heading

The right pane opens with a **heading naming the section you are looking at** —
Starred, Remaining, Home, Templates, Archive, or a workspace's own name. The
page is five lists of boards under one name, and without it the pane began with
board tiles and nothing said which list they were.

It is the Admin Panel's **own** `paneTitle` template with the **same**
`.admin-pane-title` class, so the two pages have one heading at one size and
colour rather than two written twice that drift apart. Only the space below it
is set here: the Admin Panel's gap rule is scoped to its own `.main-body` and
does not reach this page.

Drawn **once, above the view branch**: the board icons and the Table are two
ways of showing the same section, not two sections.

Its words are the section's own **title key** — the same key the first header
bar names the page with, and the same one the highlighted menu row carries — so
all three say the same thing. A **workspace** is the exception: its name is what
somebody typed, so it is passed as a label and never goes through the
translator, because a workspace called "starred" is not the Starred section.

## Which section the page opens on

Starred was always the landing section, and on an account that has starred
nothing that is an **empty page with a full one behind it** — which reads as
WeKan having lost the boards rather than as a section the reader has not filled
yet. So `/`, which names no section, opens **Starred when anything is starred
and Remaining when nothing is**, and the menu puts whichever one that is **on
top**, so the highlighted row is the first row.

The rule is `defaultSection()` / `menuSectionOrder()` in
`models/lib/allBoardsUrls.js` — a boolean in, a section name (or the five rows in
order) out — so the page and its guard read the same one. Only the first two
rows move; [Home](../../Features/Board/Home.md), Templates and the Archive keep
their places under them.

**The router does not answer this.** It runs before the user document has
necessarily loaded, so it writes `null` for `/` and the page picks. The page
picks in an **autorun** for the same reason: on a cold load the user document
lands after the template is created, and a single read would answer "nothing is
starred" for everybody. It asks the user document's own `profile.starredBoards`
rather than `user.starredBoards()`, whose Boards query depends on the
subscription and would flip from none to some partway through a load — drawing
Remaining and then jumping to Starred under the reader.

An address that **does** name a section still wins over all of this: selecting a
row navigates, the route puts that name in the Session, and the fallback stops
applying. This cannot fight a choice the reader has made.

The rows are **one row in the markup, drawn once per section**, since an order
that depends on the user cannot be five copies of the same eight lines without
moving markup about. Their icons and names live in a map beside the loop.

The left menu is three kinds of thing in one column — the three board lists, the
workspaces tree, and the archive — so the Workspaces section has a rule above and
below it. Without them the tree ran into its neighbours as if it were more of the
same list. The menu itself is styled like the **Admin Panel's** ([Left menu](Left-Menu.md)),
and reaches the window's **left and bottom edges** the way that one does — it is
a fixed side of the window, not content floating inside the page. The Admin Panel
gets that for free: `.setting-content` sits *outside* `.wrapper`, absolutely
positioned at full width and height. All Boards is in normal flow inside
`.wrapper`, which is `width: calc(100% - 28px); margin: 0 auto`, so it opts out
of that inset and takes its height from `100vh` minus `--wekan-header-height` —
the height the header *measures* itself to be, because the bar wraps and is not
one fixed height. A **minimum**, so a page with more boards than fit still grows
past it.

The **rows** follow it too, not only the colours: the same `2px 4px` margins,
the same block padding and reading-direction indent, and **no rounded corners**,
so a selected row is a block across the menu rather than a pill floating inside
it. The panel adds no side padding of its own — the rows carry their own margin,
and padding on the panel would inset every row a second time. "Workspaces" uses
the Admin Panel's group-heading treatment (smaller, uppercase, quieter), because
it names a group and is not an entry of one.

It is a panel with its own background, border and rounded corners, a selected row
filled with the per-user theme accent and white text, and a white hover with a
shadow. WeKan has one kind of left menu and it should look like one kind of left
menu. A long one scrolls inside the panel rather than spilling past its own
rounded corner — the same fix the Problems menu needed.

The rules around the Workspaces section are a 2px `#888` line — **dark** grey,
and a grey this stylesheet already uses. The first version was a `#e0e0e0` hairline, the same
grey as the menu's own right edge, and it was too faint to separate anything: a
light grey needs *area* to be seen at all, and area is what turns a divider into
something that reads as another row. A dark one is legible as a line, so it stays
a line. 2px rather than 1 because at 1px a mid-tone rule can land on a half-pixel
boundary and be drawn as two lighter rows on a fractional-scale display — which
is the same faintness this was meant to fix.

They have been in three places. They were a row of the page's own body, then a
second top header bar, then rows of the right sidebar's home view — and that
last one meant opening a panel *over the boards* to reach the thing you came
for. They are one click now, and nothing covers the page.

**There is no hamburger on this page, and no divider before one.** The
hamburger's only destination was that home view, which listed these same four
things; a menu to reach what is already one click away is a step with nothing in
it. The sidebar is still opened — by Search and by Multi-Selection, straight
into their own view. `NO_HAMBURGER_ROUTES` in `models/lib/pageSidebar.js` is
what says so, and a board is deliberately not in it: what a board's sidebar
holds — members, labels, activities, settings — is not in the bar and has
nowhere else to be opened from.

**A Blaze event map only sees events inside its own template.** These buttons
and the sidebar's home rows are the same markup in two places, so each has its
own map; a copy with markup but no map is a button that silently does nothing,
which is what happened to Boards in Archive once already.

**Starred is not a control here.** It is a *section*, and the left menu already
lists it beside Templates and Remaining, counts it, and highlights it when it is
the one shown. A second way to reach one section, one click away from the first,
is a button whose only job is to be kept in step with the menu.

**The actions on a selection are in the sidebar**, not in this bar. They were
four icon-only buttons crowded in beside the controls; the sidebar gives each
one its name, and it is where a board keeps them too. See
[Multi-Selection](Multi-Selection.md).

### Every button names itself in a tooltip

The controls are icons, so the tooltip is the only place a name can be — a
button without one is an unlabelled picture. Every `.board-header-btn` in the
bar carries a `title`, and every title comes out of a translation key rather
than being literal English.

The ✕ that turns Multi-Selection off used to say "Clear filter", which is what a
different control does. It says `multi-selection-off` now, because there is only
one of it.

## The right sidebar

All Boards has one, and it is not the board sidebar: that one is built around a
board — its members, labels, activities and settings — and this page has no
board. What it borrows is the **shell**, so the two look and behave alike: the
same `.board-sidebar.sidebar` classes, the same `.sidebar-actions` row with the
✕, the same `.sidebar-content` with a title and a back arrow above the view.

| View | Opened by | What it is |
| --- | --- | --- |
| `home` | the back arrow of another view | The page's own menu: Search, Multi-Selection, and [Boards in Archive](Archive.md) — which is a page, so that row leaves the sidebar rather than opening in it. The default, as `homeSidebar` is on a board. No title and no back arrow — there is nothing behind it. Nothing *opens* the sidebar here any more, since those four are in the header bar; it is what you land on going back. |
| `search` | the Search button | [Search](Search.md) |
| `multiselection` | the Multi-Selection button | [Multi-Selection](Multi-Selection.md) |

Which views exist, and the template each one draws, is
`models/lib/allBoardsSidebar.js` — pure, so a guard can check that every view
resolves to a template that exists. The template names are a **map**, not
derived from the view name: deriving them produced
`allBoardsMultiselectionSidebar` for a template called
`allBoardsMultiSelectionSidebar`, and a name one letter wrong renders nothing at
all.

Open/closed and which view are two separate variables, so closing does not
forget where you were: press Search again after closing and you get the search
you had. Clicking the button of the view already showing
closes the sidebar again, so the button that opened it also shuts it. Escape
closes it — the **key** only, because the click half of `EscapeActions` would
close it on every click, including clicks on its own contents.

### Where it sits

On a **desktop** it is pinned to the viewport: `top` is
`var(--wekan-header-height)` — the height the header MEASURES itself to be,
kept current by a ResizeObserver in `client/lib/utils.js`, because the header is
not one fixed height (its buttons wrap to one, two or three rows depending on
language and window width) — and `bottom` is the window. So it is full height,
starting below the header, exactly like the board's.

It first inherited the board sidebar's `position: absolute`, which resolves
against the nearest positioned ancestor. On a board that ancestor is the board
container, which already starts below the header and runs to the bottom of the
window. This page has no such container, so the panel floated in the middle of
the page, **over** the board icons, and ended as soon as its content did.

And the boards move **left** rather than being covered:
`.all-boards-wrapper.sidebar-open .boards-layout` gives the panel its 420px
back, so the icons reflow into what is left between the menu and the panel and
every one of them stays visible.

On a **phone** neither applies: `.board-sidebar.sidebar` in the board sidebar's
own stylesheet already pins this element — it carries that class — to the full
screen width below the header, which is what a phone should do. There is nothing
to move aside from a full-width panel.

### It carries a theme

`.sidebar .sidebar-content .sidebar-btn` is a light grey box whose text is
**white**. What makes that readable on a board is a `.board-color-*` ancestor
replacing the grey with a themed colour — and this page has no board, so without
one every button is white on light grey, invisible. The theme is
`board-color-belize`, the established default for a themed thing outside a board
(`globalSearch.js` falls back to the same one).

**On an ancestor, never on the sidebar itself.** Every themed sidebar rule is a
*descendant* selector:

```css
.board-color-belize .sidebar .sidebar-content .sidebar-btn { … }
```

so a class on the `.sidebar` element matches **nothing**. The first version put
it there and the buttons stayed white on light grey; `.all-boards-sidebar-theme`
is a wrapper that *contains* the sidebar, the way a board's container contains
its own. It wraps only the sidebar, so the theme cannot bleed into the board
icons behind it, and it is out of flow — the sidebar inside is `fixed` — so it
costs no layout.

The theme is a class in the markup, so it is the **same at every width**; only
the geometry above is desktop-only.

## The view menu

The button shows the **name of the current view**, not the word "Board View" — the
same as the board header, which says "Swimlanes" or "Lists" rather than naming the
menu. It offers two:

| View | Icon | What it is |
| --- | --- | --- |
| **Lists** | `fa-trello` | The board icons. **The default.** |
| **Table** | `fa-table` | The table page below. |

"Lists" is the default and is what an account that has never chosen sees.

The choice is remembered per browser (`localStorage`), not on the user document:
it is a view preference for this page, it changes nothing anybody else can see,
and it is not worth a profile field or a round trip. This is the one place All
Boards deliberately differs from a board, whose view IS on the profile because it
follows the user between devices.

## The Table view

A table page, editable — which is the difference from
[Public Boards](Public.md), the other board table, which is read-only.

| Column | What it is |
| --- | --- |
| Edit | A pencil that opens the **Edit board title** popup — the same `boardChangeTitlePopup` the Swimlanes view opens from its board menu, with the same title and description fields and the same Rename button. |
| Board title | The board's title. The link: it opens the board. |
| Board description | The board's description. |

The Edit popup is the *same* popup, not a copy of it. It took one change to make
that true: its submit handler read `Utils.getCurrentBoard()`, which is the board
you are looking at — and on All Boards you are not looking at one. It now takes
the board from its own data context when it has one and falls back to the current
board, so the board header keeps working exactly as before and a table row can
open it for the board of that row.

Rows are ten per page, the shared `TABLE_PAGE_ROWS_PER_PAGE`, and the table shows
the boards of the section the left menu has selected, filtered by the search
field — the same set the Lists view would draw.

## What stays on the left

The left menu keeps its sections (Starred, Templates, Remaining), the workspaces
tree and the organization / team filters. Starred is *only* here now: the header
bar had a Starred button beside it, and two ways to reach one section, one click
apart, is a control that has to be kept in step with the menu for no gain.

### What a workspace row shows

The full design of the workspaces tree - folding, nesting, the drop slots and the
depth - is [Workspaces](Workspaces.md). What follows is the part of it that is
about this page's left menu.


Icon, name, the ⋯ **menu**, then the **count of boards** in it — the count last,
at the end of the row, where the counts of the sections above it are too.

The **selected** workspace is filled with the theme accent, and that fill covers
`.js-select-space` — the icon and the name — not the whole row: the menu and the
count sit after it on the panel's own light grey. So the count is styled the same
whether the row is selected or not. It once had a light pill "for contrast
against the filled row", which was white on light grey — the selected workspace
was the one row whose board count could not be read, and it is the row you have
just asked which boards are in.

The menu and the count are `flex: 0 0 auto` and the name's anchor is `flex: 1`
with `min-width: 0`, so a long workspace name ellipses itself instead of
squeezing its two neighbours off the row.

### Reordering a workspace

A workspace row obeys the **Show desktop drag handles** toggle in the first
header bar — the same setting swimlanes, lists, cards and the board tiles obey,
through the same `isTouchScreenOrShowDesktopDragHandles` helper.

- **Handles on** — the ✥ handle is drawn at the start of the row, and it is the
  only place a workspace drag may start.
- **Handles off** — no handle, and the workspace's **icon and name** — the whole
  `a.js-select-space` — is what reorders it.

The icon *and the name*, because a 16px glyph is a target that has to be aimed
at and the name beside it is the part of the row a reader is pointing at anyway.
Clicking that same anchor still opens the workspace: a click and a drag are two
gestures on one element, exactly as they are on a board tile with handles off.

Not the whole **row**, though — the row also holds the ⋯ menu and the board
count, and a drag started on those is a drag of something else. So `draggable`
lives on the handle or on the anchor, never on the row, and the `dragstart`
handler stays on the row because the event bubbles up from whichever child
started it.

Two things make the handles-off drag real rather than declared, and both are
easy to leave out:

- **`user-select: none`** on the anchor while it is the drag source. The name is
  text, and a press-and-move over selectable text starts a **selection** — the
  browser owns the gesture from there and the element drag never begins. The
  handle never needed it because a glyph in a span is not text you would select.
- **`.nodragscroll`**, the same class the handle carries. The page-level
  dragscroll takes a mousedown it is not opted out of, and a drag that never
  begins is exactly what "reordering does not work" looks like.

The cursor stays `pointer` on that anchor rather than becoming `grab`: opening
the workspace is what a reader does with it nearly every time. Everything that
does change follows the `draggable` attribute itself (`[draggable="true"]` in
the selector) rather than a second class, so there is one answer to "is this the
drag source right now".

## Related files

Only what is particular to this page; everything shared by table pages is in
[Table.md's own list](Table.md#related-files), and the two shared header-bar
controls have their own lists in [Search](Search.md) and
[Multi-Selection](Multi-Selection.md).

| File Path | File Type | Description |
| --- | --- | --- |
| `client/components/boards/boardsList.jade` | `.jade` template | `boardList` (the page), `boardListHeaderBar` (the controls) and `allBoardsRow` (a Table row). |
| `client/components/boards/boardsList.js` | `.js` Blaze template logic | The controls' handlers, the view switch, the Table column spec. |
| `client/components/boards/boardsList.css` | `.css` stylesheet | The page's own layout. The header bar and the sidebar reuse the board header's and board sidebar's styles rather than restating them. |
| `client/components/boards/allBoardsSidebar.jade` | `.jade` template | The sidebar shell and its three views. |
| `client/components/boards/allBoardsSidebar.js` | `.js` Blaze template logic | The views' helpers and handlers. |
| `models/lib/allBoardsSidebar.js` | `.js` module, pure | Which sidebar views exist, their titles and the template each one draws. No Meteor, so it is unit-testable. |
| `client/lib/allBoardsSidebar.js` | `.js` module | Whether the sidebar is open and on which view, and the Escape action that closes it. |
| `models/lib/allBoardsView.js` | `.js` module, pure | Which board views exist, which is the default, and how an unrecognised stored value is treated. |
| `client/lib/allBoardsView.js` | `.js` module | The Meteor and browser glue: the ReactiveVars the templates share (they are separate Blaze instances) and the `localStorage` the view choice is kept in. |
| `client/components/boards/boardHeader.jade` | `.jade` template | `boardChangeTitlePopup`, shared with the Swimlanes view. |
| `client/features/boards.js` | `.js` import list | Every `.jade` above has to be imported here, or its templates do not exist at runtime. |
| `tests/allBoardsPage.test.cjs` | `.cjs` Node test | The controls are in the header bar and nowhere else, the sidebar's shell and views, the view menu's two entries and its default, the Table's columns, and that the Edit popup is the shared one. |
| `tests/templateRegistration.test.cjs` | `.cjs` Node test | Every `.jade` is imported, and every `+template` it includes exists. |

## Related

- [Boards in Archive](Archive.md) — the page the sidebar's Archive row opens
- [The All Boards URLs](All-Boards-URLs.md) — a URL per left-menu entry, workspaces included
- [Search](Search.md) — the shared Search control and both search views
- [Multi-Selection](Multi-Selection.md) — the shared Multi-Selection control and both views
- [The Table page design](Table.md) — everything shared by table pages
- [Public Boards](Public.md) — the other board table, read-only
- [Workspaces](Workspaces.md) — the tree in the left menu: folding, nesting and the drag
- [Left menu](Left-Menu.md)
