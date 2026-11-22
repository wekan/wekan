# Member Settings / Change Settings

## What it is

**Change Settings** holds your personal editing and display choices: drag
handles, marking changed cards, what happens to the title and the form when
you add a card, the focus outline, saving editors with Enter, opening many
cards, the checklist sound, the list card count and the card-description
rescue dialogue. They are saved to your profile and apply only to you, on every
board.

To change date format, the first day of the week or the calendar system, use
[Member Settings / Date](Date/README.md).
To control delivery, use [Notifications](Notifications.md).

## Read more

- [Kanban (development)](https://en.wikipedia.org/wiki/Kanban_(development)) on
  Wikipedia - the board, lists and cards these settings act on.
- [Focus (computing)](https://en.wikipedia.org/wiki/Focus_(computing)) on
  Wikipedia, and
  [WCAG 2.1 Understanding 2.4.7 Focus Visible](https://www.w3.org/WAI/WCAG21/Understanding/focus-visible.html) -
  why the focus outline is on by default.
- [Usability](https://en.wikipedia.org/wiki/Usability) on Wikipedia.
- [Member Settings / Date](Date/README.md) and [Notifications](Notifications.md).

## How to use it

1. Click your username or avatar at the top right, then **Change Settings**.
2. Click a switch to turn it on or off. A check mark shows that it is on. The
   switches are saved at once.
3. For **Show cards count if list contains more than**, type a number and click
   **Save**. **Save** applies this number and closes the popup.

The switches, in the order of the popup:

| Switch | Default | What it does |
| --- | --- | --- |
| **Show desktop drag handles** | on for a touch screen, off for a mouse | shows the handles to drag cards, lists and swimlanes |
| **Mark cards changed since I last opened them** | off | a card whose title, description, dates, labels, members, checklists, attachments or comments changed after you last opened it gets a blue edge on its minicard, until you open it ([#2111](https://github.com/wekan/wekan/issues/2111)) |
| **Keep #label and @member in new card titles** | off | see *New card titles* below |
| **Show focus outline** | **on** | see *The focus outline* below |
| **Keep the Add card form open after adding a card** | off | see *The Add card form after adding a card* below |
| **Turn [label] at the start of a new card title into a label** | off | see *New card titles* below |
| **Submit editors with Enter** | off | on: Enter saves the card title, description and other inline editors, Shift+Enter inserts a new line; off: Ctrl/Cmd+Enter saves and Enter inserts a new line |
| **Open many cards at once** | off | on: every clicked card stays open in its own window; off: clicking a card closes the one that was open ([#6531](https://github.com/wekan/wekan/issues/6531)) |
| **Play a sound when a checklist item is completed** | off | plays a short ding when you check off a checklist item ([#5427](https://github.com/wekan/wekan/issues/5427)) |

Under **Card Settings** (not shown to Worker accounts):

- **Show cards count if list contains more than** - the number of cards from
  which a list header shows its card count (see the numbers below).
- **Show rescue dialogue before closing for unsaved card descriptions** - asks
  whether to save an unsaved card description when you click out of the card.

### New card titles

Two switches decide what the title of a new card becomes when it is typed in
a list's **Add card** form. Both are personal and off by default; click one to
turn it on or off, and a check mark shows that it is on.

| Switch | On | Off (default) |
| --- | --- | --- |
| **Keep #label and @member in new card titles** | a label picked with `#` or a member picked with `@` while typing is added to the card and its text stays in the title | the text is replaced by the label or the member |
| **Turn [label] at the start of a new card title into a label** | `[Fedora] Do a thing` makes the card *Do a thing* with the label *Fedora*, created on the board if it has no label by that name ([#3986](https://github.com/wekan/wekan/issues/3986)) | the title is kept as typed, brackets and all ([#6810](https://github.com/wekan/wekan/issues/6810)) |

Only one `[...]` at the very start of the title is read, and only when more
text follows it: `[] Do a thing`, `[Fedora]` alone and nested brackets stay
literal title text. The label name is matched case-insensitively.

### The Add card form after adding a card

**Keep the Add card form open after adding a card** is personal and off by
default. Off, a list's **Add card** form closes once the card - or every card
of a multi-line paste - is added
([#6827](https://github.com/wekan/wekan/issues/6827)). On, it stays open with
an empty title, ready for the next card, as it used to for everyone. Esc or the
form's x closes it either way.

### The focus outline

**Show focus outline** is personal and **on** by default. The blue ring round the
focused control is an accessibility feature (WCAG 2.4.7, Focus Visible): it tells
a keyboard user where they are, and it also shows after a click on a minicard,
which some members find distracting
([#6755](https://github.com/wekan/wekan/issues/6755)). Untick it and the ring - the
outline and its halo - is hidden for you, on every board; other members keep
theirs. Field borders and the colour a button takes on focus are not the ring and
stay. If you use the keyboard to move through WeKan, leave it on.

## How the numbers are calculated

- **Show cards count if list contains more than** (`profile.showCardsCountAt`):
  a whole number, at least -1. **Save** parses the field with `parseInt`; an
  empty, non-numeric or smaller value is saved as -1
  ([client/components/users/userHeader.js](../../../client/components/users/userHeader.js)).
  A list header shows its count when the number is 0 or more and the list's
  card count is **greater than or equal to** it (`showCardsCountForList()` in
  [client/components/lists/listHeader.js](../../../client/components/lists/listHeader.js)) -
  so despite the label, a list with exactly that many cards shows it too. -1,
  or never saving a number, shows no count.
- **Drag handles default:** a member who never chose gets handles on a touch
  screen and none with a mouse (`resolveShowDragHandles()` in
  [models/lib/dragHandles.js](../../../models/lib/dragHandles.js)); a choice
  is stored as an explicit `true` or `false`, so it sticks on both.
- The other switches have no numbers: each is a true/false field of the
  profile, off unless set (the focus outline is stored as the exception,
  `hideFocusOutline`, so it is on unless set).

## How it works in WeKan

- **Popup:** `changeSettingsPopup` in
  [client/components/users/userHeader.jade](../../../client/components/users/userHeader.jade),
  helpers and events in
  [userHeader.js](../../../client/components/users/userHeader.js), styled by its
  own class `change-settings-list` (`userForm.css`,
  [#6835](https://github.com/wekan/wekan/issues/6835)).
- **Methods** in [server/models/users.js](../../../server/models/users.js),
  each saving one profile field for the signed-in user:
  `toggleDesktopDragHandles` (`profile.showDesktopDragHandles`),
  `toggleUnreadChanges` (`profile.unreadChangesSince`, the time it was turned
  on, so cards never opened are not all marked), `toggleKeepTitleTags`
  (`profile.keepTitleTags`), `toggleHideFocusOutline`
  (`profile.hideFocusOutline`), `toggleKeepAddCardFormOpen`
  (`profile.keepAddCardFormOpen`), `toggleTitleBracketLabel`
  (`profile.titleBracketLabel`), `toggleSubmitOnEnter`
  (`profile.submitOnEnter`), `toggleOpenManyCardsAtOnce`
  (`profile.openManyCardsAtOnce`), `toggleChecklistDingSound`
  (`profile.checklistDingSound`), `toggleRescueCardDescription`
  (`profile.rescueCardDescription`) and `changeLimitToShowCardsCount`
  (`profile.showCardsCountAt`). A signed-out visitor's drag-handle choice and
  card count are kept in `localStorage` instead.
- **New card titles:** the title is parsed by `quickAddTitleParts()` in
  [models/lib/quickAddCardLabel.js](../../../models/lib/quickAddCardLabel.js).
- **Add card form:** `addCard` in
  [client/components/lists/listBody.js](../../../client/components/lists/listBody.js)
  closes the form after its last title.
- **Focus outline:** [client/components/main/uiFont.js](../../../client/components/main/uiFont.js)
  puts the class `has-hide-focus-outline` on `<body>` and
  [client/components/main/layouts.css](../../../client/components/main/layouts.css)
  turns it into no ring.
- **Tests:** [tests/titleBracketLabel6810.test.cjs](../../../tests/titleBracketLabel6810.test.cjs),
  [tests/keepAddCardFormOpen6827.test.cjs](../../../tests/keepAddCardFormOpen6827.test.cjs),
  [tests/hideFocusOutline6755.test.cjs](../../../tests/hideFocusOutline6755.test.cjs),
  [tests/unreadChanges.test.cjs](../../../tests/unreadChanges.test.cjs),
  [tests/openManyCardsAtOnce.test.cjs](../../../tests/openManyCardsAtOnce.test.cjs),
  [tests/checklistDingSound.test.cjs](../../../tests/checklistDingSound.test.cjs),
  [tests/cardDescriptionRescue.test.cjs](../../../tests/cardDescriptionRescue.test.cjs),
  [tests/dragHandles.test.cjs](../../../tests/dragHandles.test.cjs),
  [tests/cardsCountSwimlaneScope.test.cjs](../../../tests/cardsCountSwimlaneScope.test.cjs),
  and the browser tests
  [title-bracket-label-6810.e2e.js](../../../tests/playwright/specs/title-bracket-label-6810.e2e.js),
  [keep-add-card-form-open-6827.e2e.js](../../../tests/playwright/specs/keep-add-card-form-open-6827.e2e.js),
  [hide-focus-outline-6755.e2e.js](../../../tests/playwright/specs/hide-focus-outline-6755.e2e.js),
  [change-settings-popup-6835.e2e.js](../../../tests/playwright/specs/change-settings-popup-6835.e2e.js)
  and [card-description-rescue.e2e.js](../../../tests/playwright/specs/card-description-rescue.e2e.js).

## Commits

 - [a per-member switch to hide the focus outline](https://github.com/wekan/wekan/commit/144777ae6bc1e4b12cfcbcce13732d2c7d301eda)
 - [icons in a column, compact wrapped lines and divided rows in the popup](https://github.com/wekan/wekan/commit/ffd5cbd2adb28fbfe2b4328b96909357dbfd91b7)
 - [the Add card form closes after adding, unless kept open](https://github.com/wekan/wekan/commit/70de2553338e51cf652a9b58ebe390c02a395a5d)
 - [a leading [Text] becomes a label only when turned on](https://github.com/wekan/wekan/commit/f89c8f80300074185c035db033320ae2e679af12)
 - [keeping #label and @member in a new card's title, pinned with the issue's example](https://github.com/wekan/wekan/commit/cd4c4ad9ceed39b4f294b4568028317bf915b18b)
 - [the Keep #label and @member switch, shipped in v12.43](https://github.com/wekan/wekan/commit/a6b2938e1cb1ac4bfaefe8ad210b84f971380ba0)
 - [cards changed since a member last opened them are marked](https://github.com/wekan/wekan/commit/d8690a26f5d8f3c2ee1e07989f59d9c67b1815b8)
 - [quick-add bracket label syntax, e.g. [Fedora] Do a thing](https://github.com/wekan/wekan/commit/bc699ab43b379081755022ee4d5aa63d19f61039)
 - [a ding when a checklist item is checked off](https://github.com/wekan/wekan/commit/6e36dcabe5ca01dadd106b066ec21b7f954d4dd7)
 - [the rescue checkbox sits beside its label](https://github.com/wekan/wekan/commit/c687daadf4d357e5653c7807320e3161302a798e)
 - [clicking a card closes the open one; keeping many open is a setting](https://github.com/wekan/wekan/commit/2973240a7fa50cef37f815a469cff4756b353466)
 - [optional Submit editors with Enter](https://github.com/wekan/wekan/commit/bb6b0d5477368a97ba5cc1c01bdb598dcbe68cd2)
 - [the Toggle Drag Handles setting is back](https://github.com/wekan/wekan/commit/5cb712bee4cf46c6fe13d7dacf4b62298152b894)
 - [rescue dialogue for unsaved card descriptions](https://github.com/wekan/wekan/commit/b3056626f3af2896c2838748181727325609800d)
 - [Show cards count also shows 1 card](https://github.com/wekan/wekan/commit/8475201db8e92c648b35396c8d4b5aff98972d21)
 - [Show cards count has no maximum](https://github.com/wekan/wekan/commit/40907ef1d8203a4d0dd102dba2ee2b7a64dfd783)
 - [Show cards count accepts keyboard input](https://github.com/wekan/wekan/commit/b79fc532655ee1e3f3c9fa8a37a84c6fd1686fa3)
