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

