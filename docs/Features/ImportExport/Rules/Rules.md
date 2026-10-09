# Rules

WeKan imports and exports a board's **rules** (its automation: a trigger and
an action) in the **Import / Export rules** dialog of the Rules page. It
writes and reads:

- **WeKan rules** as JSON (lossless) or CSV (round-trippable);
- **Trello Butler** command text, best effort, import only;
- **n8n** and **Node-RED** visual workflows, best effort, import only;
- **Wrike workflows**, as lists plus rules, both ways.

A WeKan board export also carries the board's rules, so a whole board moves
with its rules. What rules are and how they work is in
[Rules (Automation)](../../Automation/Rules/Rules.md); this page is about
moving them in and out.

## How to import

### Where the rules come from

- **WeKan rules**: from another WeKan board, with **Export rules to JSON** or
  **Export rules to CSV** in this same dialog (see
  [How to export](#how-to-export)).
- **Trello Butler**: Trello's board export does not contain Butler rules. Copy
  each Butler rule's command text from Trello; see
  [Trello workflow automation with Butler](https://www.atlassian.com/blog/trello/butler-power-up-trello-automation).
- **n8n**: export or copy the workflow as JSON; see
  [n8n's documentation on exporting and importing workflows](https://docs.n8n.io/workflows/export-import/).
- **Node-RED**: export the flow as JSON; see
  [Node-RED's documentation on importing and exporting flows](https://nodered.org/docs/user-guide/editor/workspace/import-export).
- **Wrike workflow**: Wrike has no file export of workflows. Save the JSON its
  API returns; the steps are in [Wrike](../Wrike/Wrike.md#the-workflow-from-wrikes-api).

### In WeKan

1. Open the board, then **Board Settings → Rules → Import / Export rules**
   (or **Import / Export rules** on the Rules page).
2. Under **Import into**, choose the **Workspace** (to narrow the list) and
   the **Board** the rules go into. It defaults to the current board, and
   applies to every importer in the dialog.
3. Paste the text into the text box, then click the button for its kind:
   - **Import rules from JSON** or **Import rules from CSV**;
   - **Import visual workflow**, after choosing **Auto-detect**, **n8n** or
     **Node-RED** beside it;
   - **Import Wrike workflow**;
   - **Import rules from Trello Butler (best effort)**.
4. Read the message under the buttons: *Imported N rule(s)*, and for Butler
   and visual workflows *Could not map N line(s)*. A Wrike workflow reports the
   lists and rules it added and the parts it did not read.

Only board admins of the target board can import rules.

A whole board with its rules imports through **All Boards → New → Import →
WeKan**, from a WeKan JSON export.

## How to import many boards at once

The Rules dialog works on one target board at a time. To bring many boards in
with their rules, import their **WeKan JSON** board exports: a WeKan board
export already carries its rules, triggers and actions, and each imported
board gets them.

1. On the import page (**All Boards → New → Import → WeKan**), under **Import
   many boards**, choose several WeKan JSON export files, or one `.zip` that
   holds them. Each file becomes its own board, with its rules, imported
   without member mapping (members can be mapped later).
2. From a script:

   ```bash
   python3 api.py importboardsfrom wekan FILE_OR_DIR ...
   ```

   It takes files, directories of files, or `.zip` files.

To copy every board of another WeKan with its rules,
`python3 api.py migratefromwekan REMOTE_URL REMOTE_USER REMOTE_PASS` exports
each of that user's boards from the remote WeKan and imports it here.

## How to export

1. Open the board, then **Board Settings → Rules → Import / Export rules**.
2. Under **Export**, click:
   - **Export rules to JSON**: downloads `wekan-rules.json`;
   - **Export rules to CSV**: downloads `wekan-rules.csv`;
   - **Export Wrike workflow** (under **Wrike workflow**): downloads
     `wrike-workflow.json`. **Board Settings → Export → Wrike workflow** writes
     the same workflow.
3. If you have selected rules on the Rules page, the JSON and CSV exports hold
   only those; otherwise all of the board's rules. The Wrike workflow always
   uses all of the board's rules, as the workflow is the whole board's.
4. To use the file elsewhere:
   - in another WeKan board, paste it into this dialog and import it, as
     above;
   - in Wrike, create the workflow from the JSON; the steps are in
     [Wrike](../Wrike/Wrike.md#1-the-workflow).

There is no export to Trello Butler, n8n or Node-RED.

A whole board with its rules exports from **Board Settings → Export → JSON**.

## How to export all boards at once

The rules dialog exports one board's rules. To export the rules of many
boards, export the boards in **WeKan JSON**: each board's file carries its
rules.

1. In WeKan, go to **All Boards**, open the sidebar and choose **Export all
   boards**, then the WeKan JSON format. This downloads one `.zip` with one
   file per board you can export: boards you are a member of, that are not
   archived and are not templates.
2. To export only some boards, choose **Multi-Selection** in the All Boards
   sidebar, select the boards, then **Export**.
3. From a script:

   ```bash
   python3 api.py exportallboards wekan boards.zip
   ```

For Wrike, `python3 api.py exportallboards wrikeworkflow boards.zip` writes
one Wrike workflow per board.

## Format details

### WeKan rules JSON

`{ "_format": "wekan-rules-1.0.0", "boardId": "...", "rules": [ ... ] }`.
Each rule is `{ title, trigger, action }`, with the full trigger and action
documents embedded, and `extraTriggers` and `extraActions` when the rule has
more than one of each. `_id`, `boardId`, `createdAt`, `modifiedAt` and
`updatedAt` are left out, so the rules are not tied to a board. On import, a
plain list of rules is also accepted.

- Rules are created through the server method `rules.createRule`, on the
  board chosen under **Import into**, never the board named in the file.
- A trigger field the matcher needs and the file leaves out (`userId`,
  `username`, `cardTitle`, `listName`, `oldListName`, `swimlaneName`,
  `checklistName`, `checklistItemName`, `labelId`, `attachmentName`) is set to
  `*`, meaning any.
- Importing the same file twice creates the rules twice.

### WeKan rules CSV

Columns `title, triggerType, triggerFields, actionType, actionFields`. The
trigger's `activityType` and the action's `actionType` are columns; the rest
of each is a JSON cell. A row without a trigger type or action type is
skipped. The CSV does not carry extra triggers and actions.

### Trello Butler

Best effort. One command per line. The recognized form is a rule like
`when a card is added to list "X", move the card to the top` (or bottom),
which becomes "when a card is created in list X → move it to the top" (or
bottom). The rule's title is the command line. The words are matched without
regard to case, and the list name is kept as written, so the rule fires on a
list whose name has capitals. Every other line is counted as not mapped.

### n8n and Node-RED

Best effort. The format is detected from the JSON (an n8n workflow has
`nodes` and `connections`; a Node-RED flow is a list or has `flows`), or
chosen. Each trigger→action edge of the graph becomes a rule when both ends
are recognized by their type and name:

- triggers: schedule, cron, interval or inject → a scheduled rule every day at
  09:00; trigger, webhook, http in or start → "when a card is created";
- actions: archive; move to top or bottom; complete or done → mark complete;
  email, mail, smtp or gmail → send an email (with an empty address to fill
  in); create card → create a card.

Other edges are counted as not mapped.

### Wrike workflow

A Wrike workflow as its API's
[Query Workflows](https://developers.wrike.com/api/v4/workflows/)
(`GET /workflows`) returns it:

```
{ kind: "workflows", data: [ { name, standard, hidden,
  customStatuses: [ { name, standardName, color, standard, group, hidden } ] } ] }
```

`group` is one of Active, Completed, Deferred or Cancelled, and `color` one of
Wrike's fourteen StatusColor names. Wrike has no file import or export of
workflows, and its automation rules have no export, import or API at all, so
this JSON is the exchange format. It is read in Rules → Import / Export, and
written by the board export and by that dialog (`models/lib/wrikeWorkflow.js`).

- **Import**, into the chosen board: the first workflow that is neither hidden
  nor Wrike's standard one. Each status the board has no list for becomes a
  list after the previous status's list, with the nearest WeKan color. Each
  status gets a rule: a card moved into a Completed or Cancelled status is
  marked complete, into an Active or Deferred one incomplete, unless that list
  already has such a rule. At most 200 statuses are read, and the JSON may be
  at most 1 MB.
- **Export**: one workflow named after the board, a custom status per list in
  board order, with the nearest Wrike color. A list's group comes from its
  move rule (mark complete: Completed, or Cancelled when its name says so;
  mark incomplete: Active, or Deferred), else from its name (Wrike's group
  names, Done, Closed, On hold, Rejected ...), else Active. An Active and a
  Completed status are added when no list is one, as Wrike requires both. The
  Wrike Excel export writes the same workflow and status names.

### Rules inside a board export

A WeKan JSON board export holds `rules`, `triggers` and `actions`, including
each rule's extra triggers and actions. The WeKan importer creates them on the
new board with new ids and links each rule to its new trigger and action.

## What is kept

| Source | WeKan |
| --- | --- |
| WeKan JSON rule (title, trigger, action, extra triggers and actions) | The same rule, on the target board |
| WeKan CSV row | Rule with its trigger and its one action |
| Butler `when a card is added to list "X", move the card to the top/bottom` | "When a card is created in X" → move to top / bottom |
| n8n or Node-RED trigger→action edge | Rule, titled `trigger → action` |
| Wrike workflow status | List (when missing), its color, and a mark complete / incomplete rule |
| Wrike workflow name | Reported back in the import message |
| WeKan board export's rules | The imported board's rules |

## What is not kept

- **JSON and CSV:** rules without a trigger or action are skipped. The CSV
  has no extra triggers or actions.
- **Trello Butler:** every command other than the one recognized form; they
  are counted as *Could not map*.
- **n8n and Node-RED:** edges whose trigger or action is not recognized,
  counted as *Could not map*; node settings such as the actual schedule, list
  names or e-mail addresses (the rules use defaults: daily at 09:00, any list,
  an empty address).
- **Wrike workflow:** the other workflows in the file (one is read at a time),
  hidden statuses, statuses without a name, a second status of the same name,
  and an unknown status group (Active is used). They are counted as parts not
  read.
- **Wrike:** its own automation rules (WHEN–IF–THEN) have no export, import or
  API, so they cannot be brought into WeKan. WeKan rules other than the
  complete and incomplete move rules have no Wrike counterpart.
- **Export:** WeKan rules cannot be written as Trello Butler, n8n or Node-RED.

## REST API

The Rules dialog has no import or export route of its own. Rules move over
REST with their board, or one rule at a time:

```bash
python3 api.py importboardfrom wekan board.json           # POST /api/boards/import/wekan
python3 api.py importboardsfrom wekan a.json b.json
python3 api.py importboard EXPORT.json                    # POST /api/boards/import
python3 api.py exportboardformat BOARDID wrikeworkflow workflow.json
python3 api.py exportallboards wekan boards.zip
python3 api.py listrules BOARDID
```

- `POST /api/boards/import/wekan` imports one WeKan JSON board, with its
  rules.
- `GET /api/boards/:boardId/export?authToken=…` exports one board as WeKan
  JSON, with its rules.
- `GET /api/boards/:boardId/export/wrikeworkflow?authToken=…` exports the
  board's lists and rules as a Wrike workflow.
- `GET /api/export-all-boards/wekan?authToken=…` exports all boards you can
  export; add `&boardIds=ID1,ID2` to export only those boards.
- `GET`, `POST`, `PUT` and `DELETE` on `/api/boards/:boardId/rules` list,
  add, edit and remove single rules; see
  [Rules (Automation): REST API](../../Automation/Rules/Rules.md#rest-api).

## How it is built and tested

- `client/components/rules/rulesImportExport.jade` and
  `client/components/rules/rulesImportExport.js`: the dialog, the JSON and
  CSV formats, and the Trello Butler, n8n and Node-RED parsers.
- `server/rulesButton.js`: the server methods `rules.createRule`,
  `rules.addPart` and `rules.importWrikeWorkflow`.
- `models/lib/wrikeWorkflow.js`: the Wrike workflow, its status groups,
  colors and rules.
- `models/exporter.js` writes a board's rules into its WeKan export, and
  `models/wekanCreator.js` creates them on import.
- Unit tests: `tests/rulesJsonExportImportRoundTrip.test.cjs` (JSON and CSV
  export and import, target board, fresh ids) and
  `tests/wrikeWorkflow.test.cjs`.
- Playwright cases in `tests/playwright/specs/20-rules.e2e.js`: *Import /
  Export dialog offers JSON and CSV export*, and *Import / Export applies a
  Wrike workflow as lists and rules, and exports one*.

## Sources

- [Rules (Automation)](../../Automation/Rules/Rules.md): what rules,
  triggers and actions are
- [Wrike API v4: Workflows](https://developers.wrike.com/api/v4/workflows/):
  the workflow JSON
- [Trello workflow automation with Butler](https://www.atlassian.com/blog/trello/butler-power-up-trello-automation):
  Trello's automation and its rules
- [n8n: Export and import workflows](https://docs.n8n.io/workflows/export-import/):
  the n8n workflow JSON
- [Node-RED: Importing and exporting flows](https://nodered.org/docs/user-guide/editor/workspace/import-export):
  the Node-RED flow JSON

See also: [format coverage](../Format-Coverage.md),
[all formats](../External-Tools.md).
