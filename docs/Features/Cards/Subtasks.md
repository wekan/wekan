## Fix: If you are unable to create Subtasks

This can happen on old boards: You have Subtasks board missing.

1) Create new board similar to your original board, but with `^` at beginning and end of your boardname. For example, if your boardname is `MyProject`, create new board with name `^MyProject^`. At keyboard that character is `Shift-^-Space`.

<img src="https://wekan.fi/subtasks/subtask-workaround-part1.png" width="30%" alt="Subtask workaround part 1" />

2) Set your `MyProject` board to have subtask board `^MyProject^`

<img src="https://wekan.fi/subtasks/subtask-workaround-part2.png" width="30%" alt="Subtask workaround part 2" />

3) Now you are able to create Subtasks to your board `MyProject`.

## Subtask status

In the card's **Subtasks** section, each subtask now shows its current **status** — the
list it currently resides in (for example *To Do*, *In Progress*, *Done*) — read-only next
to the subtask title. When a subtask lives on a different board than the parent card, the
list name is prefixed with that board's title.

## Ticking a subtask done

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

## Subtask fixes (upcoming release)

Several long-standing subtask bugs are fixed in the upcoming release:

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



To focus a board on one project's direct subtasks, open its parent card and
choose **Card Actions → Filter: Subtasks**. Adjust or clear the selection under
**Filter → Parent card**. See [Board filters](../Filter/README.md#subtasks-by-parent).
