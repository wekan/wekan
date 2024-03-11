## WeKan Interview 2023-12-08 starts at 22min 22sec

https://www.youtube.com/watch?v=ke-mbnZM3zE

## Screenshot of Meteor WeKan

<img src="https://wekan.github.io/wekan-dark-mode.png" width="100%" alt="Meteor WeKan screenshot" />

## Description of Meteor WeKan

- WeKan Open Source kanban with MIT license.
- Translated to 70+ languages https://explore.transifex.com/wekan/wekan/
- Used in most countries of the world https://snapcraft.io/wekan
- Biggest user have about 30k users, using many pods at Kubernetes
- Changelog https://github.com/wekan/wekan/blob/main/CHANGELOG.md
- Commercial Support at https://wekan.team/commercial-support/ . Currently looking who could sponsor more of maintenance and development.

## How much effort to create Meteor WeKan, in COCOMO model

- WeKan 134k lines of code: 34 years of effort, 316 contributors https://openhub.net/p/wekan
- Meteor.js, 224k lines of code: 59 years of effort, 819 contributors https://openhub.net/p/meteor-js
- Since December 2016, WeKan maintainer https://github.com/xet7 :
  - has added and removed about 4M lines of code https://github.com/wekan/wekan/graphs/contributors
  - https://openhub.net/accounts/xet7

## Meteor WeKan Browser support

- Javascript enabled Desktop and Mobile Safari/Chromium/Firefox based browsers
- Apps at Play Store, Windows Microsoft Store, Ubuntu Touch OpenStore https://github.com/wekan/wekan/wiki/Browser-compatibility-matrix
- Alternatively, for self-hosted WeKan, create PWA icon https://github.com/wekan/wekan/wiki/PWA
- Using WeKan with big touchscreen https://github.com/wekan/wekan/wiki/Touch-Screen-support

## Meteor WeKan Server

- Meteor.js 2.x, Node.js 14.x https://github.com/wekan/node-v14-esm/releases/tag/v14.21.4 , MongoDB 6.x
- CPU: amd64, arm64, s390x, Source Bundle at https://github.com/wekan/wekan/wiki/Raspberry-Pi
- Windows On-Premise: https://github.com/wekan/wekan/wiki/Offline
- Mac: Docker, or at https://github.com/wekan/wekan/wiki/Mac
- Newest at platforms: Source Bundle, Snap Candidate, Docker, Kubernetes https://wekan.github.io
- Platforms that will be updated to be up-to-date: Snap Stable, Sandstorm, UCS https://wekan.github.io

## Meteor WeKan Features

- [WeKan Design Principles](https://github.com/wekan/wekan/wiki/Design-Principles)
- Realtime UI. When someone makes change, like drag card or add text, everyone will see changes immediately. This is because Meteor listens to MongoDB change stream, and updates UI. For some rare cases, there needs to be reload of page, those need to be fixed.
- Whitelabel: Change product name and product image at login screen and board left top corner. Not changing favicon, because there are 100+ favicons for different devices.
- Drag Drop at Desktop and Mobile:
  - Board Icons, Swimlanes, Lists, Cards, Checklists, Checklist Items
  - Drag handles, per screen https://github.com/wekan/wekan/wiki/Drag-Drop
- Some features similar to Trello and Jira. Some features not in Trello and Jira.
- IFTTT Rules like Trello Butler https://github.com/wekan/wekan/wiki/IFTTT , translated to all supported languages. Trello Butler is only In English.
- Many Assignees like in Jira.
- Change background image and Card Cover. Change Theme. Change color of Boards, Swimlane, List, Card, Label.
- Markdown at: Board name and description, Swimlane, List, Card title and description, Checklist and Checklist Item, Subtask title,  https://github.com/wekan/wekan/wiki/Wekan-Markdown
- Emoji https://github.com/wekan/wekan/wiki/Emoji
- MathML
- Preview card attachment image and PDF
- Show Start at End Dates of card at Calendar of Swimlanes/Lists/Calendar dropdown menu
- Custom Fields https://github.com/wekan/wekan/wiki/Custom-Fields
- Subtasks https://github.com/wekan/wekan/wiki/Subtasks
- Planning Poker / Scrum Poker at Card https://github.com/wekan/wekan/wiki/Planning-Poker . No other card games yet ;)
- For board actions, like move card etc, Per Board and Global Outgoing and 2-way webhooks to Chat (RocketChat, Slack, Discord etc), NodeRED, or PHP webhook receiver like https://github.com/wekan/webhook 
- At top right username menu:
  - Search All Boards, with search options
  - Public Boards. Board can be set private or public. At Admin Panel is option to disable public boards, so all boards are private.
  - Change Language
  - My Cards and Due Cards: Show cards where you are member or assignee, from all boards
- At top of current board:
  - Filter cards, by user etc
  - Multi-Selection, checkmark and drag many cards at once
  - Sort current board
- Python and PHP based additional features https://github.com/wekan/wekan/wiki/Python
- Admin Panel:
  - Organizations/Teams/People. Impersonate User, logged to database when someone uses that feature.
  - Customize Translations https://github.com/wekan/wekan/wiki/Customize-Translations

## Technical details

- Reactive Cache
  - mfilser tested speed improvement for half a year, and finally made huge PR to WeKan v7.00 to make all of WeKan use Reactive cache https://github.com/wekan/wekan/pull/5014
  - Reactive Cache Repo https://github.com/wekan/meteor-reactive-cache , xet7 updated dependencies
  - Big performance improvements https://github.com/wekan/wekan/issues/5000
  - Using same style of API for client and serverside
  - Use more ReactiveCache than MiniMongo
- Optimizing and Debugging Meteor, reducing size, links to WeKan dependencies https://github.com/wekan/wekan/wiki/Debugging
- Custom OIDC/OAuth2 login
  - Repo https://github.com/wekan/wekan/tree/main/packages/wekan-oidc
  - Features:
    - At Admin Panel, you can change text of login page button `Login with OIDC`
    - Auth0 https://github.com/wekan/wekan/wiki/OAuth2#auth0 . This did take about half year to implement by xet7, was not available anywhere else for Meteor.
    - Oracle OIM. https://github.com/wekan/wekan/wiki/Oracle-OIM . For this, customer provided some code. xet7 added fix to make login work even when some login field was missing data, by taking data from other field, all this while xet7 did not have access to customers Oracle OIM, just guessing about what code to add, and it worked. 
    - GitLab https://github.com/wekan/wekan/wiki/OAuth2#gitlab-providing-oauth2-login-to-wekan
    - RocketChat https://github.com/wekan/wekan/wiki/OAuth2#rocketchat-providing-oauth2-login-to-wekan
    - Nextcloud https://github.com/wekan/wekan/wiki/Nextcloud
    - ADFS 4.0 using OAuth2 and OpenID https://github.com/wekan/wekan/wiki/ADFS
    - Azure https://github.com/wekan/wekan/wiki/Azure
    - Keycloak https://github.com/wekan/wekan/wiki/Keycloak
    - Google login https://github.com/wekan/wekan/wiki/Google-login
- Custom LDAP
  - LDAP https://github.com/wekan/wekan/wiki/LDAP
  - LDAP AD Simple Auth https://github.com/wekan/wekan/wiki/LDAP-AD-Simple-Auth
- Default board for users https://github.com/wekan/wekan/pull/5098
- Brute Force Accounts Lockout https://github.com/wekan/wekan/wiki/Accounts-Lockout
- Markdown, Emoji, MathML, sanitizing https://github.com/wekan/wekan/blob/main/packages/markdown/src/template-integration.js
- Many security fixes from Responsible Disclosure https://wekan.github.io/hall-of-fame/

## Upcoming Features

- CAS https://github.com/wekan/wekan/wiki/CAS
- SAML https://github.com/wekan/wekan/wiki/SAML

## Video

- Creator of WeKan, mquandalle (Maxime Quandalle) https://www.youtube.com/watch?v=N3iMLwCNOro
- https://github.com/wekan/wekan/wiki/FAQ#what-was-wekan-fork--wefork
- Maintainer of WeKan since December 2016, xet7 (Lauri Ojansivu), about WeKan Multiverse at EU NGI Dapsi https://www.youtube.com/watch?v=BPPjiZHVeyM . More about Multiverse at https://github.com/wekan/wekan/wiki/WeKan-Multiverse-Roadmap

## Maybe?

- https://github.com/frozeman/meteor-persistent-minimongo2

## Upcoming upgrades to Meteor 3.0

- This Week in MeteorJS: 22 September 2023 https://www.youtube.com/watch?v=UWVL1xUP9r0
- There Jan Dvorak IV https://github.com/StorytellerCZ commented chat: "We should do deep dive into WeKan!"
- So here is The Deep Dive!
- Questions for upcoming "This Week in MeteorJS", some already mentioned to be upcoming:
  - How to upgrade dependencies to Meteor 3.0 ? Some answer was to mention Meteor version at package dependency:
    <img src="https://wekan.github.io/upgrade-meteor3-new.png" width="100%" alt="Meteor 3.0 upgrading dependencies" />
  - But what if adding dependency adds some more error messages? Probably that depends on error message, like here when
    trying to upgrade to Meteor 3.0 alpha 15: https://github.com/wekan/wekan/issues/5142
  - https://forums.meteor.com/t/my-journey-towards-meteor-3-0/60001/23
    - https://github.com/bratelefant/Meteor-Files
    - https://github.com/bratelefant/meteor-roles
    - https://github.com/bratelefant/meteor-multitenancy

