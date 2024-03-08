## Update 2023-09-23

### FOSS Kanban

MIT:

- WeKan (MIT, Node.js/Meteor/MongoDB) https://github.com/wekan/wekan is maintained, major features being added, see https://github.com/wekan/wekan/wiki/Deep-Dive-Into-WeKan
- Kanboard (MIT, PHP) https://github.com/kanboard/kanboard is at maintenance mode, no major new feature development. There is still security fixes etc.
- 4gaBoards (MIT, Node.js/Sails.js/PostgreSQL) https://github.com/RARgames/4gaBoards is maintained fork of Planka
- Godello (MIT, Godot) https://github.com/alfredbaudisch/Godello can save locally, maybe no multi-user support yet
- Rust TUI kanban (MIT, Rust) https://github.com/yashs662/rust_kanban is maintained

GPL/AGPL:

- OpenProject (GPL-3.0, RoR) https://github.com/opf/openproject is maintained
- Leantime (AGPL-3.0, PHP8/MySQL) https://github.com/Leantime/leantime is maintained
- NextCloud said at NextCloud Conference https://www.youtube.com/watch?v=H8KHXnH4NKs , that Deck (AGPL-3.0, PHP) https://github.com/nextcloud/deck is for being lightweight kanban, and to not have full Project Management features like OpenProject (GPL-3.0, RoR) https://github.com/opf/openproject
- Planka (AGPL-3.0, Node.js/Sails.js/PostgreSQL) https://github.com/plankanban/planka changed from MIT to AGPL-3.0, so there is MIT fork at https://github.com/RARgames/4gaBoards
- Planify (GPL-3.0, Vala) https://github.com/alainm23/planify is maintained

Not maintained:

- RestyaBoard (OSL-3.0, PHP/Python/Java/JS) is not developed anymore, there is no commits after Mar 12, 2022: https://github.com/RestyaPlatform/board/issues/4426

Other kanbans maybe listed at https://github.com/KanRule

### Propietary kanban

- Atlassian is retiring self-managed server offerings https://www.atlassian.com/blog/platform/atlassian-server-is-going-away-next-steps


## Please [search from ChangeLog page](https://github.com/wekan/wekan/blob/main/CHANGELOG.md) instead

Please [search from ChangeLog page](https://github.com/wekan/wekan/blob/main/CHANGELOG.md) instead about does Wekan have some feature.

This comparison below is over one year old and very outdated. All of Wekan/Trello/Restyaboard have changed very much and have many new features and fixes.

## Basic features

Features | Wekan | Trello | Restyaboard
------------ | ------------- | ------------- | -------------
Price | Free and Open Source, [MIT license](https://github.com/wekan/wekan/blob/main/LICENSE). Free for Commercial Use. | Free with limitations, Monthly payment, Annual Subscription, Quote-based | Open Core
Whitelabeling | Yes. Admin Panel/Layout: Hide Logo, Custom Product Name. | No | $ Yes
Theming | [Yes](Custom-CSS-themes) | No | $ Yes
Redistributing | Yes | No | $ Yes
Hosting | [Self-host or SaaS provider](Platforms) | SaaS | Self-host

## Basic features: Board

Features | Wekan | Trello | Restyaboard
------------ | ------------- | ------------- | -------------
Activities fetch | WebSocket | WebSocket | Polling (Better, for easy scaling)
Multiple language | Yes 70 | Yes 29 | Yes 38
Keyboard shortcuts | Yes | Yes | Yes
Boards | Yes | Yes | Yes
Closed boards listing | Yes, at Archive | Yes | Yes
Starred boards listing | No, starred and non-starred at All Boards | No | Yes
Add board with predefined templates | Personal templates, Import Board from Trello or Wekan | No | Yes
Board stats | [Yes](Features#stats) | No | Yes
Board - Add members | Yes | Yes | Yes
Board - Remove members | Yes | Yes | Yes
Close board | Yes, move to Archive | Yes | Yes
Delete board | Yes, from Archive | Yes | Yes
Subscribe board | Yes | Yes | Yes
Copy board | Export / Import board | Yes | Yes
Starred board | Yes | Yes | Yes
Unstarred board | Yes | Yes | Yes
Board text list view | [No](https://github.com/wekan/wekan/issues/1862) | No | Yes
Board calendar view | Yes, for Start/End Date | Yes | Yes
Board sync with google calendar | No | Yes | Yes

## Basic features: Swimlanes

Features | Wekan | Trello | Restyaboard
------------ | ------------- | ------------- | -------------
Swimlanes | Yes | External [Chrome Add-On](https://chrome.google.com/webstore/detail/swimlanes-for-trello/lhgcmlaedabaaaihmfdkldejjjmialgl) and [Firefox Add-On](https://addons.mozilla.org/en-US/firefox/addon/swimlanes-for-trello/) | No
Change Swimlane Color | Yes | ? | ?

## Basic features: Lists

Features | Wekan | Trello | Restyaboard
------------ | ------------- | ------------- | -------------
Create list | Yes | Yes | Yes
List color | Yes | No | Yes
Copy list | No | Yes | Yes
Move list | No. Only at same board with dragging. | Yes | Yes
Subscribe list | Yes | Yes | Yes
Remove list | Yes | Yes | Yes
Move all cards in this list | No. Only multiselect-drag to the same board. | Yes | Yes
Archive all cards in this list | No | Yes | Yes
Archive this list | Yes | Yes | Yes
Show attachments in list | No. Only on card. | No | Yes

## Basic features: Cards

Features | Wekan | Trello | Restyaboard
------------ | ------------- | ------------- | -------------
Map card | [Not yet](https://github.com/wekan/wekan/issues/755) | No | ?
Filter cards | Yes, also with Regex | Yes | Yes
Archived items | Yes | Yes | Yes
Card stickers | No | Yes | No
Card labels | Yes | Yes | Yes
Card labels color change | Yes | Yes | Yes
Cards | Yes | Yes | Yes
Paste multiline text as one or many cards | No | Yes | ?
Create cards | Yes | Yes | Yes
Delete cards | Yes | Yes | Yes
Instant add card | No | No | $ Yes
Add cards & reply via Email | No | Yes | Yes
Multiple card view | No | No | Yes
Expandable card view | No | No | Yes
Card ID display	| [Not yet](https://github.com/wekan/wekan/issues/2450) | No | Yes
Card color | Yes | No | ?
Card color on card list | No | No | Yes
Card action on card list | Only multiple selection and WIP Limit | Yes | No
Card - Set due date | Yes | Yes | Yes
Card - Add members | Yes | Yes | Yes
Card - Remove members | Yes | Yes | Yes
Card - Add labels | Yes | Yes | Yes
Card - Add checklist | Yes | Yes | Yes
Card - Add attachment | Yes | Yes | Yes
Move card | Yes | Yes | Yes
Copy card | Yes | Yes | Yes
Subscribe card | Yes | Yes | Yes
Archive card | Yes | Yes | Yes
Vote card | No | Yes | Yes
Share card | No | Yes | Yes
Print card | No | Yes | No
Add comment on card | Yes | Yes | Yes
Reply comment on card | No, only adding another comment | No | Yes
Remove comment on card | Yes | Yes | Yes
Nested comments | No | No | Yes
Card resizable view | No | No | Yes
Show attachments in card | JPG/PNG/GIF images in slideshow. | Yes | Yes
Card history filtering | No | No | Yes
Button to delete all archived items | [Not yet](https://github.com/wekan/wekan/issues/1625) | No | Yes

## Basic features: Checklists

Features | Wekan | Trello | Restyaboard
------------ | ------------- | ------------- | -------------
Checklist - Add item | Yes | Yes | Yes
Copy multiple lines from Excel/Project and paste as one or many checklist items | [Not yet](https://github.com/wekan/wekan/issues/1846) | Yes | ?
Checklist - Remove item | Yes | Yes | Yes
Checklist - Convert to card | No | Yes | Yes
Checklist - Mention member | No | Yes | Yes
Checklist - Select emoji | [No](https://github.com/wekan/wekan/issues/1537) | Yes | Yes

## Basic features: Search

Features | Wekan | Trello | Restyaboard
------------ | ------------- | ------------- | -------------
Search | Only on one board, also with regex. And add linked card search from any board. | Yes | $ Yes
Save search | No | Yes | No

## Basic features: Organizations

Features | Wekan | Trello | Restyaboard
------------ | ------------- | ------------- | -------------
Organizations list on profile | Yes, at All Boards page | Yes | Yes
Organizations | [Yes](https://github.com/wekan/wekan/issues/802) | Yes | Yes
Change organization on board | [Yes](https://github.com/wekan/wekan/issues/802#issuecomment-416474860) | Yes | Yes
Organizations - Add members | Yes | Yes | Yes
Organizations - Remove members | Yes | Yes | Yes
Organizations - Members change permissions | No | Yes | Yes
Create organization with types | No | Yes | No
Organizations - Sorting list | No | No | Yes
Organizations - Activities list | No | Yes | Yes
Organizations settings | Yes | Yes | Yes
Organizations visibility | No | Yes | Yes
Organizations - Membership restrictions | Yes | Yes | Yes
Organizations - Board creation restrictions | No | Yes | Yes
Remove organization | No | Yes | Yes

## Basic features: Offline

Features | Wekan | Trello | Restyaboard
------------ | ------------- | ------------- | -------------
Offline sync - use without internet | No. You can install Wekan to your own computer and use it locally. | No | Yes

## Basic features: Diff, Revisions and Undo

Features | Wekan | Trello | Restyaboard
------------ | ------------- | ------------- | -------------
Undo from activities | No | No | Yes

## Basic features: JSON API

Features | Wekan | Trello | Restyaboard
------------ | ------------- | ------------- | -------------
API explorer | No | No | Yes
OpenAPI | [Yes](https://github.com/wekan/wekan/tree/main/openapi) [here](https://wekan.github.io/api/) | ? | ?
Developer applications | Yes, using REST API | Yes | Yes
Authorized OAuth applications | No, REST API [login as admin to get Bearer token](REST-API#example-call---as-form-data) | Yes | Yes
Webhooks | Yes, per board or global at Admin Panel | Yes | Yes
Zapier (IFTTT like workflow automation with 500+ websites) | Yes | Yes | $ Yes
Integrated IFTTT | [Yes](IFTTT) | No | No

## Basic features: Email and Notifications

Features | Wekan | Trello | Restyaboard
------------ | ------------- | ------------- | -------------
Email-to-board settings | No, requires your code to use REST API | Yes | Yes
Email templates management | No | No | Yes
Notifications settings | [Not yet](https://github.com/wekan/wekan/issues/2471) | Yes | Yes
Disable desktop notification | [No desktop/push notifications yet](https://github.com/wekan/wekan/issues/2026) | No | Yes
User configuration to change default subscription on cards and boards | Yes | No | Yes
Card notification & highlight | No | No | Yes
Notification for card overdue | Yes, see snap/docker-compose.yml email settings | Yes | Yes

## Basic features: Settings

Features | Wekan | Trello | Restyaboard
------------ | ------------- | ------------- | -------------
Additional settings | No in Web UI, most settings at CLI | Yes | Yes (Basic only)
Profile	| Yes | Yes | Yes
Add a new email address | Register / Invite | Yes | No
Roles management | On web board+[API](REST-API-Role) | No | Yes
Settings management | Only some at Web UI, most settings at CLI | No | Yes
Users management | Add/Remove Orgs/Teams/Users | Yes? | Yes
Permanently delete your entire account forever?	| No | Yes | Yes (Admin can delete)

## Apps for productivity: Login

Features | Wekan | Trello | Restyaboard
------------ | ------------- | ------------- | -------------
Login with username or email | Yes | Yes | Yes
LDAP login | Standalone: [Yes](LDAP). Sandstorm: Yes. | No | $ Yes
SAML login | Standalone: [Not yet](https://github.com/wekan/wekan/issues/708). Sandstorm: Yes | No | No
Google login | Not yet, needs fixes to [OAuth2](OAuth2) | Yes | No
GitHub login | Standalone: Not yet, needs fixes to [OAuth2](OAuth2). Sandstorm: Yes. | No | No
Passwordless email login | Standalone: No. Sandstorm: Yes. | No | No

## Apps for productivity: Import / Export

Features | Wekan | Trello | Restyaboard
------------ | ------------- | ------------- | -------------
Import board from Trello | Yes | No | Yes
Import board from Wekan | Yes | No | Yes
Import from GitHub | No | No | $ Yes
Export board to Wekan JSON, includes attachments | Yes | No | ?
Export board to CSV | Yes | $ Yes | $ Yes
Export board to Excel | Yes | ? | ?
Export JSON card | No | Yes | No
Export CSV card | No | No | Yes
Change visibility | Yes | Yes | Yes
Change visibility in boards listing | No | No | Yes
Activities difference between previous version | No | No | Yes
Change background | Color only | Color and image | Color and image
Change background - custom | No | $ Gold or Business Class Only | Yes
Background image from flickr | No | No | Yes
Productivity beats | No | No | Yes (Alpha)
Show attachments in board | No, only at each card | No | Yes

## Apps for productivity

Features | Wekan | Trello | Restyaboard
------------ | ------------- | ------------- | -------------
Apps (Power-ups) | All integrated in, no separate plugin/app  install | Yes | Yes
Custom Field App | [Yes](Custom-Fields) | Yes | $ Yes
Estimated Time Custom Field App / Time Tracking | Reveived/Start/End/Due/End Date, Spent time, Requested By, Assigned By. No reports. For more advanced, [Not yet](https://github.com/wekan/wekan/issues/812) | Yes, 3rd party Burndown, Harvest etc | $ Yes
Analytics | [Magento integration](https://github.com/wekan/wekan-snap/wiki/Supported-settings-keys) | No | No
Hide card additional information | Yes, card and board activities | Yes, card activities | Yes, card activities
Linked Cards and Boards | [Yes](https://github.com/wekan/wekan/pull/1592) | Yes, Related Cards and Boards | ?
Subtasks | [Yes](https://github.com/wekan/wekan/pull/1723) | Yes, Hello Epics Power-Up | ?
Board Gantt view | No | No | $ Yes
Gogs (Git Service) Integration | [Yes](https://github.com/wekan/wekan-gogs) | No | No
Activities listing | No, only at board | No | Yes
Introduction video | No | No | Yes
List sorting by due date | No | No | Yes
Home screen | No | No | Yes
Apps Integration | All integrated in | Yes | Yes
Chat | No. You could use [Rocket.Chat](OAuth2) | No | $ Yes
Dashboard Charts | [Not yet](https://github.com/wekan/wekan-dashing-go) | No | $ Yes
Hide Card Created Date App | No | No | Yes
Hide Card ID App | No | No | Yes
Canned Response App | No | No | $ Yes
Auto Archive Expired Cards App | No | No | $ Yes
Support Desk | No | No | $ Yes
Card Template App | Copy Checklist Template to Multiple Cards | Yes | $ Yes
Slack | [Yes](Outgoing-Webhook-to-Discord) | Yes |  $ Yes
Amazon Echo | No | No | $ Yes
Collaborate/TogetherJS | [Not yet](Friend) | No | Yes
Gmail Add-on | No | Yes | Yes
Hangouts Chat bot | No | Yes | $ Yes
Print board | No | No | $ Yes

## Apps for productivity: Checklist Templates

Features | Wekan | Trello | Restyaboard
------------ | ------------- | ------------- | -------------
Website QA Checklist | No | No | $ Yes
SEO Checklist | No | No | $ Yes

## Apps for productivity: Mobile Apps

Features | Wekan | Trello | Restyaboard
------------ | ------------- | ------------- | -------------
iOS Mobile App | [Not yet](Friend). Mobile Chrome browser works. | Yes | Yes
Android Mobile App | [Yes](Browser-compatibility-matrix) | Yes | Yes
Windows Microsoft Store App | [Yes](Browser-compatibility-matrix) | ? | ?
Ubuntu Touch OpenStore App | [Yes](Browser-compatibility-matrix) | ? | ?

