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

### …and the path below it

Two pages are several places under one name, and for those the title continues
after a slash:

```
Admin Panel / Settings / Version
All Boards / Workspaces / Engineering / Backend
```

`headerTitleTrail()` in `client/components/main/header.js` returns **one list** of
segments rather than a helper per segment, because the two pages do not have the
same number of them — the Admin Panel always has two, and a workspace has as many
as its tree is deep. Each entry is one of the two forms a left-menu entry already
has: `key` for something translated, `title` for text that must not be.

The words are the ones the navigation beside it already uses — the Admin Panel's
tab key and its menu row's label ([Admin Panel URLs](Admin-Panel-URLs.md)), the
All Boards left-menu key and the workspace's own name
([All Boards URLs](All-Boards-URLs.md)) — so the title and the thing highlighted
next to it cannot say different things about one place.

It is read from the **URL** and from the user document, never from the pages
themselves. The header is a separate Blaze instance, and importing a page module
from it once ran that module before its own template was registered; the throw
aborted every module after it, which is why `client/lib/pageTitleSources.js`
exists — it registers no template and touches no DOM, so it is safe to load
early.

## What the bar holds

In source order: the house and the page title (plus the pencil that renames a
board), the logo, the phone/desktop toggle, the drag-handles toggle — and then
`.header-quick-access-end`, which holds everything else and is pushed to the end
of the bar by a single `margin-inline-start: auto`. That is a **logical**
property, so a right-to-left language mirrors it by itself rather than needing a
second rule kept in step with the first.

Inside that group: the starred-boards dropdown, the page's own controls, the
page's view menu, the Admin Panel's tabs, the notification bell, **a divider**,
help, your account, and the sidebar hamburger where the page has one.

The divider is the seam: everything before it belongs to the **page**, everything
after belongs to **you**. Without it the run of icons reads as one list of
unrelated things.

**Every button is an icon named by a tooltip.** The view menus lost their visible
labels — the board's said "Swimlanes", All Boards' said "Lists" — because the
label is the widest part of a button and the name is in the tooltip where the
other buttons of this bar already keep theirs. A tooltip is a poor place for a
name in general; it is the right one here only because the whole bar is icons and
consistent.

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
| `client/components/main/header.css` | `.css` | The wrap, the end group, the active mark, the divider. |
| `models/lib/pageTitles.js` | `.js` module, pure | Route name → title key, and the Admin Panel's second segment. |
| `models/lib/pageSidebar.js` | `.js` module, pure | Which sidebar a page has, and whether it is offered a hamburger. |
| `client/lib/pageTitleSources.js` | `.js` client | The three pages whose title is their own, without importing those pages. |
| `client/lib/utils.js` | `.js` client | `--wekan-header-height`, measured from both bars. |
| `tests/headerBars.test.cjs` | `.cjs` Node test | The wrap, the end group, the view menus, the active mark, the divider, and both title paths. |
| `tests/pageSidebar.test.cjs` | `.cjs` Node test | Which page has which sidebar, and where the hamburger is offered. |

## Related

- [Admin Panel URLs](Admin-Panel-URLs.md) — the panel's addresses and its title path
- [All Boards URLs](All-Boards-URLs.md) — the sections, workspaces and their title path
- [All Boards](All-Boards.md) — the four controls this bar holds there
- [Linking to a swimlane, list or card](Board-Item-Links.md) — where the card's copy button went
