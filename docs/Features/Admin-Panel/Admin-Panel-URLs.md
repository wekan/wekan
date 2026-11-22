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
| `/admin/settings/appearance` | Appearance | `tableVisibilityMode-setting` |
| `/admin/settings/features` | Features | `features-setting` |
| `/admin/settings/feature-profiles` | Feature profiles | `feature-profiles-setting` |
| `/admin/settings/security` | Security | `privacy-security-setting` |
| `/admin/settings/activities` | Activities and notifications | `activities-setting` |
| `/admin/settings/delete` | Delete | `delete-setting` |
| `/admin/settings/announcement` | Announcement | `announcement-setting` |
| `/admin/settings/accessibility` | Accessibility | `accessibility-setting` |
| `/admin/settings/translation` | Translation | `translation-setting` |
| `/admin/settings/pwa` | PWA | `layout-setting` |
| `/admin/settings/global-webhooks` | Global Webhooks | `webhook-setting` |
| `/admin/settings/labels` | Shared labels | `shared-labels-setting` |

## People — `/admin/people`

Opening People selects Email by default. Below Shared templates, Login, LDAP,
OAuth providers and Passwordless login each have their own menu entry.

| URL | Pane | Pane id |
| --- | --- | --- |
| `/admin/people/people` | People | `people-setting` |
| `/admin/people/email` | Email | `email-setting` |
| `/admin/people/notifications` | Notifications | `notify-setting` |
| `/admin/people/domains` | Domains | `domains-setting` |
| `/admin/people/organizations` | Organizations | `org-setting` |
| `/admin/people/teams` | Teams | `team-setting` |
| `/admin/people/locked-users` | Locked Users | `locked-users-setting` |
| `/admin/people/audit-log` | Audit log | `audit-log-setting` |
| `/admin/people/roles` | Roles | `roles-setting` |
| `/admin/people/shared-templates` | Shared templates | `templates-setting` |
| `/admin/people/login` | Login | `registration-setting` |
| `/admin/people/saml` | SAML | `saml-setting` |
| `/admin/people/ldap` | LDAP | `ldap-setting` |
| `/admin/people/oidc` | OAuth2 | `oidc-setting` |
| `/admin/people/cas` | CAS | `cas-setting` |
| `/admin/people/header-login` | Header login | `header-login-setting` |
| `/admin/people/oauth` | OAuth providers | `oauth-setting` |
| `/admin/people/passwordless` | Passwordless login | `passwordless-setting` |

## Problems — `/admin/problems`

| URL | Pane | Pane id |
| --- | --- | --- |
| `/admin/problems/summary` | Summary | `report-summary` |
| `/admin/problems/backup` | Backup (status and history; settings stay in Attachments / Backup) | `features-backup` |
| `/admin/problems/security-report` | Security Report | `report-security` |
| `/admin/problems/impersonation` | Impersonation Report | `report-impersonation` |
| `/admin/problems/password-length` | Password length | `report-password-length` |
| `/admin/problems/performance` | Performance | `features-performance` |
| `/admin/problems/speed` | Speed | `report-speed` |
| `/admin/problems/tests` | Tests | `report-tests` |
| `/admin/problems/cpu` | CPU usage | `report-cpu` |
| `/admin/problems/ram` | Memory usage | `report-ram` |
| `/admin/problems/disk` | Disk usage | `report-disk` |
| `/admin/problems/instrumentation` | Instrumentation | `report-instrumentation` |
| `/admin/problems/broken-cards` | Broken Cards | `report-broken` |
| `/admin/problems/files` | Files Report | `report-files` |
| `/admin/problems/rules` | Rules Report | `report-rules` |
| `/admin/problems/webhooks` | All webhooks | `report-webhooks` |
| `/admin/problems/boards` | Boards Report | `report-boards` |
| `/admin/problems/cards` | Cards Report | `report-cards` |
| `/admin/problems/recovery` | Recovery | `report-recovery` |
| `/admin/problems/office` | Offices | `report-office` |
| `/admin/problems/api` | API | `report-api` |
| `/admin/problems/database` | Database problems | `report-database` |
| `/admin/problems/integrity` | Filesystem integrity | `report-integrity` |
| `/admin/problems/mail` | Email | `report-mail` |

Two panes are called Security, and they are different things: the *settings*
pane and the *report*. `security` is the settings one, in Settings beside
`activities` and `delete`; `security-report` is the report, in Problems beside
`impersonation`.

## Attachments — `/admin/attachments`

| URL | Pane | Pane id |
| --- | --- | --- |
| `/admin/attachments/backup` | Backup | `backup` |
| `/admin/attachments/continuous-backup` | Continuous backup | `continuous-backup` |
| `/admin/attachments/move` | Move Attachment | `move` |
| `/admin/attachments/default-save-storage` | Default Save Storage | `default-save-storage` |
| `/admin/attachments/limits` | Limits | `limits` |
| `/admin/attachments/retention` | Retention: delete old attachments, purge deleted ones (#6789) | `retention` |
| `/admin/attachments/gridfs` | MongoDB GridFS Storage | `gridfs` |
| `/admin/attachments/filesystem` | Filesystem Storage | `filesystem` |
| `/admin/attachments/s3` | S3/MinIO Storage | `s3` |
| `/admin/attachments/azure` | Azure Blob Storage | `azure` |
| `/admin/attachments/gcs` | Google Cloud Storage | `gcs` |
| `/admin/attachments/webdav` | WebDAV (Nextcloud Files) | `webdav` |
| `/admin/attachments/database-migration` | Database migration | `database-migration` |

## Cloud — `/admin/cloud`

Only where the server has the `CLOUD` environment variable, at that address,
for its Cloud Admins ([Cloud Panel](Cloud-Panel.md)). It is not one of the four
pages of `models/lib/adminUrls.js`: its route, `cloud-admin`, is in
`config/router.js`, and the tab shows only when the server says this user is a
Cloud Admin here. A bare `/admin/cloud` opens Domains; `/cloud` is the same
page for customers.

| URL | Pane |
| --- | --- |
| `/admin/cloud/domains` | Domains |
| `/admin/cloud/invoices` | Invoices |
| `/admin/cloud/tickets` | Tickets |
| `/admin/cloud/chat` | Chat |
| `/admin/cloud/cloudflare` | Cloudflare |
| `/admin/cloud/caddy` | Caddy |
| `/admin/cloud/allowed-addresses` | Allowed addresses |

The People pane `/admin/people/cloud` that set the Cloud Panel's domain from
the browser is gone: the domain is the `CLOUD` environment variable.

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
| `/information` | `/admin/settings/version` — Version, which it used to be a page of |
| `/translation` | `/admin/settings/translation` |
| `/settings`, `/people`, `/admin-reports`, `/attachments` | the tab's default pane, e.g. `/admin/settings/version` |
| `/settings/<slug>` and the same for the other three | `/admin/settings/<slug>`, or the default pane when the slug is unknown |

They redirect with the `redirect` their trigger is handed, never with
`FlowRouter.go()` — a `go()` from inside `triggersEnter` runs while that route is
still entering and is swallowed, so nothing renders and the browser keeps
showing whatever page it was on.

They used to hand the pane over in a `Session` value the page consumed once.
Every pane has an address now, so they redirect to it: the pane ends up in the
URL, where it can be linked, bookmarked and gone back to.

### Panes that moved

A pane that moved keeps its old address as a redirect, decided by `MOVED_PANES`
in `models/lib/adminUrls.js` (`movedPanePath`) and applied by the routes before
anything renders - both on the new form and on the old two-segment form:

| Old URL | Redirects to | Since |
| --- | --- | --- |
| `/admin/settings/visibility` | `/admin/settings/appearance` | 2026-11-19 |
| `/admin/problems/security` | `/admin/settings/security` | 2026-11-19 |
| `/admin/problems/delete` | `/admin/settings/delete` | 2026-11-19 |
| `/admin/problems/notifications` | `/admin/settings/activities` | 2026-11-19 |

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

- [Left menu](../All-Boards/Left-Menu.md) — the menu these URLs open
- [The Table page design](../General/Table.md) — what most of these panes render

## Commits

 - [Admin Panel: one question per tab, and the moved panes keep their old addresses as redirects](https://github.com/wekan/wekan/commit/e1a053d059191640a63a22ab553c0b0c6b833d8d)
 - [Password length gets its own URL and title](https://github.com/wekan/wekan/commit/85af731c1bdf33ba3131134c3926fbf5f353c476)
 - [Audit log gets its own URL and title](https://github.com/wekan/wekan/commit/2017f2871feda219172d446f257994ecac03babd)
 - [Backup status gets a Problems pane and URL](https://github.com/wekan/wekan/commit/06b7ce994ad193357a20fc6a036060ea04c83947)
 - [Attachments / Retention gets its URL](https://github.com/wekan/wekan/commit/dcf91e4471814d765c148d1402865089f6e3ad21)
 - [Memory usage and Disk usage get their URLs](https://github.com/wekan/wekan/commit/b6a3d98736ebf58ef3905613e303d091ef89f65a)
 - [WebDAV storage gets its URL](https://github.com/wekan/wekan/commit/42340817523e2e62cc55cbd31982bc2eada1a858)
 - [Shared labels get their URL](https://github.com/wekan/wekan/commit/7595727917d436ea71969d6d74d166b42b38ed4e)
 - [Problems / Email gets its URL](https://github.com/wekan/wekan/commit/79ac3016751a4633f9efb1eda2102dcb798378b4)
 - [OAuth2, CAS and Header login panes get their URLs](https://github.com/wekan/wekan/commit/eb49a4b1b6853650823434e924f5d0dc47a4fe5b)
 - [Continuous backup gets its URL](https://github.com/wekan/wekan/commit/6b9bc496b1b56a54b40f5403341272c33770561a)
 - [SAML gets its pane and URL](https://github.com/wekan/wekan/commit/05f1f0a032110dcdd06a355f6ffcc7135cc489e4)
 - [People login settings split into menu entries, Email the default pane](https://github.com/wekan/wekan/commit/ecdae60a8a9d0b069839193c45d6e5c8ee8a9f5d)
 - [Instrumentation gets its URL](https://github.com/wekan/wekan/commit/23ed8d927fa0ad110b341dc346a4ea11937a2047)
 - [People / Notifications gets a URL of its own](https://github.com/wekan/wekan/commit/e15f53135240cebb6e9aec8268c326aeab922afa)
 - [The API report gets its URL](https://github.com/wekan/wekan/commit/6dc2651b48005f26f769feebfffc751d3022bf50)
 - [The Offices report gets its URL](https://github.com/wekan/wekan/commit/961ff6cb47437c2eaff2ea4354caf64b676ef8af)
 - [Problems: the route and the template say what the menu says](https://github.com/wekan/wekan/commit/fa289e4a4de8d4411cfbbd984bae4b184d1eb3c7)
 - [Filesystem integrity gets its URL](https://github.com/wekan/wekan/commit/2cc0d42ddfaa72dcd04ef59abc541503c7703352)
 - [The Admin Panel moves under /admin, and the title bar names the pane](https://github.com/wekan/wekan/commit/03cb79bdd71b1e20f4b971267d7ca73420ff33ca)
 - [A URL for every left-menu entry](https://github.com/wekan/wekan/commit/841479774e12c34337712ef26d2b808b49dc4bfc)
 - [/information and /translation redirect instead of showing the page you came from](https://github.com/wekan/wekan/commit/9f82877492ee735c78607d4370f985bc5264c8b0)
