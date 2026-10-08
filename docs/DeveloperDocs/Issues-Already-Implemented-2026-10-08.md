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

## [#2043](https://github.com/wekan/wekan/issues/2043) Progress charts and work
statistics for each board

Board reports have ten charts - dashboard, burndown, burnup, cumulative flow,
control chart, cycle time, flow efficiency, lead time, throughput and WIP run
(client/components/boards/charts/, server/lib/boardChartData.js) - with PDF and
Excel export (models/server/ExporterChartPDF.js, ExporterChartExcel.js).

## [#2145](https://github.com/wekan/wekan/issues/2145) Mini date field

A custom field of type date is shown on the minicard as a compact date badge,
its label can be hidden (showLabelOnMiniCard), and the date formats include
date-only variants that drop the time (client/components/cards/cardDate.jade,
client/lib/dateDisplay.js).

## [#2148](https://github.com/wekan/wekan/issues/2148) Notification mail
template

Admin Panel / Settings / Email Templates customizes the subject and body of
invitation and activity emails, with {board} {card} {list} {username} {url}
{comment} {action} variables escaped on the server
(client/components/settings/settingBody.jade, server/notifications/email.js).

## [#2211](https://github.com/wekan/wekan/issues/2211) Auth0: redirect to the
full-screen login page instead of a popup

Auth0 signs in through the OAuth2/OIDC service, whose login style can be
`redirect` (OAUTH2_LOGIN_STYLE, also in Admin Panel / People / OAuth2); with
OIDC_REDIRECTION_ENABLED=true the login page goes straight to the provider
(client/components/main/layouts.js, server/models/settings.js).

## [#2489](https://github.com/wekan/wekan/issues/2489) Common WIP limit for
several columns

Board WIP limit groups share one limit across several lists (wipLimitGroups in
models/boards.js, models/lib/wipLimitGroupDecision.js), set in the sidebar
popup, and the list headers highlight a group over its limit
(client/components/lists/listHeader.js).

## [#2796](https://github.com/wekan/wekan/issues/2796) All Boards: drag and
drop, and colour

Boards on All Boards are reordered by drag and drop into each user's own order
(client/components/boards/boardsList.js, models/lib/boardSortReorder.js,
sortBoardsForUser), boards have colours (boardChangeColorPopup), and the All
Boards table view lists boards as rows.

## [#4223](https://github.com/wekan/wekan/issues/4223) Master dashboard like
Kanboard's Bigboard plugin

The Bigboard board view shows several boards on one page
(client/components/boards/bigboardView.*, docs/Features/Board/Bigboard.md), and
cards can be dragged between boards in it.

## [#4250](https://github.com/wekan/wekan/issues/4250) Move a checklist from
one card to another card

The checklist menu has Move Checklist and Copy Checklist with a board /
swimlane / list / card picker (client/components/cards/checklists.jade,
checklists.js).

## [#4403](https://github.com/wekan/wekan/issues/4403) Restrict the WeKan port
to loopback

`snap set wekan bind-ip=127.0.0.1` makes WeKan listen on loopback only
(snap-src/bin/config, snap-src/bin/wekan-control export BIND_IP, which Meteor
honours); the bundle and Docker take the BIND_IP environment variable.

## [#2713](https://github.com/wekan/wekan/issues/2713) Edit rules; send a card by email

Both requests are built. A rule's trigger and actions are edited in place from
the rules list (Edit trigger and action, `rules.updateRule` in
server/rulesButton.js), keeping the rule's id. The send-email rule action can
include the card's details, custom fields, checklists, public comments and
live attachments, with access rechecked at send time; the 71 card fields are
inventoried in [Card-Email-Content-Audit.md](Card-Email-Content-Audit.md).
Delivery passes against a local SMTP server for filesystem and GridFS
attachments. Interoperability with live external mail providers was not
tested, as no real mail accounts were available.

## [#5050](https://github.com/wekan/wekan/issues/5050) Add all users to a board

The maintainer's answer on the issue - put the users in an organization or
team and give the board to it - is what WeKan does now. Admin Panel / People
selects every user on a page with the header checkbox and adds the selection
to a team in one step, and an organization gains new users automatically by
email domain (`orgAutoAddUsersWithDomainName`). With "propagate members to
boards" on the team or organization (server/propagateOrgTeamMembers.js), its
members become normal members of every board it is added to, and later
members join those boards too (#4593).
