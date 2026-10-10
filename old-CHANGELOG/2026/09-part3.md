# WeKan ® 2026-09 releases, part 3

Moved out of [CHANGELOG.md](../../CHANGELOG.md) to keep that
file small enough to open (wekan/wekan#6580). Nothing here has been changed:
a release section is a record, and it reads the same as it did there.

This is part 3 of 6, newest first: [1](09.md), [2](09-part2.md), 3, [4](09-part4.md), [5](09-part5.md), [6](09-part6.md).

Releases per day:

| 2026-09 | Releases |
| --- | --- |
| 14 | 5 |

# v11.78 2026-09-14 WeKan ® release

**In short:** **Board views** use the full available width, and Frappe Gantt
avoids a browser-blocking translation observer loop. **LDAP login** handles an
unset search filter after service-account binding. **Activity feeds** substitute
message values while preserving security-aware rendering. **Language selection**
uses full-width, two-line entries. **Developer tools** recover interrupted Git
pulls, synchronize mirrors in stages and produce compact release notes.
**Translations** repair Basque, Esperanto and Galician wording; broader language
and browser validation remains under review.

This release fixes the following bugs:

**LDAP login** - Optional user search filter.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2c5cdd78a">Handle an unset filter after service-account binding.</a>. Thanks to Nissulya and xet7.</summary>

An unset optional LDAP_USER_SEARCH_FILTER caused an undefined-index TypeError
before searching users. Configured restrictions remain active. Regression,
encryption, connection-release and redacted error-logging checks pass.
Live directory login remains unverified.


Fixes #6692,

</details>


<details>
<summary><a href="https://github.com/wekan/wekan/commit/dad65fb6c">Verify the LDAP post-bind fix through actual user search methods.</a>. Thanks to Nissulya and xet7.</summary>

The latest 11.77 report predates the local fix. Exercise binding followed
by user search with unset and configured filters, and verify failed binding
stops search. The separate oplog observer error remains unproven as a login
cause. Offline regression passes; live directory confirmation remains open.


Fixes #6692,

</details>

**Board layout and navigation** - Full-width content and responsive Gantt.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fda197bb0">Full-width board report views</a>. Thanks to xet7.</summary>

Timeline, Time, Statistics, grouping and chart views use the full available
board width instead of centered 900px or 1100px content caps. Content padding
stays inside the available width. Regression tests cover the shared shells;
a browser test checks Timeline, Time and Statistics at desktop and mobile
widths.


</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/670c20311">Keep Frappe Gantt responsive</a>. Thanks to xet7.</summary>

The header translation observer skips identical text updates, preventing an
endless mutation loop when English labels already match their translations.
Tests cover English and translated labels; a browser regression opens Frappe
Gantt and switches back to Swimlanes.


</details>

**Language picker** - Full-width two-line entries.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c3ce54fa2">Show language and regional flags on separate lines.</a>. Thanks to xet7.</summary>

The popup fills the viewport width, with a language flag/name first and
parenthesized country flag/name below. Wider responsive columns and wrapping
prevent clipped names. All 245 locale/flag checks pass. Browser assertions
cover full width, narrow windows and RTL order; syntax checked but not run live.


</details>

**Activity feeds** - Substitute message values.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/888e0e6bc">Show activity titles and labels instead of literal percent placeholders.</a>. Thanks to xet7.</summary>

Card and right-sidebar activities now pass values through the current
translation API's sprintf options. Discard Spacebars helper metadata while
preserving security-aware formatting and sanitizing. Real formatter tests
cover labels, moves, comments, attachment deletion and link stripping.
Both-feed browser assertions are registered and syntax-checked; live browser
execution was not available.


</details>





and improves the following developer tooling:

**Release workflow** - Changelog-only release notes.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ccfceb7b7">Exclude binary provenance tables from release notes</a>. Thanks to xet7.</summary>

Initial and refreshed release notes contain only the selected changelog
section. Keep checksum verification and provenance build artifacts separately.
Update build.sh, build.bat, release-all.sh and repository instructions.
Release-note, binary-source, menu-parity and shell syntax checks pass.
No release was published; native Windows execution was not tested.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8db16132c">Summarize release-note translations as updated languages</a>. Thanks to xet7.</summary>

Release notes list only affected languages for translation updates. Keep
full translation entries in the changelog and audit; preserve other release
sections. Explicit language metadata prevents guessed names. Offline tests
verify nested detail removal, non-translation preservation, missing metadata
and exact release-heading selection. No release was published.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f7def463b">Restrict release notes to summary, security and language updates</a>. Thanks to xet7.</summary>

Release notes contain only In short, Security, updated translation languages,
the standard thanks line and More details at ChangeLog with the release
anchor. Keep full entries in the changelog. Offline tests verify retained
security details, omitted other entries, exact headings and version links.
Script parity and shell syntax checks pass; no release was published.

</details>



**Git menu** - Recover interrupted pulls and preserve commit links.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f665f7cda">Recover interrupted Git menu operations safely</a>. Thanks to xet7.</summary>

Pull and push stop before an existing rebase, merge or Git lock. Failed rebase
cleanup reports the remaining operation instead of claiming it was aborted.
Fast-forward pulls can autostash tracked edits; pushes check fetch errors and
integrate newer origin commits before publishing. Offline regression tests
cover operation guards and cleanup behavior.


</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f23a18515">Automate interrupted pull recovery and merge integration</a>. Thanks to xet7.</summary>

The Git menu preserves an orphaned autostash and removes only the verified
incomplete rebase setup. Diverged branches merge origin with automatic merge
commits, preserving existing changelog commit hashes. Existing changelog link
repair still commits repairs before a human-run push. Actual content conflicts
remain visible for resolution, and active operations or locks stop recovery.


</details>

**Mirroring** - Staged synchronization and parallel target progress.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/103e4dfac">Synchronize Git, archive locally, then mirror content concurrently.</a>. Thanks to xet7.</summary>

Option 1 synchronizes Git with every active target before source content
collection. After the local archive succeeds, target content processes run
concurrently with combined start-time and issue/release counters. Separate
mirror-named text logs retain each target's output. Restart checkpoints skip
completed content targets. Offline concurrency, failure, restart, archive,
attachment and rate-limit tests pass. No remote synchronization was run.


</details>


<details>
<summary><a href="https://github.com/wekan/wekan/commit/44e3e1fd7">Recover unavailable linked files from historical captures.</a>. Thanks to xet7.</summary>

Use archive.org history near the issue/comment creation date when public
links are unavailable. Bound attachment requests to 30 seconds, defer long
cooldowns without bypassing rate limits, and skip optional network failures.
Keep recovered-file provenance and existing bytes. Offline fallback, private
link, attachment, archive, restart and rate-limit tests pass. No remote
synchronization was run.


</details>


and includes the following translation repairs and reviews:

**Translations** - Terminology, instructions and activity validation.

**Languages updated:** Basque, Esperanto, Galician

<details>
<summary><a href="https://github.com/wekan/wekan/commit/316232f69">Preserve Trello navigation labels in Galician import help</a>. Thanks to xet7.</summary>

Keep literal navigation labels with Galician prose. Retain 29 correct
invitation, template, export and filter values. Correction and review
checks pass; broader language and browser verification remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9b6b1ffe6">Clarify Esperanto overtime work labels</a>. Thanks to xet7.</summary>

Use consistent overtime-work wording for manually classified recorded
hours. Preserve the hours unit and distinguish the flag from deadline
expiry. Correction checks pass; wider fluency/browser review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5d94f1b92">Repair Esperanto advanced-filter examples and escaping</a>. Thanks to xet7.</summary>

Preserve canonical query examples and explain special-character escaping.
Positive examples and negative wording checks pass with correction checks;
broader language and browser verification remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/05217bbb9">Correct Esperanto heap garbage-zapping diagnostic</a>. Thanks to xet7.</summary>

Describe heap garbage overwritten with a bit pattern instead of zeroing,
matching official Node V8 documentation. All correction records pass;
wider language and browser verification remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5946767b1">Validate Esperanto scheduled-job and migration labels</a>. Thanks to xet7.</summary>

Retain 29 correct administration values. Failed/paused and success/failure
states remain distinct. Review checks pass; isolated Complete and broader
language/browser validation remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/460df4ada">Validate Esperanto storage and migration settings</a>. Thanks to xet7.</summary>

Retain 30 correct labels and instructions. Preserve the empty-list AND
same-title populated-list condition, migration action distinctions and
connection success/failure. Review checks pass; broader validation is open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/036cbff31">Validate Esperanto migration repair descriptions</a>. Thanks to xet7.</summary>

Retain 19 correct restoration and repair translations. Preserve literal
field identifiers, board scope and administrator-only permission. Review
checks pass; ambiguous completion labels and broader validation stay open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/07756eecd">Validate Esperanto migration confirmations and steps</a>. Thanks to xet7.</summary>

Retain 30 correct warnings and progress labels. Preserve archived versus
nonarchived scope, conversion before deletion and difficult-undo warnings.
Review checks pass; broader language and browser verification stays open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5a398d5ac">Validate Esperanto scheduling intervals and diagnostics</a>. Thanks to xet7.</summary>

Retain 30 correct restoration, scheduling and resource labels. Preserve
interval quantities, singular/plural agreement, run-once scope and percent
units. Review checks pass; broader validation remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9ba7cfcb8">Validate Esperanto repository and authentication labels</a>. Thanks to xet7.</summary>

Retain 30 correct labels and warnings. Preserve temporary lockout from
failed logins, required credentials, minimum username length and byte units.
Review checks pass; wider language and browser verification remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f523001c3">Validate Esperanto account outcomes and basic labels</a>. Thanks to xet7.</summary>

Retain ten correct labels, preserving account creation success/failure and
login/logout distinctions. Review checks pass; nine uncertain Esperanto
findings and broader language/browser verification remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/41fb26dff">Validate Esperanto scrollbar terminology</a>. Thanks to xet7.</summary>

Retain the correct vertical-scrollbar translation, supported by Komputeko
and LibreOffice terminology. Review checks pass; broader review stays open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0d2e977d9">Validate Galician card and checklist activities</a>. Thanks to xet7.</summary>

Retain 25 correct activity translations. Preserve action distinctions,
object relationships and exact placeholders. Review checks pass; broader
language and browser verification remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b82f539a4">Validate Galician membership and card-movement activities</a>. Thanks to xet7.</summary>

Retain 25 correct activity translations. Preserve movement direction,
old/new object references and checklist states. Review checks pass;
broader language and browser verification remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f1add7ab2">Validate Galician creation controls and offline warning</a>. Thanks to xet7.</summary>

Retain 25 correct translations. Preserve placement, privilege scope,
singular/plural counts and data-loss conditions. Review checks pass;
broader language and browser verification remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/68277a708">Validate Galician board settings and archive controls</a>. Thanks to xet7.</summary>

Retain 25 correct translations. Preserve member/assignee scopes,
public/private distinctions and HTML emphasis. Review checks pass;
broader language and browser verification remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4c585a2b8">Validate Galician deletion warnings and archive guidance</a>. Thanks to xet7.</summary>

Retain 25 correct translations. Preserve permanent deletion, activity loss
and no-undo warnings versus reversible archive guidance. Review checks
pass; broader language and browser verification remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/96367d213">Validate Galician role descriptions and card controls</a>. Thanks to xet7.</summary>

Retain 25 correct translations. Preserve assigned-only visibility,
editing restrictions and worker self-assignment scope. Review checks pass;
broader language and browser verification remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7f7db419c">Validate Galician import mapping and board privacy descriptions</a>. Thanks to xet7.</summary>

Retain 25 correct values. Preserve mapping fallback, last-admin constraint,
notification scope and public-view/member-only-edit distinctions. Review
checks pass; broader language and browser verification remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4f0293f5c">Validate Galician removal and card-shortcut labels</a>. Thanks to xet7.</summary>

Retain 25 correct values. Preserve removal effects, unsaved-description
warnings, thresholds and self-assignment distinctions. Review checks pass;
broader language and browser verification remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e74cc6464">Validate Galician visibility and deletion warnings</a>. Thanks to xet7.</summary>

Retain 25 correct values. Preserve private-only scope, invitation tokens,
field application distinctions and irreversible deletion warnings. Review
checks pass; broader language and browser verification remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/edea4b20e">Validate Galician card settings and automation labels</a>. Thanks to xet7.</summary>

Retain 25 correct values. Preserve parent relationships, subtask destinations,
attachment counts, activity tokens and automation action scope. Review checks
pass; broader language and browser verification remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/54fdfd33c">Repair Galician automation date-trigger meanings</a>. Thanks to xet7.</summary>

Four date-trigger conditions now preserve both setting and changing dates
in Galician, replacing Portuguese wording. Retain 39 correct automation and
HTML-placement values. Positive/negative regression and ledger checks pass;
shared attachment/member participle agreement and browser validation remain
open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2cb3f6b13">Validate Galician deletion warnings and personal card views</a>. Thanks to xet7.</summary>

Retain 34 correct values. Preserve irreversible deletion, linked-card removal
order, mention tokens and due-card permission restrictions. Review checks
pass; broader language and browser verification remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cf1e89bb9">Validate Galician search results and operator instructions</a>. Thanks to xet7.</summary>

Retain 40 correct values. Preserve query syntax, quoted examples, result
tokens, role alternatives and created/modified day thresholds. Review checks
pass; broader language and browser verification remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f22aeb7bc">Validate Galician search predicates and checklist instructions</a>. Thanks to xet7.</summary>

Retain 39 correct values. Preserve boolean search logic, absence checks,
positive limits, deletion constraints, checklist order and legal agreement.
Review checks pass; field-context and browser validation remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2f141de75">Validate Galician storage and account-lockout labels</a>. Thanks to xet7.</summary>

Retain 30 correct values. Preserve attachment/storage scope, account states
and support visibility. Resolve card-show-lists wording against its settings
row and toggle. Review checks pass; broader browser validation remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3b524f071">Validate Galician account states and scheduled board actions</a>. Thanks to xet7.</summary>

Retain 29 correct values. Preserve activation, unlock scope and successful
scheduling versus completed execution. Review checks pass; Complete wording
and broader language/browser validation remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ff77543b5">Validate Galician migration scopes and confirmations</a>. Thanks to xet7.</summary>

Retain 34 correct values. Preserve duplicate-list conditions, archive scope,
repair order, administrator restrictions and progress meanings. Review checks
pass; completion terminology and broader browser validation remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e8766c17b">Validate Galician migration execution and account messages</a>. Thanks to xet7.</summary>

Retain 30 correct values. Preserve background execution, batch limits,
attachment states, account validation and activity tokens. Review checks
pass; broader language and browser validation remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4b926a60f">Validate Galician activities and workspace controls</a>. Thanks to xet7.</summary>

Retain 35 correct values. Preserve action directions, date interpolation,
workspace settings, layout scope and keyboard shortcut inversions. Review
checks pass; broader language and browser validation remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/708478423">Validate Galician display settings and archive controls</a>. Thanks to xet7.</summary>

Retain 30 correct values. Preserve pixel/integer constraints, archive scope,
avatar tokens, mobile/desktop switching and opposing zoom directions.
Review checks pass; broader language and browser validation remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e5e09f52c">Validate Galician calendar and voting labels</a>. Thanks to xet7.</summary>

Retain 30 correct values. Preserve month directions, date distinctions,
voting eligibility, visibility and permanent deletion warnings. Review checks
pass; broader language and browser validation remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/47fb0f277">Validate Galician estimation controls and color labels</a>. Thanks to xet7.</summary>

Retain 30 correct values. Preserve Planning Poker actions, feature names,
automatic-width inversion, clipboard alternatives and color distinctions.
Review checks pass; broader language and browser validation remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/98c90fd8a">Validate Galician custom fields and access labels</a>. Thanks to xet7.</summary>

Retain 30 correct values. Preserve access restrictions, custom-field types,
dropdown alternatives, WIP limits and account email interpolation. Review
checks pass; broader language and browser validation remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ac0f8696f">Validate Galician account emails and export fields</a>. Thanks to xet7.</summary>

Retain 29 correct values. Preserve email purposes and tokens, account states,
export roles, attachment metadata and sorting scope. Review checks pass;
export free wording and broader browser validation remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c45e99b02">Validate Galician filters and import mapping labels</a>. Thanks to xet7.</summary>

Retain 30 correct values. Preserve relative date filters, list visibility,
import formats and existing-user mapping. Review checks pass; broader
language and browser validation remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/885d65b3b">Validate Galician selection and board-management labels</a>. Thanks to xet7.</summary>

Retain 30 correct values. Preserve selection scope, role restrictions,
private-page login interpolation and image-only input. Review checks pass;
broader language and browser validation remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/64a60f189">Validate Galician shortcuts and custom branding labels</a>. Thanks to xet7.</summary>

Retain 30 correct values. Preserve shortcut actions, task/hour limits,
upload states and logo/URL configuration distinctions. Review checks pass;
broader language and browser validation remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6c534f40f">Validate Galician SMTP and system diagnostic labels</a>. Thanks to xet7.</summary>

Retain 30 correct values. Preserve WIP remedies, SMTP purpose, invitation
tokens, webhook scope and system-diagnostic distinctions. Review checks pass;
broader language and browser validation remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dda51a1e5">Validate Galician account permissions and subtask settings</a>. Thanks to xet7.</summary>

Retain 28 correct values. Preserve permissions, metadata, role attribution,
notification scope and subtask path relationships. Review checks pass;
received-label agreement and broader browser validation remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/29f1980b2">Clarify Galician custom-field value clearing activity</a>. Thanks to xet7.</summary>

Describe clearing the card value instead of deleting the field definition.
Preserve both percent tokens and retain 25 correct rule/activity values.
Positive/negative regression and ledger checks pass; contextual rule grammar
and broader browser validation remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/87b9e45fb">Validate Galician rule actions and web metadata labels</a>. Thanks to xet7.</summary>

Retain 30 correct values. Preserve checklist check/uncheck scope, wildcard
meaning, date actions and literal HTML/JSON configuration names. Review
checks pass; broader language and browser validation remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/44ff8c566">Validate Galician date activities and placement labels</a>. Thanks to xet7.</summary>

Retain 30 correct values. Preserve authentication settings, date tokens,
placement directions and approaching/past/today deadline distinctions.
Review checks pass; broader language and browser validation remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/92b911aa9">Validate Galician reminders and notification controls</a>. Thanks to xet7.</summary>

Retain 30 correct values. Preserve due conditions, exact reminder tokens,
read-state scope, account controls and weekday names. Review checks pass;
broader language and browser validation remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c78c7f3c5">Validate Galician entity and search predicate labels</a>. Thanks to xet7.</summary>

Retain 30 correct values. Preserve entity names, view scope, date sorting
and ended/overdue/due predicate distinctions. Review checks pass; broader
language and browser validation remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d2d90abf5">Validate Galician query syntax and troubleshooting instructions</a>. Thanks to xet7.</summary>

Retain 30 correct values. Preserve query shorthand, descending sort, period
predicates and executable diagnostic commands. Review checks pass; broader
language and browser validation remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1adfb3bec">Validate Galician format instructions and request states</a>. Thanks to xet7.</summary>

Retain 27 correct values. Preserve template tokens, exact space entities,
spinner options and closed/resolved distinctions. Review checks pass;
ticket orthography and broader browser validation remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c6c3b90be">Clarify Galician Node heap garbage overwriting and validate ticket spelling.</a>. Thanks to xet7.</summary>

The diagnostic describes overwriting garbage with a bit pattern. Three
Galician ticket labels retain dictionary-accepted spelling. Exact correction,
placeholder, key-order and unchanged-review checks pass.


</details>


<details>
<summary><a href="https://github.com/wekan/wekan/commit/8fbc62075">Validate Galician memory statistics and storage controls.</a>. Thanks to xet7.</summary>

Retained 35 correct diagnostic, invitation, organization, attachment,
progress and time-summary labels after meaning and UI-context review.
Exact unchanged-review checks pass; broader language review remains open.


</details>


<details>
<summary><a href="https://github.com/wekan/wekan/commit/f51c7439f">Validate Galician upload limits and accessibility settings.</a>. Thanks to xet7.</summary>

Retained 30 correct registration, visibility, upload/avatar, custom
translation, ISO week, support and accessibility labels. Exact review
checks pass; uncertain rule fragments and broader language review remain open.


</details>


<details>
<summary><a href="https://github.com/wekan/wekan/commit/cfc2480e5">Fix Galician Received captions and validate scheduled jobs.</a>. Thanks to xet7.</summary>

Two Received captions now agree with the feminine card noun. Retained
30 correct lockout, scheduler and diagnostic values. Exact correction,
placeholder and unchanged-review checks pass; browser review remains open.


</details>


<details>
<summary><a href="https://github.com/wekan/wekan/commit/4e3802901">Validate Galician migration retry and backup labels.</a>. Thanks to xet7.</summary>

Retained 30 correct retry/resume, completion, backup, storage and migration
control values. Exact review checks pass; broader language review remains open.


</details>


<details>
<summary><a href="https://github.com/wekan/wekan/commit/9683042c4">Validate Galician S3 settings and migration outcomes.</a>. Thanks to xet7.</summary>

Retained 30 correct migration start/stop, S3/MinIO endpoint, credential,
region and storage labels. Technical identifiers remain intact. Exact
review checks pass; broader language and browser review remain open.


</details>


<details>
<summary><a href="https://github.com/wekan/wekan/commit/b71db72ab">Validate Galician storage migrations and progress labels.</a>. Thanks to xet7.</summary>

Retained 30 correct storage, permission, restore/repair migration and
progress labels. Scope qualifiers and technical identifiers remain intact.
Exact review checks pass; broader language/browser review remains open.


</details>


<details>
<summary><a href="https://github.com/wekan/wekan/commit/01fa30d1c">Fix Galician completed-subtask agreement and validate migration steps.</a>. Thanks to xet7.</summary>

The completed tooltip now agrees with the feminine subtask noun. Retained
29 correct migration-step, scheduling interval and monitoring labels.
Exact correction, placeholder and review checks pass; browser review remains
open.


</details>


<details>
<summary><a href="https://github.com/wekan/wekan/commit/d2780f008">Validate Galician scheduler and migration threshold wording.</a>. Thanks to xet7.</summary>

Retained 30 correct queue, run, concurrency, monitoring and migration
threshold labels. Numeric ranges and pause/resume meanings remain intact.
Exact review checks pass; broader language/browser review remains open.


</details>


<details>
<summary><a href="https://github.com/wekan/wekan/commit/a5e111f91">Validate Galician repository and account messages.</a>. Thanks to xet7.</summary>

Retained 29 correct resource, repository and account values. Temporary
lockout instructions preserve cause and retry timing; Schedule remains
pending context review. Exact unchanged-review checks pass.


</details>


<details>
<summary><a href="https://github.com/wekan/wekan/commit/641062f8c">Validate Basque activity messages and Galician session labels.</a>. Thanks to xet7.</summary>

Retained 26 correct Basque activity messages and two Galician labels.
Action polarity and underscore placeholders remain intact. Basque archive
wording and nine Galician context-dependent findings remain pending.
Exact review checks pass; broader language/browser review remains open.


</details>


<details>
<summary><a href="https://github.com/wekan/wekan/commit/629577951">Clarify Basque archive activity terminology.</a>. Thanks to xet7.</summary>

Four messages distinguish archive state from generic storage. Retained
26 correct activity, permission, JSON-copy and invitation values. Exact
correction, token and review checks pass; browser validation remains open.


</details>


<details>
<summary><a href="https://github.com/wekan/wekan/commit/e34b55d69">Validate Basque rule fragments and activity settings.</a>. Thanks to xet7.</summary>

Retained 30 correct webhook, subtask, rule, activity and settings values.
Conditional fragments, optional authentication, irreversible deletion and
literal HTML tags retain their meanings. Exact review checks pass;
broader language/browser validation remains open.


</details>


<details>
<summary><a href="https://github.com/wekan/wekan/commit/9910a2c13">Clarify Basque archived search status and validate instructions.</a>. Thanks to xet7.</summary>

Search help distinguishes archived/unarchived cards from generic storage.
Retained 29 correct search, label and troubleshooting values. Operator
examples, commands and interpolation tokens remain intact. Exact correction
and review checks pass; browser validation remains open.


</details>


<details>
<summary><a href="https://github.com/wekan/wekan/commit/ea16ef95e">Validate Basque reports and storage migration messages.</a>. Thanks to xet7.</summary>

Retained 30 correct report, team/organization, invitation, storage and
migration values. Deletion restrictions, outcome polarity and technical
examples remain intact. Exact review checks pass; broader review remains open.


</details>


<details>
<summary><a href="https://github.com/wekan/wekan/commit/a076987c9">Validate Basque date activities and webhook labels.</a>. Thanks to xet7.</summary>

Retained 28 correct date, upload, navigation, URL-scheme and webhook values.
Numeric ranges, outcomes and source tokens remain intact. Free and
impersonation terminology remain pending. Exact review checks pass.


</details>






<details>
<summary><a href="https://github.com/wekan/wekan/commit/4c788beef">Validate Basque date and standalone rule labels</a>. Thanks to xet7.</summary>

Retained 23 correct date, parent-card presentation, custom-field activity and
rule labels after inspecting their use and placeholders. Compound trigger
phrases and remaining translation findings are still under review.


</details>





<details>
<summary><a href="https://github.com/wekan/wekan/commit/ffde8e84e">Validate Basque rule actions and date-field labels</a>. Thanks to xet7.</summary>

Retained 17 correct action and date-field labels. Shared conditional trigger
composition still requires repair; the audit records its Spanish auxiliary.


</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2a22a42a9">Correct Basque rule archive terminology</a>. Thanks to xet7.</summary>

Archive and restore rule labels now refer to the archive instead of generic
storage. Regression checks preserve both directions. Shared trigger auxiliary
and composed grammar remain under review in the translation audit.


</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v11.77 2026-09-14 WeKan ® release

**In short:** Tamazight rules, search, email, attachments and maintenance
labels replace French and inconsistent terminology. Bambara and Fulah
calendar labels also receive repairs. Actions, qualifiers and placeholders
are preserved; provisional calendar and complete software wording still
need language review.

This release includes the following translation repairs and build verification:

This release fixes the following CRITICAL SECURITY ISSUES:

**Security** - Board policies, role capabilities and object boundaries.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/749467c80">Enforce private-only policy for trusted board insertions</a>. Thanks to xet7.</summary>

Copies, imports and helper-created boards now obey the instance private-only
policy at the shared insertion hook. A public insertion becomes private;
logging failure cannot bypass enforcement. Targeted policy and visibility
settings tests pass. Live browser/server verification remains pending.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/962debc12">Enforce private-only board visibility in server methods</a></summary>

VisibilityBleed: direct board creation and card-to-board conversion could
create public boards despite the instance private-only policy (CWE-863).
Both paths now force private visibility before insertion. Blocked overrides
appear as bounded Admin Panel Problems summaries; logging failures cannot
break the policy. Reporter: Wenhao Wu, Southeast University.
Positive policy, negative board-insert inventory and Hall of Fame catalog
coverage pass. Browser regression is added and syntax-checked; live execution
remains pending. The remaining wekansec21 review is tracked in the
security remediation report.

Thanks to Wenhao Wu, Southeast University and xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9b1fb5214">Require write capability for board mutations</a></summary>

MutationBleed: membership-only method checks allowed comment-only and
other non-writing roles to mutate data (CWE-863). List and swimlane moves
now require write access on both boards; checklist moves check both card
boards. Scoped imports, attachment renames and history writes use the same
canonical role policy. The No comments role retains its intended write
access. Denied writes produce bounded Problems summaries; logger failures
cannot bypass the guard.
Role-matrix, method-attack and sibling inventory tests pass. Browser
regression is added and syntax-checked; live execution remains pending.
The remaining wekansec21 review is tracked in the remediation report.

Thanks to Wenhao Wu, Southeast University and xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d7ac619d6">Bind comments to the authorized card board</a></summary>

CommentBoundaryBleed: REST and DDP inserts accepted a foreign card ID on
an authorized board, injecting comments onto private cards (CWE-639).
Both now require the card to belong to the requested board. DDP cannot
rebind existing comment identities to bypass insertion checks. Legacy
comment listing remains card-authoritative after board validation.
Denied attempts appear in bounded Problems summaries. Attack decisions,
negative server insert inventory and existing REST ACL suites pass.
Browser regression is syntax-checked; live execution remains pending.
Remaining reports are tracked in the security remediation report.

Thanks to Wenhao Wu, Southeast University and xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c33e9c3bf">Require administrators for REST board management</a></summary>

ManageBoardBleed: normal members could rename boards, change card
settings and configure trusted automation over REST (CWE-863). These
management endpoints now use the existing board-administrator guard,
including site-admin access. Denials produce bounded Problems summaries.
Actual guard decisions, endpoint inventory, card-settings and rule suites
pass. Browser regression is syntax-checked; live execution remains pending.

Thanks to Wenhao Wu, Southeast University and xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/64123a603">Bind button rules to a writable board and its card</a></summary>

RuleButtonBleed: a board member could run a button rule against a foreign
private card, bypassing collection authorization (CWE-639). Manual rules
now require write capability and a card belonging to the rule board, both
before dispatch and in the shared action dispatcher. Cardless board
buttons remain supported. Denials appear in bounded Problems summaries.
Role and boundary decisions, dispatcher inventory and existing rule suites
pass. Browser regression is syntax-checked; live execution remains pending.

Thanks to Wenhao Wu, Southeast University and xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/055cf42d4">Protect server-issued board invitation fields</a></summary>

InviteProfileBleed: removed members could forge client-writable invitation
fields and reactivate membership (CWE-863). Profile invitation capabilities
are now server-controlled, including array and rename operations and parent
replacement. Modifier-path checks preserve ordinary preference updates.
Blocked invitation changes appear in bounded Problems summaries. Guard and
existing invitation suites pass; browser regression is syntax-checked with
live execution pending.

Thanks to Wenhao Wu, Southeast University and xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/11d2fe037">Replace the activity test sanitizer stub with the real parser</a></summary>

Code scanning alert 540 points to a regex substitute in a test, rather than
an application sanitizer. The test now uses the existing sanitize-html
parser and covers malformed script closing tags. Positive and negative
checks pass. This test-only change has no runtime attack event to log and
no new application vulnerability is claimed.

Thanks to GitHub CodeQL and xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/af9362126">Authorize each board in registration invitations</a></summary>

InvitationBoardBleed: domain-approved registration inviters could include
arbitrary private boards in invitation grants (CWE-639). Every board now
requires the configured inviter role or site-admin access, and must exist.
The complete grant is checked before code mutations or outgoing mail.
Blocked grants appear in bounded Problems summaries. Role/grant inventory
and email suites pass; browser regression is syntax-checked. Live mail and
redemption were not executed.

Thanks to Wenhao Wu, Southeast University and xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/26e9e7030">Prevent linked cards from promoting source read roles</a></summary>

LinkedWriteBleed: a comment-only source member could mint a link on a
self-owned board and gain source writes (CWE-863). Link creation and DDP
pointer changes now require source write access. Explicit non-writing
source roles also block delegation through existing links. UI permissions
follow that ceiling; non-writers no longer receive the link action.
Denied writes appear in bounded Problems summaries. Actual role/permission
and link inventory tests pass; browser regression is syntax-checked, with
live execution pending.

Thanks to Wenhao Wu, Southeast University and xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c50d7b4ea">Authorize subtask deposit content and destination writes</a></summary>

SubtaskDepositBleed: an arbitrary deposit pointer disclosed private board
content and allowed unauthorized subtask inserts (CWE-639). Source scopes
exclude foreign pointers and null IDs. Deposit content now follows its own
reactive board visibility check and destination assignment restrictions.
Assigned-card children follow reactive card cursors; status counts use
visible assigned scopes. Destination write checks precede landing structures
and pointer changes, including a client rename bypass. Denied writes appear
in bounded Problems summaries. Normal filtered reads are not attack events.
Decision/scope and existing subtask/status tests pass. Browser regression is
syntax-checked; live revocation and DDP execution remain pending.

Thanks to Wenhao Wu, Southeast University and xet7 !

</details>

**Translations** - Tamazight interface and maintenance labels; Bambara, Fulah,
Dzongkha and Ewe calendars.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7f24f8035">Retry transient upload status failures with visible progress</a></summary>

A source-upload status GET returning 502 stopped all target uploads.
Safe status/catalog reads now retry up to six attempts; throttled requests
respect Retry-After. Uploads, job status and retry waits show progress in
terminal and text logs. Uncertain failed writes are not resubmitted.
Offline source-job recovery, retry bounds, throttle timing and header
parsing tests pass, along with existing push and pull regression suites.
No live uploads were performed.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7e3e11eda">Repair Tamazight rule report and popup wording</a>. Thanks to xet7.</summary>

Repair three unflagged popup values, preserving singular report, plural
rules, singular rule details and both import/export actions. Native reference
components support the vocabulary; import imperative derivation and full
software phrasing remain low confidence. All 17,479 correction checks pass;
the original pending count is unchanged. Wider language validation and live
browser verification remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/eab3486e6">Repair Tamazight search OR and AND explanations</a>. Thanks to xet7.</summary>

Replace two French search notes and correct the mistaken optional
interpretation of OR. Preserve OR/any versus AND/all, literal example names,
markdown and exact operator placeholders. Full logical phrases, derived
adjectives and return conjugations remain low confidence. All 17,481
correction checks pass; wider language validation and live browser checks
remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fbc39261f">Repair Esperanto member notification and subtask activity</a>. Thanks to xet7.</summary>

Use a singular member reference and the finite past verb with the existing
swimlane term. Retain 14 correct rule and filter labels. Correction and
review checks pass; wider language and browser validation remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3b44bfb5e">Clarify Esperanto custom-field value removal</a>. Thanks to xet7.</summary>

Describe removing a field value correctly. Retain 52 correct rule and
hierarchy labels, including translated example item names with comma
separators. Correction and review checks pass; browser review remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3e0c49da9">Restore size meaning in Esperanto RSS diagnostic</a>. Thanks to xet7.</summary>

Restore the omitted size meaning and retain 28 correct memory, legal and
checklist labels, including documented technical native terminology.
Correction and review checks pass; broader browser/language review is open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6eaabcaea">Clarify Esperanto login-failure time window</a>. Thanks to xet7.</summary>

Describe the time window for failed attempts clearly. Retain 29 correct
support, accessibility and account-state labels. Correction and review
checks pass; wider language and browser validation remains open.

</details>

Translation audit progress as of 2026-09-14: 15,555 original findings are
corrected, 1,981 reviewed and retained, 2,237 restored values await validation,
and 308 remain pending across 17 locales, including 173 Tamazight findings.
The ledger contains 18,151 correction records, including unflagged repairs.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/193b22520">Translate Tamazight lockout account scopes and multiple operators</a>. Thanks to xet7.</summary>

Replace three French values, preserving multiple-operator capability and the
different lockout cases: existing account with correct username and wrong
password, versus a nonexistent username. Account predicates, agreement and
full phrases remain low confidence. All 17,484 correction checks pass; wider
language validation and live browser checks remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c55d70403">Translate Tamazight email sending diagnostics</a>. Thanks to xet7.</summary>

Replace three French messages, preserving sending failure, an error during
the attempt and user-owned SMTP success. Native reference components support
the vocabulary; derived sending noun, affirmative success predicate and full
sentences remain low confidence. All 17,487 correction checks pass; wider
language validation and live browser checks remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3834d033d">Translate Tamazight enrollment subject and password-reset email</a>. Thanks to xet7.</summary>

Replace two French values, preserving recipient account ownership, reset
purpose, greeting/thanks, paragraph layout and site/user/URL placeholders.
Recipient paraphrase, reset conjugation, borrowed click imperative and full
mail composition remain low confidence. All 17,489 correction checks pass;
wider language validation and live browser checks remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bc98c07cc">Translate Tamazight enrollment and verification email bodies</a>. Thanks to xet7.</summary>

Replace two French bodies, preserving service-use versus account-email
verification purpose, link-below action, greeting/thanks, paragraphs and
user/URL placeholders. Native UI and Central Morocco service components
support vocabulary; nested clauses, service adaptation, verify spelling
and borrowed click remain low confidence. All 17,491 correction checks
pass; wider language validation and live browser checks remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ccd2f8072">Translate Tamazight activity email template labels</a>. Thanks to xet7.</summary>

Replace three Arabic labels: two original findings and one unflagged value.
Restore omitted notification meaning and preserve email body versus subject.
Activity terminology adaptation, bound forms, notification plurality and
full label chains remain low confidence. All 17,494 correction checks pass;
wider language validation and live browser checks remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/50a4def6a">Translate Tamazight invitation email template labels</a>. Thanks to xet7.</summary>

Replace three Arabic labels: two original findings and one unflagged value.
Preserve invitation versus reception/computer prompt, body text versus
subject and Invite action. Dialect adaptation, imperative spelling and full
label chains remain low confidence. All 17,497 correction checks pass; wider
language validation and live browser checks remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fd6e6bcd7">Translate Tamazight registration invitation diagnostics</a>. Thanks to xet7.</summary>

Replace two French messages, preserving send error versus successful send
and registration/account-creation purpose without claiming acceptance.
Derived sending/creation nouns, bound forms, affirmative success and full
purpose phrases remain low confidence. All 17,499 correction checks pass;
wider language validation and live browser checks remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/288a2e7e5">Translate Tamazight board invitation templates and code label</a>. Thanks to xet7.</summary>

Replace three French templates and an unflagged Arabic invitation-code label.
Preserve inviter/recipient, board membership, cooperation purpose, polite
follow-link instruction, paragraphs and exact placeholders. Full
constructions, greeting formality and dialect/software adaptations remain
low confidence. All 17,503 correction checks pass; wider language validation
and live browser checks remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/93c55d1fc">Translate Tamazight selected-list position labels</a>. Thanks to xet7.</summary>

Replace two French labels, preserving opposite left/right directions and
selected-list scope. IRCAM and native UI components support vocabulary;
emphatic spelling, bound forms and full phrase agreement remain low
confidence. All 17,505 correction checks pass; wider language validation and
live browser checks remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/16d4a73de">Translate Tamazight used-email warning and username import</a>. Thanks to xet7.</summary>

Replace Arabic and French values, preserving an already-used email-address
warning and username import direction. Native UI components support
vocabulary; predicate agreement, derived plurals and import imperative
remain low confidence. All 17,507 correction checks pass; wider language
validation and live browser checks remain open.

</details>


<details>
<summary><a href="https://github.com/wekan/wekan/commit/ee1845167">Repair Tamazight label actions and minicard text visibility</a>. Thanks to xet7.</summary>

Replace six Arabic/French values, including five unflagged strings. Keep
add/edit actions, card scope, colors and names distinct. Restore the missing
text qualifier so hiding minicard label text does not imply hiding labels.
All 17,513 correction/rendering checks pass. Vocabulary components are
reference-supported; software adaptation, color plural and full composed
phrases remain low confidence. Wider language and browser review remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ac49f847d">Repair Tamazight card sorting and display labels</a>. Thanks to xet7.</summary>

Replace five Arabic/French values, including four unflagged strings. Preserve
sorting by the number displayed on minicards, missing-label negation, list
name and card-details scope. All 17,518 correction/rendering checks pass.
Native components support vocabulary; software adaptation, bound nouns and
complete composed phrases remain low confidence. Wider language and live
browser validation remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bc8ef464f">Repair Tamazight selection and diagnostic details labels</a>. Thanks to xet7.</summary>

Repair four unflagged values: generic, Cron and migration Details labels
replace Arabic; selected wording uses native UI vocabulary and retains its
colon. All 17,521 correction/rendering checks pass. Details vocabulary is
reference-supported; standalone selected agreement remains low confidence.
Original pending counts are unchanged. Wider language and live browser
validation remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8e39144f6">Repair Tamazight previous and next month navigation labels</a>. Thanks to xet7.</summary>

Replace three unflagged French values, preserving previous/next directions
and explicit month scope. CLDR and native UI components support vocabulary;
complete calendar navigation and standalone previous usage remain low
confidence. All 17,521 correction/rendering checks pass. Original pending
counts are unchanged; wider language and live browser review remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/081b2c8af">Repair Tamazight card and swimlane placement labels</a>. Thanks to xet7.</summary>

Replace five original French findings, preserving above versus below,
selected qualification, card versus swimlane scope and add action. Native UI
components support vocabulary; swimlane adaptation, bound nouns and complete
placement phrases remain low confidence. All 17,521 correction/rendering
checks pass; 594 original findings remain pending. Wider language and live
browser validation remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/95c40e770">Repair Tamazight multi-selection label and member actions</a>. Thanks to xet7.</summary>

Repair three original French findings and an unflagged card-label command
that incorrectly used a button word. Preserve label versus member setting,
multiple-selection removal, literal 1-9 range and all-label/card scope.
All 17,521 correction/rendering checks pass; 591 original findings remain.
Native components support vocabulary; software set adaptation, multiple
adjective, bound nouns and full phrases remain low confidence. Wider language
and live browser validation remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b9f553d2f">Repair Tamazight comment search error and header wording</a>. Thanks to xet7.</summary>

Replace three French/Arabic values, including two unflagged strings. Preserve
no matching card whose comment contains the queried text, card scope and
exact %s placeholders. All 17,537 correction/rendering checks pass; 590
original findings remain. Native components support vocabulary; comment
plural, bound nouns, feminine negation and full phrases remain low confidence.
Wider language and live browser validation remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3ae48d78d">Repair Tamazight organization labels and missing-name error</a>. Thanks to xet7.</summary>

Replace four French values, including one unflagged string. Preserve plural
add/list, singular settings, missing named organization and exact %s token.
All 17,521 correction/rendering checks pass; 587 original findings remain.
The computing lexicon marks vocabulary MW (Mammeri); dialect adaptation,
spelling, feminine negation and full phrases remain low confidence. Wider
language and live browser validation remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/97a8210e6">Repair Tamazight email test recipient and template labels</a>. Thanks to xet7.</summary>

Replace three French/Arabic values, including two unflagged strings.
Preserve test qualifier, sending to oneself, plural templates and email scope.
All 17,544 correction/rendering checks pass; 586 original findings remain.
Native components support vocabulary; math-to-email-test adaptation, bound
nouns, reflexive recipient and full phrases remain low confidence. Wider
language and live browser validation remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/36f198b38">Repair Tamazight team labels and organization name errors</a>. Thanks to xet7.</summary>

Replace seven French/Arabic values, including five unflagged strings.
Preserve already-used organization/team names versus missing team,
singular/plural labels, add action and exact %s token. All 17,551
correction/rendering checks pass; 584 original findings remain. IRCAM and
native UI components support vocabulary; free plural, software/dialect
adaptation, bound nouns and full errors remain low confidence. Wider language
and live browser validation remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7a0afb331">Repair Tamazight group deletion guards and irreversible warnings</a>. Thanks to xet7.</summary>

Replace five original French findings. Preserve organization/team/account
scope, confirmation and no undo. Group deletion guards retain the condition
that one or more users belong to the group. All 17,556 correction/rendering
checks pass; 579 original findings remain. Native components support
vocabulary; no-undo paraphrase, modal/restore conjugation and full membership
warnings remain low confidence. Wider language and live browser validation
remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ec6e91594">Repair Tamazight board-group removal and creation guidance</a>. Thanks to xet7.</summary>

Replace four original French findings. Preserve removal from the board,
team/organization scope, creation purpose and contact-administrator guidance.
All 17,560 correction/rendering checks pass; 575 original findings remain.
Native components support vocabulary; derived contact imperative, creation
conjugation, bound nouns, dialect adaptation and full guidance remain low
confidence. Wider language and live browser validation remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/36313cda3">Repair Tamazight added-group display labels</a>. Thanks to xet7.</summary>

Replace two original French findings. Preserve added qualifier, team and
organization plurals, displayed-below relation and colon. Native addition
and display components support vocabulary; indexed wording is not used as
proof of displayed wording. All 17,562 correction/rendering checks pass;
573 original findings remain. Derived passive/participle, dialect adaptation
and full labels remain low confidence. Wider language and live browser
validation remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d648d4e23">Repair Tamazight search, card import and received-date titles</a>. Thanks to xet7.</summary>

Replace three original French findings. Preserve all-board search scope,
singular Trello card import and received-date scope distinct from start/due
dates. All 17,565 correction/rendering checks pass; 570 original findings
remain. Native components support vocabulary; derived import imperative,
board plural, reception dialect adaptation, bound nouns and full titles
remain low confidence. Wider language and live browser validation remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4dddf82cb">Repair Tamazight field label and board-admin visibility wording</a>. Thanks to xet7.</summary>

Replace the original French field-label instruction and an unflagged unclear
visibility phrase. Preserve field label on minicard and visible only to board
administrators. All 17,567 correction/rendering checks pass; 569 original
findings remain. Native components support vocabulary; derived display
passive, bound nouns, minicard composition and full restriction remain low
confidence. Wider language and live browser validation remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1dc34b1a9">Repair Tamazight attachment labels and action popups</a>. Thanks to xet7.</summary>

Replace twelve French/Arabic values, including nine unflagged strings.
Preserve attachment singular/plural, distinct add/edit/delete/actions/move
wording and exact GridFS/S3 destinations. All 17,579 correction/rendering
checks pass; 566 original findings remain. The explicit lexicon term is
Kabyle mail-attachment wording; Standard Moroccan card-context adaptation,
transcription, agreement and full phrases remain low confidence. Wider
language and live browser validation remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b150142b2">Repair Tamazight attachment activities and bulk-move messages</a>. Thanks to xet7.</summary>

Replace eight French/mixed-language values, including two unflagged strings.
Preserve deleted activity, exact %s, incomplete when fragment, personal
ownership, all versus all-of-board and GridFS/S3 destinations. All 17,587
correction/rendering checks pass; 560 original findings remain. Native
components and explicit Kabyle terminology support vocabulary; dialect
adaptation, actor gender, agreement and full phrases remain low confidence.
Wider language and live browser validation remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0d1adc687">Repair Tamazight attachment count and filesystem move wording</a>. Thanks to xet7.</summary>

Replace four original French/Arabic findings. Preserve minicard attachment
count, singular/all/all-of-board scope and filesystem destination. All
17,591 correction/rendering checks pass; 556 original findings remain.
The lexicon explicitly names a filesystem; dialect/software adaptation,
transcription, bound nouns and complete phrases remain low confidence.
Wider language and live browser validation remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/62f68966a">Repair Tamazight attached activity and upload export headers</a>. Thanks to xet7.</summary>

Replace three unflagged Arabic/French values. Preserve both ordered %s
tokens, attachment event meaning, upload direction and by-actor versus
at-time header distinction. All 17,594 correction/rendering checks pass;
original pending counts are unchanged. Derived conjugation, actor gender,
header prepositions, attachment paraphrase and dialect adaptation remain
low confidence. Wider language and live browser validation remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/37fdff2d2">Repair Tamazight missing-list and migration correction labels</a>. Thanks to xet7.</summary>

Replace four original French findings. Preserve create versus fix, missing
lists/IDs and correction of file URLs rather than file contents. All 17,598
correction/rendering checks pass; 552 original findings remain. Native UI,
Rif list plural and MW correction references support vocabulary; dialect
adaptation, derived negative plural, acronym agreement and full labels
remain low confidence. Wider language and live browser validation remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/27d9f69f4">Repair Tamazight file and attachment URL correction actions</a>. Thanks to xet7.</summary>

Replace two original French findings. Preserve all-file versus attachment
URL scope, correction action and exact URL acronym. All 17,600 correction/
rendering checks pass; 550 original findings remain. Lexicon and native
all-qualifier references support vocabulary; dialect adaptation, acronym
agreement, transcription and full noun relations remain low confidence.
Wider language and live browser validation remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c288651ba">Repair Tamazight duplicate and empty-list deletion labels</a>. Thanks to xet7.</summary>

Replace four original French findings with provisional repeat-derived and
contains-nothing wording. Preserve duplicate and empty qualifiers and avoid
private/double ambiguity. All 17,604 correction/rendering checks pass;
546 original findings remain. Technical duplicate meaning is not established;
derived passive, feminine-plural agreement and full labels remain low
confidence and need further research. Wider language and browser review remain
open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/281bc41b7">Add provisional Bambara Buddhist and Coptic calendar names</a>. Thanks to xet7.</summary>

Replace two bare English labels with provisional calendar compounds using
the existing calendar noun. Borrowing spelling, proper-name association and
compound grammar remain low confidence without canonical native attestation.
All 17,606 correction/rendering checks pass; 544 original findings remain,
including two Bambara civil/tabular epoch findings. Wider language and live
browser validation remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1582958d2">Use Fulah Adlam CLDR names for Buddhist and Coptic calendars</a>. Thanks to xet7.</summary>

Replace two bare English labels with Latin transcriptions of full native
Adlam CLDR calendar names. Exact Adlam sources are retained in the ledger;
Latin transcription and regional terminology remain low confidence pending
native review. All 17,608 correction/rendering checks pass; 542 original
findings remain, including three Fulah Hijri variant findings. Provisional
variant text needs semantic review. Wider language and browser review remain
open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8e8198e26">Restore Fulah Saudi calendar moon-sighting qualifier</a>. Thanks to xet7.</summary>

Replace the English label and restore missing moon-sighting detail. Exact
Latin country name and native see/moon components support vocabulary; full
composition remains low confidence pending technical review. Provisional
Adlam Hijri names have punctuation/semantic uncertainties; a Swedish
homograph is not accepted as Fulah evidence. All 17,637 correction/rendering
checks pass; 520 original findings remain, including two Fulah epoch findings.
Wider language and browser review remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7a77db4e9">Repair Tamazight Excel import popup</a>. Thanks to xet7.</summary>

Replace the French import title while retaining Excel CSV/TSV names.
Native entry wording and cached import terminology support components;
complete import phrasing remains low confidence. All 17,637 correction
checks pass; 520 original findings remain pending.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7d86e7a56">Repair Tamazight avatar URL migration labels</a>. Thanks to xet7.</summary>

Replace two French repair labels while retaining URL and existing avatar
terminology. The correction verb has dictionary support; complete wording
still needs language review. All 17,637 correction checks pass.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8ca3f1a4a">Repair Tamazight date editing messages</a>. Thanks to xet7.</summary>

Replace French/Arabic start, end and received-date activity/popup wording.
The first activity value is the destination date, the second its card.
All 17,637 correction checks pass; full phrasing still needs language review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e24b61f13">Repair Tamazight board avatar display label</a>. Thanks to xet7.</summary>

Replace French while preserving display action and board-member ownership.
Native show/member components are supported; existing avatar terminology
and complete phrasing need review. All 17,637 correction checks pass.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6a3b81124">Repair Tamazight JSON validity warning</a>. Thanks to xet7.</summary>

Replace French while preserving the invalid-JSON warning and text ownership.
Native components support wording; full construction needs review. Paste
prompts remain open. All 17,637 correction checks pass.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0e797a3ac">Repair Tamazight member removal messages</a>. Thanks to xet7.</summary>

Replace French activity and Arabic control, preserving removal from card
and all location placeholders. Full phrasing and actor morphology need
language review. All 17,637 correction checks pass.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c7d630200">Repair Tamazight card move and restore activities</a>. Thanks to xet7.</summary>

Replace French using native move/restore components. Preserve restoration
destination and distinct old/new locations. Full phrasing still needs
language review. All 17,637 correction checks pass.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/16ff43bf8">Repair Tamazight card move rule triggers</a>. Thanks to xet7.</summary>

Replace French trigger and fragment, preserving when-event scope and
another-list destination. Derived passive and agreement need language
review. All 17,637 correction checks pass.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/35121ef8b">Repair Tamazight removal source fragment</a>. Thanks to xet7.</summary>

Replace unflagged French Removed from wording, preserving passive removal
and source relation. Finite passive needs language review; assignee terms
remain open. All 17,637 correction checks pass; original counts unchanged.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7791cbb31">Repair Tamazight username length warning</a>. Thanks to xet7.</summary>

Replace French, preserving the required minimum of three characters and
username scope. Full construction still needs language review.
All 17,637 correction checks pass.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/07f7ea683">Repair Tamazight file size limits</a>. Thanks to xet7.</summary>

Replace Arabic avatar/upload labels, preserving maximum file size and
byte units. Derived terminology and full phrasing need language review.
All 17,637 correction checks pass.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3856f63a3">Repair Tamazight card opening labels</a>. Thanks to xet7.</summary>

Replace Arabic Open and bulk card-opening labels, preserving multiple
cards and one-operation qualifier. Verb adaptation and full composition
need language review. All 17,637 correction checks pass.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fd8b479c1">Repair Tamazight board scan labels</a>. Thanks to xet7.</summary>

Replace French checking statuses, preserving separate board file-attachment
and member-avatar scopes. Derived noun and full ownership wording need
language review. All 17,637 correction checks pass.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9fbd8467a">Repair Tamazight login attempt error</a>. Thanks to xet7.</summary>

Replace French while preserving error during attempted login without
inventing a password or LDAP cause. Temporal construction needs language
review. All 17,637 correction checks pass.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0e4ea74c7">Repair Tamazight restore control</a>. Thanks to xet7.</summary>

Replace unflagged Arabic Restore with a native restoration-root command.
Imperative adaptation needs language review; archive terminology remains
open. All 17,637 correction checks pass; original counts unchanged.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/746a10ff7">Repair Tamazight existing account prompt</a>. Thanks to xet7.</summary>

Replace French, preserving conditional and already-existing account.
Positive possession adaptation and full clause need language review.
All 17,637 correction checks pass.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6e7ecf2eb">Repair Tamazight memory usage label</a>. Thanks to xet7.</summary>

Replace French diagnostics text with computer-memory terminology supported
by native usage vocabulary and the CNAM computing lexicon. The free usage
noun and full Standard Moroccan adaptation remain low confidence and need
language review. All 17,637 correction/rendering checks pass; 520 original
findings remain pending. Restored and unflagged values still need validation.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dbb9d5309">Refine Tamazight email click commands</a>. Thanks to xet7.</summary>

Use the native MediaWiki click imperative in password-reset, enrollment
and email-verification messages. Refine existing correction records while
preserving placeholders and other prose. All 17,637 correction/rendering
checks pass; original queue counts are unchanged. Complete email wording
remains low confidence pending language review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9ecbdf30d">Translate Tamazight upload completion status</a>. Thanks to xet7.</summary>

Replace French status text using native upload and completion vocabulary.
Positive completion morphology and the full sentence remain low confidence
pending fluent review. All 17,638 correction/rendering checks pass; 519
original findings remain pending, including 374 Tamazight findings.
Restored, unflagged and earlier low-confidence wording still need validation.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/636e1aef8">Translate Tamazight total memory diagnostic</a>. Thanks to xet7.</summary>

Replace Arabic OS total-memory text while preserving the OS acronym and
total memory scope. Native total vocabulary and Moroccan computing memory
terminology support components; full adaptation remains low confidence.
All 17,639 correction/rendering checks pass; 518 original findings remain
pending. Restored, unflagged and earlier low-confidence wording need review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fcb0580de">Translate Tamazight card creator display setting</a>. Thanks to xet7.</summary>

Replace French setting text using native display and creator terminology.
Preserve creator ownership and existing vocabulary. Full card-label
adaptation remains low confidence pending fluent review. All 17,640
correction/rendering checks pass; 517 original findings remain pending.
Restored, unflagged and earlier low-confidence wording still need validation.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e203ace1d">Translate Tamazight external memory diagnostic</a>. Thanks to xet7.</summary>

Replace French Node external-memory usage text. Preserve Node and external
qualifier; vocabulary evidence does not imply disk storage. Full adaptation
remains low confidence pending fluent review. All 17,641 correction/rendering
checks pass; 516 original findings remain pending. Free-memory terminology,
restored, unflagged and earlier low-confidence wording still need review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3e14cc960">Translate Tamazight announcement labels</a>. Thanks to xet7.</summary>

Replace Arabic/French announcement and administrator-title labels using
native Moroccan announcement vocabulary, including one unflagged repair.
Full administrator attribution remains low confidence; the separate active
system-wide qualifier remains unresolved. All 17,643 correction/rendering
checks pass; 515 originals remain pending. Broader language review continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3b9b9e677">Translate Dzongkha Coptic calendar label</a>. Thanks to xet7.</summary>

Replace English-only Coptic text with native dictionary vocabulary and the
existing calendar compound pattern. Coptic identity is preserved; complete
compound spelling remains low confidence pending fluent review. All 17,644
correction/rendering checks pass; 514 originals remain pending, including
three Dzongkha Hijri variants. Broader language validation continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/34e1e16d2">Review Dzongkha calendar variant reference limits</a>. Thanks to xet7.</summary>

Compare directly downloaded publisher and GNU computing dictionaries.
Both confirm Coptic spelling, but corrupted extraction and differing indexed
terms do not establish full Hijri variants. The epoch example does not prove
calendar reference-date terminology. Keep three variants pending further
native review; no translation values or audit counts changed.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d73bc647f">Translate Ewe Saudi sighting calendar label</a>. Thanks to xet7.</summary>

Replace English-only variant text and restore the omitted sighting qualifier.
Preserve Hijri calendar and Saudi identity with native component vocabulary.
Moon-sighting composition remains low confidence pending fluent review.
All 17,645 correction/rendering checks pass; 513 originals remain pending,
including one Ewe astronomical-epoch finding. Broader validation continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e7e5ef563">Translate Tamazight due today status</a>. Thanks to xet7.</summary>

Replace French wording, restore the current qualifier and preserve the date
placeholder. Native today/current vocabulary supports components; existing
deadline terminology and full status syntax remain low confidence pending
fluent review. All 17,646 correction/rendering checks pass; 512 original
findings remain pending. Broader language validation continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c6ff27201">Correct Tamazight reference provenance assumptions</a>. Thanks to xet7.</summary>

Correct source notes in 98 Tamazight translation records after checking the
CNAM bibliography. MC£ denotes Tuareg sources and MC denotes Mokrane
Chemim’s lexicon; neither establishes Central Moroccan dialect attestation.
Earlier attribution assumptions are invalid. Affected terminology and full
wording require renewed review; locale values and pending counts are unchanged.
All 17,646 correction/rendering checks pass structurally, without proving
fluency.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0b608edc6">Review independent Tamazight memory usage evidence</a>. Thanks to xet7.</summary>

Record direct RAM terminology usage from a Moroccan hardware website in
three memory correction records. This corroborates computer-memory usage
without resolving unknown translation provenance, canonical terminology or
full grammar. Keep low-confidence and renewed-review requirements. No locale
values or counts changed; the original pending queue remains 512 findings.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e37cdd564">Translate Tamazight search instructions heading</a>. Thanks to xet7.</summary>

Replace French heading using native search and indexed directives vocabulary.
Full source retrieval failed HTTP 403; institutional-to-software guidance
adaptation remains low confidence pending fluent review. All 17,647
correction/rendering checks pass; 511 original findings remain pending.
Broader language validation, including provenance-affected wording, continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5444fd2ff">Translate Tamazight vote end date popup title</a>. Thanks to xet7.</summary>

Replace French title while preserving change vote end-date scope. Native
component vocabulary supports provisional wording; election-to-card-voting
adaptation and complete title syntax remain low confidence pending review.
All 17,648 correction/rendering checks pass; 510 originals remain pending.
Broader language validation, including provenance-affected wording, continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9d8719dc1">Translate Tamazight card voting controls</a>. Thanks to xet7.</summary>

Replace four Arabic/French voting labels, preserving question, edit and delete
actions. Native component vocabulary supports provisional wording; election
to card voting adaptation and complete phrases remain low confidence pending
fluent review. All 17,652 correction/rendering checks pass. These unflagged
repairs leave 510 original findings pending. Broader language validation
continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/02fa748b8">Repair Quechua Saudi Hijri sighting calendar label</a>. Thanks to xet7.</summary>

Replace incomplete English with primary CLDR Quechua calendar and sighting
vocabulary. The full label composition remains low confidence pending fluent
review. Astronomical approach wording was not substituted for astronomical
epoch; that finding remains open. All 17,653 correction/rendering checks pass;
509 original findings remain pending. Broader language validation continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/464e8064a">Translate Tamazight planning poker delete and vote date titles</a>. Thanks to xet7.</summary>

Replace two French popup titles, preserving the named Planning Poker technique,
this deletion question and change vote end-date scope. Native component
vocabulary supports provisional wording; full composition and election to
card voting adaptation remain low confidence pending fluent review. All
17,655 correction/rendering checks pass; 507 original findings remain pending.
Broader language validation continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cd635c297">Translate Tamazight support page labels</a>. Thanks to xet7.</summary>

Replace four Arabic/French support labels using native assistance vocabulary,
preserving title and content distinctions. Help to support adaptation, bound
forms and full phrases remain low confidence pending fluent review. Longer
not-yet-added and logged-in-only notices remain open. All 17,659 correction
checks pass; these unflagged repairs leave 507 original findings pending.
Broader language validation continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cff15734b">Translate Tamazight support authenticated user notice</a>. Thanks to xet7.</summary>

Replace French while preserving support information for logged-in users only.
Native components support provisional wording; derived login participle and
complete sentence remain low confidence pending fluent review. All 17,660
correction checks pass; 506 original findings remain pending. Broader language
validation and the not-yet-added notices remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1faf5af98">Translate Tamazight cron error message label</a>. Thanks to xet7.</summary>

Replace French with native message and error vocabulary, preserving the
message versus details distinction. Full software noun phrase remains low
confidence pending fluent review. All 17,661 correction checks pass; this
unflagged repair leaves 506 original findings pending. Broader language
validation continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e5e75d14e">Translate Tamazight card member instruction and restore board scope</a>. Thanks to xet7.</summary>

Replace Arabic and restore omitted board-member scope. Preserve adding board
members to the card or removing them from the card, without implying removal
from the board. Complete coordinated instruction, bound forms and object
pronoun remain low confidence pending fluent review. All 17,662 correction
checks pass; 505 original findings remain pending. Broader validation continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dc56a74b0">Translate Tamazight end date search predicate guidance</a>. Thanks to xet7.</summary>

Replace French while retaining exact predicate code and cards with an end
date. Plural possession, full relative construction and end-date adaptation
remain low confidence pending fluent review. All 17,663 correction checks
pass; 504 original findings remain pending. Broader validation continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ffd0a02e2">Repair Tamazight OS CPU count translation</a>. Thanks to xet7.</summary>

Replace Arabic CPU consumption wording with CPU count using native count
vocabulary and conventional OS/CPU abbreviations. Full technical label remains
low confidence pending fluent review. All 17,664 correction checks pass;
503 original findings remain pending. Broader language validation continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c6d225f64">Translate Tamazight account and card noun labels</a>. Thanks to xet7.</summary>

Replace three Arabic labels, preserving plural accounts/cards and singular
card. Native account and local card vocabulary support provisional wording;
derived account plural and technical card sense remain low confidence pending
fluent review. All 17,667 correction checks pass. These unflagged repairs leave
503 original findings pending. Broader language validation continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/278ca9967">Translate Tamazight support information not yet added notice</a>. Thanks to xet7.</summary>

Replace French while retaining support information, not yet and added action.
Native components support provisional wording; full negative passive sentence
remains low confidence pending fluent review. All 17,668 correction checks
pass; 502 original findings remain pending. Broader validation continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c333e96a8">Translate Tamazight rule list name label</a>. Thanks to xet7.</summary>

Replace French with native name and list vocabulary, preserving the rule
list-name meaning. Complete kanban noun phrase remains low confidence pending
fluent review. All 17,669 correction checks pass; this unflagged repair leaves
502 original findings pending. Broader language validation continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f3534ffd4">Translate Tamazight Umm al Qura calendar label</a>. Thanks to xet7.</summary>

Replace incomplete English with provisional CLDR Islamic calendar wording,
retaining the named Umm al-Qura variant. Complete named-variant composition
remains low confidence pending fluent review. All 17,670 correction checks
pass; 501 original findings remain pending. Broader validation continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c5202dfd6">Complete Tamazight Dangi and ISO calendar labels</a>. Thanks to xet7.</summary>

Use the native CLDR calendar noun while retaining named Dangi and ISO-8601
identities. Full mixed-script composition remains low confidence pending
fluent review. All 17,672 correction checks pass. One original and one
unflagged repair leave 500 originals pending. Broader validation continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fd1301db0">Record Tamazight server troubleshooting terminology review</a>. Thanks to xet7.</summary>

Distinguish native server/error vocabulary from indexed cross-dialect command
execution and installation terms. Preserve the literal snap/Docker diagnostic
commands and installation conditions. Full Moroccan instructions remain
unresolved; no locale values or classification counts changed.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bcc1bd4e8">Translate Tamazight change and delete avatar popup titles</a>. Thanks to xet7.</summary>

Replace three Arabic/French titles, preserving change/delete actions and the
delete question. Native actions and local profile-picture terminology support
provisional wording; profile sense and full phrases remain low confidence
pending fluent review. All 17,675 correction checks pass; these unflagged
repairs leave 500 original findings pending. Broader validation continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/88a9aeef4">Translate Tamazight avatar upload action and completion labels</a>. Thanks to xet7.</summary>

Replace two Arabic labels while preserving upload action versus completed
upload state. Native actions and local profile-picture vocabulary support
provisional wording; passive morphology and full phrases remain low confidence
pending fluent review. All 17,677 correction checks pass; these unflagged
repairs leave 500 original findings pending. Broader validation continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/57685be53">Translate Tamazight minicard cover image controls</a>. Thanks to xet7.</summary>

Replace three Arabic labels, retaining add, remove-from and display-on minicard
cover meanings. Local cover sense, derived small adjective and complete phrases
remain low confidence pending fluent review. All 17,680 correction checks pass;
497 original findings remain pending. Broader language validation continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fb65e027b">Use Tamazight severity terminology in cron error table</a>. Thanks to xet7.</summary>

Replace French with existing recovery-severity wording for identical English
source. Severity remains distinct from message/details. Terminology is low
confidence pending fluent review in both contexts; local consistency does not
validate it. All 17,681 correction checks pass; 497 originals remain pending.
Broader language validation continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/454dd4291">Document Silesian database terminology evidence</a>. Thanks to xet7.</summary>

Corroborate regional human use of the shared computer-database term while
keeping the raw-file qualifier and complete label pending. Distinguish the
Silesian quotation from the Polish article wrapper and record retrieval
limits. No locale values or counts changed; broader language review continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c2fb2749b">Translate Tamazight email invitation action</a>. Thanks to xet7.</summary>

Replace the French button with the existing Invite action and native email
term, retaining the email channel. The invitation verb and full phrase
remain low confidence and require renewed Moroccan dialect review. All
17,682 correction/rendering checks pass; 497 originals remain pending.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/794c8acda">Translate Tamazight Ethiopic Amete Alem calendar label</a>. Thanks to xet7.</summary>

Use the CLDR native Ethiopic calendar base and retain Amete Alem to identify
the era variant. The complete mixed-script label remains low confidence and
needs fluent review. All 17,683 correction/rendering checks pass; 496 original
findings remain pending, including 361 Tamazight findings.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/851bef0f1">Align Tamazight page label with native software terminology</a>. Thanks to xet7.</summary>

Use the exact native MediaWiki singular Page noun. Supporting evidence is
limited to this label; other regional synonyms and complete page phrases
are not classified by this repair. All 17,684 correction/rendering checks
pass; the original pending queue remains 496.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5f37a017d">Translate Tamazight confirmation button</a>. Thanks to xet7.</summary>

Replace the Arabic Confirm label with the exact native software
confirmation-button wording. Preserve its distinction from invitation
acceptance and the confirmation question. All 17,685 correction/rendering
checks pass; 496 original findings remain pending.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/870da4dd2">Translate Tamazight workspace add edit and name labels</a>. Thanks to xet7.</summary>

Replace five French values, preserving Add, Edit and Name distinctions and
singular workspace scope. Native institutional space usage corroborates the
noun; its WeKan workspace application, bound form and full labels remain
low confidence. All 17,690 correction/rendering checks pass; 491 original
findings remain pending, including 356 Tamazight findings.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/059d46d0a">Translate Tamazight workspace settings and close labels</a>. Thanks to xet7.</summary>

Replace two French Workspace Settings headings and the Arabic Close action,
using native software terms. Complete workspace headings and bound forms
remain low confidence and require fluent review. All 17,693 correction/rendering
checks pass; 489 original findings remain pending, including 354 Tamazight
findings.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5cde6f4a3">Translate Tamazight workspace confirmation and board deletion</a>. Thanks to xet7.</summary>

Replace the French workspace deletion question and Delete Board action.
Preserve certainty, singular object and deletion rather than archive. Native
delete wording is supported; complete phrases remain low confidence and
need fluent review. All 17,695 correction/rendering checks pass; 488 original
findings remain pending, including 353 Tamazight findings.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/785db327d">Translate Tamazight invitation decline action</a>. Thanks to xet7.</summary>

Replace the French Decline button with native request-rejection wording.
Check the invitation handlers to preserve rejection rather than merely
closing the popup. All 17,696 correction/rendering checks pass; the original
pending queue remains 488 and wider language review continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/aa36776a9">Translate Tamazight navigation confirmation and settings labels</a>. Thanks to xet7.</summary>

Replace five Arabic labels with native software wording. Preserve Back
versus Previous/Next Page, confirmation acknowledgment and generic Settings.
All 17,701 correction/rendering checks pass; the original pending queue
remains 488 and broader language validation continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0e2a70634">Translate Tamazight weekday and duration labels</a>. Thanks to xet7.</summary>

Replace five Arabic labels using full CLDR Tuesday, Thursday and Saturday
names and native software plural days/hours. Preserve weekday identity and
duration plural scope. All 17,706 correction/rendering checks pass; the
original pending queue remains 488 and wider language review continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7ee8c65e1">Translate Tamazight minutes and seconds duration labels</a>. Thanks to xet7.</summary>

Replace two Arabic duration units, preserving minute versus second and
plural scope. Native plural minutes is supported; derived plural seconds
remains low confidence and needs fluent morphology review. All 17,708
correction/rendering checks pass; 488 original findings remain pending.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ea0dc6777">Translate Tamazight board card list and member add labels</a>. Thanks to xet7.</summary>

Replace six Arabic Add labels and matching popup headings. Preserve singular
Board, Card and List, plural Members and the Add action. Native component
terms are supported; complete kanban commands remain low confidence and
need fluent review. All 17,714 correction/rendering checks pass; 488 original
findings remain pending.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5f6777192">Translate Tamazight member and board settings labels</a>. Thanks to xet7.</summary>

Replace three Arabic labels, preserving singular Member Settings, singular
Board Settings and plural Edit members. Native component vocabulary is
supported; full kanban phrases and bound forms remain low confidence and
need fluent review. All 17,717 correction/rendering checks pass; 488 original
findings remain pending.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/989b9c960">Translate Tamazight server error and closed status labels</a>. Thanks to xet7.</summary>

Replace two Arabic labels, preserving Server Error heading and Closed status
rather than the Close action. Native status wording and error/server
components are supported; the full heading remains low confidence and
needs fluent review. All 17,719 correction/rendering checks pass; 488 original
findings remain pending.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/329c1dd4d">Translate Tamazight board title and card details headings</a>. Thanks to xet7.</summary>

Replace two Arabic headings, preserving Board Title and plural Details of
a singular Card. Native title/details vocabulary is supported; complete
kanban phrases and bound forms remain low confidence and require fluent
review. All 17,721 correction/rendering checks pass; 488 original findings
remain pending.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2a099f1e2">Verify Tamazight authentication reference provenance</a>. Thanks to xet7.</summary>

Direct PDF extraction identifies the authentication candidate’s source as
Tuareg (MC£), despite search-index MCF rendering. Keep full authentication
labels pending; preserve method/type, display/default and authentication
versus ordinary sign-in/authorization. No locale values or counts changed.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d791f67a8">Translate Tamazight Minguo calendar label</a>. Thanks to xet7.</summary>

Use native Calendar vocabulary and retain Minguo from the English source,
avoiding generic Chinese language/calendar substitution. The full mixed-script
name remains low confidence and needs fluent review. All 17,722
correction/rendering
checks pass; 487 original findings remain pending, including 342 Tamazight
findings.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/df6b3a1e7">Translate Tamazight People label</a>. Thanks to xet7.</summary>

Replace Arabic with the native People label documented in Mastodon zgh,
preserving people scope rather than users or board members. All 17,723
correction/rendering checks pass; 487 original findings remain pending.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d2d46ce5e">Translate Tamazight team user and Planning Poker edit headings</a>. Thanks to xet7.</summary>

Replace three French headings using native Edit components, preserving
singular team/user objects and the Planning Poker feature name. Complete
adapted phrases remain low confidence and need fluent review. All 17,726
correction/rendering checks pass; 487 original findings remain pending.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cbd1047b9">Translate Tamazight profile and board view labels</a>. Thanks to xet7.</summary>

Replace six Arabic People/Edit Profile/Title/Calendar/Lists/Members labels
with native terminology supported by Mastodon, MediaWiki and CLDR. Preserve
action, calendar and plural scope. All 17,732 correction/rendering checks
pass; 487 original findings remain pending.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/198add194">Translate Tamazight week month and year date labels</a>. Thanks to xet7.</summary>

Replace three Arabic date predicates with exact CLDR Tamazight singular
date-field names used in tooltips, Gantt, calendar navigation and search.
All 17,735 correction/rendering checks pass; 487 original findings remain
pending. Live browser verification was not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a5562c120">Translate Tamazight search and rule nouns</a>. Thanks to xet7.</summary>

Replace six Arabic User/Member/List labels, preserving distinct singular
object types. The derived free-state Member noun remains low confidence
for fluent morphology review. All 17,741 correction/rendering checks pass;
487 original findings remain pending.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6a211b7fd">Translate Tamazight card type and popup headings</a>. Thanks to xet7.</summary>

Replace four Arabic Card/Delete Card?/Card Actions/Labels headings,
preserving ordinary card type, singular card and plural actions/labels.
Complete kanban adaptations and bound forms remain low confidence for
fluent review. All 17,745 correction/rendering checks pass; 487 original
findings remain pending.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8db529010">Translate Tamazight workspace menu label</a>. Thanks to xet7.</summary>

Replace French Workspace menu with native Menu/content-space components.
Organizational workspace extension and the full bound phrase remain low
confidence for fluent review. All 17,746 correction/rendering checks pass;
486 original findings remain pending, including 342 Tamazight findings.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1d48efb92">Translate Tamazight Planning Poker start heading</a>. Thanks to xet7.</summary>

Replace French initiation wording, preserving Planning Poker and Start
action rather than the date noun. Full command remains low confidence;
IRCAM manual evidence is indexed only and direct fetch redirects to HTML.
All 17,747 correction/rendering checks pass; 485 original findings remain
pending, including 342 Tamazight findings.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/045444b83">Document Tamazight start versus share spelling evidence</a>. Thanks to xet7.</summary>

Record indexed IRCAM plain Begin/Start versus emphatic Share/Divide
spelling, protecting the corrected Planning Poker heading. Direct PDF
access redirects to HTML; full command and subworkspace terminology remain
under review. No locale values or counts changed.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9a16d9f59">Document Bambara tabular calendar terminology limits</a>. Thanks to xet7.</summary>

Current CLDR provides date units and Era, but no native Hijri variant
names. Era alone does not validate reference-date Epoch. Preserve tabular
calculation and civil versus astronomical epoch; both labels remain pending.
No translation values or counts changed.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8fd6e4051">Translate Tamazight text profile and list deletion labels</a>. Thanks to xet7.</summary>

Replace three Arabic Text/Profile/Delete List? labels with native wording
supported by MediaWiki and Mastodon, preserving singular list and question
punctuation. All 17,750 correction/rendering checks pass; 485 original
findings remain pending.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f2e9cb149">Translate Tamazight subworkspace add and name labels</a>. Thanks to xet7.</summary>

Replace two French headings with an explicitly derived subworkspace compound,
preserving hierarchy and Add versus Name. New compound, bound form and
workspace extension remain low confidence for fluent review; indexed prefix
evidence does not attest the complete term. All 17,752 correction/rendering
checks pass; 483 original findings remain pending, including 342 Tamazight.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/53faea649">Translate Tamazight other card count labels</a>. Thanks to xet7.</summary>

Replace mixed English/Arabic count prose, preserving exact `__count__`,
And/Other and singular/plural Card meaning. Complete numeral phrases and
counted noun morphology remain low confidence for fluent review. All
17,754 correction/rendering checks pass; 483 original findings remain pending.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/14c0e79c1">Translate Tamazight board and card reference labels</a>. Thanks to xet7.</summary>

Replace four Arabic labels preserving All versus generic Boards and
This Board/Card scope. Board plural morphology and full kanban phrases
remain low confidence for fluent review. All 17,758 correction/rendering
checks pass; 483 original findings remain pending.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1d3e91be7">Translate Tamazight account unlock actions</a>. Thanks to xet7.</summary>

Replace three French click/confirmation/all-user labels by expressing
removal of login blocking, preserving this-user versus all-users scope.
Full unblock compounds and grammar remain low confidence for fluent review.
All 17,761 correction/rendering checks pass; 481 original findings remain
pending, including 342 Tamazight.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/eb44e6733">Translate Tamazight all locked user unlock messages</a>. Thanks to xet7.</summary>

Replace two French messages preserving All Locked Users and confirmation
question versus completed result. Full quantified unblock phrases and
passive adaptation remain low confidence for fluent review. All 17,763
correction/rendering checks pass; 479 original findings remain pending,
including 342 Tamazight.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e82fbbe1a">Translate Tamazight successful user unlock result</a>. Thanks to xet7.</summary>

Replace French result preserving success, singular user and removal of
login blocking. Positive success construction, removal nominalization and
full bound phrase remain low confidence for fluent review. All 17,764
correction/rendering checks pass; 478 original findings remain pending,
including 342 Tamazight.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b4aa7cd79">Translate Tamazight search text and Enter instruction</a>. Thanks to xet7.</summary>

Replace French instruction preserving writing search text and pressing
Enter. Native components support wording; key-press adaptation, relative
clause and full sentence remain low confidence for fluent review. All
17,765 correction/rendering checks pass; 477 original findings remain
pending, including 342 Tamazight.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9d571595e">Translate Tamazight New and New User labels</a>. Thanks to xet7.</summary>

Replace two Arabic labels using native New adjective and singular account
user terminology. Complete New User heading remains low confidence for
fluent review. All 17,767 correction/rendering checks pass; 477 original
findings remain pending.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e5b85f241">Translate Tamazight Board View labels</a>. Thanks to xet7.</summary>

Replace two Arabic Board View labels with generic view and singular board
wording. The adapted full phrase and bound board noun remain low confidence
for fluent review. All 17,769 correction/rendering checks pass; 477 original
findings remain pending, including 342 Tamazight.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b0379afb8">Repair Tamazight domain Users heading</a>. Thanks to xet7.</summary>

Replace cross-dialect account-user wording with the directly attested
Standard Moroccan plural, preserving Users rather than board members or
people. All 17,770 correction/rendering checks pass; 477 original findings
remain pending. Broader restored-value and terminology validation continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9ffc165f5">Translate Tamazight custom help link label</a>. Thanks to xet7.</summary>

Replace French Custom Help Link URL wording, preserving URL and the custom
qualifier. Full noun-chain grammar, bound link noun and specified/custom
adaptation remain low confidence for fluent review. All 17,771 correction
checks pass; 476 original findings remain pending, including 341 Tamazight.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4559d6bac">Record Tamazight subtask terminology error</a>. Thanks to xet7.</summary>

Identify the unflagged use of Language in Add Existing Card as Subtask.
Record indexed primary references and their limits; preserve the hierarchical
relation when repairing the complete action. No translation values or counts
changed. This finding remains part of the broader translation review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/17f7bb4ac">Translate Tamazight hierarchical subtask labels</a>. Thanks to xet7.</summary>

Replace five Arabic/French labels with explicit Task(s) under a Task wording.
Preserve hierarchy, singular/plural, settings and deletion question. Full
paraphrases and bound noun morphology remain low confidence for fluent
review. All 17,776 correction checks pass; 473 original findings remain
pending, including 338 Tamazight. Existing-card action repair remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ef0181cd4">Repair Tamazight subtask action wording</a>. Thanks to xet7.</summary>

Repair four actions with hierarchical Task wording. Remove Language and
With from Add Existing Card as Subtask, preserving Existing and As. Keep
confirmation question and plural Actions. Full phrases remain low confidence
for fluent review. All 17,780 correction checks pass; 472 original findings
remain pending, including 337 Tamazight.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/62bdf5ab9">Translate Tamazight added activity messages</a>. Thanks to xet7.</summary>

Replace two Arabic activity messages while preserving completed past action,
all percent placeholder counts/order and hierarchical Subtask wording. Full
activity grammar and past conjugation remain low confidence for fluent
review. All 17,782 correction checks pass; 471 original findings remain
pending, including 336 Tamazight.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d82e7ae07">Translate Tamazight linked entity labels</a>. Thanks to xet7.</summary>

Repair Linked Subtask, Linked Card and Linked Board using native linked/
associated wording. Preserve hierarchy and entity distinctions. Full phrases
and participle agreement remain low confidence for fluent review. All
17,785 correction checks pass; 471 original findings remain pending.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2e89b4d91">Translate Tamazight field labels and actions</a>. Thanks to xet7.</summary>

Replace four Arabic/French labels while preserving custom, edit, absence
and hierarchical Subtask qualifiers. Derived field plurals, specified/custom
adaptation and complete phrases remain low confidence for fluent review.
All 17,789 correction checks pass; 470 original findings remain pending,
including 335 Tamazight.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e5ae1e646">Translate Tamazight field control labels</a>. Thanks to xet7.</summary>

Replace French checkbox, dropdown list and custom-field filter labels.
Preserve selection, dropdown direction and filtering qualifiers. Full
control terminology and derived morphology remain low confidence for
fluent review. All 17,792 correction checks pass; 469 original findings
remain pending, including 334 Tamazight.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/54febc0b5">Translate Tamazight migration scope and failure labels</a>. Thanks to xet7.</summary>

Replace four French labels, preserving singular/plural, board/database
scope and failed status. Native move terminology adapted to software
migration, derived nouns and full phrases remain low confidence for fluent
review. All 17,796 correction checks pass; 468 original findings remain
pending, including 333 Tamazight.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/07e02fe2d">Translate Tamazight selection and required migration labels</a>. Thanks to xet7.</summary>

Replace five labels, preserving Select action, entity scope and required/
not-required polarity. Select Color follows native MediaWiki wording. Full
necessity constructions and software migration terminology remain low
confidence for fluent review. All 17,801 correction checks pass; 466 original
findings remain pending, including 331 Tamazight.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2bdb12f24">Translate Tamazight completion status labels</a>. Thanks to xet7.</summary>

Replace four French statuses, distinguishing bare completion from
successful migration completion. Completed-tense adaptation and full
status grammar remain low confidence for fluent review. Generic Complete
action remains under contextual review. All 17,805 correction checks pass;
465 original findings remain pending, including 330 Tamazight.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a2546a352">Translate Tamazight migration run and progress controls</a>. Thanks to xet7.</summary>

Replace three French labels, preserving imperative Run, ongoing Running/
In Progress, ellipsis and board scope. Passive derivation and full software
status phrases remain low confidence for fluent review. All 17,808 correction
checks pass; 464 original findings remain pending, including 329 Tamazight.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d8a33d5fc">Translate Tamazight step and current-step labels</a>. Thanks to xet7.</summary>

Replace three French labels, preserving singular/plural and Current. Primary
references corroborate step noun/plural; software-phase extension and full
agreement remain low confidence for fluent review. All 17,811 correction
checks pass; 464 original findings remain pending.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/eb0c8fdc0">Translate Tamazight migration validation action</a>. Thanks to xet7.</summary>

Replace French Validate Migration with native verification imperative.
Preserve validation rather than running or completion. Full migration
validation phrase remains low confidence for fluent review. All 17,812
correction checks pass; 464 original findings remain pending.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/839088b60">Translate Tamazight migration warnings heading</a>. Thanks to xet7.</summary>

Replace French Migration Warnings preserving plural warnings rather than
errors or failure. Derived plural and full software-migration phrase remain
low confidence for fluent review. All 17,813 correction checks pass; 463
original findings remain pending, including 328 Tamazight.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ba8efb246">Use native Tamazight administrator role labels</a>. Thanks to xet7.</summary>

Repair three unflagged role labels, including two Arabic values, using the
native singular administrator term. Board-qualified phrase remains low
confidence for fluent review. All 17,816 correction checks pass; 463 original
findings remain pending.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/94a68db59">Align Tamazight plural migration and step labels</a>. Thanks to xet7.</summary>

Repair three unflagged labels, including French All Migrations, preserving
plurals and All semantics. Derived migration plural and software phrases
remain low confidence for fluent review. All 17,819 correction checks pass;
463 original findings remain pending.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/febec4e31">Translate Tamazight migration errors heading</a>. Thanks to xet7.</summary>

Replace French Migration Errors preserving plural errors distinct from
warnings. Full software phrase remains low confidence for fluent review.
All 17,820 correction checks pass; 463 original findings remain pending.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f0795037b">Translate Tamazight migration administrator restriction</a>. Thanks to xet7.</summary>

Replace French text preserving Only board administrators and permission to
execute plural migrations. Derived grammar and complete sentence remain low
confidence for fluent review. All 17,821 correction checks pass; 462 original
findings remain pending, including 327 Tamazight.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f2603e2e7">Align Tamazight migration status terminology</a>. Thanks to xet7.</summary>

Align two unflagged labels with reviewed migration spelling, preserving
status rather than progress/completion. Full phrases remain low confidence
for fluent review. All 17,823 correction checks pass; 462 original findings
remain pending.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d70a15999">Translate Tamazight checklist item actions</a>. Thanks to xet7.</summary>

Repair Add an item and Hide all checklist items, preserving action and scope.
Proposed checklist paraphrase and derived forms remain low confidence for
fluent review. All 17,825 correction checks pass; 460 original findings
remain pending, including 325 Tamazight.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a5aea1651">Translate Tamazight checklist deletion headings</a>. Thanks to xet7.</summary>

Repair two French headings, distinguishing one-item and whole-checklist
deletion. Verification noun is not established by native-source checks;
full paraphrase remains low confidence for fluent review. All 17,827
correction checks pass; 459 original findings remain pending.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/efc33e5c1">Translate Tamazight checklist menu actions</a>. Thanks to xet7.</summary>

Repair Arabic Add Checklist and French Checklist Actions, preserving whole
checklist and plural actions. Proposed verification noun and full paraphrase
remain low confidence for fluent review. All 17,829 correction checks pass;
459 original findings remain pending.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/59845f1ca">Translate Tamazight checklist deletion confirmations</a>. Thanks to xet7.</summary>

Repair two French confirmations with native question frame, preserving
whole-checklist versus one-item deletion. Native bound singular Item is
attested; free adaptation and full checklist phrases remain low confidence.
All 17,831 correction checks pass; 457 original findings remain pending.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e50b2b72f">Translate Tamazight checklist noun labels</a>. Thanks to xet7.</summary>

Repair six unflagged Arabic/French labels preserving singular, plural and
Of relation. Native list components are attested; proposed verification noun
and full checklist terminology remain low confidence for fluent review.
All 17,837 correction checks pass; 457 original findings remain pending.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/177aff81b">Translate Tamazight checklist rule actions</a>. Thanks to xet7.</summary>

Repair three unflagged French rule actions preserving Add versus Remove of
whole checklist. Proposed verification noun and full phrases remain low
confidence for fluent review. All 17,840 correction checks pass; 457 original
findings remain pending.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8c1b29f29">Align Tamazight checklist count terminology</a>. Thanks to xet7.</summary>

Use native count and plural element components preserving literal (0/0).
Proposed checklist noun and complete phrase remain low confidence for fluent
review. All 17,841 correction checks pass; 457 original findings remain pending.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/aa3f4ce66">Align Tamazight minicard checklist count</a>. Thanks to xet7.</summary>

Align native count/item components preserving literal (0/0) and minicard
scope. Small Card paraphrase and derived grammar remain low confidence for
fluent review. All 17,842 correction checks pass; 457 original findings remain
pending.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/85c8bcdf0">Translate Tamazight checklist add and remove activities</a>. Thanks to xet7.</summary>

Repair four Arabic activities preserving checklist versus item, Add/Remove,
To/From/In and exact %s order/count. Full phrases and derived forms remain low
confidence for fluent review. All 17,846 correction checks pass; 455 original
findings remain pending, including 320 Tamazight.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e396b633d">Translate Tamazight completed checklist activity</a>. Thanks to xet7.</summary>

Repair French completed activity preserving two ordered %s tokens. Full
phrase and past/transitive completion adaptation remain low confidence.
Uncompletion needs active reversal wording rather than simple negation.
All 17,847 correction checks pass; 454 original findings remain pending.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b07cbe95a">Translate Tamazight checklist form close controls</a>. Thanks to xet7.</summary>

Repair two French controls preserving Close Form and Add/Edit distinction.
Derived addition noun and full checklist phrases remain low confidence for
fluent review. All 17,849 correction checks pass; 452 original findings remain
pending, including 317 Tamazight.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/292b623e5">Translate Tamazight finished checklist visibility control</a>. Thanks to xet7.</summary>

Repair Arabic control preserving Hide and finished-checklist restriction.
Derived relative grammar and full phrase remain low confidence for fluent
review. All 17,850 correction checks pass; 451 original findings remain pending.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c3c60cd4c">Clarify Tamazight checklist completion evidence</a>. Thanks to xet7.</summary>

Record native legal supplementation usages without treating them as proof
of past transitive checklist completion. Preserve low-confidence status and
active-uncompletion distinction. No values/counts changed; correction checks
pass.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b701a697d">Translate Tamazight minicard checklist display control</a>. Thanks to xet7.</summary>

Repair French control preserving Show Checklist and minicard scope. Proposed
checklist/minicard phrases remain low confidence for fluent review.
All 17,851 correction checks pass; 450 original findings remain pending.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/29e4bcc1c">Translate Tamazight custom HTML tag labels</a>. Thanks to xet7.</summary>

Repair two French labels preserving plural tags, Custom, HTML and link/meta
element identifiers. Terminology adaptations and full phrases remain low
confidence for fluent review. All 17,853 correction checks pass; 448 original
findings remain pending, including 313 Tamazight.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dd797e68b">Record native transitive software completion evidence</a>. Thanks to xet7.</summary>

Native Complete Login supplies stronger software completion evidence. Past
actor form and full checklist grammar remain low confidence; custom-logo
terminology remains unresolved. No values/counts changed; correction checks
pass.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3845b24a5">Translate Tamazight custom login logo URLs</a>. Thanks to xet7.</summary>

Repair two French labels while preserving URL and distinguishing the logo
image from its destination link. Native community usage supports Logo;
bound forms and complete phrases remain low confidence for fluent review.
All 17,855 correction checks pass; 446 original findings remain pending.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/878bbd2b5">Translate Tamazight text below custom login logo</a>. Thanks to xet7.</summary>

Replace the French label using native Text, Below, Logo and Login evidence.
Preserve placement below the custom logo. Full noun-chain grammar remains
low confidence for fluent review. All 17,856 correction checks pass;
445 original findings remain pending across 17 locales.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/479fbd178">Translate Tamazight checklist rule condition prefixes</a>. Thanks to xet7.</summary>

Repair four French prefixes, including two unflagged values. Preserve
generic versus named checklist and item conditions. Native usage supports
temporal When; checklist terminology and assembled rule grammar remain
low confidence. All 17,860 correction checks pass; 443 original findings
remain pending across 17 locales. Live browser verification was not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e548b250d">Translate Tamazight checklist line-to-item hint</a>. Thanks to xet7.</summary>

Replace Arabic bulk-entry guidance using native textual Line and Text
usage. Preserve one line equals one checklist item and the literal equals
sign. Full grammar and checklist terminology remain low confidence.
All 17,861 correction checks pass; 442 original findings remain pending.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2521b7092">Translate Tamazight start and end date rule conditions</a>. Thanks to xet7.</summary>

Repair two unflagged mixed-language conditions, distinguishing start and
end dates. Restore When and Set or Changed alternatives. Native component
evidence supports the repair; Set adaptation and full clauses remain low
confidence. All 17,863 correction checks pass; 442 originals remain pending.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2f7ea0f78">Repair Tamazight checklist text editor title</a>. Thanks to xet7.</summary>

Remove an inherited First qualifier absent from English and preserve Edit
checklist items as Text. This unflagged wording repair does not treat Latin
script alone as an error. Native component evidence supports Edit and Items;
full wording remains low confidence. All 17,864 correction checks pass.
442 original findings remain pending; live browser verification was not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b2f402fb7">Translate Tamazight each-line checklist guidance</a>. Thanks to xet7.</summary>

Replace Arabic guidance while preserving each text line becoming one of
the checklist items. Native component evidence supports Each, Line and
Items; derived Become and full wording remain low confidence. The separate
original-order variant remains pending. All 17,865 correction checks pass;
441 original findings remain pending across 17 locales.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/06fc5be68">Record Tamazight conversion verb evidence limits</a>. Thanks to xet7.</summary>

Native Ministry Return/date-back usage does not verify the proposed Become
verb or its morphology. Retain low confidence and separately review the
original-order constraint. No translation values or counts changed.
All 17,865 correction checks pass; 441 originals remain pending.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/63850d062">Translate Tamazight original-order checklist guidance</a>. Thanks to xet7.</summary>

Replace two Arabic values, including an unflagged label. Preserve original
ordering and one item per text line. Inspected dictionary preface confirms
cross-variety proposals; terminology and full grammar remain low confidence.
All 17,867 correction checks pass; 440 original findings remain pending.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/af533b852">Clarify Tamazight logo dictionary provenance</a>. Thanks to xet7.</summary>

Apply the inspected cross-variety preface to two earlier logo URL correction
records. Retain separate native community-caption evidence and low confidence
on full labels; dictionary corroboration does not establish normative Moroccan
terminology. No values/counts changed. All 17,867 correction checks pass.
440 original findings and broader validation remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/638efa8ae">Translate Tamazight rule actor qualifier</a>. Thanks to xet7.</summary>

Replace the unflagged French By qualifier before the user-name field.
Preserve the actor condition; full assembled predicate grammar remains
low confidence. All 17,868 correction checks pass; 440 originals remain
pending. Live browser verification was not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e5628a333">Translate Tamazight migration starting progress</a>. Thanks to xet7.</summary>

Replace French progress text using native Start evidence. Preserve ongoing
starting, plural migrations and the ellipsis. Derived passive and full
clause remain low confidence for fluent review. All 17,869 correction
checks pass; 439 original findings remain pending across 17 locales.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f5862acbd">Translate Tamazight migration pause states</a>. Thanks to xet7.</summary>

Repair Pausing and Paused, including an unflagged value, using native app
pause evidence. Preserve ongoing progress versus paused state and ellipsis.
Plural passive and full clauses remain low confidence; upstream also uses
the root for Stop, so it does not prove a distinct lexical term.
All 17,871 correction checks pass; 438 original findings remain pending.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9e1adc713">Repair Tamazight resume migration control</a>. Thanks to xet7.</summary>

Use directly attested native app Resume terminology and align the reviewed
Migration noun. Preserve resumption rather than completion. Migration
adaptation and complete phrase remain low confidence for fluent review.
All 17,872 correction checks pass; 438 original findings remain pending.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b274ed118">Translate Tamazight stop command and migration progress</a>. Thanks to xet7.</summary>

Replace two unflagged French values using native app Stop terminology.
Preserve command versus ongoing progress, plural migrations and ellipsis.
Derived full clause and the reference's Pause/Stop lexical overlap remain
for fluent review. All 17,874 correction checks pass; 438 originals remain
pending. Live browser verification was not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/73bbc6baf">Translate Tamazight structured-data import hints</a>. Thanks to xet7.</summary>

Replace two French hints while preserving Paste your valid data here and
literal CSV/TSV or JSON. Native component evidence supports Here, Data and
Valid; Paste terminology and full phrasing remain low confidence for review.
All 17,876 correction checks pass; 436 original findings remain pending.
Live browser verification was not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/075e8718d">Use attested Tamazight Paste terminology in import hints</a>. Thanks to xet7.</summary>

Replace the tentative Paste verb in two earlier hints with a directly
attested non-fuzzy native Dialect control. Preserve format identifiers and
original French provenance. Full phrases remain low confidence for review.
All 17,876 correction checks pass; counts stay unchanged, with 436 original
findings pending. Live browser verification was not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/aa4732010">Translate Tamazight shortcut list action</a>. Thanks to xet7.</summary>

2026-09-14: Replace Arabic wording using native Dialect shortcut terminology.
Preserve Show this list; complete grammar remains low confidence. All 17,877
correction checks pass, including placeholders and translation preference.
435 original findings remain pending; restored and broader language validation
and live browser checks remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/88af03586">Translate Tamazight autocomplete shortcut labels</a>. Thanks to xet7.</summary>

2026-09-14: Replace two Arabic labels, preserving automatic completion and
emoji/member targets. Native software components support provisional wording;
derived compounds and reused member terminology remain low confidence.
All 17,879 correction checks pass, including placeholders and translation
preference. 433 original findings remain pending; wider language and live
browser validation remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2eb31cb56">Translate Tamazight sidebar and dialog controls</a>. Thanks to xet7.</summary>

2026-09-14: Replace six Arabic/French controls, including three unflagged
values. Preserve Open/Close, Show/Hide and distinct filter/search/board scopes.
Native software attests action verbs; panel/dialog paraphrases and full
compounds remain low confidence. All 17,885 correction checks pass, including
placeholders and translation preference. 430 originals remain pending;
wider language and live browser validation remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/845c624f0">Translate Tamazight membership and assignment shortcuts</a>. Thanks to xet7.</summary>

2026-09-14: Replace four Arabic/French labels, including one unflagged value.
Preserve membership versus assignment, current-card scopes and distinct
filters. Assignment paraphrases, derived forms and full clauses remain low
confidence. All 17,889 correction checks pass, including placeholders and
translation preference. 427 originals remain pending; wider language and
live browser verification remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/11c943dcf">Repair Tamazight account and starred item labels</a>. Thanks to xet7.</summary>

2026-09-14: Repair three unflagged labels: Arabic Create Account and Starred
Boards, plus the incorrect Lists noun. Native software directly attests Create
Account and Lists; full starred compounds remain low confidence. All 17,892
correction checks pass, including placeholders and translation preference.
Original counts unchanged: 427 pending. Wider language and live browser
validation remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3c2b1bbfd">Translate Tamazight time tracking labels</a>. Thanks to xet7.</summary>

2026-09-14: Replace five Arabic/French labels, including three unflagged
values. Preserve spent versus overtime, hours units and card-presence scope.
Native CLDR supplies Hour; derived forms and full time-tracking paraphrases
remain low confidence. All 17,897 correction checks pass, including tokens
and translation preference. 425 originals remain pending; wider language
and live browser verification remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a3fbbc9ba">Translate Tamazight filter controls and status</a>. Thanks to xet7.</summary>

2026-09-14: Replace seven Arabic/French values, including five unflagged
labels. Preserve member versus assignee, negative scopes, Other filters and
active-filter edit instruction. Derived forms, assignment paraphrases and
full clauses remain low confidence. All 17,904 correction checks pass,
including placeholders and translation preference. 423 originals remain
pending; wider language and live browser verification remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3843b82af">Translate Tamazight assigned card permission labels</a>. Thanks to xet7.</summary>

2026-09-14: Replace six French role labels/descriptions. Preserve assigned-only
visibility and distinct Normal editing, Read cannot edit and Comment-only
capabilities. Derived forms, assignment paraphrases and complete clauses
remain low confidence. All 17,910 correction checks pass, including tokens
and translation preference. 417 originals remain pending; wider language
and live browser verification remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/012a78b69">Translate Tamazight assignee labels and card scopes</a>. Thanks to xet7.</summary>

2026-09-14: Replace five French labels, including three unflagged values.
Preserve singular/plural, No assignee and all-cards versus current-card board
scope. Responsibility paraphrases, relative clauses and derived forms remain
low confidence. All 17,915 correction checks pass, including tokens and
translation preference. 415 originals remain pending; wider language and
live browser verification remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0914e764b">Clarify Tamazight assignee filter recipient wording</a>. Thanks to xet7.</summary>

2026-09-14: Refine two earlier filter labels with explicit To whom recipient
wording and feminine card agreement, matching assignee labels. Preserve
No assignee and original French provenance. Full relative grammar and
responsibility paraphrases remain low confidence. All 17,915 correction
checks pass; counts unchanged. Wider language and live browser validation
remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/90e738a83">Translate Tamazight archive controls</a>. Thanks to xet7.</summary>

2026-09-14: Replace nine Arabic/French values, including eight unflagged
labels. Preserve Archive versus Move-to-Archive and all/board/card/list/
selection scopes. Ministry indexed noun evidence is provisional because
direct access timed out; full labels remain low confidence. All 17,924
correction checks pass, including placeholders and translation preference.
414 originals remain pending; wider language and browser validation remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bee9ec474">Corroborate Tamazight archive noun from institutional logo</a>. Thanks to xet7.</summary>

2026-09-14: Directly inspect the native Archives du Maroc logo embedded in a
University Mohammed V press release. Add lexical provenance to nine archive
records; the French body is not native evidence. Institutional-to-kanban
adaptation and full labels remain low confidence. All 17,924 correction
checks pass; no values/counts changed. Wider validation remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a22c15f1c">Translate Tamazight archive status and empty states</a>. Thanks to xet7.</summary>

2026-09-14: Replace seven Arabic/French labels, including three unflagged
values. Preserve board/list/card negative scopes, singular this-board moved
status and the warning that this card's containing list is archived. Derived
forms and full clauses remain low confidence. All 17,931 correction checks
pass, including tokens and translation preference. 410 originals remain
pending; wider language and browser validation remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e6d350b6d">Translate Tamazight archive rule actions and states</a>. Thanks to xet7.</summary>

2026-09-14: Replace seven Arabic/French labels, including four unflagged
values. Preserve Move-to versus Restore-from Archive, card scope and
completed states. Native software attests action verbs; restore adaptation,
passive states and full clauses remain low confidence. All 17,938 correction
checks pass, including tokens and translation preference. 407 originals
remain pending; wider language and browser validation remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bac0f5578">Translate Tamazight archive confirmation and activity</a>. Thanks to xet7.</summary>

2026-09-14: Replace three French/Arabic values, including two unflagged
labels. Preserve confirmation intent, this-board scope, question marks and
exact %s placeholder. Native software supports the confirmation frame;
derived verbs and full clauses remain low confidence. All 17,941 correction
checks pass, including translation preference. 406 originals remain pending;
wider language and browser validation remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/38cd06713">Repair Tamazight archive activity vocabulary</a>. Thanks to xet7.</summary>

2026-09-14: Repair four unflagged archive activities with inherited
Kabyle-leaning vocabulary. Preserve objects, nested locations, completed
movement and exact placeholders. Latin script alone is not treated as an
error. Passive forms, swimlane adaptation and whole clauses remain low
confidence. All 17,945 correction checks pass; original counts unchanged.
Wider language and browser validation remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/185787ca0">Repair Tamazight archive alternative and native controls</a>. Thanks to xet7.</summary>

2026-09-14: Preserve list removal from the board and activity retention in
the archive alternative. Replace inherited Kabyle Save/Search labels with
attested native controls. Assembled archive grammar remains low confidence.
All 17,948 correction checks pass; 405 original findings remain pending,
including 270 Tamazight. Browser verification was not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/64905b0d6">Repair Tamazight archive and restore scope controls</a>. Thanks to xet7.</summary>

2026-09-14: Preserve swimlane movement, all cards in this list, Restore All
and Restore All from Archive. Full phrases and swimlane adaptation remain
low confidence; existing generic Restore alternative retained. All 17,952
correction checks pass; 402 original findings remain pending, including 267
Tamazight. Browser verification was not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d35495882">Repair Tamazight archive visibility and recovery guidance</a>. Thanks to xet7.</summary>

2026-09-14: Preserve post-archive invisibility at the correct list/board,
later restoration through Archive in Board Settings, and activity retention
when archiving a card. Full temporal/negative/passive clauses and provisional
swimlane terminology remain low confidence. All 17,959 correction checks
pass; 395 original findings remain pending, including 260 Tamazight.
Browser verification was not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0f5c6a7da">Repair Tamazight archive states and recovery titles</a>. Thanks to xet7.</summary>

2026-09-14: Repair archive states, recovery destinations, card settings and
search guidance while preserving the backticked placeholder. Predicate itself
unchanged. Full phrases, passive recovery and provisional swimlane terminology
remain low confidence. All 17,966 correction checks pass; 394 original findings
remain pending, including 259 Tamazight. Browser verification was not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/17363c532">Repair Tamazight custom translation controls</a>. Thanks to xet7.</summary>

2026-09-14: Replace five Arabic labels using directly attested non-fuzzy
Translation terminology. Preserve New/Edit/Delete THIS, custom scope and
question mark. String-to-Text adaptation and custom modifier attachment/full
phrases remain low confidence. All 17,971 correction checks pass; 392 original
findings remain pending, including 257 Tamazight. Browser verification unrun.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e612c7e7a">Repair Tamazight translation deletion warning and count</a>. Thanks to xet7.</summary>

2026-09-14: Preserve deletion confirmation, THIS/custom scope, absolute
no-undo warning and count punctuation. Two Arabic findings repaired; derived
Text plural and full grammar remain low confidence. All 17,973 correction
checks pass; 390 original findings remain pending, including 255 Tamazight.
Browser verification was not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8efe26637">Repair Tamazight template labels and save action</a>. Thanks to xet7.</summary>

2026-09-14: Repair seven unflagged template labels using directly attested
Template terminology, including Save as Template previously using Subject.
Preserve Add/Create/Save AS and card/list/board scopes. Plurals and full
phrases remain low confidence. All 17,980 correction checks pass; original
counts unchanged. Browser verification was not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a6e7d0e54">Repair Tamazight template container and copy controls</a>. Thanks to xet7.</summary>

2026-09-14: Preserve container distinction and Copy Template TO MANY Cards
versus Copy Checklist FROM Template. Six French/mixed labels repaired.
Container adaptation, checklist noun and full grammar remain low confidence.
All 17,986 correction checks pass; 387 original findings remain pending,
including 252 Tamazight. Browser verification was not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/423eb1051">Repair Tamazight board duplicate and information labels</a>. Thanks to xet7.</summary>

2026-09-14: Preserve duplicate-THIS confirmation, ALL boards settings and
Board/List/Swimlane information tuple. Four wrong-language labels repaired.
Copy-to-Duplicate adaptation, full phrases and swimlane terminology remain
low confidence. All 17,990 correction checks pass; 385 original findings
remain pending, including 250 Tamazight. Browser verification was not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f9534f366">Repair Tamazight due-time activity text</a>. Thanks to xet7.</summary>

2026-09-14: Preserve new due TIME, When/Where labels, PREVIOUS due value,
four-line layout and exact placeholders. Actor past, deadline compound and
full grammar remain low confidence. All 17,991 correction checks pass; 384
original findings remain pending, including 249 Tamazight. Browser unverified.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7e229b64c">Repair Tamazight starred board and page controls</a>. Thanks to xet7.</summary>

2026-09-14: Preserve star/unstar, THIS board/page, top of YOUR board list and
exact count placeholder in nine labels. Native Top/Page components support
wording; star vocabulary reuse and full phrases remain low confidence.
All 18,000 correction checks pass; 380 original findings remain pending,
including 245 Tamazight. Browser verification was not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/994202232">Repair Tamazight star selection and empty state controls</a>. Thanks to xet7.</summary>

2026-09-14: Preserve SELECTED boards, star/unstar, ALL starred items and
YOU have not starred ANYTHING YET in six unflagged values. Selected passive,
negative grammar and terminology adaptations remain low confidence.
All 18,006 correction checks pass; original counts unchanged.
Browser verification was not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b8d1e0b6e">Repair Tamazight settings navigation and save status</a>. Thanks to xet7.</summary>

2026-09-14: Preserve Team settings, Return/Save distinction and S3 failure
versus completed successful save in five unflagged labels. Derived save noun,
passive agreement and full phrases remain low confidence. All 18,011 correction
checks pass; original counts unchanged. Browser verification was not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/93ffecca2">Repair Tamazight migration resume and error status text</a>. Thanks to xet7.</summary>

2026-09-14: Preserve Resume PAUSED migrations, NO paused items to resume,
completed successful resumption and ALL errors cleared. Four French findings
repaired. Derived passives, migration adaptation and full phrases remain low
confidence. All 18,015 correction checks pass; 376 original findings remain
pending, including 241 Tamazight. Browser verification was not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/496b43423">Repair Tamazight scheduled job labels and status messages</a>. Thanks to xet7.</summary>

2026-09-14: Preserve Add, ACTIVE/plural job scope, Resume versus Start and
failure versus successful completion in seven French labels. Job adaptation
and derived grammar remain low confidence. All 18,022 correction checks pass;
371 original findings remain pending, including 236 Tamazight.
Browser verification was not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f745b5304">Repair Tamazight scheduled job deletion and pause messages</a>. Thanks to xet7.</summary>

2026-09-14: Preserve Delete versus Pause, THIS scheduled job, confirmation
question and failure versus successful completion in five unflagged values.
Job adaptation and derived grammar remain low confidence. All 18,027 correction
checks pass; original counts unchanged. Browser verification was not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/db12dfa7a">Repair Tamazight failed migration retry messages</a>. Thanks to xet7.</summary>

Replace three French values. Preserve FAILED migration scope, Retry versus
Resume, NO failed items to retry and successful retry notification without
asserting that the migration itself succeeded. Native Retry/Failed components
support wording; migration adaptation and derived grammar remain low confidence.
All 18,030 correction checks pass; 368 original findings remain pending,
including 233 Tamazight. Live browser verification was not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a7f5c5c87">Repair Tamazight board selection checkbox instruction</a>. Thanks to xet7.</summary>

Replace French while preserving clicking checkboxes to select boards. Native
checkbox/selection components support wording; compound, plural and full
instruction remain low confidence. All 18,031 correction checks pass;
367 original findings remain pending, including 232 Tamazight. Live browser
verification was not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/51f38c9a0">Repair Tamazight Home navigation label</a>. Thanks to xet7.</summary>

Replace Arabic Home with exact native Tamazight UI wording. Full home-header
Archive restoration instruction remains pending; label evidence does not
establish header/button terminology. All 18,032 correction checks pass;
original counts unchanged. Live browser verification was not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0524017b8">Repair Tamazight board role permission descriptions</a>. Thanks to xet7.</summary>

Replace administrator/normal-member descriptions and Activities label.
Preserve card viewing/editing, member removal, board settings and activity
viewing; normal members cannot change settings. Native components support
wording; full grammar and activity-log adaptation remain low confidence.
All 18,035 correction checks pass; 365 original findings remain pending,
including 230 Tamazight. Live browser verification was not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2842bbc98">Repair Tamazight card mention activity</a>. Thanks to xet7.</summary>

Replace French while preserving mentioned YOU, card/comment/list/swimlane/board
and all five exact placeholders. Indexed mention evidence and full grammar
remain low confidence; the linked PDF redirects to HTML. All 18,036 correction
checks pass; 364 original findings remain pending, including 229 Tamazight.
Live browser verification was not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/48b3fd33d">Repair Tamazight assignee and user search instructions</a>. Thanks to xet7.</summary>

Replace two French values while preserving operator syntax, repeated username
parameter and emphasis. Assignee-only versus member OR assignee scopes remain
distinct. Native Username and local role paraphrases support provisional
wording;
full grammar remains low confidence. All 18,038 correction checks pass;
362 original findings remain pending, including 227 Tamazight. Live browser
verification was not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/30973c6c8">Repair Tamazight organization and team search prose</a>. Thanks to xet7.</summary>

Replace two French descriptions while preserving exact query metasyntax and
cards belonging to a board assigned to the organization/team. Native Given and
local group terms support provisional wording; assignment adaptation and full
grammar remain low confidence. All 18,040 correction checks pass;
360 original findings remain pending, including 225 Tamazight. Live browser
verification was not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d9570ea4d">Repair Tamazight search scopes and archive defaults</a>. Thanks to xet7.</summary>

Replace three French values preserving default archive exclusion, ALL archived
and unarchived cards predicate, and title/description/custom-field scope on
THIS board. Native components support provisional wording; passive/plural and
full grammar remain low confidence. All 18,043 correction checks pass;
357 original findings remain pending, including 222 Tamazight. Live browser
verification was not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/516478676">Repair Tamazight swimlane title search instruction</a>. Thanks to xet7.</summary>

Replace French preserving exact syntax and cards in swimlanes matching specified
title. Native Matching/Title/Given components support provisional wording;
swimlane adaptation and full grammar remain low confidence. All 18,044
correction
checks pass; 356 original findings remain pending, including 221 Tamazight.
Days-ago-or-less findings and live browser verification remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3ed703f5a">Repair Tamazight All search predicate</a>. Thanks to xet7.</summary>

Replace Arabic All predicate with exact native Tamazight, preserving
single-token
query format. Add exact-value and negative whitespace/colon regression checks.
All 18,045 correction checks pass; original audit counts unchanged.
Date-boundary wording and live browser verification remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8114b5a87">Repair Tamazight board watcher explanation</a>. Thanks to xet7.</summary>

Replace French preserving future notification to YOU for ANY change on THIS
board. Native components support provisional wording; derived passive and
full grammar remain low confidence. All 18,046 correction checks pass;
355 original findings remain pending, including 220 Tamazight. Live browser
verification was not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/021a8fe97">Repair Tamazight worker role permission description</a>. Thanks to xet7.</summary>

Replace French preserving ONLY card movement, SELF-assignment and commenting.
Native components support provisional wording; self-assignment adaptation and
full grammar remain low confidence. All 18,047 correction checks pass;
354 original findings remain pending, including 219 Tamazight. Live browser
verification was not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7f4ce0602">Repair Tamazight migration scheduling and resume wording</a>. Thanks to xet7.</summary>

Repair four unflagged labels/statuses preserving Scheduled plural versus
Automatic singular and Resume versus Complete. Native components support
provisional wording; migration adaptation and derived grammar remain low
confidence. All 18,051 correction checks pass; original counts unchanged.
Live browser verification was not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/818852184">Repair Tamazight migration start and pause controls</a>. Thanks to xet7.</summary>

Repair six unflagged values preserving Start/Pause, ALL/singular scope and
failed/completed statuses. Native components support provisional wording;
migration adaptation and derived grammar remain low confidence. Stop stays
distinct and awaits review. All 18,057 correction checks pass; original
counts unchanged. Live browser verification was not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/31b741b52">Repair Tamazight checklist check and uncheck controls</a>. Thanks to xet7.</summary>

Replace three French controls preserving Hide checked items, Check ALL items
OF A LIST and active Uncheck ALL reversal. Native components support provisional
wording; mark nominalization, passive and full grammar remain low confidence.
All 18,060 correction checks pass; 351 original findings remain pending,
including 216 Tamazight. Live browser verification was not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d256aea92">Translation repair: Tamazight notification deletion confirmation.</a></summary>

2026-09-14: Replace French confirmation and align notification terminology.
Preserve all notifications and the unconditional inability to undo. Native
component evidence is recorded; full confirmation and action agreement remain
low confidence. All 18,061 correction checks pass. Audit summary updated;
broader translation validation remains open.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bf88de400">Translation repair: Tamazight permanent board deletion warning.</a></summary>

2026-09-14: Replace French warning. Preserve all lists, cards, labels and
activities, future deletion, inability to recover board contents and no undo.
Native components are recorded; composed grammar remains low confidence. All
18,062 correction checks pass; broader language validation continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2a486083b">Translation repair: Tamazight leave-board membership warning.</a></summary>

2026-09-14: Replace Arabic label and French confirmation. Preserve board-title
placeholder and future removal of the current user from all cards on this board.
Native components are recorded; membership adaptation and full grammar remain
low confidence. All 18,064 correction checks pass; broader language validation
continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/df83b6543">Translation repair: Tamazight board import instructions.</a></summary>

2026-09-14: Repair import instructions and matching Menu/Export Board labels.
Preserve ordered navigation and copying text from the downloaded file. Native
component evidence is recorded; derived morphology and full wording remain low
confidence. All 18,067 correction checks pass; broader validation continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8e8782eaa">Translation repair: Tamazight list-card archive instructions.</a></summary>

2026-09-14: Replace French instructions, preserving all cards of this list
removed from the board and their return via Menu > Archive. Native component
evidence is recorded; full wording remains low confidence. All 18,068 correction
checks pass; broader validation continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e5116be84">Translation repair: Tamazight imported-member user selection.</a></summary>

2026-09-14: Replace French instruction, preserving your existing user to use as
this member. Native component evidence recorded; derived existence and full
wording remain low confidence. All 18,069 correction checks pass; broader
validation continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6600574f5">Translation repair: Tamazight checklist uncompletion activities.</a></summary>

2026-09-14: Replace two wrong-language activities, preserving active undoing of
completion and exact percent placeholders. Native Undo evidence recorded;
derived morphology and full wording remain low confidence. All 18,071 correction
checks pass; broader validation continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2b685ef72">Translation repair: Tamazight card checklist completion activity.</a></summary>

2026-09-14: Repair unflagged Kabyle-seeded wording, preserving active completion
and all five exact location placeholders. Native completion evidence recorded;
full grammar remains low confidence. All 18,072 correction checks pass; broader
validation continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d54c1674a">Translation repair: Tamazight imported-board member mapping.</a></summary>

2026-09-14: Replace French instruction, preserving some members on your imported
board and mapping selected members to your users. Native component evidence
recorded; full grammar remains low confidence. All 18,073 correction checks
pass; broader validation continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2dba93923">Translation repair: Tamazight unmapped-member fallback.</a></summary>

2026-09-14: Preserve future assignment of unmapped members to current user.
Native components recorded; full wording remains low confidence.
All 18,074 correction checks pass; broader validation continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4f7d7b69c">Translation refinement: Tamazight imported-board agreement.</a></summary>

2026-09-14: Refine feminine Board relative agreement, preserving provenance
and counts. Derived passive and full wording remain low confidence.
All 18,074 correction checks pass; broader validation continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/945363441">Translation repair: Tamazight subtask deposit destination.</a></summary>

2026-09-14: Preserve hierarchical subtasks and this-board destination.
Indexed native Place evidence recorded; full wording remains low confidence.
All 18,075 correction checks pass; broader validation continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/32125b979">Translation repair: Tamazight checked-item activities.</a></summary>

2026-09-14: Preserve active checking and exact percent placeholders.
Native checkbox terminology recorded; full wording remains low confidence.
All 18,077 correction checks pass; broader validation continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b18cfb5d4">Translation repair: Tamazight unchecked-item activities.</a></summary>

2026-09-14: Preserve active checkmark removal and exact percent placeholders.
Native components recorded; mark noun and full wording remain low confidence.
All 18,079 correction checks pass; broader validation continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/120dff310">Translation repair: Tamazight import activity.</a></summary>

2026-09-14: Preserve import object, destination, source and placeholders.
Native import noun recorded; full wording remains low confidence.
All 18,080 correction checks pass; broader validation continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fbf2ac111">Translation repair: Tamazight custom-field activity.</a></summary>

2026-09-14: Preserve field name to value assignment and exact placeholders.
Native components recorded; full wording remains low confidence.
All 18,081 correction checks pass; broader validation continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9659de171">Translation repair: Tamazight custom-field unsetting.</a></summary>

2026-09-14: Preserve card field value removal and exact placeholders.
Native components recorded; technical Value wording remains low confidence.
All 18,082 correction checks pass; broader validation continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d8cdf1d12">Translation repair: Tamazight lockout duration.</a></summary>

2026-09-14: Preserve lockout period in seconds, distinct from failure window.
Native components recorded; full wording remains low confidence.
All 18,083 correction checks pass; broader validation continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4cc989bd5">Translation repair: Tamazight lockout failure threshold.</a></summary>

2026-09-14: Preserve failures before lockout as count threshold.
Indexed native Before recorded; full wording remains low confidence.
All 18,084 correction checks pass; broader validation continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/beac93aae">Translation repair: Tamazight failure counting window.</a></summary>

2026-09-14: Preserve failure window in seconds and distinct lockout scope.
Native components recorded; full adaptations remain low confidence.
All 18,085 correction checks pass; broader validation continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0108c2193">Translation repair: Tamazight custom-field deletion warning.</a></summary>

2026-09-14: Preserve no undo, all-card removal and history destruction.
Native components recorded; full wording remains low confidence.
All 18,086 correction checks pass; broader validation continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2192b0428">Translation refinement: Tamazight field history deletion.</a></summary>

2026-09-14: Clarify that field history is deleted with a repeated predicate.
Preserve no undo and all-card removal; full grammar remains low confidence.
All 18,086 correction checks pass; counts unchanged and validation continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/34fa863e5">Translation repair: Tamazight checked-item visibility.</a></summary>

2026-09-14: Replace Arabic Hide Checked Checklist Items, preserving checked
items only. Native Hide and Check support components; derived passive plural
and full grammar remain low confidence. All 18,087 correction checks pass.
328 original findings remain pending; broader validation continues.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e79e80afd">Translation refinement: Tamazight Hide All command.</a></summary>

2026-09-14: Replace derived Hide with directly attested native command.
Preserve ALL scope and original provenance; checklist phrase remains low
confidence. All 18,087 correction checks pass; progress counts unchanged.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1100ace91">Translation repair: Tamazight permitted file types.</a></summary>

2026-09-14: Replace two Arabic labels; retain upload versus avatar scope
and colons. Native vocabulary supports components; plural forms and full
permission constructions remain low confidence. All 18,089 correction
checks pass; 326 original findings remain pending.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/87836f6b5">Translation repairs: Tamazight upload statuses and file plurals.</a></summary>

2026-09-14: Replace three French upload statuses and refine two earlier
file-type labels using directly attested Files plural. Preserve progress
versus failure and upload versus avatar scope; full adaptations remain low
confidence. All 18,092 correction checks pass; 326 findings remain pending.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/00a9fd000">Translation repair: Tamazight workspace deletion confirmation.</a></summary>

2026-09-14: Replace French checkbox text, preserving confirmation action
and workspace deletion scope. Native Verify and Deletion support components;
full phrase and workspace adaptation remain low confidence. All 18,093
correction checks pass; 325 original findings remain pending.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b80086e9f">Translation repair: Tamazight workspace icon.</a></summary>

2026-09-14: Replace French label, preserving markdown. Inspected CNAM Icon
is a starred cross-variety proposal, not normative Moroccan evidence.
Reuse existing terms; full wording remains low confidence. All 18,094
correction checks pass; 324 original findings remain pending.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f87013a7a">Translation repair: Tamazight format placeholder instruction.</a></summary>

2026-09-14: Replace French help with in-place-of-value paraphrase, preserving
%{value} exactly and substitution meaning. Format evidence remains indexed
only; bound forms and full instruction remain low confidence. All 18,095
correction checks pass; 323 original findings remain pending.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2b9ecc10c">Translation repair: Tamazight separator space instruction.</a></summary>

2026-09-14: Replace French help, preserving literal HTML space entities and
OR. Inspected dictionary candidates are cross-variety; full instruction
remains low confidence. All 18,096 correction checks pass; 322 original
findings remain pending.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/333250c88">Translation refinement: Tamazight Value bound form.</a></summary>

2026-09-14: Replace derived uzal with indexed IRCAM wazal Value paradigm.
Preserve placeholder and substitution meaning; direct PDF remains
uninspected and full instruction low confidence. All 18,096 correction
checks pass; original progress counts unchanged.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/199da3581">Translation repairs: Tamazight clipboard copy actions.</a></summary>

2026-09-14: Replace French/Arabic copy labels, preserving Text versus Card
Link and clipboard destination. Inspected Clipboard candidate is a Kabyle
metaphor; full adaptations remain low confidence. All 18,098 correction
checks pass; 320 original findings remain pending.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5f7347316">Translation repair: Tamazight clipboard or drag/drop.</a></summary>

2026-09-14: Replace French label; retain OR between methods and AND within
Drag/Drop. Dictionary and indexed components support wording; full software
adaptation remains low confidence. All 18,099 correction checks pass;
319 original findings remain pending.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3534bed86">Translation repair: Tamazight board-icon instructions.</a></summary>

2026-09-14: Replace French help, retaining drag/drop to reorder icons and
click to open their board. Native Click/Change and existing dictionary
components support wording; full instruction remains low confidence.
All 18,100 correction checks pass; 318 original findings remain pending.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c97b1d06b">Translate Tamazight board structure analysis command</a>. Thanks to xet7.</summary>

Replace the French command using directly inspected dictionary letters,
preserving Analyze, Structure and Board. Cross-variety terminology,
Tifinagh adaptation and complete grammar remain low confidence pending
native review. All 18,105 correction checks pass; live browser verification
was not run. The audit now has 314 pending original findings.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/883527750">Repair wrong-language Tamazight import labels</a>. Thanks to xet7.</summary>

Replace Kter and Arabic import labels, preserving generic Import versus
Import Board. Native terminology supports the root; action noun and full
command remain low confidence pending native review. Two additional repairs
bring the inventory to 18,107 passing correction checks; original pending
counts remain 314. Live browser verification was not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2cb3dad4b">Translate permanent Tamazight board deletion notice</a>. Thanks to xet7.</summary>

Replace the French warning, preserving irreversible deletion and future loss
of all lists, cards and actions associated with this board. Derived agreement
and complete warning remain low confidence pending native review. All 18,108
correction checks pass; 313 original findings remain pending. Live browser
verification was not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9bb6154ee">Use native Tamazight muted and notification labels</a>. Thanks to xet7.</summary>

Repair three additional labels with directly attested native software wording,
aligning existing notification terminology. Board-specific Muted adaptation
and its full warning still need review. All 18,111 correction checks pass;
original pending counts remain 313. Live browser verification was not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/72a70be09">Translate Tamazight zoom controls with reviewed dictionary terms</a>. Thanks to xet7.</summary>

Repair four French controls, preserving zoom direction, level, input command
and literal 50-300% range. One original finding and three additional repairs.
Cross-variety terminology and full phrases remain low confidence pending
native review. All 18,115 correction checks pass; 312 original findings
remain pending. Live browser verification was not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f3fda75a5">Translate Tamazight MongoDB storage engine label</a>. Thanks to xet7.</summary>

Replace the French label with visually inspected Engine and Storage
candidates, preserving MongoDB. Cross-variety terminology, bound form and
full compound remain low confidence pending native review. All 18,116
correction checks pass; 311 original findings remain pending. Live browser
verification was not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dc8d40ad0">Align Tamazight select all controls with native selection terminology</a>. Thanks to xet7.</summary>

Repair four additional controls, preserving Select All versus Unselect All
without deleting content. Native terminology supports the root; derived
commands and complete unselection phrase remain low confidence. All 18,120
correction checks pass; original pending counts remain 311. Live browser
verification was not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/902ff1859">Repair Tamazight board and list selection scopes</a>. Thanks to xet7.</summary>

Repair two additional instructions, preserving Only One Board versus All
Cards In This List, including the omitted All. Derived commands, agreement
and full wording remain low confidence. All 18,122 correction checks pass;
original pending counts remain 311. Live browser verification was not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d0c247094">Repair executable examples in Veps filter help</a>. Thanks to xet7.</summary>

Restore comparison, escaping, quoted field/value and Boolean examples.
Regression coverage checks canonical source examples, rejects the malformed
comparison and confirms the Veps language queue remains open. Finnish prose
still needs full translation; this syntax repair does not count as a completed
language correction. Tests passed; live browser verification was not run.

Follow-up <a href="https://github.com/wekan/wekan/commit/cd563cce5">escape-marker verification</a>
fixes the remaining doubled standalone escape marker and compares all
backslash runs against English. Exact examples and open-language-queue
checks pass; full Veps prose remains pending.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6dd41dd41">Prevent mirror attachment HTTP response crashes</a>. Thanks to xet7.</summary>

Unsupported HTTP statuses and malformed response headers now reject the
attachment download instead of throwing out of the callback and terminating
mirroring. Rejected streams are closed; bodyless responses are drained.
Eleven targeted archive, linked-file and HTTP adapter checks passed,
including negative response cases and successful attachment downloads.
No live remote mirroring was run during verification.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/14d6a8cd1">Repair stale changelog links and preflight reporting</a>. Thanks to xet7.</summary>

Repoint four missing translation commit links to matching local commits.
The checker reports unresolved links without claiming all links resolve;
build-menu callers propagate checker failures and accept unchanged notes.
Shell syntax and changelog regression checks passed. No push was run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/739495cf8">Repair Tamazight page-view permission denial</a></summary>

Replaced the Arabic authorization error with native-source-derived
Tamazight. The complete sentence retains denial of permission to view
this page; combined grammar remains low confidence pending fluent review.
All 18,123 correction records pass verification. On 2026-09-14,
310 original findings remain pending, including 175 Tamazight findings;
restored values and earlier low-confidence wording still require review.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/084d44fab">Repair Tamazight board visibility notices</a></summary>

Replaced Arabic public/private notices, preserving future visibility and
HTML emphasis. Full agreement and construction remain low confidence.
On 2026-09-14, 18,125 records pass structural verification and 309 original
findings remain pending, including 174 Tamazight. Restored and uncertain
values still require review. Added assertions for HTML, script and future state.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9b11c99d9">Repair Tamazight parent-display labels</a></summary>

Replaced French Parent Card and Don't Show Parent labels. Hiding remains
a display choice and does not remove the relationship. Compound grammar
remains low confidence pending fluent review. On 2026-09-14, 18,127 records
pass structural verification and 308 original findings remain pending,
including 173 Tamazight. Restored and uncertain wording still needs review.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/db8421e9b">Repair Tamazight due-date popup title</a></summary>

Replaced the additional Arabic title with the native Change imperative
and existing Due Date label, matching neighboring date popup wording.
All 18,128 correction records pass structural verification. Wider fluent
terminology review remains open; original pending counts are unchanged.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/edfed8176">Repair Tamazight spent-time and sorting controls</a></summary>

Replaced three additional Arabic/French labels, retaining noun-only time
versus Change actions. Native Change and Sorting terms combine with existing
Spent Time wording. Full participle and agreement remain low confidence.
All 18,131 correction records pass structural verification; original pending
counts remain unchanged. Restored and uncertain wording still needs review.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e5d7da30e">Repair Danish heap diagnostic meanings</a></summary>

Preserve peak malloc allocation and bit-pattern overwriting of heap garbage,
using Node documentation. Retained 28 correct restored values unchanged.
All 18,133 correction records pass structural verification; restored and
uncertain wording review remains open.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b91b63c53">Translation repairs: Tamazight authentication labels.</a></summary>

2026-09-14: Replace four French labels, preserving method/type, default and
display distinctions. Authentication candidate is cross-variety; full
adaptations remain low confidence. All 18,104 correction checks pass;
315 original findings remain pending.

Thanks to xet7 !

</details>

**Developer documentation** - Verify the reported build failure.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5f5822f7d">Preserve actionable redacted LDAP bind errors</a></summary>

LDAP login failures retain non-enumerable error names and messages, plus
codes and reasons, through the existing secret sanitizer. This fixes the
empty error diagnostic reported in #6692; the bind failure itself still
needs the actual directory error. Certificate, credential and disabled-log
checks pass, along with encryption, connection-release and REST login tests.
No external directory or live browser login was verified.

Thanks to Nissulya and xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0d6be3198">Use readable datetime directories for build and release logs</a></summary>

Build.sh, build.bat and release tools use operation-specific log directories
with YYYY-MM-DD_HH-MM-SS in local time. Build, mirror, translation-upload,
database conformance and speed-diagnostic paths follow the same format.
Same-second reservations preserve earlier logs. Output and docs reference
the paths written to disk. Record timestamps keep their existing format.
Path, collision, progress, parity, mirror and translation tests pass.
Shell syntax checks pass; native Windows execution remains unverified.

<a href="https://github.com/wekan/wekan/commit/a744eb907">Organization mirror
reports use the same datetime directories</a>, with offline report-path coverage
and corrected remaining documentation examples.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a6f136a8d">Verify the wekan22 build failure is repaired</a>. Thanks to xet7.</summary>

The supplied logs are stored at `.tools/wekan22` and report the missing
Moment import from v11.75. The assignee view already uses the existing native
date formatter, preserving the selected calendar. Six focused Node test
entries pass, and a fresh Meteor 3.6-beta.0 development bundle builds
successfully on Linux arm64. The completed build log is
`.tools/log/build-dev-bundle/2026-09-14/04-25-58/dev.txt`. Native amd64 and
live browser verification remain untested locally.

</details>

Thanks to above GitHub users for their contributions and xet7 for maintaining
WeKan !

# v11.76 2026-09-14 WeKan ® release

**In short:** Fix the **assignee view** build by using WeKan's existing native
date formatter while preserving the selected calendar. The release script
now requires actual **Upcoming release notes** before installing tools or
changing release files, preventing an existing release from being reused
when there is nothing upcoming to publish. **Tamazight translations** repair
email, member, deletion, card-order, permission, sorting and calendar
settings, plus custom-field Enter instructions. Complete composed phrases
still need fluent review.

This release fixes the following build and release behavior:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6f6e78a9a0961ede38d53d0fd8fac4c4b8602cdf">Fix assignee builds and reject releases without Upcoming notes</a>. Thanks to xet7.</summary>

Replace the unresolved Moment import with the existing native date utility,
keeping date output under the member's selected calendar. The Meteor bundle
build passes on Linux arm64. Existing assignee browser tests cover dated
cards; their live browser execution was not run in this verification.

The saved `.tools/wekan22` logs are the v11.75 run with this same missing
Moment import; source already contains the repair above. Repeat assignee,
calendar and release-preflight regressions pass (six Node test entries).
A fresh Meteor 3.6-beta.0 bundle build also passes on Linux arm64; its log is
`.tools/log/build-dev-bundle/2026-09-14/04-25-58/dev.txt`. Live browser
execution and a native amd64 build were not run locally.

Run a read-only changelog preflight before tool installation, hash repair,
version overrides or release mutations. Missing, empty and duplicate
Upcoming sections stop with an explanatory error. Explicit versions still
require notes and rename the Upcoming heading. Focused positive and negative
regressions, calendar display checks and shell syntax checks pass.

</details>

**Translations** - Tamazight labels and command consistency.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bfad1aa76">Translate Tamazight email-change permission</a>. Thanks to xet7.</summary>

Replace Arabic with native permission, change and email components,
preserving the setting's permission meaning. Complete phrase composition
remains low confidence pending fluent review. All 17,388 correction checks
pass; 677 original findings remain pending, including 534 Tamazight.
Restored/unflagged values and wider language validation remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/004796543">Repair Tamazight Subject and current-card member labels</a>. Thanks to xet7.</summary>

Replace Arabic in the generic email Subject label with a directly attested
native noun. Replace French in current-card member scope, preserving all
members of this card at this board. Full genitives and card/board wording
remain low confidence. All 17,390 correction checks pass. One original and
one unflagged value are repaired; 676 originals remain pending, including
533 Tamazight. Restored and wider wording validation remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8682dbae5">Repair Tamazight deletion and member-removal wording</a>. Thanks to xet7.</summary>

Normalize the generic Delete command to native Tifinagh and replace French
in custom-field confirmation and board-member removal activity. Preserve
member/board placeholders and membership removal rather than account
deletion. Full software-field and activity composition remain low confidence.
All 17,393 correction checks pass. Two original and one unflagged value are
repaired; 674 originals remain pending, including 531 Tamazight. Restored
and wider language validation remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e8e35db55">Translate Tamazight card-order commands</a>. Thanks to xet7.</summary>

Replace six French top/bottom labels with consistent first/last list-place
wording. Preserve adding versus moving and the card's own list versus a
selected destination. Rule source confirms minimum/maximum sort semantics.
Full order/genitive composition, card terminology and possessive attachment
remain low confidence. All 17,399 correction checks pass; 668 original
findings remain pending, including 525 Tamazight. Wider validation remains
open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a72de5246">Translate Tamazight bulk-card JSON examples</a>. Thanks to xet7.</summary>

Replace six French sample values, keeping title/description property names,
three-card structure and first/second/last identity. Full card genitives
and derived feminine agreement remain low confidence. All 17,400 correction
checks pass, including JSON parsing and property-name preservation. One
original finding is repaired; 667 remain pending, including 524 Tamazight.
Wider language validation remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1eca0d45b">Translate Tamazight board access requirements</a>. Thanks to xet7.</summary>

Replace French in signed-in-user permission and board-member/admin errors.
Preserve anonymous versus signed-in access and required board membership
versus board administration. Full conjugation, singular role forms and
board genitives remain low confidence. All 17,403 correction checks pass;
664 original findings remain pending, including 521 Tamazight. Restored
and wider language validation remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/07f665ef0">Translate Tamazight comment and read-only permissions</a>. Thanks to xet7.</summary>

Replace Arabic/French in comment-only, no-comment-visibility and read-only
role descriptions. Preserve posting versus viewing comments and explicit
viewing versus editing restrictions. Complete capability conjugations and
permission scope remain low confidence. All 17,406 correction checks pass;
661 original findings remain pending, including 518 Tamazight. Restored
and wider language validation remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e0b706b0a">Translate Tamazight sorting label and diagnostic</a>. Thanks to xet7.</summary>

Replace Arabic/French with native sorting and invalid-value components.
Preserve the single format token and invalid-sort meaning. Complete
diagnostic composition remains low confidence. All 17,408 correction checks
pass. One original and one unflagged value are repaired; 660 originals
remain pending, including 517 Tamazight. Operator/predicate terminology,
restored values and wider language validation remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/62daaf033">Translate Tamazight week and page-display settings</a>. Thanks to xet7.</summary>

Replace Arabic/French in ISO week-of-year display, first-weekday selection
and All Boards page display. Preserve ISO 8601 and distinct setting scopes.
CLDR and MediaWiki support the native components; full genitives and
selection phrases remain low confidence. All 17,411 correction checks pass;
657 original findings remain pending, including 514 Tamazight. Restored
and wider language validation remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e07e742d2">Translate Tamazight custom-field Enter instructions</a>. Thanks to xet7.</summary>

Replace French instructions for adding more options/items with Enter.
Preserve the physical key name and distinct field scopes. Full keyboard
instrumental/plural composition and inherited item terminology remain low
confidence. All 17,413 correction checks pass; 655 original findings remain
pending, including 512 Tamazight. Restored and wider language validation
remain open.

</details>

Translation audit progress as of 2026-09-14: 15,218 original findings are
corrected, 179 are reviewed and retained, 4,058 restored values await
validation, and 626 original findings remain pending across 17 locales,
including 483 Tamazight findings. The ledger contains 17,476 correction
records, including repairs outside the original audit. Regression checks
validate placeholders, rendering and merge behavior; fluency and wider
language validation remain open. See the
<a href="docs/Features/Translations/Audit.md">translation audit</a>.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/93c1fe9ef">Translate Tamazight account creation and existing-account prompts</a>. Thanks to xet7.</summary>

Replace two French values, preserving account creation followed by the
availability of sign-in and the existing-account question with sign-in.
Native MediaWiki supports the components; full capability and affirmative
possession phrasing remains low confidence. All 17,415 correction checks
pass. Restored values and wider language validation remain open; live
browser verification was not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1f3156f93">Repair Tamazight creation-date ordering and export messages</a>. Thanks to xet7.</summary>

Repair ten values, preserving opposite newest/oldest-first ordering, card
versus board export, explicit export restrictions and Excel/PDF names.
Five original findings and four unflagged French values are repaired; one
existing mixed-script correction is refined. Native reference components
support the wording; full noun, ordering and negative capability phrases
remain low confidence. All 17,424 correction checks pass. Wider language
validation and live browser verification remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0f4d5adc3">Repair Tamazight Time, Now and due-date activity values</a>. Thanks to xet7.</summary>

Replace Arabic/French time labels, distinguish Now from today and preserve
updated due-date destination/card placeholder order. Six values are repaired,
including five unflagged problems. Full diagnostics, verb conjugation and
inherited due-date terminology remain low confidence. All 17,430 correction
checks pass; wider language validation and live browser execution remain
open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1c80a78ea">Translate Tamazight creator label and scoped search help</a>. Thanks to xet7.</summary>

Replace French search help and the Arabic Creator label. Preserve member
versus creator scope, board versus list title matching and executable
operator tokens. Four original findings and one unflagged value are
repaired. Full relative clauses, plurals, agreement and possessives remain
low confidence. All 17,435 correction checks pass; wider language validation
and live browser verification remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/50c35f1fb">Translate Tamazight comment and label search help</a>. Thanks to xet7.</summary>

Replace French search instructions and Arabic/French Text/label values.
Preserve comment containment, color-or-name alternatives and expanded and
abbreviated executable operator syntax. Three original findings and two
unflagged values are repaired. Derived nouns, agreement and full search
phrases remain low confidence. All 17,440 correction checks pass; wider
language validation and live browser verification remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/85d88589f">Repair Tamazight status help and validation labels</a>. Thanks to xet7.</summary>

Replace French/Arabic status labels, status search help and invalid date/user
messages. Preserve status choices and executable/format tokens. Seven
values are repaired, including five unflagged problems. Derived nouns,
plurals, agreement and full diagnostics remain low confidence. All 17,447
correction checks pass; wider language validation and live browser
verification remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/105e51ebf">Translate Tamazight visibility and descending-sort search help</a>. Thanks to xet7.</summary>

Replace Arabic visibility labels and French public/private and sorting help.
Preserve board visibility scope, sort alternatives and leading minus syntax.
Three original findings and two unflagged values are repaired. Full phrases,
agreement and prefix terminology adaptation remain low confidence.
All 17,452 correction checks pass; wider language validation and live browser
verification remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e40b678fd">Repair Tamazight operator and expected-number diagnostics</a>. Thanks to xet7.</summary>

Replace French diagnostics and the Arabic Number label. Preserve operator
classification, required versus received numeric value and format tokens.
Two original findings and one unflagged value are repaired. Terminology
adaptation, derived forms and full diagnostics remain low confidence.
All 17,455 correction checks pass; wider language validation remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/44c26d4c9">Translate Tamazight received-time activities</a>. Thanks to xet7.</summary>

Replace two French activity fragments, preserving destination versus previous
time, parentheses and exact placeholders. Reception terminology adaptation
from a mixed-source computing lexicon, bound forms and full phrase composition
remain low confidence. All 17,457 correction checks pass; wider language
validation and live browser verification remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/914360650">Translate Tamazight start and end time messages</a>. Thanks to xet7.</summary>

Replace seven French/Arabic labels and activity fragments: two original
findings and five unflagged values. Preserve start versus end, current versus
previous time and exact placeholders. Native MediaWiki start/expiration
components support the vocabulary; generic calendar adaptation and full
phrase composition remain low confidence. All 17,464 correction checks pass;
wider language validation and live browser verification remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4901ec298">Translate Tamazight custom HTML insertion actions</a>. Thanks to xet7.</summary>

Replace two French actions, preserving literal opening and closing body tags,
HTML identifier and before/after insertion directions. Native MediaWiki
components support the vocabulary; custom qualifier adaptation and full
phrase composition remain low confidence. All 17,466 correction checks pass;
wider language validation and live browser verification remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/289231a7c">Translate Tamazight password-reset and email-verification subjects</a>. Thanks to xet7.</summary>

Replace two French subjects while preserving the site-name placeholder.
Native component terms are attested; full subjects, possessive attachment
and verification verb dialect spelling remain low confidence.
All 17,387 correction checks pass. Two original findings are repaired;
678 originals remain pending, including 535 Tamazight. Wider wording and
mail-failure/success validation remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f85bbbf5b">Translate Tamazight dropdown choices and selected-card-color title</a>. Thanks to xet7.</summary>

Replace three French values. Keep unknown distinct from no selection and
color changes scoped to selected cards. Native component terms are
supported; full phrases, derived noun forms and dropdown-choice sense remain
low confidence. All 17,385 correction checks pass. One original and two
unflagged values are repaired; 680 originals remain pending, including
537 Tamazight. Wider language validation remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/614ba7687">Translate Tamazight field display and card-scope settings</a>. Thanks to xet7.</summary>

Replace four French and Arabic values, preserving new-card versus all-card
scope and full-card field display. Native component terms are supported;
software-field usage, full phrases and derived card forms remain low
confidence. All 17,382 correction checks pass. Three original and one
unflagged value are repaired; 681 originals remain pending, including
538 Tamazight. Wider language validation remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9639aabe3">Translate Tamazight create-edit and date-field labels</a>. Thanks to xet7.</summary>

Replace four Arabic and French values, keeping create-button and popup
wording identical and preserving the date-field distinction. IRCAM attests
the field noun; software-field sense, full phrases and bound date
composition remain low confidence. All 17,378 correction checks pass.
One original and three unflagged values are repaired; 684 originals remain
pending, including 541 Tamazight. Wider language validation remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/520b0d8f8">Repair Tamazight notification controls and unread-comment noun</a>. Thanks to xet7.</summary>

Replace three French controls and the image noun incorrectly used for
unread comments. Preserve opposite read/unread states and comment meaning.
Complete commands and inherited passive-read inflection remain low
confidence. All 17,374 correction checks pass. One original and three
unflagged values are repaired; 685 originals remain pending, including
542 Tamazight. Wider language validation remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b0b3520cc">Repair Tamazight rule labels and actions</a>. Thanks to xet7.</summary>

Repair ten values: one original finding and nine unflagged values. Distinguish
IRCAM rule terminology from regular, preserve singular/plural and board
ownership, and correct the required rule-title prompt. Software adaptation,
full phrases and agreement remain low confidence. All 17,476 correction
checks pass; wider language validation and live browser verification remain
open.

</details>

Thanks to above GitHub users for their contributions and xet7 for maintaining
WeKan !

# v11.75 2026-09-14 WeKan ® release

**In short:** Card and sidebar activity values render Markdown, emojis and
permitted HTML through the shared security-aware viewer. Plain-source and
plain-link settings apply, with existing sanitization and source-URL checks.
Tamazight description, all-users and member labels replace French and Arabic.
The text-editing label removes an extra qualifier. Composed translation
wording and Moroccan checklist terminology still need fluent review.

This release fixes the following activity rendering:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e5937d531">Use the shared viewer for card and sidebar activities</a>. Thanks to xet7.</summary>

Render activity values as Markdown, emojis and permitted HTML using the
existing viewer. Preserve plain-source behavior; sanitize completed activity
sentences and remove their links in plain-link mode. Keep imported source
URL scheme checks and avoid nested rich-title/application anchors.
Focused viewer, activity navigation, source-URL and Jade checks pass.
Browser regressions cover both feeds and all modes; syntax checked, not run
live. No sanitizer permissions or URL schemes were broadened.

</details>

This release adds the following translation improvements:











<details>
<summary><a href="https://github.com/wekan/wekan/commit/8b34511fe">Translate Tamazight member-removal and error-clearing labels</a>. Thanks to xet7.</summary>

Replace four French values with native component wording, including an
attested plural error noun. Preserve member removal rather than account
deletion and error clearing rather than repairing failures. Full commands,
card compounds and software-error usage remain low confidence.
All 17,370 correction checks pass. Three original and one unflagged value
are repaired; 686 originals remain pending, including 543 Tamazight.
Wider language validation remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c60ea35b7">Translate Tamazight member selection and card-list controls</a>. Thanks to xet7.</summary>

Replace three French labels, preserving import-member selection, full-card
list display and a card count for each list. Native component vocabulary is
reference-supported; complete phrases, derived noun forms and kanban card
terminology remain low confidence. All 17,366 correction checks pass.
Three original findings are repaired; 689 remain pending, including 546
Tamazight. Wider language validation remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4f37e7278">Translate Tamazight search-link and board-renaming labels</a>. Thanks to xet7.</summary>

Replace French and Arabic using native MediaWiki components, preserving
search-link purpose and the board target. Complete demonstrative and board
genitive phrases remain low confidence. All 17,363 correction checks pass.
One original and one unflagged value are repaired; 692 originals remain
pending, including 549 Tamazight. Wider language validation remains open.

</details>

Translation audit progress as of 2026-09-14: 15,166 original findings are
corrected, 179 are reviewed and retained, 4,058 restored values await
validation, and 678 original findings remain pending across 17 locales.
Of those pending findings, 535 are Tamazight. Repairs found outside the
original audit are also recorded. Passing regression checks validate
placeholders, rendering and merge behavior; they do not establish fluency.
See <a href="docs/Features/Translations/Audit.md">the translation audit</a>
for the remaining review scope and low-confidence wording.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4ca8e5d1b">Translate Tamazight member labels</a>. Thanks to xet7.</summary>

Replace Arabic and French with a native plural member noun and composed
board-members label, preserving membership scope. Full board phrasing and
kanban terminology remain low confidence. All 17,361 correction checks pass.
One original and one unflagged value are repaired; 693 originals remain
pending, including 550 Tamazight. Broader wording validation remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0b8895ab8">Repair Tamazight text-editing label</a>. Thanks to xet7.</summary>

Remove the extra first qualifier from Edit as text using native edit/text
components. Complete phrasing and bound spelling remain low confidence.
All 17,359 correction checks pass. This unflagged repair leaves 694 originals
pending. Candidate checklist control vocabulary is marked Kabyle; Moroccan
checklist wording still needs reference and dialect review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4dd56bc53">Translate Tamazight description and all-users choices</a>. Thanks to xet7.</summary>

Replace French and Arabic using native component terms. The full
more-detailed-description phrase remains low confidence; combined all-users
view usage also needs fluent review. All 17,358 correction checks pass.
One original and one unflagged value are repaired; 694 originals remain
pending, including 551 Tamazight. Broader wording validation remains open.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v11.74 2026-09-14 WeKan ® release

**In short:** Veps board-view labels replace Finnish and Venda values, while
Neapolitan rule-item labels and examples use dictionary-attested terminology.
Calendar, list and time labels reuse existing wording. Multiple-board calendars,
current-time actions and comma-separated examples retain their distinctions.
Fulah and Bambara Persian calendar qualifiers use Unicode locale terminology.
The audit records verified repairs and remaining language reviews. A Meteor
skills review documents current safeguards and remaining code improvements.
Mirror tools reject unknown archive hosts and executables, and Windows sync
passes paths directly to Node without a command-shell string.

This release adds the following security hardening:

**Security hardening** - Mirror archive validation and process dispatch.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3a86fc7e3">Harden mirror host checks and Windows command dispatch</a>. Thanks to xet7.</summary>

Review saved scanning alerts 537 and 539. Require exact string archive hosts,
restrict executables and run Windows destinations directly through the
existing Node engine. Preserve literal paths, preview flags and resumable
archives. All 25 focused mirror test entries pass, including lookalike hosts,
metacharacter arguments, failure handling and source-wide dispatch checks.
The reported original substring/shell bypasses were not reproduced; these
are hardening changes. Native Windows and remote CodeQL rescanning remain
unverified. Details are in docs/Security/WeKanSec20.md.

</details>

**Bug fixes** - Search All Boards membership scope.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4c59f0372">Search only boards the logged-in user is an active member of</a>. Thanks to xet7 !</summary>

Public and private boards require active direct board membership in global
search and pagination. Organization, team and domain access alone does not
include a board. Public discovery remains available elsewhere.

Search scope regression checks pass. Added a public-board member/nonmember
browser regression; syntax checked, not run against a live application.

</details>

**Bug fixes** - Language and country flag placement.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c8d17877e">Place country flags inside regional language labels</a>. Thanks to xet7.</summary>

Show the language flag beside its name and the country flag inside regional
parentheses, for example 🇺🇸 English (🇧🇷 Brazil). Reverse visual placement
for RTL interfaces while isolating flags and native names. Preserve all 245
registered locales and existing profile/browser language selection. Registry
and helper checks, lazy-loading checks and all Jade compilation pass. LTR/RTL
browser regressions are syntax-checked; live execution remains pending.

</details>

**Bug fixes** - Board View Settings popup placement and controls.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3b74d2c3c">Keep Board View Settings visible and movable</a>. Thanks to xet7.</summary>

Open the wide settings panel in visible viewport coordinates instead of
clamping it as a narrow sidebar menu. Allow title-bar dragging and bottom-right
resizing, including arrow-key resizing, with viewport limits and interactive
header exclusions. Retain the physical right-hand grip in RTL layouts.
Geometry, pointer and Jade checks pass. Browser coverage is syntax-checked;
live execution remains pending. Document usage in BoardViews/Settings-Popup.md.

</details>

This release fixes the following board-view problems:

**Bug fixes** - Consistent title viewers and assignee dependencies.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/457614a2a">Use security-aware title viewers in timeline and Gantt views</a>. Thanks to xet7.</summary>

Render timeline list/card titles, assignee cards, table group headings,
Bigboard names, original titles and Roadmap headings with the shared viewer.
DHTMLX Gantt task names use formatted, sanitized Markdown and emoji. Frappe
and Roadmap SVG labels use escaped viewer text; popups use formatted HTML.
Honor plain-link and literal-source security settings when charts refresh.
Import FlowRouter and moment explicitly to fix assignee-view ReferenceErrors.
Focused Node tests and all Jade template compilation pass. Nine browser
policy cases were added and syntax-checked; live browser execution remains
unverified. See docs/Features/BoardViews/Title-Rendering.md.

</details>

**Bug fixes** - Report titles and legacy avatar routing.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5ca16f32e">Render cumulative flow and report titles through the shared viewer</a>. Thanks to xet7.</summary>

Use Markdown, emoji and sanitized HTML in report headings and table headers
and cells, including cumulative-flow list titles. Canvas labels retain
viewer text and emoji. Observe plain-link and literal-source policies
before afterFlush so changes refresh the chart. Extend Node guards and add
cumulative-flow browser policy cases; live UI remains unverified.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c2a390928">Restore authenticated CollectionFS avatar fallback in prefix routes</a>. Thanks to xet7.</summary>

The earlier universal avatar handler returned 404 before the narrower legacy
handler could run. Handle authenticated legacy avatars in both prefix
routes, including versioned URLs. Preserve safe headers, close unused
streams on conditional responses and reject anonymous public-board claims.
Missing records or binaries still return 404. The production attachment
404 has not been diagnosed from server data. Focused tests pass; a browser
image test was added and syntax-checked but not run live.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ca8d59978">Cover Control chart heading and card-title policies</a>. Thanks to xet7.</summary>

Confirm Control chart uses the shared report viewer for its heading and
card-title cells. Add completed-card fixtures for all three security modes
and check cumulative-flow headings too. Focused Node checks pass. All 15
board-view browser policy cases are syntax-checked; live UI remains
unverified.

</details>

This release fixes the following mirror problems:

**Bug fixes** - Missing comment parents and mirror log visibility.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b53d81cea">Recover missing mirror comment parents and print final log paths</a>. Thanks to xet7.</summary>

Fetch an issue or pull request referenced by a comment when it is absent from
an earlier paginated inventory. Save responses directly to the archive and
preserve checkpoints when a parent fetch fails. Reuse the existing rate-limited
API client. Print the mirror log path after sync/check menu commands, including
failures, and at shell command exit, preserving the exit status. Offline disk
collection, checkpoint, menu and launcher tests pass; no live remote sync was
run.

</details>

and improves the following Time view rendering:

**Time view** - Security-aware card-title display.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a7b333dad">Cover Time view plain-link security modes</a>. Thanks to xet7.</summary>

The shared viewer also obeys Admin Panel / Problems / Security / Render links
as plain text. When enabled, title links are non-clickable while Markdown
and emojis still render unless all-code plain-text mode is enabled. The
report guard passes; browser tests for both link modes are registered and
syntax-checked, not run live.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dc0855711">Use the shared viewer for Time view card titles</a>. Thanks to xet7.</summary>

Card titles now use the same Markdown and emoji viewer as other view fields.
Admin Panel plain-text security mode still shows the raw title. Keep the
overtime annotation separate. The Time report regression passes; normal
and plain-text browser tests are added and syntax-checked, not run live.

</details>

and fixes the following calendar compatibility problem:

**Calendars** - FullCalendar direction options.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ef12548a9">Use the supported calendar direction option</a>. Thanks to xet7.</summary>

Single-board and multiple-board calendars passed legacy isRTL to FullCalendar
5, producing repeated unknown-option warnings. Pass direction as rtl or ltr
according to the active language. Four focused calendar test entries pass;
RTL/LTR browser checks are added and syntax-checked, but not run live.

</details>

This release fixes the following localized search problem:

**Bug fixes** - Translated overdue search predicates and Veps help.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6b0bf168e">Recognize translated overdue predicates and repair Veps search help</a>. Thanks to xet7.</summary>

Use the existing translated predicate map for due-date overdue searches,
retaining the English alias and rejecting unknown or inappropriate predicates.
Repair two Finnish help explanations and an unflagged Finnish overdue keyword
in Veps. Preserve placeholders, examples, quoted names and date bounds.
All 17,205 correction checks and actual Query regressions pass. A browser
regression is added and syntax-checked; live execution remains pending.
Composed grammar and the overdue terminology adaptation need fluent review.
The audit records 749 pending original findings and wider unfinished validation.

</details>

This release adds the following translation improvements:

**Translations** - Locale wording repairs and remaining audit progress.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9c2d625d5">Translate Tamazight missing and weekly due-date filters</a>. Thanks to xet7.</summary>

Replace three French/Arabic labels, preserving no-date and separate
calendar-week scopes. Native components support the repairs; complete
deadline wording, next-week agreement and bound state remain low confidence.
All 17,356 correction checks pass. One original and two unflagged values
are repaired; 695 originals remain pending, including 552 Tamazight.
Broader wording validation remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/47796391a">Translate Tamazight due-date labels</a>. Thanks to xet7.</summary>

Replace three French labels, preserving due-date/completion and
today/tomorrow distinctions. CLDR attests the relative-day names;
complete deadline wording and filter usage remain low confidence.
All 17,353 correction checks pass. One original and two unflagged values
are repaired; 696 originals remain pending, including 553 Tamazight.
Broader wording validation remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/66cba71ec">Translate Tamazight avatar controls</a>. Thanks to xet7.</summary>

Replace Arabic and French while preserving profile-picture scope and the
confirmation question. Native component terms support the repairs; full
compounds, bound state and demonstrative placement remain low confidence.
All 17,350 correction checks pass. One original and one unflagged value
are repaired; 697 originals remain pending, including 554 Tamazight.
Broader wording validation remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f25f84ade">Translate Tamazight filtering and empty locked-user status</a>. Thanks to xet7.</summary>

Replace two French values, preserving cards-or-lists scope and the
current-time qualifier. Native component terms support the repairs;
full phrases, card plural and login-lockout usage remain low confidence.
All 17,348 correction checks pass. Original progress: 15,146 corrected,
698 pending, including 555 Tamazight. Broader validation remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5ce0c18aa">Translate Tamazight title-filter labels</a>. Thanks to xet7.</summary>

Replace three French labels, preserving list-title/card-title scope and
command/heading distinctions. Native component terms support the changes;
full phrasing, card bound state and filter-noun morphology remain low
confidence for fluent review. All 17,346 correction checks pass.
Original progress: 15,144 corrected, 700 pending, including 557 Tamazight.
Restored/unflagged translations and broader wording validation remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c718b0ebe">Translate Tamazight minicard list visibility</a>. Thanks to xet7.</summary>

Replace three French controls, preserving show/hide and singular/plural
list distinctions. Reuse native component terms and record full minicard
phrases as low confidence for fluent review. All 17,343 correction checks
pass. Original progress is 15,141 corrected and 703 pending, including
560 Tamazight. Broader wording validation remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/506a188a2">Translate Tamazight description and minicard controls</a>. Thanks to xet7.</summary>

Replace three French/Arabic values using native description/show terms and
consistent minicard wording. Record full on-minicard phrases as low confidence
for fluent review. All 17,340 correction checks pass. Two originals and one
unflagged value are repaired; progress is 15,138 corrected and 706 pending,
including 563 Tamazight. Broader wording validation remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/18bbe07e4">Translate Tamazight minicard settings headings consistently</a>. Thanks to xet7.</summary>

Replace two French headings while retaining the minicard distinction.
Record full composition and bound-state morphology as low confidence for
fluent review. All 17,337 correction checks pass. Original progress is
15,136 corrected and 708 pending, including 565 Tamazight. Broader wording
validation remains open; no translations were pushed.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9f0c7828b">Use native Tamazight settings labels</a>. Thanks to xet7.</summary>

Replace two unflagged Arabic Settings and Change Settings values using
native UI terminology. Preserve generic settings meaning. All 17,335
correction checks pass. Original counts remain 710 pending, including
567 Tamazight. Combined command usage and wider wording validation remain
open; no translations were pushed.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/81f487305">Refine Tamazight lockout and confirmation morphology</a>. Thanks to xet7.</summary>

Replace derived plural blocked-user and want/delete question forms in three
previous corrections with native Mastodon wording. Preserve original
before-values and the 17,333-record ledger. All correction checks pass.
Combined filter usage and comment-object substitution still need fluent
review. Original counts remain 710 pending, including 567 Tamazight;
wider restored, unflagged and composed wording validation remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3d190b286">Translate Tamazight loading and wait text</a>. Thanks to xet7.</summary>

Replace French loading text using native loading and wait components.
Pin the historical Mastodon loading source accurately in the correction
ledger; current upstream no longer contains that key. All 17,333 correction
checks pass. Original progress is 15,134 corrected and 710 pending,
including 567 Tamazight. Combined usage and wider validation remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/52c833e18">Translate Tamazight generic failure wording</a>. Thanks to xet7.</summary>

Replace the French generic failure with an attested native error clause.
Do not add an unknown or database-specific cause. All 17,332 correction
checks pass. Original progress is 15,133 corrected and 711 pending,
including 568 Tamazight. Wider wording and fluent usage validation remain
open; no translations were pushed.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/13dc65f61">Use native Tamazight credential-error wording</a>. Thanks to xet7.</summary>

Replace the French invalid-credentials value with an attested native error
sentence. Preserve username-or-password ambiguity; omit the reference's
separate retry instruction. All 17,331 correction checks pass. Original
progress is 15,132 corrected and 712 pending, including 569 Tamazight.
Restored, unflagged and low-confidence wording validation remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/448d33abb">Translate Tamazight date and label criteria</a>. Thanks to xet7.</summary>

Replace three unflagged French/Arabic filter values. Preserve by-date,
by-label and no-label meanings using native component terminology. Record
full compositions and bound-state morphology as low confidence for fluent
review. All 17,330 correction checks pass; original counts remain 713 pending,
including 570 Tamazight. Wider wording validation remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/883fcb85c">Translate Tamazight user display and filter controls</a>. Thanks to xet7.</summary>

Replace three unflagged French/Arabic Show, All Users and Clear filter values
with native UI terms. Preserve the Show colon and singular filter meaning.
All 17,327 correction checks pass, including rendered values, placeholders,
key order and newer correct-language preference. Original counts remain
713 pending, including 570 Tamazight. Composed usage and wider restored,
unflagged and low-confidence wording validation remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ad3a4f2dc">Translate Tamazight deletion confirmation and self-account setting</a>. Thanks to xet7.</summary>

Replace two French values, preserving the comment confirmation/action and
self-account-deletion meaning. Reuse native confirmation, delete, account
and possessive wording; mark full composed phrases low confidence for fluent
review. All 17,324 correction checks pass. Original progress is 15,131
corrected and 713 pending, including 570 Tamazight. Wider validation remains
open; no translations were pushed.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fef3c7e46">Translate Tamazight label removal and comment deletion</a>. Thanks to xet7.</summary>

Replace four unflagged French/Arabic values. Reuse native delete/tag nouns
for label controls and active deletion/comment wording for the activity.
Preserve its placeholder and popup question marker. Full activity phrasing,
default actor form and kanban tag terminology still need fluent review.
All 17,322 correction checks pass. Original counts remain 715 pending,
including 572 Tamazight; wider wording validation remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8fc453f50">Translate Tamazight login-lockout status and filters</a>. Thanks to xet7.</summary>

Replace three French lockout labels with Tamazight. Reuse native login-blocking
wording for the singular status; record composed plural filter inflection as
low confidence pending fluent review. All 17,318 correction checks pass,
including rendering, placeholders, key order and newer translation preference.
Original audit progress: 15,129 corrected and 715 pending, including 572
Tamazight. Restored, unflagged and low-confidence validation remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fe2a8097e">Use native Tamazight attachment metadata labels</a>. Thanks to xet7.</summary>

Replace two unflagged Arabic Size and Type values with Tamazight nouns
attested in native MediaWiki file metadata. Preserve all translation keys
and formatting. All 17,315 correction checks pass, including rendered values,
placeholder inventories, key order and newer correct-language translations.
Original audit counts remain unchanged: 718 pending, including 575 Tamazight.
Restored, unflagged and low-confidence wording validation remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c6ee67cb1">Repair Tamazight label activity text and refine filename wording</a>. Thanks to xet7.</summary>

Replace four French label add/remove activity messages with native tag and
directional wording. Preserve label/card percent placeholders and keep
addition-to-card distinct from removal-from-card. Complete clauses,
active-addition inflection and default actor form remain low confidence
pending fluent review. Refine the earlier filename correction with native
upload-form wording, retaining its original before value. All 17,313
correction/rendering checks pass. The original queue has 718 pending
findings; wider language validation and live UI remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1d4ad977d">Repair Tamazight label/search text and lookup errors</a>. Thanks to xet7.</summary>

Replace Arabic label/create-label/no-results text and French username,
label and label-color lookup errors. Use native tag terminology and the
attested negative-results clause; composed errors/create-label usage and
color/tag morphology remain low confidence pending fluent review. Preserve
percent placeholders and keep missing-color and missing-label meanings
distinct. Three original findings and three unflagged values are repaired.
All 17,309 correction/rendering checks pass. The original queue has 722
pending findings; wider language validation and live UI remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e335ef034">Repair Tamazight password confirmation and recovery text</a>. Thanks to xet7.</summary>

Replace French repeated-password and recovery labels with directly attested
native MediaWiki wording. Compose the required username/password message
from native obligation and credential terms; the complete clause remains
low confidence pending fluent review. One original finding and two
unflagged values are repaired. All 17,303 correction/rendering checks pass,
including placeholders, key order, newer-translation preference and negative
French-text checks. The original queue has 725 pending findings; wider
restored/unflagged/low-confidence validation and live UI remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/acafc7951">Repair Tamazight account creation command and error</a>. Thanks to xet7.</summary>

Use the native create-account command and adapt a native not-created clause
for the user error. Preserve its distinction from duplicate and nonexistent
users. The complete adapted error remains low confidence pending fluent
review. All 17,300 correction checks pass; the original queue has 726 pending
findings. Broader language validation remains unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b5db9509e">Use native Tamazight account-creation failure wording</a>. Thanks to xet7.</summary>

Replace the French failure message with the native MediaWiki clause. Omit
its upstream error-detail suffix because the WeKan source has none. All
17,298 correction checks pass; the original queue has 727 pending findings.
Wider restored, unflagged and low-confidence language validation remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9443ef3ae">Use native Tamazight text and number field labels</a>. Thanks to xet7.</summary>

Replace Arabic field-type labels with native terminology. The text noun is
attested in MediaWiki; the standalone number form and numeric field-type
usage remain low confidence pending fluent review. All 17,297 correction
checks pass. These additional unflagged repairs leave the original 728
pending findings unchanged; wider language validation remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f0d42d57f">Localize Tamazight Persian and Excel export wording</a>. Thanks to xet7.</summary>

Use the CLDR Persian language name in the Jalali label. Replace the French
Excel card-export command with an attested-term composition, preserving the
existing card noun and product name. The full export phrase remains low
confidence pending fluent review. All 17,295 correction checks pass; 728
original findings and wider language validation remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f31ff3c1f">Repair Tamazight user-existence messages</a>. Thanks to xet7.</summary>

Replace French messages with native compositions that distinguish an
existing user from a nonexistent user. Attested vocabulary supports the
components; both complete sentences remain low confidence pending fluent
review. All 17,293 correction checks pass. The original queue has 730
pending findings; broader language validation remains unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ab785976f">Repair native Tamazight file and preview labels</a>. Thanks to xet7.</summary>

Replace thirteen French or Arabic template, file, preview, watch and role
labels with matching native MediaWiki wording. Preserve valid existing
Tamazight alternatives. All 17,291 correction checks pass; these additional
unflagged repairs do not reduce the 732 pending original findings. Broader
language validation and live browser verification remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e56bc53e3">Use native Tamazight invalid-email wording</a>. Thanks to xet7.</summary>

Replace the French email-validation label with the exact native MediaWiki
invalid-email-address message. Correction regressions verify rendering and
source placeholders. The original audit now has 732 pending findings; wider
language validation remains open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b373e0734">Repair Greenlandic Jalali qualifier</a>. Thanks to xet7.</summary>

Localize Persian as persiskisut while retaining Jalali. CLDR marks the name
unconfirmed; fluent technical review remains open. All 17,277 correction
checks pass; 733 original findings and broader linguistic validation remain
unfinished. Live browser verification was not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/669be8895">Record Manx calendar terminology review</a>. Thanks to xet7.</summary>

Record missing CLDR display names and unresolved Coptic/tabular/epoch terms.
Keep composed sighting wording under review. No values changed; all 17,276
correction checks pass. Three Manx originals and wider linguistic validation
remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/114c5d992">Repair Quechua crimson wording</a>. Thanks to xet7.</summary>

Replace unrelated English message wrapper with dictionary-attested adjective
sañi. Its polysemous color range requires dialect/exact-hue review. All
17,276 correction checks pass; 734 original findings, twelve wrappers and
broader linguistic validation remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c149ce516">Repair Quechua sky blue wording</a>. Thanks to xet7.</summary>

Replace unrelated message wrapper with dictionary-attested sky-blue adjective
qhusi, distinct from blue. All 17,275 correction checks pass; 734 original
findings, thirteen palette wrappers and wider linguistic validation remain
unfinished. Pale-turquoise wording requires further research.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f6dd287e0">Repair Quechua orange wording</a>. Thanks to xet7.</summary>

Replace English wrapped in unrelated message wording with dictionary-attested
orange adjective killmu, distinct from yellow. All 17,274 correction checks
pass; 734 original findings, remaining palette wrappers and wider linguistic
validation remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dd2aaa19a">Record Tamazight calendar reference gaps</a>. Thanks to xet7.</summary>

Record provisional CLDR Islamic naming and missing Buddhist/Hijri variant
terminology. No values changed. All 17,273 correction checks pass; 734
original findings and full technical/fluent calendar validation remain
unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9dcd0aaa5">Repair Tamazight upload wording</a>. Thanks to xet7.</summary>

Replace French Upload with the native Upload-file command, distinct from
Download. All 17,273 correction checks pass. This unflagged repair leaves
734 original findings pending; broader linguistic and browser validation
remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ee60f87d2">Repair Tamazight user settings heading</a>. Thanks to xet7.</summary>

Replace French with native preference/user terminology. Full heading grammar
and terminology adaptation remain low confidence. All 17,272 correction
checks pass; 734 original findings and broader linguistic validation remain
unfinished. Live browser verification was not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5babc392f">Repair Tamazight username change label</a>. Thanks to xet7.</summary>

Replace French with native change/username terminology matching the source.
Combined label grammar remains low confidence and needs fluent review. All
17,271 correction checks pass; 735 original findings and wider linguistic
validation remain unfinished. Live browser verification was not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/852beaa44">Repair Tamazight comment deletion prompt</a>. Thanks to xet7.</summary>

Replace French with native delete/comment terminology and question marking.
Full prompt grammar remains low confidence and needs fluent review. All
17,270 correction checks pass; 736 original findings and broader language
validation remain unfinished. Live browser verification was not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0b006e44d">Repair Tamazight removal and filter wording</a>. Thanks to xet7.</summary>

Replace Arabic Remove, Clear-all-filters and user-fallback labels with
matching native UI terms. All 17,269 correction checks pass; these four
unflagged repairs leave 737 original findings pending. Wider linguistic
and live browser validation remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d2923884d">Repair Tamazight collapse and rename wording</a>. Thanks to xet7.</summary>

Replace eleven Arabic collapse, More, comment, rename and action labels with
matching native UI terms. Keep popup titles consistent. All 17,265
correction checks pass; 737 original findings and broader language/browser
validation remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ebee06d86">Repair Tamazight account and date labels</a>. Thanks to xet7.</summary>

Replace twelve Arabic account, date/history, credential, cancel and search
labels with matching native UI terminology. Distinguish Date from History
and login from logout. All 17,254 correction checks pass; 737 original
findings and broader linguistic/browser validation remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b692ef9f4">Repair Tamazight action and error labels</a>. Thanks to xet7.</summary>

Replace Arabic/French Actions, Create, Download and Error labels with exact
native MediaWiki UI terms. All 17,242 correction checks pass; these four
unflagged repairs leave 737 original findings pending. Broader linguistic
validation and live browser verification remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5f3cfb608">Repair Tamazight help and next labels</a>. Thanks to xet7.</summary>

Replace two unflagged French labels with matching native MediaWiki UI terms.
Preserve valid Latin-script wording. All 17,238 correction checks pass;
737 original findings and wider linguistic validation remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0db69cf6c">Record Kashmiri calendar terminology review</a>. Thanks to xet7.</summary>

Record provisional CLDR Islamic/civil names and missing sighting/tabular
variant names. Full epoch qualifiers need further terminology research.
No values changed; all 17,236 correction checks pass and 737 findings remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e07d2be5f">Repair Cherokee Hijri variant wording</a>. Thanks to xet7.</summary>

Replace English Saudi sighting and tabular labels with exact native-script
CLDR core names. Preserve distinct calendar variants. All 17,236 correction
checks pass; Cherokee’s original queue is empty and 737 findings remain
elsewhere. Compact tabular epoch wording needs fluent technical review.
Live browser verification was not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/190fd16a2">Repair Quechua metallic color wording</a>. Thanks to xet7.</summary>

Replace English gold/silver names wrapped in unrelated prose with composed
material-plus-color labels. Record compound grammar and palette adaptation
as low confidence. All 17,234 correction checks pass. Two unflagged repairs
leave 739 original findings pending. Pink/orange and shade wording need review.
Live browser verification was not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/89c0eb466">Repair Quechua gray and purple wording</a>. Thanks to xet7.</summary>

Replace English color names wrapped in unrelated prose with attested Quechua
adjectives. Preserve gray/purple distinctions from blue. All 17,232 correction
checks pass. Two unflagged repairs leave 739 original findings pending.
Silver’s metal-to-color adaptation and remaining palette wording need review.
Live browser verification was not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/158f18152">Repair more Quechua basic color wording</a>. Thanks to xet7.</summary>

Replace English blue/green/yellow names wrapped in unrelated prose with
reference-attested adjectives. Six repaired basic colors remain distinct.
All 17,230 correction checks pass. Three unflagged repairs leave 739 original
findings pending. Orange and remaining shade terminology need further review;
the dictionary’s shared yellow/orange gloss does not distinguish UI colors.
Live browser verification was not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b7b810c1b">Repair Quechua basic color wording</a>. Thanks to xet7.</summary>

Replace English black/red/white names wrapped in unrelated message prose
with dictionary-attested standalone adjectives. All 17,227 correction checks
pass. These three unflagged repairs leave original pending counts unchanged
at 739. Other color wrappers and two Quechua calendar findings need review.
Live browser verification was not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4cd629494">Repair Tamazight notification deletion wording</a>. Thanks to xet7.</summary>

Replace the French action with Tamazight while preserving all-notifications
scope. Reuse existing terminology and reference-supported action/all words.
All 17,224 correction checks pass; 739 original findings remain overall.
Composed wording needs fluent regional and technical review. Read/unread
controls and irreversible confirmation remain unresolved.
Live browser verification was not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/123d7a531">Repair Tamazight core account wording</a>. Thanks to xet7.</summary>

Replace seven Arabic/French values with matching native-script Tamazight
reference messages for account fields, edit, email, login/logout and password
mismatch. One original finding and six unflagged values are repaired.
All 17,223 correction checks pass; 740 original findings remain overall,
including 594 Tamazight findings. Wider language validation remains open.
Live browser verification was not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/02ef178a5">Repair Aromanian indigo wording</a>. Thanks to xet7.</summary>

Use lulachi, explicitly glossed as indigo in a linguistic paper, preserving
lowercase standalone color labeling. All 17,216 correction checks pass.
Aromanian magenta remains pending; 741 original findings remain overall.
Dialect preference and UI palette usage remain under review.
Live browser verification was not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/160e02ae3">Repair Bambara Hebrew-calendar wording</a>. Thanks to xet7.</summary>

Replace the English label using dictionary-attested Jewish terminology and
existing Bambara calendar wording. All 17,215 correction checks pass.
The composed calendar name needs fluent technical review. Four original
Bambara findings and 742 original findings overall remain pending.
Live browser verification was not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2ec5ad0e3">Repair Sakha Saudi sighting-calendar wording</a>. Thanks to xet7.</summary>

Preserve Saudi Arabia and moon-observation qualifiers using native reference
terms. All 17,214 correction checks pass, including distinct calendar variants.
Sakha’s original queue is empty; 743 original findings remain elsewhere.
Moon-observation phrase composition and crescent-sighting adaptation need
fluent technical review. Live browser verification was not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/36f57a4b7">Repair Sakha astronomical-epoch calendar wording</a>. Thanks to xet7.</summary>

Replace English using native astronomy wording and existing table/calendar-era
terms. Preserve tabular and astronomical-epoch qualifiers, distinct from civil.
All 17,213 correction checks pass. CLDR’s Islamic base is provisional, and noun
composition/era-to-epoch adaptation need fluent technical review. The sighting
variant remains unresolved. Original pending findings total 744; live browser
verification was not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bceecefb8">Repair Sakha civil Hijri calendar wording</a>. Thanks to xet7.</summary>

Replace English using CLDR/native-reference calendar, table, civil and era
terms. Preserve tabular and civil-epoch qualifiers. All 17,212 correction checks
pass. The Islamic base is CLDR-provisional; composition and era-to-epoch
adaptation need fluent technical review. Two Sakha variants remain unresolved.
Original pending findings total 745; live browser verification was not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/335a9bcd3">Preserve the astronomical epoch in Tongan calendar wording</a>. Thanks to xet7.</summary>

Refine the existing tabular Hijri label using a dictionary epoch term and
CLDR’s astronomical adjective. Supply the qualifier missing from the provisional
repair while preserving provenance and distinct calendar variants. All 17,211
correction checks pass. The calendar base is CLDR-unconfirmed and the composed
phrase needs fluent review. Original pending findings remain at 746.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/de0d3d821">Use provisional CLDR Tongan tabular Hijri wording</a>. Thanks to xet7.</summary>

Replace the English display name with the exact non-core Tongan CLDR label,
distinct from existing civil and sighting variants. All 17,211 correction checks
pass. CLDR marks this name unconfirmed, and an explicit astronomical-epoch
qualifier still needs language research and fluent review. This is a provisional
repair, not completed linguistic validation. Original pending findings total
746.
Live browser verification was not run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e4e3aa590">Validate Veps zoom imperative morphology</a>. Thanks to xet7.</summary>

Confirm the transitive increase/decrease commands against Veps inflection
tables and distinguish the intransitive forms. Record references per key;
technical screen-zoom usage and keyboard terminology remain open. All 17,210
correction/rendering checks pass. Original pending findings remain at 747.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bc84ca78b">Repair Veps zoom scale and range prompt</a>. Thanks to xet7.</summary>

Replace two Finnish values with dictionary-based scale terminology and existing
Veps prompt wording. Preserve the exact 50-300% range and punctuation.
All 17,210 correction/rendering checks pass. Screen-zoom adaptation of the
map-scale term and prompt inflection need fluent technical review; live browser
verification was not run. Original pending findings decrease to 747.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/85de9ea7d">Repair Veps zoom directions</a>. Thanks to xet7.</summary>

Replace two unflagged Finnish labels with distinct Veps increase/decrease
commands based on dictionary verbs. Preserve zoom handlers and their limits.
All 17,208 correction/rendering checks pass; technical usage and imperative
forms need fluent review. Zoom-level/range labels remain unresolved, and live
browser verification was not run. Original pending findings remain at 748.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/55c197366">Repair Veps MongoDB storage-engine terminology</a>. Thanks to xet7.</summary>

Replace the Finnish label using Veps dictionary words for storage and engine,
preserving the MongoDB name. All 17,206 exact correction/rendering checks pass.
The composed technical label needs fluent review; live browser verification
was not run. There are 748 pending original findings and wider validation
remains
unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a2929974e">Repair Veps recovery labels and migration step names</a>. Thanks to xet7.</summary>

Replace four Finnish labels, preserving per-swimlane and ensure-if-missing
scope. Distinguish lost cards from restored items and retain the recovery
action. All 17,202 correction/rendering checks pass, including tokens, JSON,
key order and newer translations. Expanded ensure clauses and case agreement
need fluent review. Live browser checks were not run. The original queue has
751 pending findings; wider validation remains unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/83361230d">Repair Veps board conversion and migration progress messages</a>. Thanks to xet7.</summary>

Replace four Finnish explanations, preserving one-time scope, continued board
use, performance improvement, brief duration and background continuation after
browser closure. All 17,198 correction/rendering checks pass, including tokens,
JSON, key order and newer translations. Technical performance/structure
clauses need fluent review. Live browser checks were not run. The original
queue has 753 pending findings; wider validation remains unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/08d1f9e9b">Repair Veps duplicate-list safety warnings</a>. Thanks to xet7.</summary>

Replace three Finnish warnings, preserving empty-list AND populated-same-name
duplicate conditions, initial shared-list conversion and redundant-only
removal. Checked the migration source. All 17,194 correction/rendering checks
pass, including tokens, JSON, key order and newer translations. Composed
clauses and case agreement need fluent review. Live browser checks were not
run. The original queue has 757 pending findings; wider validation continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ef7d530e9">Repair Veps migration integrity explanations</a>. Thanks to xet7.</summary>

Replace six Finnish messages, preserving list order, card positions, swimlane
structure, independent migrations and brief duration. All 17,191 correction
and rendering checks pass, including tokens, JSON, key order and newer
translations. Composed purpose clauses and case agreement need fluent review.
Live browser checks were not run. The original queue has 760 pending findings;
restored, unflagged and low-confidence validation remains unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c6eaeb9ce">Repair Veps board-structure migration controls</a>. Thanks to xet7.</summary>

Replace five Finnish values, preserving comprehensive scope, board analysis,
missing/corrupt list alternatives and continuation confirmation. All 17,185
correction/rendering checks pass, including tokens, JSON, key order and newer
translations. Structure borrowing/inflection and absent-list repair clauses
need fluent review. Live browser checks were not run. The original queue has
763 pending findings; restored, unflagged and low-confidence review continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/66cd9b69e">Repair Veps wait-spinner descriptions</a>. Thanks to xet7.</summary>

Replace nine Finnish labels, preserving all eight wait-animation choices
and identifiers. All 17,180 correction/rendering checks pass, including
tokens, JSON, key order and newer translations. Technical cube borrowing
and composed wait-indicator terminology need fluent review. Live browser
checks were not run. The original queue has 767 pending findings; restored,
unflagged and low-confidence validation remains unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/182983fe2">Repair Veps spent-time card and hours labels</a>. Thanks to xet7.</summary>

Replace two Finnish values, preserving the distinction between boards with
tracked-time cards and the hours field. Retain existing hours terminology.
All 17,171 correction/rendering checks pass, including tokens, JSON, key order
and newer translations. The composed time-tracked-card phrase needs fluent
review. Live browser checks were not run. The original queue has 771 pending
findings; restored, unflagged and low-confidence validation continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/27e76175d">Repair Veps device modes and PDF preview fallback</a>. Thanks to xet7.</summary>

Replace four Finnish values, preserving mobile/desktop mode distinctions,
the toggle and alternative download action. Retain the existing download label.
All 17,169 correction/rendering checks pass, including tokens, JSON, key order
and newer translations. Composed mobile-device terminology and PDF-preview
inflection need fluent review. Live browser checks were not run. The original
queue has 772 pending findings; restored and unflagged validation continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2c1b453ed">Repair Veps announcement and repository controls</a>. Thanks to xet7.</summary>

Replace ten Finnish values, preserving system-wide and administrator
announcements, create/upload/update/sign-in actions and the existing technical
repository noun. All 17,165 correction/rendering checks pass, including tokens,
JSON, key order and newer translations. Repository inflection and the
system-wide qualifier need fluent review. Live browser checks were not run.
The original queue has 774 pending findings; wider validation continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c0bd1cecb">Repair Veps remaining-time label and assigned-card pronoun</a>. Thanks to xet7.</summary>

Replace the Finnish remaining-time label and refine an earlier shortcut
correction from assigned to you to assigned to me. Preserve distinct own-card
and self-assignment actions and the original correction-ledger before-value.
All 17,155 correction/rendering checks pass, preserving tokens, JSON,
key order and newer translations. Timing participle composition needs fluent
review. Live browser checks were not run; 777 original findings remain pending.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/db9a1e001">Repair Veps drag instructions and sidebar controls</a>. Thanks to xet7.</summary>

Replace eight Finnish/Venda instructions, preserving click, drag, drop,
resize, opening and closing distinctions and workspace placeholders.
All 17,154 correction/rendering checks pass, including tokens, JSON,
key order and newer translations. Icon inflection and desktop drag-handle
compounds have low confidence and need fluent review. Live browser checks
were not run. The original queue has 778 pending findings; review continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f72f22254">Repair Veps workspace controls and submenu labels</a>. Thanks to xet7.</summary>

Replace 13 Finnish labels with Veps, preserving workspace/subworkspace
names, markdown notation and the existing deletion question. All 17,146
correction and runtime rendering checks pass, including tokens, JSON,
key order and newer translations. Composed subworkspace and technical icon
terms have low confidence and need fluent review. Live browser checks were
not run. The original queue has 782 pending findings; validation continues.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fe8a52076">Repair Veps subtask destination and action controls</a>. Thanks to xet7.</summary>

Replace nine Finnish values with Veps, preserving board/list destinations,
matching-card absence, deletion confirmation and the board placeholder. Retain
the existing subtask heading. Actual rendering and all 17,133 correction checks
pass, including tokens, JSON, key order and newer translations. Composed
destination and matching-card grammar need fluent review. Live browser checks
were not run. The original queue has 783 pending findings, including 46 in
Veps; parent-card terminology and wider validation remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8a1c76264">Repair Veps card mention notification</a>. Thanks to xet7.</summary>

Replace Finnish prose with Veps, preserving five card/comment/list/swimlane/
board placeholders and existing location terminology. Actual substituted
rendering and all 17,124 correction checks pass, including tokens, JSON, key
order and newer translations. Mention adaptation and composed grammar need
fluent review. Live browser checks were not run. The original queue has 785
pending findings, including 48 in Veps; wider validation remains unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/28f37f0ab">Repair Veps wildcard and board-shortcut guidance</a>. Thanks to xet7.</summary>

Replace two Finnish hints with Veps. Explain that empty rule fields match every
possible value and starring adds the board link to the quick-access bar.
Actual rendering and all 17,123 correction checks pass, preserving tokens,
JSON, key order and newer translations. Wildcard grammar and navigation-bar
terminology need fluent review. Live browser checks were not run. The original
queue has 786 pending findings, including 49 in Veps; wider work is unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/60d14076a">Localize Ewe civil Hijri calendar name</a>. Thanks to xet7.</summary>

Replace the English civil-calendar label with Unicode CLDR Ewe terminology.
Actual locale rendering and all 17,121 correction checks pass, including
tokens, JSON, key order and newer correct translations. CLDR marks the name
provisional; native validation remains required. Live browser checks were not
run. The original queue has 788 pending findings, including two in Ewe.
Other calendar variants and wider translation validation remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ff742c414">Localize Persian calendar qualifiers in Fulah and Bambara</a>. Thanks to xet7.</summary>

Use Unicode CLDR Persian language names with existing calendar nouns,
preserving Jalali identity and distinction from Hijri. Actual locale rendering
and all 17,120 correction checks pass, including tokens, JSON, key order and
newer correct translations. Calendar-name composition needs native review;
live browser checks were not run. The original queue has 789 pending findings,
including five each in Fulah and Bambara. Wider validation remains unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/25dbf6409">Repair Veps multi-selection action choice translations</a>. Thanks to xet7.</summary>

Replace four Finnish popup values with Veps, preserving label/member action
choices and member removal from cards. Retain existing assignment and
label-removal wording. Production rendering and all 17,118 correction checks
pass, including tokens, JSON, key order and newer translations. Popup-title
grammar needs fluent review; apparent reversed member handlers need separate
runtime review. Live browser checks were not run for this batch.
The original queue has 791 pending findings; wider validation is unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/62c011b86">Repair Neapolitan rule item label and list example</a>. Thanks to xet7.</summary>

Use dictionary-attested alimento for the item label and comma-separated rule
example, preserving three entries and numeric suffixes. Production rendering
and all 17,114 correction regressions pass, including token, JSON, key-order
and newer-translation checks. Technical checklist usage needs native review;
live browser checks were not run. The original Neapolitan queue is empty,
with 793 findings still pending globally and wider validation unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/19d4abdf7">Repair Veps board-view labels and current-time action</a>. Thanks to xet7.</summary>

Replace nine Finnish or Venda values with Veps. Preserve single and multiple
board calendars, swimlanes, lists, table, time, collapse and current-time
labels. Retain existing calendar/list/time wording and Gantt proper names.
Production rendering and all 17,112 correction regressions pass, preserving
placeholders, JSON, key order and newer correct translations. View-name grammar
and collapse terminology have low confidence and need fluent review. Live
browser checks were not run. The original queue has 794 pending findings.

</details>

This release adds the following developer documentation:

**Developer documentation** - Meteor skills audit and remaining improvements.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ab05c974d">Document Meteor skills review findings and verification limits</a>. Thanks to xet7.</summary>

Record four confirmed search, browser-policy and multi-card popup findings,
publication and permission review candidates, and existing safeguards in
docs/Security/Skills/Audit.md. Seven focused Node test entries pass. Full
builds, live DDP and browser tests remain open for this audit. This entry
documents recommendations; it does not claim application fixes.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.
