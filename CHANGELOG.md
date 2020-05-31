# Upcoming Wekan release

This release adds the following new platforms:

- [Using arm64 bundle on Raspberry Pi OS arm64 with MongoDB 4.2.x for RasPi3 and
  RasPi4](https://github.com/wekan/wekan/wiki/Raspberry-Pi#raspberry-pi-os-arm64-with-mongodb-42x).
  Thanks to Raspberry Pi OS devs, MongoDB devs and xet7.

and adds the following new features:

- [Add Calendar Month Event List view](https://github.com/wekan/wekan/commit/f73ea218eefba3f0d6c642849dfede9e03052d25).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.10 2020-05-30 Wekan release

This release adds the following new features:

- [Added an API to get the cards for a specific custom field value](https://github.com/wekan/wekan/pulls/3131).
  Thanks to gvespignani70.

and adds the following updates:

- [Upgrade to Node v12.17.0](https://github.com/wekan/wekan/commit/3ade9d95a69b269c345127e1755e1b539dc07263).
  Thanks to Node developers and xet7.

and fixes the following bugs:

- [Fix email verification in `sendSMTPTestEmail`](https://github.com/wekan/wekan/pull/3135).
  Thanks to marc1006.
- [Try to Fix Registration broken "Templates board id is required" with ugly hack. If it works, ugly becomes
  beautiful](https://github.com/wekan/wekan/pull/3140).
  Thanks to marc1006.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.09 2020-05-27 Wekan release

This release fixes the following bugs:

- [Fix vote export & export/import currency custom field to CSV/TSV](https://github.com/wekan/wekan/pull/3128).
  Thanks to brymut.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.08 2020-05-26 Wekan release

This release adds the following new features:

- [Add the 'Currency' Custom Field type](https://github.com/wekan/wekan/pull/3123).
  Thanks to habenamare.

and adds the following updates:

- [Add some changes to Modern theme](https://github.com/wekan/wekan/commit/6a1bc167cf10e75d61b3196db9eac2978d70ad8e).
  Thanks to jeroenstoker and xet7.

and fixes the following bugs:

- [Fix typo that caused parse error](https://github.com/wekan/wekan/commit/351d9d0c9577c9d543d543bc12a51388b0141324).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.07 2020-05-26 Wekan release

This release fixes the following bugs:

- [Fix move selection](https://github.com/wekan/wekan/pull/3120).
  Thanks to marc1006.
- [Fix Python API generation](https://github.com/wekan/wekan/pull/3121).
  Thanks to marc1006.
- [Fix default value of `sort`](https://github.com/wekan/wekan/pull/3122).
  Thanks to marc1006.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.06 2020-05-25 Wekan release

This release fixes the following bugs:

- [Fix Card export CSV, check for vote
  undefined](https://github.com/wekan/wekan/commit/8eafa1ac66fdcf5fb5f0a95aa6cfee454ddad67f).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.05 2020-05-25 Wekan release

This release adds the following new features:

- [Import/Export Custom Fields in CSV/TSV](https://github.com/wekan/wekan/pull/3115).
  Thanks to brymut.

and adds the following updates:

- [Update packages](https://github.com/wekan/wekan/commit/3b44acd87c35340bf9fe5d210f4402f1b1a1dfdf).
  Thanks to xet7.

and fixes the following bugs:

- Try to fix Snap [1](https://github.com/wekan/wekan/commit/6fad68b9b9afd8de7074037d73eeac40f6a3f7c1), [2](https://github.com/wekan/wekan/commit/b737adfcdfc9b8084a7eb84420a89c014bbec1fb). Later reverted those like other ostrio-files changes too.
  Thanks to xet7.
- [Add default attachments store path /var/snap/wekan/common/uploads where attachments will be
  stored](https://github.com/wekan/wekan/commit/c61a126c8bcb25a1eda0203b89c990ae31de7a70).
  Thanks to xet7.
- [Make scrollParentContainer() more robust as it's used in a timeout callback. Example exception: Exception in setTimeout callback: TypeError: Cannot read property 'parentComponent' of null. Probably there is a better fix for this](https://github.com/wekan/wekan/commit/d5fbd50b760b1d3b84b5b4e8af3a8ed7608e2918).
  Thanks to marc1006.
- [Fix error link not available. Fixes: Exception in template helper: TypeError: Cannot read property 'link' of
undefined](https://github.com/wekan/wekan/commit/b7105d7b5712dcdbf9dadebfddaba7691810da5c).
  Thanks to marc1006.
- [Fix minicard cover functionality. Otherwise, if `this.coverId` is undefined then `Attachments.findOne()` would return any
attachment](https://github.com/wekan/wekan/commit/66d35a15280795b76a81c3e59cebbd2a29e4dff8).
  Thanks to marc1006.
- [Some fixes suggested by deepcode.ai](https://github.com/wekan/wekan/pull/3112).
  Thanks to marc1006.
- [Sorry marc1006, I had to revert deepcode.ai arrow function fixes because Python API docs generator does not work all when code has arrow functions](https://github.com/wekan/wekan/commit/f9018fc3a87080d8d97c371e29a8f3f0a20ca932).
  Thanks to xet7.
- [Move In Progress ostrio-files changes to separate branch, and revert ostrio-files changes, so that:
  Export to CSV/TSV with custom fields works, Attachments are not exported to disk,
  It is possible to build arm64/s390x versions
  again](https://github.com/wekan/wekan/commit/d52affe65893f17bab59bb43aa9f5afbb54993d3).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.04 2020-05-24 Wekan release

Please use v4.05 or newer instead, that works better.

This release adds the following features:

- [Found Time Tracking GPLv3 software "Titra" with integration to Wekan](https://github.com/wekan/wekan/wiki/Time-Tracking).
  Thanks to willhseitz.
- [Theme: Natural](https://github.com/wekan/wekan/pull/3098).
  You can select it from Board Settings / Change color / natural.
  Thanks to compumatter and helioguardabaxo.
- [Theme: Modern](https://github.com/wekan/wekan/pull/3106).
  Thanks to jeroenstoker com and helioguardabaxo.
- [Export board to HTML static page .zip archive](https://github.com/wekan/wekan/pull/3043).
  Thanks to Lewiscowles1986.

and fixes the following bugs:

- [Change the swimlaneid of a card only if a new target swimlaneid is selected](https://github.com/wekan/wekan/pull/3108).
  Thanks to marc1006.
- [Set '*' as default value for swimlane and list name in card move action](https://github.com/wekan/wekan/pull/3109).
  Thanks to hickorysb and marc1006.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.03 2020-05-16 Wekan release

This release adds the following features:

- [Theme: Clearblue](https://github.com/wekan/wekan/pull/3093).
  You can select it from Board Settings / Change color / clearblue.
  Thanks to CidKramer.

and fixes the following bugs:

- [Fix Can't Scroll on All Boards on mobile phone. Added drag handles](https://github.com/wekan/wekan/issues/3096).
  Thanks to xet7.
- [Try to fix Sandstorm Wekan Export menu](https://github.com/wekan/wekan/commit/1ac11d92ba8f38981c87db25e5b5e1fa2adb6968).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.02 2020-05-15 Wekan release

This release adds the following server platforms:

- [Android arm64/x64](https://github.com/wekan/wekan/wiki/Android).
  Thanks to xet7.

and adds the following features:

- [Install Wekan to mobile homescreen icon and use fullscreen
  PWA](https://github.com/wekan/wekan/commit/8d5adc04645e3e71423f16869f39b8d79969bccd).
  [Docs for iOS and Android at wiki PWA page](https://github.com/wekan/wekan/wiki/PWA).
  Thanks to xet7.
- [Add options to rebuild-wekan.sh to run Meteor in development mode where after
  file change it rebuilds](https://github.com/wekan/wekan/commit/5f915ef966170ea7baca7ddeb11319bc08a26fef).
  Thanks to xet7.

and adds the following updates:

- [Update dependencies](https://github.com/wekan/wekan/commit/75bdd33fda58ea0233f5b38c466bcb1a9b0406ab).
  Thanks to xet7.

and adds the following translations:

- [Add Spanish (Chile)](https://github.com/wekan/wekan/commit/96507e6777ed77a324eaec9799c5b46b0d25ad26).
  Thanks to isos, Transifex user.

and fixes the following bugs:

- [Fix Deleting linked card makes board not load](https://github.com/wekan/wekan/issues/2785).
  Thanks to marc1006 and xet7.
- [Fix getStartDayOfWeek once again](https://github.com/wekan/wekan/pull/3061).
  Thanks to marc1006.
- [Fix shortcuts list and support card shortcuts when hovering
  a card](https://github.com/wekan/wekan/pull/3066).
  Thanks to marc1006.
- [Add white-space:normal to copy-to-clipboard button in card
  details](https://github.com/wekan/wekan/pull/3075).
  Thanks to helioguardabaxo.
- [Fix avatar-image class](https://github.com/wekan/wekan/pull/3083).
  Thanks to krupupakku.
- [Fix Swimlanes ID missing in new boards](https://github.com/wekan/wekan/pull/3088).
  Thanks to krupupakku.
- [Fix REST API so Create card does now allow an empty member
  list](https://github.com/wekan/wekan/pull/3084).
  Thanks to wackazong.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.01 2020-04-28 Wekan release

This release adds the following updates:

- [Upgrade to Node v12.16.3](https://github.com/wekan/wekan/commit/1d89e96dd101c11913f1acdd6d16b5650eaf18a7).
  Thanks to Node developers and xet7.

and fixes the following bugs:

- [Fix Docker builds](https://github.com/wekan/wekan/commit/280e66947e3afa878c41e876cf827ebcec81a2c6).
  Thanks to xet7.
- [Fix Cards and Users API docs at https://wekan.github.io/api/ not generated because of
  syntax error and new Javascript syntax](https://github.com/wekan/wekan/commit/9ae20a3f51e63c29f536e2f5b3e66a2c7d88c691).
  Wekan uses wekan/releases/generate-docs*.sh Python code to generate OpenAPI docs,
  it did not show any errors while generating docs, only left out parts of API docs.
  This affected Wekan versions v3.94-v4.00.
  Thanks to pvcon13 and xet7.
- [Fix list header height when cards count is shown](https://github.com/wekan/wekan/pull/3056).
  Thanks to marc1006.
- [Smaller height for Add Board button](https://github.com/wekan/wekan/commit/6afc9259f084717a0cc3ce6d66979fd7c1471939).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v4.00 2020-04-27 Wekan release

This release fixes the following bugs:

- [Make sure that the board header buttons fit into one line even for devices with 360px width
  resolution](https://github.com/wekan/wekan/pull/3052).
  Thanks to marc1006.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.99 2020-04-27 Wekan release

This release fixes the following bugs:

- [Fix Boards are very hard to tap in mobile](https://github.com/wekan/wekan/pull/3051).
  Thanks to marc1006.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.98 2020-04-25 Wekan release

News:

- There is now many mobile and desktop webbrowser fixes. Please test does your
  favourite Javascript enabled webbrowser work, and add issues if something
  does not work, and there is no existing issue about that yet.
- Desktop browser mode has setting for Show/Hide drag handles:
  top right click username / Change Settings / Show desktop drag handles.
  You can request desktop website also at mobile webbrowsers on Android.
  At iOS requesting desktop website did not seem to work yet.
- At iOS Safari and Chrome, to see swimlane buttons you need to scroll to right.
  Fixes to this and other issues are welcome as pull request.

This release adds the following new features:

- [Pre-fill the title of checklists (Trello-style)](https://github.com/wekan/wekan/pull/3030).
  Thanks to boeserwolf.
- [Implement option to change the first day of the week in user settings](https://github.com/wekan/wekan/pull/3032).
  Thanks to marc1006.
- [Add babel to build chain and linter. Enables fancy Javascript language
  features like optional chaining, for developer happiness](https://github.com/wekan/wekan/pull/3034).
  Thanks to boeserwolf.
- [Use only one 'Apply' button for applying the user settings](https://github.com/wekan/wekan/pull/3039).
  Thanks to marc1006.
- [Allow variable height for board list items. Allow words in title/description to be able to break
  and wrap onto the next line](https://github.com/wekan/wekan/pull/3046).
  Thanks to marc1006.

and adds the following updates:

- [Upgrade to Meteor 1.10.2](https://github.com/wekan/wekan/commit/d1f98d0c472fb41e25fb29a9a6f6dae7db003f6f).
  Thanks to Meteor developers and xet7.
- [Set Snap MongoDB compatibility to 4.2 according to Meteor ChangeLog](https://github.com/wekan/wekan/commit/7de18eccea3854db3be6197bf21afbfd3ddb65a6).
  Thanks to xet7.

and fixes the following bugs:

- [Multiple lint issue fixes](https://github.com/wekan/wekan/pull/3031).
  Thanks to marc1006.
- [Fix lint errors in lint error fix](https://github.com/wekan/wekan/commit/9e95c06415e614e587d684ff9660cc53c5f8c8d3).
  Thanks to xet7.
- [Fix getStartDayOfWeek function](https://github.com/wekan/wekan/pull/3038).
  Thanks to marc1006 and boeserwolf.
- Improve mobile devices support [Part1](https://github.com/wekan/wekan/pull/3040) and [Part2](https://github.com/wekan/wekan/pull/3045).
  Thanks to marc1006.
- [Fix Wekan not load at all in Firefox v.68 for Android](https://github.com/wekan/wekan/commit/1235363465b824d26129d4aa74a4445f362c1a73).
  Thanks to xet7.
- [Fix comment typo in docker-compose.yml](https://github.com/wekan/wekan/pull/3044).
  Thanks to VictorioBerra.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.97 2020-04-19 Wekan release

This release adds the following new features:

- [Sortable boards](https://github.com/wekan/wekan/pull/3027).
  Thanks to boeserwolf.
- [Added dockerfiles for multi-arch builds and manifest](https://github.com/wekan/wekan/pull/3023).
  [In Progress](https://github.com/wekan/wekan/issues/2999).
  Thanks to brokencode64.
- [Make linked card clickable](https://github.com/wekan/wekan/pull/3025).
  Thanks to boeserwolf.

and fixes the following bugs:

- [Fix using checklists on mobile and iPad](https://github.com/wekan/wekan/pull/3019).
  Thanks to devinsm.
- [Improve card layout on mobile devices](https://github.com/wekan/wekan/pull/3024).
  Thanks to marc1006.
- [Make OCP OAuth work with Openshift 4.x](https://github.com/wekan/wekan/pull/3020).
  Thanks to ckavili.
- [Remove old warning from Sandstorm import board data loss, because bug has been already
  fixed](https://github.com/wekan/wekan/commit/960fe5163b6a2f7c3dca03b5e31d69611b49f079).
  Thanks to aputsiaq and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.96 2020-04-15 Wekan release

This release adds the following Sandstorm updates:

- This is the first Sandstorm Wekan release that uses newest Meteor 1.10.1 and Node 12.x.
  Now all Wekan platforms use newest Meteor and Node 12.x LTS.
  Thanks to kentonv and xet7.
- [Fix capnp workaround to work with newest Meteor and
  Node 12.x](https://github.com/wekan/wekan/commit/b2d546579c4957352c29b36c0c8a4a08b944dbb4).
  Thanks to kentonv.
- [Update Sandstorm release script for newest Meteor and
  Node 12.x](https://github.com/wekan/wekan/commit/c5f782976b971fa3f2323e80a013bbf6a49c0596).
  Thanks to xet7.
- [Remove Meteor 1.8.x files because Sandstorm Wekan now uses newest
  Meteor](https://github.com/wekan/wekan/commit/1a836969e10215bad47ac56a9b0d9de801b66fd2).
  Thanks to xet7.

and adds the following new features:

- [Hide password auth with environment variable PASSWORD_LOGIN_ENABLED=false](https://github.com/wekan/wekan/pull/3014).
  Snap example: `sudo snap set wekan password-login-enabled='false'` .
  Thanks to salleman33.

and fixes the following bugs:

- [Fix Board admins can not clone or archive their boards at All Boards
  page](https://github.com/wekan/wekan/pull/3013).
  Thanks to salleman33.
- [Fix `<p>` margin in card labels](https://github.com/wekan/wekan/pull/3015).
  Thanks to boeserwolf.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.95 2020-04-12 Wekan release

This release adds the following new features:

- [Add gitpod config](https://github.com/wekan/wekan/pull/3009).
  This adds support for Gitpod.io, a free automated
  dev environment that makes contributing and generally working on GitHub
  projects much easier. It allows anyone to start a ready-to-code dev
  environment for any branch, issue and pull request with a single click.
  Thanks to juniormendonca.
- [Public boards overview](https://github.com/wekan/wekan/pull/3008).
  Thanks to NicoP-S.

and fixes the following bugs:

- [Fix styling issue in notifications drawer](https://github.com/wekan/wekan/pull/3012).
  Thanks to boeserwolf.
- [Fix error in notifications cleanup cron](https://github.com/wekan/wekan/pull/3010).
  Thanks to jtbairdsr.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.94 2020-04-12 Wekan release

This release adds the following new features:

- [Public vote](https://github.com/wekan/wekan/pull/3006).
  Thanks to NicoP-S.
- [Add robots.txt disallow all](https://github.com/wekan/wekan/commit/3fae5355d40055757bf4a5f0c503581195609720).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.93 2020-04-10 Wekan release

This release adds the following new features:

- [Trello vote import & hide export button if with_api is
  disabled](https://github.com/wekan/wekan/pull/3000).
  Thanks to NicoP-S.
- [When adding a user to a board that has subtasks, also add user to the subtask
  board](https://github.com/wekan/wekan/pull/3004).
  Thanks to slvrpdr.

and adds the following updates:

- Upgrade to Node v12.16.2 [Part1](https://github.com/wekan/wekan/commit/6db717b9b384fe1491063e507b80e67791a07e3a)
  and [Part2](https://github.com/wekan/wekan/commit/268d7fcb32186a902a84e7f6d80c50b1f3790bad).
  Thanks to Node developers and xet7.

and fixes the following bugs:

- [Fix bug that prevents editing or deleting
  comments](https://github.com/wekan/wekan/pull/3005).
  Thanks to jtbairdsr.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.92 2020-04-09 Wekan release

This release adds the following new features:

- [Scheduler to clean up read notifications. Also added a button to manually remove all
  read notifications, and a fix to prevent users form getting notifications for their own
  actions](https://github.com/wekan/wekan/pull/2998).
  Thanks to jtbairdsr.
- [Add setting](https://github.com/wekan/wekan/commit/5ebb47cb0ec7272894a37d99579ede872251f55c)
  default [NOTIFICATION_TRAY_AFTER_READ_DAYS_BEFORE_REMOVE=2](https://github.com/wekan/wekan/pull/2998)
  to all Wekan platforms.
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.91 2020-04-08 Wekan release

This release adds the following new features:

- [OpenShift: Route template added to helm chart for Openshift v4x
  cluster](https://github.com/wekan/wekan/pull/2996).
  Thanks to ckavili.
- [Filter by Assignee](https://github.com/wekan/wekan/pull/2997).
  Thanks to daniel-eder.
- [Vote on Card](https://github.com/wekan/wekan/pull/2994).
  Thanks to NicoP-S and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.90 2020-04-06 Wekan release

This release makes the following updates:

- [Update dependencies](https://github.com/wekan/wekan/commit/d798f6e3ef09595ce4f1d1fbc053eec70fc91fb9).

and updates the following translations:

- [Update layouts.js for zh-TW language name](https://github.com/wekan/wekan/pull/2988).
  Thanks to doggy8088.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.89 2020-04-05 Wekan release

This release adds the following new features:

- [Create subtasks in parenttask swimlane](https://github.com/wekan/wekan/issues/1953).
  Thanks to TOSCom-DanielEder.
- [When searching cards in a board, also search from Custom Fields](https://github.com/wekan/wekan/pull/2985).
  Thanks to slvrpdr.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.88 2020-04-02 Wekan release

This release adds the following new features:

- [Notification drawer](https://github.com/wekan/wekan/pull/2975) [like Trello](https://github.com/wekan/wekan/issues/2471).
  Thanks to jtbairdsr and xet7.

and makes the following UI changes:

- [Minicard labels on the top and title on bottom](https://github.com/wekan/wekan/issues/2980).
  Thanks to helioguardabaxo and xet7.

and fixes the following bugs:

- [Fix start-wekan.sh MongoDB port to 27017](https://github.com/wekan/wekan/commit/c60a092fc0ed9fe15c417bcb443b1e3e3aaedf7e).
  Thanks to Keelan and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.87 2020-04-01 Wekan release

This release makes the following UI changes:

- [Move "Rules" from "Board View" to "Board Settings"](https://github.com/wekan/wekan/issues/2973).
  Thanks to helioguardabaxo and xet7.
- [Improvements on card details visualization](https://github.com/wekan/wekan/issues/2974).
  Thanks to helioguardabaxo and xet7.
- [Hide duplicate "Hide system messages" at Change Settings/Member Settings, because it's also on card
  slider](https://github.com/wekan/wekan/issues/2837).
  Thanks to notohiro and xet7.

and fixes the following bugs:

- [Fix Browser always reload the whole page when I change one of the card
  color](https://github.com/wekan/wekan/commit/3546d7aa02bc65cf1183cb493adeb543ba51945d).
  Fixed by making label colors and text again editable.
  Regression from [Wekan v3.86 2)](https://github.com/wekan/wekan/commit/b9099a8b7ea6f63c79bdcbb871cb993b2cb7e325).
  Thanks to javen9881 and xet7.
- [Fix richer editor submit did not clear edit area](https://github.com/wekan/wekan/commit/033d6710470b2ecd7a0ec0b2f0741ff459e68b32).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.86 2020-03-24 Wekan release

This release fixes the following bugs:

- [Fix Rich editor can not be disabled, regression from changes yesterday at Wekan v3.85](https://github.com/wekan/wekan/commit/12ab8fac5db9c5ac8069d0ca2bca340d6004a25b).
  Thanks to uusijani, vjrj and xet7.
- [1) Fix Pasting text into a card is adding a line before and after
      (and multiplies by pasting more) by changing paste "p" to "br".
   2) Fixes to summernote and markdown comment editors, related
       to keeping them open when adding comments, having
       @member mention not close card, and disabling clicking of
       @member mention](https://github.com/wekan/wekan/commit/b9099a8b7ea6f63c79bdcbb871cb993b2cb7e325).
  Thanks to xet7 !

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.85 2020-03-23 Wekan release

This release fixes the following CRITICAL SECURITY VULNERABILITIES:

- [Fix XSS bug reported today 4 hours ago by Cyb3rjunky](https://github.com/wekan/wekan/commit/482682e50079d70c5113169020d6834013b57c11).
  Logged in users could run javascript in input fields.
  This affects Wekan versions v3.12-v3.84.
  In [Wekan v3.12](https://github.com/wekan/wekan/blob/master/CHANGELOG.md#v312-2019-08-09-wekan-release)
  there was [changes for XSS filter to allow inserting images, videos etc
  on comment WYSIWYG editor](https://github.com/wekan/wekan/pull/2593)
  so features related to that are now removed.
  After this fix, Javascript in input fields is not executed.
  Thanks to Cyb3rjunky and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.84 2020-03-16 Wekan release

This release adds the following features:

- Add settings for mouse wheel scroll inertia and scroll
  amount [Part1](https://github.com/wekan/wekan/commit/9d13001b903f9ec50f5fa3a4bdbacae32b27ac65)
  and [Part2](https://github.com/wekan/wekan/commit/aaecac091209e90c0c2123830728f5e7a835ccb4).
  For example: sudo snap set wekan scrollinertia='200' , sudo snap set wekan scrollamount='200' .
  Thanks to danger89 and xet7.

and adds the following updates:

- [Upgrade to Meteor 1.10.1](https://github.com/wekan/wekan/commit/e16c65babc1f021c35a3d46bc61e649ec94d1e82).
  Thanks to xet7.
- [Update markdown](https://github.com/wekan/wekan/commit/6e0fa78022ea487176eb0a32ec5a4a441f8e0c3c).
  Thanks to xet7.
- [Update minimist](https://github.com/wekan/wekan/commit/ea6baa5c2b956ee28b0a7e63f988e2fc1998201a).
  Thanks to xet7.
- [Update acorn](https://github.com/wekan/wekan/commit/369a29707bbec3bf89717c16e8b698fb4666087a).
  Thanks to xet7.
- [Update prettier-eslint](https://github.com/wekan/wekan/commit/8183b7bdaa01d2ce53ac7215beafd5efe21373e8).
  Thanks to xet7.
- [Update ostrio:cookies](https://github.com/wekan/wekan/commit/14b8610837117616d436e2bac6a9dc653e315662).
  Thanks to xet7.
- [Add build time profiling to build script](https://github.com/wekan/wekan/commit/f968109e7390139e50375ee29bc7bc3cf1e1ab41).
  Thanks to zodern.

and fixes the following bugs:

- [Downgrade stylus to v1.1.0 to speed up building Wekan](https://github.com/wekan/wekan/commit/fca4cdcebf1cc6642aefeb78b911cb5b95ebe473).
  This is because building newer stylus v2 takes 52 minutes. After this change, building Wekan takes 3 minutes.
  Thanks to zodern.
- [Fix: Error when retrieve token from some OIDC due to not necessary scope
  parameter](https://github.com/wekan/wekan/pull/2955).
  Thanks to benoitm76.
- [Fix: img tag did not allow width and height. Removed swipebox from markdown editor
  img tag and updated marked markdown to newest version](https://github.com/wekan/wekan/commit/2b26bbe78a1a2b8b427963a6c44c3853efdb737e).
  Thanks to hradec and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.83 2020-03-01 Wekan release

This release tries to revert remaining the following changes:

- [Revert](https://github.com/wekan/wekan/88573ad2cdb8596b795a82ef40a0662180e8a7d7) change made at Wekan v3.81,
  because building did not work: [Try to make Meteor build time shorter
  by excluding legacy and cordova. This was made possible by
  Meteor 1.10-rc.2](https://github.com/wekan/wekan/commit/0d3002f69d97e646fa7368bfdade4f78c51e9884).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.82 2020-03-01 Wekan release

This release reverts the following changes:

- Revert change made at Wekan v3.81, because building did not work: [Try to make Meteor build time shorter
  by excluding legacy and cordova. This was made possible by
  Meteor 1.10-rc.2](https://github.com/wekan/wekan/commit/0d3002f69d97e646fa7368bfdade4f78c51e9884).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.81 2020-03-01 Wekan release

This release [fixes](https://github.com/wekan/wekan/commit/aac7c380c8c389b0683b2bd64e2cc856993f0e30) the following CRITICAL SECURITY VULNERABILITIES and other bugs:

- Fix critical and moderate security vulnerabilities reported at 2020-02-26 with
  responsible disclosure by [Dejan Zelic](https://twitter.com/dejandayoff),
  Justin Benjamin and others at [Offensive Security](https://twitter.com/offsectraining),
  that follow standard 90 days before public disclosure.
  Thanks to xet7.
- Fix webhook error that prevented some card etc deleting from web UI of board.
  Thanks to xet7.
- Add missing Font Awesome icon to Board Settings Menu.
  Thanks to xet7.
- Remove autofocus from many form input boxes so that they would not cause warnings.
  Thanks to xet7.

and does the following upgrades:

- [Upgrade Meteor to 1.10-rc.2](https://github.com/wekan/wekan/commit/26b521e86e6ac40b7ba25bbe8dac7bf4d48d43ce).
  Thanks to xet7.
- [Try to make Meteor build time shorter by excluding legacy and cordova. This was made possible by
  Meteor 1.10-rc.2](https://github.com/wekan/wekan/commit/0d3002f69d97e646fa7368bfdade4f78c51e9884).
  Thanks to xet7.

and fixes the following bugs:

- [Try to fix afterwards loading of cards by adding fallback when requestIdleCallback is not
  available](https://github.com/wekan/wekan/commit/2b9540ce02de604bf84ea082f2dcb1d01673708c).
  Thanks to xet7.
- [Make profile.initials available in publications](https://github.com/wekan/wekan/pull/2948).
  Thanks to NicoP-S.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.80 2020-02-22 Wekan release

This release adds the following features:

- [Create New User in Admin Panel](https://github.com/wekan/wekan/commit/e0ca960a35cf006880019ba28fc82aa30f289a71).
  Works, but does not save fullname yet, so currently it's needed to edit add fullname later.
  Thanks to xet7.

and adds the following updates:

- [Update to Meteor 1.9.1, Node 12.16.1 etc newest dependencies](https://github.com/wekan/wekan/commit/cbbb5deff7d84a91c40becc9caaf70f5b6738b63).
  Thanks to xet7.
- [Update to Meteor 1.9.2](https://github.com/wekan/wekan/commit/9be3f3714ae680ff9fc1855c960c9831e84c2b07).
  Thanks to xet7.

and fixes the following bugs:

- [Update Sandstorm release build script](https://github.com/wekan/wekan/commit/a4ff6cc0af8545ca4d3e97fa2cabbe7981c025b2).
  Thanks to xet7.
- [Fix docker-compose link](https://github.com/wekan/wekan/pull/2937).
  Thanks to pbek.
- [Remove alethes:pages package, that had some indentation error.
  Package is about pagination, but I did not find any pagination related code in Wekan
  yet](https://github.com/wekan/wekan/commit/ec012060305bc16fbf8d2ac218f5c847e02c4301).
  Thanks to xet7 !

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.79 2020-02-13 Wekan release

This release fixes the following bugs:

- [Fix Card Opened Webhook can not be disabled](https://github.com/wekan/wekan/commit/178f376e2138b5522c2e92ddfd2babb113df8d9f).
  Thanks to mvanvoorden and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.78 2020-02-12 Wekan release

This release adds the following features:

- [Card Settings / Show on Card: Description Title and Description Text](https://github.com/wekan/wekan/commit/e89965f6422fd95b4ad2112ae407b1dde4853510).
  Thanks to e-stoniauk, 2020product and xet7.

and fixes the following bugs:

- [Remove card element grouping to create compact card layout](https://github.com/wekan/wekan/commit/e89965f6422fd95b4ad2112ae407b1dde4853510).
  Thanks to e-stoniauk, 2020product and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.77 2020-02-10 Wekan release

This release removes the following features:

- [Remove hiding comments and activities](https://github.com/wekan/wekan/commit/2a54218f3f68547032bd53a04a968b233be21e15).
  Thanks to xet7.

and fixes the following bugs:

- Fix Copy Card Link to Clipboard button at card title did not
  work [Part 1](https://github.com/wekan/wekan/commit/9a21b0a1c933e7f778e4e57a8258e150ccea1620)
  and [Part2](https://github.com/wekan/wekan/commit/4467a68b97a3fbf0fbae7f05177d978f2aa80287).
  Thanks to 2020product and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.76 2020-02-07 Wekan release

This release adds the following updates:

- [Use Meteor 1.9 and Node.js 12.15.0 on Snap and Docker](https://github.com/wekan/wekan/commit/8384d68a060ef8f2c202ce2fa6064c5c823d28dc).
  This also fixes bug that exporting some boards was not possible, downloading export file failed.
  Thanks to xet7.

and fixes the following bugs:

- [Fix Bug enable/disable Comments in Card Settings](https://github.com/wekan/wekan/issues/2923).
  Thanks to warnt, mdurokov and xet7.
- [Try to disable dragging Swimlanes/Lists/Cards/Checklists/Subtasks on small mobile smartphones webbrowsers,
  and hide drag handles on mobile web](https://github.com/wekan/wekan/commit/bf78b093bad7d463ee325ad96e8b485264d4a3be).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.75 2020-02-05 Wekan release

This release adds the following new features:

- [Fix](https://github.com/wekan/wekan/commit/f22785dbcde42e425c9ead209ec224aef6e11c16)
  [adding comments](https://github.com/wekan/wekan/issues/2918).
  Thanks to xet7.

and fixes the following bugs:

- [Added some working layout changes like activities using less space from https://github.com/wekan/wekan/pull/2920](https://github.com/wekan/wekan/commit/f22785dbcde42e425c9ead209ec224aef6e11c16).
  Thanks to 2020product.
- [Fixed Card Settings not working at Sandstorm](https://github.com/wekan/wekan/commit/f22785dbcde42e425c9ead209ec224aef6e11c16).
  Thanks to xet7.
- Add [Card Description title](https://github.com/wekan/wekan/issues/2918#issuecomment-582346577)
  [back](https://github.com/wekan/wekan/commit/f22785dbcde42e425c9ead209ec224aef6e11c16).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.74 2020-02-05 Wekan release

This release adds the following new features:

- [For BoardAdmin, add way to hide parts of a card, at Board Settings/Card Settings/Show on Card: Received, Start, ... etc.
  Add to card title bar Copy card to Clipboard button](https://github.com/wekan/wekan/pull/2915).
  Thanks to 2020product and xet7.
- [Set default to RICHER_CARD_COMMENT_EDITOR=false](https://github.com/wekan/wekan/commit/65fa2f626f503b8089e0d982901cffb3990426cb).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.73 2020-01-29 Wekan release

This release adds the following new features:

- [Login to Wekan with Nextcloud](https://github.com/wekan/wekan/pull/2897).
  Thanks to bogie.
- [Add rule action to move cards to other boards](https://github.com/wekan/wekan/pull/2899).
  Thanks to peterverraedt.

and fixes the following bugs:

- [Show System Wide Announcement in one line](https://github.com/wekan/wekan/pull/2891).
  Thanks to tsia.
- [Fixed board export with attachment in Wekan Meteor 1.9.x version](https://github.com/wekan/wekan/pull/2898).
  Thanks to izadpoor.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.72 2020-01-19 Sandstorm-only Wekan release

This release fixes the following bugs:

- Try to fix Wekan at Sandstorm.
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.71 2020-01-18 Sandstorm-only Wekan release

This release fixes the following bugs:

- [Try to fix Wekan at Sandstorm by using Meteor 1.8.x and Node 8.17.0 at Sandstorm](https://github.com/wekan/wekan/commit/5e5ab95410c715a4379631456fc5547c497898b0).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.70 2020-01-18 Wekan release

This release fixes the following bugs:

- [Add missing LD_LIBRARY_PATH to use libssl and libcurl](https://github.com/wekan/wekan/10f142a1a05acb98a175ccb0326fb0c1d3e3713f).
  Thanks to xet7.
- [Use Meteor 1.8.x](https://github.com/wekan/wekan/commit/55a2aa90cbbf44200e9b0b9f4bd08b6177f1bb95)
  [on Snap](https://github.com/wekan/wekan/commit/6a01170d8696322462c4065ce0cf4a637a058975), because
  Snap builds do not work yet for Meteor 1.9, Node 12.14.1 and MongoDB 4.2.2.
  Docker version works with Meteor 1.9.
  Thanks to xet7.
- [Try to fix Node 12 Buffer() deprecation errors](https://github.com/wekan/wekan/commit/9b905c2833d54cf34d1875148075b2bf756d943a).
  Thanks to xet7.
- [Add Snap Meteor 1.8.x files to lint ignore files](https://github.com/wekan/wekan/commit/48f8050c25e40f737dfdd3a98923cb87cd4e77e2).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.69 2020-01-10 Wekan release

This release fixes the following bugs:

- [Fix docker-compose.yml to not use --smallfiles that is not supported in
  MongoDB 4.x](https://github.com/wekan/wekan/commit/ecb76842fcbd81701afcab8db0ed106e6be0fdec).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.68 2020-01-10 Wekan release

This release tries to fix the following bugs:

- [Try to fix Snap by removing MongoDB option --smallfiles that is not supported
  in MongoDB 4.x](https://github.com/wekan/wekan/commit/031df54a2e0a03dcb7a2586667e60e5bd4eef706)
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.67 2020-01-10 Wekan release

This release tries to fix the following bugs:

- [Try to fix Snap](https://github.com/wekan/wekan/commit/2b382b940be9af575fab4c2e955702d8cde55ae9).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.66 2020-01-10 Wekan release

This release tries to fix the following bugs:

- [Try to fix Snap](https://github.com/wekan/wekan/commit/39bf1e375e2962f824e6f8cfa425ea51aa4efa24).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.65 2020-01-10 Wekan release

This release adds the following features:

- [More keyboard shortcuts: c for archive card](https://github.com/wekan/wekan/commit/d16a601c04aeb1d3550c5c541be02a67276a34cf).
  Thanks to xet7.

and adds the following updates:

- [Upgrade to Meteor 1.9, Node 12.14.1 and MongoDB 4.2.2](https://github.com/wekan/wekan/commit/785f3cf88b61f687ef5ad4a529768221d1a54c86).
  Thanks to xet7.
- [Add more issue repo links to GitHub issue template](https://github.com/wekan/wekan/commit/5724674e73246f4e52843a6d6906c0ecdd85cccc).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.64 2020-01-06 Wekan release

This release adds the following warning for CentOS 7 users:

- [WARNING: DO NOT USE SNAP ON CENTOS 7, THERE IS UPDATE BUG](https://github.com/wekan/wekan-snap/wiki/CentOS-7).
  Thanks to andy-twosticks and xet7.

and adds the following features:

- [Wider sidebar](https://github.com/wekan/wekan/commit/5058233509e44916296e38fb8a6c5dd591c46d8b).
  Thanks to vjrj.

and removes the following features:

- [Removed Custom HTML feature that does not work](https://github.com/wekan/wekan/commit/ddce0ada094e6450be260b4cda21fdfa09ae0133).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.63 2020-01-06 Wekan release

This release fixes the following bugs:

- [Fix: Unable to find Archive Card/List/Swimlane in board
  settings](https://github.com/wekan/wekan/commit/8ce993921718f3e10c2daa5fabb145b939d789dd).
  Thanks to neobradley and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.62 2020-01-05 Wekan release

This release adds the following features:

- [Add Worker role](https://github.com/wekan/wekan/issues/2788).
  This was originally added at Wekan v3.58, reverted at Wekan v3.60 because of bugs,
  and now after fixes added back.
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.61 2020-01-03 Wekan release

This release adds the following features:

- [Add more Font Awesome icons. This was originally added
  at Wekan v3.58, removed at Wekan v3.60, and now
  added back at Wekan v3.61](https://github.com/wekan/wekan/commit/cd253522a305523e3e36bb73313e8c4db500a717).
  Thanks to xet7.

and fixes the following bugs:

- [Fix browser javascript console errors when editing profile. This was originally added
  at Wekan v3.58, removed at Wekan v3.60, and now added back at
  Wekan v3.61](https://github.com/wekan/wekan/commit/cd253522a305523e3e36bb73313e8c4db500a717).

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.60 2020-01-03 Wekan release

This release fixes the following bugs:

- [Revert to Wekan v3.57 version of client and models directories,
  removing Worker role temporarily, because Worker role changes
  broke saving card](https://github.com/wekan/wekan/commit/27943796ade78ca3c503637a1340918bf06a1267).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.59 2020-01-03 Wekan release

This release fixes the following bugs:

- [Fix not being able to edit received date](https://github.com/wekan/wekan/commit/5376bc7b7905c0dd99fae1aeae3f63b4583a3e3f).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.58 2020-01-03 Wekan release

This release adds the following features:

- [Add Worker role](https://github.com/wekan/wekan/issues/2788). Thanks to xet7.
- [Add more Font Awesome icons](https://github.com/wekan/wekan/commit/2bf004120d5a43cd3c3c060fc7c0c30d1b01f220).
  Thanks to xet7.

and fixes the following bugs:

- [Fix: k8s templates update for helm](https://github.com/wekan/wekan/pull/2867).
  1. Upgrade mongo replica version.
  2. Access mongo via service url.
  3. Change the expose servicePort to numeric.
  Thanks to jiangytcn.
- [Fix browser console errors when editing user profile name](https://github.com/wekan/wekan/commit/2bf004120d5a43cd3c3c060fc7c0c30d1b01f220).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.57 2019-12-22 Wekan release

This release adds the following features:

- [Allow card and checklist API creation for authorized board members](https://github.com/wekan/wekan/pull/2854).
  Thanks to Robert-Lebedeu.
- [Visual difference for inactive user in Administration: strikethrough](https://github.com/wekan/wekan/commit/1f1aea87a421ca5e7931d220d10c838574208e2c).
  Thanks to hever and xet7.

and adds the following updates:

- [Upgrade to Meteor 1.8.3 and Node 8.17.0. Update release scripts. Fix ldap background sync documentation part 2](https://github.com/wekan/wekan/commit/782d0b620988628f40f50f9cd824f6652cfb0dd9).
  Thanks to xet7.

and fixes the following bugs:

- [Fix: Don't add a blank space for empty custom fields on minicards](https://github.com/wekan/wekan/commit/e2a374f0aad8489a84d6de9966c281a812b5eca3).
  Thanks to roobre and xet7.
- [Fix: Allow to set empty card title, AssignedBy and RequestedBy](https://github.com/wekan/wekan/commit/25561946edf37351f67cf7500902dde7d9114d2f).
  Thanks to justinr1234 and xet7.
- [Fix comment text disappearing when clicking outside of comment text area.
  Fix lint error](https://github.com/wekan/wekan/commit/3b3950369ce07aa9e6fc4ab1bef9fb8a4993e398).
  Thanks to xet7.
- [Fix ldap background sync documentation](https://github.com/wekan/wekan/pull/2855).
  Thanks to koelle25.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.56 2019-11-21 Wekan release

This release adds the following updates:

- [Update to Meteor 1.8.2. Update dependencies](https://github.com/wekan/wekan/commit/38dfe0b9a71a083adc2de1a81170fea0e4a8e53f).
  Thanks to xet7.
- [Fix lint errors and update travis NPM version](https://github.com/wekan/wekan/commit/b0f345ba21830b033c9edcc8ee5252b280111ae7).
  Thanks to xet7.
- [Change base image to rolling, that is currently Ubuntu eoan
  version](https://github.com/wekan/wekan/commit/c66cc3d4dadb15b669256530cfda89359cdb9340).
  Thanks to xet7.
- [It seems Ubuntu eoan package bsdtar has been renamed to
  libarchive-tools](https://github.com/wekan/wekan/commit/c60967e935bdc0e7e9aea0a1c23178aee8a73c29).
  Thanks to xet7.

and fixes the following bugs:

- [Fix slow scroll on card detail by setting scrollInertia to 0](https://github.com/wekan/wekan/commit/599ace1db7918df41d9708d14b0351acb0f8688e).
  Thanks to cafeoh.
- [Fix lint errors](https://github.com/wekan/wekan/commit/788dd0a81a06efee165007a92780f9e8c2c754ac).
  Thanks to xet7.
- [Remove eslint option that does not work](https://github.com/wekan/wekan/commit/a06daff92e5f7cca55d1698252e3aa6526877c8b).
  Thanks to xet7.
- [Try to fix lint errors](https://github.com/wekan/wekan/commit/58e505f79a0617011576bdded9427b0d448d6107).
  Thanks to xet7.
- [Add to Snap MongoDB logging option --quiet](https://github.com/wekan/wekan/commit/c7ded515022fff2c1167ce8938405a846185a710).
  Thanks to fmeehan and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.55 2019-11-19 Wekan release

This release fixes the following bugs:

- [When logged in, use database for setting, so that changes are immediate. Only on public board use cookies.
  Comment out Collapse CSS that is not in use](https://github.com/wekan/wekan/commit/351d4767d7e93c90ac798769d6071da8730d834f).
  Thanks to xet7.
- [Use database when logged in. Part 2](https://github.com/wekan/wekan/commit/4786b0c18ddeb8f48525216eabebdced7159467d).
  Thanks to xet7.
- [Use database when logged in. Part 3](https://github.com/wekan/wekan/commit/115d23f9293cad8a93f18f75a47a8a65756f71ce).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.54 2019-11-18 Wekan release

This release adds the following new features:

- [New feature: Now there is popup selection of Lists/Swimlanes/Calendar/Roles](https://github.com/wekan/wekan/commit/96abe3c6914ce37d9fb44da8fda375e40ad65c9e).
  Thanks to xet7.
- [New feature, not set visible yet, because switching to it does not
  work properly yet: Collapsible Swimlanes](https://github.com/wekan/wekan/issues/2804).
  Thanks to xet7.

and fixes the following bugs:

- [Fix: Public board now loads correctly. When you select one of Lists/Swimlanes/Calendar view and
  reload webbrowser page, it can change view](https://github.com/wekan/wekan/issues/2311).
  Thanks to xet7.
- [Fix: List sorting commented out](https://github.com/wekan/wekan/issues/2800).
  Thanks to xet7.
- [Fix: Errors hasHiddenMinicardText, hasShowDragHandles, showSort, hasSortBy, profile,
  FirefoxAndroid/IE11/Vivaldi/Chromium browsers not working by using cookies instead of
  database](https://github.com/wekan/wekan/issues/2643#issuecomment-554907955).
  Note: Cookie changes are not always immediate, if there is no effect, you may need to
  reload webbrowser page. This could be improved later.
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.53 2019-11-14 Wekan release

This release fixes the following bugs:

- [Revert list sorting change of Wekan v3.51 because it reversed alphabetical sorting of
  lists](https://github.com/wekan/wekan/commit/ab2a721a1443b903cdbbbe275f41ffd3269012c6).
  Thanks to Dalisay and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.52 2019-11-14 Wekan release

This release fixes the following bugs:

- [Add database migration for assignee](https://github.com/wekan/wekan/commit/5b41d72e8de93833e1788962427422cff62c09a2).
  Thanks to ocdtrekkie and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.51 2019-11-14 Wekan release

This release fixes the following bugs:

- [Change sorting lists to work on desktop drag handle page instead,
  where it seems to work better](https://github.com/wekan/wekan/commit/bbc3ab3f994c5a61a4414bc64b05f5a03d259e46).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.50 2019-11-13 Wekan release

This release adds the following new features:

- [Allowing lists to be sorted by modifiedAt when not in draggable
  mode](https://github.com/wekan/wekan/commits/77f8b76d4e13c35ea3451622176bbb69a4d39a32).
  Thanks to whowillcare.
- Allow user to sort Lists in Board by his own preference boardadmin can star
  list [1](https://github.com/wekan/wekan/commit/bc2a20f04e32607f8488a9cecd815647fb43e40e),
  [2](https://github.com/wekan/wekan/commit/bc2a20f04e32607f8488a9cecd815647fb43e40e).
  Thanks to whowillcare.
- [Allowing user to filter list in Filter function not just cards
  commit](https://github.com/wekan/wekan/commit/d2d4840758b0f5aed7feb4f6a459bb2b2d1a3f0b).
  Thanks to whowillcare.
- [Allow user to search Lists in Board](https://github.com/wekan/wekan/commit/32f50e16586696ec7d100ce0438d1030ae1f606e).
  Thanks to whowillcare.
- Enhancement: [Set card times more sensible using the 'Today' button in
  datepicker](https://github.com/wekan/wekan/pull/2747).
  Thanks to liske.
- [At card, added Assignee field like Jira, and REST API for it](https://github.com/wekan/wekan/issues/2452).
  Parts:
  [Add assignee](https://github.com/wekan/wekan/commit/9e1aaf163f3bd0b3c2d2aee8225d111f83b3d421),
  [Remove Assignee. Avatar icon is at card and assignee details](https://github.com/wekan/wekan/commit/3e8f9ef1a5275a5e9b691c7e74dc73b97a43689a),
  [When selecting new assignee (+) icon, list shows names who to add](https://github.com/wekan/wekan/commit/32ce2b51d8bff5e8851732394a8bae3c56f8b0b6),
  [More progress](https://github.com/wekan/wekan/commit/ea823ab68fd5243c8485177e44a074be836836b8),
  [In add assignee popup, avatars are now visible](https://github.com/wekan/wekan/commit/56efb5c41075151eeb259d99990a7e86695b2b69),
  [Add assignee popup title](https://github.com/wekan/wekan/commit/31dbdc835d5a092b8360a4dbe93e9fbcce068855),
  [Prevent more than one assignee](https://github.com/wekan/wekan/commit/1728298659521ee8e6fc94fedad3160030b9a2c3),
  [When there is one selected assignee on card, don't show + button for adding more assignees, because there can only be one
  assignee](https://github.com/wekan/wekan/commit/3cf09efb13438d66db6cf739591c679ea538d812),
  [Now assignee is visible also at minicard](https://github.com/wekan/wekan/commit/9fd14f7ecb593d3debf5adff8f6c61adb0c3feca),
  [Update REST API docs, there can only be one assignee in array](https://github.com/wekan/wekan/commit/de7509dc60257667192054e320b381f9dd0f0a31).
  Thanks to xet7.
- [More mobile drag handles, and optional desktop drag handles](https://github.com/wekan/wekan/issues/2081): In Progress.
  Parts:
  [Some drag handle fixes](https://github.com/wekan/wekan/commit/6a8960547729148bd3085cb469f9e93d510ed66c),
  [Fix desktop swimlane drag handle position](https://github.com/wekan/wekan/commit/2ec15602d284122fce1a45bed352d0d4050162e2),
  [Fix card, list and swimlane move. Allow moving cards in multiselect mode](https://github.com/wekan/wekan/commit/537a48bede250155b30ec264904ba320625bab73).
  Thanks to xet7.

and adds the following updates:

- [Update Node.js to v8.16.2](https://github.com/wekan/wekan/commit/1eb3d25b40797fdab41d7dd59405cfcea81dcc61).
  Thanks to xet7.

and fixes the following bugs:

- Bug Fix [#2093](https://github.com/wekan/wekan/issues/2093), need to [clean up the
  temporary file](https://github.com/wekan/wekan/commit/2737d6b23f3a0fd2314236a85fbdee536df745a2).
  Thanks to whowillcare.
- Bug Fix [#2093](https://github.com/wekan/wekan/issues/2093): the broken [should be prior to file attachment feature introduced](https://github.com/wekan/wekan/commit/f53c624b0f6c6ebcc20c378a153e5cda8d73463c).
  Thanks to whowillcare.
- [Fix typo on exporting subtasks](https://github.com/wekan/wekan/commit/00d581245c1fe6a01ef372ca87d8a25bc7b937e4).
  Thanks to xiorcala.
- [Change the radom to random typo in export.js](https://github.com/wekan/wekan/commit/e195c731de88aba4026c239f4552ae821d522ec7).
  Thanks to whowillcare.
- Fix: [List last modify time will be affected by cards dueAt, endAt](https://github.com/wekan/wekan/commit/3308d90a3a6a1ddeed33966767937cd2c2c90cb5).
  Thanks to whowillcare.
- Revert creating new list to left, now creates again to right. Thanks to whowillcare.
  Revert New List item moved from right to left. Thanks to derbolle and xet7.
  [1](https://github.com/wekan/wekan/commit/806df30ba3499cef193eaf1b437cdef65282510f).
- REST API: [Fix deletion of a single board card](https://github.com/wekan/wekan/pull/2778).
  Thanks to liske.
- [cardDate: endDate coloring change](https://github.com/wekan/wekan/pull/2779).
  If no due-date timestamp is set => Gray.
  If end-date timestamp is younger than due-date timestamp => Green.
  If end-date timestamp is older than due-date timestamp => Red.
  Thanks to bandresen.
- [Fixed Card Open Webhook Error](https://github.com/wekan/wekan/issues/2780).
  Thanks to jymcheong.
- [Fixed OpenAPI docs generation](https://github.com/wekan/wekan/pull/2783).
  Thanks to bentiss.
- [Fixed close card button not visible on mobile web](https://github.com/wekan/wekan/36b5965dd07e3f0fd90069353310739c394c220f).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.49 2019-10-09 Wekan release

This release fixes the following bugs:

- [Fix prettier errors](https://github.com/wekan/wekan/commits/36e006fa4e78fe94e627625d1cc589654668f22a).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.48 2019-10-09 Wekan release

This release fixes the following bugs:

- [Make possible to upload attachments using drag-and-drop or Ctrl+V without setting the environmental-variable MAX_IMAGE_PIXEL](https://github.com/wekan/wekan/pull/2754).
  Thanks to moserben16.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.47 2019-10-09 Wekan release

This release fixes the following bugs:

- [REST API: fix handling of members property on card creation](https://github.com/wekan/wekan/pull/2751).

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.46 2019-10-07 Wekan release

This release fixes the following bugs:

- [More black minicard badges](https://github.com/wekan/wekan/commit/68be12d166b21a41b4e2c4021b0966807e5ed1e6).
  Thanks to sfahrenholz and xet7.
- [REST API: fix creation of Checklists](https://github.com/wekan/wekan/pull/2747).
  Thanks to liske.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.45 2019-10-03 Wekan release

This release adds the following new features:

- [Cards due timeline will be shown in Calendar view](https://github.com/wekan/wekan/pull/2738).
  Thanks to whowillcare.
- [Modified due day reminders in cards.js, so wekan server admin can control the reminder more flexibly](https://github.com/wekan/wekan/pull/2738).
  i.e. NOTIFY_DUE_DAYS_BEFORE_AND_AFTER = 0 notification will be sent on due day only.
  NOTIFY_DUE_DAYS_BEFORE_AND_AFTER = 2,0 it means notification will be sent on both due day and two days before.
  Thanks to whowillcare.
- [Added modifications the help files, related to NOTIFY_DUE_DAYS_BEFORE_AND_AFTER](https://github.com/wekan/wekan/pull/2740).
  Thanks to whowillcare.

and fixes the following bugs:

- [Modified list.style regarding .list-header-name when in mobile mode. It was too close to left arrow](https://github.com/wekan/wekan/pull/2740).
  Thanks to whowillcare.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.44 2019-09-17 Wekan release

This release adds the following languages:

- [Add language: Slovenian](https://github.com/wekan/wekan/commit/125231beff0fb84a18a46fe246fa12e098246985).
  Thanks to translators.

and fixes the following bugs:

- [Fix: in richer editor @ autocomplete doesn't really insert the username properly](https://github.com/wekan/wekan/pull/2717).
  Thanks to whowillcare.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.43 2019-09-17 Wekan release

This release fixes the following bugs:

- [In richer editor, @user might not get pickup correctly, if it's formated](https://github.com/wekan/wekan/pull/2715).
  Thanks to whowillcare.
- [Table content should have word-wrap](https://github.com/wekan/wekan/pull/2715).
  Thanks to whowillcare.
- [Two-way hooks locking mechanism will fail sometime, therefore, change all comment insert or update to direct, which means it won't invoke any hook](https://github.com/wekan/wekan/pull/2715).
  Thanks to whowillcare.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.42 2019-09-14 Wekan release

This release removed the following new features:

- [Revert drag handle changes of Wekan v3.41](https://github.com/wekan/wekan/commit/57119868bbb49f47c7d0b51b9952df9bd83d46f5).
  Thanks to Keelan.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.41 2019-09-13 Wekan release

This release adds the following new features:

- [More Mobile and Desktop drag handles for Swimlanes/Lists/Cards. Part 1](https://github.com/wekan/wekan/commit/ff550e91103115e7b731dd80c4588b93b2d4c64f).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.40 2019-09-11 Wekan release

This release fixes the following bugs:

- [Fix subcard selector](https://github.com/wekan/wekan/pull/2697).
  Thanks to justinr1234.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.39 2019-09-11 Wekan release

This release fixes the following bugs:

- [To load all boards, revert Wekan v3.37 Fix Linked cards make load all cards of database](https://github.com/wekan/wekan/commit/6ce8eeee6c477cd39b684c47bf122b5872818ada).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.38 2019-09-11 Wekan release

- Update translations. Thanks to translators.

# v3.37 2019-09-07 Wekan release

This release fixes the following bugs:

- LDAP: [Fix USERDN example, when parameters contain spaces](https://github.com/wekan/wekan/commit/6cbd4cabc716c755e547abb798f657fe5476ed04).
  LDAP_AUTHENTIFICATION_USERDN="CN=ldap admin,CN=users,DC=domainmatter,DC=lan" .
  Thanks to compumatter.
- [Fix: Linked cards make load all cards of database](https://github.com/wekan/wekan/commit/a56988c487745b2879cebe1943e7a987016e8bef).
  Thanks to Akuket.
- [Fix Unable to drag select text without closing card details](https://github.com/wekan/wekan/pull/2690).
  Thanks to justinr1234.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.36 2019-09-05 Wekan release

This release adds the following new features:

- [Complete the original author's webhook functions and add two-way webhook type](https://github.com/wekan/wekan/pull/2665):
  1. Make webhook function more complete by allowing user to specify name and token of
  a webhook to increase security.
  1. Allow wekan admin to sepcify a global webhook.
  3. Add new type of two-way webhook that can act on the JSON webhook return payload:
  3.1. If the payload data contains cardId, boardId, and comment key words,
  3.2. If it has commentId, an existing comment will be modified
  3.3. If it doesn't have commentId, then a new comment will be added, otherwise, does nothing.
  Thanks to whowillcare.
- [Patch admin search feature to Search in all users, not just "loaded" users
  in the client](https://github.com/wekan/wekan/pull/2667).
  Thanks to Akuket.
- [Devcontainer: Moved MAIL-Vars to not-committed file, and added PATH with meteor to
  Environment](https://github.com/wekan/wekan/pull/2672).
  Thanks to road42.

and fixes the following bugs:

- [Fix incorrect date types for created and updated, so now newest card comments are at top](https://github.com/wekan/wekan/pull/2679).
  Thanks to justinr1234.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.35 2019-08-29 Wekan release

This release fixes the following bugs:

- [Try to fix Snap](https://github.com/wekan/wekan/commit/71d32c6bc8e6affd345026797ff31e94a0a10d77).

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.34 2019-08-29 Wekan release

This release fixes the following bugs:

- [Snap: Delete all .swp files](https://github.com/wekan/wekan/commit/d5403bbfc53390aeaaf68eb452bc24d88f1e0942).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.33 2019-08-29 Wekan release

This release adds the following new features:

- [Add card color to calendar event. The color of the calendar event will match the card
  color](https://github.com/wekan/wekan/pull/2664).
  Thanks to grmpfhmbl.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.32 2019-08-29 Wekan release

This release fixes the following bugs:

- [Fix Snap adopt-info](https://github.com/wekan/wekan/commit/79d4cd83b1fa83bb814230683b7449ed7f3e1ede).
  Thanks to [popey at Snapcraft forum](https://forum.snapcraft.io/t/dirty-snap-release/12975/12).

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.31 2019-08-29 Wekan release

This release fixes the following bugs:

- [Try](https://github.com/wekan/wekan/commit/be5f435bc5f500b24bc838ac1dc8bf3bb9a33a22) to
  [fix adopt-info](https://forum.snapcraft.io/t/dirty-snap-release/12975/8).
  Thanks to ogra at Snapcraft forum.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.30 2019-08-29 Wekan release

This release fixes the following bugs:

- Snap: [Change version-script to adopt-info](https://github.com/wekan/wekan/commit/0ff5ce8fde6cc9a05a3c8b93e18ebce7282d3a67)
  to [fix dirty](https://forum.snapcraft.io/t/dirty-snap-release/12975/4).
  Thanks to popey and daniel at Snapcraft forum.
- [Delete another phantomjs binary from Snap](https://github.com/wekan/wekan/commit/5084102e6e17fa2cb3bc8c1180745e15379fab5f).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.29 2019-08-29 Wekan release

This release fixes the following bugs:

- [Fix Snap](https://github.com/wekan/wekan/commit/7761a22bb4e88ad9a5a39ed84e1ff244015c3a58).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.28 2019-08-29 Wekan release

This release fixes the following bugs:

- Fix broken Sandstorm release by reverting upgrading MongoDB.
  Thanks to xet7

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.27 2019-08-29 Wekan release

This release adds the following upgrades:

- [Upgrade Node, Mongo, fibers and qs](https://github.com/wekan/wekan/commit/e21c47d3cfe0f228ce5ab394142c6ec6ee090d65).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.26 2019-08-28 Wekan release

This release adds the following new features:

- [Add devcontainer](https://github.com/wekan/wekan/pull/2659) and some [related fixes](https://github.com/wekan/wekan/pull/2660).
  Thanks to road42.

and fixes the following bugs:

- [Add missing modules](https://github.com/wekan/wekan/pull/2653).
  Thanks to GhassenRjab.
- [Add package-lock.json](https://github.com/wekan/wekan/commit/ad01526124216abcc8b3c8230599c4eda331a86d).
  Thanks to GhassenRjab and xet7.
- [Fix last label undefined](https://github.com/wekan/wekan/pull/2657).
  Thanks to justinr1234.
- [Default to BIGEVENTS_PATTERN=NONE so that Wekan sends less email notifications](https://github.com/wekan/wekan/commit/0083215ea3955a950d345d44a8663e5b05e8f00f).
  Thanks to rinnaz and xet7.
- [Fix app hang when Meteor.user() is null and list spinner is loaded bug](https://github.com/wekan/wekan/pull/2654).
  Thanks to urakagi.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.25 2019-08-23 Wekan release

This release adds the following new features:

- [Limit card width to fixed size](https://github.com/wekan/wekan/commit/0dd3ff29f2b558bc912b330f178347035dcc46c7).
  Thanks to xet7.

and fixes the following bugs:

- [Fix](https://github.com/wekan/wekan/pull/2645) [selecting user accounts when importing from Trello](https://github.com/wekan/wekan/issues/2638).
  Thanks to justrinr1234.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.24 2019-08-22 Wekan release

This release fixes the following bugs:

- [Snap: Delete old MongoDB log, and log to syslog instead, because syslog usually already has
  log rotation](https://github.com/wekan/wekan/commit/cc792ddd57691bb54972c73b9c861c768fce8c34).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.23 2019-08-20 Wekan release

This release fixes the following bugs:

- [Fix login did not work](https://github.com/wekan/wekan/commit/b2deab544bfeea49017bec27f92f1269b0b7ec43).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.22 2019-08-20 Wekan release

This release adds the following new features:

- [Wrap minicard text labels to multiple rows](https://github.com/wekan/wekan/commit/af830812dbbf7d766a754d937308b11373c66e5a).
  Thanks to xet7.

and fixes the following bugs:

- [Fix: Some users cannot switch views or languages](https://github.com/wekan/wekan/issues/2630).
  Thanks to xet7 and justinr1234.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.21 2019-08-16 Wekan release

This release adds the following new features:

- [In the filter menu, 1) Turning on "show archive" will request archived lists and show them on the ListView.
  2) Turning on "hide empty lists" will hide empty lists on the ListView](https://github.com/wekan/wekan/pull/2632).
  Thanks to urakagi.

and fixes the following bugs:

- [Fix mismatched queries](https://github.com/wekan/wekan/pull/2628).
  Thanks to justinr1234.
- [Fix Summernote too wide when in mobile screen](https://github.com/wekan/wekan/issues/2621).
  Thanks to whowillcare.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.20 2019-08-15 Wekan release

This release fixes the following security issues:

- [Revert permission change](https://github.com/wekan/wekan/commit/d302d6f857657ada229f78d9fcd32f63753d9779),
  related [#2590](https://github.com/wekan/wekan/issues/2590) and
  [these comments](https://github.com/wekan/wekan/commit/9f6d615ee5bbdb7552e6bdcae75a76a7f74fef7a#commitcomment-34636513).
  Thanks to road42, justinr1234 and xet7.

and adds the following new features:

- On board, BoardAdmin and normal user can now [invite new user directly
  with email address](https://github.com/wekan/wekan/issues/2060),
  [without using Admin Panel or registering
  at /sign-up](https://github.com/wekan/wekan/commit/5c696e5a3c70d31a7af6e47cbcf691f6c18eb384).
  Thanks to xet7.

and fixes the following bugs:

- [Fix bug: When on board, clicking Admin Panel redirects to All Boards page, so it did require
  to click Admin Panel again](https://github.com/wekan/wekan/commit/d302d6f857657ada229f78d9fcd32f63753d9779).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.18 2019-08-15 Wekan release

This release adds the following new features:

- [Send webhook message](https://github.com/wekan/wekan/issues/2518) when
  [cardDetails is rendered](https://github.com/wekan/wekan/pull/2620).
  Thanks to jymcheong.
- Related to [above new feature](https://github.com/wekan/wekan/issues/2518),
  Add [setting CARD_OPENED_WEBHOOK_ENABLED=false as
  default](https://github.com/wekan/wekan/commit/b8c527d52bec7272c890385f11e26acec65822ae).
  Thanks to xet7.

and adds the following updates:

- [Update base64 dependency](https://github.com/wekan/wekan/commit/c87001fa9f8d1fa13640ae604b1ba46556c7813c).
  Thanks to xet7.

and fixes the following bugs:

- [Time line is missing delete/edit comments, add English i18n for these two activities,
  For html email msg needs](https://github.com/wekan/wekan/pull/2615).
  Thanks to whowillcare.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.17 2019-08-13 Wekan release

This release fixes the following bugs:

- [Fix ReferenceError: cardAssignees is not defined](https://github.com/wekan/wekan/issues/2612).
  Reverted In-Progress Assignee field, moving it to feature branch.
  Thanks to saschafoerster and to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.16 2019-08-13 Wekan release

This release adds the following new features:

- [Make Admin Panel text like version etc selectable](https://github.com/wekan/wekan/commit/5aa090e91184764afeac8b7c7bf4b4cb947c8f17).
  Thanks to xet7.
- [Add to Admin Panel / Version: Meteor version, MongoDB version, MongoDB storage engine, MongoDB Oplog
  enabled](https://github.com/wekan/wekan/commit/20294d833a2bf0bd1720444f4ffe018b025dacca).
  Thanks to RocketChat developers for MongoDB detection code and xet7 for other code.
- [Use Meteor 1.8.1 and MongoDB 3.2.22 in Snap](https://github.com/wekan/wekan/commit/39ffe1d80dad5759b338d4ed2d6c576717af2a07).
  Removed Meteor 1.6.x files.
  Thanks to xet7.
- [Enable HTML email content for richer comment](https://github.com/wekan/wekan/pull/2611).
  Thanks to whowillcare.

and fixes the following bugs:

- [Fix scrollHeight error when the sidebar is not visible](https://github.com/wekan/wekan/pull/2609).
  Thanks to Trekky12.
- [Fix insert action for CustomFields API](https://github.com/wekan/wekan/pull/2610).
  Thanks to JimCircadian.
- [Fixed a few issues related summernote enabled: 1) @ user couldn't send out email sometime, due to html format.
  2) @ user link wasn't able to show user info by clicking](https://github.com/wekan/wekan/pull/2611).
  Thanks to whowillcare.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.15 2019-08-11 Wekan release

This release fixes the following bugs:

- [Try to fix Snap](https://github.com/wekan/wekan/commit/a1d883b22f73f4bef6d547f94dcb900f475fcb41).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.14 2019-08-11 Wekan release

This release adds the following new features:

- [On wekan master specifying ATTACHMENTS_STORE_PATH, it will try its best keeping original attachments, only newer
  attachments will be stored into specified path](https://github.com/wekan/wekan/pull/2607).
  Thanks to whowillcare.
- [Made image upload in summernote as attachment to wekan board instead of base64 string,
  which would make the comments use less bytes and be able to take advantage of using local file system feature
  as attachment](https://github.com/wekan/wekan/pull/2608).
  Thanks to whowillcare.

and fixes the following bugs:

- [Fix bug: Unable to disable richer comment editor](https://github.com/wekan/wekan/pull/2607).
  Thanks to whowillcare.
- [Changed rm to rm -f in wekan snap build, and add packages that somehow didn't get install during snapcraft
  build](https://github.com/wekan/wekan/pull/2608).
  Thanks to whowillcare.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.13 2019-08-09 Wekan release

Update translations. Thanks to translators.

# v3.12 2019-08-09 Wekan release

This release adds the following new features:

- [Allowing wekan server admin to specify the attachments to be uploaded to server
  file system instead of mongodb by specifying a system
  env var: ATTACHMENTS_STORE_PATH](https://github.com/wekan/wekan/pull/2603).
  The only caveat for this is if it's not a brand new wekan, if the wekan
  server admin switchs to this setting, their old attachments won't be available
  anymore, unless someone make a script to export them out to the filesystem.
  Thanks to whowillcare.
- [Allowing user to insert video, link and image, or paste in html with sanitization.
  In user comments display area, images can be clicked and shown as
  swipebox](https://github.com/wekan/wekan/pull/2593).
  Thanks to whowillcare.

and fixes the following bugs:

- [Fix comment-editor marking issue](https://github.com/wekan/wekan/issues/2575).
  Thanks to whowillcare.
- [Bugfix: style kbd font color became white after introduced summernote editor
  to card comments](https://github.com/wekan/wekan/pull/2600).
  Thanks to whowillcare.
- [Show All Boards / Clone Board and Archive Board only to BoardAdmin/Admin/Sandstorm users
  on desktop webbrowser view, so that it's not possible for normal users to make accidental
  clicks to those](https://github.com/wekan/wekan/issues/2599).
  Thanks to derbolle and xet7.
- [Fix bug on editing users informations, switching to other view, staring
  a board](https://github.com/wekan/wekan/issues/2590).
  Thanks to road42.
- [Fix null access with board body](https://github.com/wekan/wekan/pull/2602).
  Thanks to justinr1234.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.11 2019-08-07 Wekan release

This release fixes the following bugs:

- [Remove non-existing file from snapcraft.yaml to get Snap to build](https://github.com/wekan/wekan/commit/ad82a900e8ec636a72c6e74bb8489559ce2a8bf0).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.10 2019-08-07 Wekan release

This release fixes the following bugs:

- [Add missing dependencies back and revert deleting phantomjs](https://github.com/wekan/wekan/commit/32e9aa0ddaf1b015825b8c62ad17ed74b449e4b1).
  Thanks to whowillcare and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.09 2019-08-07 Wekan release

This release adds the following features:

- [Hide minicard label text: per user checkbox setting at sidebar](https://github.com/wekan/wekan/commit/f7e0b837d394d55d66d451c34f43fa8afd357e5b).
  Thanks to xet7.

and fixes the following bugs:

- [Make Save button visible again at Admin Panel People Edit](https://github.com/wekan/wekan/commit/716fc32968e7dd51b64a11c6c33e59aee849c982).
  Thanks to sclerc-chss and xet7.
- [Fix checking if API is enabled](https://github.com/wekan/wekan/pull/2588).
  Thanks to justinr1234.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.08 2019-08-07 Wekan release

This release fixes the following bugs:

- [Removed removing phantomjs from snap, because snap build did stop to error
  no phantomjs could be removed](https://github.com/wekan/wekan/commit/7d8f1dee62f285a4587fb40e7331d0f500b2e5fb).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.07 2019-08-07 Wekan release

This release fixes the following bugs:

- [Try to make release sizes smaller by deleting phantomjs](https://github.com/wekan/wekan/commit/1fc3a1db2e663f149287b6e14053d536fb1a8a81).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.06 2019-08-07 Wekan release

This release fixes the following bugs:

- [Fix board query](https://github.com/wekan/wekan/pull/2587).
  Thanks to justinr1234.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.05 2019-08-07 Wekan release

This release fixes the following bugs:

- [Fixed LDAP group filtering bug on Snap settings](https://github.com/wekan/wekan/pull/2584).
  Thanks to KuenzelIT.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.04 2019-08-06 Wekan release

This release fixes the following bugs:

- [Fixed Snap: Use Meteor 1.6.0.1 dependencies on Snap on master branch](https://github.com/wekan/wekan/commit/74a4b28313e9cfedcb927e4496c0dd3800b1e6f9).
  Thanks to xet7.
- [Hide Admin Panel user delete button until someone has time to fix it](https://github.com/wekan/wekan/commit/b9a25ecfaca067d0392c83d97a0deb65e6e296dd).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.03 2019-08-04 Wekan release

This release adds the following new features:

- [Add RICHER_CARD_COMMENT_EDITOR=true to docker-compose.yml](https://github.com/wekan/wekan/commit/268f9de23c8167dca9499587ee31fb74edb6b83e).
  Thanks to xet7.
- [Add popup to confirm deleting one account](https://github.com/wekan/wekan/pull/2573).
  Thanks to Akuket.
- [Add admin setting to prevent users to self deleting their account](https://github.com/wekan/wekan/pull/2573).
  Thanks to Akuket.
- [Add Packager.io DEB/RPM Wekan packages for Debian/Ubuntu/CentOS/SLES](https://packager.io/gh/wekan/wekan).
  Does not work yet, [debugging in progress here](https://github.com/wekan/wekan/issues/2582).
  Thanks to xet7 and sfahrenholz.
- [Add setting field LDAP_USER_AUTHENTICATION_FIELD=uid](https://github.com/wekan/wekan/pull/2581).
  Thanks to Trekky12.

and adds the following upgrades:

- [Upgrade MongoDB to 4.0.11](https://github.com/wekan/wekan/commit/ec35c544b780e563a973fd887c5190f429431bfb).
  Thanks to xet7.

and fixes the following bugs:

- [Remove mixmax:smart-disconnect, previously it did disconnect Wekan when
  browser tab was not active, but because now users are working on multiple
  boards at different browser tabs and switching all time time, there was
  constant loading, so now after removing all tabs keeps active. This can
  increase server CPU usage](https://github.com/wekan/wekan/commit/669cd76018cbbfbd3ee58610a35959fa8a84ea36).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.02 2019-07-26 Wekan release

This release adds the following updates:

- [Updated Wekan on OpenShift](https://github.com/wekan/wekan/commit/85ca2b1363ed0bad8639ba7ed65c55e445816947).
  Thanks to xet7.

and fixes the following bugs:

- [Set LDAP_BACKGROUND_SYNC_INTERVAL='' (empty string) so it works](https://github.com/wekan/wekan/commit/fff144a8279ac36ce83e6b975f17f6dbc35f39d6)
  and [does not crash](https://github.com/wekan/wekan/issues/2354#issuecomment-515305722).
  Also updated wekan-postgresql docker-compose.yml to use devel branch docker image, because ToroDB requires MongoDB 3.2,
  it's not tested yet could newest master branch docker image work with MongoDB 3.2.
  Thanks to benh57 and xet7.

and tries to fix following bugs:

- [Try to fix Snap](https://github.com/wekan/wekan/commit/7cf6850cdf77ef51808784e3d275c5be86ff6c92).
  This [will be tested soon, does this work](https://github.com/wekan/wekan/issues/2533#issuecomment-515329490).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.01 2019-07-26 Wekan release

This release adds the following new features:

- [Rich text editor at card comments, based on
  Summernote](https://github.com/wekan/wekan/pull/2560).
  Thanks to whowillcare.
- [Add setting RICHER_CARD_COMMENT_EDITOR=true to
  Source/Snap/Docker/Sandstorm](https://github.com/wekan/wekan/commit/4aba290358455433c0fc676e8c9cf1bd627eddde).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v3.00 2019-07-25 Wekan release

This release:

- works with source, and docker-compose.yml at master branch.
- Docker release uses Meteor 1.8.1 and MongoDB 4.0.10, so you need to backup your old MongoDB database and
  restore with --noIndexRestore as described at https://github.com/wekan/wekan/wiki/Backup
- Snap and Sandstorm builds are not fixed yet, see progress at https://github.com/wekan/wekan/issues/2533

This release adds the following new features:

- [Added label text to labels on minicard](https://github.com/wekan/wekan/commit/c48d5a73cab04db1a1e113e4367dc88573110438).
  Thanks to xet7.
- [Allow to shrink attached/pasted image](https://github.com/wekan/wekan/pull/2544).
  Thanks to whowillcare.

and fixes the following bugs:

- [Fix invites](https://github.com/wekan/wekan/pull/2549).
  Thanks to justinr1234.
- [Makes LDAP background sync work. If the sync interval is unspecified, falls back to a hourly default](https://github.com/wekan/wekan/pull/2555).
  Thanks to pshunter.
- [Prevent isCommentOnly user adding attachments, editing list names, moving lists,
  and seeing board settings menu. Show non-editable Custom Fields to isCommentOnly user](https://github.com/wekan/wekan/commit/a68c928896a94c377134f29a7183aa0b5a423720).
  Thanks to xet7.
- [Many](https://github.com/wekan/wekan/pull/2546) [Snap](https://github.com/wekan/wekan/pull/2552) [fixes](https://github.com/wekan/wekan/pull/2553).
  In Progress. Thanks to justrinr1234.
- [Fixed Dockerfile](https://github.com/wekan/wekan/commit/7df6f305c5cf41ac213623aeffaa7e48c981e0b6) and
  [docker-compose.yml](https://github.com/wekan/wekan/commit/95698911f92ca728dbaab69406fd09bcbf81339d).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.99 2019-07-17 Wekan release

This release adds the following new features:

- [Add Corteza theme. In progress](https://github.com/wekan/wekan/commit/289e78dbd29cca9d97d3b5787c3368583d43b40f).
  Thanks to xet7.
- [Notify Due Days: System timelines will be showing any user modification for duat startat endat receivedat,
  also notification to the watchers and if any card is due, about due or past due](https://github.com/wekan/wekan/pull/2536).
  ENV variables: NOTIFY_DUE_DAYS_BEFORE_AND_AFTER (default is 2, if 0, will turn off notification for and dued cards),
  NOTIFY_DUE_AT_HOUR_OF_DAY (any number between 0 - 23, standing for at what hour of a day that the notification will
  be sent to the watchers). Also [bug fix for this, timeOldValue needs to set to "" in params when it's
  not set](https://github.com/wekan/wekan/pull/2541).
  Thanks to whowillcare.
- [Notify Due Days: Add settings to Snap/Docker/Source. Rename env variables to NOTIFY_DUE_DAYS_BEFORE_AND_AFTER and
  NOTIFY_DUE_AT_HOUR_OF_DAY](https://github.com/wekan/wekan/commit/5084cddf37ba16ce0855f8575c39f5e62d1b7f67).
  Thanks to xet7.
- [BIGEVENTS_PATTERN: When user being @ in comment, as long as it's not himself, a notification will be
  sent out no matter this user is watching the board or not](https://github.com/wekan/wekan/pull/2541).
  Introduced a system env var BIGEVENTS_PATTERN default as "due", so any activityType matches the pattern,
  system will send out notifications to all board members no matter they are watching or tracking
  the board or not. Owner of the Wekan server can disable the feature by setting this variable to "NONE"
  or change the pattern to any valid regex. i.e. '|' delimited activityType names.
  Thanks to whowillcare.
- [Add BIGEVENTS_PATTERN to Source/Snap/Docker](https://github.com/wekan/wekan/commit/d7c09df7d2649bf2d2b61772c251f81793a6ed77).
  Thanks to xet7.

and adds the following updates:

- [Update Meteor mongo package version](https://github.com/wekan/wekan/commit/96065d11a543852c1069cbab528bd08508b4a27c).
  Thanks to xet7.
- [Update dependencies](https://github.com/wekan/wekan/commit/d82c72f1c1df908e92045e5034fa12b33fc7f70c).
  Thanks to xet7.

and fixes the following bugs:

- RELAX THEME: Use [only in this theme](https://github.com/wekan/wekan/commit/3ad6e554dceea822dee7390872260e872a792dcd)
  the aggressive [red color and big bold serif font style
  number](https://github.com/wekan/wekan/commit/bbc68309af0029f2bc4194db4c7e79689f888ea4#commitcomment-34216371) and
  [card details text emphasis](https://github.com/wekan/wekan/commit/48ebc5f11745b125ce01d08d60e2d8e3a9419a5f#commitcomment-34268095)
  Thanks to hever and xet7.
- [Try to fix docker-compose.yml to use correct master branch that has
  meteor 1.8.1](https://github.com/wekan/wekan/commit/202cc5a797b6269ec422c6f2e532a49f09d4e30a).
  Thanks to xet7.
- [Outgoing Webhooks setCustomField: Add board name, card name, custom field name to be
  visible](https://github.com/wekan/wekan/commit/2003d90467debeadf51b69630c80ee6040524f52).
  Still missing: custom field value, list name, swimlane name.
  Thanks to xet7.
- [Don't remove boardoverlay when mouse leaves carddetails](https://github.com/wekan/wekan/pull/2540).
  This reduces Wekan board flashiness.
  Thanks to newhinton.
- [Limit the board list to 2 or 1 for mobile clients](https://github.com/wekan/wekan/pull/2542).
  As a mobile user, the board size of in the home page too small, so the user is easily to
  click on archive or copy button by accident. Increase the board size to 50% for pixel
  greater than 360 and lesser than 800 and height to 8rem, 100% for any screen is even smaller.
  This will reduce the accident much more.
  Thanks to whowillcare.
- [Add check for board member isActive](https://github.com/wekan/wekan/commit fe42eb1d014c06dfed8114a00b29eac9b08baec6).
  Thanks to xet7.

and has the following features in progress, not anything visible yet:

- [Teams/Organizations: Add beginnings of database structure](https://github.com/wekan/wekan/issues/802#issuecomment-505986270).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.98 2019-07-02 Wekan release

This release adds the following new features, thanks to xet7:

- [Add Wekan v2.95-v2.97 master branch features and fixes to meteor-1.8 branch](https://github.com/wekan/wekan/commit/34b2168d0dda253dedabbee47031873efa4ae446).

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.97 2019-07-01 Wekan release

This release [adds the following new features](https://github.com/wekan/wekan/commit/3e8cb8c6e1617ef03ebce045d3b93aeb2cf91228), thanks to xet7:

- Add background color names to background colors.
- Add new background colors: moderatepink, strongcyan, limegreen.
- Add new background colors with themes: dark, relax.

Note: Due Date etc on cards is visible on all background colors and themes. Hiding is not implemented yet.

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.96 2019-07-01 Wekan release

This release removes the following features, that were added at Wekan v2.95:

- [Remove RELAX MODE and DARK MODE](https://github.com/wekan/wekan/commit/8477e94f3b8f531a4209f49758200009d274c1cf),
  because [they changed look of all existing boards](https://github.com/wekan/wekan/issues/1149#issuecomment-507255114).
  At some later Wekan release they will be added back as separate themes
  that can be selected, without changing existing boards.
  Thanks to chirrut2 and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.95 2019-07-01 Wekan release

This release adds the following new features, thanks to xet7:

- [Make list header add card + button more black, to make it more visible](https://github.com/wekan/wekan/commit/b260d05a8b2f87c29dd998d42103d1220b20cc08).
- [On minicard, make comment icon and number of comments have red color
  on white rounded background, so it is more visible when there is comments on card](https://github.com/wekan/wekan/commit/bbc68309af0029f2bc4194db4c7e79689f888ea4).
- [Make card description text more visible with black borders and more white text area](https://github.com/wekan/wekan/commit/48ebc5f11745b125ce01d08d60e2d8e3a9419a5f).

and adds the following [themes to board background colors](https://github.com/wekan/wekan/commit/c04292e98832e3aa7952e8a7858d47a853f40aad), thanks to xet7:

- RELAX MODE, so when green background selected, list background is light green.
- [DARK MODE](https://github.com/wekan/wekan/issues/1149), when dark backgroud color selected. Please test and send color visibility fixes as pull requests.
- In RELAX MODE and DARK MODE, [hide card fields: received, start, due, end, members, requested, assigned](https://github.com/wekan/wekan/commit/b42ecb7948ad194433dc4460305174965106a751).

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.94 2019-06-29 Wekan release

This release adds the following updates:

- [Prettier & eslint project style update](https://github.com/wekan/wekan/pull/2520).
  Thanks to justinr1234.

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.93 2019-06-28 Wekan release

This release fixes the following bugs:

- [LDAP: Check if email attribute is an array, that has many email addresses](https://github.com/wekan/wekan/pull/2519).
  Thanks to tdemaret and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.92 2019-06-27 Wekan release

This release fixes the following bugs:

- [Fix Outgoing Webhook messages for Checlists, Checklist Items, Card comments, Add/Remove CustomField to board](https://github.com/wekan/wekan/commit/5283ba9ebbedf11540ffef1d4d87891c5ce9efc7).
  Not yet fixed is Outgoing Webhook message about setting CustomField value.
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.91 2019-06-27 Wekan release

This release fixes the following bugs:

- [Fix Attachment Outgoing Webhook missing list and swimlane name](https://github.com/wekan/wekan/commit/6a2f120d00b5ce9089ad2e12d01edb1ed9f94800).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.90 2019-06-21 Wekan release

This release reverts the following Sandstorm changes:

- [Revert v2.89 setting every Sandstorm Wekan user as admin](https://github.com/wekan/wekan/commit/e5c0d0ea18fe74a47afdfe101160280854e2c74f).
  Thanks to xet7. [Related #2405](https://github.com/wekan/wekan/issues/2405).

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.89 2019-06-21 Wekan release

This release adds the following Sandstorm features:

- [Sandstorm Wekan: Set everyone as Admin](https://github.com/wekan/wekan/commit/60d62a6ae3a79059e68b2cd1d554d67b7d50b6aa).
  Please test does this help with [Problem with the user management: can't add users or give wekan admin rights](https://github.com/wekan/wekan/issues/2405).
  Thanks to xet7.
- [If board does not exist, redirect to All Boards page, at all Wekan platforms](https://github.com/wekan/wekan/commit/4f46adc389126597266d71110f9754841f86857c).
  So now at Sandstorm when loading Wekan grain, if first Sandstorm board is found,
  it is opened. If first Sandstorm board is not found (it's deleted or archived),
  then redirect automatically to All Boards page. [Closes #3132](https://github.com/wekan/wekan/issues/3132).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.88 2019-06-21 Wekan release

This release adds the following updates:

- Update translations.

Thanks to translators for their translations.

# v2.87 2019-06-21 Wekan release

This release adds the following new features:

- [Rule cardAction - SetDate](https://github.com/wekan/wekan/pull/2506).
  Thanks to road42.

and fixes the following bugs:

- [Fix Move card to top/bottom of list](https://github.com/wekan/wekan/pull/2508).
  Thanks to road42.
- [Translation fixes](https://github.com/wekan/wekan/pull/2507).
  Thanks to road42.

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.86 2019-06-19 Wekan release

This release fixes the following bugs:

- [Fix Wekan unable to Select Text from Description edit box](https://github.com/wekan/wekan/issues/2451)
  by removing feature of card description submit on click outside. This is because when selecting text
  and dragging up did trigger submit of description, so description was closed and selecting text failed.
  This did affect all Chromium-based browsers: Chrome, Chromium, Chromium Edge.
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.85 2019-06-19 Wekan release

This release fixes the following bugs:

- [Fixed bug: rule doesn't move card to top/bottom](https://github.com/wekan/wekan/pull/2502).
  Thanks to road42.

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.84 2019-06-18 Wekan release

This release fixes the following bugs:

- [Buttons for adding rules to a board where missing for isBoardAdmin](https://github.com/wekan/wekan/pull/2500).
  Thanks to road42.

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.83 2019-06-17 Wekan release

This release fixes the following bugs:

- [Fix Bug: Unable to click board submenu on mobile](https://github.com/wekan/wekan/commit/7ff6f24a90374ae95edbb87b37e0c235e7aee434).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.82 2019-06-14 Wekan release

This release fixes the following bugs:

- [Fix OIDC Docker login. Empty string results to empty array at wekan/server/authentication.js](https://github.com/wekan/wekan/commit/bddbaa7bc2f3cfe8553a2265e168231ab51876f3).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.81 2019-06-13 Wekan release

This release fixes the following bugs:

- [Change OAuth2 whitelist default to empty string at snap, so it would be used as array on
  wekan/server/authentication.js](https://github.com/wekan/wekan/commit/4334fbbb9dacf45b0262019526a9697b015049a1).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.80 2019-06-13 Wekan release

This release fixes the following bugs:

- [Fix OAuth2 typos in snap-src/bin/config](https://github.com/wekan/wekan/commit/44dbd462b19e613fcb47161d44e4046d5d91a319).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.79 2019-06-13 Wekan release

This release fixes the following bugs:

- [Fix OAuth2 typos in Dockerfile and docker-compose.yml](https://github.com/wekan/wekan/pull/2488).
  Thanks to DominikPf.

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.78 2019-06-12 Wekan release

This release fixes the following bugs:

- [Try to fix OIDC login](https://github.com/wekan/wekan/commit/8b31c0768c34fc4557b54cec936a0b4288a8e722).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.77 2019-06-11 Wekan release

This release fixes the following bugs:

- [Fix Snap build](https://github.com/wekan/wekan/commit/e1e20275a673d3065c6cf239db8d2f1a505baa69).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.76 2019-06-11 Wekan release

This release adds the following new features:

- [Add support for CORS headers "Access-control-allow-headers" and
  "Access-control-expose-headers"](https://github.com/wekan/wekan/pull/2429).
  Thanks to risacher and xet7.
- [Support scopes in OAuth2, so that Authentication via OAuth2 with Google is now possible](https://github.com/wekan/wekan/pull/2483).
  Thanks to moserben16.

and fixes the following bugs:

- [Fix Scope parsing Issue for OAuth2 Login with simple String](https://github.com/wekan/wekan/pulls/2427).
  Thanks to DominikPf.
- [Show attachment name in Outgoing Webhook when attachment is added to card](https://github.com/wekan/wekan/commit/992ecfefa2e46ee7321ec9b8bfc3400532e5645e).
  Thanks to xet7. Related [#2285](https://github.com/wekan/wekan/issues/2285).
- [Show attachment name in Outgoing Webhook when attachment is removed from card](https://github.com/wekan/wekan/commit/23ccb3b991be6d7196e59f7d68df17b8949df049).
  Thanks to xet7. Related [#2285](https://github.com/wekan/wekan/issues/2285).
- [Allow BoardAdmin to create board rules](https://github.com/wekan/wekan/pull/2433).
  Thanks to road42.
- [Fix typo](https://github.com/wekan/wekan/pull/2442).
  Thanks to Jason-Cooke.

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.75 2019-05-22 Wekan release

This release adds the following new features:

- [CAS allowed LDAP groups](https://github.com/wekan/meteor-accounts-cas/pull/4).
  Thanks to ppoulard. Please test. Related [#2356](https://github.com/wekan/wekan/issues/2356).

and fixes the following bugs:

- [Fix](https://github.com/wekan/wekan/commit/634df8f6f26a7a7a2df6f87a705d322d88638425):
  [OAuth2 Requested Scopes are wrong / cannot be configured](https://github.com/wekan/wekan/issues/2412).
  Thanks to DominikPf and xet7. Please test.

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.74 2019-05-14 Wekan release

This release fixes the following bugs:

- Add missing [wekan-ldap#40](https://github.com/wekan/wekan-ldap/pull/40) code about
  [LDAP_SYNC_ADMIN_STATUS](https://github.com/wekan/wekan/commit/0fe40ad9ec82ef2045578f4cc1e2ebb6cc80d47a).
  Thanks to JulianJacobi, n-st, chirrut2 and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.73 2019-05-14 Wekan release

This release fixes the following bugs with Apache I-CLA:

- [Card count placement and export API functionality back](https://github.com/wekan/wekan/pulls/2406).
  Thanks to bentiss.
- [Few fixes for Dockerfile](https://github.com/wekan/wekan/pulls/2407).
  Thanks to bentiss.

and fixes the following bugs:

- Fixed [#2338](https://github.com/wekan/wekan/issues/2338) -> [Slow opening of big boards with too many archived items](https://github.com/wekan/wekan/pull/2402).
  If some Wekan users see errors with this, please empty your browser cache.
  Thanks to nerminator.

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.72 2019-05-13 Wekan release

This release adds the following new features:

- [Added BIDI support to "Add Card"](https://github.com/wekan/wekan/pull/2401).
  Related [#884](https://github.com/wekan/wekan/issues/884).
  Thanks to guyzyl.

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.71 2019-05-12 Wekan release

This release adds the following new features:

- [Add partentId support on card web API](https://github.com/wekan/wekan/pulls/2400).
  Thanks to atilaromero.

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.70 2019-05-11 Wekan release

This release adds the following new features:

- [View markdown on List names, Custom Fields (Text and Dropdown), Label names,
  All Boards view Board names and Board descriptions](https://github.com/wekan/wekan/commit/b795115042c2eb6bccbf029f21d78849a44128ca).
  Related [#2334](https://github.com/wekan/wekan/issues/2334).
  Thanks to shaygover and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.69 2019-05-11 Wekan release

This release fixes the following translation names:

- [Fix translation name in Wekan menu: oc to Occitan](https://github.com/wekan/wekan/commit/db40ca25ac5df17fcc8b7c93f12b7e2bffc349d2).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.68 2019-05-10 Wekan release

This release adds the following new features:

- [Option to login to the LDAP server with the user's own username and password, instead of an administrator
  key](https://github.com/wekan/wekan/pull/2399). Default: false (use administrator key).
  With new setting: LDAP_USER_AUTHENTICATION=true.
  Thanks to thiagofernando.
- [Added above new LDAP_USER_AUTHENTION=true option to Snap, Docker and Source settings](https://github.com/wekan/wekan/commit/3bbc805ee42e3c1638b50260d3fafc2b5f936923).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.67 2019-05-10 Wekan release

This release adds the following new features:

- [Move board to Archive button at each board at All Boards page](https://github.com/wekan/wekan/commit/828f6ea321020eda77fea399df52889e2081dfac).
  Thanks to xet7. Related [#2389](https://github.com/wekan/wekan/issues/2389).
- [If adding Subtasks does not work on old board, added wiki page how to make it work again](https://github.com/wekan/wekan/wiki/Subtasks).
  Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.66 2019-05-09 Wekan release

This release adds the following new features:

- [Delete user feature](https://github.com/wekan/wekan/pull/2384).
  Thanks to Akuket.
- Change to Delete user feature: [When last board admin is removed, board is not deleted, other board users can
  still use it](https://github.com/wekan/wekan/commit/e1b016cf3d4ff93e9e0fe1feb96372e3e1625233).
  Thanks to xet7.

and adds the following new translations:

- Add Chinese (Hong Kong).
  Thanks to translators.

and fixes the following bugs:

- [Fix OIDC login](https://github.com/wekan/wekan/pull/2385). Related [#2383](https://github.com/wekan/wekan/issues/2383).
  Thanks to faust64.
- [Fix missing profile checks](https://github.com/wekan/wekan/pull/2396).
  Thanks to justinr1234.
- [Fix RTL issue #884, part 1](https://github.com/wekan/wekan/pull/2395).
  Thanks to guyzyl.

Thanks to above GitHub users for their contributions and translators for their translations.

# v2.65 2019-04-24 Wekan release

This release adds the following new features:

- [Now a loading animation is displayed when the authentication is performed. This allows users
  to know that it's in progress](https://github.com/wekan/wekan/pull/2379).
  Thanks to Akuket.

and removes the following UI duplicates:

- [Remove from card menu, because they also exist at card:
  members, labels, attachments, dates received/start/due/end](https://github.com/wekan/wekan/issues/2242).
  Thanks to sfahrenholz, jrsupplee and xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

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
  Thanks to hupptechnologies.
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
