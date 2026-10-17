# Checklist or subtasks from the description

When a card's description has a list - lines starting with `-`, `*`, `+`, `1.`,
`1)` or a Markdown task box `[ ]` / `[x]` - the opened card's **Checklists**
section offers **From description**.

It opens a preview of the lines it found, with two buttons:

- **Make a checklist** adds a checklist named *Checklist*, one item per line,
  already ticked where the line was `[x]`.
- **Make subtasks** adds one subtask card per line, the way the Subtasks section
  does.

The description itself is not changed. Lines that are not list items -
paragraphs, headings, code blocks - are skipped, and a list inside a code block
is not a list.

## Hiding it

Board Settings / Card row **Checklist from description** (*Show on Card*). A
site admin hides it on every board from Admin Panel / Settings / Visibility /
Features / Card fields.

## Implementation

`models/lib/descriptionListItems.js` (pure: Markdown list lines to items), used
by `client/components/cards/checklists.js`. Tests:
`tests/descriptionListItems.test.cjs`.
