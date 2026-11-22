# Admin Panel / Settings / Accessibility

## What it is

Whether the accessibility page is enabled, and its title and content. The page
at `/accessibility` is where this WeKan tells its users how accessible it is -
an accessibility statement - and who to contact about a barrier.

For what WeKan does about accessibility in general — keyboard use, screen readers,
contrast, right-to-left languages — see
[Accessibility](../../General/Accessibility/Accessibility.md).

## Read more

- [Web accessibility](https://en.wikipedia.org/wiki/Web_accessibility) on
  Wikipedia.
- [WCAG](https://www.w3.org/WAI/standards-guidelines/wcag/) - the W3C Web
  Content Accessibility Guidelines that an accessibility statement usually
  reports against.
- [Accessibility](../../General/Accessibility/Accessibility.md) - what WeKan
  itself does.

## How to use it

1. Open **Admin Panel / Settings / Accessibility**
   (`/admin/settings/accessibility`). The first row, **Accessibility**, is a
   link to the page itself.
2. Tick **Accessibility page enabled**. The tick is saved at once, and the
   two text boxes appear.
3. Write **Accessibility title** and **Accessibility content**. The content is
   shown with the same viewer as card descriptions, so Markdown works.
4. Press **Save**.
5. Members now see **Accessibility** with the universal-access icon in the
   board's right sidebar; it opens `/accessibility`.

Unticking hides the sidebar link. A signed-in user who opens `/accessibility`
while it is off sees *"Accessibility info has not been added yet"*.

## How the numbers are calculated

This pane has no numbers of its own. The only default is that the page is off
(`enabled: false`); an empty title or content falls back to the translated
defaults **Accessibility title** and **Accessibility content**.

## How it works in WeKan

- **Collection** `accessibilitySettings`
  ([models/accessibilitySettings.js](../../../../models/accessibilitySettings.js)):
  `enabled`, `title`, `body`, `createdAt`, `modifiedAt`.
- **Admin pane**: template `accessibilitySettings` in
  [settingBody.jade](../../../../client/components/settings/settingBody.jade),
  handlers in [settingBody.js](../../../../client/components/settings/settingBody.js).
- **Permission**: only a site administrator may update the document
  ([server/permissions/accessibilitySettings.js](../../../../server/permissions/accessibilitySettings.js));
  the [publication](../../../../server/publications/accessibilitySettings.js)
  sends it to every client, because the page is for everyone.
- **The page**: [client/components/main/accessibility.jade](../../../../client/components/main/accessibility.jade)
  and [accessibility.js](../../../../client/components/main/accessibility.js),
  routed at `/accessibility` in [config/router.js](../../../../config/router.js);
  its title in the header bar comes from `accessibilityPageTitle()` in
  [client/lib/pageTitleSources.js](../../../../client/lib/pageTitleSources.js).
  It is shown only to a signed-in user.
- **Sidebar link**: [client/components/sidebar/sidebar.jade](../../../../client/components/sidebar/sidebar.jade).

## Commits

 - [The page title in the header bar comes from this setting](https://github.com/wekan/wekan/commit/9f42cb1aaa2ce2c670c908cacc762503c9237257)
 - [The accessibility page at /accessibility, its Admin Panel settings and the sidebar link](https://github.com/wekan/wekan/commit/d83ce5e6335c175f2f4a384f6090c18c7f860555)
 - [The first accessibility statement work](https://github.com/wekan/wekan/commit/729d8fb435d1ef3b8f614467d5237dd2cd89c4f7)
