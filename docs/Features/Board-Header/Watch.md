# Board header / Watch

## What it is

Watch sets how much you hear about a board: **Watching** notifies you of every
change on it, **Tracking** only of changes to the cards you created or are a
member of, and **Muted** of nothing. The setting is your own; other members
choose theirs. The control is after [Visibility](Visibility.md) in a board's
header controls and shows your current level.

## Read more

- [Notification system](https://en.wikipedia.org/wiki/Notification_system) and
  [publish–subscribe pattern](https://en.wikipedia.org/wiki/Publish%E2%80%93subscribe_pattern)
  on Wikipedia - telling subscribers about events they asked to hear about.
- [Member Settings / Notifications](../Member-Settings/Notifications.md) and
  [Board Settings / Notifications](../Board-Sidebar/Board-Settings/Notifications.md) -
  how a notification is delivered.
- [Notification delivery](../Notifications/Notification-Delivery.md) and
  [watching a card](../Cards/Watch-Star.md).

## How to use it

The button shows your own watch level for this board — **Watching**
(`fa-eye`), **Tracking** (`fa-bell`) or **Muted** (`fa-bell-slash`) — as its
icon, label and tooltip. See [the header](../Header-Bar/Header.md) for its place
in the bar.

1. Open a board.
2. Click the watch button (the eye or bell) in the header bar. The popup opens;
   your current level has a check mark.
3. Click **Watching**, **Tracking** or **Muted**.
4. The popup closes and the button shows the new level. If the server refuses,
   an alert says why (see below) and nothing changes.

**Who can use it.** Every signed-in user who can see the board. The button is
not drawn when an administrator has turned on **Disable watch** in
[Admin Panel / Settings / Activities and notifications](../Admin-Panel/Settings/Activities-and-Notifications.md)
(`watchDisabled` helper, `Settings.disableWatch`).

### The popup

`boardChangeWatchPopup` in `client/components/boards/boardHeader.jade`. The
current level has a check mark.

| Level | Description shown |
| --- | --- |
| Watching | You will be notified of any change in this board. |
| Tracking | You will be notified of changes to the cards you are involved in as creator or member. |
| Muted | You will never be notified of any changes in this board. |

Choosing a row calls the `watch` method (`server/notifications/watch.js`) with
`'board'`, the board id and the level, and closes the popup when it succeeds.
The server refuses, and the popup says why in an alert, when:

- watching is disabled by the administrator (`error-watch-disabled`: *Watching
  boards and cards is turned off by the administrator*), or
- the user may not see the board (`error-board-notAMember`). Seeing it through
  membership, an organization, a team, an email domain, or because it is
  public or signed-in-users all count.

## How the numbers are calculated

Watch has no numbers of its own. It has three levels and a default: a user
with no entry in the board's `watchers` is **Muted**
(`complexWatchDefault` in [models/watchable.js](../../../models/watchable.js)).
Who is notified of one activity is a set, worked out in two steps:

1. In [server/models/activities.js](../../../server/models/activities.js) the
   candidates are every user at **Watching**, plus the users at **Tracking**
   who are a participant in that activity.
2. `boardNotificationRecipients()` in
   [models/lib/boardNotificationRecipients.js](../../../models/lib/boardNotificationRecipients.js)
   then keeps only candidates who are **active** board members and whose board
   level is Watching or Tracking, or who explicitly watch the list or card
   concerned. Being assigned or mentioned does not reach a member who has muted
   the board.

## How it works in WeKan

- **Data**: the level is per user, stored in the board's `watchers` array as
  `{ userId, level }` (`models/watchable.js`, `getWatchLevel`, `setWatcher`).
  A user with no entry is **Muted**, which is the default; choosing Muted
  removes the entry.
- **Client**: the button and popup in
  [client/components/boards/boardHeader.jade](../../../client/components/boards/boardHeader.jade),
  the `watchLevel` helper and the `click .js-select-watch` handler in
  [client/components/boards/boardHeader.js](../../../client/components/boards/boardHeader.js).
  The handler shows the refusal in an alert; it used to close silently on
  success and do nothing on an error.
- **Server**: the `watch` method in
  [server/notifications/watch.js](../../../server/notifications/watch.js) checks
  `getFeatureFlags().disableWatch` first, then `canSeeBoard()`, which asks the
  database with the same `boardVisibilitySelectors` the board publications use.
  For a card, an assigned-only member may watch only the cards assigned to
  them.
- **What the level does**: an activity on the board notifies users at
  **Watching** for every activity, and users at **Tracking** only for
  activities they are a participant in; see the section above.
- **Tests**: [tests/boardWatchSilent.test.cjs](../../../tests/boardWatchSilent.test.cjs)
  and the browser spec
  [tests/playwright/specs/14-voting-watchers.e2e.js](../../../tests/playwright/specs/14-voting-watchers.e2e.js).

## Related

- [Notification delivery](../Notifications/Notification-Delivery.md)

## Commits

 - [Board role permissions apply to every path to a card, watching included](https://github.com/wekan/wekan/commit/5b2ed17e6b31ff8416dbf26d8c178f0b979013f0)
 - [Signed-in users boards can be watched by every signed-in user](https://github.com/wekan/wekan/commit/f122a8287c3212388ee157315369157b3f64c94a)
 - [Scoped list and card subscriptions are honoured](https://github.com/wekan/wekan/commit/03e8a6bf667b8bc1f8e8c85953c2919ad06acc0d)
 - [Muted boards are honoured for every notification source](https://github.com/wekan/wekan/commit/4be77e7189fcaa83acf15a4cc8ea8e5bd252ae4b)
 - [A watch button that was silent says why it was refused](https://github.com/wekan/wekan/commit/8ec78bb14ce07cf880e872bf989dbd951f57842e)
 - [The watch button shows its name](https://github.com/wekan/wekan/commit/7ac766992f79878f114434844ecbaa6b68091e9e)
 - [Admin Panel controls to disable activities, notifications and watching](https://github.com/wekan/wekan/commit/f1cc8daebf1d2c926f81f3a7e22beb7ffbbbe8ca)
