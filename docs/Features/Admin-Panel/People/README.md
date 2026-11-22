# Admin Panel / People

## What it is

Who may sign in, who they belong to, and what they may do. Admin Panel / People
is the tab of the Admin Panel where a site administrator configures sign-in and
e-mail, manages users, Organizations and Teams, sets brute-force protection,
reads the audit log, and decides which board roles may invite. Every pane has an
address of its own, `/admin/people/<slug>`; a bare `/admin/people` opens
**E-mail**.

## How to use it

1. Sign in as a site administrator (a per-tenant Organization admin gets only
   People and Organizations here).
2. Open **Admin Panel**, then **People** in its top bar.
3. Choose a pane in the left menu, or open its URL slug directly. Each pane's
   own page is linked in the table below.

The table lists the panes in the order `models/lib/adminUrls.js` declares them.
The left menu draws them in a different order: E-mail, Notifications, Domains,
Organizations, Teams, People, Locked Users, Audit log, Roles, Shared templates,
and then the login panes from Login to Passwordless login. There is no Cloud
pane here: the [Cloud Panel](../Cloud-Panel.md) is turned on only by the
server's `CLOUD` environment variable, and is Admin Panel / Cloud there.

| Menu path | URL slug | Page | What it is |
| --- | --- | --- | --- |
| People / Login | `login` | [Login.md](Login.md) | What is allowed at sign-in, and the authentication method. |
| People / SAML | `saml` | [Login.md](Login.md#provider-settings) | SAML provider overrides and service URLs. |
| People / LDAP | `ldap` | [Login.md](Login.md#provider-settings) | Every LDAP_* setting, and a connection test. |
| People / OAuth2 | `oidc` | [Login.md](Login.md#provider-settings) | Every OAUTH2_* (OpenID Connect) setting, Oracle OIM included. |
| People / CAS | `cas` | [Login.md](Login.md#provider-settings) | Every CAS_* setting. |
| People / Header login | `header-login` | [Login.md](Login.md#provider-settings) | Every HEADER_LOGIN_* setting, read-only: header login is environment-only. |
| People / OAuth login providers | `oauth` | [Login.md](Login.md#provider-settings) | OAuth provider configuration. |
| People / Passwordless login | `passwordless` | [Login.md](Login.md#provider-settings) | Passwordless authentication settings. |
| People / E-mail | `email` | [E-mail.md](E-mail.md) | SMTP, the invite domain, and whether users may change their address. |
| People / Notifications | `notifications` | [Notifications.md](Notifications.md) | The site-wide notification default, overridable per board and per member. |
| People / Domains | `domains` | [Domains.md](Domains.md) | The e-mail domains in use, with a user count each. |
| People / Organizations | `organizations` | [Organizations.md](Organizations.md) | Organizations, their per-organization switches, and the same-Organization board restriction. |
| People / Teams | `teams` | [Teams.md](Teams.md) | Teams, their per-team switches, and the same-Team board restriction. |
| People / People | `people` | [People.md](People.md) | Every user: e-mail, admin flag, active state, lockout, created date. |
| People / Locked Users | `locked-users` | [Locked-Users.md](Locked-Users.md) | Brute-force protection settings; who is locked is shown in People. |
| People / Audit log | `audit-log` | [Audit-Log.md](Audit-Log.md) | What site administrators did, newest first; kept for a year. |
| People / Roles | `roles` | [Roles.md](Roles.md) | Which board roles may invite people to a board, and custom roles. |
| People / Shared templates | `shared-templates` | [Shared-Templates.md](Shared-Templates.md) | Which scopes may share template boards. |

Domains, Organizations, Teams and People are [table pages](../../General/Table.md):
search on Enter, a total, `page X / N`, prev/next, and one page of rows fetched at a
time. Locked users, Roles and Shared templates are forms, not tables.

On Sandstorm, E-mail, Locked Users and the login panes are not shown: the
grain's login and mail are Sandstorm's own.

See the pages above.

## Commits

 - [Login methods get menu entries of their own, and People opens on E-mail](https://github.com/wekan/wekan/commit/ecdae60a8a9d0b069839193c45d6e5c8ee8a9f5d)
 - [A URL for every left-menu entry](https://github.com/wekan/wekan/commit/841479774e12c34337712ef26d2b808b49dc4bfc)
 - [A pane does not repeat the title above it](https://github.com/wekan/wekan/commit/9a0db4343c8c5f5c56cd7727c20a3978384ab6bd)
 - [Login and E-mail move from Settings to People](https://github.com/wekan/wekan/commit/47b03ef89404c446dbaf0fc94c7271abaf82e5ef)
 - [The tables are back, and the selected menu entry stands out](https://github.com/wekan/wekan/commit/b775ee1e1b3746cb3797a094820ef67e091f46a5)
