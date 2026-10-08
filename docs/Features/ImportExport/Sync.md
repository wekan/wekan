# [Big Picture Roadmap](../../../FUTURE.md): Import/Export/Sync with WeKan

## List sync (implemented, Jira end to end)

A WeKan list can be marked as synced from an external tracker through
`setListSyncSource`. It stores public settings in `Lists.syncSource`
(`models/lists.js`) and the credential separately, server-only, in `ListSyncCredentials`
(`models/listSyncCredentials.js` - no publication exists for it anywhere, so
it can never reach the client). `server/listSync.js` registers a
`quave:synced-cron` job (the same scheduling infrastructure
`server/checklistResetSchedule.js` and `server/scheduledRules.js` use) that,
every 15 minutes, fetches each synced list's current items
(`server/lib/listSyncFetch.js`) and reconciles them against WeKan
(`models/lib/listSyncReconcile.js`, pure and unit-tested in
`tests/listSyncReconcile.test.cjs`):

- a new external item creates a WeKan card;
- upstream title/description changes update the card when local text still
  matches the last synchronized source value; local-only text edits are retained;
- an external item that disappeared is **archived**, never deleted - "old
  entries are at list history", per the request this implements.

Scheduled runs use the account that last saved the Sync settings. The server
stores that account ID only in the selected private credential version, alongside
the token; clients cannot choose a different author. Saving settings again binds
the next version to the saving user even when the token is retained. Before
fetching and at subsequent guarded writes, the job requires an existing account
with login enabled and current full-list board write access. Assigned-only
access is insufficient for a scheduled full-list run. Collection hooks execute
with that user context so activities and ordinary History have an author.

After upgrading, save existing Sync configurations once to authorize their
scheduled runs. Versions without an author remain paused and display an error
in Sync; they do not guess an account. Deleted/disabled accounts and removed or
reduced board permissions also stop scheduled runs. Save with an authorized
account to resume. Manual Sync retains the invoking user's existing access
checks. These guards do not cancel writes already in flight or make card writes,
History, activities and downstream notifications one durable transaction.

Before reconciliation, Sync validates the response using the same source-shape
validator as import. A malformed response or parser failure records the existing
last-sync error and leaves cards unchanged; it is not an empty source.
Parsed tasks must also have unique, valid external IDs and text fields. Missing
IDs, duplicates and malformed normalized tasks abort instead of being silently
dropped or overwritten during reconciliation. A valid
empty issue array retains the existing archive behavior.

Fetchers collect every advertised page before reconciliation. Standard Jira
Cloud tenant URLs ending in `.atlassian.net` use REST v3 enhanced JQL search,
request the fields used by the shared parser, and follow `nextPageToken` until
`isLast` is true. Missing termination metadata and repeated tokens abort.
Other Jira URLs retain REST v2 search, which follows `startAt`/`total`, rejects changing totals and
stalled offsets, and advances by the actual returned issue count. GitHub,
Gitea/Forgejo and GitLab follow `Link: rel="next"`; GitLab's `X-Next-Page` is
also supported. Pagination stays on the configured origin and HTTP redirects
are refused. Use the provider's canonical URL. Loops, malformed pages, later
request failures and limits (1,000 pages or 100,000 items) abort the run without
returning a partial collection. Normal per-request timeouts still apply.

Provider contracts: [Jira search](https://developer.atlassian.com/server/jira/platform/rest/v11002/api-group-search),
[Jira Cloud enhanced search](https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issue-search/),
[GitHub pagination](https://docs.github.com/en/rest/using-the-rest-api/using-pagination-in-the-rest-api),
[GitLab REST](https://docs.gitlab.com/api/rest/) and
[Gitea pagination](https://docs.gitea.com/1.26/development/api-usage).
Automated coverage uses mocked provider responses; live-account verification
remain outstanding; Jira Cloud custom domains and government-cloud hostnames
need explicit endpoint configuration in a future change. Pagination cannot
provide an atomic upstream snapshot. Title/description synchronization now stores the last accepted source text on
the card. If both sides change a field differently, the run stops before card
writes and the existing Sync popup identifies up to five conflicting source IDs
and fields. Align the local and upstream text, then retry to accept a common
baseline. Older synced cards without a baseline are adopted only when their
text matches; differing legacy text requires the same resolution.

Sync text writes preserve empty strings and surrounding whitespace in both
the card and its source baseline while retaining schema validation. An empty
source description therefore survives storage and does not cause a repeated
baseline update on every run. Older missing baselines are adopted only when
the local text agrees with the source.

Updates compare the original title, description, archive state, baseline and
board/list location before writing. A concurrent edit aborts the remaining run.
This is not a transaction: earlier successful updates or creations may remain.
New Sync cards use a deterministic database ID for the list, source identity
and external issue ID. Concurrent creation attempts therefore cannot insert
two cards for the same item. A duplicate insertion stops the run with a
creation-conflict error rather than overwriting local work or reporting success.
Retry to reconcile the winning card. If it was moved out of the watched list,
return it before retrying or review **Create replacement here** in the popup.
Existing cards retain their IDs and continue matching by source identity.
This protects new creations only; existing legacy IDs are unchanged.

Scheduled Sync, manual Sync and settings saves now share a private database
reservation per list. A competing request reports that Sync is busy before
fetching or changing credentials. Each operation rereads the list after claiming
the reservation. It expires after 60 seconds and renews every 15 seconds, also
checking ownership before application writes. A replacement worker can reclaim
an expired reservation; the old owner stops at its next check and cannot release
the replacement's reservation. These records contain no provider secrets.

Settings saves first stage an immutable credential version, then update public
settings and `Lists.syncRevision` together in one conditional list write.
Readers select only that revision's credential for that list, never another
staged version. A stop before activation leaves the old pair active; a stop
after activation leaves the new pair active even if cleanup did not finish.
Clearing settings also advances the revision, preventing an old save from
matching a previous empty state. Cleanup removes only the previously selected
credential, so delayed cleanup cannot delete a newer save's token. Legacy
unversioned credentials are adopted on the next same-source settings save.
No token is included in public list data.
Upgrade all server processes that save Sync settings together: older code
updates credential rows in place and does not honor these revisions.

An hourly credential sweep snapshots up to 500 unselected version IDs per list
without reading tokens. Before deleting that snapshot, it conditionally changes
the server-owned `syncCredentialFence` and advances `syncCredentialGeneration`.
Every settings save compares both values when activating its staged credential.
A delayed save from before the sweep cannot select a retired token. Deletion
uses only the snapshotted immutable IDs: later staging stays intact even if
another sweep or counter repair finishes before the first deletion resumes.
Larger backlogs are collected over subsequent sweeps.

Malformed, negative, fractional and exhausted counters reset to zero with a
fresh fence. Ordinary settings saves can repair them too, including a list with
no credential rows; the repair and settings activation are one conditional
write. A numeric reset cannot make an old save eligible again. Unselected rows
with malformed generation values are retired by identity, without trusting
their counters. Selected tokens remain usable; saving settings replaces their
old metadata with a new immutable version. A late abandoned insert is reclaimed
on a later sweep. Failed or uncertain cleanup can be retried.

The scan streams credential IDs and lifetime metadata without reading tokens,
includes disabled Sync configurations, and isolates failures between lists.
Legacy unversioned rows remain protected while a legacy configuration can
select them. Saving settings
binds an explicit version; later sweeps can retire those old rows too. Rows for
missing lists are removed by exact credential identity after checking that
the list is absent.
The sweep does not publish or log credential contents. Upgrade **all** processes
before relying on this cleanup: an older writer that ignores the opaque
fence can still issue unsafe activation writes.

New lists receive a server-generated `syncCredentialIncarnation` on insertion,
including imports that bypass collection hooks. Copies and same-ID recreation
receive a fresh value. New credential versions carry that value, and both
credential reads and settings activation require the same lifetime. Existing
lists without a lifetime field continue using their existing credentials;
a recreated list cannot fall back to those legacy tokens.

Orphan cleanup snapshots each credential identity before checking list absence
and deletes only that identity. Recreating a list between the check and deletion
cannot lose the new list's token. A delayed old save cannot activate on the new
list, and late abandoned staging is collected on a later sweep. Deleted-list
credentials are retained until the next successful hourly scan, not necessarily
removed at the moment of deletion. Soft-deleted lists still exist and keep their
selected credential for undo. Upgrade all writers together, and stop writers
before restoring a database backup; raw database restores bypass this lifecycle.

Reservations do not make card writes a multi-document transaction or durable
job queue. A card write already issued before lease loss cannot be fenced by a
later ownership check. Fencing of in-flight card writes and persisted
reconciliation checkpoints remain pending. Unselected private credential
versions are never used as a fallback credential, including before cleanup.
Server clocks must be synchronized
for the expiry comparisons. A failed run still requires a retry from the start.
Card and subtask copies omit external Sync IDs, source type and text baselines,
so independent work does not become a second target for an upstream issue.
Existing duplicate local mappings stop the run before updates or archives;
resolve the duplicate mapping before retrying.
Source-absence archives use the same conditional card selector. Sync does not
recursively archive subtasks: each archived card must be matched to an absent
source item. If an active subtask is outside the archive plan, the run stops
before card writes. Concurrent child creation is not covered by a transaction.
New Scrum metadata mappings and fully atomic synchronization remain pending.

### Resolve field conflicts

Open the list's Sync popup and run Sync. For conflicting title, description or
spent-time or mapped estimate values, the popup shows the current WeKan value and freshly fetched
source value. Choose **Keep WeKan value** or **Use source value** for one field
at a time. Keeping local text accepts the source value as the new comparison
baseline, so an unchanged upstream value does not raise the same conflict on
the next run. Neither choice writes to the external provider.

Each choice fetches the source again and verifies the displayed comparison
against the current card, baseline and selected configuration. A changed
comparison must be reviewed again. The conditional card write also rejects a
local change made after that fetch. Only the chosen field and its source
baseline change; Sync then retries and shows remaining conflicts, up to 50 at
a time. The existing popup reports provider and concurrency failures.

Resolution requires board write access. For assigned-only writers, **Sync now**
reviews only their assigned existing cards and reports that full-list Sync was
not run. It does not create, update or archive the whole list or change shared
Sync status. Such users can resolve conflicts on their assigned cards; the
database write also requires their assignment to still exist. Removing an
assignment invalidates an old preview. Restricted previews omit all other
cards, including their identifiers. New shared conflict status uses generic text.
Permissions and assignment scope are checked again after fetching. Scheduled
Sync and manual runs by unrestricted writers retain full-list behavior.
Moved-card creation conflicts still require manual repair. This does not make
the whole Sync run transactional or fence
already-issued card writes after lease loss. New UI strings are English source
entries with the normal English fallback; translation filling remains outside
the current work queue.

### Preview saved Sync changes

**Preview changes** fetches the saved source and uses the same merge, operation
selection and conflict checks as Sync now. It shows create/update/archive
counts and up to 100 card summaries. A status-only difference is not counted as
an update because automatic moves between lists are not implemented. Changed
comparison baselines are included in the write plan and named in the preview.
Conflicts prevent a ready plan; existing conflict choices remain available.

The preview does not change cards, configuration or the shared Sync status,
including on fetch failure. It uses the normal private per-list reservation
while reading, then releases it. It can inspect a saved disabled source too.
Only unrestricted board writers can request the full-list preview. Restricted
writers are refused before fetching, and access is checked again before a
result is returned. Normal assigned-card conflict review remains available.

The omission inventory counts normalized fields excluded by saved settings or
lacking a Sync mapping, such as labels, owners, dates and upstream status. It
also shows counts of parser warnings and unsupported entries. No omitted field
values, credential values or parser warning bodies enter this inventory.
Fields/rows and title lengths are bounded. Titles render as text.

A second inventory inspects the fetched issue data before normalization. It
reports source paths for unmapped fields (including attachments, comments,
estimates and custom extensions), fields excluded by the saved selection,
alternate values unused by the parser, and values converted to text or another
representation. GitHub/Gitea/Forgejo pull requests excluded by the issue parser
are counted too. Unknown objects are reported at their first unmapped path as
a whole. Counts group occurrences across items; they are not byte-loss counts.
The report contains no field values. It shows at most 100 path/reason rows,
counts additional occurrences separately, and shortens field names to 80
characters. Paths use JSON Pointer escaping for literal slashes and tildes.
Pagination envelopes discarded by the fetcher are outside this inventory.

The preview uses saved settings; changing the form clears the displayed plan.
Sync now fetches and validates again, so the preview is not an approval token
for a frozen plan. The source inventory follows the current parsers; it is not
a complete provider schema or a mapping editor. Binary and history transport
and complete source schema coverage remain unfinished.

### Recent Sync runs

**Recent Sync runs** reads the latest 20 full-list run reports from the last 30
days. Manual and scheduled runs persist a private starting record before
fetching or changing cards, then store bounded normalized/source field coverage
and a final status. Successful runs include created, updated and archived card
counts. A run with omitted, excluded or converted fields is shown as completed
with warnings. Changing source settings does not erase the list's history.

An unfinished report means the run may still be active or its outcome was never
recorded. Failed and unfinished runs may have changed some cards. Reports do
not infer partial counts, replay writes or roll them back. If the starting
record cannot be stored, the run does not start; a lost final acknowledgement
may leave an unfinished or failed report even after card writes committed.
Previews, disabled/unsupported sources and assigned-only conflict reviews do
not start full-run reports. Individual conflict resolutions are not full runs.

The collection has no publication or client writes. Reading checks full-list
write access and the list's board/lifetime before and after fetching. A new list
reusing an old ID cannot read its reports. The method returns a bounded,
explicit projection; source URLs, credentials, error bodies and card/omitted
field values are never copied into these reports. Refresh explicitly to read
new results. MongoDB expires records after 30 days through a TTL index; reads
also exclude older records. Backends without TTL support need operator-managed
cleanup of old diagnostic records. This is diagnostic retention, not a durable
operation plan: restart/replay checkpoints and in-flight write fencing remain
unfinished. Instance administrators can also inspect reports across boards in
[Problems → Recovery](../Admin-Panel/Problems/Recovery.md#sync-run-diagnostics),
with status filters, literal board/list ID search and ten-row server pagination.
That view checks administrator permission before and after reading; it includes
retained diagnostics for deleted lists and offers no replay or undo action.

If a list's saved Sync operation can no longer be finished - for example the
list was reconfigured or the user who started it lost write access - that list
cannot Sync and its popup reports it. An instance administrator can discard the
operation in
[Problems → Recovery](../Admin-Panel/Problems/Recovery.md#list-sync-operations-that-cannot-be-replayed);
changes already applied stay and the next Sync compares the list with its
source again.

### Repair duplicate mappings

If multiple visible cards map to the same source item, the popup shows each
extra card and the card whose mapping will remain. Choose **Keep duplicate as
a local card** to remove only that extra card's Sync identity and source
baseline. Its title, description, assignments and other content remain intact;
later Sync runs ignore it. No card or upstream item is deleted.

The retained mapping is selected consistently by card ID, independent of
database cursor order. It is never offered for detachment, so simultaneous
repairs cannot each choose to remove the other's retained mapping. The full
visible mapping group is included in the preview comparison: an added,
removed or edited member requires a new review. The selected card also uses
the existing conditional write and assignment checks. Sync retries after
each successful repair. If the source item has disappeared, normal configured
archival rules still apply to the retained synced card.

Assigned-only writers see only their assigned group members. A duplicate that
is visible only across different users' assignments needs an unrestricted
writer to review the full group. This repair does not merge card contents,
or choose arbitrary replacement IDs. Creation collisions have a separate
replacement action below.

### Replace a moved or detached Sync card

A card occupying the next creation ID stops the plan before normal card writes.
The popup offers **Create replacement here** to unrestricted writers. Its preview
contains only the incoming source title and description, never the old card's
content or location: that card may now belong to a private board.

The action refetches the source and checks the source settings, selected target
and preview fingerprint. A changed or missing source item or disabled creation
invalidates the choice. It records a conditional decision in the private
`listSyncTargets` collection, then the popup retries Sync to create the card.
The old card stays unchanged. Assigned-only writers cannot choose replacements.

The target is deterministic and stored before insertion. Another worker or a
retry after a lost acknowledgement uses the same target; concurrent inserts
still meet the unique card ID constraint. Later replacements form a new target
from the previous one, and stale decisions cannot overwrite a newer choice.
These private decisions persist across reconnects and process restarts and
contain no credentials. They must not be reset when cleaning up credentials.
This does not provide transactions or fence a card write already issued by a
worker that subsequently loses its lease.

### Keep a parent whose archival is blocked

When the source item disappears but active subcards outside the archive plan
remain, Sync stops before applying the normal reconciliation plan. The popup
offers **Keep this card local** for the affected parent. This removes only its
Sync mapping and baseline. The parent stays intact, and no subcard is edited,
archived, detached or deleted by this action.

The choice refetches the source and checks that the same parent still has an
archive conflict. A returned source item, removed blocker, changed parent or
disabled archival invalidates the old preview. Subcard identifiers and content
are not returned in the preview. Assigned-only writers can resolve their own
assigned parents, with the assignment checked in the conditional write; full
list reconciliation remains disabled for those callers.

Sync retries afterward. Independently synced subcards retain their own source
rules. If the source item later returns, the existing stable-ID collision guard
preserves the detached local parent and may report a creation conflict. An
unrestricted writer can then explicitly choose a replacement as described above.

### Which servers List Sync may reach

List Sync requests go through the same SSRF guard as webhooks and imports
([SyncBleed](https://wekan.fi/hall-of-fame/syncbleed/), GHSA-5q84-p3vr-f3xv).
A server address on a private, loopback or link-local network - `127.0.0.1`,
`localhost`, `10.x`, `172.16-31.x`, `192.168.x`, `169.254.x` (cloud metadata),
`::1` and the like - is refused when Sync settings are saved and again on every
request, DNS is resolved once and pinned, and redirects are refused. A refusal
is shown as *The Sync server address is not allowed* and recorded as SyncBleed
in Admin Panel → Problems.

When a failed request is reported to the board, only the server's origin and
the HTTP status are shown, never what the server answered.

A self-hosted Gitea, Forgejo, GitLab or Jira on the server's own network is
allowed by the server administrator only, with the environment variable
`LIST_SYNC_ALLOWED_PRIVATE_HOSTS`: a comma-separated list of exact host names
or addresses as written in the Sync server URL, for example
`LIST_SYNC_ALLOWED_PRIVATE_HOSTS=gitea.lan,10.0.0.20`. Board members cannot
change it. Requests to an allowed host still refuse redirects and time out.

### Source identity and switching projects

Each card mapping now includes the provider, normalized server URL (including
its path), and project. Equal issue IDs from different projects are separate
cards. Switching source leaves the previous source's cards and baselines intact;
they are neither updated nor archived by the new source. Reconnecting the same
source reuses its mappings. Card and subtask copies omit this identity.

Credentials are bound to the same source. A blank token preserves a credential
only when the source is unchanged. Enter a credential again when changing the
provider, server or project; the previous credential cannot authorize a fetch
for the new source. GitHub uses its fixed API server, while an omitted GitLab
URL means gitlab.com. Equivalent URL casing/default ports and trailing slashes
retain identity; project names remain case-sensitive. URL credentials, query
parameters and fragments are rejected.

After upgrading, save existing Sync settings once before resuming Sync. Saving
the same source binds its legacy cards and credential. Changing or clearing an
existing source first binds its legacy cards to the **old** configuration. If
the old configuration was already removed and unbound Sync cards remain, use a
new list: their original project cannot be inferred safely. Clearing a source
retains card identities and removes its saved credential.

A configuration change detected after fetching aborts before reconciliation.
Status updates are conditional on the fetched configuration, so an old run
cannot recreate cleared settings. This is still not transactional: concurrent
jobs, configuration/credential writes and changes during card writes require
further coordination. Local Chromium tests exercise overlapping IDs, source
switches, empty sources, credential replacement, legacy adoption and reconnects
against an HTTP provider fixture; live-provider verification remains separate.

Fetching and parsing REUSE the existing one-time-import code in
`models/lib/externalParsers.js` (`parseJira`, `parseGithub`, `parseGitlab`,
`parseGitea`) rather than a second implementation; `SYNC_CAPABLE_SOURCES`
lists which of those parsers emit the `externalId` reconcile matches on.
Jira works end to end (fetch, parse, reconcile, create/update/archive).
GitHub/GitLab/Gitea/Forgejo share the exact same job and reconcile logic -
their own fetchers exist in `listSyncFetch.js` - but are less exercised in
this pass; see the CHANGELOG's TODO Later for what remains (moving a card
across lists on an upstream status change, and covering more than issues).
The existing list Sync popup has Title and Description switches. Both default
to selected, including configurations saved before this feature. Excluded text
is not compared, overwritten or advanced in the conflict baseline. New cards
still require a title: with Title excluded they use `Imported item`; an
excluded description starts empty. Selecting no text fields is supported.

The same popup also has **Add Card** and **Move Card to Archive** switches.
Both default to enabled, preserving existing configurations. Disable Add Card
to update matched cards without creating newly discovered items. Disable Move
Card to Archive to retain cards whose items disappear from the source. The
switches are independent of field selection. Disabled archival skips child
archive checks; updates still use conflict detection and conditional writes.
Results count only the selected operations. These settings use the existing
board write permission and do not change manual card creation or archival.

For Jira, **Spent time (hours)** is an additional opt-in switch, off for existing
configurations. The shared Jira parser converts numeric seconds using the same
conversion as import. Zero is a real value; an absent total never clears local
time. The source baseline and conditional update include spent hours, so timer
or manual time edits participate in conflict detection. This syncs the aggregate
total, not individual worklogs. Sprints and releases sync through their own
opt-in switches; see "Sprints and releases (Scrum planning)" below.

Jira also offers **Original time estimate (hours)** and **Remaining time estimate
(hours)**. Each is opt-in and uses the numeric field created by Jira import,
identified by its original/remaining time marker. Exactly one matching numeric
field must exist on this board for each selection; missing, foreign-board or
ambiguous fields are refused. These fields must be distinct from a separately
selected custom estimate field. Saving records the mapping identities, and
changed mappings require another settings save before Sync can write.

Numeric `originalEstimateSeconds` and `remainingEstimateSeconds` become hours;
flat `timeoriginalestimate` and `timeestimate` are fallbacks when the nested
field is absent. Localized duration strings are not parsed. Zero is retained,
missing values leave the local field unchanged, and explicit null removes only
the selected value. Original, remaining and custom estimates can update together
without replacing unrelated custom fields. Local edits use the same baseline,
Keep local/Use source review and conditional array writes as other estimates.
These values are aggregate issue totals, not sprint scope history or individual
worklogs. The existing History/activity hooks still lack durable effect replay.

Jira also offers an opt-in **Estimate** switch. Select a numeric custom field on
this board whose settings contain a Jira field ID and estimate unit, as created
by a mapped Jira import. The popup displays that ID and unit. Saving records the
mapping identity; a changed/deleted field, unit or mapping stops Sync until the
settings are saved again. Jira Cloud search explicitly requests the selected
custom field. Other custom fields remain unmapped in source-coverage reports.

The selected field stores the estimate as a number without unit conversion.
Zero is a real value. An absent source field leaves the local value untouched;
explicit null removes only the mapped custom-field entry. Other card custom
fields are retained. Accepted source values and the mapping identity form the
comparison baseline. Local edits survive an unchanged upstream value; competing
changes require the existing Keep local/Use source review. Switching mappings
invalidates the old estimate baseline. The card write compares the entire
previous custom-field array so a concurrent edit causes a retry, not a lost edit.
The existing entity History hook records the custom-field change. Successful
array and dotted writes also emit one ordinary custom-field activity per changed
field identity, after the card is saved. Reordering and unchanged values emit
nothing; zero and false remain real values, and clearing a valued field emits
an unset activity. Advanced-filter rules evaluate the saved values using the
board's custom-field definitions. Empty field assignment alone emits no value
activity. Conflicts and rejected writes do not emit success activities.

These hooks compare the collection's previous and post-write snapshots. They do
not provide durable effect replay or exactly-once delivery across crashes or
concurrent writes between snapshot reads. Card storage, activity insertion,
History and downstream rules/notifications remain separate operations.

The private write-plan engine can now store and validate mapped-estimate
snapshots for recovery, preserving unrelated custom fields and source mapping
identities. Real MongoDB tests verify interrupted update/clear replay through
a test adapter. Manual and scheduled Sync are not yet connected to that engine.
A shared mutation planner now builds conditional field patches for saved steps,
preserving unrelated metadata. Production Sync shares its literal-value
selector helper; the complete recovery/application/effect adapter is still
unfinished. Stable caller-persisted intents and private completion records now
let that engine recognize a finished request after cleanup, without rebuilding
its plan. Production Sync does not yet persist or use those intents/records.

Automatic Jira schema discovery, arbitrary mapping creation in this popup,
original/remaining time-estimate mapping, other providers' estimates and durable
replay remain unfinished. Mapping/permission checks and card writes are still
separate operations; these checks do not provide cross-document atomicity.

Configuration methods: `setListSyncSource`, `hasListSyncCredential`,
`syncListNow`, `previewListSync` (`server/methods/listSync.js`), all requiring board write
access.

### Sprints and releases (Scrum planning)

The Sync settings offer **Sprint (Scrum planning)** and **Releases (Scrum
planning)** as opt-in switches, off for existing configurations, and only for
the sources whose issues carry them. A switch a source cannot carry is refused
when the settings are saved. The mapping is applied only while Scrum is enabled
on the list's board; otherwise, and while a Scrum import, Scrum History restore
or sprint rollover is unfinished, the run syncs everything else, leaves planning
alone and reports `planningSkipped` with the reason.

| Source | Card sprint | Card releases |
| --- | --- | --- |
| Jira | the Sprint custom field: its active sprint, otherwise the last future one listed | every entry of `fixVersions`, in Jira's order |
| GitLab | `iteration` (Premium) | `milestone` |
| GitHub, Gitea, Forgejo | none (their issues have no sprint) | `milestone` |

Jira's Sprint field id differs per site, so Sync finds it the way the Jira
import does: by its schema (`com.pyxis.greenhopper.jira:gh-sprint`) in Jira's own
field list (`GET /rest/api/2/field`). Exactly one field must say it is the Sprint.
Jira Cloud search then requests that field and `fixVersions` explicitly; Jira
Server already returns every navigable field. Both the legacy string form and
the object form of a sprint are read (`models/lib/jiraScrumPlanning.js`).

What a source value means:

- **absent, or malformed** (an attribute the payload does not carry, a sprint
  value in an unknown form, a fix version without an id or name): the card's
  planning is left as it is. A source never clears planning by omission.
- **only finished**: a Jira issue whose only sprints are closed, or a GitLab
  issue in a closed iteration (`state` 3), names no sprint the card can be in;
  the card keeps its sprint. A finished WeKan sprint is never given new work.
- **null or empty** (`iteration: null`, `milestone: null`, an empty Sprint
  field, `fixVersions: []`): the source says the issue has no sprint or release.
- **a sprint or releases**: the card is put in them.

Each source sprint or release is found on the list's board by its source id
first (the record's `provenance` - the source system, the server URL and the
id, as the Jira import also records it), then by name (case and surrounding
spaces ignored), skipping a record another source id of the same server already
claims and, for a sprint, one that is closed or cancelled. Records of any other
board are never read or used. A record that is not found is created on the
board with the source's name, goal or description and dates (a GitLab
iteration without a title is named by its dates), as a planned sprint, or as a
planned or released release (Jira's `released`, a closed milestone). A date that
is not a real calendar date is dropped; the record is still created. A sprint is
always created planned: an active Jira sprint or current GitLab iteration has no
commitment snapshot in issue JSON, as the Jira import also reports. A created
record has an id derived from the board and its source, so a retried or replayed
run finds it instead of making another; it is recorded in Scrum History like a
sprint or release made by hand. Existing records are not renamed or redated
by Sync. Only records a planned card change names are created, and a preview
creates nothing.

The card's planning is compared with the planning Sync last applied, stored in
the card's source baseline (`syncLastSource.sprint`, an empty string for no
sprint, and
`syncLastSource.releases`, both in this board's record ids):

- when the source's planning for the issue changed since that baseline, or there
  is no baseline yet, the source's value is applied - except that a clear is
  applied only against a baseline, so a first Sync never removes a card's
  existing planning;
- when the source's planning did not change, the card keeps what it has: a local
  sprint or release change stays until the source changes that issue's planning.

Releases merge as sets: releases the source removed since the baseline leave the
card, releases it added join it, and a release only WeKan gave the card stays.
Moving a card out of a sprint adds that sprint to the card's past sprints, as a
manual move does, and every planning change moves the card's Scrum revision on
by one, so an open Scrum editor sees the change. Running Sync again with the
same source changes nothing. Planning never produces a field conflict review.

The writes take the same paths as every other Sync field. On the direct path the
card's planning and revision are part of the conditional update's comparison, so
a Scrum edit made meanwhile stops the update with "Sync card changed while
applying updates" instead of being overwritten; the change is then recorded as
the same Scrum History row a manual planning change records. On the durable path
(Sync effects enabled) each card step carries the card's planning and revision
in its before and after snapshots (`server/lib/listSyncSteps.js`); the journal
accepts a planning change only when nothing but the sprint, past sprints and
releases changed, the revision moved on by exactly one, and the step's baseline
records the planning mapping (`server/lib/syncOperationJournal.js`). Its History
plan records the Scrum row, so undo and redo restore the card's planning through
Scrum History, and a replay after a restart applies the same step once
(`tests/listSyncPlanning.test.cjs`). A record created before a step that names
it was later deleted is not re-checked when that step replays.

The source-coverage report shows the mapped attributes as converted to `sprint`
or `releases` when selected; unselected, the GitLab and GitHub milestone and the
GitLab iteration are still reported as the tags the one-time import makes, and
Jira's `fixVersions` as unmapped. Sprint goals and release notes are written
only when a record is created; Jira's epic links, rank and closed-sprint history
are not synced.

## Implemented formats and completeness work

The current contract, newest provider/API references, complete field inventory,
loss accounting and restart behavior are maintained in
[Format-Coverage.md](./Format-Coverage.md). The historical issue table below is
retained as provenance; it is not the current format specification.

## Historical issue inventory

[More](https://github.com/wekan/wekan/issues/4578)

### WeKan kanban

From | Import | Export | Sync | In Progress
------------ | ------------- | ------------- | -------------  | -------------
[CSV/TSV](./CSV/CSV.md) | CSV/TSV | [Custom Fields](https://github.com/wekan/wekan/issues/3386), [Hours](https://github.com/wekan/wekan/issues/1907), [Custom Fields value and name](https://github.com/wekan/wekan/issues/3769) | | [Error 500](https://github.com/wekan/wekan/issues/5132)
JSON | [Checklists](https://github.com/wekan/wekan/issues/904), [Sandstorm Header](https://github.com/wekan/wekan/issues/1850), [Upload](https://github.com/wekan/wekan/issues/4615) [File](https://github.com/wekan/wekan/issues/2178), [Templates Name](https://github.com/wekan/wekan/issues/2727), [Cards/Lists](https://github.com/wekan/wekan/issues/2340), [List Order](https://github.com/wekan/wekan/issues/1602), [Invisible](https://github.com/wekan/wekan/issues/5154), [List Color](https://github.com/wekan/wekan/issues/3615), [Comments](https://github.com/wekan/wekan/issues/4228), [Labels](https://github.com/wekan/wekan/issues/813), [Subtasks](https://github.com/wekan/wekan/issues/4420) | JSON, [Checklists](https://github.com/wekan/wekan/issues/904), [Cards/Lists](https://github.com/wekan/wekan/issues/2340), [Card](https://github.com/wekan/wekan/issues/4197), [Labels](https://github.com/wekan/wekan/issues/813), [List Order](https://github.com/wekan/wekan/issues/1602), [Version](https://github.com/wekan/wekan/issues/1922) | [Bidirectional](https://github.com/wekan/wekan/issues/1322) |
[Any](https://github.com/wekan/wekan/issues/3775)
Excel | | XLSX | |
Board HTML |  | [Card Content](https://github.com/wekan/wekan/issues/4004), [Link to Minicard](https://github.com/wekan/wekan/issues/3812) | |
Clipboard | [Markdown](https://github.com/wekan/wekan/issues/2142) | [Markdown](https://github.com/wekan/wekan/issues/2142), [Board JSON](https://github.com/wekan/wekan/issues/1918) | |
Text | [DragDrop](https://github.com/wekan/wekan/issues/1941) | [Boards/Swimlanes](https://github.com/wekan/wekan/issues/2185) | |
Print | | [Board](https://github.com/wekan/wekan/issues/2794) | |
CLI | [Sandstorm](https://github.com/wekan/wekan/issues/1695) | [Sandstorm](https://github.com/wekan/wekan/issues/1695) | |
WeKan All Boards  | | [ZIP](https://github.com/wekan/wekan/issues/4902) | | 

### Other kanban

From | Import | Export | Sync | In Progress
------------ | ------------- | ------------- | -------------  | -------------
[Trello](./Trello/trello/Migrating-from-Trello.md) | JSON, [Feedback](https://github.com/wekan/wekan/issues/1467), [File Upload](https://github.com/wekan/wekan/issues/529) | | | [Attachments](https://github.com/wekan/wekan/issues/4877), [Sandstorm Attachments](https://github.com/wekan/wekan/issues/2893), [CheckLists UserId](https://github.com/wekan/wekan/issues/4417)
[Jira](./Jira/Jira.md) | | | |
[Asana](./Asana/Asana.md) | | | |
[Zenkit](./ZenKit/ZenKit.md) | | | |

## Wishes

### Other Kanban

From | Import | Export | Sync | In Progress
------------ | ------------- | ------------- | -------------  | -------------
[Focalboard](https://github.com/wekan/wekan/issues/4659) |  |  |  |
[Google Tasks](https://github.com/wekan/wekan/issues/5182) |  |  | |
[Notion](https://github.com/wekan/wekan/issues/4659) |  |  |  |
[TaskWarrior](https://github.com/wekan/wekan/issues/827)  |  |  |  |
[Todo.txt](https://github.com/wekan/wekan/issues/152) |  |  |  |
[Todoist](https://github.com/wekan/wekan/issues/4659) |  |  |  |
[Redmine](https://github.com/wekan/wekan/issues/1150) |  |  |  |
[RestyaBoard](https://github.com/wekan/wekan/issues/3181) |  |  |  |
[Rust Kanban](https://github.com/yashs662/rust_kanban) |  |  |  |
[Leo and Emacs Org mode](https://github.com/wekan/wekan/issues/2186)  |  |  |  |
[Microsoft Planner](https://github.com/wekan/wekan/issues/2642)  |  |  |  |

### Issues and SCM

From | Import | Export | Sync | In Progress
------------ | ------------- | ------------- | -------------  | -------------
[GitHub](https://github.com/wekan/wekan/issues/5145) |  |  | |
[GitLab](https://github.com/wekan/wekan/issues/5145) |  |  | |
[Fossil SCM](https://github.com/wekan/wekan/issues/5145) |  |  | |
[Git-Bug](https://github.com/wekan/wekan/issues/5145) |  |  | |
Gitea
Gogs | | | [wekan-gogs](https://github.com/wekan/wekan-gogs) | 

### Wiki

From | Import | Export | Sync | In Progress
------------ | ------------- | ------------- | -------------  | -------------
Confluence |  |  | |

### Stored activity delivery coordinator (internal)

`server/lib/syncActivityDelivery.js` composes the durable delivery stages used
by a saved activity's `completeDelivery` callback. It requires a durable rules
adapter first, then confirms the existing stored notification and webhook plan
IDs. A fulfilled Promise without the correct receipt does not complete a stage.
All required adapters are checked before any effect. Ownership and captured
feature policy are checked before and after every stage; each adapter receives
an isolated copy of the original activity and policy.

When notifications are disabled in the saved policy, rules still run and must
confirm their receipt; notification and webhook adapters are not invoked.
Replay revisits the stages through their own receipt reconciliation, rather
than using in-memory success flags. The coordinator does not itself guarantee
that an arbitrary supplied adapter is durable.

`server/notifications/storedActivityDelivery.js` binds this coordinator to the
actual stored notification and webhook entry points and current feature flags.
It deliberately requires the caller to provide durable rule execution: calling
ordinary `RulesHelper.executeRules` is not enough to make rule effects safe to
replay. This internal binding is not invoked by manual or scheduled Sync yet.
Durable rules, shared History-chain coordination, job activation and lifecycle
remain prerequisites. The current tests exercise the coordinator and binding
with scripted adapters; they do not claim end-to-end rule execution or external
webhook delivery.

### Stored rule selection plans (internal)

`server/lib/syncRulePlan.js` prepares and persists an immutable rule selection
for one saved activity/effect identity. It freezes the ordered rule documents
before awaiting action reads and saves each action definition or an explicit
null for an absent action. Duplicate matches remain separate invocations with
ordinal receipt identities, matching ordinary rule iteration. An empty result
is persisted too, so later rules cannot silently join a resumed operation.

The plan binds the exact activity hash, actor, board, card and effect ID. Its
checksum, shape, rule ownership and action references are validated on replay.
Preparation is bounded to 1,000 invocations and 14 MiB, with incremental size
checks; it does not repeatedly serialize an ever-growing complete plan. Lost
insert replies are reconciled by readback, and simultaneous first builders
reuse whichever valid plan was actually stored.

This is selection/configuration storage, not action execution. Cross-board
action definitions retain their destination so a future executor can validate
access there. Target resolution, substituted variables, relative dates, live
rule/action permission checks and durable per-action mutation receipts still
need implementation. No external side effect is performed by this module, and
it is not wired to ordinary rules or manual/cron Sync. Do not acknowledge the
rules stage merely because its selection plan was stored.

The internal `captureStoredSyncRulePlan` entry point now binds preparation to
`RulesHelper.findMatchingRules` and raw action documents. It stores plans in the
private `listSyncRulePlans` collection, with board/card indexes and no TTL.
Before preparing or reading a saved plan, it checks the owning journal guard,
current activity/notification policy, exact stored activity, enabled actor,
board write permission, assigned-only card restrictions and current board/list/
card scope. A moved card, deleted list, changed activity or revoked actor stops
capture. Stored plans are reused even if rule configuration later changes;
the future action executor must still apply its live permission/configuration
checks before effects.

The collection is registered at server startup but has no publication or client
write access, including for administrators. This entry point captures matching
configuration only: it never calls `performAction` or `executeRules` and is not
a rules-completion receipt. Ordinary rule behavior and manual/cron Sync remain
unchanged until durable command execution is implemented.

The internal `executeRulePlan` coordinator validates the complete saved plan,
reads all invocation checkpoints and resolves every required action adapter
before dispatch. Checkpoints bind the entire plan checksum and invocation
identity. Completed checkpoints must form an ordered prefix; damaged evidence,
unsupported pending actions or false acknowledgements stop execution. Explicit
missing-action and empty selections receive durable no-op completion evidence.
Lost insert replies are reconciled through exact stored readback, and a fresh
coordinator skips confirmed invocations before continuing the remaining order.

This coordinator requires a journal-owned lease and live scope/policy guard.
Each action adapter must prepare and reconcile its own durable command and
mutation receipts before returning the invocation ID. A crash after a mutation
but before its checkpoint revisits that adapter, so ordinary `performAction`
must not be supplied as an adapter. This module does not register production
storage or enable manual/cron Sync. Durable command preparation, target and
variable resolution, real action adapters and their integration remain TODO.

`runStoredSyncRules` now binds this coordinator to the actual saved selection
and private `listSyncRuleReceipts` storage. The collection has an effect index,
no TTL, no publication and denied client writes. The entry point shares the
capture guard for exact activity, live policy, actor permissions and current
board/list/card scope, including when reading completed receipts. It requires
explicit durable adapters for pending actions; no ordinary action fallback is
installed. Empty saved selections can be completed without action adapters.

This is still an internal entry point, not a manual/cron activation. The current
scope guard also stops after a rule moves the source card; durable movement
commands need explicit before/after scope handling before those adapters can be
implemented. Full-app coverage exercises actual rule selection and receipt
storage using a scripted action acknowledgement, not a real durable mutation.

Localized email preparation is now available separately through
`EmailLocalization.prepareEmail`. It resolves the recipient/site language,
loads its catalog and returns the final transport fields without sending.
Ordinary `sendEmail` uses the same preparation, preserving literal body, HTML,
sender and optional Reply-To behavior. A future rule-email command can persist
these final strings before dispatch, avoiding changes from later locale edits.
No durable rule-email command or dispatch worker is installed by this change.
The notification outbox is not a drop-in rule-email adapter: it groups messages
by user and resolves the delivery address later, whereas a rule may name an
external address and needs its captured message and recipient preserved.

The internal `ensureRuleEmailCommand` storage primitive freezes fully prepared
transport fields for one email invocation. It requires the complete validated
rule plan and invocation index, binds the command to the plan checksum,
activity hash, actor and board/card scope, and verifies exact stored shape and
content checksum on every read. The first persisted recipient, sender, subject,
text, HTML and optional Reply-To remain authoritative. Preparation must perform
no send or mutation; it runs only when no command exists.

Commands accept only those transport fields, bound header lengths and a 1 MiB
mail payload. Header line breaks, unknown transport options, mismatched plans,
corrupted content and unconfirmed writes are rejected. Concurrent builders and
lost insertion replies converge through stored readback. Callers provide the
operation lease and live access/policy guard; this primitive does not acquire
one. It neither enqueues nor sends mail and is not a rule-completion receipt.
Production collection registration, actual rule-variable preparation and a
recipient-aware durable dispatch worker remain unfinished.

`captureStoredSyncRuleEmailCommand` now connects command storage to actual rule
variable resolution and localization. It captures the saved selection first,
then prepares one indexed email action using the same recipient lookup, token
substitution and card-context footer as ordinary rule mail. Final localization
runs before insertion into the private indexed `listSyncRuleEmailCommands`
collection. Missing HTML is omitted rather than serialized into a null field.
The collection has no TTL or publication and denies all client writes.

Capture and replay both check exact activity, live policy, actor permission and
current board/list/card scope. A saved message remains unchanged when the card
title or action recipient later changes. This entry point only prepares and
stores: it does not enqueue mail or acknowledge a rule invocation. Dispatch,
recipient/configuration revocation handling at send time and operator recovery
still need implementation before manual/cron activation.

The internal rule-email acceptance helper derives intended recipients using
Meteor Email's own MailComposer envelope, including display names, quoted
commas, groups and internationalized domains. It rejects empty, malformed or
oversized recipient sets, deduplicates exact envelope addresses and preserves
local-part case. Confirmation requires the transport to accept every intended
address, report no rejected recipients and include no unexpected addresses.
Console-only sends, hook-suppressed results and partial acceptance cannot count
as successful delivery. These helpers do not send, persist delivery state or
install a worker. Ambiguous-send recovery and operator handling remain TODO.

The internal `dispatchRuleEmail` primitive now records an attempt before calling
its sender. It validates the immutable command against its complete parent
plan, compiles the native recipient envelope and reads back the exact unique
attempt before sending. A confirmed acceptance of every recipient permits a
conditional transition to `sent`; exact readback reconciles lost insertion or
completion replies. A confirmed sent receipt returns the invocation ID without
another send, including through a fresh database connection.

Any existing `sending` attempt stops replay. SMTP rejection, partial acceptance,
ownership loss or a crash after dispatch may leave that state; it is not safe
to infer whether the remote server accepted mail. Raw transport errors and
recipient payloads are not copied into attempt metadata. There is currently no
automatic retry or operator resolution for these attempts. The caller must
supply live scope/configuration checks, its operation lease and cancellable SMTP
capacity slot. Production collection registration, actual sender binding,
recovery controls and manual/cron integration remain unfinished.

`runStoredSyncRuleEmail` now binds attempts to private indexed
`listSyncRuleEmailAttempts` storage and dispatches final captured mail through
Meteor Email within the shared cancellable SMTP capacity slots. It requires
unchanged rule/action documents, unchanged currently resolved recipient/sender,
and the existing exact-activity, policy, actor and board/list/card guard.
Disabled matching local recipient accounts are refused; external recipients
remain supported. Account lookup ignores email address case while SMTP
acceptance still uses the native envelope exactly.

New version-2 email commands store a versioned source binding with the mail:
the ordered card IDs, board IDs, card types and link targets, plus any terminal
linked-board ID. The command checksum covers both. Capture resolves the source
once for content and binding, then rechecks access after localization. Dispatch
checks the persisted chain before and after its asynchronous policy reads;
retargeting, moving, deleting or losing read/assignment access stops delivery.
Source metadata is never passed to SMTP. Ordinary cards also receive a binding.

Version-2 source bindings also capture voting/Poker section visibility,
public-voter status and Poker end time for every card in the source chain.
Dispatch refuses changes to these visibility fields before sending captured
results or names. Version-1 source bindings remain readable for commands
captured before voting details were supported; new preparation always writes
version 5. This source-binding version is separate from the command version.
Version 3 adds terminal linked-board voting/Poker visibility to the evidence,
rechecking it independently of the wrapper card and board. Versions 1 and 2
remain valid for older snapshots that did not include linked-board voting;
all new preparation captures the target policy, including its Poker end time.
Version 4 additionally captures the six Scrum card-field visibility flags for
each source board. Changing any flag stops a stored dispatch, preventing a
previously visible Scrum value from surviving a later visibility restriction.
Earlier binding versions remain readable for pre-Scrum-content snapshots.
Version 5 records the source chains used for related-card titles and converted checklist subtasks,
including terminal linked boards. These are one-level reference chains, not recursive
card exports. Capture deduplicates references and permits up to 1,000 chains; dispatch rechecks their identity,
read/assignment access and disclosure settings even if the original card no
longer references them. Loss of board-admin access used during preparation
also blocks sending. Fingerprints of the custom-field definitions used in
Details are stored and rechecked, including later public-to-admin-only changes.
Commands including Details with an older binding require
operator recovery because their related sources cannot be inferred safely.
Commands, including source evidence and attachments, are bounded to 15 MiB.


Legacy version-1 commands remain valid for inspection, but the application
refuses dispatch without source evidence, including sent-receipt reconciliation
through this entry point. It does not guess a chain from today's links or
replace the saved mail. Operator resolution/migration remains pending.

This is an explicit internal entry point, not a scheduled worker or automatic
Sync activation. It reuses sent receipts and refuses uncertain attempts. The
full-app test uses real collections, slot ownership and command preparation,
but replaces Email.sendAsync with controlled transport responses; real network
delivery is not established by that test. Operator resolution, recovery UI and
manual/cron rule-stage wiring remain unfinished.

A second full-app test now drives `runStoredSyncRuleEmail` through the real
Meteor Email transport to a TCP SMTP server bound only to loopback. It verifies
captured subject/body/card-description content, accepted-delivery persistence
and no second connection on replay. Closing the socket after receiving DATA
but before acknowledgement leaves an uncertain attempt; replay opens no new
connection. A multi-recipient send with one accepted and one rejected address
likewise remains uncertain and is not automatically repeated. This covers the
actual local transport path, not external SMTP-provider interoperability or
operator resolution of uncertain attempts.

The stored rules coordinator now installs the durable email adapter by default.
It maps each frozen invocation to its plan index, dispatches through the stored
command/attempt entry point, and writes rule checkpoints only after the exact
invocation receipt returns. The shared saved-activity delivery binding now uses
this stored rules stage by default; explicit internal adapters remain possible.
Unsupported pending actions still fail preflight before any email dispatch.
Ordinary `performAction` is never used as a fallback.

This connects email and empty/missing-action selections through the internal
saved-activity pipeline, including when watcher notifications are disabled.
It does not activate manual/cron Sync. Other action adapters, shared History
coordination and operator resolution of uncertain sends remain unfinished.

The administrator-only `syncRuleEmailRecoveryReport` method now exposes paged
attempt metadata: command/invocation/attempt IDs, timestamps and sent,
unconfirmed or invalid status. It reads a metadata projection only, never the
command body or recipient address. Searches are literal ID matches, pages hold
ten rows, and out-of-range pages clamp to the current last page. Access is
checked before and after the read, with a per-connection request rate limit.

An unconfirmed attempt may still be in flight; the report does not infer
failure or authorize retry from its age. Counts and pages are separate reads,
so concurrent changes do not form a database snapshot. Admin Panel → Problems
shows this report; the method has no mutation, resend, discard or acknowledgement
action.

An offline maintainer can reconcile one uncertain attempt only after independent
SMTP evidence confirms acceptance of **every** recipient:

```sh
node releases/recover-rule-email.cjs --command <command-hash> \
  --attempt <attempt-UUID> --operator <maintainer-name> \
  --evidence <opaque-log-reference> --offline --confirm-accepted
```

Set `MONGO_URL` to the intended named database. Stop all application and delivery
workers, including other recovery processes, and keep them stopped throughout.
The flags are operator assertions; the tool cannot discover remote workers or
verify SMTP logs. Never use it for partial or unknown acceptance. Evidence is an
opaque reference, not recipient addresses, credentials or message content.

The tool first stores an immutable decision in `listSyncRuleEmailResolutions`,
then conditionally reconciles the exact attempt to `sent` and verifies readback.
It reads command identity metadata only and never sends, changes, discards or
resets mail. `finishedAt` records the confirmation time, not an inferred original
SMTP acceptance time. These are separate writes; if interrupted, repeat the
identical arguments while writers remain stopped. Conflicting evidence, changed
attempts and damaged decisions fail closed. A matching completed decision is
idempotent, and an already-sent attempt without a decision stays unchanged.
Normal dispatch still applies source-access guards before reusing the receipt.

Legacy unbound commands, obsolete Details bindings, partial/unknown acceptance
and online operator resolution remain unfinished. This tool does not make those
commands eligible for dispatch or activate manual/cron Sync.

### Stored archive rule command preparation

`server/lib/syncRuleArchiveCommand.js` captures archive/unarchive rule cascades
before any card write. It binds the command to the saved rule plan, invocation,
actor, board and root card. Its single timestamp and bounded card snapshots
survive restart. Descendants precede parents, matching ordinary recursive
archive/restore; an already satisfied root captures only itself, matching the
rule helper's no-op behavior.

The owner must hold the operation lease and authorize every captured card,
including children in other lists. Capture rejects cross-board descendants,
cycles, duplicate cards, malformed topology and oversized plans. Unique insert
and exact readback reconcile competing builders and lost replies. Existing
commands are validated without reselecting live descendants.

This is preparation only. Production collection registration, conditional card
application, durable History/activity delivery and invocation receipts still
need integration. Replay must recheck current permissions and apply the saved
before/after states; it must not treat command storage as execution completion.
No browser or scheduled-job entry point invokes this helper yet.

`server/lib/syncRuleArchiveApply.js` provides the internal conditional executor.
It derives stable per-card effect IDs and exact before/after predicates from a
validated command, including missing versus null parent/timestamp fields.
Archive uses the captured timestamp; restore preserves the old archive time,
as ordinary card restore does. A satisfied root produces no card units.

Before writing, it verifies every saved receipt, each card's access and every
pending card state, then requires a separate preflight of all saved effects.
It reconciles lost write acknowledgements by reading the expected after-state.
An already changed card still needs its durable effect acknowledgement. Only
then is its receipt inserted and read back, before the next parent is changed.
A final receipt requires the complete ordered prefix of per-card receipts.

The owner must supply hook-preserving card access, a live lease/access guard,
and durable effect preparation/delivery. MongoDB tests use raw collections to
exercise conditional persistence only; they do not prove ordinary Meteor hook
integration. Production binding and History/activity plans remain pending.

`server/lib/syncRuleArchiveCards.js` binds the executor to the real Cards
collection. Only the validated command's exact selectors and archive modifiers
are accepted. Writes use the saved actor and ordinary schema/business hooks;
only the owning card's archive activity and History recording are deferred.
Unrelated hooks and later ordinary edits keep their normal recording, including
after a failed or interrupted write.

Full-app Meteor coverage exercises a parent/child archive with real schema
and hooks, interrupts the child effect callback, resumes the parent and then
checks ordinary restore activity/History recording. The test uses controlled
effect callbacks; saved effect plans and production rule-stage activation are
still required before this adapter can be enabled in ordinary Sync execution.

### Stored archive History and activity plans

`server/lib/syncRuleArchiveEffects.js` prepares and persists the complete
cascade's effect plans before execution. Each card keeps a stable effect ID,
captured actor/time/list name, immutable History rows and activity payloads.
The History chain continues across unchanged children; redo candidates are
consumed only by the first actual History change. Parent identity remains in
the card mutation predicates and is omitted from field-change History inputs.

The envelope binds all effects to the archive command checksum, validates every
card plan and the cross-card hash chain, and is limited to 14 MiB. Unique insert
and readback handle lost acknowledgements without rebuilding names or events.
Disabled activity recording retains History while omitting activity plans.

The execution wrapper validates the entire stored envelope and required
adapters before card access, checks the captured live feature policy around
execution, and routes each card's completion through the shared durable
History/activity persistence coordinator. Pending delivery must acknowledge
its exact activity receipt before the next card advances. MongoDB coverage
interrupts after child History/activity insertion, then resumes on a fresh
connection without duplicate cards, History rows or activities.

Production collection registration, binding to the actual History/activity
collections and delivery service, shared History-writer coordination and
manual/cron activation remain unfinished. The test's delivery callback is
controlled; it does not prove real notification or recursive-rule delivery.

`server/lib/syncRuleArchiveActivities.js` binds every activity in a validated
archive effect envelope to ordinary Activities insertion. It accepts only the
saved IDs and exact payloads, preserves their actor and timestamp, and defers
ordinary rule/notification hooks to the separately acknowledged delivery stage.
Disabled activity plans expose no event IDs through this adapter.

The full-app archive collection test combines the real Cards, ChangeHistory
and Activities collections. It interrupts delivery after child History/activity
insertion, then resumes both child and parent, verifies exact stored payloads
and confirms replay creates no duplicates. Ordinary restore recording still
works afterward. The test controls only downstream delivery acknowledgements;
production delivery binding and shared History-writer coordination remain open.

### Private archive command storage

`captureStoredSyncRuleArchiveCommand` uses actual saved rule selection and the
private `listSyncRuleArchiveCommands` collection. The internal entry point
requires the caller's journal lease/scope guard, current activity identity,
live feature policy, enabled actor and board write access. It checks the live
rule/action documents against their frozen snapshots and authorizes every
captured descendant, including assigned-only access and current parent/list
identity. Existing commands recheck descendant access without discovering new
children. Capture writes no cards or rule-completion receipt.

`listSyncRuleArchiveEffects` and `listSyncRuleArchiveReceipts` are registered
alongside commands for subsequent execution binding. All three collections deny
browser insert/update/remove, have recovery lookup indexes and no publication
or TTL. They are not wired into ordinary/manual/cron rule execution yet.

### Internal stored archive execution

`runStoredSyncRuleArchive` now binds command/effect/receipt storage to real
Cards, ChangeHistory and Activities. It prepares effects once from current
actor/list display metadata, uses the saved actor for writes, and defaults to
`runStoredSyncActivityDelivery` for exact downstream receipts. It retains
configuration, descendant access, feature-policy and journal ownership checks
through preparation, mutation and delivery.

The caller MUST supply `withHistoryReservation(boardId, work)`. Its callback
provides `previousHash`, `redoRows` and `assertCurrent`, and must reserve the
board's History chain for the full operation. No default reservation exists.
The shared coordination of ordinary History writers is still unfinished, so
ordinary rules and manual/cron Sync do not install this archive adapter yet.
An isolated full-app test supplies a controlled reservation; that proves the
entry point's data flow, not multi-process History exclusivity.

### Durable History append coordination primitive

`server/lib/historyChainAppend.js` introduces a single persisted head per board
(including a distinct null-board scope). Conditional head replacement reserves
one exact pending row before insertion; a pending-payload checksum protects its
full snapshot. Every appender finishes a pending row and confirms its readback
before advancing the head or reserving another successor. A stalled worker has
no expiring lease that could authorize a second successor. An older helper's
conditional replacement cannot clear a newer reservation.

This primitive handles lost row/head acknowledgements, process interruption,
matching retry IDs and ownership loss. Changed retry payloads, corrupt pending
rows and false write acknowledgements fail without discarding the reservation.
Mutable undo flags do not invalidate a row's protected integrity hash. The
bounded retry loop reports contention instead of spinning indefinitely.

MongoDB coverage uses four independent clients, equal timestamps, sixteen
concurrent appends and one row interrupted before head advancement. All
seventeen rows form one chain and retry does not insert duplicates.

Ordinary `ChangeHistory.record` now uses this primitive after explicit board
migration through the schema-backed binding below. Initial head creation
requires a verified `initialHash` while legacy writers are excluded. Redo
coordination and persistent multi-row Sync ownership remain unfinished.
It does not on its own provide the archive runner's History reservation.

`server/lib/historyChainBootstrap.js` validates existing History before installing
its first coordinated head. It scans in batches of 250 and follows validated
hash ancestry rather than timestamp or cursor order. Duplicate successors,
duplicate hashes, missing predecessors, disconnected chains and changed payloads
are refused. Truly pre-integrity rows remain unchanged and outside the hashed
chain; an unhashed row claiming a predecessor is rejected.

The scan defaults to 100,000 rows and 128 MiB of inspected BSON, with explicit
configurable limits. Exceeding either limit refuses initialization instead of
using a truncated history. Cursors close on success, validation failure or
ownership loss. Existing heads are validated and retained without rescanning or
resetting them; new heads require exact readback after insertion.

The caller must exclude all old and new writers for the complete scan and head
installation via `assertExclusive`. This helper does not create that exclusion.
Tests exercise reversed/equal timestamps, legacy data, invalid ancestry, bounded
scans, lost replies and real MongoDB iteration across multiple batches followed
by append on a new connection. The server binding below drains participating
writers; deployment-wide exclusion still needs a caller-provided guard.

### Schema-backed coordinated History storage

`server/lib/storedHistoryChain.js` registers private `historyChainHeads` with a
unique board index and denied browser writes. No publication or TTL exposes or
expires it. `initializeStoredHistoryChain` binds verified bootstrap to the real
History collection and still requires the caller's exclusive writer guard.

`appendStoredHistoryChain` fills the existing History schema's defaults and
validates the complete input before reserving a pending row. It requires a
stable caller-supplied row ID and timestamp. Inserts use ordinary ChangeHistory
schema validation while preserving whitespace and captured timestamps. Missing
heads are refused; even if a head disappears after the initial read, append
cannot recreate it from an old cached hash.

Ordinary `ChangeHistory.record` now registers through private
`historyWriterGates`. Existing boards remain on the legacy append path until
explicit migration. Schema validation precedes admission, so an invalid input
cannot leave an uncertain writer token. The existing best-effort logging and
null result on failure remain in place. A migrated board never falls back to
legacy insertion when its coordinated head is missing.

### Migration writer admission

`server/lib/historyWriterGate.js` provides persistent per-board admission for
participating writers. Legacy writes register unique tokens before their
callback. Beginning migration changes the gate to `draining`, refusing new
legacy writers while registered writers finish. Once their tokens are removed,
the same migration ID can enter `migrating` and provide the bootstrap helper's
exclusive guard. A verified ready head permits the final `coordinated` state;
later calls route only to the coordinated writer, with no legacy fallback.

Writer and migration ownership do not expire. Successful writes remove only
their own token with conditional readback; failed/uncertain callbacks retain
the token. Such evidence needs explicit recovery before migration can advance,
not a time-based takeover that could overlap a delayed write. Interrupted
migration resumes with its existing UUID; another UUID cannot take over.

MongoDB tests use separate clients to pause a legacy insertion, close admission,
finish the old row, validate/bootstrap its actual head and append through the
new coordinated path. Lost acknowledgements, invalid gates and uncertain writes
are covered separately. `migrateStoredHistoryChain` binds admission, bootstrap
and permanent switching to actual private collections. It requires a stable
migration UUID and `assertDeploymentExclusive`: the caller must exclude old
server versions and every writer outside this admission path throughout the
transition. No automatic migration, DDP method or deployment-exclusion detector
is provided. Completed retries validate the existing head. Before switching,
the shared migration routine rescans actual History and requires its head to
match the stored head with no pending append. A stale but structurally valid
head cannot authorize migration.

Full-app tests migrate an ordinary History row, append ten concurrent records
and verify one complete chain; removing the head refuses later recording
without legacy fallback. Existing card and archive hooks also pass. Browser
coverage checks member/admin denial across all nineteen private collections.

Offline retained-token retirement is available below. Online recovery,
mixed-version rollout, redo/undo coordination and multi-row Sync reservations
remain unfinished. Draining refuses new records;
the best-effort recorder currently returns null for those failures. Durable
recovery of such failed recording is still required before automatic rollout.

### Online recovery of abandoned writers

Every legacy History writer on an upgraded server keeps a lease beside its gate
token, in `historyWriterLeases`, and renews it while it works. Before each
legacy History insert, it claims that row's id in the lease. A writer that
died, or whose write failed, stops renewing. Once the lease has been expired
for another full lease period, the writer can be taken over without stopping
anything:

```sh
node releases/recover-history-writer.cjs --board BOARD_ID --recover-expired
```

The command fences the lease, so the old writer can neither renew nor claim
again. If a row id was claimed, it inserts a tombstone under that id, so the
unique `_id` makes a late insert fail. A row that had already landed stays as
written. Only then does it remove the token. Tombstones use the reserved
board id `#history-writer-fence` and are never shown on a board. Live writers
and tokens without a lease are listed and left alone.

A chain migration does the same by itself while the board drains. The lease is
`HISTORY_WRITER_LEASE_MS`, 1,000 to 600,000 ms, default 30,000.

Safety comes from the fence, not the clock. Clock differences only decide when
an abandoned lease may be taken, and a slow writer that is taken loses its
write with an error. A token with no lease was written by an older server, or
before the upgrade; it still needs the offline procedure below.

### Offline recovery of uncertain writer admission

With every application instance, maintenance command and other database writer
stopped, inspect the board gate using an explicitly named database:

```sh
node releases/recover-history-writer.cjs --board BOARD_ID
```

Set `MONGO_URL` in the environment. Inspection is read-only, returns the stored
gate or null, and never creates a gate. Use `--null-board` instead of `--board`
for global History. Record the writer UUID and, for a draining gate, its existing
migration UUID. Keep all writers stopped throughout recovery:

```sh
node releases/recover-history-writer.cjs --board BOARD_ID \
  --retire WRITER_UUID --migration MIGRATION_UUID --offline
```

For a legacy gate omit `--migration`. The command removes only that exact writer
from a legacy/draining gate with matching migration ownership. Conditional
replacement preserves other writer tokens and reconciles a lost acknowledgement
by exact readback. Repeating retirement is harmless while the gate remains in
the same recovery state; changed ownership or mode is refused. Concurrent gate
changes cause failure rather than a retry that could discard new evidence.

`--offline` is the operator's assertion, not an automatic process detector.
Removing a token cannot cancel an insert already in flight. Do not restart
writers until inspection confirms the result and the maintenance operation is
finished. A failed command can have applied its write before losing readback;
inspect again with writers stopped before deciding what to retry.

This action releases admission evidence only. It never inserts, deletes or
repairs History rows, proves that a missing change was recorded, initializes a
head, or completes migration. Subsequent bootstrap must still validate the
actual chain and refuses forks or damaged rows. Real MongoDB tests run the CLI
in separate processes after an insert with a lost reply, verify unchanged
History, reject missing offline confirmation/wrong ownership and bootstrap the
persisted row after retirement. Missing-row replay and online recovery remain
unfinished. There is no browser recovery action.

### Offline board migration to coordinated History

After upgrading every application instance, stop all writers and keep them
stopped until this maintenance finishes. Supply a new lowercase UUID once for
the migration, save it, and reuse it for every retry:

```sh
node releases/recover-history-writer.cjs --board BOARD_ID \
  --migrate MIGRATION_UUID --offline
```

`MONGO_URL` must explicitly name the database. Use `--null-board` for global
History. This is an explicit permanent switch for one scope, not an automatic
rollout. Do not restart older application versions or writers that bypass the
admission/coordinated append path afterward.

The command uses the same migration routine as the server. It closes legacy
admission, drains registered writers, bootstraps the head from validated History
and then switches to coordinated mode. Uncertain tokens stop it in `draining`;
inspect and retire only confirmed stopped writers as described above, then
retry with the same migration UUID. A different UUID cannot take over.

Malformed chains, forks, missing predecessors, stale stored heads and pending
appends prevent the switch. A failed bootstrap retains `migrating` ownership
for inspection and retry. Neither the command nor a retry repairs, deletes or
silently resets History or an existing head. The scan remains bounded to
100,000 rows and 128 MiB; larger histories require a separate reviewed workflow.
A completed retry validates the head and preserves coordinated mode. Ordinary
writes after application restart use the coordinated writer for that board.

Tests run the actual command in separate processes across drain, token
retirement, failed stale-head verification and resume; they then append through
the ordinary writer-admission interface. Empty global History is supported.
Forked History is rejected without changing its rows or creating a head.
This command does not recover missing records, coordinate redo/undo operations,
provide multi-row Sync reservations or enable archive jobs automatically.

### Coordinated Scrum restoration events

Scrum undo/redo's strict restoration-event writer now uses the same persistent
writer admission as ordinary History recording. Its deterministic event ID is
preserved by the schema-backed append binding. On a migrated board, concurrent
ordinary edits and restoration retries share one head; retries confirm the
original event rather than changing its timestamp, payload or predecessor.
Legacy random-ID events remain acceptable only after exact content and
integrity verification.

Before migration, restoration insert and persisted-event confirmation both run
inside legacy admission. A lost insert acknowledgement with a valid readback
can release its token. A failed confirmation propagates and keeps recovery
evidence. Closed admission or a missing migrated head never falls back to a
legacy insert. Existing verified restoration rows can still acknowledge a retry
without making another write.

Full-app coverage interleaves eight retries of one restoration with five
ordinary edits after an initial legacy event: seven rows form one chain. It
also rejects changed retry contents, migration-time insertion and a missing
coordinated head. This coordinates the restoration audit rows only. The
restored entity mutations, source-row undo/redo flags, redo invalidation and
multi-row Sync reservations still need shared operation-level coordination.
