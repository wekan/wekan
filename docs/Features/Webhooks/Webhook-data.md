{% raw %}
<!-- The webhook payload examples below contain {{placeholder}} tokens. Wrap the
     whole page in raw so Jekyll's Liquid engine outputs them literally instead
     of trying to evaluate (and erroring on) them when building GitHub Pages. -->
# Webhook data

When a webhook is activated it sends the related information within the POST request body.

Present values keep their JSON types, including numeric `0`, boolean `false`,
empty strings and explicit `null`. Missing or undefined values are omitted.
For example, setting a numeric custom field to zero includes
`"customFieldValue": 0`; clearing description text retains an empty `value`
when that attribute is selected. `WEBHOOKS_ATTRIBUTES` still controls which
attributes a regular outgoing webhook includes. Two-way webhooks retain the
complete activity parameters. The notification parameter builder follows the
same value-preservation rule.

Beside the ids, a regular outgoing webhook carries by default the names
behind them - `card`, `list`, `board` and `swimlane` - the acting user as
`user` (display name) and `username` (login name), the link to the card as
`url`, and for an event about another person that person too: `member` and
`memberUsername` for joining or leaving a card, `assignee`, `assigneeUsername`
and `assigneeId` for an assignment (#3297). A receiver can write its own
message from these, in its own language, and address the person by username.

```json
{
  "text": "{{wekan-username}} act-joinAssignee\nhttp://{{wekan-host}}/b/{{board-id}}/{{board-name}}/{{card-id}}",
  "cardId": "{{card-id}}",
  "card": "{{card-title}}",
  "listId": "{{list-id}}",
  "list": "{{list-name}}",
  "boardId": "{{board-id}}",
  "board": "{{board-name}}",
  "swimlaneId": "{{swimlane-id}}",
  "swimlane": "{{swimlane-name}}",
  "user": "{{wekan-fullname}}",
  "username": "{{wekan-username}}",
  "assigneeId": "{{assignee-id}}",
  "assignee": "{{assignee-fullname}}",
  "assigneeUsername": "{{assignee-username}}",
  "url": "http://{{wekan-host}}/b/{{board-id}}/{{board-name}}/{{card-id}}",
  "description": "act-joinAssignee"
}
```

## Cards

### Creation

When a new card is created on board

```json
{
  "text": "{{wekan-username}} created card \"{{card-title}}\" to list \"{{list-name}}\" at swimlane \"{{swimlane-name}}\" at board \"{{board-name}}\"\nhttp://{{wekan-host}}/b/{{board-id}}/{{board-name}}/{{card-id}}",
  "cardId": "{{card-id}}",
  "listId": "{{list-id}}",
  "boardId": "{{board-id}}",
  "user": "{{wekan-username}}",
  "card": "{{card-title}}",
  "swimlaneId": "{{swimlane-id}}",
  "description": "act-createCard"
}
```

### Move

When a card is moved beweteen lists

```json
{
  "text": "{{wekan-username}} moved card \"{{card-title}}\" at board \"{{board-name}}\" from list \"{{old-list-name}}\" at swimlane \"{{swimlane-name}}\" to list \"{{new-list-name}}\" at swimlane \"{{swimlane-name}}\"\nhttp://{{wekan-host}}/b/{{board-id}}/{{board-name}}/{{card-id}}",
  "cardId": "{{card-id}}",
  "listId": "{{new-list-id}}",
  "oldListId": "{{old-list-id}}",
  "boardId": "{{board-id}}",
  "user": "{{wekan-username}}",
  "card": "{{card-title}}",
  "swimlaneId": "{{swimlane-id}}",
  "description": "act-moveCard"
}
```

### Archival

A card is moved to archive

```json
{
  "text": "{{wekan-username}} Card \"{{card-title}}\" at list \"{{list-name}}\" at swimlane \"{{swimlane-name}}\" at board \"{{board-name}}\" moved to Archive\nhttp://{{wekan-host}}/b/{{board-id}}/{{board-name}}/{{card-id}}",
  "cardId": "{{card-id}}",
  "listId": "{{list-id}}",
  "boardId": "{{board-id}}",
  "user": "{{wekan-username}}",
  "card": "{{card-title}}",
  "swimlaneId": "{{swimlane-id}}",
  "description": "act-archivedCard"
}
```

### Restored

When a card is restored from archive

```json
{
  "text": "{{wekan-username}} restored card \"{{card-title}}\" to list \"{{list-name}}\" at swimlane \"{{swimlane-name}}\" at board \"{{board-name}}\"\nhttp://{{wekan-host}}/b/{{board-id}}/{{board-name}}/{{card-id}}",
  "cardId": "{{card-id}}",
  "listId": "{{list-id}}",
  "boardId": "{{board-id}}",
  "user": "{{wekan-username}}",
  "card": "{{card-title}}",
  "swimlaneId": "{{swimlane-id}}",
  "description": "act-restoredCard"
}
```

## Card content

Webhooks that are raised on card content change

### Comment creation

A user comments the card

```json
{
  "text": "{{wekan-username}} commented on card \"{{card-title}}\": \"{{comment}}\" at list __list__ at swimlane __swimlane__ at board \"{{board-name}}\"\nhttp://{{wekan-host}}/b/{{board-id}}/{{board-name}}/{{card-id}}",
  "cardId": "{{card-id}}",
  "boardId": "{{board-id}}",
  "comment": "{{comment}}",
  "user": "{{wekan-username}}",
  "card": "{{card-title}}",
  "commentId": "{{comment-id}}",
  "description": "act-addComment"
}
```

### Comment edit

A user edits a comment on the card

```json
{
  "text": "{{wekan-username}} commented on card \"{{card-title}}\": \"{{comment}}\" at list __list__ at swimlane __swimlane__ at board \"{{board-name}}\"\nhttp://{{wekan-host}}/b/{{board-id}}/{{board-name}}/{{card-id}}",
  "cardId": "{{card-id}}",
  "listId": "{{list-id}}",
  "boardId": "{{board-id}}",
  "comment": "{{comment}}",
  "user": "{{wekan-username}}",
  "card": "{{card-title}}",
  "commentId": "{{comment-id}}",
  "swimlaneId": "{{swimlane-id}}",
  "description": "act-editComment"
}
```

### AddLabel

A label is added to card

```json
{
  "text": "{{wekan-username}} Added label __label__ to card \"{{card-title}}\" at list \"{{list-name}}\" at swimlane \"{{swimlane-name}}\" at board \"{{board-name}}\"\nhttp://{{wekan-host}}/b/{{board-id}}/{{board-name}}/{{card-id}}",
  "cardId": "{{card-id}}",
  "listId": "{{list-id}}",
  "boardId": "{{board-id}}",
  "user": "{{wekan-username}}",
  "card": "{{card-title}}",
  "swimlaneId": "{{swimlane-id}}",
  "description": "act-addedLabel"
}
```

### Join member

When a member is added to card

```json
{
  "text": "{{wekan-username}} added member {{wekan-username}} to card \"{{card-title}}\" at list \"{{list-name}}\" at swimlane \"{{swimlane-name}}\" at board \"{{board-name}}\"\nhttp://{{wekan-host}}/b/{{board-id}}/{{board-name}}/{{card-id}}",
  "cardId": "{{card-id}}",
  "listId": "{{list-id}}",
  "boardId": "{{board-id}}",
  "user": "{{wekan-username}}",
  "card": "{{card-title}}",
  "swimlaneId": "{{swimlane-id}}",
  "description": "act-joinMember"
}
```

### Set custom field

A custom field on card is set

```json
{
  "text": "{{wekan-username}} act-setCustomField\nhttp://{{wekan-host}}/b/{{board-id}}/{{board-name}}/{{card-id}}",
  "cardId": "{{card-id}}",
  "boardId": "{{board-id}}",
  "user": "{{wekan-username}}",
  "card": "{{card-title}}",
  "description": "act-setCustomField"
}
```

### Add attachment

```json
{
  "text": "{{wekan-username}} added attachment {{attachment-id}} to card \"{{card-title}}\" at list __list__ at swimlane __swimlane__ at board \"{{board-name}}\"\nhttp://{{wekan-host}}/b/{{board-id}}/{{board-name}}/{{card-id}}",
  "cardId": "{{card-id}}",
  "boardId": "{{board-id}}",
  "user": "{{wekan-username}}",
  "card": "{{card-title}}",
  "description": "act-addAttachment"
}
```

### Delete attachment

```json
{
  "text": "{{wekan-username}} deleted attachment __attachment__ at card \"{{card-title}}\" at list __list__ at swimlane __swimlane__ at board \"{{board-name}}\"\nhttp://{{wekan-host}}/b/{{board-id}}/{{board-name}}/{{card-id}}",
  "cardId": "{{card-id}}",
  "boardId": "{{board-id}}",
  "user": "{{wekan-username}}",
  "card": "{{card-title}}",
  "description": "act-deleteAttachment"
}
```

### Add checklist

```json
{
  "text": "{{wekan-username}} added checklist \"{{checklist-name}}\" to card \"{{card-title}}\" at list __list__ at swimlane __swimlane__ at board \"{{board-name}}\"\nhttp://{{wekan-host}}/b/{{board-id}}/{{board-name}}/{{card-id}}",
  "cardId": "{{card-id}}",
  "boardId": "{{board-id}}",
  "user": "{{wekan-username}}",
  "card": "{{card-title}}",
  "description": "act-addChecklist"
}
```

### Remove checklist

```json
{
  "text": "{{wekan-username}} removed checklist \"{{checklist-name}}\" from card \"{{card-title}}\" at list __list__ at swimlane __swimlane__ at board \"{{board-name}}\"\nhttp://{{wekan-host}}/b/{{board-id}}/{{board-name}}/{{card-id}}",
  "cardId": "{{card-id}}",
  "boardId": "{{board-id}}",
  "user": "{{wekan-username}}",
  "card": "{{card-title}}",
  "description": "act-removeChecklist"
}
```

### Uncomplete checklist

```json
{
  "text": "{{wekan-username}} uncompleted checklist \"{{checklist-name}}\" at card \"{{card-title}}\" at list __list__ at swimlane __swimlane__ at board \"{{board-name}}\"\nhttp://{{wekan-host}}/b/{{board-id}}/{{board-name}}/{{card-id}}",
  "cardId": "{{card-id}}",
  "boardId": "{{board-id}}",
  "user": "{{wekan-username}}",
  "card": "{{card-title}}",
  "description": "act-uncompleteChecklist"
}
```

### Add checklist item

```json
{
  "text": "{{wekan-username}} added checklist item {{checklistitem-name}} to checklist \"{{checklist-name}}\" at card \"{{card-title}}\" at list __list__ at swimlane __swimlane__ at board \"{{board-name}}\"\nhttp://{{wekan-host}}/b/{{board-id}}/{{board-name}}/{{card-id}}",
  "cardId": "{{card-id}}",
  "boardId": "{{board-id}}",
  "user": "{{wekan-username}}",
  "card": "{{card-title}}",
  "description": "act-addChecklistItem"
}
```

### Checked item

```json
{
  "text": "{{wekan-username}} checked {{checklist-name}} of checklist \"{{checklist-name}}\" at card \"{{card-title}}\" at list __list__ at swimlane __swimlane__ at board \"{{board-name}}\"\nhttp://{{wekan-host}}/b/{{board-id}}/{{board-name}}/{{card-id}}",
  "cardId": "{{card-id}}",
  "boardId": "{{board-id}}",
  "user": "{{wekan-username}}",
  "card": "{{card-title}}",
  "description": "act-checkedItem"
}
```

### Removed checklist item

```json
{
  "text": "{{wekan-username}} act-removedChecklistItem\nhttp://{{wekan-host}}/b/{{board-id}}/{{board-name}}/{{card-id}}",
  "cardId": "{{card-id}}",
  "boardId": "{{board-id}}",
  "user": "{{wekan-username}}",
  "card": "{{card-title}}",
  "description": "act-removedChecklistItem"
}
```

## Board

Webhooks that are raised on board events

### Create custom field

```json
{
  "text": "{{wekan-username}} created custom field {{customfield-name}} to card __card__ at list __list__ at swimlane __swimlane__ at board \"{{board-name}}\"\nhttp://{{wekan-host}}/b/{{board-id}}/{{board-name}}",
  "boardId": "{{board-id}}",
  "user": "{{wekan-username}}",
  "description": "act-createCustomField"
}
```

## Lists

Webhooks that are raised on list events

### Create list 

```json
{
  "text": "{{wekan-username}} added list \"{{list-name}}\" to board \"{{board-name}}\"\nhttp://{{wekan-host}}/b/{{board-id}}/{{board-name}}",
  "listId": "{{list-id}}",
  "boardId": "{{board-id}}",
  "user": "{{wekan-username}}",
  "description": "act-createList"
}
```

### Archived list

```json
{
  "text": "{{wekan-username}} List \"{{list-name}}\" at swimlane __swimlane__ at board \"{{board-name}}\" moved to Archive\nhttp://{{wekan-host}}/b/{{board-id}}/{{board-name}}",
  "listId": "{{list-id}}",
  "boardId": "{{board-id}}",
  "user": "{{wekan-username}}",
  "description": "act-archivedList"
}
```

### Remove list

```json
{
  "text": "{{wekan-username}} act-removeList\nhttp://{{wekan-host}}/b/{{board-id}}/{{board-name}}",
  "listId": "{{list-id}}",
  "boardId": "{{board-id}}",
  "user": "{{wekan-username}}",
  "description": "act-removeList"
}
```

## Swimlane

### Create swimlane

```json
{
  "text": "{{wekan-username}} created swimlane \"{{swimlane-name}}\" to board \"{{board-name}}\"\nhttp://{{wekan-host}}/b/{{board-id}}/{{board-name}}",
  "boardId": "{{board-id}}",
  "user": "{{wekan-username}}",
  "swimlaneId": "{{swimlane-id}}",
  "description": "act-createSwimlane"
}
```

### Archived swimlane

```json
{
  "text": "{{wekan-username}} Swimlane \"{{swimlane-name}}\" at board \"{{board-name}}\" moved to Archive\nhttp://{{wekan-host}}/b/{{board-id}}/{{board-name}}",
  "boardId": "{{board-id}}",
  "user": "{{wekan-username}}",
  "swimlaneId": "{{swimlane-id}}",
  "description": "act-archivedSwimlane"
}
```

### Remove swimlane

```json
{
  "text": "{{wekan-username}} act-removeSwimlane\nhttp://{{wekan-host}}/b/{{board-id}}/{{board-name}}",
  "boardId": "{{board-id}}",
  "user": "{{wekan-username}}",
  "swimlaneId": "{{swimlane-id}}",
  "description": "act-removeSwimlane"
}
```
{% endraw %}
