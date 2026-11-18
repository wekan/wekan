# Admin Panel / Problems / Boards Report

Every board on the instance, with its visibility, members, organizations and
teams. Address: `/admin/problems/boards`. Site administrators only, and over
the whole instance, not only the boards the administrator is a member of.

## The table

The shared [table page](../../General/Table.md), 10 rows a page, in the boards'
default sort order, fetched one page at a time from the server
(`boardsReport` publication, `getBoardsReportCount` method,
`server/publications/boards.js`):

| Column | Holds |
| --- | --- |
| Title | shortened to 30 characters |
| Id | the board id |
| Permission | `public`, `instance` or `private` |
| Archived? | Yes or No |
| Members | user names of the active members; a removed member is not listed ([#5122](https://github.com/wekan/wekan/issues/5122)) |
| Organizations | the organizations the board is shared with |
| Teams | the teams the board is shared with |

## Search and filter

- The search box applies when Enter is pressed and matches the board title,
  case-insensitively.
- **Permission** - All, Public, Instance or Private - narrows the list to boards
  of that visibility and starts again from page 1.

The pane is read-only.

## Related

- [Organizations](../People/Organizations.md) and [Teams](../People/Teams.md)
- [Cards Report](Cards-Report.md)
