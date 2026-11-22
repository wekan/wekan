# Enabling all Touch Screen Support

## What it is

On a touch screen (a phone, a tablet or a desktop touch monitor) WeKan shows
drag handles, so a finger can move cards while dragging the rest of the board
pans it. Some desktop browsers also need touch events turned on before drag and
drop works with a finger.

## Read more

- [Touchscreen](https://en.wikipedia.org/wiki/Touchscreen) on Wikipedia.
- [Wekan Drag Handle issue](https://github.com/wekan/wekan/issues/3755)
- [Chrome touch at Google Support](https://support.google.com/chrome/thread/18609718/how-to-get-drag-drop-working-with-touch-screen-working-on-latest-version-of-chrome?hl=en)
- [Chrome touch Wekan discussion](https://github.com/wekan/wekan/discussions/3958)
  and the same link as the
  [Chrome/Chromium/Chromium Edge Touch issue](https://github.com/wekan/wekan/discussions/3958)
  (this discussion no longer answers; kept for the record).
- WeKan pages: [Drag and drop](Drag-Drop.md).

## How to use it

**1) Show drag handles.** Click your username at the top right, then **Show
desktop drag handles** (or the arrows button in the header bar). A check mark
shows it is on. Then you can drag cards with touch screen, for example at
Android/iOS/desktop touch screen. (Older WeKan called this Change Settings /
Show Desktop Drag Handles.)

**2) Enable touch screen support of Chrome/Chromium/Chromium Edge.** Change the
target inside properties in the Google Chrome shortcut by adding
`--touch-events` in the end of the address:

```
Chrome shortcut > Properties >
Target: "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" --touch-events
```

And similarly at other non-Windows operating systems, by modifying shortcut.

## How the numbers are calculated

A device counts as a touch screen when `navigator.maxTouchPoints > 0`
(`Utils.isTouchScreen()`). When you have never chosen, handles are on for a touch
screen and off for a mouse; your own choice wins on every device
(`resolveShowDragHandles()` in
[models/lib/dragHandles.js](../../../../models/lib/dragHandles.js)).

## How it works in WeKan

- `Utils.showDragHandles()` in [client/lib/utils.js](../../../../client/lib/utils.js)
  combines your saved choice (`profile.showDesktopDragHandles`, or localStorage
  when not logged in) with whether the device is a touch screen.
- The toggles are `js-toggle-desktop-drag-handles` in
  [client/components/main/header.jade](../../../../client/components/main/header.jade)
  and [client/components/users/userHeader.jade](../../../../client/components/users/userHeader.jade).
- [client/lib/dragDropTouch.js](../../../../client/lib/dragDropTouch.js) turns a
  long press into an HTML5 drag, for board icons.
- Tests: [tests/dragHandles.test.cjs](../../../../tests/dragHandles.test.cjs),
  [tests/dragDropTouch.test.cjs](../../../../tests/dragDropTouch.test.cjs).

## Commits

 - [The opened card and every popup move under a finger](https://github.com/wekan/wekan/commit/1b056732001674ec4c78aa1711ad1253bc0d3ebd)
 - [The drag-handle toggle works on touch screens](https://github.com/wekan/wekan/commit/5a1a661e0143e9feff57d88ca44192c6137602f0)
 - [Board icons drag by finger](https://github.com/wekan/wekan/commit/1c2e1e2047f55724ce75fc42dc60e45a5db28ad5)
 - [Move the Desktop Drag Handle setting](https://github.com/wekan/wekan/commit/2be0385c254793f4ff8371d981c665fcc3878458)
