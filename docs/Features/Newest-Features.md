# Newest features

This guide follows the current menus and the
[changelog](../../CHANGELOG.md). The November 2026 features are in the
**Upcoming** release until it is published; check your installed release
before expecting the newest UI. For all menus, use [Features](Features.md).

## November 2026

| Feature | Where to find it | Instructions |
| --- | --- | --- |
| Search inside attachments with Filter, Search and Search All Boards; each attachment's SHA-256 checked when it is read, with a warning in Admin Panel / Problems | Board Filter and Search, Search All Boards, Admin Panel / Problems | [Attachment search and integrity](Cards/Attachments/Attachment-Search-And-Integrity.md) |
| The card details window remembers the width you drag it to; an administrator sets the default width as a percentage of the browser window | Opened card: its bottom corner, and the card menu / Reset width; Admin Panel / Settings / Appearance | [Card details width](Cards/Card-Details-Width.md) |
| Workload and capacity: hours against working time across boards, absences, holidays, allocations, placeholders, billable utilization and skills | User menu / Workload and capacity | [Workload](Workload/Workload.md) |
| Budget and billing: rates, cost rates, budget against cost, forecast and margin; time by day and its approval; expenses, fixed fees, retainers, quotes and invoices | User menu / Budget and billing | [Budget and billing](Billing/Billing.md) |
| Invoices as PDF, SVG, Excel, CSV and Peppol e-invoice, with the payment QR codes and bank barcodes of many countries | User menu / Budget and billing, an invoice's buttons | [Budget and billing](Billing/Billing.md) |
| Cloud Panel, only where the server has `CLOUD=<its domain>`: customer domains with their own WeKan and database or sharing this one, many WeKans merged into one, CloudFlare, Caddy, invoices, support tickets and chat on a support board per domain, the addresses a Cloud Admin may sign in from; customers sign in with their own WeKan's password; no REST API there | Admin Panel / Cloud at the CLOUD address; its /cloud for customers | [Cloud Panel](Admin-Panel/Cloud-Panel.md) |
| Websites imported and exported: WordPress, Ghost, Blogger, Hugo / Jekyll / Eleventy / Astro, HTML sites, Medium, Substack | Add Board / Import, Website; Board Settings / Export, Website | [Website](Board-Sidebar/Board-Settings/Import-Export/Website/Website.md) |
| The board as a website, at a public board's own address | Board header / Board View / Website; Board Settings / Board View | [Board View](Board-Sidebar/Board-Settings/Board-View.md) and [Website](Board-Sidebar/Board-Settings/Import-Export/Website/Website.md) |
| The products on a board's cards as a web shop: categories, product pages, a cart, checkout with Budget and billing's payment methods and QR codes, orders as cards; at a public board's own address | Board header / Board View / Shop; Board Settings / Shop | [Shop](Board-Header/Board-Views/Shop.md) and [Board Settings / Shop](Board-Sidebar/Board-Settings/Shop.md) |
| Twelve more reports: Created vs. Resolved, Net Flow, Time in List and the rest, each with its export bar | Board header / Board View, Reports group | [Board reports](Board-Header/Board-Views/Charts/Board-Reports.md) and [report charts](Board-Header/Board-Views/Charts/Board-Report-Charts.md) |
| Menus grouped under headings | Board View menu; list, card and swimlane menus; Import and Export | [Board View](Board-Sidebar/Board-Settings/Board-View.md) and [formats](Board-Sidebar/Board-Settings/Import-Export/Format-Coverage.md) |
| Kanban and Scrum flow fields: Blocked, Class of service, MoSCoW priority, WSJF score | Board Settings / Card; Admin Panel / Settings / Features / Card fields | [Flow fields](Cards/Flow-Fields.md) |
| List policies, Definition of Ready, commitment point, WIP limit per person | Board Settings / List and Scrum; Admin Panel / Settings / Features | [Flow policies](Lists/Flow-Policies.md) |
| Lists split into Doing and Done | Board Settings / List; the list header | [Flow policies](Lists/Flow-Policies.md) |
| Daily standup timer and retrospective board | Board menu, turned on in Board Settings / Scrum | [Scrum meetings](Board-Sidebar/Board-Settings/Scrum-Meetings.md) and [Scrum settings](Board-Sidebar/Board-Settings/Scrum-Settings.md) |
| Import mail, calendars, chats and notes | Add Board / Import | [Mail](Board-Sidebar/Board-Settings/Import-Export/Mail/Mail.md), [iCalendar](Board-Sidebar/Board-Settings/Import-Export/iCalendar/iCalendar.md), [WhatsApp](Board-Sidebar/Board-Settings/Import-Export/WhatsApp/WhatsApp.md), [Discord](Board-Sidebar/Board-Settings/Import-Export/Discord/Discord.md), [Google Keep](Board-Sidebar/Board-Settings/Import-Export/Google-Keep/Google-Keep.md) |
| Trello export as a .zip with attachments; Trello custom fields and archived items | Board Settings / Export; Add Board / Import | [Trello](Board-Sidebar/Board-Settings/Import-Export/Trello/Trello.md) |
| Every export written a page of cards at a time; large imports streamed to disk within its free space | Board Settings / Export; Add Board / Import | [External tools](Board-Sidebar/Board-Settings/Import-Export/External-Tools.md) and [WeKan](Board-Sidebar/Board-Settings/Import-Export/WeKan/WeKan.md) |
| What each tool's files keep, round-tripped tool by tool | - | [Format coverage](Board-Sidebar/Board-Settings/Import-Export/Format-Coverage.md) |
| Admin Panel Features as a pane of its own | Admin Panel / Settings / Features | [Features](Admin-Panel/Settings/Features.md) |
| Import and Export list a company's products under its name: 37signals, Atlassian, Google, Microsoft, and the Sandstorm apps | Add Board / Import; Board Settings / Export | [External tools](Board-Sidebar/Board-Settings/Import-Export/External-Tools.md) |
| Microsoft: Azure DevOps Boards, Lists, Project (XML), Outlook, Teams and OneNote, the last two also fetched from Microsoft Graph | Add Board / Import, Microsoft; Board Settings / Export, Microsoft | [Azure DevOps](Board-Sidebar/Board-Settings/Import-Export/Azure-DevOps/Azure-DevOps.md), [Lists](Board-Sidebar/Board-Settings/Import-Export/Microsoft-Lists/Microsoft-Lists.md), [Project](Board-Sidebar/Board-Settings/Import-Export/Microsoft-Project/Microsoft-Project.md), [Outlook](Board-Sidebar/Board-Settings/Import-Export/Microsoft-Outlook/Microsoft-Outlook.md), [Teams](Board-Sidebar/Board-Settings/Import-Export/Microsoft-Teams/Microsoft-Teams.md), [OneNote](Board-Sidebar/Board-Settings/Import-Export/Microsoft-OneNote/Microsoft-OneNote.md) |
| Sandstorm grain backups of twelve apps imported, nine exported as a grain Sandstorm restores | Add Board / Import, Sandstorm; Board Settings / Export, Sandstorm | [Sandstorm](Board-Sidebar/Board-Settings/Import-Export/Sandstorm/Sandstorm.md) |
| Rocket.Chat and Fizzy, both ways | Add Board / Import; Board Settings / Export | [Rocket.Chat](Board-Sidebar/Board-Settings/Import-Export/Rocket-Chat/Rocket-Chat.md) and [Fizzy](Board-Sidebar/Board-Settings/Import-Export/Fizzy/Fizzy.md) |
| Chat imports bring their files: Slack's with a Slack token, Telegram's and Discord's from a zipped export folder | Add Board / Import | [Slack](Board-Sidebar/Board-Settings/Import-Export/Slack/Slack.md), [Telegram](Board-Sidebar/Board-Settings/Import-Export/Telegram/Telegram.md), [Discord](Board-Sidebar/Board-Settings/Import-Export/Discord/Discord.md) |
| More of each tool kept both ways: Linear cycles as Scrum sprints, GitHub/Gitea/Forgejo people and dates, Kanboard recurrence, Taiga's blocked state, ClickUp and Notion fields and relations | Add Board / Import; Board Settings / Export | [Format coverage](Board-Sidebar/Board-Settings/Import-Export/Format-Coverage.md) |

## September 2026

| Feature | Where to find it | Instructions |
| --- | --- | --- |
| Paste several cards, lists, swimlanes or boards; keep multiline names | Always-visible creation radio options | [Multiline creation](General/Editor/Multiline.md) |
| Global, board and personal date-format overrides | Admin Visibility / Date; Board Settings / Date; Member Settings / Date | [Date settings](Member-Settings/Date/README.md) |
| Calendar system and first weekday | Member Settings / Date, below Date Format | [Calendars](Member-Settings/Date/Calendar-Systems.md) and [week start](Member-Settings/Date/Day-of-week-start.md) |
| Week numbers | Board Settings / Date, below Save | [Board Date](Board-Sidebar/Board-Settings/Date.md) |
| Visible/default board views and view order | Board Settings / Board View | [Board View](Board-Sidebar/Board-Settings/Board-View.md) |
| Swimlane/list resize locks and common list width | Board Settings / Swimlane or List | [Swimlane](Board-Sidebar/Board-Settings/Swimlane.md) and [List](Board-Sidebar/Board-Settings/List.md) |
| WIP limits across lists or a swimlane's lists | Board Settings / Swimlane / WIP Limit Groups | [WIP Limit Groups](Lists/WipLimit/WIP-Limit-Groups.md) |
| Card/minicard field order and visibility | Board Settings / Card | [Card settings](Board-Sidebar/Board-Settings/Card.md) |
| Saved list collapse state | List header caret | [Lists](Lists/Lists.md) |
| Board/list/swimlane/card import and export | The corresponding item's menu | [Formats](Board-Sidebar/Board-Settings/Import-Export/Format-Coverage.md) and [illustrated exports](../Backup/Backup.md#export-and-import-selected-content) |
| Scheduled backups and Organization scope | Admin Panel / Attachments / Backup | [Backup and restore, including coverage limits](../Backup/Backup.md) |
| Email/in-app notification overrides | Admin People / Notifications; Board Settings / Notifications; Member Settings / Notifications | [Notifications](Member-Settings/Notifications.md) |
| Saved public-board favorites | Public page | [Public](All-Boards/Public.md) |
| My Cards, Due Cards and My Attachments | Username menu | [Personal pages](Pages/My-Cards-Due-Attachments.md) |
| Same-tab linked-card navigation | Linked card title | [Linked cards](Cards/Linked-Cards.md) |
| Checklist dates, attachment previews and comment replies | Opened card | [Checklists](Cards/Checklists.md), [attachments](Cards/Attachments/Attachments.md), [comments](Cards/Comment-Replies-And-Editing-Restriction.md) |
| Attachment slideshow: Markdown, CSV, code, iCalendar, Outlook .msg, tar.gz and OpenDocument; only the screen is read, no size limit | Opened card / an attachment | [The slideshow](Cards/Attachments/Attachments.md#the-slideshow-which-files-are-shown-and-how-much-is-read) |
| Passwordless login and two-factor authentication | Login page and Member Settings | [Passwordless](Login-Page/Passwordless.md) and [two-factor authentication](Login-Page/Two-Factor-Authentication.md) |
| Local operation counters | Admin Panel / Problems / Instrumentation | [Instrumentation](Admin-Panel/Problems/Instrumentation.md) |
| Read-only file, type and recovery-evidence scans | Admin Panel / Problems / Files, Filesystem integrity or Recovery | [File status](Admin-Panel/Problems/File-status.md) |
| Offices and login-address reporting | Admin Panel / Problems / Offices | [Offices](Admin-Panel/Problems/Offices.md) |
| Per-pane Admin URLs and recovery reports | Admin Panel | [URLs](Admin-Panel/Admin-Panel-URLs.md) and [Problems](Admin-Panel/Problems/README.md) |

Build-system changes, dependency updates and security fixes are recorded in the
changelog; platform installation instructions remain under [Platforms](../Platforms).
