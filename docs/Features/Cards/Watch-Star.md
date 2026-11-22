# Card menu / Watch, Star

## What it is

Card menu (☰ in the opened card's header, **Card Actions**) has two
per-user toggles under the **Watch** heading: **Watch** / **Unwatch** and
**Star** / **Unstar**. Watching a card means you get notified of what happens
on it; starring it bookmarks it for you, so you find it again from the header
and the Starred page. Every signed-in user who can open the menu sees both,
and neither changes the card for anybody else.

## Read more

- Wikipedia: [Watchlist](https://en.wikipedia.org/wiki/Watchlist),
  [Notification system](https://en.wikipedia.org/wiki/Notification_system)
  and [Bookmark (digital)](https://en.wikipedia.org/wiki/Bookmark_(digital)).
- In WeKan: [Starred](../Pages/Starred.md), the list menu's
  [Star](../Lists/Star.md), the swimlane menu's [Star](../Swimlanes/Star.md)
  and [Admin Panel / Settings / Activities and notifications](../Admin-Panel/Settings/Activities-and-Notifications.md).

## How to use it

**Watch a card:**

1. Open the card and click ☰ in its header (**Card Actions**).
2. Under **Watch**, click **Watch**. The menu closes; the entry now reads
   **Unwatch**.
3. Click **Unwatch** the same way to stop.

**Star a card:**

1. Open the card and click ☰ in its header.
2. Click **Star**; it now reads **Unstar**.
3. Find the card again in the header's bookmarks dropdown or on the
   **Starred** page (`/starred-items`), where a starred card opens in place.

### Watch

- **Watch** sets your watch level on the card to *watching*, **Unwatch**
  removes it (the `watch` server method, `server/notifications/watch.js`).
  On a linked card it is the original card that is watched.
- Watchers of a card receive notifications of its activities.
- When **Disable watch** is on in
  [Admin Panel / Settings / Activities and notifications](../Admin-Panel/Settings/Activities-and-Notifications.md),
  the server refuses every change of a watch level.

### Star

- **Star** bookmarks the card for you
  ([#1172](https://github.com/wekan/wekan/issues/1172)): its id is added to
  or removed from your `profile.starredCards` by the `toggleCardStar` server
  method (`server/models/users.js`). Nobody else sees it, and the card is not
  changed.
- Starred cards appear in the header's bookmarks dropdown (the five most
  recently starred) and on the **Starred** page (`/starred-items`), where a
  starred card opens in place. See [Starred](../Pages/Starred.md).

The same Star entry exists in the [list menu](../Lists/Star.md) and the
[swimlane menu](../Swimlanes/Star.md).

## How the numbers are calculated

- **Watch** is on or off: a card has the simple watch interface, so the only
  level is *watching* (boards have three, watching / tracking / muted).
- **Bookmarks dropdown:** at most 5 starred cards (`DROPDOWN_ITEMS_PER_TYPE`
  in [client/components/main/header.js](../../../client/components/main/header.js)),
  the most recently starred first - `$addToSet` appends, so the id list is
  read in reverse. The **Starred** page lists all of them in the same order.

## How it works in WeKan

- **Watch:** cards are `simpleWatchable` in
  [models/watchable.js](../../../models/watchable.js): a `watchers` array of
  user ids, `findWatcher` and `setWatcher` (`$addToSet` / `$pull`). The menu
  entry's handler in
  [client/components/cards/cardDetails.js](../../../client/components/cards/cardDetails.js)
  calls `watch('card', realCardId, 'watching' | null)`.
  [server/notifications/watch.js](../../../server/notifications/watch.js)
  refuses it when Disable watch is on, checks that the user may see the board
  (membership, organisation, team, email domain or a public / semi-open
  board) and that an assigned-only member watches only a card assigned to
  them; such an attempt is recorded in Admin Panel / Problems
  (`authz.assigned`).
- **Star:** `toggleCardStar` in
  [server/models/users.js](../../../server/models/users.js) `$addToSet`s or
  `$pull`s the card id in the caller's `profile.starredCards`. The dropdown and
  the Starred page read it through `starredItemsByType` in
  [client/components/main/header.js](../../../client/components/main/header.js)
  and [client/components/main/starredItems.js](../../../client/components/main/starredItems.js).
- Both entries are in `cardDetailsActionsPopup` in
  [client/components/cards/cardDetails.jade](../../../client/components/cards/cardDetails.jade).
- Tests: [tests/starredItems.test.cjs](../../../tests/starredItems.test.cjs)
  and [tests/boardWatchSilent.test.cjs](../../../tests/boardWatchSilent.test.cjs).

## Commits

 - [The card menu's entries are grouped under headings, Watch among them](https://github.com/wekan/wekan/commit/0d8f8b8d96b868a6d75b803ef105e50aad450977)
 - [An assigned-only member watches only the cards assigned to them](https://github.com/wekan/wekan/commit/5b2ed17e6b31ff8416dbf26d8c178f0b979013f0)
 - [Watching works on semi-open boards every signed-in user can see](https://github.com/wekan/wekan/commit/f122a8287c3212388ee157315369157b3f64c94a)
 - [Star / Unstar in the card menu, and the Starred page](https://github.com/wekan/wekan/commit/c5740e8046e23bf26a31c2b97c563498007dec0e)
 - [Watching asks whether the user may see the board, not only whether they are a member](https://github.com/wekan/wekan/commit/8ec78bb14ce07cf880e872bf989dbd951f57842e)
 - [Disable watch: the server refuses every change of a watch level](https://github.com/wekan/wekan/commit/f1cc8daebf1d2c926f81f3a7e22beb7ffbbbe8ca)
 - [Watch boards, lists and cards, with notifications](https://github.com/wekan/wekan/commit/9bbdacc79a89667e0d6f1ed30c415e5350ad468b)
