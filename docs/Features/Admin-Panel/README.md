# Admin Panel

## What it is

The Admin Panel is everything an admin can configure or inspect for the whole
instance: what WeKan offers and how it looks, who may sign in and what they may
do, where files are kept and backed up, and what is going wrong. Site
administrators have instance-wide access; Organization administrators have
access only to their permitted scope.

## Read more

- [System administrator](https://en.wikipedia.org/wiki/System_administrator)
  on Wikipedia - the role the Admin Panel is for.
- [Clean URL](https://en.wikipedia.org/wiki/Clean_URL) and
  [Slug (web publishing)](https://en.wikipedia.org/wiki/Slug_(web_publishing))
  on Wikipedia - the `/admin/<tab>/<pane>` addresses.
- WeKan: [Who sees and can do what](Who-Sees-What.md),
  [Settings enforced on the server](Settings-Enforced-On-Server.md),
  [Admin Panel URLs](Admin-Panel-URLs.md) and the
  [Validation report](Validation.md).

## How to use it

1. Open your member menu (top right) and choose **Admin Panel**. A site
   administrator lands on **Settings / Version**; an Organization administrator,
   who has no Settings tab, lands on **People**.
2. Choose a tab in the first header bar: **Settings**, **People**,
   **Attachments** or **Problems** (an Organization administrator sees People
   and Attachments only).
3. Choose a pane from the tab's left menu. The address bar then shows that
   pane's own address, which can be bookmarked or sent to a colleague.

**The directory you are in mirrors the menu.** A menu path is a docs path:
Admin Panel / Settings / Appearance is
[`Settings/Appearance.md`](Settings/Appearance.md), Admin Panel / People / Teams is
[`People/Teams.md`](People/Teams.md), and so on. The tab bar has four sections, and
each has its own left menu — the shared design behind both is
[Left Menu](../All-Boards/Left-Menu.md). Every pane has its own address,
`/admin/<tab>/<pane>` ([Admin Panel URLs](Admin-Panel-URLs.md)).

**One question per tab:**

| Tab | Answers |
| --- | --- |
| [Settings](Settings/README.md) | What does this WeKan offer, how does it look, and how does it behave? |
| [People](People/README.md) | Who may sign in, who do they belong to, and what may they do? |
| [Attachments](Attachments/README.md) | Where are files kept, how big may they be, and are they backed up? |
| [Problems](Problems/README.md) | What is going wrong, what is running, and what happened? |

Which setting decides whether somebody sees or may use something - the instance,
a feature profile, the board, a role - is explained in one place:
[Who sees and can do what](Who-Sees-What.md).

### Settings

Opens on **Version**, so the first thing an admin sees is what this instance is
running. [Section index](Settings/README.md).

| Menu path | Page |
| --- | --- |
| Admin Panel / Settings / Version | [Version.md](Settings/Version.md) |
| Admin Panel / Settings / Appearance | [Appearance.md](Settings/Appearance.md) |
| Admin Panel / Settings / Features | [Features.md](Settings/Features.md) |
| Admin Panel / Settings / Feature profiles | [Feature-Profiles.md](Settings/Feature-Profiles.md) |
| Admin Panel / Settings / Security | [Security.md](Settings/Security.md) |
| Admin Panel / Settings / Activities and notifications | [Activities-and-Notifications.md](Settings/Activities-and-Notifications.md) |
| Admin Panel / Settings / Delete | [Delete.md](Settings/Delete.md) |
| Admin Panel / Settings / Announcement | [Announcement.md](Settings/Announcement.md) |
| Admin Panel / Settings / Accessibility | [Accessibility.md](../Accessibility/Admin-Panel-Settings.md) |
| Admin Panel / Settings / Translation | [Translation.md](Settings/Translation.md) |
| Admin Panel / Settings / PWA | [PWA.md](Settings/PWA.md) |
| Admin Panel / Settings / Global Webhooks | [Global-Webhooks.md](Settings/Global-Webhooks.md) |
| Admin Panel / Settings / Shared labels | [Shared-Labels.md](Settings/Shared-Labels.md) |

### People

Who may sign in, who they belong to, and what they may do.
[Section index](People/README.md).

| Menu path | Page |
| --- | --- |
| Admin Panel / People / E-mail | [E-mail.md](People/E-mail.md) |
| Admin Panel / People / Notifications | [Notifications.md](People/Notifications.md) |
| Admin Panel / People / Domains | [Domains.md](People/Domains.md) |
| Admin Panel / People / Organizations | [Organizations.md](People/Organizations.md) |
| Admin Panel / People / Teams | [Teams.md](People/Teams.md) |
| Admin Panel / People / People | [People.md](People/README.md) |
| Admin Panel / People / Locked Users | [Locked-Users.md](People/Locked-Users.md) |
| Admin Panel / People / Audit log | [Audit-Log.md](People/Audit-Log.md) |
| Admin Panel / People / Roles | [Roles.md](People/Roles.md) |
| Admin Panel / People / Shared templates | [Shared-Templates.md](People/Shared-Templates.md) |
| Admin Panel / People / Login | [Login.md](People/Login.md) |
| Admin Panel / People / SAML, LDAP, OAuth2, CAS, Header login, OAuth login providers, Passwordless login | [Login.md](People/Login.md#provider-settings) |

The People, Teams and Organizations tables also show the
[feature profile](Settings/Feature-Profiles.md) that applies.

### Attachments

Where files are stored, how big they may be, moving them between storages, and
backups. [Section index](Attachments/README.md) — it has a heading per menu entry,
in menu order, starting with **Backup**, which is also the pane that opens.

### Problems

Instance health: what is broken, what is running, and the paginated report tables.
[Section index](Problems/README.md).

**Summary** first, then **Backup** (did the backup work), then the **Reports**
group: Security Report, Impersonation Report, Password length, Performance, Speed,
Tests, CPU usage, Memory usage, Disk usage, Instrumentation, Broken Cards, Files
Report, Rules Report, Boards Report, Cards Report, Recovery, Offices, API,
Database problems, Filesystem integrity and Email. Every report is one shared
[table page](../Table.md): a search box, a total, `page X / N` and
prev/next.

### Sandstorm

On Sandstorm, authentication (LDAP, passwordless e-mail, SAML, GitHub and Google
Auth) and SMTP are handled by Sandstorm itself: you add and remove users there. There
is no longer a **Sandstorm** pane in Attachments — see
[Attachments](Attachments/README.md#sandstorm--removed-from-the-menu).

### Panes that moved or are gone

When following an older link or bookmark - every old address redirects:

- **Settings / Visibility** (2026-11-19) is [Appearance](Settings/Appearance.md);
  its Features group is [Features](Settings/Features.md) and its feature profiles
  are [Feature profiles](Settings/Feature-Profiles.md).
- **Problems / Security, Delete and Notifications** (2026-11-19) are
  [Settings / Security](Settings/Security.md),
  [Settings / Delete](Settings/Delete.md) and
  [Settings / Activities and notifications](Settings/Activities-and-Notifications.md):
  they are settings, not reports.
- **Features** tab — removed (2026-07); its panes went to Problems, and from there
  to Settings as above. Performance is still a Problems report.
- **Accounts** tab — removed. Its three settings live with what they are about:
  Allow e-mail change in [People / E-mail](People/E-mail.md), Username change and
  Self delete user account in [People / Login](People/Login.md).
- **Layout** is [PWA](Settings/PWA.md) — its branding and All Boards settings moved
  to [Appearance](Settings/Appearance.md). **Boards visibility** is
  [Appearance](Settings/Appearance.md). **Registration** is
  [People / Login](People/Login.md). **Info** is
  [Settings / Version](Settings/Version.md).

## How the numbers are calculated

See the pages above. This index has no numbers of its own; each pane's page
says how its counts, limits and defaults are computed.

## How it works in WeKan

- **Tabs and panes:** [models/lib/adminUrls.js](../../../models/lib/adminUrls.js)
  maps every pane's URL slug to its pane id and title, and
  [config/router.js](../../../config/router.js) builds the four
  `/admin/<tab>/:pane` routes from it ([Admin Panel URLs](Admin-Panel-URLs.md)).
- **The tab bar:** `adminPanelTabs` in
  [client/components/settings/settingHeader.jade](../../../client/components/settings/settingHeader.jade);
  Settings and Problems are shown only to a site administrator.
- **The member-menu link:** [client/components/users/userHeader.jade](../../../client/components/users/userHeader.jade)
  sends a site administrator to Settings and an Organization administrator to
  People.
- **Organization administrators:** which panes they keep is decided by
  [models/lib/tenantAdmin.js](../../../models/lib/tenantAdmin.js).
- **Tests:** [tests/adminPanelDocsMatchMenu.test.cjs](../../../tests/adminPanelDocsMatchMenu.test.cjs)
  keeps this folder in step with the menu,
  [tests/adminPanelStructure.test.cjs](../../../tests/adminPanelStructure.test.cjs)
  the tabs and their pages, and
  [tests/adminUrls.test.cjs](../../../tests/adminUrls.test.cjs) the URLs.

## Related

- [Login / Authentication methods](../../README.md#LoginAuth) — LDAP, OAuth2,
  SAML, Keycloak, Google, Azure, and more.
- [Members and Permissions](../Board-Sidebar/Members/README.md)
- [E-mail troubleshooting](../Email/Troubleshooting-Mail.md)
- [Comment replies and editing restriction](../Cards/Comment-Replies-And-Editing-Restriction.md)
  — a board setting rather than an Admin Panel one, but often looked for here.

## Implementation validation

[Validation report](Validation.md): the panes, backup fixes, test evidence and
external-service verification limits.

## Commits

 - [Admin Panel: one question per tab - Settings gains Appearance, Features, Feature profiles, Security, Activities and Delete](https://github.com/wekan/wekan/commit/e1a053d059191640a63a22ab553c0b0c6b833d8d)
 - [The docs mirror the Admin Panel and its menus, a page for every menu entry](https://github.com/wekan/wekan/commit/a8fd080bc8ece74157e5f2e9e436fa2dafe76348)
 - [The docs folders follow the WeKan menus](https://github.com/wekan/wekan/commit/b7589737f5730ce1ba83244946e158519528a783)
 - [Admin Panel features validated and their audit written](https://github.com/wekan/wekan/commit/58d8563637d1a9badcf2ff5cf0ea6793d7b7d1eb)
 - [Problems: permanent delete](https://github.com/wekan/wekan/commit/4ab3161b4f58d459c2c1808eac91685d0888ec10)
 - [The Admin Panel moves under /admin, and the header says where you are](https://github.com/wekan/wekan/commit/03cb79bdd71b1e20f4b971267d7ca73420ff33ca)
 - [The four tabs become icons in the first header bar](https://github.com/wekan/wekan/commit/f83234f0d81ceaf94eddaa9caa0f8b0ef38ea4cb)
 - [A URL for every left-menu entry](https://github.com/wekan/wekan/commit/841479774e12c34337712ef26d2b808b49dc4bfc)
 - [The Attachments / Sandstorm pane is commented out](https://github.com/wekan/wekan/commit/eba25459a33218cb0da97f53e399f96d21f39073)
 - [The Admin Panel docs mirror the Admin Panel menu](https://github.com/wekan/wekan/commit/1e9e58dab6e4fb62e949d893416263ef15c4dbe9)
 - [The board-member restriction moves to Organizations and Teams](https://github.com/wekan/wekan/commit/f0ea1601b3f6e2530501873efc5824d48ee79991)
 - [Organization administrators: the Admin Panel limited to their own Organization](https://github.com/wekan/wekan/commit/36b899b9d643fd428613fa8e7197bafc192a42db)
 - [The tables fit, every pane has a title, and Version opens first](https://github.com/wekan/wekan/commit/d232194070314bbde9ab80f90cad037a215a90f9)
 - [The left menu is back on every Admin Panel page](https://github.com/wekan/wekan/commit/d34d281595b9bd10cf7295b4aa216afaf29e8394)
