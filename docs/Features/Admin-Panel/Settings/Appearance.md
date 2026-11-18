# Admin Panel / Settings / Appearance

How this WeKan looks: what All Boards shows, dates, the URLs it links to, its
product name, colours and logos. Address: `/admin/settings/appearance`.

Until 2026-11-19 this pane was **Visibility**, and it also held which features
the instance offers. Those are [Features](Features.md) and
[Feature profiles](Feature-Profiles.md) now, and `/admin/settings/visibility`
redirects here.

Each group has its own **Save** directly above the rule that closes it. A Save
writes only its own group's fields, so saving one cannot carry half-typed edits
from another.

## All Boards: Hide

Each row is ticked when the thing is **hidden**.

- **Public boards** — hide them: only private boards may be created, and existing
  public boards are not offered. This is the setting stored as
  `tableVisibilityMode-allowPrivateOnly`; a board you may not open says so with the
  same string. ([Wekan v5.55 and newer](../../../../CHANGELOG.md#v555-2021-08-31-wekan-release))

  <img src="allow-private-boards-only.png" width="60%" alt="Allow private boards only" />

- **Boards that every signed-in user can edit** (#4575). This row is ticked when
  the feature is **allowed**, not hidden, and it is off by default. When it is
  on, a board admin can open an **Instance** or **Public** board to editing by
  every signed-in user: in the board's visibility popup, tick **Everyone signed
  in can edit**.

  Such a user may add, edit and move cards and comment, like a **Normal**
  member. They can never change the board's settings, members or roles. Their
  first edit makes them a Normal member, so the member list shows who has
  edited, and a board admin can change their role or remove them like any other
  member. A removed user stays removed.

  Rules, webhooks, email and list sync do not get these rights: they act only
  for members. The setting is stored as
  `tableVisibilityMode-allowInstanceEditing`. Unticking it takes the right away
  from every board at once; members who have already joined keep their
  membership.
- **Board activities** — do not show the activity feed on All Boards. One global
  setting, read once by the feed, so turning it off restores each board's own value.
- **Card counter list** — hide the per-list card counts on All Boards.
- **Board member list** — hide the member avatars on All Boards.
- **Date Format for everyone** — check this and choose `YYYY-MM-DD`,
  `DD-MM-YYYY`, or `MM-DD-YYYY`, then save. Cards use that format for members
  and anonymous viewers, overriding personal date-format preferences. Opened
  cards show **Date** instead of **Date Format** and hide the format dropdown.
  Unchecking restores personal formats; stored dates and calendar choices
  are unchanged.
- **Wait Spinner** — which spinner is shown while something loads. See
  [Wait Spinners](../../General/Troubleshooting/Wait-Spinners.md).

## URL

- **Support** — the link to `/support`, whether the page is enabled, whether it is
  public (readable without signing in), and its title and content.
- **Custom Help Link URL** — where the Help item points.
- **Custom legal notice page URL** — shown on the sign-in page.
- **Custom URL schemes** — the extra URL schemes that are turned into links
  automatically in card text, one per line. Anything not listed is left as plain
  text, which is what stops `javascript:` and friends becoming clickable.

  Each listed scheme opens the application the viewer's computer has for it, so
  a link is something that runs on the machine of whoever clicks it, written by
  anybody who can edit a card. Two kinds of scheme are never linked, even when
  listed here:

  - schemes that run code in the page or hide content in the URL: `javascript`,
    `vbscript`, `data`, `blob`, `about`, `view-source`, `mhtml` and the like;
  - operating-system handlers with a public code-execution history: `ms-msdt`
    (Follina, CVE-2022-30190), `search-ms` and `search`, `ms-officecmd`,
    `ms-appinstaller`, `ms-cxh` and `ms-cxh-full`, and `telnet` - the last step
    of a 2026 browser full chain, where Windows ran a `telnet.exe` from a
    directory any user can write to.

  Somebody writing a link to one of the second kind in a card title or
  description, a comment or a checklist is shown in **Admin Panel → Problems**
  (HandlerLink, CWE-939): nobody needs such a link, because it is never
  clickable. The text is saved as written, and nothing is said to the writer.

  `file` is allowed, because linking a shared folder is what the setting is for
  ([#3218](https://github.com/wekan/wekan/issues/3218)). On Windows a
  `file://server/share` link is opened over SMB, and a link to a server
  outside your network sends that server the clicker's Windows sign-in (an NTLM
  hash). List `file` only where everybody who can edit cards is trusted, and
  block outbound SMB (TCP 445) at the network edge.

## Product name

The name WeKan calls itself: the browser tab title, and the branding on the sign-in
page and the progress dashboards.

## Change color

The theme of this site: the same picker as Board Settings / Change Color and Member
Settings / Change color — the categories of swatches, the "Default theme" row and the
custom-colour wheels — described in
[Design / Change color](../../General/Theme/Change-Color.md). It applies as soon as you
click a colour; there is no Save button.

**The order of themes**, weakest first:

1. WeKan's default theme.
2. **This** setting — what everyone sees who has not chosen a theme of their own.
3. A user's own override, from Member Settings / Change color.

A board's own colour is not one of those layers: it is what a board looks like, and it
owns the board page. A user's own override still applies there, because they asked for
it everywhere.

The line under the section title, *"Override that applies to all tenants"*, is there
for a site admin: an Organization that has set a colour of its own keeps it on its own
domains, and every Organization that has not inherits this one. An Organization's own
admin sees this section — and only this section of the pane — and sets that
Organization's colour. See [Multitenancy](../../../Design/Multitenancy/Multitenancy.md).

## Logo

- **Hide Logo** — do not show it at all.
- **Custom Login Logo Image URL** and **Link URL**, and the **text below** it.
- **Custom Top Left Corner Logo Image URL**, **Link URL** and **Height** (default
  27 px; width auto).

Sizes: the top-left corner logo is 27 px high, the login logo 300 px wide, the other
dimension automatic; a logo a little larger or smaller is scaled. jpg, png, gif and
svg all work.

An image can be hosted anywhere (`https://example.com/logo.png`). To keep it inside
WeKan: create a public board, add a card, attach the image, then copy the image link
into the field here.

## Related

- [All Boards](../../All-Boards/Boards.md)
- [Members and Permissions](../../Board-Sidebar/Members/Members.md)
