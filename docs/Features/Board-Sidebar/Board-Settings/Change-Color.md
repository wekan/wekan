# Board Settings / Change Color

## What it is

**Right sidebar / Board Settings / Change color** (`fa-paint-brush`) sets the
board's own colour theme, which every member sees on this board. The board
colour owns the board page: the site theme is not applied there, but a user's
own Member Settings colour is.

## Read more

- [Wikipedia: Theme (computing)](https://en.wikipedia.org/wiki/Theme_(computing))
- [Wikipedia: Web colors](https://en.wikipedia.org/wiki/Web_colors), the hex
  colours the custom colours are written in
- [Change color](../../General/Theme/Change-Color.md): the picker, its
  categories and the order of themes
- [Theme](../../General/Theme/Theme.md)
- [Change Background Image](Background-Image.md)

## How to use it

1. Open the board, its right sidebar, then **Board Settings → Change color**.
   It is in the group after **Scrum settings**, and like the rest of that group
   it is shown to **board admins only**.
2. The popup is the shared colour picker: the themes as swatches grouped by
   category, with a check mark on the current one.
3. Click a theme. A click applies at once - there is no Save.
4. For the flat and clear categories, set your own colours with the
   custom-colour wheels; the preview shows the result.

A board always has a colour, so this scope has no "Default theme" row.

## How the numbers are calculated

The themes are in four categories
([models/lib/themeCategories.js](../../../../models/lib/themeCategories.js)),
in this order: flat (9 themes), clear (6), dark (5) and special (5). A flat
theme takes 1 custom colour and a clear theme 2 (`CUSTOM_COLOR_COUNT`); dark
and special themes take none. Custom colours are stored only when there are
exactly that many and each is a six-digit hex colour such as `#1a2b3c`;
otherwise any earlier custom colours are removed.

## How it works in WeKan

The entry opens `boardChangeColorPopup` in
[client/components/sidebar/sidebar.jade](../../../../client/components/sidebar/sidebar.jade),
which draws the shared colour picker, `themeColorPicker`, with
`scope="board"`. A click calls `board.setColor()` in
[models/boards.js](../../../../models/boards.js), which stores `color` and,
when they are valid for that category (`isValidCustomColors`),
`customThemeColors` on the board.

## Commits

 - [Move Scrum settings above Change color in Board Settings](https://github.com/wekan/wekan/commit/7bf6f8a44b18cc4b324e666b933ef5d86eeda6e4)
 - [Custom colour is offered in Member Settings and the Admin Panel too](https://github.com/wekan/wekan/commit/024036f4ee4b976f51bf6a032aa9b5d8c3916138)
 - [Add Apple Glass Pastel board theme](https://github.com/wekan/wekan/commit/4763c94604476c6651ba6a1a1be82e03db3d3827)
 - [Five more colour slides: cleargreen, clearorange, clearpink, clearpurple, clearred](https://github.com/wekan/wekan/commit/8897be9f056dadaa1c2dcc2683c8bfbaaa106dfd)
 - [Change Color: as many swatch columns as the width allows, like Change Language](https://github.com/wekan/wekan/commit/95b0acd0b7aa07a213c401add3e319590aca017a)
 - [Theme: every named theme publishes its accent, so the whole UI follows it](https://github.com/wekan/wekan/commit/19a5ea0b71b8edce9fdfe93cb6fae07534224583)
 - [Select Color: theme categories core + design doc (docs/Theme/Theme.md)](https://github.com/wekan/wekan/commit/49285dad1950a3019972dbf08d40201b256719ca)
