# Board Settings / Board announcement

**Right sidebar / Board Settings / Board announcement** (`fa-bullhorn`), after
**Change Color**, is the board's own announcement (#1566), in the style of the
site-wide [Admin Panel announcement](../../Admin-Panel/Settings/Announcement.md)
but one per board. Shown to **board admins only**; saving goes through
`Boards.updateAsync`, which the server allows for a board admin.

## The popup

`boardAnnouncementPopup` in `client/components/boards/boardAnnouncement.jade`:

- **Board announcement** - the text, up to 2000 characters, plain text (it is
  escaped when shown).
- **Show it to everyone on this board** - the on/off checkbox.
- **Save** - stores `announcement: { enabled, body, updatedAt }` on the board
  (`cleanBoardAnnouncement()` in `models/lib/boardAnnouncement.js`). The text is
  trimmed; empty text saves the announcement as not enabled.

## What members see

Above the board's lists (`boardAnnouncement` in `boardBody.jade`), a bar with
the bullhorn, the text and a close **X**, shown while the announcement is
enabled and not empty. The **X** calls `dismissBoardAnnouncement`, which records
in the user's profile the version (the `updatedAt` time) they dismissed. Every
save sets a new version, so an edited announcement is shown again to everyone,
including those who dismissed the earlier one.

## Related

- [Admin Panel / Settings / Announcement](../../Admin-Panel/Settings/Announcement.md)
