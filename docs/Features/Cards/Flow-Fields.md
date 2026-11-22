# Flow fields: Blocked, Class of service, MoSCoW, WSJF

## What it is

Four Kanban and Scrum practices other tools have, as fields of a card. They
need no AI and no network, and are stored on the card (`card.flow`,
[models/lib/cardFlow.js](../../../models/lib/cardFlow.js)). They say what stops
a card, how urgently it is served, how much it is needed and which card gives
the most value soonest.

| Field | What it is |
| --- | --- |
| **Blocked** | The card is impeded. Tick it and say why; WeKan keeps who marked it and since when. The minicard shows a red **Blocked** badge, with the reason as its tooltip. This is the Kanban impediment, kept on the card that waits. |
| **Class of service** | Standard, Fixed date, Expedite or Intangible (the Kanban Method's classes). **Expedite** has a WIP limit of one: only one open card of a board can be Expedite at a time, and a second one is refused until the first is done (its due date marked complete) or archived. |
| **MoSCoW priority** | Must have, Should have, Could have, Won't have. |
| **WSJF score** | Weighted Shortest Job First: business value, time criticality and risk reduction - the cost of delay - divided by the job size, each scored 1, 2, 3, 5, 8, 13 or 20. The score is shown once every part is set. |

## Read more

- [Kanban (development)](https://en.wikipedia.org/wiki/Kanban_(development))
  on Wikipedia - impediments, classes of service and WIP limits.
- [MoSCoW method](https://en.wikipedia.org/wiki/MoSCoW_method) on Wikipedia.
- [Cost of delay](https://en.wikipedia.org/wiki/Cost_of_delay) on Wikipedia,
  and [WSJF](https://framework.scaledagile.com/wsjf) in the Scaled Agile
  Framework, whose scale WeKan uses.
- In WeKan: [Card Settings](Card-Settings.md),
  [Admin Panel / Settings / Features](../Admin-Panel/Settings/Features.md).

## How to use it

**Showing them** - all four are **off until a board turns them on**:

1. Open **Board Settings / Card**, section **Card**. Each field has a row
   (**Blocked**, **Class of service**, **MoSCoW priority**, **WSJF score**) with
   its *Show on Minicard* and *Show on Card* checkboxes, after Dependencies, and
   is moved within the section like any other row.
2. Tick *Show on Card* to edit it on the opened card, *Show on Minicard* to see
   it on the minicard.
3. **Admin Panel / Settings / Features / Card fields**: unticking a field hides
   it on every board of the instance, whatever the boards chose. Nothing is
   deleted - ticking it again shows every card as it was.

**Using them on a card**

1. Open the card. In its **Card** section:
2. **Blocked**: tick the checkbox and type the reason (up to 1000 characters).
   The row then says since when and by whom. Untick it when the card can move
   again; the reason, the time and the person are cleared.
3. **Class of service** and **MoSCoW priority**: choose from the list; `-` clears
   it.
4. **WSJF score**: choose a value for each of the four parts; the score appears
   beside the heading once all four are set.

### Who may change them

Whoever may edit the card. An assigned-only member changes them only on a card
assigned to them (or of which they are a member). A linked card shows, and
changes, the flow of its source card. The values are written by the server
method `setCardFlow`, which checks the values; a direct client write of `flow`
is refused, so who blocked a card and when are always the server's.

## How the numbers are calculated

From [models/lib/cardFlow.js](../../../models/lib/cardFlow.js):

- **WSJF score** = (business value + time criticality + risk reduction) / job
  size, rounded to one decimal (`wsjfScore`). Each part must be one of 1, 2, 3,
  5, 8, 13 or 20 (the modified Fibonacci scale); until all four are set the
  score is empty. Example: (8 + 5 + 3) / 2 = 8.0.
- **Expedite WIP limit** = 1 per board (`EXPEDITE_LIMIT`). Making a card
  Expedite is refused (`expedite-limit`) when another card of the same board is
  Expedite, not archived and not done (`dueComplete` not set)
  (`expediteOverLimit`). A card that already is Expedite is not checked again.
- **Blocked reason**: at most 1000 characters (`MAX_REASON`), trimmed.
- **Blocked since**: the server's time when the card was marked blocked
  (`flow.blockedAt`).

## How it works in WeKan

- **Model** (pure): [models/lib/cardFlow.js](../../../models/lib/cardFlow.js) -
  the allowed values, `flowModifier` (turns a change into a Mongo modifier and
  refuses anything else), `expediteOverLimit` and `flowView` (what the card and
  minicard draw).
- **Server**: `setCardFlow` in
  [server/lib/cardFlowMethod.js](../../../server/lib/cardFlowMethod.js) resolves
  a linked card to its source, checks `canEditCardOrLinkedCard` and the
  assigned-only scope, applies the Expedite limit, and writes `flow`.
- **Client**: [client/components/cards/cardFlow.jade](../../../client/components/cards/cardFlow.jade)
  and [client/components/cards/cardFlow.js](../../../client/components/cards/cardFlow.js)
  (the rows of the opened card), the minicard badges in
  `client/components/cards/minicard.jade`.
- **Settings rows**: `blocked`, `classOfService`, `moscow` and `wsjf` in
  [models/lib/cardSettingsRows.js](../../../models/lib/cardSettingsRows.js), board
  fields `allowsBlockedOnCard`, `allowsBlockedOnMinicard` and the like, all
  `false` by default.
- **Fields**: `flow.blocked`, `flow.blockedReason`, `flow.blockedAt`,
  `flow.blockedBy`, `flow.classOfService`, `flow.moscow`, `flow.wsjf.*`, and
  `flow.splitDoneListId` used by lists split into Doing and Done.

Tests: `tests/cardFlow.test.cjs` and the Playwright spec
`card-flow-fields.e2e.js`.

## Commits

 - [WeKan JSON import keeps the flow fields](https://github.com/wekan/wekan/commit/c640c5c376526f6550873b757fa6b68511c63d42)
 - [Taiga's blocked state is the card's Blocked flow field](https://github.com/wekan/wekan/commit/ab884547f44913cb5269b8248e6301b4983a43c0)
 - [Lists split into Doing and Done, marked through the flow field](https://github.com/wekan/wekan/commit/fd5c207006ac1c3ac605b4689860b47205a18d80)
 - [Flow fields on cards: Blocked, Class of service with Expedite's WIP limit, MoSCoW and WSJF](https://github.com/wekan/wekan/commit/0071dde0f36bb7c8582073a2c072159e15f41ceb)
