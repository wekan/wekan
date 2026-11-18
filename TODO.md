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
- [#6834](https://github.com/wekan/wekan/issues/6834) (the minicard due date is
  fixed; the board header bar wrapping to a second row and the list header icons
  under the card count did not reproduce on the current code at the same window
  width, in Persian, with the card count on - which WeKan release and browser
  zoom showed them is asked; wrapping the header rather than hiding buttons is by
  design)

## Needs a maintainer decision on the intended contract

- [#6837](https://github.com/wekan/wekan/issues/6837) (a Simple and an Advanced
  mode, or profiles an administrator defines and assigns, to hide features from
  new users: which features each mode or profile shows, who chooses it, and how
  it relates to the existing per-board Board Settings / Card and Show on Minicard
  switches and the Admin Panel feature toggles)
- Per-list role exceptions (#4527) and dependency lines: a list that refuses a
  role write access does not stop that role from adding, changing or removing a
  dependency line on one of its cards (`setBoardDependency`, the REST
  `/cards/:cardId/dependencies` routes, `importBoardDependencies`). ListLockBleed
  decided they follow their own board-wide rule (`canEditBoardDependencies`);
  ListLockBulkBleed (GHSA-83w9-74mx-7v83) kept that. Should the card's list
  refuse them too?
- Per-list role exceptions and the rules engine's own actions: a rule's move,
  copy, create-card and archive actions (`server/rulesHelper.js` performAction,
  `server/lib/ruleCopyCard.js`, the replays in
  `server/notifications/storedRulePlans.js`) check only board write access on a
  destination. A card's rule button now asks the card's list; should the lists a
  rule's actions write into be asked too, as the user who triggered the rule,
  and is a refused action skipped or the whole rule run refused?
- Per-list role exceptions and whole lists and swimlanes: deleting, archiving or
  moving a list (`lists.softRemove`, `lists.restore`, `lists.purge`,
  `moveList`, the REST list DELETE, archive and move) and deleting or moving a
  swimlane (the REST swimlane DELETE and its remove hook, `moveSwimlane`) also
  remove, archive or move the cards in a list that refuses the caller's role.
  These are board structure, gated by board write access; should a refusing list
  stop them, and the `Lists` allow/deny rules consult exceptions as well?
