# Card Settings on the opened card

The opened card has a **Card Settings** button under its cover (it used to be
**+ Add**). Clicking it does not open a popup: the button, and everything
below it on the card, is **replaced** by Card Settings itself, right on the
card. The **X** at the end of its title puts the card back.

**Board Settings / Card is the same Card Settings**, drawn by the same
templates, in a popup: Show, then the same sections as checklists with the
same rows and hamburgers. Only two things differ, because there is no card:
the popup's own header is the title and the close button, and a row's
hamburger has no **On this card**.

## Top to bottom

```
Card Settings                                         [X]
Show  ( ) Show on Minicard   (•) Show on Card

▾ ⠿ Card                                    7/11     [≡]
      [x] Card number
      [ ] Collapse
      ...
▾ ⠿ Date                                     2/8     [≡]
      [x] Due                                         [≡]
      [ ] Start                                       [≡]
      ...
▸ ⠿ Time                                     1/3     [≡]
...
```

1. **Card Settings** - the title, with the **X** (close) at the right end of
   the title's line (the left end in a right-to-left language).
2. **Show** and two radio buttons, **Show on Minicard** and **Show on Card**.
   They choose which side the checkboxes below are: what the board's
   minicards show, or what its opened cards show. Show on Card is chosen when
   Card Settings opens.
3. The **sections** - Card, Date, Time, Members, Labels, Description,
   Checklists, Subtasks, Attachments, Custom Fields, Voting, Planning Poker,
   Scrum settings and Comments - drawn like the card's **checklists**:
   - the section is the **checklist's title**, with how many of its rows are
     ticked (`2/8`) and a **hamburger** menu;
   - its rows are the **checklist items**: a **checkbox**, the row's name and,
     when it has any, its own **hamburger**.

A section with no row on the chosen side is left out, except Card, whose
hamburger holds what is not a field.

## The checkbox

An item's checkbox says whether that field is **visible on the chosen side**,
for every card of the board: with **Show on Card** it is the board's Show on
Card, with **Show on Minicard** the board's Show on Minicard. It is the same
setting Board Settings / Card shows, so the two always agree. It is a board
admin's: for anybody else it is shown disabled, except their own rows (Labels
text, List title).

## Hamburgers

| Hamburger | Holds |
| --- | --- |
| A row's | **On this card** - whether THIS card shows the field ([Card fields](Card-Fields.md)); **Show empty** - whether every card shows it empty ([#6806](https://github.com/wekan/wekan/issues/6806)), while Show empty fields is off; Labels text's way back to the board's default. A row with none of these has no hamburger. |
| A section's | **Select all** / **Select none** of the chosen side, of On this card and of Show empty, for that section's rows; the section's card actions (Filter: Subtasks, Edit voting, Card kind, Edit custom fields, ... - a card's own only on a card, a board's also in Board Settings); and for **Card**: Show empty fields, Ask for a reason when moving cards, and the Draggable table. |

On this card is for whoever may change the card; Show empty and the selects of
the board's columns are a board admin's.

## Drag and drop, collapse

What a section or a row is dragged by follows the member's **drag handles**
setting, as checklists do:

| Drag handles | Dragged by | The rest of the line |
| --- | --- | --- |
| On | the handle only | scrolls the page, as a touch there means to |
| Off | the icon and name (a section: its title) | - |

- A **section** is dragged above or below another, as a checklist is. The
  order is the board's (`cardSettingsSectionOrder`), so every member sees the
  sections in it; a section added to WeKan later appears in its default place.
- A **row** is dragged within its section, as a checklist item is. That moves
  the field on the chosen side: the card's order with Show on Card, the
  minicard's with Show on Minicard.
- A row **cannot move to another section**: the sections are unrelated kinds
  of fields. Dropped on another section, it goes back where it was, and
  nothing is saved.
- The **Up** and **Down** keys on a focused section title or row name move it
  one step.
- Only a board admin drags.
- The caret before a section's title **collapses** and expands it, as a
  checklist's caret does. Collapsed sections are the user's own, kept per
  board.

## How it works

| File | What it is |
| --- | --- |
| `client/components/cards/cardDetails.jade` | The Card Settings button; `if cardSettingsOpen` draws `+cardSettingsInline` in place of the button and everything below it |
| `client/components/cards/cardAddFields.js` | Which card it is open on (`isCardSettingsOpen`, `closeCardSettings`), closed when the card closes |
| `client/components/sidebar/sidebar.jade` | `cardSettingsInline`, `cardSettingsInlineSection`, `cardSettingsSectionPopup`, `cardSettingsItemPopup`; `boardCardSettingsPopup` is `+cardSettingsInline(inPopup=true)` |
| `client/components/sidebar/sidebar.js` | The rows (`sectionRowsOf`), the handlers (`cardSettingsEvents`), Select all (`selectCardSettingsColumn`), the drags (`reorderOnDrop`, `ownListOnly` for a row) |
| `client/components/cards/cardAddFields.css` | The checklist look |
| `models/lib/cardSettingsSections.js` | The sections, and their order: `sectionOrder`, `orderedSections`, `sectionOrderAfterDrop` |
| `models/boards.js` | `cardSettingsSectionOrder`, `setCardSettingsSectionOrder` |
| `tests/cardSettingsOnCard.test.cjs` | The order rules, the layout, the shared handlers, the translations |
| `tests/playwright/specs/card-add-fields.e2e.js` | The button, the replaced card, the checkbox, the hamburgers, the drag and collapse |

The card and Board Settings / Card draw the same templates with the same
handlers, not a copy: a checkbox does the same thing wherever it is drawn, and
a row added to Card Settings is in both.
