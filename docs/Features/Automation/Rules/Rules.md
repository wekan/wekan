# Rules (Automation)

WeKan **Rules** automate your board: when something happens (a **trigger**), WeKan
runs a **action**. This is WeKan's equivalent of Trello's Butler.

Open Rules from the board sidebar → **Rules**. The Rules page is a **fullscreen
page** below the top bar (it used to be a small popup).

## How a rule works

A rule links one **trigger** to one **action**:

> **When** a card is moved to list "Done" → **then** mark the card complete.

Triggers and actions both support a wildcard `*` meaning "any" (for triggers) or
"the card's current value" (for actions).

## Managing rules

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

## Triggers

### Event triggers
- **Board:** card created / moved (to or from a list) / archived / unarchived.
- **Card:** label added/removed, member added/removed, attachment added/removed.
- **Checklist:** checklist added/removed/completed, item checked/unchecked.

### Scheduled triggers (time-based)
Evaluated by a server cron job every minute:

- **On a schedule:** once on a date, every day, every weekday, every week (pick a
  weekday) or every month (pick a day of month), at a chosen time, optionally
  limited to cards in a named list.
- **Due date:** when a card's due date is set, is approaching (N days before), or is
  overdue (N days after), at a chosen time.
- **Card aging / time-in-list:** when a card has been in a list for N days.

### Button triggers (manual)
- **Card button:** appears on the card detail; runs the action on that card when
  clicked.
- **Board button:** appears in the **board header**; runs a board-level action on
  demand.

## Actions

- **Board:** move card to top/bottom (of its list or a named list/board), archive /
  unarchive, add swimlane, create card, link card, **sort a list** (by due date /
  name / created / modified), **move all cards** from one list to another.
- **Card:** set/update/remove a date, **set a date relative to now** ("+N days"),
  add/remove label, add/remove member, remove all members, set color,
  **mark complete / incomplete**.
- **Checklist:** add/remove checklist, check/uncheck all, check/uncheck an item, add
  a checklist with items.
- **Mail:** send an email.

## Variables

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

Example email body: `Card {cardname} (#{cardnumber}) moved on {datetime} by {username}`.
Unknown `{tokens}` are left unchanged.

## Example: archive completed cards after 90 days

This common "process" works out of the box with a scheduled **card-aging** trigger
plus the **archive** action:

> **When** a card has been in list **"Completed"** for **90** days (checked daily)
> → **then** archive the card.

Create it on the Rules page (Scheduled triggers → "card in list for N days"), or via
the [REST API](#rest-api).

## Import / Export

Click **Import / Export** on the Rules page.

- **Export to JSON** — lossless; each rule embeds its full trigger and action.
- **Export to CSV** — round-trippable (common fields as columns, the rest as a JSON
  cell).
- **Import from JSON / CSV** — paste a previously exported file.
- **Export selected** — if you have selected rules, only those are exported.
- **Import target** — choose which **workspace** and **board** the imported rules go
  into (the workspace selector filters your boards by your personal workspaces;
  defaults to the current board). This applies to every importer in the dialog
  (JSON, CSV, Trello Butler and visual workflows).

### Importing visual workflows (n8n / Node-RED)

The Import / Export dialog can import a visual workflow exported from **n8n** or
**Node-RED** (auto-detected, or pick the format). The workflow graph's
trigger→action edges are mapped to WeKan rules by recognizing trigger-like and
action-like nodes (schedule/cron → scheduled rule; webhook/trigger → "card created";
archive/move/complete/email/create-card actions). Nodes that can't be mapped are
reported. The rules are created in the **board you selected** under *Import target*.

> These formats are arbitrary-integration graphs, so the mapping is **best-effort**.
> Importing rules/workflows *with* a whole board is supported for WeKan→WeKan (see
> below); n8n/Node-RED bring workflows only, into a chosen existing board.

### Importing a whole board with its workflows (WeKan → WeKan)

A WeKan board export already contains its rules/triggers/actions, so importing a
board brings its **workflows and all other data** with it:

- In the UI: **All Boards → New → Import → From WeKan**.
- Over REST: `POST /api/boards/import` with `{ "board": <export JSON> }`
  (`python3 api.py importboard EXPORT.json`).

### Migrating all boards + workflows + rules from another WeKan

`python3 api.py migratefromwekan REMOTE_URL REMOTE_USER REMOTE_PASS` logs in to a
remote WeKan, lists that user's boards, exports each (full JSON incl. rules), and
imports each into your WeKan via `POST /api/boards/import`. The remote fetch is done
by the client/script (not the server), so no arbitrary-URL fetch happens server-side.

### Importing rules from Trello

Trello's board export does **not** contain Butler rules/automation (confirmed: the
Trello importer never receives them). So rules cannot be imported automatically from
a normal Trello export. The Import / Export dialog offers a **best-effort** importer:
paste your Butler command text and WeKan maps the recognizable subset (for example
"when a card is added to list X, move the card to the top") and reports the lines it
could not map.

### Importing rules from Jira

Jira board/data import lives under **All Boards → New → Import → Jira** (see
[Jira import](#jira-import)). If the Jira JSON includes an `automationRules` array in
the WeKan `{ title, trigger, action }` shape, those rules are imported with the board
(best effort).

## Jira import

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

## REST API

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
- [Cards](../../Cards/Cards.md), [Swimlanes](../../Board/Swimlanes.md)
- [REST API](../../../API/REST-API.md)
