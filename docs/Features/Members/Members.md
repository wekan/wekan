# Members and Permissions

Boards can have many members, so you can collaborate with your team. You add
members to a board, and optionally assign them to individual cards.

## Member settings menu

Click your username/avatar in the top right corner to open your member settings.

![Wekan member settings screenshot](../Login/screenshot-member-settings.png)

> NOTE: The duplicate "Edit Notification" entry was removed from this menu in
> [PR #1948](https://github.com/wekan/wekan/pull/1948), so Edit Notification is only
> available from the menu shown below.

### Edit Notification

![Wekan edit notification screenshot](../Login/screenshot-member-settings-edit-notification.png)

### Change settings (for example hide system messages)

![Wekan hide system messages screenshot](../Login/screenshot-member-settings-hide-system-messages.png)

## Board members

Click a member's initials or avatar to filter the board by that member, or to open
the member's permission settings.

![Wekan member filter screenshot](../Filter/screenshot-member-filter.png)

## Permissions: the board roles

Click a member's initials or avatar to set their role on the board. There are
nine, and the short version is:

- **Board admin** — full control of the board, including its settings and who is
  on it.
- **Normal** — can create and edit cards, lists and swimlanes, and comment.
- **No comments** — as Normal, but cannot comment.
- **Comment only** — can only add comments, not edit anything.
- **Worker** — can move cards and comment, but not edit them.
- **Read only** — can see the board and nothing else.
- ...and an **assigned only** variant of Normal, Comment only and Read only, which
  additionally sees *only the cards it is assigned to*.

**[Board roles — what each one may and may not do](Roles.md)** is the full
comparison table, column by column, written from the code — including the places
where a role does not yet do what its name says.

![Wekan permissions screenshot](../Login/screenshot-member-comment-only.png)

## Share a board with an email Domain

In the board members sidebar there is a **Domains** tab. From it you can share a
board with a whole email **domain** (for example `example.com`), so every user with
a verified email address on that domain becomes a member of the board. This is in
addition to sharing with individual members, Organizations and Teams.

## Notify on assign

When a user is added as a card **member** or **assignee**, they can be notified
directly. This is controlled by the environment variable:

- `NOTIFY_ON_ASSIGN` (default `true`) — when `true`, the user added as a card
  member/assignee gets a direct notification. Set to `false` to disable these
  notifications instance-wide. On Snap use `notify-on-assign`.

## Restrict board members to the same Organization or Team

On multi-tenant instances you can require that a board's members share an Organization
or a Team. There is one admin checkbox per kind -
[`boardMembersFromSameOrgOnly`](../Admin-Panel/People/Organizations.md) in Admin Panel /
People / Organizations and
[`boardMembersFromSameTeamOnly`](../Admin-Panel/People/Teams.md) in / Teams -
and when either is on, a user can only be added to a board if they share an enabled
kind with the inviter or with an active board member (site admins bypass this). See
[Admin Panel](../Admin-Panel/Admin-Panel.md).

## Related

- [Adding Users](../Login/Adding-users.md)
- [Admin: Impersonate user](../Login/Impersonate-user.md)
- [Admin Panel](../Admin-Panel/Admin-Panel.md)
