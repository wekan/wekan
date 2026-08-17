# Design: the Admin Panel's URLs

Every left-menu entry of the Admin Panel has its own URL.

The panel used to be four addresses — `/setting`, `/people`, `/admin-reports`,
`/attachments` — each opening whichever pane its page happened to open first.
Which pane you were looking at was ReactiveVar state and nothing else, so a pane
could not be linked to a colleague, bookmarked, opened in a second tab or reached
with the back button; `/setting` always landed on Version even if you had just
been in Global Webhooks.

## The shape

```
/admin/<page>/<slug>     the pane
```

Slugs are **lowercase**, words separated by `-`, and say what the pane *is*.

**Under `/admin`.** The four pages sat at the top level — `/settings`,
`/people`, `/attachments` — as if they were pages of the app rather than of the
Admin Panel, and `/attachments` is also the path the file server serves
attachments from (`server/routes/universalFileServer.js`), so the panel and the
files were claiming one address. The prefix says which they are and keeps them
out of everyone else's way.

**Every pane is named, the default one included.** This used to leave the first
pane unnamed — `/settings` rather than `/settings/version` — so the address of
"Settings" and the address of "Settings showing Version" were the same string.
The address is meant to say where you are, and the first pane is somewhere too.
The bare `/admin/settings` still resolves; it *redirects* to
`/admin/settings/version` rather than being a second name for it.

## Settings — `/admin/settings`

| URL | Pane | Pane id |
| --- | --- | --- |
| `/admin/settings/version` | Version | `version-setting` |
| `/admin/settings/visibility` | Visibility | `tableVisibilityMode-setting` |
| `/admin/settings/announcement` | Announcement | `announcement-setting` |
| `/admin/settings/accessibility` | Accessibility | `accessibility-setting` |
| `/admin/settings/translation` | Translation | `translation-setting` |
| `/admin/settings/pwa` | PWA | `layout-setting` |
| `/admin/settings/global-webhooks` | Global Webhooks | `webhook-setting` |

## People — `/admin/people`

| URL | Pane | Pane id |
| --- | --- | --- |
| `/admin/people/people` | People | `people-setting` |
| `/admin/people/login` | Login | `registration-setting` |
| `/admin/people/email` | Email | `email-setting` |
| `/admin/people/domains` | Domains | `domains-setting` |
| `/admin/people/organizations` | Organizations | `org-setting` |
| `/admin/people/teams` | Teams | `team-setting` |
| `/admin/people/locked-users` | Locked Users | `locked-users-setting` |
| `/admin/people/roles` | Roles | `roles-setting` |
| `/admin/people/shared-templates` | Shared templates | `templates-setting` |

## Problems — `/admin/problems`

| URL | Pane | Pane id |
| --- | --- | --- |
| `/admin/problems/summary` | Summary | `report-summary` |
| `/admin/problems/security` | Security | `features-security` |
| `/admin/problems/delete` | Delete | `features-delete` |
| `/admin/problems/notifications` | Notifications | `features-notifications` |
| `/admin/problems/security-report` | Security Report | `report-security` |
| `/admin/problems/impersonation` | Impersonation Report | `report-impersonation` |
| `/admin/problems/performance` | Performance | `features-performance` |
| `/admin/problems/speed` | Speed | `report-speed` |
| `/admin/problems/tests` | Tests | `report-tests` |
| `/admin/problems/cpu` | CPU usage | `report-cpu` |
| `/admin/problems/broken-cards` | Broken Cards | `report-broken` |
| `/admin/problems/files` | Files Report | `report-files` |
| `/admin/problems/rules` | Rules Report | `report-rules` |
| `/admin/problems/boards` | Boards Report | `report-boards` |
| `/admin/problems/cards` | Cards Report | `report-cards` |
| `/admin/problems/recovery` | Recovery | `report-recovery` |
| `/admin/problems/office` | Offices | `report-office` |
| `/admin/problems/api` | API | `report-api` |
| `/admin/problems/database` | Database problems | `report-database` |
| `/admin/problems/integrity` | Filesystem integrity | `report-integrity` |

Two panes are called Security, and they are different things: the *settings*
pane and the *report*. `security` is the settings one, beside `notifications`
and `performance`; `security-report` is the report, beside `impersonation`.

## Attachments — `/admin/attachments`

| URL | Pane | Pane id |
| --- | --- | --- |
| `/admin/attachments/backup` | Backup | `backup` |
| `/admin/attachments/move` | Move Attachment | `move` |
| `/admin/attachments/default-save-storage` | Default Save Storage | `default-save-storage` |
| `/admin/attachments/limits` | Limits | `limits` |
| `/admin/attachments/gridfs` | MongoDB GridFS Storage | `gridfs` |
| `/admin/attachments/filesystem` | Filesystem Storage | `filesystem` |
| `/admin/attachments/s3` | S3/MinIO Storage | `s3` |
| `/admin/attachments/azure` | Azure Blob Storage | `azure` |
| `/admin/attachments/gcs` | Google Cloud Storage | `gcs` |
| `/admin/attachments/database-migration` | Database migration | `database-migration` |

## The slug is not derived from the pane id

The pane ids are internal and read like it — `tableVisibilityMode-setting`,
`layout-setting`, `report-cpu` — while a URL is something a person types, reads
and pastes into a chat. `/settings/tablevisibilitymode-setting` is not an
improvement on no URL at all.

So `models/lib/adminUrls.js` is an explicit **map**, not a rule, and a guard
checks it against the real menus in both directions: every slug names a pane the
page actually has, and every menu entry has a slug. Neither failure is visible
until somebody clicks that row — a slug naming nothing renders an empty panel,
and a pane with no slug simply cannot be linked.

This is also the lesson from `allBoardsMultiselectionSidebar`: a name derived
from another name is wrong the moment the two spellings differ, and it fails
silently.

## The title bar names the same three things

`Admin Panel / Settings / Version`. The address names the panel, the page and
the pane, and so does the title beside the house icon — "Admin Panel" alone
named the building and not the room.

The pane's words are the **menu row's own**, so the title and the row that
opened it always agree. They are a second copy of them: the header is a separate
Blaze instance from the Admin Panel's pages and must not import them — doing
that once ran a page module before its own template was registered, and the
throw aborted every module after it — so it reads the slug from the URL and
looks the title up in `ADMIN_PANE_TITLES`. Nothing but a guard keeps that copy
equal to the menu, and `tests/adminUrls.test.cjs` is it.

Two forms, the ones a menu entry already has: a translation key, or a literal
label for a name that is not translated (PWA is a product name).

## What happens on a bad slug

It falls back to the page's default pane. A URL is typed, and a typo must not
render an empty panel.

## Old URLs

| Old | Now |
| --- | --- |
| `/setting` | `/admin/settings/version` |
| `/information` | `/settings` — Version, which it used to be a page of |
| `/translation` | `/admin/settings/translation` |

They redirect with the `redirect` their trigger is handed, never with
`FlowRouter.go()` — a `go()` from inside `triggersEnter` runs while that route is
still entering and is swallowed, so nothing renders and the browser keeps
showing whatever page it was on.

They used to hand the pane over in a `Session` value the page consumed once.
Every pane has an address now, so they redirect to it: the pane ends up in the
URL, where it can be linked, bookmarked and gone back to.

## How a page opens the pane

The route resolves the slug and puts the **pane id** in a Session value —
`settingsOpenPane`, `peopleOpenPane`, `problemsOpenPane`, `attachmentsOpenPane`
— which the page reads in an `autorun`. It is reactive rather than a one-shot
read on purpose: following a link to another pane while the page is already open
runs the route action again *without* re-creating the template, so a one-shot
read would leave you on the pane you were already looking at.

Clicking a menu row does the same thing in reverse: it opens the pane and then
`FlowRouter.go`s to that pane's URL. `go`, not `replace`, so Back returns to the
previous pane instead of leaving the Admin Panel — and only when the path would
actually change, or every click becomes a navigation to where you already are.

Each page has **one** function that opens a pane by id
(`openSettingsPane`, `openPane`, `openReportPane`, `activeSection.set`), used by
both the URL and the click, so "which state is this pane" is answered once
instead of in two places that can disagree.

## Related files

| File Path | File Type | Description |
| --- | --- | --- |
| `models/lib/adminUrls.js` | `.js` module, pure | The slug ↔ pane map, the path builder, and the pane titles the header bar shows. No Meteor, so it is unit-testable. |
| `config/router.js` | `.js` routes | The four `/admin/<page>/:pane` routes and the old-URL redirects, built from the same map. |
| `client/components/settings/settingBody.js` | `.js` Blaze template logic | Settings: `openSettingsPane`, the URL autorun, the menu click. |
| `client/components/settings/peopleBody.js` | `.js` Blaze template logic | People: `openPane`, the URL autorun, the menu click. |
| `client/components/settings/adminProblems.js` | `.js` Blaze template logic | Problems: `openReportPane`, the URL autorun, the menu click. |
| `client/components/settings/attachments.js` | `.js` Blaze template logic | Attachments: `activeSection`, the URL autorun, the menu click. |
| `tests/adminUrls.test.cjs` | `.cjs` Node test | The map against the real menus, both directions; the fallback; the routes; and that a click updates the URL. |
| `tests/adminOldUrlRedirect.test.cjs` | `.cjs` Node test | That the old page URLs redirect to the pane they used to be. |

## Related

- [Left menu](Left-Menu.md) — the menu these URLs open
- [The Table page design](Table.md) — what most of these panes render
