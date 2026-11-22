# Settings enforced on the server

## What it is

Which Admin Panel and board settings that turn something **off** are refused
by the server, and which only change what the interface shows.

A setting that only hides a button is not a setting: anybody who calls the
method, the publication or the REST route behind the button still gets what
the button did. So a setting that turns something off, or restricts who may do
it, is decided on the server too - in the Meteor method, the publication, the
REST route, the login handler or the allow/deny rule that the hidden button
would have used. The interface hiding it is the visible half; the server
refusing it is the half a crafted call meets.

A few settings are display preferences on purpose. They are listed below too,
with the reason, so that "display only" is a decision and not a gap.

## Read more

- [Defense in depth](https://en.wikipedia.org/wiki/Defense_in_depth_(computing))
  and [Security through obscurity](https://en.wikipedia.org/wiki/Security_through_obscurity)
  on Wikipedia - why a hidden button is not a refusal.
- [OWASP: Insecure direct object references](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/05-Authorization_Testing/04-Testing_for_Insecure_Direct_Object_References)
  and [CWE-284: Improper Access Control](https://cwe.mitre.org/data/definitions/284.html).
- WeKan: [Who sees and can do what](Who-Sees-What.md),
  [Admin Panel / Problems](Problems/README.md),
  [Disable password login](../Login-Page/Disable-Password-Login.md).

## How to use it

Nothing to turn on: every setting below is enforced as soon as it is saved.

1. Change the setting in the Admin Panel (or the board's settings) as usual.
2. The interface hides what the setting turned off.
3. A call that still asks for it - a page left open from before the change,
   an API client, a crafted request - is refused by the server.
4. Where no screen can produce that call any more, the refusal is an attempt
   and shows in **Admin Panel / Problems** under the name in the table. Each
   row there is a summary, not one line per refusal: how many, since when, and
   who. None of these refusals disables the account, because a page left open
   from before the change sends the same call.

**Login settings**

| Setting | What the server refuses | Problems |
| --- | --- | --- |
| People / Login: `PASSWORD_LOGIN_ENABLED` = false | Every sign-in through the password service: the DDP `login` with a password, and the sign-ins that `resetPassword`, `verifyEmail` and `createUser` make, whether the password was right or not; `POST /users/login` answers 403 `password-login-disabled` before it looks up any user. LDAP keeps working: with LDAP on, a username sent to `POST /users/login` goes to the directory only, and the LDAP handler's own `LDAP_LOGIN_FALLBACK` is an LDAP decision of the operator. Meteor's `forgotPassword` is refused too. | Password login disabled |
| People / Login: Forgot password unticked | Meteor's `forgotPassword` method, which e-mails a reset link. A reset link an administrator sent still works. | Forgot password disabled |
| People / Login: Self delete user account unticked | `removeUser` and `anonymizeUser` on your own account, and `DELETE /api/users/:userId` when an administrator names their own id. Administrators too: the profile draws the buttons for nobody while it is off. Deleting another user from Admin Panel / People is unchanged. | Disabled setting |
| (always) The last site administrator | Deleting or anonymizing your own account when you are the only site administrator - it used to skip the check that deleting somebody else had. Not recorded: the buttons are there, so it is ordinary use. | - |
| People / Login: Username Change unticked | A direct client write of your own `username` (`Users.update`), the way round the `setUsername` method, which already refused. E-mail addresses are never written that way. | Disabled setting |

**Admin Panel / Settings / Security**

| Setting | What the server refuses | Problems |
| --- | --- | --- |
| Disable all import | Every import of board data: the import methods and REST routes already asked; since 2026-11-22 also the Trello API import (`trelloStartImport`, `trelloResumeImport`), the iCalendar import (`importIcsToBoard` and `POST /api/boards/:boardId/swimlanes/:swimlaneId/lists/:listId/ics`, 403 `import-disabled`) and a Scrum transfer imported into a board (`scrum.importIntoBoard`). Not covered, on purpose: Rules / Import of a Wrike workflow (a board admin's rules) and dependency lines (between cards that exist); repairing an interrupted import. Not recorded: some import screens stay visible, so a refusal is ordinary use. | - |
| Disable all export | Every export method and route (already; pinned by `tests/crossBoardExportBleed.test.cjs`). | CrossBoardExportBleed |

**Admin Panel / Settings / Features**

An unticked feature is hidden, and the server paths of that feature refuse it:
a method answers `feature-disabled`, a publication sends nothing. It is still
never a permission - a feature that is on grants nobody a board - and its data
is kept. A site administrator previewing features, and a pilot user, may use
it, as they see it.

| Feature | What the server refuses while it is off | Problems |
| --- | --- | --- |
| Table view | `tableViewAddCard`; choosing the view (`setBoardView`). | Disabled setting |
| Chat view | `chatViewChannels`, `chatViewBoardChannels`, the `chatViewCardComments` publication; choosing the view. | Disabled setting |
| Email view | `emailViewCount`, `sendBoardEmail`, the `emailViewPage` publication; choosing the view. | Disabled setting |
| Version Control view | `vcsCreateIssue`, `vcsSetIssueState`; choosing the view. | Disabled setting |
| Scrum views | Every Scrum method of the Sprints, Product backlog and report views (sprints, releases, events, a card's sprint, the sprint histories, Scrum import into a board); choosing the views. Not refused: `scrum.getBoardData` and `scrum.configure`, which the card details' Scrum fields use too, and the import and History recovery methods, which repair board data. Board Settings / Scrum settings is hidden too, since it opens in the Sprints view. | Disabled setting |
| Summary, Since your last visit, Rule suggestions | Their methods answer nothing (they did already). `boards.markVisited` keeps recording visits, so the list is right when the feature is on again. | - |
| Workload and capacity, Budget and billing | Every `workload*` and `billing*` method (they did already). | - |
| List policies, Commitment point, WIP limit per person, Split lists | A client write turning one on: the board's `allowsListPolicies`, `commitmentListId`, `personWipLimit`, `allowsSplitLists`, a list's `policy` or `split` (Boards / Lists deny rules); a card marked *Done here* (`setCardFlow`). Turning one off is always allowed. | Disabled setting |
| Every other board view (calendar, time, overview, Gantt, flow charts, map, website, column sets) | Choosing the view (`setBoardView`). Nothing else: they read the cards the board already publishes and write ordinary card fields. | Disabled setting |
| Search phrases, Daily standup timer, Retrospective board | Nothing - display only. A phrase becomes the search operators anybody may type; the timer runs in the browser and writes nothing; the retrospective board is an ordinary board anybody may make by hand. | - |

**Admin Panel / Settings / Features / Turn off all webhooks**

[Turn off all webhooks](Settings/Turn-Off-All-Webhooks.md) is a switch of its
own, not a feature tick: no site administrator previews it and no pilot user
is exempt, because what it stops is the server's own sending.

| What | What the server does while it is on | Problems |
| --- | --- | --- |
| Adding or changing a webhook | Refused: a client `Integrations` insert or update (the board menu's Outgoing Webhooks, Global Webhooks, Board Settings / Bots), `POST /api/boards/:boardId/integrations`, `PUT /api/boards/:boardId/integrations/:intId` and both `.../activities` routes (403 `webhooks-disabled`), a webhook's own delivery settings (`setNotificationDelivery` with the `integration` scope) and the login and registration webhook (`saveAccountWebhook`). Removing a webhook is allowed. | Webhooks turned off |
| Sending | Nothing is sent and nothing is logged: board and global webhooks, two-way webhooks, Mattermost direct messages, the grouped and scheduled queue, durable Sync webhooks, the login and registration webhook and bot dispatches. | - |

**Already refused on the server before 2026-11-22**

Audited and left as they were, because the server already refused them:

| Setting | Where the server refuses it |
| --- | --- |
| People / Login: Self-Registration unticked | `POST /users/register` (SignupBleed) and `onCreateUser` for every DDP sign-up (an invitation code is required); passwordless never creates an account then. |
| People / Login: e-mail change not allowed | `setEmail` and `setUsernameAndEmail`; `emails` is never writable from the client. |
| People / Login: passwordless sign-in off | `requestLoginTokenForUser` and the `passwordless` login attempt. |
| People / Login: an OAuth provider, OIDC, CAS, SAML or LDAP off | Its service configuration is removed and its login attempt refused. |
| People / Login: two-factor authentication required | No API token, and the browser is sent to set it up (`server/requireTwoFactor.js`). |
| Settings / Security: Disable all export | Every export method and route. |
| Settings / Activities and notifications | Activities, notifications and watching are not recorded or sent. |
| Settings / Delete: permanent delete | The delete methods of boards, lists and cards. |
| Settings / Features: Optional APIs | An API that is not ticked answers 404 (`server/compatApi/core.js`). |
| Settings / Features: SQRL, ActivityPub | Their routes and login handler answer only while on. |
| Attachments: uploads blocked | The upload pipeline (`models/attachments.server.js`). |
| Board Settings / Card: Attachments off | The attachment REST API (`server/routes/attachmentApi.js`). |
| Only admins can create boards, Allow private boards only, boards everybody may edit | The board insert and update rules and the board methods (CreateBleed, VisibilityBleed). |
| People / Organizations and Teams: members only from the same organization or team | Adding a member (`server/lib/orgTeamRestriction.js`). |

**Display only, on purpose**

These change what the interface shows and nothing else. Each one is a
decision, with its reason:

| Setting | Why the server does not refuse anything |
| --- | --- |
| Settings / Features / Card fields (`models/lib/cardFieldVisibility.js`) | A hidden card field is not drawn on any board, and *nothing is written*: ticking it again shows every board exactly as before. Its values are ordinary card data that the REST API, rules, imports, the compatible APIs, List Sync and recurrence write, and refusing those writes would lose data while the field is hidden. The card helpers that the server computes (Similar cards, Forecast, Suggested members, ...) do answer nothing while their field is hidden (`boardForCardHelper` in `server/lib/assistGate.js`). |
| Board Settings / Card (what one board shows on cards and minicards) | The same: what the board shows, not what may be written. Drawings, the whiteboard and cover images write card attachments while the Attachments row is off, so only the attachment REST API refuses (as before). |
| Board Settings / Board View (the views one board offers) | Which views the board lists; whether a view exists at all is the instance feature above, which the server refuses. |
| Settings / Features / Rules: read-only for members | It never grants a write: the rule methods keep their own board-admin checks. The rules are published to everybody who sees the board anyway, because the board and card rule buttons need them. |
| Settings / Appearance: hide the logo, the card counter, the board member list, the date format, links as plain text, code as text | Presentation. The member list is published to the board's members regardless, as their cards name them. |
| Search phrases, Daily standup timer, Retrospective board | See the Features table above. |

## How the numbers are calculated

Problems counts every refused call once in the row of its kind; the actor
tally names the account (when the call had one) and the address it came from.

## How it works in WeKan

- [models/lib/passwordLoginPolicy.js](../../../models/lib/passwordLoginPolicy.js)
  decides the login settings: `passwordLoginRefusal` for a DDP sign-in,
  `restPasswordLoginRoute` for `POST /users/login`, `forgotPasswordRefusal`
  for `forgotPassword`. [server/authentication.js](../../../server/authentication.js)
  asks it in a wrapper around Meteor's `login` method (`loginRequestRefusal`,
  before any account is looked up, so a right and a wrong password get the
  same answer), in an `Accounts.validateLoginAttempt` hook for the other
  password sign-ins, and in a wrapper around Meteor's `forgotPassword` method; [server/apiAuthRoutes.js](../../../server/apiAuthRoutes.js)
  asks it before the user lookup.
- [models/lib/selfAccountRemoval.js](../../../models/lib/selfAccountRemoval.js)
  decides deleting or anonymizing your own account (`selfRemovalRefusal`),
  asked by `removeUser`, by `anonymizeUser` through
  [models/lib/userAnonymization.js](../../../models/lib/userAnonymization.js)
  and by `DELETE /api/users/:userId` in
  [server/models/users.js](../../../server/models/users.js). The username
  write is a `Users.deny` rule in
  [server/permissions/users.js](../../../server/permissions/users.js).
- [models/lib/featureServerGates.js](../../../models/lib/featureServerGates.js)
  lists every feature's server paths (`SERVER_PATHS`), the ones refused as
  writes (`WRITE_GATED`) and the display-only ones with why (`DISPLAY_ONLY`).
  [server/lib/assistGate.js](../../../server/lib/assistGate.js)
  `requireFeature` / `featureAllowed` ask
  [models/lib/instanceFeatures.js](../../../models/lib/instanceFeatures.js)
  for the caller (feature profiles and previews included); the Scrum methods
  are wrapped in one place in [server/scrum.js](../../../server/scrum.js), the
  flow policies are deny rules in
  [server/permissions/boards.js](../../../server/permissions/boards.js) and
  [server/permissions/lists.js](../../../server/permissions/lists.js).
- The Problems names are keys of
  [models/lib/securityCategories.js](../../../models/lib/securityCategories.js),
  recorded with `securityLog.record({ key, action: 'blocked', ... })`.
- Tests: [tests/passwordLoginPolicy.test.cjs](../../../tests/passwordLoginPolicy.test.cjs)
  (the decisions, and every server path that checks a local password asks
  them) and [server/lib/tests/passwordLoginDisabled.tests.js](../../../server/lib/tests/passwordLoginDisabled.tests.js)
  (a DDP and a REST sign-in refused on a running server);
  [tests/selfAccountRemoval.test.cjs](../../../tests/selfAccountRemoval.test.cjs)
  (the rule, and every server file that removes or anonymizes users asks it)
  and [server/lib/tests/selfAccountRemoval.tests.js](../../../server/lib/tests/selfAccountRemoval.tests.js);
  [tests/importDisabledEverywhere.test.cjs](../../../tests/importDisabledEverywhere.test.cjs)
  (every import method and route asks `assertImportEnabled`, or says why it is
  no import of board data);
  [tests/featureServerGates.test.cjs](../../../tests/featureServerGates.test.cjs)
  (every catalog feature is decided, and every method and publication of a
  feature file asks the gate, so a new one cannot skip it) and
  [server/lib/tests/featureServerGates.tests.js](../../../server/lib/tests/featureServerGates.tests.js);
  and in a browser,
  [tests/playwright/specs/settings-enforced-on-server.e2e.js](../../../tests/playwright/specs/settings-enforced-on-server.e2e.js)
  (an unticked feature, own account deletion and password login, each called
  from the page the way the hidden button would).

## Commits

- [Password login disabled and forgot password disabled are refused on the server](https://github.com/wekan/wekan/commit/24be123ee56ac546037be77ee01f7766d4688fe3)
- [Own account deletion and username change follow their settings on the server, and the last admin stays](https://github.com/wekan/wekan/commit/57a24eb8ba321198ecee62df53fddc9b53d0b1d9)
- [Admin Panel / Settings / Features: an unticked feature is refused on the server](https://github.com/wekan/wekan/commit/68dcfd14fef672cc025cae3bc84385a24dcceacb)
- [Disable all import: the Trello API, iCalendar and Scrum transfer imports are refused too](https://github.com/wekan/wekan/commit/c5b3b597e8f07e9c58ae9664563de9dd37ed6a0f)
