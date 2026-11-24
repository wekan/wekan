# Dependencies

## What it is

WeKan exports the dependency lines between a board's cards ("Red Strings")
as JSON or as an SVG picture, and imports such lines into a board again. The
SVG carries every line in `data-*` attributes, so it can be imported as well
as viewed. An import adds lines between cards of a board that already exists;
it does not create a board or cards. Lines come in two layers, **Board
Dependencies** (on the board, for everyone) and **My Dependencies** (only
yours); see [Board and My Dependencies](../../../../Editor/RedStrings/Board-And-My-Dependencies.md).

## Read more

- [Wikipedia: dependency graphs](https://en.wikipedia.org/wiki/Dependency_graph)
- [SVG 2](https://www.w3.org/TR/SVG2/): the picture format and its `data-*`
  attributes
- [Miro REST API](https://developers.miro.com/docs/rest-api-reference-guide):
  board items and connectors
- [Board and My Dependencies](../../../../Editor/RedStrings/Board-And-My-Dependencies.md):
  the two layers and who may edit them

See also: [format coverage](../Format-Coverage.md),
[all formats](../External-Tools.md).

## How to use it

Each task has its own steps below: importing one board, importing many
boards at once, exporting one board, exporting all boards at once, and the
same from a script through the REST API.

### How to import

#### Into a board, from All Boards

1. Get the file: a WeKan dependencies JSON or SVG export (see **How to
   export**), or a JSON file made from another tool (see **Format details**).
2. In WeKan, go to **All Boards → Add Board → Import → Import board**, and choose
   **Import / Dependencies (JSON/SVG)**.
3. Under **Board**, choose the board. Only boards you are a member of and that
   are not archived are listed.
4. Under **Dependencies file (JSON or SVG)**, choose the file, or paste its
   text into the box below.
5. Click **Import**. The result says how many lines were added, how many were
   already there and how many could not be matched.

This adds **Board Dependencies**, so your role on that board must allow
editing or moving cards.

#### Into the open board, from Member Settings

1. Open the board.
2. Open **Member Settings** (your avatar) and click **Import**.
3. Choose **My Dependencies** or **Board Dependencies**. Board Dependencies
   can be chosen only when your role may edit or move cards.
4. Choose the JSON or SVG file, or paste its text, and click **Import**.

An import combines, it never replaces: a line that is already there (the same
two cards in the same direction) is kept as it is and counted as already
there.

### How to import many boards at once

There is nothing to import as boards: a dependencies file adds lines to a
board that already exists. Import one file per board.

### How to export

1. In WeKan, open the board, then **Board Settings → Export**. The entries
   are offered only for a whole board.
2. Under **Dependencies**, choose **JSON** or **SVG**. The board's
   Board Dependencies download as `wekan-dependencies-BOARDID.json` or
   `wekan-dependencies-BOARDID.svg`.
3. **Member Settings → Export** offers the same four files for the open
   board: My Dependencies or Board Dependencies, as JSON or SVG. My
   Dependencies are named `wekan-my-dependencies-BOARDID...`.
4. Import the file into another WeKan board as above. The SVG opens in any
   web browser or SVG editor.

### How to export all boards at once

This is not available for the dependency graph. It is a document of one
board, so **Export all boards** does not offer it. The board's lines are also
inside the board's WeKan JSON export, which **Export all boards** does offer.

### REST API

The import and the two files are made in the browser, so `importboardfrom`,
`importboardsfrom`, `exportboardformat` and `exportallboards` do not apply.
The same lines are available from the REST API:

```bash
python3 api.py listdependencies BOARDID          # GET /api/boards/BOARDID/dependencies
python3 api.py listcarddependencies BOARDID CARDID
```

- `GET /api/boards/BOARDID/dependencies` returns the board's lines in the
  same `{ from, fromTitle, fromCardNumber, to, ... }` shape as the JSON file's
  `lines`.
- `GET`, `POST /api/boards/BOARDID/cards/CARDID/dependencies` and
  `PUT`, `DELETE /api/boards/BOARDID/cards/CARDID/dependencies/TARGETID` read
  and change one card's lines, with the same permission rule as the import.

## How the numbers are calculated

This format has no numbers of its own: it has no limits, counts or defaults
beyond those of the export it belongs to.

## How it works in WeKan

This format's own code:
[client/components/users/dependencyMenu.js](../../../../../../client/components/users/dependencyMenu.js),
[client/lib/exportDependencies.js](../../../../../../client/lib/exportDependencies.js),
[client/lib/importDependencies.js](../../../../../../client/lib/importDependencies.js),
[models/metadata/dependencies.js](../../../../../../models/metadata/dependencies.js),
[server/models/dependencies.js](../../../../../../server/models/dependencies.js).

The tests that pin it:
[server/lib/tests/dependencyLayers.tests.js](../../../../../../server/lib/tests/dependencyLayers.tests.js),
[tests/dependencyAccess.test.cjs](../../../../../../tests/dependencyAccess.test.cjs),
[tests/duplicateDependencies.test.cjs](../../../../../../tests/duplicateDependencies.test.cjs),
[tests/exportBoardPopupOrder.test.cjs](../../../../../../tests/exportBoardPopupOrder.test.cjs),
[tests/playwright/specs/27-red-strings.e2e.js](../../../../../../tests/playwright/specs/27-red-strings.e2e.js),
[tests/playwright/specs/my-dependencies.e2e.js](../../../../../../tests/playwright/specs/my-dependencies.e2e.js).

The details of the format, what is kept and how it is tested are below.

### Format details

From the [format coverage](../Format-Coverage.md) audit, for PDF, HTML and SVG:

- **Authoritative shape:** export-only rendered views.
- **Required coverage:** every selected visible section, Unicode, safe links
  and images, pagination and deterministic filenames; these are
  presentations, not lossless re-import formats.

The dependency SVG differs from that row: it is written so it can be imported
again, and the import reads it back.

#### The JSON file

`client/lib/exportDependencies.js` writes:

```json
{
  "_format": "wekan-dependencies-1.0.0",
  "boardId": "BOARDID",
  "boardTitle": "Board title",
  "layer": "board",
  "lines": [
    { "from": "CARDID", "fromTitle": "A", "fromCardNumber": 1,
      "to": "CARDID", "toTitle": "B", "toCardNumber": 2,
      "type": "blocks", "color": "#eb144c", "icon": "link" }
  ]
}
```

`layer` is `board` or `my`. `type` is one of `related-to`, `blocks`,
`is-blocked-by`, `fixes`, `is-fixed-by`, `duplicates` and `is-duplicated-by`;
`color` is a CSS color and `icon` a Font Awesome 4.7 icon name. Only cards
that are not archived are read.

#### The SVG file

The SVG draws one box per card that is not archived, one column per list in
list order and one row per card in card order, with the title cut at 26
characters. Each line is a curve from the card that comes first to the card
that depends on it, with an arrowhead for the directed types. The SVG element
carries `data-wekan-format="wekan-dependencies-1.0.0"`, `data-board-id` and
`data-board-title`; each card box carries its id, number and title; and each
line carries `data-from`, `data-to`, `data-from-number`, `data-to-number`,
`data-from-title`, `data-to-title`, `data-type`, `data-color` and
`data-icon`. Lines whose cards are not both on the board are not drawn.

#### What the import reads

`client/lib/importDependencies.js` reads, by content (text starting with `<`,
or a `.svg` file name, is SVG):

- the WeKan dependencies JSON and SVG above;
- a JSON array of line objects, or an object with a `lines` array. A line may
  name its cards with `from` / `fromId` / `source` and `to` / `toId` /
  `target`, `fromCardNumber` / `fromNumber` and `toCardNumber` / `toNumber`,
  or `fromTitle` and `toTitle`, with optional `type`, `color` and `icon`;
- Miro connectors: an object with `connectors` (and `items`, or `data`, for
  the titles), or an array of objects with `startItem` / `endItem`. Miro's
  [REST API](https://developers.miro.com/docs/rest-api-reference-guide)
  returns items and connectors as `data` arrays of two separate requests:
  put them together as `{ "items": [...], "connectors": [...] }`. Item titles
  are taken from the item's title or content, with HTML removed. A connector
  caption containing "block" becomes `blocks`, one containing "fix" `fixes`.

Kendis and piplanning.io have no documented dependency file format: export
their links from their API into the generic JSON shape, for example
`{ "lines": [ { "fromTitle": "...", "toTitle": "...", "type": "blocks" } ] }`.

The server (`importBoardDependencies` and `importMyDependencies` in
`server/models/dependencies.js`) matches each card on the target board by id,
then card number, then exact title, among cards that are not archived. An
unknown type becomes `related-to`, a missing color `#eb144c` and a missing
icon `link`.

### What is kept

| File | WeKan |
| --- | --- |
| A line between two cards | A dependency from the first card to the second |
| `type` | Relation type and arrow direction |
| `color`, `icon` | Line and badge color, icon |
| `from` / `to` ids, card numbers or titles | The cards it joins on the target board |

### What is not kept

The import result counts these as unmatched rather than adding them:

- a line whose card cannot be found on the target board;
- a line from a card to itself;
- for Board Dependencies, a line between cards you may not edit.

Lines already on the board are counted as already there. The import does not
create cards, and does not remove lines that are not in the file.

The export leaves out archived cards and every card field other than the
title and number. The SVG shows only the first 26 characters of a title, but
its `data-from-title` and `data-to-title` hold the whole title.

### How it is built and tested

- Export: `client/lib/exportDependencies.js`; the menu entries are `dep-json`
  and `dep-svg` in `client/components/boards/exportScope.js`, handled in
  `client/components/sidebar/sidebar.js`.
- Import: `client/lib/importDependencies.js` (reading the file),
  `client/components/sidebar/sidebar.js` (`importDependenciesPopup`),
  `client/components/users/dependencyMenu.js` (Member Settings) and
  `server/models/dependencies.js` (matching, permissions, merging).
- `models/metadata/dependencies.js` holds the types, colors and icons.
- Unit tests: `server/lib/tests/dependencyLayers.tests.js` (who may import
  Board Dependencies), `tests/dependencyAccess.test.cjs`,
  `tests/duplicateDependencies.test.cjs`,
  `tests/exportBoardPopupOrder.test.cjs` (the menu entries).
- Playwright: `tests/playwright/specs/27-red-strings.e2e.js` (the import
  matches cards by number and by title) and
  `tests/playwright/specs/my-dependencies.e2e.js` (a Worker imports Board
  Dependencies and the import adds only what is missing; a signed-in
  non-member imports My Dependencies, never the board layer).

## Commits

 - [Jira and Taskwarrior exports carry the card dependencies; the round trip of every export checks them](https://github.com/wekan/wekan/commit/d613a00030a7827d4d6318c50d6feb5d80d008ce)
 - [Dependency lines follow the card's list role exception](https://github.com/wekan/wekan/commit/da6d9d39b8bd209006fc02fe735f1c277a2be693)
 - [Security: a REST write that changes nothing answers 404, and a card deletion naming another list keeps the card's ](https://github.com/wekan/wekan/commit/d4c0d3e8820520dc7b1cef5b27e9e3e516a67158)
 - [Tests: the Playwright specs expect the accessibility-audit colours and drop below the last checklist row](https://github.com/wekan/wekan/commit/ae49937b449bed8a26b6baae7108ba7eb6d347f4)
 - [Tests: drawing refit, Due Cards board scope, dependency import counts, and SAML's one Issuer](https://github.com/wekan/wekan/commit/121f37be912e87e72732fea1d827722d1b8940a3)
 - [Import Kanboard task links as parent cards and dependencies, and GitHub comments as card comments](https://github.com/wekan/wekan/commit/594867bab71e249f559eb6590286027d4be38d07)
 - [Complete duplicate relationship placeholder coverage](https://github.com/wekan/wekan/commit/e31679f46a194b9a245b0f0794e6320414f5860f)
 - [Close the ErrorBleed siblings: refused REST requests answer with their real status and a safe message](https://github.com/wekan/wekan/commit/215293868b1c5f663ca5fbd01e25ef71935f4a81)
 - [Test My Dependencies on an instance board in the browser](https://github.com/wekan/wekan/commit/9b6f840a6782004d2447e7440ee30c2cc150cbda)
 - [Show dependencies on instance boards to every signed-in user, as every other read does](https://github.com/wekan/wekan/commit/2a75b8267fcd5a1ccb5a72ecb070daa2c342b0ef)
 - [Make showing dependencies each user's own choice, and add My Dependencies](https://github.com/wekan/wekan/commit/cff80a9d7b89ab8e70b3bc1adfacb2db86527307)
 - [Import Asana custom fields, comments, subtasks and dependencies](https://github.com/wekan/wekan/commit/1d32801cf91aefc4d011f70e5214dc7a2f455908)
 - [Add directed duplicate card relationships and Jira import mapping](https://github.com/wekan/wekan/commit/eb527dd13fee74de89381cfd9b07e088c641eaaa)
 - [Isolate Red Strings browser sessions](https://github.com/wekan/wekan/commit/b72e0e99fa4f6ca497b3a99d158ec13753fe3265)
 - [Fixed InputBleed:   incomplete multi-character HTML sanitization in card dependency   import allowed HTML/script ](https://github.com/wekan/wekan/commit/8dfb54d9d5d68f120e3aa710c3521a9e9ac9670c)
 - [Red Strings: switch drag-to-connect to a per-card handle (no connect mode)](https://github.com/wekan/wekan/commit/cad7d77fce0f69519795b1b0f9f4aff79aab0a79)
 - [Red Strings: drag-to-connect mode, on-board line editing, Miro import](https://github.com/wekan/wekan/commit/cc41308a3f6edad850b17336b20bfc422275b64b)
 - [Red Strings: fix dependency icon picker + e2e test for editing a dependency](https://github.com/wekan/wekan/commit/e8a8007814d777f2c89d26cfdc878912c7072c9b)
 - [CI: install mongosh for e2e jobs; e2e: dismiss dev overlay in toggle test](https://github.com/wekan/wekan/commit/a3d4848c88956e588ce46672c103f266d072f969)
 - [Red Strings: add tests for schema validation, REST/OpenAPI, filter, copy/import](https://github.com/wekan/wekan/commit/536fc4913cab9b8fdbdf1cdd9827358a7d23a0b3)
 - [Red Strings: typed relations, color/icon, badge, filter, REST API, import/export, docs](https://github.com/wekan/wekan/commit/2a0d9cbf09a5a6fb424b790dedcbeb415bac9c3c)
 - [Red Strings: preserve card dependencies across copy/import + add e2e tests](https://github.com/wekan/wekan/commit/f4d620e8677270fa64510eadc3f18f0e58918555)
