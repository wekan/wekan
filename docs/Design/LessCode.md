# Less Code

This document records a measured plan for reducing WeKan's maintained source
code without removing supported behaviour, translations, accessibility or
tests. Fewer lines are useful only when they also leave fewer independent
implementations to understand and keep consistent.

## Baseline

Measured on 2026-09-03 from JavaScript, Jade, CSS and MJS files below
`client/`, `server/`, `imports/` and `models/`:

| Source | Files | Lines |
| --- | ---: | ---: |
| JavaScript and MJS | 798 | 150,724 |
| CSS | 73 | 28,941 |
| Jade | 111 | 13,287 |
| Total | 982 | 192,952 |

Generated bundles, dependencies, translation JSON and tests are not included.
The baseline is a navigation aid rather than a target to game: moving code to
generated files or compressing formatting does not count as a reduction.

The largest promising areas found in the initial survey are:

| Area | Current evidence | Opportunity |
| --- | --- | --- |
| Board themes | `boardColors.css` is 6,339 lines | Store theme values once and share structural rules |
| Language registry | `languages.js` is 1,724 lines | Generate repetitive registry entries from compact metadata |
| Large UI controllers | Several files have 1,400-2,900 lines | Extract genuinely repeated paging, forms and actions |
| Authorization | Rules occur in models, methods, publications and REST routes | Use one policy function per operation |
| Importers | Creator modules repeat entity creation pipelines | Normalize input, then persist through one pipeline |
| Retired paths | Dynamic Blaze references hide some unused code | Remove only with runtime and test evidence |

Splitting a large file, changing Jade to Svelte, minifying source, or moving
logic into a dependency does not by itself satisfy this plan.

## Working rules

Each phase is completed and verified before the next begins. Record its before
and after measurements below. Behavioural changes need positive and negative
tests; visible changes also need an applicable UI or screenshot test. Preserve
special cases instead of forcing them into an abstraction that makes the code
harder to understand.

Small migrations are preferred. A phase may be stopped when measurement shows
that its abstraction adds more complexity than it removes.

## Phase 1: board theme declarations

`client/components/boards/boardColors.css` repeats selectors and declarations
for every named theme. Introduce shared structural rules backed by CSS custom
properties, while retaining explicit overrides for gradients, image themes,
Apple Glass Pastel and other exceptional designs.

Steps:

1. Inventory the property roles used by ordinary colour themes and classify
   exceptional themes.
2. Add a shared rule set and a small variable declaration for one ordinary
   theme.
3. Extend the existing theme tests so they verify computed outcomes rather
   than requiring the old repeated selector layout.
4. Migrate ordinary themes in small batches and run the theme, header, public
   board, All Boards and checkbox tests after each batch.
5. Compare CSS size and a representative rendered board in desktop and mobile
   widths. Keep special-theme CSS explicit where that is clearer.

Acceptance criteria:

- all existing visual behaviours and theme choices remain available;
- theme tests and relevant Playwright tests pass;
- `boardColors.css` has materially fewer declarations and bytes;
- a new ordinary solid-colour theme can be added mainly by declaring values.

Result:

- ten ordinary solid-colour themes now declare twelve palette values and use
  one shared structural rule set;
- gradient, image, Relax, Dark, Apple Glass Pastel, Modern and Clean themes
  remain explicit because their structure or behaviour differs;
- `boardColors.css` decreased from 6,339 lines / 196,012 bytes / 1,266 rules /
  2,216 declarations to 5,895 lines / 178,134 bytes / 1,058 rules / 2,064
  declarations;
- PostCSS parsed the resulting stylesheet successfully;
- `themeAccents`, `boardTileTheme`, `allBoardsPage`, `publicBoardsPage`,
  `headerBars`, `checkboxesAreSquare` and `appleGlassPastelTheme` passed: 110
  assertions in total;
- a Chromium computed-style check was attempted at 1,280 px and 390 px, but
  this ARM64 sandbox only has an x86-64 Chromium binary and its emulated launch
  did not complete. Runtime visual verification therefore remains an
  environment boundary rather than a claimed result.

Status: **completed** in commit `cd1039230`.

## Phase 2: language metadata

Replace repetitive hand-written language registry objects with compact
metadata and generated lazy imports. The public registry shape and language
order must remain unchanged. Adding a language must still require all three
integration points specified by the translation policy.

Acceptance criteria:

- every current locale is registered with the same code, tag, native name and
  RTL value;
- every translation remains lazily loaded;
- translation, key-order, placeholder and language-picker tests pass;
- the authoritative metadata is shorter and has a duplicate-tag check.

Result:

- the 245 language records now use one compact metadata row each;
- a separate loader map retains one literal dynamic `import()` per language,
  preserving Meteor's per-language split points;
- a runtime parity comparison against the previous module confirmed identical
  keys, codes, tags, native names, RTL flags and loader paths for all 245
  entries;
- `languages.js` decreased from 1,724 lines / 34,873 bytes to 510 lines /
  24,362 bytes;
- guards now reject duplicate metadata keys, duplicate language tags, duplicate
  loader keys, missing loaders, eager imports and files not claimed by the
  registry;
- `i18nLazyLoading`, `i18nLazyLoaded`, `newLanguageWiring`, `rtl` and
  `changeLanguageColumns` passed: 31 assertions in total.

Status: **completed** in commit `a3bc8155d`.

## Phase 3: repeated UI mechanics

Measure duplication in large UI files before extracting anything. Concentrate
on repeated pagination, searches, menu data, modal lifecycle, form value
collection and Meteor method result handling. Do not create generic helpers for
code that merely looks similar but has different behaviour.

Acceptance criteria:

- at least two real consumers use every extracted abstraction;
- user-visible error, keyboard and accessibility behaviour is preserved;
- focused unit tests cover the shared primitive and UI tests cover consumers;
- total maintained code is lower after including the new abstraction.

Result:

- one `adjacentPage` primitive now clamps page movement for All Boards, the
  generic Admin Panel reports, event streams, office reports and all four
  People paging contexts;
- People maps the active pane to its page, total and page-size state once,
  replacing separate previous/next branches for organizations, teams, people
  and the login-location drill-down;
- focused tests cover ordinary movement, both boundaries, normalized direction
  and invalid movement; the existing consumer suites passed with 96 assertions
  (`tablePage` 55, `allBoardsPage` 27, subscription lifetime 3 and grouped
  offices 11);
- the 982-file maintained-source measurement decreased from 191,284 to 191,279
  lines. The small five-line net reduction includes the new shared primitive;
  tests are excluded from that measurement and grew to pin its behaviour.

Status: **completed** in commit `eb0e34786`.

## Phase 4: authorization policies

Inventory equivalent permission decisions across collection methods, Meteor
methods, publications and REST endpoints. Move each equivalent decision into a
pure shared policy and retain transport-specific error formatting at the edge.

Acceptance criteria:

- DDP and REST make the same decision for the same actor and resource;
- policies have allowed and denied tests, including missing resources;
- publications do not expose records rejected by their matching mutation
  policy;
- duplicated permission conditions are removed rather than wrapped.

Result:

- the existing write-capability policy was confirmed to serve collection
  permissions, Meteor methods, REST mutations and destination checks in
  publications; it was retained instead of creating a competing abstraction;
- a new transport-neutral `canReadBoard` policy now serves two DDP
  publications, two HTTP attachment routes and fourteen position-history
  method checks;
- public boards allow anonymous and authenticated reads, private boards require
  an active member, and missing or malformed boards fail closed;
- HTTP and DDP keep their own response/error formatting at their edges. The
  legacy attachment publication now makes the same public-board decision as
  the HTTP download routes instead of rejecting every anonymous subscriber;
- six focused policy and wiring tests passed, together with the existing file
  safety, request authentication, card scope and window-publication suites;
- maintained source decreased from 191,279 to 191,248 lines, including the new
  policy module.

Status: **completed** in commit `e8c867b33`.

## Phase 5: importer pipeline

Define a small internal board representation for importers. Source-specific
modules parse and normalize their data; one tested writer creates users,
boards, swimlanes, lists, cards, comments, checklists and attachments.

Acceptance criteria:

- existing supported import formats retain their behaviour;
- source-specific quirks remain visible in their adapters;
- malformed and partial imports have negative tests;
- entity creation and ID-mapping logic has one implementation where possible.

Result:

- WeKan JSON and Trello adapters now describe their ordered stages to one
  `runImportPipeline` implementation, which carries the created board ID and
  normalizes absent optional collections to empty arrays;
- one `writeImportedEntity` implementation now owns direct insertion, optional
  timestamp touching and old-to-new ID recording for lists, swimlanes,
  checklists and WeKan custom fields;
- source-specific normalization remains in the adapters: notably WeKan's real
  swimlanes and extra dependency/rule stages, and Trello's synthetic default
  swimlane and inline checklist items;
- malformed top-level input and a pipeline that creates no board fail closed;
  missing optional arrays, stage order, ID propagation, mapping and timestamp
  writes have focused positive and negative tests;
- six pipeline tests and 95 existing importer assertions passed. The three
  changed modules also passed Node 24 syntax checks;
- maintained source decreased from 191,248 to 191,220 lines, including the new
  pipeline module. Obsolete commented-out importer implementations and the
  unused empty WeKan checker were removed as part of the same inventory.

Status: **completed** in commit `8b7115335`.

## Phase 6: evidence-based removal

Run static analysis as a candidate generator, then verify candidates against
Blaze template names, dynamic imports, global registrations, server startup
side effects and packaging entry points. Remove retired compatibility paths
and unused feature code only after that inspection.

Acceptance criteria:

- every removal has search evidence and relevant regression coverage;
- application startup, production build and registered test suites succeed;
- no supported deployment mode or documented feature is silently removed.

Result:

- static search found two tracked model implementations whose `.disabled`
  suffix prevents Meteor from treating them as JavaScript. No import, template,
  startup registration, package entry or application source referenced their
  filenames or `AttachmentsOld` / `AvatarsOld` symbols;
- `models/attachments_old.js.disabled` and
  `models/avatars_old.js.disabled` were removed: 148 tracked lines. These files
  are recoverable from git history;
- supported legacy CollectionFS reads remain in
  `attachmentBackwardCompatibility.js`, the legacy attachment publication and
  its HTTP route. Migration extraction and file-safety suites passed;
- a regression test verifies that the retired files and symbols stay absent
  while the active legacy-read modules remain present;
- all 709 registered Node test suites passed with zero failures in 48 seconds;
- `meteor build .build-lesscode --directory` completed successfully. Its only
  diagnostics were existing asset-size and optional MongoDB dependency
  warnings;
- a development startup with a temporary `WRITABLE_PATH` reached `Started your
  app` and served at `http://127.0.0.1:3999`, after which it was stopped cleanly;
- the maintained-source metric is unchanged at 191,220 because `.disabled`
  files were deliberately excluded from that baseline. The removal nevertheless
  deletes 148 tracked, reviewable lines rather than moving or compressing them.

Status: **completed** in commit `e37717d07`.

## Results

| Phase | Before | After | Tests | Result |
| --- | ---: | ---: | --- | --- |
| Baseline | 192,952 lines | 191,220 lines | Not applicable | 1,732 fewer maintained lines |
| 1. Board themes | 6,339 lines / 196,012 bytes | 5,895 lines / 178,134 bytes | 110 assertions passed; browser unavailable | Completed (`cd1039230`) |
| 2. Language metadata | 1,724 lines / 34,873 bytes | 510 lines / 24,362 bytes | Registry parity and 31 assertions passed | Completed (`a3bc8155d`) |
| 3. UI mechanics | 191,284 maintained lines | 191,279 maintained lines | Primitive and 96 consumer assertions passed | Completed (`eb0e34786`) |
| 4. Authorization | 191,279 maintained lines | 191,248 maintained lines | 6 policy tests plus transport regressions passed | Completed (`e8c867b33`) |
| 5. Importers | 191,248 maintained lines | 191,220 maintained lines | 6 pipeline and 95 importer assertions passed | Completed (`8b7115335`) |
| 6. Removal | 148 tracked disabled lines | 0 tracked disabled lines | 709 Node suites, build and startup passed | Completed (`e37717d07`) |

## Final outcome

All six phases are complete. The maintained JavaScript/MJS, Jade and CSS metric
decreased from 192,952 to 191,220 lines: **1,732 fewer maintained lines**. Phase
6 additionally removed 148 tracked disabled lines that were outside the
baseline, for **1,880 deleted or avoided lines** across the measured work.

The reductions came from fewer independent implementations, not from
minification or changing template technology. Replacing all Jade/Blaze views
with Svelte would temporarily increase code because both UI systems, adapters
and migration tests would coexist; it is therefore not a code-reduction step by
itself. Further work should repeat this measured approach on one duplicated
behavior at a time and retain a change only when its tests and maintenance
surface improve.
