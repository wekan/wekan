# Admin Panel / Problems / Impersonation Report

Every time an administrator acted as another user, and why. Address:
`/admin/problems/impersonation`. Site administrators only: the publication
sends nothing, and the count method refuses, for anybody who is not
`isAdmin`.

## Where the rows come from

The `impersonatedUsers` collection. A row is written when:

| Reason | Written when |
| --- | --- |
| `clickedImpersonate` | an administrator impersonates a user from Admin Panel / People (the `impersonate` method) |
| `restCreateToken: <reason>` | an administrator creates a login token for another user through the REST API; the reason is required and kept, up to 500 characters |
| `exportJSON`, `exportJSONattachment`, `exportExcel`, `exportExcelCard`, `exportCardPDF`, or the export type | a board, card or attachment is exported while impersonating, with the board it was exported from |

Nothing in this pane deletes or changes a row.

## The table

The shared [table page](../../General/Table.md), newest first, 10 rows a page,
fetched one page at a time from the server (`impersonationReport` publication,
`getImpersonationReportCount` method):

| Column | Holds |
| --- | --- |
| Date | when it happened |
| Admin | the administrator; click the name for the Edit user popup |
| Impersonated user | the user acted as, when there was one; click for Edit user |
| Board | the board id, for exports |
| Reason | one of the reasons above |

The search box applies when Enter is pressed. It matches, case-insensitively,
the admin, user, board and attachment ids and the reason
(`models/lib/impersonationReportQuery.js`) - ids, not user names.

## Related

- [People](../People/People.md) - where impersonation starts.
- [REST API](../../../API/REST-API.md)
