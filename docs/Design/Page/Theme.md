# Design: Change color

One design, one implementation, for **every** place a theme colour is chosen: the
swatches grouped by category, the "Default theme" row, the custom-colour wheels and
the preview. One template renders all of them — the way
[Table](Table.md) is one table page for every table and
[Left Menu](Left-Menu.md) is one menu for every Admin Panel page.

A place that offers "Change color" does not write markup. It renders the shared
template and says whose theme is being set:

```jade
+themeColorPicker(scope="board")    //- Board Settings / Change Color
+themeColorPicker(scope="global")   //- Member Settings / Change color
+themeColorPicker(scope="admin")    //- Admin Panel / Settings / Visibility / Change color
```

`scope` is the only difference between them.

## Related files

| File Path | File Type | Description |
| --- | --- | --- |
| `client/components/main/themeColorPicker.jade` | `.jade` template | **The** picker: the "Default theme" row, the category groups of swatches, the custom-colour wheels and the preview. |
| `client/components/main/themeColorPicker.js` | `.js` component | Reads the current value for the scope, applies a click immediately, and writes it where that scope says. |
| `models/lib/themeCategories.js` | `.js` module, pure helpers | The categories, their order, which allow a custom colour and how many. |
| `models/metadata/colors.js` | `.js` module | `BOARD_COLORS` — the theme names themselves. |
| `client/components/main/globalThemeColor.js` | `.js` startup | Applies the winning theme to `<body>` and the CSS variables — the layering below. |
| `client/components/sidebar/sidebar.jade` | `.jade` template | Board Settings / Change Color — `scope="board"`. |
| `client/components/users/userHeader.jade` | `.jade` template | Member Settings / Change color — `scope="global"`. |
| `client/components/settings/settingBody.jade` | `.jade` template | Admin Panel / Settings / Visibility / Change color — `scope="admin"`. |
| `server/models/users.js` | `.js` methods | `setGlobalThemeColor` — the user's own override. |
| `server/methods/tenant.js` | `.js` methods | `getAdminThemeColor` / `setAdminThemeColor` — the site theme, and which document it lands in. |
| `models/lib/tenantAdmin.js` | `.js` module, pure helpers | `themeTarget()` — the instance's theme, or one Organization's. |
| `docs/Theme/Theme.md` | `.md` guide | What the themes look like, and the custom-colour categories. |

## The order of themes

Weakest first. Each layer replaces the one under it, and only where it is set:

| | Layer | Set in | Stored in |
| --- | --- | --- | --- |
| 1 | **Default theme** | — | nothing; WeKan's own stylesheet |
| 2 | **Site theme** | Admin Panel / Settings / Visibility / Change color | `Settings.themeColor`, or an Organization's `orgThemeColor` on its own hosts |
| 3 | **User's own** | Member Settings / Change color | `user.profile.globalThemeColor` |

A **board's own colour** is not one of these layers: it is what a board looks like.
It owns the board page, so the site theme is not applied there — but a user's own
override is, because they asked for it everywhere.

Layer 2 is one setting with two possible homes, and the server picks the home
(`themeTarget()` in `models/lib/tenantAdmin.js`):

- the **site admin** sets the instance's theme — the one every Organization that has
  not chosen its own inherits, which is why their pane says so under the title;
- an **Organization's own admin** sets that Organization's theme, which replaces the
  instance's on that Organization's hosts. It reaches nothing else.

The client never decides that. It calls `getAdminThemeColor` / `setAdminThemeColor`,
and the server answers for whoever is asking — see
[Multitenancy](../Multitenancy/Multitenancy.md) (D.9) for how an Organization's
value gets published in the instance's place.

## Places that use this design

| Place | Scope | Writes | Clearing it means |
| --- | --- | --- | --- |
| Board Settings / Change Color | `board` | `board.color` + `board.customThemeColors` | — (a board always has a colour, so there is no "Default theme" row) |
| Member Settings / Change color | `global` | `setGlobalThemeColor` | fall back to the site theme, and to per-board colours |
| Admin Panel / Settings / Visibility / Change color | `admin` | `setAdminThemeColor` | fall back to WeKan's default theme (or, for an Organization, to the instance's) |

## What the picker guarantees

- **No Save button anywhere.** Clicking a swatch applies it immediately, and a
  custom-colour wheel applies on `change` (not on every intermediate value of a
  drag). The three places behave identically because it is the same code.
- **The same categories, in the same order, with the same labels**
  (`THEME_CATEGORY_ORDER`), and the colour wheels appear only for the categories
  that take a custom colour — one for flat, two for clear (a gradient).
- **A "Default theme" row wherever there is something to fall back to**, i.e. every
  scope except `board`.
- **The value is validated on the server.** A theme name must be one of
  `BOARD_COLORS` and a custom colour must be a hex colour; anything else is refused
  rather than stored and rendered as a class.

## Adding another place that chooses a theme

1. Render `+themeColorPicker(scope="…")` — no markup of your own.
2. Add the scope to `SCOPES` in `themeColorPicker.js`, with one branch in
   `readCurrent()` and one in `applySelection()`.
3. Say where it sits in the order of themes, in the table above.

If a new place needs a different-looking picker, change **this** template so every
place gets it. That is the point of the design.
