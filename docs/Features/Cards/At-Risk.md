# At risk

A card that looks like it will not get done in time gets an **At risk** mark: a
small red triangle on the minicard, and in the opened card a line saying why.

## How a card is scored

| Reason | Points |
| --- | --- |
| Overdue: the due date has passed and the card is not complete | 3 |
| Due within two days and less than half of its checklist items are done | 2 |
| Blocked: another open card it depends on (`is blocked by`) is not done | 2 |
| Idle: no activity for 14 days, while not in the board's first or last list | 2 |
| Sent back: moved to an earlier list twice or more | 1 |

A card with 3 points or more is at risk. A complete or archived card never is.
The minicard reads only what the minicard already has (dates, checklist
counts, dependencies, last activity); the opened card also counts the moves, and
lists every reason that applied, for example *Overdue; blocked by "Order
parts"*.

## Hiding it

Board Settings / Card row **At risk**: *Show on Minicard* is the triangle,
*Show on Card* the line in the opened card. A site admin hides both on every
board from Admin Panel / Settings / Visibility / Features / Card fields.

## Implementation

`models/lib/cardRisk.js` (pure: `cardRisk(card, context)` returns `{ score,
reasons }`). Tests: `tests/cardRisk.test.cjs`.
