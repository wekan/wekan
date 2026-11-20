# Flow fields: Blocked, Class of service, MoSCoW, WSJF

Four Kanban and Scrum practices other tools have, as fields of a card. They
need no AI and no network, and are stored on the card (`card.flow`,
[models/lib/cardFlow.js](../../../models/lib/cardFlow.js)).

| Field | What it is |
| --- | --- |
| **Blocked** | The card is impeded. Tick it and say why; WeKan keeps who marked it and since when. The minicard shows a red **Blocked** badge, with the reason as its tooltip. This is the Kanban impediment, kept on the card that waits. |
| **Class of service** | Standard, Fixed date, Expedite or Intangible (the Kanban Method's classes). **Expedite** has a WIP limit of one: only one open card of a board can be Expedite at a time, and a second one is refused until the first is done or archived. |
| **MoSCoW priority** | Must have, Should have, Could have, Won't have. |
| **WSJF score** | Weighted Shortest Job First: business value, time criticality and risk reduction - the cost of delay - divided by the job size, each scored 1, 2, 3, 5, 8, 13 or 20. The score is shown once every part is set. |

## Showing and hiding them

All four are **off until a board turns them on**:

- **Board Settings / Card**, section **Card**: each field has a row with its
  *Show on Minicard* and *Show on Card* checkboxes, after Dependencies, and is
  moved within the section like any other row.
- **Admin Panel / Settings / Visibility / Features / Card fields**: unticking
  a field hides it on every board of the instance, whatever the boards chose.
  Nothing is deleted - ticking it again shows every card as it was.

## Who may change them

Whoever may edit the card. An assigned-only member changes them only on a card
assigned to them. A linked card shows, and changes, the flow of its source
card. The values are written by the server method `setCardFlow`, which checks
the values; a direct client write of `flow` is refused, so who blocked a card
and when are always the server's.

Tests: `tests/cardFlow.test.cjs`.
