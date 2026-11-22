# Admin Panel / Settings / Announcement

## What it is

One instance-wide banner: a checkbox to show it, and the text. A site
administrator uses it to tell every signed-in user something at once - a
maintenance break, a new address, a policy change.

The banner can be **dismissed permanently per user** — closing it stores the
current announcement version on that user, so it does not come back on reload
or when switching boards. Editing the text changes its version, and the banner
reappears for everyone.

This is not a board's own announcement, which a board admin writes for one
board in the board menu, **Board announcement**.

## Read more

- [Web banner](https://en.wikipedia.org/wiki/Web_banner) on Wikipedia - the
  general idea of a strip across the top of a web page.
- [djb2](http://www.cse.yorku.ca/~oz/hash.html) - the string hash WeKan uses to
  give each announcement text its version.
- [Admin Panel / Settings](README.md) - the other panes of this tab.

## How to use it

**Show an announcement**

1. Open **Admin Panel / Settings / Announcement**
   (`/admin/settings/announcement`).
2. Tick **Active System-Wide Announcement**. The text box appears; the tick is
   saved at once.
3. Type the message under **Announcement from Administrator**.
4. Press **Save**.

**Take it down**

1. Untick **Active System-Wide Announcement**. The banner disappears for
   everybody.

**As a user**

1. The banner is shown at the top of Home, every All Boards list (Remaining,
   Starred, Templates, Archive) and every board you are a member of.
2. Press the **×** at its right end to close it. It stays closed for you until
   the administrator changes the text.

## How the numbers are calculated

The only number is the announcement **version**, computed by
`announcementVersion()` in
[models/announcements.js](../../../../models/announcements.js):

- the string `<_id> <title> <body>` is hashed with djb2 (start at 5381, then
  `hash = hash * 33 + charCode` for each character, kept to 32 bits);
- the version is `<_id>:<hash in base 36>`.

`shouldShowAnnouncement()` shows the banner when the announcement is enabled,
has a version, and that version is not the one stored on the user as
`profile.dismissedAnnouncementVersion`. Any change to the title or body gives a
new hash, so a dismissed banner returns for everyone. There are no limits or
other defaults; the switch is off by default.

## How it works in WeKan

- **Collection** `announcements`, schema in
  [models/announcements.js](../../../../models/announcements.js): `enabled`
  (default `false`), `title`, `body`, `sort`, `createdAt`, `modifiedAt`. One
  document is used.
- **Admin pane**: template `announcementSettings` in
  [client/components/settings/settingBody.jade](../../../../client/components/settings/settingBody.jade),
  handlers in
  [settingBody.js](../../../../client/components/settings/settingBody.js) write
  `enabled` and `body` with a client update.
- **Permission**: [server/permissions/announcements.js](../../../../server/permissions/announcements.js)
  lets only a site administrator (`user.isAdmin`) update it. The
  [publication](../../../../server/publications/announcements.js)
  `announcements` sends it to every client.
- **Who sees it**: `showAnnouncementToUser()` in the same model file - a
  signed-in user on a page without a board, or a member of the board that is
  open; nobody signed out (#1281, #6854). The banner itself is in
  [client/components/main/header.jade](../../../../client/components/main/header.jade).
- **Dismissal**: the close button in
  [header.js](../../../../client/components/main/header.js) calls the method
  `dismissAnnouncement` in [models/users.js](../../../../models/users.js),
  which computes the version **on the server** from the current announcement
  and stores it, so a client cannot dismiss a future version in advance.
- **Tests**: [server/lib/tests/announcementDismiss.tests.js](../../../../server/lib/tests/announcementDismiss.tests.js)
  and [tests/announcementAudience.test.cjs](../../../../tests/announcementAudience.test.cjs).

## Commits

 - [Shown on Home and every All Boards list, not only on a board](https://github.com/wekan/wekan/commit/64b576202057831502dfdcf90e22ee1ddc8f33fd)
 - [A user can dismiss the banner for good, until its text changes (#6051)](https://github.com/wekan/wekan/commit/bf75efaef566fe0e4219ee85e063b02399b6d353)
 - [The close button of the banner works again](https://github.com/wekan/wekan/commit/5a51c2940a9860787e3dcdbb1188eee7f5237d27)
 - [The pane reads the announcement, not the settings document](https://github.com/wekan/wekan/commit/cecf69af027d2571914892eac8d903afaec215cf)
 - [Notice renamed to announcement](https://github.com/wekan/wekan/commit/a88ac6113e5f7f428d0f021bbcb213cc517c177e)
 - [The first message from the service administrator](https://github.com/wekan/wekan/commit/aa1876f94c71d252d427f298e9b37c87f2fe4127)
