# Stickers

## What it is

Stickers are small icons you can add to cards, similar to Trello's stickers.
They mark a card at a glance - a thumbs up, a bug, a deadline clock, a
trophy - on the minicard and in the opened card, without a label or a colour.
They are added and removed directly in WeKan, and every sticker a Trello
import can produce can also be added by hand.

## Read more

- Wikipedia: [Sticker](https://en.wikipedia.org/wiki/Sticker),
  [Font Awesome](https://en.wikipedia.org/wiki/Font_Awesome) and
  [Trello](https://en.wikipedia.org/wiki/Trello).
- [Font Awesome 4 icons](https://fontawesome.com/v4/icons/), the icon names
  the stickers use.
- In WeKan: [Cards](../Cards.md),
  [Migrating from Trello](../../Board-Sidebar/Board-Settings/Import-Export/Trello/trello/Migrating-from-Trello.md)
  and [Board Settings / Card](../../Board-Sidebar/Board-Settings/Card.md).

## How to use it

### Adding and removing stickers

- Open a card and use the Stickers section to add or remove stickers directly in
  WeKan (previously stickers only arrived via Trello import).
- Stickers are chosen from a set of Font Awesome icons.
- The picker includes every highlighted sticker that a Trello import can produce, so
  any imported sticker can also be added by hand:
  - **mascot** stickers are shown with an underlined icon (Trello's "taco" pack),
  - **computer** stickers are shown with a ring around the icon (Trello's "pete"
    pack), for example "pete-ghost" imports as "computer ghost".
- Stickers appear both on the minicard and in the opened card detail.

Step by step:

1. Open the card. In the **Stickers** section, click **+** (**Add sticker**).
2. Click a sticker in the picker to add it; a check mark shows it is on the
   card. Click it again to take it off.
3. To remove one sticker, click the × beside it in the **Stickers** section
   (**Remove sticker**).

Adding and removing needs the right to change the card; a Worker does not get
the **+**.

### Showing it

Board sidebar (hamburger menu) → **Board Settings** → **Card**, row
**Stickers**: *Show on Card* (`allowsStickers`) and *Show on Minicard*
(`allowsStickersOnMinicard`), both on by default.

### REST API

Stickers are set through the card edit endpoint
(`PUT /api/boards/:boardId/lists/:listId/cards/:cardId`) with a `stickers` array
of `{ icon, highlight }`:

```bash
python3 api.py setcardstickers BOARDID LISTID CARDID '[{"icon":"taco-cool"}]'
```

The array replaces the card's stickers and is stored as given. `icon` is drawn
as the Font Awesome class `fa-<icon>`, so it should be a Font Awesome 4 name
such as `thumbs-up` or `rocket`; a name that is no Font Awesome icon, such as
a raw Trello sticker name, shows no icon. `highlight` is `underline` (mascot)
or `round` (computer), or left out.

## How the numbers are calculated

The picker has 136 stickers ([models/metadata/stickers.js](../../../../models/metadata/stickers.js),
`STICKER_PICKER`):

- 34 plain icons (`STICKER_ICONS`);
- 51 mascot stickers and 51 computer stickers: each icon the Trello mapping
  can produce (its exact map, its keyword map and the default
  `sticky-note-o`, without repeats) once underlined and once ringed.

A sticker on a card is identified by its icon and highlight together, so the
same icon can be on a card both plain and highlighted. Each added sticker gets
`position` = the number of stickers the card had before it.

## How it works in WeKan

- The card's `stickers` array of `{ icon, name?, highlight?, position }` in
  [models/cards.js](../../../../models/cards.js), with `getStickers`,
  `hasSticker`, `addSticker`, `removeSticker`, `removeStickerAt` and
  `toggleSticker`; all write the real card of a linked card.
- [models/metadata/stickers.js](../../../../models/metadata/stickers.js) - the
  icon set, the Trello mapping (`trelloStickerToFa`, `trelloStickerHighlight`,
  `TRELLO_STICKER_PACK_NAME`) and `STICKER_PICKER`, shared by the Trello
  importer and the picker.
- The picker is `cardStickersPopup` in
  [client/components/cards/cardStickers.jade](../../../../client/components/cards/cardStickers.jade)
  and [cardStickers.js](../../../../client/components/cards/cardStickers.js);
  the section is in
  [cardDetails.jade](../../../../client/components/cards/cardDetails.jade) and
  the minicard badge in
  [minicard.jade](../../../../client/components/cards/minicard.jade). The
  underline and ring are CSS (`sticker-underline`, `sticker-round`) in
  [cardDetails.css](../../../../client/components/cards/cardDetails.css).
- REST: the `stickers` branch of the card edit endpoint in
  [server/models/cards.js](../../../../server/models/cards.js); the client
  command is `setcardstickers` in [api.py](../../../../api.py).
- Tests: [tests/stickers.test.js](../../../../tests/stickers.test.js),
  [tests/stickers.packs.test.js](../../../../tests/stickers.packs.test.js) and
  [tests/cards.stickers.test.js](../../../../tests/cards.stickers.test.js).

## Related

- [Cards](../Cards.md)
- [Migrating from Trello](../../Board-Sidebar/Board-Settings/Import-Export/Trello/trello/Migrating-from-Trello.md)

## Commits

 - [WeKan JSON import keeps the stickers](https://github.com/wekan/wekan/commit/c640c5c376526f6550873b757fa6b68511c63d42)
 - [Stickers can be shown on the minicard and the card from Board Settings / Card](https://github.com/wekan/wekan/commit/79b44675464d829b8b9ac05d01ec0aad2a8423b0)
 - [Stickers have their own Board Settings / Card toggle](https://github.com/wekan/wekan/commit/970213010013529150101d3fd6c59f33eab542d4)
 - [Stickers set through the REST API](https://github.com/wekan/wekan/commit/f0bce67a3bf301c21ded3eb97e84a3be0010290f)
 - [Add and remove stickers in WeKan, with the mascot and computer packs of a Trello import](https://github.com/wekan/wekan/commit/899617bd4d83905df05fd8aab1d26630e676fee5)
