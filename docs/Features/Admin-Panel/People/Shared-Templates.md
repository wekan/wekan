# Admin Panel / People / Shared templates

## What it is

Users' shareable template boards, browsable **by scope**: Organization, Team or
e-mail Domain. The checkboxes choose which of those scopes are offered: which
group kinds a template board may be shared with in All Boards / Templates, and
which groupings this pane lists.

A board is shared into a scope by its owner; the per-organization and per-team
**Shared Templates** switches in [Organizations](Organizations.md) and
[Teams](Teams.md) decide whether one group's templates reach its members, and this
pane is the instance-wide list of scopes to browse by.

## Read more

- [Template (word processing)](https://en.wikipedia.org/wiki/Template_(word_processing))
  on Wikipedia - the general idea of starting from a prepared document.
- [Templates](../../All-Boards/Templates.md)
- [Share template with](../../All-Boards/Share-Template-With.md) - sharing a
  template board by dragging it onto a group.
- [Organizations](Organizations.md), [Teams](Teams.md) and
  [Domains](Domains.md).

## How to use it

1. Open **Admin Panel**, **People**, **Shared templates**
   (`/admin/people/shared-templates`).
2. Tick **Organizations**, **Teams** and/or **Domains**. Each click saves at
   once, for the whole instance.
3. Under each ticked scope, the pane lists every group of that kind, the users
   in it and their template boards. Click a template board to open it.
4. With no scope ticked, the pane says "Select a scope above (Organizations,
   Teams or Domains) to show shared templates."; a scope with nothing in it
   says "No shared templates".

## How the numbers are calculated

There are no counts. What decides who appears:

- A user is listed only when their Templates board is not empty: it has at
  least one linked, non-archived template board card (in the Board Templates
  swimlane, when the user has one).
- A user's domains are the parts after the `@` of ALL their e-mail addresses,
  lower-cased, each once.
- The scopes are kept in a fixed order - Organizations, Teams, Domains - and
  unknown values are dropped
  ([models/lib/sharedTemplatesScopes.js](../../../../models/lib/sharedTemplatesScopes.js)).

## How it works in WeKan

- The choice is one instance setting, `sharedTemplatesScopes` of the
  `settings` document, so every browser of every user sees the same choice. It
  used to be stored in the admin's browser (`localStorage`); an install that
  never stored the setting takes over those earlier ticks once.
- The list comes from the `adminSharedTemplates` method in
  [server/models/users.js](../../../../server/models/users.js), which is
  site-admin only.
- The pane is `templatesGeneral` in
  [peopleBody.jade](../../../../client/components/settings/peopleBody.jade).
- Pinned by [tests/sharedTemplatesScopesSetting.test.cjs](../../../../tests/sharedTemplatesScopesSetting.test.cjs),
  [tests/sharedTemplateBoardPicker.test.cjs](../../../../tests/sharedTemplateBoardPicker.test.cjs)
  and the browser test
  [26-shared-templates.e2e.js](../../../../tests/playwright/specs/26-shared-templates.e2e.js).

## Commits

 - [The scopes are an instance setting, and the share targets appear](https://github.com/wekan/wekan/commit/c0339ccc592ceb3f14f5339db864b2e63004ca98)
 - [Organization, team and domain sharing work end to end](https://github.com/wekan/wekan/commit/422e70329f6575575a817750f2424e3896138245)
 - [Document template drag-to-share](https://github.com/wekan/wekan/commit/84678d3492b39f72b19128fe258d9e6f61cc893d)
 - [Remember the scope checkboxes](https://github.com/wekan/wekan/commit/fe89a9e9672dc2b8b0955f83deb49b4e59d05dd9)
 - [Add the Shared templates view grouped by Organization, Team and Domain](https://github.com/wekan/wekan/commit/fc9e8674d89ec5b045f2e2c1b14fade9e92baf0d)
