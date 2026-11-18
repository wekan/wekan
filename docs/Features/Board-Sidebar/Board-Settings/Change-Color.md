# Board Settings / Change Color

**Right sidebar / Board Settings / Change Color** (`fa-paint-brush`) opens
`boardChangeColorPopup` (`client/components/sidebar/sidebar.jade`), the
board's own colour. It is in the group after **Scrum settings**, and like the
rest of that group it is shown to **board admins only**.

The popup is the shared colour picker, `themeColorPicker` with
`scope="board"`: the themes as swatches grouped by category, with a check mark
on the current one, and for the flat and clear categories the custom-colour
wheels and a preview. A click applies at once - there is no Save - by calling
`board.setColor()`, which stores `color` and, when they are valid for that
category, `customThemeColors` on the board. A board always has a colour, so
this scope has no "Default theme" row.

The board colour owns the board page: the site theme is not applied there, but
a user's own Member Settings colour is. The picker, its categories and the
order of themes are described once in
[Change color](../../General/Theme/Change-Color.md).

## Related

- [Theme](../../General/Theme/Theme.md)
- [Change Background Image](Background-Image.md)
