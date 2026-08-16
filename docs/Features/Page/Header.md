# Design: the header

WeKan has **one** header bar. It is always on screen, it says where you are, and
it holds the controls of whatever page you are on.

There used to be two. The first was a thin strip with the house icon, the logo
and your account; the second was a coloured block that every page filled with its
own title and its own buttons. That second bar is gone from every page but the
few that still have something only it can hold, and `#header` is not rendered at
all where a page has none — it is a coloured block with a height of its own, so
leaving it in painted a tall empty strip under the first bar.

## What the bar says

Beside the house icon is **the page you are on**. It used to read "All Boards" on
every page, so the one bar that is always on screen named a place you were not.

`models/lib/pageTitles.js` maps a route name to a translation key. Three sources,
in order:

1. **the board's title**, wherever there is a board — the one thing worth having
   there;
2. **a custom title** — Support and Accessibility can be renamed by an admin, and
   Import names its source ("Import / Trello");
3. **the key** for everything else.

A board title and a custom title both come back as `title` rather than `key`,
because both are text to print as-is: neither may go through the translator, and
a board called "settings" is not the Admin Panel.

A route nobody has added answers with nothing and the bar shows nothing — better
than naming the wrong page.

### …and the path, in its tooltip

Two pages are several places under one name. The bar shows the **root** —
`All Boards`, `Admin Panel` — and the whole path is the title's **tooltip**:

```
All Boards / Workspaces / Engineering / Backend
Admin Panel / Settings / Version
```

The path is what the page *is*, but it grows — a workspace nests as deep as its
tree does — and this bar is the one strip always on screen and already short of
width. So the root names the place and the tooltip carries the rest.

`headerTitleFullPath()` in `client/components/main/header.js` resolves it to one
string, because a `title` attribute is plain text and cannot hold the `{{_ }}`
calls the visible version used. It reads the **same** `headerTitle()` and the
same trail the visible name does, so the two cannot disagree about where you are.
A workspace's own name still does not go through the translator.

The trail itself is `headerTitleTrailOf()`, a **plain function rather than a
helper**: the tooltip needs it too, and a Blaze helper cannot call a sibling
helper — `this` there is the data context, not the helpers object.

It is **one list** rather than a helper per segment, because the two pages do not
have the same number of them: the Admin Panel always has two, and a workspace has
as many as its tree is deep. Each entry is one of the two forms a left-menu entry
has — `key` for something translated, `title` for text that must not be.

The words are the ones the navigation beside it already uses — the Admin Panel's
tab key and its menu row's label ([Admin Panel URLs](Admin-Panel-URLs.md)), the
All Boards left-menu key and the workspace's own name
([All Boards URLs](All-Boards-URLs.md)) — so the tooltip and the thing
highlighted next to it cannot say different things about one place.

It is read from the **URL** and from the user document, never from the pages
themselves. The header is a separate Blaze instance, and importing a page module
from it once ran that module before its own template was registered; the throw
aborted every module after it, which is why `client/lib/pageTitleSources.js`
exists — it registers no template and touches no DOM, so it is safe to load
early.

## What the bar holds

In source order: the house and the page title, the logo, the phone/desktop
toggle, the drag-handles toggle, and then everything else.

**The board's controls fold.** A caret leads the group, at its leading edge —
left of the lock in a left-to-right page, right of it in Arabic. Folded, the
seven controls after it (Private, Muted, Sort Cards, Filter, Search, Show
dependencies, Multi-Selection) are gone and the bar is the logo, the board's
name and the caret. The buttons a board's own Rules put in this bar are not
folded with them: somebody added those to this board on purpose. The choice is
the reader's and lasts the session — `client/lib/foldState.js`, the same store
the right sidebar's Members and Labels use.

On a board, and for a board admin, **the title is also the rename button**:
clicking it opens the same `boardChangeTitlePopup` that a pencil beside it used
to open. One target instead of a word and an icon that did the same thing — and
the icon was the smaller of the two. A board whose title is empty renders no
text, so `.header-page-title.is-editable` carries a minimum width: without it
the element would be zero pixels wide and an empty title could never be given
one.

The groups that hold many buttons are `display: contents` — the board's ten
controls, the Admin Panel's four tabs, and the end group itself. A wrapper div is
**one item** to the bar, so when the last button of a group did not fit, the
whole group moved to the second row together and the first row ended with half
the bar empty. With no box generated, the buttons are items of the bar and wrap
one at a time. `#notifications` and the divider-plus-hamburger stay boxes on
purpose: the first also contains the drawer that opens under the bell, and the
second is a pair that means nothing apart.

**Every item is spaced the same** — 4px each side, so the gap between any two
neighbours is 8px. Two of them used to differ: the phone/desktop toggle carried
14px and the page title's end margin was 1rem, which gave the drag-handles toggle
18px on its left against 8px on its right, and the logo 16px against 4px. Uneven
gaps read as holes rather than as spacing, and the logo needed a class of its own
(`header-logo`, on all three branches — a custom logo that links, one that does
not, and the stock one) before it could carry a margin at all.

**The page's own items pack from the start and wrap forward** — left to right in
a left-to-right language, right to left in a right-to-left one, which flexbox
does by itself because it follows the writing direction. Nothing among them is
pushed to the far end or centred in the leftover space.

**One group is placed rather than packed:** what belongs to *you* rather than to
the page — the seam divider, help, your account, and the sidebar toggle behind
its own divider. `.header-account-group` sits at the **end** of the bar, from a
single `margin-inline-start: auto`, which is a logical property and so mirrors
itself in a right-to-left language.

It is a **box**, unlike the page's button groups: those are `display: contents`
so they wrap one button at a time, but these five belong together, and an avatar
left on the first row with its hamburger on the second is worse than the cluster
moving down whole. On a row that wrapped there is no free space for the auto
margin to absorb, so it packs from the start there — which fills the second row
rather than stranding it.

Both used to happen: the buttons after the drag-handles toggle were pushed by an
`auto` margin, and on a phone the bell was centred by an `auto` margin on *each*
side. Either puts a hole in the middle of the row, and which items land on which
side of the hole changes with the window width. One run of items, in source
order, is what a reader can scan.

That group is `display: contents` — it generates **no box**. It used to be a flex
box of its own, which made it *one item* to the bar, so when the bar ran out of
width the whole group moved to the second row together: every icon after the
drag-handles toggle went down at once, leaving the first row empty from halfway
across while the second was crowded. With `contents` its buttons are items of the
**bar** and wrap one at a time, so the second row takes only what did not fit on
the first. The group stays in the markup — it is what says where "the end of the
bar" begins — and the auto margin moves to its first child, the item that has to
push the rest to the end. On a row that wrapped there is no free space for that
margin to absorb, so those items simply pack from the start, which is what fills
the second row instead of stranding it.

Inside that group: the starred-boards dropdown, the page's own controls, the
page's view menu, the Admin Panel's tabs, the notification bell, **a divider**,
help, your account, and the sidebar hamburger where the page has one.

The divider is the seam: everything before it belongs to the **page**, everything
after belongs to **you**. Without it the run of icons reads as one list of
unrelated things.

**Every button says its name, on every page and at every width.** Sort Cards,
Filter, Search, Show Dependencies, the board's visibility and watch level,
Multi-Selection, the view menus, All Boards' four controls, the Admin Panel's
four tabs and the notification bell. A tooltip is the one place a name cannot be
read without hovering, and six view glyphs or a bare check-box outline say very
little on their own.

The labels used to be dropped when the bar ran out of room — first below a fixed
1100px, then by *measuring* whether the bar had wrapped. Both are gone. The bar
**wraps** rather than clipping, and a wrapped second row is a better answer than
a row of unlabelled pictures, so there was nothing left for the measurement to
decide. It is deleted rather than left inert: a mechanism that no longer decides
anything still reads as one that does.

A label never wraps mid-button — two lines inside a one-line button is worse than
the tooltip was — and each one uses the **same translation key as its own
tooltip**, so a button and its tooltip cannot say different things, and a button
whose name changes with its state (Sort is on, Hide dependencies) says the state
in both places.

Visibility and Watch go further: their label is the same **dynamic** expression
as their tooltip — `{{_ currentBoard.permission}}` and `{{_ watchLevel}}` — so
one line of markup covers Private and Public, Watching and Tracking and Muted.
Written out per value it would be two lists of words to keep in step with each
other and with the board.

The **bell** carries the same label class as the rest, so it is named the same
way. Its own stylesheet makes it a fixed 28px *square*, which is right for a lone
icon and clips a word, so in this bar it sizes to its content; scoped to this
bar, because elsewhere the toggle is still just a bell.

### The username

`header-keeps-text` marks All Boards and the Admin Panel, where the **username**
stays at every width. Elsewhere the narrow-screen rules collapse it to
`font-size: 0` — the avatar stays, and the name stays in the DOM for screen
readers — because a full name is easily 100px of a 375px bar, which is what
pushed the avatar onto a second row. Those two pages carry four buttons where a
board carries ten, so the room is there, and the name is who you are signed in
as.

Every hiding selector is answered with its own copy carrying the class: the
widest of them carry `.iphone-device`, which outweighs an id and a class on its
own, so a single short override would lose on exactly the narrow screens this is
about.

### The star group

Two buttons, drawn as one thing with a rounded outline of its own:

| | |
| --- | --- |
| caret + **count** | how many boards you have starred — opens the list of them |
| **star** | whether *this* board is one of them; clicking it toggles |

The dropdown used to carry a star icon as well, so with the board's own star
beside it the bar drew **two stars in a row**, which read as one control somehow
drawn twice. The dropdown has no star now: the count is what it is about, and the
caret says it opens.

The outline is shaped like the phone/desktop toggle's, but **white** where that
one is black — the toggle is a white box sitting on the bar, so a dark border
shows against it, while these buttons sit on the bar's own colour and need a
light one. Without any outline the two read as unrelated icons that happen to be
adjacent.

The dropdown's popup is **titled** "Starred Boards" and so has a header, and the
header is what carries the close button — a titleless pop-over renders `no-title`
with nothing to shut it but clicking away.

The title reuses `starred-boards`, the key the app **already** has for that
phrase, through a `titleKey` option on `Popup.open`. The convention is
`<popupName>-title`, which is right when a title is that popup's own words and
wrong here: it would put a second copy of one phrase into all 147 language files,
English in every one at first, so most languages would show English for something
they have already translated.

The star shows its **state** (hollow when not starred, solid when starred) and
says the **action** in its tooltip. It is its own template, `boardStarButton`, so
this bar can place it here rather than among the board's other controls further
along — a Blaze event map only sees events inside its own template, so its
helpers and its click came with its markup.

### Filter and Search shut what they opened

Clicking either while the sidebar is already showing its view **closes** it — the
control that opened the panel is the one you reach for to shut it, and they only
ever opened, so a second click did nothing visible and the only way back was the
sidebar's own ✕ somewhere else on screen.

**Filter has one exception: while a filter is on.** The sidebar is then the one
place that says *what* is being hidden from the board, and closing it would leave
a board showing a subset of its cards with nothing on screen to say so. Clicking
then keeps it open; the ✕ beside the button is what clears the filter. Search has
no such case — its results are inside the panel and it hides nothing from the
board — so it always toggles.

"Showing its view" means open **and** on that view — a sidebar open on Activities
is showing neither, and clicking either button there switches to it rather than
closing the panel.

`models/lib/sidebarViewButton.js` holds the rule and one helper applies it, so
"which way does this click go" is answered once for both buttons and can be
checked in every combination without a DOM.

**The button of the page you are on keeps the hover background**, permanently and
a shade darker. Darker rather than equal: hovering the tab you are already on has
to still look like a hover.

### It wraps

`#header-quick-access` is `flex-wrap: wrap` with a row gap, and **every** height
on it is a minimum. It used to be one row with `overflow: hidden`, so a button
that did not fit was not drawn at all — and a button that is not drawn gives no
sign that it exists. Four phone rules pinned 40px or 48px; a fixed height cannot
hold two rows, so it would have cut off exactly what the wrap was for. A phone is
where the buttons run out of room first, which makes it the last place that
should hide them.

`--wekan-header-height` is what anything laid out against the viewport starts
below. It measures **both** bars — the bottom of the lowest one present, rather
than a sum of heights, so any margin between them counts and a bar that is absent
contributes nothing without a special case — and each bar has its own
`ResizeObserver`, because the first one wrapping to a second row is a resize of
that element and of nothing else. `client/lib/utils.js` keeps it current.

## Where the bar starts

The All Boards **house** is the first thing on the page, and it starts on the
same vertical line as the **left menu's rows** below it — **22px** — at *every*
window width. One line down the left edge of the page.

That 22px is a **sum**, and the whole of it is:

- **12px** — `--wekan-header-gutter`, the bar's own padding. It is on the BAR
  rather than on its first item because the bar wraps: padding applies to every
  row it wraps onto, while a margin on the first item would indent the first row
  and leave the second starting at the edge.
- **4px** — `.home-icon`'s inline-start margin, the same 4px every item in the
  bar carries.
- **6px** — the `.header-home-link`'s own padding, which is its hover target,
  not an inset.

The left menu reaches the same 22px its own way: 4px of row margin plus 18px of
row padding (`boardsList.css`, `settingBody.css`), and both menus indent alike.

**Nothing else may add to that sum at some widths only.** Two things did, which
is why the house sat at a different X on a phone, a tablet, a desktop and a large
display:

- `#header` had side padding of its own — 8px ≤800px, 16px at 768–1024px, none
  between, 8px at ≥1920px. It has **none** now, at any width: the inset is the
  bar's gutter, once.
- `.allBoards` is the **same element** as `.home-icon` (`span.home-icon.allBoards`),
  so its side padding lands between the icon's margin and the link — and it was
  15px on a desktop against 6px on a phone. It carries `padding-block` only now.
  Its 15px was also the gap to the logo beside it; that gap is the 4 + 4 of the
  two margins, like every other pair of neighbours in this bar.

The rules for the link itself all start it at the same 6px, phone rules included:
a bigger tap target on a small screen grows at the **end**, not at the start.

`tests/headerBars.test.cjs` pins both halves — the sum, and that no rule at any
width adds to it.

## The sidebar, and the hamburger

A page's controls used to live in its own second header bar beside its `h1`. The
title moved here and the controls moved into a **right sidebar**, so a page is its
content plus one panel rather than its content plus a strip of buttons.

`models/lib/pageSidebar.js` says which page gets what. A board has its own
sidebar and All Boards has its own; every other page with controls gets the
shared one, and a page with **no** controls gets no sidebar and no hamburger —
an empty panel is worse than none.

`NO_HAMBURGER_ROUTES` is the other half of it: a page can have a sidebar and
still not be offered a hamburger. All Boards is one — its four controls are in
this bar and Search and Multi-Selection open the sidebar straight into their own
view, so the hamburger's only destination was a menu listing what is already one
click away. A board is deliberately not in that list: what its sidebar holds —
members, labels, activities, settings — is not in the bar and has nowhere else to
be opened from.

## Related files

| File Path | File Type | Description |
| --- | --- | --- |
| `client/components/main/header.jade` | `.jade` template | The bar itself, and the starred-boards popup. |
| `client/components/main/header.js` | `.js` Blaze template logic | The title, the trail, which page gets what, and the hamburger's click. |
| `client/components/main/header.css` | `.css` | The wrap, the end group, the active mark, the divider, and the 22px the bar starts at. |
| `client/components/main/layouts.css` | `.css` | The per-width header rules — which now set no side padding of their own, so the bar starts at one X. |
| `models/lib/pageTitles.js` | `.js` module, pure | Route name → title key, and the Admin Panel's second segment. |
| `models/lib/pageSidebar.js` | `.js` module, pure | Which sidebar a page has, and whether it is offered a hamburger. |
| `models/lib/sidebarViewButton.js` | `.js` module, pure | Which way a Filter or Search click goes. |
| `client/lib/pageTitleSources.js` | `.js` client | The three pages whose title is their own, without importing those pages. |
| `client/lib/utils.js` | `.js` client | `--wekan-header-height`, measured from both bars. |
| `tests/headerBars.test.cjs` | `.cjs` Node test | The wrap, the end group, the view menus, the active mark, the divider, and both title paths. |
| `tests/pageSidebar.test.cjs` | `.cjs` Node test | Which page has which sidebar, and where the hamburger is offered. |

## Related

- [Admin Panel URLs](Admin-Panel-URLs.md) — the panel's addresses and its title path
- [All Boards URLs](All-Boards-URLs.md) — the sections, workspaces and their title path
- [All Boards](All-Boards.md) — the four controls this bar holds there
- [Linking to a swimlane, list or card](Board-Item-Links.md) — where the card's copy button went
