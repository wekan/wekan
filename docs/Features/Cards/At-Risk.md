# At risk

## What it is

A card that looks like it will not get done in time gets an **At risk** mark: a
small red triangle on the minicard, and in the opened card a line saying why.
The mark is a weighted score of five plain rules - overdue, due soon with the
checklist behind, blocked, idle, sent back - so anybody can read why a card
was marked, instead of a prediction nobody can check. It needs no AI and no
setup.

## Read more

- [Project risk management](https://en.wikipedia.org/wiki/Project_risk_management)
  and [Risk management](https://en.wikipedia.org/wiki/Risk_management) on
  Wikipedia - the subject the mark is a small, rule-based part of.
- [Kanban (development)](https://en.wikipedia.org/wiki/Kanban_(development)) -
  blocked, idle and sent-back work are the flow problems a Kanban board shows.
- In WeKan: [Due date](Dates/Due-Date.md), [Checklists](Checklists.md),
  [Flow fields](Flow-Fields.md) (Blocked), [Forecast](Dates/Forecast.md) and
  [Helpers that need no AI](../Assistants/README.md).

## How to use it

**See which cards are at risk**

1. Open a board. A minicard with a small red triangle is at risk.
2. Click the minicard to open the card. Under **Date**, the **At risk** line
   lists every reason that applied, for example *overdue; blocked by "Order
   parts"*.
3. Fix what the reasons name - set a new due date, tick the checklist items,
   finish the blocking card, move the card on - and the mark goes away by
   itself.

**Hide it**

1. Open the board's cog menu, **Board Settings**, then **Card** (Card
   Settings).
2. In the **Date** section, untick the **At risk** row: in *Show on Minicard*
   for the triangle, in *Show on Card* for the line in the opened card.
3. A site admin hides both on every board from Admin Panel / Settings /
   Features / **Card fields**.

## How the numbers are calculated

From [models/lib/cardRisk.js](../../../models/lib/cardRisk.js):

| Reason | Rule | Points |
| --- | --- | --- |
| Overdue | the due date has passed and the card is not complete | 3 |
| Due soon | due within two days (`DUE_SOON_DAYS = 2`) and less than half of its checklist items are done (`finished / total < 0.5`, only when it has checklist items) | 2 |
| Blocked | another open card it depends on (`is blocked by`) is not done | 2 |
| Idle | no activity for 14 days (`IDLE_DAYS = 14`), while not in the board's first or last list | 2 |
| Sent back | moved to an earlier list twice or more (`SENT_BACK_MOVES = 2`) | 1 |

- The score is the sum of the points of the reasons that apply. A card with
  **3 points or more** (`THRESHOLD = 3`) is at risk, so being overdue alone is
  enough, and any two of the other rules are too.
- Overdue and Due soon exclude each other: a due date that has passed is only
  Overdue.
- A **complete** card never is at risk: one marked complete (`dueComplete`),
  one with an end date, or one that is archived.
- Idle counts whole days since the card's last activity
  (`dateLastActivity`, else `modifiedAt`): `floor((now - last) / 1 day)`.
- Sent back counts the card's moves where the list it went to is before the
  list it came from in the board's list order (`countBackMoves`).
- The minicard reads only what the minicard already has (dates, checklist
  counts, dependencies, last activity), so it never counts Sent back; the
  opened card also counts the moves and so may score one point higher.

## How it works in WeKan

- [models/lib/cardRisk.js](../../../models/lib/cardRisk.js) is pure (no
  Meteor): `cardRisk(card, context)` returns `{ atRisk, score, reasons }`,
  `countBackMoves(moves, listSort)` counts the moves back, and `REASON_KEYS`
  names the i18n key of each reason (`at-risk-reason-overdue` ...
  `at-risk-reason-sent-back`).
- [client/lib/cardRiskOf.js](../../../client/lib/cardRiskOf.js) `riskOf(card,
  { withMoves })` hands the rules what the client has: the real card of a
  linked card, the checklist counts, the open `is-blocked-by` dependencies,
  whether the list is neither the first nor the last of its swimlane's lists
  (or of the board's shared lists), and - with `withMoves`, on the opened
  card - the `moveCard` activities. It joins the translated reasons with
  `; `.
- [client/components/cards/minicard.js](../../../client/components/cards/minicard.js)
  draws the triangle (`atRisk`), and
  [client/components/cards/cardDetails.js](../../../client/components/cards/cardDetails.js)
  the line with its reasons.
- The board flags are `allowsAtRiskOnCard` and `allowsAtRiskOnMinicard` in
  [models/boards.js](../../../models/boards.js), both on by default
  ([models/lib/cardSettingsRows.js](../../../models/lib/cardSettingsRows.js),
  row `atRisk` in the Date section). The Admin Panel's Card fields overlay is
  [models/lib/cardFieldVisibility.js](../../../models/lib/cardFieldVisibility.js).
- Nothing is stored: the score is computed whenever the card is drawn.
- Tests: [tests/cardRisk.test.cjs](../../../tests/cardRisk.test.cjs) (the five
  rules, their points and the threshold) and
  [tests/playwright/specs/assist-at-risk.e2e.js](../../../tests/playwright/specs/assist-at-risk.e2e.js).

## Commits

 - [At risk mark on the minicard and the opened card, with its five rules](https://github.com/wekan/wekan/commit/083c863fb7f96055fa52f0ed074ddab98494c81b)
