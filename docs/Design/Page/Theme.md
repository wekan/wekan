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
| `client/components/main/appleGlassPastel.css` | `.css` theme | Shared Apple Glass Pastel tokens, chrome, controls, fly-outs and accessibility fallbacks. |
| `client/components/boards/appleGlassPastelPages.css` | `.css` theme | Apple Glass Pastel surfaces for All Boards, Admin Panel and Kanban. |
| `client/components/users/appleGlassPastelAuth.css` | `.css` theme | Responsive Apple Glass Pastel sign-in and registration layout. |
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
| Member Settings / Change color | `global` | `setGlobalThemeColor` | fall back to the site theme, app default and per-board colours |
| Admin Panel / Settings / Visibility / Change color | `admin` | `setAdminThemeColor` | fall back to the shared app default theme (or, for an Organization, to the instance's) |

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

## The theme is on the FIRST header bar

It used to be on the second, and most pages no longer render one — so
`#header-quick-access` is the bar a reader actually sees painted. Three themes
were wrong once it moved:

- **clearblue** is a colour *slide*, and the slide was only ever on
  `#header #header-main-bar`, the inner element of the second bar. The first bar
  took the flat `background-color: #00aecc` from the rule beside it — which is
  **strongcyan's colour exactly**, so choosing clearblue painted the header
  strongcyan. The slide is on `#header-quick-access` now.
- **natural** and **modern** each had a *later* rule repainting the first bar the
  near-black shade it wore as a thin strip above the coloured main bar
  (`#2d392b`, `#333 !important`). Picking Natural painted the header near-black
  and Modern charcoal, whatever their own colours were. Both overrides are gone;
  the shared `#header, #header-quick-access` rule provides each theme's colour.

clearblue's text is full white too. Half-white was right when this bar was a
secondary strip and its username and board links were background furniture; it is
the header now, and no other theme dims them.

### A slide is not a colour

Everything outside a board reads one variable, `--theme-accent`, and that is
right for the eighteen flat themes. clearblue cannot be carried by it: a variable
holds a colour, and a gradient is not one. So the rows that must *slide* are
named in clearblue's own rule — the Admin Panel's selected left-menu row, which
always was, and the All Boards one, which now is. Without that, All Boards' row
sat flat `#00aecc` beside an Admin Panel row that slid.

`tests/themeAccents.test.cjs` pins all of it: every theme paints the first bar,
paints it its *own* colour, and **no two themes paint it the same** — which is
how clearblue came to be indistinguishable from strongcyan.

**One known exception**, recorded rather than changed: `cleanlight`'s accent is a
mid-grey scraped from a `#header ul li:hover` rule, because it has no plain
`#header` rule at all. Its bar is near-white, which cannot serve as an accent for
white text, so the grey is right by accident. Choosing a deliberate accent for it
is a maintainer's call about a colour, not a bug fix.

## Six colour slides, not one

`clearblue` was the only theme in the **clear** category. Five more join it, each
a slide from a light tint down to an existing flat theme's own colour, so the two
categories cover the same colour families:

| Theme | Slide | Base is |
| --- | --- | --- |
| `clearblue` | `#499bea` → `#00aecc` | (hand-tuned, the original) |
| `cleargreen` | `#8ad59f` → `#4bbf6b` | limegreen |
| `clearorange` | `#efab6f` → `#e67e22` | pumpkin |
| `clearpink` | `#df94b8` → `#cd5a91` | moderatepink |
| `clearpurple` | `#b685ca` → `#8e44ad` | wisteria |
| `clearred` | `#d67e75` → `#c0392b` | pomegranate |

The rest of each palette is **arithmetic on the base**, and it is clearblue's own
arithmetic — its numbers turn out to be exact: the border under the bar is
`base × 0.8`, the one above it `base × 0.6`, the current tab `base × 1.15`, a
selected minicard the base mixed toward white. Deriving them means a seventh
slide is one line rather than a page of guessed hexes, and it means no theme can
be half-done.

Each block was generated from clearblue's, with one deliberate exception: its
**comments were dropped**. They explain clearblue's own history — the flat bar
that looked like strongcyan, the half-white username — and copied into a green
theme those sentences are simply false. Each block carries a header saying what
it is and what it was derived from instead.

### Where they appear

Board Settings, Member Settings and Admin Panel / Settings / Visibility are **one
picker** with a `scope`, and it groups by `THEME_CATEGORIES`. So a theme added to
the category and to `ALLOWED_BOARD_COLORS` appears in all three at once, takes
the category's two custom colours (a slide has two ends), and validates on the
server through the same list. `tests/themeAccents.test.cjs` checks that wiring
rather than trusting it.

It also checks that every theme in `clear` **actually slides** — a gradient, with
two *different* ends, whose solid end is the accent everything outside a board
reads. A slide theme with a flat bar is a flat theme filed in the wrong drawer,
and that is not hypothetical: clearblue's own first bar was flat until it was
fixed.
