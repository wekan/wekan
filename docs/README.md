<img src="https://wekan.fi/wekan-logo.svg" width="60%" alt="Wekan logo" />

Wekan is an open-source [kanban board][] which allows a card-based task and to-do management.

Wekan allows to create **Boards**, on which **Cards** can be moved around between a number of **Columns**. Boards can have many members, allowing for easy collaboration, just add everyone that should be able to work with you on the board to it, and you are good to go! You can assign colored **Labels** to cards to facilitate grouping and filtering, additionally you can add members to a card, for example to assign a task to someone.

## What is special about Wekan?
Wekan is distributed under the [MIT License], allowing anyone to easily work with it and modify it. It is perfect for anyone that needs a slick kanban board but doesn't want to use third party services, which are out of user control. Wekan can be hosted on your own server with very little effort, guaranteeing that you have all the time full control over your data and can make sure no one else has access to it and that it won't just vanish from one day to another, that is, if you do backups.

<a name="Wekan"></a>Wekan

# Install

* https://wekan.fi/install/

# SaaS

* https://wekan.fi/saas/

# Support

* Free Public Open Source Support, bugs and feature requests: https://github.com/wekan/wekan/issues
  * [Debugging](DeveloperDocs/Debugging.md)
* Paid Private Commercial Support, paid features/fixes/support/hosting: https://wekan.fi/commercial-support/

# <a name="General"></a>General

* Current Meteor 2 WeKan Features: [Deep Dive Into WeKan](DeveloperDocs/Deep-Dive-Into-WeKan.md)
* [WeKan Roadmap kanban board](https://boards.wekan.team/b/D2SzJKZDS4Z48yeQH/wekan-open-source-kanban-board-with-mit-license) - board at Wekan demo
* Future WeKan prototypes: [Multiverse WeKan Roadmap](FAQ/WeKan-Multiverse-Roadmap.md)
* [Change Language](Translations/Change-Language.md)
* [Forgot Password](Login/Forgot-Password.md)
* [WeKan Design Principles](DeveloperDocs/Design-Principles.md)
* [FAQ](FAQ/FAQ.md)
* [IRC FAQ](FAQ/IRC-FAQ.md) - answers to questions asked at IRC
* [Team](FAQ/Team.md)
* [Press](FAQ/Press.md)
* [Blog](https://wekan.fi/blog)
* [Wekan vs Trello vs Restyaboard](ImportExport/trello/Wekan-vs-Trello-vs-Restyaboard.md)
* [Results of Survey 2020-01](https://wekan.fi/blog/2020/06/results-of-wekan-survey-2020-01/)

# <a name="NotWeKan"></a>Fake: Not WeKan kanban

* [Hall of Shame: Fake companies that are NOT WeKan kanban](FAQ/Hall-of-Shame.md)
* [Others NOT related to WeKan kanban](FAQ/NOT-related-to-Wekan.md)

# <a name="Security"></a>Security

* [Allow private boards only: Disable Public Boards](Features/Allow-private-boards-only.md)
* [Security Disclosure and details of Security in Wekan](../SECURITY.md)
* [Password Hashing](Login/Password-Hashing.md)

# <a name="Scaling"></a>Scaling

* [Cron: Hourly restart WeKan, because of memory leaks](Webserver/Cron.md)
* [Maybe: Add more RAM to Node.js to prevent crash](https://github.com/wekan/wekan/issues/3585)
* [Clustering AWS etc](Platforms/Propietary/Cloud/AWS.md)
* [Scaling](Webserver/Scaling.md)
* Kubernetes
  * Helm Chart https://artifacthub.io/packages/helm/wekan/wekan
  * Issues https://github.com/wekan/charts/issues
  * Pull Requests https://github.com/wekan/charts/pulls
* [Redis Oplog](https://github.com/cult-of-coders/redis-oplog)
* [Scaling at Meteor forums](https://forums.meteor.com/t/meteor-scaling-performance-best-practices/52886/16)

# <a name="Migrating"></a>Migrating

* [From Previous Export, paste big WeKan JSON](ImportExport/From-Previous-Export.md)
* [Progress: Import/Export/Sync](ImportExport/Sync.md)
* [From CSV/TSV](ImportExport/CSV/CSV.md)
* [From Trello](ImportExport/trello/Migrating-from-Trello.md)
* [From Jira](ImportExport/Jira.md)
* [From Asana](ImportExport/asana/Asana.md)
* [From Zenkit](ImportExport/ZenKit.md)
* [From old Wekan manually](ImportExport/Migrating-from-old-Wekan-manually.md)

# Backup

* [Backup and Restore](Backup/Backup.md)
* [Rclone: Store attachments to cloud storage like S3, MinIO, etc](Backup/Rclone.md)

# <a name="Repair"></a>Repair

* [Repair MongoDB](Backup/Repair-MongoDB.md)
* [Using Meteor MongoDB to repair files](Platforms/FOSS/Sandstorm/Export-from-Wekan-Sandstorm-grain-.zip-file.md)
* [If board does not open and keeps loading](Features/If-board-does-not-open-and-keeps-loading.md)
* [Repair Docker](Platforms/FOSS/Docker/Repair-Docker.md)

# <a name="Themes"></a> Themes

* [Themes](Theme/Custom-CSS-themes.md)
* [Dark Mode](Theme/Dark-Mode.md)
* [Converting Meteor Stylus to CSS](Theme/Converting-Meteor-Stylus-to-CSS.md)

# <a name="MarkdownSyntax"></a>Markdown Syntax

* [Wekan Markdown](Features/Wekan-Markdown.md)
* [Emoji](Features/Emoji.md)
* [Mermaid Diagram](Features/Mermaid-Diagram.md) DOES NOT WORK ANYMORE
* [Numbered text](Features/Numbered-text.md)

# <a name="LoginAuth"></a>Login Auth

* [Automatic login](Login/autologin.md)
* [Disable Password Login](Login/Disable-Password-Login.md)
* [Forgot Password](Login/Forgot-Password.md)
* [Admin: Impersonate user](Login/Impersonate-user.md)
* [Adding Users](Login/Adding-users.md)
* [Active users Presence](https://github.com/wekan/wekan/issues/3734)
* [Accounts Lockout: Brute force login protection](Login/Accounts-Lockout.md)
* [LDAP](Login/LDAP.md)
* [LDAP AD Simple Auth](Login/LDAP-AD-Simple-Auth.md)
* [Keycloak](Login/Keycloak/Keycloak.md)
* [Google login](Login/Google-login.md)
* [Azure](Login/Azure/Azure.md)
* [OAuth2](Login/OAuth2.md), Auth0, GitLab, RocketChat
* [Oracle OIM on premise using OAuth2](Login/Oracle-OIM.md)
* [ADFS 4.0 using OAuth2 and OpenID](Login/ADFS.md)
* [Azure AD B2C using OAuth2](Login/B2C.md)
* [Nextcloud](Login/Nextcloud.md)
* [CAS](Login/CAS.md) Please test
* [SAML](Login/SAML.md) Please test
* [Zitadel](Login/Zitadel.md)

# <a name="Logs"></a>Metrics, Logs, Stats

* [Metrics](Features/Metrics)
* [Logs](Features/Logs.md)
* [Stats](Features/Features.md#stats)

# <a name="Integrations"></a>Integrations

* [IFTTT](ImportExport/IFTTT.md)
* [n8n Wekan docs](https://docs.n8n.io/nodes/n8n-nodes-base.wekan/#example-usage) - [n8n GitHub](https://github.com/n8n-io/n8n)
* [Integrations](ImportExport/Integrations.md)
* [Gogs](https://github.com/wekan/wekan-gogs)

# <a name="Time"></a>Time

* [Time Tracking](Date/Time-Tracking.md)
* [Gantt Chart](Features/Gantt.md)
* [Due Date](Date/Due-Date.md)
* [Day of week start](Date/Day-of-week-start.md)
* [Calendar](Calendar.md)

# <a name="Features"></a>Features

* [Multiline](Features/Multiline.md)
* [Linked Cards](Features/Linked-Cards.md)
* [Drag Drop](Features/DragDrop/Drag-Drop.md) on Mobile and Desktop
* [Python based features](Features/Python.md)
* [Burndown and Velocity Chart](Features/Burndown-and-Velocity-Chart.md)
* [Wait Spinners](Features/Wait-Spinners.md)
* [Translations](Translations/Translations.md)
* [Customize Translations](Customize-Translations.md)
* [Default Language for All Users](https://github.com/wekan/wekan/issues/3927)
* [Features](Features/Features.md)
* [Planning Poker](Features/Planning-Poker.md)
* [Scaling](Webserver/Scaling.md)
* [Custom Logo](Features/Custom-Logo.md)
* [Subtasks](Features/Subtasks.md)
* [Templates](Features/Templates.md)
* [Card Cover Image](Features/Cover.md)
* [Archive and Delete](Features/Archive-and-Delete.md)
* [Custom Fields](Features/Custom-Fields.md)
* [Fix Export board menu not visible on some boards](https://github.com/wekan/wekan/issues/1060)
* [RAM usage](https://github.com/wekan/wekan/issues/1088#issuecomment-311843230)
* [Swimlanes](Features/Swimlanes.md)

# <a name="Email"></a>Email

* [Email](Email/Troubleshooting-Mail.md)

# <a name="Settings"></a>Required Settings

* [Requirements](FAQ/Requirements.md)
* [Ports, hostsfile, how Internet works](https://gitub.com/wekan/wekan/issues/2896)
* [ROOT_URL Settings](Webserver/Settings.md)

# <a name="Webservers"></a>Webservers

* [Caddy](Webserver/Caddy.md)
* [Nginx](Webserver/Nginx.md)
* [Apache](Webserver/Apache.md)
* [OpenLiteSpeed](https://github.com/wekan/wekan/issues/3334#issuecomment-723651328)
* [Local self signed TLS](Webserver/Local-self-signed-TLS.md)
* [Let's Encrypt and Google Auth](Webserver/Lets-Encrypt-and-Google-Auth.md)
* [TLS with Node.js](https://github.com/wekan/wekan/issues/916)
* [Traefik and self-signed SSL certs](Webserver/Traefik-and-self-signed-SSL-certs.md)

# <a name="API"></a>REST API Docs

* API docs https://wekan.fi/docs/
* PHP Webhook receiver to WeKan API Python https://github.com/wekan/webhook/blob/main/public/index.php#L46
* API clients
  * Python
    * https://github.com/wekan/wekan/blob/main/api.py
    * https://github.com/wekan/wekan-python-api-client
    * https://github.com/wekan/python-wekan
    * Other Python features https://github.com/wekan/wekan/blob/main/docs/Features/Python.md
  * Go https://github.com/wekan/wego
* Other API 
* [REST API Code](API/Code.md)
* [Login](API/REST-API.md)
* [User](API/User.md)
* [Role](API/Role.md)
* [Boards](API/Boards.md)
* [Lists](API/Lists.md)
* [Cards](API/Cards.md)
* [Checklists](API/Checklists.md)
* [Swimlanes](API/Swimlanes.md)
* [Custom Fields](API/Custom-Fields.md)
* [Integrations](API/Integrations.md)

# <a name="api-issue"></a>REST API issue

* [REST API Issue](https://github.com/wekan/wekan/issues/1037)

# <a name="api-client-code"></a>REST API client code

* [Example: New card with Python3 and REST API](API/New-card-with-Python3-and-REST-API.md)
* [Python client to REST API](https://github.com/wekan/wekan-python-api-client)
* [Go client to REST API](https://github.com/wekan/wego)
* [Wekan Sandstorm cards to CSV using Python](Platforms/FOSS/Sandstorm/Wekan-Sandstorm-cards-to-CSV-using-Python.md)
* [Excel and VBA](ImportExport/Excel-and-VBA.md)

# <a name="Webhooks"></a>Webhooks

* Per-board events sending at board right sidebar / Board Settings / Webhooks
  * Check that webhook immediately responds with HTTP 200 OK, otherwise WeKan slows down
* [Global Webhook](https://github.com/wekan/wekan/pull/2665)
* PHP Webhook receiver to WeKan API Python https://github.com/wekan/webhook/blob/main/public/index.php#L46
* [Limiting Webhook data](https://github.com/wekan/wekan/issues/2830)
* [Receiving Webhooks](Webhooks/Receiving-Webhooks)
* [Java Webhooks](Webhooks/Java.md)
* [Outgoing Webhook to Discord/Slack/RocketChat/Riot](Webhooks/Outgoing-Webhook-to-Discord.md)
* [Outgoing Webhook to NodeRed](https://github.com/wekan/wekan/issues/2017)
* [Outgoing Webhook to PowerShell](https://github.com/wekan/wekan/issues/2518)
* [Outgoing Webhooks, CA and Let's Encrypt](Webhooks/WebHook-And-CA.md)
* [Outgoing Webhooks Data](Webhooks/Webhook-data.md)
* Outgoing Webhooks [Original Pull Request](https://github.com/wekan/wekan/pull/1119), [multiple Webhooks](https://github.com/wekan/wekan/pull/1199), [more parameters and response order](https://github.com/wekan/wekan/pull/1263)

# <a name="Development"></a>Development

* [Kadira integration](https://github.com/wekan/wekan/issues/2152)
* [Debugging](DeveloperDocs/Debugging.md)
* [Developer Docs for Standalone Wekan](DeveloperDocs/Developer-Documentation.md)
* [Developer Docs for Sandstorm Wekan](https://github.com/wekan/wekan/tree/main/docs/Platforms/FOSS/Sandstorm)
* [Adding new Snap setting to code](DeveloperDocs/Adding-new-Snap-settings-to-code.md)
* [Directory Structure](DeveloperDocs/Directory-Structure.md)
* [Beginner](https://github.com/wekan/wekan/labels/Beginner)
* [Maintainer FAQ](https://github.com/wekan/wekan-maintainer/wiki/FAQ)

# <a name="Issues"></a>Issues

* [Bugs](https://github.com/wekan/wekan/issues?q=is%3Aissue+is%3Aopen+label%3ABug)
* [Feature requests](https://github.com/wekan/wekan/issues?utf8=%E2%9C%93&q=is%3Aissue%20is%3Aopen%20feature)
* [Import / Export](https://github.com/wekan/wekan/issues?q=is%3Aissue+is%3Aopen+label%3AFeature%3AImport-export)
* [Drag and Drop](https://github.com/wekan/wekan/labels/Feature%3ADrag-and-drop)
* [Accessibility](https://github.com/wekan/wekan/labels/Accessibility)
* [Navigation:Keyboard](https://github.com/wekan/wekan/labels/Navigation%3AKeyboard)
* [Targets:Mobile-web](https://github.com/wekan/wekan/labels/Targets%3AMobile-web)
* [REST API](https://github.com/wekan/wekan/labels/API%3AREST)
* [Admin Panel](https://github.com/wekan/wekan/issues?q=is%3Aissue+is%3Aopen+label%3AFeature%3AAdmin-Panel)
* [Encryption](https://github.com/wekan/wekan/issues?q=is%3Aissue+is%3Aopen+label%3AFeature%3AEncryption)
* [Permissions](https://github.com/wekan/wekan/issues?q=is%3Aissue+is%3Aopen+label%3AFeature%3AUser-accounts%3APermissions)
* [Logs](https://github.com/wekan/wekan/issues?q=is%3Aissue+is%3Aopen+label%3AFeature%3ALogs)
* [Notifications](https://github.com/wekan/wekan/issues?q=is%3Aissue+is%3Aopen+label%3AFeature%3ANotifications)
* [Filters](https://github.com/wekan/wekan/issues?q=is%3Aissue+is%3Aopen+label%3AFeature%3AFilters)
* [Checklists](https://github.com/wekan/wekan/issues?q=is%3Aissue+is%3Aopen+label%3AFeature%3ACards%3AChecklists)
* [Swimlanes](https://github.com/wekan/wekan/issues?q=is%3Aissue+is%3Aopen+label%3AFeature%3ACards%3ASwimlanes)
* [LibreJS](https://github.com/wekan/wekan/issues/1040)
* [Markdown](https://github.com/wekan/wekan/issues?q=is%3Aissue+is%3Aopen+label%3AFeature%3AMarkdown)

[kanban board]: https://en.wikipedia.org/wiki/Kanban_board
[mit license]: https://github.com/wekan/wekan/blob/main/LICENSE
[sandstorm app demo]: https://demo.sandstorm.io/appdemo/m86q05rdvj14yvn78ghaxynqz7u2svw6rnttptxx49g1785cdv1h# 
