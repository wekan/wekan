# Import / Export: NextCloud Deck, OpenProject, GitHub, GitLab, Gitea, Forgejo

WeKan can import boards from — and export boards to — several other tools, from the
existing menus (**All Boards → New → Import** and **Board Settings → Export**). The
mechanism is generalized: each tool has a small **parser** (import) that normalizes
its JSON to a common shape, and a **formatter** (export) that emits the tool's JSON;
they share one import engine and one export collector.

| Tool | Import (paste this JSON) | Export format |
| --- | --- | --- |
| Trello | board export JSON (`.json` from Trello) | `{ name, lists:[…], cards:[…], labels:[…] }` |
| Jira | issue-search JSON (`GET /rest/api/2/search`) | `{ board:{name}, issues:[{key, fields:{summary,status,labels}}] }` |
| NextCloud Deck | board with `stacks` (each carrying `cards`) | `{ title, stacks:[{title, cards:[…]}] }` |
| OpenProject | work-packages collection (`GET /api/v3/work_packages`) | `{ _embedded:{ elements:[{subject, _links:{status}}] } }` |
| GitHub | issues array (`GET /repos/OWNER/REPO/issues`) | issues array `[{title, body, state, labels}]` |
| GitLab | issues array (`GET /projects/ID/issues`) | issues array `[{title, description, state, labels}]` |
| Gitea | issues array (`GET /repos/OWNER/REPO/issues`) | issues array (GitHub-like) |
| Forgejo | issues array (same API as Gitea) | issues array (GitHub-like) |
| Asana | tasks export `{ data:[{name, notes, memberships:[{section}], tags, due_on}] }` | `{ data:[{name, notes, completed, due_on, memberships, tags}] }` |
| ZenKit | list export `{ title, stages:[{name}], items:[{title, description, stage_name, due, tags}] }` | `{ title, stages:[…], items:[…] }` |

## How the mapping works

**Import** (parser → WeKan board):
- NextCloud Deck **stacks → lists**, cards → cards, card labels → board labels,
  assigned user → card member.
- OpenProject **statuses → lists**, work packages → cards (subject → title,
  `description.raw`, due date, type → label).
- GitHub / GitLab / Gitea / Forgejo **issues → cards**, grouped into **Open / Closed**
  lists by issue state; labels → board labels; assignee → card member; pull requests
  are skipped. Member mapping is skipped for these (map members afterwards).

**Export** (WeKan board → tool JSON): WeKan lists become the tool's columns/stacks
(or Open/Closed issue state, where a list named *Done/Closed/Complete/Archived* maps
to a closed issue), cards become the tool's cards/tasks/issues, and labels are carried
across.

## REST API and `api.py`

Both directions are scriptable, so all boards can be migrated in bulk:

```bash
# Import from a tool's export (SOURCE = deck/openproject/github/gitlab/gitea/forgejo/asana/zenkit/trello/jira/…)
python3 api.py importboardfrom github issues.json
#   → POST /api/boards/import/github   (body: the tool's export JSON)

# Export a board to a tool's JSON shape (FORMAT = trello/jira/deck/openproject/github/gitlab/gitea/forgejo/asana/zenkit/kanboard)
python3 api.py exportboardformat BOARDID deck deck-board.json
#   → GET  /api/boards/:boardId/export/deck?authToken=:token
```

> **Best-effort note:** these tools expose data through different APIs and the
> mappings cover the common fields (title, description, list/column/state, labels,
> due date, assignee). Importing the produced JSON *into* GitHub/GitLab/Gitea/Forgejo
> is done through their own issue-creation APIs (the export gives you the data in
> their shape).

## Related

- [Kanboard import/export](Kanboard.md), [Jira](Jira.md),
  [Trello](trello/Migrating-from-Trello.md), [CSV/TSV](CSV/CSV.md),
  [Excel](Excel-and-VBA.md)
- [Migrate all boards from another WeKan](Sync.md)
