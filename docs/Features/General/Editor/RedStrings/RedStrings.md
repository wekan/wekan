# Card Dependencies — "Red Strings" / PI Program Board

## What it is

WeKan can draw card-to-card dependencies as coloured, arrow-headed lines on top
of the board - a SAFe PI-planning style **program board** ("Red Strings"). A
line says that one card blocks, fixes, duplicates or relates to another, so the
order of work across lists and sprints is visible at a glance.

## Read more

- [Dependency (project management)](https://en.wikipedia.org/wiki/Dependency_(project_management)),
  [Dependency graph](https://en.wikipedia.org/wiki/Dependency_graph) and the
  [Scaled agile framework](https://en.wikipedia.org/wiki/Scaled_agile_framework)
  on Wikipedia.
- Feature request [#3392](https://github.com/wekan/wekan/issues/3392).
- WeKan pages: [Board and My Dependencies](Board-And-My-Dependencies.md),
  [REST API](../../../../API/REST-API.md).

## How to use it

1. Click your avatar, open **Member Settings** and turn on **Show Board
   Dependencies** (and/or **Show My Dependencies**).
2. Open a card and, in its **Dependencies** section, click **Add dependency**;
   or drag a minicard's connect handle onto another card.
3. Click a line, or use the card's Dependencies section, to change its relation
   type, colour and icon, or to remove it.

Each of these, and filtering, importing, exporting and the REST API, is
described step by step below.

## How the numbers are calculated

The minicard badge shows the number of the card's dependencies. Lines are drawn
from the right edge of the prerequisite card to the left edge of the dependent
card; the relation type decides which card that is (see the table below).
Duplicate relations do not count as blockers in Blocker Analysis.

## How it works in WeKan

Each card keeps its lines in `cardDependencies` (Board Dependencies); a user's
private lines are `profile.myDependencies`. Who may see and edit them is
[models/lib/dependencyAccess.js](../../../../../models/lib/dependencyAccess.js),
the methods and REST permission are
[server/models/dependencies.js](../../../../../server/models/dependencies.js),
and the overlay is
[client/components/boards/dependencyOverlay.js](../../../../../client/components/boards/dependencyOverlay.js).
Tests include [tests/dependencyAccess.test.cjs](../../../../../tests/dependencyAccess.test.cjs)
and [tests/exportDependencies.test.cjs](../../../../../tests/exportDependencies.test.cjs).
The full implementation table is in
[Board and My Dependencies](Board-And-My-Dependencies.md).

WeKan can visualize card-to-card dependencies as colored, arrow-headed
connection lines drawn on top of the board — a SAFe PI-planning style **program
board** ("Red Strings"). This is feature request
[#3392](https://github.com/wekan/wekan/issues/3392).

A card can depend on (be connected to) one or more other cards on the **same
board**. Each dependency has a **relation type**, a **color** and an **icon**.

### Relation types

| Type | Meaning | Arrow direction |
|------|---------|-----------------|
| `related-to` | undirected relation | no arrowhead |
| `blocks` | this card blocks the target | this → target |
| `is-blocked-by` | this card is blocked by the target | target → this |
| `fixes` | this card fixes the target | this → target |
| `is-fixed-by` | this card is fixed by the target | target → this |
| `duplicates` | this card duplicates the target | this → target |
| `is-duplicated-by` | the target duplicates this card | target → this |

The line is always drawn from the **right edge of the prerequisite card** to the
**left edge of the dependent card**, so direction is visible at a glance. A card
with several dependencies draws all of them.

> Dependencies never restrict where a card can be moved. You can place a
> prerequisite card in any list/column (Sprint, week, phase) — WeKan does not
> enforce "good" dependency ordering.

### Web UI

#### Add / edit / remove dependencies

1. Open a card to its detail view.
2. In the **Dependencies** section click **Add dependency**.
3. Choose the **relation type** and **color**, then search a card by title and
   pick it.
4. Each listed dependency shows an icon (colored), the linked card title, a
   **relation-type** dropdown, a **color** picker, an **icon** picker (pencil)
   and a **remove** (×) button. Changes save immediately.

The colored **icon + count** also appears as a badge on the **minicard**.

#### Show the connection lines

Open **Member Settings** (your avatar) and turn on **Show Board Dependencies**,
**Show My Dependencies**, or both. They are at the top of the menu and are off
by default. An SVG overlay draws each dependency as a colored curve following
the cards as you scroll/resize; My Dependencies are dashed. The overlay is
non-interactive, so cards stay clickable.

Showing them is **your own choice**, saved in your profile: it never turns the
lines on or off for anybody else, and anyone who can view a board can show its
dependencies. Before #6732 this was one board-wide toggle in the board header
that only board admins could change. See
[Board and My Dependencies](Board-And-My-Dependencies.md).

#### Drawing links by dragging

For a piplanning.io / Kendis / Miro-style experience, you can draw links directly
on the board — **no mode to toggle, cards stay clickable**. When a dependency
layer is shown that you can add to (see
[Board and My Dependencies](Board-And-My-Dependencies.md)), each minicard
shows a small **connect handle** (a dot on its right edge) when you hover it:

- **Drag the handle from one card onto another card** to create a dependency
  between them (a dashed guide line follows the cursor while dragging). The new
  link uses the default relation type/color/icon — edit it afterward as below.
- **Click a connection line** to open a small editor to change its **relation
  type**, **color** and **icon**, or **delete** the link.

Everything else on the board keeps working normally while you do this — only the
handle starts a drag, and only the lines themselves are clickable; the rest of
the overlay is click-through.

##### Drawing a line from one card to another

```text
Step 1 — Turn the overlay on (Member Settings: Show Board Dependencies
         or Show My Dependencies), then hover a card. A connect handle (o)
         appears on its right edge.

   +----------------+
   |  PI Alpha      (o)         +----------------+
   |  list: Sprint 1|           |  PI Beta       |
   +----------------+           |  list: Sprint 2|
                                +----------------+

Step 2 — Press on the handle and drag toward the other card.
         A dashed guide line follows the cursor.

   +----------------+
   |  PI Alpha      (o)- - - - - - - - - >+
   +----------------+           +----------------+
                                |  PI Beta       |
                                +----------------+

Step 3 — Release the mouse over the target card.
         A solid, colored, arrow-headed line is created (PI Alpha -> PI Beta).

   +----------------+
   |  PI Alpha      (o)================>+
   +----------------+           +----------------+
                                |  PI Beta       |
                                +----------------+
```

##### Changing a line's relation type, color and icon

```text
Step 1 — Click the connection line itself.

   +----------+                 +----------+
   |  PI Alpha|=======*========>|  PI Beta |
   +----------+    (click)      +----------+

Step 2 — The line editor popup opens. Pick a relation type, a color,
         and an icon — each change is saved immediately.

            +-------------------------------+
            |  Edit dependency              |
            |  Relation type: [ blocks   v] |
            |  Color:         [ #2196f3  ]  |
            |  Icon:  (o) [/] [x] [!] [#]   |
            |  --------------------------   |
            |  x  Remove dependency         |
            +-------------------------------+

Step 3 — The line updates on the board: its color, arrow direction
         (from the relation type) and the minicard badge icon all change.

   +----------+                 +----------+
   |  PI Alpha|##(lock)#=======>|  PI Beta |   (blue "blocks" line)
   +----------+                 +----------+
```

> You can also add/edit/remove a dependency from the card detail's
> **Dependencies** section (above) — both routes use the same data.

#### Filter

The board **Filter** sidebar has a **Filter by dependencies** section to show
only cards that have a dependency of a given relation type.

#### Import / Export

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

#### Importing from other trackers

The **Dependencies (JSON/SVG)** importer accepts more than WeKan's own export.
Cards are matched in the target board by `_id`, then **card number**, then
**exact title**, so links from other tools resolve as long as the card titles
match.

- **Jira**: when importing a Jira **board** (All Boards → New → Import → From
  Jira), issue links (`issuelinks`) are mapped best-effort — "blocks" link types
  become `blocks` / `is-blocked-by` (by direction), standard `Duplicate` links
  become `duplicates` / `is-duplicated-by`, and other link types become
  `related-to`.
- **Miro**: the importer best-effort maps **Miro REST API** data. Export the
  board's items and connectors from the Miro API (e.g. `GET /v2/boards/{id}/items`
  and `GET /v2/boards/{id}/connectors`) and import a JSON object containing
  `items` (or `data`) and `connectors`. Each connector's `startItem`/`endItem`
  are resolved to item titles and matched to WeKan cards by title; a connector
  caption containing "block"/"fix" maps to that relation type.
- **Kendis / piplanning.io and others**: these are proprietary tools without a
  documented public dependency file format. Export their links from their own API
  and convert to the **generic JSON** shape, which the importer accepts directly:

  ```json
  { "lines": [ { "fromTitle": "Card A", "toTitle": "Card B", "type": "blocks", "color": "#eb144c" } ] }
  ```

- **GitHub / GitLab and others**: no standard machine-readable dependency export,
  so use the generic JSON shape above.

### REST API

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
`is-fixed-by`, `duplicates`, `is-duplicated-by`. `color` is any CSS color
(e.g. `#eb144c`). `icon` is a
FontAwesome 4.7 icon name without the `fa-` prefix (e.g. `link`).

These operations are also documented in the generated OpenAPI docs (tag
**Dependencies**).

#### Python CLI (`api.py`)

```bash
python3 api.py listdependencies BOARDID
python3 api.py listcarddependencies BOARDID CARDID
python3 api.py adddependency BOARDID CARDID TARGETCARDID [TYPE] [COLOR] [ICON]
python3 api.py editdependency BOARDID CARDID TARGETCARDID '{"color":"#2196f3"}'
python3 api.py removedependency BOARDID CARDID TARGETCARDID

# Example: card A blocks card B, drawn as a blue line with a lock icon
python3 api.py adddependency BOARDID CARDA CARDB blocks '#2196f3' lock
```

Duplicate relations identify another card representing the same work. They do
not merge or archive cards, and do not count as blockers in Blocker Analysis.
They use the existing type picker, directed overlay, color/icon settings, REST
API, History undo/redo and native board transfer with remapped card IDs.

## Commits

 - [Directed duplicate relationships and Jira import mapping](https://github.com/wekan/wekan/commit/eb527dd13fee74de89381cfd9b07e088c641eaaa)
 - [Dependency lines follow the card's list role exception](https://github.com/wekan/wekan/commit/da6d9d39b8bd209006fc02fe735f1c277a2be693)
 - [Showing dependencies is each user's own choice, and My Dependencies](https://github.com/wekan/wekan/commit/cff80a9d7b89ab8e70b3bc1adfacb2db86527307)
 - [Show dependencies on instance boards to every signed-in user](https://github.com/wekan/wekan/commit/2a75b8267fcd5a1ccb5a72ecb070daa2c342b0ef)
 - [Lines do not bleed past a resized swimlane](https://github.com/wekan/wekan/commit/24199bb1df6fa6729fda0af5fdb999def8dbccd9)
 - [Fix a DomRange error in the dependency overlay](https://github.com/wekan/wekan/commit/9f36ef8789fc5f2f18fae89bc3853afe02bc3fdf)
 - [Drag-to-connect from a per-card handle](https://github.com/wekan/wekan/commit/cad7d77fce0f69519795b1b0f9f4aff79aab0a79)
 - [Drag-to-connect, on-board line editing, Miro import](https://github.com/wekan/wekan/commit/cc41308a3f6edad850b17336b20bfc422275b64b)
 - [Typed relations, colour and icon, badge, filter, REST API, import and export](https://github.com/wekan/wekan/commit/2a0d9cbf09a5a6fb424b790dedcbeb415bac9c3c)
 - [Card dependency Red Strings lines and the PI program board](https://github.com/wekan/wekan/commit/b909f82f890661103364e591553e85a1edd2bf87)
