# Admin Panel

Everything an admin can configure or inspect for the whole instance. Open it from
your member menu (top right). Site administrators have instance-wide access;
Organization administrators have access only to their permitted scope.

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

## Settings

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
| Admin Panel / Settings / Accessibility | [Accessibility.md](Settings/Accessibility.md) |
| Admin Panel / Settings / Translation | [Translation.md](Settings/Translation.md) |
| Admin Panel / Settings / PWA | [PWA.md](Settings/PWA.md) |
| Admin Panel / Settings / Global Webhooks | [Global-Webhooks.md](Settings/Global-Webhooks.md) |
| Admin Panel / Settings / Shared labels | [Shared-Labels.md](Settings/Shared-Labels.md) |

## People

Who may sign in, who they belong to, and what they may do.
[Section index](People/README.md).

| Menu path | Page |
| --- | --- |
| Admin Panel / People / E-mail | [E-mail.md](People/E-mail.md) |
| Admin Panel / People / Notifications | [Notifications.md](People/Notifications.md) |
| Admin Panel / People / Domains | [Domains.md](People/Domains.md) |
| Admin Panel / People / Organizations | [Organizations.md](People/Organizations.md) |
| Admin Panel / People / Teams | [Teams.md](People/Teams.md) |
| Admin Panel / People / People | [People.md](People/People.md) |
| Admin Panel / People / Locked Users | [Locked-Users.md](People/Locked-Users.md) |
| Admin Panel / People / Audit log | [Audit-Log.md](People/Audit-Log.md) |
| Admin Panel / People / Roles | [Roles.md](People/Roles.md) |
| Admin Panel / People / Shared templates | [Shared-Templates.md](People/Shared-Templates.md) |
| Admin Panel / People / Login | [Login.md](People/Login.md) |
| Admin Panel / People / SAML, LDAP, OAuth2, CAS, Header login, OAuth login providers, Passwordless login | [Login.md](People/Login.md#provider-settings) |

The People, Teams and Organizations tables also show the
[feature profile](Settings/Feature-Profiles.md) that applies.

## Attachments

Where files are stored, how big they may be, moving them between storages, and
backups. [Section index](Attachments/README.md) — it has a heading per menu entry,
in menu order, starting with **Backup**, which is also the pane that opens.

## Problems

Instance health: what is broken, what is running, and the paginated report tables.
[Section index](Problems/README.md).

**Summary** first, then **Backup** (did the backup work), then the **Reports**
group: Security Report, Impersonation Report, Password length, Performance, Speed,
Tests, CPU usage, Memory usage, Disk usage, Instrumentation, Broken Cards, Files
Report, Rules Report, Boards Report, Cards Report, Recovery, Offices, API,
Database problems, Filesystem integrity and Email. Every report is one shared
[table page](../General/Table.md): a search box, a total, `page X / N` and
prev/next.

## Sandstorm

On Sandstorm, authentication (LDAP, passwordless e-mail, SAML, GitHub and Google
Auth) and SMTP are handled by Sandstorm itself: you add and remove users there. There
is no longer a **Sandstorm** pane in Attachments — see
[Attachments](Attachments/README.md#sandstorm--removed-from-the-menu).

## Panes that moved or are gone

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

## Related

- [Login / Authentication methods](../../README.md#LoginAuth) — LDAP, OAuth2,
  SAML, Keycloak, Google, Azure, and more.
- [Members and Permissions](../Board-Sidebar/Members/Members.md)
- [E-mail troubleshooting](../General/Email/Troubleshooting-Mail.md)
- [Comment replies and editing restriction](../Cards/Comment-Replies-And-Editing-Restriction.md)
  — a board setting rather than an Admin Panel one, but often looked for here.

## Implementation validation

[Validation report](Validation.md): the panes, backup fixes, test evidence and
external-service verification limits.
