# Cards

## What it is

A **card** is a single task or item. Cards live in lists and swimlanes and can
hold a lot of detail. A card's small view on the board is its **minicard**;
clicking it opens the card's details.

What a card can contain:

- Description
- Customizable, colored labels
- Checklists (with checklist templates)
- Attachments: images and files
- Comments
- Members and assignees
- Due/start/end/received dates
- Stickers ([Stickers](Stickers/Stickers.md))
- Locations ([Card Locations](Locations/Locations.md))
- A Trello-style "complete" checkbox (see below)
- Custom fields, subtasks, votes, and more

![Wekan card screenshot](../screenshot.png)

You can archive and restore a card, or delete it.

## Read more

- [Kanban board](https://en.wikipedia.org/wiki/Kanban_board) and
  [Kanban (development)](https://en.wikipedia.org/wiki/Kanban_(development))
  on Wikipedia - cards on a board of lists.
- [Trello](https://en.wikipedia.org/wiki/Trello) - where the complete
  checkbox and card aging come from.
- [Markdown](https://en.wikipedia.org/wiki/Markdown) and
  [Drag and drop](https://en.wikipedia.org/wiki/Drag_and_drop).
- In WeKan: [Cards and minicards](README.md), [Card fields](Card-Fields.md),
  [Card Settings](Card-Settings.md) and the links under Related below.

## How to use it

### Complete checkbox

Cards have a Trello-style **"complete"** checkbox that marks a card complete or
incomplete, independent of its due date. It is shown as an animated green checkbox to
the left of the card title, both on the minicard and in the opened card, with "Mark
as complete" / "Mark as incomplete" tooltips. The checked colour follows the board
theme (or green when no theme is set), and the minicard and opened-card checkboxes
stay in sync. Subtask checkboxes and the card-detail custom-field checkbox use the
same animated checkbox style as checklist items.

1. It is off by default. Turn it on in Board Settings / **Card**, the **Date**
   section's **Mark as complete** row: *Show on Card* for the opened card,
   *Show on Minicard* for the minicard - each side separately.
2. Click the checkbox left of the title to mark the card complete; click it
   again to mark it incomplete.

> **Tip:** Normally you archive a card so you can restore it later. To delete many
> cards faster, drag them to a new list and delete that list. Deleting cannot be
> undone — the extra clicks are by design.

The complete state can also be set over the REST API via the card edit endpoint
(`PUT /api/boards/:boardId/lists/:listId/cards/:cardId`) with `{ "dueComplete": true }`:

```bash
python3 api.py setcardcomplete BOARDID LISTID CARDID true
```

### Card aging

When **card aging** is enabled for a board, cards that have not been touched
for a while are progressively **faded** on the board, based on each card's
last activity date (Trello-style card aging). Hovering a faded card restores
it to full opacity.

1. Open the board's cog menu, **Board Settings**, then **All Boards
   Settings**.
2. Tick **Card aging (fade old cards)**.
3. Three number inputs appear under *Fade after days (3 tiers):* - the
   **day thresholds are board-configurable**, defaulting to **7 / 14 / 28**
   days. Change them as needed; each is saved when it changes.

Card aging and its thresholds can also be set over the REST API via the board
card-settings endpoint (`PUT /api/boards/:boardId/cardSettings`):

```bash
python3 api.py setcardsetting BOARDID cardAging true
python3 api.py setcardsetting BOARDID cardAgingDays1 5
python3 api.py setcardsetting BOARDID cardAgingDays2 10
python3 api.py setcardsetting BOARDID cardAgingDays3 20
```

### Markdown and dates

- [Markdown in card description and comments](https://github.com/wekan/wekan/issues/1038)
- [International date formatting for due date according to language](https://github.com/wekan/wekan/issues/838)

### Drag and drop / paste images

You can drag and drop images onto a card, or paste images with **Ctrl-V**.

#### 1) First attachment: open the card's 3-lines "hamburger" menu / Edit Attachments

![Add attachment step 1](../Login-Page/screenshot-drag1.png)

#### 2) Select: Clipboard or drag and drop

![Add attachment step 2](../General/DragDrop/screenshot-drag4.png)

#### 3) Drag and drop the image, or press Ctrl-V

![Add attachment step 3](../General/DragDrop/screenshot-drag2.png)

#### 4) Add more images from the "Add Attachment" button near the first attachment

![Add attachment step 4](../General/DragDrop/screenshot-drag3.png)

### Multi-selection

Use multi-selection to checkmark several cards, then drag and drop all of the
selected cards to another list at once.

![Wekan multi-selection screenshot](../General/DragDrop/screenshot-multi-selection.png)

### Moving a card to another board

A card moved to another board - with the card's hamburger menu / Move card, by
drag and drop, by a rule, by moving its list or swimlane, or with the REST API -
takes everything that belongs to it along: comments and their reactions, the text
note, checklists and checklist items, and attachments. They are shown on the
board the card is on now, and no longer on the board it left.

Before [#6793](https://github.com/wekan/wekan/issues/6793), comments, reactions
and text notes stayed behind: they disappeared when the card was moved and came
back when it was moved back. The startup schema upgrade (step
`card-children-boardid`) moves rows that were left behind to their card's current
board, once per new WeKan version.

The card menu's own entries are described in
[Card menu / Move Card](Move-Card.md) and
[Card menu / Copy Card](Copy-Card.md).

### Filtered views

Filter the board by member, label, due date, and more to focus on a subset of cards.

![Wekan filter screenshot](../Board-Sidebar/Filter/screenshot-filter.png)

### Create cards from multiple lines

Paste or type multiple lines into the new-card title. The **Add** selector
offers one card with the full multiline title or one card per nonempty line.
Choose the desired count and click **Add**. Separate cards keep the pasted
order, and each receives the selected members, labels and other card options.
The same choice is available when creating lists and swimlanes.

### Unsaved new-card titles

Closing an Add Card composer preserves its unsaved title for the same user,
list, swimlane and top/bottom position. Reopening that composer restores the
text. A successful creation clears the saved title; a partially failed batch
retains the remaining titles. Drafts use the existing private draft storage,
so another board member cannot read or overwrite them. This saves title text,
not the optional labels, members or More options fields.

## How the numbers are calculated

- **Card aging** ([client/components/cards/minicard.js](../../../client/components/cards/minicard.js)
  `agingClass`): the idle days are `(now - last activity) / 1 day`, where the
  last activity is the card's `dateLastActivity`, else `modifiedAt`, else
  `createdAt`. At or past the third threshold (default 28) the minicard is
  faded to 40 % opacity, at or past the second (default 14) to 60 %, at or
  past the first (default 7) to 85 % ([client/components/cards/minicard.css](../../../client/components/cards/minicard.css)
  `.minicard-aging-1` ... `-3`). The inputs accept whole days of 1 or more.
- **Create cards from multiple lines**: one card per nonempty line, in the
  pasted order.
- The complete checkbox has no numbers: it is one Boolean, `dueComplete`.

## How it works in WeKan

- **Complete checkbox**: the card's `dueComplete` field
  ([models/cards.js](../../../models/cards.js) `setDueComplete`), toggled by
  `js-toggle-card-complete` in
  [client/components/cards/minicard.jade](../../../client/components/cards/minicard.jade)
  and `js-toggle-due-complete` in
  [client/components/cards/cardDetails.jade](../../../client/components/cards/cardDetails.jade).
  Whether it is drawn is the board's `allowsDueComplete` (opened card) and
  `allowsDueCompleteOnMinicard` (minicard), both `false` by default
  ([models/boards.js](../../../models/boards.js)).
- **Card aging**: the board's `cardAging`, `cardAgingDays1`,
  `cardAgingDays2` and `cardAgingDays3` ([models/boards.js](../../../models/boards.js)
  `setCardAging`, `setCardAgingDays`), edited in `boardInfoOnMyBoardsPopup`
  ([client/components/sidebar/sidebar.jade](../../../client/components/sidebar/sidebar.jade),
  [sidebar.js](../../../client/components/sidebar/sidebar.js)) and over the
  REST API's `cardSettings` endpoints
  ([server/models/boards.js](../../../server/models/boards.js)).
- **Moving to another board**: the card's comments, reactions, text notes,
  checklists, checklist items and attachments carry their board id; the move
  re-points them, and the schema upgrade step `card-children-boardid` in
  [server/lib/schemaUpgradeSteps.js](../../../server/lib/schemaUpgradeSteps.js)
  repairs rows left behind.
- **Unsaved new-card titles**: the add-card composer in
  [client/components/lists/listBody.js](../../../client/components/lists/listBody.js)
  keeps the draft in the user's private draft storage.
- Tests: [tests/cardChildrenFollowMove.test.cjs](../../../tests/cardChildrenFollowMove.test.cjs),
  [tests/multilineTitles.test.cjs](../../../tests/multilineTitles.test.cjs),
  [tests/newCardTitleDraft.test.cjs](../../../tests/newCardTitleDraft.test.cjs),
  [tests/restApiNewFeatureRoutes.test.cjs](../../../tests/restApiNewFeatureRoutes.test.cjs)
  (card aging over the REST API), and the browser specs
  [tests/playwright/specs/22-card-features.e2e.js](../../../tests/playwright/specs/22-card-features.e2e.js),
  [multiline-titles.e2e.js](../../../tests/playwright/specs/multiline-titles.e2e.js),
  [new-card-title-draft.e2e.js](../../../tests/playwright/specs/new-card-title-draft.e2e.js)
  and [issue-6793-comments-follow-card-move.e2e.js](../../../tests/playwright/specs/issue-6793-comments-follow-card-move.e2e.js).

## Related

- [Linked Cards](Linked-Cards.md)
- [Card Cover Image](Cover/Cover.md)
- [Stickers](Stickers/Stickers.md)
- [Card Locations](Locations/Locations.md)
- [Attachments and File Storage](Attachments/Attachments.md)
- [Custom Fields](CustomFields/CustomFields.md)
- [Subtasks](Subtasks.md)
- [Templates](../All-Boards/Templates.md)
- [Markdown](../General/Editor/Markdown/Markdown.md), [Emoji](../General/Editor/Emoji.md), [Multiline](../General/Editor/Multiline.md), [Numbered text](../General/Editor/Numbered-text.md), [LaTeX](../General/Editor/LaTeX.md)
- [Due Date](Dates/Due-Date.md), [Time Tracking](Time-Tracking.md)
- [Drag and Drop on Mobile and Desktop](../General/DragDrop/Drag-Drop.md)

## Commits

 - [Comments, reactions, text notes and attachments follow a card moved to another board](https://github.com/wekan/wekan/commit/696b5b073fa73c79002fd6804d6ff5cddeef40e4)
 - [Private new-card title drafts kept across composer closes](https://github.com/wekan/wekan/commit/c7e19a3247092d519ade2a53ef7f1f2925de9409)
 - [Mixed multi-selection moves and collapsed drop targets](https://github.com/wekan/wekan/commit/b0c8acc987ff84e197215cf079085887a6829f1c)
 - [Always show the one-or-many creation choice](https://github.com/wekan/wekan/commit/cdc0722b15cd954d0eaccd235fe01f6b42537c74)
 - [Create cards, lists and swimlanes from multiline titles](https://github.com/wekan/wekan/commit/552ac0855aa64d8b9a6a9292b6da286bb08c83bb)
 - [Mark as complete gets its own Show on Minicard checkbox, off by default](https://github.com/wekan/wekan/commit/d6a8f4386671630468fa61a8e98c4435c2c97803)
 - [The Mark as complete toggle is configurable, hidden by default](https://github.com/wekan/wekan/commit/67d9de32db8829ae11ad654fee621162368eed36)
 - [Card aging with board-configurable thresholds, and the complete state over the REST API](https://github.com/wekan/wekan/commit/f0bce67a3bf301c21ded3eb97e84a3be0010290f)
 - [Trello-style complete checkbox on the minicard and the opened card](https://github.com/wekan/wekan/commit/899617bd4d83905df05fd8aab1d26630e676fee5)
