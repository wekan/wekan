# List menu / Sync

## What it is

List menu (☰ in the list header) → **Sync** opens the settings for keeping
this list up to date from an external tracker such as Jira, GitHub, GitLab or
Gitea (`listSyncPopup` in `client/components/lists/listHeader.jade`): the
tracker's issues become the list's cards, and later changes there are brought
in again.

When the list already has a sync source, a check-circle icon beside the
entry shows whether the sync is active or paused.

## Read more

- [Data synchronization](https://en.wikipedia.org/wiki/Data_synchronization)
  and [Issue tracking system](https://en.wikipedia.org/wiki/Issue_tracking_system)
  on Wikipedia.
- The full guide: [List sync](../Board-Sidebar/Board-Settings/Import-Export/Sync.md) -
  sources, fields, credentials, the schedule and conflicts.

## How to use it

Who sees it: a board member who is not **Comment only**, **Read only** or
**Read assigned only**.

1. Click ☰ (**List Actions**) in the list header → **Sync** (under
   **Settings**).
2. Choose the **Source**, fill in its **URL** and **Project key**, and the
   **Credential**. **Preview changes** shows what a run would do.
3. Tick **Sync enabled** and click **Save**; **Sync now** checks at once.

The fields, the preview, the run reports and conflict resolution are
described step by step in
[List sync](../Board-Sidebar/Board-Settings/Import-Export/Sync.md).

## How the numbers are calculated

A background job checks every synced list every 15 minutes
(`scanListSync` in [server/listSync.js](../../../server/listSync.js)); the
preview and report counts (created, updated, archived, omitted) are explained
in [List sync](../Board-Sidebar/Board-Settings/Import-Export/Sync.md).

## How it works in WeKan

- The popup is UI wiring only: the configuration, the Sync run and conflict
  resolution are server methods in
  [server/methods/listSync.js](../../../server/methods/listSync.js)
  (`setListSyncSource`, `hasListSyncCredential`, `previewListSync`,
  `syncListNow`, `listSyncRunReports`, `resolveListSyncConflict`), which make
  their own permission checks (board write access).
- The credential field is write-only: it always starts empty, and only
  whether a credential is set is shown.
- Tests: [tests/listSyncUiWiring.test.cjs](../../../tests/listSyncUiWiring.test.cjs)
  and the other `tests/listSync*.test.cjs` suites,
  [tests/playwright/specs/list-sync-source.e2e.js](../../../tests/playwright/specs/list-sync-source.e2e.js).

## Commits

 - [run outcomes and coverage reports are kept](https://github.com/wekan/wekan/commit/adf646177b75a62a0fcde67b8b82c34f4b277325)
 - [preview Sync changes without applying writes](https://github.com/wekan/wekan/commit/80ccf100a77975242d5711b331de1f9ab143b98c)
 - [resolve field conflicts from the list popup](https://github.com/wekan/wekan/commit/df376f7888339b1a78aa6482f9db64b613ad5a7a)
 - [choose card creation and archival in the popup](https://github.com/wekan/wekan/commit/21504d556c8dece75a519262835250358dc4555b)
 - [choose the synchronized text fields in the popup](https://github.com/wekan/wekan/commit/31c9b1d6d3c33c3459701904c553ae9403b0db97)
 - [a Sync section in the list menu for the list-sync backend](https://github.com/wekan/wekan/commit/b382519aae23bb4715809d18554d3cd1a94a90fb)
 - [a list-sync job keeps a list up to date from Jira, GitHub, GitLab and Gitea](https://github.com/wekan/wekan/commit/a01e8478c30cce9569c6e68f5eb374031b162191)
