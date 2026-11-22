# Dark mode

## What it is

Dark mode means light text on a dark background, which is easier on the eyes in
a dim room. WeKan has dark themes of its own - `midnight`, `dark`, `moderndark`,
`exodark` and `cleandark`, the **Dark** category of the theme picker - and the browser, the e-mail program or the operating system can also
make every page dark, WeKan included.

![dark wekan](https://wekan.fi/wekan-dark-mode.png)

## Read more

- [Light-on-dark color scheme](https://en.wikipedia.org/wiki/Light-on-dark_color_scheme)
  on Wikipedia.
- WeKan pages: [Select Color](Theme.md), [Change color](Change-Color.md),
  [Custom CSS themes](Custom-CSS-themes.md).

## How to use it

**WeKan Dark Mode.**

1. Open Member Settings → **Change Color** (for yourself, everywhere), or Board
   Settings → **Change color** (for one board).
2. Click a theme in the **Dark** category: `midnight`, `dark`, `moderndark`,
   `exodark` or `cleandark`.

**Other dark modes** are listed below, per browser and system.

## How the numbers are calculated

There are no numbers. Dark themes take no custom colours (`CUSTOM_COLOR_COUNT`
has no `dark` entry in
[models/lib/themeCategories.js](../../../../models/lib/themeCategories.js)),
because a single custom colour would break their contrast.

## How it works in WeKan

Each dark theme is a `board-color-<name>` class with its own CSS, chosen with
the shared picker (`client/components/main/themeColorPicker.jade`). A few
components also follow the system setting with `@media (prefers-color-scheme:
dark)`, for example
[client/components/sidebar/sidebarOriginalPositions.css](../../../../client/components/sidebar/sidebarOriginalPositions.css).

### Other Dark Modes

#### Chrome Desktop Browser
- [Dark Mode Extension](https://chrome.google.com/webstore/detail/dark-mode-for-chrome/geooakdjiamlhpechokegobmhdmlgidk) - changes all webpages to dark, including Wekan.
- [Decent - Dark Theme](https://chrome.google.com/webstore/detail/decent/bnnjhehfmlfkbdocbphdoagolcknbohp)

#### Firefox Desktop and Mobile Browser
- [Dark Mode Webextension](https://addons.mozilla.org/en-US/android/addon/dark-mode-webextension/) - changes all webpages to dark, including Wekan.
- There is dark themes, depends what someone likes

#### Thunderbird Email
- [TT DeepDark - Dark Theme](https://addons.thunderbird.net/en-US/thunderbird/addon/tt-deepdark/) - after installing click Edit/Preferences/Display/Colors/Font&Colors-Colors Text: Grey Background: Black and also Plain Text Messages Color: Black.

#### Qubes OS Desktop
- Start / System Tools / Appearance / Styles: Adwaita-dark

#### Android M
- [Dark Phone Theme](https://www.phonearena.com/news/Finally-Android-M-scores-a-new-system-wide-dark-UI-theme_id69814)

## Commits

 - [A code block in a description reads in the dark theme](https://github.com/wekan/wekan/commit/19350f26110d4bdaceddd2d1d546a3f815d52612)
 - [Dark themes: greys, Card Settings, popups and sidebars readable again](https://github.com/wekan/wekan/commit/a6b10e3592368633a8b6042422b450c6e785e4d8)
 - [Every board theme and every chosen colour is readable](https://github.com/wekan/wekan/commit/8b2114cd0f9501867c01521c7a6f78a02e44d549)
