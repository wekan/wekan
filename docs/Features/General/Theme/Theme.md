# Select Color — theme categories + custom colors

## What it is

Select Color is how a board, a member or the whole site chooses a colour theme.
The themes are grouped into four categories - **Flat**, **Clear**, **Dark** and
**Special** - and a flat or clear theme can also take your own custom colour
(one for flat, two for the colour slide of a clear theme). This page is the
design of the categories, the custom colours and their validation.

## Read more

- [Theme (computing)](https://en.wikipedia.org/wiki/Theme_(computing)),
  [Color gradient](https://en.wikipedia.org/wiki/Color_gradient),
  [Color wheel](https://en.wikipedia.org/wiki/Color_wheel) and
  [Glassmorphism](https://en.wikipedia.org/wiki/Glassmorphism) on Wikipedia.
- [CSS custom properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
  on MDN, and [WCAG 2.1 contrast](https://www.w3.org/TR/WCAG21/#contrast-minimum).
- Issue [#5778](https://github.com/wekan/wekan/issues/5778).
- WeKan pages: [Change color](Change-Color.md), [Dark mode](Dark-Mode.md),
  [Custom CSS themes](Custom-CSS-themes.md).

## How to use it

1. Open the picker from one of its three places:
   - a board: right sidebar → Board Settings → **Change color**;
   - yourself, everywhere: Member Settings → **Change Color**;
   - the site default: Admin Panel / Settings / Appearance → Change color.
2. Click a theme swatch under its category (**Flat**, **Clear**, **Dark**,
   **Special**). It applies at once; there is no Save button.
3. For a flat or clear theme, pick a **Custom color** with the colour wheel
   (two wheels for clear).
4. Choose the default entry to go back to the default (a board to the site
   default; a member clears their own override).

The implemented picker shows the categories as groups of swatches, as many
columns as fit; the two-level dropdown sketch in section 2 below was the first
design.

## How the numbers are calculated

From [models/lib/themeCategories.js](../../../../models/lib/themeCategories.js):

- 25 themes: 9 flat, 6 clear, 5 dark, 5 special; the union must equal
  `ALLOWED_BOARD_COLORS` in `config/const.js`.
- Custom colours: exactly 1 for flat and 2 for clear (`CUSTOM_COLOR_COUNT`),
  none for dark and special.
- Each custom colour must match `^#[0-9a-fA-F]{6}$`.
- Apple Glass Pastel: `blur(24px) saturate(180%)`, primary blue `#2563eb`; its
  contrast test requires 4.5:1 for text and 3:1 for large text and icons.

## How it works in WeKan

Status: **Core implemented · picker UI design** · Owner: xet7 · Related: #5778 (global
per-user theme), Board Settings / Change Color, Member Settings / Change Color, #5514
(the native color-wheel `<input type="color">` already used for list colors).

WeKan ships named board theme colors. Many are near-duplicates that differ only by **one
or two accent colors**; the `clear*` themes are **two-color "color slides"** (gradients).
This document defines how the **Select Color** picker — used in **both** Board Settings
and Member Settings (the global override) — is reorganized into **categories** with
**two-level dropdowns** and **custom colors** where it makes sense.

### 1. Categories

The colors partition into four categories (single source of truth:
`models/lib/themeCategories.js`, guarded by `tests/themeCategories.test.cjs` to exactly equal
`config/const.js` `ALLOWED_BOARD_COLORS`):

| Category | Colors | Custom colors |
|----------|--------|---------------|
| **flat** | belize, nephritis, pomegranate, pumpkin, wisteria, moderatepink, strongcyan, limegreen, natural | **1** (single accent) |
| **clear** | clearblue, cleargreen, clearorange, clearpink, clearpurple, clearred | **2** (color slide / gradient) |
| **dark** | midnight, dark, moderndark, exodark, cleandark | **none** (fixed) |
| **special** | relax, corteza, appleglasspastel, modern, cleanlight | **none** (fixed) |

Rationale: **flat** designs are one accent color over a flat surface, so a single custom color
fully re-skins them. **clear** designs are a two-color gradient ("slide"), so they take two
custom colors. **dark** and **special** are hand-tuned, multi-color designs where a naive
custom color would break contrast/readability — so they are **fixed** (pick the named theme, no
custom colors).

#### Apple Glass Pastel

`appleglasspastel` follows Apple's Liquid Glass: every surface - the two header
bars, swimlane headers, lists, minicards, the opened card, the sidebar and
popups - is frosted glass over a pastel mesh. Each has a translucent white fill,
`backdrop-filter: blur(24px) saturate(180%)`, a rim of light along its edges
(inset highlights, brightest on top), a diagonal sheen and large rounded corners.
Text and icons are dark, and blue `#2563eb` is kept for the primary action and
for what is active. With the system's **Reduce transparency** setting, or in a
browser without `backdrop-filter`, the glass turns nearly opaque.

`tests/playwright/specs/theme-appleglasspastel-contrast.e2e.js` checks that the
text reads. It hides every text, takes a screenshot, and measures each text and
icon against the pixels that were behind it: WCAG AA, 4.5:1 for text and 3:1 for
large text and icons. It runs on the board, the opened card, the sidebar, the
board menu and All Boards, at laptop and phone sizes.

### 2. Picker UX — two-level dropdowns + color wheel

The Select Color popup (identical in Board Settings and Member Settings) is:

```
Category:  [ flat  ▼ ]      <- 1st-level dropdown (themeCategories order)
Theme:     [ belize ▼ ]     <- 2nd-level dropdown (colors in the chosen category)

  (flat)   Custom color:  [🎨 color wheel]            <- shown only for flat
  (clear)  Colors:        [🎨 wheel 1] [🎨 wheel 2]   <- shown only for clear
  (dark/special)  — no custom color controls —

[ Preview swatch ]     [ Save ]   [ Default / Unset ]
```

- **1st dropdown** picks the category; **2nd dropdown** repopulates with that category's themes.
- The **color wheel(s)** are the native `<input type="color">` (the #5514 mechanism already used
  for list colors — reuse `isHexColor`/`toHex` from `models/lib/contrastColor`). They are shown
  **only** when `allowsCustomColor(category)` is true (flat → 1 wheel, clear → 2).
- Selecting a **dark**/**special** category hides the wheels entirely.
- A live **preview swatch** shows the resulting theme (named or custom).
- **Default / Unset**: Board → falls back to the instance default; Member → clears the global
  override (the existing #5778 behaviour).

Member Settings adds nothing new structurally — it is the same picker writing to the user profile
instead of the board, and its result themes the whole UI (`board-color-<name>` on `<body>`/header,
see #5778).

### 3. Storage model

Named theme (today): `board.color` / `profile.globalThemeColor` = a color name.

Custom colors (new): stored alongside, as an ordered array of `#rrggbb` hex strings whose length
matches the category's `customColorCount`:

- Board: `board.customThemeColors: [String]` (1 for flat, 2 for clear).
- User: `profile.globalThemeCustomColors: [String]`.

A custom flat/clear theme is therefore `{ color: 'belize', customThemeColors: ['#123456'] }` — the
**named theme selects the CSS design**, and the **custom colors override its accent(s)**. Clearing
`customThemeColors` returns the theme to its stock colors.

### 4. Rendering custom colors — CSS variables (the remaining work)

Today each theme is a hardcoded class (`.board-color-belize { … #2980b9 … }`). Custom colors require
the flat/clear theme rules to be driven by **CSS custom properties** so arbitrary colors can be
injected inline:

1. Refactor the **flat** theme rules to reference `var(--theme-accent, <stock hex>)` (stock hex as
   the fallback, so a theme with no custom color is unchanged).
2. Refactor the **clear** theme rules to reference `var(--theme-accent-1, …)` and
   `var(--theme-accent-2, …)` (the two gradient stops).
3. When a custom theme is active, set those variables **inline** on the themed element:
   - Board: on `#header` / the board wrapper (where `board-color-*` already goes).
   - Global (#5778): on `<body>` / header via the `globalThemeColor.js` autorun.
   e.g. `element.style.setProperty('--theme-accent', customThemeColors[0])`.
4. **dark**/**special** rules are left as-is (no variables, no custom colors).

This CSS refactor is the largest and most visual part; it is the natural next implementation step
and must be verified in a running app across the flat/clear themes.

### 5. Validation (security)

Custom colors are user input that ends up as a CSS value, so they are validated on the server before
storage. `models/lib/themeCategories.isValidCustomColors(color, customColors)` enforces:

- the named `color` belongs to a category that **allows** custom colors (flat/clear only), and
- `customColors` length equals that category's count, and
- every entry matches `^#[0-9a-fA-F]{6}$`.

The `setColor` (board) and `setGlobalThemeColor` (user, #5778) methods reject anything else, so no
arbitrary string can be injected as an inline style. Because only `#rrggbb` passes, there is no CSS
injection surface.

### 6. What is implemented now vs. next

- **Implemented:**
  - `models/lib/themeCategories.js` — the categorization + helpers + `isValidCustomColors` (tested).
  - The shared picker `client/components/main/themeColorPicker.{jade,js}` (categories of
    swatches + custom color wheels for flat/clear), used by Board Settings
    (`boardChangeColorPopup`), Member Settings (`changeColorPopup`) and Admin Panel /
    Settings / Appearance via `scope="board"|"global"|"admin"`. Its design — the scopes, the
    order of themes and how to add another place — is
    [docs/Features/General/Theme/Change-Color.md](Change-Color.md).
  - **The order of themes**, weakest first: 1) WeKan's default theme, 2) the **site theme**
    set in Admin Panel / Settings / Appearance / Change color (on a multitenancy host, the
    Organization's own value replaces the instance's — see
    [Multitenancy](../../../Design/Multitenancy/Multitenancy.md)), 3) the **user's own override**
    from Member Settings. A board's own colour owns the board page, so the site theme is not
    applied there; a user's own override is, because they asked for it everywhere.
  - **Storage + validation**: `board.customThemeColors` and `profile.globalThemeCustomColors`
    (each a validated `#rrggbb` array), written by `board.setColor(color, custom)` and the
    `setGlobalThemeColor(color, custom)` method, both gated by `isValidCustomColors`.
  - **Custom-color application**: `globalThemeColor.js` sets `--theme-accent` / `--theme-accent-2`
    on `:root` (board's colors when on a board, the user's global override otherwise) and toggles
    the `has-custom-theme-color` / `has-custom-theme-slide` body classes; `customTheme.css` consumes
    them to recolor the header bars, primary buttons, and sidebar button.
- **Next (iterative):** broaden `customTheme.css` beyond the header/buttons to the full flat/clear
  surface (minicards, pop-overs, board canvas), ideally by refactoring those theme rules to read the
  `--theme-accent*` variables directly (§4) so custom colors cover everything a named theme does.
  This part is CSS-heavy and best iterated in a running app.

### 7. Extension checklist (adding a theme color)

1. Add the color name to `config/const.js` `ALLOWED_BOARD_COLORS`.
2. Add it to the correct category in `models/lib/themeCategories.js` (the test enforces the union
   stays equal to `ALLOWED_BOARD_COLORS`).
3. Add its `.board-color-<name>` CSS. If it is a **flat**/**clear** theme, drive its accent(s) with
   the `--theme-accent[-1/-2]` variables so it supports custom colors for free.

## Commits

 - [Every board theme and every chosen colour is readable](https://github.com/wekan/wekan/commit/8b2114cd0f9501867c01521c7a6f78a02e44d549)
 - [Custom colour offered in Member Settings and the Admin Panel too](https://github.com/wekan/wekan/commit/024036f4ee4b976f51bf6a032aa9b5d8c3916138)
 - [Board tiles carry the whole theme](https://github.com/wekan/wekan/commit/05ddc83cb786f7ca3baede3e80bf925a72e0e696)
 - [Add the Apple Glass Pastel board theme](https://github.com/wekan/wekan/commit/4763c94604476c6651ba6a1a1be82e03db3d3827)
 - [Five more colour slides](https://github.com/wekan/wekan/commit/8897be9f056dadaa1c2dcc2683c8bfbaaa106dfd)
 - [As many swatch columns as the width allows](https://github.com/wekan/wekan/commit/95b0acd0b7aa07a213c401add3e319590aca017a)
 - [Change Color applies at once, with no Save](https://github.com/wekan/wekan/commit/772ae061f109478a875fc6e570f0afe26e572148)
 - [Global override applies everywhere, and grouped swatches](https://github.com/wekan/wekan/commit/1cd32001d474bed977d56ff0fdbcfbc090191974)
 - [Two-level dropdown picker and custom colours](https://github.com/wekan/wekan/commit/d0a1e43f364d8ad0caef725e5d48db507887a962)
 - [Theme categories core and design doc](https://github.com/wekan/wekan/commit/49285dad1950a3019972dbf08d40201b256719ca)
