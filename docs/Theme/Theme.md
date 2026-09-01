# Select Color — theme categories + custom colors

Status: **Core implemented · picker UI design** · Owner: xet7 · Related: #5778 (global
per-user theme), Board Settings / Change Color, Member Settings / Change Color, #5514
(the native color-wheel `<input type="color">` already used for list colors).

WeKan ships named board theme colors. Many are near-duplicates that differ only by **one
or two accent colors**; the `clear*` themes are **two-color "color slides"** (gradients).
This document defines how the **Select Color** picker — used in **both** Board Settings
and Member Settings (the global override) — is reorganized into **categories** with
**two-level dropdowns** and **custom colors** where it makes sense.

## 1. Categories

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
  override and therefore uses the shared application default, `appleglasspastel`.

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
  - The shared picker `client/components/main/themeColorPicker.{jade,js}` (categories of
    swatches + custom color wheels for flat/clear), used by Board Settings
    (`boardChangeColorPopup`), Member Settings (`changeColorPopup`) and Admin Panel /
    Settings / Visibility via `scope="board"|"global"|"admin"`. Its design — the scopes, the
    order of themes and how to add another place — is
    [docs/Design/Page/Theme.md](../Design/Page/Theme.md).
  - **The order of themes**, weakest first: 1) WeKan's default theme
    (`appleglasspastel` on application-level pages), 2) the **site theme**
    set in Admin Panel / Settings / Visibility / Change color (on a multitenancy host, the
    Organization's own value replaces the instance's — see
    [Multitenancy](../Design/Multitenancy/Multitenancy.md)), 3) the **user's own override**
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

## 7. Extension checklist (adding a theme color)

1. Add the color name to `config/const.js` `ALLOWED_BOARD_COLORS`.
2. Add it to the correct category in `models/lib/themeCategories.js` (the test enforces the union
   stays equal to `ALLOWED_BOARD_COLORS`).
3. Add its `.board-color-<name>` CSS. If it is a **flat**/**clear** theme, drive its accent(s) with
   the `--theme-accent[-1/-2]` variables so it supports custom colors for free.

## 8. Apple Glass Pastel v2

`appleglasspastel` is a fixed special theme modelled as an application-wide
visual system, not only a board background. It keeps WeKan's information
architecture and behaviour while applying the same palette and component
language to the first header bar, All Boards, Admin Panel, board, pop-overs,
forms and authentication pages.

The implementation is split by responsibility:

- `client/components/main/appleGlassPastel.css` owns the palette tokens, pastel
  mesh, application chrome, common form controls, pop-overs, focus treatment,
  reduced motion and the no-`backdrop-filter` fallback;
- `client/components/boards/appleGlassPastelPages.css` owns All Boards, Admin
  Panel and Kanban surfaces;
- `client/components/users/appleGlassPastelAuth.css` owns the split desktop
  authentication layout and its single-column mobile form.

All selectors remain under `board-color-appleglasspastel`, including portal
surfaces selected through a body `:has()` check while a board with that class is
open. Other themes therefore keep their existing cascade. The override files
are loaded after the legacy styles in both the eager stylesheet entry point and
the relevant lazy feature bundles.

The solid `#2563eb` blue is reserved for primary and active controls. Structural
surfaces use translucent white, a thin white border, 18-24px radii and low
intensity shadows over the pastel mesh. Minicards intentionally use a nearly
solid white surface with **no per-card backdrop filter**: a board can contain
hundreds of cards, and hundreds of blur layers would make scrolling and dragging
needlessly expensive. Blur stays on structural islands such as headers, lists,
menus and fly-outs.

`tests/appleGlassPastelV2.test.cjs` guards the scoped source contract and
`tests/playwright/specs/45-apple-glass-theme.e2e.js` verifies computed styles and
layout on the running app for global, board-only, Admin and login contexts.

The v2 release hardening also covers the small-screen and bidirectional layout
edges that are easy to miss in a visual-only review:

- Mobile All Boards tiles use a `4rem` minimum rather than a fixed height. Long
  names wrap inside the tile, and both cells in a grid row stretch to the same
  content height.
- Each All Boards board paints one surface only: `.board-list-item` is the glass
  card, while its outer drag item and inner navigation link remain transparent
  structural wrappers. This avoids a three-layer stack around every board.
- That single card has a 16:9 thumbnail sourced from `backgroundImageURL`, or a
  pastel board-icon placeholder when no image is configured. On desktop its
  title and description are each limited to two lines; mobile keeps the full
  title so similarly named boards remain distinguishable. An empty description
  is shown as a localized description placeholder rather than an unexplained
  blank area.
- Board-detail minicards keep their vertical spacing on
  `.minicard-wrapper` only. The painted `.minicard` has no second bottom
  margin, so adjacent cards have one consistent 12px gap instead of a combined
  16-17px gap.
- The mobile quick-access header and Admin Panel glass island use
  `box-sizing: border-box`, `max-width: 100%` and `min-width: 0` where needed, so
  gutters and flex content cannot create horizontal overflow.
- Authentication keeps a physical left-to-right split grid for reliable
  Chromium painting; RTL swaps the logo and form to explicit columns, while the
  logo artwork remains LTR internally. The mobile form stays a single contained
  column in both directions.
- Runtime checks assert viewport containment, title visibility, paint-order
  overlap and responsive Admin/login geometry in Chromium and Firefox. The
  static suite continues to guard selector scope, theme isolation and reduced
  motion/fallback behaviour.
