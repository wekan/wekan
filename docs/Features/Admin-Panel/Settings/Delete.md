# Admin Panel / Settings / Delete

## What it is

Whether deleted content can be destroyed for good. Address:
`/admin/settings/delete`. Site administrators only.

Deleting in WeKan is a **soft delete**: a deleted list, card or attachment is
marked deleted and can be restored (undo, the card or list History, Admin Panel /
Problems / Recovery). Nothing is destroyed in ordinary use. This pane is the one
switch that lets a Global Admin remove such content physically.

Until 2026-11-19 this pane was Admin Panel / Problems / Delete;
`/admin/problems/delete` redirects here.

## Read more

- [Undo](https://en.wikipedia.org/wiki/Undo) on Wikipedia, and WeKan's own
  [Undo](../../Undo/README.md) - what soft delete makes possible.
- [Audit trail](https://en.wikipedia.org/wiki/Audit_trail) on Wikipedia - what
  Recovery keeps about every permanent delete.
- [Right to be forgotten](https://en.wikipedia.org/wiki/Right_to_be_forgotten)
  on Wikipedia - the separate GDPR account erasure, which does not depend on
  this switch.
- [Admin Panel / Problems / Recovery](../Problems/Recovery.md).

## How to use it

1. Open **Admin Panel / Settings / Delete**.
2. Tick **Enable permanent delete for Global Admin**. It is saved at once,
   off by default, and turning it on deletes nothing by itself.
3. A Global Admin now sees a delete icon where permanent delete is offered -
   for example a list in the recycle bin, or an archived board together with
   its attachments in the All Boards archive.
4. Untick it again when you are done; the delete icons disappear.

GDPR account erasure is a separate path and does not depend on this switch.

The permanent-delete setting must be on before a delete icon is shown. Recovery
records setting changes and every successful, failed or unauthorized
permanent-delete attempt, with its Done status, user id, username, trusted IPv4
or IPv6 address and available location; a board deletion records ids and titles.

## How the numbers are calculated

This pane has no numbers of its own. The only default is that the switch is off
(`enablePermanentDelete: false` in
[models/lib/featureFlags.js](../../../../models/lib/featureFlags.js)).

## How it works in WeKan

- **Field** `enablePermanentDelete` on the settings document. The pane is
  template `featuresDelete` in
  [client/components/settings/adminProblems.jade](../../../../client/components/settings/adminProblems.jade);
  its tick calls the method `setPermanentDeleteEnabled` in
  [server/models/settings.js](../../../../server/models/settings.js), which
  refuses anyone but a site administrator and writes a
  `PERMANENT_DELETE_SETTING_CHANGED` Recovery event, Done or not, every time.
- **The gate**: `canPurge(user, enablePermanentDelete)` in
  [models/lib/softDelete.js](../../../../models/lib/softDelete.js) is true only
  for a site administrator while the switch is on. `lists.purge` in
  [server/models/lists.js](../../../../server/models/lists.js) and
  `permanentlyDeleteArchivedBoards` in
  [server/models/boards.js](../../../../server/models/boards.js) check it on
  the server, and refuse a board that is not archived.
- **Soft delete** itself (`deletedAt`, `deletedBy`, `deleteBatchId`) is in the
  same `softDelete.js`.
- **Tests**: [tests/softDelete.test.cjs](../../../../tests/softDelete.test.cjs),
  [tests/archivedBoardPermanentDelete.test.cjs](../../../../tests/archivedBoardPermanentDelete.test.cjs)
  and [tests/permanentDeleteRecoveryAudit.test.cjs](../../../../tests/permanentDeleteRecoveryAudit.test.cjs).

## Related

- [Admin Panel / Problems / Recovery](../Problems/Recovery.md)
- [Undo](../../Undo/README.md)

## Commits

 - [The pane moves from Problems to Settings](https://github.com/wekan/wekan/commit/e1a053d059191640a63a22ab553c0b0c6b833d8d)
 - [Attachments: soft delete on the card, hard delete only with the archived board](https://github.com/wekan/wekan/commit/dce28983820f99927b2cb3626e586488c962e084)
 - [Files Report permanent deletion is gated and audited](https://github.com/wekan/wekan/commit/99b1801e8413e1ab32312626a81993a5d4a8500e)
 - [Setting changes and board purges are audited](https://github.com/wekan/wekan/commit/134bd48de5a24772ba3846a05a51a8330b13fb7a)
 - [Permanently delete selected archived boards](https://github.com/wekan/wekan/commit/d3034d81ed4dea524f432c4db89aac35d6fa697a)
 - [The checkbox stays checked](https://github.com/wekan/wekan/commit/43d592590c6056707aa8ec89206e3a3e952f0a4a)
 - [Permanent delete in the Admin Panel](https://github.com/wekan/wekan/commit/4ab3161b4f58d459c2c1808eac91685d0888ec10)
