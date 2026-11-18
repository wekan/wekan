# List menu / More

List menu (☰ in the list header) → **More**, the last entry, opens a small
popup (`listMorePopup` in `client/components/lists/listHeader.jade`).

## Who sees it

A board member who is not **Comment only**, **Read only** or **Read assigned
only**.

## What it shows

- **Link to this list**, with the board's visibility icon, and a read-only
  box holding the list's own absolute address (`models/lib/boardItemUrl.js`,
  [#6459](https://github.com/wekan/wekan/issues/6459)). See
  [Board item links](../General/Board-Item-Links.md).
- **Added**, the date the list was created.

Nothing in it changes the board. A Delete link exists in the template but is
commented out, so it is not shown; to remove a list, use
**Move List to Archive** and delete it from the
[Archive](../Board-Sidebar/Archive/Archive-and-Delete.md).
