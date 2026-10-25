# WeKan ® 2026-10 releases, part 2

Moved out of [CHANGELOG.md](../../CHANGELOG.md) to keep that
file small enough to open (wekan/wekan#6580). Nothing here has been changed:
a release section is a record, and it reads the same as it did there.

This is part 2 of 6, newest first: [1](10.md), 2, [3](10-part3.md), [4](10-part4.md), [5](10-part5.md), [6](10-part6.md).

Releases per day:

| 2026-10 | Releases |
| --- | --- |
| 08 | 2 |

# v12.24 2026-10-08 WeKan ® release

**In short:** The login settings left open in October are finished:
**header login** is environment-only, **automatic logout** works again,
**LDAP** gets an honest Test connection and Sync now, and **secrets from
files** cover database, mail and S3. Boards import and export as **Todoist**,
**OPML** and **Org mode**, **rules** can set assignees, **webhooks** name the
people they are about, and **OAuth providers** can be limited to email
domains. **Scrum** planning syncs from Jira and GitLab and imports into an
existing board, and an **interrupted import** can be kept or discarded.
Seventeen long-open requests were closed as already implemented.

This release adds the following new features:

**Import and export** - three more formats, each a round trip with a loss
report for what the other tool has no place for.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ee0806b4c0">Translate Manx release and stuck Sync recovery messages</a>. Thanks to xet7.</summary>

- Translate 25 pending messages, preserving release selection, applied/total
  counters, discard consequences and oldest-first limits. Manx now has no
  reported placeholders; older language defects still require review.
- Three relevant suites pass. Complete wording remains low-confidence pending
  fluent review. Browser and screen-reader sessions were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8378a4c706">Translate remaining reported Manx controls and guidance</a>. Thanks to xet7.</summary>

- Translate 47 messages, preserving import syntax, environment names, report
  limits and named variables. The ordinary Manx backlog is cleared; 25 newly
  added pending messages and older language quality remain under review.
- Four relevant suites pass. Complete grammar remains low-confidence pending
  fluent review. Browser and screen-reader sessions were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/30013762c3">Translate Manx Sync conflicts and diagnostic reports</a>. Thanks to xet7.</summary>

- Translate 63 messages while preserving source/local distinctions, missing/null
  behavior, retention limits and reports that cannot resume or undo changes.
- Three relevant suites pass. Sync terminology and full grammar remain
  low-confidence pending fluent review. Browser and screen-reader sessions
  were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0691f5589d">Translate Manx notification delivery and recovery messages</a>. Thanks to xet7.</summary>

- Translate 36 messages while preserving temporary/permanent rejection,
  missing/changed activities, pause/cancel distinctions and non-recall warnings.
- Three relevant suites pass. Delivery terminology and full grammar remain
  low-confidence pending fluent review. Browser and screen-reader sessions
  were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e54ad20004">Translate Manx Scrum planning labels and states</a>. Thanks to xet7.</summary>

- Translate 71 planning, estimate, event, state and report labels/messages.
  Preserve named variables, time units and distinct completion/cancellation
  states. Extend the Manx suite to use the shared placeholder scanner.
- Three relevant suites pass. Scrum terminology and grammar remain
  low-confidence
  pending fluent review. Browser and screen-reader sessions were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c1d3de6691">Restore Asana and OpenProject import literals</a>. Thanks to xet7.</summary>

- Repair 16 messages in 11 locale files, restoring the data property and API
  endpoints. Extend catalog-wide literal checks to ten import formats while
  accepting valid grammatical affixes around filenames and commands.
- Three relevant suites and 21 human-preference checks pass. Mixed-language
  prose and untranslated messages remain under review. Browser sessions were
  not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/416aedc706">Restore import example identifiers across locales</a>. Thanks to xet7.</summary>

- Repair 73 Kanboard, Deck, ZenKit and Jira import messages in 25 locale files.
  Restore case-sensitive field names and API paths, preserving surrounding
  prose and valid quotation styles. Test these literals across every locale.
- All 322 translation/i18n suites pass, including positive and negative checks
  for localized typography and damaged identifiers. Other import formats and
  mixed-language prose remain under review. Browser sessions were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e33df4be4c">Repair Bislama import instructions and literal examples</a>. Thanks to xet7.</summary>

- Correct 13 mixed-language import instructions and translate OPML and Org mode
  help. Restore JSON field names and the Jira endpoint while preserving format
  syntax, menu actions and interpolation variables.
- Three relevant suites pass. A broader literal scan found 103 candidate entries
  in 45 locale files; some are valid quotation variants, others need repair.
  Full prose remains provisional; browser sessions were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3c082ec6e5">Replace remaining Bislama artificial English wrappers</a>. Thanks to xet7.</summary>

- Correct 236 storage, migration, backup and report values. Preserve provider
  identifiers, time units, simulation limits, uncertainty and counting rules.
  The explicit “Tok blong sistem:” queue is empty; other mixed-language text
  and damaged technical examples still require review.
- Three relevant suites pass, including the catalog-wide token inventory.
  Statistical terminology and complete technical prose remain low-confidence.
  Browser and screen-reader sessions were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d332e18edb">Correct Bislama search syntax and report translations</a>. Thanks to xet7.</summary>

- Correct 76 artificial English wrappers and 12 search labels/messages.
  Use valid one-word query operators, preserve portable abbreviations and
  verify quoted values, missing fields and invalid input with the real parser.
  The remaining wrapper queue contains 236 values.
- Four relevant suites pass, including catalog-wide placeholders and parser
  execution. Technical compounds remain provisional pending fluent review.
  Browser and screen-reader sessions were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1eabb367e7">Boards import and export as Todoist project templates (CSV)</a>. Thanks to xet7.</summary>

Sections become lists, tasks cards, indented sub-tasks a checklist and notes
comments. `@label` words and priorities p1-p3 become labels, RESPONSIBLE the
owner, and DATE and DEADLINE the start and due dates. Recurring dates in
words, durations and orphan rows are reported. Export writes Todoist's own
columns and `view_style=board` row. `tests/todoistCsv.test.cjs` covers quoted
fields, the round trip and the negatives; a Playwright case imports through
the page.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e6c8f85518">Boards import and export as OPML outlines from Workflowy, Dynalist, Logseq and others</a>. Thanks to xet7.</summary>

Top-level outlines become lists, their children cards with `_note` as the
description, and deeper outlines checklists; a completed item is marked done.
Like the Leo outline the XML is parsed on the server only, never resolving
DTDs or external entities. `tests/opmlOutline.test.cjs` includes an external
entity and a node bomb among its negatives; a Playwright case imports through
the page.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/711303af32">Boards import and export as Org mode outlines</a>. Thanks to xet7.</summary>

Level-1 headings become lists and level-2 headings cards, keeping TODO
keywords (including custom `#+TODO` ones), priorities, tags, SCHEDULED,
DEADLINE and CLOSED, and turning checkboxes and deeper headings into
checklists. Timestamps have no zone in Org and are read as UTC; repeaters are
reported. `tests/orgMode.test.cjs` covers custom keywords, localized day names
and the round trip; a Playwright case imports through the page.

</details>

**Rules** - the two parts of making rules less clunky that were still open.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f735eba194">A rule can set and clear assignees, and needs no title</a>. Thanks to xeruf and xet7.</summary>

Add and Remove assignee actions take a username, a `{creator}` style token,
the user who triggered the rule, or every assignee, and are durable through
Sync like the member actions - so a new card can be assigned to its creator,
as [#4294](https://github.com/wekan/wekan/issues/4294) asked. A rule added
without a title is named after its trigger and action and renamed in place.
This also fixed "Remove all members from the card", which iterated the
assignees while removing members, so it removed only people who were both;
its guards now read `models/cards.js` instead of assuming the field. A
Playwright case creates an untitled rule and a card that gets its creator as
assignee.

</details>

- [A rule can fire when a card moves forward to a later list or back to an earlier one](https://github.com/wekan/wekan/commit/eac524380f). Thanks to rlach and xet7.

**Scrum** - planning a card across releases, and bringing planning in from
elsewhere.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/958e9e13f3">GitLab, OpenProject and Asana imports bring their sprints and releases</a>. Thanks to xet7.</summary>

Only Jira imports created Scrum planning. GitLab iterations and milestones,
OpenProject versions and sprints, and Asana milestone tasks now become sprints
and releases with their dates and state, through the same journaled stage as
Jira, so an interrupted import is recovered the same way; OpenProject story
points become the estimate field. Trello has none, and its Power-Up data is
counted in the loss report. What an export cannot prove - a finished sprint,
a bad date, an unknown state - is reported, never invented. GitLab and
OpenProject exports write the planning back.
`tests/externalScrumPlanning.test.cjs`
covers each source and the negatives.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/727ceedd01">A card can be in more than one release</a>. Thanks to xet7.</summary>

A card had one release, so Jira import kept only an issue's first fix version
and Jira export wrote none. Releases are now a list, with the old single
field kept as its first entry so older readers still see one; existing cards
are read the same way and move to the list on their next Scrum save. Every
release must belong to the board. Copies and moves link each release by name,
the native transfer and Jira import and export carry them all, Board View /
Sprints shows each release's cards and progress, and the Product Backlog and
card details pick several. `tests/scrumMultipleReleases.test.cjs` fails if any
code reads the single field directly.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c06bf8d0e9">List Sync brings an issue's sprint and releases into Scrum planning</a>. Thanks to xet7.</summary>

While Scrum is enabled on the board, List Sync from Jira or GitLab carries an
issue's sprint and fix versions or milestones into the card's planning. A
missing sprint or release is created with the source's dates; an existing one
is matched by its source ID, then by name. A local planning change stays until
the source changes that issue's planning, and a first Sync never removes
planning. The writes go through the durable Sync journal.
`tests/listSyncPlanning.test.cjs` covers matching, creation and the
negatives; a Meteor test and a Playwright spec drive it end to end. It has not
been verified against live Jira or GitLab.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ef54907836">Scrum planning can be imported into a board that already exists</a>. Thanks to xet7.</summary>

Every Scrum import created a new board. A board administrator can now import
a wekan-scrum-2 transfer or a WeKan board export into the current board from
the Sprints view, with a Preview that writes nothing. Sprints and releases are
matched by ID, then provenance, then a name unique on both sides, and the rest
are created once, so a second import of the same file changes nothing. Cards
are only matched, never created; unmatched, ambiguous and other boards' cards
are reported. The writes use the journaled Scrum import stage and are one
Scrum History change. `tests/scrumTransferMerge.test.cjs` covers it.

</details>

**Sync and recovery** - what an administrator can do about a stuck Sync.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e8fac5e85c">An interrupted board import can be kept or discarded in Recovery</a>. Thanks to xet7.</summary>

An import that stopped halfway left a partial board nothing recorded. Every
board import, copy, Trello zip and Trello API import now records its run,
with the new board's id, before the first write, and the board carries the
run's id. A heartbeat keeps the run alive; a scan flags a stopped or failed
run once in Admin Panel → Problems → Recovery, where an administrator keeps
the partial board or discards it. Discard removes only the board stamped with
that run, through the board's own removal, and is refused while its Scrum
stage is busy. Resume is deliberately not offered, because the source file is
not kept: import it again. `tests/importRuns.test.cjs` covers both decisions
and the refusals.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cb69750b17">A List Sync operation that can never be replayed can be discarded in Recovery</a>. Thanks to xet7.</summary>

When a list was removed, recreated or reconfigured, or its actor lost write
access, its saved Sync operation failed every minute with a console line and
blocked that list's Sync. It is now marked once in Admin Panel → Problems →
Recovery, a blocked manual Sync says why, and an administrator can discard it
while the replay checks still fail. The discard holds the list's Sync lease,
records one decision and writes no card; a retry or a second administrator
only finishes it. `tests/listSyncStuck.test.cjs` covers the refusals and a
second discard; a Playwright case drives the Recovery page.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9ad9813c09">A Scrum undo or redo stuck on a conflict can be rolled back or discarded</a>. Thanks to xet7.</summary>

Such a checkpoint blocked every Scrum edit on its board for good, as only its
author could retry it and every retry failed the same way. A board
administrator now sees it in the History recovery notice and can roll it
back, when nobody changed its records since, or keep the board as it is;
either way is recorded in Recovery, a repeat is a no-op, and
`releases/recover-scrum-history.cjs` does the same offline. A checkpoint not
stuck on a conflict stays its author's to retry.

</details>

**Custom fields** - who may change a field's value.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/87ae8895c3">A custom field can be read-only: every member sees it, only board admins set it</a>. Thanks to CarloRampini and xet7.</summary>

For a score or a value computed elsewhere
([#3143](https://github.com/wekan/wekan/issues/3143)). The card offers editing
only to board admins, and the server refuses anybody else through the same
write guard as admin-only fields, so the REST API and rules acting as an admin
still set it.

</details>

**Webhooks** - what an outgoing webhook says about an event.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5f413c12eb">An outgoing webhook names the list, board, swimlane, card link and the person assigned</a>. Thanks to chrisi51 and xet7.</summary>

The payload carried mostly ids, and for an assignment it said who assigned
but not who was assigned. The default payload now also has `list`, `board`,
`swimlane` and `url`, `member` and `memberUsername` for joining or leaving a
card, and `assignee`, `assigneeUsername` and `assigneeId` for an assignment
([#3297](https://github.com/wekan/wekan/issues/3297)), so a chat integration
can message that person. `WEBHOOKS_ATTRIBUTES` still replaces the list.

</details>

**People and lists** - two small requests that only needed doing.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b426f9cfa8">A user without an avatar can be shown one from DEFAULT_AVATAR_URL</a>. Thanks to jLouzado and xet7.</summary>

An environment-only URL template - an intranet photo server or a
Gravatar-style service - with `{username}`, `{userId}`, `{emailMd5}` or
`{emailSha256}` replaced ([#824](https://github.com/wekan/wekan/issues/824)).
The browser is redirected there; the server fetches nothing. An uploaded
avatar always wins, and the initials come back when the image does not load.

</details>

- [Accounts created by an OAuth2/OIDC login can join a default organization, OAUTH2_DEFAULT_ORGANIZATION](https://github.com/wekan/wekan/commit/dfcd115ff3). Thanks to vasyugan and xet7.
- [A card moved or copied to another board brings its labels, created there when the mover is that board's admin](https://github.com/wekan/wekan/commit/125e0960eb). Thanks to d3dbit and xet7.
- [A board view chosen on a board stays on that board instead of changing every board](https://github.com/wekan/wekan/commit/80fb317fda). Thanks to DimDz, Meeques and xet7.
- [A list can colour the cards that have no colour of their own, so cards change colour as they move](https://github.com/wekan/wekan/commit/998a9cc336). Thanks to C0rn3j and xet7.
- [Each board can have an announcement of its own, shown to its members until dismissed](https://github.com/wekan/wekan/commit/7ccd987eb1). Thanks to TiibCD and xet7.
- [References like [TK:1223] link to other tools through rules with {identifier} and abbreviations](https://github.com/wekan/wekan/commit/ed993fef84). Thanks to rzoss and xet7.
- [Lists can be archived and restored through the REST API](https://github.com/wekan/wekan/commit/0a80496acf). Thanks to stevekiss and xet7.

and hardens the login settings:

**Admin Panel / People** - the login settings the 2026-10-05 work left open,
each now doing what its name says.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a7628504f1">Header login is set by the environment only, and shown read-only in the Admin Panel</a>. Thanks to xet7.</summary>

With `HEADER_LOGIN_ID` and `HEADER_LOGIN_TRUSTED_IPS` set, a proxy at a
trusted address signs in as anyone it names. Since the 2026-10-05 Admin Panel
work a site administrator could switch that on from People / Header login, so
a stolen administrator session was enough to open every account. The six
`HEADER_LOGIN_*` settings now come from the environment only: a value stored
in the Admin Panel by an earlier version is ignored, the pane shows the values
in effect read-only with no Save button, and a save sent by hand is refused
and shown in Admin Panel → Problems as ProxyBleed. Every other login section
stays overridable. `tests/authConfigCatalog.test.cjs` pins the resolution, the
refusal and that only this section is environment-only; the Playwright spec
`admin-login-env-overrides` drives the read-only pane and the refused save.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9d27f4be4d">LDAP Test connection without a service account searches the base DN before saying success</a>. Thanks to xet7.</summary>

ldapts opens its socket lazily, and Test connection bound only when
`LDAP_AUTHENTIFICATION` was set, so without a service account no operation
ran and it reported success even for a host that does not resolve. It now
does an anonymous base-scope search of `LDAP_BASEDN`, reading no attributes,
and shows the directory's own error when that fails; without a base DN it says
nothing could be tested. `tests/ldapTestConnectionProbe.test.cjs` pins the
decision and runs the search with the shipped ldapts against a port where
nothing listens. A login against a real directory was not run here.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/95147fc999">LDAP has a Sync now button that runs the background sync once</a>. Thanks to xet7.</summary>

`ldap_sync_now` was never loaded, so no button could call it, and it imported
every directory user regardless of the sync settings. It now runs the
background sync once with `LDAP_BACKGROUND_SYNC_IMPORT_NEW_USERS` and
`LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED` as they are set, for an
active site administrator only, and shares one run at a time with the
scheduled job. `tests/ldapSyncNow.test.cjs` pins it and fails when any other
wekan-ldap methods file is left unloaded; the Playwright spec
`admin-login-env-overrides` drives the button. A sync against a real directory
was not run here.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c1d1a04790">Automatic logout with LOGOUT_WITH_TIMER and the LOGOUT_* settings works again</a>. Thanks to xet7.</summary>

The platforms offered `LOGOUT_WITH_TIMER`, `LOGOUT_IN`, `LOGOUT_ON_HOURS` and
`LOGOUT_ON_MINUTES` since 2018, but the code that read them went with the job
queue it ran on. A login now ends `LOGOUT_IN` days after it was made, or at
`LOGOUT_ON_HOURS`:`LOGOUT_ON_MINUTES` server time; once a minute the server
removes the expired login tokens in one query and the browsers using them are
signed out. All four are overridable in Admin Panel / People / Login. An
unusable combination signs nobody out and the log says why.
`tests/logoutTimer.test.cjs` checks the one-query cutoff against each login's
deadline over two years of logins in three time zones; the Playwright spec
`admin-login-env-overrides` drives it from the Admin Panel.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/71cd2aed05">MONGO_URL_FILE, MAIL_URL_FILE and S3_SECRET_KEY_FILE replace three secret files nothing read</a>. Thanks to xet7.</summary>

`MAIL_SERVICE_PASSWORD_FILE`, `MONGO_PASSWORD_FILE` and `S3_SECRET_FILE` were
offered on every platform and read by nothing ([#5724](https://github.com/wekan/wekan/issues/5724)).
`MONGO_URL_FILE` holds the whole database URL and is read by the Docker
entrypoint, the snap and both start scripts, because Meteor connects before
WeKan's code runs; an unreadable file stops the start rather than falling back
to a default database, and the snap log no longer prints a password written
in `MONGO_URL`. `MAIL_URL_FILE` and `S3_SECRET_KEY_FILE` are read by the
server at start. The dead names are gone from every platform, and a warning
names the replacement when one is still set. `tests/envSecretFiles.test.cjs`
runs the entrypoint's block for real and fails if any platform offers a
retired name again.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fe60911408">OAuth login providers can be restricted to email domains</a>. Thanks to jakubgs and xet7.</summary>

Google, GitHub and the other Meteor login providers let anyone with an
account there sign in ([#1904](https://github.com/wekan/wekan/issues/1904)).
`OAUTH_PROVIDERS_ALLOWED_EMAIL_DOMAINS`, or its field under Admin Panel /
People / OAuth login providers, restricts them with the same rule as
`OAUTH2_ALLOWED_EMAIL_DOMAINS`, before an account is created and on every
later login. A provider that sends no email is refused while it is set.

</details>

and fixes the following bugs:

**Addresses** - which address WeKan's links and sign-in use when ROOT_URL is
not the one people opened.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0f2e81e01b">Copied links use the address WeKan was opened at, not the snap's 127.0.0.1</a>. Thanks to n8willis and xet7.</summary>

The snap's default ROOT_URL is 127.0.0.1, and every link built in the browser
- Copy link of a card, list or swimlane, comment permalinks - read it, so a
browser that opened WeKan by the machine's name copied a link nobody else
could follow. When ROOT_URL is loopback and the page is not, the browser now
builds those links from the page's own address, keeping ROOT_URL's path. A
real ROOT_URL still wins, and emails keep ROOT_URL: `snap set wekan
root-url=...` is still the setting for them. `tests/browserRootUrl.test.cjs`
covers both directions.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4fc4f19f02">The sign-in page says why a Google login keeps returning to it</a>. Thanks to xet7.</summary>

Signing in with Google returned to the sign-in page every time, with no
error, when WeKan was opened at another address than ROOT_URL: the provider
returns to ROOT_URL, and the login secret is left in that address's browser
storage, where the sign-in page cannot read it. The provider accepts only its
registered address, so the page cannot repair this; when a provider login is
offered at another address, it now names both and says what to change.
`tests/loginOriginMismatch.test.cjs` covers each kind of difference and the
cases where nothing is shown.

</details>

**People and teams** - who belongs where after a login.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/29bca6f757">A login merged into an existing account keeps that account's boards</a>. Thanks to xet7.</summary>

Merging an OIDC or OAuth login into an existing account removes that user
and lets Meteor insert it again under the same id. The removal ran the
account-deletion cleanup, which took the user off every board, card and team
and deleted their avatar. It now removes without the hooks.
`tests/mergedUserKeepsBoards.test.cjs` fails if any code removes an account
through the hooks and then returns it.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d560e2fcf8">LDAP- and OIDC-synced team members become members of the team's boards</a>. Thanks to xet7.</summary>

The login providers' group syncs added the team to the user with a plain
push, skipping the board membership an Admin Panel team change grants
(#4593), so such users could see the team's boards but not work on them. Both
now run the same board sync; a test fails if any code adds a team without it.

</details>

**Subtasks** - where a new subtask lands.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/42c9a396e2">A subtask lands in the list its main board chose on the deposit board</a>. Thanks to TiibCD and xet7.</summary>

The choice made in Board Settings / Subtasks was ignored, and a deposit
board that itself sends subtasks elsewhere gave its subtasks a list of a third
board. Several boards sharing one deposit board can now each land their
subtasks in their own list ([#1781](https://github.com/wekan/wekan/issues/1781)).

</details>

**Admin Panel / Layout** - what the custom head settings put on the page.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6c3db838ac">Custom head meta tags reach the page, as meta elements only</a>. Thanks to xet7.</summary>

The field was saved but never rendered. It is now, when custom head tags are
enabled, keeping only `<meta>` elements and dropping scripts, styles and the
`http-equiv` refresh and set-cookie that would act on every visitor.

</details>

and has the following developer-facing fixes:

- [The receipt collections are pinned to the minimal form the 90-day retention decision asks for](https://github.com/wekan/wekan/commit/c0c424657e). Thanks to xet7.
- [The card-field visibility writer guard counts only writes, not a read projection](https://github.com/wekan/wekan/commit/a9dc8faa98). Thanks to xet7.
- [The release risk baseline knows the format specification links](https://github.com/wekan/wekan/commit/49353db813). Thanks to xet7.

and closes these issues, which were already implemented:

Where each one is in the code:
[Issues-Already-Implemented-2026-10-08.md](docs/DeveloperDocs/Issues-Already-Implemented-2026-10-08.md).

- [Auto add user name to a moved card, done by a rule](https://github.com/wekan/wekan/commit/e27ca445d5). Thanks to xet7.
- [Receive notifications from other users only](https://github.com/wekan/wekan/commit/595f6aaed6). Thanks to gpelouze and xet7.
- [Move lists to a different board](https://github.com/wekan/wekan/commit/f7879e95e6). Thanks to h0jeZvgoxFepBQ2C and xet7.
- [Use the EXIF orientation of uploaded pictures](https://github.com/wekan/wekan/commit/1fbb9f4011). Thanks to CWempe and xet7.
- [Smart search of cards](https://github.com/wekan/wekan/commit/f94cb41c00). Thanks to usmcamp0811 and xet7.
- [Resend verification or change the verified flag](https://github.com/wekan/wekan/commit/0f85328f15). Thanks to lucg71 and xet7.
- [Hide subtask boards on All Boards](https://github.com/wekan/wekan/commit/78899b673f). Thanks to nmd3 and xet7.
- [Progress charts and work statistics for each board](https://github.com/wekan/wekan/commit/939aa8a95e). Thanks to xet7.
- [Mini date field](https://github.com/wekan/wekan/commit/fcbd268d43). Thanks to gerroon and xet7.
- [Edit rules, and send a card with its content and attachments by email](https://github.com/wekan/wekan/commit/054c6e091d). Thanks to kabi178 and xet7.
- [Notification mail template](https://github.com/wekan/wekan/commit/dd410a3a8b). Thanks to hingerlanton and xet7.
- [Auth0 redirect to the full-screen login page](https://github.com/wekan/wekan/commit/948020275b). Thanks to xet7.
- [Common WIP limit for several columns](https://github.com/wekan/wekan/commit/61ad1272bb). Thanks to aviertio and xet7.
- [All Boards drag and drop, and colour](https://github.com/wekan/wekan/commit/0a8c38f395). Thanks to compumatter and xet7.
- [Master dashboard like Kanboard's Bigboard plugin](https://github.com/wekan/wekan/commit/d10fe621be). Thanks to Jieiku and xet7.
- [Move a checklist from one card to another card](https://github.com/wekan/wekan/commit/9158772a61). Thanks to qiutian00 and xet7.
- [Restrict the WeKan port to loopback](https://github.com/wekan/wekan/commit/68bdd70a51). Thanks to galletl and xet7.

and improves translations and their validation:

**Languages updated:** Afrikaans, Akan, Albanian, Amharic, Arabic, Aragonese,
Armenian, Assamese, Asturian, Azerbaijani, Bashkir, Basque, Belarusian,
Bengali, Bhojpuri, Bislama, Bosnian, Breton, Bulgarian, Burmese, Cantonese,
Catalan, Chinese, Corsican, Croatian, Czech, Danish, Dutch, Esperanto,
Estonian, Faroese, French, Galician, Georgian, German, Greek, Gujarati, Haitian
Creole, Hausa, Hebrew, Hindi, Hungarian, Icelandic, Igbo, Indonesian, Irish,
Japanese, Javanese, Kannada, Kazakh, Khmer, Konkani, Korean, Kurmanji Kurdish,
Kyrgyz, Latin, Latvian, Lithuanian, Luxembourgish, Macedonian, Maithili,
Malagasy, Malay, Malayalam, Maltese, Marathi, Mongolian, Māori, Nepali,
Northern Sotho, Norwegian Bokmål, Occitan, Odia, Pashto, Persian, Polish,
Portuguese, Punjabi, Romanian, Romansh, Russian, Sardinian, Scottish Gaelic,
Serbian, Sicilian, Sindhi, Sinhala, Slovak, Slovenian, Somali, Sorani Kurdish,
Spanish, Swahili, Tagalog, Tajik, Tamil, Tatar, Telugu, Thai, Tok Pisin,
Turkish, Turkmen, Ukrainian, Urdu, Uyghur, Uzbek, Vietnamese, Waray, Welsh,
West Frisian, Wu Chinese, Yiddish, Yoruba.



































































































































<details>
<summary><a href="https://github.com/wekan/wekan/commit/faf6725f9a">Translate Lithuanian import and synchronization recovery</a>. Thanks to xet7.</summary>

Fill 48 recovery messages, preserving source variables, existing translations,
permanent deletion warnings and retention of changes already applied.

Three focused translation suites and 21 human-preference checks pass.
No browser or screen-reader session was run. Remaining Lithuanian messages,
other languages and linguistic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/be43a70825">Translate Latvian controls and planning</a>. Thanks to xet7.</summary>

Fill 51 messages covering controls, import guidance, LDAP, login settings,
planning imports and history recovery. Preserve variables, literal examples,
matching priority, non-duplication and recovery decisions.

Four focused translation suites and 21 human-preference checks pass.
The current Latvian fill list is empty. No browser or screen-reader session
was run; other languages and linguistic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ef9af80034">Translate Latvian import and synchronization recovery</a>. Thanks to xet7.</summary>

Fill 48 recovery messages, preserving variables, existing translations,
permanent deletion warnings and retention of changes already applied.

Three focused translation suites and 21 human-preference checks pass.
No browser or screen-reader session was run. Remaining Latvian messages,
other languages and linguistic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/27998c617a">Translate Estonian controls and recovery</a>. Thanks to xet7.</summary>

Fill 70 messages covering controls, import guidance, LDAP, login settings,
stalled synchronization and interrupted imports. Preserve variables, literal
examples, existing localized values and recovery decisions.

Four focused translation suites and 21 human-preference checks pass.
The current Estonian fill list is empty. No browser or screen-reader session
was run; other languages and linguistic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/24912011f5">Translate Russian controls and recovery</a>. Thanks to xet7.</summary>

Fill 236 values across three Russian catalogs, covering controls, import
guidance, LDAP, login address errors, planning and recovery. Preserve variables,
literal examples, existing localized values and recovery decisions.

Four focused translation suites and 21 human-preference checks pass.
All three current Russian fill lists are empty. No browser or screen-reader
session was run; other languages and linguistic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1b3ea17c28">Translate Ukrainian controls and import recovery</a>. Thanks to xet7.</summary>

Fill 69 messages covering controls, import guidance, LDAP, login address
errors, stalled synchronization and interrupted imports. Preserve variables,
literal examples and the distinction between deletion and retaining applied
changes when discarding a synchronization operation.

Four focused translation suites and 21 human-preference checks pass.
The current Ukrainian fill list is empty. No browser or screen-reader
session was run; other languages and linguistic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c458610f62">Translate Greek controls and planning recovery</a>. Thanks to xet7.</summary>

Fill 98 messages in each Greek catalog, for 196 values. Cover controls,
import guidance, LDAP, login address errors, Scrum planning and recovery.
Preserve variables, literal examples, matching priority and recovery choices.

Five focused translation suites and 21 human-preference checks pass.
Both current Greek fill lists are empty. No browser or screen-reader
session was run; other languages and linguistic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/02ee6a37c9">Translate Turkish planning imports and history recovery</a>. Thanks to xet7.</summary>

Fill 29 messages covering release selection, planning imports, planning
synchronization and conflicted history recovery. Preserve variables,
matching priority, non-duplication and recovery choices.

Three focused translation suites and 21 human-preference checks pass.
The current Turkish fill list is empty. No browser or screen-reader session
was run; other languages and broader linguistic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a9b2601c30">Translate Turkish controls and synchronization recovery</a>. Thanks to xet7.</summary>

Fill 44 messages covering board controls, import guidance, assignment, LDAP,
OAuth, login address errors and stalled synchronization. Preserve variables,
literal examples and the distinction between cancellation and retaining
changes already applied.

Four focused translation suites and 21 human-preference checks pass. The
preceding full run passed all 322 translation suites. No browser or
screen-reader session was run; broader translation work remains unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/16bfc9ebab">Translate Turkish interrupted import recovery</a>. Thanks to xet7.</summary>

Fill 25 interrupted-import messages. Preserve source variables, permanent
removal warnings, retention without deletion, the separate Scrum recovery
checkpoint and protection of unrelated boards.

Turkish, global placeholder and translation audit suites pass, together
with 21 human-preference checks. No browser or screen-reader session was run.
Other translations and broader linguistic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7e3ae95014">Translate Romanian planning imports and history recovery</a>. Thanks to xet7.</summary>

Fill 29 messages in each Romanian catalog for release selection, planning
imports, Sync planning and history recovery. Preserve source variables,
matching priority, unchanged cards and recovery decisions.

Romanian, global placeholder and translation audit suites pass, together
with 21 human-preference checks. No browser or screen-reader session was run.
Other translations and broader linguistic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b67435dd6d">Translate Romanian controls and stuck Sync recovery</a>. Thanks to xet7.</summary>

Fill 44 messages in each Romanian catalog for board controls, link rules,
import formats, assignment actions, LDAP, OAuth, server-only login settings
and stuck Sync recovery. Preserve source variables, configuration names and
the distinction between retained applied changes and discarded pending changes.

Romanian, global placeholder, import-format and translation audit suites
pass, together with 21 human-preference checks. No browser or screen-reader
session was run. Other translations and linguistic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/09a5b44862">Translate Romanian interrupted import recovery</a>. Thanks to xet7.</summary>

Fill 25 interrupted-import messages in each Romanian catalog. Preserve
source variables, permanent removal warnings, retention without deletion,
the separate Scrum recovery checkpoint and protection of unrelated boards.

Romanian, global placeholder and translation audit suites pass, together
with 21 human-preference checks. No browser or screen-reader session was run.
Other translations and broader linguistic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2108d855ca">Translate Hungarian controls and stuck Sync recovery</a>. Thanks to xet7.</summary>

Fill 44 messages for board controls, link rules, import formats, assignment
actions, LDAP, OAuth, server-only login settings and stuck Sync recovery.
Preserve source variables, configuration names and the distinction between
retained applied changes and discarded pending changes.

Hungarian, global placeholder, import-format and translation audit suites
pass, together with 21 human-preference checks. No browser or screen-reader
session was run. Other translations and linguistic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/56600a495a">Translate Hungarian interrupted import recovery</a>. Thanks to xet7.</summary>

Fill 25 interrupted-import messages. Preserve source variables, permanent
removal warnings, retention without deletion, the separate Scrum recovery
checkpoint and protection of unrelated boards.

Hungarian, global placeholder and translation audit suites pass, together
with 21 human-preference checks. No browser or screen-reader session was run.
Other translations and broader linguistic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/66b6c6cf7d">Translate Slovak controls and stuck Sync recovery</a>. Thanks to xet7.</summary>

Fill 43 messages for board controls, link rules, import formats, assignment
actions, LDAP, OAuth and stuck Sync recovery. Preserve source variables,
configuration names and the distinction between retained applied changes
and discarded pending changes.

Slovak, global placeholder, import-format and translation audit suites pass,
together with 21 human-preference checks. No browser or screen-reader
session was run. Other translations and linguistic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6079856b93">Translate Slovak interrupted import recovery</a>. Thanks to xet7.</summary>

Fill 25 interrupted-import messages. Preserve source variables, permanent
removal warnings, retention without deletion, the separate Scrum recovery
checkpoint and protection of unrelated boards.

Slovak, global placeholder and translation audit suites pass, together with
21 human-preference checks. No browser or screen-reader session was run.
Other translations and broader linguistic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cb9850aa9d">Translate Czech controls and stuck Sync recovery</a>. Thanks to xet7.</summary>

Fill 43 messages for board controls, link rules, import formats, assignment
actions, LDAP, OAuth and stuck Sync recovery. Preserve source variables,
configuration names and the distinction between retained applied changes
and discarded pending changes.

Czech, global placeholder, import-format and translation audit suites pass,
together with 21 human-preference checks. No browser or screen-reader
session was run. Other translations and linguistic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6cff7c86fc">Translate Czech interrupted import recovery</a>. Thanks to xet7.</summary>

Fill 25 interrupted-import messages. Preserve source variables, permanent
removal warnings, retention without deletion, the separate Scrum recovery
checkpoint and protection of unrelated boards.

Czech, global placeholder and translation audit suites pass, together with
21 human-preference checks. No browser or screen-reader session was run.
Other translations and broader linguistic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/49e8be5cd1">Translate Polish planning imports and recovery messages</a>. Thanks to xet7.</summary>

Fill 61 messages for board controls, link rules, planning imports, Sync and
import/history recovery. Preserve source variables, literal examples,
matching priority and permanent-removal warnings.

Polish, global placeholder and translation audit suites pass, together with
21 human-preference checks. No browser or screen-reader session was run.
Other translations and broader linguistic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8cdd39385f">Translate Polish import guidance and stuck Sync recovery</a>. Thanks to xet7.</summary>

Fill 36 messages for import formats, assignment actions, LDAP, OAuth,
release selection and stuck Sync recovery. Preserve source variables,
configuration names and the distinction between retained applied changes
and discarded pending changes.

Polish, global placeholder, import-format and translation audit suites pass,
together with 21 human-preference checks. No browser or screen-reader
session was run. Other translations and linguistic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e25bf4ec94">Translate Finnish planning imports and recovery messages</a>. Thanks to xet7.</summary>

Fill 61 messages for board controls, link rules, planning imports, Sync and
import/history recovery. Preserve source variables, literal examples,
matching priority and permanent-removal warnings.

Finnish, global placeholder and translation audit suites pass, together with
21 human-preference checks. No browser or screen-reader session was run.
Other translations and broader linguistic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1918d37067">Translate Norwegian Bokmal planning imports and recovery messages</a>. Thanks to xet7.</summary>

Fill 61 messages for board controls, link rules, planning imports, Sync and
import/history recovery. Preserve source variables, literal examples,
matching priority and permanent-removal warnings.

Bokmal, global placeholder and translation audit suites pass, together with
21 human-preference checks. No browser or screen-reader session was run.
Other translations and broader linguistic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/28d3785914">Translate Norwegian Bokmal import guidance and stuck Sync recovery</a>. Thanks to xet7.</summary>

Fill 36 messages for import formats, assignment actions, LDAP, OAuth,
release selection and stuck Sync recovery. Preserve source variables,
configuration names and the distinction between retained applied changes
and discarded pending changes.

Bokmal, global placeholder, import-format and translation audit suites pass,
together with 21 human-preference checks. No browser or screen-reader
session was run. Other translations and linguistic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9da06c16a4">Translate Danish planning imports and recovery messages</a>. Thanks to xet7.</summary>

Fill 61 messages for board controls, link rules, planning imports, Sync and
import/history recovery. Preserve source variables, literal examples,
matching priority and permanent-removal warnings.

Danish, global placeholder and translation audit suites pass, together with
21 human-preference checks. No browser or screen-reader session was run.
Other translations and broader linguistic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cd886e99fc">Translate Danish import guidance and stuck Sync recovery</a>. Thanks to xet7.</summary>

Fill 36 messages for import formats, assignment actions, LDAP, OAuth,
release selection and stuck Sync recovery. Preserve source variables,
configuration names and the distinction between retained applied changes
and discarded pending changes.

Danish, global placeholder, import-format and translation audit suites pass,
together with 21 human-preference checks. No browser or screen-reader
session was run. Other translations and linguistic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e00407123e">Translate Swedish planning imports and recovery messages</a>. Thanks to xet7.</summary>

Fill 61 messages for board controls, link rules, planning imports, Sync and
import/history recovery. Preserve source variables, literal examples,
matching priority and permanent-removal warnings.

Swedish, global placeholder and translation audit suites pass, together with
21 human-preference checks. No browser or screen-reader session was run.
Other translations and broader linguistic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/36e11d85fd">Translate Swedish import guidance and stuck Sync recovery</a>. Thanks to xet7.</summary>

Fill 36 messages for import formats, assignment actions, LDAP, OAuth,
release selection and stuck Sync recovery. Preserve source variables,
configuration names and the distinction between retained applied changes
and discarded pending changes.

Swedish, global placeholder, import-format and translation audit suites
pass, together with 21 human-preference checks. No browser or screen-reader
session was run. Other translations and linguistic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d54be51d9c">Translate Dutch planning imports and recovery messages</a>. Thanks to xet7.</summary>

Fill 61 messages in each Dutch catalog for board controls, link rules,
planning imports, Sync and import/history recovery. Preserve source
variables, literal examples, matching priority and permanent-removal warnings.

Dutch, global placeholder and translation audit suites pass, together with
21 human-preference checks. No browser or screen-reader session was run.
Other translations and broader linguistic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/78a076e317">Translate Dutch import guidance and stuck Sync recovery</a>. Thanks to xet7.</summary>

Fill 36 messages in each Dutch catalog for import formats, assignment
actions, LDAP, OAuth, release selection and stuck Sync recovery. Preserve
source variables, configuration names, format syntax and the distinction
between retained applied changes and discarded pending changes.

Dutch, global placeholder, import-format and translation audit suites pass,
together with 21 human-preference checks. No browser or screen-reader
session was run. Other translations and linguistic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9c4066ce8f">Translate Portuguese import guidance and stuck Sync recovery</a>. Thanks to xet7.</summary>

Fill 36 messages in each of four Portuguese catalogs for import formats,
assignment actions, LDAP, OAuth, release selection and stuck Sync recovery.
Preserve regional wording, source variables, configuration names and the
distinction between retained applied changes and discarded pending changes.

Portuguese, global placeholder, import-format and translation audit suites
pass, together with 21 human-preference checks. No browser or screen-reader
session was run. Broader translation and linguistic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ea258e866d">Translate Portuguese planning imports and recovery messages</a>. Thanks to xet7.</summary>

Fill 61 messages in each of four Portuguese catalogs, preserving existing
localized values and Brazilian terminology. Cover board controls, link
rules, planning imports, Sync and import/history recovery. Preserve source
variables, literal examples, matching priority and permanent-removal warnings.

Portuguese, global placeholder and translation audit suites pass, together
with 21 human-preference checks. No browser or screen-reader session was run.
Other untranslated messages and broader linguistic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f47f6b3c65">Translate Spanish import guidance and stuck Sync recovery</a>. Thanks to xet7.</summary>

Fill 36 messages in each of nine Spanish catalogs for import formats,
assignment rules, LDAP, OAuth, release selection and stuck Sync recovery.
Preserve source variables, configuration names, format syntax and the
distinction between retained applied changes and discarded pending changes.

Spanish, global placeholder, import-format and translation audit suites pass,
together with 21 human-preference checks. No browser or screen-reader session
was run. Broader translation and linguistic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/afafc47bf0">Translate Spanish planning imports and recovery messages</a>. Thanks to xet7.</summary>

Fill 61 messages in each of nine Spanish catalogs, preserving existing
localized values and shared planning terminology. Cover board controls,
link rules, planning imports, Sync and import/history recovery. Preserve
variables, literal examples, matching priority and permanent-deletion warnings.

Spanish, global placeholder and translation audit suites pass, together with
21 human-preference checks. No browser or screen-reader session was run.
Newer untranslated messages and broader linguistic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9687307660">Translate Italian planning and recovery messages</a>. Thanks to xet7.</summary>

Fill 97 current messages for board controls, import formats, LDAP, OAuth,
planning and recovery. Preserve existing localized values, source variables,
literal examples, matching priority and distinctions between retaining
applied changes and discarding pending ones.

Italian, global placeholder, import-format and translation audit suites pass,
together with 21 human-preference checks. The fill tool reports no remaining
English placeholders in Italian. No browser or screen-reader session was run;
other locales and broader linguistic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d9b585135d">Translate German planning imports and recovery messages</a>. Thanks to xet7.</summary>

Fill 61 messages in each of four German catalogs, preserving existing
localized values and Swiss spelling. Cover board controls, link rules,
planning imports, Sync and import/history recovery. Preserve source
variables, literal examples, matching priority and permanent-removal warnings.

German, global placeholder and translation audit suites pass, together with
21 human-preference checks. No browser or screen-reader session was run.
Other locale translations and broader linguistic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/93c380310f">Translate French planning imports and recovery messages</a>. Thanks to xet7.</summary>

Fill 61 messages in each of the five French catalogs, preserving existing
localized values. Cover board controls, link rules, planning imports, Sync,
interrupted imports and conflicted history recovery. Preserve variables,
literal examples, source matching priority and permanent-discard warnings.

French, global placeholder and translation audit suites pass, together with
21 human-preference checks. No browser or screen-reader session was run.
Other locale translations and broader linguistic review remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cc7ff1c856">Translate Aromanian import recovery and repair mixed-language controls</a>. Thanks to xet7.</summary>

Translate 25 interrupted-import messages and replace 65 Italian or Spanish
card, checklist, attachment, board and account labels. Preserve source
variables, recovery decisions, permanent-discard warnings, shared dialog
wording and opposite actions. New phrasing remains low-confidence pending
fluent review.

Aromanian, global placeholder and translation audit suites pass. The fill
tool reports no remaining English placeholders in Aromanian; broader
wrong-language review and other locale translations remain unfinished.
No browser or screen-reader session was run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fd90691e00">Correct Italian-seeded Aromanian search and organization labels</a>. Thanks to xet7.</summary>

Replace 48 wrong-language search, organization, rule and card labels.
Preserve result-count variables, reminder variables, predicate syntax,
shared labels and opposite actions. New wording remains low-confidence
pending fluent review.

Aromanian, global placeholder and translation audit suites pass. No browser
or screen-reader session was run. Broader translation work remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cca57e46b5">Correct Italian-seeded Aromanian rule-builder labels</a>. Thanks to xet7.</summary>

Replace 35 wrong-language conditions, actions and fragments. Preserve
check/uncheck and top/bottom distinctions, shared checklist wording and
past-state meaning. New phrasing remains low-confidence pending fluent review.

Aromanian, global placeholder and translation audit suites pass. No browser
or screen-reader session was run. Further linguistic review and translation
work remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6f4a96b8c0">Translate Northern Sotho planning imports and repair locale suites</a>. Thanks to xet7.</summary>

Translate 20 messages and extend the Scrum inventory to 127 while retaining
per-key translation and token checks. Preserve matching priority,
non-duplication and first-sync protection of planning. Full new wording
remains low-confidence pending fluent review.

All 322 translation suites pass after these repairs, including global
placeholder checks. All 21 human-preference checks also pass. No browser or
screen-reader session was run; the all-language
translation and linguistic review work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/38e8f1d4bc">Translate Maori planning imports and repair locale suites</a>. Thanks to xet7.</summary>

Translate 20 messages and extend the Scrum inventory to 127 while retaining
per-key translation and token checks. Preserve matching priority,
non-duplication and first-sync protection of planning. Full new wording
remains low-confidence pending fluent review.

Both Maori suites, global placeholder and translation audit checks pass.
Two failures from the latest broad run still need repair. No browser or
screen-reader session was run; the all-language work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/50a2d2fce1">Translate Somali planning imports and repair locale suites</a>. Thanks to xet7.</summary>

Translate 20 messages and extend the Scrum inventory to 127 while retaining
per-key translation and token checks. Preserve matching priority,
non-duplication and first-sync protection of planning. Full new wording
remains low-confidence pending fluent review.

Both Somali suites, global placeholder and translation audit checks pass.
Four failures from the latest broad run still need repair. No browser or
screen-reader session was run; the all-language work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/eb846b6ca0">Translate Tok Pisin planning imports and repair locale suites</a>. Thanks to xet7.</summary>

Translate 20 messages and extend the Scrum inventory to 127 without weakening
per-key translation and token checks. Preserve matching priority,
non-duplication and first-sync protection of planning. Full new wording
remains low-confidence pending fluent review.

Both Tok Pisin suites, global placeholder and translation audit checks pass.
Six failures from the latest broad run still need repair. No browser or
screen-reader session was run; the all-language work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f06dd84b40">Translate Ukrainian Scrum import and Sync planning messages</a>. Thanks to xet7.</summary>

Translate 20 messages and restore the Ukrainian planning suite. Preserve
counters, matching priority, non-duplication, unchanged foreign-board cards
and first-sync protection of existing planning.

Ukrainian, global placeholder and translation audit suites pass. Eight
failures from the latest broad run still need repair. No browser or
screen-reader session was run; the all-language work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/27fe2c86ed">Translate Estonian Scrum import and Sync planning messages</a>. Thanks to xet7.</summary>

Translate 20 messages and restore the Estonian planning suite. Preserve
counters, matching priority, non-duplication, unchanged foreign-board cards
and first-sync protection of existing planning.

Estonian, global placeholder and translation audit suites pass. Nine failures
from the latest broad run still need repair. No browser or screen-reader
session was run; the all-language work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3ae3852099">Repair planning translations and Aromanian system labels</a>. Thanks to xet7.</summary>

Translate 116 planning messages across Aromanian, Czech, Slovak, Hungarian
and two Russian catalogs; correct 34 Italian-seeded Aromanian system and rule
labels. Preserve counters, matching priority, non-duplication and protection
of existing planning. New Aromanian wording remains low-confidence pending
fluent review.

Seven targeted translation suites pass, including global placeholder checks.
Ten failures from the latest broad run still need repair. No browser or
screen-reader session was run; the all-language work remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/94209a2764">Correct Italian-seeded Aromanian account and webhook labels</a>. Thanks to xet7.</summary>

Replace 35 wrong-language values in account, invitation, template, time and
webhook controls. Preserve overtime meaning, hour units, invitation variables
and technical names; distinguish outgoing and two-way webhooks. Full new
wording remains low-confidence pending fluent review.

Aromanian, global placeholder and translation audit suites pass. No browser
or screen-reader session was run. Further language review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cfc5edcbdb">Correct Italian-seeded Aromanian board controls</a>. Thanks to xet7.</summary>

Replace 35 wrong-language values in board/member actions, movement, selection,
validation and keyboard help. Preserve the label variable and Excel CSV/TSV
name; cover opposite movement directions and card/board removal scope.
Full new wording remains low-confidence pending fluent review.

Aromanian, global placeholder and translation audit suites pass. No browser
or screen-reader session was run. Further language review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d7ff39eba6">Replace Italian-seeded Aromanian dialogs and filters</a>. Thanks to xet7.</summary>

Correct 47 wrong-language values in dialogs, invitations, export controls and
filters. Preserve invitation variables and PDF/iCal names; add regression
checks against restoring the Italian text or replacing it with English.
New Aromanian phrasing remains low-confidence pending fluent review.

Aromanian, global placeholder and translation audit suites pass. No browser
or screen-reader session was run. Further Italian-seed candidates and other
languages remain under review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/76b35e70c6">Translate Aromanian stuck Sync recovery messages</a>. Thanks to xet7.</summary>

Translate 23 messages, preserving applied changes, the unwritten remainder,
replay eligibility and oldest-50 ordering. New wording remains low-confidence
pending fluent review. The reported English-placeholder queue is empty;
older mixed-language values and skipped short strings still need review.

Aromanian, global placeholder and translation audit suites pass. No browser
or screen-reader session was run. The all-language translation work continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5e251e53ac">Translate Aromanian imports, controls and Sync planning</a>. Thanks to xet7.</summary>

Translate 47 messages, preserving import syntax, link-rule variables and
examples, configuration identifiers and physical keyboard legends. Cover
read-only fields, unchanged card data and Sync source-ID matching priority
and its first-run protection of existing planning. New wording remains
low-confidence pending fluent review.

Aromanian, global placeholder, import literal and translation audit suites
pass. No browser or screen-reader session was run. Other untranslated and
wrong-language values remain under review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/43a7b0246e">Translate Aromanian Sync choices and diagnostics</a>. Thanks to xet7.</summary>

Translate 63 conflict, preview, report and estimate messages. Preserve local
and source scope, unchanged subcards, replacement reuse, report limits,
missing-versus-null values and the single matching time-field requirement.
New wording remains low-confidence pending fluent review.

Aromanian, global placeholder and translation audit suites pass, along with
21 human-preference checks. No browser or screen-reader session was run.
Other untranslated and wrong-language values remain under review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a050566954">Translate Aromanian notification recovery messages</a>. Thanks to xet7.</summary>

Translate 36 mail failure and activity-notification recovery messages.
Preserve temporary/permanent rejection, retained pending work, the prohibition
on recreating activities and irreversible cancellation. New wording remains
low-confidence pending fluent review.

Aromanian, global placeholder and translation audit suites pass, along with
21 human-preference checks. No browser or screen-reader session was run.
Other untranslated and wrong-language values remain under review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f73ce87d54">Translate remaining Aromanian Scrum instructions</a>. Thanks to xet7.</summary>

Translate 20 instructions and recovery messages, preserving unknown estimates,
UTC sampling, cancelled-sprint membership and rollback eligibility. Cover all
current Scrum keys and the reporting/recovery distinctions alongside the
source variable inventory. Full wording remains low-confidence pending fluent
review.

Aromanian, global placeholder and translation audit suites pass. No browser
or screen-reader session was run. Other untranslated and wrong-language
values remain under review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4eec94b7c8">Translate Aromanian Scrum labels and reporting controls</a>. Thanks to xet7.</summary>

Translate 73 labels, actions, states and short reports. Preserve counters,
reference variables, minute units and the 366-observation limit. Extend
regression coverage for shared labels and distinct lifecycle states and use
the shared Unicode-aware token scanner. New terminology and phrasing remain
low-confidence pending fluent review.

Aromanian, global placeholder and translation audit suites pass, as do 21
human-preference checks. No browser or screen-reader session was run.
Untranslated messages and older wrong-language values still require work.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4b0fde93ef">Translate new Scrum messages and repair four locale suites</a>. Thanks to xet7.</summary>

Translate 36 release-selection and recovery messages in Māori, Northern Sotho,
Somali and Tok Pisin. Update the expected Scrum inventory from 102 to 111 while
retaining per-key translation and token checks. Cover keyboard legends,
distinct rollback and retain actions, and all four recovery counters.
Full new wording remains low-confidence pending fluent review.

All 322 translation suites pass after these repairs, including the global
placeholder checks. The 21 human-preference checks also pass. No browser or
screen-reader session was run.
Other translation and linguistic review work remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/478fcc07f0">Translate pending imports and recovery messages in German locales</a>. Thanks to xet7.</summary>

Translate 144 values across four German catalogs, preserving Swiss spelling,
source variables, import syntax and configuration identifiers. Extend German
regression coverage for recovery consequences and multiple-release selection.
Focused German, global placeholder, import literal and audit checks pass,
along with 21 human-preference checks. No browser session was run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/362a43fa43">Translate new planning messages exposed by regression tests</a>. Thanks to xet7.</summary>

Translate 63 release-selection and Scrum recovery values in Czech, Slovak,
Hungarian, two Russian catalogs, Ukrainian and Estonian. Six planning suites
pass again without weakened assertions; global placeholder checks also pass.
The full 322-suite run exposed ten failures before these repairs. Four other
Scrum translation suites still need new translations and inventory updates.
The all-language translation and linguistic review work remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/20cae59763">Translate pending imports and recovery messages in French locales</a>. Thanks to xet7.</summary>

Translate 180 values across the five French catalogs for imports, assignment,
LDAP, login, release selection and stuck List Sync recovery. Preserve variables,
configuration names and import syntax. Regression checks cover retained applied
changes, the unwritten remainder, replay eligibility and multiple releases.

The French suite, catalog-wide placeholder and import literal checks,
translation audit suite and 21 human-preference checks pass. No browser or
screen-reader session was run. Other translation and linguistic review work
remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bffc32f899">Translate pending Finnish import and Sync recovery messages</a>. Thanks to xet7.</summary>

Translate 36 pending messages for imports, assignment rules, LDAP, login,
release selection and stuck List Sync operations. Preserve variables,
configuration names and import syntax. Recovery warnings retain applied
changes and explain that remaining saved changes are never written.

The Finnish regression suite, catalog-wide placeholder and import literal
checks, translation audit suite and 21 human-preference checks pass.
No browser or screen-reader session was run. Translation work for other
languages and review of older linguistic defects continue.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5e00df9be7">Correct Bislama display, weekday and report translations</a>. Thanks to xet7.</summary>

- Replace 76 artificial English wrappers while preserving template variables,
  import counts, separators and font names. 312 older wrappers remain;
  search operators still require a parser-aware review.
- Three relevant suites pass, including the catalog-wide placeholder check.
  Software compounds remain provisional pending fluent review. Browser and
  screen-reader sessions were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d4607ee49c">Correct Bislama navigation, diagnostics and rule labels</a>. Thanks to xet7.</summary>

- Replace 145 artificial English wrappers and translate new Todoist import
  guidance. Preserve runtime identifiers, units, protocol names, scheduling
  directions, check states and source variables. 388 older wrappers remain.
- Three relevant suites pass, including the catalog-wide placeholder inventory.
  Full software compounds remain provisional pending fluent review. Browser
  and screen-reader sessions were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e882ed8901">Correct 120 Bislama entries containing English wrappers</a>. Thanks to xet7.</summary>

- Replace artificial English wrappers in board, font, color, voting and filter
  labels. Restore numeric choices, date formats and compact sort labels exactly.
  The older wrapper queue falls from 653 to 533 values, outside the fill report.
- Three relevant suites pass, including the catalog-wide placeholder inventory.
  Fine color descriptions and software compounds remain provisional pending
  fluent review. Browser and screen-reader sessions were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d787085c30">Translate remaining reported Bislama messages and short controls</a>. Thanks to xet7.</summary>

- Translate 224 workspace, Scrum, Sync and notification-recovery messages
  plus ten short Blockly labels skipped by the fill report. Preserve variables,
  report limits, missing/null distinctions and cancellation consequences.
- Three relevant suites pass, including the catalog-wide placeholder check.
  The Bislama fill report is empty, but 653 older values with the artificial
  “Tok blong sistem:” prefix still require language correction. Technical
  compounds remain provisional. Browser and screen-reader sessions were not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/74e4048f32">Translate Bislama functions, navigation and text operations</a>. Thanks to xet7.</summary>

- Translate 175 Blockly messages for mathematical operations, functions,
  variables, keyboard navigation, screen-reader controls and text operations.
  Preserve result behavior, angle units, opposite states, replacement scope,
  whitespace rules and numbered substitutions.
- Three relevant suites pass, including the catalog-wide placeholder check.
  Browser and screen-reader sessions were not run. Mathematical loanwords
  and complete software phrases remain provisional pending fluent review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5501cf17ae">Translate Bislama lists, logic and mathematics</a>. Thanks to xet7.</summary>

- Translate 156 labels and messages, including four LDAP notices and the
  short OR label. Preserve exact source tokens and environment identifiers,
  list copy/removal semantics, logical conditions and random-number bounds.
- Five relevant regression suites pass, including the catalog-wide token
  inventory. Browser and screen-reader sessions were not run. Statistical
  terminology and complete Bislama software phrases remain provisional.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/59e67383ec">Translate Bislama controls and read-only login guidance</a>. Thanks to xet7.</summary>

- Translate 116 Bislama Blockly labels, including the short bitmap-on label,
  and 62 environment-only login notices visible through 63 locale paths.
  Preserve bitmap states, operand roles, placeholder order and read-only scope.
- All 321 translation/i18n suites and 21 human-preference checks pass.
  Browser and screen-reader sessions were not run; Bislama software compounds
  remain provisional and the broader translation audit continues.
- This shared-checkout commit also contains catalog additions being staged by
  the concurrent login-settings workflow. Their English placeholders remain
  tracked for translation; no unrelated implementation code was included.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/58ce223329">Translate more card-field help and Bislama blocks</a>. Thanks to xet7.</summary>

- Add 74 translations across 16 locales and correct three Bislama color
  wrappers. Preserve field hiding/restoration semantics, color ranges,
  variable-deletion restrictions and Blockly loop/conditional behavior.
- Preserve exact placeholders, including numbered Blockly arguments. Keep
  Bislama's native red label without exempting English sentences or other
  locales. Tests cover both valid terms and changed-source rejection.
- The 37 relevant suites, the additional invariant suite and 21 human-preference
  checks pass. Script and translated rendering checks cover the card fields.
  Browser and screen-reader sessions were not run. Provisional wording and the
  remaining mixed-language/translation audit stay open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3ec8138130">Translate remaining keyboard labels in six locales</a>. Thanks to xet7.</summary>

- Fill 119 keyboard and card-field strings in Akan, Māori, Northern Sotho,
  Somali, Tok Pisin and Waray. Their full fill reports now contain no remaining
  placeholders; this measures coverage rather than fluency.
- Preserve recognizable physical keys, opposite navigation directions,
  card-field hiding scope and exact source variables. Existing translations
  are retained. All 31 relevant suites and 21 human-preference checks pass.
- New software wording is provisional, especially in Akan, Northern Sotho and
  Waray. Terminology sources are recorded in the translation audit. Browser
  and screen-reader sessions were not run; the broader translation work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e503945ef1">Report locale text coverage accurately</a>. Thanks to xet7.</summary>

The README now reports 182 of 234 locale catalogs with non-English text for
more than 90 percent of source keys. This replaces the stale count of 171
and the stronger, unverified claim that those translations are essentially
complete. The source-derived language-wiring check retains the exact numeric
assertion and requires the wording to distinguish coverage from quality.

Validation: all six language-wiring checks pass. The other 21 additional
locale, notification-language and Transifex suites passed in the related run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5ce7549bcf">Translate more card-field visibility help</a>. Thanks to xet7.</summary>

- Fill 44 values in 22 further locale paths, bringing this message pair to
  153 translated non-English paths. Preserve hiding scope, stored data and
  settings, restoration and each board's own field order.
- All 30 relevant suites pass, including full catalog placeholder inventories
  and translated-text rendering. Browser tests were not run.
- Breton, Faroese, Romansh, Sardinian, Scottish Gaelic and Sicilian drafts need
  fluent-speaker review. Terminology references and remaining work are recorded
  in the translation audit. No external translation service was used.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/07a33f5d5f">Protect translation variables and restore catalog coverage</a>. Thanks to xet7.</summary>

- Verify the English token inventory across all 246 locale paths, including
  non-Latin renamed tokens, positional arguments and repeated variables.
  Reject invalid fill batches atomically while preserving existing translations.
- Restore the two missing card-field settings keys in source order and add
  240 translated values. English fallback remains visible for unfinished
  locales.
- Keep exact OS brands and compact Blockly math/code symbols out of the prose
  backlog without exempting help text or accessibility labels.
- Reconcile four superseded audit records and accept the Akan organization noun
  in its current sentence case. Preserve literal JSON example property names.
- Validation: 321 translation/i18n suites and 21 human-preference checks pass,
  including catalog rendering and negative fill fixtures. Browser tests were
  not run. Remaining translation work and fluent-speaker review stay open.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.23 2026-10-08 WeKan ® release

**In short:** Two **GitHub CodeQL** code-scanning alerts in the test suite are
fixed: tests no longer build `bash -c` scripts from absolute paths, and a guard
keeps that shape out of every test. A **minicard comment** is readable again
beside many assignees. **Multi-Selection** can set a custom card color, and
**Admin Panel / Settings / Visibility / Features** chooses which card fields
every board shows.

This release fixes the following SECURITY ISSUES found by GitHub CodeQL code scanning:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0c7b3f8d1a76ce7e7a547dad59f9de0f8403644c">Translation tests check links by their parsed host, not as substrings</a>. Thanks to GitHub CodeQL and xet7.</summary>

Alerts #551, #552 and #553 (`js/incomplete-url-substring-sanitization`): two
translation tests checked text with `includes('https://trello.com/app-key')`
and `includes('example.com')`, which also pass for a link to another host
that merely contains them. The Trello links are parsed and must have the host
trello.com and the path /app-key; the example domain must be a whole word.
`tests/urlSubstringSanitization.test.cjs` keeps this shape out of the tree.
Test files only, so nothing is logged in Admin Panel -> Problems.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/433e58a618d87e58f8b42b419b2d7829488c47c5">Tests pass shell paths through the environment, not into bash -c scripts</a>. Thanks to GitHub CodeQL and xet7.</summary>

Alerts #549 and #550 (`js/shell-command-injection-from-environment`):
`tests/snapSettingsKeys.test.cjs` and `tests/snapSocketDenied.test.cjs`
interpolated an absolute path built from `__dirname` into a `bash -c` script
(`source "${helper}"`), so a checkout path with a quote, `$(` or a backtick
would change the command. Two more tests had the same shape. All four pass the
path in an environment variable now, and `tests/testShellPathsFromEnv.test.cjs`
fails on any test that sources an interpolated value. These are test files, so
no attempt against a running WeKan is possible and nothing is logged in Admin
Panel -> Problems.

</details>

and adds the following new features:

**Multi-Selection** - custom card colors for every selected card at once.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fdfa94321278b7d46eacec54340c7845d7efbd1e">Multi-Selection can put a custom color on all selected cards, and offers the board's custom colors</a>. Thanks to xet7.</summary>

Reported by email: Multi-Selection offered only the ready-made card colors, so
a lighter yellow that keeps card text readable had to be set card by card. One
card's color popup already had a color wheel (#5514) storing a `#rrggbb` hex in
`card.color`; the Multi-Selection color popup now has the same wheel and writes
the same field through the same `Card.setColor` and server allow rule, so no
second color model exists. Both popups also show the custom colors already used
on the board's cards beside the palette, so a color picked once is one click
away for the next cards. Cards the user may not edit are skipped, and one
refused card no longer stops the rest of the selection. The Cards schema checks
`color` with one shared rule - empty, a palette name or a strict `#rrggbb` -
so values such as `red;background:url(...)`, `</style>` or `javascript:` are
refused on the server and never shown as swatches. Such a value is not logged
in Admin Panel -> Problems: it was never renderable, and no published
vulnerability stands behind it. `tests/multiSelectionCustomColor.test.cjs` pins
the rule, the swatch list and the wiring;
`tests/playwright/specs/multiselection-custom-color.e2e.js` colors two cards
light yellow and checks a comment-only linked card stays unchanged.

</details>

**The Admin Panel** - install-wide visibility of the card fields of Board
Settings / Card.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/03975e7d3108433cd222645e8bdc181978d7dd70">Settings / Visibility / Features chooses which card fields every board shows</a>. Thanks to xet7.</summary>

Above the Features Save there is one tick per field type of the board sidebar's
Board Settings / Card, with the same icons and names, all ticked by default.
Unticking one, for example Pomodoro, removes its row from every board's Board
Settings / Card and hides it on every opened card and minicard, whatever the
board chose. It is visibility only: no card data and no board setting is
written, so ticking it again shows every board as it was set, and a
whole-column tick in Board Settings / Card leaves the hidden fields alone.
There is no ordering here; the order stays each board's own. The setting is
`cardFieldStates` on the settings document (missing means shown), saved by the
site-admin-only Features save, which refuses unknown field keys. The client's
one board read returns the board with the hidden fields' flags off, so every
card and minicard template follows without a second condition; the server's
reads, publications and REST API are unchanged.
`tests/cardFieldVisibility.test.cjs` pins the catalog, the default, hiding and
restoring, the untouched data and the admin-only save;
`tests/playwright/specs/admin-card-field-visibility.e2e.js` unticks Pomodoro as
the admin and checks Board Settings / Card, the card and the minicard. See
[Visibility](docs/Features/Admin-Panel/Settings/Visibility.md).

</details>

and fixes the following bugs:

**Minicards** - the comment preview gets a full-width line of its own.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c2ad25d3bfc22698667d145e54f016a4a4593f2e">The comment preview is no longer cut to a few characters beside the assignees</a>. Thanks to xet7.</summary>

With Board Settings / Card / Comments "Show on Minicard" on, a card with seven
assignees showed its comment as "Någr…" on the same line as the avatars. The
avatar rows float to the inline end and the badges to the inline start; each
comment line was `overflow: hidden`, which a float narrows to the width it
leaves, and `white-space: nowrap` cut the text there. The comments now clear
both floats and start at full width under them, and the text wraps, clamped to
three lines with the ellipsis at the end, in LTR and RTL.
`tests/minicardCommentsOnMinicard.test.cjs` pins the clear, the wrap and the
clamp and fails on any minicard comment rule that goes back to `nowrap`,
absolute positioning or a one-sided clear;
`tests/playwright/specs/minicard-comment-beside-assignees.e2e.js` reproduces the
report with seven assignees and asserts no avatar overlaps the comment.

</details>

**Translations** — continued language coverage and corrections.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a30eaaf22f69c65a3f6dbde318c87589380f9d7c">Translate card-field visibility in eight languages</a></summary>

- Add 16 missing translations in Finnish, Swedish, German, French, Spanish,
  Portuguese, Italian and Dutch. Preserve existing strings, key order and
  tokens;
  check unchanged card data/settings, re-enabling fields and per-board ordering.
- Validation: 38 translation checks and 21 human-preference checks pass. Two
  repository-wide checks still fail on these keys missing from other locales.
  Browser checks were not run; menu wording remains open to speaker review.
- The remaining catalogs and broader language audit are unfinished.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/486d6229475adb3265e29f94b5108014b21334a3">Translate Moroccan Arabic recovery and short labels</a></summary>

- Fill 44 placeholders, including keyboard names and short labels omitted by the
  ordinary filter. Preserve printed key names and check cancellation scope,
  retained pending work, source tokens and matching Blockly aliases.
- Validation: 58 translation checks and 21 human-preference checks pass. Two
  repository-wide checks fail on new card-field-visibility keys missing from
  other locales. Browser, RTL and screen-reader checks were not run.
- The ordinary list now contains eleven technical names and notation values.
  Technical wording remains low confidence pending speaker review; the older
  catalog's dialect and semantic audit and the broader language work stay open.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/77a1829ce17ba9407dcd75204a6cd9fb77a72f61">Translate Moroccan Arabic estimates and notification recovery</a></summary>

- Fill 31 placeholders, retaining existing translations. Check missing/null
  handling, estimate fields, delivery uncertainty and recovery limits,
  together with script, source order and placeholders.
- Validation: 57 translation checks and 21 human-preference checks pass. Two
  repository-wide checks fail on new card-field-visibility keys missing from
  other locales. Browser, RTL and screen-reader checks were not run.
- Technical Darija wording remains low confidence pending speaker review;
  remaining placeholders and the broader language audit stay open.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/86ac83f244979f64fb1509927274f223fdde6ce0">Translate Moroccan Arabic Sync previews and reports</a></summary>

- Fill 31 placeholders, retaining existing translations. Check retention limits,
  possible partial changes, report limitations, access requirements and preview
  scope, together with script, source order and placeholders.
- Validation: 55 translation checks and 21 human-preference checks pass. Two
  repository-wide checks fail on new card-field-visibility keys missing from
  other locales. Browser, RTL and screen-reader checks were not run.
- Technical Darija wording remains low confidence pending speaker review;
  remaining placeholders and the broader language audit stay open.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2e9243f3c88b0fcacdeed0c5dd3537c54e5db761">Translate Moroccan Arabic observations and Sync conflicts</a></summary>

- Fill 36 placeholders, retaining existing translations. Check observation
  limits,
  import restrictions, no source writes, mapping-only removal, unchanged
  subcards
  and replacement reuse, together with script, source order and placeholders.
- Validation: 54 translation checks and 21 human-preference checks pass. Two
  repository-wide checks fail on new card-field-visibility keys missing from
  other locales. Browser, RTL and screen-reader checks were not run.
- Technical Darija wording remains low confidence pending speaker review;
  remaining placeholders and the broader language audit stay open.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/263d3ff9e6cf4532c990e6b4a6d2ddddc5a465d2">Translate Moroccan Arabic sprint reports and events</a></summary>

- Fill 36 placeholders, retaining existing translations. Check estimate
  semantics,
  cancellation membership, unfinished-work destinations, partial reports and
  event distinctions, together with script, source order and placeholders.
- Validation: 53 translation checks and 21 human-preference checks pass. Two
  repository-wide checks fail on new card-field-visibility keys missing from
  other locales. Browser, RTL and screen-reader checks were not run.
- Technical Darija and Scrum terminology remain low confidence pending speaker
  review; remaining placeholders and the broader language audit stay open.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b18b2531aab54d180e006083b600bc6fcada2772">Translate Moroccan Arabic Scrum settings and sprint controls</a></summary>

- Fill 31 placeholders, retaining existing translations. Check completion
  policies, sprint actions, unfinished-work scope, estimate sources and matching
  board-view labels, together with script, source order and placeholders.
- Validation: 52 translation checks and 21 human-preference checks pass. Two
  repository-wide checks fail on new card-field-visibility keys missing from
  other locales. Browser, RTL and screen-reader checks were not run.
- Technical Darija and Scrum terminology remain low confidence pending speaker
  review; remaining placeholders and the broader language audit stay open.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9dcb964c1a1b4b70b6f552206bf5437999b3761c">Translate Moroccan Arabic rule editor and Scrum labels</a></summary>

- Fill 31 placeholders, retaining existing translations. Check rule validation,
  permissions, conflicts, unsaved-change warnings, Blockly aliases and Scrum
  roles, together with script, source order and placeholders.
- Validation: 50 translation checks and 21 human-preference checks pass. Two
  repository-wide checks fail on new card-field-visibility keys missing from
  other locales. Browser, RTL and screen-reader checks were not run.
- Technical Darija and Scrum terminology remain low confidence pending speaker
  review; remaining placeholders and the broader language audit stay open.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e1368ff32f85e0077f43ed0b309538b0b90e18fd">Translate Moroccan Arabic variables and workspace search</a></summary>

- Fill 36 placeholders, retaining existing translations. Check trimming sides,
  variable conflicts, composed workspace announcements and search shortcuts,
  together with script, source order and placeholders.
- Validation: 49 translation checks and 21 human-preference checks pass. Two
  repository-wide checks fail on new card-field-visibility keys missing from
  other locales. Browser, RTL and screen-reader checks were not run.
- Technical Darija wording remains low confidence pending speaker review;
  remaining placeholders and the broader language audit stay open.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/14c765311b05d4421fc70829ec1ad5e2845b9f16">Translate Moroccan Arabic text processing</a></summary>

- Fill 42 placeholders, retaining existing translations. Check character
  positions,
  search roles, replacement arguments and scope, counted spaces and prompt
  types,
  together with script, source order and placeholders.
- Validation: 48 translation checks and 21 human-preference checks pass. Two
  repository-wide checks fail on new card-field-visibility keys missing from
  other locales. Browser, RTL and screen-reader checks were not run.
- Technical Darija wording remains low confidence pending speaker review;
  remaining placeholders and the broader language audit stay open.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1c7ace6c4d7b65e9e1711738d3d41aaa38d5f210">Translate Moroccan Arabic navigation and letter case</a></summary>

- Fill 37 placeholders, retaining existing translations. Check movement and
  scrolling directions, block-sequence ends, page navigation, append arguments
  and letter case, together with script, source order and placeholders.
- Validation: 47 translation checks and 21 human-preference checks pass. Two
  repository-wide checks fail on new card-field-visibility keys missing from
  other locales. Browser, RTL and screen-reader checks were not run.
- Technical Darija wording remains low confidence pending speaker review;
  remaining placeholders and the broader language audit stay open.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5b7f2d18d89c4d2ed35f6a607def4cdf96c9bdfe">Translate Moroccan Arabic procedures and accessibility controls</a></summary>

- Fill 39 placeholders, retaining existing translations. Check return values,
  disabled definitions, duplicate parameters, function-only blocks,
  screen-reader
  toggles and rename scope, together with script, source order and placeholders.
- Validation: 46 translation checks and 21 human-preference checks pass. Two
  repository-wide checks fail on new card-field-visibility keys missing from
  other locales. Browser, RTL and screen-reader checks were not run.
- Technical Darija wording remains low confidence pending speaker review;
  remaining placeholders and the broader language audit stay open.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a788bb5a711b77d1f4d2984c9c7db279dc119048">Translate Moroccan Arabic functions and workspace controls</a></summary>

- Fill 43 placeholders, retaining existing translations. Check rounding,
  logarithm bases, inverse functions, angle units, minimap navigation and
  variable types, together with script, source order and placeholders.
- Validation: 45 translation checks and 21 human-preference checks pass. Two
  repository-wide checks fail on new card-field-visibility keys missing from
  other locales. Browser, RTL and screen-reader checks were not run.
- Technical Darija wording remains low confidence pending speaker review;
  remaining placeholders and the broader language audit stay open.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/10be25a37d848b03722354af8ec2163ee1acf7de">Translate Moroccan Arabic math and statistics</a></summary>

- Fill 50 placeholders, retaining existing translations. Check random bounds,
  constraint arguments, angle units, exponent roles, remainder, statistics and
  constant formulas, together with script, source order and placeholders.
- Validation: 44 translation checks and 21 human-preference checks pass. Two
  repository-wide checks fail on new card-field-visibility keys missing from
  other locales. Browser, RTL and screen-reader checks were not run.
- Technical Darija wording remains low confidence pending speaker review;
  remaining placeholders and the broader language audit stay open.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f215e0c16b9044d15260f766fd551db2a7661cd6">Translate Moroccan Arabic sorting and logic</a></summary>

- Fill 46 placeholders, retaining existing translations. Check comparison
  boundaries, negation, conditional branches, logical operators, sorting a copy,
  joining and splitting, plus script, source order and placeholder inventories.
- Validation: 43 translation checks and 21 human-preference checks pass. Two
  repository-wide checks fail on new card-field-visibility keys missing from
  other locales. Browser, RTL and screen-reader checks were not run.
- Technical Darija wording remains low confidence pending speaker review;
  remaining placeholders and the broader language audit stay open.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f64e7e8e950e94192a33546be4114bca209040b2">Translate Moroccan Arabic list retrieval and removal</a></summary>

- Fill 42 placeholders, retaining existing translations. Check retrieval/removal
  distinctions, copied sublists and reversal, not-found results, repetition
  arguments and insertion bounds, plus script, key order and source tokens.
- Validation: 42 translation checks and 21 human-preference checks pass. Two
  repository-wide checks fail on new card-field-visibility keys missing from
  other locales. Browser, RTL and screen-reader checks were not run.
- Technical Darija wording remains low confidence pending speaker review;
  remaining placeholders and the broader dialect and semantic audit stay open.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1a902b438d5e0d5fe902da203aa269fc447620fd">Translate Moroccan Arabic numeric inputs and keyboard hints</a></summary>

- Fill 52 placeholders, retaining existing translations. Check numeric operand
  roles, bounds, coordinates, keyboard arguments, empty-list length and indexing
  direction, together with script, key order and source placeholders.
- Validation: 41 translation checks and 21 human-preference checks pass. Two
  repository-wide checks fail on new card-field-visibility keys missing from
  other locales. Browser, RTL and screen-reader checks were not run.
- Technical Darija wording remains low confidence pending speaker review;
  remaining placeholders and the broader dialect and semantic audit stay open.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b742f218f0b9a1314c49a7150bd82565ecd12b92">Translate Moroccan Arabic workspace and input labels</a></summary>

- Fill 55 placeholders, including the short bitmap-on label, preserving existing
  translations. Check opposing workspace actions, bitmap coordinates and states,
  deletion count/variable roles, list positions, source tokens and key order.
- Validation: 40 translation checks and 21 human-preference checks pass. Two
  repository-wide checks fail on new card-field-visibility keys missing from
  other locales. Browser, RTL and screen-reader checks were not run.
- Technical Darija wording remains low confidence pending speaker review;
  remaining placeholders and the broader dialect and semantic audit stay open.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1c75103101298595a42586425d5baa81994465a6">Translate Moroccan Arabic Blockly loops and conditions</a></summary>

- Fill 24 placeholders while retaining existing translations. Check break versus
  continue, loop restrictions, true/false conditions, final else branches, count
  argument ordering, Arabic script and source placeholders.
- Validation: 39 translation checks and 21 human-preference checks pass. Two
  repository-wide checks fail on new card-field-visibility keys missing from
  other locales. Browser, RTL and screen-reader checks were not run.
- Technical Darija wording remains low confidence pending speaker review;
  remaining placeholders and the broader language audit are unfinished.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ec526a4d375104d48f66f80e7e761ee9a59e107b">Translate Moroccan Arabic Blockly colours and controls</a></summary>

- Fill 20 Blockly placeholders and two new card-field labels, preserving
  existing translations, colour ranges and deletion restrictions.
- Technical wording remains low confidence pending speaker review.
- 38 checks and 21 human-preference checks pass. Two repository-wide checks
  fail because other locales lack the new card-field-visibility source keys.
  Browser and RTL checks were not run. The broader audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a2bec960086f30e3bc6536f8ebd3781fb8e9cfe0">Translate Turkmen short labels and keyboard names</a></summary>

- Fill 38 English-identical labels, preserving existing translations, key
  markings, ordinal roles, on/off states and consistent control clauses.
- Technical wording remains low confidence pending speaker review.
- All 65 translation checks and 21 human-preference checks pass. Browser and
  screen-reader checks were not run. The broader translation audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/da438435d6a735bf36e9060ef6cd99f5b0e3ded9">Translate Turkmen notification recovery controls</a></summary>

- Fill 27 Turkmen placeholders, preserving existing translations, retry
  boundaries, pending work and irreversible cancellation warnings.
- Remove the obsolete custom-colors-in-use entry after its English source was
  removed.
- Technical wording remains low confidence pending speaker review.
- All 64 translation checks and 21 human-preference checks pass. Browser
  checks were not run. Further translations and the audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2b5a9d95bfa43579f69d202db45e348e6d64c89b">Translate Turkmen Sync diagnostics and mail failures</a></summary>

- Fill 20 Turkmen placeholders, preserving existing translations, access
  requirements, null semantics, hour units and delivery uncertainty.
- Technical wording remains low confidence pending speaker review.
- 60 checks and 21 human-preference checks pass. Two repository-wide checks
  fail because other locales lack the new custom-colors-in-use source key.
  Browser checks were not run. Further translations and the audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dc45288dfdf4f982a6c9349121e4061128961699">Translate Turkmen Sync previews and run reports</a></summary>

- Fill 29 Turkmen placeholders, preserving existing translations, report
  limits, retention, hidden values and no-resume/no-undo warnings.
- Technical wording remains low confidence pending speaker review.
- 59 checks and 21 human-preference checks pass. Two repository-wide checks
  fail because other locales lack the new custom-colors-in-use source key.
  Browser checks were not run. Further translations and the audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e2ee5d94b7188cc615d97e7f6d1bc40c4d9c251d">Translate Turkmen Sync conflicts</a></summary>

- Fill 23 Turkmen placeholders, preserving existing translations, local
  content, unchanged subcards, replacement reuse and partial-review guidance.
- Technical wording remains low confidence pending speaker review.
- 58 checks and 21 human-preference checks pass. Two repository-wide checks
  fail because other locales lack the new custom-colors-in-use source key.
  Browser checks were not run. Further translations and the audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/86d5255294e42b44c8d0a416d301f36ec9c7276c">Translate Turkmen daily observations and import status</a></summary>

- Fill 13 Turkmen placeholders, preserving existing translations, UTC
  sampling, omitted days, unknown estimates and export distinctions.
- Technical wording remains low confidence pending speaker review.
- 56 checks and 21 human-preference checks pass. Two repository-wide checks
  fail because other locales lack the new custom-colors-in-use source key.
  Browser checks were not run. Further translations and the audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d7de79a25f67326cbc9f45bf9294b29f323daaa8">Translate Turkmen sprint events and reports</a></summary>

- Fill 35 Turkmen placeholders, preserving existing translations, unknown
  estimates, comparable units, membership retention and partial-report scope.
- Technical wording remains low confidence pending speaker review.
- 55 checks and 21 human-preference checks pass. Two repository-wide checks
  fail because other locales lack the new custom-colors-in-use source key.
  Browser checks were not run. Further translations and the audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c58ae5f9d57f6d0afd0de128686c86a9a9317271">Translate Turkmen Scrum planning</a></summary>

- Fill 36 Turkmen placeholders, preserving existing translations, completion
  policies, sprint actions, estimate sources and units.
- Technical wording remains low confidence pending speaker review.
- 54 checks and 21 human-preference checks pass. Two repository-wide checks
  fail because other locales lack the new custom-colors-in-use source key.
  Browser checks were not run. Further translations and the audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9df0ea9aa949c810d3075f51949a9cd8c3e1231e">Translate Turkmen workspace announcements and rule editor</a></summary>

- Fill 40 Turkmen placeholders, preserving existing translations, composed
  counts, search shortcuts and rule-validation/conflict/permission guidance.
- Technical wording remains low confidence pending speaker review.
- 52 checks and 21 human-preference checks pass. Two repository-wide checks
  fail because other locales lack the new custom-colors-in-use source key.
  Browser and screen-reader checks were not run. The broader audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c8ad1c5c33718c0128a818b14c77932cf1f83e2b">Translate Turkmen text values and variable assignments</a></summary>

- Fill 31 Turkmen placeholders, preserving existing translations, replacement
  roles, whitespace boundaries and assignment/collision distinctions.
- Technical wording remains low confidence pending speaker review.
- 51 checks and 21 human-preference checks pass. Two repository-wide checks
  fail because other locales lack the new custom-colors-in-use source key.
  Browser checks were not run. Further translations and the audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2ccb33ae8c23e2ffcfd35dcf84a2d78c723a62e8">Translate Turkmen text operations and search</a></summary>

- Fill 37 Turkmen placeholders, preserving existing translations, letter
  case, operand roles, character positions and not-found results.
- Technical wording remains low confidence pending speaker review.
- All 52 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further Turkmen translations and the broader audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2f718b75cf5fb69817ce354e9da7d73657938a38">Translate Turkmen accessibility shortcuts</a></summary>

- Fill 41 Turkmen placeholders, preserving existing translations, screen-reader
  states, movement versus scrolling and navigation endpoints.
- Technical wording remains low confidence pending speaker review.
- All 51 focused checks and 21 human-preference checks pass. Browser and
  screen-reader checks were not run. Further translations and the audit
  continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cbaf5b65fe137541c1fa0d5c22bbfff6c25d4c87">Translate Turkmen variables and function controls</a></summary>

- Fill 36 Turkmen placeholders, preserving existing translations, return-value
  distinctions, disabled-definition warnings, scope restrictions and input
  types.
- Technical wording remains low confidence pending speaker review.
- All 50 focused checks and 21 human-preference checks pass. Browser and
  screen-reader checks were not run. Further translations and the audit
  continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/be9ba700ef477d7b4acc8a952a2b5af202ac3e64">Translate Turkmen mathematical functions and workspace controls</a></summary>

- Fill 27 Turkmen placeholders, preserving existing translations, logarithm
  bases, sign reversal, angle units and variable-type distinctions.
- Mathematical terminology remains low confidence pending speaker review.
- All 49 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further Turkmen translations and the broader audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2cf0ad7e2e6909c0ee9191e24b438607b2db15c9">Translate Turkmen statistics and rounding</a></summary>

- Fill 29 Turkmen placeholders, preserving existing translations, aggregate
  distinctions, random-number bounds, rounding directions and logarithm bases.
- Mathematical terminology remains low confidence pending speaker review.
- All 48 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further Turkmen translations and the broader audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/31138d20fd6aba234df707a00099db3fae69bd36">Translate Turkmen arithmetic and number properties</a></summary>

- Fill 29 Turkmen placeholders, preserving existing translations, constants,
  formulas, degree units, inclusive bounds and number-property distinctions.
- Mathematical terminology remains low confidence pending speaker review.
- All 47 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further Turkmen translations and the broader audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/45ae3addd696f38dbd5b505c6046bb840543c145">Translate Turkmen comparisons and Boolean logic</a></summary>

- Fill 33 Turkmen placeholders, preserving existing translations, equality
  boundaries, negation, Boolean conditions and text/list conversion roles.
- Technical wording remains low confidence pending speaker review.
- All 46 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further Turkmen translations and the broader audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2c5cb11dc663a487b632d9b54ee5ebf9ab8dbe9f">Translate Turkmen list search, updates and sorting</a></summary>

- Fill 31 Turkmen placeholders, preserving existing translations, missing-item
  results, insertion versus assignment, sort directions and letter-case
  handling.
- Technical wording remains low confidence pending speaker review.
- All 45 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further Turkmen translations and the broader audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/599bc52e66a1fbad9f969b496c9a1e26d8cac012">Translate Turkmen list retrieval and removal</a></summary>

- Fill 33 Turkmen placeholders, preserving existing translations, retrieval
  and removal distinctions, copied sublists and indexing from the end.
- Technical wording remains low confidence pending speaker review.
- All 44 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further Turkmen translations and the broader audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/24f9ccac4e79d4acfbc86f185e9835641c784616">Translate Turkmen math inputs and keyboard navigation</a></summary>

- Fill 38 Turkmen placeholders, preserving existing translations, operand
  distinctions, coordinates, search/replacement roles and shortcut instructions.
- Technical wording remains low confidence pending speaker review.
- All 43 focused checks and 21 human-preference checks pass. Browser and
  screen-reader checks were not run. Further translations and the audit
  continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8bd132753a6cc80c177f563057ba4a987a6b313e">Translate Turkmen editing and input labels</a></summary>

- Fill 44 Turkmen placeholders, preserving existing translations, bitmap
  coordinates, opposite actions, input roles and keyboard hints.
- Technical wording remains low confidence pending speaker review.
- All 42 focused checks and 21 human-preference checks pass. Browser and
  screen-reader checks were not run. Further translations and the audit
  continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4926db94320f05628b5062081dd5940cb035ffd1">Translate Turkmen loops, conditions and editing</a></summary>

- Fill 35 Turkmen placeholders, preserving existing translations, loop
  conditions, fallback branches, operand roles and editing distinctions.
- Technical wording remains low confidence pending speaker review.
- All 41 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further Turkmen translations and the broader audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/21248c01f1675095dc40012dc2a8d4e502578384">Translate Turkmen Blockly colours and controls</a></summary>

- Fill 24 Turkmen placeholders, preserving existing translations, colour
  ranges, deletion restrictions, warnings and loop-control distinctions.
- Technical wording remains low confidence pending speaker review.
- All 40 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further Turkmen translations and the broader audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f0282acf1e40cbbc50d1ff05d90631aa7755092f">Translate Konkani short rule and board labels</a></summary>

- Fill nine English-identical labels, preserving existing translations and
  distinguishing sorting, actors, recipients and totals.
- Assembled sentence order remains low confidence pending speaker review.
- All 75 focused checks and 21 human-preference checks pass. Browser checks
  were not run. The broader translation and fluency audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9ae6dc8b6a9ed4c975beacec804dc361c5c79842">Translate Konkani keyboard names and short Blockly labels</a></summary>

- Fill 27 English-identical values, preserving existing translations,
  recognizable key markings, ordinal roles and control-clause distinctions.
- Technical wording remains low confidence pending speaker review.
- All 74 focused checks and 21 human-preference checks pass. Browser and
  screen-reader checks were not run. Further translations and the audit
  continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/71691a17bd7820a567340243eb2027eef1621838">Translate remaining Konkani storage and system labels</a></summary>

- Fill 33 English-identical values omitted by the fill tool, preserving
  existing translations, service names, endpoint examples and identifiers.
- Technical wording remains low confidence pending speaker review.
- All 73 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further Konkani translations and the broader audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/510e137fadab8cc9f294384bb7a8d02196e2f7d6">Translate Konkani notification recovery controls</a></summary>

- Fill 27 Konkani placeholders, preserving existing translations, retry
  boundaries, pending work, recipient restrictions and cancellation warnings.
- Technical wording remains low confidence pending speaker review.
- All 71 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further Konkani translations and the broader audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e1eea3f44d6ccdd8613ad451adf5ca66af7b0ad1">Translate Konkani Sync reports and mail diagnostics</a></summary>

- Fill 31 Konkani placeholders, preserving existing translations, retention
  limits, uncertain outcomes, null semantics and mail-delivery warnings.
- Technical wording remains low confidence pending speaker review.
- All 69 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further Konkani translations and the broader audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/19ec736e3ca23d4252123226e2f4e24ffcab44ea">Translate Konkani Sync conflicts and previews</a></summary>

- Fill 41 Konkani placeholders, preserving existing translations, local-content
  retention, replacement reuse, preview limits and source-omission guidance.
- Technical wording remains low confidence pending speaker review.
- All 67 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further Konkani translations and the broader audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c7cfd79d127f3361921b96f6663051de367afdb1">Translate Konkani sprint reports and daily observations</a></summary>

- Fill 36 Konkani placeholders, preserving existing translations, unknown
  estimates, partial-report limits, UTC sampling and export distinctions.
- Technical wording remains low confidence pending speaker review.
- All 64 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further Konkani translations and the broader audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a76cdf9ffdc5e57b2ec3ba68f0125d1010f4d097">Translate Konkani Scrum planning and roles</a></summary>

- Fill 48 Konkani placeholders, preserving existing translations, completion
  policy distinctions, sprint actions, estimate units and planning events.
- Technical wording remains low confidence pending speaker review.
- All 62 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further Konkani translations and the broader audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4cb8d596b8e0926f9e72e46aecacf1a220dd0ff7">Translate Konkani workspace announcements and rule editor</a></summary>

- Fill 40 Konkani placeholders, preserving existing translations, composed
  counts, search shortcuts and rule-validation, conflict and permission
  guidance.
- Technical wording remains low confidence pending speaker review.
- All 60 focused checks and 21 human-preference checks pass. Browser and
  screen-reader checks were not run. Further translations and the audit
  continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4d73ddf7f3dd490418c17b29c2f77ec187d7e071">Translate Konkani text search and variable assignments</a></summary>

- Fill 47 Konkani placeholders, preserving existing translations, not-found
  results, replacement operands, whitespace boundaries and collision warnings.
- Technical wording remains low confidence pending speaker review.
- All 58 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further Konkani translations and the broader audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/094a925dd4d9317c766feed1600e81f3ba533045">Translate Konkani accessibility shortcuts and text controls</a></summary>

- Fill 67 Konkani placeholders, preserving existing translations, screen-reader
  mode states, navigation distinctions and text operand roles.
- Technical wording remains low confidence pending speaker review.
- All 56 focused checks and 21 human-preference checks pass. Browser and
  screen-reader checks were not run. Further translations and the audit
  continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fd29791d086dc3b917ea5b619fa8836d04b31b10">Translate Konkani workspace navigation and functions</a></summary>

- Fill 34 Konkani placeholders, preserving existing translations, return-value
  distinctions, typed variables and disabled-definition warnings.
- Technical terminology remains low confidence pending speaker review.
- All 54 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further Konkani translations and the broader audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/294faaff6a351e087234b4e18bc62094edd859f8">Translate Konkani powers, logarithms and trigonometry</a></summary>

- Fill 29 Konkani placeholders, preserving existing translations, logarithm
  bases,
  sign reversal and degree-versus-radian caveats.
- Mathematical terminology remains low confidence pending speaker review.
- All 53 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further Konkani translations and the broader audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/302f99524ee1e1ad33cfd0e7be659491c0944850">Translate Konkani statistics and random-number bounds</a></summary>

- Fill 24 Konkani placeholders, preserving existing translations, statistical
  distinctions, random-number bounds and rounding directions.
- Statistical terminology remains low confidence pending speaker review.
- All 52 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further Konkani translations and the broader audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b7e59a922dc9f7cd4cdab951a7c05181ffb86a28">Translate Konkani constants and number properties</a></summary>

- Fill 21 Konkani values, preserving existing translations, mathematical
  constants,
  inclusive limits and remainder operands.
- Mathematical terminology remains low confidence pending speaker review.
- All 51 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further Konkani translations and the broader audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f1a4f2d7a1613b545cbc38ce0b2fe2c1875b9fe0">Translate Konkani logic and arithmetic controls</a></summary>

- Fill 22 Konkani values, preserving existing translations, Boolean conditions,
  coordinate roles, angle bounds and mathematical identifiers.
- Technical wording remains low confidence pending speaker review.
- All 50 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further Konkani translations and the broader audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7cdc7754dd0ecd29e6f8c329938f94165bffa9b1">Translate Konkani list conversion and comparisons</a></summary>

- Fill 24 Konkani placeholders, preserving existing translations, delimiter
  behavior, inclusive comparisons and Boolean negation.
- Technical wording remains low confidence pending speaker review.
- All 49 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further Konkani translations and the broader audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/92a962fbebb4f96001dd82729464e6db9c053710">Translate Konkani list search, editing and sorting</a></summary>

- Fill 27 Konkani placeholders, preserving existing translations, return tokens,
  repetition roles, copy behavior and distinct list-editing actions.
- Technical wording remains low confidence pending speaker review.
- All 48 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further Konkani translations and the broader audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/91240780fa590bbe281cebf66b307a79b872aaee">Translate Konkani list retrieval and removal</a></summary>

- Fill 23 Konkani values, preserving existing translations,
  return-versus-removal
  semantics, index markers and copy behavior.
- Technical wording remains low confidence pending speaker review.
- All 47 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further Konkani translations and the broader audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ca54f57cbc7fcbedfe9c557bd4141d09c10c030a">Translate Konkani keyboard navigation and list creation</a></summary>

- Fill 24 Konkani placeholders, preserving existing translations, key-token
  roles,
  empty-list length, index markers and retrieval actions.
- Technical wording remains low confidence pending speaker review.
- All 46 focused checks and 21 human-preference checks pass. Browser and
  screen-reader checks were not run. The broader translation audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/46356156ddc472038ba6399f5d67cbd9dd380bbf">Translate Konkani mathematical and text input labels</a></summary>

- Fill 32 Konkani placeholders, preserving existing translations, coordinate
  axes,
  operand roles, indexed values and start/end positions.
- Technical wording remains low confidence pending speaker review.
- All 45 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further Konkani translations and the broader audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c3f1c873f90c1d3a0cbf51f73382f348ea1e07a8">Translate Konkani input and accessibility labels</a></summary>

- Fill 29 Konkani placeholders, preserving existing translations, field tokens,
  opposite actions and distinct list inputs.
- Technical wording remains low confidence pending speaker review.
- All 44 focused checks and 21 human-preference checks pass. Browser and
  screen-reader checks were not run. The broader translation audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/48aa6dca0aac8c571f65e2a44dbb7bfa2c245ebb">Translate Konkani block editing and bitmap controls</a></summary>

- Fill 25 Konkani values, preserving existing translations, deletion counts,
  variable names, bitmap coordinates and opposite actions.
- Technical wording remains low confidence pending speaker review.
- All 43 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further Konkani translations and the broader audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/938baddde2a0d758359f7bbe814146da29110c8c">Translate Konkani loops and conditional controls</a></summary>

- Fill 27 Konkani values, preserving existing translations, indexed loop roles,
  true/false conditions and fallback branches.
- Technical terminology remains low confidence pending speaker review.
- All 42 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further Konkani translations and the broader audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a4f122cd67104a33b93ebd8433d4fd35342e8f62">Translate Konkani Blockly colours and block controls</a></summary>

- Fill 20 Konkani placeholders, preserving existing translations, colour bounds
  and indexed variable/function roles.
- Technical terminology remains low confidence pending speaker review.
- All 41 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further Konkani translations and the broader audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3e9d44d72916178e90ec65cb8393add1475d1ae4">Translate Maithili short rule and count fragments</a></summary>

- Fill seven English-identical labels omitted by the missing-string filter,
  preserving existing translations and recipient/count alias consistency.
- Assembled fragment wording remains low confidence pending speaker review.
- All 73 focused checks and 21 human-preference checks pass. Browser checks
  were not run. The broader translation audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b634313d8d2098e4fc2dad4df62d3b32c3074c1e">Translate Maithili keyboard announcements and short labels</a></summary>

- Fill 21 Maithili values, preserving existing translations, indexed
  announcement
  roles and the menu symbol.
- Keyboard transliterations remain low confidence pending speaker review.
- All 72 focused checks and 21 human-preference checks pass. Browser and
  screen-reader checks were not run. The broader translation audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4e5f657126f31992b486f315fb2491b01d86361a">Translate Maithili storage settings omitted by the fill filter</a></summary>

- Fill 29 English-identical Maithili values found by a full locale comparison,
  preserving existing translations, provider names and endpoint examples.
- Technical wording remains low confidence pending speaker review.
- All 71 focused checks and 21 human-preference checks pass. Browser checks
  were not run. The broader translation audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cda08470b8d0ab5402d8d4510960a667ca3c7c31">Translate Maithili email failures and notification recovery</a></summary>

- Fill 38 Maithili placeholders, preserving existing translations, retry limits,
  cancellation caveats, retained pending work and time-estimate rules.
- Technical wording remains low confidence pending speaker review.
- All 69 focused checks and 21 human-preference checks pass. Browser checks
  were not run. The broader translation audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/14b973de00507730cddb5b1dc964ba246bb62013">Translate Maithili sync reports and diagnostics</a></summary>

- Fill 21 Maithili placeholders, preserving existing translations, retention,
  write-access requirements, partial-change caveats and null handling.
- Technical wording remains low confidence pending speaker review.
- All 67 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further Maithili translations and the broader audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ded9b5029fbac53b5b86df5f0d76b464a0da44c8">Translate Maithili sync preview and source fields</a></summary>

- Fill 20 Maithili placeholders, preserving existing translations, preview
  limits,
  parser omissions and hidden source values.
- Technical wording remains low confidence pending speaker review.
- All 66 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further Maithili translations and the broader audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/581e6e773e5cded5cdd5173eaa156808b81a9b10">Translate Maithili sync conflicts and import caveats</a></summary>

- Fill 23 Maithili placeholders, preserving existing translations, local data,
  unchanged subcards, review scope and import limitations.
- Technical wording remains low confidence pending speaker review.
- All 65 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further Maithili translations and the broader audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9e8efbbc5f5652f20558d8073d818040d872b6fa">Translate Maithili sprint observations and partial reports</a></summary>

- Fill 21 Maithili placeholders, preserving existing translations, UTC,
  observation limits, source-reference tokens and partial-report caveats.
- Technical wording remains low confidence pending speaker review.
- All 63 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further Maithili translations and the broader audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6efc6ccc1e94cac087a3c5c33e6458ff338d14a4">Translate Maithili sprint reports and planning messages</a></summary>

- Fill 30 Maithili placeholders, preserving existing translations, minute units,
  report tokens, sprint states and unknown-versus-zero estimates.
- Scrum terminology remains low confidence pending speaker review.
- All 62 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further Maithili translations and the broader audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e52c9e9e0da1805b5d134f402ecb092a2c937e80">Translate Maithili Scrum settings and sprint labels</a></summary>

- Fill 30 Maithili placeholders, preserving existing translations, numeric-field
  meaning, completion policies and distinct sprint actions.
- Scrum terminology remains low confidence pending speaker review.
- All 61 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further Maithili translations and the broader audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dc9b4d721109ee092bfd77c1b3a29206191bfda1">Translate Maithili Blockly aliases and rule editor</a></summary>

- Fill 25 Maithili values, preserving existing translations, rule validation,
  administrator permissions and repeated Blockly labels.
- Technical wording remains low confidence pending speaker review.
- All 59 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further Maithili translations and the broader audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e68355df82b6d9f257e9b0c11f285671f024aa8a">Translate Maithili variable warnings and workspace search</a></summary>

- Fill 28 Maithili values, preserving existing translations, name/type roles,
  workspace counts, comment tokens and search-key names.
- Technical wording remains low confidence pending speaker review.
- All 58 focused checks and 21 human-preference checks pass. Browser and
  screen-reader checks were not run. The broader translation audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2b01fd9903ebc466a8758f42d8cb9d5edf241628">Translate Maithili text processing and input prompts</a></summary>

- Fill 25 Maithili placeholders, preserving existing translations, replacement
  roles, all-occurrence behavior and whitespace handling.
- Technical wording remains low confidence pending speaker review.
- All 57 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further Maithili translations and the broader audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/462e4eaf199d8e5aed0986006ff933693dcad76c">Translate Maithili substrings and text search</a></summary>

- Fill 24 Maithili placeholders, preserving existing translations, search/count
  roles, character indices and missing-match return tokens.
- Technical wording remains low confidence pending speaker review.
- All 56 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further Maithili translations and the broader audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/03f4c03a109ac4e0f0e57e92a2c061e4d2b69be2">Translate Maithili shortcuts and text case</a></summary>

- Fill 24 Maithili placeholders, preserving existing translations, append roles,
  character indices, copy semantics and letter-case distinctions.
- Technical wording remains low confidence pending speaker review.
- All 55 focused checks and 21 human-preference checks pass. Browser and
  screen-reader checks were not run. The broader translation audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cbed22e4e8e2f0a0cddde00105e5f5316859f419">Translate Maithili screen-reader and shortcut labels</a></summary>

- Fill 29 Maithili placeholders, preserving existing translations, toggle-key
  tokens and distinct navigation actions.
- Technical wording remains low confidence pending speaker review.
- All 54 focused checks and 21 human-preference checks pass. Browser and
  screen-reader checks were not run. The broader translation audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cfa8ed7ba7ed02eaba7408e9ebe3f4932fe4470d">Translate Maithili procedure and rename controls</a></summary>

- Fill 25 Maithili values, preserving existing translations, function-name
  tokens,
  output distinctions and disabled-definition warnings.
- Technical wording remains low confidence pending speaker review.
- All 53 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further Maithili translations and the broader audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d0883d9463bf581165b2910ffcea49aa9ea40c7d">Translate Maithili trigonometry and variable controls</a></summary>

- Fill 26 Maithili placeholders, preserving existing translations, angle units,
  distinct variable types and parent-block tokens.
- Technical terminology remains low confidence pending speaker review.
- All 52 focused checks and 21 human-preference checks pass. Browser and
  screen-reader checks were not run. The broader translation audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/63c0ad6116e53d8ed0fe1c3dd6a6ad616f829260">Translate Maithili rounding and random numbers</a></summary>

- Fill 24 Maithili placeholders, preserving existing translations, random
  bounds,
  indexed limits, logarithm bases and rounding directions.
- Mathematical terminology remains low confidence pending speaker review.
- All 51 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further Maithili translations and the broader audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/51478845345a7c81003c0f9f4c7c7c319c1fb8c1">Translate Maithili statistical functions</a></summary>

- Fill 24 Maithili placeholders, preserving existing translations, remainder
  operands and distinctions between statistical functions.
- Statistical terminology remains low confidence pending speaker review.
- All 50 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further Maithili translations and the broader audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3f3d5e7bb70f874ff2f2c2aa89867a636763cb08">Translate Maithili arithmetic and number properties</a></summary>

- Fill 28 Maithili values, preserving existing translations, numeric constants,
  coordinate roles, angle bounds and inclusive limits.
- Technical wording remains low confidence pending speaker review.
- All 49 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further Maithili translations and the broader audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ed7d6dd234f49992f21cadcc6a81c9a7b3266a42">Translate Maithili logic controls and comparisons</a></summary>

- Fill 25 Maithili values, preserving existing translations, inclusive
  comparisons,
  Boolean distinctions, conditional labels and tokens.
- Technical wording remains low confidence pending speaker review.
- All 48 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further Maithili translations and the broader audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d02a70b51116e7bf5444e321b1dc4dbee28dbcc5">Translate Maithili list editing and sorting</a></summary>

- Fill 28 Maithili values, preserving existing translations, item/count tokens,
  copy semantics and case-insensitive sorting meaning.
- Technical wording remains low confidence pending speaker review.
- All 47 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further Maithili translations and the broader audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a3ceff24c25dbc34589fbc231a9cd28873f1d3be">Translate Maithili list removal and indexing</a></summary>

- Fill 26 Maithili values, preserving existing translations, index markers,
  missing-item return tokens and distinct removal operations.
- Technical wording remains low confidence pending speaker review.
- All 46 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further Maithili translations and the broader audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/16e62e04bbd688dcec517e775f1f48ebde007b13">Translate Maithili list creation and keyboard navigation</a></summary>

- Fill 29 Maithili placeholders, preserving existing translations, indexed key
  roles, empty-list length and distinct list actions.
- Technical wording remains low confidence pending speaker review.
- All 45 focused checks and 21 human-preference checks pass. Browser and
  screen-reader checks were not run. The broader translation audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bd3133c6fd30635461db1da61abb982d064ab8cb">Translate Maithili mathematical and text input labels</a></summary>

- Fill 32 Maithili placeholders, preserving existing translations, coordinate
  axes,
  operand roles, indexed values and start/end positions.
- Technical wording remains low confidence pending speaker review.
- All 44 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further Maithili translations and the broader audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/32c0635c52d7272f113c2d64dbcbbecf0d21f501">Translate Maithili input and accessibility labels</a></summary>

- Fill 34 Maithili values, preserving existing translations, coordinate roles,
  repetition counts and distinct open/close actions.
- Technical wording remains low confidence pending speaker review.
- All 43 focused checks and 21 human-preference checks pass. Browser and
  screen-reader checks were not run. The broader translation audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/46ea73e57b6c439f3301c4111aa926c857cc301c">Translate Maithili conditions and block editing</a></summary>

- Fill 36 Maithili values, preserving existing translations, conditional
  branches,
  true/false loop conditions and indexed deletion tokens.
- Technical wording remains low confidence pending speaker review.
- All 42 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further Maithili translations and the broader audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fe596305d1f651d5d4788cc920435a64f00c37c2">Translate Maithili Blockly colours and loop controls</a></summary>

- Fill 31 Maithili placeholders, preserving existing translations, colour
  bounds,
  indexed tokens and loop-control distinctions.
- Technical terminology remains low confidence pending speaker review.
- All 41 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further Maithili translations and the broader audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/28b48d42d237b4e80875e0d90f0662a2e489dc62">Translate Odia short labels and keyboard announcements</a></summary>

- Fill 37 Odia labels, including 19 English values excluded by the usual
  missing-string filter. Preserve tokens, menu symbols and index markers.
- Keyboard transliterations and technical wording remain low confidence pending
  speaker review.
- All 74 focused checks and 21 human-preference checks pass. Browser and
  screen-reader checks were not run. The broader translation audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/863ccf49f39a686604bc99d3f0ae092e9de54c85">Translate Odia email failures and notification recovery</a></summary>

- Fill 36 Odia placeholders, preserving existing translations, SMTP identifiers,
  retry limitations, retained work and irreversible cancellation caveats.
- Technical wording remains low confidence pending speaker review.
- All 73 focused checks and 21 human-preference checks pass. Browser checks
  were not run. The broader translation audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/13e2c96b79a4b451de8946a538be75e340b9e205">Translate Odia sync diagnostics and estimate mapping</a></summary>

- Fill 12 Odia placeholders, preserving existing translations, report access,
  retention, hour units and missing-versus-null behavior.
- Technical wording remains low confidence pending speaker review.
- All 71 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further Odia translations and the broader audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/630cd35b4b5d17a5cc2183925d33f5b3232e3af4">Translate Odia source omissions and sync reports</a></summary>

- Fill 18 Odia source and sync-report placeholders, preserving existing
  translations,
  report limits, hidden values and partial-change caveats.
- Technical wording remains low confidence pending speaker review.
- All 70 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further Odia translations and the broader audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cd9c4a3e3bf906151d6706071e1411329723e1b8">Translate Odia sync preview guidance</a></summary>

- Fill 18 Odia sync-preview placeholders, preserving existing translations,
  replacement reuse, preview limits and parser omission caveats.
- Technical wording remains low confidence pending speaker review.
- All 69 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further Odia translations and the broader audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1039789a4b67ccdff50bf199069fcc3eb733011b">Translate Odia sync conflict guidance</a></summary>

- Fill 16 Odia Scrum-import and sync-conflict placeholders, preserving existing
  translations, source-write restrictions, review scope and local data
  retention.
- Technical wording remains low confidence pending speaker review.
- All 68 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further Odia translations and the broader audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c1fc0c0fd22be5b2d94179a3c5b5172d641b24b1">Translate Odia sprint lifecycle and observations</a></summary>

- Fill 25 Odia sprint and observation placeholders, preserving existing
  translations,
  partial-report restrictions, UTC days, observation limits and unknown
  estimates.
- Technical wording remains low confidence pending speaker review.
- All 66 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further Odia translations and the broader audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/843339b916a2d5e483bfc7cf9cd8493b0bb00c4b">Translate Odia sprint reports and events</a></summary>

- Fill 30 Odia sprint-report and event placeholders, preserving existing
  translations,
  report counts, minute units and unknown-estimate caveats.
- Technical wording remains low confidence pending speaker review.
- All 65 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further Odia translations and the broader audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5c5bf6c1418a9fba54607486f7e41432c83bc609">Translate Odia Scrum planning settings</a></summary>

- Fill 28 Odia Scrum planning placeholders, preserving existing translations,
  role and completion-policy distinctions and separate sprint actions.
- Technical wording remains low confidence pending speaker review.
- All 64 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further Odia translations and the broader audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5b693f3276fc3578e3a2465be0c575d39149da62">Translate Odia rule editor guidance</a></summary>

- Fill nine Odia rule-editor placeholders, preserving existing translations,
  validation rules, administrator permissions and reload-before-save guidance.
- Technical wording remains low confidence pending speaker review.
- All 62 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further Odia translations and the broader audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/10a806b11a8f0a427405a1a685684d3ae24a895a">Translate Odia workspace search and shared block labels</a></summary>

- Fill 21 Odia search and block-label placeholders, preserving existing
  translations,
  keyboard shortcuts, match counts and shared label consistency.
- Technical wording remains low confidence pending speaker review.
- All 61 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further Odia translations and the broader audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/49412e659e4382931b7858aed698212e8f89089a">Translate Odia variable warnings and workspace counts</a></summary>

- Fill 19 Odia variable and workspace placeholders, preserving existing
  translations,
  variable references, count distinctions and comment suffix spacing.
- Technical wording remains low confidence pending speaker review.
- All 60 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further Odia translations and the broader audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bfd3deea1f2895094e935147527d8c8185b9d2d0">Translate Odia text replacement and whitespace messages</a></summary>

- Fill 21 Odia text-processing placeholders, preserving existing translations,
  replacement operand roles, all-occurrence semantics and whitespace behavior.
- Technical wording remains low confidence pending speaker review.
- All 59 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further Odia translations and the broader audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cce628eb04004338f812319b35a360dc0e7e8e06">Translate Odia text joining and substring messages</a></summary>

- Fill 22 Odia text-building and substring placeholders, preserving existing
  translations, position markers, search operand roles and not-found return
  values.
- Technical wording remains low confidence pending speaker review.
- All 58 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further Odia translations and the broader audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cf51fdde3bfd4d9d0e25bf5e869f4267feaf56e3">Translate Odia text case and character selection</a></summary>

- Fill 20 Odia shortcut and text-operation placeholders, preserving existing
  translations, letter case, copy semantics and indexed operand roles.
- Technical wording remains low confidence pending speaker review.
- All 57 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further Odia translations and the broader audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a1c1b3c713cbe246f1b3134a93ee89049cd53c6e">Translate Odia directional keyboard shortcuts</a></summary>

- Fill 22 Odia navigation placeholders, preserving existing translations,
  consistent directions and distinct movement and scrolling actions.
- Technical wording remains low confidence pending speaker review.
- All 56 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further Odia translations and the broader audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0e8feb9aab550b0c3f28521508d4df556f73d4a9">Translate Odia screen-reader and shortcut commands</a></summary>

- Fill 21 Odia accessibility and shortcut placeholders, preserving existing
  translations, variable references and screen-reader state/action distinctions.
- Technical wording remains low confidence pending speaker review.
- All 55 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further Odia translations and the broader audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d3f1bb708b7b2dc56b729231d58304727609f4c0">Translate Odia procedure definitions and calls</a></summary>

- Fill 22 Odia procedure and paste-action placeholders, preserving existing
  translations, function names, output distinctions and procedure restrictions.
- Technical wording remains low confidence pending speaker review.
- All 54 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further Odia translations and the broader audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bbe0210801b035a0a2bdb535ff2342bdac3c3d9d">Translate Odia trigonometry and variable creation</a></summary>

- Fill 22 Odia trigonometry and workspace placeholders, preserving existing
  translations, angle units, function abbreviations and variable types.
- Technical wording remains low confidence pending speaker review.
- All 53 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further Odia translations and the broader audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6c9916945105ac1a8213081079c7e1df5970b5df">Translate Odia rounding and mathematical functions</a></summary>

- Fill 23 Odia mathematical placeholders, preserving existing translations,
  inclusive bounds, rounding directions and function bases.
- Technical wording remains low confidence pending speaker review.
- All 52 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further Odia translations and the broader audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/23319c3f962668e39e0fec620fddee1c3ebd33d4">Translate Odia statistics and random fraction messages</a></summary>

- Fill 21 Odia statistical placeholders, preserving existing translations,
  distinct statistical operations, list-valued modes and random bounds.
- Statistical wording remains low confidence pending speaker review.
- All 51 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further Odia translations and the broader audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/760a3877c115be47c2a00d56c9ebe3557964f037">Translate Odia constants and number properties</a></summary>

- Fill 22 Odia mathematical placeholders, preserving existing translations,
  constant examples, numeric symbols and inclusive bounds.
- Technical wording remains low confidence pending speaker review.
- All 50 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further Odia translations and the broader audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b87568cd434fa104ad6cc2c7ee75b9812f468bb0">Translate Odia Boolean logic and arithmetic messages</a></summary>

- Fill 21 Odia logic and arithmetic placeholders, preserving existing
  translations,
  conditional labels, coordinate references and numeric domains.
- Technical wording remains low confidence pending speaker review.
- All 49 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further Odia translations and the broader audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2c12e8cb4539aebefd02e47f5007752a0708b916">Translate Odia sorting and comparison messages</a></summary>

- Fill 25 Odia sorting and logic placeholders, preserving existing translations,
  sort direction, copy semantics and strict versus inclusive comparisons.
- Technical wording remains low confidence pending speaker review.
- All 48 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further Odia translations and the broader audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9309fddbf65dc5e2a67c5254ada90344617c09a2">Translate Odia list search and insertion messages</a></summary>

- Fill 22 Odia list-search and insertion placeholders, preserving existing
  translations, not-found return values and operations on copied lists.
- Technical wording remains low confidence pending speaker review.
- All 47 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further Odia translations and the broader audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9fd3f94aba8969b5c2805e5c7330734086e6990f">Translate Odia list retrieval and removal tooltips</a></summary>

- Fill 20 Odia list-item and sublist placeholders, preserving existing
  translations,
  index markers and distinct retrieval and removal effects.
- Technical wording remains low confidence pending speaker review.
- All 46 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further Odia translations and the broader audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/acd7db180d6ba66f17d5871719364c6b78e35bf8">Translate Odia list creation and keyboard navigation</a></summary>

- Fill 22 Odia list and navigation placeholders, preserving existing
  translations,
  shortcut tokens, index markers and distinct selection actions.
- Technical wording remains low confidence pending speaker review.
- All 45 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further Odia translations and the broader audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a5817dc264c9660344eb693b07f6038334d6b60b">Translate Odia mathematical and text input labels</a></summary>

- Fill 29 Odia numerical and text input placeholders, preserving existing
  translations, coordinate names, indexed tokens and distinct operand roles.
- Technical wording remains low confidence pending speaker review.
- All 44 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further Odia translations and the broader audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e39de8d0995666b0e9f09ee35b2f2ce85bce4367">Translate Odia Blockly help and input labels</a></summary>

- Fill 29 Odia help and input placeholders, preserving existing translations,
  indexed tokens, open/close actions and list position distinctions.
- Technical wording remains low confidence pending speaker review.
- All 43 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further Odia translations and the broader audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8c362db0e41af6db619b283761b1b29726a68d14">Translate Odia Blockly editing and bitmap labels</a></summary>

- Fill 30 Odia editing and accessibility placeholders, preserving existing
  translations and indexed variable, count, row and column references.
- Technical wording remains low confidence pending speaker review.
- All 42 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further Odia translations and the broader audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d0c0d238f12708609aa76ff38bbf91d5550f6bc8">Translate Odia Blockly loops and conditionals</a></summary>

- Fill 20 Odia placeholders for loop controls and conditional branches,
  preserving
  existing translations, indexed tokens and true/false condition meanings.
- Technical wording remains low confidence pending speaker review.
- All 41 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further Odia translations and the broader audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/17ba35125774d597acdaf39f0068dbd9a71870ae">Translate Odia Blockly colours and controls</a></summary>

- Fill 24 Odia placeholders for Blockly colours, block operations and loop
  controls,
  preserving existing translations, format tokens and numeric bounds.
- Technical wording remains low confidence pending speaker review.
- All 40 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further Odia translations and the broader audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b781aadd36134d2f37460432d3cc2063809e4de3">Correct Tatar ZenKit import instruction</a></summary>

- Correct the missed wrong-language ZenKit instruction and restore literal JSON
  field names in its example.
- Technical wording remains low confidence pending speaker review.
- All 151 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further wrong-language corrections and the broader audit
  continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8368b6d1ebdbdd72a7f72327808d4452893aefdb">Correct Tatar flow report explanations</a></summary>

- Replace nine incomplete or wrong-language explanations with full translations,
  preserving forecast limits, date fallbacks and time adjustment caveats.
- Statistical wording remains low confidence pending speaker review.
- All 150 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further wrong-language corrections and the broader audit
  continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/11bd47aeadeef18a89421a2a973ba827c6bf2a5e">Correct Tatar WIP and flow report labels</a></summary>

- Correct 37 wrong-language or incomplete WIP and flow report labels, preserving
  statistical distinctions, day units and group meanings.
- Statistical terminology remains low confidence pending speaker review.
- All 149 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further wrong-language corrections and the broader audit
  continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b6eaa54879431d429698cd8cc3c853bb346f3db7">Correct Tatar event and import translations</a></summary>

- Correct 21 wrong-language event and import strings, preserving address labels,
  file extensions, provider names, search syntax and import selection
  restrictions.
- Technical wording remains low confidence pending speaker review.
- All 148 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further wrong-language corrections and the broader audit
  continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b667365d2cebef9fe80b0cff2b92f9a7517a2374">Correct Tatar repair status translations</a></summary>

- Correct 25 wrong-language account and repair status strings, preserving repair
  counts, failure conditions and the existing acknowledgement button label.
- Technical wording remains low confidence pending speaker review.
- All 147 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further wrong-language corrections and the broader audit
  continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bc343fd773d4d6778ab863d7ce045b56138e0bc2">Correct Tatar repository access translations</a></summary>

- Correct 31 wrong-language status, repository and account access strings,
  preserving technical labels, byte units and temporary lockout wording.
- Technical wording remains low confidence pending speaker review.
- All 146 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further wrong-language corrections and the broader audit
  continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b547ef6b26323985ba819642ff67dfea6681aa16">Correct Tatar migration threshold translations</a></summary>

- Correct 35 wrong-language migration and monitoring strings, preserving ranges,
  time units, resource identifiers and background processing notices.
- Technical wording remains low confidence pending speaker review.
- All 145 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further wrong-language corrections and the broader audit
  continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b2a4999678cd91b63cd7b2f34f4ae807a437027c">Correct Tatar job monitoring translations</a></summary>

- Correct 39 wrong-language job and migration setting strings, preserving
  storage names, resource identifiers, scheduling intervals and batch limits.
- Technical wording remains low confidence pending speaker review.
- All 144 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further wrong-language corrections and the broader audit
  continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/86ae33675f1d68608077732603c59bd7f1c9b51f">Correct Tatar migration progress translations</a></summary>

- Correct 34 wrong-language migration progress and cleanup strings, preserving
  technical identifiers, recovery targets and the continued board use notice.
- Technical wording remains low confidence pending speaker review.
- All 143 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further wrong-language corrections and the broader audit
  continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6b8beeca6ab1add014271ef7e7ded0f8cf7695b3">Correct Tatar board migration and recovery translations</a></summary>

- Correct 45 wrong-language storage and migration strings, preserving technical
  identifiers, administrator restrictions, deletion conditions and recovery
  warnings.
- Technical wording remains low confidence pending speaker review.
- All 142 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further wrong-language corrections and the broader audit
  continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/53803532fa98097a50bd0a10d25ebef4af0dc48c">Correct Tatar S3 connection and scheduling translations</a></summary>

- Correct 22 wrong-language values for S3 settings, scheduled board operations
  and migration controls, preserving hostnames, region codes and SSL/TLS labels.
- Technical wording remains low confidence pending speaker review.
- All 141 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further wrong-language corrections and the broader audit
  continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c70cb5d49165d5013d21071e8d857d44d05a12cb">Correct Tatar migration outcomes and S3 controls</a></summary>

- Correct 22 migration and S3 values, preserving service identifiers and
  distinct migration and connection outcomes.
- Technical wording remains low confidence pending speaker review.
- All 140 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further wrong-language corrections and the broader audit
  continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/48ce6a9d50eb69ef68f16ee0f52c9d09621737ab">Correct Tatar cloud status and migration controls</a></summary>

- Correct 23 cloud and migration values, preserving provider names,
  credential states and pause versus stop distinctions.
- Technical wording remains low confidence pending speaker review.
- All 139 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further wrong-language corrections and the broader audit
  continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0cf1c99b06d668eb93d3e9f83f9f7e280edc9259">Correct Tatar cloud credentials and console paths</a></summary>

- Correct 22 cloud-credential values, restoring console labels, credential
  fields
  and file extensions from English. External consoles were not revalidated.
- Technical wording remains low confidence pending speaker review.
- All 138 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further wrong-language corrections and the broader audit
  continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/787e7f3031d3caa78346c3a5b12cb5d4b0a782a1">Correct Tatar backup scheduling and restore modes</a></summary>

- Correct 15 schedule, restore and cloud-credential values, preserving time
  formats, the monthly range and distinct restore modes.
- Technical wording remains low confidence pending speaker review.
- All 137 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further wrong-language corrections and the broader audit
  continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/696bd0eade22cb7d571309c9f4fdea093ff17392">Correct Tatar notification controls and backup scope</a></summary>

- Correct 18 notification and backup values, preserving activity-recording
  distinctions and organization backup boundaries.
- Technical wording remains low confidence pending speaker review.
- All 136 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further wrong-language corrections and the broader audit
  continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b66f0cbc4016e75b4d5545702bf8905d8821639f">Correct Tatar import export and anonymization guidance</a></summary>

- Correct 14 import/export values and replace incorrect account-anonymization
  guidance with its actual irreversible consequences; restore service
  identifiers.
- Technical wording remains low confidence pending speaker review.
- All 135 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further wrong-language corrections and the broader audit
  continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/df2ed8af6e390a01a3ed1a611221b1d5c9ace7f5">Correct Tatar loading and text rendering guidance</a></summary>

- Correct 12 loading and rendering values, aligning automatic-loading guidance
  with English and restoring configuration names and code examples.
- Technical wording remains low confidence pending speaker review.
- All 134 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further wrong-language corrections and the broader audit
  continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d2e92c0d4018caccec49ac5499017c4d776eaef9">Correct Tatar Sandstorm migration cleanup</a></summary>

- Correct 11 migration-cleanup and feature values, preserving successful
  migration prerequisites and irreversible deletion warnings.
- Technical wording remains low confidence pending speaker review.
- All 133 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further wrong-language corrections and the broader audit
  continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/48b4163afce327967958be3d5ca8a02851a9ba99">Correct Tatar cloud storage and migration guidance</a></summary>

- Correct 22 cloud-storage and migration values, restoring service names,
  database URLs, environment variables, commands and directory paths.
- Technical wording remains low confidence pending speaker review.
- All 132 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further wrong-language corrections and the broader audit
  continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9fad8d8e3f5194012ae7bf1e367a8e7304f29752">Correct Tatar migration errors and filesystem states</a></summary>

- Correct 23 migration and filesystem values, preserving warning, retry,
  resume and filesystem-state distinctions.
- Technical wording remains low confidence pending speaker review.
- All 131 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further wrong-language corrections and the broader audit
  continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/43e83e3d81eb027f4e8d348c64dc8f5368f50494">Correct Tatar scheduled jobs and storage paths</a></summary>

- Correct 24 scheduled-job and storage-path values, preserving scheduling
  outcomes, job actions and distinct storage paths.
- Technical wording remains low confidence pending speaker review.
- All 130 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further wrong-language corrections and the broader audit
  continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8536bd6188946de6edb710b470de2126c8175c5c">Correct Tatar unlock and user activation controls</a></summary>

- Correct 20 lockout and user-management values, preserving unlock scope
  and opposing activation actions.
- Technical wording remains low confidence pending speaker review.
- All 129 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further wrong-language corrections and the broader audit
  continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d3fed5749caeb6141b2b2f986ae4ccd2771f8103">Correct Tatar support and login lockout labels</a></summary>

- Correct 22 support, accessibility and lockout values, preserving access
  restrictions, username distinctions and lockout units.
- Technical wording remains low confidence pending speaker review.
- All 128 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further wrong-language corrections and the broader audit
  continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9f47dd11ed28591ab0d86749a3c0b1def947bcc5">Correct Tatar recurrence and checklist visibility</a></summary>

- Correct 11 import, checklist and recurrence values, preserving archive
  identifiers and distinguishing card recurrence from checklist reset.
- Technical wording remains low confidence pending speaker review.
- All 127 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further wrong-language corrections and the broader audit
  continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e492230be383c0b9adeab29982d2c22ca45584e7">Correct Tatar upload validation and custom translations</a></summary>

- Correct 21 upload and custom-translation values, preserving byte units,
  placeholders, technical identifiers and irreversible deletion warnings.
- Technical wording remains low confidence pending speaker review.
- All 126 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further wrong-language corrections and the broader audit
  continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d7bb8c95ea564a26d45e2594466dc77861b57fc8">Correct Tatar board status and transfer progress</a></summary>

- Correct 18 status and transfer values, preserving time categories,
  transfer measurements and the compaction error prefix.
- Technical wording remains low confidence pending speaker review.
- All 125 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further wrong-language corrections and the broader audit
  continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/abdd2ff10a600efa6064d98f688d97b8dcfe21ef">Correct Tatar storage statistics and compaction</a></summary>

- Correct 19 storage statistics and compaction values, preserving identifiers,
  compaction prerequisites and source warnings.
- Technical wording remains low confidence pending speaker review.
- All 124 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further wrong-language corrections and the broader audit
  continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9b0069f35356793e48702c5f373fe2a7350d78d1">Correct Tatar storage repair and default destination</a></summary>

- Correct 19 storage values, preserving identifiers, read eligibility,
  attachment-and-avatar repair scope and distinct progress states.
- Technical wording remains low confidence pending speaker review.
- All 123 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further wrong-language corrections and the broader audit
  continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d75430578086762d25248f0b35259e927b460523">Correct Tatar checklist copying and attachment storage</a></summary>

- Correct 22 checklist and attachment values, preserving storage names,
  copy modes and single, global and board-scoped attachment moves.
- Technical wording remains low confidence pending speaker review.
- All 122 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further wrong-language corrections and the broader audit
  continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/37561e9ff92913f574c980873fb32eda9d10c8d2">Correct Tatar memory and checklist controls</a></summary>

- Correct 24 memory, organization and checklist values, preserving technical
  identifiers, distinct memory metrics and checklist line mapping.
- Technical wording remains low confidence pending speaker review.
- All 121 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further wrong-language corrections and the broader audit
  continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b5ce34018f117cdf6060d18d342f32ba78060edc">Correct Tatar team invitations and heap metrics</a></summary>

- Correct 16 invitation and memory-metric values, preserving registration
  conditions, board-scoped removal and distinct Node metrics.
- Technical wording remains low confidence pending speaker review.
- All 120 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further wrong-language corrections and the broader audit
  continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/633ec0348d52aa875a32d6ef8f3be872b15faa77">Correct Tatar ticket states and deletion constraints</a></summary>

- Correct 18 ticket, request and card-sizing values, preserving member-related
  deletion restrictions, distinct ticket states and Cc notation.
- Technical wording remains low confidence pending speaker review.
- All 119 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further wrong-language corrections and the broader audit
  continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f105370d32c66d019afa02d2a00f7381675c5fc6">Correct Tatar API recovery and waiting animations</a></summary>

- Correct 25 API, recovery and animation values, preserving runtime identifiers,
  call ordering and automatic continuation after recovery.
- Technical wording remains low confidence pending speaker review.
- All 118 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further wrong-language corrections and the broader audit
  continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/63c592bd9481143bcc05c1f8954788129d939685">Correct Tatar report and office activity labels</a></summary>

- Correct 28 report, office and API values, preserving protocol identifiers,
  login counts and API aggregation semantics.
- Technical wording remains low confidence pending speaker review.
- All 117 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further wrong-language corrections and the broader audit
  continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/30aa9e2706e25ecc028c25cd7cbb1e6b1e3d5882">Correct Tatar map detection and diagnostics</a></summary>

- Correct 21 map, diagnostic, sorting and creator values, restoring executable
  log commands and preserving detection states and sorting distinctions.
- Technical wording remains low confidence pending speaker review.
- All 116 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further wrong-language corrections and the broader audit
  continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b938fafaba9bfe4a9c5d58429666d4ad9ffeeca5">Correct Tatar dependency imports and location labels</a></summary>

- Correct 26 dependency, background and location values, preserving relationship
  directions, JSON/SVG identifiers, import counters and image-size tokens.
- Technical wording remains low confidence pending speaker review.
- All 115 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further wrong-language corrections and the broader audit
  continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/80f851eaac3029366d22d87ebd510066de77c25d">Correct Tatar card sorting and dependency labels</a></summary>

- Correct 18 sorting, completion, sticker and dependency labels, preserving
  sort direction and opposing visibility, addition and removal actions.
- Technical wording remains low confidence pending speaker review.
- All 114 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further wrong-language corrections and the broader audit
  continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b1007d158f6d5acce6f53625dd8b592b77c1cf49">Correct Tatar search logic and export labels</a></summary>

- Correct 19 search-help and export-label values, preserving query examples,
  OR/AND distinctions, negation, sort syntax and the Arial font name.
- Technical wording remains low confidence pending speaker review.
- All 113 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further wrong-language corrections and the broader audit
  continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1d52b40e871a0e1151b9bc3be5c29e35b62bc796">Correct Tatar search instructions and validation</a></summary>

- Correct 32 search instruction and validation values, preserving executable
  examples, operator placeholders and syntax metavariables.
- Technical wording remains low confidence pending speaker review.
- All 112 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further wrong-language corrections and the broader audit
  continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fa722a2cc954429ce554943d1a9500591fc09e1d">Correct Tatar search operators and predicates</a></summary>

- Correct 38 search aliases and predicates, restoring shorthand symbols and
  distinct single-word aliases accepted by the search parser.
- Technical wording remains low confidence pending speaker review.
- All 111 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further wrong-language corrections and the broader audit
  continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d802535c04d50100489f6ebf0fc9305562a5c856">Correct Tatar search views and result messages</a></summary>

- Correct 34 search-view and due-card values, preserving permission scope,
  member-or-assignee filtering, incomplete-card criteria and result
  placeholders.
- Technical wording remains low confidence pending speaker review.
- All 110 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further wrong-language corrections and the broader audit
  continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a6ee59a0322332dd003982b67adc9af074ba0aa6">Correct Tatar shared templates and domain labels</a></summary>

- Correct 19 domain, shared-template and calendar values, preserving domain
  syntax, validation restrictions and shared-template scope.
- Technical wording remains low confidence pending speaker review.
- All 109 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further wrong-language corrections and the broader audit
  continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5df7256c9997afa8f9e0b6f0b054ce3659dc1016">Correct Tatar role settings and weekdays</a></summary>

- Correct 41 notification-control, role, weekday and task values, preserving
  administrator rights, read states and linked-card deletion prerequisites.
- Technical wording remains low confidence pending speaker review.
- All 108 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further wrong-language corrections and the broader audit
  continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c6d2d45ee67819778f415ea0195c54515774adb3">Correct Tatar editor preferences and administration popups</a></summary>

- Correct 17 editor, display and administration values, preserving literal
  keyboard shortcuts, editor modes and multiple-card window behavior.
- Technical wording remains low confidence pending speaker review.
- All 107 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further wrong-language corrections and the broader audit
  continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b688f5acf17071fc3551eb581927a87eaaf63aa0">Correct Tatar reminders and account deletion messages</a></summary>

- Correct 33 reminder, positioning and deletion values, preserving date and
  mention placeholders, reminder distinctions and irreversible deletion
  warnings.
- Technical wording remains low confidence pending speaker review.
- All 106 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further wrong-language corrections and the broader audit
  continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a520d411f02106a9bc9faee63cb9e7a7d7a1393a">Correct Tatar branding and authentication labels</a></summary>

- Correct 32 branding, authentication and administration values, preserving
  protocol names, assetlinks.json, HTML boundaries and JSON markers.
- Technical wording remains low confidence pending speaker review.
- All 105 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further wrong-language corrections and the broader audit
  continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/26c37ae023db7cae73c82e2a6a6b95c757a332a1">Correct Tatar minicards and label activity</a></summary>

- Correct 23 minicard and activity values, preserving checklist counters and
  sequential label/card and field/value/card arguments verified from source.
- Technical wording remains low confidence pending speaker review.
- All 104 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further wrong-language corrections and the broader audit
  continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/96c33af8937a50cf5f1b88df04c845ab8a42ea19">Correct Tatar deletion and subtask settings</a></summary>

- Correct 33 date, color, deletion and subtask values, preserving irreversible
  deletion warnings, duplicate-list conditions and board placeholders.
- Technical wording remains low confidence pending speaker review.
- All 103 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further wrong-language corrections and the broader audit
  continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/34e568ba07d41cd5072570f315d49afa46e8361d">Correct Tatar custom fields and organization settings</a></summary>

- Correct 33 custom-field, time-unit and organization settings values, restoring
  domain syntax and preserving administrator restrictions and field-sum
  semantics.
- Technical wording remains low confidence pending speaker review.
- All 102 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further wrong-language corrections and the broader audit
  continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f61ff8138223ab485a3b8559177c632d030becc4">Correct Tatar webhooks and system information</a></summary>

- Correct 35 webhook and system-information values, restoring literal runtime
  identifiers and preserving webhook directions and memory/version distinctions.
- Technical wording remains low confidence pending speaker review.
- All 101 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further wrong-language corrections and the broader audit
  continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6142935a1b3129e23ec95e20edcc3fc93891ce0b">Correct Tatar email and registration settings</a></summary>

- Correct 31 size-limit, registration, SMTP, invitation and webhook values,
  preserving protocol names, invitation fields and optional authentication.
- Technical wording remains low confidence pending speaker review.
- All 100 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further wrong-language corrections and the broader audit
  continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7287a1e98becfbf7b03170a0d8a7cda596a3b78d">Correct Tatar settings and transfer limits</a></summary>

- Correct 33 settings, watching, welcome and transfer-limit values, preserving
  defaults, WIP identifiers, transfer directions and autolink disabling
  behavior.
- Technical wording remains low confidence pending speaker review.
- All 99 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further wrong-language corrections and the broader audit
  continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7e86baf78ff008a9148db7b829db3bd621730b53">Correct Tatar tracking and upload controls</a></summary>

- Correct 18 tracking, upload, shortcut and logo settings values, preserving
  shortcut ranges and distinct upload states.
- Technical wording remains low confidence pending speaker review.
- All 98 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further wrong-language corrections and the broader audit
  continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/90a32cfb935842538c9d7983ccb3c39663aa615e">Correct Tatar sidebar shortcuts and board opening text</a></summary>

- Correct 20 shortcut, sidebar and time strings, preserving source tokens,
  sidebar targets, automatic-opening states and hour units.
- Technical wording remains low confidence pending speaker review.
- All 97 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further wrong-language corrections and the broader audit
  continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cd64ce968bf8800ebfde862e3f969fe83ee92ef6">Correct Tatar member removal and search controls</a></summary>

- Correct 22 removal, rescue and search strings, preserving placeholders,
  removal consequences and membership/assignment distinctions.
- Technical wording remains low confidence pending speaker review.
- All 96 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further wrong-language corrections and the broader audit
  continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/48909fe48aadec0e2cb701f47569ad7dc60375f7">Correct Tatar visibility and preview guidance</a></summary>

- Correct 17 visibility, notification and preview strings, preserving source
  tokens, login markup and membership-only editing restrictions.
- Technical wording remains low confidence pending speaker review.
- All 95 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further wrong-language corrections and the broader audit
  continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/de8392bd1fdcc4b4fde92b3260baab04b9671a53">Correct Tatar selection notification and role text</a></summary>

- Correct 25 selection, notification and role strings, preserving source tokens,
  action aliases, assigned-only visibility and settings restrictions.
- Technical wording remains low confidence pending speaker review.
- All 94 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further wrong-language corrections and the broader audit
  continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/626802e5fa7aa2de626f294c67ca646acfee2866">Correct Tatar list actions and settings text</a></summary>

- Correct 21 list, settings and login strings, preserving source tokens,
  bulk-action scope and list deletion/archive distinctions.
- Technical wording remains low confidence pending speaker review.
- All 93 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further wrong-language corrections and the broader audit
  continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8aab17e35a65010a37a23a46a623322e4cb283f1">Correct Tatar validation and board membership text</a></summary>

- Correct 22 validation, label and membership strings, preserving source tokens,
  year/admin requirements and board-leaving/deletion consequences.
- Technical wording remains low confidence pending speaker review.
- All 92 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further wrong-language corrections and the broader audit
  continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bd8a1df6d630b2f4d0e74db866a31f06cdffca18">Correct Tatar import progress and member mapping</a></summary>

- Correct 23 import-progress and mapping strings, preserving source tokens,
  cancellation distinctions and the current-user mapping fallback.
- Technical wording remains low confidence pending speaker review.
- All 91 focused checks and 21 human-preference checks pass. Browser and import
  runtime checks were not run. Further corrections and the broader audit
  continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d017b1cbe4b6daf11b0ffb48baa1594c33f1b944">Correct Tatar Trello import options and errors</a></summary>

- Correct 28 import and workspace strings, restoring file extensions and
  downloader names while preserving source tokens and archive-error
  distinctions.
- Technical wording remains low confidence pending speaker review.
- All 90 focused checks and 21 human-preference checks pass. Browser and import
  runtime checks were not run. Further corrections and the broader audit
  continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5349f6e0b028a5d7a151b50fda7b05824f0a958d">Correct Tatar import guidance and technical examples</a></summary>

- Correct 25 filter and import strings, restoring literal API paths, JSON keys,
  file extensions and filter examples, plus missing Markdown bullet-list
  guidance.
- Technical wording remains low confidence pending speaker review.
- All 89 focused checks and 21 human-preference checks pass. Browser and import
  runtime checks were not run. Further corrections and the broader audit
  continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f761b206f43508bc1b61f8d64e517fdcb5ebf890">Correct Tatar sorting and filtering controls</a></summary>

- Correct 34 sorting and filtering strings, preserving source tokens and
  distinct
  date, creator/assignee and sorting-abbreviation meanings.
- Technical wording remains low confidence pending speaker review.
- All 88 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further wrong-language corrections and the broader audit
  continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9821da6b21038e4018690637424f4c1feeaa51ff">Correct Tatar export and account conflict messages</a></summary>

- Correct 29 account, export and attachment-metadata strings, preserving source
  tokens, format names and inability/disk-space conditions.
- Technical wording remains low confidence pending speaker review.
- All 87 focused checks and 21 human-preference checks pass. Browser and export
  runtime checks were not run. Further corrections and the broader audit
  continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f22b4c3f9414b544a70a337f12da47738bca3077">Correct Tatar email templates and error messages</a></summary>

- Correct 34 editing, email and error strings, preserving source placeholders,
  paragraph structure, format names and permission distinctions.
- Technical wording remains low confidence pending speaker review.
- All 86 focused checks and 21 human-preference checks pass. Browser and email
  delivery checks were not run. Further corrections and the broader audit
  continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/539f75d92179676ffdb9104263a977c3139c3751">Correct Tatar field controls and date notation</a></summary>

- Correct 22 field and editing strings and restore three date-format labels,
  preserving source tokens and distinct field options.
- Technical wording remains low confidence pending speaker review.
- All 85 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further wrong-language corrections and the broader audit
  continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/67f7566e819540791b4a35fdeeee1c691cd1f418">Correct Tatar copying and restricted role controls</a></summary>

- Correct 30 copying, permission and custom-field strings, preserving source
  tokens, valid embedded JSON and restricted-role meanings.
- Technical wording remains low confidence pending speaker review.
- All 84 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further wrong-language corrections and the broader audit
  continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/015aa9a3d96c0281ef60c9cdfed7b4e3eff913c1">Correct Tatar colors and comment permission text</a></summary>

- Correct 36 color and permission strings and restore the blank comment
  placeholder, preserving source tokens and permission distinctions.
- Specialized color wording remains low confidence pending speaker review.
- All 83 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further wrong-language corrections and the broader audit
  continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2a862f73645381e1dba30897cf86afdef04114fd">Correct Tatar navigation and card aging text</a></summary>

- Correct 31 navigation, starring and aging strings, preserving source tokens,
  movement directions, toggle states and three fading levels.
- Technical wording remains low confidence pending speaker review.
- All 82 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further wrong-language corrections and the broader audit
  continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/eb43ced15b00e2e5270490231dd5f06159a4cbeb">Correct Tatar user mapping and appearance text</a></summary>

- Correct 32 login, mapping, theme and font strings, preserving source tokens,
  permission limits, font-size distinctions and preview digits.
- Technical wording remains low confidence pending speaker review.
- All 81 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further wrong-language corrections and the broader audit
  continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/14cbd1404fa81f6af1f2a60ad6e12d7f81a673c0">Correct Tatar popup and account action labels</a></summary>

- Correct 30 dependency, account, import and restoration labels, preserving
  source tokens and distinctions between account actions and restoration
  targets.
- Technical wording remains low confidence pending speaker review.
- All 80 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further wrong-language corrections and the broader audit
  continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a9a2e710aba4fb936165d6186efe2ca8df88c334">Correct Tatar voting controls and poker symbols</a></summary>

- Correct 27 voting and card-action strings and restore ten poker number/symbol
  labels with inappropriate prose appended. Preserve source placeholders.
- Technical terminology remains low confidence pending speaker review.
- All 79 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further wrong-language corrections and the broader audit
  continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/66c6211e8af3d3dd179264c42789d60df951db3c">Correct Tatar card archival and editing guidance</a></summary>

- Correct 29 calendar and card-control strings, preserving placeholders and
  distinctions between archive restoration, permanent deletion and overdue
  dates.
- Technical wording remains low confidence pending speaker review.
- All 78 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further wrong-language corrections and the broader audit
  continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e628b9bb03852a8a94a88ef87db64bff2a739098">Correct Tatar board views and appearance controls</a></summary>

- Correct 26 navigation, appearance and board-view strings, preserving source
  placeholders, zoom limits and product names.
- Technical wording remains low confidence pending speaker review.
- All 77 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further wrong-language corrections and the broader audit
  continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/97ecc408e79575f0a0327a6d8c5061d7c1719176">Correct Tatar archive attachment and board controls</a></summary>

- Correct 32 archive, attachment and board strings, preserving placeholders,
  visibility markup and permanent versus recoverable deletion distinctions.
- Technical wording remains low confidence pending speaker review.
- All 76 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further wrong-language corrections and the broader audit
  continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/afc09ff58d4b7cf320da4a992950f03b82f38bfe">Correct Tatar common controls and loading guidance</a></summary>

- Correct 23 checklist, announcement, reconnect and archive strings, preserving
  placeholders and the loading warning about refresh-related data loss.
- Technical wording remains low confidence pending speaker review.
- All 75 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further wrong-language corrections and the broader audit
  continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2dcf2f2596ad4167ee2a515b52a9fdca7a3e6884">Correct Tatar board selection and layout controls</a></summary>

- Correct 33 board selection and layout strings, preserving placeholders and
  distinctions between personal/shared settings, width/height and home
  removal/deletion.
- Technical wording remains low confidence pending speaker review.
- All 74 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further wrong-language corrections and the broader audit
  continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1aedd9578e1f7b9cf12a2bcddd7948e65adce031">Correct Tatar checklist activities and workspace controls</a></summary>

- Correct 35 checklist activity, date activity and workspace strings, preserving
  source placeholders and argument roles confirmed against the activity
  template.
- Technical wording remains low confidence pending speaker review.
- All 72 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further wrong-language corrections and the broader audit
  continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/06adc11de7cb2a720e99722804183a406b42cd94">Correct Tatar movement import and membership activities</a></summary>

- Correct 27 activity strings, preserving named source/destination placeholders
  and the meanings of sequential import and movement arguments.
- Technical wording remains low confidence pending speaker review.
- All 71 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further wrong-language corrections and the broader audit
  continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/01b12e1f4c348649aff27303f110cab4d8ebb4b6">Correct Tatar activity messages and title argument order</a></summary>

- Correct 31 activity and comment-control strings, including the new-title and
  card argument order in an earlier translation. Preserve placeholder
  case/counts
  and distinguish adding, removing, checking and completing actions.
- Technical wording remains low confidence pending speaker review.
- All 70 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further wrong-language corrections and the broader audit
  continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1a236cea3e3d6290aea820b770d340069bc97aa7">Correct Tatar rule descriptions and checklist guidance</a></summary>

- Correct 31 rule descriptions and instructions, preserving source placeholders,
  comma-separated examples and correct existing translations.
- Technical wording and composed fragments remain low confidence pending
  speaker review.
- All 68 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further wrong-language corrections and the broader audit
  continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ef43db6b587214d9c39318fcdf513d1985d7cd75">Correct Tatar checklist movement and email actions</a></summary>

- Correct 31 checklist, movement and email action strings, preserving correct
  existing translations, source placeholders and variable tags.
- Technical wording and composed fragments remain low confidence pending
  speaker review.
- All 67 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further wrong-language corrections and the broader audit
  continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7904a3b4dcac36331b4c234993e4df71dcec4b8c">Correct Tatar trigger events and date-change wording</a></summary>

- Correct 37 trigger, movement and checklist strings, preserving source tokens
  and distinguishing date types, setting versus changing dates, and archive
  states.
- Technical wording and composed fragments remain low confidence pending
  speaker review.
- All 66 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further wrong-language corrections and the broader audit
  continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7b778d93e4c50f84d951dbac618328417eeef83c">Correct Tatar scheduled rules and workflow controls</a></summary>

- Correct 43 workflow, schedule, date-trigger and button strings, preserving
  source placeholders, product names and correct existing translations.
- Technical wording remains low confidence pending speaker review.
- All 65 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further wrong-language corrections and the broader audit
  continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/caf9ebdfe4092f6675dc8ee92033cade4441f28a">Correct wrong-language Tatar rule editor strings</a></summary>

- Correct 46 rule, trigger and import/export strings, preserving correct
  existing
  translations and source placeholders. Regression checks cover vocabulary and
  event polarity as well as script.
- Technical wording remains low confidence pending speaker review.
- All 64 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further wrong-language corrections and the broader audit
  continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e18f43bd5e00ed3549b8eff0aa50d903f9ad7350">Translate Tatar keyboard labels and recovery controls</a></summary>

- Fill 28 keyboard and recovery placeholders, preserving key-cap names and
  distinctions between pausing, resuming and permanent cancellation.
- Default inventory retains 11 product names and mathematical identifiers.
  Older wrong-language strings still need correction.
- Technical wording remains low confidence pending speaker review.
- All 62 focused checks and 21 human-preference checks pass. Browser checks
  were not run. The broader language audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bdb0a7938fdb09e6e1477bda15a37f4a9b8b164c">Translate Tatar synchronization diagnostics and recovery</a></summary>

- Fill 56 source diagnostics, run report, mail failure and recovery
  placeholders,
  preserving source tokens, numeric limits and explicit null semantics.
- Technical terminology remains low confidence pending speaker review.
- All 61 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further Tatar corrections and the broader audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c1fda3091646ce95f75605c2feec03d10de38c03">Translate Tatar observations and synchronization controls</a></summary>

- Fill 56 sprint observation, synchronization conflict and preview placeholders,
  preserving source tokens, numeric limits and conflict-choice distinctions.
- Technical terminology remains low confidence pending speaker review.
- All 60 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further Tatar corrections and the broader audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6eb52f9385371d55cc6efb64e68a92f89be22c4b">Translate Tatar Scrum planning and sprint reports</a></summary>

- Fill 61 planning, sprint lifecycle and reporting placeholders, preserving
  source tokens and distinctions between completion policies and estimate
  states.
- Technical terminology remains low confidence pending speaker review.
- All 58 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further Tatar corrections and the broader audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b991dcc9e9dc3064bafeab041b014864532dff32">Translate Tatar workspace search and block rule controls</a></summary>

- Fill 41 workspace, search, block alias and rule-editor placeholders,
  preserving source tokens, shortcut names and fragment spacing.
- Technical wording remains low confidence pending speaker review.
- All 56 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further Tatar corrections and the broader audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/57f6d9917d3b6ec1f24d7db2b078c9bba26cfcc1">Translate Tatar text formatting and variable controls</a></summary>

- Fill 34 text formatting, input, whitespace trimming and variable-control
  placeholders, preserving source tokens and operation distinctions.
- Technical wording remains low confidence pending speaker review.
- All 55 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further Tatar corrections and the broader audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/68a5e2a84454192f0a453248a340ca3d09ac34af">Translate Tatar text positions and search</a></summary>

- Fill 32 text-operation strings, preserving existing translations and source
  placeholders.
- Technical wording remains low confidence pending speaker review.
- All 54 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further Tatar corrections and the broader audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a6516246e888dc30d8c385b8892fa098dfd9903f">Translate Tatar navigation shortcuts</a></summary>

- Fill 40 navigation and accessibility strings, preserving existing translations
  and source placeholders.
- Technical wording remains low confidence pending speaker review.
- All 53 focused checks and 21 human-preference checks pass. Browser and
  screen-reader checks were not run. Further Tatar corrections and the broader
  audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/065fd8de29eed6f5df8456d43e4c1921cea3d7ac">Translate Tatar function controls</a></summary>

- Fill 27 function and workspace strings, preserving existing translations
  and source placeholders.
- Technical wording remains low confidence pending speaker review.
- All 52 focused checks and 21 human-preference checks pass. Browser and
  screen-reader checks were not run. Further Tatar corrections and the broader
  audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c0acf256e61db202f5755fcdfd791188e960e780">Translate Tatar trigonometry and workspace controls</a></summary>

- Fill 24 trigonometry and workspace strings, preserving existing translations,
  standard mathematical symbols and source placeholders.
- Technical wording remains low confidence pending speaker review.
- All 51 focused checks and 21 human-preference checks pass. Browser and
  screen-reader checks were not run. Further Tatar corrections and the broader
  audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dd67fc6a213ba4fffe513d8e2cec1fab73ec1625">Translate Tatar random numbers and mathematical functions</a></summary>

- Fill 28 random-number and mathematical-function strings, preserving existing
  translations, standard symbols and source placeholders.
- Technical wording remains low confidence pending speaker review.
- All 50 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further Tatar corrections and the broader audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/efc0acc280c4155199b8f3f0afd3eaf724077d49">Translate Tatar number tests and statistics</a></summary>

- Fill 30 number-test and statistics strings, preserving existing translations
  and source placeholders.
- Technical wording remains low confidence pending speaker review.
- All 49 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further Tatar corrections and the broader audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d4c35a997ef07eebb4c27b2c341f06ccfac031a5">Translate Tatar logic and arithmetic explanations</a></summary>

- Fill 25 logic and arithmetic strings, preserving existing translations,
  mathematical notation and source placeholders.
- Technical wording remains low confidence pending speaker review.
- All 48 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further Tatar corrections and the broader audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/58dcd3a7a9d4adca785c5163be914bf999b2e314">Translate Tatar sorting and logic comparisons</a></summary>

- Fill 32 sorting, conversion and comparison strings, preserving existing
  translations and source placeholders.
- Technical wording remains low confidence pending speaker review.
- All 47 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further Tatar corrections and the broader audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/10e4c15eb03ac24ec6f6ba5bf38833532ae87f98">Translate Tatar list removal and editing</a></summary>

- Fill 32 list-removal and editing strings, preserving existing translations
  and source placeholders.
- Technical wording remains low confidence pending speaker review.
- All 46 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further Tatar corrections and the broader audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/aa47a81037cb3840ead446b2d95e5f938d634421">Translate Tatar navigation and list construction</a></summary>

- Fill 29 navigation and list-operation strings, preserving existing
  translations
  and source placeholders.
- Technical wording remains low confidence pending speaker review.
- All 45 focused checks and 21 human-preference checks pass. Browser and
  screen-reader checks were not run. Further Tatar corrections and the broader
  audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2cbea286e7c08690a49bf4f6d596b9966c4c56d2">Translate Tatar input labels</a></summary>

- Fill 39 list, number and text input strings, preserving existing translations
  and source placeholders.
- Technical wording remains low confidence pending speaker review.
- All 44 focused checks and 21 human-preference checks pass. Browser and
  screen-reader checks were not run. Further Tatar corrections and the broader
  audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5fc7eb82cb272a1b47c1bfc234c6a5b21163ce89">Translate Tatar editing and accessibility labels</a></summary>

- Fill 37 editing, bitmap and accessibility strings, preserving existing
  translations and source placeholders.
- Technical wording remains low confidence pending speaker review.
- All 43 focused checks and 21 human-preference checks pass. Browser and
  screen-reader checks were not run. Further Tatar corrections and the broader
  audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6e6b7b60c2c758afb3e94139a6598cbeebdb3505">Translate Tatar loop and editing controls</a></summary>

- Fill 33 loop, condition and editing strings, preserving existing translations
  and source placeholders.
- Technical wording remains low confidence pending speaker review.
- All 42 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further Tatar corrections and the broader audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5383509a30509b3dfb0a7e2fc1c905cfe4373ebb">Translate Tatar block controls and correct activity wording</a></summary>

- Fill 24 Blockly placeholders and correct nine mixed-language activity and
  comment strings, preserving source placeholders and correct Tatar
  translations.
- Technical wording remains low confidence pending speaker review.
- All 41 focused checks and 21 human-preference checks pass. Browser checks
  were not run. Further Tatar corrections and the broader audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dd19d28474693171688ab18f6625df5009cb322d">Translate Central Kurdish recovery controls</a></summary>

- Fill 25 Sorani recovery strings, preserving existing translations and
  placeholders.
  The default inventory now retains only product names and mathematical symbols;
  none of the 149 pending-Transifex keys remain identical to English in this
  locale.
- Technical wording remains low confidence pending speaker review.
- All 59 focused checks and 21 human-preference checks pass. Browser and
  right-to-left layout checks were not run. The broader audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2535250fc60ee0540af9d487bb9a87e73f8dfbe0">Translate Central Kurdish diagnostics and mail failures</a></summary>

- Fill 37 Sorani diagnostic and mail-failure strings, preserving existing
  translations and source placeholders.
- Technical wording remains low confidence pending speaker review.
- All 42 focused checks and 21 human-preference checks pass. Browser and
  right-to-left layout checks were not run. The broader audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/36a39e467e873ed045cd261c5a844c0ae7c650e0">Translate Central Kurdish Sync conflicts and preview</a></summary>

- Fill 37 Sorani Sync-conflict and preview strings, preserving existing
  translations and source placeholders.
- Technical wording remains low confidence pending speaker review.
- All 41 focused checks and 21 human-preference checks pass. Browser and
  right-to-left layout checks were not run. The broader audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7f4b2b14217db6036d917f05f7bf95df35569a00">Translate Central Kurdish sprint reports and observations</a></summary>

- Fill 44 Sorani sprint-report and observation strings, preserving existing
  translations and source placeholders.
- Technical wording remains low confidence pending speaker review.
- All 42 focused checks and 21 human-preference checks pass. Browser and
  right-to-left layout checks were not run. The broader audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cb4b1d168191994c778f98d6d8dbd09eef87acd8">Translate Central Kurdish rule editor and Scrum planning</a></summary>

- Fill 49 Sorani rule-editor and Scrum planning strings, preserving existing
  translations and source placeholders.
- Technical wording remains low confidence pending speaker review.
- All 41 focused checks and 21 human-preference checks pass. Browser and
  right-to-left layout checks were not run. The broader audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2c2523222f2f40c723f0681d487e83a68680b697">Translate Central Kurdish workspace and variable messages</a></summary>

- Fill 69 Sorani workspace, keyboard and variable strings, preserving existing
  translations, physical key inscriptions and source placeholders.
- Technical wording remains low confidence pending speaker review.
- All 52 focused checks and 21 human-preference checks pass. Browser,
  screen-reader and right-to-left layout checks were not run. The broader audit
  continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a454a4511aea16878b4d8a16f2852a0cade36c6e">Translate Central Kurdish text operations</a></summary>

- Fill 47 Sorani text-operation strings, preserving existing translations and
  source placeholders.
- Technical wording remains low confidence pending speaker review.
- All 51 focused checks and 21 human-preference checks pass. Browser,
  screen-reader and right-to-left layout checks were not run. The broader audit
  continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/eb39ca6b7545ee5fb47faef4ecc0d262e6b13c02">Translate Central Kurdish keyboard shortcuts</a></summary>

- Fill 39 Sorani shortcut and navigation strings, preserving existing
  translations and source placeholders.
- Technical wording remains low confidence pending speaker review.
- All 50 focused checks and 21 human-preference checks pass. Browser,
  screen-reader and right-to-left layout checks were not run. The broader audit
  continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ae802feaa2f8237f2588c2b859c8776f18bb5c0f">Translate Central Kurdish function and variable controls</a></summary>

- Fill 37 Sorani function, variable and accessibility strings, preserving
  existing translations and source placeholders.
- Technical wording remains low confidence pending speaker review.
- All 49 focused checks and 21 human-preference checks pass. Browser,
  screen-reader and right-to-left layout checks were not run. The broader audit
  continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9eac080769eabea72d2b13d5fffde1e9a6637939">Translate Central Kurdish logarithms and trigonometry</a></summary>

- Fill 34 Sorani mathematical-function and workspace strings, preserving
  existing translations, standard symbols and source placeholders.
- Technical wording remains low confidence pending speaker review.
- All 48 focused checks and 21 human-preference checks pass. Browser,
  screen-reader and right-to-left layout checks were not run. The broader audit
  continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2e5879ed5d74de4525337eb6193853188bc5e879">Translate Central Kurdish statistics and number tests</a></summary>

- Fill 35 Sorani statistics and number-test strings, preserving existing
  translations and source placeholders.
- Technical wording remains low confidence pending speaker review.
- All 47 focused checks and 21 human-preference checks pass. Browser,
  screen-reader and right-to-left layout checks were not run. The broader audit
  continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6d08bbe431b2ccc7d850ab3d57c390fdd7b2f46e">Translate Central Kurdish logic and arithmetic</a></summary>

- Fill 35 Sorani logic and arithmetic strings, preserving existing translations
  and source placeholders.
- Technical wording remains low confidence pending speaker review.
- All 46 focused checks and 21 human-preference checks pass. Browser,
  screen-reader and right-to-left layout checks were not run. The broader audit
  continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/55b2db55e3b943a8567c040b9516e1b3a1484f07">Translate Central Kurdish list editing and comparisons</a></summary>

- Fill 37 Sorani list-editing and comparison strings, preserving existing
  translations and source placeholders.
- Technical wording remains low confidence pending speaker review.
- All 45 focused checks and 21 human-preference checks pass. Browser,
  screen-reader and right-to-left layout checks were not run. The broader audit
  continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/83e4037699bba95a5ae5c4396d46a889358adcd8">Translate Central Kurdish list retrieval and removal</a></summary>

- Fill 42 Sorani list-operation strings, preserving existing translations and
  source placeholders.
- Technical wording remains low confidence pending speaker review.
- All 44 focused checks and 21 human-preference checks pass. Browser,
  screen-reader and right-to-left layout checks were not run. The broader audit
  continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f150ca438ce158f887c0ceb12388825b1398c808">Translate Central Kurdish input labels and keyboard navigation</a></summary>

- Fill 48 Sorani input and navigation strings, preserving existing translations
  and source placeholders.
- Technical wording remains low confidence pending speaker review.
- All 43 focused checks and 21 human-preference checks pass. Browser,
  screen-reader and right-to-left layout checks were not run. The broader audit
  continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e1f627d11ecf7ccfc20fa67be37575de0594b903">Translate Central Kurdish Blockly editing and accessibility</a></summary>

- Fill 54 Sorani editing, input and accessibility strings, preserving existing
  translations and source placeholders.
- Technical wording remains low confidence pending speaker review.
- All 42 focused checks and 21 human-preference checks pass. Browser,
  screen-reader and right-to-left layout checks were not run. The broader audit
  continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/12002e195d7fccdfd5bec068b1258cf02e87551a">Translate Central Kurdish Blockly colours and flow controls</a></summary>

- Fill 39 Sorani colour, block and control-flow strings, preserving existing
  translations and source placeholders.
- Technical wording remains low confidence pending speaker review.
- All 41 focused checks and 21 human-preference checks pass. Browser and
  right-to-left layout checks were not run. The broader translation audit
  continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f033222baf7a7ef7d1ad796f2f398b20a3c2b589">Translate Bhojpuri final recovery controls</a></summary>

- Fill six recovery strings, preserving existing translations and placeholders.
  The default inventory now retains only product names and mathematical symbols;
  none of the 149 pending-Transifex keys remain identical to English in
  Bhojpuri.
- Technical wording remains low confidence pending speaker review.
- All 61 focused checks and 21 human-preference checks pass. Browser checks
  were not run. The broader translation audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3a09261d220f7d4c7908ae2caaa22f0635d368ff">Translate Bhojpuri Sync diagnostics and notification recovery</a></summary>

- Fill 49 Sync diagnostic, mail failure and notification recovery strings,
  preserving existing translations and source placeholders.
- Technical wording remains low confidence pending speaker review.
- All 42 focused checks and 21 human-preference checks pass. Browser checks
  were not run. The broader translation audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6758bca71563ca208665b0cb755d0f6bd4574f18">Translate Bhojpuri observations and Sync conflicts</a></summary>

- Fill 54 daily observation, Sync conflict and preview strings, preserving
  existing translations and source placeholders.
- Technical wording remains low confidence pending speaker review.
- All 42 focused checks and 21 human-preference checks pass. Browser checks
  were not run. The broader translation audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8044a82c3cecd4ec2a67f9865321d543abb806aa">Translate Bhojpuri Scrum planning and sprint controls</a></summary>

- Fill 74 Scrum planning, sprint and report strings, preserving existing
  translations and source placeholders.
- Scrum terminology remains low confidence pending speaker review.
- All 40 focused checks and 21 human-preference checks pass. Browser checks
  were not run. The broader translation audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4246f112b009b589140e3a4bbe2ac39788524086">Translate Bhojpuri workspace search and block rule editor</a></summary>

- Fill 59 workspace, keyboard and rule-editor strings, preserving existing
  translations, physical key inscriptions and source placeholders.
- Technical wording remains low confidence pending speaker review.
- All 54 focused checks and 21 human-preference checks pass. Browser and
  screen-reader checks were not run. The broader translation audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c8bce21f5f2f3168d0481b6a1622c35ba31f1d6f">Translate Bhojpuri text operations and variable controls</a></summary>

- Fill 71 text operation, variable and shortcut strings, preserving existing
  translations and source placeholders.
- Technical wording remains low confidence pending speaker review.
- All 53 focused checks and 21 human-preference checks pass. Browser and
  screen-reader checks were not run. The broader translation audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d98f3aff31e79fd2a915d40aba11c600b13477f5">Translate Bhojpuri navigation and screen-reader controls</a></summary>

- Fill 39 navigation, editing and screen-reader strings, preserving existing
  translations and source placeholders.
- Accessibility wording remains low confidence pending speaker review.
- All 52 focused checks and 21 human-preference checks pass. Browser and
  screen-reader checks were not run. The broader translation audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f3fd1f108dda50e198ce09500d31ca70927ed95e">Translate Bhojpuri workspace and function controls</a></summary>

- Fill 37 workspace, variable, backpack and function strings, preserving
  existing
  translations and source placeholders.
- Technical wording remains low confidence pending speaker review.
- All 51 focused checks and 21 human-preference checks pass. Browser and
  screen-reader checks were not run. The broader translation audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d69c4224eff637974974d13dae91a5e31a2646bb">Translate Bhojpuri logarithm and trigonometry messages</a></summary>

- Fill 27 English placeholders for absolute values, powers, logarithms, roots,
  negation and trigonometry, preserving symbolic notation and formatting tokens.
- Trigonometry terminology remains low confidence pending fluent review.
- All 50 focused checks and 21 human-preference checks pass. Browser and
  screen-reader checks were not run. The broader translation audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9937a380082d21776e94cd7eebc6d5a8c27160c8">Translate Bhojpuri statistics and random-number instructions</a></summary>

- Fill 29 English placeholders for statistics, random numbers, powers,
  rounding and absolute values, preserving existing translations and tokens.
- Statistical and rounding terminology remains low confidence pending review.
- All 49 focused checks and 21 human-preference checks pass. Browser and
  screen-reader checks were not run. The broader translation audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3c5a19f3a094533ac4bf56ed237a68929dd1c193">Translate Bhojpuri arithmetic and number tests</a></summary>

- Fill 28 English placeholders for arithmetic, constants, bounds, divisibility,
  number types and remainders, preserving formulas and formatting tokens.
- Inverse trigonometry wording remains low confidence pending fluent review.
- All 48 focused checks and 21 human-preference checks pass. Browser and
  screen-reader checks were not run. The broader translation audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/989dfa33a68c012fbb93a9222693b5ae1c4ba14c">Translate Bhojpuri Blockly logic and comparisons</a></summary>

- Fill 29 English placeholders for splitting/joining, Boolean values,
  comparisons, negation and conditional expressions, preserving tokens.
- Delimiter and Boolean terminology remains low confidence pending review.
- All 47 focused checks and 21 human-preference checks pass. Browser and
  screen-reader checks were not run. The broader translation audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6191084788cfb2b65c3e0718d58aecd40d0c5a7b">Translate Bhojpuri list indexing and editing instructions</a></summary>

- Fill 32 English placeholders for indexing, length, repetition, reversal,
  insertion, replacement and sorting, preserving existing text and tokens.
- Index and case-insensitive sorting wording remains low confidence.
- All 46 focused checks and 21 human-preference checks pass. Browser and
  screen-reader checks were not run. The broader translation audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/770c24071ff9a55f3bb5a0c667e6ce3163f63f72">Translate Bhojpuri Blockly list retrieval and removal</a></summary>

- Fill 30 English placeholders for list creation, selection, retrieval, removal
  and sublists, preserving existing translations and formatting tokens.
- Sublist terminology remains low confidence pending fluent review.
- All 45 focused checks and 21 human-preference checks pass. Browser and
  screen-reader checks were not run. The broader translation audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/27c404777fd0c80a3e79acea07c6b1e13ee1d868">Translate Bhojpuri text inputs and keyboard navigation</a></summary>

- Fill 30 English placeholders for text/number inputs, keyboard navigation and
  empty-list creation, preserving existing translations and formatting tokens.
- Statement-position wording remains low confidence pending fluent review.
- All 44 focused checks and 21 human-preference checks pass. Browser and
  screen-reader checks were not run. The broader translation audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5aea181bf2d3ae00ac8c0f31c879bb0a9153d80e">Translate Bhojpuri Blockly input labels</a></summary>

- Fill 31 English placeholders for conditions, list boundaries, loop increments,
  math operands and coordinates, preserving existing translations and tokens.
- Delimiter and operand wording remains low confidence pending fluent review.
- All 43 focused checks and 21 human-preference checks pass. Browser and
  screen-reader checks were not run. The broader translation audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1fdaa042cc20ce63e8d018fed4331adae78ded21">Translate Bhojpuri Blockly editing and accessibility labels</a></summary>

- Fill 39 English placeholders for editing, block states, bitmap fields,
  keyboard help and icon labels, preserving existing translations and tokens.
- Bitmap-column and inline-input wording remains low confidence pending review.
- All 42 focused checks and 21 human-preference checks pass. Browser and
  screen-reader checks were not run. The broader translation audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dc9706282eb9d571408a521753480cf155437f82">Translate Bhojpuri Blockly loops and conditions</a></summary>

- Fill 24 English placeholders for loop flow, iteration, repetition and
  conditional branches, preserving existing translations and formatting tokens.
- Loop and iteration terminology remains low confidence pending fluent review.
- All 41 focused checks and 21 human-preference checks pass. Browser and
  screen-reader checks were not run. The broader translation audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6db36bf895f81e34c49901c604e54487743b62ae">Translate Bhojpuri Blockly controls and colours</a></summary>

- Fill 20 English placeholders for block controls, variable deletion and colour
  selection/mixing, preserving existing translations and formatting tokens.
- Variable and function terminology remains low confidence pending review.
- All 40 focused checks and 21 human-preference checks pass. Browser and
  screen-reader checks were not run. The broader translation audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0b7a3ad75dfa053eb4937202461449be9de4c82a">Translate Kurdish recovery cancellation and keyboard labels</a></summary>

- Fill three recovery messages and eighteen keyboard labels, preserving
  cancellation caveats and recognizable physical key names.
- The eleven remaining default-inventory entries are product names, null and
  mathematical notation. Pending-Transifex content and wording review remain.
- All 41 focused checks and 21 human-preference checks pass. Browser and
  screen-reader checks were not run. The broader translation audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c11366158bd00a70f9ded2f6936109a738f9f5fc">Translate Kurdish activity recovery and time estimates</a></summary>

- Fill 26 English placeholders for time estimates, activity notifications,
  retry states and delivery controls, preserving existing text and tokens.
- Reservation and recovery-metadata wording remains low confidence pending
  review.
- All 40 focused checks and 21 human-preference checks pass. Browser and
  screen-reader checks were not run. The broader translation audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a5fad090cecb57dfbe2ea8fae48896552e24af13">Translate Kurdish Sync diagnostics and mail failure labels</a></summary>

- Fill 21 English placeholders for run outcomes, diagnostics, estimate mapping
  and mail failures, preserving existing translations and formatting tokens.
- Diagnostic and receipt terminology remains low confidence pending review.
- All 42 focused checks and 21 human-preference checks pass. Browser and
  screen-reader checks were not run. The broader translation audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/19c3926deb5c99665717b2277292990f8bb5aad4">Translate Kurdish Sync omissions and run reports</a></summary>

- Fill 23 English placeholders for preview limits, source omissions, conversion,
  parser warnings and run history, preserving existing translations and tokens.
- Parser, path and representation wording remains low confidence pending review.
- All 41 focused checks and 21 human-preference checks pass. Browser and
  screen-reader checks were not run. The broader translation audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9f9ac3578acce08199675bb692711957cc567515">Translate Kurdish Sync conflicts and preview labels</a></summary>

- Fill 26 English placeholders for conflict resolution, duplicate mappings,
  archival restrictions, replacement cards and previews, preserving tokens.
- Mapping and baseline terminology remains low confidence pending fluent review.
- All 40 focused checks and 21 human-preference checks pass. Browser and
  screen-reader checks were not run. The broader translation audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/805768b31558fa5296ab986f952315c896501770">Translate Kurdish sprint report caveats and confirmations</a></summary>

- Fill 13 English placeholders for snapshots, report limitations, lifecycle
  confirmations, daily observations and incomplete imports, preserving tokens.
- Snapshot and observation wording remains low confidence pending fluent review.
- All 42 focused checks and 21 human-preference checks pass. Browser and
  screen-reader checks were not run. The broader translation audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5279638c3894425cb09293f9ac738a8ed1bd4404">Translate Kurdish sprint report and event labels</a></summary>

- Fill 35 English placeholders for events, totals, estimates, lifecycle states,
  workflow categories and import references, preserving existing translations.
- Retrospective and swimlane terminology remains low confidence pending review.
- All 41 focused checks pass. Browser and screen-reader checks were not run.
  The broader translation audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/70af858ee7afefbe549796cbea68738bfe14792f">Translate Kurdish Scrum settings and planning labels</a></summary>

- Fill 36 English placeholders for board views, Scrum roles, settings,
  completion policies, sprint controls and backlog help, preserving tokens.
- Scrum-role and increment wording remains low confidence pending review.
- All 40 focused checks and 21 human-preference checks pass. Browser and
  screen-reader checks were not run. The broader translation audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0866c90b972d32c90bb779a262ee97dfd4db6bc5">Translate Kurdish Blockly aliases and rule-editor messages</a></summary>

- Fill 25 English placeholders for search, zoom, repeated Blockly labels and
  rule-editor help, errors and status, preserving existing translations and
  tokens.
- Trigger and zoom terminology remains low confidence pending fluent review.
- All 51 focused checks and 21 human-preference checks pass. Browser and
  screen-reader checks were not run. The broader translation audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4ecc063c0a9a2f3ffe3308b20838a6f837e4f340">Translate Kurdish Blockly replacement and workspace messages</a></summary>

- Fill 36 English placeholders for replacement, trimming, variables, workspace
  descriptions and search navigation, preserving existing text and tokens.
- Workspace-stack and search-focus wording remains low confidence pending
  review.
- All 50 focused checks and 21 human-preference checks pass. Browser and
  screen-reader checks were not run. The broader translation audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1b40c8c20492b5b435cb8c2948624b47e321f7d9">Translate Kurdish Blockly text operations</a></summary>

- Fill 41 English placeholders for appending, case conversion, characters,
  substrings, counting, searching, joining, length and prompts, preserving
  tokens.
- Case-conversion and substring wording remains low confidence pending review.
- All 49 focused checks and 21 human-preference checks pass. Browser and
  screen-reader checks were not run. The broader translation audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/438f3177393cbb5b1daff5342027116b01c150e8">Translate Kurdish Blockly keyboard shortcuts and announcements</a></summary>

- Fill 44 English placeholders for variable renaming, screen-reader states,
  navigation, movement, scrolling and announcements, preserving existing text.
- Keyboard-focus and block-stack wording remains low confidence pending review.
- All 48 focused checks and 21 human-preference checks pass. Browser and
  screen-reader checks were not run. The broader translation audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/90b11c488da9660ccf6e4bc7c845edd6a2227b34">Translate Kurdish Blockly function and variable controls</a></summary>

- Fill 40 English placeholders for trigonometric tooltips, workspace controls,
  variable creation and procedure definitions/calls, preserving tokens.
- Parent-block and procedure-output wording remains low confidence.
- All 47 focused checks and 21 human-preference checks pass. Browser and
  screen-reader checks were not run. The broader translation audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/70a6a5f11538eb8012f7f9ff3dbef9bd8258a2fe">Translate Kurdish statistical and unary math instructions</a></summary>

- Fill 39 English placeholders for statistics, random values, rounding,
  logarithms, negation and spoken trigonometric labels, preserving tokens.
- Statistical and trigonometric terminology remains low confidence.
- All 46 focused checks and 21 human-preference checks pass. Browser and
  screen-reader checks were not run. The broader translation audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b83566a83c361aa15018026fd774d47ae4cb2aab">Translate Kurdish Blockly arithmetic and statistics labels</a></summary>

- Fill 40 English placeholders for arithmetic, constants, bounds, number tests,
  remainders and statistics, preserving formulas, tokens and existing
  translations.
- Root, prime-number and standard-deviation wording remains low confidence.
- All 45 focused checks and 21 human-preference checks pass. Browser and
  screen-reader checks were not run. The broader translation audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a5ed81ad373ddc2a68c8deabb254e89ef470578d">Translate Kurdish Blockly sorting and logic instructions</a></summary>

- Fill 29 English placeholders for sorting, splitting, comparisons, Boolean
  logic and conditional values. Preserve existing translations and tokens.
- Case-insensitive sorting wording remains low confidence pending review.
- All 44 focused checks and 21 human-preference checks pass. Browser and
  screen-reader checks were not run. The broader translation audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/62b71bc22d70b35698e37bcb0e2b11575167a53d">Translate Kurdish Blockly list operations</a></summary>

- Fill 52 English placeholders for list creation, retrieval, removal, sublists,
  indexing, repetition, reversal, insertion and sorting, preserving existing
  text.
- Index and sublist terminology remains low confidence pending fluent review.
- All 43 focused checks and 21 human-preference checks pass. Browser and
  screen-reader checks were not run. The broader translation audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/880a9c5aee43af24f0e8d2122fe6ac7dbea998f6">Translate Kurdish Blockly input and navigation labels</a></summary>

- Fill 57 English placeholders for list, number, text and statement inputs,
  keyboard navigation and empty-list creation, preserving existing translations.
- Statement-position, iteration and replacement wording remains low confidence.
- All 42 focused checks and 21 human-preference checks pass. Browser and
  screen-reader checks were not run. The broader translation audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e50a3f5b87994e387472167634adb22bea1c6f14">Translate Kurdish Blockly editing and accessibility instructions</a></summary>

- Fill 54 English placeholders for conditions, repetition, editing controls,
  bitmap labels, keyboard help and icon announcements, preserving existing
  translations and formatting tokens.
- Inline input and bitmap terminology remains low confidence pending review.
- All 41 focused checks and 21 human-preference checks pass. Browser and
  screen-reader checks were not run. The broader translation audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/89af4691e66ada4dd8f937f94b877c9ac06e2a5c">Translate Kurdish Blockly control and colour instructions</a></summary>

- Fill 26 English placeholders for block controls, variable deletion, colour
  mixing, loops and conditions, preserving existing translations and tokens.
- Loop and collapsed-block terminology remains low confidence pending review.
- All 40 focused checks and 21 human-preference checks pass. Browser and
  screen-reader checks were not run. The broader translation audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2ae4b4737c0e598d27b7eb3020650b3c09ea8612">Fill the final eight missing due-date shortcut entries</a></summary>

- Add the shortcut in Cherokee, Inuktitut, Ladin, Aromanian, Tigre,
  Arabic-script Uzbek, Wolaytta and Standard Moroccan Tamazight.
  All eight additions remain low confidence pending fluent review.
- All locales now contain the shortcut. All 53 focused catalog checks and
  21 human-preference checks pass. Browser and screen-reader checks were not
  run.
- This closes the missing-key gap, not the broader translation audit:
  untranslated strings remain in 70 languages, and 149 keys are excluded
  from that inventory as pending Transifex. Wrong-language wording also remains.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/294759f773ecb929d55cf3d00b0d732537df8c4c">Translate the due-date shortcut in eight further languages</a></summary>

- Add the shortcut in Acehnese, Aymara, Fulah, Greenlandic, Nahuatl,
  Neapolitan, Volapük and Klingon, preserving existing translations.
- These additions remain low confidence pending fluent review.
- Focused checks: 50 pass; two catalog checks still fail on missing shortcuts
  elsewhere. All 21 human-preference checks pass. Browser and screen-reader
  checks were not run. The broader translation audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/565dbccc50c2bf63931040a33cf87a7c67816dba">Translate the due-date shortcut in eleven further locales</a></summary>

- Add the shortcut in Tibetan, Dzongkha, Kashmiri, Quechua, Tongan, Upper
  Sorbian, Venetian, Veps, Flemish, Waray and Wu Chinese. Respect declared
  languages of legacy locale tags and preserve existing translations.
- All additions except Flemish remain low confidence pending fluent review.
- Focused checks: 49 pass; two catalog checks still fail on missing shortcuts
  elsewhere. All 21 human-preference checks pass. Browser and screen-reader
  checks were not run. The broader translation audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a4a575973a4453b0978e2d531603f1ced833dfe0">Translate the due-date shortcut in thirteen further languages</a></summary>

- Add the shortcut in Akan, Bambara, Chuvash, Ewe, Guarani, Sakha, Northern
  Sámi, Silesian, Tsonga, Venda, Wolof, Kashubian and Walloon.
- Preserve existing translations and source key order. Chuvash, Ewe, Sakha,
  Silesian, Kashubian and Walloon wording remains low confidence.
- Focused checks: 48 pass; two catalog checks still fail on missing shortcuts
  elsewhere. All 21 human-preference checks pass. Browser and screen-reader
  checks were not run. The broader translation audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cd96952a9066b3b9a925ee9e8531b48c48d2a40c">Translate due-date shortcuts in twenty-three further locales</a></summary>

- Add the shortcut in Bashkir, Buryat, Bislama, Fijian, Hawaiian, Konkani,
  Cornish, Luganda, Māori, Northern Ndebele, Northern Sotho, Chichewa, Oromo,
  Papiamento, Kirundi, Kinyarwanda, Samoan, Swati, Southern Sotho, Tswana,
  Tigrinya, Uyghur and South African Zulu, preserving existing translations.
- Buryat, Fijian, Konkani, Cornish, Kirundi, Swati and Tigrinya wording remains
  low confidence pending fluent review.
- Focused checks: 47 pass; two catalog checks still fail on missing shortcuts
  elsewhere. All 21 human-preference checks pass. Browser and screen-reader
  checks were not run. The broader translation audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9a1d04e3ae306f2fe47d3627dbbdf46ab7d62a61">Translate missing due-date shortcuts in twenty languages</a></summary>

- Add the shortcut in Aragonese, Asturian, Breton, Corsican, Faroese, Friulian,
  Scottish Gaelic, Manx, Javanese, Romansh, Sardinian, Sicilian, Turkmen, Tatar,
  Yiddish, Zulu, Xhosa, Somali, Igbo and Shona, preserving existing
  translations.
- Aragonese, Breton, Faroese, Friulian, Manx, Romansh, Sardinian and Igbo
  wording remains low confidence pending fluent review.
- Focused checks: 46 pass; two catalog checks still fail on missing shortcuts
  elsewhere. All 21 human-preference checks pass. Browser and screen-reader
  checks were not run. The broader translation audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/58497dab4f5bcea09e7560cb039c757071833552">Translate the due-date shortcut in five further languages</a></summary>

- Add the missing shortcut in Assamese, Odia, Bhojpuri, Maithili and Cantonese,
  preserving existing translations and source key order. Odia, Bhojpuri and
  Maithili wording remains low confidence pending fluent review.
- The focused run passes 45 checks; two catalog checks still fail on missing
  shortcuts in other locales. All 21 human-preference checks pass. Browser and
  screen-reader checks were not run.
- The broader translation and wording audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5138f059cfc5a1cd60670a56de87cc809fe69f0f">Translate the due-date shortcut in seven additional catalogs.</a></summary>

- Add the shortcut in Moroccan Arabic, West Frisian and its regional variant,
  Latin, Luxembourgish, Maltese and Occitan. Preserve existing values and source
  order. Occitan and Moroccan Arabic phrasing is low confidence pending review.
- The focused run passes 44 checks; two catalog checks still fail on the missing
  shortcut in other locales. All 21 human-preference checks pass. Browser and
  screen-reader checks were not run.
- The broader translation and wording audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/af6c9a2dba4fc4d24bd7b3ed2521bd756d37d91b">Translate the due-date shortcut in 14 additional languages.</a></summary>

- Add the shortcut in Amharic, Central Kurdish, Hausa, Haitian Creole, Kannada,
  Kurdish, Kyrgyz, Malagasy, Burmese, Pashto, Sindhi, Sinhala, Tajik and Yoruba.
  Preserve existing values and source order. Wording remains provisional pending
  speaker review.
- The focused run passes 43 checks; two catalog checks still fail on the missing
  shortcut in other locales. All 21 human-preference checks pass. Browser and
  screen-reader checks were not run.
- The broader translation and wording audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/03419aaca1f4c61d6296bb1ae8800f030e70acdd">Add the due-date shortcut to 16 more variant catalogs.</a></summary>

- Add corresponding language wording to additional Afrikaans, Catalan, German,
  English, Spanish, Portuguese, Slovenian, Chinese and Galician variants.
  Preserve existing values and source order. English variants retain English,
  including catalogs with underscore-based locale identifiers.
- The focused run passes 42 checks; two catalog checks still fail on the missing
  shortcut in other locales. All 21 human-preference checks pass. Browser and
  screen-reader checks were not run.
- The broader translation and wording audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bd52ecab159572c8bf4238772b94093539daa801">Add the due-date shortcut to 47 regional variants.</a></summary>

- Reuse the corresponding language and script for regional shortcut labels.
  Preserve existing values and source order, including the underlying catalogs
  used by the Khmer and Russian aliases. English variants remain English.
- The focused run passes 41 checks; two catalog checks still fail on the missing
  shortcut in other locales. All 21 human-preference checks pass. Browser and
  screen-reader checks were not run.
- The broader translation and wording audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1734c4d2950f01aefa2b92331167231f4a1602ce">Add the due-date shortcut to 14 more locales.</a></summary>

- Add the shortcut to Azerbaijani, Welsh, British English, Esperanto, Estonian,
  Irish, Gujarati, Armenian, Georgian, Kazakh, Mongolian, Nepali, Telugu and
  Uzbek. Preserve existing values and source order; British English retains
  English wording. Translations remain subject to speaker review.
- The focused run passes 40 checks; two catalog checks still fail on the missing
  shortcut in other locales. All 21 human-preference checks pass. Browser and
  screen-reader checks were not run.
- The broader translation and wording audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2c25817c3a0566d3170ac58731216b893306bea2">Translate the missing due-date shortcut in 26 more languages.</a></summary>

- Add the shortcut to Afrikaans, Belarusian, Bengali, Bosnian, Catalan, Basque,
  Persian, Galician, Hindi, Icelandic, Khmer, Lithuanian, Latvian, Macedonian,
  Malayalam, Marathi, Malay, Punjabi, Slovenian, Albanian, Serbian, Swahili,
  Tamil, Thai, Tagalog and Urdu. Preserve existing values and source key order.
  Wording remains subject to speaker review.
- The focused run passes 39 checks; two catalog checks still fail on the missing
  shortcut in other locales. All 21 human-preference checks pass. Browser and
  screen-reader checks were not run.
- The broader translation and wording audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/52a7d0a3305aee33292b899ace2141a1625e8581">Translate the missing due-date shortcut in 30 languages.</a></summary>

- Add the shortcut to Arabic, Bulgarian, Czech, Danish, German, Greek, Spanish,
  Finnish, French, Hebrew, Croatian, Hungarian, Indonesian, Italian, Japanese,
  Korean, Norwegian Bokmål, Dutch, Polish, Portuguese, Brazilian Portuguese,
  Romanian, Russian, Slovak, Swedish, Turkish, Ukrainian, Vietnamese, Simplified
  Chinese and Traditional Chinese. Preserve existing values and source key
  order.
- The focused run passes 38 checks; two catalog checks still fail on the missing
  shortcut in other locales. All 21 human-preference checks pass. Browser and
  screen-reader checks were not run.
- The broader translation and wording audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2df5d7efe343cd4b0f394050ec329cda7dfc678a">Correct Tok Pisin shortcuts and add the missing due-date label.</a></summary>

- Correct five mixed-language labels and translate the missing shortcut.
  Verify full key inventory and order, membership versus assignment and tokens.
  Wording remains provisional pending fluent-speaker review.
- The combined run passes 165 checks; two catalog checks still fail on the
  missing due-date shortcut key in other locales. All 21 human-preference checks
  pass. Browser and screen-reader checks were not run.
- The broader translation and wording audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c4c409a9d9936e395b00dfd78f5d2f8d2db318b8">Correct six Tok Pisin history and notification messages.</a></summary>

- Replace mixed English in history, notification and maintenance descriptions.
  Preserve source tokens, export exclusions and the minimum-admin requirement.
  Wording remains provisional pending fluent-speaker review.
- The combined run passes 164 checks; two catalog checks still fail on the
  missing due-date shortcut key. All 21 human-preference checks pass.
  Browser and screen-reader checks were not run.
- The broader translation and wording audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e4e146494217f2783f84f4aa80284da84e336e38">Correct eight Tok Pisin organization and background labels.</a></summary>

- Replace mixed English in organization, team and board-background controls.
  Preserve source tokens, action scope and matching labels for equivalent
  actions.
  Wording remains provisional pending fluent-speaker review.
- The combined run passes 163 checks; two catalog checks still fail on the
  missing due-date shortcut key. All 21 human-preference checks pass.
  Browser and screen-reader checks were not run.
- The broader translation and wording audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f7a353ba6be7c6eba78b2075a63910e1fe7baacf">Correct 15 Tok Pisin avatar and repository labels.</a></summary>

- Replace mixed English and correct the WIP Limit Groups label. Preserve source
  tokens, consistent avatar actions and upload prerequisites.
  Technical wording remains provisional pending fluent-speaker review.
- The combined run passes 162 checks; two catalog checks still fail on the
  missing due-date shortcut key. All 21 human-preference checks pass.
  Browser and screen-reader checks were not run.
- The broader translation and wording audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/54512789cfa5b8df311feb7f9362714b8806c1ca">Correct 16 Tok Pisin rule controls.</a></summary>

- Replace English and mixed-language rule labels. Preserve source tokens,
  completion actions, schedule periods and selection/checkmark distinctions.
  Wording remains provisional pending fluent-speaker review.
- The combined run passes 160 checks; two catalog checks still fail on the
  missing due-date shortcut key. All 21 human-preference checks pass.
  Browser and screen-reader checks were not run.
- The broader translation and wording audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5cb9ae727784a4ff3a712d16d776c977ac4f91c9">Correct 15 Tok Pisin privacy and support controls.</a></summary>

- Replace mixed English in privacy, support and favorite controls. Preserve
  source tokens, import/export directions, favorite actions and setting scope.
  Wording remains provisional pending fluent-speaker review.
- The combined run passes 158 checks; two catalog checks still fail on the
  missing due-date shortcut key. All 21 human-preference checks pass.
  Browser and screen-reader checks were not run.
- The broader translation and wording audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7575667f71271f7dbf86ce861bf776188e41fda3">Correct 16 Tok Pisin scheduling and time labels.</a></summary>

- Replace mixed English in scheduling, time summaries and display controls.
  Preserve source tokens, scheduling-failure scope and time distinctions.
  Wording remains provisional pending fluent-speaker review.
- The combined run passes 156 checks; two catalog checks still fail on the
  missing due-date shortcut key. All 21 human-preference checks pass.
  Browser and screen-reader checks were not run.
- The broader translation and wording audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6b512864bfba3c90023ab1c92ade663906275ad9">Correct 29 Tok Pisin migration and monitoring labels.</a></summary>

- Replace mixed English in migration and monitoring controls. Preserve source
  tokens, storage targets, administrator limits and progress-state distinctions.
  Technical wording remains provisional pending fluent-speaker review.
- The combined run passes 154 checks; two catalog checks still fail on the
  missing due-date shortcut key. All 21 human-preference checks pass.
  Browser and screen-reader checks were not run.
- The broader translation and wording audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0e3401bea1558c237a9be20baf28ea8b4d9c670f">Correct 15 Tok Pisin account lockout labels.</a></summary>

- Replace mixed English in account and lockout controls. Preserve source tokens,
  account distinctions, failure thresholds and single/all-user unlocking scope.
  Wording remains provisional pending fluent-speaker review.
- The combined run passes 152 checks; two catalog checks still fail on the
  missing due-date shortcut key. All 21 human-preference checks pass.
  Browser and screen-reader checks were not run.
- The broader translation and wording audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/86be4a3eee00c0c41295071bca7e6110ed116653">Correct 21 Tok Pisin import controls and progress messages.</a></summary>

- Replace mixed English in import controls and progress messages. Preserve
  source tokens, external tool names, API-key URLs and file extensions.
  Wording remains provisional pending fluent-speaker review.
- The combined run passes 150 checks; two catalog checks still fail on the
  missing due-date shortcut key. All 21 human-preference checks pass.
  Browser and screen-reader checks were not run.
- The broader translation and wording audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8c77e8e2a097bed28d898b473713b1719d9de2cd">Correct 19 Tok Pisin form and card-aging labels.</a></summary>

- Replace mixed English and correct an account label that described importing.
  Preserve source tokens, fading levels, worker-role limits and card scope.
  Wording remains provisional pending fluent-speaker review.
- The combined run passes 148 checks; two catalog checks still fail on the
  missing due-date shortcut key. All 21 human-preference checks pass.
  Browser and screen-reader checks were not run.
- The broader translation and wording audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/15f367622110753b84f3f90e866cab8e36d3ecea">Correct 40 Tok Pisin file and card controls.</a></summary>

- Replace mixed English in file, card, display and maintenance controls.
  Preserve source tokens, visibility markup and database-copy exclusions.
  Technical wording remains provisional pending fluent-speaker review.
- The combined run passes 146 checks; two catalog checks still fail on the
  missing due-date shortcut key. All 21 human-preference checks pass.
  Browser and screen-reader checks were not run.
- The broader translation and wording audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fd3f8014eb7c7588c4af1c5c30bd0d651d1522fb">Correct 18 Tok Pisin confirmations and connection-help messages.</a></summary>

- Replace mixed English in confirmations and connection help. Preserve source
  tokens, affected objects, unlocking scope and SMTP/TLS labels.
  Wording remains provisional pending fluent-speaker review.
- The combined run passes 144 checks; two catalog checks still fail on the
  missing due-date shortcut key. All 21 human-preference checks pass.
  Browser and screen-reader checks were not run.
- The broader translation and wording audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0427ef00d033e97f0f78c5d5cf55c608d7441572">Correct 13 Tok Pisin location and selection labels.</a></summary>

- Replace mixed English in location, role and selection controls. Preserve
  source tokens, location outcomes, assigned-only roles and Enter references.
  Wording remains provisional pending fluent-speaker review.
- The combined run passes 142 checks; two catalog checks still fail on the
  missing due-date shortcut key. All 21 human-preference checks pass.
  Browser and screen-reader checks were not run.
- The broader translation and wording audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c81f8b78e8cc6a73a3ba91c55daff5c89acebe19">Correct 19 Tok Pisin navigation and display messages.</a></summary>

- Replace mixed English in navigation, display and assigned-card permissions.
  Preserve source tokens, toggle behavior and matching popup titles.
  Technical wording remains provisional pending fluent-speaker review.
- The combined run passes 140 checks; two catalog checks still fail on the
  missing due-date shortcut key. All 21 human-preference checks pass.
  Browser and screen-reader checks were not run.
- The broader translation and wording audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/86193927615c4eb53f0b52f175171bce66683b16">Correct 19 Tok Pisin backup and scheduled-job messages.</a></summary>

- Replace mixed English in backup controls and scheduled jobs. Preserve source
  tokens, restore choices, schedule limits and job-state distinctions.
  Technical wording remains provisional pending fluent-speaker review.
- The combined run passes 138 checks; two catalog checks still fail on the
  missing due-date shortcut key. All 21 human-preference checks pass.
  Browser and screen-reader checks were not run.
- The broader translation and wording audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/aff335693bf9245deccf37031178de863c9e9907">Correct 36 Tok Pisin migration and repair messages.</a></summary>

- Replace mixed English and restore the literal Snap database setting name.
  Preserve source tokens, connection URLs, data exclusions and repair scope.
  Technical wording remains provisional pending fluent-speaker review.
- The combined run passes 136 checks; two catalog checks still fail on the
  missing due-date shortcut key. All 21 human-preference checks pass.
  Browser and screen-reader checks were not run.
- The broader translation and wording audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3e747a1412a4ae2b10df99143bbb04d426a8b61e">Correct 21 Tok Pisin diagnostics and storage status messages.</a></summary>

- Replace English and mixed-language diagnostic labels. Preserve source tokens,
  numeric limits, repair scope and success/failure distinctions. Heap context
  wording is low confidence; technical wording needs fluent-speaker review.
- The combined run passes 134 checks; two catalog checks still fail on the
  missing due-date shortcut key. All 21 human-preference checks pass.
  Browser and screen-reader checks were not run.
- The broader translation and wording audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/229bfc5b6da1e99f45ea45e64c9e5eee92dfced9">Correct 16 Tok Pisin customization labels.</a></summary>

- Replace mixed English in logo, HTML and custom-translation controls.
  Preserve source tokens, HTML boundaries, asset names and default values.
  Technical wording remains provisional pending fluent-speaker review.
- The combined run passes 132 checks; two catalog checks still fail on the
  missing due-date shortcut key. All 21 human-preference checks pass.
  Browser and screen-reader checks were not run.
- The broader translation and wording audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6c97ac7a01840c4af6679a550fe389dccccb3acc">Correct 18 Tok Pisin policy and scheduling messages.</a></summary>

- Replace mixed English in permissions, scheduling, shortcuts and import/export
  restrictions. Preserve source tokens, restriction scope and avatar exclusions.
  Technical wording remains provisional pending fluent-speaker review.
- The combined run passes 130 checks; two catalog checks still fail on the
  missing due-date shortcut key. All 21 human-preference checks pass.
  Browser and screen-reader checks were not run.
- The broader translation and wording audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9c9e08d9868c6f728cc74eb412dad90bf5e19050">Correct 21 Tok Pisin layout and maintenance messages.</a></summary>

- Replace mixed English in layout, loading, filesystem storage and maintenance.
  Preserve source tokens, loading limitations and enable/disable distinctions.
  Technical wording remains provisional pending fluent-speaker review.
- The combined run passes 128 checks; two catalog checks still fail on the
  missing due-date shortcut key. All 21 human-preference checks pass.
  Browser and screen-reader checks were not run.
- The broader translation and wording audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/24e9e0543d949cb7f94084c838547255b2dcc898">Correct 26 Tok Pisin cloud storage settings and instructions.</a></summary>

- Replace mixed English in Azure and Google Cloud setup. Preserve external
  console labels, JSON identifiers, optional credentials and saved-secret
  behavior. Technical wording remains provisional pending fluent-speaker review.
- The combined run passes 126 checks; two catalog checks still fail on the
  missing due-date shortcut key. All 21 human-preference checks pass.
  Browser and screen-reader checks were not run.
- The broader translation and wording audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/13b32af7275f947b3beed1267fb7098f6831f93f">Translate 38 Tok Pisin S3 and Sandstorm storage messages.</a></summary>

- Replace English and mixed-language storage text, restore literal directory
  paths, retain external menu labels and clarify Sandstorm access warnings.
  Technical wording remains provisional pending fluent-speaker review.
- The combined run passes 124 checks; two catalog checks still fail on the
  missing due-date shortcut key. All 21 human-preference checks pass.
  Browser and screen-reader checks were not run.
- The broader translation and wording audit continues. The counted placeholder
  inventory remains 42,838 values across 70 languages.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/17c98d0e1056366b51019aa464181b603966a4a4">Correct 22 Tok Pisin control and reporting messages.</a></summary>

- Replace mixed English in controls, reporting, support and account status.
  Preserve source tokens, report scope and configuration literals. Technical
  wording remains provisional pending fluent-speaker review.
- The combined run passes 122 checks; two catalog checks still fail on the
  missing due-date shortcut key. All 21 human-preference checks pass.
  Browser and screen-reader checks were not run.
- The broader translation and wording audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/10dfe9775cb7c375408e8516a509b156eb466ea4">Correct 29 Tok Pisin access and import messages.</a></summary>

- Replace mixed English in permissions, imports, searches and due-date wording.
  Preserve literal configuration values, source tokens and access restrictions;
  search help matches its control. Technical wording remains provisional
  pending fluent-speaker review.
- The combined run passes 120 checks; two catalog checks still fail on the
  missing due-date shortcut key. All 21 human-preference checks pass.
  Browser and screen-reader checks were not run.
- The broader translation and wording audit continues. The English-placeholder
  inventory remains 42,838 values across 70 languages.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/14872ede15a0a07136b888e73d838c98fe2b3422">Correct 16 Tok Pisin administration and privacy descriptions.</a></summary>

- Replace mixed English and repair an account anonymization confirmation that
  incorrectly described exporting a board. Preserve configuration literals,
  source tokens, storage-operation ordering and warnings. Technical wording
  remains provisional pending fluent-speaker review.
- The combined run passes 118 checks; two catalog checks still fail on the
  missing due-date shortcut key. All 21 human-preference checks pass.
  Browser and screen-reader checks were not run.
- The broader translation and wording audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f8dd8a41291953fe6a19a9092521811d8cdd1787">Correct 25 Tok Pisin help and migration instructions.</a></summary>

- Translate mixed English in filtering, backup scope and recovery instructions.
  Preserve code examples, source tokens, restore restrictions and warnings;
  menu references match the translated controls. Technical wording remains
  provisional pending fluent-speaker review.
- The combined run passes 116 checks; two catalog checks still fail on the
  missing due-date shortcut key. All 21 human-preference checks pass.
  Browser and screen-reader checks were not run.
- The broader translation and wording audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fd05f864f95456823eb6dc3a1db62661f04573a2">Correct 18 Tok Pisin label and compact-card messages.</a></summary>

- Replace mixed English in label actions, compact-card settings and file limits.
  Preserve source tokens, deletion warnings and multiple-selection behavior.
  Wording remains provisional pending fluent-speaker review.
- The combined run passes 113 checks; two catalog checks still fail on the
  missing due-date shortcut key. All 21 human-preference checks pass.
  Browser and screen-reader checks were not run.
- The broader translation and wording audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e9b744b1d624ec86a5e82c1302594a1374d320c9">Correct 34 Tok Pisin filter and sorting labels.</a></summary>

- Replace mixed English in filtering and sorting controls, distinguish assigned
  work and restore literal alphabetical endpoints. Preserve source tokens.
  Wording remains provisional pending fluent-speaker review.
- The combined run passes 111 checks; two catalog checks still fail on the
  missing due-date shortcut key. All 21 human-preference checks pass.
  Browser and screen-reader checks were not run.
- The broader translation and wording audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/928f2148feb40b793c5c6253c9b1f5b654d71aa4">Correct 18 Tok Pisin visibility and sharing messages.</a></summary>

- Clarify private access, public visibility, member-only editing and shared
  template scope. Preserve source tokens and the login link markup.
  Wording remains provisional pending fluent-speaker review.
- The combined run passes 109 checks; two catalog checks still fail on the
  missing due-date shortcut key. All 21 human-preference checks pass.
  Browser and screen-reader checks were not run.
- The broader translation and wording audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/38f3f75a926e34cbcf166a4807e9f08206142314">Correct 22 Tok Pisin error messages.</a></summary>

- Replace mixed English in errors and empty states. Preserve placeholders
  and verify restrictions, validation rules and recovery instructions.
  Wording remains provisional pending fluent-speaker review.
- The combined run passes 107 checks; two catalog checks still fail on the
  missing due-date shortcut key. All 21 human-preference checks pass.
  Browser and screen-reader checks were not run.
- The broader translation and wording audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/652496480f8d39a0e7631262918d307986046c8a">Correct 25 Tok Pisin rule actions and conditions.</a></summary>

- Replace mixed English in rule conditions, movement and checklist actions.
  Preserve placeholders and distinguish list scope, positions and timing.
  Wording remains provisional pending fluent-speaker review.
- The combined run passes 105 checks; two catalog checks still fail on the
  missing due-date shortcut key. All 21 human-preference checks pass.
  Browser and screen-reader checks were not run.
- The broader translation and wording audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3ff37b15110814738108ed6edc7f153f19860add">Correct 32 Tok Pisin rule-builder messages.</a></summary>

- Replace mixed English in rule labels, triggers and import/export help.
  Preserve placeholders and verify trigger directions and import limitations.
  Technical wording remains provisional pending fluent-speaker review.
- The combined run passes 103 checks; two catalog checks still fail on the
  missing due-date shortcut key. All 21 human-preference checks pass.
  Browser and screen-reader checks were not run.
- The broader translation and wording audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/50b8617c468eeaa4c167d24b7fbbddc54de62c72">Correct 24 Tok Pisin movement and copy messages.</a></summary>

- Replace mixed English and clarify copy, movement and conversion controls.
  Preserve placeholders and verify directions, scope and valid JSON examples.
  Wording remains provisional pending fluent-speaker review.
- The combined run passes 101 checks; two catalog checks still fail on the
  missing due-date shortcut key. All 21 human-preference checks pass.
  Browser and screen-reader checks were not run.
- The broader translation and wording audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/648280808f04818bfa6e8998317e7eb98223a9e3">Correct 19 Tok Pisin date and time messages.</a></summary>

- Replace mixed English and distinguish due dates from end dates. Preserve
  placeholders, date-format literals and timestamp direction. Wording remains
  provisional pending fluent-speaker review.
- The combined run passes 99 checks; two catalog checks still fail on the
  missing due-date shortcut key. All 21 human-preference checks pass.
  Browser and screen-reader checks were not run.
- The broader translation and wording audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0148a44c228beebc5a80f2f49597bcda4362ee0b">Correct 19 Tok Pisin role and membership messages.</a></summary>

- Replace mixed English in role descriptions and membership controls.
  Preserve placeholders and verify permission boundaries, global-admin
  rights and activation actions. Wording remains provisional pending
  fluent-speaker review.
- The combined run passes 97 checks; two catalog checks still fail on the
  missing due-date shortcut key. All 21 human-preference checks pass.
  Browser and screen-reader checks were not run.
- The broader translation and wording audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3e4ed286d52887a51f4b9ff13b25fe0edb5dcc53">Correct 18 Tok Pisin checklist and subtask messages.</a></summary>

- Replace mixed English and clarify reset and sound defaults. Preserve
  placeholders and verify completion filters, original order and counters.
  Wording remains provisional pending fluent-speaker review.
- The combined run passes 95 checks; two catalog checks still fail on the
  missing due-date shortcut key. All 21 human-preference checks pass.
  Browser and screen-reader checks were not run.
- The broader translation and wording audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f464d15f5aaed6eed472e90a0e2d57e16727e922">Correct 10 Tok Pisin notification messages.</a></summary>

- Replace mixed English in subscription hints, read/unread actions and
  reminders. Preserve placeholders and distinguish scope and reminder timing.
  Wording remains provisional pending fluent-speaker review.
- The combined run passes 93 checks; two catalog checks still fail on the
  missing due-date shortcut key. All 21 human-preference checks pass.
  Browser and screen-reader checks were not run.
- The broader translation and wording audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/17a37ef989e87f4c865fb428051abbca39858dc4">Correct 13 Tok Pisin custom-field messages.</a></summary>

- Replace mixed English and repair the multi-select wording. Preserve
  placeholders and formatting literals, with checks for deletion scope and
  setting/unsetting values. Wording remains provisional pending fluent-speaker
  review.
- The combined run passes 92 checks; two catalog checks still fail on the
  missing due-date shortcut key. All 21 human-preference checks pass.
  Browser and screen-reader checks were not run.
- The broader translation and wording audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dec92e7d37280622bd57efaed9f774932e10a350">Correct 24 Tok Pisin deletion and restoration messages.</a></summary>

- Replace mixed English in deletion warnings and restoration messages.
  Preserve placeholders and verify restrictions, irreversible actions and
  restoration counts. Wording remains provisional pending fluent-speaker review.
- The combined run passes 90 checks; two catalog checks still fail on the
  missing due-date shortcut key. All 21 human-preference checks pass.
  Browser and screen-reader checks were not run.
- The broader translation and wording audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e8c0a1c4ef6619240d89f1fe9d57bb96663a86d9">Correct 17 Tok Pisin export options and instructions.</a></summary>

- Replace mixed English in export fields and related import instructions.
  Restore Jira API and Trello menu literals and preserve placeholders.
  Wording remains provisional pending fluent-speaker review.
- The combined run passes 88 checks; two catalog checks still fail on the
  missing due-date shortcut key. All 21 human-preference checks pass.
  Browser and screen-reader checks were not run.
- The broader translation and wording audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ad33767527e971ddc507b9d43c38e2486ff57570">Correct 29 Tok Pisin import translations.</a></summary>

- Replace mixed English in import instructions, archive errors and member
  mapping. Restore literal schema names in examples and preserve tokens.
  Technical wording remains provisional pending fluent-speaker review.
- The combined run passes 86 checks; two catalog checks still fail on the
  missing due-date shortcut key. All 21 human-preference checks pass.
  Browser and screen-reader checks were not run.
- The broader translation and wording audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3848a8d7f912d2de72ceeec50a6578c921b65078">Correct 25 Tok Pisin file-handling translations.</a></summary>

- Replace mixed English in attachment limits, storage settings and repair
  descriptions. Preserve tokens and verify transfer directions and units.
  Technical wording remains provisional pending fluent-speaker review.
- The combined run passes 84 checks; two catalog checks still fail on the
  missing due-date shortcut key. All 21 human-preference checks pass.
  Browser and screen-reader checks were not run.
- The broader translation and wording audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b3c7b0322203d746829ffb4637a7ef61ec2ab3df">Correct 34 Tok Pisin account and invitation messages.</a></summary>

- Replace mixed English in invitations, email templates and validation
  messages. Preserve tokens, restore email paragraphs and distinguish
  reset/verification and required/optional inputs. Wording remains provisional
  pending fluent-speaker review.
- The combined run passes 82 checks; two catalog checks still fail on the
  missing due-date shortcut key. All 21 human-preference checks pass.
  Browser and screen-reader checks were not run.
- The broader translation and wording audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8c9f34a3e65a8338427fdf6663d0c3cf15c44977">Correct 40 Tok Pisin search-help translations.</a></summary>

- Replace unprefixed mixed English in search instructions and errors.
  Preserve source tokens and verify AND/OR, negation, sorting and limit
  meanings. Wording remains provisional pending fluent-speaker review.
- The combined run passes 80 checks; two catalog checks still fail on the
  missing due-date shortcut key. All 21 human-preference checks pass.
  Browser and screen-reader checks were not run.
- The broader language audit and existing multiword query-operator syntax
  review remain unfinished.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/70c93974a71b998c6e0cc1b78570946596a3e648">Correct 27 Tok Pisin analytics translations.</a></summary>

- Replace the remaining English-seeded prefix values in analytics and time
  adjustments. Preserve forecast bounds, history gaps and fallback meanings.
  Statistical wording remains provisional pending fluent-speaker review.
- The combined run passes 78 checks; two catalog checks still fail on the
  missing due-date shortcut key. All 21 human-preference checks pass.
  Browser and screen-reader checks were not run.
- No Tok Pisin values retain the English-seeding prefix. This completes only
  that cleanup: unprefixed wording, search syntax and the broader language
  audit remain unfinished.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/09bb20da8ca954cabd7512ef4cb803eb0bb13a43">Correct 25 Tok Pisin colour translations.</a></summary>

- Replace prefixed English colour labels with dictionary-supported basic
  names and distinct shade descriptions. Less common shade descriptions
  remain low confidence pending fluent-speaker and visual review.
- The combined run passes 76 checks; two catalog checks still fail on the
  missing due-date shortcut key. All 21 human-preference checks pass.
  Browser and screen-reader checks were not run.
- Another 27 Tok Pisin values containing the same English-seeding prefix
  remain for review; the broader language audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/087d779df984b4feb2de64a80b2a37c5c1cded7a">Correct 21 Tok Pisin search keyword translations.</a></summary>

- Replace prefixed English keywords and verify parser-compatible spelling,
  registered operators and collision-free names. Compact query forms and
  technical loans remain low confidence pending fluent-speaker review.
- The combined run passes 75 checks; two catalog checks still fail on the
  missing due-date shortcut key. All 21 human-preference checks pass.
  Browser and screen-reader checks were not run.
- Another 52 Tok Pisin values containing the same English-seeding prefix
  remain for review. Existing multiword operators need further syntax review;
  the broader language audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9e5ac7722d246bbd103e64498196d62ec286e346">Correct 68 Tok Pisin general-control translations.</a></summary>

- Replace mixed-language support, loading, work-limit and general-control
  labels. Preserve source tokens, units and action distinctions. Technical
  wording remains provisional pending fluent-speaker review.
- The combined run passes 73 checks; two catalog checks still fail on the
  missing due-date shortcut key. All 21 human-preference checks pass.
  Browser and screen-reader checks were not run.
- Another 73 Tok Pisin values containing the same English-seeding prefix
  remain for review. Such values are excluded by the English-placeholder
  counter; the broader language audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f746e8e683502d4be892ec4d377822cc983d6302">Correct 57 Tok Pisin card, account and ticket translations.</a></summary>

- Replace mixed-language card, location, ticket and account labels. Preserve
  placeholders and distinguish account actions, ticket states and coordinate
  directions. Technical wording remains provisional pending fluent-speaker
  review.
- The combined run passes 71 checks; two catalog checks still fail on the
  missing due-date shortcut key. All 21 human-preference checks pass.
  Browser and screen-reader checks were not run.
- Another 141 Tok Pisin values containing the same English-seeding prefix
  remain for review. Such values are excluded by the English-placeholder
  counter; the broader language audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/efeb64ca3bc23fea0344bf4694472163b91239ab">Correct 48 Tok Pisin system and connection translations.</a></summary>

- Replace mixed-language runtime, memory, SMTP, webhook and cloud labels.
  Preserve source tokens, configuration identifiers and metric distinctions.
  Technical wording remains low confidence pending fluent-speaker review.
- The combined run passes 69 checks; two catalog checks still fail on the
  missing due-date shortcut key. All 21 human-preference checks pass.
  Browser and screen-reader checks were not run.
- Another 198 Tok Pisin values containing the same English-seeding prefix
  remain for review. Such values are excluded by the English-placeholder
  counter; the broader language audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/913f291adabf658c5cf63e5faa7265fccdef5b45">Correct 41 Tok Pisin reporting and monitoring translations.</a></summary>

- Replace mixed-language reporting, event, queue and resource-usage labels.
  Preserve source tokens, technical identifiers and first/last distinctions.
  Technical wording remains provisional pending fluent-speaker review.
- The combined run passes 67 checks; two catalog checks still fail on the
  missing due-date shortcut key. All 21 human-preference checks pass.
  Browser and screen-reader checks were not run.
- Another 246 Tok Pisin values containing the same English-seeding prefix
  remain for review. Such values are excluded by the English-placeholder
  counter; the broader language audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/81535636ef309ac01b79b0afb74528c3712f581f">Correct 56 Tok Pisin storage and migration translations.</a></summary>

- Replace mixed-language storage, attachment repair, avatar, backup and
  migration labels. Preserve source tokens, units and state changes. Technical
  wording remains provisional pending fluent-speaker review.
- The combined run passes 65 checks; two catalog checks still fail on the
  missing due-date shortcut key. All 21 human-preference checks pass.
  Browser and screen-reader checks were not run.
- Another 287 Tok Pisin values containing the same English-seeding prefix
  remain for review. Such values are excluded by the English-placeholder
  counter; the broader language audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/825a004b4f960df29fff98d801b43e836f5f8b47">Correct 74 Tok Pisin rule and scheduling translations.</a></summary>

- Replace mixed-language rule, reminder, checklist, weekday and scheduled-job
  labels. Preserve source tokens and recurrence intervals. Technical wording
  remains provisional pending fluent-speaker review.
- The combined run passes 63 checks; two catalog checks still fail on the
  missing due-date shortcut key. All 21 human-preference checks pass.
  Browser and screen-reader checks were not run.
- Another 343 Tok Pisin values containing the same English-seeding prefix
  remain for review. Such values are excluded by the English-placeholder
  counter; the broader language audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8d9ebb2fa175bce16d8588bab2bb3e6aa500df06">Correct 83 Tok Pisin interface labels containing prefixed English.</a></summary>

- Replace mixed-language labels for selection states, invitations, file
  metadata, previews and time units. Wording remains provisional pending
  fluent-speaker review. Another 417 values containing the same prefix
  remain for review; unprefixed wording also needs a language audit.
- The combined run passes 61 checks; two catalog checks still fail on the
  missing due-date shortcut key. All 21 human-preference checks pass.
  Browser and screen-reader checks were not run.
- The English-placeholder count remains 42,838 across 70 languages. It
  excludes prefixed English and therefore does not measure all unfinished
  translation work.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/09b1db010fdd59c97d481b662a14478243ef77b6">Translate 86 Tok Pisin Blockly maths messages.</a></summary>

- Preserve source tokens, constants, numeric bounds, operand order and
  calculation meanings. Advanced mathematical loan terms and paraphrases
  remain low confidence pending fluent-speaker review.
- The combined run passes 59 checks; two catalog checks still fail on the
  missing due-date shortcut key. All 21 human-preference checks pass.
  Browser and screen-reader checks were not run.
- Remaining counted English placeholders: 42,838 across 70 languages.
  The broader language and wording audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6bf4e05a42c7d52c9d840acfbc3fd1b473a52413">Translate 82 Tok Pisin Blockly editing and accessibility messages.</a></summary>

- Preserve source tokens, deletion scope, copy/paste direction, navigation
  directions and screen-reader states. Technical wording remains provisional
  pending fluent-speaker review.
- The combined run passes 57 checks; two catalog checks still fail on the
  missing due-date shortcut key. All 21 human-preference checks pass.
  Browser and screen-reader checks were not run.
- Remaining counted English placeholders: 42,924 across 70 languages.
  The broader language and wording audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/88980db8821658513b11a27bb577b540ef01fffa">Translate 61 Tok Pisin Blockly input and field labels.</a></summary>

- Fill 60 counted placeholders and one short label, preserving source tokens,
  pixel states, input positions and arithmetic operand roles. Technical
  wording remains provisional pending fluent-speaker review.
- The combined run passes 55 checks; two catalog checks still fail on the
  missing due-date shortcut key. All 21 human-preference checks pass.
  Browser and screen-reader checks were not run.
- Remaining counted English placeholders: 43,006 across 70 languages.
  The broader language and wording audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9f1df3c9ad527e60ddaed6bf00aa888c01ba8961">Translate 68 Tok Pisin Blockly variable, colour and workspace messages.</a></summary>

- Preserve source tokens, variable definition safeguards, colour ranges,
  keyboard controls and workspace search announcements. Technical wording
  remains provisional pending fluent-speaker review.
- The combined run passes 54 checks; two catalog checks still fail on the
  missing due-date shortcut key. All 21 human-preference checks pass.
  Browser and screen-reader checks were not run.
- Remaining counted English placeholders: 43,066 across 70 languages.
  The broader language and wording audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/33714c2e82131e45e000815f0c3553000af3858f">Translate 75 Tok Pisin Blockly list-operation messages.</a></summary>

- Fill 73 counted placeholders and two short labels, preserving source tokens,
  indexing, insertion, removal and list transformation behavior. Technical
  wording remains provisional pending fluent-speaker review.
- The combined run passes 52 checks; two catalog checks still fail on the
  missing due-date shortcut key. All 21 human-preference checks pass.
  Browser and screen-reader checks were not run.
- Remaining counted English placeholders: 43,134 across 70 languages.
  The broader language and wording audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c2e74b871294956e416057951453ca4dd6679369">Translate 33 Tok Pisin Blockly loop-control messages.</a></summary>

- Fill 26 counted placeholders and seven short labels, preserving source
  tokens, loop exits and conditional branches. Technical wording remains
  provisional pending fluent-speaker review.
- The combined run passes 50 checks; two catalog checks still fail on the
  missing due-date shortcut key. All 21 human-preference checks pass.
  Browser and screen-reader checks were not run.
- Remaining counted English placeholders: 43,207 across 70 languages.
  The broader language and wording audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5bd8ced1f7e5624e339c9527360e731dc0416fbd">Translate 50 Tok Pisin Blockly logic and function messages.</a></summary>

- Fill 47 counted placeholders and three short labels, preserving existing
  translations, source tokens, truth conditions and function return behavior.
  Technical wording remains low confidence pending fluent-speaker review.
- The focused run passes 49 checks; two catalog checks still fail on the
  due-date shortcut key mismatch. All 21 human-preference checks pass.
  Browser and screen-reader checks were not run.
- Remaining counted English placeholders: 43,233 across 70 languages. The
  broader language and wording audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d0233d3b3f20850562c2155a6c07a0989876f88e">Translate 55 Tok Pisin Blockly text-operation messages.</a></summary>

- Preserve existing translations, source tokens, search and replacement
  arguments, letter case and trim directions. Technical wording remains low
  confidence pending fluent-speaker review.
- The focused run passes 47 checks; two catalog checks still fail on the
  concurrent due-date shortcut key. All 21 human-preference checks pass.
  Browser and screen-reader checks were not run.
- Remaining counted English placeholders: 43,280 across 70 languages. The
  broader language and wording audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5d5129e8d41050fea6ea47f47f726789ab5aacc9">Translate 84 Tok Pisin Scrum planning and report messages.</a></summary>

- Preserve existing translations, source tokens, sprint membership, report
  caveats and export actions. Technical wording remains low confidence pending
  fluent-speaker review.
- Nine focused checks and all 21 human-preference checks pass. The catalog
  completeness check still fails on the concurrent due-date shortcut key.
  Browser and screen-reader checks were not run.
- Remaining counted English placeholders: 43,335 across 70 languages. The
  broader language and wording audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bb3ce92dd835bf950ced37282769c91e224fd0e2">Translate 63 Tok Pisin synchronization messages.</a></summary>

- Preserve existing translations, source tokens, conflict choices, local
  content, report limits and missing-versus-null estimate behavior. Technical
  wording remains low confidence pending fluent-speaker review.
- Six focused checks and all 21 human-preference checks pass. The catalog
  completeness check still fails on the concurrent due-date shortcut key.
  Browser and screen-reader checks were not run.
- Remaining counted English placeholders: 43,419 across 70 languages. The
  broader language and wording audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d0f781c34992b999e64679a5568385d2b6987d3e">Translate 46 Tok Pisin recovery messages and correct two rule labels.</a></summary>

- Replace English placeholders and English-prefixed Rules/Trigger labels,
  preserving source tokens, editor constraints and delivery recovery limits.
  Technical wording remains low confidence pending fluent-speaker review.
- Two focused checks and all 21 human-preference checks pass. The catalog
  completeness check still fails on the concurrent due-date shortcut key.
  Browser and screen-reader checks were not run.
- Remaining counted English placeholders: 43,482 across 70 languages. The
  broader language and wording audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/445aaa85e8859a1b5153e468cdece50c849f966d">Translate 86 Māori Blockly mathematical messages.</a></summary>

- Preserve existing translations, source tokens, formula literals, statistical
  operations and interval boundaries. Compound wording remains provisional
  pending fluent-speaker review.
- The focused run passes 59 checks; two catalog checks still fail on the
  concurrent due-date shortcut key. All 21 human-preference checks pass.
  Browser and screen-reader checks were not run.
- Remaining counted English placeholders: 43,528 across 70 languages. The
  broader language and wording audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3c6051128ee4cd5b70a07ef1695380bb7dee2282">Translate 46 Māori Blockly editing and accessibility messages.</a></summary>

- Preserve existing translations, source tokens, editing actions, deletion
  counts and screen-reader state announcements. Technical wording remains
  provisional pending fluent-speaker review.
- The focused run passes 57 checks; two catalog checks still fail on the
  concurrent due-date shortcut key. All 21 human-preference checks pass.
  Browser and screen-reader checks were not run.
- Remaining counted English placeholders: 43,614 across 70 languages. The
  broader language and wording audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2b4ceae5d9457d5b6b137d28cb64f2ba0ff56d99">Translate 61 Māori Blockly input and bitmap labels.</a></summary>

- Fill 60 counted placeholders and the short on label, preserving existing
  translations, source tokens, pixel states, operand roles and coordinates.
  Accessibility compounds remain provisional pending fluent-speaker review.
- The focused run passes 56 checks; two catalog checks still fail on the
  concurrent due-date shortcut key. All 21 human-preference checks pass.
  Browser and screen-reader checks were not run.
- Remaining counted English placeholders: 43,660 across 70 languages. The
  broader language and wording audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/68aed9007e1abaebc67812354a8d646e306a67b3">Translate 82 Māori workspace, colour and navigation messages.</a></summary>

- Preserve existing translations, source tokens, stack counts, search shortcuts,
  colour ranges and movement directions. Accessibility compounds remain
  provisional pending fluent-speaker review.
- The focused run passes 55 checks; two catalog checks still fail on the
  concurrent due-date shortcut key. All 21 human-preference checks pass.
  Browser and screen-reader checks were not run.
- Remaining counted English placeholders: 43,720 across 70 languages. The
  broader language and wording audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a558558467ef26494550336586b91b3e21693665">Translate 75 Māori Blockly list-operation messages.</a></summary>

- Fill 73 counted placeholders and two short labels, preserving existing
  translations, source tokens, list actions, copy behavior and separators.
  Technical wording remains provisional pending fluent-speaker review.
- The focused run passes 53 checks; two catalog checks still fail on the
  concurrent due-date shortcut key. All 21 human-preference checks pass.
  Browser and screen-reader checks were not run.
- Remaining counted English placeholders: 43,802 across 70 languages. The
  broader language and wording audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/03b2bfa69db856e98f2ba9854ec26f3aa9933e3c">Translate 55 Māori Blockly control and variable messages.</a></summary>

- Fill 48 counted placeholders and seven short labels, preserving existing
  translations, source tokens, loop conditions and variable warnings.
  Technical wording remains provisional pending fluent-speaker review.
- The focused run passes 51 checks; two catalog checks still fail on the
  concurrent due-date shortcut key. All 21 human-preference checks pass.
  Browser and screen-reader checks were not run.
- Remaining counted English placeholders: 43,875 across 70 languages. The
  broader language and wording audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ce8bbf7455efdb39b3a6db4b11091a3d058fb8e8">Translate 50 Māori Blockly logic and function messages.</a></summary>

- Fill 47 counted placeholders and three short labels while preserving existing
  translations, source tokens, truth conditions and return behavior. Technical
  wording remains provisional pending fluent-speaker review.
- The focused run passes 49 checks; two catalog checks still fail on the
  concurrent due-date shortcut key. All 21 human-preference checks pass.
  Browser and screen-reader checks were not run.
- Remaining counted English placeholders: 43,923 across 70 languages. The
  broader language and wording audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/49feb5123e8978ce6956324e988c95c1cb15ca28">Translate 55 Māori Blockly text-operation messages.</a></summary>

- Preserve existing translations, source tokens, search and replacement
  arguments, letter case and trim directions. Technical wording remains
  provisional pending fluent-speaker review.
- The focused run passes 47 checks; two catalog checks still fail on the
  concurrent due-date shortcut key. All 21 human-preference checks pass.
  Browser and screen-reader checks were not run.
- Remaining counted English placeholders: 43,970 across 70 languages. The
  broader language and wording audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1d9176bc01ccadc84c94ccdd862a5b661c893339">Translate 46 Māori recovery and rule-editing messages.</a></summary>

- Preserve existing translations, source tokens, editor constraints, delivery
  uncertainty and cancellation limits. Recovery terminology remains provisional
  pending fluent-speaker review.
- Nine focused checks and all 21 human-preference checks pass. The catalog
  completeness check still fails on the concurrent due-date shortcut key.
  Browser and screen-reader checks were not run.
- Remaining counted English placeholders: 44,025 across 70 languages. The
  broader language and wording audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8b381e19de809e4d14f042b04df450a92652c952">Translate 147 Māori Scrum and synchronization messages.</a></summary>

- Preserve existing translations, source tokens, Scrum report limits, Sync
  conflict choices, local content and missing-versus-null estimate behavior.
- Seven focused checks and all 21 human-preference checks pass. The catalog
  completeness check still fails on the concurrent due-date shortcut key.
- Browser and screen-reader checks were not run. Technical compounds remain
  provisional pending fluent-speaker review.
- Remaining counted English placeholders: 44,071 across 70 languages. The
  broader language and wording audit continues.

Thanks to xet7 !

</details>

Thanks to above GitHub users for their contributions and translators for their translations.
