# Select Color — theme categories + custom colors

Status: **Core implemented · picker UI design** · Owner: xet7 · Related: #5778 (global
per-user theme), Board Settings / Change Color, Member Settings / Change Color, #5514
(the native color-wheel `<input type="color">` already used for list colors).

WeKan ships ~19 board theme colors. Many are near-duplicates that differ only by **one or
two accent colors**; a few (`clearblue`) are **two-color "color slides"** (gradients). This
document defines how the **Select Color** picker — used in **both** Board Settings and
Member Settings (the global override) — is reorganized into **categories** with **two-level
dropdowns** and **custom colors** where it makes sense.

## 1. Categories

The colors partition into four categories (single source of truth:
`models/lib/themeCategories.js`, guarded by `tests/themeCategories.test.cjs` to exactly equal
`config/const.js` `ALLOWED_BOARD_COLORS`):

| Category | Colors | Custom colors |
|----------|--------|---------------|
| **flat** | belize, nephritis, pomegranate, pumpkin, wisteria, moderatepink, strongcyan, limegreen, natural | **1** (single accent) |
| **clear** | clearblue | **2** (color slide / gradient) |
| **dark** | midnight, dark, moderndark, exodark, cleandark | **none** (fixed) |
| **special** | relax, corteza, modern, cleanlight | **none** (fixed) |

Rationale: **flat** designs are one accent color over a flat surface, so a single custom color
fully re-skins them. **clear** designs are a two-color gradient ("slide"), so they take two
custom colors. **dark** and **special** are hand-tuned, multi-color designs where a naive
custom color would break contrast/readability — so they are **fixed** (pick the named theme, no
custom colors).

## 2. Picker UX — two-level dropdowns + color wheel

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

## 3. Storage model

Named theme (today): `board.color` / `profile.globalThemeColor` = a color name.

Custom colors (new): stored alongside, as an ordered array of `#rrggbb` hex strings whose length
matches the category's `customColorCount`:

- Board: `board.customThemeColors: [String]` (1 for flat, 2 for clear).
- User: `profile.globalThemeCustomColors: [String]`.

A custom flat/clear theme is therefore `{ color: 'belize', customThemeColors: ['#123456'] }` — the
**named theme selects the CSS design**, and the **custom colors override its accent(s)**. Clearing
`customThemeColors` returns the theme to its stock colors.

## 4. Rendering custom colors — CSS variables (the remaining work)

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

## 5. Validation (security)

Custom colors are user input that ends up as a CSS value, so they are validated on the server before
storage. `models/lib/themeCategories.isValidCustomColors(color, customColors)` enforces:

- the named `color` belongs to a category that **allows** custom colors (flat/clear only), and
- `customColors` length equals that category's count, and
- every entry matches `^#[0-9a-fA-F]{6}$`.

The `setColor` (board) and `setGlobalThemeColor` (user, #5778) methods reject anything else, so no
arbitrary string can be injected as an inline style. Because only `#rrggbb` passes, there is no CSS
injection surface.

## 6. What is implemented now vs. next

- **Implemented:**
  - `models/lib/themeCategories.js` — the categorization + helpers + `isValidCustomColors` (tested).
  - The shared **two-level dropdown picker** `client/components/main/themeColorPicker.{jade,js}`
    (category → theme + custom color wheels for flat/clear), used by **both** Board Settings
    (`boardChangeColorPopup`) and Member Settings (`changeColorPopup`) via `scope="board"|"global"`.
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

## 7. Extension checklist (adding a theme color)

1. Add the color name to `config/const.js` `ALLOWED_BOARD_COLORS`.
2. Add it to the correct category in `models/lib/themeCategories.js` (the test enforces the union
   stays equal to `ALLOWED_BOARD_COLORS`).
3. Add its `.board-color-<name>` CSS. If it is a **flat**/**clear** theme, drive its accent(s) with
   the `--theme-accent[-1/-2]` variables so it supports custom colors for free.
