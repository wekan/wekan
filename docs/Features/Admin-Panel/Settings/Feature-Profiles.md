# Admin Panel / Settings / Feature profiles

## What it is

A **feature profile** gives chosen users a smaller WeKan: it hides some of the
optional features from the users, teams and organizations it is assigned to.
Everybody else keeps seeing everything.
[#6837](https://github.com/wekan/wekan/issues/6837).

Only a **site administrator** sees and edits feature profiles.

## Read more

- [Feature toggle](https://en.wikipedia.org/wiki/Feature_toggle) on Wikipedia -
  a profile is a feature toggle per group of users.
- [Role-based access control](https://en.wikipedia.org/wiki/Role-based_access_control)
  on Wikipedia - what a profile is **not**: it hides, it never grants or takes
  away a right.
- [Features](Features.md), [Teams](../People/Teams.md) and
  [Organizations](../People/Organizations.md) in WeKan.

## How to use it

### Where

Admin Panel / Settings / **Feature profiles**, right below
[Features](Features.md) in the Settings menu. Address:
`/admin/settings/feature-profiles`. The pane has its own **Save**; it does not
save the Features ticks, and their Save does not save the profiles. The People,
Teams and Organizations tables of Admin Panel / People show which profile
applies to each person and which profiles a team or organization is named in,
so a profile can be found from either side.

### What a profile can hide

Exactly the features the [Features](Features.md) pane can switch off for the whole
instance - the same list, in the same order:

- the board view groups: Table, Calendar, Time, Overview, Gantt, Scrum, Flow charts,
  Map, Email, Chat, Website, Version control, Column sets;
- the helpers that need no AI: Rule suggestions, Summary, Since your last visit and
  Search phrases;
- the Kanban and Scrum helpers: List policies, Commitment point, WIP limit per
  person, Split lists, Daily standup timer and Retrospective board;
- Workload and capacity, and Budget and billing.

Swimlanes and lists are the core of a board and can never be hidden, by a profile or
by the instance.

### Create a profile

1. Open Admin Panel / Settings / Feature profiles.
2. Press **Add profile**. An empty profile appears.
3. **Profile name** - what the profile is called, for example `Newcomers`. Names are
   unique (case does not matter) and at most 100 characters. The user sees this name
   (see [What the user sees](#what-the-user-sees)), so choose one that means
   something to them.
4. **Hide these features** - tick every feature this profile hides. An unticked
   feature stays visible.
5. Say who has it - any of the three, or several:
   - **Users**: usernames, separated by commas;
   - **Teams, one per line**: team names, as in Admin Panel / People / Teams;
   - **Organizations, one per line**: organization names, as in Admin Panel /
     People / Organizations.
6. Press the section's **Save**.

After saving, the status next to Save says **Saved**, or **Saved. Not found:**
followed by every username, team name or organization name that matched nothing.
Those are not stored, so check their spelling and save again. Everything that did
match is saved.

Up to 50 profiles can exist. Their order on the page is the order they are tried in
(below).

### Change or remove a profile

Edit any field and press **Save**. **Remove profile** takes a profile off the page;
it is gone when you press Save, and its users, teams and organizations then fall
back to whatever else applies to them - usually no profile, so they see everything
again.

Removing a user from the **Users** box of every profile, and saving, takes their
direct profile away.

### What the user sees

- The hidden features are gone from the interface - for example a hidden board view
  is not in the Board View menu - exactly as if the instance had switched them off.
- The **member menu** (top right, the user's avatar) opens with a note: *Your
  feature profile Newcomers hides 3 features. Ask an administrator if you need one
  of them.* So a user always knows a feature is hidden on purpose, and who to ask.
- A profile that hides nothing shows no note.

The user cannot change or remove their own profile: only a site administrator saves
profiles.

### When somebody says a feature is missing

1. Ask them to open their member menu. If it says *Your feature profile ... hides*,
   the profile is the reason.
2. In Admin Panel / Settings / Feature profiles, find that profile, untick the feature
   (or move the user to another profile, or out of it) and **Save**.
3. If the member menu shows no note, the feature is switched off for the whole
   instance ([Features](Features.md)), or the board itself does not show it
   (Board Settings).

## How the numbers are calculated

- **At most 50 profiles** (`MAX_PROFILES` in
  [models/lib/featureProfiles.js](../../../../models/lib/featureProfiles.js));
  saving more is refused with `too-many-profiles`.
- **A name** is trimmed and cut to **100** characters; it is required, and two
  names that differ only in case are refused (`profile-name-taken`).
- **Users, Teams and Organizations** boxes are split on new lines, commas and
  semicolons, repeats dropped, and at most **500** names each are kept. Team
  and organization names are matched exactly against their display names.
- **The count in the note** (*hides 3 features*) is the number of features the
  user's profile hides (`featureProfileNotice()`), whether or not the instance
  has also switched some of them off.

### Which profile a user has

One profile at most applies to a user, decided in this order:

1. the profile assigned to the user **directly** (their username in **Users**);
2. else the **first** profile in the page's order that names one of the user's
   **teams**;
3. else the first profile that names one of the user's **organizations**;
4. else **none** - the user sees everything this WeKan offers.

A username listed in two profiles belongs to the later one: a user has one direct
profile.

## How it works in WeKan

- Stored on the settings document as `featureProfiles`:
  `[{ _id, name, hidden: [featureKey], teamIds, orgIds }]`, published to every
  client (it holds no secret: names, feature keys and team/organization ids).
- A direct assignment is `featureProfileId` on the user, published only to that
  user. Clients may write only `username` and `profile.*` of their own user
  document, so a user cannot set or clear it.
- Saved by the site-admin-only methods `getFeatureProfiles` and
  `saveFeatureProfiles` ([server/methods/instanceFeatures.js](../../../../server/methods/instanceFeatures.js)), which resolve the
  names to ids and report the ones that match nothing.
- The decision is [models/lib/featureProfiles.js](../../../../models/lib/featureProfiles.js), used by `isFeatureAvailable` in
  [models/lib/instanceFeatures.js](../../../../models/lib/instanceFeatures.js) - the same function every place that hides a
  disabled feature already asks, on the client and on the server.
- The pane is template `tableVisibilityModeSettings` with `part="profiles"` in
  [settingBody.jade](../../../../client/components/settings/settingBody.jade);
  the member-menu note comes from `featureProfileNotice` in
  [client/lib/instanceFeatures.js](../../../../client/lib/instanceFeatures.js).
- Tests: [tests/featureProfiles.test.cjs](../../../../tests/featureProfiles.test.cjs),
  [tests/playwright/specs/feature-profiles.e2e.js](../../../../tests/playwright/specs/feature-profiles.e2e.js).

### What a profile does not do

Profiles are **opt-in**. A Simple/Advanced mode that hid features by default was
tried and removed, because a feature missing by default is a support nightmare.
So:

- **Nobody without a profile is affected.** Adding the first profile changes
  nothing for anyone until it is assigned to somebody.
- **It only hides.** No card, board or setting is deleted or changed. Removing the
  profile shows everything exactly as it was.
- **It is not access control.** A profile never grants or takes away a permission:
  a hidden feature's data is still the user's, and other rights - board roles, list
  role exceptions, Admin Panel access - are unchanged. Use board roles for who may
  do what.
- **It does not override the instance.** A feature the instance switched off stays
  off for everyone; a profile can only hide more.

### Pilot users and site administrators

Pilot users (the **Pilot users who also see disabled features** box in
[Features](Features.md), and site administrators when **Administrators see
disabled features, to try them first** is ticked) see the features the instance
switched off. A feature profile still applies to them, because it was assigned to
them on purpose. To test a profile, assign it to yourself and open your member menu.

## Related

- [Admin Panel / Settings / Features](Features.md) - the features a profile
  chooses from.
- [Admin Panel / People / Teams](../People/Teams.md) and
  [Organizations](../People/Organizations.md) - the groups a profile can be assigned
  to.

## Commits

 - [Feature profiles gets a pane of its own, below Features](https://github.com/wekan/wekan/commit/e1a053d059191640a63a22ab553c0b0c6b833d8d)
 - [Feature profiles: an administrator hides features from chosen users, teams and organizations (#6837)](https://github.com/wekan/wekan/commit/fc21b0b177dc8f8902efa39d0f89c8b041c7cf2d)
