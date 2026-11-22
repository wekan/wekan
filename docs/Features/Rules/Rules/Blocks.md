# Blocks view for IFTTT Rules

## What it is

**Blocks** is a view of the board's Rules page in which a rule is built by
dragging a trigger block and an action block together, Scratch style, with
[Blockly](https://github.com/RaspberryPiFoundation/blockly). It edits the same
rules as the List and Workflow views, as one trigger followed by one action. It
is for board administrators, and it never runs generated code.

## Read more

- [Visual programming language](https://en.wikipedia.org/wiki/Visual_programming_language)
  and [Scratch](https://en.wikipedia.org/wiki/Scratch_(programming_language))
  on Wikipedia - the block-editing idea.
- [Blockly](https://developers.google.com/blockly), the library the view uses.
- [Event condition action](https://en.wikipedia.org/wiki/Event_condition_action)
  - the trigger-then-action model of a rule.
- In WeKan: [Rules (Automation)](Rules.md), [IFTTT](../IFTTT/IFTTT.md),
  [History](../../General/History/History.md).

### Dependency references

- [Blockly source and Apache-2.0 license](https://github.com/RaspberryPiFoundation/blockly)
- [Package installation](https://docs.blockly.com/guides/get-started/get-the-code/)
- [JSON workspace serialization](https://developers.google.com/blockly/guides/configure/web/serialization)

## How to use it

1. Open the board's right sidebar → **Board Settings** → **Blocks** (below
   **Rules**). You must be a board admin.
2. Choose an existing rule in the rule picker, or click **Add rule** and type
   the **New rule title**.
3. Drag a trigger and an action from the toolbox into the workspace and
   connect them: *Connect one trigger to one action.*
4. Edit the blocks' fields. For advanced options use **Edit trigger/action**,
   the form editor.
5. Click **Save**. The page says **Rule saved**, or **Unsaved changes** while
   there are edits; **Reload saved rule** throws a draft away.

### Using Blocks

Open the board's right sidebar → **Board Settings** and select **Blocks**
below **Rules** (the Rules page's own sidebar is gone; its views are listed
there). Board Settings also provides direct List view, Workflow view and
History choices. Board administrators can
select an existing rule or create a new one, drag a trigger and action into the
workspace, connect them, edit their supported fields and save. Use **Edit trigger
and action** for advanced settings in the existing form editor. A workspace must
contain exactly one connected trigger/action pair to save. Unknown stored
parameters are retained rather than discarded.

The editor uses the current theme and writing direction, local media, zoom,
panning, a trash area and Blockly context-menu editing. Language changes preserve
the current draft. Per-block disabling and standalone workspace comments are
not offered because the existing rule engine has no equivalent stored semantics;
rule enabling remains in the existing rule controls. Blockly code generation is
never used, and no script or XML from a workspace is executed.

## How the numbers are calculated

The view has no numbers of its own. Its limits: a workspace must hold exactly
**one** connected trigger and **one** action to save
([models/lib/rulesBlocks.js](../../../../models/lib/rulesBlocks.js)); a rule's
extra triggers and actions (at most ten of each, `MAX_EXTRA_RULE_PARTS`) are
edited in Rule details. The installed Blockly is 13.4.0
([package.json](../../../../package.json)); the translation test requires a
WeKan key for every one of its catalog messages (701 now,
[tests/blocklyTranslations.test.cjs](../../../../tests/blocklyTranslations.test.cjs)).

## How it works in WeKan

### Implementation plan

Add **Blocks** to the existing IFTTT Rules view controls alongside List and
Workflow. Use Blockly's Scratch-style connections to represent the existing
WeKan rule model: one trigger followed by one action. Keep Rules, Triggers and
Actions as the authoritative data, and keep the existing automation engine.

1. Load Blockly only when Blocks is opened. Use the maintained `blockly` npm
   package (Apache-2.0), not a CDN, script generator or external service.
2. Provide a board-scoped rule picker and a new-rule workspace. Render existing
   trigger/action documents without discarding fields the editor does not know.
   Offer the existing Workflow trigger/action palette as draggable blocks.
3. Let users connect a trigger and action, edit supported human-readable
   parameters and the rule title, then save explicitly. Keep advanced options
   accessible through the existing rule editor. Reject disconnected, extra or
   incomplete blocks rather than silently changing their meaning.
4. Save through `rules.createRule` and `rules.updateRule`. Keep board-admin and
   cross-board destination checks on those existing server methods. Never
   execute generated JavaScript, Blockly XML, or arbitrary code.
5. Dispose workspaces and resize observers on navigation. Preserve an unsaved
   draft while reactive data updates; ask before replacing it with another rule.
6. Test adapter round trips, malformed workspaces, authorization, lazy loading,
   real Blockly editing, persistence and actual execution of a saved rule.

### Files

- [client/components/rules/rulesBlocks.jade](../../../../client/components/rules/rulesBlocks.jade)
  and `.js` - the view; [client/components/rules/blocks/editor.js](../../../../client/components/rules/blocks/editor.js)
  - the lazily loaded Blockly editor and the adapter between blocks and rule
  documents.
- `rules.createRule` and `rules.updateRule` - the server methods that save.
- Tests: [tests/rulesBlocks.test.cjs](../../../../tests/rulesBlocks.test.cjs),
  [tests/blocklyTranslations.test.cjs](../../../../tests/blocklyTranslations.test.cjs),
  and the browser tests
  [rules-blocks.e2e.js](../../../../tests/playwright/specs/rules-blocks.e2e.js),
  [rules-history.e2e.js](../../../../tests/playwright/specs/rules-history.e2e.js)
  and
  [rules-visibility.e2e.js](../../../../tests/playwright/specs/rules-visibility.e2e.js).

### Scope

When this view was added the engine supported one trigger and one action per
rule. Since 2026-09-29 a rule may also have up to ten more triggers (any of
them fires it) and ten more actions (run in order), added in **Rule details**
with **Add another trigger** / **Add another action**
([models/lib/ruleParts.js](../../../../models/lib/ruleParts.js)). The Blocks
view still connects and saves the rule's own trigger and action pair. This
view does not introduce multi-action chains, new condition semantics, loops, executable
scripts, or Jira/ScriptRunner imports. Trigger filters remain part of the
trigger document. The pasted Autoblocks discussion is UI inspiration, not a
source of verified product history or a compatible import format.

Source comments and documentation are English. UI text uses WeKan translations.
All Blockly catalog messages (696 when the view was added; 701 in the
installed `blockly` 13.4.0) are mapped into WeKan locale files, including
accessibility and programming-block terminology. Translation filling is paused
for release at the maintainer's request; catalog completeness and placeholder
tests do not establish linguistic
accuracy or that every English placeholder has been translated.
Existing List and Workflow views remain available. Rule storage and export
formats remain unchanged; Blockly workspace state is an editing representation,
not a second rule database.

### History and permissions

A combined rule edit records its title, enabled state, trigger and action as one
entry in the existing board History. Creation, deletion, enable changes, form
edits, Workflow saves and Blocks saves use the same history. Choose **History**
under Rules in Board Settings to view or restore rule versions. Undo/redo also supports
these entries and refuses to overwrite an intervening edit.

REST rule creation, edits and deletion also record one attributed entry per
compound operation. Unchanged requests record none. If legacy/imported rules
share a trigger or action, editing a component isolates it for the edited rule,
and deletion retains components still referenced elsewhere. Undo/redo restores
the references without overwriting changed shared content. Trigger changes also
restore the matching manual-button menu metadata. These operations are not
multi-document transactions; concurrent-write recovery remains additional work.

Restoring a rule requires board-administrator permission, just like editing it.
An action targeting another board also requires current write access to that
destination. History is not a way to regain revoked permissions. Server-side
validation is authoritative even when a browser hides a control.

### Verification and remaining work

Node tests use real Blockly workspaces to verify serialization and unknown-field
preservation, reject invalid connections and check lazy-loading boundaries.
Chromium tests exercise drag/drop, field editing, persistence, rule execution,
permissions, localized context menus, RTL, themes and narrow screens. History
tests exercise compound snapshots, undo/redo, restore and intervening-edit
conflicts. Translation tests cover all locale catalogs and token inventories;
minority-language specialist terminology still needs native review.

Verification checkpoint (2026-09-27): after the REST History, shared-component
and button-metadata fixes, the combined `rules-blocks.e2e.js`,
`rules-history.e2e.js` and `rules-visibility.e2e.js` run passes all 18 Chromium
scenarios against the local Meteor/MongoDB application. This includes real
Blockly edits and rule execution, administrator restrictions, Finnish and Arabic
editing, undo/redo and restoration, REST writes, shared records, manual-button
visibility and layout at 390px/1440px in Belize, Dark and Cleanlight themes.

A broader selection of 37 rule/workflow-related Node files passes 45 runner
checks; the separate Blockly catalog suite passes three checks without changing
translations. Firefox, WebKit and FerretDB were not exercised in this checkpoint.
These results do not establish full translation or transactional concurrent
History writes; the concurrency limits still apply.

## Translation progress

Blockly translation work is paused again by request on 2026-09-27 for release.
Resume only when requested. Gujarati
now has translations for all audited Blockly prose and `r-blocks-*` editor
messages. Tests explicitly allow unchanged printed key names, platform brands,
OK, mathematical notation, URLs and nonlinguistic symbols. This is placeholder
coverage, not native-speaker verification; specialist terminology still needs
review. Chromium coverage exercises Gujarati block dragging,
field editing, saving and context menus. The editor
remains available; remaining languages and native terminology review were
tracked under TODO Later in [the changelog](../../../../CHANGELOG-big.md), which
moved to [TODO.md](../../../../TODO.md) on 2026-11-18; that file has no
Blockly entry now.
Message coverage and placeholder checks do not imply complete translation.

## Commits

 - [Rules page: Back to the board](https://github.com/wekan/wekan/commit/34d9817110b37fb6971a8bea8034f0d048928a32)
 - [The Blocks context menu offers no comment, in any language](https://github.com/wekan/wekan/commit/259c4fc7e82d2b011ba015ffcdfaec7881415700)
 - [Right-click a block beside its label in the localized browser test](https://github.com/wekan/wekan/commit/5e9c313f03c087a1400a160a015a611206eebebb)
 - [Give the Rules page the board's right sidebar instead of its own](https://github.com/wekan/wekan/commit/40a4d9b171d82c81df605d564c7d5e90fae9abda)
 - [Put the Rules views, Blocks among them, under Rules in Board Settings](https://github.com/wekan/wekan/commit/b4217f962d1701000851084abe69c9b36077d2ad)
 - [Let a rule have several triggers and several actions, edited outside Blocks](https://github.com/wekan/wekan/commit/69eeb00c84e2897e53ea96ef13df9524fc4d432a)
 - [Isolate shared rule components when editing a rule](https://github.com/wekan/wekan/commit/21cb6e8c86884c2408ac6752aca5e83fc350fd4a)
 - [Keep shared trigger and action records when deleting a rule](https://github.com/wekan/wekan/commit/7472456adade18a3de69184c7fdb2588cfbf3b0d)
 - [Record compound Rules REST changes in reversible History](https://github.com/wekan/wekan/commit/e0bcf7bde304d433653b663e32770d293c11fe66)
 - [Add editable Blockly rules with local translated message catalogs](https://github.com/wekan/wekan/commit/d273b86ed5b4657623b7e9ef865d5162659ce2fd)
 - [Record rule changes in undoable board History](https://github.com/wekan/wekan/commit/539aef4aa58ec26308d364b864e16002af8b92c8)
