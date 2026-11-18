# Board header / Watch

The control after [Visibility](Visibility.md) in a board's header controls. It
shows your own watch level for this board — **Watching** (`fa-eye`),
**Tracking** (`fa-bell`) or **Muted** (`fa-bell-slash`) — as its icon, label
and tooltip. See [the header](../Header-Bar/Header.md) for its place in the bar.

The level is per user: it is stored in the board's `watchers` array as
`{ userId, level }` (`models/watchable.js`). A user with no entry is
**Muted**, which is the default; choosing Muted removes the entry.

## Who can use it

Every signed-in user who can see the board. The button is not drawn when an
administrator has turned on **Disable watch** in
[Admin Panel / Settings / Activities and notifications](../Admin-Panel/Settings/Activities-and-Notifications.md)
(`watchDisabled` helper, `Settings.disableWatch`).

## The popup

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

- watching is disabled by the administrator (`error-watch-disabled`), or
- the user may not see the board (`error-board-notAMember`). Seeing it through
  membership, an organization, a team, an email domain, or because it is
  public or signed-in-users all count.

## What the level does

In `server/models/activities.js`, an activity on the board notifies users at
**Watching** for every activity, and users at **Tracking** only for activities
they are a participant in. `models/lib/boardNotificationRecipients.js` then
keeps only active board members whose level is Watching or Tracking, or who
explicitly watch the list or card concerned. Being assigned or mentioned does
not reach a member who has muted the board.

How a notification is delivered (in-app, email, ntfy and so on) is chosen in
[Member Settings / Notifications](../Member-Settings/Notifications.md) and
[Board Settings / Notifications](../Board-Sidebar/Board-Settings/Notifications.md).

## Related

- [Notification delivery](../General/Notifications/Notification-Delivery.md)
