# Admin Panel / Settings / Security

Server-wide switches for what rich text may do and what may be imported or
exported. Address: `/admin/settings/security`. Site administrators only. Each
switch is saved as soon as it is ticked, is off by default, and is enforced on
the server - hiding a menu item is never the only thing it does.

Until 2026-11-19 this pane was Admin Panel / Problems / Security;
`/admin/problems/security` redirects here. It is a setting, not a report.

## Rich text

- **Render links as plain text** - every link, both markdown links and raw HTML
  `<a href>` tags, is shown as plain, non-clickable text in every rich text
  field (board and card titles, descriptions, comments, checklists, ...). This
  prevents misleading clickable links.
- **Always show all code as plain text** - rich text is never rendered as
  markdown or HTML: the whole source is shown as plain text, which reveals hidden
  content - HTML comments, the target of markdown links, JavaScript and any other
  code - so nothing is clickable or running.

## Import and export

- **Disable all import** - every import is off: WeKan JSON, Trello, CSV/Excel,
  Jira, Kanboard, NextCloud Deck, OpenProject, GitHub, GitLab, Gitea and Forgejo,
  and cloning a board. The menu options are hidden and the server refuses any
  import request.
- **Largest import (MB)** - the largest file the Import page accepts. Empty is
  no limit: a file may be as large as the free disk space lets the import
  finish. Every upload is written to the server's disk a part at a time and an
  import that would fill the disk is refused
  ([Large files](../../Board-Sidebar/Board-Settings/Import-Export/External-Tools.md#large-files)).
- **Disable all export** - every export is off: WeKan JSON, CSV, Excel, Kanboard,
  and to NextCloud Deck / OpenProject / GitHub / GitLab / Gitea / Forgejo, and
  single-attachment export.
- **Disable import avatars** - profile pictures are never imported: WeKan JSON
  and Trello import, and avatar sync from LDAP or OIDC/OAuth2 on login. Names and
  other data are still imported.
- **Disable export avatars** - profile pictures are never included in a board
  export (WeKan JSON and CSV).
- **Anonymize import users** - importing a WeKan JSON board replaces every
  imported user's username, full name and initials with `user1`, `user2`, ...,
  drops their avatar, and rewrites `@username` mentions and the requested-by /
  assigned-by fields in card and comment content. No real identity from the
  source board is stored.
- **Anonymize export users** - the same for exporting: the exported file carries
  no real user identity.

The word "user" in the placeholders follows the language of the person importing
or exporting.

## Related

- [Activities and notifications](Activities-and-Notifications.md)
- [Delete](Delete.md)
- [Admin Panel / Problems / Security Report](../Problems/README.md) - what the
  security log has recorded.
