# Accessibility audit: automated axe-core trial

This page records the result of a small automated accessibility trial run on
2026-11-02. It is a **measurement, not a conformance claim**. WeKan aims for
[WCAG 2.1 AA](https://www.w3.org/WAI/WCAG21/quickref/) (see
[Accessibility.md](Accessibility.md)); this audit shows where an automated
scan finds that goal not yet met on seven key pages.

An automated scan finds only part of the problems: many WCAG criteria cannot
be decided by a program, and the rest needs people using a keyboard and a
screen reader. A clean result here would not have meant "accessible", and a
finding here is a starting point, not a verdict.

## Status: fixed, and checked again

The findings below were **fixed the same day** in the default theme and the scan
was run again. The result: **axe-core finds no violation on any of 22 pages**,
for the same rule sets (`wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`,
`best-practice`). This is a floor, not a conformance claim; the limits at the end
of this page still apply.

### Before and after, page by page

The first scan covered 7 pages. For the re-check the list grew to 22, so the
"before" column for the 15 added pages is a scan made before any fix, with the
same tool, browser and viewport.

| Page | Violating elements before | After |
|---|---|---|
| Sign in | 6 | 0 |
| Sign up | 6 | 0 |
| All Boards (home) | 14 | 0 |
| Templates | 13 | 0 |
| Remaining | 14 | 0 |
| Archive | 8 | 0 |
| Public | 7 | 0 |
| Activity | 7 | 0 |
| Support | 7 | 0 |
| Shortcuts | 7 | 0 |
| My cards | 7 | 0 |
| Due cards | 7 | 0 |
| My attachments | 7 | 0 |
| Starred items | 7 | 0 |
| Global search | 15 | 0 |
| Bookmarks | 8 | 0 |
| Import | 6 | 0 |
| Admin Panel: Settings | 17 | 0 |
| Admin Panel: Information | 17 | 0 |
| Admin Panel: Translation | 19 | 0 |
| Accessibility page | 7 | 0 |
| Board (swimlanes view) | 16 | 0 |
| Board with a card open | 45 | 0 |

### What was done

| Finding | What was done |
|---|---|
| 1. Colour contrast | The default theme's blue is `#2573a7` (white 5.14, `#f2f2f2` 4.59) instead of `#2980b9`, everywhere the stylesheets, the theme accent table and the colour picker name it. The label colours green, red, sky, magenta and gray, and the Global search list chips, have black text instead of white. The quiet text greys `#8c8c8c` and `#727479` are `#595959` and `#5a5c61`; the grey board tiles are `#767676`; the "no items" text is `#595959`. |
| 2. Label in Name | The Starred menu's name starts with the star count; the user menu link's name is the avatar's initials, the user's name and "Member Settings"; an avatar drawn as initials has the initials in its name. axe reads the letters inside the avatar's SVG as visible text whatever `aria-hidden` says, so the name has to contain them. |
| 3. Fields without a label | The Pomodoro minutes field and the comment, description and edit-comment editors have an `aria-label`. The editor takes the key of its name (`labelKey`) and translates it, like every included template. |
| 4 and 5. Button holding controls, role not allowed | A section heading in the card details is a real `h3` holding a real `button` (the WAI disclosure pattern) with `aria-expanded="true"` or `"false"`; the section menu and the layout toggle are beside the button. Enter, Space and a click on the heading still fold the section; this was checked in the browser. |
| 6. Sign in and register | The form is the page's `main` landmark; the empty logo `h1` is a spacer, not a heading; the form's title is the level-one heading (the package draws it as an `h3`, so it gets `aria-level="1"`, and again whenever the form is redrawn). |
| 7. No level-one heading | The page title in the header bar is a level-one heading (`role="heading"`); Activity, the import start page and Bookmarks got a title (they had none, so their heading would have been empty); the "No Due Cards Found" heading is an `h2`. |

### Two more found while adding the scan to the test suite

The Playwright spec runs in a 1280 x 720 window, shorter than the 1280 x 900 of
the audit, and with a fresh user. It found two faults the audit had not:

- **`/shortcuts`**: the list scrolls in a short window and had nothing
  focusable, so a keyboard user could not scroll it (`scrollable-region-focusable`,
  WCAG 2.1.1). The list now has `tabindex="0"`, a `region` role and a name.
- **`/bookmarks`**: the page had no title in the header bar, so the new
  level-one heading was empty (`empty-heading`). It is named "Starred boards".

This is also why the viewport belongs in an audit: the result depends on it.

### Checks that keep it fixed

| Check | Result on 2026-11-02 |
|---|---|
| `tests/accessibilityAuditFixes.test.cjs`: each fault pinned by its shape; contrast ratios are computed from the stylesheets, for every label colour, the header blue and the greys | 7 tests pass |
| `tests/playwright/specs/45-axe-accessibility.e2e.js`: axe-core on the pages, fails on any violation, and presses Enter and Space on a section heading | 4 tests pass (Chromium) |
| Four existing Playwright specs that touch the card sections, the date format and subtasks, run against the changed UI | 43 tests pass (Chromium) |
| All Node suites (`node tests/run-node-suites.cjs`) | 2118 suites, 0 failed |

Five existing unit tests pinned the old markup (the old `#2980b9` in many
stylesheets, a `role="button"` on the heading, `h3` in the title, a `#999`
tile colour, an editor harness) and were updated to the new markup; each keeps
the assertion that made it worth having.

### Dark themes (#6863), found after the fix above

The colour change above made the quiet text greys dark for every theme, and the
dark themes (`cleandark`, `moderndark`, `dark`, `exodark`) have dark surfaces:
dark grey text on them was nearly invisible. [Issue #6863](https://github.com/wekan/wekan/issues/6863)
reported it ("Dark Themes broken in 12.87"), together with faults that were
older than the audit: Card Settings drew white text on light grey blocks
(1.07:1), popup items, the sidebar's shortcuts row and the "quiet buttons" were
black on dark (1.18 to 2.19:1), and a list header's `!important` light grey beat
each theme's own and left its light text at 1.09:1 and 1.27:1. The audit had
scanned the default theme only, which is why none of this showed.

What was done:

- The quiet text colour is a variable, `--wekan-quiet-text`: `#595959` on the
  light themes (the fallback), `#b4b4b4` on `cleandark`, `#dcdcdc` on
  `moderndark` (lighter greys), and on `dark` and `exodark` for the board, the
  opened card and the sidebar (`exodark`'s popups too). `dark`'s popups are light,
  so they keep the dark one.
- Card Settings' sections take their background from a variable, a faint lift of
  the dark surface instead of `#f7f7f7`; its muted text was `#808080` on
  `#f7f7f7` (3.68:1) and is the quiet variable now, also on the light themes.
- Popup items and the board sidebar's lists were forced black with `!important`
  by popup.css; `moderndark` and `exodark` now force them white where their
  surfaces are dark. Quiet buttons, the sidebar's labels and swimlane lists, the
  shortcuts row, `dark`'s swimlane header and `moderndark`'s selected minicard
  and primary buttons got light text or a darker fill.
- The list header's `!important` background is gone, so each theme's own list
  header applies.

`tests/playwright/specs/46-axe-theme-contrast.e2e.js` scans the four themes, in the
board, the sidebar, Card Settings, an opened card and the custom fields popup,
and finds nothing; `tests/darkThemeContrast6863.test.cjs` pins each rule. A
crawl of more popups and sidebar tabs in `cleandark`, `moderndark`, `dark` and
`exodark` also found nothing.

### The other themes, and colors a member chooses

The same scan was then run on **all 25 board themes** (the board, the filter and
board sidebars, an opened card, Card Settings, and the popups of the card), with
this result before the fix: 0 failures in `belize`, `pomegranate`, `wisteria`,
`natural`, `midnight` and `appleglasspastel`, and failures in the rest:

- **The header and the buttons of eight themes**: white text on the theme's
  accent was 2.1 to 4.3:1 in `nephritis` (`#27ae60`), `pumpkin`, `moderatepink`,
  `strongcyan`, `limegreen`, `relax`, `corteza` and `modern`, and their dark,
  hover and emphasis shades were just as low. The accents are darkened, with the
  same hue, until white text and the header's `#f2f2f2` labels read at 4.5:1; the
  hover, selected and emphasis shades follow, so a hovered button is still
  visibly different. This is the one change that is easy to see: `limegreen` is a
  forest green now, `strongcyan` a teal, `pumpkin` a burnt orange. White text at
  4.5:1 cannot be had on a bright accent. The colour-slide themes `clearblue`,
  `cleargreen`, `clearorange` and `clearpink` end in the same colours, so their
  bottom colour changed too, and their buttons (Start Flow) read.
- **The filter sidebar's headings** were `#808080` on `#f7f7f7` (3.68:1) in every
  theme, the default one too; they use the quiet text variable.
- **`clear*` themes' quiet text** was `rgba(0,0,0,0.4)` (2.83:1); it is 0.68.
- **`cleanlight`'s add-dependency link** was 50% black on `#f8f8f9` (3.64:1); it
  is 70%.

Afterwards **all 25 themes show no colour contrast failure** in those states.
`tests/playwright/specs/46-axe-theme-contrast.e2e.js` runs the scan on every
theme.

What the scan cannot see: axe-core cannot measure text over a **gradient**, so the
headers of the six `clear*` slides are not covered by it (it reports them as
"needs review"). Their ends were not changed beyond the shared accent colours
above, and white text on the light top of a slide (`clearblue`'s `#499bea` is
3.0:1) is not verified here.

**Colors a member chooses.** A free color choice is one half of a pair, and the
other half is worked out so the pair is legible, whatever was picked
(`models/lib/contrastColor.js`, `tests/customColorContrast.test.cjs`):

| Chosen | Paired with | What is done |
|---|---|---|
| A custom label, card, list or swimlane color | its text | The text is black or white, whichever has the higher contrast (`contrastText`): never below 4.5:1 on any color, checked on a sample of every color and on the named colors. Kanri's export of a label's text follows the same rule. |
| A custom theme accent, or the two ends of a custom slide | the header's white text and `#f2f2f2` labels | The color is darkened, with the same hue, until both are at 4.5:1 (`readableAccent`). The picker's preview shows the darkened color and says so. |
| The text color a member picks (Member Settings / Font) | the surface of the theme in use | The color is lightened or darkened, with the same hue, until it reads at 4.5:1 on the surfaces of that theme (`readableUiTextColor`); a color that already reads is applied as chosen. The popup says when it changed it. The text color no longer reaches the header bars, labels and primary buttons, which sit on a color of their own: a grey `#626262` was 1.18:1 on the blue header. |
| A dependency line's color | the board | The line is drawn at 3:1 against the theme's surface (WCAG 1.4.11); the stored color is untouched. |

A text color cannot be legible on a light and a dark surface at once. The four
themes with a dark board (`cleandark`, `moderndark`, `dark`, `exodark`) use the
dark surfaces, the others the light ones; the light popups of `dark` and
`exodark` are a case the choice cannot cover.

### Known side effects of the colour change

- `#2980b9` was the default blue in 21 files; `#2573a7` is slightly darker and
  was checked by eye on the card and the sign-in page only.
- The quiet greys changed in 12 stylesheets. The dark themes were not scanned at
  first and showed them dark on dark; that is fixed above (#6863).
- The PDF export's progress bar still draws `#2980b9`; it is not part of the
  web pages.

The rest of this page is the audit as it was found, kept as a record.

## How it was run

| | |
|---|---|
| WeKan | v12.83.0, release bundle built from `main`, started on its own port |
| Database | FerretDB v1.104.0 with the SQLite backend (a fresh, empty database) |
| Scanner | [axe-core](https://github.com/dequelabs/axe-core) 4.14.0, injected into each page |
| Rule sets | `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa` and `best-practice` |
| Browser | Chromium 156 (headless), driven by Playwright |
| Viewport | 1280 x 900 (laptop), one pass, no mobile size |
| Theme and language | The default theme (blue header, `#2980b9`), English, light mode |
| User | A seeded site admin, signed in with a resume token |
| Data | One private board with three lists and three cards |

The scan ran after each page had settled (about 2.5 seconds after load).
Sign-in and sign-up were scanned signed out; the other pages signed in.

## Summary

| Page | Rules violated | Elements |
|---|---|---|
| Sign in (`/sign-in`) | 4 | 6 |
| Sign up (`/sign-up`) | 4 | 6 |
| All Boards (`/`) | 2 | 14 |
| Board, swimlanes view | 2 | 16 |
| Board with a card open | 5 | 45 |
| Global search (`/globalsearch`) | 2 | 7 |
| Accessibility page (`/accessibility`) | 3 | 7 |

Counted by severity, the rules that were violated are:

| Impact | Rules | Where |
|---|---|---|
| Critical | `label` | card details |
| Serious | `color-contrast`, `label-content-name-mismatch`, `nested-interactive` | header bars on every signed-in page; card details |
| Moderate | `heading-order`, `landmark-one-main`, `region`, `page-has-heading-one` | sign in and up; accessibility page |
| Minor | `empty-heading`, `aria-allowed-role` | sign in and up; card details |

axe also reported `incomplete` results, checks it could not decide and that need
a person's eyes: colour contrast on 2 to 4 elements per signed-in page (text
over a gradient or an image), and one Label in Name check on All Boards.

## Findings

### 1. Colour contrast of the header bars (WCAG 1.4.3, AA, serious)

On every signed-in page the header text is lighter than AA allows on the
default blue:

| Text | Background | Ratio | Needed | Where |
|---|---|---|---|---|
| `#ffffff` | `#2980b9` | 4.30 | 4.5 | page title in the header (14 px) |
| `#f2f2f2` | `#2980b9` | 3.84 | 4.5 | the labels of the header buttons ("Sort Boards", "Notifications", "Private", "Watch" and the rest) and the user name |
| `#f6f6f6` | `#2980b9` | 3.97 | 4.5 | text in a viewer inside a blue area |
| `#ffffff` | `#999999` | 2.84 | 4.5 | a card label chip (`.label`) |
| `#8c8c8c` | `#dedede` | 2.49 | 4.5 | the page heading on Global search (20 px) and an inline form placeholder |

This is the largest group: 11 elements on All Boards, 13 on a board and 20 with
a card open. Most share one cause, the near-white text on `#2980b9`, so a
change to that colour or to the text colour of the header buttons would likely
remove most of them in one place. The Apple glass
pastel theme was designed and measured against WCAG AA separately
(`tests/playwright/specs/theme-appleglasspastel-contrast.e2e.js`); this scan
used the default theme, so the two results do not contradict each other.

Other board colours were not scanned. Each has its own header colour, so each
needs the same check (the fix changed only the default theme, `belize`).

### 2. Label in Name (WCAG 2.5.3, A, serious)

Three header controls have an `aria-label` that does not contain the text a
sighted user sees, so a voice-control user who says what they see cannot
activate them:

- the **Starred** menu (`.js-open-starred-boards`): the label is "Starred",
  the visible text is the star count (`0`);
- the **Member Settings** link (`.header-user-bar-name`): the label is
  "Member Settings", but the visible text is something else (the user's name
  or avatar);
- every **member avatar** (`a.member.js-member`): the label is the full name
  and, for an admin, the role ("... Admin"); the visible text is different
  (the initials).

Fix: make the accessible name start with, or contain, the visible text
(for example "0 Starred", or the user's name followed by "Member Settings").
It affects the header on every signed-in page (3 elements) and the avatar in
the card details (a 4th).

### 3. Form fields without a label (WCAG 4.1.2 and 1.3.1, A, critical)

On the card details, two controls have no label, no `aria-label` and no
`title`:

- the Pomodoro **work minutes** number input (`.js-pomodoro-work-minutes`);
- the new **comment** editor (`textarea.js-new-comment-input`).

A screen reader announces both as "edit text" with no purpose.

### 4. Interactive controls inside a button (WCAG 4.1.2, A, serious)

In the card details, the section headings `h3.js-toggle-card-section` for
**Custom Fields**, **Vote**, **Poker** and **Subtasks** carry `role="button"`
and also contain other focusable controls: the section menu or edit link
(`a.card-details-section-menu`, titled "Custom Fields", "Edit voting",
"Edit Planning Poker" and "Subtasks") and, for Custom Fields, the layout toggle
button. A button must not contain focusable descendants: the inner control
cannot be reached or announced reliably.

Fix: keep the toggle and the action links as siblings in a wrapper instead of
nesting them.

### 5. ARIA role not allowed on the element (best practice, minor)

All 15 section headings (`h3` with `role="button"`; the four of finding 4 are
among them) are flagged by `aria-allowed-role`: an `h3` should not take the
`button` role, because it loses its heading meaning. A `<button>` inside the
`<h3>`, as the WAI disclosure pattern does, keeps both the outline and the
control. The same change as finding 4 fixes this one too.

### 6. Page structure on sign in and sign up (best practice)

Both signed-out pages report the same four items:

- **`landmark-one-main`**: there is no `main` landmark;
- **`region`**: the title, the "Register" / "sign in" link and the language
  picker are outside any landmark (3 elements);
- **`empty-heading`**: the logo is an empty `<h1 class="at-form-landing-logo">`,
  so the page has a first-level heading with no text;
- **`heading-order`**: the visible title "Sign In" / "Create an Account" is an
  `<h3>` directly after that empty `<h1>`.

The signed-in layout has landmarks (see the WCAG 1.3.1 test in
`tests/playwright/specs/19-accessibility.e2e.js`); the sign-in form does not.
Fix: wrap the form in `<main>`, give the title the `<h1>` and make the logo
an image with an `alt`, or hide it from assistive technology.

### 7. Accessibility page has no level-one heading (best practice)

`/accessibility` has no `<h1>` (`page-has-heading-one`). The page title is
shown in the header bar as a `span`.

## What passed

axe ran 48 distinct rules that passed on at least one of the pages, among
them: the page language (`html-has-lang`, `html-lang-valid`), the document
title, the skip link (`bypass`, `skip-link`), image alt text, link names,
button names, select names, `aria-*` attribute and role validity, required
ARIA attributes, `aria-hidden` on focusable elements, valid `tabindex`,
scrollable regions that are focusable, lists, and meta viewport scaling
(`meta-viewport`). A rule that passes on one page can still fail on another.
The existing end-to-end test
`19-accessibility.e2e.js` also checks the language, the skip link, the
landmarks, the visible focus and the dialog control names.

## What this audit does not cover

- Only Chromium, one viewport (1280 x 900), the default theme, light mode.
  Not covered: the phone and tablet layouts, dark mode, high contrast, the
  other board colours, the other themes, and right-to-left languages.
- Seven pages in one state. Not scanned: popups and menus (member menu, board
  menu, card menu, filter, sort), the hamburger sidebars, the Admin Panel, the
  card edit forms, the Gantt, Calendar and Table views, dragging, and the
  import and export pages.
- Rules that need a person: reading order, whether a label makes sense, focus
  order across a drag, error messages, time limits, motion, and the quality of
  text alternatives. These need keyboard-only and screen-reader testing (NVDA,
  JAWS, VoiceOver, TalkBack).
- No automated check for "target size" (WCAG 2.5.8, 2.2) or the other
  WCAG 2.2 criteria; axe 4.14 was run against the 2.0 and 2.1 sets only.

## Suggested order of work

Steps 1 to 4 are done (see Status above), and the axe scan is in the Playwright
suite as `45-axe-accessibility.e2e.js`. What is left:

1. Repeat the scan for the states and pages this audit did not reach: popups
   and menus, the hamburger sidebars, the Calendar, Gantt and Table views, the
   card edit forms, and the rest of the Admin Panel.
2. Repeat it for the other board colours and themes, at a phone width, in dark
   mode and with a right-to-left language. The header colour of every board
   colour needs the 4.5 check that the default theme now passes.
3. Test with people: keyboard only, and a screen reader (NVDA, JAWS, VoiceOver,
   TalkBack).

## How to repeat it

Run a WeKan server and a database it can reach, seed a user and a board (the
Playwright helpers in `tests/playwright/helpers/db.js` do this), then for each
page inject `axe.min.js` and call:

```js
await axe.run(document, {
  runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] },
  resultTypes: ['violations', 'incomplete'],
});
```

`tests/playwright/specs/45-axe-accessibility.e2e.js` does exactly this for the
pages above, with the `axe-core` package of `tests/playwright`, and signs in
with `loginWithToken` from `tests/playwright/helpers/auth.js`. Run it like the
other Playwright specs. The original trial used `axe-core` 4.14.0 and the
Chromium of the repository's Playwright cache (`.tools/ms-playwright`).
