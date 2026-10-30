# People / Audit log

`/admin/people/audit-log`, site administrators only.

Every administrative action of a site administrator, newest first, one row
each: when, who, which action, whether it succeeded (a refused call is shown
too, with its error), its arguments and the address it came from. The search
box matches the administrator, the action and the arguments.

What is recorded: changes to people (Add user, Set password, username, email,
admin and active flags, removing a user, impersonation, unlocking), to
organizations and teams, to login and site settings, to attachment storage,
and backups, restores and data repairs. An administrator editing cards is a
member editing cards and is not recorded. The list of actions is
`AUDITED_METHODS` in `models/lib/adminAudit.js`.

A password or a secret is never recorded: values under a credential-named key,
the arguments that are a password by position and a password inside a URL are
shown as `[redacted]`.

Entries are kept for a year and then removed. Attacks WeKan refused are in
Admin Panel / Problems instead; see [Security settings](../../../Security/Security-Settings.md).
