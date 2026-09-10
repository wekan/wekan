# Notification Settings (3-tier: Admin → Board → Member)

WeKan's notification channels (email, push, in-app, etc. - one row per
notification service) can be turned on or off at three levels that override
each other in order: an **Admin Panel** default applies to everyone, a
**Board** setting can override it for that board, and a **Member** setting
can override that again for just that person. This lets an admin set a
sane sitewide default, a board owner tighten/loosen it for their board, and
an individual still have the final say for themselves. See
`models/lib/notificationSettings.js`.

## Where to find it

The same popup opens from three different places, each scoped differently:

- **Member Settings**: avatar/name (top left) → **Notifications**.
- **Board Settings**: right sidebar → Board Settings → **Notification
  Settings**.
- **Admin Panel**: Admin Panel → **People** → a user's notification defaults.

```
┌ Notification Settings ───────────────────────┐
│ (popup description text)                      │
│                                                │
│ 🔔 Card assigned to me   [Default][Yes][No]    │
│ 📧 Due date reminder     [Default][Yes][No]    │
│ 💬 Comment added         [Default][Yes][No]    │
│ ...                                            │
└──────────────────────────────────────────────────┘
```

At Admin scope the row only offers **Yes/No** (there is no level above it to
fall back to); at Board and Member scope each row offers **Default / Yes /
No**, where Default means "inherit from the level above".

## Steps to use it

1. Open the popup from whichever level you want to change (see above).
2. For each notification service row, click **Yes** to force it on, **No**
   to force it off, or **Default** (Board/Member scope only) to fall back to
   the setting above this level.
3. Changes apply immediately - there is no separate Save button.

## Precedence

```
Admin default  --->  Board override  --->  Member override
   (base)          (per-board, optional)   (per-person, optional)
```

A member's "Default" choice falls through to the board's setting; a board's
"Default" choice falls through to the admin default. Whoever sets the most
specific non-Default choice wins for that person on that board.
