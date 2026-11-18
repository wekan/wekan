# Swimlane menu / Select Color

Swimlane menu (☰ in the swimlane header) → **Select Color** opens **Choose a
color** (`setSwimlaneColorPopup` in
`client/components/swimlanes/swimlaneHeader.jade`).

## Who sees it

Only a **board admin**. The swimlane menu itself is shown to a board member
who is not **Comment only**, **Read only**, **Read assigned only** or
**Worker**.

## The popup

| Control | What it does |
| --- | --- |
| Palette | picks one of the named colours (`SWIMLANE_COLORS`, `models/metadata/colors.js`); the current one has a check mark |
| **Custom color** | the browser's colour wheel; the chosen `#rrggbb` value is kept as a custom colour ([#5514](https://github.com/wekan/wekan/issues/5514)) |
| **Save** | saves the chosen colour |
| **Remove** | removes the swimlane's colour |

## What it changes

- The colour is saved on the swimlane (`swimlane.color`, `setColor` in
  `models/swimlanes.js`). A value that is neither a palette colour nor a
  valid hex colour is saved as no colour.
- The swimlane header is drawn in that colour: a palette colour by its
  `swimlane-<name>` CSS class, a custom colour inline with a readable text
  colour (`colorClass`, `colorStyle`).

Unlike [List menu / Set Color](../Lists/Set-Color.md) there is no option for
cards to follow the swimlane's colour.
