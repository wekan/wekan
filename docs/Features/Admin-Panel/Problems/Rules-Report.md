# Admin Panel / Problems / Rules Report

Every automation rule on the instance, with its board, trigger and action.
Address: `/admin/problems/rules`. Site administrators only.

## The table

The shared [table page](../../General/Table.md), 10 rows a page, sorted by
board, fetched one page at a time from the server (`rulesReport` publication,
`getRulesReportCount` method, `server/publications/rules.js`):

| Column | Holds |
| --- | --- |
| Rule Title | the rule's title |
| Board Title | the board the rule belongs to |
| actionType | the type of the rule's action |
| activityType | the activity type of the rule's trigger |

The search box applies when Enter is pressed and matches the rule title,
case-insensitively. The pane is read-only: rules are edited on their board.

## Related

- [Rules](../../Automation/Rules/Rules.md)
- [Rules REST API](../../../API/Rules.md)
