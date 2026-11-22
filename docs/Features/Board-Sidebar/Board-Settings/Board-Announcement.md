# Board Settings / Board announcement

## What it is

A message a board administrator writes for everyone on one board (#1566),
shown in a bar above the board's lists until each member closes it. It is in
the style of the site-wide
[Admin Panel announcement](../../Admin-Panel/Settings/Announcement.md) but one
per board. An edited announcement is shown again to everyone.

## Read more

- [Admin Panel / Settings / Announcement](../../Admin-Panel/Settings/Announcement.md)
- [WeKan issue #1566](https://github.com/wekan/wekan/issues/1566), the request

## How to use it

**Write the announcement:**

1. Open the board, its right sidebar, then **Board Settings → Board
   announcement** (`fa-bullhorn`), after **Change color**. It is shown to
   **board admins only**.
2. Write the text in **Board announcement**: up to 2000 characters, plain text
   (it is escaped when shown).
3. Tick **Show it to everyone on this board**.
4. Click **Save**.

**What members see:** above the board's lists (`boardAnnouncement` in
`boardBody.jade`), a bar with the bullhorn, the text and a close **X**, shown
while the announcement is enabled and not empty. The **X** hides it for you.

## How the numbers are calculated

- **Length**: the text is trimmed and may then be at most 2,000 characters
  (`MAX_BOARD_ANNOUNCEMENT` in
  [models/lib/boardAnnouncement.js](../../../../models/lib/boardAnnouncement.js));
  a longer one is refused. Empty text saves the announcement as not enabled.
- **Version**: the time it was last saved (`updatedAt`). A member who closed it
  does not see it again until the version changes; every save sets a new
  version, so an edited announcement is shown again to everyone, including
  those who dismissed the earlier one.

## How it works in WeKan

The popup is `boardAnnouncementPopup` in
[client/components/boards/boardAnnouncement.jade](../../../../client/components/boards/boardAnnouncement.jade).
**Save** stores `announcement: { enabled, body, updatedAt }` on the board
(`cleanBoardAnnouncement()` in
[models/lib/boardAnnouncement.js](../../../../models/lib/boardAnnouncement.js))
through `Boards.updateAsync`, which the server allows for a board admin. The
bar is shown by `showBoardAnnouncement()`: enabled, not empty, and not
dismissed at this version. The **X** calls the `dismissBoardAnnouncement`
method in [models/users.js](../../../../models/users.js), which checks the
user may see the board and records in the user's profile
(`profile.dismissedBoardAnnouncements`) the version they dismissed. Pinned by
[tests/boardAnnouncement.test.cjs](../../../../tests/boardAnnouncement.test.cjs).

## Commits

 - [Give each board an announcement of its own](https://github.com/wekan/wekan/commit/7ccd987eb134f10e021343542fe8fe825dbf128c)
