# Admin Panel / Settings / Features

What this WeKan offers. Address: `/admin/settings/features`. Site administrators
only. Until 2026-11-19 these groups were part of Settings / Visibility (now
[Appearance](Appearance.md)).

The pane has four groups, top to bottom: **Features**, **Rules** and **Optional
APIs**, plus the two optional sign-in and publishing features below the Features
Save. Who among your users sees a feature is decided one level down, by
[Feature profiles](Feature-Profiles.md).

## Features

Which optional features this WeKan offers. An unticked feature is hidden from
everyone's interface; its data is kept and no permission changes.

Besides the board view groups, four
[helpers that need no AI](../../General/Assistants/Assistants.md) are features
here: **Rule suggestions**, **Summary**, **Since your last visit** and
**Search phrases**. The card helpers - Due date from title, Similar cards, At
risk, Suggested members, Forecast, Checklist from description and Action
items - are card fields, below.

### Card fields

Above the Features **Save** there is one tick per field type of the board right
sidebar's **Board Settings / Card** (Received, Start, Due, End, Members, Assignee,
Labels, Description, Checklists, Pomodoro, each Scrum field, and the rest), with the
same icons and names. All are ticked by default.

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

Stored on the settings document as `cardFieldStates` (`{ field: true|false }`;
a missing field is shown), saved by the site-admin-only Features save. The catalog
and the decisions are `models/lib/cardFieldVisibility.js`.

### Approval and pilot users

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

### SQRL and ActivityPub

Below that Save, two optional features that are saved as soon as they are
switched, both off by default:

- **Sign in with SQRL** - the sign-in page offers SQRL, and members add their
  SQRL identity in Member Settings first. SQRL needs WeKan at an `https://`
  address.
- **Public boards publish their card activity on the fediverse (ActivityPub)** -
  each public board can be followed from Mastodon and other fediverse servers as
  `@board-<id>` at this WeKan's address, and new card activity reaches its
  followers. Read-only: nothing a fediverse server sends changes a board, and
  private boards are never published.

## Rules

**Boards may show their Rules to members, read-only.** Off: only board admins see
a board's Rules. On: a board admin can tick *Show these Rules to board members* on
the board's Rules page, and members then read the rules and their details without
being able to change them.

## Optional APIs

Below Rules: one tick each for the **Trello**, **Jira**, **GitHub** and
**Gitea** compatible APIs, all off by default, each with what it does and the
address a client uses. They let apps written for those trackers use WeKan as
their backend, with no rights of their own: every call is WeKan's REST API as
the person signed in. See [Optional APIs](../../../API/Optional-APIs.md).

## Related

- [Feature profiles](Feature-Profiles.md) - hide some of these features from
  chosen users, teams and organizations.
- [Appearance](Appearance.md) - how this WeKan looks.
