# Admin Panel / Settings / Security

## What it is

Server-wide switches for what rich text may do and what may be imported or
exported. Address: `/admin/settings/security`. Site administrators only. Each
switch is saved as soon as it is ticked, is off by default, and is enforced on
the server - hiding a menu item is never the only thing it does.

Until 2026-11-19 this pane was Admin Panel / Problems / Security;
`/admin/problems/security` redirects here. It is a setting, not a report.

## Read more

- [Markdown](https://en.wikipedia.org/wiki/Markdown) and
  [HTML sanitization](https://en.wikipedia.org/wiki/HTML_sanitization) on
  Wikipedia - what the two rich-text switches act on.
- [Cross-site scripting](https://en.wikipedia.org/wiki/Cross-site_scripting) on
  Wikipedia - why showing all code as plain text is a safe mode.
- [Data anonymization](https://en.wikipedia.org/wiki/Data_anonymization) and
  [Pseudonymization](https://en.wikipedia.org/wiki/Pseudonymization) on
  Wikipedia - what the anonymize switches do.
- [Import and export formats](../../Board-Sidebar/Board-Settings/Import-Export/External-Tools.md)
  in WeKan.

## How to use it

1. Open **Admin Panel / Settings / Security**.
2. Tick the switches you need. Each is saved at once; **Largest import (MB)** is
   saved when you leave the field.

**Rich text**

- **Render links as plain text** - every link, both markdown links and raw HTML
  `<a href>` tags, is shown as plain, non-clickable text in every rich text
  field (board and card titles, descriptions, comments, checklists, ...). This
  prevents misleading clickable links.
- **Always show all code as plain text** - rich text is never rendered as
  markdown or HTML: the whole source is shown as plain text, which reveals hidden
  content - HTML comments, the target of markdown links, JavaScript and any other
  code - so nothing is clickable or running.

**Import and export**

- **Disable all import** - every import is off: WeKan JSON, Trello, CSV/Excel,
  Jira, Kanboard, NextCloud Deck, OpenProject, GitHub, GitLab, Gitea and Forgejo,
  and cloning a board. The menu options are hidden and the server refuses any
  import request - the Trello API, iCalendar and Scrum transfer imports too
  ([Settings enforced on the server](../Settings-Enforced-On-Server.md)).
- **Largest import (MB)** - the largest file the Import page accepts. Empty is
  no limit (the box shows *No limit*): a file may be as large as the free disk
  space lets the import finish. Every upload is written to the server's disk a
  part at a time and an import that would fill the disk is refused
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

## How the numbers are calculated

- **Largest import (MB)**: a whole number of megabytes; the value is rounded
  down, and empty or 0 removes the limit (`importMaxMegabytes` is unset). The
  server turns it into bytes as `MB × 1024 × 1024` (`importLimitBytes()` in
  [server/lib/importDiskSpace.js](../../../../server/lib/importDiskSpace.js)).
- **Free disk space** for an import is the free space of the disk less a
  reserve of **512 MB** (`IMPORT_DISK_RESERVE_MB` changes it), so an import that
  would fit to the last byte is still refused.
- **Anonymized names**: the users of the board are sorted by their `_id` and
  numbered from 1, so the same board always gets the same labels. Username and
  full name become `<word><n>` (`user1`, `käyttäjä1`, ...), initials the first
  letter of the word in upper case followed by `n` (`U1`)
  (`buildUserAnonymizationMap()` in
  [models/lib/importExportSecurity.js](../../../../models/lib/importExportSecurity.js)).

## How it works in WeKan

- **Fields** on the settings document
  ([models/settings.js](../../../../models/settings.js)):
  `renderLinksAsPlainText`, `alwaysShowCodeAsText`, `disableAllImport`,
  `importMaxMegabytes`, `disableAllExport`, `disableImportAvatars`,
  `disableExportAvatars`, `anonymizeImportUsers`, `anonymizeExportUsers`. The
  pane is template `featuresSecurity` in
  [client/components/settings/adminProblems.jade](../../../../client/components/settings/adminProblems.jade),
  its handlers in [adminProblems.js](../../../../client/components/settings/adminProblems.js);
  only a site administrator may update the settings document
  ([server/permissions/settings.js](../../../../server/permissions/settings.js)).
- **Rich text**: the viewer in
  [client/components/main/editor.js](../../../../client/components/main/editor.js)
  strips links when `renderLinksAsPlainText` is on, and sets the Markdown
  package's `alwaysShowCodeAsText` flag
  ([packages/markdown/src/template-integration.js](../../../../packages/markdown/src/template-integration.js)).
- **Import and export**:
  [models/lib/importExportSecurity.js](../../../../models/lib/importExportSecurity.js)
  holds `assertImportEnabled()` (called by every import method, `cloneBoard`
  included, in [models/import.js](../../../../models/import.js) and the import
  routes), `assertExportEnabled()` and `refuseDisabledExport()` (every export
  method and HTTP route; an export asked for while export is disabled is
  recorded in Admin Panel / Problems as `authz.export-disabled`), and the
  anonymization helpers. The Blaze helpers `importDisabled` and
  `exportDisabled` in
  [client/config/blazeHelpers.js](../../../../client/config/blazeHelpers.js)
  hide the menu options.
- **Tests**: [tests/externalLinkAutolink.test.cjs](../../../../tests/externalLinkAutolink.test.cjs),
  [tests/crossBoardExportBleed.test.cjs](../../../../tests/crossBoardExportBleed.test.cjs),
  [tests/importUpload.test.cjs](../../../../tests/importUpload.test.cjs),
  [tests/userAnonymization.test.cjs](../../../../tests/userAnonymization.test.cjs)
  and [tests/scrumAnonymization.test.cjs](../../../../tests/scrumAnonymization.test.cjs).

## Related

- [Activities and notifications](Activities-and-Notifications.md)
- [Delete](Delete.md)
- [Admin Panel / Problems / Security Report](../Problems/README.md) - what the
  security log has recorded.

## Commits

 - [The pane moves from Problems to Settings](https://github.com/wekan/wekan/commit/e1a053d059191640a63a22ab553c0b0c6b833d8d)
 - [Largest import (MB), and uploads checked against the free disk space](https://github.com/wekan/wekan/commit/32c24ed84e9d6c8080e89bdd4097f87a3b0b4b04)
 - [Every export obeys Disable all export and Anonymize export users (CrossBoardExportBleed)](https://github.com/wekan/wekan/commit/be6727607ccd4019862db423d4d3a36cd7ce600f)
 - [Anonymization also covers Scrum text](https://github.com/wekan/wekan/commit/156dbf0ecdff60bd2c356d09963d41df6f437924)
 - [Tests and docs for the Security switches](https://github.com/wekan/wekan/commit/247522484cd05bc5d04acfb9463f8d8e7af25e44)
 - [Import and export privacy switches](https://github.com/wekan/wekan/commit/06fdede782231186fabcb97f606daaa3302a377b)
 - [Always show all code as plain text](https://github.com/wekan/wekan/commit/38ce4978870a5a3057eaa19acf42eb7bd69574e7)
 - [Render links as plain text](https://github.com/wekan/wekan/commit/f68c91d10204dd22922849923f09fee87a37bd86)
