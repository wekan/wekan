# Member Settings / Support

## What it is

**Support** opens the site's own support page: whatever a site administrator
wrote there - who to contact, opening hours, instructions - rendered as
Markdown. It is a link, not a popup: it opens the page `/support`. The entry is
shown only when the support page is enabled.

## Read more

- [Technical support](https://en.wikipedia.org/wiki/Technical_support) and
  [Markdown](https://en.wikipedia.org/wiki/Markdown) on Wikipedia.
- [Admin Panel / Settings / Appearance](../Admin-Panel/Settings/Appearance.md#url) -
  where the page is enabled and written.

## How to use it

**As a member**

1. Click your username or avatar at the top right.
2. Click **Support**. The page opens.

**As a site administrator**

1. Open the **URL** group of
   [Admin Panel / Settings / Appearance](../Admin-Panel/Settings/Appearance.md#url).
2. Tick **Support page enabled**.
3. Tick **Public** if people who are not signed in may read it.
4. Write the title and the content (Markdown), and save.

**What the page shows**

- Enabled: the content the administrator wrote, rendered as Markdown.
- Not enabled (for example opened by its address): *Support info has not been
  added yet*.
- Signed out, when the page is not **Public**: *Support info is only for logged
  in users.*, and the server sends no text of it.
- Signed out, when the page is **Public**: the same as for a signed-in member.

Earlier versions of this page said the `/support` route sent a signed-out
visitor to the sign-in page first, so only signed-in users reached it. Since
2026-11-20 the route has no sign-in guard: the **Public** setting decides, and
the publication sends `supportPageText` to a signed-out visitor only when the
page is Public.

The separate **Help** entry higher in the menu is the **Custom Help Link URL**
from the same Appearance pane, opened in a new tab.

## How the numbers are calculated

This feature has no numbers of its own; it is on or off, public or not, and
shows the text as written.

## How it works in WeKan

- **Page:** the template `support` in
  [client/components/main/support.jade](../../../client/components/main/support.jade)
  and [support.js](../../../client/components/main/support.js) (helpers
  `isSupportEnabled`, `isSupportPublic`, `supportContent`).
- **Route:** `/support` (name `support`) in
  [config/router.js](../../../config/router.js), without a sign-in guard.
- **Settings:** `supportPageEnabled`, `supportPagePublic`, `supportTitle` and
  `supportPageText` of the settings document, edited in
  [client/components/settings/settingBody.jade](../../../client/components/settings/settingBody.jade)
  and published by
  [server/publications/settings.js](../../../server/publications/settings.js),
  which leaves the text out for a signed-out visitor of a page that is not
  public.
- **Menu entry:** shown by the helper `isSupportPageEnabled` in
  [client/components/users/userHeader.jade](../../../client/components/users/userHeader.jade).
- **Tests:** [tests/supportPageSignedOut.test.cjs](../../../tests/supportPageSignedOut.test.cjs)
  and the browser test
  [tests/playwright/specs/support-page-signed-out.e2e.js](../../../tests/playwright/specs/support-page-signed-out.e2e.js).

## Commits

 - [a signed-out visitor sees a Public support page, and no text of one that is not](https://github.com/wekan/wekan/commit/0ccf182001e64d1949b1cec94604cecf08537338)
 - [the support page added to the Admin Panel settings](https://github.com/wekan/wekan/commit/a7400dca4503961267cc5fd6a1c8efaa78668f77)
