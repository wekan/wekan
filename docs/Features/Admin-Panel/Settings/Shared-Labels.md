# Shared labels

## What it is

Labels used to belong to one board each. **Shared labels** (\#2761, \#4698) are
kept in catalogs that boards use beside their own labels, so the same label -
`Urgent`, `Customer`, `Bug` - has one name and one colour on every board that
uses it:

| Catalog | Where it can be used |
| --- | --- |
| **Every board** | on every board of this WeKan |
| **An organization** | on the boards that organization is assigned to |
| **A team** | on the boards that team is assigned to |

## Read more

- [Tag (metadata)](https://en.wikipedia.org/wiki/Tag_(metadata)) and
  [Controlled vocabulary](https://en.wikipedia.org/wiki/Controlled_vocabulary)
  on Wikipedia - a shared label is a tag from an agreed list.
- [Organizations](../People/Organizations.md) and [Teams](../People/Teams.md) -
  the groups a catalog can belong to.

## How to use it

**Keep the catalogs (site admin)**

1. Open **Admin Panel → Settings → Shared labels** (`/admin/settings/labels`).
2. Each row has the label's name, colour and catalog, and saves on its own:
   change it and press its **Save**, or press **Delete**.
3. The last row adds a label: a name, a colour, the catalog (**Every board**,
   **Boards of an organization** or **Boards of a team**, and then which
   organization or team), and **Add shared label**.

The colour is picked with the same picker as a board label's - the palette
swatches, at the size they have on an opened card, or any custom colour from
the colour wheel.

**Use one on a board**

1. Open a card's labels.
2. Below the board's own labels, under **Shared labels**, are the shared ones
   this board may use and does not have yet.
3. Click one: it is put on the card. From then on it is one of the board's
   labels, with a share icon instead of the edit pencil, so filters, rules,
   exports and the minicard treat it like any other label.

What happens afterwards:

- **Renaming or recolouring** a shared label in the Admin Panel changes it on
  every board that uses it.
- **Deleting** a shared label keeps it on those boards, as their own label.
- **Who sees a catalog:** a user is offered the "every board" catalog and the
  catalogs of their own organizations and teams. Another organization's label
  names are never sent to them.
- **Who may use one:** anybody who may edit the board.

## How the numbers are calculated

- A name is trimmed and may be at most **100** characters (`NAME_MAX` in
  [models/lib/sharedLabels.js](../../../../models/lib/sharedLabels.js)).
- A board's copy of a shared label gets a new 6-character label id.
- An organization or team catalog is offered only while that organization or
  team is active on the board (`isActive` is not `false`).

## How it works in WeKan

- **Rules** (pure): [models/lib/sharedLabels.js](../../../../models/lib/sharedLabels.js) -
  `availableOn()` (may this board use it), `offeredTo()` (the ones the board
  does not have yet), `boardCopyOf()` (the board label, with `sharedLabelId`)
  and `cleanSharedLabel()` (what may be saved: scope `instance`, `org` or
  `team`, a scope id for the last two, an allowed colour).
- **Server**: [server/sharedLabels.js](../../../../server/sharedLabels.js) -
  the catalog collection; the `sharedLabels` publication (everything to a site
  admin, otherwise the instance catalog and the user's own organizations' and
  teams'); `sharedLabels.save` and `sharedLabels.remove` (site admin only;
  saving updates every board copy, removing drops only the `sharedLabelId` so
  the copies stay as the boards' own labels); and `boards.useSharedLabel`
  (a board member with write access, for a label available on that board; the
  copy is added once).
- **Card popup**: [client/components/cards/labels.jade](../../../../client/components/cards/labels.jade)
  and `labels.js`.
- **Admin Panel**: [client/components/settings/sharedLabelsSettings.jade](../../../../client/components/settings/sharedLabelsSettings.jade)
  and `sharedLabelsSettings.js`.
- **Tests**: [tests/sharedLabels.test.cjs](../../../../tests/sharedLabels.test.cjs)
  and the runtime suite
  [server/lib/tests/sharedLabels.tests.js](../../../../server/lib/tests/sharedLabels.tests.js).

## Commits

 - [The board labels' colour picker, at the size it has on a card](https://github.com/wekan/wekan/commit/8c3e80240ac3c9c7f8bdf5eb5b8903d19eefe7d1)
 - [Shared labels for every board, an organization's or a team's (#2761, #4698)](https://github.com/wekan/wekan/commit/7595727917d436ea71969d6d74d166b42b38ed4e)
