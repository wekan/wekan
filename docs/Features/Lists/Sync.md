# List menu / Sync

List menu (☰ in the list header) → **Sync** opens the settings for keeping
this list up to date from an external tracker (`listSyncPopup` in
`client/components/lists/listHeader.jade`).

When the list already has a sync source, a check-circle icon beside the
entry shows whether the sync is active or paused.

## Who sees it

A board member who is not **Comment only**, **Read only** or **Read assigned
only**. The popup is UI wiring only: the configuration, the Sync run and
conflict resolution are server methods in `server/methods/listSync.js`, which
make their own permission checks.

## The full guide

Sources, fields, credentials, the schedule and conflicts are described in
[List sync](../Board-Sidebar/Board-Settings/Import-Export/Sync.md).
