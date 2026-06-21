# Authentication, Admin Panel and SMTP Settings

WeKan has an **Admin Panel** for managing the whole instance, reached from your
member menu (top right corner) when you are an admin.

## Admin Panel

On the Source and Docker platforms the [Admin Panel](../../../CHANGELOG.md#v0111-rc2-2017-03-05-wekan-prerelease)
lets you:

- Allow self-registration, or switch to **invite-only** and invite users to boards.
- Manage users ("People").
- Configure **SMTP** (email) settings.
- Configure layout, accessibility, announcements, and other instance settings.

### Registration / invite-only

![Wekan Admin Panel registration screenshot](../screenshot-admin-panel-registration.png)

### SMTP email settings

![Wekan Admin Panel email screenshot](../screenshot-admin-panel-email.png)

### People: Domains tab

**Admin Panel → People** has a **Domains** tab that lists the email domains in use
across the instance together with the number of users on each domain.

### People: Organizations / Teams toggle columns

The **Organizations** and **Teams** tabs under **Admin Panel → People** have
per-organization / per-team toggle columns:

- **Shared Templates** — whether template boards shared with this organization/team
  are available to its members.
- **Propagate Members To Boards** — whether members of this organization/team are
  automatically added to the relevant boards. Enabling it adds the group's member
  users to the regular boards that list the group (add-only; template boards are
  skipped). It runs during the LDAP background sync and can also be triggered by an
  admin.
- **Sync Members From Auth Provider** — whether the membership is kept in sync from
  the authentication provider (for example LDAP groups, see
  `LDAP_SYNC_ORGANIZATIONS` / `LDAP_SYNC_TEAMS`).

### Restrict board members to the same Organization or Team

When the global admin setting **"Add board members only from the same Organization or
Team"** (`boardMembersFromSameOrgOrTeamOnly`, default off) is enabled, a user can only
be added to a board if they share at least one Organization or Team with the inviter or
with an active board member. Site admins bypass the restriction. This is useful on
multi-tenant instances and is enforced server-side (both the invite action and the
user-search typeahead respect it).

### Per-user announcement dismissal

The global **Announcement** banner can now be dismissed permanently per user — closing
it stores the current announcement version on that user, so it does not reappear on
reload or board switch. When an admin edits the announcement text, its version changes
and the banner reappears for everyone.

### Restrict comment editing (per board)

A board setting **"Restrict comment editing"** (`restrictCommentEditing`, default off)
prevents board admins from editing or deleting other users' comments — only a comment's
author may edit or delete it. Enforced server-side. See
[Comment replies and editing restriction](../Comment-Replies-And-Editing-Restriction.md).

## Sandstorm platform

On Sandstorm, authentication (LDAP, passwordless email, SAML, GitHub and Google
Auth) and SMTP are handled by Sandstorm. You add and remove users there, and WeKan,
Rocket.Chat and other apps can be installed with one click.

## Related

- [Login / Authentication methods](../../README.md#LoginAuth) — LDAP, OAuth2,
  SAML, Keycloak, Google, Azure, and more.
- [Members and Permissions](../Members/Members.md)
- [Accessibility settings](../Accessibility/Accessibility.md)
- [Email troubleshooting](../../Email/Troubleshooting-Mail.md)
