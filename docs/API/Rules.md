# Rules (Board Automation / IFTTT) REST API

Board automation rules ("IFTTT rules") link a **trigger** (an event on the
board) to an **action** (what happens to the card/board). The REST API embeds
the full trigger and action inline, so a rule is self-contained.

This API makes the workflow of
[issue #2674](https://github.com/wekan/wekan/issues/2674) scriptable: add a
user to a card when it is moved **to** a list, and remove the user again when
the card is moved **away from** that list.

## Summary

| HTTP Method | Url | Short Description |
| :--- | :--- | :--- |
| `GET` | `/api/boards/:boardId/rules` | List all automation rules of a board |
| `GET` | `/api/boards/:boardId/rules/:ruleId` | Get one rule (with its trigger and action) |
| `POST` | `/api/boards/:boardId/rules` | Add an automation rule |
| `PUT` | `/api/boards/:boardId/rules/:ruleId` | Edit a rule's title, trigger and/or action |
| `DELETE` | `/api/boards/:boardId/rules/:ruleId` | Remove a rule (and its trigger and action) |

All endpoints require a `Bearer` token; write endpoints require board write
access (BoardAdmin).

## Trigger matching and the `*` wildcard

The rule engine matches an incoming board activity against **every** matching
field of the trigger's `activityType` (for example `moveCard` matches on
`boardId`, `listName`, `oldListName`, `userId`, `swimlaneName`, `cardTitle`).
A field set to `'*'` matches anything.

You only need to supply the fields you want to constrain: any matching field
missing from the trigger you POST/PUT is stored as the `'*'` wildcard
automatically. (Before this normalization existed, an API-created trigger
that omitted a field such as `userId` could never match any activity, so the
rule silently never fired — the bug reported in issue #2674.)

### Trigger `activityType` values

| `activityType` | fires when | matching fields |
| :--- | :--- | :--- |
| `createCard` | a card is created | `boardId`, `listName`, `userId`, `swimlaneName`, `cardTitle` |
| `moveCard` | a card is moved to/from a list or swimlane | `boardId`, `listName` (destination), `oldListName` (source), `userId`, `swimlaneName`, `cardTitle` |
| `archivedCard` / `restoredCard` | a card is archived / unarchived | `boardId`, `userId`, `cardTitle` |
| `joinMember` / `unjoinMember` | a member is added to / removed from a card | `boardId`, `username`, `userId` |
| `addChecklist` / `removeChecklist` / `completeChecklist` / `uncompleteChecklist` | checklist events | `boardId`, `checklistName`, `userId` |
| `addedChecklistItem` / `removedChecklistItem` / `checkedItem` / `uncheckedItem` | checklist item events | `boardId`, `checklistItemName`, `userId` |
| `addAttachment` / `deleteAttachment` | attachment events | `boardId`, `userId` |
| `addedLabel` / `removedLabel` | label events | `boardId`, `labelId`, `userId` |
| `scheduledTrigger` | time-based (due/aging/recurring); see `scheduleKind`, `days`, `atTime` | evaluated by the scheduler, not by activities |

For a card moved **to** a list, constrain `listName` (the destination list's
title). For a card moved **away from** a list, constrain `oldListName` (the
source list's title) and leave `listName` as `'*'`.

### Action `actionType` values

`moveCardToTop`, `moveCardToBottom`, `sendEmail`, `setDate`, `updateDate`,
`removeDate`, `setDateRelative`, `archive`, `unarchive`, `setColor`,
`addLabel`, `removeLabel`, `addMember`, `removeMember`, `checkAll`,
`uncheckAll`, `checkItem`, `uncheckItem`, `addChecklist`, `removeChecklist`,
`addChecklistWithItems`, `addSwimlane`, `createCard`, `linkCard`,
`markCardComplete`, `markCardIncomplete`, `sortList`, `moveAllCardsInList`.

The member actions take a `username`:

* `{"actionType": "addMember", "username": "someuser"}` — add the user to the card
* `{"actionType": "removeMember", "username": "someuser"}` — remove the user from the card
* `{"actionType": "removeMember", "username": "*"}` — remove **all** members from the card

## List rules

```shell
curl -H "Authorization: Bearer TOKEN" \
     -X GET \
     http://localhost:3000/api/boards/BOARDID/rules
```

## Get one rule

```shell
curl -H "Authorization: Bearer TOKEN" \
     -X GET \
     http://localhost:3000/api/boards/BOARDID/rules/RULEID
```

Result example:

```json
{
  "_id": "8gDW2AtwbpNbqSyEw",
  "title": "Remove member when moved away from Doing",
  "trigger": {
    "activityType": "moveCard",
    "listName": "*",
    "oldListName": "Doing",
    "swimlaneName": "*",
    "cardTitle": "*",
    "userId": "*"
  },
  "action": {
    "actionType": "removeMember",
    "username": "someuser"
  }
}
```

## Add a rule

```shell
curl -H "Authorization: Bearer TOKEN" \
     -H "Content-type: application/json" \
     -X POST \
     http://localhost:3000/api/boards/BOARDID/rules \
     -d '{
           "title": "Add member when moved to Doing",
           "trigger": { "activityType": "moveCard", "listName": "Doing" },
           "action":  { "actionType": "addMember", "username": "someuser" }
         }'
```

### Full example: issue #2674 workflow

Add the user when a card is moved **to** the list "Doing", remove the user
again when the card is moved **away from** "Doing":

```shell
# Rule 1: card moved TO "Doing" -> add member
curl -H "Authorization: Bearer TOKEN" -H "Content-type: application/json" -X POST \
     http://localhost:3000/api/boards/BOARDID/rules \
     -d '{ "title": "Add member on move to Doing",
           "trigger": { "activityType": "moveCard", "listName": "Doing" },
           "action":  { "actionType": "addMember", "username": "someuser" } }'

# Rule 2: card moved AWAY FROM "Doing" -> remove member
curl -H "Authorization: Bearer TOKEN" -H "Content-type: application/json" -X POST \
     http://localhost:3000/api/boards/BOARDID/rules \
     -d '{ "title": "Remove member on move from Doing",
           "trigger": { "activityType": "moveCard", "oldListName": "Doing" },
           "action":  { "actionType": "removeMember", "username": "someuser" } }'
```

The omitted trigger fields (`listName` in rule 2, `oldListName` in rule 1,
plus `userId`, `swimlaneName`, `cardTitle`) are stored as `'*'` wildcards.

## Edit a rule

Any of `title`, `trigger` and `action` may be supplied; a supplied trigger or
action document replaces the stored fields. When the supplied trigger includes
an `activityType`, its missing matching fields are defaulted to `'*'` too.

```shell
curl -H "Authorization: Bearer TOKEN" \
     -H "Content-type: application/json" \
     -X PUT \
     http://localhost:3000/api/boards/BOARDID/rules/RULEID \
     -d '{ "action": { "actionType": "removeMember", "username": "*" } }'
```

## Delete a rule

Removes the rule together with its trigger and action documents.

```shell
curl -H "Authorization: Bearer TOKEN" \
     -X DELETE \
     http://localhost:3000/api/boards/BOARDID/rules/RULEID
```

## Python CLI (api.py)

The bundled `api.py` exposes the same capability:

```shell
python3 api.py listrules BOARDID
python3 api.py getrule BOARDID RULEID
python3 api.py addrule BOARDID 'TITLE' 'TRIGGER_JSON' 'ACTION_JSON'
python3 api.py editrule BOARDID RULEID 'PATCH_JSON'
python3 api.py removerule BOARDID RULEID

# Issue #2674: remove a user from the card when it is moved away from a list
python3 api.py addrule BOARDID 'Remove member on move from Doing' \
  '{"activityType":"moveCard","oldListName":"Doing"}' \
  '{"actionType":"removeMember","username":"someuser"}'
```
