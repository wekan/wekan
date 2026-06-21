# Accessibility in WeKan

WeKan aims to be usable with a keyboard and with assistive technologies such as
screen readers, following the [WCAG 2.1 AA](https://www.w3.org/WAI/WCAG21/quickref/)
guidelines.

This page describes:

1. The **admin-configurable Accessibility info page** (Admin Panel / Settings / Accessibility).
2. The **built-in accessibility features** that apply to every page.

## Admin Panel / Settings / Accessibility

Admins can publish a custom Accessibility statement / information page.

- Open **Admin Panel / Settings / Accessibility**.
- Enable **Accessibility page enabled**.
- Fill in:
  - **Accessibility title** — heading shown at the top of the page.
  - **Accessibility content** — body text (supports the same Markdown formatting
    as the rest of WeKan).
- Click **Save**.

When enabled:

- A link to the page appears in the board **sidebar** (the universal-access icon,
  shown only when the page is enabled).
- The page is available at the `/accessibility` URL.
- If the page is not yet filled in, visitors see an
  "accessibility info not added yet" message.

The data is stored in the `accessibilitySettings` collection with the fields
`enabled`, `title` and `body`. Editing requires admin permission.

## Built-in accessibility features

These apply to all pages and require no configuration.

### Keyboard navigation and focus

- **Visible focus indicator** — links, buttons and form controls show a clearly
  visible outline when focused with the keyboard (`:focus-visible`), so keyboard
  users always know where focus is (WCAG 2.4.7 Focus Visible).
- **Tab order** — interactive controls are reachable in a logical order. Links are
  keyboard-focusable, so menus, popups and toolbars can be operated without a mouse.
- **Accessible reordering (without drag-and-drop)** — each minicard has visually
  hidden, keyboard-focusable **"Move card up" / "Move card down"** buttons, and each
  list header has **"Move list left" / "Move list right"** buttons, so screen-reader
  and keyboard users can reorder cards and lists without drag-and-drop.
- **Skip to main content** — a "Skip to main content" link is the first focusable
  element on the page. It is hidden until focused and lets keyboard / screen-reader
  users bypass the header chrome and jump straight to the content (WCAG 2.4.1 Bypass
  Blocks).
- **Modal focus management** — when a dialog (modal) opens, keyboard focus moves
  into it; when it closes, focus returns to the control that opened it (WCAG 2.4.3
  Focus Order).

### Screen-reader support

- **Page language** — the `<html>` element declares its language (`lang`) and text
  direction (`dir`, `ltr` or `rtl`), so screen readers pronounce content correctly
  (WCAG 3.1.1). RTL languages such as Arabic and Hebrew are fully supported.
- **Landmark roles** — page regions are exposed for assistive-technology navigation:
  - `role="main"` on the content area,
  - `role="navigation"` on the header quick-access bar,
  - `role="search"` on the global search form (WCAG 1.3.1).
- **Dialogs** — modals and popups are marked `role="dialog"` with accessible names;
  modals also set `aria-modal="true"`.
- **Accessible names** — icon-only controls expose a text label (`aria-label`),
  including the modal/popup close and back buttons, the announcement close button,
  the sidebar close/back buttons, and the global search input and clear button
  (WCAG 4.1.2 Name, Role, Value).
- **Decorative icons** — Font Awesome icons inside labelled controls are marked
  `aria-hidden="true"` so they are not announced redundantly.
- **Images** — meaningful images have `alt` text; purely decorative images (such as
  the avatar image inside a named link) use empty `alt`.
- **Tables** — data tables (for example the My Cards table) use header cells with
  `scope="col"` and a caption, so rows and columns are announced correctly.
- **Live regions** — the site-wide announcement banner is announced politely via
  `role="status"` / `aria-live="polite"`, and login errors via an assertive live
  region.

### Display and zoom

- The viewport allows pinch-to-zoom up to 5× (`maximum-scale=5, user-scalable=yes`).
- A header zoom control lets users scale the board between 50% and 300%.
- A high-contrast focus halo keeps the focus outline visible on both light and dark
  colored board headers.

## Keyboard shortcuts

WeKan also has many keyboard shortcuts. Press **`?`** inside WeKan to see the full
list (screenshot: [screenshot-keyboard-shortcuts.png](../screenshot-keyboard-shortcuts.png)),
and toggle keyboard shortcuts on or off from the board sidebar.

## Testing

Cross-cutting accessibility guarantees (page language, skip link, landmark roles,
visible focus, dialog roles, accessible names on icon controls, and absence of
duplicate element ids) are covered by the end-to-end test suite in
[`tests/playwright/specs/19-accessibility.e2e.js`](../../../tests/playwright/specs/19-accessibility.e2e.js).

## Reporting accessibility issues

If you find an accessibility problem, please
[open an issue](https://github.com/wekan/wekan/issues) describing the page, the
assistive technology / browser used, and what was expected.
