# Admin Panel / People / Notifications

The site-wide default for every notification WeKan can send: which notification
services (in-app tray, e-mail, and the rest of `notifyServiceRows`) are on or off
by default for everyone.

This is the top of a 3-tier precedence chain: **Admin Panel default** → **Board
override** → **Member override**. A board's Board Settings and a member's own
Member Settings can each override this default for their own scope, but a service
turned off here is off everywhere nothing more specific overrides it. The same
popup renders at all three levels (`notificationSettingsPopup`); this is the
`scope="admin"` case, which is why it offers only Yes/No rather than a third
"use the default" choice - there is no level above it to fall back to.

## Related

- [Member Settings notifications](../../Members/Notification-Settings.md), the same
  popup at the member scope, with the board and admin overrides it can fall back to.
