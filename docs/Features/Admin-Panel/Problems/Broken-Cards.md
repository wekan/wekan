# Admin Panel / Problems / Broken Cards

Cards that cannot be shown on a board as they are. Address:
`/admin/problems/broken-cards`. Site administrators only, over every board of
the instance, whether or not the administrator is a member.

## What counts as broken

A card that has no board, no swimlane or no list (the field is missing or
empty), or whose type is not one of the card types WeKan knows
(`BROKEN_CARDS_SELECTOR` in `server/publications/cards.js`).

## The table

The shared [table page](../../General/Table.md), 10 rows a page, sorted by
board and then newest first, fetched one page at a time from the server
(`brokenCardsReport` publication, `getBrokenCardsReportCount` method):

| Column | Holds |
| --- | --- |
| Card Title | shortened to 30 characters |
| Id | the card id |
| Board, Swimlane, List | the titles of those that exist; an empty cell is the part that is missing |
| Type | the card's type |
| Created at | when the card was created |

The search box applies when Enter is pressed and matches the card title,
case-insensitively.

## Repairing

This pane only lists. The repair is on [Summary](Summary.md): the
**Broken cards** problem there has a **Repair broken cards** button, which runs
the repair over every board and says how many cards it fixed and how many have
no board at all and cannot be placed anywhere. Opening a board also repairs its
own cards ([Repairs.md](Repairs.md)).
