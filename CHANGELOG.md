# Upcoming Wekan release

This release fixes the following bugs:

- [Snap: Use override-build instead of old deprecated
   prepare/build/install](https://github.com/wekan/wekan/commit/075ea1c43d827099e0030c750a4c156bd3340fed).

Thanks to GitHub user kyrofa for contributions.

# v0.86 2018-04-20 Wekan release

This release adds the following new features:

- Updated translations: German and Turkish;
- Updated Caddy to newest version for Snap.

Thanks to translators and Caddy developers.

# v0.85 2018-04-18 Wekan release

This release fixes the following bugs:

- [Fix Switch List/swimlane view only working with admin privileges](https://github.com/wekan/wekan/issues/1567);
- [Fix Wekan logo positioning](https://github.com/wekan/wekan/issues/1378);
- [Fix checklists items migration error "title is required"](https://github.com/wekan/wekan/issues/1576);
- [Removed paxctl alpine fix #1303 , because it did not work anymore, so Docker container
   did not build correctly](https://github.com/wekan/wekan/commit/ce659632174ba25ca9b5e85b053fde02fd9c3928);
- [Use curl to download 100% CPU fibers fixed node in snap, and remove paxctl from
   snap package](https://github.com/wekan/wekan/commit/179ff7a12457be1592f04e1bdc15a5bb4fe9d398).

Thanks to GitHub users andresmanelli, iwkse and xet7 for their contributions.

# v0.84 2018-04-16 Wekan release

This release adds the following new features:

- [Add Checklist Items REST API](https://github.com/wekan/wekan/commit/9eef5112dc1c1c30590d19fbfd2f615714112a3f).

and fixes the following bugs:

- [Fix Node Fibers 100% CPU issue](https://github.com/wekan/wekan/commit/e26a4824cfb119a15767c4827190a6b9ab65b904);
- [Plus button on a Swimlane row, always add an element on the first row](https://github.com/wekan/wekan/issues/1577);
- [Fix Checklist REST API](https://github.com/wekan/wekan/commit/9eef5112dc1c1c30590d19fbfd2f615714112a3f);
- [Fix Disabling "show cards count" not possible, now zero means disable](https://github.com/wekan/wekan/issues/1570);
- [Fix Checklist not copied when copied a card and Copy Checklist Template to Many Cards](https://github.com/wekan/wekan/issues/1565);
- [Fix Filter cards hides checklist items](https://github.com/wekan/wekan/issues/1561).

Thanks to GitHub users andresmanelli, kentonv and xet7 for their contributions.

# v0.83 2018-04-12 Wekan release

- Updated translations: Czech and French.

Thanks to translators!

# v0.82 2018-04-11 Wekan release

- [Restore original font and font sizes. Admin panel people and version texts
  to darker](https://github.com/wekan/wekan/commit/db74c86e555f45a5aaaef84d2f3d4128cec77782).

Thanks to GitHub users apn3a and xet7 for their contributions.

# v0.81 2018-04-10 Wekan release

This release adds the following new features:

- [Removed checkbox from checklist name to have more of material design look](https://github.com/wekan/wekan/issues/1568);
- [Renamed Archives to Recycle Bin](https://github.com/wekan/wekan/issues/1429);
- [Separate translations for cards in Recycle Bin and cards count](https://github.com/wekan/wekan/commit/49c7a6c223061b9c1769143fea32fecc7d0f3c3e);
- [Use lighter and smaller font sizes](https://github.com/wekan/wekan/commit/7b94b0470198bc22b6a52db6661f35076f7c6388);
- [Board title as markdown in board view](https://github.com/wekan/wekan/commit/7b94b0470198bc22b6a52db6661f35076f7c6388).

and fixes the following bugs:

- [Removed forcing "cards" translations to lowercase in count of cards](https://github.com/wekan/wekan/issues/1571).

Thanks to GitHub users BruceZCQ, Chartman123, quantazelle and xet7 for their contributions.

# v0.80 2018-04-04 Wekan release

This release adds the following new features:

- [Changed icon of checklist name to unchecked](https://github.com/wekan/wekan/pull/1559/commits/f9539aa2a8d806e5a158d1c32f74788d051d40cb);
- [Added meteor packages](https://github.com/wekan/wekan/commit/40d438a517f0d807894e04873358aecf44fa7c4d)
  for security: [browser-policy](https://atmospherejs.com/meteor/browser-policy) and
  [eluck:accounts-lockout](https://atmospherejs.com/eluck/accounts-lockout).

Thanks to GitHub users quantazelle and xet7 for their contributions.

# v0.79 2018-03-31 Wekan release

This release adds the following new features:

- [Checklist items sort fix, and checklist sort capability](https://github.com/wekan/wekan/pull/1543);
- [Add Received Date and End Date. Between them is already existing Start and Due Date](https://github.com/wekan/wekan/pull/1550).

and fixes the following bugs:

- [Fix drag in lists view](https://github.com/wekan/wekan/pull/1559/commits/679e50af6449a680f958256570e8b9f1944a3a92);
- [Set fixed width for swimlane header](https://github.com/wekan/wekan/pull/1559/commits/2e8f8924dd0d985ae4634450cfbef04e88e5d954).

Thanks to GitHub users andresmanelli, rjevnikar and xet7 for their contributions.

# v0.78 2018-03-17 Wekan release

This release adds the following new features:

- [Allow swimlanes reordering](https://github.com/wekan/wekan/commit/37c94622e476f50bf2387bc8b140454d66200e78);
- [Import missing card fields: isOvertime, startAt and spentTime](https://github.com/wekan/wekan/commit/b475127c53031fa498da139a7d16f3e54d43b90d);
- [Lists view is the default view when creating boards](https://github.com/wekan/wekan/commit/1ca9e96f35389c0eec2290e8e1207801ee25f907);
- [Enabled import at Sandtorm. Keep there big DANGER warning about data loss bug.](https://github.com/wekan/wekan/commit/22923d08af4f1a63ded1d92fe6918436b598592b);
- [Add language: Armenian](https://github.com/wekan/wekan/commit/75693d16e2a0f3d201c1036ab06e6d40eb1c0adc).

and fixes the following bugs:

- [Fix lint errors related to sandstorm](https://github.com/wekan/wekan/commit/0a16147470246c8f49bb918f5ddc7bb2e54fba14);
- [Add Swimlanes to globals](https://github.com/wekan/wekan/commit/373e9782dcf87a9c1169b5d1f8175ce14e4898c9);
- [Fix lint errors related to trello creator](https://github.com/wekan/wekan/commit/951a0db380d60f3d948ae38d50b85a54983a51de);
- [Fix lint errors related to language names](https://github.com/wekan/wekan/commit/c0d33d97f2c8d4e9371a03d4ad3022df3ed64d3d);
- [Avoid swimlane title overlap](https://github.com/wekan/wekan/commit/c4fa9010f34966b633c7bf7e46ad49fc101127c9);
- [Fix scrollbar inside list and outer scroll](https://github.com/wekan/wekan/commit/a033c35a3411902b9bf8f62a40cd68f641e573d3);
- [Remove list max-height 350px](https://github.com/wekan/wekan/commit/b6d3e79548d1e88c93fa2965a936595176a95565);
- [Snap: Adding network hooks for configure hook to fix security denials](https://github.com/wekan/wekan/commit/9084158aece8a642dc49bf7ecc2196bf9d1af63e);
- [Snap: Fixing problem when mongodb was not started at install/refresh](https://github.com/wekan/wekan/commit/1be8e5625fd20797910009a8221ca706fd52ab11);
- [Fix Add Card Button dissapearing when dragging](https://github.com/wekan/wekan/commit/58e5e9b308113e5a8af5166328a68a0aafcc2558);
- [Fix Scrollbar near top of screen when using internet explorer on Win7](https://github.com/wekan/wekan/commit/128a356b9222fa0ed824b477c2d0e1e6a0368021);
- [Fix scroll when dragging elements. Remove scrollbars from swimlanes.](https://github.com/wekan/wekan/commit/ed8471be9b79243b016a275e5b11a6912717fbb9);
- [Partial fix for scroll bar inside cardDetails](https://github.com/wekan/wekan/commit/ac7d44f8a8d809cd94ed5ef3640473f34c72403b);
- [Fix swimlane header rotation on Google Chrome. After this change both Firefox 58 and Google Chrome 64
   have properly rotated swimlane header.](https://github.com/wekan/wekan/commit/9a1b1a5bedbe44827de109731a3c3b1a07790d3e);
- [Fix card copy and move with swimlanes](https://github.com/wekan/wekan/commit/4b53b0c90a57593c0fe2d808d2298e85f488bfa9).
- [Fix scroll board when opening cardDetails](https://github.com/wekan/wekan/commit/454523dd4744b2bccb6805dad59abd664fdacb31);
- [Fix swimlane info not displayed in activities](https://github.com/wekan/wekan/commit/bb37d8fa964c0d03721a664387e74300fde09eef);
- [Fix sandstorm default swimlane creation](https://github.com/wekan/wekan/commit/f470323ee746c4e79f07d166d511867408194eb6);
- [Extend lists to bottom of frame in lists view](https://github.com/wekan/wekan/commit/c62a2ee11febf7f98456c97dc3973509b4bfe119);
- [Fix drag and drop issues when re-enter board](https://github.com/wekan/wekan/commit/5b0f7f8aef115b202aaff6bc25bb514426dc2009).

Thanks to GitHub users andresmanelli, GhassenRjab, kubiko, lumatijev, lunatic4ever and xet7 for their contributions.

# v0.77 2018-02-23 Wekan release

This release adds the following new features:

- [Search from card titles and descriptions on this board](https://github.com/wekan/wekan/pull/1503).
- Add Bulgarian language.

and adds the following [Snap updates](https://github.com/wekan/wekan/pull/1495):

- Cleanup of snap helper scripts
- Cleanup and snapctl settings handling
- Fix for snap store auto review refusal
- Adding support for automatic restart of services when setting(s) are changed.
  No need to call systemctl restart anymore
- Fixing snap set functionality
- Adding optional caddy service support (by default caddy service is disabled),
  it can be enabled by calling: snap set wekan caddy-enabled=true
- [Service life cycle improvements](https://github.com/wekan/wekan/pull/1495)
- [Wekan help text changes and tweaks](https://github.com/wekan/wekan/pull/1495).

and fixes the following bugs:

- [Fix: card-shadow no longer covered the page if you scroll down](https://github.com/wekan/wekan/pull/1496).

Thanks to GitHub users GhassenRjab, kubiko and stefano-pogliani for their contributions.

# v0.76 2018-02-21 Wekan release

This release adds the following new features:

- [Add swimlaneId to POST /api/boards/:boardId/lists/:listId/cards route](https://github.com/wekan/wekan/commit/ee0f42eeb1b10107bd8fc38cdefbdbc4f3fde108);
- [Added path to capnp.js to make Wekan work on Sandstorm](https://github.com/wekan/wekan/commit/11e9811f82858a3d98036e142b0da69d867adebc).

Known bugs:

- [Disabled Import temporarily on Sandstorm because of data loss bug](https://github.com/wekan/wekan/commit/e30f6515c623de7a48f25e0b2fc75313ae5d187c);
- [Swimlane not visible at Sandstorm](https://github.com/wekan/wekan/issues/1494).

Thanks to GitHub users couscous3 and xet7 for their contributions.

# v0.75 2018-02-16 Wekan release

This release adds the following new features:

- [Checklist templates](https://github.com/wekan/wekan/pull/1470);
- Added [Finnish language changelog](https://github.com/wekan/wekan/tree/devel/meta/t9n-changelog)
  and [more Finnish traslations](https://github.com/wekan/wekan/blob/devel/sandstorm-pkgdef.capnp)
  to Sandstorm.

Thanks to GitHub users erikturk and xet7 for their contributions.

# v0.74 2018-02-13 Wekan release

This release fixes the following bugs:

- [Remove Emoji support, so MAC addresses etc show correctly](https://github.com/wekan/wekan/commit/056843d66c361594d5d4478cfe86e2e405333b91).
  NOTE: You can still add Unicode Emojis, this only removes broken autoconversion to Emojis.

Thanks to GitHub user xet7 for contributions.

# v0.73 2018-02-08 Wekan release

This release fixes the following bugs:

- [Fix Ubuntu snap build](https://github.com/wekan/wekan/pull/1469).

Thanks to GitHub user kubiko for contributions.

# v0.72 2018-02-07 Wekan release

This release fixes the following bugs:

- [Fix card sorting](https://github.com/wekan/wekan/pull/1465);
- [Fix import Trello board without swimlanes](https://github.com/wekan/wekan/commit/5871a478e1280818f12fcb7250b7cbccf6907cf0);
- [Fix swimlane move parameters](https://github.com/wekan/wekan/commit/fcebb2a5373d6dea41b98b530c176cbee31bee4b).

Thanks to GitHub users andresmanelli and ViViDboarder for their contributions.

# v0.71 2018-02-03 Wekan release

This release fixes the following bugs:

- [Fix Welcome board is not editable: Added default swimlane to Welcome board](https://github.com/wekan/wekan/commit/9df3e3d26bffb2268cdcc7fa768eda60e4f0975c);
- [Fix Import Wekan board with swimlanes](https://github.com/wekan/wekan/commit/ec0a8449ba98aea708e484d386e5a209e2be8fff).

Thanks to GitHub user andresmanelli for contributions.

# v0.70 2018-02-02 Wekan release

This release adds the following new features:

- [Add ability to edit swimlane name](https://github.com/wekan/wekan/commit/3414cb84ad8ac800e23bbda6ce12822f40d1bd19);
- [Add swimlane popup menu and archive icon](https://github.com/wekan/wekan/commit/5953fb8a44a3582ed0d8816ffb32a5b7f41f50a3).

and fixes the following bugs:

- [Two empty columns in swimlane view](https://github.com/wekan/wekan/issues/1459).

Thanks to GitHub user andresmanelli for contributions.

# v0.69 2018-02-01 Wekan release

This release fixes the following bugs:

- [Fix swimlanes card details bug](https://github.com/wekan/wekan/commit/f6fb05d3f49c656e9890351f5d7c0827bf2605c1);
- [Workaround to avoid swimlanes drag bug](https://github.com/wekan/wekan/commit/d3c110cd8f3ad16a4ced5520c27ab542cc79b548);
- [Fix swimlanes details view in lists only mode](https://github.com/wekan/wekan/commit/ff9ca755f338e3c45a1bd726dfbce1c607f2ff4c).
- [Fix typo in issue template](https://github.com/wekan/wekan/pull/1451).

Thanks to GitHub users andresmanelli and d-Rickyy-b for their contributions.

# v0.68 2018-01-30 Wekan release

This release fixes the following bugs:

* [Partial fix: Trello board import fails because of missing "Swimlane id"](https://github.com/wekan/wekan/issues/1442), still needs some work.

Thanks to GitHub user xet7 for contributions.

# v0.67 2018-01-28 Wekan release

This release fixes the following bugs:

* [Fix Igbo language name at menu](https://github.com/wekan/wekan/commit/9d7ff75d3fed1285273245fbe6f6a757b6180039).

Thanks to GitHub user xet7 for contributions.

# v0.66 2018-01-28 Wekan release

This release fixes the following bugs:

* [Fix Dockerfile for Debian](https://github.com/wekan/wekan/pull/1439).

Thanks to GitHub user soohwa for contributions.

# v0.65 2018-01-28 Wekan release

This release adds the following new features:

* [Swimlanes, part 1](https://github.com/wekan/wekan/issues/955);
* Added new language: Igbo.

Thanks to GitHub user andresmanelli for contributions.

# v0.64 2018-01-22 Wekan release

This release adds the following new features:

* [Different icons for start and due date](https://github.com/wekan/wekan/pull/1420).
* Added new languages: Mongolian and Portuguese;
* Upgraded to Meteor 1.6.0.1, Node 8.9.3, NPM 5.5.1 and fibers 2.0.0.

and fixes the following bugs:

* [Fix for dragging into scrolled-down list](https://github.com/wekan/wekan/pull/1424).
* [Fix double slash bug on snap](https://github.com/wekan/wekan/issues/962#issuecomment-357785748).

Thanks to GitHub users dpoznyak, mmarschall and xet7 for their contributions.

# v0.63 2017-12-20 Wekan release

This release adds the following new features:

* [Auto update card cover with new image uploaded via drag&drop](https://github.com/wekan/wekan/pull/1401);
* Update to Node 4.8.7.

Thanks to GitHub users thuanpq and xet7 for their contributions.

# v0.62 2017-12-12 Wekan release

This release fixes the following bugs:

* Added missing packages to build script.

Thanks to GitHub user xet7 for contributions.

# v0.61 2017-12-12 Wekan release

This release adds the following new features:

* [Change password of any user in Standalone Wekan Admin Panel](https://github.com/wekan/wekan/pull/1372);
* [Performance optimization: Move more global subscriptions to template subscription](https://github.com/wekan/wekan/pull/1373);
* [Auto update card cover with latest uploaded image attachment](https://github.com/wekan/wekan/pull/1387);
* [Always display attachment section for uploading file quickly](https://github.com/wekan/wekan/pull/1391);
* [Make it easier to see the Add Card button at top of list](https://github.com/wekan/wekan/pull/1392);
* [Add mixmax:smart-disconnect to lower CPU usage when browser tab is not selected](https://github.com/wekan/wekan-mongodb/issues/2);
* Update tranlations. Add Latvian language;
* Update to Node 4.8.6 and MongoDB 3.2.18.

and fixes the following bugs:

* [Bug on not being able to see Admin Panel if not having access to Board List](https://github.com/wekan/wekan/pull/1371);
* [Bug on not able to see member avatar on sidebar activity](https://github.com/wekan/wekan/pull/1380);
* [Don't open swipebox on update card cover / download file / delete file](https://github.com/wekan/wekan/pull/1386);
* [Boards subscription should be placed at header for all other component can be used](https://github.com/wekan/wekan/pull/1381);
* [Bug on long url of attachment in card activity log](https://github.com/wekan/wekan/pull/1388).

Thanks to GitHub users mfshiu, thuanpq and xet7 for their contributions.
Thanks to translators for their translations.

# v0.60 2017-11-29 Wekan release

This release adds the following new features:

* [Add SMTP test email button to Standalone Wekan Admin Panel](https://github.com/wekan/wekan/pull/1359);
* [Optimize for mobile web, show single list per page with navigate bar](https://github.com/wekan/wekan/pull/1365).

and fixes the following bugs:

* [User with comment only permissions can remove another user from a card](https://github.com/wekan/wekan/pull/1352);
* [Frequent Subscriptions problem that make Excessive CPU usage](https://github.com/wekan/wekan/pull/1363).

Thanks to GitHub users floatinghotpot, mfshiu and nztqa for their contributions.

# v0.59 2017-11-23 Wekan release.

This release fixes the following bugs:

* [Remove incomplete logger fix](https://github.com/wekan/wekan/pull/1352).

Thanks to GitHub user pierreozoux for contributions.

# v0.58 2017-11-23 Wekan release

This release adds the following new features:

* Updated translations.

Thanks to all translators.

# v0.57 2017-11-23 Wekan release

This release adds the following new features:

* [Gogs Integration](https://github.com/wekan/wekan-gogs) as separate project. Please test and submit issues and pull requests to that project.

and fixes the following bugs:

* [Fix Winston logger](https://github.com/wekan/wekan/pull/1350).

Thanks to GitHub users andresmanelli and pierreozoux for their contributions.

# v0.56 2017-11-21 Wekan release

This release adds the following new features:

* [Copy/Move cards to other board in Standalone Wekan](https://github.com/wekan/wekan/pull/1330);
* [Spent time/Overtime on card](https://github.com/wekan/wekan/pull/1344);
* New translation: Greek.

and fixes the following bugs:

* [Board list with long-description boards not visible](https://github.com/wekan/wekan/pull/1346);
* [Remove erroneous minicard title whitespace](https://github.com/wekan/wekan/pull/1347);
* [Fix title editing with shift key at card details](https://github.com/wekan/wekan/pull/1348).

Thanks to GitHub users couscous3, GhassenRjab, thuanpq and xet7 for their contributions.

# v0.55 2017-11-19 Wekan release

This release adds the following new features:

* [Markdown in card/minicard/checlist titles and checklist items. Next line: Shift+Enter. Submit: Enter.](https://github.com/wekan/wekan/pull/1334);
* [User Admin to Admin Panel: List users. Change: is user admin, name, fullname, email address, is user active. Not changing password yet.](https://github.com/wekan/wekan/pull/1325);
* [REST API better error output](https://github.com/wekan/wekan/pull/1323).

and fixes the following bugs:

* [Emoji detection breaks MAC addresses](https://github.com/wekan/wekan/issues/1248); - this has not yet fixed all cases.
* [Codeblocks should not be scanned for emoji](https://github.com/wekan/wekan/issues/643);
* [Whitespace trimming breaks Markdown code block indentation](https://github.com/wekan/wekan/issues/1288):
* [Helper to list boards for user](https://github.com/wekan/wekan/pull/1327);
* [Error after sending invitation and joining board: Exception while invoking method 'login' TypeError: Cannot read property 'loginDisabled' of undefined](https://github.com/wekan/wekan/issues/1331);
* [Invitation /sign-up page did not show input for invitation code](https://github.com/wekan/wekan/commit/99be745f0299b32a8a7b30204b43bff7fd5ba638).

Thanks to Github users brooksbecton, milesibastos, nztqa, soohwa, thuanpq and xet7 for their contributions.

# v0.54 2017-11-02 Wekan release

This release adds the following new features:

* [Soft WIP Limit](https://github.com/wekan/wekan/pull/1319).

Thanks to GitHub users amadilsons and xet7 for their contributions.

# v0.53 2017-11-02 Wekan release

(This was canceled, it had some missing version numbers).

# v0.52 2017-10-31 Wekan release

This release adds the following new features:

* [Permit editing WIP limit](https://github.com/wekan/wekan/pull/1312);
* [Image attachment resize on smaller screens and swipebox](https://github.com/wekan/wekan/pull/1315);
* [Add iPhone favicon for Wekan](https://github.com/wekan/wekan/issues/1317).

and fixes the following bugs:

* [Members do not get included on board import from Wekan](https://github.com/wekan/wekan/pull/1316).

Thanks to GitHub users brooksbecton, guillaumebriday, nztqa, ocdtrekkie and Tentoe for their contributions.

# v0.51 2017-10-25 Wekan release

This release adds the following new features:

* [REST API: Disable and enable user login. Take ownership boards of a user. List boards of user.](https://github.com/wekan/wekan/pull/1296);
* [Add translation: Spanish of Argentina](https://github.com/wekan/wekan/commit/b105f0e2e72c49a2f1ba3f6c87532a5418192386);
* [Add more languages to Roboto font](https://github.com/wekan/wekan/issues/1299).

and fixes the following bugs:

* [Segfault on Alpine Linux](https://github.com/wekan/wekan/issues/1303);
* [Change invitation link from sign-in to sign-up](https://github.com/wekan/wekan/issues/1300);
* [User with comment only permission can add cards](https://github.com/wekan/wekan/issues/1301).

Thanks to GitHub users chromas-cro, soohwa, wenerme and xet7 for their contributions.

# v0.50 2017-10-10 Wekan release

This release fixes the following bugs:

* [Fix and update translations](https://github.com/wekan/wekan/issues/1286).

Thanks to GitHub user xet7 for contributions.

# v0.49 2017-10-09 Wekan release

This release fixes the following bugs:

* [When WIP limit in use, hide also add card + button at top of list](https://github.com/wekan/wekan/commit/a5daf5dc29278b82e133fbe4db09a91ffc0c0d3b).

Thanks to GitHub user xet7 for contributions.

# v0.48 2017-10-09 Wekan release

This release adds the following new features:

* [WIP Limits](https://github.com/wekan/wekan/pull/1278);
* [REST API: Create user despite disabling registration](https://github.com/wekan/wekan/issues/1232);
* [User can leave board on Standalone Wekan](https://github.com/wekan/wekan/pull/1283).

and fixes the following bugs:

* [Admin announcement can be viewed without signing in](https://github.com/wekan/wekan/issues/1281).

Thanks to GitHub users amadilsons, nztqa and soohwa for their contributions.

# v0.47 2017-10-04 Wekan release

This release adds the following new features:

* [Use theme color for Slider for Comments only](https://github.com/wekan/wekan/pull/1275).

Thanks to GitHub user nztqa for contributions.

# v0.46 2017-10-03 Wekan release

This release adds the following new features:

* [Webhook parameters and response order](https://github.com/wekan/wekan/pull/1263).

and fixes the following bugs:

* SECURITY FIX: [Meteor allow/deny](https://blog.meteor.com/meteor-allow-deny-vulnerability-disclosure-baf398f47b25) fixed
  [here](https://github.com/wekan/wekan/commit/c3804dc0fad0817285460d86dc1b3bdc96361f49);
* [Fix: Slider for Comments only does not work correctly with over 21 activities](https://github.com/wekan/wekan/pull/1247).

Thanks to GitHub users andresmanelli and nztqa for their contributions.

# v0.45 2017-10-01 Wekan release

This release adds the following new features:

* [Slider for Comments only in activity feed](https://github.com/wekan/wekan/issues/1247);
* [Site Wide Announcement](https://github.com/wekan/wekan/pull/1260).

and fixes the following bugs:

* [Data inconsistency when copying card](https://github.com/wekan/wekan/pull/1246). Note: There is no feature for copying card attachment yet;
* [Hide create label from normal users, because only board admin can create labels](https://github.com/wekan/wekan/pull/1261).

Thanks to GitHub user nztqa for contributions.

# v0.44 2017-09-30 Wekan release

This release adds the following new features:

* [Confirm popup appears before Checklist Delete](https://github.com/wekan/wekan/pull/1257).

and fixes the following bugs:

* [Fix errors when importing from Trello](https://github.com/wekan/wekan/pull/1259).

Thanks to GitHub users amadilsons and GhassenRjab for their contributions.

# v0.43 2017-09-25 Wekan release

This release fixes the following bugs:

* [Add emojis back, because removing them broke local dev Sandstorm](https://github.com/wekan/wekan/issues/1248).

Thanks to GitHub user xet7 for contributions.

# v0.42 2017-09-25 Wekan release

This release fixes the following bugs:

* [Remove emoji support, because it breaks MAC addresses, urls, code etc](https://github.com/wekan/wekan/issues/1248).

Thanks to GitHub user xet7 for contributions.

# v0.41 2017-09-25 Wekan release

This release fixes the following bugs:

* [Can't create user and login after install. Reverting REST API: Create user despite disabling registration](https://github.com/wekan/wekan/issues/1249).

Thanks to GitHub user xet7 for contributions.

# v0.40 2017-09-25 Wekan release

This release adds the following new features:

* [Add translations (en/de/fi) for email notifications regarding checklists and checklist
   items](https://github.com/wekan/wekan/pull/1238);
* [Added plus button to add card on top of the list](https://github.com/wekan/wekan/pull/1244);
* [REST API: Create user despite disabling registration](https://github.com/wekan/wekan/issues/1232).

and fixes the following bugs:

* [Checklist items are lost when moving items to another checklist](https://github.com/wekan/wekan/pull/1240);
* [Keep state of checklist items when moved to another checklist](https://github.com/wekan/wekan/pull/1242).

Thanks to GitHub users GhassenRjab, mario-orlicky, soohwa, umbertooo and xet7 for their contributions.

# v0.39 2017-09-18 Wekan release

This release adds the following new features:

* [Import checklist sort attributes from Wekan and Trello](https://github.com/wekan/wekan/pull/1226).

Thanks to GitHub user GhassenRjab for contributions.

# v0.38 2017-09-14 Wekan release

This release adds the following new features:

* [Reorder checklists. Move checklist item to another checklist.](https://github.com/wekan/wekan/pull/1215);
* [Card title is now pre-filled in copy card dialog](https://github.com/wekan/wekan/pull/1214).

Thanks to GitHub user frmwrk123 for contributions.

# v0.37 2017-09-09 Wekan release

This release adds the following new features:

* [Copy card within one board](https://github.com/wekan/wekan/pull/1204).

Thanks to GitHub user frmwrk123 for contributions.

# v0.36 2017-09-02 Wekan release

This release adds the following new features:

* [Import attachments related activities from Wekan and
   Trello](https://github.com/wekan/wekan/pull/1202).

Thanks to GitHub user GhassenRjab for contributions.

# v0.35 2017-09-02 Wekan release

This release adds the following new features:

* [Add more than one Outgoing Webhook](https://github.com/wekan/wekan/pull/1199).

and fixes the following bugs:

* [Fix errors caused by checklist items activities](https://github.com/wekan/wekan/pull/1200).

Thanks to GitHub users andresmanelli, GhassenRjab and nztqa for contributions.

# v0.34 2017-08-30 Wekan release

This release adds the following new features:

* [Import Trello and Wekan board times of creation of activities](https://github.com/wekan/wekan/pull/1187);
* Newest Wekan is available at Sandstorm App Market.

Known issues:

* [Attachment creation times are not imported to Trello and Wekan](https://github.com/wekan/wekan/issues/1157).
  - This is fixed in v0.36.

Thanks to GitHub user GhassenRjab for contributions.

# v0.33 2017-08-29 Wekan release

This release adds the following new features:

* [Add Bounties and Commercial Support to wiki](https://github.com/wekan/wekan/wiki);
* [Add display Wekan version number and runtime
   environment to Admin Panel](https://github.com/wekan/wekan/pull/1156);
* [Change Email address](https://github.com/wekan/wekan/pull/1161);
* [Ubuntu snap: Use version scriptlet](https://github.com/wekan/wekan/pull/1164);
* [Gogs integration part 1](https://github.com/wekan/wekan/pull/1189);
* [Add web manifest so Wekan can be used like standalone app on Desktop
   with Chrome or Firefox](https://github.com/wekan/wekan/pull/1184);
* [Copy card link to clipboard](https://github.com/wekan/wekan/issues/1188);
* [Usernames can now include dots (.)](https://github.com/wekan/wekan/pull/1194).

and fixes the following bugs:

* [Fix Squeezed tickbox in Card](https://github.com/wekan/wekan/pull/1171);
* [Percent-encode SMTP password to prevent URI malformed
   errors](https://github.com/wekan/wekan/pull/1190);
* [Fix Wekan Import Export on Standalone and Sandstorm](https://github.com/wekan/wekan/pull/1197).

Thanks to GitHub users andresmanelli, danhawkes, GhassenRjab, jonasob, kubiko, nztqa,
pkuhner and xet7 for their contributions.

# v0.32 2017-07-30 Wekan release

This release adds the following new features:

* [Add dwrensha's Sandstorm patch to Wekan so it does not need to be maintained
   separately](https://github.com/wekan/wekan/commit/bda15daa78556223117a5846941aafd1212f14d3).

and fixes the following bugs:

* [FIX SECURITY ISSUE Files accessible without authentication](https://github.com/wekan/wekan/issues/1105);
* [Fix showing card activity history in IE11](https://github.com/wekan/wekan/pull/1152).

Thanks to GitHub users dwrensha, GhassenRjab and nztqa for their contributions.

# v0.31 2017-07-30 Wekan release

* This was broken, having lint errors.

# v0.30 2017-07-27 Wekan release

SECURITY ISSUE [Files accessible without authentication](https://github.com/wekan/wekan/issues/1105)
IS NOT FIXED YET.

This release adds the following new features:

* [More screenshots at Features page](https://github.com/wekan/wekan/wiki/Features);
* [Export and import boards in Sandstorm](https://github.com/wekan/wekan/pull/1144);
* [GitHub Issue template](https://github.com/wekan/wekan/pull/1146);
* [Add checklist items to activity log](https://github.com/wekan/wekan/pull/1148).

and fixes the following bugs:

* [Double shashes on ROOT_URL](https://github.com/wekan/wekan/issues/962).

Thanks to GitHub users GhassenRjab, nztqa and xet7 for their contributions.

# v0.29 2017-07-21 Wekan release

SECURITY ISSUE [Files accessible without authentication](https://github.com/wekan/wekan/issues/1105)
IS NOT FIXED YET.

This release adds the following new features:

* [Export and import attachments as base64 encoded files](https://github.com/wekan/wekan/pull/1134);
* [Export and import checklists](https://github.com/wekan/wekan/pull/1140).

and fixes the following bugs:

* [Activity user messed up when creating a card using the REST-API](https://github.com/wekan/wekan/pull/1116).

Thanks to GitHub users GhassenRjab and zarnifoulette for their contributions.

# v0.28 2017-07-15 Wekan release

SECURITY ISSUE [Files accessible without authentication](https://github.com/wekan/wekan/issues/1105)
IS NOT FIXED YET.

This release adds the following new features:

* [REST API: Add PUT method to update a card](https://github.com/wekan/wekan/pull/1095) and
  [related fix](https://github.com/wekan/wekan/pull/1097);
* [When finished input of checklist item, open new checklist
  item](https://github.com/wekan/wekan/pull/1099);
* [Improve UI design of checklist items](https://github.com/wekan/wekan/pull/1108);
* [Import Wekan board](https://github.com/wekan/wekan/pull/1117);
* [Outgoing Webhooks](https://github.com/wekan/wekan/pull/1119);
* [Wekan wiki now has menu with categories](https://github.com/wekan/wekan/wiki).

and fixes the following bugs:

* [SECURITY: Upgrade Node.js, MongoDB and Debian on Docker and Ubuntu snap edge](https://github.com/wekan/wekan/pull/1132);
* [Possible to add empty item to checklist](https://github.com/wekan/wekan/pull/1107);
* [Double-slash issue](https://github.com/wekan/wekan/pull/1114);
* [Node.js crash when adding new user to board](https://github.com/wekan/wekan/issues/1131).

Thanks to GitHub users GhassenRjab, johnleeming, jtickle, nztqa, xet7 and zarnifoulette
for their contributions.

# v0.27 2017-06-28 Wekan release

This release adds the following new features:

* [Snapcraft build support from source](https://github.com/wekan/wekan/pull/1091).

and fixes the following bugs:

* [Fix incorrect attachment link with subfolder in the url](https://github.com/wekan/wekan/pull/1086);
* [Fix link to card](https://github.com/wekan/wekan/pull/1087);
* [Fix duplicate id generation](https://github.com/wekan/wekan/pull/1093).

Thanks to GitHub users kubiko and nztqa for their contributions.

# v0.26 2017-06-26 Wekan release

This release fixes the following bugs:

* [Fix admin panel route for subfolder](https://github.com/wekan/wekan/pull/1084);
* [Fix i18n route for subfolder](https://github.com/wekan/wekan/pull/1085).

Thanks to GitHub user nztqa for contributions.

# v0.25 2017-06-24 Wekan release

This release adds the following new features:

* [Import due date from Trello](https://github.com/wekan/wekan/pull/1082).

and fixes the following bugs:

* [Fix importing Trello board: Attribute correct members to their
   comments](https://github.com/wekan/wekan/pull/1080);
* [Fix Case-sensitive email handling](https://github.com/wekan/wekan/issues/675);
* [Use fibers 1.0.15 because 2.0.0 is broken](https://github.com/wekan/wekan/commit/86e2744c24149c0eacf725b68a186d0bcfae5100);
* [Remove git submodules, so that git clone of Wekan repo works now on Windows](https://github.com/wekan/wekan/issues/977).

Thanks to GitHub users GhassenRjab, nztqa and xet7 for their contributions.

# v0.24 2017-06-21 Wekan release

This release adds the following new features:

* [Change the way to delete a list (card-like)](https://github.com/wekan/wekan/pull/1050), fixes
  [missing undo button](https://github.com/wekan/wekan/issues/1023);
* [When deleting list, delete list's cards too](https://github.com/wekan/wekan/pull/1054);
* [Re-enable Export Wekan Board](https://github.com/wekan/wekan/pull/1059);
* [Sort languages by their translated names](https://github.com/wekan/wekan/pull/1070);
* [Add Breton language name](https://github.com/wekan/wekan/pull/1071).

and fixes the following bugs:

* [Fix Admin Panel link available to all users, only link is hidden](https://github.com/wekan/wekan/pull/1076);
* [Fix IE 11 drag board to scroll](https://github.com/wekan/wekan/pull/1052);
* [Fix Export Wekan board](https://github.com/wekan/wekan/pull/1067);
* [Fix "W" shortcut binding](https://github.com/wekan/wekan/pull/1066);
* [Fix login url in invitation email](https://github.com/wekan/wekan/issues/993);
* [Edit card description with invalid markdown](https://github.com/wekan/wekan/pull/1073);
* [Fix filter reset on moving between starred boards](https://github.com/wekan/wekan/pull/1074).

Thanks to GitHub users BaobabCoder, GhassenRjab, nebulade, nztqa and xet7
for their contributions.

# v0.23 2017-05-21 Wekan release

This release adds the following new features:

* [Add checklist and card comment to REST API](https://github.com/wekan/wekan/pull/1033);
* [Add token authentication to REST API](https://github.com/wekan/wekan/pull/1033), this fixes
  [Security flaws introduced by REST API](https://github.com/wekan/wekan/issues/1032);
* [Authorization improvements etc to REST API](https://github.com/wekan/wekan/pull/1041);
* [IE 11 support in unicode filename downloads](https://github.com/wekan/wekan/issues/1031).

and fixes the following bugs:

* [When Wekan starts, there's "here1 false" messages in
  console](https://github.com/wekan/wekan/issues/1028);
* [IE11 problem when closing cards, sidebar etc](https://github.com/wekan/wekan/pull/1042).

Thanks to GitHub users huneau, mayjs and nztqa for their contributions.

# v0.22 2017-05-07 Wekan release

This release fixes the following bugs:

* [Download file(unicode filename) cause crash with exception](https://github.com/wekan/wekan/issues/784)

Thanks to GitHub user yatusiter for contributions.

# v0.21 2017-05-07 Wekan release

Known bugs:

* https://github.com/wekan/wekan/issues/784

This release fixes the following bugs:

* Update release version number to package.json.

Thanks to GitHub user xet7 for contributions.

# v0.20 2017-05-07 Wekan release

Known bugs:

* https://github.com/wekan/wekan/issues/784

This release fixes the following bugs:

* Docker images missing latest Debian updates.

Thanks to GitHub user xet7 for contributions.

# v0.19 2017-05-06 Wekan release

Known bugs:

* https://github.com/wekan/wekan/issues/784

This release adds the following new features:

* Set first user as admin, it there is no existing
  users and Wekan is not running at Sandstorm;
* New Docker Compose [Wekan-MongoDB](https://github.com/wekan/wekan-mongodb)
  and [Wekan-PostgreSQL](https://github.com/wekan/wekan-postgresql)
  that use Meteor v1.4 and Node v4 based Wekan's meteor-1.4 branch;
* [Console, file, and zulip logger on database changes](https://github.com/wekan/wekan/pull/1010);
* [REST API first step](https://github.com/wekan/wekan/pull/1003);
* [Install from source](https://github.com/wekan/wekan/wiki/Install-and-Update#install-manually-from-source)
  has been updated to new meteor 1.4 version;
* meteor-1.4 branch has been merged to devel and master branches,
  where development continues from now on. Previous code has been moved to
  meteor-1.3-2017-04-27 branch;
* [VirtualBox image updated](https://wekan.xet7.org).

and fixes the following bugs:

* isCommentOnly false fix for Trello import;
* Node version to 4.8.1 to solve 100% CPU issue;
* Fix bson error on Docker and install from source;
* Try other key servers on Dockerfile if ha.pool.sks-keyservers.net is unreachable.

Thanks to GitHub users brylie, huneau, johnniesong, rhelsing, stephenmoloney,
xet7 and Zokormazo for contributions.

# v0.18 2017-04-02 Wekan release

Known bugs:

* https://github.com/wekan/wekan/issues/784

This release adds the following new features:

* Add TLS toggle option to smtp configuration;
* [Comment permissions](https://github.com/wekan/wekan/issues/870);
* Add bigger screenshots for Sandstorm.

and fixes the following bugs:

* Fix email settings loading:
  MAIL_URL was overriden with database info all the time.
  Now if MAIL_URL exists is not overwritten and if neither MAIL_URL nor
  exists valid admin panel data MAIL_URL is not set.
  MAIL_FROM was ignored. Same behaviour, env variable has bigger priority
  than database configuration.
  On both cases, althought environment variable is set, updating admin-panel
  mail settings will load new info and ignore the environment variable;
* Dockerfile fix for local packages;
* Don't send emails if missing smtp host;
* Remove invitation code if email sending failed;
* Show customized error msg while invitation code is wrong during registration;
* Fix "internal error" while registration is done;
* Fix "cannot access disableRegistration of undefined" error;
* Add high available server for getting the gpg keys - suppose it should lead
  to fewer failures on getting the gpg keys leading to some rare build failures;
* Add a docker build to the .travis.yml - this will help determine if pull
  requests need further review before merging into devel;
* Use navigator language by default instead of English.

Thanks to GitHub users JamborJan, lkisme, rhelsing, Serubin, stephenmoloney,
umbertooo and Zokormazo for their contributions.

# v0.17 2017-03-25 Wekan release

Known bugs:

* https://github.com/wekan/wekan/issues/784

This release fixes the following bugs:

* Double slash problem on card pop-ups;
* No need for Array.prototype if using rest operator;
* Fix default font so Chinese is shown correctly.
  Still looking for better solution for #914 although
  commit had wrong number #707.

Thanks to GitHub users mo-han, Serubin and vuxor for
their contributions.

# v0.16 2017-03-15 Wekan release

Added missing changelog updates.

# v0.15 2017-03-15 Wekan release

Updated translations.

# v0.14 2017-03-15 Wekan release

Known bugs:

* https://github.com/wekan/wekan/issues/785
* https://github.com/wekan/wekan/issues/784

This release fixes the following bug:

* Set IE compatibility mode to Edge to so that
  Wekan board loads correctly.

Thanks to GitHub users immertroll and REJack for
their contributions.

# v0.13 2017-03-12 Wekan release

Known bugs:

* https://github.com/wekan/wekan/issues/785
* https://github.com/wekan/wekan/issues/784

This release fixes the following bug:

* Admin Panel: Set mail-from to environment immediately after changed,
  allow user set a blank username and password pair in SMTP setting.

Thanks to GitHub user lkisme for contributions.

# v0.12 2017-03-05 Wekan release

Known bugs:

* https://github.com/wekan/wekan/issues/785
* https://github.com/wekan/wekan/issues/784

This release adds the following new features:

* Import Checklists from Trello;
* Simplified release numbers of Wekan.

Thanks to GitHub users whodafly and xet7 for
their contributions.

# v0.11.1-rc2 2017-03-05 Wekan prerelease

Known bugs:

* https://github.com/wekan/wekan/issues/785
* https://github.com/wekan/wekan/issues/784

This release adds the following supported platforms:

* [Docker environment for Wekan development](https://github.com/wekan/wekan-dev);
* [Wekan <=> MongoDB <=> ToroDB => PostgreSQL read-only
  mirroring](https://github.com/wekan/wekan-postgresql)
  for SQL access with any programming language
  or Office package that has PostgreSQL support, like
  newest LibreOffice 3.5;
* [Install from source on
  Windows](https://github.com/wekan/wekan/wiki/Install-Wekan-from-source-on-Windows).

and adds the following new features:

* Admin Panel:
```
  1) Disable Self-Registration and invite users
  2) SMTP settings.

  Adding Admin user in mongo cli:
  1) Use database that has wekan data, for example:
     use admin;
  2) Add Admin rights to some Wekan username:
     db.users.update({username:'admin-username-here'},{$set:{isAdmin:true}})
  Hiding Admin panel by removing Admin rights:
     use admin;
     db.settings.remove({});
```
* Make Due Date layout nicer on minicard;
* Added tooltip for board menu and sidebar buttons;
* [Wekan database cleanup script](https://github.com/wekan/wekan-cleanup);
* [Daily export script of Wekan changes as JSON to Logstash and
  ElasticSearch / Kibana (ELK)](https://github.com/wekan/wekan-logstash);
* [Wekan stats script](https://github.com/wekan/wekan-stats).

and fixes the following bugs:

* Dockerfile was missing EXPOSE $PORT;
* Bug when removing user from board that generate activity for
  all cards of the board. Add check before user is one owner
  of the card before adding activity;
* All new boards are automatically starred. Fixed to
  only star header-bar new-boards;
* Orphan documents were created when cards were deleted;
* Improve Wekan performance by adding indexes to MongoDB;
* Invite user with lower case email;
* Typos.

Thanks to GitHub users eemeli, entrptaher, fmonthel, jLouzado, lkisme,
maulal, pra85, vuxor, whittssg2 and xet7 for their contributions.

# v0.11.1-rc1 2017-02-10 Wekan prerelease

2017-01-29 mquandalle gave Wekan access to xet7,
so at 2017-01-31 xet7 started merging Wefork back to Wekan.
At 2017-02-03 all Wefork code and pull requests are now
merged back to Wekan.

Known bugs:
* https://github.com/wekan/wekan/issues/785
* https://github.com/wekan/wekan/issues/784

This release adds the following supported platforms:

* Docker;
* Docker on SLES12SP1;
* Install from source.

and adds the following new features:

* Checklists;
* Remove a list;
* Admin of board can leave board if he/she
  is not last admin in the board;
* Shortcuts popup, link to it on
  bottom right corner;
* Links are now underlined and change
  link color on hover;
* Added YuGothic and Meiryo fonts to show
  non-English text correctly.

and fixes the following bugs:

* Update xss to v0.3.3;
* Typos in boards.js and boardHeader.js;
* Build warning in jade template;
* New MongoDB version breaks uploading files
  and avatars, so using older version;
* Tweaked .gitignore to exclude .build/*;
* Fix executeUpTo label when dragging cards,
  popup was not in the predefined hierarchy.

and adds the following new documentation:

* Developer Documentation;
* Docker;
* and others.

Thanks to GitHub users AlexanderR, BaobabCoder, jLouzado, kamijin-fanta,
lkisme, mario-orlicky, martingabelmann, mquandalle, stephenmoloney,
umbertooo, xet7 and qge for their contributions.

# v0.11.0 2016-12-16 Wekan fork first release

This release adds the following new features:

* Start- and Duedate for cards;
* Allow IE 11 to work;
* Option to hide system messages in the card;
* Option to setup minimum limit to show cards count
  for each list in board;
* Option 'filter by empty' to filter by cards by 'no member'
  and 'no label' properties;
* Speedup: Added MongoDB index on CardId into Comments collection.
* Translation updates

and fixes the following bugs:

* Sandstorm: username handling, restore identity, eslint regressions,
  board not found;
* Failure to load when navigator.language is Chinese or Finnish;
* Hover background for labels in filter sidebar. Now correctly
  centered;
* Display message when user wants to choose existing username;
* Client sometimes fails to receive current user's profile;
* Old users could see broken presence indicators on new users.

Thanks to GitHub users dwrencha, fmonthel, mario-orlicky, pierreozoux,
shoetten, and xet7 for their contributions.

# v0.11.0-rc2 2016-07-21

This release adds the following new features:

* Notification system with email notifications of the changes in a board,
  a list or on a card;
* Show the exact time when hovering the activity time;
* Allow to edit more easily longer card titles by resizing the input box;
* Add shortcuts to move cards to the top or the bottom of a list;
* Add a warning indicator when the application is offline;
* A new log-in button on the public board view to sign in, even if the board
  is published;
* New link to the keyboard shortcuts in the board sidebar;

and fixes the following bugs:

* Fix the syntax of the `docker-compose.yml`;
* Use the correct pluralization of emoji;
* Only publish required user data and keep the hashed passwords confidential;
* Fix the generation and alignment of the initials avatars;
* Fix the “welcome board” feature;
* Only display the buttons in the board header, if the data is available
  and the user is able to use it;
* Fix the scaling of cover images;
* Fix bugs on Internet Explorer v11 that blocked card creation and activity feed
  visualization.

Thanks to GitHub users alayek, AlexanderS, choclin, floatinghotpot, ForNeVeR,
PeterDaveHello, seschwar, and TheElf for their contributions.

# v0.10.1 2015-12-30

This patch release fixes two bugs on Sandstorm:

* Drag and drop was broken;
* Avatars weren’t working.

# v0.10 2015-12-22

This release features:

* Trello boards importation, including card history, assigned members, labels,
  comments, and attachments;
* Invite new users to a board using an email address;
* Autocompletion in the minicard editor. Start with <kbd>@</kbd> to start a
  board member autocompletion, or <kbd>#</kbd> for a label;
* Improve the user interface on small screens so that Wekan could be used on the
  mobile web;
* Accelerate the initial page rendering by sending the data on the initial HTTP
  response instead of waiting for the DDP connection to open;
* Support images attachments copy pasting;
* On Sandstorm, expose the Wekan grain title and URL to the Sandstorm shell;
* Support Wekan deployment under a sub-path of a domain name.

New languages supported: Arabic, Catalan, Italian, and Russian.

Thanks to GitHub users AlexanderS, fisle, floatinghotpot, FuzzyWuzzie, mnutt,
ndarilek, SirCmpwn, and xavierpriour for their contributions.

# v0.9 2015-09-10

This release is a large re-write of the previous code base. This release marks
the beginning of our new user interface and continues to improve the overall
performance and security. It also features the following improvements:

* A new user account system, including the possibility to reset a forgotten
  password, to change the password, or to enable email confirmation (all of
  which were previously impossible);
* Avatar customization, including the possibility to upload images and to choose
  one from Gravatar or the user initials (on Sandstorm we use the avatar exposed
  by Sandstorm);
* Cards multi-selection to facilitate batch actions such as moving all the cards
  of selection, or attaching a label or a member to them;
* Automatic drafts saving synced with the server;
* Keyboard navigation, press `?` to read the list of available shortcuts;
* The possibility to restore archived boards, lists, and cards.

Starting from this release we will also distribute official docker images on
both the [GitHub release page](https://github.com/wekan/wekan/releases) and on
the [DockerHub](https://hub.docker.com/r/mquandalle/wekan). We also configured
Heroku one-click install and improved Sandstorm integration with the integration
of its build-in sharing model.

New languages supported: Chinese, Finnish, Spanish, Korean, and Russian.

Special thanks to GitHub users ePirat, nata-goddanti, ocdtrekkie, and others who
have supportive during this *traversée du desert*, and to neynah for the Wekan
icons.

# v0.8

This release continues the implementation of basic features of a “kanban”
software, especially:

* Basic card attachments. If the attached file is an image we generate and
  display a thumbnail that can be used as a card “cover” (visible in the board
  general view);
* User names mentions and auto-completion in card description and comments
  (though we don’t have any notification system for now, making this feature a
  less useful that it should);
* Filter views, current filtering options are based on labels and assigned
  members;
* Labels creation and suppression at the board level (previously we had a fixed
  list of labels);
* Customization of the board background color.

This release is also the first one to introduce localization of the user
interface.

New languages supported: French, German, Japanese, Portuguese, and Turkish.

# v0.7.1

This release fixes the following bugs:

* Unexpected lost of the card sorting on the server side;
* Fix a bug during board creation;
* Focus the new list form if the board is empty.

# v0.7

This release starts the transition from a toy project to something useful. Along
with some security and performance improvements (for instance, opening a card
used to take a long time because it was re-generated the entire DOM whereas only
the popover was new). New features includes:

* Add and remove labels to cards;
* Assign and unassign members to cards;
* Archive cards (though restoration is not yet possible);
* Board stars;
* Markdown and emoji support in comments and card description;
* Emoji auto-completion in the text editor;
* Some keyboard shortcuts (eg `Ctrl`+`Enter` to submit a multi-line input).

We also introduced basic support for the [Sandstorm](https://sandstorm.io)
platform, and distribute a `spk` (Sandstorm PacKage) for this release and
subsequent.
