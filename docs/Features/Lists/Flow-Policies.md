# Flow policies: list policies, split lists, commitment point, WIP limit per person

## What it is

Kanban practices for a board's lists, offline and with no AI
([models/lib/boardFlowPolicies.js](../../../models/lib/boardFlowPolicies.js)).
They are taken from the Kanban Guide's practices *make policies explicit* and
*limit work in progress*: each list can say when a card may come in and when
it is done there, the board can mark where work is committed to, a list can
be split into Doing and Done, and the board can cap how much open work one
person holds.

| Practice | What it does |
| --- | --- |
| **List policy** | Each list's own policy: when a card may come into it and when it is done there. Written from the list menu, **List policy**; shown as a gavel at the list header, its tooltip the text. Any member who may write to the board may write it. |
| **Commitment point** | The list from which work is committed to; the lists before it are options. That list's header carries a green flag. |
| **Split list** | A list split into **Doing** and **Done**: a card of it marked *Done here* (the circle at its minicard's corner) waits, dimmed and edged green, to be pulled into the next list, and the header counts *Doing n · Done m*. Turned on for a list in its menu, **Split into Doing and Done**. The mark belongs to the list it was made in, so a card moved on is in Doing of its new list. |
| **WIP limit per person** | How many open cards (not done, not archived) one person may hold on the board, counting a card's assignees, or its members when nobody is assigned. An opened card names each of its people over the limit, in its Members section. |

## Read more

- [The Kanban Guide](https://kanbanguides.org/english/) - the practices
  *make policies explicit* and *limit work in progress*.
- [Kanban (development)](https://en.wikipedia.org/wiki/Kanban_(development))
  on Wikipedia - WIP limits, explicit policies and the commitment point.
- [Work in process](https://en.wikipedia.org/wiki/Work_in_process) on
  Wikipedia.
- [Scrum (software development)](https://en.wikipedia.org/wiki/Scrum_(software_development))
  on Wikipedia - the Definition of Done and of Ready.
- WeKan: [WIP limits](WipLimit/README.md),
  [WIP limit groups](WipLimit/WIP-Limit-Groups.md),
  [Board Settings / List](../Board-Sidebar/Board-Settings/List.md).

## How to use it

All four are **off until a board admin turns them on**.

**Turn them on for a board** (board admin):

1. Open **Board Settings** (the board's hamburger menu) → **List**.
2. Tick *Show list policies* and/or *Allow lists split into Doing and Done*.
3. Choose a list in *Commitment point*, or `-` for none.
4. Type a number 1-99 in *WIP limit per person*, or leave it empty for none.

Other members see these settings disabled.

**Write a list's policy:**

1. Click ☰ (**List Actions**) in the list header → **List policy** (under
   **Settings**).
2. Write when a card may come into the list and when it is done there, and
   click **Save**. An empty text removes the policy.
3. The gavel at the list header shows the text as its tooltip; clicking it
   opens the policy (read-only for members who may not write).

**Split a list into Doing and Done:**

1. List menu → **Split into Doing and Done** (a checkbox).
2. On a minicard of that list, click the circle at its corner to mark it
   *Done here*; click again to clear it.

**Hide them for the whole instance:** each is also a feature of
**Admin Panel / Settings / Features**: *List policies*, *Split lists*,
*Commitment point*, *WIP limit per person*. Turned off there, it is not
offered in Board Settings and not drawn on any board; nothing a board set is
deleted, so turning it on again shows every board as it was. Feature
profiles can hide them for some users only.

## How the numbers are calculated

From [models/lib/boardFlowPolicies.js](../../../models/lib/boardFlowPolicies.js):

- **Policy length**: at most 2000 characters (`MAX_POLICY`) after line endings
  are normalised and the text trimmed; the popup's textarea has
  `maxlength="2000"`.
- **WIP limit per person**: a whole number 1-99 (`MAX_PERSON_WIP`), or none.
- **Open card**: not archived, not marked done (`dueComplete`) and not a
  template card.
- **A card's people**: its assignees; when it has none, its members. Each
  person is counted once per card.
- **Over the limit**: for each person, the number of open cards of the board
  they are a person of; a person is named on the opened card when that count
  is **greater than** the limit (`count > limit`).
- **Split counts**: of the list's non-archived cards, *Done* counts those whose
  `card.flow.splitDoneListId` is the card's current list, *Doing* all others.
- **Committed**: a list is at or after the commitment point when its position
  in the board's lists sorted by `sort` is at or after the commitment list's.

## How it works in WeKan

- Pure rules: [models/lib/boardFlowPolicies.js](../../../models/lib/boardFlowPolicies.js)
  (`normalizePolicy`, `normalizePersonWipLimit`, `peopleOf`,
  `openCardsPerPerson`, `overPersonWip`, `isCommitted`, `isSplitDone`,
  `splitCounts`).
- Fields: `list.policy`, `list.split` ([models/lists.js](../../../models/lists.js));
  `board.allowsListPolicies`, `board.allowsSplitLists`,
  `board.commitmentListId`, `board.personWipLimit`
  ([models/boards.js](../../../models/boards.js)); `card.flow.splitDoneListId`,
  set by the `setCardFlow` method.
- UI: [client/components/lists/listFlowPolicies.jade](../../../client/components/lists/listFlowPolicies.jade)
  and [listFlowPolicies.js](../../../client/components/lists/listFlowPolicies.js)
  (Board Settings / List rows, header marks, the policy popup, the opened
  card's warnings, the minicard toggle); the list menu entries are in
  [client/components/lists/listHeader.jade](../../../client/components/lists/listHeader.jade).
- Instance features: [models/lib/instanceFeatures.js](../../../models/lib/instanceFeatures.js)
  (`list-policies`, `commitment-point`, `person-wip-limit`, `split-lists`).

### Definition of Ready

Beside the Definition of Done, the **Scrum settings** have a **Definition of
Ready**: when a backlog item may be taken into a sprint. Both are shown to
every member in the Scrum views once written, and nothing is drawn while they
are empty; Admin Panel / Features / Scrum views hides them with the views
([models/lib/scrum.js](../../../models/lib/scrum.js),
[client/components/boards/scrum/scrumView.jade](../../../client/components/boards/scrum/scrumView.jade)).

Tests: [tests/boardFlowPolicies.test.cjs](../../../tests/boardFlowPolicies.test.cjs),
[tests/playwright/specs/list-flow-policies.e2e.js](../../../tests/playwright/specs/list-flow-policies.e2e.js),
[tests/playwright/specs/scrum-definition-of-ready.e2e.js](../../../tests/playwright/specs/scrum-definition-of-ready.e2e.js).

## Commits

 - [WeKan JSON import keeps lists' policies and splits](https://github.com/wekan/wekan/commit/24b6b9b0247bf1cda039faec6dba9298f9115116)
 - [lists split into Doing and Done](https://github.com/wekan/wekan/commit/fd5c207006ac1c3ac605b4689860b47205a18d80)
 - [the list policy popup asks the board's write capability](https://github.com/wekan/wekan/commit/524946c1bf14ada5660ffde987574b8129c47732)
 - [list policies, the commitment point, a WIP limit per person and the Definition of Ready](https://github.com/wekan/wekan/commit/9ac7b916c08bb139f1090d4e87b8319aed08d324)
