# Open-issue completion audit — 2026-09-26

The live GitHub snapshot contained 159 open issues (pull requests excluded).
Issue descriptions were triaged and candidate closure threads were read with all
comments. The ten decisions below were checked against current application
source and existing regression coverage. A matching title, closed related issue,
or changelog claim alone was not treated as proof of completion.

This audit changes documentation only. Closing keywords in the local commit
will take effect on GitHub only after a maintainer pushes it to the default
branch; no GitHub issues were edited by this audit.

## Verified completion

### [#4421: Editable board visibility descriptions](https://github.com/wekan/wekan/issues/4421)

The visibility popup reads administrator-provided private/public descriptions and falls back to translated defaults when blank.

Source: [`imports/i18n/lib/visibilityDesc.js`](../../imports/i18n/lib/visibilityDesc.js), [`client/components/boards/boardHeader.js`](../../client/components/boards/boardHeader.js), [`client/components/settings/settingBody.js`](../../client/components/settings/settingBody.js).

Regression suites: [`visibilityDesc`](../../tests/visibilityDesc.test.cjs).

The first listed regression suite entered the repository in [5323fdbce](https://github.com/wekan/wekan/commit/5323fdbce); the present source was rechecked, rather than assuming that old coverage still proves the current behavior.

### [#3877: Reorder card fields](https://github.com/wekan/wekan/issues/3877)

Board card-field ordering is stored on the board and applied by the card-detail renderer, including partial and older saved orders.

Source: [`models/lib/cardFieldOrder.js`](../../models/lib/cardFieldOrder.js), [`client/components/cards/cardDetails.js`](../../client/components/cards/cardDetails.js).

Regression suites: [`cardFieldOrder`](../../tests/cardFieldOrder.test.cjs), [`cardFieldOrderLayout`](../../tests/cardFieldOrderLayout.test.cjs), [`cardFieldOrderDefaultIsPreFeatureOrder`](../../tests/cardFieldOrderDefaultIsPreFeatureOrder.test.cjs).

The first listed regression suite entered the repository in [131514d61](https://github.com/wekan/wekan/commit/131514d61); the present source was rechecked, rather than assuming that old coverage still proves the current behavior.

### [#3409: Show archived subtasks as completed](https://github.com/wekan/wekan/issues/3409)

The parent fetches all subtasks, marks archived ones completed and offers a Hide completed switch.

Source: [`models/cards.js`](../../models/cards.js), [`client/components/cards/subtasks.js`](../../client/components/cards/subtasks.js), [`client/components/cards/subtasks.jade`](../../client/components/cards/subtasks.jade).

Regression suites: [`subtaskArchivedVisibility3409`](../../tests/subtaskArchivedVisibility3409.test.cjs).

The first listed regression suite entered the repository in [4de77a4a5](https://github.com/wekan/wekan/commit/4de77a4a5); the present source was rechecked, rather than assuming that old coverage still proves the current behavior.

### [#2498: Linked-card cover images](https://github.com/wekan/wekan/issues/2498)

The cover helper resolves the linked source card before reading its cover ID; missing or inaccessible source cards produce no cover.

Source: [`models/lib/linkedCardCover.js`](../../models/lib/linkedCardCover.js), [`models/cards.js`](../../models/cards.js).

Regression suites: [`linkedCardCover`](../../tests/linkedCardCover.test.cjs).

The first listed regression suite entered the repository in [9ef7f4a07](https://github.com/wekan/wekan/commit/9ef7f4a07); the present source was rechecked, rather than assuming that old coverage still proves the current behavior.

### [#2422: Convert checklist items to linked subtasks](https://github.com/wekan/wekan/issues/2422)

The conversion calls addSubtaskCard and records linkedCardId on the original checklist item, retaining the link instead of deleting the item.

Source: [`client/components/cards/checklists.js`](../../client/components/cards/checklists.js), [`models/checklistItems.js`](../../models/checklistItems.js), [`server/models/cards.js`](../../server/models/cards.js).

Regression suites: [`checklistItemToSubtask`](../../tests/checklistItemToSubtask.test.cjs).

The first listed regression suite entered the repository in [0a9277ce0](https://github.com/wekan/wekan/commit/0a9277ce0); the present source was rechecked, rather than assuming that old coverage still proves the current behavior.

### [#3243: Comment and description drafts](https://github.com/wekan/wekan/issues/3243)

Comment drafts save during input and flush when the form is destroyed; successful submission clears the draft. Description draft saving and clearing are also present. These are local drafts, not collaborative editing.

Source: [`client/components/activities/comments.js`](../../client/components/activities/comments.js), [`client/components/cards/cardDetails.js`](../../client/components/cards/cardDetails.js), [`client/lib/unsavedEdits.js`](../../client/lib/unsavedEdits.js).

Regression suites: [`commentDraft`](../../tests/commentDraft.test.cjs), [`cardDescriptionDraft`](../../tests/cardDescriptionDraft.test.cjs).

The first listed regression suite entered the repository in [794346e39](https://github.com/wekan/wekan/commit/794346e39); the present source was rechecked, rather than assuming that old coverage still proves the current behavior.

### [#3207: Subtasks on minicards](https://github.com/wekan/wekan/issues/3207)

The subtask badge displays completed/total counts. Archived subtasks count toward both completion and the unchanged total, addressing the follow-up comment.

Source: [`client/components/cards/minicard.jade`](../../client/components/cards/minicard.jade), [`models/cards.js`](../../models/cards.js).

Regression suites: [`subtaskCompletionCounter4050`](../../tests/subtaskCompletionCounter4050.test.cjs).

The first listed regression suite entered the repository in [2bc82f9ff](https://github.com/wekan/wekan/commit/2bc82f9ff); the present source was rechecked, rather than assuming that old coverage still proves the current behavior.

### [#1504: Full details for archived cards](https://github.com/wekan/wekan/issues/1504)

Clicking an archived minicard opens the shared full card-details popup, with Restore available. The implementation uses the existing popup rather than a separate right-to-left panel.

Source: [`client/components/sidebar/sidebarArchives.js`](../../client/components/sidebar/sidebarArchives.js), [`client/components/cards/cardDetails.jade`](../../client/components/cards/cardDetails.jade).

Regression suites: [`archiveSidebarFullCardDetails`](../../tests/archiveSidebarFullCardDetails.test.cjs).

The first listed regression suite entered the repository in [5c77c86bb](https://github.com/wekan/wekan/commit/5c77c86bb); the present source was rechecked, rather than assuming that old coverage still proves the current behavior.

### [#2322: Disable and edit rules](https://github.com/wekan/wekan/issues/2322)

Rules can be enabled/disabled without deleting their triggers/actions. The follow-up request for editing is covered by rules.updateRule and its existing UI. Both mutations require board-admin access.

Source: [`models/rules.js`](../../models/rules.js), [`server/rulesButton.js`](../../server/rulesButton.js), [`client/components/rules/rulesList.js`](../../client/components/rules/rulesList.js).

Regression suites: [`ruleEnabledToggle`](../../tests/ruleEnabledToggle.test.cjs), [`ruleUpdateInPlace`](../../tests/ruleUpdateInPlace.test.cjs).

The first listed regression suite entered the repository in [952679f9c](https://github.com/wekan/wekan/commit/952679f9c); the present source was rechecked, rather than assuming that old coverage still proves the current behavior.

### [#708: Standalone SAML login](https://github.com/wekan/wekan/issues/708)

The standalone accounts package provides login, assertion-consumer routes and credential handling, with environment/Admin Panel configuration and a login button. Provider-specific organization mapping is not claimed.

Source: [`packages/wekan-accounts-saml/saml_server.js`](../../packages/wekan-accounts-saml/saml_server.js), [`packages/wekan-accounts-saml/saml_client.js`](../../packages/wekan-accounts-saml/saml_client.js), [`server/saml.js`](../../server/saml.js).

Regression suites: [`samlLogin`](../../tests/samlLogin.test.cjs), [`samlRoutes`](../../tests/samlRoutes.test.cjs), [`samlConfig`](../../tests/samlConfig.test.cjs).

The first listed regression suite entered the repository in [84c714001](https://github.com/wekan/wekan/commit/84c714001); the present source was rechecked, rather than assuming that old coverage still proves the current behavior.

## TODO Later corrections

- Remove the unbuilt Requested By/Assigned By design: member arrays, pickers, exports and import remapping now exist. See `requestedAssignedByVisible` and `requestedAssignedByRoundTrip`.
- Remove #2204: ordinary deletes are reversible; `canPurge` requires a global administrator and the permanent-delete setting. See `softDelete` and `permanentDeleteRecoveryAudit`.
- Remove #5081: the owner/member/assignee arrangement and wrapping have source coverage in `openIssuesVerifiedFromCode`.
- Remove #1213: `buildCopiedComment` preserves author and creation date; `CardComments.copy` bypasses automatic value replacement. See `copiedComment`.
- Remove the missing card-aging indicator: the board already has opt-in aging and three configurable inactivity thresholds, rendered as minicard fade classes.
- Narrow the Jira relationship backlog to duplicate links: related-to, blocks/is-blocked-by and fixes/is-fixed-by already exist.
- Remove the two deferred #6586 items: PDF export embeds Unicode fonts and Markdown is an independent export format. See `pdfExport`, `pdfDrawsTheDocument` and `markdownImportExport`. Retain the separate attachment-board upgrade report.
- Remove #6580: monthly/yearly changelog archives and the archive script already exist. See `changelogArchive`.
- Correct the due-reminder reference from #5213 (default-board permissions) to #5323, and the email-attachment reference from #3838 (Planning Poker date entry) to #2713. Those requests remain pending.
- Retain #6701 deployment confirmation, #6692 stored-history checksum investigation, linked-card permission/runtime verification, database conformance, translation review, security decisions and import-fidelity work. An issue being closed does not establish that every deferred subtask is finished.

## Validation

All 28 selected plain-Node regression suites passed on 2026-09-26. They include
behavioral tests, negative cases and source guards for UI wiring; source guards
are not browser tests. No application code or dependency changed. Browser tests,
a live SAML identity provider, LDAP deployments and database conformance were
not rerun for this documentation audit. No new tests duplicate existing coverage.

Additional passing suites beyond those named above: `listMoveSwimlane` and
`addExistingCardAsSubtask3626`. Their passing does not alone establish that every
comment in the broader related requests has been satisfied.

## Other open issues in the snapshot

These 149 issues are retained, not declared missing or completed. Some contain
working features alongside wider requests; others require deployments, product
decisions or further end-to-end evidence. The inventory makes the audit boundary
explicit and avoids closing a broad request on the strength of one helper.

Particular partial matches: #4294 still requests multiple triggers/actions;
#4160 has a link action but still requests copying; #3235 also requests copying;
#2805 asks for a single shared list header, not just sticky headers;
#4906 asks for independently remembered per-board views;
#2489 includes a later per-user limit suggestion; #1618 includes broader action
ownership and calendar behavior. These were not closed as completed.

- [#6653: Updates and Settings](https://github.com/wekan/wekan/issues/6653)
- [#6509: Please test FerretDB1 with MySQL, MariaDB and SAP Hana? (was: SQLite, PostgreSQL)](https://github.com/wekan/wekan/issues/6509)
- [#5847: Feature Request: Accounts improvement initiative](https://github.com/wekan/wekan/issues/5847)
- [#5834: Power BI Integration with WeKan?](https://github.com/wekan/wekan/issues/5834)
- [#5758: Feature Request: Support for Single Sign-On (SSO) via Kerberos/NTLM or (IWA)](https://github.com/wekan/wekan/issues/5758)
- [#5683: Feature Request: Synchronize Labels on Linked Cards & linking cards on the same board](https://github.com/wekan/wekan/issues/5683)
- [#5681: Is it possible to link fields in maps?](https://github.com/wekan/wekan/issues/5681)
- [#5474: Impersonate User for REST API](https://github.com/wekan/wekan/issues/5474)
- [#5444: Feature Request: Archived cards count shown like GitHub contributions count](https://github.com/wekan/wekan/issues/5444)
- [#5339: Feature request: default organization for new accounts registered via the same OAUTH provider](https://github.com/wekan/wekan/issues/5339)
- [#5323: Notification on card due date.](https://github.com/wekan/wekan/issues/5323)
- [#5171: Feature Request: make mails more clearly arranged](https://github.com/wekan/wekan/issues/5171)
- [#5148: SmartWatch ?](https://github.com/wekan/wekan/issues/5148)
- [#5141: Feature Request: Feature/Bug: Board admin/owner should be able to set organizations/teams](https://github.com/wekan/wekan/issues/5141)
- [#5061: oidc: upon logout the oidc-session should be invalidated](https://github.com/wekan/wekan/issues/5061)
- [#5050: Feature Request: Ability to add all users to board](https://github.com/wekan/wekan/issues/5050)
- [#4931: Feature Request: Nested Boards](https://github.com/wekan/wekan/issues/4931)
- [#4930: Feature Request: Trellinator API](https://github.com/wekan/wekan/issues/4930)
- [#4906: Default View for some Boards](https://github.com/wekan/wekan/issues/4906)
- [#4791: Feature Request: All Boards page automatic organization](https://github.com/wekan/wekan/issues/4791)
- [#4790: Feature Request: User Filter](https://github.com/wekan/wekan/issues/4790)
- [#4756: Feature request: Dynamically apply color to cards based on List color](https://github.com/wekan/wekan/issues/4756)
- [#4698: Feature Request: Shared Labels](https://github.com/wekan/wekan/issues/4698)
- [#4693: Tick off the request to add subtasks](https://github.com/wekan/wekan/issues/4693)
- [#4575: Change permission for public board to all users can write (normal)](https://github.com/wekan/wekan/issues/4575)
- [#4527: Feature Request: Ability to assign permissions for lists](https://github.com/wekan/wekan/issues/4527)
- [#4434: \[UI/UX Feature Request\] Make System Mails more appealing](https://github.com/wekan/wekan/issues/4434)
- [#6541: Users sometimes disappear](https://github.com/wekan/wekan/issues/6541)
- [#4403: Restrict WeKan port access only on loopback](https://github.com/wekan/wekan/issues/4403)
- [#4361: How to login to Linux desktop or website with AD (Active Directory) credentials?](https://github.com/wekan/wekan/issues/4361)
- [#4294: Make Rules less clunky](https://github.com/wekan/wekan/issues/4294)
- [#4278: Feature Request: Send a reminder to the assigned person if a task is due](https://github.com/wekan/wekan/issues/4278)
- [#4265: Feature Request: Hidden Boards list at All Boards page, and Reorganize Board OrgsTeamsPeople](https://github.com/wekan/wekan/issues/4265)
- [#4256: Feature Request: Visibility of label texts and other settings should be per board (currently per user)](https://github.com/wekan/wekan/issues/4256)
- [#4250:  Can move one checklist from one card to another one  card's checklist?](https://github.com/wekan/wekan/issues/4250)
- [#4223: \[Feature Request\] Master Dashboard similar to Bigboard plugin for Kanboard.](https://github.com/wekan/wekan/issues/4223)
- [#4198: Feature Request: activitypub compatibility](https://github.com/wekan/wekan/issues/4198)
- [#4178: Feature Request: When adding/removing user to/from Team/Org, add/remove user to/from all boards of Team/Org with edit rights etc](https://github.com/wekan/wekan/issues/4178)
- [#4160: only Move card possible, Copy or Link to not possible.](https://github.com/wekan/wekan/issues/4160)
- [#4042: Feature / Is html embedding possible?](https://github.com/wekan/wekan/issues/4042)
- [#3948: Feature Request: Email with attachments automated responses from Wekan](https://github.com/wekan/wekan/issues/3948)
- [#3815: \[Feature Request\] More Variables in String Templates](https://github.com/wekan/wekan/issues/3815)
- [#3695: rocketChat notifications - webhooks](https://github.com/wekan/wekan/issues/3695)
- [#3361: Filter function for the calendar / calendar list](https://github.com/wekan/wekan/issues/3361)
- [#3318: Problem with "Outgoing Webhooks" to Rocket.Chat . Wekan in Sandstorm ](https://github.com/wekan/wekan/issues/3318)
- [#3297: \[ENHANCEMENT\] Outgoing Webhook Data Improvements for better usabillity and cross language support](https://github.com/wekan/wekan/issues/3297)
- [#3275: add thumbnail processing](https://github.com/wekan/wekan/issues/3275)
- [#3257: Card to Card attachments/links](https://github.com/wekan/wekan/issues/3257)
- [#3256: Template/theme: Big picture with hot area](https://github.com/wekan/wekan/issues/3256)
- [#3249: Feature Request: Internal boards](https://github.com/wekan/wekan/issues/3249)
- [#3235: Add a new rule for copying cards: IF \[\] THEN COPY THIS CARD TO THE \[\] BOARD AND TO THE LIST \[\]](https://github.com/wekan/wekan/issues/3235)
- [#3213: Feature Request: Choosing Subtasks from current Cards](https://github.com/wekan/wekan/issues/3213)
- [#3198: \[Feature Request\] MiniCard Field Display Customization](https://github.com/wekan/wekan/issues/3198)
- [#3195: {question/feature} Custom field values for rule values](https://github.com/wekan/wekan/issues/3195)
- [#3194: {request} Calendar mode similar to Trello's](https://github.com/wekan/wekan/issues/3194)
- [#3143: Feature Request: Display-only Custom Field ](https://github.com/wekan/wekan/issues/3143)
- [#3114: Card View keep opened in mobile view after card be removed or moved from another client/user.](https://github.com/wekan/wekan/issues/3114)
- [#3022: Feature Request: Granular Roles, create read only etc custom role permission combinations](https://github.com/wekan/wekan/issues/3022)
- [#2953: Feature Request: possibility to combine multiple conditions and multiple actions on one rule](https://github.com/wekan/wekan/issues/2953)
- [#2906: Adding / Archiving Lists via Script](https://github.com/wekan/wekan/issues/2906)
- [#2809: Feature request: Link the whole list from Board A to Board B](https://github.com/wekan/wekan/issues/2809)
- [#2805: Single fixed list titles static at top of swimlanes view](https://github.com/wekan/wekan/issues/2805)
- [#2796: Main Boards - Drag n Drop and/or Color ](https://github.com/wekan/wekan/issues/2796)
- [#2761: Common labels for all boards](https://github.com/wekan/wekan/issues/2761)
- [#6548: LDAP debugging not possible within LXC container?](https://github.com/wekan/wekan/issues/6548)
- [#2713: Feature requests: edit rules; send card to mail](https://github.com/wekan/wekan/issues/2713)
- [#2698: GitLab integration with Wekan Rules Sync](https://github.com/wekan/wekan/issues/2698)
- [#2662: FreeBSD](https://github.com/wekan/wekan/issues/2662)
- [#2644: Feature Request: Add confirmation asking dialog to Archive Board and Clone Board at All Boards page](https://github.com/wekan/wekan/issues/2644)
- [#2509: Does Wekan can give me a chance to have a customized card style?](https://github.com/wekan/wekan/issues/2509)
- [#2489: Feature Request: Sub-columns / Common WiP-limit for multiple columns](https://github.com/wekan/wekan/issues/2489)
- [#2460: Feature Request: Login with SQRL](https://github.com/wekan/wekan/issues/2460)
- [#2450: \[Feature\] Pretty ID for Cards](https://github.com/wekan/wekan/issues/2450)
- [#2449: \[Feature\] Board Key](https://github.com/wekan/wekan/issues/2449)
- [#2435: Feature Request: New Rule - Send email (功能需求：新建规则-添加收件人)](https://github.com/wekan/wekan/issues/2435)
- [#6549: OAuth2 Partially Working - Rocket.Chat->G Suite SAML App](https://github.com/wekan/wekan/issues/6549)
- [#2321: Feature Request: Remove Activity from Duplicated Board](https://github.com/wekan/wekan/issues/2321)
- [#2290: Support for Login and register page webhook.](https://github.com/wekan/wekan/issues/2290)
- [#2217: Feature Request: Add admin panel option to show Rules option to non-admin users](https://github.com/wekan/wekan/issues/2217)
- [#2211: Feature Request: When using Auth0 login, redirect automatically to fullscreen Auth0 login page, instead of current login popup.](https://github.com/wekan/wekan/issues/2211)
- [#2208: Sandstorm Wekan Feature Requests: Wekan email sending, CRON, Subtasks, env setting UI](https://github.com/wekan/wekan/issues/2208)
- [#2171: Feature Request: Improve behavior of ctrl+f search](https://github.com/wekan/wekan/issues/2171)
- [#2167: Document Sandstorm API](https://github.com/wekan/wekan/issues/2167)
- [#2160: Feature Request: Multiselection to change color of cards](https://github.com/wekan/wekan/issues/2160)
- [#2148: Feature Request: notification mail template](https://github.com/wekan/wekan/issues/2148)
- [#2145: Feature Request: Mini date field](https://github.com/wekan/wekan/issues/2145)
- [#2141: Notification Frequency Settings for user or member end](https://github.com/wekan/wekan/issues/2141)
- [#2131: Insert a swimlane above the current one](https://github.com/wekan/wekan/issues/2131)
- [#2111: Feature Request: Hint on Cards for changes or new entrys as user-specific optionally enabled subscription](https://github.com/wekan/wekan/issues/2111)
- [#2110: Feature Request: 1) Card-specific avatar color and avatar tooltip additional text 2) Order of Members on card and on detail page reversed](https://github.com/wekan/wekan/issues/2110)
- [#2107: Ability to hide list/swimlane/calendar view, and hide/collapse some/all of swimlanes/lists](https://github.com/wekan/wekan/issues/2107)
- [#2076: Feature Request: New rule triggers - card moved left/right](https://github.com/wekan/wekan/issues/2076)
- [#2044: Feature request : Possibility to choose "OR" or "AND" in the filter](https://github.com/wekan/wekan/issues/2044)
- [#2043: Feature Request: Progress Bar with Chart of on going work process statistics for each board](https://github.com/wekan/wekan/issues/2043)
- [#2040: Feature Request: For a list, set a sort order by specifying ordered list of labels in order of high to low](https://github.com/wekan/wekan/issues/2040)
- [#2026: Feature Request: Push Notification, and notifications area with settings](https://github.com/wekan/wekan/issues/2026)
- [#2017: WebHooks to NodeRed - HowTo?](https://github.com/wekan/wekan/issues/2017)
- [#2015: Feature Request: Add QR code for retrive easily a card](https://github.com/wekan/wekan/issues/2015)
- [#2012: \[important\] kanban basic function should be done, and then start new feature.](https://github.com/wekan/wekan/issues/2012)
- [#2009: Wekan on Uberspace 7?](https://github.com/wekan/wekan/issues/2009)
- [#1990: Feature Request: Hide or collapse subtask boards on home/all boards view](https://github.com/wekan/wekan/issues/1990)
- [#1953: Feature Request: Create UI setting for board's default behaviour for subtasks' swimlane](https://github.com/wekan/wekan/issues/1953)
- [#1938: Feature Request: Non-case sensitive name when tagging user in a card](https://github.com/wekan/wekan/issues/1938)
- [#1933: Feature request: if card has one comment then show it as tooltip](https://github.com/wekan/wekan/issues/1933)
- [#1931: Feature Request: Linked Subtasks](https://github.com/wekan/wekan/issues/1931)
- [#1921: Issue: Resend verification or change the flag?](https://github.com/wekan/wekan/issues/1921)
- [#1915: Feature request : Possibility to hide cards according to a date](https://github.com/wekan/wekan/issues/1915)
- [#1904: Feature Request: Add way to restrict OAuth from Google to a domain](https://github.com/wekan/wekan/issues/1904)
- [#1871: Feature Request: Filter Subtasks by Parent](https://github.com/wekan/wekan/issues/1871)
- [#1844: Add Feature: Smart Search of Cards](https://github.com/wekan/wekan/issues/1844)
- [#1781: Feature Request: Improve how intuitively subtasks work: Landing list for subtasks is not linked to the subboard](https://github.com/wekan/wekan/issues/1781)
- [#1759: \[New feature\] Preserve cards' labels at moving/copying cards to another board](https://github.com/wekan/wekan/issues/1759)
- [#1758: Feature Request: Use EXIF orientation of uploaded pictures](https://github.com/wekan/wekan/issues/1758)
- [#1748: Feature Request: Add Swimlane position info to cards](https://github.com/wekan/wekan/issues/1748)
- [#1704: Feature Request: Move List(s) to different board](https://github.com/wekan/wekan/issues/1704)
- [#1686: Sort names in alphabetic order when adding member](https://github.com/wekan/wekan/issues/1686)
- [#1631: Feature Request: Add option to receive notifications from other users only](https://github.com/wekan/wekan/issues/1631)
- [#1618: Feature Request: Summary of actions, leader for action, actions in calendar.](https://github.com/wekan/wekan/issues/1618)
- [#1604: Feature Request: visual indicator for changes since last login](https://github.com/wekan/wekan/issues/1604)
- [#6552: Increasing file descriptions / ulimit for Caddy in Wekan Snap?](https://github.com/wekan/wekan/issues/6552)
- [#1566: Feature Request: Announcement for each board](https://github.com/wekan/wekan/issues/1566)
- [#1499: Filter/hide old tasks in done tab](https://github.com/wekan/wekan/issues/1499)
- [#1463: Feature Request: Auto generate url-links from a token for references into other tools](https://github.com/wekan/wekan/issues/1463)
- [#1455: Feature Request: use Outgoing Webhook behind Squid proxy](https://github.com/wekan/wekan/issues/1455)
- [#1377: Feature Request: Activitity-List over all Boards](https://github.com/wekan/wekan/issues/1377)
- [#6554: Feature Request: Add Gogs support](https://github.com/wekan/wekan/issues/6554)
- [#1324: Feature Request: Bitbucket login](https://github.com/wekan/wekan/issues/1324)
- [#1297: Feature Request: Advanced WebHooks with Mattermost](https://github.com/wekan/wekan/issues/1297)
- [#1293: Support android share intent](https://github.com/wekan/wekan/issues/1293)
- [#1273: Feature Request: Don't remove string for autocomplete label and member](https://github.com/wekan/wekan/issues/1273)
- [#1188: Add Feature: Copy URL of a card. Works on Standalone, but not on Sandstorm.](https://github.com/wekan/wekan/issues/1188)
- [#1178: Enable hand writing / sketching on card ](https://github.com/wekan/wekan/issues/1178)
- [#1126: Add Feature: Physical RFID kanban cards](https://github.com/wekan/wekan/issues/1126)
- [#1100: Matrix notifications](https://github.com/wekan/wekan/issues/1100)
- [#1040: Support LibreJS](https://github.com/wekan/wekan/issues/1040)
- [#1023: undo button for deleted lists etc everything](https://github.com/wekan/wekan/issues/1023)
- [#935: Filter cards by date or tags](https://github.com/wekan/wekan/issues/935)
- [#916: Add Feature: Support for HTTPS (TLS/SSL)](https://github.com/wekan/wekan/issues/916)
- [#864: Board List view](https://github.com/wekan/wekan/issues/864)
- [#824: Add Feature: General Avatar URL feature, for url to local intra server or Gravatar, automatically pulled to profile avatar, all settings in environment variables](https://github.com/wekan/wekan/issues/824)
- [#810: Feature Request: Add feature: Remember previously entered data when adding new card](https://github.com/wekan/wekan/issues/810)
- [#802: Add Feature: Teams/Organizations similar to Trello](https://github.com/wekan/wekan/issues/802)
- [#794: Add feature: Using API to script Email to board/card, notifications on cards to email, etc](https://github.com/wekan/wekan/issues/794)
- [#793: Add feature: Auto add user name to a moved card](https://github.com/wekan/wekan/issues/793)
- [#687: \[Feature Request\] ownCloud / Nextcloud Integration](https://github.com/wekan/wekan/issues/687)
- [#632: please add to rancher catalog:  https://github.com/rancher/rancher](https://github.com/wekan/wekan/issues/632)
- [#337: Accessibility feedback](https://github.com/wekan/wekan/issues/337)
- [#211: Feature idea: Same cards, multiple column sets](https://github.com/wekan/wekan/issues/211)
- [#140: Collaborative edition](https://github.com/wekan/wekan/issues/140)
