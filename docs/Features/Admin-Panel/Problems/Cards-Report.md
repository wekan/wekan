# Admin Panel / Problems / Cards Report

Every card on the instance, with where it is and who is on it. Address:
`/admin/problems/cards`. Site administrators only, over every board, whether or
not the administrator is a member.

## The table

The shared [table page](../../General/Table.md), 10 rows a page, sorted by
board and then newest first, fetched one page at a time from the server
(`cardsReport` publication, `getCardsReportCount` method,
`server/publications/cards.js`). Only the columns below are sent, not whole
card documents:

| Column | Holds |
| --- | --- |
| Card Title | shortened to 30 characters |
| Board, Swimlane, List | the titles of each |
| Members | user names of the card's members |
| Assignees | user names of the card's assignees |

The search box applies when Enter is pressed and matches the card title,
case-insensitively. The total is counted once when the pane opens or the search
changes, not on every page. The pane is read-only.

## Related

- [Broken Cards](Broken-Cards.md) - the cards that are missing a board, swimlane
  or list.
- [Boards Report](Boards-Report.md)
