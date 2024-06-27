# Enabling all Touch Screen Support

## 1) Wekan / Click right top your username / Change Settings / Show Desktop Drag Handles

Then you can drag cards with touch screen, for example at Android/iOS/desktop touch screen.

- [Wekan Drag Handle issue](https://github.com/wekan/wekan/issues/3755)

## 2) Enable touch screen support of Chrome/Chromium/Chromium Edge

Change the target inside properties in the Google Chrome shortcut by adding "--touch-events" in the end of the address.
```
Chrome shortcut > Properties >
Target: "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" --touch-events
```
And similarly at other non-Windows operating systems, by modifying shortcut.

- [Chrome touch at Google Support](https://support.google.com/chrome/thread/18609718/how-to-get-drag-drop-working-with-touch-screen-working-on-latest-version-of-chrome?hl=en)
- [Chrome touch Wekan discussion](https://github.com/wekan/wekan/discussions/3958)
- [Chrome/Chromium/Chromium Edge Touch issue](https://github.com/wekan/wekan/discussions/3958)