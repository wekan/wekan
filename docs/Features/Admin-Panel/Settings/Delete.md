# Admin Panel / Settings / Delete

Whether deleted content can be destroyed for good. Address:
`/admin/settings/delete`. Site administrators only.

Until 2026-11-19 this pane was Admin Panel / Problems / Delete;
`/admin/problems/delete` redirects here.

Deleting in WeKan is a **soft delete**: a deleted list, card or attachment is
marked deleted and can be restored (undo, the card or list History, Admin Panel /
Problems / Recovery). Nothing is destroyed in ordinary use.

**Enable permanent delete for Global Admin** lets Global Admins permanently delete
soft-deleted content - for example a list in the recycle bin, or an archived
board together with its attachments. It is off by default, and turning it on
deletes nothing by itself. GDPR account erasure is a separate path and does not
depend on it.

The permanent-delete setting must be on before a delete icon is shown. Recovery
records setting changes and every successful, failed or unauthorized
permanent-delete attempt, with its Done status, user id, username, trusted IPv4
or IPv6 address and available location; a board deletion records ids and titles.

## Related

- [Admin Panel / Problems / Recovery](../Problems/Recovery.md)
- [Undo](../../General/Undo/Undo.md)
