# Admin Panel / People / People

Every user on the instance: username, e-mail, whether they are an admin, whether the
account is active, lockout status, and when it was created.

The controls row has, beside the search box, a **filter** — all, locked, active,
inactive, admin — and two actions: **Unlock all users** and **Teams** (add or remove
teams for the selected users). The total is the whole result set, not the page.

Each row has **Edit** and a ⋯ menu; the avatar can be changed from the row; the
active and lockout states are clickable. The **New** link is the first column's
header, so a first user can always be created.

## Legacy HTML4

The same URL has a semantic, single-table view when JavaScript drag and drop is
unavailable. It retains literal search, the five filters, the complete result
count, fixed 25-person paging and the nine modern columns. Each row exposes the
account detail, desired active-state control, lock status and confirmed unlock as
signed POST controls that work without JavaScript or cookies. Country buttons
open the available city, IPv4, IPv6 and first/last-seen details in the same table.

Both renderers obtain the page through one tenant-aware service with a fixed user
field projection. A site administrator sees the instance; an Organization
administrator sees only users in Organizations they administer and can never
manage a site administrator. Search text is bounded and escaped before it becomes
a literal regular expression, and refused reads or writes are recorded in Admin
Panel / Problems / Security with available request identity. Creation and
complete account editing also use that boundary in both views.
The labelled HTML4 fieldset retains full name, username, initials, primary e-mail
and verification, import usernames, administrator and active state,
authentication method, Organization and Team membership, and password. The
server derives Organization and Team display names from exact submitted IDs,
allows only enabled authentication methods, preserves secondary e-mail addresses,
checks identity uniqueness case-insensitively, prevents disabling/demoting the
current or last administrator, rolls back a failed creation, and propagates newly
gained Team board membership through the same helper used by existing methods.
The remaining controls are equivalent too. A bounded multipart avatar upload is
decoded and stored as GIF; existing avatars can be selected or removed with
confirmation, and initials can replace the image. A labelled bulk fieldset adds
or removes one exact Team for selected page users and propagates gained Team
boards. User deletion and impersonation are confirmed, site-administrator-only
operations; deletion protects the current and last administrator, while
impersonation rotates the same cookieless HTML4 session to the target identity and
records the existing impersonation audit row. Attempts to select or remove
another person's avatar are blocked, Security-reported and account-blocking like
other high-severity protection events.

## Related

- [Locked Users](Locked-Users.md)
- [Members and Permissions](../../Members/Members.md)
- [Login](Login.md) — whether users may change their username or delete themselves.
