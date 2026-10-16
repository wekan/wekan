# IFTTT / Rules (Automation)

WeKan **Rules** ("if this then that") automate your board: when something happens
(a **trigger**), WeKan runs an **action**.

> See the full, up-to-date reference at **[Features / Rules](../Rules/Rules.md)** —
> this page is a quick overview. The Rules page is now a **fullscreen page** (board
> sidebar → Rules), not a popup, and adds selecting, editing, import/export, a visual
> **Workflow view**, scheduled rules, and a REST API.

## What's new beyond the basics below

- **Scheduled triggers:** run rules on a schedule (once / daily / weekday / weekly /
  monthly at a time), on **due dates** (set / approaching / overdue), or by **card
  aging** ("a card has been in a list for N days"). Example process that works out of
  the box: *archive cards that have been in "Completed" for 90 days*.
- **Buttons:** card buttons (shown on the card) and board buttons that run an action
  on demand.
- **More actions:** sort a list, move all cards in a list, mark card complete /
  incomplete, set a date relative to now, in addition to the actions below.
- **Manage rules:** select all / unselect all, delete selected, edit (rename), and a
  visual **Workflow view** (`When … → Then …`, grouped by trigger).
- **Import / Export rules** to JSON (lossless) and CSV (round-trippable); export only
  selected rules; best-effort import of Trello **Butler** commands; import of Jira
  `automationRules`.
- **REST API** to add/edit/remove rules — see [Rules REST API](#rules-rest-api) below.

## 1) Click: Menu item for the rules

<img src="https://wekan.fi/ifttt/main_menu-ifttt.png" alt="Navigation menu for the rule dialog" />


## 2) Rule Menu: Overview, deleting and adding new rules
<img src="https://wekan.fi/ifttt/ifttt_main_dialog.PNG" alt="Dialog Overview for the rules" />


## 2a) Add new rule : Triggers
Currently, there are three types of triggers: board, card and checklist

| Board  | Card | Checklist |
| ------------- | ------------- | ------------- |
| create card | added/removed label, attachment, person  | checklist added/removed | 
| card moved to |   | check item checked/unchecked |
| card moved from |  | checklist completed |


## 2b) Add new rule : Actions
For every trigger, there are 4 types of actions: board, card, checklist and mail

| Board  | Card | Checklist | Mail |
| ------------- | ------------- | ------------- | ------------- |
| move card to list | add/remove label, attachment, person  | checklist add/remove | send email to |
| move to top/bottom | set title/description | check/uncheck item | |
| archive/unarchive |  | checklist complete | |


# Example : How the rule works
* Rule 1: When a card is added to the board -> Add label yellow
* Rule 2: When a card is moved to List 2 -> Add checklist ToDo
* Rule 3: When a card is added to List 1 -> Add label blue

<img src="https://wekan.fi/ifttt/how_to_work_with_rules.gif" alt="gif animation for rules" />

# Rules REST API

Rules can be added, edited and removed over the REST API. The trigger and action
are embedded inline so each rule is self-contained.

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/boards/:boardId/rules` | list rules |
| `GET` | `/api/boards/:boardId/rules/:ruleId` | get one rule |
| `POST` | `/api/boards/:boardId/rules` | add a rule |
| `PUT` | `/api/boards/:boardId/rules/:ruleId` | edit a rule (title / trigger / action) |
| `DELETE` | `/api/boards/:boardId/rules/:ruleId` | remove a rule (and its trigger + action) |

`POST` / `PUT` body:

```json
{
  "title": "Archive after 90 days",
  "trigger": { "activityType": "scheduledTrigger", "scheduleKind": "aging",
               "listName": "Completed", "days": 90, "atTime": "03:00" },
  "action":  { "actionType": "archive" }
}
```

Python helper ([`api.py`](../../../../api.py)):

```bash
python3 api.py listrules BOARDID
python3 api.py addrule BOARDID 'On create -> top' \
  '{"activityType":"createCard","listName":"*","swimlaneName":"*","cardTitle":"*","userId":"*"}' \
  '{"actionType":"moveCardToTop","listName":"*","swimlaneName":"*"}'
python3 api.py editrule BOARDID RULEID '{"title":"New title"}'
python3 api.py removerule BOARDID RULEID
```

See [Features / Rules](../Rules/Rules.md) for the full list of trigger
`activityType`s and action `actionType`s, scheduled rules, buttons, the visual
Workflow view, and Trello/Jira import.
