# Card Dependencies — "Red Strings" / PI Program Board

WeKan can visualize card-to-card dependencies as colored, arrow-headed
connection lines drawn on top of the board — a SAFe PI-planning style **program
board** ("Red Strings"). This is feature request
[#3392](https://github.com/wekan/wekan/issues/3392).

A card can depend on (be connected to) one or more other cards on the **same
board**. Each dependency has a **relation type**, a **color** and an **icon**.

## Relation types

| Type | Meaning | Arrow direction |
|------|---------|-----------------|
| `related-to` | undirected relation | no arrowhead |
| `blocks` | this card blocks the target | this → target |
| `is-blocked-by` | this card is blocked by the target | target → this |
| `fixes` | this card fixes the target | this → target |
| `is-fixed-by` | this card is fixed by the target | target → this |

The line is always drawn from the **right edge of the prerequisite card** to the
**left edge of the dependent card**, so direction is visible at a glance. A card
with several dependencies draws all of them.

> Dependencies never restrict where a card can be moved. You can place a
> prerequisite card in any list/column (Sprint, week, phase) — WeKan does not
> enforce "good" dependency ordering.

## Web UI

### Add / edit / remove dependencies

1. Open a card to its detail view.
2. In the **Dependencies** section click **Add dependency**.
3. Choose the **relation type** and **color**, then search a card by title and
   pick it.
4. Each listed dependency shows an icon (colored), the linked card title, a
   **relation-type** dropdown, a **color** picker, an **icon** picker (pencil)
   and a **remove** (×) button. Changes save immediately.

The colored **icon + count** also appears as a badge on the **minicard**.

### Show the connection lines

In the **board header** click the **Show dependencies** toggle (link icon). An
SVG overlay draws each dependency as a colored curve following the cards as you
scroll/resize. The overlay is non-interactive, so cards stay clickable. The
toggle (`showDependencies`) is saved on the board.

### Filter

The board **Filter** sidebar has a **Filter by dependencies** section to show
only cards that have a dependency of a given relation type.

### Import / Export

- **Board Settings → Export** offers **Dependencies / JSON** and
  **Dependencies / SVG**. The SVG is a standalone diagram and is
  round-trippable (each line embeds `data-from`, `data-to`, `data-type`,
  `data-color`, `data-icon`, and card numbers/titles).
- **All Boards → New → Import → Dependencies (JSON/SVG)** imports lines from a
  JSON or SVG file into a board you select. Cards are matched by `_id` first,
  then by **card number**, then by **exact title**, so a file exported from a
  board can be re-applied to a copy or import of it.

Dependencies are also preserved automatically when you **copy a board**, **copy
a card** within the same board, and when you **export/import a whole board** as
WeKan JSON (target card ids are remapped; dangling ones dropped). Moving a card
to another board drops its now cross-board dependencies.

### Importing from other trackers

- **Jira**: when importing a Jira board (All Boards → New → Import → From Jira),
  issue links (`issuelinks`) are mapped best-effort — "blocks" link types become
  `blocks` / `is-blocked-by` (by direction), other link types become
  `related-to`.
- **GitHub / GitLab and others**: these have no standard machine-readable
  dependency export, so dependency lines are not imported from them. Use the
  Dependencies JSON/SVG importer instead.

## REST API

Base path: `/api/boards/:boardId`. All endpoints require a bearer token
(`Authorization: Bearer <token>`). A dependency object is
`{ cardId, type, color, icon }`.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/dependencies` | all dependency lines of the board |
| GET | `/cards/:cardId/dependencies` | one card's dependencies |
| POST | `/cards/:cardId/dependencies` | add/update a dependency (body: `cardId`, optional `type`, `color`, `icon`) |
| PUT | `/cards/:cardId/dependencies/:targetId` | edit `type` / `color` / `icon` |
| DELETE | `/cards/:cardId/dependencies/:targetId` | remove a dependency |

`type` is one of `related-to`, `blocks`, `is-blocked-by`, `fixes`,
`is-fixed-by`. `color` is any CSS color (e.g. `#eb144c`). `icon` is a
FontAwesome 4.7 icon name without the `fa-` prefix (e.g. `link`).

These operations are also documented in the generated OpenAPI docs (tag
**Dependencies**).

### Python CLI (`api.py`)

```bash
python3 api.py listdependencies BOARDID
python3 api.py listcarddependencies BOARDID CARDID
python3 api.py adddependency BOARDID CARDID TARGETCARDID [TYPE] [COLOR] [ICON]
python3 api.py editdependency BOARDID CARDID TARGETCARDID '{"color":"#2196f3"}'
python3 api.py removedependency BOARDID CARDID TARGETCARDID

# Example: card A blocks card B, drawn as a blue line with a lock icon
python3 api.py adddependency BOARDID CARDA CARDB blocks '#2196f3' lock
```
