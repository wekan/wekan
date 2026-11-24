# Checklist or subtasks from the description

## What it is

When a card's description already has a list, WeKan can turn that list into
a checklist, or into subtask cards, with one click - the lines the author
already wrote, without retyping them and without AI. A list is lines starting
with `-`, `*`, `+`, `1.`, `1)` or a Markdown task box `[ ]` / `[x]`. The
description itself is not changed.

## Read more

- [Checklist](https://en.wikipedia.org/wiki/Checklist) and
  [Markdown](https://en.wikipedia.org/wiki/Markdown) on Wikipedia.
- [Task list items](https://github.github.com/gfm/#task-list-items-extension-)
  in the GitHub Flavored Markdown specification - the `[ ]` / `[x]` boxes.
- In WeKan: [Checklists](Checklists.md), [Subtasks](Subtasks.md),
  [Action items](Action-Items.md) and
  [Markdown](../Editor/Markdown/README.md).

## How to use it

1. Write a list into the card's description, for example:

   ```
   - [x] Book the room
   - [ ] Send the invitations
   - Order the coffee
   ```

2. In the opened card's **Checklists** section, click **From description**.
   It is there only when the description has list lines.
3. The popup shows a preview of the lines it found, with two buttons:
   - **Make a checklist** adds a checklist named *Checklist*, one item per
     line, already ticked where the line was `[x]`.
   - **Make subtasks** adds one subtask card per line, the way the Subtasks
     section does. It is shown when the board allows subtasks.

Lines that are not list items - paragraphs, headings, code blocks - are
skipped, and a list inside a code block is not a list.

**Hide it**

1. Board Settings / **Card**, the **Checklists** section's **Checklist from
   description** row (*Show on Card*).
2. A site admin hides it on every board from Admin Panel / Settings /
   Features / **Card fields**.

## How the numbers are calculated

From [models/lib/descriptionListItems.js](../../../models/lib/descriptionListItems.js):

- At most **100** lines are taken from one description (`MAX_ITEMS`).
- An item's title is cut at **500** characters (`MAX_TITLE`).
- A numbered line is 1 to 4 digits followed by `.` or `)` (`1.` ... `9999)`).
- The new checklist is placed after the card's last checklist, and its items
  are numbered `sort` 0, 1, 2 ... in the order written.

## How it works in WeKan

- [models/lib/descriptionListItems.js](../../../models/lib/descriptionListItems.js)
  is pure: `descriptionListItems(markdown)` returns `[{ title, checked }]` in
  the order written, skipping fenced code blocks (```` ``` ```` / `~~~`); `x`
  or `X` in the box is checked.
- [client/components/cards/fromText.js](../../../client/components/cards/fromText.js)
  and [fromText.jade](../../../client/components/cards/fromText.jade):
  `checklistFromDescriptionPopup`. **Make a checklist** inserts a `Checklists`
  document and its `ChecklistItems`; **Make subtasks** calls the
  `addSubtaskCard` method once per line. Both go through the same
  permission rules as the card's own forms.
- [client/components/cards/checklists.jade](../../../client/components/cards/checklists.jade) /
  [checklists.js](../../../client/components/cards/checklists.js) draw the
  **From description** button.
- The board flag is `allowsChecklistFromDescriptionOnCard`, on by default
  ([models/lib/cardSettingsRows.js](../../../models/lib/cardSettingsRows.js),
  row `checklistFromDescription`); the Admin Panel overlay is
  [models/lib/cardFieldVisibility.js](../../../models/lib/cardFieldVisibility.js).
- Tests: [tests/descriptionListItems.test.cjs](../../../tests/descriptionListItems.test.cjs).

## Commits

 - [Checklist or subtasks from the list in a card's description](https://github.com/wekan/wekan/commit/3cb089b8cab48c217da27195f5a489af13bcaff2)
