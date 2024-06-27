# Routing

We're using [FlowRouter](https://github.com/kadirahq/flow-router) client side router inside **[config/router.js](https://github.com/wekan/wekan/tree/main/config/router.js)**.
For accounts there is [AccountsTemplates](https://github.com/meteor-useraccounts) configured in **[config/accounts.js](https://github.com/wekan/wekan/tree/main/config/accounts.js)**.

# Client

## public

Files in this directory are served by meteor as-is to the client. It hosts some (fav)icons and fonts.
**[wekan-manifest.json](https://github.com/wekan/wekan/tree/main/wekan-manifest.json)**: goes into `link rel="manifest"` in the header of the generated page and is a [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest).

## components

* **[activities](https://github.com/wekan/wekan/tree/main/client/components/activities)**:
  * **[activities.jade](https://github.com/wekan/wekan/tree/main/client/components/activities/activities.jade)**: `activities` template for the list of activities placed inside a `sidebar-content`; uses `boardActivities` or `cardActivities` depending on `mode`; <span style="color:red">*XXX: does this mean that sidebar should be visible in board list mode? when does the `board` activity gets shown?*</span>
  * **[comments.jade](https://github.com/wekan/wekan/tree/main/client/components/activities/comments.jade)**: `commentForm` template used in `card-details-canvas` for adding comments;
* **[boards](https://github.com/wekan/wekan/tree/main/client/components/boards)**:
  * **[boardArchive.jade](https://github.com/wekan/wekan/tree/main/client/components/boards/boardArchive.jade)**: `archivedBoards` template for the modal dialog showing the list of archived boards that might be restored;
  * **[boardBody.jade](https://github.com/wekan/wekan/tree/main/client/components/boards/boardBody.jade)**: top level template for presenting a board is `board` and, based on screen size and current state, it uses either `cardDetails` or `boardBody` templates; `boardBody` is the one including the `sidebar`, each `list`, `cardDetails` for larger screens when a card is selected and the `addListForm` for adding a new list (also defined in this file);
  * **[boardHeader.jade](https://github.com/wekan/wekan/tree/main/client/components/boards/boardHeader.jade)**: `boardHeaderBar`, `boardMenuPopup`, `boardVisibilityList`, `boardChangeVisibilityPopup`, `boardChangeWatchPopup`, `boardChangeColorPopup`, `createBoard`, `chooseBoardSource`, `boardChangeTitlePopup`, `archiveBoardPopup`, `outgoingWebhooksPopup`;
  * **[boardsList.jade](https://github.com/wekan/wekan/tree/main/client/components/boards/boardsList.jade)**: `boardList` and `boardListHeaderBar` for the list of boards in the initial screen;
* **[cards](https://github.com/wekan/wekan/tree/main/client/components/cards)**:
  * **[attachments.jade](https://github.com/wekan/wekan/tree/main/client/components/cards/attachments.jade)**: `cardAttachmentsPopup`, `previewClipboardImagePopup`, `previewAttachedImagePopup`, `attachmentDeletePopup`, `attachmentsGalery`;
  * **[cardDate.jade](https://github.com/wekan/wekan/tree/main/client/components/cards/cardDate.jade)**: `editCardDate` and `dateBadge` templates;
  * **[cardDetails.jade](https://github.com/wekan/wekan/tree/main/client/components/cards/cardDetails.jade)**: `boardsAndLists` is the usual layout for a board display with `boardLists` being used in sandstorm where each board is independent;`cardDetails`, `editCardTitleForm`, `cardDetailsActionsPopup`, `moveCardPopup`, `copyCardPopup`,`cardMembersPopup`,`cardMorePopup`, `cardDeletePopup`;
  * **[cardTime.jade](https://github.com/wekan/wekan/tree/main/client/components/cards/cardTime.jade)**: `editCardSpentTime` and `timeBadge` templates;
  * **[checklists.jade](https://github.com/wekan/wekan/tree/main/client/components/cards/checklists.jade)**: `checklists`, `checklistDetail`, `checklistDeleteDialog`, `addChecklistItemForm`, `editChecklistItemForm`, `checklistItems`, `itemDetail`;
  * **[labels.jade](https://github.com/wekan/wekan/tree/main/client/components/cards/labels.jade)**: `formLabel`, `createLabelPopup`, `editLabelPopup`, `deleteLabelPopup`, `cardLabelsPopup`;
  * **[minicard.jade](https://github.com/wekan/wekan/tree/main/client/components/cards/minicard.jade)**: has the `minicard` template
* **[forms](https://github.com/wekan/wekan/tree/main/client/components/forms)**: **[inlinedform.jade](https://github.com/wekan/wekan/tree/main/client/components/forms/inlinedform.jade)** has the`inlinedForm` template;
* **[import](https://github.com/wekan/wekan/tree/main/client/components/import)**:
  * **[import.jade](https://github.com/wekan/wekan/tree/main/client/components/import/import.jade)**: `importHeaderBar`, `import`, `importTextarea`, `importMapMembers`, `importMapMembersAddPopup` are all templates used for importing Trello (via **[trelloMembersMapper.js](https://github.com/wekan/wekan/tree/main/client/components/import/trelloMembersMapper.js)**) and Wekan (via **[wekanMembersMapper.js](https://github.com/wekan/wekan/tree/main/client/components/import/wekanMembersMapper.js)**) boards;
* **[lists](https://github.com/wekan/wekan/tree/main/client/components/lists)**:
  * **[list.jade](https://github.com/wekan/wekan/tree/main/client/components/lists/list.jade)**: `list` is the simple, main template for lists;
  * **[listBody.jade](https://github.com/wekan/wekan/tree/main/client/components/lists/listBody.jade)**: `listBody`, `addCardForm`, `autocompleteLabelLine` templates;
  * **[listHeader.jade](https://github.com/wekan/wekan/tree/main/client/components/lists/listHeader.jade)**: `listHeader`, `editListTitleForm`, `listActionPopup`, `boardLists`, `listMorePopup`, `listDeletePopup`, `setWipLimitPopup`, `wipLimitErrorPopup` templates;
* **[main](https://github.com/wekan/wekan/tree/main/client/components/main)**:
  * **[editor.jade](https://github.com/wekan/wekan/tree/main/client/components/main/editor.jade)**: `editor` and `viewer` templates;
  * **[header.jade](https://github.com/wekan/wekan/tree/main/client/components/main/header.jade)**: `header` and `offlineWarning` templates; if the user is connected we display a small "quick-access" top bar that list all starred boards with a link to go there (this is inspired by the Reddit "subreddit" bar); the first link goes to the boards page;
  * **[keyboardShortcuts.jade](https://github.com/wekan/wekan/tree/main/client/components/main/keyboardShortcuts.jade)**: `shortcutsHeaderBar`, `shortcutsModalTitle`, `keyboardShortcuts` - all for the shortcuts that are presented when you press `?`re implemented inhere;
  * **[layouts.jade](https://github.com/wekan/wekan/tree/main/client/components/main/layouts.jade)**: has the template for head portion of the html page and other general purpose templates: `userFormsLayout`, `defaultLayout`, `notFound`, `message`;
  * **[popup.tpl.jade](https://github.com/wekan/wekan/tree/main/client/components/main/popup.tpl.jade)**: tpl files only define a single template so there's no need to wrap content in a template tag; the name of the template is the base name of the file (`popup` in this case);
  * **[spinner.tpl.jade](https://github.com/wekan/wekan/tree/main/client/components/main/spinner.tpl.jade)**: is the template for a "waiting" dialog;
* **[settings](https://github.com/wekan/wekan/tree/main/client/components/settings)**:
  * **[informationBody.jade](https://github.com/wekan/wekan/tree/main/client/components/settings/informationBody.jade)**: `information`, `statistics` templates;
  * **[invitationCode.jade](https://github.com/wekan/wekan/tree/main/client/components/settings/invitationCode.jade)**: `invitationCode` template;
  * **[peopleBody.jade](https://github.com/wekan/wekan/tree/main/client/components/settings/peopleBody.jade)**: `people`, `peopleGeneral`, `peopleRow`, `editUserPopup`;
  * **[settingBody.jade](https://github.com/wekan/wekan/tree/main/client/components/settings/settingBody.jade)**: `setting`, `general`, `email`, `accountSettings`, `announcementSettings`
  * **[settingHeader.jade](https://github.com/wekan/wekan/tree/main/client/components/settings/settingHeader.jade)**: `settingHeaderBar` template;
* **[sidebar](https://github.com/wekan/wekan/tree/main/client/components/sidebar)**:
  * **[sidebar.jade](https://github.com/wekan/wekan/tree/main/client/components/sidebar/sidebar.jade)**: `sidebar`, `homeSidebar`, `membersWidget`, `labelsWidget`, `memberPopup`, `removeMemberPopup`, `leaveBoardPopup`, `addMemberPopup`, `changePermissionsPopup`
  * **[sidebarArchives.jade](https://github.com/wekan/wekan/tree/main/client/components/sidebar/sidebarArchives.jade)**: `archivesSidebar`
  * **[sidebarFilters.jade](https://github.com/wekan/wekan/tree/main/client/components/sidebar/sidebarFilters.jade)**: `filterSidebar`, `multiselectionSidebar`, `disambiguateMultiLabelPopup`, `disambiguateMultiMemberPopup`, `moveSelectionPopup`;
* **[users](https://github.com/wekan/wekan/tree/main/client/components/users)**:
  * **[userAvatar.jade](https://github.com/wekan/wekan/tree/main/client/components/users/userAvatar.jade)**: `userAvatar`, `userAvatarInitials`, `userPopup`, `memberName`, `changeAvatarPopup`, `cardMemberPopup`
  * **[userHeader.jade](https://github.com/wekan/wekan/tree/main/client/components/users/userHeader.jade)**: `headerUserBar`, `memberMenuPopup`, `editProfilePopup`, `editNotificationPopup`, `changePasswordPopup`, `changeLanguagePopup`, `changeSettingsPopup`;
* **[mixins](https://github.com/wekan/wekan/tree/main/client/components/mixins)**: [extends](http://www.meteorpedia.com/read/Infinite_Scrolling) **[infiniteScrolling.js](https://github.com/wekan/wekan/tree/main/client/components/mixins/infiniteScrolling.js)** for card details, sidebar and also extends **[perfectScrollbar.js](https://github.com/wekan/wekan/tree/main/client/components/mixins/perfectScrollbar.js)**;

## config

* **[blazeHelpers.js](https://github.com/wekan/wekan/tree/main/client/config/blazeHelpers.js)**: following [Blaze](http://blazejs.org/) helpers are registered here:`currentBoard()`, `currentCard()`, `getUser()` and `concat()`;
* **[gecko-fix.js](https://github.com/wekan/wekan/tree/main/client/config/gecko-fix.js)**: removes [deprecated](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/watch)`watch` and `unwatch` from Firefox prior to version 58;
* **[presence.js](https://github.com/wekan/wekan/tree/main/client/config/presence.js)**: custom state function for [Presence](https://github.com/dburles/meteor-presence) that keeps track of current board;
* **[reactiveTabs.js](https://github.com/wekan/wekan/tree/main/client/config/reactiveTabs.js)**: [ReactiveTabs](https://github.com/meteortemplates/tabs) are configured to use `basicTabs` template.

## lib

* **[accessibility.js](https://github.com/wekan/wekan/tree/main/client/lib/accessibility.js)**: define a set of DOM transformations that are specifically intended for blind screen readers;
* **[cssEvents.js](https://github.com/wekan/wekan/tree/main/client/lib/cssEvents.js)**: the `CSSEvents`object has methods that select the name of the event based on the specific transitions and animations;
* **[pasteImage.js](https://github.com/wekan/wekan/tree/main/client/lib/pasteImage.js)** and **[dropImage.js](https://github.com/wekan/wekan/tree/main/client/lib/dropImage.js)**: utility for pasting and dropping images on a web app; <span style="color:red">*XXX: add comments; not same style as the rest of the code*</span>
* **[emoji-values.js](https://github.com/wekan/wekan/tree/main/client/lib/emoji-values.js)**: sets Emoji.values;
* **[escapeActions.js](https://github.com/wekan/wekan/tree/main/client/lib/escapeActions.js)**: defines the behavior (mostly canceling current edit) for escape keyboard key;
* **[i18n.js](https://github.com/wekan/wekan/tree/main/client/lib/i18n.js)**: at startup we choose the language for the ui based on user profile or browser language;
* **[inlinedform.js](https://github.com/wekan/wekan/tree/main/client/lib/inlinedform.js)**: forms for editing a single field (like adding a card); <span style="color:red">*XXX: comments in code suggest that a form that is not submitted will retain its value to prevent data loss using [unsavedEdits.js](https://github.com/wekan/wekan/tree/main/client/lib/unsavedEdits.js);bug?*</span>; <span style="color:red">*XXX: edit button to save and open*</span>;
* **[keyboard.js](https://github.com/wekan/wekan/tree/main/client/lib/keyboard.js)**: the shortcuts that are presented when you press `?`re implemented inhere;
* **[mixins.js](https://github.com/wekan/wekan/tree/main/client/lib/mixins.js)**: stub; no `Mixins` at this point; <span style="color:red">*XXX: what does `new class` do? exlint: missing () invoking a constructor*</span>
* **[popup.js](https://github.com/wekan/wekan/tree/main/client/lib/popup.js)**: defines `Popup` class for things likes electing a date; <span style="color:red">*XXX: not a Blaze helper?*</span>
* **[textComplete.js](https://github.com/wekan/wekan/tree/main/client/lib/textComplete.js)**: extends [jquery-textcomplete](https://yuku-t.com/jquery-textcomplete/) to integrate with the rest of the system (like escape actions, tab and enter key handling); <span style="color:red">*XXX: deprecated?*</span>
* **[utils.js](https://github.com/wekan/wekan/tree/main/client/lib/utils.js)**: various methods all over the place (resize, screen size, sort, capitalize, navigate to board and card);
* **Blaze helpers**:
   * **[filter.js](https://github.com/wekan/wekan/tree/main/client/lib/filter.js)**: registers `Filter` [Blaze](http://blazejs.org/) helper to support filtering cards by labels and by members;
   * **[modal.js](https://github.com/wekan/wekan/tree/main/client/lib/modal.js)**: registers `Modal` [Blaze](http://blazejs.org/) helper to support showing modal windows like the one for archived boards;
   * **[multiSelection.js](https://github.com/wekan/wekan/tree/main/client/lib/multiSelection.js)**: registers `Modal` [Blaze](http://blazejs.org/) helper to support multiple selection mode;
   * **[unsavedEdits.js](https://github.com/wekan/wekan/tree/main/client/lib/unsavedEdits.js)**: registers `getUnsavedValue` and `hasUnsavedValue` [Blaze](http://blazejs.org/) helpers to preserve content entered in fields but not saved;

# Server

.js files in this directory are not available to the client.

* **[statistics.js](https://github.com/wekan/wekan/tree/main/server/statistics.js)** implements a Meteor server-only [method](https://guide.meteor.com/methods.html) for general-purpose information such as OS, memory, CPUs, PID of the process and so on.
* **[migrations.js](https://github.com/wekan/wekan/tree/main/server/migrations.js)** is where code that update sold databases to new schema is located. Anytime the schema of one of the collection changes in a non-backward compatible way a migration needs to be written in this file.
* **[authentication.js](https://github.com/wekan/wekan/tree/main/server/authentication.js)** add the `Authentication`object to Meteor that provides methods for checking access rights.
* **[lib/utils.js](https://github.com/wekan/wekan/tree/main/server/lib/utils.js)** defines some checks used by [checklists.js](https://github.com/wekan/wekan/tree/main/models/checklists.js)** model. <span style="color:red">*XXX: these methods are defined in server-only code by are used in models, which are visible by the client (in Checklists.allow)?*</span>
* **[notifications](https://github.com/wekan/wekan/tree/main/server/notifications)**
  * **[notifications.js](https://github.com/wekan/wekan/tree/main/server/notifications/notifications.js)**: defines the `Notifications` object that supports [Activities](models/activities.js) and holds a list of functions to call when its `notify()` method is called along with convenience methods to subscribe, unsubscribe and a way to filter recipients according to user settings for notification;
     * **[email.js](https://github.com/wekan/wekan/tree/main/server/notifications/email.js)**: makes use of the notification system to send an email to a user;
     * **[profile.js](https://github.com/wekan/wekan/tree/main/server/notifications/profile.js)**: *stub*; will allow associating notifications with user ids to be consumed by mobile apps;
  * **[notifications.js](https://github.com/wekan/wekan/tree/main/server/notifications/notifications.js)**: adds the `watch()` Meteor server-only [method](https://guide.meteor.com/methods.html) that may watch boards, lists or cards using [models/watchable.js](https://github.com/wekan/wekan/tree/main/models/watchable.js);
  * **[outgoing.js](https://github.com/wekan/wekan/tree/main/server/notifications/outgoing.js)**: adds the `outgoingWebhooks()` Meteor server-only [method](https://guide.meteor.com/methods.html) that can call external API <span style="color:red">*XXX: I guess*</span>
* **[publications](https://github.com/wekan/wekan/tree/main/server/publications)** defines sets of records that are [published](https://docs.meteor.com/api/pubsub.html#Meteor-publish) by the server and how clients can subscribe to those:
  * **[accountSettings.js](https://github.com/wekan/wekan/tree/main/server/publications/accountSettings.js)**: [AccountSettings](models/accountSettings.js) collection;
  * **[activities.js](https://github.com/wekan/wekan/tree/main/server/publications/activities.js)**: [Activities](models/activities.js) collection filtered and paginated;
  * **[announcements.js](https://github.com/wekan/wekan/tree/main/server/publications/announcements.js)**: [Announcements](models/announcements.js) collection;
  * **[avatars.js](https://github.com/wekan/wekan/tree/main/server/publications/avatars.js)**: [Avatars](models/avatars.js) collection for current user;
  * **[boards.js](https://github.com/wekan/wekan/tree/main/server/publications/boards.js)**: [Boards](models/boards.js) collection for current user, archived boards collection and individual board as a [relation](https://atmospherejs.com/cottz/publish-relations);
  * **[cards.js](https://github.com/wekan/wekan/tree/main/server/publications/cards.js)**: a [Card](https://github.com/wekan/wekan/tree/main/models/cards.js) by its id;
  * **[fast-render.js](https://github.com/wekan/wekan/tree/main/server/publications/fast-render.js)**: configures [FastRender](https://github.com/kadirahq/fast-render) to use the board data; <span style="color:red">*XXX: FastRender docs say "Make sure you're using Meteor.subscribe and not this.subscribe"*</span>
  * **[people.js](https://github.com/wekan/wekan/tree/main/server/publications/people.js)**: [Users](models/users.js) collection;
  * **[settings.js](https://github.com/wekan/wekan/tree/main/server/publications/settings.js)**: [Settings](models/settings.js) collection and, separately, the mail server;
  * **[unsavedEdits.js](https://github.com/wekan/wekan/tree/main/server/publications/unsavedEdits.js)**: [UnsavedEdits](models/unsavedEdits.js) collection;
  * **[users.js](https://github.com/wekan/wekan/tree/main/server/publications/users.js)**: provides a "mini-profile" for individual users and a [way](https://docs.meteor.com/api/collections.html#fieldspecifiers) to check if current user is admin.

# Models

The files in **[models](https://github.com/wekan/wekan/tree/main/models)** directory mainly define collections; most of them have [aldeed SimpleSchema](https://atmospherejs.com/aldeed/simple-schema) for automatic validation of insert and update of collections. This is also where helpers, mutations, methods, hooks and bootstrap code is to be found. [Server side code](https://docs.meteor.com/api/core.html#Meteor-isServer) also implements json REST API.

Collections (mostly `Mongo.Collection` except as noted) are defined in:
* **[accountSettings.js](https://github.com/wekan/wekan/tree/main/models/accountSettings.js)**;
* **[activities.js](https://github.com/wekan/wekan/tree/main/models/activities.js)**: does not have a SimpleSchema;
* **[announcements.js](https://github.com/wekan/wekan/tree/main/models/announcements.js)**;
* **[attachments.js](https://github.com/wekan/wekan/tree/main/models/attachments.js)**: file-system collection;
* **[avatars.js](https://github.com/wekan/wekan/tree/main/models/avatars.js)**: file-system collection;
* **[boards.js](https://github.com/wekan/wekan/tree/main/models/boards.js)**;
* **[cardComments.js](https://github.com/wekan/wekan/tree/main/models/cardComments.js)**;
* **[cards.js](https://github.com/wekan/wekan/tree/main/models/cards.js)**;
* **[checklists.js](https://github.com/wekan/wekan/tree/main/models/checklists.js)**;
* **[integrations.js](https://github.com/wekan/wekan/tree/main/models/integrations.js)**;
* **[invitationCodes.js](https://github.com/wekan/wekan/tree/main/models/invitationCodes.js)**;
* **[lists.js](https://github.com/wekan/wekan/tree/main/models/lists.js)**;
* **[settings.js](https://github.com/wekan/wekan/tree/main/models/settings.js)**;
* **[unsavedEdits.js](https://github.com/wekan/wekan/tree/main/models/unsavedEdits.js)**;
* **[users.js](https://github.com/wekan/wekan/tree/main/models/users.js)**: extends the `Meteor.users` collection.

Other files:
* **[watchable.js](https://github.com/wekan/wekan/tree/main/models/watchable.js)**: extends the schema, helpers and mutations of `Boards`, `Lists` and `Cards`.
* **[export.js](https://github.com/wekan/wekan/tree/main/models/export.js)**: has some code to support the REST API.
* **[import.js](https://github.com/wekan/wekan/tree/main/models/import.js)**: implements `importBoard()` method so that Trello (in **[trelloCreator.js](https://github.com/wekan/wekan/tree/main/models/trelloCreator.js)**) and Wekan (in **[wekanCreator.js](https://github.com/wekan/wekan/tree/main/models/wekanCreator.js)**) boards can be imported. <span style="color:red">*XXX: Solid candidates for a directory of their own.*</span>

# Tools

* Git:
  * **.git**;
  * **[.gitignore](https://github.com/wekan/wekan/tree/main/.gitignore)**;
* Docker:
  * **[docker-compose.yml](https://github.com/wekan/wekan/tree/main/docker-compose.yml)**: the compose file is a YAML file defining services, networks and volumes;
  * **[Dockerfile](https://github.com/wekan/wekan/tree/main/Dockerfile)**;
* Snap:
  * **[snapcraft.yaml](https://github.com/wekan/wekan/tree/main/snapcraft.yaml)**: [Snapcraft](https://snapcraft.io/) packages any app for every Linux desktop, server, cloud or device, and deliver updates directly;
  * **[snap](https://github.com/wekan/wekan/tree/main/snap)**;
  * **[snap-src](https://github.com/wekan/wekan/tree/main/snap-src)**;
* Sandstorm:
  * **[sandstorm.js](https://github.com/wekan/wekan/tree/main/sandstorm.js)**: [Sandstorm](https://sandstorm.io/) specific code;
  * **[sandstorm-pkgdef.capnp](https://github.com/wekan/wekan/tree/main/sandstorm-pkgdef.capnp)**: used the meteor-spk tool to generate a sandstorm package;
* Node:
  * **[package.json](https://github.com/wekan/wekan/tree/main/package.json)**;
  * **node_modules**
  * **[app.json](https://github.com/wekan/wekan/tree/main/app.json)**: is a manifest format for describing web apps (build requirements, environment variables, addons, and other information);
  * **[app.env](https://github.com/wekan/wekan/tree/main/app.env)**: environment variables;
* Meteor: is a full-stack JavaScript platform for developing modern web and mobile applications.
  * **[.meteor](https://github.com/wekan/wekan/tree/main/.meteor)**;
* Translation:
  * **[i18n](https://github.com/wekan/wekan/tree/main/i18n)** directory has one .json file for each supported language
  * **[.tx](https://github.com/wekan/wekan/tree/main/.tx)**: configuration for [Transifex](https://app.transifex.com/wekan/) tool used to manage translation;
* Text editors:
  * **[.vscode](https://github.com/wekan/wekan/tree/main/.vscode)**: [Visual Studio Code Editor](https://code.visualstudio.com/docs/getstarted/settings);
  * **[.editorconfig](https://github.com/wekan/wekan/tree/main/.editorconfig)**: [EditorConfig](http://EditorConfig.org) provides consistent coding styles between different editors and IDEs;
* **[.github](https://github.com/wekan/wekan/tree/main/.github)**: hosts the issues template;
* **[.eslintrc.json](https://github.com/wekan/wekan/tree/main/.eslintrc.json)**: [ESLint](https://eslint.org/docs/user-guide/configuring) configuration;
* **[.travis.yml](https://github.com/wekan/wekan/tree/main/.travis.yml)**: configuration for [Travis CI](https://travis-ci.org/);
* **[scalingo.json](https://github.com/wekan/wekan/tree/main/scalingo.json)**: [Scalingo](https://scalingo.com/) is a deploy solution;
* **[fix-download-unicode](https://github.com/wekan/wekan/tree/main/fix-download-unicode)**: `cfs_access-point.txt` from this folder is copied to `bundle/programs/server/packages/cfs_access-point.js` in Docker build and in snapcraft build; this is a monkey patch fix for [downloading files that have unicode in filename](https://github.com/wekan/wekan/issues/784).

# Info

* **[meta](https://github.com/wekan/wekan/tree/main/meta)**: binary signatures, project description, icons, screenshots and, oui, a French change-log;
* **[CHANGELOG.md](https://github.com/wekan/wekan/tree/main/CHANGELOG.md)**;
* **[Contributing.md](https://github.com/wekan/wekan/tree/main/Contributing.md)**;
* **[LICENSE](https://github.com/wekan/wekan/tree/main/LICENSE)**;
* **[README.md](https://github.com/wekan/wekan/tree/main/README.md)**.

---

# Contributions to this page

This documentation was contributed by [TNick](https://github.com/TNick) and [xet7](https://github.com/xet7) while Wekan was at commit [e2f768c](https://github.com/wekan/wekan/tree/e2f768c6a0f913b7c5f07695dce8cec692037255). 
Please add new files, fixes, updates, etc directly to this page.
