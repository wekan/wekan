# Stickers

Stickers are small icons you can add to cards, similar to Trello's stickers.

## Adding and removing stickers

- Open a card and use the Stickers section to add or remove stickers directly in
  WeKan (previously stickers only arrived via Trello import).
- Stickers are chosen from a set of Font Awesome icons.
- The picker includes every highlighted sticker that a Trello import can produce, so
  any imported sticker can also be added by hand:
  - **mascot** stickers are shown with an underlined icon (Trello's "taco" pack),
  - **computer** stickers are shown with a ring around the icon (Trello's "pete"
    pack), for example "pete-ghost" imports as "computer ghost".
- Stickers appear both on the minicard and in the opened card detail.

## REST API

Stickers are set through the card edit endpoint
(`PUT /api/boards/:boardId/lists/:listId/cards/:cardId`) with a `stickers` array
of `{ icon, highlight }`:

```bash
python3 api.py setcardstickers BOARDID LISTID CARDID '[{"icon":"taco-cool"}]'
```

## Related

- [Cards](../Cards.md)
- [Migrating from Trello](../../../ImportExport/trello/Migrating-from-Trello.md)
