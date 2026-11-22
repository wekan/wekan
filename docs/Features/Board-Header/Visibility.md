# Board header / Visibility

## What it is

Visibility decides who can see a board: only the people added to it
(**Private**), every signed-in user of this WeKan (**Signed-in users**), or
anybody with the link (**Public**). Editing stays with the board's members,
unless the board admin also lets every signed-in user edit it. The control is
the first of a board's header controls, after the fold caret, and shows the
board's current setting.

## Read more

- [Access control](https://en.wikipedia.org/wiki/Access_control) on Wikipedia -
  deciding who may view or change something.
- [Admin Panel / Settings / Appearance](../Admin-Panel/Settings/Appearance.md) -
  where an administrator allows or forbids the open settings.
- [Who sees what](../Admin-Panel/Who-Sees-What.md),
  [Public boards](../All-Boards/Public.md) and
  [Board roles](../Board-Sidebar/Members/Roles.md).

## How to use it

The control is an icon and the board's current visibility — **Private**,
**Signed-in users** or **Public**. The label and the tooltip are the same
expression, `{{_ currentBoard.permission}}`, so they always name the current
setting. See [the header](../Header-Bar/Header.md) for where the control sits
and when its label is hidden.

**Change a board's visibility** (board admin):

1. Open the board.
2. Click the visibility button (the lock, people or globe icon) in the header
   bar. The popup opens.
3. Click **Private**, **Signed-in users** or **Public**. The current choice has
   a check mark.
4. The popup closes and the button shows the new setting.

**Let every signed-in user edit** (board admin, on a Signed-in users or Public
board, when the administrator allows it):

1. Open the visibility popup as above.
2. Tick **Everyone signed in can edit** below the line.

**Who can change it.** Every signed-in user sees the button. Only a **board
admin** gets the `js-change-visibility` class that opens the popup; for
everybody else the button is drawn `is-disabled` and does nothing. The popup's
choices are saved with `Boards.updateAsync`, which the server allows only for a
board admin.

### The popup

`boardChangeVisibilityPopup` in `client/components/boards/boardHeader.jade`.
Each row has an icon, the name, a check mark on the current choice, and a
description:

| Choice | Stored `permission` | Description |
| --- | --- | --- |
| Private (`fa-lock`) | `private` | Only people added to the board can view and edit it. |
| Signed-in users (`fa-users`) | `instance` | Every signed-in user of this WeKan can view the board; it is never shown to people who are not signed in. Only board members can edit. |
| Public (`fa-globe`) | `public` | Visible to anyone with the link, and can show up in search engines. Only board members can edit. |

Choosing a row calls `board.setVisibility()` and closes the popup.

- **Signed-in users** and **Public** are offered only while Admin Panel /
  Settings / Appearance does not allow private boards only
  (`tableVisibilityMode-allowPrivateOnly`). With that setting on, the popup
  shows only Private, and a board that is already public or signed-in-users is
  not displayed: the board page shows the `tableVisibilityMode-allowPrivateOnly`
  text instead.
- The Private and Public descriptions can be replaced by an administrator in
  [Admin Panel / Settings / Appearance](../Admin-Panel/Settings/Appearance.md)
  (`customPrivateBoardDesc`, `customPublicBoardDesc`). Empty uses the default
  text.

### Everyone signed in can edit

Below a rule, the popup offers one checkbox, **Everyone signed in can edit**,
when both are true:

- the board is **Signed-in users** or **Public**, and
- Admin Panel / Settings / Appearance allows it
  (`tableVisibilityMode-allowInstanceEditing`).

Ticking it toggles the board's `allowsInstanceEditing`. Signed-in users who
are not members can then add, edit, move and comment on cards, and become
Normal members when they do.

The same visibility list, without this checkbox, is used in the Create Board
form (`createBoardForm`), where it sets the new board's visibility.

## How the numbers are calculated

Visibility has no numbers of its own. It has three values (`private`,
`instance`, `public`) and two administrator switches that limit them. Whether a
board can be read without being a member is `readableWithoutMembership()` in
[models/lib/boardPermission.js](../../../models/lib/boardPermission.js): a
`public` board always, an `instance` board only for a signed-in user, a
`private` board never.

## How it works in WeKan

- **Templates**: `boardHeaderButtons`, `boardVisibilityList` and
  `boardChangeVisibilityPopup` in
  [client/components/boards/boardHeader.jade](../../../client/components/boards/boardHeader.jade);
  helpers and handlers (`notAllowPrivateVisibilityOnly`, `privateDesc`,
  `publicDesc`, `instanceEditingOffered`, `notDisplayThisBoard`) in
  [client/components/boards/boardHeader.js](../../../client/components/boards/boardHeader.js).
  The administrator's texts are chosen by
  [imports/i18n/lib/visibilityDesc.js](../../../imports/i18n/lib/visibilityDesc.js).
- **Data**: the board's `permission` field and `allowsInstanceEditing`
  ([models/boards.js](../../../models/boards.js), `setVisibility()`); the
  administrator switches are documents of `TableVisibilityModeSettings`,
  subscribed as `tableVisibilityModeSettings`.
- **Permissions**: the update is allowed only for a board admin by `Boards.allow`
  in [server/permissions/boards.js](../../../server/permissions/boards.js). The
  same visibility rule is used by the publications and by the
  [Watch](Watch.md) method, through
  [models/lib/boardVisibilitySelectors.js](../../../models/lib/boardVisibilitySelectors.js).
- **Tests**: [tests/boardVisibility.test.cjs](../../../tests/boardVisibility.test.cjs),
  [tests/visibilityDesc.test.cjs](../../../tests/visibilityDesc.test.cjs),
  [tests/instanceEditing.test.cjs](../../../tests/instanceEditing.test.cjs),
  [tests/boardsVisibilitySettings.test.cjs](../../../tests/boardsVisibilitySettings.test.cjs)
  and the browser spec
  [tests/playwright/specs/instance-board-visibility.e2e.js](../../../tests/playwright/specs/instance-board-visibility.e2e.js).

## Related

- [Admin Panel / Settings / Appearance](../Admin-Panel/Settings/Appearance.md)
- [Who sees what](../Admin-Panel/Who-Sees-What.md)
- [Public boards](../All-Boards/Public.md)
- [Board roles](../Board-Sidebar/Members/Roles.md)

## Commits

 - [The Private and Public descriptions are shown again](https://github.com/wekan/wekan/commit/437da1d9c7a7371831942125d5e0715131061deb)
 - [Boards every signed-in user may edit](https://github.com/wekan/wekan/commit/7595727917d436ea71969d6d74d166b42b38ed4e)
 - [Board imports honour private boards only](https://github.com/wekan/wekan/commit/3af89a6a0062be23a1b405b22eb37ffa45e1ff9c)
 - [Semi-open boards, visible to every signed-in user](https://github.com/wekan/wekan/commit/f122a8287c3212388ee157315369157b3f64c94a)
 - [Private boards only is enforced in every server method that creates a board](https://github.com/wekan/wekan/commit/962debc12d7a7351635cfd6e00aff07fc1b986e8)
 - [The visibility button shows its name](https://github.com/wekan/wekan/commit/7ac766992f79878f114434844ecbaa6b68091e9e)
 - [Fix a board stuck on Private, and the Public Board menus](https://github.com/wekan/wekan/commit/9f3c21657663df8c8af9c057639f9412084fcbe9)
 - [An Admin Panel setting to allow private boards only](https://github.com/wekan/wekan/commit/9bb1425a81ed108eac63908cf5d5a99035720cf0)
