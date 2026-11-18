# Member Settings / Support

Open the top-right username menu, then **Support**. It is a link, not a
popup: it opens the page `/support`.

The entry is shown only when a site administrator has enabled the support page
under **URL / Support** in
[Admin Panel / Settings / Appearance](../Admin-Panel/Settings/Appearance.md#url),
where its title and content are written as well.

## The page

- Enabled: the content the administrator wrote, rendered as Markdown.
- Not enabled (for example opened by its address): *Support info has not been
  added yet*.
- The page template also has a **public** case (readable signed out) and a
  *Support info is only for logged in users.* message, but the `/support`
  route itself sends a signed-out visitor to the sign-in page first
  (`ensureSignedInUnlessSandstorm` in `config/router.js`), so in the current
  code only signed-in users reach it.

The separate **Help** entry higher in the menu is the **Custom Help Link URL**
from the same Appearance pane, opened in a new tab.

For developers: the page is `support` in `client/components/main/support.*`,
the route in `config/router.js`; the settings are `supportPageEnabled`,
`supportPagePublic` and `supportPageText`.
