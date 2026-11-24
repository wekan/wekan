# Starred: boards, and bookmarks to everything else

## What it is

The star group in the first header bar is a **bookmarks menu**: it keeps the
places you come back to one click away. You can star a board, any other page
of WeKan (All Boards / Remaining, a workspace, Admin Panel / Settings /
Version ...), and, from their own menus, a swimlane, a list or a card. The
stars are yours alone. They are listed in the header's dropdown, as tiles in
All Boards / Starred, and on the full **Starred** page (`/starred-items`).

The group reads, in order:

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

## Read more

- [Bookmark (digital)](https://en.wikipedia.org/wiki/Bookmark_(digital)) on
  Wikipedia - the browser idea this follows: a saved address with a title.
- [The HTML `<title>` element](https://en.wikipedia.org/wiki/HTML_element#title)
  - what the browser tab, and so the bookmark's name, shows.
- In WeKan: [Home](../All-Boards/Home.md), [All Boards](../All-Boards/README.md),
  [All Boards URLs](../All-Boards/URLs.md), [the header](../Header-Bar/Header.md),
  and the Star entries of the [swimlane](../Swimlanes/Star.md),
  [list](../Lists/Star.md) and [card](../Cards/Watch-Star.md) menus.

## How to use it

**Star a board or a page**

1. Open the board or the page you want to keep.
2. Click the star at the end of the star group in the first header bar. It
   fills in, its title says **Click to unstar this page.**, and the count goes
   up by one.
3. Click it again to unstar.

**Open something you starred**

1. Click the caret (or the count) of the star group. The dropdown lists the
   starred boards, then **Starred Pages**, **Starred Swimlanes**, **Starred
   Lists** and **Starred Cards**.
2. Click a row to go there, or **See all starred items** for the full
   **Starred** page. The same page is **Starred** in the member menu.

**Manage the bookmark tiles**

1. Open **All Boards / Starred**. Starred pages are tiles in the same grid as
   the starred boards.
2. Click a tile's own unstar button to remove a bookmark without going there.
3. Drag a bookmark tile past another to reorder; the header dropdown follows.

### Two kinds of starred thing

A **board** is starred by id. That is the star that has always existed, it is
shared with the board's other members' stars through the board's own counter,
and on a board page it is the star the group draws.

A logged-in reader can also star a **public board they do not belong to**. That
board appears in their Starred overview and header menu after a reload. Only
the starred public board is added to their board list; other public boards stay
on the Public Boards page. If the owner makes it private, the old star does not
grant access or keep it in Starred.

A **page** is starred as a **bookmark**: a *relative URL* and a *title*. It has
no id to star, and there is nothing on the page itself to hang a count from — a
bookmark belongs to the one person who made it.

Swimlanes, lists and cards are starred by id from their own menus (**Star** /
**Unstar**), each in its own profile array.

The group is one list either way, so the **count is all of them**. A count that
left the bookmarks out would say 2 above a dropdown showing five rows.

## How the numbers are calculated

- **The count** beside the caret is `starredCount()` in
  [models/users.js](../../../models/users.js): starred boards + starred pages +
  starred swimlanes + starred lists + starred cards. Each part counts only the
  entries that still resolve (an id whose board, swimlane, list or card is
  gone, or a page entry that does not survive a round trip, is not counted).
- **50 bookmarks** at most (`MAX_STARRED_PAGES` in
  [models/lib/starredPages.js](../../../models/lib/starredPages.js)). When a
  51st page is starred, the list keeps the last 50, dropping from the front.
- **5 per kind** in the header dropdown for swimlanes, lists and cards, the
  most recently starred first (`DROPDOWN_ITEMS_PER_TYPE` in
  [client/components/main/header.js](../../../client/components/main/header.js));
  the Starred page shows all.
- **Reordering** moves one entry to the position of the target entry
  (`moveStarredPage`): the moved entry is taken out, and put back in front of
  the target; with no target it goes to the end.

## How it works in WeKan

### What a bookmark stores

**A relative URL.** What is stored has to survive the site moving to another
host, and an absolute URL pins a bookmark to the hostname it was made on. It is
also a safety rule: an absolute or protocol-relative URL is **refused**, not
cleaned up, because the stored value goes into an `href` the reader clicks.
`//host/path` is the one that matters — it leaves the site *and* starts with a
slash, so a naive `startsWith('/')` lets it through.

**The title from the browser tab.** That is what the dropdown lists, and a row
saying `/allboards/remaining` would make the reader parse a path to find out
where it goes. An empty title falls back to the URL, so a row is never blank.

The query string comes with the path. `/allboards/workspaces/engineering` and
the same page with a filter on are two different things to bookmark.

### The browser tab says where you are

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

### The tiles in All Boards / Starred

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

### Reordering

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
has no meaning to give it. As with the [Home](../All-Boards/Home.md) drag, the type is read
from `dataTransfer.types` rather than with `getData()`, because a target has to
decide whether to accept a drop in `dragover`, where the data store is still in
protected mode.

### Limits and rules

- **50 bookmarks.** This is a dropdown; a list that grows without limit quietly
  stops being useful. The cap drops from the **front**, which is the bookmark
  starred longest ago.
- **Newest last**, so the list reads in the order the reader built it.
- Starring a page that is already starred **removes** it, whatever title is
  passed — the button is one button, and matching on the URL is what makes the
  second click predictable.
- An entry keeps its place in the list; re-starring is never how an entry is
  moved, because moving it would reorder a list the reader has learned. (The
  source comment of `toggleStarredPage` speaks of re-starring with a new title
  keeping the place and taking the new title; the code itself removes an
  already starred URL, so a renamed page is starred again after that.)
- Entries that do not survive a round trip — written by an older version, or
  hand-edited into the profile — are **dropped rather than drawn**.

`toggleStarredPage` and `moveStarredPage` are Meteor methods that write only the
caller's own profile, check their arguments before anything else, and re-apply
the same pure rules the client used.

### Swimlanes, lists and cards

`toggleSwimlaneStar`, `toggleListStar` and `toggleCardStar`
([server/models/users.js](../../../server/models/users.js)) add or remove an id
in `profile.starredSwimlanes`, `profile.starredLists` or `profile.starredCards`.
One function, `starredItemsByType()` in
[client/components/main/header.js](../../../client/components/main/header.js),
resolves them for both the dropdown and the Starred page
([client/components/main/starredItems.jade](../../../client/components/main/starredItems.jade)).

### Related files

| File Path | File Type | Description |
| --- | --- | --- |
| `models/lib/starredPages.js` | `.js` module, pure | Every rule: what can be starred, the toggle, the cap, the reorder, and the tab's title. No Meteor, so it runs the same on both sides. |
| `models/users.js` | `.js` collection | `starredPages()`, `hasStarredPage()`, `starredCount()`, and the profile schema. |
| `server/models/users.js` | `.js` methods | `toggleStarredPage` and `moveStarredPage`, and the swimlane, list and card star toggles. |
| `client/components/main/header.js` | `.js` client | The group's count, whether this page is starrable, the click that stars it, publishing the path, and `starredItemsByType()`. |
| `client/components/main/header.jade` | `.jade` template | The caret / count / star group, and the dropdown's sections. |
| `client/components/main/starredItems.jade` | `.jade` template | The full Starred page, `/starred-items`. |
| `client/lib/headerPathVar.js` | `.js` client, leaf | The path the header computes, for whoever else needs it. |
| `client/lib/utils.js` | `.js` client | The browser tab's title. |
| `client/components/boards/boardsList.js` | `.js` client | The bookmark tiles, unstarring one, and the reorder drag. |
| `client/components/boards/boardsList.css` | `.css` | The tile: the border, the theme colour, the URL line. |
| `tests/starredPages.test.cjs` | `.cjs` Node test | The rules, the refusals, the tile, the reorder and what the server checks. |
| `tests/starredItems.test.cjs` | `.cjs` Node test | The swimlane, list and card stars and the Starred page. |

### Related

- [Home](../All-Boards/Home.md) — the other mark on a board, and the other drag with a type of its own
- [All Boards](../All-Boards/README.md) — the page the tiles are on
- [All Boards URLs](../All-Boards/URLs.md) — the addresses that made bookmarking possible
- [The header](../Header-Bar/Header.md) — the bar the group sits in

## Commits

 - [Show private starred boards in the header Favorites popup](https://github.com/wekan/wekan/commit/bcf2305448429fdfab5baff29ac24744b12846e7)
 - [Keep public board favorites across reloads](https://github.com/wekan/wekan/commit/a0c14a4c7f6ca19d4ed97d1f5a3bf660dbf11d3d)
 - [Star swimlanes, lists and cards, a Starred page and a header bookmarks section for them](https://github.com/wekan/wekan/commit/c5740e8046e23bf26a31c2b97c563498007dec0e)
 - [Remove the starred header group's border](https://github.com/wekan/wekan/commit/0bf5b7bdae4f90a450fa54e6256b377450b5abcd)
 - [Drag boards from Remaining to Starred](https://github.com/wekan/wekan/commit/3edc723f2d702e4832093aa249297308f1cb9e36)
 - [Starred: bookmarks to any page, not only boards](https://github.com/wekan/wekan/commit/1f2044219a0625a4d8d2de752dd4da2b4c5e5078)
 - [The starred boards popup gets a title and a close button](https://github.com/wekan/wekan/commit/1a4e87c19fe63d6444a65cbd52ddecc81b24ad0f)
 - [One star group in the header bar](https://github.com/wekan/wekan/commit/f62258b5cbcd58c1366ae8e67929e56724385ec9)
