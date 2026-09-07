# Admin Panel / People / Roles

Which board roles are allowed to perform each action — a checkbox list, not a table.
Admin Panel users (global admins) always have every right, whatever is ticked here.

Today there is one action, **Allow Invite to Board**: which of the nine per-board
roles may invite someone to a board they are on.

The same URL has a semantic Legacy HTML4 view when JavaScript drag and drop is
unavailable. Its signed checkbox fieldset, **All Board Members**, **Select none**,
**Save** and search controls work without JavaScript or cookies in natural Tab
order. The read-only status rows come from the same capability matrix as Jade and
the server's authorization rules.

Both views call one Global Admin-only service. It accepts only the nine fixed
board-role keys, removes duplicates in canonical order and updates the one exact
settings document. Direct DDP insert, update and remove attempts are denied and
reported as `RolesBleed` in Admin Panel / Problems / Security. The settings
publication is also Global Admin-only; ordinary runtime translation overrides use
a separate exact-language publication and never accept a MongoDB selector.

Everything a role may do *inside* a board is described in
[Members and Permissions](../../Members/Members.md).
