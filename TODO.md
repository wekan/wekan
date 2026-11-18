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

## Found while documenting the menus, to fix

- Member menu / Edit Profile: with Admin Panel / People / Login **Username
  change** allowed, a user's new username is not saved - `setUsername`
  (`server/models/users.js`) writes only when the caller is a site admin, while
  `setEmail` beside it allows a self change when the setting says so. The popup
  closes as if it had saved. Found on 2026-11-19.
- Member menu / Support: the Support page template has a case for signed-out
  visitors, but the `/support` route sends them to sign-in first, so that case is
  never reached; and `supportPopup` with its `.js-support` handler is no longer
  opened by the menu, which links to `/support`. Decide whether signed-out
  visitors should see the page, and remove the unused popup.
- Card menu / Create board from this card: the entry sits under `unless
  canModifyCard` in `cardDetailsActionsPopup` (`client/components/cards/
  cardDetails.jade`), so a member who can edit the card does not see it, while
  the `createBoardFromCard` method requires write access. It was in both
  branches when added (17c6d8d9b9); a later refactor kept only this one. Check in
  the running app and restore it for members who can edit the card.
- Board menu / All Boards Settings: the board menu entry is commented out
  ("Bug Board icons random dance", [#4214](https://github.com/wekan/wekan/issues/4214)), so the popup cannot be reached.
- Admin Panel / People / Shared templates: which group kinds the "Share template
  with" picker offers comes from the browser's `localStorage`
  (`sharedTemplatesScopes`), so it differs per browser and is empty in a browser
  where the admin never ticked them. An instance setting belongs in Settings.

