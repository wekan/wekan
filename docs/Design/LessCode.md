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

Status: **in progress**.

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

Status: **not started**.

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

Status: **not started**.

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

Status: **not started**.

## Phase 5: importer pipeline

Define a small internal board representation for importers. Source-specific
modules parse and normalize their data; one tested writer creates users,
boards, swimlanes, lists, cards, comments, checklists and attachments.

Acceptance criteria:

- existing supported import formats retain their behaviour;
- source-specific quirks remain visible in their adapters;
- malformed and partial imports have negative tests;
- entity creation and ID-mapping logic has one implementation where possible.

Status: **not started**.

## Phase 6: evidence-based removal

Run static analysis as a candidate generator, then verify candidates against
Blaze template names, dynamic imports, global registrations, server startup
side effects and packaging entry points. Remove retired compatibility paths
and unused feature code only after that inspection.

Acceptance criteria:

- every removal has search evidence and relevant regression coverage;
- application startup, production build and registered test suites succeed;
- no supported deployment mode or documented feature is silently removed.

Status: **not started**.

## Results

| Phase | Before | After | Tests | Result |
| --- | ---: | ---: | --- | --- |
| Baseline | 192,952 lines | 192,952 lines | Not applicable | Survey completed |
| 1. Board themes | 6,339 CSS lines | Pending | Pending | In progress |
| 2. Language metadata | 1,724 JS lines | Pending | Pending | Not started |
| 3. UI mechanics | Pending inventory | Pending | Pending | Not started |
| 4. Authorization | Pending inventory | Pending | Pending | Not started |
| 5. Importers | Pending inventory | Pending | Pending | Not started |
| 6. Removal | Pending inventory | Pending | Pending | Not started |
