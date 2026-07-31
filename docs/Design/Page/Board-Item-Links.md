# Design: linking to a swimlane, a list, or a card

Every one of the three has an address, and following it lands on the thing the
address names.

A card has had one since there has been a card route. A swimlane and a list had
none: "the Backlog list of this board" could only be sent as *open this board and
scroll down*. Worse, `List.absoluteUrl()` answered with the URL of whichever
**card** the cache returned first for that list — so the one place that did offer
a list link (`listMorePopup`) showed a card's address, and an empty box for an
empty list.

## The shape

```
/b/<boardId>/<slug>/<cardId>              a card      (unchanged)
/b/<boardId>/<slug>/swimlane/<swimlaneId> a swimlane
/b/<boardId>/<slug>/list/<listId>         a list
```

**Five segments against the card route's four**, which is what keeps the three
apart: the card route cannot match a swimlane or list URL, and neither of those
can match a card. A guard checks all nine combinations, because losing a segment
would silently turn a link to a list into a link to a card called `list`.

The kind is a **word in the path** rather than a query parameter: it is part of
what the address names, and a reader can see which is which.

`models/lib/boardItemUrl.js` builds them and exports the route patterns, so
`config/router.js` registers the routes from the same constants the links are
built from — the two cannot disagree about the path when there is only one copy
of it.

It is pure and isomorphic, next to `models/lib/cardUrl.js` and for the same
reason: on the server `board()` is async and returns a Promise, so a caller there
passes the already-awaited board. A thenable is never read from — doing that is
what emitted `/b/undefined/board/...` in [#6427](https://github.com/wekan/wekan/issues/6427).

## Following the link reveals the thing

For a card that already worked: the route opens it. For a swimlane or a list
there is nothing to open, so the link has to **bring it into view**, or the
address named a place and took you to the top of the board instead.

**The route cannot do the scrolling.** It runs before the board has rendered, and
on a board that is already open it runs without re-creating anything — so at the
moment the address changes there is nothing on screen to scroll. The route
therefore *names* what to reveal in a Session value (`revealSwimlaneId`,
`revealListId`) and `client/lib/revealBoardItem.js`, started by the board body
once it has rendered, does the rest.

It **waits for the element** rather than assuming it. Swimlanes and lists arrive
as their subscriptions do and a large board renders in more than one pass, so a
single look on the next tick finds nothing on a cold load. It retries on a short
interval and **gives up after a few seconds**: a link to a list that was archived
or deleted names an element that is never going to exist, and the board is still
the right place to have landed.

The Session value is cleared as soon as it is acted on **or** given up on, so it
is a one-shot instruction about the address you followed rather than a standing
order that re-scrolls the board on every later render. It is cleared *before* the
scroll, because `scrollIntoView` can re-enter the autorun through the reactive
read and clearing first makes that second pass a no-op.

Every **other** board route clears it too. Without that, opening a card after a
list link would scroll the board away from the card it had just opened.

The element ids are the ones the templates already carry — `swimlane-<id>` and
`js-list-<id>` — held in `models/lib/revealBoardItem.js` as a **map**, not
derived by a rule. Deriving one name from another is how
`allBoardsMultiselectionSidebar` happened, and this failure is silent: nothing is
found and nothing is reported. A guard checks each id against the markup that
draws it.

The revealed element gets a brief outline. A scroll that lands mid-board gives no
sign of *which* of the things now on screen the link was about. It is an
`outline` rather than a border or shadow so it is drawn outside the box and moves
nothing by a pixel, and `prefers-reduced-motion` gets the outline without the
fade — the point is to say which one, and that does not need movement.

## Copying a link

All three are copied the same way, from the same kind of menu: the **first row**
of the hamburger popup — swimlane, list, and the card details menu — with the
link icon and the name `copy-link-to-clipboard` ("Copy link to clipboard")
beside it.

The card used to carry this as an **icon in its title header**, named only by a
tooltip, which is the one place a name cannot be read without hovering. That
button is gone, and so is its handler and the "Copied" tooltip only it used: a
handler for markup that no longer exists is dead code that reads as a working
feature.

**The copy row sits above every permission check.** Copying an address is
reading, not editing — somebody who may only read the board can still tell a
colleague which list they mean — while everything else in those menus changes the
board and stays guarded.

`absoluteUrl()`, not the relative path: what lands in the clipboard is pasted
into a chat or an email, and a relative path is only a link inside this page.

## Related files

| File Path | File Type | Description |
| --- | --- | --- |
| `models/lib/boardItemUrl.js` | `.js` module, pure | The URLs and the route patterns. No Meteor, so it is unit-testable and works on the server. |
| `models/lib/revealBoardItem.js` | `.js` module, pure | Which Session key each kind uses, and which element id to look for. |
| `client/lib/revealBoardItem.js` | `.js` client | Waits for the element, scrolls it into view, gives up rather than spinning. |
| `config/router.js` | `.js` routes | The two routes, and the clearing of a stale reveal on every other board route. |
| `models/lists.js`, `models/swimlanes.js` | `.js` collections | `originRelativeUrl` / `absoluteUrl` for each. |
| `client/components/swimlanes/swimlaneHeader.jade` | `.jade` template | The swimlane popup's copy row. |
| `client/components/lists/listHeader.jade` | `.jade` template | The list popup's copy row, and `listMorePopup`, whose link box now shows the list. |
| `client/components/cards/cardDetails.jade` | `.jade` template | The card menu's copy row — and the header button that is gone. |
| `client/components/swimlanes/swimlanes.css` | `.css` | The reveal outline. |
| `tests/boardItemLinks.test.cjs` | `.cjs` Node test | The URLs, that no address matches the wrong route, the reveal, the three copy rows, and the translations. |

## Related

- [The header](Header.md) — where the card's copy button used to be
- [Archive](Archive.md) — the other page a board menu row navigates to
