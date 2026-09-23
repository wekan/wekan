# Browser audit results: 2026-09-23

The complete Chromium baseline ran 470 tests against the pre-audit macOS ARM64
bundle and an isolated local FerretDB database, with one worker and no retries:

| Outcome | Count |
| --- | ---: |
| Passed | 405 |
| Failed | 55 |
| Skipped | 8 |
| Did not run | 2 |

Runtime: 33.1 minutes. The two unrun tests and eight skipped tests are not passes.
These results do not certify Firefox, WebKit, mobile devices, external identity
providers, SMTP delivery to the Internet or cloud storage accounts.

The subsequent rebuilt bundle passes 30 new positive/negative UI checks and the
corrected cross-board move regression. That focused success does not erase the
baseline failures or establish complete UI coverage. The menu source inventory
has 418 selectors, of which 270 have no literal browser-spec reference.

Local logs and screenshots are retained under `.tools/tmp/menu-audit/` and
`tests/playwright/test-results/` (ignored by git). The baseline log is
`admin-browser.log`; focused runs are `security-browser.log`,
`confirm-browser.log` and `content-browser.log`.

## Baseline failures

A timeout may be a stale selector, a fixture problem, a reactivity problem or an
implementation defect. Only the cross-board selector has been isolated and
repaired here; the remaining entries must not be relabelled as harmless without
a reproduction. This table preserves the failing assertions as follow-up work.

| Test | First reported failure | Status |
| --- | --- | --- |
| 01-boards-users.e2e.js / Boards – user membership / #6479: removing a member hides them from the sidebar member list, not just the DB | Error: expect(locator).toBeVisible() failed | Unresolved; individual reproduction required. |
| 01-boards-users.e2e.js / Boards – user membership / board admin can remove a member from the board | Error: expect(locator).toBeVisible() failed | Unresolved; individual reproduction required. |
| 03-cards-operations.e2e.js / Cards – operations / custom field layout toggle switches and persists its layout | Error: expect(locator).toHaveCount(expected) failed | Unresolved; individual reproduction required. |
| 03-cards-operations.e2e.js / Cards – operations / #6645: a lazy board receives remote card edits and moves without reload | Error: expect(locator).toContainText(expected) failed | Unresolved; individual reproduction required. |
| 03-cards-operations.e2e.js / Cards – operations / #2494 cross-board moves receive a unique finite position and stay visible | Error: locator.click: Error: strict mode violation: getByRole('link', { name: 'Add List' }) resolved to 3 elements: | Fixed selector; focused rerun passed. |
| 03-cards-operations.e2e.js / Cards – operations / #3114: remotely deleting an open card closes its details | Error: expect(locator).toHaveCount(expected) failed | Unresolved; individual reproduction required. |
| 03-cards-operations.e2e.js / Cards – operations / #1946/#6613 linked source fields and member avatars survive reload | Error: expect(locator).toContainText(expected) failed | Unresolved; individual reproduction required. |
| 03-cards-operations.e2e.js / #6694 multi-selection adds labels and members to a mixed selection | Error: expect(locator).toContainText(expected) failed | Unresolved; individual reproduction required. |
| 03-cards-operations.e2e.js / Cards – operations / checkbox custom fields toggle and can be removed from a card | TimeoutError: locator.click: Timeout 15000ms exceeded. | Unresolved; individual reproduction required. |
| 03-cards-operations.e2e.js / Cards – operations / currency custom fields save and offer an X beside Save | TimeoutError: locator.click: Timeout 15000ms exceeded. | Unresolved; individual reproduction required. |
| 03-cards-operations.e2e.js / Tamazight numeric total tooltip describes only display-enabled fields | Error: expect(locator).toHaveText(expected) failed | Unresolved; individual reproduction required. |
| 04-search.e2e.js / Search / #6632: Table view uses full width and remembers wrapped card titles | Error: expect(locator).toHaveAttribute(expected) failed | Unresolved; individual reproduction required. |
| 04-search.e2e.js / Search / #6629: Board Table view applies the active label filter | TimeoutError: locator.click: Timeout 15000ms exceeded. | Unresolved; individual reproduction required. |
| 04-search.e2e.js / Search / #6634: Table view optionally groups cards by swimlane and remembers it | Error: expect(locator).toHaveCount(expected) failed | Unresolved; individual reproduction required. |
| 04-search.e2e.js / Search / filter sidebar filters cards by label and keeps selected label active | Error: expect(locator).toBeVisible() failed | Unresolved; individual reproduction required. |
| 06-views-layout.e2e.js / Views & layout / #6659 and #6660: view changes persist and cards stay in their swimlane | Error: expect(locator).toBeVisible() failed | Unresolved; individual reproduction required. |
| 06-views-layout.e2e.js / Views & layout / list order change persists across page reload | Error: Expected list order to change after DB sort update and reload | Unresolved; individual reproduction required. |
| 06-views-layout.e2e.js / Views & layout / #6691: partial profiles and impersonation keep shared-list cards scoped | Error: expect(locator).toBeVisible() failed | Unresolved; individual reproduction required. |
| 07-attachments-links.e2e.js / Attachments & links / stored HTML is forced to a safe download on the original Meteor-Files route | Error: expect(received).toBe(expected) // Object.is equality | Unresolved; individual reproduction required. |
| 09-my-cards-filter.e2e.js / My Cards, filter & sort / filter by assignee shows only assigned cards on the board | Error: expect(locator).toBeVisible() failed | Unresolved; individual reproduction required. |
| 11-labels-duedates.e2e.js / Labels & due dates / #6615: an existing card with dates opens and remains editable | Error: expect(locator).toBeVisible() failed | Unresolved; individual reproduction required. |
| 11-labels-duedates.e2e.js / Labels & due dates / #1554 sidebar labels remain droppable on cards rendered later | Error: expect(locator).toBeVisible() failed | Unresolved; individual reproduction required. |
| 11-labels-duedates.e2e.js / Labels & due dates / applying a seeded label to a card shows it in card details | Error: expect(locator).toBeVisible() failed | Unresolved; individual reproduction required. |
| 11-labels-duedates.e2e.js / Labels & due dates / changing an existing due date saves the replacement (#6607) | TimeoutError: locator.click: Timeout 10000ms exceeded. | Unresolved; individual reproduction required. |
| 13-swimlanes.e2e.js / Swimlanes / Mobile Mode keeps other swimlanes lists visible when one list opens | Error: expect(locator).toBeVisible() failed | Unresolved; individual reproduction required. |
| 13-swimlanes.e2e.js / Swimlanes / swimlane action popup opens without JS errors | Error: expect(locator).toBeVisible() failed | Unresolved; individual reproduction required. |
| 14-voting-watchers.e2e.js / Voting & watchers / negative vote button is clickable and registers the voted state | Error: expect(locator).toBeVisible() failed | Unresolved; individual reproduction required. |
| 14-voting-watchers.e2e.js / Voting & watchers / vote counts update in the card after voting | Error: expect(locator).toBeVisible() failed | Unresolved; individual reproduction required. |
| 14-voting-watchers.e2e.js / Voting & watchers / positive vote button is clickable and registers the voted state | Error: expect(locator).toBeVisible() failed | Unresolved; individual reproduction required. |
| 15-board-actions.e2e.js / Board-level actions / #6660: star/unstar persists through the server method | Error: expect(received).toBe(expected) // Object.is equality | Unresolved; individual reproduction required. |
| 16-card-members-description.e2e.js / Card members & description / Requested By exposes Edit while empty Assigned By exposes Add | Error: expect(locator).toHaveAttribute(expected) failed | Unresolved; individual reproduction required. |
| 22-card-features.e2e.js / Card & list features / the minicard complete checkbox toggles | Error: expect(locator).toBeVisible() failed | Unresolved; individual reproduction required. |
| 24-feature-issues.e2e.js / Feature issues / #5157 board background image appears on the All Boards tile | Error: expect(locator).toBeVisible() failed | Unresolved; individual reproduction required. |
| 27-red-strings.e2e.js / Red Strings – card dependency overlay / drag-to-connect: dragging a card connect-handle onto another card creates a dependency | TimeoutError: locator.hover: Timeout 15000ms exceeded. | Unresolved; individual reproduction required. |
| 27-red-strings.e2e.js / Red Strings – card dependency overlay / typed relation: blocks draws a directed line with an arrowhead | Error: expect(locator).toHaveAttribute(expected) failed | Unresolved; individual reproduction required. |
| 28-dependencies-rest.e2e.js / REST API: card dependencies / full CRUD with type/color/icon, plus validation | Error: expect(received).toMatchObject(expected) | Unresolved; individual reproduction required. |
| 36-fixed-bug-regressions.e2e.js / Fixed-bug regressions / #6420 voting buttons render without a currentUser ReferenceError | Error: expect(locator).toBeVisible() failed | Unresolved; individual reproduction required. |
| 37-card-drag-sort.e2e.js / #6705 expanded lists accept and release cards after repeated collapse and reload | Error: expect(locator).toBeVisible() failed | Unresolved; individual reproduction required. |
| 39-email-verification.e2e.js / Email verification / #1426 an anonymous verification link verifies and signs in the user | Error: expect(received).toBe(expected) // Object.is equality | Unresolved; individual reproduction required. |
| 42-board-comments-attachments.e2e.js / Board publication – comments/attachments (#6480) / a card comment (carrying boardId) is published and shown when the card is opened | Error: expect(locator).toBeVisible() failed | Unresolved; individual reproduction required. |
| 47-speech-scroll.e2e.js / #2499 focusable speech-scroll regions / Page Down scrolls the focused list and opened card | Error: expect(received).toBeGreaterThan(expected) | Unresolved; individual reproduction required. |
| 75-linked-card-same-tab.e2e.js / #6711 a Markdown link to another card opens in the same tab | TimeoutError: locator.click: Timeout 15000ms exceeded. | Unresolved; individual reproduction required. |
| 88-basque-rule-subject-order.e2e.js / Basque named controls and saved descriptions keep the demonstrative last | Error: expect(received).toBe(expected) // Object.is equality | Unresolved; individual reproduction required. |
| accepted-audit-fixes.e2e.js / F12: overtime is a draft until Save | TimeoutError: locator.click: Timeout 15000ms exceeded. | Unresolved; individual reproduction required. |
| accepted-audit-fixes.e2e.js / F02 F06: relative move uses a fractional gap and keyboard moves escape ties | TimeoutError: locator.selectOption: Timeout 15000ms exceeded. | Unresolved; individual reproduction required. |
| accepted-audit-visuals.e2e.js / F15 F17 A08: attachment actions work without hover and the viewer traps and returns focus | TimeoutError: locator.click: Timeout 15000ms exceeded. | Unresolved; individual reproduction required. |
| activity-viewer.e2e.js / card and sidebar activities obey plain-links | Error: expect(locator).toHaveCount(expected) failed | Unresolved; individual reproduction required. |
| card-empty-sections.e2e.js / #6696 hidden fields remove their whole group and separator | Error: expect(locator).toHaveCount(expected) failed | Unresolved; individual reproduction required. |
| clean-task-boards.e2e.js / clean boards: checklist due controls and section heading can be hidden without deleting data | Error: expect(locator).toBeVisible() failed | Unresolved; individual reproduction required. |
| clean-task-boards.e2e.js / clean boards: collapse control and labels above title persist without hiding saved content | Error: expect(locator).toBeVisible() failed | Unresolved; individual reproduction required. |
| file-status-audit.e2e.js / File status content checks detect html with a wrong extension without modifying the upload | TypeError: The "path" argument must be of type string. Received undefined | Unresolved; individual reproduction required. |
| file-status-audit.e2e.js / File status content checks detect png with a wrong extension without modifying the upload | TypeError: The "path" argument must be of type string. Received undefined | Unresolved; individual reproduction required. |
| frappe-responsive.e2e.js / English Frappe Gantt stays responsive and permits switching views | Error: expect(locator).toBeVisible() failed | Unresolved; individual reproduction required. |
| site-logo.e2e.js / custom login and board logos load without requesting stock logos | Error: expect(locator).toBeVisible() failed | Unresolved; individual reproduction required. |
| time-view-title.e2e.js / Time view honors render-links-as-plain-text=false | Error: expect(locator).toContainText(expected) failed | Unresolved; individual reproduction required. |

See [implementation findings](Menu-Implementation-Audit.md) for repaired defects,
source-inventory limits and import/export format gaps. The existing browser
harness is documented in [test setup](../Security/Sandboxes/vscodium/README.md).

## Login protocol follow-up

The [local login audit](Login/Testing.md) adds real LDAP, OAuth, SAML, CAS,
SMTP, proxy and Sandstorm exchanges, including positive and rejected logins.
Its focused passing results do not erase the unrelated baseline failures
above or certify live external identity-provider deployments.
