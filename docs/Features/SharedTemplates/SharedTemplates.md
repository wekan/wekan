# Shared Templates (Admin view)

The Admin Panel has a **Shared templates** view that lets an administrator browse
all users' shareable template boards, grouped by **Organization**, **Team** or
email **Domain**. This is feature request
[#3313](https://github.com/wekan/wekan/issues/3313).

## Background

Every user has a personal **Templates** board (a container board of type
`template-container`) with a **Board Templates** swimlane. Each board template a
user creates is a linked-board card (`cardType-linkedBoard`) in that swimlane that
points at the actual template board. See also [Templates](../Templates.md).

The Shared templates view collects, for every user whose Templates board is **not
empty**, those template boards and groups the users so admins can see which
templates exist across the organization.

## Web UI

1. Open **Admin Panel → People**.
2. In the side menu choose **Shared templates**.
3. Tick one or more **scope** checkboxes — **Organizations**, **Teams**,
   **Domains**. The checkboxes are **live view filters** and are **unchecked by
   default**, so nothing is shown until you pick a scope.
4. For each ticked scope the users are grouped:
   - **Organizations** — by each user's `orgs` (organization display name).
   - **Teams** — by each user's `teams` (team display name).
   - **Domains** — by the domain part of each user's verified email address.
5. Under each group, every listed user's shared template boards are shown as
   links that open the template board.

Only users whose Templates board contains at least one shared template board are
listed; users with an empty Templates board are excluded.

## How it works

An admin-only Meteor method, `adminSharedTemplates`, returns one row per
qualifying user with their `orgs`, `teams`, email `domains` and the list of their
shared template boards (resolved from the linked-board cards in the Board
Templates swimlane). The grouping by scope is done client-side, so toggling the
scope checkboxes re-groups the same data without re-querying.

The method requires the caller to be an administrator
(`Meteor.Error('not-authorized')` otherwise).

Covered by the e2e suite
[`tests/playwright/specs/26-shared-templates.e2e.js`](https://github.com/wekan/wekan/blob/main/tests/playwright/specs/26-shared-templates.e2e.js).
