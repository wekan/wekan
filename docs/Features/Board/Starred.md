# Starred: boards, and bookmarks to everything else

The star group in the first header bar is a **bookmarks menu**. It reads, in
order:

```
▾  7  ☆
```

the **caret** that opens the list, the **count** of what is in it, and the
**star** that says whether the thing you are looking at is among them — inside
one rounded outline, because the three are one control.

It used to hold boards only. A board could be starred and reached from the
dropdown; every other page — All Boards / Remaining, a workspace, Admin Panel /
Settings / Version — could not, so the one control for *keep this where I can
get at it* worked on one kind of destination and was simply absent on the rest.
Those pages have had their own addresses since the All Boards and Admin Panel
URLs landed, which is what made bookmarking them possible at all.

## Two kinds of starred thing

A **board** is starred by id. That is the star that has always existed, it is
shared with the board's other members' stars through the board's own counter,
and on a board page it is the star the group draws.

A **page** is starred as a **bookmark**: a *relative URL* and a *title*. It has
no id to star, and there is nothing on the page itself to hang a count from — a
bookmark belongs to the one person who made it.

The group is one list either way, so the **count is both**. A count that left
the bookmarks out would say 2 above a dropdown showing five rows.

## What a bookmark stores

**A relative URL.** What is stored has to survive the site moving to another
host, and an absolute URL pins a bookmark to the hostname it was made on. It is
also a safety rule: an absolute or protocol-relative URL is **refused**, not
cleaned up, because the stored value goes into an `href` the reader clicks.
`//host/path` is the one that matters — it leaves the site *and* starts with a
slash, so a naive `startsWith('/')` lets it through.

**The title from the browser tab.** That is what the dropdown lists, and a row
saying `/allboards/remaining` would make the reader parse a path to find out
where it goes.

The query string comes with the path. `/allboards/workspaces/engineering` and
the same page with a filter on are two different things to bookmark.

## The browser tab says where you are

```html
<title>Product name - All Boards / Remaining</title>
```

The tab used to say only the product name on every page that was not a board, so
ten open tabs of one WeKan were ten identical tabs, and a bookmark of any of them
— in WeKan or in the browser — was named after the whole app rather than after
the page.

The product name comes **first** because it is the constant: a row of tabs from
one WeKan lines up under one word, and the part that differs is where the eye is
already travelling. A page with nothing to say beyond its own name keeps just
the product name, which is what it had.

The path is the one the header bar already computes for the page title's
tooltip. Rather than work it out twice, the header **publishes** it into
`client/lib/headerPathVar.js` — a leaf module that imports nothing but
`ReactiveVar`, so it cannot be half of an import cycle — and `Utils.setCustomUI`
reads it. Having `Utils` import the header component instead once ran a module
before its own template was registered and threw.

A board page is unchanged: `Board title - Product name`.

## The tiles in All Boards / Starred

Starred is *the list of places you keep*, so the bookmarks are drawn there too,
as **tiles in the same grid** as the starred boards rather than as a list
somewhere else on the page.

A bookmark tile carries the **white border the template-container tile has**
(`border: 4px solid #fff`) — one signal for "this is not an ordinary board",
rather than a second border that means the same thing in a different way — and
the **theme's own colour** behind it, `var(--theme-accent)`, so it belongs to
this WeKan instead of being a grey box in a coloured page. There is a fallback
colour for the themes that predate the variable.

It shows the **title and the URL**, the way a bookmark bar does: the title says
where it goes, the address says what it is, and two pages of one section can have
titles that differ by a word.

Each tile has its own **unstar** button. The star in the header bar stars the
page you are *on*, so a bookmark for somewhere else would otherwise have no way
off the list except going there to un-star it — a trip for nothing.

## Reordering

Drag a bookmark tile past another and they swap. **The order is the reader's,
and it is one order**: the tiles and the rows of the header dropdown are two
views of the same array, so rearranging the tiles rearranges the menu. Anything
else would be two lists that disagree about the same bookmarks.

`moveStarredPage()` matches both ends **by URL rather than by index**, because
the two views are rendered separately and an index from one of them is a guess
about the other. An unknown URL, or a tile dropped on itself, changes nothing.
Dropping past the last tile sends a bookmark to the end.

The drag carries its own type, `application/x-wekan-bookmark`, so a bookmark and
a board cannot be dropped on each other — a board dropped between two bookmarks
has no meaning to give it. As with the [Home](Home.md) drag, the type is read
from `dataTransfer.types` rather than with `getData()`, because a target has to
decide whether to accept a drop in `dragover`, where the data store is still in
protected mode.

## Limits and rules

- **50 bookmarks.** This is a dropdown; a list that grows without limit quietly
  stops being useful. The cap drops from the **front**, which is the bookmark
  starred longest ago.
- **Newest last**, so the list reads in the order the reader built it.
- Starring a page that is already starred **removes** it, whatever title is
  passed — the button is one button, and matching on the URL is what makes the
  second click predictable.
- Re-starring is never how a title is refreshed into a different position: an
  entry keeps its place, because moving it would reorder a list the reader has
  learned.
- Entries that do not survive a round trip — written by an older version, or
  hand-edited into the profile — are **dropped rather than drawn**.

`toggleStarredPage` and `moveStarredPage` are Meteor methods that write only the
caller's own profile, check their arguments before anything else, and re-apply
the same pure rules the client used.

## Related files

| File Path | File Type | Description |
| --- | --- | --- |
| `models/lib/starredPages.js` | `.js` module, pure | Every rule: what can be starred, the toggle, the cap, the reorder, and the tab's title. No Meteor, so it runs the same on both sides. |
| `models/users.js` | `.js` collection | `starredPages()`, `hasStarredPage()`, `starredCount()`, and the profile schema. |
| `server/models/users.js` | `.js` methods | `toggleStarredPage` and `moveStarredPage`. |
| `client/components/main/header.js` | `.js` client | The group's count, whether this page is starrable, the click that stars it, and publishing the path. |
| `client/components/main/header.jade` | `.jade` template | The caret / count / star group, and the dropdown's two sections. |
| `client/lib/headerPathVar.js` | `.js` client, leaf | The path the header computes, for whoever else needs it. |
| `client/lib/utils.js` | `.js` client | The browser tab's title. |
| `client/components/boards/boardsList.js` | `.js` client | The bookmark tiles, unstarring one, and the reorder drag. |
| `client/components/boards/boardsList.css` | `.css` | The tile: the border, the theme colour, the URL line. |
| `tests/starredPages.test.cjs` | `.cjs` Node test | The rules, the refusals, the tile, the reorder and what the server checks. |

## Related

- [Home](Home.md) — the other mark on a board, and the other drag with a type of its own
- [All Boards](../../Features/Page/All-Boards.md) — the page the tiles are on
- [All Boards URLs](../../Features/Page/All-Boards-URLs.md) — the addresses that made bookmarking possible
- [The header](../../Features/Page/Header.md) — the bar the group sits in
