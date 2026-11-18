# Card menu / Watch, Star

Card menu (☰ in the opened card's header, **Card Actions**) has two
per-user toggles: **Watch** / **Unwatch** and **Star** / **Unstar**. Every
signed-in user who can open the menu sees both.

## Watch

- **Watch** sets your watch level on the card to *watching*, **Unwatch**
  removes it (the `watch` server method, `server/notifications/watch.js`).
  On a linked card it is the original card that is watched.
- Watchers of a card receive notifications of its activities.
- When **Disable watch** is on in
  [Admin Panel / Settings / Activities and notifications](../Admin-Panel/Settings/Activities-and-Notifications.md),
  the server refuses every change of a watch level.

## Star

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
