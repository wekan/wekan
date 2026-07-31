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
/<page>            the page's default pane
/<page>/<slug>     that pane
```

Slugs are **lowercase**, words separated by `-`, and say what the pane *is*.

The **default pane keeps the bare page URL** — `/settings`, not
`/settings/version` — so there is one address for "the Settings page" rather
than two that show the same thing.

## Settings — `/settings`

The path is **plural**. `/setting` was the odd one out beside `/people`,
`/attachments` and `/admin-reports`; it still resolves, as a redirect.

| URL | Pane | Pane id |
| --- | --- | --- |
| `/settings` | Version | `version-setting` |
| `/settings/visibility` | Visibility | `tableVisibilityMode-setting` |
| `/settings/announcement` | Announcement | `announcement-setting` |
| `/settings/accessibility` | Accessibility | `accessibility-setting` |
| `/settings/translation` | Translation | `translation-setting` |
| `/settings/pwa` | PWA | `layout-setting` |
| `/settings/global-webhooks` | Global Webhooks | `webhook-setting` |

## People — `/people`

| URL | Pane | Pane id |
| --- | --- | --- |
| `/people` | People | `people-setting` |
| `/people/login` | Login | `registration-setting` |
| `/people/email` | Email | `email-setting` |
| `/people/domains` | Domains | `domains-setting` |
| `/people/organizations` | Organizations | `org-setting` |
| `/people/teams` | Teams | `team-setting` |
| `/people/locked-users` | Locked Users | `locked-users-setting` |
| `/people/roles` | Roles | `roles-setting` |
| `/people/shared-templates` | Shared templates | `templates-setting` |

## Problems — `/admin-reports`

| URL | Pane | Pane id |
| --- | --- | --- |
| `/admin-reports` | Summary | `report-summary` |
| `/admin-reports/security` | Security | `features-security` |
| `/admin-reports/notifications` | Notifications | `features-notifications` |
| `/admin-reports/security-report` | Security Report | `report-security` |
| `/admin-reports/impersonation` | Impersonation Report | `report-impersonation` |
| `/admin-reports/performance` | Performance | `features-performance` |
| `/admin-reports/speed` | Speed | `report-speed` |
| `/admin-reports/tests` | Tests | `report-tests` |
| `/admin-reports/cpu` | CPU usage | `report-cpu` |
| `/admin-reports/broken-cards` | Broken Cards | `report-broken` |
| `/admin-reports/files` | Files Report | `report-files` |
| `/admin-reports/rules` | Rules Report | `report-rules` |
| `/admin-reports/boards` | Boards Report | `report-boards` |
| `/admin-reports/cards` | Cards Report | `report-cards` |
| `/admin-reports/recovery` | Recovery | `report-recovery` |
| `/admin-reports/database` | Database problems | `report-database` |

Two panes are called Security, and they are different things: the *settings*
pane and the *report*. `security` is the settings one, beside `notifications`
and `performance`; `security-report` is the report, beside `impersonation`.

## Attachments — `/attachments`

| URL | Pane | Pane id |
| --- | --- | --- |
| `/attachments` | Backup | `backup` |
| `/attachments/move` | Move Attachment | `move` |
| `/attachments/default-save-storage` | Default Save Storage | `default-save-storage` |
| `/attachments/limits` | Limits | `limits` |
| `/attachments/gridfs` | MongoDB GridFS Storage | `gridfs` |
| `/attachments/filesystem` | Filesystem Storage | `filesystem` |
| `/attachments/s3` | S3/MinIO Storage | `s3` |
| `/attachments/azure` | Azure Blob Storage | `azure` |
| `/attachments/gcs` | Google Cloud Storage | `gcs` |
| `/attachments/database-migration` | Database migration | `database-migration` |

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

## What happens on a bad slug

It falls back to the page's default pane. A URL is typed, and a typo must not
render an empty panel.

## Old URLs

| Old | Now |
| --- | --- |
| `/setting` | `/settings` |
| `/information` | `/settings` — Version, which it used to be a page of |
| `/translation` | `/settings/translation` |

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
| `models/lib/adminUrls.js` | `.js` module, pure | The slug ↔ pane map, and the path builder. No Meteor, so it is unit-testable. |
| `config/router.js` | `.js` routes | The four `/<page>/:pane?` routes and the old-URL redirects. |
| `client/components/settings/settingBody.js` | `.js` Blaze template logic | Settings: `openSettingsPane`, the URL autorun, the menu click. |
| `client/components/settings/peopleBody.js` | `.js` Blaze template logic | People: `openPane`, the URL autorun, the menu click. |
| `client/components/settings/adminReports.js` | `.js` Blaze template logic | Problems: `openReportPane`, the URL autorun, the menu click. |
| `client/components/settings/attachments.js` | `.js` Blaze template logic | Attachments: `activeSection`, the URL autorun, the menu click. |
| `tests/adminUrls.test.cjs` | `.cjs` Node test | The map against the real menus, both directions; the fallback; the routes; and that a click updates the URL. |
| `tests/adminOldUrlRedirect.test.cjs` | `.cjs` Node test | That the old page URLs redirect to the pane they used to be. |

## Related

- [Left menu](Left-Menu.md) — the menu these URLs open
- [The Table page design](Table.md) — what most of these panes render
