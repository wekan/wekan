# Admin Panel / Problems / Impersonation Report

## What it is

Every time an administrator acted as another user, and why. Impersonation lets
an administrator see WeKan as one user sees it, for example to export a private
board; this report is the audit trail of it, so that use of that power is
visible afterwards. Address: `/admin/problems/impersonation`. Site
administrators only: the publication sends nothing, and the count method
refuses, for anybody who is not `isAdmin`.

## Read more

- [Audit trail](https://en.wikipedia.org/wiki/Audit_trail) - a record of who
  did what, and when.
- WeKan: [People](../People/People.md) - where impersonation starts;
  [table page](../../General/Table.md); [REST API](../../../API/REST-API.md).

## How to use it

**Impersonate a user (what makes a row)**

1. Open **Admin Panel → People**.
2. On the user's row press `⋯` and choose **Impersonate user**.

**Read the report**

1. Open **Admin Panel → Problems → Impersonation Report**.
2. Read the table, newest first, 10 rows a page; use the previous/next page
   buttons for older rows.
3. Click an Admin or Impersonated user name for the **Edit user** popup.
4. Type in the search box and press Enter to search.

Nothing in this pane deletes or changes a row.

## How the numbers are calculated

- **Rows per page:** 10 (`TABLE_PAGE_ROWS_PER_PAGE` in
  [models/lib/tablePage.js](../../../../models/lib/tablePage.js)). The page is
  fetched from the server with `limit` = 10 and `skip` = (page - 1) × 10,
  sorted by `createdAt` descending.
- **Total:** `getImpersonationReportCount(searchTerm)` counts every row that
  matches the search, and the page count is that total divided by 10, rounded
  up, and at least 1 (`pageInfo` in the same file). A page that no longer
  exists resolves to the last real page.
- **REST token reasons** are kept up to 500 characters
  (`reason.slice(0, 500)` in
  [server/models/users.js](../../../../server/models/users.js)).

## How it works in WeKan

The rows are the `impersonatedUsers` collection
([models/impersonatedUsers.js](../../../../models/impersonatedUsers.js)). A row
is written when:

| Reason | Written when |
| --- | --- |
| `clickedImpersonate` | an administrator impersonates a user from Admin Panel / People (the `impersonate` method) |
| `restCreateToken: <reason>` | an administrator creates a login token for another user through the REST API; the reason is required and kept, up to 500 characters |
| `exportJSON`, `exportJSONattachment`, `exportExcel`, `exportExcelCard`, `exportCardPDF`, or the export type | a board, card or attachment is exported while impersonating, with the board it was exported from |

The export rows are written by [models/export.js](../../../../models/export.js),
[models/exportExcel.js](../../../../models/exportExcel.js),
[models/exportExcelCard.js](../../../../models/exportExcelCard.js) and
[models/exportPDF.js](../../../../models/exportPDF.js); the other two by
[server/models/users.js](../../../../server/models/users.js).

The table is the shared [table page](../../General/Table.md), fetched one page
at a time from the server
([server/publications/impersonationReport.js](../../../../server/publications/impersonationReport.js):
the `impersonationReport` publication and the `getImpersonationReportCount`
method). The publication publishes the page by hand (fetch, `added`, `ready`)
rather than returning a live limited cursor, which would hang on FerretDB. It
also publishes the referenced admin and user documents, never the current
user, so the names can be shown and clicked:

| Column | Holds |
| --- | --- |
| Date | when it happened |
| Admin | the administrator; click the name for the Edit user popup |
| Impersonated user | the user acted as, when there was one; click for Edit user |
| Board | the board id, for exports |
| Reason | one of the reasons above |

The search box applies when Enter is pressed
([client/components/settings/adminProblems.js](../../../../client/components/settings/adminProblems.js)).
It matches, case-insensitively and literally (regex characters escaped), the
admin, user, board and attachment ids and the reason
([models/lib/impersonationReportQuery.js](../../../../models/lib/impersonationReportQuery.js)) -
ids, not user names.

Tests: [server/lib/tests/impersonationReportQuery.tests.js](../../../../server/lib/tests/impersonationReportQuery.tests.js),
[tests/adminPageRows.test.cjs](../../../../tests/adminPageRows.test.cjs) and the
browser tests
[tests/playwright/specs/38-impersonation.e2e.js](../../../../tests/playwright/specs/38-impersonation.e2e.js)
and [tests/playwright/specs/admin-impersonation-avatar.e2e.js](../../../../tests/playwright/specs/admin-impersonation-avatar.e2e.js).

## Commits

- [Impersonation status stays private behind the REST API gate](https://github.com/wekan/wekan/commit/bb4c892254764d787a85d7b1a46e2e1f6683ec7a)
 - [Initials for impersonated users that no longer exist](https://github.com/wekan/wekan/commit/ba4637e5587429c42278d5b9ac90500cab07b234)
 - [The admin lists show one page of ten, index-backed](https://github.com/wekan/wekan/commit/c1add5bc5e5537e3cc8f96076164ebdf4328b0e8)
 - [The report is published by hand so it loads on FerretDB](https://github.com/wekan/wekan/commit/dded8ed47695092a698ab3e34a8abc5c6f567607)
 - [Positive and negative tests for the report](https://github.com/wekan/wekan/commit/339729fd9599ec93b5f1a4a4c3b81bc8f0ab74ad)
 - [The paginated Impersonation report](https://github.com/wekan/wekan/commit/a13ce5ef092d69c6cc83a061a2437ae6dcb6b11d)
 - [Exports while impersonating are logged into impersonatedUsers](https://github.com/wekan/wekan/commit/3908cd5413b775d1ee549f0a95304cf9998d3855)
