# Who sees and can do what

## What it is

WeKan decides "is this here for me?" and "may I do this?" in several places, set
by different people. This page is the map: each layer, who sets it, and how the
layers combine. Every layer links to its own page.

There are two different questions:

- **Visibility** - is a feature or a field *shown*? Hiding never deletes data and
  never changes what anybody may do.
- **Permission** - may this person *do* it? Permissions are decided by roles, not
  by what is shown.

A hidden feature is not a permission, and a permission does not make a hidden
feature appear.

## Read more

- [Access control](https://en.wikipedia.org/wiki/Access_control) and
  [Role-based access control](https://en.wikipedia.org/wiki/Role-based_access_control)
  on Wikipedia - the idea behind board roles.
- [Feature toggle](https://en.wikipedia.org/wiki/Feature_toggle) on Wikipedia -
  the idea behind instance features, pilot users and feature profiles.
- [Principle of least privilege](https://en.wikipedia.org/wiki/Principle_of_least_privilege)
  on Wikipedia.
- WeKan: [Settings / Features](Settings/Features.md),
  [Settings / Feature profiles](Settings/Feature-Profiles.md),
  [Members and Permissions](../Board-Sidebar/Members/README.md),
  [Board roles](../Board-Sidebar/Members/Roles.md) and
  [List permissions](../Lists/List-Permissions.md).

## How to use it

### Visibility: is it shown?

From the widest layer to the narrowest. A narrower layer can only hide more; it
can never show what a wider one hides. The one deliberate exception is the pilot
preview in the first row: pilot users (and site admins, when the preview is on)
still see a feature the instance has turned off, so they can try it before
everybody gets it.

| Layer | Who sets it | Where | Decides |
| --- | --- | --- | --- |
| Instance features | Site admin | [Settings / Features](Settings/Features.md) | Which optional features (board view groups, helpers) exist on this WeKan at all. Pilot users still see the disabled ones. |
| Instance card fields | Site admin | [Settings / Features / Card fields](Settings/Features.md#card-fields) | Which card fields are shown on any board. |
| Feature profile | Site admin | [Settings / Feature profiles](Settings/Feature-Profiles.md) | Which of the instance's features chosen users, teams and organizations do not see. Opt-in: nobody without a profile is affected, and the user is told. A profile applies to a pilot user too. |
| Board | Board admin | [Board Settings / Card](../Board-Sidebar/Board-Settings/Card.md) and [Board View](../Board-Sidebar/Board-Settings/Board-View.md) | Which fields this board shows on cards and minicards, and which views it offers. |
| Member | The user | [Member Settings](../Member-Settings/README.md) | Personal choices, for example hiding system messages. |

So a board view is in a user's Board View menu only when the instance offers it
(or the user is a pilot), their feature profile (if any) does not hide it, and
the board offers it.

A layer that turns something off for the whole instance - a feature, a login
method, import - is refused by the server too, not only hidden; the card
field and board layers are display only on purpose. Which is which, and why:
[Settings enforced on the server](Settings-Enforced-On-Server.md).

### Permission: may they do it?

| Layer | Who sets it | Where | Decides |
| --- | --- | --- | --- |
| Admin Panel access | Site admin | [People / People](People/README.md) | Site administrators manage the whole instance; Organization administrators only their own organization's scope. |
| Board role | Board admin | [Members and Permissions](../Board-Sidebar/Members/README.md), [Board roles](../Board-Sidebar/Members/Roles.md) | What a member may do on one board: Board admin, Normal, Read-only, Comment-only, Worker, Assigned-only and the rest. |
| List exception | Board admin | [List permissions](../Lists/List-Permissions.md) | For one list, a role may do more or less than the board allows. A refusing list also refuses bulk writes, rule actions, and deleting or moving the list or its swimlane. A board admin is never restricted. |
| Instance-wide role rules | Site admin | [People / Roles](People/Roles.md) | Which board roles may invite people to a board. |
| Organization and team rules | Site admin | [People / Organizations](People/Organizations.md), [People / Teams](People/Teams.md) | Shared templates, members propagated to boards, members synced from the identity provider, and adding members only from the same organization or team. |
| Server-wide switches | Site admin | [Settings / Security](Settings/Security.md), [Activities and notifications](Settings/Activities-and-Notifications.md), [Delete](Settings/Delete.md) | Import and export, rich text rendering, activity tracking, notifications and watching, permanent delete - for everybody. |

### When somebody says "it is missing"

1. **Their member menu** says *Your feature profile ... hides N features*? Then it
   is their [feature profile](Settings/Feature-Profiles.md).
2. Missing for **everybody**? [Settings / Features](Settings/Features.md) has it
   unticked.
3. Missing on **one board** only? The board's
   [Board Settings](../Board-Sidebar/Board-Settings/README.md) do not show it.
4. **Shown but refused** when they use it? That is a permission: their
   [board role](../Board-Sidebar/Members/README.md) or a
   [list exception](../Lists/List-Permissions.md).

## How the numbers are calculated

This map has one number of its own: the **N** in the member menu's
"Your feature profile `__name__` hides `__count__` features". It is the length of
the profile's `hidden` list (`featureProfileNotice` in
[models/lib/featureProfiles.js](../../../models/lib/featureProfiles.js)); no
notice is shown when the user has no profile or it hides nothing. Which profile
applies is decided in a fixed order: the profile assigned to the user, else the
first profile that names one of their teams, else the first that names one of
their organizations. The limits of each layer (for example at most 50 feature
profiles) are on that layer's own page.

## How it works in WeKan

- **Instance features** -
  [models/lib/instanceFeatures.js](../../../models/lib/instanceFeatures.js):
  `isFeatureEnabled` (an explicit on/off wins; with no decision a feature is on,
  unless approval of new features is required), `canPreviewFeatures` (pilot users
  with `featurePreview`, and site admins when `featurePreviewAdmins` is on), and
  `isFeatureAvailable`, which first asks the feature profile and then returns
  enabled-or-preview. `isBoardViewAvailable` maps a board view to its feature.
- **Feature profiles** -
  [models/lib/featureProfiles.js](../../../models/lib/featureProfiles.js):
  `profileForUser`, `hiddenByProfile` and `featureProfileNotice`; the notice is
  drawn in [client/components/users/userHeader.jade](../../../client/components/users/userHeader.jade).
- **Card fields** -
  [models/lib/cardFieldVisibility.js](../../../models/lib/cardFieldVisibility.js).
- **Board roles** -
  [models/lib/boardRoleCapabilities.js](../../../models/lib/boardRoleCapabilities.js)
  (`memberRoleOf`, `memberCan`): one capability table for every role.
- **List exceptions** -
  [models/lib/listPermissions.js](../../../models/lib/listPermissions.js):
  `listCan` takes the list's `roleExceptions[<role>]` for `write` or `comment`
  (a card move counts as `write`) and otherwise falls back to `memberCan`. A
  board admin has no exception; a non-member on an `instance` or `public` board
  is the `signed-in` role.
- **Tests:** [tests/adminPanelStructure.test.cjs](../../../tests/adminPanelStructure.test.cjs)
  checks this page links the Features, Feature profiles, Members and List
  permissions pages; the rules themselves are pinned by
  [tests/listPermissions.test.cjs](../../../tests/listPermissions.test.cjs),
  [tests/featureProfiles.test.cjs](../../../tests/featureProfiles.test.cjs) and
  [tests/instanceFeatures.test.cjs](../../../tests/instanceFeatures.test.cjs).

## Commits

 - [Feature profiles hide features from chosen users, teams and organizations, and this map of the layers](https://github.com/wekan/wekan/commit/fc21b0b177dc8f8902efa39d0f89c8b041c7cf2d)
 - [The Admin Panel gets one question per tab, and the docs mirror the menus](https://github.com/wekan/wekan/commit/a8fd080bc8ece74157e5f2e9e436fa2dafe76348)
 - [Per-list permission exceptions on top of the board role](https://github.com/wekan/wekan/commit/7595727917d436ea71969d6d74d166b42b38ed4e)
 - [Custom board roles](https://github.com/wekan/wekan/commit/50bb989eb8d90ed9bfafbceb3f9f8e68e208116e)
 - [Instance card fields: which card fields every board shows](https://github.com/wekan/wekan/commit/03975e7d3108433cd222645e8bdc181978d7dd70)
 - [Instance features: administrators choose which optional features WeKan offers](https://github.com/wekan/wekan/commit/18d57b2b8f789b11409afbd485cff139adeb3095)
 - [Board roles: one capability table and a Roles Status pane](https://github.com/wekan/wekan/commit/efa534fddf5a9fbec0d3b663d8cbbd77ca9b161d)
