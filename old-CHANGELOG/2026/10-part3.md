# WeKan ® 2026-10 releases, part 3

Moved out of [CHANGELOG.md](../../CHANGELOG.md) to keep that
file small enough to open (wekan/wekan#6580). Nothing here has been changed:
a release section is a record, and it reads the same as it did there.

This is part 3 of 6, newest first: [1](10.md), [2](10-part2.md), 3, [4](10-part4.md), [5](10-part5.md), [6](10-part6.md).

Releases per day:

| 2026-10 | Releases |
| --- | --- |
| 07 | 2 |
| 08 | 1 |

# v12.22 2026-10-08 WeKan ® release

**In short:** The **Snap** now says at once when the computer's AppArmor policy,
not the database, refuses WeKan's own database connection, with the fix for the
known snapd 2.77.1 kernel problem behind it, four SAML settings can be set
with `snap set` again, the **Rules** "Set color to" action can pick any card
color, the Rules list's selection checkboxes are visible again, **card
filters** follow a member's access changes even when the board observer
stalls, the **D** keyboard shortcut opens the opened card's due date, today
stands out in the **calendars**, and **pbkdf2** is updated for a
denial-of-service advisory.

This release adds the following new features:

**Keyboard shortcuts** - a key for the opened card's due date.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/784d529003ebb47c70fb29e1066aa47d7bd82d5b">D opens the Due date editor of the opened card</a>. Thanks to mimZD and xet7.</summary>

With keyboard shortcuts turned on in the member settings, pressing `d` (or
Shift+D) opens the same Due date popup as clicking the due date `+` or badge in
the opened card's details. It does so by clicking that control, so it works
only where a click would: the board allows due dates and the member may edit
the card. Typing `d` in the card title, a comment or any other field does not
trigger it, and nothing happens with shortcuts turned off. The keyboard
shortcuts help (`?`) lists it. `tests/dueDateKeyboardShortcut.test.cjs` pins
the binding, the shared filter, the opened-card and permission rules and the
help entry, with negative cases; the Playwright spec
`due-date-keyboard-shortcut.e2e.js` covers the popup, shortcuts off and typing
in fields.

</details>

**Calendar** - today is easy to find in the date popup and the board Calendar.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/519fb2c105f8a2b6e41d6125c3fe28501acfb360">Today's day stands out in the date popup and the board Calendar view</a>. Thanks to mimZD and xet7.</summary>

The due, start and end date popup's calendar did not mark today at all. Today's
day button now has the `is-today` class and `aria-current="date"`, and its cell
`is-today-cell`: a ring and underline drawn in the button's own text colour and
a subtle cell tint, so it stays visible on every board colour theme, custom
theme colour, light and dark, and in RTL. The rule is more specific than the
themes' picker button rules so none of them can hide it. The board Calendar
view already tinted today's cell; its day number is now also a filled circle in
the board theme's colour. `tests/calendarTodayMarker.test.cjs` pins the marker
on today only, in Gregorian and Jalali, and that no CSS rule in `client/`
overrides or hides it; the Playwright spec `calendar-today-marker.e2e.js`
compares today with a neighbouring day in both calendars.

</details>

and updates the following dependencies:

- **pbkdf2 3.1.3 → 3.1.7** — key derivation in the browser crypto stubs that
  meteor-node-stubs bundles; fixes long passwords being hashed again on every
  iteration, [GHSA-477h-4r7f-fvrx](https://github.com/advisories/GHSA-477h-4r7f-fvrx).
  The bundled copy cannot be overridden, so a postinstall script replaces it
  with the top-level package ([the update](https://github.com/wekan/wekan/commit/f5836c3a375b5596f24331cbce3d2f83ace23eb7)).

Thanks to dependabot.

and fixes the following bugs:

**Snap database tools** - backup, restore and WeKan's wait for its database.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f927cb3c50708c2e84ad57323edf36761a7d3165">A database connection refused by AppArmor is named at once, with the fix</a>. Thanks to fabiosalles and xet7.</summary>

The kernel log in [#6746](https://github.com/wekan/wekan/issues/6746) held 1300
lines of `apparmor="DENIED" operation="file_perm" class="net"` for
`snap.wekan.wekan` on 127.0.0.1:27019, and the same denial for two other snaps.
FerretDB was running; the kernel refused the first write on an accepted
connection. That is snapd 2.77.1 on a kernel with an AppArmor socket bug
([snapd bug 2169038](https://bugs.launchpad.net/snapd/+bug/2169038)), fixed by
a newer kernel and worked around by `sudo snap revert snapd`. WeKan cannot lift
the denial, so the new `bin/socket-denied` recognises it and prints what to
look for and both ways out. WeKan's FerretDB and MongoDB waits print it on the
first refused attempt instead of "not ready yet" for two minutes, and backup
and restore stop at once instead of starting a running service and waiting 90
seconds. `tests/snapSocketDenied.test.cjs` checks the reporter's exact errors,
with negative tests that a database which is merely down gets no AppArmor
advice; `tests/snapDatabaseRestore.test.cjs` runs both tools against a refused
connection. Not run in an installed snap or on an affected kernel.

</details>

**Snap settings** - the `snap set` names behind each WeKan setting.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f927cb3c50708c2e84ad57323edf36761a7d3165">Every service log no longer starts with four snapctl get errors</a>. Thanks to fabiosalles and xet7.</summary>

`SAML_IDP_PROFILE`, `SAML_WANT_RESPONSE_SIGNED`, `SAML_WANT_ASSERTIONS_SIGNED`
and `SAML_LOGIN_FLOW` were listed in `bin/config` without a `snap set` name, so
`wekan-read-settings` ran a bare `snapctl get` for each one. Every service log
showed "error: snapctl: get which option?" and those settings could never be
set. They are now `saml-idp-profile`, `saml-want-response-signed`,
`saml-want-assertions-signed` and `saml-login-flow`, and a setting without a
name falls back to its default instead of calling snapctl.
`tests/snapSettingsKeys.test.cjs` requires a key, default and description for
every setting, rejects shared keys, and runs the real reader against a snapctl
that fails like the real one.

</details>

**Rules** - the actions a rule can run, and choosing rules in the list.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1ad558f3710f69a307202eeb65d9ec0033d534cb">The Set color to action can pick any card color, not only green</a>. Thanks to titver968 and xet7.</summary>

In [#6748](https://github.com/wekan/wekan/issues/6748) the color stayed green
whatever swatch was clicked. The popup's swatch handler read the color from
`Template.currentData()`, which in a Blaze event handler is the popup's own
data, not the clicked swatch, so every click selected nothing. It now reads the
swatch with `Blaze.getData(event.currentTarget)`, like the card, list and
swimlane color popups. `tests/ruleSetColorActionPicker.test.cjs` runs the real
handlers for every color, checks that a click without a color keeps the
selection, and scans every palette handler under `client/` for the same
mistake. A Playwright spec picks red in the Rules editor and checks the saved
action; it was not run here.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2c16c3f173e25bf1d22f602906487f7a4c0f823f">Select all and Unselect all visibly tick and untick every rule</a>. Thanks to titver968 and xet7.</summary>

In [#6749](https://github.com/wekan/wekan/issues/6749) both buttons seemed to do
nothing. They did set the selection, but the checkboxes they change were never
on screen: `forms.css` hides every native checkbox app-wide, because WeKan
draws its own, and the rules list used native ones. So no rule could be ticked
by hand for Delete selected or Export selected either. `rules.css` now undoes
that hiding for the rules list, and each box is labelled with its rule's title.
`tests/rulesSelectAllCheckboxes.test.cjs` runs both buttons and single ticks
with several rules, and checks that no native checkbox in the Rules editor is
left hidden. A Playwright spec checks the boxes are visible and follow both
buttons; it was not run here.

</details>

**Board lists in card popups** - which boards a card can be moved to or under.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9ae7388a7e72de02a7327fcbbf14b28b64da35d2">Card More and multi-selection list every board for a user without a templates board</a>. Thanks to xet7.</summary>

"Change card's parent -> Source board" and the multi-selection destination
picker were empty for a user who has no templates board. Both excluded
`getTemplatesBoardId()`, which is then undefined, and the client
ReactiveCache runs its query through `EJSON.stringify`, which drops
undefined: `_id: { $ne: undefined }` became `_id: {}` and matched no board.
The templates board is now excluded only when there is one.
`tests/reactiveCacheUndefinedSelector.test.cjs` fails on any ReactiveCache
selector with such a call under `$ne`, and the browser spec of several parents
opens More from the card menu and checks the board is offered.

</details>

**Card filters** - which matches a member's filter may return.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/479f530da05a33e1b21166cd3ad9052fd474dea1">Filter matches follow a member's access even when the board observer stalls</a>. Thanks to xet7.</summary>

After a member's assigned-only restriction was lifted, the text filter kept
showing only the assigned cards. On a busy server polling MongoDB, the
filter's board observer delivered its first result and then nothing more, so
no access change reached it - and a narrowing would have been missed the same
way, leaving matches the member may no longer see. Text matches, movement
matches and table pages now also re-read the board every 10 seconds and rescan
when its permission or members differ from those the result was computed
from. `tests/boardTextPublication.test.cjs` widens, narrows and revokes with the
observer silent.

</details>

and has the following developer-tooling fixes:

**Release builds** - the Snap builds Launchpad makes for the extra
architectures.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a3048e4a7a41231d60e91f4ee96719fd45c6e1ea">A stopped Launchpad build is retried with a new build, and a proxy failure is named</a>. Thanks to xet7.</summary>

The v12.21 s390x snap failed: Launchpad's own package proxy answered "501
Gateway error" for one stage-package, and the retries could not help. The
third attempt ran `remote-build --recover`, which reconnects to the build that
had already stopped. Now a build that ended Stopped, Failed or Cancelled is
retried with a new build, while recovery still reconnects after a polling or
TLS error. Each attempt prints only its own Launchpad log, and a 5xx from the
build farm's proxy is named as infrastructure, with the package. The tests in
`tests/releaseSnapRecovery.test.cjs` run the real step with a stand-in
snapcraft. Not run on GitHub Actions or Launchpad here.

</details>

**Tests** - checks that failed on timing or on formatting, not on WeKan.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/63a7fba46571bf61071ae74110da245bd34ef326">The browser tests no longer sign themselves out on Meteor's cookie refresh limit</a>. Thanks to xet7.</summary>

Meteor allows 30 refreshes of the login cookie per 10 seconds per address, and
every page load is one; the whole browser suite comes from localhost.
`ACCOUNTS_COOKIE_REFRESH_RATE_LIMIT` now raises that allowance - the test
server sets it, and an install behind an untrusted proxy can too - and
`loginWithToken` waits out a 429 on the refresh. Anything but a positive whole
number keeps Meteor's default. `tests/cookieRefreshRateLimit.test.cjs`.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/576a8438aaba05760620692c92fc7aba7507c092">The activity notification intent test names each intent by its activity</a>. Thanks to xet7.</summary>

The mocha test failed about one run in four. The two activities' insert hooks
dispatch at the same time, and when the second one reached the subscriber
first, the test waited for the intent it makes fail on purpose. Intents are now
recorded against their activity, and the call counts allow for the recovery
scan that retries a pending intent every second. It passed 12 of 12 runs.

</details>

- [CHANGELOG prose is wrapped at 80 columns and no link shows a commit hash](https://github.com/wekan/wekan/commit/2632b0d8e1737884c4028ca08ada315831cc2b3a), [again for later lines](https://github.com/wekan/wekan/commit/bc3f99aa1ba24f9dc1166146e49cc5e3e4e1bae4). Thanks to xet7.

- [Browser specs wait for database writes to reach the page before using them](https://github.com/wekan/wekan/commit/cf5060c1936dbc1935c04c21cc98198d497f8711). Thanks to xet7.
- [card-first-position places and clicks the minicard again after a re-render](https://github.com/wekan/wekan/commit/409950f73080aba39ed9d49cac1312d30f58256b). Thanks to xet7.
- [rules-blocks expects no comment item in the Blocks menu, which is off by design](https://github.com/wekan/wekan/commit/259c4fc7e82d2b011ba015ffcdfaec7881415700). Thanks to xet7.
- [Firefox specs wait for stable layout, saved settings and the recovery scan](https://github.com/wekan/wekan/commit/994e01a994c8f2cebaf2ebb360cbb0bc8156f2a1). Thanks to xet7.
- [map-view reopens the Board View popup that a language switch closed](https://github.com/wekan/wekan/commit/09c67fd327f7c37b144e3ef490fee8c3afeed2ee). Thanks to xet7.
- [WebKit specs reopen the filter and read SAML state after the last navigation](https://github.com/wekan/wekan/commit/5de9f418a8ff97579b5c8a77474c4a7fcbd9a45f). Thanks to xet7.
- [releases/changelog-wrap.mjs wraps CHANGELOG prose at 80 columns, and the format test names it](https://github.com/wekan/wekan/commit/c09de3f1ab27acda11b4f412345cfac272fdbca1). Thanks to xet7.

and improves the following translations:

**Tigre, Tamazight and Veps** - words borrowed from the wrong language.

- [Tigre keeps its one date word in the date field and the date block](https://github.com/wekan/wekan/commit/969bb91fedeed915a014a893e5d0f518b610fbbe); whether it should change is left to a Tigre speaker. Thanks to xet7.
- [Veps kuva for the Blockly image field is recorded as an attested shared term](https://github.com/wekan/wekan/commit/90aabcce0f8dee49ca6ee64ea9a7785cd90e0f4a). Thanks to xet7.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/256a09d5553b314e84f1b896c37ab360e29aff59">Tigre uses its own words for card, name and file in 15 new strings</a>. Thanks to xet7.</summary>

New hints used the Tigrinya forms instead of the Tigre ones the rest of the
file uses: ወረቀት ካርድ for card, ስሜት for name, አስማይ for names and ፈይል for
file. Low confidence: the wording around them still needs a Tigre speaker.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/867154fd4ad67eee4a5050656711902b4125f809">Tamazight uses its checklist word in the rule trigger variables hint</a>. Thanks to xet7.</summary>

The hint named checklist fields with a noun the Tamazight checks reject; it now
uses the same word as `checklist` itself.

</details>

**Translations** — continued language coverage and corrections.


<details>
<summary><a href="https://github.com/wekan/wekan/commit/3dd40f61f2e6c42d1f14725100929c5cb379fa67">Translate 86 Northern Sotho mathematical messages.</a></summary>

- Preserve source tokens, formulas, numerical boundaries, operand order and
  degree/radian distinctions. Existing translations are retained.
- All 23 Northern Sotho checks pass. The combined run passes 59 checks but
  two catalog checks fail on the concurrent due-date shortcut key mismatch;
  the same mismatch affects one of 21 human-preference checks.
- Browser and screen-reader checks were not run. Statistical compounds and
  trigonometric wording remain low confidence pending fluent-speaker review.
- Remaining counted English placeholders: 44,218 across 70 languages. The
  broader language and wording audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/56a4dabd1cc446def7472ebce7223f71219aebce">Translate 46 Northern Sotho block-editing and accessibility messages.</a></summary>

- Preserve source tokens, deletion counts, editing action distinctions and
  screen-reader on/off announcements. Existing translations are retained.
- All 59 focused checks and 21 human-preference checks pass. Browser and
  screen-reader checks were not run. Accessibility and backpack terminology
  remains low confidence pending fluent-speaker review.
- Remaining counted English placeholders: 44,304 across 70 languages. The
  broader language and wording audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/57a52806644ed3142cacdc4954592bc133860d61">Translate 61 Northern Sotho Blockly input and bitmap labels.</a></summary>

- Fill 60 counted placeholders and the short on label omitted by the counter,
  preserving existing translations and source tokens.
- Verify pixel states, row/column arguments, coordinates, operand roles and
  shared endpoint labels.
- Validation: 56 focused checks and 21 human-preference checks pass. Two
  all-catalog structural checks still fail on the concurrent
  shortcut-edit-due-date addition. Browser and screen-reader checks were not
  run. Wording remains low confidence pending fluent-speaker review.
- Remaining counted English placeholders: 44,350 across 70 languages. The
  broader language and wording audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4965535f8d43061633019a20c4b9c6820b0abb29">Translate 59 Northern Sotho Blockly colour and navigation messages.</a></summary>

- Fill English placeholders while preserving existing translations and source
  tokens.
- Verify RGB channels and ranges, directions, movement versus scrolling and move
  confirmation/cancellation.
- Validation: 55 focused checks and 21 human-preference checks pass. Two
  all-catalog structural checks still fail on the concurrent
  shortcut-edit-due-date addition. Browser and screen-reader checks were not
  run. Wording remains low confidence pending fluent-speaker review.
- Remaining counted English placeholders: 44,410 across 70 languages. The
  broader language and wording audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/02ac6af8c0e6a1c526d4ba3133fa210c0a61bcdb">Translate 23 Northern Sotho Blockly workspace messages.</a></summary>

- Fill English placeholders while preserving existing translations and source
  tokens.
- Verify block counts, comment fragments, search navigation and distinct editing
  actions.
- Validation: 54 focused checks and 21 human-preference checks pass. Two
  all-catalog structural checks still fail on the concurrent
  shortcut-edit-due-date addition. Browser and screen-reader checks were not
  run. Wording remains low confidence pending fluent-speaker review.
- Remaining counted English placeholders: 44,469 across 70 languages. The
  broader language and wording audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7c27073ac10efdf97dc5371a2f41d7efa6cc119e">Translate 75 Northern Sotho Blockly list messages.</a></summary>

- Fill 73 counted placeholders and two short fragments omitted by the counter;
  preserve existing translations and tokens.
- Verify list retrieval/removal, insertion/replacement, copies, sorting and
  conversion direction.
- Validation: 53 focused checks and 21 human-preference checks pass. Two
  all-catalog structural checks fail on the concurrently added
  shortcut-edit-due-date key missing from other catalogs. Browser checks were
  not run. Wording remains low confidence pending fluent-speaker review.
- Remaining counted English placeholders: 44,492 across 70 languages. The
  broader language and wording audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/360697a4f081fd96c19ed8896f6eaa192ca0828c">Translate 22 Northern Sotho Blockly variable messages.</a></summary>

- Fill English placeholders while preserving existing translations and source
  tokens.
- Verify deletion counts, definition restrictions, rename scope, name conflicts
  and variable types.
- Validation: 53 translation and structural tests and 21 human-preference checks
  pass. Browser checks were not run. Technical wording remains low confidence
  pending fluent-speaker review.
- Remaining counted English placeholders: 44,565 across 70 languages. The
  broader language and wording audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2c6d2b48d561dc0181ced4c4d7a3d45c2b7a50e3">Translate 33 Northern Sotho Blockly control-flow messages.</a></summary>

- Fill 26 counted placeholders and seven short if/do labels omitted by the
  counter, preserving existing translations and source tokens.
- Verify loop exit versus continuation, boolean conditions, conditional fallback
  and shared labels.
- Validation: 52 translation and structural tests and 21 human-preference checks
  pass. Browser checks were not run. Technical wording remains low confidence
  pending fluent-speaker review.
- Remaining counted English placeholders: 44,587 across 70 languages. The
  broader language and wording audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bc4dca3309d2fa7812fc46ba348346c6346f4633">Translate 24 Northern Sotho Blockly function messages.</a></summary>

- Fill 22 counted placeholders and two short definition labels omitted by the
  counter, preserving existing translations and technical values.
- Verify source tokens, output distinctions, shared labels and
  disabled-definition and parameter warnings.
- Validation: 51 translation and structural tests and 21 human-preference checks
  pass. Browser checks were not run. Technical wording remains low confidence
  pending fluent-speaker review.
- Remaining counted English placeholders: 44,613 across 70 languages. The
  broader language and wording audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8bfa28a515df7ef9dd3d61ddac92d32a95c51270">Translate 26 Northern Sotho Blockly logic messages.</a></summary>

- Fill 25 counted placeholders and the short or label omitted by the counter,
  preserving existing translations and null.
- Verify source tokens, boolean conditions, comparison boundaries and ternary
  label references.
- Validation: 50 translation and structural tests and 21 human-preference checks
  pass. Browser checks were not run. Technical wording remains low confidence
  pending fluent-speaker review.
- Remaining counted English placeholders: 44,635 across 70 languages. The
  broader language and wording audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/591e23ac5ab2085cebbcee56c0a92082731053d9">Translate 55 Northern Sotho Blockly text-operation messages.</a></summary>

- Fill English placeholders while preserving existing translations, help URLs
  and source tokens.
- Verify indexing, missing and empty results, replacement roles, case
  conversion, trim direction and prompt types.
- Validation: 49 translation and structural tests and 21 human-preference checks
  pass. Browser checks were not run. Technical wording remains low confidence
  pending fluent-speaker review.
- Remaining counted English placeholders: 44,660 across 70 languages. The
  broader language and wording audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/679e49a509ae5ee04ef6488d0939a79bdbc9654b">Translate 84 Northern Sotho Scrum planning and report messages.</a></summary>

- Fill English placeholders while preserving existing translations and source
  tokens; checks cover all 102 Scrum and related view messages.
- Verify lifecycle states, unfinished-card handling, partial reports, unknown
  estimates and daily-observation limits.
- Validation: ten translation and structural tests and 21 human-preference
  checks pass. Browser checks were not run. Technical wording remains low
  confidence pending fluent-speaker review.
- Remaining counted English placeholders: 44,715 across 70 languages. The
  broader language and wording audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/34206768f61afa0fabd30c25a0d00f4fe88cb57a">Translate 20 Northern Sotho Sync report and estimate messages.</a></summary>

- Fill the remaining Sync English placeholders while preserving existing
  translations and technical literals.
- Verify retention limits, permissions, partial changes, recovery restrictions
  and missing versus explicit-null estimates.
- Validation: seven translation and structural tests and 21 human-preference
  checks pass. Browser checks were not run. Technical wording remains low
  confidence pending fluent-speaker review.
- Remaining counted English placeholders: 44,799 across 70 languages. The
  broader language and wording audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/045b0c9eca2d2bb6ed8ac8a93eb30b9a2e671e71">Translate 43 Northern Sotho Sync conflict and preview messages.</a></summary>

- Fill English placeholders while preserving existing translations and source
  tokens.
- Verify local-content retention, duplicate mapping removal, replacement reuse,
  review scope and source-report limits.
- Validation: five translation and structural tests and 21 human-preference
  checks pass. Browser checks were not run. Technical wording remains low
  confidence pending fluent-speaker review.
- Remaining counted English placeholders: 44,819 across 70 languages. The
  broader language and wording audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/60f69b7a807abf5047f95f179ece1af11613d83b">Translate 46 Northern Sotho rule-editing and recovery messages.</a></summary>

- Fill English placeholders while preserving existing translations and source
  tokens.
- Verify rule constraints, delivery uncertainty, retained pending work and
  cancellation without recreation or recall.
- Validation: two focused regression tests, the structural check across 234
  non-English catalogs and 21 human-preference checks pass. Browser checks were
  not run. Technical wording remains low confidence pending fluent-speaker
  review.
- Remaining counted English placeholders: 44,862 across 70 languages. The
  broader language and wording audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/07702ee6dffd0be061ffc6f0c0bba789321e27c0">Translate 86 Somali Blockly mathematics messages.</a></summary>

- Fill English placeholders while preserving existing translations, formula
  names, constants and source tokens.
- Verify inclusive/exclusive bounds, degrees versus radians, quotient/remainder,
  statistical operations and rounding direction.
- Validation: 66 translation and structural tests and 21 human-preference checks
  pass. Browser and screen-reader checks were not run. Mathematical wording
  remains low confidence pending fluent-speaker review.
- Remaining counted English placeholders: 44,908 across 70 languages. Somali has
  28 counted technical labels; the broader wording audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2f9edc078dbe4493ab71352989ff4aa25d2108dc">Translate 26 Somali Blockly controls and announcements.</a></summary>

- Fill English placeholders while preserving existing translations and source
  tokens.
- Verify open/close states, screen-reader toggles, parent announcements and
  shared conditional labels.
- Validation: 64 translation and structural tests and 21 human-preference checks
  pass. Browser and screen-reader checks were not run. Accessibility wording
  remains low confidence pending fluent-speaker review.
- Remaining counted English placeholders: 44,994 across 70 languages.
  Mathematical messages and technical labels remain in Somali; the broader
  language audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cb908f51d2af38d068d3717a902a6569faa01004">Translate 61 Somali Blockly input and bitmap labels.</a></summary>

- Fill 60 counted placeholders and the short on label omitted by the counter;
  preserve existing translations and source tokens.
- Verify operand roles, coordinates, row/column arguments, pixel states and
  shared endpoint labels.
- Validation: 63 translation and structural tests and 21 human-preference checks
  pass. Browser and screen-reader checks were not run. Technical wording remains
  low confidence pending fluent-speaker review.
- Remaining counted English placeholders: 45,020 across 70 languages. The
  broader language and wording audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8739ce5e17ea6119f7239a6bfd9f1ef00fcd6177">Translate 45 Somali Blockly keyboard-navigation messages.</a></summary>

- Fill English placeholders while preserving existing translations and shortcut
  arguments.
- Verify movement versus scrolling, directions, move acceptance,
  start/finish/abort distinctions and navigation targets.
- Validation: 61 translation and structural tests and 21 human-preference checks
  pass. Browser and screen-reader checks were not run. Accessibility wording
  remains low confidence pending fluent-speaker review.
- Remaining counted English placeholders: 45,080 across 70 languages. The
  broader language and wording audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/15426a5f11648cd4eab2d73c1978f0bb6c5d54eb">Translate 45 Somali Blockly variable and workspace messages.</a></summary>

- Fill English placeholders while preserving existing translations, variable
  names, counts and keyboard shortcuts.
- Verify duplicate-name warnings, getter/setter and undo/redo distinctions,
  screen-reader count fragments and search navigation.
- Validation: 60 translation and structural tests and 21 human-preference checks
  pass. Browser and screen-reader checks were not run. Technical wording remains
  low confidence pending fluent-speaker review.
- Remaining counted English placeholders: 45,125 across 70 languages. The
  broader language and wording audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/69c9be897babe069251ca65dc0c512f78cc71144">Translate 55 Somali Blockly text-operation messages.</a></summary>

- Fill English placeholders while preserving existing translations, source
  tokens, help URLs and empty suffixes.
- Verify indexing, missing and empty results, case conversion, replacement
  arguments, trim direction and prompt types.
- Validation: 58 translation and structural tests and 21 human-preference checks
  pass. Browser checks were not run. Technical wording remains low confidence
  pending fluent-speaker review.
- Remaining counted English placeholders: 45,170 across 70 languages. The
  broader language and wording audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/935704e5c167a1594823082784b21618eeb26c9b">Translate 50 Somali Blockly logic and function messages.</a></summary>

- Fill 47 counted placeholders and three short labels omitted by the counter.
  Preserve existing translations, null, help URLs and source-empty suffixes.
- Verify boolean conditions, comparison boundaries, ternary labels, function
  outputs and disabled-definition warnings.
- Validation: 56 translation and structural tests and 21 human-preference checks
  pass. Browser checks were not run. Technical wording remains low confidence
  pending fluent-speaker review.
- Remaining counted English placeholders: 45,225 across 70 languages. The
  broader language and wording audit continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/37525e3ceef97a9038d6d19563f7957f169e8131">Translate 75 Somali Blockly list messages.</a></summary>

- Fill 73 counted placeholders and translate two English fragments excluded by
  the counter. Preserve existing translations, source-empty suffixes, help URLs
  and index symbols.
- Verify indexing, missing and empty results, removal versus retrieval, copied
  lists, sorting and text/list conversion direction.
- Validation: 53 translation and structural tests and 21 human-preference checks
  pass. Browser checks were not run. Technical wording remains low confidence
  pending fluent-speaker review.
- Remaining counted English placeholders: 45,272 across 70 languages. The
  broader language audit continues, including prose omitted by the counter.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4415e8b4d471e8b6bc918b5cb38e0a0937bdbcb6">Translate 61 Somali Blockly editing and control-flow messages.</a></summary>

- Fill English placeholders for block editing, colours, loops and conditionals
  while preserving existing translations, keycaps and platform names.
- Verify argument inventories, deletion restrictions, loop continuation versus
  termination, boolean conditions and colour ranges.
- Validation: 51 translation and structural tests and 21 human-preference checks
  pass. Browser checks were not run. Programming terms remain low confidence
  pending fluent-speaker review.
- Remaining English placeholders: 45,345 across 70 languages. The remaining
  Blockly work and broader language audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d5744bafb8f61af139a34b1086610bc20067f4c6">Translate 46 Somali rule-editing and recovery messages.</a></summary>

- Fill English placeholders for block rule editing, SMTP failures and
  notification recovery while preserving existing translations.
- Add regressions for rule constraints, delivery uncertainty, retained pending
  work, no activity recreation and irreversible cancellation.
- Validation: 11 Somali and all-catalog structural tests and 21 human-preference
  checks pass. Browser checks were not run. Technical compounds remain low
  confidence pending fluent-speaker review.
- Remaining English placeholders: 45,406 across 70 languages. Somali's remaining
  placeholder queue is Blockly; the broader language and wording audit
  continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a370ad87e5ef53f59c0d3f1440644d47960579a9">Translate 63 Somali Sync conflict and report messages.</a></summary>

- Fill English placeholders for conflict resolution, previews, source omissions,
  run diagnostics and Jira estimate mappings without changing existing
  translations.
- Preserve local-content retention, review-only scope, report limits and the
  distinction between missing source values and explicit null.
- Validation: eight Somali and all-catalog structural tests and 21
  human-preference checks pass. Browser checks were not run. Technical compounds
  remain low confidence pending fluent-speaker review.
- Remaining English placeholders: 45,452 across 70 languages. Pending-key
  wording review and the broader language audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d6600d93451400bf59cc6ec6f7ebe2e12d97256c">Translate 84 Somali Scrum planning and reporting messages.</a></summary>

- Fill English placeholders for planning, sprint lifecycle and reports while
  preserving existing Somali translations.
- Cover all 102 Scrum and related view messages with token checks and
  regressions for cancellation versus closure, unknown estimates, partial
  reports and daily-observation limits.
- Validation: three Somali regression tests, the structural check across 234
  non-English catalogs and 21 human-preference checks pass. Browser checks were
  not run. Technical compounds remain low confidence pending fluent-speaker
  review.
- Remaining English placeholders: 45,515 across 70 languages. The separate
  pending-key wording review and broader language audit continue.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/89d9e0f13183d1528f2d171536ce544aaca9aac9">Correct 17 mixed-language Akan action and account labels.</a></summary>

- Clarify account creation, action selection, due dates and time spent; preserve
  the Meteor product name.
- Add placeholder and semantic regression checks. Wording remains low confidence
  pending fluent-speaker review.
- English placeholders remain 45,599 across 70 languages because these replace
  non-English values. The broader language audit continues.
- Validation: 109 focused translation/parser tests and 21 human-preference
  checks pass. Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0dfafdd3d63101360f3306e9290dbfdeea9cd111">Correct 14 mixed-language Akan migration and summary labels.</a></summary>

- Rewrite migration and summary text. Preserve error/warning and execution-state
  distinctions, including paused, resumed and not-needed states.
- Add source-token, state and terminology checks. Technical wording remains low
  confidence pending fluent-speaker review.
- English placeholders remain 45,599 across 70 languages because these replace
  non-English values. The broader language audit continues.
- Validation: 108 focused translation/parser tests and 21 human-preference
  checks pass. Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/51da67e8776d7b874e785525ba55be92265bdf3e">Correct 18 mixed-language Akan navigation and swimlane messages.</a></summary>

- Rewrite navigation, detail and swimlane text. Align matching titles and
  preserve home removal without board deletion.
- Add source-token, scope and label-consistency checks. Wording remains low
  confidence pending fluent-speaker review.
- English placeholders remain 45,599 across 70 languages because these replace
  non-English values. The broader language audit continues.
- Validation: 107 focused translation/parser tests and 21 human-preference
  checks pass. Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ada36f426b727d8caa285466505958b73638d534">Correct 18 mixed-language Akan template and swimlane labels.</a></summary>

- Rewrite template, subtask and swimlane text. Preserve template targets,
  insertion direction and resize permissions; align duplicate titles.
- Add source-token, target and direction regression checks. Wording remains low
  confidence pending fluent-speaker review.
- English placeholders remain 45,599 across 70 languages because these replace
  non-English values. The broader language audit continues.
- Validation: 106 focused translation/parser tests and 21 human-preference
  checks pass. Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ea7df95fc5dcd38a89c7a20b0556030b1fddcaad">Correct 10 mixed-language Akan prompts and display messages.</a></summary>

- Rewrite prompts, membership settings and font sample. Preserve scope
  restrictions and preview digits; the sample is not claimed to be an Akan
  pangram.
- Add source-token, scope and digit checks, with vocabulary references in the
  audit. Wording remains low confidence pending fluent-speaker review.
- English placeholders remain 45,599 across 70 languages because these replace
  non-English values. The broader language audit continues.
- Validation: 105 focused translation/parser tests and 21 human-preference
  checks pass. Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8f927b07bbee5b1f51dee0ce8afe621c7fd02dfd">Correct 12 mixed-language Akan voting and invitation messages.</a></summary>

- Rewrite voting, invitation and endpoint text. Preserve inviter tokens,
  leave/delete confirmations and provider endpoint alternatives from the source.
- Add source-token, subject and provider-name checks. Wording remains low
  confidence pending fluent-speaker review.
- English placeholders remain 45,599 across 70 languages because these replace
  non-English values. The broader language audit continues.
- Validation: 104 focused translation/parser tests and 21 human-preference
  checks pass. Browser and live provider-console checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fdd4a301dbbdce135196dba55baad5d1c336a601">Correct 18 malformed or mixed-language Akan rule and history messages.</a></summary>

- Rewrite rule fragments, permissions and history states. Preserve movement
  direction, restrictions on others' comments and pending/inactive states.
- Add source-token, direction and restriction checks. Wording remains low
  confidence pending fluent-speaker review.
- English placeholders remain 45,599 across 70 languages because these replace
  non-English values. The broader language audit continues.
- Validation: 103 focused translation/parser tests and 21 human-preference
  checks pass. Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bc356adf2168bb80fdc9c6d503bceadc03a3fc80">Correct 14 mixed-language Akan conversion and authorization messages.</a></summary>

- Rewrite conversion, import and permission text. Preserve import formats,
  distinct administrator/member requirements and domain-conflict wording.
- Add source-token, format and requirement checks. Wording remains low
  confidence pending fluent-speaker review.
- English placeholders remain 45,599 across 70 languages because these replace
  non-English values. The broader language audit continues.
- Validation: 102 focused translation/parser tests and 21 human-preference
  checks pass. Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/39620087ca2eeb00a39677edc1f0b3f96ce681a6">Correct 21 mixed-language Akan checklist and activity labels.</a></summary>

- Rewrite checklist, activity and avatar text. Preserve action direction,
  completion sound defaults, numeric shortcuts and size units.
- Add source-token, state and action regression checks. Wording remains low
  confidence pending fluent-speaker review.
- English placeholders remain 45,599 across 70 languages because these replace
  non-English values. The broader language audit continues.
- Validation: 101 focused translation/parser tests and 21 human-preference
  checks pass. Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/92684bde59902087caa91a1c3cf7c7ac859a86b5">Correct 25 mixed-language Akan activity and assignment labels.</a></summary>

- Rewrite activity, assignment, avatar and job text. Preserve activity tokens,
  add/remove direction and assigned-only scope.
- Add source-token, direction and scope regression checks. Wording remains low
  confidence pending fluent-speaker review.
- English placeholders remain 45,599 across 70 languages because these replace
  non-English values. The broader language audit continues.
- Validation: 100 focused translation/parser tests and 21 human-preference
  checks pass. Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2d7f4743da66abae03fad57504489147e4e0186b">Correct 26 mixed-language Akan result and scheduling messages.</a></summary>

- Rewrite search results, missing-data guidance and scheduling text. Preserve
  count tokens, missing-only restoration and distinct scheduling states.
- Add source-token, count and state regression checks. Wording remains low
  confidence pending fluent-speaker review.
- English placeholders remain 45,599 across 70 languages because these replace
  non-English values. The broader language audit continues.
- Validation: 99 focused translation/parser tests and 21 human-preference checks
  pass. Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e2c0cb513d9b3d7574ba1933964d17d854a285af">Correct 25 mixed-language Akan view and customization labels.</a></summary>

- Rewrite view, attachment and customization text. Align matching titles and
  preserve visibility scope and technical filenames.
- Add source-token, label-consistency and scope checks. Wording remains low
  confidence pending fluent-speaker review.
- English placeholders remain 45,599 across 70 languages because these replace
  non-English values. The broader language audit continues.
- Validation: 98 focused translation/parser tests and 21 human-preference checks
  pass. Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/035fba3d421436feeb9fdf6912cb29a6eaf1e1b7">Correct 23 mixed-language Akan display, attachment and role labels.</a></summary>

- Rewrite display and attachment text. Preserve units, HTML links and
  assigned-only visibility; align the Normal role label with its description.
- Add source-token, markup and action regression checks. Wording remains low
  confidence pending fluent-speaker review.
- English placeholders remain 45,599 across 70 languages because these replace
  non-English values. The broader language audit continues.
- Validation: 97 focused translation/parser tests and 21 human-preference checks
  pass. Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/03b327fcf9f94bdee4a6fe3bc69487ef5e8c9c5d">Correct 15 mixed-language or misleading Akan account and connection messages.</a></summary>

- Rewrite account, watch and connection text. Correct OAuth setting precedence
  while preserving secret visibility and account states.
- Add source-token, precedence and account-state regression checks. Wording
  remains low confidence pending fluent-speaker review.
- English placeholders remain 45,599 across 70 languages because these replace
  non-English values. The broader language audit continues.
- Validation: 96 focused translation/parser tests and 21 human-preference checks
  pass. Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/937086b9fb5a5e905965b9e25e60b52c8f1b75ea">Correct 25 mixed-language Akan movement and ordering labels.</a></summary>

- Rewrite movement, ordering and guidance text. Preserve directions, list scope,
  oldest-first ordering and recurring time tokens.
- Add source-token, direction and scope regression checks. Wording remains low
  confidence pending fluent-speaker review.
- English placeholders remain 45,599 across 70 languages because these replace
  non-English values. The broader language audit continues.
- Validation: 95 focused translation/parser tests and 21 human-preference checks
  pass. Browser and live provider-console checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c5c1d2bca978060b496f538a75ca8fbf3a1f0be3">Correct 23 mixed-language or misleading Akan status and count messages.</a></summary>

- Rewrite status, count and permission labels. Preserve stopped/completed
  distinctions, assigned-only reading, timing units and batch limits.
- Add source-token, unit and scope regression checks. Wording remains low
  confidence pending fluent-speaker review.
- English placeholders remain 45,599 across 70 languages because these replace
  non-English values. The broader language audit continues.
- Validation: 94 focused translation/parser tests and 21 human-preference checks
  pass. Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/61674384bf10df67ecfd5f6a83b551779f6d4193">Correct 24 mixed-language Akan timing and completion messages.</a></summary>

- Rewrite timing, checklist and status text. Preserve date distinctions, old/new
  activity values and import-timeout retry guidance.
- Add source-token, value-direction and state regression checks. Wording remains
  low confidence pending fluent-speaker review.
- English placeholders remain 45,599 across 70 languages because these replace
  non-English values. The broader language audit continues.
- Validation: 93 focused translation/parser tests and 21 human-preference checks
  pass. Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0afec6037cce53a78e1c1e08125ba51d41e21858">Correct 18 mixed-language or misleading Akan grouping and field-summary messages.</a></summary>

- Restore number-field summation, opposite grouping states/actions and the
  synchronization interval's minutes unit; rewrite related rule and board
  labels.
- Add source-token, aggregate and state regression checks. Wording remains low
  confidence pending fluent-speaker review.
- English placeholders remain 45,599 across 70 languages because these replace
  non-English values. The broader language audit continues.
- Validation: 92 focused translation/parser tests and 21 human-preference checks
  pass. Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0991c3971ef0a603c67fd3a90067900f8ed698ef">Correct 20 mixed-language or misleading Akan field and rule messages.</a></summary>

- Rewrite field, rule and timeline messages. Preserve full restore scope, the
  no-deletion statement and board-admin-only visibility.
- Add source-token, scope and state regression checks. Wording remains low
  confidence pending fluent-speaker review.
- English placeholders remain 45,599 across 70 languages because these replace
  non-English values. The broader language audit continues.
- Validation: 91 focused translation/parser tests and 21 human-preference checks
  pass. Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/af1499151c3851cda26076ad62335b54cc4b6007">Correct 22 mixed-language or misleading Akan drag and account messages.</a></summary>

- Rewrite drag, account and configuration guidance. Preserve optional inputs,
  sidebar targets, workspace tokens and provider menu names.
- Add source-token, name and behavior regression checks. Technical wording
  remains low confidence pending fluent-speaker review.
- English placeholders remain 45,599 across 70 languages because these replace
  non-English values. The broader language audit continues.
- Validation: 90 focused translation/parser tests and 21 human-preference checks
  pass. Browser and live provider-console checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/80d66285020bd5aa9e36c5fc25f8b9676328ecae">Correct 24 damaged or mixed-language Akan repair and monitoring labels.</a></summary>

- Rewrite repair, monitoring and repository text. Preserve repair scope,
  possible conversion delay and technical identifiers.
- Add source-token, scope and terminology regression checks. Technical wording
  remains low confidence pending fluent-speaker review.
- English placeholders remain 45,599 across 70 languages because these replace
  non-English values. The broader language audit continues.
- Validation: 89 focused translation/parser tests and 21 human-preference checks
  pass. Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/df69b20ffc5b3d85ed6d93a0cfb2fd7a888a6b5c">Correct 25 damaged or mixed-language Akan cloud-storage messages.</a></summary>

- Restore provider names, navigation labels and permission roles from the
  English source; translate surrounding guidance and storage controls.
- Add source-token, name and scope regression checks. Technical terminology
  remains low confidence pending fluent-speaker review.
- English placeholders remain 45,599 across 70 languages; restored product-only
  labels are excluded by the counter. The broader language audit continues.
- Validation: 88 focused translation/parser tests and 21 human-preference checks
  pass. Browser and live provider-console checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/be0032f2ed093cf2c4181757ef01a03402988fec">Correct 24 damaged or mixed-language Akan support and lockout labels.</a></summary>

- Rewrite support, memory, storage and lockout labels. Preserve technical
  identifiers, credential distinctions and enabled/disabled states.
- Add source-token, identifier and state regression checks. Technical
  terminology remains low confidence pending fluent-speaker review.
- English placeholders remain 45,599 across 70 languages because these replace
  non-English values. The broader language audit continues.
- Validation: 87 focused translation/parser tests and 21 human-preference checks
  pass. Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d6d82b0023eb41a07dbac447a4da01fa89bc1d8f">Correct 24 damaged or mixed-language Akan sorting and report labels.</a></summary>

- Rewrite sorting, report and field labels. Restore literal search syntax and
  preserve format placeholders and HTML space entities.
- Add source-token, syntax, entity and report-distinction checks. Wording
  remains low confidence pending fluent-speaker review.
- English placeholders remain 45,599 across 70 languages because these replace
  non-English values. The broader language audit continues.
- Validation: 86 focused translation/parser tests and 21 human-preference checks
  pass. Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9ec083daa1630c0705c476a3c6808f3081da0ed5">Correct 24 damaged or misleading Akan workflow and sorting labels.</a></summary>

- Rewrite workflow, archive and sorting labels. Correct the rule toggle and
  preserve archive direction, placeholders and literal markup.
- Add source-token, direction and markup regression checks. Wording remains low
  confidence pending fluent-speaker review.
- English placeholders remain 45,599 across 70 languages because these replace
  non-English values. The broader language audit continues.
- Validation: 85 focused translation/parser tests and 21 human-preference checks
  pass. Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d209fb83af834b0ba7abf98fb5baf21970960686">Correct 24 damaged or mixed-language Akan upload and diagnostics labels.</a></summary>

- Rewrite upload, SMTP, diagnostic and color labels. Restore Node and preserve
  protocol/configuration identifiers and action meanings.
- Add source-token, identifier and action regression checks. Technical
  terminology remains low confidence pending fluent-speaker review.
- English placeholders remain 45,599 across 70 languages; the restored Node
  product name is excluded by the counter. The broader language audit continues.
- Validation: 84 focused translation/parser tests and 21 human-preference checks
  pass. Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6d2be5215acd890299a01bb28092a690e8858864">Correct 28 damaged or mixed-language Akan import and invitation messages.</a></summary>

- Restore OpenProject import names and endpoint; rewrite invitation, archive,
  shortcut and card-control text. Preserve tokens and action meanings.
- Add source-token, endpoint and behavior regression checks. Wording remains low
  confidence pending fluent-speaker review.
- English placeholders remain 45,599 across 70 languages because these replace
  non-English values. The broader language audit continues.
- Validation: 83 focused translation/parser tests and 21 human-preference checks
  pass. Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ed00230a897e77e04e4343a6ebb25399ee2c78ac">Correct 25 damaged or mixed-language Akan archive and color labels.</a></summary>

- Align archive and color terminology and rewrite card-control text. Preserve
  archive targets, confirmations and activity placeholders.
- Add source-token, target and terminology regression checks. Wording remains
  low confidence pending fluent-speaker review.
- English placeholders remain 45,599 across 70 languages because these replace
  non-English values. The broader language audit continues.
- Validation: 82 focused translation/parser tests and 21 human-preference checks
  pass. Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/efb8ce783757d658c7e84234244917ec9c80dd36">Correct 21 mixed-language Akan setting and action labels.</a></summary>

- Rewrite selection, color, rule, memory and repair labels. Preserve WIP
  alternatives, current/relative dates, activity placeholders and empty-field
  matching.
- Add source-token and behavior-wording checks. Technical terminology remains
  low confidence pending fluent-speaker review.
- English placeholders remain 45,599 across 70 languages because these replace
  mixed-language values. The broader language audit continues.
- Validation: 81 focused translation/parser tests and 21 human-preference checks
  pass. Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b3ea485bcfcf19a6f153614a17d4b286d6ed8724">Correct 23 mixed-language or misleading Akan board and account messages.</a></summary>

- Rewrite board controls, account emails and file-repair text. Correct
  invitation status; preserve placeholders and opposite star/unstar actions.
- Add source-token, email and action regression checks. Technical terminology
  remains low confidence pending fluent-speaker review.
- English placeholders remain 45,599 across 70 languages because these replace
  non-English values. The broader language audit continues.
- Validation: 80 focused translation/parser tests and 21 human-preference checks
  pass. Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/13631ec0ceebb203a5bf8dc31210ba57ecc4f36f">Correct 20 mixed-language Akan storage and administration messages.</a></summary>

- Rewrite storage guidance and administration controls. Restore repair
  identifiers; preserve provider names, configuration alternatives and all-item
  scope.
- Add source-token, identifier and scope regression checks. Technical
  terminology remains low confidence pending fluent-speaker review.
- English placeholders remain 45,599 across 70 languages because these replace
  mixed-language values. The broader language audit continues.
- Validation: 79 focused translation/parser tests and 21 human-preference checks
  pass. Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/052f48895e87ce2d18d02544e09c06351b6ff374">Correct 24 mixed-language Akan file and memory labels.</a></summary>

- Rewrite file, attachment-migration and memory labels. Restore Node and
  Meteor-Files names; preserve migration destinations, board scope and checklist
  order.
- Add source-token, product-name and scope/metric regression checks. Memory
  terminology remains low confidence pending fluent-speaker review.
- English placeholders remain 45,599 across 70 languages; restored product names
  are excluded by the counter. The broader language audit continues.
- Validation: 78 focused translation/parser tests and 21 human-preference checks
  pass. Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/69a2b5fe309c61e686ec0e14a4007f1b7d5450fe">Correct 23 mixed-language Akan rule and search messages.</a></summary>

- Rewrite rule, administration and search text. Preserve query
  operators/examples, opposite check/uncheck actions and archived/unarchived
  scope.
- Add source-token, query-syntax and action regression checks. Technical
  terminology remains low confidence pending fluent-speaker review.
- English placeholders remain 45,599 across 70 languages because these replace
  mixed-language values. The broader language audit continues.
- Validation: 77 focused translation/parser tests and 21 human-preference checks
  pass. Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0dec93d704ec61ef15e125ea91e0f9a4c4c5badd">Correct 28 mixed-language Akan card and import controls.</a></summary>

- Rewrite card, selection, text and import messages. Preserve sample JSON keys
  and selection scope; align navigation instructions with menu labels.
- Add source-token, parsed-JSON and navigation/control checks. Technical
  terminology remains low confidence pending fluent-speaker review.
- English placeholders remain 45,599 across 70 languages because these replace
  mixed-language values. The broader language audit continues.
- Validation: 76 focused translation/parser tests and 21 human-preference checks
  pass. Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/303f5a5c49a772acd2051fa43d71ae1758eb2dfa">Correct 29 mixed-language Akan controls and storage messages.</a></summary>

- Rewrite card actions, upload/storage controls and credential guidance. Restore
  Azure and Google Cloud menu labels; preserve units and blank-to-retain
  behavior.
- Add source-token and control/navigation regression checks. Technical
  terminology remains low confidence pending fluent-speaker review.
- English placeholders remain 45,599 across 70 languages because these replace
  mixed-language values. The broader language audit continues.
- Validation: 75 focused translation/parser tests and 21 human-preference checks
  pass. Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/102c8ad390cce1439d193b503db7e2d0c3f8f08c">Correct 30 mixed-language Akan migration and deletion messages.</a></summary>

- Rewrite storage/migration outcomes, deletion confirmations, account enrollment
  and card membership/date text. Preserve email tokens, millisecond limits and
  permanent deletion semantics.
- Add source-token and confirmation/outcome regression checks. Technical
  terminology remains low confidence pending fluent-speaker review.
- English placeholders remain 45,599 across 70 languages because these replace
  mixed-language values. The broader language audit continues.
- Validation: 74 focused translation/parser tests and 21 human-preference checks
  pass. Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/42da9d05ba08ca911ed7a976ef5aaab776d39d54">Correct 22 mixed-language Akan input and scheduled-job messages.</a></summary>

- Rewrite default-board, search, upload, storage, lockout and scheduled-job
  messages. Preserve positive limits, domain syntax and distinct failed
  operations.
- Add source-token and input/operation regression checks. Technical terminology
  remains provisional pending fluent-speaker review.
- English placeholders remain 45,599 across 70 languages because these replace
  mixed-language values. The broader language audit continues.
- Validation: 73 focused translation/parser tests and 21 human-preference checks
  pass. Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/771cf10c53869b48fb58fe5f66eef382b6e29d33">Correct 22 mixed-language Akan display and selection messages.</a></summary>

- Rewrite board-selection, home-board, width/keyboard toggle, fading and
  input-error messages. Preserve current states and opposite click actions.
- Add source-token, state/action, selection, tier and numeric-example checks.
  Display terminology remains provisional.
- English placeholders remain 45,599 across 70 languages because these
  corrections replace mixed-language values. The broader language audit
  continues.
- Validation: 72 focused translation/parser tests and 21 human-preference checks
  pass. Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/339a425511eceecd553afdaf1ad8fa0bbce99b7d">Correct 40 Akan activity and report values containing embedded filler.</a></summary>

- A substring audit found generic filler embedded in 40 further values. Rewrite
  activity, email-template, rule-date, flow-report and time-adjustment messages;
  the phrase now occurs nowhere in Akan.
- Add source-token, simulation-limit, percentile, overlap and date-fallback
  checks. Statistical and forecasting wording remains low confidence.
- English placeholders remain 45,599 across 70 languages because these
  corrections replace non-English values. The broader language audit continues.
- Validation: 71 focused translation/parser tests and 21 human-preference checks
  pass. Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fdee0c6fb3ad4a91091f2bd612ae4fbf0ba018d0">Correct 20 mixed-language Akan account and repair-result messages.</a></summary>

- Rewrite account errors, partial repair results, import controls and
  flow-history labels. Preserve count placeholders, file extensions and
  card-number query syntax.
- Add source-token, partial-outcome, scope and exact-example checks.
  Flow-history and repair wording remains provisional.
- English placeholders remain 45,599 across 70 languages because these
  corrections replace mixed-language values. The broader language audit
  continues.
- Validation: 70 focused translation/parser tests and 21 human-preference checks
  pass. Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/72333e3bd233207371a51ecf628a855997a389c4">Correct 16 mixed-language Akan backup and migration messages.</a></summary>

- Rewrite transfer/anonymization labels and backup/migration descriptions.
  Preserve organization ownership, excluded data and duplicate-list deletion
  conditions.
- Add source-token, scope, identifier and background-continuation checks.
  Specialized backup and migration wording remains provisional.
- English placeholders remain 45,599 across 70 languages because these
  corrections replace mixed-language values. The broader language audit
  continues.
- Validation: 69 focused translation/parser tests and 21 human-preference checks
  pass. Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/53b178bb16236aa0e1e74dba03ff1de07112ac9e">Correct 14 mixed-language Akan account and card-loading messages.</a></summary>

- Rewrite lockout states, account controls, storage paths, cron notices and
  card-loading guidance. Preserve configuration literals and experimental view
  limitations.
- Add source-token, opposite-action, scope and configuration checks. Specialized
  account/loading wording remains provisional.
- English placeholders remain 45,599 across 70 languages because these
  corrections replace mixed-language values. The broader language audit
  continues.
- Validation: 68 focused translation/parser tests and 21 human-preference checks
  pass. Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b79ac288c2b3898b4951cd2fe8cc0ad80d5b0e7c">Correct 14 mixed-language Akan storage and support messages.</a></summary>

- Rewrite attachment repair, storage defaults, compaction, PDF support and
  account protection descriptions. Preserve the English source's ordering,
  exceptions and access restrictions.
- Add source-token, operational-scope and identifier checks. Specialized storage
  wording remains provisional.
- English placeholders remain 45,599 across 70 languages because these
  corrections replace mixed-language values. The broader language audit
  continues.
- Validation: 67 focused translation/parser tests and 21 human-preference checks
  pass. Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c174c06c9263db5087029853cea831c4a189e565">Correct 18 mixed-language Akan diagnostic and report messages.</a></summary>

- Rewrite diagnostic, reporting, creator and membership messages. Preserve log
  commands, API settings, report scope and nonempty-group deletion guards.
- Add source-token, command, newline, identifier and restriction checks.
  Specialized API and recovery wording remains provisional.
- English placeholders remain 45,599 across 70 languages because these
  corrections replace mixed-language values. The broader language audit
  continues.
- Validation: 66 focused translation/parser tests and 21 human-preference checks
  pass. Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8b9845e4dbf85355969406ca2705772108644a41">Correct 16 mixed-language Akan search-help messages.</a></summary>

- Rewrite operator, membership, date, existence, sorting and limit descriptions.
  Preserve source placeholders, inline-code examples and angle-bracket
  parameters.
- Add exact-syntax and filtering-semantics checks. Search wording remains
  provisional.
- English placeholders remain 45,599 across 70 languages because these
  corrections replace mixed-language values. The broader language audit
  continues.
- Validation: 65 focused translation/parser tests and 21 human-preference checks
  pass. Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a97cdfd445f9fd6419ba2212968505ae479c3029">Correct 30 mixed-language Akan rule and reminder messages.</a></summary>

- Rewrite rule imports, due reminders, deletion confirmations and
  search/template scope. Preserve technical names, placeholders and count-prefix
  spacing.
- Add source-token, opposite-state, formatting and permission checks. Rule
  fragments and template terminology remains provisional.
- English placeholders remain 45,599 across 70 languages because these
  corrections replace mixed-language values. The broader language audit
  continues.
- Validation: 64 focused translation/parser tests and 21 human-preference checks
  pass. Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8f254da4ecf94dc51aeff962e93ae4748c130705">Correct 24 mixed-language Akan invitation and membership messages.</a></summary>

- Rewrite Trello controls, membership guidance, invitation email and limits.
  Preserve administrator scope and separate WeKan/Sandstorm access behavior.
- Add source-token, email-formatting, permission, retention and API-cap checks.
  Specialized membership and storage wording remains provisional.
- English placeholders remain 45,599 across 70 languages because these
  corrections replace mixed-language values. The broader language audit
  continues.
- Validation: 63 focused translation/parser tests and 21 human-preference checks
  pass. Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/367a9b204165cd7c20af5f568b3ff5ef7e748270">Correct 24 mixed-language Akan filter and import messages.</a></summary>

- Rewrite filter, export and import guidance. Restore JSON field names, API
  paths, spreadsheet headers, Trello product names and advanced-filter examples.
- Add source-token, exact-example, escape and ZIP-error checks. Technical filter
  and import wording remains provisional.
- English placeholders remain 45,599 across 70 languages because these
  corrections replace mixed-language values. The broader language audit
  continues.
- Validation: 62 focused translation/parser tests and 21 human-preference checks
  pass. Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5cc289611b9bdfbf8b842d53efb8677637fbb7d1">Correct 24 mixed-language Akan permission and error messages.</a></summary>

- Rewrite access descriptions, account errors and export labels. Preserve
  assigned-only visibility, read-only restrictions and the distinction between
  enabling deletion and deleting data.
- Add source-token, restriction, disabled/missing-account and format-identifier
  checks. Role and soft-deletion wording remains provisional.
- English placeholders remain 45,599 across 70 languages because these
  corrections replace mixed-language values. The broader language audit
  continues.
- Validation: 61 focused translation/parser tests and 21 human-preference checks
  pass. Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1bacb18aaa60a467fcce3aa05811ebc6dbe5a1ca">Correct 24 mixed-language Akan import and archive messages.</a></summary>

- Rewrite activity logs, width notes, archive guidance and member mapping.
  Correct an anonymization title that referred to importing users.
- Add source-token, target, restoration, size-limit and permission checks.
  Mapping and administrative wording remains provisional.
- English placeholders remain 45,599 across 70 languages because these
  corrections replace mixed-language values. The broader language audit
  continues.
- Validation: 60 focused translation/parser tests and 21 human-preference checks
  pass. Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e47100c4b214416e744db89d9f027661c8420419">Correct 12 mixed-language Akan migration and diagnostic messages.</a></summary>

- Rewrite migration confirmations, CPU limits, background-execution notices,
  username length and S3 key guidance. Preserve scope restrictions, identifiers
  and quoted errors.
- Add source-token, scope, numeric-limit and literal-example checks. Migration
  wording remains provisional.
- English placeholders remain 45,599 across 70 languages because these
  corrections replace mixed-language values. The broader language audit
  continues.
- Validation: 59 focused translation/parser tests and 21 human-preference checks
  pass. Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ab532cc15119fe6236e0f563df12c407512e5c9f">Correct 12 mixed-language Akan display and data-control descriptions.</a></summary>

- Rewrite display, import/export, avatar, anonymization and notification
  settings. Restore product names and preserve literal markup and anonymization
  examples.
- Add source-token, default, feature-scope and example checks. Privacy and
  rich-text wording remains provisional.
- English placeholders remain 45,599 across 70 languages because these
  corrections replace mixed-language values. The broader language audit
  continues.
- Validation: 58 focused translation/parser tests and 21 human-preference checks
  pass. Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d05730226a68fbbd392787649e1dedeb1f05c931">Correct 15 mixed-language Akan search and migration descriptions.</a></summary>

- Rewrite keyboard, permissions, search and database-migration guidance. Restore
  damaged Sandstorm names and filesystem paths while preserving commands and
  URLs.
- Add source-token, inline-code, shortcut, configuration and deletion checks.
  Specialized migration and administration wording remains provisional.
- English placeholders remain 45,599 across 70 languages because these
  corrections replace mixed-language values. The broader language audit
  continues.
- Validation: 57 focused translation/parser tests and 21 human-preference checks
  pass. Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/291c84d5b104be12fbb490ab9984403f4e0cf070">Correct 24 mixed-language Akan configuration and rule messages.</a></summary>

- Rewrite avatar/auth settings, domain help, deletion confirmations, rule
  triggers and a due-date activity. Restore a damaged example hostname while
  preserving configuration identifiers.
- Add source-token, literal-identifier, deletion-condition and newline checks.
  Rule fragments and authentication/tenant wording remain provisional.
- English placeholders remain 45,599 across 70 languages because these
  corrections replace mixed-language values. The broader language audit
  continues.
- Validation: 56 focused translation/parser tests and 21 human-preference checks
  pass. Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/857961d5d1e81302e42877c9f6f30e96cb64d6d9">Correct 32 mixed-language Akan board warnings and notifications.</a></summary>

- Rewrite deletion, archiving, privacy, import and notification messages
  containing English clauses and malformed substitutions. Match current
  board-restore guidance.
- Add source-token, HTML, deletion-consequence, permission and notification
  checks. Administrative wording and menu references remain provisional.
- English placeholders remain 45,599 across 70 languages because these
  corrections replace mixed-language values. The broader language audit
  continues.
- Validation: 55 focused translation/parser tests and 21 human-preference checks
  pass. Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f1a2ccfcc0d91b4c601b675b03317d7079965b55">Correct the remaining 99 exact generic-filler values in Akan.</a></summary>

- Replace generic filler in migration controls, schedules, login, diagnostics
  and flow labels. Preserve interval numbers, units and technical identifiers.
- Add a catalog-wide check against the repeated filler phrase, plus placeholder,
  interval and state checks. Specialized wording remains provisional; other
  mixed-language and semantic issues still need review.
- The exact generic-filler inventory decreases from 99 to zero. English
  placeholders remain 45,599 across 70 languages because these corrections
  replace non-English values.
- Validation: 54 focused translation/parser tests and 21 human-preference checks
  pass. Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7bb67bc8a9aa736cdd8c5ecc23d22b408d0216ef">Correct 60 Akan cloud-storage, backup and migration translations.</a></summary>

- Replace generic filler in cloud credentials, backups, migrations and
  connection tests. Preserve product names, region examples and replacement
  scope.
- Add token, identifier, lifecycle and shared-label checks. Specialized storage
  and migration wording remains provisional.
- The exact generic-filler inventory decreases from 159 to 99. English
  placeholders remain 45,599 across 70 languages because these corrections
  replace non-English values.
- Validation: 53 focused translation/parser tests and 21 human-preference checks
  pass. Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d254baf5a1d07cc9b586ba000b73e659b26fedb7">Correct 60 Akan attachment, storage and account-control translations.</a></summary>

- Replace generic filler in tickets, attachment moves, storage diagnostics,
  accessibility and account lockouts. Restore storage provider names and
  preserve identifiers and second units.
- Add token, identifier, unit, paired-control and shared-label checks.
  Specialized compaction, migration and accessibility wording remains
  provisional.
- The exact generic-filler inventory decreases from 219 to 159. English
  placeholders remain 45,599 across 70 languages because these corrections
  replace non-English values.
- Validation: 52 focused translation/parser tests and 21 human-preference checks
  pass. Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/088a3f1ef7f84bb16c704d85ce9ffa6d4de44b8a">Correct 60 Akan dependency, location and report labels.</a></summary>

- Replace generic filler in navigation, completion, dependency relations,
  locations, reports and wait indicators. Restore Arial and API identifiers.
- Add token, inverse-relation, first/last, identifier and shared-label checks.
  Geographic, dependency and animation wording remains provisional.
- The exact generic-filler inventory decreases from 279 to 219. English
  placeholders remain 45,599 across 70 languages because these corrections
  replace non-English values.
- Validation: 51 focused translation/parser tests and 21 human-preference checks
  pass. Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/91f7a5eba0e68e9e88cfb985a0f1793c1539bc53">Correct 49 Akan search operators, predicates and errors.</a></summary>

- Replace 34 generic fillers and 15 mixed-language or unusable search values.
  Restore short aliases and make translated title/attachment operators usable by
  the parser.
- Add actual parser checks for quoted values, existence filters, invalid limits,
  dates and sort direction, plus placeholder coverage. Compound search
  terminology remains low confidence.
- The exact generic-filler inventory decreases from 313 to 279. English
  placeholders remain 45,599 across 70 languages because these corrections
  replace non-English values.
- Validation: 50 focused translation/parser tests and 21 human-preference checks
  pass. Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d53166480fb1438e51c74d89240d207e00bac579">Correct 43 Akan calendar and settings translations.</a></summary>

- Replace generic filler in date fields, weekdays, roles, read states and custom
  head settings. Restore protocol names and the context separator.
- Add token, weekday, shared-label, state and technical-identifier checks. Role,
  domain and manifest wording remains provisional.
- The exact generic-filler inventory decreases from 356 to 313. English
  placeholders remain 45,599 across 70 languages because these corrections
  replace non-English values.
- Validation: 48 focused translation tests and 21 human-preference checks pass.
  Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c2d88822cb61d65d27cdfe3495d1f3c4d3b86dd6">Correct 60 Akan rule-schedule and action translations.</a></summary>

- Replace generic filler in schedules, due-date conditions, checklist actions
  and email fields. Preserve time units, Monday–Friday scope and opposite
  controls.
- Add source-token, cadence, shared-label and paired-action checks. Short rule
  fragments remain provisional pending contextual UI review.
- The exact generic-filler inventory decreases from 416 to 356. English
  placeholders remain 45,599 across 70 languages because these corrections
  replace non-English values.
- Validation: 47 focused translation tests and 21 human-preference checks pass.
  Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/183ba557914a7d43cb22f7c7bd0f50cf1224bceb">Correct 60 Akan administration and diagnostic translations.</a></summary>

- Replace generic filler in registration, file limits, webhooks, diagnostics and
  dates. Restore file-size units and preserve service and reactivity
  identifiers.
- Add token, mode, technical-name, date and shared-label checks. System, package
  and version terminology remains provisional and needs contextual review.
- The exact generic-filler inventory decreases from 476 to 416. English
  placeholders remain 45,599 across 70 languages because these corrections
  replace non-English values.
- Validation: 46 focused translation tests and 21 human-preference checks pass.
  Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d4ab5c8ad12f2f4efabcb40f4aab1841042489f1">Correct 60 Akan color, field and account-control translations.</a></summary>

- Replace unrelated generic filler in colors, custom fields, login,
  subscriptions and time tracking. Restore the intentionally empty comment
  placeholder and literal list abbreviations.
- Check source tokens, empty/literal values, count and hour units and distinct
  controls. Uncommon color shades, version and WIP terminology remains
  provisional.
- The exact generic-filler inventory decreases from 536 to 476. English
  placeholders remain 45,599 across 70 languages because these corrections
  replace non-English values.
- Validation: 45 focused translation tests and 21 human-preference checks pass.
  Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/51ba1fa1039f1aeebb61a4067d8936c780657ffb">Correct 60 Akan board, voting and display translations.</a></summary>

- Replace unrelated generic filler with board, voting, typography and display
  labels. Restore numeric poker values and the question-mark choice exactly.
- Add old-filler rejection, placeholder, vote-value, zoom-range and
  opposite-control checks. Specialized wording remains provisional and needs
  contextual review.
- The audit found 596 occurrences of the same filler; 536 remain. The
  English-placeholder count stays at 45,599 across 70 languages because these
  corrections replace non-English values.
- Validation: 44 focused translation tests and 21 human-preference checks pass.
  Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/abdb3a92d7b19fc845900131836c9fc3fd2f7240">Translate 27 Akan notification-recovery messages.</a></summary>

- Fill pending delivery, retries, pause/resume/cancel controls and rule-email
  recovery. Preserve retained work, no activity recreation and permanent
  cancellation behavior.
- Add source-token, distinct-state and recovery checks. Recovery terminology
  remains provisional and needs contextual review.
- English placeholders decrease from 45,626 to 45,599 across 70 languages, with
  148 source keys tracked separately for wording review. Akan retains 29
  keyboard, operating-system and mathematical labels in the exact-English
  report; its existing translations still need quality review.
- Validation: 43 focused translation tests and 21 human-preference checks pass.
  Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/40f6eefbc44f5784bbd030c072a54ceb0ddf8823">Translate 29 Akan synchronization-report and email-failure messages.</a></summary>

- Fill report history, diagnostics, Jira estimates and delivery failures.
  Preserve retention limits, distinct outcomes, hour units and
  missing-versus-null behavior.
- Add token, limit, outcome and estimate checks. Diagnostics and authentication
  terminology remains provisional and needs contextual review.
- English placeholders decrease from 45,655 to 45,626 across 70 languages, with
  148 source keys tracked separately for wording review.
- Validation: 42 focused translation tests and 21 human-preference checks pass.
  Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b47d76131183df8da9a9a2cd2c981bb6c94a948a">Translate 43 Akan synchronization conflict and preview messages.</a></summary>

- Fill conflict choices, duplicate mapping removal, archive restrictions,
  replacement creation and preview omissions. Preserve local content, unchanged
  subcards, retries and display limits.
- Add source-token, action, content-retention and limit checks. Synchronization
  and parser terminology remains provisional and needs contextual review.
- English placeholders decrease from 45,698 to 45,655 across 70 languages, with
  148 source keys tracked separately for wording review.
- Validation: 41 focused translation tests and 21 human-preference checks pass.
  Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fcd7871303f7d6d27c9b0243af30d5256697c65f">Translate 40 Akan sprint-report and completion messages.</a></summary>

- Fill remaining Scrum event, report, lifecycle, daily-observation and
  import-status messages. Preserve unknown-versus-zero estimates, partial data
  and separate close/cancel behavior.
- Add placeholder, lifecycle, UTC observation, limit and shared-label checks.
  Reporting terminology remains low confidence and needs contextual review.
- English placeholders decrease from 45,738 to 45,698 across 70 languages, with
  148 source keys tracked separately for wording review.
- Validation: 40 focused translation tests and 21 human-preference checks pass.
  Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/44a707acf5c5617b66990bc7065edc103eb14a81">Translate 54 Akan rule-editor and Scrum planning messages.</a></summary>

- Fill rule-editor controls, Scrum roles, estimates, backlog and sprint
  planning. Correct the unrelated generic phrase previously used for the Rules
  label.
- Add argument, permission, distinct-action, time-unit and shared-label checks.
  Scrum terminology remains provisional and needs contextual review.
- English placeholders decrease from 45,792 to 45,738 across 70 languages, with
  148 source keys tracked separately for wording review.
- Validation: 39 focused translation tests and 21 human-preference checks pass.
  Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7085c23c55ad4f1f32f0bb3e55b22880f0dc1947">Translate 42 Akan Blockly variable and workspace messages.</a></summary>

- Fill variable operations and conflicts, workspace counts, search controls and
  remaining shared labels. Preserve arguments, shortcut names and count
  distinctions.
- Add token, zero/one/many, fragment spacing, shortcut and shared-label checks.
  Technical terminology remains provisional and needs contextual review.
- English placeholders decrease from 45,834 to 45,792 across 70 languages, with
  148 source keys tracked separately for wording review.
- Validation: 38 focused translation tests and 21 human-preference checks pass.
  Browser and spoken-accessibility checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/aecde9ea7794abb325ebe7e657e333f29f4b6f94">Translate 55 Akan Blockly text-operation messages.</a></summary>

- Fill text construction, character and substring access, searches, replacement,
  prompts and trimming. Preserve numbered arguments and first/last endpoints.
- Add placeholder, absent-match, reverse-order, trim-side and input-type checks.
  Case and substring terminology remains provisional and needs contextual
  review.
- English placeholders decrease from 45,889 to 45,834 across 70 languages, with
  148 source keys tracked separately for wording review.
- Validation: 37 focused translation tests and 21 human-preference checks pass.
  Browser and spoken-accessibility checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dab652b0aed5cc5dc795430c25862b2f98b735ee">Translate 39 Akan Blockly navigation shortcuts.</a></summary>

- Fill movement, scrolling, focus, stack and announcement shortcuts. Preserve
  directions and distinguish previous, next, first and last positions.
- Add direction, opposite-action and placeholder checks. Accessibility
  terminology remains provisional and needs contextual review.
- English placeholders decrease from 45,928 to 45,889 across 70 languages, with
  148 source keys tracked separately for wording review.
- Validation: 36 focused translation tests and 21 human-preference checks pass.
  Browser and spoken-accessibility checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9f2a316369e7c79c7c2e2c1cacd72dd7e24310a6">Translate 31 Akan Blockly procedure and screen-reader messages.</a></summary>

- Fill procedure, parent/backpack, rename and screen-reader controls. Preserve
  return values, function restrictions, numbered arguments and state
  transitions.
- Extend return/no-return, rename-scope and on/off checks. Accessibility
  terminology remains provisional and needs contextual review.
- English placeholders decrease from 45,959 to 45,928 across 70 languages, with
  148 source keys tracked separately for wording review.
- Validation: 35 focused translation tests and 21 human-preference checks pass.
  Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fe7da49ef80ca6b684c8d2b4e9e768ee8ee11a70">Translate 39 Akan Blockly unary-math and workspace messages.</a></summary>

- Fill unary math, trigonometry, minimap and variable controls. Preserve
  logarithm bases, degree/radian distinctions and recognizable function names.
- Extend base, inverse-function, angle-unit and control-state checks.
  Mathematical wording remains low confidence and needs contextual review.
- English placeholders decrease from 45,998 to 45,959 across 70 languages, with
  148 source keys tracked separately for wording review.
- Validation: 34 focused translation tests and 21 human-preference checks pass.
  Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cb52ef9928465793a63634624d53f700b7b84220">Translate 27 Akan Blockly statistics and random-value messages.</a></summary>

- Fill list statistics, powers, random values and rounding messages. Preserve
  numbered arguments, endpoint inclusion and distinct operations.
- Extend statistic, random-bound and rounding-direction checks. Mathematical
  terminology remains low confidence and needs contextual review.
- English placeholders decrease from 46,025 to 45,998 across 70 languages, with
  148 source keys tracked separately for wording review.
- Validation: 33 focused translation tests and 21 human-preference checks pass.
  Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c931f9aed95e01425f59dee87ed216c5ac6e89cf">Translate 30 Akan Blockly arithmetic and number-property messages.</a></summary>

- Fill arithmetic, constants, numeric bounds, parity, sign and remainder
  messages. Preserve mathematical notation, coordinate labels and numbered
  arguments.
- Extend notation, inclusive-limit and numeric-property checks. Mathematical
  terminology remains low confidence and requires contextual review.
- English placeholders decrease from 46,055 to 46,025 across 70 languages, with
  148 source keys tracked separately for wording review.
- Validation: 32 focused translation tests and 21 human-preference checks pass.
  Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d68f13d4a6c6e51fa6abfc5fa4db7c2d7a482655">Translate 47 Akan Blockly list-mutation and logic messages.</a></summary>

- Fill insertion/replacement, sorting, split/join, comparison and conditional
  messages. Preserve arguments and distinguish operation and comparison
  boundaries.
- Extend mutation, boolean-quantifier and conditional-label checks. Sorting and
  programming terminology remains provisional.
- English placeholders decrease from 46,102 to 46,055 across 70 languages, with
  148 source keys tracked separately for wording review.
- Validation: 31 focused translation tests and 21 human-preference checks pass.
  Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/99a908163a25c94d1a1003fcaadba8a6aa3ed171">Translate 46 Akan Blockly list messages.</a></summary>

- Fill list creation, retrieval/removal, sublists, search, length, repetition
  and reversal messages. Preserve numbered arguments, position markers and
  operation distinctions.
- Extend return/remove, not-found and copy/reversal checks. List terminology
  remains provisional and needs contextual review.
- English placeholders decrease from 46,148 to 46,102 across 70 languages, with
  148 source keys tracked separately for wording review.
- Validation: 30 focused translation tests and 21 human-preference checks pass.
  Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5e1b2bd9fe327f057893f5ef57b5e545549f3160">Translate 58 Akan Blockly input and keyboard messages.</a></summary>

- Fill condition, list, loop, numeric and text inputs plus keyboard guidance.
  Preserve numbered arguments, coordinate labels and distinct input roles.
- Extend token, start/end, dividend/divisor and navigation checks. Technical
  wording remains provisional and needs contextual accessibility review.
- English placeholders decrease from 46,206 to 46,148 across 70 languages, with
  148 source keys tracked separately for wording review.
- Validation: 29 focused translation tests and 21 human-preference checks pass.
  Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cbb638273b78ed7a327932b2326e40d90caf4598">Translate 39 Akan Blockly editing and field-control messages.</a></summary>

- Fill copy/delete, backpack, bitmap, multiline and icon messages. Preserve
  numbered arguments, all-block scope and opposite control states.
- Extend token, scope and open/close checks. Bitmap and multiline wording
  remains provisional and needs accessibility review.
- English placeholders decrease from 46,245 to 46,206 across 70 languages, with
  148 source keys tracked separately for wording review.
- Validation: 28 focused translation tests and 21 human-preference checks pass.
  Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/541821bdf0f28a5419db8001319b3f5214e3dce1">Translate 44 Akan Blockly messages and correct three color labels.</a></summary>

- Fill editing, color, loop and conditional messages. Replace unrelated filler
  text for red, green and blue with matching color names.
- Extend token, numeric-bound, color and opposite-condition checks. Programming
  terminology remains provisional and needs contextual review.
- English placeholders decrease from 46,289 to 46,245 across 70 languages, with
  148 source keys tracked separately for wording review.
- Validation: 27 focused translation tests and 21 human-preference checks pass.
  Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/41797709b994230a14d3971c8803f11cb5f61fd0">Translate 16 Akan Blockly block and bubble labels.</a></summary>

- Fill block states, branches, inputs, stack descriptions, categories and
  comment/warning bubbles. Preserve numbered arguments and singular/plural
  distinctions.
- Register Akan in the shared block/bubble checks. Technical metaphors remain
  provisional and need accessibility review.
- English placeholders decrease from 46,305 to 46,289 across 70 languages, with
  148 source keys tracked separately for wording review.
- Validation: 26 focused translation tests and 21 human-preference checks pass.
  Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d212877d4b1a733ee522b43157334f232caf4a0a">Correct 15 Waray color and date-format labels.</a></summary>

- Replace French/Walloon color names and date labels; restore the full ISO-week
  calendar description. Keep actual format codes with Waray component-order
  explanations.
- Extend format-order, calendar and color-family checks. Fine color distinctions
  remain provisional and need visual language review.
- English placeholders remain at 46,305 across 70 languages, with 148 source
  keys tracked separately for wording review.
- Validation: 28 focused translation/parser tests and 21 human-preference checks
  pass. Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e61c71a119bb50a08db495c26647b862b44a9a0d">Correct 38 Waray diagnostic and process-chart labels.</a></summary>

- Replace foreign-language diagnostic, event, import and search labels. Restore
  distinct meanings for mean, confidence and moving range while preserving
  technical identifiers.
- Extend shared-label, no-active-work and identifier checks. Statistical
  terminology remains provisional and requires technical-language review.
- English placeholders remain at 46,305 across 70 languages, with 148 source
  keys tracked separately for wording review.
- Validation: 28 focused translation/parser tests and 21 human-preference checks
  pass. Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6669aecc6b6e4289cbe0dc3d2a25a61885f8f1dc">Correct 84 foreign-language Waray rule, account and storage labels.</a></summary>

- Replace French, Walloon and mixed-language rule fragments, account/card views,
  diagnostic, recurrence and storage labels. Preserve error arguments,
  identifiers and AWS/Cc notation.
- Extend shared-label, passwordless and reset/recurrence checks. Technical
  terminology remains provisional and further vocabulary review is open.
- English placeholders remain at 46,305 across 70 languages, with 148 source
  keys tracked separately for wording review.
- Validation: 28 focused translation/parser tests and 21 human-preference checks
  pass. Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7d4888c351fbeb55c669fbebd1cb8bdcba18579a">Correct 52 foreign-language Waray board-view and account labels.</a></summary>

- Replace French and Walloon board views, font/theme controls, account labels,
  starred-item controls and work timers. Preserve zoom directions,
  unread-comment meaning and timer arguments.
- Extend shared-label, direction and scope checks. Flow and milestone wording
  remains provisional, and further vocabulary review is open.
- English placeholders remain at 46,305 across 70 languages, with 148 source
  keys tracked separately for wording review.
- Validation: 28 focused translation/parser tests and 21 human-preference checks
  pass. Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c3d0a53fcbc05e5f2e397f3274dab41c1ec64025">Correct 41 foreign-language Waray chart and interface labels.</a></summary>

- Replace French, Walloon and mixed-language chart, preview, rule, storage and
  authentication labels. Preserve the reactivity identifier and distinct
  reset/recur and work-remaining/completed meanings.
- Extend shared-preview, operation and authentication-state checks. Broader
  vocabulary and contextual language review remains open.
- English placeholders remain at 46,305 across 70 languages, with 148 source
  keys tracked separately for wording review.
- Validation: 28 focused translation/parser tests and 21 human-preference checks
  pass. Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f9714a0d048254b771b01ee51f27b44e825019ed">Correct 42 foreign-language Waray search aliases.</a></summary>

- Replace French and Walloon operator/predicate values with single-token Waray
  aliases. Preserve existing shorthand symbols and abbreviations.
- Exercise the actual parser for translated text queries, positive/negative
  attachment existence, invalid predicates and modified dates. Compact query
  wording remains provisional.
- English placeholders remain at 46,305 across 70 languages, with 148 source
  keys tracked separately for wording review.
- Validation: 28 focused translation/parser tests and 21 human-preference checks
  pass. Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/60c0cd14851fd84910fe346fc568cf4e1f91fc45">Correct 21 foreign-language Waray synchronization and attachment labels.</a></summary>

- Replace French and Walloon list-sync controls, credential states and
  attachment query terms. Preserve the 15-minute interval, failure argument and
  source identifiers.
- Extend interval, shared-action, credential-state and single-word query checks.
  Further French search terms remain under review; credential terminology
  remains provisional.
- English placeholders remain at 46,305 across 70 languages, with 148 source
  keys tracked separately for wording review.
- Validation: 27 focused translation tests and 21 human-preference checks pass.
  Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9b89502663efcd1f0e3056e7620f4148718d41c7">Correct 44 foreign-language values in Waray controls and authentication.</a></summary>

- Replace French, Walloon and mixed-language text in board controls, templates,
  loading indicators, authentication and forecasting. Preserve authentication
  requirements, forecast tokens and file extensions.
- Extend shared-label and authentication checks. The broader vocabulary audit
  found values missed by the earlier exact-match comparison; further
  wrong-language review remains open.
- English placeholders remain at 46,305 across 70 languages, with 148 source
  keys tracked separately for wording review. Technical terminology remains
  provisional.
- Validation: 27 focused translation tests and 21 human-preference checks pass.
  Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3ee6eedca242d1aa7650cb0ee649c65ccbd6ebf7">Translate 27 Waray activity-notification recovery messages.</a></summary>

- Fill pending-delivery, retry and pause/resume/cancel messages. Preserve
  retained work, no activity recreation and cancellation limits.
- Extend negative-behavior and distinct-action checks. Recovery terminology
  remains provisional and requires contextual review.
- English placeholders decrease from 46,332 to 46,305 across 70 languages, with
  148 source keys tracked separately for wording review.
- Validation: 27 focused translation tests and 21 human-preference checks pass.
  Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e2225421b149dbb7368cd4adf6636d91af558092">Translate 29 Waray synchronization-report and email-failure messages.</a></summary>

- Fill run history, recovery diagnostics, estimate mappings and email failure
  categories. Preserve retention periods, write-access requirements and
  missing-versus-null semantics.
- Extend report-limit, field-count and temporary/permanent rejection checks.
  Diagnostic terminology remains provisional and requires contextual review.
- English placeholders decrease from 46,361 to 46,332 across 70 languages, with
  148 source keys tracked separately for wording review.
- Validation: 27 focused translation tests and 21 human-preference checks pass.
  Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3d0cbfea577512c89d4e938112d9d99b3322483e">Translate 43 Waray synchronization conflict and preview messages.</a></summary>

- Fill conflict choices, replacement-card, preview and source-field messages.
  Preserve local content, unchanged subcards, source-write restrictions and
  report limits.
- Extend scope, replacement-reuse and shared-label checks. Mapping and parser
  terminology remains provisional and requires technical-language review.
- English placeholders decrease from 46,404 to 46,361 across 70 languages, with
  148 source keys tracked separately for wording review.
- Validation: 27 focused translation tests and 21 human-preference checks pass.
  Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9b9c7ea815c65120a8ec7fe83d65f0d820b9a159">Translate 40 Waray Scrum report messages and correct the Export label.</a></summary>

- Fill events, states, confirmations, reports and daily observations. Preserve
  count/reference tokens, UTC, unknown-estimate distinctions and separate export
  scopes.
- Correct the wrong-language Export label and extend scope, state, unit and
  limit checks. Scrum terminology remains provisional and requires contextual
  review.
- English placeholders decrease from 46,444 to 46,404 across 70 languages, with
  148 source keys tracked separately for wording review.
- Validation: 27 focused translation tests and 21 human-preference checks pass.
  Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3c6fa1d57cc3e66cbe4b0a7c2497a1c52627144f">Translate 54 Waray rule-editor and Scrum-planning messages.</a></summary>

- Fill block-rule validation, conflict and permission messages alongside
  backlog, estimate and sprint-planning labels. Preserve workflow restrictions
  and distinct completion policies.
- Extend permission, reload-before-save, sprint-action and shared-view-label
  checks. Scrum terminology remains provisional and requires contextual review.
- English placeholders decrease from 46,498 to 46,444 across 70 languages, with
  148 source keys tracked separately for wording review.
- Validation: 27 focused translation tests and 21 human-preference checks pass.
  Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a721b3054bfc7f726c1c10dcb8e47dbd712ebc5b">Translate 44 Waray Blockly variable and workspace messages.</a></summary>

- Fill variable-conflict, workspace-count, search and shared block labels.
  Preserve numbered arguments, keyboard shortcuts and spacing in combined
  announcements.
- Extend fragment, search-direction and shared-label checks. Contextual language
  and accessibility review remains open.
- English placeholders decrease from 46,542 to 46,498 across 70 languages, with
  148 source keys tracked separately for wording review.
- Validation: 27 focused translation tests and 21 human-preference checks pass.
  Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/001706d6b70be41cbb474e9b1d4c0e724b2458d1">Translate 53 Waray Blockly text-operation messages.</a></summary>

- Fill text-case, character, substring, search, replacement, prompting and
  trimming messages. Preserve numbered arguments, positions, copy semantics and
  whitespace behavior.
- Extend not-found, replace-all and trimming checks. Title-case and substring
  wording remains provisional and needs contextual review.
- English placeholders decrease from 46,595 to 46,542 across 70 languages, with
  148 source keys tracked separately for wording review.
- Validation: 27 focused translation tests and 21 human-preference checks pass.
  Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8e44e261b80927b869bdb6dfa6c4e9fa8794d4f8">Translate 42 Waray Blockly screen-reader and navigation messages.</a></summary>

- Fill screen-reader, movement, scrolling, focus and editing shortcuts. Preserve
  numbered arguments, opposite directions and mode state transitions.
- Extend direction and opposite-action checks. Accessibility terminology remains
  provisional and needs contextual review.
- English placeholders decrease from 46,637 to 46,595 across 70 languages, with
  148 source keys tracked separately for wording review.
- Validation: 27 focused translation tests and 21 human-preference checks pass.
  Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3b4baa79cd0037627b7eb446b2d15f7602ddd3eb">Translate 51 Waray Blockly trigonometry and procedure messages.</a></summary>

- Fill trigonometry, workspace, variable and function messages. Preserve
  numbered arguments, angle units, return-value distinctions and function
  restrictions.
- Extend unit, function-scope and rename-all checks. Trigonometric terminology
  remains low confidence and requires fluent mathematical review.
- English placeholders decrease from 46,688 to 46,637 across 70 languages, with
  148 source keys tracked separately for wording review.
- Validation: 27 focused translation tests and 21 human-preference checks pass.
  Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cfbda9b1d00331bdc276d8cdcaaf552384f37841">Translate 28 Waray Blockly random-value and unary-math messages.</a></summary>

- Fill random-number, rounding, absolute-value, exponential, logarithm and
  square-root messages. Preserve numbered arguments, numeric bases and
  inclusive/exclusive endpoints.
- Extend rounding, bound and sign-reversal checks. Mathematical terminology
  remains provisional and needs contextual language review.
- English placeholders decrease from 46,716 to 46,688 across 70 languages, with
  148 source keys tracked separately for wording review.
- Validation: 27 focused translation tests and 21 human-preference checks pass.
  Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8c9a90d987f557b4c8f5c972a527fcc43b1081e3">Translate 25 Waray Blockly numeric-property and statistics messages.</a></summary>

- Fill sign, parity, modulo and list-statistics labels. Preserve numbered
  arguments and distinguish mean, median, modes, standard deviation and sum.
- Extend sign, modulo and operation checks. Statistical terminology remains
  provisional and needs contextual language review.
- English placeholders decrease from 46,741 to 46,716 across 70 languages, with
  148 source keys tracked separately for wording review.
- Validation: 27 focused translation tests and 21 human-preference checks pass.
  Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/44cf47b76bfffc4928b864bcb8806e83a144b1b6">Translate 27 Waray Blockly arithmetic and logical-condition messages.</a></summary>

- Fill conjunction, conditional-expression, arithmetic, constant and bound
  labels. Preserve mathematical notation, numbered arguments, angle ranges and
  inclusive limits.
- Extend notation and condition checks. Mathematical terminology remains
  provisional and contextual review remains open.
- English placeholders decrease from 46,768 to 46,741 across 70 languages, with
  148 source keys tracked separately for wording review.
- Validation: 27 focused translation tests and 21 human-preference checks pass.
  Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a0640e4f4a9071bcaa7adf9bed71476aedb363b7">Translate 29 Waray Blockly sorting and logic messages.</a></summary>

- Fill sorting, split/join, boolean, comparison and negation labels. Preserve
  numbered arguments, copy semantics and strict/inclusive comparisons; retain
  the null literal.
- Extend operation and boundary checks. Technical wording remains provisional
  and contextual accessibility review remains open.
- English placeholders decrease from 46,797 to 46,768 across 70 languages, with
  148 source keys tracked separately for wording review.
- Validation: 27 focused translation tests and 21 human-preference checks pass.
  Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a47ac3e61b197b297ad85cf5b407ffdad94c5010">Translate 30 Waray Blockly indexing and replacement messages.</a></summary>

- Fill sublist, search, length, repetition, reversal and insertion/replacement
  labels. Preserve missing-result values, copy semantics and operation
  distinctions.
- Extend token and operation regressions. Technical wording remains provisional
  and contextual language review remains open.
- English placeholders decrease from 46,827 to 46,797 across 70 languages, with
  148 source keys tracked separately for wording review.
- Validation: 27 focused translation tests and 21 human-preference checks pass.
  Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a157eec21186ff0ff2cbf7c10a0ded3a35074c97">Translate 27 Waray Blockly list-operation messages.</a></summary>

- Fill list creation, indexed retrieval/removal and end-relative labels.
  Preserve the distinction between returning, removing, and
  removing-and-returning an item.
- Extend positive/negative operation checks. Programming terminology remains
  provisional and contextual language review remains open.
- English placeholders decrease from 46,854 to 46,827 across 70 languages, with
  148 source keys tracked separately for wording review.
- Validation: 27 focused translation tests and 21 human-preference checks pass.
  Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fae17f2dfaa0d806d98453b6bb09bb338dab8801">Translate 33 Waray Blockly operand and navigation labels.</a></summary>

- Fill mathematical/text input descriptions and keyboard-navigation hints.
  Preserve numbered arguments, operand distinctions and key sequence; retain
  keyboard legends.
- Extend token, opposite-operation and navigation checks. Technical wording
  remains provisional and contextual accessibility review remains open.
- English placeholders decrease from 46,887 to 46,854 across 70 languages, with
  148 source keys tracked separately for wording review.
- Validation: 27 focused translation tests and 21 human-preference checks pass.
  Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fa591af03fa375eb65a115a20ea58841c805ca1b">Translate 34 Waray Blockly icon actions and input descriptions.</a></summary>

- Fill keyboard-help, icon-action and list/condition/loop/math input labels.
  Preserve numbered arguments, opening/closing direction and start/end
  distinctions; retain keyboard legends.
- Extend token and action regressions. Technical wording remains provisional and
  contextual accessibility review remains open.
- English placeholders decrease from 46,921 to 46,887 across 70 languages, with
  148 source keys tracked separately for wording review.
- Validation: 27 focused translation tests and 21 human-preference checks pass.
  Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/56d0813ea73048bf5d1c69d5adf1d6d36ee1baba">Translate 35 Waray Blockly loop and editing controls.</a></summary>

- Fill clipboard, deletion, enable/disable, expand, bitmap and field-editing
  messages. Preserve numbered arguments, while/until polarity and row/column
  meaning; retain keyboard legends.
- Extend token and operation regressions. Technical wording remains provisional
  and contextual language review remains open.
- English placeholders decrease from 46,956 to 46,921 across 70 languages, with
  148 source keys tracked separately for wording review.
- Validation: 27 focused translation tests and 21 human-preference checks pass.
  Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5d9498914d40ccbae1450b5bd5a7cca3dc02c5d4">Translate 39 Waray Blockly editing, color and control-flow messages.</a></summary>

- Fill English placeholders while preserving numbered arguments and numeric
  ranges. Keep loop break/continue and conditional fallback meanings distinct;
  retain keyboard legends and product names.
- Extend translation and control-flow regressions. Technical terminology remains
  provisional and contextual language review remains open.
- English placeholders decrease from 46,995 to 46,956 across 70 languages, with
  148 source keys tracked separately for wording review.
- Validation: 27 focused translation tests and 21 human-preference checks pass.
  Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/096fe6c6cb747848ef02e86877407bf120929618">Correct 31 Walloon values in Waray repair and import guidance.</a></summary>

- Correct migration, repair, import/export, search, synchronization and forecast
  messages. Preserve count tokens, unsuccessful-repair meanings, search syntax,
  extensions and product names.
- Extend regressions. The exact-Walloon vocabulary scan now has no candidates,
  but this heuristic does not establish complete or fluent Waray coverage;
  contextual review remains necessary.
- English placeholders remain at 46,995 across 70 languages, with 148 source
  keys tracked separately for wording review.
- Validation: 27 focused translation tests and 21 human-preference checks pass.
  Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/92db84756ca91a70b09fea35638338f8cc39cf0f">Correct 25 Walloon values in Waray storage and backup labels.</a></summary>

- Correct storage, identifiers, board status, timing, checklist and backup
  labels. Preserve product names, organization-backup exclusions, restoration
  scope and the large-board lazy-loading restriction.
- Extend product-name and scope checks; technical wording remains provisional
  and further language corrections remain necessary.
- English placeholders remain at 46,995 across 70 languages, with 148 source
  keys tracked separately for wording review.
- Validation: 27 focused translation tests and 21 human-preference checks pass.
  Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4dbef0cf0fe6381a10e0028fb1aa5cfbd1f40b84">Correct 20 Walloon values in Waray reporting and recovery labels.</a></summary>

- Correct activity, security, login-location, API, recovery and history
  messages. Preserve configuration names and report aggregation, first/last and
  edited/moved distinctions.
- Extend regressions and document provisional technical wording. Further Waray
  corrections and contextual language review remain necessary.
- English placeholders remain at 46,995 across 70 languages; 148 source keys are
  tracked separately for wording review.
- Validation: all 27 focused translation tests and 21 human-preference checks
  pass; the Blockly dependency is available again. Browser checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/98fb2bf52d82e72902c2581bedb942206e8fc239">Correct 25 Walloon values in Waray role and table-view labels.</a></summary>

- Correct checklist sound, public/private defaults, role summaries, table
  toggles, search and layout labels. Preserve default-off and read-only meanings
  and each toggle's inverse action.
- Extend operation and localized search-token checks. Technical wording remains
  provisional; further Waray corrections and contextual review remain open.
- English placeholders remain at 46,995 across 70 languages, with 148 source
  keys tracked separately for wording review.
- Validation: the Waray regression, all-234-locale completeness/token check and
  21 human-preference checks pass. The broader Blockly suite could not start
  because node_modules/blockly/msg/en.js was missing. Browser checks were not
  run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c182b9ac42bacb82b99d00842f3423667a7f0a39">Correct 25 Walloon values in Waray login, rule and layout labels.</a></summary>

- Correct rule, LDAP/OAuth, passwordless login and layout labels while
  preserving template variables and configuration names. Retain one-time-code,
  account-conflict and secret-visibility meanings.
- Extend camel-case brace-token, configuration and login-state checks. Restore
  omitted mobile/desktop notification detail; contextual wording review remains
  necessary.
- English placeholders remain at 46,995 across 70 languages; 148 pending source
  keys and further wrong-language corrections remain open.
- Validation: 27 focused tests and 21 human-preference checks pass. Browser
  checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7ff98db7a5b1a29b79f89cee35b0502e282db0c3">Correct 25 Walloon values in Waray organization and template controls.</a></summary>

- Correct external issue-link, email-template, database metadata, organization,
  field-order and rule labels. Preserve template variables, configuration
  identifiers and organization-admin restrictions.
- Extend brace-token, authorization-negation and up/down checks. Technical
  terminology remains provisional and further wrong-language corrections remain
  necessary.
- English placeholders remain at 46,995 across 70 languages; 148 pending source
  keys and broader semantic review remain open.
- Validation: 27 focused tests and 21 human-preference checks pass. Browser
  checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/65fe9d72218e6ce2c8eb0466997d3c6110d35377">Correct 30 further Walloon values in Waray notes and favorites.</a></summary>

- Correct note, favorite, permanent-delete, text-matching, import, selection and
  interruption labels. Restore the missing Markdown-import explanation for plain
  bulleted lists without checkboxes.
- Preserve placeholders, Markdown examples and the guarantee that enabling
  permanent deletion does not itself delete content. Extend operation and
  language regressions; technical wording remains provisional.
- These wrong-language corrections leave 46,995 English placeholders across 70
  languages. Further Waray corrections, 148 pending source keys and broader
  semantic review remain open.
- Validation: 27 focused tests and 21 human-preference checks pass. Browser
  checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6c95ad716d5c0c390741a98900b06a5798d5992d">Correct 40 Walloon values in Waray board and import controls.</a></summary>

- Replace wrong-language board membership, home/default board, view, deadline,
  import/export, user mapping and note labels with Waray. Preserve day-count
  tokens and non-deletion guarantees.
- Add regression checks for the corrected values, known Walloon vocabulary,
  source arguments and operation distinctions. More Walloon contamination
  remains in the Waray catalog; technical wording still needs contextual review.
- The ordinary English-placeholder count remains 46,995 across 70 languages
  because these corrections replace non-English text. The 148 pending source
  keys and broader semantic audit remain open.
- Validation: 27 focused tests and 21 human-preference checks pass. Browser
  checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6c5433f4d1d977b5e2219857fee36b9842a3b5a3">Translate Walloon and Waray block labels and correct mistaken locale identity.</a></summary>

- Fill 32 English placeholders and correct 15 Walloon field labels mistakenly
  inserted into the Waray catalog. The registry identifies wa-RR as Waray-Waray;
  earlier claims that its Waray text was foreign were incorrect.
- Repair the regression that enforced wrong-language labels and extend
  block-label checks. Preserve arguments and document provisional terminology
  and further language review.
- Ordinary untranslated values decrease from 47,027 to 46,995 across 70
  languages; 148 pending source keys and the broader semantic audit remain open.
- Validation: 26 focused tests and 21 human-preference checks pass. Browser
  coverage is syntax-checked; browser and spoken accessibility checks were not
  run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f8107ec9b23a34778fe9b3ba45792a4e45ff35bb">Translate Wu Chinese and Venetian block and bubble labels.</a></summary>

- Fill 32 English placeholders while preserving numbered arguments and existing
  translations. Extend block-state, input and bubble distinction checks.
- Document provisional regional wording and technical metaphors. Contextual
  language and spoken accessibility review remain open.
- Ordinary untranslated values decrease from 47,059 to 47,027 across 70
  languages; 148 pending source keys and the broader semantic audit remain open.
- Validation: 26 focused tests and 21 human-preference checks pass. Browser
  coverage is syntax-checked; browser and spoken accessibility checks were not
  run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7ef3e29237d8516ea23ef1566b71847ce5d0fe3f">Translate Tsonga and Venda block and bubble labels.</a></summary>

- Fill 32 English placeholders while preserving numbered arguments and existing
  translations. Extend block-state, input and bubble distinction checks.
- Document vocabulary references and provisional stack, replacement and text-box
  wording. Contextual language and spoken accessibility review remain open.
- Ordinary untranslated values decrease from 47,091 to 47,059 across 70
  languages; 148 pending source keys and the broader semantic audit remain open.
- Validation: 26 focused tests and 21 human-preference checks pass. Browser
  coverage is syntax-checked; browser and spoken accessibility checks were not
  run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4276db8d68aa64a238d4d2616ba3452b8e20564b">Translate Kinyarwanda, Kirundi, Luganda and Chichewa block and bubble labels.</a></summary>

- Fill 64 English placeholders while preserving numbered arguments and existing
  translations. Extend block-state, input and bubble distinction checks.
- Record vocabulary corrections and provisional technical metaphors and
  grammatical agreement. Contextual language and spoken accessibility review
  remain open.
- Ordinary untranslated values decrease from 47,155 to 47,091 across 70
  languages; 148 pending source keys and the broader semantic audit remain open.
- Validation: 26 focused tests and 21 human-preference checks pass. Browser
  coverage is syntax-checked; browser and spoken accessibility checks were not
  run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b69e4681c4aed2cc011a129298d3579a587477ca">Translate Sesotho, Setswana and Northern Sotho block and bubble labels.</a></summary>

- Fill 48 English placeholders while preserving numbered arguments and existing
  translations. Extend block-state, input and bubble distinction checks.
- Record vocabulary evidence and provisional technical metaphors and number
  agreement. Contextual language and spoken accessibility review remain open.
- Ordinary untranslated values decrease from 47,203 to 47,155 across 70
  languages; 148 pending source keys and the broader semantic audit remain open.
- Validation: 26 focused tests and 21 human-preference checks pass. Browser
  coverage is syntax-checked; browser and spoken accessibility checks were not
  run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c910255500a0c94a9ce8d73e3fcb3ea2a1b75833">Translate Zulu, Xhosa, Swati and Northern Ndebele block and bubble labels.</a></summary>

- Fill 80 English placeholders across five catalogs, including both Zulu paths,
  while preserving numbered arguments and existing translations. Extend
  block-state, input and bubble distinction checks.
- Record lower-confidence technical metaphors and agreement around arbitrary
  numbers. Contextual language and spoken accessibility review remain open.
- Ordinary untranslated values decrease from 47,283 to 47,203 across 70
  languages; 148 pending source keys and the broader semantic audit remain open.
- Validation: 26 focused tests and 21 human-preference checks pass. Browser
  coverage is syntax-checked; browser and spoken accessibility checks were not
  run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9e71da2b4eef5fa627e53c3492ef1ef8b5c05837">Translate Bislama, Tok Pisin, Fijian and Papiamento block and bubble labels.</a></summary>

- Fill 64 English placeholders while preserving numbered arguments and existing
  translations. Extend block-state, input and bubble distinction checks.
- Document contextual bubble paraphrases and lower-confidence technical wording,
  particularly Fijian value terminology. Language and spoken accessibility
  review remain open.
- Ordinary untranslated values decrease from 47,347 to 47,283 across 70
  languages; 148 pending source keys and the broader semantic audit remain open.
- Validation: 26 focused tests and 21 human-preference checks pass. Browser
  coverage is syntax-checked; browser and spoken accessibility checks were not
  run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b74cc1a1475e351e8df7d44c20a5f63ba34c4358">Translate Māori, Samoan, Hawaiian and Tongan block and bubble labels.</a></summary>

- Fill 64 English placeholders while preserving numbered arguments and existing
  translations. Extend block-state, input and bubble distinction checks.
- Document dictionary references and lower-confidence stack, container and
  bubble metaphors. Contextual language and spoken accessibility review remain
  open.
- Ordinary untranslated values decrease from 47,411 to 47,347 across 70
  languages; 148 pending source keys and the broader semantic audit remain open.
- Validation: 26 focused tests and 21 human-preference checks pass. Browser
  coverage is syntax-checked; browser and spoken accessibility checks were not
  run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/be02e9bf43f5ab50b3f5fa6aabd29f3b1e349848">Translate Somali, Moroccan Arabic, Odia and Konkani block and bubble labels.</a></summary>

- Fill 64 English placeholders while preserving numbered arguments and existing
  translations. Extend block-state, input and bubble distinction checks.
- Document lower-confidence technical metaphors, particularly Somali and Konkani
  wording; contextual accessibility review remains open.
- Ordinary untranslated values decrease from 47,475 to 47,411 across 70
  languages; 148 pending source keys and the broader semantic audit remain open.
- Validation: 26 focused tests and 21 human-preference checks pass. Browser
  coverage is syntax-checked; browser and spoken accessibility checks were not
  run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cad48f4a2064b5dfae456662c3659b2c941bcf85">Translate Yiddish, Turkmen, Bhojpuri and Maithili block and bubble labels.</a></summary>

- Fill 64 English placeholders, preserving numbered arguments and existing
  correct-language translations. Extend block-state, input and bubble
  distinction checks.
- Document lower-confidence stack/row, bubble and container terminology;
  contextual accessibility review remains open.
- Ordinary untranslated values decrease from 47,539 to 47,475 across 70
  languages; 148 pending source keys and the broader semantic audit remain open.
- Validation: 26 focused tests and 21 human-preference checks pass. Existing
  browser coverage is syntax-checked; browser and spoken accessibility checks
  were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fa8167b30a49098d8df0ab015bd36a5a36be142d">Translate Kurdish and Tatar block and bubble labels.</a></summary>

- Fill 48 English placeholders across Northern Kurdish, Central Kurdish and
  Tatar, preserving numbered arguments and existing correct-language
  translations.
- Add checks for singular/plural input, collapsed/disabled, statement/value and
  comment/warning distinctions. Contextual wording review remains open, with
  lower-confidence terms documented in the audit.
- Ordinary untranslated values decrease from 47,587 to 47,539 across 70
  languages; 148 pending source keys and the broader semantic audit remain open.
- Validation: 26 focused tests and 21 human-preference checks pass. Existing
  browser coverage is syntax-checked; browser and spoken accessibility checks
  were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a71977d57795c77c26cfc3150dacb06bbd58f922">Translate Cherokee field types.</a></summary>

- Fill 11 English placeholders while preserving source arguments and existing
  non-English translations. Extend field-type distinction checks.
- Record vocabulary references and very low confidence in technical wording;
  grammatical and semantic review remains necessary.
- Ordinary untranslated values decrease from 47,598 to 47,587 across 70
  languages; 148 pending source keys and the broader semantic audit remain open.
- Validation: 25 focused tests and 21 human-preference checks pass. Existing
  browser coverage is syntax-checked; browser and spoken accessibility checks
  were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8cc6c614f8dafd1a57b569ea43a9dd71de522dec">Translate Wolaytta field labels and remove English control filler.</a></summary>

- Fill ten English placeholders and replace three prefixed-English controls.
  Preserve source arguments and existing correct-language translations.
- Add token/type distinction checks and correction regressions. Vocabulary
  references and low-confidence technical wording are recorded in the audit;
  angle remains pending vocabulary evidence.
- Ordinary untranslated values decrease from 47,608 to 47,598 across 70
  languages; 148 pending source keys and the broader semantic audit remain open.
- Validation: 25 focused tests and 21 human-preference checks pass. Existing
  browser coverage is syntax-checked; browser and spoken accessibility checks
  were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/96fd0432bd380b00216e7cf282db308e3d867458">Translate Tigre field types and correct calendar date label.</a></summary>

- Fill 11 English placeholders and correct the date control's fruit/date
  ambiguity. Preserve source arguments and existing correct-language
  translations.
- Extend field-type distinctions and add a date regression. Vocabulary
  references and low-confidence technical phrases are recorded in the audit.
- Ordinary untranslated values decrease from 47,619 to 47,608 across 70
  languages; 148 pending source keys and the broader semantic audit remain open.
- Validation: 24 focused tests and 21 human-preference checks pass. Existing
  browser coverage is syntax-checked; browser and spoken accessibility checks
  were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ff8c9bd0e62f4afe313fc22eb2d69fa781d01897">Translate Tamazight field types.</a></summary>

- Fill 11 English placeholders in Tifinagh while preserving source arguments and
  existing non-English translations. Extend field-type distinction checks.
- Record Moroccan Tamazight catalog references and wider Amazigh vocabulary
  sources in the audit, including low-confidence technical compounds that need
  review.
- Ordinary untranslated values decrease from 47,630 to 47,619 across 70
  languages; 148 pending source keys and the broader semantic audit remain open.
- Validation: 23 focused tests and 21 human-preference checks pass. Existing
  browser coverage is syntax-checked; browser and spoken accessibility checks
  were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0f4a4545cf9869d502ea57f0244ed35950eef3e6">Translate Inuktitut field types.</a></summary>

- Fill 11 English placeholders while preserving source arguments and existing
  non-English translations. Extend field-type distinction checks.
- Record vocabulary sources and low-confidence angle, grid, pixel and
  programming terms in the translation audit; wording review remains necessary.
- Ordinary untranslated values decrease from 47,641 to 47,630 across 70
  languages; 148 pending source keys and the broader semantic audit remain open.
- Validation: 23 focused tests and 21 human-preference checks pass. Existing
  browser coverage is syntax-checked; browser and spoken accessibility checks
  were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f38e44d41ad6400acc59a264e2fe09118bcaa0ac">Translate Greenlandic field types.</a></summary>

- Fill 11 English placeholders while preserving source arguments and existing
  non-English translations. Extend field-type distinction checks.
- Record vocabulary references and low-confidence technical wording in the
  translation audit; grammatical and programming-specific review remains
  necessary.
- Ordinary untranslated values decrease from 47,652 to 47,641 across 70
  languages; 148 pending source keys and the broader semantic audit remain open.
- Validation: 23 focused tests and 21 human-preference checks pass. Existing
  browser coverage is syntax-checked; browser and spoken accessibility checks
  were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f3ab4a79cf69145d7d2231f5fbc3b2d5c6729b73">Translate Nahuatl field types.</a></summary>

- Fill 11 English placeholders while preserving source arguments and existing
  non-English translations. Extend field-type distinction checks.
- Record dictionary references and low-confidence technical paraphrases in the
  translation audit; these labels still need wording review.
- Ordinary untranslated values decrease from 47,663 to 47,652 across 70
  languages; 148 pending source keys and the broader semantic audit remain open.
- Validation: 23 focused tests and 21 human-preference checks pass. Existing
  browser coverage is syntax-checked; browser and spoken accessibility checks
  were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c7df9973e10de218b1ad48e1d504a183cb2337f5">Translate Ewe and Fulah field types.</a></summary>

- Fill 22 English placeholders while preserving source arguments and existing
  correct-language translations. Extend field-type distinction checks to both
  locales.
- Dictionary references and low-confidence technical wording are recorded in the
  translation audit.
- Ordinary untranslated values decrease from 47,685 to 47,663 across 70
  languages; 148 pending source keys and the broader semantic audit remain open.
- Validation: 23 focused tests and 21 human-preference checks pass. Existing
  browser coverage is syntax-checked; browser and spoken accessibility checks
  were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0cf084715f6a1dc9d304142440adacd9ca999dc4">Translate Volapük and Klingon field types.</a></summary>

- Fill 22 English placeholders and correct three foreign-language text/date
  controls. Preserve source arguments and existing correct-language
  translations.
- Extend field-type distinctions and correction regressions. Dictionary
  references and low-confidence technical paraphrases are recorded in the
  translation audit.
- Ordinary untranslated values decrease from 47,707 to 47,685 across 70
  languages; 148 pending source keys and the broader semantic audit remain open.
- Validation: 23 focused tests and 21 human-preference checks pass. Existing
  browser coverage is syntax-checked; browser and spoken accessibility checks
  were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6f02165e88d05d53d884ac63d317625d5d179135">Translate Akan, Bambara and Wolof field types.</a></summary>

- Fill 33 English placeholders and correct two Akan selector labels. Preserve
  source arguments and existing correct-language translations.
- Extend field-type distinctions and Akan correction regressions. Sources and
  low-confidence technical wording are documented in the translation audit.
- Ordinary untranslated values decrease from 47,740 to 47,707 across 70
  languages; 148 pending source keys and the broader semantic audit remain open.
- Validation: 22 focused tests and 21 human-preference checks pass. Existing
  browser coverage is syntax-checked; browser and spoken accessibility checks
  were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/92a60e35f01eac41d1cdab84f91ae5b6d9888c61">Translate Northern Sámi, Veps and Acehnese field types.</a></summary>

- Fill 33 English placeholders and correct two Malay-seeded Acehnese selectors.
  Preserve source arguments and existing correct-language translations.
- Extend field-type distinctions, Acehnese correction checks and Veps vocabulary
  regressions. Sources and low-confidence technical wording are documented in
  the translation audit.
- Ordinary untranslated values decrease from 47,773 to 47,740 across 70
  languages; 148 pending source keys and the broader semantic audit remain open.
- Validation: 21 focused tests and 21 human-preference checks pass. Existing
  browser coverage is syntax-checked; browser and spoken accessibility checks
  were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8d4d8c91dd2fb9dceac217cc04aab4705fbe08b8">Translate Tibetan, Dzongkha, Tigrinya and Kashmiri field types.</a></summary>

- Fill 44 English placeholders while preserving source arguments and existing
  correct-language translations. Extend image, selector and input/function-name
  distinction checks.
- Vocabulary references and provisional technical compounds are documented in
  the translation audit. Shared scripts alone do not establish correct-language
  wording.
- Ordinary untranslated values decrease from 47,817 to 47,773 across 70
  languages; 148 pending source keys and the broader semantic audit remain open.
- Validation: 20 focused tests and 21 human-preference checks pass. Existing
  browser coverage is syntax-checked; browser and spoken accessibility checks
  were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ea88c056a5d244d748c17126ccf7b08a1f938928">Translate Quechua, Aymara and Guarani field-type labels.</a></summary>

- Fill 33 English placeholders and correct four mixed-language selector labels
  while preserving source arguments and existing correct-language translations.
- Extend field-type distinctions and selector regressions. Vocabulary references
  and low-confidence technical phrasing are documented in the translation audit.
- Ordinary untranslated values decrease from 47,850 to 47,817 across 70
  languages; 148 pending source keys and the broader semantic audit remain open.
- Validation: 20 focused tests and 21 human-preference checks pass. Existing
  browser coverage is syntax-checked; browser and spoken accessibility checks
  were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6007aa45b2204e93463a81b5bc4b970aa18b7291">Translate Buryat, Chuvash and Sakha field-type labels.</a></summary>

- Fill 33 English placeholders while preserving source arguments and existing
  translations. Extend image, selector and input/function-name distinctions.
- Vocabulary sources and provisional technical compounds are documented in the
  translation audit; script checks do not establish fluency.
- Ordinary untranslated values decrease from 47,883 to 47,850 across 70
  languages; 148 pending source keys and the broader semantic audit remain open.
- Validation: 19 focused tests and 21 human-preference checks pass. Existing
  browser coverage is syntax-checked; browser and spoken accessibility checks
  were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cc1086bcf2558f28a77fa77cee58640a99235f0d">Translate Māori, Tongan and Hawaiian field-type labels.</a></summary>

- Fill 33 English placeholders and repair four selector labels, preserving
  source arguments and existing correct-language translations.
- Extend field-type distinctions and selector-label regressions. Vocabulary
  references and low-confidence technical phrases are documented in the
  translation audit.
- Ordinary untranslated values decrease from 47,916 to 47,883 across 70
  languages; 148 pending source keys and the broader semantic audit remain open.
- Validation: 19 focused tests and 21 human-preference checks pass. Existing
  browser coverage is syntax-checked; browser and spoken accessibility checks
  were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4282d46703c0ec3354c60e8965f70abdfa56f90a">Translate Pacific Blockly field-type labels.</a></summary>

- Fill 44 English placeholders in Bislama, Tok Pisin, Fijian and Samoan; correct
  four mixed-language selector labels. Preserve source arguments and
  correct-language translations.
- Extend field-type distinctions and selector-label regressions. Vocabulary
  references and low-confidence technical wording are documented in the
  translation audit.
- Ordinary untranslated values decrease from 47,960 to 47,916 across 70
  languages; 148 pending source keys and the broader semantic audit remain open.
- Validation: 18 focused tests and 21 human-preference checks pass. Existing
  browser coverage is syntax-checked; browser and spoken accessibility checks
  were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a1f34d5d40929c55aacaf9764db69db6325f2723">Translate field types in five further African languages.</a></summary>

- Fill 55 English placeholders in Kinyarwanda, Kirundi, Luganda, Oromo and
  Chichewa; correct two mixed-language Luganda control labels. Preserve source
  arguments and existing correct-language translations.
- Extend image, selector and input/function-name distinctions and Luganda
  semantic regressions. Terminology references and low-confidence wording are
  documented in the translation audit.
- Ordinary untranslated values decrease from 48,015 to 47,960 across 70
  languages; 148 pending source keys and the broader semantic audit remain open.
- Validation: 17 focused tests and 21 human-preference checks pass. Existing
  browser coverage is syntax-checked; browser and spoken accessibility checks
  were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/941aa9192920aa4b468d8456dd279aae53f1c27e">Translate Swati, Tsonga, Venda and Northern Ndebele field types.</a></summary>

- Fill 44 English placeholders and correct five wrong-language or filler labels
  in Venda and Tsonga. Preserve existing correct-language translations and
  source arguments.
- Extend field-type distinctions and semantic regression coverage. Dictionary
  references and low-confidence technical terminology are documented in the
  translation audit.
- Ordinary untranslated values decrease from 48,059 to 48,015 across 70
  languages; 148 pending source keys and the broader semantic audit remain open.
- Validation: 16 focused tests and 21 human-preference checks pass. Existing
  browser coverage is syntax-checked; browser and spoken accessibility checks
  were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/918a76c246b9444bbe48788d2bc769903745c7fd">Translate southern African Blockly field-type labels.</a></summary>

- Fill 66 English placeholders across Sesotho, Setswana, Sepedi, both Zulu
  locale paths and Xhosa. Preserve existing translations and exact source
  arguments.
- Extend image, selector and input/function-name regression distinctions.
  Dictionary references and provisional technical terminology are documented in
  the translation audit.
- Ordinary untranslated values decrease from 48,125 to 48,059 across 70
  languages; 148 pending source keys and the broader semantic audit remain open.
- Validation: 15 focused tests and 21 human-preference checks pass. Existing
  browser coverage is syntax-checked; browser and spoken accessibility checks
  were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5a416160e04d0182de6291a9da095b4a9c8e4bda">Translate Walloon, Venetian and Manx field-type labels.</a></summary>

- Fill 34 English placeholders and correct three wrong-language generic labels
  in the Walloon catalog. Preserve existing correct-language values and source
  arguments.
- Extend field-type distinctions and wrong-language regressions. Technical
  compounds remain provisional and are documented in the translation audit.
- Ordinary untranslated values decrease from 48,159 to 48,125 across 70
  languages; 148 pending source keys and the broader semantic audit remain open.
- Validation: 15 focused tests and 21 human-preference checks pass. Existing
  browser coverage is syntax-checked; browser and spoken accessibility checks
  were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d674ee1e7ff2bd087ed80461053f33b215e03622">Translate Blockly field-type labels in five more languages.</a></summary>

- Fill 55 English placeholders in Turkmen, Odia, Konkani, Papiamento and Wu
  Chinese, preserving source arguments and existing translations.
- Extend image, selector and input/function-name distinctions in the regression
  suite. Provisional technical terminology is documented in the translation
  audit.
- Ordinary untranslated values decrease from 48,214 to 48,159 across 70
  languages; 148 pending source keys and the broader language audit remain open.
- Validation: 14 focused tests and 21 human-preference checks pass. Existing
  browser field-editing coverage is syntax-checked; browser and spoken
  accessibility checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9eb2f5ebb8010bec399d3d24f0202483de272e48">Translate Blockly field-type labels in eight languages.</a></summary>

- Fill 88 placeholders in Kurmanji, Sorani, Tatar, Somali, Yiddish, Moroccan
  Arabic, Bhojpuri and Maithili. Preserve source arguments and existing
  translations.
- Add regression distinctions for image types, dropdown types and input/function
  names. Technical compounds remain provisional and are documented in the
  translation audit.
- Ordinary untranslated values decrease from 48,302 to 48,214 across 70
  languages; 148 pending source keys and the broader language audit remain open.
- Validation: 14 focused tests and 21 human-preference checks pass. Existing
  browser field-editing coverage is syntax-checked; browser and spoken
  accessibility checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1f4f00c8807477cf088a5924ec2c591a66686efb">Translate Inuktitut Blockly comment and accessibility labels.</a></summary>

- Fill fifteen English placeholders while preserving source arguments and
  existing translations. Extend opposite-action regressions and translated
  comment-menu assertions.
- Vocabulary references and low-confidence technical paraphrases are recorded in
  the translation audit. Full phrases, including conditional branches and input
  connections, still need semantic review.
- Ordinary untranslated values decrease from 48,317 to 48,302 across 70
  languages; 148 pending source keys and the broader language audit remain open.
- Validation: 13 focused tests and 21 human-preference checks pass. Browser
  coverage is syntax-checked; browser and spoken accessibility checks were not
  run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/22a15f2b10963074e18384414d16031b70306682">Translate Greenlandic Blockly comment and accessibility controls.</a></summary>

- Fill fifteen English placeholders while preserving source arguments and
  existing translations. Extend opposite-action regressions and translated
  comment-menu assertions.
- Record vocabulary sources and low-confidence technical paraphrases in the
  translation audit. Full wording and spoken angle-symbol output still need
  review.
- Ordinary untranslated values decrease from 48,332 to 48,317 across 70
  languages; 148 pending source keys and the broader semantic audit remain open.
- Validation: 13 focused tests and 21 human-preference checks pass. Browser
  coverage is syntax-checked; browser and spoken accessibility checks were not
  run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b983642a9f1c2df7dd869f55e77e4f404829a8de">Translate Standard Moroccan Tamazight Blockly accessibility labels.</a></summary>

- Fill 13 accessibility-label placeholders, preserving existing comment
  translations and source arguments. Extend opposing-action regressions and
  translated comment-menu assertions.
- Technical terminology and full phrases remain low confidence; vocabulary
  sources and specific uncertainties are recorded in the translation audit.
- Ordinary untranslated values decrease from 48,345 to 48,332 across 70
  languages; 148 pending source keys and the broader semantic audit remain open.
- Validation: 13 focused tests and 21 human-preference checks pass. Browser
  coverage is syntax-checked; browser and spoken accessibility checks were not
  run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4c0a5ecc5f57716e6e053920766dc980a774b5a0">Translate Wu Chinese and Nahuatl Blockly accessibility labels.</a></summary>

- Fill 30 comment and accessibility-label placeholders, preserving source
  arguments and existing translations. Extend opposing-action regressions and
  translated comment-menu assertions.
- Nahuatl technical phrasing remains low confidence; regional Wu wording and
  dictionary references are recorded in the translation audit.
- Ordinary untranslated values decrease from 48,375 to 48,345 across 70
  languages; 148 pending source keys and the broader semantic audit remain open.
- Validation: 13 focused tests and 21 human-preference checks pass. Browser
  coverage is syntax-checked; browser and spoken accessibility checks were not
  run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/87d6e1fc060eaa21de0dac578ca6a72ad6a8a53d">Translate Veps Blockly comment and accessibility controls.</a></summary>

- Fill fifteen Veps placeholders using vocabulary checked against Veps UI
  messages and dictionary entries. Preserve source arguments and existing
  translations.
- Extend opposing-action regressions and translated comment-menu browser
  coverage. Full wording, including the button adaptation and conditional/input
  paraphrases, remains low confidence and is documented in the translation
  audit.
- Ordinary untranslated values decrease from 48,390 to 48,375 across 70
  languages; 148 pending source keys and the broader semantic audit remain open.
- Validation: 13 focused tests and 21 human-preference checks pass. Browser
  coverage is syntax-checked; browser and spoken accessibility checks were not
  run.

Thanks to xet7 !

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.21 2026-10-07 WeKan ® release

**In short:** The **Snap** backup and restore commands now start the database
they need and say why it does not answer. All supported languages now have
**login-setting text** for HTTP-header authentication, stored-value removal and
restart guidance, and archiving and date-filter text. Minority-language wording
remains provisional and needs speaker review.

This release fixes the following bugs:

**Snap database tools** - backup, restore and WeKan's wait for its database.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fa75d59fd0">Backup and restore start the database first, and every wait says why it fails</a>. Thanks to fabiosalles and xet7.</summary>

`wekan.database-restore` and `wekan.database-backup` only talked to whatever
was on the database port. After `snap stop wekan` nothing is there. On a
FerretDB snap the database is a service of its own, so they failed after 30
seconds with a driver topology dump ([#6746](https://github.com/wekan/wekan/issues/6746)).
`bin/database-ready` asks `bin/database-role` which database holds the data,
starts that service and waits for it. If it still does not answer, it stops
with the driver's error and the `snap logs` command to run. A "permission
denied" is named as a security-policy denial on the server. WeKan's own wait
for FerretDB now shows the ping error too, and no longer suggests the removed
`database` setting. The backup path may contain spaces.
`tests/snapDatabaseRestore.test.cjs` runs both tools in a stand-in snap, with
negative tests for a database that never answers. Not run in an installed
snap.

</details>

and updates the following translations:

**Activity notifications** - choosing which card activity sends notifications.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/28b9ce74072a241db36a1029b3d9d1031c905cd4">Translate Blockly controls in Quechua, Aymara, Guarani, Volapük and Klingon.</a></summary>

- Fill 71 comment and accessibility-label placeholders, preserving four existing
  Guarani/Klingon values. Correct the generic Quechua, Volapük and Klingon text
  labels.
- Extend exact-placeholder and opposing-action regressions and translated
  comment-menu assertions. Vocabulary references and provisional technical
  wording are documented in the translation audit.
- Ordinary untranslated values decrease from 48,461 to 48,390 across 70
  languages; 148 pending source keys and the broader semantic audit remain open.
- Validation: 13 focused tests and 21 human-preference checks pass. Browser
  coverage is syntax-checked; browser and spoken accessibility checks were not
  run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2d695b240b4fdd2f91f31f1305cea92af4a60938">Translate Blockly accessibility labels from Buryat through Tigrinya.</a></summary>

- Fill 88 comment and accessibility-label placeholders in Buryat, Chuvash,
  Sakha, Tibetan, Dzongkha and Tigrinya, preserving two existing Tigrinya
  translations and all source arguments.
- Extend opposing-action regressions and translated comment-menu browser
  assertions. Vocabulary references and low-confidence conditional and input
  wording are documented in the translation audit.
- Ordinary untranslated values decrease from 48,549 to 48,461 across 70
  languages; 148 pending source keys and the broader semantic audit remain open.
- Validation: 13 focused tests and 21 human-preference checks pass. Browser
  coverage is syntax-checked; browser and spoken accessibility checks were not
  run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0d2e5bbb6ebe07a35d32cf10519313f830d874ff">Translate Blockly accessibility controls in six more locales.</a></summary>

- Fill 88 comment and accessibility-label placeholders in Akan, Bambara, Ewe,
  Wolof, Fula and Kashmiri. Preserve two existing Ewe translations and correct
  the generic Akan text label.
- Extend exact-placeholder and opposite-action regressions and translated
  comment-menu browser assertions. Low-confidence technical wording and
  vocabulary evidence are recorded in the translation audit.
- Ordinary untranslated values decrease from 48,637 to 48,549 across 70
  languages; 148 pending source keys and the broader semantic audit remain open.
- Validation: 13 focused tests and 21 human-preference checks pass. Browser
  coverage is syntax-checked; browser and spoken accessibility checks were not
  run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/30a40c8747182dde2b57ed8ddb671a49be91dac2">Translate Blockly accessibility labels in five more locales.</a></summary>

- Fill 75 comment and accessibility-label placeholders in Walloon, Waray,
  Acehnese, Northern Sámi and Venetian. Preserve existing Manx and Aromanian
  translations and extend regression coverage to all seven locales.
- Check exact source placeholders and opposing actions. Dictionary references
  and provisional technical wording are recorded in the translation audit,
  including the limited Sámi input-field paraphrase.
- Ordinary untranslated values decrease from 48,712 to 48,637 across 70
  languages; 148 pending source keys and the broader semantic audit remain open.
- Validation: 13 focused tests and 21 human-preference checks pass. Translated
  comment-menu browser coverage is syntax-checked; browser and spoken
  accessibility checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2dc46f81c027b0e425fc74d9a33d44b85b461b5b">Translate Blockly accessibility controls in nine more locales.</a></summary>

- Fill 135 comment and accessibility-label placeholders in Bislama, Tok Pisin,
  Fijian, Tongan, Hawaiian, Oromo, Kinyarwanda, Kirundi and Luganda. Correct the
  generic Tongan text label, which contained prefixed English.
- Preserve source arguments and existing translations, extend checks for
  opposing actions, and add translated comment-menu assertions. Vocabulary
  references and low-confidence technical wording are documented in the
  translation audit.
- Ordinary untranslated values decrease from 48,847 to 48,712 across 70
  languages; 148 pending source keys and the broader semantic audit remain open.
- Validation: 13 focused tests and 21 human-preference checks pass. Browser
  coverage is syntax-checked; browser and spoken accessibility checks were not
  run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a2b84d3afcb3c81bb1fdcdee6c9aeec62213877e">Translate Blockly accessibility labels for southern African locales.</a></summary>

- Fill 150 comment and accessibility-label placeholders across Sesotho,
  Setswana, Northern Sotho, both Zulu locales, Xhosa, Swati, Northern Ndebele,
  Tsonga and Venda. Preserve source arguments and existing translations.
- Extend opposing-action regressions and translated comment-menu browser
  assertions. Vocabulary references and low-confidence technical wording are
  recorded in the translation audit.
- Ordinary untranslated values decrease from 48,997 to 48,847 across 70
  languages; 148 pending source keys and the broader semantic audit remain open.
- Validation: 13 focused tests and 21 human-preference checks pass. Browser
  coverage is syntax-checked; browser and spoken accessibility checks were not
  run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f6d4f5f92043f642c59ffb14b1698c19d72b7b64">Translate Blockly accessibility controls in eight more languages.</a></summary>

- Fill 120 English placeholders for comment controls and accessibility labels in
  Turkmen, Yiddish, Bhojpuri, Maithili, Odia, Konkani, Papiamentu and Moroccan
  Arabic, preserving existing translations and source placeholders.
- Extend checks for opposing actions and the translated add-comment menu.
  Conditional-branch wording remains provisional; low-confidence phrases are
  documented in the translation audit.
- Ordinary untranslated values decrease from 49,117 to 48,997 across 70
  languages; 148 pending source keys and the broader semantic audit remain open.
- Validation: 13 focused tests and 21 human-preference checks pass. Browser
  coverage is syntax-checked; browser and spoken accessibility checks were not
  run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c9cc757aa19feaa3dbec3ddd597f1f091518495a">Translate Blockly accessibility controls in seven languages.</a></summary>

- Fill 104 English placeholders for comment controls and accessibility labels in
  Kurmanji, Central Kurdish, Tatar, Somali, Chichewa, Māori and Samoan. Preserve
  the existing Kurmanji comment translation and correct the generic Tatar text
  label.
- Check exact placeholders and opposing add/remove and collapse/expand labels.
  Technical wording marked low confidence is recorded in the translation audit.
- Ordinary untranslated values decrease from 49,221 to 49,117 across 70
  languages; 148 pending source keys and the broader language-quality audit
  remain open.
- Validation: 13 focused tests and 21 human-preference checks pass. Added
  translated comment-menu browser assertions and syntax-checked the suite;
  browser and spoken accessibility checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/361dab8b2b74bb1d48e1c64212d47afe3fa913c5">Translate Cherokee Blockly movement announcements.</a></summary>

- Fill twelve Cherokee movement and scrolling announcements. This group now has
  non-English values in all 234 non-English locales, with exact placeholders and
  distinct direction labels checked throughout.
- Cherokee full-sentence wording remains low confidence; vocabulary references
  and limitations are recorded in the translation audit.
- Ordinary untranslated values decrease from 49,233 to 49,221 across 70
  languages; 148 pending source keys still require wording review. The broader
  translation and semantic audit remain open.
- Validation: 12 focused tests and 21 human-preference checks pass. Cherokee
  browser coverage is registered and syntax-checked; Playwright and spoken
  screen-reader checks were not run.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/db6c28e86b7dc5ba0c852ae19262514d293a4732">Translate Tigre Blockly movement announcements.</a></summary>

- Filled twelve Tigre movement and scrolling announcements, preserving arguments
  and distinct directions. Technical clauses remain low confidence; spatial
  vocabulary references and grammatical uncertainties are recorded in the
  translation audit.
- All twelve focused Node tests and 21 human-preference checks pass. Extended
  localized editor browser coverage passes syntax validation; browser execution
  and actual screen-reader announcement behavior remain unverified because
  Playwright is unavailable locally.
- Ordinary untranslated values decrease from 49,245 to 49,233 across 70
  languages; 148 pending source keys still require wording review. The broader
  translation and semantic audit remain open.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/036e902d6bddd9384252656c1360a2c7961d5e98">Translate Greenlandic and Inuktitut Blockly announcements.</a></summary>

- Filled twelve movement and scrolling announcements in Greenlandic and
  Inuktitut (24 values), preserving arguments and distinct directions. Technical
  wording and case endings in both locales remain low confidence.
- All twelve focused Node tests and 21 human-preference checks pass. Extended
  localized editor browser coverage passes syntax validation; browser execution
  and actual screen-reader announcement behavior remain unverified because
  Playwright is unavailable locally.
- Ordinary untranslated values decrease from 49,269 to 49,245 across 70
  languages; 148 pending source keys still require wording review. The broader
  translation and semantic audit remain open.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/72b1f80e756ae5e311e05e2124567275ad79f92d">Translate Blockly announcements in four further locales.</a></summary>

- Filled twelve movement and scrolling announcements in Nahuatl, Wolaytta,
  Standard Moroccan Tamazight and Wu Chinese (48 values), preserving arguments
  and distinct directions. Nahuatl, Wolaytta and Tamazight technical wording
  remains low confidence.
- All twelve focused Node tests and 21 human-preference checks pass. Extended
  localized editor browser coverage passes syntax validation; browser execution
  and actual screen-reader announcement behavior remain unverified because
  Playwright is unavailable locally.
- Ordinary untranslated values decrease from 49,317 to 49,269 across 70
  languages; 148 pending source keys still require wording review. The broader
  translation and semantic audit remain open.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/26d74f05aa45b22179dcb8bd80268a5abfd2ebb9">Translate Blockly announcements in six more locales.</a></summary>

- Filled twelve movement and scrolling announcements in Quechua, Aymara,
  Guaraní, Veps, Volapük and Klingon (72 values), preserving arguments and
  distinct directions. Technical wording remains provisional, particularly
  Aymara, Veps, Volapük and Klingon.
- All twelve focused Node tests and 21 human-preference checks pass. Extended
  localized editor browser coverage passes syntax validation; browser execution
  and actual screen-reader announcement behavior remain unverified because
  Playwright is unavailable locally.
- Ordinary untranslated values decrease from 49,389 to 49,317 across 70
  languages; 148 pending source keys still require wording review. The broader
  translation and semantic audit remain open.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/25e8a1533764c33e9aa41c483be808f31f3beed9">Translate Blockly announcements in six Asian and African locales.</a></summary>

- Filled twelve movement and scrolling announcements in Buryat, Chuvash, Sakha,
  Tibetan, Dzongkha and Tigrinya (72 values), preserving arguments and distinct
  directions. Technical wording remains provisional, particularly Buryat,
  Chuvash, Sakha and Dzongkha.
- All twelve focused Node tests and 21 human-preference checks pass. Extended
  localized editor browser coverage passes syntax validation; browser execution
  and actual screen-reader announcement behavior remain unverified because
  Playwright is unavailable locally.
- Ordinary untranslated values decrease from 49,461 to 49,389 across 70
  languages; 148 pending source keys still require wording review. The broader
  translation and semantic audit remain open.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5f205bba2e1f4f2314be40725b013b5e85dea645">Translate Blockly announcements in six further locales.</a></summary>

- Filled twelve movement and scrolling announcements in Akan, Bambara, Ewe,
  Wolof, Fulah and Kashmiri (72 values), preserving arguments and distinct
  directions. Technical wording remains provisional, particularly Bambara, Ewe
  and Fulah.
- All twelve focused Node tests and 21 human-preference checks pass. Extended
  localized editor browser coverage passes syntax validation; browser execution
  and actual screen-reader announcement behavior remain unverified because
  Playwright is unavailable locally.
- Ordinary untranslated values decrease from 49,533 to 49,461 across 70
  languages; 148 pending source keys still require wording review. The broader
  translation and semantic audit remain open.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1879399ba2cfafbcb4d7cc06b02a70e7bee2e1ce">Translate Blockly announcements in five further locales.</a></summary>

- Filled twelve movement and scrolling announcements in Walloon, Waray,
  Acehnese, Northern Sámi and Venetian (60 values). Preserved existing Manx and
  Aromanian values and extended coverage to all seven locales. Technical wording
  remains provisional, particularly Walloon, Acehnese and Northern Sámi.
- All twelve focused Node tests and 21 human-preference checks pass. Extended
  localized editor browser coverage passes syntax validation; browser execution
  and actual screen-reader announcement behavior remain unverified because
  Playwright is unavailable locally.
- Ordinary untranslated values decrease from 49,593 to 49,533 across 70
  languages; 148 pending source keys still require wording review. The broader
  translation and semantic audit remain open.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7f4403c8e7af2c959168659b78f5e406d9ef7a6b">Translate Blockly announcements in nine Pacific and African locales.</a></summary>

- Filled twelve movement and scrolling announcements in Bislama, Tok Pisin,
  Fijian, Tongan, Hawaiian, Oromo, Kinyarwanda, Kirundi and Luganda (108
  values), preserving arguments and distinct directions. Technical wording
  remains provisional, particularly Tongan, Hawaiian and Luganda.
- All twelve focused Node tests and 21 human-preference checks pass. Extended
  localized editor browser coverage passes syntax validation; browser execution
  and actual screen-reader announcement behavior remain unverified because
  Playwright is unavailable locally.
- Ordinary untranslated values decrease from 49,701 to 49,593 across 70
  languages; 148 pending source keys still require wording review. The broader
  translation and semantic audit remain open.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3dd7baf95b7703a17eaa71a5836f660a8e639ab8">Translate Blockly announcements in southern African locales.</a></summary>

- Filled twelve movement and scrolling announcements in Sesotho, Setswana,
  Sepedi, Zulu (two locales), Xhosa, Swati, Northern Ndebele, Tsonga and Venda
  (120 values), preserving arguments and distinct directions. Technical wording
  remains provisional, particularly Swati, Northern Ndebele and Venda.
- All twelve focused Node tests and 21 human-preference checks pass. Extended
  localized editor browser coverage passes syntax validation; browser execution
  and actual screen-reader announcement behavior remain unverified because
  Playwright is unavailable locally.
- Ordinary untranslated values decrease from 49,821 to 49,701 across 70
  languages; 148 pending source keys still require wording review. The broader
  translation and semantic audit remain open.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e3cbe00a74ba0e6a688b564785f06f51a79330fb">Translate Blockly movement announcements in eight further locales.</a></summary>

- Filled twelve movement and scrolling announcements in Turkmen, Yiddish,
  Bhojpuri, Maithili, Odia, Konkani, Papiamento and Moroccan Arabic (96 values),
  preserving arguments and distinct directions. Maithili, Konkani and Papiamento
  technical wording remains provisional.
- All twelve focused Node tests and 21 human-preference checks pass. Extended
  localized editor browser coverage passes syntax validation; browser execution
  and actual screen-reader announcement behavior remain unverified because
  Playwright is unavailable locally.
- Ordinary untranslated values decrease from 49,917 to 49,821 across 70
  languages; 148 pending source keys still require wording review. The broader
  translation and semantic audit remain open.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c5bfa8121bd6f12995ab17bbe006c9d6f55f6de6">Translate Blockly movement announcements in seven locales.</a></summary>

- Filled twelve movement and scrolling announcements in Kurmanji, Sorani, Tatar,
  Somali, Chichewa, Māori and Samoan (84 values), preserving arguments and
  distinct directions. Chichewa and Samoan technical wording remains
  provisional.
- All twelve focused Node tests and 21 human-preference checks pass. Extended
  localized editor browser coverage passes syntax validation; browser execution
  and actual screen-reader announcement behavior remain unverified because
  Playwright is unavailable locally.
- Ordinary untranslated values decrease from 50,001 to 49,917 across 70
  languages; 148 pending source keys still require wording review. The broader
  translation and semantic audit remain open.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/23dd54615d25fbc97c4cad56c5e2744a4cb72155">Complete drag permission label placeholder coverage.</a></summary>

- Filled the final Cherokee placeholder with a provisional ability-to-pull
  phrase. The label now has non-English text in all 234 non-English locales.
  Cherokee grammar remains low-confidence and requires review.
- Both focused Node tests and 21 human-preference checks pass, including token
  checks across all non-English catalogs and positive/negative drag-policy
  assertions. Localized browser coverage passes syntax validation; execution
  remains unverified because Playwright is unavailable locally.
- Ordinary untranslated values decrease from 50,002 to 50,001 across 70
  languages; 148 pending source keys still require wording review. The broader
  translation and semantic audit remain open.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f8b31018e68242499e0f665894b5b28f818a2396">Translate drag permission label in six further locales.</a></summary>

- Filled the drag-permission column label in Nahuatl, Wolaytta, Standard
  Moroccan Tamazight, Greenlandic, Inuktitut and Tigre. All six remain
  low-confidence technical drafts. Cherokee still has the English label.
- Both focused Node tests and 21 human-preference checks pass, including
  positive and negative drag-policy assertions. Extended localized settings
  heading and disable/re-enable browser coverage passes syntax validation;
  execution remains unverified because Playwright is unavailable locally.
- Ordinary untranslated values decrease from 50,008 to 50,002 across 70
  languages; 148 pending source keys still require wording review. The broader
  translation and semantic audit remain open.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9a52f25da97d9f1cb9d01bf4a592d105c3f3f9d8">Translate drag permission label in twelve further locales.</a></summary>

- Filled the drag-permission column label in twelve locales. Technical wording
  remains provisional, particularly Chuvash, Veps, Volapük and Klingon.
- Both focused Node tests and 21 human-preference checks pass, including
  positive and negative drag-policy assertions. Extended localized settings
  heading and disable/re-enable browser coverage passes syntax validation;
  execution remains unverified because Playwright is unavailable locally.
- Ordinary untranslated values decrease from 50,020 to 50,008 across 70
  languages; 148 pending source keys still require wording review. The broader
  translation and semantic audit remain open.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/44fe1d4316e4042c1a4d8096efb3f9be487e2879">Translate drag permission label in thirteen further locales.</a></summary>

- Filled the drag-permission column label in thirteen locales. Technical wording
  remains provisional, particularly Aromanian, Fulah and Kashmiri; the Fulah
  vocabulary lookup was inconclusive.
- Both focused Node tests and 21 human-preference checks pass, including
  positive and negative drag-policy assertions. Extended localized settings
  heading and disable/re-enable browser coverage passes syntax validation;
  execution remains unverified because Playwright is unavailable locally.
- Ordinary untranslated values decrease from 50,033 to 50,020 across 70
  languages; 148 pending source keys still require wording review. The broader
  translation and semantic audit remain open.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d96d8a564feb77b590b44eff53ea91bf0040a636">Translate drag permission label in nineteen further locales.</a></summary>

- Filled the drag-permission column label in nineteen locales. Pronoun agreement
  and technical wording remain provisional, particularly Swati, Northern
  Ndebele, Venda, Fijian and Tongan.
- Both focused Node tests and 21 human-preference checks pass, including
  existing positive and negative drag-policy assertions. Extended localized
  settings heading and disable/re-enable browser coverage passes syntax
  validation; execution remains unverified because Playwright is unavailable
  locally.
- Ordinary untranslated values decrease from 50,052 to 50,033 across 70
  languages; 148 pending source keys still require wording review. The broader
  translation and semantic audit remain open.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/665d33e1410d4f1ce0e222faf8259a1231730ef9">Translate board drag permission label in fifteen locales.</a></summary>

- Filled the drag-permission column label in fifteen locales. Chichewa, Maithili
  and Konkani wording remains provisional.
- Both focused Node tests and 21 human-preference checks pass, including
  existing positive and negative drag-policy assertions. Extended localized
  settings heading and disable/re-enable browser coverage passes syntax
  validation; execution remains unverified because Playwright is unavailable
  locally.
- Ordinary untranslated values decrease from 50,067 to 50,052 across 70
  languages; 148 pending source keys still require wording review. The broader
  translation and semantic audit remain open.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e31679f46a194b9a245b0f0794e6320414f5860f">Complete duplicate relationship placeholder coverage.</a></summary>

- Filled both duplicate-card relationship directions in the final seven locales
  (14 values). Both labels now have non-English values in all 234 non-English
  locales. The final seven sets remain low-confidence drafts, especially
  Cherokee; semantic review remains open.
- All four focused Node tests and 21 human-preference checks pass, including
  token and distinct-label checks across all non-English locales. Extended
  localized editing and undo/redo browser coverage passes syntax validation;
  execution remains unverified because Playwright is unavailable locally.
- Ordinary untranslated values decrease from 50,081 to 50,067 across 70
  languages; 148 pending source keys still require wording review. The broader
  translation and semantic audit remain open.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/99bb6df956ac4e4726f8d2856a89f597f77b6a6b">Translate duplicate relationship labels in twelve further locales.</a></summary>

- Filled both duplicate-card relationship directions in twelve locales (24
  values). Technical wording remains provisional, particularly Chuvash, Veps,
  Volapük and Klingon.
- All four focused Node tests and 21 human-preference checks pass. Extended
  localized editing and undo/redo browser coverage; existing negative checks
  cover self-links and foreign-board links. Browser syntax passes, but execution
  remains unverified because Playwright is unavailable locally.
- Ordinary untranslated values decrease from 50,105 to 50,081 across 70
  languages; 148 pending source keys still require wording review. The broader
  translation and semantic audit remain open.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/37c941609f75061662915a7e95b1dd8dbf0b371c">Translate duplicate relationship labels in thirteen further locales.</a></summary>

- Filled both duplicate-card relationship directions in thirteen locales (26
  values). Technical wording remains provisional, particularly Manx, Aromanian,
  Fulah and Kashmiri; the Fulah vocabulary lookup was inconclusive.
- All four focused Node tests and 21 human-preference checks pass. Extended
  localized editing and undo/redo browser coverage; existing negative checks
  cover self-links and foreign-board links. Browser syntax passes, but execution
  remains unverified because Playwright is unavailable locally.
- Ordinary untranslated values decrease from 50,131 to 50,105 across 70
  languages; 148 pending source keys still require wording review. The broader
  translation and semantic audit remain open.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7e42efb2e5f3ab1419301d6d0e9d1dc0bfd91007">Translate duplicate relationship labels in nineteen further locales.</a></summary>

- Filled both duplicate-card relationship directions in nineteen locales (38
  values). Pronoun agreement and technical wording remain provisional,
  particularly Swati, Northern Ndebele, Venda, Fijian and Tongan.
- All four focused Node tests and 21 human-preference checks pass. Extended
  localized editing and undo/redo browser coverage; existing negative checks
  cover self-links and foreign-board links. Browser syntax passes, but execution
  remains unverified because Playwright is unavailable locally.
- Ordinary untranslated values decrease from 50,169 to 50,131 across 70
  languages; 148 pending source keys still require wording review. The broader
  translation and semantic audit remain open.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6cd38f6de04cbe436420800ffa3bf364c9f2eaac">Translate duplicate relationship labels in fifteen locales.</a></summary>

- Filled both duplicate-card relationship directions in fifteen locales (30
  values). Chichewa, Samoan and Konkani wording remains particularly
  provisional; semantic review remains open.
- All four focused Node tests and 21 human-preference checks pass. Extended
  localized editing and undo/redo browser coverage; existing negative checks
  cover self-links and foreign-board links. Browser syntax passes, but execution
  remains unverified because Playwright is unavailable locally.
- Ordinary untranslated values decrease from 50,199 to 50,169 across 70
  languages; 148 pending source keys still require wording review. The broader
  translation and semantic audit remain open.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8675861577ba7165857d5496fd70b2c82edc007a">Complete String Template hint placeholder coverage.</a></summary>

- Filled the variable and URL-encoding hint in Cherokee, Inuktitut and Tigre,
  completing non-English coverage in all 234 non-English locales. These final
  drafts remain low-confidence, especially Cherokee; wording review remains
  open.
- All 23 focused Node tests and 21 human-preference checks pass, including
  executable examples and token checks across every non-English locale.
  Localized positive and negative browser checks pass syntax validation;
  execution remains unverified because Playwright is unavailable locally.
- Ordinary untranslated values decrease from 50,202 to 50,199 across 70
  languages; 148 pending source keys still require wording review. The broader
  translation and semantic audit remain open.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b6d81e1fd96a41a1e5a51a5a112f104fbdf1d3a3">Translate String Template hints in four further locales.</a></summary>

- Filled the variable and URL-encoding hint in Nahuatl, Wolaytta, Standard
  Moroccan Tamazight and Greenlandic, and replaced English filler in the
  Wolaytta format label. All four sets remain low-confidence drafts requiring
  semantic review.
- All 23 focused Node tests and 21 human-preference checks pass. Extended
  localized positive and negative browser checks pass syntax validation;
  execution remains unverified because Playwright is unavailable locally.
- Ordinary untranslated values decrease from 50,206 to 50,202 across 70
  languages; 148 pending source keys still require wording review. The broader
  translation and semantic audit remain open.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/314e00355587e3e0101cbae33a2f3ee710606f3d">Translate String Template hints in six further locales.</a></summary>

- Filled the variable and URL-encoding hint in Quechua, Aymara, Guarani, Veps,
  Volapük and Klingon. All six sets remain low-confidence technical drafts
  requiring semantic review.
- All 23 focused Node tests and 21 human-preference checks pass. Extended
  localized positive and negative browser checks pass syntax validation;
  execution remains unverified because Playwright is unavailable locally.
- Ordinary untranslated values decrease from 50,212 to 50,206 across 70
  languages; 148 pending source keys still require wording review. The broader
  translation and semantic audit remain open.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/edef644ef7013e0b1d53ea59eaa3c4d6f60eaa8f">Translate String Template hints in twelve further locales.</a></summary>

- Filled the variable and URL-encoding hint in Akan, Bambara, Ewe, Wolof, Fulah,
  Kashmiri, Buryat, Chuvash, Sakha, Tibetan, Dzongkha and Tigrinya. These
  technical translations remain low-confidence drafts requiring semantic review.
- All 23 focused Node tests and 21 human-preference checks pass. Extended
  localized positive and negative browser checks pass syntax validation;
  execution remains unverified because Playwright is unavailable locally.
- Ordinary untranslated values decrease from 50,224 to 50,212 across 70
  languages; 148 pending source keys still require wording review. The broader
  translation and semantic audit remain open.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/75312bf9b40df9ba5173254de01d78507c25cd80">Translate seven further String Template hints.</a></summary>

- Filled the variable and URL-encoding hint in Walloon, Waray, Acehnese, Manx,
  Northern Sami, Venetian and Aromanian. Technical wording remains provisional,
  particularly Manx, Northern Sami and Aromanian.
- All 23 focused Node tests and 21 human-preference checks pass. Extended
  localized positive and negative browser checks pass syntax validation;
  execution remains unverified because Playwright is unavailable locally.
- Ordinary untranslated values decrease from 50,231 to 50,224 across 70
  languages; 148 pending source keys still require wording review. The broader
  translation and semantic audit remain open.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5338d4a8ebe39675e757b2a2e221b5b0dcd798bc">Translate String Template hints in nine further locales.</a></summary>

- Filled the variable and URL-encoding hint in Bislama, Tok Pisin, Fijian,
  Tongan, Hawaiian, Oromo, Kinyarwanda, Kirundi and Luganda. Technical wording
  remains provisional, especially in Fijian, Tongan and Hawaiian.
- All 23 focused Node tests and 21 human-preference checks pass. Extended
  localized positive and negative browser checks pass syntax validation;
  execution remains unverified because Playwright is unavailable locally.
- Ordinary untranslated values decrease from 50,240 to 50,231 across 70
  languages; 148 pending source keys still require wording review. The broader
  translation and semantic audit remain open.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/21396dc192c6e415fbbaef72ed7f3c78cc4b7d81">Translate String Template hints in eighteen further locales.</a></summary>

- Filled the variable and URL-encoding hint in eighteen locales and replaced
  generic filler in a Xitsonga format label. Technical wording remains
  provisional, particularly in Konkani, Swati, Northern Ndebele and Venda.
- All 23 focused Node tests and 21 human-preference checks pass. Extended
  localized positive and negative browser checks pass syntax validation; browser
  execution remains unverified because Playwright is unavailable locally.
- Ordinary untranslated values decrease from 50,258 to 50,240 across 70
  languages; 148 pending source keys still require wording review. The broader
  translation and semantic audit remain open.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d79b10f588e4b3f55bc5c5877414fd359a7fb3d2">Translate String Template hints in seven more locales.</a></summary>

- Filled the context-variable and URL-encoding hint in Kurmanji, Sorani, Tatar,
  Somali, Chichewa, Māori and Samoan, preserving executable examples. Chichewa
  and Samoan technical wording remains provisional.
- Corrected mixed-language Tatar format and separator labels, including a
  malformed HTML space entity.
- All 23 focused Node tests and 21 human-preference checks pass. Localized
  positive and negative browser checks pass syntax validation; browser execution
  remains unverified because Playwright is unavailable locally.
- Ordinary untranslated values decrease from 50,265 to 50,258 across 70
  languages; 148 pending source keys still require wording review. The broader
  translation and semantic audit remain open.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/de482cddc5d9ee6496bce22778ed872cdd41b0e9">Complete saved filter placeholder coverage</a></summary>

- Filled the final 30 English values in Cherokee, Inuktitut and Tigre. All ten
  saved-filter strings now have non-English values in all 234 non-English
  locales; the new technical clauses remain low-confidence drafts requiring
  semantic review.
- All 15 focused Node tests and 21 human-preference checks pass. Extended
  positive and negative browser filter coverage and checked its syntax;
  execution remains unverified because the local Playwright executable is
  unavailable.
- Ordinary untranslated values decrease from 50,295 to 50,265 across 70
  languages; 148 pending source keys still require wording review. The broader
  translation and semantic audit remain open.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/99ee5e0ddcb85a6a143e67bafd5b29e44fa5b251">Fill saved filter translations in four further locales</a></summary>

- Filled 40 English placeholders in Nahuatl, Wolaytta, Standard Moroccan
  Tamazight and Greenlandic. All four sets remain low-confidence technical
  drafts requiring semantic review.
- All 15 focused Node tests and 21 human-preference checks pass. Extended
  positive and negative browser filter coverage and checked its syntax;
  execution remains unverified because the local Playwright executable is
  unavailable.
- These ten filter strings remain English in Cherokee, Inuktitut and Tigre.
  Ordinary untranslated values decrease from 50,335 to 50,295 across 70
  languages; 148 pending source keys still require wording review.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5791adc9f5d1a211f027f95bca4d2670577850e2">Fill six further saved filter translations</a></summary>

- Filled 60 English placeholders in Quechua, Aymara, Guarani, Veps, Volapük and
  Klingon. All six sets remain low-confidence technical drafts, particularly
  Veps, Volapük and Klingon.
- All 15 focused Node tests and 21 human-preference checks pass. Extended
  positive and negative browser filter coverage and checked its syntax;
  execution remains unverified because the local Playwright executable is
  unavailable.
- These ten filter strings remain English in seven locales. Ordinary
  untranslated values decrease from 50,395 to 50,335 across 70 languages; 148
  pending source keys still require wording review.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e46f22e4e38317cb85586afda6ae4d8b4f192d7c">Translate saved filter controls in six more locales</a></summary>

- Filled 60 English placeholders in Buryat, Chuvash, Sakha, Tibetan, Dzongkha
  and Tigrinya. Technical clauses remain provisional, especially Buryat, Chuvash
  and Dzongkha.
- All 15 focused Node tests and 21 human-preference checks pass. Extended
  positive and negative browser filter coverage and checked its syntax;
  execution remains unverified because the local Playwright executable is
  unavailable.
- These ten filter strings remain English in 13 locales. Ordinary untranslated
  values decrease from 50,455 to 50,395 across 70 languages; 148 pending source
  keys still require wording review.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/af96f4e963869a120324e36ad5440685acf5b66a">Translate saved filter controls in six further locales</a></summary>

- Filled 60 English placeholders in Akan, Bambara, Ewe, Wolof, Fulah and
  Kashmiri. Technical clauses remain provisional, especially Ewe, Fulah and
  Kashmiri.
- All 15 focused Node tests and 21 human-preference checks pass. Extended
  positive and negative browser filter coverage and checked its syntax;
  execution remains unverified because the local Playwright executable is
  unavailable.
- These ten filter strings remain English in 19 locales. Ordinary untranslated
  values decrease from 50,515 to 50,455 across 70 languages; 148 pending source
  keys still require wording review.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9dad4b31bc37a0afaaf977bf12135fb439fe671e">Translate saved filter controls in seven further locales</a></summary>

- Filled 70 English placeholders in Walloon, Waray, Acehnese, Manx, Northern
  Sami, Venetian and Aromanian, and corrected wrong-language Waray and Acehnese
  filter labels. Technical clauses remain provisional, especially Waray,
  Acehnese, Manx and Aromanian.
- All 15 focused Node tests and 21 human-preference checks pass. Extended
  positive and negative browser filter coverage and checked its syntax;
  execution remains unverified because the local Playwright executable is
  unavailable.
- These ten filter strings remain English in 25 locales. Ordinary untranslated
  values decrease from 50,585 to 50,515 across 70 languages; 148 pending source
  keys still require wording review.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7015e111ee99ddd7800379a4b48ab9629ad2caef">Translate saved filter controls in nine further locales</a></summary>

- Filled 90 English placeholders in Bislama, Tok Pisin, Fijian, Tongan,
  Hawaiian, Oromo, Kinyarwanda, Kirundi and Luganda. Technical clauses remain
  provisional, especially Fijian, Tongan, Hawaiian and Kirundi.
- All 15 focused Node tests and 21 human-preference checks pass. Extended
  positive and negative browser filter coverage and checked its syntax;
  execution remains unverified because the local Playwright executable is
  unavailable.
- These ten filter strings remain English in 32 locales. Ordinary untranslated
  values decrease from 50,675 to 50,585 across 70 languages; 148 pending source
  keys still require wording review.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a60e55e3a5c20df77e9a9ec4eb6656c708c74769">Translate saved filter controls in ten African locale files</a></summary>

- Filled 100 English placeholders in Southern Sotho, Tswana, Northern Sotho,
  both Zulu locales, Xhosa, Swati, Northern Ndebele, Tsonga and Venda. Technical
  clauses remain provisional, especially Swati, Northern Ndebele, Tsonga and
  Venda.
- All 15 focused Node tests and 21 human-preference checks pass. Extended
  positive and negative browser filter coverage and checked its syntax;
  execution remains unverified because the local Playwright executable is
  unavailable.
- These ten filter strings remain English in 41 locales. Ordinary untranslated
  values decrease from 50,775 to 50,675 across 70 languages; 148 pending source
  keys still require wording review.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4ef7469ce5c6a5d6e7c523997a9a346a947bc43d">Translate saved filter controls in eight further locales</a></summary>

- Filled 80 English placeholders in Turkmen, Yiddish, Bhojpuri, Maithili, Odia,
  Konkani, Papiamentu and Moroccan Arabic. Technical clauses remain provisional,
  especially Konkani and Papiamentu.
- All 15 focused Node tests and 21 human-preference checks pass. Extended
  positive and negative browser filter coverage and checked its syntax;
  execution remains unverified because the local Playwright executable is
  unavailable.
- These ten filter strings remain English in 51 locales. Ordinary untranslated
  values decrease from 50,855 to 50,775 across 70 languages; 148 pending source
  keys still require wording review.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/78ca2530a24c44236c88f963818515711bf921eb">Translate saved filter controls in seven locales</a></summary>

- Filled 70 English placeholders in Kurmanji, Sorani, Tatar, Somali, Chichewa,
  Māori and Samoan, and corrected mixed-language Tatar filter-menu wording.
  Technical clauses remain provisional, especially Chichewa and Samoan.
- All 15 focused Node tests and 21 human-preference checks pass. Extended
  positive and negative browser filter coverage and checked its syntax;
  execution remains unverified because the local Playwright executable is
  unavailable.
- These ten filter strings remain English in 59 locales. Ordinary untranslated
  values decrease from 50,925 to 50,855 across 70 languages; 148 pending source
  keys still require wording review.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/30ccbcfe8e7cc0f118662c8a731d87257bebe17f">Complete rule email report placeholder coverage</a></summary>

- Filled the final 30 English values in Cherokee, Inuktitut and Tigre. All ten
  report strings now have non-English values in all 234 non-English locales; the
  new technical clauses remain low-confidence drafts requiring semantic review.
- All 17 focused Node tests and 21 human-preference checks pass. Extended
  browser report coverage and checked its syntax; browser execution remains
  unverified because the local Playwright executable is unavailable.
- Ordinary untranslated values decrease from 50,955 to 50,925 across 70
  languages; 148 pending source keys still require wording review. The broader
  translation and semantic audit remain open.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/33f35c657c94855b229c695ae548da96dcd8f32f">Translate rule email reports in Nahuatl, Wolaytta and Tamazight</a></summary>

- Filled 30 English placeholders. All three sets remain low-confidence technical
  drafts requiring semantic review.
- All 17 focused Node tests and 21 human-preference checks pass. Extended
  browser report coverage and checked its syntax; browser execution remains
  unverified because the local Playwright executable is unavailable.
- These ten report strings remain English in Cherokee, Inuktitut and Tigre.
  Ordinary untranslated values decrease from 50,985 to 50,955 across 70
  languages; 148 pending source keys still require wording review.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6800674da741c8927568fdc334e14f1d12982ca0">Fill six further rule email report translations</a></summary>

- Filled 60 English placeholders in Quechua, Aymara, Guarani, Veps, Volapük and
  Klingon. All six sets remain low-confidence technical drafts, particularly
  Veps, Volapük and Klingon.
- All 17 focused Node tests and 21 human-preference checks pass. Extended
  browser report coverage and checked its syntax; execution remains unverified
  because the local Playwright executable is unavailable.
- These ten report strings remain English in six locales. Ordinary untranslated
  values decrease from 51,045 to 50,985 across 70 languages; 148 pending source
  keys still require wording review.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bf44a8bcdf4b7efe5d9cbb5aa8236d410cb32056">Translate rule email reports in six more locales</a></summary>

- Filled 60 English placeholders in Buryat, Chuvash, Sakha, Tibetan, Dzongkha
  and Tigrinya. Technical clauses remain provisional, especially Buryat, Chuvash
  and Dzongkha.
- All 17 focused Node tests and 21 human-preference checks pass. Extended
  browser report coverage and checked its syntax; execution remains unverified
  because the local Playwright executable is unavailable.
- These ten report strings remain English in 12 locales. Ordinary untranslated
  values decrease from 51,105 to 51,045 across 70 languages; 148 pending source
  keys still require wording review.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f561ee6ca6565a54977a7b2031fecff52910621b">Translate rule email reports in six further locales</a></summary>

- Filled 60 English placeholders in Akan, Bambara, Ewe, Wolof, Fulah and
  Kashmiri. Technical clauses remain provisional, especially Ewe, Fulah and
  Kashmiri.
- All 17 focused Node tests and 21 human-preference checks pass. Extended
  browser report coverage and checked its syntax; execution remains unverified
  because the local Playwright executable is unavailable.
- These ten report strings remain English in 18 locales. Ordinary untranslated
  values decrease from 51,165 to 51,105 across 70 languages; 148 pending source
  keys still require wording review.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7535a1c0dc45246f38f61f7508a6cd80d51ad6bd">Translate rule email reports in seven further locales</a></summary>

- Filled 70 English placeholders in Walloon, Waray, Acehnese, Manx, Northern
  Sami, Venetian and Aromanian. Technical clauses remain provisional, especially
  Acehnese, Manx and Aromanian.
- All 17 focused Node tests and 21 human-preference checks pass. Extended
  browser report coverage and checked its syntax; execution remains unverified
  because the local Playwright executable is unavailable.
- These ten report strings remain English in 24 locales. Ordinary untranslated
  values decrease from 51,235 to 51,165 across 70 languages; 148 pending source
  keys still require wording review.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/04c10bc9e65d4338d4966f2219ae230668f0bb7d">Translate rule email reports in nine further locales</a></summary>

- Filled 90 English placeholders in Bislama, Tok Pisin, Fijian, Tongan,
  Hawaiian, Oromo, Kinyarwanda, Kirundi and Luganda. Technical clauses remain
  provisional, particularly Fijian, Tongan, Hawaiian and Kirundi.
- All 17 focused Node tests and 21 human-preference checks pass. Extended
  browser report coverage and checked its syntax; browser execution remains
  unverified because the local Playwright executable is unavailable.
- These ten report strings remain English in 31 locales. Ordinary untranslated
  values decrease from 51,325 to 51,235 across 70 languages; 148 pending source
  keys still require wording review.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/39f31def59fc907d5fdb0edd40d1ef5eda1cd272">Translate rule email reports in ten African locale files</a></summary>

- Filled 100 English placeholders in Southern Sotho, Tswana, Northern Sotho,
  both Zulu locales, Xhosa, Swati, Northern Ndebele, Tsonga and Venda. Technical
  clauses remain provisional, especially Swati, Northern Ndebele, Tsonga and
  Venda.
- All 17 focused Node tests and 21 human-preference checks pass. Extended
  browser report coverage and checked its syntax; execution remains unverified
  because the local Playwright executable is unavailable.
- These ten report strings remain English in 40 locales. Ordinary untranslated
  values decrease from 51,425 to 51,325 across 70 languages; 148 pending source
  keys still require wording review.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5d803eda6d899b17411b4551eeb9fc44f737d68b">Translate rule email reports in eight further locales</a></summary>

- Filled 80 English placeholders in Turkmen, Yiddish, Bhojpuri, Maithili, Odia,
  Konkani, Papiamentu and Moroccan Arabic. Technical clauses remain provisional,
  especially Konkani and Papiamentu.
- All 17 focused Node tests and 21 human-preference checks pass. Extended
  browser report coverage and checked its syntax; browser execution remains
  unverified because the local Playwright executable is unavailable.
- These ten report strings remain English in 50 locales. Ordinary untranslated
  values decrease from 51,505 to 51,425 across 70 languages; 148 pending source
  keys still require wording review.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6f663811a02b91e12ee43e150f9b8ef64241d3ed">Translate rule email reports in seven more locales</a></summary>

- Filled 70 English placeholders in Kurmanji, Sorani, Tatar, Somali, Chichewa,
  Māori and Samoan. Technical clauses remain provisional, particularly Chichewa
  and Samoan.
- All 17 focused Node tests and 21 human-preference checks pass. Extended
  browser report coverage and checked its syntax; execution remains unverified
  because the local Playwright executable is unavailable.
- These ten report strings remain English in 58 locales. Ordinary untranslated
  values decrease from 51,575 to 51,505 across 70 languages; 148 pending source
  keys still require wording review.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0777dd3ba7eed2687c6581a1bd6882b2ade35cf4">Complete rule variable picker placeholder coverage</a></summary>

- Filled the final twelve English labels. All 234 non-English locales now have a
  translated label; the twelve new drafts remain low confidence and semantic
  review remains open.
- All 13 focused Node tests and 21 human-preference checks pass. Browser syntax
  passes, but browser execution remains unverified.
- Removed the picker label from the pending queue: 149 to 148 source keys. The
  freshly checked broader backlog remains 51,575 ordinary untranslated values
  across 70 languages.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5da7829eb150f64b2b169c6d213562db8aed60a2">Fill ten further rule variable picker translations</a></summary>

- Filled ten English labels. Full clauses remain provisional, especially
  Bambara, Ewe, Aymara, Guarani, Manx and Aromanian.
- Extended locale and browser coverage. All 13 focused Node tests and 21
  human-preference checks pass; browser syntax passes, but browser execution
  remains unverified.
- This label remains untranslated in twelve locales. The broader backlog remains
  51,575 ordinary untranslated values across 70 languages plus 149 pending
  source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2ab05383f473073528df0b54d4807ddb67965e58">Translate ten more rule variable picker labels</a></summary>

- Filled ten English labels. Full clauses remain provisional, especially
  Dzongkha, Buryat, Chuvash, Sakha and Acehnese.
- Extended locale and browser coverage. All 13 focused Node tests and 21
  human-preference checks pass; browser syntax passes, but browser execution
  remains unverified.
- This label remains untranslated in 22 locales. The broader backlog remains
  51,575 ordinary untranslated values across 70 languages plus 149 pending
  source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/84fc9203ddc0b589bb48d29e9549037eb4653f9f">Translate seventeen more rule variable picker labels</a></summary>

- Filled seventeen English labels in African and Pacific locales. Technical
  paraphrases remain provisional, especially Northern Sotho, Tsonga, Venda,
  Fijian, Tongan, Hawaiian and Kirundi.
- Extended locale and browser coverage. All 13 focused Node tests and 21
  human-preference checks pass; browser syntax passes, but browser execution
  remains unverified.
- This label remains untranslated in 32 locales. The broader backlog remains
  51,575 ordinary untranslated values across 70 languages plus 149 pending
  source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/af5ba32503ea2a35e82a0a69285c28ee22a46b0b">Translate the rule variable picker label in seventeen locales</a></summary>

- Filled seventeen English labels, describing insertion into the text field most
  recently selected. Technical phrasing remains provisional, especially Konkani,
  Southern Sotho, Tswana, Chichewa and Samoan.
- Extended locale and browser coverage. All 13 focused Node tests and 21
  human-preference checks pass; browser syntax passes, but browser execution
  remains unverified.
- This label remains untranslated in 49 locales. The broader backlog remains
  51,575 ordinary untranslated values across 70 languages plus 149 pending
  source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9afc5bf221138091c8ec718d8a898dd05725787b">Fill the Cherokee Leo instruction and cover all locales</a></summary>

- Filled the final English Leo instruction placeholder. All 234 non-English
  locales now have a value; the Cherokee draft remains very low-confidence and
  linguistic review stays open.
- Added all-locale regression coverage and extended the browser import scenario.
  All 12 focused Node tests and 21 human-preference checks pass; browser syntax
  passes, but browser execution remains unverified.
- Removed the Leo instruction from the pending queue: 150 to 149 source keys.
  The broader backlog remains 51,575 ordinary untranslated values across 70
  languages.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/598893c70b7402fd96597ece006ce6be1d31f1a1">Add Tigre and Wolaytta Leo import instructions</a></summary>

- Filled two English instructions. Both full translations remain very
  low-confidence drafts requiring linguistic review.
- Extended locale and browser coverage. All 12 focused Node tests and 21
  human-preference checks pass; browser syntax passes, but browser execution
  remains unverified.
- Cherokee still uses the English Leo instruction. The broader backlog remains
  51,575 ordinary untranslated values across 70 languages plus 150 pending
  source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/09429dcfed399dde73c2226b94c8bdaa97473fc5">Add Nahuatl and Tamazight Leo import instructions</a></summary>

- Filled two English instructions. Both full translations remain low-confidence
  drafts requiring linguistic review.
- Extended locale, script and browser coverage. All 12 focused Node tests and 21
  human-preference checks pass; browser syntax passes, but browser execution
  remains unverified.
- The Leo instruction remains untranslated in Cherokee, Tigre and Wolaytta. The
  broader backlog remains 51,575 ordinary untranslated values across 70
  languages plus 150 pending source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/48d3e716484edffde1fa4abbefda10b68f986a8b">Add Greenlandic and Inuktitut Leo import instructions</a></summary>

- Filled two English instructions. Both full translations remain low-confidence
  drafts requiring linguistic review.
- Extended locale and browser coverage. All 12 focused Node tests and 21
  human-preference checks pass; browser syntax passes, but browser execution
  remains unverified.
- The Leo instruction remains untranslated in five locales. The broader backlog
  remains 51,575 ordinary untranslated values across 70 languages plus 150
  pending source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fc9749b1139373c2e0fc199936cd80a09b165bb1">Translate five more Leo import instructions</a></summary>

- Filled five English instructions in Kashmiri, Fulah, Veps, Volapük and
  Klingon. All five complete instructions remain low-confidence drafts requiring
  linguistic review.
- Extended locale and browser coverage. All 12 focused Node tests and 21
  human-preference checks pass; browser syntax passes, but browser execution
  remains unverified.
- The Leo instruction remains untranslated in seven locales. The broader backlog
  remains 51,575 ordinary untranslated values across 70 languages plus 150
  pending source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e56723274be1c37cf9160330269fec3b4b58e04f">Translate six more Leo import instructions</a></summary>

- Filled six English instructions in Tibetan, Dzongkha, Tigrinya, Quechua,
  Aymara and Guarani. Technical clauses remain provisional, particularly
  Dzongkha, Quechua, Aymara and Guarani.
- Extended locale and browser coverage. All 12 focused Node tests and 21
  human-preference checks pass; browser syntax passes, but browser execution
  remains unverified.
- The Leo instruction remains untranslated in 12 locales. The broader backlog
  remains 51,575 ordinary untranslated values across 70 languages plus 150
  pending source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ebb12f9537c3dee6207737c701ae73f3b3914a86">Translate seven more Leo import instructions</a></summary>

- Filled seven English instructions in Akan, Bambara, Ewe, Wolof, Buryat,
  Chuvash and Sakha. Full clauses remain provisional, particularly the hierarchy
  terminology.
- Extended locale and browser coverage. All 12 focused Node tests and 21
  human-preference checks pass; browser syntax passes, but browser execution
  remains unverified.
- The Leo instruction remains untranslated in 18 locales. The broader backlog
  remains 51,575 ordinary untranslated values across 70 languages plus 150
  pending source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5afa11bde01dc38d4764117011861802f3388342">Translate eight Leo instructions and correct the Darija completion label</a></summary>

- Filled eight English instructions and replaced a Persian completion label in
  Moroccan Arabic with Darija. Technical phrasing remains provisional,
  especially Acehnese, Manx, Northern Sami and Aromanian.
- Extended locale and browser coverage. All 12 focused Node tests and 21
  human-preference checks pass; browser syntax passes, but browser execution
  remains unverified.
- The Leo instruction remains untranslated in 25 locales. The broader backlog
  remains 51,575 ordinary untranslated values across 70 languages plus 150
  pending source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a0874a292d88f092ec742e814615e6963b815164">Translate Leo import instructions in twelve more locales</a></summary>

- Filled twelve English placeholders in Pacific, Papiamento and eastern African
  locales. Technical phrasing remains provisional, especially Fijian, Tongan,
  Hawaiian, Oromo and Kirundi.
- Extended locale and browser coverage. All 12 focused Node tests and 21
  human-preference checks pass; browser syntax passes, but browser execution
  remains unverified.
- This instruction remains untranslated in 33 locales. The broader backlog
  remains 51,575 ordinary untranslated values across 70 languages plus 150
  pending source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3e174595ba4e0d1c593f6406e0b10d946a4515f2">Translate Leo import instructions in fourteen more locales</a></summary>

- Filled fourteen English placeholders in four Indic and ten southern African
  locales. Technical phrasing remains provisional, especially Konkani, Swati,
  Northern Ndebele and Venda.
- Extended locale and browser coverage. All 12 focused Node tests and 21
  human-preference checks pass; browser syntax passes, but browser execution
  remains unverified.
- This instruction remains untranslated in 45 locales. The broader backlog
  remains 51,575 ordinary untranslated values across 70 languages plus 150
  pending source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8a2a7dbd0dbb3fff600e78601d90be7af0f2d1f6">Translate Leo import instructions in seven more locales</a></summary>

- Filled seven English placeholders in Kurdish, Central Kurdish, Tatar, Turkmen,
  Yiddish, Somali and Chichewa. Technical phrasing, especially Somali and
  Chichewa, remains provisional.
- Extended locale and browser coverage. All 12 focused Node tests and 21
  human-preference checks pass; browser syntax passes, but browser execution
  remains unverified.
- This instruction remains untranslated in 59 locales. The broader backlog
  remains 51,575 ordinary untranslated values across 70 languages plus 150
  pending source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d19b35b6f9451e0dfe7596ba7cfe3074dd0e4851">Fill remaining parent-card controls and verify all-locale coverage</a></summary>

- Filled six Tigre and Wolaytta placeholders. All three parent-card controls now
  have non-English values in all 234 non-English locales; low-confidence wording
  and further language review remain documented in the translation audit.
- Expanded regression coverage to all locales and added both languages to the
  browser scenario. All 12 focused tests and 21 human-preference checks pass;
  browser syntax passes, but browser execution remains unverified.
- Removed three keys from the pending inventory, reducing it to 150. The fresh
  ordinary backlog count remains 51,575 untranslated values across 70 languages.
  Structural coverage does not establish fluency.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a129d9709e6dd4e934083ec6563898f55a1effc0">Translate parent-card controls into Cherokee</a></summary>

- Filled three placeholders. Low-confidence phrasing, the larger-task paraphrase
  and grammar limitations are documented in the translation audit.
- Extended locale and browser coverage. All 12 focused tests and 21
  human-preference checks pass; browser syntax passes, but browser execution
  remains unverified.
- These controls remain English in two locale paths. The broader backlog remains
  51,575 ordinary untranslated values across 70 languages plus 153 pending
  source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3c79e6d538e95b1cd9842eac8913cf8332c67a56">Translate parent-card controls into Nahuatl and Moroccan Tamazight</a></summary>

- Filled six placeholders. Low-confidence phrases, parent-card metaphors and
  vocabulary references are documented in the translation audit.
- Extended locale and browser coverage. All 12 focused tests and 21
  human-preference checks pass; browser syntax passes, but browser execution
  remains unverified.
- These controls remain English in three locale paths. The broader backlog
  remains 51,575 ordinary untranslated values across 70 languages plus 153
  pending source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/73030eb1c5d36b61dcc9aaf8e89e0bdc60c9bd0d">Translate parent-card controls into Fulah and Veps</a></summary>

- Filled six placeholders. Low-confidence wording, agreement and terminology
  limitations are recorded in the translation audit.
- Extended locale and browser coverage. All 12 focused tests and 21
  human-preference checks pass; browser syntax passes, but browser execution
  remains unverified.
- These controls remain English in five locale paths. The broader backlog
  remains 51,575 ordinary untranslated values across 70 languages plus 153
  pending source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4e372a695f76b4d0fe1fcd49008fd2d8a746681c">Translate parent-card controls into Klingon and Volapuk</a></summary>

- Filled six placeholders. Provisional parent-card metaphors and vocabulary
  limitations are documented in the translation audit.
- Extended locale and browser coverage. All 12 focused tests and 21
  human-preference checks pass; browser syntax passes, but browser execution
  remains unverified.
- These controls remain English in seven locale paths. The broader backlog
  remains 51,575 ordinary untranslated values across 70 languages plus 153
  pending source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6005d0ab612f1f4129e726f6eec22e32ba87fb6b">Translate parent-card controls into Inuktitut and Greenlandic</a></summary>

- Filled six placeholders. Low-confidence technical phrasing and inflections are
  documented with vocabulary references in the translation audit.
- Extended locale and browser coverage. All 12 focused tests and 21
  human-preference checks pass; browser syntax passes, but browser execution
  remains unverified.
- These controls remain English in nine locale paths. The broader backlog
  remains 51,575 ordinary untranslated values across 70 languages plus 153
  pending source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/333561b9ea8080f0865105bd858cf54bed47bdad">Translate parent-card controls in five more locales</a></summary>

- Filled 15 placeholders in Moroccan Arabic, Manx, Venetian, Aromanian and
  Northern Sami. Low-confidence terminology and reference limitations are
  documented in the translation audit.
- Extended locale and browser coverage. All 12 focused tests and 21
  human-preference checks pass; browser syntax passes, but browser execution
  remains unverified.
- These controls remain English in 11 locale paths. The broader backlog remains
  51,575 ordinary untranslated values across 70 languages plus 153 pending
  source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/89b4a553337a160989f87849d8f355f7428e0255">Translate parent-card controls into Quechua, Aymara and Guarani</a></summary>

- Filled nine placeholders. Provisional technical wording, variety consistency
  and vocabulary references are recorded in the translation audit.
- Extended locale and browser coverage. All 12 focused tests and 21
  human-preference checks pass; browser syntax passes, but browser execution
  remains unverified.
- These controls remain English in 16 locale paths. The broader backlog remains
  51,575 ordinary untranslated values across 70 languages plus 153 pending
  source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/813c9baa255e19819b56be998c21534085171ef9">Translate parent-card controls into Tibetan, Dzongkha and Tigrinya</a></summary>

- Filled nine placeholders. Provisional technical wording and vocabulary
  limitations are recorded in the translation audit.
- Extended locale and browser coverage. All 12 focused tests and 21
  human-preference checks pass; browser syntax passes, but browser execution
  remains unverified.
- These controls remain English in 19 locale paths. The broader backlog remains
  51,575 ordinary untranslated values across 70 languages plus 153 pending
  source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/00011c073c933f2b4c25151b89b23f8e46907bbb">Translate parent-card controls into Buryat, Chuvash and Sakha</a></summary>

- Filled nine placeholders. Provisional technical terminology, inflections and
  vocabulary references are recorded in the translation audit.
- Extended locale and browser coverage. All 12 focused tests and 21
  human-preference checks pass; browser syntax passes, but browser execution
  remains unverified.
- These controls remain English in 22 locale paths. The broader backlog remains
  51,575 ordinary untranslated values across 70 languages plus 153 pending
  source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/69598b56d899d356fdea248dc516c60a8b20e755">Translate parent-card controls in four more locales</a></summary>

- Filled 12 placeholders in Papiamento, Walloon, Waray and Acehnese.
  Low-confidence technical wording and terminology limitations are recorded in
  the translation audit.
- Extended locale and browser coverage. All 12 focused tests and 21
  human-preference checks pass; browser syntax passes, but browser execution
  remains unverified.
- These controls remain English in 25 locale paths. The broader backlog remains
  51,575 ordinary untranslated values across 70 languages plus 153 pending
  source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b6a25535cd37dc87d869f10fc7fc95fa9f3dd639">Translate parent-card controls in eight more African locales</a></summary>

- Filled 24 placeholders in Oromo, Kinyarwanda, Kirundi, Luganda, Wolof, Akan,
  Ewe and Bambara. Provisional software terminology and vocabulary references
  are recorded in the translation audit.
- Extended locale and browser coverage. All 12 focused tests and 21
  human-preference checks pass; browser syntax passes, but browser execution
  remains unverified.
- These controls remain English in 29 locale paths. The broader backlog remains
  51,575 ordinary untranslated values across 70 languages plus 153 pending
  source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/797d236c7b70ff2974009ee42f437fa916b9b700">Translate parent-card controls in seven Pacific locales</a></summary>

- Filled 21 placeholders in Bislama, Tok Pisin, Maori, Samoan, Fijian, Tongan
  and Hawaiian. Provisional technical wording and terminology references are
  recorded in the translation audit.
- Extended locale and browser coverage. All 12 focused tests and 21
  human-preference checks pass; browser syntax passes, but browser execution
  remains unverified.
- These controls remain English in 37 locale paths. The broader backlog remains
  51,575 ordinary untranslated values across 70 languages plus 153 pending
  source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d58d0ffa4e996408c6ad77a6e7c78444841c34b9">Translate parent-card controls in southern African locales</a></summary>

- Filled 30 placeholders across Sesotho, Setswana, Northern Sotho, both Zulu
  locales, Xhosa, Swati, Ndebele, Tsonga and Venda. Provisional terminology and
  language-quality limitations are recorded in the translation audit.
- Extended locale and browser coverage. All 12 focused tests and 21
  human-preference checks pass; browser syntax passes, but browser execution
  remains unverified.
- These controls remain English in 44 locale paths. The broader backlog remains
  51,575 ordinary untranslated values across 70 languages plus 153 pending
  source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0d484b2e1787a2d1c27c9bfcceddbe43c88d57b9">Translate parent-card controls in five South Asian locales</a></summary>

- Filled 15 placeholders in Bhojpuri, Maithili, Odia, Konkani and Kashmiri.
  Removal wording describes ending a parent relationship; low-confidence
  Kashmiri phrasing is documented in the translation audit.
- Extended locale and browser coverage. All 12 focused tests and 21
  human-preference checks pass; browser syntax passes, but browser execution
  remains unverified.
- These controls remain English in 54 locale paths. The broader backlog remains
  51,575 ordinary untranslated values across 70 languages plus 153 pending
  source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f5990d89ac508365cb00232c636a3342d7ce3bc7">Translate multiple-parent controls in seven more locales</a></summary>

- Filled 21 placeholders in Kurdish, Sorani, Tatar, Turkmen, Yiddish, Somali and
  Chichewa. The removal label describes ending a parent relationship;
  provisional technical wording is documented in the translation audit.
- Extended locale and browser coverage, including preservation of both parent
  cards. All 12 focused tests and 21 human-preference checks pass; browser
  syntax passes, but browser execution remains unverified.
- These controls remain English in 59 locale paths. The broader backlog remains
  51,575 ordinary untranslated values across 70 languages plus 153 pending
  source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/399d8787fb81e5205f7272f8a95b4ee1d65f0436">Fill Wolaytta map strings and verify map-view coverage across all locales</a></summary>

- Filled seven Wolaytta placeholders. All seven map-view keys now have
  non-English values in all 234 non-English locales; low-confidence wording and
  further language review remain documented in the translation audit.
- Expanded regression coverage to all locales and added Wolaytta browser
  coverage. All 12 focused tests and 21 human-preference checks pass; browser
  syntax passes, but browser execution remains unverified.
- Removed seven keys from the pending inventory, reducing it to 153. The fresh
  ordinary backlog count remains 51,575 untranslated values across 70 languages.
  Structural coverage does not establish fluency.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6131d3eed7f6e538ef70b53900f4a4a306cb5e21">Translate map view into Tigre</a></summary>

- Filled seven placeholders. These are low-confidence drafts; vocabulary
  references, grammar limitations and possible Tigrinya interference are
  recorded in the translation audit.
- Extended locale and browser coverage. All 12 focused tests and 21
  human-preference checks pass; browser syntax passes, but browser execution
  still awaits Playwright and a running application.
- Wolaytta still has English map-view strings. The broader backlog remains
  51,575 ordinary untranslated values across 70 languages plus 160 pending
  source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/29a4180ec324c9f1d30af22be20760f3178d68bc">Translate map view into Cherokee</a></summary>

- Filled seven placeholders. The map label follows Cherokee Nation usage;
  technical sentences remain low-confidence drafts, with terminology references
  and limitations recorded in the translation audit.
- Extended locale and browser coverage. All 12 focused tests and 21
  human-preference checks pass; browser syntax passes, but browser execution
  still awaits Playwright and a running application.
- Two locale paths still have English map-view strings. The broader backlog
  remains 51,575 ordinary untranslated values across 70 languages plus 160
  pending source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9169523ae25b78d2803ae20d3070c42ebbc78b5a">Translate map view into Inuktitut</a></summary>

- Filled seven placeholders, retaining both placement methods and the image
  examples. Technical wording remains low confidence; terminology evidence and
  limitations are recorded in the translation audit.
- Extended locale and browser coverage. All 12 focused tests and 21
  human-preference checks pass; browser syntax passes, but browser execution
  still awaits Playwright and a running application.
- Three locale paths still have English map-view strings. The broader backlog
  remains 51,575 ordinary untranslated values across 70 languages plus 160
  pending source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f23a9d2a884406c6de2197958f1fde0738c72206">Translate map view into Nahuatl and Moroccan Tamazight</a></summary>

- Filled 14 placeholders. Technical sentences in both languages remain
  low-confidence drafts; terminology references and limitations are recorded in
  the translation audit.
- Extended locale and browser coverage. All 12 focused tests and 21
  human-preference checks pass; browser syntax passes, but execution awaits
  Playwright and a running application.
- The seven map-view keys remain English in four locale paths. The broader
  backlog remains 51,575 ordinary untranslated values across 70 languages plus
  160 pending source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f4b7124442a0577cf991badfc8122b2598436d92">Translate map view into Veps and Greenlandic.</a></summary>

- Filled 14 placeholders. Veps compounds are low-confidence drafts; Greenlandic
  technical wording remains provisional.
- Extended locale and browser coverage. All 12 focused tests and 21
  human-preference checks pass; browser syntax passes, but execution awaits
  Playwright and a running application.
- The seven map-view keys remain English in six locale paths. The broader
  backlog remains 51,575 ordinary untranslated values across 70 languages plus
  160 pending source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/15e8f59fba49c93b51fb1f9ee019fbc6b62f9d81">Translate map view into Klingon and Volapuk.</a></summary>

- Filled 14 placeholders and checked key vocabulary against dictionaries. Full
  technical sentences remain provisional.
- Extended locale and browser coverage. All 12 focused tests and 21
  human-preference checks pass; browser syntax passes, but execution awaits
  Playwright and a running application.
- The seven map-view keys remain English in eight locale paths. The broader
  backlog remains 51,575 ordinary untranslated values across 70 languages plus
  160 pending source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d6b4fe7e5764bb793195bd19a167f160bacfba57">Translate map view into Northern Sami, Fulah and Kashmiri.</a></summary>

- Filled 21 placeholders. Fulah and Kashmiri technical clauses are
  low-confidence drafts; floor-plan wording remains provisional.
- Extended locale and browser coverage. All 12 focused tests and 21
  human-preference checks pass; browser syntax passes, but execution awaits
  Playwright and a running application.
- The seven map-view keys remain English in 10 locale paths. The broader backlog
  remains 51,575 ordinary untranslated values across 70 languages plus 160
  pending source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dc4bfee6d9f2c84a404e9a629851a630390af85c">Translate map view into Quechua, Aymara and Guarani.</a></summary>

- Filled 21 placeholders. Map compounds, floor-plan and upload wording remain
  provisional.
- Extended locale and browser coverage. All 12 focused tests and 21
  human-preference checks pass; browser syntax passes, but execution awaits
  Playwright and a running application.
- The seven map-view keys remain English in 13 locale paths. The broader backlog
  remains 51,575 ordinary untranslated values across 70 languages plus 160
  pending source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/172e75c074025679d79cc98899899e91c77052ba">Translate map view into Akan, Ewe and Bambara.</a></summary>

- Filled 21 placeholders. Technical clauses remain provisional, particularly
  floor-plan, upload and click wording.
- Extended locale and browser coverage. All 12 focused tests and 21
  human-preference checks pass; browser syntax passes, but execution awaits
  Playwright and a running application.
- The seven map-view keys remain English in 16 locale paths. The broader backlog
  remains 51,575 ordinary untranslated values across 70 languages plus 160
  pending source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e064776ff18caf31bf808f94b9d898b47a6ceac8">Translate map view into Manx, Venetian and Aromanian.</a></summary>

- Filled 21 placeholders. Aromanian technical clauses are low-confidence drafts;
  floor-plan wording remains provisional.
- Extended locale and browser coverage. All 12 focused tests and 21
  human-preference checks pass; browser syntax passes, but execution awaits
  Playwright and a running application.
- The seven map-view keys remain English in 19 locale paths. The broader backlog
  remains 51,575 ordinary untranslated values across 70 languages plus 160
  pending source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4cf96773d93a9a06f1a5c35b87756b118bed9e4a">Translate map view into Tibetan, Dzongkha and Tigrinya.</a></summary>

- Filled 21 placeholders. Technical wording remains provisional, particularly
  Dzongkha floor-plan terminology.
- Extended locale and browser coverage. All 12 focused tests and 21
  human-preference checks pass; browser syntax passes, but execution awaits
  Playwright and a running application.
- The seven map-view keys remain English in 22 locale paths. The broader backlog
  remains 51,575 ordinary untranslated values across 70 languages plus 160
  pending source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3e73aa11f9b85929f0f508b96a2ee6ae38b7aaa3">Translate map view into Buryat, Chuvash and Sakha.</a></summary>

- Filled 21 placeholders. Technical sentences remain provisional, particularly
  Chuvash floor-plan wording.
- Extended locale and browser coverage. All 12 focused tests and 21
  human-preference checks pass; browser syntax passes, but execution awaits
  Playwright and a running application.
- The seven map-view keys remain English in 25 locale paths. The broader backlog
  remains 51,575 ordinary untranslated values across 70 languages plus 160
  pending source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ba1845e9ee1193dbd3cd1aaf62ed3fe7a711b16b">Translate map view into Waray, Fijian, Tongan, Luganda and Wolof.</a></summary>

- Filled 35 placeholders. Technical phrases, especially floor-plan wording and
  the Wolof map/card distinction, remain provisional.
- Extended locale and browser coverage. All 12 focused tests and 21
  human-preference checks pass; browser syntax passes, but execution awaits
  Playwright and a running application.
- The seven map-view keys remain English in 28 locale paths. The broader backlog
  remains 51,575 ordinary untranslated values across 70 languages plus 160
  pending source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3008049d2368945aabc234435048bc228cc8f71b">Translate map view into Papiamento, Walloon, Acehnese and Hawaiian.</a></summary>

- Filled 28 placeholders. Walloon and Acehnese technical phrases are
  low-confidence drafts; floor-plan wording remains provisional.
- Extended locale and browser coverage. All 12 focused tests and 21
  human-preference checks pass; browser syntax passes, but execution awaits
  Playwright and a running application.
- The seven map-view keys remain English in 33 locale paths. The broader backlog
  remains 51,575 ordinary untranslated values across 70 languages plus 160
  pending source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/44e386567359d1697696894f792de789eb84f91c">Translate map view into Bislama, Tok Pisin, Maori and Samoan.</a></summary>

- Filled 28 placeholders. Floor-plan phrases and Samoan UI wording remain
  provisional.
- Extended locale and browser coverage. All 12 focused tests and 21
  human-preference checks pass; browser syntax passes, but execution awaits
  Playwright and a running application.
- The seven map-view keys remain English in 37 locale paths. The broader backlog
  remains 51,575 ordinary untranslated values across 70 languages plus 160
  pending source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0b1aab5795362d96d854fe6e12b09f72270e37d4">Translate map view into Swati, Ndebele, Tsonga and Venda.</a></summary>

- Filled 28 placeholders. Technical wording remains provisional, especially
  floor-plan and click terminology.
- Extended locale and browser coverage. All 12 focused tests and 21
  human-preference checks pass; browser syntax passes, but execution awaits
  Playwright and a running application.
- The seven map-view keys remain English in 41 locale paths. The broader backlog
  remains 51,575 ordinary untranslated values across 70 languages plus 160
  pending source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/521228a31b47f61327f2c28b717f937045253e60">Translate map view into Sesotho, Setswana, Northern Sotho, Zulu and Xhosa.</a></summary>

- Filled 42 placeholders across six locale files, including both Zulu paths.
  Floor-plan terminology remains provisional, especially Northern Sotho.
- Extended locale and browser coverage. All 12 focused tests and 21
  human-preference checks pass; browser syntax passes, but execution awaits
  Playwright and a running application.
- The seven map-view keys remain English in 45 locale paths. The broader backlog
  remains 51,575 ordinary untranslated values across 70 languages plus 160
  pending source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a394fc63bc6eda730b6e7ab2d3d56933bd120d00">Translate map view into Somali, Oromo, Kinyarwanda, Kirundi and Chichewa.</a></summary>

- Filled 35 placeholders and distinguished map and task-card terms in
  Kinyarwanda and Kirundi. Technical sentences and floor-plan terms remain
  provisional.
- Extended locale and browser coverage. All 12 focused tests and 21
  human-preference checks pass; browser syntax passes, but execution awaits
  Playwright and a running application.
- The seven map-view keys remain English in 51 locale paths. The broader backlog
  remains 51,575 ordinary untranslated values across 70 languages plus 160
  pending source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5b02a46d525f1d6ac24e60d45f61e37f90f5f26a">Translate map view into Moroccan Arabic, Bhojpuri, Maithili, Odia and Konkani.</a></summary>

- Filled 35 placeholders, preserving both placement methods and map-image
  examples. Technical phrases remain provisional, especially the Konkani
  floor-plan wording.
- Extended locale and browser coverage. All 12 focused tests and 21
  human-preference checks pass; browser syntax passes, but execution awaits
  Playwright and a running application.
- The seven map-view keys remain English in 56 locale paths. The broader backlog
  remains 51,575 ordinary untranslated values across 70 languages plus 160
  pending source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bab737e36465a98168a1b9a2a2df15aa5dac1f0b">Translate map-view messages into Kurdish, Sorani, Tatar, Turkmen and Yiddish.</a></summary>

- Filled 35 placeholders, including upload/removal controls and both
  card-placement methods. Technical wording remains provisional, especially
  Turkmen.
- Extended regression and browser coverage. All 12 focused tests and 21
  human-preference checks pass; browser syntax passes, but execution awaits
  Playwright and a running application.
- These seven map-view keys remain English in 61 locale paths. The broader
  backlog remains 51,575 ordinary untranslated values across 70 languages plus
  160 pending source keys.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/208c052c844f052cfddc5f8ca2a5194fce1985cc">Complete history-recovery placeholder coverage in all languages.</a></summary>

- Filled five Cherokee messages with provisional, low-confidence wording. All
  five recovery messages now have non-English values in all 234 non-English
  locale paths; linguistic review remains open.
- Extended the regression to all locales and added the Cherokee browser
  scenario. The 13 focused tests and 21 human-preference checks pass. Browser
  syntax passes; execution awaits Playwright and a running application.
- Removed these five source keys from the pending queue, leaving 160. The
  ordinary backlog remains 51,575 untranslated locale/string values across 70
  languages; coverage does not establish fluent wording.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/69b151f2e52ab975bd712de25a9c7840f81a55fe">Translate history recovery in Tigre</a>. Thanks to xet7.</summary>

- Translate five recovery messages, preserving undo/redo, retry/forget and safe
  request repetition. Full clauses and technical wording are low-confidence
  drafts for language review.
- Translation/token, recovery-notice, request-logic and 234-locale structural
  tests pass, along with human-preference checks. Localized browser cases are
  syntax-checked; execution requires Playwright and a running application.
- This five-key group remains English in one locale: Cherokee. The broader
  backlog remains 51,575 ordinary missing values across 70 languages and 165
  pending source keys.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9daaa68ccddc39112cd9d7b6a4e548cfb46b9838">Translate history recovery in Wolaytta</a>. Thanks to xet7.</summary>

- Translate five recovery messages, preserving undo/redo, retry/forget and safe
  request repetition. Full clauses and technical wording are low-confidence
  drafts for language review.
- Translation/token, recovery-notice, request-logic and 234-locale structural
  tests pass, along with human-preference checks. Localized browser cases are
  syntax-checked; execution requires Playwright and a running application.
- This five-key group remains English in 2 locales: Tigre and Cherokee. The
  broader backlog remains 51,575 ordinary missing values across 70 languages and
  165 pending source keys.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/aade6ac1ec63b51de15dd2bab76c11ba15447171">Translate history recovery in Inuktitut</a>. Thanks to xet7.</summary>

- Translate five recovery messages, preserving undo/redo, retry/forget and safe
  request repetition. Full clauses and technical wording are low-confidence
  drafts for language review.
- Translation/token, recovery-notice, request-logic and 234-locale structural
  tests pass, along with human-preference checks. Localized browser cases are
  syntax-checked; execution requires Playwright and a running application.
- This five-key group remains English in 3 locales: Tigre, Cherokee and
  Wolaytta. The broader backlog remains 51,575 ordinary missing values across 70
  languages and 165 pending source keys.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d5666d8d5d8c863c29a832427b044251bb33c763">Translate history recovery in Nahuatl and Tamazight</a>. Thanks to xet7.</summary>

- Translate 10 recovery messages, preserving undo/redo, retry/forget and safe
  request repetition. Full clauses and technical wording are low-confidence
  drafts for language review.
- Translation/token, recovery-notice, request-logic and 234-locale structural
  tests pass, along with human-preference checks. Localized browser cases are
  syntax-checked; execution requires Playwright and a running application.
- This five-key group remains English in 4 locales. The broader backlog remains
  51,575 ordinary missing values across 70 languages and 165 pending source
  keys.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fafca4f49ee646878b05515d80f2458eff97639f">Translate history recovery in Veps and Greenlandic</a>. Thanks to xet7.</summary>

- Translate 10 recovery messages, preserving undo/redo, retry/forget and safe
  request repetition. Full clauses and technical wording are low-confidence
  drafts for language review.
- Translation/token, recovery-notice, request-logic and 234-locale structural
  tests pass, along with human-preference checks. Localized browser cases are
  syntax-checked; execution requires Playwright and a running application.
- This five-key group remains English in 6 locales. The broader backlog remains
  51,575 ordinary missing values across 70 languages and 165 pending source
  keys.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4708cfacb86bafd3665c68f08708ce37ff8cc7db">Translate history recovery in Klingon and Volapük</a>. Thanks to xet7.</summary>

- Translate 10 recovery messages, preserving undo/redo, retry/forget and safe
  request repetition. Full clauses and technical wording remain provisional for
  language review.
- Translation/token, recovery-notice, request-logic and 234-locale structural
  tests pass, along with human-preference checks. Localized browser cases are
  syntax-checked; execution requires Playwright and a running application.
- This five-key group remains English in 8 locales. The broader backlog remains
  51,575 ordinary missing values across 70 languages and 165 pending source
  keys.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4e99ccda86ade8b6d67f7809090d5092da3bea4a">Translate history recovery in Northern Sámi, Fulah and Kashmiri</a>. Thanks to xet7.</summary>

- Translate 15 recovery messages, preserving undo/redo, retry/forget and safe
  request repetition. Full clauses and technical wording are low-confidence
  drafts for language review.
- Translation/token, recovery-notice, request-logic and 234-locale structural
  tests pass, along with human-preference checks. Localized browser cases are
  syntax-checked; execution requires Playwright and a running application.
- This five-key group remains English in 10 locales. The broader backlog remains
  51,575 ordinary missing values across 70 languages and 165 pending source
  keys.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ef2dcedf2a2f8aadb95db9dfb2b363d013e43c23">Translate history recovery in Quechua, Aymara and Guarani</a>. Thanks to xet7.</summary>

- Translate 15 recovery messages, preserving undo/redo, retry/forget and safe
  request repetition. Full clauses and technical wording are low-confidence
  drafts for language review.
- Translation/token, recovery-notice, request-logic and 234-locale structural
  tests pass, along with human-preference checks. Localized browser cases are
  syntax-checked; execution requires Playwright and a running application.
- This five-key group remains English in 13 locales. The broader backlog remains
  51,575 ordinary missing values across 70 languages and 165 pending source
  keys.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/119e6648c81d0dd51ce1a6ec07996cd04fc83334">Translate history recovery in Akan, Ewe and Bambara</a>. Thanks to xet7.</summary>

- Translate 15 recovery messages, preserving undo/redo, retry/forget and safe
  request repetition. Full clauses and technical wording are low-confidence
  drafts for language review.
- Translation/token, recovery-notice, request-logic and 234-locale structural
  tests pass, along with human-preference checks. Localized browser cases are
  syntax-checked; execution requires Playwright and a running application.
- This five-key group remains English in 16 locales. The broader backlog remains
  51,575 ordinary missing values across 70 languages and 165 pending source
  keys.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/291e4a4e5f955e43ab639d62bf8574c62d587858">Translate history recovery in Manx, Venetian and Aromanian</a>. Thanks to xet7.</summary>

- Translate 15 recovery messages, preserving undo/redo, retry/forget and safe
  request repetition. Full clauses and technical wording are low-confidence
  drafts for language review.
- Translation/token, recovery-notice, request-logic and 234-locale structural
  tests pass, along with human-preference checks. Localized browser cases are
  syntax-checked; execution requires Playwright and a running application.
- This five-key group remains English in 19 locales. The broader backlog remains
  51,575 ordinary missing values across 70 languages and 165 pending source
  keys.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ee0cddff894ef302d44a968e5f3c403ae9f8c170">Translate history recovery in Tibetan, Dzongkha and Tigrinya</a>. Thanks to xet7.</summary>

- Translate 15 recovery messages, preserving undo/redo, retry/forget and safe
  request repetition. Full clauses and technical wording are low-confidence
  drafts for language review.
- Translation/token, recovery-notice, request-logic and 234-locale structural
  tests pass, along with human-preference checks. Localized browser cases are
  syntax-checked; execution requires Playwright and a running application.
- This five-key group remains English in 22 locales. The broader backlog remains
  51,575 ordinary missing values across 70 languages and 165 pending source
  keys.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4bb22322f524ee34f7557e74d96d2034bff4a2ff">Translate history recovery in Buryat, Chuvash and Sakha</a>. Thanks to xet7.</summary>

- Translate 15 recovery messages, preserving undo/redo, retry/forget and safe
  request repetition. Full clauses and technical wording are low-confidence
  drafts for language review.
- Translation/token, recovery-notice, request-logic and 234-locale structural
  tests pass, along with human-preference checks. Localized browser cases are
  syntax-checked; execution requires Playwright and a running application.
- This five-key group remains English in 25 locales. The broader backlog remains
  51,575 ordinary missing values across 70 languages and 165 pending source
  keys.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0f9c7196928cb6c8a3c3737abcd834345217c92c">Translate history recovery in Waray, Fijian, Tongan, Luganda and Wolof</a>. Thanks to xet7.</summary>

- Translate 25 recovery messages, preserving undo/redo, retry/forget and safe
  request repetition. Full clauses and technical wording remain provisional for
  language review.
- Translation/token, recovery-notice, request-logic and 234-locale structural
  tests pass, along with human-preference checks. Localized browser cases are
  syntax-checked; execution requires Playwright and a running application.
- This five-key group remains English in 28 locales. The broader backlog remains
  51,575 ordinary missing values across 70 languages and 165 pending source
  keys.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5f7f29363962373a9584c5c67bdeee98ca90df78">Translate history recovery in Papiamentu, Walloon, Acehnese and Hawaiian</a>. Thanks to xet7.</summary>

- Translate 20 recovery messages, preserving undo/redo, retry/forget and safe
  request repetition. Full clauses and technical wording remain provisional for
  language review.
- Translation/token, recovery-notice, request-logic and 234-locale structural
  tests pass, along with human-preference checks. Localized browser cases are
  syntax-checked; execution requires Playwright and a running application.
- This five-key group remains English in 33 locales. The broader backlog remains
  51,575 ordinary missing values across 70 languages and 165 pending source
  keys.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8a52901739385df5e82f9428838f7013a6a5c284">Translate history recovery in Bislama, Tok Pisin, Māori and Samoan</a>. Thanks to xet7.</summary>

- Translate 20 recovery messages, preserving undo/redo, retry/forget and safe
  request repetition. Full clauses and technical wording remain provisional for
  language review.
- Translation/token, recovery-notice, request-logic and 234-locale structural
  tests pass, along with human-preference checks. Localized browser cases are
  syntax-checked; execution requires Playwright and a running application.
- This five-key group remains English in 37 locales. The broader backlog remains
  51,575 ordinary missing values across 70 languages and 165 pending source
  keys.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/57afc10e49803118e009a2e860d7fad55df3df2f">Translate history recovery in Swati, Ndebele, Tsonga and Venda</a>. Thanks to xet7.</summary>

- Translate 20 recovery messages, preserving undo/redo, retry/forget and safe
  request repetition. Full clauses and technical wording remain provisional for
  language review.
- Translation/token, recovery-notice, request-logic and 234-locale structural
  tests pass, along with human-preference checks. Localized browser cases are
  syntax-checked; execution requires Playwright and a running application.
- This five-key group remains English in 41 locales. The broader backlog remains
  51,575 ordinary missing values across 70 languages and 165 pending source
  keys.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c3c1a3ddfb30220375deab17737f510f59a6ac60">Translate history recovery in southern African locales</a>. Thanks to xet7.</summary>

- Translate 30 recovery messages across Southern Sotho, Tswana, Northern Sotho,
  both Zulu variants and Xhosa, preserving undo/redo, retry/forget and safe
  request repetition. Full clauses and technical wording remain provisional for
  language review.
- Translation/token, recovery-notice, request-logic and 234-locale structural
  tests pass, along with human-preference checks. Localized browser cases are
  syntax-checked; execution requires Playwright and a running application.
- This five-key group remains English in 45 locales. The broader backlog remains
  51,575 ordinary missing values across 70 languages and 165 pending source
  keys.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5349fc057c6872f6ed4abf81d430295c020f1555">Translate history recovery in five African languages</a>. Thanks to xet7.</summary>

- Translate 25 recovery messages in Somali, Oromo, Kinyarwanda, Kirundi and
  Chichewa, keeping undo/redo, retry/forget and safe request repetition
  distinct. Full clauses and technical wording remain provisional for language
  review.
- Translation/token, recovery-notice, request-logic and 234-locale structural
  tests pass, along with human-preference checks. Localized browser cases are
  syntax-checked; execution requires Playwright and a running application.
- This five-key group remains English in 51 locales. The broader backlog remains
  51,575 ordinary missing values across 70 languages and 165 pending source
  keys.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/18c0b640261248f2d19ab1366ffaaef4f2345899">Translate more history recovery messages</a>. Thanks to xet7.</summary>

- Translate 25 recovery messages in Moroccan Arabic, Bhojpuri, Maithili, Odia
  and Konkani, keeping undo/redo, retry/forget and safe request repetition
  distinct. Full clauses and technical wording remain provisional for language
  review.
- Translation/token, recovery-notice, request-logic and 234-locale structural
  tests pass, along with human-preference checks. Localized browser cases are
  syntax-checked; execution requires Playwright and a running application.
- This five-key group remains English in 56 locales. The broader backlog remains
  51,575 ordinary missing values across 70 languages and 165 pending source
  keys.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0acb21a162c19d32896f986a33607e6e102830d7">Translate history recovery in five languages</a>. Thanks to xet7.</summary>

- Translate 25 recovery messages in Kurmanji, Sorani, Tatar, Turkmen and
  Yiddish, distinguishing undo/redo and retry/forget while explaining safe
  request repetition. Full clauses and technical wording remain provisional for
  language review.
- Translation/token, recovery-notice, request-logic and 234-locale structural
  tests pass, along with human-preference checks. Localized browser cases retain
  positive and negative behavior coverage; syntax checks pass, but browser
  execution requires Playwright and a running application.
- This five-key group remains English in 61 locales. The broader backlog remains
  51,575 ordinary missing values across 70 languages and 165 pending source
  keys.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/44cecb2cb7aa853ff8def0d820d6538e83709774">Complete import-report placeholder coverage across locales</a>. Thanks to xet7.</summary>

- Translate the remaining Cherokee import messages. All 234 non-English locales
  now have nonempty, non-English values for this three-key group. Cherokee
  sentences and broader provisional wording still need language review.
- Expand regression coverage to every non-English locale, preserving
  Hebrew/Persian navigation arrows, source order and interpolation tokens.
  Translation, import-loss, structural and human-preference checks pass. Browser
  cases are syntax-checked; execution requires Playwright and a running
  application.
- Remove the three filled keys from the pending inventory, leaving 165. A fresh
  report still counts 51,575 ordinary missing values across 70 languages;
  language-quality review and the broader translation task remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/802440b7c097e6caeccef082ef9fdb38f42f577d">Translate import reports in Tigre</a>. Thanks to xet7.</summary>

- Translate three import-report messages and replace a Tigrinya Admin Panel
  phrase with Tigre wording. Full sentences, warning paraphrase and technical
  terminology remain low confidence, documented in the translation audit.
- Translation/token, import-loss and 234-locale structural tests pass, along
  with human-preference checks. The Tigre browser case is syntax-checked;
  execution requires Playwright and a running application.
- This group remains English in Cherokee only. The broader backlog remains
  51,575 ordinary missing values across 70 languages and 168 pending source
  keys.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f6400c6f9f480f3084cf631616c965c7e90990e1">Translate import reports in Tamazight</a>. Thanks to xet7.</summary>

- Translate three import-report messages and replace the Arabic Admin Panel
  label with Tamazight wording. Full sentences and technical terminology remain
  low confidence, documented in the translation audit.
- Translation/token, import-loss and 234-locale structural tests pass, along
  with human-preference checks. The Tamazight browser case is syntax-checked;
  execution requires Playwright and a running application.
- This group remains English in two locales. The broader backlog remains 51,575
  ordinary missing values across 70 languages and 168 pending source keys.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/34bfeb77ca1c3891e0e8302ec5888cb5e11ea6c6">Translate import reports in Inuktitut</a>. Thanks to xet7.</summary>

- Translate three import-report messages, retaining board creation, incomplete
  transfer and recovery navigation. Full sentences and technical terminology
  remain low confidence, documented in the translation audit.
- Translation/token, import-loss and 234-locale structural tests pass, along
  with human-preference checks. The Inuktitut browser case is syntax-checked;
  execution requires Playwright and a running application.
- This group remains English in three locales. The broader backlog remains
  51,575 ordinary missing values across 70 languages and 168 pending source
  keys.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9af64cf7191926029d14f555d5a8532915434404">Translate import reports in Wolaytta</a>. Thanks to xet7.</summary>

- Translate three import-report messages and replace two prefixed-English
  recovery-menu labels. Full sentences and technical terminology remain low
  confidence, documented in the translation audit.
- Translation/token, import-loss and 234-locale structural tests pass, along
  with human-preference checks. The Wolaytta browser case is syntax-checked;
  execution requires Playwright and a running application.
- This group remains English in four locales. The broader backlog remains 51,575
  ordinary missing values across 70 languages and 168 pending source keys.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ae9af70f64bc1458b9b4ca8cf65b0ac8ef833d7a">Translate import reports in Greenlandic and Nahuatl</a>. Thanks to xet7.</summary>

- Translate six import-report messages, retaining board creation, incomplete
  transfer and recovery navigation. Full clauses and technical terminology
  remain low confidence, documented in the translation audit.
- Translation/token, import-loss and 234-locale structural tests pass, along
  with human-preference checks. Both browser cases are syntax-checked; execution
  requires Playwright and a running application.
- This group remains English in five locales. The broader backlog remains 51,575
  ordinary missing values across 70 languages and 168 pending source keys.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/90e72235594e885db9b8b62c3b932ad907c67723">Translate import reports in Veps</a>. Thanks to xet7.</summary>

- Translate three import-report messages and replace a Venda recovery-menu seed
  in Veps. Full clauses and derived terminology remain low confidence,
  documented in the translation audit.
- Translation/token, import-loss and 234-locale structural tests pass, along
  with human-preference checks. The Veps browser case is syntax-checked; browser
  execution requires Playwright and a running application.
- This group remains English in seven locales. The broader backlog remains
  51,575 ordinary missing values across 70 languages and 168 pending source
  keys.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ec3a8cd7981850b51b371e544817becbd997fd91">Translate import reports in Volapük</a>. Thanks to xet7.</summary>

- Fill three English values for import warnings, incomplete transfer
  explanations and opening the created board. Preserve existing translations and
  recovery paths. Low-confidence grammar and technical phrasing remain recorded
  for fluent-speaker review.
- Extend source-order, placeholder and localized browser coverage. Translation,
  import-loss and human-preference checks pass; browser coverage was
  syntax-checked only because the local Playwright executable and running
  application are unavailable.
- These three keys remain English in eight locales. The broader backlog remains
  51,575 ordinary missing values and 168 pending source keys, with
  language-quality review open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d94f256dcbe559121f225bfd075e4f37d05f454e">Translate import reports in Tigrinya and Klingon</a>. Thanks to xet7.</summary>

- Fill six English values for import warnings, incomplete transfer explanations
  and opening the created board. Preserve existing translations and recovery
  paths. Low-confidence grammar and technical paraphrases remain recorded for
  fluent-speaker review.
- Extend source-order, placeholder and localized browser coverage. Translation,
  import-loss and human-preference checks pass; browser cases were
  syntax-checked only because the local Playwright executable and running
  application are unavailable.
- These three keys remain English in nine locales. The broader backlog remains
  51,575 ordinary missing values and 168 pending source keys, with
  language-quality review open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b6e0289a4209fb90097c74729ba590c6a60a6d90">Translate import reports in Guarani, Quechua and Aymara</a>. Thanks to xet7.</summary>

- Fill nine English values and replace four prefixed-English menu labels in
  Quechua and Aymara. Preserve existing translations and use matching recovery
  paths. Low-confidence grammar and technical phrasing remain recorded for
  fluent-speaker review.
- Extend source-order, placeholder, menu-path, vocabulary and localized browser
  coverage. Translation, import-loss and human-preference checks pass; browser
  cases were syntax-checked only because the local Playwright executable and
  running application are unavailable.
- These three keys remain English in 11 locales. The broader backlog remains
  51,575 ordinary missing values and 168 pending source keys, with
  language-quality review open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cdd93651cab409822bad3401e98b07d7eb1a75d8">Translate import reports in Manx, Walloon and Aromanian</a>. Thanks to xet7.</summary>

- Fill nine English values for import warnings, incomplete transfer explanations
  and opening the created board. Preserve existing translations and recovery
  paths. Low-confidence grammar and technical phrasing remain recorded for
  fluent-speaker review.
- Extend source-order, placeholder and localized browser coverage. Translation,
  import-loss and human-preference checks pass; browser cases were
  syntax-checked only because the local Playwright executable and running
  application are unavailable.
- These three keys remain English in 14 locales. The broader backlog remains
  51,575 ordinary missing values and 168 pending source keys, with
  language-quality review open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9b9a31cc1093d1bf1043cf8e128c19b1f6f32ab6">Translate import reports in Tibetan, Dzongkha and Kashmiri</a>. Thanks to xet7.</summary>

- Fill nine English values for import warnings, incomplete transfer explanations
  and opening the created board. Preserve existing translations and
  recovery-menu terminology. Low-confidence grammar and technical phrasing
  remain recorded for fluent-speaker review.
- Extend source-order, placeholder and localized browser coverage. Translation,
  import-loss and human-preference checks pass; browser cases were
  syntax-checked only because the local Playwright executable and running
  application are unavailable.
- These three keys remain English in 17 locales. The broader backlog remains
  51,575 ordinary missing values and 168 pending source keys, with
  language-quality review open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ec468ac7eacf587e943cf61120ca038354ca79fb">Translate import reports in Buryat, Chuvash, Sakha and Northern Sámi</a>. Thanks to xet7.</summary>

- Fill twelve English values for import warnings, incomplete transfer
  explanations and opening the created board. Preserve existing menu paths and
  translations. Low-confidence grammar and technical phrasing in all four drafts
  remain recorded for fluent-speaker review.
- Extend source-order, placeholder and localized browser coverage. Translation,
  import-loss and human-preference checks pass; browser cases were
  syntax-checked only because the local Playwright executable and running
  application are unavailable.
- These three keys remain English in 20 locales. The broader backlog remains
  51,575 ordinary missing values and 168 pending source keys, with
  language-quality review open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/14fa33a3ff0a14e342f8745b22e2e8ba42b8cd92">Translate import reports in six further languages</a>. Thanks to xet7.</summary>

- Fill 18 English values in Acehnese, Bambara, Ewe, Fulah, Fijian and Tongan.
  Replace two prefixed English Tongan menu labels and use the corrected recovery
  path. Low-confidence technical phrasing remains recorded for fluent-speaker
  review.
- Extend source-order, placeholder, corrected-vocabulary and localized browser
  coverage. Translation, import-loss and human-preference checks pass; browser
  cases were syntax-checked only because the local Playwright executable and
  running application are unavailable.
- These three keys remain English in 24 locales. The broader backlog remains
  51,575 ordinary missing values and 168 pending source keys, with
  language-quality review open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b6d6908fad06767bf2043482cfa2d2fd8f5d6574">Translate eight more import reports and repair recovery paths</a>. Thanks to xet7.</summary>

- Fill 24 English values in Akan, Luganda, Wolof, Swati, Tsonga, Venda, Waray
  and Venetian. Correct eleven generic or wrong-language menu values so the
  report points to matching recovery labels. Lower-confidence technical phrasing
  remains recorded for fluent-speaker review.
- Extend source-order, placeholder, menu-path, vocabulary and localized browser
  coverage. Translation, import-loss and human-preference checks pass; browser
  cases were syntax-checked only because the local Playwright executable and
  running application are unavailable.
- These three keys remain English in 30 locales. The broader backlog remains
  51,575 ordinary missing values and 168 pending source keys, with
  language-quality review open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4ab324cfeb3aed52733d34981f05efc51bb08d71">Translate import reports in eight locales and repair recovery labels</a>. Thanks to xet7.</summary>

- Fill 24 English values in Bislama, Tok Pisin, Māori, Samoan, Hawaiian,
  Papiamentu, Xhosa and Northern Ndebele. Replace five mixed-language or
  malformed menu values in Bislama, Tok Pisin and Hawaiian. Lower-confidence
  technical phrasing remains recorded for fluent-speaker review.
- Extend source-order, placeholder, corrected-vocabulary and localized browser
  coverage. Translation, import-loss and human-preference checks pass; browser
  cases were syntax-checked only because the local Playwright executable and
  running application are unavailable.
- These three keys remain English in 38 locales. The broader backlog remains
  51,575 ordinary missing values and 168 pending source keys, with
  language-quality review open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b53206d9dffe9d1d3d6f60c399a119a44f550526">Translate import reports in ten African locale files</a>. Thanks to xet7.</summary>

- Fill 30 English values in Somali, Oromo, Kinyarwanda, Kirundi, Chichewa,
  Sesotho, Setswana, Northern Sotho and both Zulu locales. Preserve the warning,
  incomplete import explanation and recovery-menu path. Lower-confidence
  technical phrasing remains recorded for fluent-speaker review.
- Extend existing source-order, placeholder and localized browser coverage.
  Translation, import-loss and human-preference checks pass; browser cases were
  syntax-checked only because the local Playwright executable and running
  application are unavailable.
- These three keys remain English in 46 locales. The broader backlog remains
  51,575 ordinary missing values and 168 pending source keys, with
  language-quality review open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8e0084b1c7ac1ef1a5749a80c509194a96c95773">Translate import warning reports in ten further languages</a>. Thanks to xet7.</summary>

- Fill 30 English values in Moroccan Arabic, Sorani, Kurmanji, Bhojpuri,
  Maithili, Odia, Konkani, Turkmen, Tatar and Yiddish. Correct two Tatar
  recovery menu labels so the report points to the matching menu.
  Lower-confidence technical wording is recorded for fluent-speaker review.
- Extend source-order, token and vocabulary regressions and add ten localized
  browser cases covering malformed input, the warning report and opening the
  imported board. Node checks pass; browser cases were syntax-checked only
  because the local Playwright executable and running application stack are
  unavailable.
- These three keys remain English in 56 locales. The broader backlog remains
  51,575 ordinary missing values and 168 pending source keys, with
  language-quality review open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d5aa3a4f1087c7ebab616deb386aec27a71ec82f">Fill final board visibility translations and verify all locales</a>. Thanks to xet7.</summary>

- Fill the final three English values in Cherokee. All 234 non-English locales
  now have nonempty values different from English for the signed-in visibility
  label, description and confirmation. Low-confidence grammar and technical
  phrasing remain recorded for fluent-speaker review.
- Extend regression coverage to every locale for source order, tokens, markup
  and rendered emphasis, and verify that the group has left the pending
  inventory. Translation and permission tests pass; the browser suite was
  syntax-checked only because the application stack is unavailable.
- Reduce pending source keys from 171 to 168. The ordinary backlog remains
  51,575 missing values across 70 languages; language-quality review and the
  broader translation goal remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1365619b6a0d0aaa9980047088d3b10f1711eb4a">Translate board visibility in Tigre</a>. Thanks to xet7.</summary>

- Fill three English values, preserving viewing and editing distinctions and
  confirmation emphasis. Record grammar references and low-confidence software
  vocabulary and agreement for fluent-speaker review.
- Extend existing source-order, token, markup and rendered-emphasis checks.
  Translation and permission tests pass; the browser suite was syntax-checked
  only because the application stack is unavailable.
- These three keys remain English only in Cherokee. The broader backlog remains
  51,575 ordinary missing values and 171 pending source keys, with
  language-quality review open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/feea9100493586ce0cbaf082bac7e04f18a00cc8">Translate board visibility in Wolaytta</a>. Thanks to xet7.</summary>

- Fill three English values, preserving viewing and editing distinctions and
  confirmation emphasis. Record references and low-confidence login phrasing,
  negation and membership wording for fluent-speaker review.
- Extend existing source-order, token, markup and rendered-emphasis checks.
  Translation and permission tests pass; the browser suite was syntax-checked
  only because the application stack is unavailable.
- These three keys remain English in two locales. The broader backlog remains
  51,575 ordinary missing values and 171 pending source keys, with
  language-quality review open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bbc75e16f497a431abcb00aa5ab43b5bed91485e">Translate board visibility in Inuktitut</a>. Thanks to xet7.</summary>

- Fill three English values in syllabics, preserving viewing and editing
  distinctions and confirmation emphasis. Record low-confidence technical
  phrasing and inflection for fluent-speaker review.
- Extend existing source-order, token, markup and rendered-emphasis checks.
  Translation and permission tests pass; the browser suite was syntax-checked
  only because the application stack is unavailable.
- These three keys remain English in three locales. The broader backlog remains
  51,575 ordinary missing values and 171 pending source keys, with
  language-quality review open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/64ed67170dd07f14316cce450926de15c93871f7">Translate board visibility in Standard Moroccan Tamazight</a>. Thanks to xet7.</summary>

- Fill three English values in Tifinagh, preserving viewing and editing
  distinctions and confirmation emphasis. Record low-confidence login phrasing
  and grammar for fluent-speaker review.
- Extend existing source-order, token, markup and rendered-emphasis checks.
  Translation and permission tests pass; the browser suite was syntax-checked
  only because the application stack is unavailable.
- These three keys remain English in four locales. The broader backlog remains
  51,575 ordinary missing values and 171 pending source keys, with
  language-quality review open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6a516f1442d85b1d61b8d3e0a92feacae68ba8a0">Translate board visibility in Nahuatl</a>. Thanks to xet7.</summary>

- Fill three English values, preserving viewing and editing distinctions and
  confirmation emphasis. Record references and low-confidence software
  terminology and grammar for fluent-speaker review.
- Extend existing source-order, token, markup and rendered-emphasis checks.
  Translation and permission tests pass; the browser suite was syntax-checked
  only because the application stack is unavailable.
- These three keys remain English in five locales. The broader backlog remains
  51,575 ordinary missing values and 171 pending source keys, with
  language-quality review open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ab8fd1d8abe3d54b32c784db10a6865a054f476a">Translate board visibility in Greenlandic</a>. Thanks to xet7.</summary>

- Fill three English values, preserving viewing and editing distinctions and
  confirmation emphasis. Record vocabulary references and lower-confidence
  technical phrasing and inflection for fluent-speaker review.
- Extend existing source-order, token, markup and rendered-emphasis checks.
  Translation and permission tests pass; the browser suite was syntax-checked
  only because the application stack is unavailable.
- These three keys remain English in six locales. The broader backlog remains
  51,575 ordinary missing values and 171 pending source keys, with
  language-quality review open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/053ed2d22bd4d1acdb5fcc054aaa98a05d868a3b">Translate board visibility in Veps</a>. Thanks to xet7.</summary>

- Fill three English values, preserving viewing and editing distinctions and
  confirmation emphasis. Record references and low-confidence login phrasing and
  case endings for fluent-speaker review.
- Extend existing source-order, token, markup and rendered-emphasis checks.
  Translation and permission tests pass; the browser suite was syntax-checked
  only because the application stack is unavailable.
- These three keys remain English in seven locales. The broader backlog remains
  51,575 ordinary missing values and 171 pending source keys, with
  language-quality review open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6b1005d6532ffbb6279f433c91891952b5589de4">Translate board visibility in Volapük</a>. Thanks to xet7.</summary>

- Fill three English values, preserving viewing and editing distinctions and
  confirmation emphasis. Record vocabulary references and lower-confidence
  phrasing for fluent-speaker review.
- Extend existing source-order, token, markup and rendered-emphasis checks.
  Translation and permission tests pass; the browser suite was syntax-checked
  only because the application stack is unavailable.
- These three keys remain English in eight locales. The broader backlog remains
  51,575 ordinary missing values and 171 pending source keys, with
  language-quality review open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/712e503516279f1bbe54169a42ee8fef6eb356bc">Translate board visibility in Tigrinya and Klingon</a>. Thanks to xet7.</summary>

- Fill six English values, preserving viewing and editing distinctions and
  confirmation emphasis. Record references and lower-confidence technical
  phrasing and clause structure for fluent-speaker review.
- Extend existing source-order, token, markup and rendered-emphasis checks.
  Translation and permission tests pass; the browser suite was syntax-checked
  only because the application stack is unavailable.
- These three keys remain English in nine locales. The broader backlog remains
  51,575 ordinary missing values and 171 pending source keys, with
  language-quality review open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6cfd9b64ea3260c92ffd33a45a22b26ca6cb2e81">Translate board visibility in Guaraní, Quechua and Aymara</a>. Thanks to xet7.</summary>

- Fill nine English values, preserving viewing and editing distinctions and
  confirmation emphasis. Record vocabulary references and lower-confidence login
  phrasing and dialect choices for fluent-speaker review.
- Extend existing source-order, token, markup and rendered-emphasis checks.
  Translation and permission tests pass; the browser suite was syntax-checked
  only because the application stack is unavailable.
- These three keys remain English in 11 locales. The broader backlog remains
  51,575 ordinary missing values and 171 pending source keys, with
  language-quality review open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/168c9b97b0a9dc5a3fdf80113636260dc48ad3d8">Translate board visibility in Manx, Walloon and Aromanian</a>. Thanks to xet7.</summary>

- Fill nine English values, preserving viewing and editing distinctions and
  confirmation emphasis. Record references and lower-confidence grammar and
  dialect choices for fluent-speaker review.
- Extend existing source-order, token, markup and rendered-emphasis checks.
  Translation and permission tests pass; the browser suite was syntax-checked
  only because the application stack is unavailable.
- These three keys remain English in 14 locales. The broader backlog remains
  51,575 ordinary missing values and 171 pending source keys, with
  language-quality review open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4dbca343d731aecd2f2d143c256327a30fd52e51">Translate board visibility in Tibetan, Dzongkha and Kashmiri</a>. Thanks to xet7.</summary>

- Fill nine English values, preserving the viewing/editing distinction and
  confirmation emphasis. Record lower-confidence technical phrasing and grammar
  for fluent-speaker review.
- Extend existing source-order, token, markup and rendered-emphasis checks.
  Translation and permission tests pass; the browser suite was syntax-checked
  only because the application stack is unavailable.
- These three keys remain English in 17 locales. The broader backlog remains
  51,575 ordinary missing values and 171 pending source keys, with
  language-quality review open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/663833ed9a8429533c183aa47339649bc1cdb7f4">Translate board visibility in four further locales</a>. Thanks to xet7.</summary>

- Fill 12 English values in Buryat, Chuvash, Sakha and Northern Sámi. Preserve
  viewing and editing distinctions and confirmation emphasis; record terminology
  references and lower-confidence grammar for fluent-speaker review.
- Extend the existing source-order, token, markup and rendered-emphasis
  regression. Translation and permission checks pass; the browser suite was
  syntax-checked only because the application stack is unavailable.
- These three keys remain English in 20 locales. The broader backlog remains
  51,575 ordinary missing values and 171 pending source keys, with
  language-quality review open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1b9c99d97d5cc0707c15a813bd0bee15d45e0c06">Translate board visibility in six further locales</a>. Thanks to xet7.</summary>

- Fill 18 English values in Acehnese, Bambara, Ewe, Fulah, Fijian and Tongan,
  preserving the viewing/editing distinction and confirmation emphasis. The
  audit records lower-confidence login terminology and grammar for
  fluent-speaker review.
- Extend existing source-order, token, markup and rendered-emphasis checks.
  Translation and permission tests pass; the browser suite was syntax-checked
  only because the application stack is unavailable.
- These three keys remain English in 24 locales. The broader backlog remains
  51,575 ordinary missing values and 171 pending source keys, with
  language-quality review open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8ac1110946fb3498b3a4dfbfe8aed641ced179cd">Translate board visibility in Akan through Venetian</a>. Thanks to xet7.</summary>

- Fill 24 English values in Akan, Luganda, Wolof, Swati, Tsonga, Venda, Waray
  and Venetian, preserving signed-in viewing, board-member editing and
  confirmation emphasis. Lower-confidence technical phrasing is recorded for
  fluent-speaker review.
- Extend the existing source-order, token, markup and rendered-emphasis
  regression. Translation and permission checks pass; the browser suite was
  syntax-checked only because the application stack is unavailable.
- These three keys remain English in 30 locales. The broader backlog remains
  51,575 ordinary missing values and 171 pending source keys, with
  language-quality review open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5e46d3e208f2ab54967ba82e649cb9aafd945788">Translate board visibility in eight further locales</a>. Thanks to xet7.</summary>

- Fill 24 English values in Bislama, Tok Pisin, Māori, Samoan, Hawaiian,
  Papiamento, Xhosa and Northern Ndebele, preserving viewing and editing
  distinctions and confirmation emphasis. The audit records lower-confidence
  wording for fluent-speaker review.
- Extend the existing translation regression for source key order, tokens,
  markup and rendered emphasis. Translation and permission checks pass; the
  browser suite was syntax-checked only because the application stack is
  unavailable.
- These three keys remain English in 38 locales. The broader backlog remains
  51,575 ordinary missing values and 171 pending source keys, with
  language-quality review open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/abcdd5c3529fa03bc9bdaaf21fec7fc257d887e9">Translate board visibility in ten more locales</a>. Thanks to xet7.</summary>

- Fill 30 English values in Somali, Oromo, Kinyarwanda, Kirundi, Chichewa,
  Sesotho, Setswana, Northern Sotho and both Zulu locales. Preserve viewing and
  editing distinctions and confirmation emphasis. The audit records
  lower-confidence wording for fluent-speaker review.
- Extend existing source-order, placeholder, markup and rendered-emphasis
  coverage. Translation and permission checks pass; the browser suite was
  syntax-checked only because the application stack is unavailable.
- These three keys still need filling in 46 locales. The broader backlog remains
  51,575 ordinary missing values and 171 pending source keys, with
  language-quality review open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b985c0c590a0e048455b362a816e8a11897593d7">Translate signed-in board visibility in ten locales</a>. Thanks to xet7.</summary>

- Fill 30 English placeholders in Moroccan Arabic, Central Kurdish, Kurdish,
  Bhojpuri, Maithili, Odia, Konkani, Turkmen, Tatar and Yiddish. Preserve the
  distinction between viewing by signed-in users and editing by board members,
  and the confirmation's emphasis. Lower-confidence wording is recorded in the
  translation audit for fluent-speaker review.
- Regression checks cover source key order, placeholders, exact markup and
  rendered emphasis. Board visibility and permission tests pass. The existing
  browser suite was syntax-checked only; the application stack is unavailable.
- These three keys remain English in 56 locales. The broader backlog remains
  51,575 ordinary missing values and 171 pending source keys; language-quality
  review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/486543fc04f346f7bdfd092e3cf573e424af509c">Fill Cherokee URL hint and verify all locale scheme identifiers</a>. Thanks to xet7.</summary>

- Fill the final English URL-scheme hint in Cherokee and document low-confidence
  wording. All 234 non-English locales now have filled hints; linguistic review
  remains open, including previously documented drafts.
- Discover every non-English locale in regression coverage and verify literal
  scheme
  identifiers, placeholders and key order. Parser, sanitizer, locale structure
  and
  human-preference checks pass. Browser tests were syntax-checked only because
  the
  application stack is unavailable.
- Remove the filled hint from the pending inventory, reducing it to 171 source
  keys.
  The ordinary backlog remains 51,575 values across 70 languages; broader work
  continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a8db74f37123d9306f1fac5086da9b4ca0a6b0c3">Translate URL scheme hint in Tigre</a>. Thanks to xet7.</summary>

- Fill the English hint while preserving literal scheme names and existing
  translations. Record low-confidence terminology and grammar for fluent review.
- Hint checks cover 65 recently filled locales. Parser, sanitizer, locale
  structure
  and human-preference checks pass. Browser scenarios were syntax-checked only;
  the application stack is unavailable.
- Only Cherokee still has this hint in English. The broader backlog remains
  51,575
  ordinary missing values plus 172 pending source keys; quality review remains
  open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c98ea17f1adf00bc28d94535f243563dde0aba84">Translate URL scheme hint in Wolaytta</a>. Thanks to xet7.</summary>

- Fill the English hint while preserving literal scheme names and existing
  translations. Record lower-confidence technical wording and grammar for
  review.
- Hint checks cover 64 recently filled locales. Parser, sanitizer, locale
  structure
  and human-preference checks pass. Browser scenarios were syntax-checked only;
  the application stack is unavailable.
- Two locales still need this hint. The broader backlog remains 51,575 ordinary
  missing values plus 172 pending source keys; quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/aa5f00e7ebf2d7b12a7bb8412e8e8c514dc18139">Translate URL scheme hint in Inuktitut</a>. Thanks to xet7.</summary>

- Fill the English hint in syllabics while preserving literal scheme names and
  existing translations. Record lower-confidence terminology and grammar for
  review.
- Hint checks cover 63 recently filled locales. Parser, sanitizer, locale
  structure
  and human-preference checks pass. Browser scenarios were syntax-checked only;
  the application stack is unavailable.
- Three locales still need this hint. The broader backlog remains 51,575
  ordinary
  missing values plus 172 pending source keys; quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e6789dc75f9409827e24df51d247af0395490583">Translate URL scheme hint in Standard Moroccan Tamazight</a>. Thanks to xet7.</summary>

- Fill the English hint in Tifinagh while preserving literal scheme names and
  existing translations. Record lower-confidence terminology and grammar for
  review.
- Hint checks cover 62 recently filled locales. Parser, sanitizer, locale
  structure
  and human-preference checks pass. Browser scenarios were syntax-checked only;
  the application stack is unavailable.
- Four locales still need this hint. The broader backlog remains 51,575 ordinary
  missing values plus 172 pending source keys; quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a6e89219ff77ada412054733f7d923b5493bd7a3">Translate URL scheme hint in Nahuatl</a>. Thanks to xet7.</summary>

- Fill the English hint while preserving literal scheme names and existing
  translations. Record lower-confidence regional grammar and technical wording.
- Hint checks cover 61 recently filled locales. Parser, sanitizer, locale
  structure
  and human-preference checks pass. Browser scenarios were syntax-checked only;
  the application stack is unavailable.
- Five locales still need this hint. The broader backlog remains 51,575 ordinary
  missing values plus 172 pending source keys; quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1a6d51f5023bb8cbde7766274beec7a5369ea132">Translate URL scheme hint in Klingon</a>. Thanks to xet7.</summary>

- Fill the English hint while preserving literal scheme names and existing
  translations. Record lower-confidence technical phrasing for fluent-speaker
  review.
- Hint checks cover 60 recently filled locales. Parser, sanitizer, locale
  structure
  and human-preference checks pass. Browser scenarios were syntax-checked only;
  the application stack is unavailable.
- Six locales still need this hint. The broader backlog remains 51,575 ordinary
  missing values plus 172 pending source keys; quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bc81d9e9995e546996305bd64738282f9414deae">Translate URL scheme hint in Veps and Volapük</a>. Thanks to xet7.</summary>

- Fill two English hints while preserving literal scheme names and existing
  translations. Record lower-confidence technical wording and dictionary
  references.
- Hint checks cover 59 recently filled locales. Parser, sanitizer, locale
  structure
  and human-preference checks pass. Browser scenarios were syntax-checked only;
  the application stack is unavailable.
- Seven locales still need this hint. The broader backlog remains 51,575
  ordinary
  missing values plus 172 pending source keys; quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f1d05258ab26319b50f6bd709762c48ba7f8b424">Translate URL scheme hint in Greenlandic and Kashmiri</a>. Thanks to xet7.</summary>

- Fill two English hints while preserving literal scheme names and existing
  translations. Record lower-confidence wording and outstanding mixed-script
  review.
- Hint checks cover 57 recently filled locales. Parser, sanitizer, locale
  structure
  and human-preference checks pass. Browser scenarios were syntax-checked only;
  the application stack is unavailable.
- Nine locales still need this hint. The broader backlog remains 51,575 ordinary
  missing values plus 172 pending source keys; quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/deac86fb7eb6566166345bfc31ba10dbba371172">Translate URL scheme hint in Bambara, Ewe and Fulah</a>. Thanks to xet7.</summary>

- Fill three English hints while preserving literal scheme names and existing
  translations. Record lower-confidence technical wording for native review.
- Hint checks cover 55 recently filled locales. Parser, sanitizer, locale
  structure
  and human-preference checks pass. Browser scenarios were syntax-checked only;
  the application stack is unavailable.
- Eleven locales still need this hint. The broader backlog remains 51,575
  ordinary missing values plus 172 pending source keys; quality review remains
  open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6ebdb47beaea5b9b8055a6d3f99eb9f04b0d33f2">Translate URL scheme hint in Tibetan and Dzongkha</a>. Thanks to xet7.</summary>

- Fill two English hints while preserving literal scheme names and existing
  translations. Record lower-confidence URI scheme terminology for native
  review.
- Hint checks cover 52 recently filled locales. Parser, sanitizer, locale
  structure
  and human-preference checks pass. Browser scenarios were syntax-checked only;
  the application stack is unavailable.
- Fourteen locales still need this hint. The broader backlog remains 51,575
  ordinary missing values plus 172 pending source keys; quality review remains
  open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b9b1f9330727ae0af6ebcbb97d317b9ca4b68c9f">Translate URL scheme hint in Quechua and Aymara</a>. Thanks to xet7.</summary>

- Fill two English hints while preserving literal scheme names and existing
  translations. Record lower-confidence technical wording and regional spelling.
- Hint checks cover 50 recently filled locales. Parser, sanitizer, locale
  structure
  and human-preference checks pass. Browser scenarios were syntax-checked only;
  the application stack is unavailable.
- Sixteen locales still need this hint. The broader backlog remains 51,575
  ordinary missing values plus 172 pending source keys; quality review remains
  open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c8fcaf3e0673662b6a80c72863c04ad80312cf4f">Translate URL scheme hint in Buryat, Sakha and Chuvash</a>. Thanks to xet7.</summary>

- Fill three English hints while preserving literal scheme names and existing
  translations. Record lower-confidence technical wording for native review.
- Hint checks cover 48 recently filled locales. Parser, sanitizer, locale
  structure
  and human-preference checks pass. Browser scenarios were syntax-checked only;
  the application stack is unavailable.
- Eighteen locales still need this hint. The broader backlog remains 51,575
  ordinary missing values plus 172 pending source keys; quality review remains
  open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5f79e3b437fa552f4e4dc1f5cab46df34e2d4da0">Translate URL scheme hint in Tigrinya, Akan, Wolof and Guarani</a>. Thanks to xet7.</summary>

- Fill four English hints, preserving literal scheme names and existing
  translations.
  Record lower-confidence technical wording and vocabulary references for native
  review.
- Hint checks cover 45 recently filled locales. Parser, sanitizer, locale
  structure
  and human-preference checks pass. Browser scenarios were syntax-checked only;
  the application stack is unavailable.
- Twenty-one locales still need this hint. The broader backlog remains 51,575
  ordinary missing values plus 172 pending source keys; quality review remains
  open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/978296fa9db4a7fe910bb67aff35464fc1b34542">Translate URL scheme hint in Manx and Northern Sami</a>. Thanks to xet7.</summary>

- Fill two hints while preserving literal scheme identifiers and existing
  translations. Lower-confidence technical wording is recorded for native/UI
  review.
- Hint checks cover 41 recently filled locales. Parser, sanitizer, structural
  and
  human-preference checks pass; browser scenarios were syntax-checked but not
  run
  without the application stack.
- Twenty-five locale paths still need this hint. The ordinary backlog remains
  51,575 values plus 172 pending source keys; broader translation work remains
  open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cdaa7d0cb32b0b7240c7b53157358c86de06f4b1">Translate URL scheme hint in Waray and Acehnese</a>. Thanks to xet7.</summary>

- Fill two hints while preserving literal scheme identifiers and existing
  translations. Vocabulary sources and lower-confidence technical wording are
  recorded for native/UI review.
- Hint checks cover 39 recently filled locales. Parser, sanitizer, structural
  and
  human-preference checks pass; browser scenarios were syntax-checked but not
  run
  without the application stack.
- Twenty-seven locale paths still need this hint. The ordinary backlog remains
  51,575 values plus 172 pending source keys; broader translation work remains
  open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/efac273833c35c71082d44441d861f87f213c9e4">Translate URL scheme hint in Venetian, Walloon and Aromanian</a>. Thanks to xet7.</summary>

- Fill three hints while preserving literal scheme identifiers and existing
  translations. Lower-confidence technical wording remains open for native/UI
  review.
- Hint checks cover 37 recently filled locales. Parser, sanitizer, structural
  and
  human-preference checks pass; browser scenarios were syntax-checked but not
  run
  without the application stack.
- Twenty-nine locale paths still need this hint. The ordinary backlog remains
  51,575 values plus 172 pending source keys; broader translation work remains
  open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ca45662e64272098297c25242a93ea7860932e03">Translate URL scheme hint in five Pacific languages</a>. Thanks to xet7.</summary>

- Fill Māori, Samoan, Tongan, Fijian and Hawaiian hints while preserving literal
  scheme identifiers. Lower-confidence wording remains documented for native/UI
  review.
- Hint checks cover 34 recently filled locales. Parser, sanitizer, structural
  and
  human-preference checks pass; browser scenarios were syntax-checked but not
  run
  without the application stack.
- Thirty-two locale paths still need this hint. The ordinary backlog remains
  51,575 values plus 172 pending source keys; broader translation work remains
  open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a2a6a537be11664d1aa5e6aa7844564d1dbae707">Translate URL scheme hint in five more African languages</a>. Thanks to xet7.</summary>

- Fill Kinyarwanda, Kirundi, Luganda, Tsonga and Venda hints while preserving
  literal identifiers. Lower-confidence technical prose remains documented for
  native/UI review.
- Hint checks cover 29 recently filled locales. Parser, sanitizer, structural
  and
  human-preference checks pass; browser scenarios were syntax-checked but not
  run
  without the application stack.
- Thirty-seven locale paths still need this hint. The ordinary backlog remains
  51,575 values plus 172 pending source keys; broader translation work remains
  open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4c84b64379e23ddcc57c3a45c2558e7bd0b756a9">Translate URL scheme hint in southern African locales</a>. Thanks to xet7.</summary>

- Fill eight values in Zulu, Xhosa, North Ndebele, Swati, Southern Sotho, Tswana
  and Northern Sotho locales, preserving literal identifiers. Lower-confidence
  technical wording remains documented for native/UI review.
- Hint checks cover 24 recently filled locales. Parser, sanitizer, structural
  and
  human-preference checks pass; browser scenarios were syntax-checked but not
  run
  without the application stack.
- Forty-two locale paths still need this hint. The ordinary backlog remains
  51,575
  values plus 172 pending source keys; broader translation work remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/27f499c7f8d5ea5b1b55ab168ef13102cc1311b1">Translate URL scheme hint in six further languages</a>. Thanks to xet7.</summary>

- Fill Tok Pisin, Bislama, Papiamento, Somali, Oromo and Nyanja hints while
  preserving literal scheme names. Lower-confidence technical wording remains
  documented for native/UI review.
- Hint checks cover 16 recently filled locales. Parser, sanitizer, structural
  and
  human-preference checks pass. Browser scenarios were syntax-checked but not
  run
  without the application stack.
- Fifty locale paths still need this hint. The ordinary backlog remains 51,575
  values plus 172 pending source keys; broader translation work remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e2e304eb602d8f3fe2920d64d774083fe7ca9c2b">Translate custom URL scheme hint in ten locales</a>. Thanks to xet7.</summary>

- Fill ten Admin Panel hints, preserving the five literal scheme names and the
  distinction between configured application links and permanently blocked
  schemes.
  Lower-confidence technical wording remains documented for native/UI review.
- Positive and negative identifier checks, parser and sanitizer tests,
  all-locale
  structure and human-preference checks pass. Browser scenarios were
  syntax-checked
  but not run without the application stack.
- Fifty-six locale paths still need this hint. The ordinary backlog remains
  51,575
  values plus 172 pending source keys; broader translation work remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/af64e879df1d65195b25b7f09a4a12d755b9fa22">Complete placement label placeholders across locales</a>. Thanks to xet7.</summary>

- Fill the Cherokee and Wolaytta placement labels. Both labels now have distinct
  non-English values in all 234 non-English locale paths. Lower-confidence
  wording
  and native/UI review remain open.
- Discover every locale in the regression suite and verify source tokens and key
  order. Runtime, structural and human-preference checks pass; browser scenarios
  were syntax-checked but not run without the application stack.
- Remove two filled keys from the pending inventory, leaving 172 source keys.
  The ordinary backlog remains 51,575 values across 70 languages; broader
  translation and language-quality work remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/91054ae84d3b3fca114705dd14b520377043a3ad">Translate placement labels in Nahuatl, Tamazight and Tigre</a>. Thanks to xet7.</summary>

- Fill six placement labels, preserving existing translations. Record vocabulary
  sources and lower-confidence standalone wording for native/UI review.
- Placement checks cover 64 recently filled locales. Runtime, structural and
  human-preference checks pass; browser scenarios were syntax-checked but not
  run
  without the application stack.
- Cherokee and Wolaytta still need this pair. The ordinary backlog remains
  51,575
  values plus 174 pending source keys; broader language-quality work remains
  open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/737de798ce62275269f192e7a69f0b1fc14526a5">Translate placement labels in Dzongkha, Greenlandic and Inuktitut</a>. Thanks to xet7.</summary>

- Fill six spatial placement labels, preserving existing translations. Record
  vocabulary references and lower-confidence standalone wording for native/UI
  review.
- Placement checks cover 61 recently filled locales. Runtime, structural and
  human-preference checks pass; browser scenarios were syntax-checked but not
  run
  without the application stack.
- Five locale paths still need this pair. The ordinary backlog remains 51,575
  values plus 174 pending source keys; broader language-quality work remains
  open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9fc66b2b71181bf84a6d9f1b5c5acc8e8cc97223">Translate placement labels in Acehnese, Fula, Guarani and Veps</a>. Thanks to xet7.</summary>

- Fill eight relative-placement labels and preserve existing translations.
  Record vocabulary references and lower-confidence Veps wording for native/UI
  review.
- Placement checks cover 58 recently filled locales. Runtime, structural and
  human-preference checks pass; browser scenarios were syntax-checked but not
  run
  without the application stack.
- Eight locale paths still need this pair. The ordinary backlog remains 51,575
  values plus 174 pending source keys; broader language-quality work remains
  open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/88f728a49d83f5835ad1e5cd3f44977f0cecb2ea">Translate placement labels in five further languages</a>. Thanks to xet7.</summary>

- Fill ten Buryat, Chuvash, Yakut, Aromanian and Klingon placement labels,
  preserving existing translations. Record dictionary references and
  native-review
  limitations for standalone UI wording.
- Placement checks cover 54 recently filled locales. Runtime, structural and
  human-preference checks pass; browser scenarios were syntax-checked but not
  run
  without the application stack.
- Twelve locale paths still need this pair. The ordinary backlog remains 51,575
  values plus 174 pending source keys; broader language-quality work remains
  open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ba6d41e1e573e772cdd6fa72c930bf85d57c43be">Translate placement labels in 13 more locales</a>. Thanks to xet7.</summary>

- Fill 26 “Before” and “After” labels using spatial terminology. Preserve
  existing
  translations and record vocabulary references. Lower-confidence Aymara,
  Northern
  Sami and Waray wording remains open for native/UI review.
- Placement translation checks cover 49 recently filled locales. Runtime
  selection,
  structural and human-preference checks pass. Browser scenarios were
  syntax-checked
  but not run without the application stack.
- Seventeen locale paths still need these labels. The ordinary backlog remains
  51,575 values plus 174 pending source keys; broader language review remains
  open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e32e50a5e1beb9ba406284ee58b384c4c42d4101">Translate move-position labels in 36 locales</a>. Thanks to xet7.</summary>

- Fill 72 “Before” and “After” labels for relative placement of selected
  objects.
  Preserve existing translations; use spatial placement wording for Wolof.
  Lower-confidence minority-language wording remains recorded for native/UI
  review.
- Selection runtime, translation structure and human-preference checks pass.
  Browser scenarios were syntax-checked but not run without the application
  stack.
- Thirty locale paths still need these labels. The ordinary backlog remains
  51,575
  values plus 174 pending source keys; broader language-quality work remains
  open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/20c986cc20e9d7d37667288c30dd591f98b68ad3">Complete rule-builder placeholder translations across locales</a>. Thanks to xet7.</summary>

- Fill the seven remaining Cherokee instructions. These seven keys now have
  non-English values in all 234 non-English locale paths. Technical Cherokee
  prose
  has low confidence; native-language and composed UI wording review remains
  open.
- Extend the regression suite to discover every locale and verify exact
  variables,
  source tokens and key order. Runtime, structural and human-preference checks
  pass.
  Browser scenarios were syntax-checked but not run without the application
  stack.
- Remove seven filled keys from the pending inventory, leaving 174 pending
  source
  keys. The ordinary backlog remains 51,575 values across 70 languages; this
  does
  not complete the broader translation and language-quality work.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fccbc4ebddd59ff4d30d7d84f367c0818a22edfb">Translate rule-builder instructions in Tigre</a>. Thanks to xet7.</summary>

- Fill seven strings, preserving literal variables, any-trigger behavior and
  ordered
  actions. Technical wording has low confidence and needs Tigre speaker review,
  including composed date fragments and trigger terminology.
- Translation checks now cover 65 recently filled locales. Runtime variable,
  all-locale structural and human-preference checks pass. Browser scenarios were
  not run because the application stack was unavailable.
- Cherokee still needs this group. The ordinary backlog remains 51,575 values
  plus
  181 pending source keys; broader language-quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c0b3b45fbe0e8d7d17dc8b4b452dc352bea979b0">Translate rule-builder instructions in Wolaytta</a>. Thanks to xet7.</summary>

- Fill seven strings and correct five related prefixed labels, preserving
  literal
  variables, any-trigger behavior and ordered actions. Technical prose has lower
  confidence; terminology and composed date fragments need native/UI review.
- Translation checks now cover 64 recently filled locales. Runtime variable,
  all-locale structural and human-preference checks pass. Browser scenarios were
  not run; the app stack was unavailable.
- Two locale paths still need this group. The ordinary backlog remains 51,575
  values
  plus 181 pending source keys; broader language-quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/15af3c9f521bcee668f9f38405899115812f6b48">Translate rule-builder instructions in Inuktitut</a>. Thanks to xet7.</summary>

- Fill seven strings in syllabics, preserving literal variables, any-trigger
  behavior and ordered actions. Technical prose has lower confidence;
  dialect, inflections and composed date fragments need native/UI review.
- Translation checks now cover 63 recently filled locales. Runtime variable,
  all-locale structural and human-preference checks pass. Browser scenarios were
  not run; the app stack was unavailable.
- 3 locale paths still need this group. The ordinary backlog remains 51,575
  values
  plus 181 pending source keys; broader language-quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/58c0d84d7ab78bcf1d8e17c256c1f5b99b178ffd">Translate rule-builder instructions in Standard Moroccan Tamazight</a>. Thanks to xet7.</summary>

- Fill seven strings in Tifinagh, preserving literal variables, any-trigger
  behavior and ordered actions. Technical prose has lower confidence;
  regional usage and composed date fragments need native/UI review.
- Translation checks now cover 62 recently filled locales. Runtime variable,
  all-locale structural and human-preference checks pass. Browser scenarios were
  not run; the app stack was unavailable.
- 4 locale paths still need this group. The ordinary backlog remains 51,575
  values
  plus 181 pending source keys; broader language-quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3ff08a05979719a908fed919a2f7dafa92aaeefc">Translate rule-builder instructions in Klingon</a>. Thanks to xet7.</summary>

- Fill seven strings, preserving literal variables, any-trigger behavior and
  ordered actions. Technical prose has lower confidence and borrows the software
  word card; grammar and composed date fragments need speaker/UI review.
- Translation checks now cover 61 recently filled locales. Runtime variable,
  all-locale structural and human-preference checks pass. Browser scenarios were
  not run; the app stack was unavailable.
- 5 locale paths still need this group. The ordinary backlog remains 51,575
  values
  plus 181 pending source keys; broader language-quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5ebae861bea6f307195858a266b7351a12751617">Translate rule-builder instructions in Nahuatl</a>. Thanks to xet7.</summary>

- Fill seven strings, preserving literal variables, any-trigger behavior and
  ordered actions. Technical prose has lower confidence; dialect, terminology
  and composed date fragments need native/UI review.
- Translation checks now cover 60 recently filled locales. Runtime variable,
  all-locale structural and human-preference checks pass. Browser scenarios were
  not run; the app stack was unavailable.
- 6 locale paths still need this group. The ordinary backlog remains 51,575
  values
  plus 181 pending source keys; broader language-quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/93db0b817b0f0e0d498fba462d9c3e775521ab71">Translate rule-builder instructions in Greenlandic</a>. Thanks to xet7.</summary>

- Fill seven strings, preserving literal variables, any-trigger behavior and
  ordered actions. Technical prose has lower confidence; terminology,
  inflections
  and composed date fragments need native/UI review.
- Translation checks now cover 59 recently filled locales. Runtime variable,
  all-locale structural and human-preference checks pass. Browser scenarios were
  not run; the app stack was unavailable.
- 7 locale paths still need this group. The ordinary backlog remains 51,575
  values
  plus 181 pending source keys; broader language-quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1c5ecfcddb253c879d11a097bda8d621b0ff4213">Translate rule-builder instructions in Volapük</a>. Thanks to xet7.</summary>

- Fill seven strings and correct three labels, preserving literal variables,
  any-trigger behavior and ordered actions. Technical prose has lower
  confidence;
  terminology and composed date fragments need speaker/UI review.
- Translation checks now cover 58 recently filled locales. Runtime variable,
  all-locale structural and human-preference checks pass. Browser scenarios were
  not run; the app stack was unavailable.
- 8 locale paths still need this group. The ordinary backlog remains 51,575
  values
  plus 181 pending source keys; broader language-quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3009b5267e71b628276e2a38214d954713d3e1b6">Translate rule-builder instructions in Veps</a>. Thanks to xet7.</summary>

- Fill seven strings, preserving literal variables, any-trigger behavior and
  ordered actions. Technical prose has lower confidence; terminology,
  inflections
  and composed date fragments need native/UI review.
- Translation checks now cover 57 recently filled locales. Runtime variable,
  all-locale structural and human-preference checks pass. Browser scenarios were
  not run; the app stack was unavailable.
- 9 locale paths still need this group. The ordinary backlog remains 51,575
  values
  plus 181 pending source keys; broader language-quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4b82329cf185872af19e63d38f6f0cc93fca633f">Translate rule-builder instructions in Fulah</a>. Thanks to xet7.</summary>

- Fill seven strings, preserving literal variables, any-trigger behavior and
  ordered actions. Technical prose has lower confidence; dialect, terminology
  and composed date fragments need native/UI review.
- Translation checks now cover 56 recently filled locales. Runtime variable,
  all-locale structural and human-preference checks pass. Browser scenarios were
  not run; the app stack was unavailable.
- 10 locale paths still need this group. The ordinary backlog remains 51,575
  values
  plus 181 pending source keys; broader language-quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2b44322d5620c748324c978e7620a94a2a2c7820">Translate rule-builder instructions in Guaraní</a>. Thanks to xet7.</summary>

- Fill seven strings, preserving literal variables, any-trigger behavior and
  ordered actions. Technical prose has lower confidence; terminology and
  composed date fragments need native/UI review.
- Translation checks now cover 55 recently filled locales. Runtime variable,
  all-locale structural and human-preference checks pass. Browser scenarios were
  not run; the app stack was unavailable.
- 11 locale paths still need this group. The ordinary backlog remains 51,575
  values
  plus 181 pending source keys; broader language-quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/53c658698d65471604a3d56d5c12f29789f96e25">Translate rule-builder instructions in Quechua and Aymara</a>. Thanks to xet7.</summary>

- Fill seven strings in each locale and replace three prefixed English labels.
  Preserve literal variables, any-trigger behavior and ordered actions. Both
  translations have lower confidence and need native/UI terminology review.
- Translation checks now cover 54 recently filled locales. Runtime variable,
  all-locale structural and human-preference checks pass. Browser scenarios were
  not run; the app stack was unavailable.
- 12 locale paths still need this group. The ordinary backlog remains 51,575
  values
  plus 181 pending source keys; broader language-quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/54a1bf66995a9d143d514421199f111db19d5649">Translate rule-builder instructions in Tigrinya and Kashmiri</a>. Thanks to xet7.</summary>

- Fill seven strings in each locale, preserving literal variables, any-trigger
  behavior and ordered actions. Kashmiri prose has lower confidence;
  technical terms and composed date fragments need native/UI review.
- Translation checks now cover 52 recently filled locales. Runtime variable,
  all-locale structural and human-preference checks pass. Browser scenarios were
  not run; the app stack was unavailable.
- 14 locale paths still need this group. The ordinary backlog remains 51,575
  values
  plus 181 pending source keys; broader language-quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ed136c7037db96dcfd842e351d0518ca4b971b48">Translate rule-builder instructions in Tibetan and Dzongkha</a>. Thanks to xet7.</summary>

- Fill seven strings in each locale, preserving literal variables, any-trigger
  behavior and ordered actions. Both translations have lower confidence;
  technical terms and composed date fragments need native/UI review.
- Translation checks now cover 50 recently filled locales. Runtime variable,
  all-locale structural and human-preference checks pass. Browser scenarios were
  not run; the app stack was unavailable.
- 16 locale paths still need this group. The ordinary backlog remains 51,575
  values
  plus 181 pending source keys; broader language-quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/013b40fa0751f8d03cabf6fabc6dfb3e8094568e">Translate rule-builder instructions in Northern Sámi and Acehnese</a>. Thanks to xet7.</summary>

- Fill seven strings in each locale, preserving literal variables, any-trigger
  behavior and ordered actions. Both translations have lower confidence;
  technical terms and composed date fragments need native/UI review.
- Translation checks now cover 48 recently filled locales. Runtime variable,
  all-locale structural and human-preference checks pass. Browser scenarios were
  not run; the app stack was unavailable.
- 18 locale paths still need this group. The ordinary backlog remains 51,575
  values
  plus 181 pending source keys; broader language-quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e825c8e1dd81eba327ad97d57bb83af7a8e686ba">Translate rule-builder instructions in Chuvash and Venda</a>. Thanks to xet7.</summary>

- Fill seven strings in each locale and correct three Nguni seed labels in
  Venda.
  Preserve literal variables, any-trigger behavior and ordered actions. Both
  translations have lower confidence and need native/UI terminology review.
- Translation checks now cover 46 recently filled locales. Runtime variable,
  all-locale structural and human-preference checks pass. Browser scenarios were
  not run; the app stack was unavailable.
- 20 locale paths still need this group. The ordinary backlog remains 51,575
  values
  plus 181 pending source keys; broader language-quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/04719178b320467b8317b695be40effa0101399b">Translate rule-builder instructions in Buryat and Sakha</a>. Thanks to xet7.</summary>

- Fill seven strings in each locale, preserving literal variables, any-trigger
  behavior and ordered actions. Both translations have lower confidence;
  technical terms and composed date fragments need native/UI review.
- Translation checks now cover 44 recently filled locales. Runtime variable,
  all-locale structural and human-preference checks pass. Browser scenarios were
  not run; the app stack was unavailable.
- 22 locale paths still need this group. The ordinary backlog remains 51,575
  values
  plus 181 pending source keys; broader language-quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ceca0364750ba85e78b79efe6d4f8952ec80770d">Translate rule-builder instructions in Aromanian and Venetian</a>. Thanks to xet7.</summary>

- Fill seven strings in each locale and correct five wrong-language labels.
  Preserve literal variables, any-trigger behavior and ordered actions.
  Aromanian
  prose has lower confidence; both locales need native/UI terminology review.
- Translation checks now cover 42 recently filled locales. Runtime variable,
  all-locale structural and human-preference checks pass. Browser scenarios were
  not run; the app stack was unavailable.
- 24 locale paths still need this group. The ordinary backlog remains 51,575
  values
  plus 181 pending source keys; broader language-quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/73af562b00b75c2eb5a05e059bbf1d957a469702">Translate rule-builder instructions in Bambara and Ewe</a>. Thanks to xet7.</summary>

- Fill seven strings in each locale, preserving literal variables, any-trigger
  behavior and ordered actions. Both translations have lower confidence;
  technical terms and composed date fragments need native/UI review.
- Translation checks now cover 40 recently filled locales. Runtime variable,
  all-locale structural and human-preference checks pass. Browser scenarios were
  not run; the app stack was unavailable.
- 26 locale paths still need this group. The ordinary backlog remains 51,575
  values
  plus 181 pending source keys; broader language-quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/04b3ad18b93ef3e331bb5bbc9d7e8a7299e53ec2">Translate rule-builder instructions in Luganda and Wolof</a>. Thanks to xet7.</summary>

- Fill seven strings in each locale and replace Luganda's English trigger label.
  Preserve literal variables, any-trigger behavior and ordered actions.
  Technical
  prose has lower confidence and needs native/UI review.
- Translation checks now cover 38 recently filled locales. Runtime variable,
  all-locale structural and human-preference checks pass. Browser scenarios were
  not run; the app stack was unavailable.
- 28 locale paths still need this group. The ordinary backlog remains 51,575
  values
  plus 181 pending source keys; broader language-quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/808829a9dc4d2fbe1c10773262fa5d012a88603e">Translate rule-builder instructions in Waray and Akan</a>. Thanks to xet7.</summary>

- Fill seven strings in each locale and replace three wrong-language Waray
  labels.
  Preserve literal variables, any-trigger behavior and ordered actions. Akan
  technical prose has lower confidence and needs native/UI review.
- Translation checks now cover 36 recently filled locales. Runtime variable,
  all-locale structural and human-preference checks pass. Browser scenarios were
  not run; the app stack was unavailable.
- 30 locale paths still need this group. The ordinary backlog remains 51,575
  values
  plus 181 pending source keys; broader language-quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6d9a2451635ed56b8cccc40b3e3923af0315eed3">Translate rule-builder instructions in Manx and Walloon</a>. Thanks to xet7.</summary>

- Fill seven strings in each locale, preserving literal variables, any-trigger
  behavior and ordered actions. Manx prose has lower confidence; technical terms
  and composed date fragments need native/UI review.
- Translation checks now cover 34 recently filled locales. Runtime variable,
  all-locale structural and human-preference checks pass. Browser scenarios were
  not run; the app stack was unavailable.
- 32 locale paths still need this group. The ordinary backlog remains 51,575
  values
  plus 181 pending source keys; broader language-quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/df715c24385d9b169a3e5224213714ec37b20b55">Translate rule-builder instructions in Oromo, Fijian and Tongan</a>. Thanks to xet7.</summary>

- Fill seven strings in each locale and replace two prefixed English Tongan
  labels.
  Preserve literal variables, any-trigger behavior and ordered actions. Fijian
  and
  Tongan technical prose has lower confidence and needs native/UI review.
- Translation checks now cover 32 recently filled locales. Runtime variable,
  all-locale structural and human-preference checks pass. Browser scenarios were
  not run; the app stack was unavailable.
- 34 locale paths still need this group. The ordinary backlog remains 51,575
  values
  plus 181 pending source keys; broader language-quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a87d0a82d6278449f01fedb4eb3cb10beae43a93">Translate rule-builder instructions in Northern Ndebele, Swati, Northern Sotho and Tsonga</a>. Thanks to xet7.</summary>

- Fill seven strings in each locale, preserving literal variable expressions,
  any-trigger behavior and ordered actions. Northern Ndebele and Swati prose has
  lower confidence; terminology and date fragments need native/UI review.
- Translation checks now cover 29 recently filled locales. Runtime variable,
  all-locale structural and human-preference checks pass. Browser scenarios were
  not run; the app stack was unavailable.
- 37 locale paths still need this group. The ordinary backlog remains 51,575
  values
  plus 181 pending source keys; broader language-quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4e2d9d4ff7168de793af61c92b79e65a9fb11056">Translate rule-builder instructions in Moroccan Arabic and Yiddish</a>. Thanks to xet7.</summary>

- Fill seven strings in each locale, preserving literal variable expressions,
  any-trigger behavior and ordered actions. Correct three Persian seed labels in
  Moroccan Arabic. Technical terms, date fragments and RTL display need
  native/UI review.
- Translation checks now cover 25 recently filled locales and the corrected
  labels.
  Runtime variable, all-locale structural and human-preference checks pass.
  Browser
  scenarios were not run; the app stack was unavailable.
- 41 locale paths still need this group. The ordinary backlog remains 51,575
  values
  plus 181 pending source keys; broader language-quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/56c95029c051b6b5b1bf66dc3642992f720b1200">Translate rule-builder instructions in Odia and Konkani</a>. Thanks to xet7.</summary>

- Fill seven strings in each locale, preserving literal variable expressions,
  any-trigger behavior and ordered actions. Konkani prose has lower confidence;
  technical terms and composed date labels need native/UI review.
- Translation checks now cover 23 recently filled locales. Runtime variable
  tests,
  all-locale structural and human-preference checks pass. Browser scenarios were
  not run; the app stack was unavailable.
- 43 locale paths still need this group. The ordinary backlog remains 51,575
  values
  plus 181 pending source keys; broader language-quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/132706de4f2998c68727889325a1bec8c3503a15">Translate rule-builder instructions in Bhojpuri and Maithili</a>. Thanks to xet7.</summary>

- Fill seven strings in two locales, preserving literal variable expressions,
  any-trigger behavior and ordered actions. Technical terms and composed date
  labels
  need native/UI review.
- Translation checks now cover 21 recently filled locales. Runtime variable
  tests,
  all-locale structural and human-preference checks pass. Browser scenarios were
  not run; the app stack was unavailable.
- 45 locale paths still need this group. The ordinary backlog remains 51,575
  values
  plus 181 pending source keys; broader language-quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/abde97a3de219c08e9f012237c98b25058bfac55">Translate rule-builder instructions in Kinyarwanda, Kirundi and Chichewa</a>. Thanks to xet7.</summary>

- Fill seven strings in three locales, preserving literal variable expressions,
  any-trigger behavior and ordered actions. Technical terms and composed date
  labels
  need native/UI review, especially the Kirundi phrases.
- Translation checks now cover 19 recently filled locales. Runtime variable
  tests,
  all-locale structural and human-preference checks pass. Browser scenarios were
  not run; the app stack was unavailable.
- 47 locale paths still need this group. The ordinary backlog remains 51,575
  values
  plus 181 pending source keys; broader language-quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1ce1dfb0185174ded494e5eeffbb5acbe9fed252">Translate rule-builder instructions in Sesotho and Setswana</a>. Thanks to xet7.</summary>

- Fill seven strings in two locales, preserving literal variable expressions,
  any-trigger behavior and ordered actions. Technical phrases and composed date
  labels have lower confidence and need native/UI review.
- Translation checks now cover 16 recently filled locales. Runtime variable
  tests,
  all-locale structural and human-preference checks pass. Browser scenarios were
  not run; the app stack was unavailable.
- 50 locale paths still need this group. The ordinary backlog remains 51,575
  values
  plus 181 pending source keys; broader language-quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3edf06cee81ae2dc0f5b4aee4fd08778eee3be48">Translate rule-builder instructions in Zulu and Xhosa</a>. Thanks to xet7.</summary>

- Fill seven strings in zu, zu-ZA and xh, preserving literal variable
  expressions,
  any-trigger behavior and ordered actions. Trigger wording and composed date
  labels
  need native/UI review; the audit records Xhosa's existing swimlane
  inconsistency.
- Translation checks now cover 14 recently filled locales. Runtime variable
  tests,
  all-locale structural and human-preference checks pass. Browser scenarios were
  not run; the app stack was unavailable.
- 52 locale paths still need this group. The ordinary backlog remains 51,575
  values
  plus 181 pending source keys; broader language-quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8928e1510ea663d1f942c6ab4badcabb21e2ff57">Translate rule-builder instructions in Māori, Samoan and Hawaiian</a>. Thanks to xet7.</summary>

- Fill seven strings in three locales, preserving literal variable expressions
  and
  date-condition selector meaning. Samoan and Hawaiian phrases and technical
  terms
  are lower confidence; native/UI review remains open.
- Translation checks now cover 11 recently filled locales. Runtime variable
  tests,
  all-locale structural and human-preference checks pass. Browser scenarios were
  not run; the app stack was unavailable.
- 55 locale paths still need this group. The ordinary backlog remains 51,575
  values
  plus 181 pending source keys; broader language-quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2b28b6f6c92b52a0adefbaf07f06649f7307b4a9">Translate rule-builder instructions in Tok Pisin and Bislama</a>. Thanks to xet7.</summary>

- Fill seven strings in two locales, preserving literal variable expressions,
  any-trigger behavior and ordered actions. Trigger wording, recipient labels
  and
  composed date-condition fragments need native/UI review.
- Translation checks now cover eight recently filled locales. Runtime variable
  tests,
  all-locale structural and human-preference checks pass. Browser scenarios were
  not run; the app stack was unavailable.
- 58 locale paths still need this group. The ordinary backlog remains 51,575
  values
  plus 181 pending source keys; broader language-quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1c2fe314e5295d9587a0345cd775cf390e7e8b8e">Translate rule-builder instructions in Kurdish, Sorani and Papiamento</a>. Thanks to xet7.</summary>

- Fill seven strings in three locales, preserving literal variable expressions,
  any-trigger behavior and ordered actions. Date-condition fragments and trigger
  terminology need native/UI review.
- Translation checks now cover six recently filled locales. Runtime variable
  tests,
  all-locale structural and human-preference checks pass. Browser scenarios were
  not run; the app stack was unavailable.
- 60 locale paths still need this group. The ordinary backlog remains 51,575
  values
  plus 181 pending source keys; broader language-quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b4beb5559b169df98373b426f3df0afc6f841571">Translate rule-builder instructions in Turkmen, Tatar and Somali</a>. Thanks to xet7.</summary>

- Fill seven strings in three locales, preserving literal rule-variable
  expressions.
  Trigger/swimlane terminology and composed date-condition labels need native/UI
  review.
- Extend trigger-variable tests to compare brace-token inventories and reject
  renamed
  examples. Runtime variable tests, all-locale structural and human-preference
  checks
  pass. The browser scenario was syntax-checked only; the app stack was
  unavailable.
- 63 locale paths still need this group. The ordinary backlog remains 51,575
  values
  plus 181 pending source keys; broader language-quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4ab30ce556980bdb6aad10772bc23cbfc768d60c">Fill remaining SAML errors and reconcile all-locale coverage</a>. Thanks to xet7.</summary>

- Fill Tigre and Cherokee placeholders. Full phrases are low confidence;
  Cherokee
  retains borrowed browser/tab labels. Native terminology and grammar review
  remains.
- All 234 non-English locale paths have nonempty values different from English
  with
  exact placeholders for this message. Remove its pending entry, leaving 181
  keys.
  These checks establish coverage, not fluency or correct-language text.
- Popup-error tests pass, including positive and negative login-boundary cases
  and
  detailed translation checks for 66 recently filled locales. All-locale
  structural
  and human-preference checks pass. Browser scenarios were not run; the app
  stack
  was unavailable.
- The ordinary backlog remains 51,575 values in 70 languages. Wider
  language-quality
  review remains in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6023f4a7e86ac38184d000e49693eeda8dad0606">Translate SAML error into Nahuatl and Tamazight</a>. Thanks to xet7.</summary>

- Fill the message in nah and zgh without overwriting translations. Full phrases
  and browser-tab terminology are low confidence and need native review.
- Popup-error tests now check 64 recently filled locales and pass, including
  positive
  and negative login-boundary cases. All-locale structural and human-preference
  checks pass. Browser scenarios were not run; the app stack was unavailable.
- Tigre and Cherokee still need this message. The ordinary backlog remains
  51,575
  values plus 182 pending source keys; language-quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7c75ebfb88df1b194edd03da6228ecfb96f36162">Translate SAML error into Greenlandic and Inuktitut</a>. Thanks to xet7.</summary>

- Fill the message in kl and iu without overwriting translations. Full phrases
  and browser-tab terminology are low confidence and need native review.
- Popup-error tests now check 62 recently filled locales and pass, including
  positive
  and negative login-boundary cases. All-locale structural and human-preference
  checks pass. Browser scenarios were not run; the app stack was unavailable.
- Four locale paths still need this message. The ordinary backlog remains 51,575
  values plus 182 pending source keys; language-quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e3e9c342dda5505aea152b218f97f4db166df481">Translate SAML error into Veps and Wolaytta</a>. Thanks to xet7.</summary>

- Fill the message in ve-PP and wal without overwriting translations. Full
  phrases
  and browser-tab terms are low confidence and need native review.
- Popup-error tests now check 60 recently filled locales and pass, including
  positive
  and negative login-boundary cases. All-locale structural and human-preference
  checks pass. Browser scenarios were not run; the app stack was unavailable.
- Six locale paths still need this message. The ordinary backlog remains 51,575
  values plus 182 pending source keys; language-quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1fb61838b9cbd932ea9da6d6547bd704b6f66291">Translate SAML error into Volapük and Klingon</a>. Thanks to xet7.</summary>

- Fill the message in vo and tlh without overwriting translations. Full phrases
  are low confidence; Klingon browser and tab terms remain borrowed and need
  review.
- Popup-error tests now check 58 recently filled locales and pass, including
  positive
  and negative login-boundary cases. All-locale structural and human-preference
  checks pass. Browser scenarios were not run; the app stack was unavailable.
- Eight locale paths still need this message. The ordinary backlog remains
  51,575
  values plus 182 pending source keys; language-quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/afd51d4b50431e28287348a414b797d240ce04bd">Translate SAML error into Quechua, Aymara, Guarani and Fulah</a>. Thanks to xet7.</summary>

- Fill the browser-tab message in qu, ay, gn and ff without overwriting
  translations.
  Full phrases and browser-tab terminology are low confidence and need native
  review.
- Popup-error tests now check 56 recently filled locales and pass, including
  positive
  and negative login-boundary cases. All-locale structural and human-preference
  checks pass. Browser scenarios were not run; the app stack was unavailable.
- Ten locale paths still need this message. The ordinary backlog remains 51,575
  values plus 182 pending source keys; language-quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e188bb0f89460ca3684a531d63eed9ba7d41fe3d">Translate SAML browser-tab error in five more locales</a>. Thanks to xet7.</summary>

- Fill the message in ace, bo, dz, ti and ks without overwriting translations.
  Browser-tab terminology and full Acehnese and Dzongkha phrases are low
  confidence
  and need native review.
- Popup-error tests now check 52 recently filled locales and pass, including
  positive
  and negative login-boundary cases. All-locale structural and human-preference
  checks pass. Browser scenarios were not run; the app stack was unavailable.
- 14 locale paths still need this message. The ordinary backlog remains 51,575
  values plus 182 pending source keys; language-quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ec117c6246ad0acb6404619f1f157da1300adb22">Translate SAML browser-tab error in seven more locales</a>. Thanks to xet7.</summary>

- Fill the message in rup, ve-CC, bua, sah, cv, ve and se without overwriting
  translations. Aromanian phrases and browser-tab terminology are low confidence
  and need native review.
- Popup-error tests now check 47 recently filled locales and pass, including
  positive
  and negative login-boundary cases. All-locale structural and human-preference
  checks pass. Browser scenarios were not run; the app stack was unavailable.
- 19 locale paths still need this message. The ordinary backlog remains 51,575
  values plus 182 pending source keys; language-quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c53be38b0094ca91b90b90963b3a545640cea254">Translate SAML browser-tab error in eight more locales</a>. Thanks to xet7.</summary>

- Fill the message in gv, wa, wa-RR, ak, lg, bm, wo and ee without overwriting
  translations. Manx and Walloon phrases and browser/tab terminology are low
  confidence and need native review.
- Popup-error tests now check 40 recently filled locales and pass, including
  positive
  and negative login-boundary cases. All-locale structural and human-preference
  checks pass. Browser scenarios were not run; the app stack was unavailable.
- 26 locale paths still need this message. The ordinary backlog remains 51,575
  values plus 182 pending source keys; language-quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3b25eeeb5398b10ae30163c2e28885f704120acd">Translate SAML browser-tab error in 13 more locales</a>. Thanks to xet7.</summary>

- Fill the message in bho, mai, or_IN, kok, ary, yi, nd, ss, nso, ts, om, fj and
  to.
  Preserve existing translations. Browser/tab terminology in the southern
  African,
  Oromo, Fijian and Tongan phrases is lower confidence and needs native review.
- Popup-error tests now check 32 recently filled locales and pass, including
  positive
  and negative login-boundary cases. All-locale structural and human-preference
  checks pass. Browser scenarios were not run; the app stack was unavailable.
- 34 locale paths still need this message. The ordinary backlog remains 51,575
  values plus 182 pending source keys; language-quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8096c6976dcbdae6da92b7251eab7cb0b107efaf">Translate SAML browser-tab error in 19 locales</a>. Thanks to xet7.</summary>

- Explain that SAML sign-in was not started in this browser tab and ask the user
  to sign in again. Preserve existing translated values. Pacific and southern
  African browser-tab terminology has lower confidence and needs native review.
- Popup-error, replay-boundary, all-locale structural and human-preference
  checks
  pass. The replay test required loopback permission. Existing browser scenarios
  were syntax-checked only; the app stack was unavailable.
- 47 locale paths still need this message. The ordinary backlog remains 51,575
  values plus 182 pending source keys; language-quality review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c1f411e1a55323995f4796d225f6abf7ba6d4877">Translate Cherokee reminders and reconcile all-locale coverage</a>. Thanks to xet7.</summary>

- Fill six Cherokee reminder strings. Full phrases and technical terminology are
  low confidence and need native review.
- All 234 non-English locale paths now contain nonempty, non-English values with
  exact source placeholders for the six reminder keys. Remove these keys from
  the
  pending queue, leaving 182. This structural coverage does not certify fluency.
- Translation, all-locale structural and human-preference checks pass; detailed
  reminder checks cover 66 locales. Browser scenarios were syntax-checked only
  because the app stack was unavailable.
- The ordinary backlog remains 51,575 values in 70 languages. Wider
  language-quality
  review, including low-confidence reminder phrases, remains in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/256a6b36cf8df7ac42ec1ca33481582a4c8c239c">Translate due reminders into Tigre</a>. Thanks to xet7.</summary>

- Fill six English placeholders, retaining signed offsets, server defaults,
  whole-day bounds, the ten-entry limit and outgoing webhook delivery. Full
  phrases
  and technical terms are low confidence and need native review.
- Reminder checks now cover 65 translated locales. Translation, all-locale
  structural
  and human-preference checks pass. Browser scenarios were syntax-checked only
  because the app stack was unavailable.
- Cherokee still needs this reminder group. The ordinary backlog remains
  51,575 values plus 188 pending source keys; wider language review remains
  open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dc84805547893f3340156980a71e2646f191d26b">Translate due reminders into Wolaytta</a>. Thanks to xet7.</summary>

- Fill six English placeholders, retaining signed offsets, server defaults,
  whole-day bounds, the ten-entry limit and outgoing webhook delivery. Full
  phrases
  and technical terms are low confidence and need native review.
- Reminder checks now cover 64 translated locales. Translation, all-locale
  structural
  and human-preference checks pass. Browser scenarios were syntax-checked only
  because the app stack was unavailable.
- Two locale paths still need this reminder group. The ordinary backlog remains
  51,575 values plus 188 pending source keys; wider language review remains
  open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8924e8c936c50330950ebb4c5623feb69594078a">Translate due reminders into Inuktitut</a>. Thanks to xet7.</summary>

- Fill six English placeholders, retaining signed offsets, server defaults,
  whole-day bounds, the ten-entry limit and outgoing webhook delivery. Full
  phrases
  and technical terms are low confidence and need native review.
- Reminder checks now cover 63 translated locales. Translation, all-locale
  structural
  and human-preference checks pass. Browser scenarios were syntax-checked only
  because the app stack was unavailable.
- Three locale paths still need this reminder group. The ordinary backlog
  remains
  51,575 values plus 188 pending source keys; wider language review remains
  open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a5f345f6cf1ac4cb52a979ee35685aa7fd874421">Translate due reminders into Standard Moroccan Tamazight</a>. Thanks to xet7.</summary>

- Fill six English placeholders in Tifinagh, retaining signed offsets, server
  defaults, whole-day bounds, the ten-entry limit and webhook delivery. Full
  phrases
  and technical terms are low confidence and need native review.
- Reminder checks now cover 62 translated locales. Translation, all-locale
  structural
  and human-preference checks pass. Browser scenarios were syntax-checked only
  because the app stack was unavailable.
- Four locale paths still need this reminder group. The ordinary backlog remains
  51,575 values plus 188 pending source keys; wider language review remains
  open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2b5d755ae6ab68db22faddcf79a56eb8a92d267d">Translate due reminders into Veps</a>. Thanks to xet7.</summary>

- Fill six strings, preserving signed offsets, server defaults, integer bounds,
  board disabling and outgoing webhook delivery. Full Veps phrases and technical
  terms are low confidence and need native review.
- Translation checks and existing browser scenarios now cover 61 translated
  locales.
  Translation, all-locale structural and human-preference checks pass; browser
  scenarios were syntax-checked only because the app stack was unavailable.
- Five locale paths still need this reminder group. The ordinary backlog remains
  51,575 values plus 188 pending source keys; wider language-quality review
  remains
  in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e13b997904dc7b61243cba2477a350ca7be95be8">Translate due reminders into Nahuatl</a>. Thanks to xet7.</summary>

- Fill six strings, preserving signed offsets, server defaults, integer bounds,
  board disabling and outgoing webhook delivery. Complete instructions,
  comparisons
  and technical compounds remain low-confidence drafts for native review.
- Translation checks and existing browser scenarios now cover 60 translated
  locales.
  Translation, all-locale structural and human-preference checks pass; browser
  scenarios were syntax-checked only because the app stack was unavailable.
- 6 locale paths still need this reminder group. The ordinary backlog remains
  51,575 values plus 188 pending source keys; wider language-quality review
  remains
  in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/89b573a778bba327386685cab662ffabe52ee384">Translate due reminders into Greenlandic</a>. Thanks to xet7.</summary>

- Fill six strings, preserving signed offsets, server defaults, integer bounds,
  board disabling and outgoing webhook delivery. Complete instructions,
  inflections
  and technical compounds remain low-confidence drafts for native review.
- Translation checks and existing browser scenarios now cover 59 translated
  locales.
  Translation, all-locale structural and human-preference checks pass; browser
  scenarios were syntax-checked only because the app stack was unavailable.
- 7 locale paths still need this reminder group. The ordinary backlog remains
  51,575 values plus 188 pending source keys; wider language-quality review
  remains
  in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ef61b69b8d64c71de606920d5dfbe07de4bea1e4">Translate due reminders into Klingon</a>. Thanks to xet7.</summary>

- Fill six strings, preserving signed offsets, server defaults, integer bounds,
  board disabling and outgoing webhook delivery. Complete instructions,
  comparisons
  and technical compounds remain low-confidence drafts for fluent-speaker
  review.
- Translation checks and existing browser scenarios now cover 58 translated
  locales.
  Translation, all-locale structural and human-preference checks pass; browser
  scenarios were syntax-checked only because the app stack was unavailable.
- 8 locale paths still need this reminder group. The ordinary backlog remains
  51,575 values plus 188 pending source keys; wider language-quality review
  remains
  in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9bedd51e10052768bec7a25d7f8cded7c544a3c2">Translate due reminders into Volapük</a>. Thanks to xet7.</summary>

- Fill six strings, preserving signed offsets, server defaults, integer bounds,
  board disabling and outgoing webhook delivery. Complete instructions and
  technical
  compounds remain low-confidence drafts for fluent-speaker review.
- Translation checks and existing browser scenarios now cover 57 translated
  locales.
  Translation, all-locale structural and human-preference checks pass; browser
  scenarios were syntax-checked only because the app stack was unavailable.
- 9 locale paths still need this reminder group. The ordinary backlog remains
  51,575 values plus 188 pending source keys; wider language-quality review
  remains
  in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c092aabc2ec9be4fa60a20ccc6a4b73df433f16a">Translate due reminders into Fulah</a>. Thanks to xet7.</summary>

- Fill six strings, preserving signed offsets, server defaults, integer bounds,
  board disabling and outgoing webhook delivery. Complete instructions and
  technical
  compounds remain low-confidence drafts for native review, including dialect
  consistency.
- Translation checks and existing browser scenarios now cover 56 translated
  locales.
  Translation, all-locale structural and human-preference checks pass; browser
  scenarios were syntax-checked only because the app stack was unavailable.
- 10 locale paths still need this reminder group. The ordinary backlog remains
  51,575 values plus 188 pending source keys; wider language-quality review
  remains
  in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/14ce70fe73d04392a32b870bb014ef8d2c914685">Translate due reminders into Guarani</a>. Thanks to xet7.</summary>

- Fill six strings, preserving signed offsets, server defaults, integer bounds,
  board disabling and outgoing webhook delivery. Complete instructions and
  technical
  compounds remain low-confidence drafts for native review.
- Translation checks and existing browser scenarios now cover 55 translated
  locales.
  Translation, all-locale structural and human-preference checks pass; browser
  scenarios were syntax-checked only because the app stack was unavailable.
- 11 locale paths still need this reminder group. The ordinary backlog remains
  51,575 values plus 188 pending source keys; wider language-quality review
  remains
  in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a434d1b4de83a8fbcc41b692d60063813350dfbe">Translate due reminders into Aymara</a>. Thanks to xet7.</summary>

- Fill six strings, preserving signed offsets, server defaults, integer bounds,
  board disabling and outgoing webhook delivery. Complete instructions and
  technical
  compounds remain low-confidence drafts for native review.
- Translation checks and existing browser scenarios now cover 54 translated
  locales.
  Translation, all-locale structural and human-preference checks pass; browser
  scenarios were syntax-checked only because the app stack was unavailable.
- 12 locale paths still need this reminder group. The ordinary backlog remains
  51,575 values plus 188 pending source keys; wider language-quality review
  remains
  in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/229ef7bbcb4c3b23a23cf39b7d244bd3b52bbba1">Translate due reminders into Quechua</a>. Thanks to xet7.</summary>

- Fill six strings, preserving signed offsets, server defaults, integer bounds,
  board disabling and outgoing webhook delivery. Complete instructions and
  technical
  compounds remain low-confidence drafts for native review, including dialect
  consistency.
- Translation checks and existing browser scenarios now cover 53 translated
  locales.
  Translation, all-locale structural and human-preference checks pass; browser
  scenarios were syntax-checked only because the app stack was unavailable.
- 13 locale paths still need this reminder group. The ordinary backlog remains
  51,575 values plus 188 pending source keys; wider language-quality review
  remains
  in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a7816d3e4c4bd465a0fc53429642700e539797b7">Translate due reminders into Kashmiri</a>. Thanks to xet7.</summary>

- Fill six strings, preserving signed offsets, server defaults, integer bounds,
  board disabling and outgoing webhook delivery. Complete instructions and
  technical
  compounds remain low-confidence drafts for native review.
- Translation checks and existing browser scenarios now cover 52 translated
  locales.
  Translation, all-locale structural and human-preference checks pass; browser
  scenarios were syntax-checked only because the app stack was unavailable.
- 14 locale paths still need this reminder group. The ordinary backlog remains
  51,575 values plus 188 pending source keys; wider language-quality review
  remains
  in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3b2dd52c71d5310779d3dd088b5adef9700b1a5b">Translate due reminders into Tigrinya</a>. Thanks to xet7.</summary>

- Fill six strings, preserving signed offsets, server defaults, integer bounds,
  board disabling and outgoing webhook delivery. Technical compounds remain
  open to native review.
- Translation checks and existing browser scenarios now cover 51 translated
  locales.
  Translation, all-locale structural and human-preference checks pass; browser
  scenarios were syntax-checked only because the app stack was unavailable.
- 15 locale paths still need this reminder group. The ordinary backlog remains
  51,575 values plus 188 pending source keys; wider language-quality review
  remains
  in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/887f1a1a2ac2a10844f034c18670819125866fe1">Translate due reminders into Dzongkha</a>. Thanks to xet7.</summary>

- Fill six strings, preserving signed offsets, server defaults, integer bounds,
  board disabling and outgoing webhook delivery. Complete instructions and
  technical
  compounds remain low-confidence drafts for native review.
- Translation checks and existing browser scenarios now cover 50 translated
  locales.
  Translation, all-locale structural and human-preference checks pass; browser
  scenarios were syntax-checked only because the app stack was unavailable.
- 16 locale paths still need this reminder group. The ordinary backlog remains
  51,575 values plus 188 pending source keys; wider language-quality review
  remains
  in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/867440826636394dd3d2ea7c2a373e1a4d820cba">Translate due reminders into Tibetan</a>. Thanks to xet7.</summary>

- Fill six strings, preserving signed offsets, server defaults, integer bounds,
  board disabling and outgoing webhook delivery. Technical compounds remain
  open to native review.
- Translation checks and existing browser scenarios now cover 49 translated
  locales.
  Translation, all-locale structural and human-preference checks pass; browser
  scenarios were syntax-checked only because the app stack was unavailable.
- 17 locale paths still need this reminder group. The ordinary backlog remains
  51,575 values plus 188 pending source keys; wider language-quality review
  remains
  in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/981101ab212933bf14b03afe2e23279dea608b26">Translate due reminders into Acehnese</a>. Thanks to xet7.</summary>

- Fill six strings, preserving signed offsets, server defaults, integer bounds,
  board disabling and outgoing webhook delivery. Complete instructions and
  technical
  compounds remain low-confidence drafts for native review.
- Translation checks and existing browser scenarios now cover 48 translated
  locales.
  Translation, all-locale structural and human-preference checks pass; browser
  scenarios were syntax-checked only because the app stack was unavailable.
- 18 locale paths still need this reminder group. The ordinary backlog remains
  51,575 values plus 188 pending source keys; wider language-quality review
  remains
  in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/885ceae2337f70518098f71fe90f3daf44842737">Translate due reminders into Northern Sámi</a>. Thanks to xet7.</summary>

- Fill six strings, preserving signed offsets, server defaults, integer bounds,
  board disabling and outgoing webhook delivery. Full instructions and technical
  compounds remain low-confidence drafts for native review.
- Translation checks and existing browser scenarios now cover 47 translated
  locales.
  Translation, all-locale structural and human-preference checks pass; browser
  scenarios were syntax-checked only because the app stack was unavailable.
- 19 locale paths still need this reminder group. The ordinary backlog remains
  51,575 values plus 188 pending source keys; wider language-quality review
  remains
  in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c6a880f1bb81f898df76b9e459746714e5ae789d">Translate due reminders into Venda</a>. Thanks to xet7.</summary>

- Fill six strings, preserving signed offsets, server defaults, integer bounds,
  board disabling and outgoing webhook delivery. Technical compounds remain
  low-confidence drafts for native review.
- Translation checks and existing browser scenarios now cover 46 translated
  locales.
  Translation, all-locale structural and human-preference checks pass; browser
  scenarios were syntax-checked only because the app stack was unavailable.
- 20 locale paths still need this reminder group. The ordinary backlog remains
  51,575 values plus 188 pending source keys; wider language-quality review
  remains
  in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a7d1033d265bc1c7c3a02d26a241d0e770318a37">Translate due reminders into Chuvash</a>. Thanks to xet7.</summary>

- Fill six strings, preserving signed offsets, server defaults, integer bounds,
  board disabling and outgoing webhook delivery. Full instructions and technical
  compounds remain low-confidence drafts for native review.
- Translation checks and existing browser scenarios now cover 45 translated
  locales.
  Translation, all-locale structural and human-preference checks pass; browser
  scenarios were syntax-checked only because the app stack was unavailable.
- 21 locale paths still need this reminder group. The ordinary backlog remains
  51,575 values plus 188 pending source keys; wider language-quality review
  remains
  in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/76eeac26a5549660fd14e1ba6f19293dccb511ae">Translate due reminders into Buryat and Sakha</a>. Thanks to xet7.</summary>

- Fill 12 strings, preserving signed offsets, server defaults, integer bounds,
  board disabling and outgoing webhook delivery. Full instructions and technical
  compounds remain low-confidence drafts for native review.
- Translation checks and existing browser scenarios now cover 44 translated
  locales.
  Translation, all-locale structural and human-preference checks pass; browser
  scenarios were syntax-checked only because the app stack was unavailable.
- 22 locale paths still need this reminder group. The ordinary backlog remains
  51,575 values plus 188 pending source keys; wider language-quality review
  remains
  in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/135341a09ee19ad1ec1d445f4f58d80078c91fd0">Translate due reminders into Aromanian and Venetian</a>. Thanks to xet7.</summary>

- Fill 12 strings, preserving signed offsets, server defaults, integer bounds,
  board disabling and outgoing webhook delivery. Aromanian instructions and
  technical compounds remain low-confidence drafts for native review.
- Translation checks and existing browser scenarios now cover 42 translated
  locales.
  Translation, all-locale structural and human-preference checks pass; browser
  scenarios were syntax-checked only because the app stack was unavailable.
- 24 locale paths still need this reminder group. The ordinary backlog remains
  51,575 values plus 188 pending source keys; wider language-quality review
  remains
  in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/876845a7212e4d42b9ddaed41da30478bc47498b">Translate due reminders into Bambara, Wolof and Ewe</a>. Thanks to xet7.</summary>

- Fill 18 strings, preserving signed offsets, server defaults, integer bounds,
  board disabling and outgoing webhook delivery. Complete instructions and
  technical
  compounds remain low-confidence drafts for native review.
- Translation checks and existing browser scenarios now cover 40 translated
  locales.
  Translation, all-locale structural and human-preference checks pass; browser
  scenarios were syntax-checked only because the app stack was unavailable.
- 26 locale paths still need this reminder group. The ordinary backlog remains
  51,575 values plus 188 pending source keys; wider language-quality review
  remains
  in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6c1d3f0d4a3806c97db18ccbf3ba5fbe34f7fe16">Translate due reminders into Akan and Luganda</a>. Thanks to xet7.</summary>

- Fill 12 strings, preserving signed offsets, server defaults, integer bounds,
  board disabling and outgoing webhook delivery. Technical compounds remain
  low-confidence drafts for native review.
- Translation checks and existing browser scenarios now cover 37 translated
  locales.
  Translation, all-locale structural and human-preference checks pass; browser
  scenarios were syntax-checked only because the app stack was unavailable.
- 29 locale paths still need this reminder group. The ordinary backlog remains
  51,575 values plus 188 pending source keys; wider language-quality review
  remains
  in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a8ca9e47da038103faf5ba70de9064c30111c39c">Translate due reminders into Manx, Walloon and Waray</a>. Thanks to xet7.</summary>

- Fill 18 strings, preserving signed offsets, server defaults, integer bounds,
  board disabling and outgoing webhook delivery. Technical compounds and
  complete
  Manx and Walloon instructions remain low-confidence drafts for native review.
- Translation checks and existing browser scenarios now cover 35 translated
  locales.
  Translation, all-locale structural and human-preference checks pass; browser
  scenarios were syntax-checked only because the app stack was unavailable.
- 31 locale paths still need this reminder group. The ordinary backlog remains
  51,575 values plus 188 pending source keys; wider language-quality review
  remains
  in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e6690139f10762471b6d372b0efa8083d6b1768b">Translate due reminders into Oromo, Fijian and Tongan</a>. Thanks to xet7.</summary>

- Fill 18 strings, retaining signed offsets, server defaults, integer bounds,
  board disabling and outgoing webhook delivery. Technical compounds and
  complete
  Fijian and Tongan instructions remain low-confidence drafts for native review.
- Translation checks and existing browser scenarios now cover 32 translated
  locales.
  Translation, all-locale structural and human-preference checks pass; browser
  scenarios were syntax-checked only because the app stack was unavailable.
- 34 locale paths still need this reminder group. The ordinary backlog remains
  51,575 values plus 188 pending source keys; wider language-quality review
  remains
  in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ae2860bac58f2a04d122b5ec8b76d6dd85c5c59f">Translate due reminders into Northern Ndebele, Swati, Northern Sotho and Tsonga</a>. Thanks to xet7.</summary>

- Fill 24 strings, preserving signed offsets, server defaults, integer bounds,
  board disabling and outgoing webhook delivery. Northern Ndebele and Swati
  instructions and technical compounds remain low-confidence drafts for native
  review.
- Translation checks and existing browser scenarios now cover 29 translated
  locales.
  Translation, all-locale structural and human-preference checks pass; browser
  scenarios were syntax-checked only because the app stack was unavailable.
- 37 locale paths still need this reminder group. The ordinary backlog remains
  51,575 values plus 188 pending source keys; wider language-quality review
  remains
  in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/11a85ea77216420b5115627ef6191ce51a60ca6d">Translate due reminders into Moroccan Arabic and Yiddish</a>. Thanks to xet7.</summary>

- Fill 12 strings, preserving signed offsets, server defaults, integer bounds,
  board disabling and outgoing webhook delivery.
- Translation checks and existing browser scenarios now cover 25 translated
  locales.
  Translation, all-locale structural and human-preference checks pass; browser
  scenarios were syntax-checked only because the app stack was unavailable.
- 41 locale paths still need these reminder strings. The ordinary backlog
  remains
  51,575 values plus 188 pending source keys; wider language-quality review
  remains
  in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/16f5a92edbfd7cb00f9410be7db090944facd045">Translate due reminders into Bhojpuri, Maithili, Odia and Konkani</a>. Thanks to xet7.</summary>

- Fill 24 strings, preserving offset direction, comma separation, numeric limits
  and blank/server fallback without overwriting existing translations.
- Translation checks and existing browser scenarios now cover 23 locales.
  Translation, all-locale and human-preference checks pass; browser coverage is
  syntax-checked only because its application stack was unavailable.
- Forty-three locale paths still need this six-key group. The ordinary backlog
  remains 51,575 values plus 188 pending source keys; wider review stays in TODO
  Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b05e65ac097db446bb11cfb2cca5508816df72a6">Translate due reminders into Kinyarwanda, Kirundi and Chichewa</a>. Thanks to xet7.</summary>

- Fill 18 strings, preserving offset direction, comma separation, numeric limits
  and blank/server fallback without overwriting existing translations.
- Translation checks and existing browser scenarios now cover 19 locales.
  Translation, all-locale and human-preference checks pass; browser coverage is
  syntax-checked only because its application stack was unavailable.
- Forty-seven locale paths still need this six-key group. The ordinary backlog
  remains 51,575 values plus 188 pending source keys; wider review stays in TODO
  Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5cb537180e4029859f64e86c331ee89a05861988">Translate due reminders into Zulu, Xhosa, Sesotho and Setswana</a>. Thanks to xet7.</summary>

- Fill 30 strings across five locale paths, including both Zulu files,
  preserving
  offset direction, comma separation, numeric limits and blank/server fallback.
- Translation checks and existing browser scenarios now cover 16 locales.
  Translation, all-locale and human-preference checks pass; browser coverage is
  syntax-checked only because its application stack was unavailable.
- Fifty locale paths still need this six-key group. The ordinary backlog remains
  51,575 values plus 188 pending source keys; wider review stays in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/590f813fdeb25886d1febc91798d1c765d5525e9">Translate due reminders into Māori, Samoan and Hawaiian</a>. Thanks to xet7.</summary>

- Fill 18 due-reminder strings, preserving offset direction, comma separation,
  numeric limits and blank/server fallback without overwriting existing
  translations.
- Translation checks and existing browser scenarios now cover 11 locales.
  Translation, all-locale and human-preference checks pass; browser coverage is
  syntax-checked only because its application stack was unavailable.
- Fifty-five locales still need this six-key group. The ordinary backlog remains
  51,575 values plus 188 pending source keys; wider review stays in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4becd76fa0008e7d540972262429c314041bc996">Translate due reminders into five more languages</a>. Thanks to xet7.</summary>

- Fill 30 strings in Kurdish, Sorani, Papiamento, Tok Pisin and Bislama,
  preserving
  signed offset directions, comma separation, numeric limits and server
  fallback.
- Translation checks and existing browser scenarios now cover eight locales.
  Translation, all-locale and human-preference checks pass; browser coverage is
  syntax-checked only because its application stack was unavailable.
- Fifty-eight locales still need this six-key group. The ordinary backlog
  remains
  51,575 values plus 188 pending source keys; wider review stays in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0ba3f9fc23f24237fd28a1250f257678a9046365">Translate due reminders into Turkmen, Tatar and Somali</a>. Thanks to xet7.</summary>

- Fill 18 due-reminder strings in three locales, preserving positive-before and
  negative-after offsets, comma separation, blank/server fallback and numeric
  limits.
- Add translation checks and extend the existing board-reminder UI test for
  translated labels and saved/error feedback. Translation, all-locale and
  human-preference checks pass; browser coverage is syntax-checked only because
  its application stack was unavailable.
- Another 63 locales need this six-key group. The ordinary backlog remains
  51,575
  values plus 188 pending source keys; wider translation review stays in TODO
  Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b77648b8fd24302c5356c0e3fb58a9fa3d4e7a19">Reconcile filled notification keys with translation backlog</a>. Thanks to xet7.</summary>

- Remove 13 activity-notification keys from the pending manifest after checking
  all 234 non-English locale paths for nonempty values, no exact English
  placeholders and preserved source tokens. Add regression coverage for queue
  removal.
- Pending source keys decrease from 201 to 188. The ordinary backlog remains
  51,575 values. Low-confidence wording and language review remain in TODO
  Later;
  these structural checks do not establish fluency.
- Notification, all-locale, human-preference and changelog checks pass. The next
  feature group has six due-reminder strings still English in 66 locales.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b5818255c9ab38bab1f55084e893d783eae414d9">Translate Cherokee notification settings and check all locales</a>. Thanks to xet7.</summary>

- Fill 13 Cherokee notification strings with provisional wording; document
  reference limitations and fluent-speaker review needs in
  `docs/Features/Translations/Audit.md`.
- All 234 non-English locale paths now pass checks for nonempty values, no exact
  English placeholders and preserved tokens in this group. Detailed notification
  coverage includes 66 locales. Human-preference and all-locale checks pass;
  browser coverage is syntax-checked only because its application stack is
  unavailable.
- Language-quality review and the wider translation backlog remain in TODO
  Later.
  The ordinary count is still 51,575 values plus 201 pending source keys; this
  group's pending manifest entries still need reconciliation.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7138ed19e0c2d7371256b7781b58b4405f1f7345">Translate Tigre notification settings</a>. Thanks to xet7.</summary>

- Fill 13 Tigre notification strings while preserving existing translations.
  Record low-confidence wording, reference limits and possible Tigrinya
  influence
  in the broader locale in `docs/Features/Translations/Audit.md`.
- Shared notification coverage now includes 65 locales. Notification, script,
  all-locale structure/token and human-preference checks pass. Browser coverage
  is syntax-checked only; its application stack was unavailable.
- Cherokee still needs this notification group. The ordinary backlog remains
  51,575 values plus 201 pending source keys; remaining work stays in TODO
  Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/56fd350ada934e8a6833833b1867d43e2b0ca64f">Translate Wolaytta notification settings</a>. Thanks to xet7.</summary>

- Fill 13 Wolaytta notification strings while preserving existing translations.
  Document terminology references and low-confidence wording in
  `docs/Features/Translations/Audit.md`.
- Shared notification coverage now includes 64 locales. Notification, all-locale
  structure/token and human-preference checks pass. Browser coverage was
  syntax-checked only because its application stack was unavailable.
- Two locales still need this notification group. The ordinary backlog remains
  51,575 values plus 201 pending source keys; remaining work stays in TODO
  Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/360ffe7c50171401a27c492d0bb795dfde1a581d">Translate Inuktitut notification settings</a>. Thanks to xet7.</summary>

- Fill 13 Inuktitut notification strings in syllabics without overwriting
  existing
  translations. Record sources and low-confidence wording in
  `docs/Features/Translations/Audit.md`.
- Shared notification coverage now includes 63 locales. Notification, syllabic,
  all-locale structure/token and human-preference checks pass. Browser coverage
  is syntax-checked only; its application stack was unavailable.
- Three locales still need this notification group. The ordinary backlog remains
  51,575 values plus 201 pending source keys; remaining work stays in TODO
  Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cdf21e4dbb975b3939ac53a67e5279da6e5642b4">Translate Tamazight notification settings</a>. Thanks to xet7.</summary>

- Fill 13 Standard Moroccan Tamazight notification strings in Tifinagh without
  overwriting existing translations. Record low-confidence wording and
  vocabulary
  references in `docs/Features/Translations/Audit.md`.
- Shared notification coverage now includes 62 locales, with Tifinagh checks for
  this batch. Notification, all-locale structure/token and human-preference
  checks
  pass. Browser coverage is syntax-checked only; its application stack was
  unavailable.
- Four locales still need this notification group. The ordinary backlog remains
  51,575 values plus 201 pending source keys; remaining work stays in TODO
  Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/54f5243cc81fa118dd455d484c26d004bc19845f">Translate Veps notification settings</a>. Thanks to xet7.</summary>

- Fill 13 Veps notification strings without overwriting existing translations.
  Record vocabulary references and low-confidence technical wording in
  `docs/Features/Translations/Audit.md`.
- Shared notification coverage now includes 61 locales. Notification, all-locale
  structure/token and human-preference checks pass. Browser coverage was
  syntax-checked only because its application stack was unavailable.
- Five locales still need this notification group. The ordinary backlog remains
  51,575 values plus 201 pending source keys; remaining work stays in TODO
  Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/17f85c385ce244e086aa31cf17dad7407905a906">Translate Nahuatl notification settings</a>. Thanks to xet7.</summary>

- Fill 13 Nahuatl notification strings without overwriting existing
  translations.
  Document vocabulary references and low-confidence technical wording in
  `docs/Features/Translations/Audit.md`.
- Shared notification coverage now includes 60 locales. Notification, all-locale
  structure/token and human-preference checks pass. Browser coverage was
  syntax-checked only because the application stack was unavailable.
- Six locales still need this notification group. The ordinary backlog remains
  51,575 values plus 201 pending source keys; remaining work stays in TODO
  Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7c365d77492115d4d519b0b23a886446e59dea4d">Translate Greenlandic notification settings</a>. Thanks to xet7.</summary>

- Fill 13 Greenlandic notification strings, preserving existing translations and
  source tokens. Vocabulary sources and low-confidence wording are documented in
  `docs/Features/Translations/Audit.md`.
- Shared notification coverage now includes 59 locales. Notification, all-locale
  structure/token and human-preference checks pass. Browser coverage was
  syntax-checked only; the application stack was unavailable.
- Seven locales still need this notification group. The ordinary backlog remains
  51,575 values plus 201 pending source keys; remaining work stays in TODO
  Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0a2fa65863a597f12f20373d749ea5168f4627e2">Translate Klingon notification settings</a>. Thanks to xet7.</summary>

- Fill 13 Klingon notification strings and replace the French assignee label.
  Preserve source keys and tokens; record low-confidence technical wording and
  dictionary references in `docs/Features/Translations/Audit.md`.
- Notification coverage now includes 58 locales. Notification, all-locale
  structure/token and human-preference checks pass. Browser coverage is
  syntax-checked only; its application stack was unavailable.
- Eight locales still need this notification group. The ordinary backlog remains
  51,575 values plus 201 pending source keys; the remaining work stays in TODO
  Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/96aa165b5d4333268e577f677d9fed81ce7d5ebc">Translate Volapük notification settings</a>. Thanks to xet7.</summary>

- Fill 13 notification preferences in Volapük and replace the Esperanto member
  label with Volapük. Record provisional technical vocabulary in
  `docs/Features/Translations/Audit.md` for fluent-speaker review.
- Shared notification checks now cover 57 locales. Notification, all-locale
  structure/token and human-preference checks pass. Browser coverage is
  registered
  and syntax-checked, but the browser stack was unavailable for execution.
- The standard backlog remains 51,575 values plus 201 pending source keys;
  these notification strings belong to the pending group. Remaining languages
  and broader language review stay in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/eb30d42396363aeb3ef07711fb395c69fc856dc0">Translate Fulfulde notification settings</a>. Thanks to xet7.</summary>

- Fill 13 English placeholders, preserving existing translations and the
  due-date reminder/@mention exception.
- Shared notification checks now cover 56 locales. Feature, all-locale
  structure and human-preference checks pass. Browser scenarios are
  syntax-checked only. Technical wording and dialect consistency are low
  confidence pending speaker review; references and limits are in the audit.
- The standard backlog remains 51,575 values plus 201 pending source keys.
  Remaining languages and broader language review stay in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d082f1d54fec4f285d1b056b22bd11a6d31ccd0a">Translate Guaraní notification settings</a>. Thanks to xet7.</summary>

- Fill 13 English placeholders, preserving existing translations and the
  due-date reminder/@mention exception.
- Shared notification checks now cover 55 locales. Feature, all-locale
  structure and human-preference checks pass. Browser scenarios are
  syntax-checked only. Technical wording is low confidence pending speaker
  review; vocabulary references are recorded in the audit.
- The standard backlog remains 51,575 values plus 201 pending source keys.
  Remaining languages and broader language review stay in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e779130f228e0c88429c7d5c5a08310a4fbcf05c">Translate Quechua and Aymara notification settings</a>. Thanks to xet7.</summary>

- Fill 26 English placeholders, preserving existing translations and the
  due-date reminder/@mention exception.
- Shared notification checks now cover 54 locales. Feature, all-locale
  structure and human-preference checks pass. Browser scenarios are
  syntax-checked only. Technical wording and dialect consistency are low
  confidence pending speaker review; references are recorded in the audit.
- The standard backlog remains 51,575 values plus 201 pending source keys.
  Remaining languages and broader language review stay in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7542d278a6c0dbda63617921278808a6bf987311">Translate Kashmiri notification settings</a>. Thanks to xet7.</summary>

- Fill 13 English placeholders, preserving existing translations and the
  due-date reminder/@mention exception.
- Shared notification checks now cover 52 locales. Feature, all-locale
  structure and human-preference checks pass. Browser scenarios are
  syntax-checked only. Technical wording and diacritics are low confidence
  pending speaker review; vocabulary references are recorded in the audit.
- The standard backlog remains 51,575 values plus 201 pending source keys.
  Remaining languages and broader language review stay in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/136928499c46666c85087b89f14465799e80051f">Translate Tigrinya notification settings</a>. Thanks to xet7.</summary>

- Fill 13 English placeholders, preserving existing translations and the
  due-date reminder/@mention exception.
- Shared notification checks now cover 51 locales. Feature, all-locale
  structure and human-preference checks pass. Browser scenarios are
  syntax-checked only. Technical wording is provisional pending speaker
  review; vocabulary references are recorded in the audit.
- The standard backlog remains 51,575 values plus 201 pending source keys.
  Remaining languages and broader language review stay in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c6839432bfc15a4182bc731f009adc3e046e9cab">Translate Dzongkha notification settings</a>. Thanks to xet7.</summary>

- Fill 13 English placeholders, preserving existing translations and the
  due-date reminder/@mention exception.
- Shared notification checks now cover 50 locales. Feature, all-locale
  structure and human-preference checks pass. Browser scenarios are
  syntax-checked only. Technical wording is low confidence pending speaker
  review; vocabulary references are recorded in the audit.
- The standard backlog remains 51,575 values plus 201 pending source keys.
  Remaining languages and broader language review stay in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/161bca4aab0a27fea791766252cfc6076684c465">Translate Tibetan notification settings</a>. Thanks to xet7.</summary>

- Fill 13 English placeholders, preserving existing translations and the
  due-date reminder/@mention exception.
- Shared notification checks now cover 49 locales. Feature, all-locale
  structure and human-preference checks pass. Browser scenarios are
  syntax-checked only. Technical wording is provisional pending speaker
  review; vocabulary references are recorded in the audit.
- The standard backlog remains 51,575 values plus 201 pending source keys.
  Remaining languages and broader language review stay in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/96c33f68d5e0337a9fcf1826fa16f6c26b21fc95">Translate Acehnese notification settings</a>. Thanks to xet7.</summary>

- Fill 13 English placeholders, preserving existing translations and the
  due-date reminder/@mention exception.
- Shared notification checks now cover 48 locales. Feature, all-locale
  structure and human-preference checks pass. Browser scenarios are
  syntax-checked only. Technical wording is low confidence pending speaker
  review; vocabulary references are recorded in the audit.
- The standard backlog remains 51,575 values plus 201 pending source keys.
  Remaining languages and broader language review stay in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b9a183544df25ff9bdf0d38a777edcffb625558f">Translate Northern Sámi notification settings</a>. Thanks to xet7.</summary>

- Fill 13 English placeholders in Northern Sámi, preserving existing
  translations and the reminder/@mention exception to muting.
- Shared notification coverage now checks 47 locales. Feature, all-locale
  structure and human-preference checks pass. Browser mute/unmute scenarios
  are syntax-checked only. Technical wording is low confidence pending
  speaker review; vocabulary references are recorded in the audit.
- These values belong to pending source keys, so the standard backlog
  remains 51,575 values plus 201 pending source keys. Remaining languages
  and broader language review stay in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/28fad83e87abe12839b84674f5b5db800589b3a2">Translate Venda and Venetian notification settings</a>. Thanks to xet7.</summary>

- Fill 26 English placeholders across Venda and Venetian, preserving the
  reminder/@mention exception. Correct six Zulu/Afrikaans labels in Venda.
  The registry identifies `ve-CC` as Venetian and `ve-PP` as Veps.
- Shared notification coverage now checks 46 locales and rejects the six
  old wrong-language labels. Feature, all-locale structure and human-preference
  checks pass. Browser scenarios are syntax-checked only. Technical wording
  is low confidence pending speaker review; references are in the audit.
- The standard backlog remains 51,575 values plus 201 pending source keys.
  Remaining languages and broader language review stay in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8c3b630cec187a3dd64afd7e6ccf5a0f9786d04f">Translate Buryat, Sakha and Chuvash notification settings</a>. Thanks to xet7.</summary>

- Fill 39 English placeholders across Buryat, Sakha and Chuvash, preserving
  existing translations and the reminder/@mention exception to muting.
- Shared notification coverage now checks 44 locales. Feature, all-locale
  structure and human-preference checks pass. Browser mute/unmute scenarios
  are syntax-checked only. Technical wording is low confidence pending
  speaker review; vocabulary references are recorded in the audit.
- These values belong to pending source keys, so the standard backlog
  remains 51,575 values plus 201 pending source keys. Remaining languages
  and broader language review stay in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/33831dc768fe6618d0545641e9a7598606b73bb4">Translate Aromanian notification settings</a>. Thanks to xet7.</summary>

- Fill 13 English placeholders in Aromanian, preserving existing translations
  and the reminder/@mention exception to muting.
- Shared notification coverage now checks 41 locales. Feature, all-locale
  structure and human-preference checks pass. Browser mute/unmute scenarios
  are syntax-checked only. Technical wording is low confidence pending
  speaker review; vocabulary references are recorded in the audit.
- These values belong to pending source keys, so the standard backlog
  remains 51,575 values plus 201 pending source keys. Remaining languages
  and broader language review stay in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/91c6e2ec7e719cc28c956e4b19042e464a00752e">Translate Wolof and Ewe notification settings</a>. Thanks to xet7.</summary>

- Fill 26 English placeholders across Wolof and Ewe, preserving existing
  translations and the reminder/@mention exception to muting.
- Shared notification coverage now checks 40 locales. Feature, all-locale
  structure and human-preference checks pass. Browser mute/unmute scenarios
  are syntax-checked only. Technical wording is low confidence pending
  speaker review; vocabulary references are recorded in the audit.
- These values belong to pending source keys, so the standard backlog
  remains 51,575 values plus 201 pending source keys. Remaining languages
  and broader language review stay in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/173ce86ceb83a4dabbc5e8a5b16258084914632a">Translate Akan, Luganda and Bambara notification settings</a>. Thanks to xet7.</summary>

- Fill 39 English placeholders across Akan, Luganda and Bambara, preserving
  existing translations and the reminder/@mention exception to muting.
- Shared notification coverage now checks 38 locales. Feature, all-locale
  structure and human-preference checks pass. Browser mute/unmute scenarios
  are syntax-checked only. Technical wording is low confidence pending
  speaker review; vocabulary references are recorded in the audit.
- These values belong to pending source keys, so the standard backlog
  remains 51,575 values plus 201 pending source keys. Remaining languages
  and broader language review stay in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7d2b5f717c9dc847cf1e0ff18b75b91f668ba27d">Translate Manx, Walloon and Waray notification settings</a>. Thanks to xet7.</summary>

- Fill 39 English placeholders across Manx, Walloon and Waray-Waray.
  Preserve existing translations and the reminder/@mention exception.
  The registry identifies `wa-RR` as Waray-Waray, distinct from Walloon.
- Shared notification coverage now checks 35 locales. Feature, all-locale
  structure and human-preference checks pass; browser mute/unmute scenarios
  are syntax-checked only. Technical wording is low confidence pending
  speaker review; references are recorded in the translation audit.
- These values belong to pending source keys, so the standard backlog
  remains 51,575 values plus 201 pending source keys. Remaining languages
  and broader language review stay in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/279fbe4c5eef0286626fe31aa53a5841f3ca608f">Translate Oromo, Fijian and Tongan notification settings</a>. Thanks to xet7.</summary>

- Fill 39 English placeholders while preserving existing translations.
  Distinguish members from assigned workers and retain the reminder and
  @mention exception when activity categories are muted.
- Extend shared feature coverage to 32 locales. Feature, locale structure
  and human-preference checks pass. Browser mute/unmute scenarios check
  all new strings; syntax checks pass, but browser execution was unavailable.
  Provisional technical wording is documented for speaker review.
- These values belong to pending source keys, so the standard 51,575-value
  backlog is unchanged. Other languages and the broader audit remain open
  in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e656bc76aa9db465990a0927c4a81287f3939924">Translate Northern Sotho and Tsonga notification settings</a>. Thanks to xet7.</summary>

- Fill 26 English placeholders while preserving existing translations.
  Distinguish members from assigned workers and retain the reminder and
  @mention exception when activity categories are muted.
- Extend shared feature coverage to 29 locales. Feature, locale structure
  and human-preference checks pass. Browser mute/unmute scenarios check
  all new strings; syntax checks pass, but browser execution was unavailable.
  Provisional technical wording is documented for speaker review.
- These values belong to pending source keys, so the standard 51,575-value
  backlog is unchanged. Other languages and the broader audit remain open
  in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/14be365fbc92b174de3b99d4072424f1e830589c">Translate Yiddish, Northern Ndebele and Swati notification settings</a>. Thanks to xet7.</summary>

- Fill 39 English placeholders while preserving existing translations.
  Distinguish members from assigned workers and retain the reminder and
  @mention exception when activity categories are muted.
- Extend shared feature coverage to 27 locales. Feature, locale structure
  and human-preference checks pass. Browser mute/unmute scenarios check
  all new strings; syntax checks pass, but browser execution was unavailable.
  Provisional technical wording is documented for speaker review.
- These values belong to pending source keys, so the standard 51,575-value
  backlog is unchanged. Other languages and the broader audit remain open
  in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5f21598c8466bae12ac009b75151169a7412fb78">Translate Konkani and Moroccan Arabic notification settings</a>. Thanks to xet7.</summary>

- Fill 26 English placeholders while preserving existing translations.
  Distinguish members from assigned workers and retain the reminder and
  @mention exception when activity categories are muted.
- Extend shared feature coverage to 24 locales. Feature, locale structure
  and human-preference checks pass. Browser mute/unmute scenarios check
  all new labels and explanations; syntax checks pass, but browser execution
  was unavailable. Technical wording remains open to speaker review.
- These values belong to pending source keys, so the standard 51,575-value
  backlog is unchanged. Other languages and the broader audit remain open
  in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6cdbc0b985c1e077e83b96ae8911ed0ccc57d1e6">Translate Bhojpuri, Maithili and Odia notification settings</a>. Thanks to xet7.</summary>

- Fill 39 English placeholders while preserving existing translations.
  Distinguish members from assigned workers and retain the reminder and
  @mention exception when activity categories are muted.
- Extend shared feature coverage to 22 locales. Feature, locale structure
  and human-preference checks pass. Browser mute/unmute scenarios check
  all new labels and explanations; syntax checks pass, but browser execution
  was unavailable. Technical terminology remains open to speaker review.
- These values belong to pending source keys, so the standard 51,575-value
  backlog is unchanged. Other languages and the broader audit remain open
  in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5f1c4f8f97a6c832a0824dadba0b978fb9c1e9ca">Translate Kinyarwanda, Kirundi and Chichewa notification settings</a>. Thanks to xet7.</summary>

- Fill 39 English placeholders while preserving existing translations.
  Distinguish members from assigned workers and retain the reminder and
  @mention exception when muting activity categories.
- Extend shared feature coverage to 19 locales. Feature, locale structure
  and human-preference checks pass. The browser mute/unmute scenario checks
  all new labels and explanations; syntax checks pass, but browser execution
  was unavailable. Technical terminology remains open to speaker review.
- These values belong to pending source keys, so the standard 51,575-value
  backlog is unchanged. Other languages and the broader audit remain open
  in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/01d5eb0002553a7613376b793fe50d56ba87278f">Translate notification preferences into eight more locales</a>. Thanks to xet7.</summary>

- Fill 104 English placeholders in Māori, Samoan, Hawaiian, both Zulu
  locales, Xhosa, Sesotho and Setswana. Preserve existing translations and
  clarify that reminders and @mentions continue when a category is muted.
- Extend shared feature coverage to 16 locales. Feature, locale structure
  and human-preference checks pass. Browser mute/unmute scenarios check
  all new labels and descriptions; syntax checks pass, but browser execution
  was unavailable. Technical terminology remains open to speaker review.
- These values belong to pending source keys, so the standard 51,575-value
  backlog is unchanged. Other languages and the broader audit remain open
  in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/06000469c2842d815bf6338bfa426607eb4b8323">Translate activity notifications into five more languages</a>. Thanks to xet7.</summary>

- Fill 65 English placeholders in Kurmanji, Sorani, Papiamento, Tok Pisin
  and Bislama. Preserve existing translations and explain that reminders
  and @mentions continue when an activity category is muted.
- Extend the shared translation suite to eight locales. Feature, locale
  structure and human-preference checks pass. The browser mute/unmute
  scenario checks all new labels and explanations; syntax checks pass,
  but browser execution was unavailable.
- All values belong to separately tracked pending source keys. The standard
  51,575-value backlog is unchanged; remaining languages and terminology
  review remain open in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/36be01e480044b8238ad6bc8518bb68654e5f681">Translate activity notification settings into three languages</a>. Thanks to xet7.</summary>

- Fill 39 English placeholders in Turkmen, Tatar and Somali. Clarify that
  unchecking a category stops bell/email notifications while due-date
  reminders and @mentions continue. Distinguish members from assignees.
- Add feature coverage for the 13 messages per language. Translation,
  locale structure and human-preference checks pass. The existing browser
  mute/unmute scenario checks the translated strings; syntax checks pass,
  but browser execution was unavailable.
- These values belong to separately tracked pending source keys, so the
  standard 51,575-value backlog is unchanged. Other languages and the
  broader wording audit remain open in TODO Later.

</details>

**Archiving and date filters** - guidance for inactive cards and time ranges.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/48737eb6aff070e26ced0c64cf1f3d01578e9acf">Fill Cherokee archiving translations and verify every locale</a>. Thanks to xet7.</summary>

- Fill the remaining 23 Cherokee English placeholders. All 234 non-English
  locale paths now contain non-English values for the 23-message feature
  group; the three auto-archive keys leave the pending queue.
- Expand the shared suite to discover all locales, compare equivalent
  native decimal digits, and preserve exact placeholder/query syntax.
  Feature, locale structure, human-preference and related Cherokee checks
  pass. Browser coverage includes Cherokee and is syntax-checked only.
- Cherokee technical grammar remains low confidence pending speaker review.
  Audit notes distinguish coverage from language quality. The standard
  backlog is 51,575 values, plus 201 separately tracked source keys; the
  wider translation and semantic audit remain open in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/86ab777a6aebdfb9d6a5bf3764d9a8771534a82f">Translate Inuktitut archiving and date filters</a>. Thanks to xet7.</summary>

- Fill 23 English placeholders with syllabic prose, preserving existing
  translations, exact tokens, numbers and query examples. Audit notes
  record vocabulary references and low-confidence wording for review.
- Extend feature coverage to 68 locales. Feature, script, locale structure,
  Inuktitut progress/list-width and human-preference checks pass. The
  browser mutation scenario includes Inuktitut and is syntax-checked only.
- Reduce the standard backlog by 20 values; three auto-archive values
  belong to separately tracked pending keys. All-language translation
  and language-quality review remain open in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/278be5039212d150e7f1f1e395bdfd31b53dce82">Translate Wolaytta archiving and date filters</a>. Thanks to xet7.</summary>

- Fill 23 English placeholders and repair three English-prefixed time
  labels. Preserve existing feature translations, exact tokens, numbers
  and query examples. Audit notes record sources and low-confidence wording.
- Extend shared feature coverage to 67 locales. Feature, locale structure,
  Wolaytta progress/list-width and human-preference checks pass. The browser
  mutation scenario includes Wolaytta and is syntax-checked only.
- Reduce the standard backlog by 20 values; three auto-archive values
  belong to separately tracked pending keys. All-language translation
  and language-quality review remain open in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ada662a24a917e2e3aee52c7a99016759953bc93">Translate Tamazight archiving and date filters</a>. Thanks to xet7.</summary>

- Fill 23 English placeholders with Tifinagh prose, preserving existing
  translations, numbers, exact tokens and query examples. Audit notes
  record vocabulary evidence and low-confidence wording for review.
- Extend feature coverage to 66 locales. Feature, script, locale structure,
  list-width and human-preference checks pass. The Tamazight browser
  mutation scenario is syntax-checked only.
- Reduce the standard backlog by 20 values; three auto-archive values
  belong to separately tracked pending keys. All-language translation
  and language-quality review remain open in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7fc494025007d6872fd628a5f37cf19173d65956">Translate Tigre archiving and date filters</a>. Thanks to xet7.</summary>

- Fill 23 English placeholders while preserving existing translations,
  numbers, exact tokens and query examples. Audit notes record vocabulary
  evidence and low-confidence grammar requiring speaker review.
- Extend feature coverage to 65 locales. Feature, locale structure,
  Tigre progress/date and human-preference checks pass. The browser
  mutation scenario includes Tigre and is syntax-checked only.
- Reduce the standard backlog by 20 values; three auto-archive values
  belong to separately tracked pending keys. All-language translation
  and language-quality review remain open in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/07f20cf87925b9445fefb147a50abcf781960628">Translate Dzongkha archiving and date filters</a>. Thanks to xet7.</summary>

- Fill 23 English placeholders while preserving existing translations,
  numeric bounds, placeholder tokens and literal query examples. Audit
  notes record vocabulary references and low-confidence wording for review.
- Extend feature coverage to 64 locales. Feature, locale structure,
  Dzongkha progress and human-preference checks pass. The browser mutation
  scenario includes Dzongkha and is syntax-checked only.
- Reduce the standard backlog by 20 values; three auto-archive values
  belong to separately tracked pending keys. All-language translation
  and language-quality review remain open in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5a17ee898e6a0087084b60dc13c6cd90d08c368c">Translate Greenlandic archiving and date filters</a>. Thanks to xet7.</summary>

- Fill 23 English placeholders while preserving existing translations,
  numeric bounds, exact placeholders and literal query examples. Audit
  notes record vocabulary evidence and low-confidence wording for review.
- Extend feature coverage to 63 locales. Feature, locale structure,
  Greenlandic progress/calendar and human-preference checks pass. The
  browser mutation scenario includes Greenlandic and is syntax-checked only.
- Reduce the standard backlog by 20 values; three auto-archive values
  belong to separately tracked pending keys. All-language translation
  and language-quality review remain open in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5c4176bcbfd1c3e75d8ebd7633e5ab423783915f">Translate Nahuatl archiving and date filters</a>. Thanks to xet7.</summary>

- Fill 23 English placeholders, preserving existing translations, exact
  placeholder tokens, numbers and literal query examples. Audit notes
  record vocabulary sources, loans and low-confidence dialect/grammar
  choices requiring speaker review.
- Extend shared feature coverage to 62 locales. Feature, locale structure,
  list-width and human-preference checks pass. The Nahuatl browser mutation
  scenario passes syntax checking only.
- Reduce the standard backlog by 20 values; three auto-archive values
  belong to separately tracked pending keys. All-language translation
  and language-quality review remain open in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/59c0b6a8d8e664ecb13e2faef3f871ffc28cecab">Translate Volapük archiving and date filters</a>. Thanks to xet7.</summary>

- Fill 23 English placeholders and correct date/week/month labels. Keep
  exact placeholder tokens, numbers and literal query examples. Audit
  notes record dictionary evidence and low-confidence wording for review.
- Extend feature coverage to 61 locales. Feature, locale structure,
  related language and human-preference checks pass. The browser mutation
  scenario includes Volapük and passes syntax checking only.
- The standard backlog falls by 20 values; three auto-archive values belong
  to separately tracked pending keys. Further translation and language
  quality review remain open in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/960f063bb321bd71c8f978d017b49ae3ce965346">Translate Sakha archiving and date filters</a>. Thanks to xet7.</summary>

- Fill 23 English placeholders while preserving existing translations,
  numeric bounds, placeholder tokens and literal query examples. Audit
  notes record vocabulary sources and low-confidence wording for review.
- Extend the feature suite to 60 locales. Feature, locale structure and
  human-preference checks pass. The Sakha browser mutation scenario is
  syntax-checked only.
- Reduce the standard backlog by 20 values; three auto-archive values
  belong to the separately counted pending keys. The broader translation
  and language-quality audit remain open in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5c44005eb8462271a0a86fd3a1507e0e20b28911">Translate Acehnese and Bambara archiving and date filters</a>. Thanks to xet7.</summary>

- Fill 46 English placeholders and replace the Indonesian days label in
  Acehnese with `uroe`. Preserve exact placeholders, numeric bounds and
  query examples. Audit notes record sources and low-confidence wording
  that needs speaker review.
- Extend shared feature coverage to 59 locales. Feature, locale structure,
  language and human-preference checks pass. Browser mutation scenarios
  include both languages and pass syntax checking only.
- Reduce the standard backlog by 40 values; six auto-archive values are
  counted separately among pending keys. The broader translation and
  mixed-language audit remain open in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f8868aaf08ba760d476bccc563cb41a9a0e2501f">Translate Akan and Luganda archiving and date filters</a>. Thanks to xet7.</summary>

- Fill 46 English placeholders and correct two unrelated Akan day/list
  labels. Preserve numbers, placeholder tokens and literal query examples.
  Audit notes record terminology sources and low-confidence wording for
  speaker review.
- Extend feature coverage to 57 locales. Feature, locale structure,
  language progress and human-preference checks pass. Browser mutation
  scenarios include both languages and are syntax-checked only.
- The standard backlog falls by 40 values; six auto-archive values belong
  to the separately tracked pending keys. Further translations and the
  mixed-language audit remain open in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5d1980d8952756a5accbd7f59ab58c1ad03d6147">Translate Aymara and Quechua archiving and date filters</a>. Thanks to xet7.</summary>

- Fill 46 English placeholders and repair four basic time labels containing
  English or unrelated prefixes. Preserve literal query syntax and numeric
  bounds. Vocabulary references and low-confidence grammar are documented
  in the translation audit for speaker review.
- Extend the feature suite to 55 locales. Feature, locale structure,
  language progress, list-width and human-preference checks pass. The two
  browser mutation scenarios are syntax-checked, not browser-executed.
- Reduce the standard backlog by 40 values; six auto-archive values belong
  to the separately tracked pending-Transifex keys. The broader translation
  and mixed-language audit remain open in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5e7dd861421d6509cf0a3bd925a9709e957e236a">Translate archiving and date filters into five more languages</a>. Thanks to xet7.</summary>

- Fill 115 English placeholders in Guaraní, Ewe, Wolof, Fulah and Klingon.
  Preserve existing translations, placeholder tokens, numeric limits and
  literal query examples. The standard backlog falls by 100; the other 15
  values belong to separately tracked pending-Transifex keys.
- Extend the shared feature suite to 53 locales and add the five locales to
  the browser mutation scenario. Feature, all-locale structure and
  human-preference checks pass. Browser coverage is syntax-checked only.
- Wording remains low confidence pending speaker review. The translation
  audit records vocabulary sources, dialect concerns and technical compounds
  requiring review. The broader translation backlog remains in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fc48f991937393d9bbbff303d817490024ebf703">Translate archiving and date filters into nine more languages</a>. Thanks to xet7.</summary>

- Fill 207 English placeholders in Tibetan, Buryat, Chuvash, Kashmiri,
  Tigrinya, Manx, Venetian, Veps and Venda. Existing translations, numeric
  limits and literal query examples remain intact.
- Extend the shared archiving/date-filter suite to 48 locales. Key-order,
  placeholder and human-preference checks pass. Browser scenarios cover the
  new labels and setting/clearing the threshold; syntax checks pass, but the
  scenarios were not browser-executed here.
- Wording is provisional and low confidence pending speaker review,
  particularly inclusive ranges and list-age explanations. Audit notes record
  vocabulary sources and older mixed-language values still needing repair.
- The standard backlog falls by 180 values because the 27 auto-archive values
  in this batch belong to the separately counted pending-Transifex keys.
  All-language translation and semantic review remain open in TODO Later.

</details>

**Login settings** - clearer guidance in the Admin Panel.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9cf2455ab5cfbd30f5e8ea658e9eccf5f43c56a9">Fill login-setting messages in every locale</a>. Thanks to xet7.</summary>

- Add the remaining 101 non-English catalogs and align eleven English variants.
  All 234 non-English locale paths now contain the three login-setting keys;
  existing values remain unchanged and completed keys leave the pending queue.
- All 237 translation suites pass. Regression coverage includes native scripts,
  exact placeholders, source order and separate Tigre/Tigrinya and Venda/Zulu
  messages. Browser scenarios remain syntax-checked only.
- Minority-language technical compounds are provisional, especially Cherokee,
  Inuktitut, Tigre, Wolaytta, Aymara, Nahuatl, Tamazight, Veps, Ladin,
  Aromanian,
  Volapük and Klingon. Audit notes retain terminology evidence and older
  mixed-language findings that still need repair.
- The larger all-language backlog and 204 pending source keys remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2f148be4ac975cf61de82e80ded22223e41a8f54">Extend login-setting translations to 32 more locales</a>. Thanks to xet7.</summary>

- Translate the three messages in 31 more physical catalogs and a shared Khmer
  alias, bringing the batch coverage to 133 locale paths.
- Existing translations remain unchanged. Locale-wide key-order, placeholder
  and human-preference checks pass.
- Kyrgyz, Mongolian, Burmese, Khmer, Pashto, Sindhi and Uyghur technical wording
  is provisional and needs speaker review. Remaining locales stay in TODO Later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/30881d1c41d1d22618ecd97810097bc4cea3ad7c">Translate login-setting messages in 101 locales</a>. Thanks to xet7.</summary>

- Add three messages in 100 physical catalogs and one shared regional alias.
  Existing translations remain unchanged; HTTP-header login is explicit.
- Locale-wide key-order and placeholder checks pass, as do human-preference,
  URL-placeholder, menu-wiring and board-item checks.
- Finnish, Arabic and Japanese browser scenarios cover labels, restart guidance
  and clearing a stored secret. Syntax checks pass; browser execution awaits
  Playwright and a running application.
- The remaining languages, pending feature strings and terminology review stay
  open in TODO Later. No translation-completeness claim is made for this batch.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v12.20 2026-10-07 WeKan ® release

**In short:** Makes opening and closing a card on a **large board** fast again:
one card open no longer re-renders every card on the board, and a card opened
by its address no longer rebuilds the board. The **snap** now loads big boards
lazily by default. Also verifies that the reported disclosure of a board's
**domain sharing** (GHSA-r3c4-5xwp-vf54) does not apply.

This release verifies the following security report:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cb703fd326">Confirm the board domains REST route is site-admin only; GHSA-r3c4-5xwp-vf54 does not apply</a>. Thanks to a25370 and xet7.</summary>

GHSA-r3c4-5xwp-vf54 reported that `GET /api/boards/:boardId/domains` checks only
the login, because it calls `Authentication.checkUserId`, so any account could
read any private board's domain sharing. `checkUserId` is the **site admin**
check despite its name: a logged-in caller who is not an admin gets 403. The
route has answered only site admins since #5850 added it; before v12.15 the
check refused `admin === undefined`, and Meteor's `findOneAsync` gives
`undefined` for no match, so it refused everyone else then too. No Hall of Fame
entry, as there is no vulnerability.

The route's OpenAPI description, which said anyone able to read the board may
list the domains, now says site admin, and that members get the list with
`GET /api/boards/:boardId`; `checkUserId` has a comment saying what it is.
`tests/restBoardDomainsAccess.test.cjs` runs the real handler with the real
`Authentication` object: the reporter's non-member, members, ended memberships
and logged-out callers are refused, a missing board answers like an existing
one, and a site admin reads the list. A whole-tree negative test checks that
every REST route with `:boardId` checks that board or a site admin, and that a
login check alone would be caught. The report's proof of concept, run against a
running WeKan in Chromium, WebKit and Firefox, gets 403.

</details>

and fixes the following bugs:

**Large boards** - opening or closing a card took seconds on a big board
([#6745](https://github.com/wekan/wekan/issues/6745)), because one card open
made the browser redo the work of every card on the board.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6d5f24ee27">A card open no longer re-renders every card: lists and cards read only the user fields they use</a>. Thanks to markusst1982 and xet7.</summary>

Opening a card saves when it was last viewed into the user document (#3078).
The board view, which every list's card loop reads, and the helpers each
minicard runs read the WHOLE user document, so that one write re-ran every
list's card loop, and Blaze then re-evaluated every minicard. Measured in the
running app, one card open on a 40-card board caused 37,452 Tracker
invalidations; it now causes 390.

`client/lib/currentUserWith.js` reads the current user with only the fields a
helper needs, and minimongo re-runs such a query only when one of those fields
changes. The board view, feature preview, unread comments, folds, drag
handles, label text, dependency layers, date format, week number, mobile mode
and the admin-only custom field check use it. The "last viewed" write now sets
one entry instead of the whole map, which is capped at 5,000 cards.
`tests/largeBoardCardOpen.test.cjs` checks every such helper and that none
reads the whole user document again.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4387185002">A card opened or closed by its address no longer rebuilds the whole board</a>. Thanks to markusst1982 and xet7.</summary>

A card link, the up/down card keys, back/forward and closing a card opened
from a link all re-rendered the board layout, which re-created every swimlane,
list and minicard. The router now remembers which board is on screen and the
card and board routes reuse it. Another board, a first load and the list and
swimlane links still render.
`tests/playwright/specs/large-board-card-open.e2e.js`
checks in Chromium, Firefox and WebKit that the board survives, that a card on
another board still renders that board, and that a click open and close stay
within a fixed amount of work per minicard.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ecbfe59e50">Closing a card no longer makes every card re-read the current board</a>. Thanks to markusst1982 and xet7.</summary>

The routes cleared the popup card values to null and a card open or close
deleted them. Switching between the two is a change, and the current board is
read through one of them, so every minicard re-ran its board helpers. They are
now always cleared to null, and a test fails if anything deletes them again.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a0f2550e5d">Drag-and-drop options are set only when they change</a>. Thanks to markusst1982 and xet7.</summary>

The card, list and swimlane drag-and-drop setup re-applied its options on
every user or board change, and jQuery UI re-tags every card of a list when
the drag handle option is set, even to the same value: about k² work for k
cards, in every list. Only the options whose value differs are set now. The
swimlanes setup also stopped following the open card.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/96dff057a1">Opening a card no longer leaves a subscription running after it closes</a>. Thanks to markusst1982 and xet7.</summary>

Every card open started one more `unsaved-edits` subscription that nothing
stopped. It now belongs to the card and stops when the card closes.

</details>

**Snap** - how a snap install loads a board's cards.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2122214fb6">The snap now defaults cards-loading to auto, so big boards load only their visible cards</a>. Thanks to markusst1982 and xet7.</summary>

The snap set `CARDS_LOADING=all` whenever `cards-loading` was not set, so every
board on a snap sent all of its cards, comments, checklists and attachment
records to the browser. Every other platform defaults to `auto`: a board with
more than 500 cards loads only the cards currently visible. The snap does too
now, and `snap set wekan cards-loading='all'` still loads everything. The snap
description and help, which pointed at an Admin Panel setting that no longer
exists, are corrected.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.
