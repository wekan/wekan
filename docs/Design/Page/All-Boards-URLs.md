# Design: the All Boards page's URLs

Every left-menu entry of All Boards has its own URL — the workspaces tree
included.

The page was three addresses: `/` (Starred), `/templates` and `/remaining`. The
workspaces tree had none at all. Which workspace you had open was a ReactiveVar,
so a workspace could not be linked to a colleague, bookmarked, opened in a second
tab or reached with the back button.

## The shape

```
/allboards/starred
/allboards/templates
/allboards/remaining
/allboards/workspaces
/allboards/workspaces/engineering
/allboards/workspaces/engineering/backend
/allboards/workspaces/engineering/front-end/design-system
```

The route is `'/allboards/:section?/:path*'`. `:path*` is **zero or more
segments** — `[^/]+` would stop at the first slash, and a workspace two levels
down would not resolve — so a workspace nests as deep as its tree does.

`/` stays the app's home and still shows Starred.

## A workspace is addressed by its names

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

## Who resolves what

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

## `allboards` is an All Boards route

`boardsList.js` filters boards by membership only on the All Boards routes. A
route missing from that list falls through to the **public-boards** branch, so
the page would show public boards instead of the user's own. The list is `home`,
`allboards`, `allboards-templates`, `allboards-remaining`.

## Old URLs

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

## Related files

| File Path | File Type | Description |
| --- | --- | --- |
| `models/lib/allBoardsUrls.js` | `.js` module, pure | The sections, the workspace slug path both ways, and the path builder. `slugify` is passed IN, so the module has no dependencies and can be tested with a stub. |
| `config/router.js` | `.js` routes | The `/allboards/:section?/:path*` route and the old-URL redirects. |
| `client/components/boards/boardsList.js` | `.js` Blaze template logic | Resolves the workspace once the tree loads, and puts a clicked entry in the URL. |
| `tests/allBoardsUrls.test.cjs` | `.cjs` Node test | Both directions of the slug path, the fallbacks, the wildcard splitting, and the wiring — including that `getSlug` is the one board URLs use. |

## Related

- [All Boards](All-Boards.md) — the page these URLs open
- [The Admin Panel's URLs](Admin-Panel-URLs.md) — the same idea, for the Admin Panel
