# Board Settings / Export and Import

## What it is

**Export** writes this board, or a part of it, to a file: WeKan's own JSON and
.zip, CSV/TSV, Excel, PDF, HTML, iCal, the card dependencies, and the formats
of some sixty other tools. **Import** adds supported content to the existing
board when you have write access. List, swimlane and card menus offer the same
actions scoped to the selected item. Site security policy can disable
import/export or restrict included personal information.

## Read more

- [Wikipedia: Data portability](https://en.wikipedia.org/wiki/Data_portability)
- [Wikipedia: Comma-separated values](https://en.wikipedia.org/wiki/Comma-separated_values)
- [Wikipedia: JSON](https://en.wikipedia.org/wiki/JSON)
- [Import / Export with other tools](Import-Export/External-Tools.md) lists
  every tool and file WeKan reads and writes.
- The [format coverage table](Import-Export/Format-Coverage.md) gives the
  fields and round-trip limits of each format, each with a page of its own.
- The [illustrated backup/export guide](../../../Backup/Backup.md#export-and-import-selected-content).

## How to use it

**Export the board:**

1. Open the board, its right sidebar, then **Board Settings → Export**.
2. Choose the scope and fields first under **Select what to include:**, then
   the format. The formats are grouped under the same headings as Import:
   files (PDF, Excel, HTML), iCal, card dependencies, CSV, JSON and the formats
   of other tools.
3. The file downloads. WeKan JSON and attachment ZIP options serve different
   purposes from CSV/TSV, Excel, PDF or external application formats.

**Import into the board:**

1. Open **Board Settings → Import** (shown when you have write access to the
   board and import is enabled).
2. Follow **Import a WeKan export (.json or .zip) here:** and choose the file.

**Wrike workflow:** **Export → Wrike workflow** exports the board's lists as a
Wrike workflow. Create it in Wrike before importing the board's **Wrike**
Excel export, so Wrike applies its statuses. A Wrike workflow is imported in
[Rules → Import / Export](../../Rules/Rules/Rules.md#wrike-workflows).

A board export is not a backup of all accounts, site configuration or
databases.

## How the numbers are calculated

The menu itself has no numbers. Each format's limits - how many cards, rows or
bytes a file may have, and how long an import may take - are on that format's
own page under [Import-Export](Import-Export/Format-Coverage.md). Every format
is written a page of cards at a time, so the size of a board does not decide
the memory an export takes.

## How it works in WeKan

**Export** and **Import** are drawn in `boardMenuPopup` in
[client/components/sidebar/sidebar.jade](../../../../client/components/sidebar/sidebar.jade):
Export needs `withApi` and is hidden when `exportDisabled` (Admin Panel turned
export off); Import is shown by `canImportIntoBoard`, which asks the same write
capability the server asks when the import runs. Both open one popup body,
`exportScopeBody`, in its export or import mode; its formats are one table,
`EXPORT_FORMAT_GROUPS` in
[client/components/boards/exportScope.js](../../../../client/components/boards/exportScope.js),
whose entries are either a link to a REST API route or an action. Entries
marked for the board scope only (HTML, the dependency graph, CSV and the
exports for another tool) appear here and not in the list, swimlane or card
menus. The menu order is pinned by
[tests/exportBoardPopupOrder.test.cjs](../../../../tests/exportBoardPopupOrder.test.cjs)
and the scopes by
[tests/boardExportScope.test.cjs](../../../../tests/boardExportScope.test.cjs).

## Commits

 - [Website: import and export WordPress, Ghost, Blogger, static and HTML sites, and the board as a website at a public ](https://github.com/wekan/wekan/commit/2e8549032ea4b44e90a96eb53a4e1941f53a5261)
 - [Import and export Sandstorm grain backups](https://github.com/wekan/wekan/commit/6f3f6cc5a83df1b91a40d6afae261a74cf5b6507)
 - [Import and export Azure DevOps Boards, Microsoft Lists, Project, Outlook, Teams and OneNote](https://github.com/wekan/wekan/commit/01e88410cd7440b26c5f845d98ae058f93c16a85)
 - [Import and Export: a company's products under the company's name](https://github.com/wekan/wekan/commit/fa28e3fba81f3f5eafc8cb7044133cc330e12b80)
 - [Import and export Rocket.Chat and Fizzy](https://github.com/wekan/wekan/commit/dffbafd30fd16978dbae49a4e0d576bb1ff017ec)
 - [Trello .zip export: the Trello board JSON with the cards' attachment files, imported back with them](https://github.com/wekan/wekan/commit/e8330fb090c885c9d8ea015ed896c34a9b6cf251)
 - [Board View menu and the Import and Export lists are grouped under headings](https://github.com/wekan/wekan/commit/257835733b0ec5d950fac6feb2e13c589219bb9d)
 - [Import and export mail, calendars, chats and notes: mbox/.eml, iCalendar, Google Takeout, Slack, Mattermost, Telegram ](https://github.com/wekan/wekan/commit/ccfa6cf362e9b1eb812804d38e4d85653c5b0b0a)
 - [Fix five role helpers that answered the same for everybody](https://github.com/wekan/wekan/commit/548834c4ee366a81df87785ff012941e1156292f)
 - [Export boards to Trello, keep swimlanes as labels, and reach Trello from Sandstorm](https://github.com/wekan/wekan/commit/88d00e02f1251716e345b7bbd32185417b08842d)
 - [Import and export many boards at once for every format, and document each format in its own directory](https://github.com/wekan/wekan/commit/7858d84e127c2c6cd92134166352b9a4245d4ec2)
 - [Export Wrike Excel with Wrike's custom workflow statuses, and import and export Wrike workflows as lists and rules](https://github.com/wekan/wekan/commit/a78b4aa744b011fc385bbd462b83fb092b547efd)
 - [Import and export boards as Notion Markdown & CSV exports](https://github.com/wekan/wekan/commit/b7d3274780989c8169549507e416c60316d70ccf)
 - [Complete checklist-scoped import and export](https://github.com/wekan/wekan/commit/7c95f4c000a63c5d367ea07c31de8ea2230b86f2)
 - [Export popup: bind the checkbox toggle where nothing can drop the click](https://github.com/wekan/wekan/commit/6053d3227128130201c077da575caa4d20db76f9)
 - [Export popup: the checkboxes can be changed, and they say what they are](https://github.com/wekan/wekan/commit/ea8bd12a9ff9dc8433d07c5197981a673556bdf5)
 - [Every menu on a board has an Export row and an Import row](https://github.com/wekan/wekan/commit/e948acfdd31e48d2544b81268a8309352581d1f0)
 - [Every export popup is one popup with one scope, and looks like it](https://github.com/wekan/wekan/commit/df2913744e382eaeaa36b3cdc407998895124c27)
 - [Import into a swimlane, a list or a card, beside the one whose menu was used](https://github.com/wekan/wekan/commit/d11f5ffdb768f5ebcb6bc447c385d77147e0c59a)
 - [JSON and .zip export at every menu, streamed, from the one export popup](https://github.com/wekan/wekan/commit/b0ca22609905c45c35090d097f46d339fb4a748a)
