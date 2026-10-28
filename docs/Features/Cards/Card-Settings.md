# Card Settings

**Card Settings is Board Settings / Card**: a popup opened from the board's
cog menu (**Board Settings → Card**). It decides what **every opened card**
and **every minicard** of the board shows, and in what order. The opened card
has no Card Settings of its own (until 2026-10-28 it had a **Card Settings**
button under its cover that drew the same thing on the card; it is gone, and
so is **On this card**).

An opened card shows **every field its board shows on cards**, empty or not:
an empty Due, an empty Members, an empty Custom Fields section are drawn,
ready to be filled in ([Card fields](Card-Fields.md)).

## Top to bottom

```
Card Settings                              [□] [X]   <- the popup's header
Show  ( ) Show on Minicard   (•) Show on Card

▾ ⠿ [x] Card                                7/11     [≡]
      [x] Card number
      [ ] Collapse
      ...
▾ ⠿ [x] Date                                 2/8
      [x] Due
      [ ] Start
      ...
▸ ⠿ [x] Time                                 1/3
▾ ⠿ [x] Custom Fields                        1/2
      [x] Priority                                    [≡]
      [ ] Estimate                                    [≡]
      [+]
    ⠿ [x] Voting
...
```

1. **Show** and two radio buttons, **Show on Minicard** and **Show on Card**.
   They choose which side the checkboxes below are: what the board's
   minicards show, or what its opened cards show. Show on Card is chosen when
   Card Settings opens.
2. The **sections** - Card, Date, Time, Members, Labels, Description,
   Checklists, Subtasks, Attachments, Custom Fields, Voting, Planning Poker,
   Scrum settings and Comments - drawn like the card's **checklists**:
   - the section is the **checklist's title**: its caret, its drag handle, a
     **checkbox** of its own, its name, how many of its rows are ticked
     (`2/8`) and - only when it has something in it - a **hamburger**;
   - its rows are the **checklist items**: a **checkbox**, the row's name and,
     when it has anything in it, its own **hamburger**.

A section with no row on the chosen side is left out, except Card, whose
hamburger holds what is not a field.

## The checkboxes

**A row's checkbox** says whether that field is **visible on the chosen
side**, for every card of the board: with **Show on Card** it is the board's
Show on Card, with **Show on Minicard** the board's Show on Minicard.

**A section's checkbox**, left of its title, says whether the **whole
section** is shown on the chosen side at all:

- Unticked on **Show on Card**, the section is missing from every opened card
  of the board, whatever its rows are ticked; unticked on **Show on
  Minicard**, from every minicard. The two sides are independent.
- The rows **keep their own ticks** while their section is hidden (drawn
  faded), so ticking the section back shows exactly what was shown before.
- The count `n/m` stays.

The board stores the hidden sections of each side, `cardSettingsHiddenOnCard`
and `cardSettingsHiddenOnMinicard` (lists of section ids), written by
`board.setCardSettingsSectionShown(side, sectionId, shown)`.

Every checkbox is a board admin's: for anybody else it is shown disabled,
except their own row (Labels text).

## A section with one row is one line

A section that has exactly **one row** on the chosen side - Subtasks, Voting,
Planning Poker - is drawn as **one line**: one checkbox, its name, and the
section's hamburger when it has one. No caret, no count, no item under it. It
still drags as a section.

Its checkbox reads **this field is shown on this side**: ticked when the
row's own flag is on and the section is not hidden. Clicking it sets the
row's own flag (through the row's own checkbox, kept in the line out of
sight); turning it on also shows the section again if it was hidden whole.

## Custom Fields

Custom Fields' items are the **board's custom fields** themselves, in their
order (`sort`, the order the card and the minicard draw them in):

| Show | An item's checkbox is the custom field's |
| --- | --- |
| Show on Minicard | **Show on minicard** (`showOnCard`, the legacy name of what the minicard reads) |
| Show on Card | **Add to all cards** (`alwaysOnCard`): the opened card draws the custom fields the CARD carries, and this puts the field on every card of the board |

Unticking Show on Card stops the field being added to cards; a card that
already carries it keeps it until it is taken off that card in its own Custom
Fields hamburger, because a card may carry a field it was given on its own.

- An item's **hamburger** opens the custom field's edit form, the board
  sidebar's own.
- Items are **dragged** within Custom Fields only - by the handle with drag
  handles on, by the icon and name with them off; Up and Down move one step.
  That writes each custom field's `sort`, so the card's and the minicard's
  order follow.
- Under the items, also when there are none, **+** creates a custom field
  (the board's Create Field form); the new one is the last item.
- The **section's checkbox** is the board's Custom Fields flag of the chosen
  side (`allowsCustomFields` / `allowsCustomFieldsOnMinicard`, the row that
  was its only item) and, as for a one-row section, ticking it also shows the
  section again if it was hidden whole. So there is no "Custom Fields >
  Custom Fields" line.

The +, the checkboxes and the hamburgers are a board admin's; anybody else
sees no + and disabled checkboxes.

## Hamburgers

A hamburger is drawn **only when it has something in it**.

| Hamburger | Holds |
| --- | --- |
| A row's | Labels text's way back to the board's default, while the user overrides it. Every other row has none. |
| Card's | **Ask for a reason when moving cards**, and the **Draggable** table. |
| Subtasks' | **Subtask settings**, for a board admin. |
| Any other section's | nothing - so no hamburger. |

What a card does with its own fields - Filter: Subtasks, Edit voting, Card
kind, Edit custom fields, Link fields - is in that card's own section
hamburgers on the opened card, not here.

Removed on 2026-10-28: **On this card** and **Show empty** (a row's
hamburger), **Show empty fields** (Card's), and **Select all / Select none**
(every section's). Empty fields are always shown, and a section has its own
checkbox.

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
| `client/components/sidebar/sidebar.jade` | `boardCardSettingsPopup` is `+cardSettingsInline`; `cardSettingsInlineSection`, `cardSettingsSectionPopup`, `cardSettingsItemPopup` |
| `client/components/sidebar/sidebar.js` | The sections (`inlineSectionsOf`, `single`, `customFieldItems`), the rows (`sectionRowsOf`), the handlers (`cardSettingsEvents`, `js-card-settings-section-shown`, `js-card-settings-single-toggle`, the custom field ones), the drags (`reorderOnDrop`, `ownListOnly`) |
| `client/components/cards/cardAddFields.css` | The checklist look |
| `models/lib/cardSettingsSections.js` | The sections, their order, and whether one is shown: `hiddenSectionsOf`, `sectionShown`, `hiddenSectionsAfter`, `rowKeysHiddenBySections`, `isSingleRowSection`, `singleLineChecked` |
| `models/lib/cardSettingsCustomFields.js` | Custom Fields' items: their order, their checkbox per side, their new `sort` after a drop |
| `models/lib/cardShownFields.js` | `boardForCard` / `boardForMinicard`: the board as its cards / minicards see it, the rows of hidden sections reading false |
| `client/components/cards/cardAddFields.js` | `cardBoardView`, `CARD_FIELD_TEMPLATES`: the opened card's templates read that view |
| `client/components/cards/minicard.js` | `MINICARD_FIELD_TEMPLATES` and its helpers read the minicard's view |
| `models/boards.js` | `cardSettingsSectionOrder`, `cardSettingsHiddenOnCard`, `cardSettingsHiddenOnMinicard`, `setCardSettingsSectionOrder`, `setCardSettingsSectionShown` |
| `tests/cardSettingsSectionShown.test.cjs`, `tests/cardSettingsCustomFields.test.cjs`, `tests/cardSettingsOnCard.test.cjs` | The rules, the layout, the handlers |
| `tests/playwright/specs/card-add-fields.e2e.js` | The popup, the checkboxes, the hamburgers, Custom Fields, the drag and collapse |

Card Settings itself reads the board as it is - its checkboxes show each
row's own flag even while its section is hidden; only the opened card and the
minicard read the side's view.
