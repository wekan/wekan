# TODO

What is not done yet in WeKan, with the reason it is not done. This used to be
the TODO Later block inside `# Status` of `CHANGELOG-big.md`; it lives here so
the changelog only says what changed.

- An item here is NOT done, so it thanks nobody and links no commit. Link the
  issue when there is one: `[#NNNN](https://github.com/wekan/wekan/issues/NNNN)`
  and a one-line reason.
- When an item is done, REMOVE it from this file and write its entry in the
  `# Upcoming WeKan ® release` section of `CHANGELOG-big.md`, linking the commit.
  A fixed item never stays here.
- An investigated issue that cannot be fixed or verified here is added under
  the category that says why. An emptied category is removed.

`tests/todoFile.test.cjs` checks this shape.

## Need the running app to reproduce/verify

- The WebKit stage cannot run in the Flatpak sandbox: MiniBrowser needs its own
  sandbox, and turning that off is not allowed there. Run it on a host.

## Decided, to build

- Per-list role exceptions and List Sync's durable rule replay
  (`server/notifications/storedRulePlans.js`, `server/lib/syncRuleExecution.js`):
  the ordinary rules engine now skips an action into a list that refuses the
  triggering user's role, but the journaled List Sync replay still checks board
  write access only. A skip there needs a receipt of its own, so that the
  replayed plan completes instead of failing; until then a sync-triggered rule
  can still write into such a list.
- [#6837](https://github.com/wekan/wekan/issues/6837) - decided 2026-11-18:
  administrator-defined feature profiles. An administrator defines named
  profiles in the Admin Panel, each saying which features it shows, and assigns
  them to users, organizations or teams, to hide features from new users.
