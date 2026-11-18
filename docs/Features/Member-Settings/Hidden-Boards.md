# Member Settings / Hidden boards

Open the top-right username menu, then **Hidden boards**
([#4265](https://github.com/wekan/wekan/issues/4265)). Every signed-in member
sees this entry.

## How a board becomes hidden

Some boards are reached not only as a board member but also through one of your
teams, organizations or your e-mail domain. Leaving such a board with **Leave
Board** cannot take it out of All Boards by removing your member entry alone,
because the team, organization or domain would still show it. WeKan therefore
**hides** it for you: the board id goes into your own hidden list
(`profile.hiddenBoards`, at most 1000 boards). Your team or organization
membership is not changed.

A hidden board is left out of All Boards and out of
[Activity on all my boards](Activity-Feed.md).

## The popup

- One row per hidden board, with its title (or its id, when the board is not
  available in this browser).
- **Restore** beside each row puts the board back in All Boards. It only
  removes the board from your own hidden list; whether you may open the board
  is still decided by the board itself.
- *No hidden boards.* when the list is empty.

For developers: leaving is `quitBoard`, restoring is `restoreHiddenBoard`
(`server/models/boards.js`); the decision is `planQuitBoard()`,
`reachesBoardOtherwise()` and `hiddenBoardsAfter()` in
`models/lib/boardInvites.js`.

## Related

- [All Boards](../All-Boards/README.md)
- [Admin Panel / People / Teams](../Admin-Panel/People/Teams.md)
- [Admin Panel / People / Organizations](../Admin-Panel/People/Organizations.md)
