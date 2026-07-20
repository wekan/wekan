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
[Comment replies and editing restriction](../Cards/Comment-Replies-And-Editing-Restriction.md).

## Features tab

**Admin Panel → Features** groups optional, instance-wide capabilities into
categories in a side menu. Every toggle is a global setting, saved immediately when
clicked, and defaults to **off** (current behaviour) unless noted.

### Performance

- **Card loading** — automatic, no toggle. WeKan decides **per board by size**: a
  board over the threshold (default 500 cards, `CARDS_LOADING_LAZY_THRESHOLD`) loads
  only the currently visible cards (infinite-scroll windows) plus a live count, so
  very large boards stay fast; smaller boards load every card (simple, fully
  featured). Operators can still force a mode with `CARDS_LOADING=all|lazy|auto`.

### Security

Rich-text rendering hardening:

- **Render links as plain text** (`renderLinksAsPlainText`) — all links (markdown
  `[label](url)` and raw HTML `<a href>`) render as plain, non-clickable text in
  every rich-text field (board and card titles, descriptions, comments, checklists,
  …), so a link can never be clicked or hide a misleading target.
- **Always show all code as plain text** (`alwaysShowCodeAsText`) — rich text is
  never rendered as markdown/HTML; the whole source is shown escaped, revealing HTML
  comments (`<!-- -->`), the target of markdown links, JavaScript and any other code.
  All code stays visible, not clickable, not running.

Import / export privacy (all enforced server-side, so they cannot be bypassed from
the client):

- **Disable all import** (`disableAllImport`) / **Disable all export**
  (`disableAllExport`) — master switches that turn off every import / export feature
  (WeKan JSON, Trello, CSV/Excel, Jira, Kanboard, NextCloud Deck, OpenProject,
  GitHub/GitLab/Gitea/Forgejo, board clone, single-attachment export). The matching
  import / export menu options are also hidden in the UI.
- **Disable import avatars** (`disableImportAvatars`) — avatars are never imported,
  from WeKan JSON import, Trello import, or external identity-provider sync on login
  (LDAP, OIDC/OAuth2). Gated at the single `localizeAvatarFromBuffer` choke point.
- **Disable export avatars** (`disableExportAvatars`) — avatars are never included
  when exporting (WeKan JSON and CSV export).
- **Anonymize import users** (`anonymizeImportUsers`) / **Anonymize export users**
  (`anonymizeExportUsers`) — replace every user's username, full name and initials
  with counter placeholders (`user1`, `user2`, …), drop their avatar, and rewrite
  `@username` mentions plus the requested-by / assigned-by fields inside card and
  comment content. The imported board / exported file then carries no real user
  identity. The placeholder word "user" follows the language of the person
  importing / exporting (e.g. `käyttäjä1` in Finnish). Both export paths — the
  in-memory `build()` and the streaming `buildStream()` — are covered.

### Notifications

Privacy controls for deployments that must limit activity tracking, notifications
or watching (e.g. to comply with local law or an organization's policy)
([#5820](https://github.com/wekan/wekan/issues/5820)), enforced server-side:

- **Disable all activities** (`disableActivities`) — activity-feed entries are
  neither recorded nor shown anywhere (board sidebar and card activity tab). No
  history of who did what is kept.
- **Disable all notifications** (`disableNotifications`) — WeKan never sends watch
  notifications for any activity. Activities can still be recorded (unless also
  disabled); only the notifications are suppressed.
- **Disable watch** (`disableWatch`) — the watch feature is turned off: users cannot
  subscribe to boards, lists or cards, any watch-level change is rejected, and the
  watch button is hidden.

## Problems

**Admin Panel → Problems** collects instance health reports. Each is a paginated,
searchable, read-only event stream that records only what matters (e.g. the start and
end of a problem period), so it never floods:

- [CPU usage](Problems/CPU-usage.md) — sustained high system-wide CPU periods, what
  WeKan/FerretDB were doing, the automatic mitigation taken and whether it helped.
  **Implemented.**
- [RAM usage](Problems/RAM-usage.md) — sustained high RAM + swap usage periods (start
  and end), with how much RAM/swap was used. **Design.**
- [Disk usage](Problems/Disk-usage.md) — sustained high disk-usage periods per watched
  filesystem (start and end), with used/free space. **Design.**

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
