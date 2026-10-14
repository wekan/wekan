# Shared labels

Labels used to belong to one board each. **Shared labels** (#2761, #4698) are
kept in catalogs that boards use beside their own labels:

| Catalog | Where it can be used |
| --- | --- |
| **Every board** | on every board of this WeKan |
| **An organization** | on the boards that organization is assigned to |
| **A team** | on the boards that team is assigned to |

A site admin keeps the catalogs in **Admin Panel → Settings → Labels**
(`/admin/settings/labels`). Each row has the label's name, colour and catalog,
and saves on its own; the last row adds a label.

**On a board:** open a card's labels. Below the board's own labels, under
**Shared labels**, are the shared ones this board may use and does not have
yet. Clicking one puts it on the card. From then on it is one of the board's
labels, with a share icon instead of the edit pencil, so filters, rules,
exports and the minicard treat it like any other label.

- **Renaming or recolouring** a shared label in the Admin Panel changes it on
  every board that uses it.
- **Deleting** a shared label keeps it on those boards, as their own label.
- **Who sees a catalog:** a user is offered the "every board" catalog and the
  catalogs of their own organizations and teams. Another organization's label
  names are never sent to them.
- **Who may use one:** anybody who may edit the board.

Code: `models/lib/sharedLabels.js` (the rules), `server/sharedLabels.js`
(catalog, publication, methods), `client/components/cards/labels.*` (the card
popup), `client/components/settings/sharedLabelsSettings.*` (the Admin Panel).
Tests: `tests/sharedLabels.test.cjs` and the runtime suite
`server/lib/tests/sharedLabels.tests.js`.
