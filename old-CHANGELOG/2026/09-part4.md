# WeKan ® 2026-09 releases, part 4

Moved out of [CHANGELOG.md](../../CHANGELOG.md) to keep that
file small enough to open (wekan/wekan#6580). Nothing here has been changed:
a release section is a record, and it reads the same as it did there.

This is part 4 of 6, newest first: [1](09.md), [2](09-part2.md), [3](09-part3.md), 4, [5](09-part5.md), [6](09-part6.md).

Releases per day:

| 2026-09 | Releases |
| --- | --- |
| 11 | 3 |
| 14 | 1 |

# v11.73 2026-09-14 WeKan ® release


**In short:** Members can select one calendar independently of their
interface language, with accessible offline date/time controls and movable,
resizable date popups. On-premise **OAuth2/OIDC** login gains email-domain
restrictions. Local translation repairs preserve placeholders and warning
meanings; the remaining audit has resumed and is tracked under **TODO Later**.
Translation upload tooling and repository mirrors are updated, along with
the Playwright test dependency. Meteor upgrades to 3.6-beta.0 with
Rspack 2.2 and matching Docker metadata. Organization mirrors add configured
namespaces,
linked comment attachments and offline HTML/CSV archives.

This release adds the following calendar and login features:

**Date controls** - one selected calendar and accessible date/time selection.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5057a0a2c1079780f6560369e989d0022c54e53a">Add member-selected calendars and accessible date/time controls</a>. Thanks to mimZD and xet7.</summary>

Member Settings offers Gregorian by default, Jalali and the additional
calendars supported by the browser's built-in Unicode calendar conversion.
Shared date displays, date popups and month views show the selected calendar.
Mouse selection, Tab, arrow keys and month/year navigation select dates
without typing; hour/minute lists select time. Native Date storage and ISO
interchange values are preserved. No runtime dependency or Internet access
is required. The calendar systems documentation explains available choices,
keyboard controls and storage behavior.

Twenty-one related Node suites pass, including positive/negative display,
leap-month and keyboard tests, template compilation and UI font scaling.
Three Playwright browser tests are registered and syntax-checked; the live
Meteor server/database was unavailable, so those tests were not run.
The broader run completed 969 suites with 18 failures before correcting
three affected UI guards and the documentation link. Some new calendar-name
translations remain English placeholders; translation completeness and
unrelated baseline failures are not claimed resolved.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/236676ff53c58baaef0ff9484b727445400c6b79">Show full-width calendars directly in date popups</a>. Thanks to xet7.</summary>

Date popups immediately show the selected calendar, including Gregorian,
and keep the grid visible after selecting a day. The grid spans the popup
width above the time controls. Scoped cell/button sizing prevents calendar
days overflowing narrow cells. Only hour and minute dropdowns are visible;
the combined time value remains hidden for the existing save handlers.
Mouse selection, keyboard navigation and native date storage are preserved.
The calendar systems documentation describes the revised popup behavior.

Eighteen related Node suites pass, covering inline visibility, compact-field
behavior, hidden time values, template compilation, font scaling and docs.
Four Chromium popup/settings tests pass, including Gregorian and Buddhist
layout checks and Jalali keyboard selection with native date/time saving.
The existing month-view browser test fails in its navigation helper because
that helper waits for list columns in a calendar view; it is not counted
among the passing popup checks.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/398d5f42d41f6c0cc49f425ea1703fa4a2d059fc">Fit date controls and add bottom-right popup resizing</a>. Thanks to xet7.</summary>

Remove nested date-form scroll areas, viewport-height caps, excess padding
and margins on calendar buttons. The selected calendar, hour/minute controls,
Save and Delete fit together in the popup. A bottom-right handle resizes it
with a mouse or keyboard arrow keys; pointer capture keeps a drag released
outside from closing it. Content-height and viewport bounds keep controls
reachable. Only unusually short viewports need scrolling in the outer shell.
Update the calendar systems documentation and browser layout regressions.

Eighteen related Node suites pass, including captured dragging, keyboard
resizing, minimum sizes, viewport limits and actual template compilation.
A standalone Chromium smoke check using the source CSS and resize handlers
verifies six-week controls fit at 1280x720 and 390x844, and pointer/keyboard
resizing works without closing the popup. Full-app browser tests are extended
and registered; the local Meteor server became unavailable before validating
the final handle implementation. Earlier native-handle attempts failed the
browser drag test and were replaced with the captured handle.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3988ab5ea">Move date popups from the title bar and theme calendar buttons</a>. Thanks to xet7.</summary>

Drag the date popup title bar to reposition it within the viewport. Calendar
month/year navigation and day buttons use Save's active theme styling.
Pointer capture, viewport limits, unrelated pointers and header control
exclusions have passing regression checks. Calendar control checks pass.
The browser regression is registered and syntax-checked; a live Meteor UI
was unavailable for running it.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9fda12cdd">Combine month and formatted date in the date popup heading</a>. Thanks to xet7.</summary>

The calendar heading shows the month name and the member's formatted date.
The separate Date label and date summary above the calendar are removed.
Calendar selection, heading formatting and empty-date fallback checks pass,
as do popup movement and resize checks. The browser regression was extended
and syntax-checked; the live Meteor UI was unavailable.

</details>

**Login policy** - domain restrictions for the local identity provider.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2fd461fa5582fcdca820cc2dcacaae0e605a66b8">Restrict OAuth2 login by email domain</a>. Thanks to xet7.</summary>

Set `OAUTH2_ALLOWED_EMAIL_DOMAINS` to a comma-separated list of exact domains.
The provider's mapped email is checked before account creation, merging or
board/group membership changes. Existing sessions are not revoked. Unset or
empty configuration preserves current behavior; malformed restrictions deny
sign-in. The implementation uses no new dependencies or Internet lookup and
works with an identity provider hosted on the local network.

Positive and negative tests cover exact matching, malformed input, missing
email and the actual OAuth callback with mocked provider responses. Ten
related Node suites pass. A live identity-provider/browser login was not run.
The roadmap export audit records completed checks and the remaining source
review; the full roadmap implementation remains unfinished.

</details>

and fixes the following regression failures:

**Test runner** - cleanup stops abandoned tests while preserving its launcher.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cb9b689a6">Protect launcher ancestors during EVERYTHING cleanup</a>. Thanks to xet7.</summary>

A shell launching the test runner can include the entire test command in
its arguments. The old process search treated that parent as an abandoned
run and terminated it before any stage started. Exclude the current run's
ancestors before expanding the previous test process trees. The regression
executes the actual cleanup with a synthetic process tree: launcher
ancestors receive no signals, while an unrelated abandoned test is stopped.
Build-script syntax and parity checks pass. The restarted EVERYTHING run
passed the floating-promises guard and is preparing a fresh Meteor bundle;
full matrix verification remains in progress.

</details>

**Browser regressions** - use current dependencies and preserve filter controls.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9e0f75f5a">Refresh browser test dependencies and attachment selectors</a>. Thanks to xet7.</summary>

Validate installed test dependencies against their package manifest before
running Playwright. An existing executable alone could leave an older
Playwright version in use after an update. Cached valid installations are
reused; missing or stale installations are refreshed, and installation
failures propagate. Container temporary files and Node E2E artifacts now
use the repository's ignored .tools/tmp directory. The attachment viewport
regression targets the restored native PDF viewer. Dependency refresh,
Docker routing, shell syntax and build-script parity checks pass; the full
browser rerun remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/51a7f1289">Keep reactive filter clicks inside the sidebar</a>. Thanks to xet7.</summary>

A filter click can replace its row before the document outside-click
handler runs. Consult the original event propagation path so the detached
row retains its sidebar ancestry. Actual outside clicks still close the
panel; inside clicks, right clicks and closed sidebars remain unaffected.
The executable handler regression passes. Browser regressions assert the
selected assignee and excluded cards, enable the linked-card fixture's
sticker and location settings, target the real sign-in fields instead of
the hidden two-factor form, and check the restored PDF and Office viewers.
Browser verification against a newly built bundle remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/FerretDB/commit/b7d3dde8">Propagate FerretDB vet failures</a>. Thanks to xet7.</summary>

FerretDB's test runner previously discarded package-discovery and vet
errors. Fail the stage when either module fails, keep scratch packages
excluded, and still check the integration module after a main-module
failure. Five shell regressions cover successful vet, failures in either
module, failed discovery and empty package lists. They pass; the complete
FerretDB suite remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9c7c14d3f">Use actual selected-calendar month ranges</a>. Thanks to xet7.</summary>

The built-in FullCalendar month duration ignored the selected calendar's
visible range, displaying Gregorian month boundaries with converted day
labels. Use duration-free custom grid and list views with real calendar
month boundaries and shared previous/next navigation. Day and week views
retain their existing intervals. Unit regressions cover Jalali boundaries,
grid/list selection and native week navigation; browser checks cover exact
month boundaries and both month view navigation controls. Browser rerun
against the fresh bundle remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1d3c9b5cc">Exercise visible date controls in browser regressions</a>. Thanks to xet7.</summary>

Calendar tests select dates with year, month and day buttons instead of
trying to type into the hidden native value field. Popup checks require
the directly visible calendar and the hour/minute dropdowns. Fresh-load
sign-in checks target the actual username field instead of a hidden
two-factor input. Browser verification remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/39b3be22e">Seed enabled card section defaults</a>. Thanks to xet7.</summary>

Direct MongoDB browser fixtures bypass schema defaults, hiding stickers,
locations, dependencies and voting controls that normal boards enable.
Include their enabled defaults so these regressions exercise the real
controls. Browser verification remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c667aab27">Share browser dependency validation and timer defaults</a>. Thanks to xet7.</summary>

Node E2E, Playwright Docker runs and browser installation share the
manifest validation helper. Browser fixtures also seed the enabled timer,
text-note and comment-count settings applied to real boards. Dependency,
Docker routing, syntax and build-script parity checks pass; full matrix
verification remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/71b77aeda">Align selected-calendar month grids with the weekday start</a>. Thanks to xet7.</summary>

FullCalendar inferred non-Gregorian month lengths as day ranges and could
place the first date under the wrong weekday. Align the displayed grid to
whole weeks without changing the calendar month's actual boundaries.
Regression coverage exercises 29-, 30- and 31-day months with Sunday,
Monday and Saturday starts, verifies input dates remain unchanged, and
checks the Jalali first day beneath its correct weekday column. The unit
checks pass; browser verification remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/37043149f">Apply selected month views to the multi-board calendar</a>. Thanks to xet7.</summary>

Single-board and multi-board calendars both honor the custom selected-
calendar initial view, avoiding a later Gregorian initial-view override.
Their shared browser regression checks grid and list navigation, exact
month boundaries and weekday placement. Calendar documentation explains
the month-grid behavior and its regression coverage. Browser verification
against a fresh bundle remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3b8436448">Theme calendar controls with Save's existing rules</a>. Thanks to xet7.</summary>

The theme submit-button rules did not match non-submitting calendar
buttons, leaving them a different color from Save. Include the calendar
navigation and day controls in the same existing declarations, including
hover colors and custom accents. Controls retain type="button" so changing
months or selecting a date does not submit the form. Theme regressions
pass. A targeted Chromium run with the updated CSS passed Jalali mouse,
keyboard, time selection and saving; verification of the compiled bundle
across all browsers remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0cf8f1540">Check calendar labels against each browser's supported options</a>. Thanks to xet7.</summary>

Firefox does not implement every Unicode calendar variant offered by
Chromium. Assert translated labels for supported options and assert the
absence of unsupported options instead of requiring unavailable calendars.
All five targeted Firefox calendar-option regressions pass, covering
Latvian, Romanian, German and Brazilian Portuguese. Full browser matrix
verification remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1e328a98d">Copy rendered template cards without schema failures</a>. Thanks to xet7.</summary>

Rendered cards cache their real ID as __id, which schema validation
rejects when it reaches a copied document. Exclude that cache from card,
linked-card and subtask copies, and insert the prepared card document
without changing the source card's ID, placement, labels or custom fields.
Capture the template popup's top/bottom position before search-result
clicks change the Blaze data context. Executable regressions cover
cross-board children, same-board copies, rejected inserts, linked cards
and position capture; ten focused Node suites pass. Re-enable the template
browser regression with unique titles, destination-scoped queries,
source-placement checks and top-order verification. Fresh compiled
browser verification remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8c96ac84f">Render Multi Board Calendar with explicit module imports</a>. Thanks to xet7.</summary>

The event source used Filter and FlowRouter without importing them,
throwing Filter is not defined before the calendar could render.
Import both existing modules. Runtime tests resolve the actual imports
without global fallbacks and exercise membership scope, filtered cards,
card URLs, selected calendar views and subscription readiness. They pass.
The browser month test navigates within the authenticated app and waits
for its calendar, instead of briefly relying on default list controls.
Complete matrix verification remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ddb43f09f">Run both checklist selection close controls</a>. Thanks to xet7.</summary>

The outside-click control opened an independent desktop card popup, but
the close handler is enabled for a card route with currentCard set.
Open that route in both tests so selection genuinely exercises the close
guard, and a plain outside click exercises its opposite. Require the
checklist control instead of silently returning when it is missing.
Both checks pass in a targeted Chromium run; the quarantined control is
registered again. Complete browser matrix verification remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/98d473caf">Find current ARM64 Chrome in Node E2E containers</a>. Thanks to xet7.</summary>

Playwright 1.63.0 names its ARM64 Chrome directory chrome-linux-arm64.
Discover executable Chrome in that directory and the previous Linux and
Linux64 layouts, instead of failing before Node E2E tests can start.
Executable filesystem regressions cover all three layouts and reject
missing browsers, non-executable files and crashpad helpers. They pass;
full Node E2E verification remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ebd45deb1">Own the actual test server processes</a>. Thanks to xet7.</summary>

Background launchers recorded wrapper shells instead of their Node and
MongoDB children. Replace those shells with the server processes using
exec, so recorded PIDs remain valid and cleanup does not orphan servers.
Executable checks launch both real harness fragments against mock
servers and verify recorded and running PIDs match; reused MongoDB remains
unowned. These checks and all 21 build-script parity checks pass.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/236095a4a">Keep shared-list cards scoped during partial-profile loading and impersonation</a>. Thanks to gleneindre and xet7.</summary>

Fixes [#6691](https://github.com/wekan/wekan/issues/6691). Board content and
list selectors share the existing view resolver. Missing or invalid profile
preferences now fall back to the browser preference and Swimlanes without
reloading. A private current-user publication supplies the board-view
preference after admin impersonation without exposing other members’ settings.
The preference uses its own reactive field so competing partial profile
publications cannot hide it.
<a href="https://github.com/wekan/wekan/commit/1c47bcc4a">Await the Meteor 3 identity switch</a> before returning from impersonation; a deferred-promise
test checks that subscriptions finish switching and failures propagate.
Regression tests cover fallback precedence, pending choices, board visibility,
list scoping and publication isolation; the browser test checks shared lists
in two swimlanes before and after impersonation. The real partial-profile and
impersonation browser regression passes in
Chromium, Firefox and WebKit without retries. Full EVERYTHING verification
is running against this change.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c1714d26e">Preserve the filter sidebar during query-only navigation</a>. Thanks to xet7.</summary>

Updating label, member or assignee query parameters reran the board route
and recreated its template, resetting the sidebar to its closed home view.
Keep the board mounted when only its query changes; render normally when
opening another board, closing a card or returning from board rules.
Eight executable route checks cover those boundaries. The browser
regression checks both filter activation and clearing preserve the board
instance and synchronize the URL. The unit checks and a targeted browser
preview pass; fresh compiled matrix verification remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/db6a92336">Fail incomplete database conformance runs</a>. Thanks to xet7.</summary>

A successful comparison of available results could hide a backend that
never started. Treat missing images, registry-inspection errors, startup
failures and catalogue failures as failed coverage, while preserving
explicit skips for CPU-incompatible images and unrequested SAP HANA.
Check the source-build exit status before accepting an existing binary.
Executable regressions cover backend failures, successful supported runs,
comparison failures, missing summaries and stale binaries after a failed
build. All 19 conformance wiring checks pass; the live matrix is pending.

</details>

<details>
<summary><a href="https://github.com/wekan/FerretDB/commit/93c4e734">Register vet error-handling regressions in test-all</a>. Thanks to xet7.</summary>

The complete FerretDB test runner executes the shell vet regression before
running vet on either Go module. All five mocked exit-status scenarios
pass. Live FerretDB verification remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8cfee9383">Move header collapse beside Home</a>. Thanks to xet7.</summary>

The header order is Home, collapse, then the page or board title. The existing
collapse behavior and themed layout remain. Five header suites pass; positive/
negative ordering guards prevent a duplicate control after the title. A browser
regression checks desktop/narrow positioning and that Home and the title remain
visible after collapsing. It syntax-checks and registers; live browser execution
requires a running WeKan server, unavailable locally.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/00073c3f5">Wait for cookie resume and verify voting and board actions</a>. Thanks to xet7.</summary>

The browser login fixture could start a second login before asynchronous
cookie retrieval completed, intermittently losing the published user
profile and selected calendar. Wait for the initial cookie resume and
reuse an authenticated user; explicit token login remains available for
an already-loaded logged-out page. Three executable fixture regressions
cover those paths, and six repeated browser probes retain the profile.
Voting tests require visible controls and persisted votes. Board rename
uses the title in the top header, and the member menu archive test verifies
the archive route and archived board. Six focused Chromium checks pass.
The fresh complete EVERYTHING rerun remains in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9ed2fc540">Prevent navigation when clearing board filters</a>. Thanks to xet7.</summary>

Cancel the header reset link's default navigation before clearing filters.
Firefox otherwise reloads before the query update and restores the old
label filter. Executable handler tests cover both available and missing
sidebars; the browser regression requires the reset control and verifies
the document and board stay mounted while the label query is removed.
Four isolated Firefox probes retain the document and clear the URL when
the default action is prevented. Fresh compiled verification is pending.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2c5d483a7">Keep native cookie sessions working behind a URL prefix</a>. Thanks to xet7.</summary>

Meteor's cookie client requests origin-root endpoints, so a deployment
under a ROOT_URL path could not resume its session. Prefix only the cookie
set, refresh and clear requests, retaining same-origin requests, native
server validation, HttpOnly cookies, memory-only credentials and unchanged
root-deployment methods. Browser fixture navigation retains the configured
base path without duplicating it. Executable regressions cover root and
nested prefixes, missing/invalid cookies, rejected login and offline
requests. The existing URL-prefix color regression will run on a separate
fresh compiled server in all three browsers. Verification is in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d8c3a3bb5">Wait for replacement cookies when switching browser test users</a>. Thanks to xet7.</summary>

A reloaded browser fixture briefly has no user while retrieving its
replacement cookie. Wait for the requested user, instead of treating that
empty state as permission to start another login during navigation.
Six executable fixture scenarios now cover initial resume, existing users,
explicit login, nested base paths and switching users. They pass, along
with the existing session and navigation guards. Fresh live verification
is in progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2f1f1beac">Give template titles sole autofocus and wait for refreshed identity</a>. Thanks to xet7.</summary>

Competing autofocus fields could send a newly typed template title to the
search field in WebKit. Give the title sole autofocus and require the
intended field to retain the text while the search field remains empty.
Refresh tests wait for the exact expected Meteor user in the browser,
which handles client initialization and replacement execution contexts.
The refresh regression passes ten WebKit repetitions without retries.
The first complete EVERYTHING run passes all four stages: 999 Node suites,
527 Meteor server tests, import and Node E2E checks, three browsers,
103 conformance cases on each of four databases and FerretDB unit/vet/
integration. Its two WebKit retries exposed these repaired issues; fresh
compiled verification is in progress.

</details>

**Source and test parity** - preserve current behavior and reject real
regressions.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cc2833cd0">Restore first-user CSS and hide unrequested 2FA prompts</a>. Thanks to xet7.</summary>

Meteor's native CSS module type prevented the existing style loaders from
injecting WeKan's styles after the Rspack upgrade. Override that type for
client CSS. Initialize the 2FA form with a literal native hidden attribute;
only the existing challenge/cancel paths toggle visibility. Empty installations
show styled sign-in and sign-up pages without a code request.
Meteor bundle compilation and four Node test entries pass. Chromium and
Firefox checks pass against an isolated database confirmed to have zero users,
including keyboard focus and visibility after removing the hide class.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8ae15efff">Fix Node suite failures after calendar and translation updates</a>. Thanks to xet7.</summary>

Resolve the reported Node failures by carrying OAuth2 email-domain settings
into every backend Compose reference and the companion Helm values. Keep
calendar profile identifiers in one static runtime array, and teach the
OpenAPI generator to resolve destructured static module imports and parse
Unicode property escapes without executing JavaScript. Generated calendar
enums now match runtime validation instead of being silently omitted.

Date popups use logical initial offsets and clear both logical anchors
before dragging with physical pointer coordinates. The requested resize
grip stays at bottom-right in both directions. Updated archive-date guards
verify the selected-calendar formatter and its import. A
[browser regression](https://github.com/wekan/wekan/commit/c3d87894c)
checks RTL grip placement and title-bar dragging; it is syntax-checked but
was not run against a live Meteor stack.

Retain valid shared translation terms and protect exact reviewed terms
from being overwritten by filling. Restore the native Aragonese numbered
examples that were mistakenly replaced with English, and match the
Galician storage label to its reviewed regional counterpart. Stale wording
and release-menu guards now reflect the current source while preserving
placeholder, HTML, key-order and locale-isolation checks. Sardinian magenta
remains explicitly awaiting language review; global completeness checks
reject every other missing key rather than claiming that review finished.
The wider translation repair task remains paused.

New regression checks exercise actual enum generation, logical-anchor
clearing, locale-specific reviewed values, changed-source rejection and
safe filling. Full verification results are recorded in TODO Later and
the translation audit.

</details>

and updates the Meteor build dependencies:

**Build toolchain** - Meteor 3.6 beta and Rspack 2.2.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9e331e409">Show immediate mirror synchronization progress</a>. Thanks to xet7.</summary>

Mirror synchronization announces source inventory, local archive and destination
stages before starting work. Child stdout and stderr stream to the terminal,
with
elapsed-time messages every 15 seconds during long stages. GitHub requests show
the endpoint, page and retry attempt without exposing authentication headers.
Existing rate-limit waits and bounded retries remain in effect.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5d1f23c89">Save mirror console output to timestamped logs</a>. Thanks to xet7.</summary>

`releases/mirror.sh` prints and saves stdout and stderr to
`.tools/log/mirror/YYYY-MM-DD_HH-MM_SS/mirror-log.txt`, announces the log path
at startup and preserves failed command exit status. Offline regression tests
cover stage announcements, asynchronous failures, heartbeat cleanup, streamed
command status, log contents and timestamped directories. Mirror menu and
rate-limit suites pass; no live synchronization or remote writes were run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/35082f7d7">Upgrade Meteor and Rspack build dependencies</a>. Thanks to xet7.</summary>

Upgrade Meteor 3.5.2 to 3.6-beta.0 and synchronize Docker's Meteor pin.
Commit the corresponding Meteor compiler/package versions and explicit
existing account-package pins. Update @meteorjs/rspack to 3.0.0-beta.1,
Rspack CLI/core to 2.2.0 and rsdoctor to 1.5.9; declare Rspack dev-server
2.2.0 and SWC core 1.15.32 explicitly. The npm lockfile matches both
application and development dependency declarations.

All 1,015 Node suites pass, including request parsing and actual Rspack
compilation. Version consistency tests accept the canonical beta release
and reject stale Meteor/app metadata. Full Meteor bundle verification
remains pending: the local beta tool is still starting before compilation.
This dependency commit does not claim the bundle build or UI tests passed.

</details>

and updates the test dependency:

- [Playwright 1.62.1 → 1.63.0](https://github.com/wekan/wekan/commit/a15b065b56c87f9538ea21cd78a385257e71bfee).
  Updates the browser-test runner and lockfile. Thanks to dependabot.

**Meteor builds** - use the existing Express request parsers.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6cd193879">Fix undeclared body-parser import with Rspack 2</a>. Thanks to xet7.</summary>

Reuse `WebApp.express` JSON and URL-encoded middleware, preserving the
50 MB limit and simple form decoding without adding a dependency.
Rspack 2 no longer supplies the app's undeclared body-parser import.
Seven regressions exercise actual HTTP parsing, malformed/oversized JSON,
compression, token handling and compilation with the installed Rspack.
The website version test permits the canonical Meteor prerelease while
rejecting the specific stale Docker fixture. Both version checks pass
with Docker metadata synchronized to the local Meteor 3.6 beta upgrade.
All 1,015 Node suites pass. The full Meteor bundle remains under
verification; the local tool is still starting before compilation.

</details>

and updates maintainer tooling:

**Maintenance scripts** - explicit translation uploads and repository mirrors.


<details>
<summary><a href="https://github.com/wekan/wekan/commit/7af015a56">Save GitHub mirror data directly to disk and resume after interruption</a>. Thanks to xet7.</summary>

Issues, pulls, comments, reviews and releases are saved as they arrive.
Persistent
page and destination checkpoints resume interrupted synchronization and avoid
holding all source bodies in RAM. Partial inventories preserve unfetched items.
Verification: 38 targeted Node tests and four Chromium/Firefox offline tests
pass,
including interruption, retry, attachment navigation and a bounded-heap fixture.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3fedee2b9">Report completed build logs and fix local release preparation</a>. Thanks to xet7.</summary>

Development and release builds print their log path at completion on shell and
Windows. Local release preparation now makes Meteor's read-only server package
manifest writable before updating node-gyp, matching the release workflow.
Linux arm64 development and release builds pass; the prepared release passes
its startup smoke check and includes Node.js, FerretDB, all eight MongoDB tools
and the launcher. Thirteen targeted test entries pass, including failure
handling and read-only manifest repair. Native Windows execution was
unavailable.
Logs: .tools/log/build-dev-bundle/2026-09-14/00-25-50/dev.txt and
.tools/log/build-release-bundle/2026-09-14/00-28-55/release.txt.
The optional qemu-aarch64-static binary is absent on this host.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5f8f22f8c">Unify shell and Windows logging directories</a>. Thanks to xet7.</summary>

Logging managed by build.sh and build.bat uses operation/YYYY-MM-DD/HH-MM-SS
beneath .tools/log, honoring WEKAN_LOG_ROOT and preserving parent test-run logs.
Builds, dev servers, individual tests and full matrices reserve separate runs;
same-second starts receive numeric suffixes. Windows build commands stream to
stdout and their selected log. Twelve targeted test entries pass; native
Windows execution and full Meteor builds were not rerun for this change.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0fdda91de">Separate build logs by build type, date and time</a>. Thanks to xet7.</summary>

Development bundles stream to stdout and
.tools/log/build-dev-bundle/YYYY-MM-DD/HH-MM-SS/dev.txt. Release bundles use
.tools/log/build-release-bundle/YYYY-MM-DD/HH-MM-SS/release.txt. Every build
gets
a separate directory; same-second runs reserve a numeric suffix. EVERYTHING
also retains its existing run-level log. Extends the
<a href="https://github.com/wekan/wekan/commit/002e6faa7">build-type logging change</a>.
Directory/repeat-run tests and build parity/release checks pass. The maintainer
reported a successful development build before these logging changes.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/df4c049d5">Show dependency resolver commands and captured build output</a>. Thanks to xet7.</summary>

Builds print Node module resolution and captured subprocess stdout/stderr to the
terminal and build log. Preserve command status and callback results. The
preceding
<a href="https://github.com/wekan/wekan/commit/915971a89">build diagnostics change</a>
adds npm verbose output, foreground lifecycle scripts and Meteor profiling.
Verification: 10 targeted build test entries pass. A full Meteor build was not
rerun for these output changes.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9aae0ee30">Show immediate build stages and progress during quiet commands</a>. Thanks to xet7.</summary>

The development bundle build announces dependency/cache removal, Meteor npm
metadata updating, npm installation and compilation before running them.
Quiet stages report elapsed time and process ID every 15 seconds; command
output and stage exit codes stream to the terminal and timestamped build log.
Required cleanup or installation failures stop compilation. Release bundle
preparation uses the same reporting. Offline positive and negative fixtures
verify immediate output, periodic progress and failure propagation; build-menu
parity and release workflow checks pass. A full Meteor build was not rerun
for this change.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fcb7fdaf9">Repair Veps file-storage and invalid-filename guidance</a>. Thanks to xet7.</summary>

Replace five Finnish values with Veps. Preserve avatar storage, writable and
base-directory paths, and cancellation of upload or rename for invalid names.
Retain existing correct attachment-path wording. Production rendering and all
17,103 correction regressions pass, preserving tokens, JSON, key order and
newer correct translations. Base-folder terminology and cancellation grammar
have low confidence and need fluent review. Live browser checks were not run.
The original queue has 795 pending findings; translation repairs continue.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1b5fb61c8">Repair Veps notification read-state controls</a>. Thanks to xet7.</summary>

Replace four Finnish notification values while preserving unread filtering,
marking all read or unread, and deletion of read notifications only. Retain
existing correct unread-comment wording. Production rendering and all 17,098
correction regressions pass, including placeholder, JSON, key-order and newer
translation checks. Unread inflection and composed grammar have low confidence
and need fluent review. Live browser checks were not run for this batch.
The original queue has 798 pending findings; translation repairs continue.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/482458598">Repair Veps Node memory usage labels</a>. Thanks to xet7.</summary>

Replace four Finnish labels with Veps and distinguish resident RAM (RSS),
allocated heap, actual heap use and external memory. Production rendering
and all 17,094 correction regressions pass, preserving placeholders, JSON,
key order and newer correct translations. Composed technical metric grammar
has low confidence and needs fluent review. Live browser checks were not run.
The original queue has 799 pending findings; translation repairs continue.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/181585ce6">Repair Veps archive actions and linked-deletion warnings</a>. Thanks to xet7.</summary>

Replace thirteen Finnish values, resolving three original findings and ten
unflagged errors. Preserve archive destinations, restoration guidance, deletion
order and inbound references; keep the linkedId sentence fragment and existing
correct archive label. Actual rendering and all 17,090 correction regressions
pass. Composed warning grammar and UI terminology need fluent review; live
browser checks were not run. The original queue has 803 pending findings.
Restored and unflagged values still require validation.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d41db1a2c">Repair Veps clipboard and unsaved-description messages</a>. Thanks to xet7.</summary>

Replace seven Finnish values with attested clipboard terminology and preserve
existing correct Veps copy text. Keep image-only pasting, the unsaved condition
before closing and replacement with user changes. Actual localized rendering
and all 17,077 correction regressions pass; live browser checks were not run.
Composed confirmation grammar needs fluent review. The original queue has
806 pending findings; restored/unflagged values still require validation.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3ab93c555">Repair Veps presence and Boolean search instructions</a>. Thanks to xet7.</summary>

Together with <a href="https://github.com/wekan/wekan/commit/2879c1321">presence-search repairs</a>,
replace twelve Finnish values, resolving four original findings and eight
unflagged errors. Keep all eight presence fields, negative searches, working
single-word keywords and ANY versus ALL meanings. Actual Query tests cover
field presence/absence, invalid-field rejection and example grouping; all
17,070 correction regressions pass. Database-result and live browser checks
were not run. Composed Veps grammar remains low confidence and needs review.
The original queue has 813 pending findings; restored/unflagged work remains.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/036ea09e2">Repair Veps board scheduling and cleanup messages</a>. Thanks to xet7.</summary>

Replace sixteen Finnish values, resolving twelve original findings and four
unflagged errors. Distinguish failed scheduling from failed operations and
preserve successful scheduling, coming-soon functionality and job search.
Actual localized rendering and all 17,058 correction regressions pass.
Composed scheduling syntax and backup/archive inflection need fluent review.
The original queue has 817 pending findings; restored and unflagged values
still require validation.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e7b7cc760">Repair Veps heap metric labels and allocation meanings</a>. Thanks to xet7.</summary>

Replace eleven Finnish heap labels, resolving nine original findings and two
unflagged errors. Peak malloc allocation is distinct from erroneous memory;
--zap_code_space indicates debug memory overwriting rather than collection.
Actual localized rendering and all 17,042 correction regressions pass.
Technical compounds and inflection need fluent review. The original queue has
829 pending findings; restored and unflagged values still require validation.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5fbd31006">Repair Veps consent and notification wording</a>. Thanks to xet7.</summary>

Replace eight Finnish values, resolving six original findings and two unflagged
errors. Preserve combined consent text, never-notified state, creator OR member
and automatic/watch subscriptions. All 17,031 exact correction checks and
positive/negative runtime assertions pass. Legal argument case and technical
grammar need fluent review; 838 original findings and restored-value validation
remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e71dd2d4f">Repair Veps starring and automatic-width tooltips</a>. Thanks to xet7.</summary>

Replace six original Finnish findings. Preserve star/unstar actions, starred
boards at the top of the list and opposite automatic-width enable/disable
controls. All 17,023 exact correction checks and positive/negative runtime
assertions pass. Technical grammar needs fluent review; 844 original findings
and restored-value validation remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c2a8c9b2e">Repair Veps monitoring and server-error instructions</a>. Thanks to xet7.</summary>

Replace seven Finnish values, resolving four original findings and three
unflagged errors. Preserve export/refresh failure distinctions, attachment
monitoring and reconnect retry. Snap/Docker command strings remain exact.
All 17,017 exact correction checks and positive/negative runtime assertions
pass. Technical grammar needs fluent review; 850 original findings and
restored-value validation remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/50337aea3">Repair Veps label, status, sort and limit instructions</a>. Thanks to xet7.</summary>

Replace eight Finnish values, resolving five original findings and three
unflagged errors. Preserve matching choices, positive per-page limits and minus
syntax for descending sorting. Localize user shorthand and close unmatched
label-name emphasis. Production Query/runtime tests and all 17,010 exact
correction checks pass. Technical grammar needs fluent review; 854 original
findings and restored-value validation remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/68a54ec5b">Repair Veps date-search, period and case wording</a>. Thanks to xet7.</summary>

Replace twelve Finnish values, resolving four original findings and eight
unflagged errors. Preserve date bounds, signed integers, period placeholders
and case insensitivity. Production Query sort/invalid-operand tests and runtime
period interpolation pass, along with all 17,002 exact correction records.
Technical grammar needs fluent review; 859 original findings and restored-value
validation remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/53775ffba">Repair Veps OS and memory metric labels</a>. Thanks to xet7.</summary>

Replace ten Finnish values, resolving eight original findings and two unflagged
errors. Preserve OS/CPU identifiers, free versus total memory, load average,
CPU count and uptime. All 16,990 exact correction checks and positive/negative
runtime assertions pass. Technical adaptations need fluent review; 863 original
findings and restored-value validation remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fc6c780dc">Repair Veps customization labels and logo direction</a>. Thanks to xet7.</summary>

Replace fifteen original Finnish findings. Correct top-right wording to top
left; preserve image/link distinctions, technical literals, head/link/meta tags
and default height 27. All 16,980 exact correction checks and positive/negative
runtime assertions pass. Technical loans and grammar need fluent review;
871 original findings and restored-value validation remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8002bb139">Repair Veps board confirmations and Excel disk-space warning</a>. Thanks to xet7.</summary>

Replace seven Finnish values, resolving five original findings and two unflagged
errors. Preserve board-title interpolation, removal from every board card,
duplication and insufficient available disk space. All 16,965 exact correction
checks and positive/negative runtime assertions pass. Technical grammar needs
fluent review; 886 original findings and restored-value validation remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/852c7d8ef">Repair Veps export fields and checklist line instructions</a>. Thanks to xet7.</summary>

Replace six Finnish values, resolving five original findings and one unflagged
owner label. Preserve four people roles, board/list/swimlane fields, one
checklist item per text line and original order. All 16,958 exact correction
checks and positive/negative runtime assertions pass. Technical grammar needs
fluent review; 891 original findings and restored-value validation remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/201162037">Repair Veps card copying, sorting and permissions</a>. Thanks to xet7.</summary>

The <a href="https://github.com/wekan/wekan/commit/2d7a83106">nine-value repair</a>
removes originally flagged Finnish text. Preserve JSON title/description fields,
first/second/last examples, checklist-template source, minicard placement and
member permission restrictions. Dictionary review uses nomeran for card numbers.
All 16,952 exact correction checks pass. Technical grammar needs fluent review;
896 original findings and restored-value validation remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1a44f6acc">Repair Veps search validation errors and limit operator</a>. Thanks to xet7.</summary>

Replace eight Finnish values, resolving six original findings and two unflagged
errors. Preserve placeholders and distinct number, sorting, status, existence,
debug and limit meanings. Runtime rendering and positive/negative production
Query limit checks pass, along with all 16,943 exact correction records.
Technical grammar needs fluent review; 905 original findings and restored-value
validation remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/69582cb2c">Repair Veps user, creator and ended-status search wording</a>. Thanks to xet7.</summary>

Replace ten Finnish values, resolving five original findings and five unflagged
errors. Preserve member OR assignee, creator distinction, end-date status and
default archive exclusion. Production Query and runtime tests verify localized
terms and placeholders. All 16,935 exact correction checks pass. Technical
grammar needs fluent review; 911 original findings and restored-value validation
remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1fe3558be">Repair Veps search operators and entity instructions</a>. Thanks to xet7.</summary>

Replace eleven Finnish/mixed-language values, resolving six original findings
and five unflagged errors. Preserve placeholders and member/assigned-user roles.
Production Query tests cover five localized operators and quoted values; use a
single-word assignee operator because spaced names fail. All 16,925 exact
correction checks pass. Technical grammar needs fluent review; 916 original
findings and restored-value validation remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d8b235642">Repair Veps scheduled-job notifications and dictionary inflection</a>. Thanks to xet7.</summary>

Replace eleven Finnish values in the
<a href="https://github.com/wekan/wekan/commit/f64d43aec">scheduled-job repair</a>,
resolving ten original findings and one unflagged error. Preserve active jobs,
deletion confirmation and separate success/failure outcomes for four actions.
Dictionary review corrects radon/radod object forms. All 16,914 exact correction
checks pass. Composed scheduling terminology needs fluent review; 922 original
findings and restored-value validation remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/34708699c">Repair Veps migration steps and browser warning</a>. Thanks to xet7.</summary>

Replace ten Finnish values, resolving one original finding and nine unflagged
errors. Preserve restore targets, validation and the instruction to keep the
browser open while background processing continues and may take longer.
All 16,903 exact correction checks pass. Technical grammar needs fluent review;
932 original findings and restored-value validation remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/782cd2fc7">Repair Veps migration controls and status labels</a>. Thanks to xet7.</summary>

Replace eleven additional unflagged Finnish translations with Veps. Preserve
separate pause, resume and stop actions and consistent status/detail labels.
All 16,893 exact correction records and positive/negative runtime checks pass.
Composed technical wording remains low confidence pending fluent-speaker review.
The original audit still has 933 pending findings; repairs remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a0048dafd">Repair Veps comment labels and searches</a>. Thanks to xet7.</summary>

Repair 11 values, resolving three original findings and eight unflagged errors.
Preserve count placeholders, minicard placement, unread/absent states and role
labels. Actual production Query checks pass for the Veps comment operator with
its apostrophe, quoted multiword searches and rejection of unknown operators.
All 16,882 exact correction/runtime checks pass. There are 933 pending original
findings, including 192 Veps findings. Composed relative-clause/count/case
grammar
is low confidence; fluent-speaker and browser verification remain pending.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3f9517869">Repair Veps permission, login and import-validation errors</a>. Thanks to xet7.</summary>

Repair 16 values, resolving ten original findings and six unflagged errors.
Preserve administrator/member requirements, username OR password errors,
JSON-format/schema distinctions, comma/Tab separators, self-invitation
restrictions and organization-domain ownership. Align invitation-code labels
with existing registration emails. All 16,871 exact correction and positive/
negative runtime checks pass. There are 936 pending original findings,
including 195 Veps findings. Composed import-schema/login-event/domain-ownership
wording and case grammar are low confidence; fluent-speaker and browser
verification remain pending.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/21ca9ac3a">Repair Veps deletion confirmations and loss warnings</a>. Thanks to xet7.</summary>

Repair nine original findings for cards, labels, board contents, accounts,
comments, checklists, checklist items and subtasks. Preserve permanent deletion,
history/activity loss and inability to restore contents or reopen cards.
Positive/negative runtime target and warning checks pass, along with all
16,855 exact correction checks. There are 946 pending original findings,
including 205 Veps findings. Composed board-content wording, account loan
inflection and object grammar are low confidence; fluent-speaker and browser
verification remain pending.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/700147477">Repair Veps board visibility and search predicates</a>. Thanks to xet7.</summary>

Repair 22 values, including eight original findings and 14 related unflagged
errors. Preserve private/public viewing and editing permissions, custom/default
visibility descriptions, localized status predicates, HTML and sign-in URLs.
All 16,846 exact correction and runtime checks pass, including production Query
parsing with the actual locale and rejection of invalid visibility values.
There are 955 pending original findings, including 214 Veps findings.
Composed visibility/search-engine wording and case grammar are low confidence;
fluent-speaker and browser verification remain pending.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c847829da">Repair Veps WIP limits and group controls</a>. Thanks to xet7.</summary>

Replace thirteen Finnish values and mislabeled group controls. Preserve the
maximum task count in this list, strictly higher-than warning, move-out OR
higher-limit remedies, optional names and swimlane selection/application.
All 16,824 corrections and positive/negative runtime rendering and placeholder
checks pass. There are 963 pending original findings, including 222 Veps
findings. Composed grammar needs fluent-speaker review; browser and restored/
unflagged validation remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6cc4055af">Repair Veps migration retry and continuation status</a>. Thanks to xet7.</summary>

Replace nine Finnish values, resolving seven original findings and two related
unflagged errors. Preserve failed-only retries, paused-only continuation,
empty queues, successful action responses, all-error clearing, and errors
versus warnings. Existing native pause/completion/resume values remain
unchanged.
All 16,811 corrections and positive/negative runtime rendering and placeholder
checks pass. There are 966 pending original findings, including 225 Veps
findings. Composed failure-status grammar and plural/case forms need fluent-
speaker review; browser and restored/unflagged validation remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/eef786892">Repair Veps archive and recovery controls</a>. Thanks to xet7.</summary>

Replace twelve Finnish values, resolving eleven original findings and one
related unflagged error. Preserve later recovery and retained activity,
all-archived versus non-archived lost-item scope, exact identifier names,
automatic repair and the warning that recovery cannot easily be undone.
All 16,802 corrections and positive/negative runtime rendering and placeholder
checks pass. There are 973 pending original findings, including 232 Veps
findings. Composed recovery grammar and plural/case forms need fluent-speaker
review; browser and restored/unflagged validation remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9b968a7a6">Repair Veps Webhooks and creation guidance</a>. Thanks to xet7.</summary>

Replace eleven Finnish values, including six related unflagged errors. Preserve
optional authentication, outbound versus two-way/global Webhooks, disabling
rather than deleting, organization/team administrator-contact guidance, and
personal versus assigned-card filtering. All 16,790 corrections and positive/
negative runtime rendering and placeholder checks pass. There are 984 pending
original findings, including 243 Veps findings. Keyboard-shortcut family and
migration structure terminology still need research. Composed grammar,
fluent-speaker, browser and restored/unflagged validation remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1d93c1a86">Repair Veps search and permission warnings</a>. Thanks to xet7.</summary>

Replace four Finnish values. Preserve the Enter key, worker-only movement,
self-assignment and commenting, the unsaved description state, and irreversible
loss of all swimlane actions. All 16,779 corrections and positive/negative
runtime rendering and placeholder checks pass. There are 989 pending original
findings, including 248 Veps findings. Composed grammar requires fluent-speaker
review; browser and restored/unflagged validation remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bd1b57aac">Repair Veps notification and archive help</a>. Thanks to xet7.</summary>

Replace six Finnish values with Veps. Preserve board-wide and creator-or-member
notification scope, signed-in-only support, the archive location in Board
Settings, avatar URL terminology and the exact swimlane-name format token.
All 16,775 correction records and positive/negative runtime rendering and
placeholder checks pass. There are 993 pending original findings, including
252 Veps findings. Composed grammar needs fluent-speaker review; browser and
restored/unflagged validation remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bc06fade8">Repair Veps board attachments and migration controls</a>. Thanks to xet7.</summary>

Replace 20 Finnish values, including four related unflagged controls. Preserve
board/all-attachment scope, filesystem/GridFS/S3 destinations, correct storage
backend and broken-reference repair, avatar/member versus file distinctions,
continue confirmations, administrator-only access and start/pause/stop states.

All 16,769 exact corrections and positive/negative rendering checks pass.
The audit now has 14,845 corrected and 999 pending original findings, including
258 Veps findings. Structure terminology, composed grammar, fluent-speaker
review,
restored/unflagged review and browser verification remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/15547544b">Repair Veps organization and team management</a>. Thanks to xet7.</summary>

Replace 23 Finnish/Venda values, including ten related unflagged controls.
Preserve membership-blocked deletion with at least one user, irreversible entity
deletion versus removal of board assignment, name conflicts, entity counts and
domain-name automatic assignment. Search instructions retain exact operators and
examples with board-assigned-to-entity scope. Correct native organization labels
and counts remain unchanged.

All 16,749 exact corrections and positive/negative rendering checks pass.
The audit now has 14,829 corrected and 1,015 pending original findings,
including
274 Veps findings. Composed organization/assignment grammar and inflections need
fluent-speaker review; restored/unflagged and browser verification remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d67d506b5">Repair Veps card windows, templates and loading guidance</a>. Thanks to xet7.</summary>

Replace 15 Finnish/Venda values, including 11 related unflagged controls.
Preserve
each clicked card's own window versus closing the previous card when disabled,
administrator permissions, refresh-causes-data-loss and server-running guidance,
many-card template copying and separate card/list/board template types.

All 16,726 exact corrections and positive/negative rendering checks pass.
The audit now has 14,816 corrected and 1,028 pending original findings,
including
287 Veps findings. Composed UI grammar and container loan need fluent-speaker
review; restored/unflagged and browser verification remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/67fb504d5">Repair Veps voting, cover and custom-translation controls</a>. Thanks to xet7.</summary>

Replace 27 Finnish or Finnish-derived values, including 13 related unflagged
controls. Preserve vote/poker end-date roles, who-voted-what, irreversible
all-action deletion and custom-string deletion, counts, minicard add/remove
directions and literal OIDC. Poker numbers remain unchanged.

All 16,711 exact corrections and positive/negative rendering checks pass.
The audit now has 14,812 corrected and 1,032 pending original findings,
including
291 Veps findings. Composed terms, planning-poker loan and inflections need
fluent-speaker review; restored/unflagged and browser verification remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b233c7fda">Repair Veps login-protection and lockout settings</a>. Thanks to xet7.</summary>

Replace 14 Finnish values, including eight related unflagged controls. Describe
password-variant checking attacks, preserve excessive failed-login cause,
temporary lockout and retry-later guidance, failure-count window in seconds,
remaining time and only-locked/all-user distinctions.

All 16,684 exact corrections and positive/negative rendering checks pass.
The audit now has 14,798 corrected and 1,046 pending original findings,
including
305 Veps findings. Composed security terminology and inflections need
fluent-speaker review; restored/unflagged and browser verification remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3a4196abb">Repair Veps account emails and notification text</a>. Thanks to xet7.</summary>

Replace 15 Finnish or mixed-language values, including three related unflagged
controls. Preserve collaboration invitations, invitation codes, board names,
literal URLs and line breaks. Distinguish password reset from email
verification,
retain account creation/sign-in and own-account deletion, and keep irreversible
all-notification deletion warnings.

All 16,670 exact corrections and positive/negative interpolation checks pass.
The audit now has 14,792 corrected and 1,052 pending original findings,
including
311 Veps findings. Composed mail/account grammar and inflections need
fluent-speaker review; restored/unflagged and browser verification remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/320a8ae1a">Repair Veps rule trigger fragments and action labels</a>. Thanks to xet7.</summary>

Replace 54 Finnish values, including 51 related unflagged controls. Preserve
trigger subjects, member/assignee distinctions, added/removed and source/
destination directions, archive/restore, completed/incomplete states, all-member
removal and comma-separated three-item examples. Runtime tests check joined
trigger fragments as well as individual labels.

All 16,655 exact corrections and positive/negative runtime rendering checks
pass.
The audit now has 14,780 corrected and 1,064 pending original findings,
including
323 Veps findings. Composed UI grammar and derived participles need
fluent-speaker
review; restored/unflagged review and browser verification remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/627b94378">Repair Veps archive warnings and checklist rules</a>. Thanks to xet7.</summary>

Replace 34 Finnish/Venda values, including 21 related unflagged controls.
Preserve
permanent board-deletion losses, archive visibility context, export permission
negation, Excel/PDF literals, all-versus-one checklist actions and
member-versus-
label removal. Number-key help describes assignment toggles and multi-selection
label addition, retaining 1-9 and consistent multi-selection headings/actions.

All 16,601 exact corrections and positive/negative runtime rendering checks
pass.
The audit now has 14,777 corrected and 1,067 pending original findings,
including
326 Veps findings. Composed technical wording and inflections need
fluent-speaker
review; restored/unflagged review and browser verification remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/40f27e1fd">Repair Veps placement, filters and sidebar controls</a>. Thanks to xet7.</summary>

Replace 23 Finnish/Venda values, including 13 related unflagged controls.
Preserve
card versus swimlane placement above/below, card-or-list filtering, separate
member/assignee/creator filters, field-name display, show/hide toggles and
search
across board titles, descriptions and custom fields. Correct Veps core labels
remain unchanged.

All 16,567 exact corrections and positive/negative runtime rendering checks
pass.
The audit now has 14,764 corrected and 1,080 pending original findings,
including
339 Veps findings. Composed sidebar terminology and inflections need
fluent-speaker review. Restored/unflagged review and browser checks remain open.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/99f4f8f49">Repair Veps display counts and height validation</a>. Thanks to xet7.</summary>

Replace nine Finnish display-setting values with Veps. Keep strict more-than
thresholds, card and attachment counts, per-list scope, pixel units and positive
integer validation. Preserve simultaneous card opening, all-board hidden
activity
scope and the one-line-to-one-checklist-item mapping. All Boards instructions
match the translated navigation label.

All 16,544 exact corrections and positive/negative runtime rendering checks
pass.
The audit now has 14,754 corrected and 1,090 pending original findings,
including
349 Veps findings. Composed terminology and inflections need fluent-speaker
review; restored/unflagged values and browser verification remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/08a24ea92">Repair Veps import guidance and member shortcuts</a>. Thanks to xet7.</summary>

Repair 25 values, resolving 22 original findings. Preserve ZIP attachments,
CSV/TSV separators, existing-user mapping, unmapped-member current-user
fallback, invitation/account states and conditional import-error guidance.
Assignee shortcuts toggle assignment rather than visibility, preserving
1-9 and board-addition order. WeKan navigation instructions match the
translated labels; external Trello interface literals remain intact.
All 16,535 exact corrections and actual rendering/negative semantics
checks pass. Composed technical UI wording needs fluent-speaker review.
Original totals are 14,745 corrected and 1,099 pending, including 358 Veps
findings. Restored and unflagged validation remains outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/834beb172">Repair Veps permissions and defined participles</a>. Thanks to xet7.</summary>

Repair/refine 43 values, resolving 18 original findings: 26 new records
and 17 refinements preserving original before values. Replace malformed
märitadud with reference-confirmed märitud throughout the locale.
Preserve read/comment/normal permissions, assigned-only current-user
visibility, board/card scopes, add versus assign, all-card removal plus
notification and numeric selection ranges. All 16,510 exact corrections
and positive/negative actual placeholder rendering checks pass.
Composed role/UI wording needs fluent-speaker review. Original totals are
14,723 corrected and 1,121 pending, including 380 Veps findings.
Restored and unflagged validation remains outstanding; repairs continue.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3018d5c4b">Repair Veps list controls and checklist item stems</a>. Thanks to xet7.</summary>

Repair/refine 39 values, resolving 30 original findings: 36 new records
and three refinements preserving original before values. Use the document
item stem rather than the belly stem for checklist plurals. Preserve
top/bottom and current/selected-list rules, checked/all/completed items,
archive recovery, activity history and irreversible deletion. Archive
navigation instructions match the actual translated headings.
All 16,484 exact corrections and actual rendering/negative semantics
checks pass. Composed UI wording needs fluent-speaker review. Original
totals are 14,705 corrected and 1,139 pending, including 398 Veps findings.
Restored and unflagged validation remains outstanding; repairs continue.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ffd589691">Repair Veps date filters and due-card views</a>. Thanks to xet7.</summary>

Repair 21 date filters, countdowns, sorting, export and due-card view
values, resolving five original findings. Preserve this/next week,
tomorrow, numerical counters, all five export date types, incomplete
cards and board permissions. Retain the correct Minä label; correct
received-date terminology and the malformed past-deadline form.
All 16,448 exact corrections and actual rendering/negative language checks
pass. Composed wording needs fluent-speaker review. Original totals are
14,675 corrected and 1,169 pending, including 428 Veps findings.
Restored and unflagged validation remains outstanding; repairs continue.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9889016d7">Repair Veps date changes and reminders</a>. Thanks to xet7.</summary>

Repair 39 date controls, rules, activity and reminder values, resolving
19 original findings. Replace Finnish and Finnish/Venda mixtures with
reference Veps vocabulary. Preserve received/start/due/end distinctions,
set-or-change conditions, old/new times and reminder states. Actual locale
underscore/sprintf rendering and negative language checks pass, along with
all 16,427 exact correction records. Composed UI wording needs further
fluent-speaker review. There are 14,670 corrected and 1,174 pending original
findings, including 433 Veps and 595 Standard Moroccan Tamazight findings.
Restored and unflagged validation remains outstanding; repairs continue.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6d8c63866">Repair Veps activity and notification labels</a>. Thanks to xet7.</summary>

Replace two unflagged Finnish labels with native Veps action and
notification vocabulary. Actual locale rendering and a negative Finnish
regression pass, along with all 16,388 exact correction records.
The composed notification wording needs fluent-speaker review.
Original findings remain 14,651 corrected and 1,193 pending; Veps has 452.
Translation repairs continue, including restored/unflagged validation.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ad1ebcca9">Repair Veps checklist activity and added participles</a>. Thanks to xet7.</summary>

Repair/refine 32 values, resolving 16 original findings: 23 new correction
records and nine refinements preserving original before values. Replace all
erroneous ližadud forms with dictionary/inflection-table and native MediaWiki
ližatud. Preserve checkbox/completion/reopening, add/remove directions and field
clearing versus deletion. Exact correction, source token, key-order and actual
underscore/sprintf argument-order regressions pass. Composed kanban terminology
and remaining UI inflections need further review. Audit and TODO Later now
record 14,651 corrected findings, 1,193 pending and 16,386 correction records.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f24401739">Repair Veps custom field labels and template help</a>. Thanks to xet7.</summary>

Repair 23 Finnish/Venda values, resolving ten original findings. Preserve field
types, multi-select, field values/activity contexts and all-card irreversible
deletion with history loss. Restore the literal %{value} placeholder, preserve
HTML space entities and align generic/custom-field date labels. Exact
correction,
source token, entity, key-order and actual i18next interpolation checks pass.
Composed control terminology and UI inflections need fluent review. Audit and
TODO Later now record 14,635 corrected findings, 1,209 pending and 16,363 exact
correction records; restored-value and broader language/rendering reviews
remain.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9955ad816">Repair Veps checklist controls and activity messages</a>. Thanks to xet7.</summary>

Replace 21 Finnish, Venda and mixed values with Veps, resolving ten original
findings. Preserve add/remove, check/uncheck, completion/reopening, subtask
and board context, exact __checkList__ token case and (0/0) counters.
Exact correction, source token, key-order and actual i18next underscore
interpolation regressions pass. Composed checklist/subtask terminology and
UI inflection need fluent review. Audit and TODO Later now record 14,625
corrected findings, 1,219 pending and 16,340 exact correction records.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5ff1e475d">Repair Veps card labels and activity notifications</a>. Thanks to xet7.</summary>

Repair 32 labels/messages using Veps dictionary and native MediaWiki evidence,
resolving 22 original findings. Preserve attachment, label, comment, membership,
archive, import, restore and card-move contexts and source/destination
direction.
Use dictionary-attested swimming/strip roots for the kanban swimlane metaphor.
Exact correction, source token, key-order and actual i18next rendering checks
with production underscore interpolation pass. Kanban metaphors, compounds and
UI inflections need fluent review. Audit and TODO Later now record 14,615
corrected findings, 1,229 pending and 16,319 exact correction records.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0cef80395">Repair Veps migration limits and log translations</a>. Thanks to xet7.</summary>

Replace 10 Finnish settings values with dictionary-backed Veps, resolving three
original findings. Preserve attachment batch counts, CPU percentage pause
thresholds, millisecond delays and numeric ranges 1-100, 10-90 and 100-10000.
Exact correction, source token, key-order, range and actual i18next rendering
regressions pass. Technical batch terminology, millisecond inflection and
composed UI grammar need fluent review. Audit and TODO Later now record
14,593 corrected findings, 1,251 pending and 16,287 exact repair records.
Restored pre-pull values and broader language/rendering reviews remain pending.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/de2919013">Repair Veps migration controls and status translations</a>. Thanks to xet7.</summary>

Replace 15 Finnish values with dictionary-backed Veps, resolving seven original
findings. Preserve all-migration scope and distinguish pause, stop, start,
resume, completion and failure outcomes. Use the existing migration term rather
than physical file transfer. Exact correction, source token, key-order and
actual i18next rendering regressions pass. Technical loan inflection and
composed UI grammar need fluent review. Audit and TODO Later now record
14,590 corrected findings, 1,254 pending and 16,277 exact repair records;
4,058 restored pre-pull values still await validation.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/113208d77">Repair Veps S3 credentials and connection outcomes</a>. Thanks to xet7.</summary>

Replace 11 Finnish settings values with dictionary-backed Veps, resolving two
original findings. Distinguish access keys from secret credentials, successful
and failed connections, and object-storage buckets. Preserve AWS S3, MongoDB
GridFS and both endpoint URL examples. Exact correction, source token, key-order
and actual i18next rendering checks pass. Composed authentication terminology,
technical loans and inflection need fluent review. Audit progress records
14,583 corrected findings, 1,261 pending and 16,262 exact repair records.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5cf370063">Repair Veps SMTP and S3 network settings translations</a>. Thanks to xet7.</summary>

Replace 18 Finnish labels/descriptions with dictionary-backed Veps, resolving
seven original findings. Preserve protocol identifiers, secret credentials,
storage distinctions and literal region code us-east-1; repair STMP to SMTP.
Exact correction, source token, key-order and actual i18next rendering checks
pass. Network loans, authentication terminology and UI grammar need fluent
review.
Audit progress records 14,581 corrected findings, 1,263 pending and 16,251 exact
repair records. Translation repairs have resumed after the mirror interruption.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dbf214bda">Repair Veps attachment storage and irreversible deletion messages</a>. Thanks to xet7.</summary>

Replace 20 Finnish values with dictionary-backed Veps, resolving 19 original
findings. Preserve filesystem, MongoDB GridFS and S3 destinations, single/all
attachment scope, AWS/MinIO identifiers, save outcomes and permanent deletion
with no undo. Use native Sirdä for file transfer. Exact correction, source
token,
key-order and actual i18next rendering regressions pass. Composed technical
terminology and UI grammar need fluent review. Audit progress records
14,574 corrected findings, 1,270 pending and 16,233 exact repair records.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/198f7a0f5">Repair Veps list positions, sorting and duplicate cleanup</a>. Thanks to xet7.</summary>

Replace 12 Finnish values with dictionary-backed Veps, resolving 10 original
findings. Preserve selected-list left/right positions and distinguish empty-only
cleanup from all duplicate-list cleanup. Exact correction, source token,
key-order and actual i18next rendering regressions pass. Composed UI grammar
and derived plural genitives need fluent review. Audit progress records
14,555 corrected findings, 1,289 pending and 16,213 exact repair records.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/02383540a">Mirror configured organizations with linked attachments and offline HTML/CSV indexes</a>. Thanks to xet7.</summary>

Extend the shared Unix/Windows menu with organization-wide synchronization and
add/edit/remove/select organization settings. Map GitHub source organizations to
separate GitLab namespaces, Codeberg organizations and SourceForge projects.
Discover all accessible repositories on each run, create missing repositories or
Git tools, retain PR conversations when issues are disabled, and handle empty
repositories and source default branches. Enabled wikis retain Git history;
Projects V2 retains portable project/item/field/view/workflow/status data on a
separate branch. Disabled wiki/projects are not queried. Preserve private source
visibility and report unsupported native conversions instead of publishing it.

Archive files under .tools/mirror/host/organization/repository, migrating the
previous flat WeKan archive without overwriting existing or manual files.
Download linked images, videos, other files and webpage HTML per comment, retain
removed/replaced versions with timestamped old names, and attach files to the
same
GitLab/Codeberg/SourceForge comments where supported. Comment directories have
empty index.html files. Host, organization, repository, issue and release pages
have offline HTML and CSV indexes; repository HTML can be rebuilt from CSV.

Serialize and pace API/file requests, obey rate-limit/reset/retry headers on
GitHub and each destination, persist cooldowns across processes, and bound
retries. Git/SSH/SFTP respect saved cooldowns. Public GitHub REST reads work
without
a token or logged-in gh; unauthenticated Projects falls back to a public webpage
snapshot while retaining earlier structured exports. Never forward API
credentials
to arbitrary prose links; linked downloads check and pin public DNS addresses.

All 1,014 Node suites pass; final targeted regressions and 15 project query
variants checked against GitHub's public schema pass. Static navigation and
local
images pass in Chromium and Firefox. WebKit is registered and syntax-checked but
cannot launch locally because ICU 74 is missing and Docker is unavailable.
Native remote uploads/wiki initialization remain maintainer-run verification.
Design, settings, paths and commands are documented in releases/mirror.md.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/675ca5d95">Add saved mirror menu and selectable forge sources</a>. Thanks to xet7.</summary>

Add six menu actions for synchronization, source selection, active mirrors,
online checks, missing-data checks and exit on Unix and Windows. Default to
GitHub as source and GitLab, Codeberg and SourceForge as destinations; save
choices in .tools/mirror/settings.txt. Support the other forges as sources and
GitHub as a destination. Preserve original provenance when switching sources
and isolate their persistent archives to prevent issue-number collisions.

Compare Git ancestry and missing metadata without remote writes in check mode.
Unattended synchronization uses --sync. SourceForge native file directories
without release metadata become explicitly synthetic releases. Offline menu,
API, archive, retry, settings and platform regressions pass. The full Node run
passes 1,011 suites with zero failures. Native relative attachment links are
resolved against their original forge
([preserve native attachment links](https://github.com/wekan/wekan/commit/083a28c4f)); local archive
failures still allow every destination to attempt supported data
([continue after archive failures](https://github.com/wekan/wekan/commit/63f41589d)), with the final
retry regression also passing. Design and commands
are documented in releases/mirror.md. No live synchronization was run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ba375ac7d">Repair Veps activity, list, label and attachment terminology</a>. Thanks to xet7.</summary>

Replace 27 Finnish values with Veps, resolving 12 original findings. Preserve
move/import source and destination roles and percent placeholders. Actual
i18next/sprintf rendering and exact correction/token checks pass. Composed
kanban grammar and derived forms need fluent review. The audit now records
14,545 corrected findings, 1,299 pending and 16,201 exact repair records.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b7eca83d9">Translate remaining Veps Coptic and Hijri labels</a>. Thanks to xet7.</summary>

Replace four English calendar labels with Veps. Preserve tabular civil and
astronomical origins of time reckoning and Saudi moon-observation distinctions,
using checked Russian–Veps dictionary vocabulary. Composed technical terminology
and the adapted Coptic name remain low confidence. Exact correction, token,
variant-distinction and negative English regressions pass. The audit now records
14,533 corrected findings, 1,311 pending and 16,174 correction records.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6d071f6cb">Repair Veps account validation and test-email action</a>. Thanks to xet7.</summary>

Replace Finnish username-length and self-addressed SMTP-test messages with
Veps, preserving the inclusive three-character minimum and personal recipient.
Also repair the text label to native Tekst. Exact correction records and
vocabulary/token regressions pass; composed wording needs fluent review.
The translation audit now records 14,529 corrected original findings,
1,315 pending findings and 16,170 correction records including unflagged fixes.
Restored translations and broader language validation remain outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e2338530c">Retain complete issue, pull request and release mirror files</a>. Thanks to xet7.</summary>

Persist source metadata, comments, reviews, PR patches, GitHub-hosted
attachments,
release binaries and source archives in .tools/mirror/issues/1234,
.tools/mirror/pulls/1234 and .tools/mirror/releases/10.00. Reruns add new files,
reuse valid cached binaries and rename removed or changed versions to
old-YYYY-MM-DD_HH-MM-SS-ORIGINALFILENAME. Failed downloads preserve existing
copies for retry; historical and manually added files are retained.

Archive once before target synchronization. Offline tests cover retention,
replacement filenames, missing source items, corruption, conditional requests,
concurrent writers and preview behavior. Preserve destination main history
through a merge fallback without forced updates or remote deletions. GitHub
Discussions, projects and wiki are excluded. Design and commands are documented
in releases/mirror.md. No live mirroring was run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b1983adbb">Synchronize missing GitHub data to each active mirror</a>. Thanks to xet7.</summary>

Fix the Build Tools mirror menu handler and delegate to separate GitLab,
Codeberg and SourceForge scripts on Unix and Windows. Use one fully paginated
GitHub snapshot and provenance identifiers to copy missing issues, linked PRs,
comments, labels, milestones and releases where supported. Retry interrupted
imports while preserving existing destination text. SourceForge uses Tracker
tickets and File Release System uploads. Report failures and continue to later
targets. Offline CLI/API fixtures verify pagination, retries, preview behavior,
upload shapes and launcher parity.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a574de0e1">Repair the Veps chart export title</a>. Thanks to xet7.</summary>

Replace the remaining Zulu popup title with the native Veps export label Ve.
Record the exact correction and verify title consistency and source tokens;
the correction ledger now contains 16,167 repairs. Translation audit progress
is recorded in docs/Features/Translations/Audit.md.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e8be34404">Install complete tooling for active mirrors across platforms</a>. Thanks to xet7.</summary>

The mirror tooling installer now installs missing Git, SSH/SCP/SFTP, curl,
jq, Node and Go prerequisites as well as gh, glab, Tea, git-bug and Forge.
Native Debian/Ubuntu, Fedora and Brew packages select the host architecture;
missing forge packages fall back to native Go builds. Older Unix Go is
bootstrapped from the official stable catalogue with SHA-256 verification.
Unix also installs rsync for resumable SourceForge release transfers.

Windows uses a PowerShell installer with winget or existing Chocolatey,
OpenSSH client detection/installation and refreshed package PATH. Go-built
commands use .tools/bin or configured GOBIN. Both installers attempt later
tools after failures, list OK/MISSING commands and return failure if any
required command remains missing. SourceForge is now included in the
Windows mirror script, matching the three active Unix targets.

Offline regressions execute Unix and PowerShell install flows and verify
package mappings, architecture selection, checksum rejection, installed
command skips, failure continuation and menu parity. Live installation on
every OS/CPU remains unverified and requires upstream toolchain support.
Tool installation is separate from running the mirror scripts.
No authenticated mirroring, uploads or publishing were performed.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/23eda3ea3">Fix Forge and Tea CLI installation paths</a>. Thanks to xet7.</summary>

The Tools installer previously attempted to install Forge's library root,
which fails with "is not a main package", and fetched obsolete Tea sources.
Use Forge's cmd/forge package and Tea's maintained gitea.dev module on Unix
and Windows. Unix Tea/Forge Go failures return nonzero status while later
tools are still attempted. Existing commands remain skipped. Offline
regressions cover Fedora detection, install paths, skips and failures;
Windows paths are checked from source. No real packages were installed.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/29408a863">Update repository mirrors</a>. Thanks to xet7.</summary>

The human-run mirror script targets GitLab, Codeberg and SourceForge.
Bitbucket was tried during development and is now disabled because of
Unauthorized errors. Repository paths remain resolved from the script's
checkout. Syntax validation does not contact or certify remote mirrors;
no mirroring or publishing commands were executed for this audit.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ad294f707">Verify uploads after Transifex adds language support</a>. Thanks to xet7.</summary>

Offline regression covers all five missing languages: failed registration,
addition and full upload after support becomes available, then later uploads
without duplicate registration. Each run refreshes project membership;
previous failure reports never exclude languages. Document code mapping
changes when Transifex uses a different identifier. No remote writes ran.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/88220b7a0">Repair Veps account and SMTP email messages</a>. Thanks to xet7.</summary>

Replace five Finnish/Venda account and email messages, resolving three
original findings. Preserve site placeholders, personal password reset,
address verification, invitation action and SMTP success. Low confidence:
composed subjects and success grammar need fluent review. Vocabulary and
full correction inventory checks pass. Invitation-subject terminology and
browser verification remain pending.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/96b75531a">Repair Veps avatar controls and size warnings</a>. Thanks to xet7.</summary>

Replace seven Finnish avatar controls and size/type warnings with native
user-image vocabulary, resolving four original findings. Preserve upload
states, deletion confirmation, maximum sizes, bytes and the size placeholder.
Low confidence: composed avatar phrasing and byte-unit inflection need
fluent review. Vocabulary, rejected Finnish and full correction inventory
checks pass; browser verification remains pending.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/812c2437a">Repair Veps email and active status controls</a>. Thanks to xet7.</summary>

Replace eleven Finnish email and active/inactive labels with native software
terms. Restore plural Email Addresses, retain SMTP and preserve send/sent,
error and opposing active states. Low confidence: the composed SMTP subject
needs fluent review. Vocabulary, rejected Finnish and full correction
inventory checks pass; browser verification remains pending.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/22e513df9">Repair Veps upload and email status labels</a>. Thanks to xet7.</summary>

Replace seven Finnish status and limit labels with native software terms,
resolving four original findings. Keep upload failure and completion
distinct, and preserve the byte unit. Low confidence: composed allowed-file
and byte-unit wording needs fluent review. Vocabulary, rejected Finnish and
full correction inventory checks pass; browser verification remains pending.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e6b39cc68">Repair Veps rename permissions and filter controls</a>. Thanks to xet7.</summary>

Replace seven Finnish labels with native software vocabulary and dictionary
forms, resolving six original findings. Preserve permission actions, the
Username Change source meaning and clearing all filters. Low confidence:
composed permission and no-errors grammar needs fluent review. Vocabulary,
rejected Finnish and full correction inventory checks pass.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/22c70a853">Repair Veps import, export and other actions</a>. Thanks to xet7.</summary>

Replace Finnish/Zulu change, close, export, import and rename labels with
native software commands. Preserve import/export and close/delete
distinctions. Vocabulary, rejected foreign seeds and full correction
inventory checks pass; browser and fluent reviews remain pending.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a14b0ffc4">Repair Veps navigation and error labels</a>. Thanks to xet7.</summary>

Replace six Finnish labels with native software terminology, including the
verified distinct plural for errors. Vocabulary, rejected Finnish and full
correction inventory checks pass; fluent and browser reviews remain pending.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/47150ef05">Repair Veps recurring schedule labels</a>. Thanks to xet7.</summary>

Replace seven Finnish interval labels with native vocabulary, keeping all
numbers and units. Low confidence: composed frequency grammar needs fluent
review. Interval, vocabulary and rejected Finnish checks pass with the full
correction inventory.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c938208a8">Repair Veps time units and lockout duration label</a>. Thanks to xet7.</summary>

Replace Finnish hour/minute/second and lockout-duration labels with native
software vocabulary, preserving duration and seconds. The composed duration
label needs fluent review. Vocabulary and rejected Finnish checks pass with
the full correction inventory.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/45045afae">Repair Veps notifications and description labels</a>. Thanks to xet7.</summary>

Replace Finnish notification/deletion/description text with dictionary-attested
Veps plural and native software vocabulary. Preserve all-notifications scope.
Composed deletion wording needs fluent review. Vocabulary and rejected Finnish
checks pass with the correction inventory.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5f011f219">Repair Veps navigation and file control labels</a>. Thanks to xet7.</summary>

Replace eight Finnish labels with native software terms for navigation,
refresh, file controls, size and type. Keep download distinct from upload
with explicit save-as-file wording. Exact vocabulary and rejected Finnish
checks pass with the full correction inventory.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ab9562bad">Repair Veps authentication, email and confirmation labels</a>. Thanks to xet7.</summary>

Replace eight Finnish/Zulu labels with directly verified native Veps software
terms. Keep the sign-in imperative and existing correct No value. Exact
vocabulary and rejected foreign-language checks pass with the full inventory.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/03773df04">Repair Veps unlock confirmations and Unlock All action</a>. Thanks to xet7.</summary>

Replace Finnish prompts with native Veps confirmation and unlock vocabulary.
Preserve one-user versus all-locked-users scope. Composed grammar and plural
usage need fluent review. Exact wording, scope distinctions and rejected
Finnish checks pass with the correction inventory.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/90b6e57bb">Repair Veps known, unknown and locked user messages</a>. Thanks to xet7.</summary>

Replace six Finnish lockout labels using native software vocabulary and
dictionary inflections. Preserve username/password conditions, current lock
state and successful unlock. Composed grammar needs fluent review. Vocabulary,
condition and rejected Finnish checks pass with the correction inventory.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1ca7941c2">Repair Veps password forms and account messages</a>. Thanks to xet7.</summary>

Replace six Finnish password/account labels with native software vocabulary.
Keep repeat, mismatch, forgotten-password and required-fields meanings.
The composed required-fields message needs fluent review. Exact vocabulary
and rejected Finnish checks pass with the full correction inventory.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/29ee41f45">Repair Veps settings, password and core action labels</a>. Thanks to xet7.</summary>

Replace nine Finnish labels with software-attested native Veps password,
settings, save, delete, cancel and help vocabulary. The directly fetched
MediaWiki Veps translation file supplies the reference. Exact vocabulary and
rejected Finnish checks pass with the full correction inventory.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/247ae2a9a">Replace unrelated Zulu Veps year warning</a>. Thanks to xet7.</summary>

Write the year warning in Veps, preserving the four-digit instruction and 2026
example. Low confidence: digit terminology and grammar need fluent review.
Exact warning, instruction and rejected Zulu checks pass with the full
correction inventory.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8b01dc136">Repair Veps date format labels and invalid time warning</a>. Thanks to xet7.</summary>

Restore canonical date-format tokens in the existing selector and replace
Finnish invalid-time prose with Veps vocabulary. The composed warning needs
fluent review. Positive and negative checks pass with the correction inventory.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/aca7cfe2c">Repair Veps Indian National and Minguo calendar labels</a>. Thanks to xet7.</summary>

Replace English descriptors with Veps country, national and republic vocabulary.
Keep the National meaning and Minguo identifier; distinguish Minguo from the
Chinese calendar. Composed names need fluent review. Vocabulary and negative
regressions pass with the full correction inventory.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d26e32c14">Repair Veps Buddhist and named Hijri calendars</a>. Thanks to xet7.</summary>

Replace English descriptors with native religious genitives and calendar
vocabulary. Preserve Hijri and Umm al-Qura identifiers and their distinction.
Composed names need fluent review; evidence includes indexed article copies.
Vocabulary, English negatives and distinct-calendar correction checks pass.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c522b5653">Repair Veps Hebrew and Amete Alem calendar labels</a>. Thanks to xet7.</summary>

Replace English descriptors with attested Veps vocabulary. Preserve Amete Alem
so its era remains distinct from the ordinary Ethiopic calendar. Composed names
need fluent review. Vocabulary, English negatives and distinct-calendar checks
pass with the full correction inventory.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0f3be9458">Repair Veps search and edit commands</a>. Thanks to xet7.</summary>

Replace Finnish commands with native Veps imperatives used by the Veps
Wikipedia interface. Search popup and command labels agree. Vocabulary,
wrong-language negatives and the full correction inventory pass.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/94b5e33ef">Repair Veps Ethiopic and Dangi calendar labels</a>. Thanks to xet7.</summary>

Replace English seeds with attested Veps country forms and calendar vocabulary;
preserve Dangi's identifier. Composed calendar names need fluent review.
Exact vocabulary, rejected English descriptors and all correction records pass.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d75133d57">Repair Veps color, year and event name labels</a>. Thanks to xet7.</summary>

Replace Finnish color/year and Latvian name values with dictionary-attested
Veps vocabulary. Preserve existing correct Veps name and Gantt-year labels.
Positive vocabulary, rejected wrong-language seeds and all 16,047 correction
records pass. These four unflagged repairs leave original pending counts
unchanged.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/70714dce4">Repair Tamazight Islamic and East Asian calendar names</a>. Thanks to xet7.</summary>

Replace English calendar seeds with attested native calendar and country
vocabulary. The Islamic name follows Unicode CLDR; Chinese and Japanese names
use the existing country-calendar pattern and need fluent review. Vocabulary,
distinct-calendar and full correction checks pass.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0f5371247">Repair Tamazight date interface vocabulary</a>. Thanks to xet7.</summary>

Replace Arabic and French Calendar, Time, Today, Day, Week and Month labels
with Unicode CLDR-attested Tifinagh. Exact vocabulary and script checks pass
with the full correction ledger. Broader translation repairs remain pending.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/56c02baca">Repair Standard Moroccan Tamazight core labels</a>. Thanks to xet7.</summary>

Replace Arabic Title and Language values with IRCAM-attested native Tifinagh.
Positive vocabulary and negative Arabic-script checks pass with the full exact
correction ledger. Broader Tamazight translation repairs remain unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/389dc28e5">Repair Veps user and board not-found diagnostics</a>. Thanks to xet7.</summary>

Replace Finnish seed text with attested Veps vocabulary, preserving quoted
format placeholders. Positive/negative vocabulary and correction tests pass.
Composed diagnostic wording needs fluent review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/42f931734">Repair Veps organization labels and diagnostic vocabulary</a>. Thanks to xet7.</summary>

Replace Finnish organization plural, count and not-found text with attested
Veps nouns and inflections. Positive/negative vocabulary and placeholder checks
pass. Composed diagnostic wording needs fluent review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/70bf60d30">Repair Sakha and Veps Persian and Coptic calendar labels</a>. Thanks to xet7.</summary>

Use attested native names and existing calendar vocabulary while preserving
Jalali as a proper name. Positive/negative vocabulary and correction tests pass.
Composed calendar names need fluent review; other Hijri findings remain pending.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/48e6eef90">Use localized Kashmiri civil calendar name</a>. Thanks to xet7.</summary>

Replace the English seed with the exact Unicode CLDR Kashmiri display name.
Positive/negative vocabulary checks preserve the distinction from general Hijri.
Two Kashmiri calendar findings remain under review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3d8f20733">Repair Tibetan calendar terminology and Hijri variants</a>. Thanks to xet7.</summary>

Replace English and Italian seeds with Tibetan calendar labels, preserving
proper names and Gregorian ISO week semantics. Distinguish civil/astronomical
epochs and lunar sighting. Positive/negative vocabulary and correction tests
pass.
Member Settings browser coverage is added and syntax-checked, execution pending.
Technical compositions and transliterations have low confidence.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/637dbebd6">Report translation upload outcomes and catalogue support</a>. Thanks to xet7.</summary>

List successful uploads and failures with reasons, supported retry targets,
unsupported local codes and additional supported targets requiring translations.
Read all catalogue pages; report unavailable discovery as unknown support.
Print instructions for requesting new catalogue languages. Offline positive and
negative summary, pagination and unavailable-catalogue checks pass. No uploads
were performed here.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d656d86c0">Repair Veps field labels and board command grammar</a>. Thanks to xet7.</summary>

Use native Language, Number and Title labels, and correct the click imperative
in two default-board instructions. Vocabulary and exact correction checks pass.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a98ae0474">Replace Finnish Veps alphabetical title label</a>. Thanks to xet7.</summary>

Use attested Veps title and alphabet vocabulary. The compact sorting label has
low confidence and needs fluent review. Positive/negative vocabulary checks
pass.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b9f5fbb92">Repair Veps time and basic interface vocabulary</a>. Thanks to xet7.</summary>

Replace Finnish Time, New and Today labels with dictionary-attested Veps.
Exact correction records and positive/negative vocabulary checks pass.
The broader translation audit remains unfinished.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c2a9168c4">Fix Simplified Chinese Transifex script identifier</a>. Thanks to xet7.</summary>

Use supported zh-Hans instead of invalid zh_Hans. Offline upload mapping and
locale loader round-trip checks pass. Wolaytta remains a reported unsupported
catalogue language; no remote uploads were performed.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/196c0addc">Save translation upload status to timestamped text logs</a>. Thanks to xet7.</summary>

Keep terminal status and errors in
.tools/log/push-all-translations_YYYY-MM-DD_HH-MM-SS.txt using local time.
Offline dry-run and error tests verify saved output and preserved exit status.
Tigre remains a reported unsupported catalogue language; no uploads were run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/37ae64fa8">Complete browser language aliases and startup regression checks</a>. Thanks to xet7.</summary>

Map bare Cantonese and Wu to existing variants and Macau Chinese to Traditional
Chinese. Actual startup checks verify delayed profile preferences, browser
languagechange and no automatic profile writes. Locale and startup tests pass;
browser execution remains pending.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e6aed7a8c">Fix Russian Russia translation upload identifier</a>. Thanks to xet7.</summary>

Use supported ru_RU for the local ru-RU locale and report its alias instead of
uploading twice. Offline upload and loader checks pass. Aromanian remains a
reported unsupported catalogue language; no remote uploads were run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1666a2012">Match browser languages when no member language is saved</a>. Thanks to xet7.</summary>

Check browser preferences in order, including standard tags for legacy Veps,
Venetian, Flemish, Waray, Latin American Spanish and Uzbek script locales.
A supported saved profile choice wins; unsupported preferences fall back to
English. Browser languagechange updates the display without saving a choice.
All 245 locale and preference checks pass; UI coverage is syntax-checked with
execution pending. Also fix Portuguese Portugal upload mapping in
<a href="https://github.com/wekan/wekan/commit/0c0adb48b">the Portuguese mapping repair</a>; offline upload and loader checks pass.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8549b6c4c">Show country and language flags in the language popup</a>. Thanks to xet7.</summary>

Check all 245 popup locales and every translation file. Regional entries show
country then language flags, including RTL layouts, with legacy and script-tag
exceptions. Unit checks pass; browser coverage is added and syntax-checked,
with execution pending. Fix French, Khmer and Guarani upload identifiers in
<a href="https://github.com/wekan/wekan/commit/cb6830505">the Transifex mapping repair</a>; offline upload checks pass.
Manx and Ladin remain reported as unsupported catalogue languages.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/27a566a0d">Fix Colombian Spanish upload mapping and duplicate targets</a>. Thanks to xet7.</summary>

Map the local es-CO locale to Transifex es_CO. Explicit mappings select the
canonical file when a legacy alias shares its remote target, and the uploader
reports that alias instead of uploading twice. Offline positive and negative
mapping checks and force-upload regressions pass. No remote uploads were run.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5290ee727">Add explicit force upload of every local translation to Transifex</a>. Thanks to xet7.</summary>

The maintainer-run script uploads English source strings and every local target,
adds missing project languages individually, waits for asynchronous completion,
and reports all failed languages with reasons and a saved JSON report. The
existing language reconciliation uses the documented additive relationship API.
An offline dry run checks 245 targets and the source without network requests.
Mocked API regression tests cover mappings, registration, polling, unsupported
languages, failure continuation and summaries, intentional empty source strings,
placeholder errors and the API credential origin boundary. Tests pass; no live
Transifex uploads were executed.

</details>

and records the following translation repairs and documentation:

**Locale files** - repair language, meaning and formatting while retaining
evidence.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f6e2f742c">Record local translation repairs through the pause</a>. Thanks to xet7.</summary>

Since v11.72, calendar labels and other translation edits touch 244 locale
files. The reviewed correction inventory now contains 13,544 exact
before/after records across 201 locale identifiers. Later batches extend
the earlier entries below, replacing wrongly seeded and mixed-language
text, correcting kanban terminology, permissions, account emails, activity
messages, search help, storage/migration controls and irreversible warnings.
Source placeholders, argument roles, JSON examples and technical date
formats are preserved. Correct shared vocabulary is reviewed and retained.
Klingon repairs include transfer states, administrator requirements,
calendar/activity wording and mouse/keyboard control instructions.

The short audit summary is synchronized with the original categorized
evidence and correction/review inventories. Language-specific tests and
shared regression checks cover recorded values, tokens, key order, repair
idempotency and preference for newer human translations. This is a record
of completed local batches, not certification of every language: 2,979
findings remain pending, 4,058 restored values still need validation and
fluent-speaker/browser checks remain outstanding. Repairs are paused;
see TODO Later and the translation audit for the dated resume status.

Upcoming regression coverage was audited against all source changes since
v11.72: existing positive/negative calendar, popup, OAuth2 and translation
checks cover the implemented behavior; the calendar browser spec is
registered and syntax-checked. The full Node run completed 986 suites with
19 failures. The subsequent regression repairs are recorded above; the final
full run completed 987 suites with zero failures, and changelog formatting
checks pass. Mirror syntax was checked without running the publishing
script. Live browser, identity-provider and fluent-speaker checks remain
outstanding.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c8c6d082daf1125d74d7846983d73c6c9e1e8fe3">Repair audited Aragonese translations</a></summary>

Repair wrong-language calendar, account, card-activity, import/export, storage,
backup and administration wording. Preserve placeholders, literal JSON examples,
vendor names, warning scope and completion messages; retain reviewed shared
vocabulary. Contextual meaning and correction-inventory regression checks pass.
Aragonese wording needs native-speaker review; the audit remains unfinished.
Live Meteor browser verification was unavailable.

Thanks to xet7 !
</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dacbe7416fcc04afc1755d66a9b231b16fdc1e1e">Repair audited Asturian translations</a></summary>

Replace audited Spanish wording with Asturian in account controls, card
activities, permissions, filters, imports, dates, warnings and attachment
settings. Preserve placeholders, JSON examples, storage destinations and
irreversible-deletion warnings. The latest batch repairs attachment storage,
automatic list width, avatar size and minicard attachment counts. Meaning and
correction-inventory regression tests pass; native-speaker review is still
needed. Live Meteor browser verification was unavailable.

Thanks to xet7 !
</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0fcfb0e59190f5213786a235dd7d55e14ee4495b">Finish flagged base Galician translation review</a></summary>

Translate filter instructions and two calendar labels, repair two
search-formatting defects and retain nine correct findings. Both flagged
Galician queues are complete. Translation regression checks pass.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3de5b15ca2ffed5bc67b67cd786602b470e3f325">Finish flagged Galician regional translation repairs</a></summary>

Repair the final 29 flagged setting, warning, advanced-filter and calendar
values, retaining one correct instruction. Preserve filter examples, WIP
restrictions and calendar distinctions. Translation regression checks pass; the
regional audit queue is complete.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1b06f4cb7ef46e8946cddab01d7d4c612b5fa433">Fix Galician regional S3 and troubleshooting translations</a></summary>

Replace 33 Portuguese values with reviewed Galician and retain two correct
rule/example values. Correct S3 endpoint terminology and preserve MinIO support,
troubleshooting commands, task limits and ISO week labels. Translation
regression checks pass.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bb288913e090ab4e310b2762710412877fbe53ce">Fix Galician regional migration limits and monitoring messages</a></summary>

Replace 35 Portuguese values with reviewed Galician. Distinguish paused from
stopped migrations and preserve CPU thresholds, millisecond ranges, background
continuation, monitoring errors and permanent-deletion warnings. Translation
regression checks pass.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5fe2d75a23b35109ad184037a69208ad0793d05e">Fix Galician regional search and import translations</a></summary>

Replace 29 Portuguese values with reviewed Galician and retain one correct
integrity label. Restore label search arguments and valid-data instructions;
preserve shortcut states, byte units and migration batch limits. Translation
regression checks pass.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/427d86c04cd121936b14052398e5e50ba97c0cba">Fix Galician regional email and export translations</a></summary>

Replace 29 Portuguese values with reviewed Galician and retain one correct
filter label. Restore export assignee terminology and preserve account email
instructions, date categories, filesystem labels and URL placeholders.
Translation regression checks pass.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/415883c9fab72986d6062aff690ecf366df54530">Fix Galician regional customization and migration translations</a></summary>

Replace 35 Portuguese values with reviewed Galician. Preserve customization
filenames, HTML tags, template placeholders, space entities, default logo height
and migration control meanings. Translation meaning, placeholder, key-order and
idempotency regression checks pass.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b2cdec01e9fafc410170b2482d80e64f9f59c3fd">Fix Galician regional storage and scheduled job translations</a></summary>

Replace 28 Portuguese values with reviewed Galician and retain two correct
custom-field labels. Preserve storage instructions, display states, sorting
order and scheduled-job success/failure messages. Translation meaning,
unchanged-review, placeholder, key-order and idempotency regression checks pass.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2f6e6884e1e2d45e98a53cb83c0b5a2742bff04b">Fix Galician regional activities and administration translations</a></summary>

Replace 30 Portuguese values with reviewed Galician. Clarify custom-field value
clearing and preserve activity argument order, administration scope, workspace
actions and archive destinations. Translation meaning, placeholder, key-order
and idempotency regression checks pass.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/da98201307271e16c69c547ed9f6b5c7febdac11">Fix Galician regional account protection and date messages</a></summary>

Replace 30 Portuguese values with reviewed Galician. Preserve account lockout
units and restrictions, clarify date/time changes, and distinguish upcoming,
current and past due reminders. Translation meaning, placeholder, key-order and
idempotency regression checks pass.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/60364ccc13af1e5f52aac7f53ca81d22ecdc5259">Fix Galician regional account and memory diagnostics translations</a></summary>

Replace 23 Portuguese values with reviewed Galician. Preserve account
requirements and worker restrictions, distinguish heap from stack, and correct
storage-engine and memory diagnostic labels. Translation meaning, placeholder,
key-order and idempotency regression checks pass.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/767bbcd84ef64c0c9956c1fe8f55ec3736003e7d">Fix Galician regional display and swimlane translations</a></summary>

Replace 25 Portuguese values with reviewed Galician. Restore assignee shortcut
terminology and preserve swimlane archive and deletion warnings, private-only
visibility, notification scope and export restrictions. Translation meaning,
placeholder, key-order and idempotency regression checks pass.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/70864992f231ed50b36c6f98d0cbee34ee0b4759">Fix Galician regional migration confirmations and controls</a></summary>

Replace 20 Portuguese values with reviewed Galician. Preserve migration
conditions, archived and non-archived recovery scope, undo warnings, scheduling
labels, search scope and card-count thresholds. Translation meaning,
placeholder, key-order and idempotency regression checks pass.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d05f4217601a87eb3f8991be4ac76da81e296143">Fix Galician regional rules and recovery translations</a></summary>

Replace 30 Portuguese values with reviewed Galician. Restore the rule trigger
for movement to another list and preserve read-only permissions, member-removal
consequences and recovery identifiers. Translation meaning, placeholder,
key-order and idempotency regression checks pass.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/03b8a8a4fd2961b95437049fd568e71e6b3d609e">Fix Galician regional visibility and notification translations</a></summary>

Replace 16 Portuguese values with reviewed Galician. Restore positive-integer
search limits and preserve notification scope, board visibility and edit
permissions, checklist order and invitation placeholders. Translation meaning,
placeholder, key-order and idempotency regression checks pass.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/97124a0d4ed051afc8688b9e7a4abd7ae8f82b3f">Fix Galician regional migration and attachment translations</a></summary>

Replace 18 Portuguese values with reviewed Galician. Preserve migration
permissions and browser warnings, attachment storage destinations, checklist
controls and search-count placeholders. Translation meaning, placeholder,
key-order and idempotency regression checks pass.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c5429b159d82ee35810e014079c7c7ba5102e731">Fix Galician regional membership and list translations</a></summary>

Replace ten Portuguese values with reviewed Galician. Preserve last-admin
restrictions, board-exit consequences, archive restoration and irreversible list
deletion warnings. Translation meaning, placeholder, key-order and idempotency
regression checks pass.

Thanks to xet7 !

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d98e80bb3055435858c111bddd2fb5197a1a71db">Repair Galician regional credentials and label deletion warnings</a>. Thanks to xet7.</summary>

Repair six regional values with reviewed Galician wording. Preserve
unmapped-member fallback, credential alternatives, irreversible label deletion
and history loss. Meaning, exact-value, placeholder, key-order and idempotency
checks pass. The short translation audit records current progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5e89d53cf924b799a26db05f7c620b0711b9bef4">Repair Galician regional import and checked item instructions</a>. Thanks to xet7.</summary>

Repair six regional values with reviewed Galician wording. Preserve
checked/all-item distinctions, conditional import success, ZIP attachment
structure and member mapping. Meaning, exact-value, placeholder, key-order and
idempotency checks pass. The short translation audit records current progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9100900db97f1945cfaaf17e7054eb46306e624e">Repair Galician regional time filters and checklist visibility</a>. Thanks to xet7.</summary>

Repair six regional values with reviewed Galician wording. Preserve
overtime/spent-time distinctions, completed checklists, all checklist items and
mini-card label text. Meaning, exact-value, placeholder, key-order and
idempotency checks pass. The short translation audit records current progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4b6fcaa8c1713a69c9b191bdae4e96a047059506">Repair Galician regional search status and all board search title</a>. Thanks to xet7.</summary>

Repair six regional values with reviewed Galician wording. Preserve
member/assignee alternatives, archived/unarchived scope, end-date presence and
board visibility restrictions; restore all-board search intent. Meaning,
exact-value, placeholder, key-order and idempotency checks pass. The short
translation audit records current progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/10cc133fe9fae65f03d524264bedf76092a7fd98">Repair Galician regional board scoped search operators</a>. Thanks to xet7.</summary>

Repair six regional values with reviewed Galician wording. Preserve board-scoped
organization/team matches, inclusive day limits and list/swimlane distinctions.
Meaning, exact-value, placeholder, key-order and idempotency checks pass. The
short translation audit records current progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3c142fa6cff23529ca59532fef6a7de08f05d586">Repair Galician regional search day limits and existence predicates</a>. Thanks to xet7.</summary>

Repair six regional values with reviewed Galician wording. Preserve inclusive
day limits, overdue/existence syntax, label alternatives and integer page
limits; close example formatting. Meaning, exact-value, placeholder, key-order
and idempotency checks pass. The short translation audit records current
progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0f299014cb0b26cc57019c12d0f7f3b835d68cc9">Repair Galician regional search conditions and operator descriptions</a>. Thanks to xet7.</summary>

Repair six regional values with reviewed Galician wording. Preserve AND
conditions, case-insensitive search, archived-card defaults and exact operator
placeholders/examples. Meaning, exact-value, placeholder, key-order and
idempotency checks pass. The short translation audit records current progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/068f54dc2f191686f834f0bd3d3bace81f16a27f">Repair Galician regional search and migration descriptions</a>. Thanks to xet7.</summary>

Repair eight regional values with reviewed Galician wording. Preserve
storage/reference repairs, missing/corrupt lists, exact search examples and OR
conditions. Meaning, exact-value, placeholder, key-order and idempotency checks
pass. The short translation audit records current progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9adbfda106bc50b035a415d7e9a2162ebff8972a">Repair Galician regional JSON validation and Excel export messages</a>. Thanks to xet7.</summary>

Repair eight regional values with reviewed Galician wording. Preserve JSON
validation distinctions, authorization denial, disk-space failures and export
scope. Meaning, exact-value, placeholder, key-order and idempotency checks pass.
The short translation audit records current progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/db4c2bdd9b211960fd3bd3f1734f7d02f5343e6a">Repair Galician regional invitations and board permission errors</a>. Thanks to xet7.</summary>

Repair eight regional values with reviewed Galician wording. Preserve invitation
codes/links, member/admin distinctions, CSV/TSV separators and due-card view
aliases. Actual registration-email rendering, meaning, exact-value, placeholder,
key-order and idempotency checks pass. The short translation audit records
current progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e80df7de02d1c1bc6a5ab06bdd73d41ba4a5dc00">Repair Galician regional due card permissions and account deletion warnings</a>. Thanks to xet7.</summary>

Repair eight regional values with reviewed Galician wording, preserving
membership safeguards, irreversible deletion and due-card permissions. Meaning,
exact-value, placeholder, key-order and idempotency checks pass. The short
translation audit records current progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/377370367f512f8dc2c5ef1f7aee859614bc17ac">Repair Galician regional deletion safeguards and confirmations</a>. Thanks to xet7.</summary>

Replace 10 Portuguese values with reviewed Galician wording. Preserve
irreversible deletion, all-content scope, duplicate-list conditions, linked-card
deletion order and membership safeguards. Regression checks verify meanings,
exact corrections, source tokens, key order and idempotent repairs. The short
translation audit records current progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/43e16f0128468ad0ca85ab852224a003d3fbb64f">Repair Galician regional template copying and custom field warnings</a>. Thanks to xet7.</summary>

Replace 10 Portuguese values with reviewed Galician wording. Preserve literal
JSON fields, checklist aliases and irreversible all-card custom-field
deletion/history loss. Regression checks verify JSON parsing, meanings, exact
corrections, source tokens, key order and idempotent repairs. The short
translation audit records current progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dccb9b9b83d4a0e97b78c50208db5d302fe9e58e">Repair Galician regional conversion and checklist copy messages</a>. Thanks to xet7.</summary>

Replace 10 Portuguese values with reviewed Galician wording. Preserve conversion
timing and continued use, migration structural checks, checklist/item deletion
distinctions and template-copy intent. Regression checks verify meanings, exact
corrections, source tokens, key order and idempotent repairs. The short
translation audit records current progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fee4a4b23c2bbfba4dd6335dff8223931f964197">Repair Galician regional checklist and comment permission controls</a>. Thanks to xet7.</summary>

Replace 10 Portuguese values with reviewed Galician wording. Preserve
checklist/item distinctions, assigned-card and comment-only restrictions and
board restoration instructions. Regression checks verify meanings, exact
corrections, source tokens, key order and idempotent repairs. The short
translation audit records current progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/be7fa49a27fcaf3965903a4a3cd9eb7788c73fb1">Repair Galician regional card deletion and assignee messages</a>. Thanks to xet7.</summary>

Replace 10 Portuguese values with reviewed Galician wording. Preserve
irreversible card deletion, archive activity retention, board scope and
mini-card sorting; correct assignee terminology. Regression checks verify
meanings, exact corrections, source tokens, key order and idempotent repairs.
The short translation audit records current progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/837c590a60b636899f0e3c53328d7943658e64f5">Repair Galician regional board assignee and card archive messages</a>. Thanks to xet7.</summary>

Replace 10 Portuguese values with reviewed Galician wording. Correct assignee
terminology and preserve archive visibility/restoration and all-board-settings
aliases. Regression checks verify meanings, exact corrections, source tokens,
key order and idempotent repairs. The short translation audit records current
progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/99f53607325a6a0672ba6bee4f43d24f15ed1333">Repair Galician regional board scheduling and deletion messages</a>. Thanks to xet7.</summary>

Replace 10 Portuguese values with reviewed Galician wording. Preserve
backup/cleanup scheduling outcomes, permanent deletion scope and public/private
HTML emphasis. Regression checks verify meanings, exact corrections, source
tokens, key order and idempotent repairs. The short translation audit records
current progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/134d8c6dd0f08ce9da6315f56ba9e1958404d73f">Repair Galician regional attachment and board archive settings</a>. Thanks to xet7.</summary>

Replace 10 Portuguese values with reviewed Galician wording. Preserve
new/all-card field distinctions, automatic watching, archive scheduling statuses
and mini-card attachment counts. Regression checks verify meanings, exact
corrections, source tokens, key order and idempotent repairs. The short
translation audit records current progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/953b85ba9f3cc4ec55e87e7f3c3d7ce465fc3e68">Repair Galician regional user status and archive controls</a>. Thanks to xet7.</summary>

Replace 10 Portuguese values with reviewed Galician wording. Restore archive
intent, activation controls, all-card field scope and loading
data-loss/server-check warnings. Regression checks verify meanings, exact
corrections, source tokens, key order and idempotent repairs. The short
translation audit records current progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d4bc1452ecc197057e6b6271b9b8dfd220aad4dd">Repair Galician regional creation controls and administrator description</a>. Thanks to xet7.</summary>

Replace 10 Portuguese values with reviewed Galician wording. Preserve HTML
insertion positions, mini-card cover scope, scheduled-job availability and
administrator permissions. Regression checks verify meanings, exact corrections,
source tokens, key order and idempotent repairs. The short translation audit
records current progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1d133f6d65e9a9741eebdbe0f7c3ab6ca15ec878">Repair Galician regional checklist and card placement messages</a>. Thanks to xet7.</summary>

Replace 10 Portuguese values with reviewed Galician wording. Preserve
checklist-state arguments and top/bottom card placement. Regression checks
verify actual checklist-state and item-addition rendering, meanings, exact
corrections, source tokens, key order and idempotent repairs. The short
translation audit records current progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/04e1099334b09d4abbdef5bdee32b2b60514f450">Repair Galician regional checklist state activity translations</a>. Thanks to xet7.</summary>

Replace 10 Portuguese activity values with reviewed Galician wording. Preserve
checklist-state distinctions. Regression checks verify actual
item/checklist/card argument rendering, aliases, exact corrections, source
tokens, key order and idempotent repairs. The short translation audit records
current progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ccd597b9a1736ec97f6b9bf918357a49df2bae86">Repair Galician regional move and removal activity translations</a>. Thanks to xet7.</summary>

Replace 10 Portuguese activity values with reviewed Galician wording. Regression
checks verify actual cross-board move and checklist-item removal rendering,
label aliases, exact corrections, source tokens, key order and idempotent
repairs. The short translation audit records current progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ce40c66be59b13b2a2f92790469816d6801f3865">Repair Galician regional creation deletion and import activity translations</a>. Thanks to xet7.</summary>

Replace 12 Portuguese activity values with reviewed Galician wording. Regression
checks verify actual custom-field and list-import rendering, comment actions,
exact corrections, source tokens, key order and idempotent repairs. The short
translation audit records current progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4ee07e41b07ce347c726ea581fd35f999cfe7a7c">Repair Galician regional archive and checklist activity translations</a>. Thanks to xet7.</summary>

Replace 10 Portuguese activity values with reviewed Galician wording. Regression
checks verify actual checklist-item, mention and archive rendering, label
aliases, exact corrections, source tokens, key order and idempotent repairs. The
short translation audit records current progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1b11ec4f37465a798c40a505dae6d2568ba1d18a">Repair Galician regional lockout and activity translations</a>. Thanks to xet7.</summary>

Replace 10 Portuguese values with individually reviewed existing Galician
translations. Preserve credential distinctions and activity placeholders.
Regression checks verify actual attachment rendering, meanings, exact
corrections, tokens, key order and idempotent repairs. The short translation
audit records current progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dcd2b6815022ddbcb36d3f32f2be81b47982c883">Finish flagged Slovenian translation repairs</a>. Thanks to xet7.</summary>

Correct the final six flagged values across both Slovenian locales, including
who-voted-for-what visibility. Both flagged Slovenian queues are now complete.
Regression checks verify meaning, exact corrections, tokens, key order,
idempotent repairs and zero pending Slovenian findings. The short audit records
5,027 corrected findings and 10,915 pending findings across other languages.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/72f95b708303f0c52f74af973aedd06f3875e08a">Repair Slovenian shortcut instructions and export restrictions</a>. Thanks to xet7.</summary>

Correct 20 values across both Slovenian locales. Restore shortcut numbers and
ordering, export prohibitions, administrative instructions and vote-deletion
warnings. Regression checks verify meanings, exact corrections, source tokens,
key order and idempotent repairs. The short translation audit records current
progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6c6e567d3722c5908010a1770ca1118da1ae0095">Repair Slovenian support scope and swimlane validation messages</a>. Thanks to xet7.</summary>

Correct 24 values across both Slovenian locales. Restore logged-in-only support,
enabled-page status, positive-integer swimlane height and private-board-only
visibility. Regression checks verify meanings, exact corrections, source tokens,
key order and idempotent repairs. The short translation audit records current
progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d868269220dac9c43b9a5aba495b8c100a68b8e6">Repair Slovenian migration step terminology</a>. Thanks to xet7.</summary>

Correct 20 values across both Slovenian locales. Restore orphaned-card,
duplicate-empty-list, per-swimlane structure and list/swimlane distinctions.
Regression checks verify meanings, exact corrections, source tokens, key order
and idempotent repairs. The short translation audit records current progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/72bf36cf4360e3dc3af1c6e8668776885d4e9b59">Repair Slovenian board display and field sum controls</a>. Thanks to xet7.</summary>

Correct 20 values across both Slovenian locales. Restore field sums, per-list
card counts, mini-card display, board-member avatars, week start and migration
steps. Regression checks verify meanings, exact corrections, source tokens, key
order and idempotent repairs. The short translation audit records current
progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5aab614c48f9aa196d89edbf8ee519ff17c65238">Repair Slovenian search scope and troubleshooting instructions</a>. Thanks to xet7.</summary>

Correct 20 values across both Slovenian locales. Restore full board-search
scope, literal snap/Docker troubleshooting commands and pixel units for swimlane
height. Regression checks verify meanings, exact corrections, source tokens, key
order and idempotent repairs. The short translation audit records current
progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/165b6bde506234ab13def17e4bdce6e315d6f6fc">Repair Slovenian S3 configuration and backup scheduling labels</a>. Thanks to xet7.</summary>

Correct 20 values across both Slovenian locales. Preserve AWS S3/MinIO
alternatives, endpoint and region examples, authentication, SSL/TLS and
board-backup scope. Regression checks verify meanings, exact corrections, source
tokens, key order and idempotent repairs. The short translation audit records
current progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/41bde7259bce62074916a6d80db14ef1d0e319d3">Repair Slovenian migration confirmations and S3 labels</a>. Thanks to xet7.</summary>

Correct 20 values across both Slovenian locales. Preserve conversion/deletion
order, duplicate-list conditions, restoration warnings and non-archived-item
scope; restore generic S3 labels. Regression checks verify meanings, exact
corrections, source tokens, key order and idempotent repairs. The short
translation audit records current progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/396eef7189451c9ae78ca84b71b597f53af5956c">Repair Slovenian restoration and unsaved description messages</a>. Thanks to xet7.</summary>

Correct 20 values across both Slovenian locales. Preserve restoration scope,
literal identifiers, lost-item visibility and unsaved-description overwrite
confirmation. Regression checks verify meanings, exact corrections, source
tokens, key order and idempotent repairs. The short translation audit records
current progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0b61362da1c1496350a4301c1446b8f3b2b8e777">Repair Slovenian read permissions and action warnings</a>. Thanks to xet7.</summary>

Correct 24 values across both Slovenian locales. Restore edit prohibitions,
assigned-card visibility, permanent planning-poker deletion, label numbers and
empty-field matching. Regression checks verify meanings, exact corrections,
source tokens, key order and idempotent repairs. The short translation audit
records current progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c87fab15d03a95017c87a0d573a343a5ae8db558">Repair Slovenian permission and search validation messages</a>. Thanks to xet7.</summary>

Correct 24 values across both Slovenian locales. Restore permission
restrictions, notification participation and search validation meanings.
Regression checks verify actual operator/value rendering, meanings, exact
corrections, source tokens, key order and idempotent repairs. The short
translation audit records current progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8608a6524b3d547a0e90c22073e46ca7a7e9fd19">Repair Slovenian card views and multi selection messages</a>. Thanks to xet7.</summary>

Correct 24 values across both Slovenian locales. Restore board checkbox
selection, card view/sort distinctions, result counts and original
checklist-item order. Regression checks verify meanings, exact corrections,
source tokens, key order and idempotent repairs. The short translation audit
records current progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/21b6a673fb4dc2197be35defff9c5bdea46f8916">Repair Slovenian migration permissions and attachment move scope</a>. Thanks to xet7.</summary>

Correct 24 values across both Slovenian locales. Preserve board-administrator
migration restrictions, individual migration execution and board/all-attachment
scope. Restore mobile-mode and monitoring messages and generic S3 storage
labels. Regression checks verify meanings, exact corrections, source tokens, key
order and idempotent repairs. The short translation audit records current
progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/25e6b0f917396c39609d7a471ed03f90bbfcf4c4">Repair Slovenian migration status and browser guidance</a>. Thanks to xet7.</summary>

Correct 24 values across both Slovenian locales. Restore migration pause/stop
and success/failure distinctions, latest-structure progress and
background/browser timing guidance. Regression checks verify meanings, exact
corrections, source tokens, key order and idempotent repairs. The short
translation audit records current progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1220d61867405c9b5a5b433268055b075217c185">Repair Slovenian storage migration limits and upload labels</a>. Thanks to xet7.</summary>

Correct 24 values across both Slovenian locales. Preserve CPU threshold
exceedance, batch-size and delay ranges, byte units and generic S3 storage.
Regression checks verify meanings, exact corrections, source tokens, key order
and idempotent repairs. The short translation audit records current progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c54dc69c18be924a2c32dc7a7efe4e8b2810e559">Repair Slovenian import and invitation instructions</a>. Thanks to xet7.</summary>

Correct 24 values across both Slovenian locales. Preserve import attachment
structure, unmapped-member fallback, registration invitation meanings and
keyboard-shortcut toggle instructions. Regression checks verify meanings, exact
corrections, source tokens, key order and idempotent repairs. The short
translation audit records current progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6d795593f0ae9891e3dcfb23d46b8ed3af722f99">Repair Slovenian search status and checklist visibility messages</a>. Thanks to xet7.</summary>

Correct 30 values across both Slovenian locales. Restore end-date presence,
public/private board scope, member/assignee alternatives, GridFS storage labels
and all/checked checklist distinctions. Regression checks verify meanings, exact
corrections, source tokens, key order and idempotent repairs. The short
translation audit records current progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cabc9c93ef1c8e919e03a61b5dce094291c92e7f">Repair Slovenian search operator descriptions and examples</a>. Thanks to xet7.</summary>

Correct 32 values across both Slovenian locales. Preserve exact search syntax,
label alternatives, inclusive day limits, board-scoped organization/team
matches, page limits and descending sorts. Regression checks verify meanings,
exact corrections, source tokens, key order and idempotent repairs. The short
translation audit records current progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f801e3f324bb05387e824281ad486d03e00ee558">Repair Slovenian search instructions and file URL migration messages</a>. Thanks to xet7.</summary>

Correct 36 values across both Slovenian locales. Preserve search OR/AND
semantics, archived-card defaults, literal examples and source placeholders.
Restore file/avatar storage-backend and broken-reference repair descriptions.
Regression checks verify meanings, exact corrections, tokens, key order and
idempotent repairs. The short translation audit records current progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cacb6a910f4f3824ce5298defa80f96810f20c64">Repair Slovenian due card filters and vote date messages</a>. Thanks to xet7.</summary>

Correct 36 values across both Slovenian locales. Restore due-card permission
restrictions, vote end dates, CSV/TSV separator meanings, file reports and week
filters. Regression checks verify meanings, exact corrections, source tokens,
key order and idempotent repairs. The short translation audit records current
progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/234c3606255e1a8d7c2fd00389bf369164e2658c">Repair Slovenian deletion safeguards and custom logo translations</a>. Thanks to xet7.</summary>

Correct 50 values across both Slovenian locales. Preserve irreversible-deletion
warnings, membership safeguards, linked-card deletion order and
empty-duplicate-list conditions. Restore custom-logo and URL labels while
retaining literal space entities and default height. Regression checks verify
meanings, exact corrections, source tokens, key order and idempotent repairs;
the short translation audit records current progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e0ff5f86d23e9ec6fab0b75a7cdf80bfb709f575">Repair Slovenian migration messages and string template placeholder</a>. Thanks to xet7.</summary>

Correct 50 values across both Slovenian locales. Restore the literal `%{value}`
custom-field placeholder, creation-time sorting and board conversion,
scheduled-job and migration meanings. Regression checks cover meaning
distinctions, exact corrections, source tokens, key order and idempotent
repairs. The short audit records 4,505 corrected findings and 11,437 pending
findings.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e57c76c363b0f15ae639e280ba7475d31e6f997f">Fix Slovenian board and checklist translations</a>. Thanks to xet7.</summary>

Correct 66 values across both Slovenian locales and retain four correct Azure
navigation values. Restore board scheduling statuses, assigned-card and
comment-only restrictions, checklist/item distinctions and mini-card sorting.
Regression checks verify meaning, exact corrections, retained reviews, source
tokens, key order and idempotent repairs. The short audit records 4,455
corrected findings and 11,487 pending findings.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c7b7fa48b85bbe273220a965b2115b864c82a6de">Repair Slovenian user permissions and attachment translations</a>. Thanks to xet7.</summary>

Correct 64 values across both Slovenian locales. Remove invented payroll
restrictions and restore user permissions, workspace controls, attachment
storage, URL schemes and avatar messages. Regression checks cover meaning
distinctions, exact corrections, placeholders, key order and idempotent repairs.
The short audit records 4,389 corrected findings and 11,557 pending findings.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2865c4f73203f96c401d78e5010a17bb6de0f1e0">Fix Slovenian date activity and scheduled job translations</a>. Thanks to xet7.</summary>

Correct 20 values across both Slovenian locales, including date/card argument
order and checklist placeholders. Regression checks verify actual rendering,
meanings, source tokens, exact corrections, key order and idempotent repairs.
The short translation audit summary records 4,325 corrected findings and 11,621
pending findings.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e83aeb7fa">Repair Slovenian lockout status and mention messages</a>. Thanks to xet7.</summary>

Correct 20 flagged values across both Slovenian locales. Regressions and actual
rendering verify credential distinctions, seconds and mention placeholders.
Meaning, source-token, exact-value, key-order and repair checks pass. Audit.md
records current progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/08767492a">Repair Slovenian accessibility and account protection messages</a>. Thanks to xet7.</summary>

Correct 20 flagged values across both Slovenian locales. Regressions verify
accessibility status, unlock-all scope, seconds and failed-attempt thresholds.
Meaning, source-token, exact-value, key-order and repair checks pass. Audit.md
records current progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c3227b021">Repair Slovenian memory metrics and retain valid reactivity labels</a>. Thanks to xet7.</summary>

Correct 22 flagged values and retain 2 reviewed correct labels. Regressions
verify resident memory, executable-code and peak-malloc meanings. Source-token,
exact-value, key-order and repair/review checks pass. Audit.md records current
progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/494b42c98">Repair Slovenian wait indicators and memory labels</a>. Thanks to xet7.</summary>

Correct 16 flagged values across both Slovenian locales. Positive and negative
regressions verify target language, double-bounce, bit-pattern and malloc
meanings. Source-token, exact-value, key-order and repair checks pass. Audit.md
records current progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a9d0e4ebd">Finish flagged Bosnian translation repairs</a>. Thanks to xet7.</summary>

Correct the final 30 flagged Bosnian values. Regressions verify support access,
irreversible deletion, integer heights, keyboard ranges, voting identity and
literal filter examples. Meaning, source-token, target-script, exact-value,
rendering, key-order and repair checks pass; progress tests confirm zero pending
Bosnian findings. Audit.md records current progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ada3af19c">Repair Bosnian migration steps and starred board help</a>. Thanks to xet7.</summary>

Correct 14 flagged values. Regressions verify starred-board ordering, week
start, empty duplicates and migration entity names. Meaning, source-token,
target-script, exact-value, rendering, key-order and repair checks pass.
Audit.md records current progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/79d7fe500">Repair Bosnian minicard display and field sum labels</a>. Thanks to xet7.</summary>

Correct 10 flagged values. Regressions verify summed field values, per-list
counts and minicard display scope. Meaning, source-token, target-script,
exact-value, rendering, key-order and repair checks pass. Audit.md records
current progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1b9f93cbc">Repair Bosnian search scope and swimlane controls</a>. Thanks to xet7.</summary>

Correct 10 flagged values. Regressions verify full search scope, literal
commands, pixel units, WIP limits and assigned-card filtering. Meaning,
source-token, target-script, exact-value, rendering, key-order and repair checks
pass. Audit.md records current progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f85e912ad">Repair Bosnian S3 settings and backup translations</a>. Thanks to xet7.</summary>

Correct 10 flagged values. Regressions verify MinIO choice, literal endpoints
and region, secret-key authentication, TLS and board backup. Meaning,
source-token, target-script, exact-value, rendering, key-order and repair checks
pass. Audit.md records current progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a1fbf5932">Repair Bosnian restoration warnings and S3 labels</a>. Thanks to xet7.</summary>

Correct 8 flagged values. Regressions verify restoration warnings, non-archived
scope, field identifiers and S3 authentication. Meaning, source-token,
target-script, exact-value, rendering, key-order and repair checks pass.
Audit.md records current progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1b835520a">Repair Bosnian recovery and migration confirmations</a>. Thanks to xet7.</summary>

Correct 8 flagged values. Regressions verify recovery entities, literal field
identifiers and migration confirmation conditions. Meaning, source-token,
target-script, exact-value, rendering, key-order and repair checks pass.
Audit.md records current progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d416cecea">Repair Bosnian rule actions and assigned read role</a>. Thanks to xet7.</summary>

Correct 12 flagged values. Positive and negative regressions verify movement
direction, unchecking, value clearing and the assigned-only no-edit restriction.
Source-token, target-script, exact-value, rendering, key-order and repair checks
pass. Audit.md records dated progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/46772a986">Repair Bosnian board visibility and rule guidance</a>. Thanks to xet7.</summary>

Correct 12 flagged values. Positive and negative regressions verify board
editing restrictions, invitation scope, permanent deletion and rule matching.
Source-token, target-script, exact-value, rendering, key-order and repair checks
pass. Audit.md records dated progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/765ec8f9d">Repair Bosnian query validation and notification messages</a>. Thanks to xet7.</summary>

Correct 12 flagged values. Positive and negative regressions and real rendering
verify notification scope, debug predicates, numeric limits and login links.
Source-token, target-script, exact-value, key-order and repair checks pass.
Audit.md records dated progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1629b780b">Repair Bosnian My Cards and role descriptions</a>. Thanks to xet7.</summary>

Correct 12 flagged values. Positive and negative regressions and real count
rendering verify My Cards labels, checklist ordering and role restrictions.
Source-token, target-script, exact-value, key-order and repair checks pass.
Audit.md records dated progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5f8e5f9a2">Repair Bosnian attachment movement and migration permissions</a>. Thanks to xet7.</summary>

Correct 12 flagged values. Positive and negative regressions verify
administrator restrictions, board-specific attachment scope, storage
destinations and monitoring failures. Source-token, target-script, exact-value,
rendering, key-order and repair checks pass. Audit.md records dated progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4f256268d">Repair Bosnian migration outcomes and browser warnings</a>. Thanks to xet7.</summary>

Correct 12 flagged values. Positive and negative regressions verify background
continuation, browser warnings, stop-all scope and migration outcomes.
Source-token, target-script, exact-value, rendering, key-order and repair checks
pass. Audit.md records dated progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ee612082c">Repair Bosnian migration limits and storage labels</a>. Thanks to xet7.</summary>

Correct 12 flagged values. Positive and negative regressions verify byte units,
storage scope, CPU comparison and exact batch/delay ranges. Source-token,
target-script, exact-value, rendering, key-order and repair checks pass.
Audit.md records dated progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/a2ae2424b">Repair Bosnian keyboard toggles and list deletion messages</a>. Thanks to xet7.</summary>

Correct 12 flagged values. Positive and negative regressions verify click
instructions, registration invitations, filename cancellation and
deletion/departure scope. Source-token, target-script, exact-value, rendering,
key-order and repair checks pass. Audit.md records dated progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7f1fcba79">Repair Bosnian board import and member mapping help</a>. Thanks to xet7.</summary>

Correct 10 flagged values. Positive and negative regressions verify export
direction, literal Trello menus, ZIP attachment scope and member-mapping
fallback. Source-token, target-script, exact-value, rendering, key-order and
repair checks pass. Audit.md records dated progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6a97ff0b6">Repair Bosnian GridFS and checklist visibility translations</a>. Thanks to xet7.</summary>

Correct 12 flagged values. Positive and negative regressions verify public-board
scope, GridFS storage and checklist/minicard visibility distinctions.
Source-token, target-script, exact-value, rendering, key-order and repair checks
pass. Audit.md records dated progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e33acd052">Repair Bosnian search status and assignment translations</a>. Thanks to xet7.</summary>

Correct 12 flagged values. Positive and negative regressions verify end-date
status, private-board scope, board assignment, descending sort and modification
bounds. Source-token, target-script, exact-value, rendering, key-order and
repair checks pass. Audit.md records dated progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/abd8c53dd">Repair Bosnian search operator translations</a>. Thanks to xet7.</summary>

Correct 12 flagged values. Positive and negative regressions verify literal
operator syntax, negation, label alternatives, creation bounds and integer page
limits. Source-token, target-script, exact-value, rendering, key-order and
repair checks pass. Audit.md records dated progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4cca1809a">Repair Bosnian migration and global search help</a>. Thanks to xet7.</summary>

Correct 12 flagged values. Positive and negative regressions verify migration
repair scope, Boolean search, literal query examples and archive exclusion.
Source-token, target-script, exact-value, rendering, key-order and repair checks
pass. Audit.md records dated progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/172413419">Repair Bosnian file URL help and filter translations</a>. Thanks to xet7.</summary>

Correct 16 flagged values. Positive and negative regressions verify file-repair
scope, CSV/TSV separators, PDF export and week filters. Source-token,
target-script, exact-value, rendering, key-order and repair checks pass.
Audit.md records dated progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/705fbcf57">Repair Bosnian invitation emails and due card controls</a>. Thanks to xet7.</summary>

Correct 16 flagged values. Positive and negative regressions and real rendering
verify invitation scope, email placeholders, due-card permissions and vote end
dates. Source-token, target-script, exact-value, key-order and repair checks
pass. Audit.md records dated progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c08f60d0a">Repair Bosnian duplicate list and deletion restrictions</a>. Thanks to xet7.</summary>

Correct 16 flagged values. Positive and negative regressions verify
empty-duplicate conditions, membership blockers, irreversible deletion and
linked-card direction. Source-token, target-script, exact-value, rendering,
key-order and repair checks pass. Audit.md records dated progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4dbfcd59e">Repair Bosnian deletion warnings and custom URL translations</a>. Thanks to xet7.</summary>

Correct 18 flagged values. Positive and negative regressions verify irreversible
deletion scope, image/link URLs, empty duplicate lists, HTML entities and
default height. Source-token, target-script, exact-value, rendering, key-order
and repair checks pass. Audit.md records dated progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/8ee99e1e9">Repair Bosnian creation dates and scheduled job translations</a>. Thanks to xet7.</summary>

Correct 18 flagged values. Positive and negative regressions verify
creation-date ordering, template label identity and scheduled-job results.
Source-token, target-script, exact-value, rendering, key-order and repair checks
pass. Audit.md records dated progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/803b62c2d">Repair Bosnian checklist and card access translations</a>. Thanks to xet7.</summary>

Correct 18 flagged values. Positive and negative regressions verify
checklist/item deletion distinctions, comment-only restrictions, minicard
sorting and conversion scope. Source-token, target-script, exact-value,
rendering, key-order and repair checks pass. Audit.md records dated progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6a959f3a6">Repair Bosnian board scheduling and settings translations</a>. Thanks to xet7.</summary>

Correct 16 flagged values. Positive and negative regressions verify scheduling
results, All Boards scope, board-icon instructions and archived-card visibility.
Source-token, target-script, exact-value, rendering, key-order and repair checks
pass. Audit.md records dated progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2a4f699e4">Repair Bosnian attachment storage and avatar translations</a>. Thanks to xet7.</summary>

Correct 18 flagged values. Positive and negative regressions verify storage
destinations, clickable URL schemes, automatic user addition, avatar limits and
new-card scope. Source-token, target-script, exact-value, rendering, key-order
and repair checks pass. Audit.md records dated progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/47b2d6b12">Repair Bosnian administration and workspace translations</a>. Thanks to xet7.</summary>

Correct 20 flagged values. Positive and negative regressions verify
member-removal permission, activation, logged-in scope, literal HTML and the
refresh data-loss warning. Source-token, target-script, exact-value, rendering,
key-order and repair checks pass. Audit.md records dated progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ca539fbe7">Repair Bosnian date activities and reminders</a>. Thanks to xet7.</summary>

Correct 20 flagged values, restoring first-reminder, due-now and custom-field
clearing meanings. Positive and negative regressions and actual i18next/sprintf
rendering verify dates and mentions. Source-token, target-script, exact-value,
key-order and repair checks pass. Audit.md records dated progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/24a1d388c">Repair Bosnian account lockout translations</a>. Thanks to xet7.</summary>

Correct 18 flagged values. Positive and negative regressions verify credential
distinctions, seconds, unlock-all scope and self-deletion. Source-token,
target-script, exact-value, key-order and repair checks pass. Audit.md records
dated progress and the correction commit.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/48b6b1bb2">Repair Bosnian memory, wait indicators and accessibility translations</a>. Thanks to xet7.</summary>

Replace 21 flagged Serbian-seeded values and finish an older JSON sample repair
while preserving literal field names. Positive and negative regressions verify
memory metrics and wait indicators; source-token, exact-value, key-order and
repair checks pass. Audit.md records the dated commit and remaining findings.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0c5a561c8">Finish flagged Croatian translation repairs</a>. Thanks to xet7.</summary>

Correct the final 26 flagged Croatian values, including irreversible deletion
warnings, keyboard toggles, voter identity, filter help and Hijri calendar
distinctions. Positive and negative meaning, source-token, exact-value,
rendering, key-order and repair checks pass; progress tests verify the Croatian
audit queue is empty. Audit.md records the dated commit and updated overall
totals.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2019869c7">Repair Croatian migration steps and support access labels</a>. Thanks to xet7.</summary>

Correct 20 reviewed values. Positive and negative regressions verify
starred-board ordering, support access and migration entity names. Source-token,
target-script, exact-value, rendering, key-order and repair checks pass.
Audit.md records dated progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/13200137a">Repair Croatian swimlane and minicard display controls</a>. Thanks to xet7.</summary>

Correct 16 reviewed values. Positive and negative regressions verify pixel
units, field sums, All Boards wording and assignment filters. Source-token,
target-script, exact-value, rendering, key-order and repair checks pass.
Audit.md records dated progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/6de9e9203">Repair Croatian S3 and search settings</a>. Thanks to xet7.</summary>

Correct 16 reviewed values. Positive and negative regressions verify MinIO
support, search scope and literal endpoint and troubleshooting examples.
Source-token, target-script, exact-value, rendering, key-order and repair checks
pass. Audit.md records dated progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c5452ab2a">Repair Croatian recovery scope and migration confirmations</a>. Thanks to xet7.</summary>

Correct 12 reviewed values. Positive and negative regressions verify recovery
entity types, non-archived scope, undo warning and literal storage fields.
Source-token, target-script, exact-value, rendering, key-order and repair checks
pass. Audit.md records dated progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/02e229d33">Repair Croatian read-only roles and recovery messages</a>. Thanks to xet7.</summary>

Correct 14 reviewed values. Positive and negative regressions verify no-edit
restrictions, label range, removal notifications and recovery entity types.
Source-token, target-script, exact-value, rendering, key-order and repair checks
pass. Audit.md records dated progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/58f0d7b06">Repair Croatian rule actions and public-board invitations</a>. Thanks to xet7.</summary>

Correct 16 reviewed values. Positive and negative regressions verify
public-board editing, invitation meaning, move direction and unchecking.
Source-token, target-script, exact-value, rendering, key-order and repair checks
pass. Audit.md records dated progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/38050f251">Repair Croatian query validation and private-board messages</a>. Thanks to xet7.</summary>

Correct 12 reviewed values. Positive and negative regressions verify integer
limits, private-board access and actual operator/login-link rendering.
Source-token, target-script, exact-value, key-order and repair checks pass.
Audit.md records dated progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/4004c2ebd">Repair Croatian card views and assigned-only permissions</a>. Thanks to xet7.</summary>

Correct 14 reviewed values. Positive and negative regressions verify
assigned-only visibility, notification scope, checklist order and actual count
rendering. Source-token, target-script, exact-value, key-order and repair checks
pass. Audit.md records dated progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/be37a2c32">Repair Croatian attachment movement and card sorting labels</a>. Thanks to xet7.</summary>

Correct 12 reviewed values. Positive and negative regressions verify attachment
scope, S3 wording, checkbox selection and My Cards sorting labels. Source-token,
target-script, exact-value, rendering, key-order and repair checks pass.
Audit.md records dated progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/60f647915">Repair Croatian migration status and operating limits</a>. Thanks to xet7.</summary>

Correct 20 reviewed values. Positive and negative regressions verify CPU
thresholds, timing ranges, background continuation, browser warnings and
administrator restrictions. Source-token, target-script, exact-value, rendering,
key-order and repair checks pass. Audit.md records dated progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b238c35f2">Repair Croatian list warnings and storage migration controls</a>. Thanks to xet7.</summary>

Correct 16 reviewed values. Positive and negative regressions verify
irreversible list deletion, board-departure scope, byte units, batch limits and
S3 wording. Source-token, target-script, exact-value, rendering, key-order and
repair checks pass. Audit.md records dated progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/95f1b2a53">Repair Croatian member mapping and keyboard toggles</a>. Thanks to xet7.</summary>

Correct 12 reviewed values. Positive and negative regressions verify member
fallback, registration wording, keyboard toggle direction and label history
loss. Source-token, target-script, exact-value, rendering, key-order and repair
checks pass. Audit.md records dated progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f110128f6">Repair Croatian checklist visibility and board import instructions</a>. Thanks to xet7.</summary>

Correct 15 reviewed values. Positive and negative regressions verify export
direction, literal Trello menu names and checklist visibility wording.
Source-token, target-script, exact-value, rendering, key-order and repair checks
pass. Audit.md records dated progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/23bd5535a">Repair Croatian organization and status search operators</a>. Thanks to xet7.</summary>

Correct 12 reviewed values. Positive and negative regressions verify end-date
status, board visibility, organization assignment and descending-sort syntax.
Source-token, target-script, exact-value, rendering, key-order and repair checks
pass. Audit.md records dated progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/89b2b4802">Repair Croatian field and label search instructions</a>. Thanks to xet7.</summary>

Correct seven reviewed values. Positive and negative regressions verify field
query syntax, color-or-name matching and positive integer limits. Source-token,
target-script, exact-value, rendering, key-order and repair checks pass.
Audit.md records dated progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/11734e472">Repair Croatian date and user search operators</a>. Thanks to xet7.</summary>

Correct eight reviewed values. Positive and negative regressions verify literal
user syntax, at-most date ranges and assignment terminology. Source-token,
target-script, exact-value, rendering, key-order and repair checks pass.
Audit.md records dated progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/885563f36">Repair Croatian migration and Boolean search instructions</a>. Thanks to xet7.</summary>

Correct 12 reviewed values. Positive and negative regressions verify executable
query examples, OR/AND and case-insensitive search meanings. Source-token,
target-script, exact-value, rendering, key-order and repair checks pass.
Audit.md records dated progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5a9354543">Repair Croatian verification, errors and filter labels</a>. Thanks to xet7.</summary>

Correct 16 reviewed values. Positive and negative regressions verify
account-email verification, CSV requirements, week filters and URL repair
meanings. Source-token, target-script, exact-value, rendering, key-order and
repair checks pass. Audit.md records dated progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/00c8c7b1f">Repair Croatian account emails and due-card views</a>. Thanks to xet7.</summary>

Correct 14 reviewed values. Positive and negative regressions verify invitation
meaning, actual email interpolation and due-card permission scope. Source-token,
target-script, exact-value, rendering, key-order and repair checks pass.
Audit.md records dated progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/564bd800b">Repair Croatian organization and account deletion messages</a>. Thanks to xet7.</summary>

Correct 12 reviewed values. Positive and negative regressions verify
irreversible deletion, existing-member restrictions and subtask destinations.
Source-token, target-script, exact-value, rendering, key-order and repair checks
pass. Audit.md records dated progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3b4f99d24">Repair Croatian custom URLs and deletion prompts</a>. Thanks to xet7.</summary>

Correct 16 reviewed values. Positive and negative regressions verify URL scope,
default logo height, irreversible deletion, duplicate-empty-list conditions and
linked-card deletion order. Source-token, target-script, exact-value, rendering,
key-order and repair checks pass. Audit.md records dated progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f1914d07d">Repair Croatian scheduled migrations and template placeholder</a>. Thanks to xet7.</summary>

Correct 16 reviewed values. Positive and negative regressions verify literal
template tokens, separator entities and irreversible field deletion.
Source-token, target-script, exact-value, rendering, key-order and repair checks
pass. Audit.md records dated progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/56454dbf9">Repair Croatian checklist forms and board conversion messages</a>. Thanks to xet7.</summary>

Correct 18 reviewed values. Positive and negative regressions verify
comment-only permissions, creation-date ordering, checklist forms and normal
board use during conversion. Source-token, target-script, exact-value,
rendering, key-order and repair checks pass. Audit.md records dated progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3ace61f58">Repair Croatian board settings and checklist controls</a>. Thanks to xet7.</summary>

Correct 20 reviewed values. Positive and negative regressions verify All Boards
settings, checklist/item deletion, membership/assignment and archive restoration
meanings. Source-token, target-script, exact-value, rendering, key-order and
repair checks pass. Audit.md records dated progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/685e388ab">Repair Croatian storage paths and scheduled board operations</a>. Thanks to xet7.</summary>

Correct 18 reviewed values. Positive and negative regressions verify URL-scheme
instructions, new-card field scope, board-icon actions and scheduled results.
Source-token, target-script, exact-value, rendering, key-order and repair checks
pass. Audit.md records dated progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/78c5f9b42">Repair Croatian user status and attachment settings</a>. Thanks to xet7.</summary>

Correct 18 reviewed values. Positive and negative regressions verify account
activation, logged-in user scope, data-loss warnings and S3 wording.
Source-token, target-script, exact-value, rendering, key-order and repair checks
pass. Audit.md records dated progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/40db24a44">Repair Croatian administration and custom-field activities</a>. Thanks to xet7.</summary>

Correct 16 reviewed values. Regressions verify date/card rendering,
inactive-user and field-clearing meanings, administrator actions and literal
HTML delimiters. Source-token, target-script, exact-value, key-order and repair
checks pass. Audit.md records dated progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2df7a4d02">Repair Croatian lockout results and date activities</a>. Thanks to xet7.</summary>

Correct 16 reviewed values. Positive and negative regressions verify
first-reminder and due-now meanings, actual old/new time interpolation and
date/card sprintf order. Source-token, target-script, exact-value, key-order and
repair checks pass. Audit.md records dated progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e2e15108e">Repair Croatian accessibility and account protection translations</a>. Thanks to xet7.</summary>

Correct 18 reviewed values. Positive and negative regressions verify target
script, accessibility terminology, credential meanings and timing units.
Source-token, exact-value, key-order and repair checks pass. Audit.md records
dated progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/482ea38b9">Repair Croatian memory metrics and wait indicators</a>. Thanks to xet7.</summary>

Replace 18 Serbian-seeded values with Croatian wording. Positive and negative
regressions verify target script, V8 metric and indicator meanings.
Source-token, exact-value, key-order and repair checks pass. Audit.md records
dated progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d3569c77e">Finish flagged Macedonian translation repairs</a>. Thanks to xet7.</summary>

Correct the final 28 flagged values. Regressions verify executable filter
examples, integer heights, shortcut ranges, voting visibility and zero remaining
Macedonian audit findings. Source-token, exact-value, rendering, key-order and
repair checks pass. Audit.md records completion of this locale queue and the
remaining multilingual work.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ece4315d2">Repair Macedonian SMTP, migration steps and subtask controls</a>. Thanks to xet7.</summary>

Correct 25 reviewed values. Regressions verify outgoing-email, starred-board
ordering, support access and subtask meanings. Source-token, exact-value,
rendering, key-order and repair checks pass. Audit.md records dated progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5ef5b155b">Repair Macedonian display settings and retain valid sidebar translations</a>. Thanks to xet7.</summary>

Correct 18 reviewed values and retain two correct sidebar translations.
Regressions verify parent-card and field-sum meanings, All Boards wording and
unchanged sidebar imperatives. Source-token, exact-value, rendering, key-order
and repair checks pass. Audit.md records dated progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b9da2ea97">Repair Macedonian S3 settings and search instructions</a>. Thanks to xet7.</summary>

Correct 20 reviewed values. Regressions verify MinIO support, search scope,
literal endpoint examples and troubleshooting commands, and pixel units.
Source-token, exact-value, rendering, key-order and repair checks pass. Audit.md
records dated progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c9fe9530a">Repair Macedonian recovery and migration confirmations</a>. Thanks to xet7.</summary>

Correct 20 reviewed values. Regressions verify archived recovery, non-archived
scope, undo warnings, duplicate-empty-list conditions and literal storage
fields. Source-token, exact-value, rendering, key-order and repair checks pass.
Audit.md records dated progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1c6281af5">Repair Macedonian rule actions and read-only permissions</a>. Thanks to xet7.</summary>

Correct 24 reviewed values. Positive and negative regressions verify move
direction, no-edit restrictions, label range and removal notification meanings.
Source-token, exact-value, rendering, key-order and repair checks pass. Audit.md
records dated fixes and remaining findings.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3e099f4d5">Repair Macedonian validation, visibility and invitation messages</a>. Thanks to xet7.</summary>

Correct 20 reviewed values. Positive and negative regressions verify
positive-integer limits, invitation and editing restrictions, operator
interpolation and login-link rendering. Source-token, exact-value, key-order and
repair checks pass. Audit.md records dated fixes and remaining findings.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0effcb85e">Repair Macedonian card views, permissions and notifications</a>. Thanks to xet7.</summary>

Correct 25 reviewed values. Positive and negative checks verify assigned-only
visibility, settings restrictions, creator-or-member notifications, S3 wording
and actual card-count rendering. Source-token, exact-value, key-order and repair
checks pass. Audit.md records dated fixes and remaining findings.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f98c708e6">Repair Macedonian storage migration and monitoring messages</a>. Thanks to xet7.</summary>

Correct 29 reviewed values. Positive and negative checks verify numeric limits,
CPU threshold semantics, background continuation, browser warnings,
administrator restrictions and S3 labels. Source-token, exact-value, rendering,
key-order and repair checks pass. Audit.md records dated fixes and remaining
findings.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9fdbf2017">Repair Macedonian list controls and deletion warnings</a>. Thanks to xet7.</summary>

Correct 23 reviewed values. Regressions verify keyboard-toggle click
instructions, irreversible list deletion, the last-administrator restriction and
actual list-name sprintf rendering. Source-token, exact-value, key-order and
repair checks pass. Audit.md records dated progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f90ea9ac6">Repair Macedonian import and registration instructions</a>. Thanks to xet7.</summary>

Correct 16 values, including export menu wording, member mapping and
registration invitations. Positive and negative regressions verify the export
action and literal Trello menu names, alongside source tokens, exact values,
rendering and key order. Audit.md records dated progress.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/17efcc8ea">Repair Macedonian status, storage and checklist controls</a>. Thanks to xet7.</summary>

Correct 20 reviewed values, restoring end-date status, board visibility, GridFS
attachments and checklist terminology. Positive and negative meaning,
source-token, rendering, exact-value and key-order checks pass. Audit.md records
dated progress and remaining findings.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/ba2501e59">Repair Macedonian search operator meanings and literal examples</a>. Thanks to xet7.</summary>

Correct 12 search instructions, preserving query tokens and restoring `has:-due`
and label color-or-name matching. Regression checks verify literal syntax,
meaning, placeholders, exact values and key order. Translation Audit.md records
dated fixes and remaining findings.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c1dbea086">Repair Macedonian Boolean search and operator examples</a>. Thanks to xet7.</summary>

Correct 10 reviewed values. Positive and negative checks verify Boolean
meanings, case-insensitivity, literal query examples, source tokens, exact
values, key order and repair behavior. These checks pass. Further findings
remain under review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b3d08cb3e">Repair Macedonian migration and search instructions</a>. Thanks to xet7.</summary>

Correct 10 reviewed values, restoring literal search syntax and operator
meaning. Positive and negative exact-value, source-token, key-order and repair
checks pass. Further locale findings remain under review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f2db91a46">Repair Macedonian error, report and filter translations</a>. Thanks to xet7.</summary>

Correct 20 reviewed values, restoring organization, team, file-report and
filter meanings. Positive and negative exact-value, rendering, source-token,
key-order and repair checks pass. Further findings remain under review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/5a4931860">Repair Macedonian invitation email and permission translations</a>. Thanks to xet7.</summary>

Correct 12 reviewed values, preserving account, board, URL and invitation-code
placeholders. Restore invitation meaning without claiming full access. Positive
and negative exact-value, source-token, rendering, key-order and repair checks
pass. Further findings remain under review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/999de898d">Repair Macedonian date popup and enrollment translations</a>. Thanks to xet7.</summary>

Correct 15 reviewed values, distinguishing date types and restoring sorting
and card-creator meaning. Positive and negative exact-value, rendering,
source-token, key-order and repair checks pass. Further findings remain under
review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fb82ac133">Repair Macedonian deletion and duplicate-list help</a>. Thanks to xet7.</summary>

Correct 20 reviewed values, preserving both duplicate-list deletion conditions
and restoring team, organization and kanban terminology. Positive and negative
exact-value, rendering, source-token, key-order and repair checks pass.
Further findings remain under review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/3c7b1a181">Repair Macedonian custom settings and template token</a>. Thanks to xet7.</summary>

Correct 20 reviewed values and restore the literal %{value} template token.
Positive and negative exact-value, rendering, source-token, key-order and
repair checks pass. Further findings remain under review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/1c1fbdfb0">Repair Macedonian scheduled job and creation date translations</a>. Thanks to xet7.</summary>

Correct 15 reviewed values, restoring creation-date sorting and migration
meanings. Positive and negative exact-value, source-token, key-order and repair
checks pass. Further locale findings remain under review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/e91e84557">Repair Macedonian comments and conversion help</a>. Thanks to xet7.</summary>

Correct 15 reviewed values in comments, checklist forms, favorites and board
conversion instructions. Positive and negative exact-value, rendering,
source-token, key-order and repair checks pass. Further findings remain under
review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7e0ce1e47">Repair Macedonian card and checklist control translations</a>. Thanks to xet7.</summary>

Correct 25 reviewed values, restoring kanban meanings in card, assignee,
checklist, planning and report controls. Positive and negative exact-value,
source-token, rendering, key-order and repair checks pass. Further findings
remain under review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f33aff4ed">Repair Macedonian board scheduling and background translations</a>. Thanks to xet7.</summary>

Correct 15 reviewed values, restoring scheduling, migration, settings and
visibility meanings. Positive and negative exact-value, source-token,
rendering, key-order and repair checks pass. Further findings remain under
review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/b00c7da30">Repair Macedonian storage and workspace translations</a>. Thanks to xet7.</summary>

Correct 25 reviewed values, restoring source meanings for workspace editing,
logged-in users, account status and URL schemes. Positive and negative
rendering, exact-value, source-token, key-order and repair checks pass.
Further locale findings remain under review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/719ffbd7a">Repair Macedonian dates and administration labels</a>. Thanks to xet7.</summary>

Correct 25 reviewed values, replacing payroll descriptions with active/inactive
account meaning. Positive and negative checks verify actual rendering of all
four date activity types, source tokens, exact values, key order and repair
behavior. These checks pass. Further findings remain under review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/08d622a8b">Repair Macedonian imports and checklist activity translations</a>. Thanks to xet7.</summary>

Correct 20 reviewed values. Positive and negative checks verify first-reminder
meaning, undoing checklist completion, actual due-date/card sprintf order,
source placeholders, exact values, key order and idempotency. These checks
pass. Further findings remain under review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/538b8aca6">Repair Macedonian date and archive activity translations</a>. Thanks to xet7.</summary>

Correct 20 reviewed values. Positive and negative checks verify actual
i18next/sprintf rendering, checklist-removal meaning, native labels,
source tokens, key order and idempotency. These checks pass. Further
findings remain under review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/f351a8a18">Repair Macedonian account protection and accessibility translations</a>. Thanks to xet7.</summary>

Correct 24 reviewed values and retain a valid reactivity-mode label. Positive
and negative exact-value, source-token, key-order, idempotency and preservation
checks pass. Further locale findings remain under review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/47924c0f4">Repair Macedonian rule and memory statistic translations</a>. Thanks to xet7.</summary>

Correct 25 reviewed values. Check V8 metric meanings against official Node
documentation, retaining technical identifiers. Positive and negative exact
value, source-token, key-order, idempotency and preservation checks pass.
Further findings remain under review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/83277d852">Repair Bulgarian-seeded Macedonian activity translations</a>. Thanks to xet7.</summary>

Correct 22 reviewed values, including basic list and swimlane labels. Restore
checklist-removal meaning while preserving source tokens. Positive and negative
exact-value, placeholder, JSON/key-order, idempotency and preservation checks
pass. Further locale findings remain under review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/fc1026c82">Finish German translation audit queues</a>. Thanks to xet7.</summary>

Correct four SMTP subject compounds and retain four individually reviewed
valid soft WIP labels. Positive and negative correction and review checks
verify exact values, source tokens, key order, idempotency and zero pending
German findings. These checks pass. Other locale findings remain under review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bd9043aa8">Finish all audited Slovak translation repairs</a>. Thanks to xet7.</summary>

Correct the final 59 values and retain three individually reviewed valid
strings. The Slovak audit queue is complete. Positive and negative tests
verify native vocabulary, filter examples, troubleshooting commands, calendar
labels, actual sprintf argument order, source placeholders and exact reviewed
values. These checks pass. Other locale findings remain under review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/550883b83">Repair Slovak list and notification translations</a>. Thanks to xet7.</summary>

Correct 35 reviewed values while preserving source placeholders and link
markup. Positive and negative vocabulary, exact-value, key-order, idempotency
and preservation checks pass. Further findings remain under review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c9ec4bb6a">Repair Slovak search operators and import instructions</a>. Thanks to xet7.</summary>

Correct 25 reviewed values, preserving literal query syntax and vendor menu
labels. Positive and negative checks distinguish members from assignees and
end dates from due dates, and verify vocabulary, placeholders and import
identifiers. These checks pass. Further findings remain under review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bc71d8991">Repair Slovak search help and case-insensitivity wording</a>. Thanks to xet7.</summary>

Correct 20 reviewed values, including the reversed meaning of case-insensitive
searches. Preserve literal query examples and operators while translating
Boolean explanations. Positive and negative vocabulary, meaning, placeholder,
query and repair checks pass. Further findings remain under review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d0e89cb3e">Repair Slovak invitations and administration translations</a>. Thanks to xet7.</summary>

Correct 43 reviewed values and retain two valid template-variable hints.
Positive and negative translation checks verify native wording, exact source
placeholders, key order, idempotency and preservation of newer wording.
Correction and unchanged-review suites pass. Further findings remain under
review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/af8df7608">Repair Slovak archive warnings and card controls</a>. Thanks to xet7.</summary>

Correct 38 reviewed values and retain two valid Azure navigation instructions.
Positive and negative checks verify deletion warnings, Slovak vocabulary,
literal JSON fields, template placeholders, separator entities and exact
correction/review values. These checks pass. Further findings remain under
review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/27256c348">Repair Slovak checklist activities and date messages</a>. Thanks to xet7.</summary>

Correct 34 Czech-seeded strings and individually retain a valid technical
label. Positive and negative checks verify checklist action meanings,
Slovak vocabulary and real sprintf date/card argument order. Correction
and unchanged-review checks pass. Further locale findings remain under review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d9ac5a56f">Repair Czech-seeded Slovak activity translations</a>. Thanks to xet7.</summary>

Correct 29 reviewed activity and account-setting values. Positive and negative
repair checks verify exact values, source placeholders, key order, idempotency
and preservation of newer wording. These checks pass. Further Slovak and other
locale findings remain under review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2832477b7">Translate audited advanced-filter help in seven locales</a>. Thanks to xet7.</summary>

Replace English filter instructions with Arabic, Lithuanian, Mongolian and
Greek prose, including regional Arabic and Greek files. Translate Arabic
Trello instructions while preserving literal vendor menu names. All seven
affected audit queues are resolved. Positive and negative regression checks
verify native wording, exact query examples and escapes, Boolean operators,
regular expressions, source tokens and progress classification. These checks
pass. Other locale findings remain under review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7c1f9cc5a">Translate Hijri calendar variants and retain valid audited examples</a>. Thanks to xet7.</summary>

Correct 37 labels across 21 locale files, distinguishing lunar-sighting and
tabular astronomical-epoch calendars with regional Portuguese spelling.
Retain 38 individually reviewed comma-separated input examples and protocol
labels. Twenty additional locale audit queues are resolved. Positive and
negative checks cover terminology, exact values, actual placeholder template
usage, source tokens, key order and review classification. These checks pass;
browser regressions are registered and syntax-checked, with live Meteor
execution unavailable. Other locale findings remain under review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0432fb50a">Finish all audited Romanian translation repairs</a>. Thanks to xet7.</summary>

Correct the final 670 audited values across both Romanian locales, including
invitations, imports, permission warnings, administration, archives, search
instructions and Hijri calendar variants. Both Romanian audit queues are now
complete. Positive and negative checks cover native vocabulary, Boolean meaning,
JSON fields, executable query examples and actual date/card sprintf order.
Correction, progress and human-preference checks pass. Browser regressions are
registered and syntax-checked; live Meteor execution was unavailable.
Other locale findings remain under review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9c974f034">Repair Italian-seeded Romanian kanban labels and activity messages</a>. Thanks to xet7.</summary>

Correct 160 values across the two Romanian locales, covering account protection,
activity messages, archive actions and board settings. Remove the stray digit
from subtask notifications. Positive and negative checks verify native labels,
absence of Italian seed vocabulary, source tokens, key order and real sprintf
rendering. Repair and audit-progress tests pass. Further Romanian and other
locale findings remain under review.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9631ff40d">Repair all audited Latvian translations and finish Danish review</a>. Thanks to xet7.</summary>

Replace 402 Lithuanian-seeded Latvian strings with Latvian wording and preserve
search syntax, source placeholders, template tokens and commands. Correct two
Danish calendar labels in <a href="https://github.com/wekan/wekan/commit/ad8c1170d">the Danish calendar repair</a>; retain 19 inspected valid Danish strings with explicit reasons.
The audit progress tool accounts for every historical audit row and keeps
unreviewed work visible. The wider repair goal remains unfinished.

Positive and negative regression checks cover vocabulary, exact values,
key order, placeholders, actual sprintf argument order, Boolean search
meaning, reviewed unchanged values and progress classification. These and
the existing Latvian translation suite pass. The Latvian calendar-settings
browser regression is registered and syntax-checked; live UI execution was
unavailable.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/7a23353ac">Correct audited local translation problems</a>. Thanks to xet7.</summary>

Correct malformed card-copy JSON examples and kanban board terminology,
repair mixed-script fragments and calendar names, and replace Persian-seeded
Arabic strings in <a href="https://github.com/wekan/wekan/commit/a2639d319">the Arabic seed-language repair</a>.
Additional Mongolian corrections in <a href="https://github.com/wekan/wekan/commit/6988a01bd">the Mongolian prose repair</a> and <a href="https://github.com/wekan/wekan/commit/a194b9741">the additional Mongolian repair</a> replace Russian-seeded prose.
The dated translation audit records these batches and the remaining review.
Unicode calendar terminology is included with its license; there is no new
runtime dependency or external translation service. Dzongkha, Quechua and
Tonga examples and regional Arabic phrasing need native-speaker review.

Regression checks verify 1,158 reviewed values, exact source placeholders,
JSON examples, key order and idempotency. Applying the reviewed repair list
preserves newer translations. Human-preference and calendar-display checks
pass. The browser regression is registered and syntax-checked; the live
Meteor UI was unavailable. The wider audit and English-remnant review remain
unfinished; this entry does not claim every locale is now correct.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/17ca32a0d">Resume repairs with 90 Klingon translation corrections</a>. Thanks to xet7.</summary>

Replace German and English security states, activity messages, deletion warnings
and search help with Klingon. Preserve source placeholders, JSON property names
and executable query examples. Correction inventory, security-state, warning,
key-order, idempotency and newer-translation protection checks pass. Wording is
low confidence and remains subject to fluent-speaker review. Audit.md and
TODO Later record 12,956 corrected findings and 2,889 pending, including 271
Klingon findings.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d51ea2b92">Exclude internal tree refs from local Fossil exports</a>. Thanks to xet7.</summary>

Export branches, tags and remote branches explicitly instead of every Git ref,
preventing internal checkpoint tree warnings without deleting refs or hiding
errors. Resolve paths from the script, support filenames with spaces, preserve
existing repositories and propagate export/import failures. The companion UI
script and matching Unix/Windows menus are added in <a href="https://github.com/wekan/wekan/commit/35888eedf">the Fossil menu update</a>.
Positive and negative Git, importer-failure, existing-file and UI path checks
pass. A real Fossil 2.28 import retains history and the annotated release tag;
build-menu parity and shell syntax checks pass. Document offline local use in
[the Fossil guide](docs/DeveloperDocs/Fossil.md).

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/2a5a53cf6">Make five release scripts executable</a>. Thanks to xet7.</summary>

Set executable permissions on `releases/apt-install.sh`,
`releases/delete-tag.sh`, `releases/fetch.sh`, `releases/fossil.sh` and
`releases/npm-retry.sh` so maintainers can invoke them directly. Script contents
are unchanged. Bash syntax checks and the eight npm retry and six Fossil
regression checks pass. This permission change has no application UI behavior.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/69e4d836c">Update existing Fossil repositories incrementally</a>. Thanks to xet7.</summary>

Running `releases/fossil.sh` again adds new Git commits to the existing local
repository with `--incremental`, without force overwrite or required marks
files.
A real Fossil 2.28 regression verifies retained history, new commits and no
duplicates on repeated runs. Failure, namespace and Bash syntax checks pass.
The Fossil guide documents repeat exports and invalid interrupted repositories.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0026390bb">Parse localized search keywords containing apostrophes</a>. Thanks to xet7.</summary>

Accept straight and curly apostrophes in search operator names, enabling
Klingon keywords. Runtime regressions verify translated names, quoted values,
ordinary operators, quoted text and unknown-name errors. Card-number checks
pass. Localized browser coverage and keyword replacement remain in progress.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v11.72 2026-09-11 WeKan ® release

**In short:** Board JSON exports now complete when cards contain HTML, with
or without embedded attachments. Interrupted exports report a failed download
instead of silently saving an unfinished JSON document.

This release fixes the following bugs:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/49eaade95">Fix board JSON exports containing HTML</a>. Thanks to xet7.</summary>

The server called DOMPurify without a browser DOM, where its import has no
`sanitize` method. The first HTML-bearing card stopped the streaming export at
`"cards":[`, matching the incomplete Roadmap export. Use the MIT-licensed
`sanitize-html` 2.17.7 server parser, with no runtime Internet access, to retain
text while stripping markup. The dependency installation audit reported no known
vulnerabilities. Failed streams now abort the HTTP transfer instead of ending a
partial document with a successful response.

Regression tests execute the production writer and sanitizer in both attachment
modes, parse every exported section, compare embedded attachment bytes, and
verify failure handling. All 26 export-related Node suites passed. Browser
regressions cover both board-menu downloads and HTML-bearing card API exports;
they were syntax-checked, but could not run without a local WeKan test server.

</details>

Thanks to above GitHub users for their contributions and translators for their translations.

# v11.71 2026-09-11 WeKan ® release

**In short:** deleting an **attachment** from a card is now a **soft delete**
that the **card history** shows and restores; the only hard delete left is
deleting an archived board with permanent delete enabled. **Board Settings /
Card** gains a toggle for every card section and minicard badge and orders
**card** and **minicard** fields independently; a new **Board Settings /
Board View** chooses which views a **public** or **private** board offers,
and in what order. The **REST API** covers those and the other recent
features, and its OpenAPI spec carries the Boards API again. The **Windows
release builds** work on **Visual Studio 2026** again, and a **MongoDB 8.2**
crash loop after a full disk is explained and remediated.

This release adds the following new features:

**Attachments** - soft delete, card-history restore, and the one real delete.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/9a322618113a88e922772acb6cbca3ad45b513f2">Design: how an attachment is deleted, shown in the card history, restored and purged</a>. Thanks to xet7.</summary>

`docs/Features/Reports/History/History.md` gains section 12 and closes the
section 11 question about restoring a removed attachment. The decisions:
Delete on a card is a soft delete that keeps the file and unsets the cover;
the card, its count and the minicard badge hide a deleted attachment; the
card history shows who deleted it and when, and restores it with the same
preview and download controls the card has, but never cover or background,
because only a live attachment on a card can be either; no per-attachment
hard delete exists anywhere; and the one hard delete is Admin Panel /
Problems / Delete enabled, board archived, board deleted from the archive,
which removes the board's attachments, live and soft-deleted, with their
files.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/dce28983820f99927b2cb3626e586488c962e084">Delete soft-deletes, the card history restores, and only the archived-board purge removes files</a>. Thanks to xet7.</summary>

Delete on an attachment used to remove the document and its file at once.
It is now the `attachments.softDelete` method: the document gets
`deletedAt`, `deletedBy` and `deleteBatchId` with the same helpers lists
use, the file is kept, and the card's cover is unset if this was it. Every
card-facing read - the opened card's gallery and "Attachments (N)" count,
the minicard paperclip badge, the slideshow, the cover, the board-background
picker, My Attachments, the API list endpoints and the exporters - filters
to live attachments; the publications keep sending the deleted ones so the
card history can reach them.

The card history records who deleted it and when, with the filename in the
row. Restore - the table's selection and Restore button, or the row's own
Restore, both through `changeHistory.restore` - clears the mark, so the
card, its count and the minicard badge include the attachment again; the
cover is never re-set. An attachment row previews with the existing
attachment viewer slideshow and downloads with the same link the gallery
draws, and never offers cover or background. Uploads and renames are
recorded through the existing history hooks.

There is no per-attachment hard delete any more: `api.attachment.delete`,
`DELETE /api/attachment/delete/:id` and `removeBoardBackground`
soft-delete, the Files report's delete button and its method are gone, and
the attachment collection refuses every client remove and logs the attempt
under Admin Panel / Problems. The one hard delete is Admin Panel / Problems
/ Delete enabled, board archived, board deleted from the archive, which now
removes every attachment of the board, live and soft-deleted, with its
file. The delete confirmation says the attachment can be restored from the
card history (one new translation key, `attachment-soft-delete-pop`).

`tests/attachmentSoftDelete.test.cjs` pins the decisions as arithmetic -
what a delete sets, that it unsets the cover, that a restore never re-sets
it, that Restore on the "Removed" row restores rather than deletes again.
`tests/attachmentSoftDeleteNoHardDelete.test.cjs` sweeps the whole tree for
any remaining hard delete outside the board purge and the upload
rejections, `tests/attachmentSoftDeleteReads.test.cjs` pins every
card-facing read to the live filter and the publications to not filtering,
and `tests/attachmentHistoryRowControls.test.cjs` pins the history row's
controls and that it never offers cover or background.

</details>

**Board Settings** - card section toggles, field order, the Board View table,
WIP Limit Groups under Swimlane, and the menu's order.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/970213010013529150101d3fd6c59f33eab542d4">A toggle for every card section and minicard badge, listed in card order</a>. Thanks to rmb82 and xet7.</summary>

Flowtime, Pomodoro, Stickers and Location were added to the opened card
without an `allows*` board toggle, so they rendered on every card and Board
Settings / Card had no row to hide them. Dependencies, Vote, Planning Poker,
Text Notes and the activity history had the same gap on the card, and the
dependencies, stickers, comment-count, vote and poker badges had it on the
minicard. Each now has a board field that defaults to true (an existing
board keeps showing exactly what it showed), a setter, a REST card-setting
key, a healed default in the schema upgrade, a row in Board Settings / Card
with its click handler, and a gate in the card or minicard template.
`allowsActivities` already existed but gated nothing and its row was
commented out; it is wired now.

The rows are in the order the fields appear on the opened card: Mark
complete, card number and cover first; then the reorderable sections through
the same `orderedCardFieldSections` source the card renders from, so moving
Description up with the arrows at the bottom of the popup moves its rows up
too; then checklists, subtasks, attachments, text notes, comments and
activities. Minicard-only rows (Labels text, List title, Swimlane, Comment
count) sit beside the card row they belong with. No new translation keys:
every row reuses the field's existing name.

`tests/cardSettingsCoverage.test.cjs` derives the card's order from
`cardDetails.jade` and pins the popup to it, checks that every board gate of
the card and the minicard has a row and every new row is read by a template,
and that none of the four sections the issue names is unconditional.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/349c7490e72f93b4e692ff1ff22c7f0eda2431da">Board View: which views a public or private board offers, and which one it opens in</a>. Thanks to xet7.</summary>

A new **Board View** entry at the top of Board Settings, above Swimlane,
opens a table like Card Settings: one row per entry of the Board View menu,
in the menu's order and with the menu's own labels, under the columns
*Default on Public Board*, *Show on Public Board*, *Default on Private
Board*, *Show on Private Board* and *Description*. The two Default columns
are radio groups drawn as checkboxes - one default per side, and making a
view the default also ticks its Show box; the default's Show box cannot be
un-ticked, so a board always opens in a view it offers. When Admin Panel /
Settings / Visibility hides public boards, the two public columns are not
rendered and the table has three columns.

The Board View menu lists only the views ticked for the board's current
visibility, and the view WeKan renders is now resolved through the board:
the viewer's stored choice when the board offers it, otherwise that side's
default, otherwise Swimlanes - nobody is left on a view the menu no longer
lists, and switching a board Private ⇄ Public swaps the menu on the spot.
A board that never opened the popup behaves as before: every view on both
sides, Swimlanes as the default.

Stored per board as `boardViewSettings`, `defaultPublicBoardView` and
`defaultPrivateBoardView`; every decision is the pure module
`models/lib/boardViewSettings.js`, applied by the Board setters
`setBoardViewShown` and `setDefaultBoardView` under the existing board-admin
allow rule. The four column headers are new translation keys, filled in
every locale. `docs/Features/Board/Board-View-Settings.md` describes the
design and `tests/boardViewSettings.test.cjs` pins it: the entry above
Swimlane, the five columns and their public-hidden variant, one row per
menu view in menu order, the schema fields and setters, the radio and
"default stays shown" semantics, the menu filter, the fallback in
`Utils.boardView()`, and the translations.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/82646e4bc0f891ed044bdc5c6cf910cd8dd4a4ea">Board View: reorder the menu with up/down arrows on each row</a>. Thanks to xet7.</summary>

Each row of the Board View table carries an up and a down arrow in front of
its name - real links, so the keyboard reaches them, titled with the
existing *Move up* / *Move down* keys of Card Settings' card field order -
and the Board View menu lists its entries in that order for everybody on
the board. The first row's up and the last row's down are no-ops, drawn
disabled. Stored per board as `boardViewOrder`; `normalizeBoardViewOrder()`
drops unknown keys and duplicates and appends missing views in default
order, so the menu always lists every view exactly once whatever an old or
hand-edited document holds.

The menu is now rendered from the same table as the popup - one `each
boardViewMenuEntries` loop over `models/lib/boardViewSettings.js` instead
of 25 static entries - keeping the per-view `js-open-<view>-view` class each
click handler listens for. The group separators are drawn only while the
order is the default one, since a custom order has no groups.
`tests/boardViewMenu.test.cjs`'s order, icon, label and separator pins now
read that table, the same thing the template reads, and
`tests/boardViewSettings.test.cjs` pins the arrows, the field, the setter
and the normalize/move logic, with the no-op and unknown-key cases.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bbe8b40d903c516491c45c69d3b220415dfd2b32">Board View: the default menu order is the order it had before views became orderable</a>. Thanks to xet7.</summary>

The default order - what a board with no stored `boardViewOrder` renders,
the popup's default row order, and the order in which views a stored order
does not name follow it - is now pinned to the Board View menu as it was
right before views became orderable: the 25 static entries of
`boardChangeViewPopup` in `boardHeader.jade` at `525bcab1b`, the parent of
the Board Settings / Board View feature commit, read top to bottom with its
six separators after Table, Timeline, Statistics, Group by Assignee, DHTMLX
Gantt and Bigboard. Reading that template gives exactly the sequence
`BOARD_VIEWS` already held, so no board changes what it shows and a board
with a stored order is untouched. What changes is where the order comes
from: `DEFAULT_BOARD_VIEW_ORDER` in `models/lib/boardViewSettings.js` is a
literal list transcribed from that template rather than a slice of the
table, so re-sorting `BOARD_VIEWS` can no longer silently reorder every
board's menu, and `normalizeBoardViewOrder` appends any view the table knows
but the list does not, so a view can never vanish from the menu.
`tests/boardViewSettings.test.cjs` pins the literal sequence, the six
separator positions on a board with no stored order (public and private,
for a missing, null, empty and garbage `boardViewOrder`), the fallback for
a partial stored order, and that the list is not derived from the table.
`docs/Features/Board/Board-View-Settings.md` says where the default comes
from.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/15b2b6c5339979341d8237aa592ae37a5fd0607d">One "Card field order" heading over two lists, with arrows on every row</a>. Thanks to xet7.</summary>

Board Settings / Card was a three-column table (Show on Card, Show on
Minicard, the name) with a separate "Card field order" list of arrows at the
bottom that reordered five sections of the opened card. It is one heading,
**Card field order**, over two lists now: **Show on Minicard** in the
board's minicard order and **Show on Card** in its card order, and every row
of either list is `[checkbox] [up] [down] icon label` - the checkbox is
whether that side shows the field, the arrows move it on that side only, and
the icon and name are the field's own. The lists are independent because the
orders are: a field can be third on the minicard and last on the card.

The arithmetic is `models/lib/cardFieldOrder.js`, pure and tested without
Meteor: each surface is a fixed head (the card's title bar), reorderable
sections of fields, and a fixed tail (the card's galleries and right
column). A field moves within its section; at the section's edge it moves
the whole section; a section's header - Labels, Members, Sort number,
Description title - stays first. What is stored is one flat array of field
keys per surface: `cardFieldOrder`, which the first #4448 filled with five
section keys that stay valid and expand to exactly what they rendered, and
the new `minicardFieldOrder`. Two board setters normalise before storing and
the update allow rule keeps them to a board admin; the REST `cardFieldOrder`
endpoints still speak in section keys, eight now. `cardDetails.jade` renders
its sections in the board's order and, inside Labels, Dates, Members, Sort
and Vote/Poker, the fields in theirs; `minicard.jade` renders every block
under the title through the minicard order. Every gate is unchanged, and a
board that never touched the order shows what it always has.

The popup's rows are a table, `models/lib/cardSettingsRows.js`, drawn twice,
so no row is hand-written and each checkbox reads the helper it always read.
`tests/cardFieldOrderLayout.test.cjs` pins the arithmetic and its negatives
(unknown keys dropped, missing keys appended, a first row's up and a fixed
row's arrows no-ops, one side's move leaving the other alone);
`tests/cardSettingsCoverage.test.cjs` derives each layout's default order
from the templates and pins the heading, the five parts of every row, the
admin-only setters and that no locale lacks the heading and arrow keys.
[Card field display order](docs/Features/Board/Card-Field-Display-Order.md)
describes the layout and both orders.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/859771a10ece44f1c48c371d182b4c079c84faad">The default card and minicard field order is the order they had before fields became orderable</a>. Thanks to xet7.</summary>

The default of the two layouts - what a board that never touched Board
Settings / Card renders, and where any field a stored order does not name
goes - is pinned to the render order of `cardDetails.jade` and
`minicard.jade` as they were right before the first field-order commit
(#4448's parent, `59f7d61df`), read top to bottom: on the card, Mark
complete, number and cover, then Labels, Dates, Members, Dependencies, Sort,
Custom Fields, Vote and Poker, Description, then the galleries, comments and
activities; on the minicard, the dates line, cover, labels, custom fields,
assignees, members, creator, checklists, the badge strip, description text,
the comment preview and the list name. Reading those templates gives exactly
the sequence the layout module already held, so no existing card changes
shape and a board with a stored order is untouched; the module, the docs and
the tests now say where the order comes from. The two fields newer than that
commit stay beside their closest older neighbour: Text notes in the card's
fixed tail, Swimlane name last on the minicard.
`tests/cardFieldOrderDefaultIsPreFeatureOrder.test.cjs` pins both literal
sequences, the section sequence, the fallback for a partial stored order and
the popup's two lists, so a reshuffle of a layout cannot pass by reshuffling
the template with it.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/921c7f301ccf85c94c5b463a361be2fea195eeed">WIP Limit Groups moved into Board Settings / Swimlane</a>. Thanks to xet7.</summary>

"WIP Limit Groups" was a fourth top-level entry of the Board Settings group,
between List and Card. A group most often caps one swimlane's lists
together, so it is a row of the Swimlane settings popup now - Board Settings
/ Swimlane / WIP Limit Groups. The row opens the unchanged WIP Limit Groups
popup stacked on the Swimlane popup, so its back arrow returns there, and it
reuses the existing `wip-limit-groups` key rather than adding one.
`tests/boardSettingsSwimlaneListCard.test.cjs` pins the row and its single
click handler in the Swimlane popup, and that the top-level list no longer
carries the entry. The docs describe the new path.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/74f3db87d4f3fb6d15fd4a8adb7015ca8b22291d">The menu is four groups: Rules and colours, the views, in and out, and the archive</a>. Thanks to xet7.</summary>

The Board Settings menu is ordered, top to bottom: Rules, Change color,
Change Background Image; then Board View, Swimlane, List, Card; then Export,
Import, Notifications, Outgoing Webhooks; then Archived items and Move Board
to Archive - a rule between each group. Before, Archived items sat second in
the first group, Notifications sat among the colours, and Move Board to
Archive was alone at the end. Every entry keeps the guard it had: the
board-admin entries stay board-admin, Export and Import stay behind the API
setting, Card stays open to any member for its personal "Labels text" row,
and Move Board to Archive stays off the templates board. No translation keys
are added. `tests/boardMenuOrder.test.cjs` derives the sequence of entries
and rules from the template and pins it exactly, pins each entry's guards so
a reorder cannot loosen who sees what, and pins the diagram in
[Board View settings](docs/Features/Board/Board-View-Settings.md) to the
same order.

</details>

**REST API** - endpoints for recent features that had a UI but no API.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/bbcd98d9d83b874200ba45b2cbc2a495585031d9">Endpoints for attachment restore, Problems, OAuth providers, card field order and rule pausing</a>. Thanks to xet7.</summary>

Each endpoint runs the same server-side code its UI uses, as the request's
user, so the permission checks and side effects are the ones the UI gets:

- `DELETE /api/boards/:boardId/attachments/:attachmentId` soft-deletes,
  `POST .../attachments/:attachmentId/restore` restores, and
  `GET /api/boards/:boardId/attachments/deleted` lists what is restorable,
  through the `attachments.softDelete` / `attachments.restore` methods the
  card and the card history use. There is no hard delete over the API.
- `GET /api/admin/problems` is the Problems status overview with the
  new-problem count per stream, `GET /api/admin/problems/:stream` one page
  of a stream (`limit`, `skip`, `search`), and
  `POST /api/admin/problems/:stream/acknowledge` the acknowledge button -
  all through the admin-only `eventLog*` methods the Admin Panel calls.
- `GET /api/admin/oauth-providers`,
  `PUT /api/admin/oauth-providers/:providerKey`
  and `PUT /api/admin/passwordless` read and save the Admin Panel / People /
  Login provider settings; a secret is reported only as `{ source, hasValue }`.
- `GET`/`PUT /api/boards/:boardId/cardFieldOrder` read and set the opened
  card's section order, normalised with the same `applyCardFieldOrder()`.
- `PUT /api/boards/:boardId/rules/:ruleId` accepts `enabled` to pause and
  resume a rule, and `GET` reports it.

The OpenAPI generator is fixed on the way: `server/models/boards.js` has had
a bare `catch {` since v11.67, the esprima parser cannot read that, and a
parse failure was skipped silently - so `public/api/wekan.yml` has shipped
without the whole Boards API since then. It now downlevels `catch {` and
`for await (`, warns when a file cannot be parsed, and no longer emits an
empty sub-schema for a primitive array-element marker such as
`wipLimitGroups.$.listIds.$`, which made the spec unparseable YAML.
`public/api/wekan.yml` and `wekan.html` are regenerated with the release
workflow's own commands: 156 operations, up from 122. `docs/API/REST-API.md`
and `docs/API/Rules.md` document every new endpoint with a curl example.

`tests/restApiNewFeatureRoutes.test.cjs` pins every new route to its method,
path, `@operation` block and authentication check, that the OAuth endpoints
never mention a secret outside the input whitelist, the generator's fixes,
that the generated and the committed spec carry the Boards API and the new
operations, and - as the negative sweep - that no route in `models/` or
`server/models/` lacks an authentication check.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/c64d3454ac625f8c16d267decad88a9113417659">Endpoints for Board Settings / Board View, and OpenAPI blocks for the card settings routes</a>. Thanks to xet7.</summary>

`GET /api/boards/:boardId/boardViewSettings` (board access) answers which
entries of the Board View menu a board offers, which one it opens in -
separately for a public and a private board - and the menu order, in the
normalised shape the menu renders with: every view once with both
`showOnPublic` and `showOnPrivate` explicit, the two defaults resolved
(missing or unknown reads as Swimlanes), `boardViewOrder` made whole, and
`keys` listing the known views.

`PUT /api/boards/:boardId/boardViewSettings` (board admin) takes any subset
of `boardViewSettings`, `defaultPublicBoardView`, `defaultPrivateBoardView`
and `boardViewOrder`, through the same pure modifiers the popup's clicks
apply, composed by `boardViewSettingsRequest()` in
`models/lib/boardViewSettings.js`: a default is always shown on its side,
hiding a side's current default is a `400` (set another default first - or
in the same request, since defaults are applied before the show flags), an
unknown view key anywhere in the body is a `400` and nothing of that request
is written, and the order is normalised so the menu lists every view exactly
once.

The existing `GET`/`PUT /api/boards/:boardId/cardSettings` routes get the
JSDoc `@operation` blocks the OpenAPI generator reads, so the hand-written
copy in `openapi/extra_paths.yml` - which now duplicated the operationId - is
removed; `public/api/wekan.yml` and `wekan.html` are regenerated: 158
operations. `docs/API/REST-API.md` documents both endpoints with curl
examples and `docs/Features/Board/Board-View-Settings.md` links to them.
`tests/restApiNewFeatureRoutes.test.cjs` pins the four routes to method,
path, `@operation` and auth check, that the PUT writes only the helper's
`$set`, the snapshot's shape, the helper's positive and negative cases
(unknown keys, hiding a default, malformed bodies, a partly-invalid body
applies nothing), and that both specs carry the four operations exactly once.

</details>

and fixes the following bugs:

**The release workflow** - what stopped the v11.70 release run.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/0001d09a8deb021b1b0696e52aced36a596561e9">The Windows legs compile argon2 again on the Visual Studio 2026 runner image</a>. Thanks to xet7.</summary>

`build-win64` and `build-win-arm64` both failed in "Rebuild native modules
for Windows" while argon2 compiled during `npm install`:
`gyp ERR! find VS unknown version "undefined" found at "C:\Program
Files\Microsoft Visual Studio\18\Enterprise"`. On 2026-09-07 GitHub's
`windows-latest` became the `windows-2025-vs2026` image, with Visual Studio 18
and no longer 17, and the node-gyp doing the compiling was not one this
repository installs: Meteor's bundler pins `programs/server/package.json` to
the node-gyp inside the Meteor tool - 10.2.0 in Meteor 3.5.2 - which knows
nothing newer than Visual Studio 2022. argon2 always compiles on Windows,
because `node-gyp-build`'s prebuild probe runs through the Linux-made `.bin/`
shims and fails there, so a compiler that cannot find Visual Studio ends the
job.

`releases/bump-bundle-node-gyp.mjs` now raises that pin to node-gyp 13.0.2
(12.1.0 added Visual Studio 2026; 13.0.1/13.0.2 fixed its version detection)
once, in `build-amd64` before its first `npm install`, from where every other
architecture's bundle inherits it. A pin already at or above the minimum, a
range, or a bundle without one is left alone. `releases/build-release-bundle.sh`
does the same, so a local release bundle matches what a release ships.
`tests/bumpBundleNodeGyp.test.cjs` pins each decision, the minimum, the
step order in the workflow, and that no leg hard-codes node-gyp 10.2.0 or a
`GYP_MSVS_VERSION` workaround.

The same run's other failures are not the repository's: the three amd64 snap
jobs timed out creating snapcraft's LXD base instance (`apt-get install -y
snapd`, 600 s; the arm64 twins passed) and `snap-launchpad riscv64` was still
building on Launchpad when the job cap cancelled it. Both pass on a re-run.

</details>

**The database** - a MongoDB 8.2 crash loop, explained, reported and remediated.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/faaa83ed0922603bb143317213911d7e38691641">MongoDB 8.2 that will not start after a full disk: the scratch directory to delete, and the snap deletes it</a>. Thanks to xet7.</summary>

A reported test environment (`mongo:8.2.2` in Kubernetes) filled its data
volume: the checkpoint's `fdatasync` returned `ENOSPC`, WiredTiger panicked and
mongod aborted - and then it kept failing on every start, with the disk long
since freed. MongoDB 8.2 keeps a throwaway WiredTiger instance under
`<dbPath>/_tmp/spilldb` for queries that spill to disk and empties it itself on
each start; after the abort that emptying failed ("Failed to clear dbpath of
the internal WiredTiger instance: Directory not empty"), mongod opened the
half-emptied directory, found no version file, reported "Failed to open the
spill WiredTiger instance ... database corruption detected" and fasserted.
Nothing retries, so the pod restarts forever. The data is intact; deleting that
one directory is the whole fix.

The snap's `mongodb-control` now deletes `_tmp/spilldb` before every mongod
start (no mongod is running then, and mongod recreates it), and its
start-failure handler recognises the log line and names the directory. Admin
Panel / Problems' `db.restart` row now says what a "No space left on device"
abort means for a full disk as well as for a network filesystem, and both it
and `db.disk-space` name the exact directory to delete when MongoDB 8.2 will
not start afterwards. `docs/Databases/MongoDB/Storage-Requirements.md` carries
the log signature of both stages, the one command, what must not be touched,
and that Docker and Kubernetes users run it themselves, since the database
container is MongoDB's own image. `tests/databaseHealth.test.cjs` pins the
path, both rows, the probe wiring, the snap's pre-start deletion and the page.

</details>

and improves the translation workflow:

- [Translate the attachment soft-delete confirmation for Russian, Aromanian, Kinyarwanda, Sakha, Sardinian, Sicilian, Sindhi, Northern Sami, Sinhala, Slovak, Slovenian, Samoan, Shona, Somali, Albanian, Serbian, Swati, Sotho, Swedish, Swahili, Silesian, Tamil, Telugu, Tajik, Thai, Tigrinya, Tigre, Turkmen, Tagalog, Klingon, Tswana, Tongan, Tok Pisin, Turkish, Tsonga, Tatar and Uyghur](https://github.com/wekan/wekan/commit/aa2ff7a8a27e314f58ec61a6173d6b225e4c8953). Thanks to xet7.

- [Translate the attachment soft-delete confirmation for Danish, German, Greek, Spanish, French, Finnish and 15 more languages](https://github.com/wekan/wekan/commit/1815d97f3). Thanks to xet7.

- [Translate the attachment soft-delete confirmation for Ukrainian, Urdu, Uzbek, Vietnamese, Chinese, Cantonese, Wu, Yiddish, Yoruba, Xhosa, Zulu and 10 more languages](https://github.com/wekan/wekan/commit/7f2d644e2). Thanks to xet7.

- [Translate the attachment soft-delete confirmation for Lithuanian, Latvian, Macedonian, Malay, Dutch, Norwegian Bokmål, Polish, Portuguese, Romanian and 23 more languages](https://github.com/wekan/wekan/commit/73e476e93a6ed6fff379f8417aea74954fb706d9). Thanks to xet7.

- [Translate the attachment soft-delete confirmation for Gujarati, Hebrew, Hindi, Croatian, Hungarian, Indonesian, Italian, Japanese, Korean and 24 more languages](https://github.com/wekan/wekan/commit/f6eeb18b75884f547265f776e015059c16c07854). Thanks to xet7.

- [Translate the attachment soft-delete confirmation for Afrikaans, Amharic, Arabic, Azerbaijani, Belarusian, Bulgarian, Bengali, Catalan, Czech, Welsh and 22 more languages](https://github.com/wekan/wekan/commit/55bf153b2). Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.

# v11.70 2026-09-11 WeKan ® release

**In short:** this release adds every way to log in that Meteor's accounts
system offers - **Google**, **GitHub**, **Facebook**, **X (Twitter)**,
**Meteor Developer**, **Weibo**, **Meetup** and **passwordless** email codes -
configurable with environment variables on every platform and overridable
in **Admin Panel / People / Login**, where a badge beside each field names
the source in effect and a change applies without a restart. It also fixes
the **release bump job**, which failed on the generated OpenAPI spec.

This release adds the following new features:

**Login** - every way to log in that Meteor's accounts system offers.

<details>
<summary><a href="https://github.com/wekan/wekan/commit/83d2a7fc7">Google, GitHub, Facebook, X, Meteor Developer, Weibo, Meetup and passwordless login</a>. Thanks to xet7.</summary>

Meteor's own accounts packages - accounts-google, accounts-github,
accounts-facebook, accounts-twitter, accounts-meteor-developer,
accounts-weibo, accounts-meetup and accounts-passwordless - are added, so
every login method Meteor's accounts system offers is now in WeKan beside
password, 2FA, OIDC, LDAP, CAS and SAML.

`models/lib/oauthProviders.js` is the pure catalog of the seven providers:
the `OAUTH_<PROVIDER>_ENABLED`, `_CLIENT_ID` (`_APP_ID` for Facebook,
`_CONSUMER_KEY` for X) and `_SECRET` env vars, each credential also read
from a `<NAME>_FILE` Docker secret; the shared
`OAUTH_PROVIDERS_LOGIN_STYLE` (popup or redirect) and
`OAUTH_PROVIDERS_MERGE_EXISTING_USERS`; and `PASSWORDLESS_ENABLED`. An
Admin Panel value wins over the env var, and a provider is enabled only
with the flag AND both credentials.

`server/lib/oauthProviders.js` writes Meteor's `ServiceConfiguration` for
every enabled provider at startup and whenever the Admin Panel saves, and
REMOVES it for a disabled one, so switching a provider off takes effect
without a restart. A first login through a provider becomes a WeKan user
the way OIDC does, fail-closed: an existing account made by another login
method is linked only when merging is on and the provider verified the
address; otherwise the login is refused with `oauth-account-conflict` and
the attempt is recorded on the new `oauth.account-conflict` canary, so
Admin Panel -> Problems shows who tried. Passwordless is refused at both
the token-request method and the login attempt while it is off, so the
package cannot create accounts or send codes when nobody enabled it.

The login form shows one button per enabled provider under the SAML
button, and a two-step "Email me a sign-in code" form (address, then code)
when passwordless is on; errors land in the same region as the password
form. `getAuthenticationsEnabled` reports keys only - no credential ever
reaches a browser. `tests/oauthProviders.test.cjs` pins the catalog shape,
the env, `_FILE` and Admin Panel resolution, the enabled and takeover
decisions, the upsert/remove, the canary, the form and the negative
no-secret-on-the-client sweep.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/d1b5d0a75">Admin Panel override of the OAuth login provider and passwordless env vars</a>. Thanks to xet7.</summary>

Admin Panel / People / Login gets a section for Meteor's own accounts-*
login services (Google, GitHub, Facebook, X/Twitter, Meteor Developer, Weibo,
Meetup) and for passwordless login, built the same way as the LDAP section
above it: every `OAUTH_<PROVIDER>_ENABLED` / `_CLIENT_ID` / `_SECRET` env
var, the shared `OAUTH_PROVIDERS_LOGIN_STYLE` and
`OAUTH_PROVIDERS_MERGE_EXISTING_USERS`, and `PASSWORDLESS_ENABLED` can be
set there, a value set in the Admin Panel wins over the env var
(`models/lib/configResolver.js`), and a badge beside each field says
whether the env var, the Admin Panel or nothing is in effect.

The secret is stored in `Settings.oauthProviders.<key>.secret` and, like the
LDAP bind password, never reaches a browser: the `setting` publication
carries only `enabled`, `id`, `loginStyle` and the boolean `secretSet`
per provider, an empty secret submission leaves the stored one untouched,
and the sources method reports the secret through `hasConfigValue()` as
"is set (source)" only. `saveOauthProviderSettings` validates the provider
key against the catalog, and both it and `savePasswordlessSettings` are
admin-only and call `reconfigureOauthProviders()` so a change takes effect
without a server restart.

`tests/oauthProvidersAdminOverride.test.cjs` pins the schema, the published
field list (secret absent, secretSet present), the admin gate, the key
validation, the empty-secret rule, the reconfigure call and the jade badges;
the whole-tree secret sweep in `tests/ldapAdminOverrideSecurity.test.cjs`
now also matches hyphenated sub-document keys such as
`oauthProviders.meteor-developer.secret`.

</details>

<details>
<summary><a href="https://github.com/wekan/wekan/commit/61806605f">The provider and passwordless settings documented on every platform, with docs</a>. Thanks to xet7.</summary>

A setting that exists in the code but not where a user configures WeKan is
invisible, so `OAUTH_<PROVIDER>_ENABLED` / `_CLIENT_ID` (`_APP_ID` for
Facebook, `_CONSUMER_KEY` for Twitter) / `_SECRET` / `_SECRET_FILE` for
Google, GitHub, Facebook, Twitter, Meteor Developer, Weibo and Meetup,
`OAUTH_PROVIDERS_LOGIN_STYLE`, `OAUTH_PROVIDERS_MERGE_EXISTING_USERS` and
`PASSWORDLESS_ENABLED` now appear, commented out with the same explanation,
everywhere the `OAUTH2_*` and `SAML_*` settings already do: `docker-compose.yml`
and its FerretDB v1 (PostgreSQL, MySQL, MariaDB, SAP HANA), FerretDB v2 and
MongoDB variants, the `Dockerfile` and devcontainer `ENV` block (every
`*_ENABLED` defaulting to `false`, login style to `popup`), `start-wekan.sh`,
`start-wekan.bat`, the Snap's `config` (keys list plus a
`DESCRIPTION_`/`DEFAULT_`/`KEY_` triple each, so `snap set wekan
oauth-google-enabled='true'` works) and `wekan-help`, the Sandstorm package
definition, the stacksmith Docker-secrets reader, `secrets/README.md` and the
Helm chart's `values.yaml` in `wekan/charts`. Each comment names the callback
URL to register at the provider, `<ROOT_URL>/_oauth/<service>`, and says that
Admin Panel / People / Login overrides the environment.

Two new docs pages: [OAuth Providers](docs/Features/Login/OAuth-Providers.md)
(where to create the app at each provider, the callback URL, the variables,
the Admin Panel section, login style, merging, troubleshooting) and
[Passwordless](docs/Features/Login/Passwordless.md), both linked from the docs
index. `tests/oauthProvidersPlatformEnv.test.cjs` pins every variable on every
platform, the Snap triples and their kebab-case keys, the Sandstorm defaults,
and that the docs pages exist and are linked; the compose-parity suite keeps
the five FerretDB v1 files identical.

</details>

and fixes the following bug:

<details>
<summary><a href="https://github.com/wekan/wekan/commit/cfaf71d22">The release bump job no longer fails on the generated OpenAPI spec</a>. Thanks to xet7.</summary>

The bump job of release-all.yml regenerates `public/api/wekan.yml` from the
models' JSDoc and renders it with @redocly/cli, which stopped the release
with "bad indentation of a mapping entry (1232:2)". A `@param` whose
description continues on the next JSDoc lines (the chart export's
`chartKey`) was emitted under `description: |` with only its first line
indented, so the continuation lines fell out of the block scalar and the
whole spec failed to parse. The generator now indents every line. It also
stopped warning "unknown type object" for the rules API's trigger/action
parameters: OpenAPI 2.0 has no `object` for a path/query/form parameter, so
they are emitted as a JSON string. Reproduced locally and verified with the
same @redocly/cli render; `tests/openapiParamMultiline.test.cjs` pins the
emitter and parses the regenerated spec.

</details>

and improves the translation workflow:

- [Add the OAuth-provider and passwordless login i18n keys](https://github.com/wekan/wekan/commit/1ac7ddfad)
  to every locale file, with the seven provider names treated as invariant
  proper nouns by the fill tool. Thanks to xet7.
- [Translate the OAuth-provider and passwordless login strings for the major languages](https://github.com/wekan/wekan/commit/24260c497)
  and their regional variants, 88 locale files. Thanks to xet7.
- [Translate them for the European and Central-Asian languages](https://github.com/wekan/wekan/commit/24e5ee4ca),
  62 locale files, in the language each locale tag names. Thanks to xet7.
- [Translate them for the South and Southeast Asian languages](https://github.com/wekan/wekan/commit/8537f7851),
  29 locale files. Thanks to xet7.
- [Translate them for the remaining languages](https://github.com/wekan/wekan/commit/3cdd33437),
  53 locale files, so no locale has an untranslated string left. Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.
