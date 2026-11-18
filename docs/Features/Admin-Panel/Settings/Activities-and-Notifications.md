# Admin Panel / Settings / Activities and notifications

For deployments that must limit activity tracking
([#5820](https://github.com/wekan/wekan/issues/5820)). Address:
`/admin/settings/activities`. Site administrators only. Each switch is saved as
soon as it is ticked and is off by default.

Until 2026-11-19 this pane was Admin Panel / Problems / Notifications;
`/admin/problems/notifications` redirects here. It is not Admin Panel / People /
Notifications, which is about email notifications.

- **Disable all activities** - activity-feed entries are never recorded and
  never shown anywhere (the board sidebar and a card's activity tab). No history
  of who did what is kept.
- **Disable all notifications** - WeKan never sends watch notifications (in-app,
  email or other services) for any activity. Activities can still be recorded,
  unless also disabled above; only the notifications are suppressed.
- **Disable watch** - nobody can watch boards, lists or cards to receive
  notifications, and any attempt to change a watch level is refused.

## Related

- [Admin Panel / People / Notifications](../People/Notifications.md) - email
  notifications.
- [Security](Security.md)
