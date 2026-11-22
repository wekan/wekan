# Help button: What is it? How it works?

## What it is

A small **?** button at every place in WeKan that is a feature of its own: each
board view, each view of the board's right sidebar, each Board Settings and
Member Settings popup, each section of an opened card and the popups opened
from a card, each Admin Panel pane (Settings, People, Attachments, Problems,
Cloud), and the All Boards, Workload, Budget and billing and Rules pages.

Clicking it opens a big popup titled **How it works**, with two headings:

- **What is it?** - what the feature is and why one would use it;
- **How it works?** - how to use it, and what happens when you do.

The two texts are short plain prose, translated like the rest of the interface,
so a user can find out what a place does without leaving WeKan and without
reading English. They have **no links**: the links, the details and the code
references stay here, in the English docs of the WeKan repository, which each
help was written from.

## Read more

- [Context-sensitive help](https://en.wikipedia.org/wiki/Context-sensitive_help)
  on Wikipedia.
- [WCAG 2.2, 2.5.8 Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) -
  why the button is at least 24 by 24 pixels.
- [WAI-ARIA Authoring Practices: Dialog (Modal)](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) -
  Escape closes the popup and the focus goes back to the button.
- WeKan: [Translations](Translations/), [RTL editor](Editor/RTL/),
  [Keyboard shortcuts](Keyboard-Shortcuts/Keyboard-Shortcuts.md).

## How to use it

1. Find the **?** at the end of the place's heading: beside the Board View
   menu in the header bar, at the end of a sidebar view's or card section's
   heading, in a popup's title bar before its close button, or beside an Admin
   Panel pane's title. In a right-to-left language such as Arabic or Hebrew it
   is at the left, mirrored like the rest of the page.
2. Hover it to see its tooltip, **How it works?**, or reach it with Tab - it is
   a real button with a visible focus ring.
3. Click it, or press Enter or Space. The **How it works** popup opens, wide on
   a desktop and full screen on a phone.
4. Read **What is it?** and **How it works?**.
5. Press **Escape**, or click the X. The focus is back on the **?**. A ? inside
   a popup opens its help on top of that popup, and Escape goes back to it.

A place with no page in the docs yet (the card's Vote, Admin Panel / Problems /
Email, an environment-variable-only or REST API feature) has no ?.

## How the numbers are calculated

- **161 help points**, each with two texts: **322 description keys**, named
  `help-<id>-what-it-is-description` and `help-<id>-how-it-works-description`,
  plus three shared keys: `what-it-is` (*What is it?*), `how-it-works` (*How it
  works?*, also the tooltip) and `featureHelpPopup-title` (*How it works*, the popup
  title).
- **At most 600 characters** per text, in English; most are 250-450, one to
  four sentences.
- **One help per place, not per page**: views drawn from one page of the docs
  share its help. The twelve flow analytics charts share *board-view-flow*, the
  six board reports *board-view-reports*, the six overview charts
  *board-view-dashboard*, the five sprint and release charts
  *board-view-burndown*, and the three Gantt views *board-view-gantt*. Every
  Attachments storage pane shares *admin-attachments*, and every Cloud Panel
  pane *admin-cloud*.
- **The button**: a target of at least 28 by 28 CSS pixels, over the 24 that
  WCAG 2.2 asks for; the popup is 720 pixels wide on a desktop, at most 90
  percent of the window.

## How it works in WeKan

**The data** is one pure module, [models/lib/featureHelp.js](../../../models/lib/featureHelp.js):

| Name | What it holds |
| --- | --- |
| `FEATURES` | help id -> the docs page its texts were written from |
| `BOARD_VIEW_HELP` | every Board View -> its help |
| `SIDEBAR_VIEW_HELP` | the board sidebar's views -> their help |
| `POPUP_HELP` | popup template name -> its help |
| `CARD_SECTION_HELP` | the card's sections (`cardSectionHeader`'s `section`) -> their help |
| `PANE_HELP` | Admin Panel route -> menu entry id -> its help; the Cloud Panel and All Boards routes have one help each |

**The component** is [client/components/main/featureHelp.jade](../../../client/components/main/featureHelp.jade)
(`featureHelp` and `featureHelpPopup`), `.js` and `.css`. A template draws
`+featureHelp(id='workload')`; an id that is not in `FEATURES` draws nothing,
which is what lets a shared header pass whatever is open in it:

| Place | Where the ? is drawn |
| --- | --- |
| Board views | `boardViewMenu` in `client/components/boards/boardHeader.jade` (`boardViewHelp`) |
| Board sidebar views | the view heading in `client/components/sidebar/sidebar.jade` (`sidebarHelp`) |
| Every popup | the title bar in `client/components/main/popup.tpl.jade` (`popupHelp`) |
| Card sections | `cardSectionHeader` in `client/components/cards/cardDetails.jade` (`sectionHelp`) |
| Admin Panel and All Boards panes | `paneTitle` in `client/components/settings/leftMenu.jade` (`paneHelp`, from `paneTitle()`'s `paneId`) |
| Workload, Budget and billing, Rules | their own heading, with a literal id |

**The popup** is opened with `Popup.open('featureHelp', { dataContext, returnFocusSelector })`, titled by
the popup convention key `featureHelpPopup-title`. Its texts are
rendered with double braces, never triple, so a translation can never become
markup. Escape closes a top-level help and `Popup.close()` focuses its opener,
the ?; a help opened from inside a popup is a sub-popup, and `Popup.back()`
focuses the element `returnFocusSelector` names in the popup it returns to.

**Placement** uses logical properties only - `margin-inline-start: auto` in a
heading's flex row, `inset-inline-end` in a popup title bar beside the
absolutely placed maximize and close buttons, with the title giving up the
room - so right-to-left languages mirror it with no rule of their own, and it
never sits on top of another button.

**Translations.** The English texts are in `en.i18n.json` and, as English
placeholders, in every locale file, in en's order, and listed in
`releases/translations/pending-transifex.json`;
`node releases/translations/fill-translations.mjs --list <lang>` lists them for
translation. The three shared keys are translated in every language.

**Tests.**

| File | What it pins |
| --- | --- |
| `tests/featureHelp.test.cjs` | every id has both English keys and an existing docs page; no text in any language has a link, an address, a file name, Markdown or a placeholder; every literal and mapped id is known, every id is shown somewhere, and an unknown id has no help (negative); the button, the popup's order, the focus return, the logical CSS and the wide popup |
| `tests/leftMenu.test.cjs` | `paneTitle()` returns the open entry's `paneId` |
| `tests/playwright/specs/feature-help.e2e.js` | a click opens both headings and texts, Escape gives the focus back, a ? inside a popup returns to it, and under Arabic the ? is mirrored |

## Commits

- Help button: models/lib/featureHelp.js, the component and its places, the
  English texts and the translated headings, and these tests (2026-11-22).
