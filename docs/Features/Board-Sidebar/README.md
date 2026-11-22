# Right sidebar

## What it is

The right sidebar is the panel that opens at the right edge of a board. Its
main view holds **Board Settings**, the board's members, its labels, a
vertical-scrollbar preference and the board's activities. Keyboard shortcuts
and accessibility controls are at the top of the sidebar. The pages below
describe each part.

- [Board Settings](Board-Settings/README.md)
- [Members and permissions](Members/Members.md)
- [Labels and card content](../Cards/Cards.md)
- [Keyboard shortcuts](../General/Keyboard-Shortcuts/Keyboard-Shortcuts.md)
- [Accessibility](../General/Accessibility/Accessibility.md)
- [Activity rendering](../Board-Header/Board-Views/Activity-Rendering.md)
- [Filter](Filter/README.md)
- [Archive](Archive/Archive-and-Delete.md)

## How to use it

1. Open a board and click the hamburger at the end of your username in the
   header bar (`js-toggle-page-sidebar` in
   [client/components/main/header.js](../../../client/components/main/header.js)).
   On a board it toggles the board's own sidebar, which opens with the
   members, the labels, **Enable vertical scrollbars** and, for a board admin,
   **Activities**.
2. Click **Board Settings** (the cog above the members) to open the board's
   settings menu; see [Board Settings](Board-Settings/README.md).
3. Drag the left edge of the sidebar (**Drag to resize sidebar**) to make it
   wider or narrower. On a phone it stays full width.
4. Click **Activities** (board admins) to show or hide the board's activity
   list under it.

**Show week of year (ISO 8601)** is now in **Board Settings / Date**, below
Save and a horizontal rule. It changes your week-number display preference.

See the pages above for the rest.

## How it works in WeKan

The sidebar is the `sidebar` template and its main view `homeSidebar` in
[client/components/sidebar/sidebar.jade](../../../client/components/sidebar/sidebar.jade),
with its code in
[client/components/sidebar/sidebar.js](../../../client/components/sidebar/sidebar.js).
Its width is dragged at its left edge: at least 280 pixels (`MIN_SIDEBAR_WIDTH`)
and at most 900 pixels or the window width less 80 pixels, whichever is
smaller; it is saved in the user's profile, or in the browser's localStorage
for someone not logged in on a public board. At 800 pixels or narrower the
sidebar is full width.

## Commits

 - [Original positions: a right-sidebar view from the board menu, in every language](https://github.com/wekan/wekan/commit/b9e28a8fbbd0f20ea3cc4d86f4e665fa00bc95be)
 - [Board sidebar: Members and Labels fold by their headings](https://github.com/wekan/wekan/commit/48cf269870c087f36137f1b4960712c0df1b6f39)
 - [Import: always create virtual users, map later from the sidebar; bound imports](https://github.com/wekan/wekan/commit/c0a1a27847f4e8928da175831d5c75b49fe6f3aa)
 - [Right sidebar: drag the edge to resize its width (desktop), saved per user](https://github.com/wekan/wekan/commit/354b7804b577c2ca92b479b7bd2ef595cc9212d3)
 - [Members: distinguish imported placeholders and inactive members on the avatar + sidebar (Increment 5)](https://github.com/wekan/wekan/commit/db90fb9e61aca4059318af773a31ec69fbb9b41f)
 - [Improved accessibility across all pages following WCAG 2.1 AA guidelines:   - Added a visible keyboard focus indicator ](https://github.com/wekan/wekan/commit/255de2062ff9b54393fd603bfc6cabddb8ede66a)
 - [Add User board access roles to Admin Panel / People / Roles. A new global "Roles" tab in Admin Panel / People lets a ](https://github.com/wekan/wekan/commit/c956ab5a4e2d675641f8c74df2dcde675474ab06)
 - [Moved migrations from opening board to right sidebar / Migrations](https://github.com/wekan/wekan/commit/1b25d1d5720d4f486a10d2acce37e315cf9b6057)
 - [Fix UI issues of Right Sidebar / Subtasks Settings and Card Settings](https://github.com/wekan/wekan/commit/45537ede870eca59ad72cd7ad013a12f60032df4)
 - [Feature: Accessibility page at /accessibility. Settings at Admin Panel. When enabled, link at right sidebar](https://github.com/wekan/wekan/commit/d83ce5e6335c175f2f4a384f6090c18c7f860555)
 - [Add show week of year toggle to sidebar](https://github.com/wekan/wekan/commit/25ad901fb3017ded51d356c186672749ec39e9ce)
 - [Keyboard Shortcuts Enable/Disable is now at Right Sidebar, where already was list of Keyboard Shortcuts](https://github.com/wekan/wekan/commit/275ac445d0cd6f817dd2281aacc27ca7d30b17eb)
 - [Remove non-required sidebar-shadow div in favor of direct sidebar background](https://github.com/wekan/wekan/commit/65015ea7c7728055769a3868dfb7c21016bd0bb7)
 - [Revert "Revert some scrollbar, sidebar and list width changes."](https://github.com/wekan/wekan/commit/a36e80099aab6fcc235714dfbf169adaa94c09d4)
 - [Revert some scrollbar, sidebar and list width changes](https://github.com/wekan/wekan/commit/096fe130f68e0d8d082d309901c75ed04285b7e2)
 - [Sidebar overhaul - change position to absolute, fix weird style bugs, disable scrollbar](https://github.com/wekan/wekan/commit/b7e8f796a31bb17ec94d86429bcbf52d70789f7b)
 - [At right sidebar, moved Minicard Settings to Card Settings popup](https://github.com/wekan/wekan/commit/2f2a039e3c1957b8921f3800315508d4f51c21b7)
 - [Speed up board loading, skip loading the full sidebar](https://github.com/wekan/wekan/commit/f483b162ceadf65b01f05ee7c63f7fd8fe9fac14)
 - [Moved Keyboard Shortcuts from bottom to top of sidebar](https://github.com/wekan/wekan/commit/659a65b8b919a49ba0beef5cc53d8e61e0f794aa)
 - [Hide minicard label text: per user checkbox setting at sidebar](https://github.com/wekan/wekan/commit/f7e0b837d394d55d66d451c34f43fa8afd357e5b)
