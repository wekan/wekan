# Column sets

[#211](https://github.com/wekan/wekan/issues/211). The same cards, organized
in several ways at once. A board's lists are one way to put its cards in
columns; column sets add more - by completion, priority, milestone, size,
whatever the team thinks in - without moving a card out of its list.

Board View → **Column sets**:

- A board admin makes a set - **New column set**, say "Priority" - and adds its
  columns, each with a colour: "High" red, "Normal" yellow, "Low" green.
- Pick a set from the list at the top. Every card of the board is in one of
  its columns, or in **Not placed** until somebody puts it in one.
- **Drag a card** to another column. That changes only where it is in this
  set; its list, swimlane, labels and members stay as they are.
- Each card also shows, as small coloured labels, which column it is in for
  the other sets - looking at "Completion", you still see each card's
  priority.
- Click a card's title to open it.

Moving cards needs the same right as editing a card; making and deleting sets
and columns is for board admins. Deleting a column puts its cards back in Not
placed for that set.
