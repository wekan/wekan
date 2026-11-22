# Subtasks

## What it is

A subtask is a card that belongs to another card, its parent: a big piece of
work is split into smaller cards that can each be assigned, scheduled and
moved on their own, while the parent card lists them and counts how many are
done. A subtask is an ordinary card. It lives on the parent board's subtask
(deposit) board - by default a board of its own, `^Board name^`, created the
first time - or on any board chosen in the Subtasks Settings. A card can be a
subtask of several parent cards.

## Read more

- Wikipedia: [Work breakdown structure](https://en.wikipedia.org/wiki/Work_breakdown_structure)
  and [Task (project management)](https://en.wikipedia.org/wiki/Task_(project_management)).
- In WeKan: [Board filters, Subtasks by parent](../Board-Sidebar/Filter/README.md#subtasks-by-parent),
  [Checklists](Checklists.md),
  [Checklist from description](Checklist-From-Description.md) (its **Make
  subtasks** button) and
  [Board Settings / Card](../Board-Sidebar/Board-Settings/Card.md).

## How to use it

**Add a subtask:**

1. Open the parent card. In the **Subtasks** section, click **+** (**Add
   Subtask**).
2. Type the title. Tick **Inherit parent's labels** to copy the parent's
   current labels onto the new subtask, once.
3. Click **Save**. The subtask is created on the subtask board, in its landing
   list and swimlane (below).

**Add an existing card as a subtask:**

1. In the **Subtasks** section, click the link icon (**Add Existing Card as
   Subtask**).
2. Choose the board under **Card from board** (any board you may also write),
   search, and click the card. Cards already under this card, and the card's
   own ancestors, are not offered.

A checklist item becomes a linked subtask from the item's own menu
(**Convert to Subtask**), and the lines of a description become subtasks with
**Make subtasks** in [Checklist from description](Checklist-From-Description.md).

**Work with a subtask:** click the hamburger (**Subtask Actions**) at the
start of its row: **View it** opens the subtask itself, **Go to Board** opens
its board, and a board admin can **Delete** it. Click its title to rename it.

**Filter the board by a parent:** to focus a board on one project's direct
subtasks, open its parent card and choose **Filter: Subtasks** from the
hamburger at the end of the **Subtasks** heading. Adjust or clear the
selection under **Filter → Parent card**. See
[Board filters](../Board-Sidebar/Filter/README.md#subtasks-by-parent).

**Subtasks Settings:** the same hamburger has **Subtasks Settings** (also in
Board sidebar → **Board Settings** → **Card**, in the Subtasks section's
menu):

| Setting | What it does |
| --- | --- |
| **Show parent in minicard:** | how a subtask's minicard names its parent: **Prefix with full path**, **Prefix with parent**, **Subtext with full path**, **Subtext with parent** or **Don't show parent** |
| **Show subtasks field** | whether the board's cards have the Subtasks section |
| **Deposit subtasks to this board:** | the board new subtasks are created on |
| **Landing list for subtasks deposited here:** | their list on that board |
| **Landing swimlane for subtasks** | their swimlane; **Same name as the parent card's swimlane, else the default** unless one is chosen |

### Subtask status

In the card's **Subtasks** section, each subtask now shows its current **status** — the
list it currently resides in (for example *To Do*, *In Progress*, *Done*) — read-only next
to the subtask title. When a subtask lives on a different board than the parent card, the
list name is prefixed with that board's title.

### Ticking a subtask done

Each subtask in the card's **Subtasks** section has a **checkbox** at the start
of its row ([#4693](https://github.com/wekan/wekan/issues/4693)). Tick it to mark
the subtask done, untick it to mark it not done again. The section heading shows
how many are done, for example **Subtasks (1/3)**, and the minicard's subtask
badge counts the same.

- **What "done" means.** A subtask is a card, and ticking it sets that card's own
  **Mark as complete** flag - the same checkbox as in the subtask's card details
  and on its minicard, the one the rules engine's *Mark card complete* action and
  Scrum's default completion policy use. An **archived** subtask also counts as
  done, as before; it shows a ticked box that cannot be unticked until the
  subtask is restored.
- **Who can tick it.** Anyone who may edit the subtask card itself. A subtask
  usually lives on the parent board's subtask board, so what counts is the
  member's role on *that* board: board admins and normal members can tick;
  comment-only, read-only and worker members see the box disabled; an
  assigned-only member can tick only the subtasks assigned to them. The server
  checks the same rule, so the box is not the only guard.
- **History.** A tick is recorded in the subtask's History (the *dates* group,
  like any *Mark as complete*), with who did it.
- **What is counted.** Only the subtasks you can see: a subtask on a board you
  cannot read is neither shown nor counted.
- **Hide completed subtasks** now also hides the subtasks ticked done.

### Fix: If you are unable to create Subtasks

This can happen on old boards: You have Subtasks board missing.

1) Create new board similar to your original board, but with `^` at beginning and end of your boardname. For example, if your boardname is `MyProject`, create new board with name `^MyProject^`. At keyboard that character is `Shift-^-Space`.

<img src="https://wekan.fi/subtasks/subtask-workaround-part1.png" width="30%" alt="Subtask workaround part 1" />

2) Set your `MyProject` board to have subtask board `^MyProject^`

<img src="https://wekan.fi/subtasks/subtask-workaround-part2.png" width="30%" alt="Subtask workaround part 2" />

3) Now you are able to create Subtasks to your board `MyProject`.

The server now creates that `^MyProject^` board itself the first time a
subtask is added (see the fixes below), so this is needed only when an old
board's setting points at a board that no longer exists.

## How the numbers are calculated

- **Heading count "done/total"** (`subtaskDoneCountLabel` in
  [models/lib/subtaskDone.js](../../../models/lib/subtaskDone.js)): *total*
  is every subtask of the card you can read, archived ones included; *done*
  is those marked complete (`dueComplete`) or archived. With no subtasks the
  heading shows no count.
- **Minicard badge "M/N"** (`subtasksFinishedCount` / `allSubtasksCount` in
  [models/cards.js](../../../models/cards.js)): the same rule,
  `{ $or: [{ archived: true }, { dueComplete: true }] }` over all subtasks.
- **Status**: the subtask's list title; on another board `Board / List`
  (`subtaskStatusLabel` in
  [client/components/cards/subtaskStatusHelpers.js](../../../client/components/cards/subtaskStatusHelpers.js)).
- **Add Existing Card as Subtask** offers at most 50 cards, in board order,
  matching the search case-insensitively.
- **Landing list** ([models/lib/subtaskLandingList.js](../../../models/lib/subtaskLandingList.js)):
  1. the main board's choice, when it is a live list of the deposit board;
  2. the deposit board's own choice, when it is a live list of it;
  3. none set there: a new **Queue** list, stored as its choice;
  4. its choice is gone, archived or on another board: its first live list,
     or a new **Queue** list that is not stored.
- **Landing swimlane** ([models/lib/subtaskLandingSwimlane.js](../../../models/lib/subtaskLandingSwimlane.js)):
  the main board's choice, else the deposit board's, else the deposit board's
  swimlane with the parent card's swimlane title, else its default swimlane.
- **Position**: a new subtask goes to the end of its landing list, with sort
  = the last open card's sort + 1 (0 in an empty list), and gets the deposit
  board's next card number.

## How it works in WeKan

- A subtask is a card whose `parentId` (and, for several parents,
  `parentIds`) names its parent ([models/lib/cardParents.js](../../../models/lib/cardParents.js)).
  The board fields `subtasksDefaultBoardId`, `subtasksDefaultListId`,
  `subtasksDefaultSwimlaneId`, `allowsSubtasks` and `presentParentTask` hold
  the Subtasks Settings ([models/boards.js](../../../models/boards.js)).
- **Creation** is server-side: `addSubtaskCard(parentCardId, title,
  inheritLabels)` in [server/models/cards.js](../../../server/models/cards.js)
  checks the author may edit the parent card, resolves (and creates once) the
  deposit board with `getDefaultSubtasksBoardAsync`, checks the author may
  write it (`canWriteSubtaskDeposit`,
  [server/lib/subtaskDepositAccess.js](../../../server/lib/subtaskDepositAccess.js);
  a refusal is recorded in Admin Panel / Problems), checks the landing list's
  permissions, and applies the deposit board's automatic custom fields.
- **Ticking done**: [server/lib/subtaskDoneMethod.js](../../../server/lib/subtaskDoneMethod.js)
  with the pure rules `isSubtaskDone` and `subtaskDoneDenial` of
  [models/lib/subtaskDone.js](../../../models/lib/subtaskDone.js).
- **Client**: [client/components/cards/subtasks.jade](../../../client/components/cards/subtasks.jade)
  and [subtasks.js](../../../client/components/cards/subtasks.js) (the
  section, the add forms, Subtask Actions), the heading and its hamburger
  `cardSubtasksMenuPopup` in
  [cardDetails.jade](../../../client/components/cards/cardDetails.jade), and
  `boardSubtaskSettingsBody` in
  [client/components/sidebar/sidebar.jade](../../../client/components/sidebar/sidebar.jade).
- Tests: [tests/subtaskDone4693.test.cjs](../../../tests/subtaskDone4693.test.cjs),
  [tests/subtaskLandingList.test.cjs](../../../tests/subtaskLandingList.test.cjs),
  [tests/subtaskLandingSwimlane.test.cjs](../../../tests/subtaskLandingSwimlane.test.cjs),
  [tests/subtaskInheritLabels2184.test.cjs](../../../tests/subtaskInheritLabels2184.test.cjs),
  [tests/crossBoardSubtasks.test.cjs](../../../tests/crossBoardSubtasks.test.cjs),
  [tests/subtasksDefaultBoard.test.cjs](../../../tests/subtasksDefaultBoard.test.cjs),
  [tests/subtaskDepositSecurity.test.cjs](../../../tests/subtaskDepositSecurity.test.cjs),
  [tests/subtaskViewNavigation.test.cjs](../../../tests/subtaskViewNavigation.test.cjs),
  [server/lib/tests/subtaskCreation.tests.js](../../../server/lib/tests/subtaskCreation.tests.js),
  [server/lib/tests/subtaskDone.tests.js](../../../server/lib/tests/subtaskDone.tests.js),
  [tests/playwright/specs/subtask-done-4693.e2e.js](../../../tests/playwright/specs/subtask-done-4693.e2e.js)
  and [tests/playwright/specs/subtask-landing-list.e2e.js](../../../tests/playwright/specs/subtask-landing-list.e2e.js).

### Subtask fixes

Several long-standing subtask bugs were fixed (2026-06-20, then 2026-07-16 for
Meteor 3):

- Creating subtasks no longer produces extra swimlanes/columns, and you can create more
  than one subtask reliably. Subtask creation is now performed server-side, so the default
  subtasks board / list / swimlane are created **once** and then reused (this also removes
  the need for the `^MyProject^` board workaround above on new boards).
- New subtask cards now receive the destination board's automatic ("always on card") custom
  fields.
- The board **"Landing list for subtasks deposited here"** setting now saves and shows the
  correct list.
- The subtask **"View it"** action now opens the subtask itself instead of the parent card.
- A circular subtask/parent reference can no longer hang the board.

## Commits

 - [Filter: Subtasks moves to the hamburger of the Subtasks heading](https://github.com/wekan/wekan/commit/4f20f24201b4b51c07118b1ebd543a774ee4a79f)
 - [An existing card from another board as a subtask](https://github.com/wekan/wekan/commit/e9af50ff07a283efe35bce2bb0dc9d3f7082d058)
 - [Pick the swimlane new subtasks land in](https://github.com/wekan/wekan/commit/740c3920eb2d19fc82393dc26301988946c93406)
 - [Tick subtasks done in the parent card, with done/total in the heading](https://github.com/wekan/wekan/commit/a713154d703dd4832ca85eb25b479e9f9119cc48)
 - [Subtasks land in the list the main board chose on its deposit board](https://github.com/wekan/wekan/commit/42c9a396e2326b31fa75a4fc9525f2cd98d98d56)
 - [A deposit board admits invitees only from its own inviters](https://github.com/wekan/wekan/commit/1167a2ae2f6bbcd876da655ccf14d2343a24c303)
 - [A card can be a subtask of several parent cards](https://github.com/wekan/wekan/commit/a904ca8807348ca8ad7c11cb3329ab0ea136e5e5)
 - [Filter the board's subtasks by parent card](https://github.com/wekan/wekan/commit/8ad064346aca4407651ebf10565c6e6452279405)
 - [Authorize subtask deposit reads and destination writes](https://github.com/wekan/wekan/commit/c50d7b4ea7a080f3efbfc9951f35a3a1cf9bb1d6)
 - [Archived subtasks stay in the list as completed, with Hide completed subtasks](https://github.com/wekan/wekan/commit/4de77a4a5b377ffa8ce8111a9d85c9bdc7cf78c0)
 - [Inherit the parent's labels when adding a subtask](https://github.com/wekan/wekan/commit/632a107f337ae729a711e42954421a3195da290c)
 - [Convert a checklist item to a linked subtask](https://github.com/wekan/wekan/commit/0a9277ce067e175db75c7758edd0f3def2a43f13)
 - [Add an existing card as a subtask from the parent card](https://github.com/wekan/wekan/commit/27f5051be02f88993833266ca10d4180dd231477)
 - [The completion counter counts archived subtasks as done](https://github.com/wekan/wekan/commit/2bc82f9ff5feee560f0fb8ee79a5210cf06f5658)
 - [Subtasks inherit the parent's swimlane, pinned by a test](https://github.com/wekan/wekan/commit/9aaecba8b1cf1a4219131cac14a66fb393d931af)
 - [Subtask creation works again after the helper board is set up](https://github.com/wekan/wekan/commit/f3ca168e259d76b6d3bbae332e2b612444e7c7bd)
 - [Subtasks Settings on a hamburger of the Subtasks heading](https://github.com/wekan/wekan/commit/18076c138d62186206e5bbe32066818032c540a4)
 - [Card drag reorder in lists full of subtask cards](https://github.com/wekan/wekan/commit/5e036dc5444fd1c84991da6f36a17305257d4e7f)
 - [Fix the addSubtaskCard crash on the Meteor 3 server](https://github.com/wekan/wekan/commit/fcce2e1ceaacdd9d52310f63eba0950f93548290)
 - [View it opens the subtask instead of the parent card](https://github.com/wekan/wekan/commit/c5cdc7b6597695ad0d778e08ec24884b4b02ef90)
 - [Subtask creation on the server: no extra swimlanes, custom fields, no loops](https://github.com/wekan/wekan/commit/4b27313c72e385c3943cfaf77a09a9f6c0b02840)
 - [The subtask board is reachable without a reload](https://github.com/wekan/wekan/commit/45bd7dcc857b7f4ca7c147dee2477fc78d0f4959)
 - [Show each subtask's status, its current list](https://github.com/wekan/wekan/commit/d7ae93bb27a1372f3c84f78e3727311c93e7fa8d)
 - [Normal users may view subtasks](https://github.com/wekan/wekan/commit/22d98fec38dd16b4cc8ad0fdca8c2973e9779e08)
 - [Subtasks use the swimlane whose title matches the parent's](https://github.com/wekan/wekan/commit/89fe030fa35ea24195ac366aaf3a1c917b305249)
