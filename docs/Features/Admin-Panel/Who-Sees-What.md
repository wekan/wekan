# Who sees and can do what

WeKan decides "is this here for me?" and "may I do this?" in several places, set by
different people. This page is the map: each layer, who sets it, and how the layers
combine. Every layer links to its own page.

## Two different questions

- **Visibility** - is a feature or a field *shown*? Hiding never deletes data and
  never changes what anybody may do.
- **Permission** - may this person *do* it? Permissions are decided by roles, not
  by what is shown.

A hidden feature is not a permission, and a permission does not make a hidden
feature appear.

## Visibility: is it shown?

From the widest layer to the narrowest. A narrower layer can only hide more; it can
never show what a wider one hides.

| Layer | Who sets it | Where | Decides |
| --- | --- | --- | --- |
| Instance features | Site admin | [Settings / Features](Settings/Features.md) | Which optional features (board view groups, helpers) exist on this WeKan at all. Pilot users still see the disabled ones. |
| Instance card fields | Site admin | [Settings / Features / Card fields](Settings/Features.md#card-fields) | Which card fields are shown on any board. |
| Feature profile | Site admin | [Settings / Feature profiles](Settings/Feature-Profiles.md) | Which of the instance's features chosen users, teams and organizations do not see. Opt-in: nobody without a profile is affected, and the user is told. |
| Board | Board admin | [Board Settings / Card](../Board-Sidebar/Board-Settings/Card.md) and [Board View](../Board-Sidebar/Board-Settings/Board-View.md) | Which fields this board shows on cards and minicards, and which views it offers. |
| Member | The user | [Member Settings](../Member-Settings/README.md) | Personal choices, for example hiding system messages. |

So a board view is in a user's Board View menu only when the instance offers it,
their feature profile (if any) does not hide it, and the board offers it.

## Permission: may they do it?

| Layer | Who sets it | Where | Decides |
| --- | --- | --- | --- |
| Admin Panel access | Site admin | [People / People](People/People.md) | Site administrators manage the whole instance; Organization administrators only their own organization's scope. |
| Board role | Board admin | [Members and Permissions](../Board-Sidebar/Members/Members.md), [Board roles](../Board-Sidebar/Members/Roles.md) | What a member may do on one board: Board admin, Normal, Read-only, Comment-only, Worker, Assigned-only and the rest. |
| List exception | Board admin | [List permissions](../Lists/List-Permissions.md) | For one list, a role may do more or less than the board allows. A refusing list also refuses bulk writes, rule actions, and deleting or moving the list or its swimlane. A board admin is never restricted. |
| Instance-wide role rules | Site admin | [People / Roles](People/Roles.md) | Which board roles may invite people to a board. |
| Organization and team rules | Site admin | [People / Organizations](People/Organizations.md), [People / Teams](People/Teams.md) | Shared templates, members propagated to boards, members synced from the identity provider, and adding members only from the same organization or team. |
| Server-wide switches | Site admin | [Settings / Security](Settings/Security.md), [Activities and notifications](Settings/Activities-and-Notifications.md), [Delete](Settings/Delete.md) | Import and export, rich text rendering, activity tracking, notifications and watching, permanent delete - for everybody. |

## When somebody says "it is missing"

1. **Their member menu** says *Your feature profile ... hides N features*? Then it
   is their [feature profile](Settings/Feature-Profiles.md).
2. Missing for **everybody**? [Settings / Features](Settings/Features.md) has it
   unticked.
3. Missing on **one board** only? The board's
   [Board Settings](../Board-Sidebar/Board-Settings/README.md) do not show it.
4. **Shown but refused** when they use it? That is a permission: their
   [board role](../Board-Sidebar/Members/Members.md) or a
   [list exception](../Lists/List-Permissions.md).
