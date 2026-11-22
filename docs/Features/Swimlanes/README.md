# Swimlanes

## What it is

This folder describes a swimlane's header and its hamburger menu
(`client/components/swimlanes/swimlaneHeader.jade`). Swimlanes are the
horizontal bands of a board; the Swimlanes view is the default
[Board View](../Board-Header/README.md).

- [Swimlanes](Swimlanes.md)

## How to use it

Open a board in the **Swimlanes** view and click ☰ in a swimlane header. That
opens **Swimlane Actions**; the pages below explain each entry.

### Swimlane menu

Swimlane menu (☰ in the swimlane header, **Swimlane Actions**), in menu order
(`swimlaneActionPopup`), grouped under the headings **Share and history**,
**Export and import**, **Add**, **Appearance**, **Move and copy** and
**Archive**. Who sees which entry is on each page.

| Entry | Guide |
| --- | --- |
| Copy link to clipboard | [Board item links](../General/Board-Item-Links.md) |
| Star / Unstar | [Star](Star.md) |
| History | [History](../General/History/History.md) |
| Export, Import | [Scope, formats and limits](../Board-Sidebar/Board-Settings/Import-Export/Format-Coverage.md) |
| Add Swimlane | [Insert above or below](Swimlanes.md#insert-above-or-below) |
| Add List | [Lists](../Lists/Lists.md) |
| Select Color | [Select Color](Select-Color.md) |
| Copy Swimlane, Move Swimlane | [Arrange and manage](Swimlanes.md#arrange-and-manage) |
| Move Swimlane to Archive | [Archive and Delete](../Board-Sidebar/Archive/Archive-and-Delete.md) |

See the pages above.

## Commits

 - [Group the swimlane menu under headings, as the list and card menus are](https://github.com/wekan/wekan/commit/0d8f8b8d96b868a6d75b803ef105e50aad450977)
 - [File the swimlane pages the way the WeKan menus are](https://github.com/wekan/wekan/commit/b7589737f5730ce1ba83244946e158519528a783)
 - [Add Star and Unstar to the swimlane menu](https://github.com/wekan/wekan/commit/c5740e8046e23bf26a31c2b97c563498007dec0e)
 - [Add Export and Import rows to the swimlane menu](https://github.com/wekan/wekan/commit/e948acfdd31e48d2544b81268a8309352581d1f0)
 - [Add Copy link to clipboard for a swimlane](https://github.com/wekan/wekan/commit/e755b60b37009783effe5515d208b142003128e7)
