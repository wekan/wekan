# Right sidebar / Board Settings

Open a board's right sidebar, then **Board Settings** (`boardMenuPopup` in
`client/components/sidebar/sidebar.jade`). The entries appear in this order,
in groups divided by a rule; permissions and site policy can hide individual
entries.

| Entry | Guide or action | Who can change it |
| --- | --- | --- |
| Rules | [Automation rules](../../Rules/Rules/Rules.md) | Board admin; a member reads them where the board shows its Rules |
| List view, Workflow view | The Rules page opened in that view | Board admin |
| Bots | [The Rules page's Bots view](Bots.md) | Board admin |
| Blocks, History | The Rules page opened in that view | Board admin |
| Import / Export rules | Rules import and export, opened here | Board admin |
| Scrum settings | [Planning settings in the Sprints view](Scrum-Settings.md) | Board admin |
| Change Color | [The board's colour](Change-Color.md) | Board admin |
| Board announcement | [A message shown to everyone on the board](Board-Announcement.md) | Board admin |
| Change Background Image | [Upload and choose a background](Background-Image.md) | Board admin |
| Date | [Board date override and week numbers](Date.md) | Board admin for the format |
| All Boards Settings | [What the All Boards tile shows, card aging, auto-archive, list widths](All-Boards-Settings.md) | Board admin |
| Board View | [Visible views, defaults and menu order](Board-View.md) | Board admin |
| Swimlane | [Height resize lock and WIP Limit Groups](Swimlane.md) | Board admin |
| List | [Width resize lock and same width for all lists](List.md) | Board admin |
| Card | [Field visibility and order](Card.md) | Board admin; personal Labels text remains available to members |
| Export | [Export board content](Import-Export.md) | Export must be enabled |
| Import | [Import into the board](Import-Export.md) | Write access; import must be enabled |
| Notifications | [Board delivery defaults](Notifications.md) | Board admin |
| Outgoing Webhooks | [Send events to integrations](Outgoing-Webhooks/Discord/Outgoing-Webhook-to-Discord.md) | Board admin |
| Archive | [Review and restore archives](../Archive/Archive-and-Delete.md) | Actions depend on role |
| Original positions | [Where swimlanes, lists and cards were made, and what moved](../../General/Original-Positions/Original-Positions.md) | Everyone who can see the board |
| Summary | [The board at a glance](../../General/Summary/Summary.md) | Everyone who can see the board; hidden by its switch in Admin Panel / Settings / Features |
| Since your last visit | [What changed since you were here](../../General/Since-Last-Visit/Since-Last-Visit.md) | Everyone who can see the board; hidden by its switch in Admin Panel / Settings / Features |
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
