# Board View Settings popup

## What it is

The Board View Settings popup is the panel where a board admin chooses which
views a board offers on a public and on a private board, and which view it
opens in. This page is about the panel itself: where it opens, and how it is
moved and resized so its long table of views can be read on any screen. What
its rows and checkboxes do is described in
[Board Settings / Board View](../../Board-Sidebar/Board-Settings/Board-View.md).

## Read more

- [Dialog box](https://en.wikipedia.org/wiki/Dialog_box) and
  [Window (computing)](https://en.wikipedia.org/wiki/Window_(computing)) on
  Wikipedia - the kind of panel this is, moved and resized like a window.
- [Pointer events](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events)
  on MDN - one way to handle mouse, pen and touch, which the drag and the grip
  use.
- [Board Settings / Board View](../../Board-Sidebar/Board-Settings/Board-View.md)
  and the [Board header](../README.md).

## How to use it

Open Right Sidebar → Board Settings → Board View. The settings panel opens
within the visible viewport, using its full desktop width when space allows.
Its position is independent of document scrolling and the sidebar opener.

1. Open a board and its right sidebar (the hamburger menu).
2. Click **Board Settings**, then **Board View**. The panel opens near the top
   of the window, centred.
3. **Move it**: drag the popup title bar. Back and Close controls retain
   their normal actions. When drag handles are on (Member Settings), drag the
   handle before the title instead.
4. **Resize it**: drag the grip at the bottom-right corner with the mouse or a
   finger, or focus the grip and use the arrow keys.
5. Movement and resizing keep the panel inside the viewport. The grip remains
   at the physical bottom-right in RTL layouts. Content scrolls inside a short
   panel.

## How the numbers are calculated

- **Where it opens** (`boardViewSettingsPopup` in
  [client/lib/popupOffset.js](../../../../client/lib/popupOffset.js)): its width
  is the smaller of 900 px and 90 % of the window width, it is centred
  horizontally (`left = (window width - width) / 2`), its top is 12 px, and its
  height is at most the window height minus 24 px.
- **On a narrow screen**, 800 px wide or less (`MOBILE_POPUP_MAX_WIDTH`), or in
  mobile mode, it is placed at the top left corner and fills the screen, like
  every popup.
- **Dragging** (`pointermove .header` in
  [client/components/main/popup.js](../../../../client/components/main/popup.js)):
  the new position is the start position plus how far the pointer moved, then
  clamped so the visible box stays at least 12 px inside every edge of the
  window. The size used is the panel's size at that moment, so a panel that has
  just grown is still kept inside.
- **Resizing** (`resizeDatePopup`): the width is kept between the smaller of
  320 px and the room available, and the room from the panel's left edge to
  12 px before the window's right edge (in right-to-left, from 12 px to its
  right edge). The height is kept between the smaller of 160 px and its height
  when opened, and the room down to 12 px above the bottom.
- **Keyboard**: each arrow key on the focused grip changes the size by 20 px -
  Left / Right the width, Up / Down the height.

## How it works in WeKan

- The popup is opened from the Board Settings sidebar with
  `Popup.open('boardViewSettings', { titleKey: 'board-view' })` in
  [client/components/sidebar/sidebar.js](../../../../client/components/sidebar/sidebar.js);
  its rows come from the same `boardViewSettings` table as the Board View menu.
- `boardViewSettingsPopup` is one of the `MOVABLE_POPUPS` in
  [client/components/main/popup.js](../../../../client/components/main/popup.js):
  popups that may grow past the window while open, and are kept inside it. The
  title-bar drag ignores a press that is not the main button, a press on a link,
  button, input or select inside the header, and, with drag handles on, a press
  anywhere but the handle. A maximized popup is not dragged.
- The grip is `button.js-date-popup-resize` in
  [client/components/main/popup.tpl.jade](../../../../client/components/main/popup.tpl.jade),
  shared with the other resizable popups. A pointer is followed only while it is
  the same pointer that pressed (`pointerId`), so a second finger or pointer
  does not resize.
- Tests: geometry and pointer-handler regressions pass, including wrong-pointer
  and interactive-header exclusions:
  [tests/popupOffset.test.cjs](../../../../tests/popupOffset.test.cjs),
  [tests/popupMoveMaximize.test.cjs](../../../../tests/popupMoveMaximize.test.cjs),
  [tests/calendarPopupResize.test.cjs](../../../../tests/calendarPopupResize.test.cjs)
  and [tests/boardViewSettings.test.cjs](../../../../tests/boardViewSettings.test.cjs).
  The browser regression is
  [tests/playwright/specs/board-view-settings-popup.e2e.js](../../../../tests/playwright/specs/board-view-settings-popup.e2e.js);
  it was syntax-checked when this page was first written, with live browser
  execution then pending.

## Commits

 - [Every popup moves by its bar or handle](https://github.com/wekan/wekan/commit/22a12dc7f87b768033f03fe5a378df63dd4e46b7)
 - [A popup that grows while it is dragged stays inside the window](https://github.com/wekan/wekan/commit/7ae45651dc89468d2f0ed6f682ad710df3b1e117)
 - [The browser test follows the panel's new size](https://github.com/wekan/wekan/commit/a8f65adff23d706be9d47ae5d2281932f1749232)
 - [Give the drag test room to move the panel down](https://github.com/wekan/wekan/commit/c620e7908278afd5195bf84b5cc9500d33732075)
 - [Keep Board View Settings visible and allow title drag and resize](https://github.com/wekan/wekan/commit/3b74d2c3c2f90849819864cf99570036cd365eda)
