# Member Settings / Font

Open the top-right username menu, then **Font**
([#4759](https://github.com/wekan/wekan/issues/4759)). Every signed-in member
sees it. The choices are personal, saved to your profile, and apply at once:
there is no Save button.

- **Font** - **Default (no custom font)**, then one button for each font of
  WeKan's curated list (`UI_FONTS` in `models/lib/uiFonts.js`) that this
  browser actually has installed. Each button is shown in its own font. The
  server accepts only fonts from that list.
- A preview line (*The quick brown fox jumps over the lazy dog 0123456789*) in
  the chosen font, size and text color.
- **Font size** - Smaller (80 %), Small (90 %), Default (100 %), Large (115 %),
  Larger (130 %), Largest (150 %).
- **Text color** - a color wheel, and **Remove** to go back to the theme's
  color. The color is made readable on the current theme's background (4.5:1
  contrast); when that changed it, the popup shows the color actually used.

For developers: the popup is `changeFontPopup` in
`client/components/users/userHeader.*`; the methods are `setUiFont`,
`setUiFontSize` and `setUiColors` (`server/models/users.js`), stored as
`profile.uiFont`, `profile.uiFontSize` and `profile.uiTextColor`.

See also [Change Color](../General/Theme/Theme.md) and
[Admin Panel / Settings / Accessibility](../Admin-Panel/Settings/Accessibility.md).
