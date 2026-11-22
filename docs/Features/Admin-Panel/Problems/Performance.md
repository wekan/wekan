# Admin Panel / Problems / Performance

## What it is

How WeKan loads a board's cards. Address: `/admin/problems/performance`. Site
administrators only. The pane is a description, with nothing to click or
save: it sits beside Speed, Tests and CPU usage because it is what decides how
much a big board costs to open.

## Read more

- [Lazy loading](https://en.wikipedia.org/wiki/Lazy_loading) and
  [Infinite scrolling](https://en.wikipedia.org/wiki/Infinite_scrolling) - what
  a lazily loaded list does.
- WeKan: [Large-Boards.md](Large-Boards.md) - what a large board loads, and the
  measurements behind the threshold; [Speed](Speed.md) and
  [CPU usage](CPU-usage.md).

## How to use it

**Read how cards load**

1. Sign in as a site administrator and open **Admin Panel → Problems →
   Performance**.
2. Read **Card loading**. There is no setting in the Admin Panel: card loading
   is automatic, per board, by size.

**Force a mode (operators)**

1. Set `CARDS_LOADING` and, optionally, `CARDS_LOADING_LAZY_THRESHOLD` in the
   server environment (Snap: `sudo snap set wekan cards-loading=...`).
2. Restart WeKan and reload open boards.

| Variable | Values | Default |
| --- | --- | --- |
| `CARDS_LOADING` | `auto`, `all` or `lazy`; anything else is `auto` | `auto` |
| `CARDS_LOADING_LAZY_THRESHOLD` | a card count; `0` makes every `auto` board lazy; an invalid or negative value is the default | `500` |

**See which mode a board uses**

- The board's **Statistics** view shows the card loading mode in effect, with
  "(Automatic (lazy only for big boards))" when it was chosen by `auto`.

## How the numbers are calculated

From [models/lib/cardsLoading.js](../../../../models/lib/cardsLoading.js):

- A board with **more than** the threshold of cards (default **500**) loads
  lazily; a board with 500 cards or fewer loads every card
  (`effectiveBoardCardsMode`).
- The threshold is `CARDS_LOADING_LAZY_THRESHOLD` parsed as a whole number;
  unset, invalid or negative gives 500 (`cardsLoadingLazyThreshold`).
- A lazy list shows 10 cards at first and 10 more each time it is scrolled to
  the end ([client/components/lists/listBody.js](../../../../client/components/lists/listBody.js)).

## How it works in WeKan

**Card loading** is automatic, per board, by size
(`models/lib/cardsLoading.js`):

- a board with more than the threshold of cards (default **500**) loads lazily:
  each list loads only the cards that are visible (infinite scroll) and the
  counts come from the server;
- a smaller board loads every card, for the simplest and fully featured
  behaviour.

`all` sends every non-archived card of a board to each viewer; filtering,
search, counts, sorting and drag and drop then run in the browser. `lazy`
sends only the visible window of each list, through a windowed publication per
list ([server/publications/cardsWindow.js](../../../../server/publications/cardsWindow.js)).

- [server/cards-loading.js](../../../../server/cards-loading.js) reads the
  environment variables and passes them to the browser as
  `Meteor.settings.public.cardsLoading` and `cardsLoadingLazyThreshold`.
- [client/lib/lazyCards.js](../../../../client/lib/lazyCards.js) decides per
  board in the browser, from the `boardCardLoadingModes` the server publishes,
  and reads the server-side counts.
- The pane is the `featuresPerformance` template in
  [client/components/settings/adminProblems.jade](../../../../client/components/settings/adminProblems.jade);
  its text is the `cards-loading-description` translation.
- Tests: [tests/cardsLoading.test.cjs](../../../../tests/cardsLoading.test.cjs)
  and [tests/playwright/specs/large-board-lazy-loading.e2e.js](../../../../tests/playwright/specs/large-board-lazy-loading.e2e.js).

## Commits

- [Snap defaults cards-loading to auto, like every other platform](https://github.com/wekan/wekan/commit/2122214fb61bb557d1339411a6daa25ddff955cb)
 - [The Problems route and template are named as the menu names them](https://github.com/wekan/wekan/commit/fa289e4a4de8d4411cfbbd984bae4b184d1eb3c7)
 - [Adaptive card loading: lazy only for big boards, no admin toggle](https://github.com/wekan/wekan/commit/96c7faa87254529cf2531ff2c6027efd136ee753)
 - [Unit and negative tests for lazy loading](https://github.com/wekan/wekan/commit/d2ec3ee400192b65f87edc29dbe6c12eb0cd0401)
 - [Accurate card counters and WIP limits with lazy loading](https://github.com/wekan/wekan/commit/7d5f29e11479be6a3b8393c8817b30620e99a068)
 - [Lazy card loading in the browser, and its Admin Panel section](https://github.com/wekan/wekan/commit/09805a8a9185c41c84b2596e2854f209aecf2ac0)
 - [Lazy card loading on the server: CARDS_LOADING and windowed publications](https://github.com/wekan/wekan/commit/6f7ad270d124bf961b811743d1b78abf24f8f7e5)
