# Admin Panel / Problems / All webhooks

## What it is

A table of every webhook of this WeKan: the webhooks of every board and every
global webhook, which board each belongs to, which user added it, and what it
sends. The URL is `/admin/problems/webhooks`. It answers the questions an
administrator has before turning webhooks off, after an incident, or when a
board's data is being sent somewhere nobody remembers setting up: *which
webhooks are there, whose are they, and where do they send?*

Tokens are never shown, only whether one is set.

## Read more

- [Webhook](https://en.wikipedia.org/wiki/Webhook) on Wikipedia.
- [Data exfiltration](https://en.wikipedia.org/wiki/Data_exfiltration) on
  Wikipedia - why an administrator wants to know where data is sent.
- WeKan: [Turn off all webhooks](../Settings/Turn-Off-All-Webhooks.md),
  [Global Webhooks](../Settings/Global-Webhooks.md), the shared
  [table page](../../Table.md).

## How to use it

1. Sign in as a site administrator and open **Admin Panel → Problems →
   All webhooks** (below *Rules Report*).
2. Pick the filter above the table: **All webhooks** (the default), **On** or
   **Off** - whether each webhook's own *Disable This Webhook* is unticked or
   ticked.
3. Type part of a title, an address, a board title, a username or a full name
   in the search box and press Enter.
4. Click a board title to open the board, and its board menu's **Outgoing
   Webhooks** to change the webhook. A global webhook is changed in
   **Admin Panel / Settings / Global Webhooks**.

While [Turn off all webhooks](../Settings/Turn-Off-All-Webhooks.md) is on, the
table still lists every webhook - they are kept - and says above it that all
webhooks are turned off.

**The table.** One row per webhook, newest first.

| Column | What it shows |
| --- | --- |
| Board | The board's title, as a link to the board; **Global webhook** for a global webhook; the board id when the board no longer exists. |
| Owner | The username of the user who added the webhook, with the full name below it. |
| Webhook Name | Its title. |
| URL | Where it sends, with a password in the address and the value of a token-like query parameter shown as `***`. |
| Type | Outgoing Webhooks, Two-Way Webhooks or Bots, and *Mattermost* when it also sends direct messages. |
| Status | **On** or **Off**: the webhook's own *Disable This Webhook*. |
| Activities | *Every activity*, or the activities it is sent. |
| Authentication token | **Set** when it has a token; empty when not. The token itself is never sent to the browser. |
| Created at | When it was added. |

## How the numbers are calculated

- **25 rows a page** (`PER_PAGE` in
  [client/components/settings/webhooksReport.js](../../../../client/components/settings/webhooksReport.js));
  a request for more than **100** is cut to 100 (`REPORT_MAX_LIMIT` in
  [models/lib/webhooksSwitch.js](../../../../models/lib/webhooksSwitch.js)).
- **The total** is every webhook that matches the filter and the search.
- **On / Off**: Off is a webhook whose `enabled` is `false`; everything else is
  On, as delivery decides it.
- **The search** is plain text, never a pattern, at most 200 characters, and
  matches the title, the shown URL, the board title, the username and the full
  name, without regard to case.
- **Masked in the URL**: the password of `user:password@`, and the value of a
  query parameter whose name contains `token`, `key`, `secret`, `sig`,
  `signature`, `password`, `passwd`, `pass`, `auth`, `code` or `access`. A
  chat service that keeps its secret in the path (Slack, Mattermost, Teams)
  shows the whole path: only site administrators read this report, and they
  could already read every webhook's address.

## How it works in WeKan

The rows come from the Meteor method `webhooksReportPage`
([server/webhooksSwitch.js](../../../../server/webhooksSwitch.js)), which
answers only a site administrator (`not-authorized` for anybody else) and is
not a publication, so nothing of it reaches the browser's own copy of the
integrations. It reads the integrations with their token, and reduces each one
to a row in `webhookReportRow` (models/lib/webhooksSwitch.js): the token
becomes *set or not* there, on the server, before the answer is sent. The
board titles and owners are read for the matching webhooks only.

Every cell is text interpolation in
[webhooksReport.jade](../../../../client/components/settings/webhooksReport.jade),
so a webhook title or URL is shown as text and never as markup.

**Related files.**

| File | What it is |
| --- | --- |
| `models/lib/webhooksSwitch.js` | The row, the masking, the filter, the search and the bounds. |
| `server/webhooksSwitch.js` | `webhooksReportPage`. |
| `client/components/settings/webhooksReport.*` | This page. |
| `tests/webhooksSwitch.test.cjs` | Node tests: no token in a row, the masking, the bounds, the site-admin check. |
| `server/lib/tests/webhooksSwitch.tests.js` | Mocha test against the running server. |
| `tests/playwright/specs/webhooks-switch.e2e.js` | Browser test. |

## Commits

- [Admin Panel / Problems / All webhooks: every webhook, its board, owner and contents](https://github.com/wekan/wekan/commit/df16bc55de63cbd35bab15276e6259da9bf958eb)
- [Translations: Turn off all webhooks and the All webhooks report in every language](https://github.com/wekan/wekan/commit/cdf4da3d8d383d41835b371a8e9251fef1b6b99f)
