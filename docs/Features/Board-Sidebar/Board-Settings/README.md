# Right sidebar / Board Settings

## What it is

**Board Settings** is the menu of everything that is set for one board: its
rules, its planning, its look, its views, its lists and cards, its export and
import, its notifications and webhooks, and its archive. It is one popup,
`boardMenuPopup` in
[client/components/sidebar/sidebar.jade](../../../../client/components/sidebar/sidebar.jade),
whose entries are listed below with the page that describes each one.

## How to use it

1. Open a board, then its right sidebar (the hamburger at the end of your
   username in the header bar).
2. Click **Board Settings** (the cog) at the top of the sidebar.
3. Choose an entry. The entries appear in this order, in groups divided by a
   rule; permissions and site policy can hide individual entries.

| Entry | Guide or action | Who can change it |
| --- | --- | --- |
| Rules | [Automation rules](../../Rules/Rules/README.md) | Board admin; a member reads them where the board shows its Rules |
| List view, Workflow view | The Rules page opened in that view | Board admin |
| Bots | [The Rules page's Bots view](Bots.md) | Board admin |
| Blocks, History | The Rules page opened in that view | Board admin |
| Import / Export rules | Rules import and export, opened here | Board admin |
| Scrum settings | [Planning settings in the Sprints view](Scrum-Settings.md) | Board admin |
| Change color | [The board's colour](Change-Color.md) | Board admin |
| Board announcement | [A message shown to everyone on the board](Board-Announcement.md) | Board admin |
| Change Background Image | [Upload and choose a background](Background-Image.md) | Board admin |
| Date | [Board date override and week numbers](Date.md) | Board admin for the format |
| All Boards Settings | [What the All Boards tile shows, card aging, auto-archive, list widths](All-Boards-Settings.md) | Board admin |
| Board View | [Visible views, defaults and menu order](Board-View.md) | Board admin |
| Swimlane | [Height resize lock and WIP Limit Groups](Swimlane.md) | Board admin |
| List | [Width resize lock, same width for all lists, and the flow policies: list policies, split lists, commitment point, WIP limit per person](List.md) | Board admin |
| Shop | [The board's cards as a web shop: price, product code and stock fields, lists on sale, categories, Orders list, payment methods, and the Shop as the public board's view](Shop.md) | Board admin; hidden by its switch in Admin Panel / Settings / Features |
| Card | [Field visibility and order, including the flow fields Blocked, Class of service, MoSCoW and WSJF](Card.md) | Board admin; personal Labels text remains available to members |
| Export | [Export board content](Import-Export/README.md), in WeKan's own formats, some sixty other tools' and Sandstorm grain backups, under the same headings as Import - every format written a page of cards at a time | Export must be enabled |
| Import | [Import into the board](Import-Export/README.md) | Write access; import must be enabled |
| Notifications | [Board delivery defaults](Notifications.md) | Board admin |
| Outgoing Webhooks | [Send events to integrations](Outgoing-Webhooks/Discord/Outgoing-Webhook-to-Discord.md) | Board admin |
| Archive | [Review and restore archives](../Archive/Archive-and-Delete.md) | Actions depend on role |
| Original positions | [Where swimlanes, lists and cards were made, and what moved](../../Original-Positions/README.md) | Everyone who can see the board |
| Summary | [The board at a glance](../../Summary/README.md) | Everyone who can see the board; hidden by its switch in Admin Panel / Settings / Features |
| Since your last visit | [What changed since you were here](../../Since-Last-Visit/README.md) | Everyone who can see the board; hidden by its switch in Admin Panel / Settings / Features |
| Daily standup | [A timer giving each member the same timebox](Scrum-Meetings.md) | Everyone who can see the board; hidden by the board's Scrum settings or Admin Panel / Settings / Features |
| Retrospective board | [A new board with Start / Stop / Keep doing and Action items](Scrum-Meetings.md) | Whoever may create boards; hidden by the board's Scrum settings or Admin Panel / Settings / Features |
| Save as Template | [Copy the board into your board templates](../../All-Boards/Templates.md#d-save-an-existing-board-as-a-board-template) | Board admin; not on a template board |
| Move Board to Archive | [Archive the board](../Archive/Archive-and-Delete.md) | Board admin; unavailable on the templates board |

The groups are: Rules and its views; Scrum settings; Change Color to All Boards
Settings (the board's look); Board View to Card; Export to Outgoing Webhooks; and Archive to
Move Board to Archive.

[All Boards Settings](All-Boards-Settings.md) (what the board's tile shows on
All Boards, card aging, auto-archive and personal list widths) is below Date,
for board admins.

Custom Fields are reached from an opened card's menu, then the settings cog.
Subtasks settings are behind the menu beside an opened card's **Subtasks**
heading. WIP Limit Groups are inside **Swimlane**. Uploaded background choices
are inside **Change Background Image**.

See the pages above.

## How it works in WeKan

The menu is drawn by `boardMenuPopup` in
[client/components/sidebar/sidebar.jade](../../../../client/components/sidebar/sidebar.jade),
and its clicks open the popups in
[client/components/sidebar/sidebar.js](../../../../client/components/sidebar/sidebar.js).
Who sees which entry is decided there: the Rules group, Scrum settings, the
board's look, Board View, Swimlane, List, Shop, Notifications and Outgoing
Webhooks are inside `currentUser.isBoardAdmin`; a member of a board that shows its Rules
gets only **Rules** (`rulesReadable`); **Card** is shown to every logged-in
user; **Export** needs `withApi` and is hidden by `exportDisabled`, and
**Import** needs `canImportIntoBoard`; **Summary** and **Since your last visit**
follow `allowFeature`; **Daily standup** and **Retrospective board** follow
`showsStandupTimer` and `showsRetrospectiveBoard`; **Save as Template** and
**Move Board to Archive** are for board admins and not on the templates board.
The order is pinned by
[tests/boardMenuOrder.test.cjs](../../../../tests/boardMenuOrder.test.cjs).

## Commits

 - [Docs follow the menus: Scrum meetings under Board Settings, the newest features, README feature list](https://github.com/wekan/wekan/commit/0c277c4d187e59f3e32e1ce1cc04900009a8e047)
 - [Daily standup timer and retrospective board in the board menu](https://github.com/wekan/wekan/commit/2f7a4e210f0e90005bba662e7ac418b403ffa2ba)
 - [Board menu: All Boards Settings is back, below Date, for board admins](https://github.com/wekan/wekan/commit/b00e2c81333032063bad33092181cc917911384f)
 - [Card Settings: a checkbox per section, always every field, only in Board Settings](https://github.com/wekan/wekan/commit/3e5bc58105d32b1ef9e2ed9424e2990b9da95220)
 - [Board Settings / Card is the opened card's Card Settings, same templates](https://github.com/wekan/wekan/commit/52de57c844a750e2f4a0fb18d9fd81f04e5a1015)
 - [Board Settings / Card: Always show, for every field - the description, attachments and comments by default](https://github.com/wekan/wekan/commit/b54525abbe46820bd2874b575edb0fc9303ba949)
 - [Board Settings / Card: Show when empty, the fields every card of the board shows even while empty](https://github.com/wekan/wekan/commit/80b936223fb9b20697565a2c26a95da2154fdc2c)
 - [Board Settings / Card and the opened card's "+ Add" are one popup: sections in the Admin Panel's left menu, each row ](https://github.com/wekan/wekan/commit/20e2273c075e376b983a5afce5fdc65da6fb98d9)
 - [Original positions: a right-sidebar view from the board menu, in every language](https://github.com/wekan/wekan/commit/b9e28a8fbbd0f20ea3cc4d86f4e665fa00bc95be)
 - [Board Settings / Subtasks: pick the swimlane new subtasks land in](https://github.com/wekan/wekan/commit/740c3920eb2d19fc82393dc26301988946c93406)
 - [Board Settings / Bots: hand cards to external runners, as kanbots does](https://github.com/wekan/wekan/commit/aa48a2b71dea95842cba4daa908e6e236aaef1dd)
 - [Let every Board Settings / Card row be shown on the card and the minicard](https://github.com/wekan/wekan/commit/79b44675464d829b8b9ac05d01ec0aad2a8423b0)
 - [Reorder Board Settings / Card and Board View rows by drag and drop](https://github.com/wekan/wekan/commit/2d80e6e4ee4afec3dff380e53fa90f419af450f2)
 - [Show each Scrum field as its own Board Settings / Card row](https://github.com/wekan/wekan/commit/6d950b7474c394b8f2ef08a2a388c5918a66e3d4)
 - [Move Scrum settings above Change color in Board Settings](https://github.com/wekan/wekan/commit/7bf6f8a44b18cc4b324e666b933ef5d86eeda6e4)
 - [Put the Rules views under Rules in Board Settings](https://github.com/wekan/wekan/commit/b4217f962d1701000851084abe69c9b36077d2ad)
 - [Add select and unselect all actions to board settings columns](https://github.com/wekan/wekan/commit/43b0daf14944e83ec75dfb3b0954448fbc0fb2b6)
 - [Match Board Settings icons to the Board View menu](https://github.com/wekan/wekan/commit/41c3508e6ce87311e718fabc1c0235c71bcc62dc)
 - [Move Date below Change Background Image in Board Settings](https://github.com/wekan/wekan/commit/d71973fc4980003db149d8ce35b52859e38459df)
 - [Move ISO week-number toggle into Board Settings Date](https://github.com/wekan/wekan/commit/e217f1215a0f99271f1f752f841fe412fb0c3339)
 - [Board Settings: order the menu as Rules ... Move Board to Archive](https://github.com/wekan/wekan/commit/74f3db87d4f3fb6d15fd4a8adb7015ca8b22291d)
 - [Move WIP Limit Groups into Board Settings / Swimlane](https://github.com/wekan/wekan/commit/921c7f301ccf85c94c5b463a361be2fea195eeed)
 - [Board Settings / Card: one "Card field order" heading over two lists, with arrows on every row](https://github.com/wekan/wekan/commit/15b2b6c5339979341d8237aa592ae37a5fd0607d)
 - [Board Settings / Board View: reorder the Board View menu with up/down arrows](https://github.com/wekan/wekan/commit/82646e4bc0f891ed044bdc5c6cf910cd8dd4a4ea)
 - [Board Settings / Card: a toggle for every card section and minicard badge, in card order](https://github.com/wekan/wekan/commit/970213010013529150101d3fd6c59f33eab542d4)
