# Kanboard import and export

WeKan can import boards from [Kanboard](https://kanboard.org/) and export a board
in a Kanboard-style JSON, from the existing menus.

## Import from Kanboard

**All Boards → New → Import → From Kanboard**, then paste a Kanboard export JSON.

The accepted shape (from Kanboard's JSON-RPC API such as `getBoard` / `getAllTasks`,
or hand-assembled):

```json
{
  "board":     { "name": "My Project" },
  "columns":   [ { "title": "Backlog" }, { "title": "Work" }, { "title": "Done" } ],
  "swimlanes": [ { "name": "Default" } ],
  "tasks": [
    {
      "title": "Write report",
      "description": "...",
      "column_name": "Work",
      "swimlane_name": "Default",
      "date_due": "1718323200",
      "owner_username": "alice",
      "tags": ["urgent"]
    }
  ]
}
```

Mapping:

- **columns → lists** (if `columns` is omitted, the column order is derived from the
  tasks' `column_name`),
- **swimlanes → swimlanes**,
- **tasks → cards** (title, description, list from `column_name`, swimlane from
  `swimlane_name`, due date from `date_due` — unix seconds or ISO),
- **tags → board labels**,
- task **owner → card member** (when mapped in the "map members" step; or use
  "Import without mapping members" to map later).

## Export to Kanboard

**Board Settings → Export → Export board to Kanboard JSON**, or over REST:

```
GET /api/boards/:boardId/export/kanboard?authToken=:token
```

This produces the same `{ board, columns, swimlanes, tasks }` shape the importer
accepts, so a board round-trips through the Kanboard format.

## Related

- [CSV/TSV import](CSV/CSV.md), [Excel import](Excel-and-VBA.md)
- [Migrating from Trello](trello/Migrating-from-Trello.md), [Jira](Jira.md)
