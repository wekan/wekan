# Jira import

## Native JSON time-tracking import

The native Jira JSON import reuses WeKan's spent-time field (hours) and
numeric custom fields for original and remaining estimates (hours). It creates
only fields supplied by the export, hides them from minicards by
default, and allows selecting the original estimate through existing Scrum
estimate settings.
It accepts numeric second values from `fields.timetracking`, or the equivalent
flat issue fields when the nested value is absent. Explicit zeroes are preserved.
Validation runs before creating the board. Localized duration strings are not
parsed, partial worklog pages are not summed, and no historical sessions are
fabricated. Native WeKan export retains these values. Jira sprint mapping and
synchronization remain separate implementation work.

The numeric fields follow [Atlassian's issue API](https://developer.atlassian.com/cloud/jira/software/rest/api-group-issue/).
The two numeric custom fields are named `Jira original estimate (hours)` and
`Jira remaining estimate (hours)`. Native WeKan custom-field settings control
their visibility; no new permission or external service is introduced.

On the import page, Dates selects spent time and Custom Fields selects
original/remaining estimates. Both nested and flat source values are removed
when their section is excluded, so fallback values cannot restore them.

Jira JSON export converts these hours back to integer seconds. Dates selection
controls spent time; Custom Fields controls original/remaining estimates.
Imported estimate fields carry `settings.jiraTimeField` markers, so renaming
one does not break export. Export does not infer meaning from matching names.
Older fields without markers, duplicate mappings and invalid values are omitted.
Native WeKan export/import and whole-board duplication retain the markers,
remap custom-field IDs and preserve Scrum's selected estimate field. Browser
regression coverage exports the resulting boards back to Jira and verifies
the original numeric seconds. This preserves time totals, not
individual worklog entries or all Jira Scrum data.


## Explicit Scrum estimate mapping

On the Jira import page, optionally enter the numeric estimate field ID
(for example `customfield_10016`) and its unit (for example `points`). Both
Scrum and Custom Fields must be selected. The importer uses this exact field,
never a guessed field name or a fixed installation-specific field number.
It creates one hidden numeric custom field and selects it as the board's Scrum
estimate source. Scrum remains disabled and its optional fields remain hidden.

The JSON equivalent is `wekanScrumMapping: { estimateFieldId:
"customfield_10016", estimateUnit: "points" }` at the document root.
Missing/null estimates stay unknown and explicit zero is preserved. Non-numeric,
negative or excessive values fail before board creation. The selected field must
occur in the issues or have a numeric entry in the root `schema`; an included
schema entry must declare it numeric. Jira export retains the original field ID
and mapping. Native export and board duplication retain the custom-field markers
and remap the local estimate field. Duplicate export mappings are omitted.
This mapping does not reconstruct historical sprint estimates or enable Sync.

When the export includes its field schema (search with `expand=names,schema`),
the field box offers the numeric fields it declares, story points first. If
exactly one field has Jira Software's story points type
(`com.pyxis.greenhopper.jira:jsw-story-points`) and no field is entered, that
field is used, in points - it is identified by its type, not by its name. With
two such fields, or none, nothing is chosen for you.

## Scrum issue types and workflow categories

The Jira importer maps `fields.issuetype.name` to the existing hidden Scrum
issue-type field. It maps stable `status.statusCategory.key` values `new`,
`indeterminate` and `done` to list categories `todo`, `doing` and `done`.
It never infers completion from translated status names. Board administrators
can select the existing done-list completion policy in Scrum settings; import
does not enable Scrum or change the default completion policy or visibility.

The Scrum import selection controls both mappings. Invalid issue-type values
and conflicting known categories for statuses merged into the same named list
are rejected before creating the board. Unknown category keys remain unmapped.
Jira export includes the same fields when Scrum is selected. A WeKan `backlog`
list category has no distinct Jira status category and is omitted.

Status names are treated as literal text, including names such as `constructor`
or `__proto__`. Dependency references resolve only to issue keys present in
the imported file; missing keys cannot resolve to JavaScript object properties.

These mappings follow the [Jira issue field representation](https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issues/)
and [stable status category keys](https://docs.atlassian.com/DAC/javadoc/jira/reference/com/atlassian/jira/issue/status/category/StatusCategory.html).
Sprint snapshots, multiple fix versions, epic relationships and
automatic schema mapping remain separate implementation work. In particular,
an external sprint's current membership cannot reconstruct its original
commitment snapshot. Native WeKan export retains imported issue types and list
categories through the existing Scrum transfer format.

## Sprints, fix versions, rank and epics

Search with `expand=names,schema` so the export says which custom fields are
the Sprint, Rank and Epic Link fields. WeKan finds them by their schema type
(`gh-sprint`, `gh-lexo-rank`, `gh-epic-link`) or, without a schema, by those
names; it never guesses a `customfield_*` number. Then:

| Jira | WeKan |
| --- | --- |
| Future sprint | Planned sprint with its goal and dates; the card's sprint |
| Active sprint | Planned sprint, reported in Admin Panel → Problems → Recovery: issue search has no commitment snapshot, so start it in WeKan to begin measuring |
| Closed sprint | Not imported, reported: WeKan does not invent a commitment or close snapshot |
| Fix version | Release, released with its date or planned. Every fix version is one of the card's releases (a card can be in several since 2026-10-08). Versions still also become `version:` labels |
| Rank | Backlog order: backlog rank 1, 2, ... in Jira's rank order |
| Epic Link | The card's parent when the epic is imported too; otherwise reported. Newer Jira's `parent` was already followed |

Both of Jira's sprint forms are read: sprint objects, and the older
`com.atlassian.greenhopper.service.sprint.Sprint@...[id=...,state=...]`
strings. The board's Scrum settings are turned on when sprints or releases are
imported. These fields are not also imported as text custom fields.

Jira export writes each of a card's releases as one of its `fixVersions` when
Scrum is selected: the original Jira version id when the release came from
Jira (the WeKan release id otherwise), whether it is released, its planned end
as `releaseDate` and its notes as `description`. Importing that file gives the
card the same releases again.

## Migrate from Jira Server (Atlassian) to Wekan

Originally from @webenefits at https://github.com/wekan/wekan/discussions/3504

Hello all,

I wanted to share here my experience with migrating data from Jira (Server) to Wekan. It took me 1 - 2 days to find a solution and I think it makes sense to record it here so that successors have it easier.

In order to not transfer everything manually and still keep all comments and (at least) links to attachments from Jira, my plan was to first migrate everything from **Jira → Trello** and then from **Trello → Wekan**, since importing from Trello works very well. :ok_hand:

Unfortunately there is no "easy" variant to transfer data from Jira to Tello.
First of all, I found "TaskAdpater" through various threads, which allows you to transfer data between different tools (including Jira and Trello). This would have been a nice way to do it, since the data would not have gone through a third party. Unfortunately, this didn't work because of the newer API token authentication in combination with Jira server. Also other suggested things like "Zapier" were not really functional.

## Related

- https://www.theregister.com/2023/10/16/atlassian_cloud_migration_server_deprecation/
- https://news.ycombinator.com/item?id=37897351
When I had almost given up, I had the idea to look for "Power Ups" (Addons) in Trello. And indeed, I found what I was looking for! The power up is called "Unito Sync". It allows you to synchronize individual projects in both directions between tools like Jira and Trello. And the best: There is a 14-day trial version.

That's how it worked in the end. You have to migrate each project separately and make some fine adjustments afterwards. However, all data including comments and attachments (as links) are integrated!

Here again briefly the way:

1. Create a Trello dummy account
2. Create a new board there
3. Install and register Power Up Unito Sync
4. Create a new "flow" for the current project in Unito Sync
5. Synchronize
6. Export data from Trello again afterwards
7. Import JSON into Wekan


I hope I could save you some work with this. Good luck! :four_leaf_clover:
Greetings
Alexander

## Duplicate issue links

Standard Jira `Duplicate` issue links now import as `duplicates` for
`outwardIssue` and `is-duplicated-by` for `inwardIssue`, following the
[Atlassian issue-link model](https://developer.atlassian.com/cloud/jira/platform/issue-linking-model/)
and [Data Center link types](https://developer.atlassian.com/server/jira/platform/rest/v11000/api-group-issuelink/).
Both endpoints must be included in the imported board. Self-links and missing
targets are skipped; the existing one-relation-per-target rule still applies.
The names `Duplicate` and `Duplicates` are recognized case-insensitively.
Custom/localized link names retain the existing generic relation fallback.

The relation is editable in card details and survives native WeKan board
export/import and History restoration. It does not merge duplicate cards or
change blocker analytics. The separate Jira JSON exporter currently omits
issue links; native WeKan export is the supported transfer path for these links.
