# Admin Panel / Problems / Rules Report

## What it is

The Rules Report lists every automation rule on the instance, with its board,
trigger and action, so a site administrator can see in one place what WeKan
does automatically on every board - for example while looking for a rule that
moves cards unexpectedly. It shows all boards, not only the administrator's own.
Address: `/admin/problems/rules`. Site administrators only.

## Read more

- [Business rules engine](https://en.wikipedia.org/wiki/Business_rules_engine)
  on Wikipedia - rules made of a trigger (an event) and an action, which is what
  a WeKan rule is.
- In WeKan: [Rules](../../Automation/Rules/Rules.md),
  [Rules REST API](../../../API/Rules.md), the shared
  [table page](../../General/Table.md).

## How to use it

1. Log in as a site administrator.
2. Click your avatar or username at the top right and choose **Admin Panel**.
3. Click the **Problems** tab.
4. In the left menu, under **Reports**, click **Rules Report**.
5. Page with the previous / next buttons; the total and `page X / N` are shown
   beside them.
6. To find a rule, type part of its title in the search box and press
   **Enter**. Clear the box and press Enter to see every rule again.
7. To change a rule, open its board and edit it in the board's rules editor:
   this pane is read-only.

## How the numbers are calculated

| Number | How it is computed |
| --- | --- |
| Total | `getRulesReportCount` counts every rule whose title matches the search (case-insensitive, the search text taken literally), or every rule when the search is empty ([server/publications/rules.js](../../../../server/publications/rules.js)). |
| Rows per page | 10 (`TABLE_PAGE_ROWS_PER_PAGE` in [models/lib/tablePage.js](../../../../models/lib/tablePage.js)). |
| Page count | `ceil(total / 10)`, at least 1. |
| Order | by board id (`sort: { boardId: 1 }`), so the rules of one board are together. |

## How it works in WeKan

### The table

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

The column labels are fixed English text in the table spec, not translated
([client/components/settings/adminProblems.js](../../../../client/components/settings/adminProblems.js),
`REPORT_TABLES['report-rules']`).

### Several triggers and actions

A rule may have several triggers (any of them fires it) and several actions
(run in order, the original first): `triggerId`/`actionId` plus
`extraTriggerIds`/`extraActionIds` ([models/lib/ruleParts.js](../../../../models/lib/ruleParts.js)).
The publication sends every trigger and action of each rule on the page, but
the actionType and activityType columns show the rule's **original** action and
trigger (`rule.action()` and `rule.trigger()` in [models/rules.js](../../../../models/rules.js)).

### Server side

- `rulesReport(searchTerm, limit, skip)` returns nothing unless the caller is a
  site administrator (`isAdmin`); `getRulesReportCount` throws `not-authorized`.
- The page is published manually (fetch, then `this.added` for the rules, their
  actions, triggers and boards' titles, then `this.ready`), not as a live
  cursor: a sorted and limited live observe hung on FerretDB's OpLog and left
  the report on its spinner.

### Tests

- [tests/rulesBleed.test.cjs](../../../../tests/rulesBleed.test.cjs) - the rules
  publications, `rulesReport` included, are admin-only.
- [tests/adminPageRows.test.cjs](../../../../tests/adminPageRows.test.cjs) - the
  report fetches one page of rows from the server and counts them separately.

## Related

- [Rules](../../Automation/Rules/Rules.md)
- [Rules REST API](../../../API/Rules.md)

## Commits

 - [A rule may have several triggers and several actions; the report publishes all of them](https://github.com/wekan/wekan/commit/69eeb00c84e2897e53ea96ef13df9524fc4d432a)
 - [Admin reports show the whole instance, not only the admin's own boards](https://github.com/wekan/wekan/commit/6c1d62cde058522f442ec8f24116e2cd986f45bd)
 - [Publish the report page manually so it loads on FerretDB](https://github.com/wekan/wekan/commit/dded8ed47695092a698ab3e34a8abc5c6f567607)
 - [Pagination and search for the Admin Panel reports](https://github.com/wekan/wekan/commit/096a3dc46bf9391df899482ab1e805a0c846cc43)
 - [RulesBleed: only administrators read every rule](https://github.com/wekan/wekan/commit/a787bcddf33ca28afb13ff5ea9a4cb92dceac005)
 - [Add the rules report](https://github.com/wekan/wekan/commit/1d4a65d0b4e9910b1eebfcaee56c74a7105f6d09)
