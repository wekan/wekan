# Full open-issue inventory — 2026-09-27

This snapshot contains **140 open issues**, excluding pull requests. All
issue bodies were triaged and all comment pages were downloaded. Threads for
implemented changes and proposed closures were read in full. The table records
a disposition for every issue; **triaged does not mean implemented or fully
reproduced**. Remaining feature work is identified honestly rather than called
impossible merely because it requires more implementation and tests.

No remote issue state or permissions were changed. Closing keywords in local
commits only take effect after the maintainer pushes them.

## Verified changes

The new controls reuse current menu locations and existing server mutations.
No dependencies were added. Drafts reuse `UnsavedEdits` and its owner-only
publication/write guards. Labels are client-side filtering only. New swimlanes
still use the guarded collection insert; board archive/copy retain admin checks.

## Complete inventory

| Issue | Existing or logical menu area | Finding / remaining verification |
| --- | --- | --- |
| [#6653: Updates and Settings](https://github.com/wekan/wekan/issues/6653) | Documentation | Pinned settings/navigation reference; keep open as the maintainer reference. |
| [#6509: Please test FerretDB1 with MySQL, MariaDB and SAP Hana? (was: SQLite, PostgreSQL)](https://github.com/wekan/wekan/issues/6509) | Database test matrix | Requires MySQL/MariaDB/SAP HANA conformance runs; this browser run uses MongoDB, not those backends. |
| [#5847: Feature Request: Accounts improvement initiative](https://github.com/wekan/wekan/issues/5847) | Admin Panel → People | Umbrella request with unfinished identity, grouping and role contracts; existing individual capabilities do not complete the whole request. |
| [#5834: Power BI Integration with WeKan?](https://github.com/wekan/wekan/issues/5834) | External integration | Power BI/BI Connector deployment unavailable; no end-to-end connector verification. |
| [#5758: Feature Request: Support for Single Sign-On (SSO) via Kerberos/NTLM or (IWA)](https://github.com/wekan/wekan/issues/5758) | Admin Panel → People → Authentication | Windows/AD Kerberos/SSPI and desktop login need the actual domain/platform; do not bypass authentication with trusted arbitrary headers. |
| [#5681: Is it possible to link fields in maps?](https://github.com/wekan/wekan/issues/5681) | Card → Custom Fields | Whole-card mirroring exists; independently synchronized subsets of custom fields need conflict and write-authority rules. |
| [#5474: Impersonate User for REST API](https://github.com/wekan/wekan/issues/5474) | REST API | REST impersonation adds delegation authority. No new impersonation header or permission bypass added. |
| [#5444: Feature Request: Archived cards count shown like GitHub contributions count](https://github.com/wekan/wekan/issues/5444) | Board View → Charts | Archived contribution heatmap remains a feature gap; needs archived-date aggregation and board/assigned-only scope coverage. |
| [#5339: Feature request: default organization for new accounts registered via the same OAUTH provider](https://github.com/wekan/wekan/issues/5339) | Admin Panel → Organizations | OAuth-provider-driven automatic organization membership requires explicit provisioning/revocation rules; no automatic privilege grants added. |
| [#5323: Notification on card due date.](https://github.com/wekan/wekan/issues/5323) | Board Settings → Notifications / Rules | Due reminders and scheduled rule triggers exist. Per-board reminder/webhook configuration, assignee email recipients and start-date rule reminders remain separate gaps. |
| [#5171: Feature Request: make mails more clearly arranged](https://github.com/wekan/wekan/issues/5171) | Admin Panel → Notifications | Notification delivery exists; requested customizable HTML layout/templates need escaping and actual MIME delivery tests. |
| [#5148: SmartWatch ?](https://github.com/wekan/wekan/issues/5148) | Platform research | Smartwatch discussion, not a reproducible application bug or specified device implementation. |
| [#5141: Feature Request: Feature/Bug: Board admin/owner should be able to set organizations/teams](https://github.com/wekan/wekan/issues/5141) | Board Settings → Organizations / Teams | Board-admin methods exist, but available organization/team publications require a permission-safe scoped picker. Do not publish all administration data. |
| [#5050: Feature Request: Ability to add all users to board](https://github.com/wekan/wekan/issues/5050) | Board Settings → Members | Bulk all-users invitation requires deliberate role selection and tenant boundaries; no blanket member grants added. |
| [#4931: Feature Request: Nested Boards](https://github.com/wekan/wekan/issues/4931) | Board View | Nested boards/list mirrors/arbitrary column groupings are wider models than existing linked cards. Synchronization, cycle and source-access behavior remain open. |
| [#4930: Feature Request: Trellinator API](https://github.com/wekan/wekan/issues/4930) | REST API | Trellinator compatibility is an external API parity project; existing REST endpoints are not proof of complete compatibility. |
| [#4906: Default View for some Boards](https://github.com/wekan/wekan/issues/4906) | Board View / Member Settings | Board defaults and label flags exist; independently remembered per-board user view selection is still missing from the global profile preference. |
| [#4791: Feature Request: All Boards page automatic organization](https://github.com/wekan/wekan/issues/4791) | All Boards | Workspace organization exists; automatic alphabet/label grouping and per-user hidden-board/team opt-out semantics remain incomplete. |
| [#4790: Feature Request: User Filter](https://github.com/wekan/wekan/issues/4790) | Admin Panel → People | Umbrella request with unfinished identity, grouping and role contracts; existing individual capabilities do not complete the whole request. |
| [#4756: Feature request: Dynamically apply color to cards based on List color](https://github.com/wekan/wekan/issues/4756) | List → Color | Dynamic inherited card color needs a display override and explicit interaction with card colors; no destructive recoloring added. |
| [#4698: Feature Request: Shared Labels](https://github.com/wekan/wekan/issues/4698) | Board Settings → Labels | Labels remain board-owned; shared catalogs require explicit sharing scope and synchronization semantics. |
| [#4693: Tick off the request to add subtasks](https://github.com/wekan/wekan/issues/4693) | Card → Subtasks | Subtask completion is archive-based; a separate checkbox workflow needs completion-state semantics and tests. |
| [#4575: Change permission for public board to all users can write (normal)](https://github.com/wekan/wekan/issues/4575) | Permissions | Requested public/internal/list-specific grants alter existing access boundaries. Excluded from this permission-preserving implementation. |
| [#4527: Feature Request: Ability to assign permissions for lists](https://github.com/wekan/wekan/issues/4527) | Permissions | Requested public/internal/list-specific grants alter existing access boundaries. Excluded from this permission-preserving implementation. |
| [#4434: [UI/UX Feature Request] Make System Mails more appealing](https://github.com/wekan/wekan/issues/4434) | Admin Panel → Notifications | Notification delivery exists; requested customizable HTML layout/templates need escaping and actual MIME delivery tests. |
| [#6541: Users sometimes disappear](https://github.com/wekan/wekan/issues/6541) | Account lifecycle | Historic disappearance of stored user documents has no reproducible trigger or affected data in the report; no speculative user deletion changes. |
| [#4403: Restrict WeKan port access only on loopback](https://github.com/wekan/wekan/issues/4403) | Deployment settings | Loopback binding needs validation on the reported Snap/Apache installation. Local source-app behavior does not certify Snap wiring. |
| [#4361: How to login to Linux desktop or website with AD (Active Directory) credentials?](https://github.com/wekan/wekan/issues/4361) | Admin Panel → People → Authentication | Windows/AD Kerberos/SSPI and desktop login need the actual domain/platform; do not bypass authentication with trusted arbitrary headers. |
| [#4294: Make Rules less clunky](https://github.com/wekan/wekan/issues/4294) | Board Settings → Rules | Rule editing exists; multiple triggers/actions and variable-valued action fields need schema/execution semantics beyond the current single trigger/action pair. |
| [#4278: Feature Request: Send a reminder to the assigned person if a task is due](https://github.com/wekan/wekan/issues/4278) | Board Settings → Notifications / Rules | Due reminders and scheduled rule triggers exist. Per-board reminder/webhook configuration, assignee email recipients and start-date rule reminders remain separate gaps. |
| [#4265: Feature Request: Hidden Boards list at All Boards page, and Reorganize Board OrgsTeamsPeople](https://github.com/wekan/wekan/issues/4265) | All Boards | Workspace organization exists; automatic alphabet/label grouping and per-user hidden-board/team opt-out semantics remain incomplete. |
| [#4256: Feature Request: Visibility of label texts and other settings should be per board (currently per user)](https://github.com/wekan/wekan/issues/4256) | Board View / Member Settings | Board defaults and label flags exist; independently remembered per-board user view selection is still missing from the global profile preference. |
| [#4250:  Can move one checklist from one card to another one  card's checklist?](https://github.com/wekan/wekan/issues/4250) | Checklist → Move | Move support exists; full cross-board checklist item/history/permission preservation is not yet browser-verified here. |
| [#4223: [Feature Request] Master Dashboard similar to Bigboard plugin for Kanboard.](https://github.com/wekan/wekan/issues/4223) | Board View → Bigboard | Bigboard exists; the expanded request for synchronized project/swimlane aggregation is not completed by the dashboard alone. |
| [#4198: Feature Request: activitypub compatibility](https://github.com/wekan/wekan/issues/4198) | Board Settings → Integrations | ActivityPub federation requires actor identity, delivery and authorization contracts; no untested outbound federation added. |
| [#4178: Feature Request: When adding/removing user to/from Team/Org, add/remove user to/from all boards of Team/Org with edit rights etc](https://github.com/wekan/wekan/issues/4178) | Admin Panel → Teams / Organizations | Automatic membership propagation/revocation must preserve explicit board roles and membership provenance. No overwrite of manually assigned permissions. |
| [#4160: only Move card possible, Copy or Link to not possible.](https://github.com/wekan/wekan/issues/4160) | Board Settings → Rules → Card actions | Link actions exist; cross-board Copy Card rule action still needs destination picker, execution authorization and copy coverage. |
| [#4042: Feature / Is html embedding possible?](https://github.com/wekan/wekan/issues/4042) | Board Settings / public metadata | Site branding exists; board/card social metadata needs explicit public-only response handling before exposing content to crawlers. |
| [#3948: Feature Request: Email with attachments automated responses from Wekan](https://github.com/wekan/wekan/issues/3948) | Email integration | Inbound mail/attachments and automatic replies require a receiving-mail contract and end-to-end mail service tests. |
| [#3815: [Feature Request] More Variables in String Templates](https://github.com/wekan/wekan/issues/3815) | Rules / Custom Fields | Existing variables do not implement arbitrary custom-field/string-template evaluation; escaping and value lookup contracts remain open. |
| [#3695: rocketChat notifications - webhooks](https://github.com/wekan/wekan/issues/3695) | Board Settings → Outgoing Webhooks | Structured assigned/joined-user payload completeness and recipient-specific routing need transport-level fixtures. No new personal fields emitted without coverage. |
| [#3361: Filter function for the calendar / calendar list](https://github.com/wekan/wekan/issues/3361) | Board Filter / Calendar | Fixed blank reopened filter inputs; calendar grid/list honor active filters in browser tests. |
| [#3318: Problem with "Outgoing Webhooks" to Rocket.Chat . Wekan in Sandstorm ](https://github.com/wekan/wekan/issues/3318) | Sandstorm | Requires a live Sandstorm grain, capability-based networking/RPC or outer-shell URL verification; standalone tests do not cover it. |
| [#3297: [ENHANCEMENT] Outgoing Webhook Data Improvements for better usabillity and cross language support](https://github.com/wekan/wekan/issues/3297) | Board Settings → Outgoing Webhooks | Structured assigned/joined-user payload completeness and recipient-specific routing need transport-level fixtures. No new personal fields emitted without coverage. |
| [#3275: add thumbnail processing](https://github.com/wekan/wekan/issues/3275) | Card → Attachments | Thumbnail serving needs versioned routes and all storage backends, not only resizing; original-file serving remains unchanged. |
| [#3257: Card to Card attachments/links](https://github.com/wekan/wekan/issues/3257) | Card → Attachments / Links | Card URL attachments and Trello import reconciliation differ from linked-card mirrors; import fixture coverage is still needed. |
| [#3256: Template/theme: Big picture with hot area](https://github.com/wekan/wekan/issues/3256) | Board View | Image-map card coordinates/hot areas require a new model and renderer; existing location/maps do not establish the requested behavior. |
| [#3249: Feature Request: Internal boards](https://github.com/wekan/wekan/issues/3249) | Permissions | Requested public/internal/list-specific grants alter existing access boundaries. Excluded from this permission-preserving implementation. |
| [#3235: Add a new rule for copying cards: IF [] THEN COPY THIS CARD TO THE [] BOARD AND TO THE LIST []](https://github.com/wekan/wekan/issues/3235) | Board Settings → Rules → Card actions | Link actions exist; cross-board Copy Card rule action still needs destination picker, execution authorization and copy coverage. |
| [#3195: {question/feature} Custom field values for rule values](https://github.com/wekan/wekan/issues/3195) | Rules / Custom Fields | Existing variables do not implement arbitrary custom-field/string-template evaluation; escaping and value lookup contracts remain open. |
| [#3194: {request} Calendar mode similar to Trello's](https://github.com/wekan/wekan/issues/3194) | Board View → Calendar | Calendar exists; multiline titles, labels, date-only display and list/card sort parity need a dedicated rendering contract and tests. |
| [#3143: Feature Request: Display-only Custom Field ](https://github.com/wekan/wekan/issues/3143) | Card → Custom Fields | Display-only fields require server enforcement across DDP, REST, rules and imports; a disabled input alone would be insufficient. |
| [#3022: Feature Request: Granular Roles, create read only etc custom role permission combinations](https://github.com/wekan/wekan/issues/3022) | Admin Panel → People | Umbrella request with unfinished identity, grouping and role contracts; existing individual capabilities do not complete the whole request. |
| [#2953: Feature Request: possibility to combine multiple conditions and multiple actions on one rule](https://github.com/wekan/wekan/issues/2953) | Board Settings → Rules | Rule editing exists; multiple triggers/actions and variable-valued action fields need schema/execution semantics beyond the current single trigger/action pair. |
| [#2906: Adding / Archiving Lists via Script](https://github.com/wekan/wekan/issues/2906) | REST API | List scripting uses authenticated REST, not direct database writes. Full requested scripting workflow not executed here. |
| [#2809: Feature request: Link the whole list from Board A to Board B](https://github.com/wekan/wekan/issues/2809) | Board View | Nested boards/list mirrors/arbitrary column groupings are wider models than existing linked cards. Synchronization, cycle and source-access behavior remain open. |
| [#2805: Single fixed list titles static at top of swimlanes view](https://github.com/wekan/wekan/issues/2805) | Board View → Swimlanes | One shared fixed list-header row is a layout change involving shared/unshared lists and mobile behavior; not verified here. |
| [#2796: Main Boards - Drag n Drop and/or Color ](https://github.com/wekan/wekan/issues/2796) | All Boards | Dragging and board colors exist; complete thread/device behavior needs focused browser coverage before closure. |
| [#2761: Common labels for all boards](https://github.com/wekan/wekan/issues/2761) | Board Settings → Labels | Labels remain board-owned; shared catalogs require explicit sharing scope and synchronization semantics. |
| [#6548: LDAP debugging not possible within LXC container?](https://github.com/wekan/wekan/issues/6548) | Deployment / LDAP | Needs reported LXC/Snap/AD environment and sanitized logs; no blind logging of authentication payloads. |
| [#2713: Feature requests: edit rules; send card to mail](https://github.com/wekan/wekan/issues/2713) | Board Settings → Rules | Rule editing exists; sending card file attachments by email requires verified streaming/MIME behavior. |
| [#2698: GitLab integration with Wekan Rules Sync](https://github.com/wekan/wekan/issues/2698) | External integrations | GitLab/Gogs/Nextcloud synchronization extends beyond existing login/webhooks and needs the corresponding server and integration tests. |
| [#2662: FreeBSD](https://github.com/wekan/wekan/issues/2662) | Deployment | FreeBSD packaging/runtime cannot be verified on this macOS host. |
| [#2644: Feature Request: Add confirmation asking dialog to Archive Board and Clone Board at All Boards page](https://github.com/wekan/wekan/issues/2644) | All Boards → tile Actions | Implemented: reachable archive/duplicate confirmations, cancellation, allowed operation and denied archive tested. |
| [#2509: Does Wekan can give me a chance to have a customized card style?](https://github.com/wekan/wekan/issues/2509) | Board Settings → Card | Existing card/custom-field appearance controls cover parts; screenshot-specific image-field/layout request needs a concrete verified rendering implementation. |
| [#2489: Feature Request: Sub-columns / Common WiP-limit for multiple columns](https://github.com/wekan/wekan/issues/2489) | List → WIP limits | Shared multi-column/dynamic capacity needs group ownership and enforcement semantics; existing individual WIP limits are insufficient. |
| [#2460: Feature Request: Login with SQRL](https://github.com/wekan/wekan/issues/2460) | Authentication | SQRL integration is not present; no custom unreviewed authentication protocol added. |
| [#2450: [Feature] Pretty ID for Cards](https://github.com/wekan/wekan/issues/2450) | Board Settings → Card numbering | Existing card numbers are not globally unique prefixed board keys; atomic allocation, imports and moves need coordinated tests. |
| [#2449: [Feature] Board Key](https://github.com/wekan/wekan/issues/2449) | Board Settings → Card numbering | Existing card numbers are not globally unique prefixed board keys; atomic allocation, imports and moves need coordinated tests. |
| [#2435: Feature Request: New Rule - Send email (功能需求：新建规则-添加收件人)](https://github.com/wekan/wekan/issues/2435) | Rules → Send email | Recipient autocomplete/current-card people selection needs a scoped picker and mail delivery tests. |
| [#6549: OAuth2 Partially Working - Rocket.Chat->G Suite SAML App](https://github.com/wekan/wekan/issues/6549) | Authentication | Provider redirect/session behavior needs the actual Rocket.Chat/G Suite/Auth0 chain; local URL tests are insufficient. |
| [#2321: Feature Request: Remove Activity from Duplicated Board](https://github.com/wekan/wekan/issues/2321) | All Boards → Duplicate | Verified existing behavior: board duplication excludes old board/card activity history with and without cards; source history survives, cancellation creates no copies, and ordinary members cannot duplicate. Chromium regression added for #2321. |
| [#2290: Support for Login and register page webhook.](https://github.com/wekan/wekan/issues/2290) | Admin Panel → Integrations | Login/registration webhooks add an identity event transport; need minimization, delivery and failure-isolation tests. |
| [#2217: Feature Request: Add admin panel option to show Rules option to non-admin users](https://github.com/wekan/wekan/issues/2217) | Admin Panel → Permissions | Showing Rules to more roles changes rule-management authority. Existing restrictions remain in place. |
| [#2211: Feature Request: When using Auth0 login, redirect automatically to fullscreen Auth0 login page, instead of current login popup.](https://github.com/wekan/wekan/issues/2211) | Authentication | Provider redirect/session behavior needs the actual Rocket.Chat/G Suite/Auth0 chain; local URL tests are insufficient. |
| [#2208: Sandstorm Wekan Feature Requests: Wekan email sending, CRON, Subtasks, env setting UI](https://github.com/wekan/wekan/issues/2208) | Sandstorm | Requires a live Sandstorm grain, capability-based networking/RPC or outer-shell URL verification; standalone tests do not cover it. |
| [#2171: Feature Request: Improve behavior of ctrl+f search](https://github.com/wekan/wekan/issues/2171) | Board search | Native browser Find with lazy cards depends on rendered content and scrolling. App search is not equivalent proof. |
| [#2167: Document Sandstorm API](https://github.com/wekan/wekan/issues/2167) | Sandstorm | Requires a live Sandstorm grain, capability-based networking/RPC or outer-shell URL verification; standalone tests do not cover it. |
| [#2148: Feature Request: notification mail template](https://github.com/wekan/wekan/issues/2148) | Admin Panel → Notifications | Notification delivery exists; requested customizable HTML layout/templates need escaping and actual MIME delivery tests. |
| [#2145: Feature Request: Mini date field](https://github.com/wekan/wekan/issues/2145) | Board Settings → Card | Date display settings exist; requested compact creation/modification date rendering still needs exact UI verification. |
| [#2141: Notification Frequency Settings for user or member end](https://github.com/wekan/wekan/issues/2141) | Member Settings → Notifications | Settings/tray/reminders exist; frequency batching and offline push delivery are not fully covered by this local run. |
| [#2131: Insert a swimlane above the current one](https://github.com/wekan/wekan/issues/2131) | Swimlane → Add | Implemented: above/below choice in existing popup; multiline ordering and denied writes tested. |
| [#2111: Feature Request: Hint on Cards for changes or new entrys as user-specific optionally enabled subscription](https://github.com/wekan/wekan/issues/2111) | Member Settings / Card | Unread-change markers need per-user read checkpoints, update rules and tests; History alone is not a read receipt. |
| [#2110: Feature Request: 1) Card-specific avatar color and avatar tooltip additional text 2) Order of Members on card and on detail page reversed](https://github.com/wekan/wekan/issues/2110) | Card → Members | Per-card member color/tooltip semantics remain separate from ordering and board roles. |
| [#2107: Ability to hide list/swimlane/calendar view, and hide/collapse some/all of swimlanes/lists](https://github.com/wekan/wekan/issues/2107) | Board Settings → Board View | Existing per-board view visibility verified through settings/menu; existing unit guards protect the default view. |
| [#2076: Feature Request: New rule triggers - card moved left/right](https://github.com/wekan/wekan/issues/2076) | Rules → Triggers | Directional move triggers need list-order comparison and deterministic placement behavior; no new trigger added without those tests. |
| [#2044: Feature request : Possibility to choose "OR" or "AND" in the filter](https://github.com/wekan/wekan/issues/2044) | Board Filter → Labels | Implemented: AND/OR selection; inclusion, exclusion, reset and visible card behavior tested. |
| [#2043: Feature Request: Progress Bar with Chart of on going work process statistics for each board](https://github.com/wekan/wekan/issues/2043) | Board View → Charts | Existing charts substantially cover reporting, but the open-ended progress-bar/export discussion is not treated as fully proven. |
| [#2040: Feature Request: For a list, set a sort order by specifying ordered list of labels in order of high to low](https://github.com/wekan/wekan/issues/2040) | List → Sort cards | Ordered multi-label priority rules need a comparator/editor and stable ties; ordinary label filtering is not this feature. |
| [#2026: Feature Request: Push Notification, and notifications area with settings](https://github.com/wekan/wekan/issues/2026) | Member Settings → Notifications | Settings/tray/reminders exist; frequency batching and offline push delivery are not fully covered by this local run. |
| [#2017: WebHooks to NodeRed - HowTo?](https://github.com/wekan/wekan/issues/2017) | Board Settings → Outgoing Webhooks | Historic Node-RED delivery report needs the receiving flow or a reproducible transport failure; no current source defect established. |
| [#2015: Feature Request: Add QR code for retrive easily a card](https://github.com/wekan/wekan/issues/2015) | Card → Copy link | QR generation/export still missing; any adoption needs maintained dependency/license review and actual decode verification. |
| [#2012: [important] kanban basic function should be done, and then start new feature.](https://github.com/wekan/wekan/issues/2012) | Product discussion | Broad kanban/time/subtask workflow discussion; no single testable completion criterion. |
| [#2009: Wekan on Uberspace 7?](https://github.com/wekan/wekan/issues/2009) | Deployment | Uberspace runtime/mail behavior requires that hosting environment. |
| [#1990: Feature Request: Hide or collapse subtask boards on home/all boards view](https://github.com/wekan/wekan/issues/1990) | All Boards | Helper-board filtering exists; the requested per-user collapse/hide behavior needs a dedicated test against subtask boards. |
| [#1953: Feature Request: Create UI setting for board's default behaviour for subtasks' swimlane](https://github.com/wekan/wekan/issues/1953) | Board Settings → Subtasks | Defaults/deposit behavior exists; requested per-board swimlane/landing-list picker behavior not fully verified here. |
| [#1933: Feature request: if card has one comment then show it as tooltip](https://github.com/wekan/wekan/issues/1933) | Card → Comments badge | Single-comment tooltip must respect comment visibility, lazy data and plain-text escaping; existing count badge is not equivalent. |
| [#1931: Feature Request: Linked Subtasks](https://github.com/wekan/wekan/issues/1931) | Card → Subtasks | Existing-card subtask attachment exists; cross-board linked-subtask interpretation needs precise permission/relationship tests. |
| [#1921: Issue: Resend verification or change the flag?](https://github.com/wekan/wekan/issues/1921) | Admin Panel → People / Account verification | Resend controls exist; reported confirmation-link failure needs actual email/token/browser flow verification. |
| [#1915: Feature request : Possibility to hide cards according to a date](https://github.com/wekan/wekan/issues/1915) | Board Filter / Search | Due-date and advanced filters exist; other date fields, move-history ranges, rolling cutoffs and saved combinations remain broader requests. |
| [#1904: Feature Request: Add way to restrict OAuth from Google to a domain](https://github.com/wekan/wekan/issues/1904) | Admin Panel → Authentication | Domain restrictions require verification of the Google OAuth provisioning path, including unverified provider email claims. |
| [#1871: Feature Request: Filter Subtasks by Parent](https://github.com/wekan/wekan/issues/1871) | Card → Subtasks / Filter | Implemented: Card Actions → Filter: Subtasks and Filter → Parent card reuse parentId. Node and Chromium coverage verifies direct children, read-only use, resets and private-parent boundaries. |
| [#1844: Add Feature: Smart Search of Cards](https://github.com/wekan/wekan/issues/1844) | Global Search | Title/description/comment search code exists; archived content and private-board exclusion need combined end-to-end proof before closure. |
| [#1781: Feature Request: Improve how intuitively subtasks work: Landing list for subtasks is not linked to the subboard](https://github.com/wekan/wekan/issues/1781) | Board Settings → Subtasks | Defaults/deposit behavior exists; requested per-board swimlane/landing-list picker behavior not fully verified here. |
| [#1759: [New feature] Preserve cards' labels at moving/copying cards to another board](https://github.com/wekan/wekan/issues/1759) | Card → Move / Copy | Label remapping code exists; both cross-board move and copy require preservation/destination-permission browser coverage. |
| [#1758: Feature Request: Use EXIF orientation of uploaded pictures](https://github.com/wekan/wekan/issues/1758) | Card → Attachments | EXIF rendering depends on browser and preprocessing; requires orientation-tagged upload/download fixtures. |
| [#1748: Feature Request: Add Swimlane position info to cards](https://github.com/wekan/wekan/issues/1748) | Board Settings → Card | Existing swimlane name on minicards verified in Lists view, including the disabled state. |
| [#1704: Feature Request: Move List(s) to different board](https://github.com/wekan/wekan/issues/1704) | List → Move | Cross-board move code exists; metadata, child cards and permissions need complete browser verification before closure. |
| [#1631: Feature Request: Add option to receive notifications from other users only](https://github.com/wekan/wekan/issues/1631) | Member Settings → Notifications | Self-notification controls need actual event/recipient delivery verification, beyond a settings checkbox. |
| [#1618: Feature Request: Summary of actions, leader for action, actions in calendar.](https://github.com/wekan/wekan/issues/1618) | My Cards / Calendar | Personal card overview exists; checklist-action leaders/deadlines/calendar aggregation remain broader than card-level assignments. |
| [#1604: Feature Request: visual indicator for changes since last login](https://github.com/wekan/wekan/issues/1604) | Member Settings / Card | Unread-change markers need per-user read checkpoints, update rules and tests; History alone is not a read receipt. |
| [#6552: Increasing file descriptions / ulimit for Caddy in Wekan Snap?](https://github.com/wekan/wekan/issues/6552) | Snap deployment | Caddy process limits need verification of the deployed Snap wrapper and service limits. |
| [#1566: Feature Request: Announcement for each board](https://github.com/wekan/wekan/issues/1566) | Board Settings | Board-specific announcement field/editor/display is still missing; site announcement alone is not equivalent. |
| [#1499: Filter/hide old tasks in done tab](https://github.com/wekan/wekan/issues/1499) | Board Filter / Search | Due-date and advanced filters exist; other date fields, move-history ranges, rolling cutoffs and saved combinations remain broader requests. |
| [#1463: Feature Request: Auto generate url-links from a token for references into other tools](https://github.com/wekan/wekan/issues/1463) | Card text / Custom Fields | String templates exist; arbitrary inline reference-token rewriting needs safe URL rules and renderer tests. |
| [#1455: Feature Request: use Outgoing Webhook behind Squid proxy](https://github.com/wekan/wekan/issues/1455) | Deployment → Outgoing Webhooks | Proxy environment workaround is documented in the thread; actual Squid/proxy transport is not verified here. |
| [#1377: Feature Request: Activitity-List over all Boards](https://github.com/wekan/wekan/issues/1377) | All Boards / Activity | Per-board activity and personal notifications exist; a permission-filtered all-board activity feed is a separate request. |
| [#6554: Feature Request: Add Gogs support](https://github.com/wekan/wekan/issues/6554) | External integrations | GitLab/Gogs/Nextcloud synchronization extends beyond existing login/webhooks and needs the corresponding server and integration tests. |
| [#1324: Feature Request: Bitbucket login](https://github.com/wekan/wekan/issues/1324) | Authentication | Bitbucket provider implementation and real login flow are not verified. |
| [#1297: Feature Request: Advanced WebHooks with Mattermost](https://github.com/wekan/wekan/issues/1297) | Board Settings → Outgoing Webhooks | Structured assigned/joined-user payload completeness and recipient-specific routing need transport-level fixtures. No new personal fields emitted without coverage. |
| [#1293: Support android share intent](https://github.com/wekan/wekan/issues/1293) | Mobile / share target | Android share intent requires native/PWA share-target testing on a supported device. |
| [#1273: Feature Request: Don't remove string for autocomplete label and member](https://github.com/wekan/wekan/issues/1273) | Add Card → Autocomplete | Current autocomplete intentionally consumes assignment tokens; a retain-text option needs behavior and composer tests. |
| [#1188: Add Feature: Copy URL of a card. Works on Standalone, but not on Sandstorm.](https://github.com/wekan/wekan/issues/1188) | Sandstorm | Requires a live Sandstorm grain, capability-based networking/RPC or outer-shell URL verification; standalone tests do not cover it. |
| [#1178: Enable hand writing / sketching on card ](https://github.com/wekan/wekan/issues/1178) | Card → Attachments | Sketch input/upload remains missing; pointer/touch and authorized attachment upload require end-to-end coverage. |
| [#1126: Add Feature: Physical RFID kanban cards](https://github.com/wekan/wekan/issues/1126) | Hardware integration | RFID request requires physical reader/tag workflow; cannot validate hardware from this app checkout. |
| [#1100: Matrix notifications](https://github.com/wekan/wekan/issues/1100) | External integrations | Matrix notifications plus incoming task commands require homeserver/bot authentication and permission tests. |
| [#1040: Support LibreJS](https://github.com/wekan/wekan/issues/1040) | Build / licensing | LibreJS acceptance requires generated-bundle license annotations and an actual extension validation run. |
| [#935: Filter cards by date or tags](https://github.com/wekan/wekan/issues/935) | Board Filter / Search | Due-date and advanced filters exist; other date fields, move-history ranges, rolling cutoffs and saved combinations remain broader requests. |
| [#916: Add Feature: Support for HTTPS (TLS/SSL)](https://github.com/wekan/wekan/issues/916) | Deployment → TLS | Reverse-proxy TLS support exists; this source run does not verify the reported CentOS/manual TLS setup. |
| [#864: Board List view](https://github.com/wekan/wekan/issues/864) | Board View → Table | Table view exists; requested exact list layout/device behavior needs dedicated acceptance coverage. |
| [#824: Add Feature: General Avatar URL feature, for url to local intra server or Gravatar, automatically pulled to profile avatar, all settings in environment variables](https://github.com/wekan/wekan/issues/824) | Member Settings → Avatar | Avatar URLs/settings exist; automatic provider lookup/privacy requirements remain broader than uploading an avatar. |
| [#810: Feature Request: Add feature: Remember previously entered data when adding new card](https://github.com/wekan/wekan/issues/810) | Add Card | Implemented with existing owner-only UnsavedEdits; closing restores title, saving clears it, another user cannot overwrite it. |
| [#802: Add Feature: Teams/Organizations similar to Trello](https://github.com/wekan/wekan/issues/802) | Admin Panel → People | Umbrella request with unfinished identity, grouping and role contracts; existing individual capabilities do not complete the whole request. |
| [#794: Add feature: Using API to script Email to board/card, notifications on cards to email, etc](https://github.com/wekan/wekan/issues/794) | Email integration | Inbound mail/attachments and automatic replies require a receiving-mail contract and end-to-end mail service tests. |
| [#793: Add feature: Auto add user name to a moved card](https://github.com/wekan/wekan/issues/793) | Card → Members / Rules | Move actor history exists; removable actor attribution on the minicard is a different unverified feature. |
| [#687: [Feature Request] ownCloud / Nextcloud Integration](https://github.com/wekan/wekan/issues/687) | External integrations | GitLab/Gogs/Nextcloud synchronization extends beyond existing login/webhooks and needs the corresponding server and integration tests. |
| [#632: please add to rancher catalog:  https://github.com/rancher/rancher](https://github.com/wekan/wekan/issues/632) | External packaging | Rancher catalog is maintained outside this repository; current compatibility not verified. |
| [#337: Accessibility feedback](https://github.com/wekan/wekan/issues/337) | Accessibility | Ongoing accessibility umbrella; keyboard improvements do not prove screen-reader usability across all workflows. |
| [#211: Feature idea: Same cards, multiple column sets](https://github.com/wekan/wekan/issues/211) | Board View | Nested boards/list mirrors/arbitrary column groupings are wider models than existing linked cards. Synchronization, cycle and source-access behavior remain open. |
| [#140: Collaborative edition](https://github.com/wekan/wekan/issues/140) | Card editor | Draft persistence does not implement concurrent collaborative text editing/merging. |

## Verification and limits

The final Chromium run passes **all ten scenarios** in:

- `issue-menu-actions.e2e.js`: above/below insertion, read-only insert denial,
  clone/archive confirmation and cancellation, non-admin archive denial.
- `issue-calendar-filter.e2e.js`: calendar grid and list filtering, restored
  text, unmatched/cleared filters, AND/OR labels and exclusion precedence.
- `new-card-title-draft.e2e.js`: restore/clear drafts, independent list drafts,
  another member's blank composer and rejected draft overwrite.
- `issue-existing-views.e2e.js`: swimlane names in Lists view and Board Settings
  hiding a view from the actual menu while retaining the default.

Eleven focused Node suites pass: `allBoardsPage`, `boardMutationGuard`,
`boardViewSettings`, `calendarFilter`, `cloneBoardWithoutCards`,
`filterPanelState`, `minicardSwimlaneNameOnMinicard`, `multilineTitles`,
`newCardTitleDraft`, `rtl`, and `swimlanePlacement`. The local Meteor app
compiles and runs. No new dependencies or new server permission rules were
introduced. FerretDB's current find handler was inspected; the new label
combination is evaluated by client Minimongo. No live FerretDB matrix was run.

The broader `node tests/run-node-suites.cjs` run is **not green**: 1,233 suites
ran and 136 failed. Its RTL failure in the new tile button was corrected and
that suite now passes. `apiBodyParsing` initially could not open a local socket
inside the sandbox; all seven of its tests pass with local socket access.
The rest include existing translation-completeness failures (for example the
untranslated `draggable` key), documentation assertions, old test fixtures,
and platform/environment checks. Replaying the changed source files from HEAD
reproduces the `listBodyDragLifecycle` missing-stub-method failure and the
`popupTitles` existing `moveObjects` finding. These failures are not hidden,
weakened, or claimed fixed by the focused passing run.

External identity providers, Sandstorm, Snap, RFID/Android/watch hardware,
third-party integrations, other browser engines and full database-backend
conformance were not tested. Items marked remaining in the inventory have not
been added or closed. Some are feasible future implementation work; lack of a
verified implementation in this pass is not evidence that they are impossible.

## Follow-up inventory refresh

A fresh GitHub inventory on 2026-09-27 contains 132 open issues (excluding pull
requests). The table above preserves the original 140-issue snapshot rather
than silently dropping rows for issues closed since that audit.

Read #2321 in full (no comments) and traced `Boards.copy`, `Swimlanes.copy`
and `Cards.copy`: none copies Activities records. Live Chromium/MongoDB tests
exercise the existing multiselection Duplicate actions with and without cards,
seed old board and card activity events, and verify they remain only at the
source. Fresh destination creation events are allowed. The permission rejection
scenario still passes. No model or permission change is needed to close #2321.

Read #1273 and its complete comment thread: Add Card autocomplete still consumes
member/label tokens in `listBody.js`. A retain-text option is not implemented;
this issue remains open. No claim is made that the remaining inventory is fixed.
