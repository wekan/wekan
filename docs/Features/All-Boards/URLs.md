# Design: the All Boards page's URLs

## What it is

Every entry of the All Boards left menu has its own URL - the sections, the
Archive, Home and every workspace, however deep it is nested. So a section or
a workspace can be bookmarked, sent to a colleague, opened in a second tab and
reached with the Back button. A workspace is addressed by the slugs of its
names down the tree, not by a random id.

## Read more

- [Uniform Resource Locator](https://en.wikipedia.org/wiki/Uniform_Resource_Locator)
  and [Clean URL - Slug](https://en.wikipedia.org/wiki/Clean_URL#Slug) on
  Wikipedia
- [Permalink](https://en.wikipedia.org/wiki/Permalink)
- [Breadcrumb navigation](https://en.wikipedia.org/wiki/Breadcrumb_navigation) -
  the title trail in the header
- [limax](https://github.com/lovell/limax), the slug library WeKan uses
- [Admin Panel URLs](../Admin-Panel/Admin-Panel-URLs.md) and
  [Workspaces](Workspaces.md) in these docs

## How to use it

1. Open **All Boards** and click a row of the left menu, or a workspace.
2. The browser's address bar now shows that entry's URL, for example
   `/allboards/workspaces/engineering/backend`; copy or bookmark it.
3. Opening the URL later selects the same entry. **Back** returns to the entry
   you had before.

The old addresses `/templates` and `/remaining` still work and redirect.

## How the numbers are calculated

The URLs have no numbers of their own. Their rules:

- the route is `'/allboards/:section?/:path*'`, and `:path*` is zero or more
  segments, so there is no depth limit;
- an unknown section falls back to Starred (`resolveSection()`, `DEFAULT_SECTION`
  in `models/lib/allBoardsUrls.js`);
- a workspace name that slugifies to nothing uses the workspace id instead;
- of two sibling workspaces with the same slug, the first wins.

## How it works in WeKan

Every left-menu entry of All Boards has its own URL — the workspaces tree
included.

The page was three addresses: `/` (Starred), `/templates` and `/remaining`. The
workspaces tree had none at all. Which workspace you had open was a ReactiveVar,
so a workspace could not be linked to a colleague, bookmarked, opened in a second
tab or reached with the back button.

### The shape

```
/allboards/starred
/allboards/templates
/allboards/remaining
/allboards/workspaces
/allboards/archive
/allboards/home
/allboards/workspaces/engineering
/allboards/workspaces/engineering/backend
/allboards/workspaces/engineering/front-end/design-system
```

The route is `'/allboards/:section?/:path*'`. `:path*` is **zero or more
segments** — `[^/]+` would stop at the first slash, and a workspace two levels
down would not resolve — so a workspace nests as deep as its tree does.

`/` stays the app's home. It names no section, so the page picks one:
Starred when you have starred boards, Remaining when you have none (and,
once per session after login, it first opens your [Home](Home.md) board when
one is set).

### A workspace is addressed by its names

Not by its id. The id is a random string; a URL should say where you are.
`/allboards/workspaces/engineering/backend` is a path down the tree, one slug per
level.

The slugs come from **`getSlug` (limax)** — the same function that gives a board
its slug in `models/boards.js`, so a workspace and a board turn a name into a URL
the same way. It is what makes `Renkaan Vaihto` into `renkaan-vaihto` and what
handles the scripts where a naive slugifier returns an empty string.

When a name slugifies to nothing anyway — an emoji-only workspace name — the
node's **id** stands in, because a workspace with no address at all could not be
opened from a link.

Two sibling workspaces whose names slugify the same are ambiguous, and the first
wins. That is the rule a duplicate board slug already follows.

### The title bar names the same things

`All Boards / Starred`, `All Boards / Workspaces / Engineering / Backend`. The
page is several lists of boards under one name, and a workspace is a tree under one
of them, so "All Boards" alone named the page and not the list you were looking
at.

The section's words are the **left menu's own key**, so the title and the row
highlighted beside it say the same words. A workspace's words are its **name**,
not its slug — the slug is lowercase and hyphenated and is not what the
workspace is called — and the name is printed as text rather than translated: it
is what a person typed, and a workspace called "starred" is not the Starred
section.

The header walks the tree itself, from the URL and from
`user.profile.boardWorkspacesTree`, which is where the All Boards page reads it
from too. It cannot ask the page: the header is a separate Blaze instance, and
importing a page module from the header once ran it before its own template was
registered, which threw and aborted every module after it.

A trail segment that names nothing **stops the walk** and the title shows what
was still real — a stale link names the part of the path that still exists
rather than nothing at all.

This is the same title trail the Admin Panel uses
([Admin Panel URLs](../Admin-Panel/Admin-Panel-URLs.md)), one list rather than a helper per
segment: the two pages do not have the same number of segments, and a workspace
has as many as its tree is deep.

### Who resolves what

| | |
| --- | --- |
| The **route** | resolves the *section* (an unknown one falls back to Starred), splits the wildcard into slugs, and hands them over in `boardListWorkspacePath`. |
| The **page** | resolves the *workspace*, in an `autorun`, once its tree has loaded. |

The router cannot resolve the workspace: the tree lives on the user document,
which the router has no way to read before the page has it. And it has to be an
autorun rather than a one-shot read — a single read always runs before the tree
arrives and would never select anything.

A slug path that names nothing leaves the Workspaces section selected, rather
than an empty board list.

Clicking a menu row or a workspace does the same thing in reverse: it selects the
entry and then `FlowRouter.go`s to its URL. `go`, not `replace`, so Back returns
to the previous entry — and only when the path would actually change, or every
click becomes a navigation to where you already are.

### `allboards` is an All Boards route

`boardsList.js` filters boards by membership only on the All Boards routes. A
route missing from that list falls through to the **public-boards** branch, so
the page would show public boards instead of the user's own. The list is `home`,
`allboards`, `allboards-templates`, `allboards-remaining`.

### Old URLs

| Old | Now |
| --- | --- |
| `/templates` | `/allboards/templates` |
| `/remaining` | `/allboards/remaining` |

They redirect with the `redirect` their trigger is handed, never with
`FlowRouter.go()` — a `go()` from inside `triggersEnter` runs while that route is
still entering and is swallowed, so nothing renders and the browser keeps showing
whatever page it was on.

`{{pathFor 'allboards-templates'}}` in `userHeader.jade` still resolves, through
that redirect.

### Related files

| File Path | File Type | Description |
| --- | --- | --- |
| `models/lib/allBoardsUrls.js` | `.js` module, pure | The sections, the workspace slug path both ways, and the path builder. `slugify` is passed IN, so the module has no dependencies and can be tested with a stub. |
| `config/router.js` | `.js` routes | The `/allboards/:section?/:path*` route and the old-URL redirects. |
| `client/components/boards/boardsList.js` | `.js` Blaze template logic | Resolves the workspace once the tree loads, and puts a clicked entry in the URL. |
| `tests/allBoardsUrls.test.cjs` | `.cjs` Node test | Both directions of the slug path, the fallbacks, the wildcard splitting, and the wiring — including that `getSlug` is the one board URLs use. |

### Related

- [All Boards](All-Boards.md) — the page these URLs open
- [The Admin Panel's URLs](../Admin-Panel/Admin-Panel-URLs.md) — the same idea, for the Admin Panel

## Commits

 - [All Boards: Home is a section with its own URL](https://github.com/wekan/wekan/commit/eea1f2ffed4af635c67659f176353de57b0d4040)
 - [Open Starred, or Remaining when nothing is starred](https://github.com/wekan/wekan/commit/50a1d4263e253b0771342e7469243b13eaf106d3)
 - [The Archive is a section of All Boards, at /allboards/archive](https://github.com/wekan/wekan/commit/a05c1ac08a53bc83ea75ee5f836deb5227506085)
 - [Pin that a workspace nests as deep as its tree does](https://github.com/wekan/wekan/commit/1b5375414bca6032bae0552daca6d75f27d7fda9)
 - [The header bar names the list, and the workspace inside it](https://github.com/wekan/wekan/commit/1164785d1d72903b656683c76ddbbb201c33c414)
 - [A URL for every left-menu entry, workspaces included](https://github.com/wekan/wekan/commit/5cc399b473c210c61b28fc302039c53ff2e7f16f)
