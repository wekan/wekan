# Board header / Visibility

The first control of a board's header controls, after the fold caret: an icon
and the board's current visibility — **Private**, **Signed-in users** or
**Public**. The label and the tooltip are the same expression,
`{{_ currentBoard.permission}}`, so they always name the current setting. See
[the header](../Header-Bar/Header.md) for where the control sits and when its
label is hidden.

## Who can change it

Every signed-in user sees the button. Only a **board admin** gets the
`js-change-visibility` class that opens the popup; for everybody else the
button is drawn `is-disabled` and does nothing. The popup's choices are saved
with `Boards.updateAsync`, which the server allows only for a board admin.

## The popup

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

## Everyone signed in can edit

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

## Related

- [Admin Panel / Settings / Appearance](../Admin-Panel/Settings/Appearance.md)
- [Who sees what](../Admin-Panel/Who-Sees-What.md)
- [Public boards](../All-Boards/Public.md)
- [Board roles](../Board-Sidebar/Members/Roles.md)
