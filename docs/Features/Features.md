# Current

Not all from [CHANGELOG](https://github.com/wekan/wekan/blob/main/CHANGELOG.md) are added to here yet.

## Kanban

### WIP Limits

![Wekan WIP Limits screenshot](https://wekan.github.io/screenshot-wip-limit.png)

### Boards: List of all your public and private boards, board shortcuts at top of page

![Wekan boards screenshot](https://wekan.github.io/screenshot-boards.png)

### Wekan full screen or window on desktop (without browser buttons etc)

[Info about browser standalone app mode](https://github.com/wekan/wekan/pull/1184)

### Wekan full screen on mobile Firefox

[Instructions and screenshot](https://github.com/wekan/wekan/issues/953#issuecomment-336537875)

### Restore archived board

![Wekan boards screenshot](https://wekan.github.io/screenshot-restore-board.png)

### Star board

![Wekan star board screenshot](https://wekan.github.io/screenshot-star-board.png)

### Watch board

![Wekan watch board screenshot](https://wekan.github.io/screenshot-muted-watch.png)

### Keyboard shortcuts button at bottom right corner

![Wekan watch board screenshot](https://wekan.github.io/screenshot-keyboard-shortcuts.png)

### Board menu when clicking 3 lines "hamburger" menu on right

![Wekan board menu screenshot](https://wekan.github.io/screenshot-board-menu.png)

### Member setting when clicking your username on top right corner

![Wekan member settings screenshot](https://wekan.github.io/screenshot-member-settings.png)

NOTE: Edit Notification duplicate was removed from above menu at https://github.com/wekan/wekan/pull/1948 so Edit Notification is only available at below menu screenshot. 

### Member settings / Edit Notification

![Wekan edit notification screenshot](https://wekan.github.io/screenshot-member-settings-edit-notification.png)

### Member settings / Change settings

![Wekan hide system messages screenshot](https://wekan.github.io/screenshot-member-settings-hide-system-messages.png)

### Members: Click member initials or avatar

![Wekan members screenshot](https://wekan.github.io/screenshot-member-filter.png)

### Members: Click member initials or avatar => Permissions Admin/Normal/Comment only

![Wekan boards permissions screenshot](https://wekan.github.io/screenshot-member-comment-only.png)

### Lists: Add, archive and restore archived, delete list.

![Wekan kanban screenshot](https://wekan.github.io/screenshot-member-settings-archive.png)

### Cards: Description, Customizable Labels, Checklists, Attachment images and files, Comments. Archive and restore archived card. Delete card.

Tip: Normally you archive a card so you can restore it back. If you want to delete cards faster, drag cards to new list, and delete that new list. Deleting cannot be undone, more clicks are by design. There was previously easily clicked button to delete a list and people deleted important list by accident, and that bug report was fixed.

### [Markdown in card description and comments](https://github.com/wekan/wekan/issues/1038)
### [International Date Formatting for Due Date according to language](https://github.com/wekan/wekan/issues/838)

![Wekan kanban screenshot](https://wekan.github.io/screenshot.png)

### Cards: Drag and drop images to card. Paste images with Ctrl-V.

### 1) First attachment: Select Card 3 lines "hamburger" menu / Edit Attachments

![Wekan kanban screenshot](https://wekan.github.io/screenshot-drag1.png)

### 2) Select: Clipboard or drag and drop

![Wekan kanban screenshot](https://wekan.github.io/screenshot-drag4.png)

### 3) Drag and drop image, or Ctrl-V.

![Wekan kanban screenshot](https://wekan.github.io/screenshot-drag2.png)

### 4) Second image attachment and others can be added from Add Attachment button near first attachment.

![Wekan kanban screenshot](https://wekan.github.io/screenshot-drag3.png)

### Multi-selection => Checkmark select cards => drag-drop all selected to some list

![Wekan multi-selection screenshot](https://wekan.github.io/screenshot-multi-selection.png)

### Filtered views

![Wekan multi-selection screenshot](https://wekan.github.io/screenshot-filter.png)

## Authentication, Admin Panel, SMTP Settings

NOTE: There is user admin as "People" in Admin Panel, but no screenshot here yet.

* Source and Docker platforms: [Admin Panel](https://github.com/wekan/wekan/blob/main/CHANGELOG.md#v0111-rc2-2017-03-05-wekan-prerelease): Self-registration, or change to invite-only and inviting users to boards. SMTP Settings.

![Wekan Admin Panel registration disable screenshot](https://wekan.github.io/screenshot-admin-panel-registration.png)

![Wekan Admin Panel email screenshot](https://wekan.github.io/screenshot-admin-panel-email.png)

* Sandstorm Platform: Admin: LDAP, passwordless email, SAML, GitHub and Google Auth. Add and remove users. SMTP Settings. Wekan, Rocket.Chat, etc apps available with one click install.

## Import

* Import Trello board: Text, labels, images, comments, checklists. Not imported yet: stickers, etc.
* [Import Wekan board](https://github.com/wekan/wekan/pull/1117): Text, labels, images, comments, checklists.

## Export

* Export Wekan board: [Export menu item above the board archive item, when you click the sandwich bar icon on the top right](https://github.com/wekan/wekan/pull/1059). If Export menu is not visible, you can change [Export menu to be visible by setting yourself as board admin in MongoDB](https://github.com/wekan/wekan/issues/1060).

## Working with big boards

* [JSON tools, copying files to clipboard](https://github.com/wekan/wekan/issues/610#issuecomment-310862951)

## API

* [REST API Issue](https://github.com/wekan/wekan/issues/1037)
* [REST API Docs](REST-API)
* [Python client to REST API](https://github.com/wekan/wekan-python-api-client)
* [Wekan Sandstorm cards to CSV using Python](Wekan-Sandstorm-cards-to-CSV-using-Python)

## Webhooks
Sending notifications for board activities. Tested with [Slack](https://slack.com/) and [Rocket.chat](https://rocket.chat/).
```
Content-type: application/json
{
    "text": "board activities"
    [...]
}
```

Different activities send different webhook data. You can find the details in the wiki page [Webhook data](Webhook-data)

* [Outgoing Webhooks](https://github.com/wekan/wekan/pull/1119)

### Enabled
#### 1) Board menu when clicking 3 lines "hamburger" menu on right

![Wekan board menu screenshot](https://wekan.github.io/screenshot-board-menu.png)

#### 2) Outgoing Webhooks

![Wekan Outgoing Webhooks screenshot](https://wekan.github.io/screenshot-outgoing-webhooks.png)

### Disabled

Leave the URL field blank. 

## Cleanup

* [Wekan database cleanup script](https://github.com/wekan/wekan-cleanup)
* [Docker cleanup](https://github.com/wekan/wekan/issues/985)

## Stats

* [Daily export of Wekan changes as JSON to Logstash and
ElasticSearch / Kibana (ELK)](https://github.com/wekan/wekan-logstash)
* [Statistics Python script for Wekan Dashboard](https://github.com/wekan/wekan-stats)
* [Console, file, and zulip logger on database changes](https://github.com/wekan/wekan/pull/1010) with [fix to replace console.log by winston logger](https://github.com/wekan/wekan/pull/1033)

## Versions of Meteor and Node

* Upgraded to [Meteor 1.4](https://github.com/wekan/wekan/pull/957) and [Node v4](https://github.com/wekan/wekan/issues/788) on [meteor-1.4 branch](https://github.com/wekan/wekan/tree/meteor-1.4)

## Translations

* [Translate Wekan at Transifex](https://app.transifex.com/wekan/)

![Wekan translations screenshot](https://wekan.github.io/screenshot-change-language.png)

# Already merged, will be at next version

* [Changelog](https://github.com/wekan/wekan/blob/main/CHANGELOG.md)

# Wishes for pull requests

### Existing pull requests, cleanup/cherry-picking/new pull requests welcome

* [Export/Import Excel TSV/CSV data](https://github.com/wekan/wekan/pull/413)
* [Move/Clone Board/List](https://github.com/wekan/wekan/pull/446) and [Move or copy cards from one board to another](https://github.com/wekan/wekan/issues/797) that [needs help in implementation](https://github.com/wekan/wekan/issues/979)
* [Replace CollectionFS with meteor-file-collection](https://github.com/wekan/wekan/pull/875)

### Wishes for API pull requests

* [Using API to script Email to board/card, notifications on cards to email, etc](https://github.com/wekan/wekan/issues/794)

### Wishes for Admin Panel

* [SMTP test, show possible errors on that test webpage](https://github.com/wekan/wekan/issues/949)
* [Teams/Organizations](https://github.com/wekan/wekan/issues/802) including Add/Modify/Remove Teams/Users/Passwords and Private/Public Team settings
* [Themes](https://github.com/wekan/wekan/issues/781) and making custom apps with Themes

### Wishes for Boards

* [Custom fields](https://github.com/wekan/wekan/issues/807)
* [Children/Related cards](https://github.com/wekan/wekan/issues/709), subtasks. Dependencies. 
* [Top Level Projects](https://github.com/wekan/wekan/issues/641)
* [Swimlanes (rows)](https://github.com/wekan/wekan/issues/955)
* Kanban workflows
* Gantt charts
* [WIP limits](https://github.com/wekan/wekan/issues/783)
* [Timesheet/Time tracking](https://github.com/wekan/wekan/issues/812)
* Managing website
* [Same cards, multiple column sets](https://github.com/wekan/wekan/issues/211), related to [Themes](https://github.com/wekan/wekan/issues/781)
* [Calendar view](https://github.com/wekan/wekan/issues/808)
* [Vote on cards, number of votes, average](https://github.com/wekan/wekan/issues/796)
* [Board templates](https://github.com/wekan/wekan/issues/786)
* [Checklist templates](https://github.com/wekan/wekan/issues/904)

# More

[Platforms](Platforms)

[Integrations](Integrations)