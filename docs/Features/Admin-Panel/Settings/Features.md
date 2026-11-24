# Admin Panel / Settings / Features

## What it is

What this WeKan offers. Address: `/admin/settings/features`. Site administrators
only. A site administrator turns optional features - board views, helpers,
Kanban and Scrum tools, card fields, SQRL, ActivityPub, read-only Rules and the
Optional APIs - on or off for the whole instance. An unticked feature is hidden,
and its server paths refuse it too
([Settings enforced on the server](../Settings-Enforced-On-Server.md)); it is
never deleted, and no permission changes. Until 2026-11-19 these groups were
part of Settings / Visibility (now [Appearance](Appearance.md)).

The pane has four groups, top to bottom: **Features**, **Rules** and **Optional
APIs**, plus the two optional sign-in and publishing features below the Features
Save. Who among your users sees a feature is decided one level down, by
[Feature profiles](Feature-Profiles.md).

## Read more

- [Feature toggle](https://en.wikipedia.org/wiki/Feature_toggle) on Wikipedia -
  the general idea of switching features on and off without changing code.
- [SQRL](https://en.wikipedia.org/wiki/SQRL) on Wikipedia, and
  [SQRL](https://www.grc.com/sqrl/sqrl.htm) by GRC; WeKan's
  [SQRL sign-in](../../Login-Page/SQRL.md).
- [ActivityPub](https://en.wikipedia.org/wiki/ActivityPub) and the
  [Fediverse](https://en.wikipedia.org/wiki/Fediverse) on Wikipedia, and the
  [W3C ActivityPub recommendation](https://www.w3.org/TR/activitypub/).
- [Kanban (development)](https://en.wikipedia.org/wiki/Kanban_(development)) and
  [Scrum](https://en.wikipedia.org/wiki/Scrum_(software_development)) on
  Wikipedia - where the flow and Scrum helpers come from.
- WeKan: [helpers that need no AI](../../Assistants/README.md),
  [flow policies](../../Lists/Flow-Policies.md),
  [Scrum meetings](../../Board-Sidebar/Board-Settings/Scrum-Meetings.md),
  [flow fields](../../Cards/Flow-Fields.md),
  [Workload](../../Workload/README.md), [Billing](../../Billing/README.md)
  and [Optional APIs](../../../API/Optional-APIs.md).

## How to use it

**Choose the features**

1. Open **Admin Panel / Settings / Features**.
2. Under **Features**, untick each feature this WeKan should not offer. A
   feature that a WeKan update added while approval is required shows
   *(new, waiting for approval)*.
3. Untick any **Card fields** that no board should show.
4. Set the approval policy and the pilot users (below) if you need them.
5. Press **Save**. The status says *Saved.*, and names any pilot username that
   matches nobody.

**Features.** Which optional features this WeKan offers. An unticked feature is
hidden from everyone's interface and refused by the server; its data is kept
and no permission changes.
The catalog, in page order: Table view, Calendar views, Time views, Overview
views, Gantt views, Scrum views, Flow charts, Map view, Email view, Chat view,
Website view, Version Control view, Column sets, Rule suggestions, Summary,
Since your last visit, Search phrases, List policies, Commitment point, WIP
limit per person, Split lists, Daily standup timer, Retrospective board,
Workload and capacity, Budget and billing. Swimlanes and lists are the core of
a board and are never in it.

Besides the board view groups, four
[helpers that need no AI](../../Assistants/README.md) are features
here: **Rule suggestions**, **Summary**, **Since your last visit** and
**Search phrases**. The card helpers - Due date from title, Similar cards, At
risk, Suggested members, Forecast, Checklist from description and Action
items - are card fields, below.

The Kanban and Scrum helpers are features here too, each also turned on or off
per board: **List policies**, **Commitment point**, **WIP limit per person**
and **Split lists** ([flow policies](../../Lists/Flow-Policies.md), Board
Settings / List), and **Daily standup timer** and **Retrospective board**
([Scrum meetings](../../Board-Sidebar/Board-Settings/Scrum-Meetings.md), Board
Settings / Scrum). The four flow fields - Blocked, Class of service, MoSCoW
priority and WSJF score ([flow fields](../../Cards/Flow-Fields.md)) - are card
fields, below. **Workload and capacity** and **Budget and billing** are the
pages of the same names in the user menu.

**Card fields.** Above the Features **Save** there is one tick per field type of
the board right sidebar's **Board Settings / Card** (Received, Start, Due, End,
Members, Assignee, Labels, Description, Checklists, Pomodoro, each Scrum field,
and the rest), with the same icons and names. All are ticked by default.

Unticking a field, for example **Pomodoro**, and saving hides it on every board of
this WeKan:

- its row is not offered in any board's Board Settings / Card;
- it is not shown on any opened card or minicard, whatever the board itself chose.

It is **visibility only**. No card data is deleted or changed, and no board setting
is written: each board keeps its own choice, and ticking the field again shows every
board exactly as it was set. A board admin's whole-column tick in Board Settings /
Card leaves the hidden fields' values alone for the same reason.

There is **no ordering** here: the order of the fields on a card and a minicard is
each board's own, set by drag and drop in Board Settings / Card.

**Approval and pilot users.**

- **Keep features added by WeKan updates disabled until an administrator enables
  them** - when on, a feature that a later WeKan update adds stays off until you
  tick it here; the features on the page when you turned it on are not affected.
- **Administrators see disabled features, to try them first** - site
  administrators keep seeing the features unticked here.
- **Pilot users who also see disabled features** - usernames, separated by
  commas, of people who also keep seeing them. A name that matches nobody is
  reported after saving.

The Features ticks, the approval policy, the pilot users and the card fields are
saved together by the group's **Save**.

**SQRL and ActivityPub.** Below that Save, two optional features that are saved
as soon as they are switched, both off by default:

- **Sign in with SQRL** - the sign-in page offers SQRL, and members add their
  SQRL identity in Member Settings first. SQRL needs WeKan at an `https://`
  address.
- **Public boards publish their card activity on the fediverse (ActivityPub)** -
  each public board can be followed from Mastodon and other fediverse servers as
  `@board-<id>` at this WeKan's address, and new card activity reaches its
  followers. Read-only: nothing a fediverse server sends changes a board, and
  private boards are never published.
- **Turn off all webhooks** - hides every webhook screen, and the server sends
  no webhook and refuses to add or change one; saved webhooks are kept. Off by
  default. See [Turn off all webhooks](Turn-Off-All-Webhooks.md).

**Rules.** **Boards may show their Rules to members, read-only.** Saved when
ticked. Off: only board admins see a board's Rules. On: a board admin can tick
*Show these Rules to board members* on the board's Rules page, and members then
read the rules and their details without being able to change them.

**Optional APIs.** Below Rules: one tick each for the **Trello**, **Jira**,
**GitHub** and **Gitea** compatible APIs, all off by default, each with what it
does and the address a client uses, and their own **Save**. They let apps
written for those trackers use WeKan as their backend, with no rights of their
own: every call is WeKan's REST API as the person signed in. See
[Optional APIs](../../../API/Optional-APIs.md).

## How the numbers are calculated

- **Is a feature on?** (`isFeatureEnabled()` in
  [models/lib/instanceFeatures.js](../../../../models/lib/instanceFeatures.js)):
  an explicit decision saved here wins; with none, a feature is on - unless the
  approval policy is on and the feature was not in the catalog when the policy
  was turned on or the page was last saved (`featureKnownKeys`); then it waits.
- **Does this user see it?** (`isFeatureAvailable()`): never when the user's
  feature profile hides it; otherwise when it is on, or when the user is a pilot
  user, or a site administrator while **Administrators see disabled features**
  is ticked.
- **Pilot users**: the box is split on spaces, commas and semicolons, repeats
  are dropped, and at most **500** names are kept.
- **Card fields**: one tick per field of Board Settings / Card - 68 at present,
  from [models/lib/cardSettingsRows.js](../../../../models/lib/cardSettingsRows.js);
  a field missing from `cardFieldStates` is shown.
- **Optional APIs**: four, at `/api/compat/trello/1`,
  `/api/compat/jira/rest/api/2`, `/api/compat/github` and
  `/api/compat/gitea/api/v1` ([models/lib/optionalApis.js](../../../../models/lib/optionalApis.js)).

## How it works in WeKan

- **Pane**: template `tableVisibilityModeSettings` with `part="features"` in
  [settingBody.jade](../../../../client/components/settings/settingBody.jade),
  handlers in [settingBody.js](../../../../client/components/settings/settingBody.js).
- **Catalog and decisions**: [models/lib/instanceFeatures.js](../../../../models/lib/instanceFeatures.js) -
  the `FEATURES` list (each a group of board views or a helper), and
  `isFeatureEnabled`, `isFeatureAvailable` and `isBoardViewAvailable`, which
  every place that hides a disabled feature asks, on the client and the server.
  Stored on the settings document as `featureStates`, `featureApprovalRequired`,
  `featureKnownKeys` and `featurePreviewAdmins`; a pilot user has
  `featurePreview: true`, published only to that user.
- **Card fields**: [models/lib/cardFieldVisibility.js](../../../../models/lib/cardFieldVisibility.js);
  stored as `cardFieldStates` (`{ field: true|false }`; a missing field is
  shown).
- **Methods** in [server/methods/instanceFeatures.js](../../../../server/methods/instanceFeatures.js),
  site admin only: `saveInstanceFeatures` (features, policies, pilot users and
  card fields), `saveRulesReadOnlyForMembers` and `saveOptionalApis`;
  `saveSqrlEnabled` in [server/sqrl.js](../../../../server/sqrl.js) and
  `saveActivityPubEnabled` in [server/activityPub.js](../../../../server/activityPub.js).
- **Tests**: [tests/instanceFeatures.test.cjs](../../../../tests/instanceFeatures.test.cjs),
  [tests/cardFieldVisibility.test.cjs](../../../../tests/cardFieldVisibility.test.cjs),
  [tests/optionalApis.test.cjs](../../../../tests/optionalApis.test.cjs),
  [tests/rulesReadOnly.test.cjs](../../../../tests/rulesReadOnly.test.cjs),
  [tests/sqrl.test.cjs](../../../../tests/sqrl.test.cjs) and
  [tests/activityPub.test.cjs](../../../../tests/activityPub.test.cjs).

## Related

- [Feature profiles](Feature-Profiles.md) - hide some of these features from
  chosen users, teams and organizations.
- [Appearance](Appearance.md) - how this WeKan looks.

## Commits

 - [Website view, as a feature that can be turned off](https://github.com/wekan/wekan/commit/2e8549032ea4b44e90a96eb53a4e1941f53a5261)
 - [Budget and billing](https://github.com/wekan/wekan/commit/604b3dbe84c17d11af722826741866c8953e91b3)
 - [Workload and capacity](https://github.com/wekan/wekan/commit/165dfa3c1676f6069d456ead021fa0db69f92e22)
 - [Split lists](https://github.com/wekan/wekan/commit/fd5c207006ac1c3ac605b4689860b47205a18d80)
 - [Daily standup timer and retrospective board](https://github.com/wekan/wekan/commit/2f7a4e210f0e90005bba662e7ac418b403ffa2ba)
 - [List policies, the commitment point and a WIP limit per person](https://github.com/wekan/wekan/commit/9ac7b916c08bb139f1090d4e87b8319aed08d324)
 - [Features gets a pane of its own in Settings](https://github.com/wekan/wekan/commit/e1a053d059191640a63a22ab553c0b0c6b833d8d)
 - [Checklist from description, action items and search phrases](https://github.com/wekan/wekan/commit/3cb089b8cab48c217da27195f5a489af13bcaff2)
 - [Summary, Since your last visit, At risk, Suggested members and Forecast](https://github.com/wekan/wekan/commit/083c863fb7f96055fa52f0ed074ddab98494c81b)
 - [Rule suggestions](https://github.com/wekan/wekan/commit/2211b2411931b84ef0ec71c197e5630f71bff3c6)
 - [Column sets](https://github.com/wekan/wekan/commit/03d0144538a5aed50f9641f01fac2457ec3ccdea)
 - [Rules can be shown to board members, read-only](https://github.com/wekan/wekan/commit/f4a3690256c71909860a830cb8e4557f4a2c4348)
 - [Optional APIs: Trello, Jira, GitHub and Gitea compatible](https://github.com/wekan/wekan/commit/86ec72fade23aaa2210f47eb2ef78350d8ddfdda)
 - [Sign in with SQRL (#2460)](https://github.com/wekan/wekan/commit/c940b3e30131ed6675c5767468bdab56ab7852eb)
 - [ActivityPub: a public board can be followed from the fediverse (#4198)](https://github.com/wekan/wekan/commit/bf633b9c723497594a0a568b94b0ec1e02143b4a)
 - [Board views Email and Chat](https://github.com/wekan/wekan/commit/ddb33d21d05fb6ce47cd9a899407319a82fb6753)
 - [Choose which card fields every board shows](https://github.com/wekan/wekan/commit/03975e7d3108433cd222645e8bdc181978d7dd70)
 - [Administrators choose which optional features WeKan offers (#6736)](https://github.com/wekan/wekan/commit/18d57b2b8f789b11409afbd485cff139adeb3095)
