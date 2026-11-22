# Card menu / Copy Card

## What it is

Card menu (☰ in the opened card's header, **Card Actions**) → **Copy Card**
makes a copy of the card on this board or another one (`copyCardPopup` in
`client/components/cards/cardDetails.jade`). The copy is a new, independent
card: it gets its own number on the destination board and its own comments,
checklists, attachments and subtasks, copied from the original.

## Read more

- [Cut, copy, and paste](https://en.wikipedia.org/wiki/Cut,_copy,_and_paste)
  and [Kanban board](https://en.wikipedia.org/wiki/Kanban_board) on Wikipedia.
- In WeKan: [Move Card](Move-Card.md) (the same destination picker),
  [Copy Template to Many Cards](Copy-Template-To-Many-Cards.md),
  [Link to board](Link-To-Board.md), [Save as Template](../All-Boards/Templates.md),
  [List permissions](../Lists/List-Permissions.md).

## How to use it

1. Open the card and click ☰ in its header (**Card Actions**). Under **Move and
   copy**, click **Copy Card** - or press **Shift+C** on the opened card, or on
   the selected or hovered minicard.
2. **Title**: the copy's title, prefilled with the card's. An empty title copies
   nothing.
3. **Boards**, **Swimlanes**, **Lists**: choose where the copy goes.
4. **Cards** and **Above selected card** / **Below selected card**: choose the
   card the copy is put beside. **Above selected card** is chosen when the popup
   opens.
5. Click **Done**. If the server refuses, the reason is shown in the popup and
   nothing is copied.

| Field | What it does |
| --- | --- |
| **Title** | the copy's title, prefilled with the card's; an empty title copies nothing |
| **Boards**, **Swimlanes**, **Lists** | the destination, as in [Move Card](Move-Card.md) |
| **Cards**, **Above selected card** / **Below selected card** | where the copy goes; when the destination list has no cards, it goes to the bottom |
| **Done** | copies |

The destination is remembered per board, as for Move Card. If the board is
filtered, the copy is added to the filter's exceptions so it does not vanish
at once ([#80](https://github.com/wekan/wekan/issues/80)).

### Who sees it

A user to whom the menu offers its moving and copying entries (helper
`cardMenuWrites`: somebody who may change the card, or a member who is not
**Read only** or **Read assigned only**), and who is not a **Worker**.

## How the numbers are calculated

- **Place in the list**: the server first puts the copy at the top of the
  destination list and swimlane (`sort` one below the lowest sort number there,
  `copyCard` with `insertAtTop`). The client then moves it beside the chosen
  card: halfway between that card and its neighbour on the chosen side, or one
  past it at the end of the list (`models/lib/relativePosition.js`). Only when two
  cards share the same sort number are the tied ones spread out evenly. With no
  card in the list, it gets one more than the highest sort number, or 0.
- **Card number**: the copy takes the destination board's next card number
  (`board.getNextCardNumber()`).
- The copy has no other numbers of its own; its spent time, dates and the
  other fields are copied as they are.

## How it works in WeKan

- **Client**: `Template.copyCardPopup` in
  [client/components/cards/cardDetails.js](../../../client/components/cards/cardDetails.js)
  calls the `copyCard` method, then moves the copy with `card.move()`. The popup
  uses the shared `cardDestinationPicker` template and the
  `BoardSwimlaneListCardDialog`
  ([client/lib/dialogWithBoardSwimlaneListCard.js](../../../client/lib/dialogWithBoardSwimlaneListCard.js));
  the remembered destination is `profile.moveAndCopyDialog` of the user.
- **Server checks**: the copy is made by the `copyCard` method
  ([server/models/cards.js](../../../server/models/cards.js)). It refuses when
  you are not signed in (recorded in Admin Panel → Problems as AuthBleed), not a
  member of the source board, an assigned-only member copying a card not
  assigned to you, without write access to the destination board, or when the
  destination list's [permission](../Lists/List-Permissions.md) refuses your
  role. Only `title` and `description` may be overridden
  ([models/lib/cardCopyOverrides.js](../../../models/lib/cardCopyOverrides.js));
  any other field in the request is refused and recorded.
- **What is copied** (`copy()` in [models/cards.js](../../../models/cards.js)):
  the card's fields, attachments (and the cover, pointed at the copied
  attachment), checklists, comments, and the subtasks the copier may copy, with
  their checklists. Links to external Sync sources are not copied, so the copy
  is independent work. Dependencies are kept only when their target card is on
  the destination board. On another board, labels are matched by name; a named
  label that is missing there is created when you are an admin of that board.
  Only values of custom fields that belong to the destination board are kept.
- **Tests**: [tests/authBleedCopyMethods.test.cjs](../../../tests/authBleedCopyMethods.test.cjs),
  [tests/cardCopyOverrides.test.cjs](../../../tests/cardCopyOverrides.test.cjs),
  [tests/cardCopyRuntimeCache.test.cjs](../../../tests/cardCopyRuntimeCache.test.cjs),
  [tests/moveCopyRemembersDestination6901.test.cjs](../../../tests/moveCopyRemembersDestination6901.test.cjs),
  [tests/destinationCards6917.test.cjs](../../../tests/destinationCards6917.test.cjs),
  and the Playwright specs `card-copy-boundary.e2e.js`,
  `card-copy-destination.e2e.js`, `move-copy-remembers-destination-6901.e2e.js`
  and `move-copy-keyboard-shortcut-6904.e2e.js`.

## Related

- [Copy Template to Many Cards](Copy-Template-To-Many-Cards.md)
- [Save as Template](../All-Boards/Templates.md)

## Commits

 - [Card menu grouped under headings, Copy Card under Move and copy](https://github.com/wekan/wekan/commit/0d8f8b8d96b868a6d75b803ef105e50aad450977)
 - [Server-side card copies ask the list's role exception](https://github.com/wekan/wekan/commit/ba3d94390ba724344a2d5cfe50e9dee3cc6f8d89)
 - [Card shortcuts open only their popup](https://github.com/wekan/wekan/commit/138f727ebbfc30d395fbcfa18ca244e58abe91d7)
 - [Destination picker lists the cards of a lazily loaded board](https://github.com/wekan/wekan/commit/e46d7a2376ebfa413cec15843d8b7fc374fe63e0)
 - [Shift+C opens Copy Card](https://github.com/wekan/wekan/commit/8508c150159a160b13b45505065ff788171a777a)
 - [Remember the swimlane and list chosen last time, not only the board](https://github.com/wekan/wekan/commit/4b47ec81a72aab1ab8d04addb8fe41b7e0181841)
 - [A signed-out copy attempt is recorded in Admin Panel / Problems](https://github.com/wekan/wekan/commit/314c153c9be569a427d9ecde8f63cfef540181e3)
 - [Card actions menu in the maintainer's order](https://github.com/wekan/wekan/commit/65621f44cc03db9b2b98276ffd2c7bed8590b2fd)
 - [A copy carries only the custom field values of its new board](https://github.com/wekan/wekan/commit/63ebdb9072b678e104da20f47321c07d54cf999f)
 - [Copy only the subtasks the copier may copy](https://github.com/wekan/wekan/commit/5fad29a254356473aabfc0d85f64e38045bad64c)
 - [Assigned-only members copy only their own cards](https://github.com/wekan/wekan/commit/7788e0c4e694af45a53b5a80b213f6fc4670e103)
 - [Copy overrides restricted to title and description](https://github.com/wekan/wekan/commit/1e44a1ffc174b4e7070c4421e4a67e0cd45f9f3f)
 - [Admin-only custom fields enforced on copy](https://github.com/wekan/wekan/commit/89a65ee7ce765217b57f9c6be35422b9f3d9a3c4)
 - [Copied cards are independent of external Sync identities](https://github.com/wekan/wekan/commit/85b5f28bcd32715ad99c5434edc2da3affa0bd4b)
 - [The destination picker is one shared template](https://github.com/wekan/wekan/commit/53c3123de5dc82f9c010792989adf55cc15bffb6)
 - [Copying to a board with no labels no longer throws](https://github.com/wekan/wekan/commit/ac9efbf402a16bb97e0a12ccaf6d0663fdcc255f)
 - [Copied subtasks move to the destination board](https://github.com/wekan/wekan/commit/85841a1c4392fa9c9a8978359613eb86aa84c79f)
 - [Copied comments move to the destination board](https://github.com/wekan/wekan/commit/5212d25fc2df276f7c75db2999df5aa9fc251c4c)
 - [Copying a card copies its subtasks' checklists](https://github.com/wekan/wekan/commit/38471577534cfb558c41abe45f3c6cc064dbed50)
 - [Move and copy read the destination from the live selection, not the DOM](https://github.com/wekan/wekan/commit/7db02489202c560d227a476db24cd761c66a0a00)
 - [Copy Card copies attachments](https://github.com/wekan/wekan/commit/e37bf2b51dbf42bd04637151e4f9b654305ec6a1)
 - [Copy Card added](https://github.com/wekan/wekan/commit/a38b4c6a834ccf84c045de7d06f0058058056bdb)
