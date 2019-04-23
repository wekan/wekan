# v2.64 2019-04-23 Wekan release

This release adds the following new features:

- [Board Archive: Restore All/Delete All of Cards/Lists/Swimlanes](https://github.com/wekan/wekan/pull/2376).
  Thanks to Akuket.

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.63 2019-04-23 Wekan release

This release removes the following Caddy plugins:

- [Remove Caddy plugins http.filter, http.ipfilter and http.realip from Caddy](https://github.com/wekan/wekan/commot/6a94500170509d2d82bd9a0fdc94a7ce66215b3d)
  because they are currently broken, preventing download of Caddy during Wekan Snap build.
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.62 2019-04-23 Wekan release

This release fixes the following bugs:

- [Mobile UI: Center cards in list view](https://github.com/wekan/wekan/issues/2371).
  Thanks to hupptechnologies.

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.61 2019-04-20 Wekan release

This release adds the following new features:

- Admin Panel/People: Can now search users by username, full name or email and using regex to find them.
  Display the number of users. All registered users by default else the number of users selected by the search.
  Thanks to Akuket.

and adds the following updates:

- [Update to use newest GitHub flawored markdown](https://github.com/wekan/wekan/commit/fea2ad3d7d09b44c3de1dbcdd3f8750aaa6776d5),
  because [it was found old version was in use](https://github.com/wekan/wekan/issues/2334).
  Thanks to shaygover and xet7.
- [Upgrade to Node 8.16.0](https://github.com/wekan/wekan/commit/6117097a93bfb11c8bd4c87a23c44a50e22ceb87).
  Thanks to Node developers and xet7.    
- [Upgrade Docker base image to ubuntu:disco](https://github.com/wekan/wekan/commit/bd14ee3b1f450ddc6dec26ccc8da702b839942e5).
  Thanks to Ubuntu developers and xet7.

and fixes the following bugs:

- [Fix Full width of lists and space before first list](https://github.com/wekan/wekan/pull/2343).
  Thanks to hupptehcnologies.
- Remove [extra](https://github.com/wekan/wekan/pull/2332) [quotes](https://github.com/wekan/wekan/pull/2333) from docker-compose.yml.
  Thanks to hibare.
- Fix Docker builds by moving all separately cloned wekan/packages/* repos like ldap, oidc, etc code to wekan repo code,
  so that in build scripts it's not needed to clone those. Also archived those wekan repos and moved issues
  to https://github.com/wekan/wekan/issues because changes and development to those packages now happends on wekan/wekan repo.
  There was also fixes to repo urls etc. Thanks to xet7.
- [Additional updates](https://github.com/wekan/wekan/pull/2347) to meteor-1.8 branch, that contains
  Meteor 1.8.1 version that works in Docker but not yet at Snap and Sandstorm. Thanks to justinr1234.

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.60 2019-04-08 Wekan release

This release fixes the following bugs:

- [Fix: Description of Board is out of visible after Feature "Duplicate Board"](https://github.com/wekan/wekan/issues/2324).
  Thanks to sfahrenholz and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.59 2019-04-06 Wekan release

This release fixes the following bugs:

- [Add variables for activity notifications, Fixes #2285](https://github.com/wekan/wekan/pull/2320).
  Thanks to rinnaz.

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.58 2019-04-06 Wekan release

This release adds the following new features:

- [Duplicate Board](https://github.com/wekan/wekan/issues/2257). Related #2225.
  Thanks to Angtrim.
- [Add Duplicate Board tooltip, and remove adding text "Copy" to duplicated board](https://github.com/wekan/wekan/commit/0f15b6d1982c383f76e8411cb501ff27e8febd42).
  Thanks to xet7.

and fixes the following bugs:

- [Add proper variables for unjoin card](https://github.com/wekan/wekan/pull/2313).
  Thanks to chotaire.
- [Center reduce left margin in card view on mobile browser](https://github.com/wekan/wekan/pull/2314).
  Thanks to hupptechnologies.
- [Remove not needed ARGS from Dockerfile to reduce amount of Docker layers](https://github.com/wekan/wekan/issues/2301).
  Thanks to folhabranca and xet7.
- [Fix Swimlane Rules don't work](https://github.com/wekan/wekan/issues/2225).
  Thanks to Angtrim.

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.57 2019-04-02 Wekan release

This release fixes the following bugs, thanks to justinr1234:

- [Add proper variables for join card](https://github.com/wekan/wekan/commit/289f1fe1340c85eb2af19825f4972e9057a86b7a),
  fixes [Incorrect variable replacement on email notifications](https://github.com/wekan/wekan/issues/2285).

and fixes the following bugs with Apache I-CLA, thanks to bentiss:

- [List: Do not use IntersectionObserver to reduce CPU usage](https://github.com/wekan/wekan/pull/2302).

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.56 2019-03-27 Wekan release

This release [fixes the following bugs](https://github.com/wekan/wekan/pull/2287), thanks to bentiss with Apache I-CLA:

- [#2250 -> the spinner could be shown on startup and never goes away](https://github.com/wekan/wekan/issues/2250).
- The code will now only load extra cards that will be in the current viewport.
- When 2 users were interacting on the same board, there was a situation where the spinner could show up on the other user, without being able to load the extra cards.
- The code is now much simpler, thanks to the IntersectionObserver, and all of this for fewer lines of code :)

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.55 2019-03-25 Wekan release

This release fixes the following bugs, thanks to bentiss with Apache I-CLA:

- [Use older api2html@0.3.0](https://github.com/wekan/wekan/commit/625682a4dab43c525494af10121edbfd547786d7)
  to fix [broken snap and docker build](https://github.com/wekan/wekan/issues/2286),
  because newer api2html caused
  [breaking change](https://github.com/tobilg/api2html/commit/a9a41bca18db3f9ec61395d7262eff071a995783)
  at api2html/bin/api2html.js:23 has error about "php": "PHP".

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.54 2019-03-25 Wekan release

This release fixes the following bugs:

- Fix typos.
- [Fix Outgoing Webhook message about created new swimlane](https://github.com/wekan/wekan/issues/1969).

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.53 2019-03-23 Wekan release

This release fixes the following bugs:

- [Fix filename and URLs](https://github.com/wekan/wekan/ccommit/994314cfa339e52a2ad124194af4e89f57ddd213).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.52 2019-03-22 Wekan release

This release adds the following new features:

- [More whitelabeling: Hide Wekan logo and title by default, and don't show separate option to hide logo at
  Admin Panel/Layout](https://github.com/wekan/wekan/commit/2969161afbe60a1aa2e7da6cedc3ab48941faf3e).
  Thanks to xet7.
- Added and then reverted option to redirect OIDC OAuth2 login [part1](https://github.com/wekan/wekan-ldap/commit/82a894ac20ba9e7c6fdf053cff1721cab709bf8a),
  [part 2](https://github.com/wekan/wekan-ldap/commit/36900cc360d0d406f8fba5e43378f85c92747870) and
  [part3](https://github.com/wekan/wekan/commit/7919ae362866c0cacf2a486bf91b12e4d25807d7).
  This does not work yet. In Progress.
  Thanks to xet7.
- [Add LDAP config example, remove extra text](https://github.com/wekan/wekan/commit/506acda70b5e78737c52455e5eee9c8758243196).
  Thanks to xet7.

and fixes the following bugs:

- [Fix IFTTT email sending](https://github.com/wekan/wekan/pull/2279).
  Thanks to justinr1234.

Thanks to above GitHub users for their contributions.

# v2.51 2019-03-21 Wekan release

This release fixes the following bugs:

- [Fix Unable to change board card title (=Board name) at Templates page](https://github.com/wekan/wekan/issues/2275).
  and [Unable to change card title in Template](https://github.com/wekan/wekan/issues/2268) part 2.
  Thanks to andresmanelli.

Thanks to above GitHub users for their contributions.

# v2.50 2019-03-21 Wekan release

This release fixes the following bugs:

- [Fix](https://github.com/wekan/wekan/pull/2269) [Unable to change card title in Template](https://github.com/wekan/wekan/issues/2268)
  and [Fix Unable to create a new board from a template](https://github.com/wekan/wekan/issues/2267).
  Thanks to andresmanelli.

Thanks to above GitHub users for their contributions.

# v2.49 2019-03-21 Wekan release

This release fixes the following bugs:

- [The invitation code doesn't exist - case-sensitive eMail](https://github.com/wekan/wekan/issues/1384). Thanks to neurolabs.
- [Don't swallow email errors](https://github.com/wekan/wekan/pull/2272). Thanks to justinr1234.
- [Migrate customFields model](https://github.com/wekan/wekan/pull/2264).
  Modifies the customFields model to keep an array of boardIds where the customField can be used.
  Adds name matching for labels when copying/moving cards between boards.
  This way, customFields are not lost when copying/moving a card. Particularly useful when templates have customFields or labels with specific names (not tested for templates yet).
  Thanks to andresmanelli.
- [Fix dissapearing subtasks](https://github.com/wekan/wekan/pull/2265). Thanks to andresmanelli.
- [Cards disappear when rearranged on template board](https://github.com/wekan/wekan/issues/2266). Thanks to andresmanelli.

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.48 2019-03-15 Wekan release

This release fixes the following bugs, thanks to GitHub user xet7:

- [Fix LDAP login](https://github.com/wekan/wekan/commit/216b3cfe0121aa026139536c383aa27db0353411).

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.47 2019-03-14 Wekan release

This release fixes the following bugs, thanks to GitHub user xet7:

- [Remove ordering of cards by starred/color/description, so that cards would not reorder all the time](https://github.com/wekan/wekan/issues/2241).
- Try to fix [LDAP Login: "Login forbidden", ReferenceError: req is not defined](https://github.com/wekan/wekan-ldap/44).

# v2.46 2019-03-13 Wekan release

This release fixes the following bugs:

- [Fix watchers undefined](https://github.com/wekan/wekan/pull/2253).
  Thanks to justinr1234.
- [Revert hiding of Subtask boards](https://github.com/wekan/wekan/commit/1968b7da31d75757fd6383417d729ff6af6bbc5b)
  because of feedback from Wekan users, that need Subtask boards to be visible.
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.45 2019-03-11 Wekan release

This release fixes the following bugs, thanks to andresmanelli:

- [Rename circular card migration to re run the fix](https://github.com/wekan/wekan/commit/a347ae367654258b7768e7571831ed8f75fb5b84).

# v2.44 2019-03-11 Wekan release

This release adds the following new features and fixes with Apache I-CLA, thanks to bentiss:

- [Activities: register customFields changes in the activities](https://github.com/wekan/wekan/pull/2239).
- [customFields: fix leftover from lint](https://github.com/wekan/wekan/commit/4c72479d1206850d436261dc5c6a4127f246f6da).
  Looks like I forgot to use the camelCase notation here, and this leads to an exception while updating a custom field.
- [Fix imports](https://github.com/wekan/wekan/pull/2245).

and adds the following new features:

- Add language: Occitan. Thanks to translators.

and fixes the following bugs:

- [Fix removed checklistItem activity => dangling activities created](https://github.com/wekan/wekan/commit/2ec1664408d9515b5ca77fbb46ef99208eb8cff0).
  Closes #2240. Thanks to andresmanelli.
- [Avoid set self as parent card to cause circular reference, for real](https://github.com/wekan/commit/97822f35fd6365e5631c5488e8ee595f76ab4e34).
  Thanks to andresmanelli.
- Try to fix [Order All Boards by starred, color, board name and board description. Part 2](https://github.com/wekan/wekan/commit/8f337f17e45f8af8d96b6043d54466e5878b7e0b).
  Works on new Wekan install. Could still have boards keeping reording happening all the time on old Wekan installs.
  Thanks to xet7. Note: Ordering by starred/color/description was removed at Wekan v2.47.
- [Changed brute force protection package from eluck:accounts-lockout to lucasantoniassi:accounts-lockout that is maintained and works.
  Added Snap/Docker/Source settings](https://github.com/wekan/wekan/commit/b7c000b78b9af253fb115bbfa5ef0d4c0681abbb).
  Thanks to xet7.

Thanks to above Wekan contributors for their contributions.

# v2.43 2019-03-08 Wekan release

This release adds the following new features, thanks to xet7:

- [Hide Subtask boards from All Boards](https://github.com/wekan/wekan/issues/1990). This was reverted in Wekan v2.46 to make Subtask boards visible again.
- [Order All Boards by Starred, Color, Title and Description](https://github.com/wekan/wekan/commit/856872815292590e0c4eff2848ea1b857a318dc4).
  This was removed at Wekan v2.47.
- [HTTP header automatic login](https://github.com/wekan/wekan/commit/ff825d6123ecfd033ccb08ce97c11cefee676104)
  for [3rd party authentication server method](https://github.com/wekan/wekan/issues/2019) like siteminder, and any webserver that
  handles authentication and based on it adds HTTP headers to be used for login. Please test.

and adds the following partial fix, thanks to andresmanelli:

- [Add migration to fix circular references](https://github.com/wekan/wekan/commit/a338e937e508568d1f6a15c5464126d30ef69a7d).
  This [runs only once](https://github.com/wekan/wekan/issues/2209#issuecomment-470445989),
  so later there will be another fix to make it run every time.

and reverts the following change of v2.42, because they did not fix anything, thanks to xet7:

- [Revert: Tried to fix snap mongodb-control not starting database](https://github.com/wekan/wekan/commit/4055f451fdadfbfdef9a10be29a0eb6aed91182c).

Thanks to above GitHub users for their contributions, and translators for their translations.

# v2.42 2019-03-07 Wekan release

This release tried to fix the following bugs:

- [Tried to fix snap mongodb-control not starting database](https://github.com/wekan/wekan/commit/2c5628b5fbcc25427021d0b22e74577a71149c21).
  Reverted in v2.43, because it did not fix anything.

Thanks to xet7 and qurqar[m] at IRC #wekan.

# v2.41 2019-03-07 Wekan release

This release tried to fix the following bugs:

- [Partial Fix: Card was selected as parent card (circular reference) and now board can be not opened anymore](https://github.com/wekan/wekan/issues/2202)
  with [Avoid setting same card as parentCard. Avoid listing templates board in copy/move/more menus](https://github.com/wekan/wekan/commit/745f39ed20169f56b99c0339f2043f8c4ed43873).
  This does not fully work yet, it will be fixed later.
  Thanks to andresmanelli.

Thanks to above GitHub users for their contributions, and translators for their translations.

# v2.40 2019-03-06 Wekan release

This release fixes the following bugs:

- Part 2: [Fix](https://github.com/wekan/wekan/commit/e845fe3e7130d111be4c3a73e2551738c980ff7b)
  [manifest](https://github.com/wekan/wekan/issues/2168) and
  [icon](https://github.com/wekan/wekan/issues/1692) paths. Thanks to xet7.

Thanks to above GitHub users for their contributions, and translators for their translations.

# v2.39 2019-03-06 Wekan release

This release fixes the following bugs:

- [Fix](https://github.com/wekan/wekan/commit/e845fe3e7130d111be4c3a73e2551738c980ff7b)
  [manifest](https://github.com/wekan/wekan/issues/2168) and
  [icon](https://github.com/wekan/wekan/issues/1692) paths. Thanks to xet7.

Thanks to above GitHub users for their contributions, and translators for their translations.

# v2.38 2019-03-06 Wekan release

This release adds the following new features:

- [Added a Helm Chart to the project](https://github.com/wekan/wekan/pull/2227), thanks to TechnoTaff.
- [Added support for LDAP admin status sync](https://github.com/wekan/wekan-ldap/pull/40).
  Examples: [LDAP_SYNC_ADMIN_STATUS=true, LDAP_SYNC_ADMIN_GROUP=group1,group2](https://github.com/wekan/wekan/commit/7e451d9033eb6162cd37de3e5ffabdc22e272948).
  Thanks to JulianJacobi and xet7.

and fixes the following bugs:

- [Fix card deletion from archive](https://github.com/wekan/wekan/commit/77754cf32f28498e550a46325d90eb41f08f8552). Thanks to andresmanelli.
- [Fix card move with wrong swimlaneId](https://github.com/wekan/wekan/commit/1bef3a3f8ff4eac43bf97cc8b86d85e618b0e2ef). Thanks to andresmanelli.
  NOTE: This does not yet fix card move [with Custom Field](https://github.com/wekan/wekan/issues/2233), it will be fixed later.
- [Fix: LDAP Authentication with Recursive Group Filtering Does Not Work on Snap](https://github.com/wekan/wekan/issues/2228). Thanks to apages2.
- [Use ubuntu:cosmic base in Dockerfile](https://github.com/wekan/wekan/commit/df00776e6ca47080435eca9a31a16fd24c0770ed). Thanks to xet7.
- [Remove phantomjs binary from Docker/Snap/Stackerfile to reduce size](https://github.com/wekan/wekan/issues/2229). Thanks to soohwa.

Thanks to above GitHub users for their contributions, and translators for their translations.

# v2.37 2019-03-04 Wekan release

This release fixes the following bugs:

- [Fix Adding Labels to cards is not possible anymore](https://github.com/wekan/wekan/issues/2223).

Thanks to GitHub user xet7 for contributions.

# v2.36 2019-03-03 Wekan release

This release adds the following UI changes:

- [Combine hamburger menus at right](https://github.com/wekan/wekan/issues/2219):
  - Hamburger button open sidebar;
  - Sidebar has at top right Cog icon that opens Board Settings;
  - Hide sidebar arrows.

and fixes the following bugs:

- [Add more Webhook translations](https://github.com/wekan/wekan/issues/1969).
  In progress.

and moved the following code around:

- [Forked salleman-oidc](https://github.com/wekan/wekan/commit/8867bec8e65f1ef6be0c731918e8eefcacb7acb0)
  to https://github.com/wekan/meteor-accounts-oidc where salleman also has write access,
  xet7 can make changes directly and GitHub issues are enabled.

Thanks to GitHub user xet7 for contributions.

# v2.35 2019-03-01 Wekan release

This release fixes the following bugs:

- [Add Filter fix back](https://github.com/wekan/wekan/issues/2213),
  because there was no bug in filter fix.

Thanks to GitHub user xet7 for contributions.

# v2.34 2019-03-01 Wekan release

This release tried to fix following bugs, but did not fix anything:

- Revert [Filter fix](https://github.com/wekan/wekan/issues/2213) because of
  [mongodb data tampered](https://github.com/wekan/wekan-snap/issues/83).
  This was added back at Wekan v2.35.

Thanks to GitHub user xet7 for contributions.

# v2.33 2019-02-28 Wekan release

This release adds the following upgrades:

- [Upgrade Node.js to v8.15.1](https://github.com/wekan/wekan/commit/5cafdd9878ab4b6123024ec33279ccdae75f554f).

Thanks to Node.js developers and GitHub user xet7 for contributions.

# v2.32 2019-02-28 Wekan release

This release adds the following [performance improvements](https://github.com/wekan/wekan/pull/2214), thanks to justinr1234:

- New indexes for queries that were missing an index;
- Bulk querying documents to reduce the number of mongo queries when loading a board;
- Ensure oplog is being used to query the database by providing a `sort` key when `limit` is used querying the `boards` collection.

and fixes the following bugs related to [Template features](https://github.com/wekan/wekan/issues/2209), thanks to andresmanelli:

- [Fix filtering in swimlane view](https://github.com/wekan/wekan/commit/49229e1723de14cdc66dc6480624bba426d35e36) that was [broken since v2.29](https://github.com/wekan/wekan/issues/2213).

Thanks to above GitHub users for their contributions.

# v2.31 2019-02-28 Wekan release

This release fixes the following bugs related to [Template features](https://github.com/wekan/wekan/issues/2209), thanks to GitHub user andresmanelli:

- [Fix copy card](https://github.com/wekan/wekan/issues/2210).

# v2.30 2019-02-28 Wekan release

This release adds the following new [Template features](https://github.com/wekan/wekan/issues/2209), thanks to GitHub user andresmanelli:

- [Fix popup title. Add element title modification](https://github.com/wekan/wekan/commit/888e1ad5d3e32be53283aa32198057f669f3d706);
- [Copy template attachments](https://github.com/wekan/wekan/commit/abb71083215462d91b084c4de13af0b130638e4d);
- [Standarize copy functions. Match labels by name](https://github.com/wekan/wekan/commit/da21a2a410c9b905de89d66236748e0c8f5357ea).

# v2.29 2019-02-27 Wekan release

This release adds the following new features:

- Swimlane/List/Board/Card templates. In Progress, please test and [add comment if you find not listed bugs](https://github.com/wekan/wekan/issues/2165).
  Thanks to GitHub user andresmanelli.

# v2.28 2019-02-27 Wekan release

This release adds the following new Sandstorm features and fixes:

- All Boards page [so it's possible to go back from subtask board](https://github.com/wekan/wekan/issues/2082).
- Board favorites.
- New Sandstorm board first user is Admin and [has IFTTT Rules](https://github.com/wekan/wekan/issues/2125) and Standalone Wekan Admin Panel.
  Probably some Admin Panel features do not work yet. Please keep backup of your grains before testing Admin Panel.
- Linked Cards and Linked Boards.
- Some not needed options like Logout etc have been hidden from top bar right menu.
- [Import board now works. "Board not found" is not problem anymore](https://github.com/wekan/wekan/issues/1430), because you can go to All Boards page to change to imported board.

and removes the following features:

- Remove Welcome Board from Standalone Wekan, [to fix Welcome board not translated](https://github.com/wekan/wekan/issues/1601).
  Sandstorm Wekan does not have Welcome Board.

Thanks to GitHub user xet7 for contributions.

# v2.27 2019-02-27 Wekan release

This release fixes the following bugs:

- [Fix OIDC error "a.join is not a function"](https://github.com/wekan/wekan/issues/2206)
  by reverting configurable OAUTH2_ID_TOKEN_WHITELIST_FIELDS and
  OAUTH2_REQUEST_PERMISSIONS from Wekan v2.22-2.26.
  Thanks to GitHub user xet7.

# v2.26 2019-02-25 Wekan release

This release adds the following new features:

- Add setting [EMAIL_NOTIFICATION_TIMEOUT](https://github.com/wekan/wekan/issues/2203).
  Defaut 30000 ms (30s). Thanks to GitHub users ngru and xet7.

and fixes the following bugs:

- REVERTED in v2.27 ([Fix OAuth2 requestPermissions](https://github.com/wekan/wekan/commit/5e238bfbfea16940ae29647ae347bbdc0d78efb0).
  This makes [Auth0 login possible](https://github.com/wekan/wekan/issues/1722)
  with [OIDC](https://github.com/wekan/wekan/wiki/OAuth2#auth0). Needs testing.
  Thanks to GitHub user xet7.)

# v2.25 2019-02-23 Wekan release

This release fixes the following bugs:

- Revert file permission changes from v2.24 LDAP changes that
  caused snap version to not build.

Thanks to GitHub user xet7 for contributions.

# v2.24 2019-02-23 Wekan release

This release adds the following new features:

- [Add LDAP email] matching support](https://github.com/wekan/wekan-ldap/pull/39) and
  [related env variables](https://github.com/wekan/wekan/pull/2198).
  Thanks to GitHub user stevenpwaters.

and fixes the following bugs:

- REVERTED in v2.27 ([Add missing text .env to wekan/server/authentication.js](https://github.com/wekan/wekan/commit/4e6e78ccd216045e6ad41bcdab4e524f715a7eb5).
  Thanks to Vanila Chat user .gitignore.)

Thanks to above contributors, and translators for their translation.

# v2.23 2019-02-17 Wekan relase

This release fixes the following bugs:

- [Fix authentication dropdown](https://github.com/wekan/wekan/pull/2191).
  Thanks to Akuket.

Thanks to above GitHub users for their contributions, and translators for their translations.

# v2.22 2019-02-13 Wekan release

This release adds the following new features:

- [Kadira integration](https://github.com/wekan/wekan/issues/2152). Thanks to GavinLilly.
- REVERTED in v2.27 (Add [configurable](https://github.com/wekan/wekan/issues/1874#issuecomment-462759627)
  settings [OAUTH2_ID_TOKEN_WHITELIST_FIELDS and
  OAUTH2_REQUEST_PERMISSIONS](https://github.com/wekan/wekan/commit/b66f471e530d41a3f12e4bfc29548313e9a73c35).
  Thanks to xet7.)

and fixes the following bugs:

- [Fix: Remove overlap of side bar button with card/list menu button on
   mobile browser](https://github.com/wekan/wekan/issues/2183). Thanks to xet7.

Thanks to above GitHub users for their contributions, and translators for their translations.

# v2.21 2019-02-12 Wekan release

This release adds the following new features:

- [Bump salleman-oidc to 1.0.12](https://github.com/wekan/wekan/commit/352e5c6cb07b1a09ef692af6f6c49c3b1f3e91c1). Thanks to danpatdav.
- [Added parameters for OIDC claim mapping](https://github.com/wekan/wekan/commit/bdbbb12f967f7e4f605e6c3310290180f6c8c6d1).
  These mapping parameters take advantage of new code in salleman-oidc 1.0.12 to override the default claim names provided by the userinfo endpoint.
  Thanks to danpatdav.
- [Add OIDC claim mapping parameters to docker-compose.yml/Snap/Source](https://github.com/wekan/wekan/commit/59314ab17d65e9579d2f29b32685b7777f2a06a1).
  Thanks to xet7.

Thanks to above GitHub users for their contributions.

# v2.20 2019-02-11 Wekan release

This release adds the following new features:

- [Add OIDC / OAuth2 optional setting DEBUG=true to salleman-oidc and Dockerfile](https://github.com/wekan/wekan/pull/2181).
  Thanks to danpatdav.
- [Add OIDC / OAuth2 optional setting DEBUG=true to docker-compose.yml/Snap/Source](https://github.com/wekan/wekan/commits/8e02170dd1d5a638ba47dcca910e6eecbfd03baf).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.19 2019-02-09 Wekan release

This release removes the following new features:

- [Remove oplog from snap](https://github.com/wekan/wekan/commit/f1bd36a3b87f97927dfe60572646a457e1f7ef66). Need to think how to do it properly.

Thanks to GitHub user xet7 for conrtibutions.

# v2.18 2019-02-08 Wekan release

This release adds the folloging new features:

- [Improve Authentication: Admin Panel / Layout / Set Default Authentication / Password/LDAP](https://github.com/wekan/wekan/pull/2172). Thanks to Akuket.
- [Add oplog to snap mongodb](https://github.com/wekan/wekan/commit/79ffb7d50202471c7b7f297286f13e66ce30922e). Thanks to xet7.

and fixes the following bugs with Apache I-CLA, thanks to bentiss:

- [Fix swimlanes sorting](https://github.com/wekan/wekan/pull/2174)
  since "[Properly fix horizontal rendering on Chrome and Firefox](https://github.com/wekan/wekan/commit/7cc185ac)".
  The rendering of the new design of the swimlanes was correct, but this
  commit broke the reordering capability. Having the swimlane header at
  the same level than the lists of cards makes the whole sortable
  pattern fail.
  - 2 solutions:
    - revert to only have 1 div per swimlane. But this introduces [the firefox
      bug mentioned](https://github.com/wekan/wekan/commit/7cc185ac), so not ideal
    - force the sortable pattern to do what we want.
  - To force the sortable pattern, we need:
    - add in the helper a clone of the list of cards (to not just move the
      header)
    - make sure the placeholder never get placed between the header and the
      list of cards in a swimlane
    - fix the finding of the next and previous list of cards.
    For all of this to be successful, we need to resize the swimlanes to a
    known value. This can lead to some visual jumps with scrolling when you
    drag or drop the swimlanea. I tried to remedy that by computing the new
    scroll value. Still not ideal however, as there are still some jumps when
    dropping.
    Fixes [#2159](https://github.com/wekan/wekan/issues/2159).

Thanks to above GitHub users and translators for contributions.

# v2.17 2019-02-04 Wekan release

This release fixes the following bugs:

- [OIDC/OAuth2 BoardView Fix](https://github.com/wekan/wekan/issues/1874).

Thanks to GitHub gil0109 for contributions, and translator for their translations.

# v2.16 2019-02-03 Wekan release

This release fixes the following bugs:

- [Part 2](https://github.com/ChronikEwok/wekan/commit/9a6ac544dd5618e58ce107352124fd9b495e5c30):
  [Fix: Not displaying card content of public board: Snap, Docker and Sandstorm Shared Wekan Board
  Link](https://github.com/wekan/wekan/issues/1623) with
  [code from ChronikEwok](https://github.com/ChronikEwok/wekan/commit/cad9b20451bb6149bfb527a99b5001873b06c3de).

Thanks to GitHub user ChronikEwok for contributions.

# v2.15 2019-02-03 Wekan release

This release fixes the following bugs:

- [Fix: Not displaying card content of public board: Snap, Docker and Sandstorm Shared Wekan Board
  Link](https://github.com/wekan/wekan/issues/1623) with
  [code from ChronikEwok](https://github.com/ChronikEwok/wekan/commit/cad9b20451bb6149bfb527a99b5001873b06c3de).

Thanks to GitHub user ChronikEwok for contributions.

# v2.14 2019-02-02 Wekan release

This release fixes the following bugs:

- [Fix Sandstorm export board from web](https://github.com/wekan/wekan/issues/2157).
- [Fix Error when logging in to Wekan REST API when using Sandstorm Wekan](https://github.com/wekan/wekan/issues/1279).
  Sandstorm API works this way: Make API key, and from that key copy API URL and API KEY to below. It saves Wekan board to file.
  `curl http://Bearer:APIKEY@api-12345.local.sandstorm.io:6080/api/boards/sandstorm/export?authToken=#APIKEY > wekanboard.json`
  If later API key does not work, you need to remove it and make a new one.

Thanks to GitHub user xet7 for contributions.

# v2.13 2019-02-01 Wekan release

This release adds the following new features with Apache I-CLA, thanks to bentiss:

- [Use infinite-scrolling on lists](https://github.com/wekan/wekan/pull/2144).
  This allows to reduce the loading time of a big board.
  Note that there is an infinite scroll implementation in the mixins,
  but this doesn't fit well as the cards in the list can have arbitrary
  height.
  The idea to rely on the visibility of a spinner is based on
  http://www.meteorpedia.com/read/Infinite_Scrolling
- [When writing to minicard, press Shift-Enter on minicard to go to next line
  below](https://github.com/wekan/wekan/commit/7a35099fb9778d5f3656a57c74af426cfb20fba3),
  to continue writing on same minicard 2nd line.

Thanks to GitHub user bentiss for contributions.

# v2.12 2019-01-31 Wekan release

This release fixes the following bugs:

- [Bumped the salleman oidc packages versions to include an upstream bug fix](https://github.com/wekan/wekan/commit/361faa6646556de68ad78dc90d9eb9f78956ce0f).

Thanks to GitHub user danpatdav for contributions.

# v2.11 2019-01-31 Wekan release

This release fixes the following bugs:

- [Fix: Bug: Not logged in public board page has calendar](https://github.com/wekan/wekan/issues/2061). Thanks to xet7.

Thanks to above GitHub users and translators for contributions.

# v2.10 2019-01-30 Wekan release

This release adds the following new features:

- Translations: Add Macedonian. [Copied Bulgarian to Macedonian](https://github.com/wekan/wekan/commit/6e4a6515e00fe68b8615d850cfb3cb290418e176)
  so that required changes will be faster to add. Thanks to translators and therampagerado;

and fixes the following bugs:

- Revert [Sandstorm API changes](https://github.com/wekan/wekan/commit/be03a191c4321c2f80116c0ee1ae6c826d882535)
  that were done at [Wekan v2.05](https://github.com/wekan/wekan/blob/devel/CHANGELOG.md#v205-2019-01-27-wekan-release)
  to fix #2143. Thanks to pantraining and xet7.

Thanks to above GitHub users and translators for contributions.

# v2.09 2019-01-28 Wekan release

This release fixes the following bugs with Apache I-CLA, thanks to bentiss:

- [Fix vertical automatic scrolling when opening a card](https://github.com/wekan/wekan/commit/820d3270935dc89f046144a7bbf2c8277e2484bc).

Thanks to GitHub user bentiss for contributions.

# v2.08 2019-01-28 Wekan release

This release fixes the following bugs with Apache I-CLA, thanks to bentiss:

- Make the max height of the swimlane not too big](https://github.com/wekan/wekan/commit/ae82f43078546902e199d985a922ebf7041a4917).
  We take a full screen minus the header height;
- [Properly fix horizontal rendering on Chrome and Firefox](https://github.com/wekan/wekan/commit/7cc185ac57c77be85178f92b1d01d46e20218948).
  This reverts [commit 74cf9e2573](https://github.com/wekan/wekan/commit/74cf9e2573) "- Fix Firefox left-rigth scrollbar."
  This reverts [commit 9dd8216dfb](https://github.com/wekan/wekan/commit/9dd8216dfb)
  "- Fix cards below swimlane title in Firefox" by making
  [previous fix](https://github.com/wekan/wekan/pull/2132/commits/f7c6b7fce237a6dbdbbd6d728cfb11ad3f4378eb)"
  And this partially reverts [commit dd88eb4cc](https://github.com/wekan/wekan/commit/dd88eb4cc).
  The root of the issue was that I was adding a new div and nesting
  the list of lists in this new list. This resulted in some
  weird behavior that Firefox could not handled properly
  Revert to a code colser to v2.02, by just having the
  swimlane header in a separate line, and keep only one
  flex element.
  Fixes #2137

Thanks to GitHub user bentiss for contributions, and translators for their translations.

# v2.07 2019-01-28 Wekan release

This release fixes the following bugs:

- [Fix Firefox left-rigth scrollbar](https://github.com/wekan/wekan/issues/2137).

Thanks to GitHub user xet7 for contributions.

# v2.06 2019-01-27 Wekan release

This release fixes the following bugs:

- [Fix cards below swimlane title in Firefox](https://github.com/wekan/wekan/commit/9dd8216dfb80855999998ed76d8a3c06a954a002)
  by making [previous fix](https://github.com/wekan/wekan/pull/2132/commits/f7c6b7fce237a6dbdbbd6d728cfb11ad3f4378eb)
  Firefox-only.

Thanks to GitHub user xet7 for contributions.

# v2.05 2019-01-27 Wekan release

This release fixes the following bugs partially:

- Add back scrollbars that [were hidden when trying to fix another
  bug](https://github.com/wekan/wekan/pull/2132/commits/f7c6b7fce237a6dbdbbd6d728cfb11ad3f4378eb).
  This makes scrollbars work in Chromium/Chrome, but adds back bug to Firefox
  that cards are below of swimlane title - this Firefox bug is fixed in Wekan v2.06.
- [Try to have some progress on Wekan Sandstorm API](https://github.com/wekan/wekan/commit/be03a191c4321c2f80116c0ee1ae6c826d882535).
  I did not get it fully working yet.

Thanks to GitHub user xet7 for contributions.

# v2.04 2019-01-26 Wekan release

This release fixes the following bugs with Apache I-CLA, thanks to bentiss:

- [Bugfix for swimlanes, simplify setting color, fix rendering on Firefox](https://github.com/wekan/wekan/pull/2132).

Thanks to GitHub user bentiss for contributions, and translators for their translations.

# v2.03 2019-01-25 Wekan NOT RELEASED because of [bug](https://github.com/wekan/wekan/pull/2126#issuecomment-457723923) that was fixed in v2.04 above

This release adds the following new features with Apache I-CLA, thanks to bentiss:

- Change [Swimlane](https://github.com/wekan/wekan/issues/1688)/[List](https://github.com/wekan/wekan/issues/328)/[Card](https://github.com/wekan/wekan/issues/428)
  color with color picker at webbrowser and [REST API](https://github.com/wekan/wekan/commit/5769d438a05d01bd5f35cd5830b7ad3c03a21ed2);
- Lists-Color: [Only colorize the bottom border](https://github.com/wekan/wekan/commit/33977b2282d8891bf507c4d9a1502c644afd6352),
  and make the background clearer to visually separate the header from the list of cards;
- [Change Swimlane to Horizontal](https://github.com/wekan/wekan/commit/dd88eb4cc191a06f7eb84213b026dfb93546f245);
- [Change IFTTT wizard color names to color picker](https://github.com/wekan/wekan/commit/4a2576fbc200d397bcf7cede45316d9fb7e520dd);
- REST API: [Add new card to the end of the list](https://github.com/wekan/wekan/commit/6c3dbc3c6f52a42ddbeeaec9bbfcc82c1c839f7d).
  If we keep the `0` value, the card might be inserted in the middle of the list, making it hard to find it later on.
  Always append the card at the end of the list by setting a sort value based on the number of cards in the list.

and fixes the following bugs with Apache I-CLA, thanks to bentiss:

- [Fix set_board_member_permission](https://github.com/wekan/wekan/commit/082aabc7353d1fe75ccef1a7d942331be56f0838);
- [Fix the sort field when inserting a swimlane or a list](https://github.com/wekan/wekan/commit/b5411841cf6aa33b2c0d29d85cbc795e3faa7f4f).
  This has the side effect of always inserting the element at the end;
- [Make sure Swimlanes and Lists have a populated sort field](https://github.com/wekan/wekan/commit/5c6a725712a443b4d03b4f86262033ddfb66bc3d).
  When moving around the swimlanes or the lists, if one element has a sort
  with a null value, the computation of the new sort value is aborted,
  meaning that there are glitches in the UI.
  This happens on the first swimlane created with the new board, or when
  a swimlane or a list gets added through the API;
- UI: Lists: [Make sure all lists boxes are the same height](https://github.com/wekan/wekan/commit/97d95b4bcbcab86629e368ea41bb9f00450b21f6).
  When `Show card count` is enabled, the lists with the card counts have
  two lines of text while the lists without have only one.
  This results in the box around the list headers are not of the same size
  and this is visible when setting a color to the list.

Thanks to GitHub user bentiss for contributions, and translators for their translations.

# v2.02 2019-01-22 Wekan release

This release adds the following new features with Apache I-CLA, thanks to bentiss:

- [Add per card color: Card / Hamburger menu / Set Color](https://github.com/wekan/wekan/pull/2116) with [color picker](https://github.com/wekan/wekan/pull/2117);
- [OpenAPI and generating of REST API Docs](https://github.com/wekan/wekan/pull/1965);
- [Allow to retrieve full export of board from the REST API](https://github.com/wekan/wekan/pull/2118) through generic authentication.
  When the board is big, retrieving individual cards is heavy for both the server and the number of requests.
  Allowing the API to directly call on export and then treat the data makes the whole process smoother.

and adds the following new features with Apache I-CLA, thanks to xet7 and bentiss:

- [Translate and add color names to IFTTT Rules dropdown](https://github.com/wekan/wekan/commit/44e4df2492b95226f1297e7f556d61b1afaab714), thanks to xet7.
  [Fix to this feature blank item](https://github.com/wekan/wekan/pull/2119), thanks to bentiss.

and adds these updates:

- Update translations. Thanks to translators.
- Added missing translation for 'days'. Thanks to Chartman123.

and fixes these typos;

- Fix typo, changelog year to 2019. Thanks to xorander00.
- Fix License to 2019. Thanks to ajRiverav.

Thanks to above GitHub users for their contributions.

# v2.01 2019-01-06 Wekan release

Update translations. Thanks to translators.

# v2.00 2019-01-04 Wekan release

Update translations. Thanks to translators.

# v1.99 2019-01-04 Wekan release

This release adds the following new features:

- [IFTTT Rules improvements](https://github.com/wekan/wekan/pull/2088). Thanks to Angtrim.
- Add [find.sh](https://github.com/wekan/wekan/blob/devel/find.sh) bash script that ignores
  extra directories when searching. xet7 uses this a lot when developing. Thanks to xet7.

Thanks to above GitHub users for their contributions.

# v1.98 2019-01-01 Wekan release

This release adds the following new features:

- Add optional Nginx reverse proxy config to docker-compose.yml and nginx directory. Thanks to MyTheValentinus.

and fixes the following bugs:

- docker-compose.yml back to MongoDB 3.2.21 because 3.2.22 MongoDB container does not exist yet. Thanks to xet7.
- [Mobile fixes](https://github.com/wekan/wekan/pull/2084), thanks to hupptechnologies:
  - Move home button / avatar bar from bottom to top. So at top first is home button / avatar, then others.
  - When clicking Move Card, go to correct page position. Currently it's at empty page position, and there is
    need to scroll page up to see Move Card options. It should work similarly like Copy Card, that is visible.
  - Also check that other buttons go to visible page.

Thanks to above GitHub users for their contributions.

# v1.97 2018-12-26 Wekan release

This release adds the following new features:

- Upgrade to Node 8.15.0 and MongoDB 3.2.22.
- Stacksmith: back to Meteor 1.6.x based Wekan, because Meteor 1.8.x based is currently broken.

Thanks to GitHub user xet7 for contributions.

# v1.96 2018-12-24 Wekan release

This release adds the following new features:

- [Combine all docker-compose.yml files](https://github.com/wekan/wekan/commit/3f948ba49ba7266c436ff138716bdcae9e879903).

and tries to fix following bugs:

- Revert "Improve authentication", remove login dropdown and "Default Authentication Method" that were added
  in Wekan v1.95 because login did not work with email address.
  It was later found that login did work with username, so later this could be fixed and added back.
- Fixes to docker-compose.yml so that Wekan Meteor 1.6.x version would work.
  Most likely Meteor 1.8.x version is still broken.

Thanks to GitHub user xet7 for contributions.

# v1.95 2018-12-21 Wekan release

This release adds the following new features:

- [Improve authentication](https://github.com/wekan/wekan/pull/2065): remove login dropdown,
  and add setting `DEFAULT_AUTHENTICATION_METHOD=ldap` or
  `sudo snap set wekan default-authentication-method='ldap'`. Thanks to Akuket. Closes wekan/wekan-ldap#31
  NOTE: This was reverted in Wekan v1.96 because login did not work with email address.
  It was later found that login did work with username, so later this could be fixed and added back.
- [Drag handles and long press on mobile when using desktop mode of mobile
  browser](https://github.com/wekan/wekan/pull/2067). Thanks to hupptechnologies.
- Upgrade to node v8.14.1 . Thanks to xet7.

Thanks to above GitHub users for their contributions.

# v1.94 2018-12-18 Wekan release

This release adds the following new features:

- Admin Panel / Layout / Custom HTML after `<body>` start, and Custom HTML before `</body>` end.
  In progress, does not work yet. Thanks to xet7.
- Add Bitnami Stacksmith. In progress test version, that does work, but is not released yet. Thanks to j-fuentes.

Thanks to above GitHub users for their contributions.

# v1.93 2018-12-16 Wekan release

This release adds the following new features:

- In translations, only show name "Wekan" in Admin Panel Wekan version.
  Elsewhere use general descriptions for whitelabeling.

Thanks to GitHub user xet7 and translators for their contributions.

# v1.92 2018-12-16 Wekan release

This release fixes the following bugs:

- Fix [Popup class declares member name _current but use current instead](https://github.com/wekan/wekan/issues/2059). Thanks to peishaofeng.
- Fix [Card scrollbar ignores mousewheel](https://github.com/wekan/wekan-scrollbar/commit/94a40da51627c6322afca50a5b1f4aa55c7ce7bf). Thanks to rinnaz and xet7. Closes #2058
- Fix [favicon paths for non-suburl cases](https://github.com/wekan/wekan/commit/c1733fc89c4c73a1ab3f4054d0a9ebff7741a804). Thanks to xet7. Related #1692

Thanks to above GitHub users for their contributions.

# v1.91 2018-12-15 Wekan release

This release fixes the following bugs:

- [Add back mquandalle:perfect-scrollbar package](https://github.com/wekan/wekan/issues/2057)
  so that Firefox and Chrome stop complaining in browser dev tools console.

Thanks to GitHub users uusijani and xet7 for their contributions.

# v1.90 2018-12-15 Wekan release

This release fixes the following bugs:

- [Remove not working duplicate saveMailServerInfo](https://github.com/wekan/wekan/commit/ab031d9da134aa13490a26dbe97ad2d7d01d534a),
  to remove error from browser dev tools console.

Thanks to GitHub user xet7 for contributions.

# v1.89 2018-12-15 Wekan release

This release adds the following new features:

- Admin Panel / Layout / Custom Product Name [now changes webpage title](https://github.com/wekan/wekan/commit/dbb1a86ca377e551063cc04c5189fad4aa9148c0).
  Related #1196

Thanks to GitHub user xet7 for contributions.

# v1.88 2018-12-14 Wekan release

This release fixes the following bugs:

- Fix: [Scrollbar used](https://github.com/wekan/wekan/issues/2056) [remote file from CDN](https://github.com/MaazAli/Meteor-Malihu-Custom-Scrollbar/blob/master/jquery.mCustomScrollbar.js#L50),
  so forked package to https://github.com/wekan/wekan-scrollbar and included
  non-minified file locally to Wekan, so that using scrollbar works without direct connection
  to Internet. Wekan should not load any external files by default, as was case before
  new scrollbar, and is again now [after this fix](https://github.com/wekan/wekan/commit/c546464d9f56117a8bf580512cd62fc1102559c3).

Thanks to GitHub user xet7 for contributions.

# v1.87 2018-12-13 Wekan release

This release fixes the following bugs:

- Fix Reference error.

Thanks to GitHub user Akuket for contributions.

# v1.86 2018-12-13 Wekan release

This release fixes the following bugs:

- Fix [Cannot login with new LDAP account when auto-registration disabled (request invitation code)](https://github.com/wekan/wekan-ldap/issues/29);
- Fix [Unable to create new account from LDAP](https://github.com/wekan/wekan-ldap/issues/32).

Thanks to GitHub user Akuket for contributions.

# v1.85 2018-12-09 Wekan release

This release fixes the following bugs:

- Fix [Clicking the scrollbar closes the card on Chrome](https://github.com/wekan/wekan/issues/1404)
  by changing [mquandalle:perfect-scrollbar to malihu-jquery-custom-scrollbar](https://github.com/wekan/wekan/pull/2050).
  that works also when clicking scrollbar in Chrome. Also added back required packages that were removed in PR.

Thanks to GitHub users hupptechnologies and xet7 for their contributions.

# v1.84 2018-12-07 Wekan release

This release fixes the following bugs:

- Fix 2/8: IFTTT Rule action/trigger ["Remove all members from the card"](https://github.com/wekan/wekan/issues/1972).

Thanks to GitHub user BurakTuran9 for contributions.

# v1.83 2018-12-06 Wekan release

This release fixes the following bugs:

- Fix 1/8: IFTTT Rule action/trigger [When a checklist is completed](https://github.com/wekan/wekan/issues/1972).
  And partial incomplete fix to when all of checklist is set as uncompleted. Help in fixing welcome.

Thanks to GitHub users BurakTuran9 and xet7 for their contributions.

# v1.82 2018-12-05 Wekan release

This release fixes the following bugs:

- Partially #2045 revert [Improve authentication](https://github.com/wekan/wekan/issues/2016),
  adding back password/LDAP dropdown, because login did now work.
  NOTE: This was added in v1.71, reverted at v1.73 because login did not work, added back at v1.79,
  and then reverted partially at v1.82 because login did not work.
  Related LDAP logout timer does not work yet.

Thanks to GitHub user xet7 for contributions.

# v1.81 2018-12-04 Wekan release

This release fixes the following bugs:

- Remove extra commas `,` and add missing backslash `\`.
  Maybe after that login, logout and CORS works.

Thanks to GitHub user xet7 for contributions.

Related #2045,
related wekan/wekan-snap#69

# v1.80 2018-12-03 Wekan release

This release adds the following new features:

- Upgrade Node from v8.12 to v8.14

and fixes the following bugs:

- Revert non-working architectures that were added at v1.79, so now Wekan is just amd64 as before.

Thanks to GitHub user xet7 for contributions.

# v1.79 2018-12-03 Wekan release

This release adds the following new features:

- [Improve authentication, removing Login password/LDAP dropdown](https://github.com/wekan/wekan/issues/2016).
  NOTE: This was added in v1.71, then reverted at v1.73 because login did not work, and after fix added back at v1.79.
  Thanks to Akuket.
- Thanks to xet7:
  - Build snap also on i386, armhf and arm64. Ignore if it fails. More fixes will be added later.
  - Add CORS https://enable-cors.org/server_meteor.html to Standalone Wekan settings.
  - Add missing LDAP and TIMER environment variables.

and fixes the following bugs:

- Fix: Message box for deleting subtask unreachable.
  Thanks to hupptechnologies. Closes #1800
- Fix wrong dates in ChangeLog. Thanks to kelvinhammond.

Thanks to above GitHub users for their contributions.

# v1.78 2018-11-20 Wekan release

- Update translations (de).

# v1.77 2018-11-20 Wekan release

- Update version number. Trying to get Snap automatic review working, so that
  it would accept new Wekan release.

# v1.76 2018-11-20 Wekan release

This release adds the following new features:

- Add [LDAP_FULLNAME_FIELD](https://github.com/wekan/wekan-ldap/issues/10) to
  [configs](https://github.com/wekan/wekan/commit/8e3f53021775069dba125efd4b7200d0d70a1ed1)
  and other options that were not in all config files. Thanks to alkemyst and xet7.

and fixes the following bugs:

- Fix: When saving Custom Layout, save also SMTP settings. Thanks to xet7.

Thanks to above GitHub users for their contributions.

# v1.75 2018-11-20 Wekan release

This release adds the following new features:

- Admin Panel / Layout: Hide Logo: Yes / No. This does hide Wekan logo on Login page and Board page. Thanks to xet7.

and fixes the following bugs:

- [Fix Snap database-list-backups command](https://github.com/wekan/wekan-snap/issues/26). Thanks to WaryWolf.

Thanks to above GitHub users for their contributions.

# v1.74.1 2018-11-18 Wekan Edge release

This release adds the following new features:

- [Full Name from LDAP server via environment variable](https://github.com/wekan/wekan-ldap/pull/18).

Thanks to GitHub user alkemyst for contributions.

# v1.74 2018-11-17 Wekan release

- Update version number to get this released to snap. Thanks to xet7.

# v1.73 2018-11-17 Wekan release

This release fixes the following bugs:

- Revert Improve authentication to [fix Login failure](https://github.com/wekan/wekan/issues/2004).
  NOTE: This was added in v1.71, then reverted at v1.73 because login did not work, and after fix added back at v1.79.

Thanks to GitHub users Broxxx3 and xet7 for their contributions.

# v1.72 2018-11-17 Wekan release

- Update translations (fi).

# v1.71 2018-11-17 Wekan release

This release adds the following new features and bugfixes:

- Add languages, thanks to translators:
  - Danish
  - Swahili / Kiswahili
- Rename Recycle Bin to Archive. Thanks to xet7.
- Update readme for clarity. Thanks to xet7.
- [Improve authentication](https://github.com/wekan/wekan/pull/2003), thanks to Akuket:
  - Removing the select box: Now it just checks the user.authenticationMethod value to choose the authentication method.
  - Adding an option to choose the default authentication method with env var.
  - Bug fix that allowed a user to connect with the password method while his user.authenticationMethod is "ldap" for example.
  - Adding a server-side method which allows disconnecting a user after a delay defined by env vars.
  - NOTE: This was added in v1.71, then reverted at v1.73 because login did not work, and after fix added back at v1.79.
- [Improve shell scripts](https://github.com/wekan/wekan/pull/2002). Thanks to warnerjon12.

Thanks to above GitHub users and translators for their contributions.

# v1.70 2018-11-09 Wekan release

This release adds the following new features:

- [Auto create Custom Field to all cards. Show Custom Field Label on
   minicard](https://github.com/wekan/wekan/pull/1987).

and fixes the following bugs:

- Some fixes to Wekan import, thanks to xet7:
  - isCommentOnly and isNoComments are now optional
  - Turn off import error checking, so something is imported anyway, and import does not stop at error.
  - Now most of Sandstorm export do import to Standalone Wekan, but some of imported cards, dates etc are missing.
  - Sandstorm Import Wekan board warning messages are now translateable. But bug "Board not found" still exists.
- LDAP: Added INTERNAL_LOG_LEVEL. Fix lint and ldap group filter options. Thanks to Akuket.

Thanks to above mentioned GitHub users for their contributions.

# v1.69 2018-11-03 Wekan release

- Update translations.

# v1.68 2018-11-03 Wekan release

- Update translations.

# v1.67 2018-11-03 Wekan release

This release adds the following new features to all Wekan platforms:

- Add Hindi language. Thanks to saurabharch.

and hides the following features at Sandstorm:

- Hide Linked Card and Linked Board on Sandstorm, because they are only
  useful when having multiple boards, and at Sandstorm
  there is only one board per grain. Thanks to ocdtrekkie and xet7. Closes #1982

Thanks to above mentioned GitHub users for their contributions.

# v1.66 2018-10-31 Wekan release

This release fixes the following bugs:

- docker-compose.yml and docker-compose-build.yml, thanks to xet7:
  - Remove single quotes, because settings are quoted automatically.
  - Comment out most settings that have default values.
- Fix typos in CHANGELOG.md, thanks to Hillside502 and loginKing.
- [Fix typo about ldaps](https://github.com/wekan/wekan/pull/1980).
  Documentation said to set LDAP_ENCRYPTION to true if we want to use
  ldaps, but the code in wekan-ldap does not check if it is set to true,
  but if the value equals to 'ssl' instead. Thanks to imkwx.

Thanks to above mentioned GitHub users for their contributions.

# v1.65 2018-10-25 Wekan release

This release adds the [following new features](https://github.com/wekan/wekan/pull/1967), with Apache I-CLA:

- UI: list headers: show the card count smaller in grey color below list name
- UI: lists: only output the number of cards for each swimlane

Thanks to GitHub user bentiss for contributions.

# v1.64.2 2018-10-25 Wekan Edge release

This release fixes the following bugs:

- Additional fix to [Impossible to connect to LDAP if UserDN contain space(s)](https://github.com/wekan/wekan/issues/1970).

Thanks to GitHub users Akuket and xet7 for their contributions.

# v1.64.1 2018-10-25 Wekan Edge release

This release fixes the following bugs:

- [Impossible to connect to LDAP if UserDN contain space(s)](https://github.com/wekan/wekan/issues/1970).

Thanks to GitHub users Akuket and xet7 for their contributions.

# v1.64 2018-10-24 Wekan release

- Update translations.

# v1.63 2018-10-24 Wekan release

This release adds the following new features:

REST API: [Allow to remove the full list of labels/members through the API](https://github.com/wekan/wekan/pull/1968), with Apache I-CLA:

- [Models: Cards: an empty string in members or label deletes the list](https://github.com/wekan/wekan/commit/e5949504b7ed42ad59742d2a0aa001fe6c762873).
  There is currently no way to remove all members or all labels attached
  to a card. If an empty string is provided, we can consider as a hint to
  remove the list from the card.
- [Models: Cards: allow singletons to be assigned to members and labelIds](https://github.com/wekan/wekan/commit/2ce1ba37a1d0a09f8b3d2a1db4c8a11d1f98caa0).
  If we need to set only one member or one label, the data provided will
  not give us an array, but the only element as a string.
  We need to detect that and convert the parameter into an array.

Thanks to GitHub user bentiss for contributions.

# v1.62 2018-10-24 Wekan release

- Fix missing dropdown arrow on Chrome. Thanks to xet7. Closes #1964

# v1.61 2018-10-24 Wekan release

- Fix lint error. Thanks to xet7.

# v1.60 2018-10-24 Wekan release

- Update translations.

# v1.59 2018-10-24 Wekan release

This release adds the beginning of following new features:

- Custom Product Name in Admin Panel / Layout. In Progress, setting does not affect change UI yet. Thanks to xet7.

and fixes the following bugs:

- Fix LDAP User Search Scope. Thanks to Vnimos and Akuket. Related #119
- Fix Save Admin Panel SMTP password. Thanks to saurabharch and xet7. Closes #1856

Thanks to above mentioned GitHub users for contributions.

# v1.58 2018-10-23 Wekan release

This release adds the [following new features and fixes](https://github.com/wekan/wekan/pull/1962), with Apache I-CLA:

- Also export the cards created with an older wekan instance (without linked cards) (related to #1873);
- Fix the GET customFields API that was failing;
- Allow to directly overwrite the members of cards and boards with a PUT call (this avoids to do multiple calls to add and remove users);
- Allow to change the swimlane of a card from the API.

Thanks to GitHub user bentiss for contributions.

# v1.57 2018-10-23 Wekan release

This release adds the following new features:

- Merge edge into stable. This brings LDAP, Rules, Role "No Comments", etc.
- Go back to Meteor 1.6.x and MongoDB 3.2.21 that works in Snap etc.

Thanks to GitHub user xet7 for contributions.

# v1.55.1 2018-10-16 Wekan Edge release

This release adds the following new features:

- [Automatically close the sidebar](https://github.com/wekan/wekan/pull/1954).

and fixes the following bugs:

- [LDAP: Include missing LDAP PR so that LDAP works](https://github.com/wekan/wekan-ldap/pull/6);
- [Improve notifications](https://github.com/wekan/wekan/pull/1948);
- [Fix deleting Custom Fields, removing broken references](https://github.com/wekan/wekan/issues/1872);
- [Fix vertical text for swimlanes in IE11](https://github.com/wekan/wekan/issues/1798);
- [Update broke the ability to mute notifications](https://github.com/wekan/wekan/pull/1954).

Thanks to GitHub users Akuket, Clement87 and tomodwyer for their contributions.

# v1.53.9 2018-10-11 Wekan Edge release

This release adds the following new features:

- docker-compose.yml in this Edge branch now works with Wekan Edge + Meteor 1.8.1-beta.0 + MongoDB 4.0.3;
- [Snap is still broken](https://forum.snapcraft.io/t/how-to-connect-to-localhost-mongodb-in-snap-apparmor-prevents/7793/2). Please use latest Snap release on Edge branch, until this is fixed.

Thanks to GitHub user xet7 for contributions.

# v1.53.8 2018-10-10 Wekan Edge release

This release tries to fix the following bugs:

- Try to fix Docker.

Thanks to GitHub user xet7 for contributions.

# v1.53.7 2018-10-10 Wekan Edge release

This release adds the following new features:

- Try MongoDB 4.0.3

Thanks to GitHub user xet7 for contributions.

# v1.53.6 2018-10-10 Wekan Edge release

This release adds the following new features:

- [Add LDAP to Snap Help](https://github.com/wekan/wekan/commit/809c8f64f69721d51b7d963248a77585867fac53).

and tries to fix the following bugs:

- Try to fix snap.

Thanks to GitHub users Akuket and xet7 for their contributions.

# v1.53.5 2018-10-10 Wekan Edge relase

This release tries to fix the following bugs:

- Try to fix snap.

Thanks to GitHub user xet7 for contributions.

# v1.53.4 2018-10-10 Wekan Edge release

This release adds the following new features:

- [Upgrade Hoek](https://github.com/wekan/wekan/commit/0b971b6ddb1ffc4adad6b6b09ae7f42dd376fe2c).

Thanks to GitHub user xet7 for contributions.

# v1.53.3 2018-10-10 Wekan Edge release

This release adds the following new features:

- [Upgrade](https://github.com/wekan/wekan/issues/1522) to [Meteor](https://blog.meteor.com/meteor-1-8-erases-the-debts-of-1-7-77af4c931fe3) [1.8.1-beta.0](https://github.com/meteor/meteor/issues/10216).
  with [these](https://github.com/wekan/wekan/commit/079e45eb52a0f62ddb6051bf2ea80fac8860d3d5)
  [commits](https://github.com/wekan/wekan/commit/dd47d46f4341a8c4ced05749633f783e88623e1b). So now it's possible to use MongoDB 2.6 - 4.0.

Thanks to GitHub user xet7 for contributions.

# v1.53.2 2018-10-10 Wekan Edge release

This release adds the following new features:

- [Add LDAP package to Docker and Snap](https://github.com/wekan/wekan/commit/f599391419bc7422a6ead52cdefc7d380e787897).

Thanks to GitHub user xet7 for contributions.

# v1.53.1 2018-10-10 Wekan Edge release

This release adds the following new features:

- [LDAP](https://github.com/wekan/wekan/commit/288800eafc91d07f859c4f59588e0b646137ccb9).
  Please test and [add info about bugs](https://github.com/wekan/wekan/issues/119);
- [Add LDAP support and authentications dropdown menu on login page](https://github.com/wekan/wekan/pull/1943);
- [REST API: Get cards by swimlane id](https://github.com/wekan/wekan/pull/1944). Please [add docs](https://github.com/wekan/wekan/wiki/REST-API-Swimlanes).

and fixes the following bugs:

- [OpenShift: Drop default namespace value and duplicate WEKAN_SERVICE_NAME parameter.commit](https://github.com/wekan/wekan/commit/fcc3560df4dbcc418c63470776376238af4f6ddc);
- [Fix Card URL](https://github.com/wekan/wekan/pull/1932);
- [Add info about root-url to GitHub issue template](https://github.com/wekan/wekan/commit/4c0eb7dcc19ca9ae8c5d2d0276e0d024269de236);
- [Feature rules: fixes and enhancements](https://github.com/wekan/wekan/pull/1936).

Thanks to GitHub users Akuket, Angtrim, dcmcand, lberk, maximest-pierre, InfoSec812, schulz and xet7 for their contributions.

# v1.52.1 2018-10-02 Wekan Edge release

This release adds the following new features:

- REST API: [Add member with role to board. Remove member from board](https://github.com/wekan/wekan/commit/33caf1809a459b136b671f7061f08eb5e8d5e920).
  [Docs](https://github.com/wekan/wekan/wiki/REST-API-Role). Related to [role issue](https://github.com/wekan/wekan/issues/1861).

and reverts previous change:

- OAuth2: [Revert Oidc preferred_username back to username](https://github.com/wekan/wekan/commit/33caf1809a459b136b671f7061f08eb5e8d5e920).
  This [does not fix or break anything](https://github.com/wekan/wekan/issues/1874#issuecomment-425179291),
  Oidc already works with [doorkeeper](https://github.com/doorkeeper-gem/doorkeeper-provider-app).

Thanks to GitHub user xet7 for contributions.

# v1.51.2 2018-09-30 Wekan Edge release

This release adds the following new features:

- [REST API: Change role of board member](https://github.com/wekan/wekan/commit/51ac6c839ecf2226b2a81b0d4f985d3b942f0938).
  Docs: https://github.com/wekan/wekan/wiki/REST-API-Role

Thanks to GitHub users entrptaher and xet7 for their contributions.

# v1.51.1 2018-09-28 Wekan Edge release

This release adds the following new features:

- [Add CAS with attributes](https://github.com/wekan/wekan/commit/bd6e4a351b984b032e17c57793a70923eb17d8f5);
- [Move Add Board button to top left, so there is no need to scroll to bottom when there is a lot of boards](https://github.com/wekan/wekan/commit/fb46a88a0f01f7f74ae6b941dd6f2060e020f09d).

Thanks to GitHub users ppoulard and xet7 for their contributions.

# v1.50.3 2018-09-23 Wekan Edge release

This release tries to fix the following bugs:

- [Remove "Fix Cannot setup mail server via snap variables"](https://github.com/wekan/wekan/commit/6d88baebc7e297ffdbbd5bb6971190b18f79d21f)
  to see does Wekan Snap start correctly after removing it.

Thanks to GitHub user xet7 for contributions.

# v1.50.2 2018-09-23 Wekan Edge release

This release tries to fix the following bugs:

- Build Wekan and release again, to see does it work.

Thanks to GitHub user xet7 for contributions.

# v1.50.1 2018-09-22 Wekan Edge release

This release adds the following new features:

- [Change from Node v8.12.0 prerelease to use official Node v8.12.0](https://github.com/wekan/wekan/commit/7ec7a5f27c381e90f3da6bddc3773ed87b1c1a1f).

and fixes the following bugs:

- [Fix Dockerfile Meteor install by changing tar to bsdtar](https://github.com/wekan/wekan/commit/1bad81ca86ca87c02148764cc03a3070882a8a33);
- Add [npm-debug.log and .DS_Store](https://github.com/wekan/wekan/commit/44f4a1c3bf8033b6b658703a0ccaed5fdb183ab4) to .gitignore;
- [Add more debug log requirements to GitHub issue template](https://github.com/wekan/wekan/commit/1c4ce56b0f18e00e01b54c7059cbbf8d3e196154);
- [Add default Wekan Snap MongoDB bind IP 127.0.0.1](https://github.com/wekan/wekan/commit/6ac726e198933ee41c129d22a7118fcfbf4ca9a2);
- [Fix Feature Rules](https://github.com/wekan/wekan/pull/1909);
- [Fix Cannot setup mail server via snap variables](https://github.com/wekan/wekan/issues/1906);
- [Try to fix OAuth2: Change oidc username to preferred_username](https://github.com/wekan/wekan/commit/734e4e5f3ff2c3dabf94c0fbfca561db066c4565).

Thanks to GitHub users Angtrim, maurice-schleussinger, suprovsky and xet7 for their contributions.

# v1.49.1 2018-09-17 Wekan Edge release

This release adds the following new features:

- Change from Node v8.12.0 prerelease to use official Node v8.12.0.

Thanks to GitHub user xet7 for contributions.

# v1.49 2018-09-17 Wekan release

This release fixes the following bugs:

- Fix lint errors.

Thanks to GitHub user xet7 for contributions.

# v1.48 2018-09-17 Wekan release

This release removes the following new features:

- Remove IFTTT rules, until they are fixed.
- Remove OAuth2, until it is fixed.

Thanks to GitHub user xet7 for contributions.

# v1.47 2018-09-16 Wekan release

This release adds the following new features:

- [IFTTT Rules](https://github.com/wekan/wekan/pull/1896). Useful to automate things like
  [adding labels, members, moving card, archiving them, checking checklists etc](https://github.com/wekan/wekan/issues/1160).
  Please test and report bugs. Later colors need to be made translatable.

Thanks to GitHub users Angtrim and xet7 for their contributions.

# v1.46 2018-09-15 Wekan release

This release adds the following new features:

- [Upgrade MongoDB to 3.2.21](https://github.com/wekan/wekan/commit/0cb3aee803781e4241c38a3e1e700703d063035a);
- [Add source-map-support](https://github.com/wekan/wekan/issues/1889);
- [Allow Announcement to be markdown](https://github.com/wekan/wekan/issues/1892).
  Note: xet7 did not yet figure out how to keep announcement on one line
  when markdown was added, so now Font Awesome icons are above and below.

and fixes the following bugs:

- [Turn of http/2 in Caddyfile](https://github.com/wekan/wekan/commit/f1ab46d5178b6fb7e9c4e43628eec358026d287a)
  so that Firefox Inspect Console does not [show errors about wss](https://github.com/wekan/wekan/issues/934)
  websocket config. Chrome web console supports http/2.
  Note: If you are already using Caddy and have modified your Caddyfile, you need to edit your Caddyfile manually.
- [Partially fix: Cannot move card from one swimline to the other if moving in the same list](https://github.com/wekan/wekan/issues/1887);
- [Fix: Linking cards from empty board is possible and makes current board not load anymore](https://github.com/wekan/wekan/issues/1885).

Thanks to GitHub users andresmanelli, HLFH and xet7 for their contributions.

# v1.45 2018-09-09 Wekan release

This release fixes the following bugs:

- [Fix lint error](https://github.com/wekan/wekan/commit/45c0343f45b4cfc06d83cf357ffb50d6fca2f23b).

Thanks to GitHub user xet7 for contributions.

# v1.44 2018-09-09 Wekan release

This release adds the following new features:

- REST API: [Add startAt/dueAt/endAt etc](https://github.com/wekan/wekan/commit/1e0fdf8abc10130ea3c50b13ae97396223ce7fa9).
  Docs at https://github.com/wekan/wekan/wiki/REST-API-Cards
- [Fix cards export and add customFields export](https://github.com/wekan/wekan/pull/1886).

Thanks to GitHub users ymeramees and xet7 for their contributions.

# v1.43 2018-09-06 Wekan release

This release fixes the following bugs:

- [Fix "No Comments" permission on Wekan and Trello import](https://github.com/wekan/wekan/commit/0a001d505d81961e6bd6715d885fffee0adb702d).

Thanks to GitHub user xet7 for contributions.

# v1.42 2018-09-06 Wekan release

This release adds the following new features:

- REST API: [Create board options to be modifiable](https://github.com/wekan/wekan/commit/9cea76e4efaacaebcb2e9f0690dfeb4ef6d62527),
  like permissions, public/private board - now private by default,
  and board background color.
  Docs at https://github.com/wekan/wekan/wiki/REST-API-Boards
- [Add swimlaneId in activity. Create default swimlaneId in API](https://github.com/wekan/wekan/pull/1876).

Thanks to GitHub users andresmanelli and xet7 for their contributions.

# v1.41 2018-09-05 Wekan release

This release tries to fix the following bugs:

- [Try to fix Wekan Sandstorm API](https://github.com/wekan/wekan/issues/1279#issuecomment-418440401).

Thanks to GitHub users ocdtrekkie and xet7 for their contributions.

# v1.40 2018-09-04 Wekan release

This release adds the following new features:

- [Add permission "No comments"](https://github.com/wekan/wekan/commit/77efcf71376d3da6c19ad1a4910567263e83c0ca).
  It is like normal user, but [does not show comments and activities](https://github.com/wekan/wekan/issues/1861).

Thanks to GitHub user xet7 for contributions.

# v1.39 2018-08-29 Wekan release

This release fixes the following bugs:

- [Only allow ifCanModify users to add dates on cards](https://github.com/wekan/wekan/pull/1867).

Thanks to GitHub user rjevnikar for contributions.

# v1.38 2018-08-29 Wekan release

This release adds the following new features:

- Add [msavin:userCache](https://github.com/msavin/userCache) to speedup Wekan.
  See [meteor forums post](https://forums.meteor.com/t/introducing-a-new-approach-to-meteor-user-this-simple-trick-can-save-you-millions-of-database-requests/45336/7).

and fixes the following bugs:

- [Fix Delete Board](https://github.com/wekan/wekan/commit/534b20fedac9162d2d316bd74eff743d636f2b3d).

Thanks to GitHub users msavin, rjevnikar and xet7 for their contributions.

# v1.37 2018-08-28 Wekan release

This release fixes the following bugs:

- [Add Missing Index on cards.parentId since Swimlane integration
  to speedup Wekan](https://github.com/wekan/wekan/issues/1863);
- [Update OpenShift template to add Route and parameterize](https://github.com/wekan/wekan/pull/1865);
- [Fix typos in Wekan snap help](https://github.com/wekan/wekan/commit/0c5fc6d7fd899a6bc67a446ab43e53290d8571e4).

Thanks to GitHub users Clement87, InfoSec812 and xet7 for their contributions.

# v1.36 2018-08-25 Wekan release

This release adds the following new features:

- [OAuth2 Login on Standalone Wekan](https://github.com/wekan/wekan/wiki/OAuth2). For example, Rocket.Chat can provide OAuth2 login to Wekan.
  Also, if you have Rocket.Chat using LDAP/SAML/Google/etc for logging into Rocket.Chat, then same users can login to Wekan when
  Rocket.Chat is providing OAuth2 login to Wekan.

and fixes the following bugs:

- [Move labels back to original place at minicard](https://github.com/wekan/wekan/issues/1842);
- [Fix typos in security documentation](https://github.com/wekan/wekan/pull/1857).

Thanks to GitHub users hever, salleman33, tlevine and xet7 for their contributions.

# v1.35 2018-08-23 Wekan release

This release adds the following new features:

Add Caddy plugins:
- [http.filter](https://caddyserver.com/docs/http.filter)
  for changing Wekan UI on the fly, for example custom logo,
  or changing to all different CSS file to have custom theme;
- [http.ipfilter](https://caddyserver.com/docs/http.ipfilter)
  to block requests by ip address;
- [http.realip](https://caddyserver.com/docs/http.realip)
  for showing real X-Forwarded-For IP to behind proxy;
- Turn off Caddy telemetry.

Add configuring webhooks:
- [Make the attributes that the webhook sends configurable](https://github.com/wekan/wekan/pull/1852).

Thanks to Caddy contributors, and Github users omarsy and xet7 for their contributions.

# v1.34 2018-08-22 Wekan release

This release add the following new features:

- [Add Favicon for pinned tab on Safari browser](https://github.com/wekan/wekan/issues/1795).

and fixes the following bugs:

- [Restored SMTP settings at Admin Panel, and disabled showing password](https://github.com/wekan/wekan/issues/1790);
- [Move color labels on minicard to bottom of minicard](https://github.com/wekan/wekan/issues/1842);
- [Fix and improve linked cards](https://github.com/wekan/wekan/pull/1849);
- [Allow Sandstorm to serve Wekan HTTP API](https://github.com/wekan/wekan/pull/1851);

Thanks to GitHub users andresmanelli, ocdtrekkie, therampagerado, woodyart and xet7 for their contributions.

# v1.33 2018-08-16 Wekan release

This release fixes the following bugs:

- [Change default value of label ids](https://github.com/wekan/wekan/pull/1837).

Thanks to GitHub user omarsy for contributions.

# v1.32 2018-08-16 Wekan release

This release fixes the following bugs:

- [Content Policy: Allow inline scripts, otherwise there is errors in browser/inspect/console](https://github.com/wekan/wekan/commit/807c6ce09e4b5d49049d343d73bbca24fa84d527);
- [Use only framing policy, not all of content policy](https://github.com/wekan/wekan/commit/b3005f828dbf69bdf174d4bcd7654310fa9e0968);
- [Set default matomo settings to disabled](https://github.com/wekan/wekan/commit/807c6ce09e4b5d49049d343d73bbca24fa84d527);
- Fix [hidden](https://github.com/wekan/wekan/commit/be00465e67931f2a5655ed47f6e075ed1c589f54)
  [system](https://github.com/wekan/wekan/commit/9fc3de8502919f9aeb18c9f8ea3b0678b66ce176) [messages](https://github.com/wekan/wekan/issues/1830);
- Fix [Requested By](https://github.com/wekan/wekan/commit/e55d7e4f72a4b425c4aca5ba04a7be1fc642649b) and
  [Assigned By](https://github.com/wekan/wekan/commit/5c33a8534186920be642be8e2ac17743a54f16db) [fields](https://github.com/wekan/wekan/issues/1830);
- [Fix Date and Time Formats are only US in every language](https://github.com/wekan/wekan/commit/b3005f828dbf69bdf174d4bcd7654310fa9e0968).

Thanks to GitHub users andresmanelli and xet7 for their contributions.

# v1.31 2018-08-14 Wekan release

This release fixes the following bugs:

- [Export of Board does not work on Docker](https://github.com/wekan/wekan/issues/1820).

Thanks to GitHub user xet7 for contributions.

# v1.30 2018-08-14 Wekan release

This release add the following new features:

- [When Content Policy is enabled, allow one URL to have iframe that embeds Wekan](https://github.com/wekan/wekan/commit/b9929dc68297539a94d21950995e26e06745a263);
- [Add option to turn off Content Policy](https://github.com/wekan/wekan/commit/b9929dc68297539a94d21950995e26e06745a263);
- [Allow always in Wekan markdown `<img src="any-image-url-here">`](https://github.com/wekan/wekan/commit/b9929dc68297539a94d21950995e26e06745a263).

and fixes the following bugs:

- [Fix Import from Trello error 400](https://github.com/wekan/wekan/commit/2f557ae3a558c654cc6f3befff22f5ee4ea6c3d9).

Thanks to GitHub user xet7 for contributions.

# v1.29 2018-08-12 Wekan release

This release fixes the following bugs:

- [Revert Fix lint errors, that caused breakage](https://github.com/wekan/wekan/commit/b015b5b7240f5fb5a715843dce5d35907345eb4a).

Thanks to GitHub user xet7 for contributions.

# v1.28 2018-08-12 Wekan release

This release fixes the following bugs:

- [Fix lint errors](https://github.com/wekan/wekan/commit/f5515cb95fc93882e5e1098d6043267b9260b9d7).

Thanks to GitHub user xet7 for contributions.

# v1.27 2018-08-12 Wekan release

This release add the following new features:

- [Linked Cards and Linked Boards](https://github.com/wekan/wekan/pull/1592).

Thanks to GitHub user andresmanelli for contributions.

# v1.26 2018-08-09 Wekan release

This release fixes the following bugs:

- [Set WITH_API=true setting on Sandstorm, and so that export works](https://github.com/wekan/wekan/commit/a300b73d56750a1a5645767d375be60839314e84);
- [Set Matomo blank settings on Sandstorm](https://github.com/wekan/wekan/commit/acd105e61b9dca5a78354047bbc23b0a01e71d8c).

Thanks to GitHub user xet7 for contributions.

# v1.25 2018-08-09 Wekan release

This release fixes the following bugs:

- [Fix showing only the cards of the current board in calendar view](https://github.com/wekan/wekan/pull/1822).

Thanks to GitHub user Yanonix for contributions.

# v1.24 2018-08-09 Wekan release

This release add the following new features:

- [Update node to v8.12.0 prerelease build](https://github.com/wekan/wekan/commit/04d7c47f4ca990311079be8dd6dc383448ee342f).

and fixes the following bugs:

- [Enable Wekan API by default, so that Export Board to JSON works](https://github.com/wekan/wekan/commit/b2eeff96977592deaeb23a8171fc3b13f8c6c5dc);
- [Fix the flagging of dates](https://github.com/wekan/wekan/pull/1814);
- [Use new WITH_API and Matomo env variables at Dockerfile](https://github.com/wekan/wekan/issues/1820);
- For OpenShift compliance, [change](https://github.com/wekan/wekan/commit/53d545eeef7e796bd910f7cce666686ca05de544)
  [run user](https://github.com/wekan/wekan/pull/1816)
  and [Docker internal port to 8080](https://github.com/wekan/wekan/commit/95b21943ee7a9fa5a27efe5276307febc2fbad94).

Thanks to GitHub users rjevnikar, tdemaret, xadagaras and xet7 for their contributions.

# v1.23 2018-07-30 Wekan release

This release tries to fix the following bugs:

- Checking for [existing](https://github.com/wekan/wekan/commit/a48f560a85860451914dbaad8cae6ff5120a0c38)
  [directories](https://github.com/wekan/wekan/commit/5bfb6c6411c928bfffa7ed6fe829f030e3ea57da) when
  building snap etc, trying to [get snap to build somehow](https://github.com/wekan/wekan-snap/issues/58).
  This is just a test, does it build this time correctly.

Thanks to GitHub user xet7 for contributions.

# v1.22 2018-07-30 Wekan release

This release adds the following new features:

- [Backup script now uses mongodump from snap to
   do backups](https://github.com/wekan/wekan/wiki/Backup);
- [Integration of Matomo](https://github.com/wekan/wekan/pull/1806);
- [Enable/Disable API with env var](https://github.com/wekan/wekan/pull/1799).

Thanks to GitHub user Akuket and xet7 for their contributions.

# v1.21 2018-07-18 Wekan release

This release adds the following new features:

- [Add logo from Wekan website to login logo](https://github.com/wekan/wekan/commit/4eed23afe06d5fab8d45ba3decc7c1d3b85efbd8).

and fixes the following bugs:

- [Allow to resend invites](https://github.com/wekan/wekan/pull/1785).

Thanks to GitHub users Akuket and xet7 for their contributions.

# v1.20 2018-07-18 Wekan release

This release fixes the following bugs:

- [Remove SMTP settings from Admin Panel, because they are set in environment
   variable settings like source/snap/docker already, and password was
   exposed in plain text](https://github.com/wekan/wekan/issues/1783);
- [Added info how to limit snap to root
   user](https://github.com/wekan/wekan-snap/wiki/Limit-snap-to-root-user-only);
- [Add scrolling to long cards](https://github.com/wekan/wekan/pull/1782).

Thanks to GitHub users jnso, LyR33x and xet7 for their contributions.

# v1.19 2018-07-16 Wekan release

This release adds the following new features:

- [Build from source on macOS](https://github.com/wekan/wekan/wiki/Mac);
- [Wekan integration with OpenShift](https://github.com/wekan/wekan/pull/1765);
- [Snap Caddy: set -agree flag for Let's Encrypt](https://github.com/wekan/wekan-snap/issues/54).

and fixes the following mobile bugs:

- [Fix missing utility function](https://github.com/wekan/wekan/commit/5c774070617357c25c7bb35b43f4b122eb4b3e34);
- [Avoid default behavior](https://github.com/wekan/wekan/commit/9c204d9bbe4845bc3e352e839615dfb782a753f4);
- [Hotfix more sortable elements](https://github.com/wekan/wekan/commit/616dade81c25b10fc409aee1bcc9a93ddbfee81b);
- [Hotfix for mobile device](https://github.com/wekan/wekan/commit/43d86d7d5d3f3b34b0500f6d5d3afe7bd86b0060).

and fixes the following bugs:

- [Fix invitation code](https://github.com/wekan/wekan/pull/1777).

Thanks to GitHub users adyachok, Akuket, halunk3, Haocen and xet7 for their contributions.

# v1.18 2018-07-06 Wekan release

This release fixes the following bugs:

- Fix [Title is required](https://github.com/wekan/wekan/issues/1576)
  by [setting Checklist title during migration](https://github.com/wekan/wekan/issues/1753).

Thanks to GitHub users centigrade-kdk and xet7 for their contributions.

# v1.17 2018-07-06 Wekan release

This release adds the following new features:

- [Made Subtask Settings visible at Board menu at Sandstorm](https://github.com/wekan/wekan/commit/884cd0e6b888edc9752cbed80e7ac75e2ce232de).

Thanks to GitHub user xet7 for contributions.

# v1.16 2018-07-06 Wekan release

This release fixes the following bugs:

- Fix: [Boards.forEach is not function](https://github.com/wekan/wekan/commit/a41190cdf024df65ad1c9931b3065c6ababeaf25).

Thanks to GitHub user xet7 for contributions.

# v1.15 2018-07-06 Wekan release

This release fixes the following bugs:

- Fix [Title is required](https://github.com/wekan/wekan/issues/1576)
  by making [Checklist title optional](https://github.com/wekan/wekan/issues/1753).

Thanks to GitHub users centigrade-kdk and xet7 for their contributions.

# v1.14 2018-07-06 Wekan release

This release fixes the following bugs:

- Fix [Checklists.forEach is not a function](https://github.com/wekan/wekan/issues/1753).

Thanks to GitHub user xet7 for contributions.

# v1.13 2018-07-06 Wekan release

This release adds the following new features:

- Added snapcraft.yml new node version changes, that were missing from v1.12.

Thanks to GitHub user xet7 for contibutions.

# v1.12 2018-07-06 Wekan release

This release adds the following new features:

- [Nested tasks](https://github.com/wekan/wekan/pull/1723);
- [Calendar improvements](https://github.com/wekan/wekan/pull/1752);
- [SSO CAS](https://github.com/wekan/wekan/pull/1742).

and fixes the following bugs:

- [Fix warning about missing space in jade file](https://github.com/wekan/wekan/commit/067aef9de948ef0cb6037d52602100b00d214706);
- Revert [Fix vertical align of user avatar initials](https://github.com/wekan/wekan/pull/1714), so that [initials are again
  visible](https://github.com/wekan/wekan/commit/122a61b3333fb77c0f08bbdc6fe0d3c2f6db97df);
- Fix lint warning: [EditCardDate is assigned a value but never used
  no-unused-vars](https://github.com/wekan/wekan/commit/dd324aa581bed7ea31f20968c6b596f373e7054f);
- Fix [Minimize board sidebar actually just moves it over](https://github.com/wekan/wekan/issues/1589).

Thanks to GitHub users dagomar, ppoulard, pravdomil, TNick and xet7 for their contributions.

# v1.11 2018-06-30 Wekan release

This release fixes the following bugs:

* [Remove card shadow](https://github.com/wekan/wekan/pull/1726), Wekan users now prefer not to have it;
* [Revert](https://github.com/wekan/wekan/commit/928d88cfe1da4187797519c929cd2fdd9ffe9c2e) previous
  [Less margin-bottom after minicard](https://github.com/wekan/wekan/pull/1713).

Thanks to GitHub users pravdomil and xet7 for their contributions.

# v1.10 2018-06-28 Wekan release

This release fixes the following bugs:

* Fix migration error "TypeError: Checklists.foreach" at [Snap](https://github.com/wekan/wekan-snap/issues/51),
  [Docker](https://github.com/wekan/wekan/issues/1736) etc.

Thanks to GitHub users Jubi94, kestrelhawk and xet7 for their contributions.

# v1.09 2018-06-28 Wekan release

This release adds the following new features:

* [Calendar](https://github.com/wekan/wekan/pull/1728). Click Lists / Swimlanes / Calendar.

and fixes the following bugs:

* To fix ["title is required"](https://github.com/wekan/wekan/issues/1576) fix only
  [add-checklist-items and revert all other migration changes](https://github.com/wekan/wekan/issues/1734);
* [Restore invitation code logic](https://github.com/wekan/wekan/pull/1732). Please test and add comment
  to those invitation code issues that this fixes.

Thanks to GitHub users TNick and xet7 for their contributions.

# v1.08 2018-06-27 Wekan release

This release adds the following new features:

* [Add more card inner shadow](https://github.com/wekan/wekan/commit/6a587299b80a49fce0789628ff65885b5ed2c837);
* [Less margin-bottom after minicard](https://github.com/wekan/wekan/pull/1713);
* Updated newest node fork binary from Sandstorm to Wekan, see https://releases.wekan.team/node.txt
* Add Georgian language.

and fixes the following bugs:

* [Fix typo in English translation](https://github.com/wekan/wekan/pull/1710);
* [Fix vertical align of user avatar initials](https://github.com/wekan/wekan/pull/1714);
* [Submit inline form on click outside](https://github.com/wekan/wekan/pull/1717), fixes
  ["You have an unsaved description" doesn't go away after saving](https://github.com/wekan/wekan/issues/1287);
* [Fix "Error: title is required" by removing find() from all of migrations](https://github.com/wekan/wekan/commit/97922c90cb42be6c6615639bb164173748982f56).

Thanks to GitHub users pravdomil, xet7 and zypA13510 for their contributions.

# v1.07 2018-06-14 Wekan release

This release adds the following new features:

* [Regex for Advanced filter. It aims to solve search in bigger text fields, and using wildcards.
   A change to translations was made for adding info about regex and escaping characters
   with \\](https://github.com/wekan/wekan/pull/1702).

Thanks to GitHub users feuerball11 and xet7 for their contributions.

# v1.06 2018-06-14 Wekan release

This release fixes the following bugs:

* [Fix CardDetail of Mobile View](https://github.com/wekan/wekan/pull/1701).

Thanks to GitHub users feuerball11 and xet7 for their contributions.

# v1.05 2018-06-14 Wekan release

This release adds the following new features:

* [Markdown support in Custom Fields, and view on minicard](https://github.com/wekan/wekan/pull/1699);
* [Fixes to Advanced Filter, you are now able to filter for Dropdown and Numbers,
   also Dropdown are now correctly displayed on minicard](https://github.com/wekan/wekan/pull/1699).

and fixes the following bugs:

* [Fix data colour changes on cards](https://github.com/wekan/wekan/pull/1698);
* [Fix for migration error "title is required" and breaking of Standalone and
   Sandstorm Wekan](https://github.com/wekan/wekan/commit/8d5cbf1e6c2b6d467fe1c0708cd794fd11b98a2e#commitcomment-29362180);
* [Fix Issue with custom fields shown on card](https://github.com/wekan/wekan/issues/1659);
* [Fix showing public board in list mode](https://github.com/wekan/wekan/issues/1623);
* [Fix for not able to remove Custom Field "Show on Card"](https://github.com/wekan/wekan/pull/1699);
* [Fix minicardReceivedDate typo in 1.04 regression: Socket connection error and boards
   not loading](https://github.com/wekan/wekan/issues/1694).

Thanks to GitHub users feuerball11, Fran-KTA, oec, rjevnikar and xet7 for their contributions.

# v1.04 2018-06-12 Wekan release

This release adds the following new features:

* [Add Khmer language](https://github.com/wekan/wekan/commit/2156e458690d0dc34a761a48fd7fa3b54af79031);
* [Change label text colour to black for specific label colours for better
   visibility](https://github.com/wekan/wekan/pull/1689).

and fixes the following bugs:

* [SECURITY FIX: Do not publish all of people collection. This bug has probably been present
   since addition of Admin Panel](https://github.com/wekan/wekan/commit/dda49d2f07f9c50d5d57acfd5c7eee6492f93b33);
* [Modify card covers/mini-cards so that: 1) received date is shown unless there is a start date
   2) due date is shown, unless there is an end date](https://github.com/wekan/wekan/pull/1685).

Thanks to GitHub users rjevnikar and xet7 for their contributions.
Thanks to Adrian Genaid for security fix, he's now added to [Hall of Fame](https://wekan.github.io/hall-of-fame/).
Thanks to translators.

# v1.03 2018-06-08 Wekan release

This release adds the following new features:

* [Update to newest Sandstorm fork of Node.js that includes performance
   etc fixes](https://github.com/wekan/wekan/commit/90d55777f7298d243ed0de03c934cea239a31272);
* [Additional label colors. Assigned By and Requested By text fields
   on card. Delete board from Recycle Bin](https://github.com/wekan/wekan/pull/1679).

and possibly fixes the following bugs, please test:

* [Try to fix: Missing board-view-lists Field after DB updated to
   Wekan 1.02](https://github.com/wekan/wekan/issues/1675).

Thanks to GitHub users JamesLavin, rjevnikar and xet7 for their contributions.

# v1.02 2018-05-26 Wekan release

This release fixes the following bugs:

* [Remove binary version of bcrypt](https://github.com/wekan/wekan/commit/4b2010213907c61b0e0482ab55abb06f6a668eac)
  because of [vulnerability](https://nodesecurity.io/advisories/612) that has [issue that is not fixed
  yet](https://github.com/kelektiv/node.bcrypt.js/issues/604)
  and [not yet merged pull request](https://github.com/kelektiv/node.bcrypt.js/pull/606).
  This may cause some slowdown;
* [Snap: Filtering out swap file created at build time, adding stage package](https://github.com/wekan/wekan/pull/1660);
* [Fix Received Date and End Date on Cards](https://github.com/wekan/wekan/issues/1654).

Thanks to GitHub users kubiko, xadagaras and xet7 for their contributions.

# v1.01 2018-05-23 Wekan release

This release possibly fixes the following bugs, please test:

* [Possible quickfix for all customFields Import errors, please test](https://github.com/wekan/wekan/pull/1653).

Thanks to GitHub users feuerball11 and xet7 for their contributions.

# v1.00 2018-05-21 Wekan release

This release fixes the following bugs:

* [Typo in English translation: brakets to brackets](https://github.com/wekan/wekan/issues/1647).

Thanks to GitHub user yarons for contributions.

# v0.99 2018-05-21 Wekan release

This release adds the following new features:

* [Advanced Filter for Custom Fields](https://github.com/wekan/wekan/pull/1646).

Thanks to GitHub users feuerball11 and xet7 for their contributions.

# v0.98 2018-05-19 Wekan release

This release adds the following new features:

* [Filtering by Custom Field](https://github.com/wekan/wekan/pull/1645);
* Update to NPM 6.0.1 and MongoDB 3.2.20.

Thanks to GitHub users feuerball11 and xet7 for their contributions.

# v0.97 2018-05-19 Wekan release

Updated translations.

# v0.96 2018-05-19 Wekan release

This release adds the following new features:

* [Custom Fields](https://github.com/wekan/wekan/issues/807). Note: Import/Export is not implemented yet.

and fixes the following bugs:

* [Fix: checklistItems broken after upgrade](https://github.com/wekan/wekan/issues/1636).

Thanks to GitHub users feuerball11, franksiler, papoola and xet7 for their contributions.

# v0.95 2018-05-08 Wekan release

This release adds the following new features:

* [REST API Edit Card Labels](https://github.com/wekan/wekan/pull/1626);
* [Add a new API route to create a new label in a given board](https://github.com/wekan/wekan/pull/1630);
* [Admin Panel: Option to block username change](https://github.com/wekan/wekan/pull/1627).

and fixes the following bugs:

* [Error: title is required](https://github.com/wekan/wekan/issues/1576).

Thanks to GitHub users Shahar-Y, thiagofernando and ThisNeko for their contributions.

# v0.94 2018-05-03 Wekan release

This release adds the following new features:

* [REST API POST /cards: allow setting card members](https://github.com/wekan/wekan/pull/1622).

Thanks to GitHub user couscous3 for contributions.

# v0.93 2018-05-02 Wekan release

This release adds the following new features:

* [Checklist items lineheight to 18px, and positioning
   improvements](https://github.com/wekan/wekan/issues/1619).

Thanks to GitHub user lichtamberg for contributions.

# v0.92 2018-05-01 Wekan release

This release tries to fix the following bugs, please test:

* [Users who register with an invitation code can't see lists/cards](https://github.com/wekan/wekan/issues/1610).

Thanks to GitHub user andresmanelli for contributions.

# v0.91 2018-05-01 Wekan release

This release fixes the following bugs:

- [Fix Wekan Import / Export lists not being sortable](https://github.com/wekan/wekan/commit/539c1ab87a098a7ddfd23cdbd663441bd609b73d).

Thanks to GitHub user zebby76 for contributions.

# v0.90 2018-05-01 Wekan release

This release adds the following new features:

- [Remove space from between checklist items, so longer checklists can be seen
   at once](https://github.com/wekan/wekan/commit/1124f4120cd77622c0a6313e228e1a00690ff566).

Thanks to GitHub user xet7 for contributions.

# v0.89 2018-04-29 Wekan release

This release fixes the following bugs:

- [Fix Wekan import / Export for ChecklistItems](https://github.com/wekan/wekan/pull/1613).

Thanks to GitHub user zebby76 for contributions.

# v0.88 2018-04-27 Wekan release

This release fixes the following bugs:

- [Fix Trello import of ChecklistItems](https://github.com/wekan/wekan/pull/1611).

Thanks to GitHub user zebby76 for contributions.

# v0.87 2018-04-27 Wekan release

This release fixes the following bugs:

- [Sandstorm: Copy Card, Move Card and Copy Checklist Template to Many Cards - No longer works in
   menu](https://github.com/wekan/wekan/commit/db80e738048e2729917c5e8fc18cf8ee44df7992);
- [Snap: Use override-build instead of old deprecated
   prepare/build/install](https://github.com/wekan/wekan/commit/075ea1c43d827099e0030c750a4c156bd3340fed);
- [Removed not-used plugins part of Caddy download
   URL](https://github.com/wekan/wekan/commit/7b91b341fe9c0cde42f91bf14d228820653c883d).

Thanks to GitHub users kyrofa and xet7 for their contributions.

# v0.86 2018-04-20 Wekan release

This release adds the following new features:

- Updated translations: German and Turkish;
- Updated Caddy to newest version for Snap.

Thanks to translators and Caddy developers.

# v0.85 2018-04-18 Wekan release

This release fixes the following bugs:

- [Fix Switch List/swimlane view only working with admin privileges](https://github.com/wekan/wekan/issues/1567);
- [Fix Wekan logo positioning](https://github.com/wekan/wekan/issues/1378);
- [Tried to fix, but fix did not work: Fix checklists items migration error "title is required"](https://github.com/wekan/wekan/issues/1576);
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
