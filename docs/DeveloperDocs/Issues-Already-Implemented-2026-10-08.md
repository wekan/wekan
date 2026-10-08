# Issues closed on 2026-10-08 as already implemented

Open issues checked against the code on 2026-10-08 and found to be done
already. Each entry names where the feature is in the code, so the closing
commit says where it was fixed. The issues that are still open, and why, are in
[All-Open-Issues-Audit-2026-09-27.md](All-Open-Issues-Audit-2026-09-27.md).

## [#793](https://github.com/wekan/wekan/issues/793) Auto add user name to a
moved card

A rule does it: trigger "card moved to" a list
(client/components/rules/triggers/boardTriggers.jade) with the action "add
acting user as member" (client/components/rules/actions/cardActions.jade,
models/lib/ruleActingUser.js, server/rulesHelper.js). The mover is added to the
card's members, shown on the minicard, and can be removed.

## [#1631](https://github.com/wekan/wekan/issues/1631) Receive notifications
from other users only

The person who made a change is never notified of it, except when they @mention
themselves: server/models/activities.js filters `user._id !== userId` from the
recipients. The requested behaviour is the fixed default.

## [#1704](https://github.com/wekan/wekan/issues/1704) Move list(s) to a
different board

The list menu has Move and Copy with a board picker
(client/components/lists/listHeader.jade, listHeader.js), and the server move
checks the right to change both boards (server/models/lists.js,
requireBoardMutation for source and destination). Multi-Selection can move or
copy several lists to another board
(client/components/sidebar/sidebarFilters.jade).

## [#1758](https://github.com/wekan/wekan/issues/1758) Use the EXIF orientation
of uploaded pictures

Thumbnails and covers are rotated from EXIF on the server with sharp's
`.rotate()` (server/lib/imageThumbnail.js, server/lib/imageGif.js). Full-size
originals are shown by the browser, which applies EXIF orientation by default,
and no WeKan CSS overrides `image-orientation`.

## [#1844](https://github.com/wekan/wekan/issues/1844) Smart search of cards

Global Search (/global-search, config/router.js) matches free text in titles,
descriptions, comments, custom fields, checklists and attachments
(server/publications/cards.js), and finds archived cards with `status:archived`
/ `status:all` (config/search-const.js).

## [#1921](https://github.com/wekan/wekan/issues/1921) Resend verification or
change the verified flag

An administrator can mark an email address verified in Admin Panel / People /
edit user (client/components/settings/peopleBody.jade, setEmailVerified in
server/models/users.js), and the verify-email and resend-verification routes
exist (config/accounts.js).

## [#1990](https://github.com/wekan/wekan/issues/1990) Hide subtask boards on
All Boards

Subtask helper boards (titles wrapped in ^...^) are filtered out of All Boards,
the board publications, Bigboard and the multi-board calendar by
notHelperBoardTitle() (models/lib/helperBoards.js), tested by
tests/helperBoards.test.cjs.
