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

- Per-list role exceptions (#4527) and dependency lines - decided 2026-11-18: a
  list that refuses a role write access refuses that role's dependency-line
  writes on its cards too (`setBoardDependency`, `removeBoardDependency`,
  `importBoardDependencies` and the REST `/cards/:cardId/dependencies` routes).
- Per-list role exceptions and the rules engine's own actions - decided
  2026-11-18: a move, copy, create-card or archive action that would write into a
  list refusing the triggering user's role is skipped, the rest of the rule still
  runs, and the skip is visible (`server/rulesHelper.js` performAction,
  `server/lib/ruleCopyCard.js`, `server/notifications/storedRulePlans.js`).
- Per-list role exceptions and whole lists and swimlanes - decided 2026-11-18: a
  refusing list stops that role from deleting, archiving or moving it, and from
  deleting or moving a swimlane holding cards in it, on DDP, REST and the client
  `Lists` allow/deny alike; board admins are never restricted.
- [#6837](https://github.com/wekan/wekan/issues/6837) - decided 2026-11-18:
  administrator-defined feature profiles. An administrator defines named
  profiles in the Admin Panel, each saying which features it shows, and assigns
  them to users, organizations or teams, to hide features from new users.
