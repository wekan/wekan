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

### Resolve text and time conflicts

Open the list's Sync popup and run Sync. For conflicting title, description or
spent-time values, the popup shows the current WeKan value and freshly fetched
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
unfinished.

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
total, not individual worklogs. Original/remaining estimates and Scrum planning
records remain pending Sync mappings.

Configuration methods: `setListSyncSource`, `hasListSyncCredential`,
`syncListNow`, `previewListSync` (`server/methods/listSync.js`), all requiring board write
access.

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
