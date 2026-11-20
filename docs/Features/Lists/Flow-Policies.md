# Flow policies: list policies, commitment point, WIP limit per person

Three Kanban practices for a board's lists, offline and with no AI
([models/lib/boardFlowPolicies.js](../../../models/lib/boardFlowPolicies.js)).
They are taken from the Kanban Guide's practices *make policies explicit* and
*limit work in progress*.

| Practice | What it does |
| --- | --- |
| **List policy** | Each list's own policy: when a card may come into it and when it is done there. Written from the list menu, **List policy**; shown as a gavel at the list header, its tooltip the text. Any member who may edit lists may write it. |
| **Commitment point** | The list from which work is committed to; the lists before it are options. That list's header carries a green flag. |
| **WIP limit per person** | How many open cards (not done, not archived) one person may hold on the board, counting a card's assignees, or its members when nobody is assigned. An opened card names each of its people over the limit, in its Members section. |

## Turning them on, and hiding them

All three are **off until a board admin turns them on**, in **Board Settings /
List**: *Show list policies*, *Commitment point* (a list, or none) and *WIP
limit per person* (1-99, empty for none).

Each is also a feature of **Admin Panel / Settings / Visibility / Features**:
*List policies*, *Commitment point*, *WIP limit per person*. Turned off there,
it is not offered in Board Settings and not drawn on any board; nothing a board
set is deleted, so turning it on again shows every board as it was. Feature
profiles can hide them for some users only.

## Definition of Ready

Beside the Definition of Done, the **Scrum settings** have a **Definition of
Ready**: when a backlog item may be taken into a sprint. Both are shown to
every member in the Scrum views once written, and nothing is drawn while they
are empty; Admin Panel / Features / Scrum views hides them with the views.

Tests: `tests/boardFlowPolicies.test.cjs`,
`tests/playwright/specs/list-flow-policies.e2e.js`,
`tests/playwright/specs/scrum-definition-of-ready.e2e.js`.
