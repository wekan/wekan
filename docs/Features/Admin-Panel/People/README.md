# Admin Panel / People

Who may sign in, who they belong to, and what they may do — in menu order.

| Menu path | URL slug | Page | What it is |
| --- | --- | --- | --- |
| People / Login | `login` | [Login.md](Login.md) | What is allowed at sign-in, and the authentication method. |
| People / E-mail | `email` | [E-mail.md](E-mail.md) | SMTP, the invite domain, and whether users may change their address. |
| People / Domains | `domains` | [Domains.md](Domains.md) | The e-mail domains in use, with a user count each. |
| People / Organizations | `organizations` | [Organizations.md](Organizations.md) | Organizations, their per-organization switches, and the same-Organization board restriction. |
| People / Teams | `teams` | [Teams.md](Teams.md) | Teams, their per-team switches, and the same-Team board restriction. |
| People / People | `people` | [People.md](People.md) | Every user: e-mail, admin flag, active state, lockout, created date. |
| People / Locked Users | `locked-users` | [Locked-Users.md](Locked-Users.md) | Brute-force protection settings and who is locked out. |
| People / Roles | `roles` | [Roles.md](Roles.md) | Which board roles may invite people to a board. |
| People / Shared templates | `shared-templates` | [Shared-Templates.md](Shared-Templates.md) | Which scopes may share template boards. |

Domains, Organizations, Teams and People are [table pages](../../../Features/Page/Table.md):
search on Enter, a total, `page X / N`, prev/next, and one page of rows fetched at a
time. Locked users, Roles and Shared templates are forms, not tables.
