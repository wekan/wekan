# Audit of the proposed fixes

Audited on 2026-09-19 against WeKan commit
`2dbf9c7f391969de72d988c2ea4460a34a25915e`.

[Fixes.md](Fixes.md) contains proposals, not implemented fixes. All 78 old-side
hunks still match the current contents of their 35 source files. This audit
assesses all 36 findings, distinguishes useful changes from incomplete patches,
and records what was actually exercised. Application source was not changed.

**Most findings identify useful improvements. Do not apply the report as one
ready-to-merge patch.** V07 contains a malformed selector and changes the scope of
an unrelated desktop rule. F02, F03/F04, F06, F07, A02 and the translation changes
need additional implementation or coverage. A05 reverses an explicitly tested
product choice. Passing existing tests does not establish that these proposed
fixes work: the current, unpatched application passes those tests too.

## Method and test results

Followed the root [AGENTS.md](../../../AGENTS.md), the relevant test/build functions
in [build.sh](../../../build.sh), and the
[sandbox instructions](../Sandboxes/vscodium/README.md). In particular:

- Read actual source, including callers, templates, model mutations, global
  accessibility transformations and existing tests; did not treat the report as
  proof. Generated `_build`, `.build` and `.tools` copies were excluded from source
  assessment.
- Used repository-local Node **v24.21.0**, matching `Dockerfile`, on Linux aarch64;
  Meteor reported **3.6-beta.0**, matching `.meteor/release`.
- Used `.tools/tmp` for temporary files and a separate audit database/storage
  directory. Built a fresh bundle using Meteor's `build --directory --verbose`
  command, then ran its server with Meteor's bundled Node and MongoDB, as the
  `build.sh` test workflow does. The output directory was audit-specific rather
  than replacing the existing `.build` bundle. This was not the complete
  `build.sh --run-everything` workflow or its clean dependency reinstall.
- Ran the repository's complete plain-Node suite runner: **1,173 suites run,
  zero failures**, 154 seconds. This is a suite count, not an assertion count.
- Ran three existing full-application Playwright scenarios in **Chromium and
  Firefox: six passed**. They exercise attachment preview structure, checking a
  checklist item, and popup naming/focus trapping. These are baseline checks,
  not regression coverage for all 36 findings.
- Ran two additional audit scenarios in each browser against that fresh app:
  **four distinct scenario/browser combinations passed**. They reproduce V01,
  V05 and A07, check A09 focusability, and check F17 viewer presence. CSS and the
  A07 handler were injected into the test page to compare proposed behavior;
  this does not constitute a compiled, integrated patch test. The F17 scenario
  was rerun in both browsers with the actual `#viewer-overlay` selector and a
  positive control confirming that opening a card mounts one viewer.
- Ran isolated browser comparisons for eight findings, before and after their
  proposed changes, in both browsers: **32 observations**. These use source CSS,
  the source shortcut filter, or small representative DOM fixtures. They do not
  exercise Meteor subscriptions or persistence.
- Ran isolated source-execution assertions for F03, F06, F08 and F10; verified
  T01's missing-key count and A04's contrast arithmetic. Proposed JavaScript
  passed `node --check`; proposed JSON parsed. No claim is made that the proposed
  Jade templates were compiled or that every proposed stylesheet is correct.
- WebKit's matching browser was downloaded, but host dependency validation
  reported missing system libraries. **WebKit application tests were not run.**
  No skipped project is counted as a pass.

The fresh build exited successfully. It emitted dependency warnings and inotify
watcher errors (`No space left on device`); the resulting server nevertheless
started and served the browser tests. The build warnings are not evidence that a
proposed fix works or fails.

No FerretDB integration/conformance run, Meteor Mocha run, full browser suite,
screen-reader session, or complete translated/mobile/theme matrix was performed.
The database used for the application checks was MongoDB. These are primarily
client defects; this audit does not certify behavior across database backends.

### Observed browser differences

Results below agreed in Chromium and Firefox. “Proposed” means a test-page change,
not an application commit.

| Finding | Current behavior | With proposed change | Evidence scope |
| --- | --- | --- | --- |
| V01 | At 150% font scale, title height 59px exceeds its 42px header. | Header becomes 62.5px; title fits. | Fresh app popup and isolated CSS. |
| V05 | At 100%, a 384px app progress track has a 416px fill. | Fill becomes 384px. | Fresh app checklist. An isolated 200px track likewise changed from 232px to 200px. |
| V03 | RTL information block reserves 64px on the left and 0px on the right. | Reserves 0px left and 64px right. | Isolated source CSS. |
| V07 | At 320px, grid remains two 151px tracks. | First proposed media rule produces a single 320px track. | Isolated CSS; this does **not** validate the malformed later hunk. |
| A01 | Source shortcut filter allows Space from a focused button. | Rejects the button; still rejects an input and allows a plain element. | Source filter executed in real browsers. |
| A05 | Tab skips the password-toggle fixture. | Tab reaches the toggle. | Representative native-button fixture. |
| A07 | Space on a focused live checklist row does not check it. | Injected proposed handler checks the item through its existing click handler. | Fresh app, real checklist mutation. |
| A09 | Switch is `display:none`, `visibility:hidden`; fixture Tab skips it. | Source CSS override exposes the native input to focus. | Fresh app focus check and isolated Tab navigation. |
| F16 | Clicking the second label checks the first input when IDs are duplicated. | Unique IDs make it check the second input. | Native DOM fixture; multi-card persistence not tested. |
| F17 | Board with no open card has zero `#viewer-overlay` elements. | No global-mount patch was injected. Opening a card is the positive control and produces one viewer. | Fresh app; history slideshow and multi-card duplication remain source-confirmed only. |

## Findings: usefulness and remaining work

“Useful” below is a recommendation supported by the stated evidence, not a claim
of complete runtime verification. Every row was checked against source; additional
execution evidence is identified explicitly.

### Functional findings

| ID | Source assessment and usefulness | Remaining validation or correction |
| --- | --- | --- |
| F01 | **Useful.** `checklistActions.js` passes two input elements, while `server/rulesHelper.js` queries checklist/item titles using those values. Reading `.value` supplies the strings the executor expects, for both check and uncheck. | Exercise rule creation, stored payload and execution for both operations; retain a negative case for a missing title. No rule UI execution in this audit. |
| F02 | **Useful direction; incomplete ordering policy.** All five dialog paths still use fixed offsets. With neighbor sorts 0 and 0.25, placing above 0.25 yields -0.25, outside the intended gap; the proposed midpoint is 0.125. Updating the bulk-copy anchor addresses reversed insertion order below a target. | The new selector lacks `deletedAt:null`, unlike live-card semantics, and strict comparisons do not solve tied sorts. Test same-list moves, ties, deleted/archived neighbors, missing targets and multiple copies in both directions. No live ordering test here. |
| F03 | **Useful.** Both dialog classes set the chosen board inside subscription readiness callbacks. Executing the base class with controlled callbacks reproduced A→B→C ending on B when B finishes last. The proposed version records C immediately and keeps C after the reversed callbacks. | Combine with F04 and test the card-picker subclass, rapid revisits to the same board, submission while loading, and subscription failure. The test controls callbacks; it is not a DDP timing test. |
| F04 | **Useful.** The constructor owns `boardDestinations` through `tpl.subscribe`, but both `getBoardData` implementations use unowned `Meteor.subscribe`. Retaining/stopping the previous handle and using template-owned subscriptions addresses that lifetime mismatch. | F03 and F04 edit the same original blocks and need a combined implementation. Verify disposal on close and stale callbacks during replacement. No subscription-count measurement here. |
| F05 | **Useful.** The shared Done handler catches a rejection and then always calls `Popup.back(2)`. Returning from the catch preserves the form instead. | Test rejected move/copy/link, malformed JSON and success closing exactly once. A blocking `alert` is a minimal solution; a localized inline error would preserve context more clearly. |
| F06 | **Real defect; useful but expensive proposal.** `moveCardBy` exchanges equal sorts, and `computeCardMoveModifier` makes those moves no-ops. Source execution reproduced `[0,0]` remaining unchanged; the proposed loop produced `[1,0]`. | Renumbering every sibling costs up to N sequential writes for one move and can stop halfway on rejection. Preserve a cheap normal path, handle rejected moves in callers, and test permissions, concurrency and deleted siblings. No database reorder test here. |
| F07 | **Useful but incomplete.** `moveListBy` selects board-wide neighbors; `swimlane.myLists()` selects the current swimlane plus shared lists. The proposed swimlane filter aligns those dimensions. | Also match the renderer's `deletedAt:null`; otherwise a deleted list can still become the invisible neighbor. Test shared lists, non-swimlane views, boundaries and tied sorts. |
| F08 | **Useful.** The wrapper captures `preservedViewType` but refuses it whenever `options.initialView` exists; the board supplies that option. Executing the conditional retained month view before the patch and week view after it. | Test actual locale/first-day changes and preserved date. Decide separately how an intentional external request to change view should work; unconditional preservation overrides it. |
| F09 | **Useful.** New-translation submission calls `Popup.back()` immediately and again on successful completion. Removing the immediate call keeps the duplicate-error target alive and avoids double navigation. | Browser-test delayed success, duplicate validation and other server errors. The proposed patch does not add feedback for every non-duplicate error. |
| F10 | **Useful for literal search.** The current source throws `SyntaxError` for `[`. The proposed escaping searches `[` successfully; a normal `abc` search still works in the isolated assertion. | Test Enter-driven UI updates, empty search, backslashes and punctuation. If regex search is intended as a feature, document that policy instead of silently changing it. |
| F11 | **Useful.** Both numeric shortcut handlers read `board.labels` before checking whether a board exists. A board guard belongs in both locations. | Browser-test numeric and Shift+numeric shortcuts off-board with shortcuts enabled, plus working label shortcuts on a board. Existing browser fixtures disable user shortcuts by default. |
| F12 | **Useful.** The overtime click handler writes immediately, although the form's submit handler also saves overtime. The proposed DOM-local toggle removes the premature persistence; its descendant selector matches `cardTime.jade`. | Verify Cancel leaves data unchanged, Save persists it, and reactive updates do not discard the draft. A template-local reactive draft and scoped submit lookup would be stronger than global `#overtime` reads. |
| F13 | **Useful.** The card option helper compares saved `cardOption.cardId`, while change events update `selectedCardId`. The constructor initializes that reactive value to empty after `super`, even though saved options can already exist. | Test restored defaults, changing board/list, a removed selected card and reactive option refresh. The proposed helper/constructor alignment is source-supported, not a measured Blaze reconciliation result. |
| F14 | **Useful as removal of misleading controls.** The four row flags exist in `cardSettingsRows.js`, but the minicard template/helpers do not consume them. Attachment count and cover have separate rendering/settings; they do not implement these four controls. | Choose removal or actual rendering intentionally. Update row-coverage expectations, keep stored values compatible, and verify both sides of Card Settings. This is not permission to remove working card-side rows. |
| F15 | **Useful.** A module-level URL is assigned only by mouseover, then used by Add background. `isBackgroundImage` always returns false. Resolving the current attachment through the existing `getAttachmentUrl` helper fixes both source defects. | Test keyboard/touch opening without hover, switching attachments, broken/deleted attachments, and Add followed by Remove. No background mutation was exercised here. |
| F16 | **Useful.** Each open card uses the same checkbox ID and label target. Native browser tests reproduced wrong-input activation and showed unique IDs correct it. The delegated event selector must change with the markup as proposed. | Open two real cards and assert only the intended card changes; repeat with keyboard input after A09. The generic duplicate-ID test on My Cards does not cover this state. |
| F17 | **Useful.** Viewer mounts are in card details and Admin Problems, while history calls `openAttachmentSlideshow`. Fresh-app tests confirmed no viewer on a board without an open card and one after opening a card. Moving it to the shared default layout addresses the lifetime mismatch. | Test board history with no cards open, two open cards, Admin Problems, slideshow navigation and teardown across routes. Confirm exactly one viewer and no duplicate event bindings after the move. |

### Visual findings

| ID | Source assessment and usefulness | Remaining validation or correction |
| --- | --- | --- |
| V01 | **Useful and browser-confirmed.** Fixed header height conflicts with scaled title line height. Source CSS injection corrected measured overflow in the fresh app. | Check the mobile fixed header/content offset together, all font presets, long titles and close/back targets. |
| V02 | **Useful.** The vendored Frappe stylesheet has fixed pixel text sizes; `uiFont.js` supplies a scale variable but cannot automatically scale those values. The proposed scoped overrides target that mismatch. | Render chart labels, controls and SVG text at 100/150%, including long labels. Larger text may need more chart/bar space; CSS font scaling alone is not proof it fits. |
| V03 | **Useful and browser-confirmed for the stated direction issue.** Physical left margin conflicts with the logically positioned RTL avatar. Logical start margin reserves the correct side. | Verify actual miniprofiles in LTR/RTL at large font sizes and with missing avatars. |
| V04 | **Useful.** The completion control precedes a block `.minicard-title-text`, explaining the separate line. A shared flex row is an appropriate structural correction and preserves parent prefixes above it. | Compile Jade and test linked cards/boards, archive icons, multiline Markdown titles, parent prefixes, RTL and disabled completion. Not browser-verified here. |
| V05 | **Useful and browser-confirmed.** Content-box percentage width plus 32px horizontal padding overstates progress. Removing padding and declaring border-box fixed the measured 100% width in the app. | Add 0%, partial and empty-checklist regression cases; retain normal rounding. The existing browser test only checks that the bar appears. |
| V06 | **Useful.** Source flex children have automatic minimum sizes, and attachment metadata does not wrap. `min-width:0`, `overflow-wrap:anywhere` and metadata wrapping address that pressure. | Test long unbroken text/filenames with due controls and attachment actions at 320px/150%, including RTL. No full-app overflow measurements for this finding. |
| V07 | **Useful goal; reject the patch as written.** The first responsive rule works in isolated browsers. The later hunk inserts `@media` into a selector after `.show-minicard-only`, and broadens `.card-field-order-column-heading` inside the desktop media block. This is unrelated damage, not needed for mobile stacking. | Keep the intended grid/min-width/wrapping changes, remove the malformed later hunk and preserve the original scoped heading rule. Test the combined popup and both single-side popups at desktop and mobile widths. |

The V07 follow-up browser probe confirmed that the proposed stylesheet changes
an otherwise unscoped `.card-field-order-column-heading` from `grid-column:auto`
to `1 / -1` at desktop width. It did **not** show the existing single-side heading
losing its span; an initial hypothesis of that failure was rejected. The reason
to revise this hunk is its malformed selector and unintended widening of scope.

### Translation findings

| ID | Source assessment and usefulness | Remaining validation or correction |
| --- | --- | --- |
| T01 | **Useful.** All 35 proposed additions are absent from the current English JSON; the named call sites use those keys. Adding readable fallback values is justified. | English-only insertion is not the complete AGENTS.md translation workflow. Preserve locale key order, fill corresponding placeholders without overwriting correct human translations, and consider reusing canonical lowercase keys instead of maintaining duplicate capitalized variants. Browser fallback rendering not tested here. |
| T02 | **Useful.** `models/translation.js` limits language to five characters; registered tags such as `zh-Hans` and `wuu-Hans` exceed it. | Test real schema insertion and editor round-trip for registered long tags, while rejecting malformed/unsupported values as appropriate. A length limit of 35 alone is not locale validation. The language registry exposes Valencian as `ca-valencia`, with a `ca@valencia` filename; do not conflate those identifiers. |
| T03 | **Useful but partial.** The named handlers contain hardcoded English alerts. Translation keys improve localization, but `error.reason` remains untranslated in generic messages. | The specific last-admin branch is already unreachable after the broader `not-authorized` branch; replacing strings does not fix that. Reorder the checks and test both messages; complete locale/placeholder coverage. No account deletion/anonymization was performed for this audit. |

### Accessibility findings

The global [accessibility transform](../../../client/lib/accessibility.js) already
adds `href="#"` to anchors and copies anchor/icon titles to accessible names.
It does not make arbitrary `div` controls or untitled navigation icons keyboard
operable. This distinction changes the scope of A08.

| ID | Source assessment and usefulness | Remaining validation or correction |
| --- | --- | --- |
| A01 | **Useful and browser-confirmed at filter level.** Focused buttons currently pass the global shortcut filter; Space's handler prevents default and may toggle membership. Proposed filtering blocks the button while preserving plain-element shortcuts and input exclusion. | Test actual native activation with shortcuts enabled and selected cards, nested icon targets, and Escape behavior. Native links use Enter for activation; do not describe Space as their universal native activation key. |
| A02 | **Useful pattern, incomplete patch.** The listed rule controls are clickable divs; the global anchor transform does not help them. The patch converts only one, whereas the finding lists many controls. | Convert all relevant controls with action-specific names. Person/color-picker controls must not all be labelled “Add.” Verify Enter/Space, no accidental form submission, and rule-specific layouts. |
| A03 | **Useful.** The destination labels have no `for` association, and the selects have no explicit name. `aria-label` supplies names. | `aria-label` does not make clicking the visible label focus the control. Prefer unique `id`/`for` links where practical; test names and multiple dialog instances. No assistive-technology test here. |
| A04 | **Useful.** Recalculation confirms white on `#29a3a3` is approximately **3.06:1**, versus **5.47:1** on `#187575`; the 11px source text is not large text. | Test actual selected state in supported themes and focus/hover styles. This is color arithmetic, not a rendered contrast audit of every theme. |
| A05 | **Useful accessibility option, but an intentional behavior change.** Tab skipping is real; however `tests/accessibilityTabOrder.test.cjs` explicitly requires the `-1` value to avoid interrupting field Tab order. | If adopting keyboard reachability, revise that expectation with the reason and add reveal/hide keyboard tests that retain labeling, focus and non-submission guarantees. Do not call the existing test broken merely because it disagrees with the proposal. |
| A06 | **Useful.** Disabled arrows remain anchors, carry active titles, and the handler still calls a model setter. The proposed disabled guard prevents the pointless write and ARIA exposes state. | Verify boundary/fixed rows versus movable rows using click and keyboard; preserve existing ordering tests. “Fixed row or section boundary” is explanatory but less precise than identifying the actual reason. |
| A07 | **Useful and browser-confirmed for editable rows.** The source has click handling but no corresponding row keydown handler. Space did nothing in the app; the injected proposed handler toggled the item through the real click path. | Test Enter too, repeat keys, descendants such as due-date links, Worker permissions and read-only rendering. Client ARIA/tabindex changes are not server authorization controls. |
| A08 | **Useful, with narrower wording.** Gallery preview is a div and previous/next are icons, so converting them provides keyboard entry. The close anchor already receives an href globally; its missing name, rather than total non-focusability, is the relevant close-control defect. | Test Enter navigation, accessible names, focus entry/return and containment. Anchors behave as links; native buttons may better express these actions. This patch alone does not implement a complete accessible modal viewer. |
| A09 | **Useful and browser-confirmed for focus exposure.** Shared forms CSS hides the native checkbox. The proposed more-specific visually hidden input remains focusable; its label receives a focus outline. | Test Tab/Space through every switch type, state persistence, read-only contexts and RTL. Review other uses of the shared `.toggle-switch` rule when replacing it. Combine with F16 for correct multi-card targeting. |

## Coverage decisions and follow-up

The existing green suites are valuable baseline evidence, but several assertions
are narrower than these findings: progress-bar visibility does not check width,
row/schema coverage does not prove each minicard flag affects rendering, and a
My Cards duplicate-ID check does not exercise two open card details. A05 also has
an explicitly opposing expectation. Extend the relevant suites when implementing
fixes; do not remove meaningful existing assertions just to make a patch pass.

No new application fix or Upcoming changelog entry was made by this audit. Its
temporary reproductions are audit probes, not registered permanent regression
tests. Before shipping any accepted patch, add the relevant positive, negative
and UI cases described above, run them against a freshly built patched app, and
follow AGENTS.md's Upcoming coverage audit. The source-only rows remain pending
runtime verification, even where their defects are directly evident in code.

The Alingsås feedback list should remain separate from defect severity totals.
Hiding collapse arrows, new density options, date-only preferences, labels above
titles and independent checklist headings are product requests. Source confirms
existing font-size settings and forced date-format policy. This audit does not
claim that the proposals implement those additional requests or validate the
feedback's external screenshots.

## Reproduction and local evidence

Run from the repository root. Resolve tool versions from current repository
files; the following paths record this particular audit environment.

```sh
mkdir -p .tools/tmp
export TMPDIR="$PWD/.tools/tmp"
export PATH="$PWD/.tools/node-v24.21.0-linux-arm64/bin:$PATH"
export METEOR_WAREHOUSE_DIR="$PWD/.tools/.meteor"
export PLAYWRIGHT_BROWSERS_PATH="$PWD/.tools/ms-playwright"
unset CHROME_DEVEL_SANDBOX
node tests/run-node-suites.cjs

# Fresh audit build; runtime/server setup follows build.sh's run_all_tests.
NODE_OPTIONS=--max-old-space-size=4096 .tools/.meteor/meteor build \
  .tools/tmp/fixes-audit-20260919/build --directory --verbose
```

The audit server used `ROOT_URL=http://localhost:3000`, `PORT=3000`,
`MONGO_URL=mongodb://127.0.0.1:3001/meteor`, `WITH_API=true`,
`DEFAULT_METEOR_REACTIVITY_ORDER=changeStreams,oplog,polling`, and an absolute
`WRITABLE_PATH` ending in `.tools/tmp/fixes-audit-20260919/writable`.
MongoDB used the task's separate `db` directory. Bundle server dependencies were
installed with `meteor npm install` inside its `programs/server` directory.

With that test server running, the existing browser selection was:

```sh
cd tests/playwright
WEKAN_PLAYWRIGHT_ALL=1 WEKAN_PLAYWRIGHT_PROBE=0 \
node node_modules/@playwright/test/cli.js test \
  specs/12-checklists.e2e.js specs/19-accessibility.e2e.js \
  specs/07-attachments-links.e2e.js \
  --project=chromium --project=firefox --workers=1 --reporter=list --trace=on \
  --grep 'checking a checklist item adds|an opened popup is a dialog|attachment overlay provides'
```

Local artifacts are under `.tools/log/2026-09-19_fixes-audit/`: `node.log`,
`hunks.json`, `build.log`, `bundle-npm.log`, `server.log`, `mongod.log`,
`app-browser.log`, `audit-browser.log`, `audit-viewer-browser.log`, `browser.json`,
`logic.log`, `logic.json`, `css-regression.log`, `webkit-install.log`, and the
`app-artifacts` / `audit-artifacts` trace directories. These ignored files are
local evidence, not files distributed with this document.

Temporary replay scripts and independently patched source variants remain in
`.tools/tmp/fixes-audit-20260919/`: `browser.cjs`, `logic.cjs`,
`css-regression.cjs`, `app.config.cjs`, `audit.e2e.cjs` and `variants.json`.
Run the first three with the repository-local `node`; run the app probes with
`node tests/playwright/node_modules/@playwright/test/cli.js test
--config=.tools/tmp/fixes-audit-20260919/app.config.cjs` while the audit server is
running. These scripts are local to this checkout; the tables above preserve
the scenarios and results for readers without those artifacts.
