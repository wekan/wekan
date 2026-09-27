# Responsive popup layout audit

The audit inspected the 198 popup templates under `client` and the shared popup
shell, including the 51 templates using standard option lists. Runtime layout
uses the options actually rendered after permission checks and conditional
helpers; it does not expose hidden options or change actions.

| Popup family | Layout |
| --- | --- |
| Board View, Board Settings, Member Settings, card/list/swimlane action menus | Eight or more options use balanced columns on screens wider than 800px. Group separators remain with their menu content. |
| Custom-field and label pickers | Long lists use the same columns. Each row stays together, including its edit button. Opening Edit restores the form layout. |
| Members, assignees, requester/assigner pickers | Long lists use columns with the search field spanning their width. Filtering keeps the established width to avoid moving the focused field. |
| Short menus and confirmations | Remain compact; additional width would not reveal more options. |
| Language, color and sticker pickers | Retain their existing grids and wider shells. |
| User, organization and team editor forms | Retain their existing responsive field grids. |
| Date editors, Board View settings, history and export panels | Retain specialized calendar, table, resize and pane layouts. |
| Other creation/edit/import forms and destination selectors | Keep form controls in their existing order; they are excluded from automatic menu columns. |

Columns are approximately 240px wide within a centered menu up to 960px wide.
The menu is bounded by the viewport; scrolling remains available when the
number of options or screen height makes displaying everything impossible.
Screens up to 800px retain the existing single-column sheet. CSS columns follow
LTR/RTL and preserve source order. The shared focus trap continues to operate.
Only the active popup stack entry determines layout, so hidden parent menus do
not widen child forms. Mutation observation is disconnected on popup destruction.

Board Settings / Card has a separate three-section grid: **Draggable**, **Show
on Minicard**, **Show on Card**. At least 780px of form width is required for
three columns; otherwise all three stack in that order. The condition measures
the form, so a narrow popup on a wide screen also stacks.

Implementation: `client/lib/popupMenuLayout.js`,
`client/components/main/popup.js`, `client/components/main/popup.css`, and
`client/components/sidebar/sidebar.{jade,css}`.

Coverage: `tests/popupMenuLayout.test.cjs` exercises classification and stack
changes. `tests/playwright/specs/popup-menu-columns.e2e.js` covers representative
menus, labels, searchable members, form/back navigation, phones and RTL.
`board-settings-columns.e2e.js` verifies the three-section layout at desktop,
narrow-popup and phone widths, plus existing persistence and permission checks.
Not every template was opened in a browser; this audit uses the shared behavior
and representative UI cases. Browser runs use Chromium.
