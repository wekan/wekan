# Upcoming Wekan release

This release adds the following new features:

* [Change the way to delete a list (card-like)](https://github.com/wekan/wekan/pull/1050), fixes
  [missing undo button](https://github.com/wekan/wekan/issues/1023);
* [When deleting list, delete list's cards too](https://github.com/wekan/wekan/pull/1054);
* [Re-enable Export Wekan Board](https://github.com/wekan/wekan/pull/1059);
* [Sort languages by their translated names](https://github.com/wekan/wekan/pull/1070);
* [Add Breton language name](https://github.com/wekan/wekan/pull/1071).

and fixes the following bugs:

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
  On both cases, althrought environment variable is set, updating admin-panel
  mail settings will load new info and ignore the environment variable;
* Dockerfile fix for local packages;
* Don't send emails if missing smtp host;
* Remove invitation code if email sending failed;
* Show customized error msg while invitaion code is wrong during registration;
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
  one from Gravatar or the user initials (on Sandstrom we use the avatar exposed
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
