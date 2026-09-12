# Roadmap export audit

Audit started 2026-09-12. Implementation and source review are incomplete.

The replacement `.tools/export.json` parses as JSON and contains all 14
expected board-export sections, 138 cards, 21 lists and seven swimlanes.
Seven attachment payloads decode successfully and are nonempty; the older
`cat.jpeg` payload is empty. Another `cat.jpeg` record marked
`storage-migrate` contains 8,175 bytes. Four attachment records reference
absent cards and one checklist item references an absent checklist. These
may be stale database records; comparison with the live board is required
to certify completeness. Zero comments are exported.

The board title is "WeKan ® Open Source Kanban board with MIT license".
Unchecked roadmap items must be compared with current source before changes;
Done and archived cards are historical status, not proof of current behavior.

## Reviewed behaviors

- OAuth2 email-domain restriction: added `OAUTH2_ALLOWED_EMAIL_DOMAINS` to
  the existing generic OAuth2/OIDC callback. Exact domains, no network lookup,
  no new dependency. Tests execute the actual callback with mocked responses.
- Date-change rule triggers: existing `server/triggersDef.js`,
  `server/models/cards.js` and `tests/rulesDateFieldTrigger.test.cjs`.
- Rule editing: existing `server/rulesButton.js`, `server/models/rules.js`
  and `tests/ruleUpdateInPlace.test.cjs`.
- Bidirectional minicard text: existing title/composer direction attributes
  and isolation covered by `tests/minicardBidiIsolation.test.cjs`. This does
  not certify every UI element has automatic direction support.

## Cards awaiting full source review

This inventory includes informational and prototype cards. Only remaining
Meteor 3 functionality that can operate on-premise without Internet access
belongs in the implementation scope. Cloud-only integrations and unrelated
programming-language rewrites require no implementation for this task.

| Card ID | List | Title |
| --- | --- | --- |
| 9bFK4idL3Cdbf3YCP | Demo + Wishes :rainbow: | # Demo card :thumbsup: :heart: :tada: |
| uanq777TgLG2aQMTj | Minimize Optimize | Incorrect email notification |
| JdpyPyezsMhmcxsqS | In Progress | List not scrolling when dragging cards to top |
| Sh28EFSDKGdeDy3Hu | Minimize Optimize | Gravatar icons |
| rAEJL6Je7H7zwQoYL | Minimize Optimize | Header login |
| WGi6H5Sev28f73rtW | RAD/Mobile/Desktop App/Accessible/Voice/HTML4 prototypes that use WeKan API | Friend integration: Login |
| 6fjTaDWXT5jJken2u | Attachments Import Export | GitLab integration |
| w75Eo7yS9vtBWPxbz | Login | SAML / Shibboleth based on RocketChat |
| j9MtNahuvqs5ZQeEA | UI | 1. 15h Collapsible Swimlanes with count + rename lists in swimlane [#2107](https://github.com/wekan/wekan/issues/2107) 2. 10h [Bug] Full path display of subtasks cards disappears after a refresh of the subtask board [#3453](https://github.com/wekan/wekan/issues/3453) 3. 10h [UX Bug] Subtask "View it" button to another tab, open the parent card instead of the subtask [#3743](https://github.com/wekan/wekan/issues/3743) 4. 10h Feature Request: Filter Subtasks by Parent [#1871](https://github.com/wekan/wekan/issues/1871) |
| KJY6pxvvHNAgQFPoj | Think | Main Boards - Drag n Drop and/or Color |
| a9wuKBsHjHZFFfvTG | Permissions | Board key like Jira |
| Bq96jdi2QnavtmgRc | Permissions | Pretty ID like Jira |
| 8gqgDcyPtNLhouNFu | Permissions | Multi board calendar like Planyway from Trello |
| BqurJTQkcdrJxHqxw | Permissions | Rules Feature: Trigger on Date Change |
| E6ezju9eqZR6WYnxr | Permissions | - Truncate/Scroll board title text -  2FA login for clients -  LDAP with employees ID -  Customers and Organizations login pages separately - Integrations to bots, REST API, Webhooks |
| vsRY59RbqNMaL59S7 | Minimize Optimize | Linked cards make load all cards of database |
| rsf9TS7SNPNq8Fp3z | Minimize Optimize | Mobile, Desktop, Calendar, Edit Rule fixes and features. 10h prepaid +  10h postpaid = total 20h. |
| JxrT6fkxdGcBLcp6o | Minimize Optimize | UI improvements |
| LPEBG3ThH2ETMXCmw | Minimize Optimize | Map card |
| S22RwzJc43uv9dShH | UI | Got away from BountySource, so that BountySource would not grab bounty money. Do not use BountySource anymore, instead use [Commercial Support](https://wekan.team/commercial-support/) |
| 2gRNZom6tmgmrxDnx | Minimize Optimize | Fix Import/Export CSV/TSV |
| s7SkzYviC2e963FkT | Minimize Optimize | Mobile and Desktop apps |
| oJWy3mTt4dYBFhYTa | Demo + Wishes :rainbow: | Wekan business model |
| W9nN8mkD6kz6v2pKQ | Minimize Optimize | Registering to not overwrite profile language |
| CJ5GXJ63uxMFa8se3 | Notifications | Email to board. Waits for Mass Import to be implemented first. |
| zJ8L5mPeRCG5ZaBJa | Login | Drag and drop between checklists closes the card sometimes on Firefox |
| MLrgcbaYY2Muuqx7W | Permissions | Removed `wekan-` from exported filenames, for whitelabeling. |
| YLpeqYCgBnfmW6CKW | Minimize Optimize | Granular Roles, create read only etc custom role permission combinations |
| 9zZe4uc69vGzJwBMz | Minimize Optimize | Try to find out how to exclude exceljs from browserside javascript, so that Wekan would work on MyPal webbrowser. |
| so45bWgr8xntnEvDJ | Minimize Optimize | NormalAssignedOnly: only Assigned cards are visible. Etc. |
| mXXFpsWPcBbNQtZEj | Minimize Optimize | Grant to Wekan bugfixes, accessibility and permissions |
| r9wbs35A62u8xF2Rj | Notifications | Notifications Settings (After Mass Import from Trello is ready, this Notifications Settings will be paid, it is not paid yet) |
| EstqPusbf97zhSvR4 | Minimize Optimize | Wekan/Kimai Time Tracking integration |
| y6KPAMyc9aERbeazH | Minimize Optimize | Email templates |
| o9hqer5oxuJHG7bha | Minimize Optimize | Change Favicon |
| Ks9vKCScaKZ6CM6cn | Attachments Import Export | Board Export to HTML to also show card content when clicked |
| DXEKGpi8G6fMxNcRD | Notifications | Combine notifications to Email and/or Tray |
| trLCQdMFdofYSktpP | RAD/Mobile/Desktop App/Accessible/Voice/HTML4 prototypes that use WeKan API | Wekan Backend = Multiple versions of next generation Wekan, built from one source code to all platforms. Starting with prototypes for each version. |
| Lepz6jgwy4WG2H4Gy | Minimize Optimize | Backend changes |
| HJAiF3uRSJHGeeRdE | Minimize Optimize | Porting WeKan MongoDB data to other databases, queries to SQL, Sync |
| SYohzx8Lhrna3AqT8 | Minimize Optimize | In-Place [translating](https://transifex.com/wekan/wekan) of WeKan |
| CrHbsSdzqGfFGzsH8 | Minimize Optimize | Nested Icons, each to have assignable permission levels |
| ztC2EjpM8HSqaevGR | Minimize Optimize | Add User/Admin API for everything |
| LnaaBDiyk93dJ4WQa | RAD/Mobile/Desktop App/Accessible/Voice/HTML4 prototypes that use WeKan API | At Mobile Web, toggle between Mobile UI and Desktop UI |
| AT5vCGeESadnC4Nqc | RAD/Mobile/Desktop App/Accessible/Voice/HTML4 prototypes that use WeKan API | [HaxeUI](https://www.haxeui.org) |
| S6jegFB3CWoBJieqS | RAD/Mobile/Desktop App/Accessible/Voice/HTML4 prototypes that use WeKan API | [Gambas](http://gambas.sourceforge.net) |
| Air3yawSKxpmLjurJ | RAD/Mobile/Desktop App/Accessible/Voice/HTML4 prototypes that use WeKan API | [Lazarus/FreePascal](http://gambas.sourceforge.net) |
| xgwAfMerjm5dT3qk8 | RAD/Mobile/Desktop App/Accessible/Voice/HTML4 prototypes that use WeKan API | [Redox OS](https://www.redox-os.org) |
| cd6rAdwYyChn6RBT8 | RAD/Mobile/Desktop App/Accessible/Voice/HTML4 prototypes that use WeKan API | Apple [SwiftUI](https://developer.apple.com/xcode/swiftui/) |
| MFvtrD9EpQDMknW5F | RAD/Mobile/Desktop App/Accessible/Voice/HTML4 prototypes that use WeKan API | Find all examples how to make Mobile Kanban Apps, and create minimal example that adds card with API to WeKan board |
| He7NNY7x5yXTu22uE | RAD/Mobile/Desktop App/Accessible/Voice/HTML4 prototypes that use WeKan API | WeKan Hosting Platform |
| 7aJniMXBtt6dMnQDJ | Minimize Optimize | Embedded |
| cgD3TwadeoufzH6sA | RAD/Mobile/Desktop App/Accessible/Voice/HTML4 prototypes that use WeKan API | PHP |
| o5rC9BSmeeRpEEFAT | RAD/Mobile/Desktop App/Accessible/Voice/HTML4 prototypes that use WeKan API | [Gemini](https://en.wikipedia.org/wiki/Gemini_(protocol)) |
| 3BKXHfuN5NfQycXse | RAD/Mobile/Desktop App/Accessible/Voice/HTML4 prototypes that use WeKan API | [CloudFlare Workers](https://workers.cloudflare.com) |
| nrdgxyZHhe3wnA9SD | RAD/Mobile/Desktop App/Accessible/Voice/HTML4 prototypes that use WeKan API | Go, GDRP, DataBunker, RClone |
| nrjGewSBE3omrvr6D | Minimize Optimize | [Accessibility](https://github.com/wekan/wekan/issues/459). WeKan first page links: Accessible / Voice Control / HTML4 MPA / HTML5 SPA |
| XfZmRCTYFBEKNsPvm | RAD/Mobile/Desktop App/Accessible/Voice/HTML4 prototypes that use WeKan API | [Nim](https://nim-lang.org) |
| prmajcBvhez4P6Bjs | Minimize Optimize | -  Limitations on attachments, size and type (performance) -  Minimizing browser side loaded data (performance) - S3/Minio bucket support for attachments (performance) - Logging, timestamps and user actions (security). Log/activity summary grouping. - Adding Hierarchy within user groups (security/privacy) - Map AD groups to permissions at Admin Panel and add metadata to boards (was: Onboarding, to categorize data for filing (privacy)) - Bugfixes |
| AYmzy9SeCXP7Y6ZGv | Login | CAS login |
| dgAadcPRvtCfJz8Pz | RAD/Mobile/Desktop App/Accessible/Voice/HTML4 prototypes that use WeKan API | Dapsi / Multiverse WeKan |
| gm6fRfLKk9H8SMoTK | Think | ClamAV / ClamScan to scan attachments. Fix bug where this feature prevents migrating attachments. |
| aTYCef9diZA7fo5ps | Minimize Optimize | Why changing list color reloads webpage? Try to find and remove that code. |
| B6nTLLL522AEgZgqM | Minimize Optimize | Fix memory leaks or add automated nightly restarts. |
| QRHCdkxcfsAHyXwA7 | Minimize Optimize | Move from wiki to website |
| h4HATReukjWTTX66o | Login | 1. OAuth/Keycloak logins 2. LDAP group memberships reflect access to boards with 15min sync 3. use LDAP user avatar when logged in through OAuth/Keycloak 4. Others at issues |
| KGzTzKBBuC3RrWrPv | Login | 1. Automatic list of new users 2. Admin all boards memberships 3. Improve notification emails 4. Improve calendar view. |
| 5Ac2FHL9iJ3PZ2sW5 | Minimize Optimize | Embedding WeKan |
| BD4Kdg5cG6wY3uqKf | Minimize Optimize | Calendar movement fixes |
| jCkCDxPj7SroqheKj | Minimize Optimize | Developing enabling Wekan API at Sanstorm. |
| iEpxNs6ERcrTYuhTo | Minimize Optimize | Update WeKan and RocketChat at Sandstorm |
| oRbJosYqCwbocfZt4 | Minimize Optimize | Any file format should eligible for drag/drop as attachment, i.e. drag/drop emails or email attachments or files in general from folders. not just images. https://github.com/wekan/wekan/issues/2936 |
| bWqyw5PFGTYkK4cPW | Minimize Optimize | Make archived subtasks work like completed checklist items. Postpaid 10h. https://github.com/wekan/wekan/issues/3409 |
| CiMZ5umNshEFtmpzh | In Progress | Update Snap Stable, Show checklists on minicard, SAML |
| CZHMR9hikcbyF6uA9 | Minimize Optimize | No new Post-Paid work is accepted, because some customers did not pay Post-Paid development. |
| DhzjYmtswRS2FbMjk | Notifications | Wekan Notifications: group many notifications to one notification, and notification icon fix, issues #2026 #3363 #3967 |
| B9tBCr3DJRksFDCmi | In Progress | 4h of 20h CSV export, tex, zoom, roundrobin, max stack size, avatarUrl, adminUserCount |
| nXeKmeifkghMnf57f | Demo + Wishes :rainbow: | Updating this Roadmap to list everything. Trying to implement all paid features and fixes ASAP during 2026.  Note: Please do not send me any threats, that would slow me down, I'm trying to concentrate do develop every paid feature. If you would like to speed up, you can sponsor with some payment method at https://wekan.team/sponsor/ or https://wekan.team/commercial-support/ , so then I can then spend more time coding WeKan. |
| waYYDXwNymJrRQAmT | Minimize Optimize | SAML+checklistminicard 60h |
| zaNjRgKTPtba7HkzW | Demo + Wishes :rainbow: | Each feature/fix has prepaid time available, 100e/hour. Spent time shows what amount is used. |
| GuphFXYv3AtHH4MEx | RAD/Mobile/Desktop App/Accessible/Voice/HTML4 prototypes that use WeKan API | Azure [issues](https://github.com/wekan/wekan/issues?q=is%3Aissue+is%3Aopen+azure+label%3ATargets%3AAzure) |
| mPhupDTneiikjPK3g | Minimize Optimize | Duplicate cards: at every swimlane, move cards (bottom card of list first) to leftmost list, and remove other shared lists columns from top list |
| qRYaNFLaFEWQiMYGP | In Progress | Unit and UI Tests (PF-2209) |
