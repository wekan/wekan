{% raw %}
<!-- The webhook payload examples below contain {{placeholder}} tokens. Wrap the
     whole page in raw so Jekyll's Liquid engine outputs them literally instead
     of trying to evaluate (and erroring on) them when building GitHub Pages. -->
# Webhook data

## What it is

When a webhook is activated it sends the related information within the POST
request body: a JSON object with the activity's sentence in `text`, the event
name in `description`, and the ids, names and links of what it is about. This
page lists what is sent, how to choose it, and an example of each event.

## Read more

- [Wikipedia: Webhook](https://en.wikipedia.org/wiki/Webhook)
- [Wikipedia: JSON](https://en.wikipedia.org/wiki/JSON)
- [Notification delivery](../../../General/Notifications/Notification-Delivery.md)
- [Receiving webhooks](Receiving-Webhooks.md)

## How to use it

1. Open the board, its right sidebar, then **Board Settings → Outgoing
   Webhooks** (board admins; for every board at once, Admin Panel → Settings
   → Global Webhooks).
2. Write the **Webhook Name**, the **URL** the receiver gave you and, when the
   receiver wants one, the **Token (Optional for Authentication)**.
3. Choose the type (**Outgoing Webhooks**) and under **Send this webhook:**
   either **Every activity** or the activities to send.
4. Click **Create**. A saved webhook can be changed and saved again, or turned
   off with **Disable This Webhook**.

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

### Choosing what a webhook sends (#3695)

A receiver that writes its own message - a Rocket.Chat incoming-webhook
script, for example - can ask WeKan for the activity's data as properties and
for as little text as possible. Two settings decide what a regular (one-way)
outgoing webhook sends:

- **Send the message text** - Yes sends the translated sentence as `text`; No
  leaves `text` out.
- **Send these fields** - any combination of these groups (none ticked sends
  only `description`, the event name):

| Group | Properties |
| --- | --- |
| Standard fields | the list `WEBHOOKS_ATTRIBUTES` selects (snap: `webhooks-attributes`), or the built-in list below when it is not set |
| IDs | `activityId`, `boardId`, `oldBoardId`, `swimlaneId`, `oldSwimlaneId`, `listId`, `oldListId`, `cardId`, `commentId`, `checklistId`, `checklistItemId`, `labelId`, `attachmentId`, `customFieldId` |
| Names and titles | `board`, `oldBoard`, `swimlane`, `oldSwimlane`, `list`, `oldList`, `card`, `checklist`, `checklistItem`, `label`, `attachment`, `customField` |
| Links | `url` (the card link, or the board link for a board event), `cardUrl`, `boardUrl` |
| Who did it | `user` (display name), `username`, `userId` |
| The member or assignee it is about | `member`, `memberUsername`, `memberId`, `assignee`, `assigneeUsername`, `assigneeId` |
| Details | `comment`, `cardDescription` (the card's description), `customFieldValue`, `value`, `oldValue` (before/after of a change), `timeKey`, `timeValue`, `timeOldValue` (dates) |

Every payload also has `description` (the event, e.g. `act-joinMember`), and an
`act-editCard` event has `field`. A property is only present when the activity
has it.

The built-in standard list is `cardId`, `listId`, `oldListId`, `boardId`,
`comment`, `user`, `username`, `card`, `commentId`, `swimlaneId`,
`customField`, `customFieldValue`, `labelId`, `label`, `attachmentId`, `list`,
`board`, `swimlane`, `member`, `memberUsername`, `assigneeId`, `assignee`,
`assigneeUsername` and `url`.

#### Where to set it, and which setting wins

These are the webhook channel's *content* settings in the shared notification
delivery model, beside its grouping and schedule - see
[Notification delivery](../../../General/Notifications/Notification-Delivery.md). Each
setting is resolved on its own; the first level that sets it wins:

1. **The webhook itself** - Board Settings / Outgoing Webhooks, or Admin Panel /
   Settings / Global Webhooks for a global webhook: the *Outgoing Webhooks*
   section under each saved one-way webhook. REST:
   `PUT /api/boards/:boardId/integrations/:intId` with
   `"notificationDelivery": { "webhook": { "text": false, "fields": ["ids", "names"] } }`
   (`null` for a value, or for the whole object, inherits).
2. **The board** - Board Settings / Notifications / *Outgoing Webhooks*, for
   that board's own webhooks only (board admins). A global webhook belongs to
   the instance administrator, so a board cannot reshape it.
3. **The Admin Panel** - Admin Panel / People / Notifications / *Outgoing
   Webhooks*, the default for every webhook of the instance (instance admins).
4. **Built in** - text on, Standard fields: exactly the payload WeKan sent
   before these settings existed. Nothing changes until somebody changes a
   setting, and `WEBHOOKS_ATTRIBUTES` keeps working as before.

At the webhook and board levels, *Default* means "inherit the next level".
Field group names in the stored value are `standard`, `ids`, `names`,
`links`, `actor`, `people` and `details`; anything else is refused.

#### Member Settings: leave my name out

Member Settings / Notifications / *Outgoing Webhooks* has one member-level choice:
**Leave my name out of outgoing webhooks**. Webhooks deliver to a chat room,
not to a member, so a member does not choose a room's payload; what a member
does own is their identity. With it ticked, every webhook - one-way and
two-way, on every board - leaves out that member's `user`, `username` and
`userId` when they did something, and `member`/`memberUsername`/`memberId` or
`assignee`/`assigneeUsername`/`assigneeId` when the event is about them, and the
text says "A member" instead of their name. No board or Admin Panel setting
overrides it. (Text the member wrote themselves, such as a comment that
mentions their name, is sent as written.)

#### What is never sent

A group only ever sends the properties listed above: never e-mail addresses,
the watcher list, tokens or other secrets. The value of a custom field marked
admin-only (#3141) - `customFieldValue`, `value`, `oldValue` - is left out of
every one-way webhook, because a chat room is read by people who are not the
board's admins.

Two-way webhooks keep sending the complete activity parameters (their reply
protocol needs them); the text and field settings do not apply to them, the
member's "leave my name out" does.

## How the numbers are calculated

- **Which setting wins**: for the text and for the field groups separately,
  the first level that sets it - the webhook, then the board, then the Admin
  Panel, then the built-in default (text on, the standard fields).
- **Values keep their JSON types**: `0`, `false`, `""` and `null` are sent as
  they are; a missing value is left out.

The numbers every outgoing webhook has:

- **Timeout**: one request may take 30 seconds (`totalTimeoutMs: 30000` in
  [server/notifications/outgoing.js](../../../../../server/notifications/outgoing.js)).
  A 2xx answer is success.
- **At once or queued**: a webhook with the built-in delivery settings is
  POSTed at once. One whose delivery groups or schedules its notifications
  goes through the durable queue
  ([server/lib/webhookOutbox.js](../../../../../server/lib/webhookOutbox.js)),
  scanned every 5 seconds: at most 100 jobs a pass, a body of at most 1 MB,
  and a failed job is tried again after `min(60 minutes, 30 seconds x
  2^(attempts - 1))` - 30 s, 1 min, 2 min, 4 min ... - up to 10 attempts.
- **Internal destinations**: Admin Panel can list at most 50 hosts on WeKan's
  own network that webhooks may reach
  ([models/lib/internalWebhookHosts.js](../../../../../models/lib/internalWebhookHosts.js)).

## How it works in WeKan

The body is built by `buildWebhookBody` in
[models/lib/webhookPayload.js](../../../../../models/lib/webhookPayload.js), whose
groups are `WEBHOOK_PAYLOAD_GROUPS`; the member's choice to leave their name
out is `hideIdentityFields`, and the delivery settings are resolved by
[models/lib/notificationDelivery.js](../../../../../models/lib/notificationDelivery.js).
Pinned by
[tests/webhookPayloadSettings.test.cjs](../../../../../tests/webhookPayloadSettings.test.cjs),
which also checks that this page names every property and setting.

A webhook is a document of the `Integrations` collection
([models/integrations.js](../../../../../models/integrations.js)): the board it
belongs to (`_global` for Admin Panel → Settings → Global Webhooks), its type
(Outgoing Webhooks, or Two-Way Webhooks whose answer can change the board), its
name, URL, optional token and the activities it sends. Only a board admin or a
site admin may add, change or remove one, and it cannot be moved to another
board ([server/permissions/integrations.js](../../../../../server/permissions/integrations.js)).
When a board activity happens,
[server/notifications/outgoing.js](../../../../../server/notifications/outgoing.js)
builds the JSON body ([models/lib/webhookPayload.js](../../../../../models/lib/webhookPayload.js),
described in [Webhook data](Webhook-data.md))
and POSTs it through the outgoing request guard
([server/lib/ssrfGuard.js](../../../../../server/lib/ssrfGuard.js)), which
refuses private, loopback and link-local addresses unless Admin Panel lists
them, and trusts `WEBHOOK_TLS_CA_CERT` for TLS. The webhooks are set in
`outgoingWebhooksPopup` in
[client/components/sidebar/sidebar.jade](../../../../../client/components/sidebar/sidebar.jade).

The events and their bodies, one example each:

### Cards

#### Creation

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

#### Move

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

#### Archival

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

#### Restored

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

### Card content

Webhooks that are raised on card content change

#### Comment creation

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

#### Comment edit

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

#### AddLabel

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

#### Join member

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

#### Set custom field

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

#### Add attachment

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

#### Delete attachment

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

#### Add checklist

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

#### Remove checklist

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

#### Uncomplete checklist

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

#### Add checklist item

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

#### Checked item

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

#### Removed checklist item

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

### Board

Webhooks that are raised on board events

#### Create custom field

```json
{
  "text": "{{wekan-username}} created custom field {{customfield-name}} to card __card__ at list __list__ at swimlane __swimlane__ at board \"{{board-name}}\"\nhttp://{{wekan-host}}/b/{{board-id}}/{{board-name}}",
  "boardId": "{{board-id}}",
  "user": "{{wekan-username}}",
  "description": "act-createCustomField"
}
```

### Lists

Webhooks that are raised on list events

#### Create list 

```json
{
  "text": "{{wekan-username}} added list \"{{list-name}}\" to board \"{{board-name}}\"\nhttp://{{wekan-host}}/b/{{board-id}}/{{board-name}}",
  "listId": "{{list-id}}",
  "boardId": "{{board-id}}",
  "user": "{{wekan-username}}",
  "description": "act-createList"
}
```

#### Archived list

```json
{
  "text": "{{wekan-username}} List \"{{list-name}}\" at swimlane __swimlane__ at board \"{{board-name}}\" moved to Archive\nhttp://{{wekan-host}}/b/{{board-id}}/{{board-name}}",
  "listId": "{{list-id}}",
  "boardId": "{{board-id}}",
  "user": "{{wekan-username}}",
  "description": "act-archivedList"
}
```

#### Remove list

```json
{
  "text": "{{wekan-username}} act-removeList\nhttp://{{wekan-host}}/b/{{board-id}}/{{board-name}}",
  "listId": "{{list-id}}",
  "boardId": "{{board-id}}",
  "user": "{{wekan-username}}",
  "description": "act-removeList"
}
```

### Swimlane

#### Create swimlane

```json
{
  "text": "{{wekan-username}} created swimlane \"{{swimlane-name}}\" to board \"{{board-name}}\"\nhttp://{{wekan-host}}/b/{{board-id}}/{{board-name}}",
  "boardId": "{{board-id}}",
  "user": "{{wekan-username}}",
  "swimlaneId": "{{swimlane-id}}",
  "description": "act-createSwimlane"
}
```

#### Archived swimlane

```json
{
  "text": "{{wekan-username}} Swimlane \"{{swimlane-name}}\" at board \"{{board-name}}\" moved to Archive\nhttp://{{wekan-host}}/b/{{board-id}}/{{board-name}}",
  "boardId": "{{board-id}}",
  "user": "{{wekan-username}}",
  "swimlaneId": "{{swimlane-id}}",
  "description": "act-archivedSwimlane"
}
```

#### Remove swimlane

```json
{
  "text": "{{wekan-username}} act-removeSwimlane\nhttp://{{wekan-host}}/b/{{board-id}}/{{board-name}}",
  "boardId": "{{board-id}}",
  "user": "{{wekan-username}}",
  "swimlaneId": "{{swimlane-id}}",
  "description": "act-removeSwimlane"
}
```

## Commits

 - [Choose what notifications contain, and group and schedule them, for e-mail, the tray and webhooks](https://github.com/wekan/wekan/commit/ab785acd1ebd309a96e7231509796d8b71a78572)
 - [Send names, the card link and the assigned person in outgoing webhooks](https://github.com/wekan/wekan/commit/5f413c12eb99cc72b8b7447286f35f9c13392560)
 - [Preserve zero and false activity values in notifications and webhooks](https://github.com/wekan/wekan/commit/68dcb02d1389b53c0e6933cdba4a327a411204c2)
 - [Add the docs from the wekan.wiki, this page among them](https://github.com/wekan/wekan/commit/73ae73d4c38640e9daedbe8ef9e5b25b877ee804)
{% endraw %}
