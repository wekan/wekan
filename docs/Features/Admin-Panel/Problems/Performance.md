# Admin Panel / Problems / Performance

How WeKan loads a board's cards. Address: `/admin/problems/performance`. Site
administrators only. The pane is a description, with nothing to click or
save: it sits beside Speed, Tests and CPU usage because it is what decides how
much a big board costs to open.

## What it says

**Card loading** is automatic, per board, by size (`models/lib/cardsLoading.js`):

- a board with more than the threshold of cards (default **500**) loads lazily:
  each list loads only the cards that are visible (infinite scroll) and the
  counts come from the server;
- a smaller board loads every card, for the simplest and fully featured
  behaviour.

## Environment variables

There is no setting in the Admin Panel. Operators can force a mode:

| Variable | Values | Default |
| --- | --- | --- |
| `CARDS_LOADING` | `auto`, `all` or `lazy`; anything else is `auto` | `auto` |
| `CARDS_LOADING_LAZY_THRESHOLD` | a card count; `0` makes every `auto` board lazy; an invalid or negative value is the default | `500` |

`all` sends every non-archived card of a board to each viewer; filtering,
search, counts, sorting and drag and drop then run in the browser. `lazy`
sends only the visible window of each list, through a windowed publication per
list.

## Related

- [Large-Boards.md](Large-Boards.md) - what a large board loads, and the
  measurements behind the threshold.
- [Speed](Speed.md) and [CPU usage](CPU-usage.md).
