# WeKan features by menu

## What it is

The index of WeKan's features, by the menu where each one is used. Every row
leads to that menu's own pages.

## How to use it

Find a feature by where you use it. Menu labels below are the English labels;
visibility depends on your role, the board and the site's settings.

| Where in WeKan | Documentation |
| --- | --- |
| Top header | [Header](Header-Bar/README.md): navigation, notifications and board controls |
| All Boards | [All Boards](All-Boards/README.md): boards, workspaces, public and starred items |
| Personal pages | [Pages](Pages/README.md): My Cards, Due Cards, My Attachments, Starred |
| Your username at the end of the header bar / Member Settings | [Member Settings](Member-Settings/README.md): personal pages, Date, appearance, notifications and account settings |
| Member menu / Workload and capacity, Budget and billing | Professional services: [Workload](Workload/README.md) and [Budget and billing](Billing/README.md) |
| Cloud Panel Domain / Cloud Panel | [Cloud Panel](Admin-Panel/Cloud-Panel.md): customer domains, their databases, CloudFlare, Caddy, invoices and chat |
| Board header / Board View | [Board header](Board-Header/README.md): search and every Board View, with the template that draws it |
| Right sidebar | [Right Sidebar](Board-Sidebar/README.md): members, labels, filter, archive and shortcuts |
| Right sidebar / Board Settings | [Board Settings](Board-Sidebar/Board-Settings/README.md): board appearance, views, dates, lists, cards, import/export and archive |
| Right sidebar / Board Settings / Rules | [Rules](Rules/README.md): automation, blocks and bots |
| Swimlane header and menu | [Swimlanes](Swimlanes/README.md) |
| List header and menu | [Lists](Lists/README.md) |
| Minicard and opened card | [Cards](Cards/README.md) |
| Admin Panel | [Admin Panel](Admin-Panel/README.md): Settings, People, Attachments and Problems |
| Login page | [Login page](Login-Page/README.md): every sign-in method, and [Login settings](Admin-Panel/People/Login.md) |
| Used from several menus | [Shared topics](#shared-topics): accessibility, editor, history, theme, translations, email, troubleshooting |

### Newest features

[Newest features](Newest-Features.md) links the November and September 2026
additions, including the Upcoming release, to their instructions. For release status,
fixes and version details, use the [changelog](../../CHANGELOG.md).

### Shared topics

Behaviour shared by several menus has a topic folder of its own at the
docs/Features level, beside the menu folders. These folders are topics, not
menus of their own: each page says where in the menus the feature is used.

| Topic | Guides |
| --- | --- |
| Accessibility | [Accessibility](Accessibility/README.md), [improvements](Accessibility/Accessibility-Improvements.md) |
| Keyboard | [Keyboard shortcuts](Keyboard-Shortcuts/README.md) |
| Editor | [Markdown editor](Editor/Markdown-Editor.md), [Markdown](Editor/Markdown/README.md), [multiline](Editor/Multiline.md), [numbered text](Editor/Numbered-text.md), [emoji](Editor/Emoji.md), [LaTeX](Editor/LaTeX.md), [RTL](Editor/RTL/README.md), [Mermaid (removed)](Editor/Mermaid-Diagram.md), [Python tools](Editor/Python.md) |
| Dependencies | [Red Strings](Editor/RedStrings/README.md), [Board and My Dependencies](Editor/RedStrings/Board-And-My-Dependencies.md) |
| Drag and drop | [Drag and drop](DragDrop/Drag-Drop.md), [touch screens](DragDrop/Touch-Screen-support.md) |
| Selection and links | [Multi-selection](Multi-Selection.md), [board item links](Board-Item-Links.md) |
| History | [History](History/README.md), [Undo / Redo](Undo/README.md), [original positions](Original-Positions/README.md) |
| Helpers that need no AI | [Overview](Assistants/README.md), [Summary](Summary/README.md), [Since your last visit](Since-Last-Visit/README.md) |
| Pages built on a table | [Table Page design](Table.md) |
| Email | [Email to card](Email/Email-To-Card.md), [reply by email](Email/Reply-By-Email.md), [bounces](Email/Bounces.md), [troubleshooting mail](Email/Troubleshooting-Mail.md) |
| Notifications | [Notification delivery](Notifications/Notification-Delivery.md), [ntfy](Notifications/ntfy.md) |
| Theme | [Select Color](Theme/README.md), [Change color](Theme/Change-Color.md), [dark mode](Theme/Dark-Mode.md), [custom CSS themes](Theme/Custom-CSS-themes.md), [Stylus to CSS](Theme/Converting-Meteor-Stylus-to-CSS.md) |
| Translations | [Translations](Translations/README.md), [customize](Translations/Customize-Translations.md), [language popup](Translations/Language-Popup.md), [audit](Translations/Audit.md) |
| Dates | [Timezone](Date/Timezone.md) |
| Files | [Filenames](Filename/README.md), [cleanup](Cleanup/README.md) |
| Monitoring | [Metrics](Metrics.md), [stats](Stats.md) |
| Troubleshooting | [Logs](Troubleshooting/Logs.md), [wait spinners](Troubleshooting/Wait-Spinners.md), [board keeps loading](Troubleshooting/If-board-does-not-open-and-keeps-loading.md) |

### Shared reference guides

These topics are used from several menus, so their detailed references stay in
shared directories:

- [Accessibility](Accessibility/README.md) and [keyboard shortcuts](Keyboard-Shortcuts/README.md)
- [Markdown](Editor/Markdown/README.md), [multiline creation](Editor/Multiline.md),
  [emoji](Editor/Emoji.md), [LaTeX](Editor/LaTeX.md) and [RTL](Editor/RTL/README.md)
- [Drag and drop](DragDrop/Drag-Drop.md), [multi-selection](Multi-Selection.md)
  and [board/item links](Board-Item-Links.md)
- [Import/export format coverage](Board-Sidebar/Board-Settings/Import-Export/Format-Coverage.md),
  [sync](Board-Sidebar/Board-Settings/Import-Export/Sync.md) and [integrations](Board-Sidebar/Board-Settings/Import-Export/Integrations/README.md)
- [Rules](Rules/Rules/README.md) and [outgoing webhooks](Board-Sidebar/Board-Settings/Outgoing-Webhooks/Discord/Outgoing-Webhook-to-Discord.md)
- [Calendar](Board-Header/Board-Views/Calendar.md), [time tracking](Cards/Time-Tracking.md),
  [Gantt](Board-Header/Board-Views/Gantt.md) and [report charts](Board-Header/Board-Views/Charts/Board-Report-Charts.md)
- [Members](Board-Sidebar/Members/README.md), [roles](Board-Sidebar/Members/Roles.md) and [templates](All-Boards/Templates.md)
- [Backup and restore](../Backup/Backup.md), [REST API](../API/REST-API.md)
  and [platforms](../Platforms)
- [Translation](Translations/README.md), [themes](Theme/README.md),
  [logs](Troubleshooting/Logs.md) and [loading problems](Troubleshooting/If-board-does-not-open-and-keeps-loading.md)

Menu-owned guides live under the matching menu directory, and every folder
opens with its README.md. Shared topic folders are topic names, not additional
application menus.

See the pages above.

## Commits

 - [README and docs: Workload and capacity, Budget and billing, the Cloud Panel and Website](https://github.com/wekan/wekan/commit/2ba61536176a29ed853d0a99867f29a7e18a30a1)
 - [Docs follow the menus: Scrum meetings under Board Settings, the newest features](https://github.com/wekan/wekan/commit/0c277c4d187e59f3e32e1ce1cc04900009a8e047)
 - [File docs/Features the way the WeKan menus are](https://github.com/wekan/wekan/commit/b7589737f5730ce1ba83244946e158519528a783)
 - [Organize the feature guides by menu](https://github.com/wekan/wekan/commit/953d8f7c13cdcb9b2b32d15f2d4c42c5f2d6caae)
 - [Organize docs/Features into categories and update all links](https://github.com/wekan/wekan/commit/54cc0ec614fcbb2abf059dd07b75894cf7ea4fe6)
