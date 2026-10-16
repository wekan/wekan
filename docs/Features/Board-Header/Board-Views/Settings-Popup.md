# Board View Settings popup

Open Right Sidebar → Board Settings → Board View. The settings panel opens
within the visible viewport, using its full desktop width when space allows.
Its position is independent of document scrolling and the sidebar opener.

Drag the popup title bar to move the panel. Back and Close controls retain
their normal actions. Use the bottom-right grip to resize with the mouse or
touch; focus the grip and use arrow keys to resize with the keyboard. Movement
and resizing keep the panel inside the viewport. The grip remains at the
physical bottom-right in RTL layouts. Content scrolls inside a short panel.

Geometry and pointer-handler regressions pass, including wrong-pointer and
interactive-header exclusions. The browser regression is
`tests/playwright/specs/board-view-settings-popup.e2e.js`; it is syntax-checked,
but live browser execution remains pending.
