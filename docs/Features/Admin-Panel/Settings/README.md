# Admin Panel / Settings

## What it is

The panes of the Settings tab, in menu order. **Version** is first and is the pane
that opens with the Admin Panel.

Settings is **what this WeKan offers and how it looks**: Appearance, then what it
offers (Features) and who sees it (Feature profiles), then the server-wide
switches for security, activity tracking and deletion. Who may sign in and what
they may do is [People](../People/README.md); what is going wrong is
[Problems](../Problems/README.md). How the layers fit together is
[Who sees and can do what](../Who-Sees-What.md).

## How to use it

1. Open **Admin Panel**; Settings / **Version** opens first.
2. Pick a pane from the left menu. Each pane has an address of its own,
   `/admin/settings/<URL slug>`, and a page here:

| Menu path | URL slug | Page | What it is |
| --- | --- | --- | --- |
| Settings / Version | `version` | [Version.md](Version.md) | What this instance is running: WeKan, Meteor, Node, the database and how it is reached. |
| Settings / Appearance | `appearance` | [Appearance.md](Appearance.md) | How this WeKan looks: what All Boards shows, dates, the card details width, the URLs and autolinks, the product name, colours and logos. Was Visibility; `visibility` redirects here. |
| Settings / Features | `features` | [Features.md](Features.md) | Which optional features this WeKan offers, the card fields every board shows, SQRL, ActivityPub, [Turn off all webhooks](Turn-Off-All-Webhooks.md), Rules and the Optional APIs. |
| Settings / Feature profiles | `feature-profiles` | [Feature-Profiles.md](Feature-Profiles.md) | Hide some of those features from chosen users, teams and organizations. |
| Settings / Security | `security` | [Security.md](Security.md) | What rich text may do, and what may be imported or exported. Was Problems / Security. |
| Settings / Activities and notifications | `activities` | [Activities-and-Notifications.md](Activities-and-Notifications.md) | Turn off activities, notifications or watching. Was Problems / Notifications. |
| Settings / Delete | `delete` | [Delete.md](Delete.md) | Whether Global Admins may permanently delete soft-deleted content. Was Problems / Delete. |
| Settings / Announcement | `announcement` | [Announcement.md](Announcement.md) | The instance-wide banner. |
| Settings / Accessibility | `accessibility` | [Accessibility.md](Accessibility.md) | The accessibility page and its content. |
| Settings / Translation | `translation` | [Translation.md](Translation.md) | Custom translation strings. |
| Settings / PWA | `pwa` | [PWA.md](PWA.md) | Custom head tags, web manifest and assetlinks.json. |
| Settings / Global Webhooks | `global-webhooks` | [Global-Webhooks.md](Global-Webhooks.md) | Outgoing webhooks for the whole instance. |
| Settings / Global Webhooks / Login and registration webhook | `global-webhooks` | [Login-and-Registration-Webhook.md](Login-and-Registration-Webhook.md) | One address told about logins and new accounts, off by default. |
| Settings / Shared labels | `labels` | [Shared-Labels.md](Shared-Labels.md) | Label catalogs for every board, an organization's boards, or a team's. |

Every pane opens with a heading that is its menu entry's own label, so the pane and
the row that opened it always say the same thing — see
[Left Menu](../../All-Boards/Left-Menu.md).

See the pages above.

## Commits

 - [One question per tab: Settings gains Appearance, Features, Feature profiles, Security, Activities and Delete](https://github.com/wekan/wekan/commit/e1a053d059191640a63a22ab553c0b0c6b833d8d)
 - [The docs are filed the way the WeKan menus are](https://github.com/wekan/wekan/commit/b7589737f5730ce1ba83244946e158519528a783)
 - [Admin Panel under /admin, and a header that says where you are](https://github.com/wekan/wekan/commit/03cb79bdd71b1e20f4b971267d7ca73420ff33ca)
 - [A URL for every left-menu entry](https://github.com/wekan/wekan/commit/841479774e12c34337712ef26d2b808b49dc4bfc)
 - [The tables fit, every pane has a title, and Version opens first](https://github.com/wekan/wekan/commit/d232194070314bbde9ab80f90cad037a215a90f9)
