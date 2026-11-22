# Rules (Automation)

## What it is

WeKan **Rules** automate your board: when something happens (a **trigger**), WeKan
runs an **action**. This is WeKan's equivalent of Trello's Butler.

A rule links a **trigger** to an **action**:

> **When** a card is moved to list "Done" → **then** mark the card complete.

Triggers and actions both support a wildcard `*` meaning "any" (for triggers) or
"the card's current value" (for actions).

A rule may also have up to ten more triggers and ten more actions: open the
rule's **Rule details** and use **Add another trigger** or **Add another
action** (and **Remove**). *The rule runs when any of its triggers happens. Its
actions run in order.* - the rule's own action first.

## Read more

- [Event condition action](https://en.wikipedia.org/wiki/Event_condition_action)
  and [Business rules engine](https://en.wikipedia.org/wiki/Business_rules_engine)
  on Wikipedia - the trigger-and-action model.
- [IFTTT](https://en.wikipedia.org/wiki/IFTTT) - "if this then that", where the
  rules' original name comes from.
- [Trello Butler](https://trello.com/butler) - the Trello automation WeKan's
  rules correspond to.
- [Business process automation](https://en.wikipedia.org/wiki/Business_process_automation)
  and [Workflow](https://en.wikipedia.org/wiki/Workflow).
- [cron](https://en.wikipedia.org/wiki/Cron) - the five-field schedule of the
  cron trigger.
- In WeKan: [IFTTT](../IFTTT/IFTTT.md), [Blocks view](Blocks.md),
  [Rule suggestions](../Rule-Suggestions.md), [Bots](../Bots.md),
  [REST API](../../../API/REST-API.md).

## How to use it

Open Rules from the board sidebar → **Board Settings** → **Rules**, or straight
into one of its views listed under it: **List view**, **Workflow view**,
**Blocks**, **History** or **Import / Export rules**. The Rules page is a
**fullscreen page** below the top bar (it used to be a small popup), and its
right sidebar is the board's own sidebar, so the same entries are there. Click
**Back** at the top of the rules list (and of its Workflow, Bots, Blocks and
History views) to go back to the board, or pick a view in the **Board View**
menu; the trigger, action and rule details pages have their own **Back**, to
the rules list.

**Add a rule**

1. Open the board's right sidebar → **Board Settings** → **Rules** (or **List
   view**). You must be a board admin.
2. Type a title, pick a trigger and fill in its fields.
3. Pick an action and fill in its fields; the rule is saved with it.
4. The rule appears in the list; it fires from then on, unless it is disabled.

### Managing rules

On the Rules page you can:

- **Add** a rule: type a title, pick a trigger, then pick an action.
- **View** a rule's trigger/action in plain language.
- **Edit** (rename) a rule inline.
- **Delete** a rule.
- **Select all / Unselect all** rules, and **Delete selected**.
- **Export selected** (or all) rules — see [Import / Export](#import--export) below.
- Switch to **Workflow view** — a **drag-and-drop visual editor**. Drag a trigger
  and an action into the builder (`When … → Then …`) and add the rule, or drag an
  action onto an existing rule to change what it does. Existing rules are shown as
  connected `When → Then` nodes you can delete. This is similar to a Jira workflow.
  - The palette offers the parameter-free / "any" variants (e.g. "Card is created",
    "Move card to top", "Archive card", "Every day at 09:00"), so a rule can be built
    entirely by dragging. Parameterized rules (a specific list, label, member, or
    schedule time) are still created with the form builder on the **List view**.

### Showing a board's Rules to its members

[#2217](https://github.com/wekan/wekan/issues/2217). Rules are edited by board
admins only. Members can be shown them, read-only, so they know what happens
when they move a card:

1. **Admin Panel → Settings → Features → Rules**: tick **Boards may show their
   Rules to members, read-only**. It is off by default.
2. On the board's Rules page, a board admin ticks **Show these Rules to board
   members, read-only**.

Members of that board then have **Rules** in Board Settings, with the rules
list and each rule's details, and no control that changes a rule. The server
methods that change rules check for a board admin as before, so this gives
nobody a right to change anything. Without both ticks, only board admins see
the Rules page.

### Example: archive completed cards after 90 days

This common "process" works out of the box with a scheduled **card-aging** trigger
plus the **archive** action:

> **When** a card has been in list **"Completed"** for **90** days (checked daily)
> → **then** archive the card.

Create it on the Rules page (Scheduled triggers → "card in list for N days"), or via
the [REST API](#rest-api).

## How the numbers are calculated

- **Scheduled triggers** are checked by one server cron job **every minute**
  (`wekan-scheduled-rules`, `parser.text('every 1 minute')` in
  [server/scheduledRules.js](../../../../server/scheduledRules.js)). A trigger
  with a time (`atTime`, `HH:MM`, server local time) runs in the minute that
  matches, at most once per minute (`lastRunKey` is the date and minute). A
  cron trigger is matched in UTC ([models/lib/cronSchedule.js](../../../../models/lib/cronSchedule.js)).
- **Calendar schedules**: *every weekday* is Monday to Friday; *every week* is
  the chosen weekday; *every month* the chosen day of the month; *once* the
  chosen date.
- **Card aging**: the days a card has been in its list are
  `(now - time of its latest moveCard or createCard activity) / 86,400,000 ms`
  (the card's creation date when it has no such activity); the trigger acts on
  cards whose value is at least N.
- **Due date**: *set* matches any card with the date; *approaching* matches
  a date in the future no more than N × 24 hours away; *overdue* matches a date
  at least N × 24 hours in the past
  ([models/lib/scheduledDueFilter.js](../../../../models/lib/scheduledDueFilter.js)).
  The trigger can watch the start date instead of the due date.
- **Rule parts**: at most 10 extra triggers and 10 extra actions per rule
  (`MAX_EXTRA_RULE_PARTS` in [models/lib/ruleParts.js](../../../../models/lib/ruleParts.js)).
- **Rules started by rules** stop at a depth of 5 (`MAX_RULE_DEPTH` in
  [server/rulesHelper.js](../../../../server/rulesHelper.js)); the refusal is
  recorded in Admin Panel → Problems.
- **Rule e-mails**: at most 100 attachments and 8 MiB of raw file data per
  message (`MAX_ATTACHMENTS`, `MAX_ATTACHMENT_BYTES` in
  [server/lib/ruleEmailAttachments.js](../../../../server/lib/ruleEmailAttachments.js));
  the attachment manifest at most 256 KiB
  ([server/lib/ruleCardAttachments.js](../../../../server/lib/ruleCardAttachments.js));
  the card's discussion, its Details and a linked board's discussion at most
  768 KiB of rendered text each, and a linked board's discussion at most 1,000
  comment rows
  ([server/lib/ruleBoardDiscussion.js](../../../../server/lib/ruleBoardDiscussion.js)).
- **Relative date action**: "+N" minutes, hours, days, weeks or months from
  the moment the rule runs.

## How it works in WeKan

- **Collections**: `Rules` ([models/rules.js](../../../../models/rules.js)),
  `Triggers` and `Actions`; a rule keeps `triggerId`/`actionId` and the optional
  `extraTriggerIds`/`extraActionIds`.
- **Running**: `RulesHelper` in
  [server/rulesHelper.js](../../../../server/rulesHelper.js) matches each new
  activity against the board's own triggers and performs the actions; a
  disabled rule never fires. Scheduled rules are
  [server/scheduledRules.js](../../../../server/scheduledRules.js); they act as
  the board's admin.
- **Page**: [client/components/rules/rulesMain.jade](../../../../client/components/rules/rulesMain.jade)
  and its views (`rulesList`, `rulesWorkflow`, `rulesBots`, `rulesBlocks`,
  `rulesImportExport`, `ruleDetails`).
- **Permissions**: the methods that change rules check for a board admin, and
  an action that targets another board needs write access to it; read-only
  display is decided by [models/lib/rulesReadOnly.js](../../../../models/lib/rulesReadOnly.js).
- **Tests**: many `tests/rule*.test.cjs` suites, e.g.
  [tests/ruleSuggestions.test.cjs](../../../../tests/ruleSuggestions.test.cjs)
  and [tests/rulesBlocks.test.cjs](../../../../tests/rulesBlocks.test.cjs), and
  the browser tests [20-rules.e2e.js](../../../../tests/playwright/specs/20-rules.e2e.js),
  [44-rules.e2e.js](../../../../tests/playwright/specs/44-rules.e2e.js) and
  [rules-history.e2e.js](../../../../tests/playwright/specs/rules-history.e2e.js).

### Triggers

#### Event triggers
- **Board:** card created / moved (to or from a list) / archived / unarchived /
  **commented on** (a comment was added to the card).
- **Card:** label added/removed, member added/removed, attachment added/removed.
- **Checklist:** checklist added/removed/completed, item checked/unchecked.

#### Scheduled triggers (time-based)
Evaluated by a server cron job every minute:

- **On a schedule:** once on a date, every day, every weekday, every week (pick a
  weekday) or every month (pick a day of month), at a chosen time, optionally
  limited to cards in a named list.
- **Due date:** when a card's due date is set, is approaching (N days before), or is
  overdue (N days after), at a chosen time.
- **Card aging / time-in-list:** when a card has been in a list for N days.
- **Cron schedule (UTC):** a five-field cron expression, `minute hour day month
  weekday` (`*`, lists, ranges, `*/N` steps, `MON`-`SUN`, `JAN`-`DEC`), in UTC as
  GitHub Actions runs them, optionally limited to cards in a named list. An
  invalid expression is not saved. A cron rule, like every scheduled rule, acts
  on each card of its list, or of the board when no list is named.

A **disabled** rule never fires: not on an event, not on a schedule and not
from its button.

#### Button triggers (manual)
- **Card button:** appears on the card detail; runs the action on that card when
  clicked.
- **Board button:** appears in the **board header**; runs a board-level action on
  demand.

### Actions

- **Board:** move card to top/bottom (of its list or a named list/board), archive /
  unarchive, add swimlane, create card, copy card, link card, **sort a list** (by due date /
  name / created / modified), **move all cards** from one list to another.
- **Card:** set/update/remove a date, **set a date relative to now** ("+N days"),
  add/remove label, add/remove member, remove all members, set color,
  **mark complete / incomplete**, **add a comment** (the text takes the
  [variables](#variables); it is written as the person whose change ran the rule,
  and only on a board where that person may comment).
- **Checklist:** add/remove checklist, check/uncheck all, check/uncheck an item, add
  a checklist with items.
- **Mail:** send an email.

#### Attach card files to an email

Enable **Attachments** in the email action to include the triggering card's
live files. The default remains a text-only message. Files are read through the
configured storage strategy and sent as byte snapshots, not download links.
A text manifest lists the attached filename, actual captured byte count, MIME
type, cover marker, upload date and public uploader display name. It contains
no storage paths, download URLs or private account fields. The manifest is
included with Attachments regardless of Details and is capped at 256 KiB.
A deleted attachment is omitted; an unreadable file fails the message before
SMTP, rather than silently sending a partial set. Each message permits up to
100 attachments and 8 MiB of raw file data in total.

The actor must still be able to read the source board and card after the reads
finish. Assigned-only access requires assignment to that card. Unrelated cards are not followed; linked-card sources use the authorized
resolution described below. Stored Sync email commands retain
the captured bytes for retries. Filesystem and GridFS delivery have local SMTP
regression coverage; cloud adapters use their existing stream interface but
were not tested against live cloud accounts for this change.

Email bodies include the configured text and the card's title, description and
link. Enable **Checklists / Comments** to append live checklist titles, tasks
and their completion state, checklist/item due dates, checklist completion
and reset dates/interval, followed by public comment text in chronological
order with public author names and creation/edit dates. Reactions include
Unicode emoji and distinct-reactor counts, scoped to each included comment;
reactor IDs and account data are not included. Private webhook state is never included. Card access is rechecked after
reading; oversized discussion text fails rather than being silently truncated.
Converted checklist subtasks include their current readable title. Linked
references use the same source-chain resolution as other relations; private,
missing or deleted targets are omitted, and references are rechecked before
sending. Stored commands retain their source chains even when Details is off.
This option is independent of Attachments and is off for existing rules.

Enable **Details** to append board/list/swimlane names, dates, labels, members,
assignees, requesters/assigners, time spent, locations, custom-field display
values, text notes and readable parent/subtask/dependency titles. Creator
names, stickers, archive/activity dates, ordering and move reasons are included.
Details also includes recurrence interval/last recurrence and persisted Flowtime/Pomodoro
session start, interruptions, phase, completed intervals, work duration and
public user display names. Timer snapshots do not add unfinished time to the
completed spent-time total or calculate a continually changing elapsed value.
Admin-only custom fields require board-admin access. Account emails, tokens
and private related-card titles are never included. Zero and false values are retained.
Access and custom-field policy are checked again before preparation finishes.
Canonical dependencies and legacy Gantt targets share one row per target,
retaining distinct relationship labels. Gantt types follow the
[DHTMLX defaults](https://docs.dhtmlx.com/gantt/api/config/links/). Inconsistent
legacy target/type arrays retain the target with a generic label rather than
an inferred type. Internal Gantt link IDs are not included.

Details includes voting questions, deadlines and counts. Voter names appear
only for public votes. Planning Poker includes the saved estimation and
reveals the choice counts and names only after its end time, matching the
card UI. Hidden voting/Poker sections are omitted. Only public display names
are resolved; emails, account data and raw user IDs are excluded. Visibility
is rechecked after preparation and captured in new stored-command source
bindings, so changing public voting, reopening Poker or hiding either section
stops dispatch of an older snapshot.

For linked cards, all selected sections use the current source card, including
its board-scoped custom fields, comments and files. Every link in the chain
must remain readable by the actor; changed targets, cycles, missing sources
and revoked access stop preparation. Cached source snapshots are not sent.
Linked boards use current board title, description and dates while retaining
the wrapper card's own discussion and attachments; they do not email every
card on the linked board. Linked-board voting uses the target board's current votes and Poker results,
subject to the same disclosure rules and both boards' section visibility.
Details includes the six visible Scrum card fields: sprint, past sprints,
release, issue type, acceptance criteria and backlog rank. Only enabled card
visibility flags permit output. Sprint/release names must belong to the source
board; missing or foreign references are omitted. References are rechecked
after reads and new stored source bindings retain the six visibility flags.
These are card metadata, not entire sprint reports, events or other cards.
The [full-card content audit](../../../DeveloperDocs/Card-Email-Content-Audit.md)
records remaining work for #2713.
Stored Sync commands capture the resolved source chain alongside the immutable
mail and include it in their checksum. Related-card title sources are captured too, including their linked chains.
Before dispatch, every saved card/board,
link target and current read/assignment permission must still match. A moved or
retargeted source stops delivery even if the recipient is unchanged. Legacy
commands without source evidence, and older Details snapshots without related-source
evidence, remain readable but cannot be dispatched or
silently recaptured; operator recovery for those commands remains unfinished.
Ordinary event, button and scheduled email rules also support linked sources.

#### Copy a card after a trigger

In the form builder, choose **Copy Card** under Board actions and select the
board, list and swimlane. The original card stays in place; an independent copy
is appended to the selected list. This uses ordinary card copying, including
its checklist, comment, attachment and subtask handling and cross-board label
and custom-field mapping. It does not create a live link to the original.

The saved action keeps destination IDs, so renaming a list or swimlane does not
redirect the copy. The actor must have write access to both boards when the
rule runs. Deleted or archived destinations, foreign lists/swimlanes and
revoked access produce no copy. A trigger needs a card context: use an event,
a card button or a card-based scheduled trigger, rather than a board button.

Copies may trigger other rules. The same copy action runs only once in a
causal chain, preventing a create-card rule from endlessly copying its own
copies. Separate user events can each make a copy.

#### Linked cards in rule emails

With Details enabled, a linked card or linked board also includes a separate
`Linked card local details` section for its local board/list/swimlane placement,
local recurrence, persisted timer fields and visible local Scrum metadata.
Source Details keeps its own scope. Copied source-card titles, descriptions,
stickers and custom fields are not
exported from a linked-card wrapper. A linked-board wrapper owns its local
labels, stickers, custom fields, notes, locations, creator and relationships;
These use local field visibility and related-card access checks. Public timer
owner names and same-board Scrum names use the same access rechecks.

A linked-board card's Discussion choice also includes public comments from
readable cards on the target board, grouped by current card title. Assigned-only
membership still limits which cards can contribute. Missing/deleted cards and
unreadable linked sources are omitted. Access is checked again after rendering
and before a stored command is sent. Checklists and files remain local to the
linked-board card. Board discussion rejects more than 1,000 discovered comment
rows or 768 KiB of rendered text; it does not send an incomplete subset.

### Variables

Action text fields support Trello-Butler-style **variables** in `{name}` form,
substituted when the rule runs. They work in the email subject/body, the created
card name, and created checklist/swimlane names:

| Variable | Value |
| --- | --- |
| `{cardname}` / `{cardtitle}` | the card's title |
| `{cardnumber}` | the card number |
| `{description}` | the card's description |
| `{duedate}` | the card's due date |
| `{listname}` | the card's list |
| `{swimlanename}` | the card's swimlane |
| `{boardname}` | the board's title |
| `{username}` | the user who triggered the rule |
| `{date}` / `{time}` / `{datetime}` | the current date / time / both |
| `{card}`, `{list}`, `{board}` | short names for `{cardname}`, `{listname}`, `{boardname}` |
| `{cardlink}` | a direct link to the card |
| `{member}` / `{membername}` | the member the trigger is about (added, removed, assigned ...), else the user who triggered the rule |
| `{creator}`, `{assignees}`, `{members}` | the card's creator, assignees and members by username; as an e-mail recipient, their e-mail addresses |
| `{customField:Name}` | the card's value of the custom field called Name (case-insensitive; admin-only fields are not read) |

Example email body: `Card {cardname} (#{cardnumber}) moved on {datetime} by {username}`.
Unknown `{tokens}` are left unchanged, and so is a custom field the card has no
value for. Token names are case-insensitive. Variables are also accepted in
trigger values. The date and time use the server's locale.

### Import / Export

Click **Import / Export rules** on the Rules page, or in Board Settings under
**Rules**.

- **Export to JSON** — lossless; each rule embeds its full trigger and action.
- **Export to CSV** — round-trippable (common fields as columns, the rest as a JSON
  cell).
- **Import from JSON / CSV** — paste a previously exported file.
- **Export selected** — if you have selected rules, only those are exported.
- **Import target** — choose which **workspace** and **board** the imported rules go
  into (the workspace selector filters your boards by your personal workspaces;
  defaults to the current board). This applies to every importer in the dialog
  (JSON, CSV, Trello Butler, visual workflows and Wrike workflows).

#### Importing visual workflows (n8n / Node-RED)

The Import / Export dialog can import a visual workflow exported from **n8n** or
**Node-RED** (auto-detected, or pick the format). The workflow graph's
trigger→action edges are mapped to WeKan rules by recognizing trigger-like and
action-like nodes (schedule/cron → scheduled rule; webhook/trigger → "card created";
archive/move/complete/email/create-card actions). Nodes that can't be mapped are
reported. The rules are created in the **board you selected** under *Import target*.

> These formats are arbitrary-integration graphs, so the mapping is **best-effort**.
> Importing rules/workflows *with* a whole board is supported for WeKan→WeKan (see
> below); n8n/Node-RED bring workflows only, into a chosen existing board.

#### GitHub Actions workflows

The [GitHub organization import](../../Board-Header/Board-Views/Version-Control-View.md#github-organization)
turns each `.github/workflows/*.yml` file of a repository into rules on that
repository's board. Issue events become triggers (opened, closed, reopened,
labeled, assigned, edited, commented on, a cron schedule, a manual run as a
board button). Issue steps become actions: add or remove labels, close,
reopen, comment, assign and create issues, from the well-known actions or
from `gh issue ...` commands. `actions/stale` becomes an aging rule. A
workflow whose every step maps is imported **enabled**. A build, a test, a
script or any other code is never run by WeKan: such a workflow is imported
**disabled**, with its YAML as the rule's description, and the import lists
what did not map. The rule keeps WeKan's own permissions: it can do only what
a rule can do on that board.

#### Wrike workflows

A Wrike workflow is an ordered list of statuses, each in one of four status
groups: **Active**, **Completed**, **Deferred** or **Cancelled**. Moving a task
into a Completed or Cancelled status closes it in Wrike. On a WeKan board the
statuses are the lists, and closing a card when it is moved is a rule. So the
Import / Export dialog exchanges a Wrike workflow as **lists plus rules**:

- **Export Wrike workflow** downloads `wrike-workflow.json`, in the JSON that
  Wrike's API returns for its workflows (`GET /workflows`): one workflow named
  after the board, with a custom status per list in board order and the nearest
  Wrike color. A list's status group comes from its rules first. A "when a card
  is moved to this list → mark it complete" rule makes it **Completed**, or
  **Cancelled** when the list is named like Rejected or Cancelled. A "→ mark it
  incomplete" rule makes it **Active**, or **Deferred** when it is named like
  On hold. Without such a rule the name decides (Done and Closed are
  Completed), else Active. Wrike needs an Active and a Completed status, so one
  is added when no list is one. The same file is offered in **Board Settings →
  Export → Wrike workflow**.
- **Import Wrike workflow** reads that JSON pasted into the text box, either
  from WeKan or saved from Wrike's `GET /workflows`, into the board chosen
  under *Import target*. A status the board has no list for becomes a list
  after the list of the status before it, with the nearest WeKan color. Each
  status also gets a rule: moving a card into a Completed or Cancelled status
  marks it complete, and into an Active or Deferred one marks it incomplete.
  These rules show in the list, Workflow and Blocks views like any other rule.
  A list that already has such a rule keeps it, so importing twice adds
  nothing. Hidden statuses and other workflows in the file are counted as not
  read. Only board admins can import, as for any rule.

To move a board to Wrike, create the exported workflow in Wrike first (Account
Management → Workflows, or the API's `POST /workflows`), and then import the
board's **Wrike** Excel export. Its *Workflow* and *Custom Status* columns name
that workflow and its statuses, and Wrike only applies them when they exist,
matching case. Wrike's own automation rules (WHEN–IF–THEN) have no export,
import or API, so they cannot be brought into WeKan, and WeKan rules other than
the ones above have no Wrike counterpart.

#### Importing a whole board with its workflows (WeKan → WeKan)

A WeKan board export already contains its rules/triggers/actions, so importing a
board brings its **workflows and all other data** with it:

- In the UI: **All Boards → New → Import → From WeKan**.
- Over REST: `POST /api/boards/import` with `{ "board": <export JSON> }`
  (`python3 api.py importboard EXPORT.json`).

#### Migrating all boards + workflows + rules from another WeKan

`python3 api.py migratefromwekan REMOTE_URL REMOTE_USER REMOTE_PASS` logs in to a
remote WeKan, lists that user's boards, exports each (full JSON incl. rules), and
imports each into your WeKan via `POST /api/boards/import`. The remote fetch is done
by the client/script (not the server), so no arbitrary-URL fetch happens server-side.

#### Importing rules from Trello

Trello's board export does **not** contain Butler rules/automation (confirmed: the
Trello importer never receives them). So rules cannot be imported automatically from
a normal Trello export. The Import / Export dialog offers a **best-effort** importer:
paste your Butler command text and WeKan maps the recognizable subset (for example
"when a card is added to list X, move the card to the top") and reports the lines it
could not map.

#### Importing rules from Jira

Jira board/data import lives under **All Boards → New → Import → Jira** (see
[Jira import](#jira-import)). If the Jira JSON includes an `automationRules` array in
the WeKan `{ title, trigger, action }` shape, those rules are imported with the board
(best effort).

### Jira import

WeKan can import boards from Jira, similar to Trello:

1. **All Boards → New → Import → From Jira**.
2. Paste the JSON from the Jira Cloud REST issue search
   (`GET /rest/api/2/search`) or an equivalent `{ "issues": [ … ] }` object.
3. Map Jira assignees to WeKan users, then import — or click **Import without
   mapping members (map later)** to import immediately and map members afterwards.
   (The same option is available for Trello and WeKan imports.)

Jira **statuses become lists** (the workflow columns), each **issue becomes a card**
(title `[KEY] summary`, description, due date, created/updated dates), Jira **labels
become board labels**, and assignees become card members. An optional
`automationRules` array is imported as WeKan rules.

### REST API

Manage rules over REST (see also [`api.py`](../../../../api.py)
`addrule` / `editrule` / `removerule` / `listrules` / `getrule`):

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/boards/:boardId/rules` | list rules |
| `GET` | `/api/boards/:boardId/rules/:ruleId` | get one rule |
| `POST` | `/api/boards/:boardId/rules` | add a rule |
| `PUT` | `/api/boards/:boardId/rules/:ruleId` | edit a rule |
| `DELETE` | `/api/boards/:boardId/rules/:ruleId` | remove a rule |

`POST`/`PUT` bodies embed the trigger and action inline:

```json
{
  "title": "Archive after 90 days",
  "trigger": { "activityType": "scheduledTrigger", "scheduleKind": "aging",
               "listName": "Completed", "days": 90, "atTime": "03:00" },
  "action":  { "actionType": "archive" }
}
```

```bash
python3 api.py addrule BOARDID 'On create -> top' \
  '{"activityType":"createCard","listName":"*","swimlaneName":"*","cardTitle":"*","userId":"*"}' \
  '{"actionType":"moveCardToTop","listName":"*","swimlaneName":"*"}'
```

## Related

- [IFTTT and Rules](../IFTTT/IFTTT.md)
- [Cards](../../Cards/Cards.md), [Swimlanes](../../Swimlanes/Swimlanes.md)
- [REST API](../../../API/REST-API.md)

## Commits

 - [A rule action into a list that refuses the triggering user's role is skipped](https://github.com/wekan/wekan/commit/ee24453dcb5d9ed8af5c07b848cbd5bd8979ae28)
 - [Scheduled rules act as the board's admin, so their cards have an author](https://github.com/wekan/wekan/commit/f23695cc1bf6447fb38693ea8fe2e1ce4ab51f8f)
 - [Rules page: Back to the board](https://github.com/wekan/wekan/commit/34d9817110b37fb6971a8bea8034f0d048928a32)
 - [Rule emails: pick board members for To from a list with autocomplete](https://github.com/wekan/wekan/commit/75e260966b921524b7617ee897f3c4a06596f7b0)
 - [Rules can be shown to board members, read-only](https://github.com/wekan/wekan/commit/f4a3690256c71909860a830cb8e4557f4a2c4348)
 - [Import and export Wrike workflows as lists and rules](https://github.com/wekan/wekan/commit/a78b4aa744b011fc385bbd462b83fb092b547efd)
 - [Rule triggers for a card moved forward or back](https://github.com/wekan/wekan/commit/eac524380f9fba323d394a9c662463212053017f)
 - [Assignee actions, an optional title, and remove-all members that removes them](https://github.com/wekan/wekan/commit/f735eba194fba0b45d458d1a8cf1547c4f255d8a)
 - [A chain of rules started by rules stops at a depth limit](https://github.com/wekan/wekan/commit/a8e836efd377e62ff6805a12334d2c2333f63267)
 - [Rule, webhook and custom-field documents cannot be moved to another board](https://github.com/wekan/wekan/commit/f02da1bfd21f79c10185f199a994839e4c5a660f)
 - [Put the Rules views under Rules in Board Settings](https://github.com/wekan/wekan/commit/b4217f962d1701000851084abe69c9b36077d2ad)
 - [Accept rule variables in trigger values](https://github.com/wekan/wekan/commit/b1dbea2152bcd049e6050c0a64956285248a7ad7)
 - [A rule may have several triggers and several actions](https://github.com/wekan/wekan/commit/69eeb00c84e2897e53ea96ef13df9524fc4d432a)
 - [Scheduled triggers may watch a card's start date](https://github.com/wekan/wekan/commit/0f8d35fe7265ca21101ac608b5bfd62d94cdd52f)
 - [People and custom-field variables in action values](https://github.com/wekan/wekan/commit/a9185599390081c8dbc12aa446454be2b3c397dc)
 - [Include checklists and public comments in rule emails](https://github.com/wekan/wekan/commit/05080fc02e167ef2ca107c9507941dc4b1569fe1)
 - [Send the card's attachments with email rules](https://github.com/wekan/wekan/commit/846f190690254c20d5f9bd5400964af68f01985b)
 - [Copy Card rule action with destination pickers](https://github.com/wekan/wekan/commit/998b96bf9150c6123cd9a1a04cc52bf5fb3b44a5)
 - [Record rule changes in undoable board History](https://github.com/wekan/wekan/commit/539aef4aa58ec26308d364b864e16002af8b92c8)
 - [Edit a rule's trigger and action in place](https://github.com/wekan/wekan/commit/16c8f425d049b1bc42e81bee787b3cb724ca6d54)
 - [A card link and short template tokens in the send-email action](https://github.com/wekan/wekan/commit/e643f0da71db3555f50c031a9fd532b092656d2f)
 - [Add a Remove all labels rule action](https://github.com/wekan/wekan/commit/1c97bbac854f0504376cc3be5f0d99627c4f403d)
 - [Block unauthorized cross-board rule actions](https://github.com/wekan/wekan/commit/dffe85cce428749908c46ef1cae25fe3fb6edd07)
 - [Fix rules whose action never ran because the trigger required omitted fields](https://github.com/wekan/wekan/commit/e6b001320c27a11fdbd15e17f2ad230bdeab2290)
 - [Rules card title filter and the rules REST API](https://github.com/wekan/wekan/commit/25d33cec367b867ea9970e9ad27f723b36135c45)
 - [A rule can move or link a card to a different board](https://github.com/wekan/wekan/commit/9f7eac158e99f1ae38dedf586bc43225e267722c)
 - [Unit selector for the relative-date action](https://github.com/wekan/wekan/commit/53328f40c6e092988175ce820c14658c855390de)
 - [Scheduled rules, the Workflow view, card and board buttons, and rules import/export](https://github.com/wekan/wekan/commit/f0bce67a3bf301c21ded3eb97e84a3be0010290f)
