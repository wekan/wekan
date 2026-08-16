# Admin Panel

Everything an admin can configure or inspect for the whole instance. Open it from
your member menu (top right) when you are an admin; every page checks
`currentUser.isAdmin`.

**The directory you are in mirrors the menu.** A menu path is a docs path:
Admin Panel / Settings / Visibility is
[`Settings/Visibility.md`](Settings/Visibility.md), Admin Panel / People / Teams is
[`People/Teams.md`](People/Teams.md), and so on. The tab bar has four sections, and
each has its own left menu — the shared design behind both is
[Left Menu](../../Features/Page/Left-Menu.md).

## Settings

Opens on **Version**, so the first thing an admin sees is what this instance is
running. [Section index](Settings/README.md).

| Menu path | Page |
| --- | --- |
| Admin Panel / Settings / Version | [Version.md](Settings/Version.md) |
| Admin Panel / Settings / Visibility | [Visibility.md](Settings/Visibility.md) |
| Admin Panel / Settings / Announcement | [Announcement.md](Settings/Announcement.md) |
| Admin Panel / Settings / Accessibility | [Accessibility.md](Settings/Accessibility.md) |
| Admin Panel / Settings / Translation | [Translation.md](Settings/Translation.md) |
| Admin Panel / Settings / PWA | [PWA.md](Settings/PWA.md) |
| Admin Panel / Settings / Global Webhooks | [Global-Webhooks.md](Settings/Global-Webhooks.md) |

## People

Who may sign in, who they belong to, and what they may do.
[Section index](People/README.md).

| Menu path | Page |
| --- | --- |
| Admin Panel / People / Login | [Login.md](People/Login.md) |
| Admin Panel / People / E-mail | [E-mail.md](People/E-mail.md) |
| Admin Panel / People / Domains | [Domains.md](People/Domains.md) |
| Admin Panel / People / Organizations | [Organizations.md](People/Organizations.md) |
| Admin Panel / People / Teams | [Teams.md](People/Teams.md) |
| Admin Panel / People / People | [People.md](People/People.md) |
| Admin Panel / People / Locked Users | [Locked-Users.md](People/Locked-Users.md) |
| Admin Panel / People / Roles | [Roles.md](People/Roles.md) |
| Admin Panel / People / Shared templates | [Shared-Templates.md](People/Shared-Templates.md) |

## Attachments

Where files are stored, how big they may be, moving them between storages, and
backups. [Section index](Attachments/README.md) — it has a heading per menu entry,
in menu order, starting with **Backup**, which is also the pane that opens.

## Problems

Instance health: what is broken, what is running, and the paginated report tables.
[Section index](Problems/README.md).

The left menu is two named groups. **Settings** — Security and Notifications, the
two panes that came from the removed Features tab. **Reports** — Security Report,
Impersonation Report, Performance, Speed, Tests, CPU usage, Broken Cards, Files,
Rules, Boards, Cards and Recovery. Every report is one shared
[table page](../../Features/Page/Table.md): a search box, a total, `page X / N` and
prev/next.

## Sandstorm

On Sandstorm, authentication (LDAP, passwordless e-mail, SAML, GitHub and Google
Auth) and SMTP are handled by Sandstorm itself: you add and remove users there. There
is no longer a **Sandstorm** pane in Attachments — see
[Attachments](Attachments/README.md#sandstorm--removed-from-the-menu).

## Two panes that are gone

- **Features** — removed. Performance, Security and Notifications are panes of
  Admin Panel / Problems now.
- **Accounts** — removed. Its three settings live with what they are about: Allow
  e-mail change in [People / E-mail](People/E-mail.md), Username change and Self
  delete user account in [People / Login](People/Login.md).

Renames to know when following an older link: **Layout** is
[PWA](Settings/PWA.md) — its branding and All Boards settings moved to
[Visibility](Settings/Visibility.md); **Boards visibility** is
[Visibility](Settings/Visibility.md); **Registration** is
[People / Login](People/Login.md); **Info** is
[Settings / Version](Settings/Version.md).

## Related

- [Login / Authentication methods](../../README.md#LoginAuth) — LDAP, OAuth2,
  SAML, Keycloak, Google, Azure, and more.
- [Members and Permissions](../Members/Members.md)
- [E-mail troubleshooting](../Email/Troubleshooting-Mail.md)
- [Comment replies and editing restriction](../Cards/Comment-Replies-And-Editing-Restriction.md)
  — a board setting rather than an Admin Panel one, but often looked for here.
