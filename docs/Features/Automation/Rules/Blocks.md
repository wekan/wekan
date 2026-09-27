# Blocks view for IFTTT Rules

## Implementation plan

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

## Scope

The current engine supports one trigger and one action per rule. This view does
not introduce multi-action chains, new condition semantics, loops, executable
scripts, or Jira/ScriptRunner imports. Trigger filters remain part of the
trigger document. The pasted Autoblocks discussion is UI inspiration, not a
source of verified product history or a compatible import format.

Source comments and documentation are English. UI text uses WeKan translations.
All 696 Blockly catalog messages are mapped into WeKan locale files, including
accessibility and programming-block terminology. Translation filling is paused
for release at the maintainer's request; catalog completeness and placeholder
tests do not establish linguistic
accuracy or that every English placeholder has been translated.
Existing List and Workflow views remain available. Rule storage and export
formats remain unchanged; Blockly workspace state is an editing representation,
not a second rule database.

## Dependency references

- [Blockly source and Apache-2.0 license](https://github.com/RaspberryPiFoundation/blockly)
- [Package installation](https://docs.blockly.com/guides/get-started/get-the-code/)
- [JSON workspace serialization](https://developers.google.com/blockly/guides/configure/web/serialization)


## Using Blocks

Open IFTTT Rules and select **Blocks** from the right sidebar. The sidebar also
provides direct List, Workflow and History choices. Board administrators can
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

## History and permissions

A combined rule edit records its title, enabled state, trigger and action as one
entry in the existing board History. Creation, deletion, enable changes, form
edits, Workflow saves and Blocks saves use the same history. Choose **History**
in the Rules sidebar to view or restore rule versions. Undo/redo also supports
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

## Verification and remaining work

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
remains available; remaining languages and native terminology review are
tracked under TODO Later in [the changelog](../../../../CHANGELOG.md).
Message coverage and placeholder checks do not imply complete translation.
