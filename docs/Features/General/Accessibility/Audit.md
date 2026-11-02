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
needs the same check.

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

1. **Header contrast** (finding 1): one colour token fixes the largest group on
   every page, and the header is on every signed-in page.
2. **Names** (findings 2 and 3): small markup changes: an accessible name that
   contains the visible text, and a label on two fields.
3. **Section headings in the card details** (findings 4 and 5): one pattern
   change that removes 15 elements and two rules.
4. **Sign in and sign up** (finding 6): the first page every user sees.
5. Repeat the scan for the pages and states in the previous section, and add
   the axe scan to the Playwright suite so a regression fails a test.

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

The trial used `axe-core` 4.14.0 and the Chromium of the repository's
Playwright cache (`.tools/ms-playwright`), and signed in with
`loginWithToken` from `tests/playwright/helpers/auth.js`. The script was a
throwaway one and is not part of the repository.
