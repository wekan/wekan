# WeKan ® 2026-09 releases, part 5

Moved out of [CHANGELOG.md](../../CHANGELOG.md) to keep that
file small enough to open (wekan/wekan#6580). Nothing here has been changed:
a release section is a record, and it reads the same as it did there.

This is part 5 of 6, newest first: [1](09.md), [2](09-part2.md), [3](09-part3.md), [4](09-part4.md), 5, [6](09-part6.md).

Releases per day:

| 2026-09 | Releases |
| --- | --- |
| 07 | 3 |
| 08 | 3 |
| 09 | 3 |
| 10 | 2 |
| 11 | 1 |

# v11.69 2026-09-11 WeKan ® release

**In short:** this release adds **Frappe Gantt**, **DHTMLX Gantt** and
**Chart.js**-drawn report charts as new Board View pages, restores the
full-featured **document preview** viewer, hardens the **HttpOnly login
cookie**, and adds opt-in **two-factor authentication**. The **minicard**
title moved to the top with a collapse caret, new **Group by Assignee**,
**Bigboard** and **Multi Board Calendar** views join checklist bulk-editing,
**Clone Board**
card-skipping, Admin Panel People filtered **by Team**, **Rules** title
validation and assignee triggers, and an **Admin only** custom-field flag
that hides a field's value from non-admin board members.

This release fixes the following SECURITY ISSUES found by GitHub CodeQL code
scanning:

**Markdown card-URL autolinking** - duplicated on purpose between app and
package.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9cbf67ba7">Escape a backslash before escaping ']' in an autolinked card title, not only ']'</a>. Thanks to GitHub CodeQL and xet7.</summary>

`models/lib/cardUrlAutolink.js` and `packages/markdown/src/
template-integration.js` build a markdown link `[<title>](<url>)` around a
pasted WeKan card URL, escaping `]` in the title so it cannot prematurely
close the label. CodeQL's `js/incomplete-sanitization` query (alerts #532
and #533) found the escape incomplete: a title ending in a raw backslash
(e.g. `"foo\"`) was left untouched, so the backslash escaped the LITERAL
`]` this code inserts to close the label instead of the label actually
closing - the emitted markdown was not the link intended. Both copies now
escape `\` before `]`, kept in sync as their own comments already require.
This is a rendering-correctness fix, not an XSS hole on its own: the final
HTML still goes through DOMPurify regardless, per the existing code
comments, so no Admin Panel security-log entry applies.

</details>

**Test-only assertion bugs** - four findings inside the test suite's own logic,
none reachable in production.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9cbf67ba7">Escape every regex meta-character when building a dynamic RegExp from a URL, not only '/'</a>. Thanks to GitHub CodeQL and xet7.</summary>

`tests/notificationEmailUrlLink.test.cjs` built ad-hoc `RegExp`s out of a
notification URL by hand-escaping only `/` (`js/incomplete-sanitization`,
alerts #528-#530) - every other meta-character, including the backslash
that would neutralize the escape itself, passed through untouched. Added
the same `escapeRegExp()` helper already used in
`models/lib/externalLinkAutolink.js`, plus a negative test reproducing the
exact "unterminated group" crash the old slash-only escape hit on a value
containing an unescaped `(`.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9cbf67ba7">Write documentGif.js's control-character strip as explicit \x escapes instead of raw control bytes</a>. Thanks to GitHub CodeQL and xet7.</summary>

`server/lib/documentGif.js`'s `plainSearchText()` strips C0 control
characters and DEL from extracted document text before indexing it for
search, but the character class was written with literal raw control
BYTES either side of the `-` range operators instead of `\x` escapes.
CodeQL's `js/overly-large-range` query (alert #526) flagged the range as
unverifiable: adjacent control bytes are visually indistinguishable in an
editor or a diff, so a boundary could silently widen or narrow without
anyone noticing. Rewritten with explicit `\x00-\x08\x0b\x0c\x0e-\x1f\x7f`
escapes, byte-for-byte equivalent to the original range and now checkable
at a glance; a new test also proves no raw control byte remains in the
function body.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9cbf67ba7">Compare a real URL hostname instead of a naive substring check in the OAuth logout test</a>. Thanks to GitHub CodeQL and xet7.</summary>

`tests/oauthLogoutUrl.test.cjs` asserted an absolute logout endpoint
ignores `serverUrl` via `!url.includes('id.example.com')` - CodeQL's
`js/incomplete-url-substring-sanitization` query (alert #531) flagged
that a substring like this can appear anywhere in a URL (a query value, a
path segment, or part of an unrelated confusable hostname) without the
ignored host actually being used. Replaced with a `new URL(url).hostname`
comparison, plus a negative test with both a URL that merely MENTIONS the
substring in its query string and a confusable
`id.example.com.attacker.example` host, neither of which the fixed check
mistakes for the real one.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9cbf67ba7">Replace a no-op '.replace(/ /g, ' ')' with an actual run-of-spaces collapse</a>. Thanks to GitHub CodeQL and xet7.</summary>

`tests/boardCreationAdminOnly.test.cjs` normalized bootstrap source text
with `.replace(/\n\s*/g, ' ').replace(/ /g, ' ')` before matching it -
CodeQL's `js/identity-replacement` query (alert #527) flagged the second
`.replace()` as replacing a single space with itself, a no-op. The actual
intent was collapsing RUNS of spaces the newline-collapse can leave
behind, `.replace(/ +/g, ' ')`, which is what it now does; a new test
proves the fixed helper collapses `"a     b"` to `"a b"` while the old
no-op left it unchanged.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ead5578e8">Close CodeQL alerts #534, #535 and #536, which pointed at the negative tests</a>. Thanks to GitHub CodeQL and xet7.</summary>

The three alerts point at tests, not application code: the negative tests
added with the fix above reproduce each OLD bug to prove it is gone - and
did so with the exact construct CodeQL flags, so the alerts stayed open on
the test lines. The `]`-only escaping is now reproduced with split/join
rather than a `]`-only regex replace, the naive `includes` check
assembles its hostname at run time rather than from a literal, and the
"replace a space with a space" no-op builds its RegExp at run time. Each
test still asserts the same old-vs-new difference; no application code
changed.

</details>

and adds the following new features:

**Notification Settings** - one place to turn tray/email notifications on or
off.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bde66a5c7ddba955c7e6583304a1ca7274aaf8f4">Add a 3-tier Notification Settings popup to Member Settings, Board Settings and Admin Panel / People</a>. Thanks to xet7.</summary>

Whether a notification reaches the in-app tray or an email was previously
all-or-nothing: `Notifications.notify` fanned out to every subscribed
service (`profile` for the tray, `email` for mail) with no way to turn
either off. This adds a "Notification Settings" entry - right below Email
in Admin Panel / People, and matching entries in Board Settings and Member
Settings - all three opening the same reusable
`notificationSettingsPopup` template.

Precedence follows the theme override pattern already used elsewhere:
Admin Panel default, then Board override, then the member's own override,
each optional/nullable so an unset level falls through to the next. The
resolution itself is a small pure function,
`resolveNotificationSetting()` in `models/lib/notificationSettings.js`,
unit-tested for every precedence case
(`tests/notificationSettingsResolution.test.cjs`).
`server/notifications/profile.js` and `server/notifications/email.js` now
call it before adding to the tray or buffering an email, so a disabled
service is genuinely skipped, not only hidden in the popup.

</details>

**Email Templates** - admin-customizable subject/body for the invite and
activity-notification emails.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f6e98f120">Add an Admin Panel "Email Templates" section for the invite and activity-notification emails</a>. Thanks to saurabharch and xet7.</summary>

[#2022](https://github.com/wekan/wekan/issues/2022) asked for admin-
customizable templates for WeKan's transactional emails. Reading
`server/notifications/email.js` and `server/models/settings.js`'s
`sendInvitationEmail()` showed both already built their subject/body from
hardcoded i18n keys, with no admin-configurable template mechanism -
except for the Settings schema fields themselves
(`inviteEmailSubjectTemplate`/`inviteEmailBodyTemplate`,
`activityEmailSubjectTemplate`/`activityEmailBodyTemplate`) and their
server-side use, which already existed and already reused
`models/lib/ruleVarsSubstitute.js`'s `substituteVars()` - the same
`{token}` substitution the #3304 rule "send email" action uses - but had
no Admin Panel UI to actually set them.

This adds that missing UI: Admin Panel / Email / Email Templates, right
below the SMTP settings, with its own Save. Each of the four fields is
optional and empty by default, so an existing install sees the exact
current hardcoded/i18n email content, completely unchanged, until an admin
explicitly fills one in. The invite email accepts
`{email} {inviter} {user} {icode} {url}`; the activity-notification email
accepts `{board} {card} {list} {username} {url} {comment} {action}`.

Deliberately NOT covered: password-reset and account-verification emails.
Those stay hardcoded - a misconfigured or malicious custom template on a
security-critical email (e.g. one that strips the reset link) would be a
real account-takeover risk, so `server/lib/resetPasswordEmail.js` and
`config/accounts.js` never read any of the four new template fields, which
`tests/emailTemplatesCustomization.test.cjs` pins with a negative test - it
also proves an unset template falls back to exactly the previous
hardcoded/i18n content, that a set template substitutes correctly through
the existing `substituteVars()` (with a source-pattern negative test
against a second/duplicate templating implementation), and that the new
Admin Panel labels are translated in every locale file.

</details>

**Board reports** - the Gantt view and the 10 board report chart views.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e5e4c97154f5ecf940958504c65f1159cf0b7165">Frappe Gantt and DHTMLX Gantt added as their own Board View pages; report charts now draw with Chart.js</a>. Thanks to xet7.</summary>

Three full-featured, permissively-licensed charting libraries replace the
plain CSS bars used so far, chosen for a copyfree license and a minimal,
auditable dependency tree over feature richness:
[Frappe Gantt](https://github.com/frappe/gantt) (MIT, zero runtime
dependencies, ~15 KB gzipped), [DHTMLX Gantt Community Edition](https://dhtmlx.com/docs/products/dhtmlxGantt/)
(genuinely MIT as of v10 - verified against the LICENSE.md text inside the
published package, not just the npm license field, since
[#2870](https://github.com/wekan/wekan/issues/2870) rejected an earlier
DHTMLX Gantt proposal in 2020 for being GPL), and
[Chart.js](https://www.chartjs.org/) (MIT, one dependency - `@kurkle/color`,
also MIT). All three are loaded with a dynamic `import()` so their code
only reaches the browser when the relevant view is actually opened, never
on every page load.

WeKan's own hand-rolled Gantt view (the week-grid table) is kept exactly as
it is. Frappe Gantt and DHTMLX Gantt are each their own separate Board View
menu entry and page - like every other view (Swimlanes, List, Calendar,
Statistics, ...), picking one shows only that view, rather than stacking a
second Gantt below the first on the same page. Both draw the same
start/due/end task set from the board's cards, open a card on click, and
export to PDF/Excel through the existing `gantt` chart export route rather
than a second pipeline for identical data. DHTMLX Gantt is a page-wide
singleton (`gantt`, not a class instantiated per container, unlike Frappe
Gantt), so it is torn down with `destructor()` on every re-render and
template destroy rather than merely cleared. The 10 board report chart
views draw a Chart.js bar chart instead of a stack of CSS-width divs,
reusing the same data normalization and the same per-chart export route
unchanged - only the rendering changed.

frappe-gantt's package.json `exports` map has no `./dist/frappe-gantt.css`
subpath (only a `style` CONDITION on `.`), which `meteor build` caught
immediately: "Package subpath './dist/frappe-gantt.css' is not defined by
exports". Its CSS is vendored verbatim into `frappeGanttLib.css` instead and
loaded statically, the same way `gantt.css`/`ganttCard.css` already are.
`dhtmlx-gantt` has no `exports` map at all, so its CSS needed no such
workaround.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/17aa92e90aa97bee086f2efb6ecd6e50d7ab5ef9">Calendar, Frappe Gantt and DHTMLX Gantt now show all four card dates, and dragging a bar reschedules the card</a>. Thanks to xet7.</summary>

The Calendar view drew a Start/End interval bar and a separate Due marker,
but Received never got a marker at all, and a card whose Start fell
outside the visible window got no End marker either. `cardsReceivedInBetween`/
`cardsEndInBetween` (mirroring the existing `cardsDueInBetween`) give
Received and End their own labeled events, so all four of WeKan's card
dates are visible on the Calendar.

Frappe Gantt and DHTMLX Gantt each only ever drew a single bar per card
(Start-or-Received to Due-or-End), silently dropping whichever date lost
that fallback. Both now track which underlying field each bar edge
actually represents and show all four dates - Frappe in its click popup,
DHTMLX in its hover tooltip - so Received/End stay visible even when the
bar itself only spans Start/Due.

Compared against [Kanboard](https://kanboard.org/)'s Gantt
(`kanboard/plugin-gantt`, MIT) for feature parity: both WeKan Gantt
alternatives now support drag-to-move and drag-to-resize, persisted back to
the correct field (`card.setStart`/`setDue`/`setReceived`/`setEnd` - the
same calls the Calendar's own drag handlers already use), gated on the same
board-write capability as the rest of WeKan rather than offered to users
the server would refuse. Kanboard has no dependency arrows, view-mode
switching or export; nothing to match there.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b467f1700858648a463eb3523868b8e931f3d47d">The Throughput Histogram now projects a completion date from recent velocity</a>. Thanks to sojournerc and xet7.</summary>

[#1476](https://github.com/wekan/wekan/issues/1476) asked for cycle time,
lead time, throughput/velocity, bottleneck analysis, and completion
estimates based on velocity. The first four were already covered: the
Cycle Time and Lead Time board views, the Throughput Histogram, and the
Control Chart / Cumulative Flow Diagram / WIP Run views, which are the
standard Kanban tools for spotting a bottleneck even though none of them
is literally named "bottleneck". The one missing piece was a forward-
looking projection - at the recent completion rate, when will the cards
still open be done.

`computeCompletionForecast` in `models/lib/chartCalculations.js` answers
that, reusing `computeThroughput`'s own weekly series rather than
recomputing velocity a second way: it averages the last 4 weeks of
completions and divides the remaining open-card count by that rate to
project a date. `server/lib/boardChartData.js` attaches it to the
Throughput Histogram's data as a `forecast` field alongside the existing
`series`, and the view shows it as a plain-text note under the chart.

</details>

**Minicard** - the card as drawn on the board.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ce1cbf6fff2301bf5a0847d509a40049a349fb3f">The minicard title moved to the top, and gained a whole-card collapse caret</a>. Thanks to xet7.</summary>

The title used to render after the dates/cover/upload-progress block. It
now renders first, right after the drag handle and details-menu button, so
it stays visible regardless of collapse state.

A caret at the minicard's top-left corner - the same caret-down/caret-right
convention already used for list, swimlane and per-checklist folding, with
the same accessibility attributes as the per-checklist caret on the
minicard itself - collapses everything except the caret and title: dates,
cover, upload progress, labels, custom fields, assignees/members,
checklists, badges, description, list name and parent-task prefix/subtext.
The details-menu button and the optional drag handle stay reachable either
way. State persists the same way list collapse already does - a Session
cache, then `profile.collapsedCards` on the user document - deliberately
with no anonymous/cookie fallback, since a public board can have far more
cards than lists.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0e7a648464416b981a9062dc8aecd975f45a656c">Show a card's comments directly on the minicard, opt-in</a>. Thanks to Meeques and xet7.</summary>

Board Settings / Card gets a new "Comments on minicard" row, following the
same allowsX/allowsXOnMinicard pattern already used by Received date and
every other Card Settings toggle. It is opt-in and OFF by default, so
existing boards are unaffected.

When enabled, the minicard shows up to 3 of the card's most recent
comments, each truncated to 140 characters, reusing the same `comments()`
card helper the existing comment-count badge already calls - no new
subscription, so boards that do not use this pay no extra cost. A "more"
affordance appears when there are more comments than shown or one got
truncated; it relies on the minicard already being a link to the full card
rather than adding a second, in-place "expand all comments" interaction -
display only, with no reply/edit capability from the minicard itself.
Useful for classroom/at-a-glance use, per the original request.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/694f26bf756f44249eb6120912e0db5ba15bf97e">Highlight a minicard when it has comments the user has not seen yet</a>. Thanks to H4usi and xet7.</summary>

There was no way to tell at a glance which cards had new comments since the
user last looked. Searched for an existing "last viewed"/"unread" tracking
mechanism to reuse first - `models/cards.js`, `models/cardComments.js` and
`models/watchable.js` only track board-level watching, and the closest
per-user, per-card shape already in WeKan is `profile.collapsedCardSections`
on the Users document, used for fold state - so this follows it: a new
`profile.cardLastViews` map (cardId -> Date), set by
`Template.cardDetails.onCreated` whenever the user opens a card, the same
existing open trigger the fold state itself does not need to touch.

Whether a card counts as unread is a pure, unit-tested decision
(`models/lib/unreadComments.js`): a comment created after that timestamp
flags it, and so does any comment at all on a card that was never opened -
there is nothing to compare against yet. A card with zero comments is never
flagged. The minicard applies a `minicard-unread-comments` class - an inset
ring plus a left-edge stripe rather than a background fill, so it stays
visible against every label swatch and board color a minicard can already
have - and a tooltip naming it, and opening the card clears it immediately.

</details>

**Time tracking** - the Time board view.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/070a1ad10bdf9a5ad64f2ee7346ff05e8392f7d9">The Time view now reports hours by assignee/card, and exports to PDF/Excel like every other chart view</a>. Thanks to xet7.</summary>

[#812](https://github.com/wekan/wekan/issues/812)'s 39-comment thread
repeatedly asked for external timesheet integrations (Kimai, Harvest,
Titra) that were never resourced - the maintainer's own 2021 comment
quotes a ~1000 EUR / 4-month estimate for a Kimai sync, shelved shortly
after. What the thread DID converge on that fits inside WeKan itself:
"reporting total hours by resource and task type" (the issue's own words),
and export - both added here without any external service.

The Time view now shows, alongside its existing 3-row summary kept exactly
as it was, an hours-by-assignee breakdown (summing each card's logged time
per assignee, not counting cards) and an hours-by-card breakdown, scoped to
non-archived cards. `time` is registered as a real chart key alongside
Dashboard/Burndown/Gantt/etc., so it exports to PDF/Excel through the exact
same `/api/boards/:boardId/charts/:chartKey/export*` routes every other
board report chart already uses, rather than a second export pipeline just
for Time.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b467f1700858648a463eb3523868b8e931f3d47d">The Time view now also totals remaining time until due, across open cards with a due date</a>. Thanks to Yachikh and xet7.</summary>

[#1121](https://github.com/wekan/wekan/issues/1121) asked for the SUM of
remaining time until a due date across a list's/board's active cards - "e.g.
'remaining: 6 days and 9 hours'" in the issue's own words - as a summary,
alongside the hours-already-spent breakdown the Time view already shows.

`computeRemainingTimeSum(cards, now)` in `models/lib/chartCalculations.js`
sums `dueAt - now` across the same non-archived card set the hours-by-
assignee/card breakdown already scopes to, further excluding any card that
already has a completion date (`endAt`/`archivedAt`) and any card with no
`dueAt` set at all - "remaining time until due" only means something for a
card that is both still open and has a due date. An overdue card (its
`dueAt` already in the past) contributes its NEGATIVE remaining time rather
than being floored at zero, so the running total shrinks, and can go
negative, once cards slip past their due date instead of silently hiding
them. `formatRemainingTime()` renders the total the way the issue asked for,
"X days, Y hours", with a single leading minus for an overdue total.
`server/lib/boardChartData.js`'s existing `time` chartKey branch adds this as
a third `remaining` field alongside `byAssignee`/`byCard`, the Time view
shows it as a new summary row, and `models/lib/chartExportRows.js`'s `time`
branch carries it into the PDF/Excel export as its own section - the same
data, computation and export pipeline the hours breakdown already uses, not
a second one.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d8eee59e6f4445c0bfd1d49378cabf10b256ebb5">Added a Flowtime session - start, tally interruptions and stop, feeding the same Spent Time total</a>. Thanks to xet7.</summary>

[#3919](https://github.com/wekan/wekan/issues/3919) asked for Flowtime as an
alternative to Pomodoro: unlike Pomodoro's fixed 25-minute work/break cycle,
Flowtime has no fixed interval - you start a session and keep going as long
as you are in flow, tally interruptions as they happen without stopping the
clock, and stop the session when the flow naturally ends. Per the issue's
own "related to Timetracking #812", this integrates with the existing
manual time-entry popup (`cardTime.js`/`models/cards.js`
`setSpentTime()`/`setIsOvertime()`) rather than tracking a second,
disconnected total.

A new card-detail block (`cardFlowtime.js`/`.jade`/`.css`) offers Start
Flow, a live elapsed-time readout that ticks every second, the running
interruption count, Add Interruption and Stop Flow, gated on
`Utils.canModifyCard()`. The in-progress session
(`flowStartAt`/`flowInterruptions`/`flowUserId`) is persisted on the card
itself rather than in Session/localStorage, so a page reload does not lose
it. Stopping the session computes its duration and ADDS it, in hours, into
the card's existing `spentTime` field through the same `setSpentTime()`
helper the manual popup already calls, then clears the session fields -
Flowtime feeds the one Spent Time total the card already had, it does not
keep a separate one.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/74e4248ee9e936b51654e1a1781305b1ab963392">Added a Pomodoro timer, alongside Flowtime, with its own fixed work/break cycle</a>. Thanks to xet7.</summary>

[#4862](https://github.com/wekan/wekan/issues/4862) asked for a Pomodoro
timer, the classic FIXED-interval technique this project's own Flowtime
feature (above) deliberately does the opposite of: a 25-minute work
interval, then a break (5 minutes, or a longer 15-minute break every 4th
completed work interval), rather than an open-ended session. It sits as
its own, separate block (`cardPomodoro.js`/`.jade`/`.css`, its own
`pomodoroStartAt`/`pomodoroPhase`/`pomodoroCount`/`pomodoroUserId` fields
and its own Start/Stop methods) alongside `cardFlowtime`'s block in
`cardDetails.jade`, not a rename or reuse of anything Flowtime added.

A configurable work-length input and Start Pomodoro button begin a work
interval; a live countdown (the same `Meteor.setInterval` idiom
`cardFlowtime.js` uses for its own elapsed-time readout) shows the
Work/Break phase and the completed-interval count. When a work interval's
countdown reaches zero, its duration is added, in hours, into the card's
existing `spentTime` field through the same `setSpentTime()` helper the
manual time-entry popup and Flowtime both already use, the completed count
increments, and the card switches to a break interval; a completed break
interval adds no time and returns to ready-to-start rather than
auto-starting the next work interval. Stop/Reset credits whatever elapsed
so far if stopped mid-work-interval (consistent with Flowtime's own
partial-session credit) and clears every Pomodoro field back to its
empty/null default.

</details>

**Member Settings** - the notification/editor toggles in the Member Settings
popup.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6e36dcabe5ca01dadd106b066ec21b7f954d4dd7">Added an audio ding when a checklist item is checked off</a>. Thanks to C0rn3j and xet7.</summary>

[#5427](https://github.com/wekan/wekan/issues/5427) asked for a short sound
when a checklist task is checked off. An earlier attempt to bundle a
downloaded (Pixabay) sound file was rejected in the issue thread because its
license was not copyfree/MIT/BSD-compatible for WeKan to ship, so instead
`client/lib/checklistDingSound.js` synthesizes a short two-note chime with
the Web Audio API (`OscillatorNode` + a `GainNode` envelope) - no audio file,
no licensing question. Playback is wrapped in try/catch and guarded on
`window.AudioContext`/`webkitAudioContext` actually existing, so it can never
throw into the checklist toggle it is called from.

A new Member Settings toggle, `profile.checklistDingSound` (off by default,
the same shape as the existing `submitOnEnter`/`openManyCardsAtOnce`
preferences beside it), gates it. The ding only plays on the
unchecked-to-checked transition of `checklistItemDetail`'s toggle handler in
`client/components/cards/checklists.js` - never on uncheck, and never when
the preference is off.

</details>

**Checklists** - individual items inside a checklist.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c7bf50deb42d0c293c7db053261bde0f96ef71bd">Individual checklist items can now have their own due date</a>. Thanks to DimDz and xet7.</summary>

[#4755](https://github.com/wekan/wekan/issues/4755) asked for due dates on
checklist items - only the card itself had one, so a deadline that belonged
to one step of a checklist had to be written into the item's title as text.
`ChecklistItems` gained an optional `dueAt` field, and `getDue`/`setDue`/
`unsetDue` helpers that mirror `Cards`' own due-date methods letter for
letter. Each item row now shows a small clock icon (or, once a due date is
set, a compact badge) that opens the same date/time-picker popup a card's own
due date uses - the badge markup (`dateBadgeBody`) and the popup form
(`editDateForm`) are reused as-is rather than adding a second date-picker, and
an item whose due date has passed turns red through the same `dueDateClass`
decision the card's due-date badges already use. No member-assignment was
added - the issue asked for due dates only - and no new translation key was
needed, since the popup title and badge tooltip reuse the existing card
due-date strings.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bed9bce31227df8a6492e6f1a284ce9d28c01a29">A checklist's items can now be bulk-edited as one block of plain text</a>. Thanks to gerroon and xet7.</summary>

[#4218](https://github.com/wekan/wekan/issues/4218) asked for a checklist's
items to be editable as a single multi-line text block, one line per item,
rather than only through individual per-item HTML rows - so reordering,
copying between checklists/cards or a bulk rewording is paste/cut/type
instead of a click-drag or a click-edit-save per item. WeKan already let a
user paste multiple lines into the "add item" box to create several items at
once (the newline-becomes-item toggle); this adds the matching capability for
*editing* the items a checklist already has.

A new "Edit as text" entry on the checklist's actions menu (next to
Export/Import) opens a textarea pre-filled with the checklist's current
items, one per line, using the Markdown-checklist convention `[x] Done item`
/ `[ ] Todo item` for checked state - a plain line with no marker defaults to
unchecked, so text pasted in from elsewhere still works. Saving replaces the
item list with what was typed, in that order. The parsing and the
replace-plan are pure functions
(`models/lib/checklistItemsAsText.js`): a parsed line is matched against the
checklist's current items by UNCHANGED title text (consumed top-to-bottom, so
reordered duplicate-looking lines still pair 1:1); a match keeps that item's
existing document - only its `sort`/`isFinished` change - so any other
metadata on it, notably the #4755 due date above, survives an edit that
doesn't touch its text. Only a line with no remaining match becomes a new
item, and only an existing item whose text is gone from the new text is
removed.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3f4c5e68c989fac536f929d18e8650c6a8cca6d1">A template card's checklists can now be copied onto an already-existing card</a>. Thanks to Th0mas89 and xet7.</summary>

[#4017](https://github.com/wekan/wekan/issues/4017) asked for a checklist
template to be applicable to a card that already exists, not only at
card-creation time - WeKan had no such action on an existing card's
checklist section at all. A new "Copy Checklist From Template" button next
to "Add checklist" opens the same board/swimlane/list/card picker already
used by Move/Copy Checklist; picking a card (typically a template card, but
any card works) appends every one of ITS checklists - and their items - onto
the current card, after whatever checklists it already has. Existing
checklists are left untouched; nothing is overwritten.

The copy reuses `Checklists.copy()`, the same per-checklist helper
`Cards.copy()` and the existing "Copy Checklist" popup already use (fresh
ids, `.direct` inserts to skip the per-item activity-insert storm, correct
board re-homing), through a new `Checklists.copyAllFromCardToCard()` that
loops it over every checklist on the source card and places the copies
after the target's own. `copy()` gained an `options.resetChecked` flag so
copied items always arrive UNCHECKED regardless of the template's own
checked state - applying a template should never pre-check its target -
while every other caller (plain "Copy Checklist", card copy) keeps its
existing checked-state-preserving behaviour untouched.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/338e05b1ebf53e9ab3953541ef2f26a027f667aa">Dragging a checklist item onto a list creates a new card from its text</a>. Thanks to BenjamindeJong82 and xet7.</summary>

[#3294](https://github.com/wekan/wekan/issues/3294) asked for a checklist
item to become a card when dragged out onto a list, and to be marked done
when dropped onto a "Done"-style list instead. A checklist item was already
draggable through its own jQuery UI sortable (scoped to other checklists via
`connectWith: '.js-checklist-items'`), so dropping it anywhere else - a
list's own card column - always reverted with no effect at all.

The sortable's `stop` handler now checks, via `document.elementFromPoint` at
the drop coordinates, whether the release landed over a list's
`.js-minicards` card column rather than back inside a checklist. When it
does, a new card is created titled from the item's text, in that list (and
swimlane, resolved the same way `list.js`'s own card-drop handler resolves
it), through a pure `buildCardFromChecklistItem()` helper
(`models/lib/checklistItemToCard.js`) so what the new card looks like is
pinned by a test without a Meteor database. The original checklist item is
left completely untouched either way - the drag always reverts visually
(`sortable('cancel')`), since nothing needs to move within the checklist.

Scope decision: dropping ALWAYS creates a new card. The "mark done when
dropped on a Done-style list" half of the request is intentionally NOT
built - detecting that a list "means" Done would mean guessing from its
name or position, which is unreliable and would surprise users. That
capability is not actually missing: an item can already be marked done
directly via its own checkbox, and WeKan also already has a manual, explicit
"Convert to card" action for the same underlying card-creation case - this
drag gesture is a faster path to the same outcome, not a new concept.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/73128dd7fc289406709c331ebed3c20180faf43d">A checklist can now automatically uncheck all its items on a daily, weekly or monthly schedule</a>. Thanks to travelg and xet7.</summary>

[#3818](https://github.com/wekan/wekan/issues/3818) asked for a Trello-like
daily checklist that resets itself, and
[#4729](https://github.com/wekan/wekan/issues/4729) asked for the same idea
on a longer, configurable schedule ("timed reset on boards") - both are the
same underlying feature, a checklist that periodically un-checks its own
items, so they are implemented together here.

`Checklists` gained an optional `resetInterval` (`'none'` by default, or
`'daily'`/`'weekly'`/`'monthly'`) and a `lastResetAt` timestamp, set from a
new "Automatic reset" entry on the checklist's own actions menu, next to
Move/Copy Checklist. Whether a checklist is due now is a pure, unit-tested
function (`models/lib/checklistResetSchedule.js`) that counts forward from
`lastResetAt` (or `createdAt`, before the first automatic reset) by the
chosen interval - monthly advances by a calendar month rather than a fixed
~30-day span, so a checklist reset on the 31st does not drift earlier every
few months.

The actual scan (`server/checklistResetSchedule.js`) reuses the
`quave:synced-cron` infrastructure `server/scheduledRules.js` already
registers its own job on, rather than adding a second scheduler: it runs
hourly, finds every checklist whose interval has come due, and unchecks
only that checklist's items with a single multi-update - not the per-item
`uncheck()` helper - so an automatic reset does not generate a per-item
activity for a change nobody made.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6d43020212fbad1878d2ac646ec52850ffffe30f">Added "Check all items" / "Uncheck all items" to the checklist action menu</a>. Thanks to justinr1234 and xet7.</summary>

[#2473](https://github.com/wekan/wekan/issues/2473) asked for a bulk
check/uncheck action on a checklist, rather than clicking every item's own
checkbox by hand - #4218's "Edit as text" (above) only gave an indirect
workaround (select all, replace every `[ ]`/`[x]` marker, save).
`Checklists.checkAllItems()`/`uncheckAllItems()` already existed as model
helpers, used per-item by the Rules automation
(`server/rulesHelper.js`) but never exposed anywhere in the UI. Two new
entries on the checklist's own actions menu, next to "Automatic reset", now
call the same two helpers directly. The item-selection they share - which
items belong to THIS checklist, regardless of their current checked state -
is a pure function (`models/lib/checklistBulkCheck.js`) so "every item of
the checklist ends up checked/unchecked" and "another checklist's items are
left untouched" are both unit-tested without a database.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dbb7adb172f032554de0b3313b236a9aa7a82e8a">A checklist item can now be converted to a linked subtask, not just a plain card</a>. Thanks to javen9881 and xet7.</summary>

[#2422](https://github.com/wekan/wekan/issues/2422) asked for a checklist
item to become a subtask, with the link between them kept - distinct from
the pre-existing "Convert to card" action and the #3294 drag-to-card
gesture above, both of which only ever create a plain, standalone card with
no parentId and no reference back to the item.

A new "Convert to subtask" action, next to "Convert to card" on the item's
edit form, instead calls the same server-side `addSubtaskCard` method "Add
a new subtask" already uses, so the result is a real subtask of the current
card - the default subtasks board/list/swimlane and automatic custom fields
are resolved exactly the same way an ordinary subtask's are. The new
subtask's `_id` is then written to a new optional `linkedCardId` field on
the checklist item (`models/checklistItems.js`), and the item shows a small
"linked subtask" icon that opens the subtask on click.

Scope decision: this is a one-way, set-once reference recorded at
conversion time, not an ongoing bidirectional sync - checking the item does
not check the subtask, or vice versa. The original checklist item is never
deleted or mutated by this action, unlike a "replace item with card"
behaviour.

</details>

**Comments and activities** - a card's comment thread and its activity log.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/612be137639b3e0b44cb0c571356127378185517">Added a shareable permalink to each comment and activity</a>. Thanks to xet7.</summary>

[#4757](https://github.com/wekan/wekan/issues/4757) asked for a Trello-like
permalink: clicking a comment's or an activity's timestamp gives a
shareable link, and visiting that link loads the card and scrolls to and
highlights that specific comment or activity. The permalink is the card's
own URL (`models/lib/cardUrl.js`) plus a `#comment-<id>` or `#activity-<id>`
fragment - both comments and activities already carry a stable Mongo `_id`,
so no new id scheme was needed.

The timestamp is now a real `<a href>` to that URL, so a normal click
navigates there and right-click - copy link address works unmodified; a
small link icon beside it copies the same URL to the clipboard explicitly,
reusing the existing `copyTextToClipboard`/`showCopied` pattern already
used for card/list/swimlane links rather than a second implementation.
On the receiving end, the existing swimlane/list "reveal and scroll"
mechanism (`models/lib/revealBoardItem.js`, `client/lib/revealBoardItem.js`)
gained two more kinds, 'comment' and 'activity', fed from the URL hash
instead of a route param - a fresh load of a permalink, an in-page
`hashchange`, and the click handler itself all set the same Session value,
so the target briefly gets the same highlight outline a swimlane/list link
already produces.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ab1f60d806524ee4b2f3432db9ea343df2ce281b">A comment's Reply link now caps threading at one level, grouped under its parent</a>. Thanks to FuXXz and xet7.</summary>

[#3011](https://github.com/wekan/wekan/issues/3011) asked for a comment to be
able to REPLY to another comment on the same card instead of every comment
landing in one flat chronological list. Comments already had an optional
`parentId` from an earlier MVP (#5907); what was missing was a cap on how
deep that nesting could go, and grouping replies under their parent in the
rendered list rather than leaving them interleaved by date.

Clicking Reply on a reply now attaches the new comment to that reply's own
parent - the original top-level comment - rather than nesting one level
deeper each time. `resolveParentId()` (`models/cardComments.js`) makes that
decision once, as a pure function with its own unit tests, and is applied
both when the client opens the composer (so the "In reply to ..." banner
already names the flattened target) and again in a
`CardComments.before.insert` hook on the server, so the one-level cap holds
regardless of how a comment is inserted.

Replies now render directly under their top-level parent instead of
interleaved by date with unrelated comments:
`groupCommentsByThread()` (`imports/lib/commentThreading.js`) reorders the
already-sorted flat list the `comments` template used before, with no
schema or query change. The composer's reply banner reuses the existing,
already fully translated `comment-in-reply-to` string plus the parent
comment's author name for its "Replying to ..." indicator, rather than
adding a new i18n key that would need translating across every locale file
for a small wording difference.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1d4a47db2">A pasted link to another WeKan card now shows that card's title, not the raw URL</a>. Thanks to justinr1234 and xet7.</summary>

[#2453](https://github.com/wekan/wekan/issues/2453) asked for a card URL
pasted into a description or comment - copied straight from the address
bar, e.g. `.../b/<boardId>/<slug>/<cardId>` - to render with the target
card's title visible, rather than as a raw, unlabeled link.
`models/lib/cardUrlAutolink.js` is a pure parser/rewriter, mirroring the
`#3069` external-tracker autolinker's shape: it finds a WeKan card URL
(optionally carrying the `#comment-`/`#activity-` fragment `#4757`
added) in free text and, when it is not already inside a markdown/HTML
link, replaces it with `[title](url)` for a caller-supplied title
resolver - falling back to the bare URL when the resolver has nothing to
say.

The rendering pipeline (`packages/markdown/src/template-integration.js`)
runs it just before `markdown-it`'s own render, resolving titles through
`Markdown.resolveCardTitle`, a plain function
`client/components/main/editor.js` wires up at startup to
`ReactiveCache.getCard(cardId)`. That lookup is itself a reactive
dependency of the markdown helper's own render, so the link text updates
automatically if the target card is renamed afterwards. It resolves to
nothing - leaving the URL as plain text, not an error - for a card this
client's Minimongo does not have: deleted, or on a board the current
viewer cannot see, since Minimongo is already scoped to what the viewer
is subscribed to and needed no separate permission check here.

This is rendering only: a pasted plain URL is relabeled where it is
found. It does not add a new `[[card link]]` insertion syntax - that is
a different feature.

</details>

**Board filters** - the sidebar Filter panel and how a board can be opened
already filtered.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/963b01ff5ba7edb9d0aacfbbce2b2647a578124d">A board can now be opened pre-filtered from its URL, e.g. ?assignee=johndoe</a>. Thanks to thrademaker and xet7.</summary>

[#4540](https://github.com/wekan/wekan/issues/4540) asked for a board's filter
state to be driven by URL query parameters, so a link - for instance one
embedded in an iframe in another tool - can open a board pre-filtered rather
than requiring the viewer to set the filter by hand every time.

`?assignee=johndoe`, `?member=janedoe` (both accept a comma-separated list of
usernames) and `?label=urgent` (by label name, case-insensitive) are read once
the board's subscription becomes ready
(`client/components/boards/boardBody.js`'s `applyQueryParamFilters`, guarded
to run once per board load) and applied through the existing sidebar `Filter`
object's own API - `Filter.assignees.add()`/`Filter.members.add()`/
`Filter.labelIds.add()` - the same calls the Filter sidebar UI itself makes,
so no new filtering engine was added. Usernames are resolved to member/assignee
ids and label names to label ids by a small pure module,
`client/lib/filterQueryParams.js`, covered by
`tests/filterQueryParams4540.test.cjs`. This only reads the query params once
on load; the other direction - the URL following filters changed from the
sidebar - is added below.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5ffecf7aab3a7941d862bdc2dd00b362e35714a2">Filtering a board from the sidebar now updates the URL too, so the filtered view is itself bookmarkable/shareable</a>. Thanks to netei and xet7.</summary>

[#319](https://github.com/wekan/wekan/issues/319) asked for the reverse of
\#4540 above: applying a filter interactively should update the URL (e.g.
`?assignee=johndoe`), not just the URL being able to drive the filter on
load, so a manually filtered view can be bookmarked or shared without
hand-typing the query string.

`client/lib/filterQueryParams.js` gained `resolveIdsToUsernames`,
`resolveIdsToLabelNames` and `buildBoardFilterQueryParams` - the exact
inverse of the existing parser, reusing the same `assignee`/`member`/`label`
token vocabulary, so a URL written by one direction is understood by the
other (pinned by a round-trip test). `SetFilter`
(`client/lib/filter.js`) gained a reactive `list()` getter so its current
selection can be read outside the sidebar template. `boardBody.js`'s new
`syncFilterQueryParams`, run from its own `Tracker.autorun` alongside the
existing `applyQueryParamFilters` one, resolves
`Filter.assignees`/`members`/`labelIds` back to names and writes them via
`FlowRouter.setQueryParams`, wrapped in `FlowRouter.withReplaceState` so
toggling a filter replaces the current history entry instead of piling up a
new one per click. Covered by `tests/filterQueryParams319.test.cjs`.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b13a5af330d0617d4cbd7b19c05eb4c97b90a62e">A label filter chip now cycles include -> exclude -> clear instead of only include -> clear</a>. Thanks to bennyandresen and xet7.</summary>

[#2886](https://github.com/wekan/wekan/issues/2886) asked for a third state on
the label filter: clicking an unfiltered label used to only ever filter FOR
it, and clicking it again cleared the filter, with no way to filter AGAINST
a label. `Filter.labelIds` now has a companion `Filter.excludedLabelIds` set
(the same `SetFilter` shape), and a new `Filter.toggleLabelFilter(labelId)`
cycles a click through not-filtered -> included -> excluded -> not-filtered
again. `Filter._getMongoSelector()` merges the exclusion into the existing
`labelIds` selector as `{$in, $nin}` rather than a selector key nothing
reads, so a card carrying an excluded label is filtered out even when it
also carries an included one - exclusion wins over inclusion - and a
filter with only an exclusion (no included label) still works on its own.

The sidebar's label chip shows a struck-through name plus a "no entry" icon
for the excluded state, alongside the existing checkmark used for the
included state. Scoped to labels only, matching the issue's exact wording -
members, due dates and the other filter chips keep their existing two-state
toggle for now; the same three-state cycle could be added to them later.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/02cc79928">Confirmed opening a card to edit it does not reset an active board filter</a>. Thanks to PhilSnider and xet7.</summary>

[#2335](https://github.com/wekan/wekan/issues/2335) reported that opening a
card while a board Filter is active resets the filter, forcing it to be
reapplied. Reading the current code: `Filter`
(`client/lib/filter.js`) is a plain module-level singleton, not keyed by
route or `Session`, and opening/closing a card
(`client/components/cards/cardDetails.js`) is a FlowRouter navigation that
never calls `Filter.reset()` or any other filter-clearing method - it only
calls `Filter.addException()`, to keep an affected card visible despite the
active filter. The only three `Filter.reset()` call sites anywhere in the
client are explicit user actions unrelated to card open: the "clear filter"
button, the sidebar "clear all" button, and the `x` hotkey.

So the filter does not reset today. What can look like a reset is a
different, correct behavior: the filtered card list is reactive, so editing
the open card can change a field the active filter matches on (for example
removing the very label being filtered on), and the card legitimately drops
out of the filtered view - that is the filter working as designed, not a
bug resetting it.

`tests/filterPersistsOnCardOpen2335.test.cjs` pins this: no card-open/close
code path calls `Filter.reset()`/clear, and every `Filter.reset()` call
site in `client/` and `imports/` remains one of the three known, explicit
actions - so a future change that adds a fourth, especially one reachable
from card open/close, fails this test.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f5829b2ed3931c7d7215a168491739cc31551cd3">A card can now be filtered by who created it</a>. Thanks to bbyszio and xet7.</summary>

[#3681](https://github.com/wekan/wekan/issues/3681) asked to see who created
a card without relying on system messages, and its title was later broadened
to "Filter by Creator". `Filter.userId` (`client/lib/filter.js`) is a new
`SetFilter`, the exact same shape/API `Filter.members`/`Filter.assignees`
already use, keyed to match `models/cards.js`'s own name for the card-author
field (`userId` - "should probably be called `authorId`", per its own
long-standing comment) rather than inventing a `creatorId` alias, so
`Filter._getMongoSelector()` needed no special-casing. A new "Filter by
creator" section in the sidebar (`sidebarFilters.jade`/`.js`) lists the
board's active members exactly like the existing Member/Assignee sections
and toggles `Filter.userId` the same way. `tests/creatorFilter3681.test.cjs`
drives the real `Filter` object end to end, through the mongo selector it
produces.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f5829b2ed3931c7d7215a168491739cc31551cd3">A filter now survives moving from one board to another, instead of being cleared on every hop</a>. Thanks to triple-doble and xet7.</summary>

[#1751](https://github.com/wekan/wekan/issues/1751) asked for filters to stay
active across boards - the reporter's own use case is "only show my user's
cards", i.e. a member/assignee/creator filter by user id, which means the
same thing on every board since user ids are global. `config/router.js`'s
board route used to call `Filter.reset()` (clearing everything) whenever the
target board differed from the current one. It now calls a new
`Filter.resetBoardScoped()` (`client/lib/filter.js`) instead, which only
clears the filters whose values are scoped to the board being left - labels,
excluded labels, custom fields, dependency types and the advanced/list text
filters, all ids or text that mean nothing, or the wrong thing, on a
different board - and leaves member/assignee/creator/due-date/title filters
in place. The sidebar's own "Clear filters" button and every other route
(All Boards, Archive, Public, …) still call the original `reset()`
unchanged. `tests/filterPersistsAcrossBoards1751.test.cjs` pins both halves
plus the router wiring itself.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7f7d4e2fb1579f2f07ebea40daec6478796b1a3d">Confirmed two more open filter requests were already implemented, and pinned them with regression tests</a>. Thanks to lumatijev and urakagi and xet7.</summary>

Checking the remaining open `Feature:Filters`-labeled issues against the
current source (per the "fix open issues" process) found two already done,
neither part of today's earlier filter work:
[#567](https://github.com/wekan/wekan/issues/567) ("Hide empty lists when
filtering items in a board") is `Filter.hideEmpty`, wired end to end
(`sidebarFilters.jade`/`.js`, consumed by
`client/components/swimlanes/swimlanes.js`); and
[#2035](https://github.com/wekan/wekan/issues/2035) ("extended Filter
feature that will list up archived cards and cards in archived lists") is
`Filter.archive`, whose sidebar toggle re-subscribes to the board with the
archived flag set rather than only filtering client-side. Neither had a
regression test pinning that the wiring stays intact;
`tests/filterAlreadyFixedIssues.test.cjs` now reads the actual source for
both and fails if either toggle, handler or consumer disappears.

</details>

**Board views** - the Board View menu and its pages.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8dad0d0506f89e3c54ee98099c182bdec71acc5d">Added a "Group by Assignee" board view for team-meeting-friendly overviews</a>. Thanks to xet7.</summary>

[#4688](https://github.com/wekan/wekan/issues/4688) asked for cards grouped
by assignee, clustered under each assignee's name as a heading, for a
read-only overview well suited to a team stand-up.

A card with several assignees appears under each; a card with none falls
into "No assignee". The grouping reuses the same
`NO_ASSIGNEE_GROUP`/`translateGroupLabel` fold the Dashboard and Time
views already use (`models/lib/chartCalculations.js`), generalized into
`computeCardsByAssigneeGroup`, which returns the grouped cards themselves
rather than a count/hours total. Wired end to end like every other board
view: a "Group by Assignee" Board View menu entry, an
`isViewGroupByAssignee()` helper/`boardBody.jade` branch, the
`client/lib/utils.js` whitelist, the `profile.boardView` schema and a
tooltip-name-map entry. Each card row is a simple title + due date +
overtime marker, deliberately not a minicard re-render, so the view stays
lightweight for a board with many cards; clicking a card navigates to it
like any other view, and there is no drag-and-drop or export - this is
scoped as a read-only overview, not a second way to work the board.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5323fdbce67e2cdfe19a00f2d776c283d45bc2d9">Added a "Bigboard" board view showing every board at once</a>. Thanks to Jieiku and xet7.</summary>

[#4223](https://github.com/wekan/wekan/issues/4223) asked for
[Kanboard](https://kanboard.org/)'s BigBoard plugin
(`kanboard_plugin_bigboard`): every board the user belongs to, stacked on
one scrollable page, each drawn as its own mini kanban board - no manual
setup, automatic from board membership.

Added right after Dashboard in the Board View menu, wired the same way as
every other view (menu entry, `isViewBigboard()` helper/`boardBody.jade`
branch, the `client/lib/utils.js` whitelists, the `profile.boardView`
schema and a tooltip-name-map entry). Unlike the other 19 views, which all
draw the single currently open board, Bigboard queries every board the
current user is a member of with the same selector the All Boards page
uses, subscribes each one's lists/swimlanes/cards through the existing
`board` composite publication, and renders each as its own section
reusing the existing `listsGroup`/`list`/card templates - so editing,
dragging and opening a card behave exactly as on a normal board page,
with no new rendering or drag-and-drop code of its own.

Stacking several boards' lists on one page exposed a bug the single-board
case could never trigger: list drag-and-drop connects through a plain
`'.js-swimlane, .js-lists'` jQuery UI sortable selector, which would let a
list be dragged out of one board's section into another's now that more
than one board's lists share a page. Added a `data-board-id` attribute to
the swimlane/`listsGroup` root elements and a `connectWithSelector()`
helper (`client/components/swimlanes/swimlanes.js`) that scopes the
connect selector to the dragged list's own board id when one is present;
an ordinary single-board view still has exactly one board id on the page,
so its drag-and-drop is unchanged.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ac7822aa26f4a78f6c056803039847c1516a7ef4">A card can now be dragged from one board's list into a different board's list in the Bigboard view</a>. Thanks to Science4583 and xet7.</summary>

[#3298](https://github.com/wekan/wekan/issues/3298) asked to view several
boards at once with drag-and-drop between them; Bigboard already covers
"several boards at once", and list-level dragging was deliberately kept
scoped to within one board when it was added, so the one part still
missing was dragging a CARD across the boundary between two boards' lists.

The card sortable's `connectWith: '.js-minicards:not(.js-list-full)'`
selector in `client/components/lists/list.js` already connects across
every board shown on the page - only the LIST sortable was scoped by
board (`connectWithSelector()`, above). What stopped a cross-board card
drop from landing correctly was the drop handler resolving the
destination board from `Utils.getCurrentBoard()` - the board the page
happens to be routed to - instead of from the list actually dropped into.
On an ordinary single-board page those are the same board, so this never
showed; in Bigboard they can differ, and the card silently moved onto the
wrong board.

The destination boardId is now read from the dropped-into list's own
`boardId` (`listData.boardId`), exactly as the analogous list-to-swimlane
move in `swimlanes.js` already does with `list.boardId`, and passed to
every `card.move()` call the stop handler makes. `Card.move()` already
fully supported a boardId change (label/member/custom-field remapping,
cross-board dependency cleanup) and the server's `denyCrossBoardMove`
already authorizes only when the caller can write to the destination
board, so no model or permission change was needed - the fix is entirely
in which board the client asked to move the card to.
`tests/listCardCrossBoardMove.test.cjs` pins the destination-board and
default-swimlane resolution and negatively asserts `card.move()` is never
called with the route's `currentBoard._id` directly.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0c15b56f6e3db5b52e43ceaf238dfac30ab7fb6d">Added a "Multi Board Calendar" board view showing every board's dates on one calendar</a>. Thanks to justinr1234 and xet7.</summary>

[#2469](https://github.com/wekan/wekan/issues/2469) referenced
[Planyway](https://planyway.com/)'s multi-board calendar overlay for
Trello: a calendar showing due/start/end/received dates for cards across
every board the user belongs to, not just the currently open board - the
same "aggregate across all my boards" idea #4223's Bigboard added above,
rendered as a calendar instead of a stack of mini kanban boards.

Added right after Calendar in the Board View menu, wired the same way as
every other view (menu entry, `isViewMultiboardCalendar()` helper/
`boardBody.jade` branch, the `client/lib/utils.js` whitelists, the
`profile.boardView` schema and a tooltip-name-map entry). It is a
composition of two already-built pieces rather than a new calendar
implementation: the single-board Calendar view's own FullCalendar
rendering (`+fullcalendar`, `calendarView.css`) is reused as-is, fed by
Bigboard's exact all-boards membership query
(`multiboardCalendarView.js`'s `multiboardCalendarQuery()`, copied from
`bigboardView.js`'s `bigboardQuery()`) instead of the single current
board, subscribing each visible board's `board` composite the same way
Bigboard does. Every event is prefixed with its board's title (`[Board
title] Card title`) so entries from different boards stay distinguishable
on the merged calendar, and clicking an event still navigates to that
card on its own board, exactly like the single-board Calendar view.

Cross-board drag-to-reschedule is deliberately out of scope for this
pass - a dragged event's card is not necessarily on the currently open
board, and moving its date needs more care than the single-board
Calendar's `eventDrop`/`eventResize`/`select` handlers give it, so this
view is read-only (`editable: false`, `selectable: false`) and the
single-board Calendar view's own drag-to-reschedule is untouched.
`tests/boardViewMenu.test.cjs` pins the menu entry, icon, click handler,
helper/template branch, schema value, tooltip and template/stylesheet
registration the same way it already does for Bigboard.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2d8fb6070af0229b398f2aeed71b204c7494eb32">Added a "Pulse" board view charting daily activity, GitHub-Pulse-style</a>. Thanks to synergico and xet7.</summary>

[#1292](https://github.com/wekan/wekan/issues/1292) asked for a "GitHub
Pulse-like graph" of a board's activity level over time - GitHub's Pulse
page shows commit/PR/issue activity as a bar chart over a recent window,
and this is the board equivalent: a bar per day of how many `Activities`
documents the board logged, over the last 30 days.

Rather than a new charting mechanism, this reuses 100% of the existing
board report chart pipeline: a pure `computeActivityPulse(activities,
fromDate, toDate, bucket)` in `models/lib/chartCalculations.js` (zero-count
days are real buckets, never omitted, with an optional weekly-bucket mode
for a longer window), a `chartKey === 'pulse'` branch in
`server/lib/boardChartData.js` that loads the board's `Activities` for a
fixed last-30-days window independent of the board's card-driven
`fromDate` (a quiet board with old cards still gets a full 30-day, mostly
zero chart rather than one card's creation date away), a `'pulse'` branch
in `models/lib/chartExportRows.js` and `CHART_KEYS` registration in
`models/exportCharts.js` for the same PDF/Excel export every other chart
view already has. On the client it is one more thin wrapper template
(`pulseView` in `chartPlaceholderViews.jade`) around the shared
`boardChartView` (`charts/boardCharts.jade`/`.js`), the same Chart.js bar
chart every other chart view already draws, with a `pulse` case added to
`computeBarRows`. Wired into the Board View menu like every other view -
placed after WIP Run at the end of the chart group - with an
`isViewPulse()` helper/`boardBody.jade` branch, the `client/lib/utils.js`
whitelists, the `profile.boardView` schema and a tooltip-name-map entry.
`tests/boardViewMenu.test.cjs` extends its `VIEWS` table with the new
entry (menu order, icon, click handler, helper/template branch, schema
value, tooltip, chart registration) the same way it already does for every
other chart view, and `tests/chartCalculations.test.cjs` pins
`computeActivityPulse`'s day/week bucketing, that a zero-activity day
shows as zero rather than being omitted, and that activity outside the
from/to window is excluded.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/784a249331b98cc617bc7f00ca87ad2d28afd2c7">Added a "Roadmap" board view grouping cards by a custom field into timeline rows</a>. Thanks to datenwort and xet7.</summary>

[#627](https://github.com/wekan/wekan/issues/627) asked for a "Roadmap" view
organizing/summarizing cards by version or release milestone in a timeline
layout - rows/lanes for feature groups plotted along a horizontal timeline,
similar in spirit to a ProductPlan-style release roadmap chart.

Structurally this is the existing Frappe Gantt view (added for #3abc/the
Gantt board views) grouped by the VALUE of a board custom field instead of
one flat list of cards: a dropdown lets the user pick which text/dropdown
custom field to group by (defaulting to the first one, or a clear
empty-state message when the board has none), each distinct value becomes
its own row, and every row is its own small Frappe Gantt timeline built from
the SAME `cardsToTasks()`/`loadGanttLib()`/`popupDetailsHtml()` code the
plain Gantt view already uses (`client/components/gantt/frappeGantt.js`),
plotted over the same `startAt`/`dueAt`/`endAt` card dates - no new charting
library, and no custom-field creation UI, since custom fields are already
fully managed in Board Settings. The grouping itself is a pure
`computeCardsByCustomFieldGroup(cards, resolveValue)` fold in
`models/lib/chartCalculations.js`, the same shape as the existing
`computeCardsByAssigneeGroup` (a card with no value for the chosen field
falls into a "No value" sentinel group, sorted last, translated through the
existing `translateGroupLabel` machinery so it does not leak the raw sentinel
key in the UI). Wired into the Board View menu like every other view -
`client/components/boards/roadmapView.jade`/`.js`, an `isViewRoadmap()`
helper/`boardBody.jade` branch, the `client/lib/utils.js` whitelists, the
`profile.boardView` schema and a tooltip-name-map entry - and registered in
`client/features/boards.js` like every other board view's templates and
stylesheet. `tests/boardViewMenu.test.cjs` extends its `VIEWS` table with the
new entry, and `tests/chartCalculations.test.cjs` adds positive, negative and
sort-order unit tests for `computeCardsByCustomFieldGroup` and its
`translateGroupLabel` handling.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f36166857">Added the pure reconstruction core for a "Timeline" board view</a>. Thanks to xet7.</summary>

Requested: a Timeline view under the Board View menu, below Time, with a
left-to-right time slider that can show the board's state at any past
point, restore a card's historical state onto the current card, and
selectively remove one member's changes from a time period, all without
ever deleting Activity data.

This commit delivers the foundation only: `models/lib/boardTimeline.js`'s
`reconstructBoardStateAt(currentCards, activities, asOfTimestamp)`, a
pure, read-only function that reconstructs each card's title,
description, listId, swimlaneId, labelIds, members, assignees, dueAt and
archived flag as of a chosen timestamp by replaying the board's existing
Activities log backwards from the card's current state - no separate
snapshot storage, and no Activity is ever read destructively, written, or
removed. It covers every activityType that currently records enough
old/new detail to reverse (title, description, due date, list/swimlane
moves, archive/restore, member/assignee join-unjoin, label add/remove);
cross-board moves, custom-field changes and permanent deletes are known
limitations, stated in the module's comments and surfaced per-card via
`unreversedActivityTypes` rather than silently mis-reconstructed.

**Not yet done, deliberately deferred rather than rushed:** the Timeline
board-view menu entry/UI (the slider and read-only historical rendering),
the per-card "restore to this point in time" action, and the selective
per-member change-removal action described in the same request. All three
are real mutation logic (restore and removal write new card state) and
the maintainer's own requirement - "have checks that all data stays at
undo history, so that this does not delete any data" - means they need to
be built and tested as carefully as this reconstruction core, rather than
delivered incompletely under time pressure. `tests/boardTimeline.test.cjs`
pins every undo transform, a multi-step history at several points, purity
(no mutation of its inputs), and a negative test scanning the source for
any Activities removal call, so the safety property this feature depends
on already has coverage for the part that exists.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/12cd826c3">Timeline board view: browse a board's reconstructed past and restore a card from it</a>. Thanks to xet7.</summary>

Builds the rest of the request on top of the reconstruction core above: a
"Timeline" board-view menu entry right after Time, wired the same way as
every other view. It renders a horizontal row of clickable markers built
from the board's distinct activity timestamps (sampled down to 50 when
there are more, plus a "Now" marker), and clicking one calls the existing
`reconstructBoardStateAt()` - never reimplemented here - to render a
read-only, grouped-by-list view of what the board looked like then: title,
description snippet, labels, members, due date and an archived badge.

Each card in a historical view also gets a "Restore to this state" button,
behind a confirmation popup. It applies the reconstructed field values to
the card's CURRENT document by calling only the card's own existing
setters one at a time - `setTitle`, `setDescription`, `move`, `addLabel`/
`removeLabel`, `assignMember`/`unassignMember`, `setDue` - the same calls
the rest of the UI already makes, never a bulk update that bypasses them.
Each setter logs its own Activity through the existing hooks, so the
restore itself becomes new, fully visible history and satisfies "have
checks that all data stays at undo history, so that this does not delete
any data" the same way the reconstruction core does.

Deliberately deferred, same as the reconstruction commit already said:
"selective per-member change removal within a time period" is a separate,
higher-risk mutation feature left for a dedicated future pass, not
attempted here.

`tests/boardViewMenu.test.cjs`'s `VIEWS` table gets the new entry end to
end (menu position, click handler, `isViewTimeline()`, schema
`allowedValues`, tooltip name, template/stylesheet registration), and its
separator moves from after Time to after Timeline.
`tests/boardTimelineRestore.test.cjs` pins that the restore path only ever
calls the card's own setters, with a negative test scanning the whole file
for a direct `Cards.update`/`updateAsync` bypass, that the restore button
only renders while viewing a historical timestamp (never on the live
board), and that a confirmation step gates the action.

</details>

**All Boards** - the overview and its Clone Board action.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d4876eca3bf1db91d45970b1b4e888b6e16083ab">Clone Board can now skip copying cards</a>. Thanks to e-gaulue and xet7.</summary>

[#4726](https://github.com/wekan/wekan/issues/4726) asked for a way to
clone a board as a structural template - swimlanes, lists, labels, custom
fields and settings - without also duplicating every card onto the copy.

The Clone Board action (the per-board "Clone" tile, previously a plain
`confirm()` dialog) now opens a small popup with a "Without cards"
checkbox. Checking it sends a `withoutCards` flag through the `copyBoard`
Meteor method into `Boards.helpers().copy()` and
`Swimlanes.helpers().copy()`, which skip only the one loop that actually
creates card copies; everything else in the copy chain (swimlanes, lists,
labels, custom field definitions, rules/actions/triggers, integrations)
already becomes a no-op with zero cards and needed no change. Leaving the
checkbox unchecked reproduces today's clone exactly.
`tests/cloneBoardWithoutCards.test.cjs` pins the flag's default, the
single gated card-copy call site (and that no second, unguarded one
exists), the method's handling of the flag, and the client popup/checkbox
wiring - plus that the new `clone-board-without-cards` translation key
exists in English and every locale.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5fbbbeca9237ee19a3e94ddf65de30ce45c05fab">A board template can now be marked as the default, applied automatically when creating a board</a>. Thanks to Jieiku and xet7.</summary>

[#4205](https://github.com/wekan/wekan/issues/4205) asked for a way to
"just type a name for my new board and click create" instead of having to
reopen the "Template" picker (the `/` link on the Create Board form) and
pick a template by hand every time.

Each row of that picker (a "Board Templates" card, shown via
`Template.searchElementPopup`) now has a star icon beside it. Clicking the
star marks/unmarks that template as the user's default
(`profile.defaultBoardTemplateId`/`-BoardId`, both unset by default, so
nothing changes for anyone who never sets one) without also applying the
template - the rest of the row still does that, unchanged. Marking a
default goes through a new `toggleDefaultBoardTemplate` method that only
accepts a live, unarchived linked-board card from the caller's own
templates board.

Creating a board with the plain "type a name and click Create" flow now
checks for a default and, when set, applies it by calling the exact same
`copyBoard` method the manual picker already uses - not a second,
hand-written copy of the board-copying logic - before falling back to the
original blank-board path. Deleting the underlying template board clears it
as anyone's default, so board creation cannot fail against a dead board id.
`tests/defaultBoardTemplate.test.cjs` pins the schema, the toggle method's
validation and its cleanup on template deletion, that board creation reuses
the one `copyBoard` call site instead of a second one, and that an unset
default leaves board creation unchanged.

</details>

**The Admin Panel** - People, the account list under Login → People.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0297f52c4ba4beb47a60fb2c4d5798696c8c9af1">People can now be filtered by Team</a>. Thanks to hesco and xet7.</summary>

[#4510](https://github.com/wekan/wekan/issues/4510): an admin whose
instance had grown to 19 users across 6 teams had only the existing Show
filter (All/Locked/Active/Inactive/Admin) and the free-text search box to
narrow the People list - neither could show just one team's members.

A user's team membership already lives in their own `teams` array
(`models/users.js`, each entry `{ teamId, teamDisplayName }`), the same
field the Team membership popups already read and write. The People
pane's shared controls row gets a second dropdown, Team, next to Show,
built from every team (`ReactiveCache.getTeams({})`, not just the current
page of the paginated Teams table) and matched against `teams.teamId` the
same way Show already narrows the query. Both dropdowns share the
`.js-table-page-filter` class the shared table page already renders one
of per filter; a `data-filter` attribute distinguishes which one changed.
`tests/peopleTeamFilter.test.cjs` pins the new ReactiveVar, the query
predicate, the second filter entry and its options source, the
data-filter routing in the change handler, and that every locale has a
real (non-English) translation of the two new labels.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/520b2e412ecba03c44a0a7ffcf8da5264a65aa77">People now shows each account's last-active time and an online-now badge</a>. Thanks to eccaw and xet7.</summary>

[#3678](https://github.com/wekan/wekan/issues/3678) asked for a way to see
- and log out - inactive accounts; [#3734](https://github.com/wekan/wekan/issues/3734)
asked for the same thing from the other side, an API or log of active users
and how long they have been active. Both come down to the same missing
fact: WeKan had a `lastConnectionDate` field on the user schema already,
but the only code that ever wrote it was a commented-out, env-gated block
in `server/publications/users.js`, so no account's last-active time was
ever actually recorded.

`server/lastActiveOnLogin.js` now stamps `lastConnectionDate` on every
successful login via `Accounts.onLogin`, the same fire-and-forget pattern
`loginTallyOnLogin.js` and `avatarLocalizationOnLogin.js` already use so a
failure in one cannot affect the others. An open client session refreshes
it every two minutes through a new `usersHeartbeat` Meteor method
(`server/methods/lastActiveHeartbeat.js`, called from
`client/lastActiveHeartbeat.js`), which only ever updates the caller's own
`this.userId` - a periodic timestamp, not a websocket/real-time presence
system, which both issues' actual questions ("who is active, and for how
long") did not need.

People's table gets a "Last active" column showing that timestamp, with a
green online-now badge when it falls within five minutes
(`models/lib/lastActive.js`'s `isRecentlyActive`, pure arithmetic so it is
unit-testable without a server). `tests/lastActive.test.cjs` pins the
recency threshold at its boundary, a future timestamp (clock skew) never
reading as online, the login hook's shape, and that the heartbeat method
can only ever touch its own caller's document. The two new labels are
translated into 203 locales; the remainder keep the English source as the
explicit untranslated-everywhere placeholder.

WeKan already has a per-address login lockout
(`packages/wekan-accounts-lockout`, Admin Panel → Locked users) for the
enforcement half of #3678 ("how do I stop a stuck session"); this change
is deliberately visibility only and does not add a new logout-inactive-
users mechanism on top of it.

</details>

**Admin Panel / Settings / Visibility** - the instance-wide toggles under this
pane.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/52972b3e4cacdc451e5840709f505e98db285913">Board creation can now be restricted to admins only</a>. Thanks to belf88 and xet7.</summary>

[#4475](https://github.com/wekan/wekan/issues/4475): there was no way for an
admin to stop other user accounts from creating new boards - every signed-in
user could always make one, no matter what the instance's policy was meant
to be.

A new checkbox, "Only admins can create boards"
(`tableVisibilityMode-boardCreationAdminOnly`), sits beside the existing
"Public boards" toggle in Admin Panel → Settings → Visibility, following
the exact same `TableVisibilityModeSettings` pattern: a collection document
seeded off by default in `server/models/collectionBootstrap.js`, a jade
checkbox and reactive helper in `settingBody.jade`/`settingBody.js`, and a
write in that section's own Save handler. The enforcement is server-side,
in `createBoardWithInitialSwimlanes` (`server/models/boards.js`): the
method now rejects the call with `not-authorized` when the setting is on
and the caller is not `isAdmin === true`, before the board is inserted -
not only when the client UI happens to hide the button. A shared
`client/lib/boardCreationAllowed.js` helper hides the top-bar "+" and the
All Boards "Add board" tile for a restricted user as a convenience, but
nothing security-relevant depends on the client agreeing.

A full per-user allow/deny override was intentionally left out of this
pass - it would need its own schema field and a People/Admin Panel UI to
flip it per account, which is a larger change than this issue's core
request to forbid board creation instance-wide. The global toggle covers
that request on its own.

`tests/boardCreationAdminOnly.test.cjs` pins the default-off setting, the
checkbox/handler wiring, that the server-side admin check runs before the
insert, the shared client helper backing every entry point, the new
`board-creation-admin-only` translation key sitting right after its
sibling in every locale file, and - as a negative test - that no other
`Boards.insertAsync` call site exists outside the two already-known and
deliberately ungated ones (the per-user Templates container and
`createBoardFromCard`).

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5323fdbce67e2cdfe19a00f2d776c283d45bc2d9">An admin can now customize the Private/Public board description text</a>. Thanks to Meeques and xet7.</summary>

[#4421](https://github.com/wekan/wekan/issues/4421): the text shown under
Private/Public in the board visibility popup and the create-board popup was
hardcoded to the `private-desc`/`public-desc` i18n strings, which assume
"Public" means public on the internet. An org that uses "Public" to mean
"public within our organization" had no way to say so - the reporter's own
words were "public does not mean that boards can be found on google".

Two free-text fields, "Custom private description" and "Custom public
description", were added to Admin Panel → Settings → Visibility (All
Boards group), stored as `Settings.customPrivateBoardDesc` /
`customPublicBoardDesc` (both default to `""`). `boardVisibilityList`'s
`privateDesc`/`publicDesc` helpers (`client/components/boards/boardHeader.js`)
now render the admin's text when it is set, falling back to the existing
i18n text unchanged when it is empty - so any instance that has not touched
the new setting sees byte-identical behavior to before. The fallback logic
itself is a small pure function, `imports/i18n/lib/visibilityDesc.js`, kept
free of any Meteor/Blaze import so it is unit-testable on its own.

`tests/visibilityDesc.test.cjs` pins the fallback (unset, empty and
whitespace-only custom text all fall back to the i18n default; a real
custom value is used verbatim and trimmed) and that an admin who never
touches the setting gets the exact pre-existing text.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/521cb4e332db486682588e77f226b89efa698a49">Card text can now autolink bare "#1234"-style tokens to an external issue tracker</a>. Thanks to grandinj and xet7.</summary>

[#3069](https://github.com/wekan/wekan/issues/3069): a bare `#1234`-style
reference typed into a card description or comment stayed plain text, so an
instance whose team tracks issues in Jira, GitHub or Bugzilla elsewhere had
no way to jump straight there, the way the Mattermost autolink plugin does.

A new "External Issue Tracker Autolink" group under Admin Panel → Settings →
Visibility takes a token prefix (commonly `#`) and a URL template containing
the literal `{number}` (e.g. `https://issues.example.com/browse/PROJ-{number}`).
When both are set, every matching bare token found in card text is rendered
as a link to that URL, with the digits substituted in. Leaving either field
empty keeps the feature off, which is also the default.

WeKan does not autolink bare `#NNNN` to its own cards anywhere - confirmed by
reading the whole markdown pipeline and every client template before adding
this - so there was nothing internal to collide with. The feature stays safe
regardless of that: it is opt-in, and it never rewrites a token that already
sits inside an existing markdown link target or an `href="..."` attribute, so
a future internal card-number link could not be double-linked by this either.

The matching/URL-building logic lives once, as a pure function,
`models/lib/externalLinkAutolink.js`. The markdown renderer
(`packages/markdown/src/template-integration.js`) cannot import app code, so
it carries a small mirror of the same algorithm, fed the two configured
strings through a `ReactiveVar` bridge the same way the existing "always show
code as plain text" setting already is, kept in sync by
`client/components/main/editor.js`. `server/publications/settings.js`
publishes the two new fields, without which the admin form would always
render empty and "Save" would look like it did nothing.

`tests/externalLinkAutolink.test.cjs` covers the pure function directly
(matching, URL building, the no-op-when-unconfigured guard, the
already-linked collision guard), the settings/publication/bridge wiring, and
- by source inspection - that no internal `#NNNN`-to-card autolinker exists
anywhere in the tree, which is the precondition the whole design leans on.

</details>

**Card detail actions** - the hamburger menu opened from an open card.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/17c6d8d9b90e0fcef66177d94c18b15bec62adbf">A card can now create and link to a brand-new board in one step</a>. Thanks to Xilef11 and xet7.</summary>

[#4495](https://github.com/wekan/wekan/issues/4495): linking a card to a
board already worked, but only in two steps - create the board first, then
come back and use the existing "Link to board" action
(`client/components/lists/listBody.js`'s `Template.linkCardPopup`, opened
from a list's add-card composer) to find it.

A new, separate action sits beside it in the card's own hamburger menu,
"Create board from this card". It prompts for the new board's title
(defaulting to the card's own title), creates the board the same way
board creation normally does (an admin member, a default swimlane), and
then sets on the SAME card exactly the two fields the existing "link to a
whole board" flow sets - `type: 'cardType-linkedBoard'` and
`linkedId: <the new board>` - so opening the card now opens the sub-board,
without ever leaving the card. The new server method,
`createBoardFromCard` (`server/models/cards.js`), refuses to convert a
card that is already a link or a template, and checks write access on the
card's own board before creating anything.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9b1a90239b5b2b10f1184a251888190ac89d2484">A "Link to board" action lets a card be mirrored onto a different, existing board in one click</a>. Thanks to HT-Marley and xet7.</summary>

[#4281](https://github.com/wekan/wekan/issues/4281): a user working across
several project boards plus a personal overview board wanted a card to
also appear, linked rather than copied or moved, on another board -
without switching boards and re-adding it by hand. This is distinct from
[#4495](https://github.com/wekan/wekan/issues/4495) above (which links a
card to a BRAND-NEW board created on the spot): here the target board
already exists and is picked from a list.

The linked-card data model already existed
(`Cards.helpers().link(boardId, swimlaneId, listId)`, `models/cards.js`,
setting `type: 'cardType-linkedCard'` and `linkedId` on a copy of the
card), and so did the board/swimlane/list chooser Move card and Copy card
already use (`cardDestinationPicker`). Neither was reachable from the
card's own hamburger menu for this purpose. A new "Link to board" entry
sits next to "Move card"/"Copy card", opening a `linkCardToBoardPopup`
that reuses the same picker and, on Done, calls the existing `card.link()`
- creating the mirror on the chosen board without moving, copying or
otherwise mutating the original card.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/79dfd596f190c88eea1225259dba13846f266068">Move card can now leave a linked card behind at the card's original spot</a>. Thanks to superlou and xet7.</summary>

[#2719](https://github.com/wekan/wekan/issues/2719): a personal task board
whose tasks get moved onto project boards for team visibility lost the
personal-board trail once a card moved away - there was no way to still
track it from where it used to be. Move card's dialog
(`client/components/cards/cardDetails.jade`'s `moveCardPopup`) gains an
opt-in checkbox, "Leave a link at the original location", next to the
existing board/swimlane/list picker. Unchecked - the default - a move
behaves exactly as before.

Checked, `moveCardPopup`'s `setDone` (`client/components/cards/cardDetails.js`)
captures the card's board/swimlane/list before calling the existing
`card.move()`, then, once the move has completed, calls the existing
`card.link()` - the same [#4281](https://github.com/wekan/wekan/issues/4281)
linked-card mirror mechanism above - with those captured values, leaving a
`cardType-linkedCard` mirror pointing at the (now moved) card at the
original spot. No new linking mechanism was added; Move and Link are
simply chained.

</details>

**Custom fields** - the board's custom-field definitions and how they display.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0c6901f3a9eda2efd7e53c85d262add49fb53135">A board's custom fields can now be reordered by drag-and-drop, instead of always sorting alphabetically</a>. Thanks to huma2000 and xet7.</summary>

[#4165](https://github.com/wekan/wekan/issues/4165): custom fields always
rendered alphabetically by name, both in the Board Settings sidebar list and
on a card, with no way to change it - users worked around it by prefixing
names with numbers.

Added an optional numeric `sort` to the CustomFields schema
(`models/customFields.js`); a field created before it existed has none and
keeps sorting by name as a fallback. The Board Settings sidebar list
(`client/components/sidebar/sidebarCustomFields.jade`/`.js`) gets a drag
handle and a jQuery-ui sortable, mirroring the card-labels popup's own
reordering (`client/components/cards/labels.js`) rather than Lists'
fractional-index drag, which is built for a long, frequently-reordered
column of cards. Dropping recomputes sequential `sort` values with
`computeSortIndexMapping()`, the same pure helper the All Boards page
already uses for its own drag-reorder (`models/lib/boardSortReorder.js`), so
no new reordering logic was added. A newly created field defaults to the end
of the board's current list rather than jumping to the top.
`models/lib/customFieldsWD.js` - the shared matcher both the card detail
view and the card's custom-fields popup get their order from - now sorts by
`sort` ascending instead of by name.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d5700f5c395f1f30ec69042562ac427aadc1d10e">A new "Dropdown (multi-select)" custom field type lets a card pick several options, not just one</a>. Thanks to huma2000 and xet7.</summary>

[#4166](https://github.com/wekan/wekan/issues/4166): the existing "Dropdown"
custom field type only ever let a card store ONE chosen option from its
list. Added a second type, `dropdownMultiSelect`
(`models/customFields.js`), that reuses the exact same
`settings.dropdownItems` option-list definition mechanism and Board
Settings editing UI the single-select dropdown already has
(`client/components/sidebar/sidebarCustomFields.js`/`.jade`) - an admin
defines the available options once, the same way, for either type; only
the type picker and a shared "is this a dropdown-like type" check needed
touching.

On a card, the new type stores an ARRAY of selected item ids instead of a
scalar, and renders as a checkbox list rather than a `<select multiple>`
(`client/components/cards/cardCustomFields.js`/`.jade`), matching the
toggle-checkbox interaction already used elsewhere in the app.
`models/lib/customFieldsWD.js`'s `resolveTrueValue()` now resolves a
multi-select's array of ids to the matching item NAMES, comma-joined, so
every existing reader of a dropdown's `trueValue` - the minicard badge,
board filters - shows the new type correctly without further changes. The
CSV, PDF and Excel exporters, and `csvCreator`'s CSV header/definition
parsing, resolve the array of ids the same way the single-select dropdown
already resolves its one id, joining the resolved names for display.

The single-select dropdown's own behavior, storage shape and rendering are
unchanged.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4de77a4a5b377ffa8ce8111a9d85c9bdc7cf78c0">The list header's numeric custom-field sum badge is now scoped to the swimlane row it is drawn in</a>. Thanks to ccollins0601 and xet7.</summary>

[#3319](https://github.com/wekan/wekan/issues/3319) asked for a numeric
custom field (e.g. "story points") to be totalled per list and/or per
swimlane, for velocity tracking alongside the existing WIP-limit card count.
That was already possible: a numeric custom field's Board Settings sidebar
panel has a "show sum at top of list" toggle
(`models/customFields.js`'s `showSumAtTopOfList`), and when set, the list
header already drew a "∑ n" badge next to the card-count badge
(`client/components/lists/listHeader.jade`'s `numberFieldsSum`/
`hasNumberFieldsSum` helpers). Two gaps remained:

- the sum was always computed over the WHOLE list, even though a board-wide
  list renders once per swimlane row in Swimlanes view (the same list
  document, one row per swimlane) - so a shared list's badge reported the
  entire list's total under every swimlane row instead of that row's own
  cards, unlike the adjacent card-count badge, which is already scoped to
  the rendered row via `cardsCount(containerSwimlaneId)`.
  `numberFieldsSum` now takes the same `containerSwimlaneId` argument,
  passed from the template exactly like `cardsCount` already is, and adds it
  to the `Cards` selector the same way.
- the referenced `sum-of-number-fields` i18n key (the badge's tooltip) had
  never actually been added to `en.i18n.json` or any other locale file,
  so the tooltip silently fell back to showing the raw key. Added it to
  `en.i18n.json` and filled a real translation into the other 245 locale
  files.

The sum arithmetic itself (walk a list of cards, skip a card missing the
field or holding a null/non-numeric value, parse a numeric-looking string)
is pulled out of the Blaze helper into a small Meteor-free pure function,
`sumCustomFieldValues()` in the new `models/lib/customFieldsSum.js`, with
`tests/customFieldsSum.test.cjs` covering a plain sum, several flagged
fields summed together, numeric strings, missing/null values, non-numeric
strings, and an empty card list.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/453b309c72069ab6428b88f76a28d65fc306674f">The list header's custom-field summary badge now also shows min/max and a date-field range</a>. Thanks to rlach and xet7.</summary>

[#2075](https://github.com/wekan/wekan/issues/2075) asked for a broader
list-level custom-field summary than the sum #3319 above already added: a
count of cards that have the field set at all, min/max for a number field,
and a range for a date field. This extends that SAME mechanism - the same
per-field "show sum at top of list" checkbox, the same badge next to the
card count - instead of adding a second field-selection setting or a second
badge location.

`models/lib/customFieldsSum.js` gains two more pure functions alongside the
existing `sumCustomFieldValues()`, which is untouched: `numberFieldStats()`
(sum/min/max and how many of the cards have ANY of the flagged number
field(s) set, out of the total, reusing the exact same numeric-parsing
rules as the sum) and `dateFieldRange()` (earliest/latest value among the
cards for a flagged date-type field, plus the same count/total). A
date-custom-field value is read as a `Date`, an ISO string or a millisecond
timestamp; an unparseable value is skipped rather than corrupting the
range, the same policy the sum already applies to a non-numeric value.

`client/components/lists/listHeader.js` factors the "which flagged fields
of this type, which of the list's (swimlane-scoped) cards" lookup that
`numberFieldsSum`/`hasNumberFieldsSum` already did into two small shared
functions, then adds `numberFieldsSumTooltip()` (the existing "∑ N" badge's
tooltip now reads "…(min–max, N/total)" when there is a range to show) and
`hasDateFieldsRange()`/`dateFieldsRangeLabel()`/`dateFieldsRangeTooltip()`
for a date-type field flagged the same way, rendered as an earliest–latest
badge instead of a sum - summing dates has no meaning. The min/max/count
detail is deliberately wordless (`(5–20, 3/8)`) so it needs no new
translatable label and stays a hover-level detail rather than a third
always-visible number cluttering the list header; only the date-range
badge itself needed one new i18n key, `date-range-of-fields`, mirroring
the existing `sum-of-number-fields` tooltip label. Added to `en.i18n.json`
and to all 245 other locale files.

`tests/customFieldsSum.test.cjs` adds a regression test proving
`sumCustomFieldValues()`'s own result is unaffected by any of this, plus
coverage for `numberFieldStats()` (min/max, several flagged fields
combined, the card-count-with-a-value figure, a non-numeric value ignored,
an empty card list) and `dateFieldRange()` (earliest/latest, `Date` and
ISO-string values, the count figure, an unparseable value ignored rather
than corrupting the range, and an empty card list).

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/df96ee03ca4a54722e5cc4d92c897b5d3425563e">A checkbox custom field's minicard value is now a tick/cross icon, not a bare square</a>. Thanks to CarloRampini and xet7.</summary>

[#3142](https://github.com/wekan/wekan/issues/3142) asked to "display
read-only values like true/false and yes/no with icons" on the minicard
instead of text, specifically for a boolean/checkbox custom field. The
minicard already rendered a bare `.materialCheckBox` square for this type
rather than plain text, but it carried no true/false distinction at a
glance and did not match the other minicard badge icons, which are Font
Awesome glyphs.

`client/components/cards/minicard.jade`'s `checkbox`-type branch (both the
labelled and the no-label full-width layout) now renders `fa-check-circle`
when the field's value is true and `fa-times-circle` when it is false,
colored green/red in `client/components/cards/minicard.css`, with a title
tooltip using the existing `yes`/`no` i18n keys - no new translation keys
were needed. Every other custom field type (text, number, currency, date,
dropdown, multi-select, stringtemplate) and the full card-detail checkbox
editor (`client/components/cards/cardCustomFields.jade`, still a real
checkbox input) are unchanged.
`tests/minicardCustomFieldCheckboxIcon.test.cjs` pins the icon markup, that
the old bare-square/plain-text rendering is gone for `checkbox`
specifically, that the other types keep their own rendering, and that the
card-detail editor is untouched.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/76dcb6575aebd8f597ceb56b6bcc3edc02237251">An "Admin only" custom field definition hides its value from non-admin board members entirely</a>. Thanks to CarloRampini and xet7.</summary>

[#3141](https://github.com/wekan/wekan/issues/3141) asked for a custom field
usable for technical/integration metadata (API keys, script data) that only
a board admin can see or edit - invisible to an ordinary board member, not
just hidden behind a permission a client could still read.

Added `adminOnly` (boolean, default `false`) to the CustomFields schema
(`models/customFields.js`), toggled from a new checkbox in the custom-field
definition editor (`client/components/sidebar/sidebarCustomFields.js`/
`.jade`) that only renders for a board admin. `models/lib/customFieldsWD.js`
gets a small pure `filterAdminOnlyDefinitions()` helper, and
`models/cards.js`'s `customFieldsWD()` - the one shared helper both the card
detail view and the minicard render their custom fields from - calls it
before matching a value to its definition, so a non-admin's rendered result
never contains the field at all, on either surface. The card's own "assign a
custom field" popup list (`client/components/cards/cardCustomFields.js`)
reuses the same helper so the field's name does not leak there either.

The gate is enforced server-side, not just hidden in the UI: the
`CustomFields.allow` insert/update rules
(`server/permissions/customFields.js`) require `board.hasAdmin(userId)`
specifically to set or create with `adminOnly`, on top of the write-access
check every other field edit already requires, so a non-admin write-access
board member cannot grant themselves the flag. Setting the VALUE is checked
in three places: a new `Cards.deny` rule
(`server/permissions/cards.js`) rejects a direct client write of
`customFields.<index>.value` on an admin-only field (the path text/number/
dropdown/stringtemplate fields use), and the dedicated
`setCardCustomFieldCheckbox`/`setCardCustomFieldCurrency` Meteor methods
(`server/models/cards.js`) check it themselves, since a method body running
on the server bypasses `allow`/`deny` entirely.

`tests/adminOnlyCustomField3141.test.cjs` covers the schema default, that a
non-admin's `filterAdminOnlyDefinitions()`/`customFieldsWD()` result never
contains the admin-only field's id or value while a board admin's does, that
a field predating this change (no `adminOnly` key) is never hidden, and that
every server-side gate (the two `allow` rules, the `deny` rule, and both
value-setting methods) is present and checks `board.hasAdmin()`.

</details>

**Minicard and card detail dates** - the received/start/due/end date badges
shown on the minicard and in an open card.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fb761c7f10f89b78eed3ceaf385f741de577ad2c">An opt-in Jalali (Persian/Solar Hijri) calendar display for card dates</a>. Thanks to mimZD and xet7.</summary>

[#4335](https://github.com/wekan/wekan/issues/4335) asked for Jalali dates
on the minicard, at least as a preview. Dates stay stored as Gregorian
`Date` objects everywhere - this adds a per-user, display-only toggle
(`profile.calendarSystem`, `allowedValues: ['gregorian', 'jalali']`,
default `gregorian`) that renders the minicard and card detail
received/start/due/end dates - and the vote/poker end dates, which share
the same template - in the Jalali calendar when set to `jalali`. The
toggle sits in Member Settings next to "Set day of the week start", saved
through the same `Meteor.call`/`localStorage` pattern already used there
for the other per-user display preferences.

The Gregorian↔Jalali conversion (`imports/lib/jalaliDate.js`) is a
from-scratch implementation of the standard, widely published
astronomical/tabular Jalali algorithm plus the standard Fliegel & Van
Flandern Julian Day Number conversion - not copied from any single
licensed source - so no new npm dependency or license question is
introduced. It is exercised against three independently verifiable
reference dates (2026-03-21 = 1405-01-01, Nowruz; 1979-02-11 = 1357-11-22;
2000-01-01 = 1378-10-11), round-trips through the reverse conversion, and
stays internally consistent day to day across the Nowruz year rollover
(`tests/jalaliDate.test.cjs`).

Deliberately out of scope for this pass: date-picker INPUT widgets, date
storage, and due-date reminder/notification logic are untouched and stay
Gregorian - only the rendered display text changes, and only for users who
opt in.

</details>

**Public Boards** - the overview and its search.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bc91db9e27ef59b1facb187486cac74a38c38ad8">A public board card's own page now carries Open Graph meta tags, so pasting its link elsewhere renders a preview</a>. Thanks to yelloff and xet7.</summary>

[#3456](https://github.com/wekan/wekan/issues/3456) asked for a WeKan card
link pasted into Discourse to "onebox" the way a YouTube or GitHub link
already does there. Discourse's generic-page-preview oneboxer (and every
other og:-aware unfurler - Slack, Discord, Mastodon, ...) needs nothing
WeKan-specific for that: it renders a card automatically from standard Open
Graph meta tags in the target page's `<head>`, so this stays a
standards-based fix rather than a Discourse-specific oEmbed endpoint.

A connect middleware (`server/routes/cardOgTags.js`) matches the card route
`/b/:boardId/:slug/:cardId`, looks the card and its board up, and - only
when `board.isPublic()` - sets `request.dynamicHead` with `og:title`,
`og:description` (truncated), `og:url` and `og:image` (the card's cover,
when it has one) before Meteor's own SPA boilerplate serves the page.
`dynamicHead` is the same per-request head-injection point Meteor's WebApp
boilerplate generator already supports, used here the way
`server/routes/customHeadAssets.js` already injects other head content. A
private board's card is untouched: the gate is `board.isPublic()`, checked
before anything about the card is read, so an anonymous unfurl request
against a private card gets the normal, unmodified page - no title,
description or image leak. The gating/rendering logic lives in
`server/lib/cardOgTags.js` as a small Meteor-free module, covered by
`tests/cardOgTags.test.cjs`: a public card gets all four tags (or three,
when it has no cover), a private board's card and a missing card/board get
none, and an object with no `isPublic()` method fails closed rather than
open.

</details>

**Board Settings** - the Card Settings sidebar panel, and how its choices apply.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/520b2e412ecba03c44a0a7ffcf8da5264a65aa77">Whether a minicard shows label text is now a per-board default, with a per-user override</a>. Thanks to Meeques and xet7.</summary>

[#4256](https://github.com/wekan/wekan/issues/4256): whether a minicard's
labels show their TEXT (coloured words) or only the coloured bars was a
single setting applying to a user across every board
(`profile.hiddenMinicardLabelText`), with no way for a board to pick its own
default the way every other Card Settings row already can.

Adds `Boards.showLabelText` (Board Settings / Card, right above the
existing personal row), defaulting to `true` so an existing board with
nothing stored still shows text exactly as before. The personal row now
OVERRIDES that board default rather than being the only setting: it shows
whether it is following the board or has been overridden, with a "use board
default" reset link, mirroring how Member Settings / Change Color shows and
resets the existing global theme override
(`profile.globalThemeColor`). The resolution order - per-user override wins,
then the board's own setting, then the historical default - is a pure
function (`models/lib/labelTextVisibility.js`) shared by
`client/lib/minicardLabelText.js`, so the decision is made in exactly one
place; `tests/labelTextVisibility.test.cjs` pins all three cases plus the
migration-safety case that an existing board or user with nothing stored
sees no behaviour change. A logged-out reader of a public board keeps the
old localStorage-only toggle, now falling back to the board's own setting.

[#2561](https://github.com/wekan/wekan/issues/2561) asked for the same
thing under a different description - a board-level toggle to hide label
text on minicards and leave only the colour bars, like Trello - and is
fully covered by this same `Boards.showLabelText` setting; no separate
change was needed.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/131514d6140479aaa8de925774fe226814f507f3">The opened card's Description, Custom Fields, Labels, Dates and Members sections can now be reordered</a>. Thanks to mimZD and xet7.</summary>

[#4448](https://github.com/wekan/wekan/issues/4448) asked for Description to
be movable earlier among a card's fields (e.g. third) with Custom Fields
rendering after it, rather than the card detail view's previous fixed
sequence.

Boards now store a `cardFieldOrder` array; a new pure module,
`models/lib/cardFieldOrder.js`, resolves it against the historical default
order (`labels, dates, members, customFields, description`), dropping any
unknown key and filling in any section missing from a stale or partial
stored value, so a section can never be duplicated or silently dropped from
the card. `cardDetails.jade` now renders these five sections from that
resolved order via an `each` loop, each one now its own template
(`cardFieldSectionLabels`, `...Dates`, `...Members`, `...CustomFields`,
`...Description`) rather than inlined at a fixed spot. Dependencies+Sort
stay a fixed appendage right after Members, and Vote+Poker stay one right
after Custom Fields, so a board that never touches the new setting renders
byte-for-byte what it always has. Checklists, Attachments and Activity are
left out of this pass - they sit in their own flex/right-column layout
further down the template, and reordering them was not needed for the
issue's ask and would add layout risk this environment could not verify
visually.

Board Settings / Card Settings gets a new "Card field order" list with
up/down buttons per row (`client/components/sidebar/sidebar.jade`,
`sidebar.js`) rather than a drag-and-drop library: this codebase's existing
jQuery-ui-sortable usages (list/swimlane/board reordering) are heavier
drag-and-drop over board layout, not a simple settings list, so buttons are
the simpler, safer mechanism here. `tests/cardFieldOrder.test.cjs` pins the
default order, that description can move to third with custom fields after
it, that unknown/duplicate/missing keys are always resolved to a complete
and valid order, the up/down move helper's boundaries, and that
`cardDetails.jade` renders these sections from the order-driven loop rather
than a hardcoded sequence.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/de4a95474">A minicard can now show its swimlane's name in List view</a>. Thanks to JB_Pollard and xet7.</summary>

[#2426](https://github.com/wekan/wekan/issues/2426): in List view, unlike
Swimlanes view, a card's swimlane membership was not visible on its
minicard at all.

Adds a board-wide `Boards.allowsSwimlaneNameOnMinicard` toggle, defaulting
to `false` so existing boards see no change, with a new Card Settings row
(`client/components/sidebar/sidebar.jade`, `sidebar.js`) following the same
row pattern as "Show lists". There is no "Show on Card" equivalent - the
opened card already shows its swimlane via its own picker - so the row's
first column stays empty, the same shape as the existing "List title" row.
When enabled, the minicard renders a small, unobtrusive label at its bottom
(`client/components/cards/minicard.jade`), styled like the existing list-name
label, resolving the swimlane reactively via
`ReactiveCache.getSwimlane(card.swimlaneId)` - the same reactive per-card
lookup pattern already used elsewhere on the minicard.
`tests/minicardSwimlaneNameOnMinicard.test.cjs` pins the new field defaulting
to `false`, the Card Settings row toggling it, and the minicard only
rendering the label when the board flag is set.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3158b87c57ee564567b0d18f5a3a93f0ba9f4f2b">A board admin can now hide the "Time spent" badge on the card and minicard</a>. Thanks to matrixes and xet7.</summary>

[#2530](https://github.com/wekan/wekan/issues/2530): the "Time spent" field
was reachable only through the card's hamburger/context menu, and there was
no way to control whether the card detail view and minicard showed it once
logged.

Adds `Boards.allowsSpentTime` / `allowsSpentTimeOnMinicard`, both defaulting
to `true` - the card detail view and minicard already rendered the
accumulated spent-time badge (and its overtime indicator) unconditionally
whenever a card had logged time, so a `true` default keeps every existing
board's display unchanged - with a new Card Settings row
(`client/components/sidebar/sidebar.jade`, `sidebar.js`) following the same
"Show on card"/"Show on minicard" two-column pattern as
`allowsReceivedDate`/`allowsReceivedDateOnMinicard`. Turning either off now
lets an admin hide the badge from the card detail view or the minicard
respectively. `tests/spentTimeCardSettings.test.cjs` pins both fields
defaulting to `true`, the Card Settings row and its toggle handlers, and
that the card detail view and minicard only render the badge when the
corresponding flag is set.

</details>

**Rules (IFTTT)** - the triggers and card actions a rule can run.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b9b36629a">Added "assignee added to card" / "assignee removed from card" rule triggers</a>. Thanks to HayWo and xet7.</summary>

[#3390](https://github.com/wekan/wekan/issues/3390): Rules already triggered
on a MEMBER being added to or removed from a card (`joinMember`/
`unjoinMember`, `server/triggersDef.js`). `assignees` is a separate card
field from `members` (`models/cards.js`), and its `joinAssignee`/
`unjoinAssignee` activities were already recorded for the activity feed, but
nothing wired them to the rule engine, so "when an assignee is added/
removed" could not be built.

Two new `server/triggersDef.js` entries (`joinAssignee`/`unjoinAssignee`,
the same `boardId`/`username`/`userId` matching shape as the member
triggers) plug directly into the existing generic rule matcher - no new
engine code needed. The card-triggers Add Rule UI
(`client/components/rules/triggers/cardTriggers.jade`/`.js`) gets matching
"when a/the assignee is added/removed" blocks, and the drag-and-drop
workflow palette (`rulesWorkflow.js`) gets the matching chips, mirroring the
member trigger's UI exactly. `tests/rulesAssigneeTrigger.test.cjs` pins the
trigger registration and matching (including that it does not fire on the
sibling member activity, or vice versa), the UI wiring, and that every
locale file has the four new i18n keys translated and in place.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1c97bbac854f0504376cc3be5f0d99627c4f403d">Added a "Remove all labels" rule action</a>. Thanks to basketball00011 and xet7.</summary>

[#3432](https://github.com/wekan/wekan/issues/3432): the existing per-label
"add label X" / "remove label X" card actions
(`models/cards.js` `addLabel`/`removeLabel`, wired in
`server/rulesHelper.js` and the label dropdown in
`client/components/rules/actions/cardActions.jade`/`.js`) only ever
touched one label at a time, so clearing every label from a card needed
one "remove label" action per label in the rule.

`Card.removeAllLabels()` sets `labelIds` to an empty array in a single
update (a card with no labels is a no-op), and a new "Remove all labels"
rule action (`actionType: 'removeAllLabels'`, with no label-selection
sub-field, unlike the existing per-label actions) calls it from a new
dropdown entry next to the existing label actions, mirroring how the
existing "Remove all members" action is wired.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b8a6de1c89331e5786a10ee28abdd9eb9d49ddc8">Added a "card matches advanced filter" rule trigger, reusing the Filter sidebar's own matching code</a>. Thanks to signalcodec and xet7.</summary>

[#3092](https://github.com/wekan/wekan/issues/3092): every existing rule
trigger only ever tests one simple condition (a label added, a member
added, ...), while the board's Filter sidebar already has a much richer
"Advanced Filter" criteria language - labels, custom fields, comparisons,
and `and`/`or`/`not`. There was no way to fire a rule from that richer
language at all.

The command-array -> Mongo selector algorithm that used to live only
inside `client/lib/filter.js`'s `AdvancedFilter` class now lives once, in
`/imports/lib/advancedFilter.js` (`advancedFilterCommandsToSelector`/
`advancedFilterStringToSelector`, plus the custom-field/dropdown/date
resolvers factored out into `buildAdvancedFilterResolversFromCustomFields`).
The sidebar class was refactored to call the shared function instead of
keeping its own copy of the parser - no behaviour change there.
`server/lib/advancedFilterMatch.js` calls the exact same shared function on
the server: it pre-fetches the board's custom fields once (Meteor 3
collections are async server-side, so the resolvers are built from a plain
snapshot rather than backed live by `ReactiveCache` the way the client's
are), then checks the built selector against the real Cards collection
(`Cards.findOneAsync({ ...selector, _id })`) - the same Mongo/FerretDB
query engine the client's minimongo mirrors, so "does this card match" is
answered identically in both places.

`server/rulesHelper.js`'s `findMatchingRules()` evaluates
`advancedFilterTrigger` triggers alongside the existing `TriggersDef`-driven
ones, on every activity that carries a card. Rules only ever fire from real
Activities (never on every raw write), so the new trigger follows the same
once-per-meaningful-change discipline every other trigger already has,
rather than re-evaluating on every database write. The trigger's UI
(`client/components/rules/triggers/cardTriggers.jade`/`.js`) reuses the
sidebar's advanced-filter text syntax directly, in a new "When a card
matches the advanced filter" trigger row - a scoped-down but
literally-the-same-language integration rather than a parallel UI.
`tests/ruleAdvancedFilterTrigger.test.cjs` pins a source-pattern negative
test that no other file redeclares the parser/selector-builder, that both
call sites import the one shared implementation, representative
advanced-filter combinations (`=`, `&&`, `||`, `!`) building the expected
selector, the server resolvers matching custom field names/dropdown values
the same way the client's do, and fire/no-fire behaviour as a card's custom
field value crosses into a stored filter's threshold.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b8a6de1c89331e5786a10ee28abdd9eb9d49ddc8">A rule's trigger/action can now be edited in place, and its "send email" action includes the card's description too</a>. Thanks to kabi178 and xet7.</summary>

[#2713](https://github.com/wekan/wekan/issues/2713) asked for two things.

Editing a rule used to mean deleting it and rebuilding it from scratch,
losing its position and its identity. The rule row's toolbar gets a second
"Edit trigger/action" button next to the existing title-rename pencil,
opening the same trigger/action wizard used to create a rule, pre-filled
with the rule's current title. A new server method, `rules.updateRule`
(`server/rulesButton.js`), mirrors `rules.createRule`'s authorization and
RuleBleed cross-board destination checks but REPLACES the existing
trigger/action documents in place (a full-document update by their
existing `_id`, not a remove-then-insert), so the rule keeps its own
`_id`, and its trigger/action keep theirs, across an edit. Every
action-template click handler that used to call `rules.createRule` or
insert `Triggers`/`Actions`/`Rules` directly now goes through one shared
helper, `client/components/rules/rulesSaveHelper.js`, which picks create
vs. update based on whether the wizard was opened to edit an existing
rule.

The "send an email" rule action already appended the card's title and a
direct link to it automatically ([#3301](https://github.com/wekan/wekan/issues/3301)),
even when the user's own template used none of the `{card}`/`{cardLink}`
tokens; it did not do the same for the card's description.
`server/rulesHelper.js` now appends a "Description: ..." line to the
footer alongside the existing title/link lines.

Actually attaching the card's FILE attachments to the outgoing email is
larger, mailer-level scope and is deferred - see TODO Later above.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/29488f8d52a0c3a94f9b4218910e0764908d26a2">Added "due/start/end/received date changed" rule triggers</a>. Thanks to justinr1234 and xet7.</summary>

[#2474](https://github.com/wekan/wekan/issues/2474): there was no way to
fire a rule when a card's due, start, end or received date was set or
changed - only the label/member/assignee/checklist/attachment style
triggers existed for that kind of field.

`models/cards.js`'s `setDue`/`setStart`/`setEnd`/`setReceived` already go
through `server/models/cards.js`'s `Cards.before.update` timing-field
hook, which logs an `a-dueAt`/`a-startAt`/`a-endAt`/`a-receivedAt`
activity on every SET (the same activity the due-date-change-count
feature, [#6081](https://github.com/wekan/wekan/issues/6081), already
reads - it only ever fires from a real value, never from
`unsetDue`/`unsetStart`/`unsetEnd`/`unsetReceived`'s `$unset`). Four new
`server/triggersDef.js` entries, keyed by those exact activityTypes and
matching on `boardId`/`userId`, plug the existing activity straight into
the generic rule matcher - no new detection mechanism. The card-triggers
Add Rule UI (`client/components/rules/triggers/cardTriggers.jade`/`.js`)
gets four matching "When the due/start/end/received date is set or
changed" rows. Comparing a date against a threshold (e.g. "due within N
days") is a separate, larger feature and is not part of this change.
`tests/rulesDateFieldTrigger.test.cjs` pins the trigger registration, the
existing hook it reuses, fire/no-fire matching (including that the four
date fields never cross-fire on each other or on an unrelated activity),
the UI wiring, and that every locale file has the four new i18n keys
translated and in place.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6f79e8791420b696d098c9342a98db9cdd04c140">The "add member" rule action can now add whoever triggered the rule, not just a fixed member</a>. Thanks to arisjr and xet7.</summary>

[#2522](https://github.com/wekan/wekan/issues/2522): the "add member" card
action only ever stored one specific, pre-chosen board member, so "when a
card moves to list X, add whoever just moved it as a member" could not be
built - there was no way for the action to mean "the person who just did
the triggering action" instead of a fixed name.

The action gets a second button, "Add the user who triggered this rule as
a member", that saves the same `addMember` action with a sentinel
`username` (`RULE_ACTING_USER_SENTINEL`, `models/lib/ruleActingUser.js`)
instead of a fixed one. At execution time `server/rulesHelper.js` resolves
that sentinel to `activity.userId` through `resolveActingUserId()` - the
exact same acting-user source `buildRuleVars()` already resolves for the
`{username}` template variable ([#3304](https://github.com/wekan/wekan/issues/3304)/[#3301](https://github.com/wekan/wekan/issues/3301)),
reused rather than reimplemented, and then calls the same
`card.assignMember()` the fixed-member path already uses. The ordinary
fixed-member "add member" action is unchanged.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b42034171">Added a "card title/description contains {value}" rule trigger</a>. Thanks to sfahrenholz and xet7.</summary>

[#2194](https://github.com/wekan/wekan/issues/2194) asked for a text-search
rule condition combinable with other triggers (e.g. "card added to Backlog
AND contains 'Patch'"). WeKan's rules stay single-trigger/single-condition
today - combining several conditions in one rule with AND was already looked
at and explicitly deferred by [#4294](https://github.com/wekan/wekan/issues/4294)
(see TODO Later) - so this adds ONE new standalone trigger type instead: "when
a card's title or description contains {value}", the same scope-down the
[#3092](https://github.com/wekan/wekan/issues/3092) advanced-filter trigger
used.

The user types a substring when building the rule; a new pure module,
`models/lib/ruleTextContainsMatch.js` (`textContainsMatch`/
`cardTextContainsMatch`), does a case-insensitive substring test against the
card's CURRENT title/description. `server/rulesHelper.js` evaluates it the
same way it already evaluates the advanced-filter trigger - not through the
generic `TriggersDef` exact/wildcard matcher, since a substring match isn't
one - re-reading the card on the activities that actually change its
matched text: card creation, and the `a-changedTitle`/`a-changedDescription`
activities `server/models/cards.js` already logs for the outgoing-webhook
hook (issues [#3619](https://github.com/wekan/wekan/issues/3619)/
[#5482](https://github.com/wekan/wekan/issues/5482)). The card-triggers Add
Rule UI (`client/components/rules/triggers/cardTriggers.jade`/`.js`) gets a
matching "When a card's title or description contains" row with a text
input, mirroring the advanced-filter trigger's own text-input row.
`tests/rulesTextContainsTrigger.test.cjs` pins the pure match function
(case-insensitive, title, description, no match, no crash on a missing
card/field), the trigger registration, the `rulesHelper.js` wiring, the UI
wiring, and the new i18n keys. Full AND-combination of several conditions in
one rule remains out of scope and stays tracked under TODO Later's #4294
entry.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9e9279987">Added a way to temporarily disable a rule without deleting it</a>. Thanks to sfahrenholz and xet7.</summary>

[#2322](https://github.com/wekan/wekan/issues/2322): the only way to stop a
rule from firing used to be deleting it, which threw away its
trigger/action configuration for good - re-creating the same automation
meant rebuilding it from scratch.

Adds an `enabled` Boolean field to the Rules schema (`models/rules.js`),
defaulting to `true` so every rule that existed before this field keeps
firing exactly as before. A new `rules.setEnabled` server method
(`server/rulesButton.js`) flips only that flag - it never touches the
rule's Trigger/Action documents or its own title/triggerId/actionId. The
rules list (`client/components/rules/rulesList.jade`/`.js`) gets a toggle
button next to the existing edit/delete actions, and
`RulesHelper.findMatchingRules()` (`server/rulesHelper.js`) skips any rule
whose `enabled` is explicitly `false`, so a disabled rule's configuration
stays fully intact and ready to re-enable, just never evaluated while off.
`tests/ruleEnabledToggle.test.cjs` pins the schema default, the
`rules.setEnabled` method (authorization, that it only `$set`s `enabled`,
and never touches Triggers/Actions), the skip check in
`findMatchingRules()`, and the UI wiring, plus logic-level coverage that a
pre-existing rule with no `enabled` field still fires, a disabled rule does
not, and re-enabling restores firing with the same trigger/action ids.

</details>

**Quick-add card** - the composer at the bottom of a list.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bc699ab43b379081755022ee4d5aa63d19f61039">A "[LabelName] " prefix in the quick-add-card title now applies (and creates) that label</a>. Thanks to mattdm and xet7.</summary>

[#3986](https://github.com/wekan/wekan/issues/3986): bulk-entering cards
through the quick-add composer had no way to label them without opening
each card afterward. Typing a title that starts with a bracketed label
name, e.g. "[Fedora] Do a thing", now creates the card titled "Do a
thing" with the "Fedora" label applied - matching an existing board label
by name case-insensitively, or creating one (with the same default-color
pick the "Add label" popup uses) when no label with that name exists yet.

Only a single bracket prefix at the very start of the title is parsed -
an empty bracket, nested brackets, or a bracket with nothing left after
it (e.g. "[Fedora]" alone) is left as literal title text rather than
misread as the syntax. The parsing and label-resolution logic is a pure
module, `models/lib/quickAddCardLabel.js`
(`parseQuickAddCardLabel`/`findExistingLabelIdByName`/
`pickDefaultLabelColor`), wired into `addCard` in
`client/components/lists/listBody.js`.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bc699ab43b379081755022ee4d5aa63d19f61039">A "More options" panel sets description, due date and assignees at creation, in one notification</a>. Thanks to Side2005 and xet7.</summary>

[#3967](https://github.com/wekan/wekan/issues/3967): quick-add only took a
title, so filling in a card's description, due date and assignee right
after creating it meant one `Cards.update` per field - and
`server/models/activities.js` sends a watcher-notification e-mail for
every `Activities` document, so each of those edits fired its own e-mail
on top of the "card created" one.

A "More options" link next to the composer's controls reveals a
description textarea, a due-date picker and the board's member list
(reused as an assignee checklist) before the card is created. Filling
any of them in adds `description`/`dueAt`/`assignees` onto the SAME
object passed to `Cards.insert` in `addCard`
(`client/components/lists/listBody.js`) - not a follow-up `Cards.update`
- so `server/models/cards.js`'s `Cards.after.insert` hook still only ever
inserts the ONE `createCard` activity it always did, and watchers get a
single, complete notification. A card added without opening "More
options" behaves exactly as before.

Batching the notifications generated by editing an *already-created*
card one field at a time (the reporter's "N further emails" case) is a
separate, larger change to the notification pipeline itself and is not
part of this fix.

</details>

**The member menu** - My Cards, My Due Cards and the pages beside them.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a9dd6b05b">A "My Attachments" page lists every attachment the user has uploaded, across every board</a>. Thanks to Jieiku and xet7.</summary>

[#3461](https://github.com/wekan/wekan/issues/3461): the member menu already
had My Cards and My Due Cards, each its own entry and its own page listing
cards across every board the user belongs to. My Attachments is a third,
identical sibling - added right after My Due Cards
(`client/components/users/userHeader.jade`) - listing every attachment the
CURRENT user has uploaded (not everybody's, just theirs), grouped board >
swimlane > list > card the same way My Cards is, with the same "open the
card in place" popup click handler My Cards' `.js-minicard` uses (#3640) so
opening one never navigates away from the list.

The new `myAttachments` publication (`server/publications/cards.js`) filters
by both the uploader and board visibility, reusing the same
`boardVisibilitySelectors()` the All Boards list and the `board` publication
already use (GHSA-gwc4-fw7p-gw58) rather than writing that rule a third
time - so an attachment on a board the user cannot see is never published,
even if its `userId` field somehow still names them. The query shape is a
small pure module, `models/lib/myAttachmentsQuery.js`, unit-tested without a
database.

</details>

**Subtasks** - the Subtasks section on a card.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/27f5051be">Add an existing card as a subtask directly from the parent card's Subtasks section</a>. Thanks to ikomhoog and xet7.</summary>

[#3626](https://github.com/wekan/wekan/issues/3626) asked for three things.
The completed/total subtask counter was already correct (pinned by the
earlier #4050 work), and letting one card be a subtask of several parents
at once is a genuine data-model change - `parentId` (`models/cards.js`) is
a single field today, and every ancestor walk assumes exactly one parent -
deferred to TODO Later above for a deliberate design decision. This is the
third, buildable part: a way to add an EXISTING card as a subtask, instead
of only being able to create a brand-new one.

A new "Add existing card as subtask" trigger sits next to "Add a new
subtask" and opens a search popup scoped to the current card's own board,
excluding the card itself, cards already parented to it, and anything that
is already an ancestor of it - `setParentId`'s #3328 cycle guard would
refuse those anyway, so they are filtered out before the user can pick
them. Selecting a result calls the exact existing `card.setParentId(...)`
method, the same re-parenting call every other site in the codebase uses,
so no new card is created and no other field of the picked card changes.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/632a107f3">An "Inherit parent's labels" checkbox optionally copies the parent card's labels onto a new subtask</a>. Thanks to MelBourbon and xet7.</summary>

[#2184](https://github.com/wekan/wekan/issues/2184): a subtask always
started with no labels, so a label that should obviously apply to it too -
the same colour-coded category as its parent - had to be re-applied by
hand every time.

The "Add a new subtask" popup gets an "Inherit parent's labels" checkbox,
default UNCHECKED so the existing behaviour (a subtask starts with no
labels) is unchanged unless it is used. When checked, the parent card's
CURRENT `labelIds` are copied onto the new subtask as part of the same
`addSubtaskCard` server method call that creates it
(`server/models/cards.js`), via a small pure helper,
`computeSubtaskLabelIds` (`models/lib/subtaskLabelInheritance.js`), kept
separate so it is unit-tested without a database. This is deliberately a
ONE-TIME copy taken at creation time, not an ongoing sync: a later change
to the parent's labels does not retroactively touch a subtask already
created, which the test pins directly.

</details>

**Lists** - a list's own header and the List hamburger/action menu.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5605e08dd">A board-wide toggle keeps every list's header pinned while its cards scroll underneath it</a>. Thanks to JFa-Orkis and xet7.</summary>

[#3847](https://github.com/wekan/wekan/issues/3847): a list's title,
WIP-limit badge and hamburger menu scrolling away with the cards
"interfere with readability" once a list is long enough to scroll.

`.list-header` already sits BEFORE `.list-body` (the cards' own scrolling
box, `overflow-y: scroll`) as a flex sibling rather than a child of it, so
it does not scroll away with the cards in the ordinary bounded-height board
layout. A new `Boards.stickyListHeaders` field (default `false`, unchanged
behaviour) additionally sets `position: sticky` on `.list-header` when on,
so the header also stays pinned in any layout where `.list` itself turns
out to be the actual scrolling ancestor. The setting is board-wide rather
than per-list - freezing one list's header while its neighbours scrolled
normally would look inconsistent - but the toggle itself is offered from
each List's own hamburger/action menu (`listActionPopup`, next to "Set WIP
Limit"), per the maintainer's instruction, for discoverability rather than
scope: flipping it from one list affects every list on the board.

</details>

**Labels** - the label popup opened from a card's Labels button and Board
Settings.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1af1d7ad3fcadbaeca0a52ef473552a775849f02">A label can now carry its own optional due date, so it doubles as a "milestone"</a>. Thanks to locnide and xet7.</summary>

[#2802](https://github.com/wekan/wekan/issues/2802) asked for "Milestones": a
board-level tag with a due date, and the ability to view/filter cards by
milestone. A whole new Milestone object - its own collection, CRUD UI and
filter integration - would duplicate what labels already do, so instead
labels themselves gained one optional field: `labels.$.dueAt` in
`models/boards.js`, nullable and unset by default, so every existing label
and board is completely unaffected.

The existing label create/edit popup
(`client/components/cards/labels.js`/`.jade`, the same popup used for a
label's name and color) gained a "Due Date" date input, wired through
`Boards.addLabel`/`editLabel`'s new trailing `dueAt` argument;
`editLabel` explicitly `$unset`s it when the field is cleared rather than
leaving a stale value. When set, the labels list (the same popup that lists
a board's labels for editing) shows the date next to the label as a small,
muted badge - the safe minimum requested, rather than new minicard real
estate that risks visual clutter.

A "milestone" is then just a label named e.g. "Sprint 1" with a due date:
filtering cards by that label - already supported by WeKan's existing label
filter - is the milestone filter the issue asked for, with no new filter UI.

</details>

**Sign-in** - the username/password login form and the member menu's account
settings.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0eaa97230">Added opt-in per-user TOTP two-factor authentication, via Meteor's own accounts-2fa</a>. Thanks to r0bbie and xet7.</summary>

[#3058](https://github.com/wekan/wekan/issues/3058) asked for two-factor
authentication on WeKan's own username/password login, not through a
third-party OAuth provider. Added Meteor's official `accounts-2fa` package
(MIT, part of the `meteor/meteor` monorepo, the same publisher as
`accounts-password` already in use) rather than hand-rolling TOTP -
`Accounts.generate2faActivationQrCode`/`enableUser2fa`/`disableUser2fa`/
`has2faEnabled` do all secret generation and code verification.

A new "Two-Factor Authentication" entry in the member menu shows a QR code
and a manual-entry secret, then confirms with a 6-digit code to finish
enabling; a "Disable" action turns it off. On the sign-in form, a password
login that comes back with accounts-2fa's documented `no-2fa-code` error
now shows a second "enter your 6-digit code" step instead of a generic
failure, and resubmits with `Meteor.loginWithPasswordAnd2faCode` -
accounts-2fa's own login method for this case, rather than any
WeKan-side TOTP check. `wekan-accounts-lockout` already anticipated this:
its `loginFailureDecision.js` already treated `no-2fa-code` as a
non-countable step, so a 2FA login is never mistaken for a brute-force
attempt. Scope is opt-in per-user TOTP only, as asked - no backup codes,
SMS or admin-enforced 2FA in this pass.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/84c714001228408c871cb696bc3d37ec908b5fd8">Add SAML 2.0 login (SP-initiated), alongside password, OAuth2 and LDAP</a>. Thanks to Gobliins and xet7.</summary>

[#708](https://github.com/wekan/wekan/issues/708) asked for SAML login,
pointing at how Sandstorm and Rocket.Chat wire SAML into a Meteor app.
`server/authentication.js` already read `SAML_*` env vars into
`ServiceConfiguration.configurations` and the login form already called a
not-yet-existing `Meteor.loginWithSaml()` - neither had ever been wired to a
real accounts package.

Added that package, `packages/wekan-accounts-saml`, on the MIT-licensed
[`@node-saml/node-saml`](https://github.com/node-saml/node-saml) (license
verified directly from its `LICENSE` file). That library does all of the
actual SAML protocol work - building the `AuthnRequest`, parsing the
response, verifying the XML-DSig signature; WeKan only wires it into
Meteor's accounts system, the same scope-boundary already used for LDAP and
CAS. It follows `wekan-accounts-cas`'s existing local-package pattern: the
client opens a popup at a new `/_saml/authorize` endpoint that redirects to
the identity provider, the IdP POSTs the assertion back to `/_saml/validate`
(the Assertion Consumer Service URL), and the client exchanges a per-attempt
credential token for a Meteor login through `Accounts.registerLoginHandler`
- with the same account-conflict guard CAS already has, so SAML login can
never silently take over an existing non-SAML username.

A "Sign In with SAML" button is added to the login form, shown only when
`getAuthenticationsEnabled` reports `saml` enabled (`SAML_ENABLED`) - the
same conditional-render pattern the OAuth2 button already uses.
`docker-compose.yml`'s existing `SAML_*` block gets doc comments for every
variable, and `docs/Features/Login/SAML.md` now describes the actual
implementation instead of "not in WeKan yet".
`tests/samlLogin.test.cjs` pins the config wiring, the button's
enable-gating, the login-handler's credential-token and account-conflict
checks, and - as a negative test - that no XML parsing or signature
verification was hand-rolled in this codebase (only imported from
`@node-saml/node-saml`).

</details>

**Calendar export** - a subscribable feed of a board's card dates for outside
calendar apps.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a49e9d70aa744944b3fdbb5d96ac8fb50033547d">Add a per-board iCal (.ics) export feed</a>. Thanks to xet7.</summary>

[#2836](https://github.com/wekan/wekan/issues/2836) ("CalDAV or iCal
Support") asked specifically about calendar EXPORT/SYNC, not the in-app
Calendar view [#808](https://github.com/wekan/wekan/issues/808) already
added - and the codebase had a one-way .ics IMPORT
([#6323](https://github.com/wekan/wekan/issues/6323)) but no export
direction at all. A new `GET /api/boards/:boardId/calendar.ics` route
streams a subscribable, read-only iCalendar feed of a board's cards - one
VEVENT per Received / Start-End span / Due date, the same four dates the
Calendar view already draws - authenticated the same way every other
export route is (a public board needs no token; a private one takes
`?authToken=` or a logged-in session) and scoped/authorized through the
same `Exporter.canExport()`/`_scopedCardSelector()` every other export
uses. The board Export popup gets a new "iCal" link built through the
existing `exportUrl()` table, so it carries the same authToken handling as
every other format. This is EXPORT only, one-way and read-only: full CalDAV
is a stateful two-way sync protocol with its own server, which is a much
larger feature than a dates feed, and is out of scope here - every calendar
client that can "subscribe to a URL" reads a plain .ics feed directly, no
CalDAV needed.

</details>

**Board invitations** - inviting a user to a board.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9d1b2915ef1973e2b1d13219ef03dddb0d140727">Inviting a user to a board now also sends a push notification, not just email</a>. Thanks to CondensedTea and xet7.</summary>

[#3136](https://github.com/wekan/wekan/issues/3136): `inviteUserToBoard`
(`server/models/users.js`) only ever sent an invitation email. Board
membership/watcher changes already fan out through
`Notifications.notify(user, title, description, params)` - the same helper
`server/models/activities.js` calls for card assignment, due dates, mentions
and every other activity-driven notification, reaching both the email
service and the in-app notification bell - but an invite itself never went
through it. `inviteUserToBoard` now also calls
`Notifications.notify(user, 'push-invite-title', 'push-invite-text', params)`
right after the email is sent, reusing the exact same helper and the same
`params` already built for the email - no new push infrastructure. It is
guarded by `!isNewUser`: a brand-new invitee created from an email address
with no matching WeKan account has no established notification target yet,
so they stay email-only, exactly as before, with no error.

</details>

**Card sorting** - the board's "Sort" popup, which orders every list's cards.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fd935f7242addd8a15195b7ae7a0ce7afd95a213">Add an optional "Sort by votes" mode that floats highly-voted cards to the top</a>. Thanks to xet7.</summary>

[#3050](https://github.com/wekan/wekan/issues/3050) asked for a way to bring
a list's highest-voted cards to the top without dragging them there by
hand. The board's existing "Sort" popup already offers due date, title and
created date - the one alternate-sort mechanism WeKan has for cards - so
"Sort by votes" is a new entry there rather than a separate per-list
toggle or a new multi-criteria picker.

Vote score (positive votes minus negative votes) is not a real Mongo
field, so it cannot be expressed as a Mongo sort spec the way due
date/title/created date are. `{ votes: -1 }` is used as a marker only:
`cardsWithLimit()` (`client/components/lists/listBody.js`) recognizes it,
fetches the window in the underlying manual `sort` order, and re-sorts the
resulting array in JS by vote score - a pure DISPLAY-order change. The
manual `sort` field on each card is never touched, so switching the mode
back off (or the plain "Sort" reset) restores the exact manual drag order.

`models/lib/voteSortCards.js` extracts the comparator as a plain,
Meteor-free module so the scoring and ordering rules are unit-testable:
highest vote score first, a card with no votes scores 0 and sorts last,
and ties (including two zero-vote cards) keep their relative manual-sort
order via a stable sort.

</details>

**Lists** - a list's own header and Board Settings.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/187a3df1ce3377aba2a522cad4977900460355f0">Add a WIP limit shared across several lists together (WIP limit groups)</a>. Thanks to aviertio and xet7.</summary>

[#2489](https://github.com/wekan/wekan/issues/2489) asked for a WIP limit
that covers several columns together - e.g. three middle "in progress"
columns that may never hold more than 10 cards between them - on top of
the per-list limit WeKan already has (`models/lists.js` `wipLimit`).
`Boards.wipLimitGroups` adds a small board-level array of
`{ _id, name, listIds, limit, enabled }` groups, managed from a new "WIP
Limit Groups" panel in Board Settings (Swimlane/List/Card/WIP Limit
Groups, the same settings-popup pattern the other three already use),
where two or more of the board's lists are picked to share one combined
numeric limit.

`models/lib/wipLimitGroupDecision.js` is the pure arithmetic this reuses
everywhere the decision is needed: `combinedWipLimitGroupCount` sums the
current card count across a group's member lists,
`isWipLimitGroupExceeded` mirrors the per-list "exceeded" threshold
(`value < count`, the same strict comparison `exceededWipLimit` already
used), and `isListInExceededWipLimitGroup` answers whether a given list
belongs to any group currently over its own shared limit - independent
of that list's own individual `wipLimit`, so a group's total is never
confused with what any one member list's own limit says.

The list header shows the group being over limit with the exact same
`.highlight` red-text styling the per-list WIP counter already uses
(`client/components/lists/list.css`), not a second visual language: every
list that belongs to an exceeded group gets its title highlighted, so it
is clear at a glance which lists are part of the over-limit group, not
only the one list that happens to be over on its own.

</details>

**Lists** - a list's own header and Board Settings.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/187a3df1ce3377aba2a522cad4977900460355f0">Add a WIP limit shared across several lists together (WIP limit groups)</a>. Thanks to aviertio and xet7.</summary>

[#2489](https://github.com/wekan/wekan/issues/2489) asked for a WIP limit
that covers several columns together - e.g. three middle "in progress"
columns that may never hold more than 10 cards between them - on top of
the per-list limit WeKan already has (`models/lists.js` `wipLimit`).
`Boards.wipLimitGroups` adds a small board-level array of
`{ _id, name, listIds, limit, enabled }` groups, managed from a new "WIP
Limit Groups" panel in Board Settings (Swimlane/List/Card/WIP Limit
Groups, the same settings-popup pattern the other three already use),
where two or more of the board's lists are picked to share one combined
numeric limit.

`models/lib/wipLimitGroupDecision.js` is the pure arithmetic this reuses
everywhere the decision is needed: `combinedWipLimitGroupCount` sums the
current card count across a group's member lists,
`isWipLimitGroupExceeded` mirrors the per-list "exceeded" threshold
(`value < count`, the same strict comparison `exceededWipLimit` already
used), and `isListInExceededWipLimitGroup` answers whether a given list
belongs to any group currently over its own shared limit - independent
of that list's own individual `wipLimit`, so a group's total is never
confused with what any one member list's own limit says.

The list header shows the group being over limit with the exact same
`.highlight` red-text styling the per-list WIP counter already uses
(`client/components/lists/list.css`), not a second visual language: every
list that belongs to an exceeded group gets its title highlighted, so it
is clear at a glance which lists are part of the over-limit group, not
only the one list that happens to be over on its own.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0c7524db05a492e04b047e7523b916ccfb9df0c6">Add an "apply to whole swimlane" quick-select to WIP limit groups</a>. Thanks to bhueck and xet7.</summary>

[#2380](https://github.com/wekan/wekan/issues/2380) asked for a WIP limit on
a whole SWIMLANE - a cap on the total cards across all of that swimlane's
lists combined - distinct from the per-list `wipLimit` and from the
cross-list WIP limit groups just above (#2489). A WeKan list already carries
an optional `swimlaneId` (`models/lists.js`) when it was created for one
specific swimlane, so that swimlane's own lists are exactly a WIP limit
group's `listIds` in the same `{ _id, name, listIds, limit, enabled }` shape
\#2489 already added - no separate counting or enforcement was built.

The "WIP Limit Groups" panel's "Add WIP limit group" form gets a swimlane
picker and an "Apply to swimlane" button
(`client/components/sidebar/sidebar.jade`/`.js`). Choosing a swimlane and
clicking it checks exactly the boxes of that swimlane's own lists, using the
new `listIdsForSwimlane` helper
(`models/lib/wipLimitGroupDecision.js`) - the combined count and the
"exceeded" decision are then the exact same `combinedWipLimitGroupCount` /
`isWipLimitGroupExceeded` functions #2489 already uses, so a swimlane's
shared limit is enforced and displayed identically to any other WIP limit
group, and is independent of any single member list's own individual
`wipLimit`.

`tests/swimlaneWipLimitGroup.test.cjs` covers `listIdsForSwimlane`
(including a list with no `swimlaneId`, i.e. one shared across every
swimlane, correctly staying out of any one swimlane's membership) and the
combined-count/over-limit decision for a swimlane's lists, proving it stays
correct even when one member list has its own, much higher, individual
`wipLimit`.

</details>

**Comments and activities** - a card's comment thread and its activity log.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0c7524db05a492e04b047e7523b916ccfb9df0c6">Reply to a notification email, and the reply becomes a comment on the card</a>. Thanks to vasyugan and xet7.</summary>

[#2414](https://github.com/wekan/wekan/issues/2414) asked for Trello's
reply-by-email: reply to a WeKan notification email, and the reply shows up
as a comment. WeKan only ever SENDS email - there was no infrastructure to
RECEIVE it, and building a full IMAP-polling mail client is real operational
complexity (a running mailbox, credentials, a polling loop) most self-hosters
do not want. This is deliberately the smaller, webhook-based half instead: a
new `POST /api/inbound-email` that a mail provider's inbound-parse webhook
(Mailgun Routes, SendGrid Inbound Parse, Postmark inbound) calls with the
parsed reply, documented with provider-side setup steps in
`docs/Features/Email/Reply-By-Email.md`.

Every outbound notification email's `Reply-To` now carries
`reply+<cardId>-<hmac>@<domain>` (`server/lib/inboundEmailReplyToken.js`),
the HMAC keyed by a server-only `INBOUND_EMAIL_HMAC_SECRET` so the token
cannot be forged or guessed from a card id alone. The webhook verifies it
with a constant-time comparison, resolves the target card, strips the
reply's quoted text with a heuristic covering the common "On ... wrote:",
`>`-quoted and Outlook-style markers (`server/lib/inboundEmailQuoteStrip.js`),
matches the sender's From address to an existing WeKan user
(`server/lib/inboundEmailUserMatch.js`), and inserts a `CardComments`
document. **No matching user means the reply is rejected outright - it is
never turned into an anonymous comment.**

The endpoint is unauthenticated by design (a mail provider calls it, not a
logged-in WeKan user), so the HMAC token is the only guard standing between
an arbitrary POST and a new comment. Every rejection - a bad/forged/expired
token, a card the token points at that no longer exists, or a sender address
matching no account - is recorded through `server/lib/securityLog` under a
new `authn.inbound-email` catalog key (`models/lib/securityCategories.js`),
wrapped so logging can never break the guard, so repeated forged or
unmatched attempts show up in Admin Panel → Problems.

Both `INBOUND_EMAIL_HMAC_SECRET` and `INBOUND_EMAIL_DOMAIN` are opt-in; with
either unset (the default) no `Reply-To` is added at all and every existing
install is unaffected. Because notification emails are batched into one
digest per user, a digest covering several cards can only carry a single
`Reply-To`, so a reply lands on the MOST RECENTLY notified card in that
digest - a documented limitation of combining batching with a single
Reply-To header, not a bug.

</details>

**The due-date badge** - the card detail and minicard badge showing a
card's due date.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/67f1c7c56">The due-date badge now shows a countdown, not just the raw date</a>. Thanks to javen9881 and xet7.</summary>

The badge only ever showed the formatted due date, even though its own
hover title already read "Due on ...", giving no sense of urgency without
opening the card. `dueCountdown()` (`client/lib/dueDateColor.js`) is a
pure day-count helper - comparing the due date's calendar day against
"now"'s, so a card due later today reads "Due today" rather than "0 days
left" - sharing its "now" comparison with the existing `dueDateClass()`
so the countdown and the badge's colour coding always agree.
`cardDate.js`'s new `dueCountdownText()` turns it into translated text,
and both the card-detail and minicard due-date badges now show it in
their visible text and their hover title, e.g. "Jun 15 (3 days left)" /
"Jun 15 (2 days overdue)" / "Jun 15 (Due today)". A due date that already
has an end date set (the card is done) keeps just the plain date - there
is nothing left to count down. The received/start/end date badges are
untouched; they draw from the same shared markup template but keep their
own `showDate()`/`showTitle()`.

</details>

**Card templates** - creating a template from an existing board element.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bc25eee1b">The card menu gained "Save as Template", the reverse of inserting a card from a template</a>. Thanks to andresmanelli and xet7.</summary>

[#2209](https://github.com/wekan/wekan/issues/2209) (a follow-up to #2165's
original template-feature checklist) asked for "create template from
element" - creating a template directly from an existing board/list/card,
rather than only building one from scratch. WeKan already let a user
insert a card FROM a template (the existing searchElementPopup flow), but
nothing did the reverse.

The card menu now offers "Save as Template" beside "Copy Card", posting to
a new `saveCardAsTemplate` server method that copies the card into the
user's own "Card Templates" swimlane - creating the personal Templates
board on first use, exactly as the existing default-board-template flow
already does - and marks the copy `type: 'template-card'` so it behaves
as a template rather than an ordinary card. The lazy per-user Templates
board creation used to live only inline in the `ensureTemplatesBoard`
Meteor method; it is now exported as `ensureTemplatesBoardForUserId`
(`server/models/users.js`) so the new method calls it directly server-side
instead of duplicating the board/swimlane setup.

\#2209's other two sub-items were checked rather than built: "cards don't
appear in swimlanes if the general swimlane is deleted" ([#1959](https://github.com/wekan/wekan/issues/1959))
already has thorough startup-rescue coverage in the "swimlane-structure"
step of `server/lib/schemaUpgradeSteps.js`, with regression tests in
`tests/schemaUpgradeSteps.test.cjs`; "templated users" was explicitly out
of scope per the issue's own text.

</details>

**Star a Swimlane, List or Card** - the same per-user star a board already had,
reused for the other three, with a "Starred" page and a header dropdown to
reach them.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c5740e804">Add Star/Unstar to the Swimlane, List and Card menus, a "Starred" page and a header bookmarks section for them</a>. Thanks to chris-kwng and xet7.</summary>

[#1172](https://github.com/wekan/wekan/issues/1172) asked to star a card;
starring a board already existed (`profile.starredBoards`,
`toggleBoardStar` in `models/users.js` / `server/models/users.js`), so this
generalizes that exact per-user id-array shape to `profile.starredSwimlanes`,
`profile.starredLists` and `profile.starredCards`, each with its own
`toggleSwimlaneStar`/`toggleListStar`/`toggleCardStar` Meteor method that
checks the id and requires a login the same way `toggleBoardStar` does.

A "Star"/"Unstar" row was added to the Swimlane, List and Card hamburger
menus (`client/components/swimlanes/swimlaneHeader.jade`,
`client/components/lists/listHeader.jade`,
`client/components/cards/cardDetails.jade`) - reading actions, alongside
"Copy link" and "History", so they sit above the rows that change the
board. The list's own per-board `starred` field
(`client/components/lists/listHeader.js` `isStarred()`/`.star()`, used for
the sticky/pinned-list highlight) is a different, older feature and is
untouched; the new per-user star uses its own `isListItemStarred` helper
and `js-star-list-item` row to avoid any confusion with it.

A new "Starred" page (`/starred-items`,
`client/components/main/starredItems.jade`/`.js`) lists everything the
current user has starred, grouped by type, reusing the "open card in place"
popup mechanism `myCards`/`myAttachments` already use for the card group so
opening a starred card does not navigate away. It is reachable from the
"All Pages" member menu next to My Cards / My Due Cards / My Attachments.

The header bookmarks dropdown (`starredBoardsPopup`) gained three more
capped sections - Starred Swimlanes/Lists/Cards, five each,
most-recently-starred first - with a "see all" link to the uncapped Starred
page. Both the dropdown and the Starred page read the SAME
`starredItemsByType()` query (`client/components/main/header.js`, imported
by `starredItems.js`), so there is one definition of "what is starred" for
a user rather than two that could drift; `tests/starredItems.test.cjs` pins
that with a negative test grepping for a second definition. It also proves
the toggle persistence for all three new types, that `starredCount()` (the
group's badge) sums all five starred kinds, and that the new i18n keys are
used by all three menus. `tests/starredPages.test.cjs`'s existing count
assertion was updated to match - the count now goes through the shared
`starredCount()` aggregate rather than two lengths added inline, still
covering every starred kind.

</details>

**Card details** - text notes alongside the description.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bc8caeba5">Add a per-card markdown text note, editable in a popup</a>. Thanks to Lapin0t and xet7.</summary>

[#595](https://github.com/wekan/wekan/issues/595) asked for an attachable
markdown text note, separate from a card's own description, so a card is not
limited to cramming everything into one description field. This adds
`CardTextNotes`: a small collection of named markdown notes per card, modeled
on Checklists - a denormalized `boardId`, the same publish/allow/deny shape,
and the same cross-board-move guard checklists already have
(GHSA-gv8h-5p3p-6hx7).

Each note renders as a tile in a new "Text Notes" card-detail section, with
its title and a markdown-rendered preview. "Add text note" and a note's
"Edit" open a popup that reuses the description's own `editor`/`viewer`
widgets (`client/components/main/editor.jade`) verbatim - no new markdown
editor was written. "Delete" removes just that note.
`tests/cardTextNotes.test.cjs` pins the model's card/board scoping, the
permission shape, and - as a negative test - that exactly one `editor` and
one `viewer` template exist anywhere under `client/components/cards` and
`client/components/main`, so a competing markdown widget cannot be
introduced elsewhere either.

</details>

**Lists** - keeping a list synced from an external tracker.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a01e8478c">Add a list-sync job that keeps a list up to date from Jira, GitHub, GitLab and Gitea</a>. Thanks to xet7.</summary>

Import from Jira/Trello/GitHub/etc. was one-time: after the initial board
import, later changes upstream never reached WeKan. This adds an actual
sync: a list can be given a `syncSource` (type/URL/project) and a
credential, stored server-only in the new `ListSyncCredentials` collection
(`models/listSyncCredentials.js` - no publication exists for it, so it
never reaches the client). A `quave:synced-cron` job
(`server/listSync.js`), the same scheduling infrastructure the checklist
auto-reset job already uses, runs every 15 minutes and, for each synced
list, fetches its current external items and reconciles them against
WeKan's cards: a new item creates a card, a changed title/description
updates it, and an item that disappeared upstream is **archived** - never
deleted, so "old entries are at list history" as asked, using the
board's normal Archive.

Fetching (`server/lib/listSyncFetch.js`) and parsing deliberately reuse the
EXISTING one-time-import parsers in `models/lib/externalParsers.js`
(`parseJira` is new there; `parseGithub`/`parseGitlab`/`parseGitea` gained
an `externalId` field to match on) rather than a second implementation -
`tests/listSyncReconcile.test.cjs` has a source-scan negative test proving
no duplicate parser exists. The reconcile decision itself
(`models/lib/listSyncReconcile.js`) is a pure function with no database or
network access, so create/update/archive are pinned exactly by unit tests,
including that an already-archived card is never re-archived and a
hand-created card sharing the list (no `syncExternalId`) is never touched.
Jira is wired up end to end (fetch, parse, reconcile, apply); GitHub,
GitLab, Gitea and Forgejo run through the identical job and reconcile
logic via their own already-existing parsers, so extending sync to them
was "add a fetcher", not "add a sync mechanism". `setListSyncSource`,
`hasListSyncCredential` and `syncListNow` (`server/methods/listSync.js`)
configure/run it, gated behind board write access.

Deliberately deferred to this release's TODO Later: mapping an upstream
status change to moving the card to a different WeKan list, and syncing
anything beyond issues/tickets (comments, attachments, custom fields).

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b382519aa">List sync now has a Settings panel, in the List hamburger menu</a>. Thanks to xet7.</summary>

The list-sync backend above shipped with configuration only reachable
through the Meteor console. Its List hamburger menu now has a "Sync" item
(badged when a source is already configured, showing whether it is
enabled or paused) opening a panel where a board member with write access
picks a source type from the existing `SYNC_CAPABLE_SOURCES`
(Jira/GitHub/GitLab/Gitea/Forgejo), sets the URL and project key, sees the
current status (enabled, last synced - as a relative time, last error if
the previous attempt failed) and can run "Sync now" for immediate
feedback instead of waiting for the 15-minute cron. This is UI wiring
only: it calls the existing `setListSyncSource`/`hasListSyncCredential`/
`syncListNow` methods (`server/methods/listSync.js`) exactly as they were
already defined - the sync backend itself is unchanged.

The credential field is write-only, the same discipline the Admin Panel's
LDAP bind-password override already uses: it always renders with a
hard-coded empty value and is never pre-filled with the real token even
when one is already stored - `hasListSyncCredential` only ever returns a
boolean, so the panel can show "a credential is set" without the token
ever reaching the browser. `tests/listSyncUiWiring.test.cjs` pins this
with a source check on the input's markup (never bound to a token/
credential value) and a negative, whole-file scan proving no helper
returns a raw `.token` field, plus that the Meteor.call sites still match
the existing method names and argument shapes and that the status display
reads `syncSource.lastSyncedAt`/`lastSyncError`/`enabled` off the list's
own already-published, credential-free fields.

</details>

**Cards** - a Kanboard-parity addition for recurring work.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2e0956537">Add Kanboard-style whole-card recurrence</a>. Thanks to xet7.</summary>

Kanboard can automatically re-create a recurring task once it is done; WeKan
had the same idea for a checklist's items
(`models/lib/checklistResetSchedule.js`, `server/checklistResetSchedule.js`)
but nothing for a whole card. This adds a `recurrenceInterval` field to
`Cards` (`none`/`daily`/`weekly`/`monthly`, default `none`) and
`models/lib/cardRecurrenceSchedule.js`, the pure due-date-arithmetic twin of
the checklist module, reused as closely as the shape allows. The card's
"..." menu gets a new **Card recurrence** entry, right beside **Save card as
template**, opening a popup shaped exactly like the checklist's **Automatic
reset** popup. `server/cardRecurrenceSchedule.js` registers one more job on
the same shared `quave:synced-cron` infrastructure the checklist reset, the
list-sync job and scheduled Rules already run on; once an hour it creates a
fresh copy of every due card - same board/swimlane/list, title, description,
labels and custom fields carried over, everything else starting fresh - and
stamps `lastRecurrenceAt` on the source card so the chain keeps recurring on
schedule. An archived card is skipped even with its interval still set.
`tests/cardRecurrenceSchedule.test.cjs` covers the daily/weekly/monthly due-
date arithmetic (including the same calendar-month edge case the checklist
tests pin), the scan-selection step and, as a negative test, that an
archived card never spawns another occurrence. See
[docs/Features/Cards/Card-Recurrence.md](docs/Features/Cards/Card-Recurrence.md).

</details>

**Account deactivation** - a GDPR-friendlier alternative to deleting an account.

**Member Settings and Admin Panel / People** - anonymizing an account.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ac4b7e75f">Anonymize an account, self-service or admin-triggered, instead of deleting it</a>. Thanks to Akuket and xet7.</summary>

[#2731](https://github.com/wekan/wekan/issues/2731): the only way to leave no
personal data behind was Delete Account, which also hard-deletes the Users
document and prunes every board/card/comment reference to it - losing
attribution and history entirely, which is more than GDPR requires and more
than some users want to lose.

`anonymizeUser` (`server/models/users.js`, its decision and update-shape logic
split into `models/lib/userAnonymization.js` the same way removeUser's cleanup
plan already lives in `models/lib/userDeletionCleanup.js`) overwrites the
username, full name, email address and avatar with an anonymized placeholder
and sets `loginDisabled: true` - the same flag `server/authentication.js`'s
`validateLoginAttempt` already gates login on - so the account can no longer
log in. It does NOT prune or touch a single board/card/comment/activity
reference: those keep pointing at the same `userId`, which now simply
resolves to the anonymized name, keeping the account's past activity
structurally intact.

Callable both by the account owner on themselves (a new "Anonymize account"
button next to Delete in the Edit Profile popup,
`client/components/users/userHeader.jade`/`.js`) and by an admin on any other
user (next to the existing delete action in Admin Panel → People,
`client/components/settings/peopleBody.jade`/`.js`), each behind its own
irreversible-warning confirmation popup matching the existing delete
confirmation's pattern. The last remaining administrator cannot be
anonymized, mirroring removeUser's same guard.

No Admin Panel → Problems entry was added: that log is for attempts an
attacker controls, and there is no attacker here - anonymizing is a
privileged action an admin takes on purpose, or a member acting on their own
account. WeKan has no general admin-action audit log to hook into
(`server/lib/recoveryAudit.js` is board-deletion-specific); the audit trail
for this action is the new `anonymized`/`anonymizedAt` fields persisted on
the Users document itself and visible in Admin Panel → People.

`tests/userAnonymization.test.cjs` is a pure-Node regression guard (no
Meteor) covering: PII fields are scrubbed and `loginDisabled` is set; the
update never touches a reference-shaped field (`members`, `assignees`,
`watchers`, `boardId`, …) - the negative test distinguishing this from
removeUser's pruning; the same predicate `server/authentication.js` uses
denies login afterward; both the self-service and admin-triggered paths are
allowed; and a non-admin cannot anonymize another user, nor can the last
administrator be anonymized.

</details>

**Sign in with Apple** - OIDC-shaped login with a JWT client secret.

**OAuth2/OIDC login** - the generic provider client Keycloak, Authelia and now
Apple share.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/517bee3f0">Server-signed JWT client secret for OAuth2, enabling Sign in with Apple</a>. Thanks to xet7.</summary>

[#2458](https://github.com/wekan/wekan/issues/2458) asked for "Sign in with
Apple". Apple's login is OIDC-compatible, so it works through Wekan's existing
generic OAuth2/OIDC client - except its "client secret" is not a static
string like Keycloak's or Authelia's: it must be a short-lived JWT the server
signs itself (ES256), using a private key downloaded once from Apple's
developer portal.

`models/lib/oauth2ClientSecretJwt.js` mints that JWT using only Node's
built-in `crypto` module - no new dependency, since ES256 signing with
IEEE-P1363 signature encoding (the format a JWT requires) has been supported
since Node 12. It is opt-in via a new `OAUTH2_SECRET_JWT_KEY_PATH` env var
(plus `OAUTH2_SECRET_JWT_ISSUER`/`_KEY_ID`/`_AUDIENCE`/`_SUBJECT`/
`_EXPIRES_IN`); when unset (the default, and every existing provider's
configuration), `packages/wekan-oidc/oidc_server.js` falls back to the static
`OAUTH2_SECRET` exactly as before, so Keycloak, Authelia and every other
provider are unaffected.

Apple's other quirk - it returns the user's name only on the very first
authorization, never again - needs no special-casing: `Accounts.onCreateUser`
(`server/models/users.js`) already copies the OIDC fullname/email claims into
the user's `profile` only once, at account creation, and never overwrites
them on later logins (Meteor's `updateOrCreateUserFromExternalService` only
touches `services.oidc.*` for a returning user, not `profile.*`).

`docs/Features/Login/Apple.md` documents Apple's fixed endpoints
(`https://appleid.apple.com/auth/authorize`/`/auth/token`) and the new env
vars, in the same format as the Keycloak/Authelia docs, and is linked from
`docs/Features/Login/OAuth2.md`'s provider list.
`tests/oauth2ClientSecretJwt.test.cjs` is a pure-Node regression guard
covering the minted JWT's header/claims shape, that its ES256 signature
verifies against the matching public key and fails against another key, and
the negative case: with the new env vars unset, no JWT is generated and the
static-secret path is untouched.

</details>

**REST API** - improvements to the HTTP API.

**Checklists and comments** - editing them over the API, not just creating and
deleting them.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/099ab39dd">Add PUT endpoints for a checklist's title and a comment's text</a>. Thanks to mayjs and xet7.</summary>

[#1037](https://github.com/wekan/wekan/issues/1037) asked for a roadmap of
missing REST API features. Auditing the current surface
(`server/models/*.js`, one file per resource, each registering its own
`WebApp.handlers.get/post/put/delete`) against it found two clean CRUD
gaps: every other board sub-resource with GET/POST/DELETE already had a
matching PUT, but a checklist and a comment did not, so renaming a
checklist or fixing a typo in a comment meant deleting it and
re-creating it - losing its id, its timestamps, and, for a checklist,
scattering its items onto a rebuild.

`PUT /api/boards/:boardId/cards/:cardId/checklists/:checklistId`
accepts `{ "title": "..." }`, mirrors the existing DELETE's board/card
lookup and `checkBoardWriteAccess`, and rejects a missing or blank
title with 400 rather than silently storing one - only `title` is
writable; the per-checklist display toggles are a separate, larger
piece of surface and stayed out of scope here.

`PUT /api/boards/:boardId/cards/:cardId/comments/:commentId` accepts
`{ "comment": "..." }`, reuses the same `validateCommentBody` the POST
handler already uses, and applies the exact rule DDP applies
(`assertCanMutateComment`: the comment's author, or a board admin
unless the board sets `restrictCommentEditing`) - including the
GHSA-pqr4-rxgp-hv2m foreign-comment canary the DELETE handler already
trips, now named `comment.foreign-edit` for an edit versus
`comment.foreign-delete` for a delete, so both are equally visible.
`CardComments.direct.updateAsync` is used exactly the way the POST
handler already inserts (`.direct`, bypassing the collection hook),
with the same `editComment` activity recorded explicitly afterwards.

`tests/restApiEditGaps.test.cjs` pins both routes as source-pattern
tests, matching how the rest of this REST surface is already tested in
`tests/restApiIdorBatch.test.cjs`: the auth check, the board/card-scoped
(never bare-`_id`) lookup, the validation, and - for comments - that
the edit path enforces the identical author/admin/canary rule as the
existing delete path.

Most of the other open API:REST-labeled issues
([#5474](https://github.com/wekan/wekan/issues/5474),
[#4930](https://github.com/wekan/wekan/issues/4930),
[#2906](https://github.com/wekan/wekan/issues/2906),
[#2761](https://github.com/wekan/wekan/issues/2761),
[#2449](https://github.com/wekan/wekan/issues/2449),
[#2208](https://github.com/wekan/wekan/issues/2208),
[#2167](https://github.com/wekan/wekan/issues/2167),
[#2017](https://github.com/wekan/wekan/issues/2017),
[#1297](https://github.com/wekan/wekan/issues/1297),
[#794](https://github.com/wekan/wekan/issues/794)) ask for a new
capability (impersonation, WebHooks with richer targets, a stable
board key, Sandstorm-specific docs) rather than a missing CRUD verb on
an existing resource, so they are left open for their own, larger
piece of work rather than folded into this cleanup.

</details>

**Admin Panel / Login** - LDAP_* environment variables can now be overridden.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ac363f979">Add Admin Panel overrides for LDAP_* environment variables, and a Test LDAP Connection button</a>. Thanks to xet7.</summary>

Every LDAP_* setting `server/authentication.js` and `packages/wekan-ldap`
read straight from `process.env` can now be overridden from Admin Panel /
Login, with an explicit admin value winning over the env var and the env
var winning over nothing
(`models/lib/configResolver.js`'s `resolveConfigValue()`, pure and unit-
tested for the precedence and for its 'admin'/'env'/'default' source tag).
The Admin Panel LDAP section shows, next to every field, which source is
currently in effect - an env var name, "Admin Panel", or "Unset" - so it
is always clear whether a value comes from the environment or from an
admin override.

The bind password never reaches the browser: it is stored in the new
`Settings.ldap.bindPassword` field, which `server/publications/settings.js`
deliberately never publishes (only the boolean `ldap.bindPasswordSet` is).
The password input starts empty and an empty submission leaves the
existing value/source untouched, matching the existing mail-server
password field's pattern. `hasConfigValue()` is the parallel, secret-safe
resolver: it returns only a boolean and a source, never the value, and a
negative test fuzzes several secret shapes through it to prove that.

Found while wiring this up: `packages/wekan-ldap/server/testConnection.js`'s
existing `ldap_test_connection` method had its isAdmin check commented
out, so any authenticated user - not only an admin - could trigger a real
LDAP bind attempt against the configured directory. Fixed to require
isAdmin, the same check every other admin-only Settings method uses,
before any connection is attempted. A new "Test LDAP Connection" button in
Admin Panel / Login calls this method against whichever config (admin
override or env var) is currently resolved and shows the result - success
or the directory's own error - inline.

Switching between LDAP, OAuth2, SAML and password login already has its
own UI (the Login pane's "Default Authentication Method" selector plus
each method's own enabled flag); this only extends "enabled" itself to be
admin-overridable, the same as every other LDAP field. LDAP is covered end
to end (override + test-connection); OAuth2/SAML/CAS's env vars are
unchanged and stay env-only for now - the resolver is written to extend to
them, but doing so was out of scope for this pass.

</details>

**Server startup and email/import robustness** - a production unhandledRejection
and the values that fed it.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/563a0a6ed">Guard three toLowerCase() call sites that could receive a non-string value</a>. Thanks to xet7.</summary>

A production log kept showing `[unhandledRejection] WeKan keeps running:
TypeError: string.toLowerCase is not a function`. Auditing every server-
reachable `.toLowerCase()` call site (`server/`, `models/`, `packages/`)
found the actual cause: `Users.after.insert()`'s registration-invitation-code
check read `doc.authenticationMethod.toLowerCase()` unguarded, but
`authenticationMethod` is only ever set for oauth2/ldap signups - a normal
password/invitation signup leaves it `undefined`, so this crashed on every
new-user insert whenever `disableRegistration` was on; `doc.emails[0].address`
was also read unguarded there. The buffered activity-notification-email
sender in `server/notifications/email.js` had the same shape:
`user.emails[0].address.toLowerCase()` unguarded, crashing when a user (for
example a header-auth or LDAP account) has an empty `emails` array instead of
just skipping that send. The CSV/TSV importer's header-row mapping in
`models/csvCreator.js` read `headerRow[i].toLowerCase()` unguarded, which
could throw on a sparse row whose cell isn't a string. All three now check
`typeof`/presence first and fall through (skip the branch, or use an empty
string) instead of throwing. Every other `.toLowerCase()` call site in
server-reachable code was already guarded (a `typeof` check, an `|| ''`
fallback, or a value sourced from a validated schema field) and was left
unchanged.

</details>

**Popups and languages** - a Scrum doc's links, six popups with no header,
and two duplicated language files.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3f872cccc78986b56142711a6fabdd250bf6a13">Fix broken docs links, restore the km-KH/ru-RU language symlinks, and title six popups that rendered with no header</a>. Thanks to xet7.</summary>

`docs/Features/Cards/Scrum.md` linked `../../DragDrop/Drag-Drop.md` and
`../../Lists/WipLimit/WipLimit.md`, one directory level too high from
`docs/Features/Cards/`; both 404'd. Fixed to `../DragDrop/Drag-Drop.md`
and `../Lists/WipLimit/WipLimit.md`.

`imports/i18n/data/km-KH.i18n.json` and `ru-RU.i18n.json` had drifted into
independent copies of `km_KH.i18n.json`/`ru_RU.i18n.json` instead of being
a symlink to the file a Transifex pull actually writes, so the registry's
`km-KH`/`ru-RU` entries loaded a stale duplicate and `ru-RU` was missing
two keys that had only landed in `ru_RU.i18n.json`. Restored both as
symlinks.

Six popups - Add Existing Subtask, Restore Card to Timeline, Clone Board,
Create Board From Card, Archive All (list) Cards, and List Sync - had no
`<name>Popup-title` key, so each rendered with no header and so no close
button (the same class of problem `deleteBoardBackgroundPopup` etc. were
fixed for earlier). Added the title key to `en.i18n.json` and every
locale file, left as the English placeholder where no translation exists
yet.

Also inserted `text-contains-trigger-label`/`-description` into five
locale files (`ace`, `ba` and three others) that were missing them
entirely, which had shifted every following key out of position relative
to `en.i18n.json`.

</details>

**Board feature flags, Board Settings and Notification Settings** - four
more regressions from today's heavy development session.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1deae2fca">Fix the spent-time backfill, two Board Settings fields, Notification Settings wiring and two font sizes</a>. Thanks to xet7.</summary>

`allowsSpentTime`/`allowsSpentTimeOnMinicard` have `defaultValue: true` in
`models/boards.js` but were missing from
`server/lib/schemaUpgradeSteps.js`'s `BOARD_ALLOWS_TRUE_DEFAULTS`, so a
board created before those flags existed would read them as
undefined/false and hide its spent-time badge -
`tests/schemaUpgradeSteps.test.cjs` pins the list against the schema so
the two can no longer drift apart.

`customPrivateBoardDesc`/`customPublicBoardDesc` are read by
`settingBody.jade` but were missing from
`server/publications/settings.js`'s `SETTING_FIELDS`, so both fields
always rendered empty and saving them looked like it did nothing - the
same class of bug `tests/settingPublishedFields.test.cjs` already exists
to catch.

`notificationSettingsPopup.jade`/`.js` (the 3-tier Notification Settings
popup) are used by `peopleBody.jade` but were never imported into
`client/features/settings.js`, so the template compiled to nothing and
the popup did not exist at runtime; added both imports.

`client/components/boards/timelineView.css` and two rules in
`client/components/cards/minicard.css` still used bare px `font-size`
values instead of `calc(Npx * var(--wekan-ui-font-scale, 1))`, so the UI
font-size preset did not reach the Timeline board view or two minicard
comment rows.

</details>

**Admin Panel / People, board item links, the Frappe Gantt view and the
FerretDB Docker Compose backends** - four small pieces of drift found while
chasing node test-suite failures.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e15f53135">Admin Panel / People's Notifications row now has a URL of its own</a>. Thanks to xet7.</summary>

`peopleMenu()` in `client/components/settings/peopleBody.js` draws a
"Notifications" row (the admin-level default for the 3-tier Notification
Settings system) but `models/lib/adminUrls.js`'s `ADMIN_PAGES.people.panes`
had no slug for `notify-setting`, so the row could not be linked to or
deep-linked with `/admin/people/<slug>` the way every other row can be.
Added the `notifications` slug and its title, and documented the new
`/admin/people/notifications` URL in `docs/Features/Page/Admin-Panel-URLs.md`.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6e78c0f64">Opening a card or another board no longer leaves a stale comment/activity reveal armed</a>. Thanks to xet7.</summary>

`client/lib/revealBoardItem.js`'s permalink reveal (issue #4757) is
one-shot: following a `#comment-<id>`/`#activity-<id>` link sets
`revealCommentId`/`revealActivityId` in `Session`, and the board scrolls to
and highlights that element once. `config/router.js`'s `card` and `board`
routes already cleared `revealSwimlaneId`/`revealListId` on every
navigation so a stale swimlane/list reveal could not fire on the next
board, but never cleared the two comment/activity keys - so following a
comment permalink and then opening a different card could still scroll and
highlight the old comment once the first card's board rendered again.
Both routes now clear all four reveal keys.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ca9384c4a">The Frappe Gantt board view no longer risks "no template frappeGanttView found"</a>. Thanks to xet7.</summary>

`client/components/boards/roadmapView.js` imports
`client/components/gantt/frappeGantt.js` directly for `loadGanttLib`/
`cardsToTasks`/`popupDetailsHtml`, but that module registers
`Template.frappeGanttView.*` without importing its own
`frappeGantt.jade`. Whichever module reached it first - which can now be
`roadmapView.js`, well before `client/features/gantt.js`'s own import list
gets to the `.jade` - registered helpers/events against a template that did
not exist yet. `frappeGantt.js` now imports `frappeGantt.jade` itself, the
same fix this class of bug already has for every other component two or
more others import (`tests/clientBundleImports.test.cjs`).

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7cc570854">The FerretDB Docker Compose backends document SAML the same way docker-compose.yml does</a>. Thanks to xet7.</summary>

`docker-compose.yml`'s WeKan service is supposed to be identical, comment
for comment, across `docker-compose-ferretdb-v1-{postgresql,mysql,mariadb,
sap-hana}.yml` - the whole point of having one per FerretDB v1 backend is
that a user reading any of them configures the same WeKan. The four backend
files still had the bare, undocumented `#- SAML_ENABLED=true` block from
before the SAML 2.0 login feature's explanatory comments
(`docs/Features/Login/SAML.md`) were written; they now carry the same
per-variable comments `docker-compose.yml` does.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ccb5c28b7">LDAP, SAML, CAS and generic-OAuth2 no longer crash the server at boot</a>. Thanks to xet7.</summary>

A local Meteor package under `packages/` is its own isolated build unit and
cannot import an app-tree module by absolute path, static or dynamic -
`packages/wekan-ldap/server/ldap.js` (the recent LDAP Admin Panel override
feature) imported `Settings` and `resolveConfigValue` from `/models/...`
directly, which compiled and even ran under a plain Node test, but threw
"Cannot find module '/models/settings'" the moment the real Meteor server
started - exactly what a pasted `./build.sh` run reproduced. The pure
`configResolver` functions are now vendored into the package; `Settings`
access is injected instead, via `setLdapSettingsAccessor()`, wired once at
boot by the new `server/ldapAdminSettingsBridge.js`. The same shape existed
in `packages/wekan-oidc/oidc_server.js` (a vendored
`oauth2ClientSecretJwt.js`) and, wrapped in a try/catch that only kept it
from crashing boot, in `packages/wekan-accounts-saml/saml_server.js` and
`packages/wekan-accounts-cas/cas_server.js`'s account-conflict canary calls
(now reached through `global.__wekanTripCanary`, set once by
`server/lib/canary.js`). Also found while wiring this up:
`saml_server.js` imports the npm package `body-parser` without declaring it
in `package.js`'s `Npm.depends`, which crashed boot the same way once it
stopped finding the copy an unrelated app dependency happened to hoist into
`node_modules`. `tests/packageAppImportBoundary.test.cjs` sweeps every file
under `packages/` for an app-tree absolute import so this shape cannot
reappear anywhere else, and pins both vendored copies against their
app-tree originals.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6e7388e5d">Two Jade "missing space before text" build warnings in the comment-reply banner</a>. Thanks to xet7.</summary>

Both text lines in `comments.jade`'s reply banner started with a mustache
tag directly, with no leading `|` marker - the pattern every other
text-content line in the codebase uses. Harmless (the build still
compiled), but noise on every build; added the `|`.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7930da455">Custom fields no longer crash the server at boot on an invalid schema property</a>. Thanks to xet7.</summary>

Another crash a pasted `./build.sh` run reproduced directly:
"[uncaughtException] WeKan is stopping: Error: Invalid definition for sort
field: 'decimal' is not a supported property", thrown from SimpleSchema's
own constructor the moment the server started - before any board could
load. `decimal: true` on `models/customFields.js`'s `sort` field is not,
and has never been, a property SimpleSchema recognizes; nothing exercises
that validation under a plain Node test, which is why it slipped through
review. `type: Number` already allows fractional values with no extra
flag - the same as Lists' own `sort` field, which this one was
deliberately written to mirror and which never had this property either -
so removing it changes nothing about what the field accepts.
`tests/customFieldsSortSchema.test.cjs` pins the field's definition
against SimpleSchema's actual valid-property list and sweeps every other
file under `models/` for the same shape.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0c538bb92">Clicking a minicard opens the card popup again</a>. Thanks to xet7.</summary>

Reported directly: clicking a minicard did not open the card popup, with
the browser console showing "Error: No such function: isDateFormat" from
`Template.cardFieldSectionDates`. `cardDetails.jade` was split into
several per-section templates (Labels/Dates/Members/
DependenciesAndSort/CustomFields/VoteAndPoker), plus
`cardDetailsActionsPopup` and `activities.jade` are separate templates
entirely - but twelve helpers those templates actually call
(`isDateFormat`, `canShowCustomFieldsOnCard`, `stickers`, `isWatching`,
`dueDateChangeCount`, `getLocations`, `getDependencyCards`,
`customFieldsGrid`, `showActivities`, `showVotingButtons`,
`showPlanningPokerButtons`, `currentSwimlaneListsSorted`,
`isCurrentListId`) were only ever registered on
`Template.cardDetails.helpers` - template-local, so invisible to every
template that isn't `cardDetails` itself. Blaze only surfaces this the
moment that piece of UI actually renders, which is why it passed the
Node test suite and even a `meteor build` cleanly and only broke live.
Moved all twelve to `Template.registerHelper` (global), matching the
pattern the file already used for `isSectionOpen`.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2f626d099">A new label no longer fails to enlarge or apply to the card</a>. Thanks to xet7.</summary>

Reported directly: clicking a newly created label did not enlarge it or
apply it to the card, with the browser console showing "Exception in
Template.cardFlowtime canControlFlow" and the same for
`Template.cardPomodoro canControlPomodoro` - both call
`Utils.canModifyCard()` but never imported `Utils` (a plain ES export
from `client/lib/utils.js`, not a Meteor global), so the helper threw a
ReferenceError the moment either template's reactive computation ran,
breaking the surrounding card render along with it. Searching the whole
tree for the same shape found two more real, independent instances:
`notificationSettingsPopup.js` called `Utils.getCurrentBoardId()`
unimported, and `client/components/main/bookmarks.js` (the header
bookmarks/Starred feature) called `ReactiveCache.getCurrentUser()`
unimported in four places.
`tests/clientSingletonImports.test.cjs` sweeps every `client/**/*.js`
file for a call to `Utils.<method>(` or `ReactiveCache.<method>(` with no
matching import, so this shape cannot reappear anywhere else undetected.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/85a7f0fc8">Clicking a label to toggle it onto the card works again</a>. Thanks to xet7.</summary>

Reported directly: clicking a label no longer toggled it onto the card
(grow wider/apply on first click, shrink/remove on second), with the
browser console showing "card.board is not a function" thrown from
jQuery UI sortable's `stop` handler in `client/components/cards/labels.js`
(the label-reorder drag on `cardLabelsPopup`). jQuery UI's sortable widget
runs its `stop` callback on mouseup whenever a drag was registered, which
ordinary mouse/trackpad clicks can trigger even without an intentional
drag - so this handler fired far more often than "the user actually
reordered labels," and resolved the card via
`Blaze.getData(this).board()` on the sortable's root DOM element, which
does not reliably resolve back to a real Card document. An uncaught
exception inside jQuery UI's own cleanup aborted the rest of it,
consistent with the toggle-on-click visuals getting stuck. The sibling
`click .js-select-label` handler two lines below already had the right
fix for the same problem (added for linked-card labels): resolve the
board from the popup template's own data via `getCardLabelBoard(...)`.
Applied the same fix to the `stop` handler.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0242f968b">The card detail sections and the Labels popup get the card as their data context again</a>. Thanks to xet7.</summary>

Reported directly: after adding a label to an opened card, clicking it in
the Labels popup no longer made it wider or applied it to the card - it had
worked in the previous release. The reorderable card detail sections are
rendered by an `each` over the board's stored section order, and the plain
`each orderedCardFieldSections` form set the data context of everything
inside it to the section NAME string ("labels", "dates", ...). Every section
template, and every popup opened from one, therefore received a string
where it expected the card: the Labels popup's `card.toggleLabel` was
undefined and the click returned silently, `isLabelSelected` looked up
`_id` on a string, and the section's own labels/stickers/locations lists
rendered empty. The earlier fixes in this release (global helpers, missing
imports, the sortable `stop` handler) each removed a real exception on this
path but could not restore the toggle, because the popup still had no
card. Switched to `each section in orderedCardFieldSections`, which keeps
`this` as the card; `tests/cardFieldSectionsKeepCardContext.test.cjs` pins
it.

</details>

- [The Flowtime "Add Interruption" button uses the same theme colors as "Start Pomodoro"](https://github.com/wekan/wekan/commit/aa728a8dc). Thanks to xet7.
- [The Timeline "Restore to this state", List "Sync now" and Admin Panel "Test LDAP Connection" buttons are themed the same way](https://github.com/wekan/wekan/commit/376790de5). Thanks to xet7.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d0a70473e">The Dashboard's charts render again above its table</a>. Thanks to xet7.</summary>

Reported directly: the Dashboard view showed nothing above its table, with
"Exception from Tracker afterFlush function: Error: There is no current
view" from `boardCharts.js`. The chart is deliberately built inside
`Tracker.afterFlush` so the `<canvas>` exists by then, but that callback
runs outside every Blaze view, where `Template.currentData()` throws - and
one such call (the dataset title) sat inside it, aborting the whole chart
build with nothing to retry it. The data context is now read once in the
autorun and only the captured values are used inside the callback;
`tests/boardChartsAfterFlushContext.test.cjs` pins that no `afterFlush`
body in the file calls `Template.currentData()`.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/10c58867a">Frappe Gantt and DHTMLX Gantt show month and weekday names in the user's language</a>. Thanks to xet7.</summary>

Reported directly: both Gantt board views showed English month names in
every language. Neither library reads WeKan's translations - Frappe Gantt
takes a `language` tag it hands to `Intl.DateTimeFormat`, and DHTMLX Gantt
takes a locale object and only bundles a fixed set of them, defaulting to
English. The new `client/lib/ganttLocale.js` feeds both from the browser's
own Intl data, so every WeKan language gets its month and weekday names:
it maps WeKan's tag to one Intl accepts (the underscore tags such as
`ru_RU` make Intl throw; an unknown tag falls back to its primary subtag,
then English - every tag under `imports/i18n/data` is pinned to resolve),
and for DHTMLX prefers a locale the library bundles when there is one.
`tests/ganttLocale.test.cjs` covers it.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/364903fd8">Every chart view has one translated Export popup, and Frappe Gantt's own buttons are translated</a>. Thanks to xet7.</summary>

Reported directly: the Frappe Gantt view - and the DHTMLX Gantt, WeKan
Gantt, Time and the ten report-chart views - each showed two untranslated
"Export to PDF" / "Export to Excel" links, with five copies of the same
URL-building helper behind them. They now share one translated "Export"
button opening a new `exportChartPopup`: the same pop-over list of formats
the board/swimlane/list/card export popup uses, offering PDF and Excel with
the same icons and labels, with the URL built in exactly one place
(`client/components/boards/charts/exportChart.js`). The popup's title comes
from each locale's existing "export" translation, so no new words were
needed for it. Frappe Gantt's own chrome was English in every language
too: its view-mode dropdown now receives translated copies of the
library's default modes (Day/Week/Month from existing keys, plus four new
keys for Hour, Quarter Day, Half Day and Year), and its hardcoded "Today"
button and "Mode" placeholder, which the library rebuilds on every view
change, are re-translated by an observer. `tests/chartExportPopup.test.cjs`
pins all of it.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e487f8d91">Chart PDF exports keep every row on one line, in aligned columns</a>. Thanks to xet7.</summary>

Reported directly: in the Frappe Gantt view's PDF export a row's text was
not on one line. The chart PDF exporter wrote every header and data row as
one text line - "title | start | due | end" - with no width limit, so a
long card title pushed the dates off the page edge, and nothing lined up
from row to row. Rows are now real table rows with fixed column widths
(the name column twice the others); a cell that does not fit is clipped
with an ellipsis rather than wrapped, so a row is always exactly one line,
in both the Unicode PDF and the base-font fallback. Gantt, Time and the
report charts share this exporter. `tests/chartPdfTableRows.test.cjs` pins
it.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/278db0ada">Every Excel export writes dates as real date cells, not text</a>. Thanks to xet7.</summary>

Reported directly, with a LibreOffice screenshot: the Frappe Gantt view's
Excel export showed Start/Due/End as ISO text
("2026-09-23T09:00:00.000Z") - the chart Excel exporter wrote
`toISOString()` into the cell. A date is now a real date cell with a date
number format, so the spreadsheet shows it in its own date format, sorts
it as a date and can do arithmetic on it. Checking every other Excel
export as asked: the board and card exports draw the shared card document,
whose Created/Received/Start/Due/End/Last activity values were
pre-formatted text as well - a date pair now also carries the raw Date,
which the Excel renderer writes as a date cell while the PDF keeps
printing the text; the board's own Created/Modified lines likewise. The
legacy whole-board Excel export already wrote real dates.
`tests/chartExcelDateCells.test.cjs` covers all of them.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ad3554bbc">Board Settings / Rules switches to the Workflow view from any tab</a>. Thanks to xet7.</summary>

Reported directly, with screenshots: clicking "Workflow view" in the Rules
page's sidebar changed the button's label to "List view" but the page kept
showing the "Add trigger" tab - the workflow builder never appeared. The
workflow view is rendered only while the page's list tab is current, and
the toggle lives in a separate sidebar template that can only flip the
view mode, not the tab. The Rules page now brings itself back to the list
tab whenever the workflow view is selected.
`tests/rulesWorkflowViewToggle.test.cjs` pins it.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/48106ee17">Admin Panel / People / Roles no longer throws in its status table</a>. Thanks to xet7.</summary>

Reported directly: "Exception in Template.rolesGeneral rolesStatusTable" -
the table's column value functions call `TAPi18n.__()` in a file that
never imported `TAPi18n` (a named export, not a global). Sweeping the tree
for the same shape found it in two more files that would have failed the
same way the moment their call ran: the Locked Users pane's unlock
confirmation and the Multi Board Calendar view's locale and labels.
`tests/clientSingletonImports.test.cjs` now sweeps for `TAPi18n` too,
beside `Utils` and `ReactiveCache`.

</details>

**Rules, checklists and subtasks** - more automation, editable in place.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/16c8f425d">A rule's trigger and action can be edited in place, and the "send email" action can include the card's description</a>. Thanks to xet7.</summary>

Editing a rule no longer means deleting and recreating it: its trigger and
its action open back into the same forms they were made with. The "send
email" action gained the card's description as one more variable, beside
the title and the link.

</details>

- [Add a "Remove all labels" rule action](https://github.com/wekan/wekan/commit/bcd00c09b), with [its regression test](https://github.com/wekan/wekan/commit/68f8b5a86) and [the shared label-text resolution helper it uses (#4256)](https://github.com/wekan/wekan/commit/fa71c8ba4). Thanks to xet7.
- [Restore the "send email" rule action's automatic description line (#2713)](https://github.com/wekan/wekan/commit/b925b2170). Thanks to xet7.
- [Add an "Automatic reset" entry to the checklist actions menu](https://github.com/wekan/wekan/commit/16a919279) and [wire up its periodic job](https://github.com/wekan/wekan/commit/6ba3a3eb9). Thanks to xet7.
- [Extract the checklist-template append/copy document builders as pure functions, with tests](https://github.com/wekan/wekan/commit/f4af25ee2). Thanks to xet7.
- [Add regression tests for the due/start/end/received date-change triggers](https://github.com/wekan/wekan/commit/340ee1c7a). Thanks to xet7.

**Boards, lists and cards** - new ways to create and connect them.

- [Let a card create and link to a brand-new board, in one step](https://github.com/wekan/wekan/commit/a83a8a2cf). Thanks to xet7.
- [Add a Sync section to the List Settings popup for the list-sync backend](https://github.com/wekan/wekan/commit/85f4f5db2). Thanks to xet7.
- [Register the Bigboard view's templates and add its regression test](https://github.com/wekan/wekan/commit/8c7345ace). Thanks to xet7.
- [Show the Time view's client-side summary row and export label for remaining time until due](https://github.com/wekan/wekan/commit/120a1b665). Thanks to xet7.
- [Add Frappe Gantt below the existing Gantt view, and draw the report charts with Chart.js](https://github.com/wekan/wekan/commit/5d5317d96). Thanks to xet7.

**The database** - what Admin Panel / Problems can now see about it.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4a0955139">Admin Panel / Problems reports database restarts, storage and disk-space trouble, and self-fixes a missing index</a>. Thanks to xet7.</summary>

A reported MongoDB crash series (WeKan and MongoDB in one Kubernetes pod,
the database volume on an SMB/DFS share) was invisible from inside WeKan:
MongoDB aborting on every checkpoint, restarting, aborting again, every
query in between slow - and the admin found it in the container log.
Admin Panel / Problems / Database problems now gets a row for each thing
WeKan can measure from its side of the socket, from a probe that runs
after startup and every five minutes: `db.restart` (the database process
restarted while WeKan kept running), `db.network-filesystem` (the data
directory, when WeKan can see it, is on CIFS/SMB, NFS or FUSE),
`db.slow-storage` (reads averaged over 100 ms across the interval) and
`db.disk-space` (below 5% or 512 MiB free - the real "no space left on
device", before it happens), each with what to do. The one remediation
WeKan can do itself it does: an index it creates at startup on a
collection that already held documents is reported as `db.index-created`,
found and fixed. FerretDB answers only some of these commands; what it
cannot answer is skipped. `tests/databaseHealth.test.cjs` drives every
decision.

</details>

and fixes the following bugs:

**The database** - the reported crash's WeKan-side cause, and its real cause
documented.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/03ffb56a5">Index card_comment_reactions, and document why MongoDB's data directory must be on a local filesystem</a>. Thanks to xet7.</summary>

From the same reported crash logs: `card_comment_reactions` had no index
at all, and every board open queried it by `cardId` and by `boardId` as a
full collection scan - 3,397 collection scans of that one collection in
the last crash log, up to 1.6 s each, the bulk of its "Slow query" lines.
It now gets indexes on cardId, boardId and cardCommentId at startup, like
every other per-card collection. The crash itself is WiredTiger's
checkpoint `fsync()` returning "No space left on device" on the network
share (with 519 MB used and 10 GiB free), followed by a fatal assertion -
the storage, not WeKan: MongoDB requires a local filesystem with real
fsync semantics under its data directory. The new
`docs/Databases/MongoDB/Storage-Requirements.md` says so, shows what the
log looks like when it is not, and what to do.

</details>

**Board reports** - the Dashboard and the 10 board report chart views.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b33e2e1bebb4e1e82d43f180eaa20e3474ddd323">The Dashboard's "none" group label is now translated; a chart canvas that could render invisible now always renders</a>. Thanks to xet7.</summary>

The Dashboard view's By Assignee/By Label bars grouped a card with no
assignee or label under the literal English word "none" - untranslated in
every language, on the live chart, the data table, and the PDF/Excel
export alike. Two sentinel keys (`NO_ASSIGNEE_GROUP`/`NO_LABEL_GROUP`) plus
a shared `translateGroupLabel()` replace it with a real "No assignee"/"No
label", translated into all 245 locales directly (not left as English
placeholders), everywhere that group label is rendered.

Also fixes a board report chart (reported: Burndown) rendering its export
buttons and table but no visible chart: the `<canvas>` only exists in the
DOM once loading finishes and Blaze's jade conditional switches to its
"else" branch - a sibling reactive change driven by the SAME data update
the chart-building code also depends on, with no guaranteed ordering
between the two. The very first successful data load could run before
Blaze patched the DOM, silently finding no canvas and never building a
chart, with nothing to trigger a retry afterward. The canvas lookup is now
deferred with `Tracker.afterFlush` so it always runs after the DOM has
actually been patched.

Also removes three dead `<link>` tags in `gantt.jade` pointing at
`gantt.css`/`ganttCard.css`/`boardCharts.css`'s raw source path - all three
are already loaded through the normal bundler import, and the runtime
`<link>` to the unserved source path 404'd as `text/html`, pure console
noise on every Gantt page load.

</details>

**Document preview** - opening a PDF/DOCX/XLSX/PPTX attachment on a card.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/373980ac8a37eb830539b01ffc12dfb0c0a53e18">The full-featured DOCX/XLSX/PPTX viewer and native PDF preview are back</a>. Thanks to xet7.</summary>

The minimal server-rendered GIF-slideshow preview (introduced this week to
cut dependency weight) turned out to fail outright whenever its own
rasterization dependency chain (`pdf-to-img` -> `pdfjs-dist`'s optional
`@napi-rs/canvas`) was missing or misresolved a worker path under the
bundled server - three separate 415 fixes landed for it in a single day.
Rather than keep chasing that dependency chain, the previous full-featured
viewer is restored instead: `office-open-xml-viewer` (MIT-licensed,
canvas-based, zero runtime dependencies) renders DOCX/XLSX/PPTX client-side
exactly as it did before, and PDF goes back to the browser's own native
`<embed>` viewer - simpler, zero extra dependencies, and gets the browser's
own zoom/search/print for free. The server-side full-text search this week's
change also introduced is kept: `server/lib/documentGif.js` now does nothing
but extract plain text for the search index (`indexDocumentText`, triggered
in the background from `Attachments.onAfterUpload`) - no rendering, no HTML,
no page images - so `pdf-to-img` and `@napi-rs/canvas` are dropped entirely
(nothing rasterizes a PDF page server-side any more) while `pdfjs-dist`
stays, now as a direct dependency, for its text-only extraction. Searching
attachment contents from the card search box keeps working exactly as
before.

Every PDF upload initially logged "Document search indexing failed:
TypeError: textDocument.destroy is not a function" and left that PDF
unsearchable: `pdfjs-dist`'s `getDocument()` returns a loading task, and
`destroy()` lives on THAT, not on the `PDFDocumentProxy` its `.promise`
resolves to. Also silenced "Ensure that the standardFontDataUrl API
parameter is provided" on every PDF by pointing `standardFontDataUrl`/
`cMapUrl` at `pdfjs-dist`'s own bundled font-metric and CJK character-map
files instead of falling back to an approximation each time. Verified
end-to-end against a real uploaded PDF.

</details>

**Login persistence** - the HttpOnly session cookie that keeps a login across
browser restarts.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1e18c824d5950acf94e6fccd51f5c54dcbbcd09f">The HttpOnly login cookie now always gets a fallback expiry</a>. Thanks to markusst1982 and xet7.</summary>

The native `useHttpOnlyCookies` resume flow only attaches `Expires`/`Max-Age`
to `meteor_login_token` when it can match the freshly issued token back to a
stored resume token in the database at the exact moment the cookie is
written. When that lookup misses, the cookie was written with no expiry at
all, so the browser treats it as a plain session cookie and drops it the
moment the browser closes - silently downgrading the configured 90-day login
into a same-session-only one. `http.ServerResponse.prototype.setHeader` is
now patched to guarantee a fallback expiry, decided by a pure, tested helper
(`server/lib/loginCookieExpiry.js`), whenever a `Set-Cookie` header for that
cookie carries neither directive. This hardens the failure mode that best
matches [#6684](https://github.com/wekan/wekan/issues/6684), which stays
open pending confirmation from a live browser-restart reproduction.

</details>

**Labels popup** - the popup opened from a card's Labels button.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/780f0b9115054e3163fe7ce006927e5ae5abb1df">The Labels popup no longer stays open after leaving a card, or applies to the wrong card</a>. Thanks to rmb82 and xet7.</summary>

The Labels popup (`client/lib/popup.js`'s global `Popup` singleton) was never
closed when a card's details view was closed or swapped for another card -
Blaze just destroys the `cardDetails` template instance, and nothing called
`Popup.close()`/`back()` in response. So the popup stayed visible after
leaving card A, and opening Labels again on card B pushed a new stack entry
on top of the stale one instead of replacing it, leaving the old entry
(still bound to card A's data) rendered alongside the new one and able to
keep toggling labels on the wrong card.

`Popup.open()` now resets its stack when a fresh popup (not a sub-popup
opened from within the popup that is already showing) is opened while a
previous popup is still open. `Template.cardDetails` remembers which card it
was opened for and, on destroy, closes `Popup` if it is still showing that
same card's data at the base of its stack - so closing or switching a card
dismisses its own popup without touching an unrelated one.

</details>

**Swimlanes** - a board-wide list shown once per swimlane row.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6fd8e787e8ca0ee7e850f7c94d429d11253680a1">A board-wide list's collapse state no longer bleeds into every other swimlane's row of it</a>. Thanks to xet7.</summary>

A list with no swimlaneId of its own (shared/pre-migration) renders once
per swimlane in Swimlanes view - the same list document, one row per
swimlane. Collapsing/expanding it was a single Session/profile key keyed
only by the list's `_id`, so collapsing the list in swimlane 1's row also
collapsed swimlane 2's row of the very same list.
`Utils.getListCollapseState`/`setListCollapseState` now take an optional
swimlaneId and fold it into the storage key
(`${list._id}:${swimlaneId}`) - a bare list id, used outside Swimlanes view,
is unchanged, so existing stored state still applies exactly as before.
Every read/write site resolves it via the same `containerSwimlaneId`
pattern already used to scope that list's cards per swimlane, walking up
the enclosing Blaze data contexts.

Archive is unaffected by this: a list's archive/restore already scopes to
its own `_id`, and a board-wide list archived from one swimlane correctly
disappears from every swimlane's row of it - because it IS the one shared
list document, not a different one.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/520b9f56f">#3847's sticky list headers now also stay pinned while scrolling in the Swimlanes view</a>. Thanks to mikesutton and xet7.</summary>

[#2805](https://github.com/wekan/wekan/issues/2805): with `Boards.stickyListHeaders`
turned on (the #3847 toggle), a list's title still scrolled out of view
while scrolling down through several swimlane rows in the Swimlanes view -
the same toggle worked correctly in the default single-swimlane layout.

`position: sticky` only pins an element within its NEAREST ancestor that is
itself a CSS scroll container. `.swimlane`'s unconditional `overflow: auto`
made every swimlane row its own scroll container on both axes, so
`.list.list-sticky-header .list-header`'s sticky rule stuck within that
row's own box instead of reaching the real, page-level vertical scroll on
`.board-wrapper .board-canvas`. Since `.swimlane` itself never scrolls
internally in ordinary use - `.list` is already `height: 100%` of it, and
each list's own `.list-body` carries its card overflow - the row simply
moved out from under a header "stuck" to a box with nothing to scroll.

`.swimlane` keeps `overflow-x: auto`, still needed for a row of lists wider
than the viewport, but no longer captures the vertical axis
(`overflow-y: visible`), so the ancestor search continues up to
`.board-canvas` and the header pins against the real page scroll instead.
No second sticky-header mechanism was added; #3847's single
`stickyListHeaders` toggle and its `.list.list-sticky-header .list-header`
CSS rule are reused unchanged.

</details>

**Outgoing webhooks** - the global and per-board webhook that posts card
activity out.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/691b096fafdd099da697aac895673683f36e3793">Confirmed the global webhook already fires when a card is edited, and pinned it with a regression test</a>. Thanks to Rishats and xet7.</summary>

[#4912](https://github.com/wekan/wekan/issues/4912) asked for an `act-editCard`
action on the global webhook so card edits could be tracked, same as other
card operations already were. Reading the current code shows this is already
the case: `server/models/cards.js` logs an `Activities` entry for title
changes (`a-changedTitle`, from the #3619 fix), description changes
(`a-changedDescription`, from the #5482 fix) and due/start/end/received date
changes, and `server/models/activities.js`'s `Activities.after.insert` hook
turns every logged activity into `act-${activityType}` and dispatches it to
any enabled integration on the card's own board OR the special global-webhook
id, filtered by `activities: { $in: [description, 'all'] }`. So editing a
card's title, description or dates already reaches a globally configured
webhook today, under those activity names. No code change was needed; a
source-pattern regression test (`tests/globalWebhookEditCardActivity.test.cjs`)
now pins this path so it cannot silently regress.

</details>

**Admin Panel** - the "Invite People" form under Accounts settings.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b2ca9962ba30a83ea4f831f44ccf05d2c7bb1d24">The Admin Panel's "Invite People" form now shows whether the invitation email actually sent</a>. Thanks to Rayene123 and xet7.</summary>

This form's `sendInvitation` call used a callback with an empty parameter
list, so it ignored both the error and the result - an admin who hit a
mail-send failure (for example the server's mail transport not being
configured, which `sendInvitationEmail` already reports as a descriptive
`Meteor.Error('email-fail', ...)`) saw nothing at all: the Send button
just stopped spinning either way, matching the silent "sending email
failed" confusion reported in
[#5707](https://github.com/wekan/wekan/issues/5707). The member "Invite
People" popup (`userHeader.js`) already surfaced this via a red/green
`#invite-people-infos` message, so `settingBody.js` now does the same:
it reads the callback's error argument and writes the same success/error
message into a matching `#invite-people-infos` element added to
`settingBody.jade`.

</details>

**User deletion** - the self-delete and admin-delete methods, and what they
leave behind.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c7bf50deb42d0c293c7db053261bde0f96ef71bd">Confirmed deleting a user already prunes their board/card references</a>. Thanks to unowen1939 and xet7.</summary>

[#6541](https://github.com/wekan/wekan/issues/6541) reported "users
disappearing": a board kept referencing a deleted user's id in its
members/assignees after the user document itself was gone, with no error
and no webhook. Reading the current `removeUser` method in
`server/models/users.js` (both the self-delete and admin-delete paths) shows
it already fires the same `Users.after.remove` hook that was added for
[#1289](https://github.com/wekan/wekan/issues/1289), which prunes the
deleted id out of boards, cards, lists and avatars via
`models/lib/userDeletionCleanup.js`. No code change was needed; the existing
regression test `tests/userDeletionCleanup.test.cjs` now documents that it
also covers this report.

</details>

**Rules (IFTTT)** - creating a rule, and its title.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/52972b3e4cacdc451e5840709f505e98db285913">Clicking "Add Rule" with an empty title now shows a validation message instead of doing nothing</a>. Thanks to xeruf and xet7.</summary>

[#4294](https://github.com/wekan/wekan/issues/4294) described the rules
wizard as clunky: the "Add Rule" button visibly reacted to a click with an
empty title field, but nothing happened next, with no explanation why. The
field is now highlighted and a validation message appears instead of the
silent no-op.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/52972b3e4cacdc451e5840709f505e98db285913">A rule created with no title now gets a sensible default composed from its trigger and action</a>. Thanks to xeruf and xet7.</summary>

Also from [#4294](https://github.com/wekan/wekan/issues/4294): once a
trigger and an action are chosen, `models/rules.js`'s `title` schema
generates a default like "When a card is added to list Doing, then set due
date" from the trigger/action's own human-readable descriptions (the same
strings the "View rule" details page already shows), via a new pure,
unit-tested helper, `models/lib/generateDefaultRuleTitle.js`. This applies
to every path that creates a rule - the classic wizard, the
`rules.createRule` server method, and the workflow canvas - so a rule is
never left unnamed; it can still be renamed afterwards with the rules
list's existing inline rename.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e643f0da71db3555f50c031a9fd532b092656d2f">The "send an email" rule action now links the card, and supports {card}/{cardLink}/{list}/{board}/{member} tokens</a>. Thanks to vossilius and ivan-paleo and xet7.</summary>

[#3301](https://github.com/wekan/wekan/issues/3301) and
[#3304](https://github.com/wekan/wekan/issues/3304) reported the same gap:
the email a "send an email" rule action sends carried no reference at all
to the card that triggered it - no title, no direct link, and no way to
pull in the list, board or the relevant member. `performAction()` already
built a `ruleVars` map and substituted `{name}` tokens in the email
subject/body (added for [#2475](https://github.com/wekan/wekan/issues/2475)),
so this extends that existing mechanism rather than building a new one:
`{cardLink}` resolves through `Card.absoluteUrl()`
(`models/lib/cardUrl.js`), the same helper card activity notification
emails already use, and `{member}` resolves the activity's relevant member
(who was added/removed/etc.), falling back to the acting user. `{card}`,
`{list}` and `{board}` are short aliases of the existing
cardname/listname/boardname variables. A new hint line next to the email
fields (`r-email-vars-hint`, translated to every locale) documents the
tokens directly in the rule-action UI. Independently of any template the
user configures, the card's title and link are now always appended to the
sent email body, so a rule set up before this change - with no tokens at
all - still gets a usable link.

`substituteVars()` moved out of `server/rulesHelper.js` into a new pure
`models/lib/ruleVarsSubstitute.js`, the way `models/lib/cardUrl.js` next to
it already is, so `tests/ruleEmailVars.test.cjs` can unit test token
substitution directly (including case-insensitivity, unknown tokens left
as literal text rather than crashing, and malformed braces not mistaken
for a token) alongside the automatic card-link footer and the translated
hint text.

</details>

**Subtasks** - the minicard's "N/M subtasks" completion badge.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2bc82f9ff5feee560f0fb8ee79a5210cf06f5658">Confirmed the subtask completion badge already counts archived subtasks correctly</a>. Thanks to ufalke and xet7.</summary>

[#4050](https://github.com/wekan/wekan/issues/4050) reported the minicard's
subtask badge stuck at "0/n" no matter how many subtasks were finished, and
expected giving a subtask an End Date to make it count. Reading the current
`models/cards.js` shows the counter itself is correct: `subtasksFinishedCount()`
counts subtasks with `archived: true` (the numerator), `allSubtasksCount()`
counts every subtask regardless of archived state (the denominator), and
`Card.archive()` - the actual way a subtask is finished - sets that flag and
recurses into its own children, correctly moving the badge from "0/n" toward
"n/n". `setEnd(endAt)` only ever writes `{ endAt }` and never touches
`archived`, by design: an end date is a due-date field, not a completion flag,
so setting one alone leaves the badge unchanged. No code change was needed;
`tests/subtaskCompletionCounter4050.test.cjs` now pins the numerator/denominator
source and both the archived-subtasks and end-date-only cases so this cannot
silently regress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4de77a4a5">An archived subtask now stays in the card's subtask list, shown as completed, with a toggle to hide it</a>. Thanks to Somantiq and xet7.</summary>

[#3409](https://github.com/wekan/wekan/issues/3409) reported that archiving
a subtask - the action that already moves the badge above from "0/n"
toward "n/n" - made it vanish from the parent card's own subtask list
instead of showing as completed, unlike a checked checklist item, which
stays visible with a struck-through, dimmed look. Reading
`client/components/cards/subtasks.jade` confirmed the list was built from
`currentCard.subtasks()`, and `models/cards.js`'s `subtasks()` queries
`{ archived: false }`, so an archived subtask was filtered out of the
query entirely.

The list now reads from `allSubtasks()` (no `archived` filter) through a
new `visibleSubtasks()` template helper in `subtasks.js`, so an archived
subtask stays in the list by default and is marked with an `is-completed`
class - a strikethrough title and a green checkmark icon, the same "done"
treatment `subtasks-item .item-title.is-checked` already gives a checked
checklist item. A "Hide completed subtasks" toggle above the list flips a
client-side `ReactiveVar` that filters archived subtasks back out for
anyone who wants the shorter list; it is a per-viewing preference of the
list, not card data, so no new `Cards` schema field was needed.
`tests/subtaskArchivedVisibility3409.test.cjs` pins the query change, the
completed styling, the toggle's wiring end-to-end, and that the #4050
counter logic above is untouched.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9aaecba8b1cf1a4219131cac14a66fb393d931af">Confirmed a newly-created subtask already lands in the parent card's own swimlane</a>. Thanks to savin-msk and xet7.</summary>

[#2732](https://github.com/wekan/wekan/issues/2732) asked that a subtask land
in the same swimlane as its parent card instead of some other or default one.
Reading `server/models/cards.js`'s `addSubtaskCard` method shows this is
already the case: a new subtask is not simply inserted onto the parent's own
board, it goes to a dedicated default subtasks board/list (see
[#3868](https://github.com/wekan/wekan/issues/3868)/[#5788](https://github.com/wekan/wekan/issues/5788)/[#2256](https://github.com/wekan/wekan/issues/2256)),
so its `swimlaneId` can never literally equal the parent's - swimlanes are
scoped to a single board. The method already resolves the correct swimlane on
that destination board by TITLE instead: it reads the parent card's own
swimlane, reuses the swimlane on the target board whose title matches it, and
only falls back to the target board's default swimlane when no such swimlane
exists there yet. No code change was needed;
`tests/subtaskSwimlaneInheritance2732.test.cjs` now pins the parent-swimlane
lookup, the title-matching reuse, the default-swimlane fallback branch, and
that the inserted card carries the resolved `swimlaneId`, so this cannot
silently regress.

</details>

**My Cards** - the cross-board "cards assigned to/watched by me" list.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c7db5429b">Clicking a card in My Cards now opens it in the popup instead of navigating away to its board</a>. Thanks to javen9881 and xet7.</summary>

[#3640](https://github.com/wekan/wekan/issues/3640) reported that clicking a
card in My Cards - which lists cards from many boards on one page - followed a
plain `<a href="board-url">` link and navigated the whole browser to that
card's own board, losing the user's place in the My Cards list. Reading
`client/components/main/myCards.jade`/`.js` confirmed the bug was still
present: the card link carried no click handler at all.

Fixed by reusing the mechanism the app already uses to open a card from other
cross-board contexts - global search results
(`client/components/cards/resultCard.js`) and the Board Table view's Edit link
(`client/components/boards/tableView.js`): intercept the click, subscribe the
`popupCardData` publication for that card, set the `popupCardId`/
`popupCardBoardId` Session variables, and open the shared `cardDetails` popup
in place. The link keeps its `href`, so middle-click/ctrl-click and a no-JS
fallback still work.
`tests/myCardsInlineCardPopup.test.cjs` pins the click handler's
`preventDefault()`, the popup-opening call sequence, and that it matches the
same shape used by `resultCard.js` and `tableView.js`.

</details>

**Admin Panel and Public Boards** - inviting people, deleting a user, and
viewing a public board while logged out.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2ccd70f45">Pinned Admin Panel invite/delete people and logged-out public board viewing with regression tests</a>. Thanks to Cupara and xet7.</summary>

[#3310](https://github.com/wekan/wekan/issues/3310) (2020) asked for three
things. Reading the current code shows all three are already there, in some
cases in a stronger form than what was asked for: Admin Panel -> Settings'
"Invite via Email" (`settingBody.js`, `sendInvitation`) already generates and
mails a per-invitee invitation code rather than a single static one an admin
would have had to hand out; Admin Panel -> People already deletes a user
account - a row's "more settings" link opens the settingsUser popup, whose
`#deleteButton` calls the `removeUser` server method; and a public board's own
URL (`/b/:id`, `/b/:id/:slug`) carries no sign-in requirement in the router,
and the board publication's visibility selector already matches
`{ permission: 'public' }` for a subscriber with no `userId` at all
(`models/lib/boardVisibilitySelectors.js`). No code change was needed;
`tests/issue3310FeatureRequests.test.cjs` now pins all three so they cannot
silently regress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4d9282359e27a0e396daa50e1951d40430d005b6">A global Admin Panel admin can now edit or delete any board, even one none of whose members are left</a>. Thanks to relikd and xet7.</summary>

[#3249](https://github.com/wekan/wekan/issues/3249): a board created by a
user who later left the organization - or was removed as an admin - ended
up with nobody able to touch it, not even through the Admin Panel: renaming
it, changing its description/visibility, adding a label, removing a member
or archiving/deleting it all went through the board's own `Boards.allow`
`update`/`remove` rule, which only checked `board.hasAdmin(userId)` against
that board's own member list. `inviteUserToBoard` already bypassed this for
a global site admin (`user.isAdmin`); the whole-board update/remove rule did
not, so an orphaned board's settings and membership were permanently stuck.

`server/lib/utils.js` gets `isBoardAdminOrSiteAdmin` (a small pure decision
function) and the async `allowIsBoardAdminOrSiteAdmin` wrapper that looks up
the caller's global `isAdmin` flag; `server/permissions/boards.js`'s
`update`/`remove` rules now use it instead of the board-only
`allowIsBoardAdmin`. The bypass is scoped to that one rule only - the
narrower `rules`/`actions`/`triggers`/`cardComments` allow rules
deliberately keep the board-only check, which a negative test pins so the
wider bypass cannot spread there by accident.

Two related asks from the same report turned out to already be covered:
permanently deleting a board (as opposed to only archiving it) already
exists as the Global-Admin-only, feature-flag-gated "Archive -> permanent
delete" action added for [#6643](https://github.com/wekan/wekan/issues/6643)
(`permanentlyDeleteArchivedBoards`, `server/models/boards.js`), which never
required board membership in the first place; and Teams/Organizations
already auto-grant board access, including to a member who joins the team
*after* it was added to the board ([#4593](https://github.com/wekan/wekan/issues/4593),
`models/lib/teamBoardMemberSync.js`). The report's third ask - a "semi-open"
board tier visible to every logged-in user but excluded from search-engine
indexing - is a real gap (WeKan's `permission` field is only
`public`/`private`, with no noindex concept anywhere), but changes what
"public" means across the Public Boards page, the visibility selector and
sitemap/robots routing, so it needs a maintainer decision on the exact rule
before it is built; see TODO Later.

</details>

- [Confirmed #2413 ("Site admins to see all boards and change any board
  permissions") is the same request as #3249 and is already resolved by the
  fix above; annotated the regression test accordingly](https://github.com/wekan/wekan/commit/677c60fb2).
  Thanks to JackNWeems and xet7.

**Checklists** - individual items inside a checklist.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/af847bd08">A Worker can now check/uncheck a checklist item, without gaining edit or delete</a>. Thanks to mweiss237 and xet7.</summary>

[#3307](https://github.com/wekan/wekan/issues/3307): a board member with the
Worker role could not check or uncheck a checklist item at all - the checkbox
was gated behind the same `canModifyCard`/`write` check that also gates
editing and deleting an item, both on the client
(`client/components/cards/checklists.jade` never drew a clickable box) and on
the server (the `ChecklistItems.allow().update()` rule refused the write).

Widening `write` for Worker was not the fix - that would also hand Workers
edit and delete, which the reporter explicitly did not want. Instead this
gives checking/unchecking its own, narrower, field-level capability, the same
shape as the existing move/self-assign carve-out for cards
(`models/lib/workerCardWrite.js`, #3189):
`models/lib/workerChecklistItemToggle.js` allows a Worker to `$set isFinished`
and nothing else on a checklist item, enforced in
`server/permissions/checklistItems.js`. The client mirrors it with
`Utils.canCheckChecklistItem` / a `canCheckChecklistItem` Blaze helper, so the
checkbox is drawn under that helper while the rest of the row - title edit,
drag handle, due-date edit, delete - still requires the full write
capability a Normal member has.

</details>

**Custom fields** - the board's custom-field definitions and how they display.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bf2fa4179">An auto-create custom field now shows on every quick-added card, not only the first one</a>. Thanks to coleyon and xet7.</summary>

[#2392](https://github.com/wekan/wekan/issues/2392): a custom field with
"Auto create field to all cards" (or "Always on card") and "Show field
label on minicard" enabled applied correctly to the first card created
through a list's quick-add form, but not to any card created after it in
the same session.

`client/components/lists/listBody.js`'s `addCardForm` computed the
board's automatic custom fields exactly once, inline in `onCreated`, and
reused that same value for every submission. The form's own `reset()` -
meant to clear "More options", labels and members between cards - set
that list back to `[]` unconditionally instead of recomputing it, so any
reset between two cards silently dropped the automatic field starting
with the second one. `onCreated` and `reset()` now share one
`automaticCustomFieldsForCurrentBoard()` helper that recomputes the
field list from the board's current custom-field definitions every time,
so it is (re)applied consistently rather than only once per form
lifetime. A regression test creates three cards in sequence and asserts
the automatic field is attached to all three, not just the first.

</details>

**Attachment uploads** - the attachment/avatar upload pipeline, both the
filesystem and cloud storage backends.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9b03e77de">A file's real content is now checked against its declared type, and a spoofed upload is rejected</a>. Thanks to blaggacao and xet7.</summary>

[#3274](https://github.com/wekan/wekan/issues/3274): uploads were validated
against their client-declared MIME type/extension, but nothing compared that
declared type against the file's REAL content, so an executable renamed with
an image extension and a spoofed `image/jpeg` Content-Type (e.g. an `.exe`
renamed to `.jpg`) uploaded as if it were a genuine image.

Adds `models/lib/uploadContentMismatch.js`, a pure decision module (no
server, no filesystem) that flags only a MEANINGFUL, dangerous mismatch:
content that magic-byte-sniffs as an executable (Windows PE, ELF, Mach-O,
MSI, JAR/APK, ...) or a shell/batch script, while the declared type claims
to be an image, document, audio, video, plain text or archive. It
deliberately leaves compatible textual differences alone (`text/plain` vs
`text/csv`) and does not flag an executable that is honestly declared as
one - the existing allow-list already governs whether executables are
permitted at all - so a legitimate upload is never broken by a false
positive.

`models/fileValidation.js`'s `isFileValid()` - the single choke point
already shared by `models/attachments.server.js` and
`models/avatars.server.js` - now sniffs the file's real type with the
`file-type` package (MIT, already a dependency, used the same way for
extension correction in `models/lib/fileTypeCorrection.js`) and rejects a
dangerous mismatch before the file reaches its storage backend. A blocked
attempt is logged to Admin Panel -> Problems under the existing `file.mime`
security-log key (CWE-434, MimeBleed), wrapped so a logging failure can
never break the guard itself.

`tests/uploadContentMismatch.test.cjs` unit-tests the pure decision function
directly: positive cases for legitimate uploads of each declared type
(image, PDF, compatible textual mismatch, an honestly-declared executable),
negative cases for a Windows PE `.exe`, an ELF binary and a Mach-O binary
each disguised with an image/document type, and a shell/batch script
disguised the same way, plus a codebase-wide search proving no other
module re-implements its own bypassing magic-byte check and that both
upload paths (attachments, avatars) go through the same guard.

This is hardening, not a critical/remote-code-execution fix on its own: a
rejected, deleted stored file never executes on the WeKan server merely by
being stored, so it stays a normal bug-fix/security-hardening entry rather
than a CRITICAL SECURITY ISSUE.

</details>

**Board search** - the sidebar search box and the per-list quick search.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/475f14c4a">It now also matches text inside card comments, not just title/description/custom fields</a>. Thanks to javiloncho and xet7.</summary>

Board.searchCards() (the sidebar search and the per-list quick search) only
matched a card's title, description and custom fields; global search already
matched comment text, but the board-scoped search did not, so a card whose
only match was in a comment never turned up. `matchingCommentCardIds()` was
added to `models/lib/cardSearch.js`: given the board's comments and the
search term it returns the card ids whose comment text matches, reusing the
same case-insensitive matching rule as the rest of the search, and
`Board.searchCards()` now ORs those card ids into its existing query.
`tests/cardSearch.test.cjs` covers a comment-only match, a non-match, and
case-insensitivity.

</details>

**Notification emails** - the HTML-formatted card/board activity notification
email.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b6da4ebe9652f42e8923aa24afc52eb4885f7b51">A card/board URL in an HTML notification email is now a real clickable link</a>. Thanks to papimla and xet7.</summary>

The HTML-formatted notification email (`server/notifications/email.js`,
`htmlEnabled` gated on `RICHER_CARD_COMMENT_EDITOR`) built its body from the
same plain-text line used for the non-HTML email - actor, translated
description, then the card/board's absolute URL - and merely escaped and
`<br/>`-ified the whole thing. That left the URL sitting as bare text a
mail client might happen to auto-link, not a real `<a href>` the way every
other part of the HTML email is markup. `buildHtmlNotificationLine()`
(`models/lib/emailNotificationSafety.js`) now builds the HTML body
directly: the actor name and translated description are still escaped
exactly as before (this is the same code path MailTitleBleed hardened, so
that stays unchanged), and the URL is wrapped in
`<a href="...">...</a>` - itself escaped before going into both the href
attribute and the link text, so neither an HTML-active title nor a
malicious URL can break out of the tag. The plain-text (non-`htmlEnabled`)
email is untouched and still sends the bare URL as text, which is correct
there.

</details>

**Card dates** - the Received/Start/Due/End date popup shared by every date
field, a vote and a planning poker end date, and a date custom field.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fdc84e2e6">The time field now accepts an hour alone, and an empty time defaults to midnight instead of being rejected</a>. Thanks to fakaki and xet7.</summary>

`<input type="time">` only ever reports a complete `HH:mm` value to
JavaScript - typing just the hour ("13") and moving on leaves the browser's
own `.value` empty, so the popup could not tell "13" typed from nothing
typed at all, and the digits the user entered were silently thrown away.
The date popup's shared time field
(`client/components/forms/datepicker.jade`, one `editDateForm` used by
Received/Start/Due/End, vote end, poker end and date custom fields alike)
is now a plain text input instead, so a partially typed time actually
reaches the parser.

`parseTimeInput()` (`imports/lib/datePickerTime.js`) is the new shared,
pure parser: an hour alone ("13", "7"), with or without am/pm ("1pm",
"11:30 PM"), normalizes to that hour at `:00`; a blank field parses as
`00:00`; the existing `HH:mm` format is unaffected; anything else (letters,
an hour above 23, a minute above 59, a 12-hour hour outside 1-12) is still
rejected exactly as before. `client/lib/datepicker.js`'s `change` and
`submit` handlers on the shared form both call it, so due, start, end and
received dates, vote/poker end dates and date custom fields all get the
same looser input the same way. The submitted-empty-field behavior added
for [#1502](https://github.com/wekan/wekan/issues/1502) - falling back to
the popup's own configured default time (17:00 for due dates, "now" for
received/start/end) rather than always midnight - is unchanged; the new
midnight default is `parseTimeInput`'s own contract for callers that ask it
to parse an actually-empty string directly.

</details>

**Template sharing** - the picker opened by the card/list/swimlane/board "from
template" buttons.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/07f6cda95e56c36fb38fa1a95e9ddeb1e60d661e">The template picker now also searches a template board shared by another member, not only the user's own</a>. Thanks to ADDAH-temp and xet7.</summary>

[#2684](https://github.com/wekan/wekan/issues/2684) asked to let a team
share board/card templates with other members, not just the creator. A
template-container board is a regular board with a special `type`, so it
already gets normal board membership - adding another user as a board
member of a template board is the existing, generic sharing mechanism,
exactly like sharing any other board, and
`server/publications/boards.js`'s `boardTemplates` publication already
lists any template-container board a user is a member of, not only ones
they personally created (it is scoped through the same
`boardVisibilitySelectors()` every other board-visibility check uses).

The actual gap was narrower: the "apply a template" picker
(`Template.searchElementPopup` in `client/components/lists/listBody.js`)
was hard-wired to only the current user's own
`profile.templatesBoardId`, so a template board shared by another member
never showed up there even though it already appeared in the All Boards
"Templates" view. The picker now also subscribes to `boardTemplates` and
offers any OTHER template-container board the user is a member of, via a
new dropdown that defaults to the user's own template board exactly as
before.

</details>

**Card description and comments** - the markdown rendered from a card's
description and comment text.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0aa1702c0">A "- [ ] Task" / "- [x] Done" checklist line now renders as a real checkbox, not literal HTML text</a>. Thanks to rodrigocipriani and xet7.</summary>

[#2419](https://github.com/wekan/wekan/issues/2419) (2019): writing GFM
task-list syntax in a card description showed the reader
`<input disable="" type="checkbox"/> Task` as plain text instead of a
checkbox. WeKan's markdown renderer
(`packages/markdown/src/template-integration.js`) is plain `markdown-it`
with no task-list extension, so it never emitted an `<input>` element in
the first place, and `packages/markdown/src/secureDOMPurify.js`'s
sanitizer also listed `input` in `FORBID_TAGS` - so even a raw `<input>`
typed directly into the text would have been stripped.

A small `markdown-it` core rule, added after the emoji/math plugins,
detects the leading `[ ]`/`[x]`/`[X]` marker on a list item's first line
and replaces it with a disabled `<input type="checkbox">` (checked to
match `x`/`X`); everything else about the line renders exactly as before.
`secureDOMPurify.js` now allows `input` through, but only in the exact
shape this renderer emits: `uponSanitizeElement`/`uponSanitizeAttribute`
hooks reject any `type` other than `checkbox` and any `input` carrying a
`name`, `value`, `form` or `formaction` attribute, so a card cannot smuggle
in a live text/password field or a form control - `form` itself stays
forbidden.

The checkbox renders correctly and reflects the source accurately, but is
deliberately left **disabled** (not clickable): toggling it would mean
mapping a click on rendered HTML back to the exact byte offset inside the
card's raw markdown source and saving the edit, which is a materially
larger, separate feature from fixing the "renders as literal text" bug
this issue reported. `tests/markdownTaskListCheckbox.test.cjs` renders
`- [ ] Task` / `- [x] Done` through the real plugin and asserts an
unchecked/checked `<input type="checkbox">` is produced, that a plain
bullet list and ordinary inline markdown are unaffected, and that
`secureDOMPurify.js` still allows the tag through restricted to
checkbox-only.

</details>

**Archive sidebar** - the sidebar tab that lists archived cards, lists and
swimlanes.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5c77c86bb">An archived card now opens in the full card-detail popup, with a Restore action of its own</a>. Thanks to therampageradoagent and xet7.</summary>

[#1504](https://github.com/wekan/wekan/issues/1504): the Archive sidebar's
card tab drew each archived card with the same narrow shared minicard every
other list uses, but clicking it did nothing - `sidebarArchives.js` had no
`.js-minicard` click handler at all, so the only way to see more than the
minicard's own cramped preview was the separate Restore/Delete text links
beside it.

Clicking an archived card now opens the SAME full card-detail popup
(`cardDetailsPopup` / `Template.cardDetails`) a normal board card opens -
full width and height, every field, all the normal card-detail
functionality - reusing the exact `popupCardId`/`popupCardBoardId` +
`Popup.open('cardDetails')` mechanism `myCards.js` and `resultCard.js`
already use for their own cross-context minicards, rather than building a
parallel "archived card preview" component.

That full view had nowhere to put the card back once it was open: its
action menu hid "Archive" while a card was already archived, but offered no
opposite action. Both copies of the action menu (the `canModifyCard` one and
the read-only one) now show a "Restore" entry in exactly that place,
calling the same `card.restore()` mutation the Archive sidebar's own
Restore link already uses, with the same target-list fallback popup
(`restoreArchivedCardToListPopup`) for a card whose list was itself archived
or deleted, so `canBeRestored()` is never asked about a missing list.

`tests/archiveSidebarFullCardDetails.test.cjs` pins the click handler to the
shared `cardDetails` popup template rather than a bespoke preview, checks
both action-menu copies gained the Restore entry where Archive used to be
the only option, and confirms the Restore action reuses the existing
`card.restore()` call and target-list fallback popup.

</details>

**Lists** - a list's own header, as a card drag-and-drop target.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4c89aa6a7">Dropping a dragged card on a list's header now moves it into that list</a>. Thanks to TylerL-uxai and xet7.</summary>

[#766](https://github.com/wekan/wekan/issues/766) reported that dropping a
dragged card precisely onto another list's header/title, rather than its
card-body area, did nothing - the card snapped back to its source list. The
card sortable's `connectWith` (`.js-minicards:not(.js-list-full)` in
`client/components/lists/list.js`) only covers each list's card-body area;
`.js-list-header` sits in normal document flow directly above it and does
not overlap it, so jQuery UI's own connectWith/intersection resolution never
finds a container there and silently cancels the drop - confirmed by reading
the sortable configuration and the list/list-header markup and CSS, not by
guessing.

The sortable `stop` handler now hit-tests the mouseup event's own
coordinates for a `.js-list-header` ancestor and, when found, resolves the
same prev/next-card, `listId` and target-container values a drop at the TOP
of that list's card body would produce, so the rest of the handler - the
sort-index calculation, the degenerate-sort-gap repair, and the single
existing `card.move()` mutation - runs completely unchanged. Dropping on a
list's header now inserts the card as the first card of that list, the same
insertion point an ordinary drop just above the first card already uses.

`tests/listHeaderCardDrop766.test.cjs` is a pure-Node source-read regression
guard, since interactive drag-and-drop needs a browser: it pins that the
list header carries the `.js-list-header` class the detection hit-tests for,
that the sortable `stop` handler hit-tests the drop point for it, that a
header drop resolves to no previous card and the target list's first card as
next, and that `list.js` still calls `card.move()` at only its two
pre-existing call sites (the multi-selection loop and the single-card drop)
- a negative check that the fix reuses the existing move mutation rather
than adding a second implementation of it. Live drag-and-drop behavior could
not be visually verified in this environment; the fix and its test are
source-level only.

</details>

**The build** - what stopped ./build.sh's development build.

- [Fix two Jade syntax errors that broke the development build](https://github.com/wekan/wekan/commit/7b7ad30fe). Thanks to xet7.
- [Fix the build: frappe-gantt's CSS has no importable subpath export](https://github.com/wekan/wekan/commit/0782d8c66). Thanks to xet7.
- [Update the npm/Meteor lockfiles for the SAML accounts package](https://github.com/wekan/wekan/commit/0aa5c6795). Thanks to xet7.

**Document preview** - the 415 errors opening an attachment.

- [Fix #6685: document preview 415 from a stale stored name on disk](https://github.com/wekan/wekan/commit/64adab5aa). Thanks to xet7.
- [Fix #6685: PDF preview 415 from pdfjs guessing the worker's bundled path](https://github.com/wekan/wekan/commit/eb98abe4b). Thanks to xet7.
- [Fix PDF/DOCX/XLSX/PPTX preview 415 when the optional canvas dependency is missing](https://github.com/wekan/wekan/commit/9b9c2fe6e). Thanks to xet7.
- [Fix PDF search indexing: the wrong object was destroyed, and font/cmap assets were missing](https://github.com/wekan/wekan/commit/fb895847b). Thanks to xet7.

and has the following developer-tooling improvements and fixes:

**Developer tooling** - helpers, release tooling and test infrastructure.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2e752c1e9">Extracted the OIDC RP-Initiated Logout URL builder into a pure, tested helper</a>. Thanks to Dzordzu and xet7.</summary>

[#2905](https://github.com/wekan/wekan/issues/2905) asked for Single Logout
(SLO): logging out of Wekan should also end the identity provider's own SSO
session for OIDC/OAuth2 providers that support RP-Initiated Logout (Keycloak's
`/realms/<realm>/protocol/openid-connect/logout`, for example), via an
optional `OAUTH2_LOGOUT_ENDPOINT` env var. This was already built for
[#6158](https://github.com/wekan/wekan/issues/6158) -
`getOauthLogoutUrl()` in `server/models/settings.js`, wired into
`config/accounts.js`'s `onLogoutHook()`, documented in
[Keycloak.md](https://github.com/wekan/wekan/blob/main/docs/Features/Login/Keycloak/Keycloak.md)
and the `docker-compose.yml` OAuth2 example blocks - so #2905 needed no new
feature. When `OAUTH2_LOGOUT_ENDPOINT` is unset (the default), logout is
unchanged.

Its URL-building logic lived inline in the Meteor method with no direct test
coverage. Extracted it to `server/lib/oauthLogoutUrl.js`'s pure
`buildOauthLogoutUrl()` (endpoint/serverUrl/clientId/redirectUri in, the
end_session URL out, following the OpenID Connect RP-Initiated Logout 1.0
spec's `post_logout_redirect_uri`/`client_id` params), mirroring
`server/lib/ldapPasswordLoginGuard.js`'s plain-Node testable style.
`getOauthLogoutUrl()` now calls it; behavior is unchanged. Added
`tests/oauthLogoutUrl.test.cjs`, covering the default no-op, a Keycloak-shaped
path endpoint resolved against `OAUTH2_SERVER_URL`, an absolute endpoint, an
endpoint that already carries a query string, and percent-encoding of the
redirect URI.

</details>

**Multi-select actions** - the checkbox multi-select sidebar's action bar.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/02e028276">Add regression coverage confirming Move/Copy selection already works across boards</a>. Thanks to gerroon and xet7.</summary>

[#2155](https://github.com/wekan/wekan/issues/2155) asked to move/copy several
selected cards to a different board at once, through an explicit action
rather than drag-and-drop. That action already exists: WeKan's checkbox
multi-select sidebar (`client/components/sidebar/sidebarFilters.jade`/`.js`)
has had "Move selection" and "Copy selection" buttons since
`82db0800e` ("Move/Copy selection and Move/Copy swimlane: one dialog each,
not two."), each opening the same board/swimlane/list destination picker used
throughout the app (`selectionDestinationPicker`). The board `<select>` lists
every board the user is a member of - not only the current one - and Done
walks the whole selection in order, calling `card.move()` for Move or
`copyCard` + `.move()` for Copy, so it already covers the cross-board case
this issue asked for. This is distinct from
[#3298](https://github.com/wekan/wekan/issues/3298), which is about
drag-and-drop specifically inside the Bigboard view.

`tests/cardMultiSelectionMoveCopyToBoard.test.cjs` is a pure-Node source-read
regression guard pinning: the Move/Copy selection buttons and popups exist;
the board picker queries every board the user belongs to rather than
filtering to the current board; the shared Done handler iterates the full,
selection-scoped card list (`MultiSelection.getMongoSelector()`) rather than
a subset; Move applies `card.move()` with the chosen board/swimlane/list/sort
position; and Copy creates the new card on the destination board first and
moves that new card into place, never the original - with a negative case
confirming a failed copy is skipped rather than falling through to touch an
unrelated card.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0c7524db05a492e04b047e7523b916ccfb9df0c6">Add a one-click "Archive all cards in this list" entry to the List menu</a>. Thanks to bkiehle and xet7.</summary>

[#3383](https://github.com/wekan/wekan/issues/3383) asked for a button that
archives every card of a single list at once, instead of moving them to
Archive one at a time. The checkbox multi-select sidebar already reaches
this indirectly - "Select all cards in this list" from the List hamburger
menu, then "Archive selection" from the sidebar - but that is two menus for
one outcome, so the List hamburger menu (`listActionPopup`,
`client/components/lists/listHeader.jade`/`.js`) gets its own
"Archive all cards in this list" entry next to the existing "Select all
cards in this list" one. It reuses the exact same card-id scoping ("Select
all cards" above: the current swimlane in Swimlanes board view, the whole
list otherwise) and hands the list off to the SAME server method the
sidebar's "Archive selection" button already calls -
`archiveSelectedCards(boardId, cardIds)` in `server/models/cards.js`, added
for [#6608](https://github.com/wekan/wekan/issues/6608) - so no new
archiving logic was written, only a second caller of the existing one,
behind a confirmation popup (`listArchiveCardsPopup`) in the same
confirm-then-act shape "Archive list" (the list itself, not its cards)
already uses. The `list-archive-cards`/`list-archive-cards-pop` translation
strings already existed in every locale file - added ahead of the feature -
so this commit only had to wire them up.

`tests/listArchiveAllCards3383.test.cjs` is a pure-Node source-read
regression guard pinning: the menu entry and its confirmation popup exist;
the click handler is gated behind `Popup.afterConfirm('listArchiveCards', …)`;
the scoping matches "Select all cards" exactly; the handler calls the shared
`archiveSelectedCards` method rather than looping `card.archive()` or
`Cards.update` itself; an empty list never reaches the server call; the
server still defines exactly one `archiveSelectedCards` method (no
duplicate); and every locale file already carries both translation keys.

</details>

**Exports** - auditing every format this release's Export popup offers.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/895583784">Fix an overly-strict CHART_KEYS regex in the Time export regression test</a>. Thanks to xet7.</summary>

Following the JSON-export truncation report, every OTHER export format
was audited end-to-end: board JSON/CSV/iCal/HTML archive/dependency graph
(JSON+SVG)/Kanboard/Trello/Jira/NextCloud Deck/OpenProject/GitHub/GitLab/
Gitea/Forgejo/Asana/Zenkit/Markdown, and PDF/Excel for all 13 chart/report
views (`dashboard`, `burndown`, `burnup`, `cumulativeFlow`, `controlChart`,
`cycleTime`, `flowEfficiency`, `leadTime`, `throughputHistogram`, `wipRun`,
`gantt`, `time`, `pulse`). For each, the route, the data-builder it calls
and the UI entry that offers it were read directly rather than assumed:
every route is registered and reachable, every builder is genuinely called
and produces correct output, and none of them buffer attachment binary data
the way the JSON export did.

The only defect found was in the TEST suite, not the export code:
`tests/timeViewReportAndExport.test.cjs` asserted `models/exportCharts.js`'s
`CHART_KEYS` Set ended with `'time'`, which stopped being true once `'pulse'`
was appended after it - the export itself was never affected. The regex now
matches `'time'` anywhere in the Set literal instead of requiring it last.

</details>

**Imports** - the natural companion audit, on the import side.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/baec475fe">Add regression tests for CSV, Kanboard and Jira import parsing</a>. Thanks to xet7.</summary>

Every import source was audited end-to-end the same way: WeKan JSON,
WeKan zip, Trello JSON/API/zip, CSV/TSV, Excel, Jira, Kanboard, Markdown,
NextCloud Deck/OpenProject/GitHub/GitLab/Gitea/Forgejo/Asana/Zenkit, and
ICS. Every one of them is genuinely reachable from the Import popup and
produces a real board - no dead popups, no "Mapper"-only stubs. The
WeKan JSON round-trip (`models/wekanCreator.js`) restores swimlanes,
lists, cards, checklists, labels and custom fields without dropping any
of them.

This also checked the cross-cutting question the JSON-export truncation
report raised: does import now expect attachment content the export side
might stop embedding inline? It does not - `models/wekanCreator.js`'s
attachment import already works both from inline base64 content and from
a bare URL reference, so an attachment with no embedded bytes simply
isn't recreated rather than failing the whole import, and the export
side's fix (attachments always empty in JSON export, commit
643e2738b, already on `main`) needs no matching change here.

The one genuine gap found was test coverage, not behavior: CSV, Jira and
Kanboard import had real, working parsers but no dedicated tests. Added
`tests/csvCreator.headerMapping.test.cjs` (header aliases and the
customfield-<name>-<type>-<extra> dropdown/currency/plain variants) and
`tests/kanboardJiraCreator.import.test.cjs` (Kanboard's unix-timestamp
date parsing and column/swimlane derivation, and Jira's issue-link-to-
card-dependency mapping), each a faithful copy of the production logic
since both modules import Meteor code that can't run under plain Node -
the same convention `tests/trelloCreator.import.test.js` already uses.

</details>

**Test guards** - suites that read the source, brought up to date with
deliberate changes, and new coverage.

- [Fix tests still referencing the renamed mirror scripts](https://github.com/wekan/wekan/commit/117edc33b). Thanks to xet7.
- [Update seven node test-suite guards for legitimately-changed behavior](https://github.com/wekan/wekan/commit/404dad239) and [five more for intentional changes made the same day](https://github.com/wekan/wekan/commit/d8d3446cc). Thanks to xet7.
- [Fix the minicard collapse test's off-by-scope index and a stale offset](https://github.com/wekan/wekan/commit/688a2b3c4). Thanks to xet7.
- [Add regression coverage for label add/remove activity logging (#572)](https://github.com/wekan/wekan/commit/eae45d19b). Thanks to xet7.
- [Add a unit test for the swimlane-scoped WIP limit group arithmetic](https://github.com/wekan/wekan/commit/52891ec01) and [note the swimlane WIP quick-select test as the #2380 closing reference](https://github.com/wekan/wekan/commit/35ad7bc92). Thanks to xet7.
- [Add regression coverage for the List menu's "Archive all cards in this list" action](https://github.com/wekan/wekan/commit/c55af0e34). Thanks to xet7.
- [Add regression coverage for the minicard unread-comments highlight](https://github.com/wekan/wekan/commit/556753789). Thanks to xet7.
- [Add regression coverage for the board-wide "sticky list headers" toggle](https://github.com/wekan/wekan/commit/d3e0c591a). Thanks to xet7.
- [Add regression coverage for the quick-add "More options" single-insert path (#3967)](https://github.com/wekan/wekan/commit/7e7aa4e5b). Thanks to xet7.
- [Add regression coverage for "Clone Board without cards"](https://github.com/wekan/wekan/commit/a033ed28a). Thanks to xet7.

and has the following documentation improvements:

**Feature guides** - `docs/Features/` pages for existing or newly landed
features.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/87c1e82ec7d2b9579fd3255a0a9cfc7a702ef38c">Added an example Authelia OAuth2/OIDC configuration alongside the existing Keycloak and Zitadel ones</a>. Thanks to tamaskan and xet7.</summary>

[#4210](https://github.com/wekan/wekan/issues/4210) asked for example
settings to log into Wekan through [Authelia](https://www.authelia.com/), a
self-hosted authentication/SSO server that speaks OIDC. Added
`docs/Features/Login/Authelia.md` with Snap and Docker settings mapped to
Authelia's own OIDC endpoints (`authorization_endpoint`, `token_endpoint`
and `userinfo_endpoint`, all under `/api/oidc/`, per Authelia's OpenID
Connect documentation), in the same format already used for Keycloak and
Zitadel, including a note that Authelia does not yet implement OpenID
Connect RP-Initiated Logout so `OAUTH2_LOGOUT_ENDPOINT` should stay unset
for it. Linked from `docs/README.md`'s Login Auth list and the provider
list in `docs/Features/Login/OAuth2.md`, and added the matching commented
`OAUTH2_*` example block to `docker-compose.yml` and every other
`docker-compose-*.yml` variant that carries the OAuth2 provider examples,
keeping their `wekan` service identical.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f9c046dd2eba0ea6e0ef8bd535e4bf0078d30288">Added a Using WeKan for Scrum guide mapping stories, story points, checklists and sprints onto existing features</a>. Thanks to lonix1 and xet7.</summary>

[#3087](https://github.com/wekan/wekan/issues/3087) asked, as a question
rather than a feature request, how to run a basic Scrum process on WeKan:
cards as user stories with a story-points field, checklists for acceptance
tests, a board per sprint, and a separate planning/backlog board. All of
that is already possible, so instead of new code this adds
`docs/Features/Cards/Scrum.md` confirming the mapping against WeKan's
actual current features - including the numeric custom field's "show sum
at top of list" badge (`models/customFields.js`'s `showSumAtTopOfList`,
already scoped per swimlane) as a way to total story points per
list/sprint - and linked from `docs/README.md`'s features list.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/191472036028e303b92bec67751101f7c562a2da">Documented the new board-view charts, Bigboard, Roadmap and other recent features</a>. Thanks to xet7.</summary>

A lot of board-view and member-menu features landed with no
`docs/Features/` page yet: the 10 Chart.js report charts (Dashboard,
Burndown, Burnup, Cumulative Flow, Control Chart, Cycle Time, Flow
Efficiency, Lead Time, Throughput Histogram, WIP Run, Pulse), the
Group by Assignee, Bigboard, Roadmap and Multi Board Calendar board views,
the 3-tier Notification Settings popup, TOTP Two-Factor Authentication, and
the My Cards/Due Cards/My Attachments member-menu pages. Added one new page
per feature (`docs/Features/Reports/Charts/Board-Report-Charts.md`,
`docs/Features/Board/{Bigboard,Group-By-Assignee,Roadmap}.md`,
`docs/Features/Date/Multi-Board-Calendar.md`,
`docs/Features/Members/{Notification-Settings,My-Cards-Due-Attachments}.md`,
`docs/Features/Login/Two-Factor-Authentication.md`), each following the
existing `docs/Features/Cards/Scrum.md` shape: a description, the exact
menu path, a small ASCII-art diagram of the relevant menu/popup/chart
layout, numbered steps including what data is needed to see something on
screen, and prerequisites - read directly from
`client/components/boards/boardHeader.jade`'s `boardChangeViewPopup`,
`client/components/users/userHeader.jade`'s `memberMenuPopup`, and each
view's own template/JS rather than guessed. Linked all eight from
`docs/README.md`. Left for a later pass: per-Admin-Panel-section coverage
audit, SAML/Apple login docs (already covered by existing
`docs/Features/Login/SAML.md` and `Apple.md`), and the two additional Gantt
engines (Frappe/dhtmlx), which share the existing
`docs/Features/Reports/Gantt.md` page.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/902f1422634af0e5289817f6f37225be505cc7c2">Documented the two additional Gantt engines, WIP limit groups and five more recent features</a>. Thanks to xet7.</summary>

Continuing the previous documentation pass: added a "Frappe" and "dhtmlx"
section to `docs/Features/Reports/Gantt.md` covering the two extra
Board-View Gantt engines left for later (drag-to-reschedule, gated on board
write access, versus the original table view's click-a-date-icon editing).
Added six new pages read directly from the current code rather than
guessed: `docs/Features/Lists/WipLimit/WIP-Limit-Groups.md` (Board Settings
→ WIP Limit Groups, `models/boards.js`'s `wipLimitGroups`, including the
swimlane quick-select),
`docs/Features/Cards/CustomFields/Custom-Field-Admin-Only-And-Order.md`
(the admin-only value-hiding flag and the sidebar drag-to-reorder `sort`
field), `docs/Features/Board/Labels-Milestone-Due-Date.md` (a label's
optional due date turning it into a milestone),
`docs/Features/Cards/Checklists.md`
(the automatic daily/weekly/monthly reset interval and the bulk
plain-text item editor), `docs/Features/Board/Card-Field-Display-Order.md`
(reordering a card's Labels/Dates/Members/Custom Fields/Description
sections) and `docs/Features/Date/Flowtime-and-Pomodoro.md` (the two
per-card work timers that both feed Spent Time). Linked all seven from
`docs/README.md`. A pass over this release's remaining Upcoming entries
found no other feature-shaped gap worth a page in the time available.

</details>

**Notification emails** - the activity-notification email's subject line.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ad4613099">Covered that a card activity's email subject already includes the board and card name</a>. Thanks to Logicbloke and xet7.</summary>

[#1408](https://github.com/wekan/wekan/issues/1408) asked that a
card-activity notification email's subject include the board/card name
(e.g. `[Board Name] Card Title`) instead of a generic subject, so email
clients like Gmail thread notifications per card rather than lumping every
notification together. Reading the current code
(`server/models/activities.js`, `server/lib/activityNotificationTitle.js`,
`server/notifications/email.js`) shows this is already the DEFAULT,
unconditional behavior on every install: any activity with a `cardId` sets
`title = ACTIVITY_NOTIFICATION_TITLE.CARD`, which
`formatActivityNotificationTitle()` renders as `[Board] Card`, and
`server/notifications/email.js` builds the email subject from exactly that
value before any admin configuration is considered. The optional
admin-customizable subject template added for
[#2022](https://github.com/wekan/wekan/issues/2022) (Admin Panel -> Email
Templates, `activityEmailSubjectTemplate`) only REPLACES this default when
an admin explicitly sets it - it is not required to get a per-card subject.
`tests/notificationEmailSubjectFormat.test.cjs` adds regression coverage
for the default: it drives `formatActivityNotificationTitle()` directly for
a representative card activity and asserts the subject contains both the
board and card name in the `[Board] Card` shape, asserts it is not a
generic constant, confirms every `activity.cardId` branch tags itself with
the card-title layout, and confirms the admin template only overrides the
already-board/card-aware default rather than being needed for it.

</details>

**Docs and the backlog** - pages added, and TODO Later kept current.

- [Document the People / Notifications admin panel pane](https://github.com/wekan/wekan/commit/93814d5c3). Thanks to xet7.
- [Document card recurrence](https://github.com/wekan/wekan/commit/8fa2b6d8e). Thanks to xet7.
- [Add #3256 (hot-area image map visualization) to TODO Later](https://github.com/wekan/wekan/commit/904f1f0c1). Thanks to xet7.
- [Add #5758 (Windows SSO via node-expose-sspi) to TODO Later, and remove the stale #5707 entry](https://github.com/wekan/wekan/commit/0133fa2e0). Thanks to xet7.
- [Add the CHANGELOG entry for the spent-time backfill, Board Settings and Notification Settings fixes](https://github.com/wekan/wekan/commit/0ca5dac44). Thanks to xet7.

and closes the following already-fixed issues:

**Closed issues** - reports already fixed by earlier work, closed with a
reference to where.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9ef7f4a07">Confirm #2498 (linked card's minicard cover) stays fixed</a>. Thanks to javen9881 and xet7.</summary>

[#2498](https://github.com/wekan/wekan/issues/2498): a card that links to
another board's card ("Link to board") does not show that linked card's
cover image on its own minicard. `client/components/cards/minicard.js`'s
`cover()` helper used to read `this.coverId` directly, and a linked card
(`type: 'cardType-linkedCard'`) has no `coverId` of its own - it is a
placeholder whose real content lives on the card `linkedId` points at - so
the cover never rendered.

This is the same fault as [#5666](https://github.com/wekan/wekan/issues/5666)
("Minicard connection without images"), already fixed by commit 9ef7f4a07:
`models/lib/linkedCardCover.js`'s `resolveCoverId()` hops a linked card to
the real card via `getCard(this.linkedId)` and reads its `coverId`,
mirroring how `getTitle`/`getDue`/the other linked-card getters already
resolve through `linkedId`. `tests/linkedCardCover.test.cjs` (8 checks,
still passing against current source) is a pure-Node regression guard
covering both directions: a linked card resolves to the real card's cover,
a plain card keeps using its own, a stray `coverId` on the placeholder is
ignored in favor of the real card's, and an unloaded/missing real card
returns no cover instead of throwing. No new code change was needed here;
the issue is closed with a pointer to where it was already fixed.

</details>

- [Note that #2561 is the same request as #4256 and is already fixed](https://github.com/wekan/wekan/commit/2b7d89978). Thanks to xet7.

**Lists and swimlanes** - linking directly to one of them.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c8ad1b61d">Confirm #1089 ("Link to this list") stays fixed</a>. Thanks to xet7.</summary>

[#1089](https://github.com/wekan/wekan/issues/1089) asked for "Link to
this list", and reported the same fault #6459 later named exactly: the
list-more popup's link box read the nonexistent `{{ rootUrl }}` template
helper, so the box was always empty - there was no working list link,
and no swimlane link at all.

Already fixed by commit e755b60b3 ("Link to a swimlane or a list, the
way you can link to a card."): `models/lib/boardItemUrl.js` builds a
real relative path for each, `List#absoluteUrl`/`Swimlane#absoluteUrl`
resolve it through `Meteor.absoluteUrl()`, and
`listHeader.js`/`swimlaneHeader.js`'s copy-link handlers call it -
confirmed by reading the current code, not just the commit history.
`tests/listSwimlaneLinkRootUrlIssue1089.test.cjs` is a pure-Node
regression guard pinning both directions: the list and swimlane
copy-link paths use the real `Meteor.absoluteUrl()` API, and (negative)
no `.jade` template or `.js` helper anywhere in `client/` still
references a bare/broken `rootUrl` - either the exact string #1089
reported or a `rootUrl` template helper, which never existed and was
the bug. No new code change was needed here; the issue is closed with a
pointer to where it was already fixed.

</details>

and improves the translation workflow:

- [Fill in the missing Ladin, Latin, Luganda, Luxembourgish, Maithili, Malagasy, Malay, Malayalam, Maltese, Manx, Maori and Marathi translations](https://github.com/wekan/wekan/commit/718d20813). Thanks to xet7.
- [Fill in the missing Sicilian, Silesian, Slovenian, Volapük, Southern Sotho, Swahili, Swati, Tagalog, Tajik, Tatar and Tibetan translations](https://github.com/wekan/wekan/commit/635865223). Thanks to xet7.
- [Fill in the missing Igbo, Swedish, Indonesian, Occitan, Portuguese (Brazil), Turkmen, Tamazight, Inuktitut, Irish, Italian, Javanese, Kannada, Kashmiri, Kashubian, Kazakh, Konkani, Kurmanji Kurdish and Kyrgyz translations](https://github.com/wekan/wekan/commit/4a2e9650e). Thanks to xet7.
- [Fill in the missing Tok Pisin, Tongan, Tsonga, Tswana, Upper Sorbian, Urdu, Valencian, Walloon, Yoruba, West Frisian, Wolaytta, Wolof, Esperanto, Bulgarian, Persian, Macedonian, Hungarian, Khmer, Latvian, Portuguese, Belarusian, Armenian, Georgian, Mongolian, Serbian, Tamil, Spanish, Thai, Turkish, Venda and Zulu translations](https://github.com/wekan/wekan/commit/2df919006). Thanks to xet7.
- [Treat placeholder URLs (list-sync-url-placeholder) as locale-invariant in fill-translations.mjs, and fill in the missing Norwegian Bokmål translations](https://github.com/wekan/wekan/commit/f247b04c3). Thanks to xet7.
- [Fill in the missing Nepali translations](https://github.com/wekan/wekan/commit/aec9d7cd4). Thanks to xet7.
- [Fill in the missing Scottish Gaelic translations](https://github.com/wekan/wekan/commit/fd227bf7c). Thanks to xet7.
- [Fill in the missing Shona translations](https://github.com/wekan/wekan/commit/e4d4b8e05). Thanks to xet7.
- [Fill in the missing Northern Sotho translations](https://github.com/wekan/wekan/commit/57b5f3ce8). Thanks to xet7.
- [Fill in the missing Sardinian translations](https://github.com/wekan/wekan/commit/97479a4da). Thanks to xet7.
- [Fill in the missing Neapolitan translations](https://github.com/wekan/wekan/commit/9cbdbb5d4). Thanks to xet7.
- [Fill in the remaining missing Papiamento translations](https://github.com/wekan/wekan/commit/dcd00c77f). Thanks to xet7.
- [Fill in the remaining missing Quechua translations](https://github.com/wekan/wekan/commit/021654282). Thanks to xet7.
- [Fill in the remaining missing Romansh translations](https://github.com/wekan/wekan/commit/4c2a6b60c). Thanks to xet7.
- [Fill in the missing Nahuatl and Northern Ndebele translations](https://github.com/wekan/wekan/commit/3f872cccc). Thanks to xet7.
- [Fill in the missing Acehnese, Asturian, Breton, Gujarati, Japanese (Hiragana), Odia, Telugu, Klingon, Uyghur and Xhosa translations](https://github.com/wekan/wekan/commit/dff307b00). Thanks to xet7.
- [Fill in missing translations for Acehnese, Arabic, Greek, Finnish, Hindi, French, Croatian, German, Danish, Hebrew, Japanese, Korean, Dutch, Polish, Russian, Ukrainian, Vietnamese, Chinese (Simplified/Traditional).](https://github.com/wekan/wekan/commit/b40b35422). Thanks to xet7.
- [Fill in missing translations for Swiss/Germany German, Estonian, Basque, French (Belgium, Canada, Switzerland, France), Bengali, Icelandic, Hebrew, Japanese and Korean.](https://github.com/wekan/wekan/commit/5fc7d2b20d01aca18df42dacc3b376060cbc8acd). Thanks to xet7.
- [Fill in missing translations for Chinese (Singapore), Czech, Galician, Albanian, Catalan, Romanian, Bosnian, Mandarin Chinese, Uzbek, Afrikaans and Azerbaijani.](https://github.com/wekan/wekan/commit/6d38cd9c2). Thanks to xet7.
- [Fill in missing translations for Azerbaijani, Sinhala, Uzbek, Cantonese, Punjabi, Wu Chinese, Moroccan Arabic, Burmese, Pashto, Corsican and Hausa.](https://github.com/wekan/wekan/commit/48a2a58b5). Thanks to xet7.
- [Fill in missing translations for Czech, Lithuanian, Slovak, Romanian, Chinese, Welsh, Arabic (Algeria/Egypt), Greek, Hindi, Chinese (Hong Kong), Welsh (UK) and German (Austria).](https://github.com/wekan/wekan/commit/1ceb3767a). Thanks to xet7.
- [Fill in missing translations for Fula, Fijian, Friulian, Guarani, Oromo, Northern Sami, Walloon, Aymara, Bashkir, Kalaallisut, Rundi, Aromanian, Sakha, Bislama, Buryat, Cornish and Venda.](https://github.com/wekan/wekan/commit/69abcf8a9). Thanks to xet7.
- [Fill in missing translations for Akan, Amharic, Aragonese, Assamese, Bhojpuri, Bambara, Cherokee, Central Kurdish, Chuvash, Dzongkha, Ewe, Faroese, Hawaiian, Haitian Creole, Nyanja, Kinyarwanda, Sindhi, Samoan, Somali and Yiddish.](https://github.com/wekan/wekan/commit/6cb4f8677). Thanks to xet7.
- [Translate the Frappe Gantt view-mode strings for Acehnese, Afrikaans, Akan, Amharic, Aragonese, Arabic, Assamese, Asturian, Aymara, Azerbaijani, Bashkir, Belarusian, Bulgarian, Bhojpuri, Bislama, Bambara, Bengali, Tibetan, Breton, Bosnian, Buryat, Catalan, Cherokee, Sorani, Mandarin, Corsican, Czech, Kashubian, Chuvash and Welsh](https://github.com/wekan/wekan/commit/6faf19872). Thanks to xet7.
- [Translate the Frappe Gantt view-mode strings for Lithuanian, Latvian, Maithili, Malagasy, Maori, Macedonian, Malayalam, Mongolian, Marathi, Malay, Maltese, Burmese, Nahuatl, Neapolitan, Norwegian Bokmål, Ndebele, Nepali, Dutch, Northern Sotho, Chichewa, Occitan, Oromo, Odia, Punjabi, Papiamento, Polish, Pashto, Portuguese, Quechua, Romansh, Kirundi and Romanian.](https://github.com/wekan/wekan/commit/7bdf55434). Thanks to xet7.
- [Translate the Frappe Gantt view-mode strings for Danish, German, Dzongkha, Ewe, Greek, Esperanto, Spanish, Estonian, Basque, Persian, Fula, Finnish, Fijian, Faroese, French, Friulian, Frisian, Irish, Scottish Gaelic, Galician and Guarani.](https://github.com/wekan/wekan/commit/d79ce72d9). Thanks to xet7.
- [Translate the Frappe Gantt view-mode strings for Gujarati, Manx, Hausa, Hawaiian, Hebrew, Hindi, Croatian, Upper Sorbian, Haitian Creole, Hungarian, Armenian, Indonesian, Igbo, Icelandic, Italian, Inuktitut, Japanese, Javanese, Georgian, Kazakh, Greenlandic, Khmer, Kannada, Korean, Konkani, Kashmiri, Kurdish, Cornish, Kyrgyz, Latin, Luxembourgish, Luganda and Ladin.](https://github.com/wekan/wekan/commit/87f2fa12b). Thanks to xet7.
- [Translate the Frappe Gantt view-mode strings for Russian, Aromanian, Kinyarwanda, Yakut, Sardinian, Sicilian, Sindhi, Northern Sami, Sinhala, Slovak, Slovenian, Samoan, Shona, Somali, Albanian, Serbian, Swati, Sotho, Swedish, Swahili, Silesian, Tamil, Telugu, Tajik, Thai, Tigrinya, Tigre, Turkmen, Tagalog, Klingon, Tswana, Tongan, Tok Pisin, Turkish, Tsonga, Tatar and Uyghur.](https://github.com/wekan/wekan/commit/4bb68ceda). Thanks to xet7.
- [Translate the Frappe Gantt view-mode strings for Ukrainian, Urdu, Uzbek, Venetian, Veps, Venda, Vietnamese, Flemish, Volapük, Waray, Walloon, Wolaytta, Wolof, Wu, Xhosa, Yiddish, Yoruba, Cantonese, Tamazight, Chinese and Zulu.](https://github.com/wekan/wekan/commit/aac7657e1). Thanks to xet7.

- [Translate the remaining strings for Dutch (Netherlands), Polish (Poland), Russian (Ukraine/Russia), Ukrainian (Ukraine), Vietnamese (Vietnam) and Chinese (Simplified/UK/Traditional)](https://github.com/wekan/wekan/commit/d3b433d63). Thanks to xet7.
- [Fill in the missing Northern Ndebele translations](https://github.com/wekan/wekan/commit/4338aef01). Thanks to xet7.
- [Translate the six popup titles for Ladin, Latin, Luganda, Luxembourgish, Maithili, Malagasy, Malay, Malayalam, Maltese, Manx, Maori and Marathi](https://github.com/wekan/wekan/commit/768c0c079). Thanks to xet7.
- [Translate the card-recurrence-interval strings to every locale](https://github.com/wekan/wekan/commit/5e255d174). Thanks to xet7.
- [Translate the checklist automatic-reset labels for Acehnese, Kinyarwanda and Flemish](https://github.com/wekan/wekan/commit/ec69a54a5). Thanks to xet7.
- [Add the "Pulse" board view menu label to all locale files](https://github.com/wekan/wekan/commit/7f35409cb). Thanks to xet7.
- [Add the "Convert to subtask" / "linked subtask" i18n keys to all locale files](https://github.com/wekan/wekan/commit/33fbf9100). Thanks to xet7.
- [Add the "Add existing card as subtask" i18n key to all locale files](https://github.com/wekan/wekan/commit/5d0b08a72). Thanks to xet7.
- [Add the "more-options" quick-add i18n key for #3967](https://github.com/wekan/wekan/commit/59878c590). Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for
their translations.

# v11.68 2026-09-10 WeKan ® release

**In short:** the **Board View menu**'s nine report charts - Dashboard,
Burndown, Burnup, Cumulative Flow, Control Chart, Lead/Cycle Time, Flow
Efficiency, Throughput Histogram and WIP Run - are implemented, computed from
the current board's own cards, lists and activity history. Every chart page,
and the **Gantt** view, gain **Export to PDF** and **Export to Excel**
buttons matching the existing card/board export look.

This release adds the following feature:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3abc1078c">Implement the 10 board report charts and Gantt/chart PDF+Excel export</a>. Thanks to xet7.</summary>

The Board View menu's Dashboard, Burndown, Burnup, Cumulative Flow, Control
Chart, Lead/Cycle Time, Flow Efficiency, Throughput Histogram and WIP Run
entries opened a plain "not implemented yet" page. Each now computes and
renders its chart from this board's own Cards/Lists/Activities, per
docs/Features/Reports/charts.tsv's calculation descriptions - plain HTML/CSS
bars and a data table, no new charting dependency.

Every chart page, and the Gantt view, gets Export to PDF / Export to Excel
buttons that reuse the existing card/board export renderers (the PDF line/bar
builder, the Excel workbook styling) through the same public-board /
authToken / logged-in-user auth gate every other export route already uses.

Completion date is `card.endAt || card.archivedAt` (WeKan has no dedicated
"Done" list flag); WIP Run's limit line only draws when a list's own WIP
limit is enabled (no invented board-level schema); Flow Efficiency's "active"
time is `card.spentTime` (WeKan does not track per-list queue time). Each
deviation from charts.tsv is documented where the calculation is.

`models/lib/chartCalculations.js` (20 tests), `models/lib/chartExportRows.js`
(8 tests) and the export routes' auth shape (10 tests) are covered by new
regression tests; `tests/boardViewMenu.test.cjs` is updated for the now-real
views. Not verified: actual Blaze rendering and generated PDF/XLSX bytes (no
browser/Meteor runtime available) - matched syntactically against the
existing statsView/timeView views and exporters instead.

</details>

Thanks to above GitHub users for their contributions and translators for their
translations.

# v11.67 2026-09-10 WeKan ® release

**In short:** **Board export to .zip (with attachments)** answered a bare 500
error on every request; the archiver dependency's v8 API change was missed in
one of the two places WeKan builds a zip on the server. Issue #6681 (OIDC
redirect-style login loop) is confirmed already fixed and closed.

This release fixes the following bug:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f383fe9b3">Board export to .zip (with attachments) answered a bare 500 error</a>. Thanks to xet7.</summary>

`models/server/ExporterZip.js` still called the archiver package the v7 way -
`const archiver = require('archiver'); archiver('zip', {...})`. archiver@8
(package.json pins `^8.0.0`) is ESM-only and exports classes - `{ Archiver,
ZipArchive, TarArchive, JsonArchive }` - with no callable default, so that
call threw `TypeError: archiver is not a function` synchronously, before the
`exportZip` route (models/export.js) had written any response header.
`safeRoute` (server/apiMiddleware.js) then answered a bare 500 with no
board-specific detail - every "export board -> .zip (with attachments)"
request, for every board, since archiver was bumped to v8.

`server/methods/backup.js` hit the identical break earlier and already fixed
it with `import { ZipArchive } from 'archiver'; new ZipArchive({...})`;
`ExporterZip.js` was the one call site that was missed. Fixed the same way.
`tests/exportZipArchiverApi.test.cjs` pins the correct API shape, that the
dead factory call is gone, and scans every server-side source file so a
second call site cannot reintroduce the same break unnoticed.

</details>

and closes the following already-fixed issue:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f3c39f3b2">Confirm #6681 (OIDC redirect-style login loop) stays fixed</a>. Thanks to Alishara and xet7.</summary>

The reporter's `DEBUG=true` server log (getToken/getUserInfo repeating six
times in under twenty seconds, each with a fresh access token) is the same
signature the fix for #6681 already targets: `oauth2-login-style: redirect`
with `oidc-redirection-enabled: true`, `Template.userFormsLayout.onCreated`
re-firing the auto-redirect on the identity provider's bounce-back render
before the prior login had finished. That was fixed by commit 89682c251
("Fix OIDC auto-redirect looping until the provider rate-limits it"), which
landed before v11.62 - several releases before this one - so a build the
reporter's log shows as v11.60 predates the fix, and the fix has not been
touched since. `tests/oidcAutoRedirectLoop.test.cjs` (6 checks) still
passes against current source, confirming the one-shot sessionStorage flag
still gates the auto-redirect and is still cleared on both login success
and failure. No new code change was needed; the issue is closed with a
pointer to where it was already fixed, and the reporter is asked to upgrade
to v11.62 or newer.

</details>

Thanks to above GitHub users for their contributions and translators for their
translations.

# v11.66 2026-09-09 WeKan ® release

**In short:** the companion build repositories under `.tools/` move forward:
**node-patches** gets release-run diagnostics and a real PowerPC startup
check, **mongo-tools-patches** now tracks upstream `master` (not a tagged
release) with a Go 1.27 toolchain and expands to forty-three targets
including Android ARM64, and **mongosh-patches** drops telemetry and fixes
startup in a homeless container user. No WeKan application code changed.

This release updates the following bundled build tooling:

**Node.js (node-patches)** - release-run diagnostics and a real PowerPC startup
check.

<details>
<summary><a href="https://github.com/wekan/node-patches/commit/985eed7">Warn when a platform's binary is missing from a completed release run</a>. Thanks to xet7.</summary>

A transient runner DNS glitch could fail just the upload step for one
platform while its build and checksum succeeded, and the run still finished
green with that platform quietly missing from the release. The "attach to
the release" step now compares the platforms actually present in `dist/`
against the full expected set and emits a `::warning::` naming whatever is
missing, pointing at `release-all-missing.yml` to build the gap - instead of
requiring someone to notice by comparing sixteen build jobs' logs by hand.

</details>

<details>
<summary><a href="https://github.com/wekan/node-patches/commit/875b4bb">Build PowerPC target snapshots and reject Node runtime startup failures</a>. Thanks to xet7.</summary>

The released PowerPC binary reported its version but aborted while
initializing V8. Real target snapshot tools are now built under QEMU, as for
s390x, and both platforms' artifacts are rejected unless JavaScript,
separate V8 contexts, crypto and compression actually execute - the gate
reproduces the released failure and passes with official same-version Node.

</details>

**MongoDB Database Tools (mongo-tools-patches)** - upstream `master` tracking,
Android ARM64, and a wider target matrix.

<details>
<summary><a href="https://github.com/wekan/mongo-tools-patches/commit/18b9af9">Build every currently supported native Go target</a>. Thanks to xet7.</summary>

Release All expands from seventeen to forty-two OS/CPU targets after
compiling current upstream master with Go 1.27 across Go's native
command-line platforms, adding AIX, DragonFly BSD, NetBSD, OpenBSD, all
FreeBSD CPUs, and Linux MIPS and big-endian PowerPC. Illumos, Solaris and
Plan 9 are excluded because current upstream source does not compile there.

</details>

<details>
<summary><a href="https://github.com/wekan/mongo-tools-patches/commit/d341c92">Add the Android ARM64 command-line target</a>. Thanks to xet7.</summary>

The CGO-free upstream tools compile for Android arm64, expanding the
canonical registry to forty-three targets and 344 possible binaries. Other
Android architectures still require external CGO linking; iOS and
WebAssembly do not produce equivalent standalone command-line programs.

</details>

<details>
<summary><a href="https://github.com/wekan/mongo-tools-patches/commit/4fa0b90">Allow the expanded tools matrix to finish</a>. Thanks to xet7.</summary>

Both full and missing-only workflows now allow three hours for the expanded
forty-two target build instead of the former seventeen-target one-hour
limit, so adding platforms cannot create a predictably cancelled release.

</details>

<details>
<summary><a href="https://github.com/wekan/mongo-tools-patches/commit/1700c01">Document that mongo-tools has no telemetry, and pin it against upstream</a>. Thanks to xet7.</summary>

Upstream `mongodb/mongo-tools` was checked for an analytics client, a
phone-home reporter, or a telemetry/DO_NOT_TRACK flag of its own, the same
way wekan/mongosh-patches and this fork's FerretDB were checked before
their telemetry was patched out - there is none.
`tests/no-telemetry-upstream.sh`
re-checks this against the current upstream ref so a future release that
adds real telemetry is caught here instead of silently missed.

</details>

**mongosh (mongosh-patches)** - telemetry removed, and startup fixed in a
homeless container user.

<details>
<summary><a href="https://github.com/wekan/mongosh-patches/commit/e042127">Remove telemetry and fix startup errors in a homeless container user</a>. Thanks to xet7.</summary>

The bundled analytics sink is now unconditionally a no-op, so no telemetry
HTTP request is ever made regardless of the configured endpoint, and the
native machine-id lookup that only existed to key telemetry throttle state
is dropped. The startup banner says this fork does not collect or send
anything. The same patch fixes mongosh running inside `ghcr.io/wekan/ferretdb`
as its default non-root user, which has no `/etc/passwd` entry: config/log/
history storage now falls back to a writable directory under the OS temp
dir when the home directory is not writable, instead of failing with
`EACCES ... mkdir '/nonexistent'` and "Could not open history file" on
every session.

</details>

Thanks to above GitHub users for their contributions and translators for their
translations.

# v11.65 2026-09-09 WeKan ® release

**In short:** Four security advisories against **Attachments/Avatars**
(ostrio:files) are fixed: a **critical** path-traversal arbitrary file
write via the attachment upload `namingFunction`, a **critical**
unauthenticated DDP method that could wipe every attachment or avatar on
the instance, and two **high** missing-authorization bugs that let an
anonymous caller download any avatar (a missing `protected` callback,
and an unauthenticated legacy-avatar route). The **AppImage** no longer
mounts itself under a possibly-small `/tmp`, relocating to
`WRITABLE_PATH/app` instead.

This release fixes the following CRITICAL SECURITY ISSUES:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9947e0138">Unauthenticated Arbitrary File Write via Path Traversal in Attachment Upload namingFunction</a>. Thanks to xet7.</summary>

Attachments overrode ostrio:files' `sanitize()` to an identity function
and used the client-supplied `fileId` verbatim as the on-disk file name
in `namingFunction`, so an anonymous upload with
`fileId: "../../../../tmp/pwn"` could write attacker-controlled content
anywhere the WeKan process can write - including overwriting bundle
modules for remote code execution. `sanitize()` is restored to the same
whitelist `models/avatars.js` already used for the same tokens (file
DISPLAY names are untouched - they go through a separate, unrelated
sanitizer in `onBeforeUpload`), and `namingFunction` now also validates
the sanitized `fileId` against the ObjectId shape WeKan itself generates,
regenerating a fresh one rather than trusting it. A blocked attempt is
recorded through the shared security log
(`authz.upload-path`/[UploadPathBleed](https://wekan.fi/hall-of-fame/uploadpathbleed/)),
so Admin Panel / Problems shows it happened.
`tests/attachmentAvatarSecurityAdvisories.test.cjs` pins both the
restored sanitizer and the fileId validation, with the advisory's own PoC
string as a negative case.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9947e0138">Unauthenticated DDP Methods Allow Instance-Wide Deletion of Attachments and Avatars</a>. Thanks to xet7.</summary>

ostrio:files registers its own `_FilesCollectionRemove_<collection>` DDP
method, gated only by `allowClientCode` and never routed through
`Attachments.allow`/`Avatars.allow` - those only gate the ordinary Mongo
`.remove()` call, not the library's own method. Attachments had no
`onBeforeRemove` at all, and Avatars' unconditionally returned `true`
(it existed only to clear the removed avatar's owner's
`profile.avatarUrl`), so any anonymous DDP connection could call either
method with selector `{}` and delete every attachment (database record
and physical file) or every avatar on the instance. Both now require
`this.userId` and check every file the selector actually matches:
attachments need the caller's board-write access on that file's card/
board, avatars need ownership of that avatar or site-admin status (the
existing admin "delete another user's avatar" flow keeps working). A
blocked attempt is recorded through a new
`authz.file-remove`/[WipeBleed](https://wekan.fi/hall-of-fame/wipebleed/)
catalog key. `tests/attachmentAvatarSecurityAdvisories.test.cjs` pins
both hooks and that an empty/non-matching selector is refused outright
rather than treated as nothing to check.

</details>

and fixes the following bugs:

**Avatars** - anonymous access to files nothing should have exposed.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9947e0138">Add the protected callback the download library needs to gate them</a>. Thanks to xet7.</summary>

Unlike Attachments, Avatars never set `protected`, so ostrio:files' own
library-native download route - whose `_checkAccess` defaults to
allowing everything when `protected` is unset - served any avatar to any
anonymous caller, entirely bypassing WeKan's own `isAuthorizedForAvatar`
check. `Avatars.protected` now mirrors `Attachments.protected`: an
authenticated caller may always view an avatar; an anonymous one only
when the avatar's owner is a member of a public board. A denied
anonymous download is recorded under a new
`authz.avatar-protected`/[PortraitBleed](https://wekan.fi/hall-of-fame/portraitbleed/)
catalog key.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9947e0138">serveLegacyAvatar Serves Legacy CollectionFS Avatars Without Any Authentication</a>. Thanks to xet7.</summary>

Both routes in `server/routes/avatarServer.js` that fall back to reading
a legacy CollectionFS avatar in place streamed it to any caller who knew
its old `cfs.avatars.filerecord` id - one of the two
(`/cfs/files/avatars`) with no authentication check at all. Both now
require a signed-in caller (`isLegacyAvatarAuthorized`): legacy records
carry no owner/board link that could be safely checked for the
public-board exemption current avatars get, so this is a deliberately
narrower rule rather than reusing that exemption on an unverifiable
claim. The `/cfs/files/avatars` route's redirect fallback for
already-migrated avatars is untouched, so an anonymous public-board
viewer still sees those normally - only the legacy read-in-place path
now requires a login. A denied attempt is recorded under a new
`authz.legacy-avatar`/[RelicAvatarBleed](https://wekan.fi/hall-of-fame/relicavatarbleed/)
catalog key.
`tests/attachmentAvatarSecurityAdvisories.test.cjs` pins both call sites
and the negative case that the redirect still works unauthenticated.

</details>

and fixes the following bug:

**AppImage** - its own mount filling up a small /tmp.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5adc030bd">Relocate the AppImage's own mount from /tmp to WRITABLE_PATH/app</a>. Thanks to xet7.</summary>

checkmk warned `/tmp/.mount_wekan.OhaGOG ... 100% used` because the
AppImage runtime's own read-only squashfs mount landed on a small `/tmp`
- a squashfs mount always reports itself as 100% used regardless of
size, so this was really "`/tmp` is too small for the AppImage", not a
leak. The runtime mounts itself under
`$TMPDIR/.mount_<name>.<random>` (defaulting to `/tmp`) before `AppRun`
ever runs, so the very first launch's mount cannot be redirected from
inside `AppRun`. `AppRun` now re-execs itself once per launch with
`TMPDIR` set to `WRITABLE_PATH/app` when the caller has not already
chosen a `TMPDIR`, so every launch from then on mounts there instead -
and, on that same first launch, sweeps out any of WeKan's own orphaned
`.mount_*ekan*` directories left in `/tmp` by an earlier, uncleanly
killed run (checked against `/proc/mounts`, so a live one is never
touched). AppImage-only: no other WeKan platform mounts itself this way,
so Docker, snap, the `.deb` and the bundle zip are untouched.
`tests/appImageRuntime.test.cjs` pins the relocation, its
once-per-launch/explicit-`TMPDIR` guards, and that only orphaned mounts
are removed.

</details>

and has the following developer-tooling fixes:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5f197f4bd">Fix #3823 e2e test for the Show on Minicard -> Board Settings/Card move</a>. Thanks to xet7.</summary>

The test still clicked the minicard's own "Show on Minicard" menu entry
(`.js-show-on-minicard`), which no longer exists after the Board
Settings / Card move earlier in this release: the checkbox
(`.js-field-has-creator-on-minicard`) and its behavior are unchanged, so
the test now opens it from Board Settings / Card, reached from the
board's cog menu, instead.

</details>

<details>
<summary><a href="https://github.com/wekan/FerretDB/commit/b2e1ce4b">Update hardcoded SQLite version/source-id pins to 3.53.4</a>. Thanks to xet7.</summary>

The `modernc.org/sqlite` bump (1.57.0 → 1.58.0, from the earlier
"ferretdb" dependabot group update) embeds a newer SQLite release
(3.53.3 → 3.53.4), which three tests pinned by exact string: `TestDefaults`
in `internal/backends/sqlite/metadata/pool/pool_test.go`
(`sqlite_version()`/`sqlite_source_id()`), and the `BackendVersion` checks
in `internal/backends/backend_test.go` and
`internal/backends/sqlite/metadata/registry_test.go`. The dependency bump
is the intended change; the guards are updated to match it.

</details>

Thanks to above GitHub users for their contributions and translators for
their translations.

# v11.64 2026-09-09 WeKan ® release

**In short:** **Resizable list width and swimlane height are back.** v11.62
had replaced per-user/per-list drag-resize width and the "Set width"/"Set
swimlane height" popups with a hardcoded 240px for every list; that is
reverted at the maintainer's request. Board Settings also gains three
grouped sections (**#6680**): **Swimlane** and **List**, with board-wide
resize-lock and **"same width for all lists"** admin toggles, and
**Card**, where Minicard/Card settings move back from their own menus.
**FerretDB v1** now stores Infinity/-Infinity doubles like real MongoDB,
patches a High-severity gRPC-Go DoS advisory, and keeps its dependencies
current.

This release reverts the following change:

**List and swimlane resizing** - restoring the popups and drag handles v11.62
removed.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/59bed92f3">Revert "Hardcode list width to 240px and remove the width/height set-value popups"</a>. Thanks to xet7.</summary>

This reverts commit 8614949580a8824be8c189ab3c7e5869d36f6e9b in full: the
per-user/per-list resizable list width (drag-resize handle, the "Set
width" list-menu popup, the board-settings "Personal list width" sidebar
toggle, and the auto-width mode) and the "Set swimlane height" popup are
restored, along with their schema fields, Meteor methods and tests
(`tests/listWidthPopupLayout.test.cjs` and
`tests/playwright/specs/38-fixed-list-width.e2e.js`, both un-deleted). No
commit since v11.62 touched these files, so the revert applied cleanly
with no follow-up fixes needed.

</details>

and adds the following feature:

**The top header** - board-wide resize locks and a shared list width.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5c48be8e6">Add board-wide list-width/swimlane-height resize locks (#6680)</a>. Thanks to Hallsie and xet7.</summary>

Three independent toggles, right of the drag-handles toggle, board admins
only: a list-width resize lock (left-right arrow plus the same allowed/
denied check/ban icon pair `.js-toggle-desktop-drag-handles` already uses),
a swimlane-height resize lock (up-down arrow, same check/ban pair), and a
board-wide "same width for all lists" (same pair again, over a static
columns icon) - the existing per-user Set Width popup's fixed-width mode,
now settable for the whole board so it applies to every viewer, overriding
their personal choice while it is on. Enabling/disabling a toggle is
admin-only on the server (`server/permissions/boards.js`'s default rule);
dragging the shared same-width value itself is allowed for any board
member with write access, through a new sole-field `Boards.allow` rule
shaped exactly like the existing board-drag-reorder rule, so a
lower-privilege member can never smuggle another board field into that
update. The swimlane-height handle also HIDES entirely while its lock is
on - not just refusing the drag - the same way the list-width handle
already hides for its own lock, so a locked handle does not still draw the
blue drag-height line on hover. `tests/listSwimlaneResizeLock.test.cjs`
pins the schema, the header wiring, the permission-rule shape, and that
each resize handle actually checks (and hides for) its lock.

</details>

and fixes the following bug:

**Collapsed lists** - the rotated title was not centered across the column
width.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c543a3909">Keep a collapsed list's title near the caret, only centered horizontally</a>. Thanks to xet7.</summary>

The desktop rule that actually wins (`.list.list-collapsed:not(.mobile-view)
...`, more specific than the plain one) had `text-align: start`, leaving
the vertical text flush to one edge of the 30px column instead of centered
across it - the plain/mobile-view rule already had `text-align: center`
and was never broken. An earlier attempt at this fix also made both rule
sets grow to fill and center across the WHOLE (often 540px) collapsed
column, which moved the title far from the collapse-toggle/drag-handle at
the top (.tools/collapse2.png) - that was reverted back to how it shipped;
"centered" meant horizontally, not down the whole column.
`tests/collapsedListTitleCentered.test.cjs` pins the `text-align` fix and
negatively pins that neither rule set grows/centers across the full column
height.

</details>

and adds the following feature:

**The top header** - a collapse button for its own icons.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d1b01924e">Add a header-icons collapse toggle beside the board title (#6680 follow-up)</a>. Thanks to xet7.</summary>

A single button, right after the board title, that hides every icon from
the mobile/desktop toggle through the notification bell: mobile/desktop
mode, drag-handles toggle, the three board-wide resize-lock icons, the
starred-boards group, create-board, the board/all-boards header buttons,
the view menu, the Admin Panel tabs, and notifications. Purely a
per-viewer display preference (a plain Session var, the same shape as
`mobileMode()` right beside it), not a board setting like the resize
locks. Every icon in that range gets a shared
`.js-header-collapsible-icon` marker class; the template inclusions that
cannot carry a class of their own are each wrapped in a `span` that stays
`display: contents` outside the collapsed state, so introducing it does
not change how those icons behave as flex items when nothing is
collapsed. `tests/headerIconsCollapse.test.cjs` pins the button's
position, the Session-var shape, that every icon in the range is marked
and nothing outside it is, and both CSS rules.

</details>

and fixes the following bug:

**Collapsed lists** - the rotated title's x-position did not match the caret
above it.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/afb6bc5cf">Fix collapsed list title x-position not matching the caret above it</a>. Thanks to xet7.</summary>

Centering the title horizontally (above) was not enough: it still sat
~13px right of the collapse-toggle caret (.tools/collapse3.png). Root
cause was an unrelated, generic `.list-header .list-header-name` rule that
sets `min-width: 56px` for ordinary (non-collapsed) list headings.
`min-width` is a separate property from `width`, so it survives the
cascade even where a more specific collapsed-list rule wins on `width`
itself - it silently clamped the rotated title's box to 56px regardless
of the 30px collapsed column, since the final used width is
`clamp(min-width, width, max-width)`. Fixed by overriding `min-width`
back to `0` in every collapsed-title `h2.list-header-name` rule: the
plain/mobile-view rule, the desktop `:not(.mobile-view)` rule, and its
three `@media (min-width: 768/1024/1200px)` duplicates. Verified with a
Playwright measurement of the caret's and title's horizontal centers
matching after the fix; `tests/collapsedListTitleCentered.test.cjs` pins
that every one of those rules cancels the clamp, and that the generic
56px rule this works around still exists (so the test does not go stale
if that rule is ever removed).

</details>

and reorganizes the following board settings:

**Board Settings** - Swimlane, List and Card, grouped together.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2606ab56b">Move swimlane/list resize settings and card settings into Board Settings</a>. Thanks to xet7.</summary>

The list-width and swimlane-height resize-lock toggles and the board-wide
"same width for all lists" toggle, header icons since #6680, move into
**Board Settings / Swimlane** and **Board Settings / List** instead - with
the rest of a board's settings, reached from the board's cog menu, rather
than living as icons in the header. Minicard and Card settings (the
shared table of two dozen display settings) move back into **Board
Settings / Card**: they had been split across the card's own menu ("Show
on Card") and the minicard's own menu ("Show on Minicard"), one column of
the same table each. Both menu entries, their wrapper popups, and the
`cardMenuSource` module that only existed to tell those two menus apart
are removed; the shared settings table itself is unchanged, now opened
directly from Board Settings with both columns shown side by side.
Swimlane and List stay board-admin only, the same restriction the resize
locks already had; Card is open to any board member, matching who could
reach it before - a non-admin still gets the one PERSONAL row in that
table ("Labels text") rather than the admin-only rows, the same fallback
`showOnMinicardPopup` used to give them. All three reuse existing,
already-translated words ("Swimlane", "List", "Card"/"Card Settings") via
`Popup.open`'s `titleKey`, rather than adding new `*Popup-title` keys that
would need translating into 147 languages. The group sits between two
`<hr>` rules in Board Settings, as its own section.
`tests/boardSettingsSwimlaneListCard.test.cjs` pins the new layout and the
personal-row fallback.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9138f6f86">Restore the Show on Card/Minicard/Description column headings, on Card</a>. Thanks to xet7.</summary>

The column headings above the settings table were removed once (commit
02025aa6c) because the popup used to flow its rows into several
side-by-side columns whenever only Card or only Minicard was shown, so
the heading sat above the first of those columns and read as if it named
that one alone. Board Settings / Card always shows both columns in a
single list of rows now, so that ambiguity is gone, and the heading is
back: "Show on Card" / "Show on Minicard" / "Description", reusing the
same already-translated keys as before. It is an ordinary
`.card-settings-row` this time, not the old separate
`.card-settings-grid`/sticky-header markup, so the same CSS that hides a
column for the still-supported `side="card"`/`"minicard"` case hides the
matching heading with it, and `personalOnly` (what a non-admin gets)
hides the whole heading along with every other non-personal row.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a8c8ed63a">Remove the duplicate hr above Move Board to Archive</a>. Thanks to xet7.</summary>

The Swimlane/List/Card group's own closing `hr` and the Archive Board
group's opening `hr` sat back to back, drawing two rules where one was
enough.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/13ca5e08a">On Card, the Show on Minicard column reads left of Show on Card</a>. Thanks to xet7.</summary>

CSS `order` on the grid items, not a markup change: column 1 (card) and
column 2 (minicard) keep their original DOM order, so the
show-card-only/show-minicard-only `nth-child` hiding rules still target
the right element regardless of side. Only the visual position of the two
swaps; Description (column 3) gets an explicit order too, so it is not
pulled in front by the `order: 0` an unordered item would otherwise
share.

</details>

and fixes the following bugs:

**Edit Custom Fields popup** - a rule with nothing above it to separate.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/250adfe9a">No rule above Add when there are no custom fields yet</a>. Thanks to xet7.</summary>

The `hr` between the field list and "Add custom field" was unconditional,
so a board with no custom field yet drew a rule with an empty list above
it - two lines doing the work of an empty one. It is now conditional on
`board.customFields.length`.

</details>

**List Actions and Swimlane Actions** - two menu entries for things a drag
already does.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4374502a4">Hide List Actions / Set width and Swimlane Actions / Set Swimlane height</a>. Thanks to xet7.</summary>

Both are still reachable by dragging the resize handle (unless Board
Settings / List or Board Settings / Swimlane has locked that), and the
board-wide fixed-width value now lives in Board Settings / List - a menu
entry for the same thing was a second place to look for it. The
underlying popups (`setListWidthPopup`, `setSwimlaneHeightPopup`) are
untouched, only the menu entries that opened them are removed. Removing
"Set width" left its own group empty, so the group (and its enclosing
`hr`) is removed entirely; removing "Set Swimlane height" left "Select
color" as the only row of its group, so that group's `hr` moves inside
the same admin-only check as the color entry itself, rather than leaving
a dangling `hr` (or an empty list) for a non-admin.

</details>

and updates the following FerretDB v1 dependencies and fixes:

**FerretDB v1** - infinity-value storage, a gRPC security fix, and current
dependencies.

<details>
<summary><a href="https://github.com/wekan/FerretDB/commit/7bbc88c8">Allow storing Infinity/-Infinity doubles, matching MongoDB</a>. Thanks to xet7.</summary>

`mongorestore` restoring a wekan `cards` collection with a `sort:
-Infinity` value failed one document with `invalid value: { "sort": -Inf
} (infinity values are not allowed)`, even though real MongoDB stores
+Inf/-Inf doubles without complaint. The root cause was one level down
from that check: sjson (the JSON-based encoding documents are stored as)
already special-cased NaN as the string `"NaN"` because Go's
`encoding/json` cannot marshal NaN/Inf floats directly, but never did the
same for Infinity, so document validation rejected it outright rather
than hand the storage layer a value it could not round-trip. Infinity is
now encoded the same way NaN already was, and the document-validation
rejection - along with the matching restriction on a `$mul` that
overflows to infinity - is removed now that storage supports it. Unit
and integration tests cover the insert/read/update round-trip against a
live server.

</details>

<details>
<summary><a href="https://github.com/wekan/FerretDB/commit/3df0ce7b">Bump tools/go.mod's indirect grpc-go to 1.83.2 (GHSA-2v4p-qf9q-27wj)</a>. Thanks to xet7.</summary>

Dependabot alert 47: a gRPC-Go server configured with
`xds.NewGRPCServer()` crashes (High severity, Denial of Service) on a
crafted request missing both the `:authority` and `Host` headers,
affecting `google.golang.org/grpc` >= 1.83.0, < 1.83.2. The root module
and `integration/go.mod` were already on the patched 1.83.2, but
`tools/go.mod` - a separate module pulling grpc in indirectly through
`golang.org/x/pkgsite` - was missed and stayed on the vulnerable 1.83.1.
`go mod verify` and `go list -m all` both succeed with the updated graph.

</details>

<details>
<summary><a href="https://github.com/wekan/FerretDB/commit/1e23af3f">Sync integration/go.mod after the ferretdb dependency-group bump</a>. Thanks to xet7.</summary>

The "ferretdb" dependency-group update brought the root module's
`go.mod`/`go.sum` current, but left `integration`'s pointing at the old
indirect-dependency versions, so `go build ./integration/...` failed with
"updates to go.mod needed; to update it: go mod tidy". Running it there
brings both modules back in sync.

</details>

<details>
<summary><a href="https://github.com/wekan/FerretDB/commit/d4f75f6a">Update gRPC to 1.83.2 in the root and integration modules</a>. Thanks to dependabot and xet7.</summary>

`google.golang.org/grpc` moves from 1.83.1 to 1.83.2 in both the root
module and `integration`. Module checksums verify and the affected
packages build.

</details>

<details>
<summary><a href="https://github.com/wekan/FerretDB/commit/8e62741d">Update the mongo and golang build images</a>. Thanks to dependabot and xet7.</summary>

The `mongo` image used by `build/deps` moves from 8.3.8 to 8.3.9, and the
`golang` image used by `build/ferretdb` moves from 1.27.0 to 1.27.1.

</details>

<details>
<summary><a href="https://github.com/wekan/FerretDB/commit/c3a5df81">Update the "ferretdb" dependency group</a>. Thanks to dependabot and xet7.</summary>

Seven updates: `github.com/SAP/go-hdb` (1.18.2 → 1.18.3),
`github.com/go-sql-driver/mysql` (1.10.0 → 1.10.1),
`github.com/prometheus/client_model` (0.6.2 → 0.6.3),
`github.com/prometheus/common` (0.70.1 → 0.71.0), `golang.org/x/crypto`
(0.55.0 → 0.56.0), `golang.org/x/sys` (0.47.0 → 0.48.0) and
`modernc.org/sqlite` (1.57.0 → 1.58.0, pulling in newer
`modernc.org/libc`/`modernc.org/memory`). Module checksums verify and a
binary containing the SQLite, PostgreSQL, MySQL and HANA handlers builds
successfully.

</details>

# v11.63 2026-09-08 WeKan ® release

**In short:** `releases/release-all.sh` no longer skips version numbers: its
version step is now a fixed **+1**, fixing a bug where a single unpublished,
deleted release heading made the script measure and re-apply the resulting
gap forever, silently skipping v11.57, v11.59 and v11.61 (and, earlier,
v11.33 and v11.54). **CHANGELOG.md** no longer carries an empty Upcoming
placeholder between releases, and each release's binaries table moves from
right under the summary to its own **Binaries in these bundles** section at
the end. The **Docker Hub/Quay.io registry-overview sync** added earlier is
removed again: it needed rights the release credentials do not have, and
the maintainer updates both overviews manually now.

This release fixes the following developer-tooling bug:

**`releases/release-all.sh`** - the version-number step between releases.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/96157ef41">Stop release-all.sh from inheriting and widening a version-number gap</a>. Thanks to xet7.</summary>

The next release version used to be computed by MEASURING the gap between
the two newest `# vNN.MM` headings in CHANGELOG.md and re-applying that same
gap, rather than always advancing by one. That is fine as long as every
gap between two headings is really 1 - but it is not self-correcting: if a
release number was ever prepared and then never published, and its
CHANGELOG section was deleted outright instead of renamed back to `#
Upcoming WeKan ® release` (the correct recovery for a release that never
published, per this script's own header comment), the two headings left
behind were 2 apart. The script read that as "the cadence is +2 now",
applied +2 to get the next number, and did the same again next time -
turning one incident into a permanent, ever-repeating habit of skipping a
number. That is exactly how v11.56 -> v11.58 -> v11.60 -> v11.62 happened,
silently skipping v11.57, v11.59 and v11.61 (v11.33 and v11.54 were
skipped by the same bug earlier). The step is now a fixed +1 with no
history lookup, and the other code path (resuming an already-renamed
release) now hard-fails instead of printing "proceeding anyway" when the
newest heading is not exactly +1 from the previous one, so a future gap is
caught before it can be built on rather than silently accepted and
repeated. `tests/releaseAllVersionStep.test.cjs` pins the fixed +1 step
and the hard failure.

</details>

and the following developer-tooling changes:

**CHANGELOG.md** - the empty Upcoming placeholder, and where the binaries table
sits.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/83fa2d341">Stop leaving an empty Upcoming placeholder, move the binaries table to the end</a>. Thanks to xet7.</summary>

CHANGELOG.md no longer carries an empty `# Upcoming WeKan ® release` section
with an `**In short:** nothing here yet.` placeholder between releases.
`release-all.sh` used to auto-create one immediately after renaming a
release (via the now-deleted `releases/changelog-open-next.mjs`), so the
file always had a section that said nothing until the first real entry
replaced it. Add the section yourself, by hand, the moment there is a real
entry for it, using the skeleton at
`docs/DeveloperDocs/Changelog-Upcoming-Template.md`. What actually prevents
an entry from landing inside an already-published release -
`tests/changelogEntriesBelongToTheirRelease.test.cjs` asking git which
commits a release contains - never depended on the placeholder existing
first, so removing it costs nothing. Also reorders each release section:
the binaries table used to sit right under the `**In short:**` summary; it
now comes LAST, under its own `**Binaries in these bundles:**` label, after
every content subsection and right before the closing "Thanks to above
GitHub users" line - reference material, not the second thing a reader
sees.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0c1b8a4ca">Remove the Docker Hub/Quay.io registry-overview sync</a>. Thanks to xet7.</summary>

v11.62's `release-all.yml` run had already shown this step to be a
liability rather than a convenience: `DOCKERHUB_AUTH`/`QUAY_AUTH` are
scoped for `docker login`/image push, and neither registry grants a
push-scoped token the rights a repository-description write needs, so the
step failed with 403 even though the image itself published fine (fixed to
a `::warning::` rather than a job failure in the previous commit, still in
this same Upcoming section). The maintainer now updates both registries'
overviews by hand, so the step - and its
`tests/dockerRegistryOverviewSync.test.cjs` - are removed entirely rather
than kept working. The identical step is removed from the companion
FerretDB fork's `docker.yml` in the same commit round.

</details>

# v11.62 2026-09-08 WeKan ® release

**In short:** this release adds **test-menu.sh** and a **Markdown**
import/export format, and gives the **GitHub/Gitea/Forgejo issue importer**
loss-reporting instead of silently dropping fields. The **Board View menu**
is reordered and gains placeholder pages for ten not-yet-built views plus a
new **Time** view. The **Board Table** and **Calendar** view toolbars are
rethemed, regrouped and properly centered. Several bugs are fixed:
dependency lines and collapsed lists bleeding past a resized swimlane, a
list's collapse caret sitting in the wrong place, an **OIDC redirect
login loop**, a **Windows single-EXE** CI smoke test failing silently,
and **list width is now a single hardcoded 240px** for every list on
every board, with the redundant "Set width"/"Set swimlane height" popups
removed.

This release adds the following developer-tooling feature:

**Feature testing** - one menu to run and verify WeKan's own features.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1218cd281">Add test-menu.sh and checked-in example inputs for docs/Features</a>. Thanks to xet7.</summary>

test-menu.sh mirrors the docs/Features menu structure and runs the actual
WeKan code for each feature: a dedicated runner for Login (a real REST
username/password round trip) and ImportExport/PDF (create a board, export
it, check the PDF header), and a generic fallback that matches a feature
against this repo's own automated tests by filename. Every feature run
writes output.txt/result.txt/run.log under .tools/test-menu/&lt;timestamp&gt;/,
mirroring the docs/Features path, and never leaves an empty or missing
result. The example INPUT for a feature is checked into the repository next
to its documentation instead - docs/Features/&lt;path&gt;/example-input.txt - so
test-menu.sh only ever reads it, never writes into docs/Features.

</details>

and adds the following Board View feature:

**Board View menu** - its order, icons and the views it opens.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/876b0a2c1">Reorder the Board View menu and add its not-yet-built views</a>. Thanks to xet7.</summary>

New order top to bottom: Swimlanes, Lists, Table, Calendar, Time,
Statistics, Dashboard, Burndown, Burnup, Cumulative Flow, Control, Cycle
Time, Flow Efficiency, Gantt, Lead Time, Throughput Histogram, WIP Run -
each with its own font-awesome icon. The ten views with no implementation
yet get a real grey page titled like their menu entry instead of a menu
item that opens nothing. "Time spent summary" moves out of Statistics into
its own new Time view. models/users.js's profile.boardView schema and
boardHeader.js's tooltip name map both had to learn every new view or
switching to one silently failed (the server rejected it with a 400, or
the tooltip fell back to a generic label); tests/boardViewMenu.test.cjs now
checks the menu, the schema and the tooltip map against the same view list.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/14136a5b0">Group the Board View menu with separators and mark unfinished views</a>. Thanks to xet7.</summary>

`<hr>` separators, matching the right sidebar's own hr-separated groups:
one between Table and Calendar, one between Time and Statistics. The nine
views with no implementation behind them yet (Burndown, Burnup, Cumulative
Flow, Control, Cycle Time, Flow Efficiency, Lead Time, Throughput
Histogram, WIP Run) show a hardcoded "(Name)" label instead of a
translated one - translating them as if they were finished feature names,
like every other entry, would not say in any language that the view
behind them is just a grey placeholder page. Dashboard is left translated;
it is not on the maintainer's list of nine.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/02449c0d0">Move Gantt between Statistics and Dashboard, mark Dashboard unfinished</a>. Thanks to xet7.</summary>

Gantt moves next to Dashboard, with its own `<hr>` separator, matching the
menu's existing grouping. Dashboard now carries the same hardcoded,
untranslated "(Dashboard)" label the other nine not-yet-built views
already had - the earlier entry above left it translated by oversight,
which said the view was finished when it is a placeholder page like the
rest of them.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a5e74972d">Translate the Board View menu's "not implemented yet" labels</a>. Thanks to xet7.</summary>

The two entries above hardcoded the English word itself inside the
parentheses, so on an otherwise fully translated menu these ten entries
read as a leftover bug rather than a "coming soon" marker - the page each
one opens was already correctly translated, since its own title uses the
same key. The literal parentheses are what say "not implemented yet"; the
word inside them is now translated like every other entry, through the
exact key the placeholder page's title uses.

</details>

and fixes the following bugs:

**CHANGELOG.md formatting.**

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4f35d5225">Fix a wrapped changelog summary line</a>. Thanks to xet7.</summary>

A `<summary>` line must be on one line - a wrapped one renders its second
line as literal text instead of part of the link. changelogFormat.test.cjs
already checked this; it was failing before this fix.

</details>

**Calendar view** - the toolbar.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e0e03e200">Move all Calendar view toolbar buttons to the right of the title</a>. Thanks to xet7.</summary>

Today/Previous/Next were their own group under the title, with the
Day/Week/Month view toggles in a third, CENTER group that pushed
everything onto a second row. All the buttons now sit together in one
group on the right of the title, which stays alone on the left and is
vertically centered against them - WeKan's global heading margin
otherwise offset the title from that row.

</details>

**Login** - OIDC redirect-style auto-login.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/89682c251">Fix OIDC auto-redirect looping until the provider rate-limits it</a>. Thanks to Alishara and xet7.</summary>

With `oauth2-login-style: redirect` and `OIDC_REDIRECTION_ENABLED`, the
browser looped between WeKan and the identity provider until the provider
started rate-limiting the repeated `/authorize` requests. The auto-redirect
fired unconditionally on every render of the sign-in page; Meteor's
redirect-style OAuth has no dedicated callback route, so the identity
provider's callback bounces the browser back to that same page, racing the
asynchronous login completion - and a bounce-back render that still looked
"not logged in yet" fired a brand new redirect straight back to the
provider, forever. Fixed with a one-shot flag that survives the round trip
and is cleared on login success/failure, so a later logout can still
auto-redirect again.

</details>

**Swimlanes** - resizing one shorter.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/24199bb1d">Fix dependency lines and collapsed lists bleeding past a resized swimlane</a>. Thanks to xet7.</summary>

Two independent causes: `.swimlane.swimlane-resizing` forced
`overflow: visible !important` for the whole drag, so a collapsed list (a
fixed 540px tall) kept painting past a swimlane being dragged shorter, on
top of the swimlane below it - now `hidden`. And the dependency-line ("red
string") overlay only ever redrew on scroll or a window resize, never on a
swimlane's own height changing, so a line kept stale coordinates from
before the resize; it now recomputes on every height change and refuses to
draw to/from a card with no on-screen area left once every clipping
ancestor is accounted for - a line between two cards in the SAME shrunk
swimlane disappears with the card, while one genuinely crossing into a
different, still-visible swimlane is unaffected.

</details>

**Lists** - the collapse caret, list width, and swimlane height.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0f56a3344">Move an expanded list's collapse caret to its header's top corner</a>. Thanks to xet7.</summary>

The caret rendered as a plain in-flow sibling before the title, on the row
with the card count and the +/menu icons - visually unrelated to either.
Nesting it inside the title heading was tried first and reverted: that
heading opens the rename form on click, so the caret's click bubbled up
and opened that instead of collapsing the list. Fixed by floating the
caret to the START of the header's top line, the same line the hamburger
menu already floats to the END of, so it lands level with that menu at the
header's top corner - the left edge for LTR, the right for RTL.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/04d909b7a">Stack "Same width for all lists" below "Auto list width"</a>. Thanks to xet7.</summary>

Both are `a` toggles in the "Set width" popup with no display rule of
their own, so the browser default (inline) put them side by side on one
crowded line instead of stacked rows like the rest of the popup.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/861494958">Hardcode list width to 240px and remove the width/height set-value popups</a>. Thanks to xet7.</summary>

List width is now a single hardcoded constant (240px) applied to every
list on every board for every viewer. This replaces the model built up
over several past releases - a personal per-user width, a per-list shared
width, a viewer-toggled "same width for all lists" mode and a
viewer-toggled auto-width mode. All of it - the "Set width" list-menu
popup just above, the board-settings "Personal list width" sidebar toggle,
the drag-resize handle, and every schema field and Meteor method behind
them - is removed rather than left dead. The "Set swimlane height" menu
popup goes too, as a redundant text-input alternative to the working
drag-resize handle from the swimlane-resize fix above; that drag handle
itself is untouched. models/wekanCreator.js was still mapping the removed
board fields on WeKan JSON import, which would have failed schema
validation on any import; fixed as part of the same change.

</details>

**Board Table view** - its toolbar: the pagination buttons, two toggle
button tooltips, and vertical alignment.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2d89c086a">Theme Board Table view's pagination buttons like the Search button</a>. Thanks to xet7.</summary>

The prev/next page buttons were plain white with a grey border, unlike
the blue "Search" button right next to them in the same control row - the
two read as different UI families instead of one toolbar.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7b6b9d519">Add descriptive tooltips to the Board Table view toggle buttons</a>. Thanks to xet7.</summary>

The "wrap card titles" and "group by swimlane" toggle buttons had bare
one-word tooltips that said neither what clicking them does nor which of
the two states is currently on. Each now has a state-aware
tooltip/aria-label, translated into every locale.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/663a5a1cc">Vertically center the Board Table view toolbar's controls</a>. Thanks to xet7.</summary>

The search input, Search button, pagination buttons and the two toggle
buttons sit in one flex row with align-items: center - but a flex child
never shrinks below its own content's minimum height no matter what the
container measures, so the Search button's bold label pushed it visibly
taller/lower than the search input beside it. Every control now shares
one explicit border-box height, so there is nothing left for
align-items: center to fail to center.

</details>

and adds the following import/export improvements:

**Import/export formats** - see docs/Features/ImportExport/Format-Coverage.md.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/237b4f3f8">Add Markdown import/export and give GitHub-style import loss reporting</a>. Thanks to xet7.</summary>

The GitHub/Gitea/Forgejo issue importer mapped only a title, description,
one assignee and a due date, silently dropping everything else. It now also
carries a second-and-later assignee, a milestone title, a non-"completed"
state reason and embedded comments, and returns an `unsupported` list of
what it genuinely could not place. Markdown is a new import/export format:
the "## List name" / "- [ ]"/"- [x]" task-list convention several
markdown-kanban tools use (Obsidian Kanban and similar) - a plain bulleted
list with no checkboxes still imports as open cards. The export route
serves plain `text/markdown` rather than JSON, since the point is a file
readable/editable directly or opened by another markdown-kanban tool.

</details>

and has the following developer-tooling fix:

**GitHub Actions** - the Windows single-EXE build.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b34b036eb">Fix the Windows single-EXE smoke test failing with no error message</a>. Thanks to xet7.</summary>

A downloaded run's logs (.tools/wekan10) showed the smoke test's success
message print, immediately followed by "Process completed with exit code
1" - no thrown error anywhere in between. `taskkill.exe` (unlike a
PowerShell cmdlet) sets `$LASTEXITCODE`, which `$ErrorActionPreference`
does not touch, and `pwsh -Command` exits with whatever `$LASTEXITCODE`
last held when the script itself never calls `exit`. `taskkill /IM
ferretdb.exe` finding no matching process - a normal, harmless outcome by
the second smoke-test run - was the LAST external command the whole step
ran, so its "no such process" exit code alone failed the step. The same
latent bug was in the "Free ports used by the packaged EXE" step's
cleanup loop too; both now reset `$LASTEXITCODE` after every `taskkill`
whose own exit code the workflow does not check.

</details>

and adds the following developer-tooling feature:

**Docker releases** - keeping the registry overview pages in sync.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/395aa2b40">Sync the Docker Hub and Quay.io repository overviews from README.md on release</a>. Thanks to xet7.</summary>

Docker Hub and Quay.io each show a long-form "overview"/description on the
repository page, separate from the image tags, and neither registry updates
it on its own - it silently drifts from what README.md actually documents
unless something pushes it. release-all.yml's docker job now adds a step,
after the multi-arch image is built, pushed and verified, that reads
README.md and syncs it: to Docker Hub via its login-for-JWT-then-PATCH
`full_description` API, and to Quay.io via its `PUT
/api/v1/repository/{repo}` `description` API, reusing the same
DOCKERHUB_AUTH/QUAY_AUTH secrets already decoded for `docker login`. GHCR
needs no such call: a package linked to a GitHub repository (as
ghcr.io/wekan/wekan is) already shows that repository's own README
automatically. Each registry is synced independently, the same way the
image push already tolerates one registry failing without blocking the
others, and no token or JWT is ever echoed. The companion FerretDB fork's
own `docker.yml` gained the identical step for wekanteam/ferretdb and
quay.io/wekan/ferretdb. tests/dockerRegistryOverviewSync.test.cjs pins the
new step's endpoints, request bodies, ordering and the
no-plaintext-secrets rule.

</details>

and fixes the following:

**Release consistency and the Statistics view test** - after the Meteor 3.5.2
upgrade and the Time view split.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a7419ba9a">Fix Dockerfile's Meteor release pin after the 3.5.2 upgrade</a>. Thanks to xet7.</summary>

`.meteor/release` was bumped to `METEOR@3.5.2`, but Dockerfile's own
`METEOR_RELEASE` still said `METEOR@3.5.2-rc.0`, so
`tests/releaseVersionConsistency.test.cjs` failed with a version mismatch.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5abcb5f2f">Fix Statistics view test for the Time-view split</a>. Thanks to xet7.</summary>

Time spent summary moved out of the Statistics view into its own Time
view, leaving statsView.jade with one `.stats-view-table` section (board
status) instead of two. The Playwright test still expected 2 tables and
failed on every browser; updated to expect 1.

</details>

Thanks to above GitHub users for their contributions and translators for
their translations.

# v11.60 2026-09-08 WeKan ® release

**In short:** **Logos and board backgrounds accept an external image URL
again**,
reverting the previous release's switch to upload-only, server-converted GIF
storage, and a new **`test-menu.sh`** gives the repository an interactive test
menu shaped exactly like `docs/Features`.

This release reverts the following change:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f07e2e69b">Revert branding and board background images to external URLs</a>. Thanks to xet7.</summary>

The previous release replaced the login logo, top-left corner logo and board
background URL fields with upload-only controls that convert every image to
GIF on the server. This reverts that: the Admin Panel and Organization
branding fields, and the board Change Background Image popup, accept a direct
external image URL again, alongside the existing upload option. Trello and
WeKan JSON imports may again carry an external background URL onto the
imported board. Tests updated to match the restored fields and behavior.

</details>

and has the following developer-tooling addition:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3085e32fe">Add test-menu.sh, a docs/Features-shaped interactive test menu</a>. Thanks to xet7.</summary>

`./test-menu.sh` builds its menu and submenus live from `docs/Features`, so
they can never drift from it: a folder is a submenu, a folder with no
subfolders of its own is a runnable leaf, menu 1 always runs every feature at
once, and 0 goes back (or exits, at the top). Login and ImportExport/PDF are
wired to real WeKan server code from this checkout - a REST username/password
login round trip and a board create-then-export-PDF call - reusing an
already-running WeKan or starting the precompiled `.build/bundle` if one
exists. Every other leaf falls back to running this repository's own matching
`tests/*.test.cjs`, a real, working way to exercise a feature that has no
dedicated runner yet. Each run's starting command, log and any produced files
(the exported PDF, login/board API responses) are saved under
`.tools/test-menu/YYYY-MM-DD_HH-MM-SS/`, mirrored into the same subfolders as
`docs/Features`.

</details>

# v11.58 2026-09-07 WeKan ® release

Now that builds have been fixed, new release with those fixes included.
Fixed are builds of FerretDB, node-patches, mongo-tools-patces and
mongosh-patches.

# v11.56 2026-09-07 WeKan ® release

**In short:** repair test assumptions for generated artifacts, current Finnish
translations, bounded report labels and HTTP/HTTPS session cookies. Application
behavior is unchanged; all 790 Node suites and 15 targeted browser checks pass.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/793f760ea">Fix alltests fixtures and HTTP cookie assertions</a>. Thanks to xet7.</summary>

The September 7 alltests run failed on generated Playwright artifacts, changed
Finnish wording, long fixture labels and an HTTPS-only cookie expectation on
its HTTP test origin. Exclude generated test output, keep localization boundary
checks independent of translator wording, shorten report markers and supply
valid attachment versions. Verify the named login cookie is HttpOnly and hidden
from JavaScript on both transports, and require Secure when the origin is HTTPS.

All 790 Node suites pass. The three affected browser cases pass Chromium,
Firefox and WebKit on HTTP and Chromium and Firefox on the live HTTPS origin
(15 targeted checks). The original Mocha, import, E2E, database-conformance and
FerretDB stages were already successful; application source did not change.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v11.55 2026-09-07 WeKan ® release

**In short:** **Legacy HTML4 is reverted**, restoring the standard Meteor
browser
interface. Local branding images, searchable document previews, browser lazy
loading, translation updates and the session-upgrade fix remain. Meteor tests
compile, and authentication forms follow keyboard order. Swimlane and card
controls regain their previous colors, and upgraded sessions retain their
profile
without a duplicate login.

This release reverts Legacy HTML4 and retains the following changes:

**Browser interface** - standard Meteor pages and deferred browser code.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0f8990bcc">Restore independent swimlane and card control colors</a>. Thanks to Alishara and xet7.</summary>

Revert the client styling from the swimlane title-color matching change and the
card title-color matching change. Swimlane controls again use neutral gray and
darker hover colors, and card controls regain their previous styling. Remove the
shared card-control class and the added light-card title overrides.

Updated source guards cover the restored colors and retained card palette.
Four live checks in Chromium and Firefox verify swimlane normal/hover colors and
card controls on colored backgrounds at [testi.wekan.fi](https://testi.wekan.fi).

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2f82d985e">Keep upgraded session profiles without a duplicate login</a>. Thanks to Alishara and xet7.</summary>

The earlier session-upgrade repair repeated a token login that Accounts had
already started. Live DDP diagnostics reproduced the remaining symptoms of
[#6677](https://github.com/wekan/wekan/issues/6677): the user ID remained logged
in, but rebuilding subscriptions cleared the published profile. The saved
profile in the database was unchanged. This is separate from control CSS.

Move the existing credential and expiry into Accounts' memory store, remove its
old persistent copy, synchronize the token poll and let the native validated
endpoint set the HttpOnly cookie. Do not repeat the initial login. Cookie-only
clients continue using the native cookie resume.

Unit scenarios cover completed and pending initial logins and cookie-only
startup. The extended live regression checks the name, loaded avatar and theme
past the three-second poll, edits the name and theme, favorites the board,
switches to list view and verifies persistence after a cookie-only reload.
Both Chromium and Firefox pass this regression and the private-board refresh
check. Native Edge, AD authentication and WebKit were not exercised.

The Upcoming coverage audit ran all Node suites: 858 checks passed, with the
same two pre-existing failures for an undocumented test-results directory and
Finnish rule-description wording. All three targeted color/session suites pass.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/828fc2d7186f485ce3df056849442f9cdcf5828d">Revert Legacy HTML4</a>. Thanks to xet7.</summary>

Remove the Legacy HTML4 and Legacy Omi progressive browser interface, its
cookieless sessions, page controllers, assets and parity refactors. Page
requests
again use the standard Meteor interface and the previous browser operations.
The HTML4 design documents, paused-work backlog and feature tests are removed.

Intervening translation updates, backup screenshots, session-upgrade repairs,
cryptographic test identifiers, local image storage, searchable document
previews
and browser lazy loading remain. Shared GIF utilities now live in an independent
image module so the retained image features have no HTML4 dependency.

The Node suite run and targeted reruns pass apart from two failures reproduced
with the previous code: an undocumented existing test-results directory and a
Finnish rule-description expectation. Five new interface and image checks pass;
121 changed application modules parse and their 1,001 local imports resolve.
Live validation at [testi.wekan.fi](https://testi.wekan.fi) passes eight checks in Chromium and
Firefox: standard sign-in, JavaScript-disabled responses, member board loading
and non-member denial. WebKit cannot launch with the available system libraries.
Existing suites cover the retained Upcoming features, session repair, build fix,
keyboard navigation and email documentation.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d1b262d29">Lazy-load browser export code and share its ZIP implementation</a>. Thanks to xet7.</summary>

HTML export and its ZIP writer now load only after the HTML Export action is
clicked. The direct JSZip dependency is removed; export uses the same small MIT
`fflate` implementation as server-side document conversion, while ZIP imports
continue through the bounded streaming server route. Gantt no longer imports an
unused Markdown parser, and attachment UI no longer loads BSON merely to create
or display an identifier. Tests keep the feature boundary dynamic, prevent the
duplicate ZIP library from returning, and cover the import/export paths.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cda021ba2">Share the streaming ZIP reader with Trello imports</a>. Thanks to xet7.</summary>

Trello package import no longer relies on an undeclared JSZip copy. It uses the
same server-side `unzipper` reader as the bounded backup and scoped-import
paths,
while retaining path, entry-count, expanded-size and per-file limits. This
leaves
`fflate` as the small lazy browser/document ZIP implementation and `unzipper` as
the server reader for large streamed input.

</details>

**Sign in and sign up** - keyboard order and session continuity.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9f47f00cf">Keep profiles and preferences through session upgrades</a>. Thanks to Alishara and xet7.</summary>

Upgrading from v11.39 no longer replaces the browser's existing resume-token
store before that token has migrated to the new HttpOnly cookie flow. The
three-second Accounts token poll therefore cannot log out the restored user and
remove their reactive name, avatar, theme, favorites and board-view settings.

Static positive and negative coverage pins the migration order and forbids
direct token writes. A Chromium regression recreates the old local-token state,
checks the profile and board view, and remains logged in beyond the poll window.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9fb3d91d9">Fix authentication form keyboard navigation</a>. Thanks to xet7.</summary>

Tab now moves directly from each sign-in or sign-up writing field to the next
one below it without stopping on a show/hide-password control. The controls
remain available by pointer and assistive technology. Native Enter submission
remains active in the bottom field. Source and three-browser tests cover the
positive field order, the skipped controls, failed-login submission and
successful account creation.

</details>

**Images and attachments** - local images and searchable document previews.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/818b57421">Store searchable document text and GIF attachment previews</a>. Thanks to xet7.</summary>

PDF, DOCX, XLSX and PPTX previews are now generated on the server and cached in
Default Storage. Plain Unicode text is stored without formatting in a separate
unpublished `searchText` field, displayed as selectable text, and exposed to a
board-authorized attachment-text search method. Embedded document images and PDF
page imagery are converted to GIF; page controls browse the combined lightweight
representation.

Source bytes, decoded text, page count, archive entries and expanded OOXML data
are
all bounded. ZIP entries are streamed, malformed images do not suppress readable
text, generated data is tied to the original checksum, and every manifest, image
and search request repeats board-read authorization. The small conversion stack
is
MIT and Apache-2.0 only; no GPL, LibreOffice, Ghostscript, browser runtime or
OCR
dependency is added. Tests cover the storage split, authorization, regex
escaping,
selectable safe rendering, GIF routes, size limits, licenses and
vulnerable-version
exclusions. Sharp is updated to 0.35.4 so untrusted image decoding also receives
the
current libvips security fixes.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1b9080bad">Store branding and board background images locally as GIF</a>. Thanks to xet7.</summary>

Admin Panel instance and Organization branding now offers image upload controls
instead of editable external image URL fields. Every upload is authorized,
bounded,
decoded and converted to GIF on the server before it is written to Admin Panel /
Attachments / Default Storage. Direct REST and tenant-setting writes cannot
restore
an arbitrary image source URL. The separately configured logo click destination
is
unchanged.

At startup, existing external login logos, header logos and board backgrounds
are
downloaded through the SSRF-safe fetcher, converted to GIF and atomically
replaced
with internal URLs. A failed legacy download is removed immediately from client-
visible data and retained only in an unpublished retry queue for the next
startup.
Board Settings likewise offers only upload, unset and the stored-background
list;
new board backgrounds pass through a board-admin-checked GIF conversion method.
Offline imports no longer activate third-party background URLs. Regression
coverage
checks authorization, input limits, SSRF-safe migration, Default Storage
selection,
GIF-only output, response hardening, hidden URL write paths, board-background
upload
and import behavior.

</details>

**Tests and build** - compilation and secure test identifiers.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/713ac69ace550f6a0d696a2f3e67d4c924cdc3d5">Verify the restored browser interface over HTTPS</a>. Thanks to xet7.</summary>

Playwright readiness selects HTTPS for a public HTTPS test URL. The board
non-member regression waits for the rendered denial and absence of the canvas,
so the development server's persistent SockJS polling cannot cause a false
network-idle timeout. The HTTPS guard and eight live Chromium/Firefox checks
pass.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4e83304d4">Use cryptographic randomness throughout Playwright tests</a>. Thanks to xet7.</summary>

All Playwright fixture usernames, addresses, object identifiers and run markers
now come from one Node `crypto.randomBytes` helper instead of `Math.random`.
This resolves CodeQL alerts 450 through 522 and prevents predictable randomness
from becoming normalized in tests that exercise authentication and authorization
boundaries.

A source regression scans every Playwright helper and specification, requires
the shared helper to remain CSPRNG-backed and refuses any executable
`Math.random()` call. The retained files pass JavaScript syntax checks; the
removed HTML4 browser
specifications no longer form part of this coverage.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e80c92f1e">Fix the Meteor client test bundle</a>. Thanks to xet7.</summary>

The isomorphic change-history integrity helper now computes synchronous SHA-256
without importing Node `crypto`, so client tests no longer pull in
`crypto-browserify` and fail on its unresolved `vm` and `stream` modules. Test
vectors compare the implementation with Node's SHA-256, and the compiled client
source map is free of the former dependency chain. The language-loading test
now checks i18next state without a dynamic `require` warning. Test-run signal
handlers disarm themselves before cleanup, preventing repeated Ctrl-C presses
from recursively restarting port cleanup.

</details>

**Documentation** - deployment email configuration.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9161c20b3">Document Admin Panel email configuration</a>. Thanks to xet7.</summary>

Snap help, every current Docker Compose example, Unix and Windows start scripts,
and the VirtualBox launcher now explain above `MAIL_URL` that enabling **Enable
below email settings** at Admin Panel / People / Email reveals the additional
email sending options. A regression check keeps that guidance present and in
the correct order across every deployment example.

</details>

Thanks to above GitHub users for their contributions and translators for their
translations.
